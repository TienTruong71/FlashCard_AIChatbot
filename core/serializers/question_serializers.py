from rest_framework import serializers
from core.models import Question, Answer
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

class CreateQuestionSerializer(serializers.ModelSerializer):
    answers = AnswerSerializer(many=True)

    title = serializers.CharField(
        required=True,
        error_message={
            "required" :"Please enter title!"
        },
    )

    type = serializers.ChoiceField(
        choices=Question.QUESTION_TYPE,
        required=True
    )

    class Meta:
        model = Question,
        fields = [
            "title",
            "type",
            "answers"
        ]

    def create(self, validated_data):
        answers_data = validated_data.pop("answers")
        question = Question.objects.create(**validated_data)

        for ans in answers_data:
            Answer.objects.create(question=question, **ans)

        return question


class UpdateQuestionSerializer(serializers.ModelSerializer):
    answer = AnswerSerializer(many=True, )

    title = serializers.CharFields(
        required=True,
        error_message={
            "required": "Please enter title!"
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

    def validate_data(self, data):

        question_type = data.get("type", self.instance.type)

        answers = data.get("answers")

        if question_type == "single":
            if answers:
                correct_count = sum(
                    1 for a in answers if a.get("is_correct")
                )
                if correct_count != 1:
                    raise serializers.ValidationError("Single choice must have exactly 1 correct answer!")

        elif question_type == "checkbox":
            if answers:
                correct_count = sum(
                    1 for a in answers if a.get("is_correct")
                )
                if correct_count < 1:
                    raise serializers.ValidationError("Check box must have least 1 correct answer!")

        elif question_type == "text":
            if answers:
                raise serializers.ValidationError("Text question should not have answers !")

        return data


    def update(self, instance, validated_data):

        answers_data = validated_data.pop("answers", None)

        old_type =  instance.type

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if answers_data is not None:
            new_type = instance.type

            if old_type != new_type:
                instance.answers.all.delete()

                if new_type != "text":
                    answers = [
                        Answer(question=instance, **ans)
                        for ans in answers_data
                    ]
                    Answer.objects.bulk_create(answers)

            else:
                existing_answer = {a.id: a for a in instance.answers.all()}
                incoming_ids = []

                for ans in answers_data:
                    ans_id = ans.get("id")

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


