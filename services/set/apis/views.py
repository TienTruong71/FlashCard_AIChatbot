from django.contrib.auth import authenticate
from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from django.db import transaction
from rest_framework.decorators import action
from rest_framework.response import Response
from core.paginators import CustomPaginator
from core.filters import SetFilter, QuestionFilter, QuizFilter
from core.models import Set, User, SetShare, Quiz, QuizQuestion, QuizQuestionAnswer, Question
import random

from core.serializers.set_serializers import (
    UpdateSetSerializer,
    CreateSetSerializer,
    SetSerializer,
)
from core.serializers.quiz_serializers import(
    CreateQuizSerializer,
    QuizSerializer
)

from core.serializers.question_serializers import(
    QuestionSerializer,
    CreateQuestionSerializer,
)

from core.serializers.set_share_serializers import(
    ShareSetSerializer
)
from core.utils import global_response_errors

from .documents import (
    create_set_document,
    list_set_document,
    update_set_document,
    retrieve_set_document,
    delete_set_document,
    share_set_document,
    unshare_set_document,
    create_quiz_document,
    create_question_document,
    list_quiz_document,
)

class _BaseSetViewSet:
    def get_id(self, pk):
        if not pk or not pk.isdigit():
            return None, {
                "status": False,
                "message": "Invalid ID. ID must be an integer!",
            }
        return int(pk), None

    def get_set(self, pk):
        try:
            set = Set.objects.get(pk=pk)
            return set, None
        except Set.DoesNotExist:
            return None, {"status": False, "message": "set does not exist!"}


