import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AirQualityRecord, AirQualityResponse, LocationRecord, RecommendationResponse } from '../models/air-quality.models';

@Injectable({ providedIn: 'root' })
export class AirQualityService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/air-quality`;

  getCurrentAirQuality(lat?: number, lon?: number, city?: string): Observable<AirQualityResponse> {
    let params = new HttpParams();
    if (lat !== undefined && lon !== undefined) {
      params = params.set('lat', lat).set('lon', lon);
    }
    if (city) {
      params = params.set('city', city);
    }
    return this.http.get<AirQualityResponse>(`${this.apiUrl}/`, { params });
  }

  getLatest(): Observable<AirQualityRecord[]> {
    return this.http.get<AirQualityRecord[]>(`${this.apiUrl}/latest/`);
  }

  getLocations(): Observable<LocationRecord[]> {
    return this.http.get<LocationRecord[]>(`${this.apiUrl}/locations/`);
  }

  getRecommendations(aqi: number): Observable<RecommendationResponse> {
    return this.http.get<RecommendationResponse>(`${environment.apiUrl}/recommendations/`, {
      params: new HttpParams().set('aqi', aqi)
    });
  }
}
