import { Routes } from '@angular/router';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./feature-dashboard/dashboard.component')
      .then(m => m.DashboardComponent),
    data: { 
      title: 'Dashboard',
      breadcrumb: 'Dashboard',
    },
  },
];
