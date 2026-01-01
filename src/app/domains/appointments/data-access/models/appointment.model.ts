/**
 * Appointment Models
 * FHIR R4-inspired appointment data structures
 */

export type AppointmentStatus = 
  | 'proposed' 
  | 'pending' 
  | 'booked' 
  | 'arrived' 
  | 'fulfilled' 
  | 'cancelled' 
  | 'noshow'
  | 'checked-in'
  | 'in-progress';

export type AppointmentType = 
  | 'routine'
  | 'followup'
  | 'new-patient'
  | 'urgent'
  | 'physical'
  | 'wellness'
  | 'procedure'
  | 'telehealth'
  | 'lab-review'
  | 'consultation';

export type RecurrencePattern = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface Appointment {
  id: string;
  status: AppointmentStatus;
  appointmentType: AppointmentType;
  type?: AppointmentType; // alias for appointmentType
  
  // Scheduling
  start: Date;
  end: Date;
  duration: number; // in minutes
  
  // Patient - flat fields
  patientId: string;
  patientName: string;
  patientPhone?: string;
  patientEmail?: string;
  patientPhoto?: string;
  // Patient - object form (for components expecting object)
  patient?: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    photo?: string;
  };
  
  // Provider - flat fields
  providerId: string;
  providerName: string;
  // Provider - object form
  provider?: {
    id: string;
    name: string;
  };
  
  // Location
  facilityId: string;
  facilityName: string;
  roomId?: string;
  roomName?: string;
  
  // Details
  reasonCode?: string;
  reasonDescription: string;
  notes?: string;
  chiefComplaint?: string;
  
  // Recurrence
  isRecurring?: boolean;
  recurrencePattern?: RecurrencePattern;
  recurrenceEndDate?: Date;
  parentAppointmentId?: string;
  
  // Billing
  serviceType?: string;
  insuranceVerified?: boolean;
  copayAmount?: number;
  copayCollected?: boolean;
  
  // Reminders
  reminderSent?: boolean;
  reminderSentAt?: Date;
  confirmationSent?: boolean;
  confirmedAt?: Date;
  confirmedBy?: string;
  
  // Check-in
  arrivedAt?: Date;
  checkedInAt?: Date;
  checkedInBy?: string;
  
  // Telehealth
  isTelehealth?: boolean;
  telehealthLink?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  cancelledAt?: Date;
  cancelledBy?: string;
  cancellationReason?: string;
}

export interface AppointmentSlot {
  start: Date;
  end: Date;
  duration: number;
  providerId: string;
  providerName: string;
  facilityId: string;
  roomId?: string;
  isAvailable: boolean;
  available?: boolean; // alias for isAvailable
  appointmentType?: AppointmentType;
}

export interface AppointmentSearchParams {
  startDate?: Date;
  endDate?: Date;
  providerId?: string;
  patientId?: string;
  status?: AppointmentStatus | AppointmentStatus[];
  appointmentType?: AppointmentType;
  facilityId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AppointmentSearchResult {
  appointments: Appointment[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateAppointmentDto {
  patientId: string;
  providerId: string;
  facilityId: string;
  appointmentType: AppointmentType;
  type?: AppointmentType; // alias for appointmentType
  start: Date;
  duration: number;
  reasonDescription: string;
  chiefComplaint?: string;
  notes?: string;
  roomId?: string;
  isTelehealth?: boolean;
  isRecurring?: boolean;
  recurrencePattern?: RecurrencePattern;
  recurrenceEndDate?: Date;
}

export interface UpdateAppointmentDto {
  start?: Date;
  duration?: number;
  providerId?: string;
  facilityId?: string;
  roomId?: string;
  appointmentType?: AppointmentType;
  reasonDescription?: string;
  chiefComplaint?: string;
  notes?: string;
  isTelehealth?: boolean;
}

export interface AppointmentTypeConfig {
  type: AppointmentType;
  label: string;
  duration: number;
  defaultDuration?: number; // alias for duration
  color: string;
  icon: string;
}

export const APPOINTMENT_TYPE_CONFIG: AppointmentTypeConfig[] = [
  { type: 'new-patient', label: 'New Patient', duration: 45, color: '#10b981', icon: 'person_add' },
  { type: 'routine', label: 'Routine Visit', duration: 20, color: '#3b82f6', icon: 'event' },
  { type: 'followup', label: 'Follow-up', duration: 15, color: '#0077b6', icon: 'replay' },
  { type: 'physical', label: 'Annual Physical', duration: 45, color: '#8b5cf6', icon: 'monitor_heart' },
  { type: 'wellness', label: 'Wellness Visit', duration: 30, color: '#14b8a6', icon: 'spa' },
  { type: 'urgent', label: 'Urgent Care', duration: 20, color: '#ef4444', icon: 'emergency' },
  { type: 'procedure', label: 'Procedure', duration: 60, color: '#f59e0b', icon: 'healing' },
  { type: 'telehealth', label: 'Telehealth', duration: 20, color: '#6366f1', icon: 'video_call' },
  { type: 'lab-review', label: 'Lab Review', duration: 15, color: '#ec4899', icon: 'science' },
  { type: 'consultation', label: 'Consultation', duration: 30, color: '#64748b', icon: 'forum' },
];

export function getAppointmentTypeConfig(type: AppointmentType): AppointmentTypeConfig | undefined {
  return APPOINTMENT_TYPE_CONFIG.find(c => c.type === type);
}
