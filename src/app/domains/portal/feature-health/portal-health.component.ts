import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PortalService } from '../data-access/services/portal.service';
import { MedicationRecord, LabResultSummary, ImmunizationRecord, AllergyRecord, VitalRecord } from '../data-access/models/portal.model';

@Component({
  selector: 'app-portal-health',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="health-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <a routerLink="/portal" class="back-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to Dashboard
          </a>
          <h1>Health Records</h1>
        </div>
      </header>

      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="summary-card" (click)="activeTab.set('medications')">
          <div class="card-icon medications">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.5 20.5L3.5 13.5C2.1 12.1 2.1 9.9 3.5 8.5C4.9 7.1 7.1 7.1 8.5 8.5L15.5 15.5"/>
              <path d="M13.5 3.5L20.5 10.5C21.9 11.9 21.9 14.1 20.5 15.5C19.1 16.9 16.9 16.9 15.5 15.5L8.5 8.5"/>
            </svg>
          </div>
          <div class="card-content">
            <span class="card-value">{{ portalService.activeMedications().length }}</span>
            <span class="card-label">Active Medications</span>
          </div>
        </div>
        <div class="summary-card" (click)="activeTab.set('labs')">
          <div class="card-icon labs">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 3h6v2H9z"/>
              <path d="M8 5v4l-3 9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2l-3-9V5"/>
            </svg>
          </div>
          <div class="card-content">
            <span class="card-value">{{ newLabCount() }}</span>
            <span class="card-label">New Lab Results</span>
          </div>
        </div>
        <div class="summary-card" (click)="activeTab.set('allergies')">
          <div class="card-icon allergies">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div class="card-content">
            <span class="card-value">{{ activeAllergiesCount() }}</span>
            <span class="card-label">Known Allergies</span>
          </div>
        </div>
        <div class="summary-card" (click)="activeTab.set('immunizations')">
          <div class="card-icon immunizations">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
              <line x1="6" y1="1" x2="6" y2="4"/>
              <line x1="10" y1="1" x2="10" y2="4"/>
              <line x1="14" y1="1" x2="14" y2="4"/>
            </svg>
          </div>
          <div class="card-content">
            <span class="card-value">{{ portalService.immunizations().length }}</span>
            <span class="card-label">Immunizations</span>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab-btn" [class.active]="activeTab() === 'medications'" (click)="activeTab.set('medications')">
          Medications
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'labs'" (click)="activeTab.set('labs')">
          Lab Results
          @if (newLabCount() > 0) {
            <span class="badge">{{ newLabCount() }}</span>
          }
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'allergies'" (click)="activeTab.set('allergies')">
          Allergies
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'immunizations'" (click)="activeTab.set('immunizations')">
          Immunizations
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'vitals'" (click)="activeTab.set('vitals')">
          Vitals
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'visits'" (click)="activeTab.set('visits')">
          Visit History
        </button>
      </div>

      <!-- Medications Tab -->
      @if (activeTab() === 'medications') {
        <div class="medications-section">
          <div class="section-header">
            <h2>Current Medications</h2>
          </div>
          <div class="medications-list">
            @for (med of portalService.activeMedications(); track med.id) {
              <div class="medication-card">
                <div class="med-header">
                  <div class="med-info">
                    <h3>{{ med.medicationName }}</h3>
                    @if (med.genericName && med.genericName !== med.medicationName) {
                      <span class="generic-name">({{ med.genericName }})</span>
                    }
                    <p class="dosage">{{ med.dosage }} - {{ med.frequency }}</p>
                  </div>
                  @if (med.isControlled) {
                    <span class="controlled-badge">Controlled</span>
                  }
                </div>
                <div class="med-details">
                  <div class="detail-row">
                    <span class="label">Instructions</span>
                    <span class="value">{{ med.instructions }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Prescribed by</span>
                    <span class="value">{{ med.prescribedBy }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Start Date</span>
                    <span class="value">{{ med.startDate | date:'MMM d, yyyy' }}</span>
                  </div>
                  @if (med.pharmacy) {
                    <div class="detail-row">
                      <span class="label">Pharmacy</span>
                      <span class="value">{{ med.pharmacy }}</span>
                    </div>
                  }
                </div>
                <div class="med-refills">
                  <div class="refill-info">
                    <span class="refill-count">{{ med.refillsRemaining }} refills remaining</span>
                    @if (med.lastFilledDate) {
                      <span class="last-filled">Last filled: {{ med.lastFilledDate | date:'MMM d, yyyy' }}</span>
                    }
                  </div>
                  @if (med.canRequestRefill) {
                    <button class="btn btn-primary btn-sm" (click)="requestRefill(med)">
                      Request Refill
                    </button>
                  }
                </div>
              </div>
            } @empty {
              <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10.5 20.5L3.5 13.5C2.1 12.1 2.1 9.9 3.5 8.5C4.9 7.1 7.1 7.1 8.5 8.5L15.5 15.5"/>
                  <path d="M13.5 3.5L20.5 10.5C21.9 11.9 21.9 14.1 20.5 15.5C19.1 16.9 16.9 16.9 15.5 15.5L8.5 8.5"/>
                </svg>
                <h3>No Active Medications</h3>
                <p>You don't have any active medications on file</p>
              </div>
            }
          </div>
        </div>
      }

      <!-- Lab Results Tab -->
      @if (activeTab() === 'labs') {
        <div class="labs-section">
          <div class="section-header">
            <h2>Lab Results</h2>
          </div>
          <div class="labs-list">
            @for (lab of portalService.labResults(); track lab.id) {
              <div class="lab-card" [class.new]="lab.isNew" [class.abnormal]="lab.hasAbnormal">
                <div class="lab-header">
                  <div class="lab-info">
                    <div class="lab-title-row">
                      <h3>{{ lab.testName }}</h3>
                      @if (lab.isNew) {
                        <span class="new-badge">New</span>
                      }
                      @if (lab.hasAbnormal) {
                        <span class="abnormal-badge">Abnormal</span>
                      }
                    </div>
                    <p class="lab-date">Ordered: {{ lab.orderDate | date:'MMM d, yyyy' }}</p>
                  </div>
                  <span class="status-badge" [class]="lab.status">
                    {{ formatLabStatus(lab.status) }}
                  </span>
                </div>
                @if (lab.resultDate) {
                  <div class="lab-result-date">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    Results available: {{ lab.resultDate | date:'MMM d, yyyy' }}
                  </div>
                }
                <div class="lab-footer">
                  <span class="ordered-by">Ordered by {{ lab.orderedBy }}</span>
                  @if (lab.status === 'resulted' || lab.status === 'reviewed') {
                    <button class="btn btn-link" (click)="viewLabDetails(lab)">
                      View Results
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </button>
                  }
                </div>
              </div>
            } @empty {
              <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 3h6v2H9z"/>
                  <path d="M8 5v4l-3 9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2l-3-9V5"/>
                </svg>
                <h3>No Lab Results</h3>
                <p>Your lab results will appear here</p>
              </div>
            }
          </div>
        </div>
      }

      <!-- Allergies Tab -->
      @if (activeTab() === 'allergies') {
        <div class="allergies-section">
          <div class="section-header">
            <h2>Allergies</h2>
          </div>
          <div class="allergies-list">
            @for (allergy of portalService.allergies(); track allergy.id) {
              <div class="allergy-card" [class]="allergy.severity">
                <div class="allergy-header">
                  <div class="allergy-info">
                    <h3>{{ allergy.allergen }}</h3>
                    <span class="allergy-type">{{ allergy.type | titlecase }}</span>
                  </div>
                  <span class="severity-badge" [class]="allergy.severity">
                    {{ allergy.severity | titlecase }}
                  </span>
                </div>
                <div class="allergy-details">
                  <div class="detail-row">
                    <span class="label">Reaction</span>
                    <span class="value">{{ allergy.reaction }}</span>
                  </div>
                  @if (allergy.onsetDate) {
                    <div class="detail-row">
                      <span class="label">Onset</span>
                      <span class="value">{{ allergy.onsetDate | date:'MMM yyyy' }}</span>
                    </div>
                  }
                  @if (allergy.notes) {
                    <div class="detail-row">
                      <span class="label">Notes</span>
                      <span class="value">{{ allergy.notes }}</span>
                    </div>
                  }
                </div>
              </div>
            } @empty {
              <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <h3>No Known Allergies</h3>
                <p>No allergies recorded in your chart</p>
              </div>
            }
          </div>
        </div>
      }

      <!-- Immunizations Tab -->
      @if (activeTab() === 'immunizations') {
        <div class="immunizations-section">
          <div class="section-header">
            <h2>Immunization History</h2>
          </div>
          <div class="immunizations-list">
            @for (imm of portalService.immunizations(); track imm.id) {
              <div class="immunization-card">
                <div class="imm-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
                    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
                    <line x1="6" y1="1" x2="6" y2="4"/>
                    <line x1="10" y1="1" x2="10" y2="4"/>
                    <line x1="14" y1="1" x2="14" y2="4"/>
                  </svg>
                </div>
                <div class="imm-content">
                  <div class="imm-header">
                    <h3>{{ imm.vaccineName }}</h3>
                    @if (imm.seriesComplete) {
                      <span class="complete-badge">Complete</span>
                    }
                  </div>
                  <p class="imm-date">{{ imm.administeredDate | date:'MMM d, yyyy' }}</p>
                  <div class="imm-details">
                    <span>{{ imm.location }}</span>
                    @if (imm.lotNumber) {
                      <span>Lot: {{ imm.lotNumber }}</span>
                    }
                  </div>
                  @if (imm.nextDoseDate) {
                    <p class="next-dose">
                      Next dose: {{ imm.nextDoseDate | date:'MMM d, yyyy' }}
                    </p>
                  }
                </div>
              </div>
            } @empty {
              <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
                  <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
                </svg>
                <h3>No Immunizations</h3>
                <p>Your immunization history will appear here</p>
              </div>
            }
          </div>
        </div>
      }

      <!-- Vitals Tab -->
      @if (activeTab() === 'vitals') {
        <div class="vitals-section">
          <div class="section-header">
            <h2>Vital Signs History</h2>
          </div>
          @if (portalService.vitals().length > 0) {
            <div class="latest-vitals">
              <h3>Most Recent ({{ latestVitals()?.date | date:'MMM d, yyyy' }})</h3>
              <div class="vitals-grid">
                @if (latestVitals()?.bloodPressure) {
                  <div class="vital-item">
                    <span class="vital-label">Blood Pressure</span>
                    <span class="vital-value">{{ latestVitals()?.bloodPressure?.systolic }}/{{ latestVitals()?.bloodPressure?.diastolic }}</span>
                    <span class="vital-unit">mmHg</span>
                  </div>
                }
                @if (latestVitals()?.heartRate) {
                  <div class="vital-item">
                    <span class="vital-label">Heart Rate</span>
                    <span class="vital-value">{{ latestVitals()?.heartRate }}</span>
                    <span class="vital-unit">bpm</span>
                  </div>
                }
                @if (latestVitals()?.weight) {
                  <div class="vital-item">
                    <span class="vital-label">Weight</span>
                    <span class="vital-value">{{ latestVitals()?.weight?.value }}</span>
                    <span class="vital-unit">{{ latestVitals()?.weight?.unit }}</span>
                  </div>
                }
                @if (latestVitals()?.height) {
                  <div class="vital-item">
                    <span class="vital-label">Height</span>
                    <span class="vital-value">{{ latestVitals()?.height?.value }}</span>
                    <span class="vital-unit">{{ latestVitals()?.height?.unit }}</span>
                  </div>
                }
                @if (latestVitals()?.bmi) {
                  <div class="vital-item">
                    <span class="vital-label">BMI</span>
                    <span class="vital-value">{{ latestVitals()?.bmi?.toFixed(1) }}</span>
                    <span class="vital-unit">kg/m²</span>
                  </div>
                }
                @if (latestVitals()?.temperature) {
                  <div class="vital-item">
                    <span class="vital-label">Temperature</span>
                    <span class="vital-value">{{ latestVitals()?.temperature?.value }}</span>
                    <span class="vital-unit">{{ latestVitals()?.temperature?.unit }}</span>
                  </div>
                }
                @if (latestVitals()?.oxygenSaturation) {
                  <div class="vital-item">
                    <span class="vital-label">O2 Saturation</span>
                    <span class="vital-value">{{ latestVitals()?.oxygenSaturation }}</span>
                    <span class="vital-unit">%</span>
                  </div>
                }
                @if (latestVitals()?.respiratoryRate) {
                  <div class="vital-item">
                    <span class="vital-label">Respiratory Rate</span>
                    <span class="vital-value">{{ latestVitals()?.respiratoryRate }}</span>
                    <span class="vital-unit">breaths/min</span>
                  </div>
                }
              </div>
            </div>

            <div class="vitals-history">
              <h3>History</h3>
              <table class="vitals-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>BP</th>
                    <th>HR</th>
                    <th>Weight</th>
                    <th>BMI</th>
                    <th>Temp</th>
                  </tr>
                </thead>
                <tbody>
                  @for (vital of portalService.vitals(); track vital.id) {
                    <tr>
                      <td>{{ vital.date | date:'M/d/yy' }}</td>
                      <td>
                        @if (vital.bloodPressure) {
                          {{ vital.bloodPressure.systolic }}/{{ vital.bloodPressure.diastolic }}
                        } @else {
                          -
                        }
                      </td>
                      <td>{{ vital.heartRate || '-' }}</td>
                      <td>
                        @if (vital.weight) {
                          {{ vital.weight.value }}
                        } @else {
                          -
                        }
                      </td>
                      <td>{{ vital.bmi?.toFixed(1) || '-' }}</td>
                      <td>
                        @if (vital.temperature) {
                          {{ vital.temperature.value }}
                        } @else {
                          -
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <div class="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
              <h3>No Vitals Recorded</h3>
              <p>Your vital signs history will appear here</p>
            </div>
          }
        </div>
      }

      <!-- Visit History Tab -->
      @if (activeTab() === 'visits') {
        <div class="visits-section">
          <div class="section-header">
            <h2>Visit History</h2>
          </div>
          <div class="visits-list">
            @for (encounter of portalService.encounters(); track encounter.id) {
              <div class="visit-card">
                <div class="visit-date-badge">
                  <span class="day">{{ encounter.date | date:'d' }}</span>
                  <span class="month">{{ encounter.date | date:'MMM' }}</span>
                  <span class="year">{{ encounter.date | date:'yyyy' }}</span>
                </div>
                <div class="visit-content">
                  <div class="visit-header">
                    <h3>{{ encounter.visitType }}</h3>
                    <div class="visit-badges">
                      @if (encounter.hasLabResults) {
                        <span class="badge lab">Labs</span>
                      }
                      @if (encounter.hasDocuments) {
                        <span class="badge doc">Docs</span>
                      }
                    </div>
                  </div>
                  <p class="visit-provider">{{ encounter.providerName }} • {{ encounter.providerSpecialty }}</p>
                  @if (encounter.chiefComplaint) {
                    <p class="visit-complaint">{{ encounter.chiefComplaint }}</p>
                  }
                  @if (encounter.diagnoses.length > 0) {
                    <div class="visit-diagnoses">
                      @for (dx of encounter.diagnoses; track dx) {
                        <span class="diagnosis-chip">{{ dx }}</span>
                      }
                    </div>
                  }
                </div>
                <div class="visit-actions">
                  @if (encounter.canViewNotes) {
                    <button class="btn btn-link">
                      View Summary
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </button>
                  }
                </div>
              </div>
            } @empty {
              <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                </svg>
                <h3>No Visit History</h3>
                <p>Your past visits will appear here</p>
              </div>
            }
          </div>
        </div>
      }

      <!-- Lab Detail Modal -->
      @if (showLabDetailModal()) {
        <div class="modal-overlay" (click)="closeLabDetailModal()">
          <div class="modal lab-detail-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ selectedLabResult()?.testName }}</h2>
              <button class="btn-close" (click)="closeLabDetailModal()">×</button>
            </div>
            <div class="modal-body">
              <div class="lab-detail-info">
                <div class="info-row">
                  <span class="label">Order Date</span>
                  <span class="value">{{ selectedLabResult()?.orderDate | date:'MMM d, yyyy' }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Result Date</span>
                  <span class="value">{{ selectedLabResult()?.resultDate | date:'MMM d, yyyy' }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ordered By</span>
                  <span class="value">{{ selectedLabResult()?.orderedBy }}</span>
                </div>
              </div>
              <div class="lab-components">
                <h4>Results</h4>
                <table class="components-table">
                  <thead>
                    <tr>
                      <th>Test</th>
                      <th>Result</th>
                      <th>Reference Range</th>
                      <th>Flag</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Glucose</td>
                      <td>95 mg/dL</td>
                      <td>70-100 mg/dL</td>
                      <td><span class="flag-badge normal">Normal</span></td>
                    </tr>
                    <tr>
                      <td>BUN</td>
                      <td>18 mg/dL</td>
                      <td>7-20 mg/dL</td>
                      <td><span class="flag-badge normal">Normal</span></td>
                    </tr>
                    <tr>
                      <td>Creatinine</td>
                      <td>1.1 mg/dL</td>
                      <td>0.7-1.3 mg/dL</td>
                      <td><span class="flag-badge normal">Normal</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeLabDetailModal()">Close</button>
              <button class="btn btn-primary">Download PDF</button>
            </div>
          </div>
        </div>
      }

      <!-- Refill Request Modal -->
      @if (showRefillModal()) {
        <div class="modal-overlay" (click)="closeRefillModal()">
          <div class="modal refill-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Request Refill</h2>
              <button class="btn-close" (click)="closeRefillModal()">×</button>
            </div>
            <div class="modal-body">
              <div class="medication-summary">
                <h3>{{ selectedMedication()?.medicationName }}</h3>
                <p>{{ selectedMedication()?.dosage }} - {{ selectedMedication()?.frequency }}</p>
                <p class="refills-remaining">{{ selectedMedication()?.refillsRemaining }} refills remaining</p>
              </div>
              <div class="form-group">
                <label for="pharmacy">Pharmacy</label>
                <select id="pharmacy" [(ngModel)]="selectedPharmacy">
                  <option value="">{{ selectedMedication()?.pharmacy }}</option>
                </select>
              </div>
              <div class="form-group">
                <label for="notes">Notes for pharmacy (optional)</label>
                <textarea id="notes" [(ngModel)]="pharmacyNotes" rows="3" placeholder="Any special instructions"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeRefillModal()">Cancel</button>
              <button class="btn btn-primary" (click)="submitRefillRequest()">Submit Request</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .health-container {
      padding: 1.5rem;
      max-width: 1000px;
      margin: 0 auto;
    }

    /* Header */
    .page-header {
      margin-bottom: 1.5rem;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.8125rem;
      color: #64748b;
      text-decoration: none;
      margin-bottom: 0.5rem;
    }

    .back-link:hover {
      color: #3b82f6;
    }

    .back-link svg {
      width: 1rem;
      height: 1rem;
    }

    .header-content h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
    }

    /* Summary Cards */
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
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
      cursor: pointer;
      transition: all 0.2s;
    }

    .summary-card:hover {
      border-color: #3b82f6;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
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

    .card-icon.medications { background: #dbeafe; color: #3b82f6; }
    .card-icon.labs { background: #dcfce7; color: #16a34a; }
    .card-icon.allergies { background: #fee2e2; color: #dc2626; }
    .card-icon.immunizations { background: #fef3c7; color: #d97706; }

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

    /* Tabs */
    .tabs {
      display: flex;
      gap: 0.25rem;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      overflow-x: auto;
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
      white-space: nowrap;
    }

    .tab-btn:hover {
      color: #3b82f6;
    }

    .tab-btn.active {
      color: #3b82f6;
      border-bottom-color: #3b82f6;
    }

    .tab-btn .badge {
      padding: 0.125rem 0.5rem;
      background: #ef4444;
      color: white;
      border-radius: 1rem;
      font-size: 0.75rem;
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
      text-decoration: none;
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
      background: white;
      color: #475569;
      border: 1px solid #e2e8f0;
    }

    .btn-secondary:hover {
      background: #f1f5f9;
    }

    .btn-link {
      background: transparent;
      color: #3b82f6;
      padding: 0.5rem;
    }

    .btn-link:hover {
      text-decoration: underline;
    }

    .btn svg {
      width: 1rem;
      height: 1rem;
    }

    /* Section Header */
    .section-header {
      margin-bottom: 1rem;
    }

    .section-header h2 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
    }

    /* Medications */
    .medications-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .medication-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      overflow: hidden;
    }

    .med-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .med-info h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
    }

    .generic-name {
      font-size: 0.8125rem;
      color: #64748b;
      margin-left: 0.25rem;
    }

    .dosage {
      margin: 0.25rem 0 0;
      font-size: 0.875rem;
      color: #475569;
    }

    .controlled-badge {
      padding: 0.25rem 0.5rem;
      background: #fef3c7;
      color: #92400e;
      border-radius: 0.375rem;
      font-size: 0.6875rem;
      font-weight: 500;
    }

    .med-details {
      padding: 1rem 1.25rem;
    }

    .detail-row {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .detail-row .label {
      font-size: 0.8125rem;
      color: #64748b;
      min-width: 100px;
    }

    .detail-row .value {
      font-size: 0.8125rem;
      color: #1e293b;
    }

    .med-refills {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1.25rem;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
    }

    .refill-info {
      display: flex;
      flex-direction: column;
    }

    .refill-count {
      font-size: 0.875rem;
      font-weight: 500;
      color: #1e293b;
    }

    .last-filled {
      font-size: 0.75rem;
      color: #64748b;
    }

    /* Lab Results */
    .labs-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .lab-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      overflow: hidden;
    }

    .lab-card.new {
      border-left: 4px solid #3b82f6;
    }

    .lab-card.abnormal {
      border-left: 4px solid #dc2626;
    }

    .lab-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 1rem 1.25rem;
    }

    .lab-title-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .lab-info h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
    }

    .new-badge {
      padding: 0.125rem 0.5rem;
      background: #dbeafe;
      color: #1d4ed8;
      border-radius: 0.25rem;
      font-size: 0.6875rem;
      font-weight: 500;
    }

    .abnormal-badge {
      padding: 0.125rem 0.5rem;
      background: #fee2e2;
      color: #dc2626;
      border-radius: 0.25rem;
      font-size: 0.6875rem;
      font-weight: 500;
    }

    .lab-date {
      margin: 0.25rem 0 0;
      font-size: 0.8125rem;
      color: #64748b;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-badge.ordered { background: #f1f5f9; color: #475569; }
    .status-badge.collected { background: #fef3c7; color: #d97706; }
    .status-badge.processing { background: #dbeafe; color: #1d4ed8; }
    .status-badge.resulted { background: #dcfce7; color: #16a34a; }
    .status-badge.reviewed { background: #dcfce7; color: #16a34a; }

    .lab-result-date {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1.25rem;
      background: #f0fdf4;
      font-size: 0.8125rem;
      color: #16a34a;
    }

    .lab-result-date svg {
      width: 1rem;
      height: 1rem;
    }

    .lab-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1.25rem;
      border-top: 1px solid #e2e8f0;
    }

    .ordered-by {
      font-size: 0.8125rem;
      color: #64748b;
    }

    /* Allergies */
    .allergies-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .allergy-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      overflow: hidden;
    }

    .allergy-card.severe,
    .allergy-card.life_threatening {
      border-left: 4px solid #dc2626;
    }

    .allergy-card.moderate {
      border-left: 4px solid #f59e0b;
    }

    .allergy-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .allergy-info h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
    }

    .allergy-type {
      font-size: 0.8125rem;
      color: #64748b;
    }

    .severity-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .severity-badge.mild { background: #f1f5f9; color: #475569; }
    .severity-badge.moderate { background: #fef3c7; color: #92400e; }
    .severity-badge.severe { background: #fee2e2; color: #dc2626; }
    .severity-badge.life_threatening { background: #7f1d1d; color: white; }

    .allergy-details {
      padding: 1rem 1.25rem;
    }

    /* Immunizations */
    .immunizations-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .immunization-card {
      display: flex;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
    }

    .imm-icon {
      width: 3rem;
      height: 3rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fef3c7;
      color: #d97706;
      border-radius: 0.75rem;
      flex-shrink: 0;
    }

    .imm-icon svg {
      width: 1.5rem;
      height: 1.5rem;
    }

    .imm-content {
      flex: 1;
    }

    .imm-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
    }

    .imm-header h3 {
      margin: 0;
      font-size: 0.9375rem;
      font-weight: 600;
      color: #1e293b;
    }

    .complete-badge {
      padding: 0.125rem 0.5rem;
      background: #dcfce7;
      color: #16a34a;
      border-radius: 0.25rem;
      font-size: 0.6875rem;
      font-weight: 500;
    }

    .imm-date {
      margin: 0;
      font-size: 0.875rem;
      color: #475569;
    }

    .imm-details {
      display: flex;
      gap: 1rem;
      margin-top: 0.25rem;
      font-size: 0.75rem;
      color: #64748b;
    }

    .next-dose {
      margin: 0.5rem 0 0;
      padding: 0.375rem 0.5rem;
      background: #fef3c7;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      color: #92400e;
      display: inline-block;
    }

    /* Vitals */
    .latest-vitals {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .latest-vitals h3 {
      margin: 0 0 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #64748b;
    }

    .vitals-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .vital-item {
      display: flex;
      flex-direction: column;
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: 0.5rem;
    }

    .vital-label {
      font-size: 0.75rem;
      color: #64748b;
    }

    .vital-value {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
    }

    .vital-unit {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .vitals-history {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      overflow: hidden;
    }

    .vitals-history h3 {
      margin: 0;
      padding: 1rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #1e293b;
      border-bottom: 1px solid #e2e8f0;
    }

    .vitals-table {
      width: 100%;
      border-collapse: collapse;
    }

    .vitals-table th {
      text-align: left;
      padding: 0.75rem 1rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: #64748b;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }

    .vitals-table td {
      padding: 0.75rem 1rem;
      font-size: 0.875rem;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
    }

    /* Visits */
    .visits-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .visit-card {
      display: flex;
      gap: 1rem;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      overflow: hidden;
    }

    .visit-date-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background: #f1f5f9;
      min-width: 4.5rem;
    }

    .visit-date-badge .day {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
      line-height: 1;
    }

    .visit-date-badge .month {
      font-size: 0.75rem;
      color: #64748b;
      text-transform: uppercase;
    }

    .visit-date-badge .year {
      font-size: 0.625rem;
      color: #94a3b8;
    }

    .visit-content {
      flex: 1;
      padding: 1rem 0;
    }

    .visit-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
    }

    .visit-header h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
    }

    .visit-badges {
      display: flex;
      gap: 0.25rem;
    }

    .badge {
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      font-size: 0.625rem;
      font-weight: 500;
    }

    .badge.lab { background: #dcfce7; color: #16a34a; }
    .badge.doc { background: #dbeafe; color: #3b82f6; }

    .visit-provider {
      margin: 0;
      font-size: 0.875rem;
      color: #64748b;
    }

    .visit-complaint {
      margin: 0.5rem 0 0;
      font-size: 0.8125rem;
      color: #475569;
    }

    .visit-diagnoses {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
      margin-top: 0.5rem;
    }

    .diagnosis-chip {
      padding: 0.25rem 0.5rem;
      background: #f1f5f9;
      color: #475569;
      border-radius: 0.375rem;
      font-size: 0.75rem;
    }

    .visit-actions {
      display: flex;
      align-items: center;
      padding-right: 1rem;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
    }

    .empty-state svg {
      width: 4rem;
      height: 4rem;
      color: #94a3b8;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      margin: 0 0 0.5rem;
      font-size: 1.125rem;
      color: #1e293b;
    }

    .empty-state p {
      margin: 0;
      color: #64748b;
      font-size: 0.9375rem;
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

    .lab-detail-modal {
      max-width: 600px;
    }

    .refill-modal {
      max-width: 450px;
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

    /* Lab Detail Modal */
    .lab-detail-info {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .info-row {
      display: flex;
      flex-direction: column;
    }

    .info-row .label {
      font-size: 0.75rem;
      color: #64748b;
    }

    .info-row .value {
      font-size: 0.875rem;
      font-weight: 500;
      color: #1e293b;
    }

    .lab-components h4 {
      margin: 0 0 0.75rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #1e293b;
    }

    .components-table {
      width: 100%;
      border-collapse: collapse;
    }

    .components-table th {
      text-align: left;
      padding: 0.5rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: #64748b;
      border-bottom: 1px solid #e2e8f0;
    }

    .components-table td {
      padding: 0.75rem 0.5rem;
      font-size: 0.875rem;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
    }

    .flag-badge {
      padding: 0.125rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .flag-badge.normal { background: #dcfce7; color: #16a34a; }
    .flag-badge.low { background: #dbeafe; color: #1d4ed8; }
    .flag-badge.high { background: #fee2e2; color: #dc2626; }
    .flag-badge.critical { background: #7f1d1d; color: white; }

    /* Refill Modal */
    .medication-summary {
      padding: 1rem;
      background: #f8fafc;
      border-radius: 0.5rem;
      margin-bottom: 1.25rem;
    }

    .medication-summary h3 {
      margin: 0 0 0.25rem;
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
    }

    .medication-summary p {
      margin: 0;
      font-size: 0.875rem;
      color: #64748b;
    }

    .refills-remaining {
      margin-top: 0.5rem !important;
      font-weight: 500;
      color: #16a34a !important;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }

    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-family: inherit;
    }

    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #3b82f6;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .summary-cards {
        grid-template-columns: repeat(2, 1fr);
      }

      .vitals-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .summary-cards {
        grid-template-columns: 1fr;
      }

      .vitals-grid {
        grid-template-columns: 1fr;
      }

      .visit-card {
        flex-direction: column;
      }

      .visit-date-badge {
        flex-direction: row;
        gap: 0.5rem;
        justify-content: flex-start;
        min-width: auto;
      }

      .visit-actions {
        padding: 0 1rem 1rem;
      }

      .lab-detail-info {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PortalHealthComponent {
  portalService = inject(PortalService);

  activeTab = signal<'medications' | 'labs' | 'allergies' | 'immunizations' | 'vitals' | 'visits'>('medications');
  
  showLabDetailModal = signal(false);
  selectedLabResult = signal<LabResultSummary | null>(null);
  
  showRefillModal = signal(false);
  selectedMedication = signal<MedicationRecord | null>(null);
  selectedPharmacy = '';
  pharmacyNotes = '';

  // Computed filtered count for allergies (can't use arrow functions in templates)
  activeAllergiesCount = computed(() => 
    this.portalService.allergies().filter(a => a.status === 'active').length
  );

  newLabCount = computed(() => 
    this.portalService.labResults().filter(l => l.isNew).length
  );

  latestVitals = computed(() => 
    this.portalService.vitals()[0] || null
  );

  formatLabStatus(status: string): string {
    const statusMap: Record<string, string> = {
      ordered: 'Ordered',
      collected: 'Collected',
      processing: 'Processing',
      resulted: 'Results Ready',
      reviewed: 'Reviewed'
    };
    return statusMap[status] || status;
  }

  viewLabDetails(lab: LabResultSummary): void {
    this.selectedLabResult.set(lab);
    this.showLabDetailModal.set(true);
  }

  closeLabDetailModal(): void {
    this.showLabDetailModal.set(false);
  }

  requestRefill(med: MedicationRecord): void {
    this.selectedMedication.set(med);
    this.selectedPharmacy = med.pharmacy || '';
    this.pharmacyNotes = '';
    this.showRefillModal.set(true);
  }

  closeRefillModal(): void {
    this.showRefillModal.set(false);
  }

  submitRefillRequest(): void {
    if (this.selectedMedication()) {
      this.portalService.requestRefill(this.selectedMedication()!.id, this.pharmacyNotes);
      this.closeRefillModal();
    }
  }
}
