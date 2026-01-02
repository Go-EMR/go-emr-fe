import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

// PrimeNG Imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { CheckboxModule } from 'primeng/checkbox';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ChipModule } from 'primeng/chip';
import { MenuModule } from 'primeng/menu';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DividerModule } from 'primeng/divider';
import { RippleModule } from 'primeng/ripple';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ToastModule } from 'primeng/toast';
import { BadgeModule } from 'primeng/badge';
import { MenuItem, MessageService, ConfirmationService } from 'primeng/api';

import { ThemeService } from '../../../core/services/theme.service';
import { AdminService } from '../data-access/services/admin.service';
import { User, UserStatus, UserType } from '../data-access/models/admin.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, RouterLink,
    TableModule, ButtonModule, InputTextModule, SelectModule, DialogModule, TagModule,
    AvatarModule, TooltipModule, CheckboxModule, ToggleSwitchModule, ChipModule, MenuModule,
    IconFieldModule, InputIconModule, DividerModule, RippleModule, ConfirmPopupModule, 
    ToastModule, BadgeModule,
  ],
  providers: [MessageService, ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('staggerCards', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(80, [
            animate('400ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('tableRow', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ],
  template: `
    <div class="users-container" [class.dark]="themeService.isDarkMode()">
      <p-toast />

      <!-- Header -->
      <header class="page-header" @fadeSlide>
        <div class="header-content">
          <div class="title-section">
            <h1>User Management</h1>
            <p class="subtitle">Manage user accounts, roles, and permissions</p>
          </div>
          <div class="header-actions">
            <p-button label="Export" icon="pi pi-download" [outlined]="true" severity="secondary" (onClick)="exportUsers()" />
            <p-button label="Add User" icon="pi pi-plus" (onClick)="openCreateModal()" />
          </div>
        </div>
      </header>

      <!-- Stats Cards -->
      <div class="stats-grid" @staggerCards>
        <div class="stat-card" data-type="total" pRipple>
          <div class="stat-icon-wrapper">
            <i class="pi pi-users"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ adminService.totalUsers() }}</span>
            <span class="stat-label">Total Users</span>
          </div>
          <div class="stat-trend up">
            <i class="pi pi-arrow-up"></i>
            <span>12%</span>
          </div>
        </div>

        <div class="stat-card" data-type="active" pRipple>
          <div class="stat-icon-wrapper">
            <i class="pi pi-check-circle"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ adminService.usersByStatus().active }}</span>
            <span class="stat-label">Active</span>
          </div>
          <div class="stat-chart">
            <svg viewBox="0 0 100 40" class="mini-chart">
              <polyline fill="none" stroke="currentColor" stroke-width="2" points="0,35 20,28 40,32 60,20 80,25 100,15" />
            </svg>
          </div>
        </div>

        <div class="stat-card" data-type="pending" pRipple>
          <div class="stat-icon-wrapper">
            <i class="pi pi-clock"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ adminService.usersByStatus().pending }}</span>
            <span class="stat-label">Pending</span>
          </div>
          <div class="stat-badge">
            <p-badge value="Action" severity="warn" />
          </div>
        </div>

        <div class="stat-card" data-type="locked" pRipple>
          <div class="stat-icon-wrapper">
            <i class="pi pi-lock"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ adminService.usersByStatus().locked }}</span>
            <span class="stat-label">Locked</span>
          </div>
          @if (adminService.usersByStatus().locked > 0) {
            <div class="stat-alert">
              <i class="pi pi-exclamation-triangle"></i>
            </div>
          }
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-card" @fadeSlide>
        <p-iconfield class="search-field">
          <p-inputicon styleClass="pi pi-search" />
          <input pInputText type="text" [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" placeholder="Search users by name, email..." class="search-input" />
        </p-iconfield>
        <div class="filter-controls">
          <p-select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event)" [options]="statusOptions" optionLabel="label" optionValue="value" placeholder="All Status" [showClear]="true" />
          <p-select [ngModel]="typeFilter()" (ngModelChange)="typeFilter.set($event)" [options]="typeOptions" optionLabel="label" optionValue="value" placeholder="All Types" [showClear]="true" />
          <p-select [ngModel]="departmentFilter()" (ngModelChange)="departmentFilter.set($event)" [options]="departmentOptions" optionLabel="label" optionValue="value" placeholder="All Departments" [showClear]="true" />
        </div>
      </div>

      <!-- Users Table -->
      <div class="table-card">
        <p-table 
          [value]="filteredUsers()" 
          [paginator]="true" 
          [rows]="10" 
          [showCurrentPageReport]="true"
          [rowsPerPageOptions]="[10, 25, 50]"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} users"
          styleClass="p-datatable-striped"
          [rowHover]="true"
          [globalFilterFields]="['fullName', 'email', 'username']"
        >
          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="fullName">User <p-sortIcon field="fullName" /></th>
              <th pSortableColumn="type">Type <p-sortIcon field="type" /></th>
              <th pSortableColumn="department">Department <p-sortIcon field="department" /></th>
              <th>Roles</th>
              <th pSortableColumn="status">Status <p-sortIcon field="status" /></th>
              <th pSortableColumn="lastLogin">Last Login <p-sortIcon field="lastLogin" /></th>
              <th>MFA</th>
              <th style="width: 140px">Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-user>
            <tr [class.inactive-row]="user.status !== 'active'" @tableRow>
              <td>
                <div class="user-cell">
                  <p-avatar 
                    [label]="getInitials(user.fullName)" 
                    [style]="getAvatarStyle(user.type)"
                    shape="circle" 
                    size="normal"
                    [class.inactive-avatar]="user.status !== 'active'"
                  />
                  <div class="user-info">
                    <span class="user-name" [class.inactive-text]="user.status !== 'active'">{{ user.fullName }}</span>
                    <span class="user-email">{{ user.email }}</span>
                  </div>
                </div>
              </td>
              <td>
                <p-tag [value]="formatType(user.type)" [severity]="getTypeSeverity(user.type)" [rounded]="true" />
              </td>
              <td>
                <span class="department-text" [class.inactive-text]="user.status !== 'active'">{{ user.department || '—' }}</span>
              </td>
              <td>
                <div class="roles-cell">
                  @for (role of user.roles.slice(0, 2); track role) {
                    <p-chip [label]="formatRole(role)" styleClass="role-chip" />
                  }
                  @if (user.roles.length > 2) {
                    <span class="roles-more">+{{ user.roles.length - 2 }}</span>
                  }
                </div>
              </td>
              <td>
                <p-tag [value]="formatStatus(user.status)" [severity]="getStatusSeverity(user.status)" [rounded]="true" />
              </td>
              <td>
                @if (user.lastLogin) {
                  <span class="login-date" [class.inactive-text]="user.status !== 'active'">{{ formatDate(user.lastLogin) }}</span>
                } @else {
                  <span class="never-login">Never</span>
                }
              </td>
              <td>
                @if (user.mfaEnabled) {
                  <div class="mfa-enabled">
                    <i class="pi pi-shield"></i>
                    <span>On</span>
                  </div>
                } @else {
                  <span class="mfa-disabled">Off</span>
                }
              </td>
              <td>
                <div class="action-buttons">
                  <p-button icon="pi pi-eye" [rounded]="true" [text]="true" severity="secondary" pTooltip="View" (onClick)="viewUser(user)" />
                  <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="secondary" pTooltip="Edit" (onClick)="editUser(user)" />
                  @if (user.status === 'locked') {
                    <p-button icon="pi pi-lock-open" [rounded]="true" [text]="true" severity="success" pTooltip="Unlock" (onClick)="unlockUser(user)" />
                  }
                  <p-button icon="pi pi-key" [rounded]="true" [text]="true" severity="secondary" pTooltip="Reset Password" (onClick)="resetPassword(user)" />
                  <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" pTooltip="Delete" (onClick)="deleteUser(user)" />
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="8">
                <div class="empty-state">
                  <i class="pi pi-users"></i>
                  <h3>No users found</h3>
                  <p>Try adjusting your filters or add a new user</p>
                  <p-button label="Add User" icon="pi pi-plus" (onClick)="openCreateModal()" />
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Create/Edit User Dialog -->
      <p-dialog 
        [header]="editingUser() ? 'Edit User' : 'Create User'" 
        [(visible)]="showUserModal" 
        [modal]="true" 
        [style]="{ width: '700px' }" 
        [draggable]="false"
        [closable]="true"
      >
        <div class="user-form" [formGroup]="userForm">
          <div class="form-section">
            <h4>Basic Information</h4>
            <div class="form-grid">
              <div class="form-field">
                <label>First Name *</label>
                <input pInputText formControlName="firstName" class="w-full" />
              </div>
              <div class="form-field">
                <label>Last Name *</label>
                <input pInputText formControlName="lastName" class="w-full" />
              </div>
              <div class="form-field">
                <label>Email *</label>
                <input pInputText type="email" formControlName="email" class="w-full" />
              </div>
              <div class="form-field">
                <label>Username *</label>
                <input pInputText formControlName="username" class="w-full" />
              </div>
              <div class="form-field">
                <label>Phone</label>
                <input pInputText formControlName="phone" class="w-full" />
              </div>
              <div class="form-field">
                <label>Title</label>
                <input pInputText formControlName="title" class="w-full" />
              </div>
              <div class="form-field">
                <label>User Type *</label>
                <p-select formControlName="type" [options]="typeOptions" optionLabel="label" optionValue="value" styleClass="w-full" />
              </div>
              <div class="form-field">
                <label>Department</label>
                <p-select formControlName="department" [options]="departmentOptions" optionLabel="label" optionValue="value" styleClass="w-full" [showClear]="true" />
              </div>
            </div>
          </div>

          @if (userForm.get('type')?.value === 'provider') {
            <p-divider />
            <div class="form-section">
              <h4>Provider Information</h4>
              <div class="form-grid">
                <div class="form-field">
                  <label>NPI</label>
                  <input pInputText formControlName="npi" class="w-full" />
                </div>
                <div class="form-field">
                  <label>Specialty</label>
                  <input pInputText formControlName="specialty" class="w-full" />
                </div>
                <div class="form-field">
                  <label>License Number</label>
                  <input pInputText formControlName="licenseNumber" class="w-full" />
                </div>
                <div class="form-field">
                  <label>License State</label>
                  <input pInputText formControlName="licenseState" class="w-full" maxlength="2" />
                </div>
              </div>
            </div>
          }

          <p-divider />
          <div class="form-section">
            <h4>Assign Roles *</h4>
            <div class="roles-grid">
              @for (role of availableRoles; track role.id) {
                <div 
                  class="role-option" 
                  [class.selected]="selectedRoles().includes(role.id)"
                  (click)="toggleRole(role.id)"
                  pRipple
                >
                  <i class="pi" [class.pi-check-circle]="selectedRoles().includes(role.id)" [class.pi-circle]="!selectedRoles().includes(role.id)"></i>
                  <span>{{ role.name }}</span>
                </div>
              }
            </div>
          </div>

          <p-divider />
          <div class="form-section">
            <h4>Security Options</h4>
            <div class="options-list">
              <div class="option-item">
                <span>Require Multi-Factor Authentication</span>
                <p-toggleSwitch formControlName="mfaEnabled" />
              </div>
              @if (!editingUser()) {
                <div class="option-item">
                  <span>Send Welcome Email</span>
                  <p-toggleSwitch formControlName="sendWelcomeEmail" />
                </div>
              }
            </div>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="closeUserModal()" />
          <p-button [label]="editingUser() ? 'Update' : 'Create'" icon="pi pi-check" (onClick)="saveUser()" [disabled]="userForm.invalid || selectedRoles().length === 0" />
        </ng-template>
      </p-dialog>

      <!-- View User Dialog -->
      <p-dialog header="User Details" [(visible)]="showViewModal" [modal]="true" [style]="{ width: '600px' }" [draggable]="false">
        @if (viewingUser(); as user) {
          <div class="user-detail">
            <div class="detail-header">
              <p-avatar [label]="getInitials(user.fullName)" [style]="getAvatarStyle(user.type)" shape="circle" size="xlarge" />
              <div class="detail-meta">
                <h2>{{ user.fullName }}</h2>
                <p>{{ user.email }}</p>
                <p-tag [value]="formatStatus(user.status)" [severity]="getStatusSeverity(user.status)" [rounded]="true" />
              </div>
            </div>

            <p-divider />

            <div class="detail-grid">
              <div class="detail-item">
                <span class="label">Username</span>
                <span class="value">{{ user.username }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Type</span>
                <span class="value">{{ formatType(user.type) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Department</span>
                <span class="value">{{ user.department || '—' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Phone</span>
                <span class="value">{{ user.phone || '—' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Title</span>
                <span class="value">{{ user.title || '—' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">MFA</span>
                <span class="value">{{ user.mfaEnabled ? 'Enabled' : 'Disabled' }}</span>
              </div>
              @if (user.type === 'provider') {
                <div class="detail-item">
                  <span class="label">NPI</span>
                  <span class="value">{{ user.npi || '—' }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Specialty</span>
                  <span class="value">{{ user.specialty || '—' }}</span>
                </div>
              }
              <div class="detail-item">
                <span class="label">Last Login</span>
                <span class="value">{{ user.lastLogin ? formatDateTime(user.lastLogin) : 'Never' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Created</span>
                <span class="value">{{ formatDateTime(user.createdAt) }}</span>
              </div>
            </div>

            <p-divider />

            <div class="detail-roles">
              <span class="label">Assigned Roles</span>
              <div class="roles-list">
                @for (role of user.roles; track role) {
                  <p-chip [label]="formatRole(role)" />
                }
              </div>
            </div>
          </div>
        }

        <ng-template pTemplate="footer">
          <p-button label="Close" [text]="true" severity="secondary" (onClick)="closeViewModal()" />
          <p-button label="Edit User" icon="pi pi-pencil" (onClick)="editUser(viewingUser()!)" />
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .users-container {
      padding: 1.5rem 2rem;
      min-height: 100vh;
      background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
    }

    .dark.users-container {
      background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
    }

    /* Header */
    .page-header {
      margin-bottom: 2rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .title-section h1 {
      margin: 0;
      font-size: 1.875rem;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.025em;
    }

    .dark .title-section h1 {
      color: #f8fafc;
    }

    .subtitle {
      margin: 0.5rem 0 0;
      font-size: 0.9375rem;
      color: #64748b;
      font-weight: 400;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      background: white;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
      border: 1px solid #f1f5f9;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }

    .dark .stat-card {
      background: #1e293b;
      border-color: #334155;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      border-radius: 16px 16px 0 0;
    }

    .stat-card[data-type="total"]::before { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
    .stat-card[data-type="active"]::before { background: linear-gradient(90deg, #10b981, #34d399); }
    .stat-card[data-type="pending"]::before { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
    .stat-card[data-type="locked"]::before { background: linear-gradient(90deg, #ef4444, #f87171); }

    .stat-icon-wrapper {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-icon-wrapper i {
      font-size: 1.5rem;
      color: white;
    }

    .stat-card[data-type="total"] .stat-icon-wrapper { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); }
    .stat-card[data-type="active"] .stat-icon-wrapper { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
    .stat-card[data-type="pending"] .stat-icon-wrapper { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
    .stat-card[data-type="locked"] .stat-icon-wrapper { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }

    .stat-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: #0f172a;
      line-height: 1;
      letter-spacing: -0.025em;
    }

    .dark .stat-value {
      color: #f8fafc;
    }

    .stat-label {
      font-size: 0.8125rem;
      color: #64748b;
      font-weight: 500;
    }

    .stat-trend {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
    }

    .stat-trend.up {
      color: #10b981;
      background: rgba(16, 185, 129, 0.1);
    }

    .stat-trend.down {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
    }

    .stat-chart {
      width: 80px;
      height: 40px;
    }

    .mini-chart {
      width: 100%;
      height: 100%;
      color: #10b981;
    }

    .stat-badge {
      display: flex;
      align-items: center;
    }

    .stat-alert {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: rgba(239, 68, 68, 0.1);
      border-radius: 8px;
    }

    .stat-alert i {
      color: #ef4444;
      font-size: 1rem;
    }

    /* Filters */
    .filters-card {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding: 1.25rem;
      background: white;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      flex-wrap: wrap;
      border: 1px solid #f1f5f9;
    }

    .dark .filters-card {
      background: #1e293b;
      border-color: #334155;
    }

    .search-field {
      flex: 1;
      min-width: 280px;
      max-width: 400px;
    }

    .search-input {
      width: 100%;
      border-radius: 10px;
    }

    .filter-controls {
      display: flex;
      gap: 0.75rem;
      flex: 1;
      flex-wrap: wrap;
    }

    /* Table Card */
    .table-card {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      border: 1px solid #f1f5f9;
    }

    .dark .table-card {
      background: #1e293b;
      border-color: #334155;
    }

    /* Table Row Styles */
    .inactive-row {
      opacity: 0.55;
      background: #f8fafc !important;
    }

    .dark .inactive-row {
      background: #0f172a !important;
    }

    .inactive-row:hover {
      opacity: 0.7;
    }

    .inactive-avatar {
      filter: grayscale(100%);
    }

    .inactive-text {
      color: #94a3b8 !important;
    }

    /* User Cell */
    .user-cell {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .user-name {
      font-weight: 600;
      color: #0f172a;
      font-size: 0.9375rem;
    }

    .dark .user-name {
      color: #f8fafc;
    }

    .user-email {
      font-size: 0.75rem;
      color: #64748b;
    }

    .department-text {
      color: #475569;
      font-size: 0.875rem;
    }

    .dark .department-text {
      color: #94a3b8;
    }

    /* Roles Cell */
    .roles-cell {
      display: flex;
      gap: 0.375rem;
      flex-wrap: wrap;
      align-items: center;
    }

    :host ::ng-deep .role-chip {
      font-size: 0.6875rem !important;
      padding: 0.125rem 0.5rem !important;
    }

    .roles-more {
      font-size: 0.6875rem;
      color: #64748b;
      background: #e2e8f0;
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
      font-weight: 500;
    }

    /* Login Date */
    .login-date {
      font-size: 0.8125rem;
      color: #475569;
    }

    .dark .login-date {
      color: #94a3b8;
    }

    .never-login {
      font-size: 0.8125rem;
      color: #94a3b8;
      font-style: italic;
    }

    /* MFA Badge */
    .mfa-enabled {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.25rem 0.625rem;
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .mfa-enabled i {
      font-size: 0.75rem;
    }

    .mfa-disabled {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    /* Action Buttons */
    .action-buttons {
      display: flex;
      gap: 0.25rem;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 4rem 2rem;
      color: #64748b;
    }

    .empty-state i {
      font-size: 3rem;
      opacity: 0.3;
    }

    .empty-state h3 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #334155;
    }

    .dark .empty-state h3 {
      color: #e2e8f0;
    }

    .empty-state p {
      margin: 0;
      font-size: 0.875rem;
    }

    /* User Form Dialog */
    .user-form {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-section h4 {
      margin: 0 0 1rem;
      font-size: 0.9375rem;
      font-weight: 600;
      color: #334155;
    }

    .dark .form-section h4 {
      color: #e2e8f0;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .form-field label {
      font-size: 0.8125rem;
      font-weight: 500;
      color: #475569;
    }

    .dark .form-field label {
      color: #94a3b8;
    }

    .w-full {
      width: 100%;
    }

    /* Roles Grid */
    .roles-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
    }

    .role-option {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.75rem 1rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .dark .role-option {
      background: #0f172a;
      border-color: #334155;
    }

    .role-option:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }

    .dark .role-option:hover {
      background: #1e293b;
    }

    .role-option.selected {
      background: rgba(59, 130, 246, 0.1);
      border-color: #3b82f6;
    }

    .role-option i {
      font-size: 1rem;
      color: #94a3b8;
    }

    .role-option.selected i {
      color: #3b82f6;
    }

    .role-option span {
      font-size: 0.875rem;
      color: #334155;
    }

    .dark .role-option span {
      color: #e2e8f0;
    }

    /* Options List */
    .options-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .option-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: #f8fafc;
      border-radius: 10px;
    }

    .dark .option-item {
      background: #0f172a;
    }

    .option-item span {
      font-size: 0.875rem;
      color: #334155;
    }

    .dark .option-item span {
      color: #e2e8f0;
    }

    /* User Detail Dialog */
    .user-detail {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .detail-header {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .detail-meta {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .detail-meta h2 {
      margin: 0;
      font-size: 1.375rem;
      font-weight: 600;
      color: #0f172a;
    }

    .dark .detail-meta h2 {
      color: #f8fafc;
    }

    .detail-meta p {
      margin: 0;
      font-size: 0.875rem;
      color: #64748b;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .detail-item .label {
      font-size: 0.6875rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .detail-item .value {
      font-size: 0.9375rem;
      color: #0f172a;
    }

    .dark .detail-item .value {
      color: #f8fafc;
    }

    .detail-roles {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }

    .detail-roles .label {
      font-size: 0.6875rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .roles-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .users-container {
        padding: 1rem;
      }

      .header-content {
        flex-direction: column;
        gap: 1rem;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .filters-card {
        flex-direction: column;
      }

      .search-field {
        max-width: none;
      }

      .form-grid,
      .roles-grid,
      .detail-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class UsersComponent {
  adminService = inject(AdminService);
  themeService = inject(ThemeService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);

  // Filters
  searchQuery = signal('');
  statusFilter = signal<string | null>(null);
  typeFilter = signal<string | null>(null);
  departmentFilter = signal<string | null>(null);

  // Modal state
  showUserModal = signal(false);
  showViewModal = signal(false);
  editingUser = signal<User | null>(null);
  viewingUser = signal<User | null>(null);

  // Role selection
  selectedRoles = signal<string[]>([]);

  // Filter Options
  statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Pending', value: 'pending' },
    { label: 'Locked', value: 'locked' },
    { label: 'Suspended', value: 'suspended' }
  ];

  typeOptions = [
    { label: 'Provider', value: 'provider' },
    { label: 'Staff', value: 'staff' },
    { label: 'Admin', value: 'admin' }
  ];

  departmentOptions = [
    { label: 'Internal Medicine', value: 'Internal Medicine' },
    { label: 'Cardiology', value: 'Cardiology' },
    { label: 'Nursing', value: 'Nursing' },
    { label: 'Administration', value: 'Administration' },
    { label: 'Billing', value: 'Billing' },
    { label: 'Front Desk', value: 'Front Desk' },
    { label: 'IT', value: 'IT' }
  ];

  availableRoles = [
    { id: 'physician', name: 'Physician' },
    { id: 'nurse', name: 'Nurse' },
    { id: 'office-manager', name: 'Office Manager' },
    { id: 'billing-clerk', name: 'Billing Clerk' },
    { id: 'receptionist', name: 'Receptionist' },
    { id: 'scheduler', name: 'Scheduler' },
    { id: 'clinical-staff', name: 'Clinical Staff' },
    { id: 'provider', name: 'Provider Access' }
  ];

  // Form
  userForm: FormGroup = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    username: ['', Validators.required],
    phone: [''],
    title: [''],
    type: ['staff', Validators.required],
    department: [''],
    npi: [''],
    specialty: [''],
    licenseNumber: [''],
    licenseState: [''],
    mfaEnabled: [false],
    sendWelcomeEmail: [true]
  });

  // Computed values
  filteredUsers = computed(() => {
    let users = this.adminService.users();

    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      users = users.filter(u =>
        u.fullName.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.username.toLowerCase().includes(query)
      );
    }

    if (this.statusFilter()) {
      users = users.filter(u => u.status === this.statusFilter());
    }

    if (this.typeFilter()) {
      users = users.filter(u => u.type === this.typeFilter());
    }

    if (this.departmentFilter()) {
      users = users.filter(u => u.department === this.departmentFilter());
    }

    return users.sort((a, b) => a.fullName.localeCompare(b.fullName));
  });

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  getAvatarStyle(type: UserType): Record<string, string> {
    const styles: Record<UserType, Record<string, string>> = {
      provider: { 'background-color': '#3b82f6', 'color': 'white' },
      staff: { 'background-color': '#8b5cf6', 'color': 'white' },
      admin: { 'background-color': '#dc2626', 'color': 'white' },
      patient: { 'background-color': '#10b981', 'color': 'white' },
      external: {'background-color': '#d8bc20ff', 'color': 'white'},
    };
    return styles[type] || styles.staff;
  }

  formatType(type: UserType): string {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  formatStatus(status: UserStatus): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  formatRole(role: string): string {
    return role.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  formatDateTime(date: Date): string {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  getTypeSeverity(type: UserType): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
    const map: Record<string, any> = { provider: 'info', staff: 'secondary', admin: 'danger' };
    return map[type] || 'secondary';
  }

  getStatusSeverity(status: UserStatus): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
    const map: Record<string, any> = { active: 'success', inactive: 'secondary', pending: 'warn', locked: 'danger', suspended: 'danger' };
    return map[status] || 'secondary';
  }

  openCreateModal(): void {
    this.editingUser.set(null);
    this.selectedRoles.set([]);
    this.userForm.reset({ type: 'staff', mfaEnabled: false, sendWelcomeEmail: true });
    this.showUserModal.set(true);
  }

  editUser(user: User): void {
    this.editingUser.set(user);
    this.selectedRoles.set([...user.roles]);
    this.userForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      phone: user.phone || '',
      title: user.title || '',
      type: user.type,
      department: user.department || '',
      npi: user.npi || '',
      specialty: user.specialty || '',
      licenseNumber: user.licenseNumber || '',
      licenseState: user.licenseState || '',
      mfaEnabled: user.mfaEnabled
    });
    this.showViewModal.set(false);
    this.showUserModal.set(true);
  }

  closeUserModal(): void {
    this.showUserModal.set(false);
    this.editingUser.set(null);
  }

  toggleRole(roleId: string): void {
    const roles = this.selectedRoles();
    if (roles.includes(roleId)) {
      this.selectedRoles.set(roles.filter(r => r !== roleId));
    } else {
      this.selectedRoles.set([...roles, roleId]);
    }
  }

  saveUser(): void {
    if (this.userForm.valid && this.selectedRoles().length > 0) {
      const formValue = this.userForm.value;
      const userData: Partial<User> = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        fullName: `${formValue.firstName} ${formValue.lastName}`,
        email: formValue.email,
        username: formValue.username,
        phone: formValue.phone,
        title: formValue.title,
        type: formValue.type,
        department: formValue.department,
        roles: this.selectedRoles(),
        mfaEnabled: formValue.mfaEnabled
      };

      if (formValue.type === 'provider') {
        userData.npi = formValue.npi;
        userData.specialty = formValue.specialty;
        userData.licenseNumber = formValue.licenseNumber;
        userData.licenseState = formValue.licenseState;
      }

      if (this.editingUser()) {
        this.adminService.updateUser(this.editingUser()!.id, userData);
        this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'User updated successfully' });
      } else {
        this.adminService.createUser(userData);
        this.messageService.add({ severity: 'success', summary: 'Created', detail: 'User created successfully' });
      }

      this.closeUserModal();
    }
  }

  viewUser(user: User): void {
    this.viewingUser.set(user);
    this.showViewModal.set(true);
  }

  closeViewModal(): void {
    this.showViewModal.set(false);
    this.viewingUser.set(null);
  }

  unlockUser(user: User): void {
    this.adminService.unlockUser(user.id);
    this.messageService.add({ severity: 'success', summary: 'Unlocked', detail: `User "${user.fullName}" unlocked` });
  }

  resetPassword(user: User): void {
    this.adminService.resetPassword(user.id);
    this.messageService.add({ severity: 'info', summary: 'Email Sent', detail: `Password reset email sent to ${user.email}` });
  }

  deleteUser(user: User): void {
    this.adminService.deleteUser(user.id);
    this.messageService.add({ severity: 'warn', summary: 'Deleted', detail: `User "${user.fullName}" deleted` });
  }

  exportUsers(): void {
    this.messageService.add({ severity: 'info', summary: 'Exporting', detail: 'Preparing user export...' });
  }
}
