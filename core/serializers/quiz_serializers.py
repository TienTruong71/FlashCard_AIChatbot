from rest_framework import serializers
from django.db import transaction
from core.models import Quiz, QuizQuestion, QuizQuestionAnswer, QuizShare
from core.constant import QuestionTypeEnum, PermissionEnum
from core.serializers.quiz_share_serializers import QuizShareSerializer


class QuizQuestionAnswerSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = QuizQuestionAnswer
        fields = [
            "id",
            "content",
            "is_correct",
        ]


class QuizQuestionSerializer(serializers.ModelSerializer):
    answers = QuizQuestionAnswerSerializer(many=True, read_only=True)
    class Meta:
        model = QuizQuestion
        fields = [
            "id",
            "title",
            "type",
            "answers",
        ]

class QuizSerializer(serializers.ModelSerializer):

    class Meta:
        model = Quiz
        fields = [
            "id",
            "title",
            "set",
            "user",
            "question_count",
            "is_published",
            "time_limit",
            "allow_resuming",
            "created_at",
        ]


class QuizDetailSerializer(serializers.ModelSerializer):

    questions = QuizQuestionSerializer(many=True, source="quiz_questions")
    permission = serializers.SerializerMethodField()
    set_title = serializers.ReadOnlyField(source='set.title')
    share_count = serializers.SerializerMethodField()
    shares = QuizShareSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = [
            "id",
            "title",
            "set",
            "set_title",
            "user",
            "question_count",
            "questions",
            "is_published",
            "time_limit",
            "allow_resuming",
            "permission",
            "share_count",
            "shares",
            "created_at",
        ]

    def get_permission(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        
        if obj.user == request.user:
            return "edit"
        
        share = QuizShare.objects.filter(quiz=obj, user=request.user).first()
        if share:
            return share.permission
        
        return None

    def get_share_count(self, obj):
        return QuizShare.objects.filter(quiz=obj).count()


class CreateQuizSerializer(serializers.ModelSerializer):
    title = serializers.CharField(
        required=True,
        max_length=255,
        error_messages={
            "required": "Please enter title!",
            "max_length": "Title cannot exceed 255 characters!",
        },
    )

    question_count = serializers.IntegerField(
        required=False,
        min_value=1,
        error_messages={
            "min_value": "Question count must be >=1",
        }
    )

    question_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True,
    )

    is_published = serializers.BooleanField(required=False, default=False)

    class Meta:
        model = Quiz
        fields = [
            "title",
            "question_count",
            "question_ids",
            "is_published",
        ]


class UpdateQuizSerializer(serializers.ModelSerializer):
    title = serializers.CharField(
        required=False,
        max_length=255,
        error_messages={
            "blank": "Title cannot be empty!",
            "max_length": "Title cannot exceed 255 characters!",
        },
    )
    
    is_published = serializers.BooleanField(required=False)
    time_limit = serializers.IntegerField(required=False, allow_null=True)
    allow_resuming = serializers.BooleanField(required=False)

    class Meta:
        model = Quiz
        fields = [
            "title",
            "is_published",
            "time_limit",
            "allow_resuming",
        ]


class QuizQuestionValidationMixin:
    def validate_question_data(self, data):

        instance = getattr(self, "instance", None)

        question_type = data.get("type")
        if not question_type and instance:
            question_type = instance.type

        answers = data.get("answers", [])

        if question_type == QuestionTypeEnum.SINGLE.value:
            if answers:
                correct_count = sum(1 for a in answers if a.get("is_correct"))

                if len(answers) < 2:
                    raise serializers.ValidationError("Single choice must have at least 2 answers!")

                if correct_count != 1:
                    raise serializers.ValidationError("Single choice must have exactly 1 correct answer!")


        elif question_type == QuestionTypeEnum.CHECKBOX.value:
            if answers:
                correct_count = sum(1 for a in answers if a.get("is_correct"))

                if len(answers) < 2:
                    raise serializers.ValidationError("Check box must have at least 2 answer!")

                if correct_count < 1:
                    raise serializers.ValidationError("Check box must have at least 1 correct answer!")


        elif question_type == QuestionTypeEnum.TEXT.value:
            if answers:
                correct_count = sum(1 for a in answers if a.get("is_correct"))

                if len(answers) != 1:
                    raise serializers.ValidationError("Text question must have exactly 1 answer!")

                if correct_count != 1:
                    raise serializers.ValidationError("Text question must have exactly 1 correct answer!")

        return data

class CreateQuizQuestionSerializer(QuizQuestionValidationMixin,serializers.ModelSerializer):
    answers = QuizQuestionAnswerSerializer(many=True)

    title = serializers.CharField(
        required=True,
        max_length=255,
        error_messages={
            "required": "please enter title!",
            "max_length": "Title cannot exceed 255 characters!",
        },
    )

    type = serializers.ChoiceField(
        required=True,
        choices=QuizQuestion.QUESTION_TYPE
    )

    class Meta:
        model = QuizQuestion
        fields = [
            "title",
            "type",
            "answers"
        ]

    def validate(self, data):
        return self.validate_question_data(data)

    def create(self, validated_data):
        with transaction.atomic():
            answers_data = validated_data.pop("answers")
            quiz_question = QuizQuestion.objects.create(**validated_data)

            for ans in answers_data:
                QuizQuestionAnswer.objects.create(quiz_question=quiz_question, **ans)

        return quiz_question


class UpdateQuizQuestionSerializer(QuizQuestionValidationMixin , serializers.ModelSerializer):
    answers = QuizQuestionAnswerSerializer(many=True)

    title = serializers.CharField(
        required=True,
        max_length=255,
        error_messages={
            "required": "Please enter title!",
            "max_length": "Title cannot exceed 255 characters!",
        },
    )

    type = serializers.ChoiceField(
        required=False,
        choices=QuizQuestion.QUESTION_TYPE,
    )

    class Meta:
        model = QuizQuestion
        fields =[
            "title",
            "type",
            "answers"
        ]

    def validate(self, data):
        return self.validate_question_data(data)


    def update(self, instance, validated_data):
        with transaction.atomic():
            answers_data = validated_data.pop("answers", None)

            old_type = instance.type

            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()

            if answers_data is not None:
                new_type = instance.type

                if old_type != new_type:
                    instance.answers.all().delete()

                    answers = []
                    for ans in answers_data:
                        ans.pop("id", None)
                        answers.append(QuizQuestionAnswer(quiz_question=instance, **ans))

                    QuizQuestionAnswer.objects.bulk_create(answers)

                else:
                    existing_answer = {a.id: a for a in instance.answers.all()}
                    incoming_ids = []

                    for ans in answers_data:
                        ans_id = ans.pop("id", None)

                        if ans_id and ans_id in existing_answer:
                            answer_obj = existing_answer[ans_id]

                            for attr, value in ans.items():
                                setattr(answer_obj, attr, value)

                            answer_obj.save()
                            incoming_ids.append(ans_id)

                        else:
                            new_answer = QuizQuestionAnswer.objects.create(
                                quiz_question=instance, **ans

                            )
                            incoming_ids.append(new_answer.id)

                    for ans_id, ans_obj in existing_answer.items():
                        if ans_id not in incoming_ids:
                            ans_obj.delete()

        return instance





