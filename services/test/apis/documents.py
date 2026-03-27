from drf_spectacular.utils import OpenApiParameter, OpenApiResponse
from rest_framework.exceptions import NotFound
from core.serializers.test_serializers import (
    TestSerializer,
    CreateTestSerializer,
    AnswerTestSerializer
)

from core.serializers.quiz_serializers import(
    QuizQuestionSerializer,
)


list_test_document = {
    "summary": "Get list of test",
    "description": "Get list of test.",
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
    "responses": {200: TestSerializer(many=True)},
}


create_test_document = {
    "summary": "Create test ",
    "description": (
        "Create a new test"
    ),
    "request": CreateTestSerializer,
    "responses":{
        200: TestSerializer,
        400: {"message": "Validation error"},
    },
}


start_test_document = {
    "summary": "Start a test",
    "description": "Start a test for a specific quiz.",
    "parameters": [
        OpenApiParameter(
            "test_id",
            type=int,
            location=OpenApiParameter.PATH,
            description="ID of the test",
        ),
    ],
    "responses": {
        200: {
            "started_at": "datetime",
            "current_question": QuizQuestionSerializer,
            "remaining_time": "integer"
        },
        404: {"message": "Test does not exist!"}
    },
}


cancel_test_document = {
    "summary": "Cancel test",
    "description": "Cancel an ongoing test. All unsaved progress may be lost.",
    "parameters": [
        OpenApiParameter(
            "test_id",
            type=int,
            location=OpenApiParameter.PATH,
            description="ID of the test",
        ),
    ],
    "responses": {
        200: {
            "status": True,
            "message": "Test cancelled successfully!"
        },
        404: {"message": "Test does not exist!"}
    },
}


answer_autosave_test_document = {
    "summary": "Answer a question",
    "description": "Submit answer for a specific question in test. Supports single, multiple and text.",
    "parameters": [
        OpenApiParameter(
            "test_id",
            type=int,
            location=OpenApiParameter.PATH,
            description="ID of the test",
        ),
        OpenApiParameter(
            "quiz_question_id",
            type=int,
            location=OpenApiParameter.PATH,
            description="ID of the quiz question",
        ),
    ],
    "request": AnswerTestSerializer,
    "responses": {
        200: {
            "status": True,
            "message": "Answer saved successfully!"
        },
        400: {"message": "Validation error"},
        404: {"message": "Test or question does not exist!"}
    },
}


submit_test_document = {
    "summary": "Submit test",
    "description": "Submit a test and calculate result.",
    "parameters": [
        OpenApiParameter(
            "test_id",
            type=int,
            location=OpenApiParameter.PATH,
            description="ID of the test",
        ),
    ],
    "responses": {
        200: {
            "status": True,
            "score": "float",
            "total_questions": "integer",
            "correct_answers": "integer",
            "detail": "list"
        },
        404: {"message": "Test does not exist!"}
    },
}


pending_test_document = {
    "summary": "Mark test as pending",
    "description": "Update test status to pending (used when user temporarily saves or leaves the test).",
    "parameters": [
        OpenApiParameter(
            "test_id",
            type=int,
            location=OpenApiParameter.PATH,
            description="ID of the test",
        ),
    ],
    "responses": {
        200: {
            "status": True,
            "message": "Test change status pending successfully!",
        },
        400: {"message": "Invalid ID. ID must be an integer!"},
        404: {"message": "Test does not exist!"},
    },
}


result_test_document = {
    "summary": "Get test result",
    "description": "Get detailed result of a test after submission.",
    "parameters": [
        OpenApiParameter(
            "test_id",
            type=int,
            location=OpenApiParameter.PATH,
            description="ID of the test",
        ),
    ],
    "responses": {
        200: {
            "status": True,
            "data": {
                "score": "float",
                "total_questions": "integer",
                "correct_answers": "integer",
                "questions": [
                    {
                        "question_id": "integer",
                        "question": "string",
                        "your_answer": "list/string",
                        "correct_answer": "list",
                        "is_correct": "boolean"
                    }
                ]
            }
        },
        404: {"message": "Test does not exist!"}
    },
}





