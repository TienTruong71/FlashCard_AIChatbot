from rest_framework import serializers
from core.models import Question, Answer
from core.serializers.answer_serializers import AnswerSerializer
from core.constant import QuestionTypeEnum

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


class QuestionValidationMixin:
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


class CreateQuestionSerializer(QuestionValidationMixin, serializers.ModelSerializer):
    answers = AnswerSerializer(many=True)

    title = serializers.CharField(
        required=True,
        max_length=255,
        error_messages={
            "required" :"Please enter title!",
            "max_length": "Title cannot exceed 255 characters!",
        },
    )

    type = serializers.ChoiceField(
        choices=Question.QUESTION_TYPE,
        required=True
    )

    class Meta:
        model = Question
        fields = [
            "title",
            "type",
            "answers"
        ]

    def validate(self, data):
        return self.validate_question_data(data)

        
    def create(self, validated_data):
        answers_data = validated_data.pop("answers", [])
        question = Question.objects.create(**validated_data)

        for ans in answers_data:
            Answer.objects.create(question=question, **ans)

        return question


class UpdateQuestionSerializer(QuestionValidationMixin, serializers.ModelSerializer):
    answers = AnswerSerializer(many=True)

    title = serializers.CharField(
        required=True,
        max_length=255,
        error_messages={
            "required": "Please enter title!",
            "max_length": "Title cannot exceed 255 characters!",
        },
    )

    type = serializers.ChoiceField(
        choices=Question.QUESTION_TYPE,
        required=False
    )

    class Meta:
        model = Question
        fields = [
            "title",
            "type",
            "answers"
        ]

    def validate(self, data):
        return self.validate_question_data(data)


    def update(self, instance, validated_data):

        answers_data = validated_data.pop("answers", None)

        old_type =  instance.type

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
                    answers.append(Answer(question=instance, **ans))
                
                Answer.objects.bulk_create(answers)

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
                        new_answer = Answer.objects.create(
                            question = instance, **ans
                        )
                        incoming_ids.append(new_answer.id)

                for ans_id, ans_obj in existing_answer.items():
                    if ans_id not in incoming_ids:
                        ans_obj.delete()

        return instance


