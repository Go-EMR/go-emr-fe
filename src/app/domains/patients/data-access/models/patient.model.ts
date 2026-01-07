/**
 * Patient domain models
 * Following FHIR R4 patient resource structure where applicable
 */

// Family relation types
export type FamilyRelationType = 'spouse' | 'parent' | 'child' | 'sibling' | 'guardian' | 'other';

export interface FamilyRelation {
  id: string;
  relatedPatientId: string;
  relatedPatientName: string;
  relatedPatientMrn: string;
  relationship: FamilyRelationType;
  reverseRelationship?: FamilyRelationType; // e.g., if this patient is "child", related is "parent"
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  createdAt: Date;
}

export interface Patient {
  id: string;
  mrn: string; // Medical Record Number
  status: PatientStatus;
  
  // Demographics
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: Date;
  gender: Gender;
  ssn?: string; // Last 4 digits only for display
  maritalStatus?: MaritalStatus;
  bloodGroup?: BloodGroup;
  
  // Contact
  email?: string;
  phone?: string;
  mobilePhone?: string;
  preferredContactMethod: ContactMethod;
  
  // Address
  address?: Address;
  
  // Emergency Contact
  emergencyContact?: EmergencyContact;
  
  // Insurance
  insurances?: Insurance[];
  insurance?: Insurance[]; // Alias for insurances
  
  // Medical
  primaryProviderId?: string;
  primaryProvider?: ProviderSummary;
  allergies?: Allergy[];
  problems?: Problem[];
  
  // Family Relations
  familyRelations?: FamilyRelation[];
  
  // Administrative - Multi-Clinic Support
  facilityId: string;
  facilityName?: string;
  clinicId?: string;
  clinicName?: string;
  visitType?: VisitType; // OPD, IPD, Emergency, Day Care
  
  createdAt: Date;
  updatedAt: Date;
  lastVisit?: Date;
  nextAppointment?: Date;
  
  // Privacy
  consentStatus: ConsentStatus;
  doNotContact?: boolean;
  portalEnabled?: boolean;
  
  // Avatar/Photo
  photoUrl?: string;
}

export type PatientStatus = 'active' | 'inactive' | 'deceased' | 'archived';

export type Gender = 'male' | 'female' | 'other' | 'unknown';

export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed' | 'separated' | 'unknown';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown';

export type ContactMethod = 'phone' | 'email' | 'mail' | 'portal';

export type VisitType = 'opd' | 'ipd' | 'emergency' | 'daycare';

export interface Address {
  line1: string;
  street1?: string; // Alias for line1
  line2?: string;
  street2?: string; // Alias for line2
  city: string;
  state: string;
  postalCode: string;
  zipCode?: string; // Alias for postalCode
  country: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  alternatePhone?: string;
}

export interface Insurance {
  id: string;
  type: 'primary' | 'secondary' | 'tertiary';
  payerId: string;
  payerName: string;
  planName: string;
  memberId: string;
  groupNumber?: string;
  subscriberName?: string;
  subscriberDob?: Date;
  subscriberRelationship: SubscriberRelationship;
  effectiveDate: Date;
  terminationDate?: Date;
  copay?: number;
  deductible?: number;
  coinsurance?: number;
}

export type SubscriberRelationship = 'self' | 'spouse' | 'child' | 'other';

export interface ProviderSummary {
  id: string;
  name: string;
  npi: string;
  specialty?: string;
}

export interface Allergy {
  id: string;
  type: 'drug' | 'food' | 'environmental' | 'other';
  allergen: string;
  reaction?: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life-threatening';
  status: 'active' | 'inactive' | 'resolved';
  onsetDate?: Date;
  recordedDate: Date;
  verifiedBy?: string;
}

export interface Problem {
  id: string;
  code: string; // ICD-10 code
  description: string;
  status: 'active' | 'resolved' | 'inactive';
  onsetDate?: Date;
  resolvedDate?: Date;
  clinicalStatus: 'active' | 'recurrence' | 'relapse' | 'inactive' | 'remission' | 'resolved';
  verificationStatus: 'unconfirmed' | 'provisional' | 'differential' | 'confirmed' | 'refuted';
  severity?: 'mild' | 'moderate' | 'severe';
}

export interface ConsentStatus {
  hipaaConsent: boolean;
  hipaaConsentDate?: Date;
  treatmentConsent: boolean;
  treatmentConsentDate?: Date;
  marketingConsent: boolean;
  portalConsent: boolean;
}

// DTOs

export interface CreatePatientDto {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: Date;
  gender: Gender;
  ssn?: string;
  maritalStatus?: MaritalStatus;
  bloodGroup?: BloodGroup;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  preferredContactMethod?: ContactMethod;
  address?: Address;
  emergencyContact?: EmergencyContact;
  primaryProviderId?: string;
  facilityId: string;
  clinicId?: string;
  visitType?: VisitType;
  familyRelations?: CreateFamilyRelationDto[];
}

export interface CreateFamilyRelationDto {
  relatedPatientId: string;
  relationship: FamilyRelationType;
}

export interface UpdatePatientDto extends Partial<CreatePatientDto> {
  status?: PatientStatus;
  doNotContact?: boolean;
}

// Clinic/Facility model for multi-clinic support
export interface Clinic {
  id: string;
  name: string;
  code: string;
  type: ClinicType;
  address: Address;
  phone: string;
  email?: string;
  operatingHours?: OperatingHours;
  services?: string[];
  departments?: Department[];
  status: 'active' | 'inactive';
}

export type ClinicType = 'hospital' | 'clinic' | 'urgent_care' | 'specialty' | 'diagnostic';

export interface OperatingHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

export interface DayHours {
  open: string; // "09:00"
  close: string; // "17:00"
  closed?: boolean;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  type: 'opd' | 'ipd' | 'emergency' | 'diagnostic' | 'surgical' | 'admin';
  head?: string;
  phone?: string;
}

export interface PatientSearchParams {
  query?: string;
  mrn?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  status?: PatientStatus;
  providerId?: string;
  facilityId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PatientSearchResult {
  patients: Patient[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Summary views
export interface PatientSummary {
  id: string;
  mrn: string;
  fullName: string;
  dateOfBirth: Date;
  age: number;
  gender: Gender;
  phone?: string;
  lastVisit?: Date;
  primaryProvider?: string;
  status: PatientStatus;
  photoUrl?: string;
}

export interface PatientHeader {
  id: string;
  mrn: string;
  fullName: string;
  dateOfBirth: Date;
  age: number;
  gender: Gender;
  allergies: string[];
  alerts: string[];
  photoUrl?: string;
}
