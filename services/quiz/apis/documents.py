from drf_spectacular.utils import OpenApiParameter, OpenApiResponse
from rest_framework.exceptions import NotFound
from core.serializers.quiz_serializers import (
    QuizSerializer,
    CreateQuizSerializer,
    UpdateQuizSerializer,
)


list_quiz_document = {
    "summary": "Get quiz of quiz",
    "description": "Get quiz of quiz.",
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

create_quiz_document = {
    "summary": "Create quiz",
    "description": "Create a new quiz.",
    "request": CreateQuizSerializer,
    "responses": {
        201: QuizSerializer,
        400: {"message": "Validation error"},
    },
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