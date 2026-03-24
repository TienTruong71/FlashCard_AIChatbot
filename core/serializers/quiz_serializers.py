from rest_framework import serializers
from core.models import Quiz


class QuizSerializer(serializers.ModelSerializer):

    class Meta:
        model = Quiz
        fields = [
            "id",
            "title",
            "set",
            "question_count",
            "is_published",
            "created_at",
        ]

class CreateQuizSerializer(serializers.ModelSerializer):
    title = serializers.CharField(
        required=True,
        error_messages={
            "required": "Please enter title!",
        },
    )

    class Meta:
        model = Quiz
        fields = [
            "title",
        ]


class UpdateQuizSerializer(serializers.ModelSerializer):
    title = serializers.CharField(
        required=False,
        error_messages={
            "blank": "Title cannot be empty!"
        },
    )

    class Meta:
        model = Quiz
        fields = [
            "title",
        ]


