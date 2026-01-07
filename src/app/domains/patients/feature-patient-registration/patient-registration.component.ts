import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputMaskModule } from 'primeng/inputmask';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { StepperModule } from 'primeng/stepper';
import { DividerModule } from 'primeng/divider';
import { CheckboxModule } from 'primeng/checkbox';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TooltipModule } from 'primeng/tooltip';
import { MessageModule } from 'primeng/message';
import { PanelModule } from 'primeng/panel';
import { AvatarModule } from 'primeng/avatar';
import { FileUploadModule } from 'primeng/fileupload';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ChipModule } from 'primeng/chip';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { MessageService, ConfirmationService } from 'primeng/api';

import { PatientService } from '../data-access/services/patient.service';
import { CreatePatientDto, Gender, ContactMethod, Patient, PatientSearchParams } from '../data-access/models/patient.model';
import { ThemeService } from '../../../core/services/theme.service';

interface RelationshipType {
  label: string;
  value: string;
  icon: string;
}

interface FamilyMember {
  patientId: string;
  patientName: string;
  relationship: string;
  mrn: string;
}

interface Clinic {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
}

@Component({
  selector: 'app-patient-registration',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    // PrimeNG
    CardModule,
    ButtonModule,
    InputTextModule,
    InputMaskModule,
    SelectModule,
    DatePickerModule,
    TextareaModule,
    StepperModule,
    DividerModule,
    CheckboxModule,
    RadioButtonModule,
    TooltipModule,
    MessageModule,
    PanelModule,
    AvatarModule,
    FileUploadModule,
    AutoCompleteModule,
    ChipModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    DialogModule,
    TableModule,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast />
    <p-confirmDialog />
    
    <div class="patient-registration" [class.dark]="themeService.isDarkMode()">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="title-section">
            <p-button 
              icon="pi pi-arrow-left" 
              [rounded]="true" 
              [text]="true"
              severity="secondary"
              routerLink="/patients"
              pTooltip="Back to Patients"
            />
            <div>
              <h1>
                <i class="pi pi-user-plus"></i>
                New Patient Registration
              </h1>
              <p class="subtitle">Complete the form to register a new patient</p>
            </div>
          </div>
          <div class="header-actions">
            <p-tag 
              [value]="getStepLabel()" 
              [severity]="activeStep === 4 ? 'success' : 'info'"
              icon="pi pi-info-circle"
            />
          </div>
        </div>
      </header>

      <!-- Registration Form -->
      <section class="form-section">
        <p-stepper [(value)]="activeStep" [linear]="false">
          <p-step-list>
            <p-step [value]="1">Demographics</p-step>
            <p-step [value]="2">Contact & Address</p-step>
            <p-step [value]="3">Emergency & Family</p-step>
            <p-step [value]="4">Insurance & Consent</p-step>
          </p-step-list>
          <p-step-panels>
          <!-- Step 1: Demographics -->
          <p-step-panel [value]="1">
              <ng-template #content let-activateCallback="activateCallback">
                          <div class="step-content">
                <p-card styleClass="form-card">
                  <div class="form-grid">
                    <!-- Clinic Selection -->
                    <div class="form-row full-width">
                      <h3 class="section-title">
                        <i class="pi pi-building"></i>
                        Clinic / Facility
                      </h3>
                    </div>
                    
                    <div class="form-field">
                      <label for="clinic">Clinic/Facility <span class="required">*</span></label>
                      <p-select
                        id="clinic"
                        [options]="clinics"
                        [formControl]="getControl('clinicId')"
                        optionLabel="name"
                        optionValue="id"
                        placeholder="Select Clinic"
                        [showClear]="true"
                        [filter]="true"
                        styleClass="w-full"
                      >
                        <ng-template pTemplate="selectedItem" let-clinic>
                          <div class="clinic-option">
                            <i class="pi pi-building"></i>
                            <span>{{ clinic.name }}</span>
                            <p-tag [value]="clinic.code" severity="secondary" />
                          </div>
                        </ng-template>
                        <ng-template pTemplate="item" let-clinic>
                          <div class="clinic-option">
                            <i class="pi pi-building"></i>
                            <div class="clinic-details">
                              <span class="clinic-name">{{ clinic.name }}</span>
                              <span class="clinic-address">{{ clinic.address }}</span>
                            </div>
                            <p-tag [value]="clinic.code" severity="secondary" />
                          </div>
                        </ng-template>
                      </p-select>
                      @if (getControl('clinicId').invalid && getControl('clinicId').touched) {
                        <small class="p-error">Clinic is required</small>
                      }
                    </div>

                    <div class="form-field">
                      <label for="visitType">Visit Type <span class="required">*</span></label>
                      <p-select
                        id="visitType"
                        [options]="visitTypes"
                        [formControl]="getControl('visitType')"
                        placeholder="Select Visit Type"
                        styleClass="w-full"
                      />
                    </div>

                    <!-- Personal Information -->
                    <div class="form-row full-width">
                      <p-divider />
                      <h3 class="section-title">
                        <i class="pi pi-user"></i>
                        Personal Information
                      </h3>
                    </div>

                    <div class="form-field">
                      <label for="firstName">First Name <span class="required">*</span></label>
                      <input 
                        pInputText 
                        id="firstName"
                        [formControl]="getControl('firstName')"
                        placeholder="Enter first name"
                      />
                      @if (getControl('firstName').invalid && getControl('firstName').touched) {
                        <small class="p-error">First name is required</small>
                      }
                    </div>

                    <div class="form-field">
                      <label for="middleName">Middle Name</label>
                      <input 
                        pInputText 
                        id="middleName"
                        [formControl]="getControl('middleName')"
                        placeholder="Enter middle name"
                      />
                    </div>

                    <div class="form-field">
                      <label for="lastName">Last Name <span class="required">*</span></label>
                      <input 
                        pInputText 
                        id="lastName"
                        [formControl]="getControl('lastName')"
                        placeholder="Enter last name"
                      />
                      @if (getControl('lastName').invalid && getControl('lastName').touched) {
                        <small class="p-error">Last name is required</small>
                      }
                    </div>

                    <div class="form-field">
                      <label for="dateOfBirth">Date of Birth <span class="required">*</span></label>
                      <p-datepicker
                        id="dateOfBirth"
                        [formControl]="getControl('dateOfBirth')"
                        [showIcon]="true"
                        [maxDate]="maxDate"
                        dateFormat="mm/dd/yy"
                        placeholder="Select date"
                        styleClass="w-full"
                      />
                      @if (getControl('dateOfBirth').invalid && getControl('dateOfBirth').touched) {
                        <small class="p-error">Date of birth is required</small>
                      }
                    </div>

                    <div class="form-field">
                      <label for="gender">Gender <span class="required">*</span></label>
                      <p-select
                        id="gender"
                        [options]="genderOptions"
                        [formControl]="getControl('gender')"
                        placeholder="Select gender"
                        styleClass="w-full"
                      />
                      @if (getControl('gender').invalid && getControl('gender').touched) {
                        <small class="p-error">Gender is required</small>
                      }
                    </div>

                    <div class="form-field">
                      <label for="ssn">SSN (Last 4 digits)</label>
                      <p-inputmask
                        id="ssn"
                        [formControl]="getControl('ssn')"
                        mask="9999"
                        placeholder="XXXX"
                        styleClass="w-full"
                      />
                    </div>

                    <div class="form-field">
                      <label for="maritalStatus">Marital Status</label>
                      <p-select
                        id="maritalStatus"
                        [options]="maritalStatusOptions"
                        [formControl]="getControl('maritalStatus')"
                        placeholder="Select status"
                        styleClass="w-full"
                      />
                    </div>

                    <div class="form-field">
                      <label for="bloodGroup">Blood Group</label>
                      <p-select
                        id="bloodGroup"
                        [options]="bloodGroupOptions"
                        [formControl]="getControl('bloodGroup')"
                        placeholder="Select blood group"
                        styleClass="w-full"
                      />
                    </div>
                  </div>
                </p-card>

                <div class="step-actions">
                  <p-button 
                    label="Next" 
                    icon="pi pi-arrow-right" 
                    iconPos="right"
                    (onClick)="activateCallback(2)"
                    [disabled]="!isStep1Valid()"
                  />
                </div>
              </div>
          </ng-template>
            </p-step-panel>

          <!-- Step 2: Contact & Address -->
          <p-step-panel [value]="2">
              <ng-template #content let-activateCallback="activateCallback">
                          <div class="step-content">
                <p-card styleClass="form-card">
                  <div class="form-grid">
                    <!-- Contact Information -->
                    <div class="form-row full-width">
                      <h3 class="section-title">
                        <i class="pi pi-phone"></i>
                        Contact Information
                      </h3>
                    </div>

                    <div class="form-field">
                      <label for="email">Email Address</label>
                      <input 
                        pInputText 
                        id="email"
                        type="email"
                        [formControl]="getControl('email')"
                        placeholder="patient@email.com"
                      />
                      @if (getControl('email').invalid && getControl('email').touched) {
                        <small class="p-error">Please enter a valid email</small>
                      }
                    </div>

                    <div class="form-field">
                      <label for="phone">Phone Number <span class="required">*</span></label>
                      <p-inputmask
                        id="phone"
                        [formControl]="getControl('phone')"
                        mask="(999) 999-9999"
                        placeholder="(555) 555-5555"
                        styleClass="w-full"
                      />
                      @if (getControl('phone').invalid && getControl('phone').touched) {
                        <small class="p-error">Phone number is required</small>
                      }
                    </div>

                    <div class="form-field">
                      <label for="mobilePhone">Mobile Phone</label>
                      <p-inputmask
                        id="mobilePhone"
                        [formControl]="getControl('mobilePhone')"
                        mask="(999) 999-9999"
                        placeholder="(555) 555-5555"
                        styleClass="w-full"
                      />
                    </div>

                    <div class="form-field">
                      <label for="preferredContact">Preferred Contact Method</label>
                      <p-select
                        id="preferredContact"
                        [options]="contactMethodOptions"
                        [formControl]="getControl('preferredContactMethod')"
                        placeholder="Select method"
                        styleClass="w-full"
                      />
                    </div>

                    <!-- Address -->
                    <div class="form-row full-width">
                      <p-divider />
                      <h3 class="section-title">
                        <i class="pi pi-map-marker"></i>
                        Address
                      </h3>
                    </div>

                    <div class="form-field full-width">
                      <label for="addressLine1">Street Address <span class="required">*</span></label>
                      <input 
                        pInputText 
                        id="addressLine1"
                        [formControl]="getAddressControl('line1')"
                        placeholder="123 Main Street"
                      />
                    </div>

                    <div class="form-field full-width">
                      <label for="addressLine2">Apartment, Suite, etc.</label>
                      <input 
                        pInputText 
                        id="addressLine2"
                        [formControl]="getAddressControl('line2')"
                        placeholder="Apt 4B"
                      />
                    </div>

                    <div class="form-field">
                      <label for="city">City <span class="required">*</span></label>
                      <input 
                        pInputText 
                        id="city"
                        [formControl]="getAddressControl('city')"
                        placeholder="City"
                      />
                    </div>

                    <div class="form-field">
                      <label for="state">State <span class="required">*</span></label>
                      <p-select
                        id="state"
                        [options]="stateOptions"
                        [formControl]="getAddressControl('state')"
                        placeholder="Select state"
                        [filter]="true"
                        styleClass="w-full"
                      />
                    </div>

                    <div class="form-field">
                      <label for="postalCode">ZIP Code <span class="required">*</span></label>
                      <p-inputmask
                        id="postalCode"
                        [formControl]="getAddressControl('postalCode')"
                        mask="99999"
                        placeholder="12345"
                        styleClass="w-full"
                      />
                    </div>

                    <div class="form-field">
                      <label for="country">Country</label>
                      <p-select
                        id="country"
                        [options]="countryOptions"
                        [formControl]="getAddressControl('country')"
                        placeholder="Select country"
                        styleClass="w-full"
                      />
                    </div>
                  </div>
                </p-card>

                <div class="step-actions">
                  <p-button 
                    label="Back" 
                    icon="pi pi-arrow-left"
                    [outlined]="true"
                    severity="secondary"
                    (onClick)="activateCallback(1)"
                  />
                  <p-button 
                    label="Next" 
                    icon="pi pi-arrow-right" 
                    iconPos="right"
                    (onClick)="activateCallback(3)"
                    [disabled]="!isStep2Valid()"
                  />
                </div>
              </div>
          </ng-template>
            </p-step-panel>

          <!-- Step 3: Emergency Contact & Family -->
          <p-step-panel [value]="3">
              <ng-template #content let-activateCallback="activateCallback">
                          <div class="step-content">
                <!-- Emergency Contact -->
                <p-card styleClass="form-card">
                  <div class="form-grid">
                    <div class="form-row full-width">
                      <h3 class="section-title">
                        <i class="pi pi-exclamation-triangle"></i>
                        Emergency Contact
                      </h3>
                    </div>

                    <div class="form-field">
                      <label for="emergencyName">Contact Name <span class="required">*</span></label>
                      <input 
                        pInputText 
                        id="emergencyName"
                        [formControl]="getEmergencyControl('name')"
                        placeholder="Full name"
                      />
                    </div>

                    <div class="form-field">
                      <label for="emergencyRelationship">Relationship <span class="required">*</span></label>
                      <p-select
                        id="emergencyRelationship"
                        [options]="relationshipOptions"
                        [formControl]="getEmergencyControl('relationship')"
                        placeholder="Select relationship"
                        styleClass="w-full"
                      />
                    </div>

                    <div class="form-field">
                      <label for="emergencyPhone">Phone <span class="required">*</span></label>
                      <p-inputmask
                        id="emergencyPhone"
                        [formControl]="getEmergencyControl('phone')"
                        mask="(999) 999-9999"
                        placeholder="(555) 555-5555"
                        styleClass="w-full"
                      />
                    </div>

                    <div class="form-field">
                      <label for="emergencyAltPhone">Alternate Phone</label>
                      <p-inputmask
                        id="emergencyAltPhone"
                        [formControl]="getEmergencyControl('alternatePhone')"
                        mask="(999) 999-9999"
                        placeholder="(555) 555-5555"
                        styleClass="w-full"
                      />
                    </div>
                  </div>
                </p-card>

                <!-- Family Relations -->
                <p-card styleClass="form-card family-card">
                  <div class="family-header">
                    <h3 class="section-title">
                      <i class="pi pi-users"></i>
                      Family Relations
                    </h3>
                    <p-button 
                      label="Link Family Member" 
                      icon="pi pi-link"
                      [outlined]="true"
                      size="small"
                      (onClick)="showFamilyDialog.set(true)"
                    />
                  </div>

                  @if (familyMembers().length > 0) {
                    <div class="family-list">
                      @for (member of familyMembers(); track member.patientId) {
                        <div class="family-member-card">
                          <p-avatar 
                            [label]="getInitials(member.patientName)"
                            shape="circle"
                            [style]="{ 'background-color': '#3b82f6', 'color': 'white' }"
                          />
                          <div class="member-info">
                            <span class="member-name">{{ member.patientName }}</span>
                            <span class="member-mrn">MRN: {{ member.mrn }}</span>
                          </div>
                          <p-tag 
                            [value]="member.relationship" 
                            [severity]="getRelationshipSeverity(member.relationship)"
                            [icon]="getRelationshipIcon(member.relationship)"
                          />
                          <p-button 
                            icon="pi pi-times" 
                            [rounded]="true" 
                            [text]="true"
                            severity="danger"
                            size="small"
                            (onClick)="removeFamilyMember(member)"
                            pTooltip="Remove"
                          />
                        </div>
                      }
                    </div>
                  } @else {
                    <div class="empty-family">
                      <i class="pi pi-users"></i>
                      <p>No family members linked yet</p>
                      <small>Link existing patients as family members to view relations</small>
                    </div>
                  }
                </p-card>

                <div class="step-actions">
                  <p-button 
                    label="Back" 
                    icon="pi pi-arrow-left"
                    [outlined]="true"
                    severity="secondary"
                    (onClick)="activateCallback(2)"
                  />
                  <p-button 
                    label="Next" 
                    icon="pi pi-arrow-right" 
                    iconPos="right"
                    (onClick)="activateCallback(4)"
                  />
                </div>
              </div>
          </ng-template>
            </p-step-panel>

          <!-- Step 4: Insurance & Consent -->
          <p-step-panel [value]="4">
              <ng-template #content let-activateCallback="activateCallback">
                          <div class="step-content">
                <!-- Insurance -->
                <p-card styleClass="form-card">
                  <div class="form-grid">
                    <div class="form-row full-width">
                      <h3 class="section-title">
                        <i class="pi pi-shield"></i>
                        Primary Insurance
                      </h3>
                    </div>

                    <div class="form-field">
                      <label for="payerName">Insurance Provider</label>
                      <input 
                        pInputText 
                        id="payerName"
                        [formControl]="getInsuranceControl('payerName')"
                        placeholder="Insurance company name"
                      />
                    </div>

                    <div class="form-field">
                      <label for="planName">Plan Name</label>
                      <input 
                        pInputText 
                        id="planName"
                        [formControl]="getInsuranceControl('planName')"
                        placeholder="Plan name"
                      />
                    </div>

                    <div class="form-field">
                      <label for="memberId">Member ID</label>
                      <input 
                        pInputText 
                        id="memberId"
                        [formControl]="getInsuranceControl('memberId')"
                        placeholder="Member ID"
                      />
                    </div>

                    <div class="form-field">
                      <label for="groupNumber">Group Number</label>
                      <input 
                        pInputText 
                        id="groupNumber"
                        [formControl]="getInsuranceControl('groupNumber')"
                        placeholder="Group number"
                      />
                    </div>
                  </div>
                </p-card>

                <!-- Consent -->
                <p-card styleClass="form-card consent-card">
                  <div class="form-grid">
                    <div class="form-row full-width">
                      <h3 class="section-title">
                        <i class="pi pi-verified"></i>
                        Consent & Agreements
                      </h3>
                    </div>

                    <div class="consent-item full-width">
                      <p-checkbox 
                        [formControl]="getConsentControl('hipaaConsent')"
                        [binary]="true"
                        inputId="hipaaConsent"
                      />
                      <label for="hipaaConsent">
                        <strong>HIPAA Authorization</strong>
                        <span>I authorize the use and disclosure of my health information as described in the Notice of Privacy Practices.</span>
                      </label>
                    </div>

                    <div class="consent-item full-width">
                      <p-checkbox 
                        [formControl]="getConsentControl('treatmentConsent')"
                        [binary]="true"
                        inputId="treatmentConsent"
                      />
                      <label for="treatmentConsent">
                        <strong>Consent to Treatment</strong>
                        <span>I consent to receive medical treatment and services from this healthcare facility.</span>
                      </label>
                    </div>

                    <div class="consent-item full-width">
                      <p-checkbox 
                        [formControl]="getConsentControl('portalConsent')"
                        [binary]="true"
                        inputId="portalConsent"
                      />
                      <label for="portalConsent">
                        <strong>Patient Portal Access</strong>
                        <span>I would like to access my health records through the patient portal.</span>
                      </label>
                    </div>

                    <div class="consent-item full-width">
                      <p-checkbox 
                        [formControl]="getConsentControl('marketingConsent')"
                        [binary]="true"
                        inputId="marketingConsent"
                      />
                      <label for="marketingConsent">
                        <strong>Marketing Communications</strong>
                        <span>I agree to receive health tips, newsletters, and promotional materials.</span>
                      </label>
                    </div>
                  </div>
                </p-card>

                <div class="step-actions">
                  <p-button 
                    label="Back" 
                    icon="pi pi-arrow-left"
                    [outlined]="true"
                    severity="secondary"
                    (onClick)="activateCallback(3)"
                  />
                  <p-button 
                    label="Register Patient" 
                    icon="pi pi-check" 
                    iconPos="right"
                    (onClick)="submitForm()"
                    [loading]="submitting()"
                    [disabled]="!registrationForm.valid || submitting()"
                  />
                </div>
              </div>
          </ng-template>
            </p-step-panel>
          </p-step-panels>
        </p-stepper>
      </section>

      <!-- Family Search Dialog -->
      <p-dialog 
        header="Link Family Member" 
        [(visible)]="showFamilyDialog"
        [modal]="true"
        [style]="{ width: '600px' }"
        [draggable]="false"
        [resizable]="false">
        <div class="family-dialog-content">
          <div class="search-section">
            <label>Search Existing Patient</label>
            <p-autoComplete
              [(ngModel)]="familySearchQuery"
              [suggestions]="familySearchResults()"
              (completeMethod)="searchFamilyMember($event)"
              [dropdown]="true"
              field="displayName"
              placeholder="Search by name or MRN..."
              styleClass="w-full"
            >
              <ng-template let-patient pTemplate="item">
                <div class="patient-search-item">
                  <p-avatar 
                    [label]="getInitials(patient.firstName + ' ' + patient.lastName)"
                    shape="circle"
                    size="normal"
                  />
                  <div class="patient-info">
                    <span class="patient-name">{{ patient.firstName }} {{ patient.lastName }}</span>
                    <span class="patient-mrn">MRN: {{ patient.mrn }}</span>
                  </div>
                </div>
              </ng-template>
            </p-autoComplete>
          </div>

          @if (selectedFamilyPatient()) {
            <div class="selected-patient-section">
              <p-divider />
              <h4>Selected Patient</h4>
              <div class="selected-patient-card">
                <p-avatar 
                  [label]="getInitials(selectedFamilyPatient()!.firstName + ' ' + selectedFamilyPatient()!.lastName)"
                  shape="circle"
                  size="large"
                />
                <div class="patient-details">
                  <span class="name">{{ selectedFamilyPatient()!.firstName }} {{ selectedFamilyPatient()!.lastName }}</span>
                  <span class="mrn">MRN: {{ selectedFamilyPatient()!.mrn }}</span>
                </div>
              </div>

              <div class="relationship-section">
                <label>Relationship to New Patient <span class="required">*</span></label>
                <div class="relationship-grid">
                  @for (rel of relationshipTypes; track rel.value) {
                    <div 
                      class="relationship-option"
                      [class.selected]="selectedRelationship() === rel.value"
                      (click)="selectedRelationship.set(rel.value)"
                    >
                      <i [class]="'pi ' + rel.icon"></i>
                      <span>{{ rel.label }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>
          }
        </div>

        <ng-template pTemplate="footer">
          <p-button 
            label="Cancel" 
            [text]="true"
            severity="secondary"
            (onClick)="closeFamilyDialog()"
          />
          <p-button 
            label="Add Family Member" 
            icon="pi pi-plus"
            (onClick)="addFamilyMember()"
            [disabled]="!selectedFamilyPatient() || !selectedRelationship()"
          />
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .patient-registration {
      min-height: 100vh;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      padding: 1.5rem 2rem;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .title-section {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .title-section h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .title-section h1 i {
      color: #3b82f6;
    }

    .subtitle {
      color: #64748b;
      margin: 0.25rem 0 0 0;
    }

    .form-section {
      max-width: 900px;
      margin: 0 auto;
    }

    .step-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1.5rem 0;
    }

    :host ::ng-deep .form-card {
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    :host ::ng-deep .form-card .p-card-body {
      padding: 1.5rem;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
    }

    .form-row.full-width,
    .form-field.full-width {
      grid-column: 1 / -1;
    }

    .section-title {
      font-size: 1rem;
      font-weight: 600;
      color: #374151;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .section-title i {
      color: #3b82f6;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-field label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }

    .required {
      color: #ef4444;
    }

    :host ::ng-deep .form-field input,
    :host ::ng-deep .form-field .p-select,
    :host ::ng-deep .form-field .p-datepicker,
    :host ::ng-deep .form-field .p-inputmask {
      width: 100%;
    }

    .step-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
    }

    /* Clinic Option Styles */
    .clinic-option {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .clinic-details {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .clinic-name {
      font-weight: 500;
    }

    .clinic-address {
      font-size: 0.75rem;
      color: #64748b;
    }

    /* Family Section Styles */
    .family-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .family-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .family-member-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }

    .member-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .member-name {
      font-weight: 500;
      color: #1e293b;
    }

    .member-mrn {
      font-size: 0.75rem;
      color: #64748b;
    }

    .empty-family {
      text-align: center;
      padding: 2rem;
      color: #64748b;
    }

    .empty-family i {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .empty-family p {
      margin: 0;
      font-weight: 500;
    }

    .empty-family small {
      display: block;
      margin-top: 0.25rem;
    }

    /* Consent Styles */
    .consent-item {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }

    .consent-item label {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      cursor: pointer;
    }

    .consent-item label strong {
      color: #1e293b;
    }

    .consent-item label span {
      font-size: 0.875rem;
      color: #64748b;
    }

    /* Family Dialog Styles */
    .family-dialog-content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .search-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .search-section label {
      font-weight: 500;
      color: #374151;
    }

    .patient-search-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem;
    }

    .patient-info {
      display: flex;
      flex-direction: column;
    }

    .patient-name {
      font-weight: 500;
    }

    .patient-mrn {
      font-size: 0.75rem;
      color: #64748b;
    }

    .selected-patient-section h4 {
      margin: 0 0 1rem 0;
      color: #374151;
    }

    .selected-patient-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #eff6ff;
      border-radius: 8px;
      border: 1px solid #bfdbfe;
      margin-bottom: 1.5rem;
    }

    .patient-details {
      display: flex;
      flex-direction: column;
    }

    .patient-details .name {
      font-weight: 600;
      color: #1e40af;
    }

    .patient-details .mrn {
      font-size: 0.875rem;
      color: #3b82f6;
    }

    .relationship-section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .relationship-section label {
      font-weight: 500;
      color: #374151;
    }

    .relationship-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
    }

    .relationship-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      background: #f8fafc;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .relationship-option:hover {
      border-color: #93c5fd;
      background: #eff6ff;
    }

    .relationship-option.selected {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .relationship-option i {
      font-size: 1.5rem;
      color: #3b82f6;
    }

    .relationship-option span {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }

    /* Dark Mode */
    .patient-registration.dark {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    }

    .dark .title-section h1 {
      color: #f1f5f9;
    }

    .dark .subtitle {
      color: #94a3b8;
    }

    .dark .section-title {
      color: #e2e8f0;
    }

    .dark .form-field label {
      color: #e2e8f0;
    }

    .dark .family-member-card,
    .dark .consent-item,
    .dark .empty-family {
      background: #1e293b;
      border-color: #334155;
    }

    .dark .member-name,
    .dark .consent-item label strong {
      color: #f1f5f9;
    }

    .dark .member-mrn,
    .dark .consent-item label span,
    .dark .empty-family {
      color: #94a3b8;
    }

    .dark .relationship-option {
      background: #1e293b;
      border-color: #334155;
    }

    .dark .relationship-option:hover,
    .dark .relationship-option.selected {
      background: #1e3a5f;
    }

    .dark .relationship-option span {
      color: #e2e8f0;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .patient-registration {
        padding: 1rem;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .relationship-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .header-content {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class PatientRegistrationComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly patientService = inject(PatientService);
  private readonly messageService = inject(MessageService);
  readonly themeService = inject(ThemeService);
  private readonly destroy$ = new Subject<void>();

  // Form
  registrationForm!: FormGroup;
  activeStep = 1;
  maxDate = new Date();

  // Signals
  submitting = signal(false);
  familyMembers = signal<FamilyMember[]>([]);
  showFamilyDialog = signal(false);
  familySearchResults = signal<Patient[]>([]);
  selectedFamilyPatient = signal<Patient | null>(null);
  selectedRelationship = signal<string>('');
  familySearchQuery = '';

  // Options
  clinics: Clinic[] = [
    { id: 'clinic-1', name: 'Main Hospital - Downtown', code: 'MH-DT', address: '123 Medical Center Dr', phone: '(555) 100-1000' },
    { id: 'clinic-2', name: 'North Medical Center', code: 'NMC', address: '456 North Ave', phone: '(555) 200-2000' },
    { id: 'clinic-3', name: 'South Family Clinic', code: 'SFC', address: '789 South Blvd', phone: '(555) 300-3000' },
    { id: 'clinic-4', name: 'East Side Urgent Care', code: 'ESUC', address: '321 East St', phone: '(555) 400-4000' },
    { id: 'clinic-5', name: 'West Valley Specialty', code: 'WVS', address: '654 West Way', phone: '(555) 500-5000' },
  ];

  visitTypes = [
    { label: 'OPD - Outpatient', value: 'opd' },
    { label: 'IPD - Inpatient', value: 'ipd' },
    { label: 'Emergency', value: 'emergency' },
    { label: 'Day Care', value: 'daycare' },
  ];

  genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
  ];

  maritalStatusOptions = [
    { label: 'Single', value: 'single' },
    { label: 'Married', value: 'married' },
    { label: 'Divorced', value: 'divorced' },
    { label: 'Widowed', value: 'widowed' },
    { label: 'Separated', value: 'separated' },
  ];

  bloodGroupOptions = [
    { label: 'A+', value: 'A+' },
    { label: 'A-', value: 'A-' },
    { label: 'B+', value: 'B+' },
    { label: 'B-', value: 'B-' },
    { label: 'AB+', value: 'AB+' },
    { label: 'AB-', value: 'AB-' },
    { label: 'O+', value: 'O+' },
    { label: 'O-', value: 'O-' },
  ];

  contactMethodOptions = [
    { label: 'Phone', value: 'phone' },
    { label: 'Email', value: 'email' },
    { label: 'Mail', value: 'mail' },
    { label: 'Patient Portal', value: 'portal' },
  ];

  relationshipOptions = [
    { label: 'Spouse', value: 'spouse' },
    { label: 'Parent', value: 'parent' },
    { label: 'Child', value: 'child' },
    { label: 'Sibling', value: 'sibling' },
    { label: 'Other', value: 'other' },
  ];

  relationshipTypes: RelationshipType[] = [
    { label: 'Spouse', value: 'spouse', icon: 'pi-heart' },
    { label: 'Parent', value: 'parent', icon: 'pi-user' },
    { label: 'Child', value: 'child', icon: 'pi-user' },
    { label: 'Sibling', value: 'sibling', icon: 'pi-users' },
    { label: 'Guardian', value: 'guardian', icon: 'pi-shield' },
    { label: 'Other', value: 'other', icon: 'pi-ellipsis-h' },
  ];

  stateOptions = [
    { label: 'Alabama', value: 'AL' },
    { label: 'Alaska', value: 'AK' },
    { label: 'Arizona', value: 'AZ' },
    { label: 'Arkansas', value: 'AR' },
    { label: 'California', value: 'CA' },
    { label: 'Colorado', value: 'CO' },
    { label: 'Connecticut', value: 'CT' },
    { label: 'Delaware', value: 'DE' },
    { label: 'Florida', value: 'FL' },
    { label: 'Georgia', value: 'GA' },
    { label: 'Hawaii', value: 'HI' },
    { label: 'Idaho', value: 'ID' },
    { label: 'Illinois', value: 'IL' },
    { label: 'Indiana', value: 'IN' },
    { label: 'Iowa', value: 'IA' },
    { label: 'Kansas', value: 'KS' },
    { label: 'Kentucky', value: 'KY' },
    { label: 'Louisiana', value: 'LA' },
    { label: 'Maine', value: 'ME' },
    { label: 'Maryland', value: 'MD' },
    { label: 'Massachusetts', value: 'MA' },
    { label: 'Michigan', value: 'MI' },
    { label: 'Minnesota', value: 'MN' },
    { label: 'Mississippi', value: 'MS' },
    { label: 'Missouri', value: 'MO' },
    { label: 'Montana', value: 'MT' },
    { label: 'Nebraska', value: 'NE' },
    { label: 'Nevada', value: 'NV' },
    { label: 'New Hampshire', value: 'NH' },
    { label: 'New Jersey', value: 'NJ' },
    { label: 'New Mexico', value: 'NM' },
    { label: 'New York', value: 'NY' },
    { label: 'North Carolina', value: 'NC' },
    { label: 'North Dakota', value: 'ND' },
    { label: 'Ohio', value: 'OH' },
    { label: 'Oklahoma', value: 'OK' },
    { label: 'Oregon', value: 'OR' },
    { label: 'Pennsylvania', value: 'PA' },
    { label: 'Rhode Island', value: 'RI' },
    { label: 'South Carolina', value: 'SC' },
    { label: 'South Dakota', value: 'SD' },
    { label: 'Tennessee', value: 'TN' },
    { label: 'Texas', value: 'TX' },
    { label: 'Utah', value: 'UT' },
    { label: 'Vermont', value: 'VT' },
    { label: 'Virginia', value: 'VA' },
    { label: 'Washington', value: 'WA' },
    { label: 'West Virginia', value: 'WV' },
    { label: 'Wisconsin', value: 'WI' },
    { label: 'Wyoming', value: 'WY' },
  ];

  countryOptions = [
    { label: 'United States', value: 'USA' },
    { label: 'Canada', value: 'CAN' },
    { label: 'Mexico', value: 'MEX' },
  ];

  ngOnInit(): void {
    this.initForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.registrationForm = this.fb.group({
      // Step 1: Demographics
      clinicId: ['', Validators.required],
      visitType: ['opd', Validators.required],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      middleName: [''],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      dateOfBirth: [null, Validators.required],
      gender: ['', Validators.required],
      ssn: [''],
      maritalStatus: [''],
      bloodGroup: [''],

      // Step 2: Contact
      email: ['', [Validators.email]],
      phone: ['', Validators.required],
      mobilePhone: [''],
      preferredContactMethod: ['phone'],

      // Address
      address: this.fb.group({
        line1: ['', Validators.required],
        line2: [''],
        city: ['', Validators.required],
        state: ['', Validators.required],
        postalCode: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
        country: ['USA'],
      }),

      // Step 3: Emergency Contact
      emergencyContact: this.fb.group({
        name: ['', Validators.required],
        relationship: ['', Validators.required],
        phone: ['', Validators.required],
        alternatePhone: [''],
      }),

      // Family Relations (stored separately)
      familyRelations: this.fb.array([]),

      // Step 4: Insurance
      insurance: this.fb.group({
        payerName: [''],
        planName: [''],
        memberId: [''],
        groupNumber: [''],
      }),

      // Consent
      consent: this.fb.group({
        hipaaConsent: [false, Validators.requiredTrue],
        treatmentConsent: [false, Validators.requiredTrue],
        portalConsent: [false],
        marketingConsent: [false],
      }),
    });
  }

  // Form control helpers
  getControl(name: string): FormControl {
    return this.registrationForm.get(name) as FormControl;
  }

  getAddressControl(name: string): FormControl {
    return this.registrationForm.get(`address.${name}`) as FormControl;
  }

  getEmergencyControl(name: string): FormControl {
    return this.registrationForm.get(`emergencyContact.${name}`) as FormControl;
  }

  getInsuranceControl(name: string): FormControl {
    return this.registrationForm.get(`insurance.${name}`) as FormControl;
  }

  getConsentControl(name: string): FormControl {
    return this.registrationForm.get(`consent.${name}`) as FormControl;
  }

  // Step validation
  isStep1Valid(): boolean {
    return this.getControl('clinicId').valid &&
           this.getControl('firstName').valid &&
           this.getControl('lastName').valid &&
           this.getControl('dateOfBirth').valid &&
           this.getControl('gender').valid;
  }

  isStep2Valid(): boolean {
    return this.getControl('phone').valid &&
           this.getAddressControl('line1').valid &&
           this.getAddressControl('city').valid &&
           this.getAddressControl('state').valid &&
           this.getAddressControl('postalCode').valid;
  }

  // Navigation helper
  getStepLabel(): string {
    const labels = ['Demographics', 'Contact', 'Emergency & Family', 'Insurance & Consent'];
    return `Step ${this.activeStep} of 4: ${labels[this.activeStep - 1]}`;
  }

  // Family member methods
  searchFamilyMember(event: any): void {
    const query = event.query;
    if (query.length < 2) {
      this.familySearchResults.set([]);
      return;
    }

    const params: PatientSearchParams = {
      query,
      pageSize: 10,
    };

    this.patientService.searchPatients(params).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result) => {
        const results = result.patients.map(p => ({
          ...p,
          displayName: `${p.firstName} ${p.lastName} (${p.mrn})`
        }));
        this.familySearchResults.set(results);
      }
    });
  }

  addFamilyMember(): void {
    const patient = this.selectedFamilyPatient();
    const relationship = this.selectedRelationship();
    
    if (!patient || !relationship) return;

    const newMember: FamilyMember = {
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      mrn: patient.mrn,
      relationship,
    };

    this.familyMembers.update(members => [...members, newMember]);
    this.closeFamilyDialog();
  }

  removeFamilyMember(member: FamilyMember): void {
    this.familyMembers.update(members => 
      members.filter(m => m.patientId !== member.patientId)
    );
  }

  closeFamilyDialog(): void {
    this.showFamilyDialog.set(false);
    this.selectedFamilyPatient.set(null);
    this.selectedRelationship.set('');
    this.familySearchQuery = '';
    this.familySearchResults.set([]);
  }

  getInitials(name: string): string {
    const parts = name.split(' ');
    return parts.map(p => p[0]).slice(0, 2).join('').toUpperCase();
  }

  getRelationshipSeverity(relationship: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const severities: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      spouse: 'danger',
      parent: 'info',
      child: 'success',
      sibling: 'warn',
      guardian: 'secondary',
      other: 'secondary',
    };
    return severities[relationship] || 'secondary';
  }

  getRelationshipIcon(relationship: string): string {
    const icons: Record<string, string> = {
      spouse: 'pi pi-heart',
      parent: 'pi pi-user',
      child: 'pi pi-user',
      sibling: 'pi pi-users',
      guardian: 'pi pi-shield',
      other: 'pi pi-ellipsis-h',
    };
    return icons[relationship] || 'pi pi-user';
  }

  // Form submission
  submitForm(): void {
    if (this.registrationForm.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please fill in all required fields',
      });
      return;
    }

    this.submitting.set(true);
    const formValue = this.registrationForm.value;

    const patientData: CreatePatientDto = {
      firstName: formValue.firstName,
      middleName: formValue.middleName,
      lastName: formValue.lastName,
      dateOfBirth: formValue.dateOfBirth,
      gender: formValue.gender as Gender,
      ssn: formValue.ssn,
      email: formValue.email,
      phone: formValue.phone,
      mobilePhone: formValue.mobilePhone,
      preferredContactMethod: formValue.preferredContactMethod as ContactMethod,
      address: formValue.address,
      emergencyContact: formValue.emergencyContact,
      facilityId: formValue.clinicId,
    };

    this.patientService.createPatient(patientData).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (patient) => {
        // Save family relations
        if (this.familyMembers().length > 0) {
          this.saveFamilyRelations(patient.id);
        }

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Patient ${patient.firstName} ${patient.lastName} registered successfully`,
        });

        setTimeout(() => {
          this.router.navigate(['/patients', patient.id]);
        }, 1500);
      },
      error: (err) => {
        this.submitting.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Registration Failed',
          detail: err.message || 'Failed to register patient',
        });
      }
    });
  }

  private saveFamilyRelations(patientId: string): void {
    // This would call a service to save family relations
    // For now, we'll log it
    console.log('Saving family relations for patient:', patientId, this.familyMembers());
  }
}
