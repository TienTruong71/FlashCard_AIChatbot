from rest_framework import serializers
from core.models import QuizShare, User

class ShareItemSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    permission = serializers.ChoiceField(
        choices=QuizShare.PERMISSION_CHOICES,
        required=True
    )

class ShareQuizSerializer(serializers.Serializer):
    shares = ShareItemSerializer(many =True)

    def validate_shares(self, value):

        if not value:
            raise serializers.ValidationError("Share cannot be empty!")

        user_ids = [item["user_id"] for item in value]

        if len(user_ids) != len(set(user_ids)):
            raise serializers.ValidationError("Duplicate user ids detected!")

        if any(uid <= 0 for uid in user_ids):
            raise serializers.ValidationError("Invalid user id!")

        existing_user_ids = User.objects.filter(id__in=user_ids).values_list('id', flat=True)
        missing_ids = set(user_ids) - set(existing_user_ids)
        
        if missing_ids:
            raise serializers.ValidationError(f"User with ID(s) {list(missing_ids)} does not exist!")

        return value