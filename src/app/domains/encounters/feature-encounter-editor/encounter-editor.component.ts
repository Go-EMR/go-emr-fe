import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';

import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { AvatarComponent } from '../../../shared/ui/avatar/avatar.component';
import { EncounterService } from '../data-access/services/encounter.service';
import { 
  Encounter, 
  VitalSigns,
  EncounterTemplate,
  COMMON_DIAGNOSES,
  ENCOUNTER_CLASS_CONFIG
} from '../data-access/models/encounter.model';

@Component({
  selector: 'app-encounter-editor',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatTabsModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatDividerModule,
    MatMenuModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    PageHeaderComponent,
    AvatarComponent,
  ],
  template: `
    <div class="encounter-editor-container">
      <app-page-header
        [title]="isEditMode() ? 'Edit Encounter' : 'New Encounter'"
        [subtitle]="encounter()?.patient?.name || 'Document clinical visit'"
        icon="edit_note"
        [breadcrumbs]="breadcrumbs()"
        [showDivider]="false"
      >
        <div class="header-actions" actions>
          <button mat-stroked-button (click)="cancel()">
            Cancel
          </button>
          <button mat-stroked-button (click)="saveDraft()" [disabled]="saving()">
            <mat-icon>save</mat-icon>
            Save Draft
          </button>
          <button 
            mat-flat-button 
            color="primary" 
            [matMenuTriggerFor]="saveMenu"
            [disabled]="saving()"
          >
            @if (saving()) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              <mat-icon>check</mat-icon>
              Save
            }
          </button>
          <mat-menu #saveMenu="matMenu">
            <button mat-menu-item (click)="saveAndContinue()">
              <mat-icon>save</mat-icon>
              Save & Continue Editing
            </button>
            <button mat-menu-item (click)="saveAndClose()">
              <mat-icon>done</mat-icon>
              Save & Close
            </button>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="saveAndSign()">
              <mat-icon>verified</mat-icon>
              Save & Sign
            </button>
          </mat-menu>
        </div>
      </app-page-header>

      <!-- Templates Selection -->
      @if (!isEditMode()) {
        <mat-card class="templates-card">
          <mat-card-content>
            <div class="templates-header">
              <h3>Quick Start with Template</h3>
              <button mat-button color="primary" (click)="loadTemplates()">
                <mat-icon>refresh</mat-icon>
                Refresh
              </button>
            </div>
            <div class="templates-list">
              @for (template of templates(); track template.id) {
                <button 
                  mat-stroked-button 
                  class="template-btn"
                  (click)="applyTemplate(template)"
                  [matTooltip]="template.description || ''"
                >
                  <mat-icon>description</mat-icon>
                  {{ template.name }}
                </button>
              }
            </div>
          </mat-card-content>
        </mat-card>
      }

      <!-- Patient Info Bar -->
      @if (encounter(); as enc) {
        <div class="patient-bar">
          <div class="patient-info">
            <app-avatar [name]="enc.patient.name" [imageUrl]="enc.patient.photo ?? ''" size="md"></app-avatar>
            <div class="patient-details">
              <h3>{{ enc.patient.name }}</h3>
              <span>MRN: {{ enc.patient.mrn }} • DOB: {{ enc.patient.dob }}</span>
            </div>
          </div>
          <div class="encounter-meta">
            <mat-chip>
              <mat-icon>{{ getClassIcon(enc.class) }}</mat-icon>
              {{ getClassLabel(enc.class) }}
            </mat-chip>
            <span class="time">{{ enc.startTime | date:'MMM d, yyyy h:mm a' }}</span>
          </div>
        </div>
      }

      <!-- Main Editor -->
      <div class="editor-content">
        <mat-tab-group [(selectedIndex)]="selectedTab" animationDuration="200ms">
          <!-- Vitals Tab -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>monitor_heart</mat-icon>
              Vitals
            </ng-template>
            <div class="tab-content">
              <mat-card>
                <mat-card-content>
                  <form [formGroup]="vitalsForm">
                    <div class="vitals-grid">
                      <div class="vital-group">
                        <h4>Blood Pressure</h4>
                        <div class="bp-fields">
                          <mat-form-field appearance="outline">
                            <mat-label>Systolic</mat-label>
                            <input matInput type="number" formControlName="bloodPressureSystolic">
                            <span matSuffix>mmHg</span>
                          </mat-form-field>
                          <span class="bp-separator">/</span>
                          <mat-form-field appearance="outline">
                            <mat-label>Diastolic</mat-label>
                            <input matInput type="number" formControlName="bloodPressureDiastolic">
                            <span matSuffix>mmHg</span>
                          </mat-form-field>
                        </div>
                        <mat-form-field appearance="outline" class="full-width">
                          <mat-label>Position</mat-label>
                          <mat-select formControlName="bloodPressurePosition">
                            <mat-option value="sitting">Sitting</mat-option>
                            <mat-option value="standing">Standing</mat-option>
                            <mat-option value="supine">Supine</mat-option>
                          </mat-select>
                        </mat-form-field>
                      </div>

                      <div class="vital-group">
                        <h4>Heart Rate</h4>
                        <mat-form-field appearance="outline">
                          <mat-label>Pulse</mat-label>
                          <input matInput type="number" formControlName="pulseRate">
                          <span matSuffix>bpm</span>
                        </mat-form-field>
                        <mat-form-field appearance="outline">
                          <mat-label>Rhythm</mat-label>
                          <mat-select formControlName="pulseRhythm">
                            <mat-option value="regular">Regular</mat-option>
                            <mat-option value="irregular">Irregular</mat-option>
                          </mat-select>
                        </mat-form-field>
                      </div>

                      <div class="vital-group">
                        <h4>Respiratory</h4>
                        <mat-form-field appearance="outline">
                          <mat-label>Rate</mat-label>
                          <input matInput type="number" formControlName="respiratoryRate">
                          <span matSuffix>/min</span>
                        </mat-form-field>
                        <mat-form-field appearance="outline">
                          <mat-label>SpO2</mat-label>
                          <input matInput type="number" formControlName="oxygenSaturation">
                          <span matSuffix>%</span>
                        </mat-form-field>
                      </div>

                      <div class="vital-group">
                        <h4>Temperature</h4>
                        <mat-form-field appearance="outline">
                          <mat-label>Temp</mat-label>
                          <input matInput type="number" step="0.1" formControlName="temperatureCelsius">
                          <span matSuffix>°C</span>
                        </mat-form-field>
                        <mat-form-field appearance="outline">
                          <mat-label>Location</mat-label>
                          <mat-select formControlName="temperatureLocation">
                            <mat-option value="oral">Oral</mat-option>
                            <mat-option value="tympanic">Tympanic</mat-option>
                            <mat-option value="temporal">Temporal</mat-option>
                            <mat-option value="axillary">Axillary</mat-option>
                            <mat-option value="rectal">Rectal</mat-option>
                          </mat-select>
                        </mat-form-field>
                      </div>

                      <div class="vital-group">
                        <h4>Measurements</h4>
                        <mat-form-field appearance="outline">
                          <mat-label>Height</mat-label>
                          <input matInput type="number" step="0.1" formControlName="heightCm">
                          <span matSuffix>cm</span>
                        </mat-form-field>
                        <mat-form-field appearance="outline">
                          <mat-label>Weight</mat-label>
                          <input matInput type="number" step="0.1" formControlName="weightKg">
                          <span matSuffix>kg</span>
                        </mat-form-field>
                        <div class="bmi-display">
                          <span>BMI: {{ calculateBMI() | number:'1.1-1' }}</span>
                        </div>
                      </div>

                      <div class="vital-group">
                        <h4>Pain</h4>
                        <mat-form-field appearance="outline">
                          <mat-label>Pain Level (0-10)</mat-label>
                          <input matInput type="number" min="0" max="10" formControlName="painLevel">
                        </mat-form-field>
                        <mat-form-field appearance="outline" class="full-width">
                          <mat-label>Pain Location</mat-label>
                          <input matInput formControlName="painLocation">
                        </mat-form-field>
                      </div>
                    </div>
                  </form>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Subjective Tab -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>record_voice_over</mat-icon>
              Subjective
            </ng-template>
            <div class="tab-content">
              <mat-card>
                <mat-card-content>
                  <form [formGroup]="subjectiveForm">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Chief Complaint</mat-label>
                      <input matInput formControlName="chiefComplaint" placeholder="Patient's primary concern">
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>History of Present Illness</mat-label>
                      <textarea 
                        matInput 
                        formControlName="historyOfPresentIllness" 
                        rows="6"
                        placeholder="Describe the onset, duration, character, location, and associated symptoms..."
                      ></textarea>
                    </mat-form-field>

                    <mat-expansion-panel class="ros-panel">
                      <mat-expansion-panel-header>
                        <mat-panel-title>Review of Systems</mat-panel-title>
                      </mat-expansion-panel-header>
                      <div formGroupName="reviewOfSystems" class="ros-grid">
                        @for (system of rosSystems; track system.key) {
                          <mat-form-field appearance="outline">
                            <mat-label>{{ system.label }}</mat-label>
                            <input matInput [formControlName]="system.key">
                          </mat-form-field>
                        }
                      </div>
                    </mat-expansion-panel>

                    <div class="row-fields">
                      <mat-form-field appearance="outline" class="flex-1">
                        <mat-label>Current Medications</mat-label>
                        <textarea matInput formControlName="medications" rows="3"></textarea>
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="flex-1">
                        <mat-label>Allergies</mat-label>
                        <textarea matInput formControlName="allergies" rows="3"></textarea>
                      </mat-form-field>
                    </div>

                    <div class="row-fields">
                      <mat-form-field appearance="outline" class="flex-1">
                        <mat-label>Social History</mat-label>
                        <textarea matInput formControlName="socialHistory" rows="3"></textarea>
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="flex-1">
                        <mat-label>Family History</mat-label>
                        <textarea matInput formControlName="familyHistory" rows="3"></textarea>
                      </mat-form-field>
                    </div>
                  </form>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Objective Tab -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>visibility</mat-icon>
              Objective
            </ng-template>
            <div class="tab-content">
              <mat-card>
                <mat-card-content>
                  <form [formGroup]="objectiveForm">
                    <mat-expansion-panel expanded class="exam-panel">
                      <mat-expansion-panel-header>
                        <mat-panel-title>Physical Examination</mat-panel-title>
                      </mat-expansion-panel-header>
                      <div formGroupName="physicalExam" class="exam-grid">
                        @for (exam of examSystems; track exam.key) {
                          <mat-form-field appearance="outline">
                            <mat-label>{{ exam.label }}</mat-label>
                            <textarea matInput [formControlName]="exam.key" rows="2"></textarea>
                          </mat-form-field>
                        }
                      </div>
                    </mat-expansion-panel>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Lab Results</mat-label>
                      <textarea matInput formControlName="labResults" rows="3" placeholder="Reference any relevant lab findings"></textarea>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Imaging Results</mat-label>
                      <textarea matInput formControlName="imagingResults" rows="3" placeholder="Reference any relevant imaging findings"></textarea>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Other Findings</mat-label>
                      <textarea matInput formControlName="otherFindings" rows="2"></textarea>
                    </mat-form-field>
                  </form>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Assessment Tab -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>assessment</mat-icon>
              Assessment
            </ng-template>
            <div class="tab-content">
              <mat-card>
                <mat-card-content>
                  <form [formGroup]="assessmentForm">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Clinical Impression</mat-label>
                      <textarea 
                        matInput 
                        formControlName="clinicalImpression" 
                        rows="4"
                        placeholder="Summary of clinical findings and interpretation..."
                      ></textarea>
                    </mat-form-field>

                    <div class="diagnoses-section">
                      <div class="section-header">
                        <h4>Diagnoses</h4>
                        <button mat-stroked-button (click)="addDiagnosis()">
                          <mat-icon>add</mat-icon>
                          Add Diagnosis
                        </button>
                      </div>

                      <div class="diagnoses-list" formArrayName="diagnoses">
                        @for (dx of diagnoses.controls; track $index; let i = $index) {
                          <div class="diagnosis-row" [formGroupName]="i">
                            <mat-form-field appearance="outline" class="code-field">
                              <mat-label>ICD-10</mat-label>
                              <input 
                                matInput 
                                formControlName="code"
                                [matAutocomplete]="dxAuto"
                              >
                              <mat-autocomplete #dxAuto="matAutocomplete" (optionSelected)="onDiagnosisSelected($event, i)">
                                @for (dx of filteredDiagnoses(); track dx.code) {
                                  <mat-option [value]="dx.code">
                                    <span class="dx-code">{{ dx.code }}</span>
                                    <span class="dx-desc">{{ dx.description }}</span>
                                  </mat-option>
                                }
                              </mat-autocomplete>
                            </mat-form-field>

                            <mat-form-field appearance="outline" class="description-field">
                              <mat-label>Description</mat-label>
                              <input matInput formControlName="description">
                            </mat-form-field>

                            <mat-form-field appearance="outline" class="type-field">
                              <mat-label>Type</mat-label>
                              <mat-select formControlName="type">
                                <mat-option value="primary">Primary</mat-option>
                                <mat-option value="secondary">Secondary</mat-option>
                                <mat-option value="billing">Billing</mat-option>
                              </mat-select>
                            </mat-form-field>

                            <button mat-icon-button color="warn" (click)="removeDiagnosis(i)">
                              <mat-icon>delete</mat-icon>
                            </button>
                          </div>
                        }
                      </div>

                      @if (diagnoses.length === 0) {
                        <div class="no-diagnoses">
                          <p>No diagnoses added. Click "Add Diagnosis" to begin.</p>
                          <div class="quick-add">
                            <span>Quick add:</span>
                            @for (dx of commonDiagnoses.slice(0, 5); track dx.code) {
                              <button mat-stroked-button (click)="quickAddDiagnosis(dx)">
                                {{ dx.code }}
                              </button>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  </form>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Plan Tab -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>playlist_add_check</mat-icon>
              Plan
            </ng-template>
            <div class="tab-content">
              <mat-card>
                <mat-card-content>
                  <form [formGroup]="planForm">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Treatment Plan</mat-label>
                      <textarea 
                        matInput 
                        formControlName="treatmentPlan" 
                        rows="5"
                        placeholder="Describe the plan of care..."
                      ></textarea>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Patient Education</mat-label>
                      <textarea 
                        matInput 
                        formControlName="patientEducation" 
                        rows="3"
                        placeholder="Topics discussed with patient..."
                      ></textarea>
                    </mat-form-field>

                    <div class="row-fields">
                      <mat-form-field appearance="outline" class="flex-1">
                        <mat-label>Follow-up Timing</mat-label>
                        <input matInput formControlName="followUpTiming" placeholder="e.g., 2 weeks, PRN">
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="flex-1">
                        <mat-label>Follow-up Reason</mat-label>
                        <input matInput formControlName="followUpReason">
                      </mat-form-field>
                    </div>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Additional Instructions</mat-label>
                      <textarea matInput formControlName="additionalInstructions" rows="3"></textarea>
                    </mat-form-field>
                  </form>
                </mat-card-content>
              </mat-card>

              <!-- Quick Actions -->
              <mat-card class="quick-actions-card">
                <mat-card-header>
                  <mat-card-title>Quick Actions</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="quick-actions">
                    <button mat-stroked-button routerLink="/prescriptions/new">
                      <mat-icon>medication</mat-icon>
                      New Prescription
                    </button>
                    <button mat-stroked-button routerLink="/labs/new">
                      <mat-icon>science</mat-icon>
                      Order Labs
                    </button>
                    <button mat-stroked-button>
                      <mat-icon>image</mat-icon>
                      Order Imaging
                    </button>
                    <button mat-stroked-button>
                      <mat-icon>send</mat-icon>
                      Create Referral
                    </button>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `,
  styles: [`
    .encounter-editor-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .templates-card {
      margin-bottom: 24px;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    }

    .templates-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      h3 {
        margin: 0;
        font-size: 1rem;
        color: #0369a1;
      }
    }

    .templates-list {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .template-btn {
      mat-icon {
        margin-right: 4px;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .patient-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: #f8fafc;
      border-radius: 12px;
      margin-bottom: 24px;
    }

    .patient-info {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .patient-details {
      h3 {
        margin: 0;
        font-size: 1.1rem;
      }

      span {
        font-size: 0.85rem;
        color: #6b7280;
      }
    }

    .encounter-meta {
      display: flex;
      align-items: center;
      gap: 16px;

      mat-chip {
        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
          margin-right: 4px;
        }
      }

      .time {
        font-size: 0.9rem;
        color: #6b7280;
      }
    }

    .editor-content {
      mat-tab-group {
        ::ng-deep .mat-mdc-tab-labels {
          background: white;
          border-radius: 8px 8px 0 0;
        }
      }
    }

    .tab-content {
      padding: 24px 0;
    }

    mat-card {
      margin-bottom: 16px;
    }

    .full-width {
      width: 100%;
    }

    .row-fields {
      display: flex;
      gap: 16px;

      .flex-1 {
        flex: 1;
      }
    }

    .vitals-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
    }

    .vital-group {
      background: #f9fafb;
      padding: 16px;
      border-radius: 8px;

      h4 {
        margin: 0 0 16px;
        font-size: 0.9rem;
        font-weight: 600;
        color: #374151;
      }
    }

    .bp-fields {
      display: flex;
      align-items: center;
      gap: 8px;

      mat-form-field {
        flex: 1;
      }
    }

    .bp-separator {
      font-size: 1.5rem;
      color: #6b7280;
      margin-bottom: 20px;
    }

    .bmi-display {
      text-align: center;
      padding: 12px;
      background: #fff;
      border-radius: 4px;
      font-weight: 500;
      color: #374151;
    }

    .ros-panel, .exam-panel {
      margin: 16px 0;
    }

    .ros-grid, .exam-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      padding: 16px 0;
    }

    .diagnoses-section {
      margin-top: 24px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      h4 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
      }
    }

    .diagnoses-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .diagnosis-row {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      padding: 12px;
      background: #f9fafb;
      border-radius: 8px;
    }

    .code-field {
      width: 150px;
    }

    .description-field {
      flex: 1;
    }

    .type-field {
      width: 140px;
    }

    .dx-code {
      font-family: monospace;
      font-weight: 600;
      margin-right: 8px;
      color: #3b82f6;
    }

    .dx-desc {
      font-size: 0.9rem;
    }

    .no-diagnoses {
      text-align: center;
      padding: 24px;
      background: #f9fafb;
      border-radius: 8px;

      p {
        color: #6b7280;
        margin-bottom: 16px;
      }
    }

    .quick-add {
      display: flex;
      gap: 8px;
      justify-content: center;
      align-items: center;
      flex-wrap: wrap;

      span {
        font-size: 0.85rem;
        color: #6b7280;
      }

      button {
        font-size: 0.8rem;
      }
    }

    .quick-actions-card {
      background: #f9fafb;
    }

    .quick-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;

      button {
        mat-icon {
          margin-right: 4px;
        }
      }
    }

    @media (max-width: 768px) {
      .encounter-editor-container {
        padding: 16px;
      }

      .patient-bar {
        flex-direction: column;
        gap: 12px;
        align-items: flex-start;
      }

      .row-fields {
        flex-direction: column;
      }

      .diagnosis-row {
        flex-direction: column;

        .code-field,
        .type-field {
          width: 100%;
        }
      }

      .vitals-grid {
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
  private readonly snackBar = inject(MatSnackBar);

  encounter = signal<Encounter | null>(null);
  templates = signal<EncounterTemplate[]>([]);
  loading = signal(true);
  saving = signal(false);
  selectedTab = 0;

  isEditMode = computed(() => !!this.route.snapshot.paramMap.get('id'));

  breadcrumbs = computed(() => [
    { label: 'Home', route: '/' },
    { label: 'Encounters', route: '/encounters' },
    { label: this.isEditMode() ? 'Edit' : 'New' },
  ]);

  // Forms
  vitalsForm!: FormGroup;
  subjectiveForm!: FormGroup;
  objectiveForm!: FormGroup;
  assessmentForm!: FormGroup;
  planForm!: FormGroup;

  commonDiagnoses = COMMON_DIAGNOSES;
  filteredDiagnoses = signal(COMMON_DIAGNOSES);

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
    { key: 'heart', label: 'Heart' },
    { key: 'lungs', label: 'Lungs' },
    { key: 'abdomen', label: 'Abdomen' },
    { key: 'extremities', label: 'Extremities' },
    { key: 'skin', label: 'Skin' },
    { key: 'neurological', label: 'Neurological' },
  ];

  ngOnInit(): void {
    this.initForms();
    this.loadTemplates();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadEncounter(id);
    } else {
      this.loading.set(false);
    }
  }

  initForms(): void {
    this.vitalsForm = this.fb.group({
      bloodPressureSystolic: [null],
      bloodPressureDiastolic: [null],
      bloodPressurePosition: ['sitting'],
      pulseRate: [null],
      pulseRhythm: ['regular'],
      respiratoryRate: [null],
      oxygenSaturation: [null],
      temperatureCelsius: [null],
      temperatureLocation: ['oral'],
      heightCm: [null],
      weightKg: [null],
      painLevel: [null],
      painLocation: [''],
    });

    this.subjectiveForm = this.fb.group({
      chiefComplaint: ['', Validators.required],
      historyOfPresentIllness: [''],
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
      medications: [''],
      allergies: [''],
      socialHistory: [''],
      familyHistory: [''],
    });

    this.objectiveForm = this.fb.group({
      physicalExam: this.fb.group({
        general: [''],
        head: [''],
        eyes: [''],
        ears: [''],
        throat: [''],
        neck: [''],
        heart: [''],
        lungs: [''],
        abdomen: [''],
        extremities: [''],
        skin: [''],
        neurological: [''],
      }),
      labResults: [''],
      imagingResults: [''],
      otherFindings: [''],
    });

    this.assessmentForm = this.fb.group({
      clinicalImpression: [''],
      diagnoses: this.fb.array([]),
    });

    this.planForm = this.fb.group({
      treatmentPlan: [''],
      patientEducation: [''],
      followUpTiming: [''],
      followUpReason: [''],
      additionalInstructions: [''],
    });
  }

  get diagnoses(): FormArray {
    return this.assessmentForm.get('diagnoses') as FormArray;
  }

  loadEncounter(id: string): void {
    this.loading.set(true);
    this.encounterService.getEncounter(id).subscribe({
      next: (encounter) => {
        this.encounter.set(encounter);
        this.populateForms(encounter);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load encounter', 'Close', { duration: 3000 });
        this.router.navigate(['/encounters']);
      },
    });
  }

  loadTemplates(): void {
    this.encounterService.getTemplates().subscribe({
      next: (templates) => this.templates.set(templates),
    });
  }

  populateForms(enc: Encounter): void {
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
      template.assessment.diagnoses?.forEach((dx) => {
        this.diagnoses.push(this.fb.group({
          id: [dx.id],
          code: [dx.code],
          codeSystem: [dx.codeSystem || 'ICD-10'],
          description: [dx.description],
          type: [dx.type],
          status: [dx.status || 'active'],
        }));
      });
    }
    if (template.plan) {
      this.planForm.patchValue({
        treatmentPlan: template.plan.treatmentPlan,
        followUpTiming: template.plan.followUp?.timing,
        followUpReason: template.plan.followUp?.reason,
      });
    }
    this.snackBar.open(`Template "${template.name}" applied`, 'Close', { duration: 2000 });
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

  onDiagnosisSelected(event: any, index: number): void {
    const code = event.option.value;
    const dx = COMMON_DIAGNOSES.find((d) => d.code === code);
    if (dx) {
      this.diagnoses.at(index).patchValue({
        code: dx.code,
        description: dx.description,
      });
    }
  }

  getClassIcon(cls: string): string {
    return ENCOUNTER_CLASS_CONFIG[cls as keyof typeof ENCOUNTER_CLASS_CONFIG]?.icon || 'medical_services';
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
                this.snackBar.open('Encounter saved and signed', 'Close', { duration: 3000 });
                if (close) {
                  this.router.navigate(['/encounters', updated.id]);
                }
              },
              error: () => {
                this.saving.set(false);
                this.snackBar.open('Saved but failed to sign', 'Close', { duration: 3000 });
              },
            });
          } else {
            this.saving.set(false);
            this.snackBar.open('Encounter saved', 'Close', { duration: 3000 });
            if (close) {
              this.router.navigate(['/encounters', updated.id]);
            } else {
              this.encounter.set(updated);
            }
          }
        },
        error: () => {
          this.saving.set(false);
          this.snackBar.open('Failed to save encounter', 'Close', { duration: 3000 });
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
