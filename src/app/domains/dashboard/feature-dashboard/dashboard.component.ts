import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

// Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';

// Shared Components
import { StatCardComponent } from '../../../shared/ui/stat-card/stat-card.component';
import { AvatarComponent } from '../../../shared/ui/avatar/avatar.component';
import { StatusBadgeComponent, getStatusVariant } from '../../../shared/ui/status-badge/status-badge.component';

// Services
import { AuthService } from '../../../core/auth/auth.service';
import { DashboardService, DashboardStats, TodayAppointment, Task, RecentActivity } from '../data-access/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatMenuModule,
    MatTooltipModule,
    MatRippleModule,
    StatCardComponent,
    AvatarComponent,
    StatusBadgeComponent,
  ],
  template: `
    <div class="dashboard-container">
      <!-- Welcome Section -->
      <section class="welcome-section">
        <div class="welcome-content">
          <h1 class="welcome-title">Good {{ getGreeting() }}, {{ userName() }}</h1>
          <p class="welcome-subtitle">Here's what's happening with your patients today</p>
        </div>
        <div class="welcome-actions">
          <button mat-flat-button color="primary" [matMenuTriggerFor]="quickMenu">
            <mat-icon>add</mat-icon>
            Quick Actions
          </button>
          <mat-menu #quickMenu="matMenu">
            <button mat-menu-item routerLink="/patients/new">
              <mat-icon>person_add</mat-icon>
              <span>New Patient</span>
            </button>
            <button mat-menu-item routerLink="/appointments/new">
              <mat-icon>event</mat-icon>
              <span>Schedule Appointment</span>
            </button>
            <button mat-menu-item routerLink="/encounters/new">
              <mat-icon>medical_services</mat-icon>
              <span>Start Encounter</span>
            </button>
            <button mat-menu-item routerLink="/prescriptions/new">
              <mat-icon>medication</mat-icon>
              <span>New Prescription</span>
            </button>
          </mat-menu>
        </div>
      </section>

      <!-- Stats Grid -->
      <section class="stats-section">
        @if (loadingStats()) {
          <div class="stats-loading">
            <mat-spinner diameter="32"></mat-spinner>
          </div>
        } @else if (stats()) {
          <div class="stats-grid">
            <app-stat-card
              label="Today's Patients"
              [value]="stats()!.todayPatients"
              icon="people"
              variant="primary"
              link="/appointments"
              [trendValue]="stats()!.patientsTrend"
              description="scheduled appointments">
            </app-stat-card>

            <app-stat-card
              label="Pending Tasks"
              [value]="stats()!.pendingTasks"
              icon="task_alt"
              variant="warning"
              link="/tasks"
              description="items requiring attention">
            </app-stat-card>

            <app-stat-card
              label="Unread Messages"
              [value]="stats()!.unreadMessages"
              icon="mail"
              variant="default"
              link="/messages"
              description="patient communications">
            </app-stat-card>

            <app-stat-card
              label="Lab Results"
              [value]="stats()!.pendingLabResults"
              icon="science"
              variant="success"
              link="/labs"
              description="awaiting review">
            </app-stat-card>
          </div>
        }
      </section>

      <!-- Main Content Grid -->
      <div class="main-grid">
        <!-- Today's Schedule -->
        <section class="schedule-section">
          <mat-card class="section-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>calendar_today</mat-icon>
              <mat-card-title>Today's Schedule</mat-card-title>
              <mat-card-subtitle>{{ todayDate | date:'EEEE, MMMM d' }}</mat-card-subtitle>
              <button mat-icon-button routerLink="/appointments" matTooltip="View Full Schedule">
                <mat-icon>open_in_new</mat-icon>
              </button>
            </mat-card-header>
            
            <mat-card-content>
              @if (loadingAppointments()) {
                <div class="loading-state">
                  <mat-spinner diameter="32"></mat-spinner>
                </div>
              } @else if (todayAppointments().length === 0) {
                <div class="empty-state">
                  <mat-icon>event_available</mat-icon>
                  <p>No appointments scheduled for today</p>
                  <button mat-stroked-button color="primary" routerLink="/appointments/new">
                    Schedule Appointment
                  </button>
                </div>
              } @else {
                <div class="appointments-list">
                  @for (apt of todayAppointments(); track apt.id) {
                    <div 
                      class="appointment-item" 
                      [class.current]="apt.isCurrent"
                      [class.past]="apt.isPast"
                      matRipple
                      [routerLink]="['/patients', apt.patientId]">
                      <div class="apt-time">
                        <span class="time">{{ apt.time }}</span>
                        <span class="duration">{{ apt.duration }} min</span>
                      </div>
                      <div class="apt-patient">
                        <app-avatar
                          [src]="apt.patientPhoto || ''"
                          [name]="apt.patientName"
                          size="sm">
                        </app-avatar>
                        <div class="patient-info">
                          <span class="name">{{ apt.patientName }}</span>
                          <span class="type">{{ apt.appointmentType }}</span>
                        </div>
                      </div>
                      <app-status-badge
                        [text]="apt.status"
                        [variant]="getStatusVariant(apt.status)">
                      </app-status-badge>
                    </div>
                  }
                </div>
              }
            </mat-card-content>
          </mat-card>
        </section>

        <!-- Tasks Section -->
        <section class="tasks-section">
          <mat-card class="section-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>checklist</mat-icon>
              <mat-card-title>Tasks & Reminders</mat-card-title>
              <mat-card-subtitle>{{ tasks().length }} pending</mat-card-subtitle>
              <button mat-icon-button [matMenuTriggerFor]="taskMenu" matTooltip="Options">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #taskMenu="matMenu">
                <button mat-menu-item>
                  <mat-icon>add</mat-icon>
                  <span>Add Task</span>
                </button>
                <button mat-menu-item routerLink="/tasks">
                  <mat-icon>list</mat-icon>
                  <span>View All Tasks</span>
                </button>
              </mat-menu>
            </mat-card-header>
            
            <mat-card-content>
              @if (loadingTasks()) {
                <div class="loading-state">
                  <mat-spinner diameter="32"></mat-spinner>
                </div>
              } @else if (tasks().length === 0) {
                <div class="empty-state">
                  <mat-icon>task_alt</mat-icon>
                  <p>All caught up! No pending tasks</p>
                </div>
              } @else {
                <mat-list class="tasks-list">
                  @for (task of tasks(); track task.id) {
                    <mat-list-item class="task-item" [class.high-priority]="task.priority === 'high'">
                      <mat-icon matListItemIcon [class]="'task-icon ' + task.type">
                        {{ getTaskIcon(task.type) }}
                      </mat-icon>
                      <div matListItemTitle>{{ task.title }}</div>
                      <div matListItemLine class="task-meta">
                        @if (task.patientName) {
                          <span class="patient">{{ task.patientName }}</span>
                        }
                        <span class="due">{{ task.dueDate | date:'shortDate' }}</span>
                      </div>
                      <button mat-icon-button matListItemMeta (click)="completeTask(task.id); $event.stopPropagation()">
                        <mat-icon>check_circle_outline</mat-icon>
                      </button>
                    </mat-list-item>
                  }
                </mat-list>
              }
            </mat-card-content>
          </mat-card>
        </section>

        <!-- Recent Activity -->
        <section class="activity-section">
          <mat-card class="section-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>history</mat-icon>
              <mat-card-title>Recent Activity</mat-card-title>
              <mat-card-subtitle>Last 24 hours</mat-card-subtitle>
            </mat-card-header>
            
            <mat-card-content>
              @if (loadingActivity()) {
                <div class="loading-state">
                  <mat-spinner diameter="32"></mat-spinner>
                </div>
              } @else if (recentActivity().length === 0) {
                <div class="empty-state">
                  <mat-icon>event_note</mat-icon>
                  <p>No recent activity</p>
                </div>
              } @else {
                <div class="activity-timeline">
                  @for (activity of recentActivity(); track activity.id) {
                    <div class="activity-item">
                      <div class="activity-marker" [class]="activity.type"></div>
                      <div class="activity-content">
                        <p class="activity-text">
                          <strong>{{ activity.action }}</strong>
                          @if (activity.patientName) {
                            for <a [routerLink]="['/patients', activity.patientId]">{{ activity.patientName }}</a>
                          }
                        </p>
                        <span class="activity-time">{{ activity.timestamp | date:'shortTime' }}</span>
                      </div>
                    </div>
                  }
                </div>
              }
            </mat-card-content>
          </mat-card>
        </section>

        <!-- Quick Links -->
        <section class="quick-links-section">
          <mat-card class="section-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>apps</mat-icon>
              <mat-card-title>Quick Access</mat-card-title>
            </mat-card-header>
            
            <mat-card-content>
              <div class="quick-links-grid">
                <a routerLink="/patients" class="quick-link" matRipple>
                  <div class="link-icon patients">
                    <mat-icon>people</mat-icon>
                  </div>
                  <span>Patients</span>
                </a>
                <a routerLink="/appointments" class="quick-link" matRipple>
                  <div class="link-icon appointments">
                    <mat-icon>event</mat-icon>
                  </div>
                  <span>Appointments</span>
                </a>
                <a routerLink="/encounters" class="quick-link" matRipple>
                  <div class="link-icon encounters">
                    <mat-icon>medical_services</mat-icon>
                  </div>
                  <span>Encounters</span>
                </a>
                <a routerLink="/prescriptions" class="quick-link" matRipple>
                  <div class="link-icon prescriptions">
                    <mat-icon>medication</mat-icon>
                  </div>
                  <span>Rx</span>
                </a>
                <a routerLink="/labs" class="quick-link" matRipple>
                  <div class="link-icon labs">
                    <mat-icon>science</mat-icon>
                  </div>
                  <span>Labs</span>
                </a>
                <a routerLink="/billing" class="quick-link" matRipple>
                  <div class="link-icon billing">
                    <mat-icon>receipt_long</mat-icon>
                  </div>
                  <span>Billing</span>
                </a>
                <a routerLink="/reports" class="quick-link" matRipple>
                  <div class="link-icon reports">
                    <mat-icon>analytics</mat-icon>
                  </div>
                  <span>Reports</span>
                </a>
                <a routerLink="/messages" class="quick-link" matRipple>
                  <div class="link-icon messages">
                    <mat-icon>forum</mat-icon>
                  </div>
                  <span>Messages</span>
                </a>
              </div>
            </mat-card-content>
          </mat-card>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 24px;
      max-width: 1600px;
      margin: 0 auto;
    }

    /* Welcome Section */
    .welcome-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .welcome-title {
      font-size: 1.75rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 4px 0;
    }

    .welcome-subtitle {
      font-size: 0.95rem;
      color: #64748b;
      margin: 0;
    }

    /* Stats Section */
    .stats-section {
      margin-bottom: 32px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
    }

    .stats-loading {
      display: flex;
      justify-content: center;
      padding: 40px;
    }

    /* Main Grid */
    .main-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
    }

    /* Section Cards */
    .section-card {
      border-radius: 16px;
      height: 100%;

      mat-card-header {
        padding: 16px 20px;
        border-bottom: 1px solid #f1f5f9;

        [mat-card-avatar] {
          background: linear-gradient(135deg, #0077b6 0%, #00a8e8 100%);
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        mat-card-title {
          font-size: 1rem;
          font-weight: 600;
        }

        mat-card-subtitle {
          font-size: 0.8rem;
        }

        button[mat-icon-button] {
          margin-left: auto;
          color: #94a3b8;
        }
      }

      mat-card-content {
        padding: 16px 20px;
      }
    }

    /* Loading & Empty States */
    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px;
      text-align: center;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #94a3b8;
        margin-bottom: 12px;
      }

      p {
        color: #64748b;
        margin: 0 0 16px 0;
      }
    }

    /* Appointments List */
    .appointments-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .appointment-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px;
      border-radius: 10px;
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background: #f8fafc;
      }

      &.current {
        background: #e0f7fa;
        border-left: 3px solid #0077b6;
      }

      &.past {
        opacity: 0.6;
      }

      .apt-time {
        display: flex;
        flex-direction: column;
        min-width: 70px;

        .time {
          font-weight: 600;
          color: #1e293b;
        }

        .duration {
          font-size: 0.75rem;
          color: #94a3b8;
        }
      }

      .apt-patient {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;

        .patient-info {
          display: flex;
          flex-direction: column;

          .name {
            font-weight: 500;
            color: #1e293b;
          }

          .type {
            font-size: 0.8rem;
            color: #64748b;
          }
        }
      }
    }

    /* Tasks List */
    .tasks-list {
      padding: 0;

      .task-item {
        border-bottom: 1px solid #f1f5f9;
        border-radius: 0;

        &:last-child {
          border-bottom: none;
        }

        &.high-priority {
          background: #fef2f2;

          .task-icon {
            color: #dc2626;
          }
        }

        .task-icon {
          &.lab { color: #8b5cf6; }
          &.rx { color: #10b981; }
          &.message { color: #3b82f6; }
          &.appointment { color: #f59e0b; }
        }

        .task-meta {
          display: flex;
          gap: 12px;
          font-size: 0.8rem;
          color: #64748b;

          .patient {
            color: #0077b6;
          }
        }
      }
    }

    /* Activity Timeline */
    .activity-timeline {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .activity-item {
      display: flex;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid #f1f5f9;

      &:last-child {
        border-bottom: none;
      }

      .activity-marker {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-top: 6px;
        flex-shrink: 0;

        &.encounter { background: #0077b6; }
        &.prescription { background: #10b981; }
        &.lab { background: #8b5cf6; }
        &.appointment { background: #f59e0b; }
        &.message { background: #3b82f6; }
      }

      .activity-content {
        flex: 1;

        .activity-text {
          margin: 0;
          font-size: 0.9rem;
          color: #1e293b;

          a {
            color: #0077b6;
            text-decoration: none;

            &:hover {
              text-decoration: underline;
            }
          }
        }

        .activity-time {
          font-size: 0.75rem;
          color: #94a3b8;
        }
      }
    }

    /* Quick Links */
    .quick-links-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }

    .quick-link {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 16px 8px;
      border-radius: 12px;
      text-decoration: none;
      transition: all 0.2s;

      &:hover {
        background: #f8fafc;
        transform: translateY(-2px);
      }

      .link-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;

        mat-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
          color: white;
        }

        &.patients { background: linear-gradient(135deg, #0077b6 0%, #00a8e8 100%); }
        &.appointments { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
        &.encounters { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
        &.prescriptions { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
        &.labs { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }
        &.billing { background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); }
        &.reports { background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); }
        &.messages { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); }
      }

      span {
        font-size: 0.8rem;
        font-weight: 500;
        color: #64748b;
      }
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .main-grid {
        grid-template-columns: 1fr;
      }

      .quick-links-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    @media (max-width: 768px) {
      .dashboard-container {
        padding: 16px;
      }

      .welcome-section {
        flex-direction: column;
        align-items: flex-start;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .quick-links-grid {
        grid-template-columns: repeat(4, 1fr);
      }

      .quick-link {
        padding: 12px 4px;

        .link-icon {
          width: 40px;
          height: 40px;

          mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
          }
        }

        span {
          font-size: 0.7rem;
        }
      }
    }

    @media (max-width: 480px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);

  // Data signals
  stats = signal<DashboardStats | null>(null);
  todayAppointments = signal<TodayAppointment[]>([]);
  tasks = signal<Task[]>([]);
  recentActivity = signal<RecentActivity[]>([]);

  // Loading signals
  loadingStats = signal(true);
  loadingAppointments = signal(true);
  loadingTasks = signal(true);
  loadingActivity = signal(true);

  // User info
  userName = signal('');
  todayDate = new Date();

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadDashboardData();
  }

  private loadUserInfo(): void {
    const user = this.authService.user();
    if (user) {
      this.userName.set(user.firstName || user.email);
    }
  }

  private loadDashboardData(): void {
    // Load stats
    this.dashboardService.getStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loadingStats.set(false);
      },
      error: () => this.loadingStats.set(false),
    });

    // Load today's appointments
    this.dashboardService.getTodayAppointments().subscribe({
      next: (data) => {
        this.todayAppointments.set(data);
        this.loadingAppointments.set(false);
      },
      error: () => this.loadingAppointments.set(false),
    });

    // Load tasks
    this.dashboardService.getTasks().subscribe({
      next: (data) => {
        this.tasks.set(data);
        this.loadingTasks.set(false);
      },
      error: () => this.loadingTasks.set(false),
    });

    // Load recent activity
    this.dashboardService.getRecentActivity().subscribe({
      next: (data) => {
        this.recentActivity.set(data);
        this.loadingActivity.set(false);
      },
      error: () => this.loadingActivity.set(false),
    });
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }

  getTaskIcon(type: string): string {
    const icons: Record<string, string> = {
      lab: 'science',
      rx: 'medication',
      message: 'mail',
      appointment: 'event',
      document: 'description',
      review: 'rate_review',
    };
    return icons[type] || 'task';
  }

  getStatusVariant(status: string) {
    return getStatusVariant(status);
  }

  completeTask(taskId: string): void {
    this.dashboardService.completeTask(taskId).subscribe(() => {
      this.tasks.update(tasks => tasks.filter(t => t.id !== taskId));
    });
  }
}
