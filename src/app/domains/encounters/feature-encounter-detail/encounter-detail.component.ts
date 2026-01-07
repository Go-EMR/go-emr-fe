import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

// PrimeNG Imports
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { Chip } from 'primeng/chip';
import { Avatar } from 'primeng/avatar';
import { Menu } from 'primeng/menu';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { Divider } from 'primeng/divider';
import { Tooltip } from 'primeng/tooltip';
import { Skeleton } from 'primeng/skeleton';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Toast } from 'primeng/toast';
import { Panel } from 'primeng/panel';
import { Accordion, AccordionTab } from 'primeng/accordion';
import { MessageService, ConfirmationService, MenuItem } from 'primeng/api';

import { EncounterService } from '../data-access/services/encounter.service';
import { ThemeService } from '../../../core/services/theme.service';
import {
  Encounter,
  EncounterStatus,
  EncounterClass,
  ENCOUNTER_STATUS_CONFIG,
  ENCOUNTER_CLASS_CONFIG
} from '../data-access/models/encounter.model';

@Component({
  selector: 'app-encounter-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    // PrimeNG
    Card,
    Button,
    Tag,
    Chip,
    Avatar,
    Menu,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    Divider,
    Tooltip,
    Skeleton,
    ConfirmDialog,
    Toast,
    Panel,
    Accordion,
    AccordionTab,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="encounter-detail" [class.dark]="themeService.isDarkMode()">
      <p-toast />
      <p-confirmDialog />

      @if (loading()) {
        <!-- Loading State -->
        <div class="loading-state">
          <div class="header-skeleton">
            <p-skeleton width="300px" height="32px" />
            <p-skeleton width="200px" height="20px" />
          </div>
          <p-skeleton width="100%" height="80px" borderRadius="16px" />
          <div class="content-skeleton">
            <p-skeleton width="100%" height="400px" borderRadius="16px" />
            <p-skeleton width="100%" height="200px" borderRadius="16px" />
          </div>
        </div>
      } @else if (enc()) {
        <!-- Header -->
        <header class="page-header">
          <div class="header-content">
            <div class="breadcrumb">
              <a routerLink="/encounters" class="breadcrumb-link">
                <i class="pi pi-file-edit"></i>
                Encounters
              </a>
              <i class="pi pi-chevron-right"></i>
              <span>Details</span>
            </div>
            <div class="title-section">
              <h1>Encounter with {{ enc()!.patient.name }}</h1>
              <p class="subtitle">{{ getEncounterSubtitle(enc()!) }}</p>
            </div>
          </div>
          <div class="header-actions">
            @if (!enc()!.signedAt) {
              <p-button
                label="Edit"
                icon="pi pi-pencil"
                [outlined]="true"
                [routerLink]="['/encounters', enc()!.id, 'edit']"
              />
            }
            <p-button
              label="Actions"
              icon="pi pi-ellipsis-v"
              (onClick)="actionsMenu.toggle($event)"
            />
            <p-menu #actionsMenu [model]="actionMenuItems" [popup]="true" />
          </div>
        </header>

        <!-- Status Bar -->
        <section class="status-bar">
          <div class="status-info">
            <p-tag
              [value]="getStatusConfig(enc()!.status).label"
              [severity]="getStatusSeverity(enc()!.status)"
              [rounded]="true"
              class="status-tag"
            />
            <p-chip
              [label]="getClassConfig(enc()!.class).label"
              [icon]="'pi ' + getClassIcon(enc()!.class)"
              styleClass="class-chip"
            />
            @if (enc()!.signedAt) {
              <span class="signed-info">
                <i class="pi pi-verified"></i>
                Signed by {{ enc()!.signedBy }} on {{ enc()!.signedAt | date:'MMM d, yyyy h:mm a' }}
              </span>
            }
          </div>
          <div class="timing-info">
            <span class="timing-item">
              <i class="pi pi-calendar"></i>
              {{ enc()!.startTime | date:'EEEE, MMMM d, yyyy' }}
            </span>
            <span class="timing-item">
              <i class="pi pi-clock"></i>
              {{ enc()!.startTime | date:'h:mm a' }}
              @if (enc()!.endTime) {
                - {{ enc()!.endTime | date:'h:mm a' }} ({{ enc()!.duration }} min)
              }
            </span>
          </div>
        </section>

        <!-- Main Content -->
        <div class="content-grid">
          <!-- Clinical Notes -->
          <div class="clinical-column">
            <p-card styleClass="notes-card">
              <ng-template pTemplate="header">
                <div class="card-header">
                  <i class="pi pi-file-edit"></i>
                  <h3>Clinical Documentation</h3>
                </div>
              </ng-template>

              <p-tabs value="0" class="clinical-tabs">
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
                      @if (enc()!.vitalSigns) {
                        <div class="vitals-grid">
                          @if (enc()!.vitalSigns?.bloodPressureSystolic) {
                            <div class="vital-card">
                              <div class="vital-icon bp">
                                <i class="pi pi-heart"></i>
                              </div>
                              <div class="vital-data">
                                <span class="vital-label">Blood Pressure</span>
                                <span class="vital-value">
                                  {{ enc()!.vitalSigns!.bloodPressureSystolic }}/{{ enc()!.vitalSigns!.bloodPressureDiastolic }}
                                  <span class="unit">mmHg</span>
                                </span>
                              </div>
                            </div>
                          }
                          @if (enc()!.vitalSigns?.pulseRate) {
                            <div class="vital-card">
                              <div class="vital-icon hr">
                                <i class="pi pi-bolt"></i>
                              </div>
                              <div class="vital-data">
                                <span class="vital-label">Heart Rate</span>
                                <span class="vital-value">
                                  {{ enc()!.vitalSigns!.pulseRate }}
                                  <span class="unit">bpm</span>
                                </span>
                              </div>
                            </div>
                          }
                          @if (enc()!.vitalSigns?.temperatureCelsius) {
                            <div class="vital-card">
                              <div class="vital-icon temp">
                                <i class="pi pi-sun"></i>
                              </div>
                              <div class="vital-data">
                                <span class="vital-label">Temperature</span>
                                <span class="vital-value">
                                  {{ enc()!.vitalSigns!.temperatureCelsius }}
                                  <span class="unit">°C</span>
                                </span>
                              </div>
                            </div>
                          }
                          @if (enc()!.vitalSigns?.respiratoryRate) {
                            <div class="vital-card">
                              <div class="vital-icon rr">
                                <i class="pi pi-sync"></i>
                              </div>
                              <div class="vital-data">
                                <span class="vital-label">Respiratory Rate</span>
                                <span class="vital-value">
                                  {{ enc()!.vitalSigns!.respiratoryRate }}
                                  <span class="unit">/min</span>
                                </span>
                              </div>
                            </div>
                          }
                          @if (enc()!.vitalSigns?.oxygenSaturation) {
                            <div class="vital-card">
                              <div class="vital-icon spo2">
                                <i class="pi pi-percentage"></i>
                              </div>
                              <div class="vital-data">
                                <span class="vital-label">SpO2</span>
                                <span class="vital-value">
                                  {{ enc()!.vitalSigns!.oxygenSaturation }}
                                  <span class="unit">%</span>
                                </span>
                              </div>
                            </div>
                          }
                          @if (enc()!.vitalSigns?.weightKg) {
                            <div class="vital-card">
                              <div class="vital-icon weight">
                                <i class="pi pi-chart-bar"></i>
                              </div>
                              <div class="vital-data">
                                <span class="vital-label">Weight</span>
                                <span class="vital-value">
                                  {{ enc()!.vitalSigns!.weightKg }}
                                  <span class="unit">kg</span>
                                </span>
                              </div>
                            </div>
                          }
                          @if (enc()!.vitalSigns?.heightCm) {
                            <div class="vital-card">
                              <div class="vital-icon height">
                                <i class="pi pi-arrows-v"></i>
                              </div>
                              <div class="vital-data">
                                <span class="vital-label">Height</span>
                                <span class="vital-value">
                                  {{ enc()!.vitalSigns!.heightCm }}
                                  <span class="unit">cm</span>
                                </span>
                              </div>
                            </div>
                          }
                          @if (enc()!.vitalSigns?.bmi) {
                            <div class="vital-card">
                              <div class="vital-icon bmi">
                                <i class="pi pi-calculator"></i>
                              </div>
                              <div class="vital-data">
                                <span class="vital-label">BMI</span>
                                <span class="vital-value">
                                  {{ enc()!.vitalSigns!.bmi | number:'1.1-1' }}
                                </span>
                              </div>
                            </div>
                          }
                        </div>
                      } @else {
                        <div class="empty-section">
                          <i class="pi pi-heart"></i>
                          <p>No vital signs recorded</p>
                        </div>
                      }
                    </div>
                  </p-tabpanel>

                  <!-- Subjective Panel -->
                  <p-tabpanel value="1">
                    <div class="tab-content">
                      @if (enc()!.subjective) {
                        @if (enc()!.subjective?.chiefComplaint) {
                          <div class="note-section">
                            <h4>Chief Complaint</h4>
                            <p>{{ enc()!.subjective!.chiefComplaint }}</p>
                          </div>
                        }
                        @if (enc()!.subjective?.historyOfPresentIllness) {
                          <div class="note-section">
                            <h4>History of Present Illness</h4>
                            <p>{{ enc()!.subjective!.historyOfPresentIllness }}</p>
                          </div>
                        }
                        @if (enc()!.subjective?.reviewOfSystems) {
                          <div class="note-section">
                            <h4>Review of Systems</h4>
                            <div class="ros-grid">
                              @for (item of getROSItems(enc()!.subjective!.reviewOfSystems); track item.key) {
                                <div class="ros-item">
                                  <span class="ros-label">{{ item.label }}</span>
                                  <span class="ros-value">{{ item.value }}</span>
                                </div>
                              }
                            </div>
                          </div>
                        }
                      } @else {
                        <div class="empty-section">
                          <i class="pi pi-comments"></i>
                          <p>No subjective information recorded</p>
                        </div>
                      }
                    </div>
                  </p-tabpanel>

                  <!-- Objective Panel -->
                  <p-tabpanel value="2">
                    <div class="tab-content">
                      @if (enc()!.objective?.physicalExam) {
                        <div class="note-section">
                          <h4>Physical Examination</h4>
                          <div class="exam-grid">
                            @for (item of getExamItems(enc()!.objective!.physicalExam); track item.key) {
                              <div class="exam-item">
                                <span class="exam-label">{{ item.label }}</span>
                                <span class="exam-value">{{ item.value }}</span>
                              </div>
                            }
                          </div>
                        </div>
                      } @else {
                        <div class="empty-section">
                          <i class="pi pi-search"></i>
                          <p>No objective findings recorded</p>
                        </div>
                      }
                    </div>
                  </p-tabpanel>

                  <!-- Assessment Panel -->
                  <p-tabpanel value="3">
                    <div class="tab-content">
                      @if (enc()!.assessment) {
                        @if (enc()!.assessment?.clinicalImpression) {
                          <div class="note-section">
                            <h4>Clinical Impression</h4>
                            <p>{{ enc()!.assessment!.clinicalImpression }}</p>
                          </div>
                        }
                        @if (enc()!.assessment?.diagnoses?.length) {
                          <div class="note-section">
                            <h4>Diagnoses</h4>
                            <div class="diagnoses-list">
                              @for (dx of enc()!.assessment!.diagnoses; track dx.id) {
                                <div class="diagnosis-item">
                                  <div class="dx-main">
                                    <p-tag
                                      [value]="dx.type"
                                      [severity]="dx.type === 'primary' ? 'info' : 'secondary'"
                                      [rounded]="true"
                                      class="dx-type"
                                    />
                                    <span class="dx-code">{{ dx.code }}</span>
                                    <span class="dx-description">{{ dx.description }}</span>
                                  </div>
                                  <p-tag
                                    [value]="dx.status"
                                    [severity]="dx.status === 'active' ? 'success' : 'secondary'"
                                    [rounded]="true"
                                  />
                                </div>
                              }
                            </div>
                          </div>
                        }
                      } @else {
                        <div class="empty-section">
                          <i class="pi pi-check-square"></i>
                          <p>No assessment recorded</p>
                        </div>
                      }
                    </div>
                  </p-tabpanel>

                  <!-- Plan Panel -->
                  <p-tabpanel value="4">
                    <div class="tab-content">
                      @if (enc()!.plan) {
                        @if (enc()!.plan?.treatmentPlan) {
                          <div class="note-section">
                            <h4>Treatment Plan</h4>
                            <p>{{ enc()!.plan!.treatmentPlan }}</p>
                          </div>
                        }
                        @if (enc()!.plan?.followUp) {
                          <div class="note-section">
                            <h4>Follow-up</h4>
                            <p>
                              <strong>Timing:</strong> {{ enc()!.plan!.followUp!.timing }}
                              @if (enc()!.plan!.followUp!.reason) {
                                <br><strong>Reason:</strong> {{ enc()!.plan!.followUp!.reason }}
                              }
                            </p>
                          </div>
                        }
                        @if (enc()!.plan?.patientEducation) {
                          <div class="note-section">
                            <h4>Patient Education</h4>
                            <p>{{ enc()!.plan!.patientEducation }}</p>
                          </div>
                        }
                      } @else {
                        <div class="empty-section">
                          <i class="pi pi-list"></i>
                          <p>No plan recorded</p>
                        </div>
                      }
                    </div>
                  </p-tabpanel>
                </p-tabpanels>
              </p-tabs>
            </p-card>
          </div>

          <!-- Sidebar -->
          <div class="sidebar-column">
            <!-- Patient Info -->
            <p-card styleClass="sidebar-card">
              <ng-template pTemplate="header">
                <div class="card-header">
                  <i class="pi pi-user"></i>
                  <h3>Patient</h3>
                </div>
              </ng-template>
              <div class="patient-info">
                <p-avatar
                  [label]="getInitials(enc()!.patient.name)"
                  [image]="enc()!.patient.photo || ''"
                  [style]="{ 'background-color': '#3b82f6', 'color': 'white', 'font-size': '1.25rem' }"
                  size="xlarge"
                  shape="circle"
                />
                <div class="patient-details">
                  <h4>{{ enc()!.patient.name }}</h4>
                  <span class="meta-item">
                    <i class="pi pi-id-card"></i>
                    MRN: {{ enc()!.patient.mrn }}
                  </span>
                  <span class="meta-item">
                    <i class="pi pi-calendar"></i>
                    DOB: {{ enc()!.patient.dob }}
                  </span>
                </div>
              </div>
              <p-button
                label="View Patient"
                icon="pi pi-arrow-right"
                [text]="true"
                [routerLink]="['/patients', enc()!.patient.id]"
                styleClass="w-full"
              />
            </p-card>

            <!-- Provider Info -->
            <p-card styleClass="sidebar-card">
              <ng-template pTemplate="header">
                <div class="card-header">
                  <i class="pi pi-id-card"></i>
                  <h3>Provider</h3>
                </div>
              </ng-template>
              <div class="provider-info">
                <p-avatar
                  [label]="getInitials(enc()!.provider.name)"
                  [style]="{ 'background-color': '#10b981', 'color': 'white' }"
                  size="large"
                  shape="circle"
                />
                <div class="provider-details">
                  <h4>{{ enc()!.provider.name }}</h4>
                  @if (enc()!.provider.specialty) {
                    <span class="specialty">{{ enc()!.provider.specialty }}</span>
                  }
                </div>
              </div>
            </p-card>

            <!-- Location Info -->
            @if (enc()!.facilityName) {
              <p-card styleClass="sidebar-card">
                <ng-template pTemplate="header">
                  <div class="card-header">
                    <i class="pi pi-map-marker"></i>
                    <h3>Location</h3>
                  </div>
                </ng-template>
                <div class="location-info">
                  <span class="facility">{{ enc()!.facilityName }}</span>
                  @if (enc()!.roomName) {
                    <span class="room">Room: {{ enc()!.roomName }}</span>
                  }
                </div>
              </p-card>
            }
          </div>
        </div>
      } @else {
        <!-- Error State -->
        <div class="error-state">
          <i class="pi pi-exclamation-triangle"></i>
          <h3>Encounter not found</h3>
          <p>The requested encounter could not be loaded.</p>
          <p-button
            label="Back to Encounters"
            icon="pi pi-arrow-left"
            routerLink="/encounters"
          />
        </div>
      }
    </div>
  `,
  styles: [`
    .encounter-detail {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Loading State */
    .loading-state {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .header-skeleton {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .content-skeleton {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;
    }

    /* Error State */
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      text-align: center;
    }

    .error-state i {
      font-size: 4rem;
      color: #f59e0b;
      margin-bottom: 1rem;
    }

    .error-state h3 {
      color: #1e293b;
      margin: 0 0 0.5rem;
    }

    .dark .error-state h3 {
      color: #f1f5f9;
    }

    .error-state p {
      color: #64748b;
      margin: 0 0 1.5rem;
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

    /* Status Bar */
    .status-bar {
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

    .dark .status-bar {
      background: #1e293b;
      border-color: #334155;
    }

    .status-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    :host ::ng-deep .status-tag .p-tag {
      font-size: 0.875rem;
      padding: 0.375rem 0.75rem;
    }

    :host ::ng-deep .class-chip {
      background: #f1f5f9;
    }

    .dark :host ::ng-deep .class-chip {
      background: #334155;
      color: #e2e8f0;
    }

    .signed-info {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.875rem;
      color: #10b981;
    }

    .timing-info {
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .timing-item {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.875rem;
      color: #64748b;
    }

    .dark .timing-item {
      color: #94a3b8;
    }

    /* Content Grid */
    .content-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;
    }

    :host ::ng-deep .notes-card,
    :host ::ng-deep .sidebar-card {
      border-radius: 1rem;
    }

    .dark :host ::ng-deep .p-card {
      background: #1e293b;
      border-color: #334155;
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .dark .card-header {
      border-bottom-color: #334155;
    }

    .card-header i {
      font-size: 1.125rem;
      color: #3b82f6;
    }

    .card-header h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
    }

    .dark .card-header h3 {
      color: #f1f5f9;
    }

    /* Tab Content */
    .tab-content {
      padding: 1rem 0;
    }

    /* PrimeNG v19 Tabs Styling - Force Horizontal Layout */
    :host ::ng-deep .notes-card .p-card-body {
      padding: 0;
    }

    :host ::ng-deep .notes-card .p-card-content {
      padding: 0;
    }

    :host ::ng-deep .clinical-tabs {
      width: 100%;
      display: block;
    }

    :host ::ng-deep .clinical-tabs > .p-tabs {
      display: flex;
      flex-direction: column;
    }

    :host ::ng-deep .clinical-tabs .p-tablist {
      display: flex !important;
      flex-direction: row !important;
      flex-wrap: nowrap !important;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      padding: 0 1rem;
      overflow-x: auto;
    }

    :host ::ng-deep .clinical-tabs .p-tablist-tab-list {
      display: flex !important;
      flex-direction: row !important;
      flex-wrap: nowrap !important;
      gap: 0;
      list-style: none;
      margin: 0;
      padding: 0;
    }

    :host ::ng-deep .clinical-tabs .p-tablist-content {
      display: flex !important;
      flex-direction: row !important;
    }

    :host ::ng-deep .clinical-tabs .p-tablist-active-bar {
      display: none;
    }

    .dark :host ::ng-deep .clinical-tabs .p-tablist {
      background: #0f172a;
      border-bottom-color: #334155;
    }

    /* Ensure horizontal tab layout in PrimeNG 19 */
    :host ::ng-deep .clinical-tabs .p-tabs-nav {
      display: flex !important;
      flex-direction: row !important;
    }

    :host ::ng-deep .clinical-tabs .p-tablist-content {
      display: flex !important;
      flex-direction: row !important;
    }

    :host ::ng-deep .clinical-tabs .p-tab {
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

    :host ::ng-deep .clinical-tabs .p-tab:hover {
      color: #3b82f6;
      border-bottom-color: #93c5fd;
    }

    :host ::ng-deep .clinical-tabs .p-tab[data-p-active="true"],
    :host ::ng-deep .clinical-tabs .p-tab.p-tab-active {
      color: #3b82f6;
      border-bottom-color: #3b82f6;
      background: transparent;
    }

    .dark :host ::ng-deep .clinical-tabs .p-tab {
      color: #94a3b8;
    }

    .dark :host ::ng-deep .clinical-tabs .p-tab:hover {
      color: #60a5fa;
      border-bottom-color: #3b82f6;
    }

    .dark :host ::ng-deep .clinical-tabs .p-tab[data-p-active="true"],
    .dark :host ::ng-deep .clinical-tabs .p-tab.p-tab-active {
      color: #60a5fa;
      border-bottom-color: #60a5fa;
    }

    :host ::ng-deep .clinical-tabs .p-tab i {
      font-size: 1rem;
    }

    :host ::ng-deep .clinical-tabs .p-tabpanels {
      padding: 1rem;
      background: transparent;
    }

    :host ::ng-deep .clinical-tabs .p-tabpanel {
      padding: 0;
    }

    /* Vitals Grid */
    .vitals-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 1rem;
    }

    .vital-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 0.75rem;
    }

    .dark .vital-card {
      background: #334155;
    }

    .vital-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .vital-icon i {
      font-size: 1.125rem;
      color: white;
    }

    .vital-icon.bp { background: linear-gradient(135deg, #ef4444, #dc2626); }
    .vital-icon.hr { background: linear-gradient(135deg, #f59e0b, #d97706); }
    .vital-icon.temp { background: linear-gradient(135deg, #3b82f6, #2563eb); }
    .vital-icon.rr { background: linear-gradient(135deg, #10b981, #059669); }
    .vital-icon.spo2 { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
    .vital-icon.weight { background: linear-gradient(135deg, #06b6d4, #0891b2); }
    .vital-icon.height { background: linear-gradient(135deg, #ec4899, #db2777); }
    .vital-icon.bmi { background: linear-gradient(135deg, #64748b, #475569); }

    .vital-data {
      display: flex;
      flex-direction: column;
    }

    .vital-label {
      font-size: 0.75rem;
      color: #64748b;
    }

    .dark .vital-label {
      color: #94a3b8;
    }

    .vital-value {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
    }

    .dark .vital-value {
      color: #f1f5f9;
    }

    .vital-value .unit {
      font-size: 0.75rem;
      font-weight: 400;
      color: #64748b;
      margin-left: 0.25rem;
    }

    /* Note Sections */
    .note-section {
      margin-bottom: 1.5rem;
    }

    .note-section:last-child {
      margin-bottom: 0;
    }

    .note-section h4 {
      margin: 0 0 0.75rem;
      font-size: 0.9375rem;
      font-weight: 600;
      color: #374151;
    }

    .dark .note-section h4 {
      color: #e2e8f0;
    }

    .note-section p {
      margin: 0;
      color: #374151;
      line-height: 1.6;
    }

    .dark .note-section p {
      color: #cbd5e1;
    }

    /* ROS Grid */
    .ros-grid,
    .exam-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 0.75rem;
    }

    .ros-item,
    .exam-item {
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: 0.5rem;
    }

    .dark .ros-item,
    .dark .exam-item {
      background: #334155;
    }

    .ros-label,
    .exam-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 500;
      color: #64748b;
      margin-bottom: 0.25rem;
    }

    .dark .ros-label,
    .dark .exam-label {
      color: #94a3b8;
    }

    .ros-value,
    .exam-value {
      font-size: 0.875rem;
      color: #374151;
    }

    .dark .ros-value,
    .dark .exam-value {
      color: #e2e8f0;
    }

    /* Diagnoses */
    .diagnoses-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .diagnosis-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: 0.5rem;
      gap: 1rem;
    }

    .dark .diagnosis-item {
      background: #334155;
    }

    .dx-main {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .dx-code {
      font-family: monospace;
      font-size: 0.8125rem;
      color: #3b82f6;
      background: #dbeafe;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
    }

    .dark .dx-code {
      background: #1e3a8a;
      color: #93c5fd;
    }

    .dx-description {
      color: #374151;
    }

    .dark .dx-description {
      color: #e2e8f0;
    }

    /* Empty Section */
    .empty-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      text-align: center;
    }

    .empty-section i {
      font-size: 2.5rem;
      color: #cbd5e1;
      margin-bottom: 0.75rem;
    }

    .dark .empty-section i {
      color: #475569;
    }

    .empty-section p {
      color: #64748b;
      margin: 0;
    }

    /* Sidebar */
    .sidebar-column {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .patient-info,
    .provider-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
    }

    .patient-details,
    .provider-details {
      display: flex;
      flex-direction: column;
    }

    .patient-details h4,
    .provider-details h4 {
      margin: 0 0 0.25rem;
      font-size: 1.0625rem;
      font-weight: 600;
      color: #1e293b;
    }

    .dark .patient-details h4,
    .dark .provider-details h4 {
      color: #f1f5f9;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.8125rem;
      color: #64748b;
    }

    .dark .meta-item {
      color: #94a3b8;
    }

    .specialty {
      font-size: 0.875rem;
      color: #64748b;
    }

    .dark .specialty {
      color: #94a3b8;
    }

    .location-info {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .facility {
      font-weight: 500;
      color: #1e293b;
    }

    .dark .facility {
      color: #f1f5f9;
    }

    .room {
      font-size: 0.875rem;
      color: #64748b;
    }

    .dark .room {
      color: #94a3b8;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .content-grid,
      .content-skeleton {
        grid-template-columns: 1fr;
      }

      .sidebar-column {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1rem;
      }
    }

    @media (max-width: 768px) {
      .encounter-detail {
        padding: 1rem;
      }

      .page-header {
        flex-direction: column;
        align-items: stretch;
      }

      .header-actions {
        justify-content: flex-end;
      }

      .status-bar {
        flex-direction: column;
        align-items: flex-start;
      }

      .timing-info {
        flex-direction: column;
        gap: 0.5rem;
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
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  readonly themeService = inject(ThemeService);

  encounter = signal<Encounter | null>(null);
  enc = computed(() => this.encounter());
  loading = signal(true);

  actionMenuItems: MenuItem[] = [];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('encounterId');
    if (id) {
      this.loadEncounter(id);
    }
  }

  private loadEncounter(id: string): void {
    this.loading.set(true);
    this.encounterService.getEncounter(id).subscribe({
      next: (encounter) => {
        this.encounter.set(encounter);
        this.buildActionMenu(encounter);
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

  private buildActionMenu(enc: Encounter): void {
    const items: MenuItem[] = [];

    if (!enc.signedAt && enc.status !== 'cancelled') {
      items.push({
        label: 'Sign & Complete',
        icon: 'pi pi-verified',
        command: () => this.signEncounter()
      });
    }

    items.push(
      { label: 'Print', icon: 'pi pi-print', command: () => this.printEncounter() },
      { label: 'Share', icon: 'pi pi-share-alt' },
    );

    if (enc.status !== 'cancelled' && enc.status !== 'finished') {
      items.push(
        { separator: true },
        {
          label: 'Cancel Encounter',
          icon: 'pi pi-times',
          styleClass: 'text-red-500',
          command: () => this.cancelEncounter()
        }
      );
    }

    this.actionMenuItems = items;
  }

  getEncounterSubtitle(enc: Encounter): string {
    const date = new Date(enc.startTime).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return `${ENCOUNTER_CLASS_CONFIG[enc.class].label} • ${date}`;
  }

  getStatusConfig(status: EncounterStatus) {
    return ENCOUNTER_STATUS_CONFIG[status];
  }

  getClassConfig(cls: EncounterClass) {
    return ENCOUNTER_CLASS_CONFIG[cls];
  }

  getStatusSeverity(status: EncounterStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      'finished': 'success',
      'in-progress': 'info',
      'arrived': 'info',
      'triaged': 'info',
      'planned': 'secondary',
      'onleave': 'warn',
      'cancelled': 'danger',
    };
    return map[status] || 'secondary';
  }

  getClassIcon(cls: EncounterClass): string {
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

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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

    this.confirmationService.confirm({
      message: 'By signing this encounter, you attest that the documentation is accurate and complete. This action cannot be undone.',
      header: 'Sign Encounter',
      icon: 'pi pi-verified',
      acceptLabel: 'Sign & Complete',
      rejectLabel: 'Cancel',
      accept: () => {
        this.encounterService.signEncounter(enc.id).subscribe({
          next: (updated) => {
            this.encounter.set(updated);
            this.buildActionMenu(updated);
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Encounter signed successfully'
            });
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to sign encounter'
            });
          },
        });
      }
    });
  }

  cancelEncounter(): void {
    const enc = this.encounter();
    if (!enc) return;

    this.confirmationService.confirm({
      message: 'Are you sure you want to cancel this encounter? This action cannot be undone.',
      header: 'Cancel Encounter',
      icon: 'pi pi-times-circle',
      acceptLabel: 'Cancel Encounter',
      rejectLabel: 'Keep',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.encounterService.cancelEncounter(enc.id).subscribe({
          next: (updated) => {
            this.encounter.set(updated);
            this.buildActionMenu(updated);
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Encounter cancelled'
            });
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to cancel encounter'
            });
          },
        });
      }
    });
  }

  printEncounter(): void {
    window.print();
  }
}
