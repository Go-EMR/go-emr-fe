import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

import { AuthService } from '../auth/auth.service';
import { AuditService } from '../services/audit.service';

/**
 * HIPAA compliance guard
 * Ensures user session is valid and logs PHI access attempts
 */
export const hipaaGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const auditService = inject(AuditService);
  const router = inject(Router);
  const dialog = inject(MatDialog);
  
  const user = authService.user();
  
  if (!user) {
    router.navigate(['/auth/login']);
    return false;
  }
  
  // Check session expiry
  const state = authService.state();
  if (state.sessionExpiresAt && new Date() > new Date(state.sessionExpiresAt)) {
    auditService.log({
      action: 'SESSION_TIMEOUT',
      resourceType: 'AUTH',
      resourceId: user.id,
    });
    
    authService.logout();
    router.navigate(['/session-expired']);
    return false;
  }
  
  // Check if MFA is required but not completed
  if (user.mfaEnabled && state.mfaRequired) {
    router.navigate(['/auth/mfa']);
    return false;
  }
  
  // Check password expiry
  if (user.passwordExpiresAt && new Date() > new Date(user.passwordExpiresAt)) {
    // Redirect to password change
    router.navigate(['/auth/change-password'], {
      queryParams: { expired: true },
    });
    return false;
  }
  
  // Log PHI access for certain routes
  const phiRoutes = ['patients', 'encounters', 'prescriptions', 'labs', 'messages'];
  const isPhiRoute = phiRoutes.some(r => route.routeConfig?.path?.includes(r));
  
  if (isPhiRoute) {
    auditService.log({
      action: 'PHI_ACCESS',
      resourceType: 'AUTH',
      resourceId: user.id,
      details: {
        route: route.routeConfig?.path,
        accessTime: new Date().toISOString(),
      },
    });
  }
  
  // Refresh session on navigation
  authService.refreshSessionExpiry();
  
  return true;
};
