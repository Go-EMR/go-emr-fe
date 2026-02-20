// Prescription models following FHIR MedicationRequest patterns

export type PrescriptionStatus = 
  | 'active' 
  | 'on-hold' 
  | 'cancelled' 
  | 'completed' 
  | 'entered-in-error' 
  | 'stopped' 
  | 'draft' 
  | 'unknown';

export type PrescriptionIntent = 
  | 'proposal' 
  | 'plan' 
  | 'order' 
  | 'original-order' 
  | 'reflex-order' 
  | 'filler-order' 
  | 'instance-order' 
  | 'option';

export type PrescriptionPriority = 'routine' | 'urgent' | 'asap' | 'stat';

export type MedicationType = 'rx' | 'otc' | 'supplement' | 'herbal' | 'vitamin';

export type VerificationStatus = 'verified' | 'patient-reported' | 'unverified';

export interface Medication {
  id: string;
  name: string;
  genericName?: string;
  brandNames?: string[];
  brandName?: string; // Single brand name alias
  ndc?: string; // National Drug Code
  rxcui?: string; // RxNorm Concept Unique Identifier
  form: MedicationForm;
  strength: string;
  strengthUnit: string;
  manufacturer?: string;
  isGeneric: boolean;
  isControlled: boolean;
  controlledSchedule?: 'II' | 'III' | 'IV' | 'V';
  requiresPriorAuth?: boolean;
  formularyStatus?: 'preferred' | 'non-preferred' | 'not-covered' | 'prior-auth-required';
  therapeuticClass?: string;
  pharmacologicClass?: string;
  warnings?: string[];
  contraindications?: string[];
  interactions?: DrugInteraction[];
  medicationType?: MedicationType;
  verificationStatus?: VerificationStatus;
  // Additional dosing properties
  route?: MedicationRoute;
  drugClass?: string;
  dose?: number;
  doseUnit?: string;
  frequency?: string;
  duration?: number;
  durationUnit?: string;
  sig?: string; // Signature - complete dosing instructions
}

export type MedicationForm = 
  | 'tablet' 
  | 'capsule' 
  | 'solution' 
  | 'suspension' 
  | 'injection' 
  | 'patch' 
  | 'cream' 
  | 'ointment' 
  | 'gel' 
  | 'inhaler' 
  | 'drops' 
  | 'suppository'
  | 'powder'
  | 'spray'
  | 'lozenge'
  | 'film'
  | 'other';

export interface DrugInteraction {
  drugId: string;
  drugName: string;
  severity: 'high' | 'moderate' | 'low';
  description: string;
  clinicalSignificance: string;
}

export interface Dosage {
  text: string; // Human readable dosing instructions
  timing: DosageTiming;
  route: MedicationRoute;
  method?: string;
  doseQuantity?: number;
  doseUnit?: string;
  maxDosePerPeriod?: string;
  asNeeded?: boolean;
  asNeededReason?: string;
}

export interface DosageTiming {
  frequency?: number; // Times per period
  period?: number;
  periodUnit?: 'h' | 'd' | 'wk' | 'mo'; // hour, day, week, month
  when?: ('MORN' | 'MORN.early' | 'MORN.late' | 'NOON' | 'AFT' | 'AFT.early' | 'AFT.late' | 'EVE' | 'EVE.early' | 'EVE.late' | 'NIGHT' | 'PHS' | 'HS' | 'WAKE' | 'C' | 'CM' | 'CD' | 'CV' | 'AC' | 'ACM' | 'ACD' | 'ACV' | 'PC' | 'PCM' | 'PCD' | 'PCV')[];
  duration?: number;
  durationUnit?: 'd' | 'wk' | 'mo' | 'a'; // day, week, month, year
  bounds?: {
    start?: Date;
    end?: Date;
  };
  code?: string; // SNOMED or other timing code
  text?: string; // Human readable timing
}

export type MedicationRoute = 
  | 'oral' 
  | 'sublingual' 
  | 'buccal'
  | 'topical' 
  | 'transdermal'
  | 'inhalation' 
  | 'nasal'
  | 'ophthalmic' 
  | 'otic' 
  | 'rectal' 
  | 'vaginal'
  | 'intramuscular' 
  | 'subcutaneous' 
  | 'intravenous' 
  | 'intradermal'
  | 'intrathecal'
  | 'intraarticular'
  | 'other';

export interface DispenseInfo {
  quantity: number;
  unit: string;
  daysSupply: number;
  refills: number;
  refillsRemaining?: number;
  substitutionsAllowed: boolean;
  pharmacy?: Pharmacy;
  dispenseAsWritten?: boolean;
  expectedSupplyDuration?: number;
}

export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  fax?: string;
  ncpdpId?: string; // National Council for Prescription Drug Programs ID
  npi?: string; // National Provider Identifier
  isRetail: boolean;
  isMailOrder: boolean;
  isSpecialty: boolean;
  is24Hour?: boolean;
  eRxEnabled?: boolean;
}

