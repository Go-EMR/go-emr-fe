// Report Definition Models
export interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  category: ReportCategory;
  type: ReportType;
  parameters: ReportParameter[];
  columns: ReportColumn[];
  defaultSort?: { field: string; direction: 'asc' | 'desc' };
  scheduling?: ReportSchedule;
  permissions: string[];
  isFavorite?: boolean;
  lastRun?: Date;
  createdBy: string;
  createdDate: Date;
}

export type ReportCategory = 
  | 'clinical'
  | 'financial'
  | 'operational'
  | 'quality'
  | 'regulatory'
  | 'custom';

export type ReportType = 
  | 'tabular'
  | 'summary'
  | 'chart'
  | 'dashboard'
  | 'export';

export interface ReportParameter {
  id: string;
  name: string;
  label: string;
  type: 'date' | 'daterange' | 'select' | 'multiselect' | 'text' | 'number' | 'boolean' | 'provider' | 'patient' | 'location';
  required: boolean;
  defaultValue?: any;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface ReportColumn {
  id: string;
  name: string;
  label: string;
  type: 'string' | 'number' | 'currency' | 'date' | 'datetime' | 'percentage' | 'boolean' | 'link';
  sortable?: boolean;
  filterable?: boolean;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  format?: string;
  width?: string;
  hidden?: boolean;
}

export interface ReportSchedule {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv';
  lastRun?: Date;
  nextRun?: Date;
}

// Report Execution Models
export interface ReportExecution {
  id: string;
  reportId: string;
  reportName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  parameters: Record<string, any>;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  rowCount?: number;
  fileSize?: number;
  outputFormat: 'view' | 'pdf' | 'excel' | 'csv';
  outputUrl?: string;
  error?: string;
  executedBy: string;
}

export interface ReportResult {
  reportId: string;
  executionId: string;
  generatedAt: Date;
  parameters: Record<string, any>;
  columns: ReportColumn[];
  data: Record<string, any>[];
  totals?: Record<string, any>;
  summary?: ReportSummary;
  charts?: ReportChart[];
  pagination?: {
    page: number;
    pageSize: number;
    totalRows: number;
    totalPages: number;
  };
}

export interface ReportSummary {
  title: string;
  metrics: SummaryMetric[];
  insights?: string[];
}

export interface SummaryMetric {
  label: string;
  value: number | string;
  format?: 'number' | 'currency' | 'percentage';
  trend?: {
    direction: 'up' | 'down' | 'flat';
    value: number;
    period: string;
  };
  color?: string;
}

export interface ReportChart {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'donut' | 'area' | 'scatter';
  title: string;
  data: ChartDataPoint[];
  config?: {
    xAxis?: string;
    yAxis?: string;
    colors?: string[];
    legend?: boolean;
    stacked?: boolean;
  };
}

export interface ChartDataPoint {
  label: string;
  value: number;
  category?: string;
  color?: string;
  [key: string]: any;
}

// Clinical Report Specific Models
export interface PatientListReport {
  patientId: string;
  mrn: string;
  name: string;
  dateOfBirth: Date;
  age: number;
  gender: string;
  phone?: string;
  email?: string;
  primaryProvider?: string;
  lastVisit?: Date;
  nextAppointment?: Date;
  conditions?: string[];
  medications?: string[];
  insuranceStatus?: string;
}

export interface AppointmentReport {
  appointmentId: string;
  date: Date;
  time: string;
  duration: number;
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  appointmentType: string;
  status: string;
  location: string;
  reason?: string;
  notes?: string;
}

export interface EncounterReport {
  encounterId: string;
  date: Date;
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  encounterType: string;
  diagnoses: string[];
  procedures: string[];
  duration?: number;
  billingStatus?: string;
  signedDate?: Date;
}

export interface PrescriptionReport {
  prescriptionId: string;
  date: Date;
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  medication: string;
  dosage: string;
  frequency: string;
  quantity: number;
  refills: number;
  status: string;
  pharmacy?: string;
  controlled?: boolean;
}

export interface LabResultReport {
  orderId: string;
  collectionDate: Date;
  resultDate?: Date;
  patientId: string;
  patientName: string;
  orderingProvider: string;
  testName: string;
  result?: string;
  units?: string;
  referenceRange?: string;
  status: string;
  abnormalFlag?: 'normal' | 'low' | 'high' | 'critical';
}

export interface ImmunizationReport {
  patientId: string;
  patientName: string;
  dateOfBirth: Date;
  vaccine: string;
  administrationDate: Date;
  doseNumber: number;
  lotNumber?: string;
  site?: string;
  administrator?: string;
  nextDueDate?: Date;
  series?: string;
  status: 'complete' | 'due' | 'overdue' | 'contraindicated';
}

// Financial Report Specific Models
export interface RevenueReport {
  period: string;
  date: Date;
  grossCharges: number;
  contractualAdjustments: number;
  otherAdjustments: number;
  netRevenue: number;
  patientPayments: number;
  insurancePayments: number;
  totalCollections: number;
  outstandingAR: number;
  collectionRate: number;
}

export interface ClaimsAgingReport {
  ageBucket: string;
  claimCount: number;
  totalAmount: number;
  percentOfTotal: number;
  byPayer?: { payer: string; count: number; amount: number }[];
}

export interface PayerMixReport {
  payer: string;
  payerType: string;
  patientCount: number;
  claimCount: number;
  chargesAmount: number;
  paymentsAmount: number;
  adjustmentsAmount: number;
  percentOfRevenue: number;
  avgReimbursementRate: number;
}

export interface DenialReport {
  claimId: string;
  claimNumber: string;
  serviceDate: Date;
  patientName: string;
  payer: string;
  chargedAmount: number;
  deniedAmount: number;
  denialCode: string;
  denialReason: string;
  denialCategory: string;
  appealStatus?: string;
  daysSinceDenial: number;
}

export interface ProductivityReport {
  providerId: string;
  providerName: string;
  specialty: string;
  period: string;
  encounterCount: number;
  patientCount: number;
  newPatients: number;
  procedures: number;
  rvus: number;
  charges: number;
  collections: number;
  avgEncounterTime: number;
  noShowRate: number;
}

// Quality Measure Models
export interface QualityTrend {
  direction: 'up' | 'down' | 'flat';
  value: number;
  history: { period: string; rate: number }[];
}

export interface QualityMeasure {
  measureId: string;
  measureName: string;
  description: string;
  category: 'preventive' | 'chronic' | 'behavioral' | 'safety' | 'efficiency';
  numerator: number;
  denominator: number;
  rate: number;
  benchmark?: number;
  target?: number;
  trend?: QualityTrend;
  status: 'met' | 'not_met' | 'pending';
  patientList?: QualityPatient[];
}

export interface QualityPatient {
  patientId: string;
  patientName: string;
  dateOfBirth: Date;
  measureStatus: 'compliant' | 'non_compliant' | 'excluded';
  lastServiceDate?: Date;
  gapReason?: string;
  nextAction?: string;
  dueDate?: Date;
}

export interface CareGap extends QualityPatient {
  measureId: string;
  measureName: string;
}

// Dashboard Models
export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'list' | 'calendar';
  title: string;
  size: 'small' | 'medium' | 'large' | 'full';
  position: { row: number; col: number };
  config: Record<string, any>;
  data?: any;
  refreshInterval?: number;
  lastRefresh?: Date;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  category: 'clinical' | 'financial' | 'operational' | 'executive';
  widgets: DashboardWidget[];
  filters?: ReportParameter[];
  permissions: string[];
  isDefault?: boolean;
  createdBy: string;
  createdDate: Date;
  modifiedDate?: Date;
}

// Saved Report / Export Models
export interface SavedReport {
  id: string;
  name: string;
  reportDefinitionId: string;
  parameters: Record<string, any>;
  schedule?: ReportSchedule;
  createdBy: string;
  createdDate: Date;
  lastRun?: Date;
  isFavorite?: boolean;
}

export interface ReportExport {
  executionId: string;
  format: 'pdf' | 'excel' | 'csv' | 'json';
  fileName: string;
  fileSize: number;
  generatedAt: Date;
  downloadUrl: string;
  expiresAt: Date;
}
