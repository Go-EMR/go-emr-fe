import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PrescriptionService } from '../data-access/services/prescription.service';
import { Prescription, PrescriptionStatus } from '../data-access/models/prescription.model';

@Component({
  selector: 'app-prescription-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="prescription-list">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Prescriptions</h1>
          <p class="subtitle">E-prescribe and medication management</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="exportPrescriptions()">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export
          </button>
          <a routerLink="/prescriptions/new" class="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Prescription
          </a>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon active">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats().active }}</span>
            <span class="stat-label">Active</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon pending">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats().pending }}</span>
            <span class="stat-label">Pending</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon refill">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats().needsRefill }}</span>
            <span class="stat-label">Needs Refill</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon controlled">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats().controlled }}</span>
            <span class="stat-label">Controlled</span>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="search-box">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input 
            type="text" 
            placeholder="Search by patient, medication, or diagnosis..." 
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange()"
          />
          @if (searchQuery()) {
            <button class="clear-btn" (click)="clearSearch()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          }
        </div>

        <div class="filter-group">
          <select [(ngModel)]="statusFilter" (ngModelChange)="onFilterChange()">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="on-hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="stopped">Stopped</option>
          </select>

          <select [(ngModel)]="controlledFilter" (ngModelChange)="onFilterChange()">
            <option value="">All Medications</option>
            <option value="controlled">Controlled Only</option>
            <option value="non-controlled">Non-Controlled Only</option>
          </select>

          <select [(ngModel)]="timeFilter" (ngModelChange)="onFilterChange()">
            <option value="">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
        </div>
      </div>

      <!-- Prescriptions List -->
      <div class="prescriptions-container">
        @if (loading()) {
          <div class="loading-state">
            @for (i of [1,2,3,4,5]; track i) {
              <div class="skeleton-card">
                <div class="skeleton-header">
                  <div class="skeleton skeleton-avatar"></div>
                  <div class="skeleton-info">
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton skeleton-subtitle"></div>
                  </div>
                </div>
                <div class="skeleton-body">
                  <div class="skeleton skeleton-line"></div>
                  <div class="skeleton skeleton-line short"></div>
                </div>
              </div>
            }
          </div>
        } @else if (prescriptions().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
            </div>
            <h3>No prescriptions found</h3>
            <p>
              @if (searchQuery() || statusFilter() || controlledFilter() || timeFilter()) {
                No prescriptions match your search criteria. Try adjusting your filters.
              } @else {
                Get started by creating a new prescription.
              }
            </p>
            @if (searchQuery() || statusFilter() || controlledFilter() || timeFilter()) {
              <button class="btn btn-secondary" (click)="clearFilters()">Clear Filters</button>
            } @else {
              <a routerLink="/prescriptions/new" class="btn btn-primary">New Prescription</a>
            }
          </div>
        } @else {
          <div class="prescriptions-list">
            @for (rx of prescriptions(); track rx.id) {
              <div class="prescription-card" [class.controlled]="rx.medication.isControlled">
                <div class="card-header">
                  <div class="patient-info">
                    <div class="patient-avatar">
                      {{ getInitials(rx.patient.name) }}
                    </div>
                    <div class="patient-details">
                      <a [routerLink]="['/patients', rx.patient.id]" class="patient-name">
                        {{ rx.patient.name }}
                      </a>
                      <span class="patient-meta">
                        MRN: {{ rx.patient.mrn }} · DOB: {{ rx.patient.dob | date:'MM/dd/yyyy' }}
                      </span>
                    </div>
                  </div>
                  <div class="card-badges">
                    <span class="status-badge" [class]="rx.status">
                      {{ rx.status | titlecase }}
                    </span>
                    @if (rx.medication.isControlled) {
                      <span class="controlled-badge">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        C-{{ rx.medication.controlledSchedule }}
                      </span>
                    }
                    @if (rx.priorAuthRequired && rx.priorAuthStatus !== 'approved') {
                      <span class="pa-badge" [class]="rx.priorAuthStatus || 'pending'">
                        PA {{ rx.priorAuthStatus || 'Required' }}
                      </span>
                    }
                  </div>
                </div>

                <div class="medication-info">
                  <div class="medication-name">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
                    <span class="name">{{ rx.medication.name }} {{ rx.medication.strength }}{{ rx.medication.strengthUnit }}</span>
                    <span class="form">{{ rx.medication.form | titlecase }}</span>
                  </div>
                  <div class="dosage-info">
                    {{ rx.dosage.text }}
                  </div>
                </div>

                <div class="card-details">
                  <div class="detail-row">
                    <div class="detail-item">
                      <span class="detail-label">Qty</span>
                      <span class="detail-value">{{ rx.dispense.quantity }} {{ rx.dispense.unit }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Days Supply</span>
                      <span class="detail-value">{{ rx.dispense.daysSupply }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Refills</span>
                      <span class="detail-value" [class.low-refills]="(rx.dispense.refillsRemaining || 0) <= 1">
                        {{ rx.dispense.refillsRemaining ?? rx.dispense.refills }} / {{ rx.dispense.refills }}
                      </span>
                    </div>
                    @if (rx.ePrescribeStatus) {
                      <div class="detail-item">
                        <span class="detail-label">E-Rx Status</span>
                        <span class="detail-value erx-status" [class]="rx.ePrescribeStatus">
                          {{ formatErxStatus(rx.ePrescribeStatus) }}
                        </span>
                      </div>
                    }
                  </div>
                </div>

                @if (rx.indication || rx.reasonDescription) {
                  <div class="indication">
                    <span class="indication-label">For:</span>
                    {{ rx.indication || rx.reasonDescription }}
                    @if (rx.reasonCode) {
                      <span class="icd-code">({{ rx.reasonCode }})</span>
                    }
                  </div>
                }

                <div class="card-footer">
                  <div class="footer-info">
                    <span class="prescriber">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      {{ rx.prescriber.name }}
                    </span>
                    <span class="date">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      {{ rx.authoredOn | date:'MMM d, yyyy' }}
                    </span>
                    @if (rx.dispense.pharmacy) {
                      <span class="pharmacy">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                        {{ rx.dispense.pharmacy.name }}
                      </span>
                    }
                  </div>
                  <div class="footer-actions">
                    <a [routerLink]="['/prescriptions', rx.id]" class="btn btn-sm btn-secondary">
                      View
                    </a>
                    @if (rx.status === 'draft') {
                      <button class="btn btn-sm btn-primary" (click)="sendPrescription(rx)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                        Send
                      </button>
                    }
                    @if (rx.status === 'active' && (rx.dispense.refillsRemaining || 0) > 0) {
                      <button class="btn btn-sm btn-secondary" (click)="requestRefill(rx)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                        Refill
                      </button>
                    }
                    <div class="dropdown">
                      <button class="btn btn-sm btn-icon" (click)="toggleMenu(rx.id)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                      </button>
                      @if (openMenuId() === rx.id) {
                        <div class="dropdown-menu">
                          <a [routerLink]="['/prescriptions', rx.id, 'edit']" class="dropdown-item">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            Edit
                          </a>
                          <button class="dropdown-item" (click)="renewPrescription(rx)">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                            Renew
                          </button>
                          <button class="dropdown-item" (click)="printPrescription(rx)">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                            Print
                          </button>
                          <a [routerLink]="['/patients', rx.patient.id]" class="dropdown-item">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            View Patient
                          </a>
                          <div class="dropdown-divider"></div>
                          @if (rx.status === 'active' || rx.status === 'on-hold') {
                            <button class="dropdown-item text-warning" (click)="holdPrescription(rx)">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="10" y1="15" x2="10" y2="9"/><line x1="14" y1="15" x2="14" y2="9"/></svg>
                            {{ rx.status === 'on-hold' ? 'Resume' : 'Hold' }}
                            </button>
                          }
                          @if (rx.status !== 'cancelled' && rx.status !== 'completed') {
                            <button class="dropdown-item text-danger" (click)="cancelPrescription(rx)">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                              Cancel
                            </button>
                          }
                        </div>
                      }
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="pagination">
              <button 
                class="btn btn-sm btn-secondary" 
                [disabled]="currentPage() === 0"
                (click)="goToPage(currentPage() - 1)"
              >
                Previous
              </button>
              <span class="page-info">
                Page {{ currentPage() + 1 }} of {{ totalPages() }}
                ({{ totalCount() }} total)
              </span>
              <button 
                class="btn btn-sm btn-secondary" 
                [disabled]="currentPage() >= totalPages() - 1"
                (click)="goToPage(currentPage() + 1)"
              >
                Next
              </button>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .prescription-list {
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
      color: #111827;
      margin: 0 0 4px 0;
    }

    .subtitle {
      color: #6b7280;
      font-size: 14px;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    /* Stats */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon.active {
      background: #dcfce7;
      color: #16a34a;
    }

    .stat-icon.pending {
      background: #fef3c7;
      color: #d97706;
    }

    .stat-icon.refill {
      background: #dbeafe;
      color: #2563eb;
    }

    .stat-icon.controlled {
      background: #fce7f3;
      color: #db2777;
    }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
    }

    .stat-label {
      font-size: 13px;
      color: #6b7280;
    }

    /* Filters */
    .filters-section {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .search-box {
      flex: 1;
      min-width: 300px;
      position: relative;
      display: flex;
      align-items: center;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 0 12px;
    }

    .search-box svg {
      color: #9ca3af;
      flex-shrink: 0;
    }

    .search-box input {
      flex: 1;
      border: none;
      padding: 12px;
      font-size: 14px;
      outline: none;
      background: transparent;
    }

    .clear-btn {
      background: none;
      border: none;
      padding: 4px;
      cursor: pointer;
      color: #9ca3af;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .clear-btn:hover {
      color: #6b7280;
    }

    .filter-group {
      display: flex;
      gap: 12px;
    }

    .filter-group select {
      padding: 10px 32px 10px 12px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: white;
      font-size: 14px;
      color: #374151;
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
      background-position: right 8px center;
      background-repeat: no-repeat;
      background-size: 20px;
    }

    /* Prescription Cards */
    .prescriptions-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .prescriptions-list {
      display: flex;
      flex-direction: column;
    }

    .prescription-card {
      padding: 20px;
      border-bottom: 1px solid #f3f4f6;
      transition: background 0.15s;
    }

    .prescription-card:hover {
      background: #f9fafb;
    }

    .prescription-card:last-child {
      border-bottom: none;
    }

    .prescription-card.controlled {
      border-left: 3px solid #db2777;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .patient-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .patient-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
    }

    .patient-details {
      display: flex;
      flex-direction: column;
    }

    .patient-name {
      font-weight: 600;
      color: #111827;
      text-decoration: none;
    }

    .patient-name:hover {
      color: #4f46e5;
    }

    .patient-meta {
      font-size: 13px;
      color: #6b7280;
    }

    .card-badges {
      display: flex;
      gap: 8px;
    }

    .status-badge {
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 500;
    }

    .status-badge.active {
      background: #dcfce7;
      color: #16a34a;
    }

    .status-badge.draft {
      background: #f3f4f6;
      color: #6b7280;
    }

    .status-badge.on-hold {
      background: #fef3c7;
      color: #d97706;
    }

    .status-badge.completed {
      background: #dbeafe;
      color: #2563eb;
    }

    .status-badge.cancelled, .status-badge.stopped {
      background: #fee2e2;
      color: #dc2626;
    }

    .controlled-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 500;
      background: #fce7f3;
      color: #db2777;
    }

    .pa-badge {
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 500;
      background: #fed7aa;
      color: #c2410c;
    }

    .pa-badge.approved {
      background: #dcfce7;
      color: #16a34a;
    }

    .pa-badge.denied {
      background: #fee2e2;
      color: #dc2626;
    }

    .medication-info {
      margin-bottom: 12px;
    }

    .medication-name {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .medication-name svg {
      color: #6366f1;
    }

    .medication-name .name {
      font-weight: 600;
      color: #111827;
      font-size: 16px;
    }

    .medication-name .form {
      font-size: 13px;
      color: #6b7280;
      background: #f3f4f6;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .dosage-info {
      font-size: 14px;
      color: #374151;
      margin-left: 26px;
    }

    .card-details {
      background: #f9fafb;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 12px;
    }

    .detail-row {
      display: flex;
      gap: 32px;
      flex-wrap: wrap;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .detail-label {
      font-size: 11px;
      text-transform: uppercase;
      color: #9ca3af;
      font-weight: 500;
    }

    .detail-value {
      font-size: 14px;
      color: #374151;
      font-weight: 500;
    }

    .detail-value.low-refills {
      color: #dc2626;
    }

    .erx-status {
      text-transform: capitalize;
    }

    .erx-status.sent {
      color: #2563eb;
    }

    .erx-status.filled {
      color: #16a34a;
    }

    .erx-status.error {
      color: #dc2626;
    }

    .indication {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 12px;
    }

    .indication-label {
      font-weight: 500;
      color: #374151;
    }

    .icd-code {
      color: #9ca3af;
      font-size: 12px;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 12px;
      border-top: 1px solid #f3f4f6;
    }

    .footer-info {
      display: flex;
      gap: 16px;
      font-size: 13px;
      color: #6b7280;
    }

    .footer-info span {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .footer-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
      border: none;
      text-decoration: none;
    }

    .btn-primary {
      background: #4f46e5;
      color: white;
    }

    .btn-primary:hover {
      background: #4338ca;
    }

    .btn-secondary {
      background: white;
      color: #374151;
      border: 1px solid #e5e7eb;
    }

    .btn-secondary:hover {
      background: #f9fafb;
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 13px;
    }

    .btn-icon {
      padding: 6px;
      background: transparent;
      border: none;
      color: #6b7280;
    }

    .btn-icon:hover {
      background: #f3f4f6;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Dropdown */
    .dropdown {
      position: relative;
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      right: 0;
      background: white;
      border-radius: 8px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      border: 1px solid #e5e7eb;
      min-width: 180px;
      z-index: 50;
      padding: 4px;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      font-size: 14px;
      color: #374151;
      cursor: pointer;
      border-radius: 6px;
      border: none;
      background: none;
      width: 100%;
      text-align: left;
      text-decoration: none;
    }

    .dropdown-item:hover {
      background: #f3f4f6;
    }

    .dropdown-item.text-warning {
      color: #d97706;
    }

    .dropdown-item.text-danger {
      color: #dc2626;
    }

    .dropdown-divider {
      height: 1px;
      background: #e5e7eb;
      margin: 4px 0;
    }

    /* Empty State */
    .empty-state {
      padding: 64px 24px;
      text-align: center;
    }

    .empty-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 16px;
      background: #f3f4f6;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #9ca3af;
    }

    .empty-state h3 {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin: 0 0 8px 0;
    }

    .empty-state p {
      color: #6b7280;
      margin: 0 0 24px 0;
      max-width: 400px;
      margin-left: auto;
      margin-right: auto;
    }

    /* Loading State */
    .loading-state {
      padding: 16px;
    }

    .skeleton-card {
      padding: 20px;
      border-bottom: 1px solid #f3f4f6;
    }

    .skeleton {
      background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }

    .skeleton-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .skeleton-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
    }

    .skeleton-info {
      flex: 1;
    }

    .skeleton-title {
      height: 16px;
      width: 200px;
      margin-bottom: 8px;
    }

    .skeleton-subtitle {
      height: 12px;
      width: 150px;
    }

    .skeleton-body {
      margin-left: 52px;
    }

    .skeleton-line {
      height: 14px;
      margin-bottom: 8px;
      width: 100%;
    }

    .skeleton-line.short {
      width: 60%;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* Pagination */
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      padding: 20px;
      border-top: 1px solid #f3f4f6;
    }

    .page-info {
      font-size: 14px;
      color: #6b7280;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .stats-row {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 16px;
      }

      .header-actions {
        width: 100%;
      }

      .stats-row {
        grid-template-columns: repeat(2, 1fr);
      }

      .filters-section {
        flex-direction: column;
      }

      .search-box {
        min-width: 100%;
      }

      .filter-group {
        flex-wrap: wrap;
      }

      .detail-row {
        gap: 16px;
      }

      .footer-info {
        flex-wrap: wrap;
        gap: 8px;
      }
    }
  `]
})
export class PrescriptionListComponent implements OnInit {
  private prescriptionService = inject(PrescriptionService);

  prescriptions = signal<Prescription[]>([]);
  loading = signal(true);
  totalCount = signal(0);
  currentPage = signal(0);
  pageSize = signal(20);

  searchQuery = signal('');
  statusFilter = signal<string>('');
  controlledFilter = signal<string>('');
  timeFilter = signal<string>('');
  openMenuId = signal<string | null>(null);

  totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize()));

  stats = computed(() => {
    // These would typically come from a separate API call
    const all = this.prescriptions();
    return {
      active: all.filter(p => p.status === 'active').length,
      pending: all.filter(p => p.status === 'draft' || p.ePrescribeStatus === 'pending').length,
      needsRefill: all.filter(p => p.status === 'active' && (p.dispense.refillsRemaining || 0) <= 1).length,
      controlled: all.filter(p => p.medication.isControlled).length,
    };
  });

  ngOnInit() {
    this.loadPrescriptions();

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!(e.target as HTMLElement).closest('.dropdown')) {
        this.openMenuId.set(null);
      }
    });
  }

  loadPrescriptions() {
    this.loading.set(true);

    const params: any = {
      page: this.currentPage(),
      limit: this.pageSize(),
    };

    if (this.searchQuery()) {
      params.search = this.searchQuery();
    }
    if (this.statusFilter()) {
      params.status = [this.statusFilter()];
    }
    if (this.controlledFilter()) {
      params.isControlled = this.controlledFilter() === 'controlled';
    }
    if (this.timeFilter()) {
      const now = new Date();
      switch (this.timeFilter()) {
        case 'today':
          params.startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
          break;
        case 'week':
          params.startDate = new Date(now.setDate(now.getDate() - 7)).toISOString();
          break;
        case 'month':
          params.startDate = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
          break;
        case 'quarter':
          params.startDate = new Date(now.setMonth(now.getMonth() - 3)).toISOString();
          break;
      }
    }

    this.prescriptionService.searchPrescriptions(params).subscribe({
      next: (result) => {
        this.prescriptions.set(result.data);
        this.totalCount.set(result.total);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onSearchChange() {
    this.currentPage.set(0);
    this.loadPrescriptions();
  }

  onFilterChange() {
    this.currentPage.set(0);
    this.loadPrescriptions();
  }

  clearSearch() {
    this.searchQuery.set('');
    this.onSearchChange();
  }

  clearFilters() {
    this.searchQuery.set('');
    this.statusFilter.set('');
    this.controlledFilter.set('');
    this.timeFilter.set('');
    this.currentPage.set(0);
    this.loadPrescriptions();
  }

  goToPage(page: number) {
    this.currentPage.set(page);
    this.loadPrescriptions();
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  formatErxStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'Pending',
      'sent': 'Sent',
      'received': 'Received',
      'filled': 'Filled',
      'partial': 'Partial Fill',
      'cancelled': 'Cancelled',
      'error': 'Error',
    };
    return statusMap[status] || status;
  }

  toggleMenu(id: string) {
    this.openMenuId.set(this.openMenuId() === id ? null : id);
  }

  sendPrescription(rx: Prescription) {
    this.prescriptionService.sendPrescription(rx.id).subscribe({
      next: () => this.loadPrescriptions()
    });
  }

  requestRefill(rx: Prescription) {
    this.prescriptionService.requestRefill({ prescriptionId: rx.id }).subscribe({
      next: () => this.loadPrescriptions()
    });
  }

  renewPrescription(rx: Prescription) {
    this.prescriptionService.renewPrescription({ prescriptionId: rx.id }).subscribe({
      next: (newRx) => {
        // Navigate to edit the new prescription
        window.location.href = `/prescriptions/${newRx.id}/edit`;
      }
    });
    this.openMenuId.set(null);
  }

  printPrescription(rx: Prescription) {
    // Would open print dialog
    console.log('Print prescription:', rx.id);
    this.openMenuId.set(null);
  }

  holdPrescription(rx: Prescription) {
    const newStatus = rx.status === 'on-hold' ? 'active' : 'on-hold';
    this.prescriptionService.updatePrescription(rx.id, { status: newStatus }).subscribe({
      next: () => this.loadPrescriptions()
    });
    this.openMenuId.set(null);
  }

  cancelPrescription(rx: Prescription) {
    if (confirm('Are you sure you want to cancel this prescription?')) {
      this.prescriptionService.cancelPrescription(rx.id).subscribe({
        next: () => this.loadPrescriptions()
      });
    }
    this.openMenuId.set(null);
  }

  exportPrescriptions() {
    // Would export to CSV/PDF
    console.log('Export prescriptions');
  }
}
