import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import {
  ImagingOrder,
  ImagingProcedure,
  ImagingFacility,
  ImagingReport,
  ImagingModality,
  ImagingOrderStatus,
  ImagingPriority,
  BodyRegion
} from '../models/imaging.model';
import {
  MOCK_IMAGING_ORDERS,
  MOCK_IMAGING_PROCEDURES,
  MOCK_IMAGING_FACILITIES
} from './mock-data/imaging.mock';

export interface ImagingSearchParams {
  patientId?: string;
  encounterId?: string;
  modality?: ImagingModality;
  status?: ImagingOrderStatus | ImagingOrderStatus[];
  priority?: ImagingPriority;
  bodyRegion?: BodyRegion;
  facilityId?: string;
  orderingProviderId?: string;
  readingRadiologistId?: string;
  dateFrom?: string;
  dateTo?: string;
  hasCriticalFindings?: boolean;
  searchTerm?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface ImagingSearchResult {
  orders: ImagingOrder[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProcedureSearchParams {
  modality?: ImagingModality;
  bodyRegion?: BodyRegion;
  searchTerm?: string;
  commonOnly?: boolean;
}

const USE_MOCK = true;
const MOCK_DELAY = 300;

@Injectable({
  providedIn: 'root'
})
export class ImagingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/imaging`;

  // ==================== Order Operations ====================

  getOrders(params: ImagingSearchParams = {}): Observable<ImagingSearchResult> {
    if (USE_MOCK) {
      return this.mockGetOrders(params);
    }

    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => {
            httpParams = httpParams.append(key, v);
          });
        } else {
          httpParams = httpParams.set(key, String(value));
        }
      }
    });

    return this.http.get<ImagingSearchResult>(`${this.baseUrl}/orders`, { params: httpParams });
  }

  getOrderById(orderId: string): Observable<ImagingOrder> {
    if (USE_MOCK) {
      return this.mockGetOrderById(orderId);
    }
    return this.http.get<ImagingOrder>(`${this.baseUrl}/orders/${orderId}`);
  }

  getOrdersByPatient(patientId: string): Observable<ImagingOrder[]> {
    return this.getOrders({ patientId, pageSize: 100 }).pipe(
      map(result => result.orders)
    );
  }

  getOrdersByEncounter(encounterId: string): Observable<ImagingOrder[]> {
    return this.getOrders({ encounterId, pageSize: 100 }).pipe(
      map(result => result.orders)
    );
  }

  createOrder(order: Partial<ImagingOrder>): Observable<ImagingOrder> {
    if (USE_MOCK) {
      return this.mockCreateOrder(order);
    }
    return this.http.post<ImagingOrder>(`${this.baseUrl}/orders`, order);
  }

  updateOrder(orderId: string, updates: Partial<ImagingOrder>): Observable<ImagingOrder> {
    if (USE_MOCK) {
      return this.mockUpdateOrder(orderId, updates);
    }
    return this.http.patch<ImagingOrder>(`${this.baseUrl}/orders/${orderId}`, updates);
  }

  deleteOrder(orderId: string): Observable<void> {
    if (USE_MOCK) {
      return of(undefined).pipe(delay(MOCK_DELAY));
    }
    return this.http.delete<void>(`${this.baseUrl}/orders/${orderId}`);
  }

  cancelOrder(orderId: string, reason: string): Observable<ImagingOrder> {
    if (USE_MOCK) {
      return this.mockUpdateOrder(orderId, {
        status: ImagingOrderStatus.Cancelled,
        cancellationReason: reason
      });
    }
    return this.http.post<ImagingOrder>(`${this.baseUrl}/orders/${orderId}/cancel`, { reason });
  }

  // ==================== Order Workflow ====================

  scheduleOrder(orderId: string, scheduledDate: string, facilityId: string): Observable<ImagingOrder> {
    if (USE_MOCK) {
      return this.mockUpdateOrder(orderId, {
        status: ImagingOrderStatus.Scheduled,
        scheduledDate,
        performingFacility: { id: facilityId, name: '' }
      });
    }
    return this.http.post<ImagingOrder>(`${this.baseUrl}/orders/${orderId}/schedule`, {
      scheduledDate,
      facilityId
    });
  }

  startStudy(orderId: string): Observable<ImagingOrder> {
    if (USE_MOCK) {
      return this.mockUpdateOrder(orderId, {
        status: ImagingOrderStatus.InProgress,
        performedDate: new Date().toISOString()
      });
    }
    return this.http.post<ImagingOrder>(`${this.baseUrl}/orders/${orderId}/start`, {});
  }

  completeStudy(orderId: string, studyData: any): Observable<ImagingOrder> {
    if (USE_MOCK) {
      return this.mockUpdateOrder(orderId, {
        status: ImagingOrderStatus.Completed
      });
    }
    return this.http.post<ImagingOrder>(`${this.baseUrl}/orders/${orderId}/complete`, studyData);
  }

  submitReport(orderId: string, report: Partial<ImagingReport>): Observable<ImagingOrder> {
    if (USE_MOCK) {
      const mockReport: ImagingReport = {
        reportId: `RPT-${Date.now()}`,
        orderId: orderId,
        status: report.status || 'preliminary',
        indication: report.indication || '',
        technique: report.technique || '',
        findings: report.findings || '',
        impression: report.impression || '',
        hasCriticalFindings: report.hasCriticalFindings || false,
        radiologistId: report.radiologistId || 'RAD001',
        radiologistName: report.radiologistName || 'Dr. Radiologist',
        radiologist: report.radiologist || { id: 'RAD001', name: 'Dr. Radiologist' },
        signedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return this.mockUpdateOrder(orderId, {
        status: report.status === 'final' ? ImagingOrderStatus.Final : ImagingOrderStatus.Preliminary,
        report: mockReport,
        reportedDate: new Date().toISOString()
      });
    }
    return this.http.post<ImagingOrder>(`${this.baseUrl}/orders/${orderId}/report`, report);
  }

  addAddendum(orderId: string, addendumText: string): Observable<ImagingOrder> {
    if (USE_MOCK) {
      return this.getOrderById(orderId).pipe(
        map(order => {
          const addenda = order.report?.addenda || [];
          addenda.push({
            addendumId: `ADD-${Date.now()}`,
            content: addendumText,
            text: addendumText,
            radiologistId: 'RAD001',
            radiologistName: 'Dr. Radiologist',
            addedBy: { id: 'RAD001', name: 'Dr. Radiologist' },
            addedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
          });
          return {
            ...order,
            status: ImagingOrderStatus.Addendum,
            report: { ...order.report!, addenda }
          };
        }),
        delay(MOCK_DELAY)
      );
    }
    return this.http.post<ImagingOrder>(`${this.baseUrl}/orders/${orderId}/addendum`, { text: addendumText });
  }

  acknowledgeCriticalFinding(orderId: string, acknowledgedBy: string): Observable<ImagingOrder> {
    if (USE_MOCK) {
      return this.getOrderById(orderId).pipe(
        map(order => ({
          ...order,
          report: order.report ? {
            ...order.report,
            criticalFindingCommunicated: true,
            criticalFindingCommunicatedTo: acknowledgedBy,
            criticalFindingCommunicatedAt: new Date().toISOString()
          } : undefined
        })),
        delay(MOCK_DELAY)
      );
    }
    return this.http.post<ImagingOrder>(`${this.baseUrl}/orders/${orderId}/acknowledge-critical`, {
      acknowledgedBy
    });
  }

  // ==================== Procedure Operations ====================

  getProcedures(params: ProcedureSearchParams = {}): Observable<ImagingProcedure[]> {
    if (USE_MOCK) {
      return this.mockGetProcedures(params);
    }

    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });

    return this.http.get<ImagingProcedure[]>(`${this.baseUrl}/procedures`, { params: httpParams });
  }

  getProcedureByCode(procedureCode: string): Observable<ImagingProcedure | undefined> {
    if (USE_MOCK) {
      const procedure = MOCK_IMAGING_PROCEDURES.find(p => p.procedureCode === procedureCode);
      return of(procedure).pipe(delay(MOCK_DELAY));
    }
    return this.http.get<ImagingProcedure>(`${this.baseUrl}/procedures/${procedureCode}`);
  }

  getCommonProcedures(): Observable<ImagingProcedure[]> {
    return this.getProcedures({ commonOnly: true });
  }

  getProceduresByModality(modality: ImagingModality): Observable<ImagingProcedure[]> {
    return this.getProcedures({ modality });
  }

  // ==================== Facility Operations ====================

  getFacilities(): Observable<ImagingFacility[]> {
    if (USE_MOCK) {
      return of(MOCK_IMAGING_FACILITIES).pipe(delay(MOCK_DELAY));
    }
    return this.http.get<ImagingFacility[]>(`${this.baseUrl}/facilities`);
  }

  getFacilityById(facilityId: string): Observable<ImagingFacility | undefined> {
    if (USE_MOCK) {
      const facility = MOCK_IMAGING_FACILITIES.find(f => f.id === facilityId);
      return of(facility).pipe(delay(MOCK_DELAY));
    }
    return this.http.get<ImagingFacility>(`${this.baseUrl}/facilities/${facilityId}`);
  }

  getFacilitiesByModality(modality: ImagingModality): Observable<ImagingFacility[]> {
    if (USE_MOCK) {
      const facilities = MOCK_IMAGING_FACILITIES.filter(f => f.modalities.includes(modality));
      return of(facilities).pipe(delay(MOCK_DELAY));
    }
    return this.http.get<ImagingFacility[]>(`${this.baseUrl}/facilities`, {
      params: { modality }
    });
  }

  // ==================== Statistics ====================

  getOrderStatistics(params: { patientId?: string; dateFrom?: string; dateTo?: string } = {}): Observable<{
    total: number;
    byStatus: Record<ImagingOrderStatus, number>;
    byModality: Record<ImagingModality, number>;
    criticalFindings: number;
    pendingReview: number;
  }> {
    if (USE_MOCK) {
      const orders = this.filterMockOrders(params);
      const byStatus = {} as Record<ImagingOrderStatus, number>;
      const byModality = {} as Record<ImagingModality, number>;

      orders.forEach(order => {
        byStatus[order.status] = (byStatus[order.status] || 0) + 1;
        byModality[order.modality] = (byModality[order.modality] || 0) + 1;
      });

      return of({
        total: orders.length,
        byStatus,
        byModality,
        criticalFindings: orders.filter(o => o.report?.hasCriticalFindings).length,
        pendingReview: orders.filter(o =>
          ([ImagingOrderStatus.Completed, ImagingOrderStatus.Preliminary] as ImagingOrderStatus[]).includes(o.status)
        ).length
      }).pipe(delay(MOCK_DELAY));
    }

    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) httpParams = httpParams.set(key, value);
    });

    return this.http.get<any>(`${this.baseUrl}/statistics`, { params: httpParams });
  }

  // ==================== PACS Integration ====================

  getPacsViewerUrl(orderId: string): Observable<string> {
    if (USE_MOCK) {
      return of(`https://pacs.example.com/viewer?study=${orderId}`).pipe(delay(MOCK_DELAY));
    }
    return this.http.get<{ url: string }>(`${this.baseUrl}/orders/${orderId}/pacs-url`).pipe(
      map(response => response.url)
    );
  }

