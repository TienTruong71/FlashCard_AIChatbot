from django.db.models import Q
from django_filters import rest_framework as filters
from core.models import Notification, Question, QuizQuestion, Set, Quiz, Test, User

class NotificationFilter(filters.FilterSet):
    class Meta:
        model = Notification
        # define field search ex: name=xxx, id=yyy
        fields = {
            "is_read": ["exact"],
        }


class SetFilter(filters.FilterSet):
    q = filters.CharFilter(method="filter_by_q", label="Search Set")

    ordering = filters.OrderingFilter(
        fields=(
            ("id", "id"),
            ("title", "title"),
            ("description", "description"),
            ("created_at", "created_at"),
            ("updated_at", "updated_at"),
        ),
        field_labels={
            "id": "ID",
            "title": "Title",
            "description": "Description",
            "created_at": "Created Time",
            "updated_at": "Updated Time",
        }
    )

    class Meta:
        model = Set
        fields = []

    def filter_by_q(self, queryset, name, value):
        if value:
            return queryset.filter(
                Q(title__icontains=value) | Q(description__icontains=value)
            ).distinct()
        return queryset


class QuestionFilter(filters.FilterSet):
    q = filters.CharFilter(method="filter_by_q", label="Search Question")
    type = filters.CharFilter(field_name="type", lookup_expr="exact", db_index=True)
    types = filters.BaseInFilter(field_name="type", lookup_expr="in", db_index=True)

    ordering = filters.OrderingFilter(
        fields=(
            ("id", "id"),
            ("title", "title"),
            ("type", "type"),
            ("created_at", "created_at"),
            ("updated_at", "updated_at"),
        ),
        field_labels={
            "id": "ID",
            "title": "Title",
            "type": "Type",
            "created_at": "Created Time",
            "updated_at": "Updated Time",
        }
    )
    class Meta:
        model = Question
        fields = ["type", "types"]

    def filter_by_q(self, queryset, name, value):
        if not value:
            return queryset

        return queryset.filter(
            Q(title__icontains=value) | Q(type__icontains=value)
        ).distinct()

class QuizQuestionFilter(filters.FilterSet):
    q = filters.CharFilter(method="filter_by_q", label="Search Question")
    type = filters.CharFilter(field_name="type", lookup_expr="exact", db_index=True)
    types = filters.BaseInFilter(field_name="type", lookup_expr="in", db_index=True)

    ordering = filters.OrderingFilter(
        fields=(
            ("id", "id"),
            ("title", "title"),
            ("type", "type"),
            ("created_at", "created_at"),
            ("updated_at", "updated_at"),
        ),
        field_labels={
            "id": "ID",
            "title": "Title",
            "type": "Type",
            "created_at": "Created Time",
            "updated_at": "Updated Time",
        }
    )
    class Meta:
        model = QuizQuestion
        fields = ["type", "types"]

    def filter_by_q(self, queryset, name, value):
        if value:
            return queryset.filter(
                Q(title__icontains=value) | Q(type__icontains=value)
            ).distinct()
        return queryset

class QuizFilter(filters.FilterSet):
    q = filters.CharFilter(method="filter_by_q", label="Search Set")
    ordering = filters.OrderingFilter(
        fields=(
            ("id", "id"),
            ("title", "title"),
            ("description", "description"),
            ("created_at", "created_at"),
            ("updated_at", "updated_at"),
        ),
        field_labels={
            "id": "ID",
            "title": "Title",
            "description": "Description",
            "created_at": "Created Time",
            "updated_at": "Updated Time",
        }
    ) 

    class Meta:
        model = Quiz
        fields = []

    def filter_by_q(self, queryset, name, value):
        if value:
            return queryset.filter(Q(title__icontains=value) | Q(description__icontains=value)).distinct()
        return queryset

class TestFilter(filters.FilterSet):
    q = filters.CharFilter(method="filter_by_q", label="Search Set")
    ordering = filters.OrderingFilter(
        fields=(
            ("id", "id"),
            ("user", "user"),
            ("score", "score"),
            ("status", "status"),
            ("created_at", "created_at"),
            ("updated_at", "updated_at"),
        ),
        field_labels={
            "id": "ID",
            "user": "User",
            "score": "Score",
            "status": "Status",
            "created_at": "Created Time",
            "updated_at": "Updated Time",
        }
    ) 

    class Meta:
        model = Test
        fields = []

    def filter_by_q(self, queryset, name, value):
        if value:
            return queryset.filter(Q(user__icontains=value)| Q(score__icontains=value) | Q(status__icontains=value)).distinct()
        return queryset

class UserFilter(filters.FilterSet):
    q = filters.CharFilter(method="filter_by_q", label="Search Set")
    ordering = filters.OrderingFilter(
        fields=(
            ("id", "id"),
            ("email", "email"),
            ("role", "role"),
            ("first_name", "first_name"),
            ("last_name", "last_name"),
            ("created_at", "created_at"),
            ("updated_at", "updated_at"),
        ),
        field_labels={
            "id": "ID",
            "email": "Email",
            "role": "Role",
            "first_name": "First Name",
            "last_name": "Last Name",
            "created_at": "Created Time",
            "updated_at": "Updated Time",
        }
    )

    class Meta:
        model = User
        fields = []

    def filter_by_q(self, queryset, name, value):
        if value:
            return queryset.filter(Q(email__icontains=value)| Q(role__icontains=value) | Q(first_name__icontains=value) | Q(last_name__icontains=value) ).distinct()
        return queryset