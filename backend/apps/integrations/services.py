import logging
from statistics import mean

import requests
from django.conf import settings


REQUEST_TIMEOUT = 10
OPEN_METEO_API_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"
logger = logging.getLogger(__name__)


def _debug_response(source: str, response: requests.Response) -> None:
    print(f"[air_quality] {source} status={response.status_code}")
    print(f"[air_quality] {source} body={response.text[:600]}")


def _debug_failure(source: str, error: Exception) -> None:
    print(f"[air_quality] {source} failed: {error}")
    logger.exception("%s integration failed", source)


def fetch_from_openaq(latitude: float, longitude: float) -> dict:
    response = requests.get(
        f"{settings.OPENAQ_API_URL}/locations",
        params={"coordinates": f"{latitude},{longitude}", "radius": 5000, "limit": 1},
        timeout=REQUEST_TIMEOUT,
    )
    _debug_response("OpenAQ", response)
    response.raise_for_status()
    payload = response.json()
    result = (payload.get("results") or [{}])[0]
    sensors = result.get("sensors", [])
    pm25 = next((sensor.get("lastValue") for sensor in sensors if sensor.get("parameter") == "pm25"), None)
    pm10 = next((sensor.get("lastValue") for sensor in sensors if sensor.get("parameter") == "pm10"), None)
    return normalize_data(
        {
            "lat": result.get("coordinates", {}).get("latitude", latitude),
            "lon": result.get("coordinates", {}).get("longitude", longitude),
            "aqi": calculate_aqi_from_pm25(pm25),
            "pm25": pm25,
            "pm10": pm10,
            "source": "OpenAQ",
        }
    )


def fetch_from_waqi(latitude: float, longitude: float) -> dict:
    if not settings.WAQI_TOKEN:
        raise ValueError("WAQI token is not configured")
    response = requests.get(
        settings.WAQI_API_URL.format(lat=latitude, lon=longitude),
        params={"token": settings.WAQI_TOKEN},
        timeout=REQUEST_TIMEOUT,
    )
    _debug_response("WAQI", response)
    response.raise_for_status()
    raw_payload = response.json()
    if raw_payload.get("status") != "ok":
        raise ValueError(f"WAQI returned status={raw_payload.get('status')}")
    payload = raw_payload.get("data", {})
    iaqi = payload.get("iaqi", {})
    return normalize_data(
        {
            "lat": payload.get("city", {}).get("geo", [latitude, longitude])[0],
            "lon": payload.get("city", {}).get("geo", [latitude, longitude])[1],
            "aqi": payload.get("aqi"),
            "pm25": (iaqi.get("pm25") or {}).get("v"),
            "pm10": (iaqi.get("pm10") or {}).get("v"),
            "source": "WAQI",
        }
    )


def fetch_from_air_kz(latitude: float, longitude: float) -> dict:
    response = requests.get(
        f"{settings.AIR_KZ_API_URL}/measurements/nearest/",
        params={"lat": latitude, "lon": longitude},
        headers={"Authorization": f"Bearer {settings.AIR_KZ_TOKEN}"} if settings.AIR_KZ_TOKEN else {},
        timeout=REQUEST_TIMEOUT,
    )
    _debug_response("air.org.kz", response)
    response.raise_for_status()
    payload = response.json()
    return normalize_data(
        {
            "lat": payload.get("latitude", latitude),
            "lon": payload.get("longitude", longitude),
            "aqi": payload.get("aqi"),
            "pm25": payload.get("pm25"),
            "pm10": payload.get("pm10"),
            "source": "air.org.kz",
        }
    )


def fetch_from_iqair(latitude: float, longitude: float) -> dict:
    if not settings.IQAIR_API_KEY:
        raise ValueError("IQAir API key is not configured")
    response = requests.get(
        settings.IQAIR_API_URL,
        params={"lat": latitude, "lon": longitude, "key": settings.IQAIR_API_KEY},
        timeout=REQUEST_TIMEOUT,
    )
    _debug_response("IQAir", response)
    response.raise_for_status()
    payload = response.json().get("data", {})
    pollution = payload.get("current", {}).get("pollution", {})
    weather = payload.get("location", {}).get("coordinates", [])
    return normalize_data(
        {
            "lat": weather[1] if len(weather) > 1 else latitude,
            "lon": weather[0] if weather else longitude,
            "aqi": pollution.get("aqius"),
            "pm25": pollution.get("p2"),
            "pm10": pollution.get("p1"),
            "source": "IQAir",
        }
    )


def fetch_from_open_meteo(latitude: float, longitude: float) -> dict:
    response = requests.get(
        OPEN_METEO_API_URL,
        params={
            "latitude": latitude,
            "longitude": longitude,
            "current": "us_aqi,pm2_5,pm10",
            "timezone": "auto",
        },
        timeout=REQUEST_TIMEOUT,
    )
    _debug_response("Open-Meteo", response)
    response.raise_for_status()
    payload = response.json().get("current", {})
    return normalize_data(
        {
            "lat": latitude,
            "lon": longitude,
            "aqi": payload.get("us_aqi"),
            "pm25": payload.get("pm2_5"),
            "pm10": payload.get("pm10"),
            "source": "Open-Meteo",
        }
    )


def normalize_data(raw: dict) -> dict:
    aqi_value = raw.get("aqi")
    pm25_value = raw.get("pm25")
    pm10_value = raw.get("pm10")
    if aqi_value in (None, "") and pm25_value is None and pm10_value is None:
        raise ValueError("No usable air-quality values returned")
    return {
        "lat": float(raw.get("lat")),
        "lon": float(raw.get("lon")),
        "aqi": int(float(aqi_value)) if aqi_value not in (None, "") else calculate_aqi_from_pm25(pm25_value),
        "pm25": float(pm25_value) if pm25_value is not None else None,
        "pm10": float(pm10_value) if pm10_value is not None else None,
        "source": raw.get("source"),
    }


def merge_sources(*sources: dict) -> dict:
    valid_sources = [source for source in sources if source and source.get("aqi") is not None]
    if not valid_sources:
        raise ValueError("No source data available")
    best = min(valid_sources, key=lambda item: source_priority(item["source"]))
    merged = {
        "lat": best["lat"],
        "lon": best["lon"],
        "aqi": round(mean([item["aqi"] for item in valid_sources])),
        "pm25": first_non_null(valid_sources, "pm25"),
        "pm10": first_non_null(valid_sources, "pm10"),
        "source": best["source"],
    }
    return merged


def get_best_data(latitude: float, longitude: float) -> dict:
    collected = []
    for fetcher in (fetch_from_air_kz, fetch_from_waqi, fetch_from_openaq, fetch_from_iqair, fetch_from_open_meteo):
        try:
            result = fetcher(latitude, longitude)
            print(f"[air_quality] {fetcher.__name__} normalized={result}")
            collected.append(result)
        except (requests.RequestException, KeyError, ValueError, TypeError, AttributeError) as error:
            _debug_failure(fetcher.__name__, error)
            continue
    return merge_sources(*collected)


def calculate_aqi_from_pm25(pm25: float | None) -> int:
    if pm25 is None:
        return 0
    if pm25 <= 12:
        return 50
    if pm25 <= 35.4:
        return 100
    if pm25 <= 55.4:
        return 150
    return 200


def source_priority(source: str) -> int:
    priority = {"air.org.kz": 0, "WAQI": 1, "OpenAQ": 2, "IQAir": 3, "Open-Meteo": 4}
    return priority.get(source, 99)


def first_non_null(items: list[dict], field: str):
    for item in items:
        if item.get(field) is not None:
            return item[field]
    return None
