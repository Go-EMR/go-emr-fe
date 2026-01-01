import { Routes } from '@angular/router';

export const PORTAL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./feature-dashboard/portal-dashboard.component').then(m => m.PortalDashboardComponent),
    title: 'Patient Portal'
  },
  {
    path: 'appointments',
    loadComponent: () => import('./feature-appointments/portal-appointments.component').then(m => m.PortalAppointmentsComponent),
    title: 'My Appointments'
  },
  {
    path: 'billing',
    loadComponent: () => import('./feature-billing/portal-billing.component').then(m => m.PortalBillingComponent),
    title: 'Billing & Payments'
  },
  {
    path: 'health',
    loadComponent: () => import('./feature-health/portal-health.component').then(m => m.PortalHealthComponent),
    title: 'My Health Records'
  },
  {
    path: 'messages',
    loadComponent: () => import('./feature-messages/portal-messages.component').then(m => m.PortalMessagesComponent),
    title: 'Messages'
  },
  {
    path: 'forms',
    loadComponent: () => import('./feature-forms/portal-forms.component').then(m => m.PortalFormsComponent),
    title: 'Forms & Documents'
  },
  {
    path: 'settings',
    loadComponent: () => import('./feature-settings/portal-settings.component').then(m => m.PortalSettingsComponent),
    title: 'Settings'
  }
];
