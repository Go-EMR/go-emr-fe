/**
 * Encounter Models
 * Clinical encounter/visit documentation following FHIR standards
 */

// Encounter Status following FHIR R4
export type EncounterStatus = 
  | 'planned'
  | 'arrived'
  | 'triaged'
  | 'in-progress'
  | 'onleave'
  | 'finished'
  | 'cancelled';

// Encounter Class
export type EncounterClass = 
  | 'ambulatory'    // Outpatient
  | 'emergency'     // Emergency Department
  | 'inpatient'     // Hospital Stay
  | 'observation'   // Observation
  | 'virtual'       // Telehealth
  | 'home';         // Home Visit

// Vital Signs
export interface VitalSigns {
  id: string;
  encounterId: string;
  recordedAt: Date;
  recordedBy: string;
  
  // Core Vitals
  heightCm?: number;
  weightKg?: number;
  bmi?: number;
  temperatureCelsius?: number;
  temperatureLocation?: 'oral' | 'rectal' | 'axillary' | 'tympanic' | 'temporal';
  pulseRate?: number;
  pulseRhythm?: 'regular' | 'irregular';
  respiratoryRate?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  bloodPressurePosition?: 'sitting' | 'standing' | 'supine';
  oxygenSaturation?: number;
  oxygenSupplemental?: boolean;
  oxygenFlowRate?: number;
  
  // Pain
  painLevel?: number; // 0-10 scale
  painLocation?: string;
  
  // Additional
  headCircumferenceCm?: number; // For pediatrics
  waistCircumferenceCm?: number;
  
  notes?: string;
}

// SOAP Note Components
export interface SubjectiveAssessment {
  chiefComplaint: string;
  historyOfPresentIllness: string;
  reviewOfSystems?: ReviewOfSystems;
  socialHistory?: string;
  familyHistory?: string;
  allergies?: string;
  medications?: string;
}

export interface ReviewOfSystems {
  constitutional?: string;
  eyes?: string;
  entMouth?: string;
  cardiovascular?: string;
  respiratory?: string;
  gastrointestinal?: string;
  genitourinary?: string;
  musculoskeletal?: string;
  integumentary?: string;
  neurological?: string;
  psychiatric?: string;
  endocrine?: string;
  hematologicLymphatic?: string;
  allergicImmunologic?: string;
}

export interface ObjectiveAssessment {
  physicalExam?: PhysicalExam;
  vitalSignsId?: string;
  labResults?: string;
  imagingResults?: string;
  otherFindings?: string;
}

export interface PhysicalExam {
  general?: string;
  head?: string;
  eyes?: string;
  ears?: string;
  nose?: string;
  throat?: string;
  neck?: string;
  chest?: string;
  heart?: string;
  lungs?: string;
  abdomen?: string;
  extremities?: string;
  skin?: string;
  neurological?: string;
  psychiatric?: string;
  musculoskeletal?: string;
  genitourinary?: string;
  rectal?: string;
  lymphatic?: string;
}

export interface Assessment {
  clinicalImpression: string;
  diagnoses: Diagnosis[];
  differentialDiagnoses?: string[];
}

export interface Diagnosis {
  id: string;
  code: string;        // ICD-10 code
  codeSystem: 'ICD-10' | 'ICD-9' | 'SNOMED';
  description: string;
  type: 'primary' | 'secondary' | 'admitting' | 'discharge' | 'billing';
  status: 'active' | 'resolved' | 'inactive';
  onsetDate?: Date;
  resolvedDate?: Date;
  notes?: string;
}

export interface Plan {
  treatmentPlan: string;
  medications?: MedicationOrder[];
  procedures?: ProcedureOrder[];
  labOrders?: LabOrder[];
  imagingOrders?: ImagingOrder[];
  referrals?: Referral[];
  patientEducation?: string;
  followUp?: FollowUp;
  additionalInstructions?: string;
}

export interface MedicationOrder {
  id: string;
  medicationName: string;
  rxNormCode?: string;
  dosage: string;
  frequency: string;
  route: string;
  duration?: string;
  quantity?: number;
  refills?: number;
  instructions?: string;
  startDate?: Date;
  endDate?: Date;
  isPRN?: boolean;
  status: 'active' | 'completed' | 'cancelled' | 'draft';
}

export interface ProcedureOrder {
  id: string;
  procedureName: string;
  cptCode?: string;
  indication?: string;
  urgency: 'routine' | 'urgent' | 'stat';
  scheduledDate?: Date;
  notes?: string;
  status: 'ordered' | 'scheduled' | 'completed' | 'cancelled';
}

export interface LabOrder {
  id: string;
  testName: string;
  loincCode?: string;
  indication?: string;
  urgency: 'routine' | 'urgent' | 'stat';
  fastingRequired?: boolean;
  specialInstructions?: string;
  status: 'ordered' | 'collected' | 'in-progress' | 'completed' | 'cancelled';
}

export interface ImagingOrder {
  id: string;
  studyType: string;
  bodyPart: string;
  indication?: string;
  urgency: 'routine' | 'urgent' | 'stat';
  contrast?: boolean;
  specialInstructions?: string;
  status: 'ordered' | 'scheduled' | 'completed' | 'cancelled';
}

export interface Referral {
  id: string;
  specialty: string;
  providerName?: string;
  reason: string;
  urgency: 'routine' | 'urgent' | 'stat';
  notes?: string;
  status: 'pending' | 'sent' | 'accepted' | 'completed' | 'declined';
}

