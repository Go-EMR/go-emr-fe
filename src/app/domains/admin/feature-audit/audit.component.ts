import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

// PrimeNG Imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { BadgeModule } from 'primeng/badge';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';

import { ThemeService } from '../../../core/services/theme.service';
import { AdminService } from '../data-access/services/admin.service';
import { AuditLog, AuditAction, AuditSeverity, AuditFilter } from '../data-access/models/admin.model';

interface ActiveFilter {
  type: 'action' | 'severity' | 'module' | 'dateRange';
  value: string;
  label: string;
}

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, ButtonModule, InputTextModule, SelectModule, MultiSelectModule,
    DialogModule, TagModule, ChipModule, TooltipModule, DividerModule,
    RippleModule, ToastModule, BadgeModule, IconFieldModule, InputIconModule,
    DatePickerModule,
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
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(80, [
            animate('400ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('chipEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'scale(0.8)' }))
      ])
    ]),
    trigger('tableRow', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ])
    ])
  ],
  template: `
    <div class="audit-container" [class.dark]="themeService.isDarkMode()">
      <p-toast />

      <!-- Header -->
      <header class="page-header" @fadeSlide>
        <div class="header-content">
          <div class="title-section">
            <h1>Audit Logs</h1>
            <p class="subtitle">Monitor system activity and security events</p>
          </div>
          <div class="header-actions">
            <p-button label="Export" icon="pi pi-download" [outlined]="true" severity="secondary" (onClick)="exportLogs()" />
            <p-button label="Refresh" icon="pi pi-refresh" (onClick)="refreshLogs()" />
          </div>
        </div>
      </header>

      <!-- Stats Cards -->
      <div class="stats-grid" @staggerCards>
        <div class="stat-card" data-type="total" pRipple>
          <div class="stat-icon-wrapper">
            <i class="pi pi-file-edit"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ adminService.auditSummary().totalEvents }}</span>
            <span class="stat-label">Total Events</span>
          </div>
        </div>

        <div class="stat-card" data-type="security" pRipple>
          <div class="stat-icon-wrapper">
            <i class="pi pi-shield"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ adminService.auditSummary().securityEvents }}</span>
            <span class="stat-label">Security Events</span>
          </div>
        </div>

        <div class="stat-card" data-type="failed" pRipple>
          <div class="stat-icon-wrapper">
            <i class="pi pi-times-circle"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ adminService.auditSummary().failedEvents }}</span>
            <span class="stat-label">Failed Events</span>
          </div>
          @if (adminService.auditSummary().failedEvents > 0) {
            <div class="stat-alert">
              <i class="pi pi-exclamation-triangle"></i>
            </div>
          }
        </div>

        <div class="stat-card" data-type="users" pRipple>
          <div class="stat-icon-wrapper">
            <i class="pi pi-users"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ adminService.auditSummary().byUser.length }}</span>
            <span class="stat-label">Active Users</span>
          </div>
        </div>
      </div>

      <!-- Filters Section -->
      <div class="filters-card" @fadeSlide>
        <div class="filters-row">
          <p-iconfield class="search-field">
            <p-inputicon styleClass="pi pi-search" />
            <input pInputText type="text" [(ngModel)]="searchQuery" (ngModelChange)="onSearchChange()" placeholder="Search events, users, resources..." class="search-input" />
          </p-iconfield>

          <div class="filter-controls">
            <p-multiselect 
              [(ngModel)]="selectedActions" 
              [options]="actionOptions" 
              optionLabel="label" 
              optionValue="value"
              placeholder="Actions"
              [showClear]="true"
              [maxSelectedLabels]="1"
              selectedItemsLabel="{0} actions"
              (onChange)="updateActiveFilters()"
              styleClass="filter-select"
            />

            <p-multiselect 
              [(ngModel)]="selectedSeverities" 
              [options]="severityOptions" 
              optionLabel="label" 
              optionValue="value"
              placeholder="Severity"
              [showClear]="true"
              [maxSelectedLabels]="1"
              selectedItemsLabel="{0} levels"
              (onChange)="updateActiveFilters()"
              styleClass="filter-select"
            />

            <p-multiselect 
              [(ngModel)]="selectedModules" 
              [options]="moduleOptions" 
              optionLabel="label" 
              optionValue="value"
              placeholder="Modules"
              [showClear]="true"
              [maxSelectedLabels]="1"
              selectedItemsLabel="{0} modules"
              (onChange)="updateActiveFilters()"
              styleClass="filter-select"
            />

            <p-datepicker 
              [(ngModel)]="dateRange" 
              selectionMode="range" 
              [readonlyInput]="true"
              placeholder="Date range"
              dateFormat="mm/dd/yy"
              [showIcon]="true"
              (onSelect)="updateActiveFilters()"
              styleClass="date-picker"
            />
          </div>
        </div>

        <!-- Active Filter Chips -->
        @if (activeFilters().length > 0) {
          <div class="active-filters">
            <span class="filters-label">Active filters:</span>
            <div class="filter-chips">
              @for (filter of activeFilters(); track filter.value) {
                <div class="filter-chip" [class]="filter.type" @chipEnter>
                  <span class="chip-label">{{ filter.label }}</span>
                  <button class="chip-remove" (click)="removeFilter(filter)" pRipple>
                    <i class="pi pi-times"></i>
                  </button>
                </div>
              }
              <button class="clear-all-btn" (click)="clearAllFilters()" pRipple>
                Clear all
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Sorting Options -->
      <div class="sort-bar" @fadeSlide>
        <span class="sort-label">Sort by:</span>
        <div class="sort-options">
          @for (option of sortOptions; track option.field) {
            <button 
              class="sort-btn" 
              [class.active]="sortField() === option.field"
              (click)="toggleSort(option.field)"
              pRipple
            >
              {{ option.label }}
              @if (sortField() === option.field) {
                <i class="pi" [class.pi-sort-amount-up]="sortOrder() === 1" [class.pi-sort-amount-down]="sortOrder() === -1"></i>
              }
            </button>
          }
        </div>
        <span class="results-count">{{ filteredLogs().length }} results</span>
      </div>

      <!-- Logs Table -->
      <div class="table-card">
        <p-table 
          [value]="paginatedLogs()" 
          [paginator]="true" 
          [rows]="pageSize()" 
          [showCurrentPageReport]="true"
          [rowsPerPageOptions]="[10, 20, 50, 100]"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} events"
          [totalRecords]="filteredLogs().length"
          styleClass="audit-table"
          [rowHover]="true"
          [scrollable]="true"
          scrollHeight="600px"
        >
          <ng-template pTemplate="header">
            <tr>
              <th style="width: 140px">Timestamp</th>
              <th style="width: 150px">User</th>
              <th style="width: 100px">Action</th>
              <th style="width: 110px">Module</th>
              <th style="min-width: 150px">Resource</th>
              <th style="width: 90px">Severity</th>
              <th style="width: 70px">Status</th>
              <th style="width: 60px">Details</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-log>
            <tr [class.failed-row]="!log.success" [class.critical-row]="log.severity === 'critical'" @tableRow>
              <td>
                <div class="timestamp-cell">
                  <span class="date">{{ formatDate(log.timestamp) }}</span>
                  <span class="time">{{ formatTime(log.timestamp) }}</span>
                </div>
              </td>
              <td>
                <div class="user-cell">
                  <span class="user-name">{{ log.userName }}</span>
                  <span class="user-type">{{ log.userType }}</span>
                </div>
              </td>
              <td>
                <p-tag [value]="formatAction(log.action)" [severity]="getActionSeverity(log.action)" [rounded]="true" />
              </td>
              <td>
                <span class="module-text">{{ formatModule(log.module) }}</span>
              </td>
              <td>
                <div class="resource-cell">
                  <span class="resource-name">{{ log.resource }}</span>
                  @if (log.resourceId) {
                    <span class="resource-id">{{ log.resourceId }}</span>
                  }
                </div>
              </td>
              <td>
                <p-tag [value]="log.severity | titlecase" [severity]="getSeverityType(log.severity)" [rounded]="true" />
              </td>
              <td>
                <div class="status-cell">
                  @if (log.success) {
                    <i class="pi pi-check-circle status-success"></i>
                  } @else {
                    <i class="pi pi-times-circle status-failed"></i>
                  }
                </div>
              </td>
              <td>
                <p-button icon="pi pi-eye" [rounded]="true" [text]="true" severity="secondary" pTooltip="View Details" (onClick)="viewDetails(log)" />
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="8">
                <div class="empty-state">
                  <i class="pi pi-inbox"></i>
                  <h3>No audit logs found</h3>
                  <p>Try adjusting your filters or date range</p>
                  @if (activeFilters().length > 0) {
                    <p-button label="Clear Filters" icon="pi pi-filter-slash" [outlined]="true" (onClick)="clearAllFilters()" />
                  }
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Detail Modal -->
      <p-dialog header="Event Details" [(visible)]="showDetailModal" [modal]="true" [style]="{ width: '700px' }" [draggable]="false">
        @if (selectedLog(); as log) {
          <div class="detail-content">
            <div class="detail-header-badges">
              <p-tag [value]="formatAction(log.action)" [severity]="getActionSeverity(log.action)" styleClass="detail-tag" />
              <p-tag [value]="log.severity | titlecase" [severity]="getSeverityType(log.severity)" styleClass="detail-tag" />
              @if (log.success) {
                <p-tag value="Success" severity="success" styleClass="detail-tag" />
              } @else {
                <p-tag value="Failed" severity="danger" styleClass="detail-tag" />
              }
            </div>

            <p class="event-description">{{ log.description }}</p>

            <div class="detail-grid">
              <div class="detail-item">
                <span class="label">Timestamp</span>
                <span class="value">{{ formatDateTime(log.timestamp) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">User</span>
                <span class="value">{{ log.userName }} ({{ log.userType }})</span>
              </div>
              <div class="detail-item">
                <span class="label">Module</span>
                <span class="value">{{ formatModule(log.module) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Resource</span>
                <span class="value">{{ log.resource }}</span>
              </div>
              @if (log.resourceId) {
                <div class="detail-item">
                  <span class="label">Resource ID</span>
                  <span class="value mono">{{ log.resourceId }}</span>
                </div>
              }
              <div class="detail-item">
                <span class="label">Session ID</span>
                <span class="value mono">{{ log.sessionId }}</span>
              </div>
              <div class="detail-item">
                <span class="label">IP Address</span>
                <span class="value mono">{{ log.ipAddress }}</span>
              </div>
              <div class="detail-item full-width">
                <span class="label">User Agent</span>
                <span class="value mono small">{{ log.userAgent }}</span>
              </div>
            </div>

            @if (log.errorMessage) {
              <div class="error-section">
                <span class="label">Error Message</span>
                <div class="error-box">{{ log.errorMessage }}</div>
              </div>
            }

            @if (log.changes && log.changes.length > 0) {
              <div class="changes-section">
                <span class="label">Changes Made</span>
                <div class="changes-list">
                  @for (change of log.changes; track change.field) {
                    <div class="change-item">
                      <span class="field-name">{{ change.fieldLabel }}</span>
                      <div class="change-values">
                        <span class="old-value">{{ change.oldValue || '(empty)' }}</span>
                        <i class="pi pi-arrow-right"></i>
                        <span class="new-value">{{ change.newValue || '(empty)' }}</span>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }

        <ng-template pTemplate="footer">
          <p-button label="Close" [text]="true" severity="secondary" (onClick)="closeDetailModal()" />
          <p-button label="Export Event" icon="pi pi-download" [outlined]="true" (onClick)="exportSingleLog()" />
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .audit-container {
      padding: 1.5rem 2rem;
      min-height: 100vh;
      background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
    }

    .dark.audit-container {
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
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
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
    }

    .stat-card[data-type="total"]::before { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
    .stat-card[data-type="security"]::before { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
    .stat-card[data-type="failed"]::before { background: linear-gradient(90deg, #ef4444, #f87171); }
    .stat-card[data-type="users"]::before { background: linear-gradient(90deg, #10b981, #34d399); }

    .stat-icon-wrapper {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-icon-wrapper i {
      font-size: 1.375rem;
      color: white;
    }

    .stat-card[data-type="total"] .stat-icon-wrapper { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); }
    .stat-card[data-type="security"] .stat-icon-wrapper { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
    .stat-card[data-type="failed"] .stat-icon-wrapper { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
    .stat-card[data-type="users"] .stat-icon-wrapper { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }

    .stat-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .stat-value {
      font-size: 1.625rem;
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

    /* Filters Card */
    .filters-card {
      background: white;
      border-radius: 16px;
      padding: 1.25rem;
      margin-bottom: 1rem;
      border: 1px solid #f1f5f9;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }

    .dark .filters-card {
      background: #1e293b;
      border-color: #334155;
    }

    .filters-row {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .search-field {
      flex: 1;
      min-width: 250px;
      max-width: 350px;
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

    :host ::ng-deep .filter-select {
      min-width: 140px;
    }

    :host ::ng-deep .date-picker {
      min-width: 200px;
    }

    /* Active Filters */
    .active-filters {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }

    .dark .active-filters {
      border-top-color: #334155;
    }

    .filters-label {
      font-size: 0.8125rem;
      font-weight: 500;
      color: #64748b;
      white-space: nowrap;
    }

    .filter-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
    }

    .filter-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.5rem 0.375rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;
      background: #e2e8f0;
      color: #475569;
      transition: all 0.2s;
    }

    .dark .filter-chip {
      background: #334155;
      color: #e2e8f0;
    }

    .filter-chip.action {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .filter-chip.severity {
      background: #fef3c7;
      color: #d97706;
    }

    .filter-chip.module {
      background: #f3e8ff;
      color: #7c3aed;
    }

    .filter-chip.dateRange {
      background: #dcfce7;
      color: #16a34a;
    }

    .chip-label {
      white-space: nowrap;
    }

    .chip-remove {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      border: none;
      background: rgba(0, 0, 0, 0.1);
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.15s;
    }

    .chip-remove i {
      font-size: 0.625rem;
    }

    .chip-remove:hover {
      background: rgba(0, 0, 0, 0.2);
    }

    .clear-all-btn {
      padding: 0.375rem 0.75rem;
      border: 1px dashed #cbd5e1;
      background: transparent;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;
    }

    .clear-all-btn:hover {
      background: #fee2e2;
      border-color: #ef4444;
      color: #ef4444;
    }

    /* Sort Bar */
    .sort-bar {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
      padding: 0.75rem 1rem;
      background: white;
      border-radius: 12px;
      border: 1px solid #f1f5f9;
    }

    .dark .sort-bar {
      background: #1e293b;
      border-color: #334155;
    }

    .sort-label {
      font-size: 0.8125rem;
      font-weight: 500;
      color: #64748b;
    }

    .sort-options {
      display: flex;
      gap: 0.375rem;
    }

    .sort-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 0.875rem;
      border: 1px solid #e2e8f0;
      background: white;
      border-radius: 8px;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #475569;
      cursor: pointer;
      transition: all 0.2s;
    }

    .dark .sort-btn {
      background: #0f172a;
      border-color: #334155;
      color: #94a3b8;
    }

    .sort-btn:hover {
      border-color: #3b82f6;
      color: #3b82f6;
    }

    .sort-btn.active {
      background: #3b82f6;
      border-color: #3b82f6;
      color: white;
    }

    .sort-btn i {
      font-size: 0.75rem;
    }

    .results-count {
      margin-left: auto;
      font-size: 0.8125rem;
      color: #64748b;
    }

    /* Table Card */
    .table-card {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #f1f5f9;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }

    .dark .table-card {
      background: #1e293b;
      border-color: #334155;
    }

    :host ::ng-deep .audit-table {
      .p-datatable-thead > tr > th {
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
        padding: 0.875rem 1rem;
        font-size: 0.75rem;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        position: sticky;
        top: 0;
        z-index: 1;
      }

      .p-datatable-tbody > tr > td {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #f1f5f9;
        font-size: 0.875rem;
        vertical-align: middle;
      }

      .p-datatable-tbody > tr:hover {
        background: #f8fafc;
      }
    }

    .dark :host ::ng-deep .audit-table {
      .p-datatable-thead > tr > th {
        background: #0f172a;
        border-bottom-color: #334155;
      }

      .p-datatable-tbody > tr > td {
        border-bottom-color: #334155;
      }

      .p-datatable-tbody > tr:hover {
        background: #0f172a;
      }
    }

    .failed-row {
      background: rgba(239, 68, 68, 0.05) !important;
    }

    .critical-row {
      background: rgba(239, 68, 68, 0.08) !important;
      border-left: 3px solid #ef4444;
    }

    /* Table Cells */
    .timestamp-cell {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .timestamp-cell .date {
      font-size: 0.8125rem;
      font-weight: 500;
      color: #0f172a;
    }

    .dark .timestamp-cell .date {
      color: #f8fafc;
    }

    .timestamp-cell .time {
      font-size: 0.75rem;
      color: #64748b;
    }

    .user-cell {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .user-name {
      font-weight: 500;
      color: #0f172a;
    }

    .dark .user-name {
      color: #f8fafc;
    }

    .user-type {
      font-size: 0.75rem;
      color: #64748b;
      text-transform: capitalize;
    }

    .module-text {
      font-size: 0.8125rem;
      color: #475569;
    }

    .dark .module-text {
      color: #94a3b8;
    }

    .resource-cell {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .resource-name {
      font-size: 0.8125rem;
      color: #0f172a;
      text-transform: capitalize;
    }

    .dark .resource-name {
      color: #f8fafc;
    }

    .resource-id {
      font-size: 0.6875rem;
      color: #64748b;
      font-family: monospace;
      background: #f1f5f9;
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
      width: fit-content;
    }

    .dark .resource-id {
      background: #334155;
    }

    .status-cell {
      display: flex;
      justify-content: center;
    }

    .status-success {
      color: #10b981;
      font-size: 1.25rem;
    }

    .status-failed {
      color: #ef4444;
      font-size: 1.25rem;
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

    /* Detail Modal */
    .detail-content {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .detail-header-badges {
      display: flex;
      gap: 0.5rem;
    }

    :host ::ng-deep .detail-tag {
      font-size: 0.8125rem;
      padding: 0.375rem 0.75rem;
    }

    .event-description {
      margin: 0;
      font-size: 0.9375rem;
      color: #475569;
      line-height: 1.6;
    }

    .dark .event-description {
      color: #94a3b8;
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

    .detail-item.full-width {
      grid-column: 1 / -1;
    }

    .detail-item .label {
      font-size: 0.6875rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .detail-item .value {
      font-size: 0.875rem;
      color: #0f172a;
    }

    .dark .detail-item .value {
      color: #f8fafc;
    }

    .detail-item .value.mono {
      font-family: monospace;
      background: #f1f5f9;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8125rem;
    }

    .dark .detail-item .value.mono {
      background: #334155;
    }

    .detail-item .value.small {
      font-size: 0.75rem;
      word-break: break-all;
    }

    .error-section,
    .changes-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .error-section .label,
    .changes-section .label {
      font-size: 0.6875rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .error-box {
      padding: 0.75rem 1rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      font-family: monospace;
      font-size: 0.8125rem;
      color: #dc2626;
    }

    .changes-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .change-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: 8px;
    }

    .dark .change-item {
      background: #0f172a;
    }

    .field-name {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
    }

    .change-values {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
    }

    .change-values i {
      font-size: 0.625rem;
      color: #64748b;
    }

    .old-value {
      color: #ef4444;
      text-decoration: line-through;
    }

    .new-value {
      color: #10b981;
      font-weight: 500;
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .audit-container {
        padding: 1rem;
      }

      .header-content {
        flex-direction: column;
        gap: 1rem;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .filters-row {
        flex-direction: column;
      }

      .search-field {
        max-width: none;
      }

      .sort-bar {
        flex-wrap: wrap;
      }

      .sort-options {
        flex-wrap: wrap;
      }

      .detail-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AuditComponent {
  adminService = inject(AdminService);
  themeService = inject(ThemeService);
  private messageService = inject(MessageService);

  // Filters
  searchQuery = '';
  selectedActions: AuditAction[] = [];
  selectedSeverities: AuditSeverity[] = [];
  selectedModules: string[] = [];
  dateRange: Date[] | null = null;

  // Sorting
  sortField = signal<string>('timestamp');
  sortOrder = signal<number>(-1); // -1 = descending, 1 = ascending

  // Pagination
  pageSize = signal(20);

  // Modal
  showDetailModal = signal(false);
  selectedLog = signal<AuditLog | null>(null);

  // Active filters as chips
  activeFilters = signal<ActiveFilter[]>([]);

  // Options
  actionOptions = [
    { label: 'Login', value: 'login' },
    { label: 'Logout', value: 'logout' },
    { label: 'Create', value: 'create' },
    { label: 'Read', value: 'read' },
    { label: 'Update', value: 'update' },
    { label: 'Delete', value: 'delete' },
    { label: 'Export', value: 'export' },
    { label: 'Sign', value: 'sign' },
    { label: 'Security', value: 'security' }
  ];

  severityOptions = [
    { label: 'Critical', value: 'critical' },
    { label: 'High', value: 'high' },
    { label: 'Medium', value: 'medium' },
    { label: 'Low', value: 'low' }
  ];

  moduleOptions = [
    { label: 'Authentication', value: 'auth' },
    { label: 'Patients', value: 'patients' },
    { label: 'Encounters', value: 'encounters' },
    { label: 'Prescriptions', value: 'prescriptions' },
    { label: 'Billing', value: 'billing' },
    { label: 'Reports', value: 'reports' },
    { label: 'Admin', value: 'admin' }
  ];

  sortOptions = [
    { field: 'timestamp', label: 'Date' },
    { field: 'userName', label: 'User' },
    { field: 'action', label: 'Action' },
    { field: 'severity', label: 'Severity' }
  ];

  filteredLogs = computed(() => {
    const filter: AuditFilter = {};

    if (this.dateRange && this.dateRange.length === 2) {
      filter.startDate = this.dateRange[0];
      filter.endDate = this.dateRange[1];
    }
    if (this.selectedActions.length > 0) {
      filter.action = this.selectedActions;
    }
    if (this.selectedSeverities.length > 0) {
      filter.severity = this.selectedSeverities;
    }
    if (this.selectedModules.length > 0) {
      filter.module = this.selectedModules;
    }
    if (this.searchQuery) {
      filter.search = this.searchQuery;
    }

    let logs = this.adminService.filterAuditLogs(filter);

    // Apply sorting
    const field = this.sortField();
    const order = this.sortOrder();
    logs = [...logs].sort((a, b) => {
      let aVal = (a as any)[field];
      let bVal = (b as any)[field];

      if (field === 'timestamp') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (aVal < bVal) return -1 * order;
      if (aVal > bVal) return 1 * order;
      return 0;
    });

    return logs;
  });

  paginatedLogs = computed(() => {
    return this.filteredLogs();
  });

  onSearchChange(): void {
    this.updateActiveFilters();
  }

  updateActiveFilters(): void {
    const filters: ActiveFilter[] = [];

    this.selectedActions.forEach(action => {
      const option = this.actionOptions.find(o => o.value === action);
      if (option) {
        filters.push({ type: 'action', value: action, label: option.label });
      }
    });

    this.selectedSeverities.forEach(severity => {
      const option = this.severityOptions.find(o => o.value === severity);
      if (option) {
        filters.push({ type: 'severity', value: severity, label: option.label });
      }
    });

    this.selectedModules.forEach(module => {
      const option = this.moduleOptions.find(o => o.value === module);
      if (option) {
        filters.push({ type: 'module', value: module, label: option.label });
      }
    });

    if (this.dateRange && this.dateRange.length === 2) {
      const start = this.dateRange[0].toLocaleDateString();
      const end = this.dateRange[1].toLocaleDateString();
      filters.push({ type: 'dateRange', value: 'date', label: `${start} - ${end}` });
    }

    this.activeFilters.set(filters);
  }

  removeFilter(filter: ActiveFilter): void {
    switch (filter.type) {
      case 'action':
        this.selectedActions = this.selectedActions.filter(a => a !== filter.value);
        break;
      case 'severity':
        this.selectedSeverities = this.selectedSeverities.filter(s => s !== filter.value);
        break;
      case 'module':
        this.selectedModules = this.selectedModules.filter(m => m !== filter.value);
        break;
      case 'dateRange':
        this.dateRange = null;
        break;
    }
    this.updateActiveFilters();
  }

  clearAllFilters(): void {
    this.searchQuery = '';
    this.selectedActions = [];
    this.selectedSeverities = [];
    this.selectedModules = [];
    this.dateRange = null;
    this.activeFilters.set([]);
  }

  toggleSort(field: string): void {
    if (this.sortField() === field) {
      this.sortOrder.update(o => o * -1);
    } else {
      this.sortField.set(field);
      this.sortOrder.set(-1);
    }
  }

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

  getActionSeverity(action: AuditAction): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
    const map: Record<string, any> = {
      login: 'info',
      logout: 'secondary',
      create: 'success',
      read: 'info',
      update: 'warn',
      delete: 'danger',
      export: 'info',
      sign: 'success',
      security: 'danger'
    };
    return map[action] || 'secondary';
  }

  getSeverityType(severity: AuditSeverity): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
    const map: Record<string, any> = {
      low: 'secondary',
      medium: 'info',
      high: 'warn',
      critical: 'danger'
    };
    return map[severity] || 'secondary';
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
    this.messageService.add({ severity: 'success', summary: 'Refreshed', detail: 'Audit logs refreshed' });
  }

  exportLogs(): void {
    this.messageService.add({ severity: 'info', summary: 'Exporting', detail: `Exporting ${this.filteredLogs().length} log entries...` });
  }

  exportSingleLog(): void {
    this.messageService.add({ severity: 'info', summary: 'Exporting', detail: 'Exporting event details...' });
  }
}
