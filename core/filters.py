from django.db.models import Q
from django_filters import rest_framework as filters
from core.models import Notification, Question, QuizQuestion

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

class QuestionFilter(filters.FilterSet):
    q = filters.CharFilter(method="filter_by_q", label="Search Question")
    type = filters.CharFilter(field_name="type", lookup_expr="exact")
    types = filters.BaseInFilter(field_name="type", lookup_expr="in")

    class Meta:
        model = Question
        fields = ["q", "type", "types"]

    def filter_by_q(self, queryset, name, value):
        if not value:
            return queryset

        return queryset.filter(
            Q(title__icontains=value)
        )

class QuizQuestionFilter(filters.FilterSet):
    q = filters.CharFilter(method="filter_by_q", label="Search Question")
    type = filters.CharFilter(field_name="type", lookup_expr="exact")
    types = filters.BaseInFilter(field_name="type", lookup_expr="in")

    class Meta:
        model = QuizQuestion
        fields = ["q", "type", "types"]

    def filter_by_q(self, queryset, name, value):
        if not value:
            return queryset

        return queryset.filter(
            Q(title__icontains=value)
        )

class QuizFilter(filters.FilterSet):
    q = filters.CharFilter(method="filter_by_q", label="Search Set")

    def filter_by_q(self, queryset, name, value):
        if value:
            return queryset.filter(Q(title__icontains=value)).distinct()
        return queryset