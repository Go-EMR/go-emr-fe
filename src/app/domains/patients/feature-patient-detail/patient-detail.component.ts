import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { Subject, takeUntil, switchMap } from 'rxjs';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { TabMenuModule } from 'primeng/tabmenu';
import { SkeletonModule } from 'primeng/skeleton';
import { PanelModule } from 'primeng/panel';
import { TimelineModule } from 'primeng/timeline';
import { BadgeModule } from 'primeng/badge';
import { RippleModule } from 'primeng/ripple';
import { MenuItem } from 'primeng/api';

import { PatientService } from '../data-access/services/patient.service';
import { Patient } from '../data-access/models/patient.model';
import { ThemeService } from '../../../core/services/theme.service';

interface VitalSign {
  label: string;
  value: string;
  unit: string;
  icon: string;
  iconClass: string;
  date: Date;
}

interface RecentActivity {
  id: string;
  type: 'encounter' | 'lab' | 'prescription' | 'appointment';
  title: string;
  description: string;
  date: Date;
  icon: string;
}

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterOutlet,
    RouterLinkActive,
    // PrimeNG
    CardModule,
    ButtonModule,
    AvatarModule,
    TagModule,
    ChipModule,
    MenuModule,
    TooltipModule,
    DividerModule,
    TabMenuModule,
    SkeletonModule,
    PanelModule,
    TimelineModule,
    BadgeModule,
    RippleModule,
  ],
  template: `
    <div class="patient-detail" [class.dark]="themeService.isDarkMode()">
      @if (loading()) {
        <!-- Loading State -->
        <div class="loading-state">
          <div class="banner-skeleton">
            <p-skeleton shape="circle" size="80px" />
            <div class="info-skeleton">
              <p-skeleton width="200px" height="28px" />
              <p-skeleton width="300px" height="16px" />
            </div>
          </div>
          <div class="content-skeleton">
            <p-skeleton width="100%" height="200px" borderRadius="16px" />
          </div>
        </div>
      } @else if (patient()) {
        <!-- Patient Banner -->
        <header class="patient-banner" [class.has-alerts]="hasAlerts()">
          <div class="banner-content">
            <!-- Patient Identity -->
            <div class="patient-identity">
              <div class="avatar-section">
                <p-avatar 
                  [label]="patientInitials()"
                  [image]="patient()!.photoUrl || ''"
                  [style]="{ 'background-color': '#3b82f6', 'color': 'white', 'font-size': '1.5rem' }"
                  size="xlarge"
                  shape="circle"
                />
                <p-tag 
                  [value]="patient()!.status | titlecase"
                  [severity]="getStatusSeverity(patient()!.status)"
                  [rounded]="true"
                  class="status-tag"
                />
              </div>

              <div class="patient-info">
                <h1 class="patient-name">{{ patientFullName() }}</h1>
                <div class="patient-meta">
                  <span class="meta-item">
                    <i class="pi pi-id-card"></i>
                    MRN: {{ patient()!.mrn }}
                  </span>
                  <span class="meta-item">
                    <i class="pi pi-calendar"></i>
                    {{ patient()!.dateOfBirth | date:'mediumDate' }} ({{ patientAge() }} yrs)
                  </span>
                  <span class="meta-item">
                    <i [class]="'pi ' + getGenderIcon(patient()!.gender)"></i>
                    {{ patient()!.gender | titlecase }}
                  </span>
                  @if (patient()!.phone) {
                    <span class="meta-item">
                      <i class="pi pi-phone"></i>
                      {{ patient()!.phone }}
                    </span>
                  }
                </div>
              </div>
            </div>

            <!-- Banner Actions -->
            <div class="banner-actions">
              <p-button 
                label="New" 
                icon="pi pi-plus"
                (onClick)="newMenu.toggle($event)"
              />
              <p-menu #newMenu [model]="newMenuItems" [popup]="true" />

              <p-button 
                icon="pi pi-print" 
                [rounded]="true" 
                [outlined]="true"
                pTooltip="Print Chart"
                tooltipPosition="bottom"
              />
              <p-button 
                icon="pi pi-share-alt" 
                [rounded]="true" 
                [outlined]="true"
                pTooltip="Share"
                tooltipPosition="bottom"
              />
              <p-button 
                icon="pi pi-ellipsis-v" 
                [rounded]="true" 
                [outlined]="true"
                (onClick)="moreMenu.toggle($event)"
              />
              <p-menu #moreMenu [model]="moreMenuItems" [popup]="true" />
            </div>
          </div>

          <!-- Alert Strip -->
          @if (hasAlerts()) {
            <div class="alert-strip">
              <div class="alert allergy">
                <i class="pi pi-exclamation-triangle"></i>
                <span class="alert-label">Allergies:</span>
                <div class="allergy-chips">
                  @for (allergy of patient()!.allergies; track allergy.allergen) {
                    <p-chip 
                      [label]="allergy.allergen"
                      [icon]="allergy.severity === 'severe' ? 'pi pi-exclamation-circle' : ''"
                      styleClass="allergy-chip"
                    />
                  }
                </div>
              </div>
            </div>
          }
        </header>

        <!-- Quick Info Cards -->
        <section class="info-section">
          <div class="info-grid">
            <!-- Contact Info -->
            <p-card styleClass="info-card">
              <ng-template pTemplate="header">
                <div class="card-header">
                  <div class="header-icon contact">
                    <i class="pi pi-phone"></i>
                  </div>
                  <h3>Contact Information</h3>
                </div>
              </ng-template>
              <div class="info-list">
                @if (patient()!.phone) {
                  <div class="info-row">
                    <i class="pi pi-phone"></i>
                    <span class="value">{{ patient()!.phone }}</span>
                    <span class="label">Primary</span>
                  </div>
                }
                @if (patient()!.mobilePhone) {
                  <div class="info-row">
                    <i class="pi pi-mobile"></i>
                    <span class="value">{{ patient()!.mobilePhone }}</span>
                    <span class="label">Mobile</span>
                  </div>
                }
                @if (patient()!.email) {
                  <div class="info-row">
                    <i class="pi pi-envelope"></i>
                    <span class="value">{{ patient()!.email }}</span>
                  </div>
                }
                @if (patient()!.address) {
                  <div class="info-row address">
                    <i class="pi pi-map-marker"></i>
                    <span class="value">
                      {{ patient()!.address!.line1 || patient()!.address!.street1 }}<br>
                      @if (patient()!.address!.line2 || patient()!.address!.street2) {
                        {{ patient()!.address!.line2 || patient()!.address!.street2 }}<br>
                      }
                      {{ patient()!.address!.city }}, {{ patient()!.address!.state }} {{ patient()!.address!.postalCode || patient()!.address!.zipCode }}
                    </span>
                  </div>
                }
              </div>
            </p-card>

            <!-- Emergency Contact -->
            <p-card styleClass="info-card">
              <ng-template pTemplate="header">
                <div class="card-header">
                  <div class="header-icon emergency">
                    <i class="pi pi-exclamation-circle"></i>
                  </div>
                  <h3>Emergency Contact</h3>
                </div>
              </ng-template>
              @if (patient()!.emergencyContact) {
                <div class="info-list">
                  <div class="info-row">
                    <i class="pi pi-user"></i>
                    <span class="value">{{ patient()!.emergencyContact!.name }}</span>
                    <span class="label">{{ patient()!.emergencyContact!.relationship }}</span>
                  </div>
                  <div class="info-row">
                    <i class="pi pi-phone"></i>
                    <span class="value">{{ patient()!.emergencyContact!.phone }}</span>
                  </div>
                </div>
              } @else {
                <div class="no-data">
                  <i class="pi pi-info-circle"></i>
                  <span>No emergency contact on file</span>
                </div>
              }
            </p-card>

            <!-- Insurance -->
            <p-card styleClass="info-card">
              <ng-template pTemplate="header">
                <div class="card-header">
                  <div class="header-icon insurance">
                    <i class="pi pi-shield"></i>
                  </div>
                  <h3>Insurance</h3>
                </div>
              </ng-template>
              @if (patient()!.insurance && patient()!.insurance!.length > 0) {
                <div class="insurance-list">
                  @for (ins of patient()!.insurance; track ins.memberId) {
                    <div class="insurance-item">
                      <div class="insurance-header">
                        <span class="payer-name">{{ ins.payerName }}</span>
                        @if (ins.type === 'primary') {
                          <p-tag value="Primary" severity="info" [rounded]="true" />
                        }
                      </div>
                      <div class="insurance-details">
                        <span>Plan: {{ ins.planName }}</span>
                        <span>Member ID: {{ ins.memberId }}</span>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="no-data">
                  <i class="pi pi-info-circle"></i>
                  <span>No insurance on file</span>
                </div>
              }
            </p-card>

            <!-- Primary Provider -->
            <p-card styleClass="info-card">
              <ng-template pTemplate="header">
                <div class="card-header">
                  <div class="header-icon provider">
                    <i class="pi pi-user-edit"></i>
                  </div>
                  <h3>Primary Provider</h3>
                </div>
              </ng-template>
              @if (patient()!.primaryProvider) {
                <div class="provider-info">
                  <p-avatar 
                    [label]="getProviderInitials()"
                    [style]="{ 'background-color': '#10b981', 'color': 'white' }"
                    size="large"
                    shape="circle"
                  />
                  <div class="provider-details">
                    <span class="provider-name">{{ patient()!.primaryProvider!.name }}</span>
                    <span class="provider-specialty">{{ patient()!.primaryProvider!.specialty }}</span>
                    <span class="provider-npi">NPI: {{ patient()!.primaryProvider!.npi }}</span>
                  </div>
                </div>
              } @else {
                <div class="no-data">
                  <i class="pi pi-info-circle"></i>
                  <span>No primary provider assigned</span>
                </div>
              }
            </p-card>
          </div>
        </section>

        <!-- Navigation Tabs -->
        <section class="tabs-section">
          <p-tabMenu [model]="tabItems" [activeItem]="activeTab" styleClass="chart-tabs" />
        </section>

        <!-- Tab Content / Router Outlet -->
        <section class="content-section">
          @if (isOverviewActive()) {
            <!-- Overview Content -->
            <div class="overview-content">
              <!-- Recent Activity -->
              <div class="activity-panel">
                <p-panel header="Recent Activity" [toggleable]="true">
                  @if (recentActivity.length > 0) {
                    <p-timeline [value]="recentActivity" styleClass="activity-timeline">
                      <ng-template pTemplate="marker" let-activity>
                        <span class="activity-marker" [class]="activity.type">
                          <i [class]="'pi ' + activity.icon"></i>
                        </span>
                      </ng-template>
                      <ng-template pTemplate="content" let-activity>
                        <div class="activity-content">
                          <span class="activity-title">{{ activity.title }}</span>
                          <span class="activity-desc">{{ activity.description }}</span>
                          <span class="activity-date">{{ activity.date | date:'short' }}</span>
                        </div>
                      </ng-template>
                    </p-timeline>
                  } @else {
                    <div class="no-data">
                      <i class="pi pi-history"></i>
                      <span>No recent activity</span>
                    </div>
                  }
                </p-panel>
              </div>

              <!-- Vitals -->
              <div class="vitals-panel">
                <p-panel header="Latest Vitals" [toggleable]="true">
                  <div class="vitals-grid">
                    @for (vital of vitals; track vital.label) {
                      <div class="vital-card" pRipple>
                        <div class="vital-icon" [class]="vital.iconClass">
                          <i [class]="'pi ' + vital.icon"></i>
                        </div>
                        <div class="vital-info">
                          <span class="vital-value">{{ vital.value }} <small>{{ vital.unit }}</small></span>
                          <span class="vital-label">{{ vital.label }}</span>
                          <span class="vital-date">{{ vital.date | date:'shortDate' }}</span>
                        </div>
                      </div>
                    }
                  </div>
                </p-panel>
              </div>

              <!-- Active Problems -->
              <div class="problems-panel">
                <p-panel header="Active Problems" [toggleable]="true">
                  @if (activeProblems().length > 0) {
                    <div class="problems-list">
                      @for (problem of activeProblems(); track problem.id) {
                        <div class="problem-item">
                          <div class="problem-info">
                            <span class="problem-name">{{ problem.description }}</span>
                            <span class="problem-code">ICD-10: {{ problem.code }}</span>
                          </div>
                          <p-tag 
                            [value]="problem.severity || 'Unknown'" 
                            [severity]="getProblemSeverity(problem.severity)"
                            [rounded]="true"
                          />
                        </div>
                      }
                    </div>
                  } @else {
                    <div class="no-data">
                      <i class="pi pi-check-circle"></i>
                      <span>No active problems</span>
                    </div>
                  }
                </p-panel>
              </div>
            </div>
          } @else {
            <router-outlet />
          }
        </section>
      } @else {
        <!-- Error State -->
        <div class="error-state">
          <i class="pi pi-exclamation-triangle"></i>
          <h3>Patient not found</h3>
          <p>The requested patient record could not be loaded.</p>
          <p-button 
            label="Back to Patients" 
            icon="pi pi-arrow-left"
            routerLink="/patients"
          />
        </div>
      }
    </div>
  `,
  styles: [`
    .patient-detail {
      min-height: 100%;
    }

    /* Loading State */
    .loading-state {
      padding: 1.5rem;
    }

    .banner-skeleton {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 2rem;
      background: white;
      border-radius: 1rem;
      margin-bottom: 1.5rem;
    }

    .dark .banner-skeleton {
      background: #1e293b;
    }

    .info-skeleton {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .content-skeleton {
      margin-top: 1.5rem;
    }

    /* Error State */
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      text-align: center;
      padding: 2rem;
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

    /* Patient Banner */
    .patient-banner {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      padding: 1.5rem;
      color: white;
    }

    .patient-banner.has-alerts {
      padding-bottom: 0;
    }

    .banner-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 1.5rem;
      max-width: 1600px;
      margin: 0 auto;
    }

    .patient-identity {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .avatar-section {
      position: relative;
    }

    .status-tag {
      position: absolute;
      bottom: -8px;
      left: 50%;
      transform: translateX(-50%);
    }

    .patient-name {
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0 0 0.5rem;
    }

    .patient-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.9375rem;
      opacity: 0.9;
    }

    .meta-item i {
      font-size: 0.875rem;
    }

    .banner-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    :host ::ng-deep .banner-actions .p-button-outlined {
      border-color: rgba(255, 255, 255, 0.5);
      color: white;
    }

    :host ::ng-deep .banner-actions .p-button-outlined:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: white;
    }

    /* Alert Strip */
    .alert-strip {
      background: rgba(0, 0, 0, 0.2);
      margin: 1.5rem -1.5rem -0rem;
      padding: 0.75rem 1.5rem;
    }

    .alert {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .alert-label {
      font-weight: 600;
    }

    .allergy-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    :host ::ng-deep .allergy-chip {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }

    /* Info Section */
    .info-section {
      padding: 1.5rem;
      max-width: 1600px;
      margin: 0 auto;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.25rem;
    }

    :host ::ng-deep .info-card {
      border-radius: 1rem;
    }

    :host ::ng-deep .info-card .p-card-header {
      padding: 1rem 1.25rem 0;
    }

    :host ::ng-deep .info-card .p-card-body {
      padding: 1rem 1.25rem 1.25rem;
    }

    .dark :host ::ng-deep .info-card {
      background: #1e293b;
      border-color: #334155;
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .header-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header-icon i {
      font-size: 1rem;
      color: white;
    }

    .header-icon.contact { background: #3b82f6; }
    .header-icon.emergency { background: #ef4444; }
    .header-icon.insurance { background: #10b981; }
    .header-icon.provider { background: #8b5cf6; }

    .card-header h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
    }

    .dark .card-header h3 {
      color: #f1f5f9;
    }

    .info-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .info-row {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .info-row i {
      color: #64748b;
      margin-top: 2px;
    }

    .dark .info-row i {
      color: #94a3b8;
    }

    .info-row .value {
      flex: 1;
      color: #374151;
      font-size: 0.9375rem;
    }

    .dark .info-row .value {
      color: #e2e8f0;
    }

    .info-row .label {
      font-size: 0.75rem;
      color: #94a3b8;
      background: #f1f5f9;
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
    }

    .dark .info-row .label {
      background: #334155;
      color: #94a3b8;
    }

    .no-data {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #94a3b8;
      font-size: 0.875rem;
    }

    /* Insurance */
    .insurance-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .insurance-item {
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .dark .insurance-item {
      border-bottom-color: #334155;
    }

    .insurance-item:last-child {
      padding-bottom: 0;
      border-bottom: none;
    }

    .insurance-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .payer-name {
      font-weight: 500;
      color: #1e293b;
    }

    .dark .payer-name {
      color: #f1f5f9;
    }

    .insurance-details {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.8125rem;
      color: #64748b;
    }

    .dark .insurance-details {
      color: #94a3b8;
    }

    /* Provider */
    .provider-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .provider-details {
      display: flex;
      flex-direction: column;
    }

    .provider-name {
      font-weight: 600;
      color: #1e293b;
    }

    .dark .provider-name {
      color: #f1f5f9;
    }

    .provider-specialty {
      font-size: 0.875rem;
      color: #64748b;
    }

    .provider-npi {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    /* Tabs */
    .tabs-section {
      padding: 0 1.5rem;
      max-width: 1600px;
      margin: 0 auto;
      border-bottom: 1px solid #e2e8f0;
    }

    .dark .tabs-section {
      border-bottom-color: #334155;
    }

    :host ::ng-deep .chart-tabs .p-tabmenu-nav {
      border: none;
      gap: 0.5rem;
    }

    :host ::ng-deep .chart-tabs .p-tabmenuitem .p-menuitem-link {
      border-radius: 0.5rem 0.5rem 0 0;
    }

    /* Content Section */
    .content-section {
      padding: 1.5rem;
      max-width: 1600px;
      margin: 0 auto;
    }

    .overview-content {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .activity-panel {
      grid-row: span 2;
    }

    :host ::ng-deep .p-panel {
      border-radius: 1rem;
    }

    .dark :host ::ng-deep .p-panel {
      background: #1e293b;
      border-color: #334155;
    }

    .dark :host ::ng-deep .p-panel .p-panel-header {
      background: #1e293b;
      border-color: #334155;
      color: #f1f5f9;
    }

    .dark :host ::ng-deep .p-panel .p-panel-content {
      background: #1e293b;
      color: #e2e8f0;
    }

    /* Activity Timeline */
    .activity-marker {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .activity-marker i {
      font-size: 0.875rem;
      color: white;
    }

    .activity-marker.encounter { background: #3b82f6; }
    .activity-marker.lab { background: #8b5cf6; }
    .activity-marker.prescription { background: #10b981; }
    .activity-marker.appointment { background: #f59e0b; }

    .activity-content {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .activity-title {
      font-weight: 500;
      color: #1e293b;
    }

    .dark .activity-title {
      color: #f1f5f9;
    }

    .activity-desc {
      font-size: 0.875rem;
      color: #64748b;
    }

    .dark .activity-desc {
      color: #94a3b8;
    }

    .activity-date {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    /* Vitals */
    .vitals-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .vital-card {
      display: flex;
      gap: 0.75rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 0.75rem;
      cursor: pointer;
      transition: background 0.2s;
    }

    .dark .vital-card {
      background: #334155;
    }

    .vital-card:hover {
      background: #f1f5f9;
    }

    .dark .vital-card:hover {
      background: #475569;
    }

    .vital-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .vital-icon i {
      font-size: 1rem;
      color: white;
    }

    .vital-icon.bp { background: #ef4444; }
    .vital-icon.hr { background: #f59e0b; }
    .vital-icon.temp { background: #3b82f6; }
    .vital-icon.weight { background: #10b981; }

    .vital-info {
      display: flex;
      flex-direction: column;
    }

    .vital-value {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
    }

    .dark .vital-value {
      color: #f1f5f9;
    }

    .vital-value small {
      font-size: 0.75rem;
      font-weight: normal;
      color: #64748b;
    }

    .vital-label {
      font-size: 0.75rem;
      color: #64748b;
    }

    .dark .vital-label {
      color: #94a3b8;
    }

    .vital-date {
      font-size: 0.6875rem;
      color: #94a3b8;
    }

    /* Problems */
    .problems-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .problem-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: 0.5rem;
    }

    .dark .problem-item {
      background: #334155;
    }

    .problem-info {
      display: flex;
      flex-direction: column;
    }

    .problem-name {
      font-weight: 500;
      color: #1e293b;
    }

    .dark .problem-name {
      color: #f1f5f9;
    }

    .problem-code {
      font-size: 0.75rem;
      color: #64748b;
    }

    .dark .problem-code {
      color: #94a3b8;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .overview-content {
        grid-template-columns: 1fr;
      }

      .activity-panel {
        grid-row: auto;
      }
    }

    @media (max-width: 768px) {
      .patient-banner {
        padding: 1rem;
      }

      .banner-content {
        flex-direction: column;
        align-items: stretch;
      }

      .patient-identity {
        flex-direction: column;
        text-align: center;
      }

      .patient-meta {
        justify-content: center;
      }

      .banner-actions {
        justify-content: center;
      }

      .info-section,
      .tabs-section,
      .content-section {
        padding: 1rem;
      }

      .vitals-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PatientDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly patientService = inject(PatientService);
  readonly themeService = inject(ThemeService);
  private readonly destroy$ = new Subject<void>();

  // Signals
  patient = signal<Patient | null>(null);
  loading = signal(true);

  // Menu items
  newMenuItems: MenuItem[] = [
    { label: 'New Encounter', icon: 'pi pi-file-edit', routerLink: ['encounters'] },
    { label: 'Schedule Appointment', icon: 'pi pi-calendar-plus', routerLink: ['appointments'] },
    { separator: true },
    { label: 'New Prescription', icon: 'pi pi-box', routerLink: ['prescriptions'] },
    { label: 'Order Lab', icon: 'pi pi-chart-bar', routerLink: ['labs'] },
  ];

  moreMenuItems: MenuItem[] = [
    { label: 'Edit Patient', icon: 'pi pi-pencil', routerLink: ['edit'] },
    { label: 'View Audit Log', icon: 'pi pi-history' },
    { label: 'Export Record', icon: 'pi pi-download' },
    { separator: true },
    { label: 'Archive Patient', icon: 'pi pi-trash', styleClass: 'text-danger' },
  ];

  // Tab items
  tabItems: MenuItem[] = [
    { label: 'Overview', icon: 'pi pi-home', routerLink: ['./'] },
    { label: 'Encounters', icon: 'pi pi-file-edit', routerLink: ['encounters'] },
    { label: 'Problems', icon: 'pi pi-list', routerLink: ['problems'] },
    { label: 'Medications', icon: 'pi pi-box', routerLink: ['medications'] },
    { label: 'Allergies', icon: 'pi pi-exclamation-triangle', routerLink: ['allergies'] },
    { label: 'Labs', icon: 'pi pi-chart-bar', routerLink: ['labs'] },
    { label: 'Documents', icon: 'pi pi-folder', routerLink: ['documents'] },
  ];

  activeTab = this.tabItems[0];

  // Mock data
  vitals: VitalSign[] = [
    { label: 'Blood Pressure', value: '120/80', unit: 'mmHg', icon: 'pi-heart', iconClass: 'bp', date: new Date() },
    { label: 'Heart Rate', value: '72', unit: 'bpm', icon: 'pi-heart-fill', iconClass: 'hr', date: new Date() },
    { label: 'Temperature', value: '98.6', unit: '°F', icon: 'pi-sun', iconClass: 'temp', date: new Date() },
    { label: 'Weight', value: '165', unit: 'lbs', icon: 'pi-chart-line', iconClass: 'weight', date: new Date() },
  ];

  recentActivity: RecentActivity[] = [
    { id: '1', type: 'encounter', title: 'Office Visit', description: 'Annual checkup completed', date: new Date(), icon: 'pi-file-edit' },
    { id: '2', type: 'lab', title: 'Lab Results', description: 'CBC panel reviewed', date: new Date(Date.now() - 86400000), icon: 'pi-chart-bar' },
    { id: '3', type: 'prescription', title: 'Prescription', description: 'Lisinopril 10mg renewed', date: new Date(Date.now() - 172800000), icon: 'pi-box' },
  ];

  // Computed
  patientFullName = computed(() => {
    const p = this.patient();
    return p ? `${p.firstName} ${p.lastName}` : '';
  });

  patientInitials = computed(() => {
    const p = this.patient();
    return p ? `${p.firstName[0]}${p.lastName[0]}`.toUpperCase() : '';
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
      error: () => {
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
    return !this.route.firstChild;
  }

  getGenderIcon(gender: string): string {
    switch (gender) {
      case 'male': return 'pi-mars';
      case 'female': return 'pi-venus';
      default: return 'pi-user';
    }
  }

  getProviderInitials(): string {
    const p = this.patient();
    if (!p?.primaryProvider?.name) return '';
    const names = p.primaryProvider.name.split(' ');
    return names.map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    const severities: Record<string, 'success' | 'secondary' | 'danger'> = {
      active: 'success',
      inactive: 'secondary',
      deceased: 'danger',
    };
    return severities[status] || 'secondary';
  }

  getProblemSeverity(severity: string | undefined): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    const severities: Record<string, 'success' | 'warn' | 'danger'> = {
      mild: 'success',
      moderate: 'warn',
      severe: 'danger',
    };
    return severities[severity || ''] || 'secondary';
  }
}
