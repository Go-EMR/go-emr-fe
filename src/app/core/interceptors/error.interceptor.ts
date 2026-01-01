import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

/**
 * Global error interceptor for handling HTTP errors
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';
      
      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = error.error.message;
      } else {
        // Server-side error
        switch (error.status) {
          case 0:
            errorMessage = 'Unable to connect to server. Please check your network connection.';
            break;
          case 400:
            errorMessage = error.error?.message || 'Invalid request. Please check your input.';
            break;
          case 401:
            // Handled by auth interceptor
            errorMessage = 'Your session has expired. Please log in again.';
            break;
          case 403:
            errorMessage = 'You do not have permission to perform this action.';
            router.navigate(['/unauthorized']);
            break;
          case 404:
            errorMessage = error.error?.message || 'The requested resource was not found.';
            break;
          case 409:
            errorMessage = error.error?.message || 'A conflict occurred. The resource may already exist.';
            break;
          case 422:
            errorMessage = error.error?.message || 'Validation failed. Please check your input.';
            break;
          case 429:
            errorMessage = 'Too many requests. Please try again later.';
            break;
          case 500:
            errorMessage = 'A server error occurred. Please try again later.';
            break;
          case 502:
          case 503:
          case 504:
            errorMessage = 'The server is temporarily unavailable. Please try again later.';
            break;
          default:
            errorMessage = error.error?.message || `Error: ${error.status} - ${error.statusText}`;
        }
      }
      
      // Show error notification (except for 401 which is handled separately)
      if (error.status !== 401) {
        snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      }
      
      // Log error for debugging
      console.error('[HTTP Error]', {
        url: req.url,
        method: req.method,
        status: error.status,
        message: errorMessage,
        error: error.error,
      });
      
      return throwError(() => ({
        ...error,
        userMessage: errorMessage,
      }));
    })
  );
};
