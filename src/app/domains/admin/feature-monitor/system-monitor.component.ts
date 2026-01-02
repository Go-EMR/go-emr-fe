import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { DividerModule } from 'primeng/divider';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { BadgeModule } from 'primeng/badge';
import { ChipModule } from 'primeng/chip';
import { KnobModule } from 'primeng/knob';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';

import { ThemeService } from '../../../core/services/theme.service';
import { AdminService } from '../data-access/services/admin.service';
import { SystemHealth, ServiceHealth, SystemMetrics } from '../data-access/models/admin.model';

interface SystemAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
}

@Component({
  selector: 'app-system-monitor',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule, TagModule, TooltipModule, ProgressBarModule,
    DividerModule, RippleModule, ToastModule, BadgeModule,
    ChipModule, KnobModule, CardModule,
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('staggerCards', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px) scale(0.95)' }),
          stagger(100, [
            animate('400ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('pulse', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('500ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate('350ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ]),
    trigger('alertSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(50px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(50px)' }))
      ])
    ])
  ],
  template: `
    <div class="monitor-container" [class.dark]="themeService.isDarkMode()">
      <p-toast />

      <!-- Header -->
      <header class="page-header" @fadeSlide>
        <div class="header-content">
          <div class="title-section">
            <h1>System Monitor</h1>
            <p class="subtitle">Real-time system health and performance metrics</p>
          </div>
          <div class="header-actions">
            <div class="auto-refresh">
              <span class="refresh-indicator" [class.active]="isAutoRefreshing()">
                <i class="pi pi-sync" [class.spinning]="isAutoRefreshing()"></i>
              </span>
              <span class="last-updated">Updated {{ formatTimeAgo(lastUpdated()) }}</span>
            </div>
            <p-button 
              [label]="isAutoRefreshing() ? 'Pause' : 'Auto'" 
              [icon]="isAutoRefreshing() ? 'pi pi-pause' : 'pi pi-play'" 
              [outlined]="true" 
              severity="secondary" 
              (onClick)="toggleAutoRefresh()" 
            />
            <p-button label="Refresh" icon="pi pi-refresh" (onClick)="refresh()" />
          </div>
        </div>
      </header>

      <!-- System Status Banner -->
      <div class="status-banner" [class]="health().status" @pulse>
        <div class="status-glow" [class]="health().status"></div>
        <div class="status-icon">
          @if (health().status === 'healthy') {
            <i class="pi pi-check-circle"></i>
          } @else if (health().status === 'degraded') {
            <i class="pi pi-exclamation-triangle"></i>
          } @else {
            <i class="pi pi-times-circle"></i>
          }
        </div>
        <div class="status-content">
          <h2>System {{ health().status | titlecase }}</h2>
          <p>Uptime: {{ formatUptime(health().uptime) }}</p>
        </div>
        <div class="status-metrics">
          <div class="mini-stat">
            <span class="value">{{ health().services.length }}</span>
            <span class="label">Services</span>
          </div>
          <div class="mini-stat">
            <span class="value">{{ getHealthyServicesCount() }}</span>
            <span class="label">Healthy</span>
          </div>
          <div class="mini-stat">
            <span class="value">{{ metrics().activeUsers }}</span>
            <span class="label">Users</span>
          </div>
        </div>
      </div>

      <!-- Metrics Grid -->
      <section class="metrics-section">
        <div class="section-header">
          <h2>System Metrics</h2>
          <div class="legend">
            <span class="legend-item cpu"><span class="dot"></span>CPU</span>
            <span class="legend-item memory"><span class="dot"></span>Memory</span>
            <span class="legend-item disk"><span class="dot"></span>Disk</span>
            <span class="legend-item database"><span class="dot"></span>Database</span>
          </div>
        </div>

        <div class="metrics-grid" @staggerCards>
          <!-- CPU Card -->
          <div class="metric-card cpu" pRipple>
            <div class="metric-icon-badge">
              <i class="pi pi-microchip"></i>
            </div>
            <div class="metric-header">
              <h3>CPU Usage</h3>
              <p-tag [value]="getCpuStatus()" [severity]="getCpuSeverity()" [rounded]="true" />
            </div>
            <div class="gauge-container">
              <svg viewBox="0 0 120 120" class="gauge-ring">
                <defs>
                  <linearGradient id="cpuGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#3b82f6" />
                    <stop offset="100%" style="stop-color:#1d4ed8" />
                  </linearGradient>
                </defs>
                <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" stroke-width="12" />
                <circle 
                  cx="60" cy="60" r="52" 
                  fill="none" 
                  stroke="url(#cpuGradient)"
                  stroke-width="12"
                  stroke-linecap="round"
                  [attr.stroke-dasharray]="getGaugeDashArray(metrics().cpu.usage)"
                  transform="rotate(-90 60 60)"
                  class="gauge-progress"
                />
              </svg>
              <div class="gauge-center">
                <span class="gauge-value">{{ metrics().cpu.usage }}</span>
                <span class="gauge-unit">%</span>
              </div>
            </div>
            <div class="metric-details">
              <div class="detail-item">
                <span class="label">Cores</span>
                <span class="value">{{ metrics().cpu.cores }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Load Avg</span>
                <span class="value">{{ (metrics().cpu.usage / 100 * metrics().cpu.cores).toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <!-- Memory Card -->
          <div class="metric-card memory" pRipple>
            <div class="metric-icon-badge">
              <i class="pi pi-server"></i>
            </div>
            <div class="metric-header">
              <h3>Memory</h3>
              <p-tag [value]="getMemoryStatus()" [severity]="getMemorySeverity()" [rounded]="true" />
            </div>
            <div class="gauge-container">
              <svg viewBox="0 0 120 120" class="gauge-ring">
                <defs>
                  <linearGradient id="memoryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#8b5cf6" />
                    <stop offset="100%" style="stop-color:#6d28d9" />
                  </linearGradient>
                </defs>
                <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" stroke-width="12" />
                <circle 
                  cx="60" cy="60" r="52" 
                  fill="none" 
                  stroke="url(#memoryGradient)"
                  stroke-width="12"
                  stroke-linecap="round"
                  [attr.stroke-dasharray]="getGaugeDashArray(metrics().memory.percentage)"
                  transform="rotate(-90 60 60)"
                  class="gauge-progress"
                />
              </svg>
              <div class="gauge-center">
                <span class="gauge-value">{{ metrics().memory.percentage }}</span>
                <span class="gauge-unit">%</span>
              </div>
            </div>
            <div class="metric-details">
              <div class="detail-item">
                <span class="label">Used</span>
                <span class="value">{{ formatBytes(metrics().memory.used) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Total</span>
                <span class="value">{{ formatBytes(metrics().memory.total) }}</span>
              </div>
            </div>
          </div>

          <!-- Disk Card -->
          <div class="metric-card disk" pRipple>
            <div class="metric-icon-badge">
              <i class="pi pi-database"></i>
            </div>
            <div class="metric-header">
              <h3>Disk Storage</h3>
              <p-tag [value]="getDiskStatus()" [severity]="getDiskSeverity()" [rounded]="true" />
            </div>
            <div class="gauge-container">
              <svg viewBox="0 0 120 120" class="gauge-ring">
                <defs>
                  <linearGradient id="diskGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#f59e0b" />
                    <stop offset="100%" style="stop-color:#d97706" />
                  </linearGradient>
                </defs>
                <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" stroke-width="12" />
                <circle 
                  cx="60" cy="60" r="52" 
                  fill="none" 
                  stroke="url(#diskGradient)"
                  stroke-width="12"
                  stroke-linecap="round"
                  [attr.stroke-dasharray]="getGaugeDashArray(metrics().disk.percentage)"
                  transform="rotate(-90 60 60)"
                  class="gauge-progress"
                />
              </svg>
              <div class="gauge-center">
                <span class="gauge-value">{{ metrics().disk.percentage }}</span>
                <span class="gauge-unit">%</span>
              </div>
            </div>
            <div class="metric-details">
              <div class="detail-item">
                <span class="label">Used</span>
                <span class="value">{{ formatBytes(metrics().disk.used) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Total</span>
                <span class="value">{{ formatBytes(metrics().disk.total) }}</span>
              </div>
            </div>
          </div>

          <!-- Database Card -->
          <div class="metric-card database" pRipple>
            <div class="metric-icon-badge">
              <i class="pi pi-box"></i>
            </div>
            <div class="metric-header">
              <h3>Database</h3>
              <p-tag [value]="getDbStatus()" [severity]="getDbSeverity()" [rounded]="true" />
            </div>
            <div class="db-metrics">
              <div class="db-stat-row">
                <div class="db-stat-label">
                  <i class="pi pi-link"></i>
                  <span>Connections</span>
                </div>
                <span class="db-stat-value">{{ metrics().database.connections }} / {{ metrics().database.maxConnections }}</span>
              </div>
              <div class="db-progress-wrapper">
                <div class="db-progress-bar">
                  <div 
                    class="db-progress-fill"
                    [style.width.%]="(metrics().database.connections / metrics().database.maxConnections) * 100"
                    [class.warning]="metrics().database.connections / metrics().database.maxConnections > 0.7"
                    [class.critical]="metrics().database.connections / metrics().database.maxConnections > 0.9"
                  ></div>
                </div>
              </div>

              <div class="db-stat-row">
                <div class="db-stat-label">
                  <i class="pi pi-clock"></i>
                  <span>Query Time</span>
                </div>
                <span class="db-stat-value" [class.warning]="metrics().database.queryTime > 100">
                  {{ metrics().database.queryTime }}ms
                </span>
              </div>

              <div class="db-stat-row">
                <div class="db-stat-label">
                  <i class="pi pi-bolt"></i>
                  <span>Queries/sec</span>
                </div>
                <span class="db-stat-value">~{{ Math.round(metrics().requests.perSecond * 2.5) }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Services Section -->
      <section class="services-section" @slideIn>
        <div class="section-header">
          <h2>Services</h2>
          <div class="service-summary">
            <span class="summary-item healthy">
              <i class="pi pi-check-circle"></i>
              {{ getServiceCountByStatus('up') }} Healthy
            </span>
            <span class="summary-item degraded">
              <i class="pi pi-exclamation-circle"></i>
              {{ getServiceCountByStatus('degraded') }} Degraded
            </span>
            <span class="summary-item down">
              <i class="pi pi-times-circle"></i>
              {{ getServiceCountByStatus('down') }} Down
            </span>
          </div>
        </div>

        <div class="services-grid">
          @for (service of health().services; track service.name) {
            <div class="service-card" [class]="service.status" pRipple>
              <div class="service-status-dot" [class]="service.status">
                @if (service.status === 'up') {
                  <i class="pi pi-check"></i>
                } @else if (service.status === 'degraded') {
                  <i class="pi pi-exclamation-triangle"></i>
                } @else {
                  <i class="pi pi-times"></i>
                }
              </div>
              <div class="service-info">
                <h4>{{ service.name }}</h4>
                <div class="service-meta">
                  <span class="response-time" [class.slow]="service.responseTime > 200">
                    <i class="pi pi-clock"></i>
                    {{ service.responseTime }}ms
                  </span>
                  <span class="last-check">
                    {{ formatTimeAgo(service.lastChecked) }}
                  </span>
                </div>
              </div>
              @if (service.lastError) {
                <div class="service-error">
                  <i class="pi pi-info-circle"></i>
                  <span>{{ service.lastError }}</span>
                </div>
              }
            </div>
          }
        </div>
      </section>

      <!-- Request Metrics -->
      <section class="requests-section" @fadeSlide>
        <div class="section-header">
          <h2>Request Metrics</h2>
        </div>

        <div class="request-grid">
          <div class="request-card" pRipple>
            <div class="request-icon total">
              <i class="pi pi-chart-line"></i>
            </div>
            <div class="request-content">
              <span class="request-value">{{ metrics().requests.total | number }}</span>
              <span class="request-label">Total Requests</span>
            </div>
            <div class="request-trend positive">
              <i class="pi pi-arrow-up"></i>
              <span>12%</span>
            </div>
          </div>

          <div class="request-card" pRipple>
            <div class="request-icon rps">
              <i class="pi pi-bolt"></i>
            </div>
            <div class="request-content">
              <span class="request-value">{{ metrics().requests.perSecond }}</span>
              <span class="request-label">Requests/sec</span>
            </div>
            <div class="request-sparkline">
              <svg viewBox="0 0 60 20" preserveAspectRatio="none">
                <polyline points="0,15 10,12 20,16 30,8 40,10 50,6 60,9" fill="none" stroke="#10b981" stroke-width="2"/>
              </svg>
            </div>
          </div>

          <div class="request-card" pRipple>
            <div class="request-icon response">
              <i class="pi pi-stopwatch"></i>
            </div>
            <div class="request-content">
              <span class="request-value">{{ metrics().requests.avgResponseTime }}<small>ms</small></span>
              <span class="request-label">Avg Response</span>
            </div>
            <p-tag [value]="metrics().requests.avgResponseTime < 100 ? 'Fast' : 'Normal'" [severity]="metrics().requests.avgResponseTime < 100 ? 'success' : 'info'" [rounded]="true" />
          </div>

          <div class="request-card" [class.has-errors]="metrics().errors.total > 0" pRipple>
            <div class="request-icon errors">
              <i class="pi pi-exclamation-triangle"></i>
            </div>
            <div class="request-content">
              <span class="request-value">{{ metrics().errors.total | number }}</span>
              <span class="request-label">Errors ({{ metrics().errors.rate }}%)</span>
            </div>
            @if (metrics().errors.rate > 1) {
              <p-tag value="High" severity="danger" [rounded]="true" />
            }
          </div>
        </div>
      </section>

      <!-- Active Sessions -->
      <section class="sessions-section" @fadeSlide>
        <div class="section-header">
          <h2>Active Sessions</h2>
        </div>

        <div class="sessions-grid">
          <div class="session-card users" pRipple>
            <div class="session-visual">
              <div class="avatar-stack">
                <div class="avatar">JD</div>
                <div class="avatar">SM</div>
                <div class="avatar">AK</div>
                <div class="avatar more">+{{ Math.max(0, metrics().activeUsers - 3) }}</div>
              </div>
            </div>
            <div class="session-content">
              <span class="session-value">{{ metrics().activeUsers }}</span>
              <span class="session-label">Active Users</span>
            </div>
          </div>

          <div class="session-card sessions" pRipple>
            <div class="session-icon">
              <i class="pi pi-desktop"></i>
            </div>
            <div class="session-content">
              <span class="session-value">{{ metrics().activeSessions }}</span>
              <span class="session-label">Active Sessions</span>
            </div>
            <div class="session-breakdown">
              <div class="breakdown-item">
                <i class="pi pi-desktop"></i>
                <span>{{ Math.round(metrics().activeSessions * 0.65) }}</span>
              </div>
              <div class="breakdown-item">
                <i class="pi pi-mobile"></i>
                <span>{{ Math.round(metrics().activeSessions * 0.35) }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Alerts Section -->
      @if (alerts().length > 0) {
        <section class="alerts-section" @fadeSlide>
          <div class="section-header">
            <h2>
              <i class="pi pi-bell"></i>
              Active Alerts
              <p-badge [value]="alerts().length.toString()" severity="danger" />
            </h2>
            <p-button label="Clear All" icon="pi pi-trash" [text]="true" severity="secondary" (onClick)="clearAllAlerts()" />
          </div>

          <div class="alerts-list">
            @for (alert of alerts(); track alert.id) {
              <div class="alert-card" [class]="alert.severity" @alertSlide>
                <div class="alert-stripe" [class]="alert.severity"></div>
                <div class="alert-icon">
                  @if (alert.severity === 'critical') {
                    <i class="pi pi-times-circle"></i>
                  } @else if (alert.severity === 'warning') {
                    <i class="pi pi-exclamation-triangle"></i>
                  } @else {
                    <i class="pi pi-info-circle"></i>
                  }
                </div>
                <div class="alert-content">
                  <h4>{{ alert.title }}</h4>
                  <p>{{ alert.message }}</p>
                  <span class="alert-time">
                    <i class="pi pi-clock"></i>
                    {{ formatTimeAgo(alert.timestamp) }}
                  </span>
                </div>
                <p-button icon="pi pi-times" [rounded]="true" [text]="true" severity="secondary" (onClick)="dismissAlert(alert.id)" pTooltip="Dismiss" />
              </div>
            }
          </div>
        </section>
      }
    </div>
  `,
  styles: [`
    .monitor-container {
      padding: 1.5rem 2rem;
      min-height: 100vh;
      background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
    }

    .dark.monitor-container {
      background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
    }

    /* Header */
    .page-header {
      margin-bottom: 1.5rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .title-section h1 {
      margin: 0;
      font-size: 1.875rem;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.025em;
    }

    .dark .title-section h1 {
      color: #f8fafc;
    }

    .subtitle {
      margin: 0.5rem 0 0;
      font-size: 0.9375rem;
      color: #64748b;
      font-weight: 400;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .auto-refresh {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .refresh-indicator {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: #f1f5f9;
    }

    .dark .refresh-indicator {
      background: #334155;
    }

    .refresh-indicator.active {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }

    .refresh-indicator .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .last-updated {
      font-size: 0.8125rem;
      color: #64748b;
    }

    /* Status Banner */
    .status-banner {
      position: relative;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: 1.5rem 2rem;
      border-radius: 16px;
      margin-bottom: 1.5rem;
      overflow: hidden;
    }

    .status-banner.healthy {
      background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
      border: 1px solid #86efac;
    }

    .status-banner.degraded {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 1px solid #fcd34d;
    }

    .status-banner.unhealthy {
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
      border: 1px solid #fca5a5;
    }

    .status-glow {
      position: absolute;
      top: -50%;
      right: -10%;
      width: 300px;
      height: 300px;
      border-radius: 50%;
      opacity: 0.3;
      pointer-events: none;
    }

    .status-glow.healthy { background: radial-gradient(circle, #22c55e 0%, transparent 70%); }
    .status-glow.degraded { background: radial-gradient(circle, #f59e0b 0%, transparent 70%); }
    .status-glow.unhealthy { background: radial-gradient(circle, #ef4444 0%, transparent 70%); }

    .status-icon {
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 14px;
      flex-shrink: 0;
    }

    .status-icon i {
      font-size: 1.75rem;
      color: white;
    }

    .status-banner.healthy .status-icon { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); }
    .status-banner.degraded .status-icon { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
    .status-banner.unhealthy .status-icon { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }

    .status-content {
      flex: 1;
    }

    .status-content h2 {
      margin: 0;
      font-size: 1.375rem;
      font-weight: 700;
    }

    .status-banner.healthy .status-content h2 { color: #15803d; }
    .status-banner.degraded .status-content h2 { color: #b45309; }
    .status-banner.unhealthy .status-content h2 { color: #b91c1c; }

    .status-content p {
      margin: 0.25rem 0 0;
      font-size: 0.875rem;
      color: #475569;
    }

    .status-metrics {
      display: flex;
      gap: 2rem;
    }

    .mini-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.125rem;
    }

    .mini-stat .value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
    }

    .mini-stat .label {
      font-size: 0.6875rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Section Headers */
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .section-header h2 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .dark .section-header h2 {
      color: #f8fafc;
    }

    .legend {
      display: flex;
      gap: 1.25rem;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: #64748b;
    }

    .legend-item .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    .legend-item.cpu .dot { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
    .legend-item.memory .dot { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }
    .legend-item.disk .dot { background: linear-gradient(135deg, #f59e0b, #d97706); }
    .legend-item.database .dot { background: linear-gradient(135deg, #10b981, #059669); }

    /* Metrics Grid */
    .metrics-section {
      margin-bottom: 2rem;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;
    }

    .metric-card {
      position: relative;
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      border: 1px solid #f1f5f9;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
    }

    .dark .metric-card {
      background: #1e293b;
      border-color: #334155;
    }

    .metric-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
    }

    .metric-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
    }

    .metric-card.cpu::before { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
    .metric-card.memory::before { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }
    .metric-card.disk::before { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
    .metric-card.database::before { background: linear-gradient(90deg, #10b981, #34d399); }

    .metric-icon-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .metric-icon-badge i {
      font-size: 1rem;
      color: white;
    }

    .metric-card.cpu .metric-icon-badge { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
    .metric-card.memory .metric-icon-badge { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }
    .metric-card.disk .metric-icon-badge { background: linear-gradient(135deg, #f59e0b, #d97706); }
    .metric-card.database .metric-icon-badge { background: linear-gradient(135deg, #10b981, #059669); }

    .metric-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .metric-header h3 {
      margin: 0;
      font-size: 0.9375rem;
      font-weight: 600;
      color: #0f172a;
    }

    .dark .metric-header h3 {
      color: #f8fafc;
    }

    /* Gauge */
    .gauge-container {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 130px;
      margin-bottom: 0.75rem;
    }

    .gauge-ring {
      width: 120px;
      height: 120px;
    }

    .gauge-progress {
      transition: stroke-dasharray 0.5s ease-out;
    }

    .dark .gauge-ring circle:first-of-type {
      stroke: #334155;
    }

    .gauge-center {
      position: absolute;
      display: flex;
      align-items: baseline;
      gap: 0.125rem;
    }

    .gauge-value {
      font-size: 2rem;
      font-weight: 700;
      color: #0f172a;
    }

    .dark .gauge-value {
      color: #f8fafc;
    }

    .gauge-unit {
      font-size: 0.875rem;
      font-weight: 500;
      color: #64748b;
    }

    .metric-details {
      display: flex;
      justify-content: space-between;
      padding-top: 0.75rem;
      border-top: 1px solid #f1f5f9;
    }

    .dark .metric-details {
      border-top-color: #334155;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .detail-item .label {
      font-size: 0.6875rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .detail-item .value {
      font-size: 0.875rem;
      font-weight: 600;
      color: #0f172a;
    }

    .dark .detail-item .value {
      color: #f8fafc;
    }

    /* Database Metrics */
    .db-metrics {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-top: 0.5rem;
    }

    .db-stat-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .db-stat-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: #64748b;
    }

    .db-stat-label i {
      font-size: 0.875rem;
      color: #10b981;
    }

    .db-stat-value {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #0f172a;
    }

    .dark .db-stat-value {
      color: #f8fafc;
    }

    .db-stat-value.warning {
      color: #f59e0b;
    }

    .db-progress-wrapper {
      padding: 0 0.25rem;
    }

    .db-progress-bar {
      height: 6px;
      background: #e2e8f0;
      border-radius: 3px;
      overflow: hidden;
    }

    .dark .db-progress-bar {
      background: #334155;
    }

    .db-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #10b981, #34d399);
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    .db-progress-fill.warning {
      background: linear-gradient(90deg, #f59e0b, #fbbf24);
    }

    .db-progress-fill.critical {
      background: linear-gradient(90deg, #ef4444, #f87171);
    }

    /* Services Section */
    .services-section {
      margin-bottom: 2rem;
    }

    .service-summary {
      display: flex;
      gap: 1rem;
    }

    .summary-item {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.8125rem;
      font-weight: 500;
    }

    .summary-item.healthy { color: #10b981; }
    .summary-item.degraded { color: #f59e0b; }
    .summary-item.down { color: #ef4444; }

    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1rem;
    }

    .service-card {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: white;
      border-radius: 12px;
      border: 1px solid #f1f5f9;
      transition: all 0.2s;
    }

    .dark .service-card {
      background: #1e293b;
      border-color: #334155;
    }

    .service-card:hover {
      border-color: #e2e8f0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .service-card.degraded {
      border-color: #fcd34d;
      background: linear-gradient(135deg, white 0%, #fffbeb 100%);
    }

    .service-card.down {
      border-color: #fca5a5;
      background: linear-gradient(135deg, white 0%, #fef2f2 100%);
    }

    .service-status-dot {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .service-status-dot i {
      font-size: 0.75rem;
      color: white;
    }

    .service-status-dot.up { background: linear-gradient(135deg, #10b981, #059669); }
    .service-status-dot.degraded { background: linear-gradient(135deg, #f59e0b, #d97706); }
    .service-status-dot.down { background: linear-gradient(135deg, #ef4444, #dc2626); }

    .service-info {
      flex: 1;
      min-width: 0;
    }

    .service-info h4 {
      margin: 0 0 0.375rem;
      font-size: 0.9375rem;
      font-weight: 600;
      color: #0f172a;
    }

    .dark .service-info h4 {
      color: #f8fafc;
    }

    .service-meta {
      display: flex;
      gap: 1rem;
      font-size: 0.75rem;
      color: #64748b;
    }

    .response-time {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .response-time.slow {
      color: #f59e0b;
    }

    .service-error {
      display: flex;
      align-items: flex-start;
      gap: 0.375rem;
      margin-top: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: #fef2f2;
      border-radius: 6px;
      font-size: 0.75rem;
      color: #dc2626;
    }

    .service-error i {
      font-size: 0.75rem;
      margin-top: 0.125rem;
    }

    /* Request Section */
    .requests-section {
      margin-bottom: 2rem;
    }

    .request-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;
    }

    .request-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: white;
      border-radius: 16px;
      border: 1px solid #f1f5f9;
      transition: all 0.3s;
    }

    .dark .request-card {
      background: #1e293b;
      border-color: #334155;
    }

    .request-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
    }

    .request-card.has-errors {
      border-color: #fca5a5;
      background: linear-gradient(135deg, white 0%, #fef2f2 100%);
    }

    .request-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .request-icon i {
      font-size: 1.125rem;
      color: white;
    }

    .request-icon.total { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
    .request-icon.rps { background: linear-gradient(135deg, #10b981, #059669); }
    .request-icon.response { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }
    .request-icon.errors { background: linear-gradient(135deg, #ef4444, #dc2626); }

    .request-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .request-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
    }

    .dark .request-value {
      color: #f8fafc;
    }

    .request-value small {
      font-size: 0.75rem;
      font-weight: 500;
      color: #64748b;
    }

    .request-label {
      font-size: 0.8125rem;
      color: #64748b;
    }

    .request-trend {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .request-trend.positive {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }

    .request-trend.negative {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }

    .request-sparkline {
      width: 60px;
      height: 20px;
    }

    .request-sparkline svg {
      width: 100%;
      height: 100%;
    }

    /* Sessions Section */
    .sessions-section {
      margin-bottom: 2rem;
    }

    .sessions-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
      max-width: 600px;
    }

    .session-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      background: white;
      border-radius: 16px;
      border: 1px solid #f1f5f9;
      transition: all 0.3s;
    }

    .dark .session-card {
      background: #1e293b;
      border-color: #334155;
    }

    .session-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
    }

    .session-visual {
      flex-shrink: 0;
    }

    .avatar-stack {
      display: flex;
    }

    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.6875rem;
      font-weight: 600;
      color: white;
      border: 2px solid white;
      margin-left: -8px;
    }

    .avatar:first-child {
      margin-left: 0;
    }

    .avatar:nth-child(1) { background: #3b82f6; }
    .avatar:nth-child(2) { background: #8b5cf6; }
    .avatar:nth-child(3) { background: #10b981; }
    .avatar.more { background: #64748b; font-size: 0.625rem; }

    .session-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    }

    .session-icon i {
      font-size: 1.125rem;
      color: white;
    }

    .session-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .session-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
    }

    .dark .session-value {
      color: #f8fafc;
    }

    .session-label {
      font-size: 0.8125rem;
      color: #64748b;
    }

    .session-breakdown {
      display: flex;
      gap: 0.75rem;
    }

    .breakdown-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      color: #64748b;
    }

    .breakdown-item i {
      font-size: 0.875rem;
    }

    /* Alerts Section */
    .alerts-section {
      margin-bottom: 2rem;
    }

    .alerts-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .alert-card {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: white;
      border-radius: 12px;
      border: 1px solid #f1f5f9;
      position: relative;
      overflow: hidden;
    }

    .dark .alert-card {
      background: #1e293b;
      border-color: #334155;
    }

    .alert-card.critical {
      border-color: #fca5a5;
      background: linear-gradient(135deg, white 0%, #fef2f2 100%);
    }

    .alert-card.warning {
      border-color: #fcd34d;
      background: linear-gradient(135deg, white 0%, #fffbeb 100%);
    }

    .alert-stripe {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
    }

    .alert-stripe.critical { background: #ef4444; }
    .alert-stripe.warning { background: #f59e0b; }
    .alert-stripe.info { background: #3b82f6; }

    .alert-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .alert-icon i {
      font-size: 1.125rem;
      color: white;
    }

    .alert-card.critical .alert-icon { background: linear-gradient(135deg, #ef4444, #dc2626); }
    .alert-card.warning .alert-icon { background: linear-gradient(135deg, #f59e0b, #d97706); }
    .alert-card.info .alert-icon { background: linear-gradient(135deg, #3b82f6, #2563eb); }

    .alert-content {
      flex: 1;
    }

    .alert-content h4 {
      margin: 0 0 0.25rem;
      font-size: 0.9375rem;
      font-weight: 600;
      color: #0f172a;
    }

    .dark .alert-content h4 {
      color: #f8fafc;
    }

    .alert-content p {
      margin: 0 0 0.5rem;
      font-size: 0.8125rem;
      color: #475569;
      line-height: 1.5;
    }

    .dark .alert-content p {
      color: #94a3b8;
    }

    .alert-time {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .alert-time i {
      font-size: 0.75rem;
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .metrics-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .request-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .monitor-container {
        padding: 1rem;
      }

      .header-content {
        flex-direction: column;
        gap: 1rem;
      }

      .status-banner {
        flex-direction: column;
        text-align: center;
      }

      .status-metrics {
        width: 100%;
        justify-content: space-around;
      }

      .metrics-grid,
      .request-grid {
        grid-template-columns: 1fr;
      }

      .sessions-grid {
        grid-template-columns: 1fr;
        max-width: none;
      }

      .legend {
        display: none;
      }
    }
  `]
})
export class SystemMonitorComponent implements OnInit, OnDestroy {
  private adminService = inject(AdminService);
  themeService = inject(ThemeService);
  private messageService = inject(MessageService);
  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  Math = Math;

