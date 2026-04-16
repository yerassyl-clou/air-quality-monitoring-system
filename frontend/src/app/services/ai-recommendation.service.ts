import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";

import { environment } from "../../environments/environment";

export interface AIRecommendationResponse {
  risk: number;
  ai_text: string;
}

@Injectable({ providedIn: "root" })
export class AIRecommendationService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/recommendations/ai/`;

  getAIRecommendation(
    aqi: number,
    pm25: number,
    pm10: number,
    lang: "en" | "ru" | "kz",
  ): Observable<AIRecommendationResponse> {
    return this.http.post<AIRecommendationResponse>(this.endpoint, { aqi, pm25, pm10, lang });
  }
}
