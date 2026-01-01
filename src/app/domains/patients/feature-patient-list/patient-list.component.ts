import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

// Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatRippleModule } from '@angular/material/core';

import { PatientService } from '../data-access/services/patient.service';
import { PatientSummary, PatientSearchParams, Patient } from '../data-access/models/patient.model';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatTooltipModule,
    MatChipsModule,
    MatBadgeModule,
    MatRippleModule,
  ],
  animations: [
    trigger('cardAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms {{ delay }}ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ], { params: { delay: 0 } })
    ])
  ],
  template: `
    <div class="patient-list-container">
      <!-- Header Section -->
      <header class="page-header">
        <div class="header-content">
          <div class="title-section">
            <h1 class="page-title">
              <mat-icon class="title-icon">people</mat-icon>
              Patient Registry
            </h1>
            <p class="page-subtitle">
              {{ totalPatients() }} patients registered
            </p>
          </div>
          
          <div class="header-actions">
            <button 
              mat-flat-button 
              color="primary" 
              routerLink="new"
              class="add-patient-btn">
              <mat-icon>person_add</mat-icon>
              New Patient
            </button>
          </div>
        </div>
      </header>

      <!-- Search & Filter Bar -->
      <section class="search-filter-section">
        <mat-card class="filter-card">
          <div class="filter-row">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search patients</mat-label>
              <mat-icon matPrefix>search</mat-icon>
              <input 
                matInput 
                [formControl]="searchControl" 
                placeholder="Name, MRN, or phone number">
              @if (searchControl.value) {
                <button 
                  matSuffix 
                  mat-icon-button 
                  (click)="clearSearch()"
                  matTooltip="Clear search">
                  <mat-icon>close</mat-icon>
                </button>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="status-filter">
              <mat-label>Status</mat-label>
              <mat-select [formControl]="statusControl">
                <mat-option value="">All Statuses</mat-option>
                <mat-option value="active">Active</mat-option>
                <mat-option value="inactive">Inactive</mat-option>
                <mat-option value="deceased">Deceased</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="sort-filter">
              <mat-label>Sort by</mat-label>
              <mat-select [formControl]="sortControl">
                <mat-option value="fullName">Name</mat-option>
                <mat-option value="lastVisit">Last Visit</mat-option>
                <mat-option value="dateOfBirth">Age</mat-option>
                <mat-option value="mrn">MRN</mat-option>
              </mat-select>
            </mat-form-field>

            <button 
              mat-icon-button 
              (click)="toggleSortOrder()"
              matTooltip="{{ sortOrder() === 'asc' ? 'Ascending' : 'Descending' }}"
              class="sort-order-btn">
              <mat-icon>{{ sortOrder() === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
            </button>

            <div class="view-toggle">
              <button 
                mat-icon-button 
                [class.active]="viewMode() === 'grid'"
                (click)="viewMode.set('grid')"
                matTooltip="Grid view">
                <mat-icon>grid_view</mat-icon>
              </button>
              <button 
                mat-icon-button 
                [class.active]="viewMode() === 'list'"
                (click)="viewMode.set('list')"
                matTooltip="List view">
                <mat-icon>view_list</mat-icon>
              </button>
            </div>
          </div>

          @if (activeFiltersCount() > 0) {
            <div class="active-filters">
              <span class="filter-label">Active filters:</span>
              @if (searchControl.value) {
                <mat-chip (removed)="clearSearch()">
                  Search: {{ searchControl.value }}
                  <mat-icon matChipRemove>cancel</mat-icon>
                </mat-chip>
              }
              @if (statusControl.value) {
                <mat-chip (removed)="statusControl.setValue('')">
                  Status: {{ statusControl.value }}
                  <mat-icon matChipRemove>cancel</mat-icon>
                </mat-chip>
              }
              <button mat-button color="warn" (click)="clearAllFilters()" class="clear-all-btn">
                Clear All
              </button>
            </div>
          }
        </mat-card>
      </section>

      <!-- Patient Grid/List -->
      <section class="patients-section">
        @if (loading()) {
          <div class="loading-state">
            <mat-spinner diameter="48"></mat-spinner>
            <p>Loading patients...</p>
          </div>
        } @else if (patients().length === 0) {
          <div class="empty-state">
            <mat-icon class="empty-icon">person_search</mat-icon>
            <h3>No patients found</h3>
            <p>Try adjusting your search criteria or add a new patient</p>
            <button mat-flat-button color="primary" routerLink="new">
              <mat-icon>person_add</mat-icon>
              Add New Patient
            </button>
          </div>
        } @else {
          @if (viewMode() === 'grid') {
            <div class="patients-grid">
              @for (patient of patients(); track patient.id; let i = $index) {
                <mat-card 
                  class="patient-card" 
                  matRipple
                  [routerLink]="[patient.id]"
                  [@cardAnimation]="{ value: 'enter', params: { delay: i * 50 } }">
                  <div class="card-header">
                    <div class="patient-avatar">
                      @if (patient.photoUrl) {
                        <img [src]="patient.photoUrl" [alt]="getPatientName(patient)" loading="lazy">
                      } @else {
                        <mat-icon>person</mat-icon>
                      }
                      <span class="status-indicator" [class]="patient.status"></span>
                    </div>
                    <button mat-icon-button [matMenuTriggerFor]="patientMenu" class="more-btn" (click)="$event.stopPropagation()">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #patientMenu="matMenu">
                      <button mat-menu-item [routerLink]="[patient.id]">
                        <mat-icon>visibility</mat-icon>
                        <span>View Chart</span>
                      </button>
                      <button mat-menu-item [routerLink]="[patient.id, 'edit']">
                        <mat-icon>edit</mat-icon>
                        <span>Edit Patient</span>
                      </button>
                      <button mat-menu-item [routerLink]="[patient.id, 'appointments']">
                        <mat-icon>event</mat-icon>
                        <span>Schedule Appointment</span>
                      </button>
                      <button mat-menu-item [routerLink]="[patient.id, 'encounters']">
                        <mat-icon>medical_services</mat-icon>
                        <span>New Encounter</span>
                      </button>
                    </mat-menu>
                  </div>
                  
                  <mat-card-content>
                    <h3 class="patient-name">{{ getPatientName(patient) }}</h3>
                    <div class="patient-info">
                      <span class="mrn">
                        <mat-icon>badge</mat-icon>
                        {{ patient.mrn }}
                      </span>
                      <span class="dob">
                        <mat-icon>cake</mat-icon>
                        {{ formatAge(patient) }}
                      </span>
                      <span class="gender">
                        <mat-icon>{{ patient.gender === 'male' ? 'male' : patient.gender === 'female' ? 'female' : 'transgender' }}</mat-icon>
                        {{ patient.gender | titlecase }}
                      </span>
                    </div>
                    
                    @if (patient.phone) {
                      <div class="contact-info">
                        <mat-icon>phone</mat-icon>
                        {{ patient.phone }}
                      </div>
                    }
                    
                    @if (hasAllergies(patient)) {
                      <div class="allergy-badge">
                        <mat-icon>warning</mat-icon>
                        Allergies
                      </div>
                    }
                  </mat-card-content>
                  
                  <mat-card-footer>
                    <span class="last-visit" *ngIf="patient.lastVisit">
                      Last visit: {{ patient.lastVisit | date:'mediumDate' }}
                    </span>
                    <span class="last-visit" *ngIf="!patient.lastVisit">
                      No visits yet
                    </span>
                  </mat-card-footer>
                </mat-card>
              }
            </div>
          } @else {
            <div class="patients-list">
              @for (patient of patients(); track patient.id; let i = $index) {
                <mat-card 
                  class="patient-row" 
                  matRipple
                  [routerLink]="[patient.id]">
                  <div class="row-avatar">
                    @if (patient.photoUrl) {
                      <img [src]="patient.photoUrl" [alt]="getPatientName(patient)" loading="lazy">
                    } @else {
                      <mat-icon>person</mat-icon>
                    }
                    <span class="status-indicator" [class]="patient.status"></span>
                  </div>
                  
                  <div class="row-main">
                    <h3 class="patient-name">{{ getPatientName(patient) }}</h3>
                    <span class="mrn">{{ patient.mrn }}</span>
                  </div>
                  
                  <div class="row-details">
                    <span class="detail">
                      <mat-icon>cake</mat-icon>
                      {{ formatAge(patient) }}
                    </span>
                    <span class="detail">
                      <mat-icon>{{ patient.gender === 'male' ? 'male' : patient.gender === 'female' ? 'female' : 'transgender' }}</mat-icon>
                      {{ patient.gender | titlecase }}
                    </span>
                    @if (patient.phone) {
                      <span class="detail">
                        <mat-icon>phone</mat-icon>
                        {{ patient.phone }}
                      </span>
                    }
                  </div>
                  
                  <div class="row-badges">
                    @if (hasAllergies(patient)) {
                      <span class="badge allergy">
                        <mat-icon>warning</mat-icon>
                        Allergies
                      </span>
                    }
                  </div>
                  
                  <div class="row-meta">
                    <span class="last-visit" *ngIf="patient.lastVisit">
                      {{ patient.lastVisit | date:'mediumDate' }}
                    </span>
                  </div>
                  
                  <div class="row-actions">
                    <button mat-icon-button [matMenuTriggerFor]="rowMenu" (click)="$event.stopPropagation()">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #rowMenu="matMenu">
                      <button mat-menu-item [routerLink]="[patient.id]">
                        <mat-icon>visibility</mat-icon>
                        <span>View Chart</span>
                      </button>
                      <button mat-menu-item [routerLink]="[patient.id, 'edit']">
                        <mat-icon>edit</mat-icon>
                        <span>Edit Patient</span>
                      </button>
                      <button mat-menu-item [routerLink]="[patient.id, 'appointments']">
                        <mat-icon>event</mat-icon>
                        <span>Schedule Appointment</span>
                      </button>
                    </mat-menu>
                  </div>
                </mat-card>
              }
            </div>
          }
        }
      </section>

      <!-- Pagination -->
      @if (!loading() && patients().length > 0) {
        <mat-paginator
          [length]="totalPatients()"
          [pageSize]="pageSize()"
          [pageSizeOptions]="[10, 20, 50, 100]"
          [pageIndex]="currentPage() - 1"
          (page)="onPageChange($event)"
          showFirstLastButtons>
        </mat-paginator>
      }
    </div>
  `,
  styles: [`
    @use '@angular/material' as mat;
    
    :host {
      display: block;
      min-height: 100%;
    }

    .patient-list-container {
      padding: 24px;
      max-width: 1600px;
      margin: 0 auto;
    }

    /* Header Styles */
    .page-header {
      margin-bottom: 24px;
      animation: slideDown 0.4s ease-out;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-16px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      flex-wrap: wrap;
    }

    .title-section {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .page-title {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      font-size: 2rem;
      font-weight: 600;
      color: #1a1a2e;
      letter-spacing: -0.02em;
    }

    .title-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #0077b6;
    }

    .page-subtitle {
      margin: 0;
      color: #64748b;
      font-size: 0.95rem;
    }

    .add-patient-btn {
      padding: 8px 20px;
      font-weight: 500;
      border-radius: 8px;
      background: linear-gradient(135deg, #0077b6 0%, #023e8a 100%);
      transition: transform 0.2s, box-shadow 0.2s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 119, 182, 0.3);
      }

      mat-icon {
        margin-right: 8px;
      }
    }

    /* Filter Section */
    .search-filter-section {
      margin-bottom: 24px;
      animation: fadeIn 0.5s ease-out 0.1s both;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .filter-card {
      padding: 20px;
      border-radius: 16px;
      background: white;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    }

    .filter-row {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
    }

    .search-field {
      flex: 1;
      min-width: 280px;
    }

    .status-filter, .sort-filter {
      width: 160px;
    }

    .sort-order-btn {
      color: #64748b;
      
      &:hover {
        color: #0077b6;
      }
    }

    .view-toggle {
      display: flex;
      gap: 4px;
      padding: 4px;
      background: #f1f5f9;
      border-radius: 8px;

      button {
        color: #64748b;
        transition: all 0.2s;

        &.active {
          color: #0077b6;
          background: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      }
    }

    .active-filters {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      flex-wrap: wrap;
    }

    .filter-label {
      color: #64748b;
      font-size: 0.875rem;
    }

    .clear-all-btn {
      margin-left: auto;
    }

    /* Patients Section */
    .patients-section {
      animation: fadeIn 0.5s ease-out 0.2s both;
    }

    /* Loading State */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 24px;
      gap: 16px;
      color: #64748b;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 24px;
      text-align: center;
      background: white;
      border-radius: 16px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

      .empty-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #cbd5e1;
        margin-bottom: 16px;
      }

      h3 {
        margin: 0 0 8px;
        color: #1e293b;
        font-weight: 600;
      }

      p {
        margin: 0 0 24px;
        color: #64748b;
      }
    }

    /* Grid View */
    .patients-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    .patient-card {
      border-radius: 16px;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      background: white;
      border: 1px solid #e2e8f0;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 20px 20px 0;
      }

      .patient-avatar {
        position: relative;
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        mat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
          color: #0077b6;
        }

        .status-indicator {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 2px solid white;

          &.active { background: #22c55e; }
          &.inactive { background: #94a3b8; }
          &.deceased { background: #1e293b; }
        }
      }

      .more-btn {
        color: #94a3b8;
      }

      mat-card-content {
        padding: 16px 20px;
      }

      .patient-name {
        margin: 0 0 12px;
        font-size: 1.125rem;
        font-weight: 600;
        color: #1e293b;
      }

      .patient-info {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: 12px;

        span {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.875rem;
          color: #64748b;

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }
        }
      }

      .contact-info {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.875rem;
        color: #64748b;
        margin-bottom: 12px;

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }

      .allergy-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        background: #fef2f2;
        color: #dc2626;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 500;

        mat-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
        }
      }

      mat-card-footer {
        padding: 12px 20px;
        background: #f8fafc;
        border-top: 1px solid #e2e8f0;

        .last-visit {
          font-size: 0.8rem;
          color: #64748b;
        }
      }
    }

    /* List View */
    .patients-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .patient-row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      background: white;
      border: 1px solid #e2e8f0;

      &:hover {
        border-color: #0077b6;
        box-shadow: 0 4px 12px rgba(0, 119, 182, 0.1);
      }

      .row-avatar {
        position: relative;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        flex-shrink: 0;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        mat-icon {
          font-size: 24px;
          color: #0077b6;
        }

        .status-indicator {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid white;

          &.active { background: #22c55e; }
          &.inactive { background: #94a3b8; }
          &.deceased { background: #1e293b; }
        }
      }

      .row-main {
        flex: 1;
        min-width: 180px;

        .patient-name {
          margin: 0 0 2px;
          font-weight: 600;
          color: #1e293b;
        }

        .mrn {
          font-size: 0.875rem;
          color: #64748b;
        }
      }

      .row-details {
        display: flex;
        gap: 16px;
        flex: 1;

        .detail {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.875rem;
          color: #64748b;

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }
        }
      }

      .row-badges {
        display: flex;
        gap: 8px;

        .badge {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 500;

          mat-icon {
            font-size: 14px;
            width: 14px;
            height: 14px;
          }

          &.allergy {
            background: #fef2f2;
            color: #dc2626;
          }
        }
      }

      .row-meta {
        min-width: 100px;
        text-align: right;

        .last-visit {
          font-size: 0.8rem;
          color: #64748b;
        }
      }

      .row-actions {
        color: #94a3b8;
      }
    }

    /* Pagination */
    mat-paginator {
      margin-top: 24px;
      border-radius: 12px;
      background: white;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .patient-list-container {
        padding: 16px;
      }

      .header-content {
        flex-direction: column;
        align-items: stretch;
      }

      .header-actions {
        display: flex;

        .add-patient-btn {
          flex: 1;
          justify-content: center;
        }
      }

      .filter-row {
        flex-direction: column;
        align-items: stretch;

        .search-field,
        .status-filter,
        .sort-filter {
          width: 100%;
          min-width: auto;
        }
      }

      .view-toggle {
        align-self: flex-end;
      }

      .patient-row {
        flex-wrap: wrap;

        .row-details {
          flex-basis: 100%;
          order: 3;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #e2e8f0;
        }

        .row-badges {
          order: 2;
        }

        .row-meta {
          display: none;
        }
      }
    }
  `]
})
export class PatientListComponent implements OnInit, OnDestroy {
  private readonly patientService = inject(PatientService);
  private readonly destroy$ = new Subject<void>();

