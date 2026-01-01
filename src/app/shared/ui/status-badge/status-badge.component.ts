import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary';
type BadgeSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span 
      class="status-badge" 
      [class]="variant + ' ' + size"
      [class.with-icon]="icon"
      [class.dot-only]="dotOnly">
      @if (dotOnly) {
        <span class="dot"></span>
      } @else {
        @if (icon) {
          <mat-icon class="badge-icon">{{ icon }}</mat-icon>
        }
        <span class="badge-text">{{ text }}</span>
      }
    </span>
  `,
  styles: [`
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 500;
      line-height: 1;
      white-space: nowrap;

      /* Size variants */
      &.small {
        padding: 2px 8px;
        font-size: 0.7rem;

        .badge-icon {
          font-size: 12px;
          width: 12px;
          height: 12px;
        }
      }

      &.large {
        padding: 6px 14px;
        font-size: 0.9rem;

        .badge-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }

      /* Dot only */
      &.dot-only {
        padding: 0;
        background: transparent;

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
      }

      /* Color variants */
      &.success {
        background: #dcfce7;
        color: #16a34a;

        .dot { background: #16a34a; }
      }

      &.warning {
        background: #fef3c7;
        color: #d97706;

        .dot { background: #d97706; }
      }

      &.error {
        background: #fee2e2;
        color: #dc2626;

        .dot { background: #dc2626; }
      }

      &.info {
        background: #dbeafe;
        color: #2563eb;

        .dot { background: #2563eb; }
      }

      &.neutral {
        background: #f1f5f9;
        color: #64748b;

        .dot { background: #64748b; }
      }

      &.primary {
        background: #e0f2fe;
        color: #0077b6;

        .dot { background: #0077b6; }
      }
    }

    .badge-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }
  `]
})
export class StatusBadgeComponent {
  @Input() text = '';
  @Input() set label(value: string) { this.text = value; } // Alias for text
  @Input() set status(value: string) { this.text = value; } // Alias for text
  @Input() variant: BadgeVariant = 'neutral';
  @Input() size: BadgeSize = 'medium';
  @Input() icon = '';
  @Input() dotOnly = false;
}

// Helper function to map common statuses to badge variants
export function getStatusVariant(status: string): BadgeVariant {
  const statusMap: Record<string, BadgeVariant> = {
    // General
    active: 'success',
    inactive: 'neutral',
    pending: 'warning',
    completed: 'success',
    cancelled: 'error',
    archived: 'neutral',
    
    // Appointments
    scheduled: 'info',
    confirmed: 'success',
    'checked-in': 'primary',
    'in-progress': 'warning',
    'no-show': 'error',
    
    // Encounters
    open: 'warning',
    closed: 'success',
    signed: 'success',
    draft: 'neutral',
    
    // Lab results
    normal: 'success',
    abnormal: 'warning',
    critical: 'error',
    
    // Prescriptions (active already defined above)
    discontinued: 'neutral',
    expired: 'error',
    
    // Billing
    paid: 'success',
    unpaid: 'warning',
    overdue: 'error',
    denied: 'error',
    submitted: 'info',
    
    // Patient
    deceased: 'error',
  };

  return statusMap[status.toLowerCase()] || 'neutral';
}
