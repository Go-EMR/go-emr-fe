import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LabService, LabOrderSearchParams } from '../data-access/services/lab.service';
import {
  LabOrder,
  LabOrderStatus,
  LabPriority,
  STATUS_LABELS,
  PRIORITY_LABELS
} from '../data-access/models/lab.model';

type TabType = 'all' | 'pending' | 'results' | 'abnormal' | 'critical';

interface StatusConfig {
  label: string;
  class: string;
  icon: string;
}

interface ExpirationStatus {
  label: string;
  severity: 'success' | 'warning' | 'danger';
  daysRemaining: number;
}

@Component({
  selector: 'app-lab-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="lab-list-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Lab Orders</h1>
          <p class="subtitle">Manage laboratory orders and results</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" routerLink="new">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            New Lab Order
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon pending">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats().pending }}</span>
            <span class="stat-label">Pending Orders</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon awaiting">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
              <path d="M9 14l2 2 4-4"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats().awaitingResults }}</span>
            <span class="stat-label">Awaiting Results</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon abnormal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats().abnormal }}</span>
            <span class="stat-label">Abnormal Results</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon critical">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats().critical }}</span>
            <span class="stat-label">Critical Values</span>
          </div>
        </div>
      </div>

      <!-- Filters & Tabs -->
      <div class="filters-section">
        <div class="tabs">
          @for (tab of tabs; track tab.id) {
            <button
              class="tab"
              [class.active]="activeTab() === tab.id"
              (click)="setActiveTab(tab.id)">
              {{ tab.label }}
              @if (tab.count !== undefined && tab.count > 0) {
                <span class="tab-badge" [class.critical]="tab.id === 'critical'">{{ tab.count }}</span>
              }
            </button>
          }
        </div>

        <div class="filter-controls">
          <div class="search-box">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search orders, patients, tests..."
              [(ngModel)]="searchTerm"
              (ngModelChange)="onSearchChange($event)"
            />
          </div>

          <select [(ngModel)]="priorityFilter" (ngModelChange)="onFilterChange()" class="filter-select">
            <option value="">All Priorities</option>
            <option value="stat">STAT</option>
            <option value="asap">ASAP</option>
            <option value="urgent">Urgent</option>
            <option value="routine">Routine</option>
          </select>

          <select [(ngModel)]="dateFilter" (ngModelChange)="onFilterChange()" class="filter-select">
            <option value="">All Dates</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          <button class="btn btn-icon" (click)="refreshOrders()" title="Refresh">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 4v6h-6M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Orders List -->
      <div class="orders-list">
        @if (loading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading lab orders...</p>
          </div>
        } @else if (filteredOrders().length === 0) {
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
              <line x1="9" y1="12" x2="15" y2="12"/>
              <line x1="9" y1="16" x2="13" y2="16"/>
            </svg>
            <h3>No lab orders found</h3>
            <p>Try adjusting your filters or create a new lab order</p>
            <button class="btn btn-primary" routerLink="new">Create Lab Order</button>
          </div>
        } @else {
          <div class="orders-table">
            <div class="table-header">
              <div class="col-patient">Patient</div>
              <div class="col-tests">Tests Ordered</div>
              <div class="col-status">Status</div>
              <div class="col-priority">Priority</div>
              <div class="col-date">Ordered</div>
              <div class="col-expiration">Expires</div>
              <div class="col-results">Results</div>
              <div class="col-actions">Actions</div>
            </div>

            @for (order of filteredOrders(); track order.orderId) {
              <div class="order-row" [class.has-critical]="order.resultsSummary === 'critical'"
                   [class.has-abnormal]="order.resultsSummary === 'abnormal'">
                <div class="col-patient">
                  <a [routerLink]="[order.orderId]" class="patient-link">
                    <span class="patient-name">{{ order.patientName || 'Unknown Patient' }}</span>
                    <span class="order-id">{{ order.orderId }}</span>
                  </a>
                </div>

                <div class="col-tests">
                  <div class="tests-list">
                    @for (test of order.tests.slice(0, 3); track test.testCode) {
                      <span class="test-chip">{{ test.testName }}</span>
                    }
                    @if (order.tests.length > 3) {
                      <span class="test-more">+{{ order.tests.length - 3 }} more</span>
                    }
                  </div>
                </div>

                <div class="col-status">
                  <span class="status-badge" [class]="getStatusConfig(order.status).class">
                    {{ getStatusConfig(order.status).label }}
                  </span>
                </div>

                <div class="col-priority">
                  <span class="priority-badge" [class]="'priority-' + order.priority">
                    {{ getPriorityLabel(order.priority) }}
                  </span>
                </div>

                <div class="col-date">
                  <span class="date-primary">{{ formatDate(order.orderedDate) }}</span>
                  <span class="date-secondary">{{ formatTime(order.orderedDate) }}</span>
                </div>

                <div class="col-expiration">
                  @if (order.expirationDate) {
                    @let expStatus = getExpirationStatus(order);
                    <span class="expiration-badge" [class]="'expiration-' + expStatus.severity">
                      <svg class="expiration-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2"/>
                      </svg>
                      {{ expStatus.label }}
                    </span>
                    <span class="expiration-date">{{ formatShortDate(order.expirationDate) }}</span>
                  } @else {
                    <span class="expiration-none">—</span>
                  }
                </div>

                <div class="col-results">
                  @if (order.resultsSummary === 'critical') {
                    <span class="results-badge critical">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      Critical
                    </span>
                  } @else if (order.resultsSummary === 'abnormal') {
                    <span class="results-badge abnormal">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                      </svg>
                      Abnormal
                    </span>
                  } @else if (order.resultsSummary === 'normal') {
                    <span class="results-badge normal">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                      Normal
                    </span>
                  } @else if (order.resultsSummary === 'pending') {
                    <span class="results-badge pending">Pending</span>
                  } @else {
                    <span class="results-badge none">—</span>
                  }
                </div>

                <div class="col-actions">
                  <button class="btn btn-icon btn-sm" [routerLink]="[order.orderId]" title="View Details">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                  @if (order.status === 'final' || order.status === 'preliminary') {
                    <button class="btn btn-icon btn-sm" (click)="printResults(order)" title="Print Results">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 6 2 18 2 18 9"/>
                        <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
                        <rect x="6" y="14" width="12" height="8"/>
                      </svg>
                    </button>
                  }
                  @if (order.status === 'draft' || order.status === 'pending') {
                    <button class="btn btn-icon btn-sm" [routerLink]="[order.orderId, 'edit']" title="Edit Order">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  }
                  <button class="btn btn-icon btn-sm" (click)="showOrderMenu(order, $event)" title="More Actions">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="1"/>
                      <circle cx="12" cy="5" r="1"/>
                      <circle cx="12" cy="19" r="1"/>
                    </svg>
                  </button>
                </div>
              </div>
            }
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="pagination">
              <button
                class="btn btn-sm"
                [disabled]="currentPage() === 1"
                (click)="goToPage(currentPage() - 1)">
                Previous
              </button>
              <span class="page-info">
                Page {{ currentPage() }} of {{ totalPages() }}
                ({{ totalOrders() }} total orders)
              </span>
              <button
                class="btn btn-sm"
                [disabled]="currentPage() === totalPages()"
                (click)="goToPage(currentPage() + 1)">
                Next
              </button>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .lab-list-container {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .header-content h1 {
      font-size: 1.75rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .subtitle {
      color: #64748b;
      margin: 0.25rem 0 0;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      border-radius: 0.5rem;
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.15s ease;
    }

    .btn-primary {
      background: #2563eb;
      color: white;
    }

    .btn-primary:hover {
      background: #1d4ed8;
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
    }

    .btn-icon {
      padding: 0.5rem;
      background: transparent;
      color: #64748b;
    }

    .btn-icon:hover {
      background: #f1f5f9;
      color: #1e293b;
    }

    .btn-icon.btn-sm {
      padding: 0.375rem;
    }

    .icon {
      width: 1.25rem;
      height: 1.25rem;
    }

    .btn-icon svg {
      width: 1.125rem;
      height: 1.125rem;
    }

    .btn-icon.btn-sm svg {
      width: 1rem;
      height: 1rem;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: white;
      border-radius: 0.75rem;
      border: 1px solid #e2e8f0;
    }

    .stat-icon {
      width: 3rem;
      height: 3rem;
      border-radius: 0.625rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon svg {
      width: 1.5rem;
      height: 1.5rem;
    }

    .stat-icon.pending {
      background: #fef3c7;
      color: #d97706;
    }

    .stat-icon.awaiting {
      background: #dbeafe;
      color: #2563eb;
    }

    .stat-icon.abnormal {
      background: #fed7aa;
      color: #ea580c;
    }

    .stat-icon.critical {
      background: #fee2e2;
      color: #dc2626;
    }

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
      font-size: 0.8125rem;
      color: #64748b;
    }

    /* Filters Section */
    .filters-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .tabs {
      display: flex;
      gap: 0.25rem;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 0;
    }

    .tab {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: none;
      border: none;
      font-size: 0.875rem;
      font-weight: 500;
      color: #64748b;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      transition: all 0.15s ease;
    }

    .tab:hover {
      color: #1e293b;
    }

    .tab.active {
      color: #2563eb;
      border-bottom-color: #2563eb;
    }

    .tab-badge {
      padding: 0.125rem 0.5rem;
      background: #e2e8f0;
      color: #475569;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .tab-badge.critical {
      background: #fee2e2;
      color: #dc2626;
    }

    .filter-controls {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      align-items: center;
    }

    .search-box {
      position: relative;
      flex: 1;
      min-width: 250px;
      max-width: 400px;
    }

    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      width: 1.125rem;
      height: 1.125rem;
      color: #94a3b8;
    }

    .search-box input {
      width: 100%;
      padding: 0.625rem 0.75rem 0.625rem 2.5rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      transition: border-color 0.15s ease;
    }

    .search-box input:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .filter-select {
      padding: 0.625rem 2rem 0.625rem 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      background: white url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E") no-repeat right 0.75rem center;
      cursor: pointer;
    }

    .filter-select:focus {
      outline: none;
      border-color: #2563eb;
    }

    /* Orders Table */
    .orders-list {
      background: white;
      border-radius: 0.75rem;
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }

    .orders-table {
      width: 100%;
    }

    .table-header {
      display: grid;
      grid-template-columns: 1.5fr 2fr 1fr 0.8fr 1fr 1fr 1fr 0.8fr;
      gap: 1rem;
      padding: 0.75rem 1rem;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }

    .order-row {
      display: grid;
      grid-template-columns: 1.5fr 2fr 1fr 0.8fr 1fr 1fr 1fr 0.8fr;
      gap: 1rem;
      padding: 1rem;
      border-bottom: 1px solid #e2e8f0;
      align-items: center;
      transition: background-color 0.15s ease;
    }

    .order-row:last-child {
      border-bottom: none;
    }

    .order-row:hover {
      background: #f8fafc;
    }

    .order-row.has-critical {
      background: #fef2f2;
    }

    .order-row.has-critical:hover {
      background: #fee2e2;
    }

    .order-row.has-abnormal {
      background: #fffbeb;
    }

    .order-row.has-abnormal:hover {
      background: #fef3c7;
    }

    .patient-link {
      display: flex;
      flex-direction: column;
      text-decoration: none;
    }

    .patient-name {
      font-weight: 500;
      color: #1e293b;
    }

    .patient-link:hover .patient-name {
      color: #2563eb;
    }

    .order-id {
      font-size: 0.75rem;
      color: #64748b;
    }

    .tests-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
    }

    .test-chip {
      padding: 0.25rem 0.5rem;
      background: #f1f5f9;
      color: #475569;
      border-radius: 0.25rem;
      font-size: 0.75rem;
    }

    .test-more {
      padding: 0.25rem 0.5rem;
      color: #64748b;
      font-size: 0.75rem;
      font-style: italic;
    }

    .status-badge {
      display: inline-flex;
      padding: 0.25rem 0.625rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-badge.status-draft {
      background: #f1f5f9;
      color: #64748b;
    }

    .status-badge.status-pending,
    .status-badge.status-ordered {
      background: #fef3c7;
      color: #b45309;
    }

    .status-badge.status-scheduled,
    .status-badge.status-collected,
    .status-badge.status-received {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .status-badge.status-in-progress {
      background: #e0e7ff;
      color: #4338ca;
    }

    .status-badge.status-preliminary {
      background: #fce7f3;
      color: #be185d;
    }

    .status-badge.status-final {
      background: #dcfce7;
      color: #16a34a;
    }

    .status-badge.status-corrected {
      background: #fed7aa;
      color: #c2410c;
    }

    .status-badge.status-cancelled {
      background: #fee2e2;
      color: #dc2626;
    }

    .priority-badge {
      display: inline-flex;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .priority-badge.priority-routine {
      background: #f1f5f9;
      color: #64748b;
    }

    .priority-badge.priority-urgent {
      background: #fef3c7;
      color: #b45309;
    }

    .priority-badge.priority-asap {
      background: #fed7aa;
      color: #c2410c;
    }

    .priority-badge.priority-stat {
      background: #fee2e2;
      color: #dc2626;
    }

    .col-date {
      display: flex;
      flex-direction: column;
    }

    .date-primary {
      font-size: 0.875rem;
      color: #1e293b;
    }

    .date-secondary {
      font-size: 0.75rem;
      color: #64748b;
    }

    .results-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .results-badge svg {
      width: 0.875rem;
      height: 0.875rem;
    }

    .results-badge.critical {
      background: #fee2e2;
      color: #dc2626;
    }

    .results-badge.abnormal {
      background: #fed7aa;
      color: #c2410c;
    }

    .results-badge.normal {
      background: #dcfce7;
      color: #16a34a;
    }

    .results-badge.pending {
      background: #f1f5f9;
      color: #64748b;
    }

    .results-badge.none {
      color: #94a3b8;
    }

    /* Expiration Column */
    .col-expiration {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .expiration-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
      width: fit-content;
    }

    .expiration-icon {
      width: 0.8rem;
      height: 0.8rem;
      flex-shrink: 0;
    }

    .expiration-badge.expiration-success {
      background: #dcfce7;
      color: #16a34a;
    }

    .expiration-badge.expiration-warning {
      background: #fef3c7;
      color: #b45309;
    }

    .expiration-badge.expiration-danger {
      background: #fee2e2;
      color: #dc2626;
    }

    .expiration-date {
      font-size: 0.7rem;
      color: #94a3b8;
    }

    .expiration-none {
      color: #94a3b8;
      font-size: 0.875rem;
    }

    /* Dark mode overrides */
    :host-context(.dark) .table-header {
      background: #1e293b;
      border-bottom-color: #334155;
      color: #94a3b8;
    }

    :host-context(.dark) .order-row {
      border-bottom-color: #334155;
    }

    :host-context(.dark) .order-row:hover {
      background: #1e293b;
    }

    :host-context(.dark) .order-row.has-critical {
      background: #450a0a;
    }

    :host-context(.dark) .order-row.has-critical:hover {
      background: #7f1d1d;
    }

    :host-context(.dark) .order-row.has-abnormal {
      background: #422006;
    }

    :host-context(.dark) .order-row.has-abnormal:hover {
      background: #78350f;
    }

    :host-context(.dark) .orders-list {
      background: #0f172a;
      border-color: #334155;
    }

    :host-context(.dark) .stat-card {
      background: #1e293b;
      border-color: #334155;
    }

    :host-context(.dark) .stat-value {
      color: #f1f5f9;
    }

    :host-context(.dark) .stat-label {
      color: #94a3b8;
    }

    :host-context(.dark) .header-content h1 {
      color: #f1f5f9;
    }

    :host-context(.dark) .subtitle {
      color: #94a3b8;
    }

    :host-context(.dark) .tabs {
      border-bottom-color: #334155;
    }

    :host-context(.dark) .tab {
      color: #94a3b8;
    }

    :host-context(.dark) .tab:hover {
      color: #f1f5f9;
    }

    :host-context(.dark) .tab.active {
      color: #60a5fa;
      border-bottom-color: #60a5fa;
    }

    :host-context(.dark) .search-box input {
      background: #1e293b;
      border-color: #334155;
      color: #f1f5f9;
    }

    :host-context(.dark) .filter-select {
      background-color: #1e293b;
      border-color: #334155;
      color: #f1f5f9;
    }

    :host-context(.dark) .patient-name {
      color: #f1f5f9;
    }

    :host-context(.dark) .date-primary {
      color: #f1f5f9;
    }

    :host-context(.dark) .test-chip {
      background: #334155;
      color: #cbd5e1;
    }

    :host-context(.dark) .expiration-badge.expiration-success {
      background: #14532d;
      color: #86efac;
    }

    :host-context(.dark) .expiration-badge.expiration-warning {
      background: #78350f;
      color: #fcd34d;
    }

    :host-context(.dark) .expiration-badge.expiration-danger {
      background: #7f1d1d;
      color: #fca5a5;
    }

    :host-context(.dark) .pagination {
      border-top-color: #334155;
    }

    :host-context(.dark) .pagination .btn {
      background: #1e293b;
      border-color: #334155;
      color: #94a3b8;
    }

    :host-context(.dark) .btn-icon:hover {
      background: #334155;
      color: #f1f5f9;
    }

    .col-actions {
      display: flex;
      gap: 0.25rem;
      justify-content: flex-end;
    }

    /* Loading & Empty States */
    .loading-state,
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
    }

    .spinner {
      width: 2.5rem;
      height: 2.5rem;
      border: 3px solid #e2e8f0;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-state p {
      margin-top: 1rem;
      color: #64748b;
    }

    .empty-state svg {
      width: 4rem;
      height: 4rem;
      color: #cbd5e1;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 0.5rem;
    }

    .empty-state p {
      color: #64748b;
      margin: 0 0 1.5rem;
    }

    /* Pagination */
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 1rem;
      border-top: 1px solid #e2e8f0;
    }

    .page-info {
      font-size: 0.875rem;
      color: #64748b;
    }

    .pagination .btn {
      background: white;
      border: 1px solid #e2e8f0;
      color: #475569;
    }

    .pagination .btn:hover:not(:disabled) {
      background: #f8fafc;
      border-color: #cbd5e1;
    }

    .pagination .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .table-header {
        display: none;
      }

      .order-row {
        grid-template-columns: 1fr;
        gap: 0.75rem;
        padding: 1rem;
      }

      .col-patient {
        order: 1;
      }

      .col-status,
      .col-priority {
        display: inline-flex;
      }

      .col-tests {
        order: 2;
      }

      .col-actions {
        order: 3;
        justify-content: flex-start;
      }
    }
  `]
})
export class LabListComponent implements OnInit {
  private readonly labService = inject(LabService);

  // State
  orders = signal<LabOrder[]>([]);
  loading = signal(true);
  activeTab = signal<TabType>('all');
  searchTerm = '';
  priorityFilter = '';
  dateFilter = '';
  currentPage = signal(1);
  pageSize = 20;
  totalOrders = signal(0);

  // Tabs configuration
  tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'all', label: 'All Orders' },
    { id: 'pending', label: 'Pending' },
    { id: 'results', label: 'Results Ready' },
    { id: 'abnormal', label: 'Abnormal' },
    { id: 'critical', label: 'Critical' }
  ];

  // Computed values
  stats = computed(() => {
    const allOrders = this.orders();
    return {
      pending: allOrders.filter(o =>
        ['draft', 'pending', 'ordered', 'scheduled'].includes(o.status)
      ).length,
      awaitingResults: allOrders.filter(o =>
        ['collected', 'received', 'in-progress'].includes(o.status)
      ).length,
      abnormal: allOrders.filter(o => o.resultsSummary === 'abnormal').length,
      critical: allOrders.filter(o => o.resultsSummary === 'critical').length
    };
  });

  filteredOrders = computed(() => {
    let orders = this.orders();
    const tab = this.activeTab();

    switch (tab) {
      case 'pending':
        orders = orders.filter(o =>
          ['draft', 'pending', 'ordered', 'scheduled', 'collected', 'received', 'in-progress'].includes(o.status)
        );
        break;
      case 'results':
        orders = orders.filter(o =>
          ['preliminary', 'final', 'corrected'].includes(o.status)
        );
        break;
      case 'abnormal':
        orders = orders.filter(o => o.resultsSummary === 'abnormal');
        break;
      case 'critical':
        orders = orders.filter(o => o.resultsSummary === 'critical');
        break;
    }

    return orders;
  });

  totalPages = computed(() => Math.ceil(this.totalOrders() / this.pageSize));

  ngOnInit(): void {
    this.loadOrders();
    this.updateTabCounts();
  }

  loadOrders(): void {
    this.loading.set(true);

    const params: LabOrderSearchParams = {
      page: this.currentPage(),
      pageSize: this.pageSize
    };

    if (this.searchTerm) {
      params.searchTerm = this.searchTerm;
    }

    if (this.priorityFilter) {
      params.priority = this.priorityFilter as LabPriority;
    }

    this.labService.getLabOrders(params).subscribe({
      next: (result) => {
        this.orders.set(result.orders);
        this.totalOrders.set(result.total);
        this.loading.set(false);
        this.updateTabCounts();
      },
      error: (err) => {
        console.error('Failed to load lab orders:', err);
        this.loading.set(false);
      }
    });
  }

  updateTabCounts(): void {
    const allOrders = this.orders();
    this.tabs = [
      { id: 'all', label: 'All Orders', count: allOrders.length },
      { id: 'pending', label: 'Pending', count: allOrders.filter(o =>
        ['draft', 'pending', 'ordered', 'scheduled', 'collected', 'received', 'in-progress'].includes(o.status)
      ).length },
      { id: 'results', label: 'Results Ready', count: allOrders.filter(o =>
        ['preliminary', 'final', 'corrected'].includes(o.status)
      ).length },
      { id: 'abnormal', label: 'Abnormal', count: allOrders.filter(o =>
        o.resultsSummary === 'abnormal'
      ).length },
      { id: 'critical', label: 'Critical', count: allOrders.filter(o =>
        o.resultsSummary === 'critical'
      ).length }
    ];
  }

  setActiveTab(tab: TabType): void {
    this.activeTab.set(tab);
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.currentPage.set(1);
    this.loadOrders();
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadOrders();
  }

  refreshOrders(): void {
    this.loadOrders();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadOrders();
    }
  }

  getStatusConfig(status: LabOrderStatus): StatusConfig {
    const configs: Record<LabOrderStatus, StatusConfig> = {
      'draft': { label: 'Draft', class: 'status-draft', icon: 'edit' },
      'pending': { label: 'Pending', class: 'status-pending', icon: 'clock' },
      'ordered': { label: 'Ordered', class: 'status-ordered', icon: 'send' },
      'scheduled': { label: 'Scheduled', class: 'status-scheduled', icon: 'calendar' },
      'collected': { label: 'Collected', class: 'status-collected', icon: 'check' },
      'received': { label: 'Received', class: 'status-received', icon: 'inbox' },
      'in-progress': { label: 'In Progress', class: 'status-in-progress', icon: 'loader' },
      'preliminary': { label: 'Preliminary', class: 'status-preliminary', icon: 'file-text' },
      'final': { label: 'Final', class: 'status-final', icon: 'check-circle' },
      'corrected': { label: 'Corrected', class: 'status-corrected', icon: 'edit-2' },
      'cancelled': { label: 'Cancelled', class: 'status-cancelled', icon: 'x-circle' }
    };
    return configs[status] || { label: status, class: 'status-draft', icon: 'circle' };
  }

  getPriorityLabel(priority: LabPriority): string {
    return PRIORITY_LABELS[priority] || priority;
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  printResults(order: LabOrder): void {
    this.labService.printResults(order.orderId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      },
      error: (err) => console.error('Failed to print results:', err)
    });
  }

  /**
   * Returns an expiration status object for a lab order.
   * Green "Valid"     - more than 90 days (3 months) remaining
   * Amber "Expiring"  - between 1 and 90 days remaining
   * Red   "Expired"   - 0 or negative days remaining
   * Returns null when no expirationDate is set.
   */
  getExpirationStatus(order: LabOrder): ExpirationStatus {
    if (!order.expirationDate) {
      return { label: 'Unknown', severity: 'warning', daysRemaining: 0 };
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const expiry = new Date(order.expirationDate);
    expiry.setHours(0, 0, 0, 0);
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysRemaining = Math.floor((expiry.getTime() - now.getTime()) / msPerDay);

    if (daysRemaining > 90) {
      return { label: 'Valid', severity: 'success', daysRemaining };
    } else if (daysRemaining >= 1) {
      return { label: 'Expiring', severity: 'warning', daysRemaining };
    } else {
      return { label: 'Expired', severity: 'danger', daysRemaining };
    }
  }

  formatShortDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  showOrderMenu(order: LabOrder, event: MouseEvent): void {
    event.stopPropagation();
    // Would open a dropdown menu with additional actions
    console.log('Show menu for order:', order.orderId);
  }
}
