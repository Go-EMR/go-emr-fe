import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ImagingService } from '../data-access/services/imaging.service';
import {
  ImagingOrder,
  ImagingReport,
  ImagingFinding,
  ImagingStudy,
  MODALITY_LABELS,
  STATUS_LABELS,
  PRIORITY_LABELS,
  CATEGORY_LABELS,
  BODY_REGION_LABELS,
  LATERALITY_LABELS,
  CONTRAST_LABELS,
  SEVERITY_COLORS,
  ImagingOrderStatus
} from '../data-access/models/imaging.model';

@Component({
  selector: 'app-imaging-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="imaging-detail">
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading imaging order...</p>
        </div>
      } @else if (order()) {
        <!-- Header -->
        <div class="page-header">
          <div class="header-nav">
            <a routerLink="/imaging" class="back-link">← Back to Orders</a>
          </div>
          <div class="header-content">
            <div class="header-main">
              <div class="order-title">
                <h1>{{ order()!.procedure }}</h1>
                <div class="order-meta">
                  <span class="order-id">{{ order()!.orderId }}</span>
                  @if (order()!.accessionNumber) {
                    <span class="accession">ACC: {{ order()!.accessionNumber }}</span>
                  }
                </div>
              </div>
              <div class="header-badges">
                <span class="status-badge" [class]="'status-' + order()!.status">
                  {{ getStatusLabel(order()!.status) }}
                </span>
                <span class="priority-badge" [class]="'priority-' + order()!.priority">
                  {{ getPriorityLabel(order()!.priority) }}
                </span>
                <span class="modality-badge" [class]="'modality-' + order()!.modality">
                  {{ getModalityLabel(order()!.modality) }}
                </span>
              </div>
            </div>
            <div class="header-actions">
              @if (canEdit()) {
                <a [routerLink]="['/imaging', order()!.orderId, 'edit']" class="btn btn-outline">
                  Edit Order
                </a>
              }
              @if (hasStudies()) {
                <button class="btn btn-primary" (click)="openPacsViewer()">
                  🖼️ View Images
                </button>
              }
              <button class="btn btn-outline" (click)="printOrder()">Print</button>
              <div class="dropdown">
                <button class="btn btn-outline" (click)="toggleMenu()">⋮</button>
                @if (menuOpen()) {
                  <div class="dropdown-menu">
                    <button (click)="duplicateOrder()">Duplicate Order</button>
                    <button (click)="sendToPortal()">Send to Patient Portal</button>
                    @if (canCancel()) {
                      <button class="danger" (click)="cancelOrder()">Cancel Order</button>
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Critical Finding Alert -->
        @if (order()!.report?.hasCriticalFindings) {
          <div class="critical-alert" [class.acknowledged]="order()!.report?.criticalFindingCommunicated">
            <div class="alert-icon">⚠️</div>
            <div class="alert-content">
              <strong>CRITICAL FINDING</strong>
              @if (order()!.report?.criticalFindingCommunicated) {
                <p>
                  Communicated to {{ order()!.report?.criticalFindingCommunicatedTo }}
                  on {{ formatDateTime(order()!.report?.criticalFindingCommunicatedAt) }}
                </p>
              } @else {
                <p>This study contains critical findings requiring immediate attention</p>
              }
            </div>
            @if (!order()!.report?.criticalFindingCommunicated) {
              <button class="btn btn-danger" (click)="acknowledgeCritical()">
                Acknowledge Critical Finding
              </button>
            }
          </div>
        }

        <div class="detail-layout">
          <!-- Main Content -->
          <div class="main-content">
            <!-- Report Section -->
            @if (order()!.report) {
              <section class="report-section">
                <div class="section-header">
                  <h2>Radiology Report</h2>
                  <div class="report-status">
                    <span class="report-badge" [class]="'report-' + order()!.report!.status">
                      {{ order()!.report!.status | titlecase }} Report
                    </span>
                    @if (order()!.report!.signedAt) {
                      <span class="signed-info">
                        Signed by {{ order()!.report!.radiologist?.name }}
                        on {{ formatDateTime(order()!.report!.signedAt) }}
                      </span>
                    }
                  </div>
                </div>

                <div class="report-content">
                  @if (order()!.report!.indication) {
                    <div class="report-field">
                      <label>Clinical Indication</label>
                      <p>{{ order()!.report!.indication }}</p>
                    </div>
                  }

                  @if (order()!.report!.comparison) {
                    <div class="report-field">
                      <label>Comparison</label>
                      <p>{{ order()!.report!.comparison }}</p>
                    </div>
                  }

                  @if (order()!.report!.technique) {
                    <div class="report-field">
                      <label>Technique</label>
                      <p>{{ order()!.report!.technique }}</p>
                    </div>
                  }

                  <div class="report-field findings">
                    <label>Findings</label>
                    <div class="findings-text">{{ order()!.report!.findings }}</div>
                  </div>

                  <div class="report-field impression">
                    <label>Impression</label>
                    <div class="impression-text">{{ order()!.report!.impression }}</div>
                  </div>

                  @if (order()!.report!.recommendations) {
                    <div class="report-field recommendations">
                      <label>Recommendations</label>
                      <p>{{ order()!.report!.recommendations }}</p>
                    </div>
                  }
                </div>

                <!-- Structured Findings -->
                @if (order()!.report!.structuredFindings && order()!.report!.structuredFindings!.length > 0) {
                  <div class="structured-findings">
                    <h3>Structured Findings</h3>
                    <div class="findings-list">
                      @for (finding of order()!.report!.structuredFindings; track $index) {
                        <div class="finding-card" [style.border-left-color]="getSeverityColor(finding.severity)">
                          <div class="finding-header">
                            <span class="finding-location">{{ finding.location }}</span>
                            <span class="severity-badge" [style.background]="getSeverityColor(finding.severity)">
                              {{ finding.severity | titlecase }}
                            </span>
                          </div>
                          <p class="finding-description">{{ finding.description }}</p>
                          @if (finding.measurements) {
                            <div class="finding-measurements">
                              @if (finding.measurements.length) {
                                <span>{{ finding.measurements.length }} {{ finding.measurements.unit }}</span>
                              }
                              @if (finding.measurements.width) {
                                <span>× {{ finding.measurements.width }} {{ finding.measurements.unit }}</span>
                              }
                              @if (finding.measurements.height) {
                                <span>× {{ finding.measurements.height }} {{ finding.measurements.unit }}</span>
                              }
                            </div>
                          }
                          @if (finding.comparisonToPrior) {
                            <div class="finding-comparison">
                              vs prior: <strong>{{ finding.comparisonToPrior }}</strong>
                            </div>
                          }
                          @if (finding.followUpRecommendation) {
                            <div class="finding-followup">
                              📋 {{ finding.followUpRecommendation }}
                            </div>
                          }
                        </div>
                      }
                    </div>
                  </div>
                }

                <!-- Addenda -->
                @if (order()!.report!.addenda && order()!.report!.addenda!.length > 0) {
                  <div class="addenda-section">
                    <h3>Addenda</h3>
                    @for (addendum of order()!.report!.addenda; track $index) {
                      <div class="addendum-card">
                        <div class="addendum-header">
                          <span class="addendum-by">{{ addendum.addedBy?.name }}</span>
                          <span class="addendum-date">{{ formatDateTime(addendum.addedAt) }}</span>
                        </div>
                        <p>{{ addendum.text }}</p>
                      </div>
                    }
                  </div>
                }
              </section>
            } @else {
              <!-- No Report Yet -->
              <section class="no-report-section">
                <div class="no-report-content">
                  <div class="no-report-icon">📋</div>
                  <h3>Report Not Yet Available</h3>
                  <p>
                    @switch (order()!.status) {
                      @case ('pending') {
                        This order is pending scheduling
                      }
                      @case ('scheduled') {
                        This study is scheduled for {{ formatDate(order()!.scheduledDate) }}
                      }
                      @case ('in-progress') {
                        This study is currently in progress
                      }
                      @case ('completed') {
                        The study is complete and awaiting radiologist interpretation
                      }
                      @default {
                        The report will be available once the study is completed and interpreted
                      }
                    }
                  </p>
                </div>
              </section>
            }

            <!-- Study Images -->
            @if (hasStudies()) {
              <section class="studies-section">
                <div class="section-header">
                  <h2>Study Images</h2>
                  <button class="btn btn-primary" (click)="openPacsViewer()">
                    Open Full Viewer
                  </button>
                </div>

                <div class="studies-grid">
                  @for (study of order()!.studies; track study.studyId) {
                    <div class="study-card">
                      <div class="study-preview" (click)="openStudyViewer(study)">
                        <div class="preview-placeholder">
                          <span class="preview-icon">🖼️</span>
                          <span>{{ study.numberOfImages }} images</span>
                        </div>
                      </div>
                      <div class="study-info">
                        <div class="study-id">{{ study.studyId }}</div>
                        <div class="study-meta">
                          {{ study.numberOfSeries }} series • {{ study.numberOfImages }} images
                        </div>
                        @if (study.equipment) {
                          <div class="study-equipment">{{ study.equipment }}</div>
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
              <div class="clinical-grid">
                @if (order()!.reasonForExam) {
                  <div class="clinical-field">
                    <label>Reason for Exam</label>
                    <p>{{ order()!.reasonForExam }}</p>
                  </div>
                }

                @if (order()!.clinicalHistory) {
                  <div class="clinical-field">
                    <label>Clinical History</label>
                    <p>{{ order()!.clinicalHistory }}</p>
                  </div>
                }

                @if (order()!.diagnosisCodes && order()!.diagnosisCodes!.length > 0) {
                  <div class="clinical-field">
                    <label>Diagnosis Codes</label>
                    <div class="diagnosis-chips">
                      @for (dx of order()!.diagnosisCodes; track dx.code) {
                        <span class="diagnosis-chip">
                          {{ dx.code }}: {{ dx.description }}
                        </span>
                      }
                    </div>
                  </div>
                }

                @if (order()!.priorStudies && order()!.priorStudies!.length > 0) {
                  <div class="clinical-field">
                    <label>Prior Studies for Comparison</label>
                    <div class="prior-studies">
                      @for (prior of order()!.priorStudies; track prior) {
                        <span class="prior-study">{{ prior }}</span>
                      }
                    </div>
                  </div>
                }
              </div>
            </section>

            <!-- Contrast & Safety -->
            @if (order()!.contrast?.required || hasSafetyInfo()) {
              <section class="safety-section">
                <h2>Contrast & Safety Screening</h2>
                <div class="safety-grid">
                  @if (order()!.contrast?.required) {
                    <div class="safety-card contrast">
                      <div class="safety-icon">💉</div>
                      <div class="safety-content">
                        <h4>Contrast Required</h4>
                        <p>Type: {{ getContrastLabel(order()!.contrast!.type!) }}</p>
                        @if (order()!.contrast!.allergies) {
                          <div class="allergy-warning">
                            ⚠️ Patient has contrast allergy: {{ order()!.contrast!.allergies }}
                          </div>
                        }
                      </div>
                    </div>
                  }

                  @if (order()!.safetyScreening) {
                    @if (order()!.safetyScreening!.pregnancyStatus !== 'not-applicable') {
                      <div class="safety-card" [class.warning]="order()!.safetyScreening!.pregnancyStatus === 'pregnant'">
                        <div class="safety-icon">🤰</div>
                        <div class="safety-content">
                          <h4>Pregnancy Status</h4>
                          <p>{{ order()!.safetyScreening!.pregnancyStatus | titlecase }}</p>
                        </div>
                      </div>
                    }

                    @if (order()!.safetyScreening!.hasImplants) {
                      <div class="safety-card warning">
                        <div class="safety-icon">🔧</div>
                        <div class="safety-content">
                          <h4>Implants Present</h4>
                          <p>{{ order()!.safetyScreening!.implantDetails }}</p>
                        </div>
                      </div>
                    }

                    @if (order()!.safetyScreening!.claustrophobia) {
                      <div class="safety-card warning">
                        <div class="safety-icon">😰</div>
                        <div class="safety-content">
                          <h4>Claustrophobia</h4>
                          <p>Patient reports claustrophobia - may need sedation</p>
                        </div>
                      </div>
                    }

                    @if (order()!.safetyScreening!.renalFunction) {
                      <div class="safety-card" 
                           [class.warning]="(order()!.safetyScreening!.renalFunction?.eGFR ?? 100) < 30">
                        <div class="safety-icon">🫘</div>
                        <div class="safety-content">
                          <h4>Renal Function</h4>
                          @if (order()!.safetyScreening!.renalFunction!.eGFR) {
                            <p>eGFR: {{ order()!.safetyScreening!.renalFunction!.eGFR }} mL/min/1.73m²</p>
                          }
                          @if (order()!.safetyScreening!.renalFunction!.creatinine) {
                            <p>Creatinine: {{ order()!.safetyScreening!.renalFunction!.creatinine }} mg/dL</p>
                          }
                        </div>
                      </div>
                    }
                  }
                </div>
              </section>
            }
          </div>

          <!-- Sidebar -->
          <div class="sidebar">
            <!-- Patient Info -->
            <div class="sidebar-card">
              <h3>Patient</h3>
              <div class="patient-info">
                <a [routerLink]="['/patients', order()!.patientId]" class="patient-name">
                  {{ order()!.patientName || 'Patient ' + order()!.patientId }}
                </a>
                @if (order()!.patientDOB) {
                  <div class="patient-dob">DOB: {{ formatDate(order()!.patientDOB) }}</div>
                }
              </div>
            </div>

            <!-- Order Details -->
            <div class="sidebar-card">
              <h3>Order Details</h3>
              <div class="detail-list">
                <div class="detail-row">
                  <span class="detail-label">Category</span>
                  <span class="detail-value">{{ getCategoryLabel(order()!.category) }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Body Region</span>
                  <span class="detail-value">{{ getBodyRegionLabel(order()!.bodyRegion) }}</span>
                </div>
                @if (order()!.laterality && order()!.laterality !== 'not-applicable') {
                  <div class="detail-row">
                    <span class="detail-label">Laterality</span>
                    <span class="detail-value">{{ getLateralityLabel(order()!.laterality!) }}</span>
                  </div>
                }
                @if (order()!.procedureCode) {
                  <div class="detail-row">
                    <span class="detail-label">Procedure Code</span>
                    <span class="detail-value">{{ order()!.procedureCode }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Timeline -->
            <div class="sidebar-card">
              <h3>Timeline</h3>
              <div class="timeline">
                <div class="timeline-item completed">
                  <div class="timeline-marker"></div>
                  <div class="timeline-content">
                    <div class="timeline-label">Ordered</div>
                    <div class="timeline-date">{{ formatDateTime(order()!.orderedDate) }}</div>
                    <div class="timeline-by">by {{ order()!.orderingProvider?.name }}</div>
                  </div>
                </div>

                @if (order()!.scheduledDate) {
                  <div class="timeline-item" [class.completed]="isDatePast(order()!.scheduledDate!)">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                      <div class="timeline-label">Scheduled</div>
                      <div class="timeline-date">{{ formatDateTime(order()!.scheduledDate!) }}</div>
                    </div>
                  </div>
                }

                @if (order()!.performedDate) {
                  <div class="timeline-item completed">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                      <div class="timeline-label">Performed</div>
                      <div class="timeline-date">{{ formatDateTime(order()!.performedDate!) }}</div>
                    </div>
                  </div>
                }

                @if (order()!.reportedDate) {
                  <div class="timeline-item completed">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                      <div class="timeline-label">Reported</div>
                      <div class="timeline-date">{{ formatDateTime(order()!.reportedDate!) }}</div>
                      @if (order()!.readingRadiologist) {
                        <div class="timeline-by">by {{ order()!.readingRadiologist!.name }}</div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Performing Facility -->
            @if (order()!.performingFacility) {
              <div class="sidebar-card">
                <h3>Performing Facility</h3>
                <div class="facility-info">
                  <div class="facility-name">{{ order()!.performingFacility!.name }}</div>
                  @if (order()!.performingFacility!.address) {
                    <div class="facility-address">{{ order()!.performingFacility!.address }}</div>
                  }
                  @if (order()!.performingFacility!.phone) {
                    <div class="facility-phone">📞 {{ order()!.performingFacility!.phone }}</div>
                  }
                </div>
              </div>
            }

            <!-- Related Orders -->
            @if (relatedOrders().length > 0) {
              <div class="sidebar-card">
                <h3>Related Orders</h3>
                <div class="related-list">
                  @for (related of relatedOrders(); track related.orderId) {
                    <a [routerLink]="['/imaging', related.orderId]" class="related-item">
                      <span class="related-procedure">{{ related.procedure }}</span>
                      <span class="related-date">{{ formatDate(related.orderedDate) }}</span>
                    </a>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      } @else {
        <div class="error-state">
          <h2>Order Not Found</h2>
          <p>The imaging order you're looking for doesn't exist or has been removed.</p>
          <a routerLink="/imaging" class="btn btn-primary">Back to Orders</a>
        </div>
      }
    </div>
  `,
  styles: [`
    .imaging-detail {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Loading & Error States */
    .loading-state,
    .error-state {
      text-align: center;
      padding: 4rem 2rem;
    }

    .spinner {
      width: 2.5rem;
      height: 2.5rem;
      border: 3px solid #e2e8f0;
      border-top-color: #3b82f6;
      border-radius: 50%;
      margin: 0 auto 1rem;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Header */
    .page-header {
      margin-bottom: 1.5rem;
    }

    .header-nav {
      margin-bottom: 1rem;
    }

    .back-link {
      color: #64748b;
      text-decoration: none;
      font-size: 0.875rem;
    }

    .back-link:hover {
      color: #3b82f6;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1.5rem;
    }

    .order-title h1 {
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
      color: #1e293b;
    }

    .order-meta {
      display: flex;
      gap: 1rem;
      font-size: 0.875rem;
      color: #64748b;
    }

    .header-badges {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.75rem;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .btn-outline {
      background: white;
      border: 1px solid #e2e8f0;
      color: #475569;
    }

    .btn-outline:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
    }

    .btn-danger {
      background: #ef4444;
      color: white;
    }

    /* Dropdown */
    .dropdown {
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
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      z-index: 50;
      min-width: 180px;
    }

    .dropdown-menu button {
      display: block;
      width: 100%;
      padding: 0.625rem 1rem;
      text-align: left;
      background: none;
      border: none;
      font-size: 0.875rem;
      cursor: pointer;
    }

    .dropdown-menu button:hover {
      background: #f8fafc;
    }

    .dropdown-menu button.danger {
      color: #ef4444;
    }

    /* Badges */
    .status-badge,
    .priority-badge,
    .modality-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-draft { background: #f1f5f9; color: #64748b; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-scheduled { background: #dbeafe; color: #1e40af; }
    .status-in-progress { background: #e0e7ff; color: #4338ca; }
    .status-completed { background: #d1fae5; color: #065f46; }
    .status-preliminary { background: #fae8ff; color: #86198f; }
    .status-final { background: #dcfce7; color: #166534; }
    .status-addendum { background: #fef3c7; color: #92400e; }
    .status-cancelled { background: #fee2e2; color: #991b1b; }

    .priority-routine { background: #f1f5f9; color: #64748b; }
    .priority-urgent { background: #fef3c7; color: #92400e; }
    .priority-asap { background: #fee2e2; color: #b91c1c; }
    .priority-stat { background: #ef4444; color: white; }

    .modality-badge {
      background: #e2e8f0;
      color: #475569;
    }

    /* Critical Alert */
    .critical-alert {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
      background: linear-gradient(135deg, #fef2f2, #fee2e2);
      border: 2px solid #ef4444;
      border-radius: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .critical-alert.acknowledged {
      background: #f0fdf4;
      border-color: #22c55e;
    }

    .alert-icon {
      font-size: 1.5rem;
    }

    .alert-content {
      flex: 1;
    }

    .alert-content strong {
      color: #991b1b;
      display: block;
    }

    .critical-alert.acknowledged .alert-content strong {
      color: #166534;
    }

    .alert-content p {
      margin: 0.25rem 0 0 0;
      font-size: 0.875rem;
      color: #64748b;
    }

    /* Layout */
    .detail-layout {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 1.5rem;
    }

    /* Sections */
    section {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.25rem;
    }

    section h2 {
      margin: 0;
      font-size: 1.125rem;
      color: #1e293b;
    }

    section h3 {
      margin: 1.5rem 0 1rem 0;
      font-size: 1rem;
      color: #475569;
    }

    /* Report Section */
    .report-status {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.25rem;
    }

    .report-badge {
      padding: 0.25rem 0.625rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .report-draft { background: #f1f5f9; color: #64748b; }
    .report-preliminary { background: #fae8ff; color: #86198f; }
    .report-final { background: #dcfce7; color: #166534; }
    .report-addendum { background: #fef3c7; color: #92400e; }
    .report-amended { background: #fee2e2; color: #991b1b; }

    .signed-info {
      font-size: 0.75rem;
      color: #64748b;
    }

    .report-content {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .report-field label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }

    .report-field p {
      margin: 0;
      color: #1e293b;
      line-height: 1.6;
    }

    .findings-text,
    .impression-text {
      background: #f8fafc;
      padding: 1rem;
      border-radius: 0.5rem;
      white-space: pre-wrap;
      line-height: 1.7;
      color: #1e293b;
    }

    .impression-text {
      background: #fffbeb;
      border-left: 3px solid #f59e0b;
    }

    .recommendations {
      background: #f0fdf4;
      padding: 1rem;
      border-radius: 0.5rem;
      border-left: 3px solid #22c55e;
    }

    .recommendations p {
      margin: 0;
    }

    /* Structured Findings */
    .findings-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .finding-card {
      padding: 1rem;
      background: #f8fafc;
      border-radius: 0.5rem;
      border-left: 4px solid #94a3b8;
    }

    .finding-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .finding-location {
      font-weight: 600;
      color: #1e293b;
    }

    .severity-badge {
      padding: 0.125rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.6875rem;
      font-weight: 600;
      color: white;
      text-transform: uppercase;
    }

    .finding-description {
      margin: 0 0 0.5rem 0;
      color: #475569;
    }

    .finding-measurements,
    .finding-comparison,
    .finding-followup {
      font-size: 0.8125rem;
      color: #64748b;
    }

    .finding-followup {
      margin-top: 0.5rem;
      padding: 0.5rem;
      background: #fffbeb;
      border-radius: 0.25rem;
    }

    /* Addenda */
    .addendum-card {
      padding: 1rem;
      background: #fefce8;
      border-radius: 0.5rem;
      border-left: 3px solid #eab308;
      margin-bottom: 0.75rem;
    }

    .addendum-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      font-size: 0.8125rem;
    }

    .addendum-by {
      font-weight: 500;
      color: #1e293b;
    }

    .addendum-date {
      color: #64748b;
    }

    .addendum-card p {
      margin: 0;
      color: #475569;
    }

    /* No Report */
    .no-report-section {
      text-align: center;
      padding: 3rem 2rem;
    }

    .no-report-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .no-report-content h3 {
      margin: 0 0 0.5rem 0;
      color: #1e293b;
    }

    .no-report-content p {
      margin: 0;
      color: #64748b;
    }

    /* Studies Section */
    .studies-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }

    .study-card {
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .study-preview {
      height: 120px;
      background: #1e293b;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .preview-placeholder {
      text-align: center;
      color: #94a3b8;
    }

    .preview-icon {
      display: block;
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .study-info {
      padding: 0.75rem;
    }

    .study-id {
      font-weight: 500;
      color: #1e293b;
      font-size: 0.875rem;
    }

    .study-meta,
    .study-equipment {
      font-size: 0.75rem;
      color: #64748b;
    }

    /* Clinical Section */
    .clinical-grid {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .clinical-field label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }

    .clinical-field p {
      margin: 0;
      color: #1e293b;
    }

    .diagnosis-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .diagnosis-chip {
      display: inline-block;
      padding: 0.375rem 0.75rem;
      background: #f1f5f9;
      border-radius: 0.375rem;
      font-size: 0.8125rem;
      color: #475569;
    }

    .prior-studies {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .prior-study {
      color: #3b82f6;
      font-size: 0.875rem;
    }

    /* Safety Section */
    .safety-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1rem;
    }

    .safety-card {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 0.5rem;
    }

    .safety-card.warning {
      background: #fef3c7;
    }

    .safety-card.contrast {
      background: #dbeafe;
    }

    .safety-icon {
      font-size: 1.5rem;
    }

    .safety-content h4 {
      margin: 0 0 0.25rem 0;
      font-size: 0.875rem;
      color: #1e293b;
    }

    .safety-content p {
      margin: 0;
      font-size: 0.8125rem;
      color: #64748b;
    }

    .allergy-warning {
      margin-top: 0.5rem;
      padding: 0.5rem;
      background: #fef2f2;
      border-radius: 0.25rem;
      font-size: 0.8125rem;
      color: #b91c1c;
    }

    /* Sidebar */
    .sidebar {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .sidebar-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 1.25rem;
    }

    .sidebar-card h3 {
      margin: 0 0 1rem 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .patient-name {
      display: block;
      font-size: 1rem;
      font-weight: 500;
      color: #3b82f6;
      text-decoration: none;
      margin-bottom: 0.25rem;
    }

    .patient-name:hover {
      text-decoration: underline;
    }

    .patient-dob {
      font-size: 0.8125rem;
      color: #64748b;
    }

    /* Detail List */
    .detail-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
    }

    .detail-label {
      color: #64748b;
    }

    .detail-value {
      color: #1e293b;
      font-weight: 500;
    }

    /* Timeline */
    .timeline {
      position: relative;
      padding-left: 1.5rem;
    }

    .timeline::before {
      content: '';
      position: absolute;
      left: 0.5rem;
      top: 0.5rem;
      bottom: 0.5rem;
      width: 2px;
      background: #e2e8f0;
    }

    .timeline-item {
      position: relative;
      padding-bottom: 1.25rem;
    }

    .timeline-item:last-child {
      padding-bottom: 0;
    }

    .timeline-marker {
      position: absolute;
      left: -1.25rem;
      top: 0.25rem;
      width: 0.75rem;
      height: 0.75rem;
      border-radius: 50%;
      background: white;
      border: 2px solid #e2e8f0;
    }

    .timeline-item.completed .timeline-marker {
      background: #22c55e;
      border-color: #22c55e;
    }

    .timeline-label {
      font-size: 0.8125rem;
      font-weight: 500;
      color: #1e293b;
    }

    .timeline-date {
      font-size: 0.75rem;
      color: #64748b;
    }

    .timeline-by {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    /* Facility Info */
    .facility-name {
      font-weight: 500;
      color: #1e293b;
      margin-bottom: 0.25rem;
    }

    .facility-address,
    .facility-phone {
      font-size: 0.8125rem;
      color: #64748b;
    }

    /* Related Orders */
    .related-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .related-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      text-decoration: none;
      border-bottom: 1px solid #f1f5f9;
    }

    .related-item:last-child {
      border-bottom: none;
    }

    .related-procedure {
      font-size: 0.875rem;
      color: #3b82f6;
    }

    .related-date {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    @media (max-width: 1024px) {
      .detail-layout {
        grid-template-columns: 1fr;
      }

      .sidebar {
        order: -1;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .imaging-detail {
        padding: 1rem;
      }

      .header-content {
        flex-direction: column;
      }

      .header-actions {
        width: 100%;
        flex-wrap: wrap;
      }

      .sidebar {
        grid-template-columns: 1fr;
      }

      .safety-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ImagingDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly imagingService = inject(ImagingService);

  // State
  order = signal<ImagingOrder | null>(null);
  loading = signal(true);
  menuOpen = signal(false);
  relatedOrders = signal<ImagingOrder[]>([]);

  // Computed
  canEdit = computed(() => {
    const o = this.order();
    return o && ['draft', 'pending'].includes(o.status);
  });

  canCancel = computed(() => {
    const o = this.order();
    return o && !['completed', 'final', 'cancelled'].includes(o.status);
  });

  hasStudies = computed(() => {
    const o = this.order();
    return o?.studies && o.studies.length > 0;
  });

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      this.loadOrder(orderId);
    } else {
      this.loading.set(false);
    }
  }

  private loadOrder(orderId: string): void {
    this.loading.set(true);
    
    this.imagingService.getOrderById(orderId).subscribe({
      next: (order) => {
        this.order.set(order);
        this.loadRelatedOrders(order);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading imaging order:', err);
        this.order.set(null);
        this.loading.set(false);
      }
    });
  }

  private loadRelatedOrders(order: ImagingOrder): void {
    this.imagingService.getOrdersByPatient(order.patientId).subscribe({
      next: (orders) => {
        this.relatedOrders.set(
          orders.filter(o => o.orderId !== order.orderId).slice(0, 5)
        );
      }
    });
  }

  // Label helpers
  getStatusLabel(status: ImagingOrderStatus): string {
    return STATUS_LABELS[status] || status;
  }

  getPriorityLabel(priority: string): string {
    return PRIORITY_LABELS[priority as keyof typeof PRIORITY_LABELS] || priority;
  }

  getModalityLabel(modality: string): string {
    return MODALITY_LABELS[modality as keyof typeof MODALITY_LABELS] || modality;
  }

  getCategoryLabel(category: string): string {
    return CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category;
  }

  getBodyRegionLabel(region: string): string {
    return BODY_REGION_LABELS[region as keyof typeof BODY_REGION_LABELS] || region;
  }

  getLateralityLabel(laterality: string): string {
    return LATERALITY_LABELS[laterality as keyof typeof LATERALITY_LABELS] || laterality;
  }

  getContrastLabel(contrast: string): string {
    return CONTRAST_LABELS[contrast as keyof typeof CONTRAST_LABELS] || contrast;
  }

  getSeverityColor(severity: string): string {
    return SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS] || '#94a3b8';
  }

  // Date helpers
  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatDateTime(dateStr: string | undefined): string {
    if (!dateStr) return '';
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

  hasSafetyInfo(): boolean {
    const screening = this.order()?.safetyScreening;
    if (!screening) return false;
    return (
      screening.pregnancyStatus !== 'not-applicable' ||
      screening.hasImplants ||
      screening.claustrophobia ||
      !!screening.renalFunction
    );
  }

  // Actions
  toggleMenu(): void {
    this.menuOpen.set(!this.menuOpen());
  }

  openPacsViewer(): void {
    const order = this.order();
    if (order?.studies?.[0]?.viewerUrl) {
      window.open(order.studies[0].viewerUrl, '_blank');
    } else if (order) {
      this.imagingService.getPacsViewerUrl(order.orderId).subscribe(url => {
        window.open(url, '_blank');
      });
    }
  }

  openStudyViewer(study: ImagingStudy): void {
    if (study.viewerUrl) {
      window.open(study.viewerUrl, '_blank');
    }
  }

  printOrder(): void {
    window.print();
  }

  duplicateOrder(): void {
    const order = this.order();
    if (order) {
      this.router.navigate(['/imaging/new'], {
        queryParams: { duplicate: order.orderId }
      });
    }
    this.menuOpen.set(false);
  }

  sendToPortal(): void {
    console.log('Sending to patient portal...');
    this.menuOpen.set(false);
  }

  cancelOrder(): void {
    const order = this.order();
    if (order && confirm('Are you sure you want to cancel this order?')) {
      this.imagingService.cancelOrder(order.orderId, 'User requested cancellation').subscribe({
        next: (updated) => {
          this.order.set(updated);
        }
      });
    }
    this.menuOpen.set(false);
  }

  acknowledgeCritical(): void {
    const order = this.order();
    if (order) {
      this.imagingService.acknowledgeCriticalFinding(order.orderId, 'Current User').subscribe({
        next: (updated) => {
          this.order.set(updated);
        }
      });
    }
  }
}
