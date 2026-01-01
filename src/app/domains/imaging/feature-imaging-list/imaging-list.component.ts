import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ImagingService, ImagingSearchParams } from '../data-access/services/imaging.service';
import {
  ImagingOrder,
  ImagingModality,
  ImagingOrderStatus,
  ImagingPriority,
  MODALITY_LABELS,
  STATUS_LABELS,
  PRIORITY_LABELS,
  BODY_REGION_LABELS
} from '../data-access/models/imaging.model';

@Component({
  selector: 'app-imaging-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="imaging-list">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Imaging Orders</h1>
          <p class="subtitle">Radiology orders and results</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" routerLink="/imaging/new">
            <span class="btn-icon">+</span>
            New Order
          </button>
        </div>
      </div>

      <!-- Critical Findings Alert -->
      @if (criticalFindingsCount() > 0) {
        <div class="critical-alert">
          <div class="alert-icon">⚠️</div>
          <div class="alert-content">
            <strong>Critical Findings Requiring Review</strong>
            <p>{{ criticalFindingsCount() }} order(s) have critical findings that need acknowledgment</p>
          </div>
          <button class="btn btn-sm btn-danger" (click)="filterCritical()">
            View Critical
          </button>
        </div>
      }

      <!-- Statistics Cards -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-value">{{ stats().total }}</div>
          <div class="stat-label">Total Orders</div>
        </div>
        <div class="stat-card pending">
          <div class="stat-value">{{ stats().pending }}</div>
          <div class="stat-label">Pending</div>
        </div>
        <div class="stat-card scheduled">
          <div class="stat-value">{{ stats().scheduled }}</div>
          <div class="stat-label">Scheduled</div>
        </div>
        <div class="stat-card completed">
          <div class="stat-value">{{ stats().completed }}</div>
          <div class="stat-label">Results Ready</div>
        </div>
      </div>

      <!-- Modality Tabs -->
      <div class="modality-tabs">
        <button 
          class="tab-btn"
          [class.active]="!selectedModality()"
          (click)="selectModality(null)">
          All Modalities
        </button>
        @for (modality of modalities; track modality) {
          <button 
            class="tab-btn"
            [class.active]="selectedModality() === modality"
            (click)="selectModality(modality)">
            {{ getModalityLabel(modality) }}
            <span class="tab-count">{{ getModalityCount(modality) }}</span>
          </button>
        }
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search orders, patients, accession..."
            [ngModel]="searchTerm()"
            (ngModelChange)="searchTerm.set($event); search()">
        </div>

        <div class="filter-group">
          <select 
            [ngModel]="selectedStatus()" 
            (ngModelChange)="selectedStatus.set($event); search()">
            <option value="">All Statuses</option>
            @for (status of statuses; track status) {
              <option [value]="status">{{ getStatusLabel(status) }}</option>
            }
          </select>
        </div>

        <div class="filter-group">
          <select 
            [ngModel]="selectedPriority()" 
            (ngModelChange)="selectedPriority.set($event); search()">
            <option value="">All Priorities</option>
            @for (priority of priorities; track priority) {
              <option [value]="priority">{{ getPriorityLabel(priority) }}</option>
            }
          </select>
        </div>

        <div class="filter-group">
          <input 
            type="date" 
            [ngModel]="dateFrom()" 
            (ngModelChange)="dateFrom.set($event); search()"
            placeholder="From Date">
        </div>

        <div class="filter-group">
          <input 
            type="date" 
            [ngModel]="dateTo()" 
            (ngModelChange)="dateTo.set($event); search()"
            placeholder="To Date">
        </div>

        @if (hasActiveFilters()) {
          <button class="btn btn-sm btn-outline" (click)="clearFilters()">
            Clear Filters
          </button>
        }
      </div>

      <!-- Orders Table -->
      <div class="orders-table-container">
        @if (loading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading imaging orders...</p>
          </div>
        } @else if (orders().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">🩻</div>
            <h3>No imaging orders found</h3>
            <p>Try adjusting your filters or create a new order</p>
            <button class="btn btn-primary" routerLink="/imaging/new">
              Create New Order
            </button>
          </div>
        } @else {
          <table class="orders-table">
            <thead>
              <tr>
                <th class="col-status">Status</th>
                <th class="col-order">Order</th>
                <th class="col-patient">Patient</th>
                <th class="col-modality">Modality</th>
                <th class="col-procedure">Procedure</th>
                <th class="col-date">Date</th>
                <th class="col-provider">Provider</th>
                <th class="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (order of orders(); track order.orderId) {
                <tr 
                  [class.critical]="order.report?.hasCriticalFindings"
                  [class.stat]="order.priority === 'stat'">
                  <td class="col-status">
                    <span class="status-badge" [class]="'status-' + order.status">
                      {{ getStatusLabel(order.status) }}
                    </span>
                    @if (order.report?.hasCriticalFindings) {
                      <span class="critical-badge" title="Critical Finding">⚠️</span>
                    }
                  </td>
                  <td class="col-order">
                    <a [routerLink]="['/imaging', order.orderId]" class="order-link">
                      {{ order.orderId }}
                    </a>
                    @if (order.accessionNumber) {
                      <div class="accession">{{ order.accessionNumber }}</div>
                    }
                  </td>
                  <td class="col-patient">
                    <a [routerLink]="['/patients', order.patientId]" class="patient-link">
                      {{ order.patientName || 'Patient ' + order.patientId }}
                    </a>
                  </td>
                  <td class="col-modality">
                    <span class="modality-badge" [class]="'modality-' + order.modality">
                      {{ getModalityLabel(order.modality) }}
                    </span>
                  </td>
                  <td class="col-procedure">
                    <div class="procedure-name">{{ order.procedure }}</div>
                    <div class="body-region">{{ getBodyRegionLabel(order.bodyRegion) }}</div>
                  </td>
                  <td class="col-date">
                    <div class="date-display">
                      {{ formatDate(getRelevantDate(order)) }}
                    </div>
                    <div class="priority-badge" [class]="'priority-' + order.priority">
                      {{ getPriorityLabel(order.priority) }}
                    </div>
                  </td>
                  <td class="col-provider">
                    {{ order.orderingProvider?.name ?? order.orderingProviderName ?? '—' }}
                  </td>
                  <td class="col-actions">
                    <div class="action-buttons">
                      <a 
                        [routerLink]="['/imaging', order.orderId]" 
                        class="btn btn-sm btn-outline"
                        title="View Details">
                        View
                      </a>
                      @if (order.status === 'final' || order.status === 'preliminary') {
                        <button 
                          class="btn btn-sm btn-outline"
                          (click)="viewReport(order)"
                          title="View Report">
                          📄
                        </button>
                      }
                      @if (order.studies && order.studies.length > 0) {
                        <button 
                          class="btn btn-sm btn-outline"
                          (click)="openPacsViewer(order)"
                          title="Open PACS Viewer">
                          🖼️
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="pagination">
              <button 
                class="btn btn-sm"
                [disabled]="currentPage() === 1"
                (click)="goToPage(currentPage() - 1)">
                Previous
              </button>
              <span class="page-info">
                Page {{ currentPage() }} of {{ totalPages() }}
                ({{ totalOrders() }} orders)
              </span>
              <button 
                class="btn btn-sm"
                [disabled]="currentPage() === totalPages()"
                (click)="goToPage(currentPage() + 1)">
                Next
              </button>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .imaging-list {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .header-content h1 {
      margin: 0 0 0.25rem 0;
      font-size: 1.75rem;
      color: #1e293b;
    }

    .subtitle {
      margin: 0;
      color: #64748b;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      border: none;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .btn-outline {
      background: white;
      border: 1px solid #e2e8f0;
      color: #475569;
    }

    .btn-outline:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
    }

    .btn-danger {
      background: #ef4444;
      color: white;
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
    }

    .btn-icon {
      font-size: 1.125rem;
      font-weight: 600;
    }

    /* Critical Alert */
    .critical-alert {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
      background: linear-gradient(135deg, #fef2f2, #fee2e2);
      border: 1px solid #fecaca;
      border-radius: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .alert-icon {
      font-size: 1.5rem;
    }

    .alert-content {
      flex: 1;
    }

    .alert-content strong {
      color: #991b1b;
    }

    .alert-content p {
      margin: 0.25rem 0 0 0;
      color: #b91c1c;
      font-size: 0.875rem;
    }

    /* Stats Row */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 1rem 1.25rem;
      text-align: center;
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 600;
      color: #1e293b;
    }

    .stat-label {
      font-size: 0.8125rem;
      color: #64748b;
      margin-top: 0.25rem;
    }

    .stat-card.pending .stat-value { color: #f59e0b; }
    .stat-card.scheduled .stat-value { color: #3b82f6; }
    .stat-card.completed .stat-value { color: #10b981; }

    /* Modality Tabs */
    .modality-tabs {
      display: flex;
      gap: 0.5rem;
      padding: 0.5rem;
      background: #f8fafc;
      border-radius: 0.75rem;
      margin-bottom: 1rem;
      overflow-x: auto;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: transparent;
      border: none;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      color: #64748b;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;
    }

    .tab-btn:hover {
      background: white;
      color: #1e293b;
    }

    .tab-btn.active {
      background: white;
      color: #3b82f6;
      font-weight: 500;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .tab-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 1.25rem;
      height: 1.25rem;
      padding: 0 0.375rem;
      background: #e2e8f0;
      border-radius: 0.625rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .tab-btn.active .tab-count {
      background: #dbeafe;
      color: #3b82f6;
    }

    /* Filters */
    .filters-bar {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
      margin-bottom: 1.5rem;
    }

    .search-box {
      flex: 1;
      min-width: 250px;
      position: relative;
    }

    .search-icon {
      position: absolute;
      left: 0.875rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.875rem;
      color: #94a3b8;
    }

    .search-box input {
      width: 100%;
      padding: 0.625rem 1rem 0.625rem 2.5rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.875rem;
    }

    .search-box input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .filter-group select,
    .filter-group input[type="date"] {
      padding: 0.625rem 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      background: white;
    }

    /* Table */
    .orders-table-container {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      overflow: hidden;
    }

    .orders-table {
      width: 100%;
      border-collapse: collapse;
    }

    .orders-table th {
      padding: 0.875rem 1rem;
      text-align: left;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }

    .orders-table td {
      padding: 0.875rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }

    .orders-table tr:last-child td {
      border-bottom: none;
    }

    .orders-table tr:hover {
      background: #f8fafc;
    }

    .orders-table tr.critical {
      background: #fef2f2;
    }

    .orders-table tr.critical:hover {
      background: #fee2e2;
    }

    .orders-table tr.stat {
      border-left: 3px solid #ef4444;
    }

    /* Status Badge */
    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.625rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-draft { background: #f1f5f9; color: #64748b; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-scheduled { background: #dbeafe; color: #1e40af; }
    .status-in-progress { background: #e0e7ff; color: #4338ca; }
    .status-completed { background: #d1fae5; color: #065f46; }
    .status-preliminary { background: #fae8ff; color: #86198f; }
    .status-final { background: #dcfce7; color: #166534; }
    .status-addendum { background: #fef3c7; color: #92400e; }
    .status-cancelled { background: #fee2e2; color: #991b1b; }

    .critical-badge {
      margin-left: 0.5rem;
      cursor: help;
    }

    /* Modality Badge */
    .modality-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
      background: #e2e8f0;
      color: #475569;
    }

    .modality-ct { background: #dbeafe; color: #1e40af; }
    .modality-mri { background: #e0e7ff; color: #4338ca; }
    .modality-xray { background: #d1fae5; color: #065f46; }
    .modality-ultrasound { background: #fef3c7; color: #92400e; }
    .modality-mammography { background: #fce7f3; color: #9d174d; }
    .modality-nuclear { background: #fae8ff; color: #86198f; }
    .modality-pet { background: #fee2e2; color: #991b1b; }

    /* Priority Badge */
    .priority-badge {
      display: inline-block;
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      font-size: 0.6875rem;
      font-weight: 500;
    }

    .priority-routine { background: #f1f5f9; color: #64748b; }
    .priority-urgent { background: #fef3c7; color: #92400e; }
    .priority-asap { background: #fee2e2; color: #b91c1c; }
    .priority-stat { background: #ef4444; color: white; }

    /* Links */
    .order-link {
      color: #3b82f6;
      text-decoration: none;
      font-weight: 500;
    }

    .order-link:hover {
      text-decoration: underline;
    }

    .accession {
      font-size: 0.75rem;
      color: #94a3b8;
      margin-top: 0.125rem;
    }

    .patient-link {
      color: #1e293b;
      text-decoration: none;
    }

    .patient-link:hover {
      color: #3b82f6;
    }

    .procedure-name {
      font-weight: 500;
      color: #1e293b;
    }

    .body-region {
      font-size: 0.75rem;
      color: #64748b;
    }

    .date-display {
      font-size: 0.875rem;
      color: #1e293b;
    }

    /* Actions */
    .action-buttons {
      display: flex;
      gap: 0.5rem;
    }

    /* Loading & Empty States */
    .loading-state,
    .empty-state {
      padding: 4rem 2rem;
      text-align: center;
    }

    .spinner {
      width: 2.5rem;
      height: 2.5rem;
      border: 3px solid #e2e8f0;
      border-top-color: #3b82f6;
      border-radius: 50%;
      margin: 0 auto 1rem;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      margin: 0 0 0.5rem 0;
      color: #1e293b;
    }

    .empty-state p {
      margin: 0 0 1.5rem 0;
      color: #64748b;
    }

    /* Pagination */
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 1rem;
      border-top: 1px solid #e2e8f0;
    }

    .page-info {
      color: #64748b;
      font-size: 0.875rem;
    }

    @media (max-width: 1024px) {
      .stats-row {
        grid-template-columns: repeat(2, 1fr);
      }

      .filters-bar {
        flex-direction: column;
        align-items: stretch;
      }

      .search-box {
        min-width: auto;
      }
    }

    @media (max-width: 768px) {
      .imaging-list {
        padding: 1rem;
      }

      .page-header {
        flex-direction: column;
        gap: 1rem;
      }

      .orders-table-container {
        overflow-x: auto;
      }

      .orders-table {
        min-width: 800px;
      }
    }
  `]
})
export class ImagingListComponent implements OnInit {
  private readonly imagingService = inject(ImagingService);

  // State
  orders = signal<ImagingOrder[]>([]);
  loading = signal(false);
  totalOrders = signal(0);
  currentPage = signal(1);
  pageSize = signal(20);

  // Filters
  searchTerm = signal('');
  selectedModality = signal<ImagingModality | null>(null);
  selectedStatus = signal<ImagingOrderStatus | ''>('');
  selectedPriority = signal<ImagingPriority | ''>('');
  dateFrom = signal('');
  dateTo = signal('');

  // Reference data
  modalities = Object.values(ImagingModality);
  statuses = Object.values(ImagingOrderStatus);
  priorities = Object.values(ImagingPriority);

  // Computed
  totalPages = computed(() => Math.ceil(this.totalOrders() / this.pageSize()));
  
  criticalFindingsCount = computed(() => 
    this.orders().filter(o => o.report?.hasCriticalFindings && !o.report?.criticalFindingCommunicated).length
  );

  hasActiveFilters = computed(() => 
    this.searchTerm() !== '' ||
    this.selectedModality() !== null ||
    this.selectedStatus() !== '' ||
    this.selectedPriority() !== '' ||
    this.dateFrom() !== '' ||
    this.dateTo() !== ''
  );

  stats = computed(() => {
    const all = this.orders();
    return {
      total: this.totalOrders(),
      pending: all.filter(o => o.status === ImagingOrderStatus.Pending).length,
      scheduled: all.filter(o => o.status === ImagingOrderStatus.Scheduled).length,
      completed: all.filter(o => 
        o.status === ImagingOrderStatus.Final ||
        o.status === ImagingOrderStatus.Preliminary ||
        o.status === ImagingOrderStatus.Completed
      ).length
    };
  });

  private modalityCounts: Record<string, number> = {};

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);

    const params: ImagingSearchParams = {
      page: this.currentPage(),
      pageSize: this.pageSize(),
      sortBy: 'orderedDate',
      sortDirection: 'desc'
    };

    if (this.searchTerm()) params.searchTerm = this.searchTerm();
    if (this.selectedModality()) params.modality = this.selectedModality()!;
    if (this.selectedStatus()) params.status = this.selectedStatus() as ImagingOrderStatus;
    if (this.selectedPriority()) params.priority = this.selectedPriority() as ImagingPriority;
    if (this.dateFrom()) params.dateFrom = this.dateFrom();
    if (this.dateTo()) params.dateTo = this.dateTo();

    this.imagingService.getOrders(params).subscribe({
      next: (result) => {
        this.orders.set(result.orders);
        this.totalOrders.set(result.total);
        this.updateModalityCounts();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading imaging orders:', err);
        this.loading.set(false);
      }
    });
  }

  private updateModalityCounts(): void {
    this.modalityCounts = {};
    this.orders().forEach(order => {
      this.modalityCounts[order.modality] = (this.modalityCounts[order.modality] || 0) + 1;
    });
  }

  search(): void {
    this.currentPage.set(1);
    this.loadOrders();
  }

  selectModality(modality: ImagingModality | null): void {
    this.selectedModality.set(modality);
    this.search();
  }

  filterCritical(): void {
    // Filter to show only critical findings
    this.clearFilters();
    // Note: Would need to add hasCriticalFindings to search params
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedModality.set(null);
    this.selectedStatus.set('');
    this.selectedPriority.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.search();
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadOrders();
  }

  getModalityLabel(modality: ImagingModality): string {
    return MODALITY_LABELS[modality] || modality;
  }

  getStatusLabel(status: ImagingOrderStatus): string {
    return STATUS_LABELS[status] || status;
  }

  getPriorityLabel(priority: ImagingPriority): string {
    return PRIORITY_LABELS[priority] || priority;
  }

  getBodyRegionLabel(region: string): string {
    return BODY_REGION_LABELS[region as keyof typeof BODY_REGION_LABELS] || region;
  }

  getModalityCount(modality: ImagingModality): number {
    return this.modalityCounts[modality] || 0;
  }

  getRelevantDate(order: ImagingOrder): string {
    if (order.reportedDate) return order.reportedDate;
    if (order.performedDate) return order.performedDate;
    if (order.scheduledDate) return order.scheduledDate;
    return order.orderedDate;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  viewReport(order: ImagingOrder): void {
    // Navigate to order detail with report focus
    console.log('View report:', order.orderId);
  }

  openPacsViewer(order: ImagingOrder): void {
    if (order.studies?.[0]?.viewerUrl) {
      window.open(order.studies[0].viewerUrl, '_blank');
    } else {
      this.imagingService.getPacsViewerUrl(order.orderId).subscribe(url => {
        window.open(url, '_blank');
      });
    }
  }
}
