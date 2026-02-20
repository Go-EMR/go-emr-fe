export type ExternalDataSource =
  | 'health-information-exchange'
  | 'pharmacy-network'
  | 'insurance'
  | 'reference-lab'
  | 'outside-hospital'
  | 'patient-portal'
  | 'wearable-device';

export type ExternalDataType =
  | 'lab-result'
  | 'imaging-report'
  | 'clinical-note'
  | 'medication-history'
  | 'discharge-summary'
  | 'referral'
  | 'immunization'
  | 'vital-signs';

export type ReviewStatus =
  | 'unreviewed'
  | 'reviewed'
  | 'acknowledged'
  | 'incorporated'
  | 'dismissed';

export interface ExternalDataRecord {
  id: string;
  patientId: string;

  // Source info
  source: ExternalDataSource;
  sourceName: string; // e.g., "Springfield Regional Medical Center"
  sourceId?: string;

  // Data type and content
  dataType: ExternalDataType;
  title: string;
  summary: string;
  content: string; // Full content, can be markdown

  // Clinical data (type-specific)
  labResults?: ExternalLabResult[];
  medications?: ExternalMedication[];
  vitalSigns?: ExternalVitalSign[];

  // Metadata
  originalDate: string; // When the data was originally created
  receivedDate: string; // When we received it
  documentId?: string;

  // Review workflow
  reviewStatus: ReviewStatus;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewNotes?: string;

  // Flags
  isUrgent: boolean;
  hasDiscrepancy: boolean;
  discrepancyNotes?: string;

  // Tags
  tags?: string[];
}

export interface ExternalLabResult {
  testName: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  isAbnormal: boolean;
  isCritical: boolean;
}

export interface ExternalMedication {
  name: string;
  dose: string;
  frequency: string;
  prescriber?: string;
  startDate?: string;
  status: 'active' | 'discontinued' | 'unknown';
}

export interface ExternalVitalSign {
  type: string;
  value: string;
  unit: string;
  timestamp: string;
}

export const SOURCE_LABELS: Record<ExternalDataSource, string> = {
  'health-information-exchange': 'Health Info Exchange',
  'pharmacy-network': 'Pharmacy Network',
  insurance: 'Insurance',
  'reference-lab': 'Reference Lab',
  'outside-hospital': 'Outside Hospital',
  'patient-portal': 'Patient Portal',
  'wearable-device': 'Wearable Device',
};

export const SOURCE_ICONS: Record<ExternalDataSource, string> = {
  'health-information-exchange': 'pi pi-globe',
  'pharmacy-network': 'pi pi-box',
  insurance: 'pi pi-shield',
  'reference-lab': 'pi pi-chart-bar',
  'outside-hospital': 'pi pi-building',
  'patient-portal': 'pi pi-user',
  'wearable-device': 'pi pi-mobile',
};

export const SOURCE_COLORS: Record<
  ExternalDataSource,
  { bg: string; text: string; border: string; darkBg: string; darkText: string }
> = {
  'health-information-exchange': {
    bg: '#dbeafe',
    text: '#1e40af',
    border: '#3b82f6',
    darkBg: '#1e3a5f',
    darkText: '#93c5fd',
  },
  'pharmacy-network': {
    bg: '#dcfce7',
    text: '#166534',
    border: '#22c55e',
    darkBg: '#14532d',
    darkText: '#86efac',
  },
  insurance: {
    bg: '#fef3c7',
    text: '#92400e',
    border: '#f59e0b',
    darkBg: '#78350f',
    darkText: '#fcd34d',
  },
  'reference-lab': {
    bg: '#f3e8ff',
    text: '#6b21a8',
    border: '#a855f7',
    darkBg: '#581c87',
    darkText: '#d8b4fe',
  },
  'outside-hospital': {
    bg: '#fce7f3',
    text: '#9d174d',
    border: '#ec4899',
    darkBg: '#831843',
    darkText: '#f9a8d4',
  },
  'patient-portal': {
    bg: '#e0f2fe',
    text: '#075985',
    border: '#0ea5e9',
    darkBg: '#0c4a6e',
    darkText: '#7dd3fc',
  },
  'wearable-device': {
    bg: '#f0fdf4',
    text: '#166534',
    border: '#22c55e',
    darkBg: '#14532d',
    darkText: '#86efac',
  },
};

export const DATA_TYPE_LABELS: Record<ExternalDataType, string> = {
  'lab-result': 'Lab Result',
  'imaging-report': 'Imaging Report',
  'clinical-note': 'Clinical Note',
  'medication-history': 'Medication History',
  'discharge-summary': 'Discharge Summary',
  referral: 'Referral',
  immunization: 'Immunization',
  'vital-signs': 'Vital Signs',
};

export const DATA_TYPE_ICONS: Record<ExternalDataType, string> = {
  'lab-result': 'pi pi-chart-bar',
  'imaging-report': 'pi pi-image',
  'clinical-note': 'pi pi-file',
  'medication-history': 'pi pi-list',
  'discharge-summary': 'pi pi-sign-out',
  referral: 'pi pi-send',
  immunization: 'pi pi-heart',
  'vital-signs': 'pi pi-chart-line',
};

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  unreviewed: 'Unreviewed',
  reviewed: 'Reviewed',
  acknowledged: 'Acknowledged',
  incorporated: 'Incorporated',
  dismissed: 'Dismissed',
};

export const REVIEW_STATUS_COLORS: Record<
  ReviewStatus,
  { bg: string; text: string; darkBg: string; darkText: string }
> = {
  unreviewed: {
    bg: '#fee2e2',
    text: '#991b1b',
    darkBg: '#7f1d1d',
    darkText: '#fca5a5',
  },
  reviewed: {
    bg: '#fef3c7',
    text: '#92400e',
    darkBg: '#78350f',
    darkText: '#fcd34d',
  },
  acknowledged: {
    bg: '#dbeafe',
    text: '#1e40af',
    darkBg: '#1e3a5f',
    darkText: '#93c5fd',
  },
  incorporated: {
    bg: '#dcfce7',
    text: '#166534',
    darkBg: '#14532d',
    darkText: '#86efac',
  },
  dismissed: {
    bg: '#f1f5f9',
    text: '#475569',
    darkBg: '#1e293b',
    darkText: '#94a3b8',
  },
};
