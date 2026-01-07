import { Component, inject, signal, computed, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, interval } from 'rxjs';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ChipModule } from 'primeng/chip';
import { RippleModule } from 'primeng/ripple';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { MessageService, ConfirmationService } from 'primeng/api';

import { ThemeService } from '../../../core/services/theme.service';

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  patientPhone?: string;
  providerId: string;
  providerName: string;
  appointmentType: string;
  status: AppointmentStatus;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number; // minutes
  reason?: string;
  notes?: string;
  isRecurring?: boolean;
  recurringPattern?: string;
  reminders?: AppointmentReminder[];
  checkInTime?: Date;
  checkOutTime?: Date;
}

type AppointmentStatus = 'scheduled' | 'confirmed' | 'checked-in' | 'in-progress' | 'completed' | 'cancelled' | 'no-show' | 'rescheduled';

interface AppointmentReminder {
  type: 'sms' | 'email' | 'call';
  sentAt?: Date;
  status: 'pending' | 'sent' | 'failed';
}

interface Provider {
  id: string;
  name: string;
  specialty: string;
  color: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
  appointment?: Appointment;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  appointmentCount: number;
  appointments: Appointment[];
}

@Component({
  selector: 'app-appointment-calendar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    CardModule,
    ButtonModule,
    DialogModule,
    SelectModule,
    DatePickerModule,
    InputTextModule,
    TextareaModule,
    TagModule,
    AvatarModule,
    TooltipModule,
    BadgeModule,
    DividerModule,
    ToastModule,
    ConfirmDialogModule,
    AutoCompleteModule,
    ChipModule,
    RippleModule,
    ToggleButtonModule,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast />
    <p-confirmDialog />

    <div class="appointment-calendar" [class.dark]="themeService.isDarkMode()">
      <!-- Header -->
      <header class="calendar-header">
        <div class="header-left">
          <h1>
            <i class="pi pi-calendar"></i>
            Appointment Calendar
          </h1>
          <p class="subtitle">Manage patient appointments and schedules</p>
        </div>
        <div class="header-actions">
          <p-button 
            label="New Appointment" 
            icon="pi pi-plus"
            (onClick)="openNewAppointmentDialog()"
          />
          <p-button 
            icon="pi pi-print" 
            [rounded]="true"
            [outlined]="true"
            pTooltip="Print Schedule"
          />
          <p-button 
            icon="pi pi-cog" 
            [rounded]="true"
            [outlined]="true"
            pTooltip="Settings"
          />
        </div>
      </header>

      <!-- Toolbar -->
      <section class="calendar-toolbar">
        <div class="toolbar-left">
          <div class="view-toggle">
            <p-button 
              [label]="'Today'" 
              [outlined]="true"
              severity="secondary"
              (onClick)="goToToday()"
            />
            <p-button 
              icon="pi pi-chevron-left" 
              [rounded]="true"
              [text]="true"
              (onClick)="navigatePrevious()"
            />
            <p-button 
              icon="pi pi-chevron-right" 
              [rounded]="true"
              [text]="true"
              (onClick)="navigateNext()"
            />
            <span class="current-period">{{ currentPeriodLabel() }}</span>
          </div>
        </div>

        <div class="toolbar-center">
          <div class="view-buttons">
            <p-button 
              label="Day" 
              [outlined]="viewMode() !== 'day'"
              [severity]="viewMode() === 'day' ? 'primary' : 'secondary'"
              (onClick)="setViewMode('day')"
            />
            <p-button 
              label="Week" 
              [outlined]="viewMode() !== 'week'"
              [severity]="viewMode() === 'week' ? 'primary' : 'secondary'"
              (onClick)="setViewMode('week')"
            />
            <p-button 
              label="Month" 
              [outlined]="viewMode() !== 'month'"
              [severity]="viewMode() === 'month' ? 'primary' : 'secondary'"
              (onClick)="setViewMode('month')"
            />
          </div>
        </div>

        <div class="toolbar-right">
          <p-select
            [options]="providers"
            [(ngModel)]="selectedProvider"
            optionLabel="name"
            optionValue="id"
            placeholder="All Providers"
            [showClear]="true"
            styleClass="provider-filter"
          />
        </div>
      </section>

      <!-- Calendar Content -->
      <div class="calendar-content">
        <!-- Provider Legend -->
        <aside class="provider-legend">
          <h4>Providers</h4>
          <div class="legend-list">
            @for (provider of providers; track provider.id) {
              <div 
                class="legend-item" 
                [class.selected]="selectedProvider === provider.id"
                (click)="toggleProvider(provider.id)"
              >
                <span class="color-dot" [style.background-color]="provider.color"></span>
                <span class="provider-name">{{ provider.name }}</span>
                <span class="provider-specialty">{{ provider.specialty }}</span>
              </div>
            }
          </div>

          <!-- Today's Stats -->
          <div class="daily-stats">
            <h4>Today's Summary</h4>
            <div class="stat-item">
              <span class="stat-label">Scheduled</span>
              <span class="stat-value">{{ todayStats().scheduled }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Completed</span>
              <span class="stat-value success">{{ todayStats().completed }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">No Shows</span>
              <span class="stat-value danger">{{ todayStats().noShow }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Cancelled</span>
              <span class="stat-value warn">{{ todayStats().cancelled }}</span>
            </div>
          </div>
        </aside>

        <!-- Calendar Grid -->
        <main class="calendar-main">
          @switch (viewMode()) {
            @case ('day') {
              <div class="day-view">
                <div class="time-column">
                  @for (hour of hoursOfDay; track hour) {
                    <div class="time-slot-label">
                      {{ formatHour(hour) }}
                    </div>
                  }
                </div>
                <div class="appointments-column">
                  @for (hour of hoursOfDay; track hour) {
                    <div 
                      class="time-slot" 
                      [class.has-appointment]="hasAppointmentAtHour(selectedDate(), hour)"
                      (click)="onTimeSlotClick(selectedDate(), hour)"
                    >
                      @for (apt of getAppointmentsAtHour(selectedDate(), hour); track apt.id) {
                        <div 
                          class="appointment-block"
                          [style.background-color]="getProviderColor(apt.providerId)"
                          [style.height.px]="apt.duration"
                          (click)="openAppointmentDetail(apt); $event.stopPropagation()"
                          pRipple
                        >
                          <div class="apt-time">{{ apt.startTime }} - {{ apt.endTime }}</div>
                          <div class="apt-patient">{{ apt.patientName }}</div>
                          <div class="apt-type">{{ apt.appointmentType }}</div>
                          <p-tag 
                            [value]="apt.status" 
                            [severity]="getStatusSeverity(apt.status)"
                            [rounded]="true"
                          />
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            }

            @case ('week') {
              <div class="week-view">
                <div class="week-header">
                  <div class="time-header"></div>
                  @for (day of weekDays(); track day.date) {
                    <div 
                      class="day-header"
                      [class.today]="day.isToday"
                      [class.selected]="isSelectedDate(day.date)"
                    >
                      <span class="day-name">{{ day.date | date:'EEE' }}</span>
                      <span class="day-number">{{ day.date | date:'d' }}</span>
                    </div>
                  }
                </div>
                <div class="week-body">
                  <div class="time-column">
                    @for (hour of hoursOfDay; track hour) {
                      <div class="time-slot-label">{{ formatHour(hour) }}</div>
                    }
                  </div>
                  @for (day of weekDays(); track day.date) {
                    <div class="day-column" [class.today]="day.isToday">
                      @for (hour of hoursOfDay; track hour) {
                        <div 
                          class="time-slot"
                          (click)="onTimeSlotClick(day.date, hour)"
                        >
                          @for (apt of getAppointmentsAtHour(day.date, hour); track apt.id) {
                            <div 
                              class="appointment-block compact"
                              [style.background-color]="getProviderColor(apt.providerId)"
                              (click)="openAppointmentDetail(apt); $event.stopPropagation()"
                              pRipple
                              [pTooltip]="apt.patientName + ' - ' + apt.appointmentType"
                            >
                              <span class="apt-time">{{ apt.startTime }}</span>
                              <span class="apt-patient">{{ apt.patientName }}</span>
                            </div>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            }

            @case ('month') {
              <div class="month-view">
                <div class="month-header">
                  @for (day of ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; track day) {
                    <div class="weekday-header">{{ day }}</div>
                  }
                </div>
                <div class="month-grid">
                  @for (day of calendarDays(); track day.date) {
                    <div 
                      class="calendar-cell"
                      [class.other-month]="!day.isCurrentMonth"
                      [class.today]="day.isToday"
                      [class.selected]="day.isSelected"
                      (click)="selectDate(day.date)"
                    >
                      <span class="cell-date">{{ day.date | date:'d' }}</span>
                      @if (day.appointmentCount > 0) {
                        <div class="cell-appointments">
                          @for (apt of day.appointments.slice(0, 3); track apt.id) {
                            <div 
                              class="mini-appointment"
                              [style.background-color]="getProviderColor(apt.providerId)"
                              (click)="openAppointmentDetail(apt); $event.stopPropagation()"
                            >
                              {{ apt.startTime }} {{ apt.patientName.split(' ')[0] }}
                            </div>
                          }
                          @if (day.appointmentCount > 3) {
                            <div class="more-appointments">
                              +{{ day.appointmentCount - 3 }} more
                            </div>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            }
          }
        </main>
      </div>

      <!-- New/Edit Appointment Dialog -->
      <p-dialog 
        [header]="editingAppointment() ? 'Edit Appointment' : 'New Appointment'"
        [(visible)]="showAppointmentDialog"
        [modal]="true"
        [style]="{ width: '600px' }"
        [draggable]="false"
      >
        <form [formGroup]="appointmentForm" class="appointment-form">
          <!-- Patient Selection -->
          <div class="form-field">
            <label>Patient <span class="required">*</span></label>
            <p-autoComplete
              formControlName="patientSearch"
              [suggestions]="patientSearchResults()"
              (completeMethod)="searchPatients($event)"
              (onSelect)="onPatientSelect($event)"
              field="displayName"
              placeholder="Search patient..."
              styleClass="w-full"
            >
              <ng-template let-patient pTemplate="item">
                <div class="patient-option">
                  <span class="patient-name">{{ patient.firstName }} {{ patient.lastName }}</span>
                  <span class="patient-mrn">{{ patient.mrn }}</span>
                </div>
              </ng-template>
            </p-autoComplete>
            @if (selectedPatientForAppointment()) {
              <div class="selected-patient-chip">
                <p-chip 
                  [label]="selectedPatientForAppointment()!.displayName"
                  [removable]="true"
                  (onRemove)="clearSelectedPatient()"
                />
              </div>
            }
          </div>

          <!-- Provider Selection -->
          <div class="form-field">
            <label>Provider <span class="required">*</span></label>
            <p-select
              formControlName="providerId"
              [options]="providers"
              optionLabel="name"
              optionValue="id"
              placeholder="Select Provider"
              styleClass="w-full"
            />
          </div>

          <!-- Date & Time -->
          <div class="form-row">
            <div class="form-field">
              <label>Date <span class="required">*</span></label>
              <p-datepicker
                formControlName="date"
                [showIcon]="true"
                [minDate]="today"
                dateFormat="mm/dd/yy"
                styleClass="w-full"
              />
            </div>
            <div class="form-field">
              <label>Time <span class="required">*</span></label>
              <p-select
                formControlName="startTime"
                [options]="timeSlots"
                placeholder="Select Time"
                styleClass="w-full"
              />
            </div>
            <div class="form-field">
              <label>Duration</label>
              <p-select
                formControlName="duration"
                [options]="durationOptions"
                styleClass="w-full"
              />
            </div>
          </div>

          <!-- Appointment Type -->
          <div class="form-field">
            <label>Appointment Type <span class="required">*</span></label>
            <p-select
              formControlName="appointmentType"
              [options]="appointmentTypes"
              placeholder="Select Type"
              styleClass="w-full"
            />
          </div>

          <!-- Reason -->
          <div class="form-field">
            <label>Reason for Visit</label>
            <textarea 
              pInputTextarea 
              formControlName="reason"
              rows="3"
              placeholder="Enter reason for visit..."
            ></textarea>
          </div>

          <!-- Reminders -->
          <div class="form-field">
            <label>Send Reminders</label>
            <div class="reminder-options">
              <p-toggleButton 
                formControlName="smsReminder"
                onLabel="SMS" 
                offLabel="SMS"
                onIcon="pi pi-check"
                offIcon="pi pi-times"
              />
              <p-toggleButton 
                formControlName="emailReminder"
                onLabel="Email" 
                offLabel="Email"
                onIcon="pi pi-check"
                offIcon="pi pi-times"
              />
            </div>
          </div>

          <!-- Notes -->
          <div class="form-field">
            <label>Internal Notes</label>
            <textarea 
              pInputTextarea 
              formControlName="notes"
              rows="2"
              placeholder="Notes for staff..."
            ></textarea>
          </div>
        </form>

        <ng-template pTemplate="footer">
          <p-button 
            label="Cancel" 
            [text]="true"
            severity="secondary"
            (onClick)="closeAppointmentDialog()"
          />
          @if (editingAppointment()) {
            <p-button 
              label="Delete" 
              severity="danger"
              [outlined]="true"
              icon="pi pi-trash"
              (onClick)="confirmDeleteAppointment()"
            />
          }
          <p-button 
            [label]="editingAppointment() ? 'Update' : 'Schedule'"
            icon="pi pi-check"
            (onClick)="saveAppointment()"
            [disabled]="appointmentForm.invalid"
            [loading]="saving()"
          />
        </ng-template>
      </p-dialog>

      <!-- Appointment Detail Dialog -->
      <p-dialog 
        header="Appointment Details"
        [(visible)]="showDetailDialog"
        [modal]="true"
        [style]="{ width: '500px' }"
      >
        @if (selectedAppointment()) {
          <div class="appointment-detail">
            <div class="detail-header">
              <p-avatar 
                [label]="getPatientInitials(selectedAppointment()!.patientName)"
                size="xlarge"
                shape="circle"
                [style]="{ 'background-color': getProviderColor(selectedAppointment()!.providerId), 'color': 'white' }"
              />
              <div class="patient-info">
                <h3>{{ selectedAppointment()!.patientName }}</h3>
                <span class="mrn">{{ selectedAppointment()!.patientMrn }}</span>
                @if (selectedAppointment()!.patientPhone) {
                  <span class="phone"><i class="pi pi-phone"></i> {{ selectedAppointment()!.patientPhone }}</span>
                }
              </div>
              <p-tag 
                [value]="selectedAppointment()!.status | titlecase"
                [severity]="getStatusSeverity(selectedAppointment()!.status)"
              />
            </div>

            <p-divider />

            <div class="detail-content">
              <div class="detail-row">
                <i class="pi pi-calendar"></i>
                <div>
                  <strong>{{ selectedAppointment()!.date | date:'fullDate' }}</strong>
                  <span>{{ selectedAppointment()!.startTime }} - {{ selectedAppointment()!.endTime }}</span>
                </div>
              </div>
              <div class="detail-row">
                <i class="pi pi-user"></i>
                <div>
                  <strong>{{ selectedAppointment()!.providerName }}</strong>
                  <span>Provider</span>
                </div>
              </div>
              <div class="detail-row">
                <i class="pi pi-tag"></i>
                <div>
                  <strong>{{ selectedAppointment()!.appointmentType }}</strong>
                  <span>{{ selectedAppointment()!.duration }} minutes</span>
                </div>
              </div>
              @if (selectedAppointment()!.reason) {
                <div class="detail-row">
                  <i class="pi pi-file"></i>
                  <div>
                    <strong>Reason</strong>
                    <span>{{ selectedAppointment()!.reason }}</span>
                  </div>
                </div>
              }
            </div>

            <p-divider />

            <div class="detail-actions">
              @switch (selectedAppointment()!.status) {
                @case ('scheduled') {
                  <p-button label="Confirm" icon="pi pi-check" (onClick)="updateAppointmentStatus('confirmed')" />
                  <p-button label="Check In" icon="pi pi-sign-in" severity="success" (onClick)="updateAppointmentStatus('checked-in')" />
                }
                @case ('confirmed') {
                  <p-button label="Check In" icon="pi pi-sign-in" severity="success" (onClick)="updateAppointmentStatus('checked-in')" />
                }
                @case ('checked-in') {
                  <p-button label="Start" icon="pi pi-play" severity="info" (onClick)="updateAppointmentStatus('in-progress')" />
                }
                @case ('in-progress') {
                  <p-button label="Complete" icon="pi pi-check-circle" severity="success" (onClick)="updateAppointmentStatus('completed')" />
                }
              }
              <p-button label="Edit" icon="pi pi-pencil" [outlined]="true" (onClick)="editAppointment()" />
              <p-button label="Cancel" icon="pi pi-times" severity="danger" [outlined]="true" (onClick)="updateAppointmentStatus('cancelled')" />
            </div>
          </div>
        }
      </p-dialog>
    </div>
  `,
  styles: [`
    .appointment-calendar {
      min-height: 100vh;
      background: #f8fafc;
      display: flex;
      flex-direction: column;
    }

    /* Header */
    .calendar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      background: white;
      border-bottom: 1px solid #e5e7eb;
    }

    .calendar-header h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .calendar-header h1 i {
      color: #3b82f6;
    }

    .subtitle {
      margin: 0.25rem 0 0;
      color: #64748b;
      font-size: 0.875rem;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    /* Toolbar */
    .calendar-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      background: white;
      border-bottom: 1px solid #e5e7eb;
    }

    .view-toggle {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .current-period {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
      min-width: 200px;
    }

    .view-buttons {
      display: flex;
      gap: 0.25rem;
    }

    :host ::ng-deep .provider-filter {
      min-width: 200px;
    }

    /* Calendar Content */
    .calendar-content {
      display: grid;
      grid-template-columns: 240px 1fr;
      flex: 1;
      overflow: hidden;
    }

    /* Provider Legend */
    .provider-legend {
      background: white;
      border-right: 1px solid #e5e7eb;
      padding: 1rem;
      overflow-y: auto;
    }

    .provider-legend h4 {
      margin: 0 0 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .legend-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .legend-item:hover {
      background: #f1f5f9;
    }

    .legend-item.selected {
      background: #eff6ff;
    }

    .color-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .provider-name {
      font-weight: 500;
      color: #1e293b;
      font-size: 0.875rem;
    }

    .provider-specialty {
      font-size: 0.75rem;
      color: #64748b;
      margin-left: auto;
    }

    /* Daily Stats */
    .daily-stats {
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
    }

    .stat-item {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      font-size: 0.875rem;
    }

    .stat-label {
      color: #64748b;
    }

    .stat-value {
      font-weight: 600;
      color: #1e293b;
    }

    .stat-value.success { color: #10b981; }
    .stat-value.danger { color: #ef4444; }
    .stat-value.warn { color: #f59e0b; }

    /* Calendar Main */
    .calendar-main {
      overflow: auto;
      background: white;
    }

    /* Day View */
    .day-view {
      display: grid;
      grid-template-columns: 80px 1fr;
      height: 100%;
    }

    .time-column {
      border-right: 1px solid #e5e7eb;
    }

    .time-slot-label {
      height: 60px;
      padding: 0.5rem;
      font-size: 0.75rem;
      color: #64748b;
      text-align: right;
      border-bottom: 1px solid #f1f5f9;
    }

    .appointments-column {
      position: relative;
    }

    .time-slot {
      height: 60px;
      border-bottom: 1px solid #f1f5f9;
      position: relative;
      cursor: pointer;
    }

    .time-slot:hover {
      background: #f8fafc;
    }

    .appointment-block {
      position: absolute;
      left: 4px;
      right: 4px;
      border-radius: 6px;
      padding: 0.5rem;
      color: white;
      font-size: 0.75rem;
      cursor: pointer;
      overflow: hidden;
      z-index: 1;
    }

    .apt-time {
      font-weight: 600;
    }

    .apt-patient {
      font-weight: 500;
      margin-top: 0.25rem;
    }

    .apt-type {
      opacity: 0.9;
      font-size: 0.6875rem;
    }

    /* Week View */
    .week-view {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .week-header {
      display: grid;
      grid-template-columns: 80px repeat(7, 1fr);
      border-bottom: 1px solid #e5e7eb;
      background: #f8fafc;
    }

    .time-header {
      border-right: 1px solid #e5e7eb;
    }

    .day-header {
      padding: 0.75rem;
      text-align: center;
      border-right: 1px solid #e5e7eb;
    }

    .day-header.today {
      background: #eff6ff;
    }

    .day-name {
      display: block;
      font-size: 0.75rem;
      color: #64748b;
      text-transform: uppercase;
    }

    .day-number {
      display: block;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
    }

    .week-body {
      display: grid;
      grid-template-columns: 80px repeat(7, 1fr);
      flex: 1;
      overflow-y: auto;
    }

    .day-column {
      border-right: 1px solid #e5e7eb;
    }

    .day-column.today {
      background: #fefce8;
    }

    .appointment-block.compact {
      position: relative;
      margin: 2px;
      padding: 0.25rem 0.5rem;
      font-size: 0.6875rem;
      height: auto;
    }

    /* Month View */
    .month-view {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .month-header {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      background: #f8fafc;
      border-bottom: 1px solid #e5e7eb;
    }

    .weekday-header {
      padding: 0.75rem;
      text-align: center;
      font-weight: 600;
      font-size: 0.75rem;
      color: #64748b;
      text-transform: uppercase;
    }

    .month-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      grid-auto-rows: minmax(100px, 1fr);
      flex: 1;
    }

    .calendar-cell {
      border-right: 1px solid #e5e7eb;
      border-bottom: 1px solid #e5e7eb;
      padding: 0.5rem;
      cursor: pointer;
      transition: background 0.2s;
    }

    .calendar-cell:hover {
      background: #f8fafc;
    }

    .calendar-cell.other-month {
      background: #f8fafc;
    }

    .calendar-cell.other-month .cell-date {
      color: #94a3b8;
    }

    .calendar-cell.today {
      background: #eff6ff;
    }

    .calendar-cell.selected {
      background: #dbeafe;
    }

    .cell-date {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.875rem;
    }

    .cell-appointments {
      margin-top: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .mini-appointment {
      font-size: 0.6875rem;
      padding: 2px 4px;
      border-radius: 4px;
      color: white;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .more-appointments {
      font-size: 0.6875rem;
      color: #64748b;
      text-align: center;
    }

    /* Form Styles */
    .appointment-form {
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
      font-size: 0.875rem;
    }

    .required {
      color: #ef4444;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    .patient-option {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem;
    }

    .patient-mrn {
      color: #64748b;
      font-size: 0.875rem;
    }

    .selected-patient-chip {
      margin-top: 0.5rem;
    }

    .reminder-options {
      display: flex;
      gap: 0.5rem;
    }

    /* Detail Dialog */
    .appointment-detail {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .detail-header {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .detail-header .patient-info {
      flex: 1;
    }

    .detail-header h3 {
      margin: 0;
      font-size: 1.25rem;
      color: #1e293b;
    }

    .detail-header .mrn,
    .detail-header .phone {
      display: block;
      font-size: 0.875rem;
      color: #64748b;
    }

    .detail-content {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .detail-row {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .detail-row i {
      color: #3b82f6;
      margin-top: 0.25rem;
    }

    .detail-row strong {
      display: block;
      color: #1e293b;
    }

    .detail-row span {
      font-size: 0.875rem;
      color: #64748b;
    }

    .detail-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    /* Dark Mode */
    .appointment-calendar.dark {
      background: #0f172a;
    }

    .dark .calendar-header,
    .dark .calendar-toolbar,
    .dark .provider-legend,
    .dark .calendar-main {
      background: #1e293b;
      border-color: #334155;
    }

    .dark .calendar-header h1,
    .dark .current-period,
    .dark .provider-name,
    .dark .stat-value,
    .dark .day-number,
    .dark .cell-date {
      color: #f1f5f9;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .calendar-content {
        grid-template-columns: 1fr;
      }

      .provider-legend {
        display: none;
      }

      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AppointmentCalendarComponent implements OnInit, OnDestroy {
  readonly themeService = inject(ThemeService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();

  // Signals
  viewMode = signal<'day' | 'week' | 'month'>('week');
  selectedDate = signal(new Date());
  appointments = signal<Appointment[]>([]);
  showAppointmentDialog = signal(false);
  showDetailDialog = signal(false);
  editingAppointment = signal<Appointment | null>(null);
  selectedAppointment = signal<Appointment | null>(null);
  saving = signal(false);
  patientSearchResults = signal<any[]>([]);
  selectedPatientForAppointment = signal<any>(null);

  // Form
  appointmentForm!: FormGroup;
  today = new Date();

  // Data
  selectedProvider = '';
  hoursOfDay = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 8 PM

  providers: Provider[] = [
    { id: 'p1', name: 'Dr. Smith', specialty: 'General', color: '#3b82f6' },
    { id: 'p2', name: 'Dr. Johnson', specialty: 'Cardiology', color: '#10b981' },
    { id: 'p3', name: 'Dr. Williams', specialty: 'Pediatrics', color: '#f59e0b' },
    { id: 'p4', name: 'Dr. Brown', specialty: 'Orthopedics', color: '#8b5cf6' },
  ];

  appointmentTypes = [
    { label: 'New Patient', value: 'New Patient' },
    { label: 'Follow Up', value: 'Follow Up' },
    { label: 'Annual Physical', value: 'Annual Physical' },
    { label: 'Consultation', value: 'Consultation' },
    { label: 'Procedure', value: 'Procedure' },
    { label: 'Urgent Care', value: 'Urgent Care' },
  ];

  timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8;
    const min = i % 2 === 0 ? '00' : '30';
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour;
    return { label: `${displayHour}:${min} ${period}`, value: `${hour.toString().padStart(2, '0')}:${min}` };
  });

  durationOptions = [
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
    { label: '45 min', value: 45 },
    { label: '60 min', value: 60 },
    { label: '90 min', value: 90 },
  ];

  // Computed
  currentPeriodLabel = computed(() => {
    const date = this.selectedDate();
    switch (this.viewMode()) {
      case 'day':
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      case 'week':
        const start = this.getWeekStart(date);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'month':
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  });

  weekDays = computed(() => {
    const start = this.getWeekStart(this.selectedDate());
    const days: { date: Date; isToday: boolean }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      days.push({
        date,
        isToday: date.getTime() === today.getTime(),
      });
    }
    return days;
  });

  calendarDays = computed(() => {
    const date = this.selectedDate();
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: CalendarDay[] = [];

    // Previous month days
    const startDay = firstDay.getDay();
    for (let i = startDay - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push(this.createCalendarDay(d, false, today));
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      days.push(this.createCalendarDay(d, true, today));
    }

    // Next month days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push(this.createCalendarDay(d, false, today));
    }

    return days;
  });

  todayStats = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAppts = this.appointments().filter(a => {
      const aptDate = new Date(a.date);
      aptDate.setHours(0, 0, 0, 0);
      return aptDate.getTime() === today.getTime();
    });

    return {
      scheduled: todayAppts.filter(a => ['scheduled', 'confirmed'].includes(a.status)).length,
      completed: todayAppts.filter(a => a.status === 'completed').length,
      noShow: todayAppts.filter(a => a.status === 'no-show').length,
      cancelled: todayAppts.filter(a => a.status === 'cancelled').length,
    };
  });

  ngOnInit(): void {
    this.initForm();
    this.loadMockData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.appointmentForm = this.fb.group({
      patientSearch: [''],
      patientId: ['', Validators.required],
      providerId: ['', Validators.required],
      date: [new Date(), Validators.required],
      startTime: ['', Validators.required],
      duration: [30],
      appointmentType: ['', Validators.required],
      reason: [''],
      notes: [''],
      smsReminder: [true],
      emailReminder: [true],
    });
  }

  private loadMockData(): void {
    const today = new Date();
    const appointments: Appointment[] = [
      {
        id: '1', patientId: 'pt1', patientName: 'John Smith', patientMrn: 'MRN-001', patientPhone: '(555) 123-4567',
        providerId: 'p1', providerName: 'Dr. Smith', appointmentType: 'Follow Up', status: 'confirmed',
        date: today, startTime: '09:00', endTime: '09:30', duration: 30, reason: 'Blood pressure check'
      },
      {
        id: '2', patientId: 'pt2', patientName: 'Sarah Johnson', patientMrn: 'MRN-002', patientPhone: '(555) 234-5678',
        providerId: 'p2', providerName: 'Dr. Johnson', appointmentType: 'New Patient', status: 'scheduled',
        date: today, startTime: '10:00', endTime: '11:00', duration: 60, reason: 'Initial consultation'
      },
      {
        id: '3', patientId: 'pt3', patientName: 'Mike Williams', patientMrn: 'MRN-003',
        providerId: 'p1', providerName: 'Dr. Smith', appointmentType: 'Annual Physical', status: 'checked-in',
        date: today, startTime: '11:00', endTime: '12:00', duration: 60
      },
      {
        id: '4', patientId: 'pt4', patientName: 'Emily Davis', patientMrn: 'MRN-004',
        providerId: 'p3', providerName: 'Dr. Williams', appointmentType: 'Follow Up', status: 'completed',
        date: today, startTime: '08:30', endTime: '09:00', duration: 30
      },
    ];

    this.appointments.set(appointments);
  }

  private createCalendarDay(date: Date, isCurrentMonth: boolean, today: Date): CalendarDay {
    const selected = this.selectedDate();
    selected.setHours(0, 0, 0, 0);
    const dayAppts = this.appointments().filter(a => {
      const aptDate = new Date(a.date);
      aptDate.setHours(0, 0, 0, 0);
      return aptDate.getTime() === date.getTime();
    });

    return {
      date,
      isCurrentMonth,
      isToday: date.getTime() === today.getTime(),
      isSelected: date.getTime() === selected.getTime(),
      appointmentCount: dayAppts.length,
      appointments: dayAppts,
    };
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  setViewMode(mode: 'day' | 'week' | 'month'): void {
    this.viewMode.set(mode);
  }

  goToToday(): void {
    this.selectedDate.set(new Date());
  }

  navigatePrevious(): void {
    const date = new Date(this.selectedDate());
    switch (this.viewMode()) {
      case 'day':
        date.setDate(date.getDate() - 1);
        break;
      case 'week':
        date.setDate(date.getDate() - 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() - 1);
        break;
    }
    this.selectedDate.set(date);
  }

  navigateNext(): void {
    const date = new Date(this.selectedDate());
    switch (this.viewMode()) {
      case 'day':
        date.setDate(date.getDate() + 1);
        break;
      case 'week':
        date.setDate(date.getDate() + 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() + 1);
        break;
    }
    this.selectedDate.set(date);
  }

  selectDate(date: Date): void {
    this.selectedDate.set(date);
  }

  isSelectedDate(date: Date): boolean {
    const selected = this.selectedDate();
    return date.toDateString() === selected.toDateString();
  }

  toggleProvider(id: string): void {
    this.selectedProvider = this.selectedProvider === id ? '' : id;
  }

  formatHour(hour: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour;
    return `${displayHour} ${period}`;
  }

  hasAppointmentAtHour(date: Date, hour: number): boolean {
    return this.getAppointmentsAtHour(date, hour).length > 0;
  }

  getAppointmentsAtHour(date: Date, hour: number): Appointment[] {
    return this.appointments().filter(apt => {
      const aptDate = new Date(apt.date);
      const aptHour = parseInt(apt.startTime.split(':')[0]);
      return aptDate.toDateString() === date.toDateString() && aptHour === hour;
    });
  }

  getProviderColor(providerId: string): string {
    const provider = this.providers.find(p => p.id === providerId);
    return provider?.color || '#64748b';
  }

  getStatusSeverity(status: AppointmentStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      'scheduled': 'info',
      'confirmed': 'info',
      'checked-in': 'success',
      'in-progress': 'warn',
      'completed': 'success',
      'cancelled': 'danger',
      'no-show': 'danger',
      'rescheduled': 'secondary',
    };
    return map[status] || 'secondary';
  }

  getPatientInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  onTimeSlotClick(date: Date, hour: number): void {
    this.appointmentForm.patchValue({
      date,
      startTime: `${hour.toString().padStart(2, '0')}:00`,
    });
    this.showAppointmentDialog.set(true);
  }

  openNewAppointmentDialog(): void {
    this.editingAppointment.set(null);
    this.appointmentForm.reset({
      date: this.selectedDate(),
      duration: 30,
      smsReminder: true,
      emailReminder: true,
    });
    this.selectedPatientForAppointment.set(null);
    this.showAppointmentDialog.set(true);
  }

  openAppointmentDetail(appointment: Appointment): void {
    this.selectedAppointment.set(appointment);
    this.showDetailDialog.set(true);
  }

  editAppointment(): void {
    const apt = this.selectedAppointment();
    if (!apt) return;

    this.editingAppointment.set(apt);
    this.appointmentForm.patchValue({
      patientId: apt.patientId,
      providerId: apt.providerId,
      date: apt.date,
      startTime: apt.startTime,
      duration: apt.duration,
      appointmentType: apt.appointmentType,
      reason: apt.reason,
      notes: apt.notes,
    });
    this.selectedPatientForAppointment.set({
      id: apt.patientId,
      displayName: `${apt.patientName} (${apt.patientMrn})`,
    });
    this.showDetailDialog.set(false);
    this.showAppointmentDialog.set(true);
  }

  closeAppointmentDialog(): void {
    this.showAppointmentDialog.set(false);
    this.editingAppointment.set(null);
    this.selectedPatientForAppointment.set(null);
  }

  searchPatients(event: any): void {
    // Mock search - replace with actual service
    const query = event.query.toLowerCase();
    const results = [
      { id: 'pt1', firstName: 'John', lastName: 'Smith', mrn: 'MRN-001', displayName: 'John Smith (MRN-001)' },
      { id: 'pt2', firstName: 'Sarah', lastName: 'Johnson', mrn: 'MRN-002', displayName: 'Sarah Johnson (MRN-002)' },
      { id: 'pt3', firstName: 'Mike', lastName: 'Williams', mrn: 'MRN-003', displayName: 'Mike Williams (MRN-003)' },
    ].filter(p => p.displayName.toLowerCase().includes(query));
    this.patientSearchResults.set(results);
  }

  onPatientSelect(patient: any): void {
    this.selectedPatientForAppointment.set(patient);
    this.appointmentForm.patchValue({ patientId: patient.id });
  }

  clearSelectedPatient(): void {
    this.selectedPatientForAppointment.set(null);
    this.appointmentForm.patchValue({ patientId: '' });
  }

  saveAppointment(): void {
    if (this.appointmentForm.invalid) return;

    this.saving.set(true);
    const formValue = this.appointmentForm.value;

    setTimeout(() => {
      const patient = this.selectedPatientForAppointment();
      const provider = this.providers.find(p => p.id === formValue.providerId);
      const startTime = formValue.startTime;
      const [hours, mins] = startTime.split(':').map(Number);
      const endMins = hours * 60 + mins + formValue.duration;
      const endHours = Math.floor(endMins / 60);
      const endMinutes = endMins % 60;
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

      if (this.editingAppointment()) {
        // Update existing
        this.appointments.update(apts => apts.map(a =>
          a.id === this.editingAppointment()!.id
            ? { ...a, ...formValue, patientName: patient?.displayName.split(' (')[0], providerName: provider?.name, endTime }
            : a
        ));
        this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Appointment updated successfully' });
      } else {
        // Create new
        const newApt: Appointment = {
          id: `apt-${Date.now()}`,
          patientId: formValue.patientId,
          patientName: patient?.displayName.split(' (')[0] || 'Unknown',
          patientMrn: patient?.mrn || '',
          providerId: formValue.providerId,
          providerName: provider?.name || 'Unknown',
          appointmentType: formValue.appointmentType,
          status: 'scheduled',
          date: formValue.date,
          startTime,
          endTime,
          duration: formValue.duration,
          reason: formValue.reason,
          notes: formValue.notes,
        };
        this.appointments.update(apts => [...apts, newApt]);
        this.messageService.add({ severity: 'success', summary: 'Scheduled', detail: 'Appointment scheduled successfully' });
      }

      this.saving.set(false);
      this.closeAppointmentDialog();
    }, 500);
  }

  confirmDeleteAppointment(): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this appointment?',
      accept: () => {
        const apt = this.editingAppointment();
        if (apt) {
          this.appointments.update(apts => apts.filter(a => a.id !== apt.id));
          this.messageService.add({ severity: 'info', summary: 'Deleted', detail: 'Appointment deleted' });
          this.closeAppointmentDialog();
        }
      }
    });
  }

  updateAppointmentStatus(status: AppointmentStatus): void {
    const apt = this.selectedAppointment();
    if (!apt) return;

    this.appointments.update(apts => apts.map(a =>
      a.id === apt.id ? { ...a, status } : a
    ));
    this.selectedAppointment.update(a => a ? { ...a, status } : null);

    this.messageService.add({
      severity: 'success',
      summary: 'Status Updated',
      detail: `Appointment ${status.replace('-', ' ')}`
    });

    if (status === 'completed' || status === 'cancelled') {
      this.showDetailDialog.set(false);
    }
  }
}
