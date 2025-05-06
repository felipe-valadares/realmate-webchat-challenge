from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from rest_framework.exceptions import AuthenticationFailed
from .auth import AuthService
from django.urls import resolve

class JWTAuthenticationMiddleware(MiddlewareMixin):
    """
    Middleware que extrai o token do header Authorization e seta request.user.
    Rotas que não precisam de auth podem ser filtradas por nome/URL.
    """

    EXEMPT_URL_NAMES = [
        'register', 'login', 'webhook'
    ]

    def process_request(self, request):
        # Se a URL atual estiver na lista de isenções, não valida token
        resolver_match = resolve(request.path_info)
        if resolver_match.url_name in self.EXEMPT_URL_NAMES:
            return None

        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Token não fornecido.'}, status=401)

        token = auth_header.split(' ')[1]
        try:
            user = AuthService.decode_token(token)
            request.user = user
        except AuthenticationFailed as exc:
            return JsonResponse({'error': str(exc)}, status=401) 