from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Notification, UserProfile

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "role", "created_at")
        read_only_fields = ("id", "created_at")


class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = UserProfile
        fields = ("user", "age_group", "occupation", "sensitivity_level", "location")


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ("id", "message", "is_read", "created_at")


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    age_group = serializers.ChoiceField(choices=UserProfile.AgeGroup.choices)
    occupation = serializers.CharField(max_length=120)
    sensitivity_level = serializers.ChoiceField(choices=UserProfile.SensitivityLevel.choices)
    location = serializers.CharField(max_length=120)

    class Meta:
        model = User
        fields = ("id", "email", "password", "role", "created_at", "age_group", "occupation", "sensitivity_level", "location")
        read_only_fields = ("id", "created_at")

    def create(self, validated_data):
        profile_data = {
            "age_group": validated_data.pop("age_group"),
            "occupation": validated_data.pop("occupation"),
            "sensitivity_level": validated_data.pop("sensitivity_level"),
            "location": validated_data.pop("location"),
        }
        password = validated_data.pop("password")
        user = User.objects.create_user(password=password, **validated_data)
        UserProfile.objects.update_or_create(user=user, defaults=profile_data)
        return user

    def to_representation(self, instance):
        return UserSerializer(instance).data
