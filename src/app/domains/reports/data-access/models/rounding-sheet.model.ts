export type FieldType =
  | 'text'
  | 'number'
  | 'checkbox'
  | 'select'
  | 'vital-sign'
  | 'lab-value'
  | 'medication'
  | 'note'
  | 'assessment'
  | 'plan';

export type ColumnSize = 'small' | 'medium' | 'large';

export interface RoundingSheetField {
  id: string;
  type: FieldType;
  label: string;
  description?: string;
  columnSize: ColumnSize;
  required: boolean;
  defaultValue?: string;
  options?: string[]; // for select fields
  dataSource?: string; // e.g. 'vitals.bp', 'labs.hba1c' - auto-populate from patient data
  order: number;
}

export interface RoundingSheetSection {
  id: string;
  title: string;
  fields: RoundingSheetField[];
  order: number;
  isCollapsible: boolean;
  isCollapsed?: boolean;
}

export interface RoundingSheetTemplate {
  id: string;
  name: string;
  description: string;

  // Template structure
  sections: RoundingSheetSection[];

  // Metadata
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;

  // Sharing
  isShared: boolean;
  isDefault: boolean;
  specialty?: string;
  tags?: string[];

  // Usage
  useCount: number;
  lastUsedAt?: string;
}

export interface RoundingSheetEntry {
  fieldId: string;
  value: string;
}

export interface PatientRoundingData {
  patientId: string;
  patientName: string;
  room: string;
  mrn: string;
  admitDate: string;
  attendingPhysician: string;
  diagnosis: string;
  entries: RoundingSheetEntry[];
}

export interface RoundingSheet {
  id: string;
  templateId: string;
  templateName: string;

  // Sheet details
  date: string;
  shift: 'day' | 'evening' | 'night';
  unit: string;

  // Patients
  patients: PatientRoundingData[];

  // Metadata
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'in-progress' | 'completed';
}

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: 'Text',
  number: 'Number',
  checkbox: 'Checkbox',
  select: 'Dropdown',
  'vital-sign': 'Vital Sign',
  'lab-value': 'Lab Value',
  medication: 'Medication',
  note: 'Note',
  assessment: 'Assessment',
  plan: 'Plan',
};

export const FIELD_TYPE_ICONS: Record<FieldType, string> = {
  text: 'pi pi-pencil',
  number: 'pi pi-hashtag',
  checkbox: 'pi pi-check-square',
  select: 'pi pi-list',
  'vital-sign': 'pi pi-heart',
  'lab-value': 'pi pi-chart-bar',
  medication: 'pi pi-tablet',
  note: 'pi pi-file-edit',
  assessment: 'pi pi-search',
  plan: 'pi pi-map',
};

export const COLUMN_SIZE_WIDTHS: Record<ColumnSize, string> = {
  small: '100px',
  medium: '150px',
  large: '250px',
};

export const COMMON_DATA_SOURCES = [
  { label: 'Blood Pressure', value: 'vitals.bp' },
  { label: 'Heart Rate', value: 'vitals.hr' },
  { label: 'Temperature', value: 'vitals.temp' },
  { label: 'SpO2', value: 'vitals.spo2' },
  { label: 'Weight', value: 'vitals.weight' },
  { label: 'HbA1c', value: 'labs.hba1c' },
  { label: 'Creatinine', value: 'labs.creatinine' },
  { label: 'WBC', value: 'labs.wbc' },
  { label: 'Hemoglobin', value: 'labs.hgb' },
  { label: 'Potassium', value: 'labs.potassium' },
  { label: 'Sodium', value: 'labs.sodium' },
  { label: 'INR', value: 'labs.inr' },
  { label: 'BUN', value: 'labs.bun' },
  { label: 'Glucose', value: 'labs.glucose' },
];

export const DEFAULT_TEMPLATES: Partial<RoundingSheetTemplate>[] = [
  {
    id: 'TPL-DEFAULT-001',
    name: 'General Medicine Rounding',
    description: 'Standard rounding sheet for general medicine floor',
    specialty: 'Internal Medicine',
    isDefault: true,
  },
  {
    id: 'TPL-DEFAULT-002',
    name: 'ICU Daily Assessment',
    description: 'Comprehensive ICU rounding template with organ systems',
    specialty: 'Critical Care',
    isDefault: true,
  },
  {
    id: 'TPL-DEFAULT-003',
    name: 'Surgical Service Rounding',
    description: 'Post-operative surgical rounding sheet',
    specialty: 'Surgery',
    isDefault: true,
  },
];
