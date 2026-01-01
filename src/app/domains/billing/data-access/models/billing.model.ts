// ==================== Enums ====================

export enum ClaimStatus {
  Draft = 'draft',
  Pending = 'pending',
  Submitted = 'submitted',
  Accepted = 'accepted',
  Rejected = 'rejected',
  Denied = 'denied',
  PartialPaid = 'partial-paid',
  Paid = 'paid',
  Appealed = 'appealed',
  Voided = 'voided'
}

export enum ClaimType {
  Professional = 'professional',  // CMS-1500
  Institutional = 'institutional', // UB-04
  Dental = 'dental'
}

export enum PaymentStatus {
  Pending = 'pending',
  Posted = 'posted',
  Applied = 'applied',
  Refunded = 'refunded',
  Voided = 'voided'
}

export enum PaymentMethod {
  Cash = 'cash',
  Check = 'check',
  CreditCard = 'credit-card',
  DebitCard = 'debit-card',
  EFT = 'eft',
  Insurance = 'insurance',
  PatientPortal = 'patient-portal'
}

export enum AdjustmentReason {
  Contractual = 'contractual',
  WriteOff = 'write-off',
  Discount = 'discount',
  BadDebt = 'bad-debt',
  Charity = 'charity',
  SmallBalance = 'small-balance',
  PatientResponsibility = 'patient-responsibility',
  InsuranceDenial = 'insurance-denial',
  Duplicate = 'duplicate',
  Other = 'other'
}

export enum InsuranceType {
  Primary = 'primary',
  Secondary = 'secondary',
  Tertiary = 'tertiary',
  WorkersComp = 'workers-comp',
  AutoAccident = 'auto-accident',
  SelfPay = 'self-pay'
}

export enum VerificationStatus {
  NotVerified = 'not-verified',
  Verified = 'verified',
  Expired = 'expired',
  Inactive = 'inactive',
  Invalid = 'invalid'
}

export enum StatementStatus {
  Draft = 'draft',
  Generated = 'generated',
  Sent = 'sent',
  Paid = 'paid',
  Overdue = 'overdue',
  Collections = 'collections'
}

// ==================== Core Interfaces ====================

export interface Claim {
  claimId: string;
  id?: string; // alias for claimId
  claimNumber: string;
  patientId: string;
  patientName?: string; // for display
  encounterId: string;
  type: ClaimType;
  status: ClaimStatus;
  
  // Insurance info
  insuranceId: string;
  insuranceType: InsuranceType;
  payerId: string;
  payerName: string;
  subscriberId: string;
  groupNumber?: string;
  authorizationNumber?: string;
  
  // Provider info
  renderingProviderId: string;
  renderingProviderName: string;
  renderingProviderNPI: string;
  billingProviderId?: string;
  billingProviderName?: string;
  billingProviderNPI?: string;
  facilityId?: string;
  facilityName?: string;
  
  // Service info
  serviceDate: Date;
  serviceDateEnd?: Date;
  placeOfService: string;
  placeOfServiceCode: string;
  
  // Diagnosis codes
  diagnosisCodes: DiagnosisCode[];
  principalDiagnosis: string;
  
  // Charges
  lineItems: ClaimLineItem[];
  totalCharges: number;
  totalAllowed: number;
  totalPaid: number;
  totalAdjustments: number;
  patientResponsibility: number;
  balance: number;
  
  // Dates
  createdDate: Date;
  createdAt?: Date; // alias
  submittedDate?: Date;
  submittedAt?: Date; // alias
  receivedDate?: Date;
  receivedAt?: Date; // alias
  processedDate?: Date;
  processedAt?: Date; // alias
  paidDate?: Date;
  paymentDate?: Date; // alias
  
  // ERA/remittance info
  checkNumber?: string;
  eraId?: string;
  remittanceAdvice?: RemittanceAdvice;
  
  // Rejection/denial info
  rejectionReasons?: ClaimRejection[];
  rejectionCode?: string;
  rejectionMessage?: string;
  
  // Related claims
  originalClaimId?: string;
  rebilledClaimId?: string;
  
  // Provider objects (for display)
  renderingProvider?: { id: string; name: string; npi: string; };
  billingProvider?: { id: string; name: string; npi: string; };
  facility?: string;
  
  // Audit
  notes?: string;
  createdBy: string;
  updatedAt: Date;
  updatedBy?: string;
}

export interface ClaimLineItem {
  lineItemId: string;
  lineNumber: number;
  
