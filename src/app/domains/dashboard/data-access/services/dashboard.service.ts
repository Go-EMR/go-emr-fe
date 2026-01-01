import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

export interface DashboardStats {
  todayPatients: number;
  patientsTrend: number;
  pendingTasks: number;
  unreadMessages: number;
  pendingLabResults: number;
}

export interface TodayAppointment {
  id: string;
  time: string;
  duration: number;
  patientId: string;
  patientName: string;
  patientPhoto?: string;
  appointmentType: string;
  status: 'scheduled' | 'confirmed' | 'checked-in' | 'in-progress' | 'completed' | 'no-show' | 'cancelled';
  isCurrent?: boolean;
  isPast?: boolean;
}

export interface Task {
  id: string;
  title: string;
  type: 'lab' | 'rx' | 'message' | 'appointment' | 'document' | 'review';
  priority: 'low' | 'medium' | 'high';
  patientId?: string;
  patientName?: string;
  dueDate: Date;
}

export interface RecentActivity {
  id: string;
  type: 'encounter' | 'prescription' | 'lab' | 'appointment' | 'message';
  action: string;
  patientId?: string;
  patientName?: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly useMock = true;

  getStats(): Observable<DashboardStats> {
    if (this.useMock) {
      return of({
        todayPatients: 12,
        patientsTrend: 8.5,
        pendingTasks: 7,
        unreadMessages: 3,
        pendingLabResults: 5,
      }).pipe(delay(500));
    }
    // TODO: Implement actual API call
    return of({} as DashboardStats);
  }

  getTodayAppointments(): Observable<TodayAppointment[]> {
    if (this.useMock) {
      const now = new Date();
      const currentHour = now.getHours();
      
      return of([
        {
          id: 'apt-001',
          time: '8:00 AM',
          duration: 30,
          patientId: 'pat-001',
          patientName: 'Sarah Johnson',
          patientPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
          appointmentType: 'Annual Physical',
          status: 'completed' as const,
          isPast: true,
        },
        {
          id: 'apt-002',
          time: '8:30 AM',
          duration: 20,
          patientId: 'pat-002',
          patientName: 'Michael Chen',
          patientPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=michael',
          appointmentType: 'Follow-up',
          status: 'completed' as const,
          isPast: true,
        },
        {
          id: 'apt-003',
          time: '9:00 AM',
          duration: 45,
          patientId: 'pat-003',
          patientName: 'Emily Rodriguez',
          patientPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily',
          appointmentType: 'New Patient',
          status: 'completed' as const,
          isPast: true,
        },
        {
          id: 'apt-004',
          time: '10:00 AM',
          duration: 30,
          patientId: 'pat-004',
          patientName: 'Robert Williams',
          patientPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=robert',
          appointmentType: 'Sick Visit',
          status: 'in-progress' as const,
          isCurrent: true,
        },
        {
          id: 'apt-005',
          time: '10:30 AM',
          duration: 20,
          patientId: 'pat-005',
          patientName: 'Jennifer Davis',
          patientPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jennifer',
          appointmentType: 'Lab Review',
          status: 'checked-in' as const,
        },
        {
          id: 'apt-006',
          time: '11:00 AM',
          duration: 30,
          patientId: 'pat-006',
          patientName: 'David Martinez',
          appointmentType: 'Follow-up',
          status: 'confirmed' as const,
        },
        {
          id: 'apt-007',
          time: '1:00 PM',
          duration: 45,
          patientId: 'pat-007',
          patientName: 'Lisa Thompson',
          patientPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisa',
          appointmentType: 'Comprehensive Exam',
          status: 'scheduled' as const,
        },
        {
          id: 'apt-008',
          time: '2:00 PM',
          duration: 20,
          patientId: 'pat-008',
          patientName: 'James Wilson',
          appointmentType: 'Medication Review',
          status: 'scheduled' as const,
        },
      ]).pipe(delay(600));
    }
    return of([]);
  }

