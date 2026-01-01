import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PrescriptionService } from '../data-access/services/prescription.service';
import { Prescription, PrescriptionHistory } from '../data-access/models/prescription.model';

@Component({
  selector: 'app-prescription-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="prescription-detail">
      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-container">
          <div class="skeleton-header"></div>
          <div class="skeleton-content"></div>
        </div>
      }

      <!-- Error State -->
      @if (error()) {
        <div class="error-container">
          <div class="error-icon">⚠️</div>
          <h2>Prescription Not Found</h2>
          <p>{{ error() }}</p>
          <button class="btn btn-primary" (click)="goBack()">
            ← Back to Prescriptions
          </button>
        </div>
      }

      <!-- Prescription Content -->
      @if (prescription(); as rx) {
        <!-- Header -->
        <header class="detail-header">
          <div class="header-left">
            <button class="btn-back" (click)="goBack()">
              <span class="back-icon">←</span>
            </button>
            <div class="header-info">
              <h1>{{ rx.medication.name }} {{ rx.medication.strength }}{{ rx.medication.strengthUnit }}</h1>
              <p class="subtitle">
                {{ rx.medication.form | titlecase }} • {{ rx.medication.route | titlecase }}
              </p>
            </div>
          </div>
          <div class="header-actions">
            @if (canEdit()) {
              <button class="btn btn-secondary" [routerLink]="['edit']">
                ✏️ Edit
              </button>
            }
            @if (rx.status === 'active') {
              <button class="btn btn-secondary" (click)="refillPrescription()">
                🔄 Refill
              </button>
              <button class="btn btn-secondary" (click)="printPrescription()">
                🖨️ Print
              </button>
            }
            <div class="actions-menu">
              <button class="btn btn-icon" (click)="toggleActionsMenu()">⋮</button>
              @if (showActionsMenu()) {
                <div class="dropdown-menu">
                  <button (click)="viewHistory()">📋 View History</button>
                  <button (click)="sendToPharmacy()">📤 Send to Pharmacy</button>
                  @if (rx.status === 'active') {
                    <button (click)="putOnHold()">⏸️ Put on Hold</button>
                    <button class="danger" (click)="discontinuePrescription()">🚫 Discontinue</button>
                  }
                  @if (rx.status === 'on-hold') {
                    <button (click)="reactivate()">▶️ Reactivate</button>
                  }
                </div>
              }
            </div>
          </div>
        </header>

        <!-- Status Bar -->
        <div class="status-bar">
          <div class="status-item">
            <span class="status-badge" [class]="'status-' + rx.status">
              {{ getStatusLabel(rx.status) }}
            </span>
          </div>
          @if (rx.transmissionStatus) {
            <div class="status-item">
              <span class="transmission-badge" [class]="'tx-' + rx.transmissionStatus">
                {{ getTransmissionLabel(rx.transmissionStatus) }}
              </span>
            </div>
          }
          @if (rx.isControlledSubstance) {
            <div class="status-item">
              <span class="controlled-badge">
                ⚠️ Schedule {{ rx.controlledSubstanceSchedule }}
              </span>
            </div>
          }
          @if (rx.priorAuthorizationRequired) {
            <div class="status-item">
              <span class="pa-badge" [class.approved]="rx.priorAuthorizationNumber">
                {{ rx.priorAuthorizationNumber ? '✓ PA Approved' : '⚠️ PA Required' }}
              </span>
            </div>
          }
          <div class="status-item last-updated">
            Last updated: {{ rx.updatedAt | date:'short' }}
          </div>
        </div>

        <!-- Main Content -->
        <div class="detail-content">
          <!-- Left Column - Main Info -->
          <div class="main-column">
            <!-- Medication Details Card -->
            <section class="card">
              <h2>Medication Details</h2>
              <div class="info-grid">
                <div class="info-item">
                  <label>Medication</label>
                  <span>{{ rx.medication.name }}</span>
                </div>
                @if (rx.medication.genericName && rx.medication.genericName !== rx.medication.name) {
                  <div class="info-item">
                    <label>Generic Name</label>
                    <span>{{ rx.medication.genericName }}</span>
                  </div>
                }
                @if (rx.medication.brandName) {
                  <div class="info-item">
                    <label>Brand Name</label>
                    <span>{{ rx.medication.brandName }}</span>
                  </div>
                }
                <div class="info-item">
                  <label>Strength</label>
                  <span>{{ rx.medication.strength }}{{ rx.medication.strengthUnit }}</span>
                </div>
                <div class="info-item">
                  <label>Form</label>
                  <span>{{ rx.medication.form | titlecase }}</span>
                </div>
                <div class="info-item">
                  <label>Route</label>
                  <span>{{ rx.medication.route | titlecase }}</span>
                </div>
                @if (rx.medication.drugClass) {
                  <div class="info-item">
                    <label>Drug Class</label>
                    <span>{{ rx.medication.drugClass }}</span>
                  </div>
                }
                @if (rx.medication.rxcui) {
                  <div class="info-item">
                    <label>RxCUI</label>
                    <span class="code">{{ rx.medication.rxcui }}</span>
                  </div>
                }
                @if (rx.medication.ndc) {
                  <div class="info-item">
                    <label>NDC</label>
                    <span class="code">{{ rx.medication.ndc }}</span>
                  </div>
                }
              </div>
            </section>

            <!-- Dosing Instructions Card -->
            <section class="card">
              <h2>Dosing Instructions</h2>
              <div class="sig-display">
                <div class="sig-label">Sig (Directions)</div>
                <div class="sig-text">{{ rx.medication.sig || rx.dosage?.text || 'See prescriber instructions' }}</div>
              </div>
              <div class="info-grid">
                <div class="info-item">
                  <label>Dose</label>
                  <span>{{ rx.medication.dose }} {{ rx.medication.doseUnit }}</span>
                </div>
                <div class="info-item">
                  <label>Frequency</label>
                  <span>{{ rx.medication.frequency }}</span>
                </div>
                @if (rx.medication.duration) {
                  <div class="info-item">
                    <label>Duration</label>
                    <span>{{ rx.medication.duration }} {{ rx.medication.durationUnit }}</span>
                  </div>
                }
                <div class="info-item">
                  <label>PRN (As Needed)</label>
                  <span>{{ rx.isPRN ? 'Yes' : 'No' }}</span>
                </div>
              </div>
            </section>

            <!-- Dispensing Information Card -->
            <section class="card">
              <h2>Dispensing Information</h2>
              <div class="info-grid">
                <div class="info-item">
                  <label>Quantity</label>
                  <span>{{ rx.quantity }} {{ rx.quantityUnit }}</span>
                </div>
                <div class="info-item">
                  <label>Days Supply</label>
                  <span>{{ rx.daysSupply }} days</span>
                </div>
                <div class="info-item">
                  <label>Refills</label>
                  <span>{{ rx.refillsRemaining ?? rx.dispense?.refillsRemaining ?? 0 }} of {{ rx.refills ?? rx.dispense?.refills ?? 0 }} remaining</span>
                </div>
                <div class="info-item">
                  <label>Dispense As Written</label>
                  <span>{{ rx.dispenseAsWritten ? 'Yes (No substitution)' : 'No (Generic OK)' }}</span>
                </div>
                <div class="info-item">
                  <label>Generic Allowed</label>
                  <span>{{ rx.isGenericAllowed ?? !rx.dispenseAsWritten ? 'Yes' : 'No' }}</span>
                </div>
              </div>
              
              <!-- Refill Progress -->
              @if ((rx.refills ?? 0) > 0) {
                <div class="refill-progress">
                  <label>Refill Status</label>
                  <div class="progress-bar">
                    <div class="progress-fill" 
                         [style.width.%]="(((rx.refills ?? 0) - (rx.refillsRemaining ?? 0)) / (rx.refills ?? 1)) * 100">
                    </div>
                  </div>
                  <span class="progress-text">
                    {{ (rx.refills ?? 0) - (rx.refillsRemaining ?? 0) }} of {{ rx.refills ?? 0 }} refills used
                  </span>
                </div>
              }
            </section>

            <!-- Dates Card -->
            <section class="card">
              <h2>Important Dates</h2>
              <div class="dates-timeline">
                <div class="date-item">
                  <div class="date-icon">📝</div>
                  <div class="date-info">
                    <label>Prescribed</label>
                    <span>{{ (rx.prescribedDate || rx.authoredOn) | date:'mediumDate' }}</span>
                  </div>
                </div>
                @if (rx.startDate || rx.validFrom) {
                  <div class="date-item">
                    <div class="date-icon">▶️</div>
                    <div class="date-info">
                      <label>Start Date</label>
                      <span>{{ (rx.startDate || rx.validFrom) | date:'mediumDate' }}</span>
                    </div>
                  </div>
                }
                @if (rx.lastFilledDate) {
                  <div class="date-item">
                    <div class="date-icon">💊</div>
                    <div class="date-info">
                      <label>Last Filled</label>
                      <span>{{ rx.lastFilledDate | date:'mediumDate' }}</span>
                    </div>
                  </div>
                }
                @if (rx.nextRefillDate && rx.status === 'active') {
                  <div class="date-item" [class.warning]="isRefillDueSoon()">
                    <div class="date-icon">🔄</div>
                    <div class="date-info">
                      <label>Next Refill</label>
                      <span>{{ rx.nextRefillDate | date:'mediumDate' }}</span>
                    </div>
                  </div>
                }
                <div class="date-item" [class.warning]="isExpiringSoon()" [class.expired]="isExpired()">
                  <div class="date-icon">📅</div>
                  <div class="date-info">
                    <label>Expires</label>
                    <span>{{ (rx.expirationDate || rx.validUntil) | date:'mediumDate' }}</span>
                    @if (isExpired()) {
                      <span class="warning-text">Expired</span>
                    } @else if (isExpiringSoon()) {
                      <span class="warning-text">Expiring Soon</span>
                    }
                  </div>
                </div>
                @if (rx.endDate || rx.validUntil) {
                  <div class="date-item">
                    <div class="date-icon">⏹️</div>
                    <div class="date-info">
                      <label>End Date</label>
                      <span>{{ (rx.endDate || rx.validUntil) | date:'mediumDate' }}</span>
                    </div>
                  </div>
                }
                @if (rx.discontinuedAt) {
                  <div class="date-item discontinued">
                    <div class="date-icon">🚫</div>
                    <div class="date-info">
                      <label>Discontinued</label>
                      <span>{{ rx.discontinuedAt | date:'mediumDate' }}</span>
                      @if (rx.discontinuedReason) {
                        <span class="reason">{{ rx.discontinuedReason }}</span>
                      }
                    </div>
                  </div>
                }
              </div>
            </section>

            <!-- Clinical Information -->
            @if (rx.indication || rx.diagnosisCodes?.length) {
              <section class="card">
                <h2>Clinical Information</h2>
                @if (rx.indication) {
                  <div class="indication">
                    <label>Indication</label>
                    <p>{{ rx.indication }}</p>
                  </div>
                }
                @if (rx.diagnosisCodes?.length) {
                  <div class="diagnosis-codes">
                    <label>Diagnosis Codes</label>
                    <div class="code-chips">
                      @for (code of rx.diagnosisCodes; track code) {
                        <span class="code-chip">{{ code }}</span>
                      }
                    </div>
                  </div>
                }
                @if (rx.requiresMonitoring) {
                  <div class="monitoring-alert">
                    <span class="alert-icon">⚠️</span>
                    <span>This medication requires monitoring</span>
                  </div>
                }
              </section>
            }

            <!-- Notes -->
            @if (rx.patientInstructions || rx.pharmacyNotes || rx.internalNotes) {
              <section class="card">
                <h2>Notes</h2>
                @if (rx.patientInstructions) {
                  <div class="note-section">
                    <label>Patient Instructions</label>
                    <p>{{ rx.patientInstructions }}</p>
                  </div>
                }
                @if (rx.pharmacyNotes) {
                  <div class="note-section">
                    <label>Pharmacy Notes</label>
                    <p>{{ rx.pharmacyNotes }}</p>
                  </div>
                }
                @if (rx.internalNotes) {
                  <div class="note-section internal">
                    <label>Internal Notes (Not sent to pharmacy)</label>
                    <p>{{ rx.internalNotes }}</p>
                  </div>
                }
              </section>
            }

            <!-- History -->
            @if (showHistory() && history().length > 0) {
              <section class="card">
                <h2>Prescription History</h2>
                <div class="history-timeline">
                  @for (event of history(); track event.id) {
                    <div class="history-item">
                      <div class="history-icon" [class]="'action-' + event.action">
                        {{ getHistoryIcon(event.action) }}
                      </div>
                      <div class="history-content">
                        <div class="history-header">
                          <span class="action">{{ event.action | titlecase }}</span>
                          <span class="timestamp">{{ event.timestamp | date:'short' }}</span>
                        </div>
                        <p class="details">{{ event.details }}</p>
                        <span class="user">by {{ event?.performedByName || event?.performedBy }}</span>
                      </div>
                    </div>
                  }
                </div>
              </section>
            }
          </div>

          <!-- Right Column - Sidebar -->
          <aside class="sidebar">
            <!-- Patient Card -->
            <section class="card patient-card">
              <h3>Patient</h3>
              <div class="patient-info">
                <div class="avatar">{{ getInitials(rx.patientName || rx.patient.name) }}</div>
                <div class="patient-details">
                  <span class="name">{{ rx.patientName || rx.patient.name }}</span>
                  <span class="mrn">MRN: {{ rx.patientMRN || rx.patient.mrn }}</span>
                  <span class="dob">DOB: {{ (rx.patientDOB || rx.patient.dob) | date:'mediumDate' }}</span>
                </div>
              </div>
              <a [routerLink]="['/patients', rx.patientId || rx.patient.id]" class="btn btn-secondary btn-sm">
                View Patient
              </a>
            </section>

            <!-- Prescriber Card -->
            <section class="card prescriber-card">
              <h3>Prescriber</h3>
              <div class="prescriber-info">
                <div class="avatar provider">{{ getInitials(rx.prescriberName || rx.prescriber.name) }}</div>
                <div class="prescriber-details">
                  <span class="name">{{ rx.prescriberName || rx.prescriber.name }}</span>
                  @if (rx.prescriberNPI || rx.prescriber.npi) {
                    <span class="npi">NPI: {{ rx.prescriberNPI || rx.prescriber.npi }}</span>
                  }
                  @if ((rx.prescriberDEA || rx.prescriber.deaNumber) && rx.isControlledSubstance) {
                    <span class="dea">DEA: {{ rx.prescriberDEA || rx.prescriber.deaNumber }}</span>
                  }
                </div>
              </div>
            </section>

            <!-- Pharmacy Card -->
            @if (rx.pharmacy) {
              <section class="card pharmacy-card">
                <h3>Pharmacy</h3>
                <div class="pharmacy-info">
                  <span class="name">{{ rx.pharmacy.name }}</span>
                  <span class="address">
                    {{ rx.pharmacy.address.street }}<br>
                    {{ rx.pharmacy.address.city }}, {{ rx.pharmacy.address.state }} {{ rx.pharmacy.address.zip }}
                  </span>
                  <span class="phone">📞 {{ rx.pharmacy.phone }}</span>
                  @if (rx.pharmacy.fax) {
                    <span class="fax">📠 {{ rx.pharmacy.fax }}</span>
                  }
                </div>
                <div class="pharmacy-badges">
                  @if (rx.pharmacy.is24Hour) {
                    <span class="badge">24 Hour</span>
                  }
                  @if (rx.pharmacy.acceptsEpcs) {
                    <span class="badge">EPCS</span>
                  }
                  @if (rx.pharmacy.isMailOrder) {
                    <span class="badge">Mail Order</span>
                  }
                </div>
                <button class="btn btn-secondary btn-sm" (click)="changePharmacy()">
                  Change Pharmacy
                </button>
              </section>
            } @else {
              <section class="card pharmacy-card no-pharmacy">
                <h3>Pharmacy</h3>
                <p class="no-pharmacy-text">No pharmacy selected</p>
                <button class="btn btn-primary btn-sm" (click)="selectPharmacy()">
                  Select Pharmacy
                </button>
              </section>
            }

            <!-- Encounter Link -->
            @if (rx.encounterId) {
              <section class="card encounter-card">
                <h3>Related Encounter</h3>
                <a [routerLink]="['/encounters', rx.encounterId]" class="encounter-link">
                  <span class="link-icon">📋</span>
                  <span>View Encounter</span>
                </a>
              </section>
            }

            <!-- Prior Authorization -->
            @if (rx.priorAuthorizationRequired) {
              <section class="card pa-card" [class.approved]="rx.priorAuthorizationNumber">
                <h3>Prior Authorization</h3>
                @if (rx.priorAuthorizationNumber) {
                  <div class="pa-approved">
                    <span class="status">✓ Approved</span>
                    <span class="number">PA#: {{ rx.priorAuthorizationNumber }}</span>
                  </div>
                } @else {
                  <div class="pa-required">
                    <span class="status">⚠️ Required</span>
                    <p>This medication requires prior authorization from the insurance company.</p>
                    <button class="btn btn-primary btn-sm">Submit PA Request</button>
                  </div>
                }
              </section>
            }

            <!-- Quick Actions -->
            <section class="card actions-card">
              <h3>Quick Actions</h3>
              <div class="action-buttons">
                <button class="action-btn" (click)="printPrescription()">
                  <span class="icon">🖨️</span>
                  <span>Print</span>
                </button>
                <button class="action-btn" (click)="faxPrescription()">
                  <span class="icon">📠</span>
                  <span>Fax</span>
                </button>
                <button class="action-btn" (click)="sendToPharmacy()">
                  <span class="icon">📤</span>
                  <span>e-Prescribe</span>
                </button>
                <button class="action-btn" (click)="duplicatePrescription()">
                  <span class="icon">📋</span>
                  <span>Duplicate</span>
                </button>
              </div>
            </section>
          </aside>
        </div>
      }
    </div>
  `,
  styles: [`
    .prescription-detail {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Loading & Error States */
    .loading-container {
      padding: 2rem;
    }

    .skeleton-header {
      height: 60px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .skeleton-content {
      height: 400px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 8px;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .error-container {
      text-align: center;
      padding: 3rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .error-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .error-container h2 {
      margin: 0 0 0.5rem 0;
      color: #1a1a2e;
    }

    .error-container p {
      color: #6b7280;
      margin-bottom: 1.5rem;
    }

    /* Header */
    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      background: white;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .btn-back {
      background: #f3f4f6;
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .btn-back:hover {
      background: #e5e7eb;
    }

    .back-icon {
      font-size: 1.25rem;
    }

    .header-info h1 {
      margin: 0;
      font-size: 1.5rem;
      color: #1a1a2e;
    }

    .subtitle {
      margin: 0.25rem 0 0 0;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .actions-menu {
      position: relative;
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      right: 0;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      min-width: 200px;
      z-index: 100;
      padding: 0.5rem 0;
    }

    .dropdown-menu button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.75rem 1rem;
      border: none;
      background: none;
      cursor: pointer;
      text-align: left;
      font-size: 0.875rem;
      transition: background 0.2s;
    }

    .dropdown-menu button:hover {
      background: #f3f4f6;
    }

    .dropdown-menu button.danger {
      color: #dc2626;
    }

    .dropdown-menu button.danger:hover {
      background: #fef2f2;
    }

    /* Buttons */
    .btn {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      border: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #4f46e5;
      color: white;
    }

    .btn-primary:hover {
      background: #4338ca;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    .btn-icon {
      background: #f3f4f6;
      border: none;
      width: 36px;
      height: 36px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 1.25rem;
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
    }

    /* Status Bar */
    .status-bar {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: white;
      padding: 0.75rem 1.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .status-item {
      display: flex;
      align-items: center;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-active { background: #dcfce7; color: #166534; }
    .status-completed { background: #e0e7ff; color: #3730a3; }
    .status-discontinued { background: #fee2e2; color: #991b1b; }
    .status-on-hold { background: #fef3c7; color: #92400e; }
    .status-cancelled { background: #f3f4f6; color: #6b7280; }
    .status-draft { background: #f3f4f6; color: #6b7280; }

    .transmission-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .tx-pending { background: #fef3c7; color: #92400e; }
    .tx-transmitted { background: #dbeafe; color: #1e40af; }
    .tx-accepted { background: #dcfce7; color: #166534; }
    .tx-rejected { background: #fee2e2; color: #991b1b; }
    .tx-error { background: #fee2e2; color: #991b1b; }
    .tx-printed { background: #f3f4f6; color: #6b7280; }
    .tx-faxed { background: #e0e7ff; color: #3730a3; }
    .tx-called { background: #e0e7ff; color: #3730a3; }

    .controlled-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;
      background: #fef3c7;
      color: #92400e;
    }

    .pa-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;
      background: #fee2e2;
      color: #991b1b;
    }

    .pa-badge.approved {
      background: #dcfce7;
      color: #166534;
    }

    .last-updated {
      margin-left: auto;
      font-size: 0.75rem;
      color: #6b7280;
    }

    /* Content Layout */
    .detail-content {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 1.5rem;
    }

    @media (max-width: 1024px) {
      .detail-content {
        grid-template-columns: 1fr;
      }
    }

    /* Cards */
    .card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin-bottom: 1rem;
    }

    .card h2 {
      margin: 0 0 1rem 0;
      font-size: 1.125rem;
      color: #1a1a2e;
    }

    .card h3 {
      margin: 0 0 1rem 0;
      font-size: 0.875rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Info Grid */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 1rem;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .info-item label {
      font-size: 0.75rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .info-item span {
      font-size: 0.9375rem;
      color: #1a1a2e;
    }

    .info-item .code {
      font-family: monospace;
      background: #f3f4f6;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8125rem;
    }

    /* Sig Display */
    .sig-display {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .sig-label {
      font-size: 0.75rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }

    .sig-text {
      font-size: 1rem;
      color: #1a1a2e;
      font-weight: 500;
    }

    /* Refill Progress */
    .refill-progress {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
    }

    .refill-progress label {
      font-size: 0.75rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: block;
      margin-bottom: 0.5rem;
    }

    .progress-bar {
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 0.25rem;
    }

    .progress-fill {
      height: 100%;
      background: #4f46e5;
      border-radius: 4px;
      transition: width 0.3s;
    }

    .progress-text {
      font-size: 0.75rem;
      color: #6b7280;
    }

    /* Dates Timeline */
    .dates-timeline {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .date-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: 8px;
    }

    .date-icon {
      font-size: 1.25rem;
    }

    .date-info {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .date-info label {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .date-info span {
      font-size: 0.9375rem;
      color: #1a1a2e;
    }

    .date-item.warning {
      background: #fef3c7;
    }

    .date-item.expired {
      background: #fee2e2;
    }

    .date-item.discontinued {
      background: #f3f4f6;
    }

    .warning-text {
      font-size: 0.75rem;
      color: #dc2626;
      font-weight: 500;
    }

    .reason {
      font-size: 0.8125rem;
      color: #6b7280;
      font-style: italic;
    }

    /* Clinical Info */
    .indication {
      margin-bottom: 1rem;
    }

    .indication label, .diagnosis-codes label {
      font-size: 0.75rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: block;
      margin-bottom: 0.5rem;
    }

    .indication p {
      margin: 0;
      color: #1a1a2e;
    }

    .code-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .code-chip {
      background: #e0e7ff;
      color: #3730a3;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8125rem;
      font-family: monospace;
    }

    .monitoring-alert {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
      background: #fef3c7;
      border-radius: 8px;
      margin-top: 1rem;
      font-size: 0.875rem;
      color: #92400e;
    }

    /* Notes */
    .note-section {
      margin-bottom: 1rem;
    }

    .note-section:last-child {
      margin-bottom: 0;
    }

    .note-section label {
      font-size: 0.75rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: block;
      margin-bottom: 0.5rem;
    }

    .note-section p {
      margin: 0;
      color: #1a1a2e;
      white-space: pre-wrap;
    }

    .note-section.internal {
      background: #fef3c7;
      padding: 1rem;
      border-radius: 8px;
    }

    /* History Timeline */
    .history-timeline {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .history-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: 8px;
    }

    .history-icon {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e5e7eb;
      border-radius: 50%;
      font-size: 0.875rem;
    }

    .action-created { background: #dcfce7; }
    .action-modified { background: #dbeafe; }
    .action-transmitted { background: #e0e7ff; }
    .action-filled { background: #dcfce7; }
    .action-refilled { background: #dcfce7; }
    .action-discontinued { background: #fee2e2; }
    .action-renewed { background: #fef3c7; }
    .action-cancelled { background: #f3f4f6; }

    .history-content {
      flex: 1;
    }

    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.25rem;
    }

    .history-header .action {
      font-weight: 500;
      color: #1a1a2e;
    }

    .history-header .timestamp {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .history-content .details {
      margin: 0;
      font-size: 0.875rem;
      color: #4b5563;
    }

    .history-content .user {
      font-size: 0.75rem;
      color: #9ca3af;
    }

    /* Sidebar Cards */
    .sidebar .card {
      margin-bottom: 1rem;
    }

    .patient-card .patient-info,
    .prescriber-card .prescriber-info {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      margin-bottom: 1rem;
    }

    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #4f46e5;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 1rem;
    }

    .avatar.provider {
      background: #10b981;
    }

    .patient-details, .prescriber-details {
      display: flex;
      flex-direction: column;
    }

    .patient-details .name, .prescriber-details .name {
      font-weight: 600;
      color: #1a1a2e;
    }

    .patient-details .mrn, .patient-details .dob,
    .prescriber-details .npi, .prescriber-details .dea {
      font-size: 0.8125rem;
      color: #6b7280;
    }

    /* Pharmacy Card */
    .pharmacy-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      margin-bottom: 0.75rem;
    }

    .pharmacy-info .name {
      font-weight: 600;
      color: #1a1a2e;
    }

    .pharmacy-info .address, .pharmacy-info .phone, .pharmacy-info .fax {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .pharmacy-badges {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .pharmacy-badges .badge {
      background: #e0e7ff;
      color: #3730a3;
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
      font-size: 0.6875rem;
      text-transform: uppercase;
      font-weight: 600;
    }

    .no-pharmacy-text {
      color: #6b7280;
      font-size: 0.875rem;
      margin-bottom: 0.75rem;
    }

    /* Encounter Card */
    .encounter-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: 8px;
      color: #4f46e5;
      text-decoration: none;
      font-weight: 500;
      transition: background 0.2s;
    }

    .encounter-link:hover {
      background: #e0e7ff;
    }

    /* PA Card */
    .pa-card.approved {
      border-left: 4px solid #10b981;
    }

    .pa-approved, .pa-required {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .pa-approved .status {
      color: #10b981;
      font-weight: 600;
    }

    .pa-required .status {
      color: #dc2626;
      font-weight: 600;
    }

    .pa-required p {
      font-size: 0.875rem;
      color: #6b7280;
      margin: 0;
    }

    /* Actions Card */
    .action-buttons {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
    }

    .action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      padding: 0.75rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-btn:hover {
      background: #e0e7ff;
      border-color: #4f46e5;
    }

    .action-btn .icon {
      font-size: 1.25rem;
    }

    .action-btn span:last-child {
      font-size: 0.75rem;
      color: #374151;
    }
  `]
})
export class PrescriptionDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private prescriptionService = inject(PrescriptionService);

  prescription = signal<Prescription | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  showActionsMenu = signal(false);
  showHistory = signal(false);
  history = signal<PrescriptionHistory[]>([]);

  canEdit = computed(() => {
    const rx = this.prescription();
    return rx && ['active', 'draft', 'on-hold'].includes(rx.status);
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPrescription(id);
    } else {
      this.error.set('No prescription ID provided');
      this.loading.set(false);
    }
  }

  loadPrescription(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.prescriptionService.getPrescription(id).subscribe({
      next: (prescription) => {
        this.prescription.set(prescription);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load prescription');
        this.loading.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/prescriptions']);
  }

  toggleActionsMenu(): void {
    this.showActionsMenu.update(v => !v);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'active': 'Active',
      'completed': 'Completed',
      'discontinued': 'Discontinued',
      'on-hold': 'On Hold',
      'cancelled': 'Cancelled',
      'draft': 'Draft',
      'entered-in-error': 'Error'
    };
    return labels[status] || status;
  }

  getTransmissionLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': 'Pending',
      'transmitted': 'Transmitted',
      'accepted': 'Accepted',
      'rejected': 'Rejected',
      'error': 'Error',
      'printed': 'Printed',
      'faxed': 'Faxed',
      'called': 'Called In'
    };
    return labels[status] || status;
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  getHistoryIcon(action: string): string {
    const icons: Record<string, string> = {
      'created': '➕',
      'modified': '✏️',
      'transmitted': '📤',
      'filled': '💊',
      'refilled': '🔄',
      'discontinued': '🚫',
      'renewed': '📋',
      'cancelled': '❌'
    };
    return icons[action] || '📝';
  }

  isExpired(): boolean {
    const rx = this.prescription();
    if (!rx?.expirationDate) return false;
    return new Date(rx.expirationDate) < new Date();
  }

  isExpiringSoon(): boolean {
    const rx = this.prescription();
    if (!rx?.expirationDate) return false;
    const expDate = new Date(rx.expirationDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expDate <= thirtyDaysFromNow && expDate > new Date();
  }

  isRefillDueSoon(): boolean {
    const rx = this.prescription();
    if (!rx?.nextRefillDate) return false;
    const refillDate = new Date(rx.nextRefillDate);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    return refillDate <= sevenDaysFromNow;
  }

  // Actions
  refillPrescription(): void {
    console.log('Refill prescription');
    // Navigate to refill or open modal
  }

  printPrescription(): void {
    console.log('Print prescription');
    window.print();
  }

  faxPrescription(): void {
    console.log('Fax prescription');
  }

  sendToPharmacy(): void {
    console.log('Send to pharmacy');
  }

  viewHistory(): void {
    this.showHistory.update(v => !v);
    if (this.showHistory() && this.history().length === 0) {
      this.loadHistory();
    }
    this.showActionsMenu.set(false);
  }

  loadHistory(): void {
    const rx = this.prescription();
    if (!rx) return;

    this.prescriptionService.getPrescriptionHistory(rx.id).subscribe({
      next: (history) => {
        this.history.set(history);
      }
    });
  }

  putOnHold(): void {
    console.log('Put on hold');
    this.showActionsMenu.set(false);
  }

  discontinuePrescription(): void {
    if (confirm('Are you sure you want to discontinue this prescription?')) {
      const rx = this.prescription();
      if (!rx) return;

      this.prescriptionService.discontinuePrescription(rx.id, 'Provider decision').subscribe({
        next: (updated) => {
          this.prescription.set(updated);
        }
      });
    }
    this.showActionsMenu.set(false);
  }

  reactivate(): void {
    console.log('Reactivate');
    this.showActionsMenu.set(false);
  }

  changePharmacy(): void {
    console.log('Change pharmacy');
  }

  selectPharmacy(): void {
    console.log('Select pharmacy');
  }

  duplicatePrescription(): void {
    const rx = this.prescription();
    if (rx) {
      this.router.navigate(['/prescriptions', 'new'], {
        queryParams: { duplicate: rx.id }
      });
    }
  }
}