export interface Prescription {
  id: string;
  status: PrescriptionStatus;
  intent: PrescriptionIntent;
  priority: PrescriptionPriority;
  
  // Medication
  medication: Medication;
  
  // Patient (nested object)
  patient: {
    id: string;
    name: string;
    dob: string;
    mrn: string;
    allergies?: string[];
  };
  
  // Flat patient properties (aliases for template convenience)
  patientId?: string;
  patientName?: string;
  patientMRN?: string;
  patientDOB?: string;
  
  // Prescriber (nested object)
  prescriber: {
    id: string;
    name: string;
    npi?: string;
    deaNumber?: string;
    specialty?: string;
  };
  
  // Flat prescriber properties (aliases for template convenience)
  prescriberName?: string;
  prescriberNPI?: string;
  prescriberDEA?: string;
  
  // Encounter reference
  encounterId?: string;
  
  // Dosage instructions
  dosage: Dosage;
  
  // Dispense details
  dispense: DispenseInfo;
  
  // Flat dispense properties (aliases for template convenience)
  quantity?: number;
  quantityUnit?: string;
  daysSupply?: number;
  refills?: number;
  refillsRemaining?: number;
  dispenseAsWritten?: boolean;
  isGenericAllowed?: boolean;
  
  // Pharmacy reference
  pharmacy?: PharmacyInfo;
  
  // Clinical info
  reasonCode?: string; // ICD-10 code
  reasonDescription?: string;
  indication?: string;
  
  // Controlled substance info
  isControlledSubstance?: boolean;
  controlledSubstanceSchedule?: 'II' | 'III' | 'IV' | 'V';
  
  // PRN (as needed) flag
  isPRN?: boolean;
  
  // Transmission status
  transmissionStatus?: 'pending' | 'sent' | 'delivered' | 'failed' | 'printed' | 'faxed';
  
  // Dates
  authoredOn: Date;
  prescribedDate?: Date; // Alias for authoredOn
  validFrom?: Date;
  startDate?: Date; // Alias for validFrom
  validUntil?: Date;
  expirationDate?: Date; // Alias for validUntil
  endDate?: Date; // Alias for validUntil
  nextRefillDate?: Date;
  lastFilledDate?: Date;
  discontinuedAt?: Date;
  discontinuedReason?: string;
  
  // E-prescribe info
  ePrescribeStatus?: 'pending' | 'sent' | 'received' | 'filled' | 'partial' | 'cancelled' | 'error';
  ePrescribeSentAt?: Date;
  ePrescribeConfirmation?: string;
  
  // Prior authorization
  priorAuthRequired?: boolean;
  priorAuthorizationRequired?: boolean; // Alias for priorAuthRequired
  priorAuthStatus?: 'pending' | 'approved' | 'denied' | 'not-required';
  priorAuthNumber?: string;
  priorAuthorizationNumber?: string; // Alias for priorAuthNumber
  priorAuthExpires?: Date;
  
  // Notes
  notes?: string;
  pharmacyNotes?: string;
  patientInstructions?: string;
  internalNotes?: string;
  
  // Additional clinical info
  diagnosisCodes?: string[];
  requiresMonitoring?: boolean;
  isLongTerm?: boolean;
  
  // Audit
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
  
  // Refill history
  refillHistory?: RefillRecord[];
  
  // Prescription history
  history?: PrescriptionHistory[];
}

// Prescription history entry
export interface PrescriptionHistory {
  id: string;
  prescriptionId: string;
  action: 'created' | 'updated' | 'renewed' | 'refilled' | 'cancelled' | 'discontinued' | 'sent' | 'printed' | 'faxed';
  timestamp: Date;
  performedBy: string;
  performedByName?: string;
  details?: string;
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
}

export interface RefillRecord {
  id: string;
  refillNumber: number;
  requestedAt: Date;
  filledAt?: Date;
  pharmacy: Pharmacy;
  quantity: number;
  daysSupply: number;
  status: 'requested' | 'approved' | 'denied' | 'filled' | 'partial' | 'cancelled';
  denialReason?: string;
  notes?: string;
}

