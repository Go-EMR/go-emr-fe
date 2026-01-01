import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay, map } from 'rxjs';
import {
  LabOrder,
  LabTest,
  LabPanel,
  LabFacility,
  LabResult,
  LabOrderStatus,
  LabPriority,
  LabCategory
} from '../models/lab.model';
import {
  MOCK_LAB_ORDERS,
  MOCK_LAB_TESTS,
  MOCK_LAB_PANELS,
  MOCK_LAB_FACILITIES
} from './mock-data/labs.mock';

const USE_MOCK = true;
const API_DELAY = 300;

export interface LabOrderSearchParams {
  patientId?: string;
  status?: LabOrderStatus | LabOrderStatus[];
  priority?: LabPriority;
  category?: LabCategory;
  dateFrom?: string;
  dateTo?: string;
  orderingProviderId?: string;
  facilityId?: string;
  hasAbnormalResults?: boolean;
  hasCriticalResults?: boolean;
  searchTerm?: string;
  page?: number;
  pageSize?: number;
}

export interface LabOrderSearchResult {
  orders: LabOrder[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PatientLabHistory {
  patientId: string;
  orders: LabOrder[];
  recentTests: { test: LabTest; lastResult: LabResult; lastOrderDate: Date }[];
  pendingOrders: number;
  abnormalResults: number;
}

@Injectable({
  providedIn: 'root'
})
export class LabService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/labs';

  // ============ Lab Orders ============

  getLabOrders(params: LabOrderSearchParams = {}): Observable<LabOrderSearchResult> {
    if (USE_MOCK) {
      return this.mockGetLabOrders(params);
    }

    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => httpParams = httpParams.append(key, v));
        } else {
          httpParams = httpParams.set(key, String(value));
        }
      }
    });

    return this.http.get<LabOrderSearchResult>(`${this.apiUrl}/orders`, { params: httpParams });
  }

  getLabOrder(orderId: string): Observable<LabOrder | null> {
    if (USE_MOCK) {
      return this.mockGetLabOrder(orderId);
    }
    return this.http.get<LabOrder>(`${this.apiUrl}/orders/${orderId}`);
  }

  createLabOrder(order: Partial<LabOrder>): Observable<LabOrder> {
    if (USE_MOCK) {
      return this.mockCreateLabOrder(order);
    }
    return this.http.post<LabOrder>(`${this.apiUrl}/orders`, order);
  }

  updateLabOrder(orderId: string, updates: Partial<LabOrder>): Observable<LabOrder> {
    if (USE_MOCK) {
      return this.mockUpdateLabOrder(orderId, updates);
    }
    return this.http.patch<LabOrder>(`${this.apiUrl}/orders/${orderId}`, updates);
  }

  cancelLabOrder(orderId: string, reason: string): Observable<LabOrder> {
    if (USE_MOCK) {
      return this.mockCancelLabOrder(orderId, reason);
    }
    return this.http.post<LabOrder>(`${this.apiUrl}/orders/${orderId}/cancel`, { reason });
  }

  submitLabOrder(orderId: string): Observable<LabOrder> {
    if (USE_MOCK) {
      return this.mockSubmitLabOrder(orderId);
    }
    return this.http.post<LabOrder>(`${this.apiUrl}/orders/${orderId}/submit`, {});
  }

  // ============ Lab Tests & Panels ============

  searchTests(query: string, category?: LabCategory): Observable<LabTest[]> {
    if (USE_MOCK) {
      return this.mockSearchTests(query, category);
    }

    let params = new HttpParams().set('q', query);
    if (category) {
      params = params.set('category', category);
    }
    return this.http.get<LabTest[]>(`${this.apiUrl}/tests/search`, { params });
  }

  getTestByCode(testCode: string): Observable<LabTest | null> {
    if (USE_MOCK) {
      const test = MOCK_LAB_TESTS.find(t => t.testCode === testCode) || null;
      return of(test).pipe(delay(API_DELAY));
    }
    return this.http.get<LabTest>(`${this.apiUrl}/tests/${testCode}`);
  }

  getCommonTests(): Observable<LabTest[]> {
    if (USE_MOCK) {
      return of(MOCK_LAB_TESTS.slice(0, 15)).pipe(delay(API_DELAY));
    }
    return this.http.get<LabTest[]>(`${this.apiUrl}/tests/common`);
  }

  getTestsByCategory(category: LabCategory): Observable<LabTest[]> {
    if (USE_MOCK) {
      const tests = MOCK_LAB_TESTS.filter(t => t.category === category);
      return of(tests).pipe(delay(API_DELAY));
    }
    return this.http.get<LabTest[]>(`${this.apiUrl}/tests/category/${category}`);
  }

  searchPanels(query: string): Observable<LabPanel[]> {
    if (USE_MOCK) {
      return this.mockSearchPanels(query);
    }
    return this.http.get<LabPanel[]>(`${this.apiUrl}/panels/search`, {
      params: new HttpParams().set('q', query)
    });
  }

  getPanel(panelCode: string): Observable<LabPanel | null> {
    if (USE_MOCK) {
      const panel = MOCK_LAB_PANELS.find(p => p.panelCode === panelCode) || null;
      return of(panel).pipe(delay(API_DELAY));
    }
    return this.http.get<LabPanel>(`${this.apiUrl}/panels/${panelCode}`);
  }

  getCommonPanels(): Observable<LabPanel[]> {
    if (USE_MOCK) {
      return of(MOCK_LAB_PANELS.filter(p => p.isCommon)).pipe(delay(API_DELAY));
    }
    return this.http.get<LabPanel[]>(`${this.apiUrl}/panels/common`);
  }

  // ============ Lab Facilities ============

  getFacilities(): Observable<LabFacility[]> {
    if (USE_MOCK) {
      return of(MOCK_LAB_FACILITIES).pipe(delay(API_DELAY));
    }
    return this.http.get<LabFacility[]>(`${this.apiUrl}/facilities`);
  }

  getPreferredFacility(): Observable<LabFacility | null> {
    if (USE_MOCK) {
      const preferred = MOCK_LAB_FACILITIES.find(f => f.isPreferred) || null;
      return of(preferred).pipe(delay(API_DELAY));
    }
    return this.http.get<LabFacility>(`${this.apiUrl}/facilities/preferred`);
  }

  // ============ Lab Results ============

  getPatientLabHistory(patientId: string): Observable<PatientLabHistory> {
    if (USE_MOCK) {
      return this.mockGetPatientLabHistory(patientId);
    }
    return this.http.get<PatientLabHistory>(`${this.apiUrl}/patients/${patientId}/history`);
  }

  getTestResultHistory(patientId: string, testCode: string, limit = 10): Observable<LabResult[]> {
    if (USE_MOCK) {
      return this.mockGetTestResultHistory(patientId, testCode, limit);
    }
    return this.http.get<LabResult[]>(`${this.apiUrl}/patients/${patientId}/tests/${testCode}/history`, {
      params: new HttpParams().set('limit', limit.toString())
    });
  }

  acknowledgeResults(orderId: string, testCodes?: string[]): Observable<LabOrder> {
    if (USE_MOCK) {
      return this.mockAcknowledgeResults(orderId, testCodes);
    }
    return this.http.post<LabOrder>(`${this.apiUrl}/orders/${orderId}/acknowledge`, { testCodes });
  }

  addResultComment(orderId: string, testCode: string, comment: string): Observable<LabResult> {
    if (USE_MOCK) {
      return this.mockAddResultComment(orderId, testCode, comment);
    }
    return this.http.post<LabResult>(`${this.apiUrl}/orders/${orderId}/results/${testCode}/comment`, { comment });
  }

  // ============ Order Actions ============

  printRequisition(orderId: string): Observable<Blob> {
    if (USE_MOCK) {
      return of(new Blob(['PDF content'], { type: 'application/pdf' })).pipe(delay(API_DELAY));
    }
    return this.http.get(`${this.apiUrl}/orders/${orderId}/requisition`, { responseType: 'blob' });
  }

  printResults(orderId: string): Observable<Blob> {
    if (USE_MOCK) {
      return of(new Blob(['PDF content'], { type: 'application/pdf' })).pipe(delay(API_DELAY));
    }
    return this.http.get(`${this.apiUrl}/orders/${orderId}/results/print`, { responseType: 'blob' });
  }

  sendToPatientPortal(orderId: string): Observable<{ success: boolean; message: string }> {
    if (USE_MOCK) {
      return of({ success: true, message: 'Results sent to patient portal' }).pipe(delay(API_DELAY));
    }
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/orders/${orderId}/send-to-portal`, {});
  }

  // ============ Patient Search ============

  searchPatients(query: string): Observable<{ id: string; name: string; mrn: string; dob: string }[]> {
    if (USE_MOCK) {
      const mockPatients = [
        { id: 'P001', name: 'John Smith', mrn: 'MRN-001', dob: '1965-03-15' },
        { id: 'P002', name: 'Sarah Johnson', mrn: 'MRN-002', dob: '1978-07-22' },
        { id: 'P003', name: 'Michael Brown', mrn: 'MRN-003', dob: '1955-11-08' },
        { id: 'P004', name: 'Emily Davis', mrn: 'MRN-004', dob: '1990-01-30' },
        { id: 'P005', name: 'Robert Wilson', mrn: 'MRN-005', dob: '1948-09-12' },
        { id: 'P006', name: 'Jennifer Martinez', mrn: 'MRN-006', dob: '1985-04-18' }
      ];

      const filtered = mockPatients.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.mrn.toLowerCase().includes(query.toLowerCase())
      );

      return of(filtered).pipe(delay(API_DELAY));
    }

    return this.http.get<{ id: string; name: string; mrn: string; dob: string }[]>(
      `/api/patients/search`,
      { params: new HttpParams().set('q', query) }
    );
  }

  // ============ Diagnosis Search ============

  searchDiagnoses(query: string): Observable<{ code: string; description: string }[]> {
    if (USE_MOCK) {
      const mockDiagnoses = [
        { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
        { code: 'E11.65', description: 'Type 2 diabetes mellitus with hyperglycemia' },
        { code: 'E78.5', description: 'Hyperlipidemia, unspecified' },
        { code: 'E03.9', description: 'Hypothyroidism, unspecified' },
        { code: 'I10', description: 'Essential (primary) hypertension' },
        { code: 'D64.9', description: 'Anemia, unspecified' },
        { code: 'R53.83', description: 'Fatigue' },
        { code: 'Z00.00', description: 'Encounter for general adult medical examination' },
        { code: 'Z13.220', description: 'Encounter for screening for lipoid disorders' },
        { code: 'Z23', description: 'Encounter for immunization' }
      ];

      const filtered = mockDiagnoses.filter(d =>
        d.code.toLowerCase().includes(query.toLowerCase()) ||
        d.description.toLowerCase().includes(query.toLowerCase())
      );

      return of(filtered).pipe(delay(API_DELAY));
    }

    return this.http.get<{ code: string; description: string }[]>(
      `/api/diagnoses/search`,
      { params: new HttpParams().set('q', query) }
    );
  }

  // ============ Mock Implementations ============

  private mockGetLabOrders(params: LabOrderSearchParams): Observable<LabOrderSearchResult> {
    let orders = [...MOCK_LAB_ORDERS];

    if (params.patientId) {
      orders = orders.filter(o => o.patientId === params.patientId);
    }

    if (params.status) {
      const statuses = Array.isArray(params.status) ? params.status : [params.status];
      orders = orders.filter(o => statuses.includes(o.status));
    }

    if (params.priority) {
      orders = orders.filter(o => o.priority === params.priority);
    }

    if (params.hasAbnormalResults) {
      orders = orders.filter(o => o.resultsSummary === 'abnormal');
    }

    if (params.hasCriticalResults) {
      orders = orders.filter(o => o.resultsSummary === 'critical');
    }

    if (params.searchTerm) {
      const term = params.searchTerm.toLowerCase();
      orders = orders.filter(o =>
        o.patientName?.toLowerCase().includes(term) ||
        o.orderId.toLowerCase().includes(term) ||
        o.tests.some(t => t.testName.toLowerCase().includes(term))
      );
    }

    // Sort by date descending
    orders.sort((a, b) => new Date(b.orderedDate).getTime() - new Date(a.orderedDate).getTime());

    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const start = (page - 1) * pageSize;
    const paged = orders.slice(start, start + pageSize);

    return of({
      orders: paged,
      total: orders.length,
      page,
      pageSize,
      totalPages: Math.ceil(orders.length / pageSize)
    }).pipe(delay(API_DELAY));
  }

  private mockGetLabOrder(orderId: string): Observable<LabOrder | null> {
    const order = MOCK_LAB_ORDERS.find(o => o.orderId === orderId) || null;
    return of(order).pipe(delay(API_DELAY));
  }

  private mockCreateLabOrder(orderData: Partial<LabOrder>): Observable<LabOrder> {
    const orderId = `LAB-${Date.now()}`;
    const newOrder: LabOrder = {
      id: orderId,
      orderId,
      patientId: orderData.patientId ?? '',
      patientName: orderData.patientName ?? '',
      patientMRN: orderData.patientMRN ?? '',
      patientDOB: orderData.patientDOB ?? '',
      encounterId: orderData.encounterId,
      orderType: orderData.orderType ?? 'lab',
      status: 'draft',
      priority: orderData.priority ?? 'routine',
      tests: orderData.tests ?? [],
      panelCode: orderData.panelCode,
      panelName: orderData.panelName,
      orderingProviderId: orderData.orderingProviderId ?? 'PROV-001',
      orderingProviderName: orderData.orderingProviderName ?? 'Dr. Sarah Chen',
      orderingProviderNPI: orderData.orderingProviderNPI,
      performingLabId: orderData.performingLabId,
      performingLabName: orderData.performingLabName,
      collectionSiteId: orderData.collectionSiteId,
      collectionSiteName: orderData.collectionSiteName,
      diagnosisCodes: orderData.diagnosisCodes ?? [],
      clinicalNotes: orderData.clinicalNotes,
      fastingRequired: orderData.fastingRequired ?? false,
      fastingHours: orderData.fastingHours,
      orderedDate: new Date().toISOString(),
      scheduledDate: orderData.scheduledDate,
      patientInstructions: orderData.patientInstructions,
      labInstructions: orderData.labInstructions,
      createdAt: new Date().toISOString(),
      createdBy: 'current-user',
      updatedAt: new Date().toISOString(),
      updatedBy: 'current-user'
    };

    return of(newOrder).pipe(delay(API_DELAY));
  }

  private mockUpdateLabOrder(orderId: string, updates: Partial<LabOrder>): Observable<LabOrder> {
    const order = MOCK_LAB_ORDERS.find(o => o.orderId === orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const updated = {
      ...order,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: 'current-user'
    };

    return of(updated).pipe(delay(API_DELAY));
  }

  private mockCancelLabOrder(orderId: string, reason: string): Observable<LabOrder> {
    const order = MOCK_LAB_ORDERS.find(o => o.orderId === orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const cancelled: LabOrder = {
      ...order,
      status: 'cancelled',
      clinicalNotes: `${order.clinicalNotes || ''}\n\nCancellation reason: ${reason}`.trim(),
      updatedAt: new Date().toISOString(),
      updatedBy: 'current-user'
    };

    return of(cancelled).pipe(delay(API_DELAY));
  }

  private mockSubmitLabOrder(orderId: string): Observable<LabOrder> {
    const order = MOCK_LAB_ORDERS.find(o => o.orderId === orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const submitted: LabOrder = {
      ...order,
      status: 'ordered',
      orderedDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: 'current-user'
    };

    return of(submitted).pipe(delay(API_DELAY));
  }

  private mockSearchTests(query: string, category?: LabCategory): Observable<LabTest[]> {
    let tests = [...MOCK_LAB_TESTS];

    if (category) {
      tests = tests.filter(t => t.category === category);
    }

    if (query) {
      const q = query.toLowerCase();
      tests = tests.filter(t =>
        t.testName.toLowerCase().includes(q) ||
        t.testCode.toLowerCase().includes(q) ||
        t.loincCode?.toLowerCase().includes(q)
      );
    }

    return of(tests.slice(0, 20)).pipe(delay(API_DELAY));
  }

  private mockSearchPanels(query: string): Observable<LabPanel[]> {
    const q = query.toLowerCase();
    const panels = MOCK_LAB_PANELS.filter(p =>
      p.panelName.toLowerCase().includes(q) ||
      p.panelCode.toLowerCase().includes(q)
    );

    return of(panels).pipe(delay(API_DELAY));
  }

  private mockGetPatientLabHistory(patientId: string): Observable<PatientLabHistory> {
    const orders = MOCK_LAB_ORDERS.filter(o => o.patientId === patientId);
    const pendingOrders = orders.filter(o =>
      ['draft', 'pending', 'ordered', 'scheduled', 'collected', 'received', 'in-progress'].includes(o.status)
    ).length;

    const abnormalResults = orders.filter(o =>
      o.resultsSummary === 'abnormal' || o.resultsSummary === 'critical'
    ).length;

    return of({
      patientId,
      orders,
      recentTests: [],
      pendingOrders,
      abnormalResults
    }).pipe(delay(API_DELAY));
  }

  private mockGetTestResultHistory(patientId: string, testCode: string, limit: number): Observable<LabResult[]> {
    const results: LabResult[] = [];

    MOCK_LAB_ORDERS
      .filter(o => o.patientId === patientId)
      .forEach(order => {
        order.tests.forEach(test => {
          if (test.testCode === testCode && test.result) {
            results.push(test.result);
          }
        });
      });

    return of(results.slice(0, limit)).pipe(delay(API_DELAY));
  }

  private mockAcknowledgeResults(orderId: string, testCodes?: string[]): Observable<LabOrder> {
    const order = MOCK_LAB_ORDERS.find(o => o.orderId === orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const acknowledged: LabOrder = {
      ...order,
      tests: order.tests.map(test => {
        if (!testCodes || testCodes.includes(test.testCode)) {
          return {
            ...test,
            result: test.result ? {
              ...test.result,
              verifiedBy: 'current-user',
              verifiedAt: new Date().toISOString()
            } : test.result
          };
        }
        return test;
      }),
      updatedAt: new Date().toISOString(),
      updatedBy: 'current-user'
    };

    return of(acknowledged).pipe(delay(API_DELAY));
  }

  private mockAddResultComment(orderId: string, testCode: string, comment: string): Observable<LabResult> {
    const order = MOCK_LAB_ORDERS.find(o => o.orderId === orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const test = order.tests.find(t => t.testCode === testCode);
    if (!test?.result) {
      throw new Error('Result not found');
    }

    const updated: LabResult = {
      ...test.result,
      providerComments: comment
    };

    return of(updated).pipe(delay(API_DELAY));
  }
}
