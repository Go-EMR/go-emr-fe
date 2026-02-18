import { ReportDefinition, Dashboard, QualityMeasure } from '../../models/reports.model';

export const MOCK_REPORT_DEFINITIONS: ReportDefinition[] = [
  // Clinical Reports
  {
    id: 'patient-list',
    name: 'Patient List',
    description: 'Comprehensive list of patients with demographics and clinical summary',
    category: 'clinical',
    type: 'tabular',
    parameters: [
      { id: 'provider', name: 'provider', label: 'Provider', type: 'provider', required: false },
      { id: 'insuranceStatus', name: 'insuranceStatus', label: 'Insurance Status', type: 'select', required: false, options: [{ value: 'active', label: 'Active' }, { value: 'pending', label: 'Pending' }, { value: 'inactive', label: 'Inactive' }] },
      { id: 'lastVisit', name: 'lastVisit', label: 'Last Visit Range', type: 'daterange', required: false }
    ],
    columns: [
      { id: 'mrn', name: 'mrn', label: 'MRN', type: 'string', sortable: true },
      { id: 'name', name: 'name', label: 'Patient Name', type: 'link', sortable: true },
      { id: 'dateOfBirth', name: 'dateOfBirth', label: 'DOB', type: 'date', sortable: true },
      { id: 'age', name: 'age', label: 'Age', type: 'number', sortable: true },
      { id: 'gender', name: 'gender', label: 'Gender', type: 'string', sortable: true },
      { id: 'phone', name: 'phone', label: 'Phone', type: 'string' },
      { id: 'primaryProvider', name: 'primaryProvider', label: 'Primary Provider', type: 'string', sortable: true },
      { id: 'lastVisit', name: 'lastVisit', label: 'Last Visit', type: 'date', sortable: true },
      { id: 'insuranceStatus', name: 'insuranceStatus', label: 'Insurance', type: 'string', sortable: true }
    ],
    defaultSort: { field: 'name', direction: 'asc' },
    permissions: ['reports:clinical:view'],
    isFavorite: true,
    createdBy: 'System',
    createdDate: new Date('2024-01-01')
  },
  {
    id: 'appointment-schedule',
    name: 'Appointment Schedule',
    description: 'Daily, weekly, or monthly appointment schedule by provider or location',
    category: 'clinical',
    type: 'tabular',
    parameters: [
      { id: 'dateRange', name: 'dateRange', label: 'Date Range', type: 'daterange', required: true },
      { id: 'provider', name: 'provider', label: 'Provider', type: 'provider', required: false },
      { id: 'location', name: 'location', label: 'Location', type: 'location', required: false },
      { id: 'status', name: 'status', label: 'Status', type: 'multiselect', required: false, options: [{ value: 'scheduled', label: 'Scheduled' }, { value: 'confirmed', label: 'Confirmed' }, { value: 'checked-in', label: 'Checked In' }, { value: 'completed', label: 'Completed' }, { value: 'no-show', label: 'No Show' }, { value: 'cancelled', label: 'Cancelled' }] }
    ],
    columns: [
      { id: 'date', name: 'date', label: 'Date', type: 'date', sortable: true },
      { id: 'time', name: 'time', label: 'Time', type: 'string', sortable: true },
      { id: 'patientName', name: 'patientName', label: 'Patient', type: 'link', sortable: true },
      { id: 'providerName', name: 'providerName', label: 'Provider', type: 'string', sortable: true },
      { id: 'appointmentType', name: 'appointmentType', label: 'Type', type: 'string', sortable: true },
      { id: 'duration', name: 'duration', label: 'Duration', type: 'number' },
      { id: 'status', name: 'status', label: 'Status', type: 'string', sortable: true },
      { id: 'location', name: 'location', label: 'Location', type: 'string', sortable: true }
    ],
    defaultSort: { field: 'date', direction: 'asc' },
    permissions: ['reports:clinical:view'],
    createdBy: 'System',
    createdDate: new Date('2024-01-01')
  },
  {
    id: 'encounter-summary',
    name: 'Encounter Summary',
    description: 'Summary of patient encounters with diagnoses and procedures',
    category: 'clinical',
    type: 'tabular',
    parameters: [
      { id: 'dateRange', name: 'dateRange', label: 'Date Range', type: 'daterange', required: true },
      { id: 'provider', name: 'provider', label: 'Provider', type: 'provider', required: false },
      { id: 'encounterType', name: 'encounterType', label: 'Encounter Type', type: 'select', required: false, options: [{ value: 'office', label: 'Office Visit' }, { value: 'telehealth', label: 'Telehealth' }, { value: 'hospital', label: 'Hospital' }, { value: 'emergency', label: 'Emergency' }] }
    ],
    columns: [
      { id: 'date', name: 'date', label: 'Date', type: 'date', sortable: true },
      { id: 'patientName', name: 'patientName', label: 'Patient', type: 'link', sortable: true },
      { id: 'providerName', name: 'providerName', label: 'Provider', type: 'string', sortable: true },
      { id: 'encounterType', name: 'encounterType', label: 'Type', type: 'string', sortable: true },
      { id: 'diagnoses', name: 'diagnoses', label: 'Diagnoses', type: 'string' },
      { id: 'procedures', name: 'procedures', label: 'Procedures', type: 'string' },
      { id: 'billingStatus', name: 'billingStatus', label: 'Billing Status', type: 'string', sortable: true }
    ],
    permissions: ['reports:clinical:view'],
    createdBy: 'System',
    createdDate: new Date('2024-01-01')
  },
  {
    id: 'prescription-log',
    name: 'Prescription Log',
    description: 'Log of all prescriptions with controlled substance tracking',
    category: 'clinical',
    type: 'tabular',
    parameters: [
      { id: 'dateRange', name: 'dateRange', label: 'Date Range', type: 'daterange', required: true },
      { id: 'provider', name: 'provider', label: 'Provider', type: 'provider', required: false },
      { id: 'controlledOnly', name: 'controlledOnly', label: 'Controlled Substances Only', type: 'boolean', required: false, defaultValue: false }
    ],
    columns: [
      { id: 'date', name: 'date', label: 'Date', type: 'date', sortable: true },
      { id: 'patientName', name: 'patientName', label: 'Patient', type: 'link', sortable: true },
      { id: 'providerName', name: 'providerName', label: 'Provider', type: 'string', sortable: true },
      { id: 'medication', name: 'medication', label: 'Medication', type: 'string', sortable: true },
      { id: 'dosage', name: 'dosage', label: 'Dosage', type: 'string' },
      { id: 'quantity', name: 'quantity', label: 'Qty', type: 'number' },
      { id: 'refills', name: 'refills', label: 'Refills', type: 'number' },
      { id: 'controlled', name: 'controlled', label: 'Controlled', type: 'boolean' },
      { id: 'status', name: 'status', label: 'Status', type: 'string', sortable: true }
    ],
    permissions: ['reports:clinical:view'],
    createdBy: 'System',
    createdDate: new Date('2024-01-01')
  },
  {
    id: 'lab-results-pending',
    name: 'Pending Lab Results',
    description: 'List of lab orders pending results',
    category: 'clinical',
    type: 'tabular',
    parameters: [
      { id: 'dateRange', name: 'dateRange', label: 'Order Date Range', type: 'daterange', required: false },
      { id: 'provider', name: 'provider', label: 'Ordering Provider', type: 'provider', required: false }
    ],
    columns: [
      { id: 'orderDate', name: 'orderDate', label: 'Order Date', type: 'date', sortable: true },
      { id: 'patientName', name: 'patientName', label: 'Patient', type: 'link', sortable: true },
      { id: 'orderingProvider', name: 'orderingProvider', label: 'Provider', type: 'string', sortable: true },
      { id: 'testName', name: 'testName', label: 'Test', type: 'string', sortable: true },
      { id: 'status', name: 'status', label: 'Status', type: 'string', sortable: true },
      { id: 'daysPending', name: 'daysPending', label: 'Days Pending', type: 'number', sortable: true }
    ],
    permissions: ['reports:clinical:view'],
    createdBy: 'System',
    createdDate: new Date('2024-01-01')
  },
  {
    id: 'immunization-due',
    name: 'Immunizations Due',
    description: 'Patients with upcoming or overdue immunizations',
    category: 'clinical',
    type: 'tabular',
    parameters: [
      { id: 'status', name: 'status', label: 'Status', type: 'select', required: false, options: [{ value: 'due', label: 'Due' }, { value: 'overdue', label: 'Overdue' }], defaultValue: 'all' },
      { id: 'vaccine', name: 'vaccine', label: 'Vaccine Type', type: 'select', required: false, options: [{ value: 'flu', label: 'Influenza' }, { value: 'covid', label: 'COVID-19' }, { value: 'tdap', label: 'Tdap' }, { value: 'shingles', label: 'Shingles' }] }
    ],
    columns: [
      { id: 'patientName', name: 'patientName', label: 'Patient', type: 'link', sortable: true },
      { id: 'dateOfBirth', name: 'dateOfBirth', label: 'DOB', type: 'date', sortable: true },
      { id: 'vaccine', name: 'vaccine', label: 'Vaccine', type: 'string', sortable: true },
      { id: 'dueDate', name: 'dueDate', label: 'Due Date', type: 'date', sortable: true },
      { id: 'status', name: 'status', label: 'Status', type: 'string', sortable: true },
      { id: 'lastAdministered', name: 'lastAdministered', label: 'Last Given', type: 'date' }
    ],
    permissions: ['reports:clinical:view'],
    createdBy: 'System',
    createdDate: new Date('2024-01-01')
  },

  // Financial Reports
  {
    id: 'revenue-summary',
    name: 'Revenue Summary',
    description: 'Monthly revenue summary with charges, payments, and adjustments',
    category: 'financial',
    type: 'summary',
    parameters: [
      { id: 'dateRange', name: 'dateRange', label: 'Period', type: 'daterange', required: true },
      { id: 'groupBy', name: 'groupBy', label: 'Group By', type: 'select', required: false, options: [{ value: 'month', label: 'Month' }, { value: 'provider', label: 'Provider' }, { value: 'location', label: 'Location' }, { value: 'payer', label: 'Payer' }], defaultValue: 'month' }
    ],
    columns: [
      { id: 'period', name: 'period', label: 'Period', type: 'string', sortable: true },
      { id: 'grossCharges', name: 'grossCharges', label: 'Gross Charges', type: 'currency', sortable: true, aggregation: 'sum' },
      { id: 'contractualAdjustments', name: 'contractualAdjustments', label: 'Contractual Adj', type: 'currency', sortable: true, aggregation: 'sum' },
      { id: 'netRevenue', name: 'netRevenue', label: 'Net Revenue', type: 'currency', sortable: true, aggregation: 'sum' },
      { id: 'totalCollections', name: 'totalCollections', label: 'Collections', type: 'currency', sortable: true, aggregation: 'sum' },
      { id: 'outstandingAR', name: 'outstandingAR', label: 'Outstanding A/R', type: 'currency', sortable: true },
      { id: 'collectionRate', name: 'collectionRate', label: 'Collection Rate', type: 'percentage', sortable: true }
    ],
    permissions: ['reports:financial:view'],
    isFavorite: true,
    createdBy: 'System',
    createdDate: new Date('2024-01-01')
  },
  {
    id: 'claims-aging',
    name: 'Claims Aging Report',
    description: 'Accounts receivable aging by payer and age bucket',
    category: 'financial',
    type: 'summary',
    parameters: [
      { id: 'asOfDate', name: 'asOfDate', label: 'As of Date', type: 'date', required: true },
      { id: 'payer', name: 'payer', label: 'Payer', type: 'select', required: false }
    ],
    columns: [
      { id: 'ageBucket', name: 'ageBucket', label: 'Age Bucket', type: 'string', sortable: true },
      { id: 'claimCount', name: 'claimCount', label: 'Claims', type: 'number', sortable: true, aggregation: 'sum' },
      { id: 'totalAmount', name: 'totalAmount', label: 'Amount', type: 'currency', sortable: true, aggregation: 'sum' },
      { id: 'percentOfTotal', name: 'percentOfTotal', label: '% of Total', type: 'percentage', sortable: true }
    ],
    permissions: ['reports:financial:view'],
    isFavorite: true,
    createdBy: 'System',
    createdDate: new Date('2024-01-01')
  },
  {
    id: 'denial-analysis',
    name: 'Denial Analysis',
    description: 'Analysis of claim denials by reason, payer, and department',
    category: 'financial',
    type: 'tabular',
    parameters: [
      { id: 'dateRange', name: 'dateRange', label: 'Denial Date Range', type: 'daterange', required: true },
      { id: 'payer', name: 'payer', label: 'Payer', type: 'select', required: false },
      { id: 'denialCategory', name: 'denialCategory', label: 'Category', type: 'select', required: false, options: [{ value: 'coding', label: 'Coding Error' }, { value: 'authorization', label: 'Authorization' }, { value: 'eligibility', label: 'Eligibility' }, { value: 'documentation', label: 'Documentation' }, { value: 'timely', label: 'Timely Filing' }] }
    ],
    columns: [
      { id: 'claimNumber', name: 'claimNumber', label: 'Claim #', type: 'link', sortable: true },
      { id: 'serviceDate', name: 'serviceDate', label: 'Service Date', type: 'date', sortable: true },
      { id: 'patientName', name: 'patientName', label: 'Patient', type: 'string', sortable: true },
      { id: 'payer', name: 'payer', label: 'Payer', type: 'string', sortable: true },
      { id: 'deniedAmount', name: 'deniedAmount', label: 'Amount', type: 'currency', sortable: true, aggregation: 'sum' },
      { id: 'denialCode', name: 'denialCode', label: 'Code', type: 'string', sortable: true },
      { id: 'denialReason', name: 'denialReason', label: 'Reason', type: 'string' },
      { id: 'denialCategory', name: 'denialCategory', label: 'Category', type: 'string', sortable: true },
      { id: 'appealStatus', name: 'appealStatus', label: 'Appeal Status', type: 'string', sortable: true }
    ],
    permissions: ['reports:financial:view'],
    createdBy: 'System',
    createdDate: new Date('2024-01-01')
  },
  {
    id: 'payer-mix',
    name: 'Payer Mix Analysis',
    description: 'Revenue and patient distribution by payer',
    category: 'financial',
    type: 'summary',
    parameters: [
      { id: 'dateRange', name: 'dateRange', label: 'Period', type: 'daterange', required: true }
    ],
    columns: [
      { id: 'payer', name: 'payer', label: 'Payer', type: 'string', sortable: true },
      { id: 'payerType', name: 'payerType', label: 'Type', type: 'string', sortable: true },
      { id: 'patientCount', name: 'patientCount', label: 'Patients', type: 'number', sortable: true, aggregation: 'sum' },
      { id: 'claimCount', name: 'claimCount', label: 'Claims', type: 'number', sortable: true, aggregation: 'sum' },
      { id: 'chargesAmount', name: 'chargesAmount', label: 'Charges', type: 'currency', sortable: true, aggregation: 'sum' },
      { id: 'paymentsAmount', name: 'paymentsAmount', label: 'Payments', type: 'currency', sortable: true, aggregation: 'sum' },
      { id: 'percentOfRevenue', name: 'percentOfRevenue', label: '% Revenue', type: 'percentage', sortable: true },
      { id: 'avgReimbursementRate', name: 'avgReimbursementRate', label: 'Avg Reimb %', type: 'percentage', sortable: true }
    ],
    permissions: ['reports:financial:view'],
    createdBy: 'System',
    createdDate: new Date('2024-01-01')
  },
  {
    id: 'provider-productivity',
    name: 'Provider Productivity',
    description: 'Provider productivity metrics including encounters, RVUs, and revenue',
    category: 'financial',
    type: 'tabular',
    parameters: [
      { id: 'dateRange', name: 'dateRange', label: 'Period', type: 'daterange', required: true },
      { id: 'provider', name: 'provider', label: 'Provider', type: 'provider', required: false },
      { id: 'specialty', name: 'specialty', label: 'Specialty', type: 'select', required: false }
    ],
    columns: [
      { id: 'providerName', name: 'providerName', label: 'Provider', type: 'string', sortable: true },
      { id: 'specialty', name: 'specialty', label: 'Specialty', type: 'string', sortable: true },
      { id: 'encounterCount', name: 'encounterCount', label: 'Encounters', type: 'number', sortable: true, aggregation: 'sum' },
      { id: 'patientCount', name: 'patientCount', label: 'Patients', type: 'number', sortable: true, aggregation: 'sum' },
      { id: 'newPatients', name: 'newPatients', label: 'New Pts', type: 'number', sortable: true, aggregation: 'sum' },
      { id: 'rvus', name: 'rvus', label: 'RVUs', type: 'number', sortable: true, aggregation: 'sum' },
      { id: 'charges', name: 'charges', label: 'Charges', type: 'currency', sortable: true, aggregation: 'sum' },
      { id: 'collections', name: 'collections', label: 'Collections', type: 'currency', sortable: true, aggregation: 'sum' },
      { id: 'noShowRate', name: 'noShowRate', label: 'No-Show %', type: 'percentage', sortable: true }
    ],
    permissions: ['reports:financial:view'],
    isFavorite: true,
    createdBy: 'System',
    createdDate: new Date('2024-01-01')
  },

  // Quality Reports
  {
    id: 'quality-measures-summary',
    name: 'Quality Measures Summary',
    description: 'Performance on clinical quality measures',
    category: 'quality',
    type: 'summary',
    parameters: [
      { id: 'reportingPeriod', name: 'reportingPeriod', label: 'Reporting Period', type: 'select', required: true, options: [{ value: '2024', label: '2024' }, { value: '2023', label: '2023' }] },
      { id: 'measureCategory', name: 'measureCategory', label: 'Category', type: 'select', required: false, options: [{ value: 'preventive', label: 'Preventive' }, { value: 'chronic', label: 'Chronic Disease' }, { value: 'behavioral', label: 'Behavioral Health' }] }
    ],
    columns: [
      { id: 'measureName', name: 'measureName', label: 'Measure', type: 'string', sortable: true },
      { id: 'category', name: 'category', label: 'Category', type: 'string', sortable: true },
      { id: 'numerator', name: 'numerator', label: 'Numerator', type: 'number' },
      { id: 'denominator', name: 'denominator', label: 'Denominator', type: 'number' },
      { id: 'rate', name: 'rate', label: 'Rate', type: 'percentage', sortable: true },
      { id: 'benchmark', name: 'benchmark', label: 'Benchmark', type: 'percentage' },
      { id: 'target', name: 'target', label: 'Target', type: 'percentage' },
      { id: 'status', name: 'status', label: 'Status', type: 'string', sortable: true }
    ],
    permissions: ['reports:quality:view'],
    createdBy: 'System',
    createdDate: new Date('2024-01-01')
  },
  {
    id: 'care-gaps',
    name: 'Care Gaps Report',
    description: 'Patients with gaps in recommended care',
    category: 'quality',
    type: 'tabular',
    parameters: [
      { id: 'measure', name: 'measure', label: 'Quality Measure', type: 'select', required: false },
      { id: 'provider', name: 'provider', label: 'Provider', type: 'provider', required: false }
    ],
    columns: [
      { id: 'patientName', name: 'patientName', label: 'Patient', type: 'link', sortable: true },
      { id: 'dateOfBirth', name: 'dateOfBirth', label: 'DOB', type: 'date', sortable: true },
      { id: 'measure', name: 'measure', label: 'Measure', type: 'string', sortable: true },
      { id: 'gapReason', name: 'gapReason', label: 'Gap Reason', type: 'string' },
      { id: 'lastServiceDate', name: 'lastServiceDate', label: 'Last Service', type: 'date', sortable: true },
      { id: 'dueDate', name: 'dueDate', label: 'Due Date', type: 'date', sortable: true },
      { id: 'provider', name: 'provider', label: 'Provider', type: 'string', sortable: true }
    ],
    permissions: ['reports:quality:view'],
    createdBy: 'System',
    createdDate: new Date('2024-01-01')
  },

  // Operational Reports
  {
    id: 'no-show-report',
    name: 'No-Show Analysis',
    description: 'Analysis of appointment no-shows by provider and patient',
    category: 'operational',
    type: 'tabular',
    parameters: [
      { id: 'dateRange', name: 'dateRange', label: 'Date Range', type: 'daterange', required: true },
      { id: 'provider', name: 'provider', label: 'Provider', type: 'provider', required: false }
    ],
    columns: [
      { id: 'date', name: 'date', label: 'Date', type: 'date', sortable: true },
      { id: 'patientName', name: 'patientName', label: 'Patient', type: 'link', sortable: true },
      { id: 'providerName', name: 'providerName', label: 'Provider', type: 'string', sortable: true },
      { id: 'appointmentType', name: 'appointmentType', label: 'Type', type: 'string', sortable: true },
      { id: 'patientNoShowCount', name: 'patientNoShowCount', label: 'Patient Total No-Shows', type: 'number', sortable: true },
      { id: 'phone', name: 'phone', label: 'Phone', type: 'string' }
    ],
    permissions: ['reports:operational:view'],
    createdBy: 'System',
    createdDate: new Date('2024-01-01')
  },
  {
    id: 'referral-tracking',
    name: 'Referral Tracking',
    description: 'Track status of outgoing and incoming referrals',
    category: 'operational',
    type: 'tabular',
    parameters: [
      { id: 'dateRange', name: 'dateRange', label: 'Date Range', type: 'daterange', required: true },
      { id: 'direction', name: 'direction', label: 'Direction', type: 'select', required: false, options: [{ value: 'outgoing', label: 'Outgoing' }, { value: 'incoming', label: 'Incoming' }] },
      { id: 'status', name: 'status', label: 'Status', type: 'select', required: false, options: [{ value: 'pending', label: 'Pending' }, { value: 'scheduled', label: 'Scheduled' }, { value: 'completed', label: 'Completed' }] }
    ],
    columns: [
      { id: 'referralDate', name: 'referralDate', label: 'Date', type: 'date', sortable: true },
      { id: 'patientName', name: 'patientName', label: 'Patient', type: 'link', sortable: true },
      { id: 'referringProvider', name: 'referringProvider', label: 'Referring', type: 'string', sortable: true },
      { id: 'referredTo', name: 'referredTo', label: 'Referred To', type: 'string', sortable: true },
      { id: 'specialty', name: 'specialty', label: 'Specialty', type: 'string', sortable: true },
      { id: 'reason', name: 'reason', label: 'Reason', type: 'string' },
      { id: 'status', name: 'status', label: 'Status', type: 'string', sortable: true },
      { id: 'daysPending', name: 'daysPending', label: 'Days', type: 'number', sortable: true }
    ],
    permissions: ['reports:operational:view'],
    createdBy: 'System',
    createdDate: new Date('2024-01-01')
  }
];

