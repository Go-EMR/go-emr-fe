import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-session-expired',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="error-page">
      <div class="error-content">
        <div class="error-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <h1>Session Expired</h1>
        <p class="error-message">
          Your session has expired due to inactivity. 
          This is a security measure to protect your health information.
        </p>
        <p class="security-note">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          HIPAA Compliance: Sessions automatically expire after 15 minutes of inactivity.
        </p>
        <div class="error-actions">
          <a routerLink="/auth/login" class="btn btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            Sign In Again
          </a>
        </div>
        <p class="help-text">
          If you continue to experience issues, please contact 
          <a href="mailto:support@openemr.local">support</a>.
        </p>
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

    .error-icon {
      width: 6rem;
      height: 6rem;
      margin: 0 auto 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fef3c7;
      border-radius: 50%;
    }

    .error-icon svg {
      width: 3rem;
      height: 3rem;
      color: #d97706;
    }

    h1 {
      margin: 0 0 1rem;
      font-size: 2rem;
      font-weight: 700;
      color: #1e293b;
    }

    .error-message {
      margin: 0 0 1.5rem;
      font-size: 1rem;
      color: #64748b;
      line-height: 1.6;
    }

    .security-note {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin: 0 0 2rem;
      padding: 1rem;
      background: #f1f5f9;
      border-radius: 0.5rem;
      font-size: 0.8125rem;
      color: #475569;
    }

    .security-note svg {
      width: 1.25rem;
      height: 1.25rem;
      color: #16a34a;
      flex-shrink: 0;
    }

    .error-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-bottom: 2rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      border-radius: 0.5rem;
      font-size: 1rem;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }

    .btn svg {
      width: 1.25rem;
      height: 1.25rem;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .help-text {
      margin: 0;
      font-size: 0.875rem;
      color: #94a3b8;
    }

    .help-text a {
      color: #3b82f6;
      text-decoration: none;
    }

    .help-text a:hover {
      text-decoration: underline;
    }
  `]
})
export class SessionExpiredComponent {}
