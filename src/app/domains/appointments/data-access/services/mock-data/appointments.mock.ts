import { Appointment, AppointmentSlot } from '../../models/appointment.model';

const today = new Date();
today.setHours(0, 0, 0, 0);

function getDateWithTime(daysOffset: number, hours: number, minutes: number = 0): Date {
  const date = new Date(today);
  date.setDate(date.getDate() + daysOffset);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export const MOCK_APPOINTMENTS: Appointment[] = [];

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
