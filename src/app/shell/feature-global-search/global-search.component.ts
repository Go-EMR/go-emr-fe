import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ViewChild,
  ElementRef,
  HostListener,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { SemanticSearchService, GroupedSearchResults, SearchResult, SearchableItem } from '../../core/services/semantic-search.service';
import { ThemeService } from '../../core/services/theme.service';

// ---------------------------------------------------------------------------
// Mock seed data – rich keyword sets enable synonym matching without a backend
// ---------------------------------------------------------------------------

const SEED_PATIENTS: SearchableItem[] = [
  {
    id: 'patient-001',
    type: 'patient',
    title: 'James Wilson',
    subtitle: 'MRN: P-001 · DOB: 1958-03-12 · M',
    description: 'Hypertension, Type 2 diabetes mellitus, Chronic kidney disease',
    keywords: ['hypertension', 'HTN', 'diabetes', 'DM', 'T2DM', 'CKD', 'renal', 'kidney', 'blood pressure', 'Wilson'],
    route: '/patients/patient-001',
    icon: 'pi-user',
  },
  {
    id: 'patient-002',
    type: 'patient',
    title: 'Maria Garcia',
    subtitle: 'MRN: P-002 · DOB: 1965-07-24 · F',
    description: 'Asthma, GERD, Anxiety disorder',
    keywords: ['asthma', 'reactive airway', 'RAD', 'GERD', 'acid reflux', 'heartburn', 'anxiety', 'GAD', 'Garcia'],
    route: '/patients/patient-002',
    icon: 'pi-user',
  },
  {
    id: 'patient-003',
    type: 'patient',
    title: 'Robert Chen',
    subtitle: 'MRN: P-003 · DOB: 1972-11-05 · M',
    description: 'Atrial fibrillation, Heart failure, Anticoagulation therapy',
    keywords: ['atrial fibrillation', 'afib', 'a-fib', 'CHF', 'heart failure', 'anticoagulant', 'warfarin', 'blood thinner', 'Chen'],
    route: '/patients/patient-003',
    icon: 'pi-user',
  },
  {
    id: 'patient-004',
    type: 'patient',
    title: 'Sarah Johnson',
    subtitle: 'MRN: P-004 · DOB: 1989-02-18 · F',
    description: 'Major depressive disorder, Hypothyroidism',
    keywords: ['depression', 'MDD', 'depressive', 'hypothyroidism', 'thyroid', 'Hashimoto', 'sertraline', 'Johnson'],
    route: '/patients/patient-004',
    icon: 'pi-user',
  },
  {
    id: 'patient-005',
    type: 'patient',
    title: 'Michael Brown',
    subtitle: 'MRN: P-005 · DOB: 1945-09-30 · M',
    description: 'COPD, Osteoarthritis, Anemia',
    keywords: ['COPD', 'emphysema', 'chronic bronchitis', 'osteoarthritis', 'OA', 'joint pain', 'anemia', 'low hemoglobin', 'Brown'],
    route: '/patients/patient-005',
    icon: 'pi-user',
  },
  {
    id: 'patient-006',
    type: 'patient',
    title: 'Emily Davis',
    subtitle: 'MRN: P-006 · DOB: 1993-06-14 · F',
    description: 'Migraine, Iron deficiency anemia, UTI recurrent',
    keywords: ['migraine', 'headache', 'cephalalgia', 'anemia', 'IDA', 'iron deficiency', 'UTI', 'urinary tract infection', 'cystitis', 'Davis'],
    route: '/patients/patient-006',
    icon: 'pi-user',
  },
];

