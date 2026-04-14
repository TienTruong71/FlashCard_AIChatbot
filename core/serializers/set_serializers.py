from rest_framework import serializers
from core.serializers.question_serializers import QuestionSerializer
from core.models import Set, SetShare
from core.constant import PermissionEnum


class SetSerializer(serializers.ModelSerializer):

    questions = QuestionSerializer(many=True, read_only=True)
    permission = serializers.SerializerMethodField()

    class Meta:
        model = Set
        fields = [
            "id",
            "title",
            "description",
            "is_public",
            "user",
            "questions",
            "permission",
            "created_at"
        ]

    def get_permission(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        
        if obj.user == request.user:
            return "edit"
        
        share = SetShare.objects.filter(set=obj, user=request.user).first()
        if share:
            return share.permission
        
        return None


class CreateSetSerializer(serializers.ModelSerializer):

    title = serializers.CharField(
        required=True,
        max_length=255,
        error_messages={
            "required": "Please enter title!",
            "max_length": "Title cannot exceed 255 characters!",
        },
    )

    description = serializers.CharField(
        required=False,
        allow_blank=True,
    )

    class Meta:
        model = Set
        fields =[
            "title",
            "description",
        ]


class UpdateSetSerializer(serializers.ModelSerializer):

    title = serializers.CharField(
        required=False,
        max_length=255,
        error_messages={
            "blank" : "Title cannot be empty!",
            "max_length": "Title cannot exceed 255 characters!",
        },
    )

    description = serializers.CharField(
        required=False,
        error_messages={
            "blank": "description cannot be empty!",
        },
    )

    class Meta:
        model = Set
        fields = [
            "title",
            "description",
        ]


