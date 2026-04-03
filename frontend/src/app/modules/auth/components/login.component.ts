import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { AuthService } from '../../../shared/services/auth.service';
import { TranslationService } from '../../../shared/services/translation.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <section class="auth-shell">
      <div class="card auth-card">
        <div class="auth-showcase">
          <span class="brand-badge">{{ 'auth.loginBadge' | t }}</span>
          <h1>{{ 'auth.loginHeroTitle' | t }}</h1>
          <p>{{ 'auth.loginHeroText' | t }}</p>
          <div class="stats-grid">
            <div class="stat">
              <span class="metric-label">{{ 'auth.monitoring' | t }}</span>
              <strong>24/7</strong>
            </div>
            <div class="stat">
              <span class="metric-label">{{ 'nav.reports' | t }}</span>
              <strong>{{ 'auth.citizenLed' | t }}</strong>
            </div>
          </div>
        </div>

        <div class="auth-form">
          <div class="section-title">
            <span class="brand-badge">{{ 'auth.login' | t }}</span>
            <h2>{{ 'auth.loginTitle' | t }}</h2>
            <p class="soft">{{ 'auth.loginText' | t }}</p>
          </div>

          <div class="error-banner" *ngIf="errorMessage">{{ errorMessage }}</div>

          <form class="form" [formGroup]="form" (ngSubmit)="submit()">
            <div class="field">
              <label for="email">{{ 'auth.email' | t }}</label>
              <input id="email" type="email" formControlName="email" [placeholder]="'auth.emailPlaceholder' | t">
            </div>
            <div class="field">
              <label for="password">{{ 'auth.password' | t }}</label>
              <input id="password" type="password" formControlName="password" [placeholder]="'auth.passwordPlaceholder' | t">
            </div>
            <div class="btn-row">
              <button class="btn btn-primary" type="submit" [disabled]="isSubmitting">{{ 'auth.login' | t }}</button>
              <a class="btn btn-secondary" routerLink="/register">{{ 'auth.createAccount' | t }}</a>
            </div>
          </form>
        </div>
      </div>
    </section>
  `
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly i18n = inject(TranslationService);
  private readonly router = inject(Router);

  protected errorMessage = '';
  protected isSubmitting = false;
  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  submit(): void {
    if (this.form.invalid || this.isSubmitting) {
      return;
    }

    this.errorMessage = '';
    this.isSubmitting = true;

    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.isSubmitting = false;
        void this.router.navigate(['/dashboard']);
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting = false;
        this.errorMessage = error.error?.detail ?? this.i18n.instant('auth.loginError');
      }
    });
  }
}
