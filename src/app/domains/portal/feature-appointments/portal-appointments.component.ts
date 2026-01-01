import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PortalService } from '../data-access/services/portal.service';
import { UpcomingAppointment, AppointmentSlot } from '../data-access/models/portal.model';

@Component({
  selector: 'app-portal-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="appointments-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <a routerLink="/portal" class="back-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to Dashboard
          </a>
          <h1>My Appointments</h1>
        </div>
        <button class="btn btn-primary" (click)="openBookingModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
            <line x1="12" y1="14" x2="12" y2="18"/>
            <line x1="10" y1="16" x2="14" y2="16"/>
          </svg>
          Book Appointment
        </button>
      </header>

      <!-- Tabs -->
      <div class="tabs">
        <button 
          class="tab-btn"
          [class.active]="activeTab() === 'upcoming'"
          (click)="activeTab.set('upcoming')"
        >
          Upcoming
          @if (activeUpcomingCount() > 0) {
            <span class="badge">{{ activeUpcomingCount() }}</span>
          }
        </button>
        <button 
          class="tab-btn"
          [class.active]="activeTab() === 'past'"
          (click)="activeTab.set('past')"
        >
          Past
        </button>
        <button 
          class="tab-btn"
          [class.active]="activeTab() === 'requests'"
          (click)="activeTab.set('requests')"
        >
          Requests
          @if (pendingRequestsCount() > 0) {
            <span class="badge">{{ pendingRequestsCount() }}</span>
          }
        </button>
      </div>

      <!-- Upcoming Appointments -->
      @if (activeTab() === 'upcoming') {
        <div class="appointments-list">
          @for (appt of portalService.upcomingAppointments(); track appt.id) {
            <div class="appointment-card" [class.cancelled]="appt.status === 'cancelled'" [class.telehealth]="appt.telehealth">
              <div class="appt-header">
                <div class="appt-date-badge" [class.telehealth]="appt.telehealth">
                  <span class="day">{{ appt.date | date:'d' }}</span>
                  <span class="month">{{ appt.date | date:'MMM' }}</span>
                  <span class="year">{{ appt.date | date:'yyyy' }}</span>
                </div>
                <div class="appt-info">
                  <h3>{{ appt.appointmentType }}</h3>
                  <p class="provider">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    {{ appt.providerName }} - {{ appt.providerSpecialty }}
                  </p>
                  <p class="time">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {{ appt.startTime }} - {{ appt.endTime }}
                  </p>
                  <p class="location">
                    @if (appt.telehealth) {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="23 7 16 12 23 17 23 7"/>
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                      </svg>
                      Telehealth Visit
                    } @else {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      {{ appt.locationName }}
                    }
                  </p>
                </div>
                <div class="appt-status">
                  <span class="status-badge" [class]="appt.status">
                    {{ appt.status | titlecase }}
                  </span>
                </div>
              </div>

              @if (appt.preVisitInstructions) {
                <div class="appt-instructions">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                  <p>{{ appt.preVisitInstructions }}</p>
                </div>
              }

              @if (appt.formsRequired.length > 0) {
                <div class="appt-forms">
                  <span class="forms-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    Forms required:
                  </span>
                  @for (form of appt.formsRequired; track form) {
                    <a routerLink="/portal/forms" class="form-link">{{ form }}</a>
                  }
                </div>
              }

              <div class="appt-actions">
                @if (appt.status !== 'cancelled') {
                  @if (appt.confirmationRequired) {
                    <button class="btn btn-primary" (click)="confirmAppointment(appt.id)">
                      Confirm Appointment
                    </button>
                  }
                  @if (appt.telehealth && appt.telehealthUrl) {
                    <a [href]="appt.telehealthUrl" target="_blank" class="btn btn-primary">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="23 7 16 12 23 17 23 7"/>
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                      </svg>
                      Join Video Visit
                    </a>
                  }
                  @if (appt.canReschedule) {
                    <button class="btn btn-secondary" (click)="openRescheduleModal(appt)">
                      Reschedule
                    </button>
                  }
                  @if (appt.canCancel) {
                    <button class="btn btn-danger-outline" (click)="cancelAppointment(appt)">
                      Cancel
                    </button>
                  }
                  <button class="btn btn-secondary" (click)="addToCalendar(appt)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    Add to Calendar
                  </button>
                }
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <h3>No Upcoming Appointments</h3>
              <p>Book an appointment to get started</p>
              <button class="btn btn-primary" (click)="openBookingModal()">
                Book Appointment
              </button>
            </div>
          }
        </div>
      }

      <!-- Past Appointments (placeholder) -->
      @if (activeTab() === 'past') {
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <h3>Past Appointments</h3>
          <p>Your appointment history will appear here</p>
        </div>
      }

      <!-- Requests Tab -->
      @if (activeTab() === 'requests') {
        <div class="appointments-list">
          @for (request of portalService.appointmentRequests(); track request.id) {
            <div class="request-card" [class]="request.status">
              <div class="request-info">
                <h3>{{ request.appointmentType }}</h3>
                <p class="reason">{{ request.reason }}</p>
                <p class="urgency">
                  <span class="urgency-badge" [class]="request.urgency">
                    {{ request.urgency | titlecase }}
                  </span>
                </p>
                <p class="submitted">Submitted: {{ request.createdAt | date:'MMM d, yyyy' }}</p>
              </div>
              <div class="request-status">
                <span class="status-badge" [class]="request.status">
                  {{ request.status | titlecase }}
                </span>
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <h3>No Appointment Requests</h3>
              <p>Your appointment requests will appear here</p>
            </div>
          }
        </div>
      }

      <!-- Booking Modal -->
      @if (showBookingModal()) {
        <div class="modal-overlay" (click)="closeBookingModal()">
          <div class="modal booking-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Book an Appointment</h2>
              <button class="btn-close" (click)="closeBookingModal()">×</button>
            </div>
            <div class="modal-body">
              <!-- Step 1: Appointment Type -->
              @if (bookingStep() === 1) {
                <div class="booking-step">
                  <h3>What type of visit do you need?</h3>
                  <div class="appointment-types">
                    @for (type of appointmentTypes; track type.id) {
                      <button 
                        class="type-card"
                        [class.selected]="selectedType() === type.id"
                        (click)="selectType(type.id)"
                      >
                        <div class="type-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            @if (type.id === 'office') {
                              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                              <polyline points="9 22 9 12 15 12 15 22"/>
                            } @else if (type.id === 'telehealth') {
                              <polygon points="23 7 16 12 23 17 23 7"/>
                              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                            } @else if (type.id === 'urgent') {
                              <circle cx="12" cy="12" r="10"/>
                              <line x1="12" y1="8" x2="12" y2="12"/>
                              <line x1="12" y1="16" x2="12.01" y2="16"/>
                            } @else {
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                              <line x1="16" y1="2" x2="16" y2="6"/>
                              <line x1="8" y1="2" x2="8" y2="6"/>
                              <line x1="3" y1="10" x2="21" y2="10"/>
                            }
                          </svg>
                        </div>
                        <div class="type-info">
                          <span class="type-name">{{ type.name }}</span>
                          <span class="type-duration">{{ type.duration }}</span>
                        </div>
                      </button>
                    }
                  </div>
                </div>
              }

              <!-- Step 2: Provider Selection -->
              @if (bookingStep() === 2) {
                <div class="booking-step">
                  <h3>Select a provider</h3>
                  <div class="provider-list">
                    @for (provider of providers; track provider.id) {
                      <button 
                        class="provider-card"
                        [class.selected]="selectedProvider() === provider.id"
                        (click)="selectProvider(provider.id)"
                      >
                        <div class="provider-avatar">
                          {{ getInitials(provider.name) }}
                        </div>
                        <div class="provider-info">
                          <span class="provider-name">{{ provider.name }}</span>
                          <span class="provider-specialty">{{ provider.specialty }}</span>
                        </div>
                      </button>
                    }
                  </div>
                </div>
              }

              <!-- Step 3: Date/Time Selection -->
              @if (bookingStep() === 3) {
                <div class="booking-step">
                  <h3>Select date and time</h3>
                  <div class="date-picker">
                    <div class="date-nav">
                      <button class="btn btn-icon" (click)="previousWeek()">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="15 18 9 12 15 6"/>
                        </svg>
                      </button>
                      <span>{{ currentWeekLabel() }}</span>
                      <button class="btn btn-icon" (click)="nextWeek()">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </button>
                    </div>
                    <div class="date-grid">
                      @for (day of weekDays(); track day.date) {
                        <div class="date-column" [class.selected]="selectedDate()?.toDateString() === day.date.toDateString()">
                          <button 
                            class="date-header"
                            [class.today]="isToday(day.date)"
                            [disabled]="day.slots.length === 0"
                            (click)="selectDate(day.date)"
                          >
                            <span class="dow">{{ day.date | date:'EEE' }}</span>
                            <span class="dom">{{ day.date | date:'d' }}</span>
                          </button>
                          @if (selectedDate()?.toDateString() === day.date.toDateString()) {
                            <div class="time-slots">
                              @for (slot of day.slots; track slot.id) {
                                <button 
                                  class="time-slot"
                                  [class.selected]="selectedSlot() === slot.id"
                                  (click)="selectSlot(slot.id)"
                                >
                                  {{ slot.startTime }}
                                </button>
                              }
                            </div>
                          }
                        </div>
                      }
                    </div>
                  </div>
                </div>
              }

              <!-- Step 4: Confirmation -->
              @if (bookingStep() === 4) {
                <div class="booking-step">
                  <h3>Confirm your appointment</h3>
                  <div class="confirmation-details">
                    <div class="confirm-item">
                      <label>Appointment Type</label>
                      <span>{{ getTypeName(selectedType()!) }}</span>
                    </div>
                    <div class="confirm-item">
                      <label>Provider</label>
                      <span>{{ getProviderName(selectedProvider()!) }}</span>
                    </div>
                    <div class="confirm-item">
                      <label>Date & Time</label>
                      <span>{{ selectedDate() | date:'EEEE, MMMM d, yyyy' }} at {{ getSlotTime(selectedSlot()!) }}</span>
                    </div>
                    <div class="form-group">
                      <label for="reason">Reason for visit</label>
                      <textarea 
                        id="reason" 
                        [(ngModel)]="visitReason"
                        placeholder="Please describe the reason for your visit"
                        rows="3"
                      ></textarea>
                    </div>
                  </div>
                </div>
              }
            </div>
            <div class="modal-footer">
              @if (bookingStep() > 1) {
                <button class="btn btn-secondary" (click)="previousStep()">Back</button>
              }
              @if (bookingStep() < 4) {
                <button 
                  class="btn btn-primary" 
                  (click)="nextStep()"
                  [disabled]="!canProceed()"
                >
                  Continue
                </button>
              } @else {
                <button class="btn btn-primary" (click)="bookAppointment()">
                  Confirm Booking
                </button>
              }
            </div>
          </div>
        </div>
      }

      <!-- Cancel Confirmation Modal -->
      @if (showCancelModal()) {
        <div class="modal-overlay" (click)="closeCancelModal()">
          <div class="modal cancel-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Cancel Appointment</h2>
              <button class="btn-close" (click)="closeCancelModal()">×</button>
            </div>
            <div class="modal-body">
              <p>Are you sure you want to cancel your appointment?</p>
              @if (appointmentToCancel()) {
                <div class="cancel-details">
                  <p><strong>{{ appointmentToCancel()!.appointmentType }}</strong></p>
                  <p>{{ appointmentToCancel()!.providerName }}</p>
                  <p>{{ appointmentToCancel()!.date | date:'EEEE, MMMM d, yyyy' }} at {{ appointmentToCancel()!.startTime }}</p>
                </div>
              }
              <div class="form-group">
                <label for="cancelReason">Reason for cancellation (optional)</label>
                <textarea 
                  id="cancelReason" 
                  [(ngModel)]="cancelReason"
                  placeholder="Please let us know why you're cancelling"
                  rows="3"
                ></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeCancelModal()">Keep Appointment</button>
              <button class="btn btn-danger" (click)="confirmCancel()">Cancel Appointment</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .appointments-container {
      padding: 1.5rem;
      max-width: 900px;
      margin: 0 auto;
    }

    /* Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.8125rem;
      color: #64748b;
      text-decoration: none;
      margin-bottom: 0.5rem;
    }

    .back-link:hover {
      color: #3b82f6;
    }

    .back-link svg {
      width: 1rem;
      height: 1rem;
    }

    .header-content h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-primary:disabled {
      background: #94a3b8;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: white;
      color: #475569;
      border: 1px solid #e2e8f0;
    }

    .btn-secondary:hover {
      background: #f1f5f9;
    }

    .btn-danger {
      background: #dc2626;
      color: white;
    }

    .btn-danger:hover {
      background: #b91c1c;
    }

    .btn-danger-outline {
      background: white;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    .btn-danger-outline:hover {
      background: #fef2f2;
    }

    .btn-icon {
      width: 2rem;
      height: 2rem;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
    }

    .btn svg {
      width: 1rem;
      height: 1rem;
    }

    /* Tabs */
    .tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border: none;
      background: transparent;
      font-size: 0.875rem;
      font-weight: 500;
      color: #64748b;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
    }

    .tab-btn:hover {
      color: #3b82f6;
    }

    .tab-btn.active {
      color: #3b82f6;
      border-bottom-color: #3b82f6;
    }

    .tab-btn .badge {
      padding: 0.125rem 0.5rem;
      background: #3b82f6;
      color: white;
      border-radius: 1rem;
      font-size: 0.75rem;
    }

    /* Appointment Cards */
    .appointments-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .appointment-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      overflow: hidden;
    }

    .appointment-card.cancelled {
      opacity: 0.6;
    }

    .appointment-card.telehealth {
      border-left: 4px solid #8b5cf6;
    }

    .appt-header {
      display: flex;
      gap: 1rem;
      padding: 1.25rem;
    }

    .appt-date-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.75rem 1rem;
      background: #f1f5f9;
      border-radius: 0.5rem;
      min-width: 4rem;
    }

    .appt-date-badge.telehealth {
      background: #f3e8ff;
    }

    .appt-date-badge .day {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
      line-height: 1;
    }

    .appt-date-badge .month {
      font-size: 0.75rem;
      color: #64748b;
      text-transform: uppercase;
    }

    .appt-date-badge .year {
      font-size: 0.625rem;
      color: #94a3b8;
    }

    .appt-info {
      flex: 1;
    }

    .appt-info h3 {
      margin: 0 0 0.5rem;
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
    }

    .appt-info p {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0.25rem 0;
      font-size: 0.875rem;
      color: #64748b;
    }

    .appt-info svg {
      width: 1rem;
      height: 1rem;
      color: #94a3b8;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-badge.scheduled { background: #dbeafe; color: #1d4ed8; }
    .status-badge.confirmed { background: #dcfce7; color: #16a34a; }
    .status-badge.cancelled { background: #fee2e2; color: #dc2626; }
    .status-badge.pending { background: #fef3c7; color: #d97706; }

    .appt-instructions {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      background: #eff6ff;
      border-top: 1px solid #e2e8f0;
    }

    .appt-instructions svg {
      width: 1.25rem;
      height: 1.25rem;
      color: #3b82f6;
      flex-shrink: 0;
    }

    .appt-instructions p {
      margin: 0;
      font-size: 0.875rem;
      color: #1e40af;
    }

    .appt-forms {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: #fef3c7;
      border-top: 1px solid #e2e8f0;
    }

    .forms-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: #92400e;
    }

    .forms-label svg {
      width: 1rem;
      height: 1rem;
    }

    .form-link {
      font-size: 0.8125rem;
      color: #1d4ed8;
    }

    .appt-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-top: 1px solid #e2e8f0;
      background: #f8fafc;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
    }

    .empty-state svg {
      width: 4rem;
      height: 4rem;
      color: #94a3b8;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      margin: 0 0 0.5rem;
      font-size: 1.125rem;
      color: #1e293b;
    }

    .empty-state p {
      margin: 0 0 1.5rem;
      color: #64748b;
      font-size: 0.9375rem;
    }

    /* Request Cards */
    .request-card {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 1.25rem;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
    }

    .request-info h3 {
      margin: 0 0 0.25rem;
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
    }

    .request-info p {
      margin: 0.25rem 0;
      font-size: 0.875rem;
      color: #64748b;
    }

    .urgency-badge {
      padding: 0.125rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .urgency-badge.routine { background: #f1f5f9; color: #64748b; }
    .urgency-badge.urgent { background: #fef3c7; color: #d97706; }
    .urgency-badge.emergency { background: #fee2e2; color: #dc2626; }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal {
      background: white;
      border-radius: 0.75rem;
      width: 100%;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .booking-modal {
      max-width: 600px;
    }

    .cancel-modal {
      max-width: 500px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
    }

    .btn-close {
      width: 2rem;
      height: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      font-size: 1.5rem;
      color: #64748b;
      cursor: pointer;
      border-radius: 0.375rem;
    }

    .btn-close:hover {
      background: #f1f5f9;
    }

    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid #e2e8f0;
    }

    /* Booking Steps */
    .booking-step h3 {
      margin: 0 0 1.25rem;
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
    }

    .appointment-types {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    .type-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .type-card:hover {
      border-color: #3b82f6;
    }

    .type-card.selected {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .type-icon {
      width: 2.5rem;
      height: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f1f5f9;
      border-radius: 0.5rem;
    }

    .type-card.selected .type-icon {
      background: #dbeafe;
    }

    .type-icon svg {
      width: 1.25rem;
      height: 1.25rem;
      color: #3b82f6;
    }

    .type-info {
      display: flex;
      flex-direction: column;
      text-align: left;
    }

    .type-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: #1e293b;
    }

    .type-duration {
      font-size: 0.75rem;
      color: #64748b;
    }

    /* Provider Selection */
    .provider-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .provider-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .provider-card:hover {
      border-color: #3b82f6;
    }

    .provider-card.selected {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .provider-avatar {
      width: 2.5rem;
      height: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #dbeafe;
      color: #1d4ed8;
      border-radius: 50%;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .provider-info {
      display: flex;
      flex-direction: column;
      text-align: left;
    }

    .provider-name {
      font-size: 0.9375rem;
      font-weight: 500;
      color: #1e293b;
    }

    .provider-specialty {
      font-size: 0.8125rem;
      color: #64748b;
    }

    /* Date Picker */
    .date-picker {
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .date-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }

    .date-nav span {
      font-size: 0.9375rem;
      font-weight: 500;
      color: #1e293b;
    }

    .date-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 1px;
      background: #e2e8f0;
    }

    .date-column {
      background: white;
    }

    .date-header {
      width: 100%;
      padding: 0.75rem 0.5rem;
      border: none;
      background: white;
      cursor: pointer;
      transition: background 0.2s;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .date-header:hover:not(:disabled) {
      background: #f1f5f9;
    }

    .date-header:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .date-header.today {
      background: #eff6ff;
    }

    .date-column.selected .date-header {
      background: #3b82f6;
    }

    .date-column.selected .date-header .dow,
    .date-column.selected .date-header .dom {
      color: white;
    }

    .dow {
      font-size: 0.6875rem;
      color: #64748b;
      text-transform: uppercase;
    }

    .dom {
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
    }

    .time-slots {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 0.5rem;
      max-height: 200px;
      overflow-y: auto;
    }

    .time-slot {
      padding: 0.5rem;
      background: #f1f5f9;
      border: none;
      border-radius: 0.25rem;
      font-size: 0.8125rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .time-slot:hover {
      background: #e2e8f0;
    }

    .time-slot.selected {
      background: #3b82f6;
      color: white;
    }

    /* Confirmation */
    .confirmation-details {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .confirm-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .confirm-item label {
      font-size: 0.75rem;
      color: #64748b;
      text-transform: uppercase;
    }

    .confirm-item span {
      font-size: 0.9375rem;
      color: #1e293b;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      margin-top: 1rem;
    }

    .form-group label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }

    .form-group textarea {
      padding: 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-family: inherit;
      resize: vertical;
    }

    .form-group textarea:focus {
      outline: none;
      border-color: #3b82f6;
    }

    /* Cancel Modal */
    .cancel-details {
      padding: 1rem;
      background: #f8fafc;
      border-radius: 0.5rem;
      margin: 1rem 0;
    }

    .cancel-details p {
      margin: 0.25rem 0;
      font-size: 0.875rem;
      color: #475569;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 1rem;
      }

      .page-header .btn {
        width: 100%;
        justify-content: center;
      }

      .appt-header {
        flex-direction: column;
      }

      .appt-date-badge {
        flex-direction: row;
        gap: 0.5rem;
      }

      .appointment-types {
        grid-template-columns: 1fr;
      }

      .date-grid {
        grid-template-columns: repeat(5, 1fr);
      }
    }
  `]
})
export class PortalAppointmentsComponent {
  portalService = inject(PortalService);

  // Computed filtered counts (can't use arrow functions in templates)
  activeUpcomingCount = computed(() => 
    this.portalService.upcomingAppointments().filter(a => a.status !== 'cancelled').length
  );
  pendingRequestsCount = computed(() => 
    this.portalService.appointmentRequests().filter(r => r.status === 'pending').length
  );

  activeTab = signal<'upcoming' | 'past' | 'requests'>('upcoming');
  showBookingModal = signal(false);
  showCancelModal = signal(false);
  appointmentToCancel = signal<UpcomingAppointment | null>(null);
  cancelReason = '';

  // Booking state
  bookingStep = signal(1);
  selectedType = signal<string | null>(null);
  selectedProvider = signal<string | null>(null);
  selectedDate = signal<Date | null>(null);
  selectedSlot = signal<string | null>(null);
  visitReason = '';
  currentWeekStart = signal(new Date());

  appointmentTypes = [
    { id: 'office', name: 'Office Visit', duration: '30 min' },
    { id: 'telehealth', name: 'Telehealth', duration: '20 min' },
    { id: 'physical', name: 'Annual Physical', duration: '45 min' },
    { id: 'urgent', name: 'Urgent Care', duration: '30 min' }
  ];

  providers = [
    { id: 'PROV-001', name: 'Dr. Sarah Johnson', specialty: 'Internal Medicine' },
    { id: 'PROV-002', name: 'Dr. Michael Chen', specialty: 'Cardiology' },
    { id: 'PROV-003', name: 'Dr. Emily Davis', specialty: 'Family Medicine' }
  ];

  weekDays = computed(() => {
    const days = [];
    const start = new Date(this.currentWeekStart());
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      
      // Generate mock slots
      const slots: any[] = [];
      if (date.getDay() !== 0 && date.getDay() !== 6 && date >= new Date()) {
        const times = ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00'];
        times.forEach((time, idx) => {
          if (Math.random() > 0.3) {
            slots.push({
              id: `SLOT-${date.toISOString().split('T')[0]}-${idx}`,
              startTime: time
            });
          }
        });
      }
      
      days.push({ date, slots });
    }
    
    return days;
  });

  currentWeekLabel = computed(() => {
    const start = this.currentWeekStart();
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  });

  openBookingModal(): void {
    this.bookingStep.set(1);
    this.selectedType.set(null);
    this.selectedProvider.set(null);
    this.selectedDate.set(null);
    this.selectedSlot.set(null);
    this.visitReason = '';
    this.showBookingModal.set(true);
  }

  closeBookingModal(): void {
    this.showBookingModal.set(false);
  }

  selectType(typeId: string): void {
    this.selectedType.set(typeId);
  }

  selectProvider(providerId: string): void {
    this.selectedProvider.set(providerId);
  }

  selectDate(date: Date): void {
    this.selectedDate.set(date);
    this.selectedSlot.set(null);
  }

  selectSlot(slotId: string): void {
    this.selectedSlot.set(slotId);
  }

  previousWeek(): void {
    const newStart = new Date(this.currentWeekStart());
    newStart.setDate(newStart.getDate() - 7);
    if (newStart >= new Date()) {
      this.currentWeekStart.set(newStart);
    }
  }

  nextWeek(): void {
    const newStart = new Date(this.currentWeekStart());
    newStart.setDate(newStart.getDate() + 7);
    this.currentWeekStart.set(newStart);
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  canProceed(): boolean {
    switch (this.bookingStep()) {
      case 1: return !!this.selectedType();
      case 2: return !!this.selectedProvider();
      case 3: return !!this.selectedSlot();
      default: return true;
    }
  }

  nextStep(): void {
    if (this.bookingStep() < 4) {
      this.bookingStep.update(s => s + 1);
    }
  }

  previousStep(): void {
    if (this.bookingStep() > 1) {
      this.bookingStep.update(s => s - 1);
    }
  }

  getTypeName(typeId: string): string {
    return this.appointmentTypes.find(t => t.id === typeId)?.name || '';
  }

  getProviderName(providerId: string): string {
    return this.providers.find(p => p.id === providerId)?.name || '';
  }

  getSlotTime(slotId: string): string {
    for (const day of this.weekDays()) {
      const slot = day.slots.find((s: any) => s.id === slotId);
      if (slot) return slot.startTime;
    }
    return '';
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  }

  bookAppointment(): void {
    console.log('Booking appointment:', {
      type: this.selectedType(),
      provider: this.selectedProvider(),
      date: this.selectedDate(),
      slot: this.selectedSlot(),
      reason: this.visitReason
    });
    this.closeBookingModal();
  }

  confirmAppointment(appointmentId: string): void {
    this.portalService.confirmAppointment(appointmentId);
  }

  cancelAppointment(appt: UpcomingAppointment): void {
    this.appointmentToCancel.set(appt);
    this.cancelReason = '';
    this.showCancelModal.set(true);
  }

  closeCancelModal(): void {
    this.showCancelModal.set(false);
    this.appointmentToCancel.set(null);
  }

  confirmCancel(): void {
    if (this.appointmentToCancel()) {
      this.portalService.cancelAppointment(this.appointmentToCancel()!.id);
      this.closeCancelModal();
    }
  }

  openRescheduleModal(appt: UpcomingAppointment): void {
    console.log('Reschedule:', appt);
  }

  addToCalendar(appt: UpcomingAppointment): void {
    console.log('Add to calendar:', appt);
  }
}
