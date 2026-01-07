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
  {
        path: 'opd',
        loadComponent: () =>
          import('./opd-dashboard/opd-dashboard.component').then(
            (m) => m.OpdDashboardComponent
          ),
        data: { 
          breadcrumb: 'OPD',
          title: 'Outpatient Department'
        }
      },
      {
        path: 'ipd',
        loadComponent: () =>
          import('./ipd-dashboard/ipd-dashboard.component').then(
            (m) => m.IpdDashboardComponent
          ),
        data: { 
          breadcrumb: 'IPD',
          title: 'Inpatient Department'
        }
      },
];
