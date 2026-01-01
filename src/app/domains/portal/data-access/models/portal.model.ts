// Portal Domain Models - Patient-Facing Features

// ============================================================================
// Appointment Booking
// ============================================================================

export type AppointmentSlotStatus = 'available' | 'booked' | 'blocked' | 'past';

export interface AppointmentSlot {
  id: string;
  providerId: string;
  providerName: string;
  providerSpecialty: string;
  locationId: string;
  locationName: string;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  status: AppointmentSlotStatus;
  appointmentType: string;
}

export interface AppointmentRequest {
  id: string;
  patientId: string;
  providerId?: string;
  providerName?: string;
  appointmentType: string;
  preferredDates: Date[];
  preferredTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'any';
  reason: string;
  urgency: 'routine' | 'urgent' | 'emergency';
  notes?: string;
  status: 'pending' | 'scheduled' | 'cancelled' | 'declined';
  createdAt: Date;
  updatedAt: Date;
  scheduledSlotId?: string;
  responseMessage?: string;
}

export interface UpcomingAppointment {
  id: string;
  providerId: string;
  providerName: string;
  providerSpecialty: string;
  providerAvatar?: string;
  locationId: string;
  locationName: string;
  locationAddress: string;
  date: Date;
  startTime: string;
  endTime: string;
  appointmentType: string;
  status: 'scheduled' | 'confirmed' | 'checked-in' | 'completed' | 'cancelled' | 'no-show';
  confirmationRequired: boolean;
  canCancel: boolean;
  canReschedule: boolean;
  telehealth: boolean;
  telehealthUrl?: string;
  preVisitInstructions?: string;
  formsRequired: string[];
}

// ============================================================================
// Bill Pay
// ============================================================================

export type StatementStatus = 'pending' | 'paid' | 'partial' | 'overdue' | 'collections';

export interface PatientStatement {
  id: string;
  statementNumber: string;
  statementDate: Date;
  dueDate: Date;
  patientId: string;
  totalCharges: number;
  insurancePayments: number;
  adjustments: number;
  patientPayments: number;
  balanceDue: number;
  status: StatementStatus;
  lineItems: StatementLineItem[];
  previousBalance: number;
  newCharges: number;
}

export interface StatementLineItem {
  id: string;
  serviceDate: Date;
  description: string;
  providerName: string;
  cptCode?: string;
  charges: number;
  insurancePaid: number;
  adjustments: number;
  patientResponsibility: number;
}

export interface PaymentMethod {
  id: string;
  patientId: string;
  type: 'credit_card' | 'debit_card' | 'bank_account';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  bankName?: string;
  accountType?: 'checking' | 'savings';
  isDefault: boolean;
  nickname?: string;
  createdAt: Date;
}

export interface PaymentPlan {
  id: string;
  patientId: string;
  originalBalance: number;
  remainingBalance: number;
  monthlyAmount: number;
  totalPayments: number;
  paymentsCompleted: number;
  nextPaymentDate: Date;
  nextPaymentAmount: number;
  paymentMethodId: string;
  status: 'active' | 'completed' | 'defaulted' | 'cancelled';
  startDate: Date;
  endDate: Date;
  autoPayEnabled: boolean;
}

export interface PaymentRecord {
  id: string;
  patientId: string;
  amount: number;
  date: Date;
  method: 'credit_card' | 'debit_card' | 'bank_account' | 'cash' | 'check';
  last4?: string;
  confirmationNumber: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  appliedTo: string;
  receiptUrl?: string;
}

// ============================================================================
// Forms
// ============================================================================

export type FormType = 'intake' | 'consent' | 'medical_history' | 'hipaa' | 'financial' | 'questionnaire' | 'custom';
export type FormStatus = 'pending' | 'in_progress' | 'completed' | 'expired';

export interface PatientForm {
  id: string;
  formTemplateId: string;
  patientId: string;
  title: string;
  description: string;
  type: FormType;
  status: FormStatus;
  dueDate?: Date;
  completedAt?: Date;
  signatureRequired: boolean;
  signedAt?: Date;
  appointmentId?: string;
  appointmentDate?: Date;
  sections: FormSection[];
  progress: number;
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  fields: FormField[];
  completed: boolean;
}

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'signature' | 'file';
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: { label: string; value: string }[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
  value?: any;
  order: number;
}

// ============================================================================
// Health Records
// ============================================================================

