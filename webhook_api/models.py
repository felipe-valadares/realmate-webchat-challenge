from django.db import models
import uuid
from django.contrib.auth.models import User

class UserProfile(models.Model):
    """Perfil estendido de usuário"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    is_agent = models.BooleanField(default=False)  # Indica se é um atendente
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Perfil de {self.user.username}"

class Conversation(models.Model):
    OPEN = 'OPEN'
    CLOSED = 'CLOSED'
    
    STATUS_CHOICES = [
        (OPEN, 'Open'),
        (CLOSED, 'Closed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=OPEN)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Relacionamentos com usuários
    customer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='customer_conversations')
    agent = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='agent_conversations')
    
    def __str__(self):
        return f"Conversa {self.id} - {self.status}"

class Message(models.Model):
    SENT = 'SENT'
    RECEIVED = 'RECEIVED'
    
    DIRECTION_CHOICES = [
        (SENT, 'Sent'),
        (RECEIVED, 'Received'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    direction = models.CharField(max_length=10, choices=DIRECTION_CHOICES)
    content = models.TextField()
    timestamp = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Mensagem {self.id} - {self.direction}" 