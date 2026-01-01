import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { StatusBadgeComponent, getStatusVariant } from '../../../shared/ui/status-badge/status-badge.component';
import { AvatarComponent } from '../../../shared/ui/avatar/avatar.component';
import { ConfirmDialogComponent } from '../../../shared/ui/confirm-dialog/confirm-dialog.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { AppointmentService } from '../data-access/services/appointment.service';
import { Appointment, APPOINTMENT_TYPE_CONFIG } from '../data-access/models/appointment.model';

@Component({
  selector: 'app-appointment-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
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
    <div class="appointment-detail-container">
      <!-- Header -->
      <app-page-header
        [title]="appointment()?.patient?.name || 'Appointment Details'"
        [subtitle]="appointment() ? getFormattedDateTime() : ''"
        icon="event"
        [breadcrumbs]="breadcrumbs"
        [showDivider]="false"
      >
        <div class="header-actions" actions>
          @if (appointment(); as appt) {
            @if (canEdit()) {
              <button mat-stroked-button [routerLink]="['/appointments', appt.id, 'edit']">
                <mat-icon>edit</mat-icon>
                Edit
              </button>
            }
            
            <button mat-flat-button color="primary" [matMenuTriggerFor]="actionsMenu">
              <mat-icon>more_vert</mat-icon>
              Actions
            </button>
            
            <mat-menu #actionsMenu="matMenu">
              @if (appt.status === 'booked') {
                <button mat-menu-item (click)="checkIn()">
                  <mat-icon>how_to_reg</mat-icon>
                  <span>Check In Patient</span>
                </button>
              }
              @if (appt.status === 'checked-in') {
                <button mat-menu-item (click)="startEncounter()">
                  <mat-icon>play_arrow</mat-icon>
                  <span>Start Encounter</span>
                </button>
              }
              @if (appt.status === 'in-progress') {
                <button mat-menu-item (click)="completeAppointment()">
                  <mat-icon>check_circle</mat-icon>
                  <span>Complete Appointment</span>
                </button>
              }
              @if (!['fulfilled', 'cancelled', 'noshow'].includes(appt.status)) {
                <button mat-menu-item (click)="sendReminder()">
                  <mat-icon>notifications</mat-icon>
                  <span>Send Reminder</span>
                </button>
                <mat-divider></mat-divider>
                <button mat-menu-item (click)="reschedule()">
                  <mat-icon>update</mat-icon>
                  <span>Reschedule</span>
                </button>
                <button mat-menu-item (click)="markNoShow()" class="warning-item">
                  <mat-icon>person_off</mat-icon>
                  <span>Mark as No-Show</span>
                </button>
                <button mat-menu-item (click)="cancelAppointment()" class="danger-item">
                  <mat-icon>cancel</mat-icon>
                  <span>Cancel Appointment</span>
                </button>
              }
            </mat-menu>
          }
        </div>
      </app-page-header>

      @if (loading()) {
        <div class="loading-skeleton">
          <app-skeleton type="card"></app-skeleton>
          <app-skeleton type="card"></app-skeleton>
        </div>
      } @else {
        @if (appointment(); as appt) {
          <div class="detail-grid">
            <!-- Main Info Card -->
            <mat-card class="info-card main-card">
              <mat-card-content>
                <!-- Status Banner -->
                <div class="status-banner" [class]="'status-' + appt.status">
                <div class="status-info">
                  <app-status-badge 
                    [status]="appt.status" 
                    [variant]="getStatusVariant(appt.status)"
                    size="large"
                  />
                  <span class="status-label">{{ getStatusLabel(appt.status) }}</span>
                </div>
                @if (appt.cancelledAt) {
                  <span class="cancelled-info">
                    Cancelled {{ appt.cancelledAt | date:'short' }}
                    @if (appt.cancellationReason) {
                      - {{ appt.cancellationReason }}
                    }
                  </span>
                }
              </div>

              <!-- Appointment Type -->
              <div class="appointment-type-section">
                <div class="type-badge" [style.background-color]="getTypeColor() + '20'" [style.color]="getTypeColor()">
                  <mat-icon>{{ getTypeIcon() }}</mat-icon>
                  <span>{{ getTypeLabel() }}</span>
                </div>
                @if (appt.isTelehealth) {
                  <mat-chip class="telehealth-chip">
                    <mat-icon>videocam</mat-icon>
                    Telehealth Visit
                  </mat-chip>
                }
              </div>

              <!-- Date/Time Info -->
              <div class="datetime-section">
                <div class="datetime-item">
                  <mat-icon>calendar_today</mat-icon>
                  <div class="datetime-content">
                    <span class="label">Date</span>
                    <span class="value">{{ appt.start | date:'EEEE, MMMM d, y' }}</span>
                  </div>
                </div>
                <div class="datetime-item">
                  <mat-icon>schedule</mat-icon>
                  <div class="datetime-content">
                    <span class="label">Time</span>
                    <span class="value">{{ appt.start | date:'h:mm a' }} - {{ appt.end | date:'h:mm a' }}</span>
                  </div>
                </div>
                <div class="datetime-item">
                  <mat-icon>timelapse</mat-icon>
                  <div class="datetime-content">
                    <span class="label">Duration</span>
                    <span class="value">{{ appt.duration }} minutes</span>
                  </div>
                </div>
              </div>

              @if (appt.reasonDescription || appt.chiefComplaint) {
                <mat-divider></mat-divider>
                <div class="reason-section">
                  <h4>Reason for Visit</h4>
                  @if (appt.reasonDescription) {
                    <p class="reason-text">{{ appt.reasonDescription }}</p>
                  }
                  @if (appt.chiefComplaint) {
                    <div class="chief-complaint">
                      <span class="label">Chief Complaint:</span>
                      <span>{{ appt.chiefComplaint }}</span>
                    </div>
                  }
                </div>
              }

              @if (appt.notes) {
                <mat-divider></mat-divider>
                <div class="notes-section">
                  <h4>Notes</h4>
                  <p>{{ appt.notes }}</p>
                </div>
              }
            </mat-card-content>
          </mat-card>

          <!-- Patient Card -->
          <mat-card class="info-card patient-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>person</mat-icon>
                Patient Information
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="patient-info">
                <app-avatar
                  [name]="appt.patient?.name || ''"
                  [imageUrl]="appt.patient?.photo || ''"
                  size="lg"
                ></app-avatar>
                <div class="patient-details">
                  <h3>{{ appt.patient?.name }}</h3>
                  <a [routerLink]="['/patients', appt.patient?.id]" class="view-patient-link">
                    View Patient Record
                    <mat-icon>arrow_forward</mat-icon>
                  </a>
                </div>
              </div>

              <div class="contact-info">
                @if (appt.patient?.phone) {
                  <div class="contact-item">
                    <mat-icon>phone</mat-icon>
                    <a [href]="'tel:' + appt.patient?.phone">{{ appt.patient?.phone }}</a>
                  </div>
                }
                @if (appt.patient?.email) {
                  <div class="contact-item">
                    <mat-icon>email</mat-icon>
                    <a [href]="'mailto:' + appt.patient?.email">{{ appt.patient?.email }}</a>
                  </div>
                }
              </div>

              <mat-divider></mat-divider>

              <div class="quick-actions">
                <button mat-stroked-button [routerLink]="['/patients', appt.patient?.id]">
                  <mat-icon>folder_open</mat-icon>
                  Chart
                </button>
                <button mat-stroked-button [routerLink]="['/encounters', 'new']" [queryParams]="{patientId: appt.patient?.id}">
                  <mat-icon>note_add</mat-icon>
                  New Note
                </button>
                <button mat-stroked-button [routerLink]="['/messages', 'compose']" [queryParams]="{patientId: appt.patient?.id}">
                  <mat-icon>message</mat-icon>
                  Message
                </button>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Provider & Location Card -->
          <mat-card class="info-card location-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>location_on</mat-icon>
                Provider & Location
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="info-row">
                <div class="info-label">Provider</div>
                <div class="info-value provider-value">
                  <app-avatar [name]="appt.provider?.name || ''" size="sm"></app-avatar>
                  <span>{{ appt.provider?.name }}</span>
                </div>
              </div>
              
              @if (appt.facilityName) {
                <div class="info-row">
                  <div class="info-label">Facility</div>
                  <div class="info-value">{{ appt.facilityName }}</div>
                </div>
              }
              
              @if (appt.roomName) {
                <div class="info-row">
                  <div class="info-label">Room</div>
                  <div class="info-value">{{ appt.roomName }}</div>
                </div>
              }

              @if (appt.isTelehealth && appt.telehealthLink) {
                <mat-divider></mat-divider>
                <div class="telehealth-section">
                  <h4>Telehealth</h4>
                  <a [href]="appt.telehealthLink" target="_blank" mat-flat-button color="primary">
                    <mat-icon>videocam</mat-icon>
                    Join Video Call
                  </a>
                </div>
              }
            </mat-card-content>
          </mat-card>

          <!-- Billing Card -->
          <mat-card class="info-card billing-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>payments</mat-icon>
                Billing Information
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="info-row">
                <div class="info-label">Insurance Verified</div>
                <div class="info-value">
                  @if (appt.insuranceVerified) {
                    <mat-icon class="verified-icon">check_circle</mat-icon>
                    <span class="verified-text">Verified</span>
                  } @else {
                    <mat-icon class="unverified-icon">warning</mat-icon>
                    <span class="unverified-text">Not Verified</span>
                  }
                </div>
              </div>

              @if (appt.copayAmount !== undefined) {
                <div class="info-row">
                  <div class="info-label">Copay Amount</div>
                  <div class="info-value">{{ appt.copayAmount | currency }}</div>
                </div>
              }

              @if (appt.copayAmount !== undefined) {
                <div class="info-row">
                  <div class="info-label">Copay Collected</div>
                  <div class="info-value">
                    @if (appt.copayCollected) {
                      <mat-icon class="verified-icon">check_circle</mat-icon>
                      <span class="verified-text">Collected</span>
                    } @else {
                      <mat-icon class="pending-icon">pending</mat-icon>
                      <span class="pending-text">Pending</span>
                    }
                  </div>
                </div>
              }

              @if (appt.serviceType) {
                <div class="info-row">
                  <div class="info-label">Service Type</div>
                  <div class="info-value">{{ appt.serviceType }}</div>
                </div>
              }
            </mat-card-content>
          </mat-card>

          <!-- Check-in & Reminders Card -->
          <mat-card class="info-card checkin-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>how_to_reg</mat-icon>
                Check-in & Reminders
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="timeline">
                <div class="timeline-item" [class.completed]="appt.confirmationSent">
                  <div class="timeline-marker">
                    <mat-icon>{{ appt.confirmationSent ? 'check' : 'radio_button_unchecked' }}</mat-icon>
                  </div>
                  <div class="timeline-content">
                    <span class="timeline-label">Confirmation Sent</span>
                    @if (appt.confirmedAt) {
                      <span class="timeline-date">Confirmed {{ appt.confirmedAt | date:'short' }}</span>
                    }
                  </div>
                </div>

                <div class="timeline-item" [class.completed]="appt.reminderSent">
                  <div class="timeline-marker">
                    <mat-icon>{{ appt.reminderSent ? 'check' : 'radio_button_unchecked' }}</mat-icon>
                  </div>
                  <div class="timeline-content">
                    <span class="timeline-label">Reminder Sent</span>
                  </div>
                </div>

                <div class="timeline-item" [class.completed]="appt.arrivedAt">
                  <div class="timeline-marker">
                    <mat-icon>{{ appt.arrivedAt ? 'check' : 'radio_button_unchecked' }}</mat-icon>
                  </div>
                  <div class="timeline-content">
                    <span class="timeline-label">Patient Arrived</span>
                    @if (appt.arrivedAt) {
                      <span class="timeline-date">{{ appt.arrivedAt | date:'shortTime' }}</span>
                    }
                  </div>
                </div>

                <div class="timeline-item" [class.completed]="appt.checkedInAt">
                  <div class="timeline-marker">
                    <mat-icon>{{ appt.checkedInAt ? 'check' : 'radio_button_unchecked' }}</mat-icon>
                  </div>
                  <div class="timeline-content">
                    <span class="timeline-label">Checked In</span>
                    @if (appt.checkedInAt) {
                      <span class="timeline-date">{{ appt.checkedInAt | date:'shortTime' }}</span>
                      @if (appt.checkedInBy) {
                        <span class="timeline-by">by {{ appt.checkedInBy }}</span>
                      }
                    }
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Recurrence Card (if recurring) -->
          @if (appt.isRecurring) {
            <mat-card class="info-card recurrence-card">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>repeat</mat-icon>
                  Recurring Appointment
                </mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="info-row">
                  <div class="info-label">Pattern</div>
                  <div class="info-value">{{ appt.recurrencePattern | titlecase }}</div>
                </div>
                @if (appt.recurrenceEndDate) {
                  <div class="info-row">
                    <div class="info-label">Ends</div>
                    <div class="info-value">{{ appt.recurrenceEndDate | date:'mediumDate' }}</div>
                  </div>
                }
              </mat-card-content>
            </mat-card>
          }
        </div>
        } @else {
          <div class="not-found">
            <mat-icon>event_busy</mat-icon>
            <h2>Appointment Not Found</h2>
            <p>The appointment you're looking for doesn't exist or has been removed.</p>
            <button mat-flat-button color="primary" routerLink="/appointments">
              Back to Appointments
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .appointment-detail-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .loading-skeleton {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
    }

    .info-card {
      border-radius: 12px;

      mat-card-header {
        padding: 16px 20px;
        border-bottom: 1px solid #e5e7eb;

        mat-card-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
          color: #111827;

          mat-icon {
            color: #6b7280;
          }
        }
      }

      mat-card-content {
        padding: 20px;
      }
    }

    .main-card {
      grid-column: span 2;
    }

    .status-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-radius: 8px;
      background: #f3f4f6;
      margin-bottom: 20px;

      &.status-fulfilled {
        background: #d1fae5;
      }
      &.status-in-progress {
        background: #dbeafe;
      }
      &.status-checked-in {
        background: #fef3c7;
      }
      &.status-cancelled {
        background: #fee2e2;
      }
      &.status-noshow {
        background: #fecaca;
      }
    }

    .status-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .status-label {
      font-weight: 500;
      color: #374151;
    }

    .cancelled-info {
      font-size: 14px;
      color: #6b7280;
    }

    .appointment-type-section {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }

    .type-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 500;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .telehealth-chip {
      mat-icon {
        font-size: 18px;
      }
    }

    .datetime-section {
      display: flex;
      gap: 32px;
      flex-wrap: wrap;
    }

    .datetime-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;

      mat-icon {
        color: #6b7280;
        margin-top: 2px;
      }
    }

    .datetime-content {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .label {
        font-size: 12px;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .value {
        font-size: 15px;
        font-weight: 500;
        color: #111827;
      }
    }

    .reason-section, .notes-section {
      padding-top: 16px;

      h4 {
        font-size: 14px;
        font-weight: 600;
        color: #374151;
        margin: 0 0 8px;
      }

      p {
        margin: 0;
        color: #4b5563;
        line-height: 1.6;
      }
    }

    .chief-complaint {
      margin-top: 8px;
      font-size: 14px;

      .label {
        font-weight: 500;
        color: #374151;
      }
    }

    .patient-info {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }

    .patient-details {
      h3 {
        margin: 0 0 4px;
        font-size: 18px;
        font-weight: 600;
        color: #111827;
      }
    }

    .view-patient-link {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #2563eb;
      text-decoration: none;
      font-size: 14px;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      &:hover {
        text-decoration: underline;
      }
    }

    .contact-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 8px;

      mat-icon {
        color: #6b7280;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      a {
        color: #2563eb;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .quick-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
      flex-wrap: wrap;

      button {
        flex: 1;
        min-width: 100px;
      }
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f3f4f6;

      &:last-child {
        border-bottom: none;
      }
    }

    .info-label {
      color: #6b7280;
      font-size: 14px;
    }

    .info-value {
      font-weight: 500;
      color: #111827;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .provider-value {
      app-avatar {
        margin-right: 4px;
      }
    }

    .verified-icon {
      color: #10b981;
      font-size: 20px;
    }

    .verified-text {
      color: #10b981;
    }

    .unverified-icon {
      color: #f59e0b;
      font-size: 20px;
    }

    .unverified-text {
      color: #f59e0b;
    }

    .pending-icon {
      color: #6b7280;
      font-size: 20px;
    }

    .pending-text {
      color: #6b7280;
    }

    .telehealth-section {
      padding-top: 16px;

      h4 {
        font-size: 14px;
        font-weight: 600;
        color: #374151;
        margin: 0 0 12px;
      }
    }

    .timeline {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .timeline-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 0;
      position: relative;

      &:not(:last-child)::after {
        content: '';
        position: absolute;
        left: 11px;
        top: 36px;
        bottom: 0;
        width: 2px;
        background: #e5e7eb;
      }

      &.completed {
        .timeline-marker mat-icon {
          color: #10b981;
        }

        &::after {
          background: #10b981;
        }
      }
    }

    .timeline-marker {
      mat-icon {
        color: #d1d5db;
        font-size: 24px;
      }
    }

    .timeline-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .timeline-label {
      font-weight: 500;
      color: #374151;
    }

    .timeline-date, .timeline-by {
      font-size: 13px;
      color: #6b7280;
    }

    .not-found {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 24px;
      text-align: center;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #d1d5db;
        margin-bottom: 16px;
      }

      h2 {
        margin: 0 0 8px;
        color: #374151;
      }

      p {
        color: #6b7280;
        margin: 0 0 24px;
      }
    }

    .warning-item {
      color: #f59e0b !important;
    }

    .danger-item {
      color: #ef4444 !important;
    }

    @media (max-width: 768px) {
      .appointment-detail-container {
        padding: 16px;
      }

      .detail-grid {
        grid-template-columns: 1fr;
      }

      .main-card {
        grid-column: span 1;
      }

      .header-actions {
        flex-direction: column;
      }

      .datetime-section {
        flex-direction: column;
        gap: 16px;
      }

      .quick-actions {
        flex-direction: column;

        button {
          width: 100%;
        }
      }
    }
  `]
})
export class AppointmentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly appointmentService = inject(AppointmentService);

  appointment = signal<Appointment | null>(null);
  loading = signal(true);

  breadcrumbs = [
    { label: 'Appointments', route: '/appointments' },
    { label: 'Details' }
  ];

  protected readonly getStatusVariant = getStatusVariant;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadAppointment(id);
    } else {
      this.loading.set(false);
    }
  }

  private loadAppointment(id: string): void {
    this.loading.set(true);
    this.appointmentService.getAppointment(id).subscribe({
      next: (appt) => {
        // Normalize data to ensure patient/provider objects always exist
        this.appointment.set({
          ...appt,
          patient: appt.patient ?? {
            id: appt.patientId,
            name: appt.patientName,
            phone: appt.patientPhone,
            email: appt.patientEmail,
            photo: appt.patientPhoto
          },
          provider: appt.provider ?? {
            id: appt.providerId,
            name: appt.providerName
          }
        });
        this.loading.set(false);
      },
      error: () => {
        this.appointment.set(null);
        this.loading.set(false);
      }
    });
  }

  getFormattedDateTime(): string {
    const appt = this.appointment();
    if (!appt) return '';
    const date = new Date(appt.start);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  getTypeConfig() {
    const appt = this.appointment();
    return APPOINTMENT_TYPE_CONFIG.find(t => t.type === appt?.type);
  }

  getTypeLabel(): string {
    return this.getTypeConfig()?.label || 'Appointment';
  }

  getTypeColor(): string {
    return this.getTypeConfig()?.color || '#6b7280';
  }

  getTypeIcon(): string {
    return this.getTypeConfig()?.icon || 'event';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'proposed': 'Proposed',
      'pending': 'Pending Confirmation',
      'booked': 'Confirmed',
      'arrived': 'Patient Arrived',
      'fulfilled': 'Completed',
      'cancelled': 'Cancelled',
      'noshow': 'No Show',
      'checked-in': 'Checked In',
      'in-progress': 'In Progress'
    };
    return labels[status] || status;
  }

  canEdit(): boolean {
    const appt = this.appointment();
    return !!appt && !['fulfilled', 'cancelled', 'noshow'].includes(appt.status);
  }

  checkIn(): void {
    const appt = this.appointment();
    if (!appt) return;

    this.appointmentService.checkIn(appt.id).subscribe({
      next: (updated) => {
        this.appointment.set(updated);
        this.snackBar.open('Patient checked in successfully', 'Close', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Failed to check in patient', 'Close', { duration: 3000 });
      }
    });
  }

  startEncounter(): void {
    const appt = this.appointment();
    if (!appt) return;

    this.appointmentService.startEncounter(appt.id).subscribe({
      next: (updated) => {
        this.appointment.set(updated);
        this.router.navigate(['/encounters', 'new'], { 
          queryParams: { appointmentId: appt.id, patientId: appt.patient?.id || appt.patientId }
        });
      },
      error: () => {
        this.snackBar.open('Failed to start encounter', 'Close', { duration: 3000 });
      }
    });
  }

  completeAppointment(): void {
    const appt = this.appointment();
    if (!appt) return;

    this.appointmentService.completeAppointment(appt.id).subscribe({
      next: (updated) => {
        this.appointment.set(updated);
        this.snackBar.open('Appointment completed', 'Close', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Failed to complete appointment', 'Close', { duration: 3000 });
      }
    });
  }

  sendReminder(): void {
    const appt = this.appointment();
    if (!appt) return;

    this.appointmentService.sendReminder(appt.id).subscribe({
      next: () => {
        // Update local state since service returns void
        this.appointment.set({
          ...appt,
          reminderSent: true,
          reminderSentAt: new Date()
        });
        this.snackBar.open('Reminder sent successfully', 'Close', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Failed to send reminder', 'Close', { duration: 3000 });
      }
    });
  }

  reschedule(): void {
    const appt = this.appointment();
    if (appt) {
      this.router.navigate(['/appointments', appt.id, 'edit'], { 
        queryParams: { reschedule: true }
      });
    }
  }

  markNoShow(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Mark as No-Show',
        message: 'Are you sure you want to mark this patient as a no-show? This action will be recorded in their history.',
        confirmText: 'Mark No-Show',
        cancelText: 'Cancel',
        type: 'warning'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        const appt = this.appointment();
        if (!appt) return;

        this.appointmentService.markNoShow(appt.id).subscribe({
          next: (updated) => {
            this.appointment.set(updated);
            this.snackBar.open('Appointment marked as no-show', 'Close', { duration: 3000 });
          },
          error: () => {
            this.snackBar.open('Failed to update appointment', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  cancelAppointment(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cancel Appointment',
        message: 'Are you sure you want to cancel this appointment? The patient will be notified.',
        confirmText: 'Cancel Appointment',
        cancelText: 'Keep Appointment',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        const appt = this.appointment();
        if (!appt) return;

        this.appointmentService.cancelAppointment(appt.id, 'Cancelled by staff').subscribe({
          next: (updated) => {
            this.appointment.set(updated);
            this.snackBar.open('Appointment cancelled', 'Close', { duration: 3000 });
          },
          error: () => {
            this.snackBar.open('Failed to cancel appointment', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }
}
