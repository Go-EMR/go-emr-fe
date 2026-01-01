import { Injectable, inject, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subject, fromEvent, merge, timer } from 'rxjs';
import { takeUntil, debounceTime, tap, switchMap } from 'rxjs/operators';

import { AuthService } from '../auth/auth.service';
import { AuditService } from './audit.service';

/**
 * HIPAA-compliant session timeout service
 * Automatically logs out users after period of inactivity
 */
@Injectable({
  providedIn: 'root',
})
export class SessionTimeoutService {
  private readonly authService = inject(AuthService);
  private readonly auditService = inject(AuditService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly ngZone = inject(NgZone);
  
  // HIPAA requires timeout after reasonable period of inactivity
  // 15 minutes is common for healthcare applications
  private readonly TIMEOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  private readonly WARNING_BEFORE = 2 * 60 * 1000; // 2 minutes warning
  
  private destroy$ = new Subject<void>();
  private warningDialogRef: any = null;
  private timeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private warningTimer: ReturnType<typeof setTimeout> | null = null;
  
  /**
   * Start monitoring user activity
   */
  startMonitoring(): void {
    // Only monitor if user is authenticated
    if (!this.authService.isAuthenticated()) {
      return;
    }
    
    // Run outside Angular zone to prevent triggering change detection
    this.ngZone.runOutsideAngular(() => {
      // Monitor user activity events
      const activityEvents$ = merge(
        fromEvent(document, 'mousemove'),
        fromEvent(document, 'mousedown'),
        fromEvent(document, 'keydown'),
        fromEvent(document, 'touchstart'),
        fromEvent(document, 'scroll'),
        fromEvent(window, 'focus')
      );
      
      activityEvents$.pipe(
        debounceTime(1000), // Debounce to prevent excessive resets
        takeUntil(this.destroy$),
        tap(() => this.resetTimer())
      ).subscribe();
      
      // Start initial timer
      this.resetTimer();
    });
  }
  
  /**
   * Stop monitoring (on logout)
   */
  stopMonitoring(): void {
    this.destroy$.next();
    this.clearTimers();
  }
  
  /**
   * Reset the inactivity timer
   */
  private resetTimer(): void {
    this.clearTimers();
    
    // Close warning dialog if open
    if (this.warningDialogRef) {
      this.ngZone.run(() => {
        this.warningDialogRef.close();
        this.warningDialogRef = null;
      });
    }
    
    // Update session expiry in auth service
    this.authService.refreshSessionExpiry();
    
    // Set warning timer
    this.warningTimer = setTimeout(() => {
      this.showTimeoutWarning();
    }, this.TIMEOUT_DURATION - this.WARNING_BEFORE);
    
    // Set timeout timer
    this.timeoutTimer = setTimeout(() => {
      this.handleTimeout();
    }, this.TIMEOUT_DURATION);
  }
  
  /**
   * Show warning dialog before timeout
   */
  private showTimeoutWarning(): void {
    this.ngZone.run(async () => {
      const { SessionTimeoutDialogComponent } = await import(
        '../../shared/components/dialogs/session-timeout-dialog.component'
      );
      
      this.warningDialogRef = this.dialog.open(SessionTimeoutDialogComponent, {
        width: '400px',
        disableClose: true,
        data: {
          timeRemaining: this.WARNING_BEFORE / 1000,
        },
      });
      
      this.warningDialogRef.afterClosed().subscribe((result: string) => {
        if (result === 'extend') {
          this.resetTimer();
        }
      });
    });
  }
  
  /**
   * Handle session timeout
   */
  private handleTimeout(): void {
    this.ngZone.run(() => {
      // Close any open dialogs
      this.dialog.closeAll();
      
      // Log audit event
      this.auditService.log({
        action: 'SESSION_TIMEOUT',
        resourceType: 'AUTH',
        details: {
          reason: 'Inactivity timeout',
          duration: this.TIMEOUT_DURATION,
        },
      });
      
      // Logout and redirect
      this.authService.logout();
      this.router.navigate(['/session-expired']);
    });
  }
  
  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
  }
}
