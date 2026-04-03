from django.urls import path

from .views import AirQualityAggregateView, AirQualityLatestView, LocationListView

urlpatterns = [
    path("", AirQualityAggregateView.as_view(), name="air-quality-aggregate"),
    path("latest/", AirQualityLatestView.as_view(), name="air-quality-latest"),
    path("locations/", LocationListView.as_view(), name="air-quality-locations"),
]