const SEED_ENCOUNTERS: SearchableItem[] = [
  {
    id: 'enc-001',
    type: 'encounter',
    title: 'Annual Physical – James Wilson',
    subtitle: 'Ambulatory · 2026-01-15 · Dr. Smith',
    description: 'Routine wellness visit. HTN and DM follow-up. Labs ordered.',
    keywords: ['annual physical', 'wellness', 'preventive', 'hypertension', 'diabetes', 'follow-up'],
    route: '/encounters/enc-001',
    icon: 'pi-file-edit',
  },
  {
    id: 'enc-002',
    type: 'encounter',
    title: 'Acute Visit – Maria Garcia',
    subtitle: 'Ambulatory · 2026-01-20 · Dr. Patel',
    description: 'Asthma exacerbation with increased wheezing. Albuterol nebulizer given.',
    keywords: ['asthma', 'wheezing', 'exacerbation', 'bronchospasm', 'albuterol', 'nebulizer', 'acute'],
    route: '/encounters/enc-002',
    icon: 'pi-file-edit',
  },
  {
    id: 'enc-003',
    type: 'encounter',
    title: 'Cardiology Follow-Up – Robert Chen',
    subtitle: 'Ambulatory · 2026-02-01 · Dr. Martinez',
    description: 'Afib management. INR therapeutic. Echo scheduled.',
    keywords: ['cardiology', 'afib', 'atrial fibrillation', 'INR', 'coagulation', 'warfarin', 'echocardiogram'],
    route: '/encounters/enc-003',
    icon: 'pi-file-edit',
  },
  {
    id: 'enc-004',
    type: 'encounter',
    title: 'Mental Health Visit – Sarah Johnson',
    subtitle: 'Ambulatory · 2026-02-10 · Dr. Lee',
    description: 'Depression management. Sertraline dose adjustment. PHQ-9 score 8.',
    keywords: ['depression', 'MDD', 'sertraline', 'SSRI', 'PHQ-9', 'mental health', 'psychiatry'],
    route: '/encounters/enc-004',
    icon: 'pi-file-edit',
  },
];

const SEED_PRESCRIPTIONS: SearchableItem[] = [
  {
    id: 'rx-001',
    type: 'prescription',
    title: 'Lisinopril 10mg – James Wilson',
    subtitle: 'ACE Inhibitor · Active · QD',
    description: 'For hypertension and chronic kidney disease protection. 90-day supply.',
    keywords: ['lisinopril', 'ACE inhibitor', 'ACEI', 'hypertension', 'HTN', 'blood pressure', 'kidney', 'Prinivil', 'Zestril'],
    route: '/patients/patient-001/prescriptions',
    icon: 'pi-box',
  },
  {
    id: 'rx-002',
    type: 'prescription',
    title: 'Metformin 500mg – James Wilson',
    subtitle: 'Biguanide · Active · BID',
    description: 'For type 2 diabetes mellitus. Monitor renal function.',
    keywords: ['metformin', 'Glucophage', 'diabetes', 'T2DM', 'biguanide', 'blood sugar', 'glucose'],
    route: '/patients/patient-001/prescriptions',
    icon: 'pi-box',
  },
  {
    id: 'rx-003',
    type: 'prescription',
    title: 'Atorvastatin 20mg – Robert Chen',
    subtitle: 'Statin · Active · QHS',
    description: 'Cholesterol management in atrial fibrillation patient.',
    keywords: ['atorvastatin', 'Lipitor', 'statin', 'cholesterol', 'HMG-CoA', 'lipid', 'cardiovascular'],
    route: '/patients/patient-003/prescriptions',
    icon: 'pi-box',
  },
  {
    id: 'rx-004',
    type: 'prescription',
    title: 'Warfarin 5mg – Robert Chen',
    subtitle: 'Anticoagulant · Active · QD',
    description: 'Anticoagulation for atrial fibrillation. INR monitoring required.',
    keywords: ['warfarin', 'Coumadin', 'anticoagulant', 'blood thinner', 'INR', 'afib', 'clot prevention'],
    route: '/patients/patient-003/prescriptions',
    icon: 'pi-box',
  },
  {
    id: 'rx-005',
    type: 'prescription',
    title: 'Sertraline 50mg – Sarah Johnson',
    subtitle: 'SSRI · Active · QD',
    description: 'Major depressive disorder. Titrate as needed.',
    keywords: ['sertraline', 'Zoloft', 'SSRI', 'antidepressant', 'depression', 'MDD', 'serotonin'],
    route: '/patients/patient-004/prescriptions',
    icon: 'pi-box',
  },
  {
    id: 'rx-006',
    type: 'prescription',
    title: 'Albuterol HFA Inhaler – Maria Garcia',
    subtitle: 'Bronchodilator · Active · PRN',
    description: 'Rescue inhaler for asthma exacerbations.',
    keywords: ['albuterol', 'inhaler', 'bronchodilator', 'asthma', 'wheezing', 'rescue', 'beta-agonist', 'ProAir', 'Ventolin'],
    route: '/patients/patient-002/prescriptions',
    icon: 'pi-box',
  },
];

