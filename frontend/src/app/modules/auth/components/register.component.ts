import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { RegisterPayload } from '../../../shared/models/auth.models';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { AuthService } from '../../../shared/services/auth.service';
import { TranslationService } from '../../../shared/services/translation.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <section class="auth-shell">
      <div class="card auth-card">
        <div class="auth-showcase">
          <span class="brand-badge">{{ 'auth.registerBadge' | t }}</span>
          <h1>{{ 'auth.registerHeroTitle' | t }}</h1>
          <p>{{ 'auth.registerHeroText' | t }}</p>
          <ul>
            <li>{{ 'auth.registerPoint1' | t }}</li>
            <li>{{ 'auth.registerPoint2' | t }}</li>
            <li>{{ 'auth.registerPoint3' | t }}</li>
          </ul>
        </div>

        <div class="auth-form">
          <div class="section-title">
            <span class="brand-badge">{{ 'auth.register' | t }}</span>
            <h2>{{ 'auth.registerTitle' | t }}</h2>
            <p class="soft">{{ 'auth.registerText' | t }}</p>
          </div>

          <div class="error-banner" *ngIf="errorMessage">{{ errorMessage }}</div>

          <form class="form" [formGroup]="form" (ngSubmit)="submit()">
            <div class="grid grid-2">
              <div class="field">
                <label for="email">{{ 'auth.email' | t }}</label>
                <input id="email" type="email" formControlName="email" [placeholder]="'auth.email' | t">
              </div>
              <div class="field">
                <label for="password">{{ 'auth.password' | t }}</label>
                <input id="password" type="password" formControlName="password" [placeholder]="'auth.password' | t">
              </div>
              <div class="field">
                <label for="role">{{ 'auth.role' | t }}</label>
                <select id="role" formControlName="role">
                  <option value="citizen">{{ 'role.citizen' | t }}</option>
                  <option value="analyst">{{ 'role.analyst' | t }}</option>
                  <option value="admin">{{ 'role.admin' | t }}</option>
                </select>
              </div>
              <div class="field">
                <label for="age_group">{{ 'auth.ageGroup' | t }}</label>
                <select id="age_group" formControlName="age_group">
                  <option value="child">{{ 'age.child' | t }}</option>
                  <option value="adult">{{ 'age.adult' | t }}</option>
                  <option value="senior">{{ 'age.senior' | t }}</option>
                </select>
              </div>
              <div class="field">
                <label for="occupation">{{ 'auth.occupation' | t }}</label>
                <input id="occupation" type="text" formControlName="occupation" [placeholder]="'auth.occupationPlaceholder' | t">
              </div>
              <div class="field">
                <label for="sensitivity_level">{{ 'auth.sensitivity' | t }}</label>
                <select id="sensitivity_level" formControlName="sensitivity_level">
                  <option value="normal">{{ 'sensitivity.normal' | t }}</option>
                  <option value="asthma">{{ 'sensitivity.asthma' | t }}</option>
                  <option value="athlete">{{ 'sensitivity.athlete' | t }}</option>
                </select>
              </div>
            </div>

            <div class="field">
              <label for="location">{{ 'auth.city' | t }}</label>
              <input id="location" type="text" formControlName="location" [placeholder]="'auth.cityPlaceholder' | t">
            </div>

            <div class="btn-row">
              <button class="btn btn-primary" type="submit" [disabled]="isSubmitting">{{ 'auth.register' | t }}</button>
              <a class="btn btn-secondary" routerLink="/login">{{ 'auth.backToLogin' | t }}</a>
            </div>
          </form>
        </div>
      </div>
    </section>
  `
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly i18n = inject(TranslationService);
  private readonly router = inject(Router);

  protected errorMessage = '';
  protected isSubmitting = false;
  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: ['citizen'],
    age_group: ['adult'],
    occupation: ['', Validators.required],
    sensitivity_level: ['normal'],
    location: ['Almaty', Validators.required]
  });

  submit(): void {
    if (this.form.invalid || this.isSubmitting) {
      return;
    }

    this.errorMessage = '';
    this.isSubmitting = true;

    const payload: RegisterPayload = {
      email: this.form.controls.email.getRawValue(),
      password: this.form.controls.password.getRawValue(),
      role: this.form.controls.role.getRawValue() as RegisterPayload['role'],
      age_group: this.form.controls.age_group.getRawValue() as RegisterPayload['age_group'],
      occupation: this.form.controls.occupation.getRawValue(),
      sensitivity_level: this.form.controls.sensitivity_level.getRawValue() as RegisterPayload['sensitivity_level'],
      location: this.form.controls.location.getRawValue()
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        void this.router.navigate(['/login']);
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting = false;
        this.errorMessage = typeof error.error === 'object'
          ? JSON.stringify(error.error)
          : this.i18n.instant('auth.registerError');
      }
    });
  }
}
