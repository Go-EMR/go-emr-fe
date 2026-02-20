// Lab domain models for orders and results

export interface LabOrder {
  id: string;
  orderId: string;
  patientId: string;
  patientName: string;
  patientMRN: string;
  patientDOB: string;
  encounterId?: string;
  
  // Order details
  orderType: LabOrderType;
  status: LabOrderStatus;
  priority: LabPriority;
  
  // Tests ordered
  tests: LabTest[];
  panelCode?: string;
  panelName?: string;
  
  // Provider info
  orderingProviderId: string;
  orderingProviderName: string;
  orderingProviderNPI?: string;
  
  // Facility
  performingLabId?: string;
  performingLabName?: string;
  collectionSiteId?: string;
  collectionSiteName?: string;
  
  // Clinical info
  diagnosisCodes?: string[];
  clinicalNotes?: string;
  fastingRequired: boolean;
  fastingHours?: number;
  specimenType?: SpecimenType;
  specimenSource?: string;
  
  // Scheduling
  orderedDate: string;
  scheduledDate?: string;
  collectionDate?: string;
  receivedDate?: string;
  reportedDate?: string;
  expirationDate?: string;

  // Special instructions
  patientInstructions?: string;
  labInstructions?: string;
  
  // Results
  results?: LabResult[];
  resultsSummary?: 'normal' | 'abnormal' | 'critical' | 'pending';
  
  // Audit
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface LabTest {
  id: string;
  code: string;
  testCode: string; // Alias for code
  name: string;
  testName: string; // Alias for name
  description?: string;
  loincCode?: string;
  cptCode?: string;
  category: LabCategory;
  specimenType: SpecimenType;
  fastingRequired: boolean;
  fastingHours?: number;
  turnaroundTime?: string;
  turnaroundDays?: number;
  price?: number;
  
  // For panel tests
  isPanelComponent?: boolean;
  panelCode?: string;
  
  // Result association
  result?: LabResult;
}

export interface LabResult {
  id: string;
  orderId: string;
  testId: string;
  testCode: string;
  testName: string;
  
  // Result value
  value: string;
  numericValue?: number;
  textValue?: string;
  codedValue?: string;
  valueType: 'numeric' | 'text' | 'coded' | 'ratio' | 'range';
  unit?: string;
  units?: string; // Alias for unit
  
  // Reference range
  referenceRange?: string | ReferenceRange;
  referenceLow?: number;
  referenceHigh?: number;
  
  // Interpretation
  interpretation?: ResultInterpretation;
  interpretationText?: string;
  
  // Flags
  isAbnormal: boolean;
  isCritical: boolean;
  delta?: {
    previousValue: string;
    previousDate: string;
    changePercent: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
  
  // Comments
  labComments?: string;
  providerComments?: string;
  
  // Status
  status: ResultStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  
  // Timestamps
  collectedAt?: string;
  receivedAt?: string;
  analyzedAt?: string;
  reportedAt?: string;
}

export interface ReferenceRange {
  lowValue?: number;
  highValue?: number;
  textRange?: string;
}

export interface LabPanel {
  id: string;
  code: string;
  panelCode: string; // Alias for code
  name: string;
  panelName: string; // Alias for name
  description?: string;
  category: LabCategory;
  tests: LabTest[];
  loincCode?: string;
  cptCode?: string;
  price?: number;
  fastingRequired: boolean;
  fastingHours?: number;
  specimenType: SpecimenType;
  turnaroundTime?: string;
  isCommon: boolean;
}

export interface CustomLabPanel extends LabPanel {
  // Creator info
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;

  // Sharing
  isShared: boolean;
  isPublished: boolean;
  sharedWith?: string[]; // user IDs
  subscriberCount?: number;

  // Usage tracking
  useCount: number;
  lastUsedAt?: string;

  // Versioning
  version: number;

