"""
ASGI config for realmate_challenge project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import webhook_api.routing as routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'realmate_challenge.settings')

# Aplicação HTTP padrão
django_asgi_app = get_asgi_application()

# Protocolo WebSocket via Channels
application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': AuthMiddlewareStack(
        URLRouter(
            routing.websocket_urlpatterns
        )
    ),
})
