import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged, switchMap, of, Observable } from 'rxjs';

import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { AvatarComponent } from '../../../shared/ui/avatar/avatar.component';
import { AppointmentService } from '../data-access/services/appointment.service';
import { 
  Appointment, 
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

@Component({
  selector: 'app-appointment-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatDividerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
    AvatarComponent,
  ],
  template: `
    <div class="appointment-form-container">
      <app-page-header
        [title]="isEditMode() ? 'Edit Appointment' : 'New Appointment'"
        [subtitle]="isEditMode() ? 'Update appointment details' : 'Schedule a new appointment'"
        icon="event"
        [breadcrumbs]="breadcrumbs()"
        [showDivider]="false"
      >
        <div class="header-actions" actions>
          <button mat-stroked-button routerLink="/appointments">
            Cancel
          </button>
          <button 
            mat-flat-button 
            color="primary" 
            (click)="onSubmit()"
            [disabled]="!form.valid || saving()"
          >
            @if (saving()) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              <mat-icon>{{ isEditMode() ? 'save' : 'add' }}</mat-icon>
              {{ isEditMode() ? 'Save Changes' : 'Schedule Appointment' }}
            }
          </button>
        </div>
      </app-page-header>

      <form [formGroup]="form" class="form-grid">
        <!-- Patient Selection Card -->
        <mat-card class="form-card patient-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>person</mat-icon>
              Patient
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (selectedPatient()) {
              <div class="selected-patient">
                <app-avatar 
                  [name]="selectedPatient()!.name"
                  [imageUrl]="selectedPatient()!.photo || ''"
                  size="lg"
                ></app-avatar>
                <div class="patient-info">
                  <span class="patient-name">{{ selectedPatient()!.name }}</span>
                  @if (selectedPatient()!.dob) {
                    <span class="patient-dob">DOB: {{ selectedPatient()!.dob }}</span>
                  }
                  @if (selectedPatient()!.mrn) {
                    <span class="patient-mrn">MRN: {{ selectedPatient()!.mrn }}</span>
                  }
                </div>
                <button mat-icon-button (click)="clearPatient()" class="clear-button">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            } @else {
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Search Patient</mat-label>
                <input 
                  matInput 
                  [formControl]="patientSearchControl"
                  [matAutocomplete]="patientAuto"
                  placeholder="Type patient name or MRN..."
                >
                <mat-icon matPrefix>search</mat-icon>
                <mat-autocomplete 
                  #patientAuto="matAutocomplete" 
                  (optionSelected)="onPatientSelected($event)"
                >
                  @for (patient of filteredPatients(); track patient.id) {
                    <mat-option [value]="patient">
                      <div class="patient-option">
                        <app-avatar [name]="patient.name" size="sm"></app-avatar>
                        <div class="patient-option-info">
                          <span class="name">{{ patient.name }}</span>
                          @if (patient.mrn) {
                            <span class="mrn">MRN: {{ patient.mrn }}</span>
                          }
                        </div>
                      </div>
                    </mat-option>
                  }
                </mat-autocomplete>
                @if (form.get('patientId')?.hasError('required') && form.get('patientId')?.touched) {
                  <mat-error>Patient is required</mat-error>
                }
              </mat-form-field>
            }
          </mat-card-content>
        </mat-card>

        <!-- Appointment Type Card -->
        <mat-card class="form-card type-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>category</mat-icon>
              Appointment Type
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="type-grid">
              @for (typeConfig of appointmentTypes; track typeConfig.type) {
                <div 
                  class="type-option"
                  [class.selected]="form.get('type')?.value === typeConfig.type"
                  (click)="selectType(typeConfig.type)"
                >
                  <div class="type-icon" [style.background-color]="typeConfig.color + '20'" [style.color]="typeConfig.color">
                    <mat-icon>{{ typeConfig.icon }}</mat-icon>
                  </div>
                  <span class="type-label">{{ typeConfig.label }}</span>
                  <span class="type-duration">{{ typeConfig.defaultDuration }} min</span>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Date & Time Card -->
        <mat-card class="form-card datetime-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>schedule</mat-icon>
              Date & Time
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="datetime-row">
              <mat-form-field appearance="outline">
                <mat-label>Date</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="date" [min]="minDate">
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
                @if (form.get('date')?.hasError('required')) {
                  <mat-error>Date is required</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Duration</mat-label>
                <mat-select formControlName="duration">
                  @for (duration of durations; track duration) {
                    <mat-option [value]="duration">{{ duration }} minutes</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>

            @if (form.get('date')?.value && form.get('providerId')?.value) {
              <div class="time-slots-section">
                <h4>Available Time Slots</h4>
                @if (loadingSlots()) {
                  <div class="loading-slots">
                    <mat-spinner diameter="24"></mat-spinner>
                    <span>Loading available slots...</span>
                  </div>
                } @else if (availableSlots().length === 0) {
                  <div class="no-slots">
                    <mat-icon>event_busy</mat-icon>
                    <span>No available slots for this date</span>
                  </div>
                } @else {
                  <div class="time-slots-grid">
                    @for (slot of availableSlots(); track slot.start) {
                      <button 
                        type="button"
                        class="time-slot"
                        [class.selected]="selectedSlot()?.start === slot.start"
                        [class.unavailable]="!slot.available"
                        [disabled]="!slot.available"
                        (click)="selectSlot(slot)"
                      >
                        {{ slot.start | date:'h:mm a' }}
                      </button>
                    }
                  </div>
                }
              </div>
            } @else {
              <div class="select-date-hint">
                <mat-icon>info</mat-icon>
                <span>Select a date and provider to see available time slots</span>
              </div>
            }

            <mat-divider></mat-divider>

            <mat-checkbox formControlName="isTelehealth" class="telehealth-checkbox">
              <mat-icon>videocam</mat-icon>
              This is a telehealth appointment
            </mat-checkbox>
          </mat-card-content>
        </mat-card>

        <!-- Provider & Location Card -->
        <mat-card class="form-card provider-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>location_on</mat-icon>
              Provider & Location
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Provider</mat-label>
              <mat-select formControlName="providerId">
                @for (provider of providers; track provider.id) {
                  <mat-option [value]="provider.id">
                    <div class="provider-option">
                      <app-avatar [name]="provider.name" size="xs"></app-avatar>
                      <span>{{ provider.name }}</span>
                      @if (provider.specialty) {
                        <span class="specialty">- {{ provider.specialty }}</span>
                      }
                    </div>
                  </mat-option>
                }
              </mat-select>
              @if (form.get('providerId')?.hasError('required')) {
                <mat-error>Provider is required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Facility</mat-label>
              <mat-select formControlName="facilityId">
                @for (facility of facilities; track facility.id) {
                  <mat-option [value]="facility.id">{{ facility.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            @if (selectedFacility()?.rooms?.length) {
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Room</mat-label>
                <mat-select formControlName="roomId">
                  @for (room of selectedFacility()!.rooms; track room.id) {
                    <mat-option [value]="room.id">{{ room.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            }
          </mat-card-content>
        </mat-card>

        <!-- Reason & Notes Card -->
        <mat-card class="form-card reason-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>description</mat-icon>
              Reason & Notes
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Reason for Visit</mat-label>
              <input matInput formControlName="reasonDescription" placeholder="e.g., Annual checkup, Follow-up visit">
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Chief Complaint</mat-label>
              <textarea 
                matInput 
                formControlName="chiefComplaint" 
                rows="2"
                placeholder="Patient's main concern or symptoms..."
              ></textarea>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Notes</mat-label>
              <textarea 
                matInput 
                formControlName="notes" 
                rows="3"
                placeholder="Additional notes for this appointment..."
              ></textarea>
            </mat-form-field>
          </mat-card-content>
        </mat-card>

        <!-- Billing Card -->
        <mat-card class="form-card billing-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>payments</mat-icon>
              Billing
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Service Type</mat-label>
              <input matInput formControlName="serviceType" placeholder="e.g., Office Visit, Consultation">
            </mat-form-field>

            <div class="billing-row">
              <mat-form-field appearance="outline">
                <mat-label>Copay Amount</mat-label>
                <span matPrefix>$&nbsp;</span>
                <input matInput type="number" formControlName="copayAmount" min="0" step="0.01">
              </mat-form-field>

              <mat-checkbox formControlName="insuranceVerified">
                Insurance Verified
              </mat-checkbox>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Recurrence Card -->
        <mat-card class="form-card recurrence-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>repeat</mat-icon>
              Recurrence
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-checkbox formControlName="isRecurring" class="recurring-checkbox">
              Make this a recurring appointment
            </mat-checkbox>

            @if (form.get('isRecurring')?.value) {
              <div class="recurrence-options">
                <mat-form-field appearance="outline">
                  <mat-label>Repeat</mat-label>
                  <mat-select formControlName="recurrencePattern">
                    <mat-option value="daily">Daily</mat-option>
                    <mat-option value="weekly">Weekly</mat-option>
                    <mat-option value="biweekly">Bi-weekly</mat-option>
                    <mat-option value="monthly">Monthly</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>End Date</mat-label>
                  <input matInput [matDatepicker]="endPicker" formControlName="recurrenceEndDate" [min]="form.get('date')?.value">
                  <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
                  <mat-datepicker #endPicker></mat-datepicker>
                </mat-form-field>
              </div>
            }
          </mat-card-content>
        </mat-card>
      </form>

      <!-- Bottom Actions (Mobile) -->
      <div class="bottom-actions">
        <button mat-stroked-button routerLink="/appointments" class="full-width">
          Cancel
        </button>
        <button 
          mat-flat-button 
          color="primary" 
          (click)="onSubmit()"
          [disabled]="!form.valid || saving()"
          class="full-width"
        >
          @if (saving()) {
            <mat-spinner diameter="20"></mat-spinner>
          } @else {
            {{ isEditMode() ? 'Save Changes' : 'Schedule Appointment' }}
          }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .appointment-form-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header-actions {
      display: flex;
      gap: 12px;

      mat-spinner {
        margin-right: 8px;
      }
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
    }

    .form-card {
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

    .full-width {
      width: 100%;
    }

    /* Patient Card */
    .selected-patient {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: #f9fafb;
      border-radius: 8px;
      position: relative;
    }

    .patient-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }

    .patient-name {
      font-weight: 600;
      font-size: 16px;
      color: #111827;
    }

    .patient-dob, .patient-mrn {
      font-size: 13px;
      color: #6b7280;
    }

    .clear-button {
      position: absolute;
      top: 8px;
      right: 8px;
    }

    .patient-option {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .patient-option-info {
      display: flex;
      flex-direction: column;

      .name {
        font-weight: 500;
      }

      .mrn {
        font-size: 12px;
        color: #6b7280;
      }
    }

    /* Type Card */
    .type-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 12px;
    }

    .type-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 16px 12px;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        border-color: #d1d5db;
        background: #f9fafb;
      }

      &.selected {
        border-color: #2563eb;
        background: #eff6ff;
      }
    }

    .type-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }

    .type-label {
      font-weight: 500;
      font-size: 13px;
      color: #374151;
      text-align: center;
    }

    .type-duration {
      font-size: 12px;
      color: #9ca3af;
    }

    /* DateTime Card */
    .datetime-row {
      display: flex;
      gap: 16px;

      mat-form-field {
        flex: 1;
      }
    }

    .time-slots-section {
      margin-top: 20px;

      h4 {
        font-size: 14px;
        font-weight: 600;
        color: #374151;
        margin: 0 0 12px;
      }
    }

    .time-slots-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
      gap: 8px;
    }

    .time-slot {
      padding: 10px 8px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: white;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover:not(:disabled) {
        border-color: #2563eb;
        background: #eff6ff;
      }

      &.selected {
        border-color: #2563eb;
        background: #2563eb;
        color: white;
      }

      &.unavailable {
        background: #f3f4f6;
        color: #9ca3af;
        cursor: not-allowed;
        text-decoration: line-through;
      }
    }

    .loading-slots, .no-slots {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 24px;
      background: #f9fafb;
      border-radius: 8px;
      color: #6b7280;
    }

    .select-date-hint {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      background: #fef3c7;
      border-radius: 8px;
      color: #92400e;
      margin-top: 16px;

      mat-icon {
        font-size: 20px;
      }
    }

    .telehealth-checkbox {
      margin-top: 16px;

      mat-icon {
        margin-right: 4px;
        font-size: 18px;
        vertical-align: middle;
      }
    }

    /* Provider Card */
    .provider-option {
      display: flex;
      align-items: center;
      gap: 8px;

      .specialty {
        color: #6b7280;
        font-size: 13px;
      }
    }

    /* Billing Card */
    .billing-row {
      display: flex;
      align-items: center;
      gap: 24px;

      mat-form-field {
        flex: 1;
      }
    }

    /* Recurrence Card */
    .recurring-checkbox {
      margin-bottom: 16px;
    }

    .recurrence-options {
      display: flex;
      gap: 16px;
      margin-top: 16px;

      mat-form-field {
        flex: 1;
      }
    }

    /* Bottom Actions (Mobile) */
    .bottom-actions {
      display: none;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 16px;
      background: white;
      border-top: 1px solid #e5e7eb;
      gap: 12px;
      z-index: 100;
    }

    @media (max-width: 768px) {
      .appointment-form-container {
        padding: 16px;
        padding-bottom: 100px;
      }

      .header-actions {
        display: none;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .datetime-row {
        flex-direction: column;
      }

      .billing-row {
        flex-direction: column;
        align-items: flex-start;
      }

      .recurrence-options {
        flex-direction: column;
      }

      .type-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .bottom-actions {
        display: flex;
      }
    }
  `]
})
export class AppointmentFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly appointmentService = inject(AppointmentService);

  // Form
  form: FormGroup;
  patientSearchControl = this.fb.control('');

  // State
  isEditMode = signal(false);
  appointmentId = signal<string | null>(null);
  saving = signal(false);
  loadingSlots = signal(false);

  // Selections
  selectedPatient = signal<PatientOption | null>(null);
  selectedSlot = signal<AppointmentSlot | null>(null);
  availableSlots = signal<AppointmentSlot[]>([]);
  filteredPatients = signal<PatientOption[]>([]);

  // Static data
  appointmentTypes = APPOINTMENT_TYPE_CONFIG;
  durations = [15, 20, 30, 45, 60, 90, 120];
  minDate = new Date();

  // Mock data for demo
  providers: ProviderOption[] = [
    { id: 'prov-1', name: 'Dr. Sarah Johnson', specialty: 'Family Medicine' },
    { id: 'prov-2', name: 'Dr. Michael Chen', specialty: 'Internal Medicine' },
    { id: 'prov-3', name: 'Dr. Emily Williams', specialty: 'Pediatrics' },
    { id: 'prov-4', name: 'Dr. James Wilson', specialty: 'Cardiology' },
  ];

  facilities: FacilityOption[] = [
    { 
      id: 'fac-1', 
      name: 'Main Clinic',
      rooms: [
        { id: 'room-1', name: 'Exam Room 1' },
        { id: 'room-2', name: 'Exam Room 2' },
        { id: 'room-3', name: 'Exam Room 3' },
        { id: 'room-4', name: 'Procedure Room' },
      ]
    },
    { 
      id: 'fac-2', 
      name: 'Downtown Office',
      rooms: [
        { id: 'room-5', name: 'Exam Room A' },
        { id: 'room-6', name: 'Exam Room B' },
      ]
    },
    { id: 'fac-3', name: 'Telehealth' },
  ];

  mockPatients: PatientOption[] = [
    { id: 'pat-1', name: 'John Smith', dob: '1985-03-15', mrn: 'MRN-001', photo: '' },
    { id: 'pat-2', name: 'Maria Garcia', dob: '1990-07-22', mrn: 'MRN-002', photo: '' },
    { id: 'pat-3', name: 'Robert Johnson', dob: '1978-11-08', mrn: 'MRN-003', photo: '' },
    { id: 'pat-4', name: 'Sarah Williams', dob: '1995-01-30', mrn: 'MRN-004', photo: '' },
    { id: 'pat-5', name: 'Michael Brown', dob: '1982-09-12', mrn: 'MRN-005', photo: '' },
    { id: 'pat-6', name: 'Jennifer Davis', dob: '1988-05-25', mrn: 'MRN-006', photo: '' },
  ];

  breadcrumbs = computed(() => [
    { label: 'Appointments', route: '/appointments' },
    { label: this.isEditMode() ? 'Edit' : 'New Appointment' }
  ]);

  selectedFacility = computed(() => {
    const facilityId = this.form.get('facilityId')?.value;
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

    // Setup patient search
    this.patientSearchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      if (typeof value === 'string' && value.length > 1) {
        this.searchPatients(value);
      } else {
        this.filteredPatients.set([]);
      }
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
      // Pre-fill patient if provided
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
          patientId: appt.patient?.id || appt.patientId,
          type: appt.type || appt.appointmentType,
          date: new Date(appt.start),
          duration: appt.duration,
          providerId: appt.provider?.id || appt.providerId,
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
          id: appt.patient?.id || appt.patientId,
          name: appt.patient?.name || appt.patientName,
          photo: appt.patient?.photo || appt.patientPhoto,
        });

        const endTime = appt.end ? new Date(appt.end) : new Date(new Date(appt.start).getTime() + appt.duration * 60000);
        this.selectedSlot.set({
          start: new Date(appt.start),
          end: endTime,
          duration: appt.duration,
          providerId: appt.provider?.id || appt.providerId,
          providerName: appt.provider?.name || appt.providerName,
          facilityId: appt.facilityId || '',
          roomId: appt.roomId,
          isAvailable: true,
          available: true,
        });
      },
      error: () => {
        this.snackBar.open('Failed to load appointment', 'Close', { duration: 3000 });
        this.router.navigate(['/appointments']);
      }
    });
  }

  private searchPatients(query: string): void {
    // Simulate API search
    const filtered = this.mockPatients.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.mrn?.toLowerCase().includes(query.toLowerCase())
    );
    this.filteredPatients.set(filtered);
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

  onPatientSelected(event: any): void {
    const patient = event.option.value as PatientOption;
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
    
    // Update duration to default for this type
    const typeConfig = APPOINTMENT_TYPE_CONFIG.find(t => t.type === type);
    if (typeConfig) {
      this.form.patchValue({ duration: typeConfig.defaultDuration });
    }
  }

  selectSlot(slot: AppointmentSlot): void {
    if (slot.available) {
      this.selectedSlot.set(slot);
    }
  }

  onSubmit(): void {
    if (!this.form.valid || !this.selectedSlot()) {
      // Mark all fields as touched to show errors
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });

      if (!this.selectedSlot()) {
        this.snackBar.open('Please select a time slot', 'Close', { duration: 3000 });
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
      type: formValue.type,
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
        this.snackBar.open(
          this.isEditMode() ? 'Appointment updated successfully' : 'Appointment scheduled successfully',
          'Close',
          { duration: 3000 }
        );
        this.router.navigate(['/appointments', appt.id]);
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Failed to save appointment', 'Close', { duration: 3000 });
      }
    });
  }
}
