import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { BillingService } from '../data-access/services/billing.service';
import {
  Claim,
  ClaimLineItem,
  InsurancePolicy,
  InsuranceType,
  VerificationStatus,
  FeeSchedule,
  ClaimType,
  COMMON_CPT_CODES,
  PLACE_OF_SERVICE_CODES
} from '../data-access/models/billing.model';

interface DiagnosisCode {
  code: string;
  description: string;
  pointer?: number;
  isPrincipal?: boolean;
}

interface PlaceOfServiceOption {
  code: string;
  description: string;
}

interface PatientInfo {
  id: string;
  name: string;
  dob: string;
  gender: string;
  address: string;
  phone: string;
  insurances: InsurancePolicy[];
}

@Component({
  selector: 'app-claim-editor',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="claim-editor">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <button class="btn btn-text" (click)="goBack()">
            <i class="fas fa-arrow-left"></i>
            Back
          </button>
          <h1>{{ isEdit() ? 'Edit Claim' : 'New Claim' }}</h1>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="saveDraft()" [disabled]="saving()">
            <i class="fas fa-save"></i>
            Save Draft
          </button>
          <button class="btn btn-primary" (click)="submitClaim()" [disabled]="!canSubmit() || saving()">
            <i class="fas fa-paper-plane"></i>
            Submit Claim
          </button>
        </div>
      </div>

      <form [formGroup]="claimForm" class="editor-layout">
        <!-- Main Content -->
        <div class="main-content">
          <!-- Patient Selection -->
          <div class="card">
            <div class="card-header">
              <h2>Patient Information</h2>
              @if (selectedPatient()) {
                <button class="btn btn-text btn-sm" (click)="clearPatient()">
                  <i class="fas fa-times"></i>
                  Change Patient
                </button>
              }
            </div>

            @if (!selectedPatient()) {
              <div class="patient-search">
                <div class="search-input-wrapper">
                  <i class="fas fa-search"></i>
                  <input
                    type="text"
                    placeholder="Search patients by name, DOB, or MRN..."
                    [(ngModel)]="patientSearchQuery"
                    [ngModelOptions]="{standalone: true}"
                    (input)="searchPatients()">
                </div>
                @if (patientResults().length > 0) {
                  <div class="search-results">
                    @for (patient of patientResults(); track patient.id) {
                      <div class="patient-result" (click)="selectPatient(patient)">
                        <div class="patient-name">{{ patient.name }}</div>
                        <div class="patient-details">
                          DOB: {{ formatDate(patient.dob) }} | {{ patient.gender }}
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            } @else {
              <div class="selected-patient">
                <div class="patient-card">
                  <div class="patient-avatar">
                    {{ getInitials(selectedPatient()!.name) }}
                  </div>
                  <div class="patient-info">
                    <span class="patient-name">{{ selectedPatient()!.name }}</span>
                    <span class="patient-details">
                      DOB: {{ formatDate(selectedPatient()!.dob) }} | {{ selectedPatient()!.gender }}
                    </span>
                    <span class="patient-address">{{ selectedPatient()!.address }}</span>
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Insurance Selection -->
          @if (selectedPatient()) {
            <div class="card">
              <div class="card-header">
                <h2>Insurance Information</h2>
              </div>

              @if (selectedPatient()!.insurances.length === 0) {
                <div class="empty-insurance">
                  <i class="fas fa-exclamation-triangle"></i>
                  <p>No insurance on file for this patient</p>
                  <button class="btn btn-secondary btn-sm" (click)="addInsurance()">
                    <i class="fas fa-plus"></i>
                    Add Insurance
                  </button>
                </div>
              } @else {
                <div class="insurance-selection">
                  @for (insurance of selectedPatient()!.insurances; track insurance.id) {
                    <label class="insurance-option" [class.selected]="selectedInsurance()?.id === insurance.id">
                      <input 
                        type="radio" 
                        name="insurance"
                        [value]="insurance.id"
                        [checked]="selectedInsurance()?.id === insurance.id"
                        (change)="selectInsurance(insurance)">
                      <div class="insurance-card">
                        <div class="insurance-header">
                          <span class="insurance-type">{{ insurance.type }}</span>
                          <span class="verification-badge" [class]="'status-' + insurance.verificationStatus">
                            {{ insurance.verificationStatus }}
                          </span>
                        </div>
                        <span class="payer-name">{{ insurance.payerName }}</span>
                        <div class="insurance-details">
                          <span>ID: {{ insurance.subscriberId }}</span>
                          <span>Group: {{ insurance.groupNumber || 'N/A' }}</span>
                        </div>
                        @if (insurance.copay !== undefined || insurance.deductible !== undefined) {
                          <div class="benefits-preview">
                            <span>Copay: $ {{ insurance.copay || 0 }}</span>
                            <span>Deductible: $ {{ insurance.deductibleMet || 0 }}/$ {{ insurance.deductible || 0 }}</span>
                          </div>
                        }
                      </div>
                    </label>
                  }
                </div>

                @if (selectedInsurance()?.verificationStatus !== VerificationStatus.Verified) {
                  <div class="verification-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Insurance eligibility has not been verified recently</span>
                    <button class="btn btn-text btn-sm" (click)="verifyEligibility()">
                      Verify Now
                    </button>
                  </div>
                }
              }
            </div>
          }

          <!-- Service Information -->
          <div class="card">
            <div class="card-header">
              <h2>Service Information</h2>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Service Date *</label>
                <input type="date" formControlName="serviceDate">
              </div>
              <div class="form-group">
                <label>Place of Service *</label>
                <select formControlName="placeOfService">
                  @for (pos of placeOfServiceOptions; track pos.code) {
                    <option [value]="pos.code">{{ pos.code }} - {{ pos.description }}</option>
                  }
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Rendering Provider *</label>
                <select formControlName="renderingProviderId">
                  <option value="">Select Provider</option>
                  @for (provider of providers(); track provider.id) {
                    <option [value]="provider.id">{{ provider.name }}, {{ provider.credentials }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label>Authorization Number</label>
                <input type="text" formControlName="authorizationNumber" placeholder="If required">
              </div>
            </div>
          </div>

          <!-- Diagnosis Codes -->
          <div class="card">
            <div class="card-header">
              <h2>Diagnosis Codes (ICD-10)</h2>
            </div>

            <div class="diagnosis-search">
              <div class="search-input-wrapper">
                <i class="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search diagnosis codes..."
                  [(ngModel)]="diagnosisSearchQuery"
                  [ngModelOptions]="{standalone: true}"
                  (input)="searchDiagnoses()">
              </div>
              @if (diagnosisResults().length > 0) {
                <div class="search-results">
                  @for (dx of diagnosisResults(); track dx.code) {
                    <div class="diagnosis-result" (click)="addDiagnosis(dx)">
                      <span class="dx-code">{{ dx.code }}</span>
                      <span class="dx-description">{{ dx.description }}</span>
                    </div>
                  }
                </div>
              }
            </div>

            <div class="diagnosis-list" cdkDropList (cdkDropListDropped)="reorderDiagnoses($event)">
              @for (dx of selectedDiagnoses(); track dx.code; let i = $index) {
                <div class="diagnosis-item" cdkDrag>
                  <div class="drag-handle" cdkDragHandle>
                    <i class="fas fa-grip-vertical"></i>
                  </div>
                  <span class="dx-pointer">{{ dx.pointer ?? (i + 1) }}</span>
                  <span class="dx-code">{{ dx.code }}</span>
                  <span class="dx-description">{{ dx.description }}</span>
                  @if (i === 0) {
                    <span class="principal-badge">Principal</span>
                  }
                  <button class="btn btn-icon btn-sm" (click)="removeDiagnosis(i)">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              }
              @if (selectedDiagnoses().length === 0) {
                <div class="empty-diagnoses">
                  <p>No diagnosis codes added. Search above to add diagnoses.</p>
                </div>
              }
            </div>
          </div>

          <!-- Service Line Items -->
          <div class="card">
            <div class="card-header">
              <h2>Service Line Items</h2>
              <button class="btn btn-secondary btn-sm" (click)="addLineItem()">
                <i class="fas fa-plus"></i>
                Add Line
              </button>
            </div>

            <!-- Quick Add Procedures -->
            <div class="quick-add-section">
              <span class="quick-add-label">Quick Add:</span>
              <div class="quick-add-buttons">
                @for (cpt of commonCptCodes.slice(0, 8); track cpt.code) {
                  <button 
                    class="quick-add-btn" 
                    (click)="addProcedure(cpt)"
                    [title]="cpt.description">
                    {{ cpt.code }}
                  </button>
                }
              </div>
            </div>

            <!-- Line Items Table -->
            <div class="line-items-container">
              @if (lineItems().length === 0) {
                <div class="empty-lines">
                  <i class="fas fa-file-medical-alt"></i>
                  <p>No service lines added</p>
                  <p class="hint">Use quick add buttons above or click "Add Line" to add procedures</p>
                </div>
              } @else {
                <table class="line-items-table">
                  <thead>
                    <tr>
                      <th class="line-num">#</th>
                      <th>CPT/HCPCS</th>
                      <th>Description</th>
                      <th>Modifiers</th>
                      <th>Dx Pointers</th>
                      <th class="amount">Units</th>
                      <th class="amount">Fee</th>
                      <th class="amount">Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (line of lineItems(); track line.lineNumber; let i = $index) {
                      <tr>
                        <td class="line-num">{{ line.lineNumber }}</td>
                        <td>
                          <input 
                            type="text" 
                            class="code-input"
                            [(ngModel)]="line.procedureCode"
                            [ngModelOptions]="{standalone: true}"
                            (blur)="lookupProcedure(line)"
                            placeholder="CPT Code">
                        </td>
                        <td>
                          <input 
                            type="text"
                            class="desc-input"
                            [(ngModel)]="line.description"
                            [ngModelOptions]="{standalone: true}"
                            placeholder="Description">
                        </td>
                        <td>
                          <input 
                            type="text"
                            class="modifier-input"
                            [(ngModel)]="line.modifiersString"
                            [ngModelOptions]="{standalone: true}"
                            placeholder="25,59"
                            (blur)="parseModifiers(line)">
                        </td>
                        <td>
                          <div class="dx-pointer-selector">
                            @for (dx of selectedDiagnoses(); track dx.code) {
                              @if (dx.pointer !== undefined) {
                                <label class="dx-pointer-option">
                                  <input 
                                    type="checkbox"
                                    [checked]="line.diagnosisPointers?.includes(dx.pointer)"
                                    (change)="toggleDiagnosisPointer(line, dx.pointer)">
                                  {{ dx.pointer }}
                                </label>
                              }
                            }
                          </div>
                        </td>
                        <td class="amount">
                          <input 
                            type="number"
                            class="units-input"
                            [(ngModel)]="line.units"
                            [ngModelOptions]="{standalone: true}"
                            (change)="calculateLineTotal(line)"
                            min="1">
                        </td>
                        <td class="amount">
                          <input 
                            type="number"
                            class="fee-input"
                            [(ngModel)]="line.unitCharge"
                            [ngModelOptions]="{standalone: true}"
                            (change)="calculateLineTotal(line)"
                            step="0.01">
                        </td>
                        <td class="amount total">
                          {{ formatCurrency(line.totalCharge || 0) }}
                        </td>
                        <td>
                          <button class="btn btn-icon btn-sm" (click)="removeLineItem(i)">
                            <i class="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="7" class="total-label">Total Charges:</td>
                      <td class="amount total">{{ formatCurrency(totalCharges()) }}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              }
            </div>

            <!-- Procedure Search -->
            <div class="procedure-search">
              <div class="search-input-wrapper">
                <i class="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search procedures (CPT, HCPCS, description)..."
                  [(ngModel)]="procedureSearchQuery"
                  [ngModelOptions]="{standalone: true}"
                  (input)="searchProcedures()">
              </div>
              @if (procedureResults().length > 0) {
                <div class="search-results">
                  @for (proc of procedureResults(); track proc.code) {
                    <div class="procedure-result" (click)="addProcedure(proc)">
                      <span class="proc-code">{{ proc.code }}</span>
                      <span class="proc-description">{{ proc.description }}</span>
                      <span class="proc-fee">{{ formatCurrency(proc.fee) }}</span>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Notes -->
          <div class="card">
            <div class="card-header">
              <h2>Additional Information</h2>
            </div>
            <div class="form-group">
              <label>Claim Notes</label>
              <textarea 
                formControlName="notes"
                rows="3"
                placeholder="Internal notes about this claim..."></textarea>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="sidebar">
          <!-- Claim Summary -->
          <div class="card summary-card">
            <h3>Claim Summary</h3>
            
            <div class="summary-section">
              <div class="summary-row">
                <span class="label">Patient</span>
                <span class="value">{{ selectedPatient()?.name || 'Not selected' }}</span>
              </div>
              <div class="summary-row">
                <span class="label">Insurance</span>
                <span class="value">{{ selectedInsurance()?.payerName || 'Not selected' }}</span>
              </div>
              <div class="summary-row">
                <span class="label">Service Date</span>
                <span class="value">{{ claimForm.get('serviceDate')?.value || '-' }}</span>
              </div>
              <div class="summary-row">
                <span class="label">Provider</span>
                <span class="value">{{ getProviderName() || 'Not selected' }}</span>
              </div>
            </div>

            <div class="summary-divider"></div>

            <div class="summary-section">
              <div class="summary-row">
                <span class="label">Diagnoses</span>
                <span class="value">{{ selectedDiagnoses().length }}</span>
              </div>
              <div class="summary-row">
                <span class="label">Line Items</span>
                <span class="value">{{ lineItems().length }}</span>
              </div>
            </div>

            <div class="summary-divider"></div>

            <div class="summary-section financial">
              <div class="summary-row total">
                <span class="label">Total Charges</span>
                <span class="value">{{ formatCurrency(totalCharges()) }}</span>
              </div>
              @if (selectedInsurance()?.copay) {
                <div class="summary-row">
                  <span class="label">Est. Copay</span>
                  <span class="value">{{ formatCurrency(selectedInsurance()!.copay!) }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Validation -->
          <div class="card validation-card">
            <h3>Validation</h3>
            <div class="validation-list">
              <div class="validation-item" [class.valid]="selectedPatient()">
                <i [class]="selectedPatient() ? 'fas fa-check-circle' : 'fas fa-circle'"></i>
                <span>Patient selected</span>
              </div>
              <div class="validation-item" [class.valid]="selectedInsurance()">
                <i [class]="selectedInsurance() ? 'fas fa-check-circle' : 'fas fa-circle'"></i>
                <span>Insurance selected</span>
              </div>
              <div class="validation-item" [class.valid]="claimForm.get('serviceDate')?.valid">
                <i [class]="claimForm.get('serviceDate')?.valid ? 'fas fa-check-circle' : 'fas fa-circle'"></i>
                <span>Service date entered</span>
              </div>
              <div class="validation-item" [class.valid]="claimForm.get('renderingProviderId')?.valid">
                <i [class]="claimForm.get('renderingProviderId')?.valid ? 'fas fa-check-circle' : 'fas fa-circle'"></i>
                <span>Provider selected</span>
              </div>
              <div class="validation-item" [class.valid]="selectedDiagnoses().length > 0">
                <i [class]="selectedDiagnoses().length > 0 ? 'fas fa-check-circle' : 'fas fa-circle'"></i>
                <span>At least one diagnosis</span>
              </div>
              <div class="validation-item" [class.valid]="lineItems().length > 0">
                <i [class]="lineItems().length > 0 ? 'fas fa-check-circle' : 'fas fa-circle'"></i>
                <span>At least one service line</span>
              </div>
              <div class="validation-item" [class.valid]="allLinesHaveDiagnosis()">
                <i [class]="allLinesHaveDiagnosis() ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
                <span>All lines linked to diagnosis</span>
              </div>
            </div>
          </div>

          <!-- Fee Schedule -->
          <div class="card">
            <h3>Fee Schedule</h3>
            <select [(ngModel)]="selectedFeeScheduleId" [ngModelOptions]="{standalone: true}" (change)="loadFeeSchedule()">
              @for (schedule of feeSchedules(); track schedule.id) {
                <option [value]="schedule.id">{{ schedule.name }}</option>
              }
            </select>
            <p class="fee-schedule-hint">
              Fees will auto-populate when procedures are added
            </p>
          </div>

          <!-- From Encounter -->
          @if (sourceEncounter()) {
            <div class="card encounter-card">
              <h3>Source Encounter</h3>
              <div class="encounter-info">
                <span class="encounter-date">{{ formatDate(sourceEncounter()!.date) }}</span>
                <span class="encounter-type">{{ sourceEncounter()!.type }}</span>
                <span class="encounter-provider">{{ sourceEncounter()!.provider }}</span>
              </div>
              <button class="btn btn-text btn-sm" (click)="viewEncounter()">
                <i class="fas fa-external-link-alt"></i>
                View Encounter
              </button>
            </div>
          }
        </div>
      </form>
    </div>
  `,
  styles: [`
    .claim-editor {
      padding: 1.5rem;
      max-width: 1600px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-left h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      border-radius: 0.5rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
      border: none;
      font-size: 0.875rem;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-secondary {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #e2e8f0;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #e2e8f0;
    }

    .btn-text {
      background: none;
      border: none;
      color: #3b82f6;
      padding: 0.375rem;
    }

    .btn-text:hover {
      color: #2563eb;
    }

    .btn-icon {
      padding: 0.375rem;
      background: none;
      border: none;
      color: #64748b;
    }

    .btn-icon:hover {
      color: #ef4444;
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    /* Layout */
    .editor-layout {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 1.5rem;
    }

    @media (max-width: 1024px) {
      .editor-layout {
        grid-template-columns: 1fr;
      }
    }

    /* Cards */
    .card {
      background: white;
      border-radius: 0.75rem;
      border: 1px solid #e2e8f0;
      padding: 1.25rem;
      margin-bottom: 1rem;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .card-header h2 {
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    /* Patient Search */
    .search-input-wrapper {
      position: relative;
    }

    .search-input-wrapper i {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
    }

    .search-input-wrapper input {
      width: 100%;
      padding: 0.75rem 0.75rem 0.75rem 2.5rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.875rem;
    }

    .search-input-wrapper input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .search-results {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      max-height: 300px;
      overflow-y: auto;
      z-index: 10;
    }

    .patient-search, .diagnosis-search, .procedure-search {
      position: relative;
      margin-bottom: 1rem;
    }

    .patient-result, .diagnosis-result, .procedure-result {
      padding: 0.75rem;
      cursor: pointer;
      border-bottom: 1px solid #f1f5f9;
    }

    .patient-result:hover, .diagnosis-result:hover, .procedure-result:hover {
      background: #f8fafc;
    }

    .patient-result:last-child, .diagnosis-result:last-child, .procedure-result:last-child {
      border-bottom: none;
    }

    .patient-name {
      font-weight: 600;
      color: #1e293b;
    }

    .patient-details {
      font-size: 0.75rem;
      color: #64748b;
    }

    /* Selected Patient */
    .selected-patient {
      padding: 0.5rem;
    }

    .patient-card {
      display: flex;
      gap: 1rem;
      align-items: center;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 0.5rem;
    }

    .patient-avatar {
      width: 3rem;
      height: 3rem;
      border-radius: 9999px;
      background: #3b82f6;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
    }

    .patient-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .patient-info .patient-name {
      font-size: 1rem;
    }

    .patient-info .patient-details,
    .patient-info .patient-address {
      font-size: 0.75rem;
      color: #64748b;
    }

    /* Insurance Selection */
    .empty-insurance {
      text-align: center;
      padding: 2rem;
      color: #64748b;
    }

    .empty-insurance i {
      font-size: 2rem;
      color: #fbbf24;
      margin-bottom: 0.5rem;
    }

    .insurance-selection {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .insurance-option {
      cursor: pointer;
    }

    .insurance-option input {
      display: none;
    }

    .insurance-card {
      padding: 1rem;
      border: 2px solid #e2e8f0;
      border-radius: 0.5rem;
      transition: all 0.15s;
    }

    .insurance-option:hover .insurance-card {
      border-color: #94a3b8;
    }

    .insurance-option.selected .insurance-card {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .insurance-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .insurance-type {
      font-size: 0.625rem;
      padding: 0.125rem 0.375rem;
      background: #e2e8f0;
      border-radius: 0.25rem;
      text-transform: uppercase;
      font-weight: 600;
      color: #475569;
    }

    .verification-badge {
      font-size: 0.625rem;
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      text-transform: uppercase;
      font-weight: 600;
    }

    .verification-badge.status-verified { background: #d1fae5; color: #065f46; }
    .verification-badge.status-not-verified { background: #fef3c7; color: #92400e; }
    .verification-badge.status-expired { background: #fee2e2; color: #991b1b; }

    .payer-name {
      display: block;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }

    .insurance-details {
      display: flex;
      gap: 1rem;
      font-size: 0.75rem;
      color: #64748b;
    }

    .benefits-preview {
      display: flex;
      gap: 1rem;
      font-size: 0.75rem;
      color: #475569;
      margin-top: 0.5rem;
      padding-top: 0.5rem;
      border-top: 1px solid #e2e8f0;
    }

    .verification-warning {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
      background: #fef3c7;
      border-radius: 0.375rem;
      margin-top: 0.75rem;
      font-size: 0.75rem;
      color: #92400e;
    }

    .verification-warning i {
      color: #f59e0b;
    }

    /* Form Elements */
    .form-row {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1rem;
    }

    @media (max-width: 640px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .form-group label {
      font-size: 0.75rem;
      font-weight: 500;
      color: #475569;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      padding: 0.625rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
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

    /* Diagnosis Codes */
    .diagnosis-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .diagnosis-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem;
      background: #f8fafc;
      border-radius: 0.375rem;
      border: 1px solid #e2e8f0;
    }

    .drag-handle {
      cursor: grab;
      color: #94a3b8;
    }

    .dx-pointer {
      width: 1.5rem;
      height: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #3b82f6;
      color: white;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .dx-code {
      font-family: monospace;
      font-weight: 600;
      color: #1e293b;
    }

    .dx-description {
      flex: 1;
      color: #475569;
      font-size: 0.875rem;
    }

    .principal-badge {
      font-size: 0.625rem;
      padding: 0.125rem 0.375rem;
      background: #3b82f6;
      color: white;
      border-radius: 0.25rem;
      text-transform: uppercase;
      font-weight: 600;
    }

    .empty-diagnoses {
      text-align: center;
      padding: 1.5rem;
      color: #64748b;
    }

    .diagnosis-result {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .diagnosis-result .dx-code {
      min-width: 5rem;
    }

    /* Quick Add */
    .quick-add-section {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .quick-add-label {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 500;
    }

    .quick-add-buttons {
      display: flex;
      gap: 0.375rem;
      flex-wrap: wrap;
    }

    .quick-add-btn {
      padding: 0.375rem 0.625rem;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-family: monospace;
      cursor: pointer;
      transition: all 0.15s;
    }

    .quick-add-btn:hover {
      background: #e2e8f0;
      border-color: #3b82f6;
    }

    /* Line Items */
    .line-items-container {
      margin-bottom: 1rem;
    }

    .empty-lines {
      text-align: center;
      padding: 2rem;
      color: #64748b;
    }

    .empty-lines i {
      font-size: 2.5rem;
      margin-bottom: 0.75rem;
      color: #cbd5e1;
    }

    .empty-lines .hint {
      font-size: 0.75rem;
    }

    .line-items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .line-items-table th {
      text-align: left;
      padding: 0.5rem;
      background: #f8fafc;
      border-bottom: 2px solid #e2e8f0;
      font-weight: 600;
      color: #475569;
      font-size: 0.75rem;
    }

    .line-items-table td {
      padding: 0.5rem;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }

    .line-items-table .line-num {
      width: 2rem;
      text-align: center;
    }

    .code-input {
      width: 5rem;
      padding: 0.375rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.25rem;
      font-family: monospace;
    }

    .desc-input {
      width: 100%;
      min-width: 150px;
      padding: 0.375rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.25rem;
    }

    .modifier-input {
      width: 4rem;
      padding: 0.375rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.25rem;
      font-family: monospace;
      font-size: 0.75rem;
    }

    .dx-pointer-selector {
      display: flex;
      gap: 0.5rem;
    }

    .dx-pointer-option {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      cursor: pointer;
    }

    .dx-pointer-option input {
      width: 0.875rem;
      height: 0.875rem;
    }

    .units-input, .fee-input {
      width: 4rem;
      padding: 0.375rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.25rem;
      text-align: right;
    }

    .amount {
      text-align: right;
    }

    .amount.total {
      font-weight: 600;
    }

    .total-label {
      text-align: right;
      font-weight: 600;
    }

    .procedure-result {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .proc-code {
      font-family: monospace;
      font-weight: 600;
      min-width: 4rem;
    }

    .proc-description {
      flex: 1;
      color: #475569;
    }

    .proc-fee {
      font-family: monospace;
      color: #059669;
    }

    /* Sidebar */
    .sidebar .card {
      padding: 1rem;
    }

    .sidebar h3 {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 0.75rem 0;
    }

    .summary-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
    }

    .summary-row .label {
      color: #64748b;
    }

    .summary-row .value {
      font-weight: 500;
      color: #1e293b;
      text-align: right;
    }

    .summary-row.total {
      font-size: 1rem;
    }

    .summary-row.total .value {
      font-weight: 600;
      color: #059669;
    }

    .summary-divider {
      height: 1px;
      background: #e2e8f0;
      margin: 0.75rem 0;
    }

    /* Validation */
    .validation-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .validation-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #64748b;
    }

    .validation-item i {
      font-size: 0.75rem;
      color: #cbd5e1;
    }

    .validation-item.valid {
      color: #1e293b;
    }

    .validation-item.valid i {
      color: #10b981;
    }

    .validation-item i.fa-exclamation-circle {
      color: #f59e0b;
    }

    /* Fee Schedule */
    .sidebar select {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
      font-size: 0.875rem;
    }

    .fee-schedule-hint {
      font-size: 0.75rem;
      color: #64748b;
      margin-top: 0.5rem;
    }

    /* Encounter Card */
    .encounter-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      margin-bottom: 0.75rem;
    }

    .encounter-date {
      font-weight: 600;
    }

    .encounter-type,
    .encounter-provider {
      font-size: 0.75rem;
      color: #64748b;
    }
  `]
})
export class ClaimEditorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private billingService = inject(BillingService);

  // Enums for template access
  readonly VerificationStatus = VerificationStatus;
  readonly InsuranceType = InsuranceType;

  // Form
  claimForm: FormGroup;
  
  // State
  isEdit = signal(false);
  saving = signal(false);
  claimId = signal<string | null>(null);

  // Patient
  patientSearchQuery = '';
  patientResults = signal<PatientInfo[]>([]);
  selectedPatient = signal<PatientInfo | null>(null);
  selectedInsurance = signal<InsurancePolicy | null>(null);

  // Diagnosis
  diagnosisSearchQuery = '';
  diagnosisResults = signal<DiagnosisCode[]>([]);
  selectedDiagnoses = signal<DiagnosisCode[]>([]);

  // Procedures
  procedureSearchQuery = '';
  procedureResults = signal<Array<{code: string; description: string; fee: number}>>([]);
  lineItems = signal<Array<ClaimLineItem & { modifiersString?: string }>>([]);

  // Reference Data
  providers = signal<Array<{id: string; name: string; credentials: string; npi: string}>>([]);
  feeSchedules = signal<FeeSchedule[]>([]);
  selectedFeeScheduleId = '';
  placeOfServiceOptions: PlaceOfServiceOption[] = Object.entries(PLACE_OF_SERVICE_CODES).map(
    ([code, description]) => ({ code, description })
  );
  commonCptCodes = COMMON_CPT_CODES;

  // Source
  sourceEncounter = signal<{id: string; date: string; type: string; provider: string} | null>(null);

  constructor() {
    this.claimForm = this.fb.group({
      serviceDate: ['', Validators.required],
      placeOfService: ['11', Validators.required],
      renderingProviderId: ['', Validators.required],
      authorizationNumber: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit.set(true);
      this.claimId.set(id);
      this.loadClaim(id);
    }

    // Check for encounter parameter
    const encounterId = this.route.snapshot.queryParamMap.get('encounterId');
    if (encounterId) {
      this.loadFromEncounter(encounterId);
    }

    this.loadProviders();
    this.loadFeeSchedules();
  }

  loadClaim(id: string): void {
    this.billingService.getClaimById(id).subscribe(claim => {
      // Populate form with existing claim data
      this.claimForm.patchValue({
        serviceDate: claim.serviceDate,
        placeOfService: claim.placeOfService,
        renderingProviderId: claim.renderingProvider?.id,
        authorizationNumber: claim.authorizationNumber,
        notes: claim.notes
      });

      // Load patient
      this.loadPatientById(claim.patientId);
      
      // Set diagnoses - ensure pointers are assigned
      this.selectedDiagnoses.set(
        claim.diagnosisCodes.map((dx, index) => ({
          ...dx,
          pointer: dx.pointer ?? (index + 1)
        }))
      );
      
      // Set line items
      this.lineItems.set(claim.lineItems.map(li => ({
        ...li,
        modifiersString: li.modifiers?.join(',') || ''
      })));
    });
  }

  loadFromEncounter(encounterId: string): void {
    // Would load encounter data and pre-populate claim
    console.log('Loading from encounter:', encounterId);
    this.sourceEncounter.set({
      id: encounterId,
      date: new Date().toISOString(),
      type: 'Office Visit',
      provider: 'Dr. Smith'
    });
  }

  loadProviders(): void {
    // Mock providers
    this.providers.set([
      { id: 'prov-1', name: 'Dr. Sarah Smith', credentials: 'MD', npi: '1234567890' },
      { id: 'prov-2', name: 'Dr. Michael Chen', credentials: 'DO', npi: '0987654321' },
      { id: 'prov-3', name: 'Dr. Emily Johnson', credentials: 'MD, PhD', npi: '1122334455' }
    ]);
  }

  loadFeeSchedules(): void {
    this.billingService.getFeeSchedules().subscribe(schedules => {
      this.feeSchedules.set(schedules);
      if (schedules.length > 0) {
        this.selectedFeeScheduleId = schedules[0].id ?? schedules[0].scheduleId ?? '';
      }
    });
  }

  loadFeeSchedule(): void {
    // Would update fees when schedule changes
    console.log('Loading fee schedule:', this.selectedFeeScheduleId);
  }

  loadPatientById(patientId: string): void {
    // Would load patient from service
    console.log('Loading patient:', patientId);
  }

  // Patient Search
  searchPatients(): void {
    if (this.patientSearchQuery.length < 2) {
      this.patientResults.set([]);
      return;
    }

    // Mock patient search
    const mockPatients: PatientInfo[] = [
      {
        id: 'pat-1',
        name: 'John Smith',
        dob: '1965-03-15',
        gender: 'Male',
        address: '123 Main St, Anytown, ST 12345',
        phone: '(555) 123-4567',
        insurances: [
          {
            policyId: 'ins-1',
            id: 'ins-1',
            patientId: 'pat-1',
            type: InsuranceType.Primary,
            payerId: 'BCBS',
            payerName: 'Blue Cross Blue Shield',
            subscriberId: 'XYZ123456',
            groupNumber: 'GRP001',
            effectiveDate: new Date('2023-01-01'),
            subscriberName: 'John Smith',
            subscriberDob: new Date('1965-03-15'),
            subscriberRelationship: 'self',
            verificationStatus: VerificationStatus.Verified,
            copay: 30,
            coinsurance: 20,
            deductible: 1500,
            deductibleMet: 750,
            isActive: true,
            isPrimary: true,
            createdAt: new Date('2023-01-01'),
            updatedAt: new Date('2023-01-01')
          }
        ]
      },
      {
        id: 'pat-2',
        name: 'Sarah Johnson',
        dob: '1978-07-22',
        gender: 'Female',
        address: '456 Oak Ave, Somewhere, ST 67890',
        phone: '(555) 987-6543',
        insurances: [
          {
            policyId: 'ins-2',
            id: 'ins-2',
            patientId: 'pat-2',
            type: InsuranceType.Primary,
            payerId: 'AETNA',
            payerName: 'Aetna',
            subscriberId: 'AET789012',
            groupNumber: 'GRP002',
            effectiveDate: new Date('2023-01-01'),
            subscriberName: 'Sarah Johnson',
            subscriberDob: new Date('1978-07-22'),
            subscriberRelationship: 'self',
            verificationStatus: VerificationStatus.NotVerified,
            copay: 25,
            coinsurance: 10,
            deductible: 500,
            deductibleMet: 500,
            isActive: true,
            isPrimary: true,
            createdAt: new Date('2023-01-01'),
            updatedAt: new Date('2023-01-01')
          }
        ]
      }
    ];

    const query = this.patientSearchQuery.toLowerCase();
    this.patientResults.set(
      mockPatients.filter(p => p.name.toLowerCase().includes(query))
    );
  }

  selectPatient(patient: PatientInfo): void {
    this.selectedPatient.set(patient);
    this.patientResults.set([]);
    this.patientSearchQuery = '';
    
    // Auto-select primary insurance
    const primary = patient.insurances.find(i => i.type === InsuranceType.Primary || i.isPrimary);
    if (primary) {
      this.selectedInsurance.set(primary);
    }
  }

  clearPatient(): void {
    this.selectedPatient.set(null);
    this.selectedInsurance.set(null);
  }

  selectInsurance(insurance: InsurancePolicy): void {
    this.selectedInsurance.set(insurance);
  }

  addInsurance(): void {
    // Would open insurance add dialog
    console.log('Add insurance');
  }

  verifyEligibility(): void {
    // Would trigger eligibility verification
    console.log('Verify eligibility');
  }

  // Diagnosis Search
  searchDiagnoses(): void {
    if (this.diagnosisSearchQuery.length < 2) {
      this.diagnosisResults.set([]);
      return;
    }

    // Mock diagnosis search - pointers will be assigned when added
    const mockDiagnoses: DiagnosisCode[] = [
      { code: 'J06.9', description: 'Acute upper respiratory infection, unspecified', pointer: 1 },
      { code: 'J18.9', description: 'Pneumonia, unspecified organism', pointer: 2 },
      { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', pointer: 3 },
      { code: 'I10', description: 'Essential (primary) hypertension', pointer: 4 },
      { code: 'M54.5', description: 'Low back pain', pointer: 5 },
      { code: 'R10.9', description: 'Unspecified abdominal pain', pointer: 6 }
    ];

    const query = this.diagnosisSearchQuery.toLowerCase();
    this.diagnosisResults.set(
      mockDiagnoses.filter(dx => 
        dx.code.toLowerCase().includes(query) || 
        dx.description.toLowerCase().includes(query)
      )
    );
  }

  addDiagnosis(dx: DiagnosisCode): void {
    const current = this.selectedDiagnoses();
    if (current.some(d => d.code === dx.code)) return;
    
    // Assign next available pointer (1-based)
    const newPointer = current.length + 1;
    
    this.selectedDiagnoses.set([...current, { ...dx, pointer: newPointer }]);
    this.diagnosisResults.set([]);
    this.diagnosisSearchQuery = '';
  }

  removeDiagnosis(index: number): void {
    const current = [...this.selectedDiagnoses()];
    current.splice(index, 1);
    
    // Reassign pointers (1-based)
    current.forEach((dx, i) => dx.pointer = i + 1);
    
    this.selectedDiagnoses.set(current);
  }

  reorderDiagnoses(event: any): void {
    // Would handle drag-drop reorder
    console.log('Reorder diagnoses', event);
  }

  // Procedure Search
  searchProcedures(): void {
    if (this.procedureSearchQuery.length < 2) {
      this.procedureResults.set([]);
      return;
    }

    const query = this.procedureSearchQuery.toLowerCase();
    const results = COMMON_CPT_CODES.filter(cpt =>
      cpt.code.toLowerCase().includes(query) ||
      cpt.description.toLowerCase().includes(query)
    );

    this.procedureResults.set(results);
  }

  addProcedure(proc: {code: string; description: string; fee: number}): void {
    const current = this.lineItems();
    const newLine: ClaimLineItem & { modifiersString?: string } = {
      lineItemId: `line-${Date.now()}-${current.length + 1}`,
      lineNumber: current.length + 1,
      procedureCode: proc.code,
      procedureDescription: proc.description,
      description: proc.description,
      modifiers: [],
      modifiersString: '',
      diagnosisPointers: this.selectedDiagnoses()
        .slice(0, 1)
        .map(d => d.pointer)
        .filter((p): p is number => p !== undefined),
      units: 1,
      unitCharge: proc.fee,
      totalCharge: proc.fee,
      serviceDate: new Date(this.claimForm.get('serviceDate')?.value || new Date()),
      placeOfService: this.claimForm.get('placeOfService')?.value || '11',
      status: 'pending'
    };

    this.lineItems.set([...current, newLine]);
    this.procedureResults.set([]);
    this.procedureSearchQuery = '';
  }

  addLineItem(): void {
    const current = this.lineItems();
    const newLine: ClaimLineItem & { modifiersString?: string } = {
      lineItemId: `line-${Date.now()}-${current.length + 1}`,
      lineNumber: current.length + 1,
      procedureCode: '',
      procedureDescription: '',
      description: '',
      modifiers: [],
      modifiersString: '',
      diagnosisPointers: [],
      units: 1,
      unitCharge: 0,
      totalCharge: 0,
      serviceDate: new Date(this.claimForm.get('serviceDate')?.value || new Date()),
      placeOfService: this.claimForm.get('placeOfService')?.value || '11',
      status: 'pending'
    };

    this.lineItems.set([...current, newLine]);
  }

  removeLineItem(index: number): void {
    const current = [...this.lineItems()];
    current.splice(index, 1);
    // Renumber lines
    current.forEach((line, i) => line.lineNumber = i + 1);
    this.lineItems.set(current);
  }

  lookupProcedure(line: ClaimLineItem & { modifiersString?: string }): void {
    if (!line.procedureCode) return;
    
    const found = COMMON_CPT_CODES.find(cpt => cpt.code === line.procedureCode);
    if (found) {
      line.description = found.description;
      line.unitCharge = found.fee;
      this.calculateLineTotal(line);
    }
  }

  parseModifiers(line: ClaimLineItem & { modifiersString?: string }): void {
    if (line.modifiersString) {
      line.modifiers = line.modifiersString.split(',').map(m => m.trim()).filter(m => m);
    } else {
      line.modifiers = [];
    }
  }

  toggleDiagnosisPointer(line: ClaimLineItem, pointer: number): void {
    if (!line.diagnosisPointers) {
      line.diagnosisPointers = [];
    }
    
    const index = line.diagnosisPointers.indexOf(pointer);
    if (index >= 0) {
      line.diagnosisPointers.splice(index, 1);
    } else {
      line.diagnosisPointers.push(pointer);
      line.diagnosisPointers.sort((a, b) => a - b);
    }
  }

  calculateLineTotal(line: ClaimLineItem): void {
    line.totalCharge = (line.units || 0) * (line.unitCharge || 0);
  }

  totalCharges = computed(() => {
    return this.lineItems().reduce((sum, line) => sum + (line.totalCharge || 0), 0);
  });

  // Validation
  canSubmit = computed(() => {
    return this.selectedPatient() &&
           this.selectedInsurance() &&
           this.claimForm.valid &&
           this.selectedDiagnoses().length > 0 &&
           this.lineItems().length > 0 &&
           this.allLinesHaveDiagnosis();
  });

  allLinesHaveDiagnosis(): boolean {
    return this.lineItems().every(line => line.diagnosisPointers && line.diagnosisPointers.length > 0);
  }

  getProviderName(): string {
    const providerId = this.claimForm.get('renderingProviderId')?.value;
    const provider = this.providers().find(p => p.id === providerId);
    return provider?.name || '';
  }

  // Actions
  saveDraft(): void {
    this.saving.set(true);
    const claimData = this.buildClaimData();
    
    const save$ = this.isEdit() 
      ? this.billingService.updateClaim(this.claimId()!, claimData)
      : this.billingService.createClaim(claimData);

    save$.subscribe({
      next: (claim) => {
        this.saving.set(false);
        const claimId = claim.claimId || claim.id;
        if (claimId) {
          this.router.navigate(['/billing/claims', claimId]);
        }
      },
      error: () => {
        this.saving.set(false);
      }
    });
  }

  submitClaim(): void {
    if (!this.canSubmit()) return;

    this.saving.set(true);
    const claimData = this.buildClaimData();
    
    // Create or update, then submit
    const save$ = this.isEdit()
      ? this.billingService.updateClaim(this.claimId()!, claimData)
      : this.billingService.createClaim(claimData);

    save$.subscribe({
      next: (claim) => {
        const claimId = claim.claimId || claim.id;
        if (!claimId) {
          this.saving.set(false);
          return;
        }
        
        this.billingService.submitClaim(claimId).subscribe({
          next: () => {
            this.saving.set(false);
            this.router.navigate(['/billing/claims', claimId]);
          },
          error: () => {
            this.saving.set(false);
          }
        });
      },
      error: () => {
        this.saving.set(false);
      }
    });
  }

  buildClaimData(): Partial<Claim> {
    const formValue = this.claimForm.value;
    const provider = this.providers().find(p => p.id === formValue.renderingProviderId);

    return {
      patientId: this.selectedPatient()!.id,
      patientName: this.selectedPatient()!.name,
      encounterId: this.sourceEncounter()?.id,
      type: 'professional' as ClaimType,
      insuranceId: this.selectedInsurance()!.id,
      insuranceType: this.selectedInsurance()!.type,
      payerId: this.selectedInsurance()!.payerId,
      payerName: this.selectedInsurance()!.payerName,
      subscriberId: this.selectedInsurance()!.subscriberId,
      groupNumber: this.selectedInsurance()!.groupNumber,
      authorizationNumber: formValue.authorizationNumber,
      renderingProvider: provider ? {
        id: provider.id,
        name: provider.name,
        npi: provider.npi
      } : undefined,
      serviceDate: formValue.serviceDate,
      placeOfService: formValue.placeOfService,
      diagnosisCodes: this.selectedDiagnoses(),
      lineItems: this.lineItems().map(line => ({
        ...line,
        modifiersString: undefined
      })),
      totalCharges: this.totalCharges(),
      notes: formValue.notes
    };
  }

  goBack(): void {
    this.router.navigate(['/billing/claims']);
  }

  viewEncounter(): void {
    if (this.sourceEncounter()) {
      this.router.navigate(['/encounters', this.sourceEncounter()!.id]);
    }
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}
