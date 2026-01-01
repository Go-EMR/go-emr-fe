import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../data-access/services/admin.service';
import { AuditLog, AuditAction, AuditSeverity, AuditFilter } from '../data-access/models/admin.model';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="audit-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="title-section">
            <h1>Audit Logs</h1>
            <p class="subtitle">Monitor system activity and security events</p>
          </div>
          <div class="header-actions">
            <button class="btn btn-secondary" (click)="exportLogs()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export
            </button>
            <button class="btn btn-primary" (click)="refreshLogs()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </header>

      <!-- Stats Summary -->
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon total">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ adminService.auditSummary().totalEvents }}</span>
            <span class="stat-label">Total Events</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon security">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ adminService.auditSummary().securityEvents }}</span>
            <span class="stat-label">Security Events</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon failed">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ adminService.auditSummary().failedEvents }}</span>
            <span class="stat-label">Failed Events</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon users">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ adminService.auditSummary().byUser.length }}</span>
            <span class="stat-label">Active Users</span>
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
            placeholder="Search events..."
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
          />
        </div>
        <div class="filter-group">
          <div class="date-range">
            <input 
              type="date" 
              [ngModel]="startDate()"
              (ngModelChange)="startDate.set($event)"
              placeholder="Start date"
            />
            <span>to</span>
            <input 
              type="date" 
              [ngModel]="endDate()"
              (ngModelChange)="endDate.set($event)"
              placeholder="End date"
            />
          </div>
          <select [ngModel]="actionFilter()" (ngModelChange)="actionFilter.set($event)">
            <option value="all">All Actions</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="create">Create</option>
            <option value="read">Read</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="export">Export</option>
            <option value="sign">Sign</option>
            <option value="security">Security</option>
          </select>
          <select [ngModel]="severityFilter()" (ngModelChange)="severityFilter.set($event)">
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select [ngModel]="moduleFilter()" (ngModelChange)="moduleFilter.set($event)">
            <option value="all">All Modules</option>
            <option value="auth">Authentication</option>
            <option value="patients">Patients</option>
            <option value="encounters">Encounters</option>
            <option value="prescriptions">Prescriptions</option>
            <option value="billing">Billing</option>
            <option value="reports">Reports</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div class="filter-actions">
          <button class="btn btn-secondary btn-sm" (click)="clearFilters()">
            Clear Filters
          </button>
        </div>
      </div>

      <!-- Logs Table -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Module</th>
              <th>Resource</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            @for (log of filteredLogs(); track log.id) {
              <tr [class.failed]="!log.success" [class.critical]="log.severity === 'critical'">
                <td>
                  <div class="timestamp">
                    <span class="date">{{ formatDate(log.timestamp) }}</span>
                    <span class="time">{{ formatTime(log.timestamp) }}</span>
                  </div>
                </td>
                <td>
                  <div class="user-info">
                    <span class="user-name">{{ log.userName }}</span>
                    <span class="user-type">{{ log.userType }}</span>
                  </div>
                </td>
                <td>
                  <span class="action-badge" [class]="log.action">
                    {{ formatAction(log.action) }}
                  </span>
                </td>
                <td>
                  <span class="module-badge" [class]="log.module">
                    {{ formatModule(log.module) }}
                  </span>
                </td>
                <td>
                  <div class="resource-info">
                    <span class="resource-name">{{ log.resource }}</span>
                    @if (log.resourceId) {
                      <span class="resource-id">{{ log.resourceId }}</span>
                    }
                  </div>
                </td>
                <td>
                  <span class="severity-badge" [class]="log.severity">
                    {{ log.severity | titlecase }}
                  </span>
                </td>
                <td>
                  @if (log.success) {
                    <span class="status-icon success">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                    </span>
                  } @else {
                    <span class="status-icon failed">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                    </span>
                  }
                </td>
                <td>
                  <button class="btn-icon" (click)="viewDetails(log)" title="View Details">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="8" class="empty-cell">
                  <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <p>No audit logs found</p>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <span class="page-info">
          Showing {{ (currentPage() - 1) * pageSize() + 1 }} to 
          {{ Math.min(currentPage() * pageSize(), filteredLogs().length) }} of 
          {{ filteredLogs().length }} entries
        </span>
        <div class="page-buttons">
          <button 
            class="btn btn-secondary btn-sm"
            [disabled]="currentPage() === 1"
            (click)="previousPage()"
          >
            Previous
          </button>
          <span class="page-number">Page {{ currentPage() }}</span>
          <button 
            class="btn btn-secondary btn-sm"
            [disabled]="currentPage() * pageSize() >= filteredLogs().length"
            (click)="nextPage()"
          >
            Next
          </button>
        </div>
      </div>

      <!-- Detail Modal -->
      @if (showDetailModal()) {
        <div class="modal-overlay" (click)="closeDetailModal()">
          <div class="modal detail-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Event Details</h2>
              <button class="btn-close" (click)="closeDetailModal()">×</button>
            </div>
            <div class="modal-body">
              @if (selectedLog()) {
                <div class="detail-header">
                  <span class="action-badge large" [class]="selectedLog()!.action">
                    {{ formatAction(selectedLog()!.action) }}
                  </span>
                  <span class="severity-badge large" [class]="selectedLog()!.severity">
                    {{ selectedLog()!.severity | titlecase }}
                  </span>
                  @if (selectedLog()!.success) {
                    <span class="status-badge success">Success</span>
                  } @else {
                    <span class="status-badge failed">Failed</span>
                  }
                </div>

                <p class="event-description">{{ selectedLog()!.description }}</p>

                <div class="detail-grid">
                  <div class="detail-item">
                    <label>Timestamp</label>
                    <span>{{ formatDateTime(selectedLog()!.timestamp) }}</span>
                  </div>
                  <div class="detail-item">
                    <label>User</label>
                    <span>{{ selectedLog()!.userName }} ({{ selectedLog()!.userType }})</span>
                  </div>
                  <div class="detail-item">
                    <label>Module</label>
                    <span>{{ formatModule(selectedLog()!.module) }}</span>
                  </div>
                  <div class="detail-item">
                    <label>Resource</label>
                    <span>{{ selectedLog()!.resource }}</span>
                  </div>
                  @if (selectedLog()!.resourceId) {
                    <div class="detail-item">
                      <label>Resource ID</label>
                      <span class="mono">{{ selectedLog()!.resourceId }}</span>
                    </div>
                  }
                  <div class="detail-item">
                    <label>Session ID</label>
                    <span class="mono">{{ selectedLog()!.sessionId }}</span>
                  </div>
                  <div class="detail-item">
                    <label>IP Address</label>
                    <span class="mono">{{ selectedLog()!.ipAddress }}</span>
                  </div>
                  <div class="detail-item full-width">
                    <label>User Agent</label>
                    <span class="mono small">{{ selectedLog()!.userAgent }}</span>
                  </div>
                </div>

                @if (selectedLog()!.errorMessage) {
                  <div class="error-section">
                    <label>Error Message</label>
                    <div class="error-message">{{ selectedLog()!.errorMessage }}</div>
                  </div>
                }

                @if (selectedLog()!.changes && selectedLog()!.changes!.length > 0) {
                  <div class="changes-section">
                    <label>Changes</label>
                    <table class="changes-table">
                      <thead>
                        <tr>
                          <th>Field</th>
                          <th>Old Value</th>
                          <th>New Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (change of selectedLog()!.changes; track change.field) {
                          <tr>
                            <td>{{ change.fieldLabel }}</td>
                            <td class="old-value">{{ change.oldValue }}</td>
                            <td class="new-value">{{ change.newValue }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                }
              }
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeDetailModal()">Close</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .audit-container {
      padding: 1.5rem;
      max-width: 1600px;
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

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
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
    .stat-icon.security { background: #fef3c7; color: #d97706; }
    .stat-icon.failed { background: #fee2e2; color: #dc2626; }
    .stat-icon.users { background: #dcfce7; color: #16a34a; }

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
      align-items: flex-start;
    }

    .search-box {
      position: relative;
      min-width: 200px;
      flex: 1;
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

    .date-range {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .date-range input {
      padding: 0.5rem 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.875rem;
    }

    .date-range span {
      color: #64748b;
      font-size: 0.875rem;
    }

    .filter-group select {
      padding: 0.5rem 2rem 0.5rem 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      background: white;
      cursor: pointer;
    }

    .filter-actions {
      margin-left: auto;
    }

    /* Table */
    .table-container {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      overflow: hidden;
      margin-bottom: 1rem;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th {
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

    .data-table td {
      padding: 0.75rem 1rem;
      font-size: 0.875rem;
      color: #1e293b;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: middle;
    }

    .data-table tr:last-child td {
      border-bottom: none;
    }

    .data-table tr:hover {
      background: #f8fafc;
    }

    .data-table tr.failed {
      background: #fef2f2;
    }

    .data-table tr.critical {
      background: #fef2f2;
      border-left: 3px solid #dc2626;
    }

    .timestamp {
      display: flex;
      flex-direction: column;
    }

    .timestamp .date {
      font-size: 0.8125rem;
      color: #1e293b;
    }

    .timestamp .time {
      font-size: 0.75rem;
      color: #64748b;
    }

    .user-info {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-weight: 500;
      color: #1e293b;
    }

    .user-type {
      font-size: 0.75rem;
      color: #64748b;
      text-transform: capitalize;
    }

    .action-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .action-badge.login { background: #dbeafe; color: #1d4ed8; }
    .action-badge.logout { background: #f1f5f9; color: #64748b; }
    .action-badge.create { background: #dcfce7; color: #16a34a; }
    .action-badge.read { background: #e0e7ff; color: #4f46e5; }
    .action-badge.update { background: #fef3c7; color: #d97706; }
    .action-badge.delete { background: #fee2e2; color: #dc2626; }
    .action-badge.export { background: #cffafe; color: #0891b2; }
    .action-badge.sign { background: #f3e8ff; color: #7c3aed; }
    .action-badge.security { background: #fee2e2; color: #dc2626; }
    .action-badge.send { background: #dbeafe; color: #1d4ed8; }
    .action-badge.receive { background: #dcfce7; color: #16a34a; }

    .action-badge.large {
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
    }

    .module-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 500;
      background: #f1f5f9;
      color: #64748b;
    }

    .resource-info {
      display: flex;
      flex-direction: column;
    }

    .resource-name {
      text-transform: capitalize;
    }

    .resource-id {
      font-size: 0.75rem;
      color: #64748b;
      font-family: monospace;
    }

    .severity-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .severity-badge.low { background: #f1f5f9; color: #64748b; }
    .severity-badge.medium { background: #dbeafe; color: #1d4ed8; }
    .severity-badge.high { background: #fef3c7; color: #d97706; }
    .severity-badge.critical { background: #fee2e2; color: #dc2626; }

    .severity-badge.large {
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
    }

    .status-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .status-icon svg {
      width: 1.25rem;
      height: 1.25rem;
    }

    .status-icon.success { color: #16a34a; }
    .status-icon.failed { color: #dc2626; }

    .status-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-badge.success { background: #dcfce7; color: #16a34a; }
    .status-badge.failed { background: #fee2e2; color: #dc2626; }

    .empty-cell {
      padding: 3rem !important;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: #64748b;
    }

    .empty-state svg {
      width: 3rem;
      height: 3rem;
      margin-bottom: 0.5rem;
      color: #94a3b8;
    }

    /* Pagination */
    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .page-info {
      font-size: 0.875rem;
      color: #64748b;
    }

    .page-buttons {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .page-number {
      font-size: 0.875rem;
      color: #1e293b;
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

    /* Detail Modal Content */
    .detail-header {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .event-description {
      margin: 0 0 1.5rem;
      font-size: 0.9375rem;
      color: #475569;
      line-height: 1.5;
    }

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

    .detail-item.full-width {
      grid-column: 1 / -1;
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

    .detail-item span.mono {
      font-family: monospace;
      background: #f1f5f9;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
    }

    .detail-item span.small {
      font-size: 0.75rem;
      word-break: break-all;
    }

    .error-section {
      margin-bottom: 1.5rem;
    }

    .error-section label {
      display: block;
      font-size: 0.75rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }

    .error-message {
      padding: 0.75rem 1rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 0.5rem;
      font-family: monospace;
      font-size: 0.8125rem;
      color: #dc2626;
    }

    .changes-section label {
      display: block;
      font-size: 0.75rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }

    .changes-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .changes-table th,
    .changes-table td {
      padding: 0.5rem 0.75rem;
      text-align: left;
      font-size: 0.8125rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .changes-table th {
      background: #f8fafc;
      font-weight: 600;
      color: #64748b;
    }

    .changes-table .old-value {
      color: #dc2626;
      text-decoration: line-through;
    }

    .changes-table .new-value {
      color: #16a34a;
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

      .filter-actions {
        margin-left: 0;
      }

      .table-container {
        overflow-x: auto;
      }

      .data-table {
        min-width: 900px;
      }

      .detail-grid {
        grid-template-columns: 1fr;
      }

      .pagination {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }
    }
  `]
})
export class AuditComponent {
  adminService = inject(AdminService);

  // Filters
  searchQuery = signal('');
  startDate = signal('');
  endDate = signal('');
  actionFilter = signal<'all' | AuditAction>('all');
  severityFilter = signal<'all' | AuditSeverity>('all');
  moduleFilter = signal('all');

  // Pagination
  currentPage = signal(1);
  pageSize = signal(20);

  // Modal state
  showDetailModal = signal(false);
  selectedLog = signal<AuditLog | null>(null);

  Math = Math;

  filteredLogs = computed(() => {
    const filter: AuditFilter = {};
    
    if (this.startDate()) {
      filter.startDate = new Date(this.startDate());
    }
    if (this.endDate()) {
      filter.endDate = new Date(this.endDate());
    }
    if (this.actionFilter() !== 'all') {
      filter.action = [this.actionFilter() as AuditAction];
    }
    if (this.severityFilter() !== 'all') {
      filter.severity = [this.severityFilter() as AuditSeverity];
    }
    if (this.moduleFilter() !== 'all') {
      filter.module = [this.moduleFilter()];
    }
    if (this.searchQuery()) {
      filter.search = this.searchQuery();
    }
    
    return this.adminService.filterAuditLogs(filter);
  });

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  formatDateTime(date: Date): string {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  formatAction(action: string): string {
    return action.charAt(0).toUpperCase() + action.slice(1);
  }

  formatModule(module: string): string {
    return module.charAt(0).toUpperCase() + module.slice(1);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.startDate.set('');
    this.endDate.set('');
    this.actionFilter.set('all');
    this.severityFilter.set('all');
    this.moduleFilter.set('all');
    this.currentPage.set(1);
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() * this.pageSize() < this.filteredLogs().length) {
      this.currentPage.update(p => p + 1);
    }
  }

  viewDetails(log: AuditLog): void {
    this.selectedLog.set(log);
    this.showDetailModal.set(true);
  }

  closeDetailModal(): void {
    this.showDetailModal.set(false);
    this.selectedLog.set(null);
  }

  refreshLogs(): void {
    console.log('Refreshing audit logs...');
  }

  exportLogs(): void {
    console.log('Exporting audit logs...');
  }
}
