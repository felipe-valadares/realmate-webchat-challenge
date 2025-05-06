import jwt
from datetime import datetime, timedelta
from django.conf import settings
from django.contrib.auth.models import User
from rest_framework.exceptions import AuthenticationFailed
from rest_framework import authentication, exceptions

class AuthService:
    """
    Serviço centralizado para geração e validação de JWT.
    """

    @staticmethod
    def generate_token(user: User) -> str:
        """
        Gera um token JWT com payload básico (user_id, iat, exp).
        """
        payload = {
            'user_id': str(user.id),
            'iat': datetime.utcnow(),
            'exp': datetime.utcnow() + timedelta(hours=24)
        }
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
        return token

    @staticmethod
    def decode_payload(token: str) -> dict:
        """
        Decodifica o JWT apenas para obter o payload.
        """
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expirado.')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Token inválido.')

    @staticmethod
    def decode_token(token: str) -> User:
        """
        Decodifica o JWT e retorna o objeto User.
        """
        payload = AuthService.decode_payload(token)
        try:
            user = User.objects.get(id=payload['user_id'])
            return user
        except User.DoesNotExist:
            raise AuthenticationFailed('Usuário não encontrado.')

class JWTAuthentication(authentication.BaseAuthentication):
    """
    Autenticação DRF via JWT no header 'Authorization: Bearer <token>'.
    """
    keyword = 'Bearer'

    def authenticate(self, request):
        auth = authentication.get_authorization_header(request).split()

        if not auth or auth[0].decode().lower() != self.keyword.lower():
            return None  # não é Bearer, passa adiante

        if len(auth) != 2:
            raise exceptions.AuthenticationFailed('Header Authorization inválido.')

        token = auth[1].decode()

        # decodifica payload e usuário
        payload = AuthService.decode_payload(token)
        try:
            user = User.objects.get(id=payload['user_id'])
        except User.DoesNotExist:
            raise exceptions.AuthenticationFailed('Usuário não encontrado.')

        # guarda o id extraído do token na própria requisição
        request.token_user_id = payload['user_id']

        return (user, None) 