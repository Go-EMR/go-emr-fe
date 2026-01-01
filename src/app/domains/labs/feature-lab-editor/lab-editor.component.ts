import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LabService } from '../data-access/services/lab.service';
import {
  LabOrder,
  LabTest,
  LabPanel,
  LabFacility,
  LabCategory,
  LabPriority,
  COMMON_LAB_PANELS
} from '../data-access/models/lab.model';

interface SelectedTest {
  test: LabTest;
  quantity: number;
}

interface SelectedPanel {
  panel: LabPanel;
  expanded: boolean;
}

interface PatientSearchResult {
  patientId: string;
  name: string;
  dob: string;
  mrn: string;
}

interface DiagnosisCode {
  code: string;
  description: string;
}

@Component({
  selector: 'app-lab-editor',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="lab-editor-container">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <!-- Header -->
        <div class="page-header">
          <div class="header-left">
            <button type="button" class="btn-back" (click)="goBack()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <div class="header-content">
              <h1>{{ isEditing() ? 'Edit Lab Order' : 'New Lab Order' }}</h1>
              <p class="subtitle">
                {{ isEditing() ? 'Update order details' : 'Create a laboratory order' }}
              </p>
            </div>
          </div>
          <div class="header-actions">
            <button type="button" class="btn btn-secondary" (click)="goBack()">Cancel</button>
            <button type="button" class="btn btn-secondary" (click)="saveDraft()" [disabled]="saving()">
              Save as Draft
            </button>
            <button type="submit" class="btn btn-primary" [disabled]="!form.valid || saving()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              {{ saving() ? 'Saving...' : 'Submit Order' }}
            </button>
          </div>
        </div>

        <div class="editor-grid">
          <!-- Main Form -->
          <div class="main-form">
            <!-- Patient Selection -->
            <section class="form-section">
              <h2>Patient</h2>
              
              @if (selectedPatient()) {
                <div class="selected-patient">
                  <div class="patient-info">
                    <div class="avatar">{{ getInitials(selectedPatient()!.name) }}</div>
                    <div class="details">
                      <span class="name">{{ selectedPatient()!.name }}</span>
                      <span class="meta">MRN: {{ selectedPatient()!.mrn }} • DOB: {{ selectedPatient()!.dob }}</span>
                    </div>
                  </div>
                  <button type="button" class="btn btn-sm" (click)="clearPatient()">Change</button>
                </div>
              } @else {
                <div class="search-field">
                  <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="M21 21l-4.35-4.35"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search patients by name or MRN..."
                    [(ngModel)]="patientSearch"
                    [ngModelOptions]="{standalone: true}"
                    (input)="searchPatients()"
                  />
                  @if (patientSearching()) {
                    <div class="spinner-small"></div>
                  }
                </div>

                @if (patientResults().length > 0) {
                  <div class="search-results">
                    @for (patient of patientResults(); track patient.patientId) {
                      <button type="button" class="result-item" (click)="selectPatient(patient)">
                        <div class="avatar small">{{ getInitials(patient.name) }}</div>
                        <div class="details">
                          <span class="name">{{ patient.name }}</span>
                          <span class="meta">MRN: {{ patient.mrn }} • DOB: {{ patient.dob }}</span>
                        </div>
                      </button>
                    }
                  </div>
                }
              }
            </section>

            <!-- Tests & Panels Selection -->
            <section class="form-section">
              <h2>Tests & Panels</h2>

              <!-- Quick Panel Selection -->
              <div class="quick-panels">
                <label class="section-label">Common Panels</label>
                <div class="panel-grid">
                  @for (panel of commonPanels(); track panel.panelCode) {
                    <button
                      type="button"
                      class="panel-chip"
                      [class.selected]="isPanelSelected(panel.panelCode)"
                      (click)="togglePanel(panel)">
                      @if (isPanelSelected(panel.panelCode)) {
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      }
                      {{ panel.panelName }}
                      @if (panel.fastingRequired) {
                        <span class="fasting-badge">F</span>
                      }
                    </button>
                  }
                </div>
              </div>

              <!-- Individual Test Search -->
              <div class="test-search">
                <label class="section-label">Add Individual Tests</label>
                <div class="search-field">
                  <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="M21 21l-4.35-4.35"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search tests by name or code..."
                    [(ngModel)]="testSearch"
                    [ngModelOptions]="{standalone: true}"
                    (input)="searchTests()"
                  />
                </div>

                @if (testResults().length > 0) {
                  <div class="test-results">
                    @for (test of testResults(); track test.testCode) {
                      <button
                        type="button"
                        class="test-result"
                        [class.selected]="isTestSelected(test.testCode)"
                        (click)="toggleTest(test)">
                        <div class="test-info">
                          <span class="test-name">{{ test.testName }}</span>
                          <span class="test-code">{{ test.testCode }}</span>
                        </div>
                        <div class="test-meta">
                          <span class="category">{{ test.category }}</span>
                          @if (test.fastingRequired) {
                            <span class="fasting-badge">Fasting</span>
                          }
                        </div>
                        @if (isTestSelected(test.testCode)) {
                          <svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        }
                      </button>
                    }
                  </div>
                }
              </div>

              <!-- Category Browser -->
              <div class="category-browser">
                <label class="section-label">Browse by Category</label>
                <div class="category-tabs">
                  @for (cat of categories; track cat) {
                    <button
                      type="button"
                      class="category-tab"
                      [class.active]="selectedCategory() === cat"
                      (click)="selectCategory(cat)">
                      {{ formatCategory(cat) }}
                    </button>
                  }
                </div>

                @if (categoryTests().length > 0) {
                  <div class="category-tests">
                    @for (test of categoryTests(); track test.testCode) {
                      <button
                        type="button"
                        class="test-item"
                        [class.selected]="isTestSelected(test.testCode)"
                        (click)="toggleTest(test)">
                        <span class="test-name">{{ test.testName }}</span>
                        @if (isTestSelected(test.testCode)) {
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        }
                      </button>
                    }
                  </div>
                }
              </div>

              <!-- Selected Tests Summary -->
              @if (selectedTests().length > 0 || selectedPanels().length > 0) {
                <div class="selected-tests">
                  <label class="section-label">Selected Tests ({{ totalTestCount() }})</label>
                  
                  @for (panel of selectedPanels(); track panel.panel.panelCode) {
                    <div class="selected-panel">
                      <div class="panel-header" (click)="togglePanelExpand(panel)">
                        <svg class="expand-icon" [class.expanded]="panel.expanded" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                        <span class="panel-name">{{ panel.panel.panelName }}</span>
                        <span class="test-count">({{ panel.panel.tests.length }} tests)</span>
                        <button type="button" class="remove-btn" (click)="removePanel(panel, $event)">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                      @if (panel.expanded) {
                        <div class="panel-tests">
                          @for (test of panel.panel.tests; track test.testCode) {
                            <span class="panel-test">{{ test.testName }}</span>
                          }
                        </div>
                      }
                    </div>
                  }

                  @for (item of selectedTests(); track item.test.testCode) {
                    <div class="selected-test">
                      <span class="test-name">{{ item.test.testName }}</span>
                      <span class="test-code">{{ item.test.testCode }}</span>
                      <button type="button" class="remove-btn" (click)="removeTest(item)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  }
                </div>
              }
            </section>

            <!-- Diagnosis Codes -->
            <section class="form-section">
              <h2>Diagnosis Codes</h2>
              
              <div class="search-field">
                <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search ICD-10 codes..."
                  [(ngModel)]="diagnosisSearch"
                  [ngModelOptions]="{standalone: true}"
                  (input)="searchDiagnosis()"
                />
              </div>

              @if (diagnosisResults().length > 0) {
                <div class="diagnosis-results">
                  @for (dx of diagnosisResults(); track dx.code) {
                    <button
                      type="button"
                      class="diagnosis-item"
                      (click)="addDiagnosis(dx)">
                      <span class="dx-code">{{ dx.code }}</span>
                      <span class="dx-desc">{{ dx.description }}</span>
                    </button>
                  }
                </div>
              }

              @if (selectedDiagnoses().length > 0) {
                <div class="selected-diagnoses">
                  @for (dx of selectedDiagnoses(); track dx.code) {
                    <div class="diagnosis-chip">
                      <span class="dx-code">{{ dx.code }}</span>
                      <span class="dx-desc">{{ dx.description }}</span>
                      <button type="button" class="remove-btn" (click)="removeDiagnosis(dx)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  }
                </div>
              }
            </section>

            <!-- Clinical Notes -->
            <section class="form-section">
              <h2>Clinical Information</h2>

              <div class="form-group">
                <label for="clinicalNotes">Clinical Notes</label>
                <textarea
                  id="clinicalNotes"
                  formControlName="clinicalNotes"
                  rows="3"
                  placeholder="Relevant clinical history, reason for testing..."></textarea>
              </div>

              <div class="form-group">
                <label for="patientInstructions">Patient Instructions</label>
                <textarea
                  id="patientInstructions"
                  formControlName="patientInstructions"
                  rows="2"
                  placeholder="Special instructions for the patient..."></textarea>
              </div>

              <div class="form-group">
                <label for="labInstructions">Lab Instructions</label>
                <textarea
                  id="labInstructions"
                  formControlName="labInstructions"
                  rows="2"
                  placeholder="Special instructions for the laboratory..."></textarea>
              </div>
            </section>
          </div>

          <!-- Sidebar -->
          <aside class="sidebar">
            <!-- Order Priority -->
            <div class="sidebar-card">
              <h3>Priority</h3>
              <div class="priority-options">
                @for (p of priorities; track p.value) {
                  <label class="priority-option" [class.selected]="form.get('priority')?.value === p.value">
                    <input
                      type="radio"
                      formControlName="priority"
                      [value]="p.value"
                    />
                    <span class="priority-label" [class]="'priority-' + p.value">
                      {{ p.label }}
                    </span>
                    <span class="priority-desc">{{ p.description }}</span>
                  </label>
                }
              </div>
            </div>

            <!-- Fasting Alert -->
            @if (requiresFasting()) {
              <div class="sidebar-card fasting-alert">
                <div class="alert-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                </div>
                <div class="alert-content">
                  <strong>Fasting Required</strong>
                  <p>{{ fastingHours() }} hours of fasting required for selected tests.</p>
                </div>
              </div>
            }

            <!-- Performing Lab -->
            <div class="sidebar-card">
              <h3>Performing Lab</h3>
              <select formControlName="performingLabId" class="form-select">
                <option value="">Select lab facility</option>
                @for (facility of facilities(); track facility.facilityId) {
                  <option [value]="facility.facilityId">
                    {{ facility.name }}
                    @if (facility.isPreferred) { (Preferred) }
                  </option>
                }
              </select>

              @if (selectedFacility()) {
                <div class="facility-details">
                  <p><strong>{{ selectedFacility()!.name }}</strong></p>
                  @if (selectedFacility()!.address) {
                    <p class="address">{{ selectedFacility()!.address }}</p>
                  }
                  @if (selectedFacility()!.phone) {
                    <p class="phone">{{ selectedFacility()!.phone }}</p>
                  }
                  <div class="facility-badges">
                    @if (selectedFacility()!.supportsEOrders) {
                      <span class="badge success">E-Orders</span>
                    }
                    @if (selectedFacility()!.supportsHL7) {
                      <span class="badge info">HL7</span>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Scheduling -->
            <div class="sidebar-card">
              <h3>Scheduling</h3>
              
              <div class="form-group">
                <label for="scheduledDate">Scheduled Date</label>
                <input
                  type="datetime-local"
                  id="scheduledDate"
                  formControlName="scheduledDate"
                />
              </div>

              <div class="form-group">
                <label for="collectionSite">Collection Site</label>
                <select id="collectionSite" formControlName="collectionSiteId" class="form-select">
                  <option value="">Any available location</option>
                  @for (facility of facilities(); track facility.facilityId) {
                    <option [value]="facility.facilityId">{{ facility.name }}</option>
                  }
                </select>
              </div>
            </div>

            <!-- Order Summary -->
            <div class="sidebar-card order-summary">
              <h3>Order Summary</h3>
              
              <div class="summary-row">
                <span>Tests</span>
                <span>{{ totalTestCount() }}</span>
              </div>
              <div class="summary-row">
                <span>Panels</span>
                <span>{{ selectedPanels().length }}</span>
              </div>
              <div class="summary-row">
                <span>Diagnoses</span>
                <span>{{ selectedDiagnoses().length }}</span>
              </div>
              
              @if (requiresFasting()) {
                <div class="summary-row highlight">
                  <span>Fasting Required</span>
                  <span>{{ fastingHours() }}h</span>
                </div>
              }

              <div class="summary-divider"></div>

              <div class="summary-row total">
                <span>Est. Turnaround</span>
                <span>{{ estimatedTurnaround() }}</span>
              </div>
            </div>

            <!-- Validation Warnings -->
            @if (validationWarnings().length > 0) {
              <div class="sidebar-card warnings">
                <h3>Warnings</h3>
                @for (warning of validationWarnings(); track warning) {
                  <div class="warning-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <span>{{ warning }}</span>
                  </div>
                }
              </div>
            }
          </aside>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .lab-editor-container {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
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

    .header-content h1 {
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

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: white;
      color: #374151;
      border: 1px solid #e5e7eb;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #f9fafb;
      border-color: #d1d5db;
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      cursor: pointer;
    }

    .btn-sm:hover {
      background: #f9fafb;
    }

    /* Grid Layout */
    .editor-grid {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 1.5rem;
    }

    /* Form Sections */
    .form-section {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .form-section h2 {
      margin: 0 0 1rem 0;
      font-size: 1rem;
      font-weight: 600;
      color: #1f2937;
    }

    .section-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.75rem;
    }

    /* Patient Selection */
    .selected-patient {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 8px;
    }

    .patient-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
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

    .avatar.small {
      width: 32px;
      height: 32px;
      font-size: 0.75rem;
    }

    .details {
      display: flex;
      flex-direction: column;
    }

    .details .name {
      font-weight: 500;
      color: #1f2937;
    }

    .details .meta {
      font-size: 0.75rem;
      color: #6b7280;
    }

    /* Search Fields */
    .search-field {
      position: relative;
    }

    .search-field input {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 2.5rem;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 0.875rem;
    }

    .search-field input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      width: 18px;
      height: 18px;
      color: #9ca3af;
    }

    .spinner-small {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      width: 18px;
      height: 18px;
      border: 2px solid #e5e7eb;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: translateY(-50%) rotate(360deg); }
    }

    .search-results,
    .test-results,
    .diagnosis-results {
      margin-top: 0.5rem;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      max-height: 200px;
      overflow-y: auto;
    }

    .result-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.75rem 1rem;
      border: none;
      background: none;
      cursor: pointer;
      text-align: left;
    }

    .result-item:hover {
      background: #f9fafb;
    }

    /* Panel Grid */
    .quick-panels {
      margin-bottom: 1.5rem;
    }

    .panel-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .panel-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 0.75rem;
      border: 1px solid #e5e7eb;
      border-radius: 9999px;
      background: white;
      font-size: 0.8125rem;
      color: #374151;
      cursor: pointer;
      transition: all 0.2s;
    }

    .panel-chip:hover {
      border-color: #3b82f6;
      background: #f0f9ff;
    }

    .panel-chip.selected {
      border-color: #3b82f6;
      background: #3b82f6;
      color: white;
    }

    .panel-chip svg {
      width: 14px;
      height: 14px;
    }

    .fasting-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      background: #fef3c7;
      color: #92400e;
      border-radius: 50%;
      font-size: 0.625rem;
      font-weight: 600;
    }

    .panel-chip.selected .fasting-badge {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }

    /* Test Search & Results */
    .test-search {
      margin-bottom: 1.5rem;
    }

    .test-result {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 0.75rem 1rem;
      border: none;
      border-bottom: 1px solid #e5e7eb;
      background: none;
      cursor: pointer;
      text-align: left;
    }

    .test-result:last-child {
      border-bottom: none;
    }

    .test-result:hover {
      background: #f9fafb;
    }

    .test-result.selected {
      background: #f0f9ff;
    }

    .test-info {
      display: flex;
      flex-direction: column;
    }

    .test-name {
      font-weight: 500;
      color: #1f2937;
    }

    .test-code {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .test-meta {
      display: flex;
      gap: 0.5rem;
    }

    .test-meta .category {
      padding: 0.125rem 0.5rem;
      background: #f3f4f6;
      border-radius: 4px;
      font-size: 0.75rem;
      color: #6b7280;
      text-transform: capitalize;
    }

    .test-meta .fasting-badge {
      width: auto;
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
    }

    .check-icon {
      width: 18px;
      height: 18px;
      color: #3b82f6;
    }

    /* Category Browser */
    .category-browser {
      margin-bottom: 1.5rem;
    }

    .category-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
      margin-bottom: 1rem;
    }

    .category-tab {
      padding: 0.375rem 0.75rem;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      background: white;
      font-size: 0.75rem;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.2s;
    }

    .category-tab:hover {
      border-color: #d1d5db;
      background: #f9fafb;
    }

    .category-tab.active {
      border-color: #3b82f6;
      background: #eff6ff;
      color: #3b82f6;
    }

    .category-tests {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
    }

    .test-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.625rem 0.75rem;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      background: white;
      font-size: 0.8125rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .test-item:hover {
      border-color: #d1d5db;
      background: #f9fafb;
    }

    .test-item.selected {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .test-item svg {
      width: 14px;
      height: 14px;
      color: #3b82f6;
    }

    /* Selected Tests */
    .selected-tests {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    .selected-panel {
      margin-bottom: 0.5rem;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }

    .panel-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: #f9fafb;
      cursor: pointer;
    }

    .panel-header:hover {
      background: #f3f4f6;
    }

    .expand-icon {
      width: 16px;
      height: 16px;
      color: #6b7280;
      transition: transform 0.2s;
    }

    .expand-icon.expanded {
      transform: rotate(180deg);
    }

    .panel-name {
      font-weight: 500;
      color: #1f2937;
    }

    .test-count {
      font-size: 0.75rem;
      color: #6b7280;
      flex: 1;
    }

    .panel-tests {
      padding: 0.75rem 1rem;
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
    }

    .panel-test {
      padding: 0.25rem 0.5rem;
      background: #e5e7eb;
      border-radius: 4px;
      font-size: 0.75rem;
      color: #374151;
    }

    .selected-test {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      background: #f9fafb;
      border-radius: 6px;
      margin-bottom: 0.5rem;
    }

    .selected-test .test-name {
      flex: 1;
    }

    .selected-test .test-code {
      font-size: 0.75rem;
      color: #9ca3af;
    }

    .remove-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border: none;
      background: none;
      cursor: pointer;
      color: #9ca3af;
      transition: color 0.2s;
    }

    .remove-btn:hover {
      color: #ef4444;
    }

    .remove-btn svg {
      width: 14px;
      height: 14px;
    }

    /* Diagnosis */
    .diagnosis-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.75rem 1rem;
      border: none;
      border-bottom: 1px solid #e5e7eb;
      background: none;
      cursor: pointer;
      text-align: left;
    }

    .diagnosis-item:last-child {
      border-bottom: none;
    }

    .diagnosis-item:hover {
      background: #f9fafb;
    }

    .dx-code {
      font-weight: 600;
      color: #3b82f6;
      min-width: 80px;
    }

    .dx-desc {
      color: #374151;
    }

    .selected-diagnoses {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    .diagnosis-chip {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: #f3f4f6;
      border-radius: 6px;
    }

    .diagnosis-chip .dx-code {
      font-size: 0.75rem;
    }

    .diagnosis-chip .dx-desc {
      font-size: 0.8125rem;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Form Groups */
    .form-group {
      margin-bottom: 1rem;
    }

    .form-group:last-child {
      margin-bottom: 0;
    }

    .form-group label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .form-group textarea,
    .form-group input,
    .form-select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 0.875rem;
    }

    .form-group textarea:focus,
    .form-group input:focus,
    .form-select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    /* Sidebar */
    .sidebar {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .sidebar-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 1rem;
    }

    .sidebar-card h3 {
      margin: 0 0 0.75rem 0;
      font-size: 0.75rem;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Priority Options */
    .priority-options {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .priority-option {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .priority-option:hover {
      border-color: #d1d5db;
      background: #f9fafb;
    }

    .priority-option.selected {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .priority-option input {
      display: none;
    }

    .priority-label {
      font-weight: 600;
      font-size: 0.8125rem;
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
    }

    .priority-routine { background: #f3f4f6; color: #6b7280; }
    .priority-urgent { background: #fef3c7; color: #92400e; }
    .priority-asap { background: #fed7aa; color: #9a3412; }
    .priority-stat { background: #fee2e2; color: #991b1b; }

    .priority-desc {
      width: 100%;
      font-size: 0.75rem;
      color: #6b7280;
      margin-top: 0.25rem;
    }

    /* Fasting Alert */
    .fasting-alert {
      display: flex;
      gap: 0.75rem;
      background: #fffbeb;
      border-color: #fde68a;
    }

    .alert-icon {
      flex-shrink: 0;
    }

    .alert-icon svg {
      width: 24px;
      height: 24px;
      color: #d97706;
    }

    .alert-content strong {
      display: block;
      color: #92400e;
      margin-bottom: 0.25rem;
    }

    .alert-content p {
      margin: 0;
      font-size: 0.8125rem;
      color: #b45309;
    }

    /* Facility Details */
    .facility-details {
      margin-top: 0.75rem;
      padding: 0.75rem;
      background: #f9fafb;
      border-radius: 6px;
    }

    .facility-details p {
      margin: 0;
      font-size: 0.8125rem;
      color: #374151;
    }

    .facility-details .address,
    .facility-details .phone {
      color: #6b7280;
      margin-top: 0.25rem;
    }

    .facility-badges {
      display: flex;
      gap: 0.375rem;
      margin-top: 0.5rem;
    }

    .badge {
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .badge.success {
      background: #dcfce7;
      color: #166534;
    }

    .badge.info {
      background: #dbeafe;
      color: #1e40af;
    }

    /* Order Summary */
    .order-summary {
      background: #f9fafb;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      font-size: 0.8125rem;
    }

    .summary-row span:first-child {
      color: #6b7280;
    }

    .summary-row span:last-child {
      font-weight: 500;
      color: #1f2937;
    }

    .summary-row.highlight {
      color: #d97706;
    }

    .summary-row.highlight span:first-child,
    .summary-row.highlight span:last-child {
      color: #d97706;
    }

    .summary-divider {
      height: 1px;
      background: #e5e7eb;
      margin: 0.5rem 0;
    }

    .summary-row.total span {
      font-weight: 600;
    }

    /* Warnings */
    .warnings {
      background: #fffbeb;
      border-color: #fde68a;
    }

    .warnings h3 {
      color: #92400e;
    }

    .warning-item {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 0.5rem 0;
      font-size: 0.8125rem;
      color: #92400e;
    }

    .warning-item svg {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      margin-top: 0.125rem;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .editor-grid {
        grid-template-columns: 1fr;
      }

      .sidebar {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
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

      .category-tests {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class LabEditorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly labService = inject(LabService);

  // Form
  form: FormGroup;

  // State
  saving = signal(false);
  isEditing = signal(false);
  orderId = signal<string | null>(null);

  // Patient search
  patientSearch = '';
  patientSearching = signal(false);
  patientResults = signal<PatientSearchResult[]>([]);
  selectedPatient = signal<PatientSearchResult | null>(null);

  // Test search
  testSearch = '';
  testResults = signal<LabTest[]>([]);
  selectedTests = signal<SelectedTest[]>([]);
  selectedPanels = signal<SelectedPanel[]>([]);
  commonPanels = signal<LabPanel[]>([]);

  // Category browsing
  categories: LabCategory[] = ['chemistry', 'hematology', 'coagulation', 'urinalysis', 'lipid', 'thyroid', 'liver', 'renal'];
  selectedCategory = signal<LabCategory | null>(null);
  categoryTests = signal<LabTest[]>([]);

  // Diagnosis
  diagnosisSearch = '';
  diagnosisResults = signal<DiagnosisCode[]>([]);
  selectedDiagnoses = signal<DiagnosisCode[]>([]);

  // Facilities
  facilities = signal<LabFacility[]>([]);

  // Priority options
  priorities = [
    { value: 'routine', label: 'Routine', description: 'Standard processing, 1-3 days' },
    { value: 'urgent', label: 'Urgent', description: 'Prioritized processing, same day' },
    { value: 'asap', label: 'ASAP', description: 'As soon as possible, 2-4 hours' },
    { value: 'stat', label: 'STAT', description: 'Immediate processing, <1 hour' }
  ];

  // Computed
  selectedFacility = computed(() => {
    const labId = this.form?.get('performingLabId')?.value;
    return this.facilities().find(f => f.facilityId === labId) || null;
  });

  totalTestCount = computed(() => {
    const panelTests = this.selectedPanels().reduce((sum, p) => sum + p.panel.tests.length, 0);
    return panelTests + this.selectedTests().length;
  });

  requiresFasting = computed(() => {
    const panelFasting = this.selectedPanels().some(p => p.panel.fastingRequired);
    const testFasting = this.selectedTests().some(t => t.test.fastingRequired);
    return panelFasting || testFasting;
  });

  fastingHours = computed(() => {
    let maxHours = 0;
    this.selectedPanels().forEach(p => {
      if (p.panel.fastingHours && p.panel.fastingHours > maxHours) {
        maxHours = p.panel.fastingHours;
      }
    });
    this.selectedTests().forEach(t => {
      if (t.test.fastingHours && t.test.fastingHours > maxHours) {
        maxHours = t.test.fastingHours;
      }
    });
    return maxHours || 8;
  });

  estimatedTurnaround = computed(() => {
    let maxDays = 0;
    this.selectedPanels().forEach(p => {
      p.panel.tests.forEach(t => {
        if (t.turnaroundDays && t.turnaroundDays > maxDays) {
          maxDays = t.turnaroundDays;
        }
      });
    });
    this.selectedTests().forEach(t => {
      if (t.test.turnaroundDays && t.test.turnaroundDays > maxDays) {
        maxDays = t.test.turnaroundDays;
      }
    });
    if (maxDays === 0) return '1-2 days';
    if (maxDays === 1) return '1 day';
    return `${maxDays} days`;
  });

  validationWarnings = computed(() => {
    const warnings: string[] = [];
    
    if (!this.selectedPatient()) {
      warnings.push('No patient selected');
    }
    
    if (this.totalTestCount() === 0) {
      warnings.push('No tests selected');
    }

    if (this.selectedDiagnoses().length === 0) {
      warnings.push('No diagnosis codes added');
    }

    const priority = this.form?.get('priority')?.value;
    if (priority === 'stat' && !this.form?.get('performingLabId')?.value) {
      warnings.push('STAT orders should specify a performing lab');
    }

    return warnings;
  });

  constructor() {
    this.form = this.fb.group({
      priority: ['routine', Validators.required],
      performingLabId: [''],
      collectionSiteId: [''],
      scheduledDate: [''],
      clinicalNotes: [''],
      patientInstructions: [''],
      labInstructions: ['']
    });
  }

  ngOnInit(): void {
    // Load facilities
    this.labService.getFacilities().subscribe(facilities => {
      this.facilities.set(facilities);
      // Set default preferred facility
      const preferred = facilities.find(f => f.isPreferred);
      if (preferred) {
        this.form.patchValue({ performingLabId: preferred.facilityId });
      }
    });

    // Load common panels
    this.labService.getCommonPanels().subscribe(panels => {
      this.commonPanels.set(panels);
    });

    // Check for editing mode
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.orderId.set(id);
      this.isEditing.set(true);
      this.loadOrder(id);
    }

    // Check for patient pre-selection
    const patientId = this.route.snapshot.queryParamMap.get('patientId');
    if (patientId) {
      this.loadPatient(patientId);
    }

    // Check for duplication
    const duplicateId = this.route.snapshot.queryParamMap.get('duplicate');
    if (duplicateId) {
      this.duplicateFrom(duplicateId);
    }
  }

  loadOrder(orderId: string): void {
    this.labService.getLabOrder(orderId).subscribe(order => {
      if (order) {
        this.form.patchValue({
          priority: order.priority,
          performingLabId: order.performingLabId || '',
          collectionSiteId: order.collectionSiteId || '',
          scheduledDate: order.scheduledDate || '',
          clinicalNotes: order.clinicalNotes || '',
          patientInstructions: order.patientInstructions || '',
          labInstructions: order.labInstructions || ''
        });

        if (order.patientId) {
          this.loadPatient(order.patientId);
        }

        if (order.diagnosisCodes) {
          this.selectedDiagnoses.set(
            order.diagnosisCodes.map(code => ({ code, description: '' }))
          );
        }

        // Map tests back to selected tests
        const tests = order.tests.map(t => ({
          test: t,
          quantity: 1
        }));
        this.selectedTests.set(tests);
      }
    });
  }

  loadPatient(patientId: string): void {
    this.labService.searchPatients(patientId).subscribe(patients => {
      if (patients.length > 0) {
        const p = patients[0];
        this.selectedPatient.set({
          patientId: p.id,
          name: p.name,
          dob: p.dob,
          mrn: p.mrn
        });
      }
    });
  }

  duplicateFrom(orderId: string): void {
    this.labService.getLabOrder(orderId).subscribe(order => {
      if (order) {
        this.form.patchValue({
          priority: order.priority,
          performingLabId: order.performingLabId || '',
          clinicalNotes: order.clinicalNotes || '',
          patientInstructions: order.patientInstructions || '',
          labInstructions: order.labInstructions || ''
        });

        if (order.patientId) {
          this.loadPatient(order.patientId);
        }

        if (order.diagnosisCodes) {
          this.selectedDiagnoses.set(
            order.diagnosisCodes.map(code => ({ code, description: '' }))
          );
        }

        const tests = order.tests.map(t => ({
          test: t,
          quantity: 1
        }));
        this.selectedTests.set(tests);
      }
    });
  }

  // Patient search
  searchPatients(): void {
    if (this.patientSearch.length < 2) {
      this.patientResults.set([]);
      return;
    }

    this.patientSearching.set(true);
    this.labService.searchPatients(this.patientSearch).subscribe({
      next: (patients) => {
        this.patientResults.set(
          patients.map(p => ({
            patientId: p.id,
            name: p.name,
            dob: p.dob,
            mrn: p.mrn
          }))
        );
        this.patientSearching.set(false);
      },
      error: () => {
        this.patientSearching.set(false);
      }
    });
  }

  selectPatient(patient: PatientSearchResult): void {
    this.selectedPatient.set(patient);
    this.patientSearch = '';
    this.patientResults.set([]);
  }

  clearPatient(): void {
    this.selectedPatient.set(null);
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  // Test search
  searchTests(): void {
    if (this.testSearch.length < 2) {
      this.testResults.set([]);
      return;
    }

    this.labService.searchTests(this.testSearch).subscribe(tests => {
      this.testResults.set(tests);
    });
  }

  toggleTest(test: LabTest): void {
    if (this.isTestSelected(test.testCode)) {
      this.selectedTests.update(tests => 
        tests.filter(t => t.test.testCode !== test.testCode)
      );
    } else {
      this.selectedTests.update(tests => [
        ...tests,
        { test, quantity: 1 }
      ]);
    }
  }

  isTestSelected(testCode: string): boolean {
    return this.selectedTests().some(t => t.test.testCode === testCode);
  }

  removeTest(item: SelectedTest): void {
    this.selectedTests.update(tests => 
      tests.filter(t => t.test.testCode !== item.test.testCode)
    );
  }

  // Panel selection
  togglePanel(panel: LabPanel): void {
    if (this.isPanelSelected(panel.panelCode)) {
      this.selectedPanels.update(panels => 
        panels.filter(p => p.panel.panelCode !== panel.panelCode)
      );
    } else {
      this.selectedPanels.update(panels => [
        ...panels,
        { panel, expanded: false }
      ]);
    }
  }

  isPanelSelected(panelCode: string): boolean {
    return this.selectedPanels().some(p => p.panel.panelCode === panelCode);
  }

  togglePanelExpand(panel: SelectedPanel): void {
    this.selectedPanels.update(panels =>
      panels.map(p =>
        p.panel.panelCode === panel.panel.panelCode
          ? { ...p, expanded: !p.expanded }
          : p
      )
    );
  }

  removePanel(panel: SelectedPanel, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedPanels.update(panels =>
      panels.filter(p => p.panel.panelCode !== panel.panel.panelCode)
    );
  }

  // Category browsing
  selectCategory(category: LabCategory): void {
    this.selectedCategory.set(category);
    this.labService.getTestsByCategory(category).subscribe(tests => {
      this.categoryTests.set(tests);
    });
  }

  formatCategory(category: string): string {
    return category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ');
  }

  // Diagnosis search
  searchDiagnosis(): void {
    if (this.diagnosisSearch.length < 2) {
      this.diagnosisResults.set([]);
      return;
    }

    // Mock ICD-10 search
    const mockResults: DiagnosisCode[] = [
      { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
      { code: 'E11.65', description: 'Type 2 diabetes mellitus with hyperglycemia' },
      { code: 'E78.5', description: 'Hyperlipidemia, unspecified' },
      { code: 'I10', description: 'Essential (primary) hypertension' },
      { code: 'E03.9', description: 'Hypothyroidism, unspecified' },
      { code: 'D64.9', description: 'Anemia, unspecified' },
      { code: 'R73.09', description: 'Other abnormal glucose' },
      { code: 'Z00.00', description: 'Encounter for general adult medical examination' }
    ];

    const term = this.diagnosisSearch.toLowerCase();
    const filtered = mockResults.filter(dx =>
      dx.code.toLowerCase().includes(term) ||
      dx.description.toLowerCase().includes(term)
    );
    this.diagnosisResults.set(filtered);
  }

  addDiagnosis(dx: DiagnosisCode): void {
    if (!this.selectedDiagnoses().some(d => d.code === dx.code)) {
      this.selectedDiagnoses.update(diagnoses => [...diagnoses, dx]);
    }
    this.diagnosisSearch = '';
    this.diagnosisResults.set([]);
  }

  removeDiagnosis(dx: DiagnosisCode): void {
    this.selectedDiagnoses.update(diagnoses =>
      diagnoses.filter(d => d.code !== dx.code)
    );
  }

  // Form submission
  onSubmit(): void {
    if (!this.form.valid || !this.selectedPatient() || this.totalTestCount() === 0) {
      return;
    }

    this.saving.set(true);

    const orderData: Partial<LabOrder> = {
      patientId: this.selectedPatient()!.patientId,
      patientName: this.selectedPatient()!.name,
      priority: this.form.get('priority')?.value,
      performingLabId: this.form.get('performingLabId')?.value || undefined,
      performingLabName: this.selectedFacility()?.name,
      collectionSiteId: this.form.get('collectionSiteId')?.value || undefined,
      scheduledDate: this.form.get('scheduledDate')?.value || undefined,
      clinicalNotes: this.form.get('clinicalNotes')?.value || undefined,
      patientInstructions: this.form.get('patientInstructions')?.value || undefined,
      labInstructions: this.form.get('labInstructions')?.value || undefined,
      diagnosisCodes: this.selectedDiagnoses().map(d => d.code),
      tests: this.getOrderedTests(),
      fastingRequired: this.requiresFasting(),
      fastingHours: this.fastingHours()
    };

    const saveObs = this.isEditing()
      ? this.labService.updateLabOrder(this.orderId()!, orderData)
      : this.labService.createLabOrder(orderData);

    saveObs.subscribe({
      next: (order) => {
        // Submit the order after creation
        this.labService.submitLabOrder(order.orderId).subscribe({
          next: () => {
            this.saving.set(false);
            this.router.navigate(['/labs', order.orderId]);
          },
          error: (err) => {
            console.error('Failed to submit order:', err);
            this.saving.set(false);
          }
        });
      },
      error: (err) => {
        console.error('Failed to save order:', err);
        this.saving.set(false);
      }
    });
  }

  saveDraft(): void {
    if (!this.selectedPatient()) {
      alert('Please select a patient');
      return;
    }

    this.saving.set(true);

    const orderData: Partial<LabOrder> = {
      patientId: this.selectedPatient()!.patientId,
      patientName: this.selectedPatient()!.name,
      priority: this.form.get('priority')?.value,
      performingLabId: this.form.get('performingLabId')?.value || undefined,
      clinicalNotes: this.form.get('clinicalNotes')?.value || undefined,
      diagnosisCodes: this.selectedDiagnoses().map(d => d.code),
      tests: this.getOrderedTests(),
      fastingRequired: this.requiresFasting(),
      fastingHours: this.fastingHours()
    };

    const saveObs = this.isEditing()
      ? this.labService.updateLabOrder(this.orderId()!, orderData)
      : this.labService.createLabOrder(orderData);

    saveObs.subscribe({
      next: (order) => {
        this.saving.set(false);
        this.router.navigate(['/labs', order.orderId]);
      },
      error: (err) => {
        console.error('Failed to save draft:', err);
        this.saving.set(false);
      }
    });
  }

  getOrderedTests(): LabTest[] {
    const tests: LabTest[] = [];
    
    // Add panel tests
    this.selectedPanels().forEach(p => {
      p.panel.tests.forEach(test => {
        if (!tests.some(t => t.testCode === test.testCode)) {
          tests.push(test);
        }
      });
    });

    // Add individual tests
    this.selectedTests().forEach(item => {
      if (!tests.some(t => t.testCode === item.test.testCode)) {
        tests.push(item.test);
      }
    });

    return tests;
  }

  goBack(): void {
    this.router.navigate(['/labs']);
  }
}
