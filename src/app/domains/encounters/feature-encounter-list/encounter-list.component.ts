import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { Menu } from 'primeng/menu';
import { Tag } from 'primeng/tag';
import { Chip } from 'primeng/chip';
import { Paginator } from 'primeng/paginator';
import { Tooltip } from 'primeng/tooltip';
import { Divider } from 'primeng/divider';
import { Skeleton } from 'primeng/skeleton';
import { Avatar } from 'primeng/avatar';
import { Ripple } from 'primeng/ripple';
import { MenuItem } from 'primeng/api';

import { EncounterService } from '../data-access/services/encounter.service';
import { ThemeService } from '../../../core/services/theme.service';
import {
  Encounter,
  EncounterStatus,
  EncounterClass,
  ENCOUNTER_STATUS_CONFIG,
  ENCOUNTER_CLASS_CONFIG
} from '../data-access/models/encounter.model';

interface FilterOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-encounter-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    // PrimeNG
    Card,
    Button,
    InputText,
    IconField,
    InputIcon,
    Select,
    DatePicker,
    Menu,
    Tag,
    Chip,
    Paginator,
    Tooltip,
    Divider,
    Skeleton,
    Avatar,
    Ripple,
  ],
  template: `
    <div class="encounter-list" [class.dark]="themeService.isDarkMode()">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="title-section">
            <h1>
              <i class="pi pi-file-edit"></i>
              Encounters
            </h1>
            <p class="subtitle">Clinical visits and documentation</p>
          </div>
          <div class="header-actions">
            <p-button
              icon="pi pi-download"
              label="Export"
              [outlined]="true"
              severity="secondary"
              (onClick)="exportMenu.toggle($event)"
            />
            <p-menu #exportMenu [model]="exportMenuItems" [popup]="true" />
            <p-button
              icon="pi pi-plus"
              label="New Encounter"
              routerLink="/encounters/new"
            />
          </div>
        </div>
      </header>

      <!-- Filters -->
      <section class="filters-section">
        <p-card styleClass="filters-card">
          <div class="filters-row">
            <!-- Search -->
            <p-iconfield class="search-field">
              <p-inputicon styleClass="pi pi-search" />
              <input
                pInputText
                [(ngModel)]="searchQuery"
                (ngModelChange)="onSearchChange($event)"
                placeholder="Search patient, diagnosis..."
                class="search-input"
              />
              @if (searchQuery) {
                <p-button
                  icon="pi pi-times"
                  [rounded]="true"
                  [text]="true"
                  severity="secondary"
                  (onClick)="clearSearch()"
                  class="clear-btn"
                />
              }
            </p-iconfield>

            <!-- Status Filter -->
            <p-select
              [(ngModel)]="selectedStatus"
              [options]="statusOptions"
              (ngModelChange)="onFilterChange()"
              placeholder="All Statuses"
              [showClear]="true"
              class="filter-select"
            />

            <!-- Type Filter -->
            <p-select
              [(ngModel)]="selectedClass"
              [options]="classOptions"
              (ngModelChange)="onFilterChange()"
              placeholder="All Types"
              [showClear]="true"
              class="filter-select"
            />

            <!-- Date Range -->
            <p-datepicker
              [(ngModel)]="dateRange"
              selectionMode="range"
              [showIcon]="true"
              [showButtonBar]="true"
              placeholder="Date Range"
              (ngModelChange)="onFilterChange()"
              dateFormat="mm/dd/yy"
              class="date-picker"
            />

            @if (hasActiveFilters()) {
              <p-button
                icon="pi pi-filter-slash"
                label="Clear"
                [text]="true"
                (onClick)="clearFilters()"
              />
            }
          </div>
        </p-card>
      </section>

      <!-- Results -->
      <section class="results-section">
        @if (loading()) {
          <!-- Loading State -->
          <div class="loading-state">
            @for (i of [1,2,3,4,5]; track i) {
              <div class="skeleton-card">
                <div class="skeleton-header">
                  <p-skeleton shape="circle" size="48px" />
                  <div class="skeleton-text">
                    <p-skeleton width="200px" height="20px" />
                    <p-skeleton width="150px" height="14px" />
                  </div>
                </div>
                <p-skeleton width="100%" height="60px" />
              </div>
            }
          </div>
        } @else if (encounters().length === 0) {
          <!-- Empty State -->
          <div class="empty-state">
            <i class="pi pi-file-edit empty-icon"></i>
            <h3>No encounters found</h3>
            <p>{{ hasActiveFilters() ? 'Try adjusting your filters' : 'Start documenting by creating a new encounter' }}</p>
            @if (hasActiveFilters()) {
              <p-button label="Clear Filters" [outlined]="true" (onClick)="clearFilters()" />
            } @else {
              <p-button label="New Encounter" icon="pi pi-plus" routerLink="/encounters/new" />
            }
          </div>
        } @else {
          <!-- Encounter Cards -->
          <div class="encounters-grid">
            @for (encounter of encounters(); track encounter.id) {
              <div
                class="encounter-card"
                [routerLink]="['/encounters', encounter.id]"
                pRipple>
                <!-- Card Header -->
                <div class="card-header">
                  <div class="patient-info">
                    <p-avatar
                      [label]="getInitials(encounter.patient.name)"
                      [image]="encounter.patient.photo || ''"
                      [style]="{ 'background-color': getAvatarColor(encounter.id), 'color': 'white' }"
                      size="large"
                      shape="circle"
                    />
                    <div class="patient-details">
                      <h3>{{ encounter.patient.name }}</h3>
                      <span class="patient-meta">
                        MRN: {{ encounter.patient.mrn }} • DOB: {{ encounter.patient.dob | date:'MM/dd/yyyy' }}
                      </span>
                    </div>
                  </div>
                  <div class="badges">
                    <p-tag
                      [value]="getStatusConfig(encounter.status).label"
                      [severity]="getStatusSeverity(encounter.status)"
                      [rounded]="true"
                    />
                    <p-chip
                      [label]="getClassConfig(encounter.class).label"
                      [icon]="'pi ' + getClassIcon(encounter.class)"
                      styleClass="class-chip"
                    />
                  </div>
                </div>

                <!-- Card Body -->
                <div class="card-body">
                  <div class="info-row">
                    <span class="info-item">
                      <i class="pi pi-calendar"></i>
                      {{ encounter.startTime | date:'MMM d, yyyy' }} at {{ encounter.startTime | date:'h:mm a' }}
                    </span>
                    <span class="info-item">
                      <i class="pi pi-user"></i>
                      {{ encounter.provider.name }}
                    </span>
                    @if (encounter.facilityName) {
                      <span class="info-item">
                        <i class="pi pi-map-marker"></i>
                        {{ encounter.facilityName }}
                      </span>
                    }
                    @if (encounter.duration) {
                      <span class="info-item">
                        <i class="pi pi-clock"></i>
                        {{ encounter.duration }} min
                      </span>
                    }
                  </div>

                  @if (encounter.subjective?.chiefComplaint) {
                    <div class="chief-complaint">
                      <strong>Chief Complaint:</strong> {{ encounter.subjective?.chiefComplaint }}
                    </div>
                  }

                  @if (encounter.assessment?.diagnoses?.length) {
                    <div class="diagnoses">
                      <strong>Diagnoses:</strong>
                      <div class="diagnosis-chips">
                        @for (dx of encounter.assessment!.diagnoses!.slice(0, 3); track dx.id) {
                          <p-chip
                            [label]="dx.description"
                            [pTooltip]="dx.code"
                            tooltipPosition="top"
                            styleClass="diagnosis-chip"
                          />
                        }
                        @if (encounter.assessment!.diagnoses!.length > 3) {
                          <p-chip
                            [label]="'+' + (encounter.assessment!.diagnoses!.length - 3) + ' more'"
                            styleClass="more-chip"
                          />
                        }
                      </div>
                    </div>
                  }
                </div>

                <!-- Card Footer -->
                <div class="card-footer">
                  <div class="footer-meta">
                    @if (encounter.signedAt) {
                      <span class="signed-badge">
                        <i class="pi pi-verified"></i>
                        Signed {{ encounter.signedAt | date:'MMM d' }}
                      </span>
                    } @else {
                      <span class="unsigned-badge">
                        <i class="pi pi-exclamation-circle"></i>
                        Unsigned
                      </span>
                    }
                  </div>
                  <p-button
                    icon="pi pi-arrow-right"
                    [rounded]="true"
                    [text]="true"
                    severity="secondary"
                  />
                </div>
              </div>
            }
          </div>

          <!-- Pagination -->
          <p-paginator
            [rows]="pageSize"
            [totalRecords]="totalCount()"
            [rowsPerPageOptions]="[10, 20, 50]"
            (onPageChange)="onPageChange($event)"
            [first]="pageIndex * pageSize"
            styleClass="paginator"
          />
        }
      </section>
    </div>
  `,
  styles: [`
    .encounter-list {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Header */
    .page-header {
      margin-bottom: 1.5rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .title-section h1 {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 1.75rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }

    .dark .title-section h1 {
      color: #f1f5f9;
    }

    .title-section h1 i {
      font-size: 1.5rem;
      color: #3b82f6;
    }

    .subtitle {
      color: #64748b;
      margin: 0.25rem 0 0;
    }

    .dark .subtitle {
      color: #94a3b8;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    /* Filters */
    .filters-section {
      margin-bottom: 1.5rem;
    }

    :host ::ng-deep .filters-card {
      border-radius: 1rem;
    }

    :host ::ng-deep .filters-card .p-card-body {
      padding: 1rem 1.25rem;
    }

    .dark :host ::ng-deep .filters-card {
      background: #1e293b;
      border-color: #334155;
    }

    .filters-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .search-field {
      flex: 1;
      min-width: 250px;
      position: relative;
    }

    .search-input {
      width: 100%;
      padding-right: 2.5rem;
    }

    .clear-btn {
      position: absolute;
      right: 0.5rem;
      top: 50%;
      transform: translateY(-50%);
    }

    .filter-select {
      min-width: 160px;
    }

    .date-picker {
      min-width: 200px;
    }

    /* Loading State */
    .loading-state {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .skeleton-card {
      background: white;
      border-radius: 1rem;
      padding: 1.25rem;
      border: 1px solid #e2e8f0;
    }

    .dark .skeleton-card {
      background: #1e293b;
      border-color: #334155;
    }

    .skeleton-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .skeleton-text {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
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

    .empty-icon {
      font-size: 4rem;
      color: #cbd5e1;
      margin-bottom: 1rem;
    }

    .dark .empty-icon {
      color: #475569;
    }

    .empty-state h3 {
      color: #1e293b;
      margin: 0 0 0.5rem;
    }

    .dark .empty-state h3 {
      color: #f1f5f9;
    }

    .empty-state p {
      color: #64748b;
      margin: 0 0 1.5rem;
    }

    /* Encounter Cards */
    .encounters-grid {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .encounter-card {
      background: white;
      border-radius: 1rem;
      border: 1px solid #e2e8f0;
      padding: 1.25rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .dark .encounter-card {
      background: #1e293b;
      border-color: #334155;
    }

    .encounter-card:hover {
      border-color: #3b82f6;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
      transform: translateY(-2px);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
      gap: 1rem;
    }

    .patient-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .patient-details h3 {
      margin: 0 0 0.25rem;
      font-size: 1.0625rem;
      font-weight: 600;
      color: #1e293b;
    }

    .dark .patient-details h3 {
      color: #f1f5f9;
    }

    .patient-meta {
      font-size: 0.8125rem;
      color: #64748b;
    }

    .dark .patient-meta {
      color: #94a3b8;
    }

    .badges {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    :host ::ng-deep .class-chip {
      background: #f1f5f9;
      font-size: 0.75rem;
    }

    .dark :host ::ng-deep .class-chip {
      background: #334155;
      color: #e2e8f0;
    }

    .card-body {
      margin-bottom: 1rem;
    }

    .info-row {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 0.75rem;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.875rem;
      color: #64748b;
    }

    .dark .info-item {
      color: #94a3b8;
    }

    .info-item i {
      font-size: 0.875rem;
    }

    .chief-complaint {
      font-size: 0.875rem;
      color: #374151;
      margin-bottom: 0.75rem;
      line-height: 1.5;
    }

    .dark .chief-complaint {
      color: #e2e8f0;
    }

    .diagnoses {
      font-size: 0.875rem;
      color: #374151;
    }

    .dark .diagnoses {
      color: #e2e8f0;
    }

    .diagnoses strong {
      display: block;
      margin-bottom: 0.5rem;
    }

    .diagnosis-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    :host ::ng-deep .diagnosis-chip {
      font-size: 0.75rem;
      background: #dbeafe;
      color: #1e40af;
    }

    .dark :host ::ng-deep .diagnosis-chip {
      background: #1e3a8a;
      color: #93c5fd;
    }

    :host ::ng-deep .more-chip {
      font-size: 0.75rem;
      background: #f1f5f9;
      color: #64748b;
    }

    .dark :host ::ng-deep .more-chip {
      background: #334155;
      color: #94a3b8;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 0.75rem;
      border-top: 1px solid #e2e8f0;
    }

    .dark .card-footer {
      border-top-color: #334155;
    }

    .signed-badge {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.8125rem;
      color: #10b981;
    }

    .unsigned-badge {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.8125rem;
      color: #f59e0b;
    }

    /* Pagination */
    :host ::ng-deep .paginator {
      margin-top: 1.5rem;
      background: transparent;
      border: none;
    }

    .dark :host ::ng-deep .paginator .p-paginator {
      background: transparent;
    }

    /* Dark mode inputs */
    .dark :host ::ng-deep .p-inputtext {
      background: #334155;
      border-color: #475569;
      color: #f1f5f9;
    }

    .dark :host ::ng-deep .p-select {
      background: #334155;
      border-color: #475569;
    }

    .dark :host ::ng-deep .p-select-label {
      color: #f1f5f9;
    }

    .dark :host ::ng-deep .p-datepicker-input {
      background: #334155;
      border-color: #475569;
      color: #f1f5f9;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .filters-row {
        flex-direction: column;
        align-items: stretch;
      }

      .search-field,
      .filter-select,
      .date-picker {
        width: 100%;
        min-width: unset;
      }
    }

    @media (max-width: 768px) {
      .encounter-list {
        padding: 1rem;
      }

      .header-content {
        flex-direction: column;
        align-items: stretch;
      }

      .header-actions {
        justify-content: flex-end;
      }

      .card-header {
        flex-direction: column;
      }

      .badges {
        width: 100%;
      }

      .info-row {
        flex-direction: column;
        gap: 0.5rem;
      }
    }
  `]
})
export class EncounterListComponent implements OnInit {
  private readonly encounterService = inject(EncounterService);
  private readonly router = inject(Router);
  readonly themeService = inject(ThemeService);

