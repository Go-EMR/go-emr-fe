import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { filter, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

import { ShellComponent } from './shell/layout/shell.component';
import { LoadingService } from './core/services/loading.service';
import { AuthService } from './core/auth/auth.service';
import { SessionTimeoutService } from './core/services/session-timeout.service';

@Component({
  selector: 'emr-root',
  standalone: true,
  imports: [
    RouterOutlet,
    AsyncPipe,
    MatProgressBarModule,
    ShellComponent,
  ],
  template: `
    <!-- Global loading indicator for HIPAA compliance feedback -->
    @if (loadingService.loading$ | async) {
      <mat-progress-bar 
        mode="indeterminate" 
        class="global-loading-bar"
        aria-label="Loading content">
      </mat-progress-bar>
    }
    
    <!-- Show shell only when authenticated and not on auth routes -->
    @if (authService.isAuthenticated() && !isAuthRoute()) {
      <emr-shell>
        <router-outlet />
      </emr-shell>
    } @else {
      <!-- Auth pages without shell -->
      <router-outlet />
    }
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }
    
    .global-loading-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9999;
    }
  `],
})
export class AppComponent implements OnInit {
  protected readonly loadingService = inject(LoadingService);
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly sessionTimeoutService = inject(SessionTimeoutService);

  // Track current route to determine if it's an auth route
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(event => (event as NavigationEnd).urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  isAuthRoute(): boolean {
    const url = this.currentUrl();
    return url.startsWith('/auth') || url.startsWith('/portal');
  }

  ngOnInit(): void {
    // Initialize session timeout monitoring for HIPAA compliance
    this.sessionTimeoutService.startMonitoring();
    
    // Check for existing session
    this.authService.checkSession();
  }
}
