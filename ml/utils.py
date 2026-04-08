from pathlib import Path
from typing import Optional

import joblib
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model.pkl"

FEATURE_COLUMNS = ["aqi", "pm25", "pm10", "age_group", "sensitivity"]
_MODEL = None


def _load_model():
    global _MODEL
    if _MODEL is None:
        _MODEL = joblib.load(MODEL_PATH)
    return _MODEL


def normalize_age_group(age_group: Optional[str]) -> str:
    if age_group in {"18-24", "25-34", "35-44", "45+"}:
        return age_group
    if age_group == "child":
        return "18-24"
    if age_group == "adult":
        return "25-34"
    if age_group == "senior":
        return "45+"
    return "25-34"


def normalize_sensitivity(sensitivity: Optional[str]) -> str:
    if sensitivity in {"low", "medium", "high"}:
        return sensitivity
    if sensitivity == "normal":
        return "low"
    if sensitivity == "athlete":
        return "medium"
    if sensitivity == "asthma":
        return "high"
    return "medium"


def predict_risk(aqi, pm25, pm10, age_group, sensitivity) -> int:
    model = _load_model()
    row = pd.DataFrame(
        [
            {
                "aqi": float(aqi),
                "pm25": float(pm25) if pm25 is not None else 0.0,
                "pm10": float(pm10) if pm10 is not None else 0.0,
                "age_group": normalize_age_group(age_group),
                "sensitivity": normalize_sensitivity(sensitivity),
            }
        ],
        columns=FEATURE_COLUMNS,
    )
    return int(model.predict(row)[0])
