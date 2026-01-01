import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge.component';
import { AvatarComponent } from '../../../shared/ui/avatar/avatar.component';
import { ConfirmDialogComponent } from '../../../shared/ui/confirm-dialog/confirm-dialog.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { EncounterService } from '../data-access/services/encounter.service';
import { 
  Encounter, 
  ENCOUNTER_STATUS_CONFIG,
  ENCOUNTER_CLASS_CONFIG 
} from '../data-access/models/encounter.model';

@Component({
  selector: 'app-encounter-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatMenuModule,
    MatDividerModule,
    MatChipsModule,
    MatDialogModule,
    MatTooltipModule,
    MatSnackBarModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    AvatarComponent,
    SkeletonComponent,
  ],
  template: `
    <div class="encounter-detail-container">
      @if (loading()) {
        <div class="loading-state">
          <app-skeleton type="title"></app-skeleton>
          <app-skeleton type="text"></app-skeleton>
          <app-skeleton type="card"></app-skeleton>
        </div>
      } @else if (enc()) {
        <app-page-header
          [title]="'Encounter with ' + enc()!.patient.name"
          [subtitle]="getEncounterSubtitle(enc()!)"
          icon="description"
          [breadcrumbs]="breadcrumbs"
          [showDivider]="false"
        >
          <div class="header-actions" actions>
            @if (!enc()!.signedAt) {
              <button mat-stroked-button [routerLink]="['/encounters', enc()!.id, 'edit']">
                <mat-icon>edit</mat-icon>
                Edit
              </button>
            }
            
            <button mat-flat-button color="primary" [matMenuTriggerFor]="actionsMenu">
              <mat-icon>more_vert</mat-icon>
              Actions
            </button>

            <mat-menu #actionsMenu="matMenu">
              @if (!enc()!.signedAt && enc()!.status !== 'cancelled') {
                <button mat-menu-item (click)="signEncounter()">
                  <mat-icon>verified</mat-icon>
                  <span>Sign & Complete</span>
                </button>
              }
              <button mat-menu-item (click)="printEncounter()">
                <mat-icon>print</mat-icon>
                <span>Print</span>
              </button>
              <button mat-menu-item>
                <mat-icon>share</mat-icon>
                <span>Share</span>
              </button>
              <mat-divider></mat-divider>
              @if (enc()!.status !== 'cancelled' && enc()!.status !== 'finished') {
                <button mat-menu-item (click)="cancelEncounter()" class="danger-item">
                  <mat-icon>cancel</mat-icon>
                  <span>Cancel Encounter</span>
                </button>
              }
            </mat-menu>
          </div>
        </app-page-header>

        <!-- Status & Info Bar -->
        <div class="info-bar">
          <div class="status-section">
            <app-status-badge
              [label]="getStatusConfig(enc()!.status).label"
              [variant]="getStatusVariant(enc()!.status)"
              [icon]="getStatusConfig(enc()!.status).icon"
            ></app-status-badge>
            <mat-chip>
              <mat-icon>{{ getClassConfig(enc()!.class).icon }}</mat-icon>
              {{ getClassConfig(enc()!.class).label }}
            </mat-chip>
            @if (enc()!.signedAt) {
              <span class="signed-info">
                <mat-icon>verified</mat-icon>
                Signed by {{ enc()!.signedBy }} on {{ enc()!.signedAt | date:'MMM d, yyyy h:mm a' }}
              </span>
            }
          </div>

          <div class="timing-section">
            <span class="timing-item">
              <mat-icon>calendar_today</mat-icon>
              {{ enc()!.startTime | date:'EEEE, MMMM d, yyyy' }}
            </span>
            <span class="timing-item">
              <mat-icon>schedule</mat-icon>
              {{ enc()!.startTime | date:'h:mm a' }}
              @if (enc()!.endTime) {
                - {{ enc()!.endTime | date:'h:mm a' }}
                ({{ enc()!.duration }} min)
              }
            </span>
          </div>
        </div>

        <!-- Main Content -->
        <div class="content-grid">
          <!-- Left Column - Clinical Notes -->
          <div class="clinical-notes">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Clinical Documentation</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <mat-tab-group>
                  <!-- Vitals Tab -->
                  <mat-tab label="Vitals">
                    <div class="tab-content">
                      @if (enc()!.vitalSigns) {
                        <div class="vitals-grid">
                          @if (enc()?.vitalSigns?.bloodPressureSystolic) {
                            <div class="vital-item">
                              <div class="vital-label">Blood Pressure</div>
                              <div class="vital-value">
                                {{ enc()?.vitalSigns?.bloodPressureSystolic }}/{{ enc()?.vitalSigns?.bloodPressureDiastolic }}
                                <span class="vital-unit">mmHg</span>
                              </div>
                            </div>
                          }
                          @if (enc()?.vitalSigns?.pulseRate) {
                            <div class="vital-item">
                              <div class="vital-label">Heart Rate</div>
                              <div class="vital-value">
                                {{ enc()?.vitalSigns?.pulseRate }}
                                <span class="vital-unit">bpm</span>
                              </div>
                            </div>
                          }
                          @if (enc()?.vitalSigns?.temperatureCelsius) {
                            <div class="vital-item">
                              <div class="vital-label">Temperature</div>
                              <div class="vital-value">
                                {{ enc()?.vitalSigns?.temperatureCelsius }}
                                <span class="vital-unit">°C</span>
                              </div>
                            </div>
                          }
                          @if (enc()?.vitalSigns?.respiratoryRate) {
                            <div class="vital-item">
                              <div class="vital-label">Respiratory Rate</div>
                              <div class="vital-value">
                                {{ enc()?.vitalSigns?.respiratoryRate }}
                                <span class="vital-unit">/min</span>
                              </div>
                            </div>
                          }
                          @if (enc()?.vitalSigns?.oxygenSaturation) {
                            <div class="vital-item">
                              <div class="vital-label">SpO2</div>
                              <div class="vital-value">
                                {{ enc()?.vitalSigns?.oxygenSaturation }}
                                <span class="vital-unit">%</span>
                              </div>
                            </div>
                          }
                          @if (enc()?.vitalSigns?.heightCm) {
                            <div class="vital-item">
                              <div class="vital-label">Height</div>
                              <div class="vital-value">
                                {{ enc()?.vitalSigns?.heightCm }}
                                <span class="vital-unit">cm</span>
                              </div>
                            </div>
                          }
                          @if (enc()?.vitalSigns?.weightKg) {
                            <div class="vital-item">
                              <div class="vital-label">Weight</div>
                              <div class="vital-value">
                                {{ enc()?.vitalSigns?.weightKg }}
                                <span class="vital-unit">kg</span>
                              </div>
                            </div>
                          }
                          @if (enc()?.vitalSigns?.bmi) {
                            <div class="vital-item">
                              <div class="vital-label">BMI</div>
                              <div class="vital-value">
                                {{ enc()?.vitalSigns?.bmi | number:'1.1-1' }}
                              </div>
                            </div>
                          }
                          @if (enc()?.vitalSigns?.painLevel !== undefined) {
                            <div class="vital-item">
                              <div class="vital-label">Pain Level</div>
                              <div class="vital-value">
                                {{ enc()?.vitalSigns?.painLevel }}/10
                              </div>
                            </div>
                          }
                        </div>
                        <div class="vitals-meta">
                          Recorded {{ enc()?.vitalSigns?.recordedAt | date:'M/d/yy h:mm a' }}
                        </div>
                      } @else {
                        <div class="no-data">No vitals recorded</div>
                      }
                    </div>
                  </mat-tab>

                  <!-- Subjective Tab -->
                  <mat-tab label="Subjective">
                    <div class="tab-content">
                      @if (enc()?.subjective; as subjective) {
                        <div class="soap-section">
                          <h4>Chief Complaint</h4>
                          <p>{{ subjective.chiefComplaint || 'Not documented' }}</p>
                        </div>

                        <div class="soap-section">
                          <h4>History of Present Illness</h4>
                          <p>{{ subjective.historyOfPresentIllness || 'Not documented' }}</p>
                        </div>

                        @if (subjective.reviewOfSystems) {
                          <div class="soap-section">
                            <h4>Review of Systems</h4>
                            <div class="ros-grid">
                              @for (item of getROSItems(subjective.reviewOfSystems); track item.key) {
                                @if (item.value) {
                                  <div class="ros-item">
                                    <strong>{{ item.label }}:</strong> {{ item.value }}
                                  </div>
                                }
                              }
                            </div>
                          </div>
                        }

                        @if (subjective.medications) {
                          <div class="soap-section">
                            <h4>Current Medications</h4>
                            <p>{{ subjective.medications }}</p>
                          </div>
                        }

                        @if (subjective.allergies) {
                          <div class="soap-section">
                            <h4>Allergies</h4>
                            <p>{{ subjective.allergies }}</p>
                          </div>
                        }
                      } @else {
                        <div class="no-data">No subjective data documented</div>
                      }
                    </div>
                  </mat-tab>

                  <!-- Objective Tab -->
                  <mat-tab label="Objective">
                    <div class="tab-content">
                      @if (enc()?.objective; as objective) {
                        @if (objective.physicalExam) {
                          <div class="soap-section">
                            <h4>Physical Examination</h4>
                            <div class="exam-grid">
                              @for (item of getExamItems(objective.physicalExam); track item.key) {
                                @if (item.value) {
                                  <div class="exam-item">
                                    <strong>{{ item.label }}:</strong> {{ item.value }}
                                  </div>
                                }
                              }
                            </div>
                          </div>
                        }

                        @if (objective.labResults) {
                          <div class="soap-section">
                            <h4>Lab Results</h4>
                            <p>{{ objective.labResults }}</p>
                          </div>
                        }

                        @if (objective.imagingResults) {
                          <div class="soap-section">
                            <h4>Imaging Results</h4>
                            <p>{{ objective.imagingResults }}</p>
                          </div>
                        }
                      } @else {
                        <div class="no-data">No objective data documented</div>
                      }
                    </div>
                  </mat-tab>

                  <!-- Assessment Tab -->
                  <mat-tab label="Assessment">
                    <div class="tab-content">
                      @if (enc()?.assessment; as assessment) {
                        <div class="soap-section">
                          <h4>Clinical Impression</h4>
                          <p>{{ assessment.clinicalImpression || 'Not documented' }}</p>
                        </div>

                        @if (assessment.diagnoses?.length) {
                          <div class="soap-section">
                            <h4>Diagnoses</h4>
                            <div class="diagnoses-list">
                              @for (dx of assessment.diagnoses; track dx.id; let i = $index) {
                                <div class="diagnosis-item">
                                  <div class="dx-header">
                                    <span class="dx-number">{{ i + 1 }}.</span>
                                    <span class="dx-code">{{ dx.code }}</span>
                                    <mat-chip size="small" [class]="'dx-type-' + dx.type">
                                      {{ dx.type }}
                                    </mat-chip>
                                  </div>
                                  <div class="dx-description">{{ dx.description }}</div>
                                </div>
                              }
                            </div>
                          </div>
                        }
                      } @else {
                        <div class="no-data">No assessment documented</div>
                      }
                    </div>
                  </mat-tab>

                  <!-- Plan Tab -->
                  <mat-tab label="Plan">
                    <div class="tab-content">
                      @if (enc()?.plan; as plan) {
                        <div class="soap-section">
                          <h4>Treatment Plan</h4>
                          <p>{{ plan.treatmentPlan || 'Not documented' }}</p>
                        </div>

                        @if (plan.medications?.length) {
                          <div class="soap-section">
                            <h4>Medications</h4>
                            <div class="orders-list">
                              @for (med of plan.medications; track med.id) {
                                <div class="order-item">
                                  <mat-icon>medication</mat-icon>
                                  <div class="order-details">
                                    <strong>{{ med.medicationName }}</strong>
                                    <span>{{ med.dosage }} {{ med.route }} {{ med.frequency }}</span>
                                    @if (med.instructions) {
                                      <span class="instructions">{{ med.instructions }}</span>
                                    }
                                  </div>
                                </div>
                              }
                            </div>
                          </div>
                        }

                        @if (plan.labOrders?.length) {
                          <div class="soap-section">
                            <h4>Lab Orders</h4>
                            <div class="orders-list">
                              @for (lab of plan.labOrders; track lab.id) {
                                <div class="order-item">
                                  <mat-icon>science</mat-icon>
                                  <div class="order-details">
                                    <strong>{{ lab.testName }}</strong>
                                    @if (lab.indication) {
                                      <span>{{ lab.indication }}</span>
                                    }
                                    <app-status-badge 
                                      [label]="lab.status" 
                                      size="small"
                                      [variant]="lab.status === 'completed' ? 'success' : 'info'"
                                    ></app-status-badge>
                                  </div>
                                </div>
                              }
                            </div>
                          </div>
                        }

                        @if (plan.referrals?.length) {
                          <div class="soap-section">
                            <h4>Referrals</h4>
                            <div class="orders-list">
                              @for (ref of plan.referrals; track ref.id) {
                                <div class="order-item">
                                  <mat-icon>send</mat-icon>
                                  <div class="order-details">
                                    <strong>{{ ref.specialty }}</strong>
                                    <span>{{ ref.reason }}</span>
                                  </div>
                                </div>
                              }
                            </div>
                          </div>
                        }

                        @if (plan.followUp) {
                          <div class="soap-section">
                            <h4>Follow-up</h4>
                            <p>
                              <strong>{{ plan.followUp.timing }}</strong>
                              @if (plan.followUp.reason) {
                                - {{ plan.followUp.reason }}
                              }
                            </p>
                          </div>
                        }

                        @if (plan.patientEducation) {
                          <div class="soap-section">
                            <h4>Patient Education</h4>
                            <p>{{ plan.patientEducation }}</p>
                          </div>
                        }
                      } @else {
                        <div class="no-data">No plan documented</div>
                      }
                    </div>
                  </mat-tab>
                </mat-tab-group>
              </mat-card-content>
            </mat-card>
          </div>

          <!-- Right Column - Sidebar -->
          <div class="sidebar">
            <!-- Patient Card -->
            <mat-card class="patient-card">
              <mat-card-header>
                <mat-card-title>Patient</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="patient-info">
                  <app-avatar
                    [name]="enc()!.patient.name"
                    [imageUrl]="enc()!.patient.photo ?? ''"
                    size="lg"
                  ></app-avatar>
                  <div class="patient-details">
                    <h3>{{ enc()!.patient.name }}</h3>
                    <p>MRN: {{ enc()!.patient.mrn }}</p>
                    <p>DOB: {{ enc()!.patient.dob }}</p>
                  </div>
                </div>
                <button mat-stroked-button [routerLink]="['/patients', enc()!.patient.id]" class="view-patient-btn">
                  <mat-icon>person</mat-icon>
                  View Patient
                </button>
              </mat-card-content>
            </mat-card>

            <!-- Provider Card -->
            <mat-card>
              <mat-card-header>
                <mat-card-title>Provider</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="provider-info">
                  <app-avatar [name]="enc()!.provider.name" size="md"></app-avatar>
                  <div class="provider-details">
                    <h4>{{ enc()!.provider.name }}</h4>
                    @if (enc()!.provider.specialty) {
                      <p>{{ enc()!.provider.specialty }}</p>
                    }
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Location Card -->
            @if (enc()!.facilityName) {
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Location</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="location-info">
                    <mat-icon>location_on</mat-icon>
                    <div>
                      <h4>{{ enc()!.facilityName }}</h4>
                      @if (enc()!.roomName) {
                        <p>{{ enc()!.roomName }}</p>
                      }
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            }

            <!-- Billing Card -->
            @if (enc()!.billingCodes?.length) {
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Billing Codes</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="billing-codes">
                    @for (code of enc()!.billingCodes; track code.code) {
                      <div class="billing-code-item">
                        <span class="code">{{ code.code }}</span>
                        <span class="description">{{ code.description }}</span>
                      </div>
                    }
                  </div>
                </mat-card-content>
              </mat-card>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .encounter-detail-container {
      padding: 24px;
      max-width: 1600px;
      margin: 0 auto;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .info-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: #f8fafc;
      border-radius: 12px;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .status-section {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;

      mat-chip {
        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
          margin-right: 4px;
        }
      }
    }

    .signed-info {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.85rem;
      color: #10b981;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }

    .timing-section {
      display: flex;
      gap: 24px;
    }

    .timing-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.9rem;
      color: #666;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 350px;
      gap: 24px;
    }

    .clinical-notes mat-card {
      min-height: 600px;
    }

    .tab-content {
      padding: 24px 16px;
    }

    .soap-section {
      margin-bottom: 24px;

      h4 {
        margin: 0 0 8px;
        font-size: 0.9rem;
        font-weight: 600;
        color: #374151;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      p {
        margin: 0;
        color: #4b5563;
        line-height: 1.6;
        white-space: pre-wrap;
      }
    }

    .vitals-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 16px;
    }

    .vital-item {
      background: #f9fafb;
      padding: 16px;
      border-radius: 8px;
      text-align: center;
    }

    .vital-label {
      font-size: 0.8rem;
      color: #6b7280;
      margin-bottom: 4px;
    }

    .vital-value {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1f2937;
    }

    .vital-unit {
      font-size: 0.9rem;
      font-weight: 400;
      color: #6b7280;
    }

    .vitals-meta {
      margin-top: 16px;
      font-size: 0.85rem;
      color: #9ca3af;
      text-align: right;
    }

    .ros-grid, .exam-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .ros-item, .exam-item {
      font-size: 0.9rem;
      line-height: 1.5;

      strong {
        color: #374151;
      }
    }

    .diagnoses-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .diagnosis-item {
      padding: 12px;
      background: #f9fafb;
      border-radius: 8px;
    }

    .dx-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .dx-number {
      font-weight: 600;
      color: #6b7280;
    }

    .dx-code {
      font-family: monospace;
      font-weight: 600;
      color: #3b82f6;
    }

    .dx-type-primary {
      background-color: #dbeafe !important;
      color: #1d4ed8 !important;
    }

    .dx-type-secondary {
      background-color: #f3f4f6 !important;
      color: #4b5563 !important;
    }

    .dx-description {
      font-size: 0.95rem;
      color: #374151;
    }

    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .order-item {
      display: flex;
      gap: 12px;
      padding: 12px;
      background: #f9fafb;
      border-radius: 8px;

      mat-icon {
        color: #6b7280;
      }
    }

    .order-details {
      display: flex;
      flex-direction: column;
      gap: 2px;

      strong {
        color: #374151;
      }

      span {
        font-size: 0.9rem;
        color: #6b7280;
      }

      .instructions {
        font-style: italic;
      }
    }

    .no-data {
      color: #9ca3af;
      font-style: italic;
      padding: 24px;
      text-align: center;
    }

    .sidebar {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .patient-card {
      .patient-info {
        display: flex;
        gap: 16px;
        margin-bottom: 16px;
      }

      .patient-details {
        h3 {
          margin: 0 0 4px;
          font-size: 1.1rem;
        }

        p {
          margin: 0;
          font-size: 0.9rem;
          color: #6b7280;
        }
      }

      .view-patient-btn {
        width: 100%;
      }
    }

    .provider-info {
      display: flex;
      gap: 12px;
      align-items: center;

      h4 {
        margin: 0;
        font-size: 1rem;
      }

      p {
        margin: 0;
        font-size: 0.85rem;
        color: #6b7280;
      }
    }

    .location-info {
      display: flex;
      gap: 12px;
      align-items: flex-start;

      mat-icon {
        color: #6b7280;
      }

      h4 {
        margin: 0;
        font-size: 1rem;
      }

      p {
        margin: 0;
        font-size: 0.85rem;
        color: #6b7280;
      }
    }

    .billing-codes {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .billing-code-item {
      display: flex;
      gap: 8px;
      align-items: flex-start;

      .code {
        font-family: monospace;
        font-weight: 600;
        color: #3b82f6;
        min-width: 60px;
      }

      .description {
        font-size: 0.9rem;
        color: #4b5563;
      }
    }

    .danger-item {
      color: #ef4444 !important;
    }

    @media (max-width: 1024px) {
      .content-grid {
        grid-template-columns: 1fr;
      }

      .sidebar {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      }
    }

    @media (max-width: 768px) {
      .encounter-detail-container {
        padding: 16px;
      }

      .info-bar {
        flex-direction: column;
        align-items: flex-start;
      }

      .timing-section {
        flex-direction: column;
        gap: 8px;
      }

      .vitals-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class EncounterDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly encounterService = inject(EncounterService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  encounter = signal<Encounter | null>(null);
  // Alias for template compatibility with @if...as pattern
  enc = computed(() => this.encounter());
  loading = signal(true);

  breadcrumbs = [
    { label: 'Home', route: '/' },
    { label: 'Encounters', route: '/encounters' },
    { label: 'Details' },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadEncounter(id);
    }
  }

  loadEncounter(id: string): void {
    this.loading.set(true);
    this.encounterService.getEncounter(id).subscribe({
      next: (encounter) => {
        this.encounter.set(encounter);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load encounter', 'Close', { duration: 3000 });
        this.router.navigate(['/encounters']);
      },
    });
  }

  getEncounterSubtitle(enc: Encounter): string {
    const date = new Date(enc.startTime).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return `${ENCOUNTER_CLASS_CONFIG[enc.class as keyof typeof ENCOUNTER_CLASS_CONFIG].label} • ${date}`;
  }

  getStatusConfig(status: string) {
    return ENCOUNTER_STATUS_CONFIG[status as keyof typeof ENCOUNTER_STATUS_CONFIG];
  }

  getClassConfig(cls: string) {
    return ENCOUNTER_CLASS_CONFIG[cls as keyof typeof ENCOUNTER_CLASS_CONFIG];
  }

  getStatusVariant(status: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary' {
    const map: Record<string, any> = {
      'finished': 'success',
      'in-progress': 'primary',
      'arrived': 'info',
      'triaged': 'info',
      'planned': 'neutral',
      'onleave': 'warning',
      'cancelled': 'error',
    };
    return map[status] || 'neutral';
  }

  getROSItems(ros: any): { key: string; label: string; value: string }[] {
    const labels: Record<string, string> = {
      constitutional: 'Constitutional',
      eyes: 'Eyes',
      entMouth: 'ENT/Mouth',
      cardiovascular: 'Cardiovascular',
      respiratory: 'Respiratory',
      gastrointestinal: 'Gastrointestinal',
      genitourinary: 'Genitourinary',
      musculoskeletal: 'Musculoskeletal',
      integumentary: 'Integumentary',
      neurological: 'Neurological',
      psychiatric: 'Psychiatric',
      endocrine: 'Endocrine',
      hematologicLymphatic: 'Hematologic/Lymphatic',
      allergicImmunologic: 'Allergic/Immunologic',
    };

    return Object.entries(ros || {})
      .filter(([_, value]) => value)
      .map(([key, value]) => ({
        key,
        label: labels[key] || key,
        value: value as string,
      }));
  }

  getExamItems(exam: any): { key: string; label: string; value: string }[] {
    const labels: Record<string, string> = {
      general: 'General',
      head: 'Head',
      eyes: 'Eyes',
      ears: 'Ears',
      nose: 'Nose',
      throat: 'Throat',
      neck: 'Neck',
      chest: 'Chest',
      heart: 'Heart',
      lungs: 'Lungs',
      abdomen: 'Abdomen',
      extremities: 'Extremities',
      skin: 'Skin',
      neurological: 'Neurological',
      psychiatric: 'Psychiatric',
      musculoskeletal: 'Musculoskeletal',
      genitourinary: 'Genitourinary',
      rectal: 'Rectal',
      lymphatic: 'Lymphatic',
    };

    return Object.entries(exam || {})
      .filter(([_, value]) => value)
      .map(([key, value]) => ({
        key,
        label: labels[key] || key,
        value: value as string,
      }));
  }

  signEncounter(): void {
    const enc = this.encounter();
    if (!enc) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Sign Encounter',
        message: 'By signing this encounter, you attest that the documentation is accurate and complete. This action cannot be undone.',
        confirmText: 'Sign & Complete',
        cancelText: 'Cancel',
        type: 'info',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.encounterService.signEncounter(enc.id).subscribe({
          next: (updated) => {
            this.encounter.set(updated);
            this.snackBar.open('Encounter signed successfully', 'Close', { duration: 3000 });
          },
          error: () => {
            this.snackBar.open('Failed to sign encounter', 'Close', { duration: 3000 });
          },
        });
      }
    });
  }

  cancelEncounter(): void {
    const enc = this.encounter();
    if (!enc) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cancel Encounter',
        message: 'Are you sure you want to cancel this encounter? This action cannot be undone.',
        confirmText: 'Cancel Encounter',
        cancelText: 'Keep',
        type: 'danger',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.encounterService.cancelEncounter(enc.id).subscribe({
          next: (updated) => {
            this.encounter.set(updated);
            this.snackBar.open('Encounter cancelled', 'Close', { duration: 3000 });
          },
          error: () => {
            this.snackBar.open('Failed to cancel encounter', 'Close', { duration: 3000 });
          },
        });
      }
    });
  }

  printEncounter(): void {
    window.print();
  }
}
