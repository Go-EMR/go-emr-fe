import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { CalendarModule } from 'primeng/calendar';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { MenuModule } from 'primeng/menu';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { OverlayPanelModule, OverlayPanel } from 'primeng/overlaypanel';
import { MenuItem } from 'primeng/api';

// Services & Models
import { AppointmentService } from '../data-access/services/appointment.service';
import { ThemeService } from '../../../core/services/theme.service';
import {
  Appointment,
  AppointmentSlot,
  AppointmentType,
  getAppointmentTypeConfig,
  APPOINTMENT_TYPE_CONFIG,
} from '../data-access/models/appointment.model';

interface TimeSlotGroup {
  label: string;
  icon: string;
  slots: AppointmentSlot[];
}

interface ProviderOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-appointments-calendar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ReactiveFormsModule,
    // PrimeNG
    CardModule,
    ButtonModule,
    SelectModule,
    SelectButtonModule,
    CalendarModule,
    TooltipModule,
    RippleModule,
    TagModule,
    AvatarModule,
    BadgeModule,
    MenuModule,
    SkeletonModule,
    DialogModule,
    DividerModule,
    OverlayPanelModule,
  ],
  template: `
    <div class="appointments-calendar" [class.dark]="themeService.isDarkMode()">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="title-section">
            <h1>
              <i class="pi pi-calendar"></i>
              Appointments
            </h1>
            <p class="subtitle">Manage your schedule</p>
          </div>
          <div class="header-actions">
            <p-button
              label="New Appointment"
              icon="pi pi-plus"
              routerLink="new"
            />
          </div>
        </div>
      </header>

      <div class="main-content">
        <!-- Left Panel: Date Selection & Filters -->
        <aside class="sidebar">
          <!-- Date Selection -->
          <p-card styleClass="date-picker-card">
            <div class="calendar-header">
              <i class="pi pi-calendar"></i>
              <h3>Select Date</h3>
            </div>
            <p-calendar
              [(ngModel)]="selectedDate"
              [showIcon]="true"
              [showButtonBar]="true"
              dateFormat="DD, MM dd, yy"
              (onSelect)="onDateSelect($event)"
              styleClass="w-full date-input"
              [inputStyle]="{'width': '100%'}"
            />
          </p-card>

          <!-- Provider Filter -->
          <p-card styleClass="filter-card">
            <div class="filter-header">
              <i class="pi pi-filter"></i>
              <h3>Filters</h3>
            </div>
            <div class="filter-content">
              <label>Provider</label>
              <p-select
                [options]="providerOptions"
                [formControl]="providerControl"
                placeholder="All Providers"
                [showClear]="true"
                styleClass="w-full"
              />
            </div>
          </p-card>

          <!-- Quick Stats -->
          <p-card styleClass="stats-card">
            <div class="stats-header">
              <i class="pi pi-chart-bar"></i>
              <h3>Today's Summary</h3>
            </div>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-value">{{ todayStats().total }}</span>
                <span class="stat-label">Total</span>
              </div>
              <div class="stat-item booked">
                <span class="stat-value">{{ todayStats().booked }}</span>
                <span class="stat-label">Booked</span>
              </div>
              <div class="stat-item completed">
                <span class="stat-value">{{ todayStats().completed }}</span>
                <span class="stat-label">Completed</span>
              </div>
              <div class="stat-item available">
                <span class="stat-value">{{ todayStats().available }}</span>
                <span class="stat-label">Available</span>
              </div>
            </div>
          </p-card>
        </aside>

        <!-- Right Panel: Time Slots & Appointments -->
        <main class="content-area">
          <!-- Selected Date Header -->
          <div class="date-header">
            <div class="date-info">
              <h2>{{ selectedDate | date:'EEEE, MMMM d, yyyy' }}</h2>
              @if (isToday()) {
                <p-tag value="Today" severity="info" [rounded]="true" />
              }
            </div>
            <div class="date-nav">
              <p-button
                icon="pi pi-chevron-left"
                [rounded]="true"
                [outlined]="true"
                severity="secondary"
                (onClick)="navigatePrevious()"
                pTooltip="Previous Day"
                tooltipPosition="bottom"
              />
              <p-button
                label="Today"
                [outlined]="true"
                severity="secondary"
                (onClick)="goToToday()"
                [disabled]="isToday()"
              />
              <p-button
                icon="pi pi-chevron-right"
                [rounded]="true"
                [outlined]="true"
                severity="secondary"
                (onClick)="navigateNext()"
                pTooltip="Next Day"
                tooltipPosition="bottom"
              />
            </div>
          </div>

          <!-- Time Slots Section -->
          <p-card styleClass="slots-card">
            <div class="slots-header">
              <h3>
                <i class="pi pi-clock"></i>
                Available Time Slots
              </h3>
              <span class="slots-hint">Click a slot to book an appointment</span>
            </div>

            @if (loadingSlots()) {
              <div class="loading-slots">
                <i class="pi pi-spin pi-spinner"></i>
                <span>Loading available slots...</span>
              </div>
            } @else {
              <div class="time-slot-groups">
                @for (group of timeSlotGroups(); track group.label) {
                  <div class="slot-group">
                    <div class="group-header">
                      <i [class]="'pi ' + group.icon"></i>
                      <span>{{ group.label }}</span>
                      <span class="slot-count">{{ getAvailableCount(group.slots) }} available</span>
                    </div>
                    <div class="slots-grid">
                      @for (slot of group.slots; track slot.start) {
                        <button
                          class="time-slot-capsule"
                          [class.available]="slot.isAvailable"
                          [class.booked]="!slot.isAvailable"
                          (click)="onSlotClick(slot)"
                          [disabled]="!slot.isAvailable"
                          pRipple>
                          <span class="slot-time">{{ slot.start | date:'h:mm a' }}</span>
                          @if (!slot.isAvailable) {
                            <span class="slot-status">Booked</span>
                          }
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </p-card>

          <!-- Scheduled Appointments Section -->
          <p-card styleClass="appointments-card">
            <div class="appointments-header">
              <h3>
                <i class="pi pi-calendar-plus"></i>
                Scheduled Appointments
              </h3>
              <span class="appointments-count">{{ appointments().length }} appointments</span>
            </div>

            @if (loading()) {
              <div class="loading-appointments">
                <p-skeleton height="80px" styleClass="mb-2" />
                <p-skeleton height="80px" styleClass="mb-2" />
                <p-skeleton height="80px" />
              </div>
            } @else if (appointments().length === 0) {
              <div class="no-appointments">
                <i class="pi pi-calendar-times"></i>
                <p>No appointments scheduled for this day</p>
                <p-button
                  label="Book an Appointment"
                  icon="pi pi-plus"
                  [outlined]="true"
                  routerLink="new"
                />
              </div>
            } @else {
              <div class="appointments-list">
                @for (apt of appointments(); track apt.id) {
                  <div
                    class="appointment-card"
                    [class.in-progress]="apt.status === 'in-progress'"
                    (click)="navigateToAppointment(apt.id)"
                    pRipple>
                    <div class="apt-time-block" [style.background]="getAppointmentColor(apt)">
                      <span class="apt-time">{{ apt.start | date:'h:mm' }}</span>
                      <span class="apt-period">{{ apt.start | date:'a' }}</span>
                    </div>
                    <div class="apt-details">
                      <div class="apt-main">
                        <span class="apt-patient">{{ apt.patientName }}</span>
                        <p-tag
                          [value]="apt.status | titlecase"
                          [severity]="getStatusSeverity(apt.status)"
                          [rounded]="true"
                          class="apt-status-tag"
                        />
                      </div>
                      <div class="apt-meta">
                        <span class="apt-type">
                          <i [class]="'pi ' + getTypeIcon(apt.appointmentType)"></i>
                          {{ getTypeLabel(apt.appointmentType) }}
                        </span>
                        <span class="apt-duration">
                          <i class="pi pi-clock"></i>
                          {{ apt.duration }} min
                        </span>
                        <span class="apt-provider">
                          <i class="pi pi-user"></i>
                          {{ apt.providerName }}
                        </span>
                      </div>
                      @if (apt.reasonDescription) {
                        <div class="apt-reason">
                          {{ apt.reasonDescription }}
                        </div>
                      }
                    </div>
                    <div class="apt-actions">
                      <p-button
                        icon="pi pi-eye"
                        [rounded]="true"
                        [text]="true"
                        severity="secondary"
                        pTooltip="View Details"
                        tooltipPosition="top"
                        (onClick)="navigateToAppointment(apt.id); $event.stopPropagation()"
                      />
                      @if (apt.status === 'booked') {
                        <p-button
                          icon="pi pi-check"
                          [rounded]="true"
                          [text]="true"
                          severity="success"
                          pTooltip="Check In"
                          tooltipPosition="top"
                          (onClick)="checkInAppointment(apt); $event.stopPropagation()"
                        />
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </p-card>
        </main>
      </div>

      <!-- Legend -->
      <section class="legend-section">
        <p-card styleClass="legend-card">
          <div class="legend-content">
            <span class="legend-title">Appointment Types:</span>
            <div class="legend-items">
              @for (type of appointmentTypeConfigs.slice(0, 6); track type.type) {
                <div class="legend-item">
                  <span class="legend-color" [style.background]="type.color"></span>
                  <span class="legend-label">{{ type.label }}</span>
                </div>
              }
            </div>
          </div>
        </p-card>
      </section>
    </div>
  `,
  styles: [`
    .appointments-calendar {
      padding: 1.5rem;
      max-width: 1600px;
      margin: 0 auto;
    }

    /* Header */
    .page-header {
      margin-bottom: 1.5rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .title-section h1 {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 1.75rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }

    .dark .title-section h1 {
      color: #f1f5f9;
    }

    .title-section h1 i {
      font-size: 1.5rem;
      color: #3b82f6;
    }

    .subtitle {
      color: #64748b;
      margin: 0.25rem 0 0;
      font-size: 0.9375rem;
    }

    .dark .subtitle {
      color: #94a3b8;
    }

    /* Main Content Layout */
    .main-content {
      display: grid;
      grid-template-columns: 260px 1fr;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    /* Sidebar */
    .sidebar {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-width: 260px;
      overflow: hidden;
    }

    :host ::ng-deep .date-picker-card,
    :host ::ng-deep .filter-card,
    :host ::ng-deep .stats-card {
      border-radius: 1rem;
    }

    :host ::ng-deep .date-picker-card .p-card-body,
    :host ::ng-deep .filter-card .p-card-body,
    :host ::ng-deep .stats-card .p-card-body {
      padding: 1rem;
    }

    .dark :host ::ng-deep .date-picker-card,
    .dark :host ::ng-deep .filter-card,
    .dark :host ::ng-deep .stats-card {
      background: #1e293b;
      border-color: #334155;
    }

    .calendar-header,
    .filter-header,
    .stats-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .calendar-header h3,
    .filter-header h3,
    .stats-header h3 {
      margin: 0;
      font-size: 0.9375rem;
      font-weight: 600;
      color: #1e293b;
    }

    .dark .calendar-header h3,
    .dark .filter-header h3,
    .dark .stats-header h3 {
      color: #f1f5f9;
    }

    .filter-header i,
    .stats-header i {
      color: #3b82f6;
    }

    .filter-content label {
      display: block;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #64748b;
      margin-bottom: 0.5rem;
    }

    .dark .filter-content label {
      color: #94a3b8;
    }

    :host ::ng-deep .date-input {
      width: 100%;
    }

    :host ::ng-deep .date-input .p-datepicker-input {
      width: 100%;
      font-size: 0.9rem;
    }

    .calendar-header i {
      color: #3b82f6;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: 0.75rem;
      text-align: center;
    }

    .dark .stat-item {
      background: #334155;
    }

    .stat-item.booked {
      background: #eff6ff;
    }

    .dark .stat-item.booked {
      background: rgba(59, 130, 246, 0.2);
    }

    .stat-item.completed {
      background: #f0fdf4;
    }

    .dark .stat-item.completed {
      background: rgba(34, 197, 94, 0.2);
    }

    .stat-item.available {
      background: #fefce8;
    }

    .dark .stat-item.available {
      background: rgba(234, 179, 8, 0.2);
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
    }

    .dark .stat-value {
      color: #f1f5f9;
    }

    .stat-label {
      font-size: 0.75rem;
      color: #64748b;
      margin-top: 0.25rem;
    }

    .dark .stat-label {
      color: #94a3b8;
    }

    /* Content Area */
    .content-area {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* Date Header */
    .date-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .date-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .date-info h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
    }

    .dark .date-info h2 {
      color: #f1f5f9;
    }

    .date-nav {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* Slots Card */
    :host ::ng-deep .slots-card,
    :host ::ng-deep .appointments-card {
      border-radius: 1rem;
    }

    :host ::ng-deep .slots-card .p-card-body,
    :host ::ng-deep .appointments-card .p-card-body {
      padding: 1.25rem;
    }

    .dark :host ::ng-deep .slots-card,
    .dark :host ::ng-deep .appointments-card {
      background: #1e293b;
      border-color: #334155;
    }

    .slots-header,
    .appointments-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }

    .slots-header h3,
    .appointments-header h3 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
    }

    .dark .slots-header h3,
    .dark .appointments-header h3 {
      color: #f1f5f9;
    }

    .slots-header h3 i,
    .appointments-header h3 i {
      color: #3b82f6;
    }

    .slots-hint,
    .appointments-count {
      font-size: 0.8125rem;
      color: #64748b;
    }

    .dark .slots-hint,
    .dark .appointments-count {
      color: #94a3b8;
    }

    /* Loading States */
    .loading-slots,
    .loading-appointments {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 2rem;
      color: #64748b;
    }

    .dark .loading-slots,
    .dark .loading-appointments {
      color: #94a3b8;
    }

    .loading-slots i {
      font-size: 1.5rem;
      color: #3b82f6;
    }

    /* Time Slot Groups */
    .time-slot-groups {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .slot-group {
      background: #f8fafc;
      border-radius: 1rem;
      padding: 1rem;
    }

    .dark .slot-group {
      background: #0f172a;
    }

    .group-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .dark .group-header {
      border-bottom-color: #334155;
    }

    .group-header i {
      color: #3b82f6;
      font-size: 1rem;
    }

    .group-header span:first-of-type {
      font-weight: 600;
      color: #1e293b;
    }

    .dark .group-header span:first-of-type {
      color: #f1f5f9;
    }

    .slot-count {
      margin-left: auto;
      font-size: 0.75rem;
      color: #10b981;
      font-weight: 500;
    }

    /* Time Slot Capsules */
    .slots-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 0.625rem;
    }

    .time-slot-capsule {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 0.75rem 1rem;
      border: 2px solid transparent;
      border-radius: 2rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      min-height: 52px;
    }

    .time-slot-capsule.available {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      border-color: transparent;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
    }

    .time-slot-capsule.available:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.35);
    }

    .time-slot-capsule.available:active {
      transform: translateY(0);
    }

    .time-slot-capsule.booked {
      background: #f1f5f9;
      color: #94a3b8;
      border-color: #e2e8f0;
      cursor: not-allowed;
    }

    .dark .time-slot-capsule.booked {
      background: #1e293b;
      border-color: #334155;
      color: #64748b;
    }

    .slot-time {
      font-weight: 600;
    }

    .slot-status {
      font-size: 0.6875rem;
      font-weight: 400;
      opacity: 0.8;
      margin-top: 2px;
    }

    /* No Appointments */
    .no-appointments {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 2rem;
      text-align: center;
    }

    .no-appointments i {
      font-size: 3rem;
      color: #cbd5e1;
      margin-bottom: 1rem;
    }

    .dark .no-appointments i {
      color: #475569;
    }

    .no-appointments p {
      color: #64748b;
      margin: 0 0 1.5rem;
    }

    .dark .no-appointments p {
      color: #94a3b8;
    }

    /* Appointments List */
    .appointments-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .appointment-card {
      display: flex;
      align-items: stretch;
      gap: 1rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 1rem;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 2px solid transparent;
    }

    .dark .appointment-card {
      background: #0f172a;
    }

    .appointment-card:hover {
      background: white;
      border-color: #e2e8f0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .dark .appointment-card:hover {
      background: #1e293b;
      border-color: #334155;
    }

    .appointment-card.in-progress {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .dark .appointment-card.in-progress {
      background: rgba(59, 130, 246, 0.1);
      border-color: #3b82f6;
    }

    .apt-time-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-width: 70px;
      padding: 0.75rem;
      border-radius: 0.75rem;
      color: white;
    }

    .apt-time-block .apt-time {
      font-size: 1.25rem;
      font-weight: 700;
      line-height: 1;
    }

    .apt-time-block .apt-period {
      font-size: 0.75rem;
      font-weight: 500;
      opacity: 0.9;
      margin-top: 0.25rem;
    }

    .apt-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      min-width: 0;
    }

    .apt-main {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .apt-details .apt-patient {
      font-weight: 600;
      font-size: 1rem;
      color: #1e293b;
    }

    .dark .apt-details .apt-patient {
      color: #f1f5f9;
    }

    .apt-status-tag {
      flex-shrink: 0;
    }

    .apt-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      font-size: 0.8125rem;
      color: #64748b;
    }

    .dark .apt-meta {
      color: #94a3b8;
    }

    .apt-meta span {
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .apt-meta i {
      font-size: 0.75rem;
    }

    .apt-reason {
      font-size: 0.8125rem;
      color: #64748b;
      padding-top: 0.5rem;
      border-top: 1px solid #e2e8f0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .dark .apt-reason {
      color: #94a3b8;
      border-top-color: #334155;
    }

    .apt-actions {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 0.25rem;
    }

    /* Legend */
    .legend-section {
      margin-top: 1.5rem;
    }

    :host ::ng-deep .legend-card {
      border-radius: 1rem;
    }

    :host ::ng-deep .legend-card .p-card-body {
      padding: 0.75rem 1.25rem;
    }

    .dark :host ::ng-deep .legend-card {
      background: #1e293b;
      border-color: #334155;
    }

    .legend-content {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .legend-title {
      font-weight: 600;
      color: #374151;
      font-size: 0.875rem;
    }

    .dark .legend-title {
      color: #e2e8f0;
    }

    .legend-items {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 3px;
    }

    .legend-label {
      font-size: 0.8125rem;
      color: #64748b;
    }

    .dark .legend-label {
      color: #94a3b8;
    }

    /* Dark mode inputs */
    .dark :host ::ng-deep .p-select {
      background: #334155;
      border-color: #475569;
    }

    .dark :host ::ng-deep .p-select-label {
      color: #f1f5f9;
    }

    .dark :host ::ng-deep .p-datepicker {
      background: transparent;
    }

    .dark :host ::ng-deep .p-datepicker-header {
      background: transparent;
      border-color: #334155;
    }

    .dark :host ::ng-deep .p-datepicker table td > span {
      color: #e2e8f0;
    }

    .dark :host ::ng-deep .p-datepicker table td.p-datepicker-today > span {
      background: #3b82f6;
      color: white;
    }

    .dark :host ::ng-deep .p-datepicker table td > span:focus {
      box-shadow: 0 0 0 2px #334155, 0 0 0 4px #3b82f6;
    }

    .w-full {
      width: 100%;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .main-content {
        grid-template-columns: 1fr;
      }

      .sidebar {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
      }

      .slots-grid {
        grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
      }
    }

    @media (max-width: 768px) {
      .appointments-calendar {
        padding: 1rem;
      }

      .header-content {
        flex-direction: column;
        align-items: stretch;
      }

      .sidebar {
        grid-template-columns: 1fr;
      }

      .date-header {
        flex-direction: column;
        align-items: stretch;
      }

      .date-nav {
        justify-content: center;
      }

      .slots-grid {
        grid-template-columns: repeat(3, 1fr);
      }

      .appointment-card {
        flex-direction: column;
      }

      .apt-time-block {
        flex-direction: row;
        gap: 0.5rem;
        width: 100%;
        min-width: auto;
      }

      .apt-time-block .apt-time {
        font-size: 1rem;
      }

      .apt-actions {
        flex-direction: row;
        justify-content: flex-end;
      }

      .legend-items {
        display: none;
      }
    }
  `]
})
export class AppointmentsCalendarComponent implements OnInit, OnDestroy {
  private readonly appointmentService = inject(AppointmentService);
  private readonly router = inject(Router);
  readonly themeService = inject(ThemeService);
  private readonly destroy$ = new Subject<void>();

