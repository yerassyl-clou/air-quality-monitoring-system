import csv
import os
import random
import time
from pathlib import Path
from typing import Any, Dict, Optional, Union

import requests

BASE_DIR = Path(__file__).resolve().parent
DATASET_PATH = BASE_DIR / "dataset.csv"

TARGET_ROWS = int(os.getenv("ML_TARGET_ROWS", "1000"))
REQUEST_TIMEOUT = 8
MAX_RETRIES = 2

AGE_GROUPS = ["18-24", "25-34", "35-44", "45+"]
SENSITIVITY_LEVELS = ["low", "medium", "high"]

COORDINATES = [
    ("Delhi", 28.613939, 77.209023),
    ("Beijing", 39.904202, 116.407394),
    ("Shanghai", 31.230391, 121.473701),
    ("Cairo", 30.044420, 31.235712),
    ("Dubai", 25.204849, 55.270782),
    ("Bangkok", 13.756331, 100.501762),
    ("Mexico City", 19.432608, -99.133209),
    ("Istanbul", 41.008240, 28.978359),
    ("Almaty", 43.238949, 76.889709),
    ("Astana", 51.169392, 71.449074),
    ("Shymkent", 42.341685, 69.590103),
    ("Karaganda", 49.806755, 73.085449),
    ("London", 51.507351, -0.127758),
    ("Paris", 48.856613, 2.352222),
    ("Berlin", 52.520008, 13.404954),
    ("Warsaw", 52.229676, 21.012229),
    ("Madrid", 40.416775, -3.703790),
    ("Rome", 41.902782, 12.496366),
    ("Seoul", 37.566536, 126.977966),
    ("Tokyo", 35.676193, 139.650311),
    ("Singapore", 1.352083, 103.819839),
    ("Sydney", -33.868820, 151.209290),
    ("New York", 40.712776, -74.005974),
    ("Los Angeles", 34.052235, -118.243683),
    ("Sao Paulo", -23.550520, -46.633308),
]


def request_json(
    url: str,
    params: Optional[Dict[str, Any]] = None,
    headers: Optional[Dict[str, str]] = None,
) -> Optional[Dict[str, Any]]:
    for attempt in range(MAX_RETRIES + 1):
        try:
            response = requests.get(url, params=params, headers=headers, timeout=REQUEST_TIMEOUT)
            response.raise_for_status()
            payload = response.json()
            if isinstance(payload, dict):
                return payload
        except (requests.RequestException, ValueError):
            if attempt < MAX_RETRIES:
                time.sleep(1 + attempt)
    return None


def calculate_aqi_from_pm25(pm25: float) -> int:
    if pm25 <= 12:
        return round((50 / 12) * pm25)
    if pm25 <= 35.4:
        return round(51 + ((pm25 - 12.1) * (49 / 23.3)))
    if pm25 <= 55.4:
        return round(101 + ((pm25 - 35.5) * (49 / 19.9)))
    if pm25 <= 150.4:
        return round(151 + ((pm25 - 55.5) * (49 / 94.9)))
    if pm25 <= 250.4:
        return round(201 + ((pm25 - 150.5) * (99 / 99.9)))
    return min(500, round(301 + ((pm25 - 250.5) * (199 / 249.5))))


def risk_label(aqi: int, pm25: float, sensitivity: str) -> int:
    if aqi < 50:
        risk = 0
    elif aqi < 100:
        risk = 1
    elif aqi < 150:
        risk = 2
    else:
        risk = 3

    if sensitivity == "high":
        risk += 1
    if pm25 > 100:
        risk += 1
    return min(risk, 3)


def build_row(
    aqi: Optional[Union[float, int]],
    pm25: Optional[Union[float, int]],
    pm10: Optional[Union[float, int]],
    lat: float,
    lon: float,
    source: str,
) -> Optional[Dict[str, Any]]:
    if pm25 is None or pm10 is None:
        return None

    pm25_value = float(pm25)
    pm10_value = float(pm10)
    aqi_value = int(float(aqi)) if aqi not in (None, "-") else calculate_aqi_from_pm25(pm25_value)

    if aqi_value <= 0 or pm25_value < 0 or pm10_value < 0:
        return None

    age_group = random.choice(AGE_GROUPS)
    sensitivity = random.choice(SENSITIVITY_LEVELS)

    return {
        "aqi": aqi_value,
        "pm25": round(pm25_value, 2),
        "pm10": round(pm10_value, 2),
        "lat": round(float(lat), 6),
        "lon": round(float(lon), 6),
        "source": source,
        "age_group": age_group,
        "sensitivity": sensitivity,
        "risk": risk_label(aqi_value, pm25_value, sensitivity),
    }


