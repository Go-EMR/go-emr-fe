import { Routes } from '@angular/router';

export const REPORTS_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./feature-analytics/analytics-dashboard.component')
          .then(m => m.AnalyticsDashboardComponent),
        title: 'Analytics Dashboard'
      },
      {
        path: 'clinical',
        loadComponent: () => import('./feature-clinical/clinical-reports.component')
          .then(m => m.ClinicalReportsComponent),
        title: 'Clinical Reports'
      },
      {
        path: 'financial',
        loadComponent: () => import('./feature-financial/financial-reports.component')
          .then(m => m.FinancialReportsComponent),
        title: 'Financial Reports'
      },
      {
        path: 'quality',
        loadComponent: () => import('./feature-quality/quality-measures.component')
          .then(m => m.QualityMeasuresComponent),
        title: 'Quality Measures'
      },
      {
        path: 'operational',
        loadComponent: () => import('./feature-operational/operational-reports.component')
          .then(m => m.OperationalReportsComponent),
        title: 'Operational Reports'
      },
      {
        path: 'custom',
        loadComponent: () => import('./feature-custom/report-builder.component')
          .then(m => m.ReportBuilderComponent),
        title: 'Report Builder'
      },
      {
        path: 'scheduled',
        loadComponent: () => import('./feature-scheduled/scheduled-reports.component')
          .then(m => m.ScheduledReportsComponent),
        title: 'Scheduled Reports'
      },
      {
        path: 'rounding-sheets',
        loadComponent: () => import('./feature-rounding-sheets/rounding-sheets.component')
          .then(m => m.RoundingSheetsComponent),
        title: 'Rounding Sheets'
      }
    ]
  }
];