  // Service codes
  procedureCode: string;
  procedureDescription: string;
  description?: string; // alias for procedureDescription
  modifiers?: string[];
  revenueCode?: string;
  
  // Diagnosis pointers
  diagnosisPointers: number[];
  
  // Charges
  units: number;
  unitCharge: number;
  totalCharge: number;
  allowedAmount?: number;
  paidAmount?: number;
  adjustmentAmount?: number;
  patientAmount?: number;
  
  // Service info
  serviceDate: Date;
  serviceDateEnd?: Date;
  placeOfService?: string;
  renderingProviderId?: string;
  
  // Adjudication
  status: 'pending' | 'paid' | 'denied' | 'adjusted';
  adjudicationStatus?: 'pending' | 'paid' | 'denied' | 'adjusted'; // alias for status
  denialReason?: string;
  adjustments?: LineItemAdjustment[];
  
  // NDC for drugs
  ndcCode?: string;
  ndcQuantity?: number;
  ndcUnit?: string;
}

export interface LineItemAdjustment {
  adjustmentId: string;
  groupCode: string;  // CO, PR, OA, PI, CR
  reasonCode: string;
  amount: number;
  description?: string;
}

export interface DiagnosisCode {
  code: string;
  description: string;
  pointer?: number;
  isPrincipal?: boolean;
}

export interface ClaimRejection {
  rejectionCode: string;
  rejectionMessage: string;
  rejectionDate: Date;
  lineItemId?: string;
  resolutionNotes?: string;
  resolvedDate?: Date;
}

export interface RemittanceAdvice {
  eraId: string;
  checkNumber: string;
  checkDate: Date;
  checkAmount: number;
  payerId: string;
  payerName: string;
  receivedDate: Date;
  processedDate?: Date;
  claimCount: number;
}

// ==================== Payment Interfaces ====================

export interface Payment {
  paymentId: string;
  id?: string; // alias for paymentId
  paymentNumber: string;
  patientId: string;
  
  // Payment info
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paymentDate: Date;
  
  // Source
  source: 'patient' | 'insurance' | 'other';
  payerName?: string;
  
  // Check/card details
  checkNumber?: string;
  cardType?: string;
  cardLastFour?: string;
  authorizationCode?: string;
  transactionId?: string;
  
  // ERA info (for insurance payments)
  eraId?: string;
  
  // Application
  applications: PaymentApplication[];
  unappliedAmount: number;
  
  // Refund info
  refundedAmount?: number;
  refundDate?: Date;
  refundReason?: string;
  
  // Audit
  notes?: string;
  createdAt: Date;
  createdBy: string;
  postedAt?: Date;
  postedBy?: string;
}

export interface PaymentApplication {
  applicationId: string;
  claimId?: string;
  encounterId?: string;
  lineItemId?: string;
  amount: number;
  appliedDate: Date;
  appliedBy: string;
}

export interface Adjustment {
  adjustmentId: string;
  id?: string; // alias for adjustmentId
  patientId: string;
  claimId?: string;
  encounterId?: string;
  lineItemId?: string;
  
  amount: number;
  reason: AdjustmentReason;
  description?: string;
  
  adjustmentDate: Date;
  createdBy: string;
  approvedBy?: string;
  approvedDate?: Date;
  
  notes?: string;
}

// ==================== Insurance Interfaces ====================

export interface InsurancePolicy {
  policyId: string;
  id?: string; // alias for policyId
  patientId: string;
  type: InsuranceType;
  
  // Payer info
  payerId: string;
  payerName: string;
  payerAddress?: Address;
  payerPhone?: string;
  
  // Policy info
  subscriberId: string;
  groupNumber?: string;
  planName?: string;
  planType?: string;  // HMO, PPO, EPO, POS, etc.
  
  // Coverage dates
  effectiveDate: Date;
  terminationDate?: Date;
  
  // Subscriber info
  subscriberName: string;
  subscriberDob: Date;
  subscriberRelationship: string;
  
  // Benefits
  copay?: number;
  coinsurance?: number;
  deductible?: number;
  deductibleMet?: number;
  outOfPocketMax?: number;
  outOfPocketMet?: number;
  
  // Verification
  verificationStatus: VerificationStatus;
  lastVerifiedDate?: Date;
  verifiedBy?: string;
  
  // Authorization
  requiresAuth?: boolean;
  authRequirements?: string;
  
