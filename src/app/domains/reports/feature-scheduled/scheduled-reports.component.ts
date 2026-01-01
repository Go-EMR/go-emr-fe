import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

interface ScheduledReport {
  id: string;
  name: string;
  description: string;
  reportType: 'clinical' | 'financial' | 'operational' | 'quality' | 'custom';
  reportConfig: any;
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
    timezone: string;
  };
  recipients: Recipient[];
  outputFormat: 'pdf' | 'excel' | 'csv';
  status: 'active' | 'paused' | 'error';
  createdBy: string;
  createdAt: Date;
  lastRun?: Date;
  nextRun?: Date;
  runCount: number;
}

interface Recipient {
  id: string;
  name: string;
  email: string;
  type: 'user' | 'group' | 'external';
}

interface ExecutionHistory {
  id: string;
  scheduledReportId: string;
  reportName: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  outputFile?: string;
  fileSize?: number;
  rowCount?: number;
  errorMessage?: string;
  recipients: string[];
  deliveryStatus: 'pending' | 'sent' | 'failed';
}

@Component({
  selector: 'app-scheduled-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="scheduled-reports">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="title-section">
            <h1>Scheduled Reports</h1>
            <p class="subtitle">Manage automated report generation and distribution</p>
          </div>
          <div class="header-actions">
            <button class="btn btn-secondary" (click)="refreshData()">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              Refresh
            </button>
            <button class="btn btn-primary" (click)="openCreateModal()">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New Schedule
            </button>
          </div>
        </div>
      </header>

      <!-- Tabs -->
      <div class="tabs">
        <button 
          class="tab" 
          [class.active]="activeTab() === 'schedules'"
          (click)="activeTab.set('schedules')"
        >
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Schedules
          <span class="badge">{{ scheduledReports().length }}</span>
        </button>
        <button 
          class="tab" 
          [class.active]="activeTab() === 'history'"
          (click)="activeTab.set('history')"
        >
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          Execution History
          <span class="badge">{{ executionHistory().length }}</span>
        </button>
        <button 
          class="tab" 
          [class.active]="activeTab() === 'outputs'"
          (click)="activeTab.set('outputs')"
        >
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          Output Files
        </button>
      </div>

      <!-- Schedules Tab -->
      @if (activeTab() === 'schedules') {
        <div class="schedules-content">
          <!-- Summary Cards -->
          <div class="summary-cards">
            <div class="summary-card">
              <div class="card-icon active">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <div class="card-content">
                <span class="card-value">{{ activeSchedules() }}</span>
                <span class="card-label">Active Schedules</span>
              </div>
            </div>
            <div class="summary-card">
              <div class="card-icon paused">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="10" y1="15" x2="10" y2="9"/>
                  <line x1="14" y1="15" x2="14" y2="9"/>
                </svg>
              </div>
              <div class="card-content">
                <span class="card-value">{{ pausedSchedules() }}</span>
                <span class="card-label">Paused</span>
              </div>
            </div>
            <div class="summary-card">
              <div class="card-icon error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <div class="card-content">
                <span class="card-value">{{ errorSchedules() }}</span>
                <span class="card-label">Errors</span>
              </div>
            </div>
            <div class="summary-card">
              <div class="card-icon next">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div class="card-content">
                <span class="card-value">{{ nextRunTime() }}</span>
                <span class="card-label">Next Execution</span>
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
                placeholder="Search schedules..."
                [ngModel]="searchQuery()"
                (ngModelChange)="searchQuery.set($event)"
              />
            </div>
            <div class="filter-group">
              <select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event)">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="error">Error</option>
              </select>
              <select [ngModel]="typeFilter()" (ngModelChange)="typeFilter.set($event)">
                <option value="all">All Types</option>
                <option value="clinical">Clinical</option>
                <option value="financial">Financial</option>
                <option value="operational">Operational</option>
                <option value="quality">Quality</option>
                <option value="custom">Custom</option>
              </select>
              <select [ngModel]="frequencyFilter()" (ngModelChange)="frequencyFilter.set($event)">
                <option value="all">All Frequencies</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
          </div>

          <!-- Schedules Table -->
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Report Name</th>
                  <th>Type</th>
                  <th>Frequency</th>
                  <th>Next Run</th>
                  <th>Last Run</th>
                  <th>Status</th>
                  <th>Recipients</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (schedule of filteredSchedules(); track schedule.id) {
                  <tr>
                    <td>
                      <div class="report-name">
                        <strong>{{ schedule.name }}</strong>
                        <span class="description">{{ schedule.description }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="type-badge" [class]="schedule.reportType">
                        {{ schedule.reportType | titlecase }}
                      </span>
                    </td>
                    <td>
                      <div class="frequency-info">
                        <span class="frequency">{{ schedule.schedule.frequency | titlecase }}</span>
                        <span class="time">{{ schedule.schedule.time }}</span>
                      </div>
                    </td>
                    <td>
                      @if (schedule.nextRun) {
                        <span class="next-run">{{ formatDateTime(schedule.nextRun) }}</span>
                      } @else {
                        <span class="no-date">--</span>
                      }
                    </td>
                    <td>
                      @if (schedule.lastRun) {
                        <span class="last-run">{{ formatDateTime(schedule.lastRun) }}</span>
                      } @else {
                        <span class="no-date">Never</span>
                      }
                    </td>
                    <td>
                      <span class="status-badge" [class]="schedule.status">
                        {{ schedule.status | titlecase }}
                      </span>
                    </td>
                    <td>
                      <div class="recipients-info">
                        <span class="count">{{ schedule.recipients.length }} recipient(s)</span>
                        <button class="btn-icon" (click)="viewRecipients(schedule)" title="View recipients">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td>
                      <div class="action-buttons">
                        @if (schedule.status === 'active') {
                          <button class="btn-icon" (click)="pauseSchedule(schedule)" title="Pause">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <circle cx="12" cy="12" r="10"/>
                              <line x1="10" y1="15" x2="10" y2="9"/>
                              <line x1="14" y1="15" x2="14" y2="9"/>
                            </svg>
                          </button>
                        } @else {
                          <button class="btn-icon" (click)="resumeSchedule(schedule)" title="Resume">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <circle cx="12" cy="12" r="10"/>
                              <polygon points="10 8 16 12 10 16 10 8"/>
                            </svg>
                          </button>
                        }
                        <button class="btn-icon" (click)="runNow(schedule)" title="Run now">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="5 3 19 12 5 21 5 3"/>
                          </svg>
                        </button>
                        <button class="btn-icon" (click)="editSchedule(schedule)" title="Edit">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button class="btn-icon danger" (click)="deleteSchedule(schedule)" title="Delete">
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
                    <td colspan="8" class="empty-state">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      <p>No scheduled reports found</p>
                      <button class="btn btn-primary" (click)="openCreateModal()">Create Schedule</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- History Tab -->
      @if (activeTab() === 'history') {
        <div class="history-content">
          <!-- History Filters -->
          <div class="filters-bar">
            <div class="search-box">
              <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input 
                type="text" 
                placeholder="Search history..."
                [ngModel]="historySearch()"
                (ngModelChange)="historySearch.set($event)"
              />
            </div>
            <div class="filter-group">
              <select [ngModel]="historyStatusFilter()" (ngModelChange)="historyStatusFilter.set($event)">
                <option value="all">All Status</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <div class="date-range">
                <input 
                  type="date" 
                  [ngModel]="historyStartDate()" 
                  (ngModelChange)="historyStartDate.set($event)"
                />
                <span>to</span>
                <input 
                  type="date" 
                  [ngModel]="historyEndDate()" 
                  (ngModelChange)="historyEndDate.set($event)"
                />
              </div>
            </div>
          </div>

          <!-- History Stats -->
          <div class="history-stats">
            <div class="stat-item">
              <span class="stat-value completed">{{ completedRuns() }}</span>
              <span class="stat-label">Completed</span>
            </div>
            <div class="stat-item">
              <span class="stat-value failed">{{ failedRuns() }}</span>
              <span class="stat-label">Failed</span>
            </div>
            <div class="stat-item">
              <span class="stat-value running">{{ runningRuns() }}</span>
              <span class="stat-label">Running</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ avgRunTime() }}</span>
              <span class="stat-label">Avg Run Time</span>
            </div>
          </div>

          <!-- History Table -->
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Started</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Rows</th>
                  <th>File Size</th>
                  <th>Delivery</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (run of filteredHistory(); track run.id) {
                  <tr [class.error-row]="run.status === 'failed'">
                    <td>
                      <strong>{{ run.reportName }}</strong>
                    </td>
                    <td>{{ formatDateTime(run.startTime) }}</td>
                    <td>
                      @if (run.endTime) {
                        {{ calculateDuration(run.startTime, run.endTime) }}
                      } @else if (run.status === 'running') {
                        <span class="running-indicator">
                          <span class="spinner"></span>
                          Running...
                        </span>
                      } @else {
                        --
                      }
                    </td>
                    <td>
                      <span class="status-badge" [class]="run.status">
                        {{ run.status | titlecase }}
                      </span>
                    </td>
                    <td>{{ run.rowCount ?? '--' }}</td>
                    <td>{{ run.fileSize ? formatFileSize(run.fileSize) : '--' }}</td>
                    <td>
                      <span class="delivery-badge" [class]="run.deliveryStatus">
                        {{ run.deliveryStatus | titlecase }}
                      </span>
                    </td>
                    <td>
                      <div class="action-buttons">
                        @if (run.outputFile) {
                          <button class="btn-icon" (click)="downloadOutput(run)" title="Download">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                              <polyline points="7 10 12 15 17 10"/>
                              <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                          </button>
                        }
                        @if (run.status === 'failed') {
                          <button class="btn-icon" (click)="viewError(run)" title="View error">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <circle cx="12" cy="12" r="10"/>
                              <line x1="12" y1="8" x2="12" y2="12"/>
                              <line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                          </button>
                        }
                        <button class="btn-icon" (click)="retryRun(run)" title="Retry">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="8" class="empty-state">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      <p>No execution history found</p>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Outputs Tab -->
      @if (activeTab() === 'outputs') {
        <div class="outputs-content">
          <!-- Output Files Grid -->
          <div class="outputs-header">
            <h3>Recent Output Files</h3>
            <div class="storage-info">
              <span class="storage-used">{{ totalStorageUsed() }} used</span>
              <span class="storage-limit">of 10 GB</span>
            </div>
          </div>

          <div class="outputs-grid">
            @for (output of recentOutputs(); track output.id) {
              <div class="output-card">
                <div class="file-icon" [class]="getFileType(output.outputFile!)">
                  @switch (getFileType(output.outputFile!)) {
                    @case ('pdf') {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                    }
                    @case ('excel') {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <path d="M8 13h2M8 17h2M14 13h2M14 17h2"/>
                      </svg>
                    }
                    @case ('csv') {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                    }
                  }
                </div>
                <div class="file-info">
                  <strong class="file-name">{{ output.reportName }}</strong>
                  <span class="file-date">{{ formatDateTime(output.endTime!) }}</span>
                  <span class="file-size">{{ formatFileSize(output.fileSize!) }}</span>
                </div>
                <div class="file-actions">
                  <button class="btn-icon" (click)="downloadOutput(output)" title="Download">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  </button>
                  <button class="btn-icon" (click)="shareOutput(output)" title="Share">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="18" cy="5" r="3"/>
                      <circle cx="6" cy="12" r="3"/>
                      <circle cx="18" cy="19" r="3"/>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                  </button>
                  <button class="btn-icon danger" (click)="deleteOutput(output)" title="Delete">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            } @empty {
              <div class="empty-outputs">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <p>No output files yet</p>
                <span>Run a scheduled report to generate output files</span>
              </div>
            }
          </div>
        </div>
      }

      <!-- Create/Edit Modal -->
      @if (showScheduleModal()) {
        <div class="modal-overlay" (click)="closeScheduleModal()">
          <div class="modal schedule-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ editingSchedule() ? 'Edit Schedule' : 'Create Schedule' }}</h2>
              <button class="btn-close" (click)="closeScheduleModal()">×</button>
            </div>
            <div class="modal-body">
              <form [formGroup]="scheduleForm">
                <!-- Basic Info -->
                <div class="form-section">
                  <h3>Basic Information</h3>
                  <div class="form-group">
                    <label for="name">Schedule Name *</label>
                    <input id="name" type="text" formControlName="name" placeholder="Enter schedule name" />
                  </div>
                  <div class="form-group">
                    <label for="description">Description</label>
                    <textarea id="description" formControlName="description" placeholder="Enter description" rows="2"></textarea>
                  </div>
                </div>

                <!-- Report Selection -->
                <div class="form-section">
                  <h3>Report</h3>
                  <div class="form-row">
                    <div class="form-group">
                      <label for="reportType">Report Type *</label>
                      <select id="reportType" formControlName="reportType">
                        <option value="">Select type...</option>
                        <option value="clinical">Clinical</option>
                        <option value="financial">Financial</option>
                        <option value="operational">Operational</option>
                        <option value="quality">Quality</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label for="outputFormat">Output Format *</label>
                      <select id="outputFormat" formControlName="outputFormat">
                        <option value="pdf">PDF</option>
                        <option value="excel">Excel</option>
                        <option value="csv">CSV</option>
                      </select>
                    </div>
                  </div>
                </div>

                <!-- Schedule Configuration -->
                <div class="form-section">
                  <h3>Schedule</h3>
                  <div class="form-row">
                    <div class="form-group">
                      <label for="frequency">Frequency *</label>
                      <select id="frequency" formControlName="frequency">
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label for="time">Time *</label>
                      <input id="time" type="time" formControlName="time" />
                    </div>
                  </div>
                  @if (scheduleForm.get('frequency')?.value === 'weekly') {
                    <div class="form-group">
                      <label for="dayOfWeek">Day of Week</label>
                      <select id="dayOfWeek" formControlName="dayOfWeek">
                        <option value="0">Sunday</option>
                        <option value="1">Monday</option>
                        <option value="2">Tuesday</option>
                        <option value="3">Wednesday</option>
                        <option value="4">Thursday</option>
                        <option value="5">Friday</option>
                        <option value="6">Saturday</option>
                      </select>
                    </div>
                  }
                  @if (scheduleForm.get('frequency')?.value === 'monthly' || scheduleForm.get('frequency')?.value === 'quarterly') {
                    <div class="form-group">
                      <label for="dayOfMonth">Day of Month</label>
                      <select id="dayOfMonth" formControlName="dayOfMonth">
                        @for (day of daysOfMonth; track day) {
                          <option [value]="day">{{ day }}</option>
                        }
                      </select>
                    </div>
                  }
                </div>

                <!-- Recipients -->
                <div class="form-section">
                  <h3>Recipients</h3>
                  <div class="recipients-list">
                    @for (recipient of selectedRecipients(); track recipient.id) {
                      <div class="recipient-chip">
                        <span class="recipient-name">{{ recipient.name }}</span>
                        <span class="recipient-email">{{ recipient.email }}</span>
                        <button type="button" class="remove-recipient" (click)="removeRecipient(recipient)">×</button>
                      </div>
                    }
                  </div>
                  <div class="add-recipient">
                    <input 
                      type="email" 
                      placeholder="Enter email address"
                      [ngModel]="newRecipientEmail()"
                      (ngModelChange)="newRecipientEmail.set($event)"
                      [ngModelOptions]="{standalone: true}"
                      (keyup.enter)="addRecipient()"
                    />
                    <button type="button" class="btn btn-secondary" (click)="addRecipient()">Add</button>
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeScheduleModal()">Cancel</button>
              <button 
                class="btn btn-primary" 
                (click)="saveSchedule()"
                [disabled]="scheduleForm.invalid"
              >
                {{ editingSchedule() ? 'Update' : 'Create' }} Schedule
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Recipients Modal -->
      @if (showRecipientsModal()) {
        <div class="modal-overlay" (click)="closeRecipientsModal()">
          <div class="modal recipients-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Recipients for {{ viewingSchedule()?.name }}</h2>
              <button class="btn-close" (click)="closeRecipientsModal()">×</button>
            </div>
            <div class="modal-body">
              <div class="recipients-table">
                @for (recipient of viewingSchedule()?.recipients; track recipient.id) {
                  <div class="recipient-row">
                    <div class="recipient-icon" [class]="recipient.type">
                      @switch (recipient.type) {
                        @case ('user') {
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                          </svg>
                        }
                        @case ('group') {
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                          </svg>
                        }
                        @case ('external') {
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="4"/>
                            <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/>
                          </svg>
                        }
                      }
                    </div>
                    <div class="recipient-details">
                      <strong>{{ recipient.name }}</strong>
                      <span>{{ recipient.email }}</span>
                    </div>
                    <span class="recipient-type-badge" [class]="recipient.type">
                      {{ recipient.type | titlecase }}
                    </span>
                  </div>
                }
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-primary" (click)="closeRecipientsModal()">Close</button>
            </div>
          </div>
        </div>
      }

      <!-- Error Modal -->
      @if (showErrorModal()) {
        <div class="modal-overlay" (click)="closeErrorModal()">
          <div class="modal error-modal" (click)="$event.stopPropagation()">
            <div class="modal-header error">
              <h2>Execution Error</h2>
              <button class="btn-close" (click)="closeErrorModal()">×</button>
            </div>
            <div class="modal-body">
              <div class="error-details">
                <div class="error-info">
                  <strong>Report:</strong> {{ viewingError()?.reportName }}
                </div>
                <div class="error-info">
                  <strong>Time:</strong> {{ formatDateTime(viewingError()?.startTime!) }}
                </div>
                <div class="error-message">
                  <strong>Error Message:</strong>
                  <pre>{{ viewingError()?.errorMessage }}</pre>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeErrorModal()">Close</button>
              <button class="btn btn-primary" (click)="retryRun(viewingError()!)">Retry</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .scheduled-reports {
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

    .btn .icon {
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

    .btn-icon.danger:hover {
      background: #fef2f2;
      color: #ef4444;
    }

    .btn-icon svg {
      width: 1rem;
      height: 1rem;
    }

    /* Tabs */
    .tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 0;
    }

    .tab {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border: none;
      background: transparent;
      color: #64748b;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      transition: all 0.2s;
    }

    .tab:hover {
      color: #3b82f6;
    }

    .tab.active {
      color: #3b82f6;
      border-bottom-color: #3b82f6;
    }

    .tab .icon {
      width: 1rem;
      height: 1rem;
    }

    .tab .badge {
      background: #e2e8f0;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
    }

    .tab.active .badge {
      background: #dbeafe;
      color: #3b82f6;
    }

    /* Summary Cards */
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .summary-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
    }

    .card-icon {
      width: 3rem;
      height: 3rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.75rem;
    }

    .card-icon svg {
      width: 1.5rem;
      height: 1.5rem;
    }

    .card-icon.active {
      background: #dcfce7;
      color: #16a34a;
    }

    .card-icon.paused {
      background: #fef3c7;
      color: #d97706;
    }

    .card-icon.error {
      background: #fee2e2;
      color: #dc2626;
    }

    .card-icon.next {
      background: #dbeafe;
      color: #3b82f6;
    }

    .card-content {
      display: flex;
      flex-direction: column;
    }

    .card-value {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
    }

    .card-label {
      font-size: 0.75rem;
      color: #64748b;
    }

    /* Filters Bar */
    .filters-bar {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .search-box {
      position: relative;
      flex: 1;
      min-width: 200px;
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
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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

    /* Table */
    .table-container {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      overflow: hidden;
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
    }

    .data-table tbody tr:hover {
      background: #f8fafc;
    }

    .data-table tbody tr.error-row {
      background: #fef2f2;
    }

    .report-name {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .report-name strong {
      font-weight: 500;
    }

    .report-name .description {
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

    .type-badge.clinical { background: #dbeafe; color: #1d4ed8; }
    .type-badge.financial { background: #dcfce7; color: #16a34a; }
    .type-badge.operational { background: #fef3c7; color: #d97706; }
    .type-badge.quality { background: #f3e8ff; color: #7c3aed; }
    .type-badge.custom { background: #f1f5f9; color: #475569; }

    .frequency-info {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .frequency {
      font-weight: 500;
    }

    .time {
      font-size: 0.75rem;
      color: #64748b;
    }

    .next-run, .last-run {
      font-size: 0.8125rem;
    }

    .no-date {
      color: #94a3b8;
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-badge.active { background: #dcfce7; color: #16a34a; }
    .status-badge.paused { background: #fef3c7; color: #d97706; }
    .status-badge.error { background: #fee2e2; color: #dc2626; }
    .status-badge.running { background: #dbeafe; color: #3b82f6; }
    .status-badge.completed { background: #dcfce7; color: #16a34a; }
    .status-badge.failed { background: #fee2e2; color: #dc2626; }
    .status-badge.cancelled { background: #f1f5f9; color: #64748b; }

    .delivery-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .delivery-badge.sent { background: #dcfce7; color: #16a34a; }
    .delivery-badge.pending { background: #fef3c7; color: #d97706; }
    .delivery-badge.failed { background: #fee2e2; color: #dc2626; }

    .recipients-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .recipients-info .count {
      font-size: 0.8125rem;
    }

    .action-buttons {
      display: flex;
      gap: 0.25rem;
    }

    .empty-state {
      text-align: center;
      padding: 3rem !important;
      color: #64748b;
    }

    .empty-state svg {
      width: 3rem;
      height: 3rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .empty-state p {
      margin: 0 0 1rem;
      font-size: 0.875rem;
    }

    /* History Stats */
    .history-stats {
      display: flex;
      gap: 2rem;
      margin-bottom: 1rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 0.75rem;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .stat-value {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
    }

    .stat-value.completed { color: #16a34a; }
    .stat-value.failed { color: #dc2626; }
    .stat-value.running { color: #3b82f6; }

    .stat-label {
      font-size: 0.75rem;
      color: #64748b;
    }

    .running-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #3b82f6;
    }

    .spinner {
      width: 1rem;
      height: 1rem;
      border: 2px solid #dbeafe;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Outputs */
    .outputs-content {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 1.5rem;
    }

    .outputs-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .outputs-header h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
    }

    .storage-info {
      display: flex;
      gap: 0.25rem;
      font-size: 0.875rem;
    }

    .storage-used {
      font-weight: 500;
      color: #1e293b;
    }

    .storage-limit {
      color: #64748b;
    }

    .outputs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }

    .output-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      transition: all 0.2s;
    }

    .output-card:hover {
      border-color: #3b82f6;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
    }

    .file-icon {
      width: 2.5rem;
      height: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.5rem;
    }

    .file-icon svg {
      width: 1.25rem;
      height: 1.25rem;
    }

    .file-icon.pdf { background: #fee2e2; color: #dc2626; }
    .file-icon.excel { background: #dcfce7; color: #16a34a; }
    .file-icon.csv { background: #dbeafe; color: #3b82f6; }

    .file-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      min-width: 0;
    }

    .file-name {
      font-weight: 500;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .file-date, .file-size {
      font-size: 0.75rem;
      color: #64748b;
    }

    .file-actions {
      display: flex;
      gap: 0.25rem;
    }

    .empty-outputs {
      grid-column: 1 / -1;
      text-align: center;
      padding: 3rem;
      color: #64748b;
    }

    .empty-outputs svg {
      width: 3rem;
      height: 3rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .empty-outputs p {
      margin: 0 0 0.5rem;
      font-weight: 500;
    }

    .empty-outputs span {
      font-size: 0.875rem;
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

    .schedule-modal {
      max-width: 600px;
    }

    .recipients-modal {
      max-width: 500px;
    }

    .error-modal {
      max-width: 500px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .modal-header.error {
      background: #fef2f2;
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

    /* Form Styles */
    .form-section {
      margin-bottom: 1.5rem;
    }

    .form-section:last-child {
      margin-bottom: 0;
    }

    .form-section h3 {
      margin: 0 0 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #475569;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group:last-child {
      margin-bottom: 0;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.875rem;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-group textarea {
      resize: vertical;
    }

    /* Recipients */
    .recipients-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .recipient-chip {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 0.5rem 0.375rem 0.75rem;
      background: #f1f5f9;
      border-radius: 9999px;
      font-size: 0.8125rem;
    }

    .recipient-name {
      font-weight: 500;
      color: #1e293b;
    }

    .recipient-email {
      color: #64748b;
    }

    .remove-recipient {
      width: 1.25rem;
      height: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: #e2e8f0;
      border-radius: 50%;
      font-size: 0.875rem;
      color: #64748b;
      cursor: pointer;
    }

    .remove-recipient:hover {
      background: #cbd5e1;
      color: #1e293b;
    }

    .add-recipient {
      display: flex;
      gap: 0.5rem;
    }

    .add-recipient input {
      flex: 1;
      padding: 0.5rem 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.875rem;
    }

    /* Recipients Modal Table */
    .recipients-table {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .recipient-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: 0.5rem;
    }

    .recipient-icon {
      width: 2.5rem;
      height: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }

    .recipient-icon svg {
      width: 1.25rem;
      height: 1.25rem;
    }

    .recipient-icon.user { background: #dbeafe; color: #3b82f6; }
    .recipient-icon.group { background: #f3e8ff; color: #7c3aed; }
    .recipient-icon.external { background: #fef3c7; color: #d97706; }

    .recipient-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .recipient-details strong {
      font-weight: 500;
      color: #1e293b;
    }

    .recipient-details span {
      font-size: 0.8125rem;
      color: #64748b;
    }

    .recipient-type-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .recipient-type-badge.user { background: #dbeafe; color: #3b82f6; }
    .recipient-type-badge.group { background: #f3e8ff; color: #7c3aed; }
    .recipient-type-badge.external { background: #fef3c7; color: #d97706; }

    /* Error Modal */
    .error-details {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .error-info {
      display: flex;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    .error-info strong {
      color: #475569;
    }

    .error-message {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .error-message strong {
      font-size: 0.875rem;
      color: #475569;
    }

    .error-message pre {
      margin: 0;
      padding: 1rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 0.5rem;
      font-size: 0.8125rem;
      color: #dc2626;
      white-space: pre-wrap;
      word-break: break-word;
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

      .summary-cards {
        grid-template-columns: repeat(2, 1fr);
      }

      .filters-bar {
        flex-direction: column;
      }

      .filter-group {
        width: 100%;
      }

      .filter-group select {
        flex: 1;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .history-stats {
        flex-wrap: wrap;
        gap: 1rem;
      }

      .stat-item {
        min-width: calc(50% - 0.5rem);
      }
    }
  `]
})
export class ScheduledReportsComponent {
  private fb = new FormBuilder();

  // State
  activeTab = signal<'schedules' | 'history' | 'outputs'>('schedules');
  searchQuery = signal('');
  statusFilter = signal<'all' | 'active' | 'paused' | 'error'>('all');
  typeFilter = signal<'all' | 'clinical' | 'financial' | 'operational' | 'quality' | 'custom'>('all');
  frequencyFilter = signal<'all' | 'daily' | 'weekly' | 'monthly' | 'quarterly'>('all');
  
  // History filters
  historySearch = signal('');
  historyStatusFilter = signal<'all' | 'running' | 'completed' | 'failed' | 'cancelled'>('all');
  historyStartDate = signal('');
  historyEndDate = signal('');

  // Modal state
  showScheduleModal = signal(false);
  showRecipientsModal = signal(false);
  showErrorModal = signal(false);
  editingSchedule = signal<ScheduledReport | null>(null);
  viewingSchedule = signal<ScheduledReport | null>(null);
  viewingError = signal<ExecutionHistory | null>(null);

  // Recipients
  selectedRecipients = signal<Recipient[]>([]);
  newRecipientEmail = signal('');

  // Days of month for selection
  daysOfMonth = Array.from({ length: 28 }, (_, i) => i + 1);

  // Form
  scheduleForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    reportType: ['', Validators.required],
    outputFormat: ['pdf', Validators.required],
    frequency: ['daily', Validators.required],
    time: ['08:00', Validators.required],
    dayOfWeek: [1],
    dayOfMonth: [1]
  });

  // Data
  scheduledReports = signal<ScheduledReport[]>(this.generateMockSchedules());
  executionHistory = signal<ExecutionHistory[]>(this.generateMockHistory());

  // Computed values
  filteredSchedules = computed(() => {
    let schedules = this.scheduledReports();
    
    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      schedules = schedules.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query)
      );
    }
    
    if (this.statusFilter() !== 'all') {
      schedules = schedules.filter(s => s.status === this.statusFilter());
    }
    
    if (this.typeFilter() !== 'all') {
      schedules = schedules.filter(s => s.reportType === this.typeFilter());
    }
    
    if (this.frequencyFilter() !== 'all') {
      schedules = schedules.filter(s => s.schedule.frequency === this.frequencyFilter());
    }
    
    return schedules;
  });

  filteredHistory = computed(() => {
    let history = this.executionHistory();
    
    if (this.historySearch()) {
      const query = this.historySearch().toLowerCase();
      history = history.filter(h => h.reportName.toLowerCase().includes(query));
    }
    
    if (this.historyStatusFilter() !== 'all') {
      history = history.filter(h => h.status === this.historyStatusFilter());
    }
    
    return history;
  });

  activeSchedules = computed(() => 
    this.scheduledReports().filter(s => s.status === 'active').length
  );

  pausedSchedules = computed(() => 
    this.scheduledReports().filter(s => s.status === 'paused').length
  );

  errorSchedules = computed(() => 
    this.scheduledReports().filter(s => s.status === 'error').length
  );

  nextRunTime = computed(() => {
    const activeSchedules = this.scheduledReports()
      .filter(s => s.status === 'active' && s.nextRun)
      .sort((a, b) => a.nextRun!.getTime() - b.nextRun!.getTime());
    
    if (activeSchedules.length === 0) return '--';
    
    const nextRun = activeSchedules[0].nextRun!;
    const now = new Date();
    const diff = nextRun.getTime() - now.getTime();
    
    if (diff < 3600000) {
      return `${Math.round(diff / 60000)} min`;
    } else if (diff < 86400000) {
      return `${Math.round(diff / 3600000)} hrs`;
    } else {
      return this.formatShortDate(nextRun);
    }
  });

  completedRuns = computed(() => 
    this.executionHistory().filter(h => h.status === 'completed').length
  );

  failedRuns = computed(() => 
    this.executionHistory().filter(h => h.status === 'failed').length
  );

  runningRuns = computed(() => 
    this.executionHistory().filter(h => h.status === 'running').length
  );

  avgRunTime = computed(() => {
    const completed = this.executionHistory().filter(h => h.status === 'completed' && h.endTime);
    if (completed.length === 0) return '--';
    
    const totalSeconds = completed.reduce((sum, h) => {
      return sum + (h.endTime!.getTime() - h.startTime.getTime()) / 1000;
    }, 0);
    
    const avgSeconds = totalSeconds / completed.length;
    
    if (avgSeconds < 60) {
      return `${Math.round(avgSeconds)}s`;
    } else {
      return `${Math.round(avgSeconds / 60)}m`;
    }
  });

  recentOutputs = computed(() => 
    this.executionHistory()
      .filter(h => h.status === 'completed' && h.outputFile)
      .slice(0, 12)
  );

  totalStorageUsed = computed(() => {
    const totalBytes = this.executionHistory()
      .filter(h => h.fileSize)
      .reduce((sum, h) => sum + h.fileSize!, 0);
    
    return this.formatFileSize(totalBytes);
  });

  // Mock data generators
  private generateMockSchedules(): ScheduledReport[] {
    const now = new Date();
    
    return [
      {
        id: 'sched-1',
        name: 'Daily Revenue Report',
        description: 'End of day revenue summary and breakdown by payer',
        reportType: 'financial',
        reportConfig: {},
        schedule: {
          frequency: 'daily',
          time: '18:00',
          timezone: 'America/New_York'
        },
        recipients: [
          { id: 'r1', name: 'John Smith', email: 'john.smith@clinic.com', type: 'user' },
          { id: 'r2', name: 'Finance Team', email: 'finance@clinic.com', type: 'group' }
        ],
        outputFormat: 'excel',
        status: 'active',
        createdBy: 'admin',
        createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        lastRun: new Date(now.getTime() - 18 * 60 * 60 * 1000),
        nextRun: new Date(now.getTime() + 6 * 60 * 60 * 1000),
        runCount: 28
      },
      {
        id: 'sched-2',
        name: 'Weekly Quality Measures',
        description: 'CMS quality measure compliance tracking',
        reportType: 'quality',
        reportConfig: {},
        schedule: {
          frequency: 'weekly',
          dayOfWeek: 1,
          time: '07:00',
          timezone: 'America/New_York'
        },
        recipients: [
          { id: 'r3', name: 'Dr. Sarah Johnson', email: 'sarah.johnson@clinic.com', type: 'user' },
          { id: 'r4', name: 'Quality Committee', email: 'quality@clinic.com', type: 'group' }
        ],
        outputFormat: 'pdf',
        status: 'active',
        createdBy: 'admin',
        createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        lastRun: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        nextRun: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        runCount: 8
      },
      {
        id: 'sched-3',
        name: 'Monthly Patient Demographics',
        description: 'Patient population demographics and trends analysis',
        reportType: 'clinical',
        reportConfig: {},
        schedule: {
          frequency: 'monthly',
          dayOfMonth: 1,
          time: '06:00',
          timezone: 'America/New_York'
        },
        recipients: [
          { id: 'r5', name: 'Admin Team', email: 'admin@clinic.com', type: 'group' }
        ],
        outputFormat: 'pdf',
        status: 'active',
        createdBy: 'admin',
        createdAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        lastRun: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        nextRun: new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000),
        runCount: 3
      },
      {
        id: 'sched-4',
        name: 'Provider Productivity Weekly',
        description: 'Weekly provider productivity and utilization metrics',
        reportType: 'operational',
        reportConfig: {},
        schedule: {
          frequency: 'weekly',
          dayOfWeek: 5,
          time: '17:00',
          timezone: 'America/New_York'
        },
        recipients: [
          { id: 'r6', name: 'Practice Manager', email: 'manager@clinic.com', type: 'user' },
          { id: 'r7', name: 'External Consultant', email: 'consultant@external.com', type: 'external' }
        ],
        outputFormat: 'excel',
        status: 'paused',
        createdBy: 'admin',
        createdAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
        lastRun: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        runCount: 5
      },
      {
        id: 'sched-5',
        name: 'Claims Aging Report',
        description: 'Aging analysis of outstanding claims',
        reportType: 'financial',
        reportConfig: {},
        schedule: {
          frequency: 'daily',
          time: '08:00',
          timezone: 'America/New_York'
        },
        recipients: [
          { id: 'r8', name: 'Billing Team', email: 'billing@clinic.com', type: 'group' }
        ],
        outputFormat: 'csv',
        status: 'error',
        createdBy: 'admin',
        createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        lastRun: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        runCount: 15
      },
      {
        id: 'sched-6',
        name: 'Quarterly Compliance Report',
        description: 'Comprehensive compliance and audit preparation report',
        reportType: 'quality',
        reportConfig: {},
        schedule: {
          frequency: 'quarterly',
          dayOfMonth: 15,
          time: '09:00',
          timezone: 'America/New_York'
        },
        recipients: [
          { id: 'r9', name: 'Compliance Officer', email: 'compliance@clinic.com', type: 'user' },
          { id: 'r10', name: 'Executive Team', email: 'executives@clinic.com', type: 'group' }
        ],
        outputFormat: 'pdf',
        status: 'active',
        createdBy: 'admin',
        createdAt: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
        lastRun: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
        nextRun: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
        runCount: 2
      }
    ];
  }

  private generateMockHistory(): ExecutionHistory[] {
    const now = new Date();
    
    return [
      {
        id: 'exec-1',
        scheduledReportId: 'sched-1',
        reportName: 'Daily Revenue Report',
        startTime: new Date(now.getTime() - 18 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() - 18 * 60 * 60 * 1000 + 45 * 1000),
        status: 'completed',
        outputFile: 'revenue_report_2024-01-15.xlsx',
        fileSize: 256000,
        rowCount: 1250,
        recipients: ['john.smith@clinic.com', 'finance@clinic.com'],
        deliveryStatus: 'sent'
      },
      {
        id: 'exec-2',
        scheduledReportId: 'sched-2',
        reportName: 'Weekly Quality Measures',
        startTime: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 1000),
        status: 'completed',
        outputFile: 'quality_measures_week_2.pdf',
        fileSize: 1024000,
        rowCount: 45,
        recipients: ['sarah.johnson@clinic.com', 'quality@clinic.com'],
        deliveryStatus: 'sent'
      },
      {
        id: 'exec-3',
        scheduledReportId: 'sched-5',
        reportName: 'Claims Aging Report',
        startTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        status: 'failed',
        errorMessage: 'Database connection timeout after 30 seconds. Unable to fetch claims data from billing system.',
        recipients: ['billing@clinic.com'],
        deliveryStatus: 'failed'
      },
      {
        id: 'exec-4',
        scheduledReportId: 'sched-1',
        reportName: 'Daily Revenue Report',
        startTime: new Date(now.getTime() - 42 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() - 42 * 60 * 60 * 1000 + 52 * 1000),
        status: 'completed',
        outputFile: 'revenue_report_2024-01-14.xlsx',
        fileSize: 248000,
        rowCount: 1180,
        recipients: ['john.smith@clinic.com', 'finance@clinic.com'],
        deliveryStatus: 'sent'
      },
      {
        id: 'exec-5',
        scheduledReportId: 'sched-3',
        reportName: 'Monthly Patient Demographics',
        startTime: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000 + 3 * 60 * 1000),
        status: 'completed',
        outputFile: 'patient_demographics_jan_2024.pdf',
        fileSize: 2048000,
        rowCount: 3250,
        recipients: ['admin@clinic.com'],
        deliveryStatus: 'sent'
      },
      {
        id: 'exec-6',
        scheduledReportId: 'sched-4',
        reportName: 'Provider Productivity Weekly',
        startTime: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000 + 90 * 1000),
        status: 'completed',
        outputFile: 'provider_productivity_week_1.xlsx',
        fileSize: 512000,
        rowCount: 85,
        recipients: ['manager@clinic.com', 'consultant@external.com'],
        deliveryStatus: 'sent'
      },
      {
        id: 'exec-7',
        scheduledReportId: 'sched-1',
        reportName: 'Daily Revenue Report',
        startTime: new Date(now.getTime() - 30 * 60 * 1000),
        status: 'running',
        recipients: ['john.smith@clinic.com', 'finance@clinic.com'],
        deliveryStatus: 'pending'
      },
      {
        id: 'exec-8',
        scheduledReportId: 'sched-5',
        reportName: 'Claims Aging Report',
        startTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 35 * 1000),
        status: 'completed',
        outputFile: 'claims_aging_2024-01-12.csv',
        fileSize: 128000,
        rowCount: 450,
        recipients: ['billing@clinic.com'],
        deliveryStatus: 'sent'
      }
    ];
  }

  // Helper methods
  formatDateTime(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  formatShortDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  calculateDuration(start: Date, end: Date): string {
    const seconds = (end.getTime() - start.getTime()) / 1000;
    
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
    } else {
      return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
  }

  getFileType(filename: string): 'pdf' | 'excel' | 'csv' {
    if (filename.endsWith('.pdf')) return 'pdf';
    if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) return 'excel';
    return 'csv';
  }

  // Actions
  refreshData(): void {
    console.log('Refreshing data...');
  }

  openCreateModal(): void {
    this.editingSchedule.set(null);
    this.selectedRecipients.set([]);
    this.scheduleForm.reset({
      outputFormat: 'pdf',
      frequency: 'daily',
      time: '08:00',
      dayOfWeek: 1,
      dayOfMonth: 1
    });
    this.showScheduleModal.set(true);
  }

  closeScheduleModal(): void {
    this.showScheduleModal.set(false);
    this.editingSchedule.set(null);
  }

  saveSchedule(): void {
    if (this.scheduleForm.valid) {
      console.log('Saving schedule:', this.scheduleForm.value);
      console.log('Recipients:', this.selectedRecipients());
      this.closeScheduleModal();
    }
  }

  editSchedule(schedule: ScheduledReport): void {
    this.editingSchedule.set(schedule);
    this.selectedRecipients.set([...schedule.recipients]);
    this.scheduleForm.patchValue({
      name: schedule.name,
      description: schedule.description,
      reportType: schedule.reportType,
      outputFormat: schedule.outputFormat,
      frequency: schedule.schedule.frequency,
      time: schedule.schedule.time,
      dayOfWeek: schedule.schedule.dayOfWeek || 1,
      dayOfMonth: schedule.schedule.dayOfMonth || 1
    });
    this.showScheduleModal.set(true);
  }

  deleteSchedule(schedule: ScheduledReport): void {
    if (confirm(`Are you sure you want to delete "${schedule.name}"?`)) {
      console.log('Deleting schedule:', schedule.id);
    }
  }

  pauseSchedule(schedule: ScheduledReport): void {
    console.log('Pausing schedule:', schedule.id);
  }

  resumeSchedule(schedule: ScheduledReport): void {
    console.log('Resuming schedule:', schedule.id);
  }

  runNow(schedule: ScheduledReport): void {
    console.log('Running schedule now:', schedule.id);
  }

  viewRecipients(schedule: ScheduledReport): void {
    this.viewingSchedule.set(schedule);
    this.showRecipientsModal.set(true);
  }

  closeRecipientsModal(): void {
    this.showRecipientsModal.set(false);
    this.viewingSchedule.set(null);
  }

  addRecipient(): void {
    const email = this.newRecipientEmail().trim();
    if (email && email.includes('@')) {
      const newRecipient: Recipient = {
        id: `r-${Date.now()}`,
        name: email.split('@')[0],
        email: email,
        type: email.includes('@clinic.com') ? 'user' : 'external'
      };
      this.selectedRecipients.update(recipients => [...recipients, newRecipient]);
      this.newRecipientEmail.set('');
    }
  }

  removeRecipient(recipient: Recipient): void {
    this.selectedRecipients.update(recipients => 
      recipients.filter(r => r.id !== recipient.id)
    );
  }

  downloadOutput(run: ExecutionHistory): void {
    console.log('Downloading:', run.outputFile);
  }

  shareOutput(run: ExecutionHistory): void {
    console.log('Sharing:', run.outputFile);
  }

  deleteOutput(run: ExecutionHistory): void {
    if (confirm(`Are you sure you want to delete this output file?`)) {
      console.log('Deleting output:', run.outputFile);
    }
  }

  viewError(run: ExecutionHistory): void {
    this.viewingError.set(run);
    this.showErrorModal.set(true);
  }

  closeErrorModal(): void {
    this.showErrorModal.set(false);
    this.viewingError.set(null);
  }

  retryRun(run: ExecutionHistory): void {
    console.log('Retrying run:', run.id);
    this.closeErrorModal();
  }
}
