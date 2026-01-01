import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';

import { AuthService, UserRole } from '../auth/auth.service';
import { AuditService } from '../services/audit.service';

/**
 * Role guard that restricts access based on user role
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const auditService = inject(AuditService);
  const router = inject(Router);
  
  const allowedRoles = route.data['allowedRoles'] as UserRole[] | undefined;
  const requiredPermissions = route.data['requiredPermissions'] as string[] | undefined;
  
  // If no roles or permissions specified, allow access
  if (!allowedRoles?.length && !requiredPermissions?.length) {
    return true;
  }
  
  const user = authService.user();
  
  if (!user) {
    router.navigate(['/auth/login']);
    return false;
  }
  
  // Check roles
  if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
    // Log access denied
    auditService.log({
      action: 'ACCESS_DENIED',
      resourceType: 'AUTH',
      details: {
        attemptedRoute: route.routeConfig?.path,
        requiredRoles: allowedRoles,
        userRole: user.role,
      },
    });
    
    router.navigate(['/unauthorized']);
    return false;
  }
  
  // Check permissions
  if (requiredPermissions?.length) {
    const hasAllPermissions = requiredPermissions.every(
      permission => authService.hasPermission(permission)
    );
    
    if (!hasAllPermissions) {
      auditService.log({
        action: 'ACCESS_DENIED',
        resourceType: 'AUTH',
        details: {
          attemptedRoute: route.routeConfig?.path,
          requiredPermissions,
          userPermissions: user.permissions,
        },
      });
      
      router.navigate(['/unauthorized']);
      return false;
    }
  }
  
  return true;
};
