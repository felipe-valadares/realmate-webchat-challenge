from datetime import datetime
from .models import Conversation, Message
from rest_framework import status
from rest_framework.exceptions import ValidationError
import uuid
from django.contrib.auth.models import User

class WebhookEvent:
    """Classe base para todos os eventos de webhook"""
    
    required_fields = ['id']
    field_types = {
        'id': str
    }
    
    def __init__(self, data, timestamp):
        self.data = data
        self.timestamp = timestamp
        try:
            self.event_time = datetime.fromisoformat(timestamp)
        except ValueError:
            raise ValidationError({
                'error': 'Formato de timestamp inválido',
                'received': timestamp,
                'expected': 'ISO 8601 (YYYY-MM-DDThh:mm:ss.ssssss)'
            })
        self.validate_data()
    
    def validate_data(self):
        """Valida se todos os campos obrigatórios estão presentes e com tipos corretos"""
        # Verificar campos obrigatórios
        missing_fields = []
        for field in self.required_fields:
            if field not in self.data or self.data[field] is None:
                missing_fields.append(field)
        
        if missing_fields:
            raise ValidationError({
                'error': 'Campos obrigatórios ausentes',
                'missing_fields': missing_fields,
                'received_data': self.data
            })
        
        # Verificar tipos de dados
        type_errors = []
        for field, expected_type in self.field_types.items():
            if field in self.data and self.data[field] is not None:
                # Tratamento especial para UUID
                if expected_type == uuid.UUID:
                    try:
                        uuid.UUID(str(self.data[field]))
                    except ValueError:
                        type_errors.append({
                            'field': field,
                            'expected_type': 'UUID',
                            'received_type': type(self.data[field]).__name__,
                            'value': self.data[field]
                        })
                # Verificação normal de tipo
                elif not isinstance(self.data[field], expected_type):
                    type_errors.append({
                        'field': field,
                        'expected_type': expected_type.__name__,
                        'received_type': type(self.data[field]).__name__,
                        'value': self.data[field]
                    })
        
        if type_errors:
            raise ValidationError({
                'error': 'Tipos de dados inválidos',
                'type_errors': type_errors
            })
    
    def process(self):
        """Método a ser implementado pelas subclasses"""
        raise NotImplementedError("Subclasses devem implementar este método")


class NewConversationEvent(WebhookEvent):
    """Processa eventos de nova conversa"""
    
    required_fields = ['id']
    field_types = {
        'id': str  # Esperamos que o ID seja uma string (UUID)
    }
    
    def process(self):
        conversation_id = self.data['id']
        provided_customer_id = self.data.get('customer_id')
        
        # Verificar se é um UUID válido
        try:
            uuid_obj = uuid.UUID(conversation_id)
        except ValueError:
            raise ValidationError({
                'error': 'ID da conversa inválido',
                'received': conversation_id,
                'expected': 'UUID válido'
            })
        
        # Verificar se a conversa já existe
        if Conversation.objects.filter(id=conversation_id).exists():
            raise ValidationError({
                'error': 'Conversa já existe',
                'conversation_id': conversation_id
            })
        
        # 1) tenta usar o customer_id do payload
        customer = None
        if provided_customer_id:
            try:
                customer = User.objects.get(id=provided_customer_id)
            except User.DoesNotExist:
                customer = None

        # 2) se não veio customer_id, usa o usuário autenticado
        if not customer and hasattr(self, 'request_user') and \
           self.request_user and not self.request_user.is_anonymous:
            customer = self.request_user
        
        # Criar nova conversa
        conversation = Conversation.objects.create(
            id=conversation_id,
            customer=customer
        )
        
        return {
            'status': 'Conversa criada com sucesso',
            'conversation_id': str(conversation.id),
            'customer_id': customer.id if customer else None
        }, status.HTTP_201_CREATED


