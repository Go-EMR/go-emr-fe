import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ImagingService } from '../data-access/services/imaging.service';
import {
  ImagingOrder,
  ImagingProcedure,
  ImagingFacility,
  ImagingModality,
  ImagingPriority,
  ImagingCategory,
  ContrastType,
  Laterality,
  BodyRegion,
  MODALITY_LABELS,
  PRIORITY_LABELS,
  CATEGORY_LABELS,
  CONTRAST_LABELS,
  LATERALITY_LABELS,
  BODY_REGION_LABELS,
  COMMON_PROCEDURES
} from '../data-access/models/imaging.model';

interface DiagnosisCode {
  code: string;
  description: string;
}

@Component({
  selector: 'app-imaging-editor',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="imaging-editor">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <button class="btn-back" routerLink="/imaging">
            ← Back to Orders
          </button>
          <h1>{{ isEditMode() ? 'Edit Imaging Order' : 'New Imaging Order' }}</h1>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="cancel()">Cancel</button>
          <button class="btn btn-outline" (click)="saveAsDraft()" [disabled]="saving()">
            Save as Draft
          </button>
          <button 
            class="btn btn-primary" 
            (click)="submitOrder()" 
            [disabled]="!canSubmit() || saving()">
            {{ saving() ? 'Submitting...' : 'Submit Order' }}
          </button>
        </div>
      </div>

      <div class="editor-layout">
        <!-- Main Form -->
        <div class="main-section">
          <!-- Patient Selection -->
          <section class="form-section">
            <h2>Patient Information</h2>
            <div class="patient-search">
              <label>Patient</label>
              <div class="search-input-wrapper">
                <input 
                  type="text"
                  placeholder="Search patient by name or MRN..."
                  [value]="patientSearchTerm()"
                  (input)="onPatientSearch($event)"
                  (focus)="showPatientDropdown.set(true)">
                @if (selectedPatient()) {
                  <div class="selected-patient">
                    <span class="patient-info">
                      {{ selectedPatient()!.name }} (MRN: {{ selectedPatient()!.mrn }})
                    </span>
                    <button class="clear-btn" (click)="clearPatient()">×</button>
                  </div>
                }
              </div>
              @if (showPatientDropdown() && patientResults().length > 0) {
                <div class="dropdown-results">
                  @for (patient of patientResults(); track patient.id) {
                    <div class="dropdown-item" (click)="selectPatient(patient)">
                      <span class="patient-name">{{ patient.name }}</span>
                      <span class="patient-details">
                        MRN: {{ patient.mrn }} | DOB: {{ patient.dob }}
                      </span>
                    </div>
                  }
                </div>
              }
            </div>

            @if (selectedPatient()) {
              <div class="patient-card">
                <div class="patient-details-grid">
                  <div class="detail">
                    <span class="label">Date of Birth</span>
                    <span class="value">{{ selectedPatient()!.dob }}</span>
                  </div>
                  <div class="detail">
                    <span class="label">Gender</span>
                    <span class="value">{{ selectedPatient()!.gender }}</span>
                  </div>
                  <div class="detail">
                    <span class="label">Phone</span>
                    <span class="value">{{ selectedPatient()!.phone }}</span>
                  </div>
                  <div class="detail">
                    <span class="label">Allergies</span>
                    <span class="value" [class.alert]="hasContrastAllergy()">
                      {{ selectedPatient()!.allergies || 'NKDA' }}
                    </span>
                  </div>
                </div>
              </div>
            }
          </section>

          <!-- Modality Selection -->
          <section class="form-section">
            <h2>Select Modality</h2>
            <div class="modality-grid">
              @for (modality of availableModalities; track modality.value) {
                <button 
                  class="modality-card"
                  [class.selected]="selectedModality() === modality.value"
                  (click)="selectModality(modality.value)">
                  <span class="modality-icon">{{ modality.icon }}</span>
                  <span class="modality-name">{{ modality.label }}</span>
                </button>
              }
            </div>
          </section>

          <!-- Procedure Selection -->
          @if (selectedModality()) {
            <section class="form-section">
              <h2>Select Procedure</h2>
              
              <!-- Common Procedures -->
              <div class="common-procedures">
                <h3>Common {{ getModalityLabel(selectedModality()!) }} Studies</h3>
                <div class="procedure-grid">
                  @for (proc of commonProcedures(); track proc.procedureCode) {
                    <button 
                      class="procedure-card"
                      [class.selected]="selectedProcedure()?.procedureCode === proc.procedureCode"
                      (click)="selectProcedure(proc)">
                      <span class="proc-name">{{ proc.procedureName || proc.name }}</span>
                      <span class="proc-details">
                        @if ((proc.contrastOptions?.length ?? 0) > 1) {
                          <span class="contrast-badge">Contrast Options</span>
                        }
                        @if (proc.prepRequired || proc.requiresPrep) {
                          <span class="prep-badge">Prep Required</span>
                        }
                      </span>
                    </button>
                  }
                </div>
              </div>

              <!-- Search All Procedures -->
              <div class="procedure-search">
                <input 
                  type="text"
                  placeholder="Search all procedures..."
                  [value]="procedureSearchTerm()"
                  (input)="onProcedureSearch($event)">
                @if (procedureSearchResults().length > 0) {
                  <div class="search-results">
                    @for (proc of procedureSearchResults(); track proc.procedureCode) {
                      <div 
                        class="search-result-item"
                        (click)="selectProcedure(proc)">
                        <span class="proc-name">{{ proc.procedureName || proc.name }}</span>
                        <span class="proc-code">{{ proc.cptCode }}</span>
                      </div>
                    }
                  </div>
                }
              </div>
            </section>
          }

          <!-- Procedure Details -->
          @if (selectedProcedure()) {
            <section class="form-section">
              <h2>Procedure Details</h2>
              
              <div class="form-row">
                <!-- Body Region -->
                <div class="form-group">
                  <label>Body Region</label>
                  <select [formControl]="bodyRegionControl">
                    <option value="">Select region</option>
                    @for (region of bodyRegions; track region.value) {
                      <option [value]="region.value">{{ region.label }}</option>
                    }
                  </select>
                </div>

                <!-- Laterality -->
                <div class="form-group">
                  <label>Laterality</label>
                  <select [formControl]="lateralityControl">
                    @for (lat of lateralityOptions; track lat.value) {
                      <option [value]="lat.value">{{ lat.label }}</option>
                    }
                  </select>
                </div>
              </div>

              <!-- Contrast -->
              @if ((selectedProcedure()?.contrastOptions?.length ?? 0) > 1) {
                <div class="form-group">
                  <label>Contrast</label>
                  <div class="contrast-options">
                    @for (contrast of selectedProcedure()!.contrastOptions ?? []; track contrast) {
                      <label class="radio-option">
                        <input 
                          type="radio" 
                          name="contrast"
                          [value]="contrast"
                          [checked]="selectedContrast() === contrast"
                          (change)="selectContrast(contrast)">
                        <span>{{ getContrastLabel(contrast) }}</span>
                      </label>
                    }
                  </div>
                </div>

                @if (selectedContrast() !== 'none') {
                  <div class="contrast-warning">
                    <span class="warning-icon">⚠️</span>
                    <div class="warning-content">
                      <strong>Contrast Administration</strong>
                      <p>Patient will receive {{ getContrastLabel(selectedContrast()!) }} contrast. 
                         Verify renal function and allergies before proceeding.</p>
                    </div>
                  </div>
                  
                  @if (hasContrastAllergy()) {
                    <div class="alert alert-danger">
                      <strong>⚠️ CONTRAST ALLERGY ALERT</strong>
                      <p>Patient has documented contrast allergy: {{ selectedPatient()?.allergies }}</p>
                      <p>Consider premedication protocol or alternative imaging.</p>
                    </div>
                  }
                }
              }

              <!-- Prep Instructions -->
              @if (selectedProcedure()?.prepRequired) {
                <div class="prep-alert">
                  <span class="prep-icon">📋</span>
                  <div class="prep-content">
                    <strong>Preparation Required</strong>
                    <p>{{ selectedProcedure()!.prepInstructions }}</p>
                  </div>
                </div>
              }
            </section>
          }

          <!-- Safety Screening -->
          @if (selectedModality() === 'mri') {
            <section class="form-section safety-section">
              <h2>MRI Safety Screening</h2>
              <div class="safety-grid">
                <label class="checkbox-option">
                  <input type="checkbox" [(ngModel)]="safetyScreening.pacemaker">
                  <span>Pacemaker / Defibrillator</span>
                </label>
                <label class="checkbox-option">
                  <input type="checkbox" [(ngModel)]="safetyScreening.cochlearImplant">
                  <span>Cochlear Implant</span>
                </label>
                <label class="checkbox-option">
                  <input type="checkbox" [(ngModel)]="safetyScreening.metalImplants">
                  <span>Metal Implants / Hardware</span>
                </label>
                <label class="checkbox-option">
                  <input type="checkbox" [(ngModel)]="safetyScreening.aneurysmalClips">
                  <span>Aneurysmal Clips</span>
                </label>
                <label class="checkbox-option">
                  <input type="checkbox" [(ngModel)]="safetyScreening.metalFragments">
                  <span>Metal Fragments (eyes/body)</span>
                </label>
                <label class="checkbox-option">
                  <input type="checkbox" [(ngModel)]="safetyScreening.claustrophobia">
                  <span>Claustrophobia</span>
                </label>
              </div>
              
              @if (hasSafetyContraindication()) {
                <div class="alert alert-danger">
                  <strong>⚠️ MRI CONTRAINDICATION</strong>
                  <p>Patient has potential MRI contraindication(s). Please verify safety before proceeding.</p>
                </div>
              }

              <!-- Pregnancy Status for Women -->
              @if (selectedPatient()?.gender === 'Female') {
                <div class="form-group">
                  <label>Pregnancy Status</label>
                  <div class="radio-group">
                    <label class="radio-option">
                      <input type="radio" name="pregnancy" value="not-pregnant" [(ngModel)]="pregnancyStatus">
                      <span>Not Pregnant</span>
                    </label>
                    <label class="radio-option">
                      <input type="radio" name="pregnancy" value="pregnant" [(ngModel)]="pregnancyStatus">
                      <span>Pregnant</span>
                    </label>
                    <label class="radio-option">
                      <input type="radio" name="pregnancy" value="unknown" [(ngModel)]="pregnancyStatus">
                      <span>Unknown</span>
                    </label>
                  </div>
                </div>
                
                @if (pregnancyStatus === 'pregnant') {
                  <div class="alert alert-warning">
                    <strong>Pregnancy Alert</strong>
                    <p>MRI is generally considered safe during pregnancy, but contrast agents should be avoided unless absolutely necessary.</p>
                  </div>
                }
              }
            </section>
          }

          <!-- Clinical Information -->
          <section class="form-section">
            <h2>Clinical Information</h2>
            
            <!-- Diagnosis Codes -->
            <div class="form-group">
              <label>Diagnosis Codes (ICD-10)</label>
              <div class="diagnosis-search">
                <input 
                  type="text"
                  placeholder="Search diagnosis codes..."
                  [value]="diagnosisSearchTerm()"
                  (input)="onDiagnosisSearch($event)">
                @if (diagnosisResults().length > 0) {
                  <div class="dropdown-results">
                    @for (diag of diagnosisResults(); track diag.code) {
                      <div class="dropdown-item" (click)="addDiagnosis(diag)">
                        <span class="diag-code">{{ diag.code }}</span>
                        <span class="diag-desc">{{ diag.description }}</span>
                      </div>
                    }
                  </div>
                }
              </div>
              @if (selectedDiagnoses().length > 0) {
                <div class="selected-diagnoses">
                  @for (diag of selectedDiagnoses(); track diag.code) {
                    <span class="diagnosis-tag">
                      {{ diag.code }} - {{ diag.description }}
                      <button class="remove-btn" (click)="removeDiagnosis(diag)">×</button>
                    </span>
                  }
                </div>
              }
            </div>

            <!-- Reason for Exam -->
            <div class="form-group">
              <label>Reason for Exam / Clinical History <span class="required">*</span></label>
              <textarea 
                rows="3"
                placeholder="Describe clinical indication, relevant history, and specific question to be answered..."
                [formControl]="clinicalHistoryControl"></textarea>
            </div>

            <!-- Priority -->
            <div class="form-row">
              <div class="form-group">
                <label>Priority</label>
                <select [formControl]="priorityControl">
                  @for (priority of priorityOptions; track priority.value) {
                    <option [value]="priority.value">{{ priority.label }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Category</label>
                <select [formControl]="categoryControl">
                  @for (category of categoryOptions; track category.value) {
                    <option [value]="category.value">{{ category.label }}</option>
                  }
                </select>
              </div>
            </div>

            @if (priorityControl.value === ImagingPriority.Stat) {
              <div class="alert alert-warning">
                <strong>STAT Order</strong>
                <p>STAT orders require immediate attention. Please ensure clinical urgency warrants STAT priority and notify the performing facility directly.</p>
              </div>
            }

            <!-- Special Instructions -->
            <div class="form-group">
              <label>Special Instructions / Notes</label>
              <textarea 
                rows="2"
                placeholder="Any special instructions for technologist or radiologist..."
                [formControl]="notesControl"></textarea>
            </div>
          </section>

          <!-- Facility & Scheduling -->
          <section class="form-section">
            <h2>Facility & Scheduling</h2>
            
            <div class="form-group">
              <label>Performing Facility</label>
              <div class="facility-options">
                @for (facility of availableFacilities(); track facility.facilityId) {
                  <label class="facility-card" [class.selected]="selectedFacility()?.facilityId === facility.facilityId">
                    <input 
                      type="radio" 
                      name="facility"
                      [value]="facility.facilityId"
                      (change)="selectFacility(facility)">
                    <div class="facility-content">
                      <span class="facility-name">{{ facility.name }}</span>
                      <span class="facility-address">{{ facility.address }}</span>
                      <div class="facility-badges">
                        @if (facility.isPreferred) {
                          <span class="badge preferred">Preferred</span>
                        }
                        @if (facility.is24Hour) {
                          <span class="badge">24/7</span>
                        }
                        @if (facility.acceptsWalkIns) {
                          <span class="badge">Walk-ins</span>
                        }
                        @if (facility.hasPacsIntegration) {
                          <span class="badge pacs">PACS</span>
                        }
                      </div>
                    </div>
                  </label>
                }
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Scheduled Date</label>
                <input type="date" [formControl]="scheduledDateControl">
              </div>
              <div class="form-group">
                <label>Scheduled Time</label>
                <input type="time" [formControl]="scheduledTimeControl">
              </div>
            </div>
          </section>
        </div>

        <!-- Order Summary Sidebar -->
        <div class="sidebar">
          <div class="summary-card">
            <h3>Order Summary</h3>
            
            <div class="summary-section">
              <span class="summary-label">Patient</span>
              <span class="summary-value">
                {{ selectedPatient()?.name || 'Not selected' }}
              </span>
            </div>

            <div class="summary-section">
              <span class="summary-label">Procedure</span>
              <span class="summary-value">
                {{ selectedProcedure()?.name || 'Not selected' }}
              </span>
            </div>

            @if (selectedProcedure()) {
              <div class="summary-section">
                <span class="summary-label">Modality</span>
                <span class="summary-value">
                  {{ getModalityLabel(selectedModality()!) }}
                </span>
              </div>

              @if (bodyRegionControl.value) {
                <div class="summary-section">
                  <span class="summary-label">Body Region</span>
                  <span class="summary-value">
                    {{ getBodyRegionLabel(bodyRegionControl.value) }}
                    @if (lateralityControl.value !== 'not-applicable') {
                      ({{ lateralityControl.value | titlecase }})
                    }
                  </span>
                </div>
              }

              @if (selectedContrast() !== 'none') {
                <div class="summary-section">
                  <span class="summary-label">Contrast</span>
                  <span class="summary-value contrast">
                    {{ getContrastLabel(selectedContrast()!) }}
                  </span>
                </div>
              }

              <div class="summary-section">
                <span class="summary-label">Priority</span>
                <span class="summary-value" [class.stat]="priorityControl.value === ImagingPriority.Stat">
                  {{ priorityControl.value ? getPriorityLabel(priorityControl.value) : '' }}
                </span>
              </div>

              @if (selectedFacility()) {
                <div class="summary-section">
                  <span class="summary-label">Facility</span>
                  <span class="summary-value">
                    {{ selectedFacility()!.name }}
                  </span>
                </div>
              }

              <div class="summary-section">
                <span class="summary-label">Est. Duration</span>
                <span class="summary-value">
                  {{ selectedProcedure()!.estimatedDuration }} minutes
                </span>
              </div>

              @if (selectedProcedure()!.prepRequired) {
                <div class="summary-alert prep">
                  📋 Patient preparation required
                </div>
              }

              @if (hasContrastAllergy()) {
                <div class="summary-alert danger">
                  ⚠️ Contrast allergy documented
                </div>
              }

              @if (hasSafetyContraindication()) {
                <div class="summary-alert danger">
                  ⚠️ Safety screening concerns
                </div>
              }
            }

            <!-- Validation Status -->
            <div class="validation-section">
              <h4>Validation</h4>
              @if (!selectedPatient()) {
                <div class="validation-item error">
                  <span class="icon">✗</span> Patient required
                </div>
              } @else {
                <div class="validation-item success">
                  <span class="icon">✓</span> Patient selected
                </div>
              }

              @if (!selectedProcedure()) {
                <div class="validation-item error">
                  <span class="icon">✗</span> Procedure required
                </div>
              } @else {
                <div class="validation-item success">
                  <span class="icon">✓</span> Procedure selected
                </div>
              }

              @if (!clinicalHistoryControl.value) {
                <div class="validation-item error">
                  <span class="icon">✗</span> Clinical history required
                </div>
              } @else {
                <div class="validation-item success">
                  <span class="icon">✓</span> Clinical history provided
                </div>
              }

              @if (selectedDiagnoses().length === 0) {
                <div class="validation-item warning">
                  <span class="icon">!</span> Diagnosis code recommended
                </div>
              } @else {
                <div class="validation-item success">
                  <span class="icon">✓</span> Diagnosis code(s) added
                </div>
              }
            </div>
          </div>

          <!-- Prior Studies -->
          @if (selectedPatient() && priorStudies().length > 0) {
            <div class="prior-studies-card">
              <h3>Prior Studies</h3>
              @for (study of priorStudies(); track study.orderId) {
                <div class="prior-study-item">
                  <span class="study-procedure">{{ study.procedure }}</span>
                  <span class="study-date">{{ study.reportedDate | date:'MM/dd/yyyy' }}</span>
                </div>
              }
              <button class="btn btn-link btn-sm">View All Prior Studies</button>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .imaging-editor {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .btn-back {
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      font-size: 0.9rem;
    }

    .btn-back:hover {
      color: #3b82f6;
    }

    .page-header h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .btn {
      padding: 0.625rem 1.25rem;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }

    .btn:disabled {
      opacity: 0.6;
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
      background: #e2e8f0;
      color: #475569;
    }

    .btn-outline {
      background: white;
      border: 1px solid #e2e8f0;
      color: #475569;
    }

    .btn-link {
      background: none;
      color: #3b82f6;
      padding: 0.25rem;
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.8rem;
    }

    /* Layout */
    .editor-layout {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 1.5rem;
    }

    /* Form Sections */
    .form-section {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .form-section h2 {
      margin: 0 0 1rem 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: #1e293b;
    }

    .form-section h3 {
      margin: 0 0 0.75rem 0;
      font-size: 0.95rem;
      font-weight: 500;
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

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }

    .required {
      color: #ef4444;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 0.625rem 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 0.9rem;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    /* Patient Search */
    .patient-search {
      position: relative;
      margin-bottom: 1rem;
    }

    .search-input-wrapper {
      position: relative;
    }

    .search-input-wrapper input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 0.9rem;
    }

    .selected-patient {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 0.75rem;
      background: #eff6ff;
      border: 1px solid #3b82f6;
      border-radius: 6px;
    }

    .patient-info {
      font-weight: 500;
      color: #1e40af;
    }

    .clear-btn {
      background: none;
      border: none;
      font-size: 1.25rem;
      color: #64748b;
      cursor: pointer;
    }

    .dropdown-results {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 100;
      max-height: 240px;
      overflow-y: auto;
    }

    .dropdown-item {
      padding: 0.75rem 1rem;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .dropdown-item:hover {
      background: #f8fafc;
    }

    .patient-name {
      font-weight: 500;
      color: #1e293b;
    }

    .patient-details {
      font-size: 0.8rem;
      color: #64748b;
    }

    /* Patient Card */
    .patient-card {
      background: #f8fafc;
      border-radius: 6px;
      padding: 1rem;
    }

    .patient-details-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .patient-details-grid .detail {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .patient-details-grid .label {
      font-size: 0.75rem;
      color: #64748b;
      text-transform: uppercase;
    }

    .patient-details-grid .value {
      font-size: 0.9rem;
      color: #1e293b;
    }

    .patient-details-grid .value.alert {
      color: #ef4444;
      font-weight: 500;
    }

    /* Modality Grid */
    .modality-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;
    }

    .modality-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .modality-card:hover {
      border-color: #94a3b8;
    }

    .modality-card.selected {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .modality-icon {
      font-size: 1.5rem;
    }

    .modality-name {
      font-size: 0.85rem;
      font-weight: 500;
      color: #475569;
    }

    /* Procedure Grid */
    .common-procedures {
      margin-bottom: 1.5rem;
    }

    .procedure-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
    }

    .procedure-card {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 0.75rem 1rem;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      text-align: left;
      cursor: pointer;
      transition: all 0.2s;
    }

    .procedure-card:hover {
      border-color: #94a3b8;
    }

    .procedure-card.selected {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .proc-name {
      font-size: 0.9rem;
      font-weight: 500;
      color: #1e293b;
    }

    .proc-details {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .contrast-badge,
    .prep-badge {
      font-size: 0.7rem;
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
    }

    .contrast-badge {
      background: #dbeafe;
      color: #1e40af;
    }

    .prep-badge {
      background: #fef3c7;
      color: #b45309;
    }

    /* Procedure Search */
    .procedure-search {
      position: relative;
    }

    .procedure-search input {
      width: 100%;
      padding: 0.625rem 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
    }

    .search-results {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 100;
      max-height: 200px;
      overflow-y: auto;
    }

    .search-result-item {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      cursor: pointer;
    }

    .search-result-item:hover {
      background: #f8fafc;
    }

    .proc-code {
      font-size: 0.8rem;
      color: #64748b;
    }

    /* Contrast Options */
    .contrast-options,
    .radio-group {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .radio-option,
    .checkbox-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    .radio-option input,
    .checkbox-option input {
      width: auto;
    }

    /* Safety Section */
    .safety-section .safety-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    /* Alerts */
    .alert {
      padding: 1rem;
      border-radius: 6px;
      margin-top: 1rem;
    }

    .alert-danger {
      background: #fef2f2;
      border: 1px solid #fca5a5;
      color: #b91c1c;
    }

    .alert-warning {
      background: #fef3c7;
      border: 1px solid #fcd34d;
      color: #b45309;
    }

    .alert strong {
      display: block;
      margin-bottom: 0.25rem;
    }

    .alert p {
      margin: 0;
      font-size: 0.9rem;
    }

    .contrast-warning,
    .prep-alert {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 6px;
      margin-top: 1rem;
    }

    .warning-icon,
    .prep-icon {
      font-size: 1.25rem;
    }

    .warning-content strong,
    .prep-content strong {
      display: block;
      margin-bottom: 0.25rem;
      color: #1e293b;
    }

    .warning-content p,
    .prep-content p {
      margin: 0;
      font-size: 0.9rem;
      color: #64748b;
    }

    /* Diagnosis */
    .diagnosis-search {
      position: relative;
      margin-bottom: 0.5rem;
    }

    .diagnosis-search input {
      width: 100%;
      padding: 0.625rem 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
    }

    .diag-code {
      font-weight: 500;
      margin-right: 0.5rem;
    }

    .diag-desc {
      color: #64748b;
    }

    .selected-diagnoses {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .diagnosis-tag {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 0.75rem;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 4px;
      font-size: 0.85rem;
    }

    .remove-btn {
      background: none;
      border: none;
      font-size: 1rem;
      color: #64748b;
      cursor: pointer;
    }

    /* Facility Options */
    .facility-options {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    .facility-card {
      display: flex;
      gap: 0.75rem;
      padding: 1rem;
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .facility-card:hover {
      border-color: #94a3b8;
    }

    .facility-card.selected {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .facility-card input {
      width: auto;
    }

    .facility-content {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .facility-name {
      font-weight: 500;
      color: #1e293b;
    }

    .facility-address {
      font-size: 0.8rem;
      color: #64748b;
    }

    .facility-badges {
      display: flex;
      gap: 0.375rem;
      flex-wrap: wrap;
      margin-top: 0.25rem;
    }

    .facility-badges .badge {
      font-size: 0.65rem;
      padding: 0.125rem 0.375rem;
      background: #e2e8f0;
      border-radius: 4px;
      color: #475569;
    }

    .facility-badges .badge.preferred {
      background: #d1fae5;
      color: #047857;
    }

    .facility-badges .badge.pacs {
      background: #dbeafe;
      color: #1e40af;
    }

    /* Sidebar */
    .sidebar {
      position: sticky;
      top: 1.5rem;
      align-self: start;
    }

    .summary-card,
    .prior-studies-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1.25rem;
      margin-bottom: 1rem;
    }

    .summary-card h3,
    .prior-studies-card h3 {
      margin: 0 0 1rem 0;
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .summary-section {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid #f1f5f9;
    }

    .summary-label {
      font-size: 0.85rem;
      color: #64748b;
    }

    .summary-value {
      font-size: 0.85rem;
      font-weight: 500;
      color: #1e293b;
      text-align: right;
    }

    .summary-value.contrast {
      color: #1e40af;
    }

    .summary-value.stat {
      color: #b91c1c;
      font-weight: 700;
    }

    .summary-alert {
      margin-top: 0.75rem;
      padding: 0.5rem 0.75rem;
      border-radius: 4px;
      font-size: 0.8rem;
    }

    .summary-alert.prep {
      background: #fef3c7;
      color: #b45309;
    }

    .summary-alert.danger {
      background: #fef2f2;
      color: #b91c1c;
    }

    /* Validation Section */
    .validation-section {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }

    .validation-section h4 {
      margin: 0 0 0.75rem 0;
      font-size: 0.85rem;
      font-weight: 600;
      color: #64748b;
    }

    .validation-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      padding: 0.25rem 0;
    }

    .validation-item.success {
      color: #059669;
    }

    .validation-item.error {
      color: #dc2626;
    }

    .validation-item.warning {
      color: #d97706;
    }

    .validation-item .icon {
      font-weight: 700;
    }

    /* Prior Studies */
    .prior-study-item {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid #f1f5f9;
    }

    .study-procedure {
      font-size: 0.85rem;
      color: #1e293b;
    }

    .study-date {
      font-size: 0.8rem;
      color: #64748b;
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .editor-layout {
        grid-template-columns: 1fr;
      }

      .sidebar {
        position: static;
      }
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 1rem;
      }

      .header-actions {
        width: 100%;
        justify-content: flex-end;
      }

      .modality-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .procedure-grid {
        grid-template-columns: 1fr;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .facility-options {
        grid-template-columns: 1fr;
      }

      .patient-details-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class ImagingEditorComponent implements OnInit {
  private readonly imagingService = inject(ImagingService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  // Expose enums for template
  readonly ImagingPriority = ImagingPriority;
  readonly ContrastType = ContrastType;

  // State
  isEditMode = signal(false);
  orderId = signal<string | null>(null);
  saving = signal(false);

  // Patient
  patientSearchTerm = signal('');
  patientResults = signal<any[]>([]);
  selectedPatient = signal<any | null>(null);
  showPatientDropdown = signal(false);

  // Modality & Procedure
  selectedModality = signal<ImagingModality | null>(null);
  procedureSearchTerm = signal('');
  procedureSearchResults = signal<ImagingProcedure[]>([]);
  selectedProcedure = signal<ImagingProcedure | null>(null);
  selectedContrast = signal<ContrastType>(ContrastType.None);

  // Diagnosis
  diagnosisSearchTerm = signal('');
  diagnosisResults = signal<DiagnosisCode[]>([]);
  selectedDiagnoses = signal<DiagnosisCode[]>([]);

  // Facility
  availableFacilities = signal<ImagingFacility[]>([]);
  selectedFacility = signal<ImagingFacility | null>(null);

  // Prior studies
  priorStudies = signal<ImagingOrder[]>([]);

  // Safety screening
  safetyScreening = {
    pacemaker: false,
    cochlearImplant: false,
    metalImplants: false,
    aneurysmalClips: false,
    metalFragments: false,
    claustrophobia: false
  };
  pregnancyStatus = 'not-pregnant';

  // Form controls
  bodyRegionControl = this.fb.control('');
  lateralityControl = this.fb.control(Laterality.NotApplicable);
  priorityControl = this.fb.control<ImagingPriority | null>(ImagingPriority.Routine);
  categoryControl = this.fb.control(ImagingCategory.Diagnostic);
  clinicalHistoryControl = this.fb.control('', Validators.required);
  notesControl = this.fb.control('');
  scheduledDateControl = this.fb.control('');
  scheduledTimeControl = this.fb.control('');

  // Options
  availableModalities = [
    { value: ImagingModality.XRay, label: 'X-Ray', icon: '🩻' },
    { value: ImagingModality.CT, label: 'CT Scan', icon: '🔬' },
    { value: ImagingModality.MRI, label: 'MRI', icon: '🧲' },
    { value: ImagingModality.Ultrasound, label: 'Ultrasound', icon: '📡' },
    { value: ImagingModality.Mammography, label: 'Mammography', icon: '🎗️' },
    { value: ImagingModality.Nuclear, label: 'Nuclear Med', icon: '☢️' },
    { value: ImagingModality.PET, label: 'PET Scan', icon: '🔆' },
    { value: ImagingModality.Fluoroscopy, label: 'Fluoroscopy', icon: '📺' }
  ];

  bodyRegions = Object.entries(BODY_REGION_LABELS).map(([value, label]) => ({ value, label }));
  lateralityOptions = Object.entries(LATERALITY_LABELS).map(([value, label]) => ({ value, label }));
  priorityOptions = Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label }));
  categoryOptions = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }));

  // Mock patient data
  mockPatients = [
    { id: 'P001', name: 'John Smith', mrn: 'MRN001', dob: '03/15/1980', gender: 'Male', phone: '(555) 123-4567', allergies: '' },
    { id: 'P002', name: 'Sarah Johnson', mrn: 'MRN002', dob: '07/22/1975', gender: 'Female', phone: '(555) 234-5678', allergies: 'IV Contrast Dye' },
    { id: 'P003', name: 'Michael Brown', mrn: 'MRN003', dob: '11/08/1992', gender: 'Male', phone: '(555) 345-6789', allergies: '' },
    { id: 'P004', name: 'Emily Davis', mrn: 'MRN004', dob: '02/14/1988', gender: 'Female', phone: '(555) 456-7890', allergies: '' }
  ];

  // Mock diagnosis codes
  mockDiagnosisCodes: DiagnosisCode[] = [
    { code: 'R51.9', description: 'Headache, unspecified' },
    { code: 'M54.5', description: 'Low back pain' },
    { code: 'R10.9', description: 'Unspecified abdominal pain' },
    { code: 'J18.9', description: 'Pneumonia, unspecified organism' },
    { code: 'S82.90', description: 'Fracture of lower leg' },
    { code: 'M79.3', description: 'Panniculitis, unspecified' },
    { code: 'N17.9', description: 'Acute kidney failure, unspecified' },
    { code: 'K80.20', description: 'Calculus of gallbladder' },
    { code: 'G43.909', description: 'Migraine, unspecified' },
    { code: 'I63.9', description: 'Cerebral infarction, unspecified' },
    { code: 'C50.919', description: 'Malignant neoplasm of breast' },
    { code: 'M17.11', description: 'Primary osteoarthritis, right knee' },
    { code: 'S83.512', description: 'Sprain of ACL of left knee' }
  ];

  // Computed
  commonProcedures = computed(() => {
    const modality = this.selectedModality();
    if (!modality) return [];
    return COMMON_PROCEDURES[modality] || [];
  });

  canSubmit = computed(() => {
    return !!(
      this.selectedPatient() &&
      this.selectedProcedure() &&
      this.clinicalHistoryControl.value
    );
  });

  ngOnInit(): void {
    this.loadFacilities();

    // Check for edit mode
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.orderId.set(id);
      this.isEditMode.set(true);
      this.loadOrder(id);
    }
  }

  loadFacilities(): void {
    this.imagingService.getFacilities().subscribe({
      next: (facilities) => {
        this.availableFacilities.set(facilities);
        // Pre-select preferred facility
        const preferred = facilities.find(f => f.isPreferred);
        if (preferred) {
          this.selectedFacility.set(preferred);
        }
      }
    });
  }

  loadOrder(orderId: string): void {
    this.imagingService.getOrderById(orderId).subscribe({
      next: (order) => {
        // Populate form with existing order data
        // This would be implemented to fill all form fields
      }
    });
  }

  // Patient methods
  onPatientSearch(event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    this.patientSearchTerm.set(term);

    if (term.length >= 2) {
      const results = this.mockPatients.filter(p =>
        p.name.toLowerCase().includes(term.toLowerCase()) ||
        p.mrn.toLowerCase().includes(term.toLowerCase())
      );
      this.patientResults.set(results);
      this.showPatientDropdown.set(true);
    } else {
      this.patientResults.set([]);
    }
  }

  selectPatient(patient: any): void {
    this.selectedPatient.set(patient);
    this.patientSearchTerm.set('');
    this.patientResults.set([]);
    this.showPatientDropdown.set(false);
    this.loadPriorStudies(patient.id);
  }

  clearPatient(): void {
    this.selectedPatient.set(null);
    this.priorStudies.set([]);
  }

  loadPriorStudies(patientId: string): void {
    this.imagingService.getOrdersByPatient(patientId).subscribe({
      next: (orders: ImagingOrder[]) => {
        this.priorStudies.set(orders.slice(0, 5));
      }
    });
  }

  // Modality & Procedure methods
  selectModality(modality: ImagingModality): void {
    this.selectedModality.set(modality);
    this.selectedProcedure.set(null);
    this.procedureSearchTerm.set('');
    this.procedureSearchResults.set([]);

    // Filter facilities by modality
    this.imagingService.getFacilitiesByModality(modality).subscribe({
      next: (facilities) => {
        this.availableFacilities.set(facilities);
        // Keep selected if still valid, otherwise select preferred
        if (this.selectedFacility() && !facilities.find(f => f.facilityId === this.selectedFacility()!.facilityId)) {
          const preferred = facilities.find(f => f.isPreferred) || facilities[0];
          this.selectedFacility.set(preferred);
        }
      }
    });
  }

  onProcedureSearch(event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    this.procedureSearchTerm.set(term);

    if (term.length >= 2 && this.selectedModality()) {
      this.imagingService.getProcedures({
        modality: this.selectedModality()!,
        searchTerm: term
      }).subscribe({
        next: (procedures) => {
          this.procedureSearchResults.set(procedures);
        }
      });
    } else {
      this.procedureSearchResults.set([]);
    }
  }

  selectProcedure(procedure: Partial<ImagingProcedure>): void {
    if (!procedure.procedureCode) return;
    this.selectedProcedure.set(procedure as ImagingProcedure);
    this.procedureSearchTerm.set('');
    this.procedureSearchResults.set([]);

    // Set default contrast
    this.selectedContrast.set(procedure.defaultContrast || ContrastType.None);

    // Set body region if procedure has default
    if (procedure.bodyRegion) {
      this.bodyRegionControl.setValue(procedure.bodyRegion);
    }
  }

  selectContrast(contrast: ContrastType): void {
    this.selectedContrast.set(contrast);
  }

  // Diagnosis methods
  onDiagnosisSearch(event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    this.diagnosisSearchTerm.set(term);

    if (term.length >= 2) {
      const results = this.mockDiagnosisCodes.filter(d =>
        d.code.toLowerCase().includes(term.toLowerCase()) ||
        d.description.toLowerCase().includes(term.toLowerCase())
      );
      this.diagnosisResults.set(results.slice(0, 10));
    } else {
      this.diagnosisResults.set([]);
    }
  }

  addDiagnosis(diagnosis: DiagnosisCode): void {
    const current = this.selectedDiagnoses();
    if (!current.find(d => d.code === diagnosis.code)) {
      this.selectedDiagnoses.set([...current, diagnosis]);
    }
    this.diagnosisSearchTerm.set('');
    this.diagnosisResults.set([]);
  }

  removeDiagnosis(diagnosis: DiagnosisCode): void {
    this.selectedDiagnoses.set(
      this.selectedDiagnoses().filter(d => d.code !== diagnosis.code)
    );
  }

  // Facility methods
  selectFacility(facility: ImagingFacility): void {
    this.selectedFacility.set(facility);
  }

  // Safety methods
  hasContrastAllergy(): boolean {
    const patient = this.selectedPatient();
    if (!patient?.allergies) return false;
    const allergies = patient.allergies.toLowerCase();
    return allergies.includes('contrast') || allergies.includes('iodine') || allergies.includes('dye');
  }

  hasSafetyContraindication(): boolean {
    return Object.values(this.safetyScreening).some(v => v);
  }

  // Label helpers
  getModalityLabel(modality: ImagingModality): string {
    return MODALITY_LABELS[modality] || modality;
  }

  getContrastLabel(contrast: ContrastType): string {
    return CONTRAST_LABELS[contrast] || contrast;
  }

  getPriorityLabel(priority: ImagingPriority | string | null): string {
    if (!priority) return '';
    return PRIORITY_LABELS[priority as ImagingPriority] || String(priority);
  }

  getBodyRegionLabel(region: string): string {
    return BODY_REGION_LABELS[region as BodyRegion] || region;
  }

  // Form actions
  saveAsDraft(): void {
    this.saveOrder('draft');
  }

  submitOrder(): void {
    this.saveOrder('pending');
  }

  private saveOrder(status: string): void {
    if (!this.selectedPatient() || !this.selectedProcedure()) return;

    this.saving.set(true);

    const order: Partial<ImagingOrder> = {
      patientId: this.selectedPatient()!.id,
      modality: this.selectedModality()!,
      procedure: this.selectedProcedure()!.name,
      procedureCode: this.selectedProcedure()!.procedureCode,
      bodyRegion: this.bodyRegionControl.value as BodyRegion || undefined,
      laterality: this.lateralityControl.value as Laterality,
      priority: this.priorityControl.value ?? ImagingPriority.Routine,
      category: this.categoryControl.value as ImagingCategory,
      contrastRequired: this.selectedContrast() !== ContrastType.None,
      contrastType: this.selectedContrast(),
      diagnosisCodes: this.selectedDiagnoses().map(d => ({ code: d.code, description: d.description })),
      clinicalHistory: this.clinicalHistoryControl.value || undefined,
      reasonForExam: this.clinicalHistoryControl.value || undefined,
      technicianInstructions: this.notesControl.value || undefined,
      performingFacility: this.selectedFacility() || undefined,
      scheduledDate: this.scheduledDateControl.value || undefined,
      safetyScreening: this.selectedModality() === ImagingModality.MRI ? {
        ...this.safetyScreening,
        pregnancyStatus: this.pregnancyStatus as any
      } : undefined
    };

    const saveObs = this.isEditMode()
      ? this.imagingService.updateOrder(this.orderId()!, order)
      : this.imagingService.createOrder(order);

    saveObs.subscribe({
      next: (savedOrder) => {
        this.saving.set(false);
        this.router.navigate(['/imaging', savedOrder.orderId]);
      },
      error: (err) => {
        console.error('Failed to save order:', err);
        this.saving.set(false);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/imaging']);
  }
}
