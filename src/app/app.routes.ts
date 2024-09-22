import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./login/login.component').then(m => m.default),
    },
    {
        path: 'home',
        // As we marked the HomeComponent as default, we can use the default import
        // or remove the default keyword and use the named import
        loadComponent: () => import('./home/home.component').then(m => m.default),
    },
    {
        path: 'pricing',
        loadComponent: () => import('./pricing/pricing.component').then(m => m.default),
    },
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
    },
    {
        path: 'notfound',
        loadComponent: () => import('./not-found/not-found.component').then(m => m.default),
    },
    {
        path: '**',
        redirectTo: '/notfound'
    },
];
