from django.db import models
import uuid

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