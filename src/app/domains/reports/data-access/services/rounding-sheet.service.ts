import { Injectable, signal, computed } from '@angular/core';
import { Observable, of, throwError, delay } from 'rxjs';
import { RoundingSheet, RoundingSheetTemplate } from '../models/rounding-sheet.model';
import {
  MOCK_ROUNDING_SHEET_TEMPLATES,
  MOCK_ROUNDING_SHEETS,
} from './mock-data/rounding-sheets.mock';

const USE_MOCK = true;
const MOCK_DELAY = 300;

@Injectable({ providedIn: 'root' })
export class RoundingSheetService {
  // ─── Internal state ─────────────────────────────────────────────────────────

  private templates = signal<RoundingSheetTemplate[]>([...MOCK_ROUNDING_SHEET_TEMPLATES]);
  private sheets = signal<RoundingSheet[]>([...MOCK_ROUNDING_SHEETS]);

  // ─── Computed convenience views ──────────────────────────────────────────────

  readonly activeSheets = computed(() =>
    this.sheets().filter(s => s.status === 'in-progress' || s.status === 'draft')
  );

  readonly completedSheets = computed(() =>
    this.sheets().filter(s => s.status === 'completed')
  );

  readonly defaultTemplates = computed(() =>
    this.templates().filter(t => t.isDefault)
  );

  readonly sharedTemplates = computed(() =>
    this.templates().filter(t => t.isShared)
  );

  // ─── Template CRUD ───────────────────────────────────────────────────────────

  getTemplates(): Observable<RoundingSheetTemplate[]> {
    return of(this.templates()).pipe(delay(MOCK_DELAY));
  }

  getTemplate(id: string): Observable<RoundingSheetTemplate | undefined> {
    return of(this.templates().find(t => t.id === id)).pipe(delay(MOCK_DELAY));
  }

  createTemplate(partial: Partial<RoundingSheetTemplate>): Observable<RoundingSheetTemplate> {
    const now = new Date().toISOString();
    const newTemplate: RoundingSheetTemplate = {
      id: `TPL-${Date.now()}`,
      name: partial.name ?? 'Untitled Template',
      description: partial.description ?? '',
      sections: partial.sections ?? [],
      createdBy: 'USR-CURRENT',
      createdByName: 'Current User',
      createdAt: now,
      updatedAt: now,
      isShared: partial.isShared ?? false,
      isDefault: false,
      specialty: partial.specialty,
      tags: partial.tags ?? [],
      useCount: 0,
      ...partial,
    };
    this.templates.update(ts => [...ts, newTemplate]);
    return of(newTemplate).pipe(delay(MOCK_DELAY));
  }

  updateTemplate(
    id: string,
    updates: Partial<RoundingSheetTemplate>
  ): Observable<RoundingSheetTemplate> {
    const existing = this.templates().find(t => t.id === id);
    if (!existing) {
      return throwError(() => new Error(`Template ${id} not found`));
    }
    const updated: RoundingSheetTemplate = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.templates.update(ts => ts.map(t => (t.id === id ? updated : t)));
    return of(updated).pipe(delay(MOCK_DELAY));
  }

  deleteTemplate(id: string): Observable<void> {
    this.templates.update(ts => ts.filter(t => t.id !== id));
    return of(undefined).pipe(delay(MOCK_DELAY));
  }

  cloneTemplate(id: string): Observable<RoundingSheetTemplate> {
    const source = this.templates().find(t => t.id === id);
    if (!source) {
      return throwError(() => new Error(`Template ${id} not found`));
    }
    const now = new Date().toISOString();
    const clone: RoundingSheetTemplate = {
      ...source,
      id: `TPL-${Date.now()}`,
      name: `${source.name} (Copy)`,
      isDefault: false,
      isShared: false,
      useCount: 0,
      createdAt: now,
      updatedAt: now,
      lastUsedAt: undefined,
    };
    this.templates.update(ts => [...ts, clone]);
    return of(clone).pipe(delay(MOCK_DELAY));
  }

  // ─── Sheet CRUD ──────────────────────────────────────────────────────────────

  getSheets(): Observable<RoundingSheet[]> {
    return of(this.sheets()).pipe(delay(MOCK_DELAY));
  }

  getSheet(id: string): Observable<RoundingSheet | undefined> {
    return of(this.sheets().find(s => s.id === id)).pipe(delay(MOCK_DELAY));
  }

  createSheet(
    templateId: string,
    date: string,
    shift: 'day' | 'evening' | 'night',
    unit: string
  ): Observable<RoundingSheet> {
    const template = this.templates().find(t => t.id === templateId);
    if (!template) {
      return throwError(() => new Error(`Template ${templateId} not found`));
    }
    const now = new Date().toISOString();
    const newSheet: RoundingSheet = {
      id: `SHEET-${Date.now()}`,
      templateId,
      templateName: template.name,
      date,
      shift,
      unit,
      patients: [],
      createdBy: 'USR-CURRENT',
      createdByName: 'Current User',
      createdAt: now,
      updatedAt: now,
      status: 'draft',
    };
    this.sheets.update(ss => [...ss, newSheet]);
    // Increment use count on template
    this.templates.update(ts =>
      ts.map(t =>
        t.id === templateId
          ? { ...t, useCount: t.useCount + 1, lastUsedAt: now }
          : t
      )
    );
    return of(newSheet).pipe(delay(MOCK_DELAY));
  }

  updateSheet(id: string, updates: Partial<RoundingSheet>): Observable<RoundingSheet> {
    const existing = this.sheets().find(s => s.id === id);
    if (!existing) {
      return throwError(() => new Error(`Sheet ${id} not found`));
    }
    const updated: RoundingSheet = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.sheets.update(ss => ss.map(s => (s.id === id ? updated : s)));
    return of(updated).pipe(delay(MOCK_DELAY));
  }

  completeSheet(id: string): Observable<RoundingSheet> {
    return this.updateSheet(id, { status: 'completed' });
  }

  deleteSheet(id: string): Observable<void> {
    this.sheets.update(ss => ss.filter(s => s.id !== id));
    return of(undefined).pipe(delay(MOCK_DELAY));
  }

  // ─── Batch operations ────────────────────────────────────────────────────────

  addPatientsToSheet(
    sheetId: string,
    patients: Array<{
      patientId: string;
      patientName: string;
      room: string;
      mrn: string;
      admitDate: string;
      attendingPhysician: string;
      diagnosis: string;
    }>
  ): Observable<RoundingSheet> {
    const sheet = this.sheets().find(s => s.id === sheetId);
    if (!sheet) {
      return throwError(() => new Error(`Sheet ${sheetId} not found`));
    }
    const newPatients = patients.map(p => ({
      ...p,
      entries: [],
    }));
    return this.updateSheet(sheetId, {
      patients: [...sheet.patients, ...newPatients],
      status: sheet.status === 'draft' ? 'in-progress' : sheet.status,
    });
  }

  // ─── Export ──────────────────────────────────────────────────────────────────

  exportToPdf(sheetId: string): Observable<Blob> {
    // Mock: returns empty blob; real implementation would call a PDF endpoint
    const blob = new Blob([''], { type: 'application/pdf' });
    return of(blob).pipe(delay(800));
  }
}