  // Form controls
  providerControl = new FormControl<string | null>(null);

  // Date selection
  selectedDate: Date = new Date();

  // Options
  providerOptions: ProviderOption[] = [
    { label: 'Dr. Emily Chen', value: 'prov-001' },
    { label: 'Dr. James Wilson', value: 'prov-002' },
    { label: 'Dr. Maria Garcia', value: 'prov-003' },
  ];

  appointmentTypeConfigs = APPOINTMENT_TYPE_CONFIG;

  // Signals
  appointments = signal<Appointment[]>([]);
  availableSlots = signal<AppointmentSlot[]>([]);
  loading = signal(false);
  loadingSlots = signal(false);

  // Computed - Time slot groups (Morning, Afternoon, Evening)
  timeSlotGroups = computed((): TimeSlotGroup[] => {
    const slots = this.availableSlots();

    const morning: AppointmentSlot[] = [];
    const afternoon: AppointmentSlot[] = [];
    const evening: AppointmentSlot[] = [];

    slots.forEach(slot => {
      const hour = new Date(slot.start).getHours();
      if (hour < 12) {
        morning.push(slot);
      } else if (hour < 17) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    });

    return [
      { label: 'Morning', icon: 'pi-sun', slots: morning },
      { label: 'Afternoon', icon: 'pi-cloud', slots: afternoon },
      { label: 'Evening', icon: 'pi-moon', slots: evening },
    ].filter(group => group.slots.length > 0);
  });