  // Active status
  isActive: boolean;
  isPrimary: boolean;
  
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsuranceVerification {
  verificationId: string;
  policyId: string;
  patientId: string;
  
  verificationDate: Date;
  verifiedBy: string;
  
  // Results
  status: VerificationStatus;
  eligibilityStatus: 'active' | 'inactive' | 'unknown';
  
  // Coverage info
  effectiveDate?: Date;
  terminationDate?: Date;
  planName?: string;
  planType?: string;
  
  // Benefits verified
  copay?: number;
  coinsurance?: number;
  deductible?: number;
  deductibleMet?: number;
  outOfPocketMax?: number;
  outOfPocketMet?: number;
  
  // Network status
  inNetwork?: boolean;
  providerNetworkStatus?: string;
  
  // Notes
  notes?: string;
  errorMessage?: string;
  
  // Reference
  referenceNumber?: string;
  representativeName?: string;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
}

// ==================== Statement Interfaces ====================

export interface PatientStatement {
  statementId: string;
  id?: string; // alias for statementId
  patientId: string;
  statementNumber: string;
  
  // Statement info
  status: StatementStatus;
  statementDate: Date;
  dueDate: Date;
  
  // Amounts
  previousBalance: number;
  newCharges: number;
  payments: number;
  adjustments: number;
  currentBalance: number;
  
  // Aging
  current: number;
  over30: number;
  over60: number;
  over90: number;
  over120: number;
  
  // Items
  lineItems: StatementLineItem[];
  
  // Delivery
  deliveryMethod: 'mail' | 'email' | 'portal' | 'both';
  sentDate?: Date;
  
  // Notes
  message?: string;
  notes?: string;
  
  createdAt: Date;
  createdBy: string;
}

export interface StatementLineItem {
  date: Date;
  description: string;
  charges: number;
  payments: number;
  adjustments: number;
  balance: number;
  claimId?: string;
  encounterId?: string;
}

// ==================== Fee Schedule Interfaces ====================

export interface FeeSchedule {
  scheduleId: string;
  id?: string; // alias for scheduleId
  name: string;
  description?: string;
  
  effectiveDate: Date;
  expirationDate?: Date;
  
  type: 'standard' | 'medicare' | 'medicaid' | 'contracted' | 'custom';
  payerId?: string;
  
  fees: FeeScheduleItem[];
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeeScheduleItem {
  procedureCode: string;
  procedureDescription: string;
  modifiers?: string[];
  
  fee: number;
  allowedAmount?: number;
  
  effectiveDate: Date;
  expirationDate?: Date;
}

// ==================== Superbill Interface ====================

export interface Superbill {
  superbillId: string;
  encounterId: string;
  patientId: string;
  patientName?: string;
  providerId: string;
  providerName?: string;
  
  encounterDate: Date;
  
  // Diagnosis codes
  diagnosisCodes: DiagnosisCode[];
  
  // Services
  services: SuperbillService[];
  
  // Totals
  totalCharges: number;
  
  // Status
  status: 'draft' | 'completed' | 'billed';
  billedDate?: Date;
  claimId?: string;
  
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SuperbillService {
  procedureCode: string;
  procedureDescription: string;
  modifiers?: string[];
  diagnosisPointers: number[];
  units: number;
  fee: number;
  total: number;
}

// ==================== Constants ====================

export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  [ClaimStatus.Draft]: 'Draft',
  [ClaimStatus.Pending]: 'Pending',
  [ClaimStatus.Submitted]: 'Submitted',
  [ClaimStatus.Accepted]: 'Accepted',
  [ClaimStatus.Rejected]: 'Rejected',
  [ClaimStatus.Denied]: 'Denied',
  [ClaimStatus.PartialPaid]: 'Partially Paid',
  [ClaimStatus.Paid]: 'Paid',
  [ClaimStatus.Appealed]: 'Appealed',
  [ClaimStatus.Voided]: 'Voided'
};

export const CLAIM_TYPE_LABELS: Record<ClaimType, string> = {
  [ClaimType.Professional]: 'Professional (CMS-1500)',
  [ClaimType.Institutional]: 'Institutional (UB-04)',
  [ClaimType.Dental]: 'Dental'
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.Pending]: 'Pending',
  [PaymentStatus.Posted]: 'Posted',
  [PaymentStatus.Applied]: 'Applied',
  [PaymentStatus.Refunded]: 'Refunded',
  [PaymentStatus.Voided]: 'Voided'
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.Cash]: 'Cash',
  [PaymentMethod.Check]: 'Check',
  [PaymentMethod.CreditCard]: 'Credit Card',
  [PaymentMethod.DebitCard]: 'Debit Card',
  [PaymentMethod.EFT]: 'Electronic Funds Transfer',
  [PaymentMethod.Insurance]: 'Insurance Payment',
  [PaymentMethod.PatientPortal]: 'Patient Portal'
};

