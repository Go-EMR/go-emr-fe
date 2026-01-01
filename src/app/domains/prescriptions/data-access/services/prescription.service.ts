import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, throwError, map } from 'rxjs';
import { 
  Prescription, 
  PrescriptionSearchParams, 
  CreatePrescriptionDto,
  RenewPrescriptionDto,
  RefillRequestDto,
  Medication,
  Pharmacy,
  PharmacyInfo,
  FormularyEntry,
  DrugSearchResult,
  PrescriptionAlert
} from '../models/prescription.model';
import { 
  MOCK_PRESCRIPTIONS, 
  MOCK_MEDICATIONS, 
  MOCK_PHARMACIES,
  MOCK_FORMULARY,
  MOCK_DRUG_INTERACTIONS 
} from './mock-data/prescriptions.mock';

const USE_MOCK = true;
const MOCK_DELAY = 300;

@Injectable({ providedIn: 'root' })
export class PrescriptionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/prescriptions';

  // ============ Prescription CRUD ============

  searchPrescriptions(params: PrescriptionSearchParams): Observable<{ data: Prescription[]; total: number }> {
    if (USE_MOCK) {
      let filtered = [...MOCK_PRESCRIPTIONS];

      if (params.patientId) {
        filtered = filtered.filter(p => p.patient.id === params.patientId);
      }
      if (params.prescriberId) {
        filtered = filtered.filter(p => p.prescriber.id === params.prescriberId);
      }
      if (params.status?.length) {
        filtered = filtered.filter(p => params.status!.includes(p.status));
      }
      if (params.medicationName) {
        const search = params.medicationName.toLowerCase();
        filtered = filtered.filter(p => 
          p.medication.name.toLowerCase().includes(search) ||
          p.medication.genericName?.toLowerCase().includes(search)
        );
      }
      if (params.startDate) {
        filtered = filtered.filter(p => new Date(p.authoredOn) >= new Date(params.startDate!));
      }
      if (params.endDate) {
        filtered = filtered.filter(p => new Date(p.authoredOn) <= new Date(params.endDate!));
      }
      if (params.isControlled !== undefined) {
        filtered = filtered.filter(p => p.medication.isControlled === params.isControlled);
      }
      if (params.needsRefill) {
        filtered = filtered.filter(p => 
          p.status === 'active' && 
          p.dispense.refillsRemaining !== undefined && 
          p.dispense.refillsRemaining > 0
        );
      }
      if (params.search) {
        const search = params.search.toLowerCase();
        filtered = filtered.filter(p =>
          p.patient.name.toLowerCase().includes(search) ||
          p.medication.name.toLowerCase().includes(search) ||
          p.reasonDescription?.toLowerCase().includes(search)
        );
      }

      // Sort
      const sortBy = params.sortBy || 'authoredOn';
      const sortOrder = params.sortOrder || 'desc';
      filtered.sort((a, b) => {
        const aVal = (a as any)[sortBy];
        const bVal = (b as any)[sortBy];
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });

      const total = filtered.length;
      const page = params.page || 0;
      const limit = params.limit || 20;
      const paginated = filtered.slice(page * limit, (page + 1) * limit);

      return of({ data: paginated, total }).pipe(delay(MOCK_DELAY));
    }

    return this.http.get<{ data: Prescription[]; total: number }>(this.baseUrl, { params: params as any });
  }

  getPrescription(id: string): Observable<Prescription> {
    if (USE_MOCK) {
      const prescription = MOCK_PRESCRIPTIONS.find(p => p.id === id);
      if (!prescription) {
        return throwError(() => new Error('Prescription not found'));
      }
      return of(prescription).pipe(delay(MOCK_DELAY));
    }
    return this.http.get<Prescription>(`${this.baseUrl}/${id}`);
  }

  getPatientPrescriptions(patientId: string, activeOnly = false): Observable<Prescription[]> {
    if (USE_MOCK) {
      let prescriptions = MOCK_PRESCRIPTIONS.filter(p => p.patient.id === patientId);
      if (activeOnly) {
        prescriptions = prescriptions.filter(p => p.status === 'active');
      }
      prescriptions.sort((a, b) => new Date(b.authoredOn).getTime() - new Date(a.authoredOn).getTime());
      return of(prescriptions).pipe(delay(MOCK_DELAY));
    }
    return this.http.get<Prescription[]>(`${this.baseUrl}/patient/${patientId}`, { 
      params: { activeOnly: activeOnly.toString() } 
    });
  }

  getPatientMedicationList(patientId: string): Observable<Prescription[]> {
    // Returns current active medications for the patient
    return this.getPatientPrescriptions(patientId, true);
  }

  createPrescription(data: CreatePrescriptionDto): Observable<Prescription> {
    if (USE_MOCK) {
      const medication = MOCK_MEDICATIONS.find(m => m.id === data.medicationId);
      if (!medication) {
        return throwError(() => new Error('Medication not found'));
      }

      const newPrescription: Prescription = {
        id: `rx-${Date.now()}`,
        status: 'draft',
        intent: 'order',
        priority: data.priority || 'routine',
        medication,
        patient: {
          id: data.patientId,
          name: 'Patient Name',
          dob: '1990-01-01',
          mrn: 'MRN-001',
        },
        prescriber: {
          id: 'current-user',
          name: 'Current Provider',
        },
        encounterId: data.encounterId,
        dosage: data.dosage,
        dispense: {
          ...data.dispense,
          refillsRemaining: data.dispense.refills,
        },
        reasonCode: data.reasonCode,
        reasonDescription: data.reasonDescription,
        indication: data.indication,
        notes: data.notes,
        pharmacyNotes: data.pharmacyNotes,
        patientInstructions: data.patientInstructions,
        authoredOn: new Date(),
        validFrom: data.validFrom || new Date(),
        validUntil: data.validUntil,
        createdAt: new Date(),
        createdBy: 'current-user',
      };

      MOCK_PRESCRIPTIONS.unshift(newPrescription);
      return of(newPrescription).pipe(delay(MOCK_DELAY));
    }
    return this.http.post<Prescription>(this.baseUrl, data);
  }

  updatePrescription(id: string, data: Partial<Prescription>): Observable<Prescription> {
    if (USE_MOCK) {
      const index = MOCK_PRESCRIPTIONS.findIndex(p => p.id === id);
      if (index === -1) {
        return throwError(() => new Error('Prescription not found'));
      }

      const updated = {
        ...MOCK_PRESCRIPTIONS[index],
        ...data,
        updatedAt: new Date(),
        updatedBy: 'current-user',
      };
      MOCK_PRESCRIPTIONS[index] = updated as Prescription;
      return of(updated as Prescription).pipe(delay(MOCK_DELAY));
    }
    return this.http.patch<Prescription>(`${this.baseUrl}/${id}`, data);
  }

  // ============ E-Prescribe ============

  sendPrescription(id: string, pharmacyId?: string): Observable<Prescription> {
    if (USE_MOCK) {
      const index = MOCK_PRESCRIPTIONS.findIndex(p => p.id === id);
      if (index === -1) {
        return throwError(() => new Error('Prescription not found'));
      }

      const pharmacy = pharmacyId 
        ? MOCK_PHARMACIES.find(ph => ph.id === pharmacyId)
        : MOCK_PRESCRIPTIONS[index].dispense.pharmacy;

      const updated = {
        ...MOCK_PRESCRIPTIONS[index],
        status: 'active' as const,
        ePrescribeStatus: 'sent' as const,
        ePrescribeSentAt: new Date(),
        ePrescribeConfirmation: `ERX-${Date.now()}`,
        dispense: {
          ...MOCK_PRESCRIPTIONS[index].dispense,
          pharmacy: pharmacy || MOCK_PRESCRIPTIONS[index].dispense.pharmacy,
        },
        updatedAt: new Date(),
      };
      MOCK_PRESCRIPTIONS[index] = updated;
      return of(updated).pipe(delay(MOCK_DELAY));
    }
    return this.http.post<Prescription>(`${this.baseUrl}/${id}/send`, { pharmacyId });
  }

  cancelPrescription(id: string, reason?: string): Observable<Prescription> {
    if (USE_MOCK) {
      const index = MOCK_PRESCRIPTIONS.findIndex(p => p.id === id);
      if (index === -1) {
        return throwError(() => new Error('Prescription not found'));
      }

      const updated = {
        ...MOCK_PRESCRIPTIONS[index],
        status: 'cancelled' as const,
        ePrescribeStatus: 'cancelled' as const,
        notes: reason 
          ? `${MOCK_PRESCRIPTIONS[index].notes || ''}\nCANCELLED: ${reason}`.trim()
          : MOCK_PRESCRIPTIONS[index].notes,
        updatedAt: new Date(),
        updatedBy: 'current-user',
      };
      MOCK_PRESCRIPTIONS[index] = updated;
      return of(updated).pipe(delay(MOCK_DELAY));
    }
    return this.http.post<Prescription>(`${this.baseUrl}/${id}/cancel`, { reason });
  }

  // ============ Refills ============

  requestRefill(data: RefillRequestDto): Observable<Prescription> {
    if (USE_MOCK) {
      const index = MOCK_PRESCRIPTIONS.findIndex(p => p.id === data.prescriptionId);
      if (index === -1) {
        return throwError(() => new Error('Prescription not found'));
      }

      const prescription = MOCK_PRESCRIPTIONS[index];
      if (!prescription.dispense.refillsRemaining || prescription.dispense.refillsRemaining <= 0) {
        return throwError(() => new Error('No refills remaining'));
      }

      const pharmacy = data.pharmacyId 
        ? MOCK_PHARMACIES.find(ph => ph.id === data.pharmacyId)
        : prescription.dispense.pharmacy;

      const refillRecord = {
        id: `ref-${Date.now()}`,
        refillNumber: (prescription.refillHistory?.length || 0) + 1,
        requestedAt: new Date(),
        pharmacy: pharmacy!,
        quantity: data.quantity || prescription.dispense.quantity,
        daysSupply: prescription.dispense.daysSupply,
        status: 'requested' as const,
        notes: data.notes,
      };

      const updated = {
        ...prescription,
        dispense: {
          ...prescription.dispense,
          refillsRemaining: prescription.dispense.refillsRemaining - 1,
        },
        refillHistory: [...(prescription.refillHistory || []), refillRecord],
        updatedAt: new Date(),
      };

      MOCK_PRESCRIPTIONS[index] = updated;
      return of(updated).pipe(delay(MOCK_DELAY));
    }
    return this.http.post<Prescription>(`${this.baseUrl}/${data.prescriptionId}/refill`, data);
  }

  renewPrescription(data: RenewPrescriptionDto): Observable<Prescription> {
    if (USE_MOCK) {
      const original = MOCK_PRESCRIPTIONS.find(p => p.id === data.prescriptionId);
      if (!original) {
        return throwError(() => new Error('Prescription not found'));
      }

      const newPrescription: Prescription = {
        ...original,
        id: `rx-${Date.now()}`,
        status: 'draft',
        dosage: data.changes?.dosage 
          ? { ...original.dosage, ...data.changes.dosage }
          : original.dosage,
        dispense: data.changes?.dispense
          ? { 
              ...original.dispense, 
              ...data.changes.dispense,
              refillsRemaining: data.changes.dispense.refills ?? original.dispense.refills,
            }
          : { ...original.dispense, refillsRemaining: original.dispense.refills },
        notes: data.changes?.notes || original.notes,
        authoredOn: new Date(),
        validFrom: new Date(),
        validUntil: undefined,
        ePrescribeStatus: undefined,
        ePrescribeSentAt: undefined,
        ePrescribeConfirmation: undefined,
        refillHistory: [],
        createdAt: new Date(),
        createdBy: 'current-user',
        updatedAt: undefined,
        updatedBy: undefined,
      };

      MOCK_PRESCRIPTIONS.unshift(newPrescription);
      return of(newPrescription).pipe(delay(MOCK_DELAY));
    }
    return this.http.post<Prescription>(`${this.baseUrl}/${data.prescriptionId}/renew`, data);
  }

  // ============ Drug Database / Formulary ============

  searchMedications(query: string, patientId?: string): Observable<DrugSearchResult[]> {
    if (USE_MOCK) {
      const search = query.toLowerCase();
      const medications = MOCK_MEDICATIONS.filter(m =>
        m.name.toLowerCase().includes(search) ||
        m.genericName?.toLowerCase().includes(search) ||
        m.brandNames?.some(b => b.toLowerCase().includes(search))
      );

      const results: DrugSearchResult[] = medications.map(med => {
        const formulary = MOCK_FORMULARY.find(f => f.medication.id === med.id);
        const interactions = MOCK_DRUG_INTERACTIONS.filter(i => i.drugId === med.id);
        
        return {
          // Required DrugSearchResult properties
          medication: med,
          formularyEntry: formulary,
          hasInteractions: interactions.length > 0,
          interactionCount: interactions.length,
          // Flat properties for template compatibility
          id: med.id,
          rxcui: med.rxcui || '',
          ndc: med.ndc,
          name: med.name,
          genericName: med.genericName,
          brandName: med.brandNames?.[0] || med.brandName,
          strength: med.strength,
          strengthUnit: med.strengthUnit,
          form: med.form,
          route: med.route,
          drugClass: med.therapeuticClass || med.pharmacologicClass,
          isGeneric: med.isGeneric,
          isControlled: med.isControlled,
          controlledSchedule: med.controlledSchedule,
          schedule: med.controlledSchedule,
          commonQuantities: [30, 60, 90],
          commonDaysSupply: [30, 60, 90]
        };
      });

      return of(results).pipe(delay(MOCK_DELAY));
    }
    return this.http.get<DrugSearchResult[]>(`${this.baseUrl}/medications/search`, { 
      params: { query, patientId: patientId || '' } 
    });
  }

  getMedication(id: string): Observable<Medication> {
    if (USE_MOCK) {
      const medication = MOCK_MEDICATIONS.find(m => m.id === id);
      if (!medication) {
        return throwError(() => new Error('Medication not found'));
      }
      return of(medication).pipe(delay(MOCK_DELAY));
    }
    return this.http.get<Medication>(`${this.baseUrl}/medications/${id}`);
  }

  getFormulary(medicationId: string): Observable<FormularyEntry | null> {
    if (USE_MOCK) {
      const entry = MOCK_FORMULARY.find(f => f.medication.id === medicationId);
      return of(entry || null).pipe(delay(MOCK_DELAY));
    }
    return this.http.get<FormularyEntry | null>(`${this.baseUrl}/formulary/${medicationId}`);
  }

  // ============ Pharmacy ============

  searchPharmacies(query: string, filters?: { 
    isRetail?: boolean; 
    isMailOrder?: boolean;
    isSpecialty?: boolean;
    zip?: string;
  }): Observable<PharmacyInfo[]> {
    if (USE_MOCK) {
      let pharmacies = [...MOCK_PHARMACIES];
      
      if (query) {
        const search = query.toLowerCase();
        pharmacies = pharmacies.filter(p =>
          p.name.toLowerCase().includes(search) ||
          p.address.toLowerCase().includes(search) ||
          p.city.toLowerCase().includes(search)
        );
      }

      if (filters?.isRetail !== undefined) {
        pharmacies = pharmacies.filter(p => p.isRetail === filters.isRetail);
      }
      if (filters?.isMailOrder !== undefined) {
        pharmacies = pharmacies.filter(p => p.isMailOrder === filters.isMailOrder);
      }
      if (filters?.isSpecialty !== undefined) {
        pharmacies = pharmacies.filter(p => p.isSpecialty === filters.isSpecialty);
      }
      if (filters?.zip) {
        pharmacies = pharmacies.filter(p => p.zip.startsWith(filters.zip!));
      }

      // Map Pharmacy to PharmacyInfo with structured address
      const pharmacyInfos: PharmacyInfo[] = pharmacies.map(p => ({
        id: p.id,
        name: p.name,
        address: {
          street: p.address,
          city: p.city,
          state: p.state,
          zip: p.zip
        },
        phone: p.phone,
        fax: p.fax,
        ncpdpId: p.ncpdpId,
        npi: p.npi,
        isRetail: p.isRetail,
        isMailOrder: p.isMailOrder,
        isSpecialty: p.isSpecialty,
        is24Hour: p.is24Hour,
        acceptsEpcs: true, // Default to true for mock
        isPreferred: false // Default
      }));

      return of(pharmacyInfos).pipe(delay(MOCK_DELAY));
    }
    return this.http.get<Pharmacy[]>(`${this.baseUrl}/pharmacies`, { 
      params: { query, ...filters } as any 
    }).pipe(
      map(pharmacies => pharmacies.map(p => ({
        id: p.id,
        name: p.name,
        address: {
          street: p.address,
          city: p.city,
          state: p.state,
          zip: p.zip
        },
        phone: p.phone,
        fax: p.fax,
        ncpdpId: p.ncpdpId,
        npi: p.npi,
        isRetail: p.isRetail,
        isMailOrder: p.isMailOrder,
        isSpecialty: p.isSpecialty,
        is24Hour: p.is24Hour,
        acceptsEpcs: true,
        isPreferred: false
      })))
    );
  }

  getPharmacy(id: string): Observable<PharmacyInfo> {
    if (USE_MOCK) {
      const pharmacy = MOCK_PHARMACIES.find(p => p.id === id);
      if (!pharmacy) {
        return throwError(() => new Error('Pharmacy not found'));
      }
      const pharmacyInfo: PharmacyInfo = {
        id: pharmacy.id,
        name: pharmacy.name,
        address: {
          street: pharmacy.address,
          city: pharmacy.city,
          state: pharmacy.state,
          zip: pharmacy.zip
        },
        phone: pharmacy.phone,
        fax: pharmacy.fax,
        ncpdpId: pharmacy.ncpdpId,
        npi: pharmacy.npi,
        isRetail: pharmacy.isRetail,
        isMailOrder: pharmacy.isMailOrder,
        isSpecialty: pharmacy.isSpecialty,
        is24Hour: pharmacy.is24Hour,
        acceptsEpcs: true,
        isPreferred: false
      };
      return of(pharmacyInfo).pipe(delay(MOCK_DELAY));
    }
    return this.http.get<Pharmacy>(`${this.baseUrl}/pharmacies/${id}`).pipe(
      map(p => ({
        id: p.id,
        name: p.name,
        address: {
          street: p.address,
          city: p.city,
          state: p.state,
          zip: p.zip
        },
        phone: p.phone,
        fax: p.fax,
        ncpdpId: p.ncpdpId,
        npi: p.npi,
        isRetail: p.isRetail,
        isMailOrder: p.isMailOrder,
        isSpecialty: p.isSpecialty,
        is24Hour: p.is24Hour,
        acceptsEpcs: true,
        isPreferred: false
      }))
    );
  }

  // ============ Drug Safety ============

  checkDrugInteractions(medicationId: string, patientId: string): Observable<PrescriptionAlert[]> {
    if (USE_MOCK) {
      const alerts: PrescriptionAlert[] = [];
      const medication = MOCK_MEDICATIONS.find(m => m.id === medicationId);
      
      if (medication) {
        // Check for interactions
        const interactions = MOCK_DRUG_INTERACTIONS.filter(i => i.drugId === medicationId);
        interactions.forEach(interaction => {
          alerts.push({
            type: 'interaction',
            severity: interaction.severity,
            title: `Drug Interaction: ${interaction.drugName}`,
            message: interaction.description,
            details: interaction.clinicalSignificance,
            actionRequired: interaction.severity === 'high',
          });
        });

        // Add sample allergy alert
        if (medication.id === 'med-009') { // Amoxicillin
          alerts.push({
            type: 'allergy',
            severity: 'high',
            title: 'Potential Allergy',
            message: 'Patient has documented penicillin allergy',
            details: 'Amoxicillin is a penicillin-class antibiotic. Cross-reactivity is possible.',
            actionRequired: true,
          });
        }

        // Controlled substance warning
        if (medication.isControlled) {
          alerts.push({
            type: 'dose-warning',
            severity: 'moderate',
            title: 'Controlled Substance',
            message: `This is a Schedule ${medication.controlledSchedule} controlled substance`,
            details: 'Verify patient identity and check PDMP before prescribing.',
            actionRequired: true,
          });
        }
      }

      return of(alerts).pipe(delay(MOCK_DELAY));
    }
    return this.http.get<PrescriptionAlert[]>(`${this.baseUrl}/safety-check`, {
      params: { medicationId, patientId }
    });
  }

  checkDuplicateTherapy(medicationId: string, patientId: string): Observable<PrescriptionAlert[]> {
    if (USE_MOCK) {
      const alerts: PrescriptionAlert[] = [];
      const medication = MOCK_MEDICATIONS.find(m => m.id === medicationId);
      const patientRx = MOCK_PRESCRIPTIONS.filter(p => 
        p.patient.id === patientId && 
        p.status === 'active' &&
        p.medication.therapeuticClass === medication?.therapeuticClass
      );

      if (patientRx.length > 0 && medication) {
        alerts.push({
          type: 'duplicate',
          severity: 'moderate',
          title: 'Duplicate Therapy Warning',
          message: `Patient already has active prescription for ${patientRx[0].medication.name}`,
          details: `Both medications are in the ${medication.therapeuticClass} therapeutic class.`,
          actionRequired: false,
        });
      }

      return of(alerts).pipe(delay(MOCK_DELAY));
    }
    return this.http.get<PrescriptionAlert[]>(`${this.baseUrl}/duplicate-check`, {
      params: { medicationId, patientId }
    });
  }

  // ============ Prior Authorization ============

  checkPriorAuthRequired(medicationId: string, insuranceId?: string): Observable<boolean> {
    if (USE_MOCK) {
      const formulary = MOCK_FORMULARY.find(f => f.medication.id === medicationId);
      return of(formulary?.requiresPriorAuth || false).pipe(delay(MOCK_DELAY));
    }
    return this.http.get<boolean>(`${this.baseUrl}/prior-auth-check`, {
      params: { medicationId, insuranceId: insuranceId || '' }
    });
  }

  submitPriorAuth(prescriptionId: string, documents?: File[]): Observable<{ status: string; referenceNumber: string }> {
    if (USE_MOCK) {
      return of({
        status: 'submitted',
        referenceNumber: `PA-${Date.now()}`,
      }).pipe(delay(MOCK_DELAY));
    }
    const formData = new FormData();
    formData.append('prescriptionId', prescriptionId);
    documents?.forEach(doc => formData.append('documents', doc));
    return this.http.post<{ status: string; referenceNumber: string }>(`${this.baseUrl}/prior-auth`, formData);
  }

  // ============ Patient Search (for prescription editor) ============

  searchPatients(query: string): Observable<Array<{id: string; name: string; mrn: string; dob: string}>> {
    if (USE_MOCK) {
      const mockPatients = [
        { id: 'pat-001', name: 'John Smith', mrn: 'MRN-10001', dob: '1985-03-15' },
        { id: 'pat-002', name: 'Sarah Johnson', mrn: 'MRN-10002', dob: '1990-07-22' },
        { id: 'pat-003', name: 'Michael Brown', mrn: 'MRN-10003', dob: '1978-11-08' },
        { id: 'pat-004', name: 'Emily Davis', mrn: 'MRN-10004', dob: '1995-01-30' },
        { id: 'pat-005', name: 'Robert Wilson', mrn: 'MRN-10005', dob: '1962-09-12' },
        { id: 'pat-006', name: 'Jennifer Martinez', mrn: 'MRN-10006', dob: '1988-04-25' },
      ];
      
      if (!query) return of(mockPatients).pipe(delay(MOCK_DELAY));
      
      const search = query.toLowerCase();
      const filtered = mockPatients.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.mrn.toLowerCase().includes(search)
      );
      
      return of(filtered).pipe(delay(MOCK_DELAY));
    }
    return this.http.get<Array<{id: string; name: string; mrn: string; dob: string}>>(`/api/patients/search`, {
      params: { query }
    });
  }

  // ============ Recent Pharmacies ============

  getRecentPharmacies(): Observable<any[]> {
    if (USE_MOCK) {
      // Return first 3 pharmacies as "recent"
      const recentPharmacies = MOCK_PHARMACIES.slice(0, 3).map(p => ({
        id: p.id,
        name: p.name,
        ncpdpId: p.ncpdpId,
        npi: p.npi,
        address: {
          street: p.address,
          city: p.city,
          state: p.state,
          zipCode: p.zip,
        },
        phone: p.phone,
        fax: p.fax,
        is24Hour: p.is24Hour || false,
        acceptsEpcs: p.eRxEnabled || false,
        isMailOrder: p.isMailOrder || false,
        isPreferred: false,
      }));
      return of(recentPharmacies).pipe(delay(MOCK_DELAY));
    }
    return this.http.get<any[]>(`${this.baseUrl}/pharmacies/recent`);
  }

  // ============ Patient Allergies ============

  getPatientAllergies(patientId: string): Observable<any[]> {
    if (USE_MOCK) {
      // Mock allergies for demo
      const mockAllergies = [
        {
          allergen: 'Penicillin',
          reaction: 'Hives, difficulty breathing',
          severity: 'severe' as const,
          onsetDate: '2015-06-20',
        },
        {
          allergen: 'Sulfa drugs',
          reaction: 'Rash',
          severity: 'moderate' as const,
          onsetDate: '2018-03-10',
        },
      ];
      // Only return allergies for specific patient IDs for demo
      if (patientId === 'pat-001' || patientId === 'pat-003') {
        return of(mockAllergies).pipe(delay(MOCK_DELAY));
      }
      return of([]).pipe(delay(MOCK_DELAY));
    }
    return this.http.get<any[]>(`/api/patients/${patientId}/allergies`);
  }

  // ============ Prescription History ============

  getPrescriptionHistory(prescriptionId: string): Observable<any[]> {
    if (USE_MOCK) {
      const mockHistory = [
        {
          id: 'hist-1',
          prescriptionId,
          action: 'created',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          userId: 'provider-1',
          userName: 'Dr. Sarah Chen',
          details: 'Prescription created',
        },
        {
          id: 'hist-2',
          prescriptionId,
          action: 'transmitted',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 300000).toISOString(),
          userId: 'provider-1',
          userName: 'Dr. Sarah Chen',
          details: 'Sent to CVS Pharmacy via e-prescribe',
        },
        {
          id: 'hist-3',
          prescriptionId,
          action: 'filled',
          timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          userId: 'system',
          userName: 'System',
          details: 'Prescription filled by pharmacy',
        },
      ];
      return of(mockHistory).pipe(delay(MOCK_DELAY));
    }
    return this.http.get<any[]>(`${this.baseUrl}/${prescriptionId}/history`);
  }

  // ============ Discontinue Prescription ============

  discontinuePrescription(id: string, reason?: string): Observable<Prescription> {
    if (USE_MOCK) {
      const index = MOCK_PRESCRIPTIONS.findIndex(p => p.id === id);
      if (index === -1) {
        return throwError(() => new Error('Prescription not found'));
      }

      const updated = {
        ...MOCK_PRESCRIPTIONS[index],
        status: 'stopped' as const,
        statusReason: reason || 'Discontinued by provider',
        updatedAt: new Date(),
        updatedBy: 'current-user',
      };
      MOCK_PRESCRIPTIONS[index] = updated;
      return of(updated).pipe(delay(MOCK_DELAY));
    }
    return this.http.post<Prescription>(`${this.baseUrl}/${id}/discontinue`, { reason });
  }
}
