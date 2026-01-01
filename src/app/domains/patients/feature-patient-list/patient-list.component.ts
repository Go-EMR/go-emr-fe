import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { SkeletonModule } from 'primeng/skeleton';
import { BadgeModule } from 'primeng/badge';
import { DividerModule } from 'primeng/divider';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MenuItem } from 'primeng/api';

import { PatientService } from '../data-access/services/patient.service';
import { PatientSearchParams, Patient } from '../data-access/models/patient.model';
import { ThemeService } from '../../../core/services/theme.service';

interface StatusOption {
  label: string;
  value: string;
}

interface SortOption {
  label: string;
  value: string;
}

interface ViewOption {
  icon: string;
  value: 'grid' | 'list';
}

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ReactiveFormsModule,
    // PrimeNG
    CardModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    SelectModule,
    TableModule,
    PaginatorModule,
    AvatarModule,
    TagModule,
    ChipModule,
    MenuModule,
    TooltipModule,
    RippleModule,
    SkeletonModule,
    BadgeModule,
    DividerModule,
    SelectButtonModule,
  ],
  template: `
    <div class="patient-list" [class.dark]="themeService.isDarkMode()">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="title-section">
            <h1>
              <i class="pi pi-users"></i>
              Patient Registry
            </h1>
            <p class="subtitle">{{ totalPatients() }} patients registered</p>
          </div>
          <div class="header-actions">
            <p-button 
              label="New Patient" 
              icon="pi pi-user-plus"
              routerLink="new"
            />
          </div>
        </div>
      </header>

      <!-- Search & Filters -->
      <section class="filters-section">
        <p-card styleClass="filter-card">
          <div class="filter-row">
            <!-- Search Input -->
            <div class="search-wrapper">
              <p-iconfield>
                <p-inputicon styleClass="pi pi-search" />
                <input 
                  pInputText 
                  [formControl]="searchControl"
                  placeholder="Search by name, MRN, or phone..."
                  class="search-input"
                />
              </p-iconfield>
              @if (searchControl.value) {
                <p-button 
                  icon="pi pi-times" 
                  [rounded]="true" 
                  [text]="true"
                  severity="secondary"
                  (onClick)="clearSearch()"
                  class="clear-search-btn"
                />
              }
            </div>

            <!-- Status Filter -->
            <p-select
              [options]="statusOptions"
              [formControl]="statusControl"
              placeholder="All Statuses"
              [showClear]="true"
              class="status-select"
            />

            <!-- Sort By -->
            <p-select
              [options]="sortOptions"
              [formControl]="sortControl"
              placeholder="Sort by"
              class="sort-select"
            />

            <!-- Sort Order -->
            <p-button 
              [icon]="sortOrder() === 'asc' ? 'pi pi-sort-amount-up' : 'pi pi-sort-amount-down'"
              [rounded]="true"
              [outlined]="true"
              severity="secondary"
              (onClick)="toggleSortOrder()"
              [pTooltip]="sortOrder() === 'asc' ? 'Ascending' : 'Descending'"
              tooltipPosition="bottom"
            />

            <!-- View Toggle -->
            <p-selectButton 
              [options]="viewOptions" 
              [(ngModel)]="selectedView"
              (onChange)="viewMode.set($event.value)"
              optionLabel="icon"
              optionValue="value"
              class="view-toggle">
              <ng-template pTemplate="item" let-item>
                <i [class]="'pi ' + item.icon"></i>
              </ng-template>
            </p-selectButton>
          </div>

          <!-- Active Filters -->
          @if (activeFiltersCount() > 0) {
            <div class="active-filters">
              <span class="filter-label">Active filters:</span>
              @if (searchControl.value) {
                <p-chip 
                  [label]="'Search: ' + searchControl.value" 
                  [removable]="true"
                  (onRemove)="clearSearch()"
                />
              }
              @if (statusControl.value) {
                <p-chip 
                  [label]="'Status: ' + statusControl.value" 
                  [removable]="true"
                  (onRemove)="statusControl.setValue(null)"
                />
              }
              <p-button 
                label="Clear All" 
                [text]="true" 
                severity="danger"
                size="small"
                (onClick)="clearAllFilters()"
              />
            </div>
          }
        </p-card>
      </section>

      <!-- Patient Content -->
      <section class="patients-section">
        @if (loading()) {
          <!-- Loading State -->
          <div class="loading-state">
            @if (viewMode() === 'grid') {
              <div class="patients-grid">
                @for (i of skeletonItems; track i) {
                  <div class="patient-card skeleton">
                    <div class="card-header">
                      <p-skeleton shape="circle" size="64px" />
                    </div>
                    <div class="card-body">
                      <p-skeleton width="70%" height="20px" styleClass="mb-2" />
                      <p-skeleton width="50%" height="14px" styleClass="mb-3" />
                      <p-skeleton width="80%" height="14px" styleClass="mb-2" />
                      <p-skeleton width="60%" height="14px" />
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="patients-table-skeleton">
                @for (i of skeletonItems; track i) {
                  <div class="table-row-skeleton">
                    <p-skeleton shape="circle" size="40px" />
                    <p-skeleton width="150px" height="16px" />
                    <p-skeleton width="80px" height="14px" />
                    <p-skeleton width="60px" height="14px" />
                    <p-skeleton width="100px" height="14px" />
                    <p-skeleton width="70px" height="24px" borderRadius="12px" />
                  </div>
                }
              </div>
            }
          </div>
        } @else if (patients().length === 0) {
          <!-- Empty State -->
          <div class="empty-state">
            <i class="pi pi-users"></i>
            <h3>No patients found</h3>
            <p>Try adjusting your search criteria or add a new patient</p>
            <p-button 
              label="Add New Patient" 
              icon="pi pi-user-plus"
              routerLink="new"
            />
          </div>
        } @else {
          <!-- Grid View -->
          @if (viewMode() === 'grid') {
            <div class="patients-grid">
              @for (patient of patients(); track patient.id; let i = $index) {
                <div 
                  class="patient-card" 
                  [routerLink]="[patient.id]"
                  pRipple>
                  <div class="card-header">
                    <p-avatar 
                      [label]="getInitials(patient)"
                      [image]="patient.photoUrl || ''"
                      [style]="{ 'background-color': getAvatarColor(i), 'color': 'white' }"
                      size="xlarge"
                      shape="circle"
                    />
                    <span class="status-dot" [class]="patient.status"></span>
                    <p-button 
                      icon="pi pi-ellipsis-v" 
                      [rounded]="true" 
                      [text]="true"
                      severity="secondary"
                      (onClick)="openPatientMenu($event, patient); $event.stopPropagation()"
                      class="menu-btn"
                    />
                  </div>
                  
                  <div class="card-body">
                    <h3 class="patient-name">{{ getPatientName(patient) }}</h3>
                    <span class="patient-mrn">MRN: {{ patient.mrn }}</span>
                    
                    <div class="patient-details">
                      <span class="detail">
                        <i class="pi pi-calendar"></i>
                        {{ formatAge(patient) }}
                      </span>
                      <span class="detail">
                        <i [class]="'pi ' + getGenderIcon(patient.gender)"></i>
                        {{ patient.gender | titlecase }}
                      </span>
                    </div>
                    
                    @if (patient.phone) {
                      <div class="patient-contact">
                        <i class="pi pi-phone"></i>
                        {{ patient.phone }}
                      </div>
                    }
                    
                    @if (hasAllergies(patient)) {
                      <p-tag 
                        value="Allergies" 
                        icon="pi pi-exclamation-triangle"
                        severity="danger"
                        [rounded]="true"
                        class="allergy-tag"
                      />
                    }
                  </div>
                  
                  <div class="card-footer">
                    <span class="last-visit">
                      @if (patient.lastVisit) {
                        Last visit: {{ patient.lastVisit | date:'mediumDate' }}
                      } @else {
                        No visits yet
                      }
                    </span>
                    <p-tag 
                      [value]="patient.status | titlecase" 
                      [severity]="getStatusSeverity(patient.status)"
                      [rounded]="true"
                    />
                  </div>
                </div>
              }
            </div>
          } @else {
            <!-- Table View -->
            <p-table 
              [value]="patients()" 
              [tableStyle]="{ 'min-width': '60rem' }"
              styleClass="patients-table"
              [rowHover]="true">
              <ng-template pTemplate="header">
                <tr>
                  <th>Patient</th>
                  <th>MRN</th>
                  <th>Age / Gender</th>
                  <th>Contact</th>
                  <th>Last Visit</th>
                  <th>Status</th>
                  <th style="width: 80px">Actions</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-patient let-i="rowIndex">
                <tr [routerLink]="[patient.id]" class="patient-row" pRipple>
                  <td>
                    <div class="patient-cell">
                      <p-avatar 
                        [label]="getInitials(patient)"
                        [image]="patient.photoUrl || ''"
                        [style]="{ 'background-color': getAvatarColor(i), 'color': 'white' }"
                        shape="circle"
                      />
                      <div class="patient-info">
                        <span class="name">{{ getPatientName(patient) }}</span>
                        @if (hasAllergies(patient)) {
                          <p-tag 
                            value="Allergies" 
                            icon="pi pi-exclamation-triangle"
                            severity="danger"
                            [rounded]="true"
                            class="mini-tag"
                          />
                        }
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="mrn-cell">{{ patient.mrn }}</span>
                  </td>
                  <td>
                    <div class="age-gender-cell">
                      <span>{{ formatAge(patient) }}</span>
                      <span class="separator">•</span>
                      <i [class]="'pi ' + getGenderIcon(patient.gender)"></i>
                      {{ patient.gender | titlecase }}
                    </div>
                  </td>
                  <td>
                    @if (patient.phone) {
                      <span class="contact-cell">
                        <i class="pi pi-phone"></i>
                        {{ patient.phone }}
                      </span>
                    } @else {
                      <span class="no-data">—</span>
                    }
                  </td>
                  <td>
                    @if (patient.lastVisit) {
                      <span class="date-cell">{{ patient.lastVisit | date:'mediumDate' }}</span>
                    } @else {
                      <span class="no-data">No visits</span>
                    }
                  </td>
                  <td>
                    <p-tag 
                      [value]="patient.status | titlecase" 
                      [severity]="getStatusSeverity(patient.status)"
                      [rounded]="true"
                    />
                  </td>
                  <td>
                    <p-button 
                      icon="pi pi-ellipsis-v" 
                      [rounded]="true" 
                      [text]="true"
                      severity="secondary"
                      (onClick)="openPatientMenu($event, patient); $event.stopPropagation()"
                    />
                  </td>
                </tr>
              </ng-template>
            </p-table>
          }

          <!-- Pagination -->
          <p-paginator
            [rows]="pageSize()"
            [totalRecords]="totalPatients()"
            [rowsPerPageOptions]="[10, 20, 50, 100]"
            [first]="(currentPage() - 1) * pageSize()"
            (onPageChange)="onPageChange($event)"
            [showFirstLastIcon]="true"
            styleClass="mt-4"
          />
        }
      </section>

      <!-- Patient Context Menu -->
      <p-menu #patientMenu [model]="patientMenuItems" [popup]="true" />
    </div>
  `,
  styles: [`
    .patient-list {
      padding: 1.5rem;
      max-width: 1600px;
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
      font-size: 0.9375rem;
    }

    .dark .subtitle {
      color: #94a3b8;
    }

    /* Filters */
    .filters-section {
      margin-bottom: 1.5rem;
    }

    :host ::ng-deep .filter-card {
      border-radius: 1rem;
    }

    .dark :host ::ng-deep .filter-card {
      background: #1e293b;
      border-color: #334155;
    }

    .filter-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .search-wrapper {
      flex: 1;
      min-width: 250px;
      max-width: 400px;
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-wrapper p-iconfield {
      flex: 1;
    }

    .search-input {
      width: 100%;
    }

    .clear-search-btn {
      position: absolute;
      right: 8px;
    }

    .status-select,
    .sort-select {
      min-width: 150px;
    }

    .view-toggle {
      margin-left: auto;
    }

    :host ::ng-deep .view-toggle .p-selectbutton .p-button {
      padding: 0.5rem 0.75rem;
    }

    .active-filters {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
      flex-wrap: wrap;
    }

    .dark .active-filters {
      border-top-color: #334155;
    }

    .filter-label {
      font-size: 0.875rem;
      color: #64748b;
    }

    .dark .filter-label {
      color: #94a3b8;
    }

    /* Loading State */
    .loading-state {
      min-height: 400px;
    }

    .patients-table-skeleton {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
      background: white;
      border-radius: 1rem;
    }

    .dark .patients-table-skeleton {
      background: #1e293b;
    }

    .table-row-skeleton {
      display: flex;
      align-items: center;
      gap: 2rem;
      padding: 1rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .dark .table-row-skeleton {
      border-bottom-color: #334155;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
      background: white;
      border-radius: 1rem;
    }

    .dark .empty-state {
      background: #1e293b;
    }

    .empty-state i {
      font-size: 4rem;
      color: #cbd5e1;
      margin-bottom: 1.5rem;
    }

    .dark .empty-state i {
      color: #475569;
    }

    .empty-state h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #374151;
      margin: 0 0 0.5rem;
    }

    .dark .empty-state h3 {
      color: #e2e8f0;
    }

    .empty-state p {
      color: #64748b;
      margin: 0 0 1.5rem;
    }

    .dark .empty-state p {
      color: #94a3b8;
    }

    /* Grid View */
    .patients-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.25rem;
    }

    .patient-card {
      background: white;
      border-radius: 1rem;
      border: 1px solid #e2e8f0;
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .dark .patient-card {
      background: #1e293b;
      border-color: #334155;
    }

    .patient-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.15);
      border-color: #3b82f6;
    }

    .dark .patient-card:hover {
      box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.4);
    }

    .patient-card.skeleton {
      cursor: default;
    }

    .patient-card.skeleton:hover {
      transform: none;
      box-shadow: none;
    }

    .card-header {
      display: flex;
      align-items: flex-start;
      margin-bottom: 1rem;
      position: relative;
    }

    .status-dot {
      position: absolute;
      bottom: 4px;
      left: 48px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 2px solid white;
    }

    .dark .status-dot {
      border-color: #1e293b;
    }

    .status-dot.active { background: #10b981; }
    .status-dot.inactive { background: #94a3b8; }
    .status-dot.deceased { background: #64748b; }

    .menu-btn {
      position: absolute;
      top: 0;
      right: 0;
    }

    .card-body {
      margin-bottom: 1rem;
    }

    .patient-name {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 0.25rem;
    }

    .dark .patient-name {
      color: #f1f5f9;
    }

    .patient-mrn {
      font-size: 0.8125rem;
      color: #64748b;
      display: block;
      margin-bottom: 0.75rem;
    }

    .dark .patient-mrn {
      color: #94a3b8;
    }

    .patient-details {
      display: flex;
      gap: 1rem;
      margin-bottom: 0.5rem;
    }

    .detail {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.875rem;
      color: #64748b;
    }

    .dark .detail {
      color: #94a3b8;
    }

    .detail i {
      font-size: 0.875rem;
    }

    .patient-contact {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #64748b;
      margin-bottom: 0.75rem;
    }

    .dark .patient-contact {
      color: #94a3b8;
    }

    .allergy-tag {
      margin-top: 0.5rem;
    }

    :host ::ng-deep .allergy-tag .p-tag {
      font-size: 0.75rem;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }

    .dark .card-footer {
      border-top-color: #334155;
    }

    .last-visit {
      font-size: 0.8125rem;
      color: #94a3b8;
    }

    /* Table View */
    :host ::ng-deep .patients-table {
      border-radius: 1rem;
      overflow: hidden;
    }

    :host ::ng-deep .patients-table .p-datatable-header {
      background: #f8fafc;
      border: none;
    }

    .dark :host ::ng-deep .patients-table .p-datatable-header {
      background: #334155;
    }

    :host ::ng-deep .patients-table .p-datatable-thead > tr > th {
      background: #f8fafc;
      color: #64748b;
      font-weight: 600;
      font-size: 0.8125rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #e2e8f0;
    }

    .dark :host ::ng-deep .patients-table .p-datatable-thead > tr > th {
      background: #334155;
      color: #94a3b8;
      border-bottom-color: #475569;
    }

    :host ::ng-deep .patients-table .p-datatable-tbody > tr {
      cursor: pointer;
      transition: background 0.2s;
    }

    :host ::ng-deep .patients-table .p-datatable-tbody > tr > td {
      border-bottom: 1px solid #e2e8f0;
      padding: 1rem;
    }

    .dark :host ::ng-deep .patients-table .p-datatable-tbody > tr > td {
      border-bottom-color: #334155;
    }

    :host ::ng-deep .patients-table .p-datatable-tbody > tr:hover {
      background: #f8fafc;
    }

    .dark :host ::ng-deep .patients-table .p-datatable-tbody > tr:hover {
      background: #334155;
    }

    .patient-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .patient-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .patient-info .name {
      font-weight: 500;
      color: #1e293b;
    }

    .dark .patient-info .name {
      color: #f1f5f9;
    }

    :host ::ng-deep .mini-tag .p-tag {
      font-size: 0.6875rem;
      padding: 0.125rem 0.5rem;
    }

    .mrn-cell {
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 0.875rem;
      color: #64748b;
    }

    .dark .mrn-cell {
      color: #94a3b8;
    }

    .age-gender-cell {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #64748b;
      font-size: 0.875rem;
    }

    .dark .age-gender-cell {
      color: #94a3b8;
    }

    .separator {
      color: #cbd5e1;
    }

    .dark .separator {
      color: #475569;
    }

    .contact-cell {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #64748b;
      font-size: 0.875rem;
    }

    .dark .contact-cell {
      color: #94a3b8;
    }

    .date-cell {
      font-size: 0.875rem;
      color: #64748b;
    }

    .dark .date-cell {
      color: #94a3b8;
    }

    .no-data {
      color: #cbd5e1;
    }

    .dark .no-data {
      color: #475569;
    }

    /* Pagination */
    :host ::ng-deep .p-paginator {
      background: white;
      border-radius: 0.75rem;
      border: 1px solid #e2e8f0;
    }

    .dark :host ::ng-deep .p-paginator {
      background: #1e293b;
      border-color: #334155;
    }

    /* Dark mode inputs */
    .dark :host ::ng-deep .p-inputtext {
      background: #334155;
      border-color: #475569;
      color: #f1f5f9;
    }

    .dark :host ::ng-deep .p-inputtext::placeholder {
      color: #94a3b8;
    }

    .dark :host ::ng-deep .p-select {
      background: #334155;
      border-color: #475569;
    }

    .dark :host ::ng-deep .p-select-label {
      color: #f1f5f9;
    }

    .dark :host ::ng-deep .p-selectbutton .p-button {
      background: #334155;
      border-color: #475569;
      color: #94a3b8;
    }

    .dark :host ::ng-deep .p-selectbutton .p-button.p-highlight {
      background: #3b82f6;
      border-color: #3b82f6;
      color: white;
    }

    .dark :host ::ng-deep .p-card {
      background: #1e293b;
      border-color: #334155;
    }

    .dark :host ::ng-deep .p-datatable {
      background: #1e293b;
    }

    .dark :host ::ng-deep .p-datatable .p-datatable-tbody > tr {
      background: #1e293b;
      color: #f1f5f9;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .filter-row {
        flex-direction: column;
        align-items: stretch;
      }

      .search-wrapper {
        max-width: none;
      }

      .view-toggle {
        margin-left: 0;
        align-self: flex-end;
      }
    }

    @media (max-width: 768px) {
      .patient-list {
        padding: 1rem;
      }

      .header-content {
        flex-direction: column;
        align-items: stretch;
      }

      .header-actions {
        width: 100%;
      }

      :host ::ng-deep .header-actions .p-button {
        width: 100%;
        justify-content: center;
      }

      .patients-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PatientListComponent implements OnInit, OnDestroy {
  private readonly patientService = inject(PatientService);
  readonly themeService = inject(ThemeService);
  private readonly destroy$ = new Subject<void>();

  // Form controls
  searchControl = new FormControl('');
  statusControl = new FormControl<string | null>(null);
  sortControl = new FormControl('fullName');

  // Options
  statusOptions: StatusOption[] = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Deceased', value: 'deceased' },
  ];

  sortOptions: SortOption[] = [
    { label: 'Name', value: 'fullName' },
    { label: 'Last Visit', value: 'lastVisit' },
    { label: 'Age', value: 'dateOfBirth' },
    { label: 'MRN', value: 'mrn' },
  ];

  viewOptions: ViewOption[] = [
    { icon: 'pi-th-large', value: 'grid' },
    { icon: 'pi-list', value: 'list' },
  ];

  selectedView: 'grid' | 'list' = 'grid';
  skeletonItems = [1, 2, 3, 4, 5, 6];

  // Patient menu
  patientMenuItems: MenuItem[] = [];
  selectedPatient: Patient | null = null;

  // Signals
  patients = signal<Patient[]>([]);
  totalPatients = signal(0);
  currentPage = signal(1);
  pageSize = signal(20);
  sortOrder = signal<'asc' | 'desc'>('asc');
  loading = signal(false);
  viewMode = signal<'grid' | 'list'>('grid');

  // Avatar colors
  private avatarColors = [
    '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#6366f1', '#14b8a6'
  ];

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
    this.searchControl.valueChanges.pipe(
      debounceTime(400),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage.set(1);
      this.loadPatients();
    });

    this.statusControl.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage.set(1);
      this.loadPatients();
    });

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
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onPageChange(event: PaginatorState): void {
    if (event.first !== undefined && event.rows !== undefined) {
      this.currentPage.set(Math.floor(event.first / event.rows) + 1);
      this.pageSize.set(event.rows);
      this.loadPatients();
    }
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
    this.statusControl.setValue(null);
    this.sortControl.setValue('fullName');
    this.sortOrder.set('asc');
  }

  openPatientMenu(event: Event, patient: Patient): void {
    this.selectedPatient = patient;
    this.patientMenuItems = [
      {
        label: 'View Chart',
        icon: 'pi pi-eye',
        routerLink: ['/patients', patient.id],
      },
      {
        label: 'Edit Patient',
        icon: 'pi pi-pencil',
        routerLink: ['/patients', patient.id, 'edit'],
      },
      { separator: true },
      {
        label: 'Schedule Appointment',
        icon: 'pi pi-calendar-plus',
        routerLink: ['/patients', patient.id, 'appointments'],
      },
      {
        label: 'New Encounter',
        icon: 'pi pi-file-edit',
        routerLink: ['/patients', patient.id, 'encounters'],
      },
      { separator: true },
      {
        label: 'Send Message',
        icon: 'pi pi-envelope',
        routerLink: ['/messages/new'],
        queryParams: { patientId: patient.id },
      },
    ];
  }

  getPatientName(patient: Patient): string {
    return `${patient.firstName} ${patient.lastName}`;
  }

  getInitials(patient: Patient): string {
    return `${patient.firstName[0]}${patient.lastName[0]}`.toUpperCase();
  }

  getAvatarColor(index: number): string {
    return this.avatarColors[index % this.avatarColors.length];
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

  getGenderIcon(gender: string): string {
    switch (gender) {
      case 'male': return 'pi-mars';
      case 'female': return 'pi-venus';
      default: return 'pi-user';
    }
  }

  hasAllergies(patient: Patient): boolean {
    return !!(patient.allergies && patient.allergies.length > 0);
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    const severities: Record<string, 'success' | 'secondary' | 'danger'> = {
      active: 'success',
      inactive: 'secondary',
      deceased: 'danger',
    };
    return severities[status] || 'secondary';
  }
}
