export interface LocationRecord {
  id: number;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
}

export interface RecommendationPayload {
  aqi: number;
  risk: number;
  risk_level: string;
  message: string;
  sensitivity_level: string;
}

export interface RecommendationRule {
  aqi_min: number;
  aqi_max: number;
  message: string;
  risk_level: string;
}

export interface AirQualityRecord {
  id: number;
  latitude: number;
  longitude: number;
  aqi: number;
  pm25: number | null;
  pm10: number | null;
  source: string;
  timestamp: string;
  location?: LocationRecord;
}

export interface AirQualityResponse {
  air_quality: AirQualityRecord;
  recommendation: RecommendationPayload;
}

export interface RecommendationResponse {
  rules: RecommendationRule[];
  personalized: RecommendationPayload;
}
