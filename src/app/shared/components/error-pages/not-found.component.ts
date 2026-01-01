import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="error-page">
      <div class="error-content">
        <div class="error-code-large">404</div>
        <h1>Page Not Found</h1>
        <p class="error-message">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        <div class="error-actions">
          <a routerLink="/dashboard" class="btn btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Go to Dashboard
          </a>
          <button class="btn btn-secondary" (click)="goBack()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Go Back
          </button>
        </div>
        <div class="quick-links">
          <p>Or try one of these:</p>
          <div class="links">
            <a routerLink="/patients">Patients</a>
            <a routerLink="/appointments">Appointments</a>
            <a routerLink="/encounters">Encounters</a>
            <a routerLink="/messages">Messages</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .error-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    }

    .error-content {
      max-width: 480px;
      text-align: center;
    }

    .error-code-large {
      font-size: 8rem;
      font-weight: 800;
      line-height: 1;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 1rem;
    }

    h1 {
      margin: 0 0 1rem;
      font-size: 1.75rem;
      font-weight: 700;
      color: #1e293b;
    }

    .error-message {
      margin: 0 0 2rem;
      font-size: 1rem;
      color: #64748b;
      line-height: 1.6;
    }

    .error-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
      margin-bottom: 2.5rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border-radius: 0.5rem;
      font-size: 0.9375rem;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }

    .btn svg {
      width: 1.125rem;
      height: 1.125rem;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .btn-secondary {
      background: white;
      color: #475569;
      border: 1px solid #e2e8f0;
    }

    .btn-secondary:hover {
      background: #f8fafc;
    }

    .quick-links {
      padding-top: 1.5rem;
      border-top: 1px solid #e2e8f0;
    }

    .quick-links p {
      margin: 0 0 1rem;
      font-size: 0.875rem;
      color: #94a3b8;
    }

    .links {
      display: flex;
      gap: 1.5rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .links a {
      font-size: 0.9375rem;
      color: #3b82f6;
      text-decoration: none;
    }

    .links a:hover {
      text-decoration: underline;
    }
  `]
})
export class NotFoundComponent {
  goBack(): void {
    window.history.back();
  }
}
