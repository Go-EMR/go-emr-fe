import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportsService } from '../data-access/services/reports.service';
import { QualityMeasure, QualityPatient, CareGap } from '../data-access/models/reports.model';

type QualityTab = 'dashboard' | 'measures' | 'care-gaps' | 'compliance';

@Component({
  selector: 'app-quality-measures',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="quality-measures">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <h1>Quality Measures</h1>
          <p class="subtitle">Clinical quality metrics, care gaps, and compliance tracking</p>
        </div>
        <div class="header-actions">
          <div class="reporting-period">
            <label>Reporting Period:</label>
            <select [(ngModel)]="reportingPeriod" (change)="onPeriodChange()">
              <option value="2024-Q4">Q4 2024</option>
              <option value="2024-Q3">Q3 2024</option>
              <option value="2024-Q2">Q2 2024</option>
              <option value="2024-Q1">Q1 2024</option>
              <option value="2024-YTD">2024 YTD</option>
            </select>
          </div>
          <button class="btn btn-secondary" (click)="exportMeasures()">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
            Export
          </button>
        </div>
      </header>

      <!-- Tabs -->
      <nav class="tabs">
        <button class="tab-btn" [class.active]="activeTab() === 'dashboard'" (click)="activeTab.set('dashboard')">
          Dashboard
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'measures'" (click)="activeTab.set('measures')">
          All Measures
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'care-gaps'" (click)="activeTab.set('care-gaps')">
          Care Gaps
          @if (totalCareGaps() > 0) {
            <span class="tab-badge danger">{{ totalCareGaps() }}</span>
          }
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'compliance'" (click)="activeTab.set('compliance')">
          Compliance
        </button>
      </nav>

      <!-- Dashboard Tab -->
      @if (activeTab() === 'dashboard') {
        <div class="dashboard-tab">
          <!-- Overall Performance -->
          <div class="performance-overview">
            <div class="score-card">
              <div class="score-circle" [class.excellent]="overallScore() >= 90" [class.good]="overallScore() >= 75 && overallScore() < 90" [class.needs-improvement]="overallScore() < 75">
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" stroke-width="8"/>
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="8"
                          stroke-linecap="round"
                          [attr.stroke-dasharray]="scoreCircumference"
                          [attr.stroke-dashoffset]="scoreOffset()"
                          transform="rotate(-90 50 50)"/>
                </svg>
                <div class="score-value">
                  <span class="score-number">{{ overallScore() | number:'1.0-0' }}</span>
                  <span class="score-percent">%</span>
                </div>
              </div>
              <div class="score-label">Overall Quality Score</div>
              <div class="score-trend positive">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                  <polyline points="17 6 23 6 23 12"/>
                </svg>
                +2.3% from last quarter
              </div>
            </div>

            <div class="performance-summary">
              <div class="summary-item">
                <span class="summary-value good">{{ measuresMet() }}</span>
                <span class="summary-label">Measures Met</span>
              </div>
              <div class="summary-item">
                <span class="summary-value warning">{{ measuresNotMet() }}</span>
                <span class="summary-label">Needs Improvement</span>
              </div>
              <div class="summary-item">
                <span class="summary-value">{{ totalPatients() }}</span>
                <span class="summary-label">Total Patients</span>
              </div>
              <div class="summary-item">
                <span class="summary-value danger">{{ totalCareGaps() }}</span>
                <span class="summary-label">Care Gaps</span>
              </div>
            </div>
          </div>

          <!-- Measure Categories -->
          <div class="category-performance">
            <h3>Performance by Category</h3>
            <div class="category-grid">
              @for (category of categoryPerformance(); track category.name) {
                <div class="category-card" [class.met]="category.rate >= category.target" [class.not-met]="category.rate < category.target">
                  <div class="category-header">
                    <span class="category-icon">
                      @switch (category.name) {
                        @case ('Preventive Care') {
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                          </svg>
                        }
                        @case ('Chronic Disease') {
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                          </svg>
                        }
                        @case ('Behavioral Health') {
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                            <line x1="9" y1="9" x2="9.01" y2="9"/>
                            <line x1="15" y1="9" x2="15.01" y2="9"/>
                          </svg>
                        }
                        @default {
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                          </svg>
                        }
                      }
                    </span>
                    <span class="category-name">{{ category.name }}</span>
                  </div>
                  <div class="category-rate">{{ category.rate | percent:'1.0-0' }}</div>
                  <div class="category-progress">
                    <div class="progress-bar">
                      <div class="progress-fill" [style.width.%]="category.rate * 100"></div>
                      <div class="progress-target" [style.left.%]="category.target * 100"></div>
                    </div>
                    <span class="target-label">Target: {{ category.target | percent:'1.0-0' }}</span>
                  </div>
                  <div class="category-measures">{{ category.measuresMet }}/{{ category.totalMeasures }} measures met</div>
                </div>
              }
            </div>
          </div>

          <!-- Top Measures -->
          <div class="top-measures">
            <div class="measures-section">
              <h3>
                <span class="section-icon good">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
                Top Performing Measures
              </h3>
              <div class="measures-list">
                @for (measure of topMeasures(); track measure.measureId) {
                  <div class="measure-row">
                    <div class="measure-info">
                      <span class="measure-name">{{ measure.measureName }}</span>
                      <span class="measure-id">{{ measure.measureId }}</span>
                    </div>
                    <div class="measure-rate">
                      <span class="rate-value">{{ measure.rate | percent:'1.1-1' }}</span>
                      <span class="rate-benchmark">vs {{ measure.benchmark | percent:'1.0-0' }} benchmark</span>
                    </div>
                  </div>
                }
              </div>
            </div>

            <div class="measures-section">
              <h3>
                <span class="section-icon warning">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </span>
                Measures Needing Attention
              </h3>
              <div class="measures-list">
                @for (measure of bottomMeasures(); track measure.measureId) {
                  <div class="measure-row">
                    <div class="measure-info">
                      <span class="measure-name">{{ measure.measureName }}</span>
                      <span class="measure-id">{{ measure.measureId }}</span>
                    </div>
                    <div class="measure-rate warning">
                      <span class="rate-value">{{ measure.rate | percent:'1.1-1' }}</span>
                      <span class="rate-gap">{{ ((measure.target ?? 0) - measure.rate) | percent:'1.1-1' }} below target</span>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }

      <!-- All Measures Tab -->
      @if (activeTab() === 'measures') {
        <div class="measures-tab">
          <!-- Filters -->
          <div class="filters-bar">
            <div class="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              <input type="text" placeholder="Search measures..." [(ngModel)]="measureSearch" (input)="filterMeasures()">
            </div>
            <div class="filter-group">
              <select [(ngModel)]="categoryFilter" (change)="filterMeasures()">
                <option value="">All Categories</option>
                <option value="preventive">Preventive Care</option>
                <option value="chronic">Chronic Disease</option>
                <option value="behavioral">Behavioral Health</option>
                <option value="safety">Patient Safety</option>
              </select>
            </div>
            <div class="filter-group">
              <select [(ngModel)]="statusFilter" (change)="filterMeasures()">
                <option value="">All Status</option>
                <option value="met">Met</option>
                <option value="not_met">Not Met</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <!-- Measures Table -->
          <div class="measures-table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Measure ID</th>
                  <th>Measure Name</th>
                  <th>Category</th>
                  <th class="text-right">Numerator</th>
                  <th class="text-right">Denominator</th>
                  <th class="text-right">Rate</th>
                  <th class="text-right">Benchmark</th>
                  <th class="text-right">Target</th>
                  <th>Status</th>
                  <th>Trend</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (measure of filteredMeasures(); track measure.measureId) {
                  <tr [class.met]="measure.status === 'met'" [class.not-met]="measure.status === 'not_met'">
                    <td><code class="measure-code">{{ measure.measureId }}</code></td>
                    <td class="measure-name-cell">
                      <span class="measure-title">{{ measure.measureName }}</span>
                      <span class="measure-desc">{{ measure.description }}</span>
                    </td>
                    <td>
                      <span class="category-badge" [class]="measure.category">{{ measure.category | titlecase }}</span>
                    </td>
                    <td class="text-right">{{ measure.numerator }}</td>
                    <td class="text-right">{{ measure.denominator }}</td>
                    <td class="text-right">
                      <span class="rate-display" [class.good]="measure.rate >= (measure.target ?? 0)" [class.warning]="measure.rate >= (measure.benchmark ?? 0) && measure.rate < (measure.target ?? 0)" [class.danger]="measure.rate < (measure.benchmark ?? 0)">
                        {{ measure.rate | percent:'1.1-1' }}
                      </span>
                    </td>
                    <td class="text-right text-muted">{{ measure.benchmark | percent:'1.0-0' }}</td>
                    <td class="text-right text-muted">{{ measure.target | percent:'1.0-0' }}</td>
                    <td>
                      <span class="status-badge" [class]="measure.status">
                        @if (measure.status === 'met') {
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        } @else if (measure.status === 'not_met') {
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        } @else {
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                        }
                        {{ measure.status | titlecase }}
                      </span>
                    </td>
                    <td>
                      <div class="trend-indicator" [class.up]="measure.trend?.direction === 'up'" [class.down]="measure.trend?.direction === 'down'">
                        @if (measure.trend?.direction === 'up') {
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="18 15 12 9 6 15"/>
                          </svg>
                        } @else if (measure.trend?.direction === 'down') {
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        } @else {
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="5" y1="12" x2="19" y2="12"/>
                          </svg>
                        }
                        {{ measure.trend?.value | percent:'1.1-1' }}
                      </div>
                    </td>
                    <td>
                      <button class="btn-icon" title="View Details" (click)="viewMeasureDetail(measure)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                      <button class="btn-icon" title="View Patients" (click)="viewMeasurePatients(measure)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Care Gaps Tab -->
      @if (activeTab() === 'care-gaps') {
        <div class="care-gaps-tab">
          <!-- Gap Summary -->
          <div class="gap-summary">
            <div class="gap-card total">
              <span class="gap-count">{{ totalCareGaps() }}</span>
              <span class="gap-label">Total Care Gaps</span>
            </div>
            <div class="gap-card urgent">
              <span class="gap-count">{{ urgentGaps() }}</span>
              <span class="gap-label">Urgent (Overdue)</span>
            </div>
            <div class="gap-card upcoming">
              <span class="gap-count">{{ upcomingGaps() }}</span>
              <span class="gap-label">Due This Month</span>
            </div>
            <div class="gap-card scheduled">
              <span class="gap-count">{{ scheduledGaps() }}</span>
              <span class="gap-label">Appointments Scheduled</span>
            </div>
          </div>

          <!-- Filters -->
          <div class="filters-bar">
            <div class="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              <input type="text" placeholder="Search patients..." [(ngModel)]="gapSearch">
            </div>
            <select [(ngModel)]="gapMeasureFilter">
              <option value="">All Measures</option>
              @for (measure of qualityMeasures(); track measure.measureId) {
                <option [value]="measure.measureId">{{ measure.measureName }}</option>
              }
            </select>
            <select [(ngModel)]="gapProviderFilter">
              <option value="">All Providers</option>
              <option value="dr-smith">Dr. Smith</option>
              <option value="dr-johnson">Dr. Johnson</option>
              <option value="dr-williams">Dr. Williams</option>
            </select>
            <select [(ngModel)]="gapUrgencyFilter">
              <option value="">All Urgency</option>
              <option value="overdue">Overdue</option>
              <option value="due-soon">Due Soon</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>

          <!-- Care Gaps Table -->
          <div class="gaps-table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>
                    <input type="checkbox" (change)="toggleAllGaps($event)" [checked]="allGapsSelected()">
                  </th>
                  <th>Patient</th>
                  <th>DOB</th>
                  <th>Measure</th>
                  <th>Gap Reason</th>
                  <th>Last Service</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Next Action</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (gap of careGaps(); track gap.patientId + gap.measureId) {
                  <tr [class.overdue]="isOverdue(gap)" [class.selected]="selectedGaps().has(gap.patientId)">
                    <td>
                      <input type="checkbox" [checked]="selectedGaps().has(gap.patientId)" (change)="toggleGapSelection(gap.patientId)">
                    </td>
                    <td>
                      <a href="javascript:void(0)" class="patient-link">{{ gap.patientName }}</a>
                    </td>
                    <td>{{ gap.dateOfBirth | date:'shortDate' }}</td>
                    <td>
                      <span class="measure-badge">{{ gap.measureId }}</span>
                      <span class="measure-name-small">{{ gap.measureName }}</span>
                    </td>
                    <td class="gap-reason">{{ gap.gapReason }}</td>
                    <td>{{ gap.lastServiceDate | date:'shortDate' }}</td>
                    <td>
                      <span class="due-date" [class.overdue]="isOverdue(gap)" [class.soon]="isDueSoon(gap)">
                        {{ gap.dueDate | date:'shortDate' }}
                      </span>
                    </td>
                    <td>
                      <span class="gap-status-badge" [class]="gap.measureStatus">
                        {{ gap.measureStatus | titlecase }}
                      </span>
                    </td>
                    <td class="next-action">{{ gap.nextAction }}</td>
                    <td>
                      <div class="action-buttons">
                        <button class="btn-icon" title="Schedule Appointment" (click)="scheduleAppointment(gap)">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                        </button>
                        <button class="btn-icon" title="Send Reminder" (click)="sendReminder(gap)">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 2L11 13"/>
                            <path d="M22 2L15 22 11 13 2 9 22 2z"/>
                          </svg>
                        </button>
                        <button class="btn-icon" title="Mark Complete" (click)="markComplete(gap)">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Bulk Actions -->
          @if (selectedGaps().size > 0) {
            <div class="bulk-actions">
              <span class="selection-count">{{ selectedGaps().size }} patients selected</span>
              <button class="btn btn-secondary" (click)="bulkSchedule()">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                </svg>
                Schedule Appointments
              </button>
              <button class="btn btn-secondary" (click)="bulkReminder()">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 2L11 13"/>
                  <path d="M22 2L15 22 11 13 2 9 22 2z"/>
                </svg>
                Send Reminders
              </button>
              <button class="btn btn-secondary" (click)="exportGaps()">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export List
              </button>
            </div>
          }
        </div>
      }

      <!-- Compliance Tab -->
      @if (activeTab() === 'compliance') {
        <div class="compliance-tab">
          <!-- Compliance Overview -->
          <div class="compliance-overview">
            <div class="compliance-card">
              <h3>Regulatory Compliance</h3>
              <div class="compliance-items">
                <div class="compliance-item">
                  <div class="item-header">
                    <span class="item-name">MIPS Reporting</span>
                    <span class="item-status good">On Track</span>
                  </div>
                  <div class="item-progress">
                    <div class="progress-bar">
                      <div class="progress-fill" style="width: 85%"></div>
                    </div>
                    <span class="progress-text">85% complete</span>
                  </div>
                  <div class="item-deadline">Deadline: March 31, 2025</div>
                </div>
                <div class="compliance-item">
                  <div class="item-header">
                    <span class="item-name">HEDIS Measures</span>
                    <span class="item-status good">On Track</span>
                  </div>
                  <div class="item-progress">
                    <div class="progress-bar">
                      <div class="progress-fill" style="width: 78%"></div>
                    </div>
                    <span class="progress-text">78% complete</span>
                  </div>
                  <div class="item-deadline">Deadline: January 31, 2025</div>
                </div>
                <div class="compliance-item">
                  <div class="item-header">
                    <span class="item-name">eCQM Submission</span>
                    <span class="item-status warning">Attention Needed</span>
                  </div>
                  <div class="item-progress">
                    <div class="progress-bar warning">
                      <div class="progress-fill" style="width: 62%"></div>
                    </div>
                    <span class="progress-text">62% complete</span>
                  </div>
                  <div class="item-deadline">Deadline: February 28, 2025</div>
                </div>
              </div>
            </div>

            <div class="compliance-card">
              <h3>Documentation Compliance</h3>
              <div class="compliance-items">
                <div class="compliance-item">
                  <div class="item-header">
                    <span class="item-name">AWV Documentation</span>
                    <span class="item-status good">92%</span>
                  </div>
                  <div class="item-details">Complete documentation for Annual Wellness Visits</div>
                </div>
                <div class="compliance-item">
                  <div class="item-header">
                    <span class="item-name">Care Plan Updates</span>
                    <span class="item-status warning">78%</span>
                  </div>
                  <div class="item-details">Chronic care management plan updates within 90 days</div>
                </div>
                <div class="compliance-item">
                  <div class="item-header">
                    <span class="item-name">Medication Reconciliation</span>
                    <span class="item-status good">88%</span>
                  </div>
                  <div class="item-details">Med rec completed at each visit</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Provider Compliance -->
          <div class="provider-compliance">
            <h3>Provider Performance</h3>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Provider</th>
                  <th class="text-right">Quality Score</th>
                  <th class="text-right">Measures Met</th>
                  <th class="text-right">Care Gaps</th>
                  <th class="text-right">Documentation</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (provider of providerCompliance(); track provider.name) {
                  <tr>
                    <td class="font-semibold">{{ provider.name }}</td>
                    <td class="text-right">
                      <span class="score-badge" [class.good]="provider.score >= 85" [class.warning]="provider.score >= 70 && provider.score < 85" [class.danger]="provider.score < 70">
                        {{ provider.score }}%
                      </span>
                    </td>
                    <td class="text-right">{{ provider.measuresMet }}/{{ provider.totalMeasures }}</td>
                    <td class="text-right">{{ provider.careGaps }}</td>
                    <td class="text-right">{{ provider.documentation }}%</td>
                    <td>
                      <span class="compliance-status" [class]="provider.status">
                        {{ provider.status | titlecase }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Measure Detail Modal -->
      @if (showMeasureDetail()) {
        <div class="modal-overlay" (click)="showMeasureDetail.set(false)">
          <div class="modal measure-detail-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-title">
                <h2>{{ selectedMeasure()?.measureName }}</h2>
                <span class="measure-id">{{ selectedMeasure()?.measureId }}</span>
              </div>
              <button class="close-btn" (click)="showMeasureDetail.set(false)">×</button>
            </div>
            <div class="modal-body">
              <div class="measure-detail-grid">
                <div class="detail-section">
                  <h4>Performance</h4>
                  <div class="performance-metrics">
                    <div class="metric">
                      <span class="metric-label">Current Rate</span>
                      <span class="metric-value large" [class.good]="selectedMeasure()?.status === 'met'">
                        {{ selectedMeasure()?.rate | percent:'1.1-1' }}
                      </span>
                    </div>
                    <div class="metric">
                      <span class="metric-label">Numerator</span>
                      <span class="metric-value">{{ selectedMeasure()?.numerator }}</span>
                    </div>
                    <div class="metric">
                      <span class="metric-label">Denominator</span>
                      <span class="metric-value">{{ selectedMeasure()?.denominator }}</span>
                    </div>
                  </div>
                </div>
                <div class="detail-section">
                  <h4>Benchmarks</h4>
                  <div class="benchmark-bar">
                    <div class="benchmark-scale">
                      <div class="current-marker" [style.left.%]="(selectedMeasure()?.rate || 0) * 100">
                        <span class="marker-label">Current</span>
                      </div>
                      <div class="benchmark-marker" [style.left.%]="(selectedMeasure()?.benchmark || 0) * 100">
                        <span class="marker-label">Benchmark</span>
                      </div>
                      <div class="target-marker" [style.left.%]="(selectedMeasure()?.target || 0) * 100">
                        <span class="marker-label">Target</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="detail-section full-width">
                  <h4>Description</h4>
                  <p>{{ selectedMeasure()?.description }}</p>
                </div>
                <div class="detail-section full-width">
                  <h4>Trend (Last 4 Quarters)</h4>
                  <div class="trend-chart">
                    @for (point of measureTrendData(); track $index) {
                      <div class="trend-bar-group">
                        <div class="trend-bar" [style.height.%]="point.value * 100"></div>
                        <span class="trend-label">{{ point.period }}</span>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="showMeasureDetail.set(false)">Close</button>
              <button class="btn btn-primary" (click)="viewMeasurePatients(selectedMeasure()!)">View Patients</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .quality-measures {
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

    .page-header h1 {
      font-size: 1.75rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }

    .subtitle {
      color: #6b7280;
      margin: 0.25rem 0 0 0;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .reporting-period {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .reporting-period label {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .reporting-period select {
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      border-radius: 0.5rem;
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.15s;
      border: none;
    }

    .btn-primary {
      background: #2563eb;
      color: white;
    }

    .btn-primary:hover {
      background: #1d4ed8;
    }

    .btn-secondary {
      background: white;
      color: #374151;
      border: 1px solid #d1d5db;
    }

    .btn-secondary:hover {
      background: #f9fafb;
    }

    .btn .icon {
      width: 1rem;
      height: 1rem;
    }

    /* Tabs */
    .tabs {
      display: flex;
      gap: 0.25rem;
      background: #f3f4f6;
      padding: 0.25rem;
      border-radius: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border: none;
      background: transparent;
      color: #6b7280;
      font-weight: 500;
      font-size: 0.875rem;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.15s;
    }

    .tab-btn:hover {
      color: #374151;
    }

    .tab-btn.active {
      background: white;
      color: #2563eb;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .tab-badge {
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .tab-badge.danger {
      background: #fee2e2;
      color: #dc2626;
    }

    /* Dashboard Tab */
    .performance-overview {
      display: flex;
      gap: 2rem;
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: white;
      border-radius: 0.75rem;
      border: 1px solid #e5e7eb;
    }

    .score-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 200px;
    }

    .score-circle {
      position: relative;
      width: 140px;
      height: 140px;
      color: #d1d5db;
    }

    .score-circle.excellent { color: #22c55e; }
    .score-circle.good { color: #3b82f6; }
    .score-circle.needs-improvement { color: #f59e0b; }

    .score-circle svg {
      width: 100%;
      height: 100%;
    }

    .score-value {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      align-items: baseline;
    }

    .score-number {
      font-size: 2.5rem;
      font-weight: 700;
      color: #111827;
    }

    .score-percent {
      font-size: 1.25rem;
      color: #6b7280;
    }

    .score-label {
      font-size: 0.875rem;
      color: #6b7280;
      margin-top: 0.75rem;
    }

    .score-trend {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      font-weight: 500;
      margin-top: 0.5rem;
    }

    .score-trend.positive {
      color: #059669;
    }

    .score-trend svg {
      width: 1rem;
      height: 1rem;
    }

    .performance-summary {
      flex: 1;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
      padding-left: 2rem;
      border-left: 1px solid #e5e7eb;
    }

    .summary-item {
      display: flex;
      flex-direction: column;
    }

    .summary-value {
      font-size: 2rem;
      font-weight: 700;
      color: #111827;
    }

    .summary-value.good { color: #059669; }
    .summary-value.warning { color: #d97706; }
    .summary-value.danger { color: #dc2626; }

    .summary-label {
      font-size: 0.875rem;
      color: #6b7280;
    }

    /* Category Performance */
    .category-performance {
      margin-bottom: 2rem;
    }

    .category-performance h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #374151;
      margin: 0 0 1rem 0;
    }

    .category-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }

    .category-card {
      padding: 1.25rem;
      background: white;
      border-radius: 0.75rem;
      border: 2px solid #e5e7eb;
    }

    .category-card.met {
      border-color: #86efac;
      background: #f0fdf4;
    }

    .category-card.not-met {
      border-color: #fcd34d;
      background: #fffbeb;
    }

    .category-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .category-icon {
      width: 2rem;
      height: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f3f4f6;
      border-radius: 0.5rem;
    }

    .category-icon svg {
      width: 1.25rem;
      height: 1.25rem;
      color: #6b7280;
    }

    .category-name {
      font-weight: 600;
      color: #374151;
    }

    .category-rate {
      font-size: 1.75rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 0.5rem;
    }

    .category-progress {
      margin-bottom: 0.5rem;
    }

    .progress-bar {
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      position: relative;
      overflow: visible;
    }

    .progress-fill {
      height: 100%;
      background: #2563eb;
      border-radius: 4px;
      transition: width 0.3s;
    }

    .category-card.met .progress-fill {
      background: #22c55e;
    }

    .category-card.not-met .progress-fill {
      background: #f59e0b;
    }

    .progress-target {
      position: absolute;
      top: -4px;
      width: 2px;
      height: 16px;
      background: #374151;
    }

    .target-label {
      font-size: 0.75rem;
      color: #6b7280;
      display: block;
      margin-top: 0.25rem;
    }

    .category-measures {
      font-size: 0.75rem;
      color: #6b7280;
    }

    /* Top Measures */
    .top-measures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .measures-section {
      background: white;
      border-radius: 0.75rem;
      border: 1px solid #e5e7eb;
      padding: 1.25rem;
    }

    .measures-section h3 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1rem;
      font-weight: 600;
      color: #374151;
      margin: 0 0 1rem 0;
    }

    .section-icon {
      width: 1.5rem;
      height: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }

    .section-icon.good {
      background: #d1fae5;
      color: #059669;
    }

    .section-icon.warning {
      background: #fef3c7;
      color: #d97706;
    }

    .section-icon svg {
      width: 0.875rem;
      height: 0.875rem;
    }

    .measures-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .measure-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: #f9fafb;
      border-radius: 0.5rem;
    }

    .measure-info {
      display: flex;
      flex-direction: column;
    }

    .measure-name {
      font-weight: 500;
      color: #374151;
      font-size: 0.875rem;
    }

    .measure-id {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .measure-rate {
      text-align: right;
    }

    .measure-rate.warning {
      color: #d97706;
    }

    .rate-value {
      font-weight: 600;
      color: #111827;
      display: block;
    }

    .rate-benchmark,
    .rate-gap {
      font-size: 0.75rem;
      color: #6b7280;
    }

    /* Filters Bar */
    .filters-bar {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: white;
      border-radius: 0.75rem;
      border: 1px solid #e5e7eb;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      flex: 1;
      min-width: 200px;
    }

    .search-box svg {
      width: 1rem;
      height: 1rem;
      color: #9ca3af;
    }

    .search-box input {
      border: none;
      background: none;
      outline: none;
      flex: 1;
      font-size: 0.875rem;
    }

    .filter-group select {
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      background: white;
    }

    /* Data Table */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .data-table th,
    .data-table td {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }

    .data-table th {
      background: #f9fafb;
      font-weight: 600;
      color: #374151;
    }

    .data-table tbody tr:hover {
      background: #f9fafb;
    }

    .text-right {
      text-align: right !important;
    }

    .text-muted {
      color: #9ca3af;
    }

    .font-semibold {
      font-weight: 600;
    }

    .measure-code {
      background: #f3f4f6;
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
    }

    .measure-name-cell {
      max-width: 300px;
    }

    .measure-title {
      display: block;
      font-weight: 500;
      color: #374151;
    }

    .measure-desc {
      display: block;
      font-size: 0.75rem;
      color: #9ca3af;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .category-badge {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .category-badge.preventive {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .category-badge.chronic {
      background: #fee2e2;
      color: #dc2626;
    }

    .category-badge.behavioral {
      background: #f3e8ff;
      color: #7c3aed;
    }

    .category-badge.safety {
      background: #fef3c7;
      color: #d97706;
    }

    .rate-display {
      font-weight: 600;
    }

    .rate-display.good { color: #059669; }
    .rate-display.warning { color: #d97706; }
    .rate-display.danger { color: #dc2626; }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-badge svg {
      width: 0.75rem;
      height: 0.75rem;
    }

    .status-badge.met {
      background: #d1fae5;
      color: #059669;
    }

    .status-badge.not_met {
      background: #fee2e2;
      color: #dc2626;
    }

    .status-badge.pending {
      background: #fef3c7;
      color: #d97706;
    }

    .trend-indicator {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      color: #6b7280;
    }

    .trend-indicator svg {
      width: 0.875rem;
      height: 0.875rem;
    }

    .trend-indicator.up {
      color: #059669;
    }

    .trend-indicator.down {
      color: #dc2626;
    }

    .btn-icon {
      padding: 0.375rem;
      border: none;
      background: transparent;
      color: #6b7280;
      border-radius: 0.375rem;
      cursor: pointer;
    }

    .btn-icon:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-icon svg {
      width: 1rem;
      height: 1rem;
    }

    /* Care Gaps Tab */
    .gap-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .gap-card {
      padding: 1.25rem;
      background: white;
      border-radius: 0.75rem;
      border: 1px solid #e5e7eb;
      text-align: center;
    }

    .gap-card.total {
      background: #f9fafb;
    }

    .gap-card.urgent {
      background: #fef2f2;
      border-color: #fecaca;
    }

    .gap-card.upcoming {
      background: #fffbeb;
      border-color: #fde68a;
    }

    .gap-card.scheduled {
      background: #f0fdf4;
      border-color: #86efac;
    }

    .gap-count {
      display: block;
      font-size: 2rem;
      font-weight: 700;
      color: #111827;
    }

    .gap-card.urgent .gap-count { color: #dc2626; }
    .gap-card.upcoming .gap-count { color: #d97706; }
    .gap-card.scheduled .gap-count { color: #059669; }

    .gap-label {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .gaps-table-container {
      background: white;
      border-radius: 0.75rem;
      border: 1px solid #e5e7eb;
      overflow-x: auto;
    }

    .patient-link {
      color: #2563eb;
      text-decoration: none;
      font-weight: 500;
    }

    .patient-link:hover {
      text-decoration: underline;
    }

    .measure-badge {
      display: inline-block;
      background: #f3f4f6;
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #374151;
    }

    .measure-name-small {
      display: block;
      font-size: 0.75rem;
      color: #6b7280;
    }

    .gap-reason {
      max-width: 200px;
      font-size: 0.75rem;
      color: #6b7280;
    }

    .due-date {
      font-weight: 500;
    }

    .due-date.overdue {
      color: #dc2626;
    }

    .due-date.soon {
      color: #d97706;
    }

    .gap-status-badge {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .gap-status-badge.non_compliant {
      background: #fee2e2;
      color: #dc2626;
    }

    .gap-status-badge.compliant {
      background: #d1fae5;
      color: #059669;
    }

    .gap-status-badge.excluded {
      background: #f3f4f6;
      color: #6b7280;
    }

    .next-action {
      font-size: 0.75rem;
      color: #374151;
      max-width: 150px;
    }

    .action-buttons {
      display: flex;
      gap: 0.25rem;
    }

    tr.overdue {
      background: #fef2f2;
    }

    tr.selected {
      background: #eff6ff !important;
    }

    /* Bulk Actions */
    .bulk-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #eff6ff;
      border-radius: 0.75rem;
      margin-top: 1rem;
    }

    .selection-count {
      font-weight: 500;
      color: #1d4ed8;
    }

    /* Compliance Tab */
    .compliance-overview {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .compliance-card {
      background: white;
      border-radius: 0.75rem;
      border: 1px solid #e5e7eb;
      padding: 1.25rem;
    }

    .compliance-card h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #374151;
      margin: 0 0 1rem 0;
    }

    .compliance-items {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .compliance-item {
      padding: 1rem;
      background: #f9fafb;
      border-radius: 0.5rem;
    }

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .item-name {
      font-weight: 500;
      color: #374151;
    }

    .item-status {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
    }

    .item-status.good {
      background: #d1fae5;
      color: #059669;
    }

    .item-status.warning {
      background: #fef3c7;
      color: #d97706;
    }

    .item-progress {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .item-progress .progress-bar {
      flex: 1;
      height: 6px;
    }

    .item-progress .progress-bar.warning .progress-fill {
      background: #f59e0b;
    }

    .progress-text {
      font-size: 0.75rem;
      color: #6b7280;
      min-width: 80px;
    }

    .item-deadline {
      font-size: 0.75rem;
      color: #9ca3af;
    }

    .item-details {
      font-size: 0.75rem;
      color: #6b7280;
      margin-top: 0.25rem;
    }

    .provider-compliance {
      background: white;
      border-radius: 0.75rem;
      border: 1px solid #e5e7eb;
      padding: 1.25rem;
    }

    .provider-compliance h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #374151;
      margin: 0 0 1rem 0;
    }

    .score-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .score-badge.good {
      background: #d1fae5;
      color: #059669;
    }

    .score-badge.warning {
      background: #fef3c7;
      color: #d97706;
    }

    .score-badge.danger {
      background: #fee2e2;
      color: #dc2626;
    }

    .compliance-status {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .compliance-status.compliant {
      background: #d1fae5;
      color: #059669;
    }

    .compliance-status.at-risk {
      background: #fef3c7;
      color: #d97706;
    }

    .compliance-status.non-compliant {
      background: #fee2e2;
      color: #dc2626;
    }

    /* Modal */
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
      padding: 1rem;
    }

    .modal {
      background: white;
      border-radius: 0.75rem;
      width: 100%;
      max-width: 700px;
      max-height: 90vh;
      overflow: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-title h2 {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0;
    }

    .modal-title .measure-id {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #6b7280;
      cursor: pointer;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid #e5e7eb;
      background: #f9fafb;
    }

    .measure-detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .detail-section {
      padding: 1rem;
      background: #f9fafb;
      border-radius: 0.5rem;
    }

    .detail-section.full-width {
      grid-column: 1 / -1;
    }

    .detail-section h4 {
      font-size: 0.75rem;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0 0 0.75rem 0;
    }

    .performance-metrics {
      display: flex;
      gap: 1.5rem;
    }

    .metric {
      display: flex;
      flex-direction: column;
    }

    .metric-label {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .metric-value {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
    }

    .metric-value.large {
      font-size: 2rem;
    }

    .metric-value.good {
      color: #059669;
    }

    .benchmark-bar {
      height: 40px;
      position: relative;
    }

    .benchmark-scale {
      position: absolute;
      left: 0;
      right: 0;
      top: 50%;
      height: 8px;
      background: linear-gradient(to right, #fee2e2, #fef3c7, #d1fae5);
      border-radius: 4px;
      transform: translateY(-50%);
    }

    .current-marker,
    .benchmark-marker,
    .target-marker {
      position: absolute;
      top: 50%;
      width: 4px;
      height: 20px;
      background: #374151;
      border-radius: 2px;
      transform: translate(-50%, -50%);
    }

    .marker-label {
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.625rem;
      color: #6b7280;
      white-space: nowrap;
      margin-top: 4px;
    }

    .current-marker {
      background: #2563eb;
    }

    .benchmark-marker {
      background: #f59e0b;
    }

    .target-marker {
      background: #22c55e;
    }

    .trend-chart {
      display: flex;
      align-items: flex-end;
      gap: 1rem;
      height: 100px;
    }

    .trend-bar-group {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .trend-bar {
      width: 100%;
      background: linear-gradient(180deg, #2563eb, #3b82f6);
      border-radius: 0.25rem 0.25rem 0 0;
      min-height: 4px;
    }

    .trend-label {
      font-size: 0.75rem;
      color: #6b7280;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .top-measures {
        grid-template-columns: 1fr;
      }

      .compliance-overview {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 1rem;
      }

      .header-actions {
        width: 100%;
        flex-wrap: wrap;
      }

      .performance-overview {
        flex-direction: column;
      }

      .performance-summary {
        padding-left: 0;
        border-left: none;
        padding-top: 1.5rem;
        border-top: 1px solid #e5e7eb;
      }

      .measure-detail-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class QualityMeasuresComponent implements OnInit {
  private reportsService = inject(ReportsService);

  // State
  activeTab = signal<QualityTab>('dashboard');
  reportingPeriod = '2024-Q4';
  qualityMeasures = signal<QualityMeasure[]>([]);
  careGaps = signal<CareGap[]>([]);
  selectedGaps = signal<Set<string>>(new Set());
  showMeasureDetail = signal(false);
  selectedMeasure = signal<QualityMeasure | null>(null);

  // Filters
  measureSearch = '';
  categoryFilter = '';
  statusFilter = '';
  gapSearch = '';
  gapMeasureFilter = '';
  gapProviderFilter = '';
  gapUrgencyFilter = '';

  // Computed values
  scoreCircumference = 2 * Math.PI * 45;

  overallScore = computed(() => {
    const measures = this.qualityMeasures();
    if (measures.length === 0) return 0;
    return (measures.filter(m => m.status === 'met').length / measures.length) * 100;
  });

  scoreOffset = computed(() => {
    const score = this.overallScore();
    return this.scoreCircumference * (1 - score / 100);
  });

  measuresMet = computed(() => this.qualityMeasures().filter(m => m.status === 'met').length);
  measuresNotMet = computed(() => this.qualityMeasures().filter(m => m.status === 'not_met').length);
  totalPatients = computed(() => this.qualityMeasures().reduce((sum, m) => sum + m.denominator, 0));
  totalCareGaps = computed(() => this.careGaps().filter(g => g.measureStatus === 'non_compliant').length);
  urgentGaps = computed(() => this.careGaps().filter(g => this.isOverdue(g)).length);
  upcomingGaps = computed(() => this.careGaps().filter(g => this.isDueSoon(g)).length);
  scheduledGaps = computed(() => this.careGaps().filter(g => g.nextAction?.includes('Scheduled')).length);

  categoryPerformance = computed(() => {
    const measures = this.qualityMeasures();
    const categories = ['Preventive Care', 'Chronic Disease', 'Behavioral Health'];
    return categories.map(name => {
      const catMeasures = measures.filter(m => 
        (name === 'Preventive Care' && m.category === 'preventive') ||
        (name === 'Chronic Disease' && m.category === 'chronic') ||
        (name === 'Behavioral Health' && m.category === 'behavioral')
      );
      const met = catMeasures.filter(m => m.status === 'met').length;
      const avgRate = catMeasures.length > 0 
        ? catMeasures.reduce((sum, m) => sum + m.rate, 0) / catMeasures.length 
        : 0;
      const avgTarget = catMeasures.length > 0
        ? catMeasures.reduce((sum, m) => sum + (m.target ?? 0.80), 0) / catMeasures.length
        : 0.80;
      return {
        name,
        rate: avgRate,
        target: avgTarget,
        measuresMet: met,
        totalMeasures: catMeasures.length
      };
    });
  });

  topMeasures = computed(() => 
    [...this.qualityMeasures()]
      .filter(m => m.status === 'met')
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 4)
  );

  bottomMeasures = computed(() => 
    [...this.qualityMeasures()]
      .filter(m => m.status === 'not_met')
      .sort((a, b) => ((a.target ?? 0.80) - a.rate) - ((b.target ?? 0.80) - b.rate))
      .slice(0, 4)
  );

  filteredMeasures = computed(() => {
    let measures = this.qualityMeasures();
    if (this.measureSearch) {
      const search = this.measureSearch.toLowerCase();
      measures = measures.filter(m => 
        m.measureName.toLowerCase().includes(search) ||
        m.measureId.toLowerCase().includes(search)
      );
    }
    if (this.categoryFilter) {
      measures = measures.filter(m => m.category === this.categoryFilter);
    }
    if (this.statusFilter) {
      measures = measures.filter(m => m.status === this.statusFilter);
    }
    return measures;
  });

  measureTrendData = computed(() => {
    const measure = this.selectedMeasure();
    if (!measure?.trend) return [];
    return [
      { period: 'Q1', value: measure.rate * 0.92 },
      { period: 'Q2', value: measure.rate * 0.95 },
      { period: 'Q3', value: measure.rate * 0.98 },
      { period: 'Q4', value: measure.rate }
    ];
  });

  providerCompliance = computed(() => [
    { name: 'Dr. Smith', score: 92, measuresMet: 6, totalMeasures: 7, careGaps: 12, documentation: 95, status: 'compliant' },
    { name: 'Dr. Johnson', score: 85, measuresMet: 5, totalMeasures: 7, careGaps: 28, documentation: 88, status: 'compliant' },
    { name: 'Dr. Williams', score: 78, measuresMet: 4, totalMeasures: 7, careGaps: 45, documentation: 82, status: 'at-risk' },
    { name: 'Dr. Brown', score: 68, measuresMet: 3, totalMeasures: 7, careGaps: 67, documentation: 75, status: 'non-compliant' },
    { name: 'Dr. Davis', score: 88, measuresMet: 5, totalMeasures: 7, careGaps: 19, documentation: 91, status: 'compliant' }
  ]);

  allGapsSelected = computed(() => {
    const gaps = this.careGaps();
    return gaps.length > 0 && this.selectedGaps().size === gaps.length;
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.reportsService.getQualityMeasures().subscribe(measures => {
      this.qualityMeasures.set(measures);
    });
    this.loadCareGaps();
  }

  loadCareGaps(): void {
    // Mock care gaps data
    const gaps: CareGap[] = [
      { patientId: 'P001', patientName: 'John Smith', dateOfBirth: new Date('1958-03-15'), measureId: 'CMS122', measureName: 'Diabetes HbA1c Control', measureStatus: 'non_compliant', lastServiceDate: new Date('2024-06-15'), gapReason: 'HbA1c > 9%', nextAction: 'Schedule lab work', dueDate: new Date('2024-12-01') },
      { patientId: 'P002', patientName: 'Mary Johnson', dateOfBirth: new Date('1962-07-22'), measureId: 'CMS130', measureName: 'Colorectal Cancer Screening', measureStatus: 'non_compliant', lastServiceDate: new Date('2024-02-10'), gapReason: 'No colonoscopy on file', nextAction: 'Order colonoscopy', dueDate: new Date('2025-01-15') },
      { patientId: 'P003', patientName: 'Robert Williams', dateOfBirth: new Date('1955-11-08'), measureId: 'CMS165', measureName: 'Controlling High Blood Pressure', measureStatus: 'non_compliant', lastServiceDate: new Date('2024-09-20'), gapReason: 'BP > 140/90', nextAction: 'Scheduled 12/15', dueDate: new Date('2024-12-31') },
      { patientId: 'P004', patientName: 'Patricia Brown', dateOfBirth: new Date('1970-04-30'), measureId: 'CMS125', measureName: 'Breast Cancer Screening', measureStatus: 'non_compliant', lastServiceDate: new Date('2023-08-12'), gapReason: 'Mammogram overdue', nextAction: 'Schedule mammogram', dueDate: new Date('2024-11-30') },
      { patientId: 'P005', patientName: 'Michael Davis', dateOfBirth: new Date('1968-09-14'), measureId: 'CMS2', measureName: 'Depression Screening', measureStatus: 'non_compliant', lastServiceDate: new Date('2024-10-05'), gapReason: 'PHQ-9 not completed', nextAction: 'Complete at next visit', dueDate: new Date('2025-02-28') },
      { patientId: 'P006', patientName: 'Linda Miller', dateOfBirth: new Date('1975-01-25'), measureId: 'CMS138', measureName: 'Tobacco Screening', measureStatus: 'non_compliant', lastServiceDate: new Date('2024-07-18'), gapReason: 'No tobacco assessment', nextAction: 'Assess at next visit', dueDate: new Date('2025-01-31') },
      { patientId: 'P007', patientName: 'James Wilson', dateOfBirth: new Date('1960-06-03'), measureId: 'CMS127', measureName: 'Pneumococcal Vaccination', measureStatus: 'compliant', lastServiceDate: new Date('2024-11-01'), gapReason: '', nextAction: 'None required', dueDate: undefined },
      { patientId: 'P008', patientName: 'Barbara Moore', dateOfBirth: new Date('1952-12-19'), measureId: 'CMS122', measureName: 'Diabetes HbA1c Control', measureStatus: 'non_compliant', lastServiceDate: new Date('2024-05-22'), gapReason: 'No recent HbA1c', nextAction: 'Order HbA1c', dueDate: new Date('2024-11-22') }
    ];
    this.careGaps.set(gaps);
  }

  onPeriodChange(): void {
    this.loadData();
  }

  filterMeasures(): void {
    // Triggers computed signal update
  }

  isOverdue(gap: CareGap): boolean {
    if (!gap.dueDate) return false;
    return new Date(gap.dueDate) < new Date();
  }

  isDueSoon(gap: CareGap): boolean {
    if (!gap.dueDate) return false;
    const dueDate = new Date(gap.dueDate);
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return dueDate >= now && dueDate <= thirtyDays;
  }

  toggleAllGaps(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      const allIds = new Set(this.careGaps().map(g => g.patientId));
      this.selectedGaps.set(allIds);
    } else {
      this.selectedGaps.set(new Set());
    }
  }

  toggleGapSelection(patientId: string): void {
    const selected = new Set(this.selectedGaps());
    if (selected.has(patientId)) {
      selected.delete(patientId);
    } else {
      selected.add(patientId);
    }
    this.selectedGaps.set(selected);
  }

  viewMeasureDetail(measure: QualityMeasure): void {
    this.selectedMeasure.set(measure);
    this.showMeasureDetail.set(true);
  }

  viewMeasurePatients(measure: QualityMeasure): void {
    this.activeTab.set('care-gaps');
    this.gapMeasureFilter = measure.measureId;
    this.showMeasureDetail.set(false);
  }

  scheduleAppointment(gap: CareGap): void {
    console.log('Schedule appointment for', gap.patientName);
  }

  sendReminder(gap: CareGap): void {
    console.log('Send reminder to', gap.patientName);
  }

  markComplete(gap: CareGap): void {
    console.log('Mark complete for', gap.patientName);
  }

  bulkSchedule(): void {
    console.log('Bulk schedule for', this.selectedGaps().size, 'patients');
  }

  bulkReminder(): void {
    console.log('Bulk reminder for', this.selectedGaps().size, 'patients');
  }

  exportGaps(): void {
    console.log('Export care gaps');
  }

  exportMeasures(): void {
    console.log('Export quality measures');
  }
}
