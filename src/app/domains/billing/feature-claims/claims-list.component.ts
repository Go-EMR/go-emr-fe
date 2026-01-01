import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BillingService, ClaimStatistics, AgingReport, ClaimSearchParams } from '../data-access/services/billing.service';
import {
  Claim,
  ClaimStatus,
  ClaimType,
  CLAIM_STATUS_LABELS,
  CLAIM_TYPE_LABELS
} from '../data-access/models/billing.model';

interface StatusTab {
  status: ClaimStatus | 'all' | 'actionable';
  label: string;
  count: number;
  color: string;
}

@Component({
  selector: 'app-claims-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="claims-list">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Claims Management</h1>
          <p class="subtitle">Review, submit, and track insurance claims</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="exportClaims()">
            <i class="fas fa-download"></i>
            Export
          </button>
          <button class="btn btn-primary" routerLink="/billing/claims/new">
            <i class="fas fa-plus"></i>
            New Claim
          </button>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon total">
            <i class="fas fa-file-invoice-dollar"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ statistics()?.total || 0 }}</span>
            <span class="stat-label">Total Claims</span>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon charges">
            <i class="fas fa-dollar-sign"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ formatCurrency(statistics()?.totalCharges || 0) }}</span>
            <span class="stat-label">Total Charges</span>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon paid">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ formatCurrency(statistics()?.totalPaid || 0) }}</span>
            <span class="stat-label">Total Paid</span>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon balance">
            <i class="fas fa-exclamation-circle"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ formatCurrency(statistics()?.totalBalance || 0) }}</span>
            <span class="stat-label">Outstanding Balance</span>
          </div>
        </div>
      </div>

      <!-- Aging Report -->
      <div class="aging-section">
        <h3>Accounts Receivable Aging</h3>
        <div class="aging-buckets">
          <div class="aging-bucket" (click)="filterByAging('current')" 
               [class.active]="selectedAging() === 'current'">
            <span class="bucket-label">Current</span>
            <span class="bucket-amount">{{ formatCurrency(agingReport()?.current?.amount || 0) }}</span>
            <span class="bucket-count">{{ agingReport()?.current?.count || 0 }} claims</span>
          </div>
          <div class="aging-bucket warning" (click)="filterByAging('30')"
               [class.active]="selectedAging() === '30'">
            <span class="bucket-label">31-60 Days</span>
            <span class="bucket-amount">{{ formatCurrency(agingReport()?.days30?.amount || 0) }}</span>
            <span class="bucket-count">{{ agingReport()?.days30?.count || 0 }} claims</span>
          </div>
          <div class="aging-bucket caution" (click)="filterByAging('60')"
               [class.active]="selectedAging() === '60'">
            <span class="bucket-label">61-90 Days</span>
            <span class="bucket-amount">{{ formatCurrency(agingReport()?.days60?.amount || 0) }}</span>
            <span class="bucket-count">{{ agingReport()?.days60?.count || 0 }} claims</span>
          </div>
          <div class="aging-bucket danger" (click)="filterByAging('90')"
               [class.active]="selectedAging() === '90'">
            <span class="bucket-label">91-120 Days</span>
            <span class="bucket-amount">{{ formatCurrency(agingReport()?.days90?.amount || 0) }}</span>
            <span class="bucket-count">{{ agingReport()?.days90?.count || 0 }} claims</span>
          </div>
          <div class="aging-bucket critical" (click)="filterByAging('120+')"
               [class.active]="selectedAging() === '120+'">
            <span class="bucket-label">120+ Days</span>
            <span class="bucket-amount">{{ formatCurrency(agingReport()?.days120Plus?.amount || 0) }}</span>
            <span class="bucket-count">{{ agingReport()?.days120Plus?.count || 0 }} claims</span>
          </div>
        </div>
      </div>

      <!-- Status Tabs -->
      <div class="status-tabs">
        @for (tab of statusTabs(); track tab.status) {
          <button 
            class="status-tab"
            [class.active]="selectedStatus() === tab.status"
            (click)="selectStatus(tab.status)">
            <span class="tab-label">{{ tab.label }}</span>
            <span class="tab-count" [style.background-color]="tab.color">{{ tab.count }}</span>
          </button>
        }
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input 
            type="text" 
            placeholder="Search claims (claim #, patient, payer...)"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange()">
        </div>
        
        <div class="filter-group">
          <select [(ngModel)]="filterType" (ngModelChange)="applyFilters()">
            <option value="">All Types</option>
            <option value="professional">Professional (CMS-1500)</option>
            <option value="institutional">Institutional (UB-04)</option>
            <option value="dental">Dental</option>
          </select>
        </div>

        <div class="filter-group">
          <select [(ngModel)]="filterPayer" (ngModelChange)="applyFilters()">
            <option value="">All Payers</option>
            @for (payer of payers(); track payer) {
              <option [value]="payer">{{ payer }}</option>
            }
          </select>
        </div>

        <div class="filter-group date-range">
          <input 
            type="date" 
            [(ngModel)]="dateFrom"
            (ngModelChange)="applyFilters()"
            placeholder="From">
          <span>to</span>
          <input 
            type="date" 
            [(ngModel)]="dateTo"
            (ngModelChange)="applyFilters()">
        </div>

        <button class="btn btn-text" (click)="clearFilters()">
          <i class="fas fa-times"></i>
          Clear
        </button>
      </div>

      <!-- Claims Table -->
      <div class="claims-table-container">
        @if (loading()) {
          <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Loading claims...</span>
          </div>
        } @else if (claims().length === 0) {
          <div class="empty-state">
            <i class="fas fa-file-invoice"></i>
            <h3>No claims found</h3>
            <p>Try adjusting your filters or create a new claim</p>
          </div>
        } @else {
          <table class="claims-table">
            <thead>
              <tr>
                <th class="checkbox-col">
                  <input type="checkbox" (change)="toggleSelectAll($event)">
                </th>
                <th class="sortable" (click)="sortBy('claimNumber')">
                  Claim #
                  <i class="fas fa-sort"></i>
                </th>
                <th class="sortable" (click)="sortBy('serviceDate')">
                  Service Date
                  <i class="fas fa-sort"></i>
                </th>
                <th>Patient</th>
                <th>Payer</th>
                <th>Type</th>
                <th class="sortable" (click)="sortBy('status')">
                  Status
                  <i class="fas fa-sort"></i>
                </th>
                <th class="amount-col sortable" (click)="sortBy('totalCharges')">
                  Charges
                  <i class="fas fa-sort"></i>
                </th>
                <th class="amount-col">Paid</th>
                <th class="amount-col sortable" (click)="sortBy('balance')">
                  Balance
                  <i class="fas fa-sort"></i>
                </th>
                <th class="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (claim of claims(); track claim.claimId) {
                <tr [class.has-rejection]="claim.status === 'rejected' || claim.status === 'denied'"
                    [class.selected]="selectedClaims().has(claim.claimId)">
                  <td class="checkbox-col">
                    <input 
                      type="checkbox" 
                      [checked]="selectedClaims().has(claim.claimId)"
                      (change)="toggleSelectClaim(claim.claimId)">
                  </td>
                  <td class="claim-number">
                    <a [routerLink]="['/billing/claims', claim.claimId]">{{ claim.claimNumber }}</a>
                    @if (claim.originalClaimId) {
                      <span class="rebill-badge" title="Rebilled claim">RB</span>
                    }
                  </td>
                  <td>{{ formatDate(claim.serviceDate) }}</td>
                  <td class="patient-cell">
                    <span class="patient-name">{{ claim.patientName }}</span>
                  </td>
                  <td class="payer-cell">
                    <span class="payer-name">{{ claim.payerName }}</span>
                    <span class="insurance-type">{{ claim.insuranceType }}</span>
                  </td>
                  <td>
                    <span class="type-badge" [class]="claim.type">
                      {{ getTypeLabel(claim.type) }}
                    </span>
                  </td>
                  <td>
                    <span class="status-badge" [class]="claim.status">
                      {{ getStatusLabel(claim.status) }}
                    </span>
                    @if (claim.rejectionCode) {
                      <span class="rejection-code" [title]="claim.rejectionMessage || ''">
                        {{ claim.rejectionCode }}
                      </span>
                    }
                  </td>
                  <td class="amount-col">{{ formatCurrency(claim.totalCharges) }}</td>
                  <td class="amount-col">{{ formatCurrency(claim.totalPaid) }}</td>
                  <td class="amount-col" [class.has-balance]="claim.balance > 0">
                    {{ formatCurrency(claim.balance) }}
                  </td>
                  <td class="actions-col">
                    <div class="action-buttons">
                      <button 
                        class="btn-icon" 
                        title="View Details"
                        [routerLink]="['/billing/claims', claim.claimId]">
                        <i class="fas fa-eye"></i>
                      </button>
                      @if (claim.status === 'draft') {
                        <button 
                          class="btn-icon" 
                          title="Edit Claim"
                          [routerLink]="['/billing/claims', claim.claimId, 'edit']">
                          <i class="fas fa-edit"></i>
                        </button>
                        <button 
                          class="btn-icon submit" 
                          title="Submit Claim"
                          (click)="submitClaim(claim)">
                          <i class="fas fa-paper-plane"></i>
                        </button>
                      }
                      @if (claim.status === 'rejected') {
                        <button 
                          class="btn-icon rebill" 
                          title="Rebill Claim"
                          (click)="rebillClaim(claim)">
                          <i class="fas fa-redo"></i>
                        </button>
                      }
                      @if (claim.status === 'denied') {
                        <button 
                          class="btn-icon appeal" 
                          title="Appeal Claim"
                          (click)="appealClaim(claim)">
                          <i class="fas fa-gavel"></i>
                        </button>
                      }
                      <button 
                        class="btn-icon" 
                        title="More Actions"
                        (click)="showClaimMenu(claim, $event)">
                        <i class="fas fa-ellipsis-v"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>

          <!-- Pagination -->
          <div class="pagination">
            <div class="pagination-info">
              Showing {{ paginationStart() }} - {{ paginationEnd() }} of {{ totalClaims() }} claims
            </div>
            <div class="pagination-controls">
              <button 
                class="btn btn-sm"
                [disabled]="currentPage() === 1"
                (click)="goToPage(1)">
                <i class="fas fa-angle-double-left"></i>
              </button>
              <button 
                class="btn btn-sm"
                [disabled]="currentPage() === 1"
                (click)="goToPage(currentPage() - 1)">
                <i class="fas fa-angle-left"></i>
              </button>
              <span class="page-info">Page {{ currentPage() }} of {{ totalPages() }}</span>
              <button 
                class="btn btn-sm"
                [disabled]="currentPage() === totalPages()"
                (click)="goToPage(currentPage() + 1)">
                <i class="fas fa-angle-right"></i>
              </button>
              <button 
                class="btn btn-sm"
                [disabled]="currentPage() === totalPages()"
                (click)="goToPage(totalPages())">
                <i class="fas fa-angle-double-right"></i>
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Bulk Actions -->
      @if (selectedClaims().size > 0) {
        <div class="bulk-actions-bar">
          <span class="selection-count">{{ selectedClaims().size }} claim(s) selected</span>
          <div class="bulk-buttons">
            <button class="btn btn-secondary" (click)="bulkSubmit()">
              <i class="fas fa-paper-plane"></i>
              Submit Selected
            </button>
            <button class="btn btn-secondary" (click)="bulkExport()">
              <i class="fas fa-download"></i>
              Export Selected
            </button>
            <button class="btn btn-text" (click)="clearSelection()">
              Clear Selection
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .claims-list {
      padding: 1.5rem;
      max-width: 1600px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .header-content h1 {
      font-size: 1.75rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .subtitle {
      color: #64748b;
      margin: 0.25rem 0 0 0;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }

    .btn-primary {
      background: #2563eb;
      color: white;
    }

    .btn-primary:hover {
      background: #1d4ed8;
    }

    .btn-secondary {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #e2e8f0;
    }

    .btn-secondary:hover {
      background: #e2e8f0;
    }

    .btn-text {
      background: transparent;
      color: #64748b;
    }

    .btn-text:hover {
      color: #1e293b;
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.875rem;
    }

    /* Statistics */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: white;
      border-radius: 0.75rem;
      border: 1px solid #e2e8f0;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    .stat-icon.total {
      background: #eff6ff;
      color: #2563eb;
    }

    .stat-icon.charges {
      background: #f0fdf4;
      color: #16a34a;
    }

    .stat-icon.paid {
      background: #ecfdf5;
      color: #059669;
    }

    .stat-icon.balance {
      background: #fef3c7;
      color: #d97706;
    }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #64748b;
    }

    /* Aging Section */
    .aging-section {
      background: white;
      border-radius: 0.75rem;
      border: 1px solid #e2e8f0;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }

    .aging-section h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 1rem 0;
    }

    .aging-buckets {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 0.75rem;
    }

    .aging-bucket {
      padding: 1rem;
      background: #f8fafc;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
      border: 2px solid transparent;
    }

    .aging-bucket:hover {
      background: #f1f5f9;
    }

    .aging-bucket.active {
      border-color: #2563eb;
      background: #eff6ff;
    }

    .aging-bucket.warning {
      border-left: 3px solid #f59e0b;
    }

    .aging-bucket.caution {
      border-left: 3px solid #f97316;
    }

    .aging-bucket.danger {
      border-left: 3px solid #ef4444;
    }

    .aging-bucket.critical {
      border-left: 3px solid #dc2626;
      background: #fef2f2;
    }

    .bucket-label {
      display: block;
      font-size: 0.75rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.25rem;
    }

    .bucket-amount {
      display: block;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
    }

    .bucket-count {
      display: block;
      font-size: 0.75rem;
      color: #94a3b8;
    }

    /* Status Tabs */
    .status-tabs {
      display: flex;
      gap: 0.25rem;
      background: #f1f5f9;
      padding: 0.25rem;
      border-radius: 0.5rem;
      margin-bottom: 1rem;
      overflow-x: auto;
    }

    .status-tab {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: transparent;
      border: none;
      border-radius: 0.375rem;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;
    }

    .status-tab:hover {
      background: rgba(255, 255, 255, 0.5);
    }

    .status-tab.active {
      background: white;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .tab-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #475569;
    }

    .status-tab.active .tab-label {
      color: #1e293b;
    }

    .tab-count {
      font-size: 0.75rem;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      color: white;
    }

    /* Filters */
    .filters-bar {
      display: flex;
      gap: 1rem;
      align-items: center;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .search-box {
      flex: 1;
      min-width: 250px;
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
      width: 100%;
      padding: 0.5rem 0.75rem 0.5rem 2.25rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.875rem;
    }

    .search-box input:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .filter-group select,
    .filter-group input {
      padding: 0.5rem 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      background: white;
    }

    .date-range {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .date-range span {
      color: #64748b;
      font-size: 0.875rem;
    }

    /* Claims Table */
    .claims-table-container {
      background: white;
      border-radius: 0.75rem;
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }

    .claims-table {
      width: 100%;
      border-collapse: collapse;
    }

    .claims-table th {
      padding: 0.75rem 1rem;
      text-align: left;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }

    .claims-table th.sortable {
      cursor: pointer;
    }

    .claims-table th.sortable:hover {
      color: #1e293b;
    }

    .claims-table th i {
      margin-left: 0.25rem;
      opacity: 0.5;
    }

    .claims-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      font-size: 0.875rem;
    }

    .claims-table tbody tr:hover {
      background: #f8fafc;
    }

    .claims-table tbody tr.has-rejection {
      background: #fef2f2;
    }

    .claims-table tbody tr.selected {
      background: #eff6ff;
    }

    .checkbox-col {
      width: 40px;
      text-align: center;
    }

    .claim-number a {
      color: #2563eb;
      text-decoration: none;
      font-weight: 500;
    }

    .claim-number a:hover {
      text-decoration: underline;
    }

    .rebill-badge {
      display: inline-block;
      margin-left: 0.375rem;
      padding: 0.125rem 0.375rem;
      background: #dbeafe;
      color: #1d4ed8;
      font-size: 0.625rem;
      font-weight: 600;
      border-radius: 0.25rem;
    }

    .patient-cell {
      max-width: 150px;
    }

    .patient-name {
      display: block;
      font-weight: 500;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .payer-cell {
      max-width: 150px;
    }

    .payer-name {
      display: block;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .insurance-type {
      display: block;
      font-size: 0.75rem;
      color: #64748b;
      text-transform: capitalize;
    }

    .type-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .type-badge.professional {
      background: #eff6ff;
      color: #1d4ed8;
    }

    .type-badge.institutional {
      background: #f0fdf4;
      color: #15803d;
    }

    .type-badge.dental {
      background: #fdf4ff;
      color: #a21caf;
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-badge.draft {
      background: #f1f5f9;
      color: #475569;
    }

    .status-badge.pending {
      background: #fef3c7;
      color: #92400e;
    }

    .status-badge.submitted {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .status-badge.accepted {
      background: #d1fae5;
      color: #065f46;
    }

    .status-badge.rejected {
      background: #fee2e2;
      color: #991b1b;
    }

    .status-badge.denied {
      background: #fecaca;
      color: #b91c1c;
    }

    .status-badge.partial-paid {
      background: #fef9c3;
      color: #854d0e;
    }

    .status-badge.paid {
      background: #dcfce7;
      color: #166534;
    }

    .status-badge.appealed {
      background: #e0e7ff;
      color: #3730a3;
    }

    .status-badge.voided {
      background: #f3f4f6;
      color: #6b7280;
    }

    .rejection-code {
      display: block;
      margin-top: 0.25rem;
      font-size: 0.625rem;
      color: #dc2626;
      cursor: help;
    }

    .amount-col {
      text-align: right;
      font-family: 'SF Mono', 'Monaco', monospace;
    }

    .amount-col.has-balance {
      color: #dc2626;
      font-weight: 600;
    }

    .actions-col {
      width: 120px;
    }

    .action-buttons {
      display: flex;
      gap: 0.25rem;
      justify-content: flex-end;
    }

    .btn-icon {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      color: #64748b;
      border-radius: 0.25rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-icon:hover {
      background: #f1f5f9;
      color: #1e293b;
    }

    .btn-icon.submit:hover {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .btn-icon.rebill:hover {
      background: #fef3c7;
      color: #d97706;
    }

    .btn-icon.appeal:hover {
      background: #e0e7ff;
      color: #4f46e5;
    }

    /* Pagination */
    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-top: 1px solid #e2e8f0;
    }

    .pagination-info {
      font-size: 0.875rem;
      color: #64748b;
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .page-info {
      font-size: 0.875rem;
      color: #475569;
      padding: 0 0.5rem;
    }

    /* Bulk Actions */
    .bulk-actions-bar {
      position: fixed;
      bottom: 1.5rem;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1.5rem;
      background: #1e293b;
      color: white;
      border-radius: 0.75rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      z-index: 100;
    }

    .selection-count {
      font-size: 0.875rem;
    }

    .bulk-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .bulk-buttons .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border-color: rgba(255, 255, 255, 0.2);
    }

    .bulk-buttons .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .bulk-buttons .btn-text {
      color: rgba(255, 255, 255, 0.7);
    }

    .bulk-buttons .btn-text:hover {
      color: white;
    }

    /* Loading & Empty States */
    .loading-state,
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      color: #64748b;
    }

    .loading-state i,
    .empty-state i {
      font-size: 3rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .empty-state h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #475569;
      margin: 0 0 0.5rem 0;
    }

    .empty-state p {
      margin: 0;
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .aging-buckets {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 1rem;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .aging-buckets {
        grid-template-columns: repeat(2, 1fr);
      }

      .claims-table-container {
        overflow-x: auto;
      }
    }
  `]
})
export class ClaimsListComponent implements OnInit {
  private readonly billingService = inject(BillingService);

  // State
  claims = signal<Claim[]>([]);
  statistics = signal<ClaimStatistics | null>(null);
  agingReport = signal<AgingReport | null>(null);
  loading = signal(true);
  selectedClaims = signal<Set<string>>(new Set());

  // Pagination
  currentPage = signal(1);
  pageSize = signal(20);
  totalClaims = signal(0);
  totalPages = computed(() => Math.ceil(this.totalClaims() / this.pageSize()));

  paginationStart = computed(() => (this.currentPage() - 1) * this.pageSize() + 1);
  paginationEnd = computed(() => Math.min(this.currentPage() * this.pageSize(), this.totalClaims()));

  // Filters
  searchQuery = '';
  filterType = '';
  filterPayer = '';
  dateFrom = '';
  dateTo = '';
  selectedStatus = signal<ClaimStatus | 'all' | 'actionable'>('all');
  selectedAging = signal<string | null>(null);
  sortField = signal('createdAt');
  sortOrder = signal<'asc' | 'desc'>('desc');

  // Payers list (derived from claims)
  payers = signal<string[]>([]);

  // Status tabs
  statusTabs = computed<StatusTab[]>(() => {
    const stats = this.statistics();
    return [
      { status: 'all', label: 'All Claims', count: stats?.total || 0, color: '#64748b' },
      { status: 'actionable', label: 'Needs Action', count: (stats?.rejected || 0) + (stats?.denied || 0), color: '#dc2626' },
      { status: ClaimStatus.Draft, label: 'Draft', count: stats?.draft || 0, color: '#94a3b8' },
      { status: ClaimStatus.Submitted, label: 'Submitted', count: stats?.submitted || 0, color: '#2563eb' },
      { status: ClaimStatus.Pending, label: 'Pending', count: stats?.pending || 0, color: '#f59e0b' },
      { status: ClaimStatus.Rejected, label: 'Rejected', count: stats?.rejected || 0, color: '#ef4444' },
      { status: ClaimStatus.Denied, label: 'Denied', count: stats?.denied || 0, color: '#dc2626' },
      { status: ClaimStatus.Paid, label: 'Paid', count: stats?.paid || 0, color: '#22c55e' }
    ];
  });

  ngOnInit(): void {
    this.loadStatistics();
    this.loadAgingReport();
    this.loadClaims();
    this.loadPayers();
  }

  loadStatistics(): void {
    this.billingService.getClaimStatistics().subscribe(stats => {
      this.statistics.set(stats);
    });
  }

  loadAgingReport(): void {
    this.billingService.getAgingReport().subscribe(report => {
      this.agingReport.set(report);
    });
  }

  loadClaims(): void {
    this.loading.set(true);
    
    const params: ClaimSearchParams = {
      page: this.currentPage(),
      pageSize: this.pageSize(),
      sortBy: this.sortField(),
      sortOrder: this.sortOrder()
    };

    if (this.selectedStatus() !== 'all') {
      if (this.selectedStatus() === 'actionable') {
        params.status = [ClaimStatus.Rejected, ClaimStatus.Denied];
      } else {
        params.status = this.selectedStatus() as ClaimStatus;
      }
    }

    if (this.filterType) {
      params.type = this.filterType as ClaimType;
    }

    if (this.filterPayer) {
      params.payerId = this.filterPayer;
    }

    if (this.dateFrom) {
      params.dateFrom = this.dateFrom;
    }

    if (this.dateTo) {
      params.dateTo = this.dateTo;
    }

    if (this.selectedAging()) {
      params.aging = this.selectedAging() as any;
    }

    this.billingService.getClaims(params).subscribe({
      next: (response) => {
        let filteredClaims = response.data;
        
        // Client-side search filter
        if (this.searchQuery) {
          const query = this.searchQuery.toLowerCase();
          filteredClaims = filteredClaims.filter(c =>
            c.claimNumber.toLowerCase().includes(query) ||
            c.patientName?.toLowerCase().includes(query) ||
            c.payerName?.toLowerCase().includes(query)
          );
        }

        this.claims.set(filteredClaims);
        this.totalClaims.set(response.total);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  loadPayers(): void {
    // In real implementation, this would come from a payers endpoint
    this.payers.set(['BCBS', 'Aetna', 'Medicare', 'UnitedHealthcare', 'Cigna']);
  }

  selectStatus(status: ClaimStatus | 'all' | 'actionable'): void {
    this.selectedStatus.set(status);
    this.selectedAging.set(null);
    this.currentPage.set(1);
    this.loadClaims();
  }

  filterByAging(aging: string): void {
    if (this.selectedAging() === aging) {
      this.selectedAging.set(null);
    } else {
      this.selectedAging.set(aging);
    }
    this.selectedStatus.set('all');
    this.currentPage.set(1);
    this.loadClaims();
  }

  onSearchChange(): void {
    this.currentPage.set(1);
    this.loadClaims();
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadClaims();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.filterType = '';
    this.filterPayer = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.selectedStatus.set('all');
    this.selectedAging.set(null);
    this.currentPage.set(1);
    this.loadClaims();
  }

  sortBy(field: string): void {
    if (this.sortField() === field) {
      this.sortOrder.set(this.sortOrder() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortOrder.set('desc');
    }
    this.loadClaims();
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadClaims();
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      const allIds = new Set(
        this.claims()
          .map(c => c.claimId || c.id)
          .filter((id): id is string => !!id)
      );
      this.selectedClaims.set(allIds);
    } else {
      this.selectedClaims.set(new Set());
    }
  }

  toggleSelectClaim(id: string | undefined): void {
    if (!id) return;
    const current = new Set(this.selectedClaims());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.selectedClaims.set(current);
  }

  clearSelection(): void {
    this.selectedClaims.set(new Set());
  }

  submitClaim(claim: Claim): void {
    const claimId = claim.claimId || claim.id;
    if (!claimId) return;
    
    if (confirm(`Submit claim ${claim.claimNumber} to ${claim.payerName}?`)) {
      this.billingService.submitClaim(claimId).subscribe({
        next: () => {
          this.loadClaims();
          this.loadStatistics();
        }
      });
    }
  }

  rebillClaim(claim: Claim): void {
    const claimId = claim.claimId || claim.id;
    if (!claimId) return;
    
    if (confirm(`Create a rebill for claim ${claim.claimNumber}?`)) {
      this.billingService.rebillClaim(claimId).subscribe({
        next: (newClaim) => {
          // Navigate to the new claim for editing
          window.location.href = `/billing/claims/${newClaim.claimId || newClaim.id}/edit`;
        }
      });
    }
  }

  appealClaim(claim: Claim): void {
    const claimId = claim.claimId || claim.id;
    if (!claimId) return;
    
    const reason = prompt('Enter appeal reason:');
    if (reason) {
      this.billingService.appealClaim(claimId, reason).subscribe({
        next: () => {
          this.loadClaims();
          this.loadStatistics();
        }
      });
    }
  }

  showClaimMenu(claim: Claim, event: Event): void {
    event.stopPropagation();
    // Would show a dropdown menu with additional actions
    console.log('Show menu for claim:', claim.claimNumber);
  }

  bulkSubmit(): void {
    const draftClaims = this.claims().filter(c => {
      const claimId = c.claimId || c.id;
      return claimId && this.selectedClaims().has(claimId) && c.status === ClaimStatus.Draft;
    });
    if (draftClaims.length === 0) {
      alert('No draft claims selected for submission');
      return;
    }
    if (confirm(`Submit ${draftClaims.length} claim(s)?`)) {
      // In real implementation, this would be a batch operation
      draftClaims.forEach(claim => {
        const claimId = claim.claimId || claim.id;
        if (claimId) {
          this.billingService.submitClaim(claimId).subscribe();
        }
      });
      this.clearSelection();
      this.loadClaims();
    }
  }

  bulkExport(): void {
    console.log('Exporting claims:', Array.from(this.selectedClaims()));
    // Would generate a CSV/Excel export
  }

  exportClaims(): void {
    console.log('Exporting all claims');
    // Would generate a full export
  }

  getStatusLabel(status: ClaimStatus): string {
    return CLAIM_STATUS_LABELS[status] || status;
  }

  getTypeLabel(type: ClaimType): string {
    return CLAIM_TYPE_LABELS[type] || type;
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
}
