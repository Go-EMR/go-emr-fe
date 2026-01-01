import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
  icon?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="confirm-dialog" [class]="data.type || 'info'">
      <div class="dialog-icon">
        <mat-icon>{{ data.icon || getDefaultIcon() }}</mat-icon>
      </div>
      
      <h2 mat-dialog-title>{{ data.title }}</h2>
      
      <mat-dialog-content>
        <p>{{ data.message }}</p>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button 
          mat-button 
          (click)="onCancel()"
          class="cancel-btn">
          {{ data.cancelText || 'Cancel' }}
        </button>
        <button 
          mat-flat-button 
          [color]="getButtonColor()"
          (click)="onConfirm()"
          class="confirm-btn">
          {{ data.confirmText || 'Confirm' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      padding: 8px;
      min-width: 320px;
      max-width: 400px;
    }

    .dialog-icon {
      display: flex;
      justify-content: center;
      margin-bottom: 16px;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
      }
    }

    /* Type variations */
    .warning .dialog-icon mat-icon {
      color: #f59e0b;
    }

    .danger .dialog-icon mat-icon {
      color: #dc2626;
    }

    .info .dialog-icon mat-icon {
      color: #0077b6;
    }

    h2[mat-dialog-title] {
      text-align: center;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 8px;
    }

    mat-dialog-content {
      text-align: center;
      
      p {
        margin: 0;
        color: #64748b;
        font-size: 0.95rem;
        line-height: 1.5;
      }
    }

    mat-dialog-actions {
      margin-top: 24px;
      padding: 0;
      gap: 12px;

      .cancel-btn {
        color: #64748b;
      }
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  getDefaultIcon(): string {
    switch (this.data.type) {
      case 'danger':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'help';
    }
  }

  getButtonColor(): 'primary' | 'warn' | 'accent' {
    switch (this.data.type) {
      case 'danger':
        return 'warn';
      default:
        return 'primary';
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
