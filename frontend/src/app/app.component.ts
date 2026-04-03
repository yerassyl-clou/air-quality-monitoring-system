import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { TranslatePipe } from './shared/pipes/translate.pipe';
import { AuthService } from './shared/services/auth.service';
import { TranslationService } from './shared/services/translation.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  template: `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">
          <span class="brand-badge">{{ 'app.brandBadge' | t }}</span>
          <h2>{{ 'app.title' | t }}</h2>
          <p>{{ 'app.subtitle' | t }}</p>
        </div>

        <nav>
          <a class="nav-link" routerLink="/dashboard" routerLinkActive="active">{{ 'nav.dashboard' | t }} <span>01</span></a>
          <a class="nav-link" routerLink="/map" routerLinkActive="active">{{ 'nav.map' | t }} <span>02</span></a>
          <a class="nav-link" routerLink="/reports" routerLinkActive="active">{{ 'nav.reports' | t }} <span>03</span></a>
          <a class="nav-link" routerLink="/profile" routerLinkActive="active">{{ 'nav.profile' | t }} <span>04</span></a>
          <a class="nav-link" routerLink="/login" routerLinkActive="active" *ngIf="!auth.isAuthenticated()">{{ 'nav.login' | t }} <span>05</span></a>
        </nav>

        <div class="sidebar-footer">
          <a class="nav-link" href="#" (click)="logout($event)" *ngIf="auth.isAuthenticated()">{{ 'nav.logout' | t }} <span>05</span></a>
        </div>
      </aside>

      <main class="content">
        <div class="topbar">
          <div>
            <h2>{{ 'topbar.title' | t }}</h2>
            <p class="soft">{{ 'topbar.subtitle' | t }}</p>
          </div>
          <div class="topbar-actions">
            <label class="language-switch">
              <span>{{ 'topbar.language' | t }}</span>
              <select [value]="i18n.language()" (change)="setLanguage($any($event.target).value)">
                <option *ngFor="let option of i18n.languageOptions()" [value]="option">
                  {{ ('lang.' + option) | t }}
                </option>
              </select>
            </label>
            <div class="pill" *ngIf="auth.isAuthenticated()">{{ 'topbar.workspace' | t }}</div>
          </div>
        </div>
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class AppComponent {
  protected readonly auth = inject(AuthService);
  protected readonly i18n = inject(TranslationService);
  private readonly router = inject(Router);

  setLanguage(language: 'en' | 'ru' | 'kk'): void {
    this.i18n.setLanguage(language);
  }

  logout(event: Event): void {
    event.preventDefault();
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
