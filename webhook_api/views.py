from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from .models import Conversation, Message
from .serializers import ConversationSerializer
from .event_handlers import EventFactory
import json

class ErrorHandlerMixin:
    """Mixin para tratamento centralizado de erros"""
    
    def handle_exception(self, exc):
        """Trata exceções e retorna respostas de erro formatadas"""
        if isinstance(exc, ValidationError):
            # Para erros de validação, usamos os detalhes fornecidos
            return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)
        
        # Para outros tipos de exceção, fornecemos uma mensagem genérica
        error_data = {
            'error': str(exc),
            'error_type': exc.__class__.__name__
        }
        return Response(error_data, status=status.HTTP_400_BAD_REQUEST)


class WebhookView(ErrorHandlerMixin, APIView):
    def post(self, request):
        try:
            # Verificar se o payload é um JSON válido
            if not request.data and request.body:
                try:
                    payload = json.loads(request.body)
                except json.JSONDecodeError:
                    raise ValidationError({
                        'error': 'Payload JSON inválido',
                        'received': request.body.decode('utf-8')[:100] + '...' if len(request.body) > 100 else request.body.decode('utf-8')
                    })
            else:
                payload = request.data
            
            # Validar se o payload é um dicionário
            if not isinstance(payload, dict):
                raise ValidationError({
                    'error': 'Payload deve ser um objeto JSON',
                    'received_type': type(payload).__name__
                })
            
            # Validar campos obrigatórios no payload
            required_fields = ['type', 'timestamp', 'data']
            missing_fields = []
            for field in required_fields:
                if field not in payload:
                    missing_fields.append(field)
            
            if missing_fields:
                raise ValidationError({
                    'error': 'Campos obrigatórios ausentes',
                    'missing_fields': missing_fields,
                    'received_fields': list(payload.keys())
                })
            
            # Validar tipos dos campos principais
            type_errors = []
            if not isinstance(payload.get('type'), str):
                type_errors.append({
                    'field': 'type',
                    'expected_type': 'string',
                    'received_type': type(payload.get('type')).__name__,
                    'value': payload.get('type')
                })
            
            if not isinstance(payload.get('timestamp'), str):
                type_errors.append({
                    'field': 'timestamp',
                    'expected_type': 'string',
                    'received_type': type(payload.get('timestamp')).__name__,
                    'value': payload.get('timestamp')
                })
            
            if not isinstance(payload.get('data'), dict):
                type_errors.append({
                    'field': 'data',
                    'expected_type': 'object',
                    'received_type': type(payload.get('data')).__name__,
                    'value': payload.get('data')
                })
            
            if type_errors:
                raise ValidationError({
                    'error': 'Tipos de dados inválidos',
                    'type_errors': type_errors
                })
            
            # Extrair dados do payload
            event_type = payload['type']
            timestamp = payload['timestamp']
            data = payload['data']
            
            # Criar e processar o evento
            event = EventFactory.create_event(event_type, data, timestamp)
            response_data, status_code = event.process()
            
            return Response(response_data, status=status_code)
            
        except json.JSONDecodeError:
            raise ValidationError({
                'error': 'Payload JSON inválido',
                'received': request.body.decode('utf-8')[:100] + '...' if len(request.body) > 100 else request.body.decode('utf-8')
            })


class ConversationDetailView(ErrorHandlerMixin, APIView):
    def get(self, request, conversation_id):
        conversation = get_object_or_404(Conversation, id=conversation_id)
        serializer = ConversationSerializer(conversation)
        return Response(serializer.data) 