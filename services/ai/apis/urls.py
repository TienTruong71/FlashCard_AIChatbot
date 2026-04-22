from django.urls import include, path
from rest_framework import routers

from .views import ChatbotViewSet


router = routers.DefaultRouter()
router.register(r"v1/chatbot", ChatbotViewSet, basename="chatbot")

urlpatterns = [
    path(r"", include(router.urls)),
]