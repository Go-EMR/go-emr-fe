import { Routes } from '@angular/router';

export const MESSAGING_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () => import('./feature-inbox/inbox.component')
          .then(m => m.InboxComponent),
        title: 'Messages'
      },
      {
        path: 'tasks',
        loadComponent: () => import('./feature-tasks/tasks.component')
          .then(m => m.TasksComponent),
        title: 'Tasks'
      },
      {
        path: 'notifications',
        loadComponent: () => import('./feature-notifications/notifications.component')
          .then(m => m.NotificationsComponent),
        title: 'Notifications'
      }
    ]
  }
];
