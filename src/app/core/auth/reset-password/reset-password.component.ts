import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="reset-container">
      <div class="reset-card">
        <h2>Reset Password</h2>
        <p>Enter your new password below.</p>
        @if (!submitted) {
          <form (ngSubmit)="submit()">
            <input type="password" [(ngModel)]="password" name="password" placeholder="New password" required>
            <input type="password" [(ngModel)]="confirmPassword" name="confirmPassword" placeholder="Confirm password" required>
            @if (password && confirmPassword && password !== confirmPassword) {
              <p class="error">Passwords do not match</p>
            }
            <button type="submit" [disabled]="!password || !confirmPassword || password !== confirmPassword">Reset Password</button>
          </form>
        } @else {
          <div class="success-message">
            <p>Your password has been reset successfully.</p>
          </div>
        }
        <a routerLink="/auth/login">Back to login</a>
      </div>
    </div>
  `,
  styles: [`
    .reset-container { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; }
    .reset-card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
    input { width: 100%; padding: 1rem; margin: 0.5rem 0; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
    button { background: #1976d2; color: white; border: none; padding: 1rem 2rem; border-radius: 4px; cursor: pointer; width: 100%; margin-top: 1rem; }
    button:disabled { background: #ccc; }
    a { display: block; margin-top: 1rem; color: #1976d2; text-decoration: none; }
    .error { color: #f44336; font-size: 0.875rem; }
    .success-message { background: #e8f5e9; padding: 1rem; border-radius: 4px; margin: 1rem 0; }
  `]
})
export class ResetPasswordComponent {
  password = '';
  confirmPassword = '';
  submitted = false;
  
  constructor(private router: Router) {}
  
  submit(): void {
    // TODO: Implement password reset
    this.submitted = true;
  }
}
