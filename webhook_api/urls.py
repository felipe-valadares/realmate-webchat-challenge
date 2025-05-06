from django.urls import path
from .views import (
    WebhookView, ConversationDetailView, 
    RegisterView, LoginView, UserConversationsView,
    AssignAgentView
)

urlpatterns = [
    path('webhook/', WebhookView.as_view(), name='webhook'),
    path('conversations/<uuid:conversation_id>/', ConversationDetailView.as_view(), name='conversation-detail'),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('my-conversations/', UserConversationsView.as_view(), name='user-conversations'),
    path('conversations/<uuid:conversation_id>/assign-agent/', AssignAgentView.as_view(), name='assign-agent'),
] 