  getTasks(): Observable<Task[]> {
    if (this.useMock) {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      return of([
        {
          id: 'task-001',
          title: 'Review CBC results',
          type: 'lab' as const,
          priority: 'high' as const,
          patientId: 'pat-003',
          patientName: 'Emily Rodriguez',
          dueDate: today,
        },
        {
          id: 'task-002',
          title: 'Refill authorization - Lisinopril',
          type: 'rx' as const,
          priority: 'medium' as const,
          patientId: 'pat-001',
          patientName: 'Sarah Johnson',
          dueDate: today,
        },
        {
          id: 'task-003',
          title: 'Respond to patient message',
          type: 'message' as const,
          priority: 'medium' as const,
          patientId: 'pat-005',
          patientName: 'Jennifer Davis',
          dueDate: today,
        },
        {
          id: 'task-004',
          title: 'Sign encounter notes',
          type: 'document' as const,
          priority: 'high' as const,
          patientId: 'pat-002',
          patientName: 'Michael Chen',
          dueDate: today,
        },
        {
          id: 'task-005',
          title: 'Review A1C results',
          type: 'lab' as const,
          priority: 'medium' as const,
          patientId: 'pat-007',
          patientName: 'Lisa Thompson',
          dueDate: tomorrow,
        },
        {
          id: 'task-006',
          title: 'Prior authorization follow-up',
          type: 'rx' as const,
          priority: 'low' as const,
          patientId: 'pat-006',
          patientName: 'David Martinez',
          dueDate: tomorrow,
        },
        {
          id: 'task-007',
          title: 'Review referral request',
          type: 'review' as const,
          priority: 'medium' as const,
          patientId: 'pat-004',
          patientName: 'Robert Williams',
          dueDate: tomorrow,
        },
      ]).pipe(delay(400));
    }
    return of([]);
  }

  getRecentActivity(): Observable<RecentActivity[]> {
    if (this.useMock) {
      const now = new Date();
      
      return of([
        {
          id: 'act-001',
          type: 'encounter' as const,
          action: 'Completed encounter',
          patientId: 'pat-003',
          patientName: 'Emily Rodriguez',
          timestamp: new Date(now.getTime() - 30 * 60000),
        },
        {
          id: 'act-002',
          type: 'prescription' as const,
          action: 'Prescribed Metformin 500mg',
          patientId: 'pat-003',
          patientName: 'Emily Rodriguez',
          timestamp: new Date(now.getTime() - 35 * 60000),
        },
        {
          id: 'act-003',
          type: 'lab' as const,
          action: 'Ordered Comprehensive Metabolic Panel',
          patientId: 'pat-002',
          patientName: 'Michael Chen',
          timestamp: new Date(now.getTime() - 90 * 60000),
        },
        {
          id: 'act-004',
          type: 'encounter' as const,
          action: 'Completed encounter',
          patientId: 'pat-002',
          patientName: 'Michael Chen',
          timestamp: new Date(now.getTime() - 95 * 60000),
        },
        {
          id: 'act-005',
          type: 'message' as const,
          action: 'Sent portal message',
          patientId: 'pat-001',
          patientName: 'Sarah Johnson',
          timestamp: new Date(now.getTime() - 120 * 60000),
        },
        {
          id: 'act-006',
          type: 'prescription' as const,
          action: 'Renewed Atorvastatin 20mg',
          patientId: 'pat-001',
          patientName: 'Sarah Johnson',
          timestamp: new Date(now.getTime() - 150 * 60000),
        },
        {
          id: 'act-007',
          type: 'appointment' as const,
          action: 'Scheduled follow-up appointment',
          patientId: 'pat-001',
          patientName: 'Sarah Johnson',
          timestamp: new Date(now.getTime() - 155 * 60000),
        },
      ]).pipe(delay(700));
    }
    return of([]);
  }

  completeTask(taskId: string): Observable<void> {
    // TODO: Implement actual API call
    return of(void 0).pipe(delay(300));
  }
}
