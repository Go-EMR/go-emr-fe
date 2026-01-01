import { Routes } from '@angular/router';

export const IMAGING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./feature-imaging-list/imaging-list.component')
      .then(m => m.ImagingListComponent),
    title: 'Imaging Orders'
  },
  {
    path: 'new',
    loadComponent: () => import('./feature-imaging-editor/imaging-editor.component')
      .then(m => m.ImagingEditorComponent),
    title: 'New Imaging Order'
  },
  {
    path: ':id',
    loadComponent: () => import('./feature-imaging-detail/imaging-detail.component')
      .then(m => m.ImagingDetailComponent),
    title: 'Imaging Order Details'
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./feature-imaging-editor/imaging-editor.component')
      .then(m => m.ImagingEditorComponent),
    title: 'Edit Imaging Order'
  }
];