export const ADJUSTMENT_REASON_LABELS: Record<AdjustmentReason, string> = {
  [AdjustmentReason.Contractual]: 'Contractual Adjustment',
  [AdjustmentReason.WriteOff]: 'Write Off',
  [AdjustmentReason.Discount]: 'Discount',
  [AdjustmentReason.BadDebt]: 'Bad Debt',
  [AdjustmentReason.Charity]: 'Charity Care',
  [AdjustmentReason.SmallBalance]: 'Small Balance',
  [AdjustmentReason.PatientResponsibility]: 'Patient Responsibility',
  [AdjustmentReason.InsuranceDenial]: 'Insurance Denial',
  [AdjustmentReason.Duplicate]: 'Duplicate Charge',
  [AdjustmentReason.Other]: 'Other'
};

export const INSURANCE_TYPE_LABELS: Record<InsuranceType, string> = {
  [InsuranceType.Primary]: 'Primary',
  [InsuranceType.Secondary]: 'Secondary',
  [InsuranceType.Tertiary]: 'Tertiary',
  [InsuranceType.WorkersComp]: "Workers' Compensation",
  [InsuranceType.AutoAccident]: 'Auto Accident',
  [InsuranceType.SelfPay]: 'Self Pay'
};

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  [VerificationStatus.NotVerified]: 'Not Verified',
  [VerificationStatus.Verified]: 'Verified',
  [VerificationStatus.Expired]: 'Expired',
  [VerificationStatus.Inactive]: 'Inactive',
  [VerificationStatus.Invalid]: 'Invalid'
};

export const PLACE_OF_SERVICE_CODES: Record<string, string> = {
  '11': 'Office',
  '12': 'Home',
  '21': 'Inpatient Hospital',
  '22': 'Outpatient Hospital',
  '23': 'Emergency Room - Hospital',
  '24': 'Ambulatory Surgical Center',
  '31': 'Skilled Nursing Facility',
  '32': 'Nursing Facility',
  '41': 'Ambulance - Land',
  '42': 'Ambulance - Air/Water',
  '50': 'Federally Qualified Health Center',
  '51': 'Inpatient Psychiatric Facility',
  '52': 'Psychiatric Facility - Partial Hospitalization',
  '53': 'Community Mental Health Center',
  '61': 'Comprehensive Inpatient Rehab',
  '62': 'Comprehensive Outpatient Rehab',
  '65': 'End-Stage Renal Disease Treatment Facility',
  '71': 'State/Local Public Health Clinic',
  '72': 'Rural Health Clinic',
  '81': 'Independent Laboratory',
  '99': 'Other Place of Service'
};

// Common CPT codes for quick selection
export const COMMON_CPT_CODES = [
  { code: '99213', description: 'Office visit, established patient, level 3', fee: 125 },
  { code: '99214', description: 'Office visit, established patient, level 4', fee: 175 },
  { code: '99215', description: 'Office visit, established patient, level 5', fee: 250 },
  { code: '99203', description: 'Office visit, new patient, level 3', fee: 150 },
  { code: '99204', description: 'Office visit, new patient, level 4', fee: 225 },
  { code: '99205', description: 'Office visit, new patient, level 5', fee: 325 },
  { code: '99385', description: 'Preventive visit, new patient, 18-39 years', fee: 200 },
  { code: '99386', description: 'Preventive visit, new patient, 40-64 years', fee: 225 },
  { code: '99395', description: 'Preventive visit, established patient, 18-39 years', fee: 175 },
  { code: '99396', description: 'Preventive visit, established patient, 40-64 years', fee: 200 },
  { code: '36415', description: 'Venipuncture', fee: 15 },
  { code: '81002', description: 'Urinalysis', fee: 10 },
  { code: '85025', description: 'CBC with differential', fee: 25 },
  { code: '80053', description: 'Comprehensive metabolic panel', fee: 35 },
  { code: '80061', description: 'Lipid panel', fee: 30 },
  { code: '93000', description: 'ECG with interpretation', fee: 45 },
  { code: '71046', description: 'Chest X-ray, 2 views', fee: 85 },
  { code: '90471', description: 'Immunization administration', fee: 25 },
  { code: '96372', description: 'Therapeutic injection', fee: 30 },
  { code: '17000', description: 'Destruction of lesion', fee: 125 }
];
