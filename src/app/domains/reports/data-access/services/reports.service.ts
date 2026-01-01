import { Injectable, signal, computed } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import {
  ReportDefinition,
  ReportResult,
  ReportExecution,
  Dashboard,
  SavedReport,
  QualityMeasure,
  RevenueReport,
  ClaimsAgingReport,
  ProductivityReport,
  DenialReport,
  PatientListReport,
  AppointmentReport
} from '../models/reports.model';
import { MOCK_REPORT_DEFINITIONS, MOCK_DASHBOARDS, MOCK_QUALITY_MEASURES } from './mock-data/reports.mock';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  // State
  private reportDefinitions = signal<ReportDefinition[]>(MOCK_REPORT_DEFINITIONS);
  private dashboards = signal<Dashboard[]>(MOCK_DASHBOARDS);
  readonly recentExecutions = signal<ReportExecution[]>([]);
  private savedReports = signal<SavedReport[]>([]);

  // Computed
  clinicalReports = computed(() => 
    this.reportDefinitions().filter(r => r.category === 'clinical')
  );

  financialReports = computed(() => 
    this.reportDefinitions().filter(r => r.category === 'financial')
  );

  operationalReports = computed(() => 
    this.reportDefinitions().filter(r => r.category === 'operational')
  );

  qualityReports = computed(() => 
    this.reportDefinitions().filter(r => r.category === 'quality')
  );

  favoriteReports = computed(() => 
    this.reportDefinitions().filter(r => r.isFavorite)
  );

  // Report Definitions
  getReportDefinitions(): Observable<ReportDefinition[]> {
    return of(this.reportDefinitions()).pipe(delay(300));
  }

  getReportDefinition(id: string): Observable<ReportDefinition | undefined> {
    return of(this.reportDefinitions().find(r => r.id === id)).pipe(delay(200));
  }

  getReportsByCategory(category: string): Observable<ReportDefinition[]> {
    return of(this.reportDefinitions().filter(r => r.category === category)).pipe(delay(300));
  }

  // Report Execution
  executeReport(reportId: string, parameters: Record<string, any>): Observable<ReportResult> {
    const report = this.reportDefinitions().find(r => r.id === reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    // Generate mock data based on report type
    const result = this.generateMockReportData(report, parameters);
    return of(result).pipe(delay(800));
  }

  private generateMockReportData(report: ReportDefinition, parameters: Record<string, any>): ReportResult {
    const executionId = `exec-${Date.now()}`;
    
    return {
      reportId: report.id,
      executionId,
      generatedAt: new Date(),
      parameters,
      columns: report.columns,
      data: this.getMockDataForReport(report.id),
      totals: this.getMockTotalsForReport(report.id),
      summary: {
        title: report.name,
        metrics: this.getMockMetricsForReport(report.id),
        insights: this.getMockInsightsForReport(report.id)
      },
      pagination: {
        page: 1,
        pageSize: 25,
        totalRows: 100,
        totalPages: 4
      }
    };
  }

  private getMockDataForReport(reportId: string): Record<string, any>[] {
    // Return different mock data based on report type
    switch (reportId) {
      case 'patient-list':
        return this.generatePatientListData();
      case 'appointment-schedule':
        return this.generateAppointmentData();
      case 'revenue-summary':
        return this.generateRevenueData();
      case 'claims-aging':
        return this.generateClaimsAgingData();
      case 'provider-productivity':
        return this.generateProductivityData();
      case 'denial-analysis':
        return this.generateDenialData();
      default:
        return [];
    }
  }

  private getMockTotalsForReport(reportId: string): Record<string, any> {
    switch (reportId) {
      case 'revenue-summary':
        return {
          grossCharges: 485000,
          netRevenue: 365000,
          totalCollections: 342000,
          collectionRate: 93.7
        };
      case 'claims-aging':
        return {
          totalClaims: 456,
          totalAmount: 245680
        };
      default:
        return {};
    }
  }

  private getMockMetricsForReport(reportId: string): any[] {
    switch (reportId) {
      case 'revenue-summary':
        return [
          { label: 'Gross Charges', value: 485000, format: 'currency', trend: { direction: 'up', value: 5.2, period: 'vs last month' } },
          { label: 'Collection Rate', value: 93.7, format: 'percentage', trend: { direction: 'up', value: 1.5, period: 'vs last month' } },
          { label: 'Days in A/R', value: 32, format: 'number', trend: { direction: 'down', value: 3, period: 'vs last month' } }
        ];
      case 'provider-productivity':
        return [
          { label: 'Total Encounters', value: 1256, format: 'number' },
          { label: 'Avg Per Provider', value: 157, format: 'number' },
          { label: 'Total RVUs', value: 4520, format: 'number' }
        ];
      default:
        return [];
    }
  }

  private getMockInsightsForReport(reportId: string): string[] {
    switch (reportId) {
      case 'revenue-summary':
        return [
          'Collection rate improved by 1.5% compared to previous month',
          'Blue Cross Blue Shield accounts for 35% of total revenue',
          'Self-pay collections are below target by 8%'
        ];
      case 'denial-analysis':
        return [
          'Missing/invalid authorization accounts for 28% of denials',
          'Radiology department has highest denial rate at 12%',
          'Average appeal success rate is 65%'
        ];
      default:
        return [];
    }
  }

  private generatePatientListData(): PatientListReport[] {
    return [
      { patientId: 'PAT001', mrn: 'MRN-001234', name: 'John Smith', dateOfBirth: new Date('1985-03-15'), age: 39, gender: 'Male', phone: '(555) 123-4567', primaryProvider: 'Dr. Sarah Wilson', lastVisit: new Date('2024-12-15'), conditions: ['Hypertension', 'Type 2 Diabetes'], insuranceStatus: 'Active' },
      { patientId: 'PAT002', mrn: 'MRN-001235', name: 'Sarah Johnson', dateOfBirth: new Date('1972-08-22'), age: 52, gender: 'Female', phone: '(555) 234-5678', primaryProvider: 'Dr. James Chen', lastVisit: new Date('2024-12-10'), conditions: ['Asthma'], insuranceStatus: 'Active' },
      { patientId: 'PAT003', mrn: 'MRN-001236', name: 'Michael Chen', dateOfBirth: new Date('1990-11-30'), age: 34, gender: 'Male', phone: '(555) 345-6789', primaryProvider: 'Dr. Maria Garcia', lastVisit: new Date('2024-11-28'), conditions: [], insuranceStatus: 'Pending' },
      { patientId: 'PAT004', mrn: 'MRN-001237', name: 'Emily Davis', dateOfBirth: new Date('1968-05-12'), age: 56, gender: 'Female', phone: '(555) 456-7890', primaryProvider: 'Dr. Sarah Wilson', lastVisit: new Date('2024-12-18'), conditions: ['COPD', 'Heart Failure'], insuranceStatus: 'Active' },
      { patientId: 'PAT005', mrn: 'MRN-001238', name: 'Robert Wilson', dateOfBirth: new Date('1955-01-08'), age: 69, gender: 'Male', phone: '(555) 567-8901', primaryProvider: 'Dr. Robert Brown', lastVisit: new Date('2024-12-01'), conditions: ['Arthritis'], insuranceStatus: 'Medicare' }
    ];
  }

  private generateAppointmentData(): AppointmentReport[] {
    return [
      { appointmentId: 'APT001', date: new Date('2024-12-30'), time: '09:00', duration: 30, patientId: 'PAT001', patientName: 'John Smith', providerId: 'PROV001', providerName: 'Dr. Sarah Wilson', appointmentType: 'Follow-up', status: 'Scheduled', location: 'Main Clinic', reason: 'Diabetes management' },
      { appointmentId: 'APT002', date: new Date('2024-12-30'), time: '09:30', duration: 45, patientId: 'PAT002', patientName: 'Sarah Johnson', providerId: 'PROV001', providerName: 'Dr. Sarah Wilson', appointmentType: 'New Patient', status: 'Confirmed', location: 'Main Clinic', reason: 'Initial consultation' },
      { appointmentId: 'APT003', date: new Date('2024-12-30'), time: '10:15', duration: 30, patientId: 'PAT003', patientName: 'Michael Chen', providerId: 'PROV002', providerName: 'Dr. James Chen', appointmentType: 'Annual Physical', status: 'Checked-in', location: 'East Wing', reason: 'Annual wellness visit' },
      { appointmentId: 'APT004', date: new Date('2024-12-30'), time: '11:00', duration: 30, patientId: 'PAT004', patientName: 'Emily Davis', providerId: 'PROV001', providerName: 'Dr. Sarah Wilson', appointmentType: 'Follow-up', status: 'No-show', location: 'Main Clinic', reason: 'COPD follow-up' },
      { appointmentId: 'APT005', date: new Date('2024-12-30'), time: '14:00', duration: 60, patientId: 'PAT005', patientName: 'Robert Wilson', providerId: 'PROV003', providerName: 'Dr. Maria Garcia', appointmentType: 'Procedure', status: 'Scheduled', location: 'Procedure Suite', reason: 'Joint injection' }
    ];
  }

  private generateRevenueData(): RevenueReport[] {
    return [
      { period: 'Dec 2024', date: new Date('2024-12-01'), grossCharges: 485000, contractualAdjustments: 95000, otherAdjustments: 25000, netRevenue: 365000, patientPayments: 42000, insurancePayments: 300000, totalCollections: 342000, outstandingAR: 125000, collectionRate: 93.7 },
      { period: 'Nov 2024', date: new Date('2024-11-01'), grossCharges: 465000, contractualAdjustments: 92000, otherAdjustments: 23000, netRevenue: 350000, patientPayments: 38000, insurancePayments: 285000, totalCollections: 323000, outstandingAR: 118000, collectionRate: 92.3 },
      { period: 'Oct 2024', date: new Date('2024-10-01'), grossCharges: 478000, contractualAdjustments: 94000, otherAdjustments: 24000, netRevenue: 360000, patientPayments: 40000, insurancePayments: 295000, totalCollections: 335000, outstandingAR: 112000, collectionRate: 93.1 },
      { period: 'Sep 2024', date: new Date('2024-09-01'), grossCharges: 452000, contractualAdjustments: 88000, otherAdjustments: 22000, netRevenue: 342000, patientPayments: 35000, insurancePayments: 280000, totalCollections: 315000, outstandingAR: 108000, collectionRate: 92.1 },
      { period: 'Aug 2024', date: new Date('2024-08-01'), grossCharges: 445000, contractualAdjustments: 86000, otherAdjustments: 21000, netRevenue: 338000, patientPayments: 33000, insurancePayments: 275000, totalCollections: 308000, outstandingAR: 105000, collectionRate: 91.1 }
    ];
  }

  private generateClaimsAgingData(): ClaimsAgingReport[] {
    return [
      { ageBucket: 'Current (0-30)', claimCount: 156, totalAmount: 85400, percentOfTotal: 34.8, byPayer: [{ payer: 'BCBS', count: 52, amount: 28500 }, { payer: 'Aetna', count: 38, amount: 21200 }] },
      { ageBucket: '31-60 Days', claimCount: 98, totalAmount: 62300, percentOfTotal: 25.4, byPayer: [{ payer: 'BCBS', count: 35, amount: 22100 }, { payer: 'United', count: 28, amount: 18500 }] },
      { ageBucket: '61-90 Days', claimCount: 72, totalAmount: 45600, percentOfTotal: 18.6, byPayer: [{ payer: 'Medicare', count: 28, amount: 18200 }, { payer: 'Aetna', count: 22, amount: 14100 }] },
      { ageBucket: '91-120 Days', claimCount: 58, totalAmount: 28900, percentOfTotal: 11.8, byPayer: [{ payer: 'Medicaid', count: 25, amount: 12500 }, { payer: 'BCBS', count: 18, amount: 9200 }] },
      { ageBucket: '120+ Days', claimCount: 72, totalAmount: 23480, percentOfTotal: 9.6, byPayer: [{ payer: 'Self Pay', count: 35, amount: 11200 }, { payer: 'Other', count: 22, amount: 7800 }] }
    ];
  }

  private generateProductivityData(): ProductivityReport[] {
    return [
      { providerId: 'PROV001', providerName: 'Dr. Sarah Wilson', specialty: 'Internal Medicine', period: 'Dec 2024', encounterCount: 185, patientCount: 156, newPatients: 28, procedures: 45, rvus: 680, charges: 125000, collections: 98500, avgEncounterTime: 22, noShowRate: 5.2 },
      { providerId: 'PROV002', providerName: 'Dr. James Chen', specialty: 'Family Medicine', period: 'Dec 2024', encounterCount: 172, patientCount: 148, newPatients: 32, procedures: 38, rvus: 625, charges: 118000, collections: 92800, avgEncounterTime: 20, noShowRate: 4.8 },
      { providerId: 'PROV003', providerName: 'Dr. Maria Garcia', specialty: 'Cardiology', period: 'Dec 2024', encounterCount: 145, patientCount: 125, newPatients: 18, procedures: 62, rvus: 890, charges: 185000, collections: 152000, avgEncounterTime: 28, noShowRate: 3.5 },
      { providerId: 'PROV004', providerName: 'Dr. Robert Brown', specialty: 'Orthopedics', period: 'Dec 2024', encounterCount: 128, patientCount: 112, newPatients: 22, procedures: 85, rvus: 1250, charges: 245000, collections: 198000, avgEncounterTime: 32, noShowRate: 4.2 },
      { providerId: 'PROV005', providerName: 'Dr. Jennifer Lee', specialty: 'Pediatrics', period: 'Dec 2024', encounterCount: 198, patientCount: 175, newPatients: 45, procedures: 28, rvus: 520, charges: 95000, collections: 78500, avgEncounterTime: 18, noShowRate: 6.8 }
    ];
  }

  private generateDenialData(): DenialReport[] {
    return [
      { claimId: 'CLM001', claimNumber: 'CLM-2024-001234', serviceDate: new Date('2024-11-15'), patientName: 'John Smith', payer: 'Blue Cross Blue Shield', chargedAmount: 450.00, deniedAmount: 450.00, denialCode: 'CO-4', denialReason: 'Procedure code inconsistent with modifier', denialCategory: 'Coding Error', appealStatus: 'Pending', daysSinceDenial: 28 },
      { claimId: 'CLM002', claimNumber: 'CLM-2024-001235', serviceDate: new Date('2024-11-18'), patientName: 'Sarah Johnson', payer: 'Aetna', chargedAmount: 1250.00, deniedAmount: 1250.00, denialCode: 'CO-197', denialReason: 'Prior authorization required', denialCategory: 'Authorization', appealStatus: 'In Review', daysSinceDenial: 25 },
      { claimId: 'CLM003', claimNumber: 'CLM-2024-001236', serviceDate: new Date('2024-11-22'), patientName: 'Michael Chen', payer: 'United Healthcare', chargedAmount: 320.00, deniedAmount: 320.00, denialCode: 'PR-1', denialReason: 'Deductible not met', denialCategory: 'Patient Responsibility', daysSinceDenial: 21 },
      { claimId: 'CLM004', claimNumber: 'CLM-2024-001237', serviceDate: new Date('2024-12-01'), patientName: 'Emily Davis', payer: 'Medicare', chargedAmount: 875.00, deniedAmount: 875.00, denialCode: 'CO-16', denialReason: 'Claim lacks information needed for adjudication', denialCategory: 'Documentation', appealStatus: 'Not Filed', daysSinceDenial: 12 },
      { claimId: 'CLM005', claimNumber: 'CLM-2024-001238', serviceDate: new Date('2024-12-05'), patientName: 'Robert Wilson', payer: 'Cigna', chargedAmount: 2100.00, deniedAmount: 2100.00, denialCode: 'CO-29', denialReason: 'Timely filing limit exceeded', denialCategory: 'Timely Filing', daysSinceDenial: 8 }
    ];
  }

  // Quality Measures
  getQualityMeasures(): Observable<QualityMeasure[]> {
    return of(MOCK_QUALITY_MEASURES).pipe(delay(500));
  }

  getQualityMeasure(measureId: string): Observable<QualityMeasure | undefined> {
    return of(MOCK_QUALITY_MEASURES.find(m => m.measureId === measureId)).pipe(delay(300));
  }

  // Dashboards
  getDashboards(): Observable<Dashboard[]> {
    return of(this.dashboards()).pipe(delay(300));
  }

  getDashboard(id: string): Observable<Dashboard | undefined> {
    return of(this.dashboards().find(d => d.id === id)).pipe(delay(200));
  }

  // Saved Reports
  getSavedReports(): Observable<SavedReport[]> {
    return of(this.savedReports()).pipe(delay(300));
  }

  saveReport(report: Omit<SavedReport, 'id' | 'createdDate'>): Observable<SavedReport> {
    const newReport: SavedReport = {
      ...report,
      id: `saved-${Date.now()}`,
      createdDate: new Date()
    };
    this.savedReports.update(reports => [...reports, newReport]);
    return of(newReport).pipe(delay(300));
  }

  // Recent Executions
  getRecentExecutions(): Observable<ReportExecution[]> {
    return of(this.recentExecutions()).pipe(delay(300));
  }

  // Export
  exportReport(executionId: string, format: 'pdf' | 'excel' | 'csv'): Observable<{ downloadUrl: string }> {
    return of({
      downloadUrl: `/api/reports/export/${executionId}.${format}`
    }).pipe(delay(500));
  }

  // Toggle Favorite
  toggleFavorite(reportId: string): void {
    this.reportDefinitions.update(reports =>
      reports.map(r =>
        r.id === reportId ? { ...r, isFavorite: !r.isFavorite } : r
      )
    );
  }
}
