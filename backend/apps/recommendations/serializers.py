from rest_framework import serializers

from .models import Recommendation


class RecommendationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recommendation
        fields = ("id", "aqi_min", "aqi_max", "message", "risk_level")
