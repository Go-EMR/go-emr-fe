import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, interval, takeUntil } from 'rxjs';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ChipModule } from 'primeng/chip';
import { DividerModule } from 'primeng/divider';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { MenuModule } from 'primeng/menu';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TabViewModule } from 'primeng/tabview';
import { SkeletonModule } from 'primeng/skeleton';
import { RippleModule } from 'primeng/ripple';
import { KnobModule } from 'primeng/knob';

import { ThemeService } from '../../../core/services/theme.service';

interface Ward {
  id: string;
  name: string;
  code: string;
  type: 'general' | 'icu' | 'nicu' | 'picu' | 'ccu' | 'surgical' | 'maternity' | 'private';
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  reservedBeds: number;
  occupancyRate: number;
}

interface InPatient {
  id: string;
  patientName: string;
  mrn: string;
  age: number;
  gender: string;
  admissionDate: Date;
  admissionType: 'emergency' | 'planned' | 'transfer';
  ward: string;
  bed: string;
  attendingDoctor: string;
  diagnosis: string;
  status: 'stable' | 'critical' | 'recovering' | 'discharge-ready';
  los: number; // Length of Stay in days
  insurance: string;
  alerts: string[];
}

interface OTSchedule {
  id: string;
  time: string;
  patientName: string;
  mrn: string;
  procedure: string;
  surgeon: string;
  anesthetist: string;
  ot: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  duration: string;
}

interface DischargeCandidate {
  id: string;
  patientName: string;
  mrn: string;
  ward: string;
  bed: string;
  los: number;
  dischargeDate: Date;
  status: 'pending-clearance' | 'pending-billing' | 'pending-pharmacy' | 'ready';
  clearances: {
    medical: boolean;
    billing: boolean;
    pharmacy: boolean;
    nursing: boolean;
  };
}

