import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

// PrimeNG Imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { CheckboxModule } from 'primeng/checkbox';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ChipModule } from 'primeng/chip';
import { TabViewModule } from 'primeng/tabview';
import { AccordionModule } from 'primeng/accordion';
import { DividerModule } from 'primeng/divider';
import { RippleModule } from 'primeng/ripple';
import { BadgeModule } from 'primeng/badge';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { ThemeService } from '../../../core/services/theme.service';
import { AdminService } from '../data-access/services/admin.service';
import { Role, Permission, PermissionCategory, PermissionAction } from '../data-access/models/admin.model';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    TableModule, ButtonModule, InputTextModule, InputTextarea, SelectModule,
    DialogModule, TagModule, TooltipModule, CheckboxModule, ToggleSwitchModule,
    ChipModule, TabViewModule, AccordionModule, DividerModule, RippleModule,
    BadgeModule, ToastModule,
  ],
  providers: [MessageService],
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
          style({ opacity: 0, transform: 'translateY(20px) scale(0.95)' }),
          stagger(100, [
            animate('400ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('expandCollapse', [
      transition(':enter', [
        style({ opacity: 0, height: 0 }),
        animate('200ms ease-out', style({ opacity: 1, height: '*' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, height: 0 }))
      ])
    ]),
    trigger('modalSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('250ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ],
  template: `
    <div class="roles-container" [class.dark]="themeService.isDarkMode()">
      <p-toast />

      <!-- Header -->
      <header class="page-header" @fadeSlide>
        <div class="header-content">
          <div class="title-section">
            <h1>Roles & Permissions</h1>
            <p class="subtitle">Manage user roles and access permissions across your organization</p>
          </div>
          <div class="header-actions">
            <p-button label="Create Role" icon="pi pi-plus" (onClick)="openCreateModal()" />
          </div>
        </div>
      </header>

      <!-- Summary Stats -->
      <div class="stats-row" @fadeSlide>
        <div class="stat-chip">
          <i class="pi pi-shield"></i>
          <span class="stat-number">{{ adminService.roles().length }}</span>
          <span class="stat-text">Total Roles</span>
        </div>
        <div class="stat-chip">
          <i class="pi pi-lock"></i>
          <span class="stat-number">{{ systemRolesCount() }}</span>
          <span class="stat-text">System Roles</span>
        </div>
        <div class="stat-chip">
          <i class="pi pi-cog"></i>
          <span class="stat-number">{{ customRolesCount() }}</span>
          <span class="stat-text">Custom Roles</span>
        </div>
        <div class="stat-chip">
          <i class="pi pi-key"></i>
          <span class="stat-number">{{ adminService.permissions().length }}</span>
          <span class="stat-text">Permissions</span>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs-container">
        <div class="tab-buttons">
          <button 
            class="tab-btn" 
            [class.active]="activeTab() === 'roles'"
            (click)="activeTab.set('roles')"
            pRipple
          >
            <i class="pi pi-id-card"></i>
            <span>Roles</span>
          </button>
          <button 
            class="tab-btn" 
            [class.active]="activeTab() === 'matrix'"
            (click)="activeTab.set('matrix')"
            pRipple
          >
            <i class="pi pi-th-large"></i>
            <span>Permission Matrix</span>
          </button>
        </div>
      </div>

      <!-- Roles Grid -->
      @if (activeTab() === 'roles') {
        <div class="roles-grid" @staggerCards>
          @for (role of adminService.roles(); track role.id) {
            <div class="role-card" [class.system]="role.type === 'system'" pRipple>
              <div class="role-card-header">
                <div class="role-icon" [class.system]="role.type === 'system'" [class.custom]="role.type !== 'system'">
                  <i class="pi" [class.pi-shield]="role.type === 'system'" [class.pi-cog]="role.type !== 'system'"></i>
                </div>
                <div class="role-badges">
                  @if (role.type === 'system') {
                    <p-tag value="System" severity="info" [rounded]="true" />
                  } @else {
                    <p-tag value="Custom" severity="warn" [rounded]="true" />
                  }
                  @if (role.isDefault) {
                    <p-tag value="Default" severity="success" [rounded]="true" />
                  }
                </div>
              </div>

              <div class="role-content">
                <h3 class="role-name">{{ role.name }}</h3>
                <p class="role-description">{{ role.description }}</p>
              </div>

              <div class="role-stats">
                <div class="role-stat">
                  <i class="pi pi-users"></i>
                  <span class="stat-value">{{ role.userCount }}</span>
                  <span class="stat-label">Users</span>
                </div>
                <div class="role-stat">
                  <i class="pi pi-key"></i>
                  <span class="stat-value">{{ role.permissions.length }}</span>
                  <span class="stat-label">Permissions</span>
                </div>
              </div>

              <p-divider />

              <div class="role-actions">
                <p-button icon="pi pi-eye" label="View" [text]="true" severity="secondary" (onClick)="viewRole(role)" />
                <p-button icon="pi pi-pencil" label="Edit" [text]="true" severity="secondary" (onClick)="editRole(role)" [disabled]="role.type === 'system'" />
                @if (role.type !== 'system') {
                  <p-button icon="pi pi-trash" [text]="true" severity="danger" (onClick)="deleteRole(role)" pTooltip="Delete" />
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- Permission Matrix -->
      @if (activeTab() === 'matrix') {
        <div class="matrix-card" @fadeSlide>
          <div class="matrix-header">
            <div class="matrix-title">
              <h3>Permission Matrix</h3>
              <p>Configure which roles have access to specific features</p>
            </div>
            <div class="matrix-filters">
              <p-select 
                [ngModel]="categoryFilter()" 
                (ngModelChange)="categoryFilter.set($event)"
                [options]="categoryOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="All Categories"
                [showClear]="true"
              />
            </div>
          </div>

          <div class="matrix-table-wrapper">
            <table class="matrix-table">
              <thead>
                <tr>
                  <th class="permission-col">Permission</th>
                  @for (role of adminService.roles(); track role.id) {
                    <th class="role-col">
                      <div class="role-header-cell">
                        <span class="role-col-name">{{ role.name }}</span>
                        @if (role.type === 'system') {
                          <span class="role-col-badge system">System</span>
                        } @else {
                          <span class="role-col-badge custom">Custom</span>
                        }
                      </div>
                    </th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (category of permissionCategories; track category) {
                  @if (categoryFilter() === null || categoryFilter() === category) {
                    <tr class="category-row">
                      <td [attr.colspan]="adminService.roles().length + 1">
                        <div class="category-label">
                          <i [class]="getCategoryIcon(category)"></i>
                          <span>{{ formatCategory(category) }}</span>
                        </div>
                      </td>
                    </tr>
                    @for (permission of getPermissionsByCategory(category); track permission.id) {
                      <tr class="permission-row">
                        <td class="permission-cell">
                          <div class="permission-info">
                            <span class="permission-name">{{ permission.name }}</span>
                            <span class="permission-desc">{{ permission.description }}</span>
                          </div>
                        </td>
                        @for (role of adminService.roles(); track role.id) {
                          <td class="check-cell">
                            <div 
                              class="matrix-checkbox" 
                              [class.checked]="hasPermission(role, permission)"
                              [class.disabled]="role.type === 'system'"
                              (click)="togglePermission(role, permission)"
                            >
                              @if (hasPermission(role, permission)) {
                                <i class="pi pi-check"></i>
                              }
                            </div>
                          </td>
                        }
                      </tr>
                    }
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Create/Edit Role Dialog -->
      <p-dialog 
        [header]="editingRole() ? 'Edit Role' : 'Create Role'" 
        [(visible)]="showRoleModal" 
        [modal]="true" 
        [style]="{ width: '650px' }" 
        [draggable]="false"
        [closable]="true"
      >
        <div class="role-form" [formGroup]="roleForm">
          <div class="form-section">
            <h4>Role Details</h4>
            <div class="form-grid">
              <div class="form-field full-width">
                <label>Role Name *</label>
                <input pInputText formControlName="name" class="w-full" placeholder="Enter role name" />
              </div>
              <div class="form-field full-width">
                <label>Description</label>
                <textarea pInputTextarea formControlName="description" class="w-full" rows="3" placeholder="Describe this role's purpose"></textarea>
              </div>
            </div>
            <div class="form-option">
              <p-toggleSwitch formControlName="isDefault" />
              <div class="option-text">
                <span class="option-label">Set as default role</span>
                <span class="option-desc">New users will automatically be assigned this role</span>
              </div>
            </div>
          </div>

          <p-divider />

          <div class="form-section">
            <h4>Permissions</h4>
            <div class="permissions-accordion">
              @for (category of permissionCategories; track category) {
                <div class="permission-category">
                  <div 
                    class="category-header" 
                    (click)="toggleCategory(category)"
                    pRipple
                  >
                    <i class="pi" [class.pi-chevron-right]="!expandedCategories().includes(category)" [class.pi-chevron-down]="expandedCategories().includes(category)"></i>
                    <i [class]="getCategoryIcon(category)" class="category-icon"></i>
                    <span class="category-name">{{ formatCategory(category) }}</span>
                    <span class="category-count">
                      {{ getSelectedCount(category) }}/{{ getPermissionsByCategory(category).length }}
                    </span>
                  </div>
                  @if (expandedCategories().includes(category)) {
                    <div class="category-body" @expandCollapse>
                      @for (permission of getPermissionsByCategory(category); track permission.id) {
                        <div 
                          class="permission-item"
                          [class.selected]="selectedPermissions().includes(permission.id)"
                          (click)="toggleFormPermission(permission.id)"
                          pRipple
                        >
                          <div class="permission-checkbox" [class.checked]="selectedPermissions().includes(permission.id)">
                            @if (selectedPermissions().includes(permission.id)) {
                              <i class="pi pi-check"></i>
                            }
                          </div>
                          <div class="permission-details">
                            <span class="perm-name">{{ permission.name }}</span>
                            <span class="perm-desc">{{ permission.description }}</span>
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="closeRoleModal()" />
          <p-button [label]="editingRole() ? 'Update Role' : 'Create Role'" icon="pi pi-check" (onClick)="saveRole()" [disabled]="roleForm.invalid" />
        </ng-template>
      </p-dialog>

      <!-- View Role Dialog -->
      <p-dialog header="Role Details" [(visible)]="showDetailModal" [modal]="true" [style]="{ width: '600px' }" [draggable]="false">
        @if (selectedRole(); as role) {
          <div class="role-detail">
            <div class="detail-header">
              <div class="detail-icon" [class.system]="role.type === 'system'" [class.custom]="role.type !== 'system'">
                <i class="pi" [class.pi-shield]="role.type === 'system'" [class.pi-cog]="role.type !== 'system'"></i>
              </div>
              <div class="detail-info">
                <h2>{{ role.name }}</h2>
                <div class="detail-badges">
                  @if (role.type === 'system') {
                    <p-tag value="System Role" severity="info" [rounded]="true" />
                  } @else {
                    <p-tag value="Custom Role" severity="warn" [rounded]="true" />
                  }
                  @if (role.isDefault) {
                    <p-tag value="Default" severity="success" [rounded]="true" />
                  }
                </div>
              </div>
            </div>

            <p class="detail-description">{{ role.description }}</p>

            <div class="detail-stats-grid">
              <div class="detail-stat">
                <span class="stat-label">Users Assigned</span>
                <span class="stat-value">{{ role.userCount }}</span>
              </div>
              <div class="detail-stat">
                <span class="stat-label">Permissions</span>
                <span class="stat-value">{{ role.permissions.length }}</span>
              </div>
              <div class="detail-stat">
                <span class="stat-label">Created</span>
                <span class="stat-value">{{ formatDate(role.createdAt) }}</span>
              </div>
              <div class="detail-stat">
                <span class="stat-label">Last Updated</span>
                <span class="stat-value">{{ formatDate(role.updatedAt) }}</span>
              </div>
            </div>

            <p-divider />

            <div class="detail-permissions">
              <h4>Assigned Permissions</h4>
              @for (category of permissionCategories; track category) {
                @if (hasPermissionsInCategory(role, category)) {
                  <div class="permission-group">
                    <div class="group-header">
                      <i [class]="getCategoryIcon(category)"></i>
                      <span>{{ formatCategory(category) }}</span>
                    </div>
                    <div class="permission-tags">
                      @for (permission of getRolePermissionsByCategory(role, category); track permission.id) {
                        <p-chip [label]="permission.name" />
                      }
                    </div>
                  </div>
                }
              }
            </div>
          </div>
        }

        <ng-template pTemplate="footer">
          <p-button label="Close" [text]="true" severity="secondary" (onClick)="closeDetailModal()" />
          @if (selectedRole()?.type !== 'system') {
            <p-button label="Edit Role" icon="pi pi-pencil" (onClick)="editRole(selectedRole()!)" />
          }
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .roles-container {
      padding: 1.5rem 2rem;
      min-height: 100vh;
      background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
    }

    .dark.roles-container {
      background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
    }

    /* Header */
    .page-header {
      margin-bottom: 1.5rem;
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

    /* Stats Row */
    .stats-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .stat-chip {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.75rem 1.25rem;
      background: white;
      border-radius: 12px;
      border: 1px solid #f1f5f9;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }

    .dark .stat-chip {
      background: #1e293b;
      border-color: #334155;
    }

    .stat-chip i {
      font-size: 1.25rem;
      color: #3b82f6;
    }

    .stat-chip .stat-number {
      font-size: 1.25rem;
      font-weight: 700;
      color: #0f172a;
    }

    .dark .stat-chip .stat-number {
      color: #f8fafc;
    }

    .stat-chip .stat-text {
      font-size: 0.8125rem;
      color: #64748b;
      font-weight: 500;
    }

    /* Tabs */
    .tabs-container {
      margin-bottom: 1.5rem;
    }

    .tab-buttons {
      display: flex;
      gap: 0.5rem;
      padding: 0.375rem;
      background: white;
      border-radius: 12px;
      width: fit-content;
      border: 1px solid #f1f5f9;
    }

    .dark .tab-buttons {
      background: #1e293b;
      border-color: #334155;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      border: none;
      background: transparent;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;
    }

    .tab-btn:hover {
      color: #3b82f6;
      background: rgba(59, 130, 246, 0.05);
    }

    .tab-btn.active {
      color: white;
      background: #3b82f6;
    }

    .tab-btn i {
      font-size: 1rem;
    }

    /* Roles Grid */
    .roles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 1.25rem;
    }

    .role-card {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      border: 1px solid #f1f5f9;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
    }

    .dark .role-card {
      background: #1e293b;
      border-color: #334155;
    }

    .role-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
    }

    .role-card.system {
      border-color: #dbeafe;
      background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%);
    }

    .dark .role-card.system {
      background: linear-gradient(135deg, #1e293b 0%, #1e3a5f 100%);
      border-color: #1e40af;
    }

    .role-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .role-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .role-icon i {
      font-size: 1.25rem;
      color: white;
    }

    .role-icon.system {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    }

    .role-icon.custom {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    }

    .role-badges {
      display: flex;
      gap: 0.375rem;
    }

    .role-content {
      margin-bottom: 1.25rem;
    }

    .role-name {
      margin: 0 0 0.5rem;
      font-size: 1.125rem;
      font-weight: 600;
      color: #0f172a;
      letter-spacing: -0.01em;
    }

    .dark .role-name {
      color: #f8fafc;
    }

    .role-description {
      margin: 0;
      font-size: 0.875rem;
      color: #64748b;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .role-stats {
      display: flex;
      gap: 2rem;
      margin-bottom: 1rem;
    }

    .role-stat {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .role-stat i {
      font-size: 0.875rem;
      color: #94a3b8;
    }

    .role-stat .stat-value {
      font-size: 1rem;
      font-weight: 700;
      color: #0f172a;
    }

    .dark .role-stat .stat-value {
      color: #f8fafc;
    }

    .role-stat .stat-label {
      font-size: 0.75rem;
      color: #64748b;
    }

    .role-actions {
      display: flex;
      gap: 0.25rem;
      margin-top: 0.75rem;
    }

    /* Matrix Card */
    .matrix-card {
      background: white;
      border-radius: 16px;
      border: 1px solid #f1f5f9;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      overflow: hidden;
    }

    .dark .matrix-card {
      background: #1e293b;
      border-color: #334155;
    }

    .matrix-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .dark .matrix-header {
      border-bottom-color: #334155;
    }

    .matrix-title h3 {
      margin: 0;
      font-size: 1.0625rem;
      font-weight: 600;
      color: #0f172a;
    }

    .dark .matrix-title h3 {
      color: #f8fafc;
    }

    .matrix-title p {
      margin: 0.25rem 0 0;
      font-size: 0.8125rem;
      color: #64748b;
    }

    .matrix-table-wrapper {
      overflow-x: auto;
    }

    .matrix-table {
      width: 100%;
      border-collapse: collapse;
    }

    .matrix-table th {
      padding: 0.875rem 1rem;
      text-align: center;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      white-space: nowrap;
      position: sticky;
      top: 0;
    }

    .dark .matrix-table th {
      background: #0f172a;
      border-bottom-color: #334155;
    }

    .matrix-table th.permission-col {
      text-align: left;
      min-width: 280px;
    }

    .matrix-table th.role-col {
      min-width: 120px;
    }

    .role-header-cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.375rem;
    }

    .role-col-name {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #334155;
    }

    .dark .role-col-name {
      color: #e2e8f0;
    }

    .role-col-badge {
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .role-col-badge.system {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .role-col-badge.custom {
      background: #fef3c7;
      color: #d97706;
    }

    .category-row td {
      background: #f1f5f9;
      padding: 0.625rem 1rem;
    }

    .dark .category-row td {
      background: #0f172a;
    }

    .category-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .category-label i {
      font-size: 0.875rem;
    }

    .permission-row td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .dark .permission-row td {
      border-bottom-color: #334155;
    }

    .permission-cell {
      vertical-align: middle;
    }

    .permission-info {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .permission-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: #0f172a;
    }

    .dark .permission-name {
      color: #f8fafc;
    }

    .permission-desc {
      font-size: 0.75rem;
      color: #64748b;
    }

    .check-cell {
      text-align: center;
      vertical-align: middle;
    }

    .matrix-checkbox {
      width: 24px;
      height: 24px;
      border: 2px solid #e2e8f0;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      background: white;
    }

    .dark .matrix-checkbox {
      border-color: #475569;
      background: #1e293b;
    }

    .matrix-checkbox:hover:not(.disabled) {
      border-color: #3b82f6;
    }

    .matrix-checkbox.checked {
      background: #3b82f6;
      border-color: #3b82f6;
    }

    .matrix-checkbox.checked i {
      color: white;
      font-size: 0.75rem;
    }

    .matrix-checkbox.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Form Styles */
    .role-form {
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
      display: flex;
      flex-direction: column;
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

    .form-option {
      display: flex;
      align-items: flex-start;
      gap: 0.875rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 10px;
      margin-top: 1rem;
    }

    .dark .form-option {
      background: #0f172a;
    }

    .option-text {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .option-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #334155;
    }

    .dark .option-label {
      color: #e2e8f0;
    }

    .option-desc {
      font-size: 0.75rem;
      color: #64748b;
    }

    /* Permissions Accordion */
    .permissions-accordion {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .permission-category {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
    }

    .dark .permission-category {
      border-color: #334155;
    }

    .category-header {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.875rem 1rem;
      background: #f8fafc;
      cursor: pointer;
      transition: background 0.15s;
    }

    .dark .category-header {
      background: #0f172a;
    }

    .category-header:hover {
      background: #f1f5f9;
    }

    .dark .category-header:hover {
      background: #1e293b;
    }

    .category-header > i:first-child {
      font-size: 0.75rem;
      color: #64748b;
    }

    .category-icon {
      font-size: 1rem;
      color: #3b82f6;
    }

    .category-name {
      flex: 1;
      font-size: 0.875rem;
      font-weight: 500;
      color: #334155;
    }

    .dark .category-name {
      color: #e2e8f0;
    }

    .category-count {
      font-size: 0.75rem;
      color: #64748b;
      background: #e2e8f0;
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
    }

    .dark .category-count {
      background: #334155;
    }

    .category-body {
      padding: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .permission-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.75rem;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.15s;
    }

    .permission-item:hover {
      background: #f8fafc;
    }

    .dark .permission-item:hover {
      background: #0f172a;
    }

    .permission-item.selected {
      background: rgba(59, 130, 246, 0.08);
    }

    .permission-checkbox {
      width: 20px;
      height: 20px;
      border: 2px solid #e2e8f0;
      border-radius: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 2px;
      transition: all 0.2s;
    }

    .dark .permission-checkbox {
      border-color: #475569;
    }

    .permission-checkbox.checked {
      background: #3b82f6;
      border-color: #3b82f6;
    }

    .permission-checkbox.checked i {
      color: white;
      font-size: 0.625rem;
    }

    .permission-details {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .perm-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: #334155;
    }

    .dark .perm-name {
      color: #e2e8f0;
    }

    .perm-desc {
      font-size: 0.75rem;
      color: #64748b;
    }

    /* Role Detail Dialog */
    .role-detail {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .detail-header {
      display: flex;
      align-items: flex-start;
      gap: 1.25rem;
    }

    .detail-icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .detail-icon i {
      font-size: 1.5rem;
      color: white;
    }

    .detail-icon.system {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    }

    .detail-icon.custom {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    }

    .detail-info {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .detail-info h2 {
      margin: 0;
      font-size: 1.375rem;
      font-weight: 600;
      color: #0f172a;
    }

    .dark .detail-info h2 {
      color: #f8fafc;
    }

    .detail-badges {
      display: flex;
      gap: 0.375rem;
    }

    .detail-description {
      margin: 0;
      font-size: 0.9375rem;
      color: #64748b;
      line-height: 1.6;
    }

    .detail-stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 10px;
    }

    .dark .detail-stats-grid {
      background: #0f172a;
    }

    .detail-stat {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      text-align: center;
    }

    .detail-stat .stat-label {
      font-size: 0.6875rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .detail-stat .stat-value {
      font-size: 1rem;
      font-weight: 600;
      color: #0f172a;
    }

    .dark .detail-stat .stat-value {
      color: #f8fafc;
    }

    .detail-permissions h4 {
      margin: 0 0 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #64748b;
    }

    .permission-group {
      margin-bottom: 1rem;
    }

    .group-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.625rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .dark .group-header {
      color: #94a3b8;
    }

    .group-header i {
      font-size: 0.875rem;
      color: #3b82f6;
    }

    .permission-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .roles-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .detail-stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .roles-container {
        padding: 1rem;
      }

      .header-content {
        flex-direction: column;
        gap: 1rem;
      }

      .stats-row {
        flex-direction: column;
      }

      .stat-chip {
        width: 100%;
      }

      .roles-grid {
        grid-template-columns: 1fr;
      }

      .matrix-table {
        min-width: 600px;
      }
    }
  `]
})
export class RolesComponent {
  adminService = inject(AdminService);
  themeService = inject(ThemeService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);

