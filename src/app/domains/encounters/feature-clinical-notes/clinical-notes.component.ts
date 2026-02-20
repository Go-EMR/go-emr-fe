import { Component, inject, signal, computed, OnInit, OnDestroy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TabViewModule } from 'primeng/tabview';
import { PanelModule } from 'primeng/panel';
import { ChipModule } from 'primeng/chip';
import { BadgeModule } from 'primeng/badge';
import { TimelineModule } from 'primeng/timeline';
import { AccordionModule } from 'primeng/accordion';
import { CheckboxModule } from 'primeng/checkbox';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { RippleModule } from 'primeng/ripple';
import { SplitButtonModule } from 'primeng/splitbutton';
import { MessageService, ConfirmationService, MenuItem } from 'primeng/api';

import { ThemeService } from '../../../core/services/theme.service';
import { MarkdownPipe } from '../../../shared/pipes/markdown.pipe';

export type ClinicalRole =
  | 'attending' | 'resident' | 'fellow' | 'intern'
  | 'nurse' | 'nurse-practitioner' | 'physician-assistant'
  | 'respiratory-therapist' | 'physical-therapist' | 'occupational-therapist'
  | 'pharmacist' | 'social-worker' | 'dietitian' | 'psychologist'
  | 'case-manager';

export const ROLE_COLORS: Record<ClinicalRole, { bg: string; text: string; border: string; darkBg: string; darkText: string; darkBorder: string }> = {
  'attending':              { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6', darkBg: '#1e3a5f', darkText: '#93c5fd', darkBorder: '#3b82f6' },
  'resident':               { bg: '#e0e7ff', text: '#3730a3', border: '#6366f1', darkBg: '#312e81', darkText: '#a5b4fc', darkBorder: '#6366f1' },
  'fellow':                 { bg: '#ede9fe', text: '#5b21b6', border: '#8b5cf6', darkBg: '#3b0764', darkText: '#c4b5fd', darkBorder: '#8b5cf6' },
  'intern':                 { bg: '#f0f9ff', text: '#075985', border: '#0ea5e9', darkBg: '#0c4a6e', darkText: '#7dd3fc', darkBorder: '#0ea5e9' },
  'nurse':                  { bg: '#fce7f3', text: '#9d174d', border: '#ec4899', darkBg: '#831843', darkText: '#f9a8d4', darkBorder: '#ec4899' },
  'nurse-practitioner':     { bg: '#fdf2f8', text: '#831843', border: '#f472b6', darkBg: '#701a3e', darkText: '#fbcfe8', darkBorder: '#f472b6' },
  'physician-assistant':    { bg: '#fff7ed', text: '#9a3412', border: '#f97316', darkBg: '#7c2d12', darkText: '#fdba74', darkBorder: '#f97316' },
  'respiratory-therapist':  { bg: '#ecfdf5', text: '#065f46', border: '#10b981', darkBg: '#064e3b', darkText: '#6ee7b7', darkBorder: '#10b981' },
  'physical-therapist':     { bg: '#f0fdf4', text: '#166534', border: '#22c55e', darkBg: '#14532d', darkText: '#86efac', darkBorder: '#22c55e' },
  'occupational-therapist': { bg: '#fefce8', text: '#854d0e', border: '#eab308', darkBg: '#713f12', darkText: '#fde047', darkBorder: '#eab308' },
  'pharmacist':             { bg: '#fff1f2', text: '#9f1239', border: '#f43f5e', darkBg: '#881337', darkText: '#fda4af', darkBorder: '#f43f5e' },
  'social-worker':          { bg: '#f5f3ff', text: '#6b21a8', border: '#a855f7', darkBg: '#581c87', darkText: '#d8b4fe', darkBorder: '#a855f7' },
  'dietitian':              { bg: '#fefce8', text: '#a16207', border: '#facc15', darkBg: '#854d0e', darkText: '#fef08a', darkBorder: '#facc15' },
  'psychologist':           { bg: '#fdf4ff', text: '#86198f', border: '#d946ef', darkBg: '#701a75', darkText: '#f0abfc', darkBorder: '#d946ef' },
  'case-manager':           { bg: '#f1f5f9', text: '#334155', border: '#64748b', darkBg: '#1e293b', darkText: '#94a3b8', darkBorder: '#64748b' },
};

export const ROLE_LABELS: Record<ClinicalRole, string> = {
  'attending':              'Attending Physician',
  'resident':               'Resident',
  'fellow':                 'Fellow',
  'intern':                 'Intern',
  'nurse':                  'Nurse',
  'nurse-practitioner':     'Nurse Practitioner',
  'physician-assistant':    'Physician Assistant',
  'respiratory-therapist':  'Respiratory Therapist',
  'physical-therapist':     'Physical Therapist',
  'occupational-therapist': 'Occupational Therapist',
  'pharmacist':             'Pharmacist',
  'social-worker':          'Social Worker',
  'dietitian':              'Dietitian',
  'psychologist':           'Psychologist',
  'case-manager':           'Case Manager',
};

interface ClinicalNote {
  id: string;
  patientId: string;
  encounterId: string;
  noteType: NoteType;
  title: string;
  status: NoteStatus;
  author: string;
  authorId: string;
  authorRole?: ClinicalRole;
  authorSpecialty?: string;
  createdAt: Date;
  updatedAt: Date;
  signedAt?: Date;
  signedBy?: string;
  cosignRequired?: boolean;
  cosignedAt?: Date;
  cosignedBy?: string;
  content: SOAPContent;
  amendments?: NoteAmendment[];
  templates?: string[];
}

type NoteType = 'progress' | 'soap' | 'h_and_p' | 'consultation' | 'procedure' | 'discharge' | 'admission';
type NoteStatus = 'draft' | 'in-progress' | 'pending-signature' | 'signed' | 'amended' | 'cosign-required';

interface SOAPContent {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  chiefComplaint?: string;
  hpi?: string; // History of Present Illness
  ros?: ReviewOfSystems; // Review of Systems
  physicalExam?: PhysicalExam;
  vitalSigns?: VitalSigns;
  diagnoses?: Diagnosis[];
  orders?: string[];
  followUp?: string;
}

interface ReviewOfSystems {
  constitutional: string;
  eyes: string;
  entMouthThroat: string;
  cardiovascular: string;
  respiratory: string;
  gastrointestinal: string;
  genitourinary: string;
  musculoskeletal: string;
  skin: string;
  neurological: string;
  psychiatric: string;
  endocrine: string;
  hematologicLymphatic: string;
  allergicImmunologic: string;
}

interface PhysicalExam {
  general: string;
  heent: string;
  neck: string;
  cardiovascular: string;
  respiratory: string;
  abdomen: string;
  extremities: string;
  neurological: string;
  skin: string;
  psychiatric: string;
}

interface VitalSigns {
  bloodPressure: string;
  heartRate: string;
  temperature: string;
  respiratoryRate: string;
  oxygenSaturation: string;
  height: string;
  weight: string;
  bmi: string;
  painScale: string;
}

interface Diagnosis {
  code: string;
  description: string;
  type: 'primary' | 'secondary';
}

interface NoteAmendment {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
  reason: string;
}

interface NoteTemplate {
  id: string;
  name: string;
  type: NoteType;
  category: string;
  content: Partial<SOAPContent>;
  description?: string;
}

@Component({
  selector: 'app-clinical-notes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    DialogModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
    TagModule,
    AvatarModule,
    TooltipModule,
    DividerModule,
    ToastModule,
    ConfirmDialogModule,
    TabViewModule,
    PanelModule,
    ChipModule,
    BadgeModule,
    TimelineModule,
    AccordionModule,
    CheckboxModule,
    AutoCompleteModule,
    RippleModule,
    SplitButtonModule,
    MarkdownPipe,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast />
    <p-confirmDialog />

    <div class="clinical-notes" [class.dark]="themeService.isDarkMode()">
      <!-- Header -->
      <header class="notes-header">
        <div class="header-left">
          <h1>
            <i class="pi pi-file-edit"></i>
            Clinical Notes
          </h1>
          <p class="subtitle">Document patient encounters and clinical findings</p>
        </div>
        <div class="header-actions">
          <p-splitButton 
            label="New Note" 
            icon="pi pi-plus"
            [model]="newNoteOptions"
            (onClick)="openNewNoteDialog('soap')"
          />
        </div>
      </header>

      <!-- Notes List -->
      <section class="notes-section">
        <div class="notes-grid">
          <!-- Left: Notes List -->
          <div class="notes-list-panel">
            <p-card styleClass="list-card">
              <ng-template pTemplate="header">
                <div class="panel-header">
                  <h3>Recent Notes</h3>
                  <div class="panel-filters">
                    <p-select
                      [options]="noteTypeFilters"
                      [(ngModel)]="selectedTypeFilter"
                      placeholder="All Types"
                      [showClear]="true"
                      styleClass="type-filter"
                    />
                    <p-select
                      [options]="roleFilterOptions"
                      [(ngModel)]="selectedRoleFilter"
                      placeholder="All Roles"
                      [showClear]="true"
                      styleClass="role-filter"
                      (onChange)="onRoleFilterChange($event)"
                      (onClear)="onRoleFilterClear()"
                    />
                  </div>
                </div>
              </ng-template>

              <div class="notes-list">
                @for (note of filteredNotes(); track note.id) {
                  <div
                    class="note-item"
                    [class.selected]="selectedNote()?.id === note.id"
                    [class.draft]="note.status === 'draft'"
                    (click)="selectNote(note)"
                    pRipple
                  >
                    <div
                      class="note-icon"
                      [class]="note.noteType"
                      [style.background]="note.authorRole ? getRoleColor(note.authorRole, 'bg') : null"
                      [style.color]="note.authorRole ? getRoleColor(note.authorRole, 'text') : null"
                    >
                      <i [class]="getNoteTypeIcon(note.noteType)"></i>
                    </div>
                    <div class="note-info">
                      <span class="note-title">{{ note.title }}</span>
                      <span class="note-meta">
                        {{ note.author }}
                        @if (note.authorSpecialty) {
                          <span class="author-specialty"> &bull; {{ note.authorSpecialty }}</span>
                        }
                        &bull; {{ note.createdAt | date:'short' }}
                      </span>
                      @if (note.authorRole) {
                        <span
                          class="role-badge"
                          [style.background]="getRoleColor(note.authorRole, 'bg')"
                          [style.color]="getRoleColor(note.authorRole, 'text')"
                          [style.border-color]="getRoleColor(note.authorRole, 'border')"
                        >{{ getRoleLabel(note.authorRole) }}</span>
                      }
                    </div>
                    <div class="note-status">
                      <p-tag
                        [value]="getStatusLabel(note.status)"
                        [severity]="getStatusSeverity(note.status)"
                        [rounded]="true"
                      />
                    </div>
                  </div>
                } @empty {
                  <div class="empty-list">
                    <i class="pi pi-file"></i>
                    <p>No notes found</p>
                  </div>
                }
              </div>
            </p-card>
          </div>

          <!-- Right: Note Detail / Editor -->
          <div class="note-detail-panel">
            @if (editMode()) {
              <!-- Note Editor -->
              <p-card styleClass="editor-card">
                <ng-template pTemplate="header">
                  <div class="editor-header">
                    <div class="editor-title">
                      <p-select
                        [options]="noteTypes"
                        [(ngModel)]="currentNoteType"
                        optionLabel="label"
                        optionValue="value"
                        styleClass="type-select"
                      />
                      <input 
                        pInputText 
                        [(ngModel)]="currentNoteTitle"
                        placeholder="Note title..."
                        class="title-input"
                      />
                    </div>
                    <div class="editor-actions">
                      <p-button
                        label="Templates"
                        icon="pi pi-file-edit"
                        [outlined]="true"
                        severity="secondary"
                        (onClick)="showTemplatesDialog.set(true)"
                      />
                      <p-button
                        [label]="showPreview() ? 'Edit' : 'Preview'"
                        [icon]="showPreview() ? 'pi pi-pencil' : 'pi pi-eye'"
                        [outlined]="true"
                        severity="help"
                        (onClick)="togglePreview()"
                      />
                      <p-button
                        label="Save Draft"
                        icon="pi pi-save"
                        [outlined]="true"
                        (onClick)="saveDraft()"
                        [loading]="saving()"
                      />
                      <p-button 
                        label="Sign Note"
                        icon="pi pi-check"
                        (onClick)="signNote()"
                        [loading]="signing()"
                      />
                      <p-button 
                        icon="pi pi-times"
                        [rounded]="true"
                        [text]="true"
                        severity="secondary"
                        (onClick)="cancelEdit()"
                      />
                    </div>
                  </div>
                </ng-template>

                <!-- Markdown Hint Bar -->
                <div class="markdown-hint-bar" (click)="toggleMarkdownHelp()">
                  <i class="pi pi-info-circle"></i>
                  <span>Markdown supported</span>
                  <i class="pi" [ngClass]="showMarkdownHelp() ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
                </div>
                @if (showMarkdownHelp()) {
                  <div class="markdown-cheatsheet">
                    <div class="cheatsheet-grid">
                      <code>**bold**</code>
                      <code>*italic*</code>
                      <code># Heading</code>
                      <code>- item</code>
                      <code>1. item</code>
                      <code>| A | B |</code>
                      <code>\`code\`</code>
                      <code>---</code>
                    </div>
                  </div>
                }

                <p-tabView styleClass="soap-tabs">
                  <!-- SOAP Tab -->
                  <p-tabPanel header="SOAP Note">
                    <div class="soap-editor">
                      <!-- Chief Complaint -->
                      <div class="soap-section">
                        <div class="section-header">
                          <label>Chief Complaint</label>
                          <p-button 
                            icon="pi pi-bolt"
                            [rounded]="true"
                            [text]="true"
                            size="small"
                            pTooltip="Insert from template"
                            (onClick)="insertFromSmartPhrase('chiefComplaint')"
                          />
                        </div>
                        <div class="textarea-with-preview">
                          <textarea
                            pInputTextarea
                            [(ngModel)]="noteContent.chiefComplaint"
                            rows="2"
                            placeholder="Patient presents with..."
                            class="soap-textarea"
                          ></textarea>
                          @if (showPreview() && noteContent.chiefComplaint) {
                            <div class="preview-pane markdown-body" [innerHTML]="noteContent.chiefComplaint | markdown"></div>
                          }
                        </div>
                      </div>

                      <!-- Subjective -->
                      <div class="soap-section subjective">
                        <div class="section-header">
                          <label>
                            <span class="section-letter">S</span>
                            Subjective
                          </label>
                          <p-button 
                            icon="pi pi-bolt"
                            [rounded]="true"
                            [text]="true"
                            size="small"
                            pTooltip="Smart phrases"
                          />
                        </div>
                        <div class="textarea-with-preview">
                          <textarea
                            pInputTextarea
                            [(ngModel)]="noteContent.subjective"
                            rows="6"
                            placeholder="History of present illness, patient's description of symptoms, relevant history..."
                            class="soap-textarea"
                          ></textarea>
                          @if (showPreview() && noteContent.subjective) {
                            <div class="preview-pane markdown-body" [innerHTML]="noteContent.subjective | markdown"></div>
                          }
                        </div>
                      </div>

                      <!-- Objective -->
                      <div class="soap-section objective">
                        <div class="section-header">
                          <label>
                            <span class="section-letter">O</span>
                            Objective
                          </label>
                          <p-button 
                            label="Vitals"
                            icon="pi pi-heart"
                            [outlined]="true"
                            size="small"
                            (onClick)="showVitalsDialog.set(true)"
                          />
                          <p-button 
                            label="Physical Exam"
                            icon="pi pi-user"
                            [outlined]="true"
                            size="small"
                            (onClick)="showPhysicalExamDialog.set(true)"
                          />
                        </div>
                        
                        <!-- Vitals Display -->
                        @if (noteContent.vitalSigns) {
                          <div class="vitals-summary">
                            <span class="vital-chip" *ngIf="noteContent.vitalSigns.bloodPressure">
                              BP: {{ noteContent.vitalSigns.bloodPressure }}
                            </span>
                            <span class="vital-chip" *ngIf="noteContent.vitalSigns.heartRate">
                              HR: {{ noteContent.vitalSigns.heartRate }}
                            </span>
                            <span class="vital-chip" *ngIf="noteContent.vitalSigns.temperature">
                              Temp: {{ noteContent.vitalSigns.temperature }}
                            </span>
                            <span class="vital-chip" *ngIf="noteContent.vitalSigns.respiratoryRate">
                              RR: {{ noteContent.vitalSigns.respiratoryRate }}
                            </span>
                            <span class="vital-chip" *ngIf="noteContent.vitalSigns.oxygenSaturation">
                              SpO2: {{ noteContent.vitalSigns.oxygenSaturation }}
                            </span>
                          </div>
                        }

                        <div class="textarea-with-preview">
                          <textarea
                            pInputTextarea
                            [(ngModel)]="noteContent.objective"
                            rows="6"
                            placeholder="Physical examination findings, vital signs, lab results, imaging..."
                            class="soap-textarea"
                          ></textarea>
                          @if (showPreview() && noteContent.objective) {
                            <div class="preview-pane markdown-body" [innerHTML]="noteContent.objective | markdown"></div>
                          }
                        </div>
                      </div>

                      <!-- Assessment -->
                      <div class="soap-section assessment">
                        <div class="section-header">
                          <label>
                            <span class="section-letter">A</span>
                            Assessment
                          </label>
                          <p-button 
                            label="Add Diagnosis"
                            icon="pi pi-plus"
                            [outlined]="true"
                            size="small"
                            (onClick)="showDiagnosisDialog.set(true)"
                          />
                        </div>
                        
                        <!-- Diagnoses Display -->
                        @if (noteContent.diagnoses && noteContent.diagnoses.length > 0) {
                          <div class="diagnoses-list">
                            @for (dx of noteContent.diagnoses; track dx.code) {
                              <div class="diagnosis-chip" [class.primary]="dx.type === 'primary'">
                                <span class="dx-code">{{ dx.code }}</span>
                                <span class="dx-desc">{{ dx.description }}</span>
                                <p-button 
                                  icon="pi pi-times"
                                  [rounded]="true"
                                  [text]="true"
                                  size="small"
                                  (onClick)="removeDiagnosis(dx)"
                                />
                              </div>
                            }
                          </div>
                        }

                        <div class="textarea-with-preview">
                          <textarea
                            pInputTextarea
                            [(ngModel)]="noteContent.assessment"
                            rows="4"
                            placeholder="Clinical impression, differential diagnosis, problem list..."
                            class="soap-textarea"
                          ></textarea>
                          @if (showPreview() && noteContent.assessment) {
                            <div class="preview-pane markdown-body" [innerHTML]="noteContent.assessment | markdown"></div>
                          }
                        </div>
                      </div>

                      <!-- Plan -->
                      <div class="soap-section plan">
                        <div class="section-header">
                          <label>
                            <span class="section-letter">P</span>
                            Plan
                          </label>
                          <p-button 
                            label="Add Order"
                            icon="pi pi-plus"
                            [outlined]="true"
                            size="small"
                          />
                        </div>
                        <div class="textarea-with-preview">
                          <textarea
                            pInputTextarea
                            [(ngModel)]="noteContent.plan"
                            rows="6"
                            placeholder="Treatment plan, medications, referrals, follow-up..."
                            class="soap-textarea"
                          ></textarea>
                          @if (showPreview() && noteContent.plan) {
                            <div class="preview-pane markdown-body" [innerHTML]="noteContent.plan | markdown"></div>
                          }
                        </div>
                      </div>

                      <!-- Follow-up -->
                      <div class="soap-section">
                        <div class="section-header">
                          <label>Follow-up</label>
                        </div>
                        <div class="textarea-with-preview">
                          <textarea
                            pInputTextarea
                            [(ngModel)]="noteContent.followUp"
                            rows="2"
                            placeholder="Return in 2 weeks, PRN visit if symptoms worsen..."
                            class="soap-textarea"
                          ></textarea>
                          @if (showPreview() && noteContent.followUp) {
                            <div class="preview-pane markdown-body" [innerHTML]="noteContent.followUp | markdown"></div>
                          }
                        </div>
                      </div>
                    </div>
                  </p-tabPanel>

                  <!-- Review of Systems Tab -->
                  <p-tabPanel header="ROS">
                    <div class="ros-editor">
                      <p class="ros-instructions">
                        Document pertinent positives and negatives for each system:
                      </p>
                      <div class="ros-grid">
                        @for (system of rosSystems; track system.key) {
                          <div class="ros-item">
                            <label>{{ system.label }}</label>
                            <textarea 
                              pInputTextarea 
                              [(ngModel)]="rosContent[system.key]"
                              rows="2"
                              [placeholder]="system.placeholder"
                            ></textarea>
                          </div>
                        }
                      </div>
                    </div>
                  </p-tabPanel>

                  <!-- Physical Exam Tab -->
                  <p-tabPanel header="Physical Exam">
                    <div class="pe-editor">
                      <div class="pe-grid">
                        @for (exam of physicalExamSections; track exam.key) {
                          <div class="pe-item">
                            <label>{{ exam.label }}</label>
                            <textarea 
                              pInputTextarea 
                              [(ngModel)]="peContent[exam.key]"
                              rows="2"
                              [placeholder]="exam.placeholder"
                            ></textarea>
                          </div>
                        }
                      </div>
                    </div>
                  </p-tabPanel>
                </p-tabView>
              </p-card>
            } @else if (selectedNote()) {
              <!-- Note View -->
              <p-card styleClass="view-card">
                <ng-template pTemplate="header">
                  <div class="view-header">
                    <div class="view-title">
                      <p-tag 
                        [value]="getNoteTypeLabel(selectedNote()!.noteType)"
                        [severity]="getNoteTypeSeverity(selectedNote()!.noteType)"
                      />
                      <h2>{{ selectedNote()!.title }}</h2>
                    </div>
                    <div class="view-actions">
                      @if (selectedNote()!.status === 'draft' || selectedNote()!.status === 'in-progress') {
                        <p-button 
                          label="Continue Editing"
                          icon="pi pi-pencil"
                          (onClick)="editNote(selectedNote()!)"
                        />
                      } @else {
                        <p-button 
                          label="Add Addendum"
                          icon="pi pi-plus"
                          [outlined]="true"
                          (onClick)="addAddendum()"
                        />
                      }
                      <p-button 
                        icon="pi pi-print"
                        [rounded]="true"
                        [outlined]="true"
                        pTooltip="Print"
                      />
                      <p-button 
                        icon="pi pi-download"
                        [rounded]="true"
                        [outlined]="true"
                        pTooltip="Export"
                      />
                    </div>
                  </div>
                </ng-template>

                <div class="note-metadata">
                  <div class="meta-item">
                    <i class="pi pi-user"></i>
                    <div class="meta-author-block">
                      <span class="meta-author-name">{{ selectedNote()!.author }}</span>
                      @if (selectedNote()!.authorSpecialty) {
                        <span class="meta-author-specialty">{{ selectedNote()!.authorSpecialty }}</span>
                      }
                      @if (selectedNote()!.authorRole) {
                        <span
                          class="role-badge role-badge--detail"
                          [style.background]="getRoleColor(selectedNote()!.authorRole!, 'bg')"
                          [style.color]="getRoleColor(selectedNote()!.authorRole!, 'text')"
                          [style.border-color]="getRoleColor(selectedNote()!.authorRole!, 'border')"
                        >{{ getRoleLabel(selectedNote()!.authorRole!) }}</span>
                      }
                    </div>
                  </div>
                  <div class="meta-item">
                    <i class="pi pi-calendar"></i>
                    <span>{{ selectedNote()!.createdAt | date:'medium' }}</span>
                  </div>
                  @if (selectedNote()!.signedAt) {
                    <div class="meta-item signed">
                      <i class="pi pi-check-circle"></i>
                      <span>Signed by {{ selectedNote()!.signedBy }} on {{ selectedNote()!.signedAt | date:'short' }}</span>
                    </div>
                  }
                </div>

                <p-divider />

                <div class="note-content-view">
                  @if (selectedNote()!.content.chiefComplaint) {
                    <div class="content-section">
                      <h4>Chief Complaint</h4>
                      <div class="markdown-body" [innerHTML]="selectedNote()!.content.chiefComplaint | markdown"></div>
                    </div>
                  }

                  <div class="soap-view">
                    <div class="soap-section-view subjective">
                      <div class="section-label">
                        <span class="letter">S</span>
                        <span>Subjective</span>
                      </div>
                      <div class="section-content markdown-body" [innerHTML]="(selectedNote()!.content.subjective || 'Not documented') | markdown">
                      </div>
                    </div>

                    <div class="soap-section-view objective">
                      <div class="section-label">
                        <span class="letter">O</span>
                        <span>Objective</span>
                      </div>
                      <div class="section-content markdown-body" [innerHTML]="(selectedNote()!.content.objective || 'Not documented') | markdown">
                      </div>
                    </div>

                    <div class="soap-section-view assessment">
                      <div class="section-label">
                        <span class="letter">A</span>
                        <span>Assessment</span>
                      </div>
                      <div class="section-content">
                        @if (selectedNote()!.content.diagnoses && selectedNote()!.content.diagnoses!.length > 0) {
                          <div class="diagnoses-view">
                            @for (dx of selectedNote()!.content.diagnoses; track dx.code; let i = $index) {
                              <div class="dx-item">
                                <span class="dx-num">{{ i + 1 }}.</span>
                                <span class="dx-text">{{ dx.description }} ({{ dx.code }})</span>
                                @if (dx.type === 'primary') {
                                  <p-tag value="Primary" severity="info" [rounded]="true" />
                                }
                              </div>
                            }
                          </div>
                        }
                        <div class="markdown-body" [innerHTML]="(selectedNote()!.content.assessment || 'Not documented') | markdown"></div>
                      </div>
                    </div>

                    <div class="soap-section-view plan">
                      <div class="section-label">
                        <span class="letter">P</span>
                        <span>Plan</span>
                      </div>
                      <div class="section-content markdown-body" [innerHTML]="(selectedNote()!.content.plan || 'Not documented') | markdown">
                      </div>
                    </div>
                  </div>

                  @if (selectedNote()!.content.followUp) {
                    <div class="content-section">
                      <h4>Follow-up</h4>
                      <div class="markdown-body" [innerHTML]="selectedNote()!.content.followUp | markdown"></div>
                    </div>
                  }
                </div>

                <!-- Amendments -->
                @if (selectedNote()!.amendments && selectedNote()!.amendments!.length > 0) {
                  <p-divider />
                  <div class="amendments-section">
                    <h4>Amendments</h4>
                    @for (amendment of selectedNote()!.amendments; track amendment.id) {
                      <div class="amendment-item">
                        <div class="amendment-header">
                          <span class="amendment-author">{{ amendment.author }}</span>
                          <span class="amendment-date">{{ amendment.createdAt | date:'short' }}</span>
                        </div>
                        <div class="amendment-reason">Reason: {{ amendment.reason }}</div>
                        <div class="amendment-content markdown-body" [innerHTML]="amendment.content | markdown"></div>
                      </div>
                    }
                  </div>
                }
              </p-card>
            } @else {
              <!-- Empty State -->
              <div class="empty-detail">
                <i class="pi pi-file-edit"></i>
                <h3>Select a note to view</h3>
                <p>Or create a new clinical note</p>
                <p-button 
                  label="New SOAP Note" 
                  icon="pi pi-plus"
                  (onClick)="openNewNoteDialog('soap')"
                />
              </div>
            }
          </div>
        </div>
      </section>

      <!-- Templates Dialog -->
      <p-dialog 
        header="Note Templates" 
        [(visible)]="showTemplatesDialog"
        [modal]="true"
        [style]="{ width: '600px' }"
      >
        <div class="templates-dialog">
          <div class="template-categories">
            @for (category of templateCategories; track category) {
              <p-button 
                [label]="category"
                [outlined]="selectedTemplateCategory !== category"
                (onClick)="selectedTemplateCategory = category"
                size="small"
              />
            }
          </div>

          <div class="templates-list">
            @for (template of filteredTemplates(); track template.id) {
              <div 
                class="template-item"
                (click)="applyTemplate(template)"
                pRipple
              >
                <div class="template-icon">
                  <i [class]="getNoteTypeIcon(template.type)"></i>
                </div>
                <div class="template-info">
                  <span class="template-name">{{ template.name }}</span>
                  <span class="template-desc">{{ template.description }}</span>
                </div>
                <p-button 
                  icon="pi pi-check"
                  [rounded]="true"
                  [text]="true"
                  (onClick)="applyTemplate(template); $event.stopPropagation()"
                />
              </div>
            }
          </div>
        </div>
      </p-dialog>

      <!-- Vitals Dialog -->
      <p-dialog 
        header="Vital Signs" 
        [(visible)]="showVitalsDialog"
        [modal]="true"
        [style]="{ width: '500px' }"
      >
        <div class="vitals-form">
          <div class="vital-row">
            <label>Blood Pressure</label>
            <input pInputText [(ngModel)]="vitalsForm.bloodPressure" placeholder="120/80 mmHg" />
          </div>
          <div class="vital-row">
            <label>Heart Rate</label>
            <input pInputText [(ngModel)]="vitalsForm.heartRate" placeholder="72 bpm" />
          </div>
          <div class="vital-row">
            <label>Temperature</label>
            <input pInputText [(ngModel)]="vitalsForm.temperature" placeholder="98.6 \u00b0F" />
          </div>
          <div class="vital-row">
            <label>Respiratory Rate</label>
            <input pInputText [(ngModel)]="vitalsForm.respiratoryRate" placeholder="16 /min" />
          </div>
          <div class="vital-row">
            <label>Oxygen Saturation</label>
            <input pInputText [(ngModel)]="vitalsForm.oxygenSaturation" placeholder="98%" />
          </div>
          <div class="vital-row">
            <label>Height</label>
            <input pInputText [(ngModel)]="vitalsForm.height" placeholder="Height (in)" />
          </div>
          <div class="vital-row">
            <label>Weight</label>
            <input pInputText [(ngModel)]="vitalsForm.weight" placeholder="165 lbs" />
          </div>
          <div class="vital-row">
            <label>Pain Scale (0-10)</label>
            <input pInputText [(ngModel)]="vitalsForm.painScale" placeholder="0" />
          </div>
        </div>

        <ng-template pTemplate="footer">
          <p-button label="Cancel" [text]="true" (onClick)="showVitalsDialog.set(false)" />
          <p-button label="Save Vitals" icon="pi pi-check" (onClick)="saveVitals()" />
        </ng-template>
      </p-dialog>

      <!-- Diagnosis Dialog -->
      <p-dialog 
        header="Add Diagnosis" 
        [(visible)]="showDiagnosisDialog"
        [modal]="true"
        [style]="{ width: '500px' }"
      >
        <div class="diagnosis-form">
          <div class="form-field">
            <label>Search ICD-10 Code</label>
            <p-autoComplete
              [(ngModel)]="diagnosisSearch"
              [suggestions]="diagnosisSuggestions()"
              (completeMethod)="searchDiagnosis($event)"
              (onSelect)="onDiagnosisSelect($event)"
              field="display"
              placeholder="Search by code or description..."
              styleClass="w-full"
            />
          </div>
          @if (selectedDiagnosis()) {
            <div class="selected-diagnosis">
              <p-chip [label]="selectedDiagnosis()!.code" />
              <span>{{ selectedDiagnosis()!.description }}</span>
            </div>
            <div class="form-field">
              <label>Type</label>
              <p-select
                [(ngModel)]="diagnosisType"
                [options]="[{label: 'Primary', value: 'primary'}, {label: 'Secondary', value: 'secondary'}]"
                placeholder="Select type"
                styleClass="w-full"
              />
            </div>
          }
        </div>

        <ng-template pTemplate="footer">
          <p-button label="Cancel" [text]="true" (onClick)="showDiagnosisDialog.set(false)" />
          <p-button 
            label="Add Diagnosis" 
            icon="pi pi-plus" 
            (onClick)="addDiagnosis()"
            [disabled]="!selectedDiagnosis()"
          />
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .clinical-notes {
      min-height: 100vh;
      background: #f8fafc;
    }

    /* Header */
    .notes-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      background: white;
      border-bottom: 1px solid #e5e7eb;
    }

    .notes-header h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .notes-header h1 i {
      color: #3b82f6;
    }

    .subtitle {
      margin: 0.25rem 0 0;
      color: #64748b;
      font-size: 0.875rem;
    }

    /* Notes Grid */
    .notes-section {
      padding: 1.5rem;
    }

    .notes-grid {
      display: grid;
      grid-template-columns: 350px 1fr;
      gap: 1.5rem;
      height: calc(100vh - 140px);
    }

    /* Notes List Panel */
    :host ::ng-deep .list-card {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .panel-header h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
    }

    :host ::ng-deep .type-filter {
      width: 140px;
    }

    .notes-list {
      flex: 1;
      overflow-y: auto;
    }

    .note-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      border-bottom: 1px solid #f1f5f9;
      cursor: pointer;
      transition: background 0.2s;
    }

    .note-item:hover {
      background: #f8fafc;
    }

    .note-item.selected {
      background: #eff6ff;
      border-left: 3px solid #3b82f6;
    }

    .note-item.draft {
      opacity: 0.7;
    }

    .note-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      flex-shrink: 0;
    }

    .note-icon.soap { background: #eff6ff; color: #3b82f6; }
    .note-icon.progress { background: #ecfdf5; color: #10b981; }
    .note-icon.h_and_p { background: #fef3c7; color: #f59e0b; }
    .note-icon.consultation { background: #fce7f3; color: #ec4899; }
    .note-icon.procedure { background: #f3e8ff; color: #8b5cf6; }
    .note-icon.discharge { background: #fee2e2; color: #ef4444; }

    .note-info {
      flex: 1;
      min-width: 0;
    }

    .note-title {
      display: block;
      font-weight: 500;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .note-meta {
      font-size: 0.75rem;
      color: #64748b;
    }

    .empty-list {
      text-align: center;
      padding: 2rem;
      color: #94a3b8;
    }

    .empty-list i {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    /* Note Detail Panel */
    .note-detail-panel {
      height: 100%;
      overflow: hidden;
    }

    :host ::ng-deep .editor-card,
    :host ::ng-deep .view-card {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    :host ::ng-deep .editor-card .p-card-body,
    :host ::ng-deep .view-card .p-card-body {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    :host ::ng-deep .editor-card .p-card-content,
    :host ::ng-deep .view-card .p-card-content {
      flex: 1;
      overflow-y: auto;
      padding: 0 !important;
    }

    /* Editor Header */
    .editor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .editor-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
    }

    :host ::ng-deep .type-select {
      width: 160px;
    }

    .title-input {
      flex: 1;
      min-width: 200px;
    }

    .editor-actions {
      display: flex;
      gap: 0.5rem;
    }

    /* SOAP Editor - Force Horizontal Tabs */
    :host ::ng-deep .soap-tabs {
      height: 100%;
    }

    :host ::ng-deep .soap-tabs .p-tabview-nav-container {
      display: flex !important;
      flex-direction: row !important;
    }

    :host ::ng-deep .soap-tabs .p-tabview-nav {
      display: flex !important;
      flex-direction: row !important;
      flex-wrap: nowrap !important;
    }

    :host ::ng-deep .soap-tabs .p-tabview-nav li {
      display: inline-flex !important;
    }

    :host ::ng-deep .soap-tabs .p-tabview-panels {
      padding: 0;
      height: calc(100% - 42px);
      overflow-y: auto;
    }

    .soap-editor {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .soap-section {
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      overflow: hidden;
    }

    .soap-section.subjective { border-left: 4px solid #3b82f6; }
    .soap-section.objective { border-left: 4px solid #10b981; }
    .soap-section.assessment { border-left: 4px solid #f59e0b; }
    .soap-section.plan { border-left: 4px solid #8b5cf6; }

    .section-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: #f8fafc;
      border-bottom: 1px solid #e5e7eb;
    }

    .section-header label {
      font-weight: 600;
      color: #374151;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex: 1;
    }

    .section-letter {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: white;
    }

    .subjective .section-letter { background: #3b82f6; }
    .objective .section-letter { background: #10b981; }
    .assessment .section-letter { background: #f59e0b; }
    .plan .section-letter { background: #8b5cf6; }

    .soap-textarea {
      width: 100%;
      border: none !important;
      border-radius: 0 !important;
      resize: none;
    }

    :host ::ng-deep .soap-textarea:focus {
      box-shadow: none !important;
    }

    /* Vitals Summary */
    .vitals-summary {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: #ecfdf5;
      border-bottom: 1px solid #e5e7eb;
    }

    .vital-chip {
      padding: 0.25rem 0.5rem;
      background: white;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
      color: #10b981;
    }

    /* Diagnoses */
    .diagnoses-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: #fffbeb;
      border-bottom: 1px solid #e5e7eb;
    }

    .diagnosis-chip {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      background: white;
      border-radius: 6px;
      border: 1px solid #fcd34d;
    }

    .diagnosis-chip.primary {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .dx-code {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.8125rem;
    }

    .dx-desc {
      flex: 1;
      font-size: 0.8125rem;
      color: #64748b;
    }

    /* ROS Editor */
    .ros-editor {
      padding: 1rem;
    }

    .ros-instructions {
      margin: 0 0 1rem;
      color: #64748b;
      font-size: 0.875rem;
    }

    .ros-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .ros-item label {
      display: block;
      font-weight: 500;
      margin-bottom: 0.25rem;
      color: #374151;
      font-size: 0.875rem;
    }

    .ros-item textarea {
      width: 100%;
    }

    /* Physical Exam Editor */
    .pe-editor {
      padding: 1rem;
    }

    .pe-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .pe-item label {
      display: block;
      font-weight: 500;
      margin-bottom: 0.25rem;
      color: #374151;
      font-size: 0.875rem;
    }

    .pe-item textarea {
      width: 100%;
    }

    /* View Mode */
    .view-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .view-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .view-title h2 {
      margin: 0;
      font-size: 1.25rem;
      color: #1e293b;
    }

    .view-actions {
      display: flex;
      gap: 0.5rem;
    }

    .note-metadata {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      padding: 1rem;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #64748b;
    }

    .meta-item.signed {
      color: #10b981;
    }

    .note-content-view {
      padding: 1rem;
    }

    .content-section {
      margin-bottom: 1.5rem;
    }

    .content-section h4 {
      margin: 0 0 0.5rem;
      font-size: 0.875rem;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .content-section p {
      margin: 0;
      color: #1e293b;
      line-height: 1.6;
    }

    .soap-view {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .soap-section-view {
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      overflow: hidden;
    }

    .soap-section-view.subjective { border-left: 4px solid #3b82f6; }
    .soap-section-view.objective { border-left: 4px solid #10b981; }
    .soap-section-view.assessment { border-left: 4px solid #f59e0b; }
    .soap-section-view.plan { border-left: 4px solid #8b5cf6; }

    .section-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: #f8fafc;
      border-bottom: 1px solid #e5e7eb;
      font-weight: 600;
      color: #374151;
    }

    .section-label .letter {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: white;
    }

    .subjective .section-label .letter { background: #3b82f6; }
    .objective .section-label .letter { background: #10b981; }
    .assessment .section-label .letter { background: #f59e0b; }
    .plan .section-label .letter { background: #8b5cf6; }

    .section-content {
      padding: 1rem;
      color: #1e293b;
      line-height: 1.6;
    }

    .diagnoses-view {
      margin-bottom: 1rem;
    }

    .dx-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0;
    }

    .dx-num {
      font-weight: 600;
      color: #64748b;
    }

    .dx-text {
      flex: 1;
      color: #1e293b;
    }

    /* Amendments */
    .amendments-section {
      padding: 1rem;
    }

    .amendments-section h4 {
      margin: 0 0 1rem;
      color: #374151;
    }

    .amendment-item {
      padding: 1rem;
      background: #fef3c7;
      border-radius: 8px;
      border-left: 3px solid #f59e0b;
      margin-bottom: 0.75rem;
    }

    .amendment-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .amendment-author {
      font-weight: 600;
      color: #92400e;
    }

    .amendment-date {
      font-size: 0.75rem;
      color: #a16207;
    }

    .amendment-reason {
      font-size: 0.75rem;
      color: #a16207;
      font-style: italic;
      margin-bottom: 0.5rem;
    }

    .amendment-content {
      color: #78350f;
    }

    /* Empty Detail */
    .empty-detail {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      background: white;
      border-radius: 12px;
      color: #94a3b8;
    }

    .empty-detail i {
      font-size: 4rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .empty-detail h3 {
      margin: 0;
      color: #64748b;
    }

    .empty-detail p {
      margin: 0.5rem 0 1.5rem;
    }

    /* Templates Dialog */
    .templates-dialog {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .template-categories {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .templates-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-height: 400px;
      overflow-y: auto;
    }

    .template-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem;
      background: #f8fafc;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .template-item:hover {
      background: #eff6ff;
    }

    .template-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #eff6ff;
      color: #3b82f6;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .template-info {
      flex: 1;
    }

    .template-name {
      display: block;
      font-weight: 500;
      color: #1e293b;
    }

    .template-desc {
      font-size: 0.75rem;
      color: #64748b;
    }

    /* Vitals Form */
    .vitals-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .vital-row {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .vital-row label {
      width: 140px;
      font-weight: 500;
      color: #374151;
    }

    .vital-row input {
      flex: 1;
    }

    /* Diagnosis Form */
    .diagnosis-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .selected-diagnosis {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: #eff6ff;
      border-radius: 8px;
    }

    .form-field label {
      display: block;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    /* Markdown Body */
    .markdown-body h1, .markdown-body h2, .markdown-body h3,
    .markdown-body h4, .markdown-body h5, .markdown-body h6 {
      margin: 0.5em 0 0.25em;
      font-weight: 600;
      color: #1e293b;
      line-height: 1.3;
    }
    .markdown-body h1 { font-size: 1.25rem; }
    .markdown-body h2 { font-size: 1.125rem; }
    .markdown-body h3 { font-size: 1rem; }
    .markdown-body h4 { font-size: 0.9375rem; }

    .markdown-body p {
      margin: 0.25em 0;
      line-height: 1.6;
    }

    .markdown-body ul, .markdown-body ol {
      margin: 0.25em 0;
      padding-left: 1.5em;
    }

    .markdown-body li {
      margin: 0.125em 0;
    }

    .markdown-body table {
      border-collapse: collapse;
      width: 100%;
      margin: 0.5em 0;
      font-size: 0.875rem;
    }

    .markdown-body th, .markdown-body td {
      border: 1px solid #d1d5db;
      padding: 0.375rem 0.625rem;
      text-align: left;
    }

    .markdown-body th {
      background: #f1f5f9;
      font-weight: 600;
    }

    .markdown-body code {
      background: #f1f5f9;
      padding: 0.125em 0.375em;
      border-radius: 4px;
      font-size: 0.8125rem;
      font-family: 'Fira Code', 'Consolas', monospace;
    }

    .markdown-body pre {
      background: #f1f5f9;
      padding: 0.75rem;
      border-radius: 6px;
      overflow-x: auto;
      margin: 0.5em 0;
    }

    .markdown-body pre code {
      background: none;
      padding: 0;
    }

    .markdown-body blockquote {
      border-left: 3px solid #94a3b8;
      margin: 0.5em 0;
      padding: 0.25rem 0.75rem;
      color: #64748b;
    }

    .markdown-body hr {
      border: none;
      border-top: 1px solid #e5e7eb;
      margin: 0.75em 0;
    }

    .markdown-body strong {
      font-weight: 600;
    }

    /* Textarea with Preview */
    .textarea-with-preview {
      display: flex;
    }

    .textarea-with-preview .soap-textarea {
      flex: 1;
      min-width: 0;
    }

    .preview-pane {
      flex: 1;
      min-width: 0;
      max-height: 200px;
      overflow-y: auto;
      padding: 0.75rem 1rem;
      background: #fafbfc;
      border-left: 1px solid #e5e7eb;
    }

    /* Markdown Hint Bar */
    .markdown-hint-bar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 1rem;
      background: #f0f9ff;
      border-bottom: 1px solid #bae6fd;
      font-size: 0.75rem;
      color: #0369a1;
      cursor: pointer;
      user-select: none;
      transition: background 0.15s;
    }

    .markdown-hint-bar:hover {
      background: #e0f2fe;
    }

    .markdown-hint-bar .pi {
      font-size: 0.75rem;
    }

    .markdown-hint-bar span {
      flex: 1;
    }

    .markdown-cheatsheet {
      padding: 0.5rem 1rem;
      background: #f0f9ff;
      border-bottom: 1px solid #bae6fd;
    }

    .cheatsheet-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .cheatsheet-grid code {
      background: white;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      border: 1px solid #e0f2fe;
      color: #0c4a6e;
    }

    /* Panel Filters */
    .panel-filters {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      flex-wrap: wrap;
    }

    :host ::ng-deep .role-filter {
      width: 160px;
    }

    /* Role Badge */
    .role-badge {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      border-radius: 999px;
      font-size: 0.6875rem;
      font-weight: 600;
      border: 1px solid;
      line-height: 1.6;
      margin-top: 0.25rem;
      letter-spacing: 0.01em;
    }

    .role-badge--detail {
      font-size: 0.75rem;
      padding: 0.2rem 0.625rem;
      margin-top: 0.25rem;
    }

    /* Author block in note meta */
    .note-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .author-specialty {
      color: #64748b;
    }

    /* Detail view author block */
    .meta-author-block {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .meta-author-name {
      font-weight: 500;
      color: #1e293b;
    }

    .meta-author-specialty {
      font-size: 0.75rem;
      color: #64748b;
    }

    /* Dark mode role badges */
    .dark .role-badge,
    .dark .role-badge--detail {
      /* Colors are applied inline via [style] bindings using darkBg/darkText/darkBorder;
         this rule ensures the border rendering stays consistent */
      opacity: 1;
    }

    .dark .meta-author-name {
      color: #f1f5f9;
    }

    .dark .meta-author-specialty {
      color: #94a3b8;
    }

    .dark .author-specialty {
      color: #94a3b8;
    }

    /* Print Styles */
    @media print {
      .preview-pane,
      .markdown-hint-bar,
      .markdown-cheatsheet {
        display: none !important;
      }

      .markdown-body table {
        page-break-inside: avoid;
      }
    }

    /* Dark Mode */
    .clinical-notes.dark {
      background: #0f172a;
    }

    .dark .notes-header,
    .dark .panel-header,
    .dark .section-header,
    .dark .view-header {
      background: #1e293b;
      border-color: #334155;
    }

    .dark .notes-header h1,
    .dark .panel-header h3,
    .dark .view-title h2,
    .dark .note-title {
      color: #f1f5f9;
    }

    .dark .note-item:hover,
    .dark .note-item.selected {
      background: #334155;
    }

    .dark .markdown-body h1, .dark .markdown-body h2,
    .dark .markdown-body h3, .dark .markdown-body h4 {
      color: #f1f5f9;
    }

    .dark .markdown-body th {
      background: #334155;
    }

    .dark .markdown-body th, .dark .markdown-body td {
      border-color: #475569;
    }

    .dark .markdown-body code {
      background: #334155;
      color: #e2e8f0;
    }

    .dark .markdown-body pre {
      background: #1e293b;
    }

    .dark .markdown-body blockquote {
      border-color: #475569;
      color: #94a3b8;
    }

    .dark .preview-pane {
      background: #1e293b;
      border-color: #334155;
    }

    .dark .markdown-hint-bar {
      background: #1e293b;
      border-color: #334155;
      color: #93c5fd;
    }

    .dark .markdown-hint-bar:hover {
      background: #334155;
    }

    .dark .markdown-cheatsheet {
      background: #1e293b;
      border-color: #334155;
    }

    .dark .cheatsheet-grid code {
      background: #0f172a;
      border-color: #334155;
      color: #93c5fd;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .notes-grid {
        grid-template-columns: 1fr;
        height: auto;
      }

      .notes-list-panel {
        max-height: 300px;
      }

      .ros-grid,
      .pe-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ClinicalNotesComponent implements OnInit, OnDestroy {
  readonly themeService = inject(ThemeService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly destroy$ = new Subject<void>();

  // Input
  patientId = input<string>();
  encounterId = input<string>();

  // Signals
  notes = signal<ClinicalNote[]>([]);
  selectedNote = signal<ClinicalNote | null>(null);
  editMode = signal(false);
  saving = signal(false);
  signing = signal(false);
  showTemplatesDialog = signal(false);
  showVitalsDialog = signal(false);
  showPhysicalExamDialog = signal(false);
  showDiagnosisDialog = signal(false);
  showPreview = signal(false);
  showMarkdownHelp = signal(false);
  diagnosisSuggestions = signal<any[]>([]);
  selectedDiagnosis = signal<Diagnosis | null>(null);

  // Filters
  selectedTypeFilter = '';
  selectedRoleFilter = '';
  selectedRole = signal<ClinicalRole | 'all'>('all');

  // Role filter options
  roleFilterOptions = [
    { label: 'Attending',            value: 'attending' },
    { label: 'Resident',             value: 'resident' },
    { label: 'Fellow',               value: 'fellow' },
    { label: 'Intern',               value: 'intern' },
    { label: 'Nurse',                value: 'nurse' },
    { label: 'Nurse Practitioner',   value: 'nurse-practitioner' },
    { label: 'Physician Assistant',  value: 'physician-assistant' },
    { label: 'Respiratory Therapist',value: 'respiratory-therapist' },
    { label: 'Physical Therapist',   value: 'physical-therapist' },
    { label: 'Occupational Therapist',value: 'occupational-therapist' },
    { label: 'Pharmacist',           value: 'pharmacist' },
    { label: 'Social Worker',        value: 'social-worker' },
    { label: 'Dietitian',            value: 'dietitian' },
    { label: 'Psychologist',         value: 'psychologist' },
    { label: 'Case Manager',         value: 'case-manager' },
  ];

  // Current note being edited
  currentNoteType: NoteType = 'soap';
  currentNoteTitle = '';
  noteContent: SOAPContent = this.getEmptyContent();
  rosContent: Record<string, string> = {};
  peContent: Record<string, string> = {};
  vitalsForm: VitalSigns = this.getEmptyVitals();
  diagnosisSearch = '';
  diagnosisType = 'primary';

  // Templates
  selectedTemplateCategory = 'All';
  templateCategories = ['All', 'General', 'Cardiology', 'Pediatrics', 'Orthopedics'];
  templates: NoteTemplate[] = [
    { id: '1', name: 'General SOAP Note', type: 'soap', category: 'General', description: 'Standard SOAP note template', content: {} },
    { id: '2', name: 'Annual Physical', type: 'h_and_p', category: 'General', description: 'Comprehensive annual exam', content: { chiefComplaint: 'Annual wellness exam' } },
    { id: '3', name: 'Chest Pain Workup', type: 'soap', category: 'Cardiology', description: 'Cardiac chest pain evaluation', content: { chiefComplaint: 'Chest pain' } },
    { id: '4', name: 'Well Child Visit', type: 'soap', category: 'Pediatrics', description: 'Pediatric wellness check', content: { chiefComplaint: 'Well child visit' } },
    { id: '5', name: 'Joint Pain Evaluation', type: 'soap', category: 'Orthopedics', description: 'Musculoskeletal assessment', content: {} },
  ];

  // Options
  noteTypes = [
    { label: 'SOAP Note', value: 'soap' },
    { label: 'Progress Note', value: 'progress' },
    { label: 'H&P', value: 'h_and_p' },
    { label: 'Consultation', value: 'consultation' },
    { label: 'Procedure Note', value: 'procedure' },
    { label: 'Discharge Summary', value: 'discharge' },
  ];

  noteTypeFilters = [
    { label: 'SOAP', value: 'soap' },
    { label: 'Progress', value: 'progress' },
    { label: 'H&P', value: 'h_and_p' },
    { label: 'Consultation', value: 'consultation' },
  ];

  newNoteOptions: MenuItem[] = [
    { label: 'SOAP Note', icon: 'pi pi-file', command: () => this.openNewNoteDialog('soap') },
    { label: 'Progress Note', icon: 'pi pi-file-edit', command: () => this.openNewNoteDialog('progress') },
    { label: 'H&P', icon: 'pi pi-clipboard', command: () => this.openNewNoteDialog('h_and_p') },
    { label: 'Consultation', icon: 'pi pi-comments', command: () => this.openNewNoteDialog('consultation') },
    { label: 'Procedure Note', icon: 'pi pi-cog', command: () => this.openNewNoteDialog('procedure') },
  ];

  rosSystems = [
    { key: 'constitutional', label: 'Constitutional', placeholder: 'Fever, weight change, fatigue...' },
    { key: 'eyes', label: 'Eyes', placeholder: 'Vision changes, pain, redness...' },
    { key: 'entMouthThroat', label: 'ENT/Mouth/Throat', placeholder: 'Hearing, sore throat, congestion...' },
    { key: 'cardiovascular', label: 'Cardiovascular', placeholder: 'Chest pain, palpitations, edema...' },
    { key: 'respiratory', label: 'Respiratory', placeholder: 'Cough, SOB, wheezing...' },
    { key: 'gastrointestinal', label: 'Gastrointestinal', placeholder: 'Nausea, vomiting, abdominal pain...' },
    { key: 'genitourinary', label: 'Genitourinary', placeholder: 'Dysuria, frequency, discharge...' },
    { key: 'musculoskeletal', label: 'Musculoskeletal', placeholder: 'Joint pain, stiffness, weakness...' },
    { key: 'skin', label: 'Skin', placeholder: 'Rash, lesions, itching...' },
    { key: 'neurological', label: 'Neurological', placeholder: 'Headache, dizziness, numbness...' },
    { key: 'psychiatric', label: 'Psychiatric', placeholder: 'Depression, anxiety, sleep...' },
    { key: 'endocrine', label: 'Endocrine', placeholder: 'Polyuria, polydipsia, heat/cold intolerance...' },
  ];

  physicalExamSections = [
    { key: 'general', label: 'General', placeholder: 'Well-developed, well-nourished, NAD...' },
    { key: 'heent', label: 'HEENT', placeholder: 'Normocephalic, PERRLA, TMs clear...' },
    { key: 'neck', label: 'Neck', placeholder: 'Supple, no lymphadenopathy, no JVD...' },
    { key: 'cardiovascular', label: 'Cardiovascular', placeholder: 'RRR, no murmurs, no edema...' },
    { key: 'respiratory', label: 'Respiratory', placeholder: 'CTA bilaterally, no wheezes...' },
    { key: 'abdomen', label: 'Abdomen', placeholder: 'Soft, non-tender, no masses...' },
    { key: 'extremities', label: 'Extremities', placeholder: 'No cyanosis, clubbing, or edema...' },
    { key: 'neurological', label: 'Neurological', placeholder: 'A&O x3, CN II-XII intact...' },
    { key: 'skin', label: 'Skin', placeholder: 'Warm, dry, no rashes...' },
    { key: 'psychiatric', label: 'Psychiatric', placeholder: 'Appropriate mood and affect...' },
  ];

  // Computed
  filteredNotes = computed(() => {
    let notes = this.notes();
    if (this.selectedTypeFilter) {
      notes = notes.filter(n => n.noteType === this.selectedTypeFilter);
    }
    const role = this.selectedRole();
    if (role !== 'all') {
      notes = notes.filter(n => n.authorRole === role);
    }
    return notes;
  });

  filteredTemplates = computed(() => {
    if (this.selectedTemplateCategory === 'All') {
      return this.templates;
    }
    return this.templates.filter(t => t.category === this.selectedTemplateCategory);
  });

  ngOnInit(): void {
    this.loadMockNotes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadMockNotes(): void {
    const now = Date.now();
    const day = 86400000;

    const mockNotes: ClinicalNote[] = [
      // ── Attending ──────────────────────────────────────────────────────────
      {
        id: '1', patientId: 'pt1', encounterId: 'enc1', noteType: 'soap',
        title: 'Follow-up Visit - Hypertension', status: 'signed',
        author: 'Dr. Sarah Smith', authorId: 'dr1',
        authorRole: 'attending', authorSpecialty: 'Internal Medicine',
        createdAt: new Date(now), updatedAt: new Date(now),
        signedAt: new Date(now), signedBy: 'Dr. Sarah Smith',
        content: {
          chiefComplaint: 'Follow-up for hypertension management',
          subjective: 'Patient reports **compliance with medications**. Denies headaches, chest pain, or shortness of breath. Home BP log shows readings consistently around 130/85 mmHg.',
          objective: '- BP: 128/82 mmHg\n- HR: 72 bpm, regular\n- Well-appearing, in no acute distress\n- Lungs clear to auscultation bilaterally\n- No peripheral edema',
          assessment: 'Essential hypertension — well-controlled on current regimen.',
          plan: '1. Continue lisinopril 10 mg daily\n2. Continue HCTZ 25 mg daily\n3. Labs ordered: BMP, lipid panel\n4. Dietary counseling reinforced (DASH diet)',
          followUp: 'Return in **3 months** or sooner if BP exceeds 150/95.',
          diagnoses: [{ code: 'I10', description: 'Essential hypertension', type: 'primary' }],
        }
      },
      // ── Resident ───────────────────────────────────────────────────────────
      {
        id: '2', patientId: 'pt1', encounterId: 'enc2', noteType: 'soap',
        title: 'Acute Visit - Upper Respiratory Infection', status: 'draft',
        author: 'Dr. Marcus Webb', authorId: 'dr-res1',
        authorRole: 'resident', authorSpecialty: 'Internal Medicine',
        createdAt: new Date(now - day), updatedAt: new Date(now),
        content: {
          chiefComplaint: 'Cold symptoms x 3 days',
          subjective: 'Patient presents with 3 days of nasal congestion, sore throat, and low-grade fever (max 100.4 °F at home). Denies ear pain or productive cough.',
          objective: '',
          assessment: '',
          plan: '',
        }
      },
      // ── Attending ──────────────────────────────────────────────────────────
      {
        id: '3', patientId: 'pt1', encounterId: 'enc3', noteType: 'progress',
        title: 'Progress Note - Diabetes Management', status: 'signed',
        author: 'Dr. Linda Johnson', authorId: 'dr2',
        authorRole: 'attending', authorSpecialty: 'Endocrinology',
        createdAt: new Date(now - 2 * day), updatedAt: new Date(now - 2 * day),
        signedAt: new Date(now - 2 * day), signedBy: 'Dr. Linda Johnson',
        content: {
          subjective: 'Patient reports good glucose control. Following diabetic diet. Walking 30 min daily. No hypoglycemic episodes since last visit.',
          objective: '- A1C: **6.8%** (improved from 7.2%)\n- Fasting glucose: 112 mg/dL\n- Foot exam: normal sensation, intact skin\n- Monofilament testing intact bilaterally',
          assessment: 'Type 2 diabetes mellitus — well controlled. A1C trending down appropriately.',
          plan: '1. Continue metformin 1000 mg BID\n2. Schedule ophthalmology referral for annual diabetic eye exam\n3. Repeat A1C in 3 months\n4. Continue dietary counseling',
          diagnoses: [
            { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', type: 'primary' },
            { code: 'I10', description: 'Essential hypertension', type: 'secondary' },
          ],
        }
      },
      // ── Nurse ──────────────────────────────────────────────────────────────
      {
        id: '4', patientId: 'pt1', encounterId: 'enc1', noteType: 'progress',
        title: 'Nursing Assessment - Admission', status: 'signed',
        author: 'RN Patricia Torres', authorId: 'rn1',
        authorRole: 'nurse', authorSpecialty: 'Medical-Surgical',
        createdAt: new Date(now - 3 * day), updatedAt: new Date(now - 3 * day),
        signedAt: new Date(now - 3 * day), signedBy: 'RN Patricia Torres',
        content: {
          chiefComplaint: 'Nursing admission assessment',
          subjective: 'Patient alert and oriented x4. Cooperative. Reports pain **4/10** in lower back, describes it as aching and constant. Denies chest pain, dyspnea, or nausea. Last oral intake 6 hours prior to admission.',
          objective: '## Vital Signs\n- BP: 134/86 mmHg\n- HR: 80 bpm\n- Temp: 98.8 °F\n- RR: 16/min\n- SpO2: 97% on room air\n\n## Skin Assessment\nWarm, dry, intact. No pressure injuries noted. Braden score: **20** (low risk).\n\n## Fall Risk\nMorse Fall Scale: **35** — moderate risk. Fall precautions initiated.',
          assessment: 'Patient admitted in stable condition. Pain and fall risk identified as active nursing concerns.',
          plan: '- Initiate fall precautions protocol\n- Pain reassessment q4h\n- Hourly rounding\n- IV access established — right antecubital 20G\n- Intake and output monitoring',
        }
      },
      // ── Respiratory Therapist ──────────────────────────────────────────────
      {
        id: '5', patientId: 'pt1', encounterId: 'enc1', noteType: 'progress',
        title: 'Respiratory Therapy Assessment', status: 'signed',
        author: 'RT James Okafor', authorId: 'rt1',
        authorRole: 'respiratory-therapist', authorSpecialty: 'Respiratory Care',
        createdAt: new Date(now - 4 * day), updatedAt: new Date(now - 4 * day),
        signedAt: new Date(now - 4 * day), signedBy: 'RT James Okafor',
        content: {
          chiefComplaint: 'Respiratory therapy evaluation — ordered for COPD exacerbation monitoring',
          subjective: 'Patient reports increased dyspnea on exertion over the past week. Using rescue inhaler approximately 3x daily (baseline 1x). No nocturnal symptoms. Denies recent fever or productive cough.',
          objective: '## Pulmonary Function\n- SpO2: 91% on room air → 96% on 2L NC\n- RR: 22/min, shallow\n- Breath sounds: **diffuse expiratory wheeze** bilaterally, prolonged expiratory phase\n- Accessory muscle use: mild\n\n## Peak Flow\n- Current: 220 L/min (65% of personal best)\n- Post-bronchodilator: 290 L/min (85% of personal best) — **significant response**',
          assessment: 'Moderate COPD exacerbation with meaningful bronchodilator response. O2 requirement met on low-flow nasal cannula.',
          plan: '1. Albuterol/ipratropium nebulization q4h and PRN\n2. Supplemental O2 via nasal cannula, titrate to SpO2 ≥ 92%\n3. Incentive spirometry 10x/hour while awake\n4. Reassess in 4 hours\n5. Notify MD if SpO2 < 90% or RR > 28',
          diagnoses: [{ code: 'J44.1', description: 'COPD with acute exacerbation', type: 'primary' }],
        }
      },
      // ── Pharmacist ─────────────────────────────────────────────────────────
      {
        id: '6', patientId: 'pt1', encounterId: 'enc1', noteType: 'consultation',
        title: 'Pharmacy Medication Reconciliation', status: 'signed',
        author: 'PharmD Angela Chen', authorId: 'pharm1',
        authorRole: 'pharmacist', authorSpecialty: 'Clinical Pharmacy',
        createdAt: new Date(now - 5 * day), updatedAt: new Date(now - 5 * day),
        signedAt: new Date(now - 5 * day), signedBy: 'PharmD Angela Chen',
        content: {
          chiefComplaint: 'Medication reconciliation and therapy review on admission',
          subjective: 'Patient reports taking all medications as prescribed. Denies over-the-counter NSAID use. No herbal supplements reported. Patient unable to recall exact doses — pharmacy records reviewed.',
          objective: '## Medication Reconciliation\n| Medication | Home Dose | Admission Order | Reconciled |\n|---|---|---|---|\n| Lisinopril | 10 mg daily | 10 mg daily | Yes |\n| HCTZ | 25 mg daily | 25 mg daily | Yes |\n| Metformin | 1000 mg BID | 1000 mg BID | Yes |\n| Atorvastatin | 40 mg nightly | 40 mg nightly | Yes |\n| Aspirin | 81 mg daily | 81 mg daily | Yes |\n\n## Drug Interactions\nNo clinically significant interactions identified with current admission medications.',
          assessment: '**No discrepancies** found on reconciliation. Renal function adequate for continued metformin (eGFR: 68 mL/min). Statin dose appropriate given cardiovascular risk profile.',
          plan: '1. Continue all home medications as reconciled\n2. Hold metformin if contrast procedure ordered (48-hour hold)\n3. Monitor electrolytes given concurrent ACE inhibitor and diuretic\n4. Patient counseled on medication purpose and adherence\n5. Follow-up reconciliation at discharge',
        }
      },
      // ── Physical Therapist ─────────────────────────────────────────────────
      {
        id: '7', patientId: 'pt1', encounterId: 'enc1', noteType: 'consultation',
        title: 'Physical Therapy Evaluation', status: 'signed',
        author: 'PT Derek Nakamura', authorId: 'pt1',
        authorRole: 'physical-therapist', authorSpecialty: 'Acute Care PT',
        createdAt: new Date(now - 6 * day), updatedAt: new Date(now - 6 * day),
        signedAt: new Date(now - 6 * day), signedBy: 'PT Derek Nakamura',
        content: {
          chiefComplaint: 'PT evaluation — physician referral for mobility assessment and fall prevention',
          subjective: 'Patient reports progressive difficulty ambulating over the past month. Fear of falling after a near-miss at home 2 weeks ago. Lives alone in a two-story house. Denies lower extremity weakness but acknowledges balance feels "off."',
          objective: '## Functional Assessment\n- **Transfers**: Bed-to-sit — independent; Sit-to-stand — requires bilateral UE support, mildly labored\n- **Ambulation**: Ambulatory with straight cane x 50 ft on level surface; gait antalgic, reduced right stance phase\n- **Balance**: Berg Balance Scale — **42/56** (moderate fall risk)\n- **Timed Up and Go**: **14.2 seconds** (>12 sec = increased fall risk)\n\n## Musculoskeletal\n- Hip flexor strength 4/5 bilaterally\n- Ankle dorsiflexion AROM: R 10°, L 15° (mildly limited right)\n- No lower extremity edema',
          assessment: 'Moderate functional mobility impairment with elevated fall risk (Berg 42/56, TUG 14.2s). Contributing factors: antalgic gait, reduced ankle ROM, and deconditioning.',
          plan: '1. PT daily x 5 days during admission\n2. Therapeutic exercises: hip strengthening, ankle ROM, balance training\n3. Gait training with appropriate assistive device\n4. Home safety assessment referral at discharge\n5. Discharge recommendations: outpatient PT 2x/week x 6 weeks',
        }
      },
      // ── Social Worker ──────────────────────────────────────────────────────
      {
        id: '8', patientId: 'pt1', encounterId: 'enc1', noteType: 'consultation',
        title: 'Social Work Assessment', status: 'signed',
        author: 'MSW Danielle Brooks', authorId: 'sw1',
        authorRole: 'social-worker', authorSpecialty: 'Medical Social Work',
        createdAt: new Date(now - 7 * day), updatedAt: new Date(now - 7 * day),
        signedAt: new Date(now - 7 * day), signedBy: 'MSW Danielle Brooks',
        content: {
          chiefComplaint: 'Social work consultation — discharge planning and psychosocial assessment',
          subjective: 'Patient is a 68-year-old retired teacher living alone in a two-story home. Widowed 2 years ago. Reports feeling "isolated" since retirement, but denies depression or hopelessness. Daughter lives 45 minutes away and is primary support. Patient expresses concern about managing independently post-discharge.',
          objective: '## Psychosocial Screening\n- **PHQ-2**: Score 1 (minimal depressive symptoms)\n- **Social support**: Limited; daughter available on weekends\n- **Financial**: Medicare primary, Medigap supplemental. Denies financial hardship.\n- **Housing**: Two-story home, bedroom upstairs — **barrier to safe discharge given current mobility status**\n\n## Safety Assessment\nNo evidence of abuse, neglect, or domestic violence. Patient has advance directive on file.',
          assessment: 'Psychosocial needs identified: (1) limited daily support network, (2) housing safety concern given upstairs bedroom, (3) mild social isolation.',
          plan: '1. Contact patient\'s daughter regarding discharge planning conference\n2. Initiate referral to **Area Agency on Aging** for in-home support assessment\n3. Evaluate temporary ground-floor sleeping arrangement options\n4. Provide community resource list (meal delivery, transportation, senior center)\n5. Re-assess prior to discharge for additional needs',
        }
      },
      // ── Dietitian ──────────────────────────────────────────────────────────
      {
        id: '9', patientId: 'pt1', encounterId: 'enc1', noteType: 'consultation',
        title: 'Nutrition Assessment', status: 'signed',
        author: 'RD Maria Santos', authorId: 'rd1',
        authorRole: 'dietitian', authorSpecialty: 'Clinical Nutrition',
        createdAt: new Date(now - 8 * day), updatedAt: new Date(now - 8 * day),
        signedAt: new Date(now - 8 * day), signedBy: 'RD Maria Santos',
        content: {
          chiefComplaint: 'Registered Dietitian consultation — nutrition support for diabetes and hypertension',
          subjective: 'Patient reports attempting to follow a diabetic diet but finds it difficult to meal-plan. Eats 2 main meals per day, skips breakfast regularly. High sodium intake suspected (eats canned soups and processed foods frequently). No food allergies. No difficulty swallowing.',
          objective: '## Anthropometrics\n- Height: 5\'7" (170 cm)\n- Weight: 188 lbs (85.3 kg)\n- BMI: **29.4** (overweight)\n- Usual body weight: 195 lbs — unintentional weight loss of 7 lbs over 3 months (3.6%)\n\n## Nutritional Risk\n- **MUST Score**: 1 (medium risk)\n- Estimated needs: 1,800–2,000 kcal/day; 68–75 g protein/day\n- Estimated sodium intake: ~3,500 mg/day (goal: <2,300 mg)',
          assessment: 'Medium nutritional risk. Suboptimal dietary pattern contributing to suboptimal glycemic and blood pressure control. Weight loss over 3 months warrants monitoring.',
          plan: '1. Medical Nutrition Therapy: **consistent carbohydrate diet** 45g CHO per meal\n2. Sodium restriction: < 2,300 mg/day — review low-sodium food choices\n3. Increase meal frequency: encourage 3 balanced meals + 1–2 snacks\n4. Provide printed DASH/Diabetic diet handout in patient\'s preferred language\n5. Outpatient MNT referral: 3 sessions over 6 weeks\n6. Reassess weight at next follow-up',
          diagnoses: [
            { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', type: 'secondary' },
            { code: 'Z68.29', description: 'BMI 29.0-29.9, adult (overweight)', type: 'secondary' },
          ],
        }
      },
      // ── Fellow ─────────────────────────────────────────────────────────────
      {
        id: '10', patientId: 'pt1', encounterId: 'enc1', noteType: 'h_and_p',
        title: 'Cardiology Fellow H&P', status: 'pending-signature',
        author: 'Dr. Priya Anand', authorId: 'fellow1',
        authorRole: 'fellow', authorSpecialty: 'Cardiology',
        createdAt: new Date(now - 9 * day), updatedAt: new Date(now - 9 * day),
        cosignRequired: true, cosignedBy: 'Dr. Robert Hale',
        content: {
          chiefComplaint: 'Cardiology consultation — atypical chest pain evaluation',
          subjective: 'Patient is a 68-year-old male with PMH of HTN and T2DM presenting with 2 weeks of intermittent left-sided chest discomfort, non-radiating, occurring at rest and with exertion. Episodes last 5–10 minutes and resolve spontaneously. No diaphoresis, syncope, or palpitations. Denies pleuritic component.',
          objective: '## Vital Signs\n- BP: 138/84 mmHg (left arm) | 140/86 mmHg (right arm) — symmetric\n- HR: 76 bpm, regular\n- SpO2: 97% RA\n\n## Cardiac Exam\n- Regular rate and rhythm\n- S1, S2 normal; **S4 gallop present**\n- No murmurs, rubs, or clicks\n- No JVD; extremities without edema\n\n## Relevant Labs/Studies\n- ECG: normal sinus rhythm, no ST changes, LVH criteria met\n- Troponin x2: negative\n- BNP: 48 pg/mL',
          assessment: '**Atypical chest pain** in a high-risk patient (HTN, DM, age, male sex). S4 gallop and LVH on ECG raise concern for hypertensive heart disease. Acute ACS unlikely given negative biomarkers.\n\n**Differential Diagnosis:**\n1. Hypertensive heart disease with angina equivalent\n2. Musculoskeletal chest pain\n3. GERD',
          plan: '1. Stress echocardiogram scheduled for tomorrow AM\n2. Continue current antihypertensives; optimize BP control\n3. Add aspirin 81 mg daily (discussed with attending)\n4. Holter monitor x 48h to evaluate for arrhythmia\n5. Follow-up in Cardiology clinic in 2 weeks with stress test results\n6. **Attending co-signature required before finalization**',
          diagnoses: [
            { code: 'R07.9', description: 'Chest pain, unspecified', type: 'primary' },
            { code: 'I10', description: 'Essential hypertension', type: 'secondary' },
          ],
        }
      },
    ];

    this.notes.set(mockNotes);
  }

  private getEmptyContent(): SOAPContent {
    return {
      subjective: '',
      objective: '',
      assessment: '',
      plan: '',
      chiefComplaint: '',
      diagnoses: [],
    };
  }

  private getEmptyVitals(): VitalSigns {
    return {
      bloodPressure: '',
      heartRate: '',
      temperature: '',
      respiratoryRate: '',
      oxygenSaturation: '',
      height: '',
      weight: '',
      bmi: '',
      painScale: '',
    };
  }

  selectNote(note: ClinicalNote): void {
    this.selectedNote.set(note);
    this.editMode.set(false);
  }

  openNewNoteDialog(type: NoteType): void {
    this.currentNoteType = type;
    this.currentNoteTitle = this.getNoteTypeLabel(type);
    this.noteContent = this.getEmptyContent();
    this.rosContent = {};
    this.peContent = {};
    this.vitalsForm = this.getEmptyVitals();
    this.selectedNote.set(null);
    this.editMode.set(true);
  }

  editNote(note: ClinicalNote): void {
    this.currentNoteType = note.noteType;
    this.currentNoteTitle = note.title;
    this.noteContent = { ...note.content };
    this.selectedNote.set(note);
    this.editMode.set(true);
  }

  cancelEdit(): void {
    this.editMode.set(false);
    if (this.selectedNote()) {
      // Restore original
    }
  }

  saveDraft(): void {
    this.saving.set(true);

    setTimeout(() => {
      const existingNote = this.selectedNote();
      
      if (existingNote) {
        // Update existing
        this.notes.update(notes => notes.map(n => 
          n.id === existingNote.id
            ? { ...n, title: this.currentNoteTitle, content: this.noteContent, status: 'draft' as NoteStatus, updatedAt: new Date() }
            : n
        ));
      } else {
        // Create new
        const newNote: ClinicalNote = {
          id: `note-${Date.now()}`,
          patientId: this.patientId() || 'pt1',
          encounterId: this.encounterId() || 'enc-new',
          noteType: this.currentNoteType,
          title: this.currentNoteTitle,
          status: 'draft',
          author: 'Dr. Current User',
          authorId: 'current-user',
          createdAt: new Date(),
          updatedAt: new Date(),
          content: this.noteContent,
        };
        this.notes.update(notes => [newNote, ...notes]);
        this.selectedNote.set(newNote);
      }

      this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Draft saved successfully' });
      this.saving.set(false);
    }, 500);
  }

  signNote(): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to sign this note? This action cannot be undone.',
      accept: () => {
        this.signing.set(true);

        setTimeout(() => {
          const existingNote = this.selectedNote();
          const noteId = existingNote?.id || `note-${Date.now()}`;

          this.notes.update(notes => {
            const updated = notes.map(n => 
              n.id === noteId
                ? { ...n, title: this.currentNoteTitle, content: this.noteContent, status: 'signed' as NoteStatus, signedAt: new Date(), signedBy: 'Dr. Current User', updatedAt: new Date() }
                : n
            );
            
            if (!existingNote) {
              const newNote: ClinicalNote = {
                id: noteId,
                patientId: this.patientId() || 'pt1',
                encounterId: this.encounterId() || 'enc-new',
                noteType: this.currentNoteType,
                title: this.currentNoteTitle,
                status: 'signed',
                author: 'Dr. Current User',
                authorId: 'current-user',
                createdAt: new Date(),
                updatedAt: new Date(),
                signedAt: new Date(),
                signedBy: 'Dr. Current User',
                content: this.noteContent,
              };
              return [newNote, ...updated];
            }
            return updated;
          });

          this.messageService.add({ severity: 'success', summary: 'Signed', detail: 'Note signed successfully' });
          this.signing.set(false);
          this.editMode.set(false);
        }, 500);
      }
    });
  }

  addAddendum(): void {
    this.messageService.add({ severity: 'info', summary: 'Feature', detail: 'Addendum feature coming soon' });
  }

  insertFromSmartPhrase(field: string): void {
    this.messageService.add({ severity: 'info', summary: 'Smart Phrases', detail: 'Smart phrases feature coming soon' });
  }

  applyTemplate(template: NoteTemplate): void {
    this.currentNoteType = template.type;
    this.currentNoteTitle = template.name;
    this.noteContent = { ...this.getEmptyContent(), ...template.content };
    this.showTemplatesDialog.set(false);
    this.messageService.add({ severity: 'success', summary: 'Template Applied', detail: `Applied "${template.name}" template` });
  }

  saveVitals(): void {
    this.noteContent.vitalSigns = { ...this.vitalsForm };
    this.showVitalsDialog.set(false);
    this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Vitals saved' });
  }

  searchDiagnosis(event: any): void {
    const query = event.query.toLowerCase();
    const suggestions = [
      { code: 'I10', description: 'Essential hypertension', display: 'I10 - Essential hypertension' },
      { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', display: 'E11.9 - Type 2 diabetes mellitus' },
      { code: 'J06.9', description: 'Acute upper respiratory infection, unspecified', display: 'J06.9 - Acute URI' },
      { code: 'M54.5', description: 'Low back pain', display: 'M54.5 - Low back pain' },
      { code: 'J45.909', description: 'Unspecified asthma, uncomplicated', display: 'J45.909 - Asthma' },
      { code: 'F41.1', description: 'Generalized anxiety disorder', display: 'F41.1 - Generalized anxiety disorder' },
      { code: 'K21.0', description: 'Gastro-esophageal reflux disease with esophagitis', display: 'K21.0 - GERD' },
    ].filter(d => d.display.toLowerCase().includes(query));
    
    this.diagnosisSuggestions.set(suggestions);
  }

  onDiagnosisSelect(dx: any): void {
    this.selectedDiagnosis.set({ code: dx.code, description: dx.description, type: 'primary' });
  }

  addDiagnosis(): void {
    const dx = this.selectedDiagnosis();
    if (!dx) return;

    const newDx: Diagnosis = { ...dx, type: this.diagnosisType as 'primary' | 'secondary' };
    this.noteContent.diagnoses = [...(this.noteContent.diagnoses || []), newDx];
    
    this.showDiagnosisDialog.set(false);
    this.selectedDiagnosis.set(null);
    this.diagnosisSearch = '';
    this.diagnosisType = 'primary';
  }

  removeDiagnosis(dx: Diagnosis): void {
    this.noteContent.diagnoses = (this.noteContent.diagnoses || []).filter(d => d.code !== dx.code);
  }

  togglePreview(): void {
    this.showPreview.set(!this.showPreview());
  }

  toggleMarkdownHelp(): void {
    this.showMarkdownHelp.set(!this.showMarkdownHelp());
  }

  // Role filter event handlers (p-select onChange/onClear do not mutate ngModel synchronously
  // in all PrimeNG versions, so we keep selectedRole signal in sync manually)
  onRoleFilterChange(event: { value: string }): void {
    this.selectedRole.set((event.value as ClinicalRole) ?? 'all');
  }

  onRoleFilterClear(): void {
    this.selectedRoleFilter = '';
    this.selectedRole.set('all');
  }

  // Role color helper – returns the correct light/dark variant depending on theme
  getRoleColor(role: ClinicalRole, prop: 'bg' | 'text' | 'border'): string {
    const palette = ROLE_COLORS[role];
    if (!palette) return '';
    if (this.themeService.isDarkMode()) {
      const darkProp = ('dark' + prop.charAt(0).toUpperCase() + prop.slice(1)) as 'darkBg' | 'darkText' | 'darkBorder';
      return palette[darkProp];
    }
    return palette[prop];
  }

  getRoleLabel(role: ClinicalRole): string {
    return ROLE_LABELS[role] ?? role;
  }

  // Helper methods
  getNoteTypeIcon(type: NoteType): string {
    const icons: Record<string, string> = {
      'soap': 'pi pi-file-edit',
      'progress': 'pi pi-file',
      'h_and_p': 'pi pi-clipboard',
      'consultation': 'pi pi-comments',
      'procedure': 'pi pi-cog',
      'discharge': 'pi pi-sign-out',
      'admission': 'pi pi-sign-in',
    };
    return icons[type] || 'pi pi-file';
  }

  getNoteTypeLabel(type: NoteType): string {
    const labels: Record<string, string> = {
      'soap': 'SOAP Note',
      'progress': 'Progress Note',
      'h_and_p': 'H&P',
      'consultation': 'Consultation',
      'procedure': 'Procedure Note',
      'discharge': 'Discharge Summary',
      'admission': 'Admission Note',
    };
    return labels[type] || type;
  }

  getNoteTypeSeverity(type: NoteType): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const severities: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      'soap': 'info',
      'progress': 'success',
      'h_and_p': 'warn',
      'consultation': 'secondary',
      'procedure': 'danger',
      'discharge': 'danger',
    };
    return severities[type] || 'secondary';
  }

  getStatusLabel(status: NoteStatus): string {
    const labels: Record<string, string> = {
      'draft': 'Draft',
      'in-progress': 'In Progress',
      'pending-signature': 'Pending Signature',
      'signed': 'Signed',
      'amended': 'Amended',
      'cosign-required': 'Cosign Required',
    };
    return labels[status] || status;
  }

  getStatusSeverity(status: NoteStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const severities: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      'draft': 'secondary',
      'in-progress': 'info',
      'pending-signature': 'warn',
      'signed': 'success',
      'amended': 'warn',
      'cosign-required': 'danger',
    };
    return severities[status] || 'secondary';
  }
}
