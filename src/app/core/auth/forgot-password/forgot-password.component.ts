import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="forgot-container">
      <div class="forgot-card">
        <h2>Forgot Password</h2>
        <p>Enter your email address and we'll send you a link to reset your password.</p>
        @if (!submitted) {
          <form (ngSubmit)="submit()">
            <input type="email" [(ngModel)]="email" name="email" placeholder="Email address" required>
            <button type="submit" [disabled]="!email">Send Reset Link</button>
          </form>
        } @else {
          <div class="success-message">
            <p>If an account exists with that email, you'll receive a password reset link shortly.</p>
          </div>
        }
        <a routerLink="/auth/login">Back to login</a>
      </div>
    </div>
  `,
  styles: [`
    .forgot-container { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; }
    .forgot-card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
    input { width: 100%; padding: 1rem; margin: 1rem 0; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
    button { background: #1976d2; color: white; border: none; padding: 1rem 2rem; border-radius: 4px; cursor: pointer; width: 100%; }
    button:disabled { background: #ccc; }
    a { display: block; margin-top: 1rem; color: #1976d2; text-decoration: none; }
    .success-message { background: #e8f5e9; padding: 1rem; border-radius: 4px; margin: 1rem 0; }
  `]
})
export class ForgotPasswordComponent {
  email = '';
  submitted = false;
  
  submit(): void {
    // TODO: Implement forgot password
    this.submitted = true;
  }
}
