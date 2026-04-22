from rest_framework import serializers
from core.models import SetShare, User

class SetShareSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source='user.email')

    class Meta:
        model = SetShare
        fields = [
            "id",
            "user",
            "user_email",
            "permission",
            "created_at",
        ]


class ShareItemSerializer(serializers.Serializer):
    email = serializers.EmailField()
    permission  = serializers.ChoiceField(
            choices=SetShare.PERMISSION_CHOICES,
            required=True
        )


class ShareSetSerializer(serializers.Serializer):

    shares = ShareItemSerializer(many=True)

    def validate_shares(self, value):
        if not value:
            raise serializers.ValidationError("Share cannot be empty!")

        emails = [item["email"] for item in value]

        if len(emails) != len(set(emails)):
            raise serializers.ValidationError("Duplicate emails detected!")

        missing_emails = []
        for email in emails:
            if not User.objects.filter(email=email).exists():
                missing_emails.append(email)
        
        if missing_emails:
            raise serializers.ValidationError(f"User with Email(s) {missing_emails} does not exist!")

        return value

