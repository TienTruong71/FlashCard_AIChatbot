from drf_spectacular.utils import OpenApiParameter, OpenApiResponse
from rest_framework.exceptions import NotFound
from core.serializers.question_serializers import (
    QuestionSerializer,
    CreateQuestionSerializer,
    UpdateQuestionSerializer,
)


list_question_document = {
    "summary": "Get list of question",
    "description": "Get list of question.",
    "parameters": [
        OpenApiParameter("page", int, required=False, default=1, description="Page number"),
        OpenApiParameter(
            "page_size",
            int,
            required=False,
            default=10,
            description="Number of items per page",
        ),
        OpenApiParameter(
            "q",
            str,
            required=False,
            description="Search",
        ),
    ],
    "responses": {200: QuestionSerializer(many=True)},
}



update_question_document = {
    "summary": "Update question",
    "description": "Update question by id (partial update supported).",
    "parameters": [
        OpenApiParameter(
            "id",
            type=int,
            location=OpenApiParameter.PATH,
            description="ID of the question",
        ),
    ],
    "request": UpdateQuestionSerializer,
    "responses": {
        200: QuestionSerializer,
        400: {"message": "Validation error"},
        404: {"message": "question does not exist!"},
    },
}


retrieve_question_document = {
    "summary": "Get question detail",
    "description": "Get question detail by id.",
    "parameters": [
        OpenApiParameter(
            "id",
            type=int,
            location=OpenApiParameter.PATH,
            description="ID of the question",
        ),
    ],
    "responses": {
        200: QuestionSerializer,
        400: {"message": "Invalid ID. ID must be an integer!"},
        404: {"message": "question does not exist!"},
    },
}


delete_question_document = {
    "summary": "Delete question",
    "description": "Delete question by id.",
    "parameters": [
        OpenApiParameter(
            "id",
            type=int,
            location=OpenApiParameter.PATH,
            description="ID of the question",
        ),
    ],
    "responses": {
        200: {"status": True, "message": "question deleted successfully!"},
        400: {"message": "Invalid ID. ID must be an integer!"},
        404: {"message": "question does not exist!"},
    },
}

