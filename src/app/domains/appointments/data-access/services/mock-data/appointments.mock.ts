import { Appointment, AppointmentSlot } from '../../models/appointment.model';

const today = new Date();
today.setHours(0, 0, 0, 0);

function getDateWithTime(daysOffset: number, hours: number, minutes: number = 0): Date {
  const date = new Date(today);
  date.setDate(date.getDate() + daysOffset);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export const MOCK_APPOINTMENTS: Appointment[] = [
  // Today's appointments
  {
    id: 'apt-001',
    status: 'fulfilled',
    appointmentType: 'physical',
    start: getDateWithTime(0, 8, 0),
    end: getDateWithTime(0, 8, 45),
    duration: 45,
    patientId: 'pat-001',
    patientName: 'Sarah Johnson',
    patientPhone: '(555) 123-4567',
    patientEmail: 'sarah.johnson@email.com',
    patientPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
    providerId: 'prov-001',
    providerName: 'Dr. Emily Chen',
    facilityId: 'fac-001',
    facilityName: 'Main Street Clinic',
    roomId: 'room-101',
    roomName: 'Exam Room 1',
    reasonDescription: 'Annual physical examination',
    chiefComplaint: 'Routine checkup',
    insuranceVerified: true,
    copayAmount: 30,
    copayCollected: true,
    reminderSent: true,
    confirmationSent: true,
    confirmedAt: new Date(today.getTime() - 86400000),
    arrivedAt: getDateWithTime(0, 7, 55),
    checkedInAt: getDateWithTime(0, 7, 58),
    createdAt: new Date(today.getTime() - 604800000),
    updatedAt: new Date(),
    createdBy: 'user-001',
  },
  {
    id: 'apt-002',
    status: 'fulfilled',
    appointmentType: 'followup',
    start: getDateWithTime(0, 9, 0),
    end: getDateWithTime(0, 9, 20),
    duration: 20,
    patientId: 'pat-002',
    patientName: 'Michael Chen',
    patientPhone: '(555) 234-5678',
    patientPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=michael',
    providerId: 'prov-001',
    providerName: 'Dr. Emily Chen',
    facilityId: 'fac-001',
    facilityName: 'Main Street Clinic',
    roomId: 'room-102',
    roomName: 'Exam Room 2',
    reasonDescription: 'Diabetes follow-up',
    chiefComplaint: 'Blood sugar management',
    insuranceVerified: true,
    copayAmount: 25,
    copayCollected: true,
    reminderSent: true,
    confirmationSent: true,
    arrivedAt: getDateWithTime(0, 8, 50),
    checkedInAt: getDateWithTime(0, 8, 52),
    createdAt: new Date(today.getTime() - 172800000),
    updatedAt: new Date(),
    createdBy: 'user-001',
  },
  {
    id: 'apt-003',
    status: 'in-progress',
    appointmentType: 'new-patient',
    start: getDateWithTime(0, 10, 0),
    end: getDateWithTime(0, 10, 45),
    duration: 45,
    patientId: 'pat-003',
    patientName: 'Emily Rodriguez',
    patientPhone: '(555) 345-6789',
    patientEmail: 'emily.r@email.com',
    patientPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily',
    providerId: 'prov-001',
    providerName: 'Dr. Emily Chen',
    facilityId: 'fac-001',
    facilityName: 'Main Street Clinic',
    roomId: 'room-101',
    roomName: 'Exam Room 1',
    reasonDescription: 'New patient visit',
    chiefComplaint: 'Establish care, general health concerns',
    insuranceVerified: true,
    copayAmount: 40,
    copayCollected: true,
    reminderSent: true,
    confirmationSent: true,
    arrivedAt: getDateWithTime(0, 9, 45),
    checkedInAt: getDateWithTime(0, 9, 48),
    createdAt: new Date(today.getTime() - 259200000),
    updatedAt: new Date(),
    createdBy: 'user-002',
  },
  {
    id: 'apt-004',
    status: 'checked-in',
    appointmentType: 'urgent',
    start: getDateWithTime(0, 11, 0),
    end: getDateWithTime(0, 11, 30),
    duration: 30,
    patientId: 'pat-004',
    patientName: 'Robert Williams',
    patientPhone: '(555) 456-7890',
    patientPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=robert',
    providerId: 'prov-001',
    providerName: 'Dr. Emily Chen',
    facilityId: 'fac-001',
    facilityName: 'Main Street Clinic',
    roomId: 'room-103',
    roomName: 'Exam Room 3',
    reasonDescription: 'Acute illness',
    chiefComplaint: 'Fever and cough for 3 days',
    insuranceVerified: true,
    copayAmount: 35,
    copayCollected: false,
    reminderSent: true,
    confirmationSent: true,
    arrivedAt: getDateWithTime(0, 10, 50),
    checkedInAt: getDateWithTime(0, 10, 52),
    createdAt: new Date(today.getTime() - 86400000),
    updatedAt: new Date(),
    createdBy: 'user-001',
  },
  {
    id: 'apt-005',
    status: 'booked',
    appointmentType: 'lab-review',
    start: getDateWithTime(0, 13, 0),
    end: getDateWithTime(0, 13, 15),
    duration: 15,
    patientId: 'pat-005',
    patientName: 'Jennifer Davis',
    patientPhone: '(555) 567-8901',
    patientPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jennifer',
    providerId: 'prov-001',
    providerName: 'Dr. Emily Chen',
    facilityId: 'fac-001',
    facilityName: 'Main Street Clinic',
    reasonDescription: 'Lab results review',
    chiefComplaint: 'Review recent blood work',
    insuranceVerified: true,
    copayAmount: 20,
    reminderSent: true,
    confirmationSent: true,
    confirmedAt: new Date(today.getTime() - 43200000),
    createdAt: new Date(today.getTime() - 432000000),
    updatedAt: new Date(),
    createdBy: 'user-001',
  },
  {
    id: 'apt-006',
    status: 'booked',
    appointmentType: 'telehealth',
    start: getDateWithTime(0, 14, 0),
    end: getDateWithTime(0, 14, 20),
    duration: 20,
    patientId: 'pat-006',
    patientName: 'David Martinez',
    patientPhone: '(555) 678-9012',
    patientEmail: 'david.m@email.com',
    providerId: 'prov-001',
    providerName: 'Dr. Emily Chen',
    facilityId: 'fac-001',
    facilityName: 'Main Street Clinic',
    reasonDescription: 'Virtual follow-up',
    chiefComplaint: 'Medication refill consultation',
    isTelehealth: true,
    telehealthLink: 'https://telehealth.clinic.com/room/apt-006',
    insuranceVerified: true,
    reminderSent: true,
    confirmationSent: true,
    createdAt: new Date(today.getTime() - 345600000),
    updatedAt: new Date(),
    createdBy: 'user-002',
  },
  // Tomorrow's appointments
  {
    id: 'apt-007',
    status: 'booked',
    appointmentType: 'physical',
    start: getDateWithTime(1, 9, 0),
    end: getDateWithTime(1, 9, 45),
    duration: 45,
    patientId: 'pat-007',
    patientName: 'Lisa Thompson',
    patientPhone: '(555) 789-0123',
    patientPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisa',
    providerId: 'prov-001',
    providerName: 'Dr. Emily Chen',
    facilityId: 'fac-001',
    facilityName: 'Main Street Clinic',
    reasonDescription: 'Annual physical',
    insuranceVerified: true,
    copayAmount: 30,
    reminderSent: false,
    confirmationSent: true,
    confirmedAt: new Date(),
    createdAt: new Date(today.getTime() - 604800000),
    updatedAt: new Date(),
    createdBy: 'user-001',
  },
  {
    id: 'apt-008',
    status: 'booked',
    appointmentType: 'followup',
    start: getDateWithTime(1, 10, 30),
    end: getDateWithTime(1, 10, 50),
    duration: 20,
    patientId: 'pat-008',
    patientName: 'James Wilson',
    patientPhone: '(555) 890-1234',
    providerId: 'prov-001',
    providerName: 'Dr. Emily Chen',
    facilityId: 'fac-001',
    facilityName: 'Main Street Clinic',
    reasonDescription: 'Hypertension follow-up',
    insuranceVerified: true,
    copayAmount: 25,
    reminderSent: false,
    createdAt: new Date(today.getTime() - 518400000),
    updatedAt: new Date(),
    createdBy: 'user-001',
  },
  // This week appointments
  {
    id: 'apt-009',
    status: 'booked',
    appointmentType: 'procedure',
    start: getDateWithTime(2, 8, 0),
    end: getDateWithTime(2, 9, 0),
    duration: 60,
    patientId: 'pat-001',
    patientName: 'Sarah Johnson',
    patientPhone: '(555) 123-4567',
    patientPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
    providerId: 'prov-001',
    providerName: 'Dr. Emily Chen',
    facilityId: 'fac-001',
    facilityName: 'Main Street Clinic',
    roomId: 'room-procedure',
    roomName: 'Procedure Room',
    reasonDescription: 'Skin biopsy',
    notes: 'Pre-procedure instructions sent',
    insuranceVerified: true,
    copayAmount: 100,
    createdAt: new Date(today.getTime() - 691200000),
    updatedAt: new Date(),
    createdBy: 'user-001',
  },
  {
    id: 'apt-010',
    status: 'cancelled',
    appointmentType: 'routine',
    start: getDateWithTime(0, 15, 0),
    end: getDateWithTime(0, 15, 20),
    duration: 20,
    patientId: 'pat-009',
    patientName: 'Amanda Lee',
    patientPhone: '(555) 901-2345',
    providerId: 'prov-001',
    providerName: 'Dr. Emily Chen',
    facilityId: 'fac-001',
    facilityName: 'Main Street Clinic',
    reasonDescription: 'Routine checkup',
    insuranceVerified: true,
    cancelledAt: new Date(today.getTime() - 3600000),
    cancelledBy: 'patient',
    cancellationReason: 'Work conflict',
    createdAt: new Date(today.getTime() - 432000000),
    updatedAt: new Date(),
    createdBy: 'user-001',
  },
];

export function generateMockSlots(
  date: Date,
  providerId: string,
  duration: number
): AppointmentSlot[] {
  const slots: AppointmentSlot[] = [];
  const slotDate = new Date(date);
  slotDate.setHours(0, 0, 0, 0);

  // Business hours: 8 AM - 5 PM with lunch break 12-1
  const morningStart = 8;
  const morningEnd = 12;
  const afternoonStart = 13;
  const afternoonEnd = 17;

  // Get existing appointments for this date and provider
  const existingAppointments = MOCK_APPOINTMENTS.filter(apt => {
    const aptDate = new Date(apt.start);
    return (
      apt.providerId === providerId &&
      aptDate.getFullYear() === slotDate.getFullYear() &&
      aptDate.getMonth() === slotDate.getMonth() &&
      aptDate.getDate() === slotDate.getDate() &&
      apt.status !== 'cancelled'
    );
  });

  const generateSlotsForPeriod = (startHour: number, endHour: number) => {
    let currentTime = new Date(slotDate);
    currentTime.setHours(startHour, 0, 0, 0);

    const endTime = new Date(slotDate);
    endTime.setHours(endHour, 0, 0, 0);

    while (currentTime < endTime) {
      const slotEnd = new Date(currentTime.getTime() + duration * 60000);
      
      // Check if slot overlaps with any existing appointment
      const isAvailable = !existingAppointments.some(apt => {
        const aptStart = new Date(apt.start).getTime();
        const aptEnd = new Date(apt.end).getTime();
        const slotStart = currentTime.getTime();
        const slotEndTime = slotEnd.getTime();
        
        return slotStart < aptEnd && slotEndTime > aptStart;
      });

      slots.push({
        start: new Date(currentTime),
        end: slotEnd,
        duration,
        providerId,
        providerName: 'Dr. Emily Chen',
        facilityId: 'fac-001',
        isAvailable,
      });

      currentTime = new Date(currentTime.getTime() + duration * 60000);
    }
  };

  generateSlotsForPeriod(morningStart, morningEnd);
  generateSlotsForPeriod(afternoonStart, afternoonEnd);

  return slots;
}
