import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type AvatarShape = 'circle' | 'square';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      class="avatar" 
      [class]="size + ' ' + shape"
      [class.with-status]="showStatus"
      [style.background-color]="!src && !icon ? getBackgroundColor() : null">
      @if (src) {
        <img [src]="src" [alt]="alt" loading="lazy" (error)="onImageError()">
      } @else if (icon) {
        <mat-icon>{{ icon }}</mat-icon>
      } @else {
        <span class="initials">{{ getInitials() }}</span>
      }
      
      @if (showStatus) {
        <span class="status-indicator" [class]="status"></span>
      }
    </div>
  `,
  styles: [`
    .avatar {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
      overflow: hidden;
      flex-shrink: 0;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      mat-icon {
        color: #64748b;
      }

      .initials {
        font-weight: 600;
        color: white;
        text-transform: uppercase;
        user-select: none;
      }
    }

    /* Shapes */
    .circle {
      border-radius: 50%;
    }

    .square {
      border-radius: 12px;
    }

    /* Sizes */
    .xs {
      width: 24px;
      height: 24px;

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }

      .initials {
        font-size: 10px;
      }
    }

    .sm {
      width: 32px;
      height: 32px;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .initials {
        font-size: 12px;
      }
    }

    .md {
      width: 40px;
      height: 40px;

      mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
      }

      .initials {
        font-size: 14px;
      }
    }

    .lg {
      width: 56px;
      height: 56px;

      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }

      .initials {
        font-size: 18px;
      }
    }

    .xl {
      width: 80px;
      height: 80px;

      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
      }

      .initials {
        font-size: 24px;
      }
    }

    /* Status indicator */
    .status-indicator {
      position: absolute;
      bottom: 0;
      right: 0;
      border-radius: 50%;
      border: 2px solid white;

      &.online {
        background: #10b981;
      }

      &.offline {
        background: #94a3b8;
      }

      &.busy {
        background: #ef4444;
      }

      &.away {
        background: #f59e0b;
      }
    }

    .xs .status-indicator {
      width: 6px;
      height: 6px;
      border-width: 1px;
    }

    .sm .status-indicator {
      width: 8px;
      height: 8px;
      border-width: 1.5px;
    }

    .md .status-indicator {
      width: 10px;
      height: 10px;
    }

    .lg .status-indicator {
      width: 12px;
      height: 12px;
    }

    .xl .status-indicator {
      width: 16px;
      height: 16px;
      border-width: 3px;
    }
  `]
})
export class AvatarComponent {
  @Input() src = '';
  @Input() set imageUrl(value: string) { this.src = value; } // Alias for src
  @Input() alt = '';
  @Input() name = '';
  @Input() icon = '';
  @Input() size: AvatarSize = 'md';
  @Input() shape: AvatarShape = 'circle';
  @Input() showStatus = false;
  @Input() status: 'online' | 'offline' | 'busy' | 'away' = 'offline';

  private fallbackUsed = false;

  getInitials(): string {
    if (!this.name) return '?';
    
    const parts = this.name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2);
    }
    return parts[0][0] + parts[parts.length - 1][0];
  }

  getBackgroundColor(): string {
    if (!this.name) return '#64748b';
    
    // Generate consistent color based on name
    const colors = [
      '#0077b6', '#00a8e8', '#10b981', '#f59e0b', 
      '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1'
    ];
    
    let hash = 0;
    for (let i = 0; i < this.name.length; i++) {
      hash = this.name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }

  onImageError(): void {
    if (!this.fallbackUsed) {
      this.fallbackUsed = true;
      this.src = '';
    }
  }
}

// Avatar group component for showing multiple avatars
@Component({
  selector: 'app-avatar-group',
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="avatar-group" [class]="size">
      @for (avatar of visibleAvatars; track avatar.name || $index) {
        <app-avatar
          [src]="avatar.src || ''"
          [name]="avatar.name || ''"
          [size]="size"
          [attr.title]="avatar.name">
        </app-avatar>
      }
      @if (overflowCount > 0) {
        <div class="overflow-indicator" [class]="size">
          +{{ overflowCount }}
        </div>
      }
    </div>
  `,
  styles: [`
    .avatar-group {
      display: flex;

      app-avatar, .overflow-indicator {
        margin-left: -8px;
        border: 2px solid white;
        border-radius: 50%;

        &:first-child {
          margin-left: 0;
        }
      }

      &.xs app-avatar, &.xs .overflow-indicator {
        margin-left: -4px;
        border-width: 1px;
      }

      &.sm app-avatar, &.sm .overflow-indicator {
        margin-left: -6px;
        border-width: 1.5px;
      }

      &.lg app-avatar, &.lg .overflow-indicator {
        margin-left: -10px;
      }

      &.xl app-avatar, &.xl .overflow-indicator {
        margin-left: -12px;
        border-width: 3px;
      }
    }

    .overflow-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e2e8f0;
      color: #64748b;
      font-weight: 600;

      &.xs {
        width: 24px;
        height: 24px;
        font-size: 8px;
      }

      &.sm {
        width: 32px;
        height: 32px;
        font-size: 10px;
      }

      &.md {
        width: 40px;
        height: 40px;
        font-size: 12px;
      }

      &.lg {
        width: 56px;
        height: 56px;
        font-size: 14px;
      }

      &.xl {
        width: 80px;
        height: 80px;
        font-size: 18px;
      }
    }
  `]
})
export class AvatarGroupComponent {
  @Input() avatars: { src?: string; name?: string }[] = [];
  @Input() max = 4;
  @Input() size: AvatarSize = 'md';

  get visibleAvatars(): { src?: string; name?: string }[] {
    return this.avatars.slice(0, this.max);
  }

  get overflowCount(): number {
    return Math.max(0, this.avatars.length - this.max);
  }
}
