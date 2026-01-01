import { Component, inject, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/services/notification.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
  requiredPermissions?: string[];
  children?: NavItem[];
}

@Component({
  selector: 'emr-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatMenuModule,
    MatBadgeModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 })),
      ]),
    ]),
    trigger('slideInLeft', [
      transition(':enter', [
        style({ transform: 'translateX(-20px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 })),
      ]),
    ]),
    trigger('expandCollapse', [
      state('collapsed', style({ height: '0', opacity: 0, overflow: 'hidden' })),
      state('expanded', style({ height: '*', opacity: 1 })),
      transition('collapsed <=> expanded', animate('200ms ease-in-out')),
    ]),
  ],
  template: `
    <mat-sidenav-container class="shell-container">
      <!-- Sidenav -->
      <mat-sidenav 
        #sidenav
        [mode]="isMobile() ? 'over' : 'side'"
        [opened]="!isMobile()"
        class="sidenav"
        [class.collapsed]="isCollapsed()">
        
        <!-- Logo Section -->
        <div class="sidenav-header" [@slideInLeft]>
          <div class="logo-wrapper" [routerLink]="['/dashboard']">
            <img src="assets/logo.svg" alt="GoEMR Logo" class="logo-img">
            @if (!isCollapsed()) {
              <span class="logo-text">GoEMR</span>
            }
          </div>
          @if (!isMobile()) {
            <button 
              mat-icon-button 
              (click)="toggleCollapse()"
              class="collapse-btn"
              [matTooltip]="isCollapsed() ? 'Expand' : 'Collapse'">
              <mat-icon>{{ isCollapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
            </button>
          }
        </div>
        
        <!-- Navigation -->
        <mat-nav-list class="nav-list">
          @for (item of filteredNavItems(); track item.route) {
            @if (item.children) {
              <!-- Parent with children -->
              <div class="nav-group">
                <button 
                  mat-list-item 
                  (click)="toggleExpanded(item.route)"
                  class="nav-item parent"
                  [class.expanded]="expandedItems().includes(item.route)">
                  <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
                  @if (!isCollapsed()) {
                    <span matListItemTitle>{{ item.label }}</span>
                    <mat-icon class="expand-icon">
                      {{ expandedItems().includes(item.route) ? 'expand_less' : 'expand_more' }}
                    </mat-icon>
                  }
                </button>
                
                @if (!isCollapsed()) {
                  <div 
                    class="nav-children"
                    [@expandCollapse]="expandedItems().includes(item.route) ? 'expanded' : 'collapsed'">
                    @for (child of item.children; track child.route) {
                      <a 
                        mat-list-item 
                        [routerLink]="child.route"
                        routerLinkActive="active"
                        class="nav-item child"
                        (click)="onNavClick()">
                        <mat-icon matListItemIcon>{{ child.icon }}</mat-icon>
                        <span matListItemTitle>{{ child.label }}</span>
                        @if (child.badge) {
                          <span matBadge="{{ child.badge }}" matBadgeColor="warn" matBadgeSize="small"></span>
                        }
                      </a>
                    }
                  </div>
                }
              </div>
            } @else {
              <!-- Single item -->
              <a 
                mat-list-item 
                [routerLink]="item.route"
                routerLinkActive="active"
                class="nav-item"
                [matTooltip]="isCollapsed() ? item.label : ''"
                matTooltipPosition="right"
                (click)="onNavClick()">
                <mat-icon matListItemIcon [matBadge]="item.badge || null" matBadgeColor="warn" matBadgeSize="small">
                  {{ item.icon }}
                </mat-icon>
                @if (!isCollapsed()) {
                  <span matListItemTitle>{{ item.label }}</span>
                }
              </a>
            }
          }
        </mat-nav-list>
        
        <!-- User Section -->
        <div class="sidenav-footer">
          <button 
            mat-list-item 
            [matMenuTriggerFor]="userMenu"
            class="user-item">
            <div class="user-avatar" matListItemIcon>
              {{ userInitials() }}
            </div>
            @if (!isCollapsed()) {
              <div matListItemTitle class="user-info">
                <span class="user-name">{{ userName() }}</span>
                <span class="user-role">{{ userRole() }}</span>
              </div>
              <mat-icon class="menu-icon">more_vert</mat-icon>
            }
          </button>
        </div>
      </mat-sidenav>
      
      <!-- Main Content -->
      <mat-sidenav-content class="main-content">
        <!-- Toolbar -->
        <mat-toolbar class="toolbar" [@fadeIn]>
          @if (isMobile()) {
            <button mat-icon-button (click)="sidenav.toggle()">
              <mat-icon>menu</mat-icon>
            </button>
          }
          
          <!-- Breadcrumb or Search -->
          <div class="toolbar-center">
            <div class="search-box">
              <mat-icon>search</mat-icon>
              <input 
                type="text" 
                placeholder="Search patients, appointments..." 
                (focus)="onSearchFocus()"
                aria-label="Global search">
            </div>
          </div>
          
          <div class="toolbar-actions">
            <!-- Quick Actions -->
            <button mat-icon-button matTooltip="New Patient" [routerLink]="['/patients/new']">
              <mat-icon>person_add</mat-icon>
            </button>
            
            <button mat-icon-button matTooltip="New Appointment" [routerLink]="['/appointments/new']">
              <mat-icon>event_available</mat-icon>
            </button>
            
            <!-- Notifications -->
            <button 
              mat-icon-button 
              matTooltip="Notifications"
              [matMenuTriggerFor]="notificationMenu"
              [matBadge]="unreadNotifications()"
              matBadgeColor="warn"
              matBadgeSize="small"
              [matBadgeHidden]="unreadNotifications() === 0">
              <mat-icon>notifications</mat-icon>
            </button>
            
            <!-- Help -->
            <button mat-icon-button matTooltip="Help">
              <mat-icon>help_outline</mat-icon>
            </button>
          </div>
        </mat-toolbar>
        
        <!-- Page Content -->
        <main class="page-content">
          <ng-content></ng-content>
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
    
    <!-- User Menu -->
    <mat-menu #userMenu="matMenu" class="user-menu-panel">
      <div class="user-menu-header">
        <div class="user-menu-avatar">{{ userInitials() }}</div>
        <div class="user-menu-details">
          <span class="user-menu-name">{{ userName() }}</span>
          <span class="user-menu-email">{{ userEmail() }}</span>
        </div>
      </div>
      <mat-divider></mat-divider>
      <button mat-menu-item [routerLink]="['/profile']">
        <mat-icon>person</mat-icon>
        <span>Profile</span>
      </button>
      <button mat-menu-item [routerLink]="['/settings']">
        <mat-icon>settings</mat-icon>
        <span>Settings</span>
      </button>
      <mat-divider></mat-divider>
      <button mat-menu-item (click)="logout()" class="logout-item">
        <mat-icon>logout</mat-icon>
        <span>Sign Out</span>
      </button>
    </mat-menu>
    
    <!-- Notification Menu -->
    <mat-menu #notificationMenu="matMenu" class="notification-menu">
      <div class="notification-header">
        <span>Notifications</span>
        <button mat-button color="primary">Mark all read</button>
      </div>
      <mat-divider></mat-divider>
      @for (notification of notifications().slice(0, 5); track notification.id) {
        <button mat-menu-item class="notification-item">
          <mat-icon [class]="notification.type">{{ getNotificationIcon(notification.type) }}</mat-icon>
          <div class="notification-content">
            <span class="notification-title">{{ notification.title }}</span>
            <span class="notification-time">{{ notification.time }}</span>
          </div>
        </button>
      }
      <mat-divider></mat-divider>
      <button mat-menu-item [routerLink]="['/notifications']" class="view-all">
        <span>View All Notifications</span>
        <mat-icon>arrow_forward</mat-icon>
      </button>
    </mat-menu>
  `,
  styles: [`
    .shell-container {
      height: 100vh;
    }
    
    .sidenav {
      width: 260px;
      background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
      border-right: 1px solid rgba(255,255,255,0.05);
      transition: width 0.3s ease;
      display: flex;
      flex-direction: column;
      
      &.collapsed {
        width: 72px;
      }
    }
    
    .sidenav-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 16px;
      min-height: 72px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    
    .logo-wrapper {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      text-decoration: none;
    }
    
    .logo-img {
      width: 36px;
      height: 36px;
      object-fit: contain;
    }
    
    .logo-text {
      font-size: 20px;
      font-weight: 700;
      color: white;
      letter-spacing: -0.5px;
    }
    
    .collapse-btn {
      color: rgba(255,255,255,0.5);
      width: 28px;
      height: 28px;
      line-height: 28px;
      
      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
      
      &:hover {
        color: white;
        background: rgba(255,255,255,0.1);
      }
    }
    
    .nav-list {
      padding: 12px;
      flex: 1;
      overflow-y: auto;
      
      // Remove focus rings and borders from all nav items
      .mat-mdc-list-item {
        &:focus, &:active {
          outline: none !important;
        }
        
        .mat-mdc-focus-indicator::before {
          border: none !important;
          display: none !important;
        }
        
        .mdc-list-item__ripple::before {
          background-color: rgba(255,255,255,0.1);
        }
      }
    }
    
    .nav-item {
      border-radius: 10px !important;
      margin-bottom: 2px;
      color: rgba(255,255,255,0.8) !important;
      transition: all 0.2s ease;
      height: 44px !important;
      border: none !important;
      outline: none !important;
      
      &:hover {
        background: rgba(255,255,255,0.08) !important;
        color: white !important;
      }
      
      &:focus, &:focus-visible {
        outline: none !important;
        border: none !important;
      }
      
      &.active {
        background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%) !important;
        color: white !important;
        box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4);
        
        mat-icon {
          color: white !important;
        }
      }
      
      mat-icon {
        color: rgba(255,255,255,0.7);
        margin-right: 12px !important;
      }
      
      &.parent {
        color: rgba(255,255,255,0.5) !important;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
        height: 36px !important;
        margin-top: 16px;
        margin-bottom: 4px;
        background: transparent !important;
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
        
        &:hover {
          background: rgba(255,255,255,0.05) !important;
          color: rgba(255,255,255,0.7) !important;
        }
        
        &:focus, &:active {
          background: transparent !important;
          outline: none !important;
          border: none !important;
        }
        
        mat-icon:first-of-type {
          font-size: 18px;
          width: 18px;
          height: 18px;
          color: rgba(255,255,255,0.4);
        }
        
        .expand-icon {
          color: rgba(255,255,255,0.3);
        }
      }
      
      &.child {
        padding-left: 20px !important;
        font-size: 14px;
        height: 42px !important;
        margin-left: 8px;
        border-left: 2px solid rgba(255,255,255,0.1);
        border-radius: 0 10px 10px 0 !important;
        
        &:hover {
          border-left-color: rgba(255,255,255,0.3);
        }
        
        &.active {
          border-left-color: #0ea5e9;
        }
        
        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }
    }
    
    .nav-group {
      .expand-icon {
        margin-left: auto;
        transition: transform 0.2s ease;
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: rgba(255,255,255,0.4);
      }
      
      &.expanded .expand-icon {
        transform: rotate(180deg);
      }
    }
    
    .nav-children {
      overflow: hidden;
      padding-bottom: 4px;
    }
    
    .sidenav-footer {
      margin-top: auto;
      padding: 12px;
      border-top: 1px solid rgba(255,255,255,0.1);
    }
    
    .user-item {
      border-radius: 10px !important;
      color: white !important;
      padding: 8px 12px !important;
      background: rgba(255,255,255,0.05) !important;
      height: auto !important;
      min-height: 56px !important;
      
      &:hover {
        background: rgba(255,255,255,0.1) !important;
      }
      
      .mdc-list-item__content {
        display: flex !important;
        align-items: center !important;
        width: 100% !important;
      }
    }
    
    .user-avatar {
      width: 40px;
      height: 40px;
      min-width: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
      color: white;
      margin-right: 12px !important;
      flex-shrink: 0;
    }
    
    .user-info {
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: hidden;
      min-width: 0;
      
      .user-name {
        font-weight: 600;
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: white;
        line-height: 1.3;
      }
      
      .user-role {
        font-size: 11px;
        color: rgba(255,255,255,0.5);
        text-transform: capitalize;
        line-height: 1.3;
      }
    }
    
    .menu-icon {
      color: rgba(255,255,255,0.4);
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-left: auto;
      flex-shrink: 0;
    }
    
    // User Menu Panel Styles (using ::ng-deep for mat-menu)
    :host ::ng-deep .user-menu-panel {
      min-width: 240px !important;
      
      .mat-mdc-menu-content {
        padding: 0;
      }
      
      .user-menu-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      }
      
      .user-menu-avatar {
        width: 44px;
        height: 44px;
        min-width: 44px;
        border-radius: 10px;
        background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 16px;
        color: white;
      }
      
      .user-menu-details {
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      
      .user-menu-name {
        font-weight: 600;
        font-size: 14px;
        color: #1e293b;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .user-menu-email {
        font-size: 12px;
        color: #64748b;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .mat-mdc-menu-item {
        height: 44px;
        
        mat-icon {
          color: #64748b;
          margin-right: 12px;
        }
        
        span {
          color: #334155;
          font-size: 14px;
        }
        
        &:hover {
          background: #f1f5f9;
        }
      }
      
      .logout-item {
        mat-icon {
          color: #ef4444;
        }
        
        span {
          color: #ef4444;
        }
        
        &:hover {
          background: #fef2f2;
        }
      }
    }
    
    .menu-icon {
      margin-left: auto;
      color: rgba(255,255,255,0.5);
    }
    
    .main-content {
      background: #f5f7fa;
    }
    
    .toolbar {
      background: white;
      border-bottom: 1px solid #e0e0e0;
      position: sticky;
      top: 0;
      z-index: 100;
      padding: 0 16px;
    }
    
    .toolbar-center {
      flex: 1;
      display: flex;
      justify-content: center;
      padding: 0 24px;
    }
    
    .search-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #f5f7fa;
      border-radius: 8px;
      padding: 8px 16px;
      width: 100%;
      max-width: 500px;
      
      mat-icon {
        color: #666;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
      
      input {
        border: none;
        background: transparent;
        outline: none;
        width: 100%;
        font-size: 14px;
        
        &::placeholder {
          color: #999;
        }
      }
    }
    
    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .page-content {
      padding: 24px;
      min-height: calc(100vh - 64px);
    }
    
    // Notification menu styles
    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      font-weight: 500;
    }
    
    .notification-item {
      height: auto !important;
      padding: 12px 16px !important;
      
      .notification-content {
        display: flex;
        flex-direction: column;
        margin-left: 8px;
        
        .notification-title {
          font-size: 14px;
        }
        
        .notification-time {
          font-size: 12px;
          color: #666;
        }
      }
      
      mat-icon {
        &.info { color: #2196f3; }
        &.success { color: #4caf50; }
        &.warning { color: #ff9800; }
        &.error { color: #f44336; }
      }
    }
    
    .view-all {
      justify-content: space-between;
    }
    
    // Responsive
    @media (max-width: 768px) {
      .toolbar-center {
        padding: 0 8px;
      }
      
      .page-content {
        padding: 16px;
      }
    }
    
    // Global overrides for Material focus indicators
    :host ::ng-deep {
      .sidenav .mat-mdc-list-item {
        &.nav-item {
          .mat-mdc-focus-indicator::before,
          .mdc-list-item__ripple::before {
            border: none !important;
          }
        }
        
        &.nav-item.parent {
          background: transparent !important;
          
          &:focus,
          &:active,
          &.cdk-keyboard-focused,
          &.cdk-program-focused,
          &.mat-mdc-list-item-interactive:focus::before {
            opacity: 0 !important;
            background: transparent !important;
          }
          
          .mat-mdc-focus-indicator::before {
            display: none !important;
            border: none !important;
          }
        }
        
        &.user-item {
          .mdc-list-item__content {
            display: flex !important;
            align-items: center !important;
            width: 100% !important;
          }
          
          .mat-mdc-list-item-unscoped-content {
            display: flex !important;
            align-items: center !important;
            width: 100% !important;
          }
        }
      }
      
      // Remove focus ring from all nav buttons
      .nav-list button:focus,
      .nav-list button:focus-visible {
        outline: none !important;
      }
      
      // User item layout fix
      .sidenav-footer .user-item {
        .mdc-list-item__primary-text {
          display: flex !important;
          align-items: center !important;
          width: 100% !important;
        }
      }
    }
  `],
})
export class ShellComponent {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly breakpointObserver = inject(BreakpointObserver);
  
