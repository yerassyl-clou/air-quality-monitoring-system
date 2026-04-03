from django.db import models


class Recommendation(models.Model):
    class RiskLevel(models.TextChoices):
        SAFE = "safe", "Safe"
        MODERATE = "moderate", "Moderate"
        HIGH = "high", "High"
        VERY_HIGH = "very_high", "Very High"

    aqi_min = models.PositiveIntegerField()
    aqi_max = models.PositiveIntegerField()
    message = models.TextField()
    risk_level = models.CharField(max_length=20, choices=RiskLevel.choices)

    class Meta:
        ordering = ["aqi_min"]

    def __str__(self) -> str:
        return f"{self.aqi_min}-{self.aqi_max}"
