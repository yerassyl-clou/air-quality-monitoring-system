import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { forkJoin } from 'rxjs';

import { AirQualityRecord, AirQualityResponse, LocationRecord, RecommendationRule } from '../../../shared/models/air-quality.models';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { UserProfile } from '../../../shared/models/profile.models';
import { AirQualityService } from '../../../shared/services/air-quality.service';
import { AuthService } from '../../../shared/services/auth.service';
import { TranslationService } from '../../../shared/services/translation.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe, TranslatePipe],
  template: `
    <section class="page">
      <div class="hero hero-grid">
        <div class="stack">
          <span class="brand-badge">{{ 'dashboard.badge' | t }}</span>
          <h1>{{ 'dashboard.title' | t }}</h1>
          <p *ngIf="profile">
            {{ 'dashboard.focusPrefix' | t }} <strong>{{ profile.location }}</strong>.
            {{ 'dashboard.focusSuffix' | t }} <strong>{{ sensitivityLabel(profile.sensitivity_level) }}</strong>.
          </p>
          <div class="stats-grid" *ngIf="aqiData">
            <div class="stat">
              <span class="metric-label">{{ 'dashboard.currentAqi' | t }}</span>
              <strong>{{ aqiData.air_quality.aqi }}</strong>
            </div>
            <div class="stat">
              <span class="metric-label">{{ 'dashboard.primarySource' | t }}</span>
              <strong>{{ aqiData.air_quality.source }}</strong>
            </div>
            <div class="stat">
              <span class="metric-label">{{ 'dashboard.monitoredCities' | t }}</span>
              <strong>{{ locations.length }}</strong>
            </div>
          </div>
        </div>

        <div class="card card-muted">
          <div class="stack" *ngIf="aqiData; else loadingState">
            <div class="row">
              <h3>{{ 'dashboard.currentAdvisory' | t }}</h3>
              <span class="pill" [class.pill-danger]="aqiData.air_quality.aqi > 150" [class.pill-warn]="aqiData.air_quality.aqi >= 50 && aqiData.air_quality.aqi <= 150">
                {{ recommendationLabel(aqiData.air_quality.aqi) }}
              </span>
            </div>
            <p>{{ translateRecommendation(aqiData.recommendation.message) }}</p>
            <p class="soft">{{ 'dashboard.lastUpdate' | t }}: {{ aqiData.air_quality.timestamp | date:'medium' }}</p>
          </div>
        </div>
      </div>

      <div class="error-banner" *ngIf="errorMessage">{{ errorMessage }}</div>

      <div class="grid grid-3">
        <article class="card metric-card">
          <div class="metric-label">PM2.5</div>
          <div class="metric-value">{{ aqiData?.air_quality?.pm25 ?? ('value.na' | t) }}</div>
          <p class="soft">{{ 'dashboard.pm25Hint' | t }}</p>
        </article>
        <article class="card metric-card">
          <div class="metric-label">PM10</div>
          <div class="metric-value">{{ aqiData?.air_quality?.pm10 ?? ('value.na' | t) }}</div>
          <p class="soft">{{ 'dashboard.pm10Hint' | t }}</p>
        </article>
        <article class="card metric-card">
          <div class="metric-label">{{ 'auth.sensitivity' | t }}</div>
          <div class="metric-value">{{ profile ? sensitivityLabel(profile.sensitivity_level) : ('sensitivity.normal' | t) }}</div>
          <p class="soft">{{ 'dashboard.sensitivityHint' | t }}</p>
        </article>
      </div>

      <div class="grid grid-2">
        <article class="card">
          <div class="row">
            <h2>{{ 'dashboard.monitoredLocations' | t }}</h2>
            <button class="btn btn-secondary" (click)="load()">{{ 'dashboard.refresh' | t }}</button>
          </div>
          <div class="panel-list" *ngIf="latestRecords.length; else noData">
            <div class="list-item" *ngFor="let record of latestRecords">
              <div class="row">
                <strong>{{ record.location?.city ?? ('dashboard.unknownCity' | t) }}</strong>
                <span class="pill" [class.pill-danger]="record.aqi > 150" [class.pill-warn]="record.aqi >= 50 && record.aqi <= 150">
                  AQI {{ record.aqi }}
                </span>
              </div>
              <p class="soft">{{ record.location?.name ?? ('dashboard.monitoringPoint' | t) }} • {{ record.source }}</p>
            </div>
          </div>
        </article>

        <article class="card">
          <h2>{{ 'dashboard.recommendationBands' | t }}</h2>
          <div class="table-like" *ngIf="rules.length">
            <div class="table-row" *ngFor="let rule of rules">
              <strong>{{ rule.aqi_min }} - {{ rule.aqi_max }}</strong>
              <span class="soft">{{ recommendationLabel(rule.aqi_max) }}</span>
              <span>{{ translateRecommendation(rule.message) }}</span>
            </div>
          </div>
        </article>
      </div>
    </section>

    <ng-template #loadingState>
      <div class="empty-state">{{ 'dashboard.loading' | t }}</div>
    </ng-template>

    <ng-template #noData>
      <div class="empty-state">{{ 'dashboard.noData' | t }}</div>
    </ng-template>
  `
})
export class DashboardComponent {
  private readonly airQualityService = inject(AirQualityService);
  private readonly authService = inject(AuthService);
  private readonly i18n = inject(TranslationService);

  protected profile?: UserProfile;
  protected aqiData?: AirQualityResponse;
  protected latestRecords: AirQualityRecord[] = [];
  protected locations: LocationRecord[] = [];
  protected rules: RecommendationRule[] = [];
  protected errorMessage = '';

  constructor() {
    this.load();
  }

  load(): void {
    this.errorMessage = '';
    this.authService.getProfile().subscribe({
      next: (profile) => {
        this.profile = profile;
        forkJoin({
          current: this.airQualityService.getCurrentAirQuality(undefined, undefined, profile.location),
          latest: this.airQualityService.getLatest(),
          locations: this.airQualityService.getLocations()
        }).subscribe({
          next: ({ current, latest, locations }) => {
            this.aqiData = current;
            this.latestRecords = latest;
            this.locations = locations;
            this.airQualityService.getRecommendations(current.air_quality.aqi).subscribe((response) => {
              this.rules = response.rules;
            });
          },
          error: () => {
            this.errorMessage = this.i18n.instant('dashboard.airError');
          }
        });
      },
      error: () => {
        this.errorMessage = this.i18n.instant('dashboard.profileError');
      }
    });
  }

  protected sensitivityLabel(value: string): string {
    return this.i18n.sensitivityLabel(value);
  }

  protected recommendationLabel(aqi: number): string {
    if (aqi < 50) return this.i18n.instant('value.safe');
    if (aqi <= 100) return this.i18n.instant('value.moderate');
    if (aqi <= 150) return this.i18n.instant('value.limitOutdoor');
    return this.i18n.instant('value.avoidOutdoor');
  }

  protected translateRecommendation(message: string): string {
    return this.i18n.translateRecommendation(message);
  }
}