  // Tags for discoverability
  tags?: string[];
  specialty?: string;
}

export type LabOrderType =
  | 'lab'
  | 'microbiology'
  | 'pathology'
  | 'cytology'
  | 'genetics'
  | 'toxicology';

export type LabOrderStatus = 
  | 'draft'
  | 'pending'
  | 'ordered'
  | 'scheduled'
  | 'collected'
  | 'received'
  | 'in-progress'
  | 'preliminary'
  | 'final'
  | 'corrected'
  | 'cancelled';

export type LabPriority = 
  | 'routine'
  | 'urgent'
  | 'stat'
  | 'asap';

export type LabCategory = 
  | 'chemistry'
  | 'hematology'
  | 'coagulation'
  | 'urinalysis'
  | 'microbiology'
  | 'immunology'
  | 'endocrine'
  | 'lipid'
  | 'cardiac'
  | 'liver'
  | 'renal'
  | 'thyroid'
  | 'tumor-markers'
  | 'vitamins'
  | 'toxicology'
  | 'genetics'
  | 'other';

export type SpecimenType = 
  | 'blood'
  | 'serum'
  | 'plasma'
  | 'urine'
  | 'stool'
  | 'saliva'
  | 'csf'
  | 'swab'
  | 'tissue'
  | 'other';

export type ResultInterpretation = 
  | 'normal'
  | 'low'
  | 'high'
  | 'critical-low'
  | 'critical-high'
  | 'abnormal'
  | 'positive'
  | 'negative'
  | 'indeterminate'
  | 'not-detected'
  | 'detected';

export type ResultStatus = 
  | 'pending'
  | 'preliminary'
  | 'final'
  | 'corrected'
  | 'cancelled';

export interface LabFacility {
  id: string;
  facilityId: string; // Alias for id
  name: string;
  type: 'internal' | 'reference' | 'hospital';
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  phone: string;
  fax?: string;
  email?: string;
  npi?: string;
  clia?: string;
  acceptsEOrders: boolean;
  supportsEOrders: boolean; // Alias for acceptsEOrders
  supportsHL7: boolean;
  isPreferred: boolean;
  turnaroundTimes?: Record<LabCategory, string>;
}

export interface LabOrderSearchParams {
  patientId?: string;
  providerId?: string;
  status?: LabOrderStatus | LabOrderStatus[];
  priority?: LabPriority;
  testCode?: string;
  category?: LabCategory;
  dateFrom?: string;
  dateTo?: string;
  hasResults?: boolean;
  hasAbnormalResults?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface LabOrderSearchResult {
  orders: LabOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Common lab panels
export const COMMON_LAB_PANELS = [
  { code: 'BMP', name: 'Basic Metabolic Panel', category: 'chemistry' as LabCategory },
  { code: 'CMP', name: 'Comprehensive Metabolic Panel', category: 'chemistry' as LabCategory },
  { code: 'CBC', name: 'Complete Blood Count', category: 'hematology' as LabCategory },
  { code: 'LIPID', name: 'Lipid Panel', category: 'lipid' as LabCategory },
  { code: 'TSH', name: 'Thyroid Stimulating Hormone', category: 'thyroid' as LabCategory },
  { code: 'HBA1C', name: 'Hemoglobin A1c', category: 'chemistry' as LabCategory },
  { code: 'UA', name: 'Urinalysis', category: 'urinalysis' as LabCategory },
  { code: 'LFT', name: 'Liver Function Tests', category: 'liver' as LabCategory },
  { code: 'RFT', name: 'Renal Function Panel', category: 'renal' as LabCategory },
  { code: 'PT/INR', name: 'Prothrombin Time / INR', category: 'coagulation' as LabCategory },
  { code: 'PSA', name: 'Prostate Specific Antigen', category: 'tumor-markers' as LabCategory },
  { code: 'VITD', name: 'Vitamin D, 25-Hydroxy', category: 'vitamins' as LabCategory },
  { code: 'B12', name: 'Vitamin B12', category: 'vitamins' as LabCategory },
  { code: 'IRON', name: 'Iron Panel', category: 'chemistry' as LabCategory },
  { code: 'CRP', name: 'C-Reactive Protein', category: 'immunology' as LabCategory },
];

// Priority display labels
export const PRIORITY_LABELS: Record<LabPriority, string> = {
  'routine': 'Routine',
  'urgent': 'Urgent',
  'stat': 'STAT',
  'asap': 'ASAP',
};

// Status display labels
export const STATUS_LABELS: Record<LabOrderStatus, string> = {
  'draft': 'Draft',
  'pending': 'Pending',
  'ordered': 'Ordered',
  'scheduled': 'Scheduled',
  'collected': 'Collected',
  'received': 'Received',
  'in-progress': 'In Progress',
  'preliminary': 'Preliminary',
  'final': 'Final',
  'corrected': 'Corrected',
  'cancelled': 'Cancelled',
};

// Test expiration defaults in months, keyed by panel/test code
export const TEST_EXPIRATION_DEFAULTS: Record<string, number> = {
  // Chemistry panels
  'BMP': 12,
  'CMP': 12,
  // Hematology
  'CBC': 12,
  // Lipids
  'LIPID': 12,
  // Thyroid
  'TSH': 12,
  // Diabetes
  'HBA1C': 6,
  // Liver
  'LFT': 12,
  // Renal
  'RFT': 12,
  // Coagulation
  'PT/INR': 1,
  // Tumor markers
  'PSA': 12,
  // Vitamins
  'VITD': 12,
  'B12': 12,
  // Iron
  'IRON': 12,
  // Inflammatory
  'CRP': 6,
  // Urinalysis
  'UA': 12,
  // Default
  'DEFAULT': 12,
};

// Interpretation colors
export const INTERPRETATION_COLORS: Record<ResultInterpretation, string> = {
  'normal': 'green',
  'low': 'yellow',
  'high': 'yellow',
  'critical-low': 'red',
  'critical-high': 'red',
  'abnormal': 'orange',
  'positive': 'blue',
  'negative': 'green',
  'indeterminate': 'gray',
  'not-detected': 'green',
  'detected': 'blue',
};
