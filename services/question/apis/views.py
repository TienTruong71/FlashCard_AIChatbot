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
    create_set_document,
    list_set_document,
    update_set_document,
    retrieve_set_document,
    delete_set_document,
    share_set_document,
    unshare_set_document,
)


class _BaseQuestionViewSet:
    def get_id(self, pk):
        if not pk or not pk.isdigit():
            return None, {
                "status": False,
                "message": "Invalid ID. ID must be an integer!",
            }
        return int(pk), None

    def get_set(self, pk):
        try:
            set = Question.objects.get(pk=pk)
            return set, None
        except Question.DoesNotExist:
            return None, {"status": False, "message": "question does not exist!"}