  // Form controls
  searchControl = new FormControl('');
  statusControl = new FormControl('');
  sortControl = new FormControl('fullName');

  // Signals
  patients = signal<Patient[]>([]);
  totalPatients = signal(0);
  currentPage = signal(1);
  pageSize = signal(20);
  sortOrder = signal<'asc' | 'desc'>('asc');
  loading = signal(false);
  viewMode = signal<'grid' | 'list'>('grid');

  // Computed
  activeFiltersCount = computed(() => {
    let count = 0;
    if (this.searchControl.value) count++;
    if (this.statusControl.value) count++;
    return count;
  });

  ngOnInit(): void {
    this.loadPatients();
    this.setupFilterListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFilterListeners(): void {
    // Search with debounce
    this.searchControl.valueChanges.pipe(
      debounceTime(400),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage.set(1);
      this.loadPatients();
    });

    // Status filter
    this.statusControl.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage.set(1);
      this.loadPatients();
    });

    // Sort
    this.sortControl.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.loadPatients();
    });
  }

  loadPatients(): void {
    this.loading.set(true);

    const params: PatientSearchParams = {
      query: this.searchControl.value || undefined,
      status: this.statusControl.value as any || undefined,
      sortBy: this.sortControl.value || 'fullName',
      sortOrder: this.sortOrder(),
      page: this.currentPage(),
      pageSize: this.pageSize(),
    };

    this.patientService.searchPatients(params).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result) => {
        this.patients.set(result.patients);
        this.totalPatients.set(result.total);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading patients:', err);
        this.loading.set(false);
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.loadPatients();
  }

  toggleSortOrder(): void {
    this.sortOrder.update(order => order === 'asc' ? 'desc' : 'asc');
    this.loadPatients();
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }

  clearAllFilters(): void {
    this.searchControl.setValue('');
    this.statusControl.setValue('');
    this.sortControl.setValue('fullName');
    this.sortOrder.set('asc');
  }

  getPatientName(patient: Patient): string {
    return `${patient.firstName} ${patient.lastName}`;
  }

  formatAge(patient: Patient): string {
    const today = new Date();
    const birthDate = new Date(patient.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return `${age} yrs`;
  }

  hasAllergies(patient: Patient): boolean {
    return !!(patient.allergies && patient.allergies.length > 0);
  }
}
