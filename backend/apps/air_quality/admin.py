from django.contrib import admin

from .models import AirQualityData, Location

admin.site.register(Location)
admin.site.register(AirQualityData)
