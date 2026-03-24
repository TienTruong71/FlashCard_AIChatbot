from django.urls import include, path
from rest_framework import routers

from .views import (
    QuizViewSet
)


router = routers.DefaultRouter()
router.register(r"v1/quizzes", QuizViewSet, basename="quiz")

urlpatterns = [
    path(r"", include(router.urls)),
]