  // ==================== Mock Implementations ====================

  private mockGetOrders(params: ImagingSearchParams): Observable<ImagingSearchResult> {
    let orders = this.filterMockOrders(params);

    // Sort
    const sortBy = params.sortBy || 'orderedDate';
    const sortDir = params.sortDirection === 'asc' ? 1 : -1;
    orders.sort((a, b) => {
      const aVal = (a as any)[sortBy] || '';
      const bVal = (b as any)[sortBy] || '';
      return aVal < bVal ? -sortDir : aVal > bVal ? sortDir : 0;
    });

    // Paginate
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const total = orders.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    orders = orders.slice(start, start + pageSize);

    return of({
      orders,
      total,
      page,
      pageSize,
      totalPages
    }).pipe(delay(MOCK_DELAY));
  }

  private filterMockOrders(params: Partial<ImagingSearchParams>): ImagingOrder[] {
    let orders = [...MOCK_IMAGING_ORDERS];

    if (params.patientId) {
      orders = orders.filter(o => o.patientId === params.patientId);
    }

    if (params.encounterId) {
      orders = orders.filter(o => o.encounterId === params.encounterId);
    }

    if (params.modality) {
      orders = orders.filter(o => o.modality === params.modality);
    }

    if (params.status) {
      const statuses = Array.isArray(params.status) ? params.status : [params.status];
      orders = orders.filter(o => statuses.includes(o.status));
    }

    if (params.priority) {
      orders = orders.filter(o => o.priority === params.priority);
    }

    if (params.bodyRegion) {
      orders = orders.filter(o => o.bodyRegion === params.bodyRegion);
    }

    if (params.facilityId) {
      orders = orders.filter(o => o.performingFacility?.id === params.facilityId);
    }

    if (params.orderingProviderId) {
      orders = orders.filter(o => o.orderingProvider?.id === params.orderingProviderId || o.orderingProviderId === params.orderingProviderId);
    }

    if (params.hasCriticalFindings !== undefined) {
      orders = orders.filter(o => (o.report?.hasCriticalFindings || false) === params.hasCriticalFindings);
    }

    if (params.dateFrom) {
      const from = new Date(params.dateFrom);
      orders = orders.filter(o => new Date(o.orderedDate) >= from);
    }

    if (params.dateTo) {
      const to = new Date(params.dateTo);
      orders = orders.filter(o => new Date(o.orderedDate) <= to);
    }

    if (params.searchTerm) {
      const term = params.searchTerm.toLowerCase();
      orders = orders.filter(o =>
        (o.procedureName || '').toLowerCase().includes(term) ||
        o.orderId.toLowerCase().includes(term) ||
        o.accessionNumber?.toLowerCase().includes(term) ||
        (o.orderingProvider?.name || o.orderingProviderName || '').toLowerCase().includes(term)
      );
    }

    return orders;
  }

