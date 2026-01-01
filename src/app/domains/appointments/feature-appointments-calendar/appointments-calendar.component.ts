import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

// Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatRippleModule } from '@angular/material/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

// Shared Components
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { StatusBadgeComponent, getStatusVariant } from '../../../shared/ui/status-badge/status-badge.component';
import { AvatarComponent } from '../../../shared/ui/avatar/avatar.component';

// Services & Models
import { AppointmentService } from '../data-access/services/appointment.service';
import { 
  Appointment, 
  getAppointmentTypeConfig,
  APPOINTMENT_TYPE_CONFIG,
} from '../data-access/models/appointment.model';

type CalendarView = 'day' | 'week' | 'month';

interface CalendarDay {
  date: Date;
  isToday: boolean;
  isCurrentMonth: boolean;
  appointments: Appointment[];
}

interface TimeSlot {
  hour: number;
  label: string;
}

@Component({
  selector: 'app-appointments-calendar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatTooltipModule,
    MatChipsModule,
    MatDialogModule,
    MatRippleModule,
    MatButtonToggleModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    AvatarComponent,
  ],
  template: `
    <div class="calendar-container">
      <!-- Header -->
      <app-page-header
        title="Appointments"
        subtitle="Manage your schedule"
        icon="calendar_month">
        <div actions>
          <button mat-flat-button color="primary" routerLink="new">
            <mat-icon>add</mat-icon>
            New Appointment
          </button>
        </div>
      </app-page-header>

      <!-- Toolbar -->
      <mat-card class="toolbar-card">
        <div class="toolbar-content">
          <div class="date-navigation">
            <button mat-icon-button (click)="navigatePrevious()" matTooltip="Previous">
              <mat-icon>chevron_left</mat-icon>
            </button>
            
            <button mat-button (click)="goToToday()" class="today-btn">
              Today
            </button>

            <button mat-icon-button (click)="navigateNext()" matTooltip="Next">
              <mat-icon>chevron_right</mat-icon>
            </button>

            <h2 class="current-period">{{ currentPeriodLabel() }}</h2>
          </div>

          <div class="toolbar-controls">
            <mat-form-field appearance="outline" class="provider-select">
              <mat-label>Provider</mat-label>
              <mat-select [formControl]="providerControl">
                <mat-option value="">All Providers</mat-option>
                <mat-option value="prov-001">Dr. Emily Chen</mat-option>
                <mat-option value="prov-002">Dr. James Wilson</mat-option>
                <mat-option value="prov-003">Dr. Maria Garcia</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-button-toggle-group [value]="viewMode()" (change)="setViewMode($event.value)">
              <mat-button-toggle value="day" matTooltip="Day View">
                <mat-icon>view_day</mat-icon>
              </mat-button-toggle>
              <mat-button-toggle value="week" matTooltip="Week View">
                <mat-icon>view_week</mat-icon>
              </mat-button-toggle>
              <mat-button-toggle value="month" matTooltip="Month View">
                <mat-icon>calendar_view_month</mat-icon>
              </mat-button-toggle>
            </mat-button-toggle-group>
          </div>
        </div>
      </mat-card>

      <!-- Calendar Views -->
      <div class="calendar-content">
        @if (loading()) {
          <div class="loading-overlay">
            <mat-spinner diameter="48"></mat-spinner>
            <p>Loading appointments...</p>
          </div>
        }

        @switch (viewMode()) {
          @case ('day') {
            <div class="day-view">
              <div class="time-grid">
                <div class="time-column">
                  @for (slot of timeSlots; track slot.hour) {
                    <div class="time-slot-label">
                      {{ slot.label }}
                    </div>
                  }
                </div>
                <div class="appointments-column">
                  @for (slot of timeSlots; track slot.hour) {
                    <div class="time-slot" (click)="onSlotClick(slot.hour)">
                      @for (apt of getAppointmentsForHour(slot.hour); track apt.id) {
                        <div 
                          class="appointment-block"
                          [style.top.px]="getAppointmentTop(apt)"
                          [style.height.px]="getAppointmentHeight(apt)"
                          [style.background]="getAppointmentColor(apt)"
                          matRipple
                          (click)="onAppointmentClick(apt); $event.stopPropagation()">
                          <div class="apt-content">
                            <span class="apt-time">{{ apt.start | date:'shortTime' }}</span>
                            <span class="apt-patient">{{ apt.patientName }}</span>
                            <span class="apt-type">{{ getTypeLabel(apt.appointmentType) }}</span>
                          </div>
                          <app-status-badge
                            [text]="apt.status"
                            [variant]="getStatusVariant(apt.status)"
                            size="small">
                          </app-status-badge>
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            </div>
          }

          @case ('week') {
            <div class="week-view">
              <div class="week-header">
                <div class="time-header"></div>
                @for (day of weekDays(); track day.date.toISOString()) {
                  <div class="day-header" [class.today]="day.isToday">
                    <span class="day-name">{{ day.date | date:'EEE' }}</span>
                    <span class="day-number">{{ day.date | date:'d' }}</span>
                  </div>
                }
              </div>
              <div class="week-body">
                <div class="time-column">
                  @for (slot of timeSlots; track slot.hour) {
                    <div class="time-slot-label">
                      {{ slot.label }}
                    </div>
                  }
                </div>
                @for (day of weekDays(); track day.date.toISOString()) {
                  <div class="day-column" [class.today]="day.isToday">
                    @for (slot of timeSlots; track slot.hour) {
                      <div class="time-slot" (click)="onSlotClick(slot.hour, day.date)">
                        @for (apt of getAppointmentsForDayHour(day.date, slot.hour); track apt.id) {
                          <div 
                            class="appointment-block compact"
                            [style.top.px]="getAppointmentTop(apt)"
                            [style.height.px]="getAppointmentHeight(apt)"
                            [style.background]="getAppointmentColor(apt)"
                            matRipple
                            [matTooltip]="apt.patientName + ' - ' + apt.reasonDescription"
                            (click)="onAppointmentClick(apt); $event.stopPropagation()">
                            <span class="apt-time">{{ apt.start | date:'shortTime' }}</span>
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
                @for (day of calendarDays(); track day.date.toISOString()) {
                  <div 
                    class="calendar-day"
                    [class.today]="day.isToday"
                    [class.other-month]="!day.isCurrentMonth"
                    (click)="onDayClick(day.date)">
                    <span class="day-number">{{ day.date | date:'d' }}</span>
                    <div class="day-appointments">
                      @for (apt of day.appointments.slice(0, 3); track apt.id) {
                        <div 
                          class="mini-appointment"
                          [style.background]="getAppointmentColor(apt)"
                          (click)="onAppointmentClick(apt); $event.stopPropagation()">
                          {{ apt.start | date:'shortTime' }} {{ apt.patientName }}
                        </div>
                      }
                      @if (day.appointments.length > 3) {
                        <div class="more-appointments">
                          +{{ day.appointments.length - 3 }} more
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        }
      </div>

      <!-- Legend -->
      <mat-card class="legend-card">
        <div class="legend-content">
          <span class="legend-title">Appointment Types:</span>
          @for (type of appointmentTypes.slice(0, 6); track type.type) {
            <div class="legend-item">
              <span class="legend-color" [style.background]="type.color"></span>
              <span class="legend-label">{{ type.label }}</span>
            </div>
          }
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .calendar-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Toolbar */
    .toolbar-card {
      border-radius: 12px;
      margin-bottom: 24px;
      padding: 16px 20px;
    }

    .toolbar-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .date-navigation {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .today-btn {
      font-weight: 500;
    }

    .current-period {
      margin: 0 0 0 16px;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
    }

    .toolbar-controls {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .provider-select {
      width: 200px;

      ::ng-deep .mat-mdc-form-field-subscript-wrapper {
        display: none;
      }
    }

    /* Calendar Content */
    .calendar-content {
      position: relative;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      min-height: 600px;
    }

    .loading-overlay {
      position: absolute;
      inset: 0;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10;

      p {
        margin-top: 16px;
        color: #64748b;
      }
    }

    /* Day View */
    .day-view {
      .time-grid {
        display: flex;
      }

      .time-column {
        width: 80px;
        flex-shrink: 0;
        border-right: 1px solid #e2e8f0;
      }

      .time-slot-label {
        height: 60px;
        display: flex;
        align-items: flex-start;
        justify-content: flex-end;
        padding: 4px 12px 0 0;
        font-size: 0.75rem;
        color: #64748b;
      }

      .appointments-column {
        flex: 1;
        position: relative;
      }

      .time-slot {
        height: 60px;
        border-bottom: 1px solid #f1f5f9;
        position: relative;
        cursor: pointer;

        &:hover {
          background: #f8fafc;
        }
      }
    }

    .appointment-block {
      position: absolute;
      left: 4px;
      right: 4px;
      border-radius: 6px;
      padding: 8px;
      cursor: pointer;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 4px;
      z-index: 1;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s, box-shadow 0.2s;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 2;
      }

      .apt-content {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .apt-time {
        font-size: 0.75rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.9);
      }

      .apt-patient {
        font-size: 0.85rem;
        font-weight: 500;
        color: white;
      }

      .apt-type {
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.8);
      }

      &.compact {
        padding: 4px 6px;
        gap: 2px;

        .apt-time, .apt-patient {
          font-size: 0.7rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }

    /* Week View */
    .week-view {
      .week-header {
        display: flex;
        border-bottom: 1px solid #e2e8f0;

        .time-header {
          width: 60px;
          flex-shrink: 0;
        }

        .day-header {
          flex: 1;
          padding: 12px;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 4px;

          &.today {
            background: #e0f7fa;

            .day-number {
              background: #0077b6;
              color: white;
            }
          }

          .day-name {
            font-size: 0.75rem;
            color: #64748b;
            text-transform: uppercase;
          }

          .day-number {
            font-size: 1.25rem;
            font-weight: 600;
            color: #1e293b;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            margin: 0 auto;
          }
        }
      }

      .week-body {
        display: flex;
        overflow-y: auto;
        max-height: 600px;

        .time-column {
          width: 60px;
          flex-shrink: 0;
          border-right: 1px solid #e2e8f0;

          .time-slot-label {
            height: 60px;
            display: flex;
            align-items: flex-start;
            justify-content: flex-end;
            padding: 4px 8px 0 0;
            font-size: 0.7rem;
            color: #94a3b8;
          }
        }

        .day-column {
          flex: 1;
          border-right: 1px solid #f1f5f9;

          &:last-child {
            border-right: none;
          }

          &.today {
            background: rgba(0, 119, 182, 0.02);
          }

          .time-slot {
            height: 60px;
            border-bottom: 1px solid #f1f5f9;
            position: relative;
            cursor: pointer;

            &:hover {
              background: #f8fafc;
            }
          }
        }
      }
    }

    /* Month View */
    .month-view {
      .month-header {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        border-bottom: 1px solid #e2e8f0;

        .weekday-header {
          padding: 12px;
          text-align: center;
          font-size: 0.8rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
        }
      }

      .month-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
      }

      .calendar-day {
        min-height: 120px;
        padding: 8px;
        border-right: 1px solid #f1f5f9;
        border-bottom: 1px solid #f1f5f9;
        cursor: pointer;
        transition: background 0.2s;

        &:nth-child(7n) {
          border-right: none;
        }

        &:hover {
          background: #f8fafc;
        }

        &.today {
          background: #e0f7fa;

          .day-number {
            background: #0077b6;
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }

        &.other-month {
          background: #fafafa;

          .day-number {
            color: #94a3b8;
          }
        }

        .day-number {
          font-size: 0.9rem;
          font-weight: 500;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .day-appointments {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .mini-appointment {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.7rem;
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .more-appointments {
          font-size: 0.7rem;
          color: #64748b;
          padding: 2px 6px;
        }
      }
    }

    /* Legend */
    .legend-card {
      margin-top: 16px;
      border-radius: 12px;
      padding: 12px 20px;
    }

    .legend-content {
      display: flex;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;

      .legend-title {
        font-weight: 500;
        color: #64748b;
        font-size: 0.85rem;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .legend-color {
        width: 12px;
        height: 12px;
        border-radius: 3px;
      }

      .legend-label {
        font-size: 0.8rem;
        color: #64748b;
      }
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .toolbar-content {
        flex-direction: column;
        align-items: flex-start;
      }

      .month-view .calendar-day {
        min-height: 80px;
        padding: 4px;

        .mini-appointment {
          display: none;
        }

        .day-appointments::after {
          content: attr(data-count);
          font-size: 0.7rem;
          color: #64748b;
        }
      }
    }

    @media (max-width: 768px) {
      .calendar-container {
        padding: 16px;
      }

      .week-view {
        .day-header .day-name {
          font-size: 0.65rem;
        }

        .day-header .day-number {
          font-size: 1rem;
          width: 28px;
          height: 28px;
        }
      }
    }
  `]
})
export class AppointmentsCalendarComponent implements OnInit, OnDestroy {
  private readonly appointmentService = inject(AppointmentService);
  private readonly dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();

