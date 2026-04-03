from apps.recommendations.models import Recommendation


BASE_MESSAGES = [
    {"aqi_min": 0, "aqi_max": 49, "message": "Safe", "risk_level": "safe"},
    {"aqi_min": 50, "aqi_max": 100, "message": "Moderate", "risk_level": "moderate"},
    {"aqi_min": 101, "aqi_max": 150, "message": "Limit outdoor activity", "risk_level": "high"},
    {"aqi_min": 151, "aqi_max": 500, "message": "Avoid outdoor activity", "risk_level": "very_high"},
]

SENSITIVITY_SUFFIX = {
    "normal": "Maintain regular precautions.",
    "asthma": "Use a mask, keep medication nearby, and avoid exertion.",
    "athlete": "Reduce workout intensity and prefer indoor exercise.",
}


def get_band_for_aqi(aqi: int) -> dict:
    for band in BASE_MESSAGES:
        if band["aqi_min"] <= aqi <= band["aqi_max"]:
            return band
    return BASE_MESSAGES[-1]


def build_personalized_recommendation(aqi: int, sensitivity_level: str) -> dict:
    band = get_band_for_aqi(aqi)
    db_recommendation = Recommendation.objects.filter(aqi_min__lte=aqi, aqi_max__gte=aqi).first()
    message = db_recommendation.message if db_recommendation else band["message"]
    return {
        "aqi": aqi,
        "risk_level": (db_recommendation.risk_level if db_recommendation else band["risk_level"]),
        "message": f"{message} {SENSITIVITY_SUFFIX.get(sensitivity_level, SENSITIVITY_SUFFIX['normal'])}",
        "sensitivity_level": sensitivity_level,
    }
