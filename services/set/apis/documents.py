from drf_spectacular.utils import OpenApiParameter, OpenApiResponse
from rest_framework.exceptions import NotFound
from core.serializers.set_serializers import (
    SetSerializer,
    CreateSetSerializer,
    UpdateSetSerializer,
)
from core.serializers.set_share_serializers import(
    ShareSetSerializer
)

from core.serializers.quiz_serializers import(
    CreateQuizSerializer,
    QuizSerializer
)

list_set_document = {
    "summary": "Get list of set",
    "description": "Get list of set.",
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
    "responses": {200: SetSerializer(many=True)},
}

create_set_document = {
    "summary": "Create department",
    "description": "Create a new department.",
    "request": CreateSetSerializer,
    "responses": {
        201: SetSerializer,
        400: {"message": "Validation error"},
    },
}

update_set_document = {
    "summary": "Update set",
    "description": "Update set by id (partial update supported).",
    "parameters": [
        OpenApiParameter(
            "id",
            type=int,
            location=OpenApiParameter.PATH,
            description="ID of the set",
        ),
    ],
    "request": UpdateSetSerializer,
    "responses": {
        200: SetSerializer,
        400: {"message": "Validation error"},
        404: {"message": "set does not exist!"},
    },
}

retrieve_set_document = {
    "summary": "Get set detail",
    "description": "Get set detail by id.",
    "parameters": [
        OpenApiParameter(
            "id",
            type=int,
            location=OpenApiParameter.PATH,
            description="ID of the set",
        ),
    ],
    "responses": {
        200: SetSerializer,
        400: {"message": "Invalid ID. ID must be an integer!"},
        404: {"message": "set does not exist!"},
    },
}

delete_set_document = {
    "summary": "Delete set",
    "description": "Delete set by id.",
    "parameters": [
        OpenApiParameter(
            "id",
            type=int,
            location=OpenApiParameter.PATH,
            description="ID of the set",
        ),
    ],
    "responses": {
        200: {"status": True, "message": "set deleted successfully!"},
        400: {"message": "Invalid ID. ID must be an integer!"},
        404: {"message": "set does not exist!"},
    },
}

share_set_document = {
    "summary": "Share set with users",
    "description": "Share a set with multiple users by their IDs",
    "parameters": [
        OpenApiParameter(
            "id",
            type=int,
            location=OpenApiParameter.PATH,
            description="ID of the set",
        ),
    ],
    "request": ShareSetSerializer,
    "responses": {
        200: SetSerializer,
        400: {"message": "Validation error"},
        404: {"message": "set does not exist!"},
    },
}

unshare_set_document = {
    "summary": "Cancel sharing set",
    "description": "Remove a user from shared set.",
    "parameters": [
        OpenApiParameter(
            "id",
            type=int,
            location=OpenApiParameter.PATH,
            description="ID of user",
        ),
    ],
    "responses": {
        200: SetSerializer,
        400: {"message": "Validation error"},
        404: {"message": "set does not exist!"},
    },
}

create_quiz_document = {
    "summary": "Create quiz from set",
    "description": (
        "Create a new quiz from a set. "
        "Randomly selects a number of questions from the set based on `question_count`, "
        "then clones them into the quiz along with their answers."
    ),
    "request": CreateQuizSerializer,
    "responses":{
        200: QuizSerializer,
        400: {"message": "Validation error"},
        404: {"message": "set does not exist!"},
    },
}