import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, RouterOutlet } from '@angular/router';
import { Subject, takeUntil, switchMap } from 'rxjs';

// Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';

import { PatientService } from '../data-access/services/patient.service';
import { Patient, PatientHeader } from '../data-access/models/patient.model';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterOutlet,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatMenuModule,
    MatTooltipModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatListModule,
    MatExpansionModule,
  ],
  template: `
    <div class="patient-detail-container">
      @if (loading()) {
        <div class="loading-state">
          <mat-spinner diameter="48"></mat-spinner>
          <p>Loading patient chart...</p>
        </div>
      } @else if (patient()) {
        <!-- Patient Header Banner -->
        <header class="patient-banner" [class.has-alerts]="hasAlerts()">
          <div class="banner-content">
            <div class="patient-identity">
              <div class="avatar-section">
                <div class="patient-avatar">
                  @if (patient()!.photoUrl) {
                    <img [src]="patient()!.photoUrl" [alt]="patientFullName()" loading="lazy">
                  } @else {
                    <mat-icon>person</mat-icon>
                  }
                </div>
                <span class="status-badge" [class]="patient()!.status">
                  {{ patient()!.status | titlecase }}
                </span>
              </div>

              <div class="patient-info">
                <h1 class="patient-name">{{ patientFullName() }}</h1>
                <div class="patient-meta">
                  <span class="meta-item">
                    <mat-icon>badge</mat-icon>
                    MRN: {{ patient()!.mrn }}
                  </span>
                  <span class="meta-item">
                    <mat-icon>cake</mat-icon>
                    {{ patient()!.dateOfBirth | date:'mediumDate' }} ({{ patientAge() }} yrs)
                  </span>
                  <span class="meta-item">
                    <mat-icon>{{ patient()!.gender === 'male' ? 'male' : patient()!.gender === 'female' ? 'female' : 'transgender' }}</mat-icon>
                    {{ patient()!.gender | titlecase }}
                  </span>
                  @if (patient()!.ssn) {
                    <span class="meta-item">
                      <mat-icon>fingerprint</mat-icon>
                      SSN: ***-**-{{ patient()!.ssn!.slice(-4) }}
                    </span>
                  }
                </div>
              </div>
            </div>

            <div class="banner-actions">
              <button mat-flat-button color="primary" [matMenuTriggerFor]="actionsMenu" class="action-btn">
                <mat-icon>add</mat-icon>
                New
              </button>
              <mat-menu #actionsMenu="matMenu">
                <button mat-menu-item [routerLink]="['encounters']">
                  <mat-icon>medical_services</mat-icon>
                  <span>New Encounter</span>
                </button>
                <button mat-menu-item [routerLink]="['appointments']">
                  <mat-icon>event</mat-icon>
                  <span>Schedule Appointment</span>
                </button>
                <button mat-menu-item [routerLink]="['prescriptions']">
                  <mat-icon>medication</mat-icon>
                  <span>New Prescription</span>
                </button>
                <button mat-menu-item [routerLink]="['labs']">
                  <mat-icon>science</mat-icon>
                  <span>Order Lab</span>
                </button>
              </mat-menu>

              <button mat-icon-button matTooltip="Print Chart" class="icon-action">
                <mat-icon>print</mat-icon>
              </button>
              <button mat-icon-button matTooltip="Share" class="icon-action">
                <mat-icon>share</mat-icon>
              </button>
              <button mat-icon-button [matMenuTriggerFor]="moreMenu" class="icon-action">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #moreMenu="matMenu">
                <button mat-menu-item [routerLink]="['edit']">
                  <mat-icon>edit</mat-icon>
                  <span>Edit Patient</span>
                </button>
                <button mat-menu-item>
                  <mat-icon>history</mat-icon>
                  <span>View Audit Log</span>
                </button>
                <button mat-menu-item>
                  <mat-icon>download</mat-icon>
                  <span>Export Record</span>
                </button>
                <mat-divider></mat-divider>
                <button mat-menu-item class="text-danger">
                  <mat-icon>archive</mat-icon>
                  <span>Archive Patient</span>
                </button>
              </mat-menu>
            </div>
          </div>

          <!-- Alert Strip -->
          @if (hasAlerts()) {
            <div class="alert-strip">
              @if (patient()!.allergies && patient()!.allergies!.length > 0) {
                <div class="alert allergy">
                  <mat-icon>warning</mat-icon>
                  <span>Allergies:</span>
                  @for (allergy of patient()!.allergies; track allergy.allergen) {
                    <mat-chip class="allergy-chip">
                      {{ allergy.allergen }}
                      @if (allergy.severity === 'severe') {
                        <mat-icon>priority_high</mat-icon>
                      }
                    </mat-chip>
                  }
                </div>
              }
            </div>
          }
        </header>

        <!-- Quick Info Cards -->
        <section class="quick-info-section">
          <div class="info-grid">
            <!-- Contact Card -->
            <mat-card class="info-card contact-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>contact_phone</mat-icon>
                <mat-card-title>Contact Information</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="info-list">
                  @if (patient()!.phone) {
                    <div class="info-row">
                      <mat-icon>phone</mat-icon>
                      <span>{{ patient()!.phone }}</span>
                      <span class="label">Primary</span>
                    </div>
                  }
                  @if (patient()!.email) {
                    <div class="info-row">
                      <mat-icon>email</mat-icon>
                      <span>{{ patient()!.email }}</span>
                    </div>
                  }
                  @if (patient()!.address) {
                    <div class="info-row address">
                      <mat-icon>location_on</mat-icon>
                      <span>
                        {{ patient()!.address!.street1 }}<br>
                        @if (patient()!.address!.street2) {
                          {{ patient()!.address!.street2 }}<br>
                        }
                        {{ patient()!.address!.city }}, {{ patient()!.address!.state }} {{ patient()!.address!.zipCode }}
                      </span>
                    </div>
                  }
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Emergency Contact Card -->
            <mat-card class="info-card emergency-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>emergency</mat-icon>
                <mat-card-title>Emergency Contact</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                @if (patient()!.emergencyContact) {
                  <div class="info-list">
                    <div class="info-row">
                      <mat-icon>person</mat-icon>
                      <span>{{ patient()!.emergencyContact!.name }}</span>
                      <span class="label">{{ patient()!.emergencyContact!.relationship }}</span>
                    </div>
                    <div class="info-row">
                      <mat-icon>phone</mat-icon>
                      <span>{{ patient()!.emergencyContact!.phone }}</span>
                    </div>
                  </div>
                } @else {
                  <p class="no-data">No emergency contact on file</p>
                }
              </mat-card-content>
            </mat-card>

            <!-- Insurance Card -->
            <mat-card class="info-card insurance-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>health_and_safety</mat-icon>
                <mat-card-title>Insurance</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                @if (patient()!.insurance && patient()!.insurance!.length > 0) {
                  <div class="info-list">
                    @for (ins of patient()!.insurance; track ins.memberId) {
                      <div class="insurance-item">
                        <div class="insurance-header">
                          <span class="insurance-type">{{ ins.type | titlecase }}</span>
                         @if (ins.type === 'primary') {
                            <span class="primary-badge">Primary</span>
                          }
                        </div>
                        <div class="info-row">
                          <span class="insurance-name">{{ ins.payerName }}</span>
                        </div>
                        <div class="info-row small">
                          <span>Member ID: {{ ins.memberId }}</span>
                        </div>
                        <div class="info-row small">
                          <span>Group: {{ ins.groupNumber }}</span>
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <p class="no-data">No insurance on file</p>
                }
              </mat-card-content>
            </mat-card>

            <!-- Active Problems Card -->
            <mat-card class="info-card problems-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>healing</mat-icon>
                <mat-card-title>Active Problems</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                @if (activeProblems().length > 0) {
                  <mat-list class="problem-list">
                    @for (problem of activeProblems().slice(0, 5); track problem.code) {
                      <mat-list-item>
                        <mat-icon matListItemIcon [class]="problem.severity">
                          {{ problem.severity === 'severe' ? 'error' : problem.severity === 'moderate' ? 'warning' : 'info' }}
                        </mat-icon>
                        <span matListItemTitle>{{ problem.description }}</span>
                        <span matListItemLine>{{ problem.code }} · Since {{ problem.onsetDate | date:'mediumDate' }}</span>
                      </mat-list-item>
                    }
                  </mat-list>
                  @if (activeProblems().length > 5) {
                    <button mat-button color="primary" class="view-all-btn">
                      View All ({{ activeProblems().length }})
                    </button>
                  }
                } @else {
                  <p class="no-data">No active problems</p>
                }
              </mat-card-content>
            </mat-card>
          </div>
        </section>

        <!-- Navigation Tabs -->
        <section class="tabs-section">
          <nav mat-tab-nav-bar [tabPanel]="tabPanel" class="chart-tabs">
            <a mat-tab-link 
               [routerLink]="[]" 
               [active]="isOverviewActive()"
               queryParamsHandling="preserve">
              <mat-icon>dashboard</mat-icon>
              Overview
            </a>
            <a mat-tab-link 
               [routerLink]="['encounters']"
               routerLinkActive="active">
              <mat-icon>medical_services</mat-icon>
              Encounters
            </a>
            <a mat-tab-link 
               [routerLink]="['appointments']"
               routerLinkActive="active">
              <mat-icon>event</mat-icon>
              Appointments
            </a>
            <a mat-tab-link 
               [routerLink]="['prescriptions']"
               routerLinkActive="active">
              <mat-icon>medication</mat-icon>
              Medications
            </a>
            <a mat-tab-link 
               [routerLink]="['labs']"
               routerLinkActive="active">
              <mat-icon>science</mat-icon>
              Labs
            </a>
            <a mat-tab-link 
               [routerLink]="['documents']"
               routerLinkActive="active">
              <mat-icon>folder</mat-icon>
              Documents
            </a>
            <a mat-tab-link 
               [routerLink]="['billing']"
               routerLinkActive="active">
              <mat-icon>receipt</mat-icon>
              Billing
            </a>
          </nav>
          <mat-tab-nav-panel #tabPanel>
            <!-- Overview content when no child route -->
            @if (isOverviewActive()) {
              <div class="overview-content">
                <!-- Recent Activity -->
                <div class="activity-section">
                  <h3 class="section-title">
                    <mat-icon>history</mat-icon>
                    Recent Activity
                  </h3>
                  <mat-card class="activity-card">
                    <mat-list class="activity-list">
                      <mat-list-item>
                        <mat-icon matListItemIcon class="activity-icon encounter">medical_services</mat-icon>
                        <span matListItemTitle>Office Visit - Annual Physical</span>
                        <span matListItemLine>Dr. Sarah Johnson · Dec 15, 2024</span>
                      </mat-list-item>
                      <mat-list-item>
                        <mat-icon matListItemIcon class="activity-icon lab">science</mat-icon>
                        <span matListItemTitle>Lab Results - Comprehensive Metabolic Panel</span>
                        <span matListItemLine>Quest Diagnostics · Dec 10, 2024</span>
                      </mat-list-item>
                      <mat-list-item>
                        <mat-icon matListItemIcon class="activity-icon prescription">medication</mat-icon>
                        <span matListItemTitle>Prescription Refill - Lisinopril 10mg</span>
                        <span matListItemLine>E-prescribed · Dec 5, 2024</span>
                      </mat-list-item>
                      <mat-list-item>
                        <mat-icon matListItemIcon class="activity-icon appointment">event</mat-icon>
                        <span matListItemTitle>Appointment Scheduled</span>
                        <span matListItemLine>Follow-up · Jan 15, 2025</span>
                      </mat-list-item>
                    </mat-list>
                  </mat-card>
                </div>

                <!-- Vitals Summary -->
                <div class="vitals-section">
                  <h3 class="section-title">
                    <mat-icon>monitor_heart</mat-icon>
                    Latest Vitals
                  </h3>
                  <div class="vitals-grid">
                    <div class="vital-card">
                      <div class="vital-icon bp"></div>
                      <div class="vital-info">
                        <span class="vital-value">120/80</span>
                        <span class="vital-label">Blood Pressure</span>
                        <span class="vital-date">Dec 15, 2024</span>
                      </div>
                    </div>
                    <div class="vital-card">
                      <div class="vital-icon hr"></div>
                      <div class="vital-info">
                        <span class="vital-value">72</span>
                        <span class="vital-label">Heart Rate</span>
                        <span class="vital-date">Dec 15, 2024</span>
                      </div>
                    </div>
                    <div class="vital-card">
                      <div class="vital-icon temp"></div>
                      <div class="vital-info">
                        <span class="vital-value">98.6°F</span>
                        <span class="vital-label">Temperature</span>
                        <span class="vital-date">Dec 15, 2024</span>
                      </div>
                    </div>
                    <div class="vital-card">
                      <div class="vital-icon weight"></div>
                      <div class="vital-info">
                        <span class="vital-value">165 lbs</span>
                        <span class="vital-label">Weight</span>
                        <span class="vital-date">Dec 15, 2024</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Consent Status -->
                <div class="consent-section">
                  <h3 class="section-title">
                    <mat-icon>verified_user</mat-icon>
                    Consent Status
                  </h3>
                  <mat-card class="consent-card">
                    <div class="consent-grid">
                      <div class="consent-item" [class.granted]="patient()!.consentStatus?.hipaaConsent">
                        <mat-icon>{{ patient()!.consentStatus?.hipaaConsent ? 'check_circle' : 'cancel' }}</mat-icon>
                        <span>HIPAA Authorization</span>
                      </div>
                      <div class="consent-item" [class.granted]="patient()!.consentStatus?.treatmentConsent">
                        <mat-icon>{{ patient()!.consentStatus?.treatmentConsent ? 'check_circle' : 'cancel' }}</mat-icon>
                        <span>Treatment Consent</span>
                      </div>
                      <div class="consent-item" [class.granted]="patient()!.consentStatus?.portalConsent">
                        <mat-icon>{{ patient()!.consentStatus?.portalConsent ? 'check_circle' : 'cancel' }}</mat-icon>
                        <span>Patient Portal Access</span>
                      </div>
                      <div class="consent-item" [class.granted]="patient()!.consentStatus?.marketingConsent">
                        <mat-icon>{{ patient()!.consentStatus?.marketingConsent ? 'check_circle' : 'cancel' }}</mat-icon>
                        <span>Marketing Communications</span>
                      </div>
                    </div>
                  </mat-card>
                </div>
              </div>
            } @else {
              <router-outlet></router-outlet>
            }
          </mat-tab-nav-panel>
        </section>
      } @else {
        <div class="error-state">
          <mat-icon>error_outline</mat-icon>
          <h3>Patient Not Found</h3>
          <p>The requested patient record could not be found.</p>
          <button mat-flat-button color="primary" routerLink="/patients">
            Back to Patient List
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100%;
      background: #f8fafc;
    }

    .patient-detail-container {
      max-width: 1600px;
      margin: 0 auto;
    }

    /* Loading State */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 120px 24px;
      gap: 16px;
      color: #64748b;
    }

    /* Error State */
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 120px 24px;
      text-align: center;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #ef4444;
        margin-bottom: 16px;
      }

      h3 {
        margin: 0 0 8px;
        color: #1e293b;
      }

      p {
        margin: 0 0 24px;
        color: #64748b;
      }
    }

    /* Patient Banner */
    .patient-banner {
      background: linear-gradient(135deg, #0077b6 0%, #023e8a 100%);
      padding: 24px;
      color: white;
      animation: slideDown 0.4s ease-out;

      &.has-alerts {
        padding-bottom: 0;
      }
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .banner-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      flex-wrap: wrap;
    }

    .patient-identity {
      display: flex;
      gap: 20px;
      align-items: flex-start;
    }

    .avatar-section {
      position: relative;
    }

    .patient-avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border: 3px solid rgba(255, 255, 255, 0.4);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: white;
      }
    }

    .status-badge {
      position: absolute;
      bottom: -8px;
      left: 50%;
      transform: translateX(-50%);
      padding: 2px 12px;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;

      &.active {
        background: #22c55e;
        color: white;
      }
      &.inactive {
        background: #94a3b8;
        color: white;
      }
      &.deceased {
        background: #1e293b;
        color: white;
      }
    }

    .patient-info {
      .patient-name {
        margin: 0 0 8px;
        font-size: 1.75rem;
        font-weight: 600;
        letter-spacing: -0.02em;
      }

      .patient-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.9rem;
          opacity: 0.9;

          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
          }
        }
      }
    }

    .banner-actions {
      display: flex;
      align-items: center;
      gap: 8px;

      .action-btn {
        background: white;
        color: #0077b6;
        font-weight: 500;

        mat-icon {
          margin-right: 4px;
        }
      }

      .icon-action {
        color: white;
        opacity: 0.9;

        &:hover {
          opacity: 1;
          background: rgba(255, 255, 255, 0.1);
        }
      }
    }

    /* Alert Strip */
    .alert-strip {
      margin-top: 20px;
      padding: 12px 16px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px 8px 0 0;
    }

    .alert {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;

      &.allergy {
        mat-icon {
          color: #fbbf24;
        }

        span {
          font-weight: 500;
        }
      }
    }

    .allergy-chip {
      background: rgba(255, 255, 255, 0.2) !important;
      color: white !important;
      font-size: 0.8rem;

      mat-icon {
        font-size: 14px !important;
        width: 14px !important;
        height: 14px !important;
        color: #fbbf24 !important;
      }
    }

    /* Quick Info Section */
    .quick-info-section {
      padding: 24px;
      animation: fadeIn 0.5s ease-out 0.1s both;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }

    .info-card {
      border-radius: 16px;
      overflow: hidden;

      mat-card-header {
        padding: 16px 20px;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;

        mat-icon[mat-card-avatar] {
          background: linear-gradient(135deg, #0077b6 0%, #023e8a 100%);
          color: white;
          border-radius: 12px;
          padding: 8px;
          margin: 0;
        }

        mat-card-title {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
        }
      }

      mat-card-content {
        padding: 16px 20px;
      }
    }

    .info-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .info-row {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      font-size: 0.9rem;
      color: #374151;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #64748b;
        margin-top: 2px;
      }

      .label {
        margin-left: auto;
        font-size: 0.75rem;
        color: #94a3b8;
        text-transform: uppercase;
      }

      &.address {
        span {
          line-height: 1.5;
        }
      }

      &.small {
        font-size: 0.8rem;
        color: #64748b;
      }
    }

    .no-data {
      color: #94a3b8;
      font-size: 0.9rem;
      font-style: italic;
      margin: 0;
    }

    /* Insurance */
    .insurance-item {
      padding-bottom: 12px;
      border-bottom: 1px solid #e2e8f0;

      &:last-child {
        padding-bottom: 0;
        border-bottom: none;
      }
    }

    .insurance-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .insurance-type {
      font-weight: 600;
      color: #1e293b;
    }

    .primary-badge {
      padding: 2px 8px;
      background: #dbeafe;
      color: #1d4ed8;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .insurance-name {
      font-weight: 500;
      color: #374151;
    }

    /* Problems */
    .problem-list {
      padding: 0;

      mat-list-item {
        height: auto !important;
        padding: 8px 0 !important;
      }

      mat-icon {
        &.mild { color: #3b82f6; }
        &.moderate { color: #f59e0b; }
        &.severe { color: #ef4444; }
      }
    }

    .view-all-btn {
      width: 100%;
      margin-top: 8px;
    }

    /* Tabs Section */
    .tabs-section {
      padding: 0 24px 24px;
      animation: fadeIn 0.5s ease-out 0.2s both;
    }

    .chart-tabs {
      background: white;
      border-radius: 16px 16px 0 0;
      padding: 0 8px;
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);

      a {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 20px;
        min-width: auto;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }
    }

    mat-tab-nav-panel {
      background: white;
      border-radius: 0 0 16px 16px;
      min-height: 400px;
    }

    /* Overview Content */
    .overview-content {
      padding: 24px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 16px;
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;

      mat-icon {
        color: #0077b6;
      }
    }

    .activity-section {
      grid-column: 1;
    }

    .activity-card {
      border-radius: 12px;
    }

    .activity-list {
      padding: 0;

      mat-list-item {
        border-bottom: 1px solid #f1f5f9;

        &:last-child {
          border-bottom: none;
        }
      }

      .activity-icon {
        &.encounter { color: #0077b6; }
        &.lab { color: #8b5cf6; }
        &.prescription { color: #10b981; }
        &.appointment { color: #f59e0b; }
      }
    }

    /* Vitals */
    .vitals-section {
      grid-column: 2;
    }

    .vitals-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .vital-card {
      display: flex;
      gap: 12px;
      padding: 16px;
      background: white;
      border-radius: 12px;
      border: 1px solid #e2e8f0;

      .vital-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        flex-shrink: 0;

        &.bp { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
        &.hr { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
        &.temp { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
        &.weight { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
      }

      .vital-info {
        display: flex;
        flex-direction: column;

        .vital-value {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
        }

        .vital-label {
          font-size: 0.8rem;
          color: #64748b;
        }

        .vital-date {
          font-size: 0.7rem;
          color: #94a3b8;
          margin-top: 4px;
        }
      }
    }

    /* Consent */
    .consent-section {
      grid-column: 1 / -1;
    }

    .consent-card {
      border-radius: 12px;
      padding: 20px;
    }

    .consent-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .consent-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      border-radius: 8px;
      background: #fef2f2;
      color: #dc2626;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      &.granted {
        background: #f0fdf4;
        color: #16a34a;
      }
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .overview-content {
        grid-template-columns: 1fr;
      }

      .activity-section,
      .vitals-section,
      .consent-section {
        grid-column: 1;
      }
    }

    @media (max-width: 768px) {
      .patient-banner {
        padding: 16px;
      }

      .patient-identity {
        flex-direction: column;
        align-items: center;
        text-align: center;
        width: 100%;
      }

      .patient-meta {
        justify-content: center;
      }

      .banner-actions {
        width: 100%;
        justify-content: center;
      }

      .quick-info-section,
      .tabs-section {
        padding: 16px;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .chart-tabs {
        overflow-x: auto;

        a {
          padding: 0 12px;
          font-size: 0.85rem;
        }
      }

      .vitals-grid {
        grid-template-columns: 1fr;
      }

      .overview-content {
        padding: 16px;
      }
    }

    .text-danger {
      color: #dc2626;
    }
  `]
})
export class PatientDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly patientService = inject(PatientService);
  private readonly destroy$ = new Subject<void>();

  // Signals
  patient = signal<Patient | null>(null);
  loading = signal(true);

  // Computed
  patientFullName = computed(() => {
    const p = this.patient();
    return p ? `${p.firstName} ${p.lastName}` : '';
  });

  patientAge = computed(() => {
    const p = this.patient();
    if (!p) return 0;
    
    const today = new Date();
    const birthDate = new Date(p.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  });

  activeProblems = computed(() => {
    const p = this.patient();
    return p?.problems?.filter(prob => prob.status === 'active') || [];
  });

  hasAlerts = computed(() => {
    const p = this.patient();
    return !!(p?.allergies && p.allergies.length > 0);
  });

  ngOnInit(): void {
    this.route.params.pipe(
      switchMap(params => {
        this.loading.set(true);
        return this.patientService.getPatient(params['patientId']);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (patient) => {
        this.patient.set(patient);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading patient:', err);
        this.patient.set(null);
        this.loading.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isOverviewActive(): boolean {
    // Check if we're on the base patient detail route (no child routes)
    return !this.route.firstChild;
  }
}
