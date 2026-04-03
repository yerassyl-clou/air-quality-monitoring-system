import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ReportPayload, ReportRecord } from '../models/report.models';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/reports`;

  list(): Observable<ReportRecord[]> {
    return this.http.get<ReportRecord[]>(`${this.apiUrl}/`);
  }

  submit(payload: ReportPayload): Observable<ReportRecord> {
    return this.http.post<ReportRecord>(`${this.apiUrl}/`, payload);
  }
}
