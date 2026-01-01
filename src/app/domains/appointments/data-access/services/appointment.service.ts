import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import {
  Appointment,
  AppointmentSlot,
  AppointmentSearchParams,
  AppointmentSearchResult,
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from '../models/appointment.model';
import { MOCK_APPOINTMENTS, generateMockSlots } from './mock-data/appointments.mock';

@Injectable({
  providedIn: 'root',
})
export class AppointmentService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/appointments`;
  
  private readonly useMock = true;

  /**
   * Search appointments with filters
   */
  searchAppointments(params: AppointmentSearchParams): Observable<AppointmentSearchResult> {
    if (this.useMock) {
      return this.mockSearch(params);
    }

    const httpParams = this.buildHttpParams(params);
    return this.http.get<AppointmentSearchResult>(this.API_URL, { params: httpParams });
  }

  /**
   * Get appointment by ID
   */
  getAppointment(id: string): Observable<Appointment> {
    if (this.useMock) {
      const appointment = MOCK_APPOINTMENTS.find(a => a.id === id);
      if (!appointment) {
        throw new Error('Appointment not found');
      }
      return of(appointment).pipe(delay(300));
    }

    return this.http.get<Appointment>(`${this.API_URL}/${id}`);
  }

  /**
   * Get appointments for a specific date range (for calendar view)
   */
  getAppointmentsByDateRange(
    startDate: Date,
    endDate: Date,
    providerId?: string
  ): Observable<Appointment[]> {
    if (this.useMock) {
      let filtered = MOCK_APPOINTMENTS.filter(apt => {
        const aptDate = new Date(apt.start);
        return aptDate >= startDate && aptDate <= endDate;
      });

      if (providerId) {
        filtered = filtered.filter(apt => apt.providerId === providerId);
      }

      return of(filtered).pipe(delay(400));
    }

    let params = new HttpParams()
      .set('startDate', startDate.toISOString())
      .set('endDate', endDate.toISOString());

    if (providerId) {
      params = params.set('providerId', providerId);
    }

    return this.http.get<Appointment[]>(`${this.API_URL}/range`, { params });
  }

  /**
   * Get today's appointments
   */
  getTodayAppointments(providerId?: string): Observable<Appointment[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getAppointmentsByDateRange(today, tomorrow, providerId);
  }

  /**
   * Get available slots for scheduling
   */
  getAvailableSlots(
    date: Date,
    providerId: string,
    duration: number = 30
  ): Observable<AppointmentSlot[]> {
    if (this.useMock) {
      const slots = generateMockSlots(date, providerId, duration);
      return of(slots).pipe(delay(500));
    }

    const params = new HttpParams()
      .set('date', date.toISOString())
      .set('providerId', providerId)
      .set('duration', duration.toString());

    return this.http.get<AppointmentSlot[]>(`${this.API_URL}/slots`, { params });
  }

  /**
   * Create new appointment
   */
  createAppointment(data: CreateAppointmentDto): Observable<Appointment> {
    if (this.useMock) {
      const newAppointment: Appointment = {
        id: `apt-${Date.now()}`,
        status: 'booked',
        ...data,
        end: new Date(new Date(data.start).getTime() + data.duration * 60000),
        patientName: 'New Patient', // Would be fetched from patient service
        providerName: 'Dr. Smith', // Would be fetched from provider service
        facilityName: 'Main Clinic',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'current-user',
      };
      MOCK_APPOINTMENTS.push(newAppointment);
      return of(newAppointment).pipe(delay(600));
    }

    return this.http.post<Appointment>(this.API_URL, data);
  }

  /**
   * Update appointment
   */
  updateAppointment(id: string, data: UpdateAppointmentDto): Observable<Appointment> {
    if (this.useMock) {
      const index = MOCK_APPOINTMENTS.findIndex(a => a.id === id);
      if (index === -1) {
        throw new Error('Appointment not found');
      }
      
      const updated = {
        ...MOCK_APPOINTMENTS[index],
        ...data,
        updatedAt: new Date(),
      };
      
      if (data.start && data.duration) {
        updated.end = new Date(new Date(data.start).getTime() + data.duration * 60000);
      }
      
      MOCK_APPOINTMENTS[index] = updated;
      return of(updated).pipe(delay(500));
    }

    return this.http.patch<Appointment>(`${this.API_URL}/${id}`, data);
  }

  /**
   * Cancel appointment
   */
  cancelAppointment(id: string, reason: string): Observable<Appointment> {
    if (this.useMock) {
      const index = MOCK_APPOINTMENTS.findIndex(a => a.id === id);
      if (index === -1) {
        throw new Error('Appointment not found');
      }
      
      MOCK_APPOINTMENTS[index] = {
        ...MOCK_APPOINTMENTS[index],
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledBy: 'current-user',
        cancellationReason: reason,
        updatedAt: new Date(),
      };
      
      return of(MOCK_APPOINTMENTS[index]).pipe(delay(400));
    }

    return this.http.post<Appointment>(`${this.API_URL}/${id}/cancel`, { reason });
  }

  /**
   * Check in patient
   */
  checkIn(id: string): Observable<Appointment> {
    if (this.useMock) {
      const index = MOCK_APPOINTMENTS.findIndex(a => a.id === id);
      if (index === -1) {
        throw new Error('Appointment not found');
      }
      
      MOCK_APPOINTMENTS[index] = {
        ...MOCK_APPOINTMENTS[index],
        status: 'checked-in',
        arrivedAt: new Date(),
        checkedInAt: new Date(),
        checkedInBy: 'current-user',
        updatedAt: new Date(),
      };
      
      return of(MOCK_APPOINTMENTS[index]).pipe(delay(300));
    }

    return this.http.post<Appointment>(`${this.API_URL}/${id}/check-in`, {});
  }

  /**
   * Start encounter (move to in-progress)
   */
  startEncounter(id: string): Observable<Appointment> {
    if (this.useMock) {
      const index = MOCK_APPOINTMENTS.findIndex(a => a.id === id);
      if (index === -1) {
        throw new Error('Appointment not found');
      }
      
      MOCK_APPOINTMENTS[index] = {
        ...MOCK_APPOINTMENTS[index],
        status: 'in-progress',
        updatedAt: new Date(),
      };
      
      return of(MOCK_APPOINTMENTS[index]).pipe(delay(300));
    }

    return this.http.post<Appointment>(`${this.API_URL}/${id}/start`, {});
  }

  /**
   * Complete appointment
   */
  completeAppointment(id: string): Observable<Appointment> {
    if (this.useMock) {
      const index = MOCK_APPOINTMENTS.findIndex(a => a.id === id);
      if (index === -1) {
        throw new Error('Appointment not found');
      }
      
      MOCK_APPOINTMENTS[index] = {
        ...MOCK_APPOINTMENTS[index],
        status: 'fulfilled',
        updatedAt: new Date(),
      };
      
      return of(MOCK_APPOINTMENTS[index]).pipe(delay(300));
    }

    return this.http.post<Appointment>(`${this.API_URL}/${id}/complete`, {});
  }

  /**
   * Mark as no-show
   */
  markNoShow(id: string): Observable<Appointment> {
    if (this.useMock) {
      const index = MOCK_APPOINTMENTS.findIndex(a => a.id === id);
      if (index === -1) {
        throw new Error('Appointment not found');
      }
      
      MOCK_APPOINTMENTS[index] = {
        ...MOCK_APPOINTMENTS[index],
        status: 'noshow',
        updatedAt: new Date(),
      };
      
      return of(MOCK_APPOINTMENTS[index]).pipe(delay(300));
    }

    return this.http.post<Appointment>(`${this.API_URL}/${id}/no-show`, {});
  }

  /**
   * Send reminder
   */
  sendReminder(id: string): Observable<void> {
    if (this.useMock) {
      const index = MOCK_APPOINTMENTS.findIndex(a => a.id === id);
      if (index !== -1) {
        MOCK_APPOINTMENTS[index].reminderSent = true;
        MOCK_APPOINTMENTS[index].reminderSentAt = new Date();
      }
      return of(void 0).pipe(delay(500));
    }

    return this.http.post<void>(`${this.API_URL}/${id}/send-reminder`, {});
  }

  // Private methods
  private mockSearch(params: AppointmentSearchParams): Observable<AppointmentSearchResult> {
    let filtered = [...MOCK_APPOINTMENTS];

    // Apply filters
    if (params.startDate) {
      filtered = filtered.filter(a => new Date(a.start) >= params.startDate!);
    }
    if (params.endDate) {
      filtered = filtered.filter(a => new Date(a.start) <= params.endDate!);
    }
    if (params.providerId) {
      filtered = filtered.filter(a => a.providerId === params.providerId);
    }
    if (params.patientId) {
      filtered = filtered.filter(a => a.patientId === params.patientId);
    }
    if (params.status) {
      const statuses = Array.isArray(params.status) ? params.status : [params.status];
      filtered = filtered.filter(a => statuses.includes(a.status));
    }
    if (params.appointmentType) {
      filtered = filtered.filter(a => a.appointmentType === params.appointmentType);
    }

    // Sort
    const sortBy = params.sortBy || 'start';
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
    const appointments = filtered.slice((page - 1) * pageSize, page * pageSize);

    return of({
      appointments,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }).pipe(delay(400));
  }

  private buildHttpParams(params: AppointmentSearchParams): HttpParams {
    let httpParams = new HttpParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (value instanceof Date) {
          httpParams = httpParams.set(key, value.toISOString());
        } else if (Array.isArray(value)) {
          value.forEach(v => {
            httpParams = httpParams.append(key, String(v));
          });
        } else {
          httpParams = httpParams.set(key, String(value));
        }
      }
    });

    return httpParams;
  }
}
