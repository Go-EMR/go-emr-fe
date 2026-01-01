import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty-state" [class.compact]="compact">
      <div class="empty-icon-container">
        <mat-icon class="empty-icon">{{ icon }}</mat-icon>
      </div>
      <h3 class="empty-title">{{ title }}</h3>
      @if (description) {
        <p class="empty-description">{{ description }}</p>
      }
      
      <div class="empty-actions">
        @if (actionLabel && actionRoute) {
          <button 
            mat-flat-button 
            color="primary" 
            [routerLink]="actionRoute">
            @if (actionIcon) {
              <mat-icon>{{ actionIcon }}</mat-icon>
            }
            {{ actionLabel }}
          </button>
        }
        <ng-content select="[actions]"></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;

      &.compact {
        padding: 24px 16px;

        .empty-icon-container {
          width: 64px;
          height: 64px;
        }

        .empty-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
        }

        .empty-title {
          font-size: 1rem;
        }

        .empty-description {
          font-size: 0.85rem;
        }
      }
    }

    .empty-icon-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 96px;
      height: 96px;
      border-radius: 50%;
      background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
      margin-bottom: 20px;
    }

    .empty-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #94a3b8;
    }

    .empty-title {
      margin: 0 0 8px 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
    }

    .empty-description {
      margin: 0 0 24px 0;
      font-size: 0.95rem;
      color: #64748b;
      max-width: 400px;
    }

    .empty-actions {
      display: flex;
      align-items: center;
      gap: 12px;

      button mat-icon {
        margin-right: 4px;
      }
    }
  `]
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() title = 'No items found';
  @Input() description = '';
  @Input() actionLabel = '';
  @Input() actionIcon = '';
  @Input() actionRoute = '';
  @Input() compact = false;
}
