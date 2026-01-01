import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LabService } from '../data-access/services/lab.service';
import {
  LabOrder,
  LabTest,
  LabResult,
  LabOrderStatus,
  LabPriority,
  ResultInterpretation,
  STATUS_LABELS,
  PRIORITY_LABELS,
  INTERPRETATION_COLORS
} from '../data-access/models/lab.model';

interface ResultDisplay {
  test: LabTest;
  result?: LabResult;
  isAbnormal: boolean;
  isCritical: boolean;
  trend?: 'increasing' | 'decreasing' | 'stable';
}

@Component({
  selector: 'app-lab-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="lab-detail-container">
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading lab order...</p>
        </div>
      } @else if (!order()) {
        <div class="error-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h2>Lab Order Not Found</h2>
          <p>The requested lab order could not be found.</p>
          <button class="btn btn-primary" routerLink="/labs">Back to Lab Orders</button>
        </div>
      } @else {
        <!-- Header -->
        <div class="page-header">
          <div class="header-left">
            <button class="btn-back" routerLink="/labs">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <div class="header-content">
              <div class="header-title">
                <h1>{{ order()!.orderId }}</h1>
                <span class="status-badge" [class]="getStatusClass(order()!.status)">
                  {{ getStatusLabel(order()!.status) }}
                </span>
                <span class="priority-badge" [class]="'priority-' + order()!.priority">
                  {{ getPriorityLabel(order()!.priority) }}
                </span>
              </div>
              <p class="subtitle">
                {{ order()!.patientName }} • Ordered {{ formatDate(order()!.orderedDate) }}
              </p>
            </div>
          </div>
          <div class="header-actions">
            @if (canEdit()) {
              <button class="btn btn-secondary" [routerLink]="['..', order()!.orderId, 'edit']">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit Order
              </button>
            }
            @if (hasResults()) {
              <button class="btn btn-secondary" (click)="printResults()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6,9 6,2 18,2 18,9"/>
                  <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
                  <rect x="6" y="14" width="12" height="8"/>
                </svg>
                Print Results
              </button>
              <button class="btn btn-secondary" (click)="sendToPortal()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                Send to Portal
              </button>
            }
            @if (!hasResults() && order()!.status !== 'cancelled') {
              <button class="btn btn-secondary" (click)="printRequisition()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6,9 6,2 18,2 18,9"/>
                  <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
                  <rect x="6" y="14" width="12" height="8"/>
                </svg>
                Print Requisition
              </button>
            }
            <div class="dropdown">
              <button class="btn btn-icon" (click)="toggleMenu()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="1"/>
                  <circle cx="12" cy="5" r="1"/>
                  <circle cx="12" cy="19" r="1"/>
                </svg>
              </button>
              @if (menuOpen()) {
                <div class="dropdown-menu">
                  @if (canCancel()) {
                    <button (click)="cancelOrder()">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                      Cancel Order
                    </button>
                  }
                  <button (click)="duplicateOrder()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                    </svg>
                    Duplicate Order
                  </button>
                  <button (click)="viewHistory()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    View History
                  </button>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Alerts -->
        @if (hasCriticalResults()) {
          <div class="alert alert-critical">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div class="alert-content">
              <strong>Critical Values Detected</strong>
              <p>This order contains {{ criticalCount() }} critical result(s) requiring immediate attention.</p>
            </div>
            @if (!resultsAcknowledged()) {
              <button class="btn btn-critical" (click)="acknowledgeResults()">Acknowledge</button>
            }
          </div>
        } @else if (hasAbnormalResults()) {
          <div class="alert alert-warning">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div class="alert-content">
              <strong>Abnormal Results</strong>
              <p>{{ abnormalCount() }} result(s) are outside normal reference ranges.</p>
            </div>
          </div>
        }

        <div class="detail-grid">
          <!-- Main Content -->
          <div class="main-content">
            <!-- Results Section -->
            @if (hasResults()) {
              <section class="results-section">
                <div class="section-header">
                  <h2>Lab Results</h2>
                  <div class="result-summary">
                    <span class="summary-item normal">{{ normalCount() }} Normal</span>
                    @if (abnormalCount() > 0) {
                      <span class="summary-item abnormal">{{ abnormalCount() }} Abnormal</span>
                    }
                    @if (criticalCount() > 0) {
                      <span class="summary-item critical">{{ criticalCount() }} Critical</span>
                    }
                    @if (pendingCount() > 0) {
                      <span class="summary-item pending">{{ pendingCount() }} Pending</span>
                    }
                  </div>
                </div>

                <div class="results-table">
                  <div class="results-header">
                    <div class="col-test">Test</div>
                    <div class="col-result">Result</div>
                    <div class="col-range">Reference Range</div>
                    <div class="col-flag">Flag</div>
                    <div class="col-delta">Change</div>
                  </div>

                  @for (item of resultDisplays(); track item.test.testCode) {
                    <div class="result-row" 
                         [class.critical]="item.isCritical"
                         [class.abnormal]="item.isAbnormal && !item.isCritical">
                      <div class="col-test">
                        <span class="test-name">{{ item.test.testName }}</span>
                        <span class="test-code">{{ item.test.testCode }}</span>
                      </div>

                      <div class="col-result">
                        @if (item.result) {
                          <span class="result-value" [class.critical]="item.isCritical" [class.abnormal]="item.isAbnormal">
                            {{ formatResultValue(item.result) }}
                          </span>
                          @if (item.result.units) {
                            <span class="result-units">{{ item.result.units }}</span>
                          }
                        } @else {
                          <span class="pending-result">Pending</span>
                        }
                      </div>

                      <div class="col-range">
                        @if (item.result?.referenceRange) {
                          {{ formatReferenceRange(item.result!.referenceRange) }}
                        } @else {
                          <span class="no-range">—</span>
                        }
                      </div>

                      <div class="col-flag">
                        @if (item.result?.interpretation) {
                          <span class="flag-badge" [class]="getInterpretationClass(item.result!.interpretation)">
                            {{ getInterpretationLabel(item.result!.interpretation) }}
                          </span>
                        }
                      </div>

                      <div class="col-delta">
                        @if (item.result?.delta) {
                          <div class="delta-display">
                            @if (item.trend === 'increasing') {
                              <svg class="trend-icon up" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                                <polyline points="17 6 23 6 23 12"/>
                              </svg>
                            } @else if (item.trend === 'decreasing') {
                              <svg class="trend-icon down" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
                                <polyline points="17 18 23 18 23 12"/>
                              </svg>
                            } @else {
                              <svg class="trend-icon stable" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="5" y1="12" x2="19" y2="12"/>
                              </svg>
                            }
                            <span class="delta-value" [class]="item.trend">
                              {{ formatDeltaChange(item.result!.delta!.changePercent) }}
                            </span>
                          </div>
                          <span class="delta-previous">
                            was {{ item.result!.delta!.previousValue }}
                          </span>
                        }
                      </div>

                      @if (item.result?.labComments || item.result?.providerComments) {
                        <div class="result-comments">
                          @if (item.result?.labComments) {
                            <div class="comment lab-comment">
                              <strong>Lab:</strong> {{ item.result!.labComments }}
                            </div>
                          }
                          @if (item.result?.providerComments) {
                            <div class="comment provider-comment">
                              <strong>Provider:</strong> {{ item.result!.providerComments }}
                            </div>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
              </section>
            }

            <!-- Tests Ordered Section (when no results) -->
            @if (!hasResults()) {
              <section class="tests-section">
                <h2>Tests Ordered</h2>
                <div class="tests-list">
                  @for (test of order()!.tests; track test.testCode) {
                    <div class="test-item">
                      <div class="test-info">
                        <span class="test-name">{{ test.testName }}</span>
                        <span class="test-code">{{ test.testCode }}</span>
                        @if (test.loincCode) {
                          <span class="loinc-code">LOINC: {{ test.loincCode }}</span>
                        }
                      </div>
                      <div class="test-meta">
                        <span class="category-badge">{{ test.category }}</span>
                        @if (test.specimenType) {
                          <span class="specimen-type">{{ test.specimenType }}</span>
                        }
                      </div>
                    </div>
                  }
                </div>
              </section>
            }

            <!-- Clinical Information -->
            <section class="clinical-section">
              <h2>Clinical Information</h2>
              <div class="info-grid">
                @if (order()!.diagnosisCodes && order()!.diagnosisCodes!.length > 0) {
                  <div class="info-item">
                    <label>Diagnosis Codes</label>
                    <div class="diagnosis-codes">
                      @for (code of order()!.diagnosisCodes; track code) {
                        <span class="code-chip">{{ code }}</span>
                      }
                    </div>
                  </div>
                }

                @if (order()!.clinicalNotes) {
                  <div class="info-item full-width">
                    <label>Clinical Notes</label>
                    <p>{{ order()!.clinicalNotes }}</p>
                  </div>
                }

                @if (order()!.fastingRequired) {
                  <div class="info-item">
                    <label>Fasting Requirements</label>
                    <div class="fasting-info">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2"/>
                      </svg>
                      {{ order()!.fastingHours || 8 }} hours fasting required
                    </div>
                  </div>
                }

                @if (order()!.patientInstructions) {
                  <div class="info-item full-width">
                    <label>Patient Instructions</label>
                    <p>{{ order()!.patientInstructions }}</p>
                  </div>
                }

                @if (order()!.labInstructions) {
                  <div class="info-item full-width">
                    <label>Lab Instructions</label>
                    <p>{{ order()!.labInstructions }}</p>
                  </div>
                }
              </div>
            </section>

            <!-- Timeline -->
            <section class="timeline-section">
              <h2>Order Timeline</h2>
              <div class="timeline">
                <div class="timeline-item completed">
                  <div class="timeline-marker"></div>
                  <div class="timeline-content">
                    <span class="timeline-title">Order Created</span>
                    <span class="timeline-date">{{ formatDateTime(order()!.orderedDate) }}</span>
                    <span class="timeline-by">by {{ order()!.orderingProviderName }}</span>
                  </div>
                </div>

                @if (order()!.scheduledDate) {
                  <div class="timeline-item" [class.completed]="isDatePast(order()!.scheduledDate!)">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                      <span class="timeline-title">Scheduled Collection</span>
                      <span class="timeline-date">{{ formatDateTime(order()!.scheduledDate!) }}</span>
                    </div>
                  </div>
                }

                @if (order()!.collectionDate) {
                  <div class="timeline-item completed">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                      <span class="timeline-title">Specimen Collected</span>
                      <span class="timeline-date">{{ formatDateTime(order()!.collectionDate!) }}</span>
                      @if (order()!.collectionSiteName) {
                        <span class="timeline-location">at {{ order()!.collectionSiteName }}</span>
                      }
                    </div>
                  </div>
                }

                @if (order()!.receivedDate) {
                  <div class="timeline-item completed">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                      <span class="timeline-title">Received by Lab</span>
                      <span class="timeline-date">{{ formatDateTime(order()!.receivedDate!) }}</span>
                      @if (order()!.performingLabName) {
                        <span class="timeline-location">at {{ order()!.performingLabName }}</span>
                      }
                    </div>
                  </div>
                }

                @if (order()!.reportedDate) {
                  <div class="timeline-item completed">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                      <span class="timeline-title">Results Reported</span>
                      <span class="timeline-date">{{ formatDateTime(order()!.reportedDate!) }}</span>
                    </div>
                  </div>
                }
              </div>
            </section>
          </div>

          <!-- Sidebar -->
          <aside class="sidebar">
            <!-- Patient Card -->
            <div class="info-card">
              <h3>Patient</h3>
              <div class="card-content">
                <a [routerLink]="['/patients', order()!.patientId]" class="patient-link">
                  <div class="avatar">
                    {{ getInitials(order()!.patientName || 'Unknown') }}
                  </div>
                  <div class="patient-info">
                    <span class="patient-name">{{ order()!.patientName || 'Unknown Patient' }}</span>
                    <span class="patient-id">{{ order()!.patientId }}</span>
                  </div>
                </a>
              </div>
            </div>

            <!-- Provider Card -->
            <div class="info-card">
              <h3>Ordering Provider</h3>
              <div class="card-content">
                <div class="provider-info">
                  <span class="provider-name">{{ order()!.orderingProviderName }}</span>
                  @if (order()!.orderingProviderNPI) {
                    <span class="provider-npi">NPI: {{ order()!.orderingProviderNPI }}</span>
                  }
                </div>
              </div>
            </div>

            <!-- Lab Facility Card -->
            @if (order()!.performingLabName) {
              <div class="info-card">
                <h3>Performing Lab</h3>
                <div class="card-content">
                  <div class="facility-info">
                    <span class="facility-name">{{ order()!.performingLabName }}</span>
                    @if (order()!.performingLabId) {
                      <span class="facility-id">ID: {{ order()!.performingLabId }}</span>
                    }
                  </div>
                </div>
              </div>
            }

            <!-- Collection Site Card -->
            @if (order()!.collectionSiteName) {
              <div class="info-card">
                <h3>Collection Site</h3>
                <div class="card-content">
                  <div class="facility-info">
                    <span class="facility-name">{{ order()!.collectionSiteName }}</span>
                  </div>
                </div>
              </div>
            }

            <!-- Related Orders -->
            @if (relatedOrders().length > 0) {
              <div class="info-card">
                <h3>Related Orders</h3>
                <div class="related-orders">
                  @for (related of relatedOrders(); track related.orderId) {
                    <a [routerLink]="['..', related.orderId]" class="related-order">
                      <span class="order-id">{{ related.orderId }}</span>
                      <span class="order-date">{{ formatDate(related.orderedDate) }}</span>
                      <span class="status-badge small" [class]="getStatusClass(related.status)">
                        {{ getStatusLabel(related.status) }}
                      </span>
                    </a>
                  }
                </div>
              </div>
            }

            <!-- Quick Actions -->
            <div class="info-card">
              <h3>Quick Actions</h3>
              <div class="quick-actions">
                <button class="action-btn" (click)="orderNewLabs()">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  Order New Labs
                </button>
                <button class="action-btn" [routerLink]="['/patients', order()!.patientId, 'labs']">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                  View Lab History
                </button>
                @if (hasResults()) {
                  <button class="action-btn" (click)="viewTrends()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="20" x2="18" y2="10"/>
                      <line x1="12" y1="20" x2="12" y2="4"/>
                      <line x1="6" y1="20" x2="6" y2="14"/>
                    </svg>
                    View Trends
                  </button>
                }
              </div>
            </div>
          </aside>
        </div>
      }
    </div>
  `,
  styles: [`
    .lab-detail-container {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Loading & Error States */
    .loading-state,
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
    }

    .loading-state .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e5e7eb;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-state svg {
      width: 64px;
      height: 64px;
      color: #ef4444;
      margin-bottom: 1rem;
    }

    .error-state h2 {
      margin: 0 0 0.5rem 0;
      color: #1f2937;
    }

    .error-state p {
      color: #6b7280;
      margin-bottom: 1.5rem;
    }

    /* Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      gap: 1rem;
    }

    .header-left {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }

    .btn-back {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-back:hover {
      background: #f9fafb;
      border-color: #d1d5db;
    }

    .btn-back svg {
      width: 20px;
      height: 20px;
      color: #6b7280;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .header-title h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #1f2937;
    }

    .subtitle {
      margin: 0.25rem 0 0 0;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }

    .btn svg {
      width: 16px;
      height: 16px;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .btn-secondary {
      background: white;
      color: #374151;
      border: 1px solid #e5e7eb;
    }

    .btn-secondary:hover {
      background: #f9fafb;
      border-color: #d1d5db;
    }

    .btn-critical {
      background: #ef4444;
      color: white;
    }

    .btn-critical:hover {
      background: #dc2626;
    }

    .btn-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      padding: 0;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: white;
      cursor: pointer;
    }

    .btn-icon:hover {
      background: #f9fafb;
    }

    .btn-icon svg {
      width: 18px;
      height: 18px;
      color: #6b7280;
    }

    /* Dropdown */
    .dropdown {
      position: relative;
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 0.5rem;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      min-width: 180px;
      z-index: 50;
      overflow: hidden;
    }

    .dropdown-menu button {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.75rem 1rem;
      border: none;
      background: none;
      font-size: 0.875rem;
      color: #374151;
      cursor: pointer;
      text-align: left;
    }

    .dropdown-menu button:hover {
      background: #f9fafb;
    }

    .dropdown-menu svg {
      width: 16px;
      height: 16px;
      color: #6b7280;
    }

    /* Status & Priority Badges */
    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-badge.small {
      padding: 0.125rem 0.5rem;
      font-size: 0.625rem;
    }

    .status-draft { background: #f3f4f6; color: #6b7280; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-ordered { background: #dbeafe; color: #1e40af; }
    .status-scheduled { background: #e0e7ff; color: #4338ca; }
    .status-collected { background: #d1fae5; color: #065f46; }
    .status-received { background: #cffafe; color: #0e7490; }
    .status-in-progress { background: #fce7f3; color: #9d174d; }
    .status-preliminary { background: #fef9c3; color: #854d0e; }
    .status-final { background: #dcfce7; color: #166534; }
    .status-corrected { background: #fef3c7; color: #92400e; }
    .status-cancelled { background: #fee2e2; color: #991b1b; }

    .priority-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .priority-routine { background: #f3f4f6; color: #6b7280; }
    .priority-urgent { background: #fef3c7; color: #92400e; }
    .priority-asap { background: #fed7aa; color: #9a3412; }
    .priority-stat { background: #fee2e2; color: #991b1b; }

    /* Alerts */
    .alert {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
    }

    .alert svg {
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }

    .alert-content {
      flex: 1;
    }

    .alert-content strong {
      display: block;
      margin-bottom: 0.25rem;
    }

    .alert-content p {
      margin: 0;
      font-size: 0.875rem;
      opacity: 0.9;
    }

    .alert-critical {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }

    .alert-warning {
      background: #fffbeb;
      border: 1px solid #fde68a;
      color: #92400e;
    }

    /* Main Grid */
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 1.5rem;
    }

    /* Sections */
    section {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    section h2 {
      margin: 0 0 1rem 0;
      font-size: 1rem;
      font-weight: 600;
      color: #1f2937;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .section-header h2 {
      margin: 0;
    }

    .result-summary {
      display: flex;
      gap: 0.75rem;
    }

    .summary-item {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .summary-item.normal { background: #dcfce7; color: #166534; }
    .summary-item.abnormal { background: #fef3c7; color: #92400e; }
    .summary-item.critical { background: #fee2e2; color: #991b1b; }
    .summary-item.pending { background: #f3f4f6; color: #6b7280; }

    /* Results Table */
    .results-table {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }

    .results-header {
      display: grid;
      grid-template-columns: 2fr 1.5fr 1.5fr 1fr 1fr;
      gap: 1rem;
      padding: 0.75rem 1rem;
      background: #f9fafb;
      font-size: 0.75rem;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .result-row {
      display: grid;
      grid-template-columns: 2fr 1.5fr 1.5fr 1fr 1fr;
      gap: 1rem;
      padding: 1rem;
      border-top: 1px solid #e5e7eb;
      align-items: center;
    }

    .result-row.critical {
      background: #fef2f2;
    }

    .result-row.abnormal {
      background: #fffbeb;
    }

    .col-test .test-name {
      display: block;
      font-weight: 500;
      color: #1f2937;
    }

    .col-test .test-code {
      display: block;
      font-size: 0.75rem;
      color: #6b7280;
    }

    .col-result .result-value {
      font-weight: 600;
      color: #1f2937;
    }

    .col-result .result-value.critical {
      color: #dc2626;
    }

    .col-result .result-value.abnormal {
      color: #d97706;
    }

    .col-result .result-units {
      margin-left: 0.25rem;
      font-size: 0.75rem;
      color: #6b7280;
    }

    .col-result .pending-result {
      color: #9ca3af;
      font-style: italic;
    }

    .col-range {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .no-range {
      color: #d1d5db;
    }

    .flag-badge {
      display: inline-flex;
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .flag-normal { background: #dcfce7; color: #166534; }
    .flag-low { background: #dbeafe; color: #1e40af; }
    .flag-high { background: #fef3c7; color: #92400e; }
    .flag-critical-low,
    .flag-critical-high { background: #fee2e2; color: #991b1b; }
    .flag-abnormal { background: #fef3c7; color: #92400e; }
    .flag-positive { background: #fce7f3; color: #9d174d; }
    .flag-negative { background: #dcfce7; color: #166534; }

    .col-delta {
      font-size: 0.875rem;
    }

    .delta-display {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .trend-icon {
      width: 14px;
      height: 14px;
    }

    .trend-icon.up { color: #dc2626; }
    .trend-icon.down { color: #16a34a; }
    .trend-icon.stable { color: #6b7280; }

    .delta-value {
      font-weight: 500;
    }

    .delta-value.increasing { color: #dc2626; }
    .delta-value.decreasing { color: #16a34a; }
    .delta-value.stable { color: #6b7280; }

    .delta-previous {
      display: block;
      font-size: 0.75rem;
      color: #9ca3af;
    }

    .result-comments {
      grid-column: 1 / -1;
      padding-top: 0.75rem;
      border-top: 1px dashed #e5e7eb;
      margin-top: 0.5rem;
    }

    .comment {
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 0.25rem;
    }

    .comment strong {
      color: #374151;
    }

    /* Tests List */
    .tests-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .test-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 8px;
    }

    .test-info .test-name {
      display: block;
      font-weight: 500;
      color: #1f2937;
    }

    .test-info .test-code {
      display: inline-block;
      font-size: 0.75rem;
      color: #6b7280;
      margin-right: 0.5rem;
    }

    .test-info .loinc-code {
      font-size: 0.75rem;
      color: #9ca3af;
    }

    .test-meta {
      display: flex;
      gap: 0.5rem;
    }

    .category-badge {
      padding: 0.25rem 0.5rem;
      background: #dbeafe;
      color: #1e40af;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: capitalize;
    }

    .specimen-type {
      padding: 0.25rem 0.5rem;
      background: #f3f4f6;
      color: #6b7280;
      border-radius: 4px;
      font-size: 0.75rem;
      text-transform: capitalize;
    }

    /* Clinical Info Grid */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .info-item label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }

    .info-item p {
      margin: 0;
      color: #1f2937;
    }

    .info-item.full-width {
      grid-column: 1 / -1;
    }

    .diagnosis-codes {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .code-chip {
      display: inline-flex;
      padding: 0.25rem 0.5rem;
      background: #f3f4f6;
      border-radius: 4px;
      font-size: 0.875rem;
      color: #374151;
    }

    .fasting-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #374151;
    }

    .fasting-info svg {
      width: 16px;
      height: 16px;
      color: #6b7280;
    }

    /* Timeline */
    .timeline {
      position: relative;
      padding-left: 1.5rem;
    }

    .timeline::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0.5rem;
      bottom: 0.5rem;
      width: 2px;
      background: #e5e7eb;
    }

    .timeline-item {
      position: relative;
      padding-bottom: 1.5rem;
    }

    .timeline-item:last-child {
      padding-bottom: 0;
    }

    .timeline-marker {
      position: absolute;
      left: -1.5rem;
      top: 0.25rem;
      width: 10px;
      height: 10px;
      background: #e5e7eb;
      border-radius: 50%;
      transform: translateX(-4px);
    }

    .timeline-item.completed .timeline-marker {
      background: #3b82f6;
    }

    .timeline-content {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .timeline-title {
      font-weight: 500;
      color: #1f2937;
    }

    .timeline-date {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .timeline-by,
    .timeline-location {
      font-size: 0.75rem;
      color: #9ca3af;
    }

    /* Sidebar */
    .sidebar {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .info-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 1rem;
    }

    .info-card h3 {
      margin: 0 0 0.75rem 0;
      font-size: 0.75rem;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .patient-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
      color: inherit;
      padding: 0.5rem;
      margin: -0.5rem;
      border-radius: 8px;
      transition: background 0.2s;
    }

    .patient-link:hover {
      background: #f9fafb;
    }

    .avatar {
      width: 40px;
      height: 40px;
      background: #3b82f6;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .patient-info {
      display: flex;
      flex-direction: column;
    }

    .patient-name {
      font-weight: 500;
      color: #1f2937;
    }

    .patient-id {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .provider-info,
    .facility-info {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .provider-name,
    .facility-name {
      font-weight: 500;
      color: #1f2937;
    }

    .provider-npi,
    .facility-id {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .related-orders {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .related-order {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      margin: -0.25rem;
      border-radius: 6px;
      text-decoration: none;
      transition: background 0.2s;
    }

    .related-order:hover {
      background: #f9fafb;
    }

    .related-order .order-id {
      font-weight: 500;
      color: #3b82f6;
    }

    .related-order .order-date {
      flex: 1;
      font-size: 0.75rem;
      color: #6b7280;
    }

    .quick-actions {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.625rem 0.75rem;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      background: white;
      font-size: 0.875rem;
      color: #374151;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-btn:hover {
      background: #f9fafb;
      border-color: #d1d5db;
    }

    .action-btn svg {
      width: 16px;
      height: 16px;
      color: #6b7280;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .detail-grid {
        grid-template-columns: 1fr;
      }

      .sidebar {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
      }

      .results-header {
        display: none;
      }

      .result-row {
        grid-template-columns: 1fr;
        gap: 0.5rem;
      }
    }

    @media (max-width: 640px) {
      .page-header {
        flex-direction: column;
      }

      .header-actions {
        width: 100%;
        flex-wrap: wrap;
      }

      .sidebar {
        grid-template-columns: 1fr;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class LabDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly labService = inject(LabService);

  // State
  order = signal<LabOrder | null>(null);
  loading = signal(true);
  menuOpen = signal(false);
  relatedOrders = signal<LabOrder[]>([]);

  // Computed values
  resultDisplays = computed((): ResultDisplay[] => {
    const currentOrder = this.order();
    if (!currentOrder) return [];

    return currentOrder.tests.map(test => {
      const result = test.result;
      const isCritical = result?.interpretation === 'critical-low' ||
                        result?.interpretation === 'critical-high';
      const isAbnormal = result?.isAbnormal || isCritical;
      const trend = result?.delta?.trend;

      return {
        test,
        result,
        isAbnormal,
        isCritical,
        trend
      };
    });
  });

  hasResults = computed(() => {
    const currentOrder = this.order();
    return currentOrder?.tests.some(t => t.result) || false;
  });

  hasCriticalResults = computed(() => {
    return this.resultDisplays().some(r => r.isCritical);
  });

  hasAbnormalResults = computed(() => {
    return this.resultDisplays().some(r => r.isAbnormal && !r.isCritical);
  });

  criticalCount = computed(() => {
    return this.resultDisplays().filter(r => r.isCritical).length;
  });

  abnormalCount = computed(() => {
    return this.resultDisplays().filter(r => r.isAbnormal && !r.isCritical).length;
  });

  normalCount = computed(() => {
    return this.resultDisplays().filter(r => r.result && !r.isAbnormal).length;
  });

  pendingCount = computed(() => {
    return this.resultDisplays().filter(r => !r.result).length;
  });

  resultsAcknowledged = computed(() => {
    const currentOrder = this.order();
    return currentOrder?.tests.every(t => !t.result || t.result.verifiedAt) || false;
  });

  canEdit = computed(() => {
    const status = this.order()?.status;
    return status === 'draft' || status === 'pending';
  });

  canCancel = computed(() => {
    const status = this.order()?.status;
    return status && !['final', 'corrected', 'cancelled'].includes(status);
  });

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      this.loadOrder(orderId);
    }
  }

  loadOrder(orderId: string): void {
    this.loading.set(true);
    this.labService.getLabOrder(orderId).subscribe({
      next: (order) => {
        this.order.set(order);
        if (order) {
          this.loadRelatedOrders(order.patientId);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load lab order:', err);
        this.loading.set(false);
      }
    });
  }

  loadRelatedOrders(patientId: string): void {
    this.labService.getLabOrders({ patientId, pageSize: 5 }).subscribe({
      next: (result) => {
        const currentOrderId = this.order()?.orderId;
        this.relatedOrders.set(
          result.orders.filter(o => o.orderId !== currentOrderId).slice(0, 3)
        );
      }
    });
  }

  toggleMenu(): void {
    this.menuOpen.update(v => !v);
  }

  getStatusClass(status: LabOrderStatus): string {
    return `status-${status}`;
  }

  getStatusLabel(status: LabOrderStatus): string {
    return STATUS_LABELS[status] || status;
  }

  getPriorityLabel(priority: LabPriority): string {
    return PRIORITY_LABELS[priority] || priority;
  }

  getInterpretationClass(interpretation: ResultInterpretation | undefined): string {
    if (!interpretation) return '';
    return `flag-${interpretation}`;
  }

  getInterpretationLabel(interpretation: ResultInterpretation | undefined): string {
    if (!interpretation) return '';
    const labels: Record<ResultInterpretation, string> = {
      'normal': 'Normal',
      'low': 'Low',
      'high': 'High',
      'critical-low': 'Critical Low',
      'critical-high': 'Critical High',
      'abnormal': 'Abnormal',
      'positive': 'Positive',
      'negative': 'Negative',
      'indeterminate': 'Indeterminate',
      'not-detected': 'Not Detected',
      'detected': 'Detected'
    };
    return labels[interpretation] || interpretation;
  }

  formatResultValue(result: LabResult): string {
    if (result.numericValue !== undefined) {
      return result.numericValue.toString();
    }
    if (result.textValue) {
      return result.textValue;
    }
    if (result.codedValue) {
      return result.codedValue;
    }
    return '—';
  }

  formatReferenceRange(range: LabResult['referenceRange']): string {
    if (!range) return '';
    if (typeof range === 'string') return range;
    if (range.textRange) return range.textRange;
    if (range.lowValue !== undefined && range.highValue !== undefined) {
      return `${range.lowValue} - ${range.highValue}`;
    }
    if (range.lowValue !== undefined) return `> ${range.lowValue}`;
    if (range.highValue !== undefined) return `< ${range.highValue}`;
    return '';
  }

  formatDeltaChange(changePercent?: number): string {
    if (changePercent === undefined) return '';
    const sign = changePercent >= 0 ? '+' : '';
    return `${sign}${changePercent.toFixed(1)}%`;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  isDatePast(dateStr: string): boolean {
    return new Date(dateStr) < new Date();
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  // Actions
  printResults(): void {
    const orderId = this.order()?.orderId;
    if (orderId) {
      this.labService.printResults(orderId).subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
        },
        error: (err) => console.error('Failed to print results:', err)
      });
    }
  }

  printRequisition(): void {
    const orderId = this.order()?.orderId;
    if (orderId) {
      this.labService.printRequisition(orderId).subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
        },
        error: (err) => console.error('Failed to print requisition:', err)
      });
    }
  }

  sendToPortal(): void {
    const orderId = this.order()?.orderId;
    if (orderId) {
      this.labService.sendToPatientPortal(orderId).subscribe({
        next: (result) => {
          if (result.success) {
            alert('Results sent to patient portal');
          }
        },
        error: (err) => console.error('Failed to send to portal:', err)
      });
    }
  }

  acknowledgeResults(): void {
    const orderId = this.order()?.orderId;
    if (orderId) {
      this.labService.acknowledgeResults(orderId).subscribe({
        next: (updated) => {
          this.order.set(updated);
        },
        error: (err) => console.error('Failed to acknowledge results:', err)
      });
    }
  }

  cancelOrder(): void {
    this.menuOpen.set(false);
    const reason = prompt('Please enter cancellation reason:');
    if (reason) {
      const orderId = this.order()?.orderId;
      if (orderId) {
        this.labService.cancelLabOrder(orderId, reason).subscribe({
          next: (updated) => {
            this.order.set(updated);
          },
          error: (err) => console.error('Failed to cancel order:', err)
        });
      }
    }
  }

  duplicateOrder(): void {
    this.menuOpen.set(false);
    const currentOrder = this.order();
    if (currentOrder) {
      this.router.navigate(['/labs', 'new'], {
        queryParams: { duplicate: currentOrder.orderId }
      });
    }
  }

  viewHistory(): void {
    this.menuOpen.set(false);
    // Would open history modal
    console.log('View order history');
  }

  orderNewLabs(): void {
    const patientId = this.order()?.patientId;
    this.router.navigate(['/labs', 'new'], {
      queryParams: patientId ? { patientId } : {}
    });
  }

  viewTrends(): void {
    const patientId = this.order()?.patientId;
    if (patientId) {
      this.router.navigate(['/patients', patientId, 'labs', 'trends']);
    }
  }
}
