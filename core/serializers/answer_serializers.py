from rest_framework import serializers
from core.models import Answer

class AnswerSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = Answer
        fields = [
            "id",
            "content",
            "is_correct"
        ]