  private mockGetOrderById(orderId: string): Observable<ImagingOrder> {
    const order = MOCK_IMAGING_ORDERS.find(o => o.orderId === orderId);
    if (!order) {
      return throwError(() => new Error('Order not found')).pipe(delay(MOCK_DELAY));
    }
    return of(order).pipe(delay(MOCK_DELAY));
  }

  private mockCreateOrder(order: Partial<ImagingOrder>): Observable<ImagingOrder> {
    const newOrder: ImagingOrder = {
      orderId: `IMG-${Date.now()}`,
      accessionNumber: `ACC-${Date.now()}`,
      patientId: order.patientId || '',
      modality: order.modality || ImagingModality.XRay,
      procedure: order.procedure || '',
      procedureCode: order.procedureCode || '',
      procedureName: order.procedureName || '',
      bodyRegion: order.bodyRegion || BodyRegion.Chest,
      status: ImagingOrderStatus.Pending,
      priority: order.priority || ImagingPriority.Routine,
      category: order.category || 'diagnostic',
      contrastRequired: order.contrastRequired || false,
      orderingProviderId: order.orderingProviderId || '',
      orderingProviderName: order.orderingProviderName || '',
      orderingProvider: order.orderingProvider || { id: '', name: '' },
      orderedDate: new Date().toISOString(),
      diagnosisCodes: order.diagnosisCodes || [],
      createdAt: new Date().toISOString(),
      createdBy: order.createdBy || 'current-user',
      updatedAt: new Date().toISOString(),
      updatedBy: order.updatedBy || 'current-user',
      ...order
    };

    MOCK_IMAGING_ORDERS.unshift(newOrder);
    return of(newOrder).pipe(delay(MOCK_DELAY));
  }

