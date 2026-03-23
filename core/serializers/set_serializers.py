from rest_framework import serializers
from core.serializers.question_serializers import QuestionSerializer
from core.models import Set


class SetSerializer(serializers.ModelSerializer):

    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Set
        fields = [
            "id",
            "title",
            "description",
            "is_public",
            "questions",
            "created_at"
        ]


class CreateSetSerializer(serializers.ModelSerializer):

    title = serializers.CharField(
        required=True,
        error_messages={
            "required": "Please enter title!",
        },
    )

    description = serializers.CharField(
        required=False,
        allow_blank=True,
    )

    class Meta:
        model = Set
        fields =[
            "title",
            "description",
        ]


class UpdateSetSerializer(serializers.ModelSerializer):

    title = serializers.CharField(
        required=False,
        error_messages={
            "invalid": "Enter a valid title!",
            "blank" : "Title cannot be empty!",
        },
    )

    description = serializers.CharField(
        required=False,
        error_messages={
            "invalid": "Enter a valid description!",
            "blank": "description cannot be empty!",
        },
    )

    class Meta:
        model = Set
        fields = [
            "title",
            "description",
        ]


