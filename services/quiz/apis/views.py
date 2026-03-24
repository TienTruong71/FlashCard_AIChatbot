from django.contrib.auth import authenticate
from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from core.paginators import CustomPaginator
from core.filters import QuizFilter
from core.models import Quiz, Set, QuizQuestion, QuizQuestionAnswer
from django.db import transaction
from core.serializers.quiz_serializers import (
    QuizSerializer,
    CreateQuizSerializer,
    UpdateQuizSerializer,
)

from core.utils import global_response_errors

from .documents import (
   create_quiz_document,
   list_quiz_document,
   update_quiz_document,
   delete_quiz_document,
   retrieve_quiz_document,
   duplicate_quiz_document,
)


class _BaseQuizViewSet:
    def get_id(self, pk):
        if not pk or not pk.isdigit():
            return None, {
                "status": False,
                "message": "Invalid ID. ID must be an integer!",
            }
        return int(pk), None

    def get_quiz(self, pk):
        try:
            return Quiz.objects.get(id=pk), None
        except Quiz.DoesNotExist:
            return None,{
                "status" : False,
                "message": "Quiz does not exist!"
            }


class QuizViewSet(viewsets.ViewSet, _BaseQuizViewSet):

    @extend_schema(**list_quiz_document)
    def list(self, request):

        filter_params = request.GET.dict()

        queryset = Quiz.objects.all().prefetch_related("quiz_questions").order_by("-created_at")

        quizzes = QuizFilter(filter_params, queryset=queryset)

        paginator = CustomPaginator()
        page = paginator.paginate_queryset(quizzes.qs, request)
        serializer = QuizSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    @extend_schema(**create_quiz_document)
    def create(self, request):
        serializer = CreateQuizSerializer(data=request.data)
        if serializer.is_valid():
            quiz = serializer.save(user=request.user)
            return Response(
                {
                    "status": True,
                    "data": QuizSerializer(quiz ).data,
                    "message": "Quiz created!"
                },
                status=status.HTTP_201_CREATED,
            )

        return global_response_errors(serializer.errors)

    @extend_schema(**update_quiz_document)
    def update(self, request, pk=None):
        pk, error_response = self.get_id(pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        quiz, error_response = self.get_quiz(pk=pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        serializer = UpdateQuizSerializer(
            instance=quiz, data=request.data, partial=True
        )

        if serializer.is_valid():
            quiz = serializer.save()
            return Response(
                {
                    "status":True,
                    "data":QuizSerializer(quiz).data,
                    "message": "Quiz updated successfully!"
                },
                status=status.HTTP_200_OK
            )
        return global_response_errors(serializer.errors)


    @extend_schema(**retrieve_quiz_document)
    def retrieve(self, request, pk=None):
        pk, error_response = self.get_id(pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        quiz, error_response = self.get_quiz(pk=pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        serializer = QuizSerializer(quiz)
        return Response(
            {
                "status": True,
                "data":serializer.data
            },
            status=status.HTTP_200_OK,
        )


    @extend_schema(**delete_quiz_document)
    def destroy(self, request, pk=None):
        pk, error_response = self.get_id(pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        quiz, error_response = self.get_quiz(pk=pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        quiz.delete()
        return Response(
            {
                "status": True,
                "message": "Quiz deleted successfully!"
            },
            status=status.HTTP_200_OK
        )


    @extend_schema(**duplicate_quiz_document)
    @action(detail=True, methods=["post"],url_path="duplicate")
    def duplicate(self, request, pk=None):
        pk, error_response = self.get_id(pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        quiz, error_response = self.get_quiz(pk=pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        try:
            with transaction.atomic():
                old_quiz = quiz

                quiz_questions = old_quiz.quiz_questions.prefetch_related("answers")

                new_quiz = Quiz.objects.create(
                    set=old_quiz.set,
                    user=old_quiz.user,
                    title=f"{old_quiz.title} (Copy)",
                    is_published=False,
                    question_count=quiz_questions.count()
                )

                for qq in quiz_questions:
                    new_qq = QuizQuestion.objects.create(
                        quiz=new_quiz,
                        question=qq.question,
                        title=qq.title,
                        type=qq.type
                    )

                    for ans in qq.answers.all():
                        QuizQuestionAnswer.objects.create(
                            quiz_question=new_qq,
                            content=ans.content,
                            is_correct=ans.is_correct
                        )

                return Response(
                    {
                        "status": True,
                        "data": QuizSerializer(new_quiz).data,
                        "message": "Duplicate quiz successfully!"
                    },
                    status=status.HTTP_201_CREATED
                )
        except Exception as e:
            return Response(
                {
                    "error": str(e),
                },
                status=status.HTTP_400_BAD_REQUEST
            )












