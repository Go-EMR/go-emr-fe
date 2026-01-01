import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PortalService } from '../data-access/services/portal.service';
import { PortalPreferences } from '../data-access/models/portal.model';

@Component({
  selector: 'app-portal-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="settings-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <a routerLink="/portal" class="back-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to Dashboard
          </a>
          <h1>Settings & Preferences</h1>
        </div>
      </header>

      <!-- Settings Sections -->
      <div class="settings-content">
        <!-- Notification Preferences -->
        <section class="settings-section">
          <div class="section-header">
            <div class="section-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <div>
              <h2>Notification Preferences</h2>
              <p>Choose how you'd like to receive notifications</p>
            </div>
          </div>

          <div class="settings-group">
            <h3>Communication Channels</h3>
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-label">Email Notifications</span>
                <span class="setting-description">Receive notifications via email</span>
              </div>
              <label class="toggle">
                <input type="checkbox" [(ngModel)]="preferences.notifications.email" (ngModelChange)="markDirty()" />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-label">SMS Notifications</span>
                <span class="setting-description">Receive text message notifications</span>
              </div>
              <label class="toggle">
                <input type="checkbox" [(ngModel)]="preferences.notifications.sms" (ngModelChange)="markDirty()" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="settings-group">
            <h3>Notification Types</h3>
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-label">Appointment Reminders</span>
                <span class="setting-description">Get reminders before upcoming appointments</span>
              </div>
              <label class="toggle">
                <input type="checkbox" [(ngModel)]="preferences.notifications.appointmentReminders" (ngModelChange)="markDirty()" />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-label">Lab Results Ready</span>
                <span class="setting-description">Notify when new lab results are available</span>
              </div>
              <label class="toggle">
                <input type="checkbox" [(ngModel)]="preferences.notifications.labResultsReady" (ngModelChange)="markDirty()" />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-label">New Messages</span>
                <span class="setting-description">Notify when you receive a new message</span>
              </div>
              <label class="toggle">
                <input type="checkbox" [(ngModel)]="preferences.notifications.newMessages" (ngModelChange)="markDirty()" />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-label">Billing Alerts</span>
                <span class="setting-description">Notify about new statements and payment due dates</span>
              </div>
              <label class="toggle">
                <input type="checkbox" [(ngModel)]="preferences.notifications.billingAlerts" (ngModelChange)="markDirty()" />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-label">Prescription Updates</span>
                <span class="setting-description">Notify about refill status and new prescriptions</span>
              </div>
              <label class="toggle">
                <input type="checkbox" [(ngModel)]="preferences.notifications.prescriptionReminders" (ngModelChange)="markDirty()" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="settings-group">
            <h3>Reminder Timing</h3>
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-label">Appointment Reminder</span>
                <span class="setting-description">How far in advance to remind you</span>
              </div>
              <select [(ngModel)]="preferences.reminderTiming" (ngModelChange)="markDirty()">
                <option value="24h">1 day before</option>
                <option value="48h">2 days before</option>
                <option value="72h">3 days before</option>
                <option value="1week">1 week before</option>
              </select>
            </div>
          </div>
        </section>

        <!-- Language & Accessibility -->
        <section class="settings-section">
          <div class="section-header">
            <div class="section-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </div>
            <div>
              <h2>Language & Accessibility</h2>
              <p>Customize your experience</p>
            </div>
          </div>

          <div class="settings-group">
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-label">Preferred Language</span>
                <span class="setting-description">Display language for the portal</span>
              </div>
              <select [(ngModel)]="preferences.language" (ngModelChange)="markDirty()">
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="zh">中文</option>
                <option value="vi">Tiếng Việt</option>
              </select>
            </div>
          </div>
        </section>

        <!-- Billing Preferences -->
        <section class="settings-section">
          <div class="section-header">
            <div class="section-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </div>
            <div>
              <h2>Billing Preferences</h2>
              <p>Manage how you receive statements</p>
            </div>
          </div>

          <div class="settings-group">
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-label">Paperless Statements</span>
                <span class="setting-description">Receive statements electronically instead of by mail</span>
              </div>
              <label class="toggle">
                <input type="checkbox" [(ngModel)]="preferences.paperlessStatements" (ngModelChange)="markDirty()" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </section>

        <!-- Privacy & Data Sharing -->
        <section class="settings-section">
          <div class="section-header">
            <div class="section-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <h2>Privacy & Data Sharing</h2>
              <p>Control who can access your health information</p>
            </div>
          </div>

          <div class="settings-group">
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-label">Share with Caregivers</span>
                <span class="setting-description">Allow designated caregivers to view your health data</span>
              </div>
              <label class="toggle">
                <input type="checkbox" [(ngModel)]="preferences.shareDataWithCaregiver" (ngModelChange)="markDirty()" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          @if (preferences.shareDataWithCaregiver) {
            <div class="caregivers-section">
              <h4>Authorized Caregivers</h4>
              @for (caregiver of caregivers; track caregiver.id) {
                <div class="caregiver-card">
                  <div class="caregiver-info">
                    <span class="caregiver-name">{{ caregiver.name }}</span>
                    <span class="caregiver-relationship">{{ caregiver.relationship }}</span>
                  </div>
                  <button class="btn-icon" (click)="removeCaregiver(caregiver.id)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              } @empty {
                <div class="no-caregivers">No caregivers added yet</div>
              }
              <button class="btn-add" (click)="showAddCaregiver = true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
                Add Caregiver
              </button>

              <div class="caregiver-email-setting">
                <label class="setting-label">Caregiver Email</label>
                <input 
                  type="email" 
                  [(ngModel)]="preferences.caregiverEmail" 
                  (ngModelChange)="markDirty()"
                  placeholder="caregiver@example.com"
                />
              </div>
            </div>
          }
        </section>

        <!-- Security Settings -->
        <section class="settings-section">
          <div class="section-header">
            <div class="section-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div>
              <h2>Security Settings</h2>
              <p>Manage your account security</p>
            </div>
          </div>

          <div class="settings-group">
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-label">Two-Factor Authentication</span>
                <span class="setting-description">Add an extra layer of security to your account</span>
              </div>
              <label class="toggle">
                <input type="checkbox" [(ngModel)]="twoFactorEnabled" (ngModelChange)="toggleTwoFactor()" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="settings-group">
            <div class="action-row">
              <div class="setting-info">
                <span class="setting-label">Password</span>
                <span class="setting-description">Last changed 30 days ago</span>
              </div>
              <button class="btn-secondary" (click)="showChangePassword = true">Change Password</button>
            </div>
            <div class="action-row">
              <div class="setting-info">
                <span class="setting-label">Login History</span>
                <span class="setting-description">View recent account activity</span>
              </div>
              <button class="btn-secondary" (click)="showLoginHistory = true">View History</button>
            </div>
          </div>
        </section>
      </div>

      <!-- Save Bar -->
      @if (isDirty()) {
        <div class="save-bar">
          <span>You have unsaved changes</span>
          <div class="save-actions">
            <button class="btn-secondary" (click)="discardChanges()">Discard</button>
            <button class="btn-primary" (click)="saveChanges()">Save Changes</button>
          </div>
        </div>
      }

      <!-- Add Caregiver Modal -->
      @if (showAddCaregiver) {
        <div class="modal-overlay" (click)="showAddCaregiver = false">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Add Caregiver</h2>
              <button class="btn-close" (click)="showAddCaregiver = false">×</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Full Name</label>
                <input type="text" [(ngModel)]="newCaregiver.name" placeholder="Enter caregiver's name" />
              </div>
              <div class="form-group">
                <label>Email Address</label>
                <input type="email" [(ngModel)]="newCaregiver.email" placeholder="Enter email address" />
                <span class="help-text">An invitation will be sent to this email</span>
              </div>
              <div class="form-group">
                <label>Relationship</label>
                <select [(ngModel)]="newCaregiver.relationship">
                  <option value="">Select relationship</option>
                  <option value="spouse">Spouse/Partner</option>
                  <option value="parent">Parent</option>
                  <option value="child">Adult Child</option>
                  <option value="sibling">Sibling</option>
                  <option value="other">Other Family Member</option>
                  <option value="caregiver">Professional Caregiver</option>
                </select>
              </div>
              <div class="form-group">
                <label>Access Permissions</label>
                <div class="access-options">
                  <label class="checkbox-option">
                    <input type="checkbox" [(ngModel)]="newCaregiver.canViewRecords" />
                    View health records
                  </label>
                  <label class="checkbox-option">
                    <input type="checkbox" [(ngModel)]="newCaregiver.canSchedule" />
                    Schedule appointments
                  </label>
                  <label class="checkbox-option">
                    <input type="checkbox" [(ngModel)]="newCaregiver.canMessage" />
                    Send messages to care team
                  </label>
                  <label class="checkbox-option">
                    <input type="checkbox" [(ngModel)]="newCaregiver.canViewBilling" />
                    View billing information
                  </label>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" (click)="showAddCaregiver = false">Cancel</button>
              <button class="btn-primary" (click)="addCaregiver()" [disabled]="!canAddCaregiver()">Send Invitation</button>
            </div>
          </div>
        </div>
      }

      <!-- Change Password Modal -->
      @if (showChangePassword) {
        <div class="modal-overlay" (click)="showChangePassword = false">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Change Password</h2>
              <button class="btn-close" (click)="showChangePassword = false">×</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Current Password</label>
                <input type="password" [(ngModel)]="passwordForm.current" placeholder="Enter current password" />
              </div>
              <div class="form-group">
                <label>New Password</label>
                <input type="password" [(ngModel)]="passwordForm.new" placeholder="Enter new password" />
                <span class="help-text">Must be at least 8 characters</span>
              </div>
              <div class="form-group">
                <label>Confirm New Password</label>
                <input type="password" [(ngModel)]="passwordForm.confirm" placeholder="Confirm new password" />
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" (click)="showChangePassword = false">Cancel</button>
              <button class="btn-primary" (click)="changePassword()" [disabled]="!canChangePassword()">Update Password</button>
            </div>
          </div>
        </div>
      }

      <!-- Login History Modal -->
      @if (showLoginHistory) {
        <div class="modal-overlay" (click)="showLoginHistory = false">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Login History</h2>
              <button class="btn-close" (click)="showLoginHistory = false">×</button>
            </div>
            <div class="modal-body">
              <div class="login-history">
                <div class="history-item">
                  <div class="history-info">
                    <span class="history-device">Chrome on Windows</span>
                    <span class="history-location">San Francisco, CA</span>
                  </div>
                  <span class="history-time">Today, 2:30 PM</span>
                </div>
                <div class="history-item">
                  <div class="history-info">
                    <span class="history-device">Safari on iPhone</span>
                    <span class="history-location">San Francisco, CA</span>
                  </div>
                  <span class="history-time">Yesterday, 9:15 AM</span>
                </div>
                <div class="history-item">
                  <div class="history-info">
                    <span class="history-device">Chrome on MacOS</span>
                    <span class="history-location">San Francisco, CA</span>
                  </div>
                  <span class="history-time">Dec 28, 4:45 PM</span>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" (click)="showLoginHistory = false">Close</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .settings-container {
      min-height: 100vh;
      background: #f1f5f9;
    }

    .page-header {
      background: white;
      border-bottom: 1px solid #e2e8f0;
      padding: 1.5rem 2rem;
    }

    .header-content {
      max-width: 800px;
      margin: 0 auto;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: #64748b;
      font-size: 0.875rem;
      text-decoration: none;
      margin-bottom: 0.5rem;
    }

    .back-link svg { width: 16px; height: 16px; }
    .back-link:hover { color: #3b82f6; }

    h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }

    .settings-content {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }

    .settings-section {
      background: white;
      border-radius: 0.75rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      margin-bottom: 1.5rem;
      overflow: hidden;
    }

    .section-header {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .section-icon {
      width: 40px;
      height: 40px;
      background: #eff6ff;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .section-icon svg {
      width: 20px;
      height: 20px;
      color: #3b82f6;
    }

    .section-header h2 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 0.25rem 0;
    }

    .section-header p {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0;
    }

    .settings-group {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .settings-group:last-child { border-bottom: none; }

    .settings-group h3 {
      font-size: 0.75rem;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0 0 1rem 0;
    }

    .setting-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
    }

    .setting-row + .setting-row { border-top: 1px solid #f1f5f9; }

    .setting-info { flex: 1; }

    .setting-label {
      display: block;
      font-size: 0.9375rem;
      font-weight: 500;
      color: #1e293b;
      margin-bottom: 0.125rem;
    }

    .setting-description {
      display: block;
      font-size: 0.8125rem;
      color: #64748b;
    }

    /* Toggle Switch */
    .toggle {
      position: relative;
      width: 44px;
      height: 24px;
      flex-shrink: 0;
    }

    .toggle input { opacity: 0; width: 0; height: 0; }

    .toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: #cbd5e1;
      border-radius: 24px;
      transition: 0.3s;
    }

    .toggle-slider::before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      border-radius: 50%;
      transition: 0.3s;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }

    .toggle input:checked + .toggle-slider { background-color: #3b82f6; }
    .toggle input:checked + .toggle-slider::before { transform: translateX(20px); }

    /* Select */
    select {
      padding: 0.5rem 2rem 0.5rem 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      color: #1e293b;
      background: white url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E") no-repeat right 0.5rem center;
      appearance: none;
      cursor: pointer;
    }

    select:focus {
      outline: none;
      border-color: #3b82f6;
    }

    /* Action Row */
    .action-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
    }

    .action-row + .action-row { border-top: 1px solid #f1f5f9; }

    /* Buttons */
    .btn-primary {
      padding: 0.625rem 1.25rem;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn-primary:hover { background: #2563eb; }
    .btn-primary:disabled { background: #94a3b8; cursor: not-allowed; }

    .btn-secondary {
      padding: 0.625rem 1.25rem;
      background: white;
      color: #475569;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-secondary:hover { background: #f8fafc; border-color: #cbd5e1; }

    .btn-add {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.75rem;
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 0.5rem;
      color: #64748b;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-add svg { width: 18px; height: 18px; }
    .btn-add:hover { background: #f1f5f9; border-color: #94a3b8; }

    .btn-icon {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      border-radius: 0.375rem;
      color: #94a3b8;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-icon svg { width: 16px; height: 16px; }
    .btn-icon:hover { background: #fee2e2; color: #ef4444; }

    /* Caregivers Section */
    .caregivers-section {
      padding: 1rem 1.5rem;
    }

    .caregivers-section h4 {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 0.75rem 0;
    }

    .caregiver-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .caregiver-info { display: flex; flex-direction: column; gap: 0.125rem; }
    .caregiver-name { font-size: 0.875rem; font-weight: 500; color: #1e293b; }
    .caregiver-relationship { font-size: 0.75rem; color: #64748b; }

    .caregiver-email-setting {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }

    .caregiver-email-setting input {
      width: 100%;
      margin-top: 0.5rem;
      padding: 0.625rem 0.875rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.875rem;
    }

    .caregiver-email-setting input:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .no-caregivers {
      padding: 1rem;
      text-align: center;
      color: #94a3b8;
      font-size: 0.875rem;
    }

    /* Save Bar */
    .save-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      background: #1e293b;
      color: white;
      z-index: 100;
    }

    .save-bar span { font-size: 0.875rem; }
    .save-actions { display: flex; gap: 0.75rem; }

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
      max-width: 480px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .modal-header h2 { margin: 0; font-size: 1.125rem; font-weight: 600; color: #1e293b; }

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
    }

    .modal-body { padding: 1.5rem; overflow-y: auto; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1rem 1.5rem; border-top: 1px solid #e2e8f0; }

    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.375rem; font-size: 0.875rem; font-weight: 500; color: #374151; }

    .form-group input, .form-group select {
      width: 100%;
      padding: 0.625rem 0.875rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.875rem;
    }

    .form-group input:focus, .form-group select:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .help-text { display: block; margin-top: 0.25rem; font-size: 0.75rem; color: #94a3b8; }

    .access-options {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .checkbox-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #475569;
      cursor: pointer;
    }

    .checkbox-option input { width: auto; }

    /* Login History */
    .login-history { display: flex; flex-direction: column; gap: 0.5rem; }

    .history-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: 0.5rem;
    }

    .history-info { display: flex; flex-direction: column; gap: 0.125rem; }
    .history-device { font-size: 0.875rem; font-weight: 500; color: #1e293b; }
    .history-location { font-size: 0.75rem; color: #64748b; }
    .history-time { font-size: 0.75rem; color: #94a3b8; }

    @media (max-width: 768px) {
      .setting-row, .action-row { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
      .save-bar { flex-direction: column; gap: 0.75rem; }
      .save-actions { width: 100%; justify-content: flex-end; }
    }
  `]
})
export class PortalSettingsComponent {
  portalService = inject(PortalService);

  preferences: PortalPreferences = {
    patientId: 'current',
    notifications: {
      email: true,
      sms: true,
      appointmentReminders: true,
      labResultsReady: true,
      newMessages: true,
      billingAlerts: true,
      prescriptionReminders: true
    },
    reminderTiming: '24h',
    language: 'en',
    paperlessStatements: true,
    shareDataWithCaregiver: false
  };

  isDirty = signal(false);
  showAddCaregiver = false;
  showChangePassword = false;
  showLoginHistory = false;
  twoFactorEnabled = false;

  caregivers: Array<{id: string; name: string; relationship: string}> = [];

  newCaregiver = {
    name: '',
    email: '',
    relationship: '',
    canViewRecords: true,
    canSchedule: false,
    canMessage: false,
    canViewBilling: false
  };

  passwordForm = {
    current: '',
    new: '',
    confirm: ''
  };

  constructor() {
    // Load preferences from service
    const prefs = this.portalService.preferences();
    if (prefs) {
      this.preferences = { ...prefs };
    }
  }

  markDirty(): void {
    this.isDirty.set(true);
  }

  saveChanges(): void {
    this.portalService.updatePreferences(this.preferences);
    this.isDirty.set(false);
  }

  discardChanges(): void {
    const prefs = this.portalService.preferences();
    if (prefs) {
      this.preferences = { ...prefs };
    }
    this.isDirty.set(false);
  }

  canAddCaregiver(): boolean {
    return !!(this.newCaregiver.name && this.newCaregiver.email && this.newCaregiver.relationship);
  }

  addCaregiver(): void {
    if (this.canAddCaregiver()) {
      this.caregivers.push({
        id: 'CG-' + Date.now(),
        name: this.newCaregiver.name,
        relationship: this.newCaregiver.relationship
      });
      this.newCaregiver = {
        name: '',
        email: '',
        relationship: '',
        canViewRecords: true,
        canSchedule: false,
        canMessage: false,
        canViewBilling: false
      };
      this.showAddCaregiver = false;
    }
  }

  removeCaregiver(id: string): void {
    if (confirm('Are you sure you want to remove this caregiver?')) {
      this.caregivers = this.caregivers.filter(c => c.id !== id);
    }
  }

  toggleTwoFactor(): void {
    this.twoFactorEnabled = !this.twoFactorEnabled;
  }

  canChangePassword(): boolean {
    return !!(
      this.passwordForm.current &&
      this.passwordForm.new &&
      this.passwordForm.confirm &&
      this.passwordForm.new === this.passwordForm.confirm &&
      this.passwordForm.new.length >= 8
    );
  }

  changePassword(): void {
    if (this.canChangePassword()) {
      console.log('Password changed');
      this.passwordForm = { current: '', new: '', confirm: '' };
      this.showChangePassword = false;
    }
  }
}
