import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CdkDragDrop,
  CdkDrag,
  CdkDropList,
  moveItemInArray,
  DragDropModule,
} from '@angular/cdk/drag-drop';
import { RoundingSheetService } from '../data-access/services/rounding-sheet.service';
import {
  RoundingSheet,
  RoundingSheetTemplate,
  RoundingSheetSection,
  RoundingSheetField,
  PatientRoundingData,
  FieldType,
  ColumnSize,
  FIELD_TYPE_LABELS,
  FIELD_TYPE_ICONS,
  COLUMN_SIZE_WIDTHS,
  COMMON_DATA_SOURCES,
} from '../data-access/models/rounding-sheet.model';

type MainTab = 'templates' | 'active' | 'completed';
type ViewMode = 'list' | 'builder' | 'viewer';

@Component({
  selector: 'app-rounding-sheets',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, CdkDrag, CdkDropList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rs-container">

      <!-- ═══════════════════════════════════════════════════════════════════════
           SHEET MANAGER (default list view)
      ═══════════════════════════════════════════════════════════════════════ -->
      @if (currentView() === 'list') {
        <div class="page-header">
          <div>
            <h1 class="page-title">Rounding Sheets</h1>
            <p class="page-subtitle">Manage rounding templates and daily patient sheets</p>
          </div>
          <button class="btn btn-primary" (click)="startNewTemplate()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Template
          </button>
        </div>

        <!-- Tab bar -->
        <div class="tab-bar">
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'templates'"
            (click)="activeTab.set('templates')">
            Templates
            <span class="tab-badge">{{ templates().length }}</span>
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'active'"
            (click)="activeTab.set('active')">
            Active Sheets
            <span class="tab-badge active-badge">{{ activeSheets().length }}</span>
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'completed'"
            (click)="activeTab.set('completed')">
            Completed
            <span class="tab-badge">{{ completedSheets().length }}</span>
          </button>
        </div>

        <!-- ─── TEMPLATES TAB ───────────────────────────────────────────── -->
        @if (activeTab() === 'templates') {
          <div class="template-grid">
            @for (tpl of templates(); track tpl.id) {
              <div class="template-card">
                <div class="card-header">
                  <div class="card-title-row">
                    <h3 class="card-title">{{ tpl.name }}</h3>
                    @if (tpl.isDefault) {
                      <span class="badge badge-blue">Default</span>
                    }
                    @if (tpl.isShared) {
                      <span class="badge badge-green">Shared</span>
                    }
                  </div>
                  @if (tpl.specialty) {
                    <span class="specialty-tag">{{ tpl.specialty }}</span>
                  }
                </div>
                <p class="card-desc">{{ tpl.description }}</p>
                <div class="card-meta">
                  <span class="meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/></svg>
                    {{ tpl.sections.length }} sections
                  </span>
                  <span class="meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/></svg>
                    {{ countFields(tpl) }} fields
                  </span>
                  <span class="meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                    Used {{ tpl.useCount }}x
                  </span>
                </div>
                @if (tpl.tags && tpl.tags.length > 0) {
                  <div class="tag-row">
                    @for (tag of tpl.tags; track tag) {
                      <span class="tag">{{ tag }}</span>
                    }
                  </div>
                }
                <div class="card-actions">
                  <button class="btn btn-primary btn-sm" (click)="openCreateSheetModal(tpl)">
                    Use Template
                  </button>
                  <button class="btn btn-secondary btn-sm" (click)="editTemplate(tpl)">Edit</button>
                  <button class="btn btn-secondary btn-sm" (click)="cloneTemplate(tpl)">Clone</button>
                  @if (!tpl.isDefault) {
                    <button class="btn btn-danger btn-sm" (click)="deleteTemplate(tpl)">Delete</button>
                  }
                </div>
              </div>
            }
          </div>
        }

        <!-- ─── ACTIVE SHEETS TAB ──────────────────────────────────────── -->
        @if (activeTab() === 'active') {
          <div class="sheets-list">
            @if (activeSheets().length === 0) {
              <div class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/></svg>
                <p>No active sheets</p>
                <span>Create a sheet from a template to get started</span>
              </div>
            }
            @for (sheet of activeSheets(); track sheet.id) {
              <div class="sheet-row" (click)="openViewer(sheet)">
                <div class="sheet-info">
                  <div class="sheet-title-row">
                    <h3 class="sheet-name">{{ sheet.templateName }}</h3>
                    <span class="status-badge status-{{ sheet.status }}">{{ formatStatus(sheet.status) }}</span>
                  </div>
                  <div class="sheet-meta">
                    <span>{{ formatDate(sheet.date) }}</span>
                    <span class="meta-dot">·</span>
                    <span class="shift-label">{{ capitalize(sheet.shift) }} shift</span>
                    <span class="meta-dot">·</span>
                    <span>{{ sheet.unit }}</span>
                    <span class="meta-dot">·</span>
                    <span>{{ sheet.patients.length }} patient{{ sheet.patients.length !== 1 ? 's' : '' }}</span>
                  </div>
                  <div class="progress-bar-wrap">
                    <div class="progress-bar">
                      <div class="progress-fill" [style.width.%]="calcProgress(sheet)"></div>
                    </div>
                    <span class="progress-label">{{ calcProgress(sheet) }}% complete</span>
                  </div>
                </div>
                <div class="sheet-actions" (click)="$event.stopPropagation()">
                  <button class="btn btn-primary btn-sm" (click)="openViewer(sheet)">Continue</button>
                  <button class="btn btn-secondary btn-sm" (click)="completeSheet(sheet)">Complete</button>
                  <button class="btn btn-secondary btn-sm" (click)="exportSheet(sheet)">Export PDF</button>
                </div>
              </div>
            }
          </div>
        }

        <!-- ─── COMPLETED SHEETS TAB ───────────────────────────────────── -->
        @if (activeTab() === 'completed') {
          <div class="sheets-list">
            @if (completedSheets().length === 0) {
              <div class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="16 12 12 8 8 12"/></svg>
                <p>No completed sheets</p>
                <span>Completed sheets will appear here</span>
              </div>
            }
            @for (sheet of completedSheets(); track sheet.id) {
              <div class="sheet-row" (click)="openViewer(sheet)">
                <div class="sheet-info">
                  <div class="sheet-title-row">
                    <h3 class="sheet-name">{{ sheet.templateName }}</h3>
                    <span class="status-badge status-completed">Completed</span>
                  </div>
                  <div class="sheet-meta">
                    <span>{{ formatDate(sheet.date) }}</span>
                    <span class="meta-dot">·</span>
                    <span class="shift-label">{{ capitalize(sheet.shift) }} shift</span>
                    <span class="meta-dot">·</span>
                    <span>{{ sheet.unit }}</span>
                    <span class="meta-dot">·</span>
                    <span>{{ sheet.patients.length }} patients</span>
                    <span class="meta-dot">·</span>
                    <span class="by-label">{{ sheet.createdByName }}</span>
                  </div>
                </div>
                <div class="sheet-actions" (click)="$event.stopPropagation()">
                  <button class="btn btn-secondary btn-sm" (click)="openViewer(sheet)">View</button>
                  <button class="btn btn-secondary btn-sm" (click)="exportSheet(sheet)">Export PDF</button>
                  <button class="btn btn-secondary btn-sm" (click)="cloneSheet(sheet)">Clone</button>
                </div>
              </div>
            }
          </div>
        }
      }

      <!-- ═══════════════════════════════════════════════════════════════════════
           TEMPLATE BUILDER
      ═══════════════════════════════════════════════════════════════════════ -->
      @if (currentView() === 'builder') {
        <div class="builder-container">
          <div class="builder-header">
            <button class="btn btn-ghost" (click)="cancelBuilder()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              Back
            </button>
            <h2 class="builder-title">{{ editingTemplate() ? 'Edit Template' : 'New Template' }}</h2>
            <div class="builder-header-actions">
              <button class="btn btn-secondary" (click)="previewTemplate()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                Preview
              </button>
              <button class="btn btn-primary" (click)="saveTemplate()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>
                Save Template
              </button>
            </div>
          </div>

          <div class="builder-body">
            <!-- Metadata panel -->
            <div class="meta-panel">
              <h3 class="panel-section-title">Template Details</h3>
              <div class="form-group">
                <label class="form-label">Template Name *</label>
                <input
                  type="text"
                  class="form-input"
                  placeholder="e.g. General Medicine Rounding"
                  [value]="builderName()"
                  (input)="builderName.set($any($event.target).value)" />
              </div>
              <div class="form-group">
                <label class="form-label">Description</label>
                <textarea
                  class="form-input"
                  rows="2"
                  placeholder="Brief description of this template..."
                  [value]="builderDescription()"
                  (input)="builderDescription.set($any($event.target).value)"></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">Specialty</label>
                <input
                  type="text"
                  class="form-input"
                  placeholder="e.g. Internal Medicine"
                  [value]="builderSpecialty()"
                  (input)="builderSpecialty.set($any($event.target).value)" />
              </div>
              <div class="form-group form-check">
                <label class="checkbox-label">
                  <input type="checkbox" [checked]="builderIsShared()" (change)="builderIsShared.set($any($event.target).checked)" />
                  <span>Share with all staff</span>
                </label>
              </div>
            </div>

            <!-- Sections editor -->
            <div class="sections-panel">
              <div class="sections-header">
                <h3 class="panel-section-title">Sections & Fields</h3>
                <button class="btn btn-secondary btn-sm" (click)="addSection()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add Section
                </button>
              </div>

              <div
                cdkDropList
                [cdkDropListData]="builderSections()"
                (cdkDropListDropped)="dropSection($event)"
                class="sections-drop-list">
                @for (section of builderSections(); track section.id; let si = $index) {
                  <div cdkDrag class="section-block">
                    <!-- Drag preview placeholder -->
                    <div *cdkDragPlaceholder class="drag-placeholder section-placeholder"></div>

                    <div class="section-header">
                      <div class="drag-handle-area" cdkDragHandle>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="5" r="1" fill="currentColor"/><circle cx="15" cy="5" r="1" fill="currentColor"/><circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/><circle cx="9" cy="19" r="1" fill="currentColor"/><circle cx="15" cy="19" r="1" fill="currentColor"/></svg>
                      </div>
                      <input
                        type="text"
                        class="section-title-input"
                        [value]="section.title"
                        (input)="updateSectionTitle(si, $any($event.target).value)"
                        placeholder="Section title..." />
                      <div class="section-controls">
                        <label class="toggle-label" title="Collapsible">
                          <input
                            type="checkbox"
                            [checked]="section.isCollapsible"
                            (change)="toggleSectionCollapsible(si, $any($event.target).checked)" />
                          Collapse
                        </label>
                        <button class="icon-btn danger" (click)="removeSection(si)" title="Remove section">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6m4-6v6"/><path d="M9 6V4h6v2"/></svg>
                        </button>
                      </div>
                    </div>

                    <!-- Fields drop list -->
                    <div
                      cdkDropList
                      [cdkDropListData]="section.fields"
                      [id]="'field-list-' + section.id"
                      [cdkDropListConnectedTo]="getConnectedFieldLists()"
                      (cdkDropListDropped)="dropField($event, si)"
                      class="fields-drop-list">
                      @for (field of section.fields; track field.id; let fi = $index) {
                        <div cdkDrag class="field-item-block">
                          <div *cdkDragPlaceholder class="drag-placeholder field-placeholder"></div>

                          <div class="field-drag-handle" cdkDragHandle>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="5" r="1" fill="currentColor"/><circle cx="15" cy="5" r="1" fill="currentColor"/><circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/><circle cx="9" cy="19" r="1" fill="currentColor"/><circle cx="15" cy="19" r="1" fill="currentColor"/></svg>
                          </div>

                          <div class="field-editor">
                            <div class="field-row-top">
                              <input
                                type="text"
                                class="form-input field-label-input"
                                placeholder="Field label..."
                                [value]="field.label"
                                (input)="updateFieldLabel(si, fi, $any($event.target).value)" />
                              <select
                                class="form-select"
                                [value]="field.type"
                                (change)="updateFieldType(si, fi, $any($event.target).value)">
                                @for (entry of fieldTypeEntries; track entry.value) {
                                  <option [value]="entry.value">{{ entry.label }}</option>
                                }
                              </select>
                              <div class="size-toggle">
                                @for (sz of columnSizes; track sz) {
                                  <button
                                    class="size-btn"
                                    [class.active]="field.columnSize === sz"
                                    (click)="updateFieldSize(si, fi, sz)"
                                    [title]="sz">
                                    {{ sz[0].toUpperCase() }}
                                  </button>
                                }
                              </div>
                              <label class="toggle-label">
                                <input
                                  type="checkbox"
                                  [checked]="field.required"
                                  (change)="updateFieldRequired(si, fi, $any($event.target).checked)" />
                                Req
                              </label>
                            </div>

                            @if (field.type === 'select') {
                              <div class="field-row-extra">
                                <label class="form-label-sm">Options (comma-separated)</label>
                                <input
                                  type="text"
                                  class="form-input"
                                  placeholder="Option 1, Option 2, ..."
                                  [value]="(field.options || []).join(', ')"
                                  (input)="updateFieldOptions(si, fi, $any($event.target).value)" />
                              </div>
                            }

                            @if (field.type === 'vital-sign' || field.type === 'lab-value') {
                              <div class="field-row-extra">
                                <label class="form-label-sm">Auto-populate from</label>
                                <select
                                  class="form-select"
                                  [value]="field.dataSource || ''"
                                  (change)="updateFieldDataSource(si, fi, $any($event.target).value)">
                                  <option value="">-- None --</option>
                                  @for (src of commonDataSources; track src.value) {
                                    <option [value]="src.value">{{ src.label }}</option>
                                  }
                                </select>
                              </div>
                            }
                          </div>

                          <button class="icon-btn danger field-remove-btn" (click)="removeField(si, fi)" title="Remove field">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </div>
                      }
                    </div>

                    <button class="btn btn-ghost btn-sm add-field-btn" (click)="addField(si)">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Add Field
                    </button>
                  </div>
                }
              </div>

              @if (builderSections().length === 0) {
                <div class="empty-state-sm">
                  <p>No sections yet. Click "Add Section" to start building.</p>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- ═══════════════════════════════════════════════════════════════════════
           SHEET VIEWER
      ═══════════════════════════════════════════════════════════════════════ -->
      @if (currentView() === 'viewer' && viewerSheet()) {
        <div class="viewer-container">
          <!-- Viewer header (hidden in print) -->
          <div class="viewer-header no-print">
            <div class="viewer-header-left">
              <button class="btn btn-ghost" (click)="closeViewer()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                Back
              </button>
              <div>
                <h2 class="viewer-title">{{ viewerSheet()!.templateName }}</h2>
                <div class="viewer-meta">
                  <span>{{ formatDate(viewerSheet()!.date) }}</span>
                  <span class="meta-dot">·</span>
                  <span>{{ capitalize(viewerSheet()!.shift) }} shift</span>
                  <span class="meta-dot">·</span>
                  <span>{{ viewerSheet()!.unit }}</span>
                  <span class="meta-dot">·</span>
                  <span class="status-badge status-{{ viewerSheet()!.status }}">{{ formatStatus(viewerSheet()!.status) }}</span>
                </div>
              </div>
            </div>
            <div class="viewer-header-actions">
              <button class="btn btn-secondary" (click)="addPatientToSheet()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                Add Patient
              </button>
              @if (viewerSheet()!.status !== 'completed') {
                <button class="btn btn-success" (click)="completeSheet(viewerSheet()!)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                  Complete Sheet
                </button>
              }
              <button class="btn btn-secondary" (click)="printSheet()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                Print
              </button>
              <button class="btn btn-secondary" (click)="exportSheet(viewerSheet()!)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="12" y2="18"/><line x1="15" y1="15" x2="12" y2="18"/></svg>
                Export PDF
              </button>
            </div>
          </div>

          <!-- Print-only header -->
          <div class="print-header print-only">
            <h1>{{ viewerSheet()!.templateName }}</h1>
            <div class="print-meta">
              <span>{{ formatDate(viewerSheet()!.date) }}</span>
              <span> | {{ capitalize(viewerSheet()!.shift) }} Shift</span>
              <span> | {{ viewerSheet()!.unit }}</span>
              <span> | Created by: {{ viewerSheet()!.createdByName }}</span>
            </div>
          </div>

          <!-- Sheet table (scrolls horizontally) -->
          @if (viewerTemplate()) {
            <div class="table-scroll-wrap">
              <table class="rounding-table">
                <thead>
                  <!-- Patient info header -->
                  <tr class="thead-patient-row">
                    <th class="col-patient-info no-print-border">Patient</th>
                    @for (section of viewerTemplate()!.sections; track section.id) {
                      <th
                        [attr.colspan]="section.fields.length"
                        class="section-header-cell">
                        {{ section.title }}
                      </th>
                    }
                  </tr>
                  <!-- Field labels row -->
                  <tr class="thead-fields-row">
                    <th class="col-patient-info-sub">Name / Room / MRN / Diagnosis</th>
                    @for (section of viewerTemplate()!.sections; track section.id) {
                      @for (field of section.fields; track field.id) {
                        <th
                          class="field-header"
                          [style.min-width]="fieldWidth(field.columnSize)"
                          [class.required-field]="field.required">
                          <span class="field-header-label">{{ field.label }}</span>
                          @if (field.dataSource) {
                            <span class="auto-badge" title="Auto-populated">auto</span>
                          }
                        </th>
                      }
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (patient of viewerSheet()!.patients; track patient.patientId; let pi = $index) {
                    <tr class="patient-row" [class.page-break]="pi > 0 && pi % 5 === 0">
                      <!-- Patient info cell -->
                      <td class="patient-info-cell">
                        <div class="patient-name">{{ patient.patientName }}</div>
                        <div class="patient-detail">Room: {{ patient.room }}</div>
                        <div class="patient-detail">MRN: {{ patient.mrn }}</div>
                        <div class="patient-detail admit-date">Admit: {{ formatDate(patient.admitDate) }}</div>
                        <div class="patient-detail diagnosis-text" [title]="patient.diagnosis">{{ patient.diagnosis }}</div>
                        <div class="patient-detail attending">{{ patient.attendingPhysician }}</div>
                      </td>
                      <!-- Field cells -->
                      @for (section of viewerTemplate()!.sections; track section.id) {
                        @for (field of section.fields; track field.id) {
                          <td class="field-cell" [style.min-width]="fieldWidth(field.columnSize)">
                            @if (viewerSheet()!.status !== 'completed') {
                              <!-- Editable cell -->
                              @if (field.type === 'checkbox') {
                                <input
                                  type="checkbox"
                                  class="cell-checkbox"
                                  [checked]="getEntryBool(patient, field.id)"
                                  (change)="updateEntry(pi, field.id, $any($event.target).checked ? 'true' : 'false')" />
                              } @else if (field.type === 'select') {
                                <select
                                  class="cell-select"
                                  [value]="getEntry(patient, field.id)"
                                  (change)="updateEntry(pi, field.id, $any($event.target).value)">
                                  <option value="">--</option>
                                  @for (opt of field.options || []; track opt) {
                                    <option [value]="opt">{{ opt }}</option>
                                  }
                                </select>
                              } @else if (field.type === 'assessment' || field.type === 'plan' || field.type === 'note') {
                                <textarea
                                  class="cell-textarea"
                                  rows="3"
                                  [value]="getEntry(patient, field.id)"
                                  (input)="updateEntry(pi, field.id, $any($event.target).value)"
                                  [placeholder]="field.label + '...'"></textarea>
                              } @else {
                                <input
                                  [type]="field.type === 'number' ? 'number' : 'text'"
                                  class="cell-input"
                                  [value]="getEntry(patient, field.id)"
                                  (input)="updateEntry(pi, field.id, $any($event.target).value)"
                                  [placeholder]="field.required ? field.label + ' *' : field.label" />
                              }
                            } @else {
                              <!-- Read-only cell -->
                              <div class="cell-readonly">
                                @if (field.type === 'checkbox') {
                                  <span class="readonly-check">{{ getEntryBool(patient, field.id) ? '✓' : '—' }}</span>
                                } @else {
                                  <span>{{ getEntry(patient, field.id) || '—' }}</span>
                                }
                              </div>
                            }
                          </td>
                        }
                      }
                    </tr>
                  }
                  @if (viewerSheet()!.patients.length === 0) {
                    <tr>
                      <td [attr.colspan]="viewerTotalColumns()" class="empty-patients-cell">
                        No patients added yet. Use "Add Patient" to add patients to this sheet.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }

    </div>

    <!-- ═══════════════════════════════════════════════════════════════════════
         CREATE SHEET MODAL
    ═══════════════════════════════════════════════════════════════════════ -->
    @if (showCreateSheetModal()) {
      <div class="modal-overlay" (click)="showCreateSheetModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Create Rounding Sheet</h3>
            <button class="icon-btn" (click)="showCreateSheetModal.set(false)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <p class="modal-template-name">Template: <strong>{{ selectedTemplateForSheet()?.name }}</strong></p>
            <div class="form-group">
              <label class="form-label">Date</label>
              <input type="date" class="form-input" [(ngModel)]="newSheetDate" />
            </div>
            <div class="form-group">
              <label class="form-label">Shift</label>
              <select class="form-select" [(ngModel)]="newSheetShift">
                <option value="day">Day</option>
                <option value="evening">Evening</option>
                <option value="night">Night</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Unit / Ward</label>
              <input type="text" class="form-input" placeholder="e.g. 4 South - General Medicine" [(ngModel)]="newSheetUnit" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showCreateSheetModal.set(false)">Cancel</button>
            <button class="btn btn-primary" [disabled]="!newSheetDate || !newSheetUnit" (click)="confirmCreateSheet()">
              Create Sheet
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ═══════════════════════════════════════════════════════════════════════
         ADD PATIENT MODAL
    ═══════════════════════════════════════════════════════════════════════ -->
    @if (showAddPatientModal()) {
      <div class="modal-overlay" (click)="showAddPatientModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Add Patient to Sheet</h3>
            <button class="icon-btn" (click)="showAddPatientModal.set(false)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Patient Name *</label>
              <input type="text" class="form-input" placeholder="Full name" [(ngModel)]="newPatientName" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Room</label>
                <input type="text" class="form-input" placeholder="e.g. 412A" [(ngModel)]="newPatientRoom" />
              </div>
              <div class="form-group">
                <label class="form-label">MRN</label>
                <input type="text" class="form-input" placeholder="MRN-XXXXXX" [(ngModel)]="newPatientMRN" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Admit Date</label>
              <input type="date" class="form-input" [(ngModel)]="newPatientAdmitDate" />
            </div>
            <div class="form-group">
              <label class="form-label">Attending Physician</label>
              <input type="text" class="form-input" placeholder="Dr. ..." [(ngModel)]="newPatientAttending" />
            </div>
            <div class="form-group">
              <label class="form-label">Diagnosis</label>
              <input type="text" class="form-input" placeholder="Primary diagnosis" [(ngModel)]="newPatientDiagnosis" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showAddPatientModal.set(false)">Cancel</button>
            <button class="btn btn-primary" [disabled]="!newPatientName" (click)="confirmAddPatient()">
              Add Patient
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    /* ═══════ Container & Layout ════════════════════════════════════════ */
    .rs-container {
      padding: 1.5rem;
      max-width: 1600px;
      margin: 0 auto;
    }

    /* ═══════ Page header ════════════════════════════════════════════════ */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }
    .page-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #111827;
      margin: 0 0 0.25rem 0;
    }
    .page-subtitle {
      color: #6b7280;
      margin: 0;
      font-size: 0.9375rem;
    }

    /* ═══════ Buttons ═════════════════════════════════════════════════════ */
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
      text-decoration: none;
    }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary  { background: #3b82f6; color: #fff; }
    .btn-primary:hover:not(:disabled)  { background: #2563eb; }
    .btn-secondary { background: #fff; color: #374151; border: 1px solid #d1d5db; }
    .btn-secondary:hover:not(:disabled) { background: #f9fafb; }
    .btn-success  { background: #22c55e; color: #fff; }
    .btn-success:hover:not(:disabled)  { background: #16a34a; }
    .btn-danger   { background: #ef4444; color: #fff; }
    .btn-danger:hover:not(:disabled)   { background: #dc2626; }
    .btn-ghost    { background: transparent; color: #6b7280; border: none; }
    .btn-ghost:hover:not(:disabled)    { background: #f3f4f6; color: #374151; }
    .btn-sm       { padding: 0.375rem 0.75rem; font-size: 0.8125rem; }
    .icon-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.375rem;
      background: transparent;
      border: none;
      border-radius: 0.25rem;
      cursor: pointer;
      color: #9ca3af;
      transition: all 0.15s;
    }
    .icon-btn:hover { color: #374151; background: #f3f4f6; }
    .icon-btn.danger:hover { color: #ef4444; background: #fef2f2; }

    /* ═══════ Tab bar ══════════════════════════════════════════════════ */
    .tab-bar {
      display: flex;
      gap: 0;
      border-bottom: 2px solid #e5e7eb;
      margin-bottom: 1.5rem;
    }
    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      font-size: 0.9375rem;
      font-weight: 500;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.15s;
    }
    .tab-btn:hover { color: #374151; }
    .tab-btn.active { color: #3b82f6; border-bottom-color: #3b82f6; }
    .tab-badge {
      padding: 0.125rem 0.5rem;
      background: #e5e7eb;
      color: #374151;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .active-badge { background: #dbeafe; color: #1d4ed8; }

    /* ═══════ Badges & Status ══════════════════════════════════════════ */
    .badge {
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.6875rem;
      font-weight: 600;
    }
    .badge-blue  { background: #dbeafe; color: #1d4ed8; }
    .badge-green { background: #dcfce7; color: #16a34a; }
    .status-badge {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .status-draft       { background: #f3f4f6; color: #6b7280; }
    .status-in-progress { background: #fef3c7; color: #d97706; }
    .status-completed   { background: #dcfce7; color: #16a34a; }

    /* ═══════ Template grid ═══════════════════════════════════════════ */
    .template-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.25rem;
    }
    .template-card {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 0.75rem;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      transition: box-shadow 0.15s, border-color 0.15s;
    }
    .template-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-color: #c7d2fe; }
    .card-header { display: flex; flex-direction: column; gap: 0.375rem; }
    .card-title-row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .card-title { font-size: 1rem; font-weight: 600; color: #111827; margin: 0; }
    .specialty-tag {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      background: #ede9fe;
      color: #7c3aed;
      border-radius: 9999px;
      font-size: 0.6875rem;
      font-weight: 500;
    }
    .card-desc { font-size: 0.875rem; color: #6b7280; margin: 0; line-height: 1.5; }
    .card-meta {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.8125rem;
      color: #6b7280;
    }
    .tag-row { display: flex; gap: 0.375rem; flex-wrap: wrap; }
    .tag {
      padding: 0.125rem 0.5rem;
      background: #f3f4f6;
      color: #6b7280;
      border-radius: 0.25rem;
      font-size: 0.75rem;
    }
    .card-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: auto; padding-top: 0.25rem; }

    /* ═══════ Sheet list rows ═════════════════════════════════════════ */
    .sheets-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .sheet-row {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      transition: all 0.15s;
    }
    .sheet-row:hover { border-color: #a5b4fc; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .sheet-info { flex: 1; min-width: 0; }
    .sheet-title-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.375rem; }
    .sheet-name { font-size: 1rem; font-weight: 600; color: #111827; margin: 0; }
    .sheet-meta { display: flex; align-items: center; gap: 0.25rem; flex-wrap: wrap; font-size: 0.875rem; color: #6b7280; margin-bottom: 0.5rem; }
    .meta-dot { color: #d1d5db; }
    .shift-label { text-transform: capitalize; }
    .by-label { color: #9ca3af; font-style: italic; }
    .progress-bar-wrap { display: flex; align-items: center; gap: 0.75rem; }
    .progress-bar { flex: 1; max-width: 200px; height: 6px; background: #e5e7eb; border-radius: 9999px; overflow: hidden; }
    .progress-fill { height: 100%; background: #3b82f6; border-radius: 9999px; transition: width 0.3s; }
    .progress-label { font-size: 0.75rem; color: #6b7280; white-space: nowrap; }
    .sheet-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }

    /* ═══════ Empty states ════════════════════════════════════════════ */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      text-align: center;
      color: #9ca3af;
      background: #fafafa;
      border: 1px dashed #e5e7eb;
      border-radius: 0.75rem;
    }
    .empty-state p { margin: 0.75rem 0 0.25rem 0; font-weight: 500; color: #6b7280; font-size: 1rem; }
    .empty-state span { font-size: 0.875rem; }
    .empty-state-sm { padding: 1rem; text-align: center; color: #9ca3af; font-size: 0.875rem; }

    /* ═══════ Builder ═════════════════════════════════════════════════ */
    .builder-container { display: flex; flex-direction: column; gap: 0; }
    .builder-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0 0 1rem 0;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 1.5rem;
    }
    .builder-title { font-size: 1.25rem; font-weight: 600; color: #111827; margin: 0; flex: 1; }
    .builder-header-actions { display: flex; gap: 0.75rem; }
    .builder-body { display: grid; grid-template-columns: 280px 1fr; gap: 1.5rem; align-items: start; }
    .meta-panel, .sections-panel {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      padding: 1.25rem;
    }
    .panel-section-title { font-size: 0.875rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 1rem 0; }
    .sections-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }

    /* ═══════ Form controls ═══════════════════════════════════════════ */
    .form-group { margin-bottom: 1rem; }
    .form-group:last-child { margin-bottom: 0; }
    .form-label { display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.375rem; }
    .form-label-sm { display: block; font-size: 0.75rem; font-weight: 500; color: #6b7280; margin-bottom: 0.25rem; }
    .form-input {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      color: #111827;
      background: #fff;
      box-sizing: border-box;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .form-input:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
    .form-select {
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      color: #111827;
      background: #fff;
      cursor: pointer;
    }
    .form-select:focus { outline: none; border-color: #6366f1; }
    .form-check { display: flex; align-items: center; }
    .checkbox-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #374151; cursor: pointer; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }

    /* ═══════ Sections / fields DnD ══════════════════════════════════ */
    .sections-drop-list { display: flex; flex-direction: column; gap: 1rem; }
    .section-block {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      overflow: hidden;
    }
    .section-block.cdk-drag-preview {
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      opacity: 0.95;
    }
    .section-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: #f3f4f6;
      border-bottom: 1px solid #e5e7eb;
    }
    .drag-handle-area {
      color: #9ca3af;
      cursor: grab;
      flex-shrink: 0;
      display: flex;
      align-items: center;
    }
    .drag-handle-area:active { cursor: grabbing; }
    .section-title-input {
      flex: 1;
      padding: 0.375rem 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 0.25rem;
      font-size: 0.9375rem;
      font-weight: 600;
      color: #111827;
      background: #fff;
    }
    .section-title-input:focus { outline: none; border-color: #6366f1; }
    .section-controls { display: flex; align-items: center; gap: 0.5rem; }
    .toggle-label { display: flex; align-items: center; gap: 0.375rem; font-size: 0.75rem; color: #6b7280; cursor: pointer; white-space: nowrap; }

    .fields-drop-list {
      padding: 0.5rem;
      min-height: 2.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .field-item-block {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 0.5rem;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
    }
    .field-item-block.cdk-drag-preview {
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
    }
    .field-drag-handle {
      color: #9ca3af;
      cursor: grab;
      flex-shrink: 0;
      padding-top: 0.5rem;
    }
    .field-drag-handle:active { cursor: grabbing; }
    .field-editor { flex: 1; display: flex; flex-direction: column; gap: 0.375rem; }
    .field-row-top { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .field-label-input { flex: 1; min-width: 120px; }
    .field-row-extra { display: flex; flex-direction: column; gap: 0.25rem; }
    .field-remove-btn { flex-shrink: 0; margin-top: 0.25rem; }

    .size-toggle { display: flex; border: 1px solid #d1d5db; border-radius: 0.25rem; overflow: hidden; }
    .size-btn {
      padding: 0.25rem 0.5rem;
      background: #fff;
      border: none;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      color: #6b7280;
      transition: all 0.1s;
    }
    .size-btn.active { background: #6366f1; color: #fff; }
    .size-btn:not(.active):hover { background: #f3f4f6; }

    .add-field-btn { width: 100%; margin: 0.5rem 0 0.25rem 0; }

    /* DnD drag placeholder */
    .drag-placeholder { border-radius: 0.375rem; background: #e0e7ff; border: 2px dashed #818cf8; }
    .section-placeholder { height: 80px; }
    .field-placeholder { height: 44px; }

    /* ═══════ Viewer ══════════════════════════════════════════════════ */
    .viewer-container { display: flex; flex-direction: column; gap: 1rem; }
    .viewer-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
    }
    .viewer-header-left { display: flex; align-items: flex-start; gap: 1rem; }
    .viewer-title { font-size: 1.375rem; font-weight: 700; color: #111827; margin: 0 0 0.25rem 0; }
    .viewer-meta { display: flex; align-items: center; gap: 0.25rem; font-size: 0.875rem; color: #6b7280; flex-wrap: wrap; }
    .viewer-header-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }

    /* Table */
    .table-scroll-wrap {
      overflow-x: auto;
      overflow-y: auto;
      max-height: calc(100vh - 220px);
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
    }
    .rounding-table {
      border-collapse: collapse;
      width: max-content;
      min-width: 100%;
      font-size: 0.8125rem;
    }
    .rounding-table thead { position: sticky; top: 0; z-index: 10; }
    .thead-patient-row th, .thead-fields-row th {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      padding: 0.5rem 0.75rem;
      text-align: left;
      white-space: nowrap;
    }
    .section-header-cell {
      background: #ede9fe !important;
      color: #5b21b6;
      font-weight: 700;
      font-size: 0.8125rem;
      text-align: center !important;
      border-bottom: 2px solid #c4b5fd !important;
    }
    .col-patient-info {
      min-width: 180px;
      background: #f1f5f9 !important;
      font-weight: 700;
      font-size: 0.875rem;
    }
    .col-patient-info-sub {
      min-width: 180px;
      background: #f1f5f9 !important;
      color: #64748b;
      font-weight: 500;
    }
    .field-header { font-weight: 500; color: #374151; font-size: 0.8rem; }
    .field-header.required-field .field-header-label::after { content: ' *'; color: #ef4444; }
    .field-header-label { display: block; }
    .auto-badge {
      display: inline-block;
      padding: 0 0.25rem;
      background: #d1fae5;
      color: #065f46;
      border-radius: 0.2rem;
      font-size: 0.6rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    /* Table rows */
    .patient-row td { border: 1px solid #e5e7eb; vertical-align: top; padding: 0.375rem; }
    .patient-row:hover td { background: #fafafa; }
    .patient-info-cell {
      min-width: 180px;
      max-width: 220px;
      background: #f8fafc;
      padding: 0.5rem 0.75rem !important;
      vertical-align: top;
    }
    .patient-name { font-weight: 600; color: #111827; font-size: 0.875rem; margin-bottom: 0.125rem; }
    .patient-detail { font-size: 0.75rem; color: #6b7280; line-height: 1.4; }
    .diagnosis-text { font-style: italic; color: #4b5563; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
    .attending { color: #3b82f6; }
    .field-cell { padding: 0.375rem !important; vertical-align: middle; }

    /* Cell inputs */
    .cell-input, .cell-select {
      width: 100%;
      min-width: 80px;
      padding: 0.25rem 0.375rem;
      border: 1px solid #d1d5db;
      border-radius: 0.25rem;
      font-size: 0.8125rem;
      background: #fff;
      box-sizing: border-box;
    }
    .cell-input:focus, .cell-select:focus { outline: none; border-color: #6366f1; background: #faf5ff; }
    .cell-textarea {
      width: 100%;
      min-width: 160px;
      padding: 0.25rem 0.375rem;
      border: 1px solid #d1d5db;
      border-radius: 0.25rem;
      font-size: 0.8125rem;
      background: #fff;
      resize: vertical;
      box-sizing: border-box;
    }
    .cell-textarea:focus { outline: none; border-color: #6366f1; }
    .cell-checkbox { width: 16px; height: 16px; cursor: pointer; }
    .cell-readonly { font-size: 0.8125rem; color: #374151; padding: 0.125rem 0; line-height: 1.5; }
    .readonly-check { font-size: 1rem; }
    .empty-patients-cell { text-align: center; padding: 2rem !important; color: #9ca3af; font-style: italic; }
    .no-print-border { border: none !important; }

    /* ═══════ Modal ═══════════════════════════════════════════════════ */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal {
      background: #fff;
      border-radius: 0.75rem;
      width: 100%;
      max-width: 480px;
      max-height: 90vh;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.25);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }
    .modal-header h3 { font-size: 1.125rem; font-weight: 600; color: #111827; margin: 0; }
    .modal-body { padding: 1.5rem; overflow-y: auto; max-height: 60vh; }
    .modal-template-name { font-size: 0.875rem; color: #6b7280; margin: 0 0 1rem 0; }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid #e5e7eb;
      background: #f9fafb;
    }

    /* ═══════ Print styles ════════════════════════════════════════════ */
    .print-header { display: none; }
    .print-only { display: none; }

    @media print {
      .no-print, .viewer-header { display: none !important; }
      .print-only { display: block !important; }
      .print-header {
        display: block !important;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid #000;
      }
      .print-header h1 { font-size: 18pt; margin: 0 0 0.25rem 0; }
      .print-meta { font-size: 10pt; color: #555; }
      .rs-container { padding: 0; }
      .viewer-container { gap: 0.5rem; }
      .table-scroll-wrap {
        overflow: visible;
        max-height: none;
        border: none;
      }
      .rounding-table { font-size: 8pt; }
      .thead-patient-row th, .thead-fields-row th { background: #eee !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .section-header-cell { background: #ddd !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .patient-info-cell { background: #f5f5f5 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .cell-input, .cell-select, .cell-textarea { border: none !important; background: transparent !important; font-size: 8pt; }
      .page-break { page-break-before: always; }
      @page { margin: 1cm; }
    }

    /* ═══════ Dark mode ═══════════════════════════════════════════════ */
    :host-context(.dark) .page-title { color: #f3f4f6; }
    :host-context(.dark) .page-subtitle { color: #9ca3af; }
    :host-context(.dark) .template-card,
    :host-context(.dark) .sheet-row,
    :host-context(.dark) .meta-panel,
    :host-context(.dark) .sections-panel {
      background: #1f2937;
      border-color: #374151;
    }
    :host-context(.dark) .template-card:hover,
    :host-context(.dark) .sheet-row:hover { border-color: #4f46e5; }
    :host-context(.dark) .card-title,
    :host-context(.dark) .sheet-name,
    :host-context(.dark) .viewer-title { color: #f3f4f6; }
    :host-context(.dark) .card-desc,
    :host-context(.dark) .card-meta,
    :host-context(.dark) .sheet-meta { color: #9ca3af; }
    :host-context(.dark) .tab-btn { color: #9ca3af; }
    :host-context(.dark) .tab-btn:hover { color: #d1d5db; }
    :host-context(.dark) .tab-btn.active { color: #818cf8; border-bottom-color: #818cf8; }
    :host-context(.dark) .tab-bar { border-bottom-color: #374151; }
    :host-context(.dark) .form-input,
    :host-context(.dark) .form-select {
      background: #374151;
      border-color: #4b5563;
      color: #f3f4f6;
    }
    :host-context(.dark) .section-block { background: #374151; border-color: #4b5563; }
    :host-context(.dark) .section-header { background: #4b5563; border-bottom-color: #6b7280; }
    :host-context(.dark) .section-title-input { background: #374151; border-color: #4b5563; color: #f3f4f6; }
    :host-context(.dark) .field-item-block { background: #1f2937; border-color: #4b5563; }
    :host-context(.dark) .thead-patient-row th,
    :host-context(.dark) .thead-fields-row th { background: #374151; border-color: #4b5563; color: #d1d5db; }
    :host-context(.dark) .section-header-cell { background: #4c1d95 !important; color: #ddd6fe; }
    :host-context(.dark) .patient-row td { border-color: #374151; }
    :host-context(.dark) .patient-row:hover td { background: #2d3748; }
    :host-context(.dark) .patient-info-cell { background: #2d3748; }
    :host-context(.dark) .patient-name { color: #f3f4f6; }
    :host-context(.dark) .patient-detail { color: #9ca3af; }
    :host-context(.dark) .cell-input,
    :host-context(.dark) .cell-select,
    :host-context(.dark) .cell-textarea { background: #374151; border-color: #4b5563; color: #f3f4f6; }
    :host-context(.dark) .modal { background: #1f2937; }
    :host-context(.dark) .modal-header { border-bottom-color: #374151; }
    :host-context(.dark) .modal-header h3 { color: #f3f4f6; }
    :host-context(.dark) .modal-footer { background: #111827; border-top-color: #374151; }
    :host-context(.dark) .btn-secondary { background: #374151; color: #d1d5db; border-color: #4b5563; }
    :host-context(.dark) .btn-secondary:hover:not(:disabled) { background: #4b5563; }
    :host-context(.dark) .empty-state { background: #1f2937; border-color: #374151; color: #6b7280; }
    :host-context(.dark) .tag { background: #374151; color: #9ca3af; }
    :host-context(.dark) .panel-section-title { color: #9ca3af; }
    :host-context(.dark) .progress-bar { background: #374151; }
    :host-context(.dark) .table-scroll-wrap { border-color: #374151; }

    /* ═══════ Responsive ══════════════════════════════════════════════ */
    @media (max-width: 900px) {
      .builder-body { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
      .page-header { flex-direction: column; gap: 1rem; }
      .viewer-header { flex-direction: column; }
      .viewer-header-actions { flex-wrap: wrap; }
      .template-grid { grid-template-columns: 1fr; }
      .form-row { grid-template-columns: 1fr; }
    }
  `],
})
export class RoundingSheetsComponent implements OnInit {
  private svc = inject(RoundingSheetService);

  // ─── Data signals ────────────────────────────────────────────────────────────
  templates = signal<RoundingSheetTemplate[]>([]);
  sheets = signal<RoundingSheet[]>([]);

  // ─── View state ──────────────────────────────────────────────────────────────
  currentView = signal<ViewMode>('list');
  activeTab = signal<MainTab>('templates');

  // ─── Computed list filters ───────────────────────────────────────────────────
  activeSheets = computed(() =>
    this.sheets().filter(s => s.status === 'in-progress' || s.status === 'draft')
  );
  completedSheets = computed(() =>
    this.sheets().filter(s => s.status === 'completed')
  );

  // ─── Template builder state ──────────────────────────────────────────────────
  editingTemplate = signal<RoundingSheetTemplate | null>(null);
  builderName = signal('');
  builderDescription = signal('');
  builderSpecialty = signal('');
  builderIsShared = signal(false);
  builderSections = signal<RoundingSheetSection[]>([]);

  // ─── Sheet viewer state ──────────────────────────────────────────────────────
  viewerSheet = signal<RoundingSheet | null>(null);
  viewerTemplate = signal<RoundingSheetTemplate | null>(null);

  viewerTotalColumns = computed(() => {
    const tpl = this.viewerTemplate();
    if (!tpl) return 1;
    return 1 + tpl.sections.reduce((acc, s) => acc + s.fields.length, 0);
  });

  // ─── Create sheet modal ──────────────────────────────────────────────────────
  showCreateSheetModal = signal(false);
  selectedTemplateForSheet = signal<RoundingSheetTemplate | null>(null);
  newSheetDate = new Date().toISOString().split('T')[0];
  newSheetShift: 'day' | 'evening' | 'night' = 'day';
  newSheetUnit = '';

  // ─── Add patient modal ───────────────────────────────────────────────────────
  showAddPatientModal = signal(false);
  newPatientName = '';
  newPatientRoom = '';
  newPatientMRN = '';
  newPatientAdmitDate = new Date().toISOString().split('T')[0];
  newPatientAttending = '';
  newPatientDiagnosis = '';

  // ─── Static lookup data ──────────────────────────────────────────────────────
  readonly fieldTypeEntries = Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => ({
    value: value as FieldType,
    label,
  }));
  readonly columnSizes: ColumnSize[] = ['small', 'medium', 'large'];
  readonly commonDataSources = COMMON_DATA_SOURCES;
  readonly COLUMN_SIZE_WIDTHS = COLUMN_SIZE_WIDTHS;

  // ─── Lifecycle ───────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.svc.getTemplates().subscribe(ts => this.templates.set(ts));
    this.svc.getSheets().subscribe(ss => this.sheets.set(ss));
  }

  // ─── Helper: field width from size ───────────────────────────────────────────
  fieldWidth(size: ColumnSize): string {
    return COLUMN_SIZE_WIDTHS[size];
  }

  // ─── Template builder ────────────────────────────────────────────────────────
  startNewTemplate(): void {
    this.editingTemplate.set(null);
    this.builderName.set('');
    this.builderDescription.set('');
    this.builderSpecialty.set('');
    this.builderIsShared.set(false);
    this.builderSections.set([]);
    this.currentView.set('builder');
  }

  editTemplate(tpl: RoundingSheetTemplate): void {
    this.editingTemplate.set(tpl);
    this.builderName.set(tpl.name);
    this.builderDescription.set(tpl.description);
    this.builderSpecialty.set(tpl.specialty ?? '');
    this.builderIsShared.set(tpl.isShared);
    // Deep clone sections so we don't mutate the source
    this.builderSections.set(
      tpl.sections.map(s => ({
        ...s,
        fields: s.fields.map(f => ({ ...f })),
      }))
    );
    this.currentView.set('builder');
  }

  cancelBuilder(): void {
    this.currentView.set('list');
  }

  previewTemplate(): void {
    // Build a transient template and switch to viewer
    const tpl: RoundingSheetTemplate = {
      id: '__preview__',
      name: this.builderName() || 'Preview',
      description: this.builderDescription(),
      specialty: this.builderSpecialty(),
      isShared: this.builderIsShared(),
      isDefault: false,
      sections: this.builderSections(),
      createdBy: '',
      createdByName: '',
      createdAt: '',
      updatedAt: '',
      useCount: 0,
    };
    const previewSheet: RoundingSheet = {
      id: '__preview_sheet__',
      templateId: '__preview__',
      templateName: tpl.name,
      date: new Date().toISOString().split('T')[0],
      shift: 'day',
      unit: 'Preview Unit',
      patients: [],
      createdBy: '',
      createdByName: '',
      createdAt: '',
      updatedAt: '',
      status: 'draft',
    };
    this.viewerTemplate.set(tpl);
    this.viewerSheet.set(previewSheet);
    this.currentView.set('viewer');
  }

  saveTemplate(): void {
    const name = this.builderName().trim();
    if (!name) return;

    const sections = this.builderSections().map((s, si) => ({
      ...s,
      order: si,
      fields: s.fields.map((f, fi) => ({ ...f, order: fi })),
    }));

    const editing = this.editingTemplate();
    if (editing) {
      this.svc
        .updateTemplate(editing.id, {
          name,
          description: this.builderDescription(),
          specialty: this.builderSpecialty(),
          isShared: this.builderIsShared(),
          sections,
        })
        .subscribe(updated => {
          this.templates.update(ts => ts.map(t => (t.id === updated.id ? updated : t)));
          this.currentView.set('list');
        });
    } else {
      this.svc
        .createTemplate({
          name,
          description: this.builderDescription(),
          specialty: this.builderSpecialty(),
          isShared: this.builderIsShared(),
          sections,
        })
        .subscribe(newTpl => {
          this.templates.update(ts => [...ts, newTpl]);
          this.currentView.set('list');
        });
    }
  }

  cloneTemplate(tpl: RoundingSheetTemplate): void {
    this.svc.cloneTemplate(tpl.id).subscribe(cloned => {
      this.templates.update(ts => [...ts, cloned]);
    });
  }

  deleteTemplate(tpl: RoundingSheetTemplate): void {
    if (!confirm(`Delete template "${tpl.name}"? This cannot be undone.`)) return;
    this.svc.deleteTemplate(tpl.id).subscribe(() => {
      this.templates.update(ts => ts.filter(t => t.id !== tpl.id));
    });
  }

  // ─── Section editing ─────────────────────────────────────────────────────────
  addSection(): void {
    const sections = this.builderSections();
    const newSection: RoundingSheetSection = {
      id: `SEC-NEW-${Date.now()}`,
      title: 'New Section',
      order: sections.length,
      isCollapsible: true,
      fields: [],
    };
    this.builderSections.set([...sections, newSection]);
  }

  removeSection(index: number): void {
    const sections = [...this.builderSections()];
    sections.splice(index, 1);
    this.builderSections.set(sections);
  }

  updateSectionTitle(index: number, title: string): void {
    const sections = [...this.builderSections()];
    sections[index] = { ...sections[index], title };
    this.builderSections.set(sections);
  }

  toggleSectionCollapsible(index: number, value: boolean): void {
    const sections = [...this.builderSections()];
    sections[index] = { ...sections[index], isCollapsible: value };
    this.builderSections.set(sections);
  }

  dropSection(event: CdkDragDrop<RoundingSheetSection[]>): void {
    const sections = [...this.builderSections()];
    moveItemInArray(sections, event.previousIndex, event.currentIndex);
    this.builderSections.set(sections);
  }

  // ─── Field editing ───────────────────────────────────────────────────────────
  addField(sectionIndex: number): void {
    const sections = [...this.builderSections()];
    const section = { ...sections[sectionIndex] };
    const newField: RoundingSheetField = {
      id: `FLD-NEW-${Date.now()}`,
      type: 'text',
      label: 'New Field',
      columnSize: 'medium',
      required: false,
      order: section.fields.length,
    };
    section.fields = [...section.fields, newField];
    sections[sectionIndex] = section;
    this.builderSections.set(sections);
  }

  removeField(sectionIndex: number, fieldIndex: number): void {
    const sections = [...this.builderSections()];
    const section = { ...sections[sectionIndex] };
    section.fields = section.fields.filter((_, i) => i !== fieldIndex);
    sections[sectionIndex] = section;
    this.builderSections.set(sections);
  }

  updateFieldLabel(sectionIndex: number, fieldIndex: number, label: string): void {
    this.patchField(sectionIndex, fieldIndex, { label });
  }

  updateFieldType(sectionIndex: number, fieldIndex: number, type: string): void {
    this.patchField(sectionIndex, fieldIndex, { type: type as FieldType });
  }

  updateFieldSize(sectionIndex: number, fieldIndex: number, columnSize: ColumnSize): void {
    this.patchField(sectionIndex, fieldIndex, { columnSize });
  }

  updateFieldRequired(sectionIndex: number, fieldIndex: number, required: boolean): void {
    this.patchField(sectionIndex, fieldIndex, { required });
  }

  updateFieldOptions(sectionIndex: number, fieldIndex: number, raw: string): void {
    const options = raw
      .split(',')
      .map(o => o.trim())
      .filter(o => o.length > 0);
    this.patchField(sectionIndex, fieldIndex, { options });
  }

  updateFieldDataSource(sectionIndex: number, fieldIndex: number, dataSource: string): void {
    this.patchField(sectionIndex, fieldIndex, { dataSource: dataSource || undefined });
  }

  dropField(event: CdkDragDrop<RoundingSheetField[]>, sectionIndex: number): void {
    const sections = [...this.builderSections()];
    const section = { ...sections[sectionIndex] };
    const fields = [...section.fields];
    moveItemInArray(fields, event.previousIndex, event.currentIndex);
    section.fields = fields;
    sections[sectionIndex] = section;
    this.builderSections.set(sections);
  }

  getConnectedFieldLists(): string[] {
    return this.builderSections().map(s => `field-list-${s.id}`);
  }

  private patchField(
    sectionIndex: number,
    fieldIndex: number,
    patch: Partial<RoundingSheetField>
  ): void {
    const sections = [...this.builderSections()];
    const section = { ...sections[sectionIndex] };
    const fields = [...section.fields];
    fields[fieldIndex] = { ...fields[fieldIndex], ...patch };
    section.fields = fields;
    sections[sectionIndex] = section;
    this.builderSections.set(sections);
  }

  // ─── Sheet management ────────────────────────────────────────────────────────
  openCreateSheetModal(tpl: RoundingSheetTemplate): void {
    this.selectedTemplateForSheet.set(tpl);
    this.newSheetDate = new Date().toISOString().split('T')[0];
    this.newSheetShift = 'day';
    this.newSheetUnit = '';
    this.showCreateSheetModal.set(true);
  }

  confirmCreateSheet(): void {
    const tpl = this.selectedTemplateForSheet();
    if (!tpl || !this.newSheetDate || !this.newSheetUnit) return;
    this.svc
      .createSheet(tpl.id, this.newSheetDate, this.newSheetShift, this.newSheetUnit)
      .subscribe(sheet => {
        this.sheets.update(ss => [...ss, sheet]);
        this.showCreateSheetModal.set(false);
        this.activeTab.set('active');
        this.openViewer(sheet);
      });
  }

  openViewer(sheet: RoundingSheet): void {
    const tpl = this.templates().find(t => t.id === sheet.templateId);
    if (!tpl) return;
    this.viewerSheet.set({ ...sheet });
    this.viewerTemplate.set(tpl);
    this.currentView.set('viewer');
  }

  closeViewer(): void {
    // If we were in preview mode, return to builder
    if (this.viewerSheet()?.id === '__preview_sheet__') {
      this.currentView.set('builder');
    } else {
      this.currentView.set('list');
    }
    this.viewerSheet.set(null);
    this.viewerTemplate.set(null);
  }

  completeSheet(sheet: RoundingSheet): void {
    if (!confirm(`Mark sheet "${sheet.templateName}" as completed?`)) return;
    this.svc.completeSheet(sheet.id).subscribe(updated => {
      this.sheets.update(ss => ss.map(s => (s.id === updated.id ? updated : s)));
      if (this.viewerSheet()?.id === updated.id) {
        this.viewerSheet.set(updated);
      }
    });
  }

  exportSheet(sheet: RoundingSheet): void {
    this.svc.exportToPdf(sheet.id).subscribe(() => {
      // Mock: in production this would trigger download
      alert(`PDF export for "${sheet.templateName}" (${this.formatDate(sheet.date)}) would download here.`);
    });
  }

  cloneSheet(sheet: RoundingSheet): void {
    const tpl = this.selectedTemplateForSheet() ?? this.templates().find(t => t.id === sheet.templateId);
    if (!tpl) return;
    this.openCreateSheetModal(tpl);
  }

  printSheet(): void {
    window.print();
  }

  // ─── Patient management ──────────────────────────────────────────────────────
  addPatientToSheet(): void {
    this.newPatientName = '';
    this.newPatientRoom = '';
    this.newPatientMRN = '';
    this.newPatientAdmitDate = new Date().toISOString().split('T')[0];
    this.newPatientAttending = '';
    this.newPatientDiagnosis = '';
    this.showAddPatientModal.set(true);
  }

  confirmAddPatient(): void {
    const sheet = this.viewerSheet();
    if (!sheet || !this.newPatientName) return;

    const newPatient: PatientRoundingData = {
      patientId: `PAT-NEW-${Date.now()}`,
      patientName: this.newPatientName,
      room: this.newPatientRoom,
      mrn: this.newPatientMRN,
      admitDate: this.newPatientAdmitDate,
      attendingPhysician: this.newPatientAttending,
      diagnosis: this.newPatientDiagnosis,
      entries: [],
    };

    const updatedSheet: RoundingSheet = {
      ...sheet,
      patients: [...sheet.patients, newPatient],
      status: sheet.status === 'draft' ? 'in-progress' : sheet.status,
      updatedAt: new Date().toISOString(),
    };

    this.svc.updateSheet(sheet.id, updatedSheet).subscribe(saved => {
      this.viewerSheet.set(saved);
      this.sheets.update(ss => ss.map(s => (s.id === saved.id ? saved : s)));
      this.showAddPatientModal.set(false);
    });
  }

  // ─── Entry editing ───────────────────────────────────────────────────────────
  getEntry(patient: PatientRoundingData, fieldId: string): string {
    return patient.entries.find(e => e.fieldId === fieldId)?.value ?? '';
  }

  getEntryBool(patient: PatientRoundingData, fieldId: string): boolean {
    return this.getEntry(patient, fieldId) === 'true';
  }

  updateEntry(patientIndex: number, fieldId: string, value: string): void {
    const sheet = this.viewerSheet();
    if (!sheet) return;

    const patients = sheet.patients.map((p, idx) => {
      if (idx !== patientIndex) return p;
      const entries = p.entries.filter(e => e.fieldId !== fieldId);
      if (value !== '' && value !== undefined) {
        entries.push({ fieldId, value });
      }
      return { ...p, entries };
    });

    const updatedSheet = {
      ...sheet,
      patients,
      updatedAt: new Date().toISOString(),
    };
    this.viewerSheet.set(updatedSheet);

    // Debounce or batch in production; fine for mock
    this.svc.updateSheet(sheet.id, { patients }).subscribe(saved => {
      this.sheets.update(ss => ss.map(s => (s.id === saved.id ? saved : s)));
    });
  }

  // ─── Progress calculation ────────────────────────────────────────────────────
  calcProgress(sheet: RoundingSheet): number {
    const tpl = this.templates().find(t => t.id === sheet.templateId);
    if (!tpl || sheet.patients.length === 0) return 0;

    const requiredFields = tpl.sections
      .flatMap(s => s.fields)
      .filter(f => f.required);

    if (requiredFields.length === 0) {
      // Fall back to any-entry progress
      const totalFields = tpl.sections.reduce((a, s) => a + s.fields.length, 0);
      if (totalFields === 0) return 100;
      const filled = sheet.patients.reduce((a, p) => a + p.entries.length, 0);
      const total = sheet.patients.length * totalFields;
      return Math.min(100, Math.round((filled / total) * 100));
    }

    const filled = sheet.patients.reduce((acc, p) => {
      const patientFilled = requiredFields.filter(f =>
        p.entries.some(e => e.fieldId === f.id && e.value !== '')
      ).length;
      return acc + patientFilled;
    }, 0);

    const total = sheet.patients.length * requiredFields.length;
    return Math.min(100, Math.round((filled / total) * 100));
  }

  // ─── Formatters ──────────────────────────────────────────────────────────────
  formatDate(iso: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  formatStatus(status: string): string {
    switch (status) {
      case 'draft': return 'Draft';
      case 'in-progress': return 'In Progress';
      case 'completed': return 'Completed';
      default: return status;
    }
  }

  capitalize(s: string): string {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
  }

  countFields(tpl: RoundingSheetTemplate): number {
    return tpl.sections.reduce((acc, s) => acc + s.fields.length, 0);
  }
}
