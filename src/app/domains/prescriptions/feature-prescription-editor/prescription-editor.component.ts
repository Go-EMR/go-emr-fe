import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PrescriptionService } from '../data-access/services/prescription.service';
import { 
  Prescription, 
  MedicationSearchResult, 
  DrugSearchResult,
  PharmacyInfo,
  DrugInteraction,
  DrugAllergy,
  PrescriptionAlert,
  FrequencyOption,
  COMMON_FREQUENCIES,
  QUANTITY_UNITS,
  DOSE_UNITS 
} from '../data-access/models/prescription.model';

@Component({
  selector: 'app-prescription-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="prescription-editor">
      <!-- Header -->
      <header class="editor-header">
        <div class="header-left">
          <button class="btn-back" (click)="goBack()">
            <span class="back-icon">←</span>
          </button>
          <h1>{{ isEditMode() ? 'Edit Prescription' : 'New Prescription' }}</h1>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="goBack()">Cancel</button>
          <button class="btn btn-secondary" (click)="saveDraft()" [disabled]="saving()">
            Save Draft
          </button>
          <button class="btn btn-primary" (click)="savePrescription()" [disabled]="!canSave() || saving()">
            {{ saving() ? 'Saving...' : 'Save Prescription' }}
          </button>
        </div>
      </header>

      <!-- Alerts -->
      @if (drugInteractions().length > 0) {
        <div class="alerts-section">
          <div class="alert alert-warning">
            <div class="alert-header">
              <span class="alert-icon">⚠️</span>
              <span class="alert-title">Drug Interactions Detected</span>
            </div>
            @for (interaction of drugInteractions(); track interaction.title) {
              <div class="interaction-item" [class]="'severity-' + interaction.severity">
                <span class="severity-badge">{{ interaction.severity | uppercase }}</span>
                <span class="drugs">{{ interaction.title }}</span>
                <p>{{ interaction.message }}</p>
              </div>
            }
          </div>
        </div>
      }

      @if (drugAllergies().length > 0) {
        <div class="alerts-section">
          <div class="alert alert-danger">
            <div class="alert-header">
              <span class="alert-icon">🚨</span>
              <span class="alert-title">Allergy Alert</span>
            </div>
            @for (allergy of drugAllergies(); track allergy.allergen) {
              <div class="allergy-item">
                <span class="allergen">{{ allergy.allergen }}</span>
                <span class="reaction">{{ allergy.reaction }}</span>
                <span class="severity-badge" [class]="allergy.severity">{{ allergy.severity }}</span>
              </div>
            }
          </div>
        </div>
      }

      <!-- Main Content -->
      <div class="editor-content">
        <!-- Left Column - Form -->
        <div class="form-column">
          <!-- Patient Selection -->
          <section class="card">
            <h2>Patient</h2>
            @if (selectedPatient()) {
              <div class="selected-patient">
                <div class="patient-info">
                  <div class="avatar">{{ getInitials(selectedPatient()!.name) }}</div>
                  <div class="patient-details">
                    <span class="name">{{ selectedPatient()!.name }}</span>
                    <span class="mrn">MRN: {{ selectedPatient()!.mrn }}</span>
                    <span class="dob">DOB: {{ selectedPatient()!.dob }}</span>
                  </div>
                </div>
                <button class="btn btn-sm btn-secondary" (click)="clearPatient()">
                  Change
                </button>
              </div>
            } @else {
              <div class="patient-search">
                <input 
                  type="text" 
                  class="form-control"
                  placeholder="Search patient by name or MRN..."
                  [(ngModel)]="patientSearchQuery"
                  (input)="searchPatients()"
                >
                @if (patientSearchResults().length > 0) {
                  <div class="search-results">
                    @for (patient of patientSearchResults(); track patient.id) {
                      <div class="search-result" (click)="selectPatient(patient)">
                        <div class="avatar small">{{ getInitials(patient.name) }}</div>
                        <div class="result-info">
                          <span class="name">{{ patient.name }}</span>
                          <span class="meta">MRN: {{ patient.mrn }} • DOB: {{ patient.dob }}</span>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </section>

          <!-- Medication Selection -->
          <section class="card">
            <h2>Medication</h2>
            @if (selectedMedication()) {
              <div class="selected-medication">
                <div class="medication-info">
                  <span class="name">{{ selectedMedication()!.name }}</span>
                  <span class="details">
                    {{ selectedMedication()!.strength }}{{ selectedMedication()!.strengthUnit }} 
                    {{ selectedMedication()!.form | titlecase }}
                  </span>
                  @if (selectedMedication()!.isControlled) {
                    <span class="controlled-badge">
                      Schedule {{ selectedMedication()!.schedule }}
                    </span>
                  }
                </div>
                <button class="btn btn-sm btn-secondary" (click)="clearMedication()">
                  Change
                </button>
              </div>
            } @else {
              <div class="medication-search">
                <input 
                  type="text" 
                  class="form-control"
                  placeholder="Search medication by name..."
                  [(ngModel)]="medicationSearchQuery"
                  (input)="searchMedications()"
                >
                @if (medicationSearchResults().length > 0) {
                  <div class="search-results">
                    @for (med of medicationSearchResults(); track med.rxcui) {
                      <div class="search-result" (click)="selectMedication(med)">
                        <div class="result-info">
                          <span class="name">{{ med.name }}</span>
                          <span class="meta">
                            {{ med.strength }}{{ med.strengthUnit }} 
                            {{ med.form | titlecase }} • {{ med.route | titlecase }}
                            @if (med.isControlled) {
                              <span class="controlled-tag">C-{{ med.schedule }}</span>
                            }
                          </span>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </section>

          <!-- Dosing Instructions -->
          @if (selectedMedication()) {
            <section class="card">
              <h2>Dosing Instructions</h2>
              <form [formGroup]="form">
                <!-- Sig Builder -->
                <div class="sig-builder">
                  <div class="sig-preview">
                    <label>Sig (Directions)</label>
                    <div class="sig-text">{{ generatedSig() || 'Complete the fields below to generate sig' }}</div>
                  </div>
                  
                  <div class="form-row">
                    <div class="form-group">
                      <label for="dose">Dose *</label>
                      <input 
                        type="text" 
                        id="dose" 
                        class="form-control"
                        formControlName="dose"
                        placeholder="e.g., 1, 2, 500"
                      >
                    </div>
                    <div class="form-group">
                      <label for="doseUnit">Unit *</label>
                      <select id="doseUnit" class="form-control" formControlName="doseUnit">
                        <option value="">Select unit</option>
                        @for (unit of doseUnits; track unit) {
                          <option [value]="unit">{{ unit }}</option>
                        }
                      </select>
                    </div>
                  </div>

                  <div class="form-group">
                    <label for="frequency">Frequency *</label>
                    <select id="frequency" class="form-control" formControlName="frequency">
                      <option value="">Select frequency</option>
                      @for (freq of frequencies; track freq.code) {
                        <option [value]="freq.display">{{ freq.display }} - {{ freq.description }}</option>
                      }
                    </select>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label for="duration">Duration</label>
                      <input 
                        type="number" 
                        id="duration" 
                        class="form-control"
                        formControlName="duration"
                        placeholder="e.g., 7, 14, 30"
                      >
                    </div>
                    <div class="form-group">
                      <label for="durationUnit">Duration Unit</label>
                      <select id="durationUnit" class="form-control" formControlName="durationUnit">
                        <option value="days">Days</option>
                        <option value="weeks">Weeks</option>
                        <option value="months">Months</option>
                      </select>
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="checkbox-label">
                      <input type="checkbox" formControlName="isPRN">
                      <span>PRN (As Needed)</span>
                    </label>
                  </div>

                  @if (form.get('isPRN')?.value) {
                    <div class="form-group">
                      <label for="prnReason">PRN Reason</label>
                      <input 
                        type="text" 
                        id="prnReason" 
                        class="form-control"
                        formControlName="prnReason"
                        placeholder="e.g., for pain, for anxiety"
                      >
                    </div>
                  }

                  <div class="form-group">
                    <label for="additionalInstructions">Additional Instructions</label>
                    <textarea 
                      id="additionalInstructions" 
                      class="form-control"
                      formControlName="additionalInstructions"
                      rows="2"
                      placeholder="e.g., Take with food, Avoid alcohol"
                    ></textarea>
                  </div>
                </div>
              </form>
            </section>
          }

          <!-- Dispensing Information -->
          @if (selectedMedication()) {
            <section class="card">
              <h2>Dispensing</h2>
              <form [formGroup]="form">
                <div class="form-row">
                  <div class="form-group">
                    <label for="quantity">Quantity *</label>
                    <input 
                      type="number" 
                      id="quantity" 
                      class="form-control"
                      formControlName="quantity"
                      min="1"
                    >
                  </div>
                  <div class="form-group">
                    <label for="quantityUnit">Unit *</label>
                    <select id="quantityUnit" class="form-control" formControlName="quantityUnit">
                      @for (unit of quantityUnits; track unit) {
                        <option [value]="unit">{{ unit }}</option>
                      }
                    </select>
                  </div>
                </div>

                <!-- Quick Quantity Buttons -->
                @if (selectedMedication()?.commonQuantities?.length) {
                  <div class="quick-buttons">
                    <span class="label">Common quantities:</span>
                    @for (qty of selectedMedication()!.commonQuantities; track qty) {
                      <button type="button" class="btn btn-sm btn-outline" (click)="setQuantity(qty)">
                        {{ qty }}
                      </button>
                    }
                  </div>
                }

                <div class="form-row">
                  <div class="form-group">
                    <label for="daysSupply">Days Supply *</label>
                    <input 
                      type="number" 
                      id="daysSupply" 
                      class="form-control"
                      formControlName="daysSupply"
                      min="1"
                    >
                  </div>
                  <div class="form-group">
                    <label for="refills">Refills</label>
                    <input 
                      type="number" 
                      id="refills" 
                      class="form-control"
                      formControlName="refills"
                      min="0"
                      [max]="maxRefills()"
                    >
                    @if (selectedMedication()?.isControlled) {
                      <span class="help-text">Max {{ maxRefills() }} for controlled substances</span>
                    }
                  </div>
                </div>

                <!-- Quick Days Supply Buttons -->
                @if (selectedMedication()?.commonDaysSupply?.length) {
                  <div class="quick-buttons">
                    <span class="label">Common days supply:</span>
                    @for (days of selectedMedication()!.commonDaysSupply; track days) {
                      <button type="button" class="btn btn-sm btn-outline" (click)="setDaysSupply(days)">
                        {{ days }} days
                      </button>
                    }
                  </div>
                }

                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" formControlName="dispenseAsWritten">
                    <span>Dispense As Written (No substitution)</span>
                  </label>
                </div>
              </form>
            </section>
          }

          <!-- Clinical Information -->
          @if (selectedMedication()) {
            <section class="card">
              <h2>Clinical Information</h2>
              <form [formGroup]="form">
                <div class="form-group">
                  <label for="indication">Indication</label>
                  <input 
                    type="text" 
                    id="indication" 
                    class="form-control"
                    formControlName="indication"
                    placeholder="e.g., Hypertension, Type 2 Diabetes"
                  >
                </div>

                <div class="form-group">
                  <label for="diagnosisCodes">Diagnosis Codes (ICD-10)</label>
                  <input 
                    type="text" 
                    id="diagnosisCodes" 
                    class="form-control"
                    formControlName="diagnosisCodes"
                    placeholder="e.g., I10, E11.9"
                  >
                  <span class="help-text">Separate multiple codes with commas</span>
                </div>

                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" formControlName="requiresMonitoring">
                    <span>Requires Monitoring</span>
                  </label>
                </div>

                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" formControlName="isLongTerm">
                    <span>Long-term Medication</span>
                  </label>
                </div>
              </form>
            </section>
          }

          <!-- Notes -->
          @if (selectedMedication()) {
            <section class="card">
              <h2>Notes</h2>
              <form [formGroup]="form">
                <div class="form-group">
                  <label for="patientInstructions">Patient Instructions</label>
                  <textarea 
                    id="patientInstructions" 
                    class="form-control"
                    formControlName="patientInstructions"
                    rows="2"
                    placeholder="Instructions for the patient"
                  ></textarea>
                </div>

                <div class="form-group">
                  <label for="pharmacyNotes">Pharmacy Notes</label>
                  <textarea 
                    id="pharmacyNotes" 
                    class="form-control"
                    formControlName="pharmacyNotes"
                    rows="2"
                    placeholder="Notes for the pharmacy"
                  ></textarea>
                </div>

                <div class="form-group">
                  <label for="internalNotes">Internal Notes</label>
                  <textarea 
                    id="internalNotes" 
                    class="form-control internal"
                    formControlName="internalNotes"
                    rows="2"
                    placeholder="Internal notes (not sent to pharmacy)"
                  ></textarea>
                  <span class="help-text warning">These notes will NOT be sent to the pharmacy</span>
                </div>
              </form>
            </section>
          }
        </div>

        <!-- Right Column - Sidebar -->
        <aside class="sidebar">
          <!-- Pharmacy Selection -->
          <section class="card">
            <h3>Pharmacy</h3>
            @if (selectedPharmacy()) {
              <div class="selected-pharmacy">
                <div class="pharmacy-info">
                  <span class="name">{{ selectedPharmacy()!.name }}</span>
                  <span class="address">
                    {{ selectedPharmacy()!.address.street }}<br>
                    {{ selectedPharmacy()!.address.city }}, {{ selectedPharmacy()!.address.state }}
                  </span>
                  <span class="phone">{{ selectedPharmacy()!.phone }}</span>
                </div>
                <div class="pharmacy-badges">
                  @if (selectedPharmacy()!.acceptsEpcs) {
                    <span class="badge">EPCS</span>
                  }
                  @if (selectedPharmacy()!.is24Hour) {
                    <span class="badge">24hr</span>
                  }
                </div>
                <button class="btn btn-sm btn-secondary" (click)="clearPharmacy()">
                  Change
                </button>
              </div>
            } @else {
              <div class="pharmacy-search">
                <input 
                  type="text" 
                  class="form-control"
                  placeholder="Search pharmacy..."
                  [(ngModel)]="pharmacySearchQuery"
                  (input)="searchPharmacies()"
                >
                @if (pharmacySearchResults().length > 0) {
                  <div class="search-results">
                    @for (pharmacy of pharmacySearchResults(); track pharmacy.id) {
                      <div class="search-result" (click)="selectPharmacy(pharmacy)">
                        <div class="result-info">
                          <span class="name">{{ pharmacy.name }}</span>
                          <span class="meta">
                            {{ pharmacy.address.city }}, {{ pharmacy.address.state }}
                            @if (pharmacy.isPreferred) {
                              <span class="preferred-tag">★ Preferred</span>
                            }
                          </span>
                        </div>
                      </div>
                    }
                  </div>
                }
                @if (recentPharmacies().length > 0 && !pharmacySearchQuery) {
                  <div class="recent-pharmacies">
                    <label>Recent Pharmacies</label>
                    @for (pharmacy of recentPharmacies(); track pharmacy.id) {
                      <div class="recent-item" (click)="selectPharmacy(pharmacy)">
                        <span class="name">{{ pharmacy.name }}</span>
                        <span class="city">{{ pharmacy.address.city }}</span>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </section>

          <!-- Transmission Method -->
          <section class="card">
            <h3>Send Method</h3>
            <div class="transmission-options">
              <label class="radio-card" [class.selected]="transmissionMethod() === 'electronic'">
                <input 
                  type="radio" 
                  name="transmission" 
                  value="electronic"
                  [checked]="transmissionMethod() === 'electronic'"
                  (change)="setTransmissionMethod('electronic')"
                >
                <span class="icon">📤</span>
                <span class="label">e-Prescribe</span>
                <span class="desc">Send electronically</span>
              </label>
              <label class="radio-card" [class.selected]="transmissionMethod() === 'print'">
                <input 
                  type="radio" 
                  name="transmission" 
                  value="print"
                  [checked]="transmissionMethod() === 'print'"
                  (change)="setTransmissionMethod('print')"
                >
                <span class="icon">🖨️</span>
                <span class="label">Print</span>
                <span class="desc">Print for patient</span>
              </label>
              <label class="radio-card" [class.selected]="transmissionMethod() === 'fax'">
                <input 
                  type="radio" 
                  name="transmission" 
                  value="fax"
                  [checked]="transmissionMethod() === 'fax'"
                  (change)="setTransmissionMethod('fax')"
                >
                <span class="icon">📠</span>
                <span class="label">Fax</span>
                <span class="desc">Fax to pharmacy</span>
              </label>
            </div>
            @if (selectedMedication()?.isControlled && transmissionMethod() !== 'electronic') {
              <div class="warning-message">
                <span class="icon">⚠️</span>
                <span>Controlled substances require electronic prescribing (EPCS) in most states.</span>
              </div>
            }
          </section>

          <!-- Prescriber -->
          <section class="card">
            <h3>Prescriber</h3>
            <div class="prescriber-info">
              <div class="avatar">{{ getInitials(currentPrescriber.name) }}</div>
              <div class="prescriber-details">
                <span class="name">{{ currentPrescriber.name }}</span>
                <span class="npi">NPI: {{ currentPrescriber.npi }}</span>
                @if (selectedMedication()?.isControlled) {
                  <span class="dea">DEA: {{ currentPrescriber.dea }}</span>
                }
              </div>
            </div>
          </section>

          <!-- Summary -->
          @if (selectedMedication() && selectedPatient()) {
            <section class="card summary-card">
              <h3>Prescription Summary</h3>
              <div class="summary-content">
                <div class="summary-row">
                  <span class="label">Patient</span>
                  <span class="value">{{ selectedPatient()!.name }}</span>
                </div>
                <div class="summary-row">
                  <span class="label">Medication</span>
                  <span class="value">{{ selectedMedication()!.name }}</span>
                </div>
                <div class="summary-row">
                  <span class="label">Strength</span>
                  <span class="value">{{ selectedMedication()!.strength }}{{ selectedMedication()!.strengthUnit }}</span>
                </div>
                @if (form.get('dose')?.value) {
                  <div class="summary-row">
                    <span class="label">Dose</span>
                    <span class="value">{{ form.get('dose')?.value }} {{ form.get('doseUnit')?.value }}</span>
                  </div>
                }
                @if (form.get('frequency')?.value) {
                  <div class="summary-row">
                    <span class="label">Frequency</span>
                    <span class="value">{{ form.get('frequency')?.value }}</span>
                  </div>
                }
                @if (form.get('quantity')?.value) {
                  <div class="summary-row">
                    <span class="label">Quantity</span>
                    <span class="value">{{ form.get('quantity')?.value }} {{ form.get('quantityUnit')?.value }}</span>
                  </div>
                }
                @if (form.get('refills')?.value) {
                  <div class="summary-row">
                    <span class="label">Refills</span>
                    <span class="value">{{ form.get('refills')?.value }}</span>
                  </div>
                }
                @if (selectedPharmacy()) {
                  <div class="summary-row">
                    <span class="label">Pharmacy</span>
                    <span class="value">{{ selectedPharmacy()!.name }}</span>
                  </div>
                }
              </div>
            </section>
          }
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .prescription-editor {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Header */
    .editor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
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

    .editor-header h1 {
      margin: 0;
      font-size: 1.5rem;
      color: #1a1a2e;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
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

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background: #4f46e5;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #4338ca;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #e5e7eb;
    }

    .btn-outline {
      background: white;
      color: #4f46e5;
      border: 1px solid #4f46e5;
    }

    .btn-outline:hover {
      background: #eef2ff;
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
    }

    /* Alerts */
    .alerts-section {
      margin-bottom: 1rem;
    }

    .alert {
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 0.5rem;
    }

    .alert-warning {
      background: #fef3c7;
      border: 1px solid #fbbf24;
    }

    .alert-danger {
      background: #fee2e2;
      border: 1px solid #f87171;
    }

    .alert-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .alert-title {
      font-weight: 600;
    }

    .interaction-item, .allergy-item {
      padding: 0.5rem;
      background: rgba(255, 255, 255, 0.5);
      border-radius: 4px;
      margin-bottom: 0.25rem;
    }

    .severity-badge {
      font-size: 0.6875rem;
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
      font-weight: 600;
      margin-right: 0.5rem;
    }

    .severity-high, .life-threatening { background: #fee2e2; color: #991b1b; }
    .severity-moderate, .severe { background: #fef3c7; color: #92400e; }
    .severity-low, .moderate, .mild { background: #dcfce7; color: #166534; }

    /* Content Layout */
    .editor-content {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 1.5rem;
    }

    @media (max-width: 1024px) {
      .editor-content {
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

    /* Patient Selection */
    .selected-patient, .selected-medication, .selected-pharmacy {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .patient-info, .prescriber-info {
      display: flex;
      gap: 0.75rem;
      align-items: center;
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

    .avatar.small {
      width: 36px;
      height: 36px;
      font-size: 0.75rem;
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

    /* Search */
    .patient-search, .medication-search, .pharmacy-search {
      position: relative;
    }

    .search-results {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      max-height: 300px;
      overflow-y: auto;
      z-index: 100;
    }

    .search-result {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      cursor: pointer;
      transition: background 0.2s;
    }

    .search-result:hover {
      background: #f3f4f6;
    }

    .result-info {
      display: flex;
      flex-direction: column;
    }

    .result-info .name {
      font-weight: 500;
      color: #1a1a2e;
    }

    .result-info .meta {
      font-size: 0.8125rem;
      color: #6b7280;
    }

    .controlled-tag {
      background: #fef3c7;
      color: #92400e;
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
      font-size: 0.6875rem;
      font-weight: 600;
      margin-left: 0.5rem;
    }

    .preferred-tag {
      color: #f59e0b;
      margin-left: 0.5rem;
    }

    /* Medication Selection */
    .medication-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .medication-info .name {
      font-weight: 600;
      color: #1a1a2e;
    }

    .medication-info .details {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .controlled-badge {
      display: inline-block;
      background: #fef3c7;
      color: #92400e;
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
      margin-top: 0.25rem;
    }

    /* Form Elements */
    .form-control {
      width: 100%;
      padding: 0.625rem 0.875rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.9375rem;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .form-control:focus {
      outline: none;
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }

    .form-control.internal {
      background: #fef3c7;
    }

    textarea.form-control {
      resize: vertical;
      min-height: 60px;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.375rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .help-text {
      font-size: 0.75rem;
      color: #6b7280;
      margin-top: 0.25rem;
      display: block;
    }

    .help-text.warning {
      color: #f59e0b;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-weight: normal !important;
    }

    .checkbox-label input {
      width: 18px;
      height: 18px;
    }

    /* Sig Builder */
    .sig-builder {
      background: #f8fafc;
      padding: 1rem;
      border-radius: 8px;
    }

    .sig-preview {
      background: white;
      padding: 1rem;
      border-radius: 6px;
      margin-bottom: 1rem;
      border: 1px solid #e2e8f0;
    }

    .sig-preview label {
      font-size: 0.75rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }

    .sig-preview .sig-text {
      font-size: 1rem;
      color: #1a1a2e;
      font-weight: 500;
    }

    /* Quick Buttons */
    .quick-buttons {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
      flex-wrap: wrap;
    }

    .quick-buttons .label {
      font-size: 0.75rem;
      color: #6b7280;
    }

    /* Pharmacy Selection */
    .pharmacy-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      margin-bottom: 0.5rem;
    }

    .pharmacy-info .name {
      font-weight: 600;
      color: #1a1a2e;
    }

    .pharmacy-info .address, .pharmacy-info .phone {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .pharmacy-badges {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
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

    .recent-pharmacies {
      margin-top: 1rem;
    }

    .recent-pharmacies label {
      font-size: 0.75rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: block;
      margin-bottom: 0.5rem;
    }

    .recent-item {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem;
      background: #f8fafc;
      border-radius: 4px;
      margin-bottom: 0.25rem;
      cursor: pointer;
      transition: background 0.2s;
    }

    .recent-item:hover {
      background: #e0e7ff;
    }

    .recent-item .name {
      font-weight: 500;
      color: #1a1a2e;
    }

    .recent-item .city {
      font-size: 0.8125rem;
      color: #6b7280;
    }

    /* Transmission Options */
    .transmission-options {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .radio-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .radio-card:hover {
      border-color: #4f46e5;
    }

    .radio-card.selected {
      border-color: #4f46e5;
      background: #eef2ff;
    }

    .radio-card input {
      display: none;
    }

    .radio-card .icon {
      font-size: 1.5rem;
    }

    .radio-card .label {
      font-weight: 500;
      color: #1a1a2e;
    }

    .radio-card .desc {
      font-size: 0.75rem;
      color: #6b7280;
      margin-left: auto;
    }

    .warning-message {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 0.75rem;
      background: #fef3c7;
      border-radius: 6px;
      margin-top: 0.75rem;
      font-size: 0.8125rem;
      color: #92400e;
    }

    /* Summary Card */
    .summary-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
    }

    .summary-content {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .summary-row:last-child {
      border-bottom: none;
    }

    .summary-row .label {
      font-size: 0.8125rem;
      color: #6b7280;
    }

    .summary-row .value {
      font-size: 0.8125rem;
      font-weight: 500;
      color: #1a1a2e;
      text-align: right;
    }
  `]
})
export class PrescriptionEditorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private prescriptionService = inject(PrescriptionService);

  // State
  isEditMode = signal(false);
  saving = signal(false);
  prescriptionId = signal<string | null>(null);

  // Patient
  patientSearchQuery = '';
  patientSearchResults = signal<Array<{id: string; name: string; mrn: string; dob: string}>>([]);
  selectedPatient = signal<{id: string; name: string; mrn: string; dob: string} | null>(null);

  // Medication
  medicationSearchQuery = '';
  medicationSearchResults = signal<DrugSearchResult[]>([]);
  selectedMedication = signal<DrugSearchResult | null>(null);

  // Pharmacy
  pharmacySearchQuery = '';
  pharmacySearchResults = signal<PharmacyInfo[]>([]);
  selectedPharmacy = signal<PharmacyInfo | null>(null);
  recentPharmacies = signal<PharmacyInfo[]>([]);

  // Alerts
  drugInteractions = signal<PrescriptionAlert[]>([]);
  drugAllergies = signal<DrugAllergy[]>([]);

  // Transmission
  transmissionMethod = signal<'electronic' | 'print' | 'fax'>('electronic');

  // Form
  form: FormGroup;

  // Constants
  frequencies = COMMON_FREQUENCIES;
  quantityUnits = QUANTITY_UNITS;
  doseUnits = DOSE_UNITS;

  // Mock prescriber (would come from auth service)
  currentPrescriber = {
    id: 'provider-1',
    name: 'Dr. Sarah Chen',
    npi: '1234567890',
    dea: 'AC1234567'
  };

  // Computed
  generatedSig = computed(() => {
    const dose = this.form?.get('dose')?.value;
    const doseUnit = this.form?.get('doseUnit')?.value;
    const frequency = this.form?.get('frequency')?.value;
    const isPRN = this.form?.get('isPRN')?.value;
    const prnReason = this.form?.get('prnReason')?.value;
    const additional = this.form?.get('additionalInstructions')?.value;
    const med = this.selectedMedication();

    if (!dose || !frequency) return '';

    let sig = `Take ${dose} ${doseUnit || med?.form || ''} ${frequency.toLowerCase()}`;
    if (isPRN && prnReason) {
      sig += ` as needed ${prnReason}`;
    } else if (isPRN) {
      sig += ' as needed';
    }
    if (additional) {
      sig += `. ${additional}`;
    }
    return sig;
  });

  maxRefills = computed(() => {
    const med = this.selectedMedication();
    if (!med?.isControlled) return 11;
    if (med.schedule === 'II') return 0;
    return 5;
  });

  canSave = computed(() => {
    return this.selectedPatient() && 
           this.selectedMedication() && 
           this.form?.valid;
  });

  constructor() {
    this.form = this.fb.group({
      dose: ['', Validators.required],
      doseUnit: [''],
      frequency: ['', Validators.required],
      duration: [''],
      durationUnit: ['days'],
      isPRN: [false],
      prnReason: [''],
      additionalInstructions: [''],
      quantity: [30, [Validators.required, Validators.min(1)]],
      quantityUnit: ['tablets'],
      daysSupply: [30, [Validators.required, Validators.min(1)]],
      refills: [0, [Validators.min(0)]],
      dispenseAsWritten: [false],
      indication: [''],
      diagnosisCodes: [''],
      requiresMonitoring: [false],
      isLongTerm: [false],
      patientInstructions: [''],
      pharmacyNotes: [''],
      internalNotes: ['']
    });

    // Load recent pharmacies
    this.loadRecentPharmacies();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const patientId = this.route.snapshot.queryParamMap.get('patientId');
    const encounterId = this.route.snapshot.queryParamMap.get('encounterId');
    const duplicateId = this.route.snapshot.queryParamMap.get('duplicate');

    if (id) {
      this.isEditMode.set(true);
      this.prescriptionId.set(id);
      this.loadPrescription(id);
    } else if (duplicateId) {
      this.loadPrescriptionForDuplicate(duplicateId);
    } else if (patientId) {
      this.loadPatient(patientId);
    }
  }

  loadPrescription(id: string): void {
    this.prescriptionService.getPrescription(id).subscribe({
      next: (rx) => {
        this.populateFromPrescription(rx);
      },
      error: (err) => {
        console.error('Failed to load prescription:', err);
        this.router.navigate(['/prescriptions']);
      }
    });
  }

  loadPrescriptionForDuplicate(id: string): void {
    this.prescriptionService.getPrescription(id).subscribe({
      next: (rx) => {
        this.populateFromPrescription(rx);
        // Clear the ID so it creates a new prescription
        this.prescriptionId.set(null);
      }
    });
  }

  populateFromPrescription(rx: Prescription): void {
    // Use flat properties if available, otherwise use nested patient object
    this.selectedPatient.set({
      id: rx.patientId || rx.patient.id,
      name: rx.patientName || rx.patient.name,
      mrn: rx.patientMRN || rx.patient.mrn,
      dob: rx.patientDOB || rx.patient.dob
    });

    this.selectedMedication.set({
      medication: rx.medication,
      hasInteractions: false,
      id: rx.medication.id,
      rxcui: rx.medication.rxcui || '',
      name: rx.medication.name,
      genericName: rx.medication.genericName,
      brandName: rx.medication.brandName,
      strength: rx.medication.strength,
      strengthUnit: rx.medication.strengthUnit,
      form: rx.medication.form,
      route: rx.medication.route,
      drugClass: rx.medication.drugClass,
      isGeneric: rx.medication.isGeneric,
      isControlled: rx.isControlledSubstance ?? rx.medication.isControlled,
      schedule: rx.controlledSubstanceSchedule ?? rx.medication.controlledSchedule
    });

    if (rx.pharmacy) {
      this.selectedPharmacy.set(rx.pharmacy);
    }

    // Use flat dispense properties if available, otherwise use nested dispense object
    this.form.patchValue({
      dose: rx.medication.dose ?? rx.dosage?.doseQuantity,
      doseUnit: rx.medication.doseUnit ?? rx.dosage?.doseUnit,
      frequency: rx.medication.frequency ?? rx.dosage?.timing?.code,
      duration: rx.medication.duration ?? rx.dosage?.timing?.duration,
      durationUnit: rx.medication.durationUnit || 'days',
      isPRN: rx.isPRN ?? rx.dosage?.asNeeded,
      additionalInstructions: '',
      quantity: rx.quantity ?? rx.dispense?.quantity,
      quantityUnit: rx.quantityUnit ?? rx.dispense?.unit,
      daysSupply: rx.daysSupply ?? rx.dispense?.daysSupply,
      refills: rx.refills ?? rx.dispense?.refills,
      dispenseAsWritten: rx.dispenseAsWritten ?? rx.dispense?.dispenseAsWritten,
      indication: rx.indication,
      diagnosisCodes: rx.diagnosisCodes?.join(', '),
      requiresMonitoring: rx.requiresMonitoring,
      isLongTerm: rx.isLongTerm,
      patientInstructions: rx.patientInstructions,
      pharmacyNotes: rx.pharmacyNotes,
      internalNotes: rx.internalNotes
    });
  }

  loadPatient(patientId: string): void {
    // Mock patient loading
    this.prescriptionService.searchPatients('').subscribe({
      next: (patients) => {
        const patient = patients.find(p => p.id === patientId);
        if (patient) {
          this.selectedPatient.set(patient);
        }
      }
    });
  }

  loadRecentPharmacies(): void {
    this.prescriptionService.getRecentPharmacies().subscribe({
      next: (pharmacies) => {
        this.recentPharmacies.set(pharmacies);
      }
    });
  }

  // Search functions
  searchPatients(): void {
    if (this.patientSearchQuery.length < 2) {
      this.patientSearchResults.set([]);
      return;
    }

    this.prescriptionService.searchPatients(this.patientSearchQuery).subscribe({
      next: (results) => {
        this.patientSearchResults.set(results);
      }
    });
  }

  searchMedications(): void {
    if (this.medicationSearchQuery.length < 2) {
      this.medicationSearchResults.set([]);
      return;
    }

    this.prescriptionService.searchMedications(this.medicationSearchQuery).subscribe({
      next: (results) => {
        this.medicationSearchResults.set(results);
      }
    });
  }

  searchPharmacies(): void {
    if (this.pharmacySearchQuery.length < 2) {
      this.pharmacySearchResults.set([]);
      return;
    }

    this.prescriptionService.searchPharmacies(this.pharmacySearchQuery).subscribe({
      next: (results) => {
        this.pharmacySearchResults.set(results);
      }
    });
  }

  // Selection functions
  selectPatient(patient: {id: string; name: string; mrn: string; dob: string}): void {
    this.selectedPatient.set(patient);
    this.patientSearchQuery = '';
    this.patientSearchResults.set([]);

    // Check for drug allergies
    this.checkAllergies(patient.id);
  }

  selectMedication(med: DrugSearchResult): void {
    this.selectedMedication.set(med);
    this.medicationSearchQuery = '';
    this.medicationSearchResults.set([]);

    // Set default values
    this.form.patchValue({
      doseUnit: med.form === 'tablet' || med.form === 'capsule' ? med.form + 's' : med.strengthUnit,
      quantityUnit: med.form === 'tablet' || med.form === 'capsule' ? med.form + 's' : 'units'
    });

    // Check for interactions if patient is selected
    const patient = this.selectedPatient();
    const rxcui = med.rxcui;
    if (!patient || !rxcui) return;
    this.checkInteractions(patient.id, rxcui);

  }

  selectPharmacy(pharmacy: PharmacyInfo): void {
    this.selectedPharmacy.set(pharmacy);
    this.pharmacySearchQuery = '';
    this.pharmacySearchResults.set([]);
  }

  // Clear functions
  clearPatient(): void {
    this.selectedPatient.set(null);
    this.drugAllergies.set([]);
    this.drugInteractions.set([]);
  }

  clearMedication(): void {
    this.selectedMedication.set(null);
    this.drugInteractions.set([]);
  }

  clearPharmacy(): void {
    this.selectedPharmacy.set(null);
  }

  // Utility functions
  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  setQuantity(qty: number): void {
    this.form.patchValue({ quantity: qty });
  }

  setDaysSupply(days: number): void {
    this.form.patchValue({ daysSupply: days });
  }

  setTransmissionMethod(method: 'electronic' | 'print' | 'fax'): void {
    this.transmissionMethod.set(method);
  }

  checkAllergies(patientId: string): void {
    this.prescriptionService.getPatientAllergies(patientId).subscribe({
      next: (allergies) => {
        this.drugAllergies.set(allergies);
      }
    });
  }

  checkInteractions(patientId: string, rxcui: string): void {
    this.prescriptionService.checkDrugInteractions(patientId, rxcui).subscribe({
      next: (interactions) => {
        this.drugInteractions.set(interactions);
      }
    });
  }

  // Save functions
  goBack(): void {
    if (this.prescriptionId()) {
      this.router.navigate(['/prescriptions', this.prescriptionId()]);
    } else {
      this.router.navigate(['/prescriptions']);
    }
  }

  saveDraft(): void {
    this.saving.set(true);
    // Implementation would save as draft
    setTimeout(() => {
      this.saving.set(false);
      console.log('Draft saved');
    }, 500);
  }

  savePrescription(): void {
    if (!this.canSave()) return;

    this.saving.set(true);

    const prescriptionData = this.buildPrescriptionData();

    const save$ = this.isEditMode() && this.prescriptionId()
      ? this.prescriptionService.updatePrescription(this.prescriptionId()!, prescriptionData)
      : this.prescriptionService.createPrescription(prescriptionData);

    save$.subscribe({
      next: (rx) => {
        this.saving.set(false);
        this.router.navigate(['/prescriptions', rx.id]);
      },
      error: (err) => {
        this.saving.set(false);
        console.error('Failed to save prescription:', err);
      }
    });
  }

  private buildPrescriptionData(): any {
    const formValue = this.form.value;
    const patient = this.selectedPatient()!;
    const med = this.selectedMedication()!;
    const pharmacy = this.selectedPharmacy();

    return {
      patientId: patient.id,
      patientName: patient.name,
      patientMRN: patient.mrn,
      patientDOB: patient.dob,
      medication: {
        rxcui: med.rxcui,
        ndc: med.ndc,
        name: med.name,
        genericName: med.genericName,
        brandName: med.brandName,
        strength: med.strength,
        strengthUnit: med.strengthUnit,
        form: med.form,
        route: med.route,
        dose: formValue.dose,
        doseUnit: formValue.doseUnit,
        frequency: formValue.frequency,
        frequencyCode: this.frequencies.find((f: FrequencyOption) => f.display === formValue.frequency)?.code,
        duration: formValue.duration,
        durationUnit: formValue.durationUnit,
        drugClass: med.drugClass,
        isGeneric: med.isGeneric,
        sig: this.generatedSig()
      },
      prescriberId: this.currentPrescriber.id,
      prescriberName: this.currentPrescriber.name,
      prescriberNPI: this.currentPrescriber.npi,
      prescriberDEA: this.currentPrescriber.dea,
      pharmacy: pharmacy || undefined,
      quantity: formValue.quantity,
      quantityUnit: formValue.quantityUnit,
      daysSupply: formValue.daysSupply,
      refills: formValue.refills,
      refillsRemaining: formValue.refills,
      dispenseAsWritten: formValue.dispenseAsWritten,
      isGenericAllowed: !formValue.dispenseAsWritten,
      isPRN: formValue.isPRN,
      isLongTerm: formValue.isLongTerm,
      requiresMonitoring: formValue.requiresMonitoring,
      isControlledSubstance: med.isControlled,
      controlledSubstanceSchedule: med.schedule,
      indication: formValue.indication,
      diagnosisCodes: formValue.diagnosisCodes ? formValue.diagnosisCodes.split(',').map((c: string) => c.trim()) : [],
      patientInstructions: formValue.patientInstructions,
      pharmacyNotes: formValue.pharmacyNotes,
      internalNotes: formValue.internalNotes,
      priorAuthorizationRequired: false
    };
  }
}
