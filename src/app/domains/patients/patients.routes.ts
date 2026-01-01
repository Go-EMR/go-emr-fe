import { Routes } from '@angular/router';
import { hipaaGuard } from '../../core/guards/hipaa.guard';
import { roleGuard } from '../../core/guards/role.guard';

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
        path: ':patientId',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./feature-patient-detail/patient-detail.component').then(
                (m) => m.PatientDetailComponent
              ),
            data: { breadcrumb: 'Patient Chart' }
          },
          {
            path: 'encounters',
            loadChildren: () =>
              import('../encounters/encounters.routes').then((m) => m.ENCOUNTER_ROUTES),
            data: { breadcrumb: 'Encounters' }
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
            path: 'labs',
            loadChildren: () =>
              import('../labs/labs.routes').then((m) => m.LAB_ROUTES),
            data: { breadcrumb: 'Lab Results' }
          },
          {
            path: 'billing',
            loadChildren: () =>
              import('../billing/billing.routes').then((m) => m.BILLING_ROUTES),
            data: { breadcrumb: 'Billing' }
          }
        ]
      }
    ]
  }
];
