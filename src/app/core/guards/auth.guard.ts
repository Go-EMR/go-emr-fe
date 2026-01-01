import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { AuthService } from '../auth/auth.service';

/**
 * Auth guard that protects routes requiring authentication
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.isAuthenticated()) {
    return true;
  }
  
  // Store attempted URL for redirecting after login
  const returnUrl = state.url;
  
  // Redirect to login
  router.navigate(['/auth/login'], {
    queryParams: { returnUrl },
  });
  
  return false;
};