class NewMessageEvent(WebhookEvent):
    """Processa eventos de nova mensagem"""
    
    required_fields = ['id', 'direction', 'content', 'conversation_id']
    field_types = {
        'id': str,  # UUID como string
        'direction': str,
        'content': str,
        'conversation_id': str  # UUID como string
    }
    
    def validate_data(self):
        super().validate_data()
        
        # Validar o tipo de direção
        valid_directions = [Message.SENT, Message.RECEIVED]
        if self.data['direction'] not in valid_directions:
            raise ValidationError({
                'error': 'Direção da mensagem inválida',
                'received': self.data['direction'],
                'expected': valid_directions
            })

        # Validar UUIDs
        for field in ['id', 'conversation_id']:
            try:
                uuid.UUID(str(self.data[field]))
            except ValueError:
                raise ValidationError({
                    'error': f'Campo {field} deve ser um UUID válido',
                    'received': self.data[field],
                    'expected': 'UUID válido'
                })
    
    def process(self):
        message_id = self.data['id']
        direction = self.data['direction']
        content = self.data['content']
        conversation_id = self.data['conversation_id']
        
        # Verificar se a mensagem já existe
        if Message.objects.filter(id=message_id).exists():
            raise ValidationError({
                'error': 'Mensagem já existe',
                'message_id': message_id
            })
        
        # Verificar se a conversa existe
        try:
            conversation = Conversation.objects.get(id=conversation_id)
        except Conversation.DoesNotExist:
            raise ValidationError({
                'error': 'Conversa não encontrada',
                'conversation_id': conversation_id
            })
        
        # Verificar se a conversa está aberta
        if conversation.status == Conversation.CLOSED:
            raise ValidationError({
                'error': 'Não é possível adicionar mensagens a uma conversa fechada',
                'conversation_id': conversation_id,
                'conversation_status': conversation.status
            })
        
        # Criar nova mensagem
        message = Message.objects.create(
            id=message_id,
            conversation=conversation,
            direction=direction,
            content=content,
            timestamp=self.event_time
        )
        
        conversation.updated_at = self.event_time
        conversation.save()
        
        return {
            'status': 'Mensagem adicionada com sucesso',
            'message_id': str(message.id),
            'conversation_id': str(conversation.id)
        }, status.HTTP_201_CREATED


class CloseConversationEvent(WebhookEvent):
    """Processa eventos de fechamento de conversa"""
    
    required_fields = ['id']
    field_types = {
        'id': str  # UUID como string
    }
    
    def validate_data(self):
        super().validate_data()
        
        # Validar UUID
        try:
            uuid.UUID(str(self.data['id']))
        except ValueError:
            raise ValidationError({
                'error': 'ID da conversa deve ser um UUID válido',
                'received': self.data['id'],
                'expected': 'UUID válido'
            })
    
    def process(self):
        conversation_id = self.data['id']
        
        # Verificar se a conversa existe
        try:
            conversation = Conversation.objects.get(id=conversation_id)
        except Conversation.DoesNotExist:
            raise ValidationError({
                'error': 'Conversa não encontrada',
                'conversation_id': conversation_id
            })
        
        # Verificar se a conversa já está fechada
        if conversation.status == Conversation.CLOSED:
            raise ValidationError({
                'error': 'Conversa já está fechada',
                'conversation_id': conversation_id
            })
        
        # Fechar a conversa
        conversation.status = Conversation.CLOSED
        conversation.save()
        
        return {
            'status': 'Conversa fechada com sucesso',
            'conversation_id': str(conversation.id)
        }, status.HTTP_200_OK


class EventFactory:
    """Fábrica para criar instâncias de eventos com base no tipo"""
    
    @staticmethod
    def create_event(event_type, data, timestamp, request_user=None):
        if not isinstance(event_type, str):
            raise ValidationError({
                'error': 'Tipo de evento deve ser uma string',
                'received_type': type(event_type).__name__,
                'received_value': event_type
            })
            
        if not isinstance(data, dict):
            raise ValidationError({
                'error': 'Dados do evento devem ser um objeto',
                'received_type': type(data).__name__
            })
            
        if not isinstance(timestamp, str):
            raise ValidationError({
                'error': 'Timestamp deve ser uma string',
                'received_type': type(timestamp).__name__,
                'received_value': timestamp
            })
        
        event_map = {
            'NEW_CONVERSATION': NewConversationEvent,
            'NEW_MESSAGE': NewMessageEvent,
            'CLOSE_CONVERSATION': CloseConversationEvent
        }
        
        if event_type not in event_map:
            raise ValidationError({
                'error': 'Tipo de evento desconhecido',
                'received': event_type,
                'expected': list(event_map.keys())
            })
        
        # instancia e injeta o usuário autenticado
        event = event_map[event_type](data, timestamp)
        setattr(event, 'request_user', request_user)
        return event 