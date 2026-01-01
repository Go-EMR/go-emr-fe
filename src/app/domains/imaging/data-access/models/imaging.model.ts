/**
 * Imaging Domain Models
 * Comprehensive models for radiology orders, studies, and results
 */

// ============ Enums as Const Objects ============

export const ImagingModality = {
  XRay: 'xray',
  CT: 'ct',
  MRI: 'mri',
  Ultrasound: 'ultrasound',
  Mammography: 'mammography',
  Fluoroscopy: 'fluoroscopy',
  Nuclear: 'nuclear',
  PET: 'pet',
  DEXA: 'dexa'
} as const;
export type ImagingModality = typeof ImagingModality[keyof typeof ImagingModality];

export const ImagingOrderStatus = {
  Draft: 'draft',
  Pending: 'pending',
  Scheduled: 'scheduled',
  InProgress: 'in-progress',
  Completed: 'completed',
  Preliminary: 'preliminary',
  Final: 'final',
  Addendum: 'addendum',
  Cancelled: 'cancelled'
} as const;
export type ImagingOrderStatus = typeof ImagingOrderStatus[keyof typeof ImagingOrderStatus];

export const ImagingPriority = {
  Routine: 'routine',
  Urgent: 'urgent',
  Stat: 'stat',
  ASAP: 'asap'
} as const;
export type ImagingPriority = typeof ImagingPriority[keyof typeof ImagingPriority];

export const ImagingCategory = {
  Diagnostic: 'diagnostic',
  Screening: 'screening',
  FollowUp: 'follow-up',
  PreOperative: 'pre-operative',
  PostOperative: 'post-operative',
  Emergency: 'emergency'
} as const;
export type ImagingCategory = typeof ImagingCategory[keyof typeof ImagingCategory];

export const ContrastType = {
  None: 'none',
  Oral: 'oral',
  IV: 'iv',
  OralIV: 'oral-iv',
  Intrathecal: 'intrathecal',
  Arthrogram: 'arthrogram'
} as const;
export type ContrastType = typeof ContrastType[keyof typeof ContrastType];

export const Laterality = {
  Left: 'left',
  Right: 'right',
  Bilateral: 'bilateral',
  NotApplicable: 'not-applicable'
} as const;
export type Laterality = typeof Laterality[keyof typeof Laterality];

export const BodyRegion = {
  Head: 'head',
  Neck: 'neck',
  Chest: 'chest',
  Abdomen: 'abdomen',
  Pelvis: 'pelvis',
  Spine: 'spine',
  UpperExtremity: 'upper-extremity',
  LowerExtremity: 'lower-extremity',
  WholeBody: 'whole-body'
} as const;
export type BodyRegion = typeof BodyRegion[keyof typeof BodyRegion];

export const FindingSeverity = {
  Normal: 'normal',
  Benign: 'benign',
  ProbablyBenign: 'probably-benign',
  Suspicious: 'suspicious',
  HighlySuspicious: 'highly-suspicious',
  Malignant: 'malignant'
} as const;
export type FindingSeverity = typeof FindingSeverity[keyof typeof FindingSeverity];

// ============ Interfaces ============

export interface ImagingOrder {
  // Order identification
  orderId: string;
  accessionNumber?: string;
  patientId: string;
  patientName?: string;
  patientDOB?: string;
  encounterId?: string;
  
  // Study details
  modality: ImagingModality;
  procedure: ImagingProcedure | string;
  procedureCode: string;
  procedureName: string;
  bodyRegion: BodyRegion;
  laterality?: Laterality;
  
  // Order details
  status: ImagingOrderStatus;
  priority: ImagingPriority;
  category: ImagingCategory;
  cancellationReason?: string;
  
  // Contrast information
  contrastRequired: boolean;
  contrastType?: ContrastType;
  contrastAllergies?: string[];
  contrast?: {
    required: boolean;
    type?: ContrastType;
    allergies?: string;
  };
  
  // Provider information
  orderingProviderId: string;
  orderingProviderName: string;
  orderingProviderNPI?: string;
  orderingProvider?: { id: string; name: string };
  
  // Facility information
  performingFacilityId?: string;
  performingFacilityName?: string;
  performingFacility?: { id: string; name: string; address?: string; phone?: string };
  readingRadiologistId?: string;
  readingRadiologistName?: string;
  readingRadiologist?: { id: string; name: string };
  
  // Clinical information
  diagnosisCodes?: DiagnosisCode[];
  clinicalHistory?: string;
  reasonForExam?: string;
  relevantPriorStudies?: string[];
  
