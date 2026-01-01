import { Component, inject, signal, computed, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

// PrimeNG imports
import { SidebarModule, Sidebar } from 'primeng/sidebar';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { RippleModule } from 'primeng/ripple';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { OverlayPanelModule, OverlayPanel } from 'primeng/overlaypanel';
import { MenuItem } from 'primeng/api';

import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { NotificationService } from '../../core/services/notification.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
  badgeSeverity?: 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';
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
    // PrimeNG
    SidebarModule,
    ButtonModule,
    AvatarModule,
    MenuModule,
    BadgeModule,
    TooltipModule,
    DividerModule,
    RippleModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    OverlayPanelModule,
  ],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 })),
      ]),
    ]),
    trigger('slideIn', [
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
    <div class="shell-container" [class.dark]="themeService.isDarkMode()" [class.sidebar-collapsed]="isCollapsed()">
      <!-- Desktop Sidebar -->
      @if (!isMobile()) {
        <aside class="sidebar" [class.collapsed]="isCollapsed()" [@slideIn]>
          <!-- Logo -->
          <div class="sidebar-header">
            <a [routerLink]="['/dashboard']" class="logo-link">
              <img src="assets/logo.svg" alt="GoEMR" class="logo-img" />
              @if (!isCollapsed()) {
                <span class="logo-text">GoEMR</span>
              }
            </a>
            <p-button 
              [icon]="isCollapsed() ? 'pi pi-angle-right' : 'pi pi-angle-left'"
              [rounded]="true"
              [text]="true"
              severity="secondary"
              (onClick)="toggleCollapse()"
              [pTooltip]="isCollapsed() ? 'Expand' : 'Collapse'"
              tooltipPosition="right"
              class="collapse-btn"
            />
          </div>
          
          <!-- Navigation -->
          <nav class="sidebar-nav">
            @for (item of filteredNavItems(); track item.route) {
              @if (item.children) {
                <!-- Parent with children -->
                <div class="nav-group">
                  <button 
                    class="nav-item parent"
                    [class.expanded]="expandedItems().includes(item.route)"
                    (click)="toggleExpanded(item.route)"
                    pRipple>
                    <i [class]="'pi ' + item.icon"></i>
                    @if (!isCollapsed()) {
                      <span class="nav-label">{{ item.label }}</span>
                      <i class="pi expand-icon" [class.pi-angle-down]="!expandedItems().includes(item.route)" [class.pi-angle-up]="expandedItems().includes(item.route)"></i>
                    }
                  </button>
                  
                  @if (!isCollapsed()) {
                    <div 
                      class="nav-children"
                      [@expandCollapse]="expandedItems().includes(item.route) ? 'expanded' : 'collapsed'">
                      @for (child of item.children; track child.route) {
                        <a 
                          [routerLink]="child.route"
                          routerLinkActive="active"
                          class="nav-item child"
                          pRipple>
                          <i [class]="'pi ' + child.icon"></i>
                          <span class="nav-label">{{ child.label }}</span>
                          @if (child.badge) {
                            <p-badge [value]="child.badge.toString()" [severity]="child.badgeSeverity || 'danger'" />
                          }
                        </a>
                      }
                    </div>
                  }
                </div>
              } @else {
                <!-- Single item -->
                <a 
                  [routerLink]="item.route"
                  routerLinkActive="active"
                  class="nav-item"
                  [pTooltip]="isCollapsed() ? item.label : ''"
                  tooltipPosition="right"
                  pRipple>
                  <i [class]="'pi ' + item.icon"></i>
                  @if (!isCollapsed()) {
                    <span class="nav-label">{{ item.label }}</span>
                  }
                  @if (item.badge && !isCollapsed()) {
                    <p-badge [value]="item.badge.toString()" [severity]="item.badgeSeverity || 'danger'" />
                  }
                  @if (item.badge && isCollapsed()) {
                    <span class="badge-dot"></span>
                  }
                </a>
              }
            }
          </nav>
          
          <!-- User Section -->
          <div class="sidebar-footer">
            <p-divider />
            <button class="user-button" (click)="userMenu.toggle($event)" pRipple>
              <p-avatar 
                [label]="userInitials()" 
                [style]="{ 'background-color': '#3b82f6', 'color': 'white' }"
                shape="circle"
              />
              @if (!isCollapsed()) {
                <div class="user-info">
                  <span class="user-name">{{ userName() }}</span>
                  <span class="user-role">{{ userRoleDisplay() }}</span>
                </div>
                <i class="pi pi-ellipsis-v"></i>
              }
            </button>
          </div>
        </aside>
      }
      
      <!-- Mobile Sidebar -->
      <p-sidebar 
        [(visible)]="mobileMenuVisible" 
        [modal]="true"
        [showCloseIcon]="false"
        styleClass="mobile-sidebar">
        <ng-template pTemplate="header">
          <div class="mobile-sidebar-header">
            <img src="assets/logo.svg" alt="GoEMR" class="logo-img" />
            <span class="logo-text">GoEMR</span>
          </div>
        </ng-template>
        
        <nav class="sidebar-nav mobile">
          @for (item of filteredNavItems(); track item.route) {
            @if (item.children) {
              <div class="nav-group">
                <button 
                  class="nav-item parent"
                  [class.expanded]="expandedItems().includes(item.route)"
                  (click)="toggleExpanded(item.route)"
                  pRipple>
                  <i [class]="'pi ' + item.icon"></i>
                  <span class="nav-label">{{ item.label }}</span>
                  <i class="pi expand-icon" [class.pi-angle-down]="!expandedItems().includes(item.route)" [class.pi-angle-up]="expandedItems().includes(item.route)"></i>
                </button>
                
                <div 
                  class="nav-children"
                  [@expandCollapse]="expandedItems().includes(item.route) ? 'expanded' : 'collapsed'">
                  @for (child of item.children; track child.route) {
                    <a 
                      [routerLink]="child.route"
                      routerLinkActive="active"
                      class="nav-item child"
                      (click)="mobileMenuVisible = false"
                      pRipple>
                      <i [class]="'pi ' + child.icon"></i>
                      <span class="nav-label">{{ child.label }}</span>
                    </a>
                  }
                </div>
              </div>
            } @else {
              <a 
                [routerLink]="item.route"
                routerLinkActive="active"
                class="nav-item"
                (click)="mobileMenuVisible = false"
                pRipple>
                <i [class]="'pi ' + item.icon"></i>
                <span class="nav-label">{{ item.label }}</span>
                @if (item.badge) {
                  <p-badge [value]="item.badge.toString()" [severity]="item.badgeSeverity || 'danger'" />
                }
              </a>
            }
          }
        </nav>
        
        <ng-template pTemplate="footer">
          <div class="mobile-user-section">
            <p-avatar 
              [label]="userInitials()" 
              [style]="{ 'background-color': '#3b82f6', 'color': 'white' }"
              shape="circle"
              size="large"
            />
            <div class="user-info">
              <span class="user-name">{{ userName() }}</span>
              <span class="user-email">{{ userEmail() }}</span>
            </div>
          </div>
          <div class="mobile-footer-actions">
            <p-button label="Profile" icon="pi pi-user" [text]="true" (onClick)="navigateTo('/profile')" />
            <p-button label="Settings" icon="pi pi-cog" [text]="true" (onClick)="navigateTo('/settings')" />
            <p-button label="Logout" icon="pi pi-sign-out" severity="danger" [text]="true" (onClick)="logout()" />
          </div>
        </ng-template>
      </p-sidebar>
      
      <!-- Main Content Area -->
      <div class="main-wrapper">
        <!-- Header/Toolbar -->
        <header class="toolbar" [@fadeIn]>
          <div class="toolbar-left">
            @if (isMobile()) {
              <p-button 
                icon="pi pi-bars" 
                [rounded]="true" 
                [text]="true"
                (onClick)="mobileMenuVisible = true"
              />
            }
            
            <!-- Search -->
            <div class="search-wrapper">
              <p-iconfield>
                <p-inputicon styleClass="pi pi-search" />
                <input 
                  pInputText 
                  type="text" 
                  placeholder="Search patients, appointments..."
                  class="search-input"
                />
              </p-iconfield>
            </div>
          </div>
          
          <div class="toolbar-right">
            <!-- Quick Actions -->
            <p-button 
              icon="pi pi-user-plus" 
              [rounded]="true" 
              [text]="true"
              pTooltip="New Patient"
              tooltipPosition="bottom"
              (onClick)="navigateTo('/patients/new')"
            />
            <p-button 
              icon="pi pi-calendar-plus" 
              [rounded]="true" 
              [text]="true"
              pTooltip="New Appointment"
              tooltipPosition="bottom"
              (onClick)="navigateTo('/appointments/new')"
            />
            
            <!-- Notifications -->
            <p-button 
              icon="pi pi-bell" 
              [rounded]="true" 
              [text]="true"
              [badge]="unreadNotifications().toString()"
              badgeSeverity="danger"
              pTooltip="Notifications"
              tooltipPosition="bottom"
              (onClick)="notificationPanel.toggle($event)"
            />
            
            <!-- Theme Toggle -->
            <p-button 
              [icon]="themeService.isDarkMode() ? 'pi pi-sun' : 'pi pi-moon'" 
              [rounded]="true" 
              [text]="true"
              [pTooltip]="themeService.isDarkMode() ? 'Light Mode' : 'Dark Mode'"
              tooltipPosition="bottom"
              (onClick)="themeService.toggleTheme()"
            />
            
            <!-- Help -->
            <p-button 
              icon="pi pi-question-circle" 
              [rounded]="true" 
              [text]="true"
              pTooltip="Help"
              tooltipPosition="bottom"
            />
          </div>
        </header>
        
        <!-- Page Content -->
        <main class="page-content">
          <router-outlet />
        </main>
      </div>
      
      <!-- User Menu Overlay -->
      <p-overlayPanel #userMenu styleClass="user-menu-panel">
        <div class="user-menu-header">
          <p-avatar 
            [label]="userInitials()" 
            [style]="{ 'background-color': '#3b82f6', 'color': 'white' }"
            shape="circle"
            size="large"
          />
          <div class="user-menu-info">
            <span class="user-menu-name">{{ userName() }}</span>
            <span class="user-menu-email">{{ userEmail() }}</span>
          </div>
        </div>
        <p-divider />
        <div class="user-menu-items">
          <button class="user-menu-item" (click)="navigateTo('/profile'); userMenu.hide()">
            <i class="pi pi-user"></i>
            <span>Profile</span>
          </button>
          <button class="user-menu-item" (click)="navigateTo('/settings'); userMenu.hide()">
            <i class="pi pi-cog"></i>
            <span>Settings</span>
          </button>
          <button class="user-menu-item" (click)="navigateTo('/admin'); userMenu.hide()">
            <i class="pi pi-shield"></i>
            <span>Admin Panel</span>
          </button>
          <p-divider />
          <button class="user-menu-item logout" (click)="logout(); userMenu.hide()">
            <i class="pi pi-sign-out"></i>
            <span>Logout</span>
          </button>
        </div>
      </p-overlayPanel>
      
      <!-- Notifications Panel -->
      <p-overlayPanel #notificationPanel styleClass="notification-panel">
        <div class="notification-header">
          <span class="notification-title">Notifications</span>
          <p-button label="Mark all read" [text]="true" size="small" />
        </div>
        <p-divider />
        <div class="notification-list">
          @for (notification of notifications(); track notification.id) {
            <div class="notification-item" [class]="notification.type">
              <i [class]="'pi ' + getNotificationIcon(notification.type)"></i>
              <div class="notification-content">
                <span class="notification-text">{{ notification.title }}</span>
                <span class="notification-time">{{ notification.time }}</span>
              </div>
            </div>
          }
        </div>
        <p-divider />
        <div class="notification-footer">
          <p-button label="View All Notifications" [text]="true" icon="pi pi-arrow-right" iconPos="right" (onClick)="navigateTo('/messages/notifications')" />
        </div>
      </p-overlayPanel>
    </div>
  `,
  styles: [`
    /* Shell Container */
    .shell-container {
      display: flex;
      min-height: 100vh;
      background: var(--surface-ground, #f8fafc);
      transition: background 0.3s ease;
    }
    
    .shell-container.dark {
      background: #0f172a;
    }
    
    /* Sidebar */
    .sidebar {
      width: 260px;
      height: 100vh;
      position: fixed;
      left: 0;
      top: 0;
      background: white;
      border-right: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      transition: all 0.3s ease;
      z-index: 100;
    }
    
    .dark .sidebar {
      background: #1e293b;
      border-right-color: #334155;
    }
    
    .sidebar.collapsed {
      width: 72px;
    }
    
    /* Sidebar Header */
    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .dark .sidebar-header {
      border-bottom-color: #334155;
    }
    
    .logo-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
    }
    
    .logo-img {
      width: 40px;
      height: 40px;
    }
    
    .logo-text {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
    }
    
    .dark .logo-text {
      color: #f1f5f9;
    }
    
    .collapsed .logo-link {
      justify-content: center;
    }
    
    .collapsed .collapse-btn {
      display: none;
    }
    
    .collapsed:hover .collapse-btn {
      display: flex;
    }
    
    /* Navigation */
    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem;
    }
    
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      color: #64748b;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
      background: transparent;
      width: 100%;
      font-size: 0.9375rem;
    }
    
    .dark .nav-item {
      color: #94a3b8;
    }
    
    .nav-item:hover {
      background: #f1f5f9;
      color: #1e293b;
    }
    
    .dark .nav-item:hover {
      background: #334155;
      color: #f1f5f9;
    }
    
    .nav-item.active {
      background: #eff6ff;
      color: #3b82f6;
      font-weight: 500;
    }
    
    .dark .nav-item.active {
      background: #1e3a8a;
      color: #60a5fa;
    }
    
    .nav-item i {
      font-size: 1.25rem;
      width: 1.5rem;
      text-align: center;
    }
    
    .nav-label {
      flex: 1;
      text-align: left;
    }
    
    .expand-icon {
      font-size: 0.875rem;
    }
    
    .nav-children {
      margin-left: 1rem;
      border-left: 2px solid #e2e8f0;
      padding-left: 0.5rem;
    }
    
    .dark .nav-children {
      border-left-color: #334155;
    }
    
    .nav-item.child {
      padding: 0.625rem 1rem;
      font-size: 0.875rem;
    }
    
    .collapsed .nav-item {
      justify-content: center;
      padding: 0.75rem;
    }
    
    .collapsed .nav-label,
    .collapsed .expand-icon {
      display: none;
    }
    
    .badge-dot {
      width: 8px;
      height: 8px;
      background: #ef4444;
      border-radius: 50%;
      position: absolute;
      top: 8px;
      right: 8px;
    }
    
    /* Sidebar Footer */
    .sidebar-footer {
      padding: 0.5rem;
      margin-top: auto;
    }
    
    .user-button {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.75rem;
      border-radius: 0.5rem;
      border: none;
      background: transparent;
      cursor: pointer;
      transition: background 0.2s ease;
    }
    
    .user-button:hover {
      background: #f1f5f9;
    }
    
    .dark .user-button:hover {
      background: #334155;
    }
    
    .user-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      overflow: hidden;
    }
    
    .user-name {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.875rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .dark .user-name {
      color: #f1f5f9;
    }
    
    .user-role,
    .user-email {
      font-size: 0.75rem;
      color: #64748b;
    }
    
    .dark .user-role,
    .dark .user-email {
      color: #94a3b8;
    }
    
    .collapsed .user-info,
    .collapsed .user-button i.pi-ellipsis-v {
      display: none;
    }
    
    /* Main Content Wrapper */
    .main-wrapper {
      flex: 1;
      margin-left: 260px;
      display: flex;
      flex-direction: column;
      transition: margin-left 0.3s ease;
    }
    
    .sidebar-collapsed .main-wrapper {
      margin-left: 72px;
    }
    
    /* Toolbar */
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1.5rem;
      background: white;
      border-bottom: 1px solid #e2e8f0;
      position: sticky;
      top: 0;
      z-index: 50;
    }
    
    .dark .toolbar {
      background: #1e293b;
      border-bottom-color: #334155;
    }
    
    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex: 1;
    }
    
    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .search-wrapper {
      max-width: 400px;
      flex: 1;
    }
    
    .search-input {
      width: 100%;
    }
    
    /* Page Content */
    .page-content {
      flex: 1;
      padding: 1.5rem;
      overflow-y: auto;
    }
    
    /* User Menu Panel */
    :host ::ng-deep .user-menu-panel {
      width: 280px !important;
    }
    
    .user-menu-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.5rem;
    }
    
    .user-menu-info {
      display: flex;
      flex-direction: column;
    }
    
    .user-menu-name {
      font-weight: 600;
      color: #1e293b;
    }
    
    .dark .user-menu-name {
      color: #f1f5f9;
    }
    
    .user-menu-email {
      font-size: 0.8125rem;
      color: #64748b;
    }
    
    .user-menu-items {
      display: flex;
      flex-direction: column;
    }
    
    .user-menu-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border: none;
      background: transparent;
      cursor: pointer;
      color: #475569;
      font-size: 0.9375rem;
      transition: background 0.2s;
      width: 100%;
      text-align: left;
    }
    
    .user-menu-item:hover {
      background: #f1f5f9;
    }
    
    .user-menu-item.logout {
      color: #ef4444;
    }
    
    .user-menu-item.logout:hover {
      background: #fef2f2;
    }
    
    /* Notification Panel */
    :host ::ng-deep .notification-panel {
      width: 360px !important;
    }
    
    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .notification-title {
      font-weight: 600;
      font-size: 1rem;
    }
    
    .notification-list {
      max-height: 300px;
      overflow-y: auto;
    }
    
    .notification-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.75rem;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .notification-item:hover {
      background: #f1f5f9;
    }
    
    .notification-item i {
      font-size: 1.25rem;
      margin-top: 0.125rem;
    }
    
    .notification-item.info i { color: #3b82f6; }
    .notification-item.success i { color: #16a34a; }
    .notification-item.warning i { color: #d97706; }
    .notification-item.error i { color: #dc2626; }
    
    .notification-content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    
    .notification-text {
      font-size: 0.875rem;
      color: #1e293b;
    }
    
    .notification-time {
      font-size: 0.75rem;
      color: #64748b;
    }
    
    .notification-footer {
      display: flex;
      justify-content: center;
    }
    
    /* Mobile Sidebar */
    :host ::ng-deep .mobile-sidebar {
      width: 280px !important;
    }
    
    .mobile-sidebar-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    
    .mobile-user-section {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 0;
    }
    
    .mobile-footer-actions {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    
    /* Dark mode PrimeNG overrides */
    :host ::ng-deep {
      .dark .p-inputtext {
        background: #334155;
        border-color: #475569;
        color: #f1f5f9;
      }
      
      .dark .p-inputtext::placeholder {
        color: #94a3b8;
      }
      
      .dark .p-overlaypanel {
        background: #1e293b;
        border-color: #334155;
      }
      
      .dark .p-overlaypanel .p-overlaypanel-content {
        color: #f1f5f9;
      }
      
      .dark .p-divider {
        border-color: #334155;
      }
      
      .dark .p-button-text {
        color: #94a3b8;
      }
      
      .dark .p-button-text:hover {
        background: #334155;
        color: #f1f5f9;
      }
      
      .dark .p-sidebar {
        background: #1e293b;
        border-color: #334155;
      }
    }
    
    /* Responsive */
    @media (max-width: 1024px) {
      .main-wrapper {
        margin-left: 0 !important;
      }
      
      .sidebar {
        display: none;
      }
      
      .search-wrapper {
        display: none;
      }
    }
    
    @media (max-width: 768px) {
      .toolbar {
        padding: 0.75rem 1rem;
      }
      
      .page-content {
        padding: 1rem;
      }
    }
  `]
})
export class ShellComponent implements OnInit {
  @ViewChild('notificationPanel') notificationPanel!: OverlayPanel;
  
  private readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly breakpointObserver = inject(BreakpointObserver);
  
  protected readonly isCollapsed = signal(false);
  protected readonly expandedItems = signal<string[]>(['/clinical']);
  protected mobileMenuVisible = false;
  
  // Responsive check
  protected readonly isMobile = toSignal(
    this.breakpointObserver.observe(['(max-width: 1024px)']).pipe(
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
  
  protected readonly userRoleDisplay = computed(() => {
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
    { label: 'Dashboard', icon: 'pi-home', route: '/dashboard' },
    { label: 'Patients', icon: 'pi-users', route: '/patients', requiredPermissions: ['patients:read'] },
    { label: 'Appointments', icon: 'pi-calendar', route: '/appointments', requiredPermissions: ['appointments:read'] },
    { 
      label: 'Clinical', 
      icon: 'pi-heart', 
      route: '/clinical',
      children: [
        { label: 'Encounters', icon: 'pi-file-edit', route: '/encounters' },
        { label: 'Prescriptions', icon: 'pi-box', route: '/prescriptions' },
        { label: 'Labs', icon: 'pi-chart-bar', route: '/labs' },
        { label: 'Imaging', icon: 'pi-image', route: '/imaging' },
      ]
    },
    { label: 'Billing', icon: 'pi-credit-card', route: '/billing', requiredPermissions: ['billing:read'] },
    { label: 'Messages', icon: 'pi-envelope', route: '/messages', badge: 3, badgeSeverity: 'danger' },
    { label: 'Reports', icon: 'pi-chart-line', route: '/reports', requiredPermissions: ['reports:read'] },
    { label: 'Admin', icon: 'pi-cog', route: '/admin', requiredPermissions: ['admin:read'] },
  ];
  
  protected readonly filteredNavItems = computed(() => {
    return this.navItems.filter(item => {
      if (!item.requiredPermissions?.length) return true;
      return item.requiredPermissions.every(p => this.authService.hasPermission(p));
    });
  });
  
  ngOnInit(): void {
    // Load collapsed state from localStorage
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved === 'true') {
      this.isCollapsed.set(true);
    }
  }
  
  toggleCollapse(): void {
    this.isCollapsed.update(v => !v);
    localStorage.setItem('sidebar-collapsed', this.isCollapsed().toString());
  }
  
  toggleExpanded(route: string): void {
    this.expandedItems.update(items => {
      if (items.includes(route)) {
        return items.filter(r => r !== route);
      }
      return [...items, route];
    });
  }
  
  navigateTo(route: string): void {
    this.router.navigate([route]);
    this.mobileMenuVisible = false;
  }
  
  getNotificationIcon(type: string): string {
    const icons: Record<string, string> = {
      info: 'pi-info-circle',
      success: 'pi-check-circle',
      warning: 'pi-exclamation-triangle',
      error: 'pi-times-circle',
    };
    return icons[type] || 'pi-bell';
  }
  
  logout(): void {
    this.authService.logout();
  }
}