  lastUpdated = signal(new Date());
  isAutoRefreshing = signal(true);

  alerts = signal<SystemAlert[]>([
    {
      id: '1',
      severity: 'warning',
      title: 'High Memory Usage',
      message: 'Memory usage has exceeded 80% threshold on the application server.',
      timestamp: new Date(Date.now() - 1800000)
    },
    {
      id: '2',
      severity: 'info',
      title: 'Scheduled Maintenance',
      message: 'Database maintenance scheduled for tonight at 2:00 AM EST.',
      timestamp: new Date(Date.now() - 3600000)
    }
  ]);

  health = computed(() => this.adminService.systemHealth());
  metrics = computed(() => this.health().metrics);

  ngOnInit(): void {
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  startAutoRefresh(): void {
    this.refreshInterval = setInterval(() => {
      this.refresh();
    }, 30000);
  }

  stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  toggleAutoRefresh(): void {
    if (this.isAutoRefreshing()) {
      this.stopAutoRefresh();
      this.isAutoRefreshing.set(false);
    } else {
      this.startAutoRefresh();
      this.isAutoRefreshing.set(true);
    }
  }

  refresh(): void {
    this.lastUpdated.set(new Date());
    this.messageService.add({ severity: 'success', summary: 'Refreshed', detail: 'Metrics updated', life: 2000 });
  }

  formatTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  formatBytes(bytes: number): string {
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  }

  getGaugeDashArray(percentage: number): string {
    const circumference = 2 * Math.PI * 52;
    const filled = (percentage / 100) * circumference;
    return `${filled} ${circumference}`;
  }

  getHealthyServicesCount(): number {
    return this.health().services.filter(s => s.status === 'up').length;
  }

  getServiceCountByStatus(status: string): number {
    return this.health().services.filter(s => s.status === status).length;
  }

  getCpuStatus(): string {
    const usage = this.metrics().cpu.usage;
    if (usage >= 90) return 'Critical';
    if (usage >= 70) return 'High';
    return 'Normal';
  }

  getCpuSeverity(): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
    const usage = this.metrics().cpu.usage;
    if (usage >= 90) return 'danger';
    if (usage >= 70) return 'warn';
    return 'success';
  }

