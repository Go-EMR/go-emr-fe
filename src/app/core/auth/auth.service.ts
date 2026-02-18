import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, of, BehaviorSubject, map, delay } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuditService } from '../services/audit.service';
import { EncryptionService } from '../services/encryption.service';

// Enable mock mode for demo/development
const USE_MOCK = true;

// Demo credentials
const DEMO_USERS: { email: string; password: string; user: User }[] = [
  {
    email: 'admin@goemr.com',
    password: 'admin123',
    user: {
      id: 'user-001',
      email: 'admin@goemr.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      permissions: ['all'],
      facilityId: 'facility-001',
      mfaEnabled: false,
      lastLogin: new Date(),
    }
  },
  {
    email: 'doctor@goemr.com',
    password: 'doctor123',
    user: {
      id: 'user-002',
      email: 'doctor@goemr.com',
      firstName: 'Sarah',
      lastName: 'Chen',
      role: 'provider',
      permissions: ['patients:read', 'patients:write', 'encounters:read', 'encounters:write', 'orders:read', 'orders:write'],
      facilityId: 'facility-001',
      npi: '1234567890',
      specialty: 'Internal Medicine',
      mfaEnabled: false,
      lastLogin: new Date(),
    }
  },
  {
    email: 'nurse@goemr.com',
    password: 'nurse123',
    user: {
      id: 'user-003',
      email: 'nurse@goemr.com',
      firstName: 'Emily',
      lastName: 'Johnson',
      role: 'nurse',
      permissions: ['patients:read', 'encounters:read', 'vitals:write'],
      facilityId: 'facility-001',
      mfaEnabled: false,
      lastLogin: new Date(),
    }
  }
];

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: string[];
  facilityId: string;
  npi?: string;
  deaNumber?: string;
  licenseNumber?: string;
  specialty?: string;
  avatarUrl?: string;
  mfaEnabled: boolean;
  lastLogin?: Date;
  passwordExpiresAt?: Date;
}

export type UserRole = 
  | 'super_admin' 
  | 'admin' 
  | 'provider' 
  | 'nurse' 
  | 'medical_assistant'
  | 'front_desk'
  | 'billing_staff'
  | 'patient';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  mfaRequired: boolean;
  sessionExpiresAt: Date | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
  mfaRequired?: boolean;
  mfaToken?: string;
}

export interface MfaVerification {
  mfaToken: string;
  code: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly auditService = inject(AuditService);
  private readonly encryptionService = inject(EncryptionService);
  
  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'emr_access_token';
  private readonly REFRESH_TOKEN_KEY = 'emr_refresh_token';
  private readonly USER_KEY = 'emr_user';
  
  // HIPAA: Session timeout (15 minutes of inactivity)
  private readonly SESSION_TIMEOUT = 15 * 60 * 1000;
  
