import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject } from '@angular/core';
import * as L from 'leaflet';

import { AirQualityRecord } from '../../../shared/models/air-quality.models';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { AirQualityService } from '../../../shared/services/air-quality.service';
import { TranslationService } from '../../../shared/services/translation.service';

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <section class="page">
      <div class="hero">
        <span class="brand-badge">{{ 'map.badge' | t }}</span>
        <h1>{{ 'map.title' | t }}</h1>
        <p>{{ 'map.text' | t }}</p>
      </div>

      <div class="error-banner" *ngIf="errorMessage">{{ errorMessage }}</div>

      <div class="map-shell">
        <aside class="card">
          <h2>{{ 'map.legend' | t }}</h2>
          <div class="legend">
            <div class="legend-item"><span class="legend-swatch" style="background:#2a9d8f"></span><span>{{ 'legend.safe' | t }}</span></div>
            <div class="legend-item"><span class="legend-swatch" style="background:#e9c46a"></span><span>{{ 'legend.moderate' | t }}</span></div>
            <div class="legend-item"><span class="legend-swatch" style="background:#f4a261"></span><span>{{ 'legend.limitOutdoor' | t }}</span></div>
            <div class="legend-item"><span class="legend-swatch" style="background:#e76f51"></span><span>{{ 'legend.avoidOutdoor' | t }}</span></div>
          </div>

          <div class="stack" style="margin-top: 22px;">
            <h3>{{ 'map.activeMarkers' | t }}</h3>
            <div *ngIf="records.length; else emptyRecords">
              <div class="list-item" *ngFor="let record of records">
                <div class="row">
                  <strong>{{ record.location?.city ?? ('dashboard.unknownCity' | t) }}</strong>
                  <span class="pill">AQI {{ record.aqi }}</span>
                </div>
                <p class="soft">{{ record.location?.name ?? ('dashboard.monitoringPoint' | t) }}</p>
              </div>
            </div>
          </div>
        </aside>

        <section class="card">
          <div id="air-quality-map" style="height: 620px; border-radius: 18px;"></div>
        </section>
      </div>
    </section>

    <ng-template #emptyRecords>
      <div class="empty-state">{{ 'map.noMarkers' | t }}</div>
    </ng-template>
  `
})
export class MapViewComponent implements AfterViewInit {
  private readonly airQualityService = inject(AirQualityService);
  private readonly i18n = inject(TranslationService);
  private map?: L.Map;

  protected records: AirQualityRecord[] = [];
  protected errorMessage = '';

  ngAfterViewInit(): void {
    this.map = L.map('air-quality-map').setView([43.238949, 76.889709], 5.5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.airQualityService.getLatest().subscribe({
      next: (records) => {
        this.records = records;
        records.forEach((record) => this.addMarker(record));
      },
      error: () => {
        this.errorMessage = this.i18n.instant('map.error');
      }
    });
  }

  private addMarker(record: AirQualityRecord): void {
    if (!this.map) {
      return;
    }

    const marker = L.circleMarker([record.latitude, record.longitude], {
      radius: 11,
      color: this.getColor(record.aqi),
      fillColor: this.getColor(record.aqi),
      fillOpacity: 0.9,
      weight: 2
    });

    marker.bindPopup(`
      <strong>${record.location?.city ?? this.i18n.instant('dashboard.monitoringPoint')}</strong><br>
      ${record.location?.name ?? this.i18n.instant('dashboard.monitoringPoint')}<br>
      AQI: ${record.aqi}<br>
      Recommendation: ${this.getRecommendation(record.aqi)}
    `);
    marker.addTo(this.map);
  }

  private getColor(aqi: number): string {
    if (aqi < 50) return '#2a9d8f';
    if (aqi <= 100) return '#e9c46a';
    if (aqi <= 150) return '#f4a261';
    return '#e76f51';
  }

  private getRecommendation(aqi: number): string {
    if (aqi < 50) return this.i18n.instant('value.safe');
    if (aqi <= 100) return this.i18n.instant('value.moderate');
    if (aqi <= 150) return this.i18n.instant('value.limitOutdoor');
    return this.i18n.instant('value.avoidOutdoor');
  }
}
