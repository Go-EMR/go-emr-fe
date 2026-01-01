import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TimelineModule } from 'primeng/timeline';
import { PanelModule } from 'primeng/panel';
import { MessageService, ConfirmationService, MenuItem } from 'primeng/api';

import { AppointmentService } from '../data-access/services/appointment.service';
import { Appointment, APPOINTMENT_TYPE_CONFIG, AppointmentType } from '../data-access/models/appointment.model';
import { ThemeService } from '../../../core/services/theme.service';

interface StatusHistoryItem {
  status: string;
  date: Date;
  user?: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-appointment-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    // PrimeNG
    CardModule,
    ButtonModule,
    TagModule,
    ChipModule,
    AvatarModule,
    MenuModule,
    TooltipModule,
    DividerModule,
    SkeletonModule,
    ConfirmDialogModule,
    ToastModule,
    TimelineModule,
    PanelModule,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="appointment-detail" [class.dark]="themeService.isDarkMode()">
      <p-toast />
      <p-confirmDialog />

      @if (loading()) {
        <!-- Loading State -->
        <div class="loading-state">
          <div class="header-skeleton">
            <p-skeleton width="300px" height="32px" />
            <p-skeleton width="200px" height="20px" />
          </div>
          <div class="content-skeleton">
            <p-skeleton width="100%" height="300px" borderRadius="16px" />
            <p-skeleton width="100%" height="200px" borderRadius="16px" />
          </div>
        </div>
      } @else if (appointment()) {
        <!-- Header -->
        <header class="page-header">
          <div class="header-content">
            <div class="breadcrumb">
              <a routerLink="/appointments" class="breadcrumb-link">
                <i class="pi pi-calendar"></i>
                Appointments
              </a>
              <i class="pi pi-chevron-right"></i>
              <span>Details</span>
            </div>
            <div class="title-section">
              <h1>{{ appointment()!.patientName }}</h1>
              <p class="subtitle">{{ getFormattedDateTime() }}</p>
            </div>
          </div>
          <div class="header-actions">
            @if (canEdit()) {
              <p-button
                label="Edit"
                icon="pi pi-pencil"
                [outlined]="true"
                [routerLink]="['/appointments', appointment()!.id, 'edit']"
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

        <!-- Main Content -->
        <div class="detail-grid">
          <!-- Main Info Card -->
          <p-card styleClass="main-card">
            <!-- Status Banner -->
            <div class="status-banner" [class]="'status-' + appointment()!.status">
              <div class="status-info">
                <p-tag
                  [value]="getStatusLabel(appointment()!.status)"
                  [severity]="getStatusSeverity(appointment()!.status)"
                  [rounded]="true"
                  class="status-tag"
                />
                <span class="status-text">{{ getStatusDescription(appointment()!.status) }}</span>
              </div>
              @if (appointment()!.cancelledAt) {
                <span class="cancelled-info">
                  <i class="pi pi-info-circle"></i>
                  Cancelled {{ appointment()!.cancelledAt | date:'short' }}
                  @if (appointment()!.cancellationReason) {
                    - {{ appointment()!.cancellationReason }}
                  }
                </span>
              }
            </div>

            <!-- Appointment Type -->
            <div class="type-section">
              <div class="type-badge" [style.background]="getTypeColor() + '20'" [style.color]="getTypeColor()">
                <i [class]="'pi ' + getTypeIcon()"></i>
                <span>{{ getTypeLabel() }}</span>
              </div>
              @if (appointment()!.isTelehealth) {
                <p-chip
                  label="Telehealth Visit"
                  icon="pi pi-video"
                  styleClass="telehealth-chip"
                />
              }
            </div>

            <p-divider />

            <!-- Date/Time Info -->
            <div class="datetime-section">
              <div class="datetime-item">
                <div class="datetime-icon">
                  <i class="pi pi-calendar"></i>
                </div>
                <div class="datetime-content">
                  <span class="label">Date</span>
                  <span class="value">{{ appointment()!.start | date:'EEEE, MMMM d, y' }}</span>
                </div>
              </div>
              <div class="datetime-item">
                <div class="datetime-icon">
                  <i class="pi pi-clock"></i>
                </div>
                <div class="datetime-content">
                  <span class="label">Time</span>
                  <span class="value">{{ appointment()!.start | date:'h:mm a' }} - {{ appointment()!.end | date:'h:mm a' }}</span>
                </div>
              </div>
              <div class="datetime-item">
                <div class="datetime-icon">
                  <i class="pi pi-stopwatch"></i>
                </div>
                <div class="datetime-content">
                  <span class="label">Duration</span>
                  <span class="value">{{ appointment()!.duration }} minutes</span>
                </div>
              </div>
            </div>

            @if (appointment()!.reasonDescription || appointment()!.chiefComplaint) {
              <p-divider />
              <div class="reason-section">
                <h4>
                  <i class="pi pi-info-circle"></i>
                  Reason for Visit
                </h4>
                @if (appointment()!.reasonDescription) {
                  <p class="reason-text">{{ appointment()!.reasonDescription }}</p>
                }
                @if (appointment()!.chiefComplaint) {
                  <div class="chief-complaint">
                    <span class="label">Chief Complaint:</span>
                    <span>{{ appointment()!.chiefComplaint }}</span>
                  </div>
                }
              </div>
            }

            @if (appointment()!.notes) {
              <p-divider />
              <div class="notes-section">
                <h4>
                  <i class="pi pi-file-edit"></i>
                  Notes
                </h4>
                <p>{{ appointment()!.notes }}</p>
              </div>
            }
          </p-card>

          <!-- Patient Card -->
          <p-card styleClass="patient-card">
            <ng-template pTemplate="header">
              <div class="card-header">
                <i class="pi pi-user"></i>
                <h3>Patient Information</h3>
              </div>
            </ng-template>

            <div class="patient-info">
              <p-avatar
                [label]="getPatientInitials()"
                [image]="appointment()!.patientPhoto || ''"
                [style]="{ 'background-color': '#3b82f6', 'color': 'white', 'font-size': '1.25rem' }"
                size="xlarge"
                shape="circle"
              />
              <div class="patient-details">
                <h3>{{ appointment()!.patientName }}</h3>
                <a [routerLink]="['/patients', appointment()!.patientId]" class="view-link">
                  View Patient Record
                  <i class="pi pi-arrow-right"></i>
                </a>
              </div>
            </div>

            <p-divider />

            <div class="contact-info">
              @if (appointment()!.patientPhone) {
                <div class="contact-item">
                  <i class="pi pi-phone"></i>
                  <span>{{ appointment()!.patientPhone }}</span>
                  <p-button
                    icon="pi pi-phone"
                    [rounded]="true"
                    [text]="true"
                    severity="success"
                    pTooltip="Call"
                    tooltipPosition="top"
                  />
                </div>
              }
              @if (appointment()!.patientEmail) {
                <div class="contact-item">
                  <i class="pi pi-envelope"></i>
                  <span>{{ appointment()!.patientEmail }}</span>
                  <p-button
                    icon="pi pi-envelope"
                    [rounded]="true"
                    [text]="true"
                    pTooltip="Email"
                    tooltipPosition="top"
                  />
                </div>
              }
            </div>
          </p-card>

          <!-- Provider Card -->
          <p-card styleClass="provider-card">
            <ng-template pTemplate="header">
              <div class="card-header">
                <i class="pi pi-id-card"></i>
                <h3>Provider Information</h3>
              </div>
            </ng-template>

            <div class="provider-info">
              <p-avatar
                [label]="getProviderInitials()"
                [style]="{ 'background-color': '#10b981', 'color': 'white' }"
                size="large"
                shape="circle"
              />
              <div class="provider-details">
                <h4>{{ appointment()!.providerName }}</h4>
                <span class="facility">{{ appointment()!.facilityName }}</span>
                @if (appointment()!.roomName) {
                  <span class="room">Room: {{ appointment()!.roomName }}</span>
                }
              </div>
            </div>
          </p-card>

          <!-- Status History -->
          <p-card styleClass="history-card">
            <ng-template pTemplate="header">
              <div class="card-header">
                <i class="pi pi-history"></i>
                <h3>Status History</h3>
              </div>
            </ng-template>

            <p-timeline [value]="statusHistory" styleClass="status-timeline">
              <ng-template pTemplate="marker" let-item>
                <span class="history-marker" [style.background]="item.color">
                  <i [class]="'pi ' + item.icon"></i>
                </span>
              </ng-template>
              <ng-template pTemplate="content" let-item>
                <div class="history-content">
                  <span class="history-status">{{ item.status }}</span>
                  <span class="history-date">{{ item.date | date:'medium' }}</span>
                  @if (item.user) {
                    <span class="history-user">by {{ item.user }}</span>
                  }
                </div>
              </ng-template>
            </p-timeline>
          </p-card>

          <!-- Billing Card -->
          @if (appointment()!.copayAmount !== undefined) {
            <p-card styleClass="billing-card">
              <ng-template pTemplate="header">
                <div class="card-header">
                  <i class="pi pi-credit-card"></i>
                  <h3>Billing Information</h3>
                </div>
              </ng-template>

              <div class="billing-info">
                <div class="billing-row">
                  <span class="label">Insurance Verified</span>
                  <p-tag
                    [value]="appointment()!.insuranceVerified ? 'Verified' : 'Not Verified'"
                    [severity]="appointment()!.insuranceVerified ? 'success' : 'warn'"
                    [rounded]="true"
                  />
                </div>
                <div class="billing-row">
                  <span class="label">Copay Amount</span>
                  <span class="value">\${{ appointment()!.copayAmount?.toFixed(2) }}</span>
                </div>
                <div class="billing-row">
                  <span class="label">Copay Collected</span>
                  <p-tag
                    [value]="appointment()!.copayCollected ? 'Collected' : 'Pending'"
                    [severity]="appointment()!.copayCollected ? 'success' : 'warn'"
                    [rounded]="true"
                  />
                </div>
              </div>
            </p-card>
          }
        </div>
      } @else {
        <!-- Error State -->
        <div class="error-state">
          <i class="pi pi-exclamation-triangle"></i>
          <h3>Appointment not found</h3>
          <p>The requested appointment could not be loaded.</p>
          <p-button
            label="Back to Appointments"
            icon="pi pi-arrow-left"
            routerLink="/appointments"
          />
        </div>
      }
    </div>
  `,
  styles: [`
    .appointment-detail {
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

    /* Detail Grid */
    .detail-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;
    }

    :host ::ng-deep .main-card,
    :host ::ng-deep .patient-card,
    :host ::ng-deep .provider-card,
    :host ::ng-deep .history-card,
    :host ::ng-deep .billing-card {
      border-radius: 1rem;
    }

    .dark :host ::ng-deep .p-card {
      background: #1e293b;
      border-color: #334155;
    }

    .main-card {
      grid-row: span 2;
    }

    /* Card Headers */
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

    /* Status Banner */
    .status-banner {
      padding: 1rem;
      border-radius: 0.75rem;
      margin-bottom: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .status-banner.status-booked { background: #dbeafe; }
    .status-banner.status-confirmed { background: #dbeafe; }
    .status-banner.status-arrived { background: #d1fae5; }
    .status-banner.status-checked-in { background: #d1fae5; }
    .status-banner.status-in-progress { background: #fef3c7; }
    .status-banner.status-fulfilled { background: #f1f5f9; }
    .status-banner.status-cancelled { background: #fee2e2; }
    .status-banner.status-noshow { background: #fee2e2; }

    .dark .status-banner.status-booked,
    .dark .status-banner.status-confirmed { background: #1e3a8a; }
    .dark .status-banner.status-arrived,
    .dark .status-banner.status-checked-in { background: #064e3b; }
    .dark .status-banner.status-in-progress { background: #78350f; }
    .dark .status-banner.status-fulfilled { background: #334155; }
    .dark .status-banner.status-cancelled,
    .dark .status-banner.status-noshow { background: #7f1d1d; }

    .status-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    :host ::ng-deep .status-tag .p-tag {
      font-size: 0.875rem;
      padding: 0.375rem 0.75rem;
    }

    .status-text {
      font-weight: 500;
      color: #374151;
    }

    .dark .status-text {
      color: #e2e8f0;
    }

    .cancelled-info {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.8125rem;
      color: #dc2626;
    }

    /* Type Section */
    .type-section {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .type-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-weight: 500;
    }

    :host ::ng-deep .telehealth-chip {
      background: #ede9fe;
      color: #7c3aed;
    }

    .dark :host ::ng-deep .telehealth-chip {
      background: #4c1d95;
      color: #c4b5fd;
    }

    /* DateTime Section */
    .datetime-section {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
    }

    .datetime-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .datetime-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .dark .datetime-icon {
      background: #334155;
    }

    .datetime-icon i {
      color: #3b82f6;
    }

    .datetime-content {
      display: flex;
      flex-direction: column;
    }

    .datetime-content .label {
      font-size: 0.75rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .dark .datetime-content .label {
      color: #94a3b8;
    }

    .datetime-content .value {
      font-weight: 500;
      color: #1e293b;
    }

    .dark .datetime-content .value {
      color: #f1f5f9;
    }

    /* Reason Section */
    .reason-section h4,
    .notes-section h4 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 0.75rem;
      font-size: 0.9375rem;
      color: #374151;
    }

    .dark .reason-section h4,
    .dark .notes-section h4 {
      color: #e2e8f0;
    }

    .reason-section h4 i,
    .notes-section h4 i {
      color: #64748b;
    }

    .reason-text {
      margin: 0;
      color: #1e293b;
      line-height: 1.6;
    }

    .dark .reason-text {
      color: #e2e8f0;
    }

    .chief-complaint {
      margin-top: 0.75rem;
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: 0.5rem;
    }

    .dark .chief-complaint {
      background: #334155;
    }

    .chief-complaint .label {
      font-weight: 500;
      margin-right: 0.5rem;
      color: #64748b;
    }

    .notes-section p {
      margin: 0;
      color: #64748b;
      line-height: 1.6;
    }

    .dark .notes-section p {
      color: #94a3b8;
    }

    /* Patient Info */
    .patient-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
    }

    .patient-details h3 {
      margin: 0 0 0.25rem;
      font-size: 1.125rem;
      color: #1e293b;
    }

    .dark .patient-details h3 {
      color: #f1f5f9;
    }

    .view-link {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      color: #3b82f6;
      text-decoration: none;
      font-size: 0.875rem;
    }

    .view-link:hover {
      text-decoration: underline;
    }

    .contact-info {
      padding: 0 1rem 1rem;
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0;
    }

    .contact-item i {
      color: #64748b;
    }

    .contact-item span {
      flex: 1;
      color: #374151;
    }

    .dark .contact-item span {
      color: #e2e8f0;
    }

    /* Provider Info */
    .provider-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
    }

    .provider-details {
      display: flex;
      flex-direction: column;
    }

    .provider-details h4 {
      margin: 0 0 0.25rem;
      font-size: 1rem;
      color: #1e293b;
    }

    .dark .provider-details h4 {
      color: #f1f5f9;
    }

    .provider-details .facility,
    .provider-details .room {
      font-size: 0.875rem;
      color: #64748b;
    }

    .dark .provider-details .facility,
    .dark .provider-details .room {
      color: #94a3b8;
    }

    /* Status History */
    .history-marker {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .history-marker i {
      font-size: 0.875rem;
      color: white;
    }

    .history-content {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .history-status {
      font-weight: 500;
      color: #1e293b;
    }

    .dark .history-status {
      color: #f1f5f9;
    }

    .history-date {
      font-size: 0.8125rem;
      color: #64748b;
    }

    .dark .history-date {
      color: #94a3b8;
    }

    .history-user {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    /* Billing */
    .billing-info {
      padding: 1rem;
    }

    .billing-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid #e2e8f0;
    }

    .dark .billing-row {
      border-bottom-color: #334155;
    }

    .billing-row:last-child {
      border-bottom: none;
    }

    .billing-row .label {
      color: #64748b;
    }

    .dark .billing-row .label {
      color: #94a3b8;
    }

    .billing-row .value {
      font-weight: 600;
      color: #1e293b;
    }

    .dark .billing-row .value {
      color: #f1f5f9;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .detail-grid {
        grid-template-columns: 1fr;
      }

      .main-card {
        grid-row: auto;
      }

      .content-skeleton {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .appointment-detail {
        padding: 1rem;
      }

      .page-header {
        flex-direction: column;
        align-items: stretch;
      }

      .header-actions {
        justify-content: flex-end;
      }

      .datetime-section {
        flex-direction: column;
        gap: 1rem;
      }
    }
  `]
})
export class AppointmentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly appointmentService = inject(AppointmentService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  readonly themeService = inject(ThemeService);

  appointment = signal<Appointment | null>(null);
  loading = signal(true);

  actionMenuItems: MenuItem[] = [];

  statusHistory: StatusHistoryItem[] = [];

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
        this.appointment.set(appt);
        this.buildActionMenu(appt);
        this.buildStatusHistory(appt);
        this.loading.set(false);
      },
      error: () => {
        this.appointment.set(null);
        this.loading.set(false);
      }
    });
  }

  private buildActionMenu(appt: Appointment): void {
    const items: MenuItem[] = [];

    if (appt.status === 'booked') {
      items.push({
        label: 'Check In Patient',
        icon: 'pi pi-check',
        command: () => this.checkIn()
      });
    }

    if (appt.status === 'checked-in') {
      items.push({
        label: 'Start Encounter',
        icon: 'pi pi-play',
        command: () => this.startEncounter()
      });
    }

    if (appt.status === 'in-progress') {
      items.push({
        label: 'Complete Appointment',
        icon: 'pi pi-check-circle',
        command: () => this.completeAppointment()
      });
    }

    if (!['fulfilled', 'cancelled', 'noshow'].includes(appt.status)) {
      items.push(
        {
          label: 'Send Reminder',
          icon: 'pi pi-bell',
          command: () => this.sendReminder()
        },
        { separator: true },
        {
          label: 'Reschedule',
          icon: 'pi pi-calendar-plus',
          command: () => this.reschedule()
        },
        {
          label: 'Mark as No-Show',
          icon: 'pi pi-user-minus',
          styleClass: 'text-orange-500',
          command: () => this.markNoShow()
        },
        {
          label: 'Cancel Appointment',
          icon: 'pi pi-times',
          styleClass: 'text-red-500',
          command: () => this.cancelAppointment()
        }
      );
    }

    this.actionMenuItems = items;
  }

  private buildStatusHistory(appt: Appointment): void {
    const history: StatusHistoryItem[] = [
      {
        status: 'Created',
        date: appt.createdAt,
        user: appt.createdBy,
        icon: 'pi-plus',
        color: '#3b82f6'
      }
    ];

    if (appt.confirmedAt) {
      history.push({
        status: 'Confirmed',
        date: appt.confirmedAt,
        user: appt.confirmedBy,
        icon: 'pi-check',
        color: '#10b981'
      });
    }

    if (appt.checkedInAt) {
      history.push({
        status: 'Checked In',
        date: appt.checkedInAt,
        user: appt.checkedInBy,
        icon: 'pi-sign-in',
        color: '#10b981'
      });
    }

    if (appt.cancelledAt) {
      history.push({
        status: 'Cancelled',
        date: appt.cancelledAt,
        user: appt.cancelledBy,
        icon: 'pi-times',
        color: '#ef4444'
      });
    }

    this.statusHistory = history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
    return APPOINTMENT_TYPE_CONFIG.find(t => t.type === appt?.appointmentType);
  }

  getTypeLabel(): string {
    return this.getTypeConfig()?.label || 'Appointment';
  }

  getTypeColor(): string {
    return this.getTypeConfig()?.color || '#64748b';
  }

  getTypeIcon(): string {
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
    const type = this.appointment()?.appointmentType;
    return icons[type || ''] || 'pi-calendar';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'proposed': 'Proposed',
      'pending': 'Pending',
      'booked': 'Confirmed',
      'arrived': 'Arrived',
      'fulfilled': 'Completed',
      'cancelled': 'Cancelled',
      'noshow': 'No Show',
      'checked-in': 'Checked In',
      'in-progress': 'In Progress'
    };
    return labels[status] || status;
  }

  getStatusDescription(status: string): string {
    const descriptions: Record<string, string> = {
      'booked': 'Appointment is confirmed and scheduled',
      'checked-in': 'Patient has arrived and checked in',
      'in-progress': 'Appointment is currently in progress',
      'fulfilled': 'Appointment has been completed',
      'cancelled': 'Appointment was cancelled',
      'noshow': 'Patient did not show up'
    };
    return descriptions[status] || '';
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

  getPatientInitials(): string {
    const name = this.appointment()?.patientName || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getProviderInitials(): string {
    const name = this.appointment()?.providerName || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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
        this.buildActionMenu(updated);
        this.buildStatusHistory(updated);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Patient checked in successfully'
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to check in patient'
        });
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
          queryParams: { appointmentId: appt.id, patientId: appt.patientId }
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to start encounter'
        });
      }
    });
  }

  completeAppointment(): void {
    const appt = this.appointment();
    if (!appt) return;

    this.appointmentService.completeAppointment(appt.id).subscribe({
      next: (updated) => {
        this.appointment.set(updated);
        this.buildActionMenu(updated);
        this.buildStatusHistory(updated);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Appointment completed'
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to complete appointment'
        });
      }
    });
  }

  sendReminder(): void {
    const appt = this.appointment();
    if (!appt) return;

    this.appointmentService.sendReminder(appt.id).subscribe({
      next: () => {
        this.appointment.set({
          ...appt,
          reminderSent: true,
          reminderSentAt: new Date()
        });
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Reminder sent successfully'
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to send reminder'
        });
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
    this.confirmationService.confirm({
      message: 'Are you sure you want to mark this patient as a no-show? This action will be recorded in their history.',
      header: 'Mark as No-Show',
      icon: 'pi pi-user-minus',
      acceptLabel: 'Mark No-Show',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () => {
        const appt = this.appointment();
        if (!appt) return;

        this.appointmentService.markNoShow(appt.id).subscribe({
          next: (updated) => {
            this.appointment.set(updated);
            this.buildActionMenu(updated);
            this.buildStatusHistory(updated);
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Appointment marked as no-show'
            });
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to update appointment'
            });
          }
        });
      }
    });
  }

  cancelAppointment(): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to cancel this appointment? The patient will be notified.',
      header: 'Cancel Appointment',
      icon: 'pi pi-times-circle',
      acceptLabel: 'Cancel Appointment',
      rejectLabel: 'Keep Appointment',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        const appt = this.appointment();
        if (!appt) return;

        this.appointmentService.cancelAppointment(appt.id, 'Cancelled by staff').subscribe({
          next: (updated) => {
            this.appointment.set(updated);
            this.buildActionMenu(updated);
            this.buildStatusHistory(updated);
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Appointment cancelled'
            });
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to cancel appointment'
            });
          }
        });
      }
    });
  }
}
