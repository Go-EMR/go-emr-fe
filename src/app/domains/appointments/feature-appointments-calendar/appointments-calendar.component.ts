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
  AppointmentType,
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

interface ViewOption {
  icon: string;
  value: CalendarView;
  tooltip: string;
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

      <!-- Toolbar -->
      <section class="toolbar-section">
        <p-card styleClass="toolbar-card">
          <div class="toolbar-content">
            <!-- Date Navigation -->
            <div class="date-navigation">
              <p-button
                icon="pi pi-chevron-left"
                [rounded]="true"
                [outlined]="true"
                severity="secondary"
                (onClick)="navigatePrevious()"
                pTooltip="Previous"
                tooltipPosition="bottom"
              />
              <p-button
                label="Today"
                [outlined]="true"
                severity="secondary"
                (onClick)="goToToday()"
              />
              <p-button
                icon="pi pi-chevron-right"
                [rounded]="true"
                [outlined]="true"
                severity="secondary"
                (onClick)="navigateNext()"
                pTooltip="Next"
                tooltipPosition="bottom"
              />
              <h2 class="current-period">{{ currentPeriodLabel() }}</h2>
            </div>

            <!-- Controls -->
            <div class="toolbar-controls">
              <!-- Provider Filter -->
              <p-select
                [options]="providerOptions"
                [formControl]="providerControl"
                placeholder="All Providers"
                [showClear]="true"
                class="provider-select"
              />

              <!-- View Toggle -->
              <p-selectButton
                [options]="viewOptions"
                [(ngModel)]="selectedView"
                (onChange)="setViewMode($event.value)"
                optionLabel="tooltip"
                optionValue="value"
                class="view-toggle">
                <ng-template pTemplate="item" let-item>
                  <i [class]="'pi ' + item.icon" [pTooltip]="item.tooltip" tooltipPosition="bottom"></i>
                </ng-template>
              </p-selectButton>
            </div>
          </div>
        </p-card>
      </section>

      <!-- Calendar Content -->
      <section class="calendar-section">
        <div class="calendar-content" [class.loading]="loading()">
          @if (loading()) {
            <div class="loading-overlay">
              <i class="pi pi-spin pi-spinner" style="font-size: 2.5rem; color: #3b82f6;"></i>
              <p>Loading appointments...</p>
            </div>
          }

