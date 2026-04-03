import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { LocationRecord } from '../../../shared/models/air-quality.models';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ReportRecord } from '../../../shared/models/report.models';
import { AirQualityService } from '../../../shared/services/air-quality.service';
import { ReportService } from '../../../shared/services/report.service';
import { TranslationService } from '../../../shared/services/translation.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe, TranslatePipe],
  template: `
    <section class="page">
      <div class="hero">
        <span class="brand-badge">{{ 'reports.badge' | t }}</span>
        <h1>{{ 'reports.title' | t }}</h1>
        <p>{{ 'reports.text' | t }}</p>
      </div>

      <div class="grid grid-2">
        <article class="card">
          <div class="section-title">
            <h2>{{ 'reports.submitTitle' | t }}</h2>
            <p class="soft">{{ 'reports.submitText' | t }}</p>
          </div>

          <div class="error-banner" *ngIf="errorMessage">{{ errorMessage }}</div>

          <form class="form" [formGroup]="form" (ngSubmit)="submit()">
            <div class="field">
              <label for="location_id">{{ 'reports.location' | t }}</label>
              <select id="location_id" formControlName="location_id">
                <option [ngValue]="0">{{ 'reports.selectLocation' | t }}</option>
                <option *ngFor="let location of locations" [ngValue]="location.id">
                  {{ location.city }} - {{ location.name }}
                </option>
              </select>
            </div>

            <div class="field">
              <label for="description">{{ 'reports.description' | t }}</label>
              <textarea id="description" rows="6" formControlName="description" [placeholder]="'reports.descriptionPlaceholder' | t"></textarea>
            </div>

            <button class="btn btn-primary" type="submit" [disabled]="isSubmitting">{{ 'reports.submit' | t }}</button>
          </form>
        </article>

        <article class="card">
          <div class="row">
            <h2>{{ 'reports.myReports' | t }}</h2>
            <span class="pill">{{ reports.length }} {{ 'reports.total' | t }}</span>
          </div>

          <div *ngIf="reports.length; else emptyReports">
            <div class="list-item" *ngFor="let report of reports">
              <div class="row">
                <strong>{{ report.location.city }} - {{ report.location.name }}</strong>
                <span class="pill" [class.pill-warn]="report.status === 'pending'">{{ statusLabel(report.status) }}</span>
              </div>
              <p>{{ report.description }}</p>
              <p class="soft">{{ report.created_at | date:'medium' }}</p>
            </div>
          </div>
        </article>
      </div>
    </section>

    <ng-template #emptyReports>
      <div class="empty-state">{{ 'reports.noReports' | t }}</div>
    </ng-template>
  `
})
export class ReportsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly reportService = inject(ReportService);
  private readonly airQualityService = inject(AirQualityService);
  private readonly i18n = inject(TranslationService);

  protected reports: ReportRecord[] = [];
  protected locations: LocationRecord[] = [];
  protected errorMessage = '';
  protected isSubmitting = false;

  protected readonly form = this.fb.nonNullable.group({
    location_id: [0, [Validators.required, Validators.min(1)]],
    description: ['', Validators.required]
  });

  constructor() {
    this.loadPage();
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting) {
      return;
    }

    this.errorMessage = '';
    this.isSubmitting = true;

    this.reportService.submit(this.form.getRawValue()).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.form.patchValue({ location_id: 0, description: '' });
        this.loadReports();
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting = false;
        this.errorMessage = typeof error.error === 'object'
          ? JSON.stringify(error.error)
          : this.i18n.instant('reports.submitError');
      }
    });
  }

  private loadPage(): void {
    this.airQualityService.getLocations().subscribe({
      next: (locations) => {
        this.locations = locations;
      },
      error: () => {
        this.errorMessage = this.i18n.instant('reports.locationsError');
      }
    });
    this.loadReports();
  }

  private loadReports(): void {
    this.reportService.list().subscribe({
      next: (reports) => {
        this.reports = reports;
      },
      error: () => {
        this.errorMessage = this.i18n.instant('reports.listError');
      }
    });
  }

  protected statusLabel(value: string): string {
    return this.i18n.statusLabel(value);
  }
}
