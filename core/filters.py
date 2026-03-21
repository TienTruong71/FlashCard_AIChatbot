from django.db.models import Q
from django_filters import rest_framework as filters
from core.models import Notification

class NotificationFilter(filters.FilterSet):
    class Meta:
        model = Notification
        # define field search ex: name=xxx, id=yyy
        fields = {
            "is_read": ["exact"],
        }

class SetFilter(filters.FilterSet):
    q = filters.CharFilter(method="filter_by_q", label="Search Set")

    def filter_by_q(self, queryset, name, value):
        if value:
            return queryset.filter(
                Q(title__icontains=value) | Q(description__icontains=value)
            ).distinct()
        return queryset