          @switch (viewMode()) {
            @case ('day') {
              <!-- Day View -->
              <div class="day-view">
                <div class="time-grid">
                  <div class="time-column">
                    @for (slot of timeSlots; track slot.hour) {
                      <div class="time-slot-label">{{ slot.label }}</div>
                    }
                  </div>
                  <div class="appointments-column">
                    @for (slot of timeSlots; track slot.hour) {
                      <div class="time-slot" (click)="onSlotClick(slot.hour)" pRipple>
                        @for (apt of getAppointmentsForHour(slot.hour); track apt.id) {
                          <div
                            class="appointment-block"
                            [style.top.px]="getAppointmentTop(apt)"
                            [style.height.px]="getAppointmentHeight(apt)"
                            [style.background]="getAppointmentColor(apt)"
                            (click)="showAppointmentDetail(apt, $event); $event.stopPropagation()"
                            pRipple>
                            <div class="apt-content">
                              <span class="apt-time">{{ apt.start | date:'shortTime' }}</span>
                              <span class="apt-patient">{{ apt.patientName }}</span>
                              <span class="apt-type">{{ getTypeLabel(apt.appointmentType) }}</span>
                            </div>
                            <p-tag
                              [value]="apt.status | titlecase"
                              [severity]="getStatusSeverity(apt.status)"
                              [rounded]="true"
                              class="apt-status"
                            />
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>
              </div>
            }

            @case ('week') {
              <!-- Week View -->
              <div class="week-view">
                <div class="week-header">
                  <div class="time-header"></div>
                  @for (day of weekDays(); track day.date.toISOString()) {
                    <div class="day-header" [class.today]="day.isToday">
                      <span class="day-name">{{ day.date | date:'EEE' }}</span>
                      <span class="day-number" [class.today-number]="day.isToday">{{ day.date | date:'d' }}</span>
                    </div>
                  }
                </div>
                <div class="week-body">
                  <div class="time-column">
                    @for (slot of timeSlots; track slot.hour) {
                      <div class="time-slot-label">{{ slot.label }}</div>
                    }
                  </div>
                  @for (day of weekDays(); track day.date.toISOString()) {
                    <div class="day-column" [class.today]="day.isToday">
                      @for (slot of timeSlots; track slot.hour) {
                        <div class="time-slot" (click)="onSlotClick(slot.hour, day.date)" pRipple>
                          @for (apt of getAppointmentsForDayHour(day.date, slot.hour); track apt.id) {
                            <div
                              class="appointment-block compact"
                              [style.top.px]="getAppointmentTop(apt)"
                              [style.height.px]="getAppointmentHeight(apt)"
                              [style.background]="getAppointmentColor(apt)"
                              [pTooltip]="apt.patientName + ' - ' + getTypeLabel(apt.appointmentType)"
                              tooltipPosition="top"
                              (click)="showAppointmentDetail(apt, $event); $event.stopPropagation()"
                              pRipple>
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
              <!-- Month View -->
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
                      (click)="onDayClick(day.date)"
                      pRipple>
                      <span class="day-number" [class.today-badge]="day.isToday">{{ day.date | date:'d' }}</span>
                      <div class="day-appointments">
                        @for (apt of day.appointments.slice(0, 3); track apt.id) {
                          <div
                            class="mini-appointment"
                            [style.background]="getAppointmentColor(apt)"
                            (click)="showAppointmentDetail(apt, $event); $event.stopPropagation()">
                            <span class="mini-time">{{ apt.start | date:'shortTime' }}</span>
                            <span class="mini-name">{{ apt.patientName }}</span>
                          </div>
                        }
                        @if (day.appointments.length > 3) {
                          <div class="more-appointments" (click)="onDayClick(day.date); $event.stopPropagation()">
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
      </section>

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

      <!-- Appointment Detail Overlay -->
      <p-overlayPanel #appointmentDetail styleClass="appointment-detail-panel">
        @if (selectedAppointment()) {
          <div class="detail-header">
            <div class="detail-type" [style.background]="getAppointmentColor(selectedAppointment()!)">
              <i [class]="'pi ' + getTypeIcon(selectedAppointment()!.appointmentType)"></i>
            </div>
            <div class="detail-info">
              <h3>{{ selectedAppointment()!.patientName }}</h3>
              <span class="detail-type-label">{{ getTypeLabel(selectedAppointment()!.appointmentType) }}</span>
            </div>
            <p-tag
              [value]="selectedAppointment()!.status | titlecase"
              [severity]="getStatusSeverity(selectedAppointment()!.status)"
              [rounded]="true"
            />
          </div>
          <p-divider />
          <div class="detail-body">
            <div class="detail-row">
              <i class="pi pi-clock"></i>
              <span>{{ selectedAppointment()!.start | date:'medium' }}</span>
            </div>
            <div class="detail-row">
              <i class="pi pi-stopwatch"></i>
              <span>{{ selectedAppointment()!.duration }} minutes</span>
            </div>
            <div class="detail-row">
              <i class="pi pi-user"></i>
              <span>{{ selectedAppointment()!.providerName }}</span>
            </div>
            @if (selectedAppointment()!.reasonDescription) {
              <div class="detail-row">
                <i class="pi pi-info-circle"></i>
                <span>{{ selectedAppointment()!.reasonDescription }}</span>
              </div>
            }
          </div>
          <p-divider />
          <div class="detail-actions">
            <p-button
              label="View Details"
              icon="pi pi-eye"
              [text]="true"
              (onClick)="navigateToAppointment(selectedAppointment()!.id)"
            />
            <p-button
              label="Check In"
              icon="pi pi-check"
              [text]="true"
              severity="success"
              [disabled]="selectedAppointment()!.status !== 'booked'"
            />
            <p-button
              label="Cancel"
              icon="pi pi-times"
              [text]="true"
              severity="danger"
              [disabled]="selectedAppointment()!.status === 'cancelled'"
            />
          </div>
        }
      </p-overlayPanel>
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

    /* Toolbar */
    .toolbar-section {
      margin-bottom: 1.5rem;
    }

    :host ::ng-deep .toolbar-card {
      border-radius: 1rem;
    }

    :host ::ng-deep .toolbar-card .p-card-body {
      padding: 1rem 1.25rem;
    }

    .dark :host ::ng-deep .toolbar-card {
      background: #1e293b;
      border-color: #334155;
    }

    .toolbar-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .date-navigation {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .current-period {
      margin: 0 0 0 1rem;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
    }

    .dark .current-period {
      color: #f1f5f9;
    }

    .toolbar-controls {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .provider-select {
      min-width: 180px;
    }

    :host ::ng-deep .view-toggle .p-selectbutton .p-button {
      padding: 0.5rem 0.75rem;
    }

    /* Calendar Content */
    .calendar-section {
      margin-bottom: 1.5rem;
    }

    .calendar-content {
      background: white;
      border-radius: 1rem;
      border: 1px solid #e2e8f0;
      min-height: 600px;
      position: relative;
      overflow: hidden;
    }

    .dark .calendar-content {
      background: #1e293b;
      border-color: #334155;
    }

    .calendar-content.loading {
      pointer-events: none;
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
      gap: 1rem;
    }

    .dark .loading-overlay {
      background: rgba(30, 41, 59, 0.9);
    }

    .loading-overlay p {
      color: #64748b;
      margin: 0;
    }

    /* Day View */
    .day-view .time-grid {
      display: flex;
    }

    .time-column {
      width: 70px;
      flex-shrink: 0;
      border-right: 1px solid #e2e8f0;
    }

    .dark .time-column {
      border-right-color: #334155;
    }

    .time-slot-label {
      height: 60px;
      display: flex;
      align-items: flex-start;
      justify-content: flex-end;
      padding: 4px 8px 0 0;
      font-size: 0.75rem;
      color: #94a3b8;
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
      transition: background 0.2s;
    }

    .dark .time-slot {
      border-bottom-color: #334155;
    }

    .time-slot:hover {
      background: #f8fafc;
    }

    .dark .time-slot:hover {
      background: #334155;
    }

    .appointment-block {
      position: absolute;
      left: 4px;
      right: 4px;
      border-radius: 8px;
      padding: 8px;
      cursor: pointer;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 4px;
      z-index: 1;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .appointment-block:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
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
      font-size: 0.875rem;
      font-weight: 500;
      color: white;
    }

    .apt-type {
      font-size: 0.6875rem;
      color: rgba(255, 255, 255, 0.8);
    }

    .apt-status {
      align-self: flex-start;
      margin-top: auto;
    }

    :host ::ng-deep .apt-status .p-tag {
      font-size: 0.625rem;
      padding: 0.125rem 0.375rem;
    }

    .appointment-block.compact {
      padding: 4px 6px;
      gap: 2px;
    }

    .appointment-block.compact .apt-time,
    .appointment-block.compact .apt-patient {
      font-size: 0.6875rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Week View */
    .week-view {
      display: flex;
      flex-direction: column;
    }

    .week-header {
      display: flex;
      border-bottom: 1px solid #e2e8f0;
      position: sticky;
      top: 0;
      background: white;
      z-index: 5;
    }

    .dark .week-header {
      border-bottom-color: #334155;
      background: #1e293b;
    }

    .time-header {
      width: 70px;
      flex-shrink: 0;
    }

    .day-header {
      flex: 1;
      text-align: center;
      padding: 0.75rem 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      border-left: 1px solid #e2e8f0;
    }

    .dark .day-header {
      border-left-color: #334155;
    }

    .day-header.today {
      background: #eff6ff;
    }

    .dark .day-header.today {
      background: #1e3a8a;
    }

    .day-name {
      font-size: 0.75rem;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 500;
    }

    .dark .day-name {
      color: #94a3b8;
    }

    .day-number {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
    }

    .dark .day-number {
      color: #f1f5f9;
    }

    .today-number {
      background: #3b82f6;
      color: white;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
    }

    .week-body {
      display: flex;
      overflow-y: auto;
      max-height: calc(100vh - 400px);
    }

    .day-column {
      flex: 1;
      border-left: 1px solid #e2e8f0;
      position: relative;
    }

    .dark .day-column {
      border-left-color: #334155;
    }

    .day-column.today {
      background: rgba(59, 130, 246, 0.05);
    }

    .dark .day-column.today {
      background: rgba(59, 130, 246, 0.1);
    }

    /* Month View */
    .month-view {
      display: flex;
      flex-direction: column;
    }

    .month-header {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      border-bottom: 1px solid #e2e8f0;
    }

    .dark .month-header {
      border-bottom-color: #334155;
    }

    .weekday-header {
      padding: 0.75rem;
      text-align: center;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
    }

    .dark .weekday-header {
      color: #94a3b8;
    }

    .month-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      grid-auto-rows: minmax(120px, 1fr);
    }

    .calendar-day {
      border-right: 1px solid #e2e8f0;
      border-bottom: 1px solid #e2e8f0;
      padding: 0.5rem;
      cursor: pointer;
      transition: background 0.2s;
      display: flex;
      flex-direction: column;
    }

    .dark .calendar-day {
      border-color: #334155;
    }

    .calendar-day:nth-child(7n) {
      border-right: none;
    }

    .calendar-day:hover {
      background: #f8fafc;
    }

    .dark .calendar-day:hover {
      background: #334155;
    }

    .calendar-day.today {
      background: #eff6ff;
    }

    .dark .calendar-day.today {
      background: rgba(59, 130, 246, 0.15);
    }

    .calendar-day.other-month {
      background: #f8fafc;
    }

    .dark .calendar-day.other-month {
      background: #0f172a;
    }

    .calendar-day.other-month .day-number {
      color: #cbd5e1;
    }

    .dark .calendar-day.other-month .day-number {
      color: #475569;
    }

    .calendar-day .day-number {
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .dark .calendar-day .day-number {
      color: #e2e8f0;
    }

    .today-badge {
      background: #3b82f6;
      color: white !important;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
    }

    .day-appointments {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow: hidden;
    }

    .mini-appointment {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.6875rem;
      color: white;
      cursor: pointer;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .mini-time {
      font-weight: 600;
    }

    .mini-name {
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .more-appointments {
      font-size: 0.6875rem;
      color: #3b82f6;
      font-weight: 500;
      padding: 2px 4px;
      cursor: pointer;
    }

    .more-appointments:hover {
      text-decoration: underline;
    }

    /* Legend */
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

    /* Appointment Detail Panel */
    :host ::ng-deep .appointment-detail-panel {
      width: 320px;
    }

    .dark :host ::ng-deep .appointment-detail-panel .p-overlaypanel {
      background: #1e293b;
      border-color: #334155;
    }

    .detail-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .detail-type {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .detail-type i {
      font-size: 1.125rem;
      color: white;
    }

    .detail-info {
      flex: 1;
    }

    .detail-info h3 {
      margin: 0 0 0.25rem;
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
    }

    .dark .detail-info h3 {
      color: #f1f5f9;
    }

    .detail-type-label {
      font-size: 0.8125rem;
      color: #64748b;
    }

    .dark .detail-type-label {
      color: #94a3b8;
    }

    .detail-body {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .detail-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.875rem;
    }

    .detail-row i {
      color: #64748b;
      width: 16px;
    }

    .dark .detail-row i {
      color: #94a3b8;
    }

    .detail-row span {
      color: #374151;
    }

    .dark .detail-row span {
      color: #e2e8f0;
    }

    .detail-actions {
      display: flex;
      gap: 0.5rem;
    }

    /* Dark mode inputs */
    .dark :host ::ng-deep .p-select {
      background: #334155;
      border-color: #475569;
    }

    .dark :host ::ng-deep .p-select-label {
      color: #f1f5f9;
    }

    .dark :host ::ng-deep .p-selectbutton .p-button {
      background: #334155;
      border-color: #475569;
      color: #94a3b8;
    }

    .dark :host ::ng-deep .p-selectbutton .p-button.p-highlight {
      background: #3b82f6;
      border-color: #3b82f6;
      color: white;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .toolbar-content {
        flex-direction: column;
        align-items: stretch;
      }

      .date-navigation {
        justify-content: center;
      }

      .toolbar-controls {
        justify-content: center;
      }

      .current-period {
        margin: 0;
        text-align: center;
        width: 100%;
        order: -1;
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

      .month-grid {
        grid-auto-rows: minmax(80px, 1fr);
      }

      .mini-appointment {
        font-size: 0.625rem;
        padding: 1px 4px;
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

  // Options
  providerOptions: ProviderOption[] = [
    { label: 'Dr. Emily Chen', value: 'prov-001' },
    { label: 'Dr. James Wilson', value: 'prov-002' },
    { label: 'Dr. Maria Garcia', value: 'prov-003' },
  ];

  viewOptions: ViewOption[] = [
    { icon: 'pi-calendar', value: 'day', tooltip: 'Day View' },
    { icon: 'pi-calendar-plus', value: 'week', tooltip: 'Week View' },
    { icon: 'pi-th-large', value: 'month', tooltip: 'Month View' },
  ];

  selectedView: CalendarView = 'week';
  appointmentTypeConfigs = APPOINTMENT_TYPE_CONFIG;
  timeSlots: TimeSlot[] = [];

  // Signals
  appointments = signal<Appointment[]>([]);
  currentDate = signal(new Date());
  viewMode = signal<CalendarView>('week');
  loading = signal(false);
  selectedAppointment = signal<Appointment | null>(null);

  // Computed
  currentPeriodLabel = computed(() => {
    const date = this.currentDate();
    const view = this.viewMode();

    switch (view) {
      case 'day':
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      case 'week':
        const weekStart = this.getWeekStart(date);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return `${weekStart.toLocaleDateString('en-US', { month: 'long' })} ${weekStart.getDate()} - ${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
        }
        return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'month':
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      default:
        return '';
    }
  });

  weekDays = computed(() => {
    const current = this.currentDate();
    const weekStart = this.getWeekStart(current);
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      days.push({
        date,
        isToday: date.getTime() === today.getTime(),
        isCurrentMonth: date.getMonth() === current.getMonth(),
        appointments: this.appointments().filter(apt => {
          const aptDate = new Date(apt.start).toISOString().split('T')[0];
          return aptDate === dateStr;
        }),
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

  ngOnInit(): void {
    this.generateTimeSlots();
    this.loadAppointments();

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
    return Math.max(apt.duration, 20);
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
      booked: 'info',
      confirmed: 'info',
      arrived: 'success',
      'checked-in': 'success',
      'in-progress': 'warn',
      fulfilled: 'secondary',
      cancelled: 'danger',
      noshow: 'danger',
    };
    return severities[status] || 'secondary';
  }

  onSlotClick(hour: number, date?: Date): void {
    const targetDate = date || this.currentDate();
    const startTime = new Date(targetDate);
    startTime.setHours(hour, 0, 0, 0);
    this.router.navigate(['/appointments/new'], {
      queryParams: { date: startTime.toISOString() }
    });
  }

  onDayClick(date: Date): void {
    this.currentDate.set(date);
    this.viewMode.set('day');
    this.loadAppointments();
  }

  showAppointmentDetail(apt: Appointment, event: Event): void {
    this.selectedAppointment.set(apt);
    // The overlay panel should be triggered by the click
  }

  navigateToAppointment(id: string): void {
    this.router.navigate(['/appointments', id]);
  }
}
