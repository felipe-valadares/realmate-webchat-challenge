from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from .models import Conversation, Message, UserProfile
from .serializers import ConversationSerializer, UserSerializer, UserProfileSerializer
from .event_handlers import EventFactory
import json
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from uuid import uuid4
from .auth import AuthService, JWTAuthentication

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
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
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
            
            # Caso seja NEW_CONVERSATION, force o customer_id
            if payload['type'] == 'NEW_CONVERSATION':
                data['customer_id'] = request.token_user_id

            # Processar eventos de NEW_MESSAGE de forma assíncrona, apenas se conversa aberta
            if event_type == 'NEW_MESSAGE':
                # Verificar se a conversa existe
                conversation_id = data.get('conversation_id')
                try:
                    convo = Conversation.objects.get(id=conversation_id)
                except Conversation.DoesNotExist:
                    return Response({
                        'error': 'Conversa não encontrada',
                        'conversation_id': conversation_id
                    }, status=status.HTTP_400_BAD_REQUEST)
                # Somente aceitar se estiver aberta
                if convo.status == Conversation.CLOSED:
                    return Response({
                        'error': 'Não é possível adicionar mensagens a uma conversa fechada',
                        'conversation_id': conversation_id,
                        'conversation_status': convo.status
                    }, status=status.HTTP_400_BAD_REQUEST)
                # Agendar processamento com Celery
                from .tasks import handle_new_message_event
                handle_new_message_event.delay(data, timestamp, request.user.id)
                return Response({'status': 'Mensagem recebida'}, status=status.HTTP_202_ACCEPTED)
            # Para outros eventos, processar sincronicamente
            event = EventFactory.create_event(event_type, data, timestamp, request.user)
            response_data, status_code = event.process()
            return Response(response_data, status=status_code)
            
        except json.JSONDecodeError:
            raise ValidationError({
                'error': 'Payload JSON inválido',
                'received': request.body.decode('utf-8')[:100] + '...' if len(request.body) > 100 else request.body.decode('utf-8')
            })


class RegisterView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            username   = request.data.get('username')
            password   = request.data.get('password')
            email      = request.data.get('email')
            first_name = request.data.get('first_name', '')
            last_name  = request.data.get('last_name', '')
            is_agent   = request.data.get('is_agent', False)
            
            # Validação de campos obrigatórios
            missing = [f for f in ['username', 'password', 'email'] if not request.data.get(f)]
            if missing:
                return Response({
                    'error': 'Campos obrigatórios ausentes',
                    'missing_fields': missing
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if User.objects.filter(username=username).exists():
                return Response({
                    'error': 'Nome de usuário já existe'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user = User.objects.create_user(
                username   = username,
                email      = email,
                password   = password,
                first_name = first_name,
                last_name  = last_name
            )
            
            profile = UserProfile.objects.create(
                user     = user,
                is_agent = is_agent
            )
            
            token = AuthService.generate_token(user)
            
            return Response({
                'user'    : UserSerializer(user).data,
                'profile' : UserProfileSerializer(profile).data,
                'token'   : token
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        # Validação de campos obrigatórios
        missing = [f for f in ['username', 'password'] if not request.data.get(f)]
        if missing:
            return Response({
                'error': 'Credenciais incompletas',
                'missing_fields': missing
            }, status=status.HTTP_400_BAD_REQUEST)
        username = request.data.get('username')
        password = request.data.get('password')
        
        user = authenticate(username=username, password=password)
        
        if not user:
            return Response({
                'error': 'Credenciais inválidas'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Gera o JWT
        token = AuthService.generate_token(user)
        return Response({
            'user': UserSerializer(user).data,
            'profile': UserProfileSerializer(user.profile).data,
            'token': token
        })

class UserConversationsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        # Serializar cada conversa incluindo apenas mensagens INBOUND
        conversations = Conversation.objects.filter(customer_id=user.id)
        user_data = UserSerializer(user).data
        result = []
        for conv in conversations:
            conv_data = ConversationSerializer(conv).data
            # Filtrar mensagens INBOUND
            inbound_msgs = [m for m in conv_data.get('messages', []) if m.get('type') == 'INBOUND']
            # Preencher author com base no token (usuário autenticado)
            for msg in inbound_msgs:
                msg['author'] = user_data
            conv_data['messages'] = inbound_msgs
            result.append(conv_data)
        return Response(result)

class ConversationDetailView(ErrorHandlerMixin, APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request, conversation_id):
        conversation = get_object_or_404(Conversation, id=conversation_id)
        
        # Verificar se o usuário tem acesso à conversa
        user = request.user
        if not (conversation.customer == user or conversation.agent == user or user.is_staff):
            return Response({
                'error': 'Acesso negado a esta conversa'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = ConversationSerializer(conversation)
        return Response(serializer.data)

class AssignAgentView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def post(self, request, conversation_id):
        try:
            conversation = get_object_or_404(Conversation, id=conversation_id)
            # Validação de campos obrigatórios
            missing = []
            if 'agent_id' not in request.data:
                missing.append('agent_id')
            if missing:
                return Response({
                    'error': 'Campos obrigatórios ausentes',
                    'missing_fields': missing
                }, status=status.HTTP_400_BAD_REQUEST)
            agent_id = request.data.get('agent_id')
            
            # Verificar se o agente existe e é um agente
            try:
                agent = User.objects.get(id=agent_id)
                if not hasattr(agent, 'profile') or not agent.profile.is_agent:
                    return Response({
                        'error': 'Usuário não é um agente'
                    }, status=status.HTTP_400_BAD_REQUEST)
            except User.DoesNotExist:
                return Response({
                    'error': 'Agente não encontrado'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Atribuir agente à conversa
            conversation.agent = agent
            conversation.save()
            
            return Response({
                'status': 'Agente atribuído com sucesso',
                'conversation_id': str(conversation.id),
                'agent_id': agent.id
            })
            
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST) 