import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions, withRouterConfig } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { MessageService, ConfirmationService } from 'primeng/api';

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
      withViewTransitions({
        skipInitialTransition: true,
        onViewTransitionCreated: ({ transition }) => {
          // Skip transition if document is hidden to prevent DOMException
          if (document.hidden) {
            transition.skipTransition();
          }
        }
      }),
      withRouterConfig({
        onSameUrlNavigation: 'reload',
        paramsInheritanceStrategy: 'always',
      })
    ),
    
    // Async animations for better performance
    provideAnimationsAsync(),
    
    // PrimeNG v19 configuration with Aura theme
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          prefix: 'p',
          darkModeSelector: '.dark-mode',
          cssLayer: false
        }
      },
      ripple: true,
    }),
    
    // PrimeNG services (for toast, confirm dialogs)
    MessageService,
    ConfirmationService,
    
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
