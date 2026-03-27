from django.contrib.auth import authenticate
from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from django.utils import timezone
from django.db import transaction
from rest_framework.decorators import action
from rest_framework.response import Response
from core.paginators import CustomPaginator
from core.filters import TestFilter
from core.models import Quiz, Test, QuizQuestion, TestAnswer, QuizQuestionAnswer
import random


from core.serializers.test_serializers import(
    TestSerializer,
    CreateTestSerializer,
    AnswerTestSerializer
)


from core.utils import global_response_errors

from .documents import (
   list_test_document,
   create_test_document,
   start_test_document,
   submit_test_document,
   cancel_test_document,
   pending_test_document,
   result_test_document,
   answer_autosave_test_document,
)

class _BaseSetViewSet:
    def get_id(self, pk):
        if not pk or not pk.isdigit():
            return None, {
                "status": False,
                "message": "Invalid ID. ID must be an integer!",
            }
        return int(pk), None

    def get_test(self, pk):
        try:
            set = Test.objects.get(pk=pk)
            return set, None
        except Test.DoesNotExist:
            return None, {"status": False, "message": "Test does not exist!"}


class TestViewSet(viewsets.ViewSet, _BaseSetViewSet):

    @extend_schema(**list_test_document)
    def list(self, request):
        filter_params = request.GET.dict()
        queryset = Test.objects.all().select_related("user")\
            .prefetch_related("answers").order_by("id")

        tests = TestFilter(filter_params, queryset=queryset)

        paginator = CustomPaginator()
        page = paginator.paginate_queryset(tests.qs, request)
        serializer = TestSerializer(page, many = True)
        return paginator.get_paginated_response(serializer.data)


    @extend_schema(**create_test_document)
    def create(self, request):
        serializer = CreateTestSerializer(
            data=request.data,
            context={"user":request}
        )
        if serializer.is_valid():
            test = serializer.save()
            return Response(
                {
                    "status": True,
                    "data": TestSerializer(test).data,
                    "message": "Test created!"
                },
                status=status.HTTP_201_CREATED,
            )
        return global_response_errors(serializer.errors)


    @extend_schema(**start_test_document)
    @action(detail=True, methods=["post"], url_path="start")
    def start_test(self, request, pk=None):
        pk, error_response = self.get_id(pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        test, error_response = self.get_test(pk=pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        test.status = "in_progress"
        test.started_at = timezone.now()
        test.save()

        first_question = test.quiz.question.first()

        return Response(
            {
                "status": True,
                "data" : {
                    "started_at": test.started_at,
                    "current_question": first_question if first_question else None,
                    "remaining_time": 3600
                },
                "message": "Test started successfully!"
            },
            status=status.HTTP_200_OK,
        )


    @extend_schema(**cancel_test_document)
    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel_test(self, request, pk=None):
        pk, error_response = self.get_id(pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        test, error_response = self.get_test(pk=pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        test.status = "canceled"
        test.save()

        return Response(
            {
                "status": True,
                "message": "Test canceled successfully!"
            },
            status=status.HTTP_200_OK
        )


    @extend_schema(**pending_test_document)
    @action(detail=True, methods=["post"], url_path="pending")
    def pending_test(self, request, pk=None):
        pk, error_response = self.get_id(pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        test, error_response = self.get_test(pk=pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        test.status = "pending"
        test.save()

        return Response(
            {
                "status": True,
                "message": "Test change status pending successfully!",
            },
            status=status.HTTP_200_OK,
        )


    @extend_schema(**submit_test_document)
    @action(detail=True, methods=["post"], url_path="submit")
    def submit_test(self, request, pk=None):
        pk, error_response = self.get_id(pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        test, error_response = self.get_test(pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        quiz_questions = test.quiz.question.all().prefetch_related("answers")

        test_answers = {a.quiz_question_id: a for a in test.answers.all()}

        total = quiz_questions.count()
        correct_count = 0

        for q in quiz_questions:
            user_answer = test_answers.get(q.id)

            if not user_answer:
                continue

            if q.type == "text":
                correct_answers = q.answers.filter(is_correct=True)

                is_correct = False
                for ans in correct_answers:
                    if (
                        user_answer.text_answer
                        and user_answer.text_answer.strip().lower()
                        == ans.content.strip().lower()
                    ):
                        is_correct = True
                        break

                user_answer.is_correct = is_correct
                user_answer.save()

                if is_correct:
                    correct_count += 1


            elif q.type == "single":
                if (
                    user_answer.selected_answer
                    and user_answer.selected_answer.is_correct
                ):
                    user_answer.is_correct = True
                    correct_count += 1
                else:
                    user_answer.is_correct = False

                user_answer.save()


            elif q.type == "checkbox":
                correct_set = set(q.answers_filter(is_correct=True).value_list("id", flat=True))

                user_set = set(user_answer.selected_answers.value_list("id", flat=True))

                if correct_set == user_set:
                    user_answer.is_correct = True
                    correct_count += 1
                else:
                    user_answer.is_correct = False

                user_answer.save()

        score = (correct_count / total * 100) if total else 0

        test.score = score
        test.status = "submitted"
        test.submitted_at = timezone.now()

        if test.started_at:
            test.time_spent = int(
                (test.submitted_at - test.started_at).total_seconds()
            )

        time_spent = test.time_spent

        test.save()

        return Response(
            {
                "status": True,
                "data": {
                    "score": score,
                    "correct": correct_count,
                    "total": total,
                    "time spent": time_spent,
                },
                "message": "Submitted successfully!"
            },
            status=status.HTTP_200_OK
        )


    @extend_schema(**result_test_document)
    @action(detail=True, methods=["get"], url_path="results")
    def result_test(self, request, pk=None):
        pk, error_response = self.get_id(pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        test, error_response = self.get_test(pk=pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        answers = test.answers.all()

        return Response({
            "status": True,
            "data": {
                "score": test.score,
                "answers": [
                    {
                        "question": a.quiz_question_id,
                        "is_correct": a.is_correct
                    }
                    for a in answers
                ]
            },
            "message": "Get result successfully!"
            },
            status=status.HTTP_200_OK,
        )


    @extend_schema(**answer_autosave_test_document)
    @action(detail=True, methods=["post"], url_path="answers")
    def answer_auto_save(self, request, pk=None):
        pk, error_response = self.get_id(pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        test, error_response = self.get_test(pk=pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        if test.status == "submitted":
            return Response(
                {
                    "status": False,
                    "message": "Test already submitted!"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        quiz_question_id = request.query_params.get("quiz_question_id")

        if not quiz_question_id:
            return Response(
                {
                    "status": False,
                    "message": "Quiz_question_id is required!"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = AnswerTestSerializer(data=request.dat)
        if not serializer.is_valid():
            return global_response_errors(serializer.errors)

        data = serializer.validate_data

        try:
            question = QuizQuestion.objects.get(id=quiz_question_id)

        except QuizQuestion.DoesNotExist:
            return Response(
                {
                    "status": False,
                    "message": "Question not found!"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if question.quiz_id != test.quiz_id:
            return Response(
                {
                    "status": False,
                    "message": "Question not belong to this test!"
                },
                status=status.HTTP_400_BAD_REQUEST
            )


        test_answer, _ = TestAnswer.objects.get_or_create(
            test=test,
            quiz_question=question
        )


        if question.type == "single":
            answer_id = data.get("quiz_question_answer_id")

            if not answer_id:
                return Response(
                    {
                        "status": False,
                        "message": "Quiz question answer is required!"
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

            try:
                answer = QuizQuestionAnswer.objects.get(
                    id=answer_id,
                    question=question
                )
            except QuizQuestionAnswer.DoesNotExist:
                return Response(
                    {
                        "status": False,
                        "message": "Invalid answer!"
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

            test_answer.selected_answer = answer
            test_answer.selected_answers.clear()
            test_answer.text_answer = None


        elif question.type == "checkbox":
            answer_ids = data.get("answer_ids", [])

            answers = QuizQuestionAnswer.objects.filter(
                id__in=answer_ids,
                question=question
            )

            test_answer.selected_answers.set(answers)
            test_answer.selected_answer = None
            test_answer.text_answer = None


        elif question.type == "text":
            text = data.get("text")

            if not text:
                return Response(
                    {
                        "status": False,
                        "message": "Text answer is required!"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            test_answer.text_answer = text
            test_answer.selected_answer = None
            test_answer.selected_answers.clear()


        test.last_answered_at = timezone.now()

        test_answer.save()
        test.save()

        return Response(
            {
                "status": True,
                "data": {
                    "test_id": test.id,
                    "question_id": question.id,
                },
                "message": "Answer saved successfully!",
            },
            status=status.HTTP_200_OK
        )









