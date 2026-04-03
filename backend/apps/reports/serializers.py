from rest_framework import serializers

from apps.air_quality.models import Location
from apps.air_quality.serializers import LocationSerializer

from .models import Report


class ReportSerializer(serializers.ModelSerializer):
    location = LocationSerializer(read_only=True)
    location_id = serializers.PrimaryKeyRelatedField(source="location", queryset=Location.objects.all(), write_only=True)

    class Meta:
        model = Report
        fields = ("id", "user", "location", "location_id", "description", "status", "created_at")
        read_only_fields = ("id", "user", "status", "created_at")

    def create(self, validated_data):
        return Report.objects.create(user=self.context["request"].user, **validated_data)
