import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'users',
    pathMatch: 'full'
  },
  {
    path: 'users',
    loadComponent: () => import('./feature-users/users.component').then(m => m.UsersComponent),
    title: 'User Management'
  },
  {
    path: 'roles',
    loadComponent: () => import('./feature-roles/roles.component').then(m => m.RolesComponent),
    title: 'Roles & Permissions'
  },
  {
    path: 'settings',
    loadComponent: () => import('./feature-settings/settings.component').then(m => m.SettingsComponent),
    title: 'System Settings'
  },
  {
    path: 'audit',
    loadComponent: () => import('./feature-audit/audit.component').then(m => m.AuditComponent),
    title: 'Audit Logs'
  },
  {
    path: 'monitor',
    loadComponent: () => import('./feature-monitor/system-monitor.component').then(m => m.SystemMonitorComponent),
    title: 'System Monitor'
  }
];
