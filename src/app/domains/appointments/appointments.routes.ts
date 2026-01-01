import { Routes } from '@angular/router';

export const APPOINTMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./feature-appointments-calendar/appointments-calendar.component')
      .then(m => m.AppointmentsCalendarComponent),
    data: {
      title: 'Appointments',
      breadcrumb: 'Appointments',
    },
  },
  {
    path: 'new',
    loadComponent: () => import('./feature-appointment-form/appointment-form.component')
      .then(m => m.AppointmentFormComponent),
    data: {
      title: 'Schedule Appointment',
      breadcrumb: 'New Appointment',
    },
  },
  {
    path: ':appointmentId',
    loadComponent: () => import('./feature-appointment-detail/appointment-detail.component')
      .then(m => m.AppointmentDetailComponent),
    data: {
      title: 'Appointment Details',
      breadcrumb: 'Details',
    },
  },
  {
    path: ':appointmentId/edit',
    loadComponent: () => import('./feature-appointment-form/appointment-form.component')
      .then(m => m.AppointmentFormComponent),
    data: {
      title: 'Edit Appointment',
      breadcrumb: 'Edit',
    },
  },
];