  // State
  encounters = signal<Encounter[]>([]);
  totalCount = signal(0);
  loading = signal(false);

  // Filters
  searchQuery = '';
  selectedStatus: string | null = null;
  selectedClass: string | null = null;
  dateRange: Date[] | null = null;

  // Pagination
  pageIndex = 0;
  pageSize = 20;

  // Options
  statusOptions: FilterOption[] = Object.entries(ENCOUNTER_STATUS_CONFIG).map(([value, config]) => ({
    value,
    label: config.label,
  }));

  classOptions: FilterOption[] = Object.entries(ENCOUNTER_CLASS_CONFIG).map(([value, config]) => ({
    value,
    label: config.label,
  }));

  exportMenuItems: MenuItem[] = [
    { label: 'Export to CSV', icon: 'pi pi-file' },
    { label: 'Export to PDF', icon: 'pi pi-file-pdf' },
  ];

  private searchTimeout: any;
  private avatarColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  ngOnInit(): void {
    this.loadEncounters();
  }

  loadEncounters(): void {
    this.loading.set(true);

    this.encounterService.searchEncounters({
      search: this.searchQuery || undefined,
      status: this.selectedStatus ? [this.selectedStatus as EncounterStatus] : undefined,
      class: this.selectedClass ? [this.selectedClass as EncounterClass] : undefined,
      startDate: this.dateRange?.[0] || undefined,
      endDate: this.dateRange?.[1] || undefined,
      page: this.pageIndex,
      limit: this.pageSize,
      sortBy: 'startTime',
      sortOrder: 'desc',
    }).subscribe({
      next: (result) => {
        this.encounters.set(result.data);
        this.totalCount.set(result.total);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  onSearchChange(query: string): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.pageIndex = 0;
      this.loadEncounters();
    }, 400);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.pageIndex = 0;
    this.loadEncounters();
  }

  onFilterChange(): void {
    this.pageIndex = 0;
    this.loadEncounters();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedStatus = null;
    this.selectedClass = null;
    this.dateRange = null;
    this.pageIndex = 0;
    this.loadEncounters();
  }

  hasActiveFilters(): boolean {
    return !!(
      this.searchQuery ||
      this.selectedStatus ||
      this.selectedClass ||
      this.dateRange
    );
  }

  onPageChange(event: any): void {
    this.pageIndex = event.page;
    this.pageSize = event.rows;
    this.loadEncounters();
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getAvatarColor(id: string): string {
    const index = id.charCodeAt(0) % this.avatarColors.length;
    return this.avatarColors[index];
  }

  getStatusConfig(status: EncounterStatus) {
    return ENCOUNTER_STATUS_CONFIG[status];
  }

  getClassConfig(cls: EncounterClass) {
    return ENCOUNTER_CLASS_CONFIG[cls];
  }

  getStatusSeverity(status: EncounterStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      'finished': 'success',
      'in-progress': 'info',
      'arrived': 'info',
      'triaged': 'info',
      'planned': 'secondary',
      'onleave': 'warn',
      'cancelled': 'danger',
    };
    return map[status] || 'secondary';
  }

  getClassIcon(cls: EncounterClass): string {
    const icons: Record<string, string> = {
      'ambulatory': 'pi-briefcase',
      'emergency': 'pi-exclamation-triangle',
      'inpatient': 'pi-building',
      'observation': 'pi-eye',
      'virtual': 'pi-video',
      'home': 'pi-home',
    };
    return icons[cls] || 'pi-file-edit';
  }
}
