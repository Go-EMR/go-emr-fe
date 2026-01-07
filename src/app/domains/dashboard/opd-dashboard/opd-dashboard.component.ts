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
import { TimelineModule } from 'primeng/timeline';
import { SkeletonModule } from 'primeng/skeleton';
import { RippleModule } from 'primeng/ripple';
import { MenuItem } from 'primeng/api';

import { ThemeService } from '../../../core/services/theme.service';

interface QueuePatient {
  id: string;
  tokenNumber: string;
  patientName: string;
  patientId: string;
  mrn: string;
  appointmentTime: string;
  checkInTime: string;
  waitTime: number; // in minutes
  status: 'waiting' | 'in-consultation' | 'completed' | 'no-show';
  provider: string;
  department: string;
  visitType: string;
  priority: 'normal' | 'urgent' | 'emergency';
}

interface TodayStats {
  totalAppointments: number;
  checkedIn: number;
  inConsultation: number;
  completed: number;
  noShow: number;
  avgWaitTime: number;
}

interface DepartmentQueue {
  id: string;
  name: string;
  code: string;
  waiting: number;
  inProgress: number;
  avgWaitTime: number;
  status: 'normal' | 'busy' | 'overloaded';
}

@Component({
  selector: 'app-opd-dashboard',
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
    TimelineModule,
    SkeletonModule,
    RippleModule,
  ],
  template: `
    <div class="opd-dashboard" [class.dark]="themeService.isDarkMode()">
      <!-- Header -->
      <header class="dashboard-header">
        <div class="header-left">
          <div class="title-group">
            <h1>
              <i class="pi pi-building"></i>
              OPD Dashboard
            </h1>
            <p-tag value="Outpatient Department" severity="info" />
          </div>
          <p class="subtitle">{{ currentDate() }} | {{ currentTime() }}</p>
        </div>
        <div class="header-actions">
          <p-button 
            label="Quick Registration" 
            icon="pi pi-user-plus"
            severity="success"
            routerLink="/patients/new"
          />
          <p-button 
            label="Walk-in Patient" 
            icon="pi pi-plus"
            [outlined]="true"
            (onClick)="showWalkInDialog.set(true)"
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

      <!-- Stats Cards -->
      <section class="stats-section">
        <div class="stats-grid">
          <!-- Total Appointments -->
          <div class="stat-card primary">
            <div class="stat-icon">
              <i class="pi pi-calendar"></i>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ stats().totalAppointments }}</span>
              <span class="stat-label">Today's Appointments</span>
            </div>
            <div class="stat-progress">
              <p-progressBar 
                [value]="getCompletionPercentage()" 
                [showValue]="false"
                styleClass="stat-progress-bar"
              />
              <span class="progress-label">{{ getCompletionPercentage() }}% completed</span>
            </div>
          </div>

          <!-- Checked In -->
          <div class="stat-card success">
            <div class="stat-icon">
              <i class="pi pi-check-circle"></i>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ stats().checkedIn }}</span>
              <span class="stat-label">Checked In</span>
            </div>
            <div class="stat-badge">
              <p-tag [value]="stats().inConsultation + ' in consultation'" severity="success" />
            </div>
          </div>

          <!-- Waiting -->
          <div class="stat-card warning">
            <div class="stat-icon">
              <i class="pi pi-clock"></i>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ getWaitingCount() }}</span>
              <span class="stat-label">Waiting</span>
            </div>
            <div class="stat-badge">
              <p-tag [value]="stats().avgWaitTime + ' min avg wait'" severity="warn" />
            </div>
          </div>

          <!-- No Show -->
          <div class="stat-card danger">
            <div class="stat-icon">
              <i class="pi pi-times-circle"></i>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ stats().noShow }}</span>
              <span class="stat-label">No Show</span>
            </div>
            <div class="stat-badge">
              <p-tag [value]="getNoShowPercentage() + '%'" severity="danger" />
            </div>
          </div>
        </div>
      </section>

      <!-- Main Content -->
      <div class="dashboard-content">
        <!-- Left Column: Queue Management -->
        <section class="queue-section">
          <p-card styleClass="queue-card">
            <ng-template pTemplate="header">
              <div class="card-header">
                <h2>
                  <i class="pi pi-users"></i>
                  Patient Queue
                </h2>
                <div class="header-controls">
                  <p-select
                    [options]="departmentOptions"
                    [(ngModel)]="selectedDepartment"
                    placeholder="All Departments"
                    [showClear]="true"
                    styleClass="dept-select"
                  />
                  <p-button 
                    icon="pi pi-filter" 
                    [rounded]="true"
                    [text]="true"
                    severity="secondary"
                  />
                </div>
              </div>
            </ng-template>

            <!-- Queue List -->
            <div class="queue-list">
              @for (patient of filteredQueue(); track patient.id) {
                <div 
                  class="queue-item" 
                  [class]="patient.status"
                  [class.urgent]="patient.priority === 'urgent'"
                  [class.emergency]="patient.priority === 'emergency'"
                  pRipple
                >
                  <div class="token-badge" [class]="patient.priority">
                    <span class="token-number">{{ patient.tokenNumber }}</span>
                    @if (patient.priority !== 'normal') {
                      <i class="pi pi-exclamation-triangle priority-icon"></i>
                    }
                  </div>

                  <div class="patient-info">
                    <div class="patient-row">
                      <span class="patient-name">{{ patient.patientName }}</span>
                      <p-tag 
                        [value]="patient.status | titlecase"
                        [severity]="getStatusSeverity(patient.status)"
                        [icon]="getStatusIcon(patient.status)"
                      />
                    </div>
                    <div class="patient-meta">
                      <span><i class="pi pi-id-card"></i> {{ patient.mrn }}</span>
                      <span><i class="pi pi-clock"></i> {{ patient.appointmentTime }}</span>
                      <span><i class="pi pi-user"></i> {{ patient.provider }}</span>
                    </div>
                  </div>

                  <div class="wait-info">
                    @if (patient.status === 'waiting') {
                      <span class="wait-time" [class.long-wait]="patient.waitTime > 30">
                        {{ patient.waitTime }} min
                      </span>
                      <span class="wait-label">waiting</span>
                    }
                  </div>

                  <div class="queue-actions">
                    <p-button 
                      icon="pi pi-ellipsis-v"
                      [rounded]="true"
                      [text]="true"
                      severity="secondary"
                      (onClick)="showPatientMenu($event, patient)"
                    />
                  </div>
                </div>
              } @empty {
                <div class="empty-queue">
                  <i class="pi pi-inbox"></i>
                  <p>No patients in queue</p>
                </div>
              }
            </div>
          </p-card>
        </section>

        <!-- Right Column: Department Status & Actions -->
        <aside class="sidebar-section">
          <!-- Department Status -->
          <p-card styleClass="dept-status-card">
            <ng-template pTemplate="header">
              <div class="card-header">
                <h3>
                  <i class="pi pi-building"></i>
                  Department Status
                </h3>
              </div>
            </ng-template>

            <div class="dept-list">
              @for (dept of departments(); track dept.id) {
                <div class="dept-item" [class]="dept.status">
                  <div class="dept-info">
                    <span class="dept-name">{{ dept.name }}</span>
                    <span class="dept-code">{{ dept.code }}</span>
                  </div>
                  <div class="dept-stats">
                    <div class="dept-stat">
                      <span class="stat-num">{{ dept.waiting }}</span>
                      <span class="stat-lbl">waiting</span>
                    </div>
                    <div class="dept-stat">
                      <span class="stat-num">{{ dept.inProgress }}</span>
                      <span class="stat-lbl">in progress</span>
                    </div>
                  </div>
                  <div class="dept-indicator">
                    <span class="status-dot" [class]="dept.status"></span>
                    <span class="wait-badge">~{{ dept.avgWaitTime }}m</span>
                  </div>
                </div>
              }
            </div>
          </p-card>

          <!-- Quick Actions -->
          <p-card styleClass="quick-actions-card">
            <ng-template pTemplate="header">
              <div class="card-header">
                <h3>
                  <i class="pi pi-bolt"></i>
                  Quick Actions
                </h3>
              </div>
            </ng-template>

            <div class="action-grid">
              <button class="action-btn" routerLink="/patients/new" pRipple>
                <i class="pi pi-user-plus"></i>
                <span>New Patient</span>
              </button>
              <button class="action-btn" routerLink="/appointments/new" pRipple>
                <i class="pi pi-calendar-plus"></i>
                <span>Book Appointment</span>
              </button>
              <button class="action-btn" (click)="showWalkInDialog.set(true)" pRipple>
                <i class="pi pi-sign-in"></i>
                <span>Walk-in</span>
              </button>
              <button class="action-btn" routerLink="/encounters/new" pRipple>
                <i class="pi pi-file-edit"></i>
                <span>New Encounter</span>
              </button>
              <button class="action-btn" routerLink="/billing" pRipple>
                <i class="pi pi-wallet"></i>
                <span>Billing</span>
              </button>
              <button class="action-btn" routerLink="/labs" pRipple>
                <i class="pi pi-flask"></i>
                <span>Lab Orders</span>
              </button>
            </div>
          </p-card>

          <!-- Alerts -->
          <p-card styleClass="alerts-card">
            <ng-template pTemplate="header">
              <div class="card-header">
                <h3>
                  <i class="pi pi-bell"></i>
                  Alerts
                  <p-badge [value]="alerts().length.toString()" severity="danger" />
                </h3>
              </div>
            </ng-template>

            <div class="alerts-list">
              @for (alert of alerts(); track alert.id) {
                <div class="alert-item" [class]="alert.type">
                  <i [class]="'pi ' + alert.icon"></i>
                  <div class="alert-content">
                    <span class="alert-title">{{ alert.title }}</span>
                    <span class="alert-time">{{ alert.time }}</span>
                  </div>
                  <p-button 
                    icon="pi pi-times"
                    [rounded]="true"
                    [text]="true"
                    size="small"
                    (onClick)="dismissAlert(alert.id)"
                  />
                </div>
              } @empty {
                <div class="no-alerts">
                  <i class="pi pi-check-circle"></i>
                  <span>No pending alerts</span>
                </div>
              }
            </div>
          </p-card>
        </aside>
      </div>

      <!-- Walk-in Dialog -->
      <p-dialog 
        header="Walk-in Patient Registration" 
        [(visible)]="showWalkInDialog"
        [modal]="true"
        [style]="{ width: '500px' }"
        [draggable]="false"
      >
        <div class="walkin-form">
          <div class="form-field">
            <label>Search Existing Patient</label>
            <div class="search-input">
              <i class="pi pi-search"></i>
              <input 
                pInputText 
                placeholder="Search by name, MRN, or phone..."
                [(ngModel)]="walkInSearch"
              />
            </div>
          </div>
          <p-divider align="center">
            <span>OR</span>
          </p-divider>
          <p-button 
            label="Register New Patient" 
            icon="pi pi-user-plus"
            styleClass="w-full"
            routerLink="/patients/new"
            (onClick)="showWalkInDialog.set(false)"
          />
        </div>

        <ng-template pTemplate="footer">
          <p-button 
            label="Cancel" 
            [text]="true"
            severity="secondary"
            (onClick)="showWalkInDialog.set(false)"
          />
          <p-button 
            label="Check-in Patient" 
            icon="pi pi-check"
            [disabled]="!walkInSearch"
          />
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .opd-dashboard {
      min-height: 100vh;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
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
      color: #0c4a6e;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .dashboard-header h1 i {
      color: #0ea5e9;
    }

    .subtitle {
      color: #64748b;
      margin: 0.25rem 0 0 0;
      font-size: 0.875rem;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    /* Stats */
    .stats-section {
      margin-bottom: 1.5rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .stat-card {
      background: white;
      border-radius: 16px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      border-left: 4px solid;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .stat-card.primary { border-left-color: #3b82f6; }
    .stat-card.success { border-left-color: #10b981; }
    .stat-card.warning { border-left-color: #f59e0b; }
    .stat-card.danger { border-left-color: #ef4444; }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    .stat-card.primary .stat-icon { background: #eff6ff; color: #3b82f6; }
    .stat-card.success .stat-icon { background: #ecfdf5; color: #10b981; }
    .stat-card.warning .stat-icon { background: #fffbeb; color: #f59e0b; }
    .stat-card.danger .stat-icon { background: #fef2f2; color: #ef4444; }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: #1e293b;
      line-height: 1;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #64748b;
      margin-top: 0.25rem;
    }

    .stat-progress {
      margin-top: auto;
    }

    :host ::ng-deep .stat-progress-bar {
      height: 6px;
      border-radius: 3px;
    }

    .progress-label {
      font-size: 0.75rem;
      color: #64748b;
      display: block;
      margin-top: 0.25rem;
    }

    /* Main Content Layout */
    .dashboard-content {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 1.5rem;
    }

    /* Queue Section */
    :host ::ng-deep .queue-card {
      border-radius: 16px;
      height: fit-content;
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

    :host ::ng-deep .dept-select {
      width: 180px;
    }

    .queue-list {
      display: flex;
      flex-direction: column;
      max-height: calc(100vh - 380px);
      overflow-y: auto;
    }

    .queue-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #f1f5f9;
      cursor: pointer;
      transition: background 0.2s;
    }

    .queue-item:hover {
      background: #f8fafc;
    }

    .queue-item.in-consultation {
      background: #ecfdf5;
      border-left: 3px solid #10b981;
    }

    .queue-item.urgent {
      background: #fef3c7;
    }

    .queue-item.emergency {
      background: #fee2e2;
    }

    .token-badge {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .token-badge.urgent {
      background: linear-gradient(135deg, #f59e0b, #d97706);
    }

    .token-badge.emergency {
      background: linear-gradient(135deg, #ef4444, #dc2626);
    }

    .token-number {
      font-size: 1.25rem;
      font-weight: 700;
    }

    .priority-icon {
      font-size: 0.75rem;
      margin-top: 2px;
    }

    .patient-info {
      flex: 1;
      min-width: 0;
    }

    .patient-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.25rem;
    }

    .patient-name {
      font-weight: 600;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .patient-meta {
      display: flex;
      gap: 1rem;
      font-size: 0.8125rem;
      color: #64748b;
    }

    .patient-meta span {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .patient-meta i {
      font-size: 0.75rem;
    }

    .wait-info {
      text-align: center;
      min-width: 60px;
    }

    .wait-time {
      font-size: 1.25rem;
      font-weight: 700;
      color: #f59e0b;
      display: block;
    }

    .wait-time.long-wait {
      color: #ef4444;
    }

    .wait-label {
      font-size: 0.75rem;
      color: #64748b;
    }

    .empty-queue {
      padding: 3rem;
      text-align: center;
      color: #94a3b8;
    }

    .empty-queue i {
      font-size: 3rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    /* Sidebar */
    .sidebar-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    :host ::ng-deep .dept-status-card,
    :host ::ng-deep .quick-actions-card,
    :host ::ng-deep .alerts-card {
      border-radius: 16px;
    }

    .dept-list {
      display: flex;
      flex-direction: column;
    }

    .dept-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .dept-item:last-child {
      border-bottom: none;
    }

    .dept-info {
      flex: 1;
    }

    .dept-name {
      display: block;
      font-weight: 500;
      color: #1e293b;
      font-size: 0.875rem;
    }

    .dept-code {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .dept-stats {
      display: flex;
      gap: 1rem;
    }

    .dept-stat {
      text-align: center;
    }

    .stat-num {
      display: block;
      font-weight: 600;
      color: #1e293b;
    }

    .stat-lbl {
      font-size: 0.625rem;
      color: #94a3b8;
      text-transform: uppercase;
    }

    .dept-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
    }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    .status-dot.normal { background: #10b981; }
    .status-dot.busy { background: #f59e0b; }
    .status-dot.overloaded { background: #ef4444; }

    .wait-badge {
      font-size: 0.6875rem;
      color: #64748b;
    }

    /* Quick Actions */
    .action-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
      padding: 0.5rem;
    }

    .action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem 0.5rem;
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-btn:hover {
      background: #eff6ff;
      border-color: #93c5fd;
      transform: translateY(-2px);
    }

    .action-btn i {
      font-size: 1.25rem;
      color: #3b82f6;
    }

    .action-btn span {
      font-size: 0.75rem;
      font-weight: 500;
      color: #374151;
      text-align: center;
    }

    /* Alerts */
    .alerts-list {
      display: flex;
      flex-direction: column;
    }

    .alert-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .alert-item i {
      font-size: 1rem;
    }

    .alert-item.warning i { color: #f59e0b; }
    .alert-item.danger i { color: #ef4444; }
    .alert-item.info i { color: #3b82f6; }

    .alert-content {
      flex: 1;
    }

    .alert-title {
      display: block;
      font-size: 0.8125rem;
      color: #1e293b;
    }

    .alert-time {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .no-alerts {
      padding: 2rem;
      text-align: center;
      color: #10b981;
    }

    .no-alerts i {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    /* Walk-in Form */
    .walkin-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-field label {
      font-weight: 500;
      color: #374151;
    }

    .search-input {
      position: relative;
    }

    .search-input i {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
    }

    .search-input input {
      width: 100%;
      padding-left: 2.5rem;
    }

    /* Dark Mode */
    .opd-dashboard.dark {
      background: linear-gradient(135deg, #0c1929 0%, #1e293b 100%);
    }

    .dark .dashboard-header h1 {
      color: #f0f9ff;
    }

    .dark .stat-card {
      background: #1e293b;
    }

    .dark .stat-value {
      color: #f1f5f9;
    }

    .dark .card-header {
      border-bottom-color: #334155;
    }

    .dark .card-header h2,
    .dark .card-header h3 {
      color: #f1f5f9;
    }

    .dark .queue-item {
      border-bottom-color: #334155;
    }

    .dark .queue-item:hover {
      background: #334155;
    }

    .dark .patient-name,
    .dark .dept-name,
    .dark .stat-num {
      color: #f1f5f9;
    }

    .dark .action-btn {
      background: #1e293b;
      border-color: #334155;
    }

    .dark .action-btn:hover {
      background: #334155;
    }

    .dark .action-btn span {
      color: #e2e8f0;
    }

    /* Responsive */
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
      .opd-dashboard {
        padding: 1rem;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .header-actions {
        width: 100%;
        flex-wrap: wrap;
      }

      .action-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class OpdDashboardComponent implements OnInit, OnDestroy {
  readonly themeService = inject(ThemeService);
  private readonly destroy$ = new Subject<void>();

  // Signals
  currentDate = signal('');
  currentTime = signal('');
  stats = signal<TodayStats>({
    totalAppointments: 0,
    checkedIn: 0,
    inConsultation: 0,
    completed: 0,
    noShow: 0,
    avgWaitTime: 0,
  });
  queue = signal<QueuePatient[]>([]);
  departments = signal<DepartmentQueue[]>([]);
  alerts = signal<any[]>([]);
  showWalkInDialog = signal(false);

  // Filters
  selectedDepartment = '';
  walkInSearch = '';

  departmentOptions = [
    { label: 'General Medicine', value: 'GEN' },
    { label: 'Cardiology', value: 'CAR' },
    { label: 'Orthopedics', value: 'ORT' },
    { label: 'Pediatrics', value: 'PED' },
    { label: 'ENT', value: 'ENT' },
    { label: 'Dermatology', value: 'DER' },
  ];

  // Computed
  filteredQueue = computed(() => {
    const q = this.queue();
    if (!this.selectedDepartment) return q;
    return q.filter(p => p.department === this.selectedDepartment);
  });

  ngOnInit(): void {
    this.updateDateTime();
    this.loadMockData();
    
    // Update time every second
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
    // Mock stats
    this.stats.set({
      totalAppointments: 48,
      checkedIn: 32,
      inConsultation: 8,
      completed: 18,
      noShow: 4,
      avgWaitTime: 22,
    });

    // Mock queue
    this.queue.set([
      {
        id: '1', tokenNumber: 'A-001', patientName: 'John Smith', patientId: 'p1',
        mrn: 'MRN-2024-001', appointmentTime: '09:00 AM', checkInTime: '08:45 AM',
        waitTime: 35, status: 'waiting', provider: 'Dr. Johnson', department: 'GEN',
        visitType: 'Follow-up', priority: 'normal'
      },
      {
        id: '2', tokenNumber: 'A-002', patientName: 'Sarah Wilson', patientId: 'p2',
        mrn: 'MRN-2024-042', appointmentTime: '09:15 AM', checkInTime: '09:00 AM',
        waitTime: 20, status: 'in-consultation', provider: 'Dr. Patel', department: 'CAR',
        visitType: 'Consultation', priority: 'urgent'
      },
      {
        id: '3', tokenNumber: 'A-003', patientName: 'Michael Brown', patientId: 'p3',
        mrn: 'MRN-2024-078', appointmentTime: '09:30 AM', checkInTime: '09:20 AM',
        waitTime: 15, status: 'waiting', provider: 'Dr. Johnson', department: 'GEN',
        visitType: 'New Patient', priority: 'normal'
      },
      {
        id: '4', tokenNumber: 'E-001', patientName: 'Emily Davis', patientId: 'p4',
        mrn: 'MRN-2024-156', appointmentTime: '09:45 AM', checkInTime: '09:30 AM',
        waitTime: 5, status: 'waiting', provider: 'Dr. Lee', department: 'PED',
        visitType: 'Emergency', priority: 'emergency'
      },
    ]);

    // Mock departments
    this.departments.set([
      { id: '1', name: 'General Medicine', code: 'GEN', waiting: 8, inProgress: 3, avgWaitTime: 25, status: 'busy' },
      { id: '2', name: 'Cardiology', code: 'CAR', waiting: 4, inProgress: 2, avgWaitTime: 18, status: 'normal' },
      { id: '3', name: 'Orthopedics', code: 'ORT', waiting: 6, inProgress: 2, avgWaitTime: 30, status: 'busy' },
      { id: '4', name: 'Pediatrics', code: 'PED', waiting: 3, inProgress: 1, avgWaitTime: 15, status: 'normal' },
      { id: '5', name: 'ENT', code: 'ENT', waiting: 10, inProgress: 2, avgWaitTime: 45, status: 'overloaded' },
    ]);

    // Mock alerts
    this.alerts.set([
      { id: '1', type: 'warning', icon: 'pi-clock', title: 'Long wait time in ENT dept', time: '5 min ago' },
      { id: '2', type: 'danger', icon: 'pi-exclamation-triangle', title: 'Emergency patient arrived', time: '2 min ago' },
      { id: '3', type: 'info', icon: 'pi-info-circle', title: 'Dr. Johnson delayed by 15 min', time: '10 min ago' },
    ]);
  }

  refreshData(): void {
    this.loadMockData();
  }

  getCompletionPercentage(): number {
    const s = this.stats();
    if (s.totalAppointments === 0) return 0;
    return Math.round((s.completed / s.totalAppointments) * 100);
  }

  getWaitingCount(): number {
    const s = this.stats();
    return s.checkedIn - s.inConsultation;
  }

  getNoShowPercentage(): number {
    const s = this.stats();
    if (s.totalAppointments === 0) return 0;
    return Math.round((s.noShow / s.totalAppointments) * 100);
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      'waiting': 'warn',
      'in-consultation': 'success',
      'completed': 'info',
      'no-show': 'danger',
    };
    return map[status] || 'secondary';
  }

  getStatusIcon(status: string): string {
    const map: Record<string, string> = {
      'waiting': 'pi pi-clock',
      'in-consultation': 'pi pi-user',
      'completed': 'pi pi-check',
      'no-show': 'pi pi-times',
    };
    return map[status] || '';
  }

  showPatientMenu(event: Event, patient: QueuePatient): void {
    event.stopPropagation();
    // Would show context menu
  }

  dismissAlert(id: string): void {
    this.alerts.update(alerts => alerts.filter(a => a.id !== id));
  }
}
