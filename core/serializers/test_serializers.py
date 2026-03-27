from rest_framework import serializers
from django.db import transaction
from core.models import Test, Quiz



class TestSerializer(serializers.ModelSerializer):

    class Meta:
        model = Test
        fields = [
            "id",
            "status",
            "quiz",
            "user",
            "score",
            "time_spent",
            "started_at",
            "last_answered_at",
            "submitted_at",
        ]

class CreateTestSerializer(serializers.Serializer):

    quiz = serializers.IntegerField()
    def validate(self, data):
        user = self.context["user"].user
        quiz_id = data["quiz"]

        try:
            quiz = Quiz.objects.get(id=quiz_id)
        except Quiz.DoesNotExist:
            raise serializers.ValidationError("Quiz not found")

        if Test.objects.filter(
            quiz=quiz,
            user=user,
            status="pending"
        ).exists():
            raise serializers.ValidationError("Test already exists")

        data["quiz_obj"] = quiz
        return data


    def create(self, validated_data):
        with transaction.atomic():
            user = self.context["user"].user
            quiz = validated_data["quiz_obj"]

            test = Test.objects.create(
                quiz=quiz,
                user=user,
                status="pending",
            )

            return test


class AnswerTestSerializer(serializers.Serializer):
    quiz_question_answer_id = serializers.IntegerField(required=False)
    answer_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False
    )
    text = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        if not any([
            data.get("quiz_question_answer_id"),
            data.get("answer_ids"),
            data.get("text"),
        ]):
            raise serializers.ValidationError("Must provide answer_id, answer_ids or text")

        return data

