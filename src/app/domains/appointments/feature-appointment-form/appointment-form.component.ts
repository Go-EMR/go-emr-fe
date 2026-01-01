import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

// PrimeNG Imports
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { InputNumber } from 'primeng/inputnumber';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { Checkbox } from 'primeng/checkbox';
import { AutoComplete, AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { Chip } from 'primeng/chip';
import { Divider } from 'primeng/divider';
import { Toast } from 'primeng/toast';
import { Tooltip } from 'primeng/tooltip';
import { Avatar } from 'primeng/avatar';
import { Tag } from 'primeng/tag';
import { Skeleton } from 'primeng/skeleton';
import { Ripple } from 'primeng/ripple';
import { ToggleButton } from 'primeng/togglebutton';
import { MessageService } from 'primeng/api';

import { AppointmentService } from '../data-access/services/appointment.service';
import { ThemeService } from '../../../core/services/theme.service';
import {
  AppointmentSlot,
  AppointmentType,
  APPOINTMENT_TYPE_CONFIG,
  CreateAppointmentDto
} from '../data-access/models/appointment.model';

interface PatientOption {
  id: string;
  name: string;
  dob?: string;
  mrn?: string;
  photo?: string;
}

interface ProviderOption {
  id: string;
  name: string;
  specialty?: string;
}

interface FacilityOption {
  id: string;
  name: string;
  rooms?: { id: string; name: string }[];
}

interface DurationOption {
  label: string;
  value: number;
}

interface RecurrenceOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-appointment-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    // PrimeNG
    Card,
    Button,
    InputText,
    Textarea,
    InputNumber,
    Select,
    DatePicker,
    Checkbox,
    AutoComplete,
    Chip,
    Divider,
    Toast,
    Tooltip,
    Avatar,
    Tag,
    Skeleton,
    Ripple,
    ToggleButton,
  ],
  providers: [MessageService],
  template: `
    <div class="appointment-form" [class.dark]="themeService.isDarkMode()">
      <p-toast />

      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="breadcrumb">
            <a routerLink="/appointments" class="breadcrumb-link">
              <i class="pi pi-calendar"></i>
              Appointments
            </a>
            <i class="pi pi-chevron-right"></i>
            <span>{{ isEditMode() ? 'Edit' : 'New' }}</span>
          </div>
          <div class="title-section">
            <h1>{{ isEditMode() ? 'Edit Appointment' : 'New Appointment' }}</h1>
            <p class="subtitle">{{ isEditMode() ? 'Update appointment details' : 'Schedule a new appointment' }}</p>
          </div>
        </div>
        <div class="header-actions">
          <p-button
            label="Cancel"
            [outlined]="true"
            severity="secondary"
            routerLink="/appointments"
          />
          <p-button
            [label]="isEditMode() ? 'Save Changes' : 'Schedule Appointment'"
            [icon]="isEditMode() ? 'pi pi-save' : 'pi pi-plus'"
            [loading]="saving()"
            [disabled]="!form.valid"
            (onClick)="onSubmit()"
          />
        </div>
      </header>

      <!-- Form -->
      <form [formGroup]="form" class="form-grid">
        <!-- Patient Selection Card -->
        <p-card styleClass="form-card patient-card">
          <ng-template pTemplate="header">
            <div class="card-header">
              <i class="pi pi-user"></i>
              <h3>Patient</h3>
            </div>
          </ng-template>

          @if (selectedPatient()) {
            <div class="selected-patient">
              <p-avatar
                [label]="getPatientInitials(selectedPatient()!)"
                [image]="selectedPatient()!.photo || ''"
                [style]="{ 'background-color': '#3b82f6', 'color': 'white' }"
                size="large"
                shape="circle"
              />
              <div class="patient-info">
                <span class="patient-name">{{ selectedPatient()!.name }}</span>
                @if (selectedPatient()!.dob) {
                  <span class="patient-meta">DOB: {{ selectedPatient()!.dob }}</span>
                }
                @if (selectedPatient()!.mrn) {
                  <span class="patient-meta">MRN: {{ selectedPatient()!.mrn }}</span>
                }
              </div>
              <p-button
                icon="pi pi-times"
                [rounded]="true"
                [text]="true"
                severity="secondary"
                (onClick)="clearPatient()"
                pTooltip="Remove"
                tooltipPosition="top"
              />
            </div>
          } @else {
            <div class="patient-search">
              <span class="p-input-icon-left w-full">
                <i class="pi pi-search"></i>
                <p-autoComplete
                  [formControl]="patientSearchControl"
                  [suggestions]="filteredPatients()"
                  (completeMethod)="searchPatients($event)"
                  (onSelect)="onPatientSelected($event)"
                  field="name"
                  placeholder="Search patient by name or MRN..."
                  [showEmptyMessage]="true"
                  emptyMessage="No patients found"
                  styleClass="w-full">
                  <ng-template let-patient pTemplate="item">
                    <div class="patient-option">
                      <p-avatar
                        [label]="getPatientInitials(patient)"
                        [style]="{ 'background-color': '#3b82f6', 'color': 'white', 'font-size': '0.75rem' }"
                        shape="circle"
                      />
                      <div class="patient-option-info">
                        <span class="name">{{ patient.name }}</span>
                        @if (patient.mrn) {
                          <span class="mrn">MRN: {{ patient.mrn }}</span>
                        }
                      </div>
                    </div>
                  </ng-template>
                </p-autoComplete>
              </span>
              @if (form.get('patientId')?.invalid && form.get('patientId')?.touched) {
                <small class="p-error">Patient is required</small>
              }
            </div>
          }
        </p-card>

        <!-- Appointment Type Card -->
        <p-card styleClass="form-card type-card">
          <ng-template pTemplate="header">
            <div class="card-header">
              <i class="pi pi-tag"></i>
              <h3>Appointment Type</h3>
            </div>
          </ng-template>

          <div class="type-grid">
            @for (typeConfig of appointmentTypes; track typeConfig.type) {
              <div
                class="type-option"
                [class.selected]="form.get('type')?.value === typeConfig.type"
                (click)="selectType(typeConfig.type)"
                pRipple>
                <div class="type-icon" [style.background]="typeConfig.color + '20'" [style.color]="typeConfig.color">
                  <i [class]="'pi ' + getTypeIcon(typeConfig.type)"></i>
                </div>
                <span class="type-label">{{ typeConfig.label }}</span>
                <span class="type-duration">{{ typeConfig.duration }} min</span>
              </div>
            }
          </div>
        </p-card>

        <!-- Date & Time Card -->
        <p-card styleClass="form-card datetime-card">
          <ng-template pTemplate="header">
            <div class="card-header">
              <i class="pi pi-clock"></i>
              <h3>Date & Time</h3>
            </div>
          </ng-template>

          <div class="datetime-row">
            <div class="field">
              <label for="date">Date</label>
              <p-datepicker
                formControlName="date"
                [minDate]="minDate"
                [showIcon]="true"
                [showButtonBar]="true"
                dateFormat="DD, MM dd, yy"
                inputId="date"
                styleClass="w-full"
              />
              @if (form.get('date')?.invalid && form.get('date')?.touched) {
                <small class="p-error">Date is required</small>
              }
            </div>

            <div class="field">
              <label for="duration">Duration</label>
              <p-select
                formControlName="duration"
                [options]="durationOptions"
                optionLabel="label"
                optionValue="value"
                inputId="duration"
                styleClass="w-full"
              />
            </div>
          </div>

          <!-- Time Slots -->
          @if (form.get('date')?.value && form.get('providerId')?.value) {
            <div class="time-slots-section">
              <h4>Available Time Slots</h4>
              @if (loadingSlots()) {
                <div class="loading-slots">
                  <i class="pi pi-spin pi-spinner"></i>
                  <span>Loading available slots...</span>
                </div>
              } @else if (availableSlots().length === 0) {
                <div class="no-slots">
                  <i class="pi pi-calendar-times"></i>
                  <span>No available slots for this date</span>
                </div>
              } @else {
                <div class="time-slots-grid">
                  @for (slot of availableSlots(); track slot.start) {
                    <button
                      type="button"
                      class="time-slot"
                      [class.selected]="isSlotSelected(slot)"
                      [class.unavailable]="!slot.isAvailable"
                      [disabled]="!slot.isAvailable"
                      (click)="selectSlot(slot)"
                      pRipple>
                      {{ slot.start | date:'h:mm a' }}
                    </button>
                  }
                </div>
              }
            </div>
          } @else {
            <div class="select-date-hint">
              <i class="pi pi-info-circle"></i>
              <span>Select a date and provider to see available time slots</span>
            </div>
          }

          <p-divider />

          <div class="telehealth-toggle">
            <p-checkbox
              formControlName="isTelehealth"
              [binary]="true"
              inputId="telehealth"
            />
            <label for="telehealth" class="telehealth-label">
              <i class="pi pi-video"></i>
              This is a telehealth appointment
            </label>
          </div>
        </p-card>

        <!-- Provider & Location Card -->
        <p-card styleClass="form-card provider-card">
          <ng-template pTemplate="header">
            <div class="card-header">
              <i class="pi pi-map-marker"></i>
              <h3>Provider & Location</h3>
            </div>
          </ng-template>

          <div class="field">
            <label for="provider">Provider *</label>
            <p-select
              formControlName="providerId"
              [options]="providers"
              optionLabel="name"
              optionValue="id"
              placeholder="Select a provider"
              inputId="provider"
              styleClass="w-full">
              <ng-template let-provider pTemplate="item">
                <div class="provider-option">
                  <p-avatar
                    [label]="getProviderInitials(provider)"
                    [style]="{ 'background-color': '#10b981', 'color': 'white', 'font-size': '0.75rem' }"
                    shape="circle"
                  />
                  <span class="provider-name">{{ provider.name }}</span>
                  @if (provider.specialty) {
                    <span class="provider-specialty">{{ provider.specialty }}</span>
                  }
                </div>
              </ng-template>
            </p-select>
            @if (form.get('providerId')?.invalid && form.get('providerId')?.touched) {
              <small class="p-error">Provider is required</small>
            }
          </div>

          <div class="field">
            <label for="facility">Facility</label>
            <p-select
              formControlName="facilityId"
              [options]="facilities"
              optionLabel="name"
              optionValue="id"
              placeholder="Select a facility"
              inputId="facility"
              styleClass="w-full"
            />
          </div>

          @if (selectedFacility()?.rooms?.length) {
            <div class="field">
              <label for="room">Room</label>
              <p-select
                formControlName="roomId"
                [options]="selectedFacility()!.rooms"
                optionLabel="name"
                optionValue="id"
                placeholder="Select a room"
                inputId="room"
                styleClass="w-full"
              />
            </div>
          }
        </p-card>

        <!-- Reason & Notes Card -->
        <p-card styleClass="form-card reason-card">
          <ng-template pTemplate="header">
            <div class="card-header">
              <i class="pi pi-file-edit"></i>
              <h3>Reason & Notes</h3>
            </div>
          </ng-template>

          <div class="field">
            <label for="reason">Reason for Visit</label>
            <input
              pInputText
              formControlName="reasonDescription"
              id="reason"
              placeholder="e.g., Annual checkup, Follow-up visit"
              class="w-full"
            />
          </div>

          <div class="field">
            <label for="complaint">Chief Complaint</label>
            <textarea
              pTextarea
              formControlName="chiefComplaint"
              id="complaint"
              [rows]="2"
              placeholder="Patient's main concern or symptoms..."
              class="w-full"
            ></textarea>
          </div>

          <div class="field">
            <label for="notes">Notes</label>
            <textarea
              pTextarea
              formControlName="notes"
              id="notes"
              [rows]="3"
              placeholder="Additional notes for this appointment..."
              class="w-full"
            ></textarea>
          </div>
        </p-card>

        <!-- Billing Card -->
        <p-card styleClass="form-card billing-card">
          <ng-template pTemplate="header">
            <div class="card-header">
              <i class="pi pi-credit-card"></i>
              <h3>Billing</h3>
            </div>
          </ng-template>

          <div class="field">
            <label for="serviceType">Service Type</label>
            <input
              pInputText
              formControlName="serviceType"
              id="serviceType"
              placeholder="e.g., Office Visit, Consultation"
              class="w-full"
            />
          </div>

          <div class="billing-row">
            <div class="field">
              <label for="copay">Copay Amount</label>
              <p-inputNumber
                formControlName="copayAmount"
                inputId="copay"
                mode="currency"
                currency="USD"
                locale="en-US"
                [minFractionDigits]="2"
                styleClass="w-full"
              />
            </div>

            <div class="field checkbox-field">
              <p-checkbox
                formControlName="insuranceVerified"
                [binary]="true"
                inputId="insurance"
              />
              <label for="insurance">Insurance Verified</label>
            </div>
          </div>
        </p-card>

        <!-- Recurrence Card -->
        <p-card styleClass="form-card recurrence-card">
          <ng-template pTemplate="header">
            <div class="card-header">
              <i class="pi pi-replay"></i>
              <h3>Recurrence</h3>
            </div>
          </ng-template>

          <div class="field checkbox-field">
            <p-checkbox
              formControlName="isRecurring"
              [binary]="true"
              inputId="recurring"
            />
            <label for="recurring">Make this a recurring appointment</label>
          </div>

          @if (form.get('isRecurring')?.value) {
            <div class="recurrence-options">
              <div class="field">
                <label for="pattern">Repeat</label>
                <p-select
                  formControlName="recurrencePattern"
                  [options]="recurrenceOptions"
                  optionLabel="label"
                  optionValue="value"
                  inputId="pattern"
                  styleClass="w-full"
                />
              </div>

              <div class="field">
                <label for="endDate">End Date</label>
                <p-datepicker
                  formControlName="recurrenceEndDate"
                  [minDate]="form.get('date')?.value"
                  [showIcon]="true"
                  dateFormat="mm/dd/yy"
                  inputId="endDate"
                  styleClass="w-full"
                />
              </div>
            </div>
          }
        </p-card>
      </form>

      <!-- Mobile Bottom Actions -->
      <div class="bottom-actions">
        <p-button
          label="Cancel"
          [outlined]="true"
          severity="secondary"
          routerLink="/appointments"
          styleClass="w-full"
        />
        <p-button
          [label]="isEditMode() ? 'Save' : 'Schedule'"
          [loading]="saving()"
          [disabled]="!form.valid"
          (onClick)="onSubmit()"
          styleClass="w-full"
        />
      </div>
    </div>
  `,
  styles: [`
    .appointment-form {
      padding: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
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

    /* Form Grid */
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    :host ::ng-deep .form-card {
      border-radius: 1rem;
    }

    .dark :host ::ng-deep .form-card {
      background: #1e293b;
      border-color: #334155;
    }

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

    /* Field Styles */
    .field {
      margin-bottom: 1rem;
    }

    .field label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .dark .field label {
      color: #e2e8f0;
    }

    .w-full {
      width: 100%;
    }

    /* Patient Selection */
    .selected-patient {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 0.75rem;
    }

    .dark .selected-patient {
      background: #334155;
    }

    .patient-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .patient-name {
      font-weight: 600;
      color: #1e293b;
    }

    .dark .patient-name {
      color: #f1f5f9;
    }

    .patient-meta {
      font-size: 0.8125rem;
      color: #64748b;
    }

    .dark .patient-meta {
      color: #94a3b8;
    }

    .patient-search {
      padding: 0.5rem;
    }

    .patient-option {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0;
    }

    .patient-option-info {
      display: flex;
      flex-direction: column;
    }

    .patient-option-info .name {
      font-weight: 500;
      color: #1e293b;
    }

    .dark .patient-option-info .name {
      color: #f1f5f9;
    }

    .patient-option-info .mrn {
      font-size: 0.75rem;
      color: #64748b;
    }

    /* Appointment Type Grid */
    .type-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 0.75rem;
      padding: 0.5rem;
    }

    .type-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      border: 2px solid #e2e8f0;
      border-radius: 0.75rem;
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;
    }

    .dark .type-option {
      border-color: #334155;
    }

    .type-option:hover {
      border-color: #94a3b8;
    }

    .type-option.selected {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .dark .type-option.selected {
      background: #1e3a8a;
    }

    .type-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .type-icon i {
      font-size: 1.25rem;
    }

    .type-label {
      font-weight: 500;
      font-size: 0.875rem;
      color: #1e293b;
    }

    .dark .type-label {
      color: #f1f5f9;
    }

    .type-duration {
      font-size: 0.75rem;
      color: #64748b;
    }

    .dark .type-duration {
      color: #94a3b8;
    }

    /* DateTime */
    .datetime-row {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1rem;
      padding: 0.5rem;
    }

    .time-slots-section {
      padding: 0.5rem;
    }

    .time-slots-section h4 {
      margin: 0 0 0.75rem;
      font-size: 0.9375rem;
      font-weight: 500;
      color: #374151;
    }

    .dark .time-slots-section h4 {
      color: #e2e8f0;
    }

    .loading-slots,
    .no-slots,
    .select-date-hint {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 0.5rem;
      color: #64748b;
    }

    .dark .loading-slots,
    .dark .no-slots,
    .dark .select-date-hint {
      background: #334155;
      color: #94a3b8;
    }

    .time-slots-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 0.5rem;
    }

    .time-slot {
      padding: 0.5rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      background: white;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      cursor: pointer;
      transition: all 0.2s;
    }

    .dark .time-slot {
      background: #1e293b;
      border-color: #334155;
      color: #e2e8f0;
    }

    .time-slot:hover:not(:disabled) {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .dark .time-slot:hover:not(:disabled) {
      background: #1e3a8a;
    }

    .time-slot.selected {
      border-color: #3b82f6;
      background: #3b82f6;
      color: white;
    }

    .time-slot.unavailable {
      background: #f1f5f9;
      color: #cbd5e1;
      cursor: not-allowed;
    }

    .dark .time-slot.unavailable {
      background: #0f172a;
      color: #475569;
    }

    .telehealth-toggle {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem;
    }

    .telehealth-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #374151;
      cursor: pointer;
    }

    .dark .telehealth-label {
      color: #e2e8f0;
    }

    .telehealth-label i {
      color: #8b5cf6;
    }

    /* Provider Option */
    .provider-option {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .provider-name {
      font-weight: 500;
      color: #1e293b;
    }

    .dark .provider-name {
      color: #f1f5f9;
    }

    .provider-specialty {
      font-size: 0.8125rem;
      color: #64748b;
    }

    /* Billing */
    .billing-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      align-items: end;
    }

    .checkbox-field {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .checkbox-field label {
      margin-bottom: 0;
      cursor: pointer;
    }

    /* Recurrence */
    .recurrence-options {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }

    .dark .recurrence-options {
      border-top-color: #334155;
    }

    /* Bottom Actions (Mobile) */
    .bottom-actions {
      display: none;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 1rem;
      background: white;
      border-top: 1px solid #e2e8f0;
      gap: 0.75rem;
      z-index: 100;
    }

    .dark .bottom-actions {
      background: #1e293b;
      border-top-color: #334155;
    }

    /* Dark mode inputs */
    .dark :host ::ng-deep .p-inputtext,
    .dark :host ::ng-deep textarea.p-textarea,
    .dark :host ::ng-deep .p-inputnumber-input {
      background: #334155;
      border-color: #475569;
      color: #f1f5f9;
    }

    .dark :host ::ng-deep .p-select {
      background: #334155;
      border-color: #475569;
    }

    .dark :host ::ng-deep .p-select-label {
      color: #f1f5f9;
    }

    .dark :host ::ng-deep .p-datepicker-input {
      background: #334155;
      border-color: #475569;
      color: #f1f5f9;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .form-grid {
        grid-template-columns: 1fr;
      }

      .type-grid {
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      }
    }

    @media (max-width: 768px) {
      .appointment-form {
        padding: 1rem;
        padding-bottom: 100px;
      }

      .page-header {
        flex-direction: column;
        align-items: stretch;
      }

      .header-actions {
        display: none;
      }

      .bottom-actions {
        display: flex;
      }

      .datetime-row,
      .billing-row,
      .recurrence-options {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AppointmentFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly appointmentService = inject(AppointmentService);
  private readonly messageService = inject(MessageService);
  readonly themeService = inject(ThemeService);

  form: FormGroup;
  patientSearchControl = new FormControl('');

  // Signals
  isEditMode = signal(false);
  appointmentId = signal<string | null>(null);
  saving = signal(false);
  loadingSlots = signal(false);
  selectedPatient = signal<PatientOption | null>(null);
  selectedSlot = signal<AppointmentSlot | null>(null);
  filteredPatients = signal<PatientOption[]>([]);
  availableSlots = signal<AppointmentSlot[]>([]);

  // Static Data
  appointmentTypes = APPOINTMENT_TYPE_CONFIG;
  minDate = new Date();

  durationOptions: DurationOption[] = [
    { label: '15 minutes', value: 15 },
    { label: '20 minutes', value: 20 },
    { label: '30 minutes', value: 30 },
    { label: '45 minutes', value: 45 },
    { label: '60 minutes', value: 60 },
    { label: '90 minutes', value: 90 },
  ];

  recurrenceOptions: RecurrenceOption[] = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Bi-weekly', value: 'biweekly' },
    { label: 'Monthly', value: 'monthly' },
  ];

  providers: ProviderOption[] = [
    { id: 'prov-001', name: 'Dr. Emily Chen', specialty: 'Family Medicine' },
    { id: 'prov-002', name: 'Dr. James Wilson', specialty: 'Internal Medicine' },
    { id: 'prov-003', name: 'Dr. Maria Garcia', specialty: 'Pediatrics' },
  ];

  facilities: FacilityOption[] = [
    { id: 'fac-001', name: 'Main Clinic', rooms: [
      { id: 'room-1', name: 'Exam Room 1' },
      { id: 'room-2', name: 'Exam Room 2' },
      { id: 'room-3', name: 'Exam Room 3' },
    ]},
    { id: 'fac-002', name: 'Downtown Office', rooms: [
      { id: 'room-4', name: 'Suite A' },
      { id: 'room-5', name: 'Suite B' },
    ]},
  ];

  mockPatients: PatientOption[] = [
    { id: 'pat-001', name: 'John Smith', dob: '1985-03-15', mrn: 'MRN-001' },
    { id: 'pat-002', name: 'Sarah Johnson', dob: '1990-07-22', mrn: 'MRN-002' },
    { id: 'pat-003', name: 'Michael Brown', dob: '1978-11-08', mrn: 'MRN-003' },
    { id: 'pat-004', name: 'Emily Davis', dob: '1995-01-30', mrn: 'MRN-004' },
    { id: 'pat-005', name: 'Robert Wilson', dob: '1982-09-12', mrn: 'MRN-005' },
  ];

  selectedFacility = computed(() => {
    const facilityId = this.form?.get('facilityId')?.value;
    return this.facilities.find(f => f.id === facilityId) || null;
  });

  constructor() {
    this.form = this.fb.group({
      patientId: ['', Validators.required],
      type: ['routine', Validators.required],
      date: [null, Validators.required],
      duration: [30, Validators.required],
      providerId: ['', Validators.required],
      facilityId: [''],
      roomId: [''],
      isTelehealth: [false],
      reasonDescription: [''],
      chiefComplaint: [''],
      notes: [''],
      serviceType: [''],
      copayAmount: [null],
      insuranceVerified: [false],
      isRecurring: [false],
      recurrencePattern: ['weekly'],
      recurrenceEndDate: [null],
    });

    // Load slots when date, provider, or duration changes
    effect(() => {
      const date = this.form.get('date')?.value;
      const providerId = this.form.get('providerId')?.value;
      const duration = this.form.get('duration')?.value;

      if (date && providerId) {
        this.loadAvailableSlots(date, providerId, duration);
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const patientId = this.route.snapshot.queryParamMap.get('patientId');

    if (id) {
      this.isEditMode.set(true);
      this.appointmentId.set(id);
      this.loadAppointment(id);
    } else if (patientId) {
      const patient = this.mockPatients.find(p => p.id === patientId);
      if (patient) {
        this.selectedPatient.set(patient);
        this.form.patchValue({ patientId: patient.id });
      }
    }
  }

  private loadAppointment(id: string): void {
    this.appointmentService.getAppointment(id).subscribe({
      next: (appt) => {
        this.form.patchValue({
          patientId: appt.patientId,
          type: appt.appointmentType,
          date: new Date(appt.start),
          duration: appt.duration,
          providerId: appt.providerId,
          facilityId: appt.facilityId,
          roomId: appt.roomId,
          isTelehealth: appt.isTelehealth,
          reasonDescription: appt.reasonDescription,
          chiefComplaint: appt.chiefComplaint,
          notes: appt.notes,
          serviceType: appt.serviceType,
          copayAmount: appt.copayAmount,
          insuranceVerified: appt.insuranceVerified,
          isRecurring: appt.isRecurring,
          recurrencePattern: appt.recurrencePattern,
          recurrenceEndDate: appt.recurrenceEndDate ? new Date(appt.recurrenceEndDate) : null,
        });

        this.selectedPatient.set({
          id: appt.patientId,
          name: appt.patientName,
          photo: appt.patientPhoto,
        });

        this.selectedSlot.set({
          start: new Date(appt.start),
          end: new Date(appt.end),
          duration: appt.duration,
          providerId: appt.providerId,
          providerName: appt.providerName,
          facilityId: appt.facilityId || '',
          roomId: appt.roomId,
          isAvailable: true,
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load appointment'
        });
        this.router.navigate(['/appointments']);
      }
    });
  }

  private loadAvailableSlots(date: Date, providerId: string, duration: number): void {
    this.loadingSlots.set(true);
    this.appointmentService.getAvailableSlots(date, providerId, duration).subscribe({
      next: (slots) => {
        this.availableSlots.set(slots);
        this.loadingSlots.set(false);
      },
      error: () => {
        this.availableSlots.set([]);
        this.loadingSlots.set(false);
      }
    });
  }

  searchPatients(event: AutoCompleteCompleteEvent): void {
    const query = event.query.toLowerCase();
    const filtered = this.mockPatients.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.mrn?.toLowerCase().includes(query)
    );
    this.filteredPatients.set(filtered);
  }

  onPatientSelected(event: AutoCompleteSelectEvent): void {
    const patient = event.value as PatientOption;
    this.selectedPatient.set(patient);
    this.form.patchValue({ patientId: patient.id });
    this.patientSearchControl.setValue('');
  }

  clearPatient(): void {
    this.selectedPatient.set(null);
    this.form.patchValue({ patientId: '' });
  }

  selectType(type: AppointmentType): void {
    this.form.patchValue({ type });

    const typeConfig = APPOINTMENT_TYPE_CONFIG.find(t => t.type === type);
    if (typeConfig) {
      this.form.patchValue({ duration: typeConfig.duration });
    }
  }

  selectSlot(slot: AppointmentSlot): void {
    if (slot.isAvailable) {
      this.selectedSlot.set(slot);
    }
  }

  isSlotSelected(slot: AppointmentSlot): boolean {
    const selected = this.selectedSlot();
    if (!selected) return false;
    return new Date(selected.start).getTime() === new Date(slot.start).getTime();
  }

  getPatientInitials(patient: PatientOption): string {
    return patient.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getProviderInitials(provider: ProviderOption): string {
    return provider.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getTypeIcon(type: string): string {
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

  onSubmit(): void {
    if (!this.form.valid || !this.selectedSlot()) {
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });

      if (!this.selectedSlot()) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Required',
          detail: 'Please select a time slot'
        });
      }
      return;
    }

    this.saving.set(true);
    const slot = this.selectedSlot()!;
    const formValue = this.form.value;

    const appointmentData: CreateAppointmentDto = {
      patientId: formValue.patientId,
      providerId: formValue.providerId,
      facilityId: formValue.facilityId || '',
      appointmentType: formValue.type,
      start: slot.start,
      duration: formValue.duration,
      reasonDescription: formValue.reasonDescription || '',
      chiefComplaint: formValue.chiefComplaint || undefined,
      notes: formValue.notes || undefined,
      roomId: formValue.roomId || undefined,
      isTelehealth: formValue.isTelehealth,
      isRecurring: formValue.isRecurring,
      recurrencePattern: formValue.isRecurring ? formValue.recurrencePattern : undefined,
      recurrenceEndDate: formValue.isRecurring ? formValue.recurrenceEndDate : undefined,
    };

    const operation = this.isEditMode()
      ? this.appointmentService.updateAppointment(this.appointmentId()!, appointmentData)
      : this.appointmentService.createAppointment(appointmentData);

    operation.subscribe({
      next: (appt) => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: this.isEditMode() ? 'Appointment updated successfully' : 'Appointment scheduled successfully'
        });
        this.router.navigate(['/appointments', appt.id]);
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to save appointment'
        });
      }
    });
  }
}
