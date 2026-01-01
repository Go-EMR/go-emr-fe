import { Routes } from '@angular/router';

export const LAB_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./feature-lab-list/lab-list.component')
      .then(m => m.LabListComponent),
    title: 'Lab Orders'
  },
  {
    path: 'new',
    loadComponent: () => import('./feature-lab-editor/lab-editor.component')
      .then(m => m.LabEditorComponent),
    title: 'New Lab Order'
  },
  {
    path: ':id',
    loadComponent: () => import('./feature-lab-detail/lab-detail.component')
      .then(m => m.LabDetailComponent),
    title: 'Lab Order Details'
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./feature-lab-editor/lab-editor.component')
      .then(m => m.LabEditorComponent),
    title: 'Edit Lab Order'
  }
];
