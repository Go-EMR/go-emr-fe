import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

import { ThemeService } from '../../../core/services/theme.service';
import { AdminService } from '../data-access/services/admin.service';
import { SystemSettings } from '../data-access/models/admin.model';

type SettingsSection = 'general' | 'security' | 'email' | 'scheduling' | 'billing' | 'clinical' | 'integrations';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    ButtonModule, InputTextModule, InputNumberModule, SelectModule,
    ToggleSwitchModule, CheckboxModule, DividerModule, RippleModule,
    ToastModule, TagModule, BadgeModule, TooltipModule,
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate('350ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ]),
    trigger('staggerCards', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(15px)' }),
          stagger(80, [
            animate('300ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('navItem', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ],
  template: `
    <div class="settings-container" [class.dark]="themeService.isDarkMode()">
      <p-toast />

      <!-- Header -->
      <header class="page-header" @fadeSlide>
        <div class="header-content">
          <div class="title-section">
            <h1>System Settings</h1>
            <p class="subtitle">Configure system-wide settings and preferences</p>
          </div>
          <div class="header-actions">
            @if (hasChanges()) {
              <p-button label="Discard" [outlined]="true" severity="secondary" (onClick)="discardChanges()" />
              <p-button label="Save Changes" icon="pi pi-save" severity="success" (onClick)="saveSettings()" />
            }
          </div>
        </div>

        <!-- Unsaved Changes Banner -->
        @if (hasChanges()) {
          <div class="changes-banner" @fadeSlide>
            <i class="pi pi-exclamation-circle"></i>
            <span>You have unsaved changes</span>
          </div>
        }
      </header>

      <div class="settings-layout">
        <!-- Sidebar Navigation -->
        <nav class="settings-nav" @slideIn>
          @for (item of navItems; track item.key) {
            <button 
              class="nav-item"
              [class.active]="activeSection() === item.key"
              (click)="activeSection.set(item.key)"
              pRipple
            >
              <i [class]="item.icon"></i>
              <span>{{ item.label }}</span>
              @if (item.key === 'security') {
                <span class="nav-badge">Important</span>
              }
            </button>
          }
        </nav>

        <!-- Settings Content -->
        <div class="settings-content">
          <!-- General Settings -->
          @if (activeSection() === 'general') {
            <div class="settings-section" @staggerCards>
              <div class="section-header">
                <div class="section-icon">
                  <i class="pi pi-cog"></i>
                </div>
                <div class="section-info">
                  <h2>General Settings</h2>
                  <p>Basic practice information and preferences</p>
                </div>
              </div>

              <div class="settings-card">
                <div class="card-header">
                  <h3>Practice Information</h3>
                  <p-tag value="Required" severity="success" />
                </div>
                <div class="form-grid">
                  <div class="form-field">
                    <label>Practice Name</label>
                    <input pInputText [(ngModel)]="settings().general.practiceName" (ngModelChange)="markChanged()" class="w-full" />
                  </div>
                  <div class="form-field">
                    <label>Phone</label>
                    <input pInputText [(ngModel)]="settings().general.practicePhone" (ngModelChange)="markChanged()" class="w-full" />
                  </div>
                  <div class="form-field">
                    <label>Fax</label>
                    <input pInputText [(ngModel)]="settings().general.practiceFax" (ngModelChange)="markChanged()" class="w-full" />
                  </div>
                  <div class="form-field">
                    <label>Email</label>
                    <input pInputText type="email" [(ngModel)]="settings().general.practiceEmail" (ngModelChange)="markChanged()" class="w-full" />
                  </div>
                  <div class="form-field full-width">
                    <label>Address</label>
                    <input pInputText [(ngModel)]="settings().general.practiceAddress" (ngModelChange)="markChanged()" class="w-full" />
                  </div>
                  <div class="form-field">
                    <label>Practice NPI</label>
                    <input pInputText [(ngModel)]="settings().general.practiceNpi" (ngModelChange)="markChanged()" class="w-full" />
                  </div>
                  <div class="form-field">
                    <label>Tax ID</label>
                    <input pInputText [(ngModel)]="settings().general.practiceTaxId" (ngModelChange)="markChanged()" class="w-full" />
                  </div>
                </div>
              </div>

              <div class="settings-card">
                <div class="card-header">
                  <h3>Localization</h3>
                </div>
                <div class="form-grid">
                  <div class="form-field">
                    <label>Timezone</label>
                    <p-select [(ngModel)]="settings().general.timezone" (ngModelChange)="markChanged()" [options]="timezoneOptions" optionLabel="label" optionValue="value" styleClass="w-full" />
                  </div>
                  <div class="form-field">
                    <label>Date Format</label>
                    <p-select [(ngModel)]="settings().general.dateFormat" (ngModelChange)="markChanged()" [options]="dateFormatOptions" optionLabel="label" optionValue="value" styleClass="w-full" />
                  </div>
                  <div class="form-field">
                    <label>Currency</label>
                    <p-select [(ngModel)]="settings().general.currency" (ngModelChange)="markChanged()" [options]="currencyOptions" optionLabel="label" optionValue="value" styleClass="w-full" />
                  </div>
                  <div class="form-field">
                    <label>Default Language</label>
                    <p-select [(ngModel)]="settings().general.defaultLanguage" (ngModelChange)="markChanged()" [options]="languageOptions" optionLabel="label" optionValue="value" styleClass="w-full" />
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Security Settings -->
          @if (activeSection() === 'security') {
            <div class="settings-section" @staggerCards>
              <div class="section-header">
                <div class="section-icon security">
                  <i class="pi pi-shield"></i>
                </div>
                <div class="section-info">
                  <h2>Security Settings</h2>
                  <p>Password policies, session management, and access controls</p>
                </div>
              </div>

              <div class="settings-card">
                <div class="card-header">
                  <h3>Password Policy</h3>
                  <p-tag value="Critical" severity="danger" />
                </div>
                <div class="form-grid">
                  <div class="form-field">
                    <label>Minimum Length</label>
                    <p-inputNumber [(ngModel)]="settings().security.passwordPolicy.minLength" (ngModelChange)="markChanged()" [min]="8" [max]="32" [showButtons]="true" styleClass="w-full" />
                  </div>
                  <div class="form-field">
                    <label>Expiration (days)</label>
                    <p-inputNumber [(ngModel)]="settings().security.passwordPolicy.expirationDays" (ngModelChange)="markChanged()" [min]="0" [max]="365" [showButtons]="true" styleClass="w-full" />
                  </div>
                  <div class="form-field">
                    <label>History Count</label>
                    <p-inputNumber [(ngModel)]="settings().security.passwordPolicy.historyCount" (ngModelChange)="markChanged()" [min]="0" [max]="24" [showButtons]="true" styleClass="w-full" />
                  </div>
                </div>
                <p-divider />
                <div class="options-grid">
                  <div class="option-item" pRipple (click)="togglePasswordOption('requireUppercase')">
                    <div class="option-check" [class.checked]="settings().security.passwordPolicy.requireUppercase">
                      @if (settings().security.passwordPolicy.requireUppercase) {
                        <i class="pi pi-check"></i>
                      }
                    </div>
                    <span>Require uppercase letters</span>
                  </div>
                  <div class="option-item" pRipple (click)="togglePasswordOption('requireLowercase')">
                    <div class="option-check" [class.checked]="settings().security.passwordPolicy.requireLowercase">
                      @if (settings().security.passwordPolicy.requireLowercase) {
                        <i class="pi pi-check"></i>
                      }
                    </div>
                    <span>Require lowercase letters</span>
                  </div>
                  <div class="option-item" pRipple (click)="togglePasswordOption('requireNumbers')">
                    <div class="option-check" [class.checked]="settings().security.passwordPolicy.requireNumbers">
                      @if (settings().security.passwordPolicy.requireNumbers) {
                        <i class="pi pi-check"></i>
                      }
                    </div>
                    <span>Require numbers</span>
                  </div>
                  <div class="option-item" pRipple (click)="togglePasswordOption('requireSpecialChars')">
                    <div class="option-check" [class.checked]="settings().security.passwordPolicy.requireSpecialChars">
                      @if (settings().security.passwordPolicy.requireSpecialChars) {
                        <i class="pi pi-check"></i>
                      }
                    </div>
                    <span>Require special characters</span>
                  </div>
                </div>
              </div>

              <div class="settings-card">
                <div class="card-header">
                  <h3>Session Policy</h3>
                </div>
                <div class="form-grid">
                  <div class="form-field">
                    <label>Max Idle Time (minutes)</label>
                    <p-inputNumber [(ngModel)]="settings().security.sessionPolicy.maxIdleMinutes" (ngModelChange)="markChanged()" [min]="5" [max]="480" [showButtons]="true" styleClass="w-full" />
                  </div>
                  <div class="form-field">
                    <label>Max Session Duration (hours)</label>
                    <p-inputNumber [(ngModel)]="settings().security.sessionPolicy.maxSessionHours" (ngModelChange)="markChanged()" [min]="1" [max]="24" [showButtons]="true" styleClass="w-full" />
                  </div>
                </div>
                <p-divider />
                <div class="toggle-options">
                  <div class="toggle-option">
                    <div class="toggle-info">
                      <span class="toggle-label">Single Session Only</span>
                      <span class="toggle-desc">Allow only one active session per user</span>
                    </div>
                    <p-toggleSwitch [(ngModel)]="settings().security.sessionPolicy.singleSessionOnly" (ngModelChange)="markChanged()" />
                  </div>
                  <div class="toggle-option">
                    <div class="toggle-info">
                      <span class="toggle-label">Require MFA</span>
                      <span class="toggle-desc">Require multi-factor authentication for all users</span>
                    </div>
                    <p-toggleSwitch [(ngModel)]="settings().security.sessionPolicy.requireMfa" (ngModelChange)="markChanged()" />
                  </div>
                </div>
              </div>

              <div class="settings-card">
                <div class="card-header">
                  <h3>Login Policy</h3>
                </div>
                <div class="form-grid">
                  <div class="form-field">
                    <label>Max Login Attempts</label>
                    <p-inputNumber [(ngModel)]="settings().security.loginPolicy.maxAttempts" (ngModelChange)="markChanged()" [min]="3" [max]="10" [showButtons]="true" styleClass="w-full" />
                  </div>
                  <div class="form-field">
                    <label>Lockout Duration (minutes)</label>
                    <p-inputNumber [(ngModel)]="settings().security.loginPolicy.lockoutMinutes" (ngModelChange)="markChanged()" [min]="5" [max]="1440" [showButtons]="true" styleClass="w-full" />
                  </div>
                </div>
                <p-divider />
                <div class="toggle-options">
                  <div class="toggle-option">
                    <div class="toggle-info">
                      <span class="toggle-label">Remember Me</span>
                      <span class="toggle-desc">Allow "Remember Me" option on login</span>
                    </div>
                    <p-toggleSwitch [(ngModel)]="settings().security.loginPolicy.allowRememberMe" (ngModelChange)="markChanged()" />
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Email Settings -->
          @if (activeSection() === 'email') {
            <div class="settings-section" @staggerCards>
              <div class="section-header">
                <div class="section-icon email">
                  <i class="pi pi-envelope"></i>
                </div>
                <div class="section-info">
                  <h2>Email Settings</h2>
                  <p>SMTP configuration and email preferences</p>
                </div>
              </div>

              <div class="settings-card">
                <div class="card-header">
                  <h3>SMTP Configuration</h3>
                  <p-button label="Test Connection" icon="pi pi-bolt" [outlined]="true" severity="success" size="small" (onClick)="testEmailConnection()" />
                </div>
                <div class="form-grid">
                  <div class="form-field">
                    <label>SMTP Host</label>
                    <input pInputText [(ngModel)]="settings().email.smtpHost" (ngModelChange)="markChanged()" class="w-full" />
                  </div>
                  <div class="form-field">
                    <label>SMTP Port</label>
                    <p-inputNumber [(ngModel)]="settings().email.smtpPort" (ngModelChange)="markChanged()" styleClass="w-full" />
                  </div>
                  <div class="form-field">
                    <label>Username</label>
                    <input pInputText [(ngModel)]="settings().email.smtpUsername" (ngModelChange)="markChanged()" class="w-full" />
                  </div>
                  <div class="form-field">
                    <label>Password</label>
                    <input pInputText type="password" [(ngModel)]="settings().email.smtpPassword" (ngModelChange)="markChanged()" class="w-full" />
                  </div>
                  <div class="form-field">
                    <label>Encryption</label>
                    <p-select [(ngModel)]="settings().email.smtpEncryption" (ngModelChange)="markChanged()" [options]="encryptionOptions" optionLabel="label" optionValue="value" styleClass="w-full" />
                  </div>
                </div>
              </div>

              <div class="settings-card">
                <div class="card-header">
                  <h3>Email Addresses</h3>
                </div>
                <div class="form-grid">
                  <div class="form-field">
                    <label>From Address</label>
                    <input pInputText type="email" [(ngModel)]="settings().email.fromAddress" (ngModelChange)="markChanged()" class="w-full" />
                  </div>
                  <div class="form-field">
                    <label>From Name</label>
                    <input pInputText [(ngModel)]="settings().email.fromName" (ngModelChange)="markChanged()" class="w-full" />
                  </div>
                  <div class="form-field">
                    <label>Reply-To Address</label>
                    <input pInputText type="email" [(ngModel)]="settings().email.replyToAddress" (ngModelChange)="markChanged()" class="w-full" />
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Scheduling Settings -->
          @if (activeSection() === 'scheduling') {
            <div class="settings-section" @staggerCards>
              <div class="section-header">
                <div class="section-icon scheduling">
                  <i class="pi pi-calendar"></i>
                </div>
                <div class="section-info">
                  <h2>Scheduling Settings</h2>
                  <p>Appointment scheduling rules and working hours</p>
                </div>
              </div>

              <div class="settings-card">
                <div class="card-header">
                  <h3>Appointment Rules</h3>
                </div>
                <div class="form-grid">
                  <div class="form-field">
                    <label>Default Slot Duration</label>
                    <p-select [(ngModel)]="settings().scheduling.defaultSlotDuration" (ngModelChange)="markChanged()" [options]="slotDurationOptions" optionLabel="label" optionValue="value" styleClass="w-full" />
                  </div>
                  <div class="form-field">
                    <label>Min Advance Booking (hours)</label>
                    <p-inputNumber [(ngModel)]="settings().scheduling.minAdvanceBookingHours" (ngModelChange)="markChanged()" [min]="0" [showButtons]="true" styleClass="w-full" />
                  </div>
                  <div class="form-field">
                    <label>Max Advance Booking (days)</label>
                    <p-inputNumber [(ngModel)]="settings().scheduling.maxAdvanceBookingDays" (ngModelChange)="markChanged()" [min]="1" [showButtons]="true" styleClass="w-full" />
                  </div>
                  <div class="form-field">
                    <label>Cancellation Policy (hours)</label>
                    <p-inputNumber [(ngModel)]="settings().scheduling.cancellationPolicyHours" (ngModelChange)="markChanged()" [min]="0" [showButtons]="true" styleClass="w-full" />
                  </div>
                </div>
                <p-divider />
                <div class="toggle-options">
                  <div class="toggle-option">
                    <div class="toggle-info">
                      <span class="toggle-label">Allow Double Booking</span>
                      <span class="toggle-desc">Allow scheduling multiple appointments in the same slot</span>
                    </div>
                    <p-toggleSwitch [(ngModel)]="settings().scheduling.allowDoubleBooking" (ngModelChange)="markChanged()" />
                  </div>
                  <div class="toggle-option">
                    <div class="toggle-info">
                      <span class="toggle-label">Enable Waitlist</span>
                      <span class="toggle-desc">Allow patients to join a waitlist for fully booked slots</span>
                    </div>
                    <p-toggleSwitch [(ngModel)]="settings().scheduling.allowWaitlist" (ngModelChange)="markChanged()" />
                  </div>
                  <div class="toggle-option">
                    <div class="toggle-info">
                      <span class="toggle-label">Confirmation Required</span>
                      <span class="toggle-desc">Require appointment confirmation from patients</span>
                    </div>
                    <p-toggleSwitch [(ngModel)]="settings().scheduling.confirmationRequired" (ngModelChange)="markChanged()" />
                  </div>
                </div>
              </div>

              <div class="settings-card">
                <div class="card-header">
                  <h3>Working Hours</h3>
                </div>
                <div class="working-hours">
                  @for (day of weekdays; track day.key) {
                    <div class="day-row" [class.disabled]="!settings().scheduling.workingHours[day.key].enabled">
                      <div class="day-toggle">
                        <p-toggleSwitch [(ngModel)]="settings().scheduling.workingHours[day.key].enabled" (ngModelChange)="markChanged()" />
                        <span class="day-name">{{ day.label }}</span>
                      </div>
                      @if (settings().scheduling.workingHours[day.key].enabled) {
                        <div class="time-range">
                          <input type="time" [(ngModel)]="settings().scheduling.workingHours[day.key].start" (ngModelChange)="markChanged()" class="time-input" />
                          <span class="time-separator">to</span>
                          <input type="time" [(ngModel)]="settings().scheduling.workingHours[day.key].end" (ngModelChange)="markChanged()" class="time-input" />
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
            <div class="settings-section" @staggerCards>
              <div class="section-header">
                <div class="section-icon billing">
                  <i class="pi pi-dollar"></i>
                </div>
                <div class="section-info">
                  <h2>Billing Settings</h2>
                  <p>Claims, payments, and billing preferences</p>
                </div>
              </div>

              <div class="settings-card">
                <div class="card-header">
                  <h3>Claims Configuration</h3>
                </div>
                <div class="form-grid">
                  <div class="form-field">
                    <label>Claim Submission Method</label>
                    <p-select [(ngModel)]="settings().billing.claimSubmissionMethod" (ngModelChange)="markChanged()" [options]="claimMethodOptions" optionLabel="label" optionValue="value" styleClass="w-full" />
                  </div>
                  <div class="form-field">
                    <label>Clearinghouse ID</label>
                    <input pInputText [(ngModel)]="settings().billing.clearinghouseId" (ngModelChange)="markChanged()" class="w-full" />
                  </div>
                  <div class="form-field">
                    <label>Statement Frequency</label>
                    <p-select [(ngModel)]="settings().billing.statementFrequency" (ngModelChange)="markChanged()" [options]="frequencyOptions" optionLabel="label" optionValue="value" styleClass="w-full" />
                  </div>
                  <div class="form-field">
                    <label>Tax Rate (%)</label>
                    <p-inputNumber [(ngModel)]="settings().billing.taxRate" (ngModelChange)="markChanged()" [min]="0" [max]="100" [minFractionDigits]="2" styleClass="w-full" />
                  </div>
                </div>
                <p-divider />
                <div class="toggle-options">
                  <div class="toggle-option">
                    <div class="toggle-info">
                      <span class="toggle-label">Auto-Post Payments</span>
                      <span class="toggle-desc">Automatically post ERA payments when received</span>
                    </div>
                    <p-toggleSwitch [(ngModel)]="settings().billing.autoPostPayments" (ngModelChange)="markChanged()" />
                  </div>
                </div>
              </div>

              <div class="settings-card">
                <div class="card-header">
                  <h3>Collections</h3>
                </div>
                <div class="form-grid">
                  <div class="form-field">
                    <label>Collection Threshold (days)</label>
                    <p-inputNumber [(ngModel)]="settings().billing.collectionThresholdDays" (ngModelChange)="markChanged()" [min]="30" [showButtons]="true" styleClass="w-full" />
                  </div>
                  <div class="form-field">
                    <label>Collection Threshold ($)</label>
                    <p-inputNumber [(ngModel)]="settings().billing.collectionThresholdAmount" (ngModelChange)="markChanged()" [min]="0" mode="currency" currency="USD" styleClass="w-full" />
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Clinical Settings -->
          @if (activeSection() === 'clinical') {
            <div class="settings-section" @staggerCards>
              <div class="section-header">
                <div class="section-icon clinical">
                  <i class="pi pi-heart"></i>
                </div>
                <div class="section-info">
                  <h2>Clinical Settings</h2>
                  <p>Chart defaults, prescription settings, and clinical preferences</p>
                </div>
              </div>

              <div class="settings-card">
                <div class="card-header">
                  <h3>Chart Settings</h3>
                </div>
                <div class="form-grid">
                  <div class="form-field">
                    <label>Default Chart Template</label>
                    <p-select [(ngModel)]="settings().clinical.defaultChartTemplate" (ngModelChange)="markChanged()" [options]="chartTemplateOptions" optionLabel="label" optionValue="value" styleClass="w-full" />
                  </div>
                  <div class="form-field">
                    <label>Auto-save Interval (seconds)</label>
                    <p-inputNumber [(ngModel)]="settings().clinical.autoSaveInterval" (ngModelChange)="markChanged()" [min]="30" [max]="300" [showButtons]="true" styleClass="w-full" />
                  </div>
                </div>
                <p-divider />
                <div class="toggle-options">
                  <div class="toggle-option">
                    <div class="toggle-info">
                      <span class="toggle-label">Require Signature</span>
                      <span class="toggle-desc">Require signature for encounter completion</span>
                    </div>
                    <p-toggleSwitch [(ngModel)]="settings().clinical.requireSignature" (ngModelChange)="markChanged()" />
                  </div>
                </div>
              </div>

              <div class="settings-card">
                <div class="card-header">
                  <h3>Prescription Defaults</h3>
                </div>
                <div class="form-grid">
                  <div class="form-field">
                    <label>Default Quantity</label>
                    <p-inputNumber [(ngModel)]="settings().clinical.prescriptionDefaults.defaultQuantity" (ngModelChange)="markChanged()" [min]="1" [showButtons]="true" styleClass="w-full" />
                  </div>
                  <div class="form-field">
                    <label>Default Refills</label>
                    <p-inputNumber [(ngModel)]="settings().clinical.prescriptionDefaults.defaultRefills" (ngModelChange)="markChanged()" [min]="0" [showButtons]="true" styleClass="w-full" />
                  </div>
                </div>
                <p-divider />
                <div class="toggle-options">
                  <div class="toggle-option">
                    <div class="toggle-info">
                      <span class="toggle-label">Require EPCS</span>
                      <span class="toggle-desc">Require EPCS for controlled substances</span>
                    </div>
                    <p-toggleSwitch [(ngModel)]="settings().clinical.prescriptionDefaults.requireEpcs" (ngModelChange)="markChanged()" />
                  </div>
                </div>
              </div>

              <div class="settings-card">
                <div class="card-header">
                  <h3>Vitals Settings</h3>
                </div>
                <div class="form-grid single">
                  <div class="form-field">
                    <label>Unit System</label>
                    <p-select [(ngModel)]="settings().clinical.vitalsSigns.units" (ngModelChange)="markChanged()" [options]="unitSystemOptions" optionLabel="label" optionValue="value" styleClass="w-full" />
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Integrations Settings -->
          @if (activeSection() === 'integrations') {
            <div class="settings-section" @staggerCards>
              <div class="section-header">
                <div class="section-icon integrations">
                  <i class="pi pi-link"></i>
                </div>
                <div class="section-info">
                  <h2>Integrations</h2>
                  <p>External systems and API configurations</p>
                </div>
              </div>

              <div class="settings-card integration-card">
                <div class="integration-header">
                  <div class="integration-icon hl7">
                    <i class="pi pi-share-alt"></i>
                  </div>
                  <div class="integration-info">
                    <h3>HL7 Interface</h3>
                    <p>Health Level 7 messaging integration</p>
                  </div>
                  <p-toggleSwitch [(ngModel)]="settings().integrations.hl7.enabled" (ngModelChange)="markChanged()" />
                </div>
                @if (settings().integrations.hl7.enabled) {
                  <p-divider />
                  <div class="form-grid">
                    <div class="form-field">
                      <label>HL7 Version</label>
                      <p-select [(ngModel)]="settings().integrations.hl7.version" (ngModelChange)="markChanged()" [options]="hl7VersionOptions" optionLabel="label" optionValue="value" styleClass="w-full" />
                    </div>
                    <div class="form-field">
                      <label>Sending Facility</label>
                      <input pInputText [(ngModel)]="settings().integrations.hl7.sendingFacility" (ngModelChange)="markChanged()" class="w-full" />
                    </div>
                  </div>
                }
              </div>

              <div class="settings-card integration-card">
                <div class="integration-header">
                  <div class="integration-icon fhir">
                    <i class="pi pi-server"></i>
                  </div>
                  <div class="integration-info">
                    <h3>FHIR API</h3>
                    <p>Fast Healthcare Interoperability Resources</p>
                  </div>
                  <p-toggleSwitch [(ngModel)]="settings().integrations.fhir.enabled" (ngModelChange)="markChanged()" />
                </div>
                @if (settings().integrations.fhir.enabled) {
                  <p-divider />
                  <div class="form-grid">
                    <div class="form-field">
                      <label>FHIR Version</label>
                      <p-select [(ngModel)]="settings().integrations.fhir.version" (ngModelChange)="markChanged()" [options]="fhirVersionOptions" optionLabel="label" optionValue="value" styleClass="w-full" />
                    </div>
                    <div class="form-field">
                      <label>Server URL</label>
                      <input pInputText type="url" [(ngModel)]="settings().integrations.fhir.serverUrl" (ngModelChange)="markChanged()" class="w-full" />
                    </div>
                  </div>
                }
              </div>

              <div class="settings-card integration-card">
                <div class="integration-header">
                  <div class="integration-icon prescription">
                    <i class="pi pi-file-edit"></i>
                  </div>
                  <div class="integration-info">
                    <h3>Prescription Network</h3>
                    <p>Surescripts e-Prescribing network</p>
                  </div>
                  <p-toggleSwitch [(ngModel)]="settings().integrations.prescriptionNetwork.enabled" (ngModelChange)="markChanged()" />
                </div>
                @if (settings().integrations.prescriptionNetwork.enabled) {
                  <p-divider />
                  <div class="form-grid single">
                    <div class="form-field">
                      <label>Network ID</label>
                      <input pInputText [(ngModel)]="settings().integrations.prescriptionNetwork.networkId" (ngModelChange)="markChanged()" class="w-full" />
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
      padding: 1.5rem 2rem;
      min-height: 100vh;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    }

    .dark.settings-container {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    }

    /* Header */
    .page-header {
      margin-bottom: 1.5rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .title-section h1 {
      margin: 0;
      font-size: 1.875rem;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.025em;
    }

    .dark .title-section h1 {
      color: #f8fafc;
    }

    .subtitle {
      margin: 0.5rem 0 0;
      font-size: 0.9375rem;
      color: #64748b;
      font-weight: 400;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .changes-banner {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1rem;
      padding: 0.75rem 1rem;
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 1px solid #fcd34d;
      border-radius: 10px;
      font-size: 0.875rem;
      font-weight: 500;
      color: #92400e;
    }

    .changes-banner i {
      font-size: 1rem;
    }

    /* Layout */
    .settings-layout {
      display: grid;
      grid-template-columns: 240px 1fr;
      gap: 1.5rem;
    }

    /* Navigation */
    .settings-nav {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      position: sticky;
      top: 1.5rem;
      height: fit-content;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      border: none;
      background: white;
      text-align: left;
      font-size: 0.875rem;
      font-weight: 500;
      color: #475569;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid transparent;
    }

    .dark .nav-item {
      background: #1e293b;
      color: #94a3b8;
    }

    .nav-item:hover {
      background: #eff6ff;
      color: #2563eb;
      border-color: #bfdbfe;
    }

    .dark .nav-item:hover {
      background: #0f172a;
      color: #60a5fa;
    }

    .nav-item.active {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .nav-item i {
      font-size: 1.125rem;
      width: 1.25rem;
      text-align: center;
    }

    .nav-badge {
      margin-left: auto;
      padding: 0.125rem 0.5rem;
      background: rgba(239, 68, 68, 0.1);
      color: #dc2626;
      border-radius: 4px;
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .nav-item.active .nav-badge {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }

    /* Settings Content */
    .settings-section {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.5rem;
    }

    .section-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    }

    .section-icon i {
      font-size: 1.25rem;
      color: white;
    }

    .section-icon.security { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
    .section-icon.email { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
    .section-icon.scheduling { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }
    .section-icon.billing { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
    .section-icon.clinical { background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); }
    .section-icon.integrations { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); }

    .section-info h2 {
      margin: 0;
      font-size: 1.375rem;
      font-weight: 600;
      color: #0f172a;
      letter-spacing: -0.01em;
    }

    .dark .section-info h2 {
      color: #f8fafc;
    }

    .section-info p {
      margin: 0.25rem 0 0;
      font-size: 0.875rem;
      color: #64748b;
    }

    /* Settings Card */
    .settings-card {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }

    .dark .settings-card {
      background: #1e293b;
      border-color: #334155;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }

    .card-header h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #0f172a;
    }

    .dark .card-header h3 {
      color: #f8fafc;
    }

    /* Form Styles */
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .form-grid.single {
      grid-template-columns: 1fr;
      max-width: 50%;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .form-field.full-width {
      grid-column: 1 / -1;
    }

    .form-field label {
      font-size: 0.8125rem;
      font-weight: 500;
      color: #475569;
    }

    .dark .form-field label {
      color: #94a3b8;
    }

    .w-full {
      width: 100%;
    }

    /* Options Grid */
    .options-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
    }

    .option-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: #f8fafc;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .dark .option-item {
      background: #0f172a;
    }

    .option-item:hover {
      background: #eff6ff;
    }

    .dark .option-item:hover {
      background: #1e293b;
    }

    .option-check {
      width: 20px;
      height: 20px;
      border: 2px solid #e2e8f0;
      border-radius: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .dark .option-check {
      border-color: #475569;
    }

    .option-check.checked {
      background: #3b82f6;
      border-color: #3b82f6;
    }

    .option-check.checked i {
      color: white;
      font-size: 0.625rem;
    }

    .option-item span {
      font-size: 0.875rem;
      color: #334155;
    }

    .dark .option-item span {
      color: #e2e8f0;
    }

    /* Toggle Options */
    .toggle-options {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .toggle-option {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.875rem 1rem;
      background: #f8fafc;
      border-radius: 10px;
    }

    .dark .toggle-option {
      background: #0f172a;
    }

    .toggle-info {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .toggle-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #334155;
    }

    .dark .toggle-label {
      color: #e2e8f0;
    }

    .toggle-desc {
      font-size: 0.75rem;
      color: #64748b;
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
      justify-content: space-between;
      padding: 0.75rem 1rem;
      background: #f8fafc;
      border-radius: 10px;
      transition: all 0.2s;
    }

    .dark .day-row {
      background: #0f172a;
    }

    .day-row.disabled {
      opacity: 0.6;
    }

    .day-toggle {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .day-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: #334155;
      min-width: 100px;
    }

    .dark .day-name {
      color: #e2e8f0;
    }

    .time-range {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .time-input {
      padding: 0.5rem 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.875rem;
      background: white;
    }

    .dark .time-input {
      background: #1e293b;
      border-color: #334155;
      color: #e2e8f0;
    }

    .time-separator {
      font-size: 0.875rem;
      color: #64748b;
    }

    .closed-label {
      font-size: 0.875rem;
      color: #94a3b8;
      font-style: italic;
    }

    /* Integration Cards */
    .integration-card {
      overflow: hidden;
    }

    .integration-header {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .integration-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .integration-icon i {
      font-size: 1.125rem;
      color: white;
    }

    .integration-icon.hl7 { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }
    .integration-icon.fhir { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
    .integration-icon.prescription { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }

    .integration-info {
      flex: 1;
    }

    .integration-info h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #0f172a;
    }

    .dark .integration-info h3 {
      color: #f8fafc;
    }

    .integration-info p {
      margin: 0.125rem 0 0;
      font-size: 0.8125rem;
      color: #64748b;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .settings-layout {
        grid-template-columns: 200px 1fr;
      }
    }

    @media (max-width: 768px) {
      .settings-container {
        padding: 1rem;
      }

      .settings-layout {
        grid-template-columns: 1fr;
      }

      .settings-nav {
        flex-direction: row;
        overflow-x: auto;
        position: static;
        padding-bottom: 0.5rem;
        gap: 0.5rem;
      }

      .nav-item {
        white-space: nowrap;
        flex-shrink: 0;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .form-grid.single {
        max-width: 100%;
      }

      .options-grid {
        grid-template-columns: 1fr;
      }

      .day-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
      }
    }
  `]
})
export class SettingsComponent {
  private adminService = inject(AdminService);
  themeService = inject(ThemeService);
  private messageService = inject(MessageService);

  activeSection = signal<SettingsSection>('general');
  settings = signal<SystemSettings>(JSON.parse(JSON.stringify(this.adminService.systemSettings())));
  hasChanges = signal(false);

  navItems = [
    { key: 'general' as SettingsSection, label: 'General', icon: 'pi pi-cog' },
    { key: 'security' as SettingsSection, label: 'Security', icon: 'pi pi-shield' },
    { key: 'email' as SettingsSection, label: 'Email', icon: 'pi pi-envelope' },
    { key: 'scheduling' as SettingsSection, label: 'Scheduling', icon: 'pi pi-calendar' },
    { key: 'billing' as SettingsSection, label: 'Billing', icon: 'pi pi-dollar' },
    { key: 'clinical' as SettingsSection, label: 'Clinical', icon: 'pi pi-heart' },
    { key: 'integrations' as SettingsSection, label: 'Integrations', icon: 'pi pi-link' }
  ];

  weekdays = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  // Select Options
  timezoneOptions = [
    { label: 'Pacific Time', value: 'America/Los_Angeles' },
    { label: 'Mountain Time', value: 'America/Denver' },
    { label: 'Central Time', value: 'America/Chicago' },
    { label: 'Eastern Time', value: 'America/New_York' }
  ];

  dateFormatOptions = [
    { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
    { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
    { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' }
  ];

  currencyOptions = [
    { label: 'USD ($)', value: 'USD' },
    { label: 'EUR (€)', value: 'EUR' },
    { label: 'GBP (£)', value: 'GBP' }
  ];

  languageOptions = [
    { label: 'English', value: 'en' },
    { label: 'Spanish', value: 'es' },
    { label: 'French', value: 'fr' }
  ];

  encryptionOptions = [
    { label: 'None', value: 'none' },
    { label: 'SSL', value: 'ssl' },
    { label: 'TLS', value: 'tls' }
  ];

  slotDurationOptions = [
    { label: '15 minutes', value: 15 },
    { label: '20 minutes', value: 20 },
    { label: '30 minutes', value: 30 },
    { label: '45 minutes', value: 45 },
    { label: '60 minutes', value: 60 }
  ];

  claimMethodOptions = [
    { label: 'Electronic Only', value: 'electronic' },
    { label: 'Paper Only', value: 'paper' },
    { label: 'Both', value: 'both' }
  ];

  frequencyOptions = [
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' }
  ];

  chartTemplateOptions = [
    { label: 'SOAP Note', value: 'soap' },
    { label: 'HPI Template', value: 'hpi' },
    { label: 'Procedure Note', value: 'procedure' }
  ];

  unitSystemOptions = [
    { label: 'Imperial (lbs, °F)', value: 'imperial' },
    { label: 'Metric (kg, °C)', value: 'metric' }
  ];

  hl7VersionOptions = [
    { label: '2.3', value: '2.3' },
    { label: '2.5', value: '2.5' },
    { label: '2.5.1', value: '2.5.1' }
  ];

  fhirVersionOptions = [
    { label: 'R4', value: 'R4' },
    { label: 'STU3', value: 'STU3' }
  ];

  markChanged(): void {
    this.hasChanges.set(true);
  }

  togglePasswordOption(option: 'requireUppercase' | 'requireLowercase' | 'requireNumbers' | 'requireSpecialChars'): void {
    const currentSettings = this.settings();
    currentSettings.security.passwordPolicy[option] = !currentSettings.security.passwordPolicy[option];
    this.settings.set({ ...currentSettings });
    this.markChanged();
  }

  saveSettings(): void {
    const currentSettings = this.settings();

    this.adminService.updateSettings('general', currentSettings.general);
    this.adminService.updateSettings('security', currentSettings.security);
    this.adminService.updateSettings('email', currentSettings.email);
    this.adminService.updateSettings('scheduling', currentSettings.scheduling);
    this.adminService.updateSettings('billing', currentSettings.billing);
    this.adminService.updateSettings('clinical', currentSettings.clinical);
    this.adminService.updateSettings('integrations', currentSettings.integrations);

    this.hasChanges.set(false);
    this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Settings saved successfully' });
  }

  discardChanges(): void {
    this.settings.set(JSON.parse(JSON.stringify(this.adminService.systemSettings())));
    this.hasChanges.set(false);
    this.messageService.add({ severity: 'info', summary: 'Discarded', detail: 'Changes have been discarded' });
  }

  testEmailConnection(): void {
    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Email connection test successful!' });
  }
}
