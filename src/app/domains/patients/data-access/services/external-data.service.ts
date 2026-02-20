import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, map } from 'rxjs';
import {
  ExternalDataRecord,
  ReviewStatus,
} from '../models/external-data.model';
import { MOCK_EXTERNAL_DATA } from './mock-data/external-data.mock';

const USE_MOCK = true;
const MOCK_DELAY = 300;

@Injectable({ providedIn: 'root' })
export class ExternalDataService {
  private mockRecords: ExternalDataRecord[] = [...MOCK_EXTERNAL_DATA];

  constructor(private http: HttpClient) {}

  getExternalData(patientId: string): Observable<ExternalDataRecord[]> {
    if (USE_MOCK) {
      const records = this.mockRecords.filter(
        (r) => r.patientId === patientId
      );
      return of(records).pipe(delay(MOCK_DELAY));
    }
    return this.http.get<ExternalDataRecord[]>(
      `/api/patients/${patientId}/external-data`
    );
  }

  getExternalRecord(
    recordId: string
  ): Observable<ExternalDataRecord | undefined> {
    if (USE_MOCK) {
      return of(this.mockRecords.find((r) => r.id === recordId)).pipe(
        delay(MOCK_DELAY)
      );
    }
    return this.http.get<ExternalDataRecord>(
      `/api/external-data/${recordId}`
    );
  }

  updateReviewStatus(
    recordId: string,
    status: ReviewStatus,
    notes?: string
  ): Observable<ExternalDataRecord> {
    if (USE_MOCK) {
      const idx = this.mockRecords.findIndex((r) => r.id === recordId);
      if (idx >= 0) {
        const updated: ExternalDataRecord = {
          ...this.mockRecords[idx],
          reviewStatus: status,
          reviewedBy: 'USR-001',
          reviewedByName: 'Dr. Sarah Chen',
          reviewedAt: new Date().toISOString(),
          ...(notes !== undefined && { reviewNotes: notes }),
        };
        this.mockRecords[idx] = updated;
        return of(updated).pipe(delay(MOCK_DELAY));
      }
    }
    return this.http.patch<ExternalDataRecord>(
      `/api/external-data/${recordId}/review`,
      { status, notes }
    );
  }

  getUnreviewedCount(patientId: string): Observable<number> {
    if (USE_MOCK) {
      const count = this.mockRecords.filter(
        (r) => r.patientId === patientId && r.reviewStatus === 'unreviewed'
      ).length;
      return of(count).pipe(delay(MOCK_DELAY));
    }
    return this.http
      .get<{ count: number }>(
        `/api/patients/${patientId}/external-data/unreviewed-count`
      )
      .pipe(map((res) => res.count));
  }

  dismissRecord(
    recordId: string,
    reason: string
  ): Observable<ExternalDataRecord> {
    if (USE_MOCK) {
      const idx = this.mockRecords.findIndex((r) => r.id === recordId);
      if (idx >= 0) {
        const updated: ExternalDataRecord = {
          ...this.mockRecords[idx],
          reviewStatus: 'dismissed',
          reviewedBy: 'USR-001',
          reviewedByName: 'Dr. Sarah Chen',
          reviewedAt: new Date().toISOString(),
          reviewNotes: reason,
        };
        this.mockRecords[idx] = updated;
        return of(updated).pipe(delay(MOCK_DELAY));
      }
    }
    return this.http.patch<ExternalDataRecord>(
      `/api/external-data/${recordId}/dismiss`,
      { reason }
    );
  }

  updateDiscrepancyNotes(
    recordId: string,
    notes: string
  ): Observable<ExternalDataRecord> {
    if (USE_MOCK) {
      const idx = this.mockRecords.findIndex((r) => r.id === recordId);
      if (idx >= 0) {
        const updated: ExternalDataRecord = {
          ...this.mockRecords[idx],
          discrepancyNotes: notes,
        };
        this.mockRecords[idx] = updated;
        return of(updated).pipe(delay(MOCK_DELAY));
      }
    }
    return this.http.patch<ExternalDataRecord>(
      `/api/external-data/${recordId}/discrepancy`,
      { notes }
    );
  }
}
