import { Routes } from '@angular/router';

export const PRESCRIPTION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./feature-prescription-list/prescription-list.component')
      .then(m => m.PrescriptionListComponent),
    title: 'Prescriptions - OpenEMR',
  },
  {
    path: 'new',
    loadComponent: () => import('./feature-prescription-editor/prescription-editor.component')
      .then(m => m.PrescriptionEditorComponent),
    title: 'New Prescription - OpenEMR',
  },
  {
    path: ':id',
    loadComponent: () => import('./feature-prescription-detail/prescription-detail.component')
      .then(m => m.PrescriptionDetailComponent),
    title: 'Prescription Details - OpenEMR',
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./feature-prescription-editor/prescription-editor.component')
      .then(m => m.PrescriptionEditorComponent),
    title: 'Edit Prescription - OpenEMR',
  },
];