@Component({
  selector: 'app-ipd-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    AvatarModule,
    BadgeModule,
    ChipModule,
    DividerModule,
    ProgressBarModule,
    TooltipModule,
    MenuModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    TabViewModule,
    SkeletonModule,
    RippleModule,
    KnobModule,
  ],
  template: `
    <div class="ipd-dashboard" [class.dark]="themeService.isDarkMode()">
      <!-- Header -->
      <header class="dashboard-header">
        <div class="header-left">
          <div class="title-group">
            <h1>
              <i class="pi pi-home"></i>
              IPD Dashboard
            </h1>
            <p-tag value="Inpatient Department" severity="success" />
          </div>
          <p class="subtitle">{{ currentDate() }} | {{ currentTime() }}</p>
        </div>
        <div class="header-actions">
          <p-button 
            label="New Admission" 
            icon="pi pi-plus"
            severity="success"
            (onClick)="showAdmissionDialog.set(true)"
          />
          <p-button 
            label="Bed Management" 
            icon="pi pi-th-large"
            [outlined]="true"
            routerLink="/ipd/beds"
          />
          <p-button 
            icon="pi pi-refresh" 
            [rounded]="true"
            [outlined]="true"
            severity="secondary"
            (onClick)="refreshData()"
            pTooltip="Refresh"
          />
        </div>
      </header>

      <!-- Key Metrics -->
      <section class="metrics-section">
        <div class="metrics-grid">
          <!-- Total Inpatients -->
          <div class="metric-card">
            <div class="metric-main">
              <p-knob 
                [(ngModel)]="occupancyDisplayValue" 
                [readonly]="true"
                [size]="100"
                valueTemplate="{value}%"
                [strokeWidth]="8"
                valueColor="#3b82f6"
                rangeColor="#e5e7eb"
              />
            </div>
            <div class="metric-info">
              <span class="metric-value">{{ totalInpatients() }}</span>
              <span class="metric-label">Total Inpatients</span>
              <span class="metric-sub">{{ totalBeds() }} total beds</span>
            </div>
          </div>

          <!-- Available Beds -->
          <div class="metric-card available">
            <div class="metric-icon">
              <i class="pi pi-check-circle"></i>
            </div>
            <div class="metric-info">
              <span class="metric-value">{{ availableBeds() }}</span>
              <span class="metric-label">Available Beds</span>
              <div class="metric-breakdown">
                <span><i class="pi pi-circle-fill icu"></i> ICU: {{ getAvailableByType('icu') }}</span>
                <span><i class="pi pi-circle-fill gen"></i> General: {{ getAvailableByType('general') }}</span>
              </div>
            </div>
          </div>

          <!-- Today's Admissions -->
          <div class="metric-card admissions">
            <div class="metric-icon">
              <i class="pi pi-sign-in"></i>
            </div>
            <div class="metric-info">
              <span class="metric-value">{{ todayAdmissions() }}</span>
              <span class="metric-label">Today's Admissions</span>
              <p-tag [value]="emergencyAdmissions() + ' emergency'" severity="danger" />
            </div>
          </div>

          <!-- Discharges -->
          <div class="metric-card discharges">
            <div class="metric-icon">
              <i class="pi pi-sign-out"></i>
            </div>
            <div class="metric-info">
              <span class="metric-value">{{ todayDischarges() }}</span>
              <span class="metric-label">Expected Discharges</span>
              <p-tag [value]="pendingDischarges() + ' pending'" severity="warn" />
            </div>
          </div>

          <!-- Critical Patients -->
          <div class="metric-card critical">
            <div class="metric-icon">
              <i class="pi pi-exclamation-triangle"></i>
            </div>
            <div class="metric-info">
              <span class="metric-value">{{ criticalPatients() }}</span>
              <span class="metric-label">Critical Patients</span>
              <p-tag value="Requires attention" severity="danger" />
            </div>
          </div>
        </div>
      </section>

      <!-- Main Content -->
      <div class="dashboard-content">
        <!-- Left: Ward Overview & Patient List -->
        <section class="main-section">
          <!-- Ward Overview -->
          <p-card styleClass="ward-card">
            <ng-template pTemplate="header">
              <div class="card-header">
                <h2>
                  <i class="pi pi-building"></i>
                  Ward Overview
                </h2>
                <p-button 
                  label="View All Wards"
                  [text]="true"
                  icon="pi pi-arrow-right"
                  iconPos="right"
                  routerLink="/ipd/wards"
                />
              </div>
            </ng-template>

            <div class="ward-grid">
              @for (ward of wards(); track ward.id) {
                <div 
                  class="ward-item" 
                  [class.critical]="ward.occupancyRate > 90"
                  [class.warning]="ward.occupancyRate > 75 && ward.occupancyRate <= 90"
                  pRipple
                >
                  <div class="ward-header">
                    <span class="ward-name">{{ ward.name }}</span>
                    <p-tag 
                      [value]="ward.type | uppercase" 
                      [severity]="getWardTypeSeverity(ward.type)"
                    />
                  </div>
                  
                  <div class="bed-visual">
                    @for (i of getBedArray(ward); track i; let idx = $index) {
                      <div 
                        class="bed-dot" 
                        [class.occupied]="idx < ward.occupiedBeds"
                        [class.reserved]="idx >= ward.occupiedBeds && idx < ward.occupiedBeds + ward.reservedBeds"
                        pTooltip="{{ getBedTooltip(ward, idx) }}"
                      ></div>
                    }
                  </div>

                  <div class="ward-stats">
                    <div class="stat">
                      <span class="num">{{ ward.availableBeds }}</span>
                      <span class="lbl">Available</span>
                    </div>
                    <div class="stat">
                      <span class="num">{{ ward.occupiedBeds }}</span>
                      <span class="lbl">Occupied</span>
                    </div>
                    <div class="stat">
                      <span class="num">{{ ward.occupancyRate }}%</span>
                      <span class="lbl">Occupancy</span>
                    </div>
                  </div>

                  <p-progressBar 
                    [value]="ward.occupancyRate"
                    [showValue]="false"
                    styleClass="ward-progress"
                  />
                </div>
              }
            </div>
          </p-card>

          <!-- Active Inpatients -->
          <p-card styleClass="patients-card">
            <ng-template pTemplate="header">
              <div class="card-header">
                <h2>
                  <i class="pi pi-users"></i>
                  Active Inpatients
                </h2>
                <div class="header-controls">
                  <p-select
                    [options]="wardOptions"
                    [(ngModel)]="selectedWard"
                    placeholder="All Wards"
                    [showClear]="true"
                    styleClass="ward-select"
                  />
                  <p-select
                    [options]="statusOptions"
                    [(ngModel)]="selectedStatus"
                    placeholder="All Status"
                    [showClear]="true"
                  />
                </div>
              </div>
            </ng-template>

            <p-table 
              [value]="filteredPatients()"
              [paginator]="true"
              [rows]="10"
              styleClass="p-datatable-sm"
              [rowHover]="true"
            >
              <ng-template pTemplate="header">
                <tr>
                  <th>Patient</th>
                  <th>Ward / Bed</th>
                  <th>Diagnosis</th>
                  <th>Doctor</th>
                  <th>LOS</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-patient>
                <tr [routerLink]="['/patients', patient.id]" class="clickable-row">
                  <td>
                    <div class="patient-cell">
                      <p-avatar 
                        [label]="getInitials(patient.patientName)"
                        shape="circle"
                        [style]="{ 'background-color': '#3b82f6', 'color': 'white' }"
                      />
                      <div class="patient-info">
                        <span class="name">{{ patient.patientName }}</span>
                        <span class="mrn">{{ patient.mrn }} | {{ patient.age }}{{ patient.gender[0] }}</span>
                      </div>
                      @if (patient.alerts.length > 0) {
                        <p-badge 
                          [value]="patient.alerts.length.toString()"
                          severity="danger"
                          pTooltip="{{ patient.alerts.join(', ') }}"
                        />
                      }
                    </div>
                  </td>
                  <td>
                    <div class="ward-cell">
                      <span class="ward">{{ patient.ward }}</span>
                      <span class="bed">Bed {{ patient.bed }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="diagnosis">{{ patient.diagnosis }}</span>
                  </td>
                  <td>{{ patient.attendingDoctor }}</td>
                  <td>
                    <span class="los" [class.long-stay]="patient.los > 7">
                      {{ patient.los }} days
                    </span>
                  </td>
                  <td>
                    <p-tag 
                      [value]="patient.status | titlecase"
                      [severity]="getStatusSeverity(patient.status)"
                    />
                  </td>
                  <td>
                    <p-button 
                      icon="pi pi-ellipsis-v"
                      [rounded]="true"
                      [text]="true"
                      severity="secondary"
                      (onClick)="$event.stopPropagation()"
                    />
                  </td>
                </tr>
              </ng-template>
              <ng-template pTemplate="emptymessage">
                <tr>
                  <td colspan="7" class="empty-message">
                    <i class="pi pi-inbox"></i>
                    <span>No patients found</span>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </p-card>
        </section>

        <!-- Right Sidebar -->
        <aside class="sidebar-section">
          <!-- Today's OT Schedule -->
          <p-card styleClass="ot-card">
            <ng-template pTemplate="header">
              <div class="card-header">
                <h3>
                  <i class="pi pi-heart"></i>
                  OT Schedule
                  <p-badge [value]="otSchedules().length.toString()" />
                </h3>
                <p-button 
                  icon="pi pi-plus"
                  [rounded]="true"
                  [text]="true"
                  size="small"
                  pTooltip="Schedule Surgery"
                />
              </div>
            </ng-template>

            <div class="ot-list">
              @for (surgery of otSchedules(); track surgery.id) {
                <div class="ot-item" [class]="surgery.status">
                  <div class="ot-time">
                    <span class="time">{{ surgery.time }}</span>
                    <span class="duration">{{ surgery.duration }}</span>
                  </div>
                  <div class="ot-info">
                    <span class="patient">{{ surgery.patientName }}</span>
                    <span class="procedure">{{ surgery.procedure }}</span>
                    <span class="surgeon"><i class="pi pi-user"></i> {{ surgery.surgeon }}</span>
                  </div>
                  <div class="ot-meta">
                    <p-tag 
                      [value]="surgery.ot" 
                      severity="secondary"
                    />
                    <p-tag 
                      [value]="surgery.status | titlecase"
                      [severity]="getOTStatusSeverity(surgery.status)"
                    />
                  </div>
                </div>
              }
            </div>
          </p-card>

          <!-- Discharge List -->
          <p-card styleClass="discharge-card">
            <ng-template pTemplate="header">
              <div class="card-header">
                <h3>
                  <i class="pi pi-sign-out"></i>
                  Pending Discharges
                  <p-badge [value]="dischargeCandidates().length.toString()" severity="warn" />
                </h3>
              </div>
            </ng-template>

            <div class="discharge-list">
              @for (patient of dischargeCandidates(); track patient.id) {
                <div class="discharge-item">
                  <div class="discharge-header">
                    <span class="patient-name">{{ patient.patientName }}</span>
                    <span class="ward-bed">{{ patient.ward }} - {{ patient.bed }}</span>
                  </div>
                  <div class="clearance-status">
                    <span 
                      class="clearance-badge" 
                      [class.done]="patient.clearances.medical"
                      pTooltip="Medical Clearance"
                    >
                      <i class="pi pi-heart"></i>
                    </span>
                    <span 
                      class="clearance-badge" 
                      [class.done]="patient.clearances.billing"
                      pTooltip="Billing Clearance"
                    >
                      <i class="pi pi-wallet"></i>
                    </span>
                    <span 
                      class="clearance-badge" 
                      [class.done]="patient.clearances.pharmacy"
                      pTooltip="Pharmacy Clearance"
                    >
                      <i class="pi pi-box"></i>
                    </span>
                    <span 
                      class="clearance-badge" 
                      [class.done]="patient.clearances.nursing"
                      pTooltip="Nursing Clearance"
                    >
                      <i class="pi pi-user"></i>
                    </span>
                  </div>
                  <div class="discharge-actions">
                    <p-button 
                      label="Process"
                      size="small"
                      [outlined]="true"
                      [disabled]="patient.status !== 'ready'"
                    />
                  </div>
                </div>
              }
            </div>
          </p-card>

          <!-- Quick Actions -->
          <p-card styleClass="actions-card">
            <ng-template pTemplate="header">
              <div class="card-header">
                <h3>
                  <i class="pi pi-bolt"></i>
                  Quick Actions
                </h3>
              </div>
            </ng-template>

            <div class="action-list">
              <button class="action-item" pRipple (click)="showAdmissionDialog.set(true)">
                <i class="pi pi-sign-in"></i>
                <span>New Admission</span>
              </button>
              <button class="action-item" pRipple routerLink="/ipd/transfer">
                <i class="pi pi-arrows-h"></i>
                <span>Transfer Patient</span>
              </button>
              <button class="action-item" pRipple routerLink="/ipd/discharge">
                <i class="pi pi-sign-out"></i>
                <span>Process Discharge</span>
              </button>
              <button class="action-item" pRipple routerLink="/ipd/beds">
                <i class="pi pi-th-large"></i>
                <span>Bed Management</span>
              </button>
              <button class="action-item" pRipple routerLink="/ipd/diet">
                <i class="pi pi-apple"></i>
                <span>Diet Management</span>
              </button>
              <button class="action-item" pRipple routerLink="/nursing/rounds">
                <i class="pi pi-clock"></i>
                <span>Nursing Rounds</span>
              </button>
            </div>
          </p-card>
        </aside>
      </div>

      <!-- Admission Dialog -->
      <p-dialog 
        header="New Patient Admission" 
        [(visible)]="showAdmissionDialog"
        [modal]="true"
        [style]="{ width: '600px' }"
      >
        <div class="admission-form">
          <p>Admission form will be implemented here with:</p>
          <ul>
            <li>Patient Search / New Registration</li>
            <li>Admission Type (Emergency / Planned / Transfer)</li>
            <li>Ward & Bed Selection</li>
            <li>Attending Doctor Assignment</li>
            <li>Insurance Verification</li>
            <li>Initial Diagnosis</li>
          </ul>
        </div>

        <ng-template pTemplate="footer">
          <p-button 
            label="Cancel" 
            [text]="true"
            severity="secondary"
            (onClick)="showAdmissionDialog.set(false)"
          />
          <p-button 
            label="Search Patient"
            icon="pi pi-search"
            routerLink="/patients"
            (onClick)="showAdmissionDialog.set(false)"
          />
          <p-button 
            label="New Patient"
            icon="pi pi-user-plus"
            routerLink="/patients/new"
            (onClick)="showAdmissionDialog.set(false)"
          />
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .ipd-dashboard {
      min-height: 100vh;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      padding: 1.5rem 2rem;
    }

    /* Header */
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .title-group {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .dashboard-header h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .dashboard-header h1 i {
      color: #3b82f6;
    }

    .subtitle {
      color: #64748b;
      margin: 0.25rem 0 0 0;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    /* Metrics */
    .metrics-section {
      margin-bottom: 1.5rem;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 1rem;
    }

    .metric-card {
      background: white;
      border-radius: 16px;
      padding: 1.25rem;
      display: flex;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      align-items: center;
    }

    .metric-main {
      flex-shrink: 0;
    }

    .metric-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .metric-card.available .metric-icon {
      background: #ecfdf5;
      color: #10b981;
    }

    .metric-card.admissions .metric-icon {
      background: #eff6ff;
      color: #3b82f6;
    }

    .metric-card.discharges .metric-icon {
      background: #fef3c7;
      color: #f59e0b;
    }

    .metric-card.critical .metric-icon {
      background: #fef2f2;
      color: #ef4444;
    }

    .metric-info {
      flex: 1;
    }

    .metric-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1e293b;
      display: block;
      line-height: 1;
    }

    .metric-label {
      font-size: 0.875rem;
      color: #64748b;
      display: block;
      margin-top: 0.25rem;
    }

    .metric-sub {
      font-size: 0.75rem;
      color: #94a3b8;
      display: block;
    }

    .metric-breakdown {
      display: flex;
      gap: 0.75rem;
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: #64748b;
    }

    .metric-breakdown i {
      font-size: 0.5rem;
      vertical-align: middle;
      margin-right: 0.25rem;
    }

    .metric-breakdown i.icu { color: #ef4444; }
    .metric-breakdown i.gen { color: #10b981; }

    /* Main Content */
    .dashboard-content {
      display: grid;
      grid-template-columns: 1fr 400px;
      gap: 1.5rem;
    }

    .main-section {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    :host ::ng-deep .ward-card,
    :host ::ng-deep .patients-card,
    :host ::ng-deep .ot-card,
    :host ::ng-deep .discharge-card,
    :host ::ng-deep .actions-card {
      border-radius: 16px;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .card-header h2,
    .card-header h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .card-header h2 i,
    .card-header h3 i {
      color: #3b82f6;
    }

    .header-controls {
      display: flex;
      gap: 0.5rem;
    }

    /* Ward Grid */
    .ward-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1rem;
      padding: 1rem;
    }

    .ward-item {
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .ward-item:hover {
      border-color: #3b82f6;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
    }

    .ward-item.warning {
      border-left: 3px solid #f59e0b;
    }

    .ward-item.critical {
      border-left: 3px solid #ef4444;
    }

    .ward-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .ward-name {
      font-weight: 600;
      color: #1e293b;
    }

    .bed-visual {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 0.75rem;
    }

    .bed-dot {
      width: 12px;
      height: 12px;
      border-radius: 3px;
      background: #d1fae5;
      border: 1px solid #a7f3d0;
    }

    .bed-dot.occupied {
      background: #fecaca;
      border-color: #fca5a5;
    }

    .bed-dot.reserved {
      background: #fef3c7;
      border-color: #fcd34d;
    }

    .ward-stats {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .ward-stats .stat {
      text-align: center;
    }

    .ward-stats .num {
      display: block;
      font-weight: 600;
      color: #1e293b;
    }

    .ward-stats .lbl {
      font-size: 0.625rem;
      color: #94a3b8;
      text-transform: uppercase;
    }

    :host ::ng-deep .ward-progress {
      height: 4px;
      border-radius: 2px;
    }

    /* Patient Table */
    .clickable-row {
      cursor: pointer;
    }

    .clickable-row:hover {
      background: #f8fafc;
    }

    .patient-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .patient-info {
      display: flex;
      flex-direction: column;
    }

    .patient-info .name {
      font-weight: 500;
      color: #1e293b;
    }

    .patient-info .mrn {
      font-size: 0.75rem;
      color: #64748b;
    }

    .ward-cell {
      display: flex;
      flex-direction: column;
    }

    .ward-cell .ward {
      font-weight: 500;
    }

    .ward-cell .bed {
      font-size: 0.75rem;
      color: #64748b;
    }

    .diagnosis {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .los {
      font-weight: 500;
    }

    .los.long-stay {
      color: #f59e0b;
    }

    .empty-message {
      text-align: center;
      padding: 2rem;
      color: #94a3b8;
    }

    .empty-message i {
      font-size: 2rem;
      display: block;
      margin-bottom: 0.5rem;
    }

    /* Sidebar */
    .sidebar-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    /* OT List */
    .ot-list {
      display: flex;
      flex-direction: column;
    }

    .ot-item {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .ot-item.in-progress {
      background: #ecfdf5;
      border-left: 3px solid #10b981;
    }

    .ot-time {
      text-align: center;
      min-width: 60px;
    }

    .ot-time .time {
      display: block;
      font-weight: 600;
      color: #1e293b;
    }

    .ot-time .duration {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .ot-info {
      flex: 1;
    }

    .ot-info .patient {
      display: block;
      font-weight: 500;
      color: #1e293b;
    }

    .ot-info .procedure {
      display: block;
      font-size: 0.875rem;
      color: #64748b;
    }

    .ot-info .surgeon {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .ot-meta {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      align-items: flex-end;
    }

    /* Discharge List */
    .discharge-list {
      display: flex;
      flex-direction: column;
    }

    .discharge-item {
      padding: 1rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .discharge-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .discharge-header .patient-name {
      font-weight: 500;
      color: #1e293b;
    }

    .discharge-header .ward-bed {
      font-size: 0.75rem;
      color: #64748b;
    }

    .clearance-status {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .clearance-badge {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: #fef2f2;
      color: #ef4444;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
    }

    .clearance-badge.done {
      background: #ecfdf5;
      color: #10b981;
    }

    .discharge-actions {
      display: flex;
      justify-content: flex-end;
    }

    /* Action List */
    .action-list {
      display: flex;
      flex-direction: column;
    }

    .action-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      background: none;
      border: none;
      border-bottom: 1px solid #f1f5f9;
      cursor: pointer;
      transition: background 0.2s;
      text-align: left;
      width: 100%;
    }

    .action-item:hover {
      background: #f8fafc;
    }

    .action-item:last-child {
      border-bottom: none;
    }

    .action-item i {
      font-size: 1.25rem;
      color: #3b82f6;
      width: 24px;
    }

    .action-item span {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }

    /* Admission Form */
    .admission-form {
      padding: 1rem;
    }

    .admission-form ul {
      margin: 0;
      padding-left: 1.5rem;
      color: #64748b;
    }

    .admission-form li {
      margin-bottom: 0.5rem;
    }

    /* Dark Mode */
    .ipd-dashboard.dark {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    }

    .dark .dashboard-header h1 {
      color: #f1f5f9;
    }

    .dark .metric-card,
    .dark .ward-item {
      background: #1e293b;
      border-color: #334155;
    }

    .dark .metric-value,
    .dark .ward-name,
    .dark .ward-stats .num,
    .dark .patient-info .name,
    .dark .ot-info .patient,
    .dark .discharge-header .patient-name {
      color: #f1f5f9;
    }

    .dark .card-header {
      border-bottom-color: #334155;
    }

    .dark .card-header h2,
    .dark .card-header h3 {
      color: #f1f5f9;
    }

    /* Responsive */
    @media (max-width: 1400px) {
      .metrics-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (max-width: 1200px) {
      .dashboard-content {
        grid-template-columns: 1fr;
      }

      .sidebar-section {
        flex-direction: row;
        flex-wrap: wrap;
      }

      .sidebar-section > * {
        flex: 1;
        min-width: 300px;
      }
    }

    @media (max-width: 768px) {
      .ipd-dashboard {
        padding: 1rem;
      }

      .metrics-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .ward-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class IpdDashboardComponent implements OnInit, OnDestroy {
  readonly themeService = inject(ThemeService);
  private readonly destroy$ = new Subject<void>();

  // Signals
  currentDate = signal('');
  currentTime = signal('');
  wards = signal<Ward[]>([]);
  inpatients = signal<InPatient[]>([]);
  otSchedules = signal<OTSchedule[]>([]);
  dischargeCandidates = signal<DischargeCandidate[]>([]);
  showAdmissionDialog = signal(false);

  // Filters
  selectedWard = '';
  selectedStatus = '';

  wardOptions = [
    { label: 'General Ward A', value: 'GWA' },
    { label: 'General Ward B', value: 'GWB' },
    { label: 'ICU', value: 'ICU' },
    { label: 'CCU', value: 'CCU' },
    { label: 'Surgical Ward', value: 'SRG' },
    { label: 'Maternity', value: 'MAT' },
  ];

  statusOptions = [
    { label: 'Stable', value: 'stable' },
    { label: 'Critical', value: 'critical' },
    { label: 'Recovering', value: 'recovering' },
    { label: 'Discharge Ready', value: 'discharge-ready' },
  ];

  // Computed values
  totalBeds = computed(() => this.wards().reduce((sum, w) => sum + w.totalBeds, 0));
  totalInpatients = computed(() => this.wards().reduce((sum, w) => sum + w.occupiedBeds, 0));
  availableBeds = computed(() => this.wards().reduce((sum, w) => sum + w.availableBeds, 0));
  totalOccupancy = computed(() => {
    const total = this.totalBeds();
    if (total === 0) return 0;
    return Math.round((this.totalInpatients() / total) * 100);
  });
  
  // For p-knob ngModel binding
  get occupancyDisplayValue(): number {
    return this.totalOccupancy();
  }
  set occupancyDisplayValue(val: number) {
    // Read-only, no-op setter for ngModel
  }
  
  todayAdmissions = signal(8);
  emergencyAdmissions = signal(3);
  todayDischarges = signal(6);
  pendingDischarges = signal(4);
  criticalPatients = computed(() => this.inpatients().filter(p => p.status === 'critical').length);

  filteredPatients = computed(() => {
    let patients = this.inpatients();
    if (this.selectedWard) {
      patients = patients.filter(p => p.ward === this.selectedWard);
    }
    if (this.selectedStatus) {
      patients = patients.filter(p => p.status === this.selectedStatus);
    }
    return patients;
  });

  ngOnInit(): void {
    this.updateDateTime();
    this.loadMockData();

    interval(1000).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.updateDateTime();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateDateTime(): void {
    const now = new Date();
    this.currentDate.set(now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }));
    this.currentTime.set(now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }));
  }

  private loadMockData(): void {
    // Wards
    this.wards.set([
      { id: '1', name: 'General Ward A', code: 'GWA', type: 'general', totalBeds: 30, occupiedBeds: 24, availableBeds: 4, reservedBeds: 2, occupancyRate: 80 },
      { id: '2', name: 'General Ward B', code: 'GWB', type: 'general', totalBeds: 30, occupiedBeds: 28, availableBeds: 1, reservedBeds: 1, occupancyRate: 93 },
      { id: '3', name: 'ICU', code: 'ICU', type: 'icu', totalBeds: 12, occupiedBeds: 10, availableBeds: 2, reservedBeds: 0, occupancyRate: 83 },
      { id: '4', name: 'CCU', code: 'CCU', type: 'ccu', totalBeds: 8, occupiedBeds: 6, availableBeds: 2, reservedBeds: 0, occupancyRate: 75 },
      { id: '5', name: 'Surgical Ward', code: 'SRG', type: 'surgical', totalBeds: 20, occupiedBeds: 15, availableBeds: 4, reservedBeds: 1, occupancyRate: 75 },
      { id: '6', name: 'Maternity', code: 'MAT', type: 'maternity', totalBeds: 15, occupiedBeds: 8, availableBeds: 7, reservedBeds: 0, occupancyRate: 53 },
    ]);

    // Inpatients
    this.inpatients.set([
      { id: '1', patientName: 'Robert Johnson', mrn: 'MRN-001', age: 65, gender: 'Male', admissionDate: new Date('2024-01-01'), admissionType: 'emergency', ward: 'ICU', bed: '102', attendingDoctor: 'Dr. Smith', diagnosis: 'Acute Myocardial Infarction', status: 'critical', los: 4, insurance: 'Medicare', alerts: ['Critical', 'Fall Risk'] },
      { id: '2', patientName: 'Mary Williams', mrn: 'MRN-002', age: 45, gender: 'Female', admissionDate: new Date('2024-01-02'), admissionType: 'planned', ward: 'SRG', bed: '205', attendingDoctor: 'Dr. Lee', diagnosis: 'Cholecystectomy', status: 'recovering', los: 3, insurance: 'Blue Cross', alerts: [] },
      { id: '3', patientName: 'James Brown', mrn: 'MRN-003', age: 72, gender: 'Male', admissionDate: new Date('2023-12-28'), admissionType: 'emergency', ward: 'GWA', bed: '110', attendingDoctor: 'Dr. Patel', diagnosis: 'Pneumonia', status: 'stable', los: 8, insurance: 'Aetna', alerts: ['Allergy'] },
      { id: '4', patientName: 'Patricia Davis', mrn: 'MRN-004', age: 58, gender: 'Female', admissionDate: new Date('2024-01-03'), admissionType: 'transfer', ward: 'CCU', bed: '301', attendingDoctor: 'Dr. Chen', diagnosis: 'Heart Failure', status: 'stable', los: 2, insurance: 'UnitedHealth', alerts: [] },
      { id: '5', patientName: 'Michael Miller', mrn: 'MRN-005', age: 40, gender: 'Male', admissionDate: new Date('2024-01-01'), admissionType: 'planned', ward: 'SRG', bed: '208', attendingDoctor: 'Dr. Kim', diagnosis: 'Appendectomy - Post-op', status: 'discharge-ready', los: 4, insurance: 'Cigna', alerts: [] },
    ]);

    // OT Schedule
    this.otSchedules.set([
      { id: '1', time: '08:00', patientName: 'John Doe', mrn: 'MRN-010', procedure: 'Knee Replacement', surgeon: 'Dr. Anderson', anesthetist: 'Dr. White', ot: 'OT-1', status: 'completed', duration: '3h' },
      { id: '2', time: '10:30', patientName: 'Jane Smith', mrn: 'MRN-015', procedure: 'Laparoscopic Cholecystectomy', surgeon: 'Dr. Lee', anesthetist: 'Dr. Brown', ot: 'OT-2', status: 'in-progress', duration: '2h' },
      { id: '3', time: '14:00', patientName: 'David Wilson', mrn: 'MRN-020', procedure: 'Hernia Repair', surgeon: 'Dr. Martinez', anesthetist: 'Dr. White', ot: 'OT-1', status: 'scheduled', duration: '1.5h' },
      { id: '4', time: '16:30', patientName: 'Sarah Taylor', mrn: 'MRN-025', procedure: 'Appendectomy', surgeon: 'Dr. Kim', anesthetist: 'Dr. Brown', ot: 'OT-3', status: 'scheduled', duration: '1h' },
    ]);

    // Discharge Candidates
    this.dischargeCandidates.set([
      { id: '1', patientName: 'Michael Miller', mrn: 'MRN-005', ward: 'SRG', bed: '208', los: 4, dischargeDate: new Date(), status: 'ready', clearances: { medical: true, billing: true, pharmacy: true, nursing: true } },
      { id: '2', patientName: 'Linda Garcia', mrn: 'MRN-006', ward: 'GWA', bed: '115', los: 5, dischargeDate: new Date(), status: 'pending-billing', clearances: { medical: true, billing: false, pharmacy: true, nursing: true } },
      { id: '3', patientName: 'Thomas Martinez', mrn: 'MRN-007', ward: 'GWB', bed: '220', los: 3, dischargeDate: new Date(), status: 'pending-pharmacy', clearances: { medical: true, billing: true, pharmacy: false, nursing: false } },
    ]);
  }

  refreshData(): void {
    this.loadMockData();
  }

  getAvailableByType(type: string): number {
    return this.wards().filter(w => w.type === type).reduce((sum, w) => sum + w.availableBeds, 0);
  }

  getBedArray(ward: Ward): number[] {
    return Array(ward.totalBeds).fill(0).map((_, i) => i);
  }

  getBedTooltip(ward: Ward, index: number): string {
    if (index < ward.occupiedBeds) return 'Occupied';
    if (index < ward.occupiedBeds + ward.reservedBeds) return 'Reserved';
    return 'Available';
  }

  getWardTypeSeverity(type: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      'general': 'success',
      'icu': 'danger',
      'ccu': 'danger',
      'nicu': 'warn',
      'picu': 'warn',
      'surgical': 'info',
      'maternity': 'success',
      'private': 'secondary',
    };
    return map[type] || 'secondary';
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      'stable': 'success',
      'critical': 'danger',
      'recovering': 'info',
      'discharge-ready': 'warn',
    };
    return map[status] || 'secondary';
  }

  getOTStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      'scheduled': 'info',
      'in-progress': 'success',
      'completed': 'secondary',
      'cancelled': 'danger',
    };
    return map[status] || 'secondary';
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
}