  private mockUpdateOrder(orderId: string, updates: Partial<ImagingOrder>): Observable<ImagingOrder> {
    const index = MOCK_IMAGING_ORDERS.findIndex(o => o.orderId === orderId);
    if (index === -1) {
      return throwError(() => new Error('Order not found')).pipe(delay(MOCK_DELAY));
    }

    MOCK_IMAGING_ORDERS[index] = { ...MOCK_IMAGING_ORDERS[index], ...updates };
    return of(MOCK_IMAGING_ORDERS[index]).pipe(delay(MOCK_DELAY));
  }

  private mockGetProcedures(params: ProcedureSearchParams): Observable<ImagingProcedure[]> {
    let procedures = [...MOCK_IMAGING_PROCEDURES];

    if (params.modality) {
      procedures = procedures.filter(p => p.modality === params.modality);
    }

    if (params.bodyRegion) {
      procedures = procedures.filter(p => p.bodyRegion === params.bodyRegion);
    }

    if (params.commonOnly) {
      procedures = procedures.filter(p => p.isCommon);
    }

    if (params.searchTerm) {
      const term = params.searchTerm.toLowerCase();
      procedures = procedures.filter(p =>
        (p.procedureName || p.name || '').toLowerCase().includes(term) ||
        p.procedureCode.toLowerCase().includes(term) ||
        p.cptCode?.toLowerCase().includes(term)
      );
    }

    return of(procedures).pipe(delay(MOCK_DELAY));
  }
}
