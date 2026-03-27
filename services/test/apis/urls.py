from django.urls import include, path
from rest_framework import routers

from .views import (
    TestViewSet,
)


router = routers.DefaultRouter()
router.register(r"v1/tests", TestViewSet, basename="test")

urlpatterns = [
    path(r"", include(router.urls)),
]
