import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions, withRouterConfig } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { auditInterceptor } from './core/interceptors/audit.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // Zone change detection optimization
    provideZoneChangeDetection({ eventCoalescing: true }),
    
    // Router with enhanced features
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions(),
      withRouterConfig({
        onSameUrlNavigation: 'reload',
        paramsInheritanceStrategy: 'always',
      })
    ),
    
    // Async animations for better performance
    provideAnimationsAsync(),
    
    // HTTP client with security interceptors
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        auditInterceptor,
        loadingInterceptor,
        errorInterceptor,
      ])
    ),
  ],
};
