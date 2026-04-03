import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { forkJoin } from 'rxjs';

import { AirQualityResponse } from '../../../shared/models/air-quality.models';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { NotificationRecord, UserProfile } from '../../../shared/models/profile.models';
import { AirQualityService } from '../../../shared/services/air-quality.service';
import { AuthService } from '../../../shared/services/auth.service';
import { TranslationService } from '../../../shared/services/translation.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, DatePipe, TranslatePipe],
  template: `
    <section class="page">
      <div class="hero">
        <span class="brand-badge">{{ 'profile.badge' | t }}</span>
        <h1>{{ 'profile.title' | t }}</h1>
        <p>{{ 'profile.text' | t }}</p>
      </div>

      <div class="error-banner" *ngIf="errorMessage">{{ errorMessage }}</div>

      <div class="grid grid-2" *ngIf="profile">
        <article class="card">
          <div class="row">
            <h2>{{ 'profile.userProfile' | t }}</h2>
            <span class="pill">{{ roleLabel(profile.user.role) }}</span>
          </div>
          <div class="stack">
            <div class="row"><span class="soft">{{ 'label.email' | t }}</span><strong>{{ profile.user.email }}</strong></div>
            <div class="row"><span class="soft">{{ 'label.ageGroup' | t }}</span><strong>{{ ageLabel(profile.age_group) }}</strong></div>
            <div class="row"><span class="soft">{{ 'label.occupation' | t }}</span><strong>{{ profile.occupation }}</strong></div>
            <div class="row"><span class="soft">{{ 'label.sensitivity' | t }}</span><strong>{{ sensitivityLabel(profile.sensitivity_level) }}</strong></div>
            <div class="row"><span class="soft">{{ 'label.city' | t }}</span><strong>{{ profile.location }}</strong></div>
            <div class="row"><span class="soft">{{ 'profile.created' | t }}</span><strong>{{ profile.user.created_at | date:'mediumDate' }}</strong></div>
          </div>
        </article>

        <article class="card" *ngIf="airQuality">
          <h2>{{ 'profile.currentRecommendation' | t }}</h2>
          <div class="metric-value">AQI {{ airQuality.air_quality.aqi }}</div>
          <p>{{ translateRecommendation(airQuality.recommendation.message) }}</p>
          <p class="soft">{{ 'profile.latestSource' | t }}: {{ airQuality.air_quality.source }}</p>
        </article>
      </div>

      <article class="card">
        <div class="row">
          <h2>{{ 'profile.notifications' | t }}</h2>
          <span class="pill">{{ notifications.length }} {{ 'profile.items' | t }}</span>
        </div>
        <div *ngIf="notifications.length; else emptyNotifications">
          <div class="list-item" *ngFor="let notification of notifications">
            <div class="row">
              <strong>{{ notificationLabel(notification.is_read) }}</strong>
              <span class="soft">{{ notification.created_at | date:'medium' }}</span>
            </div>
            <p>{{ notification.message }}</p>
          </div>
        </div>
      </article>
    </section>

    <ng-template #emptyNotifications>
      <div class="empty-state">{{ 'profile.noNotifications' | t }}</div>
    </ng-template>
  `
})
export class ProfileComponent {
  private readonly authService = inject(AuthService);
  private readonly airQualityService = inject(AirQualityService);
  private readonly i18n = inject(TranslationService);

  protected profile?: UserProfile;
  protected airQuality?: AirQualityResponse;
  protected notifications: NotificationRecord[] = [];
  protected errorMessage = '';

  constructor() {
    this.load();
  }

  private load(): void {
    this.authService.getProfile().subscribe({
      next: (profile) => {
        this.profile = profile;
        forkJoin({
          notifications: this.authService.getNotifications(),
          airQuality: this.airQualityService.getCurrentAirQuality(undefined, undefined, profile.location)
        }).subscribe({
          next: ({ notifications, airQuality }) => {
            this.notifications = notifications;
            this.airQuality = airQuality;
          },
          error: () => {
            this.errorMessage = this.i18n.instant('profile.partialError');
          }
        });
      },
      error: () => {
        this.errorMessage = this.i18n.instant('profile.loadError');
      }
    });
  }

  protected roleLabel(value: string): string {
    return this.i18n.roleLabel(value);
  }

  protected ageLabel(value: string): string {
    return this.i18n.ageLabel(value);
  }

  protected sensitivityLabel(value: string): string {
    return this.i18n.sensitivityLabel(value);
  }

  protected notificationLabel(isRead: boolean): string {
    return this.i18n.notificationState(isRead);
  }

  protected translateRecommendation(message: string): string {
    return this.i18n.translateRecommendation(message);
  }
}
