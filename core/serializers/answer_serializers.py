from rest_framework import serializers
from core.models import Answer

class AnswerSerializer(serializers.ModelSerializer):

    class Meta:
        model = Answer
        fields = [
            "id",
            "content",
            "is_correct"
        ]