  // Form controls
  providerControl = new FormControl('');

  // State signals
  viewMode = signal<CalendarView>('week');
  currentDate = signal(new Date());
  appointments = signal<Appointment[]>([]);
  loading = signal(false);

  // Computed values
  currentPeriodLabel = computed(() => {
    const date = this.currentDate();
    const view = this.viewMode();

    switch (view) {
      case 'day':
        return date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        });
      case 'week':
        const weekStart = this.getWeekStart(date);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'month':
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      default:
        return '';
    }
  });

  weekDays = computed(() => {
    const weekStart = this.getWeekStart(this.currentDate());
    const days: { date: Date; isToday: boolean }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      days.push({
        date,
        isToday: date.getTime() === today.getTime(),
      });
    }

    return days;
  });

  calendarDays = computed(() => {
    const current = this.currentDate();
    const firstOfMonth = new Date(current.getFullYear(), current.getMonth(), 1);
    const lastOfMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0);
    
    const startDate = this.getWeekStart(firstOfMonth);
    const endDate = new Date(lastOfMonth);
    while (endDate.getDay() !== 6) {
      endDate.setDate(endDate.getDate() + 1);
    }

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      days.push({
        date: new Date(currentDate),
        isToday: currentDate.getTime() === today.getTime(),
        isCurrentMonth: currentDate.getMonth() === current.getMonth(),
        appointments: this.appointments().filter(apt => {
          const aptDate = new Date(apt.start).toISOString().split('T')[0];
          return aptDate === dateStr;
        }),
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  });

  // Time slots for day/week view
  timeSlots: TimeSlot[] = [];
  appointmentTypes = APPOINTMENT_TYPE_CONFIG;

  ngOnInit(): void {
    this.generateTimeSlots();
    this.loadAppointments();

    // Reload on provider change
    this.providerControl.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => this.loadAppointments());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private generateTimeSlots(): void {
    this.timeSlots = [];
    for (let hour = 6; hour <= 20; hour++) {
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      this.timeSlots.push({
        hour,
        label: `${displayHour} ${ampm}`,
      });
    }
  }

  private loadAppointments(): void {
    this.loading.set(true);
    const { startDate, endDate } = this.getDateRange();

    this.appointmentService.getAppointmentsByDateRange(
      startDate, 
      endDate, 
      this.providerControl.value || undefined
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (appointments) => {
        this.appointments.set(appointments);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private getDateRange(): { startDate: Date; endDate: Date } {
    const current = this.currentDate();
    const view = this.viewMode();
    let startDate: Date, endDate: Date;

    switch (view) {
      case 'day':
        startDate = new Date(current);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(current);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate = this.getWeekStart(current);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        startDate = new Date(current.getFullYear(), current.getMonth(), 1);
        startDate.setDate(startDate.getDate() - startDate.getDay());
        endDate = new Date(current.getFullYear(), current.getMonth() + 1, 0);
        endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        startDate = new Date();
        endDate = new Date();
    }

    return { startDate, endDate };
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d;
  }

  setViewMode(view: CalendarView): void {
    this.viewMode.set(view);
    this.loadAppointments();
  }

  navigatePrevious(): void {
    const current = this.currentDate();
    const newDate = new Date(current);

    switch (this.viewMode()) {
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
    }

    this.currentDate.set(newDate);
    this.loadAppointments();
  }

  navigateNext(): void {
    const current = this.currentDate();
    const newDate = new Date(current);

    switch (this.viewMode()) {
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
    }

    this.currentDate.set(newDate);
    this.loadAppointments();
  }

  goToToday(): void {
    this.currentDate.set(new Date());
    this.loadAppointments();
  }

  getAppointmentsForHour(hour: number): Appointment[] {
    const date = this.currentDate();
    return this.appointments().filter(apt => {
      const aptDate = new Date(apt.start);
      return (
        aptDate.getDate() === date.getDate() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getFullYear() === date.getFullYear() &&
        aptDate.getHours() === hour
      );
    });
  }

  getAppointmentsForDayHour(date: Date, hour: number): Appointment[] {
    return this.appointments().filter(apt => {
      const aptDate = new Date(apt.start);
      return (
        aptDate.getDate() === date.getDate() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getFullYear() === date.getFullYear() &&
        aptDate.getHours() === hour
      );
    });
  }

  getAppointmentTop(apt: Appointment): number {
    const start = new Date(apt.start);
    return start.getMinutes();
  }

  getAppointmentHeight(apt: Appointment): number {
    return Math.max(apt.duration, 15);
  }

  getAppointmentColor(apt: Appointment): string {
    const config = getAppointmentTypeConfig(apt.appointmentType);
    return config?.color || '#64748b';
  }

  getTypeLabel(type: string): string {
    const config = getAppointmentTypeConfig(type as any);
    return config?.label || type;
  }

  getStatusVariant(status: string) {
    return getStatusVariant(status);
  }

  onSlotClick(hour: number, date?: Date): void {
    // Navigate to new appointment with pre-filled time
    console.log('Slot clicked:', hour, date);
  }

  onDayClick(date: Date): void {
    this.currentDate.set(date);
    this.viewMode.set('day');
    this.loadAppointments();
  }

  onAppointmentClick(apt: Appointment): void {
    // Navigate to appointment detail or open dialog
    console.log('Appointment clicked:', apt);
  }
}
