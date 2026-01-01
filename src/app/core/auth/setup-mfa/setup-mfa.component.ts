import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-setup-mfa',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="setup-container">
      <div class="setup-card">
        <h2>Setup Two-Factor Authentication</h2>
        @if (step === 1) {
          <div class="step-content">
            <p>Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
            <div class="qr-placeholder">
              <div class="qr-box">QR Code</div>
            </div>
            <p class="manual-entry">Or enter this code manually: <code>XXXX-XXXX-XXXX-XXXX</code></p>
            <button (click)="step = 2">Next</button>
          </div>
        } @else {
          <div class="step-content">
            <p>Enter the verification code from your authenticator app</p>
            <input type="text" [(ngModel)]="code" placeholder="000000" maxlength="6" class="code-input">
            <button (click)="verify()" [disabled]="code.length !== 6">Verify & Enable</button>
            <button class="secondary" (click)="step = 1">Back</button>
          </div>
        }
        <a routerLink="/dashboard">Skip for now</a>
      </div>
    </div>
  `,
  styles: [`
    .setup-container { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; }
    .setup-card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
    .qr-placeholder { margin: 1.5rem 0; }
    .qr-box { width: 200px; height: 200px; background: #f0f0f0; margin: 0 auto; display: flex; align-items: center; justify-content: center; border: 2px dashed #ccc; }
    .manual-entry { font-size: 0.875rem; color: #666; }
    code { background: #f5f5f5; padding: 0.25rem 0.5rem; border-radius: 4px; }
    .code-input { font-size: 2rem; text-align: center; letter-spacing: 0.5rem; padding: 1rem; margin: 1rem 0; width: 200px; border: 2px solid #ddd; border-radius: 4px; }
    button { background: #1976d2; color: white; border: none; padding: 1rem 2rem; border-radius: 4px; cursor: pointer; width: 100%; margin-top: 0.5rem; }
    button:disabled { background: #ccc; }
    button.secondary { background: #f5f5f5; color: #333; }
    a { display: block; margin-top: 1rem; color: #1976d2; text-decoration: none; }
  `]
})
export class SetupMfaComponent {
  step = 1;
  code = '';
  
  constructor(private router: Router) {}
  
  verify(): void {
    // TODO: Implement MFA setup verification
    this.router.navigate(['/dashboard']);
  }
}
