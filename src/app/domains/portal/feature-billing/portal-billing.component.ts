import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PortalService } from '../data-access/services/portal.service';
import { PatientStatement, PaymentMethod, PaymentRecord } from '../data-access/models/portal.model';

@Component({
  selector: 'app-portal-billing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="billing-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <a routerLink="/portal" class="back-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to Dashboard
          </a>
          <h1>Billing & Payments</h1>
        </div>
      </header>

      <!-- Balance Summary -->
      <div class="balance-card">
        <div class="balance-info">
          <span class="balance-label">Current Balance</span>
          <span class="balance-amount">{{ portalService.outstandingBalance() | currency }}</span>
        </div>
        @if (portalService.outstandingBalance() > 0) {
          <button class="btn btn-primary btn-lg" (click)="openPaymentModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            Make a Payment
          </button>
        }
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button 
          class="tab-btn"
          [class.active]="activeTab() === 'statements'"
          (click)="activeTab.set('statements')"
        >
          Statements
        </button>
        <button 
          class="tab-btn"
          [class.active]="activeTab() === 'history'"
          (click)="activeTab.set('history')"
        >
          Payment History
        </button>
        <button 
          class="tab-btn"
          [class.active]="activeTab() === 'methods'"
          (click)="activeTab.set('methods')"
        >
          Payment Methods
        </button>
      </div>

      <!-- Statements Tab -->
      @if (activeTab() === 'statements') {
        <div class="statements-list">
          @for (statement of portalService.statements(); track statement.id) {
            <div class="statement-card" [class.paid]="statement.status === 'paid'">
              <div class="statement-header">
                <div class="statement-info">
                  <h3>Statement {{ statement.statementNumber }}</h3>
                  <p class="statement-date">
                    Statement Date: {{ statement.statementDate | date:'MMM d, yyyy' }}
                  </p>
                </div>
                <div class="statement-status">
                  <span class="status-badge" [class]="statement.status">
                    {{ statement.status | titlecase }}
                  </span>
                </div>
              </div>

              <div class="statement-summary">
                <div class="summary-row">
                  <span>Total Charges</span>
                  <span>{{ statement.totalCharges | currency }}</span>
                </div>
                <div class="summary-row">
                  <span>Insurance Payments</span>
                  <span class="credit">-{{ statement.insurancePayments | currency }}</span>
                </div>
                <div class="summary-row">
                  <span>Adjustments</span>
                  <span class="credit">-{{ statement.adjustments | currency }}</span>
                </div>
                <div class="summary-row">
                  <span>Patient Payments</span>
                  <span class="credit">-{{ statement.patientPayments | currency }}</span>
                </div>
                <div class="summary-row total">
                  <span>Balance Due</span>
                  <span>{{ statement.balanceDue | currency }}</span>
                </div>
              </div>

              @if (statement.status !== 'paid') {
                <div class="due-date" [class.overdue]="isOverdue(statement.dueDate)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  Due: {{ statement.dueDate | date:'MMM d, yyyy' }}
                  @if (isOverdue(statement.dueDate)) {
                    <span class="overdue-badge">Overdue</span>
                  }
                </div>
              }

              <button 
                class="btn btn-link"
                (click)="toggleStatementDetails(statement.id)"
              >
                {{ expandedStatements().has(statement.id) ? 'Hide Details' : 'View Details' }}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" 
                     [class.rotated]="expandedStatements().has(statement.id)">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              @if (expandedStatements().has(statement.id)) {
                <div class="statement-details">
                  <h4>Line Items</h4>
                  <table class="line-items-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Charges</th>
                        <th>Ins. Paid</th>
                        <th>Your Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of statement.lineItems; track item.id) {
                        <tr>
                          <td>{{ item.serviceDate | date:'M/d/yy' }}</td>
                          <td>
                            <span class="item-desc">{{ item.description }}</span>
                            @if (item.cptCode) {
                              <span class="item-code">{{ item.cptCode }}</span>
                            }
                          </td>
                          <td>{{ item.charges | currency }}</td>
                          <td class="credit">{{ item.insurancePaid | currency }}</td>
                          <td>{{ item.patientResponsibility | currency }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }

              <div class="statement-actions">
                @if (statement.status !== 'paid') {
                  <button class="btn btn-primary" (click)="payStatement(statement)">
                    Pay {{ statement.balanceDue | currency }}
                  </button>
                }
                <button class="btn btn-secondary" (click)="downloadStatement(statement)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download PDF
                </button>
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <h3>No Statements</h3>
              <p>You don't have any statements at this time</p>
            </div>
          }
        </div>
      }

      <!-- Payment History Tab -->
      @if (activeTab() === 'history') {
        <div class="history-list">
          @for (payment of portalService.paymentHistory(); track payment.id) {
            <div class="payment-card">
              <div class="payment-icon" [class]="payment.status">
                @if (payment.status === 'completed') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                } @else if (payment.status === 'pending') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                } @else {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                }
              </div>
              <div class="payment-info">
                <div class="payment-header">
                  <span class="payment-amount">{{ payment.amount | currency }}</span>
                  <span class="payment-date">{{ payment.date | date:'MMM d, yyyy' }}</span>
                </div>
                <p class="payment-method">
                  {{ getPaymentMethodLabel(payment.method) }}
                  @if (payment.last4) {
                    ending in {{ payment.last4 }}
                  }
                </p>
                <p class="payment-applied">Applied to: {{ payment.appliedTo }}</p>
                <p class="confirmation">Confirmation: {{ payment.confirmationNumber }}</p>
              </div>
              <span class="status-badge" [class]="payment.status">
                {{ payment.status | titlecase }}
              </span>
            </div>
          } @empty {
            <div class="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              <h3>No Payment History</h3>
              <p>Your payment history will appear here</p>
            </div>
          }
        </div>
      }

      <!-- Payment Methods Tab -->
      @if (activeTab() === 'methods') {
        <div class="methods-section">
          <div class="methods-header">
            <h3>Saved Payment Methods</h3>
            <button class="btn btn-secondary" (click)="openAddMethodModal()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Payment Method
            </button>
          </div>

          <div class="methods-list">
            @for (method of portalService.paymentMethods(); track method.id) {
              <div class="method-card" [class.default]="method.isDefault">
                <div class="method-icon">
                  @if (method.type === 'credit_card' || method.type === 'debit_card') {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                      <line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                  } @else {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="2" y="4" width="20" height="16" rx="2"/>
                      <line x1="6" y1="12" x2="6" y2="12"/>
                      <line x1="10" y1="12" x2="18" y2="12"/>
                    </svg>
                  }
                </div>
                <div class="method-info">
                  <span class="method-name">
                    @if (method.type === 'bank_account') {
                      {{ method.bankName }} {{ method.accountType | titlecase }}
                    } @else {
                      {{ method.brand }} •••• {{ method.last4 }}
                    }
                  </span>
                  @if (method.type !== 'bank_account' && method.expiryMonth && method.expiryYear) {
                    <span class="method-expiry">Expires {{ method.expiryMonth }}/{{ method.expiryYear }}</span>
                  }
                  @if (method.nickname) {
                    <span class="method-nickname">{{ method.nickname }}</span>
                  }
                </div>
                <div class="method-actions">
                  @if (method.isDefault) {
                    <span class="default-badge">Default</span>
                  } @else {
                    <button class="btn btn-sm btn-link" (click)="setDefaultMethod(method.id)">
                      Set as Default
                    </button>
                  }
                  <button class="btn btn-sm btn-icon" (click)="removeMethod(method.id)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            } @empty {
              <div class="empty-state compact">
                <p>No saved payment methods</p>
                <button class="btn btn-primary" (click)="openAddMethodModal()">
                  Add Payment Method
                </button>
              </div>
            }
          </div>
        </div>
      }

      <!-- Payment Modal -->
      @if (showPaymentModal()) {
        <div class="modal-overlay" (click)="closePaymentModal()">
          <div class="modal payment-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Make a Payment</h2>
              <button class="btn-close" (click)="closePaymentModal()">×</button>
            </div>
            <div class="modal-body">
              <!-- Amount Selection -->
              <div class="payment-amount-section">
                <h3>Payment Amount</h3>
                <div class="amount-options">
                  <button 
                    class="amount-option"
                    [class.selected]="paymentAmountType() === 'full'"
                    (click)="selectAmountType('full')"
                  >
                    <span class="option-label">Pay Full Balance</span>
                    <span class="option-amount">{{ portalService.outstandingBalance() | currency }}</span>
                  </button>
                  <button 
                    class="amount-option"
                    [class.selected]="paymentAmountType() === 'statement'"
                    (click)="selectAmountType('statement')"
                    [disabled]="!selectedStatement()"
                  >
                    <span class="option-label">Pay Statement</span>
                    <span class="option-amount">{{ selectedStatement()?.balanceDue | currency }}</span>
                  </button>
                  <button 
                    class="amount-option"
                    [class.selected]="paymentAmountType() === 'custom'"
                    (click)="selectAmountType('custom')"
                  >
                    <span class="option-label">Other Amount</span>
                  </button>
                </div>
                @if (paymentAmountType() === 'custom') {
                  <div class="custom-amount">
                    <label for="customAmount">Enter Amount</label>
                    <div class="amount-input">
                      <span class="currency-symbol">$</span>
                      <input 
                        type="number" 
                        id="customAmount"
                        [(ngModel)]="customAmount"
                        min="1"
                        [max]="portalService.outstandingBalance()"
                        step="0.01"
                      >
                    </div>
                  </div>
                }
              </div>

              <!-- Payment Method Selection -->
              <div class="payment-method-section">
                <h3>Payment Method</h3>
                @if (portalService.paymentMethods().length > 0) {
                  <div class="method-options">
                    @for (method of portalService.paymentMethods(); track method.id) {
                      <button 
                        class="method-option"
                        [class.selected]="selectedMethodId() === method.id"
                        (click)="selectMethod(method.id)"
                      >
                        <div class="method-icon-sm">
                          @if (method.type === 'credit_card' || method.type === 'debit_card') {
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                              <line x1="1" y1="10" x2="23" y2="10"/>
                            </svg>
                          } @else {
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <rect x="2" y="4" width="20" height="16" rx="2"/>
                            </svg>
                          }
                        </div>
                        <span class="method-label">
                          @if (method.type === 'bank_account') {
                            {{ method.bankName }} •••• {{ method.last4 }}
                          } @else {
                            {{ method.brand }} •••• {{ method.last4 }}
                          }
                        </span>
                        @if (method.isDefault) {
                          <span class="default-tag">Default</span>
                        }
                      </button>
                    }
                  </div>
                } @else {
                  <p class="no-methods">No saved payment methods. Please add one to continue.</p>
                }
                <button class="btn btn-link add-method" (click)="openAddMethodModal()">
                  + Add new payment method
                </button>
              </div>

              <!-- Summary -->
              <div class="payment-summary">
                <div class="summary-line">
                  <span>Payment Amount</span>
                  <span>{{ getPaymentAmount() | currency }}</span>
                </div>
                <div class="summary-line total">
                  <span>Total</span>
                  <span>{{ getPaymentAmount() | currency }}</span>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closePaymentModal()">Cancel</button>
              <button 
                class="btn btn-primary"
                [disabled]="!canSubmitPayment()"
                (click)="submitPayment()"
              >
                Pay {{ getPaymentAmount() | currency }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Add Method Modal -->
      @if (showAddMethodModal()) {
        <div class="modal-overlay" (click)="closeAddMethodModal()">
          <div class="modal add-method-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Add Payment Method</h2>
              <button class="btn-close" (click)="closeAddMethodModal()">×</button>
            </div>
            <div class="modal-body">
              <div class="method-type-tabs">
                <button 
                  class="type-tab"
                  [class.active]="newMethodType() === 'card'"
                  (click)="newMethodType.set('card')"
                >
                  Credit/Debit Card
                </button>
                <button 
                  class="type-tab"
                  [class.active]="newMethodType() === 'bank'"
                  (click)="newMethodType.set('bank')"
                >
                  Bank Account
                </button>
              </div>

              @if (newMethodType() === 'card') {
                <div class="card-form">
                  <div class="form-group">
                    <label for="cardNumber">Card Number</label>
                    <input type="text" id="cardNumber" placeholder="1234 5678 9012 3456" [(ngModel)]="cardNumber">
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label for="expiry">Expiration</label>
                      <input type="text" id="expiry" placeholder="MM/YY" [(ngModel)]="cardExpiry">
                    </div>
                    <div class="form-group">
                      <label for="cvv">CVV</label>
                      <input type="text" id="cvv" placeholder="123" [(ngModel)]="cardCvv">
                    </div>
                  </div>
                  <div class="form-group">
                    <label for="cardName">Name on Card</label>
                    <input type="text" id="cardName" placeholder="John Smith" [(ngModel)]="cardName">
                  </div>
                </div>
              } @else {
                <div class="bank-form">
                  <div class="form-group">
                    <label for="routingNumber">Routing Number</label>
                    <input type="text" id="routingNumber" placeholder="123456789" [(ngModel)]="routingNumber">
                  </div>
                  <div class="form-group">
                    <label for="accountNumber">Account Number</label>
                    <input type="text" id="accountNumber" placeholder="1234567890" [(ngModel)]="accountNumber">
                  </div>
                  <div class="form-group">
                    <label for="accountType">Account Type</label>
                    <select id="accountType" [(ngModel)]="accountType">
                      <option value="checking">Checking</option>
                      <option value="savings">Savings</option>
                    </select>
                  </div>
                </div>
              }

              <div class="form-group">
                <label for="nickname">Nickname (optional)</label>
                <input type="text" id="nickname" placeholder="e.g., Personal Card" [(ngModel)]="methodNickname">
              </div>

              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="setAsDefault">
                Set as default payment method
              </label>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeAddMethodModal()">Cancel</button>
              <button class="btn btn-primary" (click)="addPaymentMethod()">Add Payment Method</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .billing-container {
      padding: 1.5rem;
      max-width: 900px;
      margin: 0 auto;
    }

    /* Header */
    .page-header {
      margin-bottom: 1.5rem;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.8125rem;
      color: #64748b;
      text-decoration: none;
      margin-bottom: 0.5rem;
    }

    .back-link:hover {
      color: #3b82f6;
    }

    .back-link svg {
      width: 1rem;
      height: 1rem;
    }

    .header-content h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
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
      text-decoration: none;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
    }

    .btn-lg {
      padding: 0.875rem 1.5rem;
      font-size: 1rem;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-primary:disabled {
      background: #94a3b8;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: white;
      color: #475569;
      border: 1px solid #e2e8f0;
    }

    .btn-secondary:hover {
      background: #f1f5f9;
    }

    .btn-link {
      background: transparent;
      color: #3b82f6;
      padding: 0.375rem 0;
    }

    .btn-link:hover {
      color: #1d4ed8;
    }

    .btn-icon {
      width: 2rem;
      height: 2rem;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      color: #64748b;
    }

    .btn-icon:hover {
      background: #f1f5f9;
      color: #dc2626;
    }

    .btn svg {
      width: 1rem;
      height: 1rem;
    }

    /* Balance Card */
    .balance-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      border-radius: 0.75rem;
      color: white;
      margin-bottom: 1.5rem;
    }

    .balance-label {
      display: block;
      font-size: 0.875rem;
      opacity: 0.9;
    }

    .balance-amount {
      display: block;
      font-size: 2.5rem;
      font-weight: 600;
      margin-top: 0.25rem;
    }

    .balance-card .btn-primary {
      background: white;
      color: #1e3a8a;
    }

    .balance-card .btn-primary:hover {
      background: #f1f5f9;
    }

    /* Tabs */
    .tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .tab-btn {
      padding: 0.75rem 1rem;
      border: none;
      background: transparent;
      font-size: 0.875rem;
      font-weight: 500;
      color: #64748b;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
    }

    .tab-btn:hover {
      color: #3b82f6;
    }

    .tab-btn.active {
      color: #3b82f6;
      border-bottom-color: #3b82f6;
    }

    /* Statement Cards */
    .statements-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .statement-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      overflow: hidden;
    }

    .statement-card.paid {
      opacity: 0.7;
    }

    .statement-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 1.25rem;
    }

    .statement-info h3 {
      margin: 0 0 0.25rem;
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
    }

    .statement-date {
      margin: 0;
      font-size: 0.8125rem;
      color: #64748b;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-badge.pending { background: #fef3c7; color: #d97706; }
    .status-badge.paid { background: #dcfce7; color: #16a34a; }
    .status-badge.partial { background: #dbeafe; color: #1d4ed8; }
    .status-badge.overdue { background: #fee2e2; color: #dc2626; }
    .status-badge.completed { background: #dcfce7; color: #16a34a; }
    .status-badge.failed { background: #fee2e2; color: #dc2626; }

    .statement-summary {
      padding: 0 1.25rem 1rem;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      font-size: 0.875rem;
      color: #475569;
      border-bottom: 1px solid #f1f5f9;
    }

    .summary-row:last-child {
      border-bottom: none;
    }

    .summary-row.total {
      font-weight: 600;
      color: #1e293b;
      font-size: 1rem;
      border-top: 2px solid #e2e8f0;
      margin-top: 0.5rem;
      padding-top: 0.75rem;
    }

    .credit {
      color: #16a34a;
    }

    .due-date {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      font-size: 0.875rem;
      color: #475569;
    }

    .due-date svg {
      width: 1rem;
      height: 1rem;
      color: #64748b;
    }

    .due-date.overdue {
      background: #fef2f2;
      color: #dc2626;
    }

    .due-date.overdue svg {
      color: #dc2626;
    }

    .overdue-badge {
      padding: 0.125rem 0.5rem;
      background: #dc2626;
      color: white;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
      margin-left: auto;
    }

    .btn-link svg {
      width: 1rem;
      height: 1rem;
      transition: transform 0.2s;
    }

    .btn-link svg.rotated {
      transform: rotate(180deg);
    }

    .statement-details {
      padding: 1rem 1.25rem;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
    }

    .statement-details h4 {
      margin: 0 0 0.75rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #1e293b;
    }

    .line-items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
    }

    .line-items-table th {
      text-align: left;
      padding: 0.5rem;
      background: #e2e8f0;
      color: #475569;
      font-weight: 500;
    }

    .line-items-table td {
      padding: 0.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .item-desc {
      display: block;
    }

    .item-code {
      display: block;
      font-size: 0.75rem;
      color: #64748b;
    }

    .statement-actions {
      display: flex;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-top: 1px solid #e2e8f0;
    }

    /* Payment History */
    .history-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .payment-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
    }

    .payment-icon {
      width: 2.5rem;
      height: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }

    .payment-icon.completed { background: #dcfce7; color: #16a34a; }
    .payment-icon.pending { background: #fef3c7; color: #d97706; }
    .payment-icon.failed { background: #fee2e2; color: #dc2626; }

    .payment-icon svg {
      width: 1.25rem;
      height: 1.25rem;
    }

    .payment-info {
      flex: 1;
    }

    .payment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.25rem;
    }

    .payment-amount {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
    }

    .payment-date {
      font-size: 0.8125rem;
      color: #64748b;
    }

    .payment-method, .payment-applied, .confirmation {
      margin: 0.125rem 0;
      font-size: 0.8125rem;
      color: #64748b;
    }

    .confirmation {
      font-family: monospace;
    }

    /* Payment Methods */
    .methods-section {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      overflow: hidden;
    }

    .methods-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .methods-header h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
    }

    .methods-list {
      padding: 0.5rem;
    }

    .method-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border-radius: 0.5rem;
      transition: background 0.2s;
    }

    .method-card:hover {
      background: #f8fafc;
    }

    .method-card.default {
      background: #eff6ff;
    }

    .method-icon {
      width: 3rem;
      height: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f1f5f9;
      border-radius: 0.25rem;
    }

    .method-icon svg {
      width: 1.5rem;
      height: 1.5rem;
      color: #475569;
    }

    .method-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .method-name {
      font-size: 0.9375rem;
      font-weight: 500;
      color: #1e293b;
    }

    .method-expiry, .method-nickname {
      font-size: 0.75rem;
      color: #64748b;
    }

    .method-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .default-badge {
      padding: 0.25rem 0.5rem;
      background: #3b82f6;
      color: white;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
    }

    .empty-state.compact {
      padding: 2rem;
    }

    .empty-state svg {
      width: 4rem;
      height: 4rem;
      color: #94a3b8;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      margin: 0 0 0.5rem;
      font-size: 1.125rem;
      color: #1e293b;
    }

    .empty-state p {
      margin: 0 0 1.5rem;
      color: #64748b;
      font-size: 0.9375rem;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal {
      background: white;
      border-radius: 0.75rem;
      width: 100%;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .payment-modal {
      max-width: 500px;
    }

    .add-method-modal {
      max-width: 450px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
    }

    .btn-close {
      width: 2rem;
      height: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      font-size: 1.5rem;
      color: #64748b;
      cursor: pointer;
      border-radius: 0.375rem;
    }

    .btn-close:hover {
      background: #f1f5f9;
    }

    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid #e2e8f0;
    }

    /* Payment Modal Specific */
    .payment-amount-section, .payment-method-section {
      margin-bottom: 1.5rem;
    }

    .payment-amount-section h3, .payment-method-section h3 {
      margin: 0 0 0.75rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #1e293b;
    }

    .amount-options {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .amount-option {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.875rem 1rem;
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .amount-option:hover:not(:disabled) {
      border-color: #3b82f6;
    }

    .amount-option:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .amount-option.selected {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .option-label {
      font-size: 0.875rem;
      color: #1e293b;
    }

    .option-amount {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #1e293b;
    }

    .custom-amount {
      margin-top: 0.75rem;
    }

    .custom-amount label {
      display: block;
      font-size: 0.8125rem;
      color: #64748b;
      margin-bottom: 0.375rem;
    }

    .amount-input {
      display: flex;
      align-items: center;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .currency-symbol {
      padding: 0.75rem;
      background: #f8fafc;
      color: #64748b;
      font-weight: 500;
    }

    .amount-input input {
      flex: 1;
      padding: 0.75rem;
      border: none;
      font-size: 1rem;
      font-weight: 500;
    }

    .amount-input input:focus {
      outline: none;
    }

    .method-options {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .method-option {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .method-option:hover {
      border-color: #3b82f6;
    }

    .method-option.selected {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .method-icon-sm {
      width: 2rem;
      height: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .method-icon-sm svg {
      width: 1.25rem;
      height: 1.25rem;
      color: #475569;
    }

    .method-label {
      flex: 1;
      font-size: 0.875rem;
      color: #1e293b;
      text-align: left;
    }

    .default-tag {
      padding: 0.125rem 0.375rem;
      background: #e0e7ff;
      color: #4338ca;
      border-radius: 0.25rem;
      font-size: 0.6875rem;
      font-weight: 500;
    }

    .no-methods {
      padding: 1rem;
      background: #f8fafc;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      color: #64748b;
      text-align: center;
    }

    .add-method {
      margin-top: 0.5rem;
    }

    .payment-summary {
      padding: 1rem;
      background: #f8fafc;
      border-radius: 0.5rem;
    }

    .summary-line {
      display: flex;
      justify-content: space-between;
      padding: 0.375rem 0;
      font-size: 0.875rem;
      color: #475569;
    }

    .summary-line.total {
      font-weight: 600;
      color: #1e293b;
      font-size: 1rem;
      border-top: 1px solid #e2e8f0;
      margin-top: 0.5rem;
      padding-top: 0.75rem;
    }

    /* Add Method Modal */
    .method-type-tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .type-tab {
      flex: 1;
      padding: 0.75rem;
      border: 2px solid #e2e8f0;
      background: white;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: #475569;
      cursor: pointer;
      transition: all 0.2s;
    }

    .type-tab:hover {
      border-color: #3b82f6;
    }

    .type-tab.active {
      border-color: #3b82f6;
      background: #eff6ff;
      color: #1e3a8a;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.375rem;
    }

    .form-group input, .form-group select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.9375rem;
      font-family: inherit;
    }

    .form-group input:focus, .form-group select:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #475569;
      cursor: pointer;
    }

    .checkbox-label input {
      width: 1rem;
      height: 1rem;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .balance-card {
        flex-direction: column;
        text-align: center;
        gap: 1rem;
      }

      .balance-card .btn {
        width: 100%;
        justify-content: center;
      }

      .statement-header {
        flex-direction: column;
        gap: 0.75rem;
      }

      .statement-actions {
        flex-direction: column;
      }

      .statement-actions .btn {
        width: 100%;
        justify-content: center;
      }

      .payment-card {
        flex-wrap: wrap;
      }

      .line-items-table {
        font-size: 0.75rem;
      }

      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PortalBillingComponent {
  portalService = inject(PortalService);

  activeTab = signal<'statements' | 'history' | 'methods'>('statements');
  expandedStatements = signal<Set<string>>(new Set());
  
  // Payment modal
  showPaymentModal = signal(false);
  selectedStatement = signal<PatientStatement | null>(null);
  paymentAmountType = signal<'full' | 'statement' | 'custom'>('full');
  customAmount = 0;
  selectedMethodId = signal<string | null>(null);

  // Add method modal
  showAddMethodModal = signal(false);
  newMethodType = signal<'card' | 'bank'>('card');
  cardNumber = '';
  cardExpiry = '';
  cardCvv = '';
  cardName = '';
  routingNumber = '';
  accountNumber = '';
  accountType = 'checking';
  methodNickname = '';
  setAsDefault = false;

  isOverdue(dueDate: Date): boolean {
    return new Date(dueDate) < new Date();
  }

  toggleStatementDetails(statementId: string): void {
    this.expandedStatements.update(set => {
      const newSet = new Set(set);
      if (newSet.has(statementId)) {
        newSet.delete(statementId);
      } else {
        newSet.add(statementId);
      }
      return newSet;
    });
  }

  payStatement(statement: PatientStatement): void {
    this.selectedStatement.set(statement);
    this.paymentAmountType.set('statement');
    this.openPaymentModal();
  }

  downloadStatement(statement: PatientStatement): void {
    console.log('Download statement:', statement.id);
  }

  getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      credit_card: 'Credit Card',
      debit_card: 'Debit Card',
      bank_account: 'Bank Account',
      cash: 'Cash',
      check: 'Check'
    };
    return labels[method] || method;
  }

  // Payment Modal
  openPaymentModal(): void {
    const defaultMethod = this.portalService.paymentMethods().find(m => m.isDefault);
    this.selectedMethodId.set(defaultMethod?.id || null);
    this.showPaymentModal.set(true);
  }

  closePaymentModal(): void {
    this.showPaymentModal.set(false);
    this.selectedStatement.set(null);
    this.paymentAmountType.set('full');
    this.customAmount = 0;
  }

  selectAmountType(type: 'full' | 'statement' | 'custom'): void {
    this.paymentAmountType.set(type);
  }

  selectMethod(methodId: string): void {
    this.selectedMethodId.set(methodId);
  }

  getPaymentAmount(): number {
    switch (this.paymentAmountType()) {
      case 'full':
        return this.portalService.outstandingBalance();
      case 'statement':
        return this.selectedStatement()?.balanceDue || 0;
      case 'custom':
        return this.customAmount;
      default:
        return 0;
    }
  }

  canSubmitPayment(): boolean {
    return this.getPaymentAmount() > 0 && !!this.selectedMethodId();
  }

  submitPayment(): void {
    const amount = this.getPaymentAmount();
    const methodId = this.selectedMethodId();
    if (amount > 0 && methodId) {
      const payment = this.portalService.makePayment(
        amount,
        methodId,
        this.selectedStatement()?.statementNumber || 'Account Balance'
      );
      console.log('Payment submitted:', payment);
      this.closePaymentModal();
    }
  }

  // Add Method Modal
  openAddMethodModal(): void {
    this.newMethodType.set('card');
    this.cardNumber = '';
    this.cardExpiry = '';
    this.cardCvv = '';
    this.cardName = '';
    this.routingNumber = '';
    this.accountNumber = '';
    this.accountType = 'checking';
    this.methodNickname = '';
    this.setAsDefault = false;
    this.showAddMethodModal.set(true);
  }

  closeAddMethodModal(): void {
    this.showAddMethodModal.set(false);
  }

  addPaymentMethod(): void {
    if (this.newMethodType() === 'card') {
      this.portalService.addPaymentMethod({
        type: 'credit_card',
        last4: this.cardNumber.slice(-4),
        brand: 'Visa',
        expiryMonth: parseInt(this.cardExpiry.split('/')[0]),
        expiryYear: 2000 + parseInt(this.cardExpiry.split('/')[1]),
        nickname: this.methodNickname,
        isDefault: this.setAsDefault
      });
    } else {
      this.portalService.addPaymentMethod({
        type: 'bank_account',
        last4: this.accountNumber.slice(-4),
        bankName: 'Bank',
        accountType: this.accountType as 'checking' | 'savings',
        nickname: this.methodNickname,
        isDefault: this.setAsDefault
      });
    }
    this.closeAddMethodModal();
  }

  setDefaultMethod(methodId: string): void {
    this.portalService.setDefaultPaymentMethod(methodId);
  }

  removeMethod(methodId: string): void {
    if (confirm('Are you sure you want to remove this payment method?')) {
      this.portalService.removePaymentMethod(methodId);
    }
  }
}
