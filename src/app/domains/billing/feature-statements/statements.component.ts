import { Component, OnInit, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

interface PatientStatement {
  id: string;
  statementNumber: string;
  patientId: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  statementDate: Date;
  dueDate: Date;
  periodStart: Date;
  periodEnd: Date;
  previousBalance: number;
  newCharges: number;
  payments: number;
  adjustments: number;
  currentBalance: number;
  minimumPayment?: number;
  agingBuckets: {
    current: number;
    days30: number;
    days60: number;
    days90: number;
    days120Plus: number;
  };
  status: 'draft' | 'pending' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'collections';
  deliveryMethod: 'mail' | 'email' | 'portal' | 'none';
  sentDate?: Date;
  viewedDate?: Date;
  paidDate?: Date;
  collectionStatus?: 'pre_collection' | 'in_collection' | 'bad_debt' | 'write_off';
  collectionAgency?: string;
  notes?: string;
  lineItems: StatementLineItem[];
  paymentHistory: StatementPayment[];
}

interface StatementLineItem {
  id: string;
  serviceDate: Date;
  description: string;
  claimNumber?: string;
  charges: number;
  insurancePaid: number;
  adjustments: number;
  patientResponsibility: number;
  paid: number;
  balance: number;
}

interface StatementPayment {
  id: string;
  date: Date;
  amount: number;
  method: string;
  reference?: string;
}

interface AgingReport {
  totalPatients: number;
  totalBalance: number;
  current: { count: number; amount: number };
  days30: { count: number; amount: number };
  days60: { count: number; amount: number };
  days90: { count: number; amount: number };
  days120Plus: { count: number; amount: number };
  byInsurance: { name: string; amount: number }[];
  byProvider: { name: string; amount: number }[];
}

interface StatementBatch {
  id: string;
  batchNumber: string;
  createdDate: Date;
  createdBy: string;
  statementCount: number;
  totalAmount: number;
  deliveryMethod: 'mail' | 'email' | 'portal' | 'mixed';
  status: 'pending' | 'processing' | 'sent' | 'completed' | 'failed';
  sentDate?: Date;
}

@Component({
  selector: 'app-statements',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="statements-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Patient Statements</h1>
          <p class="subtitle">Generate and manage patient billing statements</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="exportAgingReport()">
            <span class="icon">📊</span>
            Export Aging Report
          </button>
          <button class="btn btn-primary" (click)="openGenerateModal()">
            <span class="icon">📄</span>
            Generate Statements
          </button>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="tab-navigation">
        <button 
          class="tab-btn" 
          [class.active]="activeTab() === 'statements'"
          (click)="activeTab.set('statements')">
          Statements
        </button>
        <button 
          class="tab-btn" 
          [class.active]="activeTab() === 'aging'"
          (click)="activeTab.set('aging')">
          Aging Report
        </button>
        <button 
          class="tab-btn" 
          [class.active]="activeTab() === 'batches'"
          (click)="activeTab.set('batches')">
          Batch History
        </button>
        <button 
          class="tab-btn" 
          [class.active]="activeTab() === 'collections'"
          (click)="activeTab.set('collections')">
          Collections
          @if (collectionsCount() > 0) {
            <span class="badge">{{ collectionsCount() }}</span>
          }
        </button>
      </div>

      <!-- Statements Tab -->
      @if (activeTab() === 'statements') {
        <div class="statements-tab">
          <!-- Filters -->
          <div class="filters-bar">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input 
                type="text" 
                placeholder="Search by patient name or statement #..."
                [ngModel]="searchTerm()"
                (ngModelChange)="searchTerm.set($event)"
                (keyup.enter)="searchStatements()">
            </div>
            <select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event)">
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="viewed">Viewed</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="collections">Collections</option>
            </select>
            <select [ngModel]="deliveryFilter()" (ngModelChange)="deliveryFilter.set($event)">
              <option value="">All Delivery Methods</option>
              <option value="mail">Mail</option>
              <option value="email">Email</option>
              <option value="portal">Portal</option>
            </select>
            <input 
              type="date" 
              [ngModel]="dateFrom()"
              (ngModelChange)="dateFrom.set($event)"
              placeholder="From Date">
            <input 
              type="date" 
              [ngModel]="dateTo()"
              (ngModelChange)="dateTo.set($event)"
              placeholder="To Date">
            <button class="btn btn-secondary btn-sm" (click)="searchStatements()">Filter</button>
            <button class="btn btn-ghost btn-sm" (click)="clearFilters()">Clear</button>
          </div>

          <!-- Summary Cards -->
          <div class="summary-cards">
            <div class="summary-card">
              <div class="card-value">{{ filteredStatements().length }}</div>
              <div class="card-label">Total Statements</div>
            </div>
            <div class="summary-card">
              <div class="card-value">{{ formatCurrency(totalOutstanding()) }}</div>
              <div class="card-label">Outstanding Balance</div>
            </div>
            <div class="summary-card warning">
              <div class="card-value">{{ overdueCount() }}</div>
              <div class="card-label">Overdue</div>
            </div>
            <div class="summary-card info">
              <div class="card-value">{{ pendingCount() }}</div>
              <div class="card-label">Pending Send</div>
            </div>
          </div>

          <!-- Statements Table -->
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>
                    <input 
                      type="checkbox" 
                      [checked]="allSelected()"
                      (change)="toggleSelectAll()">
                  </th>
                  <th>Statement #</th>
                  <th>Patient</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Delivery</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (statement of filteredStatements(); track statement.id) {
                  <tr [class.overdue]="statement.status === 'overdue'">
                    <td>
                      <input 
                        type="checkbox" 
                        [checked]="selectedStatements().has(statement.id)"
                        (change)="toggleSelection(statement.id)">
                    </td>
                    <td>
                      <a class="link" (click)="viewStatement(statement)">
                        {{ statement.statementNumber }}
                      </a>
                    </td>
                    <td>
                      <div class="patient-info">
                        <span class="patient-name">{{ statement.patientName }}</span>
                      </div>
                    </td>
                    <td>{{ formatDate(statement.statementDate) }}</td>
                    <td [class.overdue-text]="isOverdue(statement)">
                      {{ formatDate(statement.dueDate) }}
                    </td>
                    <td class="amount">{{ formatCurrency(statement.currentBalance) }}</td>
                    <td>
                      <span class="status-badge" [class]="'status-' + statement.status">
                        {{ getStatusLabel(statement.status) }}
                      </span>
                    </td>
                    <td>
                      <span class="delivery-badge" [class]="'delivery-' + statement.deliveryMethod">
                        {{ getDeliveryIcon(statement.deliveryMethod) }}
                        {{ getDeliveryLabel(statement.deliveryMethod) }}
                      </span>
                    </td>
                    <td>
                      <div class="action-buttons">
                        <button class="btn btn-icon" title="View" (click)="viewStatement(statement)">👁️</button>
                        <button class="btn btn-icon" title="Print" (click)="printStatement(statement)">🖨️</button>
                        <button class="btn btn-icon" title="Send" (click)="sendStatement(statement)"
                          [disabled]="statement.status === 'sent' || statement.status === 'paid'">📧</button>
                        @if (statement.status === 'overdue') {
                          <button class="btn btn-icon" title="Send to Collections" 
                            (click)="sendToCollections(statement)">⚠️</button>
                        }
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="9" class="empty-state">
                      <div class="empty-content">
                        <span class="empty-icon">📄</span>
                        <p>No statements found</p>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Bulk Actions -->
          @if (selectedStatements().size > 0) {
            <div class="bulk-actions">
              <span class="selection-count">{{ selectedStatements().size }} selected</span>
              <button class="btn btn-secondary btn-sm" (click)="bulkPrint()">
                🖨️ Print Selected
              </button>
              <button class="btn btn-secondary btn-sm" (click)="bulkSend()">
                📧 Send Selected
              </button>
              <button class="btn btn-secondary btn-sm" (click)="bulkExport()">
                📥 Export Selected
              </button>
            </div>
          }
        </div>
      }

      <!-- Aging Report Tab -->
      @if (activeTab() === 'aging') {
        <div class="aging-tab">
          <!-- Aging Summary -->
          <div class="aging-summary">
            <div class="aging-total">
              <h3>Total A/R Balance</h3>
              <div class="total-amount">{{ formatCurrency(agingReport()?.totalBalance || 0) }}</div>
              <div class="total-patients">{{ agingReport()?.totalPatients || 0 }} patients</div>
            </div>
            
            <div class="aging-buckets">
              <div class="aging-bucket current">
                <div class="bucket-header">
                  <span class="bucket-label">Current</span>
                  <span class="bucket-count">{{ agingReport()?.current?.count || 0 }}</span>
                </div>
                <div class="bucket-amount">{{ formatCurrency(agingReport()?.current?.amount || 0) }}</div>
                <div class="bucket-bar">
                  <div class="bar-fill" [style.width.%]="getAgingPercent('current')"></div>
                </div>
              </div>
              
              <div class="aging-bucket days30">
                <div class="bucket-header">
                  <span class="bucket-label">1-30 Days</span>
                  <span class="bucket-count">{{ agingReport()?.days30?.count || 0 }}</span>
                </div>
                <div class="bucket-amount">{{ formatCurrency(agingReport()?.days30?.amount || 0) }}</div>
                <div class="bucket-bar">
                  <div class="bar-fill" [style.width.%]="getAgingPercent('days30')"></div>
                </div>
              </div>
              
              <div class="aging-bucket days60">
                <div class="bucket-header">
                  <span class="bucket-label">31-60 Days</span>
                  <span class="bucket-count">{{ agingReport()?.days60?.count || 0 }}</span>
                </div>
                <div class="bucket-amount">{{ formatCurrency(agingReport()?.days60?.amount || 0) }}</div>
                <div class="bucket-bar">
                  <div class="bar-fill" [style.width.%]="getAgingPercent('days60')"></div>
                </div>
              </div>
              
              <div class="aging-bucket days90">
                <div class="bucket-header">
                  <span class="bucket-label">61-90 Days</span>
                  <span class="bucket-count">{{ agingReport()?.days90?.count || 0 }}</span>
                </div>
                <div class="bucket-amount">{{ formatCurrency(agingReport()?.days90?.amount || 0) }}</div>
                <div class="bucket-bar">
                  <div class="bar-fill" [style.width.%]="getAgingPercent('days90')"></div>
                </div>
              </div>
              
              <div class="aging-bucket days120">
                <div class="bucket-header">
                  <span class="bucket-label">90+ Days</span>
                  <span class="bucket-count">{{ agingReport()?.days120Plus?.count || 0 }}</span>
                </div>
                <div class="bucket-amount">{{ formatCurrency(agingReport()?.days120Plus?.amount || 0) }}</div>
                <div class="bucket-bar">
                  <div class="bar-fill" [style.width.%]="getAgingPercent('days120Plus')"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Breakdown Charts -->
          <div class="aging-breakdown">
            <div class="breakdown-card">
              <h4>By Insurance</h4>
              <div class="breakdown-list">
                @for (item of agingReport()?.byInsurance || []; track item.name) {
                  <div class="breakdown-item">
                    <span class="item-name">{{ item.name }}</span>
                    <span class="item-amount">{{ formatCurrency(item.amount) }}</span>
                  </div>
                }
              </div>
            </div>
            
            <div class="breakdown-card">
              <h4>By Provider</h4>
              <div class="breakdown-list">
                @for (item of agingReport()?.byProvider || []; track item.name) {
                  <div class="breakdown-item">
                    <span class="item-name">{{ item.name }}</span>
                    <span class="item-amount">{{ formatCurrency(item.amount) }}</span>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Aging Detail Table -->
          <div class="aging-detail">
            <h4>Patient Aging Detail</h4>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th class="text-right">Current</th>
                    <th class="text-right">1-30</th>
                    <th class="text-right">31-60</th>
                    <th class="text-right">61-90</th>
                    <th class="text-right">90+</th>
                    <th class="text-right">Total</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (statement of statementsWithAging(); track statement.id) {
                    <tr>
                      <td>{{ statement.patientName }}</td>
                      <td class="text-right">{{ formatCurrency(statement.agingBuckets.current) }}</td>
                      <td class="text-right">{{ formatCurrency(statement.agingBuckets.days30) }}</td>
                      <td class="text-right" [class.warning-text]="statement.agingBuckets.days60 > 0">
                        {{ formatCurrency(statement.agingBuckets.days60) }}
                      </td>
                      <td class="text-right" [class.danger-text]="statement.agingBuckets.days90 > 0">
                        {{ formatCurrency(statement.agingBuckets.days90) }}
                      </td>
                      <td class="text-right" [class.danger-text]="statement.agingBuckets.days120Plus > 0">
                        {{ formatCurrency(statement.agingBuckets.days120Plus) }}
                      </td>
                      <td class="text-right total">{{ formatCurrency(statement.currentBalance) }}</td>
                      <td>
                        <button class="btn btn-secondary btn-sm" (click)="viewStatement(statement)">
                          View
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }

      <!-- Batch History Tab -->
      @if (activeTab() === 'batches') {
        <div class="batches-tab">
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Batch #</th>
                  <th>Created</th>
                  <th>Created By</th>
                  <th>Statements</th>
                  <th>Total Amount</th>
                  <th>Delivery</th>
                  <th>Status</th>
                  <th>Sent Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (batch of batches(); track batch.id) {
                  <tr>
                    <td>
                      <a class="link" (click)="viewBatch(batch)">{{ batch.batchNumber }}</a>
                    </td>
                    <td>{{ formatDate(batch.createdDate) }}</td>
                    <td>{{ batch.createdBy }}</td>
                    <td>{{ batch.statementCount }}</td>
                    <td>{{ formatCurrency(batch.totalAmount) }}</td>
                    <td>
                      <span class="delivery-badge" [class]="'delivery-' + batch.deliveryMethod">
                        {{ getDeliveryLabel(batch.deliveryMethod) }}
                      </span>
                    </td>
                    <td>
                      <span class="status-badge" [class]="'batch-' + batch.status">
                        {{ batch.status | titlecase }}
                      </span>
                    </td>
                    <td>{{ batch.sentDate ? formatDate(batch.sentDate) : '-' }}</td>
                    <td>
                      <div class="action-buttons">
                        <button class="btn btn-icon" title="View" (click)="viewBatch(batch)">👁️</button>
                        <button class="btn btn-icon" title="Download" (click)="downloadBatch(batch)">📥</button>
                        @if (batch.status === 'pending') {
                          <button class="btn btn-icon" title="Process" (click)="processBatch(batch)">▶️</button>
                        }
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="9" class="empty-state">
                      <div class="empty-content">
                        <span class="empty-icon">📦</span>
                        <p>No batch history found</p>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Collections Tab -->
      @if (activeTab() === 'collections') {
        <div class="collections-tab">
          <!-- Collections Summary -->
          <div class="collections-summary">
            <div class="summary-card danger">
              <div class="card-value">{{ formatCurrency(collectionsTotal()) }}</div>
              <div class="card-label">Total in Collections</div>
            </div>
            <div class="summary-card warning">
              <div class="card-value">{{ preCollectionCount() }}</div>
              <div class="card-label">Pre-Collection</div>
            </div>
            <div class="summary-card">
              <div class="card-value">{{ inCollectionCount() }}</div>
              <div class="card-label">With Agency</div>
            </div>
            <div class="summary-card">
              <div class="card-value">{{ formatCurrency(badDebtTotal()) }}</div>
              <div class="card-label">Bad Debt</div>
            </div>
          </div>

          <!-- Collections Table -->
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Statement #</th>
                  <th>Balance</th>
                  <th>Age</th>
                  <th>Collection Status</th>
                  <th>Agency</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (statement of collectionsStatements(); track statement.id) {
                  <tr>
                    <td>{{ statement.patientName }}</td>
                    <td>
                      <a class="link" (click)="viewStatement(statement)">
                        {{ statement.statementNumber }}
                      </a>
                    </td>
                    <td class="amount">{{ formatCurrency(statement.currentBalance) }}</td>
                    <td>{{ getAgeDays(statement) }} days</td>
                    <td>
                      <span class="collection-status" [class]="'collection-' + statement.collectionStatus">
                        {{ getCollectionStatusLabel(statement.collectionStatus) }}
                      </span>
                    </td>
                    <td>{{ statement.collectionAgency || '-' }}</td>
                    <td>
                      <div class="action-buttons">
                        <button class="btn btn-secondary btn-sm" (click)="viewStatement(statement)">
                          View
                        </button>
                        @if (statement.collectionStatus === 'pre_collection') {
                          <button class="btn btn-warning btn-sm" (click)="assignToAgency(statement)">
                            Assign Agency
                          </button>
                        }
                        <button class="btn btn-ghost btn-sm" (click)="writeOff(statement)">
                          Write Off
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="empty-state">
                      <div class="empty-content">
                        <span class="empty-icon">✅</span>
                        <p>No accounts in collections</p>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Generate Statements Modal -->
      @if (showGenerateModal()) {
        <div class="modal-overlay" (click)="closeGenerateModal()">
          <div class="modal-content large" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Generate Patient Statements</h2>
              <button class="btn btn-icon" (click)="closeGenerateModal()">✕</button>
            </div>
            
            <div class="modal-body">
              <form [formGroup]="generateForm">
                <!-- Statement Period -->
                <div class="form-section">
                  <h4>Statement Period</h4>
                  <div class="form-row">
                    <div class="form-group">
                      <label>From Date</label>
                      <input type="date" formControlName="periodStart">
                    </div>
                    <div class="form-group">
                      <label>To Date</label>
                      <input type="date" formControlName="periodEnd">
                    </div>
                    <div class="form-group">
                      <label>Due Date</label>
                      <input type="date" formControlName="dueDate">
                    </div>
                  </div>
                </div>

                <!-- Selection Criteria -->
                <div class="form-section">
                  <h4>Patient Selection</h4>
                  <div class="form-row">
                    <div class="form-group">
                      <label>Minimum Balance</label>
                      <div class="input-prefix">
                        <span class="prefix">$</span>
                        <input type="number" formControlName="minimumBalance" min="0" step="0.01">
                      </div>
                    </div>
                    <div class="form-group">
                      <label>Minimum Age (Days)</label>
                      <input type="number" formControlName="minimumAge" min="0">
                    </div>
                  </div>

                  <div class="form-group">
                    <label>Include Patients</label>
                    <div class="checkbox-group">
                      <label class="checkbox">
                        <input type="checkbox" formControlName="includeInsurancePending">
                        <span>With pending insurance claims</span>
                      </label>
                      <label class="checkbox">
                        <input type="checkbox" formControlName="includePaymentPlan">
                        <span>On payment plans</span>
                      </label>
                      <label class="checkbox">
                        <input type="checkbox" formControlName="includeCollections">
                        <span>In collections</span>
                      </label>
                    </div>
                  </div>
                </div>

                <!-- Delivery Options -->
                <div class="form-section">
                  <h4>Delivery Method</h4>
                  <div class="delivery-options">
                    <label class="delivery-option" [class.selected]="generateForm.get('deliveryMethod')?.value === 'email'">
                      <input type="radio" formControlName="deliveryMethod" value="email">
                      <span class="option-icon">📧</span>
                      <span class="option-label">Email</span>
                      <span class="option-desc">Send to patient email addresses</span>
                    </label>
                    <label class="delivery-option" [class.selected]="generateForm.get('deliveryMethod')?.value === 'portal'">
                      <input type="radio" formControlName="deliveryMethod" value="portal">
                      <span class="option-icon">🌐</span>
                      <span class="option-label">Portal</span>
                      <span class="option-desc">Publish to patient portal</span>
                    </label>
                    <label class="delivery-option" [class.selected]="generateForm.get('deliveryMethod')?.value === 'mail'">
                      <input type="radio" formControlName="deliveryMethod" value="mail">
                      <span class="option-icon">📬</span>
                      <span class="option-label">Print/Mail</span>
                      <span class="option-desc">Generate PDFs for printing</span>
                    </label>
                  </div>
                </div>

                <!-- Preview -->
                <div class="form-section">
                  <h4>Preview</h4>
                  <div class="preview-stats">
                    <div class="preview-stat">
                      <span class="stat-value">{{ previewCount() }}</span>
                      <span class="stat-label">Patients</span>
                    </div>
                    <div class="preview-stat">
                      <span class="stat-value">{{ formatCurrency(previewTotal()) }}</span>
                      <span class="stat-label">Total Balance</span>
                    </div>
                  </div>
                  <button type="button" class="btn btn-secondary" (click)="refreshPreview()">
                    🔄 Refresh Preview
                  </button>
                </div>
              </form>
            </div>

            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeGenerateModal()">Cancel</button>
              <button class="btn btn-primary" (click)="generateStatements()" 
                [disabled]="!generateForm.valid || previewCount() === 0">
                Generate {{ previewCount() }} Statements
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Statement Detail Modal -->
      @if (selectedStatement()) {
        <div class="modal-overlay" (click)="closeStatementDetail()">
          <div class="modal-content large" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Statement {{ selectedStatement()!.statementNumber }}</h2>
              <button class="btn btn-icon" (click)="closeStatementDetail()">✕</button>
            </div>
            
            <div class="modal-body">
              <!-- Patient Info -->
              <div class="statement-header">
                <div class="patient-details">
                  <h3>{{ selectedStatement()!.patientName }}</h3>
                  <p>{{ selectedStatement()!.address.street }}</p>
                  <p>{{ selectedStatement()!.address.city }}, {{ selectedStatement()!.address.state }} {{ selectedStatement()!.address.zip }}</p>
                </div>
                <div class="statement-info">
                  <div class="info-row">
                    <span class="label">Statement Date:</span>
                    <span>{{ formatDate(selectedStatement()!.statementDate) }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Due Date:</span>
                    <span>{{ formatDate(selectedStatement()!.dueDate) }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Status:</span>
                    <span class="status-badge" [class]="'status-' + selectedStatement()!.status">
                      {{ getStatusLabel(selectedStatement()!.status) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Balance Summary -->
              <div class="balance-summary">
                <div class="balance-row">
                  <span>Previous Balance</span>
                  <span>{{ formatCurrency(selectedStatement()!.previousBalance) }}</span>
                </div>
                <div class="balance-row">
                  <span>New Charges</span>
                  <span>{{ formatCurrency(selectedStatement()!.newCharges) }}</span>
                </div>
                <div class="balance-row">
                  <span>Payments</span>
                  <span class="credit">-{{ formatCurrency(selectedStatement()!.payments) }}</span>
                </div>
                <div class="balance-row">
                  <span>Adjustments</span>
                  <span class="credit">-{{ formatCurrency(selectedStatement()!.adjustments) }}</span>
                </div>
                <div class="balance-row total">
                  <span>Amount Due</span>
                  <span>{{ formatCurrency(selectedStatement()!.currentBalance) }}</span>
                </div>
              </div>

              <!-- Line Items -->
              <div class="line-items-section">
                <h4>Charges</h4>
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th class="text-right">Charges</th>
                      <th class="text-right">Ins. Paid</th>
                      <th class="text-right">Adjustments</th>
                      <th class="text-right">You Owe</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of selectedStatement()!.lineItems; track item.id) {
                      <tr>
                        <td>{{ formatDate(item.serviceDate) }}</td>
                        <td>{{ item.description }}</td>
                        <td class="text-right">{{ formatCurrency(item.charges) }}</td>
                        <td class="text-right">{{ formatCurrency(item.insurancePaid) }}</td>
                        <td class="text-right">{{ formatCurrency(item.adjustments) }}</td>
                        <td class="text-right">{{ formatCurrency(item.patientResponsibility) }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Payment History -->
              @if (selectedStatement()!.paymentHistory.length > 0) {
                <div class="payment-history-section">
                  <h4>Recent Payments</h4>
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (payment of selectedStatement()!.paymentHistory; track payment.id) {
                        <tr>
                          <td>{{ formatDate(payment.date) }}</td>
                          <td class="credit">{{ formatCurrency(payment.amount) }}</td>
                          <td>{{ payment.method }}</td>
                          <td>{{ payment.reference || '-' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }

              <!-- Aging -->
              <div class="aging-detail-section">
                <h4>Account Aging</h4>
                <div class="aging-boxes">
                  <div class="aging-box">
                    <span class="label">Current</span>
                    <span class="value">{{ formatCurrency(selectedStatement()!.agingBuckets.current) }}</span>
                  </div>
                  <div class="aging-box">
                    <span class="label">1-30 Days</span>
                    <span class="value">{{ formatCurrency(selectedStatement()!.agingBuckets.days30) }}</span>
                  </div>
                  <div class="aging-box warning">
                    <span class="label">31-60 Days</span>
                    <span class="value">{{ formatCurrency(selectedStatement()!.agingBuckets.days60) }}</span>
                  </div>
                  <div class="aging-box danger">
                    <span class="label">61-90 Days</span>
                    <span class="value">{{ formatCurrency(selectedStatement()!.agingBuckets.days90) }}</span>
                  </div>
                  <div class="aging-box danger">
                    <span class="label">90+ Days</span>
                    <span class="value">{{ formatCurrency(selectedStatement()!.agingBuckets.days120Plus) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="printStatement(selectedStatement()!)">
                🖨️ Print
              </button>
              <button class="btn btn-secondary" (click)="sendStatement(selectedStatement()!)"
                [disabled]="selectedStatement()!.status === 'paid'">
                📧 Send
              </button>
              <button class="btn btn-primary" (click)="recordPayment(selectedStatement()!)">
                💳 Record Payment
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .statements-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .header-content h1 {
      font-size: 28px;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 4px 0;
    }

    .subtitle {
      color: #64748b;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    /* Tabs */
    .tab-navigation {
      display: flex;
      gap: 4px;
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 24px;
    }

    .tab-btn {
      padding: 12px 20px;
      border: none;
      background: transparent;
      color: #64748b;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .tab-btn:hover {
      color: #1e40af;
    }

    .tab-btn.active {
      color: #1e40af;
      border-bottom-color: #1e40af;
    }

    .tab-btn .badge {
      background: #ef4444;
      color: white;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 10px;
    }

    /* Filters */
    .filters-bar {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 20px;
      padding: 16px;
      background: #f8fafc;
      border-radius: 8px;
    }

    .search-box {
      display: flex;
      align-items: center;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 0 12px;
      flex: 1;
      min-width: 250px;
    }

    .search-box input {
      border: none;
      outline: none;
      padding: 8px;
      flex: 1;
      font-size: 14px;
    }

    .filters-bar select,
    .filters-bar input[type="date"] {
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 14px;
      background: white;
    }

    /* Summary Cards */
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .summary-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }

    .summary-card.warning {
      border-color: #f59e0b;
      background: #fffbeb;
    }

    .summary-card.danger {
      border-color: #ef4444;
      background: #fef2f2;
    }

    .summary-card.info {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .card-value {
      font-size: 24px;
      font-weight: 600;
      color: #1e293b;
    }

    .card-label {
      font-size: 13px;
      color: #64748b;
      margin-top: 4px;
    }

    /* Tables */
    .table-container {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th {
      text-align: left;
      padding: 12px 16px;
      background: #f8fafc;
      font-weight: 600;
      color: #475569;
      font-size: 13px;
      border-bottom: 1px solid #e2e8f0;
    }

    .data-table td {
      padding: 12px 16px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
      font-size: 14px;
    }

    .data-table tr:hover {
      background: #f8fafc;
    }

    .data-table tr.overdue {
      background: #fef2f2;
    }

    .text-right {
      text-align: right;
    }

    .amount {
      font-weight: 500;
      font-family: monospace;
    }

    .total {
      font-weight: 600;
    }

    .warning-text {
      color: #f59e0b;
    }

    .danger-text {
      color: #ef4444;
    }

    .overdue-text {
      color: #ef4444;
      font-weight: 500;
    }

    .credit {
      color: #10b981;
    }

    /* Status Badges */
    .status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .status-draft { background: #f1f5f9; color: #475569; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-sent { background: #dbeafe; color: #1e40af; }
    .status-viewed { background: #e0e7ff; color: #3730a3; }
    .status-paid { background: #d1fae5; color: #065f46; }
    .status-overdue { background: #fee2e2; color: #991b1b; }
    .status-collections { background: #fecaca; color: #7f1d1d; }

    .batch-pending { background: #fef3c7; color: #92400e; }
    .batch-processing { background: #dbeafe; color: #1e40af; }
    .batch-sent { background: #e0e7ff; color: #3730a3; }
    .batch-completed { background: #d1fae5; color: #065f46; }
    .batch-failed { background: #fee2e2; color: #991b1b; }

    /* Delivery Badges */
    .delivery-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }

    .delivery-mail { background: #f1f5f9; color: #475569; }
    .delivery-email { background: #dbeafe; color: #1e40af; }
    .delivery-portal { background: #e0e7ff; color: #3730a3; }
    .delivery-mixed { background: #fef3c7; color: #92400e; }

    /* Collection Status */
    .collection-status {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .collection-pre_collection { background: #fef3c7; color: #92400e; }
    .collection-in_collection { background: #fee2e2; color: #991b1b; }
    .collection-bad_debt { background: #fecaca; color: #7f1d1d; }
    .collection-write_off { background: #f1f5f9; color: #475569; }

    /* Action Buttons */
    .action-buttons {
      display: flex;
      gap: 4px;
    }

    .btn {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .btn-primary {
      background: #1e40af;
      color: white;
    }

    .btn-primary:hover {
      background: #1e3a8a;
    }

    .btn-secondary {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #e2e8f0;
    }

    .btn-secondary:hover {
      background: #e2e8f0;
    }

    .btn-warning {
      background: #f59e0b;
      color: white;
    }

    .btn-ghost {
      background: transparent;
      color: #64748b;
    }

    .btn-ghost:hover {
      background: #f1f5f9;
    }

    .btn-icon {
      padding: 6px;
      background: transparent;
      border: none;
      cursor: pointer;
      font-size: 14px;
    }

    .btn-icon:hover {
      background: #f1f5f9;
      border-radius: 4px;
    }

    .btn-icon:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 13px;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Bulk Actions */
    .bulk-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: #eff6ff;
      border-radius: 8px;
      margin-top: 16px;
    }

    .selection-count {
      font-weight: 500;
      color: #1e40af;
    }

    /* Link */
    .link {
      color: #1e40af;
      cursor: pointer;
      text-decoration: none;
    }

    .link:hover {
      text-decoration: underline;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 48px !important;
    }

    .empty-content {
      color: #64748b;
    }

    .empty-icon {
      font-size: 32px;
      display: block;
      margin-bottom: 8px;
    }

    /* Aging Tab */
    .aging-summary {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 24px;
    }

    .aging-total {
      text-align: center;
      padding-bottom: 24px;
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 24px;
    }

    .aging-total h3 {
      color: #64748b;
      font-size: 14px;
      font-weight: 500;
      margin: 0 0 8px 0;
    }

    .total-amount {
      font-size: 36px;
      font-weight: 600;
      color: #1e293b;
    }

    .total-patients {
      font-size: 14px;
      color: #64748b;
    }

    .aging-buckets {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 16px;
    }

    .aging-bucket {
      text-align: center;
    }

    .bucket-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }

    .bucket-label {
      font-size: 12px;
      color: #64748b;
    }

    .bucket-count {
      font-size: 12px;
      color: #94a3b8;
    }

    .bucket-amount {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .aging-bucket.current .bucket-amount { color: #10b981; }
    .aging-bucket.days30 .bucket-amount { color: #3b82f6; }
    .aging-bucket.days60 .bucket-amount { color: #f59e0b; }
    .aging-bucket.days90 .bucket-amount { color: #ef4444; }
    .aging-bucket.days120 .bucket-amount { color: #991b1b; }

    .bucket-bar {
      height: 6px;
      background: #e2e8f0;
      border-radius: 3px;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      transition: width 0.3s;
    }

    .aging-bucket.current .bar-fill { background: #10b981; }
    .aging-bucket.days30 .bar-fill { background: #3b82f6; }
    .aging-bucket.days60 .bar-fill { background: #f59e0b; }
    .aging-bucket.days90 .bar-fill { background: #ef4444; }
    .aging-bucket.days120 .bar-fill { background: #991b1b; }

    /* Breakdown */
    .aging-breakdown {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
      margin-bottom: 24px;
    }

    .breakdown-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
    }

    .breakdown-card h4 {
      margin: 0 0 16px 0;
      color: #1e293b;
      font-size: 16px;
    }

    .breakdown-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .breakdown-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #f1f5f9;
    }

    .item-name {
      color: #475569;
    }

    .item-amount {
      font-weight: 500;
      font-family: monospace;
    }

    .aging-detail {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
    }

    .aging-detail h4 {
      margin: 0 0 16px 0;
    }

    /* Collections Summary */
    .collections-summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .modal-content.large {
      max-width: 900px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #e2e8f0;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 20px;
      color: #1e293b;
    }

    .modal-body {
      padding: 24px;
      overflow-y: auto;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid #e2e8f0;
      background: #f8fafc;
    }

    /* Form Sections */
    .form-section {
      margin-bottom: 24px;
    }

    .form-section h4 {
      margin: 0 0 16px 0;
      color: #1e293b;
      font-size: 14px;
      font-weight: 600;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group label {
      font-size: 13px;
      font-weight: 500;
      color: #475569;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      padding: 10px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 14px;
    }

    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: #1e40af;
      box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
    }

    .input-prefix {
      position: relative;
      display: flex;
    }

    .input-prefix .prefix {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #64748b;
    }

    .input-prefix input {
      padding-left: 28px;
      width: 100%;
    }

    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .checkbox {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 14px;
      color: #475569;
    }

    /* Delivery Options */
    .delivery-options {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .delivery-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .delivery-option:hover {
      border-color: #cbd5e1;
    }

    .delivery-option.selected {
      border-color: #1e40af;
      background: #eff6ff;
    }

    .delivery-option input {
      display: none;
    }

    .option-icon {
      font-size: 24px;
      margin-bottom: 8px;
    }

    .option-label {
      font-weight: 500;
      color: #1e293b;
    }

    .option-desc {
      font-size: 12px;
      color: #64748b;
      text-align: center;
      margin-top: 4px;
    }

    /* Preview Stats */
    .preview-stats {
      display: flex;
      gap: 32px;
      margin-bottom: 16px;
    }

    .preview-stat {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 600;
      color: #1e293b;
    }

    .stat-label {
      font-size: 13px;
      color: #64748b;
    }

    /* Statement Detail */
    .statement-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e2e8f0;
    }

    .patient-details h3 {
      margin: 0 0 8px 0;
      color: #1e293b;
    }

    .patient-details p {
      margin: 0;
      color: #64748b;
      font-size: 14px;
    }

    .statement-info {
      text-align: right;
    }

    .info-row {
      margin-bottom: 4px;
      font-size: 14px;
    }

    .info-row .label {
      color: #64748b;
      margin-right: 8px;
    }

    /* Balance Summary */
    .balance-summary {
      background: #f8fafc;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
    }

    .balance-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
    }

    .balance-row.total {
      border-top: 2px solid #e2e8f0;
      margin-top: 8px;
      padding-top: 12px;
      font-weight: 600;
      font-size: 16px;
    }

    /* Line Items Section */
    .line-items-section,
    .payment-history-section,
    .aging-detail-section {
      margin-bottom: 24px;
    }

    .line-items-section h4,
    .payment-history-section h4,
    .aging-detail-section h4 {
      margin: 0 0 12px 0;
      color: #1e293b;
    }

    /* Aging Boxes */
    .aging-boxes {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 12px;
    }

    .aging-box {
      background: #f8fafc;
      border-radius: 6px;
      padding: 12px;
      text-align: center;
    }

    .aging-box .label {
      display: block;
      font-size: 11px;
      color: #64748b;
      margin-bottom: 4px;
    }

    .aging-box .value {
      font-weight: 600;
      color: #1e293b;
    }

    .aging-box.warning {
      background: #fef3c7;
    }

    .aging-box.warning .value {
      color: #92400e;
    }

    .aging-box.danger {
      background: #fee2e2;
    }

    .aging-box.danger .value {
      color: #991b1b;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .summary-cards,
      .collections-summary {
        grid-template-columns: repeat(2, 1fr);
      }

      .aging-buckets {
        grid-template-columns: repeat(3, 1fr);
      }

      .aging-breakdown {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 16px;
      }

      .filters-bar {
        flex-direction: column;
      }

      .search-box {
        min-width: 100%;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .delivery-options {
        grid-template-columns: 1fr;
      }

      .aging-boxes {
        grid-template-columns: repeat(3, 1fr);
      }
    }
  `]
})
export class StatementsComponent implements OnInit {
  private fb = inject(FormBuilder);

  // Tab state
  activeTab = signal<'statements' | 'aging' | 'batches' | 'collections'>('statements');

  // Filter state
  searchTerm = signal('');
  statusFilter = signal('');
  deliveryFilter = signal('');
  dateFrom = signal('');
  dateTo = signal('');

  // Data
  statements = signal<PatientStatement[]>([]);
  batches = signal<StatementBatch[]>([]);
  agingReport = signal<AgingReport | null>(null);
  selectedStatements = signal<Set<string>>(new Set());
  selectedStatement = signal<PatientStatement | null>(null);

  // Modal state
  showGenerateModal = signal(false);
  previewCount = signal(0);
  previewTotal = signal(0);

  // Generate form
  generateForm: FormGroup;

  // Computed values
  filteredStatements = computed(() => {
    let result = this.statements();
    
    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      result = result.filter(s => 
        s.patientName.toLowerCase().includes(term) ||
        s.statementNumber.toLowerCase().includes(term)
      );
    }
    
    if (this.statusFilter()) {
      result = result.filter(s => s.status === this.statusFilter());
    }
    
    if (this.deliveryFilter()) {
      result = result.filter(s => s.deliveryMethod === this.deliveryFilter());
    }
    
    return result;
  });

  totalOutstanding = computed(() => 
    this.filteredStatements().reduce((sum, s) => sum + s.currentBalance, 0)
  );

  overdueCount = computed(() => 
    this.statements().filter(s => s.status === 'overdue').length
  );

  pendingCount = computed(() => 
    this.statements().filter(s => s.status === 'pending').length
  );

  collectionsCount = computed(() => 
    this.statements().filter(s => s.status === 'collections').length
  );

  collectionsStatements = computed(() => 
    this.statements().filter(s => s.status === 'collections' || s.collectionStatus)
  );

  collectionsTotal = computed(() => 
    this.collectionsStatements().reduce((sum, s) => sum + s.currentBalance, 0)
  );

  preCollectionCount = computed(() => 
    this.statements().filter(s => s.collectionStatus === 'pre_collection').length
  );

  inCollectionCount = computed(() => 
    this.statements().filter(s => s.collectionStatus === 'in_collection').length
  );

  badDebtTotal = computed(() => 
    this.statements()
      .filter(s => s.collectionStatus === 'bad_debt' || s.collectionStatus === 'write_off')
      .reduce((sum, s) => sum + s.currentBalance, 0)
  );

  statementsWithAging = computed(() => 
    this.statements().filter(s => s.currentBalance > 0)
  );

  allSelected = computed(() => {
    const filtered = this.filteredStatements();
    return filtered.length > 0 && filtered.every(s => this.selectedStatements().has(s.id));
  });

  constructor() {
    this.generateForm = this.fb.group({
      periodStart: [this.getDefaultPeriodStart(), Validators.required],
      periodEnd: [this.formatDateForInput(new Date()), Validators.required],
      dueDate: [this.getDefaultDueDate(), Validators.required],
      minimumBalance: [10, [Validators.required, Validators.min(0)]],
      minimumAge: [0],
      includeInsurancePending: [false],
      includePaymentPlan: [false],
      includeCollections: [false],
      deliveryMethod: ['email', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadStatements();
    this.loadBatches();
    this.loadAgingReport();
  }

  loadStatements(): void {
    // Mock data
    this.statements.set([
      {
        id: 'stmt-001',
        statementNumber: 'STMT-2024-001234',
        patientId: 'pat-001',
        patientName: 'John Smith',
        patientEmail: 'john.smith@email.com',
        patientPhone: '(555) 123-4567',
        address: {
          street: '123 Main St',
          city: 'Springfield',
          state: 'IL',
          zip: '62701'
        },
        statementDate: new Date('2024-12-01'),
        dueDate: new Date('2024-12-31'),
        periodStart: new Date('2024-11-01'),
        periodEnd: new Date('2024-11-30'),
        previousBalance: 150.00,
        newCharges: 325.00,
        payments: 100.00,
        adjustments: 25.00,
        currentBalance: 350.00,
        agingBuckets: {
          current: 225.00,
          days30: 75.00,
          days60: 50.00,
          days90: 0,
          days120Plus: 0
        },
        status: 'sent',
        deliveryMethod: 'email',
        sentDate: new Date('2024-12-02'),
        lineItems: [
          {
            id: 'li-001',
            serviceDate: new Date('2024-11-15'),
            description: 'Office Visit - Level 3',
            claimNumber: 'CLM-2024-001',
            charges: 175.00,
            insurancePaid: 125.00,
            adjustments: 25.00,
            patientResponsibility: 25.00,
            paid: 0,
            balance: 25.00
          },
          {
            id: 'li-002',
            serviceDate: new Date('2024-11-20'),
            description: 'Lab Work - Comprehensive Panel',
            claimNumber: 'CLM-2024-002',
            charges: 150.00,
            insurancePaid: 100.00,
            adjustments: 0,
            patientResponsibility: 50.00,
            paid: 0,
            balance: 50.00
          }
        ],
        paymentHistory: [
          {
            id: 'pay-001',
            date: new Date('2024-11-25'),
            amount: 100.00,
            method: 'Credit Card',
            reference: '**** 1234'
          }
        ]
      },
      {
        id: 'stmt-002',
        statementNumber: 'STMT-2024-001235',
        patientId: 'pat-002',
        patientName: 'Sarah Johnson',
        address: {
          street: '456 Oak Ave',
          city: 'Springfield',
          state: 'IL',
          zip: '62702'
        },
        statementDate: new Date('2024-11-15'),
        dueDate: new Date('2024-12-15'),
        periodStart: new Date('2024-10-01'),
        periodEnd: new Date('2024-10-31'),
        previousBalance: 0,
        newCharges: 450.00,
        payments: 0,
        adjustments: 0,
        currentBalance: 450.00,
        agingBuckets: {
          current: 0,
          days30: 200.00,
          days60: 250.00,
          days90: 0,
          days120Plus: 0
        },
        status: 'overdue',
        deliveryMethod: 'mail',
        sentDate: new Date('2024-11-16'),
        lineItems: [
          {
            id: 'li-003',
            serviceDate: new Date('2024-10-10'),
            description: 'Annual Physical',
            charges: 250.00,
            insurancePaid: 200.00,
            adjustments: 0,
            patientResponsibility: 50.00,
            paid: 0,
            balance: 50.00
          }
        ],
        paymentHistory: []
      },
      {
        id: 'stmt-003',
        statementNumber: 'STMT-2024-001236',
        patientId: 'pat-003',
        patientName: 'Michael Chen',
        address: {
          street: '789 Pine Rd',
          city: 'Springfield',
          state: 'IL',
          zip: '62703'
        },
        statementDate: new Date('2024-08-01'),
        dueDate: new Date('2024-08-31'),
        periodStart: new Date('2024-07-01'),
        periodEnd: new Date('2024-07-31'),
        previousBalance: 500.00,
        newCharges: 275.00,
        payments: 0,
        adjustments: 0,
        currentBalance: 775.00,
        agingBuckets: {
          current: 0,
          days30: 0,
          days60: 0,
          days90: 275.00,
          days120Plus: 500.00
        },
        status: 'collections',
        deliveryMethod: 'mail',
        collectionStatus: 'pre_collection',
        lineItems: [],
        paymentHistory: []
      },
      {
        id: 'stmt-004',
        statementNumber: 'STMT-2024-001237',
        patientId: 'pat-004',
        patientName: 'Emily Davis',
        patientEmail: 'emily.davis@email.com',
        address: {
          street: '321 Elm St',
          city: 'Springfield',
          state: 'IL',
          zip: '62704'
        },
        statementDate: new Date('2024-12-15'),
        dueDate: new Date('2025-01-15'),
        periodStart: new Date('2024-11-15'),
        periodEnd: new Date('2024-12-14'),
        previousBalance: 0,
        newCharges: 125.00,
        payments: 125.00,
        adjustments: 0,
        currentBalance: 0,
        agingBuckets: {
          current: 0,
          days30: 0,
          days60: 0,
          days90: 0,
          days120Plus: 0
        },
        status: 'paid',
        deliveryMethod: 'portal',
        sentDate: new Date('2024-12-16'),
        viewedDate: new Date('2024-12-17'),
        paidDate: new Date('2024-12-18'),
        lineItems: [],
        paymentHistory: [
          {
            id: 'pay-002',
            date: new Date('2024-12-18'),
            amount: 125.00,
            method: 'Online Payment'
          }
        ]
      },
      {
        id: 'stmt-005',
        statementNumber: 'STMT-2024-001238',
        patientId: 'pat-005',
        patientName: 'Robert Wilson',
        address: {
          street: '555 Maple Dr',
          city: 'Springfield',
          state: 'IL',
          zip: '62705'
        },
        statementDate: new Date('2024-12-20'),
        dueDate: new Date('2025-01-20'),
        periodStart: new Date('2024-11-20'),
        periodEnd: new Date('2024-12-19'),
        previousBalance: 75.00,
        newCharges: 200.00,
        payments: 0,
        adjustments: 0,
        currentBalance: 275.00,
        agingBuckets: {
          current: 200.00,
          days30: 75.00,
          days60: 0,
          days90: 0,
          days120Plus: 0
        },
        status: 'pending',
        deliveryMethod: 'email',
        lineItems: [],
        paymentHistory: []
      }
    ]);
  }

  loadBatches(): void {
    this.batches.set([
      {
        id: 'batch-001',
        batchNumber: 'BATCH-2024-0045',
        createdDate: new Date('2024-12-20'),
        createdBy: 'Admin User',
        statementCount: 125,
        totalAmount: 45680.00,
        deliveryMethod: 'email',
        status: 'completed',
        sentDate: new Date('2024-12-20')
      },
      {
        id: 'batch-002',
        batchNumber: 'BATCH-2024-0044',
        createdDate: new Date('2024-12-15'),
        createdBy: 'Admin User',
        statementCount: 85,
        totalAmount: 32150.00,
        deliveryMethod: 'mail',
        status: 'completed',
        sentDate: new Date('2024-12-16')
      },
      {
        id: 'batch-003',
        batchNumber: 'BATCH-2024-0046',
        createdDate: new Date('2024-12-25'),
        createdBy: 'Admin User',
        statementCount: 45,
        totalAmount: 18500.00,
        deliveryMethod: 'mixed',
        status: 'pending'
      }
    ]);
  }

  loadAgingReport(): void {
    this.agingReport.set({
      totalPatients: 156,
      totalBalance: 125450.00,
      current: { count: 45, amount: 35200.00 },
      days30: { count: 38, amount: 28500.00 },
      days60: { count: 28, amount: 22750.00 },
      days90: { count: 25, amount: 19500.00 },
      days120Plus: { count: 20, amount: 19500.00 },
      byInsurance: [
        { name: 'Blue Cross Blue Shield', amount: 45600.00 },
        { name: 'Aetna', amount: 32100.00 },
        { name: 'United Healthcare', amount: 25800.00 },
        { name: 'Medicare', amount: 15450.00 },
        { name: 'Self Pay', amount: 6500.00 }
      ],
      byProvider: [
        { name: 'Dr. Sarah Wilson', amount: 42300.00 },
        { name: 'Dr. James Chen', amount: 38900.00 },
        { name: 'Dr. Maria Garcia', amount: 28750.00 },
        { name: 'Dr. Robert Brown', amount: 15500.00 }
      ]
    });
  }

  // Filter methods
  searchStatements(): void {
    // Filtering is reactive via computed
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.statusFilter.set('');
    this.deliveryFilter.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
  }

  // Selection methods
  toggleSelectAll(): void {
    const filtered = this.filteredStatements();
    if (this.allSelected()) {
      this.selectedStatements.set(new Set());
    } else {
      this.selectedStatements.set(new Set(filtered.map(s => s.id)));
    }
  }

  toggleSelection(id: string): void {
    const selected = new Set(this.selectedStatements());
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
    this.selectedStatements.set(selected);
  }

  // Statement actions
  viewStatement(statement: PatientStatement): void {
    this.selectedStatement.set(statement);
  }

  closeStatementDetail(): void {
    this.selectedStatement.set(null);
  }

  printStatement(statement: PatientStatement): void {
    console.log('Printing statement:', statement.statementNumber);
  }

  sendStatement(statement: PatientStatement): void {
    console.log('Sending statement:', statement.statementNumber);
  }

  sendToCollections(statement: PatientStatement): void {
    console.log('Sending to collections:', statement.statementNumber);
  }

  recordPayment(statement: PatientStatement): void {
    console.log('Recording payment for:', statement.statementNumber);
  }

  // Bulk actions
  bulkPrint(): void {
    console.log('Bulk printing:', Array.from(this.selectedStatements()));
  }

  bulkSend(): void {
    console.log('Bulk sending:', Array.from(this.selectedStatements()));
  }

  bulkExport(): void {
    console.log('Bulk exporting:', Array.from(this.selectedStatements()));
  }

  // Generate modal
  openGenerateModal(): void {
    this.showGenerateModal.set(true);
    this.refreshPreview();
  }

  closeGenerateModal(): void {
    this.showGenerateModal.set(false);
  }

  refreshPreview(): void {
    // Mock preview calculation
    this.previewCount.set(78);
    this.previewTotal.set(28450.00);
  }

  generateStatements(): void {
    console.log('Generating statements with:', this.generateForm.value);
    this.closeGenerateModal();
  }

  // Batch actions
  viewBatch(batch: StatementBatch): void {
    console.log('Viewing batch:', batch.batchNumber);
  }

  downloadBatch(batch: StatementBatch): void {
    console.log('Downloading batch:', batch.batchNumber);
  }

  processBatch(batch: StatementBatch): void {
    console.log('Processing batch:', batch.batchNumber);
  }

  // Collections actions
  assignToAgency(statement: PatientStatement): void {
    console.log('Assigning to agency:', statement.statementNumber);
  }

  writeOff(statement: PatientStatement): void {
    console.log('Writing off:', statement.statementNumber);
  }

  // Export
  exportAgingReport(): void {
    console.log('Exporting aging report');
  }

  // Helpers
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getDefaultPeriodStart(): string {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    date.setDate(1);
    return this.formatDateForInput(date);
  }

  getDefaultDueDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return this.formatDateForInput(date);
  }

  isOverdue(statement: PatientStatement): boolean {
    return new Date(statement.dueDate) < new Date() && statement.currentBalance > 0;
  }

  getAgeDays(statement: PatientStatement): number {
    const now = new Date();
    const statementDate = new Date(statement.statementDate);
    return Math.floor((now.getTime() - statementDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'draft': 'Draft',
      'pending': 'Pending',
      'sent': 'Sent',
      'viewed': 'Viewed',
      'paid': 'Paid',
      'overdue': 'Overdue',
      'collections': 'Collections'
    };
    return labels[status] || status;
  }

  getDeliveryLabel(method: string): string {
    const labels: Record<string, string> = {
      'mail': 'Mail',
      'email': 'Email',
      'portal': 'Portal',
      'mixed': 'Mixed',
      'none': 'None'
    };
    return labels[method] || method;
  }

  getDeliveryIcon(method: string): string {
    const icons: Record<string, string> = {
      'mail': '📬',
      'email': '📧',
      'portal': '🌐',
      'mixed': '📦',
      'none': '—'
    };
    return icons[method] || '';
  }

  getCollectionStatusLabel(status?: string): string {
    if (!status) return '-';
    const labels: Record<string, string> = {
      'pre_collection': 'Pre-Collection',
      'in_collection': 'With Agency',
      'bad_debt': 'Bad Debt',
      'write_off': 'Written Off'
    };
    return labels[status] || status;
  }

  getAgingPercent(bucket: string): number {
    const report = this.agingReport();
    if (!report || report.totalBalance === 0) return 0;
    
    const amounts: Record<string, number> = {
      'current': report.current?.amount || 0,
      'days30': report.days30?.amount || 0,
      'days60': report.days60?.amount || 0,
      'days90': report.days90?.amount || 0,
      'days120Plus': report.days120Plus?.amount || 0
    };
    
    return (amounts[bucket] / report.totalBalance) * 100;
  }
}
