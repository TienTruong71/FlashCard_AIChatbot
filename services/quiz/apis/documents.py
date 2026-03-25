from drf_spectacular.utils import OpenApiParameter, OpenApiResponse
from rest_framework.exceptions import NotFound
from core.serializers.quiz_serializers import (
    QuizSerializer,
    CreateQuizSerializer,
    UpdateQuizSerializer,
)

from core.serializers.quiz_share_serializers import(
    ShareQuizSerializer
)

list_quiz_document = {
    "summary": "Get all quizzes",
    "description": "Get all quizzes.",
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
    "responses": {200: QuizSerializer(many=True)},
}


update_quiz_document = {
    "summary": "Update quiz",
    "description": "Update quiz by id.",
    "parameters": [
        OpenApiParameter(
            "id",
            type=int,
            location=OpenApiParameter.PATH,
            description="ID of the quiz",
        ),
    ],
    "request": UpdateQuizSerializer,
    "responses": {
        200: QuizSerializer,
        400: {"message": "Validation error"},
        404: {"message": "quiz does not exist!"},
    },
}

retrieve_quiz_document = {
    "summary": "Get quiz detail",
    "description": "Get quiz detail by id.",
    "parameters": [
        OpenApiParameter(
            "id",
            type=int,
            location=OpenApiParameter.PATH,
            description="ID of the quiz",
        ),
    ],
    "responses": {
        200: QuizSerializer,
        400: {"message": "Invalid ID. ID must be an integer!"},
        404: {"message": "quiz does not exist!"},
    },
}

delete_quiz_document = {
    "summary": "Delete quiz",
    "description": "Delete quiz by id.",
    "parameters": [
        OpenApiParameter(
            "id",
            type=int,
            location=OpenApiParameter.PATH,
            description="ID of the quiz",
        ),
    ],
    "responses": {
        200: {"status": True, "message": "quiz deleted successfully!"},
        400: {"message": "Invalid ID. ID must be an integer!"},
        404: {"message": "quiz does not exist!"},
    },
}

duplicate_quiz_document = {
    "summary": "Duplicate quiz",
    "description": "Create a copy of an existing quiz along with its questions and answers.",
    "parameters": [
        OpenApiParameter(
            "id",
            type=int,
            location=OpenApiParameter.PATH,
            description="ID of the quiz to duplicate",
        ),
    ],
    "responses": {
        201: QuizSerializer,
        400: {"message": "Something went wrong while duplicating quiz"},
        404: {"message": "quiz does not exist!"},
    },
}

share_quiz_document = {
    "summary": "Share quiz with users",
    "description": "Share a quiz with multiple users by their IDs",
    "parameters": [
        OpenApiParameter(
            "id",
            type=int,
            location=OpenApiParameter.PATH,
            description="ID of the quiz",
        ),
    ],
    "request": ShareQuizSerializer,
    "responses": {
        200: QuizSerializer,
        400: {"message": "Validation error"},
        404: {"message": "quiz does not exist!"},
    },
}

unshare_quiz_document = {
    "summary": "Cancel sharing quiz",
    "description": "Remove a user from shared quiz.",
    "parameters": [
        OpenApiParameter(
            "id",
            type=int,
            location=OpenApiParameter.PATH,
            description="ID of user",
        ),
    ],
    "responses": {
        200: QuizSerializer,
        400: {"message": "Validation error"},
        404: {"message": "quiz does not exist!"},
    },
}