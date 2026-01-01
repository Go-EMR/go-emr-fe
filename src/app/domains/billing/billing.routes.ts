import { Routes } from '@angular/router';

export const BILLING_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'claims',
    pathMatch: 'full'
  },
  {
    path: 'claims',
    loadComponent: () => import('./feature-claims/claims-list.component').then(m => m.ClaimsListComponent),
    title: 'Claims - OpenEMR'
  },
  {
    path: 'claims/new',
    loadComponent: () => import('./feature-claims/claim-editor.component').then(m => m.ClaimEditorComponent),
    title: 'New Claim - OpenEMR'
  },
  {
    path: 'claims/:id',
    loadComponent: () => import('./feature-claims/claim-detail.component').then(m => m.ClaimDetailComponent),
    title: 'Claim Details - OpenEMR'
  },
  {
    path: 'claims/:id/edit',
    loadComponent: () => import('./feature-claims/claim-editor.component').then(m => m.ClaimEditorComponent),
    title: 'Edit Claim - OpenEMR'
  },
  {
    path: 'payments',
    loadComponent: () => import('./feature-payments/payments.component').then(m => m.PaymentsComponent),
    title: 'Payments - OpenEMR'
  },
  {
    path: 'statements',
    loadComponent: () => import('./feature-statements/statements.component').then(m => m.StatementsComponent),
    title: 'Patient Statements - OpenEMR'
  },
  {
    path: 'insurance',
    loadComponent: () => import('./feature-insurance/insurance-verification.component').then(m => m.InsuranceVerificationComponent),
    title: 'Insurance Verification - OpenEMR'
  }
];
