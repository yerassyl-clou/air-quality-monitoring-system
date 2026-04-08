import sys
from pathlib import Path
from typing import Optional

from apps.recommendations.models import Recommendation

PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

try:
    from ml.utils import predict_risk
except Exception:
    predict_risk = None


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

RISK_BANDS = {
    0: {"message": "Safe", "risk_level": "safe"},
    1: {"message": "Moderate", "risk_level": "moderate"},
    2: {"message": "Limit outdoor activity", "risk_level": "high"},
    3: {"message": "Avoid outdoor activity", "risk_level": "very_high"},
}


def get_band_for_aqi(aqi: int) -> dict:
    for band in BASE_MESSAGES:
        if band["aqi_min"] <= aqi <= band["aqi_max"]:
            return band
    return BASE_MESSAGES[-1]


def fallback_risk_for_aqi(aqi: int, pm25: Optional[float], sensitivity_level: str) -> int:
    band = get_band_for_aqi(aqi)
    risk = BASE_MESSAGES.index(band)
    if sensitivity_level in {"asthma", "high"}:
        risk += 1
    if pm25 is not None and float(pm25) > 100:
        risk += 1
    return min(risk, 3)


def build_personalized_recommendation(
    aqi: int,
    sensitivity_level: str,
    pm25: Optional[float] = None,
    pm10: Optional[float] = None,
    age_group: Optional[str] = None,
) -> dict:
    try:
        risk = predict_risk(
            aqi=aqi,
            pm25=pm25 or 0,
            pm10=pm10 or 0,
            age_group=age_group,
            sensitivity=sensitivity_level,
        ) if predict_risk else fallback_risk_for_aqi(aqi, pm25, sensitivity_level)
    except Exception:
        risk = fallback_risk_for_aqi(aqi, pm25, sensitivity_level)

    risk_band = RISK_BANDS[risk]
    db_recommendation = Recommendation.objects.filter(aqi_min__lte=aqi, aqi_max__gte=aqi).first()
    message = db_recommendation.message if db_recommendation else risk_band["message"]
    return {
        "aqi": aqi,
        "risk": risk,
        "risk_level": (db_recommendation.risk_level if db_recommendation else risk_band["risk_level"]),
        "message": f"{message} {SENSITIVITY_SUFFIX.get(sensitivity_level, SENSITIVITY_SUFFIX['normal'])}",
        "sensitivity_level": sensitivity_level,
    }
