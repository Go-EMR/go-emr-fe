import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PortalService } from '../data-access/services/portal.service';

@Component({
  selector: 'app-portal-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="portal-dashboard">
      <!-- Welcome Header -->
      <header class="welcome-header">
        <div class="welcome-content">
          <h1>Welcome back, John</h1>
          <p>Here's an overview of your health information</p>
        </div>
        <div class="quick-actions">
          <a routerLink="/portal/appointments/book" class="btn btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
              <line x1="12" y1="14" x2="12" y2="18"/>
              <line x1="10" y1="16" x2="14" y2="16"/>
            </svg>
            Book Appointment
          </a>
          <a routerLink="/portal/messages/new" class="btn btn-secondary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Send Message
          </a>
        </div>
      </header>

      <!-- Alert Banners -->
      @if (summary().pendingForms > 0) {
        <div class="alert-banner forms">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <div class="alert-content">
            <strong>{{ summary().pendingForms }} form(s) require your attention</strong>
            <span>Please complete before your upcoming appointment</span>
          </div>
          <a routerLink="/portal/forms" class="alert-action">Complete Forms</a>
        </div>
      }

      @if (summary().outstandingBalance > 0) {
        <div class="alert-banner billing">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          <div class="alert-content">
            <strong>Outstanding balance: {{ summary().outstandingBalance | currency }}</strong>
            <span>View your statement and make a payment</span>
          </div>
          <a routerLink="/portal/billing" class="alert-action">Pay Now</a>
        </div>
      }

      <!-- Main Grid -->
      <div class="dashboard-grid">
        <!-- Upcoming Appointments -->
        <section class="dashboard-card appointments-card">
          <div class="card-header">
            <h2>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Upcoming Appointments
            </h2>
            <a routerLink="/portal/appointments" class="view-all">View All</a>
          </div>
          <div class="card-content">
            @for (appt of upcomingAppointments(); track appt.id) {
              <div class="appointment-item" [class.telehealth]="appt.telehealth">
                <div class="appt-date">
                  <span class="day">{{ appt.date | date:'d' }}</span>
                  <span class="month">{{ appt.date | date:'MMM' }}</span>
                </div>
                <div class="appt-details">
                  <h4>{{ appt.appointmentType }}</h4>
                  <p class="provider">{{ appt.providerName }}</p>
                  <p class="time-location">
                    {{ appt.startTime }} - {{ appt.endTime }}
                    @if (appt.telehealth) {
                      <span class="telehealth-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polygon points="23 7 16 12 23 17 23 7"/>
                          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                        </svg>
                        Telehealth
                      </span>
                    } @else {
                      • {{ appt.locationName }}
                    }
                  </p>
                </div>
                <div class="appt-actions">
                  @if (appt.confirmationRequired) {
                    <button class="btn btn-sm btn-primary" (click)="confirmAppointment(appt.id)">
                      Confirm
                    </button>
                  }
                  @if (appt.telehealth && appt.telehealthUrl) {
                    <a [href]="appt.telehealthUrl" target="_blank" class="btn btn-sm btn-primary">
                      Join
                    </a>
                  }
                </div>
              </div>
            } @empty {
              <div class="empty-state">
                <p>No upcoming appointments</p>
                <a routerLink="/portal/appointments/book" class="btn btn-sm btn-secondary">
                  Schedule Now
                </a>
              </div>
            }
          </div>
        </section>

        <!-- Messages -->
        <section class="dashboard-card messages-card">
          <div class="card-header">
            <h2>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Messages
              @if (summary().unreadMessages > 0) {
                <span class="badge">{{ summary().unreadMessages }}</span>
              }
            </h2>
            <a routerLink="/portal/messages" class="view-all">View All</a>
          </div>
          <div class="card-content">
            @for (thread of recentMessages(); track thread.id) {
              <a [routerLink]="['/portal/messages', thread.id]" class="message-item" [class.unread]="thread.unreadCount > 0">
                <div class="message-avatar">
                  {{ getInitials(thread.participants[1]?.name || 'Unknown') }}
                </div>
                <div class="message-content">
                  <div class="message-header">
                    <span class="sender">{{ thread.participants[1]?.name }}</span>
                    <span class="time">{{ formatTimeAgo(thread.lastMessageAt) }}</span>
                  </div>
                  <p class="subject">{{ thread.subject }}</p>
                  <p class="preview">{{ thread.lastMessagePreview }}</p>
                </div>
                @if (thread.unreadCount > 0) {
                  <span class="unread-indicator"></span>
                }
              </a>
            } @empty {
              <div class="empty-state">
                <p>No messages</p>
              </div>
            }
          </div>
        </section>

        <!-- Health Summary -->
        <section class="dashboard-card health-card">
          <div class="card-header">
            <h2>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
              Health Summary
            </h2>
            <a routerLink="/portal/health" class="view-all">View All</a>
          </div>
          <div class="card-content">
            <div class="health-stats">
              <a routerLink="/portal/health/medications" class="health-stat">
                <div class="stat-icon medications">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10.5 20.5L3.5 13.5C2.1 12.1 2.1 9.9 3.5 8.5C4.9 7.1 7.1 7.1 8.5 8.5L15.5 15.5"/>
                    <path d="M13.5 3.5L20.5 10.5C21.9 11.9 21.9 14.1 20.5 15.5C19.1 16.9 16.9 16.9 15.5 15.5L8.5 8.5"/>
                  </svg>
                </div>
                <div class="stat-content">
                  <span class="stat-value">{{ summary().activeMedications }}</span>
                  <span class="stat-label">Active Medications</span>
                </div>
              </a>
              <a routerLink="/portal/health/labs" class="health-stat">
                <div class="stat-icon labs">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 3h6v2H9z"/>
                    <path d="M8 5v4l-3 9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2l-3-9V5"/>
                  </svg>
                </div>
                <div class="stat-content">
                  <span class="stat-value">{{ summary().recentLabResults }}</span>
                  <span class="stat-label">New Lab Results</span>
                </div>
              </a>
              <a routerLink="/portal/health/allergies" class="health-stat">
                <div class="stat-icon allergies">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <div class="stat-content">
                  <span class="stat-value">{{ summary().allergies.length }}</span>
                  <span class="stat-label">Known Allergies</span>
                </div>
              </a>
            </div>

            @if (summary().allergies.length > 0) {
              <div class="allergies-list">
                <h4>Allergies</h4>
                <div class="allergy-tags">
                  @for (allergy of summary().allergies; track allergy) {
                    <span class="allergy-tag">{{ allergy }}</span>
                  }
                </div>
              </div>
            }
          </div>
        </section>

        <!-- Recent Visits -->
        <section class="dashboard-card visits-card">
          <div class="card-header">
            <h2>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
              </svg>
              Recent Visits
            </h2>
            <a routerLink="/portal/health/visits" class="view-all">View All</a>
          </div>
          <div class="card-content">
            @for (encounter of recentEncounters(); track encounter.id) {
              <a [routerLink]="['/portal/health/visits', encounter.id]" class="visit-item">
                <div class="visit-date">
                  {{ encounter.date | date:'MMM d, yyyy' }}
                </div>
                <div class="visit-details">
                  <h4>{{ encounter.visitType }}</h4>
                  <p>{{ encounter.providerName }} • {{ encounter.providerSpecialty }}</p>
                </div>
                <div class="visit-badges">
                  @if (encounter.hasLabResults) {
                    <span class="badge lab">Labs</span>
                  }
                  @if (encounter.hasDocuments) {
                    <span class="badge doc">Docs</span>
                  }
                </div>
              </a>
            } @empty {
              <div class="empty-state">
                <p>No recent visits</p>
              </div>
            }
          </div>
        </section>

        <!-- Quick Links -->
        <section class="dashboard-card quick-links-card">
          <div class="card-header">
            <h2>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
              Quick Links
            </h2>
          </div>
          <div class="card-content">
            <div class="quick-links-grid">
              <a routerLink="/portal/health/medications" class="quick-link">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10.5 20.5L3.5 13.5C2.1 12.1 2.1 9.9 3.5 8.5C4.9 7.1 7.1 7.1 8.5 8.5L15.5 15.5"/>
                  <path d="M13.5 3.5L20.5 10.5C21.9 11.9 21.9 14.1 20.5 15.5C19.1 16.9 16.9 16.9 15.5 15.5L8.5 8.5"/>
                </svg>
                <span>Medications</span>
              </a>
              <a routerLink="/portal/health/labs" class="quick-link">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 3h6v2H9z"/>
                  <path d="M8 5v4l-3 9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2l-3-9V5"/>
                </svg>
                <span>Lab Results</span>
              </a>
              <a routerLink="/portal/health/immunizations" class="quick-link">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
                  <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
                  <line x1="6" y1="1" x2="6" y2="4"/>
                  <line x1="10" y1="1" x2="10" y2="4"/>
                  <line x1="14" y1="1" x2="14" y2="4"/>
                </svg>
                <span>Immunizations</span>
              </a>
              <a routerLink="/portal/health/documents" class="quick-link">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <span>Documents</span>
              </a>
              <a routerLink="/portal/billing" class="quick-link">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
                <span>Billing</span>
              </a>
              <a routerLink="/portal/settings" class="quick-link">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                <span>Settings</span>
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .portal-dashboard {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Welcome Header */
    .welcome-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .welcome-content h1 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 600;
      color: #1e293b;
    }

    .welcome-content p {
      margin: 0.25rem 0 0;
      color: #64748b;
      font-size: 0.9375rem;
    }

    .quick-actions {
      display: flex;
      gap: 0.75rem;
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

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .btn-secondary {
      background: white;
      color: #475569;
      border: 1px solid #e2e8f0;
    }

    .btn-secondary:hover {
      background: #f1f5f9;
    }

    .btn svg {
      width: 1rem;
      height: 1rem;
    }

    /* Alert Banners */
    .alert-banner {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      border-radius: 0.75rem;
      margin-bottom: 1rem;
    }

    .alert-banner.forms {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
    }

    .alert-banner.billing {
      background: #fef3c7;
      border: 1px solid #fde68a;
    }

    .alert-banner svg {
      width: 1.5rem;
      height: 1.5rem;
      flex-shrink: 0;
    }

    .alert-banner.forms svg { color: #3b82f6; }
    .alert-banner.billing svg { color: #d97706; }

    .alert-content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .alert-content strong {
      font-size: 0.9375rem;
      color: #1e293b;
    }

    .alert-content span {
      font-size: 0.8125rem;
      color: #64748b;
    }

    .alert-action {
      padding: 0.5rem 1rem;
      background: white;
      border-radius: 0.5rem;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #1e293b;
      text-decoration: none;
      white-space: nowrap;
    }

    .alert-action:hover {
      background: #f1f5f9;
    }

    /* Dashboard Grid */
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }

    /* Cards */
    .dashboard-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      overflow: hidden;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .card-header h2 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
    }

    .card-header h2 svg {
      width: 1.25rem;
      height: 1.25rem;
      color: #64748b;
    }

    .card-header h2 .badge {
      padding: 0.125rem 0.5rem;
      background: #ef4444;
      color: white;
      border-radius: 1rem;
      font-size: 0.75rem;
    }

    .view-all {
      font-size: 0.8125rem;
      color: #3b82f6;
      text-decoration: none;
    }

    .view-all:hover {
      text-decoration: underline;
    }

    .card-content {
      padding: 0.5rem;
    }

    /* Appointments Card */
    .appointments-card {
      grid-column: span 2;
    }

    .appointment-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem;
      border-radius: 0.5rem;
      transition: background 0.2s;
    }

    .appointment-item:hover {
      background: #f8fafc;
    }

    .appointment-item.telehealth {
      border-left: 3px solid #8b5cf6;
    }

    .appt-date {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.5rem 0.75rem;
      background: #f1f5f9;
      border-radius: 0.5rem;
      min-width: 3.5rem;
    }

    .appt-date .day {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
      line-height: 1;
    }

    .appt-date .month {
      font-size: 0.75rem;
      color: #64748b;
      text-transform: uppercase;
    }

    .appt-details {
      flex: 1;
    }

    .appt-details h4 {
      margin: 0 0 0.125rem;
      font-size: 0.9375rem;
      font-weight: 500;
      color: #1e293b;
    }

    .appt-details .provider {
      margin: 0;
      font-size: 0.8125rem;
      color: #475569;
    }

    .appt-details .time-location {
      margin: 0.25rem 0 0;
      font-size: 0.75rem;
      color: #64748b;
    }

    .telehealth-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.125rem 0.375rem;
      background: #f3e8ff;
      color: #7c3aed;
      border-radius: 0.25rem;
      font-size: 0.6875rem;
      margin-left: 0.5rem;
    }

    .telehealth-badge svg {
      width: 0.75rem;
      height: 0.75rem;
    }

    .appt-actions {
      display: flex;
      gap: 0.5rem;
    }

    /* Messages Card */
    .message-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.75rem;
      border-radius: 0.5rem;
      text-decoration: none;
      transition: background 0.2s;
      position: relative;
    }

    .message-item:hover {
      background: #f8fafc;
    }

    .message-item.unread {
      background: #eff6ff;
    }

    .message-avatar {
      width: 2.5rem;
      height: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e0e7ff;
      color: #4f46e5;
      border-radius: 50%;
      font-size: 0.75rem;
      font-weight: 600;
      flex-shrink: 0;
    }

    .message-content {
      flex: 1;
      min-width: 0;
    }

    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.125rem;
    }

    .message-header .sender {
      font-size: 0.875rem;
      font-weight: 500;
      color: #1e293b;
    }

    .message-header .time {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .message-content .subject {
      margin: 0;
      font-size: 0.8125rem;
      color: #475569;
    }

    .message-content .preview {
      margin: 0.125rem 0 0;
      font-size: 0.75rem;
      color: #94a3b8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .unread-indicator {
      width: 0.5rem;
      height: 0.5rem;
      background: #3b82f6;
      border-radius: 50%;
      flex-shrink: 0;
    }

    /* Health Card */
    .health-stats {
      display: flex;
      gap: 0.5rem;
      padding: 0.5rem;
    }

    .health-stat {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: 0.5rem;
      text-decoration: none;
      transition: background 0.2s;
    }

    .health-stat:hover {
      background: #f1f5f9;
    }

    .stat-icon {
      width: 2.5rem;
      height: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.5rem;
    }

    .stat-icon svg {
      width: 1.25rem;
      height: 1.25rem;
    }

    .stat-icon.medications { background: #dbeafe; color: #3b82f6; }
    .stat-icon.labs { background: #dcfce7; color: #16a34a; }
    .stat-icon.allergies { background: #fee2e2; color: #dc2626; }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
    }

    .stat-label {
      font-size: 0.6875rem;
      color: #64748b;
    }

    .allergies-list {
      padding: 0.75rem 1rem;
      border-top: 1px solid #e2e8f0;
      margin-top: 0.5rem;
    }

    .allergies-list h4 {
      margin: 0 0 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
    }

    .allergy-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
    }

    .allergy-tag {
      padding: 0.25rem 0.5rem;
      background: #fee2e2;
      color: #dc2626;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    /* Visits Card */
    .visit-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem;
      border-radius: 0.5rem;
      text-decoration: none;
      transition: background 0.2s;
    }

    .visit-item:hover {
      background: #f8fafc;
    }

    .visit-date {
      font-size: 0.75rem;
      color: #64748b;
      white-space: nowrap;
      min-width: 80px;
    }

    .visit-details {
      flex: 1;
    }

    .visit-details h4 {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 500;
      color: #1e293b;
    }

    .visit-details p {
      margin: 0;
      font-size: 0.75rem;
      color: #64748b;
    }

    .visit-badges {
      display: flex;
      gap: 0.25rem;
    }

    .visit-badges .badge {
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      font-size: 0.625rem;
      font-weight: 500;
    }

    .visit-badges .badge.lab { background: #dcfce7; color: #16a34a; }
    .visit-badges .badge.doc { background: #dbeafe; color: #3b82f6; }

    /* Quick Links Card */
    .quick-links-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
      padding: 0.5rem;
    }

    .quick-link {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 0.5rem;
      text-decoration: none;
      transition: all 0.2s;
    }

    .quick-link:hover {
      background: #f1f5f9;
      transform: translateY(-2px);
    }

    .quick-link svg {
      width: 1.5rem;
      height: 1.5rem;
      color: #3b82f6;
    }

    .quick-link span {
      font-size: 0.75rem;
      font-weight: 500;
      color: #475569;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      color: #64748b;
      font-size: 0.875rem;
    }

    .empty-state p {
      margin: 0 0 0.75rem;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .dashboard-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .appointments-card {
        grid-column: span 2;
      }
    }

    @media (max-width: 768px) {
      .welcome-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .quick-actions {
        width: 100%;
      }

      .quick-actions .btn {
        flex: 1;
        justify-content: center;
      }

      .alert-banner {
        flex-wrap: wrap;
      }

      .alert-content {
        flex-basis: calc(100% - 3rem);
      }

      .alert-action {
        width: 100%;
        text-align: center;
      }

      .dashboard-grid {
        grid-template-columns: 1fr;
      }

      .appointments-card {
        grid-column: span 1;
      }

      .health-stats {
        flex-direction: column;
      }

      .quick-links-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class PortalDashboardComponent {
  private portalService = inject(PortalService);

  summary = this.portalService.healthSummary;
  upcomingAppointments = this.portalService.upcomingAppointments;
  recentMessages = computed(() => this.portalService.messageThreads().slice(0, 3));
  recentEncounters = computed(() => this.portalService.encounters().slice(0, 3));

  confirmAppointment(appointmentId: string): void {
    this.portalService.confirmAppointment(appointmentId);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  }

  formatTimeAgo(date: Date): string {
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  }
}
