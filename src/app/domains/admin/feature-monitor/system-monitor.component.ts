import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../data-access/services/admin.service';
import { SystemHealth, ServiceHealth, SystemMetrics } from '../data-access/models/admin.model';

@Component({
  selector: 'app-system-monitor',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="monitor-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="title-section">
            <h1>System Monitor</h1>
            <p class="subtitle">Real-time system health and performance metrics</p>
          </div>
          <div class="header-actions">
            <div class="last-updated">
              Last updated: {{ formatTime(lastUpdated()) }}
            </div>
            <button class="btn btn-primary" (click)="refresh()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </header>

      <!-- System Status Banner -->
      <div class="status-banner" [class]="health().status">
        <div class="status-icon">
          @if (health().status === 'healthy') {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          } @else if (health().status === 'degraded') {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          } @else {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          }
        </div>
        <div class="status-content">
          <h2>System {{ health().status | titlecase }}</h2>
          <p>Uptime: {{ formatUptime(health().uptime) }}</p>
        </div>
      </div>

      <!-- Services Grid -->
      <section class="services-section">
        <h2>Services</h2>
        <div class="services-grid">
          @for (service of health().services; track service.name) {
            <div class="service-card" [class]="service.status">
              <div class="service-header">
                <div class="service-status-indicator" [class]="service.status"></div>
                <h3>{{ service.name }}</h3>
              </div>
              <div class="service-details">
                <div class="detail-row">
                  <span class="label">Status</span>
                  <span class="value status-text" [class]="service.status">
                    {{ service.status | titlecase }}
                  </span>
                </div>
                <div class="detail-row">
                  <span class="label">Response Time</span>
                  <span class="value" [class.warning]="service.responseTime > 200">
                    {{ service.responseTime }}ms
                  </span>
                </div>
                <div class="detail-row">
                  <span class="label">Last Check</span>
                  <span class="value">{{ formatTime(service.lastChecked) }}</span>
                </div>
                @if (service.lastError) {
                  <div class="error-message">
                    {{ service.lastError }}
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </section>

      <!-- Metrics Section -->
      <section class="metrics-section">
        <h2>System Metrics</h2>
        <div class="metrics-grid">
          <!-- CPU Usage -->
          <div class="metric-card">
            <div class="metric-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/>
                <rect x="9" y="9" width="6" height="6"/>
                <line x1="9" y1="1" x2="9" y2="4"/>
                <line x1="15" y1="1" x2="15" y2="4"/>
                <line x1="9" y1="20" x2="9" y2="23"/>
                <line x1="15" y1="20" x2="15" y2="23"/>
                <line x1="20" y1="9" x2="23" y2="9"/>
                <line x1="20" y1="14" x2="23" y2="14"/>
                <line x1="1" y1="9" x2="4" y2="9"/>
                <line x1="1" y1="14" x2="4" y2="14"/>
              </svg>
              <h3>CPU Usage</h3>
            </div>
            <div class="metric-gauge">
              <svg viewBox="0 0 120 120" class="gauge-svg">
                <circle 
                  cx="60" cy="60" r="50" 
                  fill="none" 
                  stroke="#e2e8f0" 
                  stroke-width="10"
                />
                <circle 
                  cx="60" cy="60" r="50" 
                  fill="none" 
                  [attr.stroke]="getGaugeColor(metrics().cpu.usage)"
                  stroke-width="10"
                  stroke-linecap="round"
                  [attr.stroke-dasharray]="getGaugeDashArray(metrics().cpu.usage)"
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div class="gauge-value">
                <span class="value">{{ metrics().cpu.usage }}</span>
                <span class="unit">%</span>
              </div>
            </div>
            <div class="metric-footer">
              {{ metrics().cpu.cores }} cores available
            </div>
          </div>

          <!-- Memory Usage -->
          <div class="metric-card">
            <div class="metric-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="6" width="20" height="12" rx="2"/>
                <line x1="6" y1="12" x2="6" y2="12"/>
                <line x1="10" y1="12" x2="10" y2="12"/>
                <line x1="14" y1="12" x2="14" y2="12"/>
                <line x1="18" y1="12" x2="18" y2="12"/>
              </svg>
              <h3>Memory</h3>
            </div>
            <div class="metric-gauge">
              <svg viewBox="0 0 120 120" class="gauge-svg">
                <circle 
                  cx="60" cy="60" r="50" 
                  fill="none" 
                  stroke="#e2e8f0" 
                  stroke-width="10"
                />
                <circle 
                  cx="60" cy="60" r="50" 
                  fill="none" 
                  [attr.stroke]="getGaugeColor(metrics().memory.percentage)"
                  stroke-width="10"
                  stroke-linecap="round"
                  [attr.stroke-dasharray]="getGaugeDashArray(metrics().memory.percentage)"
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div class="gauge-value">
                <span class="value">{{ metrics().memory.percentage }}</span>
                <span class="unit">%</span>
              </div>
            </div>
            <div class="metric-footer">
              {{ formatBytes(metrics().memory.used) }} / {{ formatBytes(metrics().memory.total) }}
            </div>
          </div>

          <!-- Disk Usage -->
          <div class="metric-card">
            <div class="metric-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <ellipse cx="12" cy="5" rx="9" ry="3"/>
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
              </svg>
              <h3>Disk</h3>
            </div>
            <div class="metric-gauge">
              <svg viewBox="0 0 120 120" class="gauge-svg">
                <circle 
                  cx="60" cy="60" r="50" 
                  fill="none" 
                  stroke="#e2e8f0" 
                  stroke-width="10"
                />
                <circle 
                  cx="60" cy="60" r="50" 
                  fill="none" 
                  [attr.stroke]="getGaugeColor(metrics().disk.percentage)"
                  stroke-width="10"
                  stroke-linecap="round"
                  [attr.stroke-dasharray]="getGaugeDashArray(metrics().disk.percentage)"
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div class="gauge-value">
                <span class="value">{{ metrics().disk.percentage }}</span>
                <span class="unit">%</span>
              </div>
            </div>
            <div class="metric-footer">
              {{ formatBytes(metrics().disk.used) }} / {{ formatBytes(metrics().disk.total) }}
            </div>
          </div>

          <!-- Database -->
          <div class="metric-card">
            <div class="metric-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <ellipse cx="12" cy="5" rx="9" ry="3"/>
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
              </svg>
              <h3>Database</h3>
            </div>
            <div class="metric-stats">
              <div class="stat-row">
                <span class="label">Connections</span>
                <span class="value">{{ metrics().database.connections }} / {{ metrics().database.maxConnections }}</span>
              </div>
              <div class="progress-bar">
                <div 
                  class="progress-fill"
                  [style.width.%]="(metrics().database.connections / metrics().database.maxConnections) * 100"
                  [class.warning]="metrics().database.connections / metrics().database.maxConnections > 0.7"
                  [class.critical]="metrics().database.connections / metrics().database.maxConnections > 0.9"
                ></div>
              </div>
              <div class="stat-row">
                <span class="label">Avg Query Time</span>
                <span class="value" [class.warning]="metrics().database.queryTime > 100">
                  {{ metrics().database.queryTime }}ms
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Request Metrics -->
      <section class="requests-section">
        <h2>Request Metrics</h2>
        <div class="request-cards">
          <div class="request-card">
            <div class="request-value">{{ metrics().requests.total | number }}</div>
            <div class="request-label">Total Requests</div>
          </div>
          <div class="request-card">
            <div class="request-value">{{ metrics().requests.perSecond }}</div>
            <div class="request-label">Requests/sec</div>
          </div>
          <div class="request-card">
            <div class="request-value">{{ metrics().requests.avgResponseTime }}ms</div>
            <div class="request-label">Avg Response</div>
          </div>
          <div class="request-card" [class.warning]="metrics().errors.rate > 1">
            <div class="request-value">{{ metrics().errors.total | number }}</div>
            <div class="request-label">Errors ({{ metrics().errors.rate }}%)</div>
          </div>
        </div>
      </section>

      <!-- Active Sessions -->
      <section class="sessions-section">
        <h2>Active Sessions</h2>
        <div class="sessions-grid">
          <div class="session-stat">
            <div class="session-icon users">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div class="session-content">
              <span class="session-value">{{ metrics().activeUsers }}</span>
              <span class="session-label">Active Users</span>
            </div>
          </div>
          <div class="session-stat">
            <div class="session-icon sessions">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </div>
            <div class="session-content">
              <span class="session-value">{{ metrics().activeSessions }}</span>
              <span class="session-label">Active Sessions</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Alerts -->
      @if (alerts().length > 0) {
        <section class="alerts-section">
          <h2>Active Alerts</h2>
          <div class="alerts-list">
            @for (alert of alerts(); track alert.id) {
              <div class="alert-card" [class]="alert.severity">
                <div class="alert-icon">
                  @if (alert.severity === 'critical') {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="15" y1="9" x2="9" y2="15"/>
                      <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                  } @else {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  }
                </div>
                <div class="alert-content">
                  <h4>{{ alert.title }}</h4>
                  <p>{{ alert.message }}</p>
                  <span class="alert-time">{{ formatTime(alert.timestamp) }}</span>
                </div>
                <button class="btn-dismiss" (click)="dismissAlert(alert.id)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            }
          </div>
        </section>
      }
    </div>
  `,
  styles: [`
    .monitor-container {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Header */
    .page-header {
      margin-bottom: 1.5rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
    }

    .title-section h1 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 600;
      color: #1e293b;
    }

    .subtitle {
      margin: 0.25rem 0 0;
      color: #64748b;
      font-size: 0.875rem;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .last-updated {
      font-size: 0.8125rem;
      color: #64748b;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .btn svg {
      width: 1rem;
      height: 1rem;
    }

    /* Status Banner */
    .status-banner {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      border-radius: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .status-banner.healthy {
      background: #dcfce7;
      border: 1px solid #86efac;
    }

    .status-banner.degraded {
      background: #fef3c7;
      border: 1px solid #fcd34d;
    }

    .status-banner.unhealthy {
      background: #fee2e2;
      border: 1px solid #fca5a5;
    }

    .status-icon {
      width: 3rem;
      height: 3rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }

    .status-banner.healthy .status-icon {
      background: #16a34a;
      color: white;
    }

    .status-banner.degraded .status-icon {
      background: #d97706;
      color: white;
    }

    .status-banner.unhealthy .status-icon {
      background: #dc2626;
      color: white;
    }

    .status-icon svg {
      width: 1.5rem;
      height: 1.5rem;
    }

    .status-content h2 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
    }

    .status-banner.healthy .status-content h2 { color: #16a34a; }
    .status-banner.degraded .status-content h2 { color: #d97706; }
    .status-banner.unhealthy .status-content h2 { color: #dc2626; }

    .status-content p {
      margin: 0.25rem 0 0;
      font-size: 0.875rem;
      color: #475569;
    }

    /* Sections */
    section {
      margin-bottom: 2rem;
    }

    section h2 {
      margin: 0 0 1rem;
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
    }

    /* Services Grid */
    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 1rem;
    }

    .service-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 1rem;
      transition: all 0.2s;
    }

    .service-card.down {
      border-color: #fca5a5;
      background: #fef2f2;
    }

    .service-card.degraded {
      border-color: #fcd34d;
      background: #fffbeb;
    }

    .service-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .service-status-indicator {
      width: 0.75rem;
      height: 0.75rem;
      border-radius: 50%;
    }

    .service-status-indicator.up { background: #16a34a; }
    .service-status-indicator.degraded { background: #d97706; }
    .service-status-indicator.down { background: #dc2626; }

    .service-header h3 {
      margin: 0;
      font-size: 0.9375rem;
      font-weight: 600;
      color: #1e293b;
    }

    .service-details {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.8125rem;
    }

    .detail-row .label {
      color: #64748b;
    }

    .detail-row .value {
      color: #1e293b;
      font-weight: 500;
    }

    .detail-row .value.warning {
      color: #d97706;
    }

    .status-text.up { color: #16a34a; }
    .status-text.degraded { color: #d97706; }
    .status-text.down { color: #dc2626; }

    .service-card .error-message {
      margin-top: 0.5rem;
      padding: 0.5rem;
      background: #fee2e2;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      color: #dc2626;
    }

    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }

    .metric-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 1.25rem;
    }

    .metric-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .metric-header svg {
      width: 1.25rem;
      height: 1.25rem;
      color: #64748b;
    }

    .metric-header h3 {
      margin: 0;
      font-size: 0.9375rem;
      font-weight: 600;
      color: #1e293b;
    }

    .metric-gauge {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 120px;
    }

    .gauge-svg {
      width: 120px;
      height: 120px;
    }

    .gauge-value {
      position: absolute;
      display: flex;
      align-items: baseline;
    }

    .gauge-value .value {
      font-size: 1.75rem;
      font-weight: 600;
      color: #1e293b;
    }

    .gauge-value .unit {
      font-size: 0.875rem;
      color: #64748b;
    }

    .metric-footer {
      text-align: center;
      font-size: 0.8125rem;
      color: #64748b;
      margin-top: 0.5rem;
    }

    .metric-stats {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .stat-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.8125rem;
    }

    .stat-row .label {
      color: #64748b;
    }

    .stat-row .value {
      color: #1e293b;
      font-weight: 500;
    }

    .stat-row .value.warning {
      color: #d97706;
    }

    .progress-bar {
      height: 0.5rem;
      background: #e2e8f0;
      border-radius: 0.25rem;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: #3b82f6;
      border-radius: 0.25rem;
      transition: width 0.3s;
    }

    .progress-fill.warning {
      background: #d97706;
    }

    .progress-fill.critical {
      background: #dc2626;
    }

    /* Request Cards */
    .request-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .request-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 1.25rem;
      text-align: center;
    }

    .request-card.warning {
      border-color: #fecaca;
      background: #fef2f2;
    }

    .request-value {
      font-size: 1.75rem;
      font-weight: 600;
      color: #1e293b;
    }

    .request-card.warning .request-value {
      color: #dc2626;
    }

    .request-label {
      font-size: 0.8125rem;
      color: #64748b;
      margin-top: 0.25rem;
    }

    /* Sessions */
    .sessions-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      max-width: 500px;
    }

    .session-stat {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
    }

    .session-icon {
      width: 3rem;
      height: 3rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.75rem;
    }

    .session-icon.users {
      background: #dbeafe;
      color: #3b82f6;
    }

    .session-icon.sessions {
      background: #dcfce7;
      color: #16a34a;
    }

    .session-icon svg {
      width: 1.5rem;
      height: 1.5rem;
    }

    .session-content {
      display: flex;
      flex-direction: column;
    }

    .session-value {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
    }

    .session-label {
      font-size: 0.75rem;
      color: #64748b;
    }

    /* Alerts */
    .alerts-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .alert-card {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
    }

    .alert-card.critical {
      border-color: #fca5a5;
      background: #fef2f2;
    }

    .alert-card.warning {
      border-color: #fcd34d;
      background: #fffbeb;
    }

    .alert-icon {
      width: 2.5rem;
      height: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .alert-card.critical .alert-icon {
      background: #dc2626;
      color: white;
    }

    .alert-card.warning .alert-icon {
      background: #d97706;
      color: white;
    }

    .alert-icon svg {
      width: 1.25rem;
      height: 1.25rem;
    }

    .alert-content {
      flex: 1;
    }

    .alert-content h4 {
      margin: 0 0 0.25rem;
      font-size: 0.9375rem;
      font-weight: 600;
      color: #1e293b;
    }

    .alert-content p {
      margin: 0 0 0.5rem;
      font-size: 0.8125rem;
      color: #475569;
    }

    .alert-time {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .btn-dismiss {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.75rem;
      height: 1.75rem;
      padding: 0;
      border: none;
      background: transparent;
      color: #94a3b8;
      border-radius: 0.375rem;
      cursor: pointer;
    }

    .btn-dismiss:hover {
      background: #f1f5f9;
      color: #64748b;
    }

    .btn-dismiss svg {
      width: 1rem;
      height: 1rem;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        align-items: stretch;
      }

      .header-actions {
        justify-content: space-between;
      }

      .request-cards {
        grid-template-columns: repeat(2, 1fr);
      }

      .sessions-grid {
        grid-template-columns: 1fr;
        max-width: none;
      }
    }
  `]
})
export class SystemMonitorComponent implements OnInit, OnDestroy {
  private adminService = inject(AdminService);
  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  lastUpdated = signal(new Date());
  alerts = signal<Array<{ id: string; severity: string; title: string; message: string; timestamp: Date }>>([
    {
      id: '1',
      severity: 'warning',
      title: 'High Memory Usage',
      message: 'Memory usage has exceeded 80% threshold on the application server.',
      timestamp: new Date(Date.now() - 1800000)
    }
  ]);

  health = computed(() => this.adminService.systemHealth());
  metrics = computed(() => this.health().metrics);

  ngOnInit(): void {
    // Auto-refresh every 30 seconds
    this.refreshInterval = setInterval(() => {
      this.refresh();
    }, 30000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  refresh(): void {
    this.lastUpdated.set(new Date());
    console.log('Refreshing system metrics...');
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
  }

  formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  formatBytes(bytes: number): string {
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) {
      return `${gb.toFixed(1)} GB`;
    }
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)} MB`;
  }

  getGaugeColor(percentage: number): string {
    if (percentage >= 90) return '#dc2626';
    if (percentage >= 70) return '#d97706';
    return '#3b82f6';
  }

  getGaugeDashArray(percentage: number): string {
    const circumference = 2 * Math.PI * 50;
    const filled = (percentage / 100) * circumference;
    return `${filled} ${circumference}`;
  }

  dismissAlert(id: string): void {
    this.alerts.update(alerts => alerts.filter(a => a.id !== id));
  }
}