const SEED_LABS: SearchableItem[] = [
  {
    id: 'lab-001',
    type: 'lab',
    title: 'HbA1c – James Wilson',
    subtitle: 'Result: 7.8% (High) · 2026-01-15',
    description: 'Hemoglobin A1c for diabetes monitoring. Target <7%.',
    keywords: ['HbA1c', 'hemoglobin A1c', 'A1c', 'glycated', 'diabetes', 'glucose control', 'T2DM'],
    route: '/patients/patient-001/labs',
    icon: 'pi-chart-bar',
  },
  {
    id: 'lab-002',
    type: 'lab',
    title: 'CBC – Emily Davis',
    subtitle: 'Result: Abnormal · 2026-01-28',
    description: 'Complete blood count showing microcytic anemia. Hgb 9.2 g/dL.',
    keywords: ['CBC', 'complete blood count', 'hemoglobin', 'hematocrit', 'anemia', 'iron deficiency', 'WBC', 'RBC', 'platelet'],
    route: '/patients/patient-006/labs',
    icon: 'pi-chart-bar',
  },
  {
    id: 'lab-003',
    type: 'lab',
    title: 'PT/INR – Robert Chen',
    subtitle: 'Result: INR 2.4 (Therapeutic) · 2026-02-01',
    description: 'Coagulation monitoring for warfarin therapy. Target INR 2.0-3.0.',
    keywords: ['INR', 'PT', 'prothrombin time', 'coagulation', 'warfarin', 'anticoagulant', 'blood thinner', 'clotting'],
    route: '/patients/patient-003/labs',
    icon: 'pi-chart-bar',
  },
  {
    id: 'lab-004',
    type: 'lab',
    title: 'CMP – James Wilson',
    subtitle: 'Result: Creatinine 1.8 (High) · 2026-01-15',
    description: 'Comprehensive metabolic panel. Elevated creatinine consistent with CKD stage 3.',
    keywords: ['CMP', 'comprehensive metabolic', 'creatinine', 'BUN', 'kidney', 'renal', 'electrolytes', 'sodium', 'potassium'],
    route: '/patients/patient-001/labs',
    icon: 'pi-chart-bar',
  },
  {
    id: 'lab-005',
    type: 'lab',
    title: 'Lipid Panel – Robert Chen',
    subtitle: 'Result: LDL 118 mg/dL · 2026-02-01',
    description: 'Fasting lipid panel. LDL above target for cardiovascular disease.',
    keywords: ['lipid panel', 'cholesterol', 'LDL', 'HDL', 'triglycerides', 'cardiovascular risk', 'statin'],
    route: '/patients/patient-003/labs',
    icon: 'pi-chart-bar',
  },
  {
    id: 'lab-006',
    type: 'lab',
    title: 'TSH – Sarah Johnson',
    subtitle: 'Result: 6.2 mIU/L (High) · 2026-02-10',
    description: 'Thyroid stimulating hormone elevated. Consistent with hypothyroidism.',
    keywords: ['TSH', 'thyroid', 'hypothyroidism', 'T4', 'Hashimoto', 'thyroiditis', 'levothyroxine'],
    route: '/patients/patient-004/labs',
    icon: 'pi-chart-bar',
  },
];

const SEED_IMAGING: SearchableItem[] = [
  {
    id: 'img-001',
    type: 'imaging',
    title: 'Chest X-Ray – Michael Brown',
    subtitle: 'X-Ray · Final · 2026-01-10',
    description: 'PA and lateral chest. Hyperinflation consistent with COPD. No acute infiltrate.',
    keywords: ['chest x-ray', 'xray', 'CXR', 'chest', 'COPD', 'hyperinflation', 'pulmonary', 'radiology'],
    route: '/imaging/img-001',
    icon: 'pi-image',
  },
  {
    id: 'img-002',
    type: 'imaging',
    title: 'Echocardiogram – Robert Chen',
    subtitle: 'Ultrasound · Final · 2026-02-05',
    description: 'TTE showing reduced EF 40%. Dilated LV consistent with HFrEF.',
    keywords: ['echocardiogram', 'echo', 'TTE', 'ultrasound', 'heart failure', 'CHF', 'HFrEF', 'EF', 'ejection fraction', 'cardiac'],
    route: '/imaging/img-002',
    icon: 'pi-image',
  },
  {
    id: 'img-003',
    type: 'imaging',
    title: 'MRI Lumbar Spine – Michael Brown',
    subtitle: 'MRI · Final · 2026-01-20',
    description: 'L4-L5 disc herniation with mild nerve root compression. Degenerative changes.',
    keywords: ['MRI', 'lumbar', 'spine', 'back', 'disc herniation', 'sciatica', 'degenerative disc', 'L4', 'L5', 'nerve'],
    route: '/imaging/img-003',
    icon: 'pi-image',
  },
  {
    id: 'img-004',
    type: 'imaging',
    title: 'Brain CT – Emily Davis',
    subtitle: 'CT · Final · 2026-01-25',
    description: 'Non-contrast CT head. No acute hemorrhage or mass. Normal for age.',
    keywords: ['CT', 'CT scan', 'brain', 'head', 'migraine', 'headache', 'hemorrhage', 'stroke', 'neurology'],
    route: '/imaging/img-004',
    icon: 'pi-image',
  },
];

