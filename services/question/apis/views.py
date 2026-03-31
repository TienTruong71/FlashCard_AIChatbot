from django.contrib.auth import authenticate
from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from core.paginators import CustomPaginator
from core.filters import QuestionFilter
from core.models import Question, Set, Answer

from core.serializers.question_serializers import (
    QuestionSerializer,
    CreateQuestionSerializer,
    UpdateQuestionSerializer,
)

from core.utils import global_response_errors

from .documents import (
   update_question_document,
   retrieve_question_document,
   delete_question_document,
   list_question_document,
)


class _BaseQuestionViewSet:
    def get_id(self, pk):
        if not pk or not pk.isdigit():
            return None, {
                "status": False,
                "message": "Invalid ID. ID must be an integer!",
            }
        return int(pk), None

    def get_question(self, pk):
        try:
            return Question.objects.get(id=pk), None
        except Question.DoesNotExist:
            return None,{
                "status" : False,
                "message": "Question does not exist!"
            }


class QuestionViewSet(viewsets.ViewSet, _BaseQuestionViewSet):


    @extend_schema(**list_question_document)
    def list(self, request):
        filter_params = request.GET.dict()

        queryset = Question.objects.all(). prefetch_related("answers").order_by("created_at")

        questions = QuestionFilter(filter_params, queryset=queryset)

        paginator = CustomPaginator()
        page = paginator.paginate_queryset(questions.qs, request)
        serializer = QuestionSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


    @extend_schema(**update_question_document)
    def update(self, request, pk=None):
        pk, error_response =self.get_id(pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        question, error_response = self.get_question(pk=pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        serializer = UpdateQuestionSerializer(
            instance=question, data=request.data, partial=True
        )

        if serializer.is_valid():
            question = serializer.save()
            return Response(
                {
                    "status":True,
                    "data":QuestionSerializer(question).data,
                    "message": "Question updated successfully!",
                },
                status=status.HTTP_200_OK,
            )
        return global_response_errors(serializer.errors)


    @extend_schema(**retrieve_question_document)
    def retrieve(self, request,pk=None):
        pk, error_response =self.get_id(pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        question, error_response = self.get_question(pk=pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        serializer = QuestionSerializer(question)
        return Response(
            {
                "status": True,
                "data":serializer.data,
            },
            status=status.HTTP_200_OK
        )


    @extend_schema(**delete_question_document)
    def destroy(self, request, pk=None):
        pk, error_response =self.get_id(pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        question, error_response = self.get_question(pk=pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        question.delete()
        return Response(
            {
                "status":True,
                "message": "Question deleted successfully!"
            },
            status=status.HTTP_200_OK
        )