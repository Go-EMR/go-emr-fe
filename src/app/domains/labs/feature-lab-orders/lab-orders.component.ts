import { Component, inject, signal, computed, OnInit, OnDestroy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { LabService } from '../data-access/services/lab.service';
import { CustomLabPanel as ServiceCustomLabPanel } from '../data-access/models/lab.model';

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
            label="Panel Library"
            icon="pi pi-book"
            [outlined]="true"
            (onClick)="openPanelLibrary()"
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

      <!-- Panel Library Dialog -->
      <p-dialog
        header="Panel Library"
        [(visible)]="showOrderSetsDialog"
        [modal]="true"
        [style]="{ width: '760px', maxHeight: '90vh' }"
        styleClass="panel-library-dialog"
        [draggable]="false"
      >
        <!-- Search + Create header -->
        <div class="pl-toolbar">
          <span class="p-input-icon-left pl-search-wrap">
            <i class="pi pi-search"></i>
            <input
              pInputText
              [ngModel]="panelLibrarySearch()"
              (ngModelChange)="panelLibrarySearch.set($event)"
              placeholder="Search panels by name, tag, or specialty..."
              class="pl-search-input"
            />
          </span>
          <p-button
            label="Create Panel"
            icon="pi pi-plus"
            size="small"
            (onClick)="openCreatePanelDialog()"
          />
        </div>

        <!-- Sub-tabs -->
        <div class="pl-tabs">
          <button
            class="pl-tab"
            [class.active]="panelLibraryTab() === 'order-sets'"
            (click)="panelLibraryTab.set('order-sets')"
          >
            <i class="pi pi-list"></i>
            Order Sets
            <span class="pl-tab-count">{{ orderSets.length }}</span>
          </button>
          <button
            class="pl-tab"
            [class.active]="panelLibraryTab() === 'my-panels'"
            (click)="panelLibraryTab.set('my-panels')"
          >
            <i class="pi pi-user"></i>
            My Panels
            <span class="pl-tab-count">{{ filteredMyPanels().length }}</span>
          </button>
          <button
            class="pl-tab"
            [class.active]="panelLibraryTab() === 'shared'"
            (click)="panelLibraryTab.set('shared')"
          >
            <i class="pi pi-share-alt"></i>
            Shared Library
            <span class="pl-tab-count">{{ filteredSharedPanels().length }}</span>
          </button>
        </div>

        <!-- Order Sets Tab -->
        @if (panelLibraryTab() === 'order-sets') {
          <div class="pl-content">
            @for (orderSet of orderSets; track orderSet.id) {
              <div class="pl-card" pRipple>
                <div class="pl-card-body">
                  <div class="pl-card-header">
                    <span class="pl-card-name">{{ orderSet.name }}</span>
                    <p-button
                      label="Use"
                      icon="pi pi-plus"
                      size="small"
                      (onClick)="applyOrderSet(orderSet)"
                    />
                  </div>
                  <p class="pl-card-desc">{{ orderSet.description }}</p>
                  <div class="pl-card-tests">
                    @for (testId of orderSet.tests.slice(0, 4); track testId) {
                      <span class="pl-test-chip">{{ getTestName(testId) }}</span>
                    }
                    @if (orderSet.tests.length > 4) {
                      <span class="pl-more">+{{ orderSet.tests.length - 4 }} more</span>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        }

        <!-- My Panels Tab -->
        @if (panelLibraryTab() === 'my-panels') {
          <div class="pl-content">
            @if (filteredMyPanels().length === 0) {
              <div class="pl-empty">
                <i class="pi pi-inbox"></i>
                <p>No custom panels yet.</p>
                <p class="pl-empty-sub">Create a panel from your selected tests or build one from scratch.</p>
                <p-button
                  label="Create Your First Panel"
                  icon="pi pi-plus"
                  size="small"
                  [outlined]="true"
                  (onClick)="openCreatePanelDialog()"
                />
              </div>
            }
            @for (panel of filteredMyPanels(); track panel.id) {
              <div class="pl-card">
                <div class="pl-card-body">
                  <div class="pl-card-header">
                    <div class="pl-card-title-group">
                      <span class="pl-card-name">{{ panel.name }}</span>
                      @if (panel.isPublished) {
                        <span class="pl-badge pl-badge-published">
                          <i class="pi pi-globe"></i> Published
                        </span>
                      } @else {
                        <span class="pl-badge pl-badge-private">
                          <i class="pi pi-lock"></i> Private
                        </span>
                      }
                    </div>
                    <div class="pl-card-actions">
                      <p-button
                        label="Use"
                        icon="pi pi-plus"
                        size="small"
                        (onClick)="selectCustomPanel(panel)"
                      />
                      @if (!panel.isPublished) {
                        <p-button
                          icon="pi pi-globe"
                          size="small"
                          [outlined]="true"
                          severity="secondary"
                          pTooltip="Publish to Shared Library"
                          [loading]="publishingPanelId() === panel.id"
                          (onClick)="publishPanel(panel)"
                        />
                      } @else {
                        <p-button
                          icon="pi pi-lock"
                          size="small"
                          [outlined]="true"
                          severity="secondary"
                          pTooltip="Unpublish"
                          [loading]="publishingPanelId() === panel.id"
                          (onClick)="unpublishPanel(panel)"
                        />
                      }
                      <p-button
                        icon="pi pi-trash"
                        size="small"
                        [text]="true"
                        severity="danger"
                        pTooltip="Delete"
                        [loading]="deletingPanelId() === panel.id"
                        (onClick)="deletePanel(panel)"
                      />
                    </div>
                  </div>

                  @if (panel.description) {
                    <p class="pl-card-desc">{{ panel.description }}</p>
                  }

                  <div class="pl-card-tests">
                    @for (test of panel.tests.slice(0, 5); track test.id) {
                      <span class="pl-test-chip">{{ test.name }}</span>
                    }
                    @if (panel.tests.length > 5) {
                      <span class="pl-more">+{{ panel.tests.length - 5 }} more</span>
                    }
                  </div>

                  <div class="pl-card-meta">
                    <div class="pl-meta-left">
                      @if (panel.tags && panel.tags.length > 0) {
                        <div class="pl-tags">
                          @for (tag of panel.tags; track tag) {
                            <span class="pl-tag">{{ tag }}</span>
                          }
                        </div>
                      }
                      @if (panel.specialty) {
                        <span class="pl-specialty">{{ panel.specialty }}</span>
                      }
                    </div>
                    <div class="pl-meta-right">
                      <span class="pl-stat">
                        <i class="pi pi-history"></i>
                        Used {{ formatUseCount(panel.useCount) }}x
                      </span>
                      <span class="pl-stat">
                        <i class="pi pi-clock"></i>
                        {{ panelLastUsed(panel.lastUsedAt) }}
                      </span>
                      @if (panel.isPublished && panel.subscriberCount) {
                        <span class="pl-stat">
                          <i class="pi pi-users"></i>
                          {{ panel.subscriberCount }} subscribers
                        </span>
                      }
                      <span class="pl-stat pl-version">v{{ panel.version }}</span>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        }

        <!-- Shared Library Tab -->
        @if (panelLibraryTab() === 'shared') {
          <div class="pl-content">
            @if (filteredSharedPanels().length === 0) {
              <div class="pl-empty">
                <i class="pi pi-share-alt"></i>
                <p>No shared panels found.</p>
                <p class="pl-empty-sub">Publish one of your panels to contribute to the shared library.</p>
              </div>
            }
            @for (panel of filteredSharedPanels(); track panel.id) {
              <div class="pl-card pl-card-shared">
                <div class="pl-card-body">
                  <div class="pl-card-header">
                    <div class="pl-card-title-group">
                      <span class="pl-card-name">{{ panel.name }}</span>
                      <span class="pl-badge pl-badge-published">
                        <i class="pi pi-globe"></i> Shared
                      </span>
                    </div>
                    <div class="pl-card-actions">
                      <p-button
                        label="Use"
                        icon="pi pi-plus"
                        size="small"
                        (onClick)="selectCustomPanel(panel)"
                      />
                      <p-button
                        label="Clone"
                        icon="pi pi-copy"
                        size="small"
                        [outlined]="true"
                        severity="secondary"
                        pTooltip="Clone to My Panels"
                        [loading]="cloningPanelId() === panel.id"
                        (onClick)="clonePanel(panel)"
                      />
                    </div>
                  </div>

                  @if (panel.description) {
                    <p class="pl-card-desc">{{ panel.description }}</p>
                  }

                  <div class="pl-card-tests">
                    @for (test of panel.tests.slice(0, 5); track test.id) {
                      <span class="pl-test-chip">{{ test.name }}</span>
                    }
                    @if (panel.tests.length > 5) {
                      <span class="pl-more">+{{ panel.tests.length - 5 }} more</span>
                    }
                  </div>

                  <div class="pl-card-meta">
                    <div class="pl-meta-left">
                      <span class="pl-author">
                        <i class="pi pi-user"></i>
                        {{ panel.createdByName }}
                      </span>
                      @if (panel.specialty) {
                        <span class="pl-specialty">{{ panel.specialty }}</span>
                      }
                      @if (panel.tags && panel.tags.length > 0) {
                        <div class="pl-tags">
                          @for (tag of panel.tags; track tag) {
                            <span class="pl-tag">{{ tag }}</span>
                          }
                        </div>
                      }
                    </div>
                    <div class="pl-meta-right">
                      <span class="pl-stat pl-stat-highlight">
                        <i class="pi pi-users"></i>
                        {{ panel.subscriberCount }} subscribers
                      </span>
                      <span class="pl-stat">
                        <i class="pi pi-history"></i>
                        {{ formatUseCount(panel.useCount) }} uses
                      </span>
                      <span class="pl-stat">
                        <i class="pi pi-clock"></i>
                        {{ panelLastUsed(panel.lastUsedAt) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </p-dialog>

      <!-- Create Panel Dialog -->
      <p-dialog
        header="Create Custom Panel"
        [(visible)]="showCreatePanelDialog"
        [modal]="true"
        [style]="{ width: '640px' }"
        styleClass="create-panel-dialog"
        [draggable]="false"
      >
        <div class="cp-form">
          <!-- Panel name -->
          <div class="cp-field">
            <label class="cp-label" for="cpName">Panel Name <span class="required">*</span></label>
            <input
              id="cpName"
              pInputText
              [(ngModel)]="newPanelName"
              placeholder="e.g. My Diabetes Follow-up"
              class="w-full"
            />
          </div>

          <!-- Description -->
          <div class="cp-field">
            <label class="cp-label" for="cpDesc">Description</label>
            <textarea
              id="cpDesc"
              pInputTextarea
              [(ngModel)]="newPanelDescription"
              rows="2"
              placeholder="Brief description of when to use this panel..."
              class="w-full"
            ></textarea>
          </div>

          <!-- Specialty + Tags row -->
          <div class="cp-row">
            <div class="cp-field">
              <label class="cp-label">Specialty</label>
              <p-select
                [(ngModel)]="newPanelSpecialty"
                [options]="specialtyOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Select specialty"
                styleClass="w-full"
              />
            </div>
            <div class="cp-field">
              <label class="cp-label">Tags</label>
              <input
                pInputText
                [(ngModel)]="newPanelTags"
                placeholder="e.g. diabetes, lipids, annual"
                class="w-full"
              />
              <small class="cp-hint">Comma-separated for discoverability</small>
            </div>
          </div>

          <!-- Test selection -->
          <div class="cp-field">
            <label class="cp-label">
              Tests in Panel <span class="required">*</span>
              <span class="cp-test-count">({{ newPanelTests().length }} selected)</span>
            </label>

            <!-- Selected tests chips -->
            @if (newPanelTests().length > 0) {
              <div class="cp-selected-tests">
                @for (test of newPanelTests(); track test.id) {
                  <div class="cp-selected-test-chip">
                    <span>{{ test.name }}</span>
                    <button class="cp-chip-remove" (click)="removeNewPanelTest(test)">
                      <i class="pi pi-times"></i>
                    </button>
                  </div>
                }
              </div>
            } @else {
              <p class="cp-no-tests">No tests selected. Choose from the list below.</p>
            }

            <!-- Available tests to add -->
            <div class="cp-available-tests">
              <p class="cp-available-label">Add tests:</p>
              <div class="cp-tests-grid">
                @for (test of labTests; track test.id) {
                  <div
                    class="cp-test-row"
                    [class.cp-test-added]="isTestInNewPanel(test)"
                    (click)="addTestToNewPanel(test)"
                  >
                    <p-checkbox
                      [binary]="true"
                      [ngModel]="isTestInNewPanel(test)"
                      (click)="$event.stopPropagation()"
                      (onChange)="isTestInNewPanel(test) ? removeNewPanelTest(test) : addTestToNewPanel(test)"
                    />
                    <span class="cp-test-name">{{ test.name }}</span>
                    <span class="cp-test-code">{{ test.code }}</span>
                    @if (test.requiresFasting) {
                      <span class="cp-fasting-badge">Fasting</span>
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <p-button
            label="Cancel"
            [text]="true"
            severity="secondary"
            (onClick)="showCreatePanelDialog.set(false)"
          />
          <p-button
            label="Save Panel"
            icon="pi pi-check"
            [loading]="creatingPanel()"
            [disabled]="!newPanelName.trim() || newPanelTests().length === 0"
            (onClick)="createPanel()"
          />
        </ng-template>
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

    /* ============ Panel Library Dialog ============ */
    .pl-toolbar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0 0 1rem;
    }

    .pl-search-wrap {
      flex: 1;
    }

    .pl-search-input {
      width: 100%;
    }

    .pl-tabs {
      display: flex;
      gap: 0;
      border-bottom: 2px solid #e5e7eb;
      margin-bottom: 1rem;
    }

    .pl-tab {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      color: #64748b;
      transition: all 0.2s;
    }

    .pl-tab:hover {
      color: #7c3aed;
      background: #faf5ff;
    }

    .pl-tab.active {
      color: #7c3aed;
      border-bottom-color: #7c3aed;
    }

    .pl-tab-count {
      background: #e5e7eb;
      color: #64748b;
      border-radius: 20px;
      padding: 0.0625rem 0.5rem;
      font-size: 0.6875rem;
    }

    .pl-tab.active .pl-tab-count {
      background: #ede9fe;
      color: #7c3aed;
    }

    .pl-content {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
      max-height: 420px;
      overflow-y: auto;
      padding-right: 0.25rem;
    }

    .pl-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 3rem 1rem;
      color: #94a3b8;
      text-align: center;
    }

    .pl-empty i {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }

    .pl-empty p {
      margin: 0;
      font-size: 0.9375rem;
      font-weight: 500;
      color: #64748b;
    }

    .pl-empty-sub {
      font-size: 0.8125rem !important;
      color: #94a3b8 !important;
      font-weight: 400 !important;
    }

    /* Panel card */
    .pl-card {
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      background: #fff;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .pl-card:hover {
      border-color: #c4b5fd;
      box-shadow: 0 2px 8px rgba(124, 58, 237, 0.08);
    }

    .pl-card-shared {
      border-left: 3px solid #8b5cf6;
    }

    .pl-card-body {
      padding: 0.875rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .pl-card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.75rem;
    }

    .pl-card-title-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      flex: 1;
      min-width: 0;
    }

    .pl-card-name {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.9375rem;
    }

    .pl-card-actions {
      display: flex;
      gap: 0.25rem;
      align-items: center;
      flex-shrink: 0;
    }

    .pl-card-desc {
      margin: 0;
      font-size: 0.8125rem;
      color: #64748b;
      line-height: 1.4;
    }

    .pl-card-tests {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }

    .pl-test-chip {
      padding: 0.125rem 0.5rem;
      background: #ede9fe;
      border-radius: 4px;
      font-size: 0.6875rem;
      color: #6d28d9;
    }

    .pl-more {
      font-size: 0.6875rem;
      color: #94a3b8;
      align-self: center;
    }

    /* Badges */
    .pl-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.125rem 0.5rem;
      border-radius: 20px;
      font-size: 0.6875rem;
      font-weight: 500;
    }

    .pl-badge-published {
      background: #dcfce7;
      color: #16a34a;
    }

    .pl-badge-private {
      background: #f1f5f9;
      color: #64748b;
    }

    /* Card metadata row */
    .pl-card-meta {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.5rem;
      margin-top: 0.25rem;
      padding-top: 0.5rem;
      border-top: 1px solid #f1f5f9;
    }

    .pl-meta-left,
    .pl-meta-right {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.375rem;
    }

    .pl-author {
      font-size: 0.75rem;
      color: #374151;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .pl-specialty {
      font-size: 0.6875rem;
      padding: 0.0625rem 0.5rem;
      background: #fef3c7;
      color: #92400e;
      border-radius: 4px;
    }

    .pl-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }

    .pl-tag {
      font-size: 0.6875rem;
      padding: 0.0625rem 0.375rem;
      background: #f1f5f9;
      color: #475569;
      border-radius: 4px;
    }

    .pl-stat {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.6875rem;
      color: #94a3b8;
    }

    .pl-stat-highlight {
      color: #7c3aed;
    }

    .pl-version {
      background: #f1f5f9;
      padding: 0.0625rem 0.375rem;
      border-radius: 3px;
      font-size: 0.625rem;
      color: #64748b;
    }

    /* ============ Create Panel Dialog ============ */
    .cp-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .cp-field {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      flex: 1;
    }

    .cp-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .cp-label {
      font-weight: 500;
      font-size: 0.875rem;
      color: #374151;
    }

    .required {
      color: #ef4444;
    }

    .cp-test-count {
      font-weight: 400;
      color: #64748b;
      font-size: 0.8125rem;
      margin-left: 0.25rem;
    }

    .cp-hint {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .cp-selected-tests {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
      padding: 0.625rem;
      background: #f3e8ff;
      border-radius: 8px;
      border: 1px solid #c4b5fd;
      min-height: 2.5rem;
    }

    .cp-selected-test-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.25rem 0.625rem;
      background: #ede9fe;
      border-radius: 20px;
      font-size: 0.75rem;
      color: #6d28d9;
      font-weight: 500;
    }

    .cp-chip-remove {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      color: #a78bfa;
      transition: color 0.2s;
    }

    .cp-chip-remove:hover {
      color: #7c3aed;
    }

    .cp-chip-remove i {
      font-size: 0.625rem;
    }

    .cp-no-tests {
      font-size: 0.8125rem;
      color: #94a3b8;
      font-style: italic;
      margin: 0;
      padding: 0.5rem 0;
    }

    .cp-available-tests {
      margin-top: 0.25rem;
    }

    .cp-available-label {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 500;
      margin: 0 0 0.375rem;
    }

    .cp-tests-grid {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      max-height: 220px;
      overflow-y: auto;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 0.25rem;
    }

    .cp-test-row {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.5rem 0.625rem;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.15s;
    }

    .cp-test-row:hover {
      background: #faf5ff;
    }

    .cp-test-row.cp-test-added {
      background: #f3e8ff;
    }

    .cp-test-name {
      flex: 1;
      font-size: 0.8125rem;
      color: #1e293b;
    }

    .cp-test-code {
      font-size: 0.6875rem;
      color: #64748b;
    }

    .cp-fasting-badge {
      font-size: 0.625rem;
      padding: 0.0625rem 0.375rem;
      background: #fef3c7;
      color: #92400e;
      border-radius: 4px;
    }

    /* ============ Dark Mode ============ */
    .lab-orders.dark {
      background: #0f172a;
    }

    .dark .orders-header {
      background: #1e293b;
      border-color: #334155;
    }

    .dark .orders-header h1 {
      color: #f1f5f9;
    }

    .dark .subtitle {
      color: #94a3b8;
    }

    .dark .card-header {
      border-color: #334155;
    }

    .dark .card-header h3 {
      color: #f1f5f9;
    }

    .dark .panel-card {
      background: #1e293b;
      border-color: #334155;
    }

    .dark .panel-card:hover {
      border-color: #7c3aed;
      background: #2d1b5e;
    }

    .dark .panel-card.selected {
      border-color: #8b5cf6;
      background: #2d1b5e;
    }

    .dark .panel-name {
      color: #f1f5f9;
    }

    .dark .panel-desc {
      color: #94a3b8;
    }

    .dark .test-item {
      background: #1e293b;
      border-color: #334155;
    }

    .dark .test-item:hover {
      background: #2d1b5e;
      border-color: #7c3aed;
    }

    .dark .test-item.selected {
      background: #2d1b5e;
      border-color: #8b5cf6;
    }

    .dark .test-name {
      color: #f1f5f9;
    }

    .dark .test-code,
    .dark .specimen,
    .dark .tat {
      color: #64748b;
    }

    .dark .selected-item {
      background: #2d1b5e;
    }

    .dark .option-field label {
      color: #cbd5e1;
    }

    .dark .panels-section h4,
    .dark .tests-section h4,
    .dark .selected-tests h4,
    .dark .specimen-summary h4 {
      color: #cbd5e1;
    }

    /* Panel library dark mode */
    .dark .pl-tabs {
      border-color: #334155;
    }

    .dark .pl-tab {
      color: #94a3b8;
    }

    .dark .pl-tab:hover {
      color: #a78bfa;
      background: #1e293b;
    }

    .dark .pl-tab.active {
      color: #a78bfa;
      border-bottom-color: #a78bfa;
    }

    .dark .pl-tab-count {
      background: #334155;
      color: #94a3b8;
    }

    .dark .pl-tab.active .pl-tab-count {
      background: #2d1b5e;
      color: #a78bfa;
    }

    .dark .pl-card {
      background: #1e293b;
      border-color: #334155;
    }

    .dark .pl-card:hover {
      border-color: #7c3aed;
      box-shadow: 0 2px 8px rgba(124, 58, 237, 0.2);
    }

    .dark .pl-card-shared {
      border-left-color: #7c3aed;
    }

    .dark .pl-card-name {
      color: #f1f5f9;
    }

    .dark .pl-card-desc {
      color: #94a3b8;
    }

    .dark .pl-test-chip {
      background: #2d1b5e;
      color: #a78bfa;
    }

    .dark .pl-badge-published {
      background: #14532d;
      color: #86efac;
    }

    .dark .pl-badge-private {
      background: #1e293b;
      color: #64748b;
    }

    .dark .pl-card-meta {
      border-top-color: #334155;
    }

    .dark .pl-author {
      color: #cbd5e1;
    }

    .dark .pl-specialty {
      background: #422006;
      color: #fde68a;
    }

    .dark .pl-tag {
      background: #1e293b;
      color: #94a3b8;
    }

    .dark .pl-stat {
      color: #64748b;
    }

    .dark .pl-stat-highlight {
      color: #a78bfa;
    }

    .dark .pl-version {
      background: #334155;
      color: #94a3b8;
    }

    .dark .pl-empty {
      color: #64748b;
    }

    .dark .pl-empty p {
      color: #94a3b8;
    }

    /* Create panel dialog dark mode */
    .dark .cp-label {
      color: #cbd5e1;
    }

    .dark .cp-selected-tests {
      background: #2d1b5e;
      border-color: #5b21b6;
    }

    .dark .cp-selected-test-chip {
      background: #3b1f7a;
      color: #c4b5fd;
    }

    .dark .cp-chip-remove {
      color: #7c3aed;
    }

    .dark .cp-chip-remove:hover {
      color: #a78bfa;
    }

    .dark .cp-tests-grid {
      border-color: #334155;
    }

    .dark .cp-test-row:hover {
      background: #1e293b;
    }

    .dark .cp-test-row.cp-test-added {
      background: #2d1b5e;
    }

    .dark .cp-test-name {
      color: #f1f5f9;
    }

    .dark .cp-test-code {
      color: #64748b;
    }

    .dark .cp-fasting-badge {
      background: #422006;
      color: #fde68a;
    }

    .dark .cp-available-label {
      color: #94a3b8;
    }

    .dark .cp-hint {
      color: #64748b;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .new-order-content {
        grid-template-columns: 1fr;
      }

      .cp-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class LabOrdersComponent implements OnInit, OnDestroy {
  readonly themeService = inject(ThemeService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly labService = inject(LabService);
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

  // Custom panel library signals
  myPanels = signal<ServiceCustomLabPanel[]>([]);
  sharedPanels = signal<ServiceCustomLabPanel[]>([]);
  panelLibraryTab = signal<'order-sets' | 'my-panels' | 'shared'>('order-sets');
  panelLibrarySearch = signal('');
  showCreatePanelDialog = signal(false);
  creatingPanel = signal(false);
  publishingPanelId = signal<string | null>(null);
  cloningPanelId = signal<string | null>(null);
  deletingPanelId = signal<string | null>(null);

  // Create panel form state
  newPanelName = '';
  newPanelDescription = '';
  newPanelTags = '';
  newPanelSpecialty = '';
  newPanelTests = signal<LabTest[]>([]);

  // Computed filtered panel lists
  filteredMyPanels = computed(() => {
    const search = this.panelLibrarySearch().toLowerCase().trim();
    if (!search) return this.myPanels();
    return this.myPanels().filter(p =>
      p.name.toLowerCase().includes(search) ||
      p.description?.toLowerCase().includes(search) ||
      p.tags?.some(t => t.toLowerCase().includes(search)) ||
      p.specialty?.toLowerCase().includes(search)
    );
  });

  filteredSharedPanels = computed(() => {
    const search = this.panelLibrarySearch().toLowerCase().trim();
    if (!search) return this.sharedPanels();
    return this.sharedPanels().filter(p =>
      p.name.toLowerCase().includes(search) ||
      p.description?.toLowerCase().includes(search) ||
      p.tags?.some(t => t.toLowerCase().includes(search)) ||
      p.specialty?.toLowerCase().includes(search) ||
      p.createdByName.toLowerCase().includes(search)
    );
  });

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

  specialtyOptions = [
    { label: 'Internal Medicine', value: 'Internal Medicine' },
    { label: 'Family Medicine', value: 'Family Medicine' },
    { label: 'Cardiology', value: 'Cardiology' },
    { label: 'Endocrinology', value: 'Endocrinology' },
    { label: 'Nephrology', value: 'Nephrology' },
    { label: 'Gastroenterology', value: 'Gastroenterology' },
    { label: 'Pulmonology', value: 'Pulmonology' },
    { label: 'Neurology', value: 'Neurology' },
    { label: 'Surgery', value: 'Surgery' },
    { label: 'Oncology', value: 'Oncology' },
    { label: 'Obstetrics & Gynecology', value: 'Obstetrics & Gynecology' },
    { label: 'Pediatrics', value: 'Pediatrics' },
    { label: 'Emergency Medicine', value: 'Emergency Medicine' },
    { label: 'Other', value: 'Other' },
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
    this.loadPanelLibrary();
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

  // ============ Panel Library ============

  private loadPanelLibrary(): void {
    this.labService.getMyPanels()
      .pipe(takeUntil(this.destroy$))
      .subscribe(panels => this.myPanels.set(panels));

    this.labService.getSharedPanels()
      .pipe(takeUntil(this.destroy$))
      .subscribe(panels => this.sharedPanels.set(panels));
  }

  openPanelLibrary(): void {
    this.panelLibrarySearch.set('');
    this.showOrderSetsDialog.set(true);
  }

  selectCustomPanel(panel: ServiceCustomLabPanel): void {
    // Map service LabTest to local LabTest shape
    const existingIds = new Set(this.selectedTests().map(t => t.id));
    const newTests: LabTest[] = panel.tests
      .filter(st => !existingIds.has(st.id))
      .map(st => ({
        id: st.id,
        code: st.code,
        name: st.name,
        category: st.category,
        specimen: st.specimenType,
        container: '',
        volume: '3 mL',
        turnaroundTime: st.turnaroundTime || '24 hours',
        cptCode: st.cptCode || '',
        requiresFasting: st.fastingRequired,
      }));
    this.selectedTests.update(ts => [...ts, ...newTests]);
    this.updateFastingRequirement();
    this.showOrderSetsDialog.set(false);
    this.messageService.add({
      severity: 'success',
      summary: 'Panel Applied',
      detail: `"${panel.name}" added ${newTests.length} test(s) to your order`,
    });
  }

  openCreatePanelDialog(): void {
    this.newPanelName = '';
    this.newPanelDescription = '';
    this.newPanelTags = '';
    this.newPanelSpecialty = '';
    // Pre-populate with currently selected tests if any
    const currentTests = this.selectedTests();
    if (currentTests.length > 0) {
      this.newPanelTests.set([...currentTests]);
    } else {
      this.newPanelTests.set([]);
    }
    this.showCreatePanelDialog.set(true);
  }

  removeNewPanelTest(test: LabTest): void {
    this.newPanelTests.update(ts => ts.filter(t => t.id !== test.id));
  }

  addTestToNewPanel(test: LabTest): void {
    if (!this.newPanelTests().some(t => t.id === test.id)) {
      this.newPanelTests.update(ts => [...ts, test]);
    }
  }

  isTestInNewPanel(test: LabTest): boolean {
    return this.newPanelTests().some(t => t.id === test.id);
  }

  createPanel(): void {
    if (!this.newPanelName.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Panel name is required' });
      return;
    }
    if (this.newPanelTests().length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Select at least one test' });
      return;
    }

    this.creatingPanel.set(true);

    // Map local LabTest back to service model shape (partial)
    const tags = this.newPanelTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    // Build a partial CustomLabPanel compatible with the service
    const panelPayload: Partial<ServiceCustomLabPanel> = {
      name: this.newPanelName.trim(),
      description: this.newPanelDescription.trim(),
      tags,
      specialty: this.newPanelSpecialty,
      // Tests need to match the service LabTest model; map from local shape
      tests: this.newPanelTests().map(t => ({
        id: t.id,
        code: t.code,
        testCode: t.code,
        name: t.name,
        testName: t.name,
        category: t.category.toLowerCase() as any,
        specimenType: (t.specimen?.toLowerCase() || 'blood') as any,
        fastingRequired: t.requiresFasting || false,
        fastingHours: t.requiresFasting ? 8 : undefined,
        turnaroundTime: t.turnaroundTime,
        cptCode: t.cptCode,
      })),
    };

    this.labService.createCustomPanel(panelPayload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (panel) => {
          this.myPanels.update(panels => [...panels, panel]);
          this.creatingPanel.set(false);
          this.showCreatePanelDialog.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Panel Created',
            detail: `"${panel.name}" has been saved to My Panels`,
          });
        },
        error: () => {
          this.creatingPanel.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create panel' });
        },
      });
  }

  publishPanel(panel: ServiceCustomLabPanel): void {
    this.publishingPanelId.set(panel.id);
    this.labService.publishPanel(panel.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.myPanels.update(panels => panels.map(p => p.id === updated.id ? updated : p));
          this.publishingPanelId.set(null);
          this.messageService.add({
            severity: 'success',
            summary: 'Published',
            detail: `"${updated.name}" is now visible in the Shared Library`,
          });
        },
        error: () => {
          this.publishingPanelId.set(null);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to publish panel' });
        },
      });
  }

  unpublishPanel(panel: ServiceCustomLabPanel): void {
    this.publishingPanelId.set(panel.id);
    this.labService.unpublishPanel(panel.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.myPanels.update(panels => panels.map(p => p.id === updated.id ? updated : p));
          // Remove from shared list since it's now unpublished
          this.sharedPanels.update(panels => panels.filter(p => p.id !== updated.id));
          this.publishingPanelId.set(null);
          this.messageService.add({
            severity: 'info',
            summary: 'Unpublished',
            detail: `"${updated.name}" has been removed from the Shared Library`,
          });
        },
        error: () => {
          this.publishingPanelId.set(null);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to unpublish panel' });
        },
      });
  }

  clonePanel(panel: ServiceCustomLabPanel): void {
    this.cloningPanelId.set(panel.id);
    this.labService.clonePanel(panel.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (clone) => {
          this.myPanels.update(panels => [...panels, clone]);
          this.cloningPanelId.set(null);
          this.panelLibraryTab.set('my-panels');
          this.messageService.add({
            severity: 'success',
            summary: 'Cloned',
            detail: `"${clone.name}" added to My Panels`,
          });
        },
        error: () => {
          this.cloningPanelId.set(null);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to clone panel' });
        },
      });
  }

  deletePanel(panel: ServiceCustomLabPanel): void {
    this.confirmationService.confirm({
      message: `Delete panel "${panel.name}"? This cannot be undone.`,
      header: 'Delete Panel',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.deletingPanelId.set(panel.id);
        this.labService.deleteCustomPanel(panel.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.myPanels.update(panels => panels.filter(p => p.id !== panel.id));
              this.deletingPanelId.set(null);
              this.messageService.add({
                severity: 'warn',
                summary: 'Deleted',
                detail: `"${panel.name}" has been deleted`,
              });
            },
            error: () => {
              this.deletingPanelId.set(null);
              this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete panel' });
            },
          });
      },
    });
  }

  formatUseCount(count: number): string {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  }

  panelLastUsed(dateStr?: string): string {
    if (!dateStr) return 'Never';
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays}d ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
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
