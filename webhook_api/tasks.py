import uuid
from datetime import datetime
from celery import shared_task
import redis
from django.conf import settings
from .event_handlers import NewMessageEvent
from .models import Message, Conversation
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.contrib.auth.models import User

# Conexão com Redis usando broker URL
redis_client = redis.Redis.from_url(settings.CELERY_BROKER_URL)

@shared_task
def handle_new_message_event(data, timestamp, user_id):
    """Processa evento de nova mensagem e adiciona ao buffer de agrupamento"""
    # 1. Persistir mensagem INBOUND com autor correto
    user = User.objects.get(id=user_id)
    event = NewMessageEvent(data, timestamp)
    event.request_user = user
    # Chama process para validar e criar mensagem
    event.process()
    # Notificar frontend via WebSocket que a mensagem INBOUND foi processada
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"conversation_{data['conversation_id']}",
        {
            'type': 'new_message',
            'message': {
                'id': data['id'],
                'type': Message.INBOUND,
                'content': data['content'],
                'timestamp': event.event_time.isoformat(),
                'author': user.id
            }
        }
    )
    # 2. Adicionar ao buffer em Redis
    conversation_id = data['conversation_id']
    message_id = data['id']
    event_time = event.event_time
    key = f"inbound:{conversation_id}"
    redis_client.zadd(key, {message_id: event_time.timestamp()})
    # 3. Agendar task de agrupamento após 5 segundos
    schedule_grouping_task.apply_async(args=[conversation_id], countdown=5)

@shared_task
def schedule_grouping_task(conversation_id):
    """Verifica buffer e processa agrupamento de mensagens"""
    key = f"inbound:{conversation_id}"
    entries = redis_client.zrange(key, 0, -1, withscores=True)
    if not entries:
        return
    # Encontrar timestamp máximo
    max_score = max(score for _, score in entries)
    now = datetime.utcnow().timestamp()
    window_end = max_score + 5
    # Se ainda estiver dentro da janela, reagenda
    if now < window_end:
        delay = window_end - now
        schedule_grouping_task.apply_async(args=[conversation_id], countdown=delay)
        return
    # Fora da janela, processar agrupamento
    message_ids = [mid.decode() if isinstance(mid, bytes) else mid for mid, _ in entries]
    content = "Mensagens recebidas:\n" + "\n".join(message_ids)
    # Criar mensagem OUTBOUND com author garantido (agente ou cliente)
    conversation = Conversation.objects.get(id=conversation_id)
    author = conversation.agent or conversation.customer
    outbound_message = Message.objects.create(
        id=uuid.uuid4(),
        conversation=conversation,
        direction=Message.OUTBOUND,
        content=content,
        timestamp=datetime.utcnow(),
        author=author
    )
    conversation.updated_at = outbound_message.timestamp
    conversation.save()
    # Limpar buffer
    redis_client.delete(key)

    channel_layer = get_channel_layer()
    # Enviar evento WebSocket com payload incluindo author se disponível
    async_to_sync(channel_layer.group_send)(
        f"conversation_{conversation_id}",
        {
            'type': 'new_message',
            'message': {
                'id': str(outbound_message.id),
                'type': outbound_message.direction,  # 'INBOUND' ou 'OUTBOUND'
                'content': outbound_message.content,
                'timestamp': outbound_message.timestamp.isoformat(),
                'author': author.id
            }
        }
    ) 