export interface PrescriptionSearchParams {
  patientId?: string;
  prescriberId?: string;
  status?: PrescriptionStatus[];
  medicationName?: string;
  startDate?: string;
  endDate?: string;
  isControlled?: boolean;
  needsRefill?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreatePrescriptionDto {
  patientId: string;
  medicationId: string;
  encounterId?: string;
  dosage: Dosage;
  dispense: Omit<DispenseInfo, 'refillsRemaining'>;
  reasonCode?: string;
  reasonDescription?: string;
  indication?: string;
  notes?: string;
  pharmacyNotes?: string;
  patientInstructions?: string;
  priority?: PrescriptionPriority;
  validFrom?: Date;
  validUntil?: Date;
}

export interface RenewPrescriptionDto {
  prescriptionId: string;
  changes?: {
    dosage?: Partial<Dosage>;
    dispense?: Partial<DispenseInfo>;
    notes?: string;
  };
}

export interface RefillRequestDto {
  prescriptionId: string;
  pharmacyId?: string;
  quantity?: number;
  notes?: string;
}

// Formulary / Drug Database
export interface FormularyEntry {
  medication: Medication;
  tierLevel: 1 | 2 | 3 | 4 | 5;
  copay?: number;
  requiresPriorAuth: boolean;
  quantityLimit?: number;
  quantityLimitPeriod?: 'd' | 'wk' | 'mo';
  stepTherapyRequired: boolean;
  stepTherapyDrugs?: string[];
  specialtyDrug: boolean;
  effectiveDate: Date;
  terminationDate?: Date;
}

export interface DrugSearchResult extends Partial<MedicationSearchResult> {
  medication: Medication;
  formularyEntry?: FormularyEntry;
  patientAllergies?: string[];
  hasInteractions: boolean;
  interactionCount?: number;
  // Flat properties for compatibility (can be derived from medication)
  id?: string;
  rxcui?: string;
  ndc?: string;
  name?: string;
  genericName?: string;
  brandName?: string;
  strength?: string;
  strengthUnit?: string;
  form?: MedicationForm;
  route?: MedicationRoute;
  drugClass?: string;
  isGeneric?: boolean;
  isControlled?: boolean;
  controlledSchedule?: 'II' | 'III' | 'IV' | 'V';
  schedule?: 'II' | 'III' | 'IV' | 'V';
  commonQuantities?: number[];
  commonDaysSupply?: number[];
}

// Prescription alerts
export interface PrescriptionAlert {
  type: 'allergy' | 'interaction' | 'duplicate' | 'dose-warning' | 'contraindication' | 'formulary';
  severity: 'high' | 'moderate' | 'low' | 'info';
  title: string;
  message: string;
  details?: string;
  actionRequired: boolean;
  overrideReason?: string;
}

// Medication search result for prescription editor
export interface MedicationSearchResult {
  id: string;
  rxcui: string;
  ndc?: string;
  name: string;
  genericName?: string;
  brandName?: string;
  strength: string;
  strengthUnit: string;
  form: MedicationForm;
  route?: MedicationRoute;
  drugClass?: string;
  isGeneric: boolean;
  isControlled: boolean;
  controlledSchedule?: 'II' | 'III' | 'IV' | 'V';
  schedule?: 'II' | 'III' | 'IV' | 'V'; // Alias for controlledSchedule
  commonQuantities?: number[];
  commonDaysSupply?: number[];
}

// Pharmacy info for prescription editor
export interface PharmacyAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  zipCode?: string; // Alias for zip
}

export interface PharmacyInfo {
  id: string;
  name: string;
  address: PharmacyAddress; // Structured address object
  phone: string;
  fax?: string;
  ncpdpId?: string;
  npi?: string;
  isRetail: boolean;
  isMailOrder: boolean;
  isSpecialty: boolean;
  is24Hour?: boolean;
  acceptsEpcs?: boolean;
  isPreferred?: boolean;
}

// Drug allergy
export interface DrugAllergy {
  allergen: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe';
  onsetDate?: Date;
}

// Frequency options
export interface FrequencyOption {
  code: string;
  display: string;
  description?: string;
  timesPerDay?: number;
}

export const COMMON_FREQUENCIES: FrequencyOption[] = [
  { code: 'QD', display: 'Once daily', description: 'Take once per day', timesPerDay: 1 },
  { code: 'BID', display: 'Twice daily', description: 'Take twice per day', timesPerDay: 2 },
  { code: 'TID', display: 'Three times daily', description: 'Take three times per day', timesPerDay: 3 },
  { code: 'QID', display: 'Four times daily', description: 'Take four times per day', timesPerDay: 4 },
  { code: 'Q4H', display: 'Every 4 hours', description: 'Take every 4 hours', timesPerDay: 6 },
  { code: 'Q6H', display: 'Every 6 hours', description: 'Take every 6 hours', timesPerDay: 4 },
  { code: 'Q8H', display: 'Every 8 hours', description: 'Take every 8 hours', timesPerDay: 3 },
  { code: 'Q12H', display: 'Every 12 hours', description: 'Take every 12 hours', timesPerDay: 2 },
  { code: 'QHS', display: 'At bedtime', description: 'Take at bedtime', timesPerDay: 1 },
  { code: 'PRN', display: 'As needed', description: 'Take as needed for symptoms' },
  { code: 'STAT', display: 'Immediately', description: 'Take immediately', timesPerDay: 1 },
  { code: 'QOD', display: 'Every other day', description: 'Take every other day' },
  { code: 'QWK', display: 'Once weekly', description: 'Take once per week' }
];

export const QUANTITY_UNITS = [
  'tablets', 'capsules', 'ml', 'mg', 'g', 'units', 'patches', 'inhalers', 'puffs', 'drops', 'suppositories'
];

export const DOSE_UNITS = [
  'mg', 'g', 'mcg', 'ml', 'units', 'tablets', 'capsules', 'puffs', 'drops'
];
