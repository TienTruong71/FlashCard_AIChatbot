from django.urls import include, path
from rest_framework import routers

from .views import (
    QuizQuestionViewSet,
)


router = routers.DefaultRouter()
router.register(r"v1/quiz_questions", QuizQuestionViewSet, basename="quiz_question")

urlpatterns = [
    path(r"", include(router.urls)),
]
