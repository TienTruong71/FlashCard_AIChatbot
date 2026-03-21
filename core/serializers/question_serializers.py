from rest_framework import serializers
from core.models import Question
from core.serializers.answer_serializers import AnswerSerializer

class QuestionSerializer(serializers.ModelSerializer):
    answers = AnswerSerializer(many=True, read_only=True)
    class Meta:
        model = Question
        fields = [
            "id",
            "title",
            "type",
            "answers",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.type == "text":
            data.pop("answers", None)

        return data

