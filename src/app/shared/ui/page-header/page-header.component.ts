import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface Breadcrumb {
  label: string;
  route?: string;
}

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-header">
      <!-- Breadcrumbs -->
      @if (breadcrumbs.length > 0) {
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          @for (crumb of breadcrumbs; track crumb.label; let last = $last) {
            @if (crumb.route && !last) {
              <a [routerLink]="crumb.route" class="crumb-link">{{ crumb.label }}</a>
              <mat-icon class="separator">chevron_right</mat-icon>
            } @else {
              <span class="crumb-current">{{ crumb.label }}</span>
            }
          }
        </nav>
      }

      <div class="header-content">
        <div class="title-section">
          @if (icon) {
            <mat-icon class="title-icon">{{ icon }}</mat-icon>
          }
          <div class="title-text">
            <h1 class="page-title">{{ title }}</h1>
            @if (subtitle) {
              <p class="page-subtitle">{{ subtitle }}</p>
            }
          </div>
        </div>

        <div class="header-actions">
          <ng-content select="[actions]"></ng-content>
        </div>
      </div>

      @if (showDivider) {
        <div class="header-divider"></div>
      }
    </header>
  `,
  styles: [`
    .page-header {
      margin-bottom: 24px;
    }

    .breadcrumbs {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 12px;
      font-size: 0.875rem;

      .crumb-link {
        color: #64748b;
        text-decoration: none;
        transition: color 0.2s;

        &:hover {
          color: #0077b6;
        }
      }

      .separator {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: #94a3b8;
      }

      .crumb-current {
        color: #1e293b;
        font-weight: 500;
      }
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      flex-wrap: wrap;
    }

    .title-section {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .title-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #0077b6;
      margin-top: 4px;
    }

    .title-text {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .page-title {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 600;
      color: #1e293b;
      letter-spacing: -0.025em;
    }

    .page-subtitle {
      margin: 0;
      font-size: 0.95rem;
      color: #64748b;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-divider {
      height: 1px;
      background: linear-gradient(to right, #e2e8f0, transparent);
      margin-top: 16px;
    }

    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        align-items: stretch;
      }

      .header-actions {
        justify-content: flex-start;
      }

      .page-title {
        font-size: 1.5rem;
      }
    }
  `]
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() icon = '';
  @Input() breadcrumbs: Breadcrumb[] = [];
  @Input() showDivider = false;
}
