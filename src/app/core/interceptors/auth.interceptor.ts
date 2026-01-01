import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';

/**
 * Auth interceptor that adds JWT token to requests
 * and handles token refresh on 401 errors
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);
  
  // Skip auth for certain endpoints
  const publicEndpoints = ['/auth/login', '/auth/register', '/auth/forgot-password'];
  const isPublicEndpoint = publicEndpoints.some(endpoint => req.url.includes(endpoint));
  
  if (isPublicEndpoint) {
    return next(req);
  }
  
  const token = authService.getAccessToken();
  
  if (token) {
    req = addTokenToRequest(req, token);
  }
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/refresh')) {
        // Token expired, try to refresh
        return authService.refreshToken().pipe(
          switchMap(response => {
            // Retry original request with new token
            req = addTokenToRequest(req, response.accessToken);
            return next(req);
          }),
          catchError(refreshError => {
            // Refresh failed, logout user
            authService.logout();
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};

function addTokenToRequest(
  req: HttpRequest<unknown>,
  token: string
): HttpRequest<unknown> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
      // Security headers
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    },
  });
}
