from django.contrib.auth import authenticate
from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from core.paginators import CustomPaginator
from core.filters import QuestionFilter
from core.models import QuizQuestion

from core.serializers.quiz_serializers import (
    QuizQuestionSerializer,
    UpdateQuizQuestionSerializer
)

from core.utils import global_response_errors

from .documents import (
   update_question_document,
   retrieve_question_document,
   delete_question_document,
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
            return QuizQuestion.objects.get(id=pk), None
        except QuizQuestion.DoesNotExist:
            return None,{
                "status" : False,
                "message": "Quiz question does not exist!"
            }


class QuizQuestionViewSet(viewsets.ViewSet, _BaseQuestionViewSet):

    @extend_schema(**update_question_document)
    def update(self, request, pk=None):
        pk, error_response =self.get_id(pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        question, error_response = self.get_question(pk=pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        if question.quiz.is_published:
            return Response(
                {
                    "status": False,
                    "message": "Cannot update questions of a published quiz!"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = UpdateQuizQuestionSerializer(
            instance=question, data=request.data, partial=True
        )

        if serializer.is_valid():
            question = serializer.save()
            return Response(
                {
                    "status":True,
                    "data":QuizQuestionSerializer(question).data,
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

        serializer = QuizQuestionSerializer(question)
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

        if question.quiz.is_published:
            return Response(
                {
                    "status": False,
                    "message": "Cannot delete questions of a published quiz!"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        question.delete()
        return Response(
            {
                "status":True,
                "message": "Quiz question deleted successfully!"
            },
            status=status.HTTP_200_OK
        )















