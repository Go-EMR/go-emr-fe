import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../data-access/services/admin.service';
import { Role, Permission, PermissionCategory, PermissionAction } from '../data-access/models/admin.model';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="roles-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="title-section">
            <h1>Roles & Permissions</h1>
            <p class="subtitle">Manage user roles and access permissions</p>
          </div>
          <div class="header-actions">
            <button class="btn btn-primary" (click)="openCreateModal()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Create Role
            </button>
          </div>
        </div>
      </header>

      <!-- Tabs -->
      <div class="tabs">
        <button 
          class="tab-btn"
          [class.active]="activeTab() === 'roles'"
          (click)="activeTab.set('roles')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"/>
          </svg>
          Roles
        </button>
        <button 
          class="tab-btn"
          [class.active]="activeTab() === 'matrix'"
          (click)="activeTab.set('matrix')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
          Permission Matrix
        </button>
      </div>

      <!-- Roles List -->
      @if (activeTab() === 'roles') {
        <div class="roles-grid">
          @for (role of adminService.roles(); track role.id) {
            <div class="role-card" [class.system]="role.type === 'system'">
              <div class="role-header">
                <div class="role-info">
                  <h3>{{ role.name }}</h3>
                  <p>{{ role.description }}</p>
                </div>
                <div class="role-badges">
                  @if (role.type === 'system') {
                    <span class="badge system">System</span>
                  }
                  @if (role.isDefault) {
                    <span class="badge default">Default</span>
                  }
                </div>
              </div>
              <div class="role-stats">
                <div class="stat">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                  </svg>
                  <span>{{ role.userCount }} users</span>
                </div>
                <div class="stat">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  <span>{{ role.permissions.length }} permissions</span>
                </div>
              </div>
              <div class="role-actions">
                <button class="btn btn-secondary btn-sm" (click)="viewRole(role)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  View
                </button>
                <button 
                  class="btn btn-secondary btn-sm" 
                  (click)="editRole(role)"
                  [disabled]="role.type === 'system'"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit
                </button>
                @if (role.type !== 'system') {
                  <button class="btn btn-danger btn-sm" (click)="deleteRole(role)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- Permission Matrix -->
      @if (activeTab() === 'matrix') {
        <div class="matrix-container">
          <div class="matrix-filters">
            <select [ngModel]="categoryFilter()" (ngModelChange)="categoryFilter.set($event)">
              <option value="all">All Categories</option>
              <option value="patients">Patients</option>
              <option value="appointments">Appointments</option>
              <option value="encounters">Encounters</option>
              <option value="billing">Billing</option>
              <option value="reports">Reports</option>
              <option value="messaging">Messaging</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <div class="matrix-table-wrapper">
            <table class="matrix-table">
              <thead>
                <tr>
                  <th class="permission-col">Permission</th>
                  @for (role of adminService.roles(); track role.id) {
                    <th class="role-col">
                      <div class="role-header-cell">
                        <span>{{ role.name }}</span>
                        @if (role.type === 'system') {
                          <span class="badge-small">System</span>
                        }
                      </div>
                    </th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (category of permissionCategories; track category) {
                  @if (categoryFilter() === 'all' || categoryFilter() === category) {
                    <tr class="category-row">
                      <td [attr.colspan]="adminService.roles().length + 1">
                        {{ formatCategory(category) }}
                      </td>
                    </tr>
                    @for (permission of getPermissionsByCategory(category); track permission.id) {
                      <tr>
                        <td class="permission-cell">
                          <div class="permission-info">
                            <span class="permission-name">{{ permission.name }}</span>
                            <span class="permission-desc">{{ permission.description }}</span>
                          </div>
                        </td>
                        @for (role of adminService.roles(); track role.id) {
                          <td class="check-cell">
                            <label class="matrix-checkbox">
                              <input 
                                type="checkbox" 
                                [checked]="hasPermission(role, permission)"
                                [disabled]="role.type === 'system'"
                                (change)="togglePermission(role, permission)"
                              />
                              <span class="checkmark">
                                @if (hasPermission(role, permission)) {
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                    <polyline points="20 6 9 17 4 12"/>
                                  </svg>
                                }
                              </span>
                            </label>
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

      <!-- Role Modal -->
      @if (showRoleModal()) {
        <div class="modal-overlay" (click)="closeRoleModal()">
          <div class="modal role-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ editingRole() ? 'Edit Role' : 'Create Role' }}</h2>
              <button class="btn-close" (click)="closeRoleModal()">×</button>
            </div>
            <div class="modal-body">
              <form [formGroup]="roleForm">
                <div class="form-group">
                  <label for="name">Role Name *</label>
                  <input id="name" type="text" formControlName="name" placeholder="Enter role name" />
                </div>
                
                <div class="form-group">
                  <label for="description">Description</label>
                  <textarea id="description" formControlName="description" placeholder="Describe this role" rows="3"></textarea>
                </div>

                <div class="form-group checkbox-group">
                  <label class="checkbox-item">
                    <input type="checkbox" formControlName="isDefault" />
                    <span>Set as default role for new users</span>
                  </label>
                </div>

                <div class="permissions-section">
                  <h3>Permissions</h3>
                  @for (category of permissionCategories; track category) {
                    <div class="permission-category">
                      <div class="category-header" (click)="toggleCategory(category)">
                        <svg 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          stroke-width="2"
                          [class.expanded]="expandedCategories().includes(category)"
                        >
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                        <span>{{ formatCategory(category) }}</span>
                        <span class="selected-count">
                          {{ getSelectedCount(category) }}/{{ getPermissionsByCategory(category).length }}
                        </span>
                      </div>
                      @if (expandedCategories().includes(category)) {
                        <div class="category-permissions">
                          @for (permission of getPermissionsByCategory(category); track permission.id) {
                            <label class="permission-checkbox">
                              <input 
                                type="checkbox" 
                                [checked]="selectedPermissions().includes(permission.id)"
                                (change)="toggleFormPermission(permission.id)"
                              />
                              <div class="permission-label">
                                <span class="name">{{ permission.name }}</span>
                                <span class="desc">{{ permission.description }}</span>
                              </div>
                            </label>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeRoleModal()">Cancel</button>
              <button 
                class="btn btn-primary" 
                (click)="saveRole()"
                [disabled]="roleForm.invalid"
              >
                {{ editingRole() ? 'Update' : 'Create' }} Role
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Role Detail Modal -->
      @if (showDetailModal()) {
        <div class="modal-overlay" (click)="closeDetailModal()">
          <div class="modal detail-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="header-info">
                <h2>{{ selectedRole()!.name }}</h2>
                @if (selectedRole()!.type === 'system') {
                  <span class="badge system">System Role</span>
                }
              </div>
              <button class="btn-close" (click)="closeDetailModal()">×</button>
            </div>
            <div class="modal-body">
              <p class="role-description">{{ selectedRole()!.description }}</p>
              
              <div class="detail-stats">
                <div class="stat-item">
                  <label>Users</label>
                  <span>{{ selectedRole()!.userCount }}</span>
                </div>
                <div class="stat-item">
                  <label>Created</label>
                  <span>{{ formatDate(selectedRole()!.createdAt) }}</span>
                </div>
                <div class="stat-item">
                  <label>Last Updated</label>
                  <span>{{ formatDate(selectedRole()!.updatedAt) }}</span>
                </div>
              </div>

              <div class="permissions-list">
                <h3>Permissions ({{ selectedRole()!.permissions.length }})</h3>
                @for (category of permissionCategories; track category) {
                  @if (hasPermissionsInCategory(selectedRole()!, category)) {
                    <div class="category-group">
                      <h4>{{ formatCategory(category) }}</h4>
                      <div class="permission-chips">
                        @for (permission of getRolePermissionsByCategory(selectedRole()!, category); track permission.id) {
                          <span class="permission-chip">{{ permission.name }}</span>
                        }
                      </div>
                    </div>
                  }
                }
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeDetailModal()">Close</button>
              @if (selectedRole()!.type !== 'system') {
                <button class="btn btn-primary" (click)="editRole(selectedRole()!)">
                  Edit Role
                </button>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .roles-container {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Header */
    .page-header {
      margin-bottom: 1.5rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
    }

    .title-section h1 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 600;
      color: #1e293b;
    }

    .subtitle {
      margin: 0.25rem 0 0;
      color: #64748b;
      font-size: 0.875rem;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-primary:disabled {
      background: #94a3b8;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #e2e8f0;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #e2e8f0;
    }

    .btn-secondary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-danger {
      background: #fee2e2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    .btn-danger:hover {
      background: #fecaca;
    }

    .btn svg {
      width: 1rem;
      height: 1rem;
    }

    /* Tabs */
    .tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border: none;
      background: transparent;
      font-size: 0.875rem;
      font-weight: 500;
      color: #64748b;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      transition: all 0.2s;
    }

    .tab-btn:hover {
      color: #3b82f6;
    }

    .tab-btn.active {
      color: #3b82f6;
      border-bottom-color: #3b82f6;
    }

    .tab-btn svg {
      width: 1rem;
      height: 1rem;
    }

    /* Roles Grid */
    .roles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1rem;
    }

    .role-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .role-card.system {
      border-color: #dbeafe;
      background: #f8fafc;
    }

    .role-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
    }

    .role-info h3 {
      margin: 0 0 0.25rem;
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
    }

    .role-info p {
      margin: 0;
      font-size: 0.8125rem;
      color: #64748b;
    }

    .role-badges {
      display: flex;
      gap: 0.25rem;
    }

    .badge {
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .badge.system {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .badge.default {
      background: #dcfce7;
      color: #16a34a;
    }

    .role-stats {
      display: flex;
      gap: 1.5rem;
    }

    .role-stats .stat {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.8125rem;
      color: #64748b;
    }

    .role-stats .stat svg {
      width: 1rem;
      height: 1rem;
    }

    .role-actions {
      display: flex;
      gap: 0.5rem;
      padding-top: 0.75rem;
      border-top: 1px solid #e2e8f0;
    }

    /* Matrix */
    .matrix-container {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      overflow: hidden;
    }

    .matrix-filters {
      padding: 1rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .matrix-filters select {
      padding: 0.5rem 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.875rem;
    }

    .matrix-table-wrapper {
      overflow-x: auto;
    }

    .matrix-table {
      width: 100%;
      border-collapse: collapse;
    }

    .matrix-table th {
      padding: 0.75rem 1rem;
      text-align: center;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      white-space: nowrap;
    }

    .matrix-table th.permission-col {
      text-align: left;
      min-width: 250px;
    }

    .matrix-table th.role-col {
      min-width: 100px;
    }

    .role-header-cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
    }

    .badge-small {
      padding: 0.125rem 0.375rem;
      background: #dbeafe;
      color: #1d4ed8;
      border-radius: 0.25rem;
      font-size: 0.5rem;
    }

    .matrix-table td {
      padding: 0.5rem 1rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .category-row td {
      background: #f1f5f9;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .permission-cell {
      vertical-align: middle;
    }

    .permission-info {
      display: flex;
      flex-direction: column;
    }

    .permission-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: #1e293b;
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
      display: inline-flex;
      cursor: pointer;
    }

    .matrix-checkbox input {
      display: none;
    }

    .checkmark {
      width: 1.25rem;
      height: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #e2e8f0;
      border-radius: 0.25rem;
      background: white;
      transition: all 0.2s;
    }

    .matrix-checkbox input:checked + .checkmark {
      background: #3b82f6;
      border-color: #3b82f6;
    }

    .checkmark svg {
      width: 0.75rem;
      height: 0.75rem;
      color: white;
    }

    .matrix-checkbox input:disabled + .checkmark {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal {
      background: white;
      border-radius: 0.75rem;
      width: 100%;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .role-modal {
      max-width: 600px;
    }

    .detail-modal {
      max-width: 700px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
    }

    .header-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .btn-close {
      width: 2rem;
      height: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      font-size: 1.5rem;
      color: #64748b;
      cursor: pointer;
      border-radius: 0.375rem;
    }

    .btn-close:hover {
      background: #f1f5f9;
    }

    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid #e2e8f0;
    }

    /* Form Styles */
    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }

    .form-group input,
    .form-group textarea {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-family: inherit;
    }

    .form-group input:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .checkbox-group {
      margin-top: 0.5rem;
    }

    .checkbox-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #475569;
      cursor: pointer;
    }

    .checkbox-item input[type="checkbox"] {
      width: 1rem;
      height: 1rem;
      accent-color: #3b82f6;
    }

    /* Permissions Section */
    .permissions-section {
      margin-top: 1.5rem;
    }

    .permissions-section h3 {
      margin: 0 0 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #64748b;
    }

    .permission-category {
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      margin-bottom: 0.5rem;
      overflow: hidden;
    }

    .category-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: #f8fafc;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      color: #1e293b;
    }

    .category-header:hover {
      background: #f1f5f9;
    }

    .category-header svg {
      width: 1rem;
      height: 1rem;
      color: #64748b;
      transition: transform 0.2s;
    }

    .category-header svg.expanded {
      transform: rotate(90deg);
    }

    .selected-count {
      margin-left: auto;
      font-size: 0.75rem;
      color: #64748b;
    }

    .category-permissions {
      padding: 0.75rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .permission-checkbox {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      cursor: pointer;
    }

    .permission-checkbox input[type="checkbox"] {
      margin-top: 0.25rem;
      width: 1rem;
      height: 1rem;
      accent-color: #3b82f6;
    }

    .permission-label {
      display: flex;
      flex-direction: column;
    }

    .permission-label .name {
      font-size: 0.875rem;
      font-weight: 500;
      color: #1e293b;
    }

    .permission-label .desc {
      font-size: 0.75rem;
      color: #64748b;
    }

    /* Detail Modal */
    .role-description {
      margin: 0 0 1.5rem;
      font-size: 0.875rem;
      color: #475569;
      line-height: 1.5;
    }

    .detail-stats {
      display: flex;
      gap: 2rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .stat-item label {
      font-size: 0.75rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-item span {
      font-size: 0.875rem;
      font-weight: 500;
      color: #1e293b;
    }

    .permissions-list h3 {
      margin: 0 0 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #64748b;
    }

    .category-group {
      margin-bottom: 1rem;
    }

    .category-group h4 {
      margin: 0 0 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .permission-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
    }

    .permission-chip {
      padding: 0.25rem 0.5rem;
      background: #f1f5f9;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      color: #475569;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        align-items: stretch;
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
  private fb = inject(FormBuilder);

  // State
  activeTab = signal<'roles' | 'matrix'>('roles');
  categoryFilter = signal<'all' | PermissionCategory>('all');

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

  roleForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    isDefault: [false]
  });

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
      } else {
        this.adminService.createRole({
          ...formValue,
          permissions
        });
      }

      this.closeRoleModal();
    }
  }

  deleteRole(role: Role): void {
    if (role.userCount > 0) {
      alert(`Cannot delete role "${role.name}" because it has ${role.userCount} users assigned.`);
      return;
    }
    
    if (confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      this.adminService.deleteRole(role.id);
    }
  }
}
