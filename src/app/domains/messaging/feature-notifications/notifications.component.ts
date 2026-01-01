import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessagingService } from '../data-access/services/messaging.service';
import { Notification, NotificationType, NotificationPriority } from '../data-access/models/messaging.model';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="notifications-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="title-section">
            <a routerLink="/messaging" class="back-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </a>
            <div>
              <h1>Notifications</h1>
              <p class="subtitle">Stay updated on important alerts and updates</p>
            </div>
          </div>
          <div class="header-actions">
            @if (unreadNotifications().length > 0) {
              <button class="btn btn-secondary" (click)="markAllAsRead()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 11 12 14 22 4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
                Mark All Read
              </button>
            }
            <button class="btn btn-secondary" (click)="openSettings()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              Settings
            </button>
          </div>
        </div>
      </header>

      <!-- Stats Summary -->
      <div class="stats-summary">
        <div class="stat-item">
          <span class="stat-value unread">{{ unreadNotifications().length }}</span>
          <span class="stat-label">Unread</span>
        </div>
        <div class="stat-item">
          <span class="stat-value critical">{{ criticalNotifications().length }}</span>
          <span class="stat-label">Critical</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ todayNotifications().length }}</span>
          <span class="stat-label">Today</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ filteredNotifications().length }}</span>
          <span class="stat-label">Total</span>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="filter-tabs">
          <button 
            class="filter-tab"
            [class.active]="activeFilter() === 'all'"
            (click)="activeFilter.set('all')"
          >
            All
          </button>
          <button 
            class="filter-tab"
            [class.active]="activeFilter() === 'unread'"
            (click)="activeFilter.set('unread')"
          >
            Unread
            @if (unreadNotifications().length > 0) {
              <span class="badge">{{ unreadNotifications().length }}</span>
            }
          </button>
          <button 
            class="filter-tab"
            [class.active]="activeFilter() === 'critical'"
            (click)="activeFilter.set('critical')"
          >
            Critical
          </button>
        </div>
        <div class="filter-group">
          <select [ngModel]="typeFilter()" (ngModelChange)="typeFilter.set($event)">
            <option value="all">All Types</option>
            <option value="message">Messages</option>
            <option value="task">Tasks</option>
            <option value="appointment">Appointments</option>
            <option value="lab-result">Lab Results</option>
            <option value="prescription">Prescriptions</option>
            <option value="alert">Alerts</option>
            <option value="system">System</option>
            <option value="reminder">Reminders</option>
          </select>
        </div>
      </div>

      <!-- Notifications List -->
      <div class="notifications-list">
        @for (group of groupedNotifications(); track group.label) {
          <div class="notification-group">
            <h3 class="group-label">{{ group.label }}</h3>
            @for (notification of group.notifications; track notification.id) {
              <div 
                class="notification-card"
                [class.unread]="!notification.isRead"
                [class.critical]="notification.priority === 'critical'"
                [class.high]="notification.priority === 'high'"
              >
                <div class="notification-icon" [class]="notification.type">
                  @switch (notification.type) {
                    @case ('message') {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                    }
                    @case ('task') {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 11l3 3L22 4"/>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                      </svg>
                    }
                    @case ('appointment') {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                    }
                    @case ('lab-result') {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                    }
                    @case ('prescription') {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/>
                        <path d="M12 8v8M8 12h8"/>
                      </svg>
                    }
                    @case ('alert') {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                    }
                    @case ('system') {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                      </svg>
                    }
                    @case ('reminder') {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                      </svg>
                    }
                    @default {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                      </svg>
                    }
                  }
                </div>
                <div class="notification-content">
                  <div class="notification-header">
                    <h4 class="notification-title">{{ notification.title }}</h4>
                    <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
                  </div>
                  <p class="notification-message">{{ notification.message }}</p>
                  @if (notification.actionUrl) {
                    <a [routerLink]="notification.actionUrl" class="notification-action">
                      {{ notification.actionLabel || 'View Details' }}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </a>
                  }
                </div>
                <div class="notification-actions">
                  @if (!notification.isRead) {
                    <button class="btn-icon" (click)="markAsRead(notification)" title="Mark as read">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </button>
                  }
                  <button class="btn-icon" (click)="dismissNotification(notification)" title="Dismiss">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>
            }
          </div>
        } @empty {
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <h3>No notifications</h3>
            <p>You're all caught up!</p>
          </div>
        }
      </div>

      <!-- Settings Modal -->
      @if (showSettingsModal()) {
        <div class="modal-overlay" (click)="closeSettings()">
          <div class="modal settings-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Notification Settings</h2>
              <button class="btn-close" (click)="closeSettings()">×</button>
            </div>
            <div class="modal-body">
              <!-- Email Notifications -->
              <div class="settings-section">
                <div class="section-header">
                  <div class="section-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <span>Email Notifications</span>
                  </div>
                  <label class="toggle">
                    <input type="checkbox" [(ngModel)]="emailEnabled" />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
                @if (emailEnabled) {
                  <div class="section-content">
                    <div class="setting-item">
                      <label>Frequency</label>
                      <select [(ngModel)]="emailFrequency">
                        <option value="immediate">Immediate</option>
                        <option value="hourly">Hourly Digest</option>
                        <option value="daily">Daily Digest</option>
                        <option value="weekly">Weekly Digest</option>
                      </select>
                    </div>
                    <div class="setting-item">
                      <label>Notification Types</label>
                      <div class="checkbox-group">
                        @for (type of notificationTypes; track type.value) {
                          <label class="checkbox-item">
                            <input type="checkbox" [checked]="emailTypes.includes(type.value)" (change)="toggleEmailType(type.value)" />
                            <span>{{ type.label }}</span>
                          </label>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>

              <!-- In-App Notifications -->
              <div class="settings-section">
                <div class="section-header">
                  <div class="section-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                    <span>In-App Notifications</span>
                  </div>
                  <label class="toggle">
                    <input type="checkbox" [(ngModel)]="inAppEnabled" />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
                @if (inAppEnabled) {
                  <div class="section-content">
                    <div class="setting-item">
                      <label class="checkbox-item">
                        <input type="checkbox" [(ngModel)]="soundEnabled" />
                        <span>Play sound for new notifications</span>
                      </label>
                    </div>
                    <div class="setting-item">
                      <label class="checkbox-item">
                        <input type="checkbox" [(ngModel)]="desktopEnabled" />
                        <span>Desktop notifications</span>
                      </label>
                    </div>
                  </div>
                }
              </div>

              <!-- Quiet Hours -->
              <div class="settings-section">
                <div class="section-header">
                  <div class="section-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    </svg>
                    <span>Quiet Hours</span>
                  </div>
                  <label class="toggle">
                    <input type="checkbox" [(ngModel)]="quietHoursEnabled" />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
                @if (quietHoursEnabled) {
                  <div class="section-content">
                    <div class="setting-item time-range">
                      <div class="time-input">
                        <label>Start</label>
                        <input type="time" [(ngModel)]="quietHoursStart" />
                      </div>
                      <span class="time-separator">to</span>
                      <div class="time-input">
                        <label>End</label>
                        <input type="time" [(ngModel)]="quietHoursEnd" />
                      </div>
                    </div>
                    <div class="setting-item">
                      <label class="checkbox-item">
                        <input type="checkbox" [(ngModel)]="allowCritical" />
                        <span>Allow critical notifications during quiet hours</span>
                      </label>
                    </div>
                  </div>
                }
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeSettings()">Cancel</button>
              <button class="btn btn-primary" (click)="saveSettings()">Save Settings</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .notifications-container {
      padding: 1.5rem;
      max-width: 900px;
      margin: 0 auto;
    }

    /* Header */
    .page-header {
      margin-bottom: 1.5rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
    }

    .title-section {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }

    .back-link {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 0.5rem;
      color: #64748b;
      transition: all 0.2s;
    }

    .back-link:hover {
      background: #f1f5f9;
      color: #3b82f6;
    }

    .back-link svg {
      width: 1.25rem;
      height: 1.25rem;
    }

    .title-section h1 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 600;
      color: #1e293b;
    }

    .subtitle {
      margin: 0.25rem 0 0;
      color: #64748b;
      font-size: 0.875rem;
    }

    .header-actions {
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
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .btn-secondary {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #e2e8f0;
    }

    .btn-secondary:hover {
      background: #e2e8f0;
    }

    .btn svg {
      width: 1rem;
      height: 1rem;
    }

    .btn-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      padding: 0;
      border: none;
      background: transparent;
      color: #64748b;
      border-radius: 0.375rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-icon:hover {
      background: #f1f5f9;
      color: #3b82f6;
    }

    .btn-icon svg {
      width: 1rem;
      height: 1rem;
    }

    /* Stats Summary */
    .stats-summary {
      display: flex;
      gap: 2rem;
      padding: 1rem 1.5rem;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
    }

    .stat-value.unread { color: #3b82f6; }
    .stat-value.critical { color: #dc2626; }

    .stat-label {
      font-size: 0.75rem;
      color: #64748b;
    }

    /* Filters */
    .filters-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .filter-tabs {
      display: flex;
      gap: 0.5rem;
    }

    .filter-tab {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: none;
      background: transparent;
      color: #64748b;
      font-size: 0.875rem;
      font-weight: 500;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .filter-tab:hover {
      background: #f1f5f9;
    }

    .filter-tab.active {
      background: #3b82f6;
      color: white;
    }

    .filter-tab .badge {
      background: rgba(255, 255, 255, 0.2);
      padding: 0.125rem 0.375rem;
      border-radius: 9999px;
      font-size: 0.75rem;
    }

    .filter-tab.active .badge {
      background: rgba(255, 255, 255, 0.3);
    }

    .filter-group select {
      padding: 0.5rem 2rem 0.5rem 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      background: white;
      cursor: pointer;
    }

    /* Notifications List */
    .notifications-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .notification-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .group-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding-left: 0.5rem;
      margin: 0;
    }

    .notification-card {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      transition: all 0.2s;
    }

    .notification-card:hover {
      border-color: #3b82f6;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
    }

    .notification-card.unread {
      background: #eff6ff;
      border-color: #bfdbfe;
    }

    .notification-card.critical {
      border-left: 3px solid #dc2626;
    }

    .notification-card.high {
      border-left: 3px solid #d97706;
    }

    .notification-icon {
      width: 2.5rem;
      height: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.5rem;
      flex-shrink: 0;
    }

    .notification-icon svg {
      width: 1.25rem;
      height: 1.25rem;
    }

    .notification-icon.message { background: #dbeafe; color: #3b82f6; }
    .notification-icon.task { background: #f3e8ff; color: #8b5cf6; }
    .notification-icon.appointment { background: #dcfce7; color: #16a34a; }
    .notification-icon.lab-result { background: #fef3c7; color: #d97706; }
    .notification-icon.prescription { background: #fce7f3; color: #db2777; }
    .notification-icon.alert { background: #fee2e2; color: #dc2626; }
    .notification-icon.system { background: #f1f5f9; color: #64748b; }
    .notification-icon.reminder { background: #cffafe; color: #0891b2; }
    .notification-icon.billing { background: #dcfce7; color: #16a34a; }
    .notification-icon.document { background: #e0e7ff; color: #4f46e5; }

    .notification-content {
      flex: 1;
      min-width: 0;
    }

    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 0.25rem;
    }

    .notification-title {
      margin: 0;
      font-size: 0.9375rem;
      font-weight: 600;
      color: #1e293b;
    }

    .notification-time {
      font-size: 0.75rem;
      color: #64748b;
      white-space: nowrap;
    }

    .notification-message {
      margin: 0 0 0.5rem;
      font-size: 0.875rem;
      color: #475569;
      line-height: 1.4;
    }

    .notification-action {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.8125rem;
      color: #3b82f6;
      text-decoration: none;
      font-weight: 500;
    }

    .notification-action:hover {
      text-decoration: underline;
    }

    .notification-action svg {
      width: 0.875rem;
      height: 0.875rem;
    }

    .notification-actions {
      display: flex;
      gap: 0.25rem;
      flex-shrink: 0;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
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
      font-weight: 600;
      color: #1e293b;
    }

    .empty-state p {
      margin: 0;
      font-size: 0.875rem;
      color: #64748b;
    }

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

    .settings-modal {
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

    /* Settings Sections */
    .settings-section {
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .settings-section:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 600;
      color: #1e293b;
    }

    .section-title svg {
      width: 1.25rem;
      height: 1.25rem;
      color: #64748b;
    }

    .toggle {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
    }

    .toggle input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #e2e8f0;
      transition: 0.3s;
      border-radius: 24px;
    }

    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
    }

    .toggle input:checked + .toggle-slider {
      background-color: #3b82f6;
    }

    .toggle input:checked + .toggle-slider:before {
      transform: translateX(20px);
    }

    .section-content {
      padding-left: 2rem;
    }

    .setting-item {
      margin-bottom: 1rem;
    }

    .setting-item:last-child {
      margin-bottom: 0;
    }

    .setting-item > label:not(.checkbox-item) {
      display: block;
      margin-bottom: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }

    .setting-item select {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.875rem;
    }

    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .checkbox-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #475569;
      cursor: pointer;
    }

    .checkbox-item input[type="checkbox"] {
      width: 1rem;
      height: 1rem;
      accent-color: #3b82f6;
    }

    .time-range {
      display: flex;
      align-items: flex-end;
      gap: 1rem;
    }

    .time-input {
      flex: 1;
    }

    .time-input label {
      display: block;
      margin-bottom: 0.375rem;
      font-size: 0.75rem;
      color: #64748b;
    }

    .time-input input {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.875rem;
    }

    .time-separator {
      padding-bottom: 0.5rem;
      color: #64748b;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        align-items: stretch;
      }

      .header-actions {
        justify-content: flex-end;
      }

      .stats-summary {
        flex-wrap: wrap;
        gap: 1rem;
      }

      .stat-item {
        min-width: calc(50% - 0.5rem);
      }

      .filters-bar {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .filter-tabs {
        overflow-x: auto;
      }
    }
  `]
})
export class NotificationsComponent {
  private messagingService = inject(MessagingService);

  // Filters
  activeFilter = signal<'all' | 'unread' | 'critical'>('all');
  typeFilter = signal<'all' | NotificationType>('all');

  // Settings modal
  showSettingsModal = signal(false);

  // Settings state
  emailEnabled = true;
  emailFrequency = 'immediate';
  emailTypes: NotificationType[] = ['message', 'task', 'lab-result', 'prescription', 'alert'];
  
  inAppEnabled = true;
  soundEnabled = true;
  desktopEnabled = false;
  
  quietHoursEnabled = false;
  quietHoursStart = '22:00';
  quietHoursEnd = '07:00';
  allowCritical = true;

  notificationTypes = [
    { value: 'message' as NotificationType, label: 'Messages' },
    { value: 'task' as NotificationType, label: 'Tasks' },
    { value: 'appointment' as NotificationType, label: 'Appointments' },
    { value: 'lab-result' as NotificationType, label: 'Lab Results' },
    { value: 'prescription' as NotificationType, label: 'Prescriptions' },
    { value: 'alert' as NotificationType, label: 'Alerts' },
    { value: 'system' as NotificationType, label: 'System' },
    { value: 'reminder' as NotificationType, label: 'Reminders' }
  ];

  // Computed values
  allNotifications = computed(() => 
    this.messagingService.notifications().filter(n => !n.isDismissed)
  );

  unreadNotifications = computed(() => 
    this.allNotifications().filter(n => !n.isRead)
  );

  criticalNotifications = computed(() => 
    this.allNotifications().filter(n => n.priority === 'critical' || n.priority === 'high')
  );

  todayNotifications = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.allNotifications().filter(n => n.createdAt >= today);
  });

  filteredNotifications = computed(() => {
    let notifications = this.allNotifications();
    
    // Apply main filter
    if (this.activeFilter() === 'unread') {
      notifications = notifications.filter(n => !n.isRead);
    } else if (this.activeFilter() === 'critical') {
      notifications = notifications.filter(n => n.priority === 'critical' || n.priority === 'high');
    }
    
    // Apply type filter
    if (this.typeFilter() !== 'all') {
      notifications = notifications.filter(n => n.type === this.typeFilter());
    }
    
    return notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  });

  groupedNotifications = computed(() => {
    const notifications = this.filteredNotifications();
    const groups: { label: string; notifications: Notification[] }[] = [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);
    
    const todayNotifs = notifications.filter(n => n.createdAt >= today);
    const yesterdayNotifs = notifications.filter(n => n.createdAt >= yesterday && n.createdAt < today);
    const thisWeekNotifs = notifications.filter(n => n.createdAt >= thisWeek && n.createdAt < yesterday);
    const olderNotifs = notifications.filter(n => n.createdAt < thisWeek);
    
    if (todayNotifs.length > 0) {
      groups.push({ label: 'Today', notifications: todayNotifs });
    }
    if (yesterdayNotifs.length > 0) {
      groups.push({ label: 'Yesterday', notifications: yesterdayNotifs });
    }
    if (thisWeekNotifs.length > 0) {
      groups.push({ label: 'This Week', notifications: thisWeekNotifs });
    }
    if (olderNotifs.length > 0) {
      groups.push({ label: 'Older', notifications: olderNotifs });
    }
    
    return groups;
  });

  formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) {
      return 'Just now';
    } else if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }

  markAsRead(notification: Notification): void {
    this.messagingService.markNotificationAsRead(notification.id);
  }

  dismissNotification(notification: Notification): void {
    this.messagingService.dismissNotification(notification.id);
  }

  markAllAsRead(): void {
    this.messagingService.markAllNotificationsAsRead();
  }

  openSettings(): void {
    this.showSettingsModal.set(true);
  }

  closeSettings(): void {
    this.showSettingsModal.set(false);
  }

  toggleEmailType(type: NotificationType): void {
    const index = this.emailTypes.indexOf(type);
    if (index > -1) {
      this.emailTypes = this.emailTypes.filter(t => t !== type);
    } else {
      this.emailTypes = [...this.emailTypes, type];
    }
  }

  saveSettings(): void {
    console.log('Saving notification settings:', {
      email: {
        enabled: this.emailEnabled,
        frequency: this.emailFrequency,
        types: this.emailTypes
      },
      inApp: {
        enabled: this.inAppEnabled,
        sound: this.soundEnabled,
        desktop: this.desktopEnabled
      },
      quietHours: {
        enabled: this.quietHoursEnabled,
        start: this.quietHoursStart,
        end: this.quietHoursEnd,
        allowCritical: this.allowCritical
      }
    });
    this.closeSettings();
  }
}
