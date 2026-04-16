import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { forkJoin } from 'rxjs';

import { AirQualityRecord, AirQualityResponse, LocationRecord } from '../../../shared/models/air-quality.models';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { UserProfile } from '../../../shared/models/profile.models';
import { AIRecommendationService } from '../../../services/ai-recommendation.service';
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

        <div class="card card-muted advisory-shell">
          <div class="stack advisory-card" *ngIf="aqiData; else loadingState">
            <div class="row">
              <h3>{{ 'dashboard.currentAdvisory' | t }}</h3>
              <span class="pill" [ngClass]="riskBadgeClass(getCurrentRisk())">
                {{ riskLabel(getCurrentRisk()) }}
              </span>
            </div>
            <div class="advisory-action">{{ riskAction(getCurrentRisk()) }}</div>
            <p class="soft advisory-explanation" *ngIf="aiText === null">
              {{ 'dashboard.generatingRecommendation' | t }}
            </p>
            <p class="advisory-explanation advisory-fade" *ngIf="aiText !== null">
              {{ aiText }}
            </p>
            <p class="soft advisory-meta">{{ 'dashboard.lastUpdate' | t }}: {{ aqiData.air_quality.timestamp | date:'medium' }}</p>
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

      <div class="grid">
        <article class="card section-card">
          <div class="row">
            <h2>{{ 'dashboard.monitoredLocations' | t }}</h2>
            <button class="btn btn-secondary" (click)="load()">{{ 'dashboard.refresh' | t }}</button>
          </div>
          <div class="panel-list" *ngIf="latestRecords.length; else noData">
            <div class="list-item" *ngFor="let record of latestRecords">
              <div class="row">
                <strong>{{ record.location?.city ?? ('dashboard.unknownCity' | t) }}</strong>
                <span class="pill" [ngClass]="aqiBadgeClass(record.aqi)">
                  AQI {{ record.aqi }}
                </span>
              </div>
              <p class="soft">{{ record.location?.name ?? ('dashboard.monitoringPoint' | t) }} • {{ record.source }}</p>
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
  private readonly aiRecommendationService = inject(AIRecommendationService);
  private readonly i18n = inject(TranslationService);

  protected profile?: UserProfile;
  protected aqiData?: AirQualityResponse;
  protected aiText: string | null = null;
  protected latestRecords: AirQualityRecord[] = [];
  protected locations: LocationRecord[] = [];
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
            this.aiText = null;
            this.latestRecords = latest;
            this.locations = locations;
            this.aiRecommendationService
              .getAIRecommendation(
                current.air_quality.aqi,
                current.air_quality.pm25 ?? 0,
                current.air_quality.pm10 ?? 0,
                this.currentLanguage()
              )
              .subscribe({
                next: (response) => {
                  this.aiText = response.ai_text;
                },
                error: () => {
                  this.aiText = this.i18n.instant('dashboard.aiFallback');
                }
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

  protected getCurrentRisk(): number {
    if (this.aqiData?.recommendation?.risk !== undefined) {
      return this.aqiData.recommendation.risk;
    }
    const aqi = this.aqiData?.air_quality?.aqi ?? 0;
    if (aqi < 50) return 0;
    if (aqi < 100) return 1;
    if (aqi < 150) return 2;
    return 3;
  }

  protected riskLabel(risk: number): string {
    if (risk === 0) return this.i18n.instant('dashboard.risk.low');
    if (risk === 1) return this.i18n.instant('dashboard.risk.moderate');
    if (risk === 2) return this.i18n.instant('dashboard.risk.high');
    return this.i18n.instant('dashboard.risk.veryHigh');
  }

  protected riskAction(risk: number): string {
    if (risk === 0) return this.i18n.instant('dashboard.action.low');
    if (risk === 1) return this.i18n.instant('dashboard.action.moderate');
    if (risk === 2) return this.i18n.instant('dashboard.action.high');
    return this.i18n.instant('dashboard.action.veryHigh');
  }

  protected riskBadgeClass(risk: number): string {
    if (risk === 0) return 'pill-risk-low';
    if (risk === 1) return 'pill-risk-moderate';
    if (risk === 2) return 'pill-risk-high';
    return 'pill-risk-very-high';
  }

  protected aqiBadgeClass(aqi: number): string {
    if (aqi < 50) return 'pill-risk-low';
    if (aqi <= 100) return 'pill-risk-moderate';
    if (aqi <= 150) return 'pill-risk-high';
    return 'pill-risk-very-high';
  }

  private currentLanguage(): 'en' | 'ru' | 'kz' {
    const language = this.i18n.language();
    if (language === 'kk') return 'kz';
    if (language === 'ru') return 'ru';
    return 'en';
  }
}
