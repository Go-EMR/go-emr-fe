import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, throwError } from 'rxjs';
import { 
  Encounter, 
  EncounterSearchParams, 
  CreateEncounterDto, 
  UpdateEncounterDto,
  VitalSigns,
  EncounterTemplate
} from '../models/encounter.model';
import { MOCK_ENCOUNTERS, MOCK_ENCOUNTER_TEMPLATES } from './mock-data/encounters.mock';

const USE_MOCK = true;
const MOCK_DELAY = 300;

@Injectable({ providedIn: 'root' })
export class EncounterService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/encounters';

  searchEncounters(params: EncounterSearchParams): Observable<{ data: Encounter[]; total: number }> {
    if (USE_MOCK) {
      let filtered = [...MOCK_ENCOUNTERS];

      if (params.patientId) {
        filtered = filtered.filter(e => e.patient.id === params.patientId);
      }
      if (params.providerId) {
        filtered = filtered.filter(e => e.provider.id === params.providerId);
      }
      if (params.status?.length) {
        filtered = filtered.filter(e => params.status!.includes(e.status));
      }
      if (params.class?.length) {
        filtered = filtered.filter(e => params.class!.includes(e.class));
      }
      if (params.startDate) {
        filtered = filtered.filter(e => new Date(e.startTime) >= new Date(params.startDate!));
      }
      if (params.endDate) {
        filtered = filtered.filter(e => new Date(e.startTime) <= new Date(params.endDate!));
      }
      if (params.search) {
        const search = params.search.toLowerCase();
        filtered = filtered.filter(e =>
          e.patient.name.toLowerCase().includes(search) ||
          e.subjective?.chiefComplaint?.toLowerCase().includes(search) ||
          e.assessment?.diagnoses?.some(d => d.description.toLowerCase().includes(search))
        );
      }

      // Sort
      const sortBy = params.sortBy || 'startTime';
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

    return this.http.get<{ data: Encounter[]; total: number }>(this.baseUrl, { params: params as any });
  }

  getEncounter(id: string): Observable<Encounter> {
    if (USE_MOCK) {
      const encounter = MOCK_ENCOUNTERS.find(e => e.id === id);
      if (!encounter) {
        return throwError(() => new Error('Encounter not found'));
      }
      return of(encounter).pipe(delay(MOCK_DELAY));
    }
    return this.http.get<Encounter>(`${this.baseUrl}/${id}`);
  }

  getPatientEncounters(patientId: string, limit?: number): Observable<Encounter[]> {
    if (USE_MOCK) {
      let encounters = MOCK_ENCOUNTERS.filter(e => e.patient.id === patientId);
      encounters.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      if (limit) {
        encounters = encounters.slice(0, limit);
      }
      return of(encounters).pipe(delay(MOCK_DELAY));
    }
    return this.http.get<Encounter[]>(`${this.baseUrl}/patient/${patientId}`, { params: { limit: limit || 10 } });
  }

  getTodayEncounters(providerId?: string): Observable<Encounter[]> {
    if (USE_MOCK) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      let encounters = MOCK_ENCOUNTERS.filter(e => {
        const start = new Date(e.startTime);
        return start >= today && start < tomorrow;
      });

      if (providerId) {
        encounters = encounters.filter(e => e.provider.id === providerId);
      }

      encounters.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      return of(encounters).pipe(delay(MOCK_DELAY));
    }
    return this.http.get<Encounter[]>(`${this.baseUrl}/today`, { params: providerId ? { providerId } : {} });
  }

  createEncounter(data: CreateEncounterDto): Observable<Encounter> {
    if (USE_MOCK) {
      const newEncounter: Encounter = {
        id: `enc-${Date.now()}`,
        status: 'in-progress',
        class: data.class,
        patient: {
          id: data.patientId,
          name: 'Patient Name', // Would be fetched from patient service
          dob: '1990-01-01',
          mrn: 'MRN-001',
        },
        provider: {
          id: data.providerId,
          name: 'Dr. Provider', // Would be fetched
        },
        startTime: new Date(),
        facilityId: data.facilityId,
        roomId: data.roomId,
        appointmentId: data.appointmentId,
        serviceType: data.serviceType,
        createdAt: new Date(),
        createdBy: 'current-user',
      };
      MOCK_ENCOUNTERS.unshift(newEncounter);
      return of(newEncounter).pipe(delay(MOCK_DELAY));
    }
    return this.http.post<Encounter>(this.baseUrl, data);
  }

  updateEncounter(id: string, data: UpdateEncounterDto): Observable<Encounter> {
    if (USE_MOCK) {
      const index = MOCK_ENCOUNTERS.findIndex(e => e.id === id);
      if (index === -1) {
        return throwError(() => new Error('Encounter not found'));
      }
      const updated = { 
        ...MOCK_ENCOUNTERS[index], 
        ...data, 
        updatedAt: new Date(),
        updatedBy: 'current-user'
      };
      MOCK_ENCOUNTERS[index] = updated as Encounter;
      return of(updated as Encounter).pipe(delay(MOCK_DELAY));
    }
    return this.http.patch<Encounter>(`${this.baseUrl}/${id}`, data);
  }

  // Save vital signs
  saveVitalSigns(encounterId: string, vitals: Partial<VitalSigns>): Observable<VitalSigns> {
    if (USE_MOCK) {
      const encounter = MOCK_ENCOUNTERS.find(e => e.id === encounterId);
      if (!encounter) {
        return throwError(() => new Error('Encounter not found'));
      }
      
      const vitalSigns: VitalSigns = {
        id: `vs-${Date.now()}`,
        encounterId,
        recordedAt: new Date(),
        recordedBy: 'current-user',
        ...vitals,
      };
      
      encounter.vitalSigns = vitalSigns;
      return of(vitalSigns).pipe(delay(MOCK_DELAY));
    }
    return this.http.post<VitalSigns>(`${this.baseUrl}/${encounterId}/vitals`, vitals);
  }

  // Sign encounter (finalize)
  signEncounter(id: string, attestation?: string): Observable<Encounter> {
    if (USE_MOCK) {
      const index = MOCK_ENCOUNTERS.findIndex(e => e.id === id);
      if (index === -1) {
        return throwError(() => new Error('Encounter not found'));
      }
      const updated = {
        ...MOCK_ENCOUNTERS[index],
        status: 'finished' as const,
        signedAt: new Date(),
        signedBy: 'current-user',
        attestation: attestation || 'I attest that this documentation is accurate and complete.',
        endTime: MOCK_ENCOUNTERS[index].endTime || new Date(),
      };
      MOCK_ENCOUNTERS[index] = updated;
      return of(updated).pipe(delay(MOCK_DELAY));
    }
    return this.http.post<Encounter>(`${this.baseUrl}/${id}/sign`, { attestation });
  }

  // Cancel encounter
  cancelEncounter(id: string, reason?: string): Observable<Encounter> {
    if (USE_MOCK) {
      const index = MOCK_ENCOUNTERS.findIndex(e => e.id === id);
      if (index === -1) {
        return throwError(() => new Error('Encounter not found'));
      }
      const updated = {
        ...MOCK_ENCOUNTERS[index],
        status: 'cancelled' as const,
        endTime: new Date(),
        additionalNotes: reason ? `Cancelled: ${reason}` : undefined,
      };
      MOCK_ENCOUNTERS[index] = updated;
      return of(updated).pipe(delay(MOCK_DELAY));
    }
    return this.http.post<Encounter>(`${this.baseUrl}/${id}/cancel`, { reason });
  }

  // Templates
  getTemplates(category?: string): Observable<EncounterTemplate[]> {
    if (USE_MOCK) {
      let templates = [...MOCK_ENCOUNTER_TEMPLATES];
      if (category) {
        templates = templates.filter(t => t.category === category);
      }
      return of(templates).pipe(delay(MOCK_DELAY));
    }
    return this.http.get<EncounterTemplate[]>(`${this.baseUrl}/templates`, { params: category ? { category } : {} });
  }

  applyTemplate(encounterId: string, templateId: string): Observable<Encounter> {
    if (USE_MOCK) {
      const encounter = MOCK_ENCOUNTERS.find(e => e.id === encounterId);
      const template = MOCK_ENCOUNTER_TEMPLATES.find(t => t.id === templateId);
      
      if (!encounter || !template) {
        return throwError(() => new Error('Encounter or template not found'));
      }

      const updated = {
        ...encounter,
        subjective: { ...encounter.subjective, ...template.subjective },
        objective: { ...encounter.objective, ...template.objective },
        assessment: { ...encounter.assessment, ...template.assessment },
        plan: { ...encounter.plan, ...template.plan },
        updatedAt: new Date(),
      };

      const index = MOCK_ENCOUNTERS.findIndex(e => e.id === encounterId);
      MOCK_ENCOUNTERS[index] = updated as Encounter;
      
      return of(updated as Encounter).pipe(delay(MOCK_DELAY));
    }
    return this.http.post<Encounter>(`${this.baseUrl}/${encounterId}/apply-template/${templateId}`, {});
  }
}