const SEED_NOTES: SearchableItem[] = [
  {
    id: 'note-001',
    type: 'note',
    title: 'Progress Note – James Wilson',
    subtitle: 'Dr. Smith · 2026-01-15',
    description: 'Patient doing well on lisinopril and metformin. Blood pressure 138/84. A1c improving.',
    keywords: ['progress note', 'SOAP', 'hypertension', 'diabetes', 'lisinopril', 'metformin', 'blood pressure', 'A1c'],
    route: '/encounters/enc-001',
    icon: 'pi-file',
  },
  {
    id: 'note-002',
    type: 'note',
    title: 'Discharge Summary – Robert Chen',
    subtitle: 'Dr. Martinez · 2026-01-28',
    description: 'Admitted for afib with RVR. Rate controlled with metoprolol. Warfarin continued.',
    keywords: ['discharge', 'summary', 'afib', 'atrial fibrillation', 'RVR', 'rate control', 'metoprolol', 'warfarin', 'anticoagulation'],
    route: '/encounters/enc-003',
    icon: 'pi-file',
  },
  {
    id: 'note-003',
    type: 'note',
    title: 'Referral Note – Sarah Johnson',
    subtitle: 'Dr. Lee · 2026-02-10',
    description: 'Referral to endocrinology for hypothyroidism management. TSH 6.2.',
    keywords: ['referral', 'endocrinology', 'hypothyroidism', 'thyroid', 'TSH', 'Hashimoto', 'levothyroxine'],
    route: '/encounters/enc-004',
    icon: 'pi-file',
  },
];

// ---------------------------------------------------------------------------

interface ResultGroup {
  label: string;
  icon: string;
  key: keyof Omit<GroupedSearchResults, 'totalCount'>;
  colorClass: string;
}

const RESULT_GROUPS: ResultGroup[] = [
  { label: 'Patients', icon: 'pi pi-users', key: 'patients', colorClass: 'group-patients' },
  { label: 'Encounters', icon: 'pi pi-file-edit', key: 'encounters', colorClass: 'group-encounters' },
  { label: 'Prescriptions', icon: 'pi pi-box', key: 'prescriptions', colorClass: 'group-prescriptions' },
  { label: 'Lab Results', icon: 'pi pi-chart-bar', key: 'labs', colorClass: 'group-labs' },
  { label: 'Imaging', icon: 'pi pi-image', key: 'imaging', colorClass: 'group-imaging' },
  { label: 'Notes', icon: 'pi pi-file', key: 'notes', colorClass: 'group-notes' },
];

