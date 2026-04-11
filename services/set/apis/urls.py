from django.urls import include, path
from rest_framework import routers

from .views import (
    SetViewSet,
)


router = routers.DefaultRouter()
router.register(r"v1/sets", SetViewSet, basename="set")

urlpatterns = [
    path(r"", include(router.urls)),
]