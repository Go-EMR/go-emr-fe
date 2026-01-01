import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ReportsService } from '../data-access/services/reports.service';

interface DataSource {
  id: string;
  name: string;
  description: string;
  icon: string;
  fields: DataField[];
}

interface DataField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'currency';
  category: string;
}

interface SelectedField {
  field: DataField;
  alias?: string;
  aggregation?: 'none' | 'count' | 'sum' | 'avg' | 'min' | 'max';
  visible: boolean;
}

interface FilterCondition {
  id: string;
  field: DataField | null;
  operator: string;
  value: string;
  conjunction: 'AND' | 'OR';
}

interface SortOption {
  field: DataField | null;
  direction: 'asc' | 'desc';
}

interface SavedReport {
  id: string;
  name: string;
  description: string;
  dataSource: string;
  fields: SelectedField[];
  filters: FilterCondition[];
  sorting: SortOption[];
  groupBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

@Component({
  selector: 'app-report-builder',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="report-builder">
      <header class="page-header">
        <div class="header-content">
          <h1>Report Builder</h1>
          <p class="subtitle">Create custom reports by selecting data sources and fields</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="showSavedReports.set(true)">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            Saved Reports
          </button>
          <button class="btn btn-primary" [disabled]="!canSaveReport()" (click)="showSaveModal.set(true)">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            Save Report
          </button>
        </div>
      </header>

      <!-- Builder Steps -->
      <div class="builder-steps">
        <div class="step" [class.active]="currentStep() >= 1" [class.completed]="currentStep() > 1" (click)="goToStep(1)">
          <span class="step-number">1</span>
          <span class="step-label">Data Source</span>
        </div>
        <div class="step-connector" [class.active]="currentStep() > 1"></div>
        <div class="step" [class.active]="currentStep() >= 2" [class.completed]="currentStep() > 2" (click)="goToStep(2)">
          <span class="step-number">2</span>
          <span class="step-label">Fields</span>
        </div>
        <div class="step-connector" [class.active]="currentStep() > 2"></div>
        <div class="step" [class.active]="currentStep() >= 3" [class.completed]="currentStep() > 3" (click)="goToStep(3)">
          <span class="step-number">3</span>
          <span class="step-label">Filters</span>
        </div>
        <div class="step-connector" [class.active]="currentStep() > 3"></div>
        <div class="step" [class.active]="currentStep() >= 4" [class.completed]="currentStep() > 4" (click)="goToStep(4)">
          <span class="step-number">4</span>
          <span class="step-label">Sorting & Grouping</span>
        </div>
        <div class="step-connector" [class.active]="currentStep() > 4"></div>
        <div class="step" [class.active]="currentStep() >= 5" (click)="goToStep(5)">
          <span class="step-number">5</span>
          <span class="step-label">Preview</span>
        </div>
      </div>

      <!-- Step 1: Data Source Selection -->
      @if (currentStep() === 1) {
        <div class="step-content">
          <h2>Select Data Source</h2>
          <p class="step-description">Choose the primary data source for your report</p>
          
          <div class="data-source-grid">
            @for (source of dataSources; track source.id) {
              <div 
                class="data-source-card"
                [class.selected]="selectedDataSource()?.id === source.id"
                (click)="selectDataSource(source)">
                <div class="source-icon" [innerHTML]="sanitizeHtml(source.icon)"></div>
                <h3>{{ source.name }}</h3>
                <p>{{ source.description }}</p>
                <span class="field-count">{{ source.fields.length }} fields available</span>
              </div>
            }
          </div>

          <div class="step-actions">
            <button class="btn btn-primary" [disabled]="!selectedDataSource()" (click)="nextStep()">
              Continue
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>
        </div>
      }

      <!-- Step 2: Field Selection -->
      @if (currentStep() === 2) {
        <div class="step-content">
          <h2>Select Fields</h2>
          <p class="step-description">Choose which fields to include in your report</p>
          
          <div class="fields-layout">
            <!-- Available Fields -->
            <div class="fields-panel">
              <div class="panel-header">
                <h3>Available Fields</h3>
                <div class="search-box">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input 
                    type="text" 
                    placeholder="Search fields..." 
                    [value]="fieldSearch()"
                    (input)="fieldSearch.set($any($event.target).value)">
                </div>
              </div>
              <div class="fields-list">
                @for (category of fieldCategories(); track category) {
                  <div class="field-category">
                    <button class="category-header" (click)="toggleCategory(category)">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" [class.rotated]="expandedCategories().has(category)">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                      {{ category }}
                    </button>
                    @if (expandedCategories().has(category)) {
                      <div class="category-fields">
                        @for (field of getFieldsByCategory(category); track field.id) {
                          <div 
                            class="field-item"
                            [class.selected]="isFieldSelected(field)"
                            (click)="toggleField(field)">
                            <span class="field-type-icon" [class]="'type-' + field.type">
                              {{ getTypeIcon(field.type) }}
                            </span>
                            <span class="field-name">{{ field.name }}</span>
                            @if (isFieldSelected(field)) {
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="check-icon">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            }
                          </div>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            </div>

            <!-- Selected Fields -->
            <div class="fields-panel selected-fields">
              <div class="panel-header">
                <h3>Selected Fields ({{ selectedFields().length }})</h3>
                @if (selectedFields().length > 0) {
                  <button class="btn btn-text" (click)="clearSelectedFields()">Clear All</button>
                }
              </div>
              <div class="selected-fields-list" 
                   (dragover)="onDragOver($event)"
                   (drop)="onDrop($event)">
                @if (selectedFields().length === 0) {
                  <div class="empty-state">
                    <p>No fields selected</p>
                    <span>Click on fields from the left panel to add them</span>
                  </div>
                } @else {
                  @for (selected of selectedFields(); track selected.field.id; let i = $index) {
                    <div 
                      class="selected-field-item"
                      draggable="true"
                      (dragstart)="onDragStart($event, i)"
                      (dragend)="onDragEnd()">
                      <div class="drag-handle">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <line x1="8" y1="6" x2="8" y2="6"/>
                          <line x1="16" y1="6" x2="16" y2="6"/>
                          <line x1="8" y1="12" x2="8" y2="12"/>
                          <line x1="16" y1="12" x2="16" y2="12"/>
                          <line x1="8" y1="18" x2="8" y2="18"/>
                          <line x1="16" y1="18" x2="16" y2="18"/>
                        </svg>
                      </div>
                      <div class="field-info">
                        <span class="field-name">{{ selected.field.name }}</span>
                        <span class="field-type">{{ selected.field.type }}</span>
                      </div>
                      @if (selected.field.type === 'number' || selected.field.type === 'currency') {
                        <select 
                          class="aggregation-select"
                          [value]="selected.aggregation"
                          (change)="setAggregation(i, $any($event.target).value)">
                          <option value="none">No aggregation</option>
                          <option value="sum">Sum</option>
                          <option value="avg">Average</option>
                          <option value="count">Count</option>
                          <option value="min">Min</option>
                          <option value="max">Max</option>
                        </select>
                      }
                      <button class="remove-btn" (click)="removeField(i)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  }
                }
              </div>
            </div>
          </div>

          <div class="step-actions">
            <button class="btn btn-secondary" (click)="prevStep()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              Back
            </button>
            <button class="btn btn-primary" [disabled]="selectedFields().length === 0" (click)="nextStep()">
              Continue
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>
        </div>
      }

      <!-- Step 3: Filters -->
      @if (currentStep() === 3) {
        <div class="step-content">
          <h2>Add Filters</h2>
          <p class="step-description">Define conditions to filter your report data</p>
          
          <div class="filters-container">
            @if (filters().length === 0) {
              <div class="empty-filters">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
                <p>No filters added yet</p>
                <span>Click the button below to add filter conditions</span>
              </div>
            } @else {
              <div class="filter-list">
                @for (filter of filters(); track filter.id; let i = $index) {
                  <div class="filter-row">
                    @if (i > 0) {
                      <select 
                        class="conjunction-select"
                        [value]="filter.conjunction"
                        (change)="updateFilterConjunction(i, $any($event.target).value)">
                        <option value="AND">AND</option>
                        <option value="OR">OR</option>
                      </select>
                    }
                    <select 
                      class="field-select"
                      [value]="filter.field?.id"
                      (change)="updateFilterField(i, $any($event.target).value)">
                      <option value="">Select field...</option>
                      @for (field of availableFilterFields(); track field.id) {
                        <option [value]="field.id">{{ field.name }}</option>
                      }
                    </select>
                    <select 
                      class="operator-select"
                      [value]="filter.operator"
                      (change)="updateFilterOperator(i, $any($event.target).value)">
                      @for (op of getOperatorsForField(filter.field); track op.value) {
                        <option [value]="op.value">{{ op.label }}</option>
                      }
                    </select>
                    @if (!isNoValueOperator(filter.operator)) {
                      @if (filter.field?.type === 'date') {
                        <input 
                          type="date" 
                          class="value-input"
                          [value]="filter.value"
                          (change)="updateFilterValue(i, $any($event.target).value)">
                      } @else if (filter.field?.type === 'boolean') {
                        <select 
                          class="value-select"
                          [value]="filter.value"
                          (change)="updateFilterValue(i, $any($event.target).value)">
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      } @else {
                        <input 
                          type="text" 
                          class="value-input"
                          placeholder="Enter value..."
                          [value]="filter.value"
                          (input)="updateFilterValue(i, $any($event.target).value)">
                      }
                    }
                    <button class="remove-filter-btn" (click)="removeFilter(i)">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                }
              </div>
            }
            <button class="btn btn-secondary add-filter-btn" (click)="addFilter()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Filter
            </button>
          </div>

          <div class="step-actions">
            <button class="btn btn-secondary" (click)="prevStep()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              Back
            </button>
            <button class="btn btn-primary" (click)="nextStep()">
              Continue
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>
        </div>
      }

      <!-- Step 4: Sorting & Grouping -->
      @if (currentStep() === 4) {
        <div class="step-content">
          <h2>Sorting & Grouping</h2>
          <p class="step-description">Configure how your data should be organized</p>
          
          <div class="sort-group-layout">
            <!-- Sorting -->
            <div class="config-section">
              <h3>Sort Order</h3>
              <div class="sort-list">
                @for (sort of sorting(); track $index; let i = $index) {
                  <div class="sort-row">
                    <select 
                      class="field-select"
                      [value]="sort.field?.id"
                      (change)="updateSortField(i, $any($event.target).value)">
                      <option value="">Select field...</option>
                      @for (field of selectedFields(); track field.field.id) {
                        <option [value]="field.field.id">{{ field.field.name }}</option>
                      }
                    </select>
                    <div class="direction-toggle">
                      <button 
                        [class.active]="sort.direction === 'asc'"
                        (click)="updateSortDirection(i, 'asc')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <line x1="12" y1="19" x2="12" y2="5"/>
                          <polyline points="5 12 12 5 19 12"/>
                        </svg>
                        Ascending
                      </button>
                      <button 
                        [class.active]="sort.direction === 'desc'"
                        (click)="updateSortDirection(i, 'desc')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <line x1="12" y1="5" x2="12" y2="19"/>
                          <polyline points="19 12 12 19 5 12"/>
                        </svg>
                        Descending
                      </button>
                    </div>
                    <button class="remove-btn" (click)="removeSort(i)">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                }
                <button class="btn btn-secondary btn-sm" (click)="addSort()">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add Sort
                </button>
              </div>
            </div>

            <!-- Grouping -->
            <div class="config-section">
              <h3>Group By</h3>
              <div class="group-list">
                @for (groupField of groupBy(); track groupField; let i = $index) {
                  <div class="group-row">
                    <select 
                      class="field-select"
                      [value]="groupField"
                      (change)="updateGroupField(i, $any($event.target).value)">
                      <option value="">Select field...</option>
                      @for (field of groupableFields(); track field.id) {
                        <option [value]="field.id">{{ field.name }}</option>
                      }
                    </select>
                    <button class="remove-btn" (click)="removeGroup(i)">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                }
                <button class="btn btn-secondary btn-sm" (click)="addGroup()">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add Group
                </button>
              </div>
            </div>
          </div>

          <div class="step-actions">
            <button class="btn btn-secondary" (click)="prevStep()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              Back
            </button>
            <button class="btn btn-primary" (click)="nextStep()">
              Preview Report
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>
        </div>
      }

      <!-- Step 5: Preview -->
      @if (currentStep() === 5) {
        <div class="step-content">
          <h2>Preview Report</h2>
          <p class="step-description">Review your report configuration and preview the results</p>
          
          <div class="preview-layout">
            <!-- Config Summary -->
            <div class="config-summary">
              <h3>Report Configuration</h3>
              <div class="summary-item">
                <span class="label">Data Source:</span>
                <span class="value">{{ selectedDataSource()?.name }}</span>
              </div>
              <div class="summary-item">
                <span class="label">Fields:</span>
                <span class="value">{{ selectedFields().length }} selected</span>
              </div>
              <div class="summary-item">
                <span class="label">Filters:</span>
                <span class="value">{{ filters().length }} conditions</span>
              </div>
              <div class="summary-item">
                <span class="label">Sorting:</span>
                <span class="value">{{ sorting().length }} rules</span>
              </div>
              <div class="summary-item">
                <span class="label">Grouping:</span>
                <span class="value">{{ groupBy().length }} fields</span>
              </div>
            </div>

            <!-- Preview Table -->
            <div class="preview-table-container">
              <div class="preview-header">
                <h3>Data Preview (showing {{ previewData().length }} of {{ totalRows() }} rows)</h3>
                <div class="preview-actions">
                  <button class="btn btn-sm btn-secondary" (click)="refreshPreview()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="23 4 23 10 17 10"/>
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                    </svg>
                    Refresh
                  </button>
                  <button class="btn btn-sm btn-primary" (click)="runReport()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    Run Full Report
                  </button>
                </div>
              </div>
              <div class="preview-table-wrapper">
                <table class="preview-table">
                  <thead>
                    <tr>
                      @for (field of selectedFields(); track field.field.id) {
                        <th>{{ field.field.name }}</th>
                      }
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of previewData(); track $index) {
                      <tr>
                        @for (field of selectedFields(); track field.field.id) {
                          <td>{{ formatCellValue(row[field.field.id], field.field) }}</td>
                        }
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="step-actions">
            <button class="btn btn-secondary" (click)="prevStep()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              Back
            </button>
            <button class="btn btn-success" (click)="showSaveModal.set(true)">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              Save Report
            </button>
          </div>
        </div>
      }

      <!-- Save Modal -->
      @if (showSaveModal()) {
        <div class="modal-overlay" (click)="showSaveModal.set(false)">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Save Report</h2>
              <button class="close-btn" (click)="showSaveModal.set(false)">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form [formGroup]="saveForm" (ngSubmit)="saveReport()">
              <div class="modal-body">
                <div class="form-group">
                  <label for="reportName">Report Name *</label>
                  <input 
                    type="text" 
                    id="reportName" 
                    formControlName="name"
                    placeholder="Enter report name...">
                </div>
                <div class="form-group">
                  <label for="reportDescription">Description</label>
                  <textarea 
                    id="reportDescription" 
                    formControlName="description"
                    placeholder="Describe your report..."
                    rows="3"></textarea>
                </div>
                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" formControlName="isPublic">
                    <span>Make this report available to all users</span>
                  </label>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="showSaveModal.set(false)">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="!saveForm.valid">Save Report</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Saved Reports Modal -->
      @if (showSavedReports()) {
        <div class="modal-overlay" (click)="showSavedReports.set(false)">
          <div class="modal modal-lg" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Saved Reports</h2>
              <button class="close-btn" (click)="showSavedReports.set(false)">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="saved-reports-list">
                @for (report of savedReports(); track report.id) {
                  <div class="saved-report-item">
                    <div class="report-info">
                      <h4>{{ report.name }}</h4>
                      <p>{{ report.description }}</p>
                      <span class="meta">Created {{ formatDate(report.createdAt) }}</span>
                    </div>
                    <div class="report-actions">
                      <button class="btn btn-sm btn-secondary" (click)="loadReport(report)">Load</button>
                      <button class="btn btn-sm btn-secondary" (click)="runSavedReport(report)">Run</button>
                      <button class="btn btn-sm btn-danger" (click)="deleteReport(report)">Delete</button>
                    </div>
                  </div>
                }
                @if (savedReports().length === 0) {
                  <div class="empty-state">
                    <p>No saved reports</p>
                    <span>Create and save a report to see it here</span>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .report-builder {
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
      font-size: 1.75rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 0.25rem 0;
    }

    .subtitle {
      color: #6b7280;
      margin: 0;
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
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.15s;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary { background: #3b82f6; color: white; }
    .btn-primary:hover:not(:disabled) { background: #2563eb; }
    .btn-secondary { background: white; color: #374151; border: 1px solid #d1d5db; }
    .btn-secondary:hover:not(:disabled) { background: #f9fafb; }
    .btn-success { background: #22c55e; color: white; }
    .btn-success:hover:not(:disabled) { background: #16a34a; }
    .btn-danger { background: #ef4444; color: white; }
    .btn-danger:hover:not(:disabled) { background: #dc2626; }
    .btn-text { background: none; color: #6b7280; padding: 0.25rem 0.5rem; }
    .btn-text:hover { color: #374151; }
    .btn-sm { padding: 0.375rem 0.75rem; font-size: 0.8125rem; }

    /* Builder Steps */
    .builder-steps {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 2rem;
      padding: 1rem;
      background: white;
      border-radius: 0.5rem;
      border: 1px solid #e5e7eb;
    }

    .step {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      cursor: pointer;
      opacity: 0.5;
      transition: all 0.15s;
    }

    .step.active {
      opacity: 1;
    }

    .step.completed .step-number {
      background: #22c55e;
      color: white;
    }

    .step-number {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      font-weight: 600;
      color: #6b7280;
    }

    .step.active .step-number {
      background: #3b82f6;
      color: white;
    }

    .step-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }

    .step-connector {
      width: 40px;
      height: 2px;
      background: #e5e7eb;
    }

    .step-connector.active {
      background: #22c55e;
    }

    /* Step Content */
    .step-content {
      background: white;
      border-radius: 0.5rem;
      border: 1px solid #e5e7eb;
      padding: 1.5rem;
    }

    .step-content h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 0.25rem 0;
    }

    .step-description {
      color: #6b7280;
      margin: 0 0 1.5rem 0;
    }

    .step-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    /* Data Source Grid */
    .data-source-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1rem;
    }

    .data-source-card {
      padding: 1.25rem;
      border: 2px solid #e5e7eb;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.15s;
    }

    .data-source-card:hover {
      border-color: #3b82f6;
      background: #f8fafc;
    }

    .data-source-card.selected {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .source-icon {
      width: 40px;
      height: 40px;
      margin-bottom: 0.75rem;
      color: #3b82f6;
    }

    .source-icon svg {
      width: 100%;
      height: 100%;
    }

    .data-source-card h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 0.5rem 0;
    }

    .data-source-card p {
      font-size: 0.875rem;
      color: #6b7280;
      margin: 0 0 0.75rem 0;
    }

    .field-count {
      font-size: 0.75rem;
      color: #9ca3af;
    }

    /* Fields Layout */
    .fields-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .fields-panel {
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }

    .panel-header h3 {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      margin: 0;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 0.75rem;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
    }

    .search-box input {
      border: none;
      outline: none;
      font-size: 0.875rem;
      width: 150px;
    }

    .fields-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .field-category {
      border-bottom: 1px solid #e5e7eb;
    }

    .category-header {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      background: none;
      border: none;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      cursor: pointer;
      text-align: left;
    }

    .category-header:hover {
      background: #f9fafb;
    }

    .category-header svg {
      transition: transform 0.15s;
    }

    .category-header svg.rotated {
      transform: rotate(90deg);
    }

    .category-fields {
      padding: 0.25rem 0;
    }

    .field-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem 0.5rem 2rem;
      cursor: pointer;
      transition: background 0.15s;
    }

    .field-item:hover {
      background: #f3f4f6;
    }

    .field-item.selected {
      background: #eff6ff;
    }

    .field-type-icon {
      width: 20px;
      height: 20px;
      border-radius: 0.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.6875rem;
      font-weight: 600;
    }

    .type-string { background: #dbeafe; color: #1d4ed8; }
    .type-number { background: #dcfce7; color: #16a34a; }
    .type-date { background: #fef3c7; color: #d97706; }
    .type-boolean { background: #ede9fe; color: #7c3aed; }
    .type-currency { background: #d1fae5; color: #059669; }

    .field-name {
      flex: 1;
      font-size: 0.875rem;
      color: #374151;
    }

    .check-icon {
      color: #3b82f6;
    }

    /* Selected Fields */
    .selected-fields-list {
      min-height: 300px;
      max-height: 400px;
      overflow-y: auto;
      padding: 0.5rem;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      text-align: center;
      color: #6b7280;
    }

    .empty-state p {
      margin: 0;
      font-weight: 500;
    }

    .empty-state span {
      font-size: 0.875rem;
    }

    .selected-field-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
      margin-bottom: 0.5rem;
      cursor: move;
    }

    .drag-handle {
      color: #9ca3af;
    }

    .field-info {
      flex: 1;
    }

    .field-info .field-name {
      display: block;
      font-weight: 500;
    }

    .field-info .field-type {
      font-size: 0.75rem;
      color: #9ca3af;
    }

    .aggregation-select {
      padding: 0.25rem 0.5rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.25rem;
      font-size: 0.8125rem;
    }

    .remove-btn {
      padding: 0.25rem;
      background: none;
      border: none;
      color: #9ca3af;
      cursor: pointer;
    }

    .remove-btn:hover {
      color: #ef4444;
    }

    /* Filters */
    .filters-container {
      padding: 1rem;
      background: #f9fafb;
      border-radius: 0.5rem;
    }

    .empty-filters {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      text-align: center;
      color: #9ca3af;
    }

    .empty-filters p {
      margin: 1rem 0 0.25rem 0;
      font-weight: 500;
      color: #6b7280;
    }

    .empty-filters span {
      font-size: 0.875rem;
    }

    .filter-list {
      margin-bottom: 1rem;
    }

    .filter-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .conjunction-select {
      width: 70px;
    }

    .field-select {
      min-width: 180px;
    }

    .operator-select {
      min-width: 140px;
    }

    .value-input, .value-select {
      min-width: 160px;
    }

    .filter-row select,
    .filter-row input {
      padding: 0.5rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
      font-size: 0.875rem;
    }

    .remove-filter-btn {
      padding: 0.5rem;
      background: none;
      border: none;
      color: #9ca3af;
      cursor: pointer;
    }

    .remove-filter-btn:hover {
      color: #ef4444;
    }

    .add-filter-btn {
      width: 100%;
    }

    /* Sort & Group */
    .sort-group-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .config-section {
      padding: 1rem;
      background: #f9fafb;
      border-radius: 0.5rem;
    }

    .config-section h3 {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      margin: 0 0 1rem 0;
    }

    .sort-list, .group-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .sort-row, .group-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .sort-row select, .group-row select {
      flex: 1;
      padding: 0.5rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
      font-size: 0.875rem;
    }

    .direction-toggle {
      display: flex;
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
      overflow: hidden;
    }

    .direction-toggle button {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.375rem 0.625rem;
      background: white;
      border: none;
      font-size: 0.8125rem;
      cursor: pointer;
    }

    .direction-toggle button.active {
      background: #3b82f6;
      color: white;
    }

    /* Preview */
    .preview-layout {
      display: grid;
      grid-template-columns: 250px 1fr;
      gap: 1.5rem;
    }

    .config-summary {
      padding: 1rem;
      background: #f9fafb;
      border-radius: 0.5rem;
    }

    .config-summary h3 {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      margin: 0 0 1rem 0;
    }

    .summary-item {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .summary-item .label {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .summary-item .value {
      font-size: 0.875rem;
      font-weight: 500;
      color: #111827;
    }

    .preview-table-container {
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }

    .preview-header h3 {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      margin: 0;
    }

    .preview-actions {
      display: flex;
      gap: 0.5rem;
    }

    .preview-table-wrapper {
      max-height: 400px;
      overflow: auto;
    }

    .preview-table {
      width: 100%;
      border-collapse: collapse;
    }

    .preview-table th,
    .preview-table td {
      padding: 0.625rem 0.75rem;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
      font-size: 0.875rem;
    }

    .preview-table th {
      background: #f9fafb;
      font-weight: 500;
      color: #6b7280;
      position: sticky;
      top: 0;
    }

    .preview-table td {
      color: #374151;
    }

    .preview-table tbody tr:hover {
      background: #f9fafb;
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
    }

    .modal {
      background: white;
      border-radius: 0.5rem;
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow: hidden;
    }

    .modal.modal-lg {
      max-width: 700px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h2 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      color: #6b7280;
      cursor: pointer;
    }

    .modal-body {
      padding: 1.25rem;
      max-height: 60vh;
      overflow-y: auto;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-top: 1px solid #e5e7eb;
      background: #f9fafb;
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

    .form-group input,
    .form-group textarea {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    .checkbox-label input {
      width: auto;
    }

    /* Saved Reports */
    .saved-reports-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .saved-report-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 0.5rem;
    }

    .report-info h4 {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 0.25rem 0;
    }

    .report-info p {
      font-size: 0.875rem;
      color: #6b7280;
      margin: 0 0 0.25rem 0;
    }

    .report-info .meta {
      font-size: 0.75rem;
      color: #9ca3af;
    }

    .report-actions {
      display: flex;
      gap: 0.5rem;
    }

    @media (max-width: 768px) {
      .fields-layout,
      .sort-group-layout,
      .preview-layout {
        grid-template-columns: 1fr;
      }

      .builder-steps {
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .step-connector {
        display: none;
      }

      .filter-row {
        flex-wrap: wrap;
      }
    }
  `]
})
export class ReportBuilderComponent implements OnInit {
  private fb = inject(FormBuilder);
  private reportsService = inject(ReportsService);
  private sanitizer = inject(DomSanitizer);

  // State
  currentStep = signal(1);
  selectedDataSource = signal<DataSource | null>(null);
  selectedFields = signal<SelectedField[]>([]);
  filters = signal<FilterCondition[]>([]);
  sorting = signal<SortOption[]>([{ field: null, direction: 'asc' }]);
  groupBy = signal<string[]>([]);
  fieldSearch = signal('');
  expandedCategories = signal<Set<string>>(new Set(['Patient Information']));
  
  showSaveModal = signal(false);
  showSavedReports = signal(false);
  draggedIndex: number | null = null;
  
  saveForm: FormGroup;
  
  // Mock data
  savedReports = signal<SavedReport[]>([
    {
      id: '1',
      name: 'Monthly Patient Census',
      description: 'Patient counts by provider and location',
      dataSource: 'patients',
      fields: [],
      filters: [],
      sorting: [],
      groupBy: [],
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: '2',
      name: 'Appointment No-Show Report',
      description: 'Track no-shows and cancellations',
      dataSource: 'appointments',
      fields: [],
      filters: [],
      sorting: [],
      groupBy: [],
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-20')
    }
  ]);

  previewData = signal<any[]>([]);
  totalRows = signal(0);

  // Data sources
  dataSources: DataSource[] = [
    {
      id: 'patients',
      name: 'Patients',
      description: 'Patient demographics and contact information',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      fields: [
        { id: 'patientId', name: 'Patient ID', type: 'string', category: 'Patient Information' },
        { id: 'firstName', name: 'First Name', type: 'string', category: 'Patient Information' },
        { id: 'lastName', name: 'Last Name', type: 'string', category: 'Patient Information' },
        { id: 'dob', name: 'Date of Birth', type: 'date', category: 'Patient Information' },
        { id: 'gender', name: 'Gender', type: 'string', category: 'Patient Information' },
        { id: 'email', name: 'Email', type: 'string', category: 'Contact' },
        { id: 'phone', name: 'Phone', type: 'string', category: 'Contact' },
        { id: 'address', name: 'Address', type: 'string', category: 'Contact' },
        { id: 'city', name: 'City', type: 'string', category: 'Contact' },
        { id: 'state', name: 'State', type: 'string', category: 'Contact' },
        { id: 'zip', name: 'ZIP Code', type: 'string', category: 'Contact' },
        { id: 'insuranceProvider', name: 'Insurance Provider', type: 'string', category: 'Insurance' },
        { id: 'insuranceId', name: 'Insurance ID', type: 'string', category: 'Insurance' },
        { id: 'createdAt', name: 'Created Date', type: 'date', category: 'System' },
        { id: 'lastVisit', name: 'Last Visit', type: 'date', category: 'System' },
        { id: 'isActive', name: 'Active', type: 'boolean', category: 'System' }
      ]
    },
    {
      id: 'appointments',
      name: 'Appointments',
      description: 'Scheduling and appointment data',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
      fields: [
        { id: 'appointmentId', name: 'Appointment ID', type: 'string', category: 'Appointment' },
        { id: 'patientName', name: 'Patient Name', type: 'string', category: 'Appointment' },
        { id: 'providerName', name: 'Provider', type: 'string', category: 'Appointment' },
        { id: 'appointmentDate', name: 'Date', type: 'date', category: 'Appointment' },
        { id: 'appointmentTime', name: 'Time', type: 'string', category: 'Appointment' },
        { id: 'duration', name: 'Duration (min)', type: 'number', category: 'Appointment' },
        { id: 'appointmentType', name: 'Type', type: 'string', category: 'Appointment' },
        { id: 'status', name: 'Status', type: 'string', category: 'Appointment' },
        { id: 'location', name: 'Location', type: 'string', category: 'Appointment' },
        { id: 'checkInTime', name: 'Check-in Time', type: 'string', category: 'Metrics' },
        { id: 'waitTime', name: 'Wait Time (min)', type: 'number', category: 'Metrics' },
        { id: 'noShow', name: 'No Show', type: 'boolean', category: 'Metrics' }
      ]
    },
    {
      id: 'encounters',
      name: 'Encounters',
      description: 'Clinical encounters and visit data',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
      fields: [
        { id: 'encounterId', name: 'Encounter ID', type: 'string', category: 'Encounter' },
        { id: 'patientName', name: 'Patient Name', type: 'string', category: 'Encounter' },
        { id: 'providerName', name: 'Provider', type: 'string', category: 'Encounter' },
        { id: 'encounterDate', name: 'Date', type: 'date', category: 'Encounter' },
        { id: 'encounterType', name: 'Type', type: 'string', category: 'Encounter' },
        { id: 'chiefComplaint', name: 'Chief Complaint', type: 'string', category: 'Clinical' },
        { id: 'diagnosis', name: 'Diagnosis', type: 'string', category: 'Clinical' },
        { id: 'procedures', name: 'Procedures', type: 'string', category: 'Clinical' },
        { id: 'charges', name: 'Charges', type: 'currency', category: 'Financial' },
        { id: 'payments', name: 'Payments', type: 'currency', category: 'Financial' }
      ]
    },
    {
      id: 'claims',
      name: 'Claims',
      description: 'Billing claims and payment data',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
      fields: [
        { id: 'claimId', name: 'Claim ID', type: 'string', category: 'Claim' },
        { id: 'patientName', name: 'Patient Name', type: 'string', category: 'Claim' },
        { id: 'serviceDate', name: 'Service Date', type: 'date', category: 'Claim' },
        { id: 'submissionDate', name: 'Submission Date', type: 'date', category: 'Claim' },
        { id: 'payer', name: 'Payer', type: 'string', category: 'Claim' },
        { id: 'status', name: 'Status', type: 'string', category: 'Claim' },
        { id: 'billedAmount', name: 'Billed Amount', type: 'currency', category: 'Financial' },
        { id: 'allowedAmount', name: 'Allowed Amount', type: 'currency', category: 'Financial' },
        { id: 'paidAmount', name: 'Paid Amount', type: 'currency', category: 'Financial' },
        { id: 'adjustments', name: 'Adjustments', type: 'currency', category: 'Financial' },
        { id: 'patientResponsibility', name: 'Patient Responsibility', type: 'currency', category: 'Financial' },
        { id: 'daysToPayment', name: 'Days to Payment', type: 'number', category: 'Metrics' }
      ]
    }
  ];

  // Computed
  fieldCategories = computed(() => {
    const source = this.selectedDataSource();
    if (!source) return [];
    const categories = new Set(source.fields.map(f => f.category));
    return Array.from(categories);
  });

  availableFilterFields = computed(() => {
    return this.selectedDataSource()?.fields || [];
  });

  groupableFields = computed(() => {
    return this.selectedFields()
      .filter(f => f.field.type === 'string' || f.field.type === 'date')
      .map(f => f.field);
  });

  constructor() {
    this.saveForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      isPublic: [false]
    });
  }

  ngOnInit(): void {
    this.generatePreviewData();
  }

  canSaveReport(): boolean {
    return this.selectedDataSource() !== null && this.selectedFields().length > 0;
  }

  goToStep(step: number): void {
    if (step === 1 || this.selectedDataSource()) {
      this.currentStep.set(step);
    }
  }

  nextStep(): void {
    const current = this.currentStep();
    if (current < 5) {
      this.currentStep.set(current + 1);
      if (current === 4) {
        this.generatePreviewData();
      }
    }
  }

  prevStep(): void {
    const current = this.currentStep();
    if (current > 1) {
      this.currentStep.set(current - 1);
    }
  }

  selectDataSource(source: DataSource): void {
    this.selectedDataSource.set(source);
    this.selectedFields.set([]);
    this.filters.set([]);
    this.sorting.set([{ field: null, direction: 'asc' }]);
    this.groupBy.set([]);
  }

  toggleCategory(category: string): void {
    const expanded = new Set(this.expandedCategories());
    if (expanded.has(category)) {
      expanded.delete(category);
    } else {
      expanded.add(category);
    }
    this.expandedCategories.set(expanded);
  }

  getFieldsByCategory(category: string): DataField[] {
    const search = this.fieldSearch().toLowerCase();
    return this.selectedDataSource()?.fields.filter(f => 
      f.category === category && 
      (search === '' || f.name.toLowerCase().includes(search))
    ) || [];
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'string': return 'Aa';
      case 'number': return '#';
      case 'date': return 'D';
      case 'boolean': return '✓';
      case 'currency': return '$';
      default: return '?';
    }
  }

  isFieldSelected(field: DataField): boolean {
    return this.selectedFields().some(f => f.field.id === field.id);
  }

  toggleField(field: DataField): void {
    const fields = this.selectedFields();
    const index = fields.findIndex(f => f.field.id === field.id);
    
    if (index >= 0) {
      this.selectedFields.set([...fields.slice(0, index), ...fields.slice(index + 1)]);
    } else {
      this.selectedFields.set([...fields, { field, aggregation: 'none', visible: true }]);
    }
  }

  clearSelectedFields(): void {
    this.selectedFields.set([]);
  }

  setAggregation(index: number, aggregation: string): void {
    const fields = [...this.selectedFields()];
    fields[index] = { ...fields[index], aggregation: aggregation as any };
    this.selectedFields.set(fields);
  }

  removeField(index: number): void {
    const fields = this.selectedFields();
    this.selectedFields.set([...fields.slice(0, index), ...fields.slice(index + 1)]);
  }

  onDragStart(event: DragEvent, index: number): void {
    this.draggedIndex = index;
  }

  onDragEnd(): void {
    this.draggedIndex = null;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    // Simple reorder - could be enhanced
  }

  // Filters
  addFilter(): void {
    const filters = this.filters();
    this.filters.set([...filters, {
      id: `filter-${Date.now()}`,
      field: null,
      operator: 'equals',
      value: '',
      conjunction: 'AND'
    }]);
  }

  removeFilter(index: number): void {
    const filters = this.filters();
    this.filters.set([...filters.slice(0, index), ...filters.slice(index + 1)]);
  }

  updateFilterField(index: number, fieldId: string): void {
    const filters = [...this.filters()];
    const field = this.availableFilterFields().find(f => f.id === fieldId) || null;
    filters[index] = { ...filters[index], field, operator: 'equals', value: '' };
    this.filters.set(filters);
  }

  updateFilterOperator(index: number, operator: string): void {
    const filters = [...this.filters()];
    filters[index] = { ...filters[index], operator };
    this.filters.set(filters);
  }

  updateFilterValue(index: number, value: string): void {
    const filters = [...this.filters()];
    filters[index] = { ...filters[index], value };
    this.filters.set(filters);
  }

  updateFilterConjunction(index: number, conjunction: 'AND' | 'OR'): void {
    const filters = [...this.filters()];
    filters[index] = { ...filters[index], conjunction };
    this.filters.set(filters);
  }

  getOperatorsForField(field: DataField | null): { value: string; label: string }[] {
    if (!field) {
      return [{ value: 'equals', label: 'Equals' }];
    }

    const commonOps = [
      { value: 'equals', label: 'Equals' },
      { value: 'not_equals', label: 'Not Equals' },
      { value: 'is_null', label: 'Is Empty' },
      { value: 'is_not_null', label: 'Is Not Empty' }
    ];

    switch (field.type) {
      case 'string':
        return [
          ...commonOps,
          { value: 'contains', label: 'Contains' },
          { value: 'starts_with', label: 'Starts With' },
          { value: 'ends_with', label: 'Ends With' }
        ];
      case 'number':
      case 'currency':
        return [
          ...commonOps,
          { value: 'greater_than', label: 'Greater Than' },
          { value: 'less_than', label: 'Less Than' },
          { value: 'between', label: 'Between' }
        ];
      case 'date':
        return [
          ...commonOps,
          { value: 'before', label: 'Before' },
          { value: 'after', label: 'After' },
          { value: 'between', label: 'Between' }
        ];
      case 'boolean':
        return [
          { value: 'equals', label: 'Equals' }
        ];
      default:
        return commonOps;
    }
  }

  isNoValueOperator(operator: string): boolean {
    return ['is_null', 'is_not_null'].includes(operator);
  }

  // Sorting
  addSort(): void {
    const sorting = this.sorting();
    this.sorting.set([...sorting, { field: null, direction: 'asc' }]);
  }

  removeSort(index: number): void {
    const sorting = this.sorting();
    this.sorting.set([...sorting.slice(0, index), ...sorting.slice(index + 1)]);
  }

  updateSortField(index: number, fieldId: string): void {
    const sorting = [...this.sorting()];
    const selected = this.selectedFields().find(f => f.field.id === fieldId);
    sorting[index] = { ...sorting[index], field: selected?.field || null };
    this.sorting.set(sorting);
  }

  updateSortDirection(index: number, direction: 'asc' | 'desc'): void {
    const sorting = [...this.sorting()];
    sorting[index] = { ...sorting[index], direction };
    this.sorting.set(sorting);
  }

  // Grouping
  addGroup(): void {
    const groupBy = this.groupBy();
    this.groupBy.set([...groupBy, '']);
  }

  removeGroup(index: number): void {
    const groupBy = this.groupBy();
    this.groupBy.set([...groupBy.slice(0, index), ...groupBy.slice(index + 1)]);
  }

  updateGroupField(index: number, fieldId: string): void {
    const groupBy = [...this.groupBy()];
    groupBy[index] = fieldId;
    this.groupBy.set(groupBy);
  }

  // Preview
  generatePreviewData(): void {
    const fields = this.selectedFields();
    if (fields.length === 0) {
      this.previewData.set([]);
      this.totalRows.set(0);
      return;
    }

    // Generate mock data
    const rows: any[] = [];
    const total = Math.floor(Math.random() * 200) + 50;
    
    for (let i = 0; i < Math.min(10, total); i++) {
      const row: any = {};
      for (const selected of fields) {
        row[selected.field.id] = this.generateMockValue(selected.field);
      }
      rows.push(row);
    }

    this.previewData.set(rows);
    this.totalRows.set(total);
  }

  generateMockValue(field: DataField): any {
    switch (field.type) {
      case 'string':
        if (field.id.includes('Name')) return ['John Smith', 'Jane Doe', 'Mike Johnson'][Math.floor(Math.random() * 3)];
        if (field.id.includes('status')) return ['Active', 'Pending', 'Completed'][Math.floor(Math.random() * 3)];
        return `${field.name} ${Math.floor(Math.random() * 100)}`;
      case 'number':
        return Math.floor(Math.random() * 100);
      case 'currency':
        return Math.floor(Math.random() * 10000) / 100;
      case 'date':
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 365));
        return date.toISOString().split('T')[0];
      case 'boolean':
        return Math.random() > 0.5;
      default:
        return null;
    }
  }

  formatCellValue(value: any, field: DataField): string {
    if (value === null || value === undefined) return '-';
    
    switch (field.type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'date':
        return new Date(value).toLocaleDateString();
      default:
        return String(value);
    }
  }

  refreshPreview(): void {
    this.generatePreviewData();
  }

  runReport(): void {
    console.log('Running full report...');
  }

  saveReport(): void {
    if (this.saveForm.valid) {
      const formValue = this.saveForm.value;
      const newReport: SavedReport = {
        id: `report-${Date.now()}`,
        name: formValue.name,
        description: formValue.description,
        dataSource: this.selectedDataSource()?.id || '',
        fields: this.selectedFields(),
        filters: this.filters(),
        sorting: this.sorting(),
        groupBy: this.groupBy(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      this.savedReports.update(reports => [...reports, newReport]);
      this.showSaveModal.set(false);
      this.saveForm.reset();
    }
  }

  loadReport(report: SavedReport): void {
    const source = this.dataSources.find(s => s.id === report.dataSource);
    if (source) {
      this.selectedDataSource.set(source);
      // Would load other settings
      this.showSavedReports.set(false);
      this.currentStep.set(2);
    }
  }

  runSavedReport(report: SavedReport): void {
    console.log('Running saved report:', report.name);
    this.showSavedReports.set(false);
  }

  deleteReport(report: SavedReport): void {
    this.savedReports.update(reports => reports.filter(r => r.id !== report.id));
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  sanitizeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
