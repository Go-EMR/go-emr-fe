import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BillingService, PaginatedResponse } from '../data-access/services/billing.service';
import {
  Claim,
  ClaimLineItem,
  Payment,
  Adjustment,
  ClaimStatus,
  CLAIM_STATUS_LABELS,
  CLAIM_TYPE_LABELS,
  PLACE_OF_SERVICE_CODES
} from '../data-access/models/billing.model';

interface TimelineEvent {
  date: Date;
  type: 'created' | 'submitted' | 'accepted' | 'rejected' | 'paid' | 'adjustment' | 'appeal' | 'note';
  title: string;
  description: string;
  user?: string;
  amount?: number;
}

@Component({
  selector: 'app-claim-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="claim-detail">
      @if (loading()) {
        <div class="loading-state">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Loading claim...</span>
        </div>
      } @else if (claim()) {
        <!-- Header -->
        <div class="page-header">
          <div class="header-left">
            <button class="btn btn-text" routerLink="/billing/claims">
              <i class="fas fa-arrow-left"></i>
              Back to Claims
            </button>
            <div class="claim-title">
              <h1>Claim {{ claim()!.claimNumber }}</h1>
              <span class="status-badge" [class]="'status-' + claim()!.status">
                {{ getStatusLabel(claim()!.status) }}
              </span>
            </div>
          </div>
          <div class="header-actions">
            @switch (claim()!.status) {
              @case ('draft') {
                <button class="btn btn-secondary" [routerLink]="['/billing/claims', claim()!.id, 'edit']">
                  <i class="fas fa-edit"></i>
                  Edit
                </button>
                <button class="btn btn-primary" (click)="submitClaim()">
                  <i class="fas fa-paper-plane"></i>
                  Submit Claim
                </button>
              }
              @case ('rejected') {
                <button class="btn btn-secondary" (click)="rebillClaim()">
                  <i class="fas fa-redo"></i>
                  Rebill
                </button>
                <button class="btn btn-primary" (click)="appealClaim()">
                  <i class="fas fa-gavel"></i>
                  Appeal
                </button>
              }
              @case ('denied') {
                <button class="btn btn-secondary" (click)="rebillClaim()">
                  <i class="fas fa-redo"></i>
                  Rebill
                </button>
                <button class="btn btn-primary" (click)="appealClaim()">
                  <i class="fas fa-gavel"></i>
                  Appeal
                </button>
              }
              @case ('partial-paid') {
                <button class="btn btn-secondary" (click)="postPayment()">
                  <i class="fas fa-dollar-sign"></i>
                  Post Payment
                </button>
                <button class="btn btn-secondary" (click)="billSecondary()">
                  <i class="fas fa-forward"></i>
                  Bill Secondary
                </button>
              }
              @case ('paid') {
                <button class="btn btn-secondary" (click)="printEOB()">
                  <i class="fas fa-print"></i>
                  Print EOB
                </button>
              }
            }
            <button class="btn btn-icon" (click)="showMoreActions()">
              <i class="fas fa-ellipsis-v"></i>
            </button>
          </div>
        </div>

        <!-- Rejection/Denial Alert -->
        @if (claim()!.status === 'rejected' || claim()!.status === 'denied') {
          <div class="alert alert-error">
            <i class="fas fa-exclamation-triangle"></i>
            <div class="alert-content">
              <strong>{{ claim()!.status === 'rejected' ? 'Claim Rejected' : 'Claim Denied' }}</strong>
              @if (claim()!.rejectionCode) {
                <span class="rejection-code">Code: {{ claim()!.rejectionCode }}</span>
              }
              <p>{{ claim()!.rejectionMessage || 'No rejection reason provided' }}</p>
              @if (claim()!.status === 'rejected') {
                <p class="action-hint">Review the rejection reason and either correct the claim and rebill, or file an appeal if you believe this is incorrect.</p>
              }
            </div>
          </div>
        }

        <!-- Main Content Grid -->
        <div class="content-grid">
          <!-- Left Column - Claim Details -->
          <div class="main-column">
            <!-- Claim Summary Card -->
            <div class="card claim-summary">
              <div class="card-header">
                <h2>Claim Summary</h2>
                <span class="claim-type">{{ getTypeLabel(claim()!.type) }}</span>
              </div>
              <div class="summary-grid">
                <div class="summary-item">
                  <label>Service Date</label>
                  <span>{{ formatDate(claim()!.serviceDate) }}</span>
                </div>
                <div class="summary-item">
                  <label>Patient</label>
                  <a [routerLink]="['/patients', claim()!.patientId]">{{ claim()!.patientName }}</a>
                </div>
                <div class="summary-item">
                  <label>Place of Service</label>
                  <span>{{ getPlaceOfService(claim()!.placeOfService) }}</span>
                </div>
                <div class="summary-item">
                  <label>Rendering Provider</label>
                  <span>{{ claim()!.renderingProvider?.name || '-' }}</span>
                </div>
                <div class="summary-item">
                  <label>Billing Provider</label>
                  <span>{{ claim()!.billingProvider?.name || '-' }}</span>
                </div>
                <div class="summary-item">
                  <label>Facility</label>
                  <span>{{ claim()!.facility || '-' }}</span>
                </div>
              </div>
            </div>

            <!-- Insurance Information -->
            <div class="card insurance-info">
              <div class="card-header">
                <h2>Insurance Information</h2>
                <span class="insurance-type">{{ claim()!.insuranceType }}</span>
              </div>
              <div class="insurance-grid">
                <div class="insurance-item">
                  <label>Payer</label>
                  <span class="payer-name">{{ claim()!.payerName }}</span>
                </div>
                <div class="insurance-item">
                  <label>Payer ID</label>
                  <span>{{ claim()!.payerId }}</span>
                </div>
                <div class="insurance-item">
                  <label>Subscriber ID</label>
                  <span>{{ claim()!.subscriberId }}</span>
                </div>
                <div class="insurance-item">
                  <label>Group Number</label>
                  <span>{{ claim()!.groupNumber || '-' }}</span>
                </div>
                @if (claim()!.authorizationNumber) {
                  <div class="insurance-item full-width">
                    <label>Authorization #</label>
                    <span class="auth-number">{{ claim()!.authorizationNumber }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Diagnosis Codes -->
            <div class="card diagnosis-codes">
              <div class="card-header">
                <h2>Diagnosis Codes</h2>
              </div>
              <div class="diagnosis-list">
                @for (dx of claim()!.diagnosisCodes; track dx.code; let i = $index) {
                  <div class="diagnosis-item" [class.principal]="i === 0">
                    <span class="dx-pointer">{{ dx.pointer }}</span>
                    <span class="dx-code">{{ dx.code }}</span>
                    <span class="dx-description">{{ dx.description }}</span>
                    @if (i === 0) {
                      <span class="principal-badge">Principal</span>
                    }
                  </div>
                }
              </div>
            </div>

            <!-- Line Items -->
            <div class="card line-items">
              <div class="card-header">
                <h2>Service Line Items</h2>
              </div>
              <table class="line-items-table">
                <thead>
                  <tr>
                    <th class="line-num">#</th>
                    <th>CPT/HCPCS</th>
                    <th>Description</th>
                    <th>Modifiers</th>
                    <th>Dx</th>
                    <th class="amount">Units</th>
                    <th class="amount">Charge</th>
                    <th class="amount">Allowed</th>
                    <th class="amount">Paid</th>
                    <th class="amount">Adj</th>
                    <th class="amount">Patient</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  @for (line of claim()!.lineItems; track line.lineNumber) {
                    <tr [class.denied]="line.adjudicationStatus === 'denied'">
                      <td class="line-num">{{ line.lineNumber }}</td>
                      <td class="procedure-code">{{ line.procedureCode }}</td>
                      <td class="procedure-desc">{{ line.description }}</td>
                      <td class="modifiers">
                        @if (line.modifiers?.length) {
                          {{ line.modifiers?.join(', ') }}
                        } @else {
                          -
                        }
                      </td>
                      <td class="dx-pointers">{{ line.diagnosisPointers?.join(',') || '-' }}</td>
                      <td class="amount">{{ line.units }}</td>
                      <td class="amount">{{ formatCurrency(line.totalCharge) }}</td>
                      <td class="amount">{{ line.allowedAmount ? formatCurrency(line.allowedAmount) : '-' }}</td>
                      <td class="amount">{{ line.paidAmount ? formatCurrency(line.paidAmount) : '-' }}</td>
                      <td class="amount">{{ line.adjustmentAmount ? formatCurrency(line.adjustmentAmount) : '-' }}</td>
                      <td class="amount">{{ line.patientAmount ? formatCurrency(line.patientAmount) : '-' }}</td>
                      <td>
                        <span class="line-status" [class]="'status-' + (line.adjudicationStatus || 'pending')">
                          {{ line.adjudicationStatus || 'Pending' }}
                        </span>
                      </td>
                    </tr>
                    @if (line.denialReason) {
                      <tr class="denial-row">
                        <td colspan="12">
                          <div class="denial-info">
                            <i class="fas fa-exclamation-circle"></i>
                            <span>{{ line.denialReason }}</span>
                          </div>
                        </td>
                      </tr>
                    }
                    @if (line.adjustments?.length) {
                      @for (adj of line.adjustments; track adj.reasonCode) {
                        <tr class="adjustment-row">
                          <td colspan="2"></td>
                          <td colspan="4" class="adjustment-desc">
                            <span class="adj-code">{{ adj.groupCode }}-{{ adj.reasonCode }}</span>
                            {{ adj.description }}
                          </td>
                          <td colspan="5" class="amount adjustment-amount">
                            -{{ formatCurrency(adj.amount) }}
                          </td>
                          <td></td>
                        </tr>
                      }
                    }
                  }
                </tbody>
                <tfoot>
                  <tr class="totals-row">
                    <td colspan="6" class="totals-label">Totals</td>
                    <td class="amount">{{ formatCurrency(claim()!.totalCharges) }}</td>
                    <td class="amount">{{ claim()!.totalAllowed ? formatCurrency(claim()!.totalAllowed!) : '-' }}</td>
                    <td class="amount">{{ claim()!.totalPaid ? formatCurrency(claim()!.totalPaid!) : '-' }}</td>
                    <td class="amount">{{ claim()!.totalAdjustments ? formatCurrency(claim()!.totalAdjustments!) : '-' }}</td>
                    <td class="amount">{{ claim()!.patientResponsibility ? formatCurrency(claim()!.patientResponsibility!) : '-' }}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <!-- Payments Applied -->
            @if (payments().length > 0) {
              <div class="card payments-section">
                <div class="card-header">
                  <h2>Payments Applied</h2>
                  <button class="btn btn-sm btn-secondary" (click)="postPayment()">
                    <i class="fas fa-plus"></i>
                    Add Payment
                  </button>
                </div>
                <table class="payments-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Payment #</th>
                      <th>Source</th>
                      <th>Method</th>
                      <th>Reference</th>
                      <th class="amount">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (payment of payments(); track payment.id) {
                      <tr>
                        <td>{{ formatDate(payment.paymentDate) }}</td>
                        <td>
                          <a [routerLink]="['/billing/payments', payment.id]">{{ payment.paymentNumber }}</a>
                        </td>
                        <td>{{ payment.source }}</td>
                        <td>{{ payment.method }}</td>
                        <td>{{ payment.checkNumber || payment.transactionId || '-' }}</td>
                        <td class="amount">{{ formatCurrency(payment.amount) }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }

            <!-- Adjustments -->
            @if (adjustments().length > 0) {
              <div class="card adjustments-section">
                <div class="card-header">
                  <h2>Adjustments</h2>
                </div>
                <table class="adjustments-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Reason</th>
                      <th>Description</th>
                      <th>Created By</th>
                      <th class="amount">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (adj of adjustments(); track adj.id) {
                      <tr>
                        <td>{{ formatDate(adj.adjustmentDate) }}</td>
                        <td>{{ adj.reason }}</td>
                        <td>{{ adj.description }}</td>
                        <td>{{ adj.createdBy }}</td>
                        <td class="amount">{{ formatCurrency(adj.amount) }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }

            <!-- ERA/Remittance Information -->
            @if (claim()!.eraId) {
              <div class="card era-section">
                <div class="card-header">
                  <h2>Electronic Remittance Advice (ERA)</h2>
                  <button class="btn btn-sm btn-text" (click)="viewERA()">
                    <i class="fas fa-external-link-alt"></i>
                    View Full ERA
                  </button>
                </div>
                <div class="era-grid">
                  <div class="era-item">
                    <label>ERA ID</label>
                    <span>{{ claim()!.eraId }}</span>
                  </div>
                  <div class="era-item">
                    <label>Check/EFT Number</label>
                    <span>{{ claim()!.checkNumber || '-' }}</span>
                  </div>
                  <div class="era-item">
                    <label>Payment Date</label>
                    <span>{{ claim()!.paymentDate ? formatDate(claim()!.paymentDate!) : '-' }}</span>
                  </div>
                </div>
                @if (claim()!.remittanceAdvice) {
                  <div class="remittance-notes">
                    <label>Remittance Notes</label>
                    <p>{{ claim()!.remittanceAdvice }}</p>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Right Column - Sidebar -->
          <div class="sidebar-column">
            <!-- Financial Summary -->
            <div class="card financial-summary">
              <h3>Financial Summary</h3>
              <div class="financial-breakdown">
                <div class="financial-row">
                  <span class="label">Total Charges</span>
                  <span class="value">{{ formatCurrency(claim()!.totalCharges) }}</span>
                </div>
                @if (claim()!.totalAllowed) {
                  <div class="financial-row">
                    <span class="label">Allowed Amount</span>
                    <span class="value">{{ formatCurrency(claim()!.totalAllowed!) }}</span>
                  </div>
                }
                @if (claim()!.totalAdjustments) {
                  <div class="financial-row adjustment">
                    <span class="label">Adjustments</span>
                    <span class="value">-{{ formatCurrency(claim()!.totalAdjustments!) }}</span>
                  </div>
                }
                @if (claim()!.totalPaid) {
                  <div class="financial-row paid">
                    <span class="label">Insurance Paid</span>
                    <span class="value">{{ formatCurrency(claim()!.totalPaid!) }}</span>
                  </div>
                }
                <div class="financial-divider"></div>
                @if (claim()!.patientResponsibility) {
                  <div class="financial-row patient">
                    <span class="label">Patient Responsibility</span>
                    <span class="value">{{ formatCurrency(claim()!.patientResponsibility!) }}</span>
                  </div>
                }
                <div class="financial-row balance">
                  <span class="label">Balance Due</span>
                  <span class="value" [class.zero]="claim()!.balance === 0">
                    {{ formatCurrency(claim()!.balance || 0) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Key Dates -->
            <div class="card key-dates">
              <h3>Key Dates</h3>
              <div class="dates-list">
                <div class="date-item">
                  <i class="fas fa-calendar-plus"></i>
                  <div class="date-content">
                    <span class="date-label">Created</span>
                    <span class="date-value">{{ formatDateTime(claim()!.createdAt || '') }}</span>
                  </div>
                </div>
                @if (claim()!.submittedAt) {
                  <div class="date-item">
                    <i class="fas fa-paper-plane"></i>
                    <div class="date-content">
                      <span class="date-label">Submitted</span>
                      <span class="date-value">{{ formatDateTime(claim()!.submittedAt!) }}</span>
                    </div>
                  </div>
                }
                @if (claim()!.receivedAt) {
                  <div class="date-item">
                    <i class="fas fa-inbox"></i>
                    <div class="date-content">
                      <span class="date-label">Received by Payer</span>
                      <span class="date-value">{{ formatDateTime(claim()!.receivedAt!) }}</span>
                    </div>
                  </div>
                }
                @if (claim()!.processedAt) {
                  <div class="date-item">
                    <i class="fas fa-cog"></i>
                    <div class="date-content">
                      <span class="date-label">Processed</span>
                      <span class="date-value">{{ formatDateTime(claim()!.processedAt!) }}</span>
                    </div>
                  </div>
                }
                @if (claim()!.paymentDate) {
                  <div class="date-item">
                    <i class="fas fa-check-circle"></i>
                    <div class="date-content">
                      <span class="date-label">Payment Posted</span>
                      <span class="date-value">{{ formatDateTime(claim()!.paymentDate!) }}</span>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="card quick-actions">
              <h3>Quick Actions</h3>
              <div class="actions-list">
                <button class="action-btn" (click)="printClaim()">
                  <i class="fas fa-print"></i>
                  Print CMS-1500
                </button>
                <button class="action-btn" (click)="viewEncounter()">
                  <i class="fas fa-file-medical"></i>
                  View Encounter
                </button>
                <button class="action-btn" (click)="addNote()">
                  <i class="fas fa-sticky-note"></i>
                  Add Note
                </button>
                <button class="action-btn" (click)="viewHistory()">
                  <i class="fas fa-history"></i>
                  Claim History
                </button>
                @if (claim()!.balance && claim()!.balance! > 0) {
                  <button class="action-btn" (click)="writeOff()">
                    <i class="fas fa-eraser"></i>
                    Write Off Balance
                  </button>
                }
              </div>
            </div>

            <!-- Claim Timeline -->
            <div class="card claim-timeline">
              <h3>Activity Timeline</h3>
              <div class="timeline">
                @for (event of timeline(); track event.date) {
                  <div class="timeline-item" [class]="'event-' + event.type">
                    <div class="timeline-marker">
                      <i [class]="getTimelineIcon(event.type)"></i>
                    </div>
                    <div class="timeline-content">
                      <div class="timeline-header">
                        <span class="event-title">{{ event.title }}</span>
                        <span class="event-date">{{ formatDateTime(event.date) }}</span>
                      </div>
                      <p class="event-description">{{ event.description }}</p>
                      @if (event.user) {
                        <span class="event-user">by {{ event.user }}</span>
                      }
                      @if (event.amount) {
                        <span class="event-amount">{{ formatCurrency(event.amount) }}</span>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Related Claims -->
            @if (relatedClaims().length > 0) {
              <div class="card related-claims">
                <h3>Related Claims</h3>
                <div class="related-list">
                  @for (related of relatedClaims(); track related.id) {
                    <a [routerLink]="['/billing/claims', related.id]" class="related-item">
                      <span class="related-number">{{ related.claimNumber }}</span>
                      <span class="related-status" [class]="'status-' + related.status">
                        {{ getStatusLabel(related.status) }}
                      </span>
                      <span class="related-amount">{{ formatCurrency(related.totalCharges) }}</span>
                    </a>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      } @else {
        <div class="error-state">
          <i class="fas fa-exclamation-circle"></i>
          <h3>Claim Not Found</h3>
          <p>The requested claim could not be found.</p>
          <button class="btn btn-primary" routerLink="/billing/claims">
            Back to Claims
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .claim-detail {
      padding: 1.5rem;
      max-width: 1600px;
      margin: 0 auto;
    }

    .loading-state, .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      color: #64748b;
    }

    .loading-state i, .error-state i {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .error-state i {
      color: #ef4444;
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

    .header-left {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .btn-text {
      background: none;
      border: none;
      color: #3b82f6;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    .btn-text:hover {
      color: #2563eb;
    }

    .claim-title {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .claim-title h1 {
      font-size: 1.75rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .status-badge {
      padding: 0.375rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-draft { background: #f1f5f9; color: #475569; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-submitted { background: #dbeafe; color: #1e40af; }
    .status-accepted { background: #d1fae5; color: #065f46; }
    .status-rejected { background: #fee2e2; color: #991b1b; }
    .status-denied { background: #fecaca; color: #7f1d1d; }
    .status-partial-paid { background: #e0e7ff; color: #3730a3; }
    .status-paid { background: #d1fae5; color: #065f46; }
    .status-appealed { background: #fef3c7; color: #92400e; }
    .status-voided { background: #f1f5f9; color: #64748b; }

    .header-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      border-radius: 0.5rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
      border: none;
      font-size: 0.875rem;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .btn-secondary {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #e2e8f0;
    }

    .btn-secondary:hover {
      background: #e2e8f0;
    }

    .btn-icon {
      padding: 0.625rem;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
    }

    /* Alert */
    .alert {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      border-radius: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .alert-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
    }

    .alert-error i {
      color: #ef4444;
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .alert-content strong {
      display: block;
      color: #991b1b;
      margin-bottom: 0.25rem;
    }

    .alert-content .rejection-code {
      font-family: monospace;
      background: #fee2e2;
      padding: 0.125rem 0.5rem;
      border-radius: 0.25rem;
      margin-left: 0.5rem;
      font-size: 0.75rem;
    }

    .alert-content p {
      color: #7f1d1d;
      margin: 0.5rem 0;
    }

    .action-hint {
      font-size: 0.875rem;
      color: #991b1b;
      font-style: italic;
    }

    /* Content Grid */
    .content-grid {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 1.5rem;
    }

    @media (max-width: 1200px) {
      .content-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Cards */
    .card {
      background: white;
      border-radius: 0.75rem;
      border: 1px solid #e2e8f0;
      padding: 1.5rem;
      margin-bottom: 1rem;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .card-header h2 {
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .claim-type, .insurance-type {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      background: #f1f5f9;
      border-radius: 0.25rem;
      color: #64748b;
    }

    /* Summary Grid */
    .summary-grid, .insurance-grid, .era-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .summary-item, .insurance-item, .era-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .summary-item label, .insurance-item label, .era-item label {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 500;
    }

    .summary-item span, .insurance-item span, .era-item span {
      color: #1e293b;
    }

    .summary-item a {
      color: #3b82f6;
      text-decoration: none;
    }

    .summary-item a:hover {
      text-decoration: underline;
    }

    .full-width {
      grid-column: span 2;
    }

    .payer-name {
      font-weight: 600;
    }

    .auth-number {
      font-family: monospace;
      background: #fef3c7;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
    }

    /* Diagnosis Codes */
    .diagnosis-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .diagnosis-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem;
      background: #f8fafc;
      border-radius: 0.375rem;
    }

    .diagnosis-item.principal {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
    }

    .dx-pointer {
      width: 1.5rem;
      height: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e2e8f0;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #475569;
    }

    .principal .dx-pointer {
      background: #3b82f6;
      color: white;
    }

    .dx-code {
      font-family: monospace;
      font-weight: 600;
      color: #1e293b;
    }

    .dx-description {
      flex: 1;
      color: #475569;
    }

    .principal-badge {
      font-size: 0.625rem;
      padding: 0.125rem 0.375rem;
      background: #3b82f6;
      color: white;
      border-radius: 0.25rem;
      text-transform: uppercase;
      font-weight: 600;
    }

    /* Line Items Table */
    .line-items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .line-items-table th {
      text-align: left;
      padding: 0.75rem 0.5rem;
      background: #f8fafc;
      border-bottom: 2px solid #e2e8f0;
      font-weight: 600;
      color: #475569;
      font-size: 0.75rem;
      text-transform: uppercase;
    }

    .line-items-table td {
      padding: 0.75rem 0.5rem;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }

    .line-items-table .line-num {
      width: 2rem;
      text-align: center;
    }

    .procedure-code {
      font-family: monospace;
      font-weight: 600;
    }

    .procedure-desc {
      max-width: 200px;
    }

    .modifiers, .dx-pointers {
      font-family: monospace;
      font-size: 0.75rem;
    }

    .amount {
      text-align: right;
      font-family: monospace;
    }

    .line-status {
      font-size: 0.625rem;
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      text-transform: uppercase;
      font-weight: 600;
    }

    .status-pending { background: #fef3c7; color: #92400e; }
    .status-paid { background: #d1fae5; color: #065f46; }
    .status-denied { background: #fee2e2; color: #991b1b; }
    .status-adjusted { background: #e0e7ff; color: #3730a3; }

    tr.denied {
      background: #fef2f2;
    }

    .denial-row td {
      padding: 0.5rem;
      background: #fef2f2;
      border-bottom: 1px solid #fecaca;
    }

    .denial-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #991b1b;
      font-size: 0.75rem;
    }

    .adjustment-row td {
      padding: 0.375rem 0.5rem;
      background: #f8fafc;
      font-size: 0.75rem;
      color: #64748b;
    }

    .adjustment-desc {
      font-style: italic;
    }

    .adj-code {
      font-family: monospace;
      font-weight: 600;
      margin-right: 0.5rem;
    }

    .adjustment-amount {
      color: #dc2626 !important;
    }

    .totals-row {
      background: #f1f5f9;
      font-weight: 600;
    }

    .totals-label {
      text-align: right;
    }

    /* Payments & Adjustments Tables */
    .payments-table, .adjustments-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .payments-table th, .adjustments-table th {
      text-align: left;
      padding: 0.5rem;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      font-weight: 600;
      color: #64748b;
      font-size: 0.75rem;
    }

    .payments-table td, .adjustments-table td {
      padding: 0.5rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .payments-table a {
      color: #3b82f6;
      text-decoration: none;
    }

    .payments-table a:hover {
      text-decoration: underline;
    }

    /* ERA Section */
    .remittance-notes {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #f1f5f9;
    }

    .remittance-notes label {
      display: block;
      font-size: 0.75rem;
      color: #64748b;
      margin-bottom: 0.25rem;
    }

    .remittance-notes p {
      color: #475569;
      margin: 0;
    }

    /* Sidebar */
    .sidebar-column .card {
      padding: 1rem;
    }

    .sidebar-column h3 {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 1rem 0;
    }

    /* Financial Summary */
    .financial-breakdown {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .financial-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .financial-row .label {
      color: #64748b;
      font-size: 0.875rem;
    }

    .financial-row .value {
      font-weight: 600;
      font-family: monospace;
    }

    .financial-row.adjustment .value {
      color: #dc2626;
    }

    .financial-row.paid .value {
      color: #059669;
    }

    .financial-row.balance {
      font-size: 1.125rem;
    }

    .financial-row.balance .value.zero {
      color: #059669;
    }

    .financial-divider {
      height: 1px;
      background: #e2e8f0;
      margin: 0.5rem 0;
    }

    /* Key Dates */
    .dates-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .date-item {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
    }

    .date-item i {
      color: #64748b;
      margin-top: 0.125rem;
    }

    .date-content {
      display: flex;
      flex-direction: column;
    }

    .date-label {
      font-size: 0.75rem;
      color: #64748b;
    }

    .date-value {
      font-size: 0.875rem;
      color: #1e293b;
    }

    /* Quick Actions */
    .actions-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 0.75rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
      cursor: pointer;
      font-size: 0.875rem;
      color: #475569;
      transition: all 0.15s;
      text-align: left;
      width: 100%;
    }

    .action-btn:hover {
      background: #f1f5f9;
      color: #1e293b;
    }

    .action-btn i {
      width: 1rem;
      text-align: center;
    }

    /* Timeline */
    .timeline {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .timeline-item {
      display: flex;
      gap: 0.75rem;
    }

    .timeline-marker {
      width: 2rem;
      height: 2rem;
      border-radius: 9999px;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .timeline-marker i {
      font-size: 0.75rem;
      color: #64748b;
    }

    .event-created .timeline-marker { background: #dbeafe; }
    .event-created .timeline-marker i { color: #3b82f6; }
    .event-submitted .timeline-marker { background: #fef3c7; }
    .event-submitted .timeline-marker i { color: #f59e0b; }
    .event-accepted .timeline-marker { background: #d1fae5; }
    .event-accepted .timeline-marker i { color: #10b981; }
    .event-rejected .timeline-marker { background: #fee2e2; }
    .event-rejected .timeline-marker i { color: #ef4444; }
    .event-paid .timeline-marker { background: #d1fae5; }
    .event-paid .timeline-marker i { color: #059669; }

    .timeline-content {
      flex: 1;
    }

    .timeline-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.25rem;
    }

    .event-title {
      font-weight: 600;
      font-size: 0.875rem;
      color: #1e293b;
    }

    .event-date {
      font-size: 0.75rem;
      color: #64748b;
    }

    .event-description {
      font-size: 0.75rem;
      color: #64748b;
      margin: 0;
    }

    .event-user {
      font-size: 0.75rem;
      color: #94a3b8;
      font-style: italic;
    }

    .event-amount {
      font-size: 0.75rem;
      font-weight: 600;
      color: #059669;
      margin-left: 0.5rem;
    }

    /* Related Claims */
    .related-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .related-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      background: #f8fafc;
      border-radius: 0.375rem;
      text-decoration: none;
      color: inherit;
    }

    .related-item:hover {
      background: #f1f5f9;
    }

    .related-number {
      font-weight: 600;
      color: #3b82f6;
    }

    .related-status {
      font-size: 0.625rem;
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
    }

    .related-amount {
      margin-left: auto;
      font-family: monospace;
      font-size: 0.875rem;
    }
  `]
})
export class ClaimDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private billingService = inject(BillingService);

  claim = signal<Claim | null>(null);
  loading = signal(true);
  payments = signal<Payment[]>([]);
  adjustments = signal<Adjustment[]>([]);
  relatedClaims = signal<Claim[]>([]);
  timeline = signal<TimelineEvent[]>([]);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadClaim(id);
    }
  }

  loadClaim(id: string): void {
    this.loading.set(true);
    this.billingService.getClaimById(id).subscribe({
      next: (claim) => {
        this.claim.set(claim);
        this.buildTimeline(claim);
        this.loadRelatedData(claim);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  loadRelatedData(claim: Claim): void {
    const claimId = claim.claimId || claim.id;
    if (!claimId) return;

    // Load payments for this claim
    this.billingService.getPayments({ claimId }).subscribe((response: PaginatedResponse<Payment>) => {
      this.payments.set(response.data);
    });

    // Load adjustments for this claim
    this.billingService.getAdjustments(claimId).subscribe((adjustments: Adjustment[]) => {
      this.adjustments.set(adjustments);
    });

    // Load related claims (same patient, same date of service, or rebills)
    if (claim.originalClaimId || claim.rebilledClaimId) {
      // Use getClaims with patient filter as a workaround
      this.billingService.getClaims({ patientId: claim.patientId }).subscribe((response: PaginatedResponse<Claim>) => {
        const related = response.data.filter(c => 
          c.claimId !== claimId && 
          (c.claimId === claim.originalClaimId || c.claimId === claim.rebilledClaimId)
        );
        this.relatedClaims.set(related);
      });
    }
  }

  buildTimeline(claim: Claim): void {
    const events: TimelineEvent[] = [];

    // Created
    events.push({
      date: new Date(claim.createdAt || new Date()),
      type: 'created',
      title: 'Claim Created',
      description: `Claim ${claim.claimNumber} created for ${claim.patientName}`,
      user: claim.createdBy
    });

    // Submitted
    if (claim.submittedAt) {
      events.push({
        date: new Date(claim.submittedAt),
        type: 'submitted',
        title: 'Claim Submitted',
        description: `Submitted to ${claim.payerName}`
      });
    }

    // Accepted
    if (claim.receivedAt && claim.status !== 'rejected') {
      events.push({
        date: new Date(claim.receivedAt),
        type: 'accepted',
        title: 'Claim Accepted',
        description: 'Accepted by payer for processing'
      });
    }

    // Rejected
    if (claim.status === 'rejected' && claim.processedAt) {
      events.push({
        date: new Date(claim.processedAt),
        type: 'rejected',
        title: 'Claim Rejected',
        description: claim.rejectionMessage || 'Rejected by payer'
      });
    }

    // Paid
    if (claim.paymentDate && claim.totalPaid) {
      events.push({
        date: new Date(claim.paymentDate),
        type: 'paid',
        title: 'Payment Received',
        description: `Payment posted via ${claim.checkNumber ? 'check ' + claim.checkNumber : 'EFT'}`,
        amount: claim.totalPaid
      });
    }

    // Sort by date descending
    events.sort((a, b) => b.date.getTime() - a.date.getTime());
    this.timeline.set(events);
  }

  submitClaim(): void {
    const claim = this.claim();
    const claimId = claim?.claimId || claim?.id;
    if (!claim || !claimId) return;
    
    if (confirm(`Submit claim ${claim.claimNumber} to ${claim.payerName}?`)) {
      this.billingService.submitClaim(claimId).subscribe({
        next: (updated) => {
          this.claim.set(updated);
          this.buildTimeline(updated);
        }
      });
    }
  }

  rebillClaim(): void {
    const claim = this.claim();
    const claimId = claim?.claimId || claim?.id;
    if (!claim || !claimId) return;
    
    if (confirm(`Create a rebill for claim ${claim.claimNumber}?`)) {
      this.billingService.rebillClaim(claimId).subscribe({
        next: (newClaim) => {
          this.router.navigate(['/billing/claims', newClaim.claimId || newClaim.id, 'edit']);
        }
      });
    }
  }

  appealClaim(): void {
    const claim = this.claim();
    const claimId = claim?.claimId || claim?.id;
    if (!claim || !claimId) return;
    
    const reason = prompt('Enter appeal reason:');
    if (reason) {
      this.billingService.appealClaim(claimId, reason).subscribe({
        next: (updated) => {
          this.claim.set(updated);
          this.buildTimeline(updated);
        }
      });
    }
  }

  postPayment(): void {
    const claim = this.claim();
    if (claim) {
      this.router.navigate(['/billing/payments/new'], {
        queryParams: { claimId: claim.id }
      });
    }
  }

  billSecondary(): void {
    console.log('Bill secondary insurance');
    // Would navigate to secondary claim creation
  }

  printEOB(): void {
    console.log('Print EOB');
    // Would generate EOB PDF
  }

  showMoreActions(): void {
    console.log('Show more actions menu');
  }

  printClaim(): void {
    console.log('Print CMS-1500');
    // Would generate CMS-1500 PDF
  }

  viewEncounter(): void {
    const claim = this.claim();
    if (claim?.encounterId) {
      this.router.navigate(['/encounters', claim.encounterId]);
    }
  }

  addNote(): void {
    const note = prompt('Enter note:');
    if (note && this.claim()) {
      console.log('Add note:', note);
      // Would save note to claim
    }
  }

  viewHistory(): void {
    console.log('View claim history');
    // Would show audit log modal
  }

  writeOff(): void {
    const claim = this.claim();
    if (claim && claim.balance) {
      const amount = prompt(`Enter write-off amount (max ${this.formatCurrency(claim.balance)}):`);
      if (amount) {
        console.log('Write off:', amount);
        // Would create adjustment
      }
    }
  }

  viewERA(): void {
    const claim = this.claim();
    if (claim?.eraId) {
      this.router.navigate(['/billing/era', claim.eraId]);
    }
  }

  getStatusLabel(status: ClaimStatus): string {
    return CLAIM_STATUS_LABELS[status] || status;
  }

  getTypeLabel(type: string): string {
    return CLAIM_TYPE_LABELS[type as keyof typeof CLAIM_TYPE_LABELS] || type;
  }

  getPlaceOfService(code: string): string {
    const description = PLACE_OF_SERVICE_CODES[code];
    return description ? `${code} - ${description}` : code;
  }

  getTimelineIcon(type: string): string {
    const icons: Record<string, string> = {
      created: 'fas fa-plus-circle',
      submitted: 'fas fa-paper-plane',
      accepted: 'fas fa-check-circle',
      rejected: 'fas fa-times-circle',
      paid: 'fas fa-dollar-sign',
      adjustment: 'fas fa-calculator',
      appeal: 'fas fa-gavel',
      note: 'fas fa-sticky-note'
    };
    return icons[type] || 'fas fa-circle';
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatDateTime(date: string | Date): string {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}
