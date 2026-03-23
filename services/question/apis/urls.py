from django.urls import include, path
from rest_framework import routers

from .views import (
    QuestionViewSet,
)


router = routers.DefaultRouter()
router.register(r"v1/questions", QuestionViewSet, basename="set")

urlpatterns = [
    path(r"", include(router.urls)),
]
