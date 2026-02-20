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
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SkeletonModule } from 'primeng/skeleton';
import { DividerModule } from 'primeng/divider';
import { MessageService, ConfirmationService } from 'primeng/api';

import { InternalNotesService } from '../data-access/services/internal-notes.service';
import { ThemeService } from '../../../core/services/theme.service';
import { MarkdownPipe } from '../../../shared/pipes/markdown.pipe';
import {
  InternalNote,
  NoteCategory,
  NoteVisibility,
  CreateInternalNoteDto,
  UpdateInternalNoteDto,
  NOTE_CATEGORY_LABELS,
  NOTE_CATEGORY_ICONS,
  NOTE_CATEGORY_COLORS,
  NOTE_VISIBILITY_LABELS,
  NOTE_VISIBILITY_ICONS,
} from '../data-access/models/internal-note.model';

interface SelectOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-internal-notes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MessageService, ConfirmationService],
  imports: [
    CommonModule,
    FormsModule,
    MarkdownPipe,
    // PrimeNG
    ButtonModule,
    CardModule,
    DialogModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
    TagModule,
    ChipModule,
    BadgeModule,
    TooltipModule,
    ToastModule,
    ConfirmDialogModule,
    ToggleSwitchModule,
    SkeletonModule,
    DividerModule,
  ],
  template: `
    <p-toast position="top-right" />
    <p-confirmDialog />

    <div class="internal-notes-container" [class.dark]="themeService.isDarkMode()">

      <!-- Staff-Only Banner -->
      <div class="staff-only-banner" role="banner" aria-label="Staff only restricted content">
        <div class="banner-inner">
          <div class="banner-left">
            <span class="banner-lock-icon">
              <i class="pi pi-lock"></i>
            </span>
            <div class="banner-text">
              <span class="banner-title">STAFF ONLY &mdash; INTERNAL</span>
              <span class="banner-subtitle">
                This section contains confidential clinical notes not visible to patients or unauthorized personnel.
                Access is logged and audited.
              </span>
            </div>
          </div>
          <div class="banner-right">
            <span class="banner-badge">
              <i class="pi pi-eye-slash"></i>
              Not visible to patients
            </span>
          </div>
        </div>
      </div>

      <!-- Filter & Action Bar -->
      <div class="filter-bar">
        <div class="filter-controls">

          <!-- Search -->
          <span class="p-input-icon-left search-wrapper">
            <i class="pi pi-search search-icon"></i>
            <input
              pInputText
              type="text"
              class="search-input"
              placeholder="Search notes..."
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
              aria-label="Search internal notes"
            />
          </span>

          <!-- Category Filter -->
          <p-select
            [options]="categoryOptions"
            [ngModel]="categoryFilter()"
            (ngModelChange)="categoryFilter.set($event)"
            optionLabel="label"
            optionValue="value"
            placeholder="All Categories"
            styleClass="filter-select"
            aria-label="Filter by category"
          />

          <!-- Visibility Filter -->
          <p-select
            [options]="visibilityOptions"
            [ngModel]="visibilityFilter()"
            (ngModelChange)="visibilityFilter.set($event)"
            optionLabel="label"
            optionValue="value"
            placeholder="All Visibility"
            styleClass="filter-select"
            aria-label="Filter by visibility"
          />

          <!-- Show Archived Toggle -->
          <label class="archived-toggle" for="showArchivedToggle">
            <p-toggleSwitch
              inputId="showArchivedToggle"
              [ngModel]="showArchived()"
              (ngModelChange)="showArchived.set($event)"
              aria-label="Show archived notes"
            />
            <span class="toggle-label">Show archived</span>
          </label>
        </div>

        <div class="filter-actions">
          <span class="notes-count">
            {{ filteredNotes().length }} note{{ filteredNotes().length !== 1 ? 's' : '' }}
          </span>
          <p-button
            label="New Note"
            icon="pi pi-plus"
            (onClick)="openCreateDialog()"
            severity="danger"
            aria-label="Create new internal note"
          />
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="notes-list" aria-label="Loading notes">
          @for (i of [1, 2, 3]; track i) {
            <div class="note-card-skeleton">
              <p-skeleton width="60%" height="1.25rem" styleClass="mb-2" />
              <p-skeleton width="40%" height="0.875rem" styleClass="mb-3" />
              <p-skeleton width="100%" height="3rem" />
            </div>
          }
        </div>
      }

      <!-- Empty State -->
      @else if (filteredNotes().length === 0) {
        <div class="empty-state" role="status">
          <div class="empty-icon">
            <i class="pi pi-lock"></i>
          </div>
          <h3>No internal notes found</h3>
          <p>
            @if (hasActiveFilters()) {
              No notes match your current filters. Try adjusting the filters or
              <button class="link-btn" (click)="clearFilters()">clear all filters</button>.
            } @else {
              No internal notes have been created for this patient yet.
            }
          </p>
          <p-button
            label="Create First Note"
            icon="pi pi-plus"
            (onClick)="openCreateDialog()"
            severity="danger"
            [outlined]="true"
          />
        </div>
      }

      <!-- Notes List -->
      @else {
        <div class="notes-list" role="list" aria-label="Internal notes">

          <!-- Pinned Notes Section -->
          @if (pinnedNotes().length > 0) {
            <div class="section-header pinned-header">
              <i class="pi pi-thumbtack"></i>
              <span>Pinned Notes</span>
            </div>
            @for (note of pinnedNotes(); track note.id) {
              <div
                class="note-card pinned"
                [class.archived]="note.isArchived"
                [class.selected]="selectedNote()?.id === note.id"
                role="listitem"
                (click)="selectNote(note)"
                (keydown.enter)="selectNote(note)"
                (keydown.space)="selectNote(note)"
                tabindex="0"
                [attr.aria-label]="'Internal note: ' + note.title"
                [attr.aria-expanded]="selectedNote()?.id === note.id"
              >
                <ng-container *ngTemplateOutlet="noteCardTpl; context: { $implicit: note }" />
              </div>
            }
            <div class="section-divider"></div>
          }

          <!-- Regular Notes Section -->
          @if (unpinnedNotes().length > 0) {
            @if (pinnedNotes().length > 0) {
              <div class="section-header">
                <span>All Notes</span>
              </div>
            }
            @for (note of unpinnedNotes(); track note.id) {
              <div
                class="note-card"
                [class.archived]="note.isArchived"
                [class.selected]="selectedNote()?.id === note.id"
                role="listitem"
                (click)="selectNote(note)"
                (keydown.enter)="selectNote(note)"
                (keydown.space)="selectNote(note)"
                tabindex="0"
                [attr.aria-label]="'Internal note: ' + note.title"
                [attr.aria-expanded]="selectedNote()?.id === note.id"
              >
                <ng-container *ngTemplateOutlet="noteCardTpl; context: { $implicit: note }" />
              </div>
            }
          }
        </div>
      }

      <!-- Note Detail Panel -->
      @if (selectedNote()) {
        <div class="note-detail-panel" role="region" aria-label="Note detail">
          <div class="detail-header">
            <div class="detail-header-left">
              <span
                class="category-badge"
                [style.background]="getCategoryBg(selectedNote()!.category)"
                [style.color]="getCategoryText(selectedNote()!.category)"
              >
                <i [class]="getCategoryIcon(selectedNote()!.category)"></i>
                {{ getCategoryLabel(selectedNote()!.category) }}
              </span>
              <span class="visibility-badge">
                <i [class]="getVisibilityIcon(selectedNote()!.visibility)"></i>
                {{ getVisibilityLabel(selectedNote()!.visibility) }}
              </span>
              @if (selectedNote()!.version > 1) {
                <span class="version-badge" pTooltip="This note has been edited {{ selectedNote()!.version - 1 }} time(s)">
                  v{{ selectedNote()!.version }}
                </span>
              }
            </div>
            <div class="detail-header-right">
              <p-button
                icon="pi pi-pencil"
                pTooltip="Edit Note"
                tooltipPosition="bottom"
                [rounded]="true"
                [text]="true"
                (onClick)="openEditDialog(selectedNote()!)"
                aria-label="Edit this note"
              />
              <p-button
                [icon]="selectedNote()!.isPinned ? 'pi pi-thumbtack' : 'pi pi-thumbtack'"
                [pTooltip]="selectedNote()!.isPinned ? 'Unpin Note' : 'Pin Note'"
                tooltipPosition="bottom"
                [rounded]="true"
                [text]="true"
                [severity]="selectedNote()!.isPinned ? 'warn' : 'secondary'"
                (onClick)="handleTogglePin(selectedNote()!)"
                [attr.aria-label]="selectedNote()!.isPinned ? 'Unpin this note' : 'Pin this note'"
              />
              <p-button
                [icon]="selectedNote()!.isArchived ? 'pi pi-inbox' : 'pi pi-box'"
                [pTooltip]="selectedNote()!.isArchived ? 'Restore from Archive' : 'Archive Note'"
                tooltipPosition="bottom"
                [rounded]="true"
                [text]="true"
                severity="secondary"
                (onClick)="handleToggleArchive(selectedNote()!)"
                [attr.aria-label]="selectedNote()!.isArchived ? 'Restore this note' : 'Archive this note'"
              />
              <p-button
                icon="pi pi-trash"
                pTooltip="Delete Note"
                tooltipPosition="bottom"
                [rounded]="true"
                [text]="true"
                severity="danger"
                (onClick)="confirmDelete(selectedNote()!)"
                aria-label="Delete this note"
              />
              <p-button
                icon="pi pi-times"
                pTooltip="Close"
                tooltipPosition="bottom"
                [rounded]="true"
                [text]="true"
                severity="secondary"
                (onClick)="selectedNote.set(null)"
                aria-label="Close note detail"
              />
            </div>
          </div>

          <h2 class="detail-title">{{ selectedNote()!.title }}</h2>

          <div class="detail-meta">
            <span class="meta-author">
              <i class="pi pi-user"></i>
              {{ selectedNote()!.authorName }}
              <span class="meta-role">&middot; {{ selectedNote()!.authorRole }}</span>
            </span>
            <span class="meta-dates">
              <span>
                <i class="pi pi-calendar"></i>
                Created {{ selectedNote()!.createdAt | date:'mediumDate' }}
              </span>
              @if (selectedNote()!.updatedAt !== selectedNote()!.createdAt) {
                <span>
                  <i class="pi pi-clock"></i>
                  Updated {{ selectedNote()!.updatedAt | date:'medium' }}
                </span>
              }
            </span>
            @if (selectedNote()!.readCount) {
              <span class="meta-reads">
                <i class="pi pi-eye"></i>
                {{ selectedNote()!.readCount }} read{{ selectedNote()!.readCount !== 1 ? 's' : '' }}
              </span>
            }
          </div>

          @if (selectedNote()!.tags.length > 0) {
            <div class="detail-tags" aria-label="Tags">
              @for (tag of selectedNote()!.tags; track tag) {
                <p-chip [label]="tag" styleClass="note-tag" />
              }
            </div>
          }

          <p-divider />

          <!-- Markdown Content -->
          <div
            class="markdown-content"
            [innerHTML]="selectedNote()!.content | markdown"
            role="article"
            aria-label="Note content"
          ></div>

          <!-- Version History -->
          @if (selectedNote()!.versions.length > 1) {
            <p-divider />
            <div class="version-history" role="region" aria-label="Version history">
              <button
                class="version-toggle"
                (click)="showVersionHistory.set(!showVersionHistory())"
                [attr.aria-expanded]="showVersionHistory()"
                aria-controls="versionHistoryPanel"
              >
                <i class="pi pi-history"></i>
                <span>Version History ({{ selectedNote()!.versions.length }} revisions)</span>
                <i [class]="showVersionHistory() ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" class="toggle-chevron"></i>
              </button>

              @if (showVersionHistory()) {
                <div class="version-timeline" id="versionHistoryPanel" role="list">
                  @for (ver of selectedNote()!.versions | slice : 0 : 0; track ver.version) {
                    <!-- empty: loop below in reverse -->
                  }
                  @for (ver of getVersionsReversed(selectedNote()!); track ver.version) {
                    <div class="version-item" role="listitem">
                      <div class="version-dot" [class.current]="ver.version === selectedNote()!.version">
                        <span>v{{ ver.version }}</span>
                      </div>
                      <div class="version-content">
                        <div class="version-header">
                          <span class="version-title">{{ ver.title }}</span>
                          <span class="version-meta">
                            {{ ver.editedByName }} &middot;
                            {{ ver.editedAt | date:'medium' }}
                          </span>
                        </div>
                        @if (ver.changeDescription) {
                          <p class="version-description">
                            <i class="pi pi-info-circle"></i>
                            {{ ver.changeDescription }}
                          </p>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>

    <!-- Note Card Template -->
    <ng-template #noteCardTpl let-note>
      <div class="note-card-inner">
        <div class="note-card-header">
          <div class="note-card-left">
            <span
              class="category-icon-badge"
              [style.background]="getCategoryBg(note.category)"
              [style.color]="getCategoryText(note.category)"
              [attr.aria-label]="getCategoryLabel(note.category) + ' category'"
            >
              <i [class]="getCategoryIcon(note.category)"></i>
            </span>
            <div class="note-card-info">
              <div class="note-card-title-row">
                @if (note.isPinned) {
                  <i class="pi pi-thumbtack pin-indicator" aria-label="Pinned"></i>
                }
                @if (note.isArchived) {
                  <i class="pi pi-box archive-indicator" aria-label="Archived"></i>
                }
                <span class="note-card-title">{{ note.title }}</span>
              </div>
              <div class="note-card-author">
                <i class="pi pi-user"></i>
                <span>{{ note.authorName }}</span>
                <span class="separator">&middot;</span>
                <span class="note-date">{{ note.updatedAt | date:'mediumDate' }}</span>
              </div>
            </div>
          </div>

          <div class="note-card-right">
            @if (note.version > 1) {
              <span class="version-chip" [pTooltip]="'Version ' + note.version" tooltipPosition="left">
                v{{ note.version }}
              </span>
            }
            <span
              class="visibility-chip"
              [class]="'vis-' + note.visibility"
              [pTooltip]="getVisibilityLabel(note.visibility)"
              tooltipPosition="left"
            >
              <i [class]="getVisibilityIcon(note.visibility)"></i>
            </span>
          </div>
        </div>

        @if (note.tags.length > 0) {
          <div class="note-card-tags">
            @for (tag of note.tags.slice(0, 4); track tag) {
              <span class="tag-chip">{{ tag }}</span>
            }
            @if (note.tags.length > 4) {
              <span class="tag-chip tag-more">+{{ note.tags.length - 4 }}</span>
            }
          </div>
        }
      </div>
    </ng-template>

    <!-- Create / Edit Dialog -->
    <p-dialog
      [header]="editingNote() ? 'Edit Internal Note' : 'New Internal Note'"
      [visible]="showEditor()"
      (visibleChange)="handleDialogClose($event)"
      [modal]="true"
      [style]="{ width: '720px', maxWidth: '95vw' }"
      [draggable]="false"
      [resizable]="false"
      styleClass="internal-note-dialog"
      role="dialog"
      [attr.aria-label]="editingNote() ? 'Edit internal note' : 'Create internal note'"
    >
      <div class="dialog-staff-notice" role="note">
        <i class="pi pi-lock"></i>
        <span>This note is <strong>staff-only</strong> and will not be visible to patients.</span>
      </div>

      <div class="dialog-form">

        <!-- Title -->
        <div class="form-field">
          <label for="noteTitle" class="form-label">
            Title <span class="required" aria-hidden="true">*</span>
          </label>
          <input
            id="noteTitle"
            pInputText
            type="text"
            [(ngModel)]="draftTitle"
            placeholder="Enter note title..."
            class="w-full"
            [attr.aria-required]="true"
          />
        </div>

        <div class="form-row">
          <!-- Category -->
          <div class="form-field">
            <label for="noteCategory" class="form-label">
              Category <span class="required" aria-hidden="true">*</span>
            </label>
            <p-select
              inputId="noteCategory"
              [options]="categoryOptionsForForm"
              [(ngModel)]="draftCategory"
              optionLabel="label"
              optionValue="value"
              placeholder="Select category"
              styleClass="w-full"
              [attr.aria-required]="true"
            />
          </div>

          <!-- Visibility -->
          <div class="form-field">
            <label for="noteVisibility" class="form-label">
              Visibility <span class="required" aria-hidden="true">*</span>
            </label>
            <p-select
              inputId="noteVisibility"
              [options]="visibilityOptionsForForm"
              [(ngModel)]="draftVisibility"
              optionLabel="label"
              optionValue="value"
              placeholder="Select visibility"
              styleClass="w-full"
              [attr.aria-required]="true"
            />
          </div>
        </div>

        <!-- Tags -->
        <div class="form-field">
          <label for="noteTags" class="form-label">Tags</label>
          <input
            id="noteTags"
            pInputText
            type="text"
            [(ngModel)]="draftTagsInput"
            placeholder="Enter tags separated by commas (e.g. urgent, follow-up, referral)"
            class="w-full"
            aria-describedby="tagsHint"
          />
          <span id="tagsHint" class="field-hint">Separate multiple tags with commas</span>
          @if (parsedDraftTags.length > 0) {
            <div class="draft-tags-preview" aria-label="Tag preview">
              @for (tag of parsedDraftTags; track tag) {
                <span class="tag-chip">{{ tag }}</span>
              }
            </div>
          }
        </div>

        <!-- Content -->
        <div class="form-field content-field">
          <div class="content-field-header">
            <label for="noteContent" class="form-label">
              Content (Markdown supported) <span class="required" aria-hidden="true">*</span>
            </label>
            <div class="preview-toggle">
              <button
                class="preview-btn"
                [class.active]="!showPreview"
                (click)="showPreview = false"
                type="button"
                [attr.aria-pressed]="!showPreview"
              >
                <i class="pi pi-pencil"></i> Write
              </button>
              <button
                class="preview-btn"
                [class.active]="showPreview"
                (click)="showPreview = true"
                type="button"
                [attr.aria-pressed]="showPreview"
              >
                <i class="pi pi-eye"></i> Preview
              </button>
            </div>
          </div>

          @if (!showPreview) {
            <textarea
              id="noteContent"
              pTextarea
              [(ngModel)]="draftContent"
              [rows]="14"
              placeholder="Write note content using Markdown...

# Example heading
**Bold text**, *italic text*

- Bullet point 1
- Bullet point 2

> Blockquote for important notices"
              class="content-textarea"
              [attr.aria-required]="true"
            ></textarea>
          } @else {
            <div
              class="content-preview markdown-content"
              [innerHTML]="draftContent | markdown"
              role="region"
              aria-label="Content preview"
            >
              @if (!draftContent) {
                <p class="preview-placeholder">Nothing to preview yet...</p>
              }
            </div>
          }
        </div>

        <!-- Change Description (edit mode only) -->
        @if (editingNote()) {
          <div class="form-field">
            <label for="changeDescription" class="form-label">Change Description</label>
            <input
              id="changeDescription"
              pInputText
              type="text"
              [(ngModel)]="draftChangeDescription"
              placeholder="Brief summary of what changed (optional)"
              class="w-full"
            />
          </div>
        }
      </div>

      <ng-template pTemplate="footer">
        <div class="dialog-footer">
          <p-button
            label="Cancel"
            icon="pi pi-times"
            severity="secondary"
            [outlined]="true"
            (onClick)="handleDialogClose(false)"
          />
          <p-button
            [label]="editingNote() ? 'Save Changes' : 'Create Note'"
            icon="pi pi-check"
            severity="danger"
            (onClick)="saveNote()"
            [loading]="saving()"
            [disabled]="!isFormValid()"
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
    .internal-notes-container {
      display: flex;
      flex-direction: column;
      gap: 0;
      min-height: 100%;
    }

    /* ================================================================
       Staff-Only Banner
    ================================================================ */
    .staff-only-banner {
      background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
      color: white;
      padding: 0.875rem 1.5rem;
      border-bottom: 3px solid #7f1d1d;
    }

    @media print {
      .staff-only-banner {
        display: none;
      }
    }

    .banner-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .banner-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .banner-lock-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      flex-shrink: 0;
    }

    .banner-lock-icon i {
      font-size: 1.125rem;
    }

    .banner-text {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .banner-title {
      font-size: 0.9375rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      line-height: 1.2;
    }

    .banner-subtitle {
      font-size: 0.75rem;
      opacity: 0.85;
      line-height: 1.4;
    }

    .banner-right {
      flex-shrink: 0;
    }

    .banner-badge {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 0.375rem 0.75rem;
      border-radius: 9999px;
      white-space: nowrap;
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
      padding: 1rem 1.5rem;
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
      gap: 0.75rem;
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
    }

    .search-input {
      padding-left: 2.25rem !important;
      min-width: 220px;
    }

    :host ::ng-deep .filter-select {
      min-width: 160px;
    }

    .archived-toggle {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      user-select: none;
    }

    .toggle-label {
      font-size: 0.875rem;
      color: #64748b;
      white-space: nowrap;
    }

    .dark .toggle-label {
      color: #94a3b8;
    }

    .filter-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-shrink: 0;
    }

    .notes-count {
      font-size: 0.875rem;
      color: #64748b;
      white-space: nowrap;
    }

    .dark .notes-count {
      color: #94a3b8;
    }

    /* ================================================================
       Section Headers
    ================================================================ */
    .section-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem 0.375rem;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #94a3b8;
    }

    .section-header.pinned-header {
      color: #f59e0b;
    }

    .section-header.pinned-header i {
      color: #f59e0b;
    }

    .section-divider {
      height: 1px;
      background: #e2e8f0;
      margin: 0.25rem 1.5rem 0.75rem;
    }

    .dark .section-divider {
      background: #334155;
    }

    /* ================================================================
       Notes List
    ================================================================ */
    .notes-list {
      display: flex;
      flex-direction: column;
      padding: 0.75rem 1.5rem;
      gap: 0.625rem;
    }

    /* ================================================================
       Note Card
    ================================================================ */
    .note-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 1rem 1.25rem;
      cursor: pointer;
      transition: all 0.18s ease;
      outline: none;
    }

    .dark .note-card {
      background: #1e293b;
      border-color: #334155;
    }

    .note-card:hover {
      border-color: #94a3b8;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      transform: translateY(-1px);
    }

    .dark .note-card:hover {
      border-color: #475569;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .note-card:focus-visible {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    }

    .note-card.pinned {
      border-left: 3px solid #f59e0b;
    }

    .note-card.archived {
      opacity: 0.65;
    }

    .note-card.selected {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .dark .note-card.selected {
      border-color: #3b82f6;
      background: #1e3a5f;
    }

    .note-card-skeleton {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 1.25rem;
    }

    .dark .note-card-skeleton {
      background: #1e293b;
      border-color: #334155;
    }

    .note-card-inner {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }

    .note-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
    }

    .note-card-left {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      flex: 1;
      min-width: 0;
    }

    .category-icon-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 8px;
      flex-shrink: 0;
    }

    .category-icon-badge i {
      font-size: 0.875rem;
    }

    .note-card-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 0;
    }

    .note-card-title-row {
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .note-card-title {
      font-weight: 600;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 480px;
    }

    .dark .note-card-title {
      color: #f1f5f9;
    }

    .pin-indicator {
      color: #f59e0b;
      font-size: 0.75rem;
      flex-shrink: 0;
    }

    .archive-indicator {
      color: #94a3b8;
      font-size: 0.75rem;
      flex-shrink: 0;
    }

    .note-card-author {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.8125rem;
      color: #64748b;
    }

    .dark .note-card-author {
      color: #94a3b8;
    }

    .note-card-author i {
      font-size: 0.75rem;
    }

    .separator {
      opacity: 0.5;
    }

    .note-date {
      color: #94a3b8;
    }

    .note-card-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    .version-chip {
      display: inline-flex;
      align-items: center;
      font-size: 0.6875rem;
      font-weight: 600;
      background: #e2e8f0;
      color: #475569;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      cursor: default;
    }

    .dark .version-chip {
      background: #334155;
      color: #94a3b8;
    }

    .visibility-chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.75rem;
      height: 1.75rem;
      border-radius: 50%;
      font-size: 0.75rem;
      cursor: default;
    }

    .visibility-chip.vis-all-staff { background: #dbeafe; color: #1e40af; }
    .visibility-chip.vis-clinical-only { background: #d1fae5; color: #065f46; }
    .visibility-chip.vis-admin-only { background: #fef3c7; color: #92400e; }
    .visibility-chip.vis-author-only { background: #fee2e2; color: #991b1b; }

    .dark .visibility-chip.vis-all-staff { background: #1e3a5f; color: #93c5fd; }
    .dark .visibility-chip.vis-clinical-only { background: #064e3b; color: #6ee7b7; }
    .dark .visibility-chip.vis-admin-only { background: #78350f; color: #fde68a; }
    .dark .visibility-chip.vis-author-only { background: #7f1d1d; color: #fca5a5; }

    .note-card-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
    }

    .tag-chip {
      font-size: 0.6875rem;
      font-weight: 500;
      background: #f1f5f9;
      color: #475569;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
    }

    .dark .tag-chip {
      background: #334155;
      color: #94a3b8;
    }

    .tag-more {
      background: #e2e8f0;
      color: #64748b;
    }

    .dark .tag-more {
      background: #475569;
      color: #94a3b8;
    }

    /* ================================================================
       Note Detail Panel
    ================================================================ */
    .note-detail-panel {
      margin: 0 1.5rem 1.5rem;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
      padding: 1.5rem;
    }

    .dark .note-detail-panel {
      background: #1e293b;
      border-color: #334155;
    }

    .detail-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }

    .detail-header-left {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .detail-header-right {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .category-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.8125rem;
      font-weight: 600;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
    }

    .visibility-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: #64748b;
      background: #f1f5f9;
      padding: 0.25rem 0.625rem;
      border-radius: 9999px;
    }

    .dark .visibility-badge {
      color: #94a3b8;
      background: #334155;
    }

    .version-badge {
      display: inline-flex;
      align-items: center;
      font-size: 0.75rem;
      font-weight: 600;
      color: #475569;
      background: #e2e8f0;
      padding: 0.25rem 0.625rem;
      border-radius: 9999px;
      cursor: default;
    }

    .dark .version-badge {
      color: #94a3b8;
      background: #334155;
    }

    .detail-title {
      font-size: 1.375rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 0.75rem;
      line-height: 1.3;
    }

    .dark .detail-title {
      color: #f1f5f9;
    }

    .detail-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 0.75rem;
      font-size: 0.875rem;
      color: #64748b;
    }

    .dark .detail-meta {
      color: #94a3b8;
    }

    .meta-author,
    .meta-dates,
    .meta-reads {
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .meta-role {
      color: #94a3b8;
    }

    .meta-dates {
      gap: 0.75rem;
    }

    .meta-dates > span {
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .detail-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
    }

    :host ::ng-deep .note-tag {
      font-size: 0.75rem;
      background: #f1f5f9;
      color: #475569;
    }

    .dark :host ::ng-deep .note-tag {
      background: #334155;
      color: #94a3b8;
    }

    /* ================================================================
       Markdown Content
    ================================================================ */
    .markdown-content {
      color: #374151;
      font-size: 0.9375rem;
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
    }

    .dark :host ::ng-deep .markdown-content h1,
    .dark :host ::ng-deep .markdown-content h2,
    .dark :host ::ng-deep .markdown-content h3 {
      color: #f1f5f9;
    }

    :host ::ng-deep .markdown-content p { margin: 0.5rem 0; }

    :host ::ng-deep .markdown-content ul,
    :host ::ng-deep .markdown-content ol {
      padding-left: 1.5rem;
      margin: 0.5rem 0;
    }

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
      font-size: 0.875rem;
    }

    :host ::ng-deep .markdown-content th,
    :host ::ng-deep .markdown-content td {
      border: 1px solid #e2e8f0;
      padding: 0.5rem 0.75rem;
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
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.875em;
    }

    .dark :host ::ng-deep .markdown-content code {
      background: #334155;
      color: #e2e8f0;
    }

    :host ::ng-deep .markdown-content pre {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 1rem;
      overflow-x: auto;
    }

    .dark :host ::ng-deep .markdown-content pre {
      background: #334155;
      border-color: #475569;
    }

    :host ::ng-deep .markdown-content strong { font-weight: 700; }

    /* ================================================================
       Version History
    ================================================================ */
    .version-history {
      margin-top: 0.5rem;
    }

    .version-toggle {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 600;
      color: #3b82f6;
      padding: 0.5rem 0;
      width: 100%;
      text-align: left;
    }

    .version-toggle:hover { color: #2563eb; }
    .dark .version-toggle { color: #60a5fa; }
    .dark .version-toggle:hover { color: #93c5fd; }

    .toggle-chevron {
      margin-left: auto;
      font-size: 0.75rem;
    }

    .version-timeline {
      display: flex;
      flex-direction: column;
      gap: 0;
      margin-top: 0.75rem;
      padding-left: 0.75rem;
      border-left: 2px solid #e2e8f0;
    }

    .dark .version-timeline {
      border-left-color: #334155;
    }

    .version-item {
      display: flex;
      gap: 1rem;
      padding: 0.625rem 0;
      position: relative;
    }

    .version-dot {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.75rem;
      height: 1.75rem;
      border-radius: 50%;
      background: #e2e8f0;
      color: #64748b;
      font-size: 0.6875rem;
      font-weight: 700;
      flex-shrink: 0;
      margin-left: -0.875rem;
      border: 2px solid white;
      position: relative;
    }

    .dark .version-dot {
      background: #334155;
      color: #94a3b8;
      border-color: #1e293b;
    }

    .version-dot.current {
      background: #3b82f6;
      color: white;
      border-color: white;
    }

    .dark .version-dot.current {
      border-color: #1e293b;
    }

    .version-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .version-header {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .version-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1e293b;
    }

    .dark .version-title {
      color: #f1f5f9;
    }

    .version-meta {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .version-description {
      display: flex;
      align-items: flex-start;
      gap: 0.375rem;
      font-size: 0.8125rem;
      color: #64748b;
      margin: 0.125rem 0 0;
    }

    .dark .version-description {
      color: #94a3b8;
    }

    .version-description i {
      margin-top: 2px;
      flex-shrink: 0;
    }

    /* ================================================================
       Empty State
    ================================================================ */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1.5rem;
      text-align: center;
      gap: 1rem;
    }

    .empty-icon {
      width: 4rem;
      height: 4rem;
      border-radius: 50%;
      background: #fee2e2;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .dark .empty-icon {
      background: #7f1d1d;
    }

    .empty-icon i {
      font-size: 1.5rem;
      color: #dc2626;
    }

    .dark .empty-icon i {
      color: #fca5a5;
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
      max-width: 400px;
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

    .link-btn:hover { color: #2563eb; }

    /* ================================================================
       Dialog Styles
    ================================================================ */
    .dialog-staff-notice {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 0.5rem;
      padding: 0.625rem 1rem;
      font-size: 0.875rem;
      color: #991b1b;
      margin-bottom: 1.25rem;
    }

    .dark .dialog-staff-notice {
      background: #450a0a;
      border-color: #7f1d1d;
      color: #fca5a5;
    }

    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    @media (max-width: 600px) {
      .form-row {
        grid-template-columns: 1fr;
      }
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

    .field-hint {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .draft-tags-preview {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
      margin-top: 0.25rem;
    }

    .content-field-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .preview-toggle {
      display: flex;
      background: #f1f5f9;
      border-radius: 0.5rem;
      padding: 0.125rem;
      gap: 0.125rem;
    }

    .dark .preview-toggle {
      background: #334155;
    }

    .preview-btn {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #64748b;
      padding: 0.25rem 0.75rem;
      border-radius: 0.375rem;
      transition: all 0.15s;
    }

    .preview-btn.active {
      background: white;
      color: #1e293b;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .dark .preview-btn.active {
      background: #1e293b;
      color: #f1f5f9;
    }

    .content-textarea {
      width: 100%;
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-size: 0.875rem;
      line-height: 1.6;
      resize: vertical;
    }

    .content-preview {
      min-height: 14rem;
      padding: 0.75rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      overflow-y: auto;
    }

    .dark .content-preview {
      background: #334155;
      border-color: #475569;
    }

    .preview-placeholder {
      color: #94a3b8;
      font-style: italic;
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    :host ::ng-deep .internal-note-dialog .p-dialog-header {
      border-bottom: 1px solid #e2e8f0;
    }

    .dark :host ::ng-deep .internal-note-dialog .p-dialog-header {
      background: #1e293b;
      border-bottom-color: #334155;
      color: #f1f5f9;
    }

    .dark :host ::ng-deep .internal-note-dialog .p-dialog-content {
      background: #1e293b;
    }

    .dark :host ::ng-deep .internal-note-dialog .p-dialog-footer {
      background: #1e293b;
      border-top-color: #334155;
    }

    /* ================================================================
       Responsive
    ================================================================ */
    @media (max-width: 768px) {
      .banner-subtitle { display: none; }
      .banner-right { display: none; }
      .filter-controls { flex-direction: column; align-items: stretch; }
      .search-input { min-width: unset; width: 100%; }
      .note-card-title { max-width: 200px; }
    }
  `,
  ],
})
export class InternalNotesComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly notesService = inject(InternalNotesService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  readonly themeService = inject(ThemeService);

  private readonly destroy$ = new Subject<void>();

  // ---- Exposed model maps ----
  readonly NOTE_CATEGORY_LABELS = NOTE_CATEGORY_LABELS;
  readonly NOTE_CATEGORY_ICONS = NOTE_CATEGORY_ICONS;
  readonly NOTE_CATEGORY_COLORS = NOTE_CATEGORY_COLORS;
  readonly NOTE_VISIBILITY_LABELS = NOTE_VISIBILITY_LABELS;
  readonly NOTE_VISIBILITY_ICONS = NOTE_VISIBILITY_ICONS;

  // ---- State signals ----
  patientId = signal<string>('');
  notes = signal<InternalNote[]>([]);
  loading = signal(true);
  saving = signal(false);

  selectedNote = signal<InternalNote | null>(null);
  showEditor = signal(false);
  editingNote = signal<InternalNote | null>(null);
  showVersionHistory = signal(false);

  // Filters
  searchTerm = signal('');
  categoryFilter = signal<NoteCategory | 'all'>('all');
  visibilityFilter = signal<NoteVisibility | 'all'>('all');
  showArchived = signal(false);

  // Draft form state (plain properties, not signals, for ngModel compatibility)
  draftTitle = '';
  draftCategory: NoteCategory = 'clinical';
  draftVisibility: NoteVisibility = 'all-staff';
  draftTagsInput = '';
  draftContent = '';
  draftChangeDescription = '';
  showPreview = false;

  // ---- Computed ----
  filteredNotes = computed(() => {
    let result = this.notes();

    if (!this.showArchived()) {
      result = result.filter((n) => !n.isArchived);
    }

    const category = this.categoryFilter();
    if (category !== 'all') {
      result = result.filter((n) => n.category === category);
    }

    const visibility = this.visibilityFilter();
    if (visibility !== 'all') {
      result = result.filter((n) => n.visibility === visibility);
    }

    const term = this.searchTerm().toLowerCase().trim();
    if (term) {
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(term) ||
          n.content.toLowerCase().includes(term) ||
          n.authorName.toLowerCase().includes(term) ||
          n.tags.some((t) => t.toLowerCase().includes(term))
      );
    }

    // Pinned first, then by updatedAt descending
    return [...result].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  });

  pinnedNotes = computed(() => this.filteredNotes().filter((n) => n.isPinned));
  unpinnedNotes = computed(() =>
    this.filteredNotes().filter((n) => !n.isPinned)
  );

  hasActiveFilters = computed(
    () =>
      this.searchTerm() !== '' ||
      this.categoryFilter() !== 'all' ||
      this.visibilityFilter() !== 'all'
  );

  get parsedDraftTags(): string[] {
    return this.draftTagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }

  // ---- Select options ----
  categoryOptions: SelectOption[] = [
    { label: 'All Categories', value: 'all' },
    ...Object.entries(NOTE_CATEGORY_LABELS).map(([value, label]) => ({
      label,
      value,
    })),
  ];

  visibilityOptions: SelectOption[] = [
    { label: 'All Visibility', value: 'all' },
    ...Object.entries(NOTE_VISIBILITY_LABELS).map(([value, label]) => ({
      label,
      value,
    })),
  ];

  categoryOptionsForForm: SelectOption[] = Object.entries(
    NOTE_CATEGORY_LABELS
  ).map(([value, label]) => ({ label, value }));

  visibilityOptionsForForm: SelectOption[] = Object.entries(
    NOTE_VISIBILITY_LABELS
  ).map(([value, label]) => ({ label, value }));

  // ---- Lifecycle ----
  ngOnInit(): void {
    this.route.parent?.params
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const id = params['patientId'] ?? '';
        this.patientId.set(id);
        this.loadNotes(id);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ---- Data ----
  private loadNotes(patientId: string): void {
    this.loading.set(true);
    this.notesService
      .getPatientNotes(patientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notes) => {
          this.notes.set(notes);
          this.loading.set(false);
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load internal notes.',
          });
          this.loading.set(false);
        },
      });
  }

  // ---- Interactions ----
  selectNote(note: InternalNote): void {
    if (this.selectedNote()?.id === note.id) {
      this.selectedNote.set(null);
    } else {
      this.selectedNote.set(note);
      this.showVersionHistory.set(false);
    }
  }

  openCreateDialog(): void {
    this.editingNote.set(null);
    this.resetDraft();
    this.showEditor.set(true);
  }

  openEditDialog(note: InternalNote): void {
    this.editingNote.set(note);
    this.draftTitle = note.title;
    this.draftCategory = note.category;
    this.draftVisibility = note.visibility;
    this.draftTagsInput = note.tags.join(', ');
    this.draftContent = note.content;
    this.draftChangeDescription = '';
    this.showPreview = false;
    this.showEditor.set(true);
  }

  handleDialogClose(visible: boolean): void {
    if (!visible) {
      this.showEditor.set(false);
      this.editingNote.set(null);
      this.resetDraft();
    }
  }

  isFormValid(): boolean {
    return (
      this.draftTitle.trim().length > 0 && this.draftContent.trim().length > 0
    );
  }

  saveNote(): void {
    if (!this.isFormValid()) return;

    const editing = this.editingNote();
    this.saving.set(true);

    if (editing) {
      const dto: UpdateInternalNoteDto = {
        title: this.draftTitle.trim(),
        content: this.draftContent.trim(),
        category: this.draftCategory,
        visibility: this.draftVisibility,
        tags: this.parsedDraftTags,
        changeDescription: this.draftChangeDescription.trim() || undefined,
      };

      this.notesService
        .updateNote(editing.id, dto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updated) => {
            this.notes.update((list) =>
              list.map((n) => (n.id === updated.id ? updated : n))
            );
            this.selectedNote.set(updated);
            this.saving.set(false);
            this.showEditor.set(false);
            this.messageService.add({
              severity: 'success',
              summary: 'Saved',
              detail: 'Internal note updated successfully.',
            });
          },
          error: () => {
            this.saving.set(false);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to update note.',
            });
          },
        });
    } else {
      const dto: CreateInternalNoteDto = {
        patientId: this.patientId(),
        title: this.draftTitle.trim(),
        content: this.draftContent.trim(),
        category: this.draftCategory,
        visibility: this.draftVisibility,
        tags: this.parsedDraftTags,
      };

      this.notesService
        .createNote(dto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (created) => {
            this.notes.update((list) => [created, ...list]);
            this.selectedNote.set(created);
            this.saving.set(false);
            this.showEditor.set(false);
            this.messageService.add({
              severity: 'success',
              summary: 'Created',
              detail: 'Internal note created successfully.',
            });
          },
          error: () => {
            this.saving.set(false);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to create note.',
            });
          },
        });
    }
  }

  handleTogglePin(note: InternalNote): void {
    this.notesService
      .togglePin(note.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.notes.update((list) =>
            list.map((n) => (n.id === updated.id ? updated : n))
          );
          this.selectedNote.set(updated);
          this.messageService.add({
            severity: 'info',
            summary: updated.isPinned ? 'Pinned' : 'Unpinned',
            detail: `Note ${updated.isPinned ? 'pinned' : 'unpinned'} successfully.`,
          });
        },
      });
  }

  handleToggleArchive(note: InternalNote): void {
    this.notesService
      .toggleArchive(note.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.notes.update((list) =>
            list.map((n) => (n.id === updated.id ? updated : n))
          );
          this.selectedNote.set(updated);
          this.messageService.add({
            severity: 'info',
            summary: updated.isArchived ? 'Archived' : 'Restored',
            detail: `Note ${updated.isArchived ? 'archived' : 'restored'} successfully.`,
          });
        },
      });
  }

  confirmDelete(note: InternalNote): void {
    this.confirmationService.confirm({
      header: 'Delete Internal Note',
      message: `Are you sure you want to permanently delete "${note.title}"? This action cannot be undone.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.notesService
          .deleteNote(note.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.notes.update((list) => list.filter((n) => n.id !== note.id));
              this.selectedNote.set(null);
              this.messageService.add({
                severity: 'success',
                summary: 'Deleted',
                detail: 'Internal note deleted.',
              });
            },
            error: () => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to delete note.',
              });
            },
          });
      },
    });
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.categoryFilter.set('all');
    this.visibilityFilter.set('all');
  }

  // ---- Template helpers ----
  getCategoryLabel(cat: NoteCategory): string {
    return NOTE_CATEGORY_LABELS[cat];
  }

  getCategoryIcon(cat: NoteCategory): string {
    return NOTE_CATEGORY_ICONS[cat];
  }

  getCategoryBg(cat: NoteCategory): string {
    return this.themeService.isDarkMode()
      ? NOTE_CATEGORY_COLORS[cat].darkBg
      : NOTE_CATEGORY_COLORS[cat].bg;
  }

  getCategoryText(cat: NoteCategory): string {
    return this.themeService.isDarkMode()
      ? NOTE_CATEGORY_COLORS[cat].darkText
      : NOTE_CATEGORY_COLORS[cat].text;
  }

  getVisibilityLabel(vis: NoteVisibility): string {
    return NOTE_VISIBILITY_LABELS[vis];
  }

  getVisibilityIcon(vis: NoteVisibility): string {
    return NOTE_VISIBILITY_ICONS[vis];
  }

  getVersionsReversed(note: InternalNote) {
    return [...note.versions].reverse();
  }

  private resetDraft(): void {
    this.draftTitle = '';
    this.draftCategory = 'clinical';
    this.draftVisibility = 'all-staff';
    this.draftTagsInput = '';
    this.draftContent = '';
    this.draftChangeDescription = '';
    this.showPreview = false;
  }
}
