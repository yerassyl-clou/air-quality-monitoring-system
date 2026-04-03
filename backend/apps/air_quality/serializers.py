from rest_framework import serializers

from .models import AirQualityData, Location


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ("id", "name", "city", "latitude", "longitude")


class AirQualityDataSerializer(serializers.ModelSerializer):
    location = LocationSerializer(read_only=True)

    class Meta:
        model = AirQualityData
        fields = ("id", "location", "latitude", "longitude", "aqi", "pm25", "pm10", "source", "timestamp")