  // Reactive state using signals
  private readonly _state = signal<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    mfaRequired: false,
    sessionExpiresAt: null,
  });
  
  // Public computed values
  readonly state = this._state.asReadonly();
  readonly user = computed(() => this._state().user);
  readonly isAuthenticated = computed(() => this._state().isAuthenticated);
  readonly isLoading = computed(() => this._state().isLoading);
  readonly userRole = computed(() => this._state().user?.role ?? null);
  readonly permissions = computed(() => this._state().user?.permissions ?? []);
  
  /**
   * Login with credentials
   * HIPAA: Logs authentication attempt
   */
  login(credentials: LoginCredentials): Observable<LoginResponse> {
    this.updateState({ isLoading: true, error: null });
    
    // Mock authentication for demo
    if (USE_MOCK) {
      return this.mockLogin(credentials);
    }
    
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap(response => {
        if (response.mfaRequired) {
          this.updateState({ 
            isLoading: false, 
            mfaRequired: true,
          });
          // Store temporary MFA token
          sessionStorage.setItem('mfa_token', response.mfaToken!);
        } else {
          this.handleSuccessfulAuth(response);
        }
        
        // HIPAA: Audit log
        this.auditService.log({
          action: 'LOGIN_ATTEMPT',
          resourceType: 'AUTH',
          resourceId: credentials.email,
          details: { success: true, mfaRequired: response.mfaRequired },
        });
      }),
      catchError(error => {
        this.updateState({ 
          isLoading: false, 
          error: error.error?.message || 'Authentication failed',
        });
        
        // HIPAA: Audit failed login
        this.auditService.log({
          action: 'LOGIN_FAILED',
          resourceType: 'AUTH',
          resourceId: credentials.email,
          details: { error: error.error?.message },
        });
        
        return throwError(() => error);
      })
    );
  }
  
  /**
   * Mock login for demo/development
   */
  private mockLogin(credentials: LoginCredentials): Observable<LoginResponse> {
    const demoUser = DEMO_USERS.find(
      u => u.email === credentials.email && u.password === credentials.password
    );
    
    if (demoUser) {
      const response: LoginResponse = {
        accessToken: 'mock-jwt-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now(),
        user: demoUser.user,
        expiresIn: 3600,
        mfaRequired: false,
      };
      
      return of(response).pipe(
        delay(500), // Simulate network delay
        tap(res => {
          this.handleSuccessfulAuth(res);
          this.auditService.log({
            action: 'LOGIN_ATTEMPT',
            resourceType: 'AUTH',
            resourceId: credentials.email,
            details: { success: true, mock: true },
          });
        })
      );
    }
    
    // Invalid credentials
    this.updateState({ 
      isLoading: false, 
      error: 'Invalid email or password',
    });
    
    return throwError(() => ({ 
      error: { message: 'Invalid email or password' } 
    }));
  }
  
  /**
   * Verify MFA code
   */
  verifyMfa(verification: MfaVerification): Observable<LoginResponse> {
    this.updateState({ isLoading: true, error: null });
    
    return this.http.post<LoginResponse>(`${this.API_URL}/mfa/verify`, verification).pipe(
      tap(response => {
        this.handleSuccessfulAuth(response);
        sessionStorage.removeItem('mfa_token');
        
        this.auditService.log({
          action: 'MFA_VERIFIED',
          resourceType: 'AUTH',
          resourceId: response.user.id,
        });
      }),
      catchError(error => {
        this.updateState({ 
          isLoading: false, 
          error: 'Invalid verification code',
        });
        return throwError(() => error);
      })
    );
  }
  
  /**
   * Logout and clear session
   * HIPAA: Ensures complete session termination
   */
  logout(): void {
    const user = this._state().user;
    
    // HIPAA: Audit logout
    if (user) {
      this.auditService.log({
        action: 'LOGOUT',
        resourceType: 'AUTH',
        resourceId: user.id,
      });
    }
    
    // Clear tokens and state
    this.clearSession();
    
    // Notify backend
    this.http.post(`${this.API_URL}/logout`, {}).subscribe({
      complete: () => this.router.navigate(['/auth/login']),
      error: () => this.router.navigate(['/auth/login']),
    });
  }
  
  /**
   * Refresh access token
   */
  refreshToken(): Observable<LoginResponse> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token'));
    }
    
    // Mock refresh for demo
    if (USE_MOCK) {
      const currentUser = this.user();
      if (currentUser) {
        const response: LoginResponse = {
          accessToken: 'mock-jwt-token-' + Date.now(),
          refreshToken: 'mock-refresh-token-' + Date.now(),
          user: currentUser,
          expiresIn: 3600,
        };
        return of(response).pipe(
          delay(100),
          tap(res => this.handleSuccessfulAuth(res))
        );
      }
    }
    
    return this.http.post<LoginResponse>(`${this.API_URL}/refresh`, { refreshToken }).pipe(
      tap(response => this.handleSuccessfulAuth(response)),
      catchError(error => {
        this.clearSession();
        this.router.navigate(['/auth/login']);
        return throwError(() => error);
      })
    );
  }
  
  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    const perms = this.permissions();
    // 'all' permission grants access to everything
    return perms.includes('all') || perms.includes(permission);
  }
  
  /**
   * Check if user has any of the specified roles
   */
  hasRole(roles: UserRole | UserRole[]): boolean {
    const userRole = this.userRole();
    if (!userRole) return false;
    
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(userRole);
  }
  
  /**
   * Check for existing session on app init
   */
  checkSession(): void {
    const token = this.getAccessToken();
    const storedUser = this.getStoredUser();
    
    if (token && storedUser) {
      this.updateState({
        user: storedUser,
        isAuthenticated: true,
        sessionExpiresAt: new Date(Date.now() + this.SESSION_TIMEOUT),
      });
      
      // Validate token with backend
      this.validateToken().subscribe();
    }
  }
  
  /**
   * Get access token for HTTP interceptor
   */
  getAccessToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }
  
  /**
   * Update session expiry on user activity
   */
  refreshSessionExpiry(): void {
    if (this._state().isAuthenticated) {
      this.updateState({
        sessionExpiresAt: new Date(Date.now() + this.SESSION_TIMEOUT),
      });
    }
  }
  
  // Private methods
  
  private handleSuccessfulAuth(response: LoginResponse): void {
    // Store tokens securely
    sessionStorage.setItem(this.TOKEN_KEY, response.accessToken);
    sessionStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
    
    // Store encrypted user data
    const encryptedUser = this.encryptionService.encrypt(JSON.stringify(response.user));
    sessionStorage.setItem(this.USER_KEY, encryptedUser);
    
    this.updateState({
      user: response.user,
      isAuthenticated: true,
      isLoading: false,
      mfaRequired: false,
      sessionExpiresAt: new Date(Date.now() + this.SESSION_TIMEOUT),
    });
  }
  
  private clearSession(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    
    this.updateState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      mfaRequired: false,
      sessionExpiresAt: null,
    });
  }
  
  private getRefreshToken(): string | null {
    return sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
  }
  
  private getStoredUser(): User | null {
    const encrypted = sessionStorage.getItem(this.USER_KEY);
    if (!encrypted) return null;
    
    try {
      const decrypted = this.encryptionService.decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch {
      return null;
    }
  }
  
  private validateToken(): Observable<boolean> {
    // Mock mode: skip backend validation to preserve session across refreshes
    if (USE_MOCK) {
      return of(true);
    }

    return this.http.get<{ valid: boolean }>(`${this.API_URL}/validate`).pipe(
      map(response => {
        if (!response.valid) {
          this.clearSession();
          this.router.navigate(['/auth/login']);
        }
        return response.valid;
      }),
      catchError(() => {
        this.clearSession();
        return of(false);
      })
    );
  }
  
  private updateState(partial: Partial<AuthState>): void {
    this._state.update(state => ({ ...state, ...partial }));
  }
}