  // Computed - Today's statistics
  todayStats = computed(() => {
    const apts = this.appointments();
    const slots = this.availableSlots();
    const availableCount = slots.filter(s => s.isAvailable).length;

    return {
      total: apts.length,
      booked: apts.filter(a => a.status === 'booked' || a.status === 'pending').length,
      completed: apts.filter(a => a.status === 'fulfilled' || a.status === 'checked-in').length,
      available: availableCount,
    };
  });

  ngOnInit(): void {
    this.loadData();

    this.providerControl.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => this.loadData());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    this.loadAppointments();
    this.loadAvailableSlots();
  }

  private loadAppointments(): void {
    this.loading.set(true);
    const startDate = new Date(this.selectedDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(this.selectedDate);
    endDate.setHours(23, 59, 59, 999);

    this.appointmentService.getAppointmentsByDateRange(
      startDate,
      endDate,
      this.providerControl.value || undefined
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (appointments) => {
        // Sort appointments by start time
        const sorted = [...appointments].sort((a, b) =>
          new Date(a.start).getTime() - new Date(b.start).getTime()
        );
        this.appointments.set(sorted);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadAvailableSlots(): void {
    this.loadingSlots.set(true);
    const providerId = this.providerControl.value || 'prov-001';

    this.appointmentService.getAvailableSlots(
      this.selectedDate,
      providerId,
      30 // default duration
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (slots) => {
        this.availableSlots.set(slots);
        this.loadingSlots.set(false);
      },
      error: () => {
        this.availableSlots.set([]);
        this.loadingSlots.set(false);
      },
    });
  }

  isToday(): boolean {
    const today = new Date();
    return (
      this.selectedDate.getDate() === today.getDate() &&
      this.selectedDate.getMonth() === today.getMonth() &&
      this.selectedDate.getFullYear() === today.getFullYear()
    );
  }

  onDateSelect(event: Date): void {
    this.selectedDate = event;
    this.loadData();
  }

  navigatePrevious(): void {
    const newDate = new Date(this.selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    this.selectedDate = newDate;
    this.loadData();
  }

  navigateNext(): void {
    const newDate = new Date(this.selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    this.selectedDate = newDate;
    this.loadData();
  }

  goToToday(): void {
    this.selectedDate = new Date();
    this.loadData();
  }

  getAvailableCount(slots: AppointmentSlot[]): number {
    return slots.filter(s => s.isAvailable).length;
  }

  onSlotClick(slot: AppointmentSlot): void {
    if (!slot.isAvailable) return;

    this.router.navigate(['/appointments/new'], {
      queryParams: { date: slot.start.toISOString() }
    });
  }

  getAppointmentColor(apt: Appointment): string {
    const config = getAppointmentTypeConfig(apt.appointmentType);
    return config?.color || '#64748b';
  }

  getTypeLabel(type: AppointmentType): string {
    const config = getAppointmentTypeConfig(type);
    return config?.label || type;
  }

  getTypeIcon(type: AppointmentType): string {
    const icons: Record<string, string> = {
      'new-patient': 'pi-user-plus',
      'routine': 'pi-calendar',
      'followup': 'pi-replay',
      'physical': 'pi-heart',
      'wellness': 'pi-sun',
      'urgent': 'pi-exclamation-triangle',
      'procedure': 'pi-wrench',
      'telehealth': 'pi-video',
      'lab-review': 'pi-chart-bar',
      'consultation': 'pi-comments',
    };
    return icons[type] || 'pi-calendar';
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    const severities: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      proposed: 'secondary',
      pending: 'info',
      booked: 'info',
      arrived: 'success',
      'checked-in': 'success',
      'in-progress': 'warn',
      fulfilled: 'secondary',
      cancelled: 'danger',
      noshow: 'danger',
    };
    return severities[status] || 'secondary';
  }

  navigateToAppointment(id: string): void {
    this.router.navigate(['/appointments', id]);
  }

  checkInAppointment(apt: Appointment): void {
    this.appointmentService.checkIn(apt.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.loadAppointments();
      },
    });
  }
}