export const MOCK_DASHBOARDS: Dashboard[] = [
  {
    id: 'executive-dashboard',
    name: 'Executive Dashboard',
    description: 'High-level practice performance metrics',
    category: 'executive',
    widgets: [
      { id: 'w1', type: 'metric', title: 'MTD Revenue', size: 'small', position: { row: 1, col: 1 }, config: { metric: 'revenue', period: 'mtd' } },
      { id: 'w2', type: 'metric', title: 'Collection Rate', size: 'small', position: { row: 1, col: 2 }, config: { metric: 'collectionRate' } },
      { id: 'w3', type: 'metric', title: 'Days in A/R', size: 'small', position: { row: 1, col: 3 }, config: { metric: 'daysInAR' } },
      { id: 'w4', type: 'metric', title: 'Patient Volume', size: 'small', position: { row: 1, col: 4 }, config: { metric: 'patientVolume', period: 'mtd' } },
      { id: 'w5', type: 'chart', title: 'Revenue Trend', size: 'large', position: { row: 2, col: 1 }, config: { chartType: 'line', metric: 'revenue', periods: 12 } },
      { id: 'w6', type: 'chart', title: 'Payer Mix', size: 'medium', position: { row: 2, col: 3 }, config: { chartType: 'donut', metric: 'payerMix' } },
      { id: 'w7', type: 'table', title: 'Top Providers', size: 'medium', position: { row: 3, col: 1 }, config: { report: 'provider-productivity', limit: 5 } },
      { id: 'w8', type: 'chart', title: 'A/R Aging', size: 'medium', position: { row: 3, col: 3 }, config: { chartType: 'bar', metric: 'arAging' } }
    ],
    permissions: ['dashboard:executive:view'],
    isDefault: true,
    createdBy: 'System',
    createdDate: new Date('2024-01-01')
  },
  {
    id: 'clinical-dashboard',
    name: 'Clinical Dashboard',
    description: 'Clinical quality and patient care metrics',
    category: 'clinical',
    widgets: [
      { id: 'c1', type: 'metric', title: 'Encounters Today', size: 'small', position: { row: 1, col: 1 }, config: { metric: 'encountersToday' } },
      { id: 'c2', type: 'metric', title: 'Quality Score', size: 'small', position: { row: 1, col: 2 }, config: { metric: 'qualityScore' } },
      { id: 'c3', type: 'metric', title: 'Care Gaps', size: 'small', position: { row: 1, col: 3 }, config: { metric: 'careGaps' } },
      { id: 'c4', type: 'metric', title: 'Pending Results', size: 'small', position: { row: 1, col: 4 }, config: { metric: 'pendingResults' } },
      { id: 'c5', type: 'list', title: 'Quality Measures', size: 'large', position: { row: 2, col: 1 }, config: { report: 'quality-measures-summary' } },
      { id: 'c6', type: 'calendar', title: 'Today\'s Schedule', size: 'medium', position: { row: 2, col: 3 }, config: { view: 'day' } }
    ],
    permissions: ['dashboard:clinical:view'],
    createdBy: 'System',
    createdDate: new Date('2024-01-01')
  },
  {
    id: 'financial-dashboard',
    name: 'Financial Dashboard',
    description: 'Revenue cycle and financial performance metrics',
    category: 'financial',
    widgets: [
      { id: 'f1', type: 'metric', title: 'Charges MTD', size: 'small', position: { row: 1, col: 1 }, config: { metric: 'charges', period: 'mtd' } },
      { id: 'f2', type: 'metric', title: 'Collections MTD', size: 'small', position: { row: 1, col: 2 }, config: { metric: 'collections', period: 'mtd' } },
      { id: 'f3', type: 'metric', title: 'Denial Rate', size: 'small', position: { row: 1, col: 3 }, config: { metric: 'denialRate' } },
      { id: 'f4', type: 'metric', title: 'Clean Claim Rate', size: 'small', position: { row: 1, col: 4 }, config: { metric: 'cleanClaimRate' } },
      { id: 'f5', type: 'chart', title: 'Collections vs Target', size: 'large', position: { row: 2, col: 1 }, config: { chartType: 'area', metrics: ['collections', 'target'] } },
      { id: 'f6', type: 'chart', title: 'Denial Trends', size: 'medium', position: { row: 2, col: 3 }, config: { chartType: 'line', metric: 'denials' } },
      { id: 'f7', type: 'table', title: 'Aging Summary', size: 'medium', position: { row: 3, col: 1 }, config: { report: 'claims-aging' } }
    ],
    permissions: ['dashboard:financial:view'],
    createdBy: 'System',
    createdDate: new Date('2024-01-01')
  }
];

export const MOCK_QUALITY_MEASURES: QualityMeasure[] = [];