export interface HealthRecordSummary {
  patientId: string;
  lastVisitDate?: Date;
  upcomingAppointment?: {
    date: Date;
    providerName: string;
    type: string;
  };
  activeMedications: number;
  allergies: string[];
  recentLabResults: number;
  unreadMessages: number;
  pendingForms: number;
  outstandingBalance: number;
}

export interface EncounterSummary {
  id: string;
  date: Date;
  providerName: string;
  providerSpecialty: string;
  visitType: string;
  chiefComplaint?: string;
  diagnoses: string[];
  hasLabResults: boolean;
  hasDocuments: boolean;
  canViewNotes: boolean;
}

export interface MedicationRecord {
  id: string;
  medicationName: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  route: string;
  prescribedDate: Date;
  prescribedBy: string;
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'discontinued' | 'completed';
  refillsRemaining: number;
  refillsTotal: number;
  lastFilledDate?: Date;
  pharmacy?: string;
  instructions: string;
  isControlled: boolean;
  canRequestRefill: boolean;
}

export interface LabResultSummary {
  id: string;
  orderId: string;
  testName: string;
  orderDate: Date;
  resultDate?: Date;
  orderedBy: string;
  status: 'ordered' | 'collected' | 'processing' | 'resulted' | 'reviewed';
  hasAbnormal: boolean;
  isNew: boolean;
}

export interface LabResultDetail {
  id: string;
  orderId: string;
  testName: string;
  category: string;
  orderDate: Date;
  collectionDate?: Date;
  resultDate?: Date;
  orderedBy: string;
  status: string;
  components: LabResultComponent[];
  interpretation?: string;
  comments?: string;
}

export interface LabResultComponent {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag?: 'normal' | 'low' | 'high' | 'critical';
}

export interface ImmunizationRecord {
  id: string;
  vaccineName: string;
  vaccineCode: string;
  administeredDate: Date;
  administeredBy: string;
  location: string;
  lotNumber?: string;
  manufacturer?: string;
  site?: string;
  route?: string;
  doseNumber?: number;
  seriesComplete: boolean;
  nextDoseDate?: Date;
  notes?: string;
}

export interface DocumentRecord {
  id: string;
  title: string;
  documentType: 'visit_summary' | 'lab_report' | 'imaging' | 'referral' | 'letter' | 'consent' | 'other';
  date: Date;
  provider?: string;
  category: string;
  fileSize: number;
  fileType: string;
  downloadUrl: string;
  isNew: boolean;
}

export interface AllergyRecord {
  id: string;
  allergen: string;
  type: 'drug' | 'food' | 'environmental' | 'other';
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  onsetDate?: Date;
  status: 'active' | 'inactive' | 'resolved';
  notes?: string;
}

export interface VitalRecord {
  id: string;
  date: Date;
  height?: { value: number; unit: string };
  weight?: { value: number; unit: string };
  bmi?: number;
  bloodPressure?: { systolic: number; diastolic: number };
  heartRate?: number;
  temperature?: { value: number; unit: string };
  respiratoryRate?: number;
  oxygenSaturation?: number;
}

// ============================================================================
// Secure Messaging
// ============================================================================

export interface SecureMessage {
  id: string;
  threadId: string;
  patientId: string;
  senderId: string;
  senderName: string;
  senderType: 'patient' | 'provider' | 'staff';
  recipientId: string;
  recipientName: string;
  subject: string;
  body: string;
  sentAt: Date;
  readAt?: Date;
  isUrgent: boolean;
  attachments: MessageAttachment[];
  replyToId?: string;
}

export interface MessageThread {
  id: string;
  patientId: string;
  subject: string;
  category: 'general' | 'appointment' | 'prescription' | 'lab_results' | 'billing' | 'referral';
  participants: {
    id: string;
    name: string;
    type: 'patient' | 'provider' | 'staff';
  }[];
  lastMessageAt: Date;
  lastMessagePreview: string;
  unreadCount: number;
  status: 'open' | 'closed' | 'archived';
  createdAt: Date;
}

export interface MessageAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string;
}

// ============================================================================
// Portal Settings
// ============================================================================

export interface PortalPreferences {
  patientId: string;
  notifications: {
    email: boolean;
    sms: boolean;
    appointmentReminders: boolean;
    labResultsReady: boolean;
    newMessages: boolean;
    billingAlerts: boolean;
    prescriptionReminders: boolean;
  };
  reminderTiming: '24h' | '48h' | '72h' | '1week';
  language: string;
  paperlessStatements: boolean;
  shareDataWithCaregiver: boolean;
  caregiverEmail?: string;
}
