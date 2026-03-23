from rest_framework import serializers
from core.models import SetShare


class ShareSetSerializer(serializers.ModelSerializer):

    user_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=True
    )

    permission  = serializers.ChoiceField(
        choice=["view", "edit"],
        required=True
    )

    class Meta:
        model = SetShare
        fields = [
            "user_ids",
            "permission",
        ]
    
    def validate_user_ids(self, value):
        if not value:
            raise serializers.ValidationError("User_ids cannot be empty!")
        return value

    def validate_user_ids(self, value):
        if len(value) != len(set(value)):
            raise serializers.ValidationError("Duplicate user ids detected! ")