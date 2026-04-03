from django.db import models


class Location(models.Model):
    name = models.CharField(max_length=150)
    city = models.CharField(max_length=120)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)

    class Meta:
        ordering = ["city", "name"]
        unique_together = ("name", "city", "latitude", "longitude")

    def __str__(self) -> str:
        return f"{self.city} - {self.name}"


class AirQualityData(models.Model):
    class Sources(models.TextChoices):
        OPENAQ = "OpenAQ", "OpenAQ"
        WAQI = "WAQI", "WAQI"
        AIR_KZ = "air.org.kz", "air.org.kz"
        IQAIR = "IQAir", "IQAir"

    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name="air_quality_records", null=True, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    aqi = models.PositiveIntegerField()
    pm25 = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    pm10 = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    source = models.CharField(max_length=20, choices=Sources.choices)
    timestamp = models.DateTimeField()

    class Meta:
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["source", "timestamp"]),
            models.Index(fields=["latitude", "longitude"]),
        ]

    def __str__(self) -> str:
        return f"{self.source} AQI {self.aqi}"
