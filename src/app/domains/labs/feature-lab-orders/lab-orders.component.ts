import { Component, inject, signal, computed, OnInit, OnDestroy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { AutoCompleteModule } from 'primeng/autocomplete';
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
import { TabViewModule } from 'primeng/tabview';
import { TreeModule } from 'primeng/tree';
import { TimelineModule } from 'primeng/timeline';
import { RippleModule } from 'primeng/ripple';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService, ConfirmationService, TreeNode } from 'primeng/api';

import { ThemeService } from '../../../core/services/theme.service';

interface LabTest {
  id: string;
  code: string;
  name: string;
  category: string;
  specimen: string;
  container: string;
  volume: string;
  turnaroundTime: string;
  specialInstructions?: string;
  cptCode: string;
  price?: number;
  requiresFasting?: boolean;
  criticalValues?: CriticalValue[];
}

interface CriticalValue {
  component: string;
  low?: number;
  high?: number;
  unit: string;
}

interface LabPanel {
  id: string;
  name: string;
  tests: string[]; // test IDs
  category: string;
  description: string;
}

interface LabOrder {
  id: string;
  patientId: string;
  patientName: string;
  encounterId?: string;
  orderingProvider: string;
  orderingProviderId: string;
  tests: LabOrderTest[];
  priority: OrderPriority;
  status: OrderStatus;
  clinicalNotes?: string;
  diagnosis?: string[];
  icdCodes?: string[];
  collectionType: CollectionType;
  scheduledDate?: Date;
  fasting?: boolean;
  orderedAt: Date;
  collectedAt?: Date;
  receivedAt?: Date;
  completedAt?: Date;
}

interface LabOrderTest {
  testId: string;
  testCode: string;
  testName: string;
  status: TestStatus;
  specimen?: string;
  collectedAt?: Date;
  result?: LabResult;
}

interface LabResult {
  value: string;
  unit: string;
  referenceRange: string;
  flag?: 'normal' | 'abnormal' | 'critical';
  interpretation?: string;
  performedAt: Date;
  verifiedBy?: string;
}

type OrderPriority = 'routine' | 'urgent' | 'stat';
type OrderStatus = 'draft' | 'pending' | 'collected' | 'in-progress' | 'completed' | 'cancelled';
type TestStatus = 'ordered' | 'collected' | 'received' | 'in-progress' | 'resulted' | 'verified';
type CollectionType = 'in-office' | 'lab-draw' | 'patient-collected';

interface DiagnosisCode {
  code: string;
  description: string;
}

