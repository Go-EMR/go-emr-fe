import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs/operators';

import { AuditService, AuditAction, ResourceType } from '../services/audit.service';

/**
 * Audit interceptor for logging PHI access
 * Required for HIPAA compliance
 */
export const auditInterceptor: HttpInterceptorFn = (req, next) => {
  const auditService = inject(AuditService);
  
  // Skip audit for certain endpoints
  const skipAuditUrls = ['/audit', '/auth/', '/heartbeat', '/ping', '/assets/'];
  const shouldSkip = skipAuditUrls.some(url => req.url.includes(url));
  
  if (shouldSkip) {
    return next(req);
  }
  
  return next(req).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse && event.status >= 200 && event.status < 300) {
          const auditInfo = extractAuditInfo(req.url, req.method);
          if (auditInfo) {
            auditService.log({
              action: auditInfo.action,
              resourceType: auditInfo.resourceType,
              resourceId: auditInfo.resourceId,
              details: {
                method: req.method,
                url: req.url,
                statusCode: event.status,
              },
            });
          }
        }
      },
      error: (error) => {
        const auditInfo = extractAuditInfo(req.url, req.method);
        if (auditInfo) {
          auditService.log({
            action: auditInfo.action,
            resourceType: auditInfo.resourceType,
            resourceId: auditInfo.resourceId,
            outcome: 'failure',
            details: {
              method: req.method,
              url: req.url,
              statusCode: error.status,
              error: error.message,
            },
          });
        }
      },
    })
  );
};

interface AuditInfo {
  action: AuditAction;
  resourceType: ResourceType;
  resourceId?: string;
}

function extractAuditInfo(url: string, method: string): AuditInfo | null {
  // Map URL patterns to resource types
  const resourcePatterns: { pattern: RegExp; type: ResourceType }[] = [
    { pattern: /\/patients\/([^/]+)/, type: 'PATIENT' },
    { pattern: /\/encounters\/([^/]+)/, type: 'ENCOUNTER' },
    { pattern: /\/prescriptions\/([^/]+)/, type: 'PRESCRIPTION' },
    { pattern: /\/labs\/orders\/([^/]+)/, type: 'LAB_ORDER' },
    { pattern: /\/labs\/results\/([^/]+)/, type: 'LAB_RESULT' },
    { pattern: /\/appointments\/([^/]+)/, type: 'APPOINTMENT' },
    { pattern: /\/billing\/claims\/([^/]+)/, type: 'CLAIM' },
    { pattern: /\/billing\/payments\/([^/]+)/, type: 'PAYMENT' },
    { pattern: /\/messages\/([^/]+)/, type: 'MESSAGE' },
    { pattern: /\/documents\/([^/]+)/, type: 'DOCUMENT' },
    { pattern: /\/reports\/([^/]+)/, type: 'REPORT' },
    { pattern: /\/users\/([^/]+)/, type: 'USER' },
  ];
  
  for (const { pattern, type } of resourcePatterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        action: mapMethodToAction(method),
        resourceType: type,
        resourceId: match[1] !== 'undefined' ? match[1] : undefined,
      };
    }
  }
  
  return null;
}

function mapMethodToAction(method: string): AuditAction {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'VIEW';
    case 'POST':
      return 'CREATE';
    case 'PUT':
    case 'PATCH':
      return 'UPDATE';
    case 'DELETE':
      return 'DELETE';
    default:
      return 'VIEW';
  }
}
