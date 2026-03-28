from drf_spectacular.utils import OpenApiParameter, OpenApiResponse
from rest_framework.exceptions import NotFound

from core.serializers.user_serializers import (
    RefreshTokenSerializer,
    RegisterUserSerializer,
    UserLoginSerializer,
    UserSerializer,
    UserSerializerWithToken,
)


list_user_document = {
    "summary": "Get all users",
    "description": "Get all users.",
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
    "responses": {200: UserSerializer(many=True)},
}


register_user_document = {
    "summary": "Create new user.",
    "description": "Receive input information and create a new user. Return a success message upon successful user creation; otherwise, return an error message.",
    "request": RegisterUserSerializer,
    "responses": {
        201: UserSerializer,
        400: UserSerializer.errors,
    },
}

login_user_document = {
    "summary": "Login to the system.",
    "description": "Receive the input information to login. Return a success result for login; otherwise, return an error.",
    "request": UserLoginSerializer,
    "responses": {
        200: UserSerializerWithToken,
        400: UserLoginSerializer.errors,
    },
}

refresh_token_document = {
    "summary": "Refresh token",
    "description": "Refresh token when access token is expired.",
    "request": RefreshTokenSerializer,
    "responses": {
        200: {
            "status": True,
            "data": {
                "refresh_token": str("new_refresh"),
                "access_token": str("access_token"),
            },
            "message": "Refresh token successfully!",
        },
        400: {"message": "Invalid or expired token!"},
    },
}