  getMemoryStatus(): string {
    const usage = this.metrics().memory.percentage;
    if (usage >= 90) return 'Critical';
    if (usage >= 70) return 'High';
    return 'Normal';
  }

  getMemorySeverity(): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
    const usage = this.metrics().memory.percentage;
    if (usage >= 90) return 'danger';
    if (usage >= 70) return 'warn';
    return 'success';
  }

  getDiskStatus(): string {
    const usage = this.metrics().disk.percentage;
    if (usage >= 90) return 'Critical';
    if (usage >= 80) return 'Warning';
    return 'Normal';
  }

  getDiskSeverity(): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
    const usage = this.metrics().disk.percentage;
    if (usage >= 90) return 'danger';
    if (usage >= 80) return 'warn';
    return 'success';
  }

  getDbStatus(): string {
    const connRatio = this.metrics().database.connections / this.metrics().database.maxConnections;
    if (connRatio >= 0.9) return 'Critical';
    if (connRatio >= 0.7) return 'Busy';
    return 'Normal';
  }

  getDbSeverity(): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
    const connRatio = this.metrics().database.connections / this.metrics().database.maxConnections;
    if (connRatio >= 0.9) return 'danger';
    if (connRatio >= 0.7) return 'warn';
    return 'success';
  }

  dismissAlert(id: string): void {
    this.alerts.update(alerts => alerts.filter(a => a.id !== id));
    this.messageService.add({ severity: 'info', summary: 'Dismissed', detail: 'Alert dismissed' });
  }

  clearAllAlerts(): void {
    this.alerts.set([]);
    this.messageService.add({ severity: 'info', summary: 'Cleared', detail: 'All alerts cleared' });
  }
}