  // Scheduling
  orderedDate: string;
  scheduledDate?: string;
  performedDate?: string;
  reportedDate?: string;
  
  // Special instructions
  patientInstructions?: string;
  technicianInstructions?: string;
  
  // Safety screening - flat properties
  pregnancyStatus?: 'not-pregnant' | 'pregnant' | 'unknown' | 'not-applicable';
  implants?: string[];
  claustrophobia?: boolean;
  renalFunction?: {
    creatinine?: number;
    gfr?: number;
    eGFR?: number;
    lastChecked?: string;
  };
  
  // Safety screening - object form
  safetyScreening?: {
    pregnancyStatus?: 'not-pregnant' | 'pregnant' | 'unknown' | 'not-applicable';
    hasImplants?: boolean;
    implantDetails?: string;
    claustrophobia?: boolean;
    renalFunction?: {
      creatinine?: number;
      eGFR?: number;
    };
  };
  
  // Studies and results
  studies?: ImagingStudy[];
  priorStudies?: Array<{ studyId: string; date: string; description: string }>;
  report?: ImagingReport;
  images?: ImagingStudy[];
  
  // Audit trail
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface ImagingProcedure {
  procedureCode: string;
  procedureName: string;
  name: string; // Alias for procedureName used in templates
  modality: ImagingModality;
  bodyRegion: BodyRegion;
  cptCode?: string;
  description?: string;
  
  // Requirements
  contrastOptions: ContrastType[];
  defaultContrast: ContrastType;
  requiresPrep: boolean;
  prepRequired: boolean; // Alias for requiresPrep used in templates
  prepInstructions?: string;
  estimatedDuration: number; // minutes
  
  // Pricing
  technicalFee?: number;
  professionalFee?: number;
  
  // Common procedure flag
  isCommon: boolean;
}

export interface ImagingReport {
  reportId: string;
  orderId: string;
  
  // Report status
  status: 'draft' | 'preliminary' | 'final' | 'addendum' | 'amended';
  
  // Report content
  indication?: string;
  technique?: string;
  comparison?: string;
  findings: string;
  impression: string;
  recommendations?: string;
  
  // Structured findings
  structuredFindings?: ImagingFinding[];
  
  // Critical findings
  hasCriticalFindings: boolean;
  criticalFindingsCommunicated?: boolean;
  criticalFindingCommunicated?: boolean; // Alias
  criticalFindingsCommunicatedTo?: string;
  criticalFindingCommunicatedTo?: string; // Alias
  criticalFindingsCommunicatedAt?: string;
  criticalFindingCommunicatedAt?: string; // Alias
  
  // Radiologist information
  radiologistId: string;
  radiologistName: string;
  radiologist?: { id: string; name: string }; // Object form
  radiologistNPI?: string;
  signedAt?: string;
  
