from rest_framework import serializers

from .models import Recommendation


class RecommendationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recommendation
        fields = ("id", "aqi_min", "aqi_max", "message", "risk_level")


class AIRecommendationRequestSerializer(serializers.Serializer):
    aqi = serializers.FloatField()
    pm25 = serializers.FloatField()
    pm10 = serializers.FloatField()
    lang = serializers.ChoiceField(choices=("en", "ru", "kz"), default="en")
