from rest_framework import serializers
from core.models import SetShare

class ShareItemSerializer(serializers.Serializer):
    user_ids = serializers.IntegerField()
    permission  = serializers.ChoiceField(
            choices=SetShare.PERMISSION_CHOICES,
            required=True
        )



class ShareSetSerializer(serializers.Serializer):

    shares = ShareItemSerializer(many=True)

    def validate_shares(self, value):
        if not value:
            raise serializers.ValidationError("Share cannot be empty!")

        user_ids = [item["user_id"] for item in value]

        if len(user_ids) != len(set(user_ids)):
            raise serializers.ValidationError("Duplicate user ids detected!")

        if any(uid <= 0 for uid in user_ids):
            raise serializers.ValidationError("Invalid user id!")

        return value