class SetViewSet(viewsets.ViewSet, _BaseSetViewSet):

    @extend_schema(**list_set_document)
    def list(self, request):
        filter_params = request.GET.dict()
        sets = SetFilter(
            filter_params, queryset=Set.objects.prefetch_related("questions__answers").order_by("-created_at")
        )
        paginator = CustomPaginator()
        page = paginator.paginate_queryset(sets.qs, request)
        serializer = SetSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


    @extend_schema(**create_set_document)
    def create(self, request):
        serializer = CreateSetSerializer(data=request.data)
        if serializer.is_valid():
            set = serializer.save(user=request.user)
            return Response(
                {
                    "status" : True,
                    "data": SetSerializer(set).data,
                    "message":"Set created successfully!",

                },
                status=status.HTTP_201_CREATED,
            )
        return global_response_errors(serializer.errors)


    @extend_schema(**update_set_document)
    def update(self, request, pk=None):
        pk, error_response = self.get_id(pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        set, error_response = self.get_set(pk=pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        serializer = UpdateSetSerializer(
            instance=set, data=request.data, partial=True
        )
        if serializer.is_valid():
            set = serializer.save()
            return Response(
                {
                    "status":True,
                    "data":SetSerializer(set).data,
                    "message": "Set updated successfully!"
                },
                status=status.HTTP_200_OK,
            )
        return global_response_errors(serializer.errors)


    @extend_schema(**retrieve_set_document)
    def retrieve(self, request, pk=None):
        pk, error_response = self.get_id(pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        set, error_response = self.get_set(pk=pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        serializer = SetSerializer(set)
        return Response(
            {
                "status":True,
                "data":serializer.data,
            },
            status=status.HTTP_200_OK,
        )


    @extend_schema(**delete_set_document)
    def destroy(self, request, pk=None):

        pk, error_response = self.get_id(pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        set, error_response = self.get_set(pk=pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        set.delete()
        return Response(
            {
                "status":True,
                "message": "Set deleted successfully!"
            },
            status=status.HTTP_200_OK,
        )


    @extend_schema(**share_set_document)
    @action(detail=True, methods=["post"], url_path="share")
    def share(self, request, pk=None):

        pk, error_response = self.get_id(pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        set, error_response = self.get_set(pk=pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        serializer = ShareSetSerializer(data=request.data)
        if not serializer.is_valid():
            return global_response_errors(serializer.errors)

        shares_data = serializer.validated_data["shares"]

        shared_users = []
        for item in shares_data:
            user_id = item["user_id"]
            permission = item["permission"]
            user = User.objects.get(id=user_id)
            SetShare.objects.update_or_create(
                set=set,
                user=user,
                defaults={"permission": permission}
            )
            shared_users.append(
                {
                    "user_id" : user_id,
                    "permission": permission
                }
            )

        return Response(
            {
                "status" :True,
                "data" : {
                    "set_id": set.id,
                    "shared_user_ids": shared_users,
                },
                "message": "Set shared successfully!",
            },
            status=status.HTTP_200_OK,
        )


    @extend_schema(**unshare_set_document)
    @action(detail=True, methods=["delete"], url_path=r"unshare/(?P<user_id>[^/.]+)")
    def unshare(self, request, pk=None, user_id=None):

        pk , error_response = self.get_id(pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        user_id , error_response = self.get_id(user_id)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        set, error_response = self.get_set(pk=pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        deleted, _ = SetShare.objects.filter(
            set=set,
            user_id=user_id
        ).delete()

        if not deleted:
            return Response(
                {
                    "status": False,
                    "message": "Set or user_id does not exist!",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            {
                "status": True,
                "message": "Unshare successfully!"
            },
            status=status.HTTP_200_OK,
        )


    @extend_schema(**create_quiz_document)
    @action(detail=True, methods=["post"], url_path="quizzes")
    def create_quiz(self, request, pk):
        pk, error_response = self.get_id(pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        set_study, error_response = self.get_set(pk=pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        serializer = CreateQuizSerializer(data=request.data)
        if not serializer.is_valid():
            return global_response_errors(serializer.errors)

        validated_data = serializer.validated_data
        question_count = validated_data["question_count"]

        questions = list(set_study.questions.all())

        if len(questions) < question_count:
            return Response(
                {
                    "status": False,
                    "message": "Not enough questions in set!"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        random_questions = random.sample(questions, question_count)

        with transaction.atomic():
            quiz = Quiz.objects.create(
                user=request.user,
                set=set_study,
                title=validated_data["title"],
                question_count=question_count,
            )

            quiz_answers = []

            for q in random_questions:
                qq = QuizQuestion.objects.create(
                    quiz=quiz,
                    question=q,
                    title=q.title,
                    type=q.type
                )

                answers = q.answers.all()
                for ans in answers:
                    quiz_answers.append(
                        QuizQuestionAnswer(
                            quiz_question=qq,
                            content=ans.content,
                            is_correct=ans.is_correct
                        )
                    )

            QuizQuestionAnswer.objects.bulk_create(quiz_answers)


        return Response(
            {
                "status": True,
                "data": QuizSerializer(quiz).data,
                "message": "Quiz created!"
            },
            status=status.HTTP_201_CREATED,
        )


    @extend_schema(**create_question_document)
    @action(detail=True, methods=["post"], url_path="questions")
    def create_question(self, request, pk=None):

        pk, error_response = self.get_id(pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        set_study, error_response = self.get_set(pk=pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        serializer = CreateQuestionSerializer(data=request.data)
        if serializer.is_valid():
            with transaction.atomic():
                questions = serializer.save(set=set_study)
            return Response(
                {
                    "status" : True,
                    "data": QuestionSerializer(questions).data,
                    "message": "Question created!"
                },
                status=status.HTTP_201_CREATED,
            )

        return global_response_errors(serializer.errors)


    @extend_schema(**list_quiz_document)
    @action(detail=True, methods=["get"], url_path="list_quizzes")
    def list_quiz(self, request, pk=None):

        pk, error_response = self.get_id(pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        set_study, error_response = self.get_set(pk=pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        filter_params = request.GET.dict()
        sets = QuizFilter(
            filter_params, queryset=Quiz.objects.filter(set=set_study).order_by("id")
        )
        paginator = CustomPaginator()
        page = paginator.paginate_queryset(sets.qs, request)
        serializer = QuizSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)