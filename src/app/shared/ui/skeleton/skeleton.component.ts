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
      background: linear-gradient(
        90deg,
        #f1f5f9 0%,
        #e2e8f0 20%,
        #f8fafc 40%,
        #e2e8f0 60%,
        #f1f5f9 100%
      );
      background-size: 200% 100%;
      border-radius: 4px;
      animation: shimmer 1.5s ease-in-out infinite;
    }

    @keyframes shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .skeleton {
        animation: none;
        background: #e2e8f0;
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
        background: linear-gradient(
          90deg,
          #e2e8f0 0%,
          #cbd5e1 20%,
          #f1f5f9 40%,
          #cbd5e1 60%,
          #e2e8f0 100%
        );
        background-size: 200% 100%;
        flex-shrink: 0;
        animation: shimmer 1.5s ease-in-out infinite;
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
        background: linear-gradient(
          90deg,
          #e2e8f0 0%,
          #cbd5e1 20%,
          #f1f5f9 40%,
          #cbd5e1 60%,
          #e2e8f0 100%
        );
        background-size: 200% 100%;
        border-radius: 4px;
        animation: shimmer 1.5s ease-in-out infinite;

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
        background: linear-gradient(
          90deg,
          #e2e8f0 0%,
          #cbd5e1 20%,
          #f1f5f9 40%,
          #cbd5e1 60%,
          #e2e8f0 100%
        );
        background-size: 200% 100%;
        border-radius: 4px;
        animation: shimmer 1.5s ease-in-out infinite;
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
        background: linear-gradient(
          90deg,
          #e2e8f0 0%,
          #cbd5e1 20%,
          #f1f5f9 40%,
          #cbd5e1 60%,
          #e2e8f0 100%
        );
        background-size: 200% 100%;
        flex-shrink: 0;
        animation: shimmer 1.5s ease-in-out infinite;

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
        background: linear-gradient(
          90deg,
          #e2e8f0 0%,
          #cbd5e1 20%,
          #f1f5f9 40%,
          #cbd5e1 60%,
          #e2e8f0 100%
        );
        background-size: 200% 100%;
        border-radius: 4px;
        animation: shimmer 1.5s ease-in-out infinite;

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

    /* Dark mode support */
    :host-context(.dark-mode),
    :host-context([data-theme="dark"]) {
      .skeleton {
        background: linear-gradient(
          90deg,
          #334155 0%,
          #475569 20%,
          #3d4f63 40%,
          #475569 60%,
          #334155 100%
        );
        background-size: 200% 100%;
      }

      .skeleton-avatar,
      .skeleton-line {
        background: linear-gradient(
          90deg,
          #475569 0%,
          #64748b 20%,
          #52667a 40%,
          #64748b 60%,
          #475569 100%
        );
        background-size: 200% 100%;
      }

      .card {
        background: #1e293b;
        border-color: #334155;
      }
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .skeleton,
      .skeleton-avatar,
      .skeleton-line {
        animation: none;
        background: #e2e8f0;
      }

      :host-context(.dark-mode) .skeleton,
      :host-context(.dark-mode) .skeleton-avatar,
      :host-context(.dark-mode) .skeleton-line,
      :host-context([data-theme="dark"]) .skeleton,
      :host-context([data-theme="dark"]) .skeleton-avatar,
      :host-context([data-theme="dark"]) .skeleton-line {
        background: #475569;
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
