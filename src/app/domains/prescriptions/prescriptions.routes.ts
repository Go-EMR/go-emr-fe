import { Routes } from '@angular/router';

export const PRESCRIPTION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./feature-prescription-list/prescription-list.component').then(
        (m) => m.PrescriptionListComponent
      ),
    data: { breadcrumb: null }
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./feature-prescription-writer/prescription-writer.component').then(
        (m) => m.PrescriptionWriterComponent
      ),
    data: { breadcrumb: 'New Prescription' }
  },
  {
    path: ':prescriptionId',
    loadComponent: () =>
      import('./feature-prescription-detail/prescription-detail.component').then(
        (m) => m.PrescriptionDetailComponent
      ),
    data: { breadcrumb: 'Prescription Details' }
  }
];
