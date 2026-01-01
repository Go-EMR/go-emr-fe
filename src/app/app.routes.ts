import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { hipaaGuard } from './core/guards/hipaa.guard';

/**
 * Main application routes with lazy loading for optimal performance
 * All protected routes require authentication and HIPAA compliance checks
 */
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  
  // Authentication routes (public)
  {
    path: 'auth',
    loadChildren: () => import('./core/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
  
  // Dashboard - Main entry point after login
  {
    path: 'dashboard',
    loadChildren: () => import('./domains/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
    canActivate: [authGuard, hipaaGuard],
    data: { 
      title: 'Dashboard',
      breadcrumb: 'Dashboard',
    },
  },
  
  // Patients domain
  {
    path: 'patients',
    loadChildren: () => import('./domains/patients/patients.routes').then(m => m.PATIENT_ROUTES),
    canActivate: [authGuard, hipaaGuard],
    data: { 
      title: 'Patients',
      breadcrumb: 'Patients',
      requiredPermissions: ['patients:read'],
    },
  },
  
  // Appointments domain
  {
    path: 'appointments',
    loadChildren: () => import('./domains/appointments/appointments.routes').then(m => m.APPOINTMENTS_ROUTES),
    canActivate: [authGuard, hipaaGuard],
    data: { 
      title: 'Appointments',
      breadcrumb: 'Appointments',
      requiredPermissions: ['appointments:read'],
    },
  },
  
  // Encounters domain (Clinical)
  {
    path: 'encounters',
    loadChildren: () => import('./domains/encounters/encounters.routes').then(m => m.ENCOUNTER_ROUTES),
    canActivate: [authGuard, hipaaGuard],
    data: { 
      title: 'Encounters',
      breadcrumb: 'Encounters',
      requiredPermissions: ['encounters:read'],
    },
  },
  
  // Prescriptions domain
  {
    path: 'prescriptions',
    loadChildren: () => import('./domains/prescriptions/prescriptions.routes').then(m => m.PRESCRIPTION_ROUTES),
    canActivate: [authGuard, hipaaGuard],
    data: { 
      title: 'Prescriptions',
      breadcrumb: 'Prescriptions',
      requiredPermissions: ['prescriptions:read'],
    },
  },
  
  // Labs domain
  {
    path: 'labs',
    loadChildren: () => import('./domains/labs/labs.routes').then(m => m.LAB_ROUTES),
    canActivate: [authGuard, hipaaGuard],
    data: { 
      title: 'Labs',
      breadcrumb: 'Labs',
      requiredPermissions: ['labs:read'],
    },
  },
  
  // Imaging domain
  {
    path: 'imaging',
    loadChildren: () => import('./domains/imaging/imaging.routes').then(m => m.IMAGING_ROUTES),
    canActivate: [authGuard, hipaaGuard],
    data: { 
      title: 'Imaging',
      breadcrumb: 'Imaging',
      requiredPermissions: ['imaging:read'],
    },
  },
  
  // Billing domain
  {
    path: 'billing',
    loadChildren: () => import('./domains/billing/billing.routes').then(m => m.BILLING_ROUTES),
    canActivate: [authGuard, hipaaGuard, roleGuard],
    data: { 
      title: 'Billing',
      breadcrumb: 'Billing',
      requiredPermissions: ['billing:read'],
      allowedRoles: ['admin', 'billing_staff', 'provider'],
    },
  },
  
  // Messaging domain
  {
    path: 'messages',
    loadChildren: () => import('./domains/messaging/messaging.routes').then(m => m.MESSAGING_ROUTES),
    canActivate: [authGuard, hipaaGuard],
    data: { 
      title: 'Messages',
      breadcrumb: 'Messages',
      requiredPermissions: ['messages:read'],
    },
  },
  
  // Reports domain
  {
    path: 'reports',
    loadChildren: () => import('./domains/reports/reports.routes').then(m => m.REPORTS_ROUTES),
    canActivate: [authGuard, hipaaGuard],
    data: { 
      title: 'Reports',
      breadcrumb: 'Reports',
      requiredPermissions: ['reports:read'],
    },
  },
  
  // Patient Portal (separate auth flow)
  {
    path: 'portal',
    loadChildren: () => import('./domains/portal/portal.routes').then(m => m.PORTAL_ROUTES),
    data: { 
      title: 'Patient Portal',
      breadcrumb: 'Portal',
    },
  },
  
  // Admin domain
  {
    path: 'admin',
    loadChildren: () => import('./domains/admin/admin.routes').then(m => m.ADMIN_ROUTES),
    canActivate: [authGuard, hipaaGuard, roleGuard],
    data: { 
      title: 'Administration',
      breadcrumb: 'Admin',
      allowedRoles: ['admin', 'super_admin'],
    },
  },
  
  // Error pages
  {
    path: 'unauthorized',
    loadComponent: () => import('./shared/components/error-pages/unauthorized.component')
      .then(m => m.UnauthorizedComponent),
  },
  {
    path: 'session-expired',
    loadComponent: () => import('./shared/components/error-pages/session-expired.component')
      .then(m => m.SessionExpiredComponent),
  },
  
  // Wildcard route
  {
    path: '**',
    loadComponent: () => import('./shared/components/error-pages/not-found.component')
      .then(m => m.NotFoundComponent),
  },
];