@Component({
  selector: 'emr-global-search',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <!-- Backdrop -->
      <div
        class="search-backdrop"
        (click)="close()"
        role="presentation"
        aria-hidden="true">
      </div>

      <!-- Search panel -->
      <div
        class="search-panel"
        [class.dark]="themeService.isDarkMode()"
        role="dialog"
        aria-modal="true"
        aria-label="Global search">

        <!-- Input row -->
        <div class="search-input-row">
          <i class="pi pi-search search-icon" aria-hidden="true"></i>
          <input
            #searchInput
            type="text"
            class="search-input"
            placeholder="Search patients, medications, conditions, labs..."
            [value]="searchQuery()"
            (input)="onSearchInput($event)"
            (keydown.escape)="close()"
            (keydown.arrowdown)="focusFirstResult()"
            autocomplete="off"
            spellcheck="false"
            aria-label="Search"
            aria-autocomplete="list"
            aria-controls="search-results-list"
          />
          <kbd class="search-esc-hint" aria-label="Press escape to close">ESC</kbd>
        </div>

        <!-- Synonym expansion hint -->
        @if (expandedTerms().length > 1 && searchQuery().length > 1) {
          <div class="search-synonyms" aria-live="polite">
            <i class="pi pi-sparkles" aria-hidden="true"></i>
            <span>Also searching: </span>
            @for (term of expandedTerms().slice(1, 6); track term) {
              <span class="synonym-chip">{{ term }}</span>
            }
            @if (expandedTerms().length > 6) {
              <span class="synonym-more">+{{ expandedTerms().length - 6 }} more</span>
            }
          </div>
        }

        <!-- Loading state -->
        @if (loading()) {
          <div class="search-loading" aria-live="polite" aria-label="Searching...">
            <div class="loading-dots">
              <span></span><span></span><span></span>
            </div>
            <span>Searching...</span>
          </div>
        }

        <!-- Results -->
        @if (!loading() && results() && results()!.totalCount > 0) {
          <div class="search-results" id="search-results-list" role="listbox">
            @for (group of resultGroups; track group.key) {
              @if (getGroupResults(group.key).length > 0) {
                <div class="result-group" role="group" [attr.aria-label]="group.label">
                  <div class="group-header" [class]="group.colorClass">
                    <i [class]="group.icon" aria-hidden="true"></i>
                    <span>{{ group.label }}</span>
                    <span class="group-count">{{ getGroupResults(group.key).length }}</span>
                  </div>
                  @for (result of getGroupResults(group.key); track result.item.id; let i = $index) {
                    <button
                      class="result-item"
                      role="option"
                      [attr.aria-selected]="focusedIndex() === getFlatIndex(group.key, i)"
                      [class.focused]="focusedIndex() === getFlatIndex(group.key, i)"
                      (click)="navigateTo(result)"
                      (mouseenter)="setFocusedIndex(getFlatIndex(group.key, i))"
                      (keydown.enter)="navigateTo(result)"
                      (keydown.arrowdown)="moveFocus(1)"
                      (keydown.arrowup)="moveFocus(-1)"
                      (keydown.escape)="close()">
                      <div class="result-icon-wrapper" [class]="group.colorClass">
                        <i [class]="'pi ' + (result.item.icon ?? 'pi-file')" aria-hidden="true"></i>
                      </div>
                      <div class="result-info">
                        <span class="result-title">{{ result.item.title }}</span>
                        @if (result.item.subtitle) {
                          <span class="result-subtitle">{{ result.item.subtitle }}</span>
                        }
                      </div>
                      <span class="result-type-badge" [class]="group.colorClass">
                        {{ group.label.slice(0, -1) }}
                      </span>
                      <i class="pi pi-arrow-right result-arrow" aria-hidden="true"></i>
                    </button>
                  }
                </div>
              }
            }
          </div>
        }

        <!-- Empty / no-results state -->
        @if (!loading() && searchQuery().length >= 2 && results()?.totalCount === 0) {
          <div class="search-empty" role="status" aria-live="polite">
            <i class="pi pi-search-minus empty-icon" aria-hidden="true"></i>
            <p class="empty-title">No results for "{{ searchQuery() }}"</p>
            <p class="empty-hint">
              Try using medical abbreviations (HTN, DM, CHF) or common names (heart attack, sugar disease).
            </p>
          </div>
        }

        <!-- Idle / initial state -->
        @if (!loading() && searchQuery().length < 2) {
          <div class="search-idle" role="status">
            <div class="quick-actions-label">Quick navigation</div>
            <div class="quick-actions">
              @for (action of quickActions; track action.label) {
                <button class="quick-action-chip" (click)="navigateQuick(action.route)">
                  <i [class]="'pi ' + action.icon" aria-hidden="true"></i>
                  {{ action.label }}
                </button>
              }
            </div>
            <div class="search-tips">
              <span class="tip-icon">
                <i class="pi pi-info-circle" aria-hidden="true"></i>
              </span>
              <span>Use medical abbreviations: HTN, DM, CHF, COPD, MI, SOB...</span>
            </div>
          </div>
        }

        <!-- Footer -->
        <div class="search-footer">
          <span class="footer-hint">
            <kbd>↑↓</kbd> navigate
            <kbd>↵</kbd> select
            <kbd>ESC</kbd> close
            <kbd>Ctrl K</kbd> open
          </span>
          @if (results()?.totalCount) {
            <span class="footer-count">{{ results()!.totalCount }} result{{ results()!.totalCount !== 1 ? 's' : '' }}</span>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    /* Backdrop */
    .search-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      z-index: 1000;
      animation: fadeIn 150ms ease;
    }

    /* Panel */
    .search-panel {
      position: fixed;
      top: 10vh;
      left: 50%;
      transform: translateX(-50%);
      width: min(680px, calc(100vw - 2rem));
      max-height: 80vh;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
      z-index: 1001;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: slideDown 200ms cubic-bezier(0.35, 0, 0.25, 1);
    }

    .search-panel.dark {
      background: #1e293b;
      border-color: #334155;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05);
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    @keyframes slideDown {
      from { opacity: 0; transform: translateX(-50%) translateY(-12px) scale(0.98); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0)     scale(1); }
    }

    /* Input row */
    .search-input-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .dark .search-input-row {
      border-bottom-color: #334155;
    }

    .search-icon {
      font-size: 1.125rem;
      color: #94a3b8;
      flex-shrink: 0;
    }

    .search-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-size: 1rem;
      color: #0f172a;
      line-height: 1.5;
    }

    .dark .search-input {
      color: #f1f5f9;
    }

    .search-input::placeholder {
      color: #94a3b8;
    }

    .search-esc-hint {
      flex-shrink: 0;
      font-family: inherit;
      font-size: 0.6875rem;
      font-weight: 500;
      color: #64748b;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 0.25rem;
      padding: 0.125rem 0.375rem;
    }

    .dark .search-esc-hint {
      color: #94a3b8;
      background: #334155;
      border-color: #475569;
    }

    /* Synonym expansion */
    .search-synonyms {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.375rem;
      padding: 0.5rem 1.25rem;
      font-size: 0.75rem;
      color: #64748b;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }

    .dark .search-synonyms {
      background: #0f172a;
      border-bottom-color: #334155;
      color: #94a3b8;
    }

    .search-synonyms .pi-sparkles {
      color: #8b5cf6;
      font-size: 0.875rem;
    }

    .synonym-chip {
      background: #ede9fe;
      color: #7c3aed;
      padding: 0.125rem 0.5rem;
      border-radius: 999px;
      font-weight: 500;
    }

    .dark .synonym-chip {
      background: #2e1065;
      color: #a78bfa;
    }

    .synonym-more {
      color: #94a3b8;
      font-style: italic;
    }

    /* Loading */
    .search-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 2rem;
      color: #64748b;
      font-size: 0.875rem;
    }

    .loading-dots {
      display: flex;
      gap: 0.25rem;
    }

    .loading-dots span {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #3b82f6;
      animation: bounce 0.8s ease-in-out infinite;
    }

    .loading-dots span:nth-child(2) { animation-delay: 0.15s; }
    .loading-dots span:nth-child(3) { animation-delay: 0.3s; }

    @keyframes bounce {
      0%, 80%, 100% { transform: translateY(0); }
      40%            { transform: translateY(-6px); }
    }

    /* Results container */
    .search-results {
      overflow-y: auto;
      flex: 1;
      max-height: calc(80vh - 180px);
    }

    /* Result group */
    .result-group {
      padding: 0.5rem 0;
    }

    .result-group + .result-group {
      border-top: 1px solid #f1f5f9;
    }

    .dark .result-group + .result-group {
      border-top-color: #334155;
    }

    .group-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 1.25rem;
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #64748b;
    }

    .group-count {
      margin-left: auto;
      background: #f1f5f9;
      color: #64748b;
      font-size: 0.6875rem;
      font-weight: 600;
      padding: 0.0625rem 0.4rem;
      border-radius: 999px;
    }

    .dark .group-count {
      background: #334155;
      color: #94a3b8;
    }

    /* Color theming per group */
    .group-patients      { color: #2563eb; }
    .group-encounters    { color: #059669; }
    .group-prescriptions { color: #d97706; }
    .group-labs          { color: #7c3aed; }
    .group-imaging       { color: #0891b2; }
    .group-notes         { color: #db2777; }

    /* Result item */
    .result-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.625rem 1.25rem;
      border: none;
      background: transparent;
      cursor: pointer;
      text-align: left;
      transition: background 0.1s ease;
    }

    .result-item:hover,
    .result-item.focused {
      background: #f8fafc;
    }

    .dark .result-item:hover,
    .dark .result-item.focused {
      background: #334155;
    }

    .result-icon-wrapper {
      width: 2rem;
      height: 2rem;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 0.875rem;
    }

    .result-icon-wrapper.group-patients      { background: #dbeafe; }
    .result-icon-wrapper.group-encounters    { background: #d1fae5; }
    .result-icon-wrapper.group-prescriptions { background: #fef3c7; }
    .result-icon-wrapper.group-labs          { background: #ede9fe; }
    .result-icon-wrapper.group-imaging       { background: #cffafe; }
    .result-icon-wrapper.group-notes         { background: #fce7f3; }

    .dark .result-icon-wrapper.group-patients      { background: #1e3a8a; }
    .dark .result-icon-wrapper.group-encounters    { background: #064e3b; }
    .dark .result-icon-wrapper.group-prescriptions { background: #451a03; }
    .dark .result-icon-wrapper.group-labs          { background: #2e1065; }
    .dark .result-icon-wrapper.group-imaging       { background: #083344; }
    .dark .result-icon-wrapper.group-notes         { background: #500724; }

    .result-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      overflow: hidden;
    }

    .result-title {
      font-size: 0.875rem;
      font-weight: 500;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .dark .result-title {
      color: #f1f5f9;
    }

    .result-subtitle {
      font-size: 0.75rem;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .dark .result-subtitle {
      color: #94a3b8;
    }

    .result-type-badge {
      flex-shrink: 0;
      font-size: 0.6875rem;
      font-weight: 600;
      padding: 0.125rem 0.5rem;
      border-radius: 999px;
      background: #f1f5f9;
    }

    .dark .result-type-badge {
      background: #334155;
    }

    .result-arrow {
      color: #cbd5e1;
      font-size: 0.75rem;
      flex-shrink: 0;
    }

    /* Empty state */
    .search-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 2rem;
      text-align: center;
      gap: 0.75rem;
    }

    .empty-icon {
      font-size: 2.5rem;
      color: #cbd5e1;
    }

    .empty-title {
      font-size: 1rem;
      font-weight: 500;
      color: #475569;
      margin: 0;
    }

    .dark .empty-title {
      color: #94a3b8;
    }

    .empty-hint {
      font-size: 0.8125rem;
      color: #94a3b8;
      margin: 0;
      max-width: 380px;
    }

    /* Idle state */
    .search-idle {
      padding: 1rem 1.25rem 1.5rem;
    }

    .quick-actions-label {
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #94a3b8;
      margin-bottom: 0.75rem;
    }

    .quick-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .quick-action-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.8125rem;
      color: #475569;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .quick-action-chip:hover {
      background: #e2e8f0;
      color: #1e293b;
      border-color: #cbd5e1;
    }

    .dark .quick-action-chip {
      background: #334155;
      border-color: #475569;
      color: #94a3b8;
    }

    .dark .quick-action-chip:hover {
      background: #475569;
      color: #f1f5f9;
    }

    .search-tips {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: #94a3b8;
      padding: 0.625rem 0.75rem;
      background: #f8fafc;
      border-radius: 0.5rem;
    }

    .dark .search-tips {
      background: #0f172a;
      color: #475569;
    }

    .tip-icon {
      color: #3b82f6;
      font-size: 0.875rem;
    }

    /* Footer */
    .search-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.625rem 1.25rem;
      border-top: 1px solid #e2e8f0;
      background: #f8fafc;
    }

    .dark .search-footer {
      border-top-color: #334155;
      background: #0f172a;
    }

    .footer-hint {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.6875rem;
      color: #94a3b8;
    }

    .footer-hint kbd {
      font-family: inherit;
      font-size: 0.6875rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.25rem;
      padding: 0.0625rem 0.3125rem;
      color: #64748b;
    }

    .dark .footer-hint kbd {
      background: #1e293b;
      border-color: #334155;
      color: #94a3b8;
    }

    .footer-count {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 500;
    }
  `],
})
export class GlobalSearchComponent implements OnInit, OnDestroy {
  private readonly searchService = inject(SemanticSearchService);
  private readonly router = inject(Router);
  readonly themeService = inject(ThemeService);

  // ------- Signals -------
  readonly isOpen = signal(false);
  readonly searchQuery = signal('');
  readonly results = signal<GroupedSearchResults | null>(null);
  readonly expandedTerms = signal<string[]>([]);
  readonly loading = signal(false);
  readonly focusedIndex = signal(-1);

  @ViewChild('searchInput') private searchInputRef!: ElementRef<HTMLInputElement>;

  // RxJS debounce bridge
  private readonly searchSubject = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  // Static config
  readonly resultGroups = RESULT_GROUPS;

  readonly quickActions = [
    { label: 'Patients', icon: 'pi-users', route: '/patients' },
    { label: 'Appointments', icon: 'pi-calendar', route: '/appointments' },
    { label: 'Labs', icon: 'pi-chart-bar', route: '/labs' },
    { label: 'Imaging', icon: 'pi-image', route: '/imaging' },
    { label: 'Prescriptions', icon: 'pi-box', route: '/prescriptions' },
    { label: 'Encounters', icon: 'pi-file-edit', route: '/encounters' },
  ];

  // Flat result list for keyboard navigation, computed on demand
  private get flatResults(): SearchResult[] {
    const r = this.results();
    if (!r) return [];
    return RESULT_GROUPS.flatMap(g => this.getGroupResults(g.key));
  }

  ngOnInit(): void {
    // Register seed data so search works immediately
    this.searchService.registerItems([
      ...SEED_PATIENTS,
      ...SEED_ENCOUNTERS,
      ...SEED_PRESCRIPTIONS,
      ...SEED_LABS,
      ...SEED_IMAGING,
      ...SEED_NOTES,
    ]);

    // Debounced search pipeline
    this.searchSubject.pipe(
      debounceTime(280),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(query => {
      this.performSearch(query);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ------- Keyboard shortcut -------
  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    // Ctrl+K or Cmd+K
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      this.isOpen() ? this.close() : this.open();
      return;
    }

    if (!this.isOpen()) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    }
  }

  // ------- Open / close -------
  open(): void {
    this.isOpen.set(true);
    // Focus the input on next tick so the element is in the DOM
    setTimeout(() => this.searchInputRef?.nativeElement?.focus(), 50);
  }

  close(): void {
    this.isOpen.set(false);
    this.searchQuery.set('');
    this.results.set(null);
    this.expandedTerms.set([]);
    this.focusedIndex.set(-1);
  }

  // ------- Input handling -------
  onSearchInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.searchQuery.set(query);
    this.focusedIndex.set(-1);

    if (query.trim().length < 2) {
      this.results.set(null);
      this.expandedTerms.set([]);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.searchSubject.next(query.trim());
  }

  private performSearch(query: string): void {
    const expanded = this.searchService.expandQuery(query);
    this.expandedTerms.set(expanded);

    const grouped = this.searchService.search(query, 25);
    this.results.set(grouped);
    this.loading.set(false);
  }

  // ------- Navigation -------
  navigateTo(result: SearchResult): void {
    if (result.item.route) {
      this.router.navigate([result.item.route]);
    }
    this.close();
  }

  navigateQuick(route: string): void {
    this.router.navigate([route]);
    this.close();
  }

  // ------- Keyboard focus helpers -------
  focusFirstResult(): void {
    if (this.flatResults.length > 0) {
      this.focusedIndex.set(0);
    }
  }

  setFocusedIndex(idx: number): void {
    this.focusedIndex.set(idx);
  }

  moveFocus(delta: number): void {
    const max = this.flatResults.length - 1;
    const next = Math.max(0, Math.min(max, this.focusedIndex() + delta));
    this.focusedIndex.set(next);
  }

  // ------- Helpers for template -------
  getGroupResults(key: keyof Omit<GroupedSearchResults, 'totalCount'>): SearchResult[] {
    return this.results()?.[key] ?? [];
  }

  /**
   * Returns the flat index of a result within the rendered list for keyboard
   * navigation tracking. Each group's items are offset by the accumulated
   * length of all previous groups.
   */
  getFlatIndex(key: keyof Omit<GroupedSearchResults, 'totalCount'>, itemIndex: number): number {
    let offset = 0;
    for (const group of RESULT_GROUPS) {
      if (group.key === key) return offset + itemIndex;
      offset += this.getGroupResults(group.key).length;
    }
    return itemIndex;
  }
}
