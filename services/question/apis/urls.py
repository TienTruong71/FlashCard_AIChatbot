from django.urls import include, path
from rest_framework import routers

from .views import (QuestionViewSet)


question_list = QuestionViewSet.as_view({
    "get": "list",
    "post": "create",
})

question_detail = QuestionViewSet.as_view({
    "get": "retrieve",
    "put": "update",
    "delete": "destroy",
})

urlpatterns = [
    path("v1/sets/<int:set_id>/questions", question_list),
    path("v1/sets/<int:set_id>/questions/<int:pk>", question_detail),
]