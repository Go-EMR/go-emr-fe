import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

type SkeletonType = 'text' | 'title' | 'avatar' | 'thumbnail' | 'card' | 'table-row' | 'list-item';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="skeleton" [class]="type" [style.width]="width" [style.height]="height">
      @if (type === 'card') {
        <div class="skeleton-header">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-title-group">
            <div class="skeleton-line title"></div>
            <div class="skeleton-line subtitle"></div>
          </div>
        </div>
        <div class="skeleton-body">
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line short"></div>
        </div>
      } @else if (type === 'table-row') {
        @for (col of columns; track $index) {
          <div class="skeleton-cell" [style.flex]="col.flex || 1">
            <div class="skeleton-line" [style.width]="col.width || '80%'"></div>
          </div>
        }
      } @else if (type === 'list-item') {
        <div class="skeleton-avatar small"></div>
        <div class="skeleton-content">
          <div class="skeleton-line title"></div>
          <div class="skeleton-line subtitle"></div>
        </div>
      }
    </div>
  `,
  styles: [`
    .skeleton {
      background: #f1f5f9;
      border-radius: 4px;
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }

    /* Text types */
    .text {
      height: 16px;
      width: 100%;
    }

    .title {
      height: 24px;
      width: 60%;
    }

    /* Avatar types */
    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
    }

    .thumbnail {
      width: 80px;
      height: 80px;
      border-radius: 8px;
    }

    /* Card skeleton */
    .card {
      padding: 16px;
      border-radius: 12px;
      background: white;
      border: 1px solid #e2e8f0;

      .skeleton-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }

      .skeleton-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: #e2e8f0;
        flex-shrink: 0;
        animation: pulse 1.5s ease-in-out infinite;
      }

      .skeleton-title-group {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .skeleton-body {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .skeleton-line {
        height: 12px;
        background: #e2e8f0;
        border-radius: 4px;
        animation: pulse 1.5s ease-in-out infinite;

        &.title {
          width: 70%;
          height: 16px;
        }

        &.subtitle {
          width: 50%;
          height: 12px;
        }

        &.short {
          width: 40%;
        }
      }
    }

    /* Table row skeleton */
    .table-row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 16px;
      background: white;
      border-radius: 0;

      .skeleton-cell {
        display: flex;
        align-items: center;
      }

      .skeleton-line {
        height: 14px;
        background: #e2e8f0;
        border-radius: 4px;
        animation: pulse 1.5s ease-in-out infinite;
      }
    }

    /* List item skeleton */
    .list-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 0;
      background: transparent;

      .skeleton-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #e2e8f0;
        flex-shrink: 0;
        animation: pulse 1.5s ease-in-out infinite;

        &.small {
          width: 36px;
          height: 36px;
        }
      }

      .skeleton-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .skeleton-line {
        height: 12px;
        background: #e2e8f0;
        border-radius: 4px;
        animation: pulse 1.5s ease-in-out infinite;

        &.title {
          width: 60%;
          height: 14px;
        }

        &.subtitle {
          width: 40%;
          height: 10px;
        }
      }
    }
  `]
})
export class SkeletonComponent {
  @Input() type: SkeletonType = 'text';
  @Input() width = '';
  @Input() height = '';
  @Input() columns: { flex?: number; width?: string }[] = [];
}

// Skeleton list helper component
@Component({
  selector: 'app-skeleton-list',
  standalone: true,
  imports: [CommonModule, SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (item of items; track $index) {
      <app-skeleton 
        [type]="type" 
        [width]="width" 
        [height]="height"
        [columns]="columns">
      </app-skeleton>
    }
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
  `]
})
export class SkeletonListComponent {
  @Input() count = 3;
  @Input() type: SkeletonType = 'text';
  @Input() width = '';
  @Input() height = '';
  @Input() columns: { flex?: number; width?: string }[] = [];

  get items(): number[] {
    return Array.from({ length: this.count }, (_, i) => i);
  }
}
