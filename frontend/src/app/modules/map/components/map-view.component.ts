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
            <div class="legend-item"><span class="legend-swatch" style="background:#1f9d55"></span><span>{{ 'legend.safe' | t }}</span></div>
            <div class="legend-item"><span class="legend-swatch" style="background:#d4a017"></span><span>{{ 'legend.moderate' | t }}</span></div>
            <div class="legend-item"><span class="legend-swatch" style="background:#f97316"></span><span>{{ 'legend.limitOutdoor' | t }}</span></div>
            <div class="legend-item"><span class="legend-swatch" style="background:#dc2626"></span><span>{{ 'legend.avoidOutdoor' | t }}</span></div>
          </div>

          <div class="stack" style="margin-top: 22px;">
            <h3>{{ 'map.activeMarkers' | t }}</h3>
            <div *ngIf="records.length; else emptyRecords">
              <div class="list-item" *ngFor="let record of records">
                <div class="row">
                  <strong>{{ record.location?.city ?? ('dashboard.unknownCity' | t) }}</strong>
                  <span class="pill" [ngClass]="aqiBadgeClass(record.aqi)">AQI {{ record.aqi }}</span>
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
      ${this.i18n.instant('map.recommendation')}: ${this.getRecommendation(record.aqi)}
    `);
    marker.addTo(this.map);
  }

  private getColor(aqi: number): string {
    if (aqi < 50) return '#1f9d55';
    if (aqi <= 100) return '#d4a017';
    if (aqi <= 150) return '#f97316';
    return '#dc2626';
  }

  private getRecommendation(aqi: number): string {
    if (aqi < 50) return this.i18n.instant('value.safe');
    if (aqi <= 100) return this.i18n.instant('value.moderate');
    if (aqi <= 150) return this.i18n.instant('value.limitOutdoor');
    return this.i18n.instant('value.avoidOutdoor');
  }

  protected aqiBadgeClass(aqi: number): string {
    if (aqi < 50) return 'pill-risk-low';
    if (aqi <= 100) return 'pill-risk-moderate';
    if (aqi <= 150) return 'pill-risk-high';
    return 'pill-risk-very-high';
  }
}
