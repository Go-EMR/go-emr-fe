import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';

// PrimeNG Imports
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { InputNumber } from 'primeng/inputnumber';
import { Select } from 'primeng/select';
import { Checkbox } from 'primeng/checkbox';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { Accordion, AccordionTab } from 'primeng/accordion';
import { AutoComplete, AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { Chip } from 'primeng/chip';
import { Divider } from 'primeng/divider';
import { Menu } from 'primeng/menu';
import { Toast } from 'primeng/toast';
import { Tooltip } from 'primeng/tooltip';
import { Avatar } from 'primeng/avatar';
import { Tag } from 'primeng/tag';
import { Skeleton } from 'primeng/skeleton';
import { MessageService, MenuItem } from 'primeng/api';

import { EncounterService } from '../data-access/services/encounter.service';
import { ThemeService } from '../../../core/services/theme.service';
import {
  Encounter,
  EncounterTemplate,
  COMMON_DIAGNOSES,
  ENCOUNTER_CLASS_CONFIG
} from '../data-access/models/encounter.model';

interface DiagnosisSuggestion {
  code: string;
  description: string;
}

@Component({
  selector: 'app-encounter-editor',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    // PrimeNG
    Card,
    Button,
    InputText,
    Textarea,
    InputNumber,
    Select,
    Checkbox,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    Accordion,
    AccordionTab,
    AutoComplete,
    Chip,
    Divider,
    Menu,
    Toast,
    Tooltip,
    Avatar,
    Tag,
    Skeleton,
  ],
  providers: [MessageService],
  template: `
    <div class="encounter-editor" [class.dark]="themeService.isDarkMode()">
      <p-toast />

      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="breadcrumb">
            <a routerLink="/encounters" class="breadcrumb-link">
              <i class="pi pi-file-edit"></i>
              Encounters
            </a>
            <i class="pi pi-chevron-right"></i>
            <span>{{ isEditMode() ? 'Edit' : 'New' }}</span>
          </div>
          <div class="title-section">
            <h1>{{ isEditMode() ? 'Edit Encounter' : 'New Encounter' }}</h1>
            <p class="subtitle">{{ encounter()?.patient?.name || 'Document clinical visit' }}</p>
          </div>
        </div>
        <div class="header-actions">
          <p-button
            label="Cancel"
            [outlined]="true"
            severity="secondary"
            (onClick)="cancel()"
          />
          <p-button
            label="Save Draft"
            icon="pi pi-save"
            [outlined]="true"
            [loading]="saving()"
            (onClick)="saveDraft()"
          />
          <p-button
            label="Save"
            icon="pi pi-check"
            [loading]="saving()"
            (onClick)="saveMenu.toggle($event)"
          />
          <p-menu #saveMenu [model]="saveMenuItems" [popup]="true" />
        </div>
      </header>

      <!-- Templates (New Mode Only) -->
      @if (!isEditMode()) {
        <section class="templates-section">
          <p-card styleClass="templates-card">
            <div class="templates-header">
              <h3>
                <i class="pi pi-file"></i>
                Quick Start with Template
              </h3>
              <p-button
                label="Refresh"
                icon="pi pi-refresh"
                [text]="true"
                (onClick)="loadTemplates()"
              />
            </div>
            <div class="templates-grid">
              @for (template of templates(); track template.id) {
                <div
                  class="template-item"
                  (click)="applyTemplate(template)"
                  [pTooltip]="template.description || ''"
                  tooltipPosition="top">
                  <i class="pi pi-file-edit"></i>
                  <span>{{ template.name }}</span>
                </div>
              }
            </div>
          </p-card>
        </section>
      }

      <!-- Patient Bar -->
      @if (encounter(); as enc) {
        <section class="patient-bar">
          <div class="patient-info">
            <p-avatar
              [label]="getInitials(enc.patient.name)"
              [image]="enc.patient.photo || ''"
              [style]="{ 'background-color': '#3b82f6', 'color': 'white' }"
              size="large"
              shape="circle"
            />
            <div class="patient-details">
              <h3>{{ enc.patient.name }}</h3>
              <span>MRN: {{ enc.patient.mrn }} • DOB: {{ enc.patient.dob }}</span>
            </div>
          </div>
          <div class="encounter-meta">
            <p-chip
              [label]="getClassLabel(enc.class)"
              [icon]="'pi ' + getClassIcon(enc.class)"
              styleClass="class-chip"
            />
            <span class="time">{{ enc.startTime | date:'MMM d, yyyy h:mm a' }}</span>
          </div>
        </section>
      }

      <!-- Editor Tabs -->
      <section class="editor-section">
        <p-tabs [(value)]="selectedTab" class="editor-tabs">
          <p-tablist>
            <p-tab value="0">
              <i class="pi pi-heart"></i>
              <span>Vitals</span>
            </p-tab>
            <p-tab value="1">
              <i class="pi pi-comments"></i>
              <span>Subjective</span>
            </p-tab>
            <p-tab value="2">
              <i class="pi pi-search"></i>
              <span>Objective</span>
            </p-tab>
            <p-tab value="3">
              <i class="pi pi-check-square"></i>
              <span>Assessment</span>
            </p-tab>
            <p-tab value="4">
              <i class="pi pi-list"></i>
              <span>Plan</span>
            </p-tab>
          </p-tablist>
          <p-tabpanels>
            <!-- Vitals Panel -->
            <p-tabpanel value="0">
              <div class="tab-content">
                <form [formGroup]="vitalsForm">
                  <div class="vitals-grid">
                    <!-- Blood Pressure -->
                    <div class="vital-group">
                      <h4>Blood Pressure</h4>
                      <div class="bp-row">
                        <div class="field">
                          <label>Systolic</label>
                          <p-inputNumber
                            formControlName="bloodPressureSystolic"
                            [showButtons]="false"
                            suffix=" mmHg"
                            styleClass="w-full"
                          />
                        </div>
                        <span class="bp-sep">/</span>
                        <div class="field">
                          <label>Diastolic</label>
                          <p-inputNumber
                            formControlName="bloodPressureDiastolic"
                            [showButtons]="false"
                            suffix=" mmHg"
                            styleClass="w-full"
                          />
                        </div>
                      </div>
                      <div class="field">
                        <label>Position</label>
                        <p-select
                          formControlName="bloodPressurePosition"
                          [options]="positionOptions"
                          placeholder="Select position"
                          styleClass="w-full"
                        />
                      </div>
                    </div>

                    <!-- Heart Rate -->
                    <div class="vital-group">
                      <h4>Heart Rate</h4>
                      <div class="field">
                        <label>Pulse</label>
                        <p-inputNumber
                          formControlName="pulseRate"
                          [showButtons]="false"
                          suffix=" bpm"
                          styleClass="w-full"
                        />
                      </div>
                      <div class="field">
                        <label>Rhythm</label>
                        <p-select
                          formControlName="pulseRhythm"
                          [options]="rhythmOptions"
                          placeholder="Select rhythm"
                          styleClass="w-full"
                        />
                      </div>
                    </div>

                    <!-- Respiratory -->
                    <div class="vital-group">
                      <h4>Respiratory</h4>
                      <div class="field">
                        <label>Rate</label>
                        <p-inputNumber
                          formControlName="respiratoryRate"
                          [showButtons]="false"
                          suffix=" /min"
                          styleClass="w-full"
                        />
                      </div>
                      <div class="field">
                        <label>SpO2</label>
                        <p-inputNumber
                          formControlName="oxygenSaturation"
                          [showButtons]="false"
                          suffix=" %"
                          styleClass="w-full"
                        />
                      </div>
                    </div>

                    <!-- Temperature -->
                    <div class="vital-group">
                      <h4>Temperature</h4>
                      <div class="field">
                        <label>Temperature</label>
                        <p-inputNumber
                          formControlName="temperatureCelsius"
                          [showButtons]="false"
                          suffix=" °C"
                          [minFractionDigits]="1"
                          styleClass="w-full"
                        />
                      </div>
                      <div class="field">
                        <label>Location</label>
                        <p-select
                          formControlName="temperatureLocation"
                          [options]="tempLocationOptions"
                          placeholder="Select location"
                          styleClass="w-full"
                        />
                      </div>
                    </div>

                    <!-- Measurements -->
                    <div class="vital-group">
                      <h4>Measurements</h4>
                      <div class="field">
                        <label>Height</label>
                        <p-inputNumber
                          formControlName="heightCm"
                          [showButtons]="false"
                          suffix=" cm"
                          styleClass="w-full"
                        />
                      </div>
                      <div class="field">
                        <label>Weight</label>
                        <p-inputNumber
                          formControlName="weightKg"
                          [showButtons]="false"
                          suffix=" kg"
                          [minFractionDigits]="1"
                          styleClass="w-full"
                        />
                      </div>
                      @if (calculateBMI()) {
                        <div class="bmi-display">
                          <span class="bmi-label">BMI:</span>
                          <span class="bmi-value">{{ calculateBMI() | number:'1.1-1' }}</span>
                        </div>
                      }
                    </div>

                    <!-- Pain -->
                    <div class="vital-group">
                      <h4>Pain</h4>
                      <div class="field">
                        <label>Pain Level (0-10)</label>
                        <p-inputNumber
                          formControlName="painLevel"
                          [showButtons]="true"
                          [min]="0"
                          [max]="10"
                          styleClass="w-full"
                        />
                      </div>
                      <div class="field">
                        <label>Location</label>
                        <input
                          pInputText
                          formControlName="painLocation"
                          placeholder="e.g., Lower back"
                          class="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </p-tabpanel>

            <!-- Subjective Panel -->
            <p-tabpanel value="1">
              <div class="tab-content">
                <form [formGroup]="subjectiveForm">
                  <div class="field">
                    <label>Chief Complaint *</label>
                    <textarea
                      pTextarea
                      formControlName="chiefComplaint"
                      [rows]="2"
                      placeholder="Patient's primary reason for visit..."
                      class="w-full"
                    ></textarea>
                  </div>

                  <div class="field">
                    <label>History of Present Illness</label>
                    <textarea
                      pTextarea
                      formControlName="historyOfPresentIllness"
                      [rows]="4"
                      placeholder="Detailed description of the current illness..."
                      class="w-full"
                    ></textarea>
                  </div>

                  <p-accordion [multiple]="true">
                    <p-accordionTab header="Review of Systems">
                      <div class="ros-grid" formGroupName="reviewOfSystems">
                        @for (system of rosSystems; track system.key) {
                          <div class="field">
                            <label>{{ system.label }}</label>
                            <input
                              pInputText
                              [formControlName]="system.key"
                              placeholder="Findings..."
                              class="w-full"
                            />
                          </div>
                        }
                      </div>
                    </p-accordionTab>

                    <p-accordionTab header="Additional History">
                      <div class="field">
                        <label>Social History</label>
                        <textarea
                          pTextarea
                          formControlName="socialHistory"
                          [rows]="2"
                          class="w-full"
                        ></textarea>
                      </div>
                      <div class="field">
                        <label>Family History</label>
                        <textarea
                          pTextarea
                          formControlName="familyHistory"
                          [rows]="2"
                          class="w-full"
                        ></textarea>
                      </div>
                    </p-accordionTab>
                  </p-accordion>
                </form>
              </div>
            </p-tabpanel>

            <!-- Objective Panel -->
            <p-tabpanel value="2">
              <div class="tab-content">
                <form [formGroup]="objectiveForm">
                  <h4>Physical Examination</h4>
                  <div class="exam-grid" formGroupName="physicalExam">
                    @for (system of examSystems; track system.key) {
                      <div class="field">
                        <label>{{ system.label }}</label>
                        <textarea
                          pTextarea
                          [formControlName]="system.key"
                          [rows]="2"
                          placeholder="Findings..."
                          class="w-full"
                        ></textarea>
                      </div>
                    }
                  </div>

                  <p-divider />

                  <div class="field">
                    <label>Lab Results</label>
                    <textarea
                      pTextarea
                      formControlName="labResults"
                      [rows]="3"
                      placeholder="Relevant laboratory findings..."
                      class="w-full"
                    ></textarea>
                  </div>

                  <div class="field">
                    <label>Imaging Results</label>
                    <textarea
                      pTextarea
                      formControlName="imagingResults"
                      [rows]="3"
                      placeholder="Relevant imaging findings..."
                      class="w-full"
                    ></textarea>
                  </div>
                </form>
              </div>
            </p-tabpanel>

            <!-- Assessment Panel -->
            <p-tabpanel value="3">
              <div class="tab-content">
                <form [formGroup]="assessmentForm">
                  <div class="field">
                    <label>Clinical Impression</label>
                    <textarea
                      pTextarea
                      formControlName="clinicalImpression"
                      [rows]="4"
                      placeholder="Summary of clinical findings and reasoning..."
                      class="w-full"
                    ></textarea>
                  </div>

                  <p-divider />

                  <div class="diagnoses-section">
                    <div class="section-header">
                      <h4>Diagnoses</h4>
                      <p-button
                        label="Add Diagnosis"
                        icon="pi pi-plus"
                        [outlined]="true"
                        size="small"
                        (onClick)="addDiagnosis()"
                      />
                    </div>

                    <!-- Quick Add -->
                    <div class="quick-add">
                      <span class="quick-label">Quick Add:</span>
                      <div class="quick-chips">
                        @for (dx of commonDiagnoses.slice(0, 5); track dx.code) {
                          <p-chip
                            [label]="dx.description"
                            [pTooltip]="dx.code"
                            tooltipPosition="top"
                            (click)="quickAddDiagnosis(dx)"
                            styleClass="quick-chip"
                          />
                        }
                      </div>
                    </div>

                    <!-- Diagnosis List -->
                    <div class="diagnoses-list" formArrayName="diagnoses">
                      @for (dx of diagnoses.controls; track $index; let i = $index) {
                        <div class="diagnosis-item" [formGroupName]="i">
                          <div class="dx-fields">
                            <div class="field code-field">
                              <label>ICD-10 Code</label>
                              <p-autoComplete
                                formControlName="code"
                                [suggestions]="filteredDiagnoses"
                                (completeMethod)="searchDiagnoses($event)"
                                (onSelect)="onDiagnosisSelected($event, i)"
                                field="code"
                                placeholder="Search code..."
                                styleClass="w-full">
                                <ng-template let-dx pTemplate="item">
                                  <div class="dx-suggestion">
                                    <span class="dx-code">{{ dx.code }}</span>
                                    <span class="dx-desc">{{ dx.description }}</span>
                                  </div>
                                </ng-template>
                              </p-autoComplete>
                            </div>
                            <div class="field desc-field">
                              <label>Description</label>
                              <input
                                pInputText
                                formControlName="description"
                                class="w-full"
                              />
                            </div>
                            <div class="field type-field">
                              <label>Type</label>
                              <p-select
                                formControlName="type"
                                [options]="diagnosisTypes"
                                styleClass="w-full"
                              />
                            </div>
                          </div>
                          <p-button
                            icon="pi pi-trash"
                            [rounded]="true"
                            [text]="true"
                            severity="danger"
                            (onClick)="removeDiagnosis(i)"
                          />
                        </div>
                      }
                    </div>
                  </div>
                </form>
              </div>
            </p-tabpanel>

            <!-- Plan Panel -->
            <p-tabpanel value="4">
              <div class="tab-content">
                <form [formGroup]="planForm">
                  <div class="field">
                    <label>Treatment Plan *</label>
                    <textarea
                      pTextarea
                      formControlName="treatmentPlan"
                      [rows]="4"
                      placeholder="Detailed treatment plan..."
                      class="w-full"
                    ></textarea>
                  </div>

                  <div class="field">
                    <label>Patient Education</label>
                    <textarea
                      pTextarea
                      formControlName="patientEducation"
                      [rows]="3"
                      placeholder="Patient education and instructions provided..."
                      class="w-full"
                    ></textarea>
                  </div>

                  <p-divider />

                  <h4>Follow-up</h4>
                  <div class="followup-row">
                    <div class="field">
                      <label>Timing</label>
                      <input
                        pInputText
                        formControlName="followUpTiming"
                        placeholder="e.g., 2 weeks, 1 month"
                        class="w-full"
                      />
                    </div>
                    <div class="field">
                      <label>Reason</label>
                      <input
                        pInputText
                        formControlName="followUpReason"
                        placeholder="e.g., Recheck blood pressure"
                        class="w-full"
                      />
                    </div>
                  </div>

                  <div class="field">
                    <label>Additional Instructions</label>
                    <textarea
                      pTextarea
                      formControlName="additionalInstructions"
                      [rows]="3"
                      placeholder="Any additional notes or instructions..."
                      class="w-full"
                    ></textarea>
                  </div>
                </form>
              </div>
            </p-tabpanel>
          </p-tabpanels>
        </p-tabs>
      </section>

      <!-- Mobile Bottom Actions -->
      <div class="bottom-actions">
        <p-button
          label="Cancel"
          [outlined]="true"
          severity="secondary"
          (onClick)="cancel()"
          styleClass="w-full"
        />
        <p-button
          label="Save"
          [loading]="saving()"
          (onClick)="saveAndClose()"
          styleClass="w-full"
        />
      </div>
    </div>
  `,
  styles: [`
    .encounter-editor {
      padding: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    /* Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }

    .breadcrumb-link {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      color: #3b82f6;
      text-decoration: none;
    }

    .breadcrumb-link:hover {
      text-decoration: underline;
    }

    .breadcrumb .pi-chevron-right {
      color: #94a3b8;
      font-size: 0.75rem;
    }

    .breadcrumb span {
      color: #64748b;
    }

    .dark .breadcrumb span {
      color: #94a3b8;
    }

    .title-section h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }

    .dark .title-section h1 {
      color: #f1f5f9;
    }

    .subtitle {
      color: #64748b;
      margin: 0.25rem 0 0;
    }

    .dark .subtitle {
      color: #94a3b8;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    /* Templates */
    .templates-section {
      margin-bottom: 1.5rem;
    }

    :host ::ng-deep .templates-card {
      border-radius: 1rem;
    }

    .dark :host ::ng-deep .templates-card {
      background: #1e293b;
      border-color: #334155;
    }

    .templates-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .templates-header h3 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0;
      font-size: 1rem;
      color: #374151;
    }

    .dark .templates-header h3 {
      color: #e2e8f0;
    }

    .templates-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .template-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.875rem;
      color: #374151;
    }

    .dark .template-item {
      background: #334155;
      border-color: #475569;
      color: #e2e8f0;
    }

    .template-item:hover {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .dark .template-item:hover {
      background: #1e3a8a;
    }

    /* Patient Bar */
    .patient-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      background: white;
      border-radius: 1rem;
      border: 1px solid #e2e8f0;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .dark .patient-bar {
      background: #1e293b;
      border-color: #334155;
    }

    .patient-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .patient-details h3 {
      margin: 0 0 0.25rem;
      font-size: 1.0625rem;
      font-weight: 600;
      color: #1e293b;
    }

    .dark .patient-details h3 {
      color: #f1f5f9;
    }

    .patient-details span {
      font-size: 0.8125rem;
      color: #64748b;
    }

    .dark .patient-details span {
      color: #94a3b8;
    }

    .encounter-meta {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    :host ::ng-deep .class-chip {
      background: #f1f5f9;
    }

    .dark :host ::ng-deep .class-chip {
      background: #334155;
      color: #e2e8f0;
    }

    .time {
      font-size: 0.875rem;
      color: #64748b;
    }

    .dark .time {
      color: #94a3b8;
    }

    /* Editor Section */
    .editor-section {
      background: white;
      border-radius: 1rem;
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }

    .dark .editor-section {
      background: #1e293b;
      border-color: #334155;
    }

    /* PrimeNG v19 Tabs Styling */
    :host ::ng-deep .editor-tabs {
      width: 100%;
    }

    :host ::ng-deep .editor-tabs .p-tablist {
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      padding: 0 1rem;
    }

    .dark :host ::ng-deep .editor-tabs .p-tablist {
      background: #0f172a;
      border-bottom-color: #334155;
    }

    :host ::ng-deep .editor-tabs .p-tab {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1rem;
      border: none;
      background: transparent;
      color: #64748b;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
    }

    :host ::ng-deep .editor-tabs .p-tab:hover {
      color: #3b82f6;
      border-bottom-color: #93c5fd;
    }

    :host ::ng-deep .editor-tabs .p-tab[data-p-active="true"],
    :host ::ng-deep .editor-tabs .p-tab.p-tab-active {
      color: #3b82f6;
      border-bottom-color: #3b82f6;
      background: transparent;
    }

    .dark :host ::ng-deep .editor-tabs .p-tab {
      color: #94a3b8;
    }

    .dark :host ::ng-deep .editor-tabs .p-tab:hover {
      color: #60a5fa;
      border-bottom-color: #3b82f6;
    }

    .dark :host ::ng-deep .editor-tabs .p-tab[data-p-active="true"],
    .dark :host ::ng-deep .editor-tabs .p-tab.p-tab-active {
      color: #60a5fa;
      border-bottom-color: #60a5fa;
    }

    :host ::ng-deep .editor-tabs .p-tab i {
      font-size: 1rem;
    }

    :host ::ng-deep .editor-tabs .p-tabpanels {
      padding: 0;
      background: transparent;
    }

    :host ::ng-deep .editor-tabs .p-tabpanel {
      padding: 0;
    }

    .tab-content {
      padding: 1.5rem;
      overflow-x: auto;
    }

    /* Form Fields */
    .field {
      margin-bottom: 1rem;
      min-width: 0;
    }

    .field label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .dark .field label {
      color: #e2e8f0;
    }

    .w-full {
      width: 100%;
      max-width: 100%;
    }

    :host ::ng-deep .w-full .p-inputnumber,
    :host ::ng-deep .w-full .p-select,
    :host ::ng-deep .w-full .p-inputtext,
    :host ::ng-deep .w-full .p-autocomplete {
      width: 100%;
      max-width: 100%;
    }

    :host ::ng-deep .p-inputnumber,
    :host ::ng-deep .p-select {
      width: 100%;
    }

    /* Vitals Grid */
    .vitals-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }

    @media (max-width: 1200px) {
      .vitals-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .vitals-grid {
        grid-template-columns: 1fr;
      }
    }

    .vital-group {
      padding: 1rem;
      background: #f8fafc;
      border-radius: 0.75rem;
      min-width: 0;
    }

    .dark .vital-group {
      background: #334155;
    }

    .vital-group h4 {
      margin: 0 0 1rem;
      font-size: 0.9375rem;
      font-weight: 600;
      color: #374151;
    }

    .dark .vital-group h4 {
      color: #e2e8f0;
    }

    .bp-row {
      display: flex;
      align-items: flex-end;
      gap: 0.5rem;
    }

    .bp-sep {
      font-size: 1.5rem;
      color: #64748b;
      padding-bottom: 0.75rem;
    }

    .bmi-display {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
      background: #dbeafe;
      border-radius: 0.5rem;
      margin-top: 0.5rem;
    }

    .dark .bmi-display {
      background: #1e3a8a;
    }

    .bmi-label {
      font-size: 0.875rem;
      color: #1e40af;
    }

    .dark .bmi-label {
      color: #93c5fd;
    }

    .bmi-value {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e40af;
    }

    .dark .bmi-value {
      color: #93c5fd;
    }

    /* ROS Grid */
    .ros-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }

    /* Exam Grid */
    .exam-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }

    /* Diagnoses */
    .diagnoses-section {
      margin-top: 1rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .section-header h4 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #374151;
    }

    .dark .section-header h4 {
      color: #e2e8f0;
    }

    .quick-add {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .quick-label {
      font-size: 0.8125rem;
      color: #64748b;
    }

    .quick-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    :host ::ng-deep .quick-chip {
      cursor: pointer;
      font-size: 0.75rem;
    }

    :host ::ng-deep .quick-chip:hover {
      background: #dbeafe;
    }

    .dark :host ::ng-deep .quick-chip:hover {
      background: #1e3a8a;
    }

    .diagnoses-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .diagnosis-item {
      display: flex;
      align-items: flex-end;
      gap: 0.75rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 0.75rem;
    }

    .dark .diagnosis-item {
      background: #334155;
    }

    .dx-fields {
      flex: 1;
      display: grid;
      grid-template-columns: 150px 1fr 120px;
      gap: 0.75rem;
    }

    .dx-suggestion {
      display: flex;
      gap: 0.75rem;
    }

    .dx-suggestion .dx-code {
      font-family: monospace;
      color: #3b82f6;
    }

    .dx-suggestion .dx-desc {
      color: #374151;
    }

    .dark .dx-suggestion .dx-desc {
      color: #e2e8f0;
    }

    /* Follow-up Row */
    .followup-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    /* Bottom Actions */
    .bottom-actions {
      display: none;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 1rem;
      background: white;
      border-top: 1px solid #e2e8f0;
      gap: 0.75rem;
      z-index: 100;
    }

    .dark .bottom-actions {
      background: #1e293b;
      border-top-color: #334155;
    }

    /* Dark mode inputs */
    .dark :host ::ng-deep .p-inputtext,
    .dark :host ::ng-deep textarea.p-textarea,
    .dark :host ::ng-deep .p-inputnumber-input {
      background: #334155;
      border-color: #475569;
      color: #f1f5f9;
    }

    .dark :host ::ng-deep .p-select {
      background: #334155;
      border-color: #475569;
    }

    .dark :host ::ng-deep .p-select-label {
      color: #f1f5f9;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .exam-grid {
        grid-template-columns: 1fr;
      }

      .dx-fields {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .encounter-editor {
        padding: 1rem;
        padding-bottom: 100px;
      }

      .page-header {
        flex-direction: column;
        align-items: stretch;
      }

      .header-actions {
        display: none;
      }

      .bottom-actions {
        display: flex;
      }

      .patient-bar {
        flex-direction: column;
        align-items: flex-start;
      }

      .followup-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class EncounterEditorComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly encounterService = inject(EncounterService);
  private readonly messageService = inject(MessageService);
  readonly themeService = inject(ThemeService);

  // Forms
  vitalsForm: FormGroup;
  subjectiveForm: FormGroup;
  objectiveForm: FormGroup;
  assessmentForm: FormGroup;
  planForm: FormGroup;

  // Signals
  isEditMode = signal(false);
  encounter = signal<Encounter | null>(null);
  templates = signal<EncounterTemplate[]>([]);
  loading = signal(false);
  saving = signal(false);

  selectedTab = '0';
  commonDiagnoses = COMMON_DIAGNOSES;
  filteredDiagnoses: DiagnosisSuggestion[] = [];

  // Options
  positionOptions = [
    { label: 'Sitting', value: 'sitting' },
    { label: 'Standing', value: 'standing' },
    { label: 'Supine', value: 'supine' },
  ];

  rhythmOptions = [
    { label: 'Regular', value: 'regular' },
    { label: 'Irregular', value: 'irregular' },
  ];

  tempLocationOptions = [
    { label: 'Oral', value: 'oral' },
    { label: 'Rectal', value: 'rectal' },
    { label: 'Axillary', value: 'axillary' },
    { label: 'Tympanic', value: 'tympanic' },
    { label: 'Temporal', value: 'temporal' },
  ];

  diagnosisTypes = [
    { label: 'Primary', value: 'primary' },
    { label: 'Secondary', value: 'secondary' },
    { label: 'Billing', value: 'billing' },
  ];

  rosSystems = [
    { key: 'constitutional', label: 'Constitutional' },
    { key: 'eyes', label: 'Eyes' },
    { key: 'entMouth', label: 'ENT/Mouth' },
    { key: 'cardiovascular', label: 'Cardiovascular' },
    { key: 'respiratory', label: 'Respiratory' },
    { key: 'gastrointestinal', label: 'Gastrointestinal' },
    { key: 'genitourinary', label: 'Genitourinary' },
    { key: 'musculoskeletal', label: 'Musculoskeletal' },
    { key: 'neurological', label: 'Neurological' },
    { key: 'psychiatric', label: 'Psychiatric' },
  ];

  examSystems = [
    { key: 'general', label: 'General' },
    { key: 'head', label: 'Head' },
    { key: 'eyes', label: 'Eyes' },
    { key: 'ears', label: 'Ears' },
    { key: 'throat', label: 'Throat' },
    { key: 'neck', label: 'Neck' },
    { key: 'chest', label: 'Chest/Heart/Lungs' },
    { key: 'abdomen', label: 'Abdomen' },
    { key: 'extremities', label: 'Extremities' },
    { key: 'neurological', label: 'Neurological' },
    { key: 'skin', label: 'Skin' },
  ];

  saveMenuItems: MenuItem[] = [
    { label: 'Save & Continue', icon: 'pi pi-save', command: () => this.saveAndContinue() },
    { label: 'Save & Close', icon: 'pi pi-check', command: () => this.saveAndClose() },
    { separator: true },
    { label: 'Save & Sign', icon: 'pi pi-verified', command: () => this.saveAndSign() },
  ];

  breadcrumbs = computed(() => [
    { label: 'Encounters', route: '/encounters' },
    { label: this.isEditMode() ? 'Edit' : 'New' },
  ]);

  get diagnoses(): FormArray {
    return this.assessmentForm.get('diagnoses') as FormArray;
  }

  constructor() {
    // Initialize forms
    this.vitalsForm = this.fb.group({
      bloodPressureSystolic: [null],
      bloodPressureDiastolic: [null],
      bloodPressurePosition: [null],
      pulseRate: [null],
      pulseRhythm: [null],
      respiratoryRate: [null],
      oxygenSaturation: [null],
      temperatureCelsius: [null],
      temperatureLocation: [null],
      heightCm: [null],
      weightKg: [null],
      painLevel: [null],
      painLocation: [''],
    });

    this.subjectiveForm = this.fb.group({
      chiefComplaint: ['', Validators.required],
      historyOfPresentIllness: [''],
      socialHistory: [''],
      familyHistory: [''],
      reviewOfSystems: this.fb.group({
        constitutional: [''],
        eyes: [''],
        entMouth: [''],
        cardiovascular: [''],
        respiratory: [''],
        gastrointestinal: [''],
        genitourinary: [''],
        musculoskeletal: [''],
        neurological: [''],
        psychiatric: [''],
      }),
    });

    this.objectiveForm = this.fb.group({
      physicalExam: this.fb.group({
        general: [''],
        head: [''],
        eyes: [''],
        ears: [''],
        throat: [''],
        neck: [''],
        chest: [''],
        abdomen: [''],
        extremities: [''],
        neurological: [''],
        skin: [''],
      }),
      labResults: [''],
      imagingResults: [''],
    });

    this.assessmentForm = this.fb.group({
      clinicalImpression: [''],
      diagnoses: this.fb.array([]),
    });

    this.planForm = this.fb.group({
      treatmentPlan: ['', Validators.required],
      patientEducation: [''],
      followUpTiming: [''],
      followUpReason: [''],
      additionalInstructions: [''],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.loadEncounter(id);
    } else {
      this.loadTemplates();
    }
  }

  private loadEncounter(id: string): void {
    this.loading.set(true);
    this.encounterService.getEncounter(id).subscribe({
      next: (encounter) => {
        this.encounter.set(encounter);
        this.populateForms(encounter);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load encounter'
        });
        this.router.navigate(['/encounters']);
      },
    });
  }

  loadTemplates(): void {
    this.encounterService.getTemplates().subscribe({
      next: (templates) => this.templates.set(templates),
    });
  }

  private populateForms(enc: Encounter): void {
    if (enc.vitalSigns) {
      this.vitalsForm.patchValue(enc.vitalSigns);
    }
    if (enc.subjective) {
      this.subjectiveForm.patchValue(enc.subjective);
    }
    if (enc.objective) {
      this.objectiveForm.patchValue(enc.objective);
    }
    if (enc.assessment) {
      this.assessmentForm.patchValue({ clinicalImpression: enc.assessment.clinicalImpression });
      enc.assessment.diagnoses?.forEach((dx) => {
        this.diagnoses.push(this.fb.group({
          id: [dx.id],
          code: [dx.code],
          codeSystem: [dx.codeSystem],
          description: [dx.description],
          type: [dx.type],
          status: [dx.status],
        }));
      });
    }
    if (enc.plan) {
      this.planForm.patchValue({
        treatmentPlan: enc.plan.treatmentPlan,
        patientEducation: enc.plan.patientEducation,
        followUpTiming: enc.plan.followUp?.timing,
        followUpReason: enc.plan.followUp?.reason,
        additionalInstructions: enc.plan.additionalInstructions,
      });
    }
  }

  applyTemplate(template: EncounterTemplate): void {
    if (template.subjective) {
      this.subjectiveForm.patchValue(template.subjective);
    }
    if (template.objective) {
      this.objectiveForm.patchValue(template.objective);
    }
    if (template.assessment) {
      this.assessmentForm.patchValue({ clinicalImpression: template.assessment.clinicalImpression });
    }
    if (template.plan) {
      this.planForm.patchValue({
        treatmentPlan: template.plan.treatmentPlan,
        followUpTiming: template.plan.followUp?.timing,
        followUpReason: template.plan.followUp?.reason,
      });
    }
    this.messageService.add({
      severity: 'success',
      summary: 'Template Applied',
      detail: `"${template.name}" has been applied`
    });
  }

  calculateBMI(): number | null {
    const height = this.vitalsForm.get('heightCm')?.value;
    const weight = this.vitalsForm.get('weightKg')?.value;
    if (height && weight) {
      const heightM = height / 100;
      return weight / (heightM * heightM);
    }
    return null;
  }

  addDiagnosis(): void {
    this.diagnoses.push(this.fb.group({
      id: [`dx-${Date.now()}`],
      code: ['', Validators.required],
      codeSystem: ['ICD-10'],
      description: ['', Validators.required],
      type: ['primary'],
      status: ['active'],
    }));
  }

  removeDiagnosis(index: number): void {
    this.diagnoses.removeAt(index);
  }

  quickAddDiagnosis(dx: { code: string; description: string }): void {
    this.diagnoses.push(this.fb.group({
      id: [`dx-${Date.now()}`],
      code: [dx.code],
      codeSystem: ['ICD-10'],
      description: [dx.description],
      type: [this.diagnoses.length === 0 ? 'primary' : 'secondary'],
      status: ['active'],
    }));
  }

  searchDiagnoses(event: AutoCompleteCompleteEvent): void {
    const query = event.query.toLowerCase();
    this.filteredDiagnoses = COMMON_DIAGNOSES.filter(dx =>
      dx.code.toLowerCase().includes(query) ||
      dx.description.toLowerCase().includes(query)
    );
  }

  onDiagnosisSelected(event: any, index: number): void {
    const dx = event.value;
    if (dx) {
      this.diagnoses.at(index).patchValue({
        code: dx.code,
        description: dx.description,
      });
    }
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getClassIcon(cls: string): string {
    const icons: Record<string, string> = {
      'ambulatory': 'pi-briefcase',
      'emergency': 'pi-exclamation-triangle',
      'inpatient': 'pi-building',
      'observation': 'pi-eye',
      'virtual': 'pi-video',
      'home': 'pi-home',
    };
    return icons[cls] || 'pi-file-edit';
  }

  getClassLabel(cls: string): string {
    return ENCOUNTER_CLASS_CONFIG[cls as keyof typeof ENCOUNTER_CLASS_CONFIG]?.label || cls;
  }

  private collectFormData(): any {
    return {
      vitalSigns: this.vitalsForm.value,
      subjective: this.subjectiveForm.value,
      objective: this.objectiveForm.value,
      assessment: {
        clinicalImpression: this.assessmentForm.get('clinicalImpression')?.value,
        diagnoses: this.diagnoses.value,
      },
      plan: {
        treatmentPlan: this.planForm.get('treatmentPlan')?.value,
        patientEducation: this.planForm.get('patientEducation')?.value,
        followUp: {
          timing: this.planForm.get('followUpTiming')?.value,
          reason: this.planForm.get('followUpReason')?.value,
        },
        additionalInstructions: this.planForm.get('additionalInstructions')?.value,
      },
    };
  }

  saveDraft(): void {
    this.save(false, false);
  }

  saveAndContinue(): void {
    this.save(false, false);
  }

  saveAndClose(): void {
    this.save(false, true);
  }

  saveAndSign(): void {
    this.save(true, true);
  }

  private save(sign: boolean, close: boolean): void {
    this.saving.set(true);
    const data = this.collectFormData();
    const enc = this.encounter();

    if (enc) {
      this.encounterService.updateEncounter(enc.id, data).subscribe({
        next: (updated) => {
          if (sign) {
            this.encounterService.signEncounter(updated.id).subscribe({
              next: () => {
                this.saving.set(false);
                this.messageService.add({
                  severity: 'success',
                  summary: 'Success',
                  detail: 'Encounter saved and signed'
                });
                if (close) {
                  this.router.navigate(['/encounters', updated.id]);
                }
              },
              error: () => {
                this.saving.set(false);
                this.messageService.add({
                  severity: 'warn',
                  summary: 'Warning',
                  detail: 'Saved but failed to sign'
                });
              },
            });
          } else {
            this.saving.set(false);
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Encounter saved'
            });
            if (close) {
              this.router.navigate(['/encounters', updated.id]);
            } else {
              this.encounter.set(updated);
            }
          }
        },
        error: () => {
          this.saving.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to save encounter'
          });
        },
      });
    }
  }

  cancel(): void {
    const enc = this.encounter();
    if (enc) {
      this.router.navigate(['/encounters', enc.id]);
    } else {
      this.router.navigate(['/encounters']);
    }
  }
}
