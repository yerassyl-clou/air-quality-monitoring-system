import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { LoginPayload, RegisterPayload, TokenResponse } from '../models/auth.models';
import { NotificationRecord, UserProfile } from '../models/profile.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  register(payload: RegisterPayload): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/register/`, payload);
  }

  login(payload: LoginPayload): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.apiUrl}/login/`, payload).pipe(
      tap((tokens) => {
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
      })
    );
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/profile/`);
  }

  getNotifications(): Observable<NotificationRecord[]> {
    return this.http.get<NotificationRecord[]>(`${this.apiUrl}/notifications/`);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
}
