from django.contrib.auth import authenticate
from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from core.paginators import CustomPaginator
from core.filters import QuizFilter, QuizQuestionFilter, TestFilter
from core.models import Quiz, QuizQuestion, QuizQuestionAnswer, User, QuizShare, Test
from django.db import transaction
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from core.serializers.quiz_serializers import (
    QuizSerializer,
    UpdateQuizSerializer,
    CreateQuizQuestionSerializer,
    QuizQuestionSerializer,
    UpdateQuizQuestionSerializer,
    QuizDetailSerializer
)
from core.serializers.test_serializers import(
    TestSerializer,
    AnswerTestSerializer,
    CreateTestSerializer
)

from core.serializers.quiz_share_serializers import(
    ShareQuizSerializer
)

from core.utils import global_response_errors
from core.utils.notifications import send_share_notification

from .documents import (
   list_quiz_document,
   update_quiz_document,
   delete_quiz_document,
   retrieve_quiz_document,
   duplicate_quiz_document,
   share_quiz_document,
   unshare_quiz_document,
   create_quiz_question_document,
   update_quiz_question_document,
   retrieve_quiz_question_document,
   delete_quiz_question_document,
   list_test_of_quiz_document,
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
                    "data":QuizSerializer(quiz, context={'request': request}).data,
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

        serializer = QuizDetailSerializer(quiz, context={'request': request})
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


    @extend_schema(**share_quiz_document)
    @action(detail=True, methods=["post"], url_path="share")
    def share(self, request, pk=None):

        pk, error_response = self.get_id(pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        quiz, error_response = self.get_quiz(pk=pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)


        serializer = ShareQuizSerializer(data=request.data)
        if not serializer.is_valid():
            return global_response_errors(serializer.errors)

        shares_data = serializer.validated_data["shares"]

        shared_users = []
        for item in shares_data:
            email = item["email"]
            permission = item["permission"]
            user = User.objects.get(email=email)
            QuizShare.objects.update_or_create(
                quiz=quiz,
                user=user,
                defaults={"permission":permission}
            )
            shared_users.append(
                {
                    "email": email,
                    "permission": permission,
                }
            )
            
            send_share_notification(
                recipient=user,
                item_title=quiz.title,
                item_type="Quiz",
                permission=permission
            )

        return Response(
            {
                "status": True,
                "data":{
                    "quiz_id": quiz.id,
                    "shared_user_ids": shared_users,
                },
                "message":"Quiz shared successfully!",
            },
            status=status.HTTP_200_OK,
        )


    @extend_schema(**unshare_quiz_document)
    @action(detail=True, methods=["delete"], url_path=r"unshare/(?P<user_id>[^/.]+)")
    def unshare(self, request, pk=None, user_id=None):

        pk, error_response = self.get_id(pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)
        
        user_id, error_response = self.get_id(user_id)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        quiz, error_response = self.get_quiz(pk=pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        deleted, _ = QuizShare.objects.filter(
            quiz=quiz,
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
                "message": "Quiz unshared successfully!",
            },
            status=status.HTTP_200_OK,
        )


    @extend_schema(**create_quiz_question_document)
    @action(detail=True, methods=["post"], url_path="create_questions")
    def create_quiz_question(self, request, pk=None):

        pk, error_response = self.get_id(pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        quiz, error_response = self.get_quiz(pk=pk)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        if quiz.is_published:
            return Response(
                {
                    "status": False,
                    "message": "Cannot create questions for a published quiz!"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = CreateQuizQuestionSerializer(data=request.data)
        if serializer.is_valid():
            with transaction.atomic():
                quiz_question = serializer.save(quiz=quiz)
            return Response(
                {
                    "status": True,
                    "data": QuizQuestionSerializer(quiz_question).data,
                    "message": "Question of Quiz created!"
                },
                status=status.HTTP_201_CREATED,
            )
        return global_response_errors(serializer.errors)


    @extend_schema(**list_test_of_quiz_document)
    @action(detail=True, methods=["get"], url_path="tests")
    def list_test(self, request, pk=None):
        quiz_id = pk
        quiz, error_response = self.get_quiz(pk=quiz_id)
        if error_response:
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

        filter_params = request.GET.dict()
        queryset = Test.objects.filter(quiz=quiz, user=request.user).select_related("user")\
            .prefetch_related("answers").order_by("-id")

        tests = TestFilter(filter_params, queryset=queryset)

        paginator = CustomPaginator()
        page = paginator.paginate_queryset(tests.qs, request)
        serializer = TestSerializer(page, many=True)

        return paginator.get_paginated_response(serializer.data)



