import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { DividerModule } from 'primeng/divider';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { MessageService } from 'primeng/api';

import { ExternalDataService } from '../data-access/services/external-data.service';
import { ThemeService } from '../../../core/services/theme.service';
import { MarkdownPipe } from '../../../shared/pipes/markdown.pipe';
import {
  ExternalDataRecord,
  ExternalDataSource,
  ExternalDataType,
  ReviewStatus,
  SOURCE_LABELS,
  SOURCE_ICONS,
  SOURCE_COLORS,
  DATA_TYPE_LABELS,
  DATA_TYPE_ICONS,
  REVIEW_STATUS_LABELS,
  REVIEW_STATUS_COLORS,
} from '../data-access/models/external-data.model';

interface SelectOption {
  label: string;
  value: string;
}

type SortField = 'date' | 'source' | 'urgency' | 'status';

@Component({
  selector: 'app-external-data',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MessageService],
  imports: [
    CommonModule,
    FormsModule,
    MarkdownPipe,
    // PrimeNG
    ButtonModule,
    CardModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
    TagModule,
    BadgeModule,
    TooltipModule,
    ToastModule,
    SkeletonModule,
    DividerModule,
    DialogModule,
    TableModule,
  ],
  template: `
    <p-toast position="top-right" />

    <div class="external-data-container" [class.dark]="themeService.isDarkMode()">

      <!-- Stats Bar -->
      <div class="stats-bar" role="region" aria-label="External data summary">
        <div class="stat-item urgent" [class.has-value]="urgentCount() > 0">
          <div class="stat-icon">
            <i class="pi pi-exclamation-circle"></i>
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ urgentCount() }}</span>
            <span class="stat-label">Urgent</span>
          </div>
          @if (urgentCount() > 0) {
            <span class="stat-pulse" aria-hidden="true"></span>
          }
        </div>

        <div class="stat-divider" aria-hidden="true"></div>

        <div class="stat-item unreviewed" [class.has-value]="unreviewedCount() > 0">
          <div class="stat-icon">
            <i class="pi pi-eye-slash"></i>
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ unreviewedCount() }}</span>
            <span class="stat-label">Unreviewed</span>
          </div>
        </div>

        <div class="stat-divider" aria-hidden="true"></div>

        <div class="stat-item discrepancy" [class.has-value]="discrepancyCount() > 0">
          <div class="stat-icon">
            <i class="pi pi-exclamation-triangle"></i>
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ discrepancyCount() }}</span>
            <span class="stat-label">Discrepancies</span>
          </div>
        </div>

        <div class="stat-divider" aria-hidden="true"></div>

        <div class="stat-item total">
          <div class="stat-icon">
            <i class="pi pi-database"></i>
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ records().length }}</span>
            <span class="stat-label">Total Records</span>
          </div>
        </div>

        <div class="stat-divider" aria-hidden="true"></div>

        <div class="stat-item sources">
          <div class="stat-icon">
            <i class="pi pi-globe"></i>
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ uniqueSourceCount() }}</span>
            <span class="stat-label">Sources</span>
          </div>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar">
        <div class="filter-controls">
          <!-- Search -->
          <span class="search-wrapper">
            <i class="pi pi-search search-icon" aria-hidden="true"></i>
            <input
              pInputText
              type="text"
              class="search-input"
              placeholder="Search records..."
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
              aria-label="Search external data records"
            />
          </span>

          <!-- Source Filter -->
          <p-select
            [options]="sourceOptions"
            [ngModel]="sourceFilter()"
            (ngModelChange)="sourceFilter.set($event)"
            optionLabel="label"
            optionValue="value"
            placeholder="All Sources"
            styleClass="filter-select"
            aria-label="Filter by source"
          />

          <!-- Data Type Filter -->
          <p-select
            [options]="dataTypeOptions"
            [ngModel]="dataTypeFilter()"
            (ngModelChange)="dataTypeFilter.set($event)"
            optionLabel="label"
            optionValue="value"
            placeholder="All Types"
            styleClass="filter-select"
            aria-label="Filter by data type"
          />

          <!-- Review Status Filter -->
          <p-select
            [options]="statusOptions"
            [ngModel]="statusFilter()"
            (ngModelChange)="statusFilter.set($event)"
            optionLabel="label"
            optionValue="value"
            placeholder="All Statuses"
            styleClass="filter-select"
            aria-label="Filter by review status"
          />

          <!-- Sort -->
          <p-select
            [options]="sortOptions"
            [ngModel]="sortField()"
            (ngModelChange)="sortField.set($event)"
            optionLabel="label"
            optionValue="value"
            styleClass="filter-select sort-select"
            aria-label="Sort records by"
          />
        </div>

        <div class="filter-actions">
          @if (hasActiveFilters()) {
            <button class="clear-filters-btn" (click)="clearFilters()" type="button">
              <i class="pi pi-times" aria-hidden="true"></i>
              Clear filters
            </button>
          }
          <span class="record-count" role="status" aria-live="polite">
            {{ filteredRecords().length }} of {{ records().length }} records
          </span>
        </div>
      </div>

      <!-- Body -->
      <div class="body-layout" [class.has-detail]="selectedRecord() !== null">

        <!-- Timeline / List -->
        <div class="timeline-panel" role="feed" aria-label="External data records timeline">

          <!-- Loading -->
          @if (loading()) {
            <div class="skeleton-list" aria-label="Loading records">
              @for (i of [1,2,3,4]; track i) {
                <div class="record-skeleton">
                  <div class="skeleton-left">
                    <p-skeleton shape="circle" size="44px" />
                  </div>
                  <div class="skeleton-right">
                    <p-skeleton width="55%" height="1.125rem" styleClass="mb-2" />
                    <p-skeleton width="35%" height="0.875rem" styleClass="mb-3" />
                    <p-skeleton width="90%" height="0.875rem" />
                  </div>
                </div>
              }
            </div>
          }

          <!-- Empty State -->
          @else if (filteredRecords().length === 0) {
            <div class="empty-state" role="status">
              <div class="empty-icon">
                <i class="pi pi-globe"></i>
              </div>
              <h3>No external records found</h3>
              <p>
                @if (hasActiveFilters()) {
                  No records match your current filters.
                  <button class="link-btn" (click)="clearFilters()" type="button">Clear filters</button>
                } @else {
                  No external data has been received for this patient.
                }
              </p>
            </div>
          }

          <!-- Records Timeline -->
          @else {
            <div class="timeline-list">
              @for (record of filteredRecords(); track record.id) {
                <article
                  class="timeline-entry"
                  [class.is-urgent]="record.isUrgent"
                  [class.has-discrepancy]="record.hasDiscrepancy"
                  [class.is-selected]="selectedRecord()?.id === record.id"
                  [class.is-dismissed]="record.reviewStatus === 'dismissed'"
                  [style.--source-color]="getSourceBorder(record.source)"
                  (click)="selectRecord(record)"
                  (keydown.enter)="selectRecord(record)"
                  (keydown.space)="$event.preventDefault(); selectRecord(record)"
                  tabindex="0"
                  role="article"
                  [attr.aria-label]="record.title"
                  [attr.aria-selected]="selectedRecord()?.id === record.id"
                >
                  <!-- Urgent Banner -->
                  @if (record.isUrgent) {
                    <div class="urgent-banner" role="alert">
                      <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
                      Urgent – Requires Immediate Review
                    </div>
                  }

                  <!-- Discrepancy Warning -->
                  @if (record.hasDiscrepancy) {
                    <div class="discrepancy-banner" role="alert">
                      <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
                      Discrepancy Detected – Review Required
                    </div>
                  }

                  <div class="entry-body">
                    <!-- Source Indicator -->
                    <div class="entry-source-col">
                      <div
                        class="source-icon-wrapper"
                        [style.background]="getSourceBg(record.source)"
                        [style.color]="getSourceText(record.source)"
                        [pTooltip]="SOURCE_LABELS[record.source]"
                        tooltipPosition="right"
                        [attr.aria-label]="SOURCE_LABELS[record.source]"
                      >
                        <i [class]="SOURCE_ICONS[record.source]" aria-hidden="true"></i>
                      </div>
                      <div class="timeline-line" aria-hidden="true"></div>
                    </div>

                    <!-- Entry Content -->
                    <div class="entry-content">
                      <div class="entry-header">
                        <div class="entry-header-left">
                          <!-- Data Type Badge -->
                          <span class="data-type-badge">
                            <i [class]="DATA_TYPE_ICONS[record.dataType]" aria-hidden="true"></i>
                            {{ DATA_TYPE_LABELS[record.dataType] }}
                          </span>

                          <!-- Review Status Badge -->
                          <span
                            class="review-status-badge"
                            [style.background]="getStatusBg(record.reviewStatus)"
                            [style.color]="getStatusText(record.reviewStatus)"
                            [attr.aria-label]="'Status: ' + REVIEW_STATUS_LABELS[record.reviewStatus]"
                          >
                            {{ REVIEW_STATUS_LABELS[record.reviewStatus] }}
                          </span>
                        </div>

                        <div class="entry-header-right">
                          <!-- Source label -->
                          <span
                            class="source-label"
                            [style.color]="getSourceText(record.source)"
                          >
                            {{ SOURCE_LABELS[record.source] }}
                          </span>
                          <!-- Date -->
                          <time
                            class="entry-date"
                            [attr.datetime]="record.originalDate"
                          >
                            {{ record.originalDate | date:'mediumDate' }}
                          </time>
                        </div>
                      </div>

                      <h3 class="entry-title">{{ record.title }}</h3>
                      <p class="entry-summary">{{ record.summary }}</p>

                      <!-- Source name and received date -->
                      <div class="entry-meta">
                        <span class="meta-source-name">
                          <i class="pi pi-building" aria-hidden="true"></i>
                          {{ record.sourceName }}
                        </span>
                        <span class="meta-received">
                          <i class="pi pi-calendar" aria-hidden="true"></i>
                          Received {{ record.receivedDate | date:'shortDate' }}
                        </span>
                        @if (record.tags && record.tags.length > 0) {
                          <span class="meta-tags" aria-label="Tags">
                            @for (tag of record.tags.slice(0, 3); track tag) {
                              <span class="tag-chip">{{ tag }}</span>
                            }
                            @if (record.tags.length > 3) {
                              <span class="tag-chip tag-more">+{{ record.tags.length - 3 }}</span>
                            }
                          </span>
                        }
                      </div>
                    </div>
                  </div>
                </article>
              }
            </div>
          }
        </div>

        <!-- Detail Panel -->
        @if (selectedRecord()) {
          <aside
            class="detail-panel"
            role="complementary"
            aria-label="Record detail"
          >
            <!-- Detail Header -->
            <div class="detail-header">
              <div class="detail-header-top">
                <div
                  class="detail-source-chip"
                  [style.background]="getSourceBg(selectedRecord()!.source)"
                  [style.color]="getSourceText(selectedRecord()!.source)"
                  [style.border-color]="getSourceBorder(selectedRecord()!.source)"
                >
                  <i [class]="SOURCE_ICONS[selectedRecord()!.source]" aria-hidden="true"></i>
                  {{ SOURCE_LABELS[selectedRecord()!.source] }}
                </div>

                <p-button
                  icon="pi pi-times"
                  [rounded]="true"
                  [text]="true"
                  severity="secondary"
                  (onClick)="selectedRecord.set(null)"
                  pTooltip="Close"
                  tooltipPosition="left"
                  aria-label="Close detail panel"
                />
              </div>

              <h2 class="detail-title">{{ selectedRecord()!.title }}</h2>

              <div class="detail-meta-row">
                <span class="data-type-badge">
                  <i [class]="DATA_TYPE_ICONS[selectedRecord()!.dataType]" aria-hidden="true"></i>
                  {{ DATA_TYPE_LABELS[selectedRecord()!.dataType] }}
                </span>
                <span
                  class="review-status-badge"
                  [style.background]="getStatusBg(selectedRecord()!.reviewStatus)"
                  [style.color]="getStatusText(selectedRecord()!.reviewStatus)"
                >
                  {{ REVIEW_STATUS_LABELS[selectedRecord()!.reviewStatus] }}
                </span>
                @if (selectedRecord()!.isUrgent) {
                  <span class="urgent-chip" aria-label="Urgent">
                    <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
                    Urgent
                  </span>
                }
              </div>

              <div class="detail-source-info">
                <div class="source-info-row">
                  <i class="pi pi-building" aria-hidden="true"></i>
                  <span>{{ selectedRecord()!.sourceName }}</span>
                </div>
                <div class="source-info-row">
                  <i class="pi pi-calendar" aria-hidden="true"></i>
                  <span>Original: {{ selectedRecord()!.originalDate | date:'mediumDate' }}</span>
                </div>
                <div class="source-info-row">
                  <i class="pi pi-download" aria-hidden="true"></i>
                  <span>Received: {{ selectedRecord()!.receivedDate | date:'mediumDate' }}</span>
                </div>
                @if (selectedRecord()!.documentId) {
                  <div class="source-info-row">
                    <i class="pi pi-file" aria-hidden="true"></i>
                    <span>Doc ID: {{ selectedRecord()!.documentId }}</span>
                  </div>
                }
              </div>
            </div>

            <p-divider />

            <!-- Urgent Alert -->
            @if (selectedRecord()!.isUrgent) {
              <div class="detail-urgent-alert" role="alert">
                <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
                <div>
                  <strong>Urgent Record</strong>
                  <p>This record has been flagged as urgent and requires immediate clinical review.</p>
                </div>
              </div>
            }

            <!-- Discrepancy Alert -->
            @if (selectedRecord()!.hasDiscrepancy) {
              <div class="detail-discrepancy-alert" role="alert">
                <div class="discrepancy-header">
                  <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
                  <strong>Discrepancy Detected</strong>
                </div>
                @if (selectedRecord()!.discrepancyNotes) {
                  <p class="discrepancy-text">{{ selectedRecord()!.discrepancyNotes }}</p>
                }
                <!-- Discrepancy notes editor -->
                @if (editingDiscrepancy()) {
                  <div class="discrepancy-editor">
                    <textarea
                      pTextarea
                      [(ngModel)]="discrepancyDraft"
                      [rows]="3"
                      placeholder="Add or update discrepancy notes..."
                      class="discrepancy-textarea"
                      aria-label="Discrepancy notes"
                    ></textarea>
                    <div class="discrepancy-editor-actions">
                      <p-button
                        label="Cancel"
                        severity="secondary"
                        [outlined]="true"
                        size="small"
                        (onClick)="cancelDiscrepancyEdit()"
                      />
                      <p-button
                        label="Save Notes"
                        icon="pi pi-check"
                        size="small"
                        (onClick)="saveDiscrepancyNotes()"
                        [loading]="savingDiscrepancy()"
                      />
                    </div>
                  </div>
                } @else {
                  <p-button
                    label="Edit Notes"
                    icon="pi pi-pencil"
                    [text]="true"
                    size="small"
                    (onClick)="startDiscrepancyEdit()"
                  />
                }
              </div>
            }

            <!-- Lab Results Table -->
            @if (selectedRecord()!.labResults && selectedRecord()!.labResults!.length > 0) {
              <div class="detail-section">
                <h4 class="section-heading">
                  <i class="pi pi-chart-bar" aria-hidden="true"></i>
                  Lab Results
                </h4>
                <div class="lab-table-wrapper">
                  <table class="lab-table" role="table" aria-label="Lab results">
                    <thead>
                      <tr>
                        <th scope="col">Test</th>
                        <th scope="col">Value</th>
                        <th scope="col">Reference Range</th>
                        <th scope="col">Flag</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (lab of selectedRecord()!.labResults; track lab.testName) {
                        <tr
                          [class.lab-critical]="lab.isCritical"
                          [class.lab-abnormal]="lab.isAbnormal && !lab.isCritical"
                        >
                          <td class="lab-test-name">{{ lab.testName }}</td>
                          <td class="lab-value">
                            {{ lab.value }}
                            @if (lab.unit) { <span class="lab-unit">{{ lab.unit }}</span> }
                          </td>
                          <td class="lab-range">{{ lab.referenceRange || '—' }}</td>
                          <td class="lab-flag">
                            @if (lab.isCritical) {
                              <span class="flag-critical" aria-label="Critical value">CRITICAL</span>
                            } @else if (lab.isAbnormal) {
                              <span class="flag-abnormal" aria-label="Abnormal value">H/L</span>
                            } @else {
                              <span class="flag-normal" aria-label="Normal value">WNL</span>
                            }
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }

            <!-- Medications Table -->
            @if (selectedRecord()!.medications && selectedRecord()!.medications!.length > 0) {
              <div class="detail-section">
                <h4 class="section-heading">
                  <i class="pi pi-list" aria-hidden="true"></i>
                  Medications
                </h4>
                <div class="medications-list">
                  @for (med of selectedRecord()!.medications; track med.name) {
                    <div
                      class="medication-item"
                      [class.med-discontinued]="med.status === 'discontinued'"
                      [class.med-unknown]="med.status === 'unknown'"
                    >
                      <div class="med-main">
                        <span class="med-name">{{ med.name }}</span>
                        <span class="med-dose">{{ med.dose }}</span>
                        <span class="med-freq">{{ med.frequency }}</span>
                      </div>
                      <div class="med-meta">
                        @if (med.prescriber) {
                          <span class="med-prescriber">
                            <i class="pi pi-user" aria-hidden="true"></i>
                            {{ med.prescriber }}
                          </span>
                        }
                        <span
                          class="med-status-badge"
                          [class.status-active]="med.status === 'active'"
                          [class.status-discontinued]="med.status === 'discontinued'"
                          [class.status-unknown]="med.status === 'unknown'"
                        >
                          {{ med.status | titlecase }}
                        </span>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Vital Signs -->
            @if (selectedRecord()!.vitalSigns && selectedRecord()!.vitalSigns!.length > 0) {
              <div class="detail-section">
                <h4 class="section-heading">
                  <i class="pi pi-chart-line" aria-hidden="true"></i>
                  Vital Signs
                </h4>
                <div class="vitals-grid">
                  @for (vital of selectedRecord()!.vitalSigns; track vital.type) {
                    <div class="vital-chip">
                      <span class="vital-type">{{ vital.type }}</span>
                      <span class="vital-val">{{ vital.value }} <small>{{ vital.unit }}</small></span>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Full Content -->
            <div class="detail-section">
              <h4 class="section-heading">
                <i class="pi pi-file-edit" aria-hidden="true"></i>
                Full Record
              </h4>
              <div
                class="markdown-content"
                [innerHTML]="selectedRecord()!.content | markdown"
                role="article"
                aria-label="Full record content"
              ></div>
            </div>

            <p-divider />

            <!-- Review History -->
            @if (selectedRecord()!.reviewedByName) {
              <div class="detail-section review-history">
                <h4 class="section-heading">
                  <i class="pi pi-history" aria-hidden="true"></i>
                  Review History
                </h4>
                <div class="review-item">
                  <div class="review-item-header">
                    <span class="review-by">
                      <i class="pi pi-user" aria-hidden="true"></i>
                      {{ selectedRecord()!.reviewedByName }}
                    </span>
                    <time class="review-at">
                      {{ selectedRecord()!.reviewedAt | date:'medium' }}
                    </time>
                  </div>
                  <span
                    class="review-status-badge"
                    [style.background]="getStatusBg(selectedRecord()!.reviewStatus)"
                    [style.color]="getStatusText(selectedRecord()!.reviewStatus)"
                  >
                    {{ REVIEW_STATUS_LABELS[selectedRecord()!.reviewStatus] }}
                  </span>
                  @if (selectedRecord()!.reviewNotes) {
                    <p class="review-notes">{{ selectedRecord()!.reviewNotes }}</p>
                  }
                </div>
              </div>
            }

            <!-- Review Actions -->
            @if (selectedRecord()!.reviewStatus !== 'dismissed') {
              <div class="review-actions" role="group" aria-label="Review actions">
                <p class="review-actions-label">Mark as:</p>
                <div class="review-buttons">
                  <p-button
                    label="Reviewed"
                    icon="pi pi-eye"
                    size="small"
                    severity="secondary"
                    [outlined]="selectedRecord()!.reviewStatus !== 'reviewed'"
                    [disabled]="selectedRecord()!.reviewStatus === 'reviewed' || savingReview()"
                    (onClick)="markAs('reviewed')"
                    pTooltip="Mark as reviewed"
                    tooltipPosition="top"
                  />
                  <p-button
                    label="Acknowledged"
                    icon="pi pi-check"
                    size="small"
                    [outlined]="selectedRecord()!.reviewStatus !== 'acknowledged'"
                    [severity]="selectedRecord()!.reviewStatus === 'acknowledged' ? 'info' : 'secondary'"
                    [disabled]="selectedRecord()!.reviewStatus === 'acknowledged' || savingReview()"
                    (onClick)="markAs('acknowledged')"
                    pTooltip="Acknowledge this record"
                    tooltipPosition="top"
                  />
                  <p-button
                    label="Incorporated"
                    icon="pi pi-check-circle"
                    size="small"
                    [outlined]="selectedRecord()!.reviewStatus !== 'incorporated'"
                    [severity]="selectedRecord()!.reviewStatus === 'incorporated' ? 'success' : 'secondary'"
                    [disabled]="selectedRecord()!.reviewStatus === 'incorporated' || savingReview()"
                    (onClick)="markAs('incorporated')"
                    pTooltip="Mark as incorporated into care plan"
                    tooltipPosition="top"
                  />
                  <p-button
                    label="Dismiss"
                    icon="pi pi-times-circle"
                    size="small"
                    severity="danger"
                    [outlined]="true"
                    (onClick)="showDismissDialog.set(true)"
                    pTooltip="Dismiss this record with reason"
                    tooltipPosition="top"
                  />
                </div>

                <!-- Review Notes Input -->
                <div class="review-notes-input">
                  <label for="reviewNotesInput" class="review-notes-label">Review notes (optional)</label>
                  <textarea
                    id="reviewNotesInput"
                    pTextarea
                    [(ngModel)]="reviewNotesDraft"
                    [rows]="2"
                    placeholder="Add notes about this record..."
                    class="review-notes-textarea"
                    aria-label="Review notes"
                  ></textarea>
                </div>
              </div>
            }

          </aside>
        }
      </div>
    </div>

    <!-- Dismiss Dialog -->
    <p-dialog
      header="Dismiss Record"
      [visible]="showDismissDialog()"
      (visibleChange)="showDismissDialog.set($event)"
      [modal]="true"
      [style]="{ width: '480px', maxWidth: '95vw' }"
      [draggable]="false"
      [resizable]="false"
      role="dialog"
      aria-label="Dismiss external record"
    >
      <div class="dismiss-dialog-body">
        <p class="dismiss-description">
          Please provide a reason for dismissing this record. Dismissed records remain visible but are marked as not clinically relevant.
        </p>
        <div class="form-field">
          <label for="dismissReason" class="form-label">
            Reason <span class="required" aria-hidden="true">*</span>
          </label>
          <textarea
            id="dismissReason"
            pTextarea
            [(ngModel)]="dismissReasonDraft"
            [rows]="3"
            placeholder="e.g., Duplicate record, Not clinically relevant, Already incorporated..."
            class="w-full"
            [attr.aria-required]="true"
          ></textarea>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <div class="dialog-footer">
          <p-button
            label="Cancel"
            icon="pi pi-times"
            severity="secondary"
            [outlined]="true"
            (onClick)="showDismissDialog.set(false)"
          />
          <p-button
            label="Dismiss Record"
            icon="pi pi-times-circle"
            severity="danger"
            (onClick)="confirmDismiss()"
            [loading]="savingReview()"
            [disabled]="!dismissReasonDraft.trim()"
          />
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: [
    `
    /* ================================================================
       Container
    ================================================================ */
    .external-data-container {
      display: flex;
      flex-direction: column;
      min-height: 100%;
      background: #f8fafc;
    }

    .dark.external-data-container {
      background: #0f172a;
    }

    /* ================================================================
       Stats Bar
    ================================================================ */
    .stats-bar {
      display: flex;
      align-items: stretch;
      background: white;
      border-bottom: 1px solid #e2e8f0;
      padding: 0.75rem 1.5rem;
      gap: 0;
      flex-wrap: wrap;
    }

    .dark .stats-bar {
      background: #1e293b;
      border-bottom-color: #334155;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.375rem 1.25rem;
      position: relative;
      border-radius: 0.5rem;
      transition: background 0.15s;
    }

    .stat-item:first-child {
      padding-left: 0;
    }

    .stat-icon {
      width: 2rem;
      height: 2rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f1f5f9;
    }

    .dark .stat-icon {
      background: #334155;
    }

    .stat-icon i {
      font-size: 0.875rem;
      color: #64748b;
    }

    .dark .stat-icon i {
      color: #94a3b8;
    }

    .stat-item.urgent .stat-icon { background: #fee2e2; }
    .stat-item.urgent .stat-icon i { color: #dc2626; }
    .dark .stat-item.urgent .stat-icon { background: #7f1d1d; }
    .dark .stat-item.urgent .stat-icon i { color: #fca5a5; }

    .stat-item.unreviewed .stat-icon { background: #fef3c7; }
    .stat-item.unreviewed .stat-icon i { color: #d97706; }
    .dark .stat-item.unreviewed .stat-icon { background: #78350f; }
    .dark .stat-item.unreviewed .stat-icon i { color: #fcd34d; }

    .stat-item.discrepancy .stat-icon { background: #fff7ed; }
    .stat-item.discrepancy .stat-icon i { color: #ea580c; }
    .dark .stat-item.discrepancy .stat-icon { background: #7c2d12; }
    .dark .stat-item.discrepancy .stat-icon i { color: #fdba74; }

    .stat-body {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.375rem;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.1;
    }

    .dark .stat-value {
      color: #f1f5f9;
    }

    .stat-item.urgent.has-value .stat-value { color: #dc2626; }
    .dark .stat-item.urgent.has-value .stat-value { color: #fca5a5; }
    .stat-item.unreviewed.has-value .stat-value { color: #d97706; }
    .dark .stat-item.unreviewed.has-value .stat-value { color: #fcd34d; }
    .stat-item.discrepancy.has-value .stat-value { color: #ea580c; }
    .dark .stat-item.discrepancy.has-value .stat-value { color: #fdba74; }

    .stat-label {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #94a3b8;
    }

    .stat-divider {
      width: 1px;
      background: #e2e8f0;
      align-self: stretch;
      margin: 0 0.125rem;
    }

    .dark .stat-divider {
      background: #334155;
    }

    .stat-pulse {
      position: absolute;
      top: 0.25rem;
      right: 0.25rem;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #dc2626;
      animation: pulse-dot 1.8s ease-in-out infinite;
    }

    @keyframes pulse-dot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.3); }
    }

    /* ================================================================
       Filter Bar
    ================================================================ */
    .filter-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.75rem;
      padding: 0.875rem 1.5rem;
      background: white;
      border-bottom: 1px solid #e2e8f0;
    }

    .dark .filter-bar {
      background: #1e293b;
      border-bottom-color: #334155;
    }

    .filter-controls {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      flex-wrap: wrap;
      flex: 1;
    }

    .search-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 0.75rem;
      color: #94a3b8;
      z-index: 1;
      pointer-events: none;
      font-size: 0.875rem;
    }

    .search-input {
      padding-left: 2.25rem !important;
      min-width: 200px;
    }

    :host ::ng-deep .filter-select {
      min-width: 148px;
    }

    .filter-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-shrink: 0;
    }

    .clear-filters-btn {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      background: none;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s;
    }

    .clear-filters-btn:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
      color: #475569;
    }

    .dark .clear-filters-btn {
      border-color: #334155;
      color: #94a3b8;
    }

    .dark .clear-filters-btn:hover {
      background: #334155;
      color: #e2e8f0;
    }

    .record-count {
      font-size: 0.8125rem;
      color: #94a3b8;
      white-space: nowrap;
    }

    /* ================================================================
       Body Layout
    ================================================================ */
    .body-layout {
      display: grid;
      grid-template-columns: 1fr;
      flex: 1;
      min-height: 0;
    }

    .body-layout.has-detail {
      grid-template-columns: 1fr 420px;
    }

    @media (max-width: 1100px) {
      .body-layout.has-detail {
        grid-template-columns: 1fr 360px;
      }
    }

    @media (max-width: 900px) {
      .body-layout.has-detail {
        grid-template-columns: 1fr;
      }
    }

    /* ================================================================
       Timeline Panel
    ================================================================ */
    .timeline-panel {
      overflow-y: auto;
      padding: 1.25rem 1.5rem;
    }

    /* Skeleton */
    .skeleton-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .record-skeleton {
      display: flex;
      gap: 1rem;
      background: white;
      border-radius: 0.75rem;
      border: 1px solid #e2e8f0;
      padding: 1.25rem;
    }

    .dark .record-skeleton {
      background: #1e293b;
      border-color: #334155;
    }

    .skeleton-left {
      flex-shrink: 0;
    }

    .skeleton-right {
      flex: 1;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 1.5rem;
      text-align: center;
      gap: 1rem;
    }

    .empty-icon {
      width: 4rem;
      height: 4rem;
      border-radius: 50%;
      background: #e0f2fe;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .dark .empty-icon {
      background: #0c4a6e;
    }

    .empty-icon i {
      font-size: 1.5rem;
      color: #0ea5e9;
    }

    .empty-state h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .dark .empty-state h3 {
      color: #f1f5f9;
    }

    .empty-state p {
      font-size: 0.9375rem;
      color: #64748b;
      margin: 0;
    }

    .dark .empty-state p {
      color: #94a3b8;
    }

    .link-btn {
      background: none;
      border: none;
      color: #3b82f6;
      cursor: pointer;
      font-size: inherit;
      padding: 0;
      text-decoration: underline;
    }

    /* ================================================================
       Timeline List
    ================================================================ */
    .timeline-list {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }

    /* ================================================================
       Timeline Entry Card
    ================================================================ */
    .timeline-entry {
      background: white;
      border: 1px solid #e2e8f0;
      border-left: 4px solid var(--source-color, #e2e8f0);
      border-radius: 0.75rem;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.18s ease;
      outline: none;
    }

    .dark .timeline-entry {
      background: #1e293b;
      border-color: #334155;
      border-left-color: var(--source-color, #334155);
    }

    .timeline-entry:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      transform: translateY(-1px);
    }

    .dark .timeline-entry:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
    }

    .timeline-entry:focus-visible {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
    }

    .timeline-entry.is-selected {
      border-color: #3b82f6;
      border-left-color: #3b82f6;
      background: #eff6ff;
    }

    .dark .timeline-entry.is-selected {
      background: #1e3a5f;
      border-color: #3b82f6;
    }

    .timeline-entry.is-urgent {
      box-shadow: 0 0 0 1px #fca5a5;
    }

    .dark .timeline-entry.is-urgent {
      box-shadow: 0 0 0 1px #7f1d1d;
    }

    .timeline-entry.is-dismissed {
      opacity: 0.55;
    }

    /* Urgent Banner */
    .urgent-banner {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #dc2626;
      color: white;
      padding: 0.375rem 1rem;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.04em;
    }

    .urgent-banner i {
      font-size: 0.875rem;
    }

    /* Discrepancy Banner */
    .discrepancy-banner {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #f59e0b;
      color: white;
      padding: 0.375rem 1rem;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .discrepancy-banner i {
      font-size: 0.875rem;
    }

    .entry-body {
      display: flex;
      gap: 0;
      padding: 1rem 1.25rem;
    }

    .entry-source-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-right: 1rem;
      flex-shrink: 0;
    }

    .source-icon-wrapper {
      width: 2.75rem;
      height: 2.75rem;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      cursor: default;
    }

    .source-icon-wrapper i {
      font-size: 1rem;
    }

    .timeline-line {
      width: 2px;
      flex: 1;
      min-height: 0.5rem;
      background: #e2e8f0;
      margin-top: 0.5rem;
    }

    .dark .timeline-line {
      background: #334155;
    }

    .entry-content {
      flex: 1;
      min-width: 0;
    }

    .entry-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 0.5rem;
    }

    .entry-header-left {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .entry-header-right {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      flex-shrink: 0;
    }

    .data-type-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: #f1f5f9;
      color: #475569;
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
    }

    .dark .data-type-badge {
      background: #334155;
      color: #94a3b8;
    }

    .data-type-badge i {
      font-size: 0.6875rem;
    }

    .review-status-badge {
      display: inline-flex;
      align-items: center;
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
    }

    .source-label {
      font-size: 0.75rem;
      font-weight: 600;
    }

    .entry-date {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .entry-title {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 0.375rem;
      line-height: 1.4;
    }

    .dark .entry-title {
      color: #f1f5f9;
    }

    .entry-summary {
      font-size: 0.8125rem;
      color: #64748b;
      margin: 0 0 0.625rem;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .dark .entry-summary {
      color: #94a3b8;
    }

    .entry-meta {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      flex-wrap: wrap;
    }

    .meta-source-name,
    .meta-received {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .meta-source-name i,
    .meta-received i {
      font-size: 0.6875rem;
    }

    .meta-tags {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      flex-wrap: wrap;
    }

    .tag-chip {
      font-size: 0.625rem;
      font-weight: 500;
      background: #f1f5f9;
      color: #64748b;
      padding: 0.1rem 0.45rem;
      border-radius: 9999px;
    }

    .dark .tag-chip {
      background: #334155;
      color: #94a3b8;
    }

    .tag-more {
      background: #e2e8f0;
      color: #94a3b8;
    }

    .dark .tag-more {
      background: #475569;
    }

    /* ================================================================
       Detail Panel
    ================================================================ */
    .detail-panel {
      border-left: 1px solid #e2e8f0;
      background: white;
      overflow-y: auto;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .dark .detail-panel {
      background: #1e293b;
      border-left-color: #334155;
    }

    .detail-header {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .detail-header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .detail-source-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.8125rem;
      font-weight: 600;
      padding: 0.35rem 0.875rem;
      border-radius: 9999px;
      border: 1px solid currentColor;
    }

    .detail-source-chip i {
      font-size: 0.875rem;
    }

    .detail-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      line-height: 1.35;
    }

    .dark .detail-title {
      color: #f1f5f9;
    }

    .detail-meta-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .urgent-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.6875rem;
      font-weight: 700;
      background: #fee2e2;
      color: #dc2626;
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
    }

    .dark .urgent-chip {
      background: #7f1d1d;
      color: #fca5a5;
    }

    .urgent-chip i { font-size: 0.6875rem; }

    .detail-source-info {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .source-info-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: #64748b;
    }

    .dark .source-info-row {
      color: #94a3b8;
    }

    .source-info-row i {
      font-size: 0.75rem;
      width: 0.75rem;
      flex-shrink: 0;
    }

    /* Alerts */
    .detail-urgent-alert {
      display: flex;
      gap: 0.75rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 0.5rem;
      padding: 0.875rem 1rem;
      margin-bottom: 0.75rem;
    }

    .dark .detail-urgent-alert {
      background: #450a0a;
      border-color: #7f1d1d;
    }

    .detail-urgent-alert i {
      color: #dc2626;
      font-size: 1.125rem;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .dark .detail-urgent-alert i {
      color: #fca5a5;
    }

    .detail-urgent-alert strong {
      display: block;
      color: #991b1b;
      font-size: 0.875rem;
      margin-bottom: 0.25rem;
    }

    .dark .detail-urgent-alert strong {
      color: #fca5a5;
    }

    .detail-urgent-alert p {
      margin: 0;
      font-size: 0.8125rem;
      color: #b91c1c;
    }

    .dark .detail-urgent-alert p {
      color: #fca5a5;
    }

    .detail-discrepancy-alert {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 0.5rem;
      padding: 0.875rem 1rem;
      margin-bottom: 0.75rem;
    }

    .dark .detail-discrepancy-alert {
      background: #451a03;
      border-color: #92400e;
    }

    .discrepancy-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .discrepancy-header i {
      color: #d97706;
      font-size: 0.875rem;
    }

    .dark .discrepancy-header i {
      color: #fcd34d;
    }

    .discrepancy-header strong {
      color: #92400e;
      font-size: 0.875rem;
    }

    .dark .discrepancy-header strong {
      color: #fcd34d;
    }

    .discrepancy-text {
      font-size: 0.8125rem;
      color: #78350f;
      margin: 0;
      line-height: 1.5;
    }

    .dark .discrepancy-text {
      color: #fde68a;
    }

    .discrepancy-editor {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-top: 0.25rem;
    }

    .discrepancy-textarea {
      width: 100%;
      font-size: 0.8125rem;
      resize: vertical;
    }

    .discrepancy-editor-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }

    /* Sections */
    .detail-section {
      margin-bottom: 1.25rem;
    }

    .section-heading {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #94a3b8;
      margin: 0 0 0.75rem;
    }

    .section-heading i {
      font-size: 0.875rem;
    }

    /* Lab Table */
    .lab-table-wrapper {
      overflow-x: auto;
      border-radius: 0.5rem;
      border: 1px solid #e2e8f0;
    }

    .dark .lab-table-wrapper {
      border-color: #334155;
    }

    .lab-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
    }

    .lab-table th {
      background: #f8fafc;
      color: #475569;
      font-weight: 600;
      padding: 0.5rem 0.75rem;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }

    .dark .lab-table th {
      background: #334155;
      color: #94a3b8;
      border-bottom-color: #475569;
    }

    .lab-table td {
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid #f1f5f9;
      color: #374151;
    }

    .dark .lab-table td {
      color: #e2e8f0;
      border-bottom-color: #1e293b;
    }

    .lab-table tr:last-child td {
      border-bottom: none;
    }

    .lab-table tr.lab-critical {
      background: #fef2f2;
    }

    .dark .lab-table tr.lab-critical {
      background: #450a0a;
    }

    .lab-table tr.lab-abnormal {
      background: #fffbeb;
    }

    .dark .lab-table tr.lab-abnormal {
      background: #1c1400;
    }

    .lab-test-name {
      font-weight: 500;
    }

    .lab-value {
      font-weight: 700;
    }

    .lab-unit {
      font-weight: 400;
      font-size: 0.75rem;
      color: #94a3b8;
      margin-left: 0.25rem;
    }

    .lab-range {
      color: #94a3b8;
    }

    .flag-critical {
      display: inline-block;
      background: #dc2626;
      color: white;
      font-size: 0.625rem;
      font-weight: 800;
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
      letter-spacing: 0.05em;
    }

    .flag-abnormal {
      display: inline-block;
      background: #f59e0b;
      color: white;
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
    }

    .flag-normal {
      display: inline-block;
      background: #dcfce7;
      color: #166534;
      font-size: 0.6875rem;
      font-weight: 600;
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
    }

    .dark .flag-normal {
      background: #14532d;
      color: #86efac;
    }

    /* Medications */
    .medications-list {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }

    .medication-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 0.625rem 0.875rem;
      background: #f8fafc;
      border-radius: 0.5rem;
      border-left: 3px solid #22c55e;
    }

    .dark .medication-item {
      background: #334155;
    }

    .medication-item.med-discontinued {
      border-left-color: #94a3b8;
      opacity: 0.7;
    }

    .medication-item.med-unknown {
      border-left-color: #f59e0b;
    }

    .med-main {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .med-name {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.875rem;
    }

    .dark .med-name {
      color: #f1f5f9;
    }

    .med-dose {
      font-size: 0.8125rem;
      color: #475569;
    }

    .dark .med-dose {
      color: #94a3b8;
    }

    .med-freq {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .med-meta {
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }

    .med-prescriber {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .med-prescriber i {
      font-size: 0.6875rem;
    }

    .med-status-badge {
      font-size: 0.625rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 0.125rem 0.45rem;
      border-radius: 4px;
      letter-spacing: 0.04em;
    }

    .med-status-badge.status-active {
      background: #dcfce7;
      color: #166534;
    }

    .dark .med-status-badge.status-active {
      background: #14532d;
      color: #86efac;
    }

    .med-status-badge.status-discontinued {
      background: #f1f5f9;
      color: #64748b;
    }

    .dark .med-status-badge.status-discontinued {
      background: #1e293b;
      color: #94a3b8;
    }

    .med-status-badge.status-unknown {
      background: #fef3c7;
      color: #92400e;
    }

    .dark .med-status-badge.status-unknown {
      background: #78350f;
      color: #fcd34d;
    }

    /* Vitals */
    .vitals-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
    }

    .vital-chip {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      background: #f8fafc;
      border-radius: 0.5rem;
      padding: 0.625rem 0.75rem;
    }

    .dark .vital-chip {
      background: #334155;
    }

    .vital-type {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #94a3b8;
    }

    .vital-val {
      font-size: 1rem;
      font-weight: 700;
      color: #1e293b;
    }

    .dark .vital-val {
      color: #f1f5f9;
    }

    .vital-val small {
      font-size: 0.75rem;
      font-weight: 400;
      color: #94a3b8;
    }

    /* ================================================================
       Markdown Content
    ================================================================ */
    .markdown-content {
      color: #374151;
      font-size: 0.875rem;
      line-height: 1.7;
    }

    .dark .markdown-content {
      color: #e2e8f0;
    }

    :host ::ng-deep .markdown-content h1,
    :host ::ng-deep .markdown-content h2,
    :host ::ng-deep .markdown-content h3 {
      color: #0f172a;
      margin: 1rem 0 0.5rem;
      font-weight: 700;
      line-height: 1.3;
    }

    .dark :host ::ng-deep .markdown-content h1,
    .dark :host ::ng-deep .markdown-content h2,
    .dark :host ::ng-deep .markdown-content h3 {
      color: #f1f5f9;
    }

    :host ::ng-deep .markdown-content h1 { font-size: 1.25rem; }
    :host ::ng-deep .markdown-content h2 { font-size: 1.125rem; }
    :host ::ng-deep .markdown-content h3 { font-size: 1rem; }

    :host ::ng-deep .markdown-content p { margin: 0.5rem 0; }

    :host ::ng-deep .markdown-content ul,
    :host ::ng-deep .markdown-content ol {
      padding-left: 1.5rem;
      margin: 0.5rem 0;
    }

    :host ::ng-deep .markdown-content li { margin: 0.25rem 0; }

    :host ::ng-deep .markdown-content blockquote {
      border-left: 4px solid #f59e0b;
      padding: 0.5rem 1rem;
      margin: 0.75rem 0;
      background: #fffbeb;
      border-radius: 0 0.5rem 0.5rem 0;
      color: #92400e;
    }

    .dark :host ::ng-deep .markdown-content blockquote {
      background: #451a03;
      color: #fde68a;
    }

    :host ::ng-deep .markdown-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 0.75rem 0;
      font-size: 0.8125rem;
    }

    :host ::ng-deep .markdown-content th,
    :host ::ng-deep .markdown-content td {
      border: 1px solid #e2e8f0;
      padding: 0.45rem 0.625rem;
      text-align: left;
    }

    .dark :host ::ng-deep .markdown-content th,
    .dark :host ::ng-deep .markdown-content td {
      border-color: #334155;
    }

    :host ::ng-deep .markdown-content th {
      background: #f8fafc;
      font-weight: 600;
    }

    .dark :host ::ng-deep .markdown-content th {
      background: #334155;
    }

    :host ::ng-deep .markdown-content code {
      background: #f1f5f9;
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
      font-size: 0.8125em;
      font-family: 'JetBrains Mono', monospace;
    }

    .dark :host ::ng-deep .markdown-content code {
      background: #334155;
      color: #e2e8f0;
    }

    :host ::ng-deep .markdown-content strong { font-weight: 700; }

    :host ::ng-deep .markdown-content hr {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 1rem 0;
    }

    .dark :host ::ng-deep .markdown-content hr {
      border-top-color: #334155;
    }

    /* ================================================================
       Review History & Actions
    ================================================================ */
    .review-history {
      background: #f8fafc;
      border-radius: 0.5rem;
      padding: 0.875rem 1rem;
    }

    .dark .review-history {
      background: #334155;
    }

    .review-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .review-item-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .review-by {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: #1e293b;
    }

    .dark .review-by {
      color: #f1f5f9;
    }

    .review-by i {
      font-size: 0.75rem;
    }

    .review-at {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .review-notes {
      font-size: 0.8125rem;
      color: #64748b;
      margin: 0;
      font-style: italic;
      line-height: 1.5;
    }

    .dark .review-notes {
      color: #94a3b8;
    }

    .review-actions {
      background: #f8fafc;
      border-radius: 0.5rem;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }

    .dark .review-actions {
      background: #334155;
    }

    .review-actions-label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #94a3b8;
      margin: 0;
    }

    .review-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .review-notes-input {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .review-notes-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
    }

    .dark .review-notes-label {
      color: #94a3b8;
    }

    .review-notes-textarea {
      width: 100%;
      font-size: 0.8125rem;
      resize: vertical;
    }

    /* ================================================================
       Dismiss Dialog
    ================================================================ */
    .dismiss-dialog-body {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .dismiss-description {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0;
    }

    .dark .dismiss-description {
      color: #94a3b8;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .form-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
    }

    .dark .form-label {
      color: #e2e8f0;
    }

    .required {
      color: #dc2626;
      margin-left: 0.125rem;
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    /* ================================================================
       Responsive
    ================================================================ */
    @media (max-width: 900px) {
      .body-layout.has-detail {
        grid-template-columns: 1fr;
      }

      .detail-panel {
        border-left: none;
        border-top: 1px solid #e2e8f0;
      }

      .dark .detail-panel {
        border-top-color: #334155;
      }
    }

    @media (max-width: 768px) {
      .stats-bar {
        gap: 0.25rem;
        padding: 0.625rem 1rem;
      }

      .stat-item {
        padding: 0.25rem 0.5rem;
      }

      .filter-bar,
      .timeline-panel {
        padding: 0.875rem 1rem;
      }

      .filter-controls {
        flex-direction: column;
        align-items: stretch;
      }

      .search-input {
        min-width: unset;
        width: 100%;
      }

      :host ::ng-deep .filter-select {
        min-width: unset;
      }
    }
    `,
  ],
})
export class ExternalDataComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly externalDataService = inject(ExternalDataService);
  private readonly messageService = inject(MessageService);
  readonly themeService = inject(ThemeService);

  private readonly destroy$ = new Subject<void>();

  // ---- Exposed constants for template ----
  readonly SOURCE_LABELS = SOURCE_LABELS;
  readonly SOURCE_ICONS = SOURCE_ICONS;
  readonly DATA_TYPE_LABELS = DATA_TYPE_LABELS;
  readonly DATA_TYPE_ICONS = DATA_TYPE_ICONS;
  readonly REVIEW_STATUS_LABELS = REVIEW_STATUS_LABELS;

  // ---- State signals ----
  patientId = signal<string>('');
  records = signal<ExternalDataRecord[]>([]);
  loading = signal(true);
  selectedRecord = signal<ExternalDataRecord | null>(null);
  savingReview = signal(false);
  savingDiscrepancy = signal(false);
  editingDiscrepancy = signal(false);
  showDismissDialog = signal(false);

  // Filters
  searchTerm = signal('');
  sourceFilter = signal<ExternalDataSource | 'all'>('all');
  dataTypeFilter = signal<ExternalDataType | 'all'>('all');
  statusFilter = signal<ReviewStatus | 'all'>('all');
  sortField = signal<SortField>('date');

  // Draft state
  reviewNotesDraft = '';
  discrepancyDraft = '';
  dismissReasonDraft = '';

  // ---- Computed stats ----
  urgentCount = computed(
    () => this.records().filter((r) => r.isUrgent).length
  );

  unreviewedCount = computed(
    () => this.records().filter((r) => r.reviewStatus === 'unreviewed').length
  );

  discrepancyCount = computed(
    () => this.records().filter((r) => r.hasDiscrepancy).length
  );

  uniqueSourceCount = computed(
    () => new Set(this.records().map((r) => r.source)).size
  );

  // ---- Computed: filtered & sorted records ----
  filteredRecords = computed(() => {
    let result = this.records();

    const src = this.sourceFilter();
    if (src !== 'all') {
      result = result.filter((r) => r.source === src);
    }

    const dtype = this.dataTypeFilter();
    if (dtype !== 'all') {
      result = result.filter((r) => r.dataType === dtype);
    }

    const status = this.statusFilter();
    if (status !== 'all') {
      result = result.filter((r) => r.reviewStatus === status);
    }

    const term = this.searchTerm().toLowerCase().trim();
    if (term) {
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(term) ||
          r.summary.toLowerCase().includes(term) ||
          r.sourceName.toLowerCase().includes(term) ||
          (r.tags ?? []).some((t) => t.toLowerCase().includes(term))
      );
    }

    const sort = this.sortField();
    return [...result].sort((a, b) => {
      if (sort === 'urgency') {
        if (a.isUrgent !== b.isUrgent) return a.isUrgent ? -1 : 1;
        if (a.hasDiscrepancy !== b.hasDiscrepancy)
          return a.hasDiscrepancy ? -1 : 1;
      }
      if (sort === 'source') {
        return SOURCE_LABELS[a.source].localeCompare(SOURCE_LABELS[b.source]);
      }
      if (sort === 'status') {
        return a.reviewStatus.localeCompare(b.reviewStatus);
      }
      // Default: date (newest first)
      return (
        new Date(b.originalDate).getTime() -
        new Date(a.originalDate).getTime()
      );
    });
  });

  hasActiveFilters = computed(
    () =>
      this.searchTerm() !== '' ||
      this.sourceFilter() !== 'all' ||
      this.dataTypeFilter() !== 'all' ||
      this.statusFilter() !== 'all'
  );

  // ---- Select options ----
  sourceOptions: SelectOption[] = [
    { label: 'All Sources', value: 'all' },
    ...Object.entries(SOURCE_LABELS).map(([value, label]) => ({
      label,
      value,
    })),
  ];

  dataTypeOptions: SelectOption[] = [
    { label: 'All Types', value: 'all' },
    ...Object.entries(DATA_TYPE_LABELS).map(([value, label]) => ({
      label,
      value,
    })),
  ];

  statusOptions: SelectOption[] = [
    { label: 'All Statuses', value: 'all' },
    ...Object.entries(REVIEW_STATUS_LABELS).map(([value, label]) => ({
      label,
      value,
    })),
  ];

  sortOptions: SelectOption[] = [
    { label: 'Newest First', value: 'date' },
    { label: 'By Source', value: 'source' },
    { label: 'By Urgency', value: 'urgency' },
    { label: 'By Status', value: 'status' },
  ];

  // ---- Lifecycle ----
  ngOnInit(): void {
    this.route.parent?.params
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const id = params['patientId'] ?? '';
        this.patientId.set(id);
        this.loadRecords(id);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ---- Data loading ----
  private loadRecords(patientId: string): void {
    this.loading.set(true);
    this.externalDataService
      .getExternalData(patientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (records) => {
          this.records.set(records);
          this.loading.set(false);
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load external data records.',
          });
          this.loading.set(false);
        },
      });
  }

  // ---- Interactions ----
  selectRecord(record: ExternalDataRecord): void {
    if (this.selectedRecord()?.id === record.id) {
      this.selectedRecord.set(null);
    } else {
      this.selectedRecord.set(record);
      this.reviewNotesDraft = record.reviewNotes ?? '';
      this.discrepancyDraft = record.discrepancyNotes ?? '';
      this.editingDiscrepancy.set(false);
    }
  }

  markAs(status: ReviewStatus): void {
    const record = this.selectedRecord();
    if (!record) return;

    this.savingReview.set(true);
    const notes = this.reviewNotesDraft.trim() || undefined;

    this.externalDataService
      .updateReviewStatus(record.id, status, notes)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.records.update((list) =>
            list.map((r) => (r.id === updated.id ? updated : r))
          );
          this.selectedRecord.set(updated);
          this.savingReview.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Updated',
            detail: `Record marked as ${REVIEW_STATUS_LABELS[status]}.`,
          });
        },
        error: () => {
          this.savingReview.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update review status.',
          });
        },
      });
  }

  confirmDismiss(): void {
    const record = this.selectedRecord();
    const reason = this.dismissReasonDraft.trim();
    if (!record || !reason) return;

    this.savingReview.set(true);
    this.externalDataService
      .dismissRecord(record.id, reason)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.records.update((list) =>
            list.map((r) => (r.id === updated.id ? updated : r))
          );
          this.selectedRecord.set(updated);
          this.savingReview.set(false);
          this.showDismissDialog.set(false);
          this.dismissReasonDraft = '';
          this.messageService.add({
            severity: 'info',
            summary: 'Dismissed',
            detail: 'Record has been dismissed.',
          });
        },
        error: () => {
          this.savingReview.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to dismiss record.',
          });
        },
      });
  }

  startDiscrepancyEdit(): void {
    const record = this.selectedRecord();
    this.discrepancyDraft = record?.discrepancyNotes ?? '';
    this.editingDiscrepancy.set(true);
  }

  cancelDiscrepancyEdit(): void {
    this.editingDiscrepancy.set(false);
  }

  saveDiscrepancyNotes(): void {
    const record = this.selectedRecord();
    if (!record) return;

    this.savingDiscrepancy.set(true);
    this.externalDataService
      .updateDiscrepancyNotes(record.id, this.discrepancyDraft.trim())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.records.update((list) =>
            list.map((r) => (r.id === updated.id ? updated : r))
          );
          this.selectedRecord.set(updated);
          this.savingDiscrepancy.set(false);
          this.editingDiscrepancy.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Saved',
            detail: 'Discrepancy notes updated.',
          });
        },
        error: () => {
          this.savingDiscrepancy.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to save discrepancy notes.',
          });
        },
      });
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.sourceFilter.set('all');
    this.dataTypeFilter.set('all');
    this.statusFilter.set('all');
  }

  // ---- Template helpers ----
  getSourceBg(source: ExternalDataSource): string {
    const colors = SOURCE_COLORS[source];
    return this.themeService.isDarkMode() ? colors.darkBg : colors.bg;
  }

  getSourceText(source: ExternalDataSource): string {
    const colors = SOURCE_COLORS[source];
    return this.themeService.isDarkMode() ? colors.darkText : colors.text;
  }

  getSourceBorder(source: ExternalDataSource): string {
    return SOURCE_COLORS[source].border;
  }

  getStatusBg(status: ReviewStatus): string {
    const colors = REVIEW_STATUS_COLORS[status];
    return this.themeService.isDarkMode() ? colors.darkBg : colors.bg;
  }

  getStatusText(status: ReviewStatus): string {
    const colors = REVIEW_STATUS_COLORS[status];
    return this.themeService.isDarkMode() ? colors.darkText : colors.text;
  }
}
