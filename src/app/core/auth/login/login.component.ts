import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { trigger, transition, style, animate, keyframes } from '@angular/animations';

import { AuthService } from '../auth.service';

@Component({
  selector: 'emr-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('600ms cubic-bezier(0.35, 0, 0.25, 1)', 
          style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('400ms 200ms ease-out', style({ opacity: 1 }))
      ])
    ]),
    trigger('shake', [
      transition('* => error', [
        animate('400ms', keyframes([
          style({ transform: 'translateX(0)' }),
          style({ transform: 'translateX(-10px)' }),
          style({ transform: 'translateX(10px)' }),
          style({ transform: 'translateX(-10px)' }),
          style({ transform: 'translateX(10px)' }),
          style({ transform: 'translateX(0)' }),
        ]))
      ])
    ]),
    trigger('pulse', [
      transition(':enter', [
        animate('1s ease-in-out', keyframes([
          style({ transform: 'scale(1)', offset: 0 }),
          style({ transform: 'scale(1.05)', offset: 0.5 }),
          style({ transform: 'scale(1)', offset: 1 }),
        ]))
      ])
    ])
  ],
  template: `
    <div class="login-container">
      <!-- Background with gradient -->
      <div class="background-layer">
        <div class="gradient-overlay"></div>
        <div class="pattern-overlay"></div>
      </div>
      
      <!-- Login Card -->
      <mat-card class="login-card" [@fadeInUp]>
        <!-- Logo Section -->
        <div class="logo-section" [@pulse]>
          <div class="logo-container">
            <img src="assets/logo.svg" alt="GoEMR Logo" class="logo-img">
          </div>
          <h1 class="app-title">GoEMR</h1>
          <p class="app-subtitle">Modern Electronic Health Records</p>
        </div>
        
        <!-- Login Form -->
        <form 
          [formGroup]="loginForm" 
          (ngSubmit)="onSubmit()"
          class="login-form"
          [@shake]="animationState()">
          
          <!-- Email Field -->
          <mat-form-field appearance="outline" class="full-width" [@fadeIn]>
            <mat-label>Email Address</mat-label>
            <input 
              matInput 
              type="email" 
              formControlName="email"
              placeholder="Enter your email"
              autocomplete="email">
            <mat-icon matPrefix>email</mat-icon>
            @if (loginForm.get('email')?.hasError('required') && loginForm.get('email')?.touched) {
              <mat-error>Email is required</mat-error>
            }
            @if (loginForm.get('email')?.hasError('email') && loginForm.get('email')?.touched) {
              <mat-error>Please enter a valid email</mat-error>
            }
          </mat-form-field>
          
          <!-- Password Field -->
          <mat-form-field appearance="outline" class="full-width" [@fadeIn]>
            <mat-label>Password</mat-label>
            <input 
              matInput 
              [type]="hidePassword() ? 'password' : 'text'"
              formControlName="password"
              placeholder="Enter your password"
              autocomplete="current-password">
            <mat-icon matPrefix>lock</mat-icon>
            <button 
              mat-icon-button 
              matSuffix 
              type="button"
              (click)="togglePasswordVisibility()"
              [attr.aria-label]="hidePassword() ? 'Show password' : 'Hide password'">
              <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (loginForm.get('password')?.hasError('required') && loginForm.get('password')?.touched) {
              <mat-error>Password is required</mat-error>
            }
            @if (loginForm.get('password')?.hasError('minlength') && loginForm.get('password')?.touched) {
              <mat-error>Password must be at least 8 characters</mat-error>
            }
          </mat-form-field>
          
          <!-- Remember Me & Forgot Password -->
          <div class="form-options" [@fadeIn]>
            <mat-checkbox formControlName="rememberMe" color="primary">
              Remember me
            </mat-checkbox>
            <a routerLink="/auth/forgot-password" class="forgot-link">
              Forgot password?
            </a>
          </div>
          
          <!-- Submit Button -->
          <button 
            mat-raised-button 
            color="primary" 
            type="submit"
            class="submit-button"
            [disabled]="loginForm.invalid || authService.isLoading()"
            [@fadeIn]>
            @if (authService.isLoading()) {
              <mat-spinner diameter="20" class="button-spinner"></mat-spinner>
              <span>Signing in...</span>
            } @else {
              <mat-icon>login</mat-icon>
              <span>Sign In</span>
            }
          </button>
        </form>
        
        <!-- Security Notice -->
        <div class="security-notice" [@fadeIn]>
          <mat-icon>security</mat-icon>
          <span>This is a HIPAA-compliant secure system. Unauthorized access is prohibited.</span>
        </div>
        
        <!-- Demo Credentials -->
        <div class="demo-credentials" [@fadeIn]>
          <p class="demo-title">Demo Credentials:</p>
          <div class="demo-accounts">
            <button type="button" mat-stroked-button (click)="fillDemoCredentials('admin')" class="demo-btn">
              <mat-icon>admin_panel_settings</mat-icon>
              <span>Admin</span>
            </button>
            <button type="button" mat-stroked-button (click)="fillDemoCredentials('doctor')" class="demo-btn">
              <mat-icon>medical_services</mat-icon>
              <span>Doctor</span>
            </button>
            <button type="button" mat-stroked-button (click)="fillDemoCredentials('nurse')" class="demo-btn">
              <mat-icon>healing</mat-icon>
              <span>Nurse</span>
            </button>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="card-footer" [@fadeIn]>
          <p>© 2025 GoEMR. All rights reserved.</p>
          <div class="footer-links">
            <a href="#">Privacy Policy</a>
            <span class="divider">|</span>
            <a href="#">Terms of Service</a>
            <span class="divider">|</span>
            <a href="#">Contact Support</a>
          </div>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      padding: 24px;
    }
    
    .background-layer {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: -1;
    }
    
    .gradient-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, 
        var(--primary-color, #1976d2) 0%, 
        var(--primary-dark, #0d47a1) 50%,
        var(--accent-color, #00acc1) 100%);
    }
    
    .pattern-overlay {
      position: absolute;
      inset: 0;
      opacity: 0.1;
      background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    }
    
    .login-card {
      width: 100%;
      max-width: 440px;
      padding: 40px;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(10px);
    }
    
    .logo-section {
      text-align: center;
      margin-bottom: 32px;
    }
    
    .logo-container {
      width: 80px;
      height: 80px;
      margin: 0 auto 16px;
      border-radius: 20px;
      background: linear-gradient(135deg, #e0f2fe, #bae6fd);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 20px rgba(14, 165, 233, 0.2);
    }
    
    .logo-img {
      width: 56px;
      height: 56px;
      object-fit: contain;
    }
    
    .app-title {
      font-size: 28px;
      font-weight: 700;
      color: #1a1a2e;
      margin: 0 0 4px;
      letter-spacing: -0.5px;
    }
    
    .app-subtitle {
      font-size: 14px;
      color: #666;
      margin: 0;
    }
    
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .full-width {
      width: 100%;
    }
    
    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 8px 0 16px;
    }
    
    .forgot-link {
      color: #1976d2;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: color 0.2s ease;
      
      &:hover {
        color: #0d47a1;
        text-decoration: underline;
      }
    }
    
    .submit-button {
      height: 52px;
      font-size: 16px;
      font-weight: 600;
      letter-spacing: 0.5px;
      border-radius: 8px;
      margin-top: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      
      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }
    
    .button-spinner {
      margin-right: 8px;
    }
    
    .security-notice {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 24px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 8px;
      font-size: 12px;
      color: #666;
      
      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #4caf50;
      }
    }
    
    .demo-credentials {
      margin-top: 20px;
      padding: 16px;
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      border-radius: 8px;
      border: 1px solid #90caf9;
      
      .demo-title {
        font-size: 12px;
        font-weight: 600;
        color: #1565c0;
        margin: 0 0 12px;
        text-align: center;
      }
      
      .demo-accounts {
        display: flex;
        justify-content: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      
      .demo-btn {
        font-size: 11px;
        padding: 4px 12px;
        min-width: 80px;
        
        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
          margin-right: 4px;
        }
      }
    }
    
    .card-footer {
      text-align: center;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      
      p {
        font-size: 12px;
        color: #999;
        margin: 0 0 8px;
      }
    }
    
    .footer-links {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      
      a {
        font-size: 12px;
        color: #666;
        text-decoration: none;
        
        &:hover {
          color: #1976d2;
        }
      }
      
      .divider {
        color: #ccc;
      }
    }
    
    // Responsive
    @media (max-width: 480px) {
      .login-card {
        padding: 24px;
        border-radius: 12px;
      }
      
      .logo-container {
        width: 64px;
        height: 64px;
        border-radius: 16px;
        
        .logo-img {
          width: 44px;
          height: 44px;
        }
      }
      
      .app-title {
        font-size: 24px;
      }
      
      .form-options {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
    }
  `],
})
export class LoginComponent {
  protected readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  
  protected readonly hidePassword = signal(true);
  protected readonly animationState = signal<string>('');
  
  protected loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rememberMe: [false],
  });
  
  togglePasswordVisibility(): void {
    this.hidePassword.update(v => !v);
  }
  
  fillDemoCredentials(role: 'admin' | 'doctor' | 'nurse'): void {
    const credentials = {
      admin: { email: 'admin@goemr.com', password: 'admin123' },
      doctor: { email: 'doctor@goemr.com', password: 'doctor123' },
      nurse: { email: 'nurse@goemr.com', password: 'nurse123' },
    };
    
    this.loginForm.patchValue(credentials[role]);
  }
  
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.animationState.set('error');
      setTimeout(() => this.animationState.set(''), 400);
      return;
    }
    
    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        if (response.mfaRequired) {
          this.router.navigate(['/auth/mfa']);
        } else {
          this.snackBar.open('Welcome back!', 'Close', { duration: 3000 });
          this.router.navigate(['/dashboard']);
        }
      },
      error: (error) => {
        this.animationState.set('error');
        setTimeout(() => this.animationState.set(''), 400);
        this.snackBar.open(
          error.error?.message || 'Login failed. Please try again.',
          'Close',
          { duration: 5000, panelClass: 'error-snackbar' }
        );
      },
    });
  }
}
