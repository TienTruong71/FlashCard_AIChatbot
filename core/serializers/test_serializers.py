from rest_framework import serializers
from django.db import transaction
from core.models import Test, Quiz, TestAnswer, QuizQuestion
from core.serializers.quiz_serializers import QuizQuestionAnswerSerializer
from core.constant import TestStatusEnum, QuestionTypeEnum



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


class TestAnswerSerializer(serializers.ModelSerializer):
    answer_id = serializers.IntegerField(source='selected_answer_id', read_only=True)
    content = serializers.CharField(source='text_answer', read_only=True)

    class Meta:
        model = TestAnswer
        fields = ['id', 'quiz_question', 'answer_id', 'content', 'is_correct']


class TestRetrieveSerializer(TestSerializer):
    answers = TestAnswerSerializer(many=True, read_only=True)

    class Meta(TestSerializer.Meta):
        fields = TestSerializer.Meta.fields + ['answers']


class CreateTestSerializer(serializers.Serializer):

    quiz = serializers.IntegerField()
    def validate(self, data):
        user = self.context["user"].user
        quiz_id = data["quiz"]

        try:
            quiz = Quiz.objects.get(id=quiz_id)
        except Quiz.DoesNotExist:
            raise serializers.ValidationError("Quiz not found")
        if quiz.quiz_questions.count() == 0:
            raise serializers.ValidationError("Quiz has no questions")


        if Test.objects.filter(
            quiz=quiz,
            user=user,
            status=TestStatusEnum.PENDING.value
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
                status=TestStatusEnum.PENDING.value,
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


class QuizQuestionResultSerializer(serializers.ModelSerializer):
    answers = serializers.SerializerMethodField()

    class Meta:
        model = QuizQuestion
        fields = [
            "id",
            "title",
            "type",
            "answers",
        ]

    def get_answers(self, obj):
        test_id = self.context.get("test_id")
        user_answer = None
        if test_id:
            user_answer = TestAnswer.objects.filter(test_id=test_id, quiz_question=obj).first()

        selected_answer_id = user_answer.selected_answer_id if user_answer and user_answer.selected_answer_id else None

        selected_answers_ids = []
        if user_answer and user_answer.id:
             selected_answers_ids = list(user_answer.selected_answers.values_list('id', flat=True))

        text_answer = user_answer.text_answer if user_answer and user_answer.text_answer else None

        answers_data = QuizQuestionAnswerSerializer(obj.answers.all(), many=True).data

        for ans in answers_data:
            ans["text_answer"] = text_answer if obj.type == QuestionTypeEnum.TEXT.value else None

            if obj.type == QuestionTypeEnum.SINGLE.value:
                ans["selected_answer"] = (ans["id"] == selected_answer_id)
            elif obj.type == QuestionTypeEnum.CHECKBOX.value:
                ans["selected_answer"] = (ans["id"] in selected_answers_ids)
            elif obj.type == QuestionTypeEnum.TEXT.value:
                ans["selected_answer"] = False


        return answers_data


class TestDetailResultSerializer(serializers.ModelSerializer):  
    questions = serializers.SerializerMethodField()

    class Meta:
        model = Test
        fields = [
            "id",
            "status",
            "score",
            "time_spent",
            "started_at",
            "submitted_at",
            "questions",
        ]

    def get_questions(self, obj):
        quiz_questions = obj.quiz.quiz_questions.all()
        return QuizQuestionResultSerializer(
            quiz_questions,
            many=True,
            context={"test_id": obj.id}
        ).data
