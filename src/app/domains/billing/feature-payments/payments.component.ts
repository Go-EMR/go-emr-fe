import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BillingService } from '../data-access/services/billing.service';
import {
  Payment,
  Claim,
  PaymentMethod,
  PaymentStatus,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS
} from '../data-access/models/billing.model';

interface PaymentApplication {
  claimId: string;
  claimNumber: string;
  patientName: string;
  serviceDate: string | Date;
  totalCharges: number;
  balance: number;
  appliedAmount: number;
  applicationId?: string;
  appliedDate?: string | Date;
  appliedBy?: string;
}

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="payments-page">
      <!-- Tabs -->
      <div class="page-tabs">
        <button 
          class="tab" 
          [class.active]="activeTab() === 'list'"
          (click)="activeTab.set('list')">
          <i class="fas fa-list"></i>
          Payment List
        </button>
        <button 
          class="tab" 
          [class.active]="activeTab() === 'post'"
          (click)="activeTab.set('post')">
          <i class="fas fa-dollar-sign"></i>
          Post Payment
        </button>
        <button 
          class="tab" 
          [class.active]="activeTab() === 'era'"
          (click)="activeTab.set('era')">
          <i class="fas fa-file-import"></i>
          Import ERA
        </button>
        <button 
          class="tab" 
          [class.active]="activeTab() === 'unapplied'"
          (click)="activeTab.set('unapplied')">
          <i class="fas fa-exclamation-circle"></i>
          Unapplied
          @if (unappliedCount() > 0) {
            <span class="badge">{{ unappliedCount() }}</span>
          }
        </button>
      </div>

      <!-- Payment List Tab -->
      @if (activeTab() === 'list') {
        <div class="tab-content">
          <div class="list-header">
            <h2>Recent Payments</h2>
            <div class="header-actions">
              <div class="search-box">
                <i class="fas fa-search"></i>
                <input 
                  type="text" 
                  placeholder="Search payments..."
                  [(ngModel)]="searchQuery"
                  (ngModelChange)="searchPayments()">
              </div>
              <div class="filter-group">
                <select [(ngModel)]="filterMethod" (ngModelChange)="loadPayments()">
                  <option value="">All Methods</option>
                  @for (method of paymentMethods; track method) {
                    <option [value]="method">{{ getMethodLabel(method) }}</option>
                  }
                </select>
              </div>
              <div class="filter-group">
                <select [(ngModel)]="filterSource" (ngModelChange)="loadPayments()">
                  <option value="">All Sources</option>
                  <option value="patient">Patient</option>
                  <option value="insurance">Insurance</option>
                </select>
              </div>
              <button class="btn btn-primary" (click)="activeTab.set('post')">
                <i class="fas fa-plus"></i>
                New Payment
              </button>
            </div>
          </div>

          @if (loading()) {
            <div class="loading-state">
              <i class="fas fa-spinner fa-spin"></i>
              <span>Loading payments...</span>
            </div>
          } @else if (payments().length === 0) {
            <div class="empty-state">
              <i class="fas fa-dollar-sign"></i>
              <h3>No payments found</h3>
              <p>Post a new payment to get started</p>
            </div>
          } @else {
            <table class="payments-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Payment #</th>
                  <th>Source</th>
                  <th>Payer</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th class="amount">Amount</th>
                  <th class="amount">Applied</th>
                  <th class="amount">Unapplied</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (payment of payments(); track payment.id) {
                  <tr>
                    <td>{{ formatDate(payment.paymentDate) }}</td>
                    <td>
                      <a (click)="viewPayment(payment)">{{ payment.paymentNumber }}</a>
                    </td>
                    <td>
                      <span class="source-badge" [class]="'source-' + payment.source">
                        {{ payment.source }}
                      </span>
                    </td>
                    <td>{{ payment.payerName }}</td>
                    <td>{{ getMethodLabel(payment.method) }}</td>
                    <td class="reference">
                      {{ payment.checkNumber || payment.transactionId || '-' }}
                    </td>
                    <td class="amount">{{ formatCurrency(payment.amount) }}</td>
                    <td class="amount">{{ formatCurrency(payment.amount - (payment.unappliedAmount || 0)) }}</td>
                    <td class="amount" [class.has-unapplied]="payment.unappliedAmount && payment.unappliedAmount > 0">
                      {{ formatCurrency(payment.unappliedAmount || 0) }}
                    </td>
                    <td>
                      <span class="status-badge" [class]="'status-' + payment.status">
                        {{ getStatusLabel(payment.status) }}
                      </span>
                    </td>
                    <td class="actions">
                      @if (payment.unappliedAmount && payment.unappliedAmount > 0) {
                        <button class="btn btn-sm btn-secondary" (click)="applyPayment(payment)">
                          Apply
                        </button>
                      }
                      <button class="btn btn-icon" (click)="printReceipt(payment)">
                        <i class="fas fa-print"></i>
                      </button>
                      @if (payment.status !== 'voided') {
                        <button class="btn btn-icon" (click)="voidPayment(payment)">
                          <i class="fas fa-ban"></i>
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      }

      <!-- Post Payment Tab -->
      @if (activeTab() === 'post') {
        <div class="tab-content">
          <div class="post-payment-form">
            <div class="form-section">
              <h3>Payment Information</h3>
              
              <div class="payment-type-selector">
                <label class="type-option" [class.selected]="paymentSource() === 'patient'">
                  <input 
                    type="radio" 
                    name="paymentSource"
                    value="patient"
                    [checked]="paymentSource() === 'patient'"
                    (change)="paymentSource.set('patient')">
                  <i class="fas fa-user"></i>
                  <span>Patient Payment</span>
                </label>
                <label class="type-option" [class.selected]="paymentSource() === 'insurance'">
                  <input 
                    type="radio" 
                    name="paymentSource"
                    value="insurance"
                    [checked]="paymentSource() === 'insurance'"
                    (change)="paymentSource.set('insurance')">
                  <i class="fas fa-shield-alt"></i>
                  <span>Insurance Payment</span>
                </label>
              </div>

              <form [formGroup]="paymentForm" class="payment-details">
                <div class="form-row">
                  <div class="form-group">
                    <label>Payment Date *</label>
                    <input type="date" formControlName="paymentDate">
                  </div>
                  <div class="form-group">
                    <label>Payment Amount *</label>
                    <div class="amount-input">
                      <span class="currency">$</span>
                      <input type="number" formControlName="amount" step="0.01" min="0">
                    </div>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Payment Method *</label>
                    <select formControlName="method">
                      @for (method of paymentMethods; track method) {
                        <option [value]="method">{{ getMethodLabel(method) }}</option>
                      }
                    </select>
                  </div>
                  
                  @if (paymentForm.get('method')?.value === 'check') {
                    <div class="form-group">
                      <label>Check Number</label>
                      <input type="text" formControlName="checkNumber">
                    </div>
                  }
                  
                  @if (paymentForm.get('method')?.value === 'credit' || paymentForm.get('method')?.value === 'debit') {
                    <div class="form-group">
                      <label>Card Type</label>
                      <select formControlName="cardType">
                        <option value="visa">Visa</option>
                        <option value="mastercard">Mastercard</option>
                        <option value="amex">American Express</option>
                        <option value="discover">Discover</option>
                      </select>
                    </div>
                  }
                  
                  @if (paymentForm.get('method')?.value === 'eft') {
                    <div class="form-group">
                      <label>Transaction ID</label>
                      <input type="text" formControlName="transactionId">
                    </div>
                  }
                </div>

                @if (paymentSource() === 'insurance') {
                  <div class="form-row">
                    <div class="form-group">
                      <label>Payer</label>
                      <select formControlName="payerId">
                        <option value="">Select Payer</option>
                        @for (payer of payers(); track payer.id) {
                          <option [value]="payer.id">{{ payer.name }}</option>
                        }
                      </select>
                    </div>
                    <div class="form-group">
                      <label>ERA/Check Number</label>
                      <input type="text" formControlName="eraNumber">
                    </div>
                  </div>
                } @else {
                  <div class="form-row">
                    <div class="form-group full-width">
                      <label>Patient</label>
                      <div class="patient-search">
                        <input 
                          type="text" 
                          placeholder="Search patient..."
                          [(ngModel)]="patientSearchQuery"
                          [ngModelOptions]="{standalone: true}"
                          (input)="searchPatients()">
                        @if (patientResults().length > 0) {
                          <div class="search-dropdown">
                            @for (patient of patientResults(); track patient.id) {
                              <div class="search-result" (click)="selectPatient(patient)">
                                {{ patient.name }} - {{ patient.dob }}
                              </div>
                            }
                          </div>
                        }
                      </div>
                      @if (selectedPatient()) {
                        <div class="selected-patient-badge">
                          {{ selectedPatient()!.name }}
                          <button type="button" (click)="clearPatient()">×</button>
                        </div>
                      }
                    </div>
                  </div>
                }

                <div class="form-group">
                  <label>Notes</label>
                  <textarea formControlName="notes" rows="2" placeholder="Payment notes..."></textarea>
                </div>
              </form>
            </div>

            <!-- Apply to Claims -->
            <div class="form-section">
              <h3>Apply to Claims</h3>
              
              @if (availableClaims().length === 0) {
                <div class="empty-claims">
                  <p>{{ paymentSource() === 'patient' ? 'Select a patient to see their open claims' : 'Select a payer to see open claims' }}</p>
                </div>
              } @else {
                <div class="claims-to-apply">
                  <table class="apply-table">
                    <thead>
                      <tr>
                        <th class="checkbox-col">
                          <input type="checkbox" (change)="toggleSelectAll($event)">
                        </th>
                        <th>Claim #</th>
                        <th>Patient</th>
                        <th>Service Date</th>
                        <th class="amount">Charges</th>
                        <th class="amount">Balance</th>
                        <th class="amount">Apply Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (claim of availableClaims(); track claim.claimId) {
                        <tr [class.selected]="claim.appliedAmount > 0">
                          <td class="checkbox-col">
                            <input 
                              type="checkbox"
                              [checked]="claim.appliedAmount > 0"
                              (change)="toggleClaimSelection(claim)">
                          </td>
                          <td>
                            <a [routerLink]="['/billing/claims', claim.claimId]">{{ claim.claimNumber }}</a>
                          </td>
                          <td>{{ claim.patientName }}</td>
                          <td>{{ formatDate(claim.serviceDate) }}</td>
                          <td class="amount">{{ formatCurrency(claim.totalCharges) }}</td>
                          <td class="amount">{{ formatCurrency(claim.balance) }}</td>
                          <td class="amount">
                            <input 
                              type="number"
                              class="apply-amount-input"
                              [(ngModel)]="claim.appliedAmount"
                              [max]="claim.balance"
                              step="0.01"
                              min="0"
                              (change)="calculateTotals()">
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }

              <div class="payment-summary">
                <div class="summary-row">
                  <span>Payment Amount:</span>
                  <span>{{ formatCurrency(paymentForm.get('amount')?.value || 0) }}</span>
                </div>
                <div class="summary-row">
                  <span>Total Applied:</span>
                  <span>{{ formatCurrency(totalApplied()) }}</span>
                </div>
                <div class="summary-row" [class.warning]="remainingToApply() > 0">
                  <span>Remaining to Apply:</span>
                  <span>{{ formatCurrency(remainingToApply()) }}</span>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button class="btn btn-secondary" (click)="cancelPayment()">Cancel</button>
              <button 
                class="btn btn-primary" 
                (click)="savePayment()"
                [disabled]="!paymentForm.valid || saving()">
                <i class="fas fa-save"></i>
                Post Payment
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ERA Import Tab -->
      @if (activeTab() === 'era') {
        <div class="tab-content">
          <div class="era-import">
            <div class="upload-section">
              <div class="upload-area" 
                   (dragover)="onDragOver($event)"
                   (dragleave)="onDragLeave($event)"
                   (drop)="onDrop($event)"
                   [class.dragging]="isDragging()">
                <i class="fas fa-cloud-upload-alt"></i>
                <h3>Import ERA/835 File</h3>
                <p>Drag and drop an 835 file here, or click to browse</p>
                <input 
                  type="file" 
                  #fileInput
                  accept=".835,.txt,.edi"
                  (change)="onFileSelected($event)"
                  style="display: none">
                <button class="btn btn-secondary" (click)="fileInput.click()">
                  <i class="fas fa-folder-open"></i>
                  Browse Files
                </button>
              </div>

              @if (uploadedFile()) {
                <div class="uploaded-file">
                  <i class="fas fa-file-alt"></i>
                  <span class="file-name">{{ uploadedFile()!.name }}</span>
                  <span class="file-size">{{ formatFileSize(uploadedFile()!.size) }}</span>
                  <button class="btn btn-icon" (click)="removeFile()">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              }
            </div>

            @if (eraParseResult()) {
              <div class="era-preview">
                <h3>ERA Preview</h3>
                <div class="era-summary">
                  <div class="summary-card">
                    <span class="label">Payer</span>
                    <span class="value">{{ eraParseResult()!.payerName }}</span>
                  </div>
                  <div class="summary-card">
                    <span class="label">Check/EFT #</span>
                    <span class="value">{{ eraParseResult()!.checkNumber }}</span>
                  </div>
                  <div class="summary-card">
                    <span class="label">Payment Date</span>
                    <span class="value">{{ formatDate(eraParseResult()!.paymentDate) }}</span>
                  </div>
                  <div class="summary-card">
                    <span class="label">Total Amount</span>
                    <span class="value">{{ formatCurrency(eraParseResult()!.totalAmount) }}</span>
                  </div>
                  <div class="summary-card">
                    <span class="label">Claims</span>
                    <span class="value">{{ eraParseResult()!.claims.length }}</span>
                  </div>
                </div>

                <table class="era-claims-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Claim #</th>
                      <th>Service Date</th>
                      <th class="amount">Billed</th>
                      <th class="amount">Allowed</th>
                      <th class="amount">Paid</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (claim of eraParseResult()!.claims; track claim.claimNumber) {
                      <tr [class.match-found]="claim.matchedClaimId" [class.no-match]="!claim.matchedClaimId">
                        <td>{{ claim.patientName }}</td>
                        <td>{{ claim.claimNumber }}</td>
                        <td>{{ formatDate(claim.serviceDate) }}</td>
                        <td class="amount">{{ formatCurrency(claim.billedAmount) }}</td>
                        <td class="amount">{{ formatCurrency(claim.allowedAmount) }}</td>
                        <td class="amount">{{ formatCurrency(claim.paidAmount) }}</td>
                        <td>
                          @if (claim.matchedClaimId) {
                            <span class="match-badge success">
                              <i class="fas fa-check"></i>
                              Matched
                            </span>
                          } @else {
                            <span class="match-badge warning">
                              <i class="fas fa-exclamation-triangle"></i>
                              No Match
                            </span>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>

                <div class="era-actions">
                  <button class="btn btn-secondary" (click)="cancelEraImport()">Cancel</button>
                  <button class="btn btn-primary" (click)="processEra()" [disabled]="processingEra()">
                    <i class="fas fa-check"></i>
                    Process ERA & Post Payments
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Unapplied Payments Tab -->
      @if (activeTab() === 'unapplied') {
        <div class="tab-content">
          <div class="unapplied-section">
            <h2>Unapplied Payments</h2>
            <p class="section-description">These payments have remaining amounts that haven't been applied to claims</p>

            @if (unappliedPayments().length === 0) {
              <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <h3>All payments applied!</h3>
                <p>There are no unapplied payment amounts</p>
              </div>
            } @else {
              <table class="payments-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Payment #</th>
                    <th>Source</th>
                    <th>Payer</th>
                    <th class="amount">Total Amount</th>
                    <th class="amount">Unapplied</th>
                    <th>Age</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (payment of unappliedPayments(); track payment.id) {
                    <tr>
                      <td>{{ formatDate(payment.paymentDate) }}</td>
                      <td>{{ payment.paymentNumber }}</td>
                      <td>{{ payment.source }}</td>
                      <td>{{ payment.payerName }}</td>
                      <td class="amount">{{ formatCurrency(payment.amount) }}</td>
                      <td class="amount unapplied">{{ formatCurrency(payment.unappliedAmount || 0) }}</td>
                      <td>{{ calculateAge(payment.paymentDate) }} days</td>
                      <td>
                        <button class="btn btn-sm btn-primary" (click)="applyPayment(payment)">
                          Apply
                        </button>
                        <button class="btn btn-sm btn-secondary" (click)="refundPayment(payment)">
                          Refund
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>

              <div class="unapplied-summary">
                <span>Total Unapplied: </span>
                <strong>{{ formatCurrency(totalUnapplied()) }}</strong>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .payments-page {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Tabs */
    .page-tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 0;
    }

    .tab {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      color: #64748b;
      transition: all 0.15s;
    }

    .tab:hover {
      color: #1e293b;
    }

    .tab.active {
      color: #3b82f6;
      border-bottom-color: #3b82f6;
    }

    .tab .badge {
      background: #ef4444;
      color: white;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
    }

    .tab-content {
      background: white;
      border-radius: 0.75rem;
      border: 1px solid #e2e8f0;
      padding: 1.5rem;
    }

    /* List Header */
    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .list-header h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .search-box {
      position: relative;
    }

    .search-box i {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
    }

    .search-box input {
      padding: 0.5rem 0.75rem 0.5rem 2.25rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
      width: 200px;
    }

    .filter-group select {
      padding: 0.5rem 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
      border: none;
      font-size: 0.875rem;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-secondary {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #e2e8f0;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #e2e8f0;
    }

    .btn-icon {
      padding: 0.375rem;
      background: none;
      color: #64748b;
    }

    .btn-icon:hover {
      color: #1e293b;
    }

    .btn-sm {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
    }

    /* Tables */
    .payments-table, .apply-table, .era-claims-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .payments-table th, .apply-table th, .era-claims-table th {
      text-align: left;
      padding: 0.75rem 0.5rem;
      background: #f8fafc;
      border-bottom: 2px solid #e2e8f0;
      font-weight: 600;
      color: #475569;
      font-size: 0.75rem;
      text-transform: uppercase;
    }

    .payments-table td, .apply-table td, .era-claims-table td {
      padding: 0.75rem 0.5rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .payments-table a, .apply-table a {
      color: #3b82f6;
      text-decoration: none;
      cursor: pointer;
    }

    .payments-table a:hover, .apply-table a:hover {
      text-decoration: underline;
    }

    .amount {
      text-align: right;
      font-family: monospace;
    }

    .has-unapplied {
      color: #f59e0b;
      font-weight: 600;
    }

    .unapplied {
      color: #ef4444;
      font-weight: 600;
    }

    .reference {
      font-family: monospace;
      font-size: 0.75rem;
    }

    .checkbox-col {
      width: 2rem;
      text-align: center;
    }

    /* Badges */
    .source-badge {
      font-size: 0.625rem;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      text-transform: uppercase;
      font-weight: 600;
    }

    .source-patient { background: #dbeafe; color: #1e40af; }
    .source-insurance { background: #d1fae5; color: #065f46; }

    .status-badge {
      font-size: 0.625rem;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      text-transform: uppercase;
      font-weight: 600;
    }

    .status-posted { background: #d1fae5; color: #065f46; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-voided { background: #f1f5f9; color: #64748b; }
    .status-refunded { background: #fee2e2; color: #991b1b; }

    /* States */
    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      color: #64748b;
    }

    .loading-state i, .empty-state i {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .empty-state i {
      color: #cbd5e1;
    }

    /* Post Payment Form */
    .post-payment-form {
      max-width: 900px;
    }

    .form-section {
      margin-bottom: 2rem;
    }

    .form-section h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 1rem 0;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .payment-type-selector {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .type-option {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1.5rem;
      border: 2px solid #e2e8f0;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.15s;
    }

    .type-option input {
      display: none;
    }

    .type-option i {
      font-size: 2rem;
      color: #64748b;
    }

    .type-option span {
      font-weight: 500;
      color: #475569;
    }

    .type-option:hover {
      border-color: #94a3b8;
    }

    .type-option.selected {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .type-option.selected i {
      color: #3b82f6;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .form-group.full-width {
      grid-column: span 2;
    }

    .form-group label {
      font-size: 0.75rem;
      font-weight: 500;
      color: #475569;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      padding: 0.625rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
      font-size: 0.875rem;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .amount-input {
      display: flex;
      align-items: center;
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
      overflow: hidden;
    }

    .amount-input .currency {
      padding: 0.625rem;
      background: #f8fafc;
      color: #64748b;
      border-right: 1px solid #e2e8f0;
    }

    .amount-input input {
      flex: 1;
      border: none;
      padding: 0.625rem;
    }

    .amount-input input:focus {
      outline: none;
      box-shadow: none;
    }

    .patient-search {
      position: relative;
    }

    .patient-search input {
      width: 100%;
      padding: 0.625rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
    }

    .search-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      max-height: 200px;
      overflow-y: auto;
      z-index: 10;
    }

    .search-result {
      padding: 0.5rem 0.75rem;
      cursor: pointer;
    }

    .search-result:hover {
      background: #f8fafc;
    }

    .selected-patient-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
      padding: 0.375rem 0.75rem;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 0.375rem;
      font-size: 0.875rem;
    }

    .selected-patient-badge button {
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      font-size: 1rem;
    }

    /* Claims to Apply */
    .empty-claims {
      text-align: center;
      padding: 2rem;
      color: #64748b;
      background: #f8fafc;
      border-radius: 0.5rem;
    }

    .apply-table tr.selected {
      background: #eff6ff;
    }

    .apply-amount-input {
      width: 100px;
      padding: 0.375rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.25rem;
      text-align: right;
    }

    .payment-summary {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-top: 1rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 0.5rem;
    }

    .payment-summary .summary-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
    }

    .payment-summary .summary-row.warning span:last-child {
      color: #f59e0b;
      font-weight: 600;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e2e8f0;
    }

    /* ERA Import */
    .era-import {
      max-width: 1000px;
    }

    .upload-section {
      margin-bottom: 2rem;
    }

    .upload-area {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      border: 2px dashed #e2e8f0;
      border-radius: 0.75rem;
      background: #f8fafc;
      transition: all 0.15s;
    }

    .upload-area.dragging {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .upload-area i {
      font-size: 3rem;
      color: #94a3b8;
      margin-bottom: 1rem;
    }

    .upload-area h3 {
      margin: 0 0 0.5rem 0;
      color: #1e293b;
    }

    .upload-area p {
      color: #64748b;
      margin: 0 0 1rem 0;
    }

    .uploaded-file {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 0.375rem;
      margin-top: 1rem;
    }

    .uploaded-file i {
      color: #3b82f6;
    }

    .file-name {
      font-weight: 500;
    }

    .file-size {
      color: #64748b;
      font-size: 0.75rem;
      margin-left: auto;
    }

    /* ERA Preview */
    .era-preview h3 {
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 1rem 0;
    }

    .era-summary {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .era-summary .summary-card {
      padding: 1rem;
      background: #f8fafc;
      border-radius: 0.5rem;
      text-align: center;
    }

    .era-summary .label {
      display: block;
      font-size: 0.75rem;
      color: #64748b;
      margin-bottom: 0.25rem;
    }

    .era-summary .value {
      font-weight: 600;
      color: #1e293b;
    }

    .era-claims-table tr.match-found {
      background: #f0fdf4;
    }

    .era-claims-table tr.no-match {
      background: #fef3c7;
    }

    .match-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.625rem;
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
      font-weight: 600;
    }

    .match-badge.success {
      background: #d1fae5;
      color: #065f46;
    }

    .match-badge.warning {
      background: #fef3c7;
      color: #92400e;
    }

    .era-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }

    /* Unapplied Section */
    .unapplied-section h2 {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    .section-description {
      color: #64748b;
      margin: 0 0 1.5rem 0;
    }

    .unapplied-summary {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1rem;
      padding: 1rem;
      background: #fef3c7;
      border-radius: 0.5rem;
      color: #92400e;
    }

    .unapplied-summary strong {
      font-size: 1.125rem;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
      }

      .form-group.full-width {
        grid-column: span 1;
      }

      .payment-type-selector {
        flex-direction: column;
      }

      .era-summary {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class PaymentsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private billingService = inject(BillingService);

  // Tabs
  activeTab = signal<'list' | 'post' | 'era' | 'unapplied'>('list');

  // List
  payments = signal<Payment[]>([]);
  loading = signal(false);
  searchQuery = '';
  filterMethod = '';
  filterSource = '';

  // Post Payment
  paymentForm: FormGroup;
  paymentSource = signal<'patient' | 'insurance'>('patient');
  saving = signal(false);
  
  // Patient/Payer Selection
  patientSearchQuery = '';
  patientResults = signal<Array<{id: string; name: string; dob: string}>>([]);
  selectedPatient = signal<{id: string; name: string; dob: string} | null>(null);
  payers = signal<Array<{id: string; name: string}>>([]);

  // Claims to Apply
  availableClaims = signal<PaymentApplication[]>([]);
  
  // ERA Import
  isDragging = signal(false);
  uploadedFile = signal<File | null>(null);
  processingEra = signal(false);
  eraParseResult = signal<{
    payerName: string;
    checkNumber: string;
    paymentDate: string;
    totalAmount: number;
    claims: Array<{
      claimNumber: string;
      patientName: string;
      serviceDate: string;
      billedAmount: number;
      allowedAmount: number;
      paidAmount: number;
      matchedClaimId?: string;
    }>;
  } | null>(null);

  // Unapplied
  unappliedPayments = signal<Payment[]>([]);
  unappliedCount = computed(() => this.unappliedPayments().length);
  totalUnapplied = computed(() => 
    this.unappliedPayments().reduce((sum, p) => sum + (p.unappliedAmount || 0), 0)
  );

  // Reference Data
  paymentMethods: PaymentMethod[] = [
    PaymentMethod.Cash,
    PaymentMethod.Check,
    PaymentMethod.CreditCard,
    PaymentMethod.DebitCard,
    PaymentMethod.EFT,
    PaymentMethod.Insurance
  ];

  constructor() {
    this.paymentForm = this.fb.group({
      paymentDate: [new Date().toISOString().split('T')[0], Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      method: ['cash', Validators.required],
      checkNumber: [''],
      cardType: ['visa'],
      transactionId: [''],
      payerId: [''],
      eraNumber: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    // Check for claimId query param to pre-select claim
    const claimId = this.route.snapshot.queryParamMap.get('claimId');
    if (claimId) {
      this.activeTab.set('post');
      this.loadClaimForPayment(claimId);
    }

    this.loadPayments();
    this.loadUnappliedPayments();
    this.loadPayers();
  }

  loadPayments(): void {
    this.loading.set(true);
    this.billingService.getPayments({
      method: this.filterMethod as PaymentMethod || undefined,
      source: this.filterSource as 'patient' | 'insurance' || undefined
    }).subscribe({
      next: (response) => {
        let filtered = response.data;
        if (this.searchQuery) {
          const query = this.searchQuery.toLowerCase();
          filtered = filtered.filter(p =>
            p.paymentNumber?.toLowerCase().includes(query) ||
            p.payerName?.toLowerCase().includes(query) ||
            p.checkNumber?.toLowerCase().includes(query)
          );
        }
        this.payments.set(filtered);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  searchPayments(): void {
    this.loadPayments();
  }

  loadUnappliedPayments(): void {
    this.billingService.getUnappliedPayments().subscribe(payments => {
      this.unappliedPayments.set(payments);
    });
  }

  loadPayers(): void {
    // Mock payers
    this.payers.set([
      { id: 'BCBS', name: 'Blue Cross Blue Shield' },
      { id: 'AETNA', name: 'Aetna' },
      { id: 'UHC', name: 'UnitedHealthcare' },
      { id: 'CIGNA', name: 'Cigna' },
      { id: 'MEDICARE', name: 'Medicare' }
    ]);
  }

  loadClaimForPayment(claimId: string): void {
    this.billingService.getClaimById(claimId).subscribe(claim => {
      // Pre-populate with claim info
      this.availableClaims.set([{
        claimId: claim.claimId || claim.id || '',
        claimNumber: claim.claimNumber,
        patientName: claim.patientName || '',
        serviceDate: claim.serviceDate,
        totalCharges: claim.totalCharges,
        balance: claim.balance || 0,
        appliedAmount: claim.balance || 0
      }]);
      
      this.paymentForm.patchValue({
        amount: claim.balance || 0
      });
    });
  }

  // Patient Search
  searchPatients(): void {
    if (this.patientSearchQuery.length < 2) {
      this.patientResults.set([]);
      return;
    }

    // Mock patient search
    const mockPatients = [
      { id: 'pat-1', name: 'John Smith', dob: '1965-03-15' },
      { id: 'pat-2', name: 'Sarah Johnson', dob: '1978-07-22' },
      { id: 'pat-3', name: 'Michael Brown', dob: '1952-11-08' }
    ];

    const query = this.patientSearchQuery.toLowerCase();
    this.patientResults.set(
      mockPatients.filter(p => p.name.toLowerCase().includes(query))
    );
  }

  selectPatient(patient: {id: string; name: string; dob: string}): void {
    this.selectedPatient.set(patient);
    this.patientResults.set([]);
    this.patientSearchQuery = '';
    this.loadPatientClaims(patient.id);
  }

  clearPatient(): void {
    this.selectedPatient.set(null);
    this.availableClaims.set([]);
  }

  loadPatientClaims(patientId: string): void {
    this.billingService.getClaims({ patientId, hasBalance: true }).subscribe(response => {
      this.availableClaims.set(response.data.map(claim => ({
        claimId: claim.claimId || claim.id || '',
        claimNumber: claim.claimNumber,
        patientName: claim.patientName || '',
        serviceDate: claim.serviceDate,
        totalCharges: claim.totalCharges,
        balance: claim.balance || 0,
        appliedAmount: 0
      })));
    });
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const paymentAmount = this.paymentForm.get('amount')?.value || 0;
    let remaining = paymentAmount;

    this.availableClaims.update(claims => {
      return claims.map(claim => {
        if (checked && remaining > 0) {
          const toApply = Math.min(remaining, claim.balance);
          remaining -= toApply;
          return { ...claim, appliedAmount: toApply };
        }
        return { ...claim, appliedAmount: 0 };
      });
    });
  }

  toggleClaimSelection(claim: PaymentApplication): void {
    if (claim.appliedAmount > 0) {
      claim.appliedAmount = 0;
    } else {
      const remaining = this.remainingToApply();
      claim.appliedAmount = Math.min(remaining, claim.balance);
    }
  }

  calculateTotals(): void {
    // Trigger reactivity
    this.availableClaims.set([...this.availableClaims()]);
  }

  totalApplied = computed(() => {
    return this.availableClaims().reduce((sum, c) => sum + (c.appliedAmount || 0), 0);
  });

  remainingToApply = computed(() => {
    const paymentAmount = this.paymentForm.get('amount')?.value || 0;
    return Math.max(0, paymentAmount - this.totalApplied());
  });

  // Payment Actions
  savePayment(): void {
    if (!this.paymentForm.valid) return;

    this.saving.set(true);
    const formValue = this.paymentForm.value;

    const paymentData: Partial<Payment> = {
      paymentDate: formValue.paymentDate,
      amount: formValue.amount,
      method: formValue.method,
      source: this.paymentSource(),
      payerName: this.paymentSource() === 'patient' 
        ? this.selectedPatient()?.name || 'Unknown'
        : this.payers().find(p => p.id === formValue.payerId)?.name || 'Unknown',
      checkNumber: formValue.checkNumber,
      cardType: formValue.cardType,
      transactionId: formValue.transactionId,
      notes: formValue.notes,
      applications: this.availableClaims()
        .filter(c => c.appliedAmount > 0)
        .map(c => ({
          applicationId: `app-${Date.now()}-${c.claimId}`,
          claimId: c.claimId,
          amount: c.appliedAmount,
          appliedDate: new Date(),
          appliedBy: 'current-user'
        })),
      unappliedAmount: this.remainingToApply()
    };

    this.billingService.createPayment(paymentData).subscribe({
      next: () => {
        this.saving.set(false);
        this.activeTab.set('list');
        this.loadPayments();
        this.loadUnappliedPayments();
        this.resetPaymentForm();
      },
      error: () => {
        this.saving.set(false);
      }
    });
  }

  cancelPayment(): void {
    this.resetPaymentForm();
    this.activeTab.set('list');
  }

  resetPaymentForm(): void {
    this.paymentForm.reset({
      paymentDate: new Date().toISOString().split('T')[0],
      amount: 0,
      method: 'cash',
      cardType: 'visa'
    });
    this.selectedPatient.set(null);
    this.availableClaims.set([]);
  }

  viewPayment(payment: Payment): void {
    // Would show payment detail modal
    console.log('View payment:', payment.paymentNumber);
  }

  applyPayment(payment: Payment): void {
    // Would open apply payment dialog
    console.log('Apply payment:', payment.paymentNumber);
  }

  printReceipt(payment: Payment): void {
    // Would generate receipt PDF
    console.log('Print receipt:', payment.paymentNumber);
  }

  voidPayment(payment: Payment): void {
    const paymentId = payment.paymentId || payment.id;
    if (!paymentId) return;
    
    const reason = prompt('Enter void reason:');
    if (reason) {
      this.billingService.voidPayment(paymentId, reason).subscribe(() => {
        this.loadPayments();
        this.loadUnappliedPayments();
      });
    }
  }

  refundPayment(payment: Payment): void {
    const amount = prompt(`Enter refund amount (max ${this.formatCurrency(payment.unappliedAmount || 0)}):`);
    if (amount) {
      console.log('Refund payment:', payment.paymentNumber, amount);
    }
  }

  // ERA Import
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  handleFile(file: File): void {
    this.uploadedFile.set(file);
    this.parseEraFile(file);
  }

  removeFile(): void {
    this.uploadedFile.set(null);
    this.eraParseResult.set(null);
  }

  parseEraFile(file: File): void {
    // Mock ERA parse result
    setTimeout(() => {
      this.eraParseResult.set({
        payerName: 'Blue Cross Blue Shield',
        checkNumber: 'CHK-789460',
        paymentDate: new Date().toISOString(),
        totalAmount: 1250.00,
        claims: [
          {
            claimNumber: 'CLM-001',
            patientName: 'John Smith',
            serviceDate: '2024-01-15',
            billedAmount: 220.00,
            allowedAmount: 175.00,
            paidAmount: 140.00,
            matchedClaimId: 'claim-1'
          },
          {
            claimNumber: 'CLM-004',
            patientName: 'John Smith',
            serviceDate: '2024-01-20',
            billedAmount: 250.00,
            allowedAmount: 218.00,
            paidAmount: 210.40,
            matchedClaimId: 'claim-4'
          },
          {
            claimNumber: 'CLM-006',
            patientName: 'Unknown Patient',
            serviceDate: '2024-01-18',
            billedAmount: 350.00,
            allowedAmount: 300.00,
            paidAmount: 240.00
            // No match
          }
        ]
      });
    }, 500);
  }

  cancelEraImport(): void {
    this.uploadedFile.set(null);
    this.eraParseResult.set(null);
  }

  processEra(): void {
    this.processingEra.set(true);
    
    // Would process ERA and post payments
    setTimeout(() => {
      this.processingEra.set(false);
      this.uploadedFile.set(null);
      this.eraParseResult.set(null);
      this.activeTab.set('list');
      this.loadPayments();
    }, 1500);
  }

  // Helpers
  calculateAge(date: string | Date): number {
    const paymentDate = new Date(date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - paymentDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getMethodLabel(method: PaymentMethod): string {
    return PAYMENT_METHOD_LABELS[method] || method;
  }

  getStatusLabel(status: PaymentStatus): string {
    return PAYMENT_STATUS_LABELS[status] || status;
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
