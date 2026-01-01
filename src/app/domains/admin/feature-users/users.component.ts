import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService } from '../data-access/services/admin.service';
import { User, UserStatus, UserType } from '../data-access/models/admin.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="users-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="title-section">
            <h1>User Management</h1>
            <p class="subtitle">Manage user accounts, roles, and permissions</p>
          </div>
          <div class="header-actions">
            <button class="btn btn-secondary" (click)="exportUsers()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export
            </button>
            <button class="btn btn-primary" (click)="openCreateModal()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add User
            </button>
          </div>
        </div>
      </header>

      <!-- Stats Cards -->
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon total">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ adminService.totalUsers() }}</span>
            <span class="stat-label">Total Users</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ adminService.usersByStatus().active }}</span>
            <span class="stat-label">Active</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon pending">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ adminService.usersByStatus().pending }}</span>
            <span class="stat-label">Pending</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon locked">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ adminService.usersByStatus().locked }}</span>
            <span class="stat-label">Locked</span>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input 
            type="text" 
            placeholder="Search users..."
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
          />
        </div>
        <div class="filter-group">
          <select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event)">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
            <option value="locked">Locked</option>
            <option value="suspended">Suspended</option>
          </select>
          <select [ngModel]="typeFilter()" (ngModelChange)="typeFilter.set($event)">
            <option value="all">All Types</option>
            <option value="provider">Provider</option>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
          <select [ngModel]="departmentFilter()" (ngModelChange)="departmentFilter.set($event)">
            <option value="all">All Departments</option>
            @for (dept of departments; track dept) {
              <option [value]="dept">{{ dept }}</option>
            }
          </select>
        </div>
      </div>

      <!-- Users Table -->
      <div class="users-table-container">
        <table class="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Type</th>
              <th>Department</th>
              <th>Roles</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>MFA</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (user of filteredUsers(); track user.id) {
              <tr [class.inactive]="user.status !== 'active'">
                <td>
                  <div class="user-info">
                    <div class="user-avatar" [class]="user.type">
                      {{ getInitials(user.fullName) }}
                    </div>
                    <div class="user-details">
                      <span class="user-name">{{ user.fullName }}</span>
                      <span class="user-email">{{ user.email }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="type-badge" [class]="user.type">
                    {{ formatType(user.type) }}
                  </span>
                </td>
                <td>{{ user.department || '—' }}</td>
                <td>
                  <div class="roles-list">
                    @for (role of user.roles.slice(0, 2); track role) {
                      <span class="role-chip">{{ formatRole(role) }}</span>
                    }
                    @if (user.roles.length > 2) {
                      <span class="role-chip more">+{{ user.roles.length - 2 }}</span>
                    }
                  </div>
                </td>
                <td>
                  <span class="status-badge" [class]="user.status">
                    {{ formatStatus(user.status) }}
                  </span>
                </td>
                <td>
                  @if (user.lastLogin) {
                    <span class="last-login">{{ formatDate(user.lastLogin) }}</span>
                  } @else {
                    <span class="never">Never</span>
                  }
                </td>
                <td>
                  @if (user.mfaEnabled) {
                    <span class="mfa-badge enabled">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      </svg>
                      On
                    </span>
                  } @else {
                    <span class="mfa-badge disabled">Off</span>
                  }
                </td>
                <td>
                  <div class="action-buttons">
                    <button class="btn-icon" (click)="viewUser(user)" title="View">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </button>
                    <button class="btn-icon" (click)="editUser(user)" title="Edit">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    @if (user.status === 'locked') {
                      <button class="btn-icon unlock" (click)="unlockUser(user)" title="Unlock">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
                        </svg>
                      </button>
                    }
                    <button class="btn-icon" (click)="resetPassword(user)" title="Reset Password">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </button>
                    <button class="btn-icon danger" (click)="deleteUser(user)" title="Delete">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="8">
                  <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <line x1="17" y1="11" x2="23" y2="11"/>
                    </svg>
                    <h3>No users found</h3>
                    <p>Try adjusting your filters or add a new user</p>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <span class="page-info">Showing {{ filteredUsers().length }} of {{ adminService.totalUsers() }} users</span>
      </div>

      <!-- Create/Edit User Modal -->
      @if (showUserModal()) {
        <div class="modal-overlay" (click)="closeUserModal()">
          <div class="modal user-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ editingUser() ? 'Edit User' : 'Create User' }}</h2>
              <button class="btn-close" (click)="closeUserModal()">×</button>
            </div>
            <div class="modal-body">
              <form [formGroup]="userForm">
                <div class="form-section">
                  <h3>Basic Information</h3>
                  <div class="form-row">
                    <div class="form-group">
                      <label for="firstName">First Name *</label>
                      <input id="firstName" type="text" formControlName="firstName" />
                    </div>
                    <div class="form-group">
                      <label for="lastName">Last Name *</label>
                      <input id="lastName" type="text" formControlName="lastName" />
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label for="email">Email *</label>
                      <input id="email" type="email" formControlName="email" />
                    </div>
                    <div class="form-group">
                      <label for="username">Username *</label>
                      <input id="username" type="text" formControlName="username" />
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label for="phone">Phone</label>
                      <input id="phone" type="tel" formControlName="phone" />
                    </div>
                    <div class="form-group">
                      <label for="title">Title</label>
                      <input id="title" type="text" formControlName="title" />
                    </div>
                  </div>
                </div>

                <div class="form-section">
                  <h3>Role & Access</h3>
                  <div class="form-row">
                    <div class="form-group">
                      <label for="type">User Type *</label>
                      <select id="type" formControlName="type">
                        <option value="provider">Provider</option>
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label for="department">Department</label>
                      <select id="department" formControlName="department">
                        <option value="">Select Department</option>
                        @for (dept of departments; track dept) {
                          <option [value]="dept">{{ dept }}</option>
                        }
                      </select>
                    </div>
                  </div>
                  <div class="form-group">
                    <label>Roles *</label>
                    <div class="checkbox-group">
                      @for (role of availableRoles; track role.id) {
                        <label class="checkbox-item">
                          <input 
                            type="checkbox" 
                            [checked]="selectedRoles().includes(role.id)"
                            (change)="toggleRole(role.id)"
                          />
                          <span>{{ role.name }}</span>
                        </label>
                      }
                    </div>
                  </div>
                </div>

                @if (userForm.get('type')?.value === 'provider') {
                  <div class="form-section">
                    <h3>Provider Information</h3>
                    <div class="form-row">
                      <div class="form-group">
                        <label for="npi">NPI</label>
                        <input id="npi" type="text" formControlName="npi" />
                      </div>
                      <div class="form-group">
                        <label for="specialty">Specialty</label>
                        <input id="specialty" type="text" formControlName="specialty" />
                      </div>
                    </div>
                    <div class="form-row">
                      <div class="form-group">
                        <label for="licenseNumber">License Number</label>
                        <input id="licenseNumber" type="text" formControlName="licenseNumber" />
                      </div>
                      <div class="form-group">
                        <label for="licenseState">License State</label>
                        <input id="licenseState" type="text" formControlName="licenseState" maxlength="2" />
                      </div>
                    </div>
                  </div>
                }

                <div class="form-section">
                  <h3>Security</h3>
                  <div class="form-group">
                    <label class="checkbox-item">
                      <input type="checkbox" formControlName="mfaEnabled" />
                      <span>Require Multi-Factor Authentication</span>
                    </label>
                  </div>
                  @if (!editingUser()) {
                    <div class="form-group">
                      <label class="checkbox-item">
                        <input type="checkbox" formControlName="sendWelcomeEmail" />
                        <span>Send welcome email with login instructions</span>
                      </label>
                    </div>
                  }
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeUserModal()">Cancel</button>
              <button 
                class="btn btn-primary" 
                (click)="saveUser()"
                [disabled]="userForm.invalid || selectedRoles().length === 0"
              >
                {{ editingUser() ? 'Update' : 'Create' }} User
              </button>
            </div>
          </div>
        </div>
      }

      <!-- View User Modal -->
      @if (showViewModal()) {
        <div class="modal-overlay" (click)="closeViewModal()">
          <div class="modal view-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="user-header-info">
                <div class="user-avatar large" [class]="viewingUser()!.type">
                  {{ getInitials(viewingUser()!.fullName) }}
                </div>
                <div>
                  <h2>{{ viewingUser()!.fullName }}</h2>
                  <p>{{ viewingUser()!.email }}</p>
                </div>
              </div>
              <button class="btn-close" (click)="closeViewModal()">×</button>
            </div>
            <div class="modal-body">
              <div class="detail-grid">
                <div class="detail-item">
                  <label>Username</label>
                  <span>{{ viewingUser()!.username }}</span>
                </div>
                <div class="detail-item">
                  <label>Type</label>
                  <span class="type-badge" [class]="viewingUser()!.type">
                    {{ formatType(viewingUser()!.type) }}
                  </span>
                </div>
                <div class="detail-item">
                  <label>Status</label>
                  <span class="status-badge" [class]="viewingUser()!.status">
                    {{ formatStatus(viewingUser()!.status) }}
                  </span>
                </div>
                <div class="detail-item">
                  <label>Department</label>
                  <span>{{ viewingUser()!.department || '—' }}</span>
                </div>
                <div class="detail-item">
                  <label>Title</label>
                  <span>{{ viewingUser()!.title || '—' }}</span>
                </div>
                <div class="detail-item">
                  <label>Phone</label>
                  <span>{{ viewingUser()!.phone || '—' }}</span>
                </div>
                @if (viewingUser()!.type === 'provider') {
                  <div class="detail-item">
                    <label>NPI</label>
                    <span>{{ viewingUser()!.npi || '—' }}</span>
                  </div>
                  <div class="detail-item">
                    <label>Specialty</label>
                    <span>{{ viewingUser()!.specialty || '—' }}</span>
                  </div>
                }
                <div class="detail-item">
                  <label>Last Login</label>
                  <span>{{ viewingUser()!.lastLogin ? formatDateTime(viewingUser()!.lastLogin!) : 'Never' }}</span>
                </div>
                <div class="detail-item">
                  <label>MFA</label>
                  <span>{{ viewingUser()!.mfaEnabled ? 'Enabled (' + viewingUser()!.mfaMethod + ')' : 'Disabled' }}</span>
                </div>
                <div class="detail-item">
                  <label>Created</label>
                  <span>{{ formatDateTime(viewingUser()!.createdAt) }}</span>
                </div>
                <div class="detail-item">
                  <label>Last Updated</label>
                  <span>{{ formatDateTime(viewingUser()!.updatedAt) }}</span>
                </div>
              </div>

              <div class="detail-section">
                <label>Roles</label>
                <div class="roles-display">
                  @for (role of viewingUser()!.roles; track role) {
                    <span class="role-chip">{{ formatRole(role) }}</span>
                  }
                </div>
              </div>

              @if (viewingUser()!.credentials?.length) {
                <div class="detail-section">
                  <label>Credentials</label>
                  <div class="credentials-display">
                    @for (cred of viewingUser()!.credentials; track cred) {
                      <span class="credential-badge">{{ cred }}</span>
                    }
                  </div>
                </div>
              }
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeViewModal()">Close</button>
              <button class="btn btn-primary" (click)="editUser(viewingUser()!)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit User
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .users-container {
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

    .header-actions {
      display: flex;
      gap: 0.75rem;
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

    .btn-secondary:hover {
      background: #e2e8f0;
    }

    .btn svg {
      width: 1rem;
      height: 1rem;
    }

    .btn-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      padding: 0;
      border: none;
      background: transparent;
      color: #64748b;
      border-radius: 0.375rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-icon:hover {
      background: #f1f5f9;
      color: #3b82f6;
    }

    .btn-icon.unlock:hover {
      background: #dcfce7;
      color: #16a34a;
    }

    .btn-icon.danger:hover {
      background: #fef2f2;
      color: #ef4444;
    }

    .btn-icon svg {
      width: 1rem;
      height: 1rem;
    }

    /* Stats Cards */
    .stats-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
    }

    .stat-icon {
      width: 3rem;
      height: 3rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.75rem;
    }

    .stat-icon svg {
      width: 1.5rem;
      height: 1.5rem;
    }

    .stat-icon.total { background: #dbeafe; color: #3b82f6; }
    .stat-icon.active { background: #dcfce7; color: #16a34a; }
    .stat-icon.pending { background: #fef3c7; color: #d97706; }
    .stat-icon.locked { background: #fee2e2; color: #dc2626; }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
    }

    .stat-label {
      font-size: 0.75rem;
      color: #64748b;
    }

    /* Filters */
    .filters-bar {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .search-box {
      position: relative;
      flex: 1;
      min-width: 250px;
    }

    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      width: 1rem;
      height: 1rem;
      color: #94a3b8;
    }

    .search-box input {
      width: 100%;
      padding: 0.5rem 0.75rem 0.5rem 2.25rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.875rem;
    }

    .search-box input:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .filter-group {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .filter-group select {
      padding: 0.5rem 2rem 0.5rem 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      background: white;
      cursor: pointer;
    }

    /* Table */
    .users-table-container {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      overflow: hidden;
    }

    .users-table {
      width: 100%;
      border-collapse: collapse;
    }

    .users-table th {
      padding: 0.75rem 1rem;
      text-align: left;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }

    .users-table td {
      padding: 0.75rem 1rem;
      font-size: 0.875rem;
      color: #1e293b;
      border-bottom: 1px solid #e2e8f0;
    }

    .users-table tr:last-child td {
      border-bottom: none;
    }

    .users-table tr.inactive {
      opacity: 0.7;
    }

    .users-table tr:hover {
      background: #f8fafc;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .user-avatar {
      width: 2.5rem;
      height: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-size: 0.875rem;
      font-weight: 600;
      color: white;
    }

    .user-avatar.provider { background: #3b82f6; }
    .user-avatar.staff { background: #8b5cf6; }
    .user-avatar.admin { background: #dc2626; }
    .user-avatar.patient { background: #16a34a; }

    .user-avatar.large {
      width: 4rem;
      height: 4rem;
      font-size: 1.25rem;
    }

    .user-details {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-weight: 500;
    }

    .user-email {
      font-size: 0.75rem;
      color: #64748b;
    }

    .type-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .type-badge.provider { background: #dbeafe; color: #1d4ed8; }
    .type-badge.staff { background: #f3e8ff; color: #7c3aed; }
    .type-badge.admin { background: #fee2e2; color: #dc2626; }

    .roles-list {
      display: flex;
      gap: 0.25rem;
      flex-wrap: wrap;
    }

    .role-chip {
      padding: 0.125rem 0.375rem;
      background: #f1f5f9;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      color: #475569;
    }

    .role-chip.more {
      background: #e2e8f0;
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-badge.active { background: #dcfce7; color: #16a34a; }
    .status-badge.inactive { background: #f1f5f9; color: #64748b; }
    .status-badge.pending { background: #fef3c7; color: #d97706; }
    .status-badge.locked { background: #fee2e2; color: #dc2626; }
    .status-badge.suspended { background: #fce7f3; color: #db2777; }

    .last-login {
      font-size: 0.8125rem;
      color: #64748b;
    }

    .never {
      color: #94a3b8;
      font-style: italic;
    }

    .mfa-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .mfa-badge svg {
      width: 0.75rem;
      height: 0.75rem;
    }

    .mfa-badge.enabled {
      background: #dcfce7;
      color: #16a34a;
    }

    .mfa-badge.disabled {
      background: #f1f5f9;
      color: #94a3b8;
    }

    .action-buttons {
      display: flex;
      gap: 0.25rem;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 2rem;
      text-align: center;
    }

    .empty-state svg {
      width: 3rem;
      height: 3rem;
      color: #94a3b8;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      margin: 0 0 0.5rem;
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
    }

    .empty-state p {
      margin: 0;
      font-size: 0.875rem;
      color: #64748b;
    }

    /* Pagination */
    .pagination {
      display: flex;
      justify-content: center;
      padding: 1rem;
    }

    .page-info {
      font-size: 0.875rem;
      color: #64748b;
    }

    /* Modals */
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

    .user-modal {
      max-width: 600px;
    }

    .view-modal {
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

    .user-header-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-header-info h2 {
      margin: 0;
    }

    .user-header-info p {
      margin: 0.25rem 0 0;
      color: #64748b;
      font-size: 0.875rem;
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
    .form-section {
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .form-section:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }

    .form-section h3 {
      margin: 0 0 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #1e293b;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group label:not(.checkbox-item) {
      display: block;
      margin-bottom: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }

    .form-group input,
    .form-group select {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.875rem;
    }

    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .checkbox-group {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
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

    /* Detail Grid */
    .detail-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .detail-item label {
      font-size: 0.75rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .detail-item span {
      font-size: 0.875rem;
      color: #1e293b;
    }

    .detail-section {
      margin-bottom: 1rem;
    }

    .detail-section label {
      display: block;
      font-size: 0.75rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }

    .roles-display,
    .credentials-display {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .credential-badge {
      padding: 0.25rem 0.5rem;
      background: #dbeafe;
      color: #1d4ed8;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        align-items: stretch;
      }

      .header-actions {
        justify-content: flex-end;
      }

      .stats-cards {
        grid-template-columns: repeat(2, 1fr);
      }

      .filters-bar {
        flex-direction: column;
      }

      .users-table-container {
        overflow-x: auto;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .checkbox-group {
        grid-template-columns: 1fr;
      }

      .detail-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class UsersComponent {
  adminService = inject(AdminService);
  private fb = inject(FormBuilder);

  // Filters
  searchQuery = signal('');
  statusFilter = signal<'all' | UserStatus>('all');
  typeFilter = signal<'all' | UserType>('all');
  departmentFilter = signal('all');

  // Modal state
  showUserModal = signal(false);
  showViewModal = signal(false);
  editingUser = signal<User | null>(null);
  viewingUser = signal<User | null>(null);

  // Role selection
  selectedRoles = signal<string[]>([]);

  // Static data
  departments = ['Internal Medicine', 'Cardiology', 'Nursing', 'Administration', 'Billing', 'Front Desk', 'IT'];
  
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
    
    if (this.statusFilter() !== 'all') {
      users = users.filter(u => u.status === this.statusFilter());
    }
    
    if (this.typeFilter() !== 'all') {
      users = users.filter(u => u.type === this.typeFilter());
    }
    
    if (this.departmentFilter() !== 'all') {
      users = users.filter(u => u.department === this.departmentFilter());
    }
    
    return users.sort((a, b) => a.fullName.localeCompare(b.fullName));
  });

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
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
    
    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
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

  openCreateModal(): void {
    this.editingUser.set(null);
    this.selectedRoles.set([]);
    this.userForm.reset({
      type: 'staff',
      mfaEnabled: false,
      sendWelcomeEmail: true
    });
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
      } else {
        this.adminService.createUser(userData);
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
    if (confirm(`Unlock user "${user.fullName}"?`)) {
      this.adminService.unlockUser(user.id);
    }
  }

  resetPassword(user: User): void {
    if (confirm(`Send password reset email to ${user.email}?`)) {
      this.adminService.resetPassword(user.id);
    }
  }

  deleteUser(user: User): void {
    if (confirm(`Are you sure you want to delete "${user.fullName}"? This action cannot be undone.`)) {
      this.adminService.deleteUser(user.id);
    }
  }

  exportUsers(): void {
    console.log('Exporting users...');
  }
}
