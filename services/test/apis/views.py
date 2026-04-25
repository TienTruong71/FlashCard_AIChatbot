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
from core.constant import QuestionTypeEnum, TestStatusEnum


from core.serializers.test_serializers import(
    TestSerializer,
    CreateTestSerializer,
    AnswerTestSerializer,
    TestDetailResultSerializer,
    TestRetrieveSerializer,
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
            test_obj = Test.objects.get(pk=pk)
            return test_obj, None
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


    def retrieve(self, request, pk=None):
        pk, error_response = self.get_id(pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        test, error_response = self.get_test(pk=pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        serializer = TestRetrieveSerializer(test)
        return Response(
            {
                "status": True,
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


    @extend_schema(**start_test_document)
    @action(detail=True, methods=["post"], url_path="start")
    def start_test(self, request, pk=None):
        pk, error_response = self.get_id(pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        test, error_response = self.get_test(pk=pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        if test.status == TestStatusEnum.SUBMITTED.value:
             return Response(
                {"status": False, "message": "Test already submitted!"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if test.status != TestStatusEnum.IN_PROGRESS.value or test.status == TestStatusEnum.PENDING.value :
            test.status = TestStatusEnum.IN_PROGRESS.value
            if not test.started_at:
                test.started_at = timezone.now()
            test.current_session_start = timezone.now()
            test.save()
        else:
            return Response(
                {
                    "status": False,
                    "message": "Test is in_progress state!",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        answered_question_ids = test.answers.values_list("quiz_question_id", flat=True)
        next_question = test.quiz.quiz_questions.exclude(id__in=answered_question_ids).order_by("id").first()

        remaining_time = None
        if test.quiz.time_limit is not None:
            total_limit_seconds = test.quiz.time_limit * 60
            time_spent = test.time_spent
            if test.current_session_start:
                time_spent += int((timezone.now() - test.current_session_start).total_seconds())
            remaining_time = max(0, total_limit_seconds - time_spent)

        return Response(
            {
                "status": True,
                "data" : {
                    "started_at": test.started_at,
                    "current_question": {"id": next_question.id, "title": next_question.title} if next_question else None,
                    "remaining_time": remaining_time
                },
                "message": "Test resumed/started successfully!"
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

        if test.status == TestStatusEnum.IN_PROGRESS.value and test.current_session_start:
            test.time_spent += int((timezone.now() - test.current_session_start).total_seconds())
            test.current_session_start = None
        if test.status == TestStatusEnum.IN_PROGRESS.value:
            test.status = TestStatusEnum.CANCELLED.value
        else:
            return Response(
                {
                    "status": False,
                    "message": "Test is not in in_progress state!",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
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

        if test.status == TestStatusEnum.IN_PROGRESS.value and test.current_session_start:
            test.time_spent += int((timezone.now() - test.current_session_start).total_seconds())
            test.current_session_start = None
        if test.status == TestStatusEnum.IN_PROGRESS.value:
            test.status = TestStatusEnum.PENDING.value
        else:
            return Response(
                {
                    "status": False,
                    "message": "Test is not in in_progress state!",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
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

        test, error_response = self.get_test(pk=pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        if test.status == TestStatusEnum.IN_PROGRESS.value and test.current_session_start:
            test.time_spent += int((timezone.now() - test.current_session_start).total_seconds())
            test.current_session_start = None
        if test.status == TestStatusEnum.IN_PROGRESS.value:
            test.status = TestStatusEnum.SUBMITTED.value
        else:
            return Response(
                {
                    "status": False,
                    "message": "Test is not in in_progress state!",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        test.save()

        quiz_questions = test.quiz.quiz_questions.all().prefetch_related("answers")

        test_answers = {a.quiz_question_id: a for a in test.answers.all()}

        total = quiz_questions.count()
        correct_count = 0

        for q in quiz_questions:
            user_answer = test_answers.get(q.id)

            if not user_answer:
                continue

            if q.type == QuestionTypeEnum.TEXT.value:
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


            elif q.type == QuestionTypeEnum.SINGLE.value:
                if (
                    user_answer.selected_answer
                    and user_answer.selected_answer.is_correct
                ):
                    user_answer.is_correct = True
                    correct_count += 1
                else:
                    user_answer.is_correct = False

                user_answer.save()


            elif q.type == QuestionTypeEnum.CHECKBOX.value:
                correct_set = set(q.answers.filter(is_correct=True).values_list("id", flat=True))

                user_set = set(user_answer.selected_answers.values_list("id", flat=True))

                if correct_set == user_set:
                    user_answer.is_correct = True
                    correct_count += 1
                else:
                    user_answer.is_correct = False

                user_answer.save()

        score = (correct_count / total * 100) if total else 0


        test.score = score
        test.status = TestStatusEnum.SUBMITTED.value
        test.submitted_at = timezone.now()

        test.save()

        return Response(
            {
                "status": True,
                "data": {
                    "score": score,
                    "correct": correct_count,
                    "total": total,
                    "time_spent": test.time_spent,
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

        serializer = TestDetailResultSerializer(test)

        return Response({
            "status": True,
            "data": serializer.data,
            "message": "Get result successfully!"
            },
            status=status.HTTP_200_OK,
        )


    @extend_schema(**answer_autosave_test_document)
    @action(detail=True, methods=["post"], url_path="answers")
    def save_answer(self, request, pk=None):
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

        serializer = AnswerTestSerializer(data=request.data)
        if not serializer.is_valid():
            return global_response_errors(serializer.errors)

        data = serializer.validated_data

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


        if question.type == QuestionTypeEnum.SINGLE.value:
            answer_id = data.get("quiz_question_answer_id")
            if not answer_id:
                return Response(
                    {"status": False, "message": "quiz_question_answer_id is required for single choice!"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if data.get("answer_ids") or data.get("text"):
                return Response(
                    {"status": False, "message": "Only quiz_question_answer_id should be provided for single choice!"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                answer = QuizQuestionAnswer.objects.get(
                    id=answer_id,
                    quiz_question=question
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

        elif question.type == QuestionTypeEnum.CHECKBOX.value:
            answer_ids = data.get("answer_ids")
            if answer_ids is None:
                return Response(
                    {"status": False, "message": "answer_ids is required for checkbox!"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if data.get("quiz_question_answer_id") or data.get("text"):
                return Response(
                    {"status": False, "message": "Only answer_ids should be provided for checkbox!"},
                    status=status.HTTP_400_BAD_REQUEST
                )
    
            answers = QuizQuestionAnswer.objects.filter(
                id__in=answer_ids,
                quiz_question=question
            )

            if answers.count() != len(set(answer_ids)):
                return Response(
                    {"status": False, "message": "One or more answer IDs are invalid for this question!"},
                    status=status.HTTP_404_NOT_FOUND
                )

            test_answer.selected_answers.set(answers)
            test_answer.selected_answer = None
            test_answer.text_answer = None

        elif question.type == QuestionTypeEnum.TEXT.value:
            text = data.get("text")
            if text is None:
                return Response(
                    {"status": False, "message": "text is required for text field!"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if data.get("quiz_question_answer_id") or data.get("answer_ids"):
                return Response(
                    {"status": False, "message": "Only text should be provided for text field!"},
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