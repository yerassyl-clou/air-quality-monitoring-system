from requests import RequestException
from datetime import timedelta
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.integrations.services import get_best_data
from apps.recommendations.services import build_personalized_recommendation

from .models import AirQualityData, Location
from .serializers import AirQualityDataSerializer, LocationSerializer

DEFAULT_CITY_LOCATIONS = {
    "Almaty": {"name": "Almaty Center", "latitude": 43.238949, "longitude": 76.889709, "aqi": 118, "pm25": 42.5, "pm10": 58.0},
    "Astana": {"name": "Astana Center", "latitude": 51.169392, "longitude": 71.449074, "aqi": 84, "pm25": 26.0, "pm10": 37.0},
    "Shymkent": {"name": "Shymkent Center", "latitude": 42.341685, "longitude": 69.590103, "aqi": 96, "pm25": 31.0, "pm10": 45.0},
    "Karaganda": {"name": "Karaganda Center", "latitude": 49.806755, "longitude": 73.085449, "aqi": 132, "pm25": 47.0, "pm10": 63.0},
}


class AirQualityAggregateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        latitude = request.query_params.get("lat")
        longitude = request.query_params.get("lon")
        city = request.query_params.get("city", getattr(request.user.profile, "location", "Almaty"))
        city_config = DEFAULT_CITY_LOCATIONS.get(city, DEFAULT_CITY_LOCATIONS["Almaty"])

        if not latitude or not longitude:
            location = Location.objects.filter(city__iexact=city).first()
            if not location:
                latitude = city_config["latitude"]
                longitude = city_config["longitude"]
            else:
                latitude = float(location.latitude)
                longitude = float(location.longitude)
        else:
            latitude = float(latitude)
            longitude = float(longitude)

        try:
            best = get_best_data(latitude=latitude, longitude=longitude)
            print(f"[air_quality] external source selected={best['source']} values={best}")
        except (RequestException, ValueError, TypeError, AttributeError):
            print(f"[air_quality] using fallback city defaults for city={city}")
            best = {
                "lat": latitude,
                "lon": longitude,
                "aqi": city_config["aqi"],
                "pm25": city_config["pm25"],
                "pm10": city_config["pm10"],
                "source": "air.org.kz",
            }
        location, _ = Location.objects.get_or_create(
            city=city,
            name=request.query_params.get("name", city_config["name"]),
            latitude=latitude,
            longitude=longitude,
        )
        air_quality = AirQualityData.objects.create(
            location=location,
            latitude=best["lat"],
            longitude=best["lon"],
            aqi=best["aqi"],
            pm25=best.get("pm25"),
            pm10=best.get("pm10"),
            source=best["source"],
            timestamp=timezone.now(),
        )
        recommendation = build_personalized_recommendation(
            aqi=best["aqi"],
            pm25=best.get("pm25"),
            pm10=best.get("pm10"),
            age_group=request.user.profile.age_group,
            sensitivity_level=request.user.profile.sensitivity_level,
        )
        return Response(
            {
                "air_quality": AirQualityDataSerializer(air_quality).data,
                "recommendation": recommendation,
            }
        )


class AirQualityLatestView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    SNAPSHOT_TTL = timedelta(minutes=30)

    def get(self, request):
        self._ensure_default_locations()
        self._refresh_live_snapshots()
        queryset = (
            AirQualityData.objects.select_related("location")
            .order_by("location_id", "-timestamp")
            .distinct("location_id")
        )
        return Response(AirQualityDataSerializer(queryset, many=True).data)

    def _ensure_default_locations(self):
        for city, config in DEFAULT_CITY_LOCATIONS.items():
            Location.objects.get_or_create(
                city=city,
                name=config["name"],
                latitude=config["latitude"],
                longitude=config["longitude"],
            )

    def _refresh_live_snapshots(self):
        for location in Location.objects.all()[:10]:
            latest_for_location = (
                AirQualityData.objects.filter(location=location)
                .order_by("-timestamp")
                .first()
            )
            if latest_for_location and timezone.now() - latest_for_location.timestamp < self.SNAPSHOT_TTL:
                continue

            city_config = DEFAULT_CITY_LOCATIONS.get(
                location.city,
                {
                    "aqi": 75,
                    "pm25": 20.0,
                    "pm10": 30.0,
                },
            )
            try:
                best = get_best_data(float(location.latitude), float(location.longitude))
                print(f"[air_quality] latest snapshot source selected={best['source']} city={location.city} values={best}")
            except (RequestException, ValueError, TypeError, AttributeError):
                print(f"[air_quality] latest snapshot fallback used for city={location.city}")
                best = {
                    "lat": float(location.latitude),
                    "lon": float(location.longitude),
                    "aqi": city_config["aqi"],
                    "pm25": city_config["pm25"],
                    "pm10": city_config["pm10"],
                    "source": "air.org.kz",
                }

            AirQualityData.objects.create(
                location=location,
                latitude=best["lat"],
                longitude=best["lon"],
                aqi=best["aqi"],
                pm25=best.get("pm25"),
                pm10=best.get("pm10"),
                source=best["source"],
                timestamp=timezone.now(),
            )


class LocationListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not Location.objects.exists():
            for city, config in DEFAULT_CITY_LOCATIONS.items():
                Location.objects.get_or_create(
                    city=city,
                    name=config["name"],
                    latitude=config["latitude"],
                    longitude=config["longitude"],
                )
        queryset = Location.objects.all()
        return Response(LocationSerializer(queryset, many=True).data)
