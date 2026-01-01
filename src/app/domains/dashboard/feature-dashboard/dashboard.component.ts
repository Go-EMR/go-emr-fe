import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { BadgeModule } from 'primeng/badge';
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';
import { DividerModule } from 'primeng/divider';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { SkeletonModule } from 'primeng/skeleton';
import { ProgressBarModule } from 'primeng/progressbar';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TimelineModule } from 'primeng/timeline';
import { MenuItem } from 'primeng/api';

// Services
import { AuthService } from '../../../core/auth/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { DashboardService, DashboardStats, TodayAppointment, Task, RecentActivity } from '../data-access/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    // PrimeNG
    CardModule,
    ButtonModule,
    AvatarModule,
    AvatarGroupModule,
    BadgeModule,
    TagModule,
    ChipModule,
    DividerModule,
    MenuModule,
    TooltipModule,
    RippleModule,
    SkeletonModule,
    ProgressBarModule,
    ChartModule,
    TableModule,
    TimelineModule,
  ],
  template: `
    <div class="dashboard" [class.dark]="themeService.isDarkMode()">
      <!-- Welcome Header -->
      <header class="dashboard-header">
        <div class="header-content">
          <div class="greeting">
            <h1>Good {{ getGreeting() }}, {{ userName() }}! 👋</h1>
            <p>Here's what's happening with your patients today</p>
          </div>
          <div class="header-actions">
            <p-button 
              icon="pi pi-plus" 
              label="Quick Actions" 
              (onClick)="quickActionsMenu.toggle($event)"
              [outlined]="true"
            />
            <p-menu #quickActionsMenu [model]="quickActions" [popup]="true" />
          </div>
        </div>
        
        <!-- Date Display -->
        <div class="date-display">
          <i class="pi pi-calendar"></i>
          <span>{{ todayDate | date:'EEEE, MMMM d, yyyy' }}</span>
        </div>
      </header>

      <!-- Stats Cards -->
      <section class="stats-section">
        @if (loadingStats()) {
          <div class="stats-grid">
            @for (i of [1,2,3,4]; track i) {
              <div class="stat-card skeleton">
                <p-skeleton width="60px" height="60px" borderRadius="12px" />
                <div class="stat-content">
                  <p-skeleton width="80px" height="14px" />
                  <p-skeleton width="50px" height="32px" />
                  <p-skeleton width="100px" height="12px" />
                </div>
              </div>
            }
          </div>
        } @else if (stats()) {
          <div class="stats-grid">
            <!-- Today's Patients -->
            <div class="stat-card primary" [routerLink]="['/appointments']" pRipple>
              <div class="stat-icon">
                <i class="pi pi-users"></i>
              </div>
              <div class="stat-content">
                <span class="stat-label">Today's Patients</span>
                <span class="stat-value">{{ stats()!.todayPatients }}</span>
                <div class="stat-trend" [class.positive]="stats()!.patientsTrend > 0" [class.negative]="stats()!.patientsTrend < 0">
                  <i [class]="stats()!.patientsTrend >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'"></i>
                  <span>{{ stats()!.patientsTrend }}% from yesterday</span>
                </div>
              </div>
            </div>

            <!-- Pending Tasks -->
            <div class="stat-card warning" [routerLink]="['/tasks']" pRipple>
              <div class="stat-icon">
                <i class="pi pi-check-square"></i>
              </div>
              <div class="stat-content">
                <span class="stat-label">Pending Tasks</span>
                <span class="stat-value">{{ stats()!.pendingTasks }}</span>
                <span class="stat-description">Items requiring attention</span>
              </div>
            </div>

            <!-- Unread Messages -->
            <div class="stat-card info" [routerLink]="['/messages']" pRipple>
              <div class="stat-icon">
                <i class="pi pi-envelope"></i>
              </div>
              <div class="stat-content">
                <span class="stat-label">Unread Messages</span>
                <span class="stat-value">{{ stats()!.unreadMessages }}</span>
                <span class="stat-description">Patient communications</span>
              </div>
            </div>

            <!-- Lab Results -->
            <div class="stat-card success" [routerLink]="['/labs']" pRipple>
              <div class="stat-icon">
                <i class="pi pi-chart-bar"></i>
              </div>
              <div class="stat-content">
                <span class="stat-label">Lab Results</span>
                <span class="stat-value">{{ stats()!.pendingLabResults }}</span>
                <span class="stat-description">Awaiting review</span>
              </div>
            </div>
          </div>
        }
      </section>

      <!-- Main Content Grid -->
      <div class="main-grid">
        <!-- Today's Schedule -->
        <section class="schedule-section">
          <p-card styleClass="dashboard-card">
            <ng-template pTemplate="header">
              <div class="card-header">
                <div class="header-left">
                  <div class="header-icon schedule">
                    <i class="pi pi-calendar"></i>
                  </div>
                  <div>
                    <h3>Today's Schedule</h3>
                    <span class="subtitle">{{ todayAppointments().length }} appointments</span>
                  </div>
                </div>
                <p-button 
                  icon="pi pi-external-link" 
                  [rounded]="true" 
                  [text]="true"
                  pTooltip="View Full Schedule"
                  [routerLink]="['/appointments']"
                />
              </div>
            </ng-template>
            
            <div class="card-body">
              @if (loadingAppointments()) {
                <div class="loading-list">
                  @for (i of [1,2,3]; track i) {
                    <div class="skeleton-item">
                      <p-skeleton width="50px" height="40px" />
                      <p-skeleton shape="circle" size="40px" />
                      <div class="skeleton-text">
                        <p-skeleton width="120px" height="16px" />
                        <p-skeleton width="80px" height="12px" />
                      </div>
                      <p-skeleton width="70px" height="24px" borderRadius="12px" />
                    </div>
                  }
                </div>
              } @else if (todayAppointments().length === 0) {
                <div class="empty-state">
                  <i class="pi pi-calendar-plus"></i>
                  <h4>No appointments today</h4>
                  <p>Your schedule is clear. Time to relax or add new appointments.</p>
                  <p-button 
                    label="Schedule Appointment" 
                    icon="pi pi-plus" 
                    [outlined]="true"
                    [routerLink]="['/appointments/new']"
                  />
                </div>
              } @else {
                <div class="appointments-list">
                  @for (apt of todayAppointments(); track apt.id; let i = $index) {
                    <div 
                      class="appointment-item" 
                      [class.current]="apt.isCurrent"
                      [class.past]="apt.isPast"
                      [routerLink]="['/patients', apt.patientId]"
                      pRipple>
                      <div class="apt-time">
                        <span class="time">{{ apt.time }}</span>
                        <span class="duration">{{ apt.duration }}m</span>
                      </div>
                      
                      <div class="apt-divider">
                        <div class="timeline-dot" [class.active]="apt.isCurrent"></div>
                        @if (i < todayAppointments().length - 1) {
                          <div class="timeline-line"></div>
                        }
                      </div>
                      
                      <div class="apt-details">
                        <div class="patient-row">
                          <p-avatar 
                            [label]="getInitials(apt.patientName)"
                            [style]="{ 'background-color': getAvatarColor(i), 'color': 'white' }"
                            shape="circle"
                          />
                          <div class="patient-info">
                            <span class="name">{{ apt.patientName }}</span>
                            <span class="type">{{ apt.appointmentType }}</span>
                          </div>
                        </div>
                        <p-tag 
                          [value]="apt.status" 
                          [severity]="getStatusSeverity(apt.status)"
                          [rounded]="true"
                        />
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </p-card>
        </section>

        <!-- Tasks & Reminders -->
        <section class="tasks-section">
          <p-card styleClass="dashboard-card">
            <ng-template pTemplate="header">
              <div class="card-header">
                <div class="header-left">
                  <div class="header-icon tasks">
                    <i class="pi pi-check-square"></i>
                  </div>
                  <div>
                    <h3>Tasks & Reminders</h3>
                    <span class="subtitle">{{ tasks().length }} pending</span>
                  </div>
                </div>
                <p-button 
                  icon="pi pi-plus" 
                  [rounded]="true" 
                  [text]="true"
                  pTooltip="Add Task"
                />
              </div>
            </ng-template>
            
            <div class="card-body">
              @if (loadingTasks()) {
                <div class="loading-list">
                  @for (i of [1,2,3,4]; track i) {
                    <div class="skeleton-item">
                      <p-skeleton shape="circle" size="32px" />
                      <div class="skeleton-text flex-1">
                        <p-skeleton width="80%" height="16px" />
                        <p-skeleton width="50%" height="12px" />
                      </div>
                      <p-skeleton shape="circle" size="24px" />
                    </div>
                  }
                </div>
              } @else if (tasks().length === 0) {
                <div class="empty-state">
                  <i class="pi pi-check-circle"></i>
                  <h4>All caught up!</h4>
                  <p>You've completed all your tasks. Great work!</p>
                </div>
              } @else {
                <div class="tasks-list">
                  @for (task of tasks(); track task.id) {
                    <div class="task-item" [class.high-priority]="task.priority === 'high'" pRipple>
                      <div class="task-icon" [class]="task.type">
                        <i [class]="'pi ' + getTaskIcon(task.type)"></i>
                      </div>
                      <div class="task-content">
                        <span class="task-title">{{ task.title }}</span>
                        <div class="task-meta">
                          @if (task.patientName) {
                            <span class="patient">
                              <i class="pi pi-user"></i>
                              {{ task.patientName }}
                            </span>
                          }
                          <span class="due">
                            <i class="pi pi-clock"></i>
                            {{ task.dueDate | date:'shortDate' }}
                          </span>
                        </div>
                      </div>
                      <p-button 
                        icon="pi pi-check" 
                        [rounded]="true" 
                        [text]="true"
                        severity="success"
                        pTooltip="Complete"
                        (onClick)="completeTask(task.id); $event.stopPropagation()"
                      />
                    </div>
                  }
                </div>
              }
            </div>
            
            <ng-template pTemplate="footer">
              <p-button 
                label="View All Tasks" 
                [text]="true" 
                icon="pi pi-arrow-right" 
                iconPos="right"
                [routerLink]="['/tasks']"
              />
            </ng-template>
          </p-card>
        </section>

        <!-- Recent Activity -->
        <section class="activity-section">
          <p-card styleClass="dashboard-card">
            <ng-template pTemplate="header">
              <div class="card-header">
                <div class="header-left">
                  <div class="header-icon activity">
                    <i class="pi pi-history"></i>
                  </div>
                  <div>
                    <h3>Recent Activity</h3>
                    <span class="subtitle">Last 24 hours</span>
                  </div>
                </div>
              </div>
            </ng-template>
            
            <div class="card-body">
              @if (loadingActivity()) {
                <div class="loading-list">
                  @for (i of [1,2,3,4]; track i) {
                    <div class="skeleton-item">
                      <p-skeleton width="8px" height="8px" borderRadius="50%" />
                      <div class="skeleton-text flex-1">
                        <p-skeleton width="90%" height="14px" />
                        <p-skeleton width="60px" height="12px" />
                      </div>
                    </div>
                  }
                </div>
              } @else if (recentActivity().length === 0) {
                <div class="empty-state">
                  <i class="pi pi-inbox"></i>
                  <h4>No recent activity</h4>
                  <p>Activity will appear here as you work</p>
                </div>
              } @else {
                <div class="activity-list">
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
            </div>
          </p-card>
        </section>

        <!-- Quick Access -->
        <section class="quick-access-section">
          <p-card styleClass="dashboard-card">
            <ng-template pTemplate="header">
              <div class="card-header">
                <div class="header-left">
                  <div class="header-icon quick">
                    <i class="pi pi-th-large"></i>
                  </div>
                  <div>
                    <h3>Quick Access</h3>
                    <span class="subtitle">Navigate to modules</span>
                  </div>
                </div>
              </div>
            </ng-template>
            
            <div class="card-body">
              <div class="quick-links-grid">
                @for (link of quickLinks; track link.route) {
                  <a [routerLink]="link.route" class="quick-link" pRipple>
                    <div class="link-icon" [class]="link.class">
                      <i [class]="'pi ' + link.icon"></i>
                    </div>
                    <span>{{ link.label }}</span>
                  </a>
                }
              </div>
            </div>
          </p-card>
        </section>

        <!-- Weekly Overview Chart -->
        <section class="chart-section">
          <p-card styleClass="dashboard-card">
            <ng-template pTemplate="header">
              <div class="card-header">
                <div class="header-left">
                  <div class="header-icon chart">
                    <i class="pi pi-chart-line"></i>
                  </div>
                  <div>
                    <h3>Weekly Overview</h3>
                    <span class="subtitle">Patient visits this week</span>
                  </div>
                </div>
              </div>
            </ng-template>
            
            <div class="card-body chart-container">
              <p-chart type="bar" [data]="chartData()" [options]="chartOptions()" />
            </div>
          </p-card>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      padding: 1.5rem;
      max-width: 1600px;
      margin: 0 auto;
      transition: all 0.3s ease;
    }

    /* Header */
    .dashboard-header {
      margin-bottom: 2rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 0.75rem;
    }

    .greeting h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 0.25rem;
    }

    .dark .greeting h1 {
      color: #f1f5f9;
    }

    .greeting p {
      color: #64748b;
      margin: 0;
      font-size: 0.95rem;
    }

    .dark .greeting p {
      color: #94a3b8;
    }

    .date-display {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #64748b;
      font-size: 0.875rem;
    }

    .dark .date-display {
      color: #94a3b8;
    }

    /* Stats Section */
    .stats-section {
      margin-bottom: 2rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1.25rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      background: white;
      border-radius: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 1px solid #e2e8f0;
    }

    .dark .stat-card {
      background: #1e293b;
      border-color: #334155;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.15);
    }

    .stat-card.skeleton {
      cursor: default;
    }

    .stat-card.skeleton:hover {
      transform: none;
      box-shadow: none;
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-icon i {
      font-size: 1.5rem;
      color: white;
    }

    .stat-card.primary .stat-icon { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
    .stat-card.warning .stat-icon { background: linear-gradient(135deg, #f59e0b, #d97706); }
    .stat-card.info .stat-icon { background: linear-gradient(135deg, #06b6d4, #0891b2); }
    .stat-card.success .stat-icon { background: linear-gradient(135deg, #10b981, #059669); }

    .stat-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .stat-label {
      font-size: 0.8125rem;
      color: #64748b;
      font-weight: 500;
    }

    .dark .stat-label {
      color: #94a3b8;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: #1e293b;
      line-height: 1;
    }

    .dark .stat-value {
      color: #f1f5f9;
    }

    .stat-description {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .stat-trend {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      color: #64748b;
    }

    .stat-trend.positive { color: #10b981; }
    .stat-trend.negative { color: #ef4444; }

    /* Main Grid */
    .main-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    /* Card Styles */
    :host ::ng-deep .dashboard-card {
      height: 100%;
      border-radius: 1rem !important;
      overflow: hidden;
    }

    :host ::ng-deep .dashboard-card .p-card-header {
      padding: 1.25rem 1.5rem 0;
    }

    :host ::ng-deep .dashboard-card .p-card-body {
      padding: 0 1.5rem 1.5rem;
    }

    :host ::ng-deep .dashboard-card .p-card-footer {
      padding: 0.75rem 1.5rem;
      border-top: 1px solid #e2e8f0;
    }

    .dark :host ::ng-deep .dashboard-card {
      background: #1e293b;
      border-color: #334155;
    }

    .dark :host ::ng-deep .dashboard-card .p-card-footer {
      border-top-color: #334155;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 1rem;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .header-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header-icon i {
      font-size: 1.125rem;
      color: white;
    }

    .header-icon.schedule { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
    .header-icon.tasks { background: linear-gradient(135deg, #f59e0b, #d97706); }
    .header-icon.activity { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
    .header-icon.quick { background: linear-gradient(135deg, #10b981, #059669); }
    .header-icon.chart { background: linear-gradient(135deg, #ec4899, #db2777); }

    .card-header h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
    }

    .dark .card-header h3 {
      color: #f1f5f9;
    }

    .card-header .subtitle {
      font-size: 0.8125rem;
      color: #64748b;
    }

    .dark .card-header .subtitle {
      color: #94a3b8;
    }

    .card-body {
      padding-top: 0.5rem;
    }

    /* Loading & Empty States */
    .loading-list, .skeleton-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 0;
    }

    .skeleton-text {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      text-align: center;
    }

    .empty-state i {
      font-size: 3rem;
      color: #cbd5e1;
      margin-bottom: 1rem;
    }

    .dark .empty-state i {
      color: #475569;
    }

    .empty-state h4 {
      margin: 0 0 0.5rem;
      color: #64748b;
      font-weight: 600;
    }

    .dark .empty-state h4 {
      color: #94a3b8;
    }

    .empty-state p {
      margin: 0 0 1rem;
      color: #94a3b8;
      font-size: 0.875rem;
    }

    /* Appointments List */
    .appointments-list {
      display: flex;
      flex-direction: column;
    }

    .appointment-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 0.75rem;
      border-radius: 0.75rem;
      cursor: pointer;
      transition: background 0.2s;
    }

    .appointment-item:hover {
      background: #f8fafc;
    }

    .dark .appointment-item:hover {
      background: #334155;
    }

    .appointment-item.current {
      background: #eff6ff;
    }

    .dark .appointment-item.current {
      background: #1e3a8a;
    }

    .appointment-item.past {
      opacity: 0.6;
    }

    .apt-time {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      min-width: 50px;
    }

    .apt-time .time {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.875rem;
    }

    .dark .apt-time .time {
      color: #f1f5f9;
    }

    .apt-time .duration {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .apt-divider {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-top: 4px;
    }

    .timeline-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #cbd5e1;
      flex-shrink: 0;
    }

    .timeline-dot.active {
      background: #3b82f6;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
    }

    .timeline-line {
      width: 2px;
      flex: 1;
      min-height: 30px;
      background: #e2e8f0;
      margin-top: 4px;
    }

    .dark .timeline-line {
      background: #334155;
    }

    .apt-details {
      flex: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .patient-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .patient-info {
      display: flex;
      flex-direction: column;
    }

    .patient-info .name {
      font-weight: 500;
      color: #1e293b;
      font-size: 0.9375rem;
    }

    .dark .patient-info .name {
      color: #f1f5f9;
    }

    .patient-info .type {
      font-size: 0.8125rem;
      color: #64748b;
    }

    .dark .patient-info .type {
      color: #94a3b8;
    }

    /* Tasks List */
    .tasks-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .task-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      border-radius: 0.75rem;
      transition: background 0.2s;
    }

    .task-item:hover {
      background: #f8fafc;
    }

    .dark .task-item:hover {
      background: #334155;
    }

    .task-item.high-priority {
      border-left: 3px solid #ef4444;
    }

    .task-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .task-icon i {
      font-size: 0.875rem;
      color: white;
    }

    .task-icon.lab { background: #8b5cf6; }
    .task-icon.rx { background: #10b981; }
    .task-icon.message { background: #3b82f6; }
    .task-icon.appointment { background: #f59e0b; }
    .task-icon.document { background: #64748b; }
    .task-icon.review { background: #ec4899; }

    .task-content {
      flex: 1;
      min-width: 0;
    }

    .task-title {
      display: block;
      font-weight: 500;
      color: #1e293b;
      margin-bottom: 0.25rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .dark .task-title {
      color: #f1f5f9;
    }

    .task-meta {
      display: flex;
      gap: 1rem;
      font-size: 0.75rem;
      color: #64748b;
    }

    .dark .task-meta {
      color: #94a3b8;
    }

    .task-meta span {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    /* Activity List */
    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .activity-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.5rem 0;
    }

    .activity-marker {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-top: 6px;
      flex-shrink: 0;
    }

    .activity-marker.encounter { background: #3b82f6; }
    .activity-marker.prescription { background: #10b981; }
    .activity-marker.lab { background: #8b5cf6; }
    .activity-marker.appointment { background: #f59e0b; }
    .activity-marker.message { background: #06b6d4; }

    .activity-content {
      flex: 1;
    }

    .activity-text {
      margin: 0 0 0.25rem;
      font-size: 0.875rem;
      color: #374151;
    }

    .dark .activity-text {
      color: #e2e8f0;
    }

    .activity-text a {
      color: #3b82f6;
      text-decoration: none;
    }

    .activity-text a:hover {
      text-decoration: underline;
    }

    .activity-time {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    /* Quick Links */
    .quick-links-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;
    }

    .quick-link {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem 0.5rem;
      border-radius: 0.75rem;
      text-decoration: none;
      transition: all 0.2s;
    }

    .quick-link:hover {
      background: #f8fafc;
      transform: translateY(-2px);
    }

    .dark .quick-link:hover {
      background: #334155;
    }

    .link-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .link-icon i {
      font-size: 1.25rem;
      color: white;
    }

    .link-icon.patients { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
    .link-icon.appointments { background: linear-gradient(135deg, #f59e0b, #d97706); }
    .link-icon.encounters { background: linear-gradient(135deg, #10b981, #059669); }
    .link-icon.prescriptions { background: linear-gradient(135deg, #06b6d4, #0891b2); }
    .link-icon.labs { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
    .link-icon.billing { background: linear-gradient(135deg, #ec4899, #db2777); }
    .link-icon.reports { background: linear-gradient(135deg, #14b8a6, #0d9488); }
    .link-icon.messages { background: linear-gradient(135deg, #6366f1, #4f46e5); }

    .quick-link span {
      font-size: 0.8125rem;
      font-weight: 500;
      color: #64748b;
    }

    .dark .quick-link span {
      color: #94a3b8;
    }

    /* Chart */
    .chart-container {
      height: 250px;
    }

    /* Chart section spans full width */
    .chart-section {
      grid-column: 1 / -1;
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .main-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .dashboard {
        padding: 1rem;
      }

      .header-content {
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
        padding: 0.75rem 0.25rem;
      }

      .link-icon {
        width: 36px;
        height: 36px;
      }

      .link-icon i {
        font-size: 1rem;
      }

      .quick-link span {
        font-size: 0.7rem;
      }
    }

    @media (max-width: 480px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }

      .apt-details {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);
  readonly themeService = inject(ThemeService);

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

  // Quick Actions Menu
  quickActions: MenuItem[] = [
    { label: 'New Patient', icon: 'pi pi-user-plus', routerLink: ['/patients/new'] },
    { label: 'Schedule Appointment', icon: 'pi pi-calendar-plus', routerLink: ['/appointments/new'] },
    { label: 'Start Encounter', icon: 'pi pi-file-edit', routerLink: ['/encounters/new'] },
    { label: 'New Prescription', icon: 'pi pi-box', routerLink: ['/prescriptions/new'] },
    { separator: true },
    { label: 'Send Message', icon: 'pi pi-envelope', routerLink: ['/messages/new'] },
  ];

  // Quick Links
  quickLinks = [
    { label: 'Patients', icon: 'pi-users', route: '/patients', class: 'patients' },
    { label: 'Appointments', icon: 'pi-calendar', route: '/appointments', class: 'appointments' },
    { label: 'Encounters', icon: 'pi-file-edit', route: '/encounters', class: 'encounters' },
    { label: 'Rx', icon: 'pi-box', route: '/prescriptions', class: 'prescriptions' },
    { label: 'Labs', icon: 'pi-chart-bar', route: '/labs', class: 'labs' },
    { label: 'Billing', icon: 'pi-credit-card', route: '/billing', class: 'billing' },
    { label: 'Reports', icon: 'pi-chart-line', route: '/reports', class: 'reports' },
    { label: 'Messages', icon: 'pi-envelope', route: '/messages', class: 'messages' },
  ];

  // Chart data
  chartData = computed(() => {
    const isDark = this.themeService.isDarkMode();
    return {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: 'Patients',
          data: [12, 19, 15, 22, 18, 8, 5],
          backgroundColor: isDark ? 'rgba(59, 130, 246, 0.8)' : 'rgba(59, 130, 246, 0.8)',
          borderColor: '#3b82f6',
          borderWidth: 0,
          borderRadius: 6,
        },
        {
          label: 'Appointments',
          data: [15, 22, 18, 25, 20, 10, 7],
          backgroundColor: isDark ? 'rgba(16, 185, 129, 0.8)' : 'rgba(16, 185, 129, 0.8)',
          borderColor: '#10b981',
          borderWidth: 0,
          borderRadius: 6,
        }
      ]
    };
  });

  chartOptions = computed(() => {
    const isDark = this.themeService.isDarkMode();
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    
    return {
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            color: textColor,
            usePointStyle: true,
            padding: 20,
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: textColor }
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: textColor },
          beginAtZero: true
        }
      }
    };
  });

  // Avatar colors
  private avatarColors = [
    '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', 
    '#ec4899', '#06b6d4', '#6366f1', '#14b8a6'
  ];

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

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getAvatarColor(index: number): string {
    return this.avatarColors[index % this.avatarColors.length];
  }

  getTaskIcon(type: string): string {
    const icons: Record<string, string> = {
      lab: 'pi-chart-bar',
      rx: 'pi-box',
      message: 'pi-envelope',
      appointment: 'pi-calendar',
      document: 'pi-file',
      review: 'pi-eye',
    };
    return icons[type] || 'pi-check-square';
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    const severities: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      confirmed: 'success',
      scheduled: 'info',
      'checked-in': 'info',
      'in-progress': 'warn',
      completed: 'secondary',
      cancelled: 'danger',
      'no-show': 'danger',
    };
    return severities[status.toLowerCase()] || 'info';
  }

  completeTask(taskId: string): void {
    this.dashboardService.completeTask(taskId).subscribe(() => {
      this.tasks.update(tasks => tasks.filter(t => t.id !== taskId));
    });
  }
}
