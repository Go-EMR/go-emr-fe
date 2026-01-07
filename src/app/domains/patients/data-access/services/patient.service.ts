import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { 
  Patient, 
  PatientSearchParams, 
  PatientSearchResult, 
  CreatePatientDto, 
  UpdatePatientDto,
  FamilyRelation,
  PatientSummary
} from '../models/patient.model';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/patients';

  // Mock data for development
  private mockPatients: Patient[] = [
    {
      id: '1',
      mrn: 'MRN-001',
      status: 'active',
      firstName: 'John',
      lastName: 'Smith',
      dateOfBirth: new Date('1985-03-15'),
      gender: 'male',
      email: 'john.smith@email.com',
      phone: '555-0101',
      preferredContactMethod: 'phone',
      facilityId: 'FAC-001',
      createdAt: new Date(),
      updatedAt: new Date(),
      consentStatus: {
        hipaaConsent: true,
        treatmentConsent: true,
        marketingConsent: false,
        portalConsent: true
      }
    },
    {
      id: '2',
      mrn: 'MRN-002',
      status: 'active',
      firstName: 'Sarah',
      lastName: 'Johnson',
      dateOfBirth: new Date('1990-07-22'),
      gender: 'female',
      email: 'sarah.j@email.com',
      phone: '555-0102',
      preferredContactMethod: 'email',
      facilityId: 'FAC-001',
      createdAt: new Date(),
      updatedAt: new Date(),
      consentStatus: {
        hipaaConsent: true,
        treatmentConsent: true,
        marketingConsent: true,
        portalConsent: true
      }
    },
    {
      id: '3',
      mrn: 'MRN-003',
      status: 'active',
      firstName: 'Michael',
      lastName: 'Williams',
      dateOfBirth: new Date('1978-11-08'),
      gender: 'male',
      email: 'mwilliams@email.com',
      phone: '555-0103',
      preferredContactMethod: 'portal',
      facilityId: 'FAC-002',
      createdAt: new Date(),
      updatedAt: new Date(),
      consentStatus: {
        hipaaConsent: true,
        treatmentConsent: true,
        marketingConsent: false,
        portalConsent: true
      }
    }
  ];

  /**
   * Search patients with optional filters
   */
  searchPatients(params: PatientSearchParams): Observable<PatientSearchResult> {
    let filtered = [...this.mockPatients];

    if (params.query) {
      const query = params.query.toLowerCase();
      filtered = filtered.filter(p => 
        p.firstName.toLowerCase().includes(query) ||
        p.lastName.toLowerCase().includes(query) ||
        p.mrn.toLowerCase().includes(query) ||
        (p.email && p.email.toLowerCase().includes(query)) ||
        (p.phone && p.phone.includes(query))
      );
    }

    if (params.status) {
      filtered = filtered.filter(p => p.status === params.status);
    }

    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const start = (page - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);

    return of({
      patients: paged,
      total: filtered.length,
      page,
      pageSize,
      totalPages: Math.ceil(filtered.length / pageSize)
    }).pipe(delay(300));
  }

  /**
   * Get patient by ID
   */
  getPatient(id: string): Observable<Patient | undefined> {
    const patient = this.mockPatients.find(p => p.id === id);
    return of(patient).pipe(delay(200));
  }

  /**
   * Get patient by MRN
   */
  getPatientByMrn(mrn: string): Observable<Patient | undefined> {
    const patient = this.mockPatients.find(p => p.mrn === mrn);
    return of(patient).pipe(delay(200));
  }

  /**
   * Create new patient
   */
  createPatient(dto: CreatePatientDto): Observable<Patient> {
    const newPatient: Patient = {
      id: `${Date.now()}`,
      mrn: `MRN-${String(this.mockPatients.length + 1).padStart(3, '0')}`,
      status: 'active',
      firstName: dto.firstName,
      middleName: dto.middleName,
      lastName: dto.lastName,
      dateOfBirth: dto.dateOfBirth,
      gender: dto.gender,
      ssn: dto.ssn,
      email: dto.email,
      phone: dto.phone,
      mobilePhone: dto.mobilePhone,
      preferredContactMethod: dto.preferredContactMethod || 'phone',
      address: dto.address,
      emergencyContact: dto.emergencyContact,
      primaryProviderId: dto.primaryProviderId,
      facilityId: dto.facilityId,
      clinicId: dto.clinicId,
      maritalStatus: dto.maritalStatus,
      bloodGroup: dto.bloodGroup,
      createdAt: new Date(),
      updatedAt: new Date(),
      consentStatus: {
        hipaaConsent: false,
        treatmentConsent: false,
        marketingConsent: false,
        portalConsent: false
      }
    };
    this.mockPatients.push(newPatient);
    return of(newPatient).pipe(delay(500));
  }

  /**
   * Update patient
   */
  updatePatient(id: string, dto: UpdatePatientDto): Observable<Patient> {
    const index = this.mockPatients.findIndex(p => p.id === id);
    if (index >= 0) {
      const existing = this.mockPatients[index];
      const updated: Patient = {
        ...existing,
        firstName: dto.firstName ?? existing.firstName,
        middleName: dto.middleName ?? existing.middleName,
        lastName: dto.lastName ?? existing.lastName,
        dateOfBirth: dto.dateOfBirth ?? existing.dateOfBirth,
        gender: dto.gender ?? existing.gender,
        ssn: dto.ssn ?? existing.ssn,
        email: dto.email ?? existing.email,
        phone: dto.phone ?? existing.phone,
        mobilePhone: dto.mobilePhone ?? existing.mobilePhone,
        preferredContactMethod: dto.preferredContactMethod ?? existing.preferredContactMethod,
        address: dto.address ?? existing.address,
        emergencyContact: dto.emergencyContact ?? existing.emergencyContact,
        primaryProviderId: dto.primaryProviderId ?? existing.primaryProviderId,
        clinicId: dto.clinicId ?? existing.clinicId,
        maritalStatus: dto.maritalStatus ?? existing.maritalStatus,
        bloodGroup: dto.bloodGroup ?? existing.bloodGroup,
        status: dto.status ?? existing.status,
        doNotContact: dto.doNotContact ?? existing.doNotContact,
        updatedAt: new Date()
      };
      this.mockPatients[index] = updated;
      return of(updated).pipe(delay(500));
    }
    throw new Error('Patient not found');
  }

  /**
   * Get family relations for a patient
   */
  getFamilyRelations(patientId: string): Observable<FamilyRelation[]> {
    return of([]).pipe(delay(200));
  }

  /**
   * Add family relation
   */
  addFamilyRelation(patientId: string, relation: Partial<FamilyRelation>): Observable<FamilyRelation> {
    const newRelation: FamilyRelation = {
      id: `rel-${Date.now()}`,
      relatedPatientId: relation.relatedPatientId || '',
      relatedPatientName: relation.relatedPatientName || '',
      relatedPatientMrn: relation.relatedPatientMrn || '',
      relationship: relation.relationship || 'other',
      verified: false,
      createdAt: new Date()
    };
    return of(newRelation).pipe(delay(300));
  }

  /**
   * Remove family relation
   */
  removeFamilyRelation(patientId: string, relationId: string): Observable<void> {
    return of(undefined).pipe(delay(300));
  }

  /**
   * Quick patient search for autocomplete
   */
  quickSearch(query: string): Observable<PatientSummary[]> {
    if (!query || query.length < 2) {
      return of([]);
    }

    const queryLower = query.toLowerCase();
    const results = this.mockPatients
      .filter(p => 
        p.firstName.toLowerCase().includes(queryLower) ||
        p.lastName.toLowerCase().includes(queryLower) ||
        p.mrn.toLowerCase().includes(queryLower)
      )
      .slice(0, 10)
      .map(p => ({
        id: p.id,
        mrn: p.mrn,
        fullName: `${p.firstName} ${p.lastName}`,
        dateOfBirth: p.dateOfBirth,
        age: this.calculateAge(p.dateOfBirth),
        gender: p.gender,
        phone: p.phone,
        status: p.status
      }));

    return of(results).pipe(delay(200));
  }

  private calculateAge(dob: Date): number {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
}
