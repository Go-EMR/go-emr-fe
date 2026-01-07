import { Routes } from '@angular/router';

export const ENCOUNTER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => 
      import('./feature-encounter-list/encounter-list.component')
        .then(m => m.EncounterListComponent),
    title: 'Encounters'
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./feature-encounter-editor/encounter-editor.component')
        .then(m => m.EncounterEditorComponent),
    title: 'New Encounter'
  },
  {
    path: ':encounterId',
    loadComponent: () =>
      import('./feature-encounter-detail/encounter-detail.component')
        .then(m => m.EncounterDetailComponent),
    title: 'Encounter Details'
  },
  {
    path: ':encounterId/edit',
    loadComponent: () =>
      import('./feature-encounter-editor/encounter-editor.component')
        .then(m => m.EncounterEditorComponent),
    title: 'Edit Encounter'
  },
  {
        path: 'notes',
        loadComponent: () =>
          import('./feature-clinical-notes/clinical-notes.component').then(
            (m) => m.ClinicalNotesComponent
          ),
        data: { breadcrumb: 'Clinical Notes' }
  }
];
