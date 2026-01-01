import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

// PrimeNG v19 imports
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';

import { AuthService, LoginCredentials } from '../auth.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    // PrimeNG modules
    InputTextModule,
    PasswordModule,
    ButtonModule,
    CheckboxModule,
    CardModule,
    DividerModule,
    IconFieldModule,
    InputIconModule,
    ToastModule,
    RippleModule,
    TooltipModule,
  ],
  providers: [MessageService],
  template: `
    <div class="login-container" [class.dark]="themeService.isDarkMode()">
      <p-toast position="top-right" />
      
      <!-- Theme Toggle -->
      <button 
        class="theme-toggle"
        (click)="themeService.toggleTheme()"
        [pTooltip]="themeService.isDarkMode() ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
        tooltipPosition="left">
        <i [class]="themeService.isDarkMode() ? 'pi pi-sun' : 'pi pi-moon'"></i>
      </button>
      
      <div class="login-card">
        <!-- Logo and Header -->
        <div class="login-header">
          <div class="logo-container">
            <img src="assets/logo.svg" alt="GoEMR Logo" class="logo" />
          </div>
          <h1 class="app-title">GoEMR</h1>
          <p class="app-subtitle">Modern Electronic Health Records</p>
        </div>

        <!-- Login Form -->
        <form (ngSubmit)="onSubmit()" class="login-form">
          <!-- Email Field -->
          <div class="field">
            <label for="email" class="field-label">Email Address*</label>
            <p-iconfield>
              <p-inputicon styleClass="pi pi-envelope" />
              <input 
                pInputText 
                id="email"
                type="email"
                [(ngModel)]="email"
                name="email"
                placeholder="Enter your email"
                class="w-full"
                [class.ng-invalid]="emailError()"
                required
              />
            </p-iconfield>
            @if (emailError()) {
              <small class="field-error">{{ emailError() }}</small>
            }
          </div>

          <!-- Password Field -->
          <div class="field">
            <label for="password" class="field-label">Password*</label>
            <p-password 
              id="password"
              [(ngModel)]="password"
              name="password"
              placeholder="Enter your password"
              [toggleMask]="true"
              [feedback]="false"
              styleClass="w-full"
              inputStyleClass="w-full"
              [class.ng-invalid]="passwordError()"
              required
            />
            @if (passwordError()) {
              <small class="field-error">{{ passwordError() }}</small>
            }
          </div>

          <!-- Remember Me & Forgot Password -->
          <div class="form-options">
            <div class="remember-me">
              <p-checkbox 
                [(ngModel)]="rememberMe" 
                name="rememberMe"
                [binary]="true" 
                inputId="rememberMe"
              />
              <label for="rememberMe" class="remember-label">Remember me</label>
            </div>
            <a routerLink="/auth/forgot-password" class="forgot-link">Forgot password?</a>
          </div>

          <!-- Submit Button -->
          <p-button 
            type="submit"
            label="Sign In"
            icon="pi pi-sign-in"
            styleClass="w-full"
            [loading]="isLoading()"
            [disabled]="isLoading()"
          />
        </form>

        <!-- HIPAA Notice -->
        <div class="hipaa-notice">
          <i class="pi pi-shield"></i>
          <div>
            <span>This is a HIPAA-compliant secure system.</span>
            <span>Unauthorized access is prohibited.</span>
          </div>
        </div>

        <p-divider />

        <!-- Demo Credentials -->
        <div class="demo-section">
          <p class="demo-title">Demo Credentials:</p>
          <div class="demo-buttons">
            <p-button 
              label="Admin" 
              icon="pi pi-user" 
              severity="secondary"
              [outlined]="true"
              size="small"
              (onClick)="fillDemoCredentials('admin')"
            />
            <p-button 
              label="Doctor" 
              icon="pi pi-id-card" 
              severity="secondary"
              [outlined]="true"
              size="small"
              (onClick)="fillDemoCredentials('doctor')"
            />
            <p-button 
              label="Nurse" 
              icon="pi pi-heart" 
              severity="secondary"
              [outlined]="true"
              size="small"
              (onClick)="fillDemoCredentials('nurse')"
            />
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #1e40af 100%);
      padding: 1rem;
      position: relative;
      transition: background 0.3s ease;
    }
    
    .login-container.dark {
      background: linear-gradient(135deg, #0c4a6e 0%, #1e3a8a 50%, #0f172a 100%);
    }

    .theme-toggle {
      position: absolute;
      top: 1.5rem;
      right: 1.5rem;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      font-size: 1.25rem;
    }
    
    .theme-toggle:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.1);
    }

    .login-card {
      background: white;
      border-radius: 1.5rem;
      padding: 2.5rem;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      transition: all 0.3s ease;
    }
    
    .dark .login-card {
      background: #1e293b;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }

    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .logo-container {
      display: flex;
      justify-content: center;
      margin-bottom: 1rem;
    }

    .logo {
      width: 64px;
      height: 64px;
    }

    .app-title {
      font-size: 2rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
      transition: color 0.3s ease;
    }
    
    .dark .app-title {
      color: #f1f5f9;
    }

    .app-subtitle {
      color: #64748b;
      margin: 0.25rem 0 0;
      font-size: 0.95rem;
      transition: color 0.3s ease;
    }
    
    .dark .app-subtitle {
      color: #94a3b8;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .field-label {
      font-weight: 500;
      color: #374151;
      font-size: 0.875rem;
      transition: color 0.3s ease;
    }
    
    .dark .field-label {
      color: #e2e8f0;
    }

    .field-error {
      color: #dc2626;
      font-size: 0.75rem;
    }
    
    .dark .field-error {
      color: #f87171;
    }

    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .remember-me {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .remember-label {
      font-size: 0.875rem;
      color: #4b5563;
      cursor: pointer;
      transition: color 0.3s ease;
    }
    
    .dark .remember-label {
      color: #cbd5e1;
    }

    .forgot-link {
      font-size: 0.875rem;
      color: #3b82f6;
      text-decoration: none;
      font-weight: 500;
    }

    .forgot-link:hover {
      text-decoration: underline;
    }
    
    .dark .forgot-link {
      color: #60a5fa;
    }

    .hipaa-notice {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 0.75rem;
      padding: 0.875rem 1rem;
      margin-top: 1.5rem;
      transition: all 0.3s ease;
    }
    
    .dark .hipaa-notice {
      background: #064e3b;
      border-color: #065f46;
    }

    .hipaa-notice i {
      color: #16a34a;
      font-size: 1.25rem;
      margin-top: 0.125rem;
    }
    
    .dark .hipaa-notice i {
      color: #34d399;
    }

    .hipaa-notice div {
      display: flex;
      flex-direction: column;
      font-size: 0.8125rem;
      color: #166534;
      line-height: 1.4;
    }
    
    .dark .hipaa-notice div {
      color: #a7f3d0;
    }

    .demo-section {
      text-align: center;
    }

    .demo-title {
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 0.75rem;
      transition: color 0.3s ease;
    }
    
    .dark .demo-title {
      color: #9ca3af;
    }

    .demo-buttons {
      display: flex;
      gap: 0.5rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    /* PrimeNG overrides */
    :host ::ng-deep {
      .p-password {
        width: 100%;
      }
      
      .p-password input {
        width: 100%;
      }

      .p-iconfield {
        width: 100%;
      }

      .p-inputtext {
        width: 100%;
      }

      .p-button.w-full {
        width: 100%;
        justify-content: center;
      }

      .p-divider {
        margin: 1.5rem 0;
      }

      .p-checkbox {
        width: 1.25rem;
        height: 1.25rem;
      }
      
      /* Dark mode input overrides */
      .dark .p-inputtext {
        background: #334155;
        border-color: #475569;
        color: #f1f5f9;
      }
      
      .dark .p-inputtext::placeholder {
        color: #94a3b8;
      }
      
      .dark .p-inputtext:enabled:hover {
        border-color: #60a5fa;
      }
      
      .dark .p-inputtext:enabled:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 1px #3b82f6;
      }
      
      .dark .p-password-input {
        background: #334155;
        border-color: #475569;
        color: #f1f5f9;
      }
      
      .dark .p-icon-field-left > .p-inputicon {
        color: #94a3b8;
      }
      
      .dark .p-divider::before {
        border-color: #475569;
      }
      
      .dark .p-button-secondary.p-button-outlined {
        border-color: #475569;
        color: #e2e8f0;
      }
      
      .dark .p-button-secondary.p-button-outlined:hover {
        background: #334155;
        border-color: #60a5fa;
        color: #60a5fa;
      }
    }

    /* Responsive */
    @media (max-width: 480px) {
      .login-card {
        padding: 1.5rem;
        border-radius: 1rem;
      }

      .demo-buttons {
        flex-direction: column;
      }

      .demo-buttons .p-button {
        width: 100%;
      }
      
      .theme-toggle {
        top: 1rem;
        right: 1rem;
        width: 40px;
        height: 40px;
      }
    }
  `]
})
export class LoginComponent implements OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  readonly themeService = inject(ThemeService);
  
  private loginSubscription?: Subscription;

  // Form fields
  email = '';
  password = '';
  rememberMe = false;

  // State signals
  isLoading = signal(false);
  emailError = signal<string | null>(null);
  passwordError = signal<string | null>(null);

  ngOnDestroy(): void {
    this.loginSubscription?.unsubscribe();
  }

  fillDemoCredentials(role: 'admin' | 'doctor' | 'nurse'): void {
    const credentials: Record<string, { email: string; password: string }> = {
      admin: { email: 'admin@goemr.com', password: 'admin123' },
      doctor: { email: 'doctor@goemr.com', password: 'doctor123' },
      nurse: { email: 'nurse@goemr.com', password: 'nurse123' },
    };

    const cred = credentials[role];
    this.email = cred.email;
    this.password = cred.password;
    
    this.messageService.add({
      severity: 'info',
      summary: 'Demo Credentials',
      detail: `Filled ${role} credentials`,
      life: 2000
    });
  }

  onSubmit(): void {
    // Reset errors
    this.emailError.set(null);
    this.passwordError.set(null);

    // Validate
    if (!this.email) {
      this.emailError.set('Email is required');
      return;
    }

    if (!this.email.includes('@')) {
      this.emailError.set('Please enter a valid email address');
      return;
    }

    if (!this.password) {
      this.passwordError.set('Password is required');
      return;
    }

    if (this.password.length < 6) {
      this.passwordError.set('Password must be at least 6 characters');
      return;
    }

    this.isLoading.set(true);

    // Create credentials object matching AuthService interface
    const credentials: LoginCredentials = {
      email: this.email,
      password: this.password,
      rememberMe: this.rememberMe
    };

    // Subscribe to login Observable
    this.loginSubscription = this.authService.login(credentials).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Welcome!',
          detail: `Welcome back, ${response.user.firstName}!`,
          life: 2000
        });
        
        // Navigate to dashboard after brief delay
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 500);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Login Failed',
          detail: error?.error?.message || 'Invalid email or password',
          life: 4000
        });
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }
}
