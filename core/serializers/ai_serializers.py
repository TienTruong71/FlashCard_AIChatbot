from rest_framework import serializers
from core.models import AIChatConversation, AIChatMessage

class AIChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIChatMessage
        fields = ["id", "role", "content", "created"]

class AIChatConversationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIChatConversation
        fields = ["id", "title", "quiz", "created"]