  protected readonly isCollapsed = signal(false);
  protected readonly expandedItems = signal<string[]>(['/clinical']);
  
  // Responsive check
  protected readonly isMobile = toSignal(
    this.breakpointObserver.observe([Breakpoints.Handset]).pipe(
      map(result => result.matches)
    ),
    { initialValue: false }
  );
  
  // User info
  protected readonly userName = computed(() => {
    const user = this.authService.user();
    return user ? `${user.firstName} ${user.lastName}` : '';
  });
  
  protected readonly userInitials = computed(() => {
    const user = this.authService.user();
    if (!user) return '';
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  });
  
  protected readonly userRole = computed(() => {
    const role = this.authService.userRole();
    if (!role) return '';
    return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  });
  
  protected readonly userEmail = computed(() => {
    const user = this.authService.user();
    return user?.email ?? '';
  });
  
  // Notifications (mock)
  protected readonly notifications = signal([
    { id: '1', title: 'New lab results available', type: 'info', time: '5 min ago' },
    { id: '2', title: 'Appointment reminder', type: 'warning', time: '10 min ago' },
    { id: '3', title: 'Prescription approved', type: 'success', time: '1 hour ago' },
  ]);
  
  protected readonly unreadNotifications = computed(() => this.notifications().length);
  
  // Navigation items
  private readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Patients', icon: 'people', route: '/patients', requiredPermissions: ['patients:read'] },
    { label: 'Appointments', icon: 'event', route: '/appointments', requiredPermissions: ['appointments:read'] },
    { 
      label: 'Clinical', 
      icon: 'medical_services', 
      route: '/clinical',
      children: [
        { label: 'Encounters', icon: 'assignment', route: '/encounters' },
        { label: 'Prescriptions', icon: 'medication', route: '/prescriptions' },
        { label: 'Labs', icon: 'science', route: '/labs' },
        { label: 'Imaging', icon: 'image', route: '/imaging' },
      ]
    },
    { label: 'Billing', icon: 'receipt_long', route: '/billing', requiredPermissions: ['billing:read'] },
    { label: 'Messages', icon: 'mail', route: '/messages', badge: 3 },
    { label: 'Reports', icon: 'analytics', route: '/reports', requiredPermissions: ['reports:read'] },
    { label: 'Admin', icon: 'settings', route: '/admin', requiredPermissions: ['admin:read'] },
  ];
  
  protected readonly filteredNavItems = computed(() => {
    return this.navItems.filter(item => {
      if (!item.requiredPermissions?.length) return true;
      return item.requiredPermissions.every(p => this.authService.hasPermission(p));
    });
  });
  
  toggleCollapse(): void {
    this.isCollapsed.update(v => !v);
  }
  
  toggleExpanded(route: string): void {
    this.expandedItems.update(items => {
      if (items.includes(route)) {
        return items.filter(r => r !== route);
      }
      return [...items, route];
    });
  }
  
  onNavClick(): void {
    if (this.isMobile()) {
      this.sidenav.close();
    }
  }
  
  onSearchFocus(): void {
    // Could open a search modal/overlay
  }
  
  getNotificationIcon(type: string): string {
    const icons: Record<string, string> = {
      info: 'info',
      success: 'check_circle',
      warning: 'warning',
      error: 'error',
    };
    return icons[type] || 'notifications';
  }
  
  logout(): void {
    this.authService.logout();
  }
}