export interface FollowUp {
  timing: string;
  reason?: string;
  appointmentScheduled?: boolean;
  appointmentId?: string;
  instructions?: string;
}

// Main Encounter Model
export interface Encounter {
  id: string;
  status: EncounterStatus;
  class: EncounterClass;
  
  // Patient
  patient: {
    id: string;
    name: string;
    dob: string;
    mrn: string;
    photo?: string;
  };
  
  // Provider
  provider: {
    id: string;
    name: string;
    specialty?: string;
  };
  
  // Timing
  startTime: Date;
  endTime?: Date;
  duration?: number; // minutes
  
  // Location
  facilityId?: string;
  facilityName?: string;
  roomId?: string;
  roomName?: string;
  
  // Associated Records
  appointmentId?: string;
  
  // Clinical Content
  vitalSigns?: VitalSigns;
  subjective?: SubjectiveAssessment;
  objective?: ObjectiveAssessment;
  assessment?: Assessment;
  plan?: Plan;
  
  // Billing
  serviceType?: string;
  billingCodes?: BillingCode[];
  
  // Metadata
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
  signedAt?: Date;
  signedBy?: string;
  coSignedAt?: Date;
  coSignedBy?: string;
  
  // Notes
  additionalNotes?: string;
  
  // Attestation
  attestation?: string;
}

export interface BillingCode {
  code: string;
  codeSystem: 'CPT' | 'HCPCS' | 'ICD-10-PCS';
  description: string;
  quantity?: number;
  modifiers?: string[];
}

// DTOs
export interface CreateEncounterDto {
  patientId: string;
  providerId: string;
  appointmentId?: string;
  class: EncounterClass;
  facilityId?: string;
  roomId?: string;
  serviceType?: string;
}

export interface UpdateEncounterDto {
  status?: EncounterStatus;
  class?: EncounterClass;
  facilityId?: string;
  roomId?: string;
  endTime?: Date;
  vitalSigns?: Partial<VitalSigns>;
  subjective?: Partial<SubjectiveAssessment>;
  objective?: Partial<ObjectiveAssessment>;
  assessment?: Partial<Assessment>;
  plan?: Partial<Plan>;
  additionalNotes?: string;
  billingCodes?: BillingCode[];
}

// Search Params
export interface EncounterSearchParams {
  patientId?: string;
  providerId?: string;
  status?: EncounterStatus[];
  class?: EncounterClass[];
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Encounter Templates
export interface EncounterTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  encounterClass: EncounterClass;
  
  // Pre-filled content
  subjective?: Partial<SubjectiveAssessment>;
  objective?: Partial<ObjectiveAssessment>;
  assessment?: Partial<Assessment>;
  plan?: Partial<Plan>;
  
  // Metadata
  createdBy: string;
  isShared: boolean;
  usageCount: number;
}

// Status Labels
export const ENCOUNTER_STATUS_CONFIG: Record<EncounterStatus, { label: string; color: string; icon: string }> = {
  'planned': { label: 'Planned', color: '#6b7280', icon: 'schedule' },
  'arrived': { label: 'Arrived', color: '#f59e0b', icon: 'login' },
  'triaged': { label: 'Triaged', color: '#8b5cf6', icon: 'assignment' },
  'in-progress': { label: 'In Progress', color: '#3b82f6', icon: 'edit_note' },
  'onleave': { label: 'On Leave', color: '#f97316', icon: 'exit_to_app' },
  'finished': { label: 'Completed', color: '#10b981', icon: 'check_circle' },
  'cancelled': { label: 'Cancelled', color: '#ef4444', icon: 'cancel' },
};

export const ENCOUNTER_CLASS_CONFIG: Record<EncounterClass, { label: string; icon: string }> = {
  'ambulatory': { label: 'Office Visit', icon: 'medical_services' },
  'emergency': { label: 'Emergency', icon: 'emergency' },
  'inpatient': { label: 'Inpatient', icon: 'local_hospital' },
  'observation': { label: 'Observation', icon: 'visibility' },
  'virtual': { label: 'Telehealth', icon: 'videocam' },
  'home': { label: 'Home Visit', icon: 'home' },
};

// Commonly used ICD-10 codes for quick selection
export const COMMON_DIAGNOSES: { code: string; description: string }[] = [
  { code: 'J06.9', description: 'Acute upper respiratory infection, unspecified' },
  { code: 'J02.9', description: 'Acute pharyngitis, unspecified' },
  { code: 'J00', description: 'Acute nasopharyngitis (common cold)' },
  { code: 'J20.9', description: 'Acute bronchitis, unspecified' },
  { code: 'N39.0', description: 'Urinary tract infection, site not specified' },
  { code: 'I10', description: 'Essential (primary) hypertension' },
  { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
  { code: 'J45.909', description: 'Unspecified asthma, uncomplicated' },
  { code: 'M54.5', description: 'Low back pain' },
  { code: 'R51', description: 'Headache' },
  { code: 'K21.0', description: 'Gastro-esophageal reflux disease with esophagitis' },
  { code: 'F41.1', description: 'Generalized anxiety disorder' },
  { code: 'F32.9', description: 'Major depressive disorder, single episode, unspecified' },
  { code: 'L30.9', description: 'Dermatitis, unspecified' },
  { code: 'Z00.00', description: 'Encounter for general adult medical examination without abnormal findings' },
];