def collect_from_openaq(rows: list[dict[str, Any]], target_rows: int) -> None:
    api_key = os.getenv("OPENAQ_API_KEY", "").strip()
    if not api_key:
        print("OpenAQ API key not configured; skipping OpenAQ.", flush=True)
        return

    headers = {"X-API-Key": api_key} if api_key else None

    for _, lat, lon in COORDINATES:
        if len(rows) >= target_rows:
            return

        payload = request_json(
            "https://api.openaq.org/v3/locations",
            params={"coordinates": f"{lat},{lon}", "radius": 25000, "limit": 20},
            headers=headers,
        )
        if not payload or "results" not in payload:
            continue

        for location in payload.get("results", []):
            coordinates = location.get("coordinates") or {}
            sensors = location.get("sensors") or []
            pm25 = next((sensor.get("lastValue") for sensor in sensors if sensor.get("parameter", {}).get("name") in {"pm25", "PM2.5"}), None)
            pm10 = next((sensor.get("lastValue") for sensor in sensors if sensor.get("parameter", {}).get("name") in {"pm10", "PM10"}), None)
            row = build_row(None, pm25, pm10, coordinates.get("latitude", lat), coordinates.get("longitude", lon), "OpenAQ")
            if row:
                rows.append(row)
                print(f"rows={len(rows)} source=OpenAQ", flush=True)
            if len(rows) >= target_rows:
                return


def collect_from_open_meteo(rows: list[dict[str, Any]], target_rows: int) -> None:
    for city, lat, lon in COORDINATES:
        if len(rows) >= target_rows:
            return

        payload = request_json(
            "https://air-quality-api.open-meteo.com/v1/air-quality",
            params={
                "latitude": lat,
                "longitude": lon,
                "hourly": "pm10,pm2_5,us_aqi",
                "past_days": 7,
                "forecast_days": 1,
                "timezone": "UTC",
            },
        )
        hourly = (payload or {}).get("hourly") or {}
        pm25_values = hourly.get("pm2_5") or []
        pm10_values = hourly.get("pm10") or []
        aqi_values = hourly.get("us_aqi") or []

        for pm25, pm10, aqi in zip(pm25_values, pm10_values, aqi_values):
            row = build_row(aqi, pm25, pm10, lat, lon, "Open-Meteo")
            if row:
                rows.append(row)
                print(f"rows={len(rows)} source=Open-Meteo city={city}", flush=True)
            if len(rows) >= target_rows:
                return


def collect_from_waqi(rows: list[dict[str, Any]], target_rows: int) -> None:
    token = os.getenv("WAQI_TOKEN", "demo").strip() or "demo"

    for _, lat, lon in COORDINATES:
        if len(rows) >= target_rows:
            return

        payload = request_json(f"https://api.waqi.info/feed/geo:{lat};{lon}/", params={"token": token})
        if not payload or payload.get("status") != "ok":
            continue

        data = payload.get("data") or {}
        iaqi = data.get("iaqi") or {}
        city_geo = (data.get("city") or {}).get("geo") or [lat, lon]
        row = build_row(
            data.get("aqi"),
            (iaqi.get("pm25") or {}).get("v"),
            (iaqi.get("pm10") or {}).get("v"),
            city_geo[0],
            city_geo[1],
            "WAQI",
        )
        if row:
            rows.append(row)
            print(f"rows={len(rows)} source=WAQI", flush=True)


def dedupe_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen = set()
    unique_rows = []
    for row in rows:
        key = (row["aqi"], row["pm25"], row["pm10"], row["lat"], row["lon"], row["source"], row["age_group"], row["sensitivity"])
        if key in seen:
            continue
        seen.add(key)
        unique_rows.append(row)
    return unique_rows


def main() -> None:
    rows: list[dict[str, Any]] = []

    print("Collecting from OpenAQ...", flush=True)
    collect_from_openaq(rows, TARGET_ROWS)

    if len(rows) < TARGET_ROWS:
        print("Collecting from Open-Meteo real air-quality API...", flush=True)
        collect_from_open_meteo(rows, TARGET_ROWS * 5)

    if len(rows) < TARGET_ROWS:
        print("Collecting from WAQI...", flush=True)
        collect_from_waqi(rows, TARGET_ROWS)

    rows = dedupe_rows(rows)
    random.Random(42).shuffle(rows)
    if len(rows) < min(200, TARGET_ROWS):
        raise RuntimeError(f"Not enough real API rows collected: {len(rows)}")

    DATASET_PATH.parent.mkdir(parents=True, exist_ok=True)
    with DATASET_PATH.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=["aqi", "pm25", "pm10", "lat", "lon", "source", "age_group", "sensitivity", "risk"])
        writer.writeheader()
        writer.writerows(rows[:TARGET_ROWS])

    print(f"Saved {min(len(rows), TARGET_ROWS)} rows to {DATASET_PATH}", flush=True)


if __name__ == "__main__":
    main()
