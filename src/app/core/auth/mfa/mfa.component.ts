import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mfa',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mfa-container">
      <div class="mfa-card">
        <h2>Two-Factor Authentication</h2>
        <p>Enter the verification code from your authenticator app</p>
        <input type="text" [(ngModel)]="code" placeholder="000000" maxlength="6" class="code-input">
        <button (click)="verify()" [disabled]="code.length !== 6">Verify</button>
        <a href="/auth/login">Back to login</a>
      </div>
    </div>
  `,
  styles: [`
    .mfa-container { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; }
    .mfa-card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
    .code-input { font-size: 2rem; text-align: center; letter-spacing: 0.5rem; padding: 1rem; margin: 1rem 0; width: 200px; border: 2px solid #ddd; border-radius: 4px; }
    button { background: #1976d2; color: white; border: none; padding: 1rem 2rem; border-radius: 4px; cursor: pointer; width: 100%; margin-top: 1rem; }
    button:disabled { background: #ccc; }
    a { display: block; margin-top: 1rem; color: #1976d2; }
  `]
})
export class MfaComponent {
  code = '';
  
  constructor(private router: Router) {}
  
  verify(): void {
    // TODO: Implement MFA verification
    this.router.navigate(['/dashboard']);
  }
}
