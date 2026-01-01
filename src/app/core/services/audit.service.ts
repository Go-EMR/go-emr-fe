import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { v4 as uuidv4 } from 'uuid';

export interface AuditEvent {
  id?: string;
  timestamp?: Date;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId?: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  outcome?: 'success' | 'failure';
  phiAccessed?: boolean;
}

export type AuditAction =
  | 'LOGIN_ATTEMPT'
  | 'LOGIN_FAILED'
  | 'LOGIN_SUCCESS'
  | 'MFA_VERIFIED'
  | 'LOGOUT'
  | 'SESSION_TIMEOUT'
  | 'PASSWORD_CHANGE'
  | 'PASSWORD_RESET'
  | 'VIEW'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'PRINT'
  | 'EXPORT'
  | 'SEARCH'
  | 'ACCESS_DENIED'
  | 'PHI_ACCESS'
  | 'CONSENT_GIVEN'
  | 'CONSENT_REVOKED'
  | 'DATA_EXPORT'
  | 'ACCOUNT_LOCKED'
  | 'MFA_ENABLED'
  | 'MFA_DISABLED';

export type ResourceType =
  | 'AUTH'
  | 'PATIENT'
  | 'ENCOUNTER'
  | 'PRESCRIPTION'
  | 'LAB_ORDER'
  | 'LAB_RESULT'
  | 'APPOINTMENT'
  | 'CLAIM'
  | 'PAYMENT'
  | 'MESSAGE'
  | 'DOCUMENT'
  | 'REPORT'
  | 'USER'
  | 'ROLE'
  | 'FACILITY'
  | 'SETTINGS';

/**
 * HIPAA-compliant audit logging service
 * Logs all access to PHI and system events
 */
@Injectable({
  providedIn: 'root',
})
export class AuditService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/audit`;
  
  // Buffer for batching audit events
  private eventBuffer: AuditEvent[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly BUFFER_SIZE = 10;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds
  
  /**
   * Log an audit event
   * Events are buffered and sent in batches for performance
   */
  log(event: Partial<AuditEvent>): void {
    const fullEvent: AuditEvent = {
      id: uuidv4(),
      timestamp: new Date(),
      outcome: 'success',
      ...event,
      action: event.action!,
      resourceType: event.resourceType!,
      userAgent: navigator.userAgent,
    };
    
    // Check if PHI was accessed based on resource type
    fullEvent.phiAccessed = this.isPhiResource(fullEvent.resourceType);
    
    // Add to buffer
    this.eventBuffer.push(fullEvent);
    
    // Flush if buffer is full or schedule flush
    if (this.eventBuffer.length >= this.BUFFER_SIZE) {
      this.flush();
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), this.FLUSH_INTERVAL);
    }
    
    // For critical events, log immediately
    if (this.isCriticalEvent(fullEvent.action)) {
      this.flush();
    }
    
    // Also log to console in development
    if (!environment.production) {
      console.log('[AUDIT]', fullEvent);
    }
  }
  
  /**
   * Log PHI access specifically
   */
  logPhiAccess(
    resourceType: ResourceType,
    resourceId: string,
    action: 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE' | 'PRINT' | 'EXPORT',
    details?: Record<string, unknown>
  ): void {
    this.log({
      action,
      resourceType,
      resourceId,
      phiAccessed: true,
      details,
    });
  }
  
  /**
   * Flush buffered events to server
   */
  private flush(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    
    if (this.eventBuffer.length === 0) return;
    
    const events = [...this.eventBuffer];
    this.eventBuffer = [];
    
    // Send to backend (fire and forget for performance)
    this.http.post(`${this.API_URL}/batch`, { events }).subscribe({
      error: (error) => {
        // On error, put events back in buffer
        console.error('[AUDIT] Failed to send events:', error);
        this.eventBuffer.unshift(...events);
      },
    });
  }
  
  /**
   * Check if resource type contains PHI
   */
  private isPhiResource(resourceType: ResourceType): boolean {
    const phiResources: ResourceType[] = [
      'PATIENT',
      'ENCOUNTER',
      'PRESCRIPTION',
      'LAB_ORDER',
      'LAB_RESULT',
      'DOCUMENT',
      'MESSAGE',
    ];
    return phiResources.includes(resourceType);
  }
  
  /**
   * Check if event should be sent immediately
   */
  private isCriticalEvent(action: AuditAction): boolean {
    const criticalActions: AuditAction[] = [
      'LOGIN_FAILED',
      'ACCESS_DENIED',
      'ACCOUNT_LOCKED',
      'DELETE',
      'DATA_EXPORT',
    ];
    return criticalActions.includes(action);
  }
  
  /**
   * Flush remaining events before page unload
   */
  onDestroy(): void {
    if (this.eventBuffer.length > 0) {
      // Use sendBeacon for reliable delivery on page unload
      const data = JSON.stringify({ events: this.eventBuffer });
      navigator.sendBeacon(`${this.API_URL}/batch`, data);
    }
  }
}
