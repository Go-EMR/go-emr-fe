import { Component, inject, signal, computed, OnInit, OnDestroy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Subject, takeUntil, debounceTime } from 'rxjs';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { AutoCompleteModule, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
import { BadgeModule } from 'primeng/badge';
import { CheckboxModule } from 'primeng/checkbox';
import { RadioButtonModule } from 'primeng/radiobutton';
import { PanelModule } from 'primeng/panel';
import { AccordionModule } from 'primeng/accordion';
import { MessagesModule } from 'primeng/messages';
import { MessageModule } from 'primeng/message';
import { RippleModule } from 'primeng/ripple';
import { MessageService, ConfirmationService } from 'primeng/api';

import { ThemeService } from '../../../core/services/theme.service';

interface Drug {
  id: string;
  name: string;
  genericName: string;
  brandNames: string[];
  ndc: string;
  drugClass: string;
  controlledSubstance: boolean;
  schedule?: string; // II, III, IV, V
  forms: DrugForm[];
  strengths: string[];
  defaultSig: string;
  warnings: string[];
  contraindications: string[];
  interactions: DrugInteraction[];
}

interface DrugForm {
  form: string; // tablet, capsule, liquid, etc.
  route: string; // oral, topical, etc.
}

interface DrugInteraction {
  drugId: string;
  drugName: string;
  severity: 'mild' | 'moderate' | 'severe' | 'contraindicated';
  description: string;
}

interface Prescription {
  id: string;
  drugId: string;
  drugName: string;
  genericName: string;
  strength: string;
  form: string;
  route: string;
  quantity: number;
  quantityUnit: string;
  daysSupply: number;
  refills: number;
  sig: string; // Instructions
  dispenseAsWritten: boolean;
  priorAuth?: string;
  notes?: string;
  startDate: Date;
  endDate?: Date;
  status: PrescriptionStatus;
}

type PrescriptionStatus = 'draft' | 'pending' | 'sent' | 'filled' | 'cancelled' | 'denied';

interface PatientAllergy {
  allergen: string;
  type: 'drug' | 'food' | 'environmental';
  severity: string;
  reaction: string;
}

interface AlertMessage {
  type: 'interaction' | 'allergy' | 'duplicate' | 'dosing' | 'formulary';
  severity: 'info' | 'warn' | 'error';
  title: string;
  message: string;
  drugId?: string;
}

@Component({
  selector: 'app-prescription-writer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    DialogModule,
    SelectModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    AutoCompleteModule,
    TagModule,
    ChipModule,
    TooltipModule,
    DividerModule,
    ToastModule,
    ConfirmDialogModule,
    TableModule,
    BadgeModule,
    CheckboxModule,
    RadioButtonModule,
    PanelModule,
    AccordionModule,
    MessagesModule,
    MessageModule,
    RippleModule,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast />
    <p-confirmDialog />

    <div class="prescription-writer" [class.dark]="themeService.isDarkMode()">
      <!-- Header -->
      <header class="writer-header">
        <div class="header-left">
          <h1>
            <i class="pi pi-file-edit"></i>
            Prescription Writer
          </h1>
          <p class="subtitle">e-Prescribe medications for {{ patientName() }}</p>
        </div>
        <div class="header-actions">
          <p-button 
            label="Medication History"
            icon="pi pi-history"
            [outlined]="true"
            (onClick)="showHistoryDialog.set(true)"
          />
          <p-button 
            label="Favorites"
            icon="pi pi-star"
            [outlined]="true"
            (onClick)="showFavoritesDialog.set(true)"
          />
        </div>
      </header>

      <!-- Patient Info Bar -->
      <section class="patient-bar">
        <div class="patient-info">
          <span class="patient-name-badge">{{ patientName() }}</span>
          <span class="patient-dob">DOB: {{ patientDob() | date:'shortDate' }}</span>
          <span class="patient-mrn">MRN: {{ patientMrn() }}</span>
        </div>
        <div class="patient-allergies">
          <span class="allergy-label">
            <i class="pi pi-exclamation-triangle"></i>
            Allergies:
          </span>
          @if (patientAllergies().length > 0) {
            @for (allergy of patientAllergies(); track allergy.allergen) {
              <p-chip 
                [label]="allergy.allergen"
                styleClass="allergy-chip"
                [pTooltip]="allergy.reaction"
              />
            }
          } @else {
            <span class="no-allergies">NKDA</span>
          }
        </div>
        <div class="pharmacy-info">
          <span class="pharmacy-label">Pharmacy:</span>
          <span class="pharmacy-name">{{ selectedPharmacy()?.name || 'Not selected' }}</span>
          <p-button 
            icon="pi pi-pencil"
            [rounded]="true"
            [text]="true"
            size="small"
            (onClick)="showPharmacyDialog.set(true)"
          />
        </div>
      </section>

      <!-- Alerts Section -->
      @if (alerts().length > 0) {
        <section class="alerts-section">
          @for (alert of alerts(); track alert.title) {
            <div class="alert-item" [class]="alert.severity">
              <i [class]="getAlertIcon(alert.type)"></i>
              <div class="alert-content">
                <strong>{{ alert.title }}</strong>
                <span>{{ alert.message }}</span>
              </div>
              <p-button 
                icon="pi pi-times"
                [rounded]="true"
                [text]="true"
                size="small"
                (onClick)="dismissAlert(alert)"
              />
            </div>
          }
        </section>
      }

      <!-- Main Content -->
      <div class="writer-content">
        <!-- Drug Search & Entry -->
        <section class="entry-section">
          <p-card styleClass="entry-card">
            <ng-template pTemplate="header">
              <div class="card-header">
                <h3>
                  <i class="pi pi-search"></i>
                  Add Medication
                </h3>
              </div>
            </ng-template>

            <div class="drug-search">
              <p-autoComplete
                [(ngModel)]="drugSearchQuery"
                [suggestions]="drugSuggestions()"
                (completeMethod)="searchDrugs($event)"
                (onSelect)="onDrugSelect($event)"
                field="displayName"
                placeholder="Search medication by name, generic, or NDC..."
                styleClass="drug-search-input"
                [dropdown]="true"
              >
                <ng-template let-drug pTemplate="item">
                  <div class="drug-option">
                    <div class="drug-main">
                      <span class="drug-name">{{ drug.name }}</span>
                      @if (drug.controlledSubstance) {
                        <p-tag 
                          [value]="'C-' + drug.schedule" 
                          severity="danger"
                          [rounded]="true"
                        />
                      }
                    </div>
                    <div class="drug-meta">
                      <span class="generic">{{ drug.genericName }}</span>
                      <span class="class">{{ drug.drugClass }}</span>
                    </div>
                  </div>
                </ng-template>
              </p-autoComplete>
            </div>

            @if (selectedDrug()) {
              <p-divider />
              
              <div class="prescription-form">
                <div class="selected-drug-header">
                  <div class="drug-info">
                    <h4>{{ selectedDrug()!.name }}</h4>
                    <span class="generic-name">{{ selectedDrug()!.genericName }}</span>
                  </div>
                  @if (selectedDrug()!.controlledSubstance) {
                    <p-tag 
                      [value]="'Schedule ' + selectedDrug()!.schedule" 
                      severity="danger"
                    />
                  }
                </div>

                <!-- Drug Warnings -->
                @if (selectedDrug()!.warnings.length > 0) {
                  <div class="drug-warnings">
                    @for (warning of selectedDrug()!.warnings; track warning) {
                      <p-message severity="warn" [text]="warning" />
                    }
                  </div>
                }

                <div class="form-grid">
                  <!-- Strength -->
                  <div class="form-field">
                    <label>Strength <span class="required">*</span></label>
                    <p-select
                      [(ngModel)]="prescriptionForm.strength"
                      [options]="strengthOptions()"
                      placeholder="Select strength"
                      styleClass="w-full"
                    />
                  </div>

                  <!-- Form -->
                  <div class="form-field">
                    <label>Form <span class="required">*</span></label>
                    <p-select
                      [(ngModel)]="prescriptionForm.form"
                      [options]="formOptions()"
                      optionLabel="form"
                      optionValue="form"
                      placeholder="Select form"
                      styleClass="w-full"
                    />
                  </div>

                  <!-- Route -->
                  <div class="form-field">
                    <label>Route <span class="required">*</span></label>
                    <p-select
                      [(ngModel)]="prescriptionForm.route"
                      [options]="routeOptions"
                      placeholder="Select route"
                      styleClass="w-full"
                    />
                  </div>

                  <!-- Quantity -->
                  <div class="form-field">
                    <label>Quantity <span class="required">*</span></label>
                    <div class="quantity-input">
                      <p-inputNumber
                        [(ngModel)]="prescriptionForm.quantity"
                        [min]="1"
                        [max]="1000"
                        styleClass="w-full"
                      />
                      <p-select
                        [(ngModel)]="prescriptionForm.quantityUnit"
                        [options]="quantityUnits"
                        styleClass="unit-select"
                      />
                    </div>
                  </div>

                  <!-- Days Supply -->
                  <div class="form-field">
                    <label>Days Supply <span class="required">*</span></label>
                    <p-inputNumber
                      [(ngModel)]="prescriptionForm.daysSupply"
                      [min]="1"
                      [max]="365"
                      styleClass="w-full"
                    />
                  </div>

                  <!-- Refills -->
                  <div class="form-field">
                    <label>Refills</label>
                    <p-inputNumber
                      [(ngModel)]="prescriptionForm.refills"
                      [min]="0"
                      [max]="selectedDrug()!.controlledSubstance ? 0 : 11"
                      styleClass="w-full"
                    />
                    @if (selectedDrug()!.controlledSubstance) {
                      <small class="field-hint">No refills for controlled substances</small>
                    }
                  </div>
                </div>

                <!-- SIG (Instructions) -->
                <div class="form-field full-width">
                  <label>Sig (Patient Instructions) <span class="required">*</span></label>
                  <div class="sig-builder">
                    <div class="sig-shortcuts">
                      @for (shortcut of sigShortcuts; track shortcut.label) {
                        <p-button 
                          [label]="shortcut.label"
                          size="small"
                          [outlined]="true"
                          (onClick)="applySigShortcut(shortcut.value)"
                        />
                      }
                    </div>
                    <textarea 
                      pInputTextarea 
                      [(ngModel)]="prescriptionForm.sig"
                      rows="3"
                      placeholder="Take 1 tablet by mouth once daily"
                      class="sig-textarea"
                    ></textarea>
                  </div>
                </div>

                <!-- DAW -->
                <div class="form-field checkbox-field">
                  <p-checkbox 
                    [(ngModel)]="prescriptionForm.dispenseAsWritten"
                    [binary]="true"
                    inputId="daw"
                  />
                  <label for="daw">Dispense as Written (DAW) - No substitutions</label>
                </div>

                <!-- Notes -->
                <div class="form-field full-width">
                  <label>Pharmacist Notes</label>
                  <textarea 
                    pInputTextarea 
                    [(ngModel)]="prescriptionForm.notes"
                    rows="2"
                    placeholder="Additional instructions for pharmacist..."
                  ></textarea>
                </div>

                <!-- Add Actions -->
                <div class="form-actions">
                  <p-button 
                    label="Clear"
                    [outlined]="true"
                    severity="secondary"
                    (onClick)="clearForm()"
                  />
                  <p-button 
                    label="Add to Order"
                    icon="pi pi-plus"
                    (onClick)="addPrescription()"
                    [disabled]="!isFormValid()"
                  />
                </div>
              </div>
            }
          </p-card>
        </section>

        <!-- Prescription Queue -->
        <section class="queue-section">
          <p-card styleClass="queue-card">
            <ng-template pTemplate="header">
              <div class="card-header">
                <h3>
                  <i class="pi pi-list"></i>
                  Prescription Order
                  @if (prescriptionQueue().length > 0) {
                    <p-badge [value]="prescriptionQueue().length.toString()" />
                  }
                </h3>
                @if (prescriptionQueue().length > 0) {
                  <p-button 
                    label="Clear All"
                    [text]="true"
                    severity="danger"
                    size="small"
                    (onClick)="clearQueue()"
                  />
                }
              </div>
            </ng-template>

            @if (prescriptionQueue().length > 0) {
              <div class="queue-list">
                @for (rx of prescriptionQueue(); track rx.id; let i = $index) {
                  <div class="queue-item">
                    <div class="rx-number">{{ i + 1 }}</div>
                    <div class="rx-info">
                      <div class="rx-header">
                        <span class="rx-name">{{ rx.drugName }}</span>
                        <span class="rx-strength">{{ rx.strength }}</span>
                      </div>
                      <div class="rx-sig">{{ rx.sig }}</div>
                      <div class="rx-details">
                        <span>Qty: {{ rx.quantity }} {{ rx.quantityUnit }}</span>
                        <span>Days: {{ rx.daysSupply }}</span>
                        <span>Refills: {{ rx.refills }}</span>
                      </div>
                    </div>
                    <div class="rx-actions">
                      <p-button 
                        icon="pi pi-pencil"
                        [rounded]="true"
                        [text]="true"
                        size="small"
                        (onClick)="editPrescription(rx)"
                      />
                      <p-button 
                        icon="pi pi-trash"
                        [rounded]="true"
                        [text]="true"
                        size="small"
                        severity="danger"
                        (onClick)="removePrescription(rx)"
                      />
                    </div>
                  </div>
                }
              </div>

              <p-divider />

              <div class="queue-actions">
                <p-button 
                  label="Save as Draft"
                  icon="pi pi-save"
                  [outlined]="true"
                  (onClick)="saveAsDraft()"
                />
                <p-button 
                  label="Print Prescriptions"
                  icon="pi pi-print"
                  [outlined]="true"
                  (onClick)="printPrescriptions()"
                />
                <p-button 
                  label="Send to Pharmacy"
                  icon="pi pi-send"
                  (onClick)="sendToPharmacy()"
                  [loading]="sending()"
                />
              </div>
            } @else {
              <div class="empty-queue">
                <i class="pi pi-inbox"></i>
                <p>No prescriptions added</p>
                <span>Search for a medication above to begin</span>
              </div>
            }
          </p-card>

          <!-- Quick Reference -->
          <p-panel header="Drug Information" [toggleable]="true" [collapsed]="true" styleClass="info-panel">
            @if (selectedDrug()) {
              <div class="drug-reference">
                <div class="ref-section">
                  <h5>Class</h5>
                  <p>{{ selectedDrug()!.drugClass }}</p>
                </div>
                @if (selectedDrug()!.contraindications.length > 0) {
                  <div class="ref-section">
                    <h5>Contraindications</h5>
                    <ul>
                      @for (ci of selectedDrug()!.contraindications; track ci) {
                        <li>{{ ci }}</li>
                      }
                    </ul>
                  </div>
                }
                @if (selectedDrug()!.interactions.length > 0) {
                  <div class="ref-section">
                    <h5>Known Interactions</h5>
                    @for (interaction of selectedDrug()!.interactions; track interaction.drugId) {
                      <div class="interaction-item" [class]="interaction.severity">
                        <span class="interaction-drug">{{ interaction.drugName }}</span>
                        <p-tag 
                          [value]="interaction.severity | titlecase"
                          [severity]="getInteractionSeverity(interaction.severity)"
                          [rounded]="true"
                        />
                        <span class="interaction-desc">{{ interaction.description }}</span>
                      </div>
                    }
                  </div>
                }
              </div>
            } @else {
              <p class="no-selection">Select a medication to view information</p>
            }
          </p-panel>
        </section>
      </div>

      <!-- Pharmacy Selection Dialog -->
      <p-dialog 
        header="Select Pharmacy" 
        [(visible)]="showPharmacyDialog"
        [modal]="true"
        [style]="{ width: '500px' }"
      >
        <div class="pharmacy-search">
          <p-autoComplete
            [(ngModel)]="pharmacySearch"
            [suggestions]="pharmacySuggestions()"
            (completeMethod)="searchPharmacies($event)"
            (onSelect)="selectPharmacy($event)"
            field="name"
            placeholder="Search pharmacy by name or address..."
            styleClass="w-full"
          >
            <ng-template let-pharmacy pTemplate="item">
              <div class="pharmacy-option">
                <span class="pharmacy-name">{{ pharmacy.name }}</span>
                <span class="pharmacy-address">{{ pharmacy.address }}</span>
                <span class="pharmacy-phone">{{ pharmacy.phone }}</span>
              </div>
            </ng-template>
          </p-autoComplete>
        </div>

        <div class="recent-pharmacies">
          <h4>Recent Pharmacies</h4>
          @for (pharmacy of recentPharmacies; track pharmacy.id) {
            <div 
              class="pharmacy-item"
              [class.selected]="selectedPharmacy()?.id === pharmacy.id"
              (click)="selectPharmacy(pharmacy)"
              pRipple
            >
              <i class="pi pi-building"></i>
              <div class="pharmacy-details">
                <span class="name">{{ pharmacy.name }}</span>
                <span class="address">{{ pharmacy.address }}</span>
              </div>
              @if (selectedPharmacy()?.id === pharmacy.id) {
                <i class="pi pi-check selected-check"></i>
              }
            </div>
          }
        </div>
      </p-dialog>

      <!-- Medication History Dialog -->
      <p-dialog 
        header="Medication History" 
        [(visible)]="showHistoryDialog"
        [modal]="true"
        [style]="{ width: '700px' }"
      >
        <p-table [value]="medicationHistory" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>Medication</th>
              <th>Sig</th>
              <th>Prescribed</th>
              <th>Status</th>
              <th></th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-med>
            <tr>
              <td>
                <div class="med-cell">
                  <span class="med-name">{{ med.drugName }}</span>
                  <span class="med-strength">{{ med.strength }}</span>
                </div>
              </td>
              <td>{{ med.sig }}</td>
              <td>{{ med.startDate | date:'shortDate' }}</td>
              <td>
                <p-tag 
                  [value]="med.status | titlecase"
                  [severity]="getStatusSeverity(med.status)"
                  [rounded]="true"
                />
              </td>
              <td>
                <p-button 
                  icon="pi pi-refresh"
                  [rounded]="true"
                  [text]="true"
                  size="small"
                  pTooltip="Refill"
                  (onClick)="refillPrescription(med)"
                />
              </td>
            </tr>
          </ng-template>
        </p-table>
      </p-dialog>

      <!-- Favorites Dialog -->
      <p-dialog 
        header="Favorite Prescriptions" 
        [(visible)]="showFavoritesDialog"
        [modal]="true"
        [style]="{ width: '600px' }"
      >
        <div class="favorites-list">
          @for (fav of favorites; track fav.id) {
            <div class="favorite-item" (click)="applyFavorite(fav)" pRipple>
              <div class="fav-info">
                <span class="fav-name">{{ fav.drugName }}</span>
                <span class="fav-details">{{ fav.strength }} | {{ fav.sig }}</span>
              </div>
              <p-button 
                icon="pi pi-plus"
                [rounded]="true"
                [text]="true"
              />
            </div>
          } @empty {
            <div class="no-favorites">
              <i class="pi pi-star"></i>
              <p>No favorites saved</p>
              <span>Add prescriptions to favorites for quick access</span>
            </div>
          }
        </div>
      </p-dialog>
    </div>
  `,
  styles: [`
    .prescription-writer {
      min-height: 100vh;
      background: #f8fafc;
    }

    /* Header */
    .writer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      background: white;
      border-bottom: 1px solid #e5e7eb;
    }

    .writer-header h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .writer-header h1 i {
      color: #3b82f6;
    }

    .subtitle {
      margin: 0.25rem 0 0;
      color: #64748b;
      font-size: 0.875rem;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    /* Patient Bar */
    .patient-bar {
      display: flex;
      align-items: center;
      gap: 2rem;
      padding: 0.875rem 2rem;
      background: #eff6ff;
      border-bottom: 1px solid #bfdbfe;
      flex-wrap: wrap;
    }

    .patient-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .patient-name-badge {
      font-weight: 600;
      color: #1e40af;
    }

    .patient-dob,
    .patient-mrn {
      font-size: 0.875rem;
      color: #3b82f6;
    }

    .patient-allergies {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex: 1;
    }

    .allergy-label {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-weight: 500;
      color: #dc2626;
    }

    :host ::ng-deep .allergy-chip {
      background: #fee2e2 !important;
      color: #dc2626 !important;
    }

    .no-allergies {
      font-weight: 500;
      color: #10b981;
    }

    .pharmacy-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .pharmacy-label {
      font-size: 0.875rem;
      color: #64748b;
    }

    .pharmacy-name {
      font-weight: 500;
      color: #1e293b;
    }

    /* Alerts Section */
    .alerts-section {
      padding: 1rem 2rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .alert-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      border-left: 4px solid;
    }

    .alert-item.warn {
      background: #fef3c7;
      border-color: #f59e0b;
    }

    .alert-item.error {
      background: #fee2e2;
      border-color: #ef4444;
    }

    .alert-item.info {
      background: #eff6ff;
      border-color: #3b82f6;
    }

    .alert-item i {
      font-size: 1.25rem;
    }

    .alert-item.warn i { color: #f59e0b; }
    .alert-item.error i { color: #ef4444; }
    .alert-item.info i { color: #3b82f6; }

    .alert-content {
      flex: 1;
    }

    .alert-content strong {
      display: block;
      color: #1e293b;
    }

    .alert-content span {
      font-size: 0.875rem;
      color: #64748b;
    }

    /* Main Content */
    .writer-content {
      display: grid;
      grid-template-columns: 1fr 400px;
      gap: 1.5rem;
      padding: 1.5rem 2rem;
    }

    /* Entry Section */
    :host ::ng-deep .entry-card {
      height: fit-content;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .card-header h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .card-header h3 i {
      color: #3b82f6;
    }

    .drug-search {
      padding: 1rem;
    }

    :host ::ng-deep .drug-search-input {
      width: 100%;
    }

    .drug-option {
      padding: 0.5rem;
    }

    .drug-main {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .drug-name {
      font-weight: 500;
      color: #1e293b;
    }

    .drug-meta {
      display: flex;
      gap: 1rem;
      font-size: 0.75rem;
      color: #64748b;
    }

    .prescription-form {
      padding: 1rem;
    }

    .selected-drug-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .selected-drug-header h4 {
      margin: 0;
      color: #1e293b;
    }

    .generic-name {
      font-size: 0.875rem;
      color: #64748b;
    }

    .drug-warnings {
      margin-bottom: 1rem;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-field.full-width {
      grid-column: 1 / -1;
    }

    .form-field label {
      font-weight: 500;
      color: #374151;
      font-size: 0.875rem;
    }

    .required {
      color: #ef4444;
    }

    .quantity-input {
      display: flex;
      gap: 0.5rem;
    }

    :host ::ng-deep .unit-select {
      width: 100px;
    }

    .field-hint {
      font-size: 0.75rem;
      color: #f59e0b;
    }

    .checkbox-field {
      flex-direction: row;
      align-items: center;
      gap: 0.75rem;
    }

    .sig-builder {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .sig-shortcuts {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }

    .sig-textarea {
      width: 100%;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
    }

    /* Queue Section */
    .queue-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    :host ::ng-deep .queue-card {
      height: fit-content;
    }

    .queue-list {
      display: flex;
      flex-direction: column;
    }

    .queue-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .rx-number {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #3b82f6;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
      flex-shrink: 0;
    }

    .rx-info {
      flex: 1;
    }

    .rx-header {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
    }

    .rx-name {
      font-weight: 600;
      color: #1e293b;
    }

    .rx-strength {
      color: #64748b;
    }

    .rx-sig {
      font-size: 0.875rem;
      color: #374151;
      margin-bottom: 0.25rem;
    }

    .rx-details {
      display: flex;
      gap: 1rem;
      font-size: 0.75rem;
      color: #64748b;
    }

    .rx-actions {
      display: flex;
      gap: 0.25rem;
    }

    .queue-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      padding: 1rem;
    }

    .empty-queue {
      text-align: center;
      padding: 2rem;
      color: #94a3b8;
    }

    .empty-queue i {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      opacity: 0.5;
    }

    .empty-queue p {
      margin: 0;
      font-weight: 500;
      color: #64748b;
    }

    .empty-queue span {
      font-size: 0.875rem;
    }

    /* Drug Reference Panel */
    :host ::ng-deep .info-panel {
      font-size: 0.875rem;
    }

    .drug-reference {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .ref-section h5 {
      margin: 0 0 0.5rem;
      color: #374151;
      font-size: 0.8125rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .ref-section p {
      margin: 0;
      color: #1e293b;
    }

    .ref-section ul {
      margin: 0;
      padding-left: 1.25rem;
      color: #64748b;
    }

    .interaction-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      padding: 0.5rem;
      background: #f8fafc;
      border-radius: 6px;
      margin-bottom: 0.5rem;
    }

    .interaction-drug {
      font-weight: 500;
      color: #1e293b;
    }

    .interaction-desc {
      flex-basis: 100%;
      font-size: 0.75rem;
      color: #64748b;
    }

    .no-selection {
      text-align: center;
      color: #94a3b8;
      padding: 1rem;
    }

    /* Pharmacy Dialog */
    .pharmacy-search {
      margin-bottom: 1rem;
    }

    .pharmacy-option {
      display: flex;
      flex-direction: column;
      padding: 0.5rem;
    }

    .pharmacy-option .pharmacy-name {
      font-weight: 500;
      color: #1e293b;
    }

    .pharmacy-option .pharmacy-address,
    .pharmacy-option .pharmacy-phone {
      font-size: 0.75rem;
      color: #64748b;
    }

    .recent-pharmacies h4 {
      margin: 0 0 0.75rem;
      color: #374151;
      font-size: 0.875rem;
    }

    .pharmacy-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .pharmacy-item:hover {
      background: #f1f5f9;
    }

    .pharmacy-item.selected {
      background: #eff6ff;
      border: 1px solid #3b82f6;
    }

    .pharmacy-details {
      flex: 1;
    }

    .pharmacy-details .name {
      display: block;
      font-weight: 500;
      color: #1e293b;
    }

    .pharmacy-details .address {
      font-size: 0.75rem;
      color: #64748b;
    }

    .selected-check {
      color: #3b82f6;
    }

    /* Medication History Table */
    .med-cell {
      display: flex;
      flex-direction: column;
    }

    .med-name {
      font-weight: 500;
      color: #1e293b;
    }

    .med-strength {
      font-size: 0.75rem;
      color: #64748b;
    }

    /* Favorites */
    .favorites-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .favorite-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .favorite-item:hover {
      background: #eff6ff;
    }

    .fav-info {
      display: flex;
      flex-direction: column;
    }

    .fav-name {
      font-weight: 500;
      color: #1e293b;
    }

    .fav-details {
      font-size: 0.75rem;
      color: #64748b;
    }

    .no-favorites {
      text-align: center;
      padding: 2rem;
      color: #94a3b8;
    }

    .no-favorites i {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    /* Dark Mode */
    .prescription-writer.dark {
      background: #0f172a;
    }

    .dark .writer-header {
      background: #1e293b;
      border-color: #334155;
    }

    .dark .patient-bar {
      background: #1e3a5f;
      border-color: #334155;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .writer-content {
        grid-template-columns: 1fr;
      }

      .form-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .patient-bar {
        flex-direction: column;
        align-items: flex-start;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PrescriptionWriterComponent implements OnInit, OnDestroy {
  readonly themeService = inject(ThemeService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly destroy$ = new Subject<void>();

  // Inputs
  patientId = input<string>();
  patientName = input<string>('John Smith');
  patientDob = input<Date>(new Date('1960-05-15'));
  patientMrn = input<string>('MRN-2024-001');

  // Outputs
  prescriptionSent = output<Prescription[]>();

  // Signals
  drugSuggestions = signal<Drug[]>([]);
  selectedDrug = signal<Drug | null>(null);
  prescriptionQueue = signal<Prescription[]>([]);
  alerts = signal<AlertMessage[]>([]);
  patientAllergies = signal<PatientAllergy[]>([
    { allergen: 'Penicillin', type: 'drug', severity: 'severe', reaction: 'Anaphylaxis' },
    { allergen: 'Sulfa', type: 'drug', severity: 'moderate', reaction: 'Rash' },
  ]);
  selectedPharmacy = signal<any>(null);
  pharmacySuggestions = signal<any[]>([]);
  sending = signal(false);
  showPharmacyDialog = signal(false);
  showHistoryDialog = signal(false);
  showFavoritesDialog = signal(false);

  // Form state
  drugSearchQuery = '';
  pharmacySearch = '';
  prescriptionForm = {
    strength: '',
    form: '',
    route: '',
    quantity: 30,
    quantityUnit: 'tablets',
    daysSupply: 30,
    refills: 0,
    sig: '',
    dispenseAsWritten: false,
    notes: '',
  };

  // Options
  routeOptions = [
    { label: 'Oral', value: 'oral' },
    { label: 'Topical', value: 'topical' },
    { label: 'Subcutaneous', value: 'subcutaneous' },
    { label: 'Intramuscular', value: 'intramuscular' },
    { label: 'Intravenous', value: 'intravenous' },
    { label: 'Inhalation', value: 'inhalation' },
    { label: 'Ophthalmic', value: 'ophthalmic' },
    { label: 'Otic', value: 'otic' },
    { label: 'Nasal', value: 'nasal' },
    { label: 'Rectal', value: 'rectal' },
  ];

  quantityUnits = [
    { label: 'tablets', value: 'tablets' },
    { label: 'capsules', value: 'capsules' },
    { label: 'mL', value: 'mL' },
    { label: 'grams', value: 'grams' },
    { label: 'patches', value: 'patches' },
    { label: 'inhalers', value: 'inhalers' },
  ];

  sigShortcuts = [
    { label: 'QD', value: 'Take once daily' },
    { label: 'BID', value: 'Take twice daily' },
    { label: 'TID', value: 'Take three times daily' },
    { label: 'QID', value: 'Take four times daily' },
    { label: 'PRN', value: 'Take as needed' },
    { label: 'QHS', value: 'Take at bedtime' },
    { label: 'AC', value: 'Take before meals' },
    { label: 'PC', value: 'Take after meals' },
  ];

  recentPharmacies = [
    { id: '1', name: 'CVS Pharmacy', address: '123 Main St, Anytown, USA', phone: '(555) 123-4567', ncpdpId: '1234567' },
    { id: '2', name: 'Walgreens', address: '456 Oak Ave, Anytown, USA', phone: '(555) 234-5678', ncpdpId: '2345678' },
    { id: '3', name: 'Rite Aid', address: '789 Elm Blvd, Anytown, USA', phone: '(555) 345-6789', ncpdpId: '3456789' },
  ];

  medicationHistory: Prescription[] = [
    { id: '1', drugId: 'd1', drugName: 'Lisinopril', genericName: 'Lisinopril', strength: '10mg', form: 'tablet', route: 'oral', quantity: 30, quantityUnit: 'tablets', daysSupply: 30, refills: 5, sig: 'Take 1 tablet by mouth once daily', dispenseAsWritten: false, startDate: new Date(Date.now() - 86400000 * 90), status: 'filled' },
    { id: '2', drugId: 'd2', drugName: 'Metformin', genericName: 'Metformin', strength: '500mg', form: 'tablet', route: 'oral', quantity: 60, quantityUnit: 'tablets', daysSupply: 30, refills: 3, sig: 'Take 1 tablet by mouth twice daily', dispenseAsWritten: false, startDate: new Date(Date.now() - 86400000 * 60), status: 'filled' },
    { id: '3', drugId: 'd3', drugName: 'Atorvastatin', genericName: 'Atorvastatin', strength: '20mg', form: 'tablet', route: 'oral', quantity: 30, quantityUnit: 'tablets', daysSupply: 30, refills: 2, sig: 'Take 1 tablet by mouth at bedtime', dispenseAsWritten: false, startDate: new Date(Date.now() - 86400000 * 30), status: 'sent' },
  ];

  favorites: any[] = [
    { id: '1', drugName: 'Lisinopril', strength: '10mg', sig: 'Take 1 tablet by mouth once daily' },
    { id: '2', drugName: 'Metformin', strength: '500mg', sig: 'Take 1 tablet by mouth twice daily with meals' },
  ];

  // Mock drug database
  drugDatabase: Drug[] = [
    {
      id: 'd1', name: 'Lisinopril', genericName: 'Lisinopril', brandNames: ['Zestril', 'Prinivil'], ndc: '00000-0001-01',
      drugClass: 'ACE Inhibitor', controlledSubstance: false,
      forms: [{ form: 'tablet', route: 'oral' }], strengths: ['2.5mg', '5mg', '10mg', '20mg', '40mg'],
      defaultSig: 'Take 1 tablet by mouth once daily',
      warnings: ['Monitor potassium levels', 'May cause dry cough'],
      contraindications: ['Pregnancy', 'History of angioedema'],
      interactions: []
    },
    {
      id: 'd2', name: 'Metformin', genericName: 'Metformin HCl', brandNames: ['Glucophage'], ndc: '00000-0002-01',
      drugClass: 'Biguanide', controlledSubstance: false,
      forms: [{ form: 'tablet', route: 'oral' }, { form: 'extended-release tablet', route: 'oral' }],
      strengths: ['500mg', '850mg', '1000mg'],
      defaultSig: 'Take 1 tablet by mouth twice daily with meals',
      warnings: ['Hold before contrast procedures', 'Monitor renal function'],
      contraindications: ['Renal impairment (eGFR < 30)', 'Metabolic acidosis'],
      interactions: []
    },
    {
      id: 'd3', name: 'Atorvastatin', genericName: 'Atorvastatin Calcium', brandNames: ['Lipitor'], ndc: '00000-0003-01',
      drugClass: 'HMG-CoA Reductase Inhibitor (Statin)', controlledSubstance: false,
      forms: [{ form: 'tablet', route: 'oral' }], strengths: ['10mg', '20mg', '40mg', '80mg'],
      defaultSig: 'Take 1 tablet by mouth at bedtime',
      warnings: ['Monitor liver enzymes', 'Report muscle pain immediately'],
      contraindications: ['Active liver disease', 'Pregnancy'],
      interactions: [
        { drugId: 'grapefruit', drugName: 'Grapefruit juice', severity: 'moderate', description: 'Increases statin levels' }
      ]
    },
    {
      id: 'd4', name: 'Amoxicillin', genericName: 'Amoxicillin', brandNames: ['Amoxil'], ndc: '00000-0004-01',
      drugClass: 'Penicillin Antibiotic', controlledSubstance: false,
      forms: [{ form: 'capsule', route: 'oral' }, { form: 'suspension', route: 'oral' }],
      strengths: ['250mg', '500mg', '875mg'],
      defaultSig: 'Take 1 capsule by mouth three times daily',
      warnings: ['Complete full course of therapy'],
      contraindications: ['Penicillin allergy'],
      interactions: []
    },
    {
      id: 'd5', name: 'Oxycodone', genericName: 'Oxycodone HCl', brandNames: ['OxyContin', 'Roxicodone'], ndc: '00000-0005-01',
      drugClass: 'Opioid Analgesic', controlledSubstance: true, schedule: 'II',
      forms: [{ form: 'tablet', route: 'oral' }], strengths: ['5mg', '10mg', '15mg', '20mg', '30mg'],
      defaultSig: 'Take 1 tablet by mouth every 4-6 hours as needed for pain',
      warnings: ['Risk of addiction', 'Do not use with alcohol', 'May cause respiratory depression'],
      contraindications: ['Respiratory depression', 'Paralytic ileus', 'Concurrent MAO inhibitor use'],
      interactions: [
        { drugId: 'benzo', drugName: 'Benzodiazepines', severity: 'severe', description: 'Increased risk of respiratory depression' }
      ]
    },
  ];

  // Computed
  strengthOptions = computed(() => {
    const drug = this.selectedDrug();
    return drug ? drug.strengths.map(s => ({ label: s, value: s })) : [];
  });

  formOptions = computed(() => {
    const drug = this.selectedDrug();
    return drug ? drug.forms : [];
  });

  ngOnInit(): void {
    this.selectedPharmacy.set(this.recentPharmacies[0]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  searchDrugs(event: any): void {
    const query = event.query.toLowerCase();
    const results = this.drugDatabase.filter(d =>
      d.name.toLowerCase().includes(query) ||
      d.genericName.toLowerCase().includes(query) ||
      d.brandNames.some(b => b.toLowerCase().includes(query))
    ).map(d => ({ ...d, displayName: `${d.name} (${d.genericName})` }));
    this.drugSuggestions.set(results);
  }

  onDrugSelect(event: AutoCompleteSelectEvent): void {
    const drug = event.value as Drug;
    this.selectDrug(drug);
  }

  private checkAllergyInteractions(drug: Drug): void {
    const allergies = this.patientAllergies();
    
    // Check penicillin allergy for amoxicillin
    if (drug.drugClass.toLowerCase().includes('penicillin')) {
      const penAllergy = allergies.find(a => a.allergen.toLowerCase() === 'penicillin');
      if (penAllergy) {
        this.alerts.update(alerts => [...alerts, {
          type: 'allergy',
          severity: 'error',
          title: 'Allergy Alert',
          message: `Patient has documented ${penAllergy.severity} allergy to Penicillin. ${drug.name} is contraindicated.`,
          drugId: drug.id
        }]);
      }
    }
  }

  private checkDrugInteractions(drug: Drug): void {
    // Check against current medications
    for (const interaction of drug.interactions) {
      this.alerts.update(alerts => [...alerts, {
        type: 'interaction',
        severity: interaction.severity === 'severe' ? 'error' : 'warn',
        title: 'Drug Interaction',
        message: `${drug.name} interacts with ${interaction.drugName}: ${interaction.description}`,
        drugId: drug.id
      }]);
    }
  }

  applySigShortcut(value: string): void {
    this.prescriptionForm.sig = value;
  }

  isFormValid(): boolean {
    return !!(
      this.selectedDrug() &&
      this.prescriptionForm.strength &&
      this.prescriptionForm.form &&
      this.prescriptionForm.route &&
      this.prescriptionForm.quantity > 0 &&
      this.prescriptionForm.daysSupply > 0 &&
      this.prescriptionForm.sig
    );
  }

  clearForm(): void {
    this.selectedDrug.set(null);
    this.prescriptionForm = {
      strength: '',
      form: '',
      route: '',
      quantity: 30,
      quantityUnit: 'tablets',
      daysSupply: 30,
      refills: 0,
      sig: '',
      dispenseAsWritten: false,
      notes: '',
    };
    this.alerts.set([]);
  }

  addPrescription(): void {
    const drug = this.selectedDrug();
    if (!drug || !this.isFormValid()) return;

    const rx: Prescription = {
      id: `rx-${Date.now()}`,
      drugId: drug.id,
      drugName: drug.name,
      genericName: drug.genericName,
      strength: this.prescriptionForm.strength,
      form: this.prescriptionForm.form,
      route: this.prescriptionForm.route,
      quantity: this.prescriptionForm.quantity,
      quantityUnit: this.prescriptionForm.quantityUnit,
      daysSupply: this.prescriptionForm.daysSupply,
      refills: this.prescriptionForm.refills,
      sig: this.prescriptionForm.sig,
      dispenseAsWritten: this.prescriptionForm.dispenseAsWritten,
      notes: this.prescriptionForm.notes,
      startDate: new Date(),
      status: 'draft'
    };

    this.prescriptionQueue.update(queue => [...queue, rx]);
    this.clearForm();
    this.messageService.add({ severity: 'success', summary: 'Added', detail: `${rx.drugName} added to prescription order` });
  }

  editPrescription(rx: Prescription): void {
    // Find and load the drug
    const drug = this.drugDatabase.find(d => d.id === rx.drugId);
    if (drug) {
      this.selectedDrug.set(drug);
      this.prescriptionForm = {
        strength: rx.strength,
        form: rx.form,
        route: rx.route,
        quantity: rx.quantity,
        quantityUnit: rx.quantityUnit,
        daysSupply: rx.daysSupply,
        refills: rx.refills,
        sig: rx.sig,
        dispenseAsWritten: rx.dispenseAsWritten,
        notes: rx.notes || '',
      };
      // Remove from queue
      this.prescriptionQueue.update(queue => queue.filter(r => r.id !== rx.id));
    }
  }

  removePrescription(rx: Prescription): void {
    this.prescriptionQueue.update(queue => queue.filter(r => r.id !== rx.id));
    this.messageService.add({ severity: 'info', summary: 'Removed', detail: `${rx.drugName} removed from order` });
  }

  clearQueue(): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to clear all prescriptions?',
      accept: () => {
        this.prescriptionQueue.set([]);
      }
    });
  }

  saveAsDraft(): void {
    this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Prescriptions saved as draft' });
  }

  printPrescriptions(): void {
    this.messageService.add({ severity: 'info', summary: 'Printing', detail: 'Sending to printer...' });
  }

  sendToPharmacy(): void {
    if (!this.selectedPharmacy()) {
      this.showPharmacyDialog.set(true);
      return;
    }

    this.confirmationService.confirm({
      message: `Send ${this.prescriptionQueue().length} prescription(s) to ${this.selectedPharmacy().name}?`,
      accept: () => {
        this.sending.set(true);
        
        setTimeout(() => {
          const queue = this.prescriptionQueue();
          this.prescriptionSent.emit(queue);
          this.prescriptionQueue.set([]);
          this.sending.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Sent',
            detail: `${queue.length} prescription(s) sent to ${this.selectedPharmacy().name}`
          });
        }, 1500);
      }
    });
  }

  searchPharmacies(event: any): void {
    const query = event.query.toLowerCase();
    const results = this.recentPharmacies.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.address.toLowerCase().includes(query)
    );
    this.pharmacySuggestions.set(results);
  }

  selectPharmacy(pharmacy: any): void {
    this.selectedPharmacy.set(pharmacy);
    this.showPharmacyDialog.set(false);
  }

  private selectDrug(drug: Drug): void {
    this.selectedDrug.set(drug);
    this.drugSearchQuery = '';
    
    // Check for allergies
    this.checkAllergyInteractions(drug);
    
    // Check for drug interactions with current meds
    this.checkDrugInteractions(drug);
    
    // Set default values
    this.prescriptionForm.strength = drug.strengths[0];
    this.prescriptionForm.form = drug.forms[0].form;
    this.prescriptionForm.route = drug.forms[0].route;
    this.prescriptionForm.sig = drug.defaultSig;
    this.prescriptionForm.refills = drug.controlledSubstance ? 0 : 3;
  }

  refillPrescription(med: Prescription): void {
    const drug = this.drugDatabase.find(d => d.id === med.drugId);
    if (drug) {
      this.selectDrug(drug);
      this.prescriptionForm.strength = med.strength;
      this.prescriptionForm.quantity = med.quantity;
      this.prescriptionForm.daysSupply = med.daysSupply;
      this.prescriptionForm.sig = med.sig;
      this.showHistoryDialog.set(false);
    }
  }

  applyFavorite(fav: any): void {
    // Find drug in database
    const drug = this.drugDatabase.find(d => d.name === fav.drugName);
    if (drug) {
      this.selectDrug(drug);
      this.prescriptionForm.strength = fav.strength;
      this.prescriptionForm.sig = fav.sig;
    }
    this.showFavoritesDialog.set(false);
  }

  dismissAlert(alert: AlertMessage): void {
    this.alerts.update(alerts => alerts.filter(a => a !== alert));
  }

  getAlertIcon(type: string): string {
    const icons: Record<string, string> = {
      'interaction': 'pi pi-exclamation-triangle',
      'allergy': 'pi pi-ban',
      'duplicate': 'pi pi-copy',
      'dosing': 'pi pi-info-circle',
      'formulary': 'pi pi-dollar',
    };
    return icons[type] || 'pi pi-info-circle';
  }

  getInteractionSeverity(severity: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const severities: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      'mild': 'info',
      'moderate': 'warn',
      'severe': 'danger',
      'contraindicated': 'danger',
    };
    return severities[severity] || 'secondary';
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const severities: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      'draft': 'secondary',
      'pending': 'info',
      'sent': 'info',
      'filled': 'success',
      'cancelled': 'danger',
      'denied': 'danger',
    };
    return severities[status] || 'secondary';
  }
}
