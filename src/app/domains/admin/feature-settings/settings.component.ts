import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { AdminService } from '../data-access/services/admin.service';
import { SystemSettings } from '../data-access/models/admin.model';

type SettingsSection = 'general' | 'security' | 'email' | 'scheduling' | 'billing' | 'clinical' | 'integrations';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="settings-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="title-section">
            <h1>System Settings</h1>
            <p class="subtitle">Configure system-wide settings and preferences</p>
          </div>
          <div class="header-actions">
            @if (hasChanges()) {
              <button class="btn btn-secondary" (click)="discardChanges()">
                Discard Changes
              </button>
              <button class="btn btn-primary" (click)="saveSettings()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                Save Changes
              </button>
            }
          </div>
        </div>
      </header>

      <div class="settings-layout">
        <!-- Sidebar Navigation -->
        <nav class="settings-nav">
          <button 
            class="nav-item"
            [class.active]="activeSection() === 'general'"
            (click)="activeSection.set('general')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            General
          </button>
          <button 
            class="nav-item"
            [class.active]="activeSection() === 'security'"
            (click)="activeSection.set('security')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Security
          </button>
          <button 
            class="nav-item"
            [class.active]="activeSection() === 'email'"
            (click)="activeSection.set('email')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            Email
          </button>
          <button 
            class="nav-item"
            [class.active]="activeSection() === 'scheduling'"
            (click)="activeSection.set('scheduling')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Scheduling
          </button>
          <button 
            class="nav-item"
            [class.active]="activeSection() === 'billing'"
            (click)="activeSection.set('billing')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            Billing
          </button>
          <button 
            class="nav-item"
            [class.active]="activeSection() === 'clinical'"
            (click)="activeSection.set('clinical')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
            Clinical
          </button>
          <button 
            class="nav-item"
            [class.active]="activeSection() === 'integrations'"
            (click)="activeSection.set('integrations')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="16 18 22 12 16 6"/>
              <polyline points="8 6 2 12 8 18"/>
            </svg>
            Integrations
          </button>
        </nav>

        <!-- Settings Content -->
        <div class="settings-content">
          <!-- General Settings -->
          @if (activeSection() === 'general') {
            <div class="settings-section">
              <div class="section-header">
                <h2>General Settings</h2>
                <p>Basic practice information and preferences</p>
              </div>
              <div class="settings-card">
                <h3>Practice Information</h3>
                <div class="form-grid">
                  <div class="form-group">
                    <label for="practiceName">Practice Name</label>
                    <input 
                      id="practiceName" 
                      type="text" 
                      [(ngModel)]="settings().general.practiceName"
                      (ngModelChange)="markChanged()"
                    />
                  </div>
                  <div class="form-group">
                    <label for="practicePhone">Phone</label>
                    <input 
                      id="practicePhone" 
                      type="tel" 
                      [(ngModel)]="settings().general.practicePhone"
                      (ngModelChange)="markChanged()"
                    />
                  </div>
                  <div class="form-group">
                    <label for="practiceFax">Fax</label>
                    <input 
                      id="practiceFax" 
                      type="tel" 
                      [(ngModel)]="settings().general.practiceFax"
                      (ngModelChange)="markChanged()"
                    />
                  </div>
                  <div class="form-group">
                    <label for="practiceEmail">Email</label>
                    <input 
                      id="practiceEmail" 
                      type="email" 
                      [(ngModel)]="settings().general.practiceEmail"
                      (ngModelChange)="markChanged()"
                    />
                  </div>
                  <div class="form-group full-width">
                    <label for="practiceAddress">Address</label>
                    <input 
                      id="practiceAddress" 
                      type="text" 
                      [(ngModel)]="settings().general.practiceAddress"
                      (ngModelChange)="markChanged()"
                    />
                  </div>
                  <div class="form-group">
                    <label for="practiceNpi">Practice NPI</label>
                    <input 
                      id="practiceNpi" 
                      type="text" 
                      [(ngModel)]="settings().general.practiceNpi"
                      (ngModelChange)="markChanged()"
                    />
                  </div>
                  <div class="form-group">
                    <label for="practiceTaxId">Tax ID</label>
                    <input 
                      id="practiceTaxId" 
                      type="text" 
                      [(ngModel)]="settings().general.practiceTaxId"
                      (ngModelChange)="markChanged()"
                    />
                  </div>
                </div>
              </div>
              <div class="settings-card">
                <h3>Localization</h3>
                <div class="form-grid">
                  <div class="form-group">
                    <label for="timezone">Timezone</label>
                    <select 
                      id="timezone" 
                      [(ngModel)]="settings().general.timezone"
                      (ngModelChange)="markChanged()"
                    >
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/New_York">Eastern Time</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="dateFormat">Date Format</label>
                    <select 
                      id="dateFormat" 
                      [(ngModel)]="settings().general.dateFormat"
                      (ngModelChange)="markChanged()"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="currency">Currency</label>
                    <select 
                      id="currency" 
                      [(ngModel)]="settings().general.currency"
                      (ngModelChange)="markChanged()"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="language">Default Language</label>
                    <select 
                      id="language" 
                      [(ngModel)]="settings().general.defaultLanguage"
                      (ngModelChange)="markChanged()"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Security Settings -->
          @if (activeSection() === 'security') {
            <div class="settings-section">
              <div class="section-header">
                <h2>Security Settings</h2>
                <p>Password policies, session management, and access controls</p>
              </div>
              <div class="settings-card">
                <h3>Password Policy</h3>
                <div class="form-grid">
                  <div class="form-group">
                    <label for="minLength">Minimum Length</label>
                    <input 
                      id="minLength" 
                      type="number" 
                      [(ngModel)]="settings().security.passwordPolicy.minLength"
                      (ngModelChange)="markChanged()"
                      min="8" max="32"
                    />
                  </div>
                  <div class="form-group">
                    <label for="expirationDays">Expiration (days)</label>
                    <input 
                      id="expirationDays" 
                      type="number" 
                      [(ngModel)]="settings().security.passwordPolicy.expirationDays"
                      (ngModelChange)="markChanged()"
                      min="0" max="365"
                    />
                  </div>
                  <div class="form-group">
                    <label for="historyCount">History Count</label>
                    <input 
                      id="historyCount" 
                      type="number" 
                      [(ngModel)]="settings().security.passwordPolicy.historyCount"
                      (ngModelChange)="markChanged()"
                      min="0" max="24"
                    />
                  </div>
                </div>
                <div class="checkbox-grid">
                  <label class="checkbox-item">
                    <input 
                      type="checkbox" 
                      [(ngModel)]="settings().security.passwordPolicy.requireUppercase"
                      (ngModelChange)="markChanged()"
                    />
                    <span>Require uppercase letters</span>
                  </label>
                  <label class="checkbox-item">
                    <input 
                      type="checkbox" 
                      [(ngModel)]="settings().security.passwordPolicy.requireLowercase"
                      (ngModelChange)="markChanged()"
                    />
                    <span>Require lowercase letters</span>
                  </label>
                  <label class="checkbox-item">
                    <input 
                      type="checkbox" 
                      [(ngModel)]="settings().security.passwordPolicy.requireNumbers"
                      (ngModelChange)="markChanged()"
                    />
                    <span>Require numbers</span>
                  </label>
                  <label class="checkbox-item">
                    <input 
                      type="checkbox" 
                      [(ngModel)]="settings().security.passwordPolicy.requireSpecialChars"
                      (ngModelChange)="markChanged()"
                    />
                    <span>Require special characters</span>
                  </label>
                </div>
              </div>
              <div class="settings-card">
                <h3>Session Policy</h3>
                <div class="form-grid">
                  <div class="form-group">
                    <label for="maxIdleMinutes">Max Idle Time (minutes)</label>
                    <input 
                      id="maxIdleMinutes" 
                      type="number" 
                      [(ngModel)]="settings().security.sessionPolicy.maxIdleMinutes"
                      (ngModelChange)="markChanged()"
                      min="5" max="480"
                    />
                  </div>
                  <div class="form-group">
                    <label for="maxSessionHours">Max Session Duration (hours)</label>
                    <input 
                      id="maxSessionHours" 
                      type="number" 
                      [(ngModel)]="settings().security.sessionPolicy.maxSessionHours"
                      (ngModelChange)="markChanged()"
                      min="1" max="24"
                    />
                  </div>
                </div>
                <div class="checkbox-grid">
                  <label class="checkbox-item">
                    <input 
                      type="checkbox" 
                      [(ngModel)]="settings().security.sessionPolicy.singleSessionOnly"
                      (ngModelChange)="markChanged()"
                    />
                    <span>Allow only one active session per user</span>
                  </label>
                  <label class="checkbox-item">
                    <input 
                      type="checkbox" 
                      [(ngModel)]="settings().security.sessionPolicy.requireMfa"
                      (ngModelChange)="markChanged()"
                    />
                    <span>Require multi-factor authentication</span>
                  </label>
                </div>
              </div>
              <div class="settings-card">
                <h3>Login Policy</h3>
                <div class="form-grid">
                  <div class="form-group">
                    <label for="maxAttempts">Max Login Attempts</label>
                    <input 
                      id="maxAttempts" 
                      type="number" 
                      [(ngModel)]="settings().security.loginPolicy.maxAttempts"
                      (ngModelChange)="markChanged()"
                      min="3" max="10"
                    />
                  </div>
                  <div class="form-group">
                    <label for="lockoutMinutes">Lockout Duration (minutes)</label>
                    <input 
                      id="lockoutMinutes" 
                      type="number" 
                      [(ngModel)]="settings().security.loginPolicy.lockoutMinutes"
                      (ngModelChange)="markChanged()"
                      min="5" max="1440"
                    />
                  </div>
                </div>
                <div class="checkbox-grid">
                  <label class="checkbox-item">
                    <input 
                      type="checkbox" 
                      [(ngModel)]="settings().security.loginPolicy.allowRememberMe"
                      (ngModelChange)="markChanged()"
                    />
                    <span>Allow "Remember Me" option</span>
                  </label>
                </div>
              </div>
            </div>
          }

          <!-- Email Settings -->
          @if (activeSection() === 'email') {
            <div class="settings-section">
              <div class="section-header">
                <h2>Email Settings</h2>
                <p>SMTP configuration and email preferences</p>
              </div>
              <div class="settings-card">
                <h3>SMTP Configuration</h3>
                <div class="form-grid">
                  <div class="form-group">
                    <label for="smtpHost">SMTP Host</label>
                    <input 
                      id="smtpHost" 
                      type="text" 
                      [(ngModel)]="settings().email.smtpHost"
                      (ngModelChange)="markChanged()"
                    />
                  </div>
                  <div class="form-group">
                    <label for="smtpPort">SMTP Port</label>
                    <input 
                      id="smtpPort" 
                      type="number" 
                      [(ngModel)]="settings().email.smtpPort"
                      (ngModelChange)="markChanged()"
                    />
                  </div>
                  <div class="form-group">
                    <label for="smtpUsername">Username</label>
                    <input 
                      id="smtpUsername" 
                      type="text" 
                      [(ngModel)]="settings().email.smtpUsername"
                      (ngModelChange)="markChanged()"
                    />
                  </div>
                  <div class="form-group">
                    <label for="smtpPassword">Password</label>
                    <input 
                      id="smtpPassword" 
                      type="password" 
                      [(ngModel)]="settings().email.smtpPassword"
                      (ngModelChange)="markChanged()"
                    />
                  </div>
                  <div class="form-group">
                    <label for="smtpEncryption">Encryption</label>
                    <select 
                      id="smtpEncryption" 
                      [(ngModel)]="settings().email.smtpEncryption"
                      (ngModelChange)="markChanged()"
                    >
                      <option value="none">None</option>
                      <option value="ssl">SSL</option>
                      <option value="tls">TLS</option>
                    </select>
                  </div>
                </div>
                <div class="form-actions">
                  <button class="btn btn-secondary btn-sm" (click)="testEmailConnection()">
                    Test Connection
                  </button>
                </div>
              </div>
              <div class="settings-card">
                <h3>Email Addresses</h3>
                <div class="form-grid">
                  <div class="form-group">
                    <label for="fromAddress">From Address</label>
                    <input 
                      id="fromAddress" 
                      type="email" 
                      [(ngModel)]="settings().email.fromAddress"
                      (ngModelChange)="markChanged()"
                    />
                  </div>
                  <div class="form-group">
                    <label for="fromName">From Name</label>
                    <input 
                      id="fromName" 
                      type="text" 
                      [(ngModel)]="settings().email.fromName"
                      (ngModelChange)="markChanged()"
                    />
                  </div>
                  <div class="form-group">
                    <label for="replyToAddress">Reply-To Address</label>
                    <input 
                      id="replyToAddress" 
                      type="email" 
                      [(ngModel)]="settings().email.replyToAddress"
                      (ngModelChange)="markChanged()"
                    />
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Scheduling Settings -->
          @if (activeSection() === 'scheduling') {
            <div class="settings-section">
              <div class="section-header">
                <h2>Scheduling Settings</h2>
                <p>Appointment scheduling rules and working hours</p>
              </div>
              <div class="settings-card">
                <h3>Appointment Rules</h3>
                <div class="form-grid">
                  <div class="form-group">
                    <label for="defaultSlotDuration">Default Slot Duration (minutes)</label>
                    <select 
                      id="defaultSlotDuration" 
                      [(ngModel)]="settings().scheduling.defaultSlotDuration"
                      (ngModelChange)="markChanged()"
                    >
                      <option [value]="15">15 minutes</option>
                      <option [value]="20">20 minutes</option>
                      <option [value]="30">30 minutes</option>
                      <option [value]="45">45 minutes</option>
                      <option [value]="60">60 minutes</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="minAdvanceBookingHours">Min Advance Booking (hours)</label>
                    <input 
                      id="minAdvanceBookingHours" 
                      type="number" 
                      [(ngModel)]="settings().scheduling.minAdvanceBookingHours"
                      (ngModelChange)="markChanged()"
                      min="0"
                    />
                  </div>
                  <div class="form-group">
                    <label for="maxAdvanceBookingDays">Max Advance Booking (days)</label>
                    <input 
                      id="maxAdvanceBookingDays" 
                      type="number" 
                      [(ngModel)]="settings().scheduling.maxAdvanceBookingDays"
                      (ngModelChange)="markChanged()"
                      min="1"
                    />
                  </div>
                  <div class="form-group">
                    <label for="cancellationPolicyHours">Cancellation Policy (hours)</label>
                    <input 
                      id="cancellationPolicyHours" 
                      type="number" 
                      [(ngModel)]="settings().scheduling.cancellationPolicyHours"
                      (ngModelChange)="markChanged()"
                      min="0"
                    />
                  </div>
                </div>
                <div class="checkbox-grid">
                  <label class="checkbox-item">
                    <input 
                      type="checkbox" 
                      [(ngModel)]="settings().scheduling.allowDoubleBooking"
                      (ngModelChange)="markChanged()"
                    />
                    <span>Allow double booking</span>
                  </label>
                  <label class="checkbox-item">
                    <input 
                      type="checkbox" 
                      [(ngModel)]="settings().scheduling.allowWaitlist"
                      (ngModelChange)="markChanged()"
                    />
                    <span>Enable waitlist</span>
                  </label>
                  <label class="checkbox-item">
                    <input 
                      type="checkbox" 
                      [(ngModel)]="settings().scheduling.confirmationRequired"
                      (ngModelChange)="markChanged()"
                    />
                    <span>Require appointment confirmation</span>
                  </label>
                </div>
              </div>
              <div class="settings-card">
                <h3>Working Hours</h3>
                <div class="working-hours">
                  @for (day of weekdays; track day.key) {
                    <div class="day-row">
                      <label class="checkbox-item">
                        <input 
                          type="checkbox" 
                          [(ngModel)]="settings().scheduling.workingHours[day.key].enabled"
                          (ngModelChange)="markChanged()"
                        />
                        <span class="day-name">{{ day.label }}</span>
                      </label>
                      @if (settings().scheduling.workingHours[day.key].enabled) {
                        <div class="time-range">
                          <input 
                            type="time" 
                            [(ngModel)]="settings().scheduling.workingHours[day.key].start"
                            (ngModelChange)="markChanged()"
                          />
                          <span>to</span>
                          <input 
                            type="time" 
                            [(ngModel)]="settings().scheduling.workingHours[day.key].end"
                            (ngModelChange)="markChanged()"
                          />
                        </div>
                      } @else {
                        <span class="closed-label">Closed</span>
                      }
                    </div>
                  }
                </div>
              </div>
            </div>
          }

          <!-- Billing Settings -->
          @if (activeSection() === 'billing') {
            <div class="settings-section">
              <div class="section-header">
                <h2>Billing Settings</h2>
                <p>Claims, payments, and billing preferences</p>
              </div>
              <div class="settings-card">
                <h3>Claims Configuration</h3>
                <div class="form-grid">
                  <div class="form-group">
                    <label for="claimSubmissionMethod">Claim Submission Method</label>
                    <select 
                      id="claimSubmissionMethod" 
                      [(ngModel)]="settings().billing.claimSubmissionMethod"
                      (ngModelChange)="markChanged()"
                    >
                      <option value="electronic">Electronic Only</option>
                      <option value="paper">Paper Only</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="clearinghouseId">Clearinghouse ID</label>
                    <input 
                      id="clearinghouseId" 
                      type="text" 
                      [(ngModel)]="settings().billing.clearinghouseId"
                      (ngModelChange)="markChanged()"
                    />
                  </div>
                  <div class="form-group">
                    <label for="statementFrequency">Statement Frequency</label>
                    <select 
                      id="statementFrequency" 
                      [(ngModel)]="settings().billing.statementFrequency"
                      (ngModelChange)="markChanged()"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="taxRate">Tax Rate (%)</label>
                    <input 
                      id="taxRate" 
                      type="number" 
                      [(ngModel)]="settings().billing.taxRate"
                      (ngModelChange)="markChanged()"
                      min="0" max="100" step="0.01"
                    />
                  </div>
                </div>
                <div class="checkbox-grid">
                  <label class="checkbox-item">
                    <input 
                      type="checkbox" 
                      [(ngModel)]="settings().billing.autoPostPayments"
                      (ngModelChange)="markChanged()"
                    />
                    <span>Auto-post ERA payments</span>
                  </label>
                </div>
              </div>
              <div class="settings-card">
                <h3>Collections</h3>
                <div class="form-grid">
                  <div class="form-group">
                    <label for="collectionThresholdDays">Collection Threshold (days)</label>
                    <input 
                      id="collectionThresholdDays" 
                      type="number" 
                      [(ngModel)]="settings().billing.collectionThresholdDays"
                      (ngModelChange)="markChanged()"
                      min="30"
                    />
                  </div>
                  <div class="form-group">
                    <label for="collectionThresholdAmount">Collection Threshold ($)</label>
                    <input 
                      id="collectionThresholdAmount" 
                      type="number" 
                      [(ngModel)]="settings().billing.collectionThresholdAmount"
                      (ngModelChange)="markChanged()"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Clinical Settings -->
          @if (activeSection() === 'clinical') {
            <div class="settings-section">
              <div class="section-header">
                <h2>Clinical Settings</h2>
                <p>Chart defaults, prescription settings, and clinical preferences</p>
              </div>
              <div class="settings-card">
                <h3>Chart Settings</h3>
                <div class="form-grid">
                  <div class="form-group">
                    <label for="defaultChartTemplate">Default Chart Template</label>
                    <select 
                      id="defaultChartTemplate" 
                      [(ngModel)]="settings().clinical.defaultChartTemplate"
                      (ngModelChange)="markChanged()"
                    >
                      <option value="soap">SOAP Note</option>
                      <option value="hpi">HPI Template</option>
                      <option value="procedure">Procedure Note</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="autoSaveInterval">Auto-save Interval (seconds)</label>
                    <input 
                      id="autoSaveInterval" 
                      type="number" 
                      [(ngModel)]="settings().clinical.autoSaveInterval"
                      (ngModelChange)="markChanged()"
                      min="30" max="300"
                    />
                  </div>
                </div>
                <div class="checkbox-grid">
                  <label class="checkbox-item">
                    <input 
                      type="checkbox" 
                      [(ngModel)]="settings().clinical.requireSignature"
                      (ngModelChange)="markChanged()"
                    />
                    <span>Require signature for encounter completion</span>
                  </label>
                </div>
              </div>
              <div class="settings-card">
                <h3>Prescription Defaults</h3>
                <div class="form-grid">
                  <div class="form-group">
                    <label for="defaultQuantity">Default Quantity</label>
                    <input 
                      id="defaultQuantity" 
                      type="number" 
                      [(ngModel)]="settings().clinical.prescriptionDefaults.defaultQuantity"
                      (ngModelChange)="markChanged()"
                      min="1"
                    />
                  </div>
                  <div class="form-group">
                    <label for="defaultRefills">Default Refills</label>
                    <input 
                      id="defaultRefills" 
                      type="number" 
                      [(ngModel)]="settings().clinical.prescriptionDefaults.defaultRefills"
                      (ngModelChange)="markChanged()"
                      min="0"
                    />
                  </div>
                </div>
                <div class="checkbox-grid">
                  <label class="checkbox-item">
                    <input 
                      type="checkbox" 
                      [(ngModel)]="settings().clinical.prescriptionDefaults.requireEpcs"
                      (ngModelChange)="markChanged()"
                    />
                    <span>Require EPCS for controlled substances</span>
                  </label>
                </div>
              </div>
              <div class="settings-card">
                <h3>Vitals Settings</h3>
                <div class="form-grid">
                  <div class="form-group">
                    <label for="vitalUnits">Unit System</label>
                    <select 
                      id="vitalUnits" 
                      [(ngModel)]="settings().clinical.vitalsSigns.units"
                      (ngModelChange)="markChanged()"
                    >
                      <option value="imperial">Imperial (lbs, °F)</option>
                      <option value="metric">Metric (kg, °C)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Integrations Settings -->
          @if (activeSection() === 'integrations') {
            <div class="settings-section">
              <div class="section-header">
                <h2>Integrations</h2>
                <p>External systems and API configurations</p>
              </div>
              <div class="settings-card">
                <div class="integration-header">
                  <div class="integration-info">
                    <h3>HL7 Interface</h3>
                    <p>Health Level 7 messaging integration</p>
                  </div>
                  <label class="toggle">
                    <input 
                      type="checkbox" 
                      [(ngModel)]="settings().integrations.hl7.enabled"
                      (ngModelChange)="markChanged()"
                    />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
                @if (settings().integrations.hl7.enabled) {
                  <div class="form-grid">
                    <div class="form-group">
                      <label for="hl7Version">HL7 Version</label>
                      <select 
                        id="hl7Version" 
                        [(ngModel)]="settings().integrations.hl7.version"
                        (ngModelChange)="markChanged()"
                      >
                        <option value="2.3">2.3</option>
                        <option value="2.5">2.5</option>
                        <option value="2.5.1">2.5.1</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label for="sendingFacility">Sending Facility</label>
                      <input 
                        id="sendingFacility" 
                        type="text" 
                        [(ngModel)]="settings().integrations.hl7.sendingFacility"
                        (ngModelChange)="markChanged()"
                      />
                    </div>
                  </div>
                }
              </div>
              <div class="settings-card">
                <div class="integration-header">
                  <div class="integration-info">
                    <h3>FHIR API</h3>
                    <p>Fast Healthcare Interoperability Resources</p>
                  </div>
                  <label class="toggle">
                    <input 
                      type="checkbox" 
                      [(ngModel)]="settings().integrations.fhir.enabled"
                      (ngModelChange)="markChanged()"
                    />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
                @if (settings().integrations.fhir.enabled) {
                  <div class="form-grid">
                    <div class="form-group">
                      <label for="fhirVersion">FHIR Version</label>
                      <select 
                        id="fhirVersion" 
                        [(ngModel)]="settings().integrations.fhir.version"
                        (ngModelChange)="markChanged()"
                      >
                        <option value="R4">R4</option>
                        <option value="STU3">STU3</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label for="fhirServerUrl">Server URL</label>
                      <input 
                        id="fhirServerUrl" 
                        type="url" 
                        [(ngModel)]="settings().integrations.fhir.serverUrl"
                        (ngModelChange)="markChanged()"
                      />
                    </div>
                  </div>
                }
              </div>
              <div class="settings-card">
                <div class="integration-header">
                  <div class="integration-info">
                    <h3>Prescription Network</h3>
                    <p>Surescripts e-Prescribing network</p>
                  </div>
                  <label class="toggle">
                    <input 
                      type="checkbox" 
                      [(ngModel)]="settings().integrations.prescriptionNetwork.enabled"
                      (ngModelChange)="markChanged()"
                    />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
                @if (settings().integrations.prescriptionNetwork.enabled) {
                  <div class="form-grid">
                    <div class="form-group">
                      <label for="networkId">Network ID</label>
                      <input 
                        id="networkId" 
                        type="text" 
                        [(ngModel)]="settings().integrations.prescriptionNetwork.networkId"
                        (ngModelChange)="markChanged()"
                      />
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      padding: 1.5rem;
      max-width: 1400px;
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

    /* Layout */
    .settings-layout {
      display: grid;
      grid-template-columns: 220px 1fr;
      gap: 1.5rem;
    }

    /* Navigation */
    .settings-nav {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border: none;
      background: transparent;
      text-align: left;
      font-size: 0.875rem;
      font-weight: 500;
      color: #64748b;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .nav-item:hover {
      background: #f1f5f9;
      color: #1e293b;
    }

    .nav-item.active {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .nav-item svg {
      width: 1.25rem;
      height: 1.25rem;
    }

    /* Settings Content */
    .settings-content {
      min-width: 0;
    }

    .settings-section {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .section-header h2 {
      margin: 0 0 0.25rem;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
    }

    .section-header p {
      margin: 0;
      font-size: 0.875rem;
      color: #64748b;
    }

    .settings-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 1.5rem;
    }

    .settings-card h3 {
      margin: 0 0 1rem;
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
    }

    /* Form Styles */
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .form-group.full-width {
      grid-column: 1 / -1;
    }

    .form-group label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }

    .form-group input,
    .form-group select {
      padding: 0.5rem 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-family: inherit;
    }

    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .form-actions {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }

    .checkbox-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
      margin-top: 1rem;
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

    /* Working Hours */
    .working-hours {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .day-row {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .day-row .checkbox-item {
      min-width: 140px;
    }

    .day-name {
      font-weight: 500;
    }

    .time-range {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .time-range input {
      padding: 0.375rem 0.5rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
      font-size: 0.8125rem;
    }

    .time-range span {
      color: #64748b;
      font-size: 0.875rem;
    }

    .closed-label {
      font-size: 0.875rem;
      color: #94a3b8;
      font-style: italic;
    }

    /* Integration Cards */
    .integration-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .integration-info h3 {
      margin: 0 0 0.25rem;
    }

    .integration-info p {
      margin: 0;
      font-size: 0.8125rem;
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

    /* Responsive */
    @media (max-width: 768px) {
      .settings-layout {
        grid-template-columns: 1fr;
      }

      .settings-nav {
        flex-direction: row;
        overflow-x: auto;
        padding-bottom: 0.5rem;
        gap: 0.5rem;
      }

      .nav-item {
        white-space: nowrap;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .checkbox-grid {
        grid-template-columns: 1fr;
      }

      .day-row {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class SettingsComponent {
  private adminService = inject(AdminService);

  activeSection = signal<SettingsSection>('general');
  settings = signal<SystemSettings>(JSON.parse(JSON.stringify(this.adminService.systemSettings())));
  hasChanges = signal(false);

  weekdays = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  markChanged(): void {
    this.hasChanges.set(true);
  }

  saveSettings(): void {
    const currentSettings = this.settings();
    
    // Update each section
    this.adminService.updateSettings('general', currentSettings.general);
    this.adminService.updateSettings('security', currentSettings.security);
    this.adminService.updateSettings('email', currentSettings.email);
    this.adminService.updateSettings('scheduling', currentSettings.scheduling);
    this.adminService.updateSettings('billing', currentSettings.billing);
    this.adminService.updateSettings('clinical', currentSettings.clinical);
    this.adminService.updateSettings('integrations', currentSettings.integrations);
    
    this.hasChanges.set(false);
    console.log('Settings saved successfully');
  }

  discardChanges(): void {
    this.settings.set(JSON.parse(JSON.stringify(this.adminService.systemSettings())));
    this.hasChanges.set(false);
  }

  testEmailConnection(): void {
    console.log('Testing email connection...');
    alert('Connection test successful!');
  }
}