  // Addenda
  addenda?: ReportAddendum[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface ImagingFinding {
  findingId: string;
  location: string;
  description: string;
  severity: FindingSeverity;
  measurements?: {
    length?: number;
    width?: number;
    height?: number;
    unit: string;
  };
  comparisonToPrior?: 'new' | 'stable' | 'increased' | 'decreased' | 'resolved';
  followUpRecommended?: boolean;
  followUpRecommendation?: string; // Text description of follow-up
  followUpInterval?: string;
}

export interface ReportAddendum {
  addendumId: string;
  content: string;
  text: string; // Alias for content
  radiologistId: string;
  radiologistName: string;
  addedBy?: { id: string; name: string }; // User who added
  addedAt: string; // Alias for createdAt
  createdAt: string;
  reason?: string;
}

export interface ImagingStudy {
  studyId: string;
  studyInstanceUID: string;
  orderId: string;
  
  // Study info
  modality: ImagingModality;
  description: string;
  performedDate: string;
  
  // PACS information
  numberOfSeries: number;
  numberOfImages: number;
  pacsUrl?: string;
  viewerUrl?: string;
  
  // Technical details
  equipment?: string;
  technologist?: string;
  
  // Series
  series?: ImagingSeries[];
}

export interface ImagingSeries {
  seriesId: string;
  seriesInstanceUID: string;
  seriesNumber: number;
  description: string;
  modality: string;
  numberOfImages: number;
  bodyPart?: string;
  
  // Representative image
  thumbnailUrl?: string;
}

export interface ImagingFacility {
  facilityId: string;
  id: string; // Alias for facilityId
  name: string;
  facilityType: 'hospital' | 'imaging-center' | 'clinic' | 'mobile';
  
  // Contact
  address?: string;
  phone?: string;
  fax?: string;
  
  // Capabilities
  modalities: ImagingModality[];
  is24Hour: boolean;
  acceptsWalkIns: boolean;
  
  // Integration
  pacsIntegrated: boolean;
  hasPacsIntegration: boolean; // Alias for pacsIntegrated
  supportsEOrders: boolean;
  
  // Preferences
  isPreferred: boolean;
}

export interface DiagnosisCode {
  code: string;
  description: string;
  codeSystem?: 'ICD-10' | 'ICD-9';
}

// ============ Constants ============

export const MODALITY_LABELS: Record<ImagingModality, string> = {
  'xray': 'X-Ray',
  'ct': 'CT Scan',
  'mri': 'MRI',
  'ultrasound': 'Ultrasound',
  'mammography': 'Mammography',
  'fluoroscopy': 'Fluoroscopy',
  'nuclear': 'Nuclear Medicine',
  'pet': 'PET Scan',
  'dexa': 'DEXA Scan'
};

export const STATUS_LABELS: Record<ImagingOrderStatus, string> = {
  'draft': 'Draft',
  'pending': 'Pending',
  'scheduled': 'Scheduled',
  'in-progress': 'In Progress',
  'completed': 'Completed',
  'preliminary': 'Preliminary',
  'final': 'Final',
  'addendum': 'Addendum',
  'cancelled': 'Cancelled'
};

export const PRIORITY_LABELS: Record<ImagingPriority, string> = {
  'routine': 'Routine',
  'urgent': 'Urgent',
  'asap': 'ASAP',
  'stat': 'STAT'
};

export const CATEGORY_LABELS: Record<ImagingCategory, string> = {
  'diagnostic': 'Diagnostic',
  'screening': 'Screening',
  'follow-up': 'Follow-up',
  'pre-operative': 'Pre-operative',
  'post-operative': 'Post-operative',
  'emergency': 'Emergency'
};

export const CONTRAST_LABELS: Record<ContrastType, string> = {
  'none': 'No Contrast',
  'oral': 'Oral Contrast',
  'iv': 'IV Contrast',
  'oral-iv': 'Oral & IV Contrast',
  'intrathecal': 'Intrathecal',
  'arthrogram': 'Arthrogram'
};

export const BODY_REGION_LABELS: Record<BodyRegion, string> = {
  'head': 'Head',
  'neck': 'Neck',
  'chest': 'Chest',
  'abdomen': 'Abdomen',
  'pelvis': 'Pelvis',
  'spine': 'Spine',
  'upper-extremity': 'Upper Extremity',
  'lower-extremity': 'Lower Extremity',
  'whole-body': 'Whole Body'
};

export const LATERALITY_LABELS: Record<Laterality, string> = {
  'left': 'Left',
  'right': 'Right',
  'bilateral': 'Bilateral',
  'not-applicable': 'N/A'
};

export const SEVERITY_COLORS: Record<FindingSeverity, string> = {
  'normal': '#22c55e',
  'benign': '#22c55e',
  'probably-benign': '#84cc16',
  'suspicious': '#f59e0b',
  'highly-suspicious': '#ef4444',
  'malignant': '#dc2626'
};

// Common imaging procedures by modality
export const COMMON_PROCEDURES: Record<ImagingModality, Partial<ImagingProcedure>[]> = {
  'xray': [
    { procedureCode: 'XR-CHEST', procedureName: 'Chest X-Ray', bodyRegion: 'chest', cptCode: '71046' },
    { procedureCode: 'XR-ABDOMEN', procedureName: 'Abdominal X-Ray', bodyRegion: 'abdomen', cptCode: '74018' },
    { procedureCode: 'XR-SPINE-C', procedureName: 'Cervical Spine X-Ray', bodyRegion: 'spine', cptCode: '72040' },
    { procedureCode: 'XR-SPINE-L', procedureName: 'Lumbar Spine X-Ray', bodyRegion: 'spine', cptCode: '72100' },
    { procedureCode: 'XR-KNEE', procedureName: 'Knee X-Ray', bodyRegion: 'lower-extremity', cptCode: '73562' },
    { procedureCode: 'XR-HAND', procedureName: 'Hand X-Ray', bodyRegion: 'upper-extremity', cptCode: '73130' }
  ],
  'ct': [
    { procedureCode: 'CT-HEAD', procedureName: 'CT Head without Contrast', bodyRegion: 'head', cptCode: '70450' },
    { procedureCode: 'CT-HEAD-C', procedureName: 'CT Head with Contrast', bodyRegion: 'head', cptCode: '70460' },
    { procedureCode: 'CT-CHEST', procedureName: 'CT Chest without Contrast', bodyRegion: 'chest', cptCode: '71250' },
    { procedureCode: 'CT-CHEST-C', procedureName: 'CT Chest with Contrast', bodyRegion: 'chest', cptCode: '71260' },
    { procedureCode: 'CT-ABD-PEL', procedureName: 'CT Abdomen/Pelvis with Contrast', bodyRegion: 'abdomen', cptCode: '74177' },
    { procedureCode: 'CT-SPINE-C', procedureName: 'CT Cervical Spine', bodyRegion: 'spine', cptCode: '72125' }
  ],
  'mri': [
    { procedureCode: 'MRI-BRAIN', procedureName: 'MRI Brain without Contrast', bodyRegion: 'head', cptCode: '70551' },
    { procedureCode: 'MRI-BRAIN-C', procedureName: 'MRI Brain with Contrast', bodyRegion: 'head', cptCode: '70552' },
    { procedureCode: 'MRI-SPINE-C', procedureName: 'MRI Cervical Spine', bodyRegion: 'spine', cptCode: '72141' },
    { procedureCode: 'MRI-SPINE-L', procedureName: 'MRI Lumbar Spine', bodyRegion: 'spine', cptCode: '72148' },
    { procedureCode: 'MRI-KNEE', procedureName: 'MRI Knee', bodyRegion: 'lower-extremity', cptCode: '73721' },
    { procedureCode: 'MRI-SHOULDER', procedureName: 'MRI Shoulder', bodyRegion: 'upper-extremity', cptCode: '73221' }
  ],
  'ultrasound': [
    { procedureCode: 'US-ABD-COMP', procedureName: 'Abdominal Ultrasound Complete', bodyRegion: 'abdomen', cptCode: '76700' },
    { procedureCode: 'US-PELVIS', procedureName: 'Pelvic Ultrasound', bodyRegion: 'pelvis', cptCode: '76856' },
    { procedureCode: 'US-THYROID', procedureName: 'Thyroid Ultrasound', bodyRegion: 'neck', cptCode: '76536' },
    { procedureCode: 'US-BREAST', procedureName: 'Breast Ultrasound', bodyRegion: 'chest', cptCode: '76641' },
    { procedureCode: 'US-RENAL', procedureName: 'Renal Ultrasound', bodyRegion: 'abdomen', cptCode: '76770' },
    { procedureCode: 'US-CAROTID', procedureName: 'Carotid Doppler', bodyRegion: 'neck', cptCode: '93880' }
  ],
  'mammography': [
    { procedureCode: 'MAMMO-SCREEN', procedureName: 'Screening Mammography', bodyRegion: 'chest', cptCode: '77067' },
    { procedureCode: 'MAMMO-DIAG', procedureName: 'Diagnostic Mammography', bodyRegion: 'chest', cptCode: '77066' },
    { procedureCode: 'MAMMO-3D', procedureName: '3D Mammography (Tomosynthesis)', bodyRegion: 'chest', cptCode: '77063' }
  ],
  'fluoroscopy': [
    { procedureCode: 'FL-UGI', procedureName: 'Upper GI Series', bodyRegion: 'abdomen', cptCode: '74240' },
    { procedureCode: 'FL-BARIUM', procedureName: 'Barium Enema', bodyRegion: 'abdomen', cptCode: '74270' },
    { procedureCode: 'FL-SWALLOW', procedureName: 'Modified Barium Swallow', bodyRegion: 'neck', cptCode: '74230' }
  ],
  'nuclear': [
    { procedureCode: 'NM-BONE', procedureName: 'Bone Scan', bodyRegion: 'whole-body', cptCode: '78306' },
    { procedureCode: 'NM-THYROID', procedureName: 'Thyroid Scan', bodyRegion: 'neck', cptCode: '78014' },
    { procedureCode: 'NM-CARDIAC', procedureName: 'Cardiac Stress Test', bodyRegion: 'chest', cptCode: '78452' }
  ],
  'pet': [
    { procedureCode: 'PET-WHOLE', procedureName: 'PET/CT Whole Body', bodyRegion: 'whole-body', cptCode: '78815' },
    { procedureCode: 'PET-BRAIN', procedureName: 'PET Brain', bodyRegion: 'head', cptCode: '78608' }
  ],
  'dexa': [
    { procedureCode: 'DEXA-AXIAL', procedureName: 'DEXA Bone Density (Axial)', bodyRegion: 'spine', cptCode: '77080' },
    { procedureCode: 'DEXA-PERIPH', procedureName: 'DEXA Bone Density (Peripheral)', bodyRegion: 'upper-extremity', cptCode: '77081' }
  ]
};