  // State
  activeTab = signal<'roles' | 'matrix'>('roles');
  categoryFilter = signal<PermissionCategory | null>(null);

  // Modal state
  showRoleModal = signal(false);
  showDetailModal = signal(false);
  editingRole = signal<Role | null>(null);
  selectedRole = signal<Role | null>(null);

  // Form state
  expandedCategories = signal<PermissionCategory[]>([]);
  selectedPermissions = signal<string[]>([]);

  permissionCategories: PermissionCategory[] = [
    'patients', 'appointments', 'encounters', 'billing', 'reports', 'messaging', 'admin'
  ];

  categoryOptions = [
    { label: 'Patients', value: 'patients' },
    { label: 'Appointments', value: 'appointments' },
    { label: 'Encounters', value: 'encounters' },
    { label: 'Billing', value: 'billing' },
    { label: 'Reports', value: 'reports' },
    { label: 'Messaging', value: 'messaging' },
    { label: 'Admin', value: 'admin' }
  ];

  roleForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    isDefault: [false]
  });

  // Computed values
  systemRolesCount = computed(() => this.adminService.roles().filter(r => r.type === 'system').length);
  customRolesCount = computed(() => this.adminService.roles().filter(r => r.type !== 'system').length);

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      patients: 'pi pi-users',
      appointments: 'pi pi-calendar',
      encounters: 'pi pi-file-edit',
      billing: 'pi pi-dollar',
      reports: 'pi pi-chart-bar',
      messaging: 'pi pi-envelope',
      admin: 'pi pi-cog'
    };
    return icons[category] || 'pi pi-folder';
  }

  formatCategory(category: string): string {
    return category.charAt(0).toUpperCase() + category.slice(1);
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  getPermissionsByCategory(category: PermissionCategory): Permission[] {
    return this.adminService.permissions().filter(p => p.category === category);
  }

  hasPermission(role: Role, permission: Permission): boolean {
    return role.permissions.some(p => p.id === permission.id);
  }

  hasPermissionsInCategory(role: Role, category: PermissionCategory): boolean {
    return role.permissions.some(p => p.category === category);
  }

  getRolePermissionsByCategory(role: Role, category: PermissionCategory): Permission[] {
    return role.permissions.filter(p => p.category === category);
  }

  togglePermission(role: Role, permission: Permission): void {
    if (role.type === 'system') return;

    const currentPermissions = [...role.permissions];
    const index = currentPermissions.findIndex(p => p.id === permission.id);

    if (index > -1) {
      currentPermissions.splice(index, 1);
    } else {
      currentPermissions.push(permission);
    }

    this.adminService.updateRole(role.id, { permissions: currentPermissions });
    this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Permission updated' });
  }

  viewRole(role: Role): void {
    this.selectedRole.set(role);
    this.showDetailModal.set(true);
  }

  closeDetailModal(): void {
    this.showDetailModal.set(false);
    this.selectedRole.set(null);
  }

  openCreateModal(): void {
    this.editingRole.set(null);
    this.roleForm.reset({ isDefault: false });
    this.selectedPermissions.set([]);
    this.expandedCategories.set([]);
    this.showRoleModal.set(true);
  }

  editRole(role: Role): void {
    this.editingRole.set(role);
    this.roleForm.patchValue({
      name: role.name,
      description: role.description,
      isDefault: role.isDefault
    });
    this.selectedPermissions.set(role.permissions.map(p => p.id));
    this.expandedCategories.set([]);
    this.showDetailModal.set(false);
    this.showRoleModal.set(true);
  }

  closeRoleModal(): void {
    this.showRoleModal.set(false);
    this.editingRole.set(null);
  }

  toggleCategory(category: PermissionCategory): void {
    const current = this.expandedCategories();
    if (current.includes(category)) {
      this.expandedCategories.set(current.filter(c => c !== category));
    } else {
      this.expandedCategories.set([...current, category]);
    }
  }

  getSelectedCount(category: PermissionCategory): number {
    const categoryPermissions = this.getPermissionsByCategory(category);
    return categoryPermissions.filter(p => this.selectedPermissions().includes(p.id)).length;
  }

  toggleFormPermission(permissionId: string): void {
    const current = this.selectedPermissions();
    if (current.includes(permissionId)) {
      this.selectedPermissions.set(current.filter(id => id !== permissionId));
    } else {
      this.selectedPermissions.set([...current, permissionId]);
    }
  }

  saveRole(): void {
    if (this.roleForm.valid) {
      const formValue = this.roleForm.value;
      const permissions = this.adminService.permissions()
        .filter(p => this.selectedPermissions().includes(p.id));

      if (this.editingRole()) {
        this.adminService.updateRole(this.editingRole()!.id, {
          ...formValue,
          permissions
        });
        this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Role updated successfully' });
      } else {
        this.adminService.createRole({
          ...formValue,
          permissions
        });
        this.messageService.add({ severity: 'success', summary: 'Created', detail: 'Role created successfully' });
      }

      this.closeRoleModal();
    }
  }

  deleteRole(role: Role): void {
    if (role.userCount > 0) {
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Cannot Delete', 
        detail: `Role "${role.name}" has ${role.userCount} users assigned` 
      });
      return;
    }

    this.adminService.deleteRole(role.id);
    this.messageService.add({ severity: 'warn', summary: 'Deleted', detail: `Role "${role.name}" deleted` });
  }
}
