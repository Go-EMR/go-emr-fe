import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { 
  Patient, 
  PatientSummary, 
  PatientSearchParams, 
  PatientSearchResult,
  CreatePatientDto,
  UpdatePatientDto,
  PatientHeader 
} from '../models/patient.model';
import { MOCK_PATIENTS, MOCK_PATIENT_SUMMARIES } from './mock-data/patients.mock';

/**
 * Patient service for CRUD operations
 * Currently uses mock data, will be replaced with actual API calls
 */
@Injectable({
  providedIn: 'root',
})
export class PatientService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/patients`;
  
  // Flag to use mock data during development
  private readonly useMock = true;
  
  /**
   * Search patients with pagination and filters
   */
  searchPatients(params: PatientSearchParams): Observable<PatientSearchResult> {
    if (this.useMock) {
      return this.mockSearch(params);
    }
    
    const httpParams = this.buildHttpParams(params);
    return this.http.get<PatientSearchResult>(this.API_URL, { params: httpParams });
  }
  
  /**
   * Get patient by ID
   */
  getPatient(id: string): Observable<Patient> {
    if (this.useMock) {
      const patient = MOCK_PATIENTS.find(p => p.id === id);
      if (!patient) {
        throw new Error('Patient not found');
      }
      return of(patient).pipe(delay(300));
    }
    
    return this.http.get<Patient>(`${this.API_URL}/${id}`);
  }
  
  /**
   * Get patient header info (for top-of-chart display)
   */
  getPatientHeader(id: string): Observable<PatientHeader> {
    if (this.useMock) {
      const patient = MOCK_PATIENTS.find(p => p.id === id);
      if (!patient) {
        throw new Error('Patient not found');
      }
      const header: PatientHeader = {
        id: patient.id,
        mrn: patient.mrn,
        fullName: `${patient.firstName} ${patient.lastName}`,
        dateOfBirth: patient.dateOfBirth,
        age: this.calculateAge(patient.dateOfBirth),
        gender: patient.gender,
        allergies: patient.allergies?.map(a => a.allergen) || [],
        alerts: patient.problems?.filter(p => p.severity === 'severe').map(p => p.description) || [],
        photoUrl: patient.photoUrl,
      };
      return of(header).pipe(delay(200));
    }
    
    return this.http.get<PatientHeader>(`${this.API_URL}/${id}/header`);
  }
  
  /**
   * Get patient summaries (for list views)
   */
  getPatientSummaries(ids: string[]): Observable<PatientSummary[]> {
    if (this.useMock) {
      const summaries = MOCK_PATIENT_SUMMARIES.filter(p => ids.includes(p.id));
      return of(summaries).pipe(delay(200));
    }
    
    return this.http.post<PatientSummary[]>(`${this.API_URL}/summaries`, { ids });
  }
  
  /**
   * Create new patient
   */
  createPatient(data: CreatePatientDto): Observable<Patient> {
    if (this.useMock) {
      const newPatient: Patient = {
        id: `pat-${Date.now()}`,
        mrn: `MRN${String(Date.now()).slice(-8)}`,
        status: 'active',
        preferredContactMethod: data.preferredContactMethod ?? 'phone',
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        consentStatus: {
          hipaaConsent: false,
          treatmentConsent: false,
          marketingConsent: false,
          portalConsent: false,
        },
      };
      MOCK_PATIENTS.push(newPatient);
      return of(newPatient).pipe(delay(500));
    }
    
    return this.http.post<Patient>(this.API_URL, data);
  }
  
  /**
   * Update patient
   */
  updatePatient(id: string, data: UpdatePatientDto): Observable<Patient> {
    if (this.useMock) {
      const index = MOCK_PATIENTS.findIndex(p => p.id === id);
      if (index === -1) {
        throw new Error('Patient not found');
      }
      MOCK_PATIENTS[index] = {
        ...MOCK_PATIENTS[index],
        ...data,
        updatedAt: new Date(),
      };
      return of(MOCK_PATIENTS[index]).pipe(delay(500));
    }
    
    return this.http.patch<Patient>(`${this.API_URL}/${id}`, data);
  }
  
  /**
   * Delete patient (archive)
   */
  deletePatient(id: string): Observable<void> {
    if (this.useMock) {
      const index = MOCK_PATIENTS.findIndex(p => p.id === id);
      if (index !== -1) {
        MOCK_PATIENTS[index].status = 'archived';
      }
      return of(void 0).pipe(delay(300));
    }
    
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
  
  /**
   * Get recent patients (for quick access)
   */
  getRecentPatients(limit: number = 10): Observable<PatientSummary[]> {
    if (this.useMock) {
      const recent = [...MOCK_PATIENT_SUMMARIES]
        .sort((a, b) => (b.lastVisit?.getTime() || 0) - (a.lastVisit?.getTime() || 0))
        .slice(0, limit);
      return of(recent).pipe(delay(200));
    }
    
    return this.http.get<PatientSummary[]>(`${this.API_URL}/recent`, {
      params: { limit: limit.toString() },
    });
  }
  
  // Private methods
  
  private mockSearch(params: PatientSearchParams): Observable<PatientSearchResult> {
    let filtered = [...MOCK_PATIENT_SUMMARIES];
    
    // Apply filters
    if (params.query) {
      const query = params.query.toLowerCase();
      filtered = filtered.filter(p =>
        p.fullName.toLowerCase().includes(query) ||
        p.mrn.toLowerCase().includes(query)
      );
    }
    
    if (params.status) {
      filtered = filtered.filter(p => p.status === params.status);
    }
    
    // Sort
    const sortBy = params.sortBy || 'fullName';
    const sortOrder = params.sortOrder || 'asc';
    filtered.sort((a, b) => {
      const aVal = (a as any)[sortBy];
      const bVal = (b as any)[sortBy];
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    // Paginate
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const total = filtered.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedPatients = filtered.slice(startIndex, startIndex + pageSize);
    
    // Map summaries to full patient objects (for mock)
    const patients = paginatedPatients.map(summary => {
      const patient = MOCK_PATIENTS.find(p => p.id === summary.id);
      return patient || this.summaryToPatient(summary);
    });
    
    return of({
      patients,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }).pipe(delay(400));
  }
  
  private buildHttpParams(params: PatientSearchParams): HttpParams {
    let httpParams = new HttpParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });
    
    return httpParams;
  }
  
  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
  
  private summaryToPatient(summary: PatientSummary): Patient {
    const [firstName, ...rest] = summary.fullName.split(' ');
    const lastName = rest.join(' ');
    
    return {
      id: summary.id,
      mrn: summary.mrn,
      status: summary.status,
      firstName,
      lastName,
      dateOfBirth: summary.dateOfBirth,
      gender: summary.gender,
      phone: summary.phone,
      preferredContactMethod: 'phone',
      facilityId: 'fac-001',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastVisit: summary.lastVisit,
      consentStatus: {
        hipaaConsent: true,
        treatmentConsent: true,
        marketingConsent: false,
        portalConsent: false,
      },
      photoUrl: summary.photoUrl,
    };
  }
}
