import { Routes } from '@angular/router';
import { hipaaGuard } from '../../core/guards/hipaa.guard';

export const PATIENT_ROUTES: Routes = [
  {
    path: '',
    canActivate: [hipaaGuard],
    data: { 
      breadcrumb: 'Patients',
      permissions: ['patients:read']
    },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./feature-patient-list/patient-list.component').then(
            (m) => m.PatientListComponent
          ),
        data: { breadcrumb: null }
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./feature-patient-registration/patient-registration.component').then(
            (m) => m.PatientRegistrationComponent
          ),
        data: { breadcrumb: 'New Patient' }
      },
      {
        path: ':patientId',
        loadComponent: () =>
          import('./feature-patient-detail/patient-detail.component').then(
            (m) => m.PatientDetailComponent
          ),
        data: { breadcrumb: 'Patient Chart' },
        children: [
          {
            path: 'encounters',
            loadChildren: () =>
              import('../encounters/encounters.routes').then((m) => m.ENCOUNTER_ROUTES),
            data: { breadcrumb: 'Encounters' }
          },
          {
            path: 'labs',
            loadChildren: () =>
              import('../labs/labs.routes').then((m) => m.LAB_ROUTES),
            data: { breadcrumb: 'Lab Results' }
          },
          {
            path: 'edit',
            loadComponent: () =>
              import('./feature-patient-registration/patient-registration.component').then(
                (m) => m.PatientRegistrationComponent
              ),
            data: { breadcrumb: 'Edit Patient' }
          },
          {
            path: 'appointments',
            loadChildren: () =>
              import('../appointments/appointments.routes').then((m) => m.APPOINTMENTS_ROUTES),
            data: { breadcrumb: 'Appointments' }
          },
          {
            path: 'prescriptions',
            loadChildren: () =>
              import('../prescriptions/prescriptions.routes').then((m) => m.PRESCRIPTION_ROUTES),
            data: { breadcrumb: 'Prescriptions' }
          },
          {
            path: 'billing',
            loadChildren: () =>
              import('../billing/billing.routes').then((m) => m.BILLING_ROUTES),
            data: { breadcrumb: 'Billing' }
          },
          {
            path: 'internal-notes',
            loadComponent: () =>
              import('./feature-internal-notes/internal-notes.component').then(
                (m) => m.InternalNotesComponent
              ),
            data: { breadcrumb: 'Internal Notes', permission: 'patients:read' }
          },
          {
            path: 'external-data',
            loadComponent: () =>
              import('./feature-external-data/external-data.component').then(
                (m) => m.ExternalDataComponent
              ),
            data: { breadcrumb: 'External Data', permission: 'patients:read' }
          },
          {
            path: 'timeline',
            loadComponent: () =>
              import('./feature-patient-timeline/patient-timeline.component').then(
                (m) => m.PatientTimelineComponent
              ),
            data: { breadcrumb: 'Timeline', permission: 'patients:read' }
          }
        ]
      }
    ]
  }
];