@Component({
  selector: 'app-lab-orders',
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
    TabViewModule,
    TreeModule,
    TimelineModule,
    RippleModule,
    DatePickerModule,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast />
    <p-confirmDialog />

    <div class="lab-orders" [class.dark]="themeService.isDarkMode()">
      <!-- Header -->
      <header class="orders-header">
        <div class="header-left">
          <h1>
            <i class="pi pi-flask"></i>
            Lab Orders
          </h1>
          <p class="subtitle">Order laboratory tests and view results</p>
        </div>
        <div class="header-actions">
          <p-button 
            label="Order Set Library"
            icon="pi pi-book"
            [outlined]="true"
            (onClick)="showOrderSetsDialog.set(true)"
          />
          <p-button 
            label="New Lab Order"
            icon="pi pi-plus"
            (onClick)="startNewOrder()"
          />
        </div>
      </header>

      <!-- Patient Context -->
      @if (patientName()) {
        <section class="patient-context">
          <div class="patient-info">
            <span class="patient-name">{{ patientName() }}</span>
            <span class="patient-mrn">MRN: {{ patientMrn() }}</span>
            <span class="patient-dob">DOB: {{ patientDob() | date:'shortDate' }}</span>
          </div>
          <div class="recent-labs">
            <span class="label">Recent Labs:</span>
            @if (recentLabDates().length > 0) {
              @for (date of recentLabDates(); track date) {
                <p-chip [label]="(date | date:'shortDate') ?? ''" styleClass="date-chip" />
              }
            } @else {
              <span class="no-labs">No recent labs</span>
            }
          </div>
        </section>
      }

      <p-tabView styleClass="orders-tabs">
        <!-- New Order Tab -->
        <p-tabPanel header="New Order" leftIcon="pi pi-plus">
          <div class="new-order-content">
            <!-- Test Selection -->
            <section class="test-selection">
              <p-card styleClass="selection-card">
                <ng-template pTemplate="header">
                  <div class="card-header">
                    <h3>Select Tests</h3>
                    <div class="search-box">
                      <span class="p-input-icon-left">
                        <i class="pi pi-search"></i>
                        <input 
                          pInputText 
                          [(ngModel)]="testSearch"
                          placeholder="Search tests by name or code..."
                          class="test-search-input"
                        />
                      </span>
                    </div>
                  </div>
                </ng-template>

                <div class="test-browser">
                  <!-- Categories -->
                  <div class="category-tabs">
                    @for (category of testCategories; track category) {
                      <p-button 
                        [label]="category"
                        [outlined]="selectedCategory !== category"
                        [severity]="selectedCategory === category ? 'primary' : 'secondary'"
                        size="small"
                        (onClick)="selectCategory(category)"
                      />
                    }
                  </div>

                  <!-- Common Panels -->
                  <div class="panels-section">
                    <h4>Common Panels</h4>
                    <div class="panels-grid">
                      @for (panel of filteredPanels(); track panel.id) {
                        <div 
                          class="panel-card"
                          [class.selected]="isSelectedPanel(panel)"
                          (click)="togglePanel(panel)"
                          pRipple
                        >
                          <div class="panel-header">
                            <span class="panel-name">{{ panel.name }}</span>
                            @if (isSelectedPanel(panel)) {
                              <i class="pi pi-check-circle"></i>
                            }
                          </div>
                          <span class="panel-tests">{{ panel.tests.length }} tests</span>
                          <span class="panel-desc">{{ panel.description }}</span>
                        </div>
                      }
                    </div>
                  </div>

                  <!-- Individual Tests -->
                  <div class="tests-section">
                    <h4>Individual Tests</h4>
                    <div class="tests-list">
                      @for (test of filteredTests(); track test.id) {
                        <div 
                          class="test-item"
                          [class.selected]="isSelectedTest(test)"
                          (click)="toggleTest(test)"
                          pRipple
                        >
                          <p-checkbox 
                            [binary]="true"
                            [ngModel]="isSelectedTest(test)"
                            (click)="$event.stopPropagation()"
                            (onChange)="toggleTest(test)"
                          />
                          <div class="test-info">
                            <span class="test-name">{{ test.name }}</span>
                            <span class="test-code">{{ test.code }}</span>
                          </div>
                          <div class="test-meta">
                            <span class="specimen">{{ test.specimen }}</span>
                            <span class="tat">TAT: {{ test.turnaroundTime }}</span>
                          </div>
                          @if (test.requiresFasting) {
                            <p-tag value="Fasting" severity="warn" [rounded]="true" />
                          }
                        </div>
                      }
                    </div>
                  </div>
                </div>
              </p-card>
            </section>

            <!-- Order Details -->
            <section class="order-details">
              <p-card styleClass="details-card">
                <ng-template pTemplate="header">
                  <div class="card-header">
                    <h3>Order Details</h3>
                    <p-badge [value]="selectedTests().length.toString()" />
                  </div>
                </ng-template>

                <!-- Selected Tests Summary -->
                <div class="selected-tests">
                  <h4>Selected Tests</h4>
                  @if (selectedTests().length > 0) {
                    <div class="selected-list">
                      @for (test of selectedTests(); track test.id) {
                        <div class="selected-item">
                          <span class="item-name">{{ test.name }}</span>
                          <span class="item-specimen">{{ test.specimen }}</span>
                          <p-button 
                            icon="pi pi-times"
                            [rounded]="true"
                            [text]="true"
                            size="small"
                            (onClick)="removeTest(test)"
                          />
                        </div>
                      }
                    </div>
                  } @else {
                    <p class="no-selection">No tests selected</p>
                  }
                </div>

                <p-divider />

                <!-- Order Options -->
                <div class="order-options">
                  <!-- Priority -->
                  <div class="option-field">
                    <label>Priority</label>
                    <div class="priority-options">
                      @for (priority of priorityOptions; track priority.value) {
                        <div 
                          class="priority-option"
                          [class.selected]="orderPriority === priority.value"
                          [class]="priority.value"
                          (click)="orderPriority = priority.value"
                        >
                          <i [class]="priority.icon"></i>
                          <span>{{ priority.label }}</span>
                        </div>
                      }
                    </div>
                  </div>

                  <!-- Collection Type -->
                  <div class="option-field">
                    <label>Collection</label>
                    <p-select
                      [(ngModel)]="collectionType"
                      [options]="collectionOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Select collection type"
                      styleClass="w-full"
                    />
                  </div>

                  <!-- Fasting -->
                  <div class="option-field checkbox">
                    <p-checkbox 
                      [(ngModel)]="requiresFasting"
                      [binary]="true"
                      inputId="fasting"
                    />
                    <label for="fasting">Patient must fast (8+ hours)</label>
                  </div>

                  <!-- Scheduled Date -->
                  @if (collectionType === 'lab-draw') {
                    <div class="option-field">
                      <label>Scheduled Date</label>
                      <p-datepicker
                        [(ngModel)]="scheduledDate"
                        [showIcon]="true"
                        [minDate]="today"
                        dateFormat="mm/dd/yy"
                        styleClass="w-full"
                      />
                    </div>
                  }

                  <!-- Diagnosis -->
                  <div class="option-field">
                    <label>Diagnosis (ICD-10)</label>
                    <p-autoComplete
                      [(ngModel)]="diagnosisSearch"
                      [suggestions]="diagnosisSuggestions()"
                      (completeMethod)="searchDiagnosis($event)"
                      (onSelect)="addDiagnosis($event)"
                      field="display"
                      placeholder="Search diagnosis..."
                      styleClass="w-full"
                    />
                    @if (selectedDiagnoses().length > 0) {
                      <div class="diagnosis-chips">
                        @for (dx of selectedDiagnoses(); track dx.code) {
                          <p-chip 
                            [label]="dx.code + ' - ' + dx.description"
                            [removable]="true"
                            (onRemove)="removeDiagnosis(dx)"
                          />
                        }
                      </div>
                    }
                  </div>

                  <!-- Clinical Notes -->
                  <div class="option-field">
                    <label>Clinical Notes</label>
                    <textarea 
                      pInputTextarea 
                      [(ngModel)]="clinicalNotes"
                      rows="3"
                      placeholder="Relevant clinical information for lab..."
                    ></textarea>
                  </div>
                </div>

                <p-divider />

                <!-- Specimen Requirements Summary -->
                @if (specimenSummary().length > 0) {
                  <div class="specimen-summary">
                    <h4>Specimen Requirements</h4>
                    <div class="specimen-list">
                      @for (spec of specimenSummary(); track spec.type) {
                        <div class="specimen-item">
                          <div class="specimen-icon" [style.background-color]="getSpecimenColor(spec.type)">
                            <i class="pi pi-eyedropper"></i>
                          </div>
                          <div class="specimen-info">
                            <span class="specimen-type">{{ spec.type }}</span>
                            <span class="specimen-container">{{ spec.container }}</span>
                          </div>
                          <span class="specimen-volume">{{ spec.totalVolume }}</span>
                        </div>
                      }
                    </div>
                  </div>

                  <p-divider />
                }

                <!-- Actions -->
                <div class="order-actions">
                  <p-button 
                    label="Clear All"
                    [text]="true"
                    severity="secondary"
                    (onClick)="clearOrder()"
                  />
                  <p-button 
                    label="Save as Draft"
                    [outlined]="true"
                    (onClick)="saveAsDraft()"
                    [disabled]="selectedTests().length === 0"
                  />
                  <p-button 
                    label="Place Order"
                    icon="pi pi-check"
                    (onClick)="placeOrder()"
                    [disabled]="selectedTests().length === 0 || selectedDiagnoses().length === 0"
                    [loading]="submitting()"
                  />
                </div>
              </p-card>
            </section>
          </div>
        </p-tabPanel>

        <!-- Pending Orders Tab -->
        <p-tabPanel header="Pending Orders" leftIcon="pi pi-clock">
          <div class="pending-orders">
            <p-table 
              [value]="pendingOrders()" 
              [paginator]="true" 
              [rows]="10"
              styleClass="p-datatable-sm"
            >
              <ng-template pTemplate="header">
                <tr>
                  <th>Order ID</th>
                  <th>Tests</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Ordered</th>
                  <th>Actions</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-order>
                <tr>
                  <td>
                    <a class="order-link" (click)="viewOrder(order)">{{ order.id }}</a>
                  </td>
                  <td>
                    <div class="test-list-cell">
                      @for (test of order.tests.slice(0, 3); track test.testId) {
                        <span class="test-name-chip">{{ test.testName }}</span>
                      }
                      @if (order.tests.length > 3) {
                        <span class="more-tests">+{{ order.tests.length - 3 }} more</span>
                      }
                    </div>
                  </td>
                  <td>
                    <p-tag 
                      [value]="order.priority | titlecase"
                      [severity]="getPrioritySeverity(order.priority)"
                      [rounded]="true"
                    />
                  </td>
                  <td>
                    <p-tag 
                      [value]="order.status | titlecase"
                      [severity]="getStatusSeverity(order.status)"
                    />
                  </td>
                  <td>{{ order.orderedAt | date:'short' }}</td>
                  <td>
                    <div class="action-buttons">
                      <p-button 
                        icon="pi pi-eye"
                        [rounded]="true"
                        [text]="true"
                        size="small"
                        pTooltip="View"
                        (onClick)="viewOrder(order)"
                      />
                      <p-button 
                        icon="pi pi-print"
                        [rounded]="true"
                        [text]="true"
                        size="small"
                        pTooltip="Print Label"
                        (onClick)="printLabel(order)"
                      />
                      @if (order.status === 'pending') {
                        <p-button 
                          icon="pi pi-times"
                          [rounded]="true"
                          [text]="true"
                          size="small"
                          severity="danger"
                          pTooltip="Cancel"
                          (onClick)="cancelOrder(order)"
                        />
                      }
                    </div>
                  </td>
                </tr>
              </ng-template>
              <ng-template pTemplate="emptymessage">
                <tr>
                  <td colspan="6" class="empty-message">
                    <i class="pi pi-inbox"></i>
                    <span>No pending orders</span>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        </p-tabPanel>

        <!-- Results Tab -->
        <p-tabPanel header="Results" leftIcon="pi pi-chart-bar">
          <div class="results-section">
            <p-table 
              [value]="completedOrders()" 
              [paginator]="true" 
              [rows]="10"
              [expandedRowKeys]="expandedRows"
              dataKey="id"
              styleClass="p-datatable-sm"
            >
              <ng-template pTemplate="header">
                <tr>
                  <th style="width: 3rem"></th>
                  <th>Order ID</th>
                  <th>Tests</th>
                  <th>Collected</th>
                  <th>Resulted</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-order let-expanded="expanded">
                <tr>
                  <td>
                    <p-button 
                      type="button" 
                      [icon]="expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
                      [rounded]="true"
                      [text]="true"
                      (click)="toggleRow(order)"
                    />
                  </td>
                  <td>{{ order.id }}</td>
                  <td>
                    <div class="test-list-cell">
                      @for (test of order.tests.slice(0, 2); track test.testId) {
                        <span 
                          class="test-name-chip"
                          [class.abnormal]="test.result?.flag === 'abnormal'"
                          [class.critical]="test.result?.flag === 'critical'"
                        >
                          {{ test.testName }}
                          @if (test.result?.flag && test.result.flag !== 'normal') {
                            <i class="pi pi-exclamation-triangle"></i>
                          }
                        </span>
                      }
                      @if (order.tests.length > 2) {
                        <span class="more-tests">+{{ order.tests.length - 2 }} more</span>
                      }
                    </div>
                  </td>
                  <td>{{ order.collectedAt | date:'short' }}</td>
                  <td>{{ order.completedAt | date:'short' }}</td>
                  <td>
                    <p-tag 
                      [value]="order.status | titlecase"
                      [severity]="getStatusSeverity(order.status)"
                    />
                  </td>
                  <td>
                    <div class="action-buttons">
                      <p-button 
                        icon="pi pi-file-pdf"
                        [rounded]="true"
                        [text]="true"
                        size="small"
                        pTooltip="Download PDF"
                      />
                      <p-button 
                        icon="pi pi-chart-line"
                        [rounded]="true"
                        [text]="true"
                        size="small"
                        pTooltip="Trend"
                      />
                    </div>
                  </td>
                </tr>
              </ng-template>
              <ng-template pTemplate="rowexpansion" let-order>
                <tr>
                  <td colspan="7">
                    <div class="results-detail">
                      <table class="results-table">
                        <thead>
                          <tr>
                            <th>Test</th>
                            <th>Result</th>
                            <th>Reference Range</th>
                            <th>Flag</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (test of order.tests; track test.testId) {
                            <tr [class.abnormal]="test.result?.flag === 'abnormal'" [class.critical]="test.result?.flag === 'critical'">
                              <td>{{ test.testName }}</td>
                              <td class="result-value">
                                {{ test.result?.value }} {{ test.result?.unit }}
                              </td>
                              <td>{{ test.result?.referenceRange }}</td>
                              <td>
                                @if (test.result?.flag) {
                                  <p-tag 
                                    [value]="test.result.flag | titlecase"
                                    [severity]="getFlagSeverity(test.result.flag)"
                                    [rounded]="true"
                                  />
                                }
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        </p-tabPanel>
      </p-tabView>

      <!-- Order Detail Dialog -->
      <p-dialog 
        header="Order Details"
        [(visible)]="showOrderDetailDialog"
        [modal]="true"
        [style]="{ width: '700px' }"
      >
        @if (selectedOrder()) {
          <div class="order-detail-view">
            <div class="order-header-info">
              <div class="order-id">
                <span class="label">Order ID</span>
                <span class="value">{{ selectedOrder()!.id }}</span>
              </div>
              <p-tag 
                [value]="selectedOrder()!.priority | titlecase"
                [severity]="getPrioritySeverity(selectedOrder()!.priority)"
              />
              <p-tag 
                [value]="selectedOrder()!.status | titlecase"
                [severity]="getStatusSeverity(selectedOrder()!.status)"
              />
            </div>

            <p-divider />

            <div class="order-timeline">
              <p-timeline [value]="getOrderTimeline(selectedOrder()!)" layout="horizontal">
                <ng-template pTemplate="content" let-event>
                  <div class="timeline-event" [class.completed]="event.completed">
                    <i [class]="event.icon"></i>
                    <span>{{ event.label }}</span>
                    @if (event.date) {
                      <small>{{ event.date | date:'short' }}</small>
                    }
                  </div>
                </ng-template>
              </p-timeline>
            </div>

            <p-divider />

            <div class="order-tests-detail">
              <h4>Ordered Tests</h4>
              <table class="detail-table">
                <thead>
                  <tr>
                    <th>Test</th>
                    <th>Code</th>
                    <th>Specimen</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  @for (test of selectedOrder()!.tests; track test.testId) {
                    <tr>
                      <td>{{ test.testName }}</td>
                      <td>{{ test.testCode }}</td>
                      <td>{{ test.specimen }}</td>
                      <td>
                        <p-tag 
                          [value]="test.status | titlecase"
                          [severity]="getTestStatusSeverity(test.status)"
                          [rounded]="true"
                        />
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            @if (selectedOrder()!.clinicalNotes) {
              <div class="order-notes">
                <h4>Clinical Notes</h4>
                <p>{{ selectedOrder()!.clinicalNotes }}</p>
              </div>
            }
          </div>
        }

        <ng-template pTemplate="footer">
          <p-button label="Print" icon="pi pi-print" [outlined]="true" />
          <p-button label="Close" (onClick)="showOrderDetailDialog.set(false)" />
        </ng-template>
      </p-dialog>

      <!-- Order Sets Dialog -->
      <p-dialog 
        header="Order Set Library"
        [(visible)]="showOrderSetsDialog"
        [modal]="true"
        [style]="{ width: '600px' }"
      >
        <div class="order-sets-list">
          @for (orderSet of orderSets; track orderSet.id) {
            <div class="order-set-item" (click)="applyOrderSet(orderSet)" pRipple>
              <div class="set-info">
                <span class="set-name">{{ orderSet.name }}</span>
                <span class="set-desc">{{ orderSet.description }}</span>
                <div class="set-tests">
                  @for (testId of orderSet.tests.slice(0, 3); track testId) {
                    <span class="set-test-chip">{{ getTestName(testId) }}</span>
                  }
                  @if (orderSet.tests.length > 3) {
                    <span class="more">+{{ orderSet.tests.length - 3 }} more</span>
                  }
                </div>
              </div>
              <p-button icon="pi pi-plus" [rounded]="true" [text]="true" />
            </div>
          }
        </div>
      </p-dialog>
    </div>
  `,
  styles: [`
    .lab-orders {
      min-height: 100vh;
      background: #f8fafc;
    }

    /* Header */
    .orders-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      background: white;
      border-bottom: 1px solid #e5e7eb;
    }

    .orders-header h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .orders-header h1 i {
      color: #8b5cf6;
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

    /* Patient Context */
    .patient-context {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 2rem;
      background: #f3e8ff;
      border-bottom: 1px solid #c4b5fd;
    }

    .patient-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .patient-name {
      font-weight: 600;
      color: #6d28d9;
    }

    .patient-mrn,
    .patient-dob {
      font-size: 0.875rem;
      color: #7c3aed;
    }

    .recent-labs {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .recent-labs .label {
      font-size: 0.875rem;
      color: #64748b;
    }

    :host ::ng-deep .date-chip {
      background: white !important;
    }

    .no-labs {
      font-size: 0.875rem;
      color: #94a3b8;
    }

    /* Tabs */
    :host ::ng-deep .orders-tabs .p-tabview-panels {
      padding: 1.5rem 2rem;
    }

    /* New Order Content */
    .new-order-content {
      display: grid;
      grid-template-columns: 1fr 400px;
      gap: 1.5rem;
    }

    /* Selection Card */
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
    }

    .test-search-input {
      width: 300px;
    }

    .test-browser {
      padding: 1rem;
    }

    .category-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }

    /* Panels Section */
    .panels-section,
    .tests-section {
      margin-bottom: 1.5rem;
    }

    .panels-section h4,
    .tests-section h4 {
      margin: 0 0 0.75rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
    }

    .panels-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 0.75rem;
    }

    .panel-card {
      padding: 0.875rem;
      background: #f8fafc;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .panel-card:hover {
      border-color: #a78bfa;
      background: #faf5ff;
    }

    .panel-card.selected {
      border-color: #8b5cf6;
      background: #f3e8ff;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.25rem;
    }

    .panel-name {
      font-weight: 600;
      color: #1e293b;
    }

    .panel-card.selected .panel-header i {
      color: #8b5cf6;
    }

    .panel-tests {
      display: block;
      font-size: 0.75rem;
      color: #8b5cf6;
      margin-bottom: 0.25rem;
    }

    .panel-desc {
      font-size: 0.75rem;
      color: #64748b;
    }

    /* Tests List */
    .tests-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-height: 400px;
      overflow-y: auto;
    }

    .test-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .test-item:hover {
      background: #faf5ff;
      border-color: #c4b5fd;
    }

    .test-item.selected {
      background: #f3e8ff;
      border-color: #8b5cf6;
    }

    .test-info {
      flex: 1;
    }

    .test-name {
      display: block;
      font-weight: 500;
      color: #1e293b;
    }

    .test-code {
      font-size: 0.75rem;
      color: #64748b;
    }

    .test-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.125rem;
    }

    .specimen,
    .tat {
      font-size: 0.6875rem;
      color: #94a3b8;
    }

    /* Order Details */
    :host ::ng-deep .details-card .p-card-content {
      padding: 1rem !important;
    }

    .selected-tests h4 {
      margin: 0 0 0.75rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
    }

    .selected-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-height: 200px;
      overflow-y: auto;
    }

    .selected-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: #f3e8ff;
      border-radius: 6px;
    }

    .selected-item .item-name {
      flex: 1;
      font-weight: 500;
      color: #6d28d9;
    }

    .selected-item .item-specimen {
      font-size: 0.75rem;
      color: #8b5cf6;
    }

    .no-selection {
      text-align: center;
      color: #94a3b8;
      padding: 1rem;
    }

    /* Order Options */
    .order-options {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .option-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .option-field.checkbox {
      flex-direction: row;
      align-items: center;
      gap: 0.75rem;
    }

    .option-field label {
      font-weight: 500;
      color: #374151;
      font-size: 0.875rem;
    }

    .priority-options {
      display: flex;
      gap: 0.5rem;
    }

    .priority-option {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.625rem;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.875rem;
    }

    .priority-option:hover {
      border-color: #c4b5fd;
    }

    .priority-option.selected {
      border-width: 2px;
    }

    .priority-option.routine.selected {
      background: #ecfdf5;
      border-color: #10b981;
      color: #10b981;
    }

    .priority-option.urgent.selected {
      background: #fef3c7;
      border-color: #f59e0b;
      color: #f59e0b;
    }

    .priority-option.stat.selected {
      background: #fee2e2;
      border-color: #ef4444;
      color: #ef4444;
    }

    .diagnosis-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    /* Specimen Summary */
    .specimen-summary h4 {
      margin: 0 0 0.75rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
    }

    .specimen-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .specimen-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem;
      background: #f8fafc;
      border-radius: 8px;
    }

    .specimen-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .specimen-info {
      flex: 1;
    }

    .specimen-type {
      display: block;
      font-weight: 500;
      color: #1e293b;
      font-size: 0.875rem;
    }

    .specimen-container {
      font-size: 0.75rem;
      color: #64748b;
    }

    .specimen-volume {
      font-weight: 500;
      color: #8b5cf6;
    }

    /* Order Actions */
    .order-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    /* Tables */
    .test-list-cell {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }

    .test-name-chip {
      padding: 0.125rem 0.5rem;
      background: #f3e8ff;
      border-radius: 4px;
      font-size: 0.75rem;
      color: #6d28d9;
    }

    .test-name-chip.abnormal {
      background: #fef3c7;
      color: #92400e;
    }

    .test-name-chip.critical {
      background: #fee2e2;
      color: #991b1b;
    }

    .more-tests {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .action-buttons {
      display: flex;
      gap: 0.25rem;
    }

    .empty-message {
      text-align: center;
      padding: 2rem;
      color: #94a3b8;
    }

    .empty-message i {
      display: block;
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    /* Results Detail */
    .results-detail {
      padding: 1rem;
      background: #f8fafc;
    }

    .results-table {
      width: 100%;
      border-collapse: collapse;
    }

    .results-table th,
    .results-table td {
      padding: 0.5rem;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }

    .results-table th {
      font-weight: 500;
      color: #64748b;
      font-size: 0.75rem;
      text-transform: uppercase;
    }

    .results-table tr.abnormal {
      background: #fef3c7;
    }

    .results-table tr.critical {
      background: #fee2e2;
    }

    .result-value {
      font-weight: 600;
      color: #1e293b;
    }

    /* Order Detail Dialog */
    .order-detail-view {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .order-header-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .order-id {
      flex: 1;
    }

    .order-id .label {
      display: block;
      font-size: 0.75rem;
      color: #64748b;
    }

    .order-id .value {
      font-weight: 600;
      color: #1e293b;
    }

    .order-timeline {
      padding: 1rem 0;
    }

    .timeline-event {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      color: #94a3b8;
    }

    .timeline-event.completed {
      color: #10b981;
    }

    .timeline-event i {
      font-size: 1.25rem;
    }

    .timeline-event span {
      font-size: 0.75rem;
      font-weight: 500;
    }

    .timeline-event small {
      font-size: 0.625rem;
    }

    .order-tests-detail h4,
    .order-notes h4 {
      margin: 0 0 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
    }

    .detail-table {
      width: 100%;
      border-collapse: collapse;
    }

    .detail-table th,
    .detail-table td {
      padding: 0.5rem;
      border-bottom: 1px solid #e5e7eb;
      text-align: left;
    }

    .detail-table th {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 500;
    }

    /* Order Sets Dialog */
    .order-sets-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .order-set-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 10px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .order-set-item:hover {
      background: #f3e8ff;
    }

    .set-info {
      flex: 1;
    }

    .set-name {
      display: block;
      font-weight: 600;
      color: #1e293b;
    }

    .set-desc {
      font-size: 0.75rem;
      color: #64748b;
    }

    .set-tests {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      margin-top: 0.5rem;
    }

    .set-test-chip {
      padding: 0.125rem 0.375rem;
      background: #ede9fe;
      border-radius: 4px;
      font-size: 0.6875rem;
      color: #6d28d9;
    }

    .set-tests .more {
      font-size: 0.6875rem;
      color: #94a3b8;
    }

    /* Dark Mode */
    .lab-orders.dark {
      background: #0f172a;
    }

    .dark .orders-header {
      background: #1e293b;
      border-color: #334155;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .new-order-content {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class LabOrdersComponent implements OnInit, OnDestroy {
  readonly themeService = inject(ThemeService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly destroy$ = new Subject<void>();

  // Inputs
  patientId = input<string>();
  patientName = input<string>('John Smith');
  patientMrn = input<string>('MRN-2024-001');
  patientDob = input<Date>(new Date('1960-05-15'));

  // Outputs
  orderPlaced = output<LabOrder>();

  // Signals
  selectedTests = signal<LabTest[]>([]);
  selectedPanels = signal<LabPanel[]>([]);
  pendingOrders = signal<LabOrder[]>([]);
  completedOrders = signal<LabOrder[]>([]);
  diagnosisSuggestions = signal<any[]>([]);
  selectedDiagnoses = signal<DiagnosisCode[]>([]);
  recentLabDates = signal<Date[]>([]);
  submitting = signal(false);
  showOrderDetailDialog = signal(false);
  showOrderSetsDialog = signal(false);
  selectedOrder = signal<LabOrder | null>(null);

  // Form state
  testSearch = '';
  selectedCategory = 'All';
  orderPriority: OrderPriority = 'routine';
  collectionType: CollectionType = 'in-office';
  requiresFasting = false;
  scheduledDate: Date | null = null;
  diagnosisSearch = '';
  clinicalNotes = '';
  today = new Date();
  expandedRows: { [key: string]: boolean } = {};

  // Options
  testCategories = ['All', 'Chemistry', 'Hematology', 'Urinalysis', 'Microbiology', 'Immunology', 'Coagulation'];

  priorityOptions: { label: string; value: OrderPriority; icon: string }[] = [
    { label: 'Routine', value: 'routine', icon: 'pi pi-clock' },
    { label: 'Urgent', value: 'urgent', icon: 'pi pi-exclamation-circle' },
    { label: 'STAT', value: 'stat', icon: 'pi pi-bolt' },
  ];

  collectionOptions = [
    { label: 'In-Office Draw', value: 'in-office' },
    { label: 'Send to Lab', value: 'lab-draw' },
    { label: 'Patient Collected', value: 'patient-collected' },
  ];

  // Mock data
  labTests: LabTest[] = [
    { id: 't1', code: 'CBC', name: 'Complete Blood Count', category: 'Hematology', specimen: 'Whole Blood', container: 'Lavender Top (EDTA)', volume: '3 mL', turnaroundTime: '4 hours', cptCode: '85025', requiresFasting: false, criticalValues: [] },
    { id: 't2', code: 'CMP', name: 'Comprehensive Metabolic Panel', category: 'Chemistry', specimen: 'Serum', container: 'Gold Top (SST)', volume: '5 mL', turnaroundTime: '4 hours', cptCode: '80053', requiresFasting: true, criticalValues: [] },
    { id: 't3', code: 'BMP', name: 'Basic Metabolic Panel', category: 'Chemistry', specimen: 'Serum', container: 'Gold Top (SST)', volume: '5 mL', turnaroundTime: '4 hours', cptCode: '80048', requiresFasting: true, criticalValues: [] },
    { id: 't4', code: 'LIPID', name: 'Lipid Panel', category: 'Chemistry', specimen: 'Serum', container: 'Gold Top (SST)', volume: '5 mL', turnaroundTime: '4 hours', cptCode: '80061', requiresFasting: true, criticalValues: [] },
    { id: 't5', code: 'TSH', name: 'Thyroid Stimulating Hormone', category: 'Immunology', specimen: 'Serum', container: 'Gold Top (SST)', volume: '3 mL', turnaroundTime: '24 hours', cptCode: '84443', requiresFasting: false, criticalValues: [] },
    { id: 't6', code: 'HBA1C', name: 'Hemoglobin A1C', category: 'Chemistry', specimen: 'Whole Blood', container: 'Lavender Top (EDTA)', volume: '3 mL', turnaroundTime: '24 hours', cptCode: '83036', requiresFasting: false, criticalValues: [] },
    { id: 't7', code: 'UA', name: 'Urinalysis Complete', category: 'Urinalysis', specimen: 'Urine', container: 'Urine Cup', volume: '30 mL', turnaroundTime: '4 hours', cptCode: '81003', requiresFasting: false, criticalValues: [] },
    { id: 't8', code: 'PT/INR', name: 'Prothrombin Time / INR', category: 'Coagulation', specimen: 'Plasma', container: 'Blue Top (Citrate)', volume: '2.7 mL', turnaroundTime: '4 hours', cptCode: '85610', requiresFasting: false, criticalValues: [] },
    { id: 't9', code: 'PSA', name: 'Prostate Specific Antigen', category: 'Immunology', specimen: 'Serum', container: 'Gold Top (SST)', volume: '3 mL', turnaroundTime: '24 hours', cptCode: '84153', requiresFasting: false, criticalValues: [] },
    { id: 't10', code: 'VITD', name: 'Vitamin D, 25-Hydroxy', category: 'Chemistry', specimen: 'Serum', container: 'Gold Top (SST)', volume: '3 mL', turnaroundTime: '48 hours', cptCode: '82306', requiresFasting: false, criticalValues: [] },
  ];

  labPanels: LabPanel[] = [
    { id: 'p1', name: 'Annual Wellness Panel', tests: ['t1', 't2', 't4', 't5', 't6'], category: 'Chemistry', description: 'CBC, CMP, Lipid, TSH, A1C' },
    { id: 'p2', name: 'Diabetes Management', tests: ['t3', 't6', 't7'], category: 'Chemistry', description: 'BMP, A1C, Urinalysis' },
    { id: 'p3', name: 'Cardiac Panel', tests: ['t1', 't2', 't4'], category: 'Chemistry', description: 'CBC, CMP, Lipid Panel' },
    { id: 'p4', name: 'Thyroid Panel', tests: ['t5'], category: 'Immunology', description: 'TSH and related tests' },
    { id: 'p5', name: 'Coagulation Panel', tests: ['t1', 't8'], category: 'Coagulation', description: 'CBC, PT/INR' },
  ];

  orderSets = [
    { id: 'os1', name: 'New Patient Workup', description: 'Standard labs for new patient visit', tests: ['t1', 't2', 't4', 't5', 't7'] },
    { id: 'os2', name: 'Pre-Op Clearance', description: 'Labs required before surgery', tests: ['t1', 't2', 't8'] },
    { id: 'os3', name: 'Diabetes Follow-up', description: 'Routine diabetes monitoring', tests: ['t3', 't6', 't4'] },
  ];

  // Computed
  filteredTests = computed(() => {
    let tests = this.labTests;
    if (this.selectedCategory !== 'All') {
      tests = tests.filter(t => t.category === this.selectedCategory);
    }
    if (this.testSearch) {
      const search = this.testSearch.toLowerCase();
      tests = tests.filter(t => 
        t.name.toLowerCase().includes(search) ||
        t.code.toLowerCase().includes(search)
      );
    }
    return tests;
  });

  filteredPanels = computed(() => {
    if (this.selectedCategory === 'All') return this.labPanels;
    return this.labPanels.filter(p => p.category === this.selectedCategory);
  });

  specimenSummary = computed(() => {
    const tests = this.selectedTests();
    const specimenMap = new Map<string, { type: string; container: string; volume: number }>();

    for (const test of tests) {
      const existing = specimenMap.get(test.specimen);
      if (existing) {
        existing.volume += parseFloat(test.volume);
      } else {
        specimenMap.set(test.specimen, {
          type: test.specimen,
          container: test.container,
          volume: parseFloat(test.volume)
        });
      }
    }

    return Array.from(specimenMap.values()).map(s => ({
      ...s,
      totalVolume: `${s.volume} mL`
    }));
  });

  ngOnInit(): void {
    this.loadMockOrders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadMockOrders(): void {
    // Pending orders
    this.pendingOrders.set([
      {
        id: 'ORD-2024-001',
        patientId: 'pt1',
        patientName: 'John Smith',
        orderingProvider: 'Dr. Smith',
        orderingProviderId: 'dr1',
        tests: [
          { testId: 't1', testCode: 'CBC', testName: 'Complete Blood Count', status: 'ordered' },
          { testId: 't2', testCode: 'CMP', testName: 'Comprehensive Metabolic Panel', status: 'ordered' },
        ],
        priority: 'routine',
        status: 'pending',
        collectionType: 'in-office',
        orderedAt: new Date(Date.now() - 3600000),
      }
    ]);

    // Completed orders with results
    this.completedOrders.set([
      {
        id: 'ORD-2024-002',
        patientId: 'pt1',
        patientName: 'John Smith',
        orderingProvider: 'Dr. Smith',
        orderingProviderId: 'dr1',
        tests: [
          { testId: 't1', testCode: 'CBC', testName: 'Complete Blood Count', status: 'verified', specimen: 'Whole Blood', result: { value: '14.2', unit: 'g/dL', referenceRange: '12.0-16.0', flag: 'normal', performedAt: new Date() } },
          { testId: 't6', testCode: 'HBA1C', testName: 'Hemoglobin A1C', status: 'verified', specimen: 'Whole Blood', result: { value: '7.2', unit: '%', referenceRange: '4.0-5.6', flag: 'abnormal', performedAt: new Date() } },
        ],
        priority: 'routine',
        status: 'completed',
        collectionType: 'in-office',
        orderedAt: new Date(Date.now() - 86400000 * 7),
        collectedAt: new Date(Date.now() - 86400000 * 7),
        completedAt: new Date(Date.now() - 86400000 * 6),
      }
    ]);

    this.recentLabDates.set([
      new Date(Date.now() - 86400000 * 7),
      new Date(Date.now() - 86400000 * 30),
      new Date(Date.now() - 86400000 * 90),
    ]);
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
  }

  isSelectedTest(test: LabTest): boolean {
    return this.selectedTests().some(t => t.id === test.id);
  }

  toggleTest(test: LabTest): void {
    if (this.isSelectedTest(test)) {
      this.selectedTests.update(tests => tests.filter(t => t.id !== test.id));
    } else {
      this.selectedTests.update(tests => [...tests, test]);
    }
    this.updateFastingRequirement();
  }

  isSelectedPanel(panel: LabPanel): boolean {
    return this.selectedPanels().some(p => p.id === panel.id);
  }

  togglePanel(panel: LabPanel): void {
    if (this.isSelectedPanel(panel)) {
      // Remove panel and its tests
      this.selectedPanels.update(panels => panels.filter(p => p.id !== panel.id));
      const panelTestIds = new Set(panel.tests);
      this.selectedTests.update(tests => tests.filter(t => !panelTestIds.has(t.id)));
    } else {
      // Add panel and its tests
      this.selectedPanels.update(panels => [...panels, panel]);
      const panelTests = this.labTests.filter(t => panel.tests.includes(t.id));
      const existingIds = new Set(this.selectedTests().map(t => t.id));
      const newTests = panelTests.filter(t => !existingIds.has(t.id));
      this.selectedTests.update(tests => [...tests, ...newTests]);
    }
    this.updateFastingRequirement();
  }

  removeTest(test: LabTest): void {
    this.selectedTests.update(tests => tests.filter(t => t.id !== test.id));
    // Also remove from panels if needed
    this.selectedPanels.update(panels => 
      panels.filter(p => !p.tests.includes(test.id) || p.tests.some(tid => this.selectedTests().some(t => t.id === tid)))
    );
    this.updateFastingRequirement();
  }

  private updateFastingRequirement(): void {
    this.requiresFasting = this.selectedTests().some(t => t.requiresFasting);
  }

  searchDiagnosis(event: any): void {
    const query = event.query.toLowerCase();
    const suggestions = [
      { code: 'Z00.00', description: 'General adult medical examination', display: 'Z00.00 - General adult medical examination' },
      { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', display: 'E11.9 - Type 2 diabetes mellitus' },
      { code: 'I10', description: 'Essential hypertension', display: 'I10 - Essential hypertension' },
      { code: 'E78.5', description: 'Hyperlipidemia, unspecified', display: 'E78.5 - Hyperlipidemia' },
      { code: 'K21.0', description: 'GERD with esophagitis', display: 'K21.0 - GERD' },
      { code: 'E03.9', description: 'Hypothyroidism, unspecified', display: 'E03.9 - Hypothyroidism' },
    ].filter(d => d.display.toLowerCase().includes(query));
    this.diagnosisSuggestions.set(suggestions);
  }

  addDiagnosis(dx: any): void {
    if (!this.selectedDiagnoses().some(d => d.code === dx.code)) {
      this.selectedDiagnoses.update(diagnoses => [...diagnoses, { code: dx.code, description: dx.description }]);
    }
    this.diagnosisSearch = '';
  }

  removeDiagnosis(dx: DiagnosisCode): void {
    this.selectedDiagnoses.update(diagnoses => diagnoses.filter(d => d.code !== dx.code));
  }

  getSpecimenColor(type: string): string {
    const colors: Record<string, string> = {
      'Whole Blood': '#dc2626',
      'Serum': '#f59e0b',
      'Plasma': '#3b82f6',
      'Urine': '#fbbf24',
    };
    return colors[type] || '#64748b';
  }

  clearOrder(): void {
    this.selectedTests.set([]);
    this.selectedPanels.set([]);
    this.selectedDiagnoses.set([]);
    this.orderPriority = 'routine';
    this.collectionType = 'in-office';
    this.requiresFasting = false;
    this.scheduledDate = null;
    this.clinicalNotes = '';
  }

  startNewOrder(): void {
    this.clearOrder();
  }

  saveAsDraft(): void {
    this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Order saved as draft' });
  }

  placeOrder(): void {
    if (this.selectedTests().length === 0 || this.selectedDiagnoses().length === 0) {
      return;
    }

    this.submitting.set(true);

    setTimeout(() => {
      const order: LabOrder = {
        id: `ORD-${Date.now()}`,
        patientId: this.patientId() || 'pt1',
        patientName: this.patientName(),
        orderingProvider: 'Dr. Current User',
        orderingProviderId: 'current-user',
        tests: this.selectedTests().map(t => ({
          testId: t.id,
          testCode: t.code,
          testName: t.name,
          status: 'ordered' as TestStatus,
          specimen: t.specimen,
        })),
        priority: this.orderPriority,
        status: 'pending',
        collectionType: this.collectionType,
        scheduledDate: this.scheduledDate || undefined,
        fasting: this.requiresFasting,
        clinicalNotes: this.clinicalNotes,
        diagnosis: this.selectedDiagnoses().map(d => d.description),
        icdCodes: this.selectedDiagnoses().map(d => d.code),
        orderedAt: new Date(),
      };

      this.pendingOrders.update(orders => [order, ...orders]);
      this.orderPlaced.emit(order);
      this.clearOrder();
      this.submitting.set(false);
      
      this.messageService.add({
        severity: 'success',
        summary: 'Order Placed',
        detail: `Lab order ${order.id} has been submitted`
      });
    }, 1000);
  }

  viewOrder(order: LabOrder): void {
    this.selectedOrder.set(order);
    this.showOrderDetailDialog.set(true);
  }

  printLabel(order: LabOrder): void {
    this.messageService.add({ severity: 'info', summary: 'Printing', detail: 'Label sent to printer' });
  }

  cancelOrder(order: LabOrder): void {
    this.confirmationService.confirm({
      message: `Cancel order ${order.id}?`,
      accept: () => {
        this.pendingOrders.update(orders => orders.filter(o => o.id !== order.id));
        this.messageService.add({ severity: 'warn', summary: 'Cancelled', detail: 'Order has been cancelled' });
      }
    });
  }

  toggleRow(order: LabOrder): void {
    this.expandedRows[order.id] = !this.expandedRows[order.id];
  }

  applyOrderSet(orderSet: any): void {
    const tests = this.labTests.filter(t => orderSet.tests.includes(t.id));
    const existingIds = new Set(this.selectedTests().map(t => t.id));
    const newTests = tests.filter(t => !existingIds.has(t.id));
    this.selectedTests.update(ts => [...ts, ...newTests]);
    this.updateFastingRequirement();
    this.showOrderSetsDialog.set(false);
    this.messageService.add({ severity: 'success', summary: 'Applied', detail: `"${orderSet.name}" order set applied` });
  }

  getTestName(testId: string): string {
    return this.labTests.find(t => t.id === testId)?.name || testId;
  }

  getOrderTimeline(order: LabOrder): any[] {
    return [
      { label: 'Ordered', icon: 'pi pi-file', date: order.orderedAt, completed: true },
      { label: 'Collected', icon: 'pi pi-eyedropper', date: order.collectedAt, completed: !!order.collectedAt },
      { label: 'Received', icon: 'pi pi-inbox', date: order.receivedAt, completed: !!order.receivedAt },
      { label: 'Completed', icon: 'pi pi-check-circle', date: order.completedAt, completed: !!order.completedAt },
    ];
  }

  getPrioritySeverity(priority: string): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    const severities: Record<string, 'success' | 'warn' | 'danger'> = {
      'routine': 'success',
      'urgent': 'warn',
      'stat': 'danger',
    };
    return severities[priority] || 'secondary';
  }

  getStatusSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    const severities: Record<string, 'success' | 'warn' | 'info' | 'secondary'> = {
      'draft': 'secondary',
      'pending': 'info',
      'collected': 'info',
      'in-progress': 'warn',
      'completed': 'success',
      'cancelled': 'secondary',
    };
    return severities[status] || 'secondary';
  }

  getTestStatusSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    const severities: Record<string, 'success' | 'warn' | 'info' | 'secondary'> = {
      'ordered': 'secondary',
      'collected': 'info',
      'received': 'info',
      'in-progress': 'warn',
      'resulted': 'success',
      'verified': 'success',
    };
    return severities[status] || 'secondary';
  }

  getFlagSeverity(flag: string): 'success' | 'warn' | 'danger' | 'secondary' {
    const severities: Record<string, 'success' | 'warn' | 'danger'> = {
      'normal': 'success',
      'abnormal': 'warn',
      'critical': 'danger',
    };
    return severities[flag] || 'secondary';
  }
}
