import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface SessionTimeoutDialogData {
  remainingTime: number;
}

@Component({
  selector: 'app-session-timeout-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Session Timeout Warning</h2>
    <mat-dialog-content>
      <p>Your session will expire in {{ data.remainingTime }} seconds due to inactivity.</p>
      <p>Would you like to continue your session?</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="logout()">Logout</button>
      <button mat-raised-button color="primary" (click)="continue()">Continue Session</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content { padding: 20px 24px; }
    mat-dialog-actions { padding: 8px 24px 24px; }
  `]
})
export class SessionTimeoutDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<SessionTimeoutDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SessionTimeoutDialogData
  ) {}
  
  continue(): void {
    this.dialogRef.close('continue');
  }
  
  logout(): void {
    this.dialogRef.close('logout');
  }
}
