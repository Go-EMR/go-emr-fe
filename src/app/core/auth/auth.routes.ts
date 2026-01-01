import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent),
    data: { title: 'Login' },
  },
  {
    path: 'mfa',
    loadComponent: () => import('./mfa/mfa.component').then(m => m.MfaComponent),
    data: { title: 'Two-Factor Authentication' },
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    data: { title: 'Forgot Password' },
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
    data: { title: 'Reset Password' },
  },
  {
    path: 'setup-mfa',
    loadComponent: () => import('./setup-mfa/setup-mfa.component').then(m => m.SetupMfaComponent),
    data: { title: 'Setup Two-Factor Authentication' },
  },
];
