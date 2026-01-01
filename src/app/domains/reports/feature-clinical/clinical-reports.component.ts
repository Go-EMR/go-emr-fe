import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ReportsService } from '../data-access/services/reports.service';
import { 
  ReportDefinition, 
  ReportExecution, 
  ReportResult,
  ReportParameter 
} from '../data-access/models/reports.model';

@Component({
  selector: 'app-clinical-reports',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="clinical-reports">
      <header class="page-header">
        <div class="header-content">
          <h1>Clinical Reports</h1>
          <p class="subtitle">Generate and view clinical reports for patient care analysis</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="showScheduledReports.set(!showScheduledReports())">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            Scheduled Reports
          </button>
          <button class="btn btn-secondary" (click)="viewRecentExecutions()">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
            </svg>
            Recent Reports
          </button>
        </div>
      </header>

      <div class="reports-layout">
        <!-- Report Categories Sidebar -->
        <aside class="reports-sidebar">
          <div class="sidebar-section">
            <h3>Report Categories</h3>
            <nav class="category-nav">
              @for (category of reportCategories; track category.id) {
                <button 
                  class="category-item"
                  [class.active]="selectedCategory() === category.id"
                  (click)="selectCategory(category.id)">
                  <span class="category-icon" [innerHTML]="sanitizeHtml(category.icon)"></span>
                  <span class="category-name">{{ category.name }}</span>
                  <span class="category-count">{{ getCategoryCount(category.id) }}</span>
                </button>
              }
            </nav>
          </div>

          <div class="sidebar-section">
            <h3>Favorites</h3>
            @if (favoriteReports().length > 0) {
              <div class="favorites-list">
                @for (report of favoriteReports(); track report.id) {
                  <button class="favorite-item" (click)="selectReport(report)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    {{ report.name }}
                  </button>
                }
              </div>
            } @else {
              <p class="empty-text">No favorite reports yet</p>
            }
          </div>
        </aside>

        <!-- Main Content -->
        <main class="reports-main">
          @if (!selectedReport() && !reportResult()) {
            <!-- Report List -->
            <div class="report-list-container">
              <div class="list-header">
                <h2>{{ getCategoryName(selectedCategory()) }}</h2>
                <div class="search-box">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input 
                    type="text" 
                    placeholder="Search reports..." 
                    [value]="searchQuery()"
                    (input)="searchQuery.set($any($event.target).value)">
                </div>
              </div>

              <div class="report-grid">
                @for (report of filteredReports(); track report.id) {
                  <div class="report-card" (click)="selectReport(report)">
                    <div class="card-header">
                      <h3>{{ report.name }}</h3>
                      <button 
                        class="favorite-btn"
                        [class.active]="report.isFavorite"
                        (click)="toggleFavorite(report, $event)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" [attr.fill]="report.isFavorite ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      </button>
                    </div>
                    <p class="card-description">{{ report.description }}</p>
                    <div class="card-meta">
                      <span class="report-type">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                        {{ report.type | titlecase }}
                      </span>
                      @if (report.lastRun) {
                        <span class="last-run">Last run: {{ formatDate(report.lastRun) }}</span>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          } @else if (selectedReport() && !reportResult()) {
            <!-- Report Configuration -->
            <div class="report-config">
              <div class="config-header">
                <button class="back-btn" (click)="clearSelection()">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="19" y1="12" x2="5" y2="12"/>
                    <polyline points="12 19 5 12 12 5"/>
                  </svg>
                  Back to Reports
                </button>
                <button 
                  class="favorite-btn large"
                  [class.active]="selectedReport()!.isFavorite"
                  (click)="toggleFavorite(selectedReport()!, $event)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" [attr.fill]="selectedReport()!.isFavorite ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </button>
              </div>

              <div class="config-content">
                <div class="report-info">
                  <h2>{{ selectedReport()!.name }}</h2>
                  <p>{{ selectedReport()!.description }}</p>
                </div>

                <form [formGroup]="parameterForm" class="parameters-form">
                  <h3>Report Parameters</h3>
                  
                  <div class="parameters-grid">
                    @for (param of selectedReport()!.parameters; track param.id) {
                      <div class="form-group" [class.full-width]="param.type === 'daterange'">
                        <label [for]="param.id">
                          {{ param.label }}
                          @if (param.required) {
                            <span class="required">*</span>
                          }
                        </label>
                        
                        @switch (param.type) {
                          @case ('date') {
                            <input 
                              type="date" 
                              [id]="param.id"
                              [formControlName]="param.id"
                              class="form-control">
                          }
                          @case ('daterange') {
                            <div class="date-range">
                              <input 
                                type="date" 
                                [formControlName]="param.id + '_start'"
                                class="form-control"
                                placeholder="Start Date">
                              <span class="range-separator">to</span>
                              <input 
                                type="date" 
                                [formControlName]="param.id + '_end'"
                                class="form-control"
                                placeholder="End Date">
                            </div>
                          }
                          @case ('select') {
                            <select [id]="param.id" [formControlName]="param.id" class="form-control">
                              <option value="">-- Select --</option>
                              @for (option of param.options; track option.value) {
                                <option [value]="option.value">{{ option.label }}</option>
                              }
                            </select>
                          }
                          @case ('multiselect') {
                            <select 
                              [id]="param.id" 
                              [formControlName]="param.id" 
                              class="form-control"
                              multiple>
                              @for (option of param.options; track option.value) {
                                <option [value]="option.value">{{ option.label }}</option>
                              }
                            </select>
                          }
                          @case ('boolean') {
                            <label class="checkbox-label">
                              <input 
                                type="checkbox" 
                                [id]="param.id"
                                [formControlName]="param.id">
                              <span>{{ param.label }}</span>
                            </label>
                          }
                          @case ('number') {
                            <input 
                              type="number" 
                              [id]="param.id"
                              [formControlName]="param.id"
                              class="form-control">
                          }
                          @default {
                            <input 
                              type="text" 
                              [id]="param.id"
                              [formControlName]="param.id"
                              class="form-control">
                          }
                        }
                      </div>
                    }
                  </div>

                  <div class="output-options">
                    <h3>Output Options</h3>
                    <div class="options-row">
                      <div class="form-group">
                        <label for="outputFormat">Export Format</label>
                        <select id="outputFormat" formControlName="outputFormat" class="form-control">
                          <option value="screen">View on Screen</option>
                          <option value="pdf">PDF Document</option>
                          <option value="excel">Excel Spreadsheet</option>
                          <option value="csv">CSV File</option>
                        </select>
                      </div>
                      <div class="form-group">
                        <label for="maxRows">Maximum Rows</label>
                        <select id="maxRows" formControlName="maxRows" class="form-control">
                          <option value="100">100 rows</option>
                          <option value="500">500 rows</option>
                          <option value="1000">1,000 rows</option>
                          <option value="5000">5,000 rows</option>
                          <option value="all">All rows</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </form>

                <div class="config-actions">
                  <button class="btn btn-secondary" (click)="clearSelection()">Cancel</button>
                  <button class="btn btn-secondary" (click)="scheduleReport()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    Schedule
                  </button>
                  <button 
                    class="btn btn-primary" 
                    (click)="runReport()"
                    [disabled]="isRunning()">
                    @if (isRunning()) {
                      <span class="spinner"></span>
                      Running...
                    } @else {
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                      Run Report
                    }
                  </button>
                </div>
              </div>
            </div>
          } @else if (reportResult()) {
            <!-- Report Results -->
            <div class="report-results">
              <div class="results-header">
                <button class="back-btn" (click)="clearResults()">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="19" y1="12" x2="5" y2="12"/>
                    <polyline points="12 19 5 12 12 5"/>
                  </svg>
                  Back to Parameters
                </button>
                <div class="results-title">
                  <h2>{{ selectedReport()!.name }}</h2>
                  <span class="generated-at">Generated {{ formatDateTime(reportResult()!.generatedAt) }}</span>
                </div>
                <div class="results-actions">
                  <button class="btn btn-secondary" (click)="printResults()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="6 9 6 2 18 2 18 9"/>
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                      <rect x="6" y="14" width="12" height="8"/>
                    </svg>
                    Print
                  </button>
                  <div class="export-dropdown">
                    <button class="btn btn-secondary" (click)="showExportMenu.set(!showExportMenu())">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Export
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </button>
                    @if (showExportMenu()) {
                      <div class="dropdown-menu">
                        <button (click)="exportReport('pdf')">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                          </svg>
                          Export as PDF
                        </button>
                        <button (click)="exportReport('excel')">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <line x1="3" y1="9" x2="21" y2="9"/>
                            <line x1="3" y1="15" x2="21" y2="15"/>
                            <line x1="9" y1="3" x2="9" y2="21"/>
                            <line x1="15" y1="3" x2="15" y2="21"/>
                          </svg>
                          Export as Excel
                        </button>
                        <button (click)="exportReport('csv')">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="8" y1="13" x2="16" y2="13"/>
                            <line x1="8" y1="17" x2="16" y2="17"/>
                          </svg>
                          Export as CSV
                        </button>
                      </div>
                    }
                  </div>
                </div>
              </div>

              <!-- Summary Section -->
              @if (reportResult()!.summary) {
                <div class="results-summary">
                  <h3>{{ reportResult()!.summary!.title }}</h3>
                  <div class="summary-metrics">
                    @for (metric of reportResult()!.summary!.metrics; track metric.label) {
                      <div class="metric-card" [style.borderColor]="metric.color || '#e2e8f0'">
                        <span class="metric-label">{{ metric.label }}</span>
                        <span class="metric-value" [style.color]="metric.color">
                          {{ formatMetricValue(metric) }}
                        </span>
                        @if (metric.trend) {
                          <span class="metric-trend" [class.up]="metric.trend.direction === 'up'" [class.down]="metric.trend.direction === 'down'">
                            @if (metric.trend.direction === 'up') {
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="18 15 12 9 6 15"/>
                              </svg>
                            } @else if (metric.trend.direction === 'down') {
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="6 9 12 15 18 9"/>
                              </svg>
                            }
                            {{ metric.trend.value }}%
                          </span>
                        }
                      </div>
                    }
                  </div>
                  @if (reportResult()!.summary!.insights && reportResult()!.summary!.insights!.length > 0) {
                    <div class="insights">
                      <h4>Key Insights</h4>
                      <ul>
                        @for (insight of reportResult()!.summary!.insights; track insight) {
                          <li>{{ insight }}</li>
                        }
                      </ul>
                    </div>
                  }
                </div>
              }

              <!-- Data Table -->
              <div class="results-table-container">
                <div class="table-toolbar">
                  <div class="table-info">
                    Showing {{ reportResult()!.data.length }} of {{ reportResult()!.pagination?.totalRows || reportResult()!.data.length }} records
                  </div>
                  <div class="table-search">
                    <input 
                      type="text" 
                      placeholder="Filter results..."
                      [value]="tableFilter()"
                      (input)="tableFilter.set($any($event.target).value)">
                  </div>
                </div>

                <div class="table-wrapper">
                  <table class="results-table">
                    <thead>
                      <tr>
                        @for (column of reportResult()!.columns; track column.id) {
                          @if (!column.hidden) {
                            <th 
                              [class.sortable]="column.sortable"
                              [style.width]="column.width"
                              (click)="column.sortable && sortBy(column.id)">
                              {{ column.label }}
                              @if (column.sortable) {
                                <span class="sort-indicator" [class.active]="sortColumn() === column.id">
                                  @if (sortColumn() === column.id) {
                                    @if (sortDirection() === 'asc') {
                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="18 15 12 9 6 15"/>
                                      </svg>
                                    } @else {
                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="6 9 12 15 18 9"/>
                                      </svg>
                                    }
                                  } @else {
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity: 0.3">
                                      <polyline points="6 9 12 15 18 9"/>
                                    </svg>
                                  }
                                </span>
                              }
                            </th>
                          }
                        }
                      </tr>
                    </thead>
                    <tbody>
                      @for (row of sortedAndFilteredData(); track $index) {
                        <tr>
                          @for (column of reportResult()!.columns; track column.id) {
                            @if (!column.hidden) {
                              <td [class]="'type-' + column.type">
                                {{ formatCellValue(row[column.id], column) }}
                              </td>
                            }
                          }
                        </tr>
                      }
                    </tbody>
                    @if (reportResult()!.totals) {
                      <tfoot>
                        <tr class="totals-row">
                          @for (column of reportResult()!.columns; track column.id; let first = $first) {
                            @if (!column.hidden) {
                              <td [class]="'type-' + column.type">
                                @if (first) {
                                  <strong>Totals</strong>
                                } @else if (reportResult()!.totals![column.id] !== undefined) {
                                  <strong>{{ formatCellValue(reportResult()!.totals![column.id], column) }}</strong>
                                }
                              </td>
                            }
                          }
                        </tr>
                      </tfoot>
                    }
                  </table>
                </div>

                @if (reportResult()!.pagination && reportResult()!.pagination!.totalPages > 1) {
                  <div class="table-pagination">
                    <button 
                      class="btn btn-sm"
                      [disabled]="currentPage() === 1"
                      (click)="goToPage(currentPage() - 1)">
                      Previous
                    </button>
                    <span class="page-info">
                      Page {{ currentPage() }} of {{ reportResult()!.pagination!.totalPages }}
                    </span>
                    <button 
                      class="btn btn-sm"
                      [disabled]="currentPage() === reportResult()!.pagination!.totalPages"
                      (click)="goToPage(currentPage() + 1)">
                      Next
                    </button>
                  </div>
                }
              </div>
            </div>
          }
        </main>
      </div>

      <!-- Recent Executions Modal -->
      @if (showRecentModal()) {
        <div class="modal-overlay" (click)="showRecentModal.set(false)">
          <div class="modal recent-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Recent Report Executions</h2>
              <button class="close-btn" (click)="showRecentModal.set(false)">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <table class="executions-table">
                <thead>
                  <tr>
                    <th>Report</th>
                    <th>Run Date</th>
                    <th>Status</th>
                    <th>Duration</th>
                    <th>Rows</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (execution of recentExecutions(); track execution.id) {
                    <tr>
                      <td>{{ execution.reportName }}</td>
                      <td>{{ formatDateTime(execution.startTime) }}</td>
                      <td>
                        <span class="status-badge" [class]="execution.status">
                          {{ execution.status }}
                        </span>
                      </td>
                      <td>{{ execution.duration ? execution.duration + 's' : '-' }}</td>
                      <td>{{ execution.rowCount || '-' }}</td>
                      <td>
                        @if (execution.status === 'completed') {
                          <button class="btn btn-sm" (click)="viewExecution(execution)">View</button>
                          <button class="btn btn-sm" (click)="downloadExecution(execution)">Download</button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .clinical-reports {
      padding: 1.5rem;
      max-width: 1600px;
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
      margin: 0.25rem 0 0 0;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
      border: 1px solid transparent;
    }

    .btn-primary {
      background: #2563eb;
      color: white;
      border-color: #2563eb;
    }

    .btn-primary:hover:not(:disabled) {
      background: #1d4ed8;
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: white;
      color: #374151;
      border-color: #d1d5db;
    }

    .btn-secondary:hover {
      background: #f9fafb;
      border-color: #9ca3af;
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
    }

    .reports-layout {
      display: grid;
      grid-template-columns: 260px 1fr;
      gap: 1.5rem;
    }

    .reports-sidebar {
      background: white;
      border-radius: 0.75rem;
      border: 1px solid #e2e8f0;
      padding: 1rem;
      height: fit-content;
      position: sticky;
      top: 1rem;
    }

    .sidebar-section {
      margin-bottom: 1.5rem;
    }

    .sidebar-section:last-child {
      margin-bottom: 0;
    }

    .sidebar-section h3 {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin: 0 0 0.75rem 0;
    }

    .category-nav {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .category-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 0.75rem;
      border: none;
      background: transparent;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.15s;
      text-align: left;
      width: 100%;
    }

    .category-item:hover {
      background: #f1f5f9;
    }

    .category-item.active {
      background: #eff6ff;
      color: #2563eb;
    }

    .category-icon {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .category-name {
      flex: 1;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .category-count {
      font-size: 0.75rem;
      color: #64748b;
      background: #f1f5f9;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
    }

    .category-item.active .category-count {
      background: #dbeafe;
      color: #2563eb;
    }

    .favorites-list {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .favorite-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      border: none;
      background: transparent;
      border-radius: 0.375rem;
      cursor: pointer;
      font-size: 0.8125rem;
      color: #374151;
      text-align: left;
      width: 100%;
    }

    .favorite-item:hover {
      background: #fef3c7;
    }

    .favorite-item svg {
      color: #f59e0b;
    }

    .empty-text {
      font-size: 0.8125rem;
      color: #94a3b8;
      text-align: center;
      padding: 1rem;
    }

    .reports-main {
      min-height: 500px;
    }

    .report-list-container {
      background: white;
      border-radius: 0.75rem;
      border: 1px solid #e2e8f0;
      padding: 1.5rem;
    }

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .list-header h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      background: #f8fafc;
    }

    .search-box svg {
      color: #94a3b8;
    }

    .search-box input {
      border: none;
      background: transparent;
      outline: none;
      font-size: 0.875rem;
      width: 200px;
    }

    .report-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
    }

    .report-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.15s;
    }

    .report-card:hover {
      border-color: #2563eb;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.1);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.5rem;
    }

    .card-header h3 {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .favorite-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0.25rem;
      color: #94a3b8;
      transition: color 0.15s;
    }

    .favorite-btn:hover,
    .favorite-btn.active {
      color: #f59e0b;
    }

    .favorite-btn.large {
      padding: 0.5rem;
    }

    .card-description {
      font-size: 0.8125rem;
      color: #64748b;
      margin: 0 0 0.75rem 0;
      line-height: 1.4;
    }

    .card-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .report-type {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .report-config {
      background: white;
      border-radius: 0.75rem;
      border: 1px solid #e2e8f0;
    }

    .config-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .back-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 0.875rem;
      color: #64748b;
      border-radius: 0.375rem;
    }

    .back-btn:hover {
      background: #f1f5f9;
      color: #374151;
    }

    .config-content {
      padding: 1.5rem;
    }

    .report-info h2 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 0.5rem 0;
    }

    .report-info p {
      color: #64748b;
      margin: 0 0 1.5rem 0;
    }

    .parameters-form h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 1rem 0;
    }

    .parameters-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .form-group.full-width {
      grid-column: span 2;
    }

    .form-group label {
      font-size: 0.8125rem;
      font-weight: 500;
      color: #374151;
    }

    .required {
      color: #ef4444;
    }

    .form-control {
      padding: 0.625rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      transition: border-color 0.15s, box-shadow 0.15s;
    }

    .form-control:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .date-range {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .date-range input {
      flex: 1;
    }

    .range-separator {
      color: #64748b;
      font-size: 0.875rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    .checkbox-label input {
      width: 1rem;
      height: 1rem;
    }

    .output-options {
      border-top: 1px solid #e2e8f0;
      padding-top: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .options-row {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .config-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid #ffffff;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .report-results {
      background: white;
      border-radius: 0.75rem;
      border: 1px solid #e2e8f0;
    }

    .results-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .results-title {
      flex: 1;
    }

    .results-title h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .generated-at {
      font-size: 0.8125rem;
      color: #64748b;
    }

    .results-actions {
      display: flex;
      gap: 0.5rem;
    }

    .export-dropdown {
      position: relative;
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 0.25rem;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      z-index: 10;
      min-width: 160px;
    }

    .dropdown-menu button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.625rem 1rem;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 0.875rem;
      color: #374151;
      text-align: left;
    }

    .dropdown-menu button:hover {
      background: #f1f5f9;
    }

    .results-summary {
      padding: 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      background: #f8fafc;
    }

    .results-summary h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 1rem 0;
    }

    .summary-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .metric-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-left-width: 3px;
      border-radius: 0.5rem;
      padding: 1rem;
    }

    .metric-label {
      display: block;
      font-size: 0.75rem;
      color: #64748b;
      margin-bottom: 0.25rem;
    }

    .metric-value {
      display: block;
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
    }

    .metric-trend {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }

    .metric-trend.up {
      color: #16a34a;
    }

    .metric-trend.down {
      color: #dc2626;
    }

    .insights {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 1rem;
    }

    .insights h4 {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 0.75rem 0;
    }

    .insights ul {
      margin: 0;
      padding-left: 1.25rem;
    }

    .insights li {
      font-size: 0.875rem;
      color: #475569;
      margin-bottom: 0.5rem;
    }

    .insights li:last-child {
      margin-bottom: 0;
    }

    .results-table-container {
      padding: 1.5rem;
    }

    .table-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .table-info {
      font-size: 0.875rem;
      color: #64748b;
    }

    .table-search input {
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      width: 200px;
    }

    .table-wrapper {
      overflow-x: auto;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
    }

    .results-table {
      width: 100%;
      border-collapse: collapse;
    }

    .results-table th,
    .results-table td {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }

    .results-table th {
      background: #f8fafc;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
    }

    .results-table th.sortable {
      cursor: pointer;
      user-select: none;
    }

    .results-table th.sortable:hover {
      background: #f1f5f9;
    }

    .sort-indicator {
      margin-left: 0.25rem;
      vertical-align: middle;
    }

    .sort-indicator.active {
      color: #2563eb;
    }

    .results-table td {
      font-size: 0.875rem;
      color: #374151;
    }

    .results-table tbody tr:hover {
      background: #f8fafc;
    }

    .results-table td.type-currency,
    .results-table td.type-number,
    .results-table td.type-percentage {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    .totals-row {
      background: #f8fafc;
    }

    .totals-row td {
      border-top: 2px solid #e2e8f0;
    }

    .table-pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 1rem;
    }

    .page-info {
      font-size: 0.875rem;
      color: #64748b;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: white;
      border-radius: 0.75rem;
      width: 90%;
      max-width: 900px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .modal-header h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .close-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      color: #64748b;
      padding: 0.25rem;
    }

    .close-btn:hover {
      color: #374151;
    }

    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
    }

    .executions-table {
      width: 100%;
      border-collapse: collapse;
    }

    .executions-table th,
    .executions-table td {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }

    .executions-table th {
      background: #f8fafc;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
    }

    .executions-table td {
      font-size: 0.875rem;
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-badge.completed {
      background: #dcfce7;
      color: #16a34a;
    }

    .status-badge.running {
      background: #dbeafe;
      color: #2563eb;
    }

    .status-badge.failed {
      background: #fee2e2;
      color: #dc2626;
    }

    .status-badge.pending {
      background: #fef3c7;
      color: #d97706;
    }

    @media (max-width: 1024px) {
      .reports-layout {
        grid-template-columns: 1fr;
      }

      .reports-sidebar {
        position: static;
        display: flex;
        gap: 2rem;
      }

      .sidebar-section {
        margin-bottom: 0;
      }

      .category-nav {
        flex-direction: row;
        flex-wrap: wrap;
      }

      .parameters-grid {
        grid-template-columns: 1fr;
      }

      .form-group.full-width {
        grid-column: span 1;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClinicalReportsComponent implements OnInit {
  private reportsService = inject(ReportsService);
  private fb = inject(FormBuilder);
  private sanitizer = inject(DomSanitizer);

  // State
  selectedCategory = signal<string>('all');
  searchQuery = signal('');
  selectedReport = signal<ReportDefinition | null>(null);
  reportResult = signal<ReportResult | null>(null);
  isRunning = signal(false);
  showExportMenu = signal(false);
  showRecentModal = signal(false);
  showScheduledReports = signal(false);
  tableFilter = signal('');
  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');
  currentPage = signal(1);

  // Data
  recentExecutions = this.reportsService.recentExecutions;

  parameterForm!: FormGroup;

  reportCategories = [
    { id: 'all', name: 'All Reports', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' },
    { id: 'patient', name: 'Patient Lists', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
    { id: 'appointment', name: 'Appointments', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' },
    { id: 'encounter', name: 'Encounters', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>' },
    { id: 'prescription', name: 'Prescriptions', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>' },
    { id: 'lab', name: 'Lab Results', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3h6v11l4 4H5l4-4V3z"/><path d="M6 21h12"/></svg>' },
    { id: 'immunization', name: 'Immunizations', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m18 2 4 4-4 4"/><path d="m17 6-8 8"/><path d="m5 14-2 2v4h4l2-2"/><path d="m5 22 6-6"/></svg>' }
  ];

  // Computed
  allClinicalReports = computed(() => {
    return this.reportsService.clinicalReports();
  });

  filteredReports = computed(() => {
    let reports = this.allClinicalReports();
    
    if (this.selectedCategory() !== 'all') {
      reports = reports.filter(r => {
        const name = r.name.toLowerCase();
        const cat = this.selectedCategory();
        if (cat === 'patient') return name.includes('patient');
        if (cat === 'appointment') return name.includes('appointment');
        if (cat === 'encounter') return name.includes('encounter');
        if (cat === 'prescription') return name.includes('prescription');
        if (cat === 'lab') return name.includes('lab');
        if (cat === 'immunization') return name.includes('immunization');
        return true;
      });
    }

    const query = this.searchQuery().toLowerCase();
    if (query) {
      reports = reports.filter(r => 
        r.name.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query)
      );
    }

    return reports;
  });

  favoriteReports = computed(() => {
    return this.allClinicalReports().filter(r => r.isFavorite);
  });

  sortedAndFilteredData = computed(() => {
    const result = this.reportResult();
    if (!result) return [];

    let data = [...result.data];

    // Filter
    const filter = this.tableFilter().toLowerCase();
    if (filter) {
      data = data.filter(row => 
        Object.values(row).some(val => 
          String(val).toLowerCase().includes(filter)
        )
      );
    }

    // Sort
    const column = this.sortColumn();
    if (column) {
      const direction = this.sortDirection();
      data.sort((a, b) => {
        const aVal = a[column];
        const bVal = b[column];
        let comparison = 0;
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }
        return direction === 'asc' ? comparison : -comparison;
      });
    }

    return data;
  });

  ngOnInit(): void {
    this.reportsService.getReportDefinitions().subscribe();
  }

  selectCategory(categoryId: string): void {
    this.selectedCategory.set(categoryId);
    this.searchQuery.set('');
  }

  getCategoryCount(categoryId: string): number {
    if (categoryId === 'all') return this.allClinicalReports().length;
    return this.filteredReports().length;
  }

  getCategoryName(categoryId: string): string {
    const category = this.reportCategories.find(c => c.id === categoryId);
    return category?.name || 'All Reports';
  }

  selectReport(report: ReportDefinition): void {
    this.selectedReport.set(report);
    this.buildParameterForm(report);
  }

  buildParameterForm(report: ReportDefinition): void {
    const controls: { [key: string]: any } = {};
    
    for (const param of report.parameters) {
      if (param.type === 'daterange') {
        controls[param.id + '_start'] = [param.defaultValue?.start || ''];
        controls[param.id + '_end'] = [param.defaultValue?.end || ''];
      } else {
        controls[param.id] = [param.defaultValue || ''];
      }
    }

    controls['outputFormat'] = ['screen'];
    controls['maxRows'] = ['500'];

    this.parameterForm = this.fb.group(controls);
  }

  clearSelection(): void {
    this.selectedReport.set(null);
  }

  clearResults(): void {
    this.reportResult.set(null);
    this.tableFilter.set('');
    this.sortColumn.set('');
    this.sortDirection.set('asc');
  }

  toggleFavorite(report: ReportDefinition, event: Event): void {
    event.stopPropagation();
    this.reportsService.toggleFavorite(report.id);
  }

  runReport(): void {
    const report = this.selectedReport();
    if (!report) return;

    this.isRunning.set(true);
    const params = this.parameterForm.value;

    this.reportsService.executeReport(report.id, params).subscribe({
      next: (result) => {
        this.reportResult.set(result);
        this.isRunning.set(false);
      },
      error: () => {
        this.isRunning.set(false);
      }
    });
  }

  scheduleReport(): void {
    // Would open schedule dialog
    console.log('Schedule report');
  }

  viewRecentExecutions(): void {
    this.showRecentModal.set(true);
  }

  viewExecution(execution: ReportExecution): void {
    // Would load and display execution results
    console.log('View execution', execution.id);
  }

  downloadExecution(execution: ReportExecution): void {
    // Would download the execution output
    console.log('Download execution', execution.id);
  }

  sortBy(columnId: string): void {
    if (this.sortColumn() === columnId) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(columnId);
      this.sortDirection.set('asc');
    }
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
  }

  printResults(): void {
    window.print();
  }

  exportReport(format: string): void {
    this.showExportMenu.set(false);
    const result = this.reportResult();
    if (!result) return;
    
    this.reportsService.exportReport(result.executionId, format as any).subscribe(result => {
      // Would trigger download
      console.log('Export URL:', result.downloadUrl);
    });
  }

  formatDate(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatDateTime(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  formatMetricValue(metric: any): string {
    const value = metric.value;
    const format = metric.format;
    
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    }
    if (format === 'percentage') {
      return value.toFixed(1) + '%';
    }
    if (format === 'number') {
      return new Intl.NumberFormat('en-US').format(value);
    }
    return String(value);
  }

  formatCellValue(value: any, column: any): string {
    if (value === null || value === undefined) return '-';
    
    switch (column.type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
      case 'percentage':
        return (typeof value === 'number' ? value.toFixed(1) : value) + '%';
      case 'number':
        return new Intl.NumberFormat('en-US').format(value);
      case 'date':
        return this.formatDate(value);
      case 'datetime':
        return this.formatDateTime(value);
      case 'boolean':
        return value ? 'Yes' : 'No';
      default:
        return String(value);
    }
  }

  sanitizeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
