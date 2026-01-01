import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

type TrendDirection = 'up' | 'down' | 'neutral';
type CardVariant = 'default' | 'primary' | 'success' | 'warning' | 'error';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      class="stat-card" 
      [class]="variant"
      [class.clickable]="link">
      @if (link) {
        <a [routerLink]="link" class="card-link"></a>
      }
      
      <div class="card-content">
        <div class="stat-info">
          <span class="stat-label">{{ label }}</span>
          <div class="stat-value-row">
            <span class="stat-value">
              @if (prefix) {
                <span class="prefix">{{ prefix }}</span>
              }
              {{ formatValue(value) }}
              @if (suffix) {
                <span class="suffix">{{ suffix }}</span>
              }
            </span>
            
            @if (trend !== undefined && trendValue !== undefined) {
              <span class="trend" [class]="trendDirection">
                <svg class="trend-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  @if (trendDirection === 'up') {
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                    <polyline points="17 6 23 6 23 12"/>
                  } @else if (trendDirection === 'down') {
                    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
                    <polyline points="17 18 23 18 23 12"/>
                  } @else {
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  }
                </svg>
                {{ trendValue | number:'1.1-1' }}%
              </span>
            }
          </div>
          
          @if (description) {
            <span class="stat-description">{{ description }}</span>
          }
        </div>
        
        <div class="stat-icon" [class]="variant">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            @switch (icon) {
              @case ('people') {
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              }
              @case ('calendar') {
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              }
              @case ('medical') {
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              }
              @case ('dollar') {
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              }
              @case ('check') {
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              }
              @case ('alert') {
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              }
              @default {
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              }
            }
          </svg>
        </div>
      </div>
      
      @if (progress !== undefined) {
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="progress"></div>
        </div>
      }
    </div>
  `,
  styles: [`
    .stat-card {
      position: relative;
      border-radius: 16px;
      padding: 20px;
      transition: all 0.2s ease;
      overflow: hidden;
      background: white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);

      &.clickable {
        cursor: pointer;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }
      }

      .card-link {
        position: absolute;
        inset: 0;
        z-index: 1;
      }
    }

    .card-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
      min-width: 0;
    }

    .stat-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }

    .stat-value-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: #1e293b;
      line-height: 1;

      .prefix, .suffix {
        font-size: 1.25rem;
        font-weight: 500;
        color: #64748b;
      }
    }

    .trend {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;

      .trend-icon {
        width: 16px;
        height: 16px;
      }

      &.up {
        background: #dcfce7;
        color: #16a34a;
      }

      &.down {
        background: #fee2e2;
        color: #dc2626;
      }

      &.neutral {
        background: #f1f5f9;
        color: #64748b;
      }
    }

    .stat-description {
      font-size: 0.8rem;
      color: #94a3b8;
      margin-top: 4px;
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      svg {
        width: 28px;
        height: 28px;
        color: white;
      }

      &.default {
        background: linear-gradient(135deg, #64748b 0%, #475569 100%);
      }

      &.primary {
        background: linear-gradient(135deg, #0077b6 0%, #005b8f 100%);
      }

      &.success {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      }

      &.warning {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      }

      &.error {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      }
    }

    .progress-bar {
      height: 4px;
      background: #e2e8f0;
      border-radius: 2px;
      margin-top: 16px;
      overflow: hidden;

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #0077b6 0%, #00a8e8 100%);
        border-radius: 2px;
        transition: width 0.5s ease;
      }
    }

    /* Variant backgrounds */
    .stat-card.primary {
      background: linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%);
    }

    .stat-card.success {
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
    }

    .stat-card.warning {
      background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
    }

    .stat-card.error {
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    }

    @media (max-width: 640px) {
      .stat-value {
        font-size: 1.5rem;
      }

      .stat-icon {
        width: 48px;
        height: 48px;

        svg {
          width: 24px;
          height: 24px;
        }
      }
    }
  `]
})
export class StatCardComponent {
  @Input() label = '';
  @Input() value: number | string = 0;
  @Input() icon = 'analytics';
  @Input() variant: CardVariant = 'default';
  @Input() prefix = '';
  @Input() suffix = '';
  @Input() description = '';
  @Input() link = '';
  @Input() trend?: TrendDirection;
  @Input() trendValue?: number;
  @Input() progress?: number;

  get trendDirection(): TrendDirection {
    if (this.trend) return this.trend;
    if (this.trendValue === undefined) return 'neutral';
    if (this.trendValue > 0) return 'up';
    if (this.trendValue < 0) return 'down';
    return 'neutral';
  }

  formatValue(value: number | string): string {
    if (typeof value === 'string') return value;
    
    // Format large numbers with K, M suffixes
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    }
    if (value >= 10000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    
    return value.toLocaleString();
  }
}
