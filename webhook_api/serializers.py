from rest_framework import serializers
from .models import Conversation, Message, UserProfile
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['user', 'is_agent']

class MessageSerializer(serializers.ModelSerializer):
    type = serializers.CharField(source='direction')
    author = UserSerializer(read_only=True)
    class Meta:
        model = Message
        fields = ['id', 'type', 'content', 'timestamp', 'author']

class ConversationSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    customer = UserSerializer(read_only=True)
    agent = UserSerializer(read_only=True)
    
    class Meta:
        model = Conversation
        fields = ['id', 'status', 'customer', 'agent', 'messages', 'created_at', 'updated_at'] 