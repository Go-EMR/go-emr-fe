import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { StatusBadgeComponent, getStatusVariant } from '../../../shared/ui/status-badge/status-badge.component';
import { AvatarComponent } from '../../../shared/ui/avatar/avatar.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent, SkeletonListComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { EncounterService } from '../data-access/services/encounter.service';
import { 
  Encounter, 
  EncounterStatus, 
  EncounterClass,
  ENCOUNTER_STATUS_CONFIG,
  ENCOUNTER_CLASS_CONFIG 
} from '../data-access/models/encounter.model';

@Component({
  selector: 'app-encounter-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatMenuModule,
    MatChipsModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatDividerModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    AvatarComponent,
    EmptyStateComponent,
    SkeletonComponent,
    SkeletonListComponent,
  ],
  template: `
    <div class="encounter-list-container">
      <app-page-header
        title="Encounters"
        subtitle="Clinical visits and documentation"
        icon="description"
        [breadcrumbs]="[
          { label: 'Home', route: '/' },
          { label: 'Encounters' }
        ]"
      >
        <div class="header-actions" actions>
          <button mat-stroked-button [matMenuTriggerFor]="exportMenu">
            <mat-icon>download</mat-icon>
            Export
          </button>
          <mat-menu #exportMenu="matMenu">
            <button mat-menu-item>
              <mat-icon>table_chart</mat-icon>
              Export to CSV
            </button>
            <button mat-menu-item>
              <mat-icon>picture_as_pdf</mat-icon>
              Export to PDF
            </button>
          </mat-menu>

          <button mat-flat-button color="primary" routerLink="/encounters/new">
            <mat-icon>add</mat-icon>
            New Encounter
          </button>
        </div>
      </app-page-header>

      <!-- Filters -->
      <mat-card class="filters-card">
        <mat-card-content>
          <div class="filters-row">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search encounters</mat-label>
              <mat-icon matPrefix>search</mat-icon>
              <input 
                matInput 
                [(ngModel)]="searchQuery"
                (ngModelChange)="onSearchChange($event)"
                placeholder="Patient name, diagnosis..."
              >
              @if (searchQuery) {
                <button matSuffix mat-icon-button (click)="clearSearch()">
                  <mat-icon>close</mat-icon>
                </button>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Status</mat-label>
              <mat-select [(ngModel)]="selectedStatus" (ngModelChange)="onFilterChange()">
                <mat-option value="">All Statuses</mat-option>
                @for (status of statusOptions; track status.value) {
                  <mat-option [value]="status.value">{{ status.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Type</mat-label>
              <mat-select [(ngModel)]="selectedClass" (ngModelChange)="onFilterChange()">
                <mat-option value="">All Types</mat-option>
                @for (cls of classOptions; track cls.value) {
                  <mat-option [value]="cls.value">{{ cls.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Date Range</mat-label>
              <mat-date-range-input [rangePicker]="picker">
                <input matStartDate [(ngModel)]="startDate" placeholder="Start">
                <input matEndDate [(ngModel)]="endDate" (ngModelChange)="onFilterChange()">
              </mat-date-range-input>
              <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-date-range-picker #picker></mat-date-range-picker>
            </mat-form-field>

            @if (hasActiveFilters()) {
              <button mat-button color="primary" (click)="clearFilters()">
                <mat-icon>clear_all</mat-icon>
                Clear Filters
              </button>
            }
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Results -->
      <div class="results-section">
        @if (loading()) {
          <app-skeleton-list [count]="5" type="card" [columns]="[{ flex: 1 }]"></app-skeleton-list>
        } @else if (encounters().length === 0) {
          <app-empty-state
            icon="description"
            title="No encounters found"
            [description]="hasActiveFilters() 
              ? 'Try adjusting your filters to see more results' 
              : 'Start documenting patient visits by creating a new encounter'"
            [actionLabel]="hasActiveFilters() ? 'Clear Filters' : 'New Encounter'"
            [actionRoute]="hasActiveFilters() ? '' : '/encounters/new'"
            (actionClick)="hasActiveFilters() ? clearFilters() : null"
          ></app-empty-state>
        } @else {
          <div class="encounters-list">
            @for (encounter of encounters(); track encounter.id) {
              <mat-card class="encounter-card" [routerLink]="['/encounters', encounter.id]">
                <mat-card-content>
                  <div class="encounter-header">
                    <div class="patient-info">
                      <app-avatar
                        [name]="encounter.patient.name"
                        [imageUrl]="encounter.patient.photo ?? ''"
                        size="md"
                      ></app-avatar>
                      <div class="patient-details">
                        <h3 class="patient-name">{{ encounter.patient.name }}</h3>
                        <span class="patient-meta">
                          MRN: {{ encounter.patient.mrn }} • DOB: {{ encounter.patient.dob | date:'MM/dd/yyyy' }}
                        </span>
                      </div>
                    </div>

                    <div class="encounter-badges">
                      <app-status-badge
                        [label]="getStatusConfig(encounter.status).label"
                        [variant]="getStatusVariant(encounter.status)"
                        [icon]="getStatusConfig(encounter.status).icon"
                        size="small"
                      ></app-status-badge>
                      <mat-chip class="class-chip">
                        <mat-icon>{{ getClassConfig(encounter.class).icon }}</mat-icon>
                        {{ getClassConfig(encounter.class).label }}
                      </mat-chip>
                    </div>
                  </div>

                  <div class="encounter-body">
                    <div class="encounter-info">
                      <div class="info-item">
                        <mat-icon>event</mat-icon>
                        <span>{{ encounter.startTime | date:'MMM d, yyyy' }} at {{ encounter.startTime | date:'h:mm a' }}</span>
                      </div>
                      <div class="info-item">
                        <mat-icon>person</mat-icon>
                        <span>{{ encounter.provider.name }}</span>
                      </div>
                      @if (encounter.facilityName) {
                        <div class="info-item">
                          <mat-icon>location_on</mat-icon>
                          <span>{{ encounter.facilityName }}</span>
                        </div>
                      }
                      @if (encounter.duration) {
                        <div class="info-item">
                          <mat-icon>schedule</mat-icon>
                          <span>{{ encounter.duration }} minutes</span>
                        </div>
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
                          @for (dx of encounter.assessment?.diagnoses?.slice(0, 3) ?? []; track dx.id) {
                            <mat-chip [matTooltip]="dx.code">{{ dx.description }}</mat-chip>
                          }
                          @if ((encounter.assessment?.diagnoses?.length ?? 0) > 3) {
                            <mat-chip class="more-chip">
                              +{{ (encounter.assessment?.diagnoses?.length ?? 0) - 3 }} more
                            </mat-chip>
                          }
                        </div>
                      </div>
                    }
                  </div>

                  <div class="encounter-footer">
                    <div class="footer-meta">
                      @if (encounter.signedAt) {
                        <span class="signed-badge">
                          <mat-icon>verified</mat-icon>
                          Signed {{ encounter.signedAt | date:'M/d/yy h:mm a' }}
                        </span>
                      } @else {
                        <span class="unsigned-badge">
                          <mat-icon>edit_note</mat-icon>
                          Unsigned
                        </span>
                      }
                    </div>

                    <button 
                      mat-icon-button 
                      [matMenuTriggerFor]="encounterMenu"
                      (click)="$event.stopPropagation()"
                    >
                      <mat-icon>more_vert</mat-icon>
                    </button>

                    <mat-menu #encounterMenu="matMenu">
                      <button mat-menu-item [routerLink]="['/encounters', encounter.id]">
                        <mat-icon>visibility</mat-icon>
                        <span>View Details</span>
                      </button>
                      @if (!encounter.signedAt) {
                        <button mat-menu-item [routerLink]="['/encounters', encounter.id, 'edit']">
                          <mat-icon>edit</mat-icon>
                          <span>Edit</span>
                        </button>
                      }
                      <button mat-menu-item [routerLink]="['/patients', encounter.patient.id]">
                        <mat-icon>person</mat-icon>
                        <span>View Patient</span>
                      </button>
                      <mat-divider></mat-divider>
                      <button mat-menu-item>
                        <mat-icon>print</mat-icon>
                        <span>Print</span>
                      </button>
                      <button mat-menu-item>
                        <mat-icon>content_copy</mat-icon>
                        <span>Duplicate</span>
                      </button>
                    </mat-menu>
                  </div>
                </mat-card-content>
              </mat-card>
            }
          </div>

          <!-- Pagination -->
          <mat-paginator
            [length]="totalCount()"
            [pageSize]="pageSize"
            [pageIndex]="pageIndex"
            [pageSizeOptions]="[10, 20, 50]"
            (page)="onPageChange($event)"
            showFirstLastButtons
          ></mat-paginator>
        }
      </div>
    </div>
  `,
  styles: [`
    .encounter-list-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .filters-card {
      margin-bottom: 24px;
    }

    .filters-row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      align-items: center;
    }

    .search-field {
      flex: 1;
      min-width: 250px;
    }

    .filter-field {
      min-width: 150px;
    }

    .results-section {
      margin-top: 16px;
    }

    .encounters-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .encounter-card {
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateY(-2px);
      }
    }

    .encounter-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .patient-info {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .patient-details {
      display: flex;
      flex-direction: column;
    }

    .patient-name {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 500;
    }

    .patient-meta {
      font-size: 0.85rem;
      color: #666;
    }

    .encounter-badges {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .class-chip {
      font-size: 0.75rem;
      height: 26px !important;
      
      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        margin-right: 4px;
      }
    }

    .encounter-body {
      padding: 16px 0;
      border-top: 1px solid #eee;
      border-bottom: 1px solid #eee;
    }

    .encounter-info {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.9rem;
      color: #555;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #888;
      }
    }

    .chief-complaint {
      font-size: 0.9rem;
      color: #333;
      margin-bottom: 12px;
    }

    .diagnoses {
      font-size: 0.9rem;
      color: #333;

      strong {
        display: block;
        margin-bottom: 8px;
      }
    }

    .diagnosis-chips {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;

      mat-chip {
        font-size: 0.75rem;
        height: 24px !important;
      }

      .more-chip {
        background-color: #f0f0f0;
        color: #666;
      }
    }

    .encounter-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 16px;
    }

    .footer-meta {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .signed-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.85rem;
      color: #10b981;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }

    .unsigned-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.85rem;
      color: #f59e0b;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }

    mat-paginator {
      margin-top: 24px;
      background: transparent;
    }

    @media (max-width: 768px) {
      .encounter-list-container {
        padding: 16px;
      }

      .filters-row {
        flex-direction: column;
        
        .search-field,
        .filter-field {
          width: 100%;
          min-width: unset;
        }
      }

      .encounter-header {
        flex-direction: column;
        gap: 12px;
      }

      .encounter-badges {
        width: 100%;
      }

      .encounter-info {
        flex-direction: column;
        gap: 8px;
      }
    }
  `]
})
export class EncounterListComponent implements OnInit {
  private readonly encounterService = inject(EncounterService);
  private readonly router = inject(Router);

  // State
  encounters = signal<Encounter[]>([]);
  totalCount = signal(0);
  loading = signal(false);

  // Filters
  searchQuery = '';
  selectedStatus = '';
  selectedClass = '';
  startDate: Date | null = null;
  endDate: Date | null = null;

  // Pagination
  pageIndex = 0;
  pageSize = 20;

  // Options
  statusOptions = Object.entries(ENCOUNTER_STATUS_CONFIG).map(([value, config]) => ({
    value,
    label: config.label,
  }));

  classOptions = Object.entries(ENCOUNTER_CLASS_CONFIG).map(([value, config]) => ({
    value,
    label: config.label,
  }));

  private searchTimeout: any;

  ngOnInit(): void {
    this.loadEncounters();
  }

  loadEncounters(): void {
    this.loading.set(true);

    this.encounterService.searchEncounters({
      search: this.searchQuery || undefined,
      status: this.selectedStatus ? [this.selectedStatus as EncounterStatus] : undefined,
      class: this.selectedClass ? [this.selectedClass as EncounterClass] : undefined,
      startDate: this.startDate || undefined,
      endDate: this.endDate || undefined,
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
    }, 300);
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
    this.selectedStatus = '';
    this.selectedClass = '';
    this.startDate = null;
    this.endDate = null;
    this.pageIndex = 0;
    this.loadEncounters();
  }

  hasActiveFilters(): boolean {
    return !!(
      this.searchQuery ||
      this.selectedStatus ||
      this.selectedClass ||
      this.startDate ||
      this.endDate
    );
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadEncounters();
  }

  getStatusConfig(status: EncounterStatus) {
    return ENCOUNTER_STATUS_CONFIG[status];
  }

  getClassConfig(cls: EncounterClass) {
    return ENCOUNTER_CLASS_CONFIG[cls];
  }

  getStatusVariant(status: EncounterStatus): 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary' {
    const map: Record<string, any> = {
      'finished': 'success',
      'in-progress': 'primary',
      'arrived': 'info',
      'triaged': 'info',
      'planned': 'neutral',
      'onleave': 'warning',
      'cancelled': 'error',
    };
    return map[status] || 'neutral';
  }
}
