import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ReportsService } from '../data-access/services/reports.service';

interface DashboardWidget {
  id: string;
  title: string;
  type: 'metric' | 'chart' | 'table' | 'list' | 'gauge' | 'map';
  size: 'small' | 'medium' | 'large' | 'full';
  position: { row: number; col: number };
  config: any;
  data?: any;
}

interface Dashboard {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface MetricData {
  value: number;
  label: string;
  change?: number;
  changeLabel?: string;
  trend?: 'up' | 'down' | 'flat';
  format?: 'number' | 'currency' | 'percent';
  icon?: string;
  color?: string;
}

interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'donut' | 'area' | 'scatter';
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
}

interface TableData {
  columns: { key: string; label: string; format?: string }[];
  rows: any[];
}

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="analytics-dashboard">
      <header class="page-header">
        <div class="header-content">
          <div class="header-title">
            <h1>Analytics Dashboard</h1>
            <div class="dashboard-selector">
              <select 
                [value]="selectedDashboard()?.id"
                (change)="selectDashboard($any($event.target).value)">
                @for (dashboard of dashboards(); track dashboard.id) {
                  <option [value]="dashboard.id">{{ dashboard.name }}</option>
                }
              </select>
              <button class="btn btn-icon" title="Dashboard Settings" (click)="showDashboardSettings.set(true)">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </button>
            </div>
          </div>
          <p class="subtitle">{{ selectedDashboard()?.description }}</p>
        </div>
        <div class="header-actions">
          <div class="date-range-selector">
            <button 
              class="range-btn"
              [class.active]="dateRange() === 'today'"
              (click)="setDateRange('today')">Today</button>
            <button 
              class="range-btn"
              [class.active]="dateRange() === 'week'"
              (click)="setDateRange('week')">This Week</button>
            <button 
              class="range-btn"
              [class.active]="dateRange() === 'month'"
              (click)="setDateRange('month')">This Month</button>
            <button 
              class="range-btn"
              [class.active]="dateRange() === 'quarter'"
              (click)="setDateRange('quarter')">This Quarter</button>
            <button 
              class="range-btn"
              [class.active]="dateRange() === 'year'"
              (click)="setDateRange('year')">This Year</button>
            <button 
              class="range-btn"
              [class.active]="dateRange() === 'custom'"
              (click)="showCustomDateRange.set(true)">Custom</button>
          </div>
          <button class="btn btn-secondary" (click)="refreshDashboard()">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Refresh
          </button>
          <button class="btn btn-primary" (click)="showAddWidget.set(true)">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Widget
          </button>
        </div>
      </header>

      <!-- Quick Stats Bar -->
      <div class="quick-stats">
        @for (stat of quickStats(); track stat.label) {
          <div class="quick-stat" [class]="'stat-' + stat.color">
            <div class="stat-icon" [innerHTML]="stat.icon"></div>
            <div class="stat-content">
              <span class="stat-value">{{ formatValue(stat.value, stat.format) }}</span>
              <span class="stat-label">{{ stat.label }}</span>
            </div>
            @if (stat.change !== undefined) {
              <div class="stat-change" [class.positive]="stat.trend === 'up'" [class.negative]="stat.trend === 'down'">
                @if (stat.trend === 'up') {
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                    <polyline points="17 6 23 6 23 12"/>
                  </svg>
                } @else if (stat.trend === 'down') {
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
                    <polyline points="17 18 23 18 23 12"/>
                  </svg>
                }
                {{ stat.change > 0 ? '+' : '' }}{{ stat.change }}%
              </div>
            }
          </div>
        }
      </div>

      <!-- Dashboard Grid -->
      <div class="dashboard-grid">
        @for (widget of currentWidgets(); track widget.id) {
          <div 
            class="widget"
            [class]="'widget-' + widget.size"
            [attr.data-widget-id]="widget.id">
            <div class="widget-header">
              <h3>{{ widget.title }}</h3>
              <div class="widget-actions">
                <button class="widget-btn" title="Refresh" (click)="refreshWidget(widget.id)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="23 4 23 10 17 10"/>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                  </svg>
                </button>
                <button class="widget-btn" title="Settings" (click)="editWidget(widget)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                </button>
                <button class="widget-btn" title="Remove" (click)="removeWidget(widget.id)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>
            <div class="widget-content">
              @switch (widget.type) {
                @case ('metric') {
                  <div class="metric-widget">
                    @if (widget.data) {
                      <div class="metric-value" [style.color]="widget.data.color">
                        {{ formatValue(widget.data.value, widget.data.format) }}
                      </div>
                      <div class="metric-label">{{ widget.data.label }}</div>
                      @if (widget.data.change !== undefined) {
                        <div class="metric-change" [class.positive]="widget.data.trend === 'up'" [class.negative]="widget.data.trend === 'down'">
                          @if (widget.data.trend === 'up') {
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                            </svg>
                          } @else if (widget.data.trend === 'down') {
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
                            </svg>
                          }
                          {{ widget.data.change > 0 ? '+' : '' }}{{ widget.data.change }}% {{ widget.data.changeLabel }}
                        </div>
                      }
                    }
                  </div>
                }
                @case ('gauge') {
                  <div class="gauge-widget">
                    @if (widget.data) {
                      <svg viewBox="0 0 200 120" class="gauge-svg">
                        <path 
                          d="M 20 100 A 80 80 0 0 1 180 100" 
                          fill="none" 
                          stroke="#e2e8f0" 
                          stroke-width="20"
                          stroke-linecap="round"/>
                        <path 
                          d="M 20 100 A 80 80 0 0 1 180 100" 
                          fill="none" 
                          [attr.stroke]="getGaugeColor(widget.data.value, widget.data.target)"
                          stroke-width="20"
                          stroke-linecap="round"
                          [attr.stroke-dasharray]="getGaugeDashArray(widget.data.value)"
                          [attr.stroke-dashoffset]="0"/>
                        <text x="100" y="90" text-anchor="middle" class="gauge-value">
                          {{ widget.data.value }}{{ widget.data.unit || '%' }}
                        </text>
                        <text x="100" y="110" text-anchor="middle" class="gauge-label">
                          {{ widget.data.label }}
                        </text>
                      </svg>
                      <div class="gauge-target">Target: {{ widget.data.target }}{{ widget.data.unit || '%' }}</div>
                    }
                  </div>
                }
                @case ('chart') {
                  <div class="chart-widget">
                    @if (widget.data) {
                      @switch (widget.data.type) {
                        @case ('line') {
                          <svg viewBox="0 0 400 200" class="line-chart">
                            <!-- Grid lines -->
                            @for (i of [0, 1, 2, 3, 4]; track i) {
                              <line 
                                [attr.x1]="40" 
                                [attr.y1]="20 + i * 40" 
                                [attr.x2]="380" 
                                [attr.y2]="20 + i * 40" 
                                stroke="#e2e8f0" 
                                stroke-dasharray="4"/>
                            }
                            <!-- Data lines -->
                            @for (dataset of widget.data.datasets; track dataset.label; let idx = $index) {
                              <polyline 
                                [attr.points]="getLinePoints(dataset.data, widget.data.labels.length)"
                                fill="none"
                                [attr.stroke]="dataset.color || getChartColor(idx)"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"/>
                              <!-- Data points -->
                              @for (point of dataset.data; track $index; let pIdx = $index) {
                                <circle 
                                  [attr.cx]="40 + (pIdx * 340 / (widget.data.labels.length - 1))"
                                  [attr.cy]="180 - (point / getMaxValue(widget.data.datasets) * 160)"
                                  r="4"
                                  [attr.fill]="dataset.color || getChartColor(idx)"/>
                              }
                            }
                            <!-- X-axis labels -->
                            @for (label of widget.data.labels; track $index; let lIdx = $index) {
                              <text 
                                [attr.x]="40 + (lIdx * 340 / (widget.data.labels.length - 1))"
                                y="198"
                                text-anchor="middle"
                                class="chart-label">{{ label }}</text>
                            }
                          </svg>
                          <div class="chart-legend">
                            @for (dataset of widget.data.datasets; track dataset.label; let idx = $index) {
                              <div class="legend-item">
                                <span class="legend-color" [style.background]="dataset.color || getChartColor(idx)"></span>
                                {{ dataset.label }}
                              </div>
                            }
                          </div>
                        }
                        @case ('bar') {
                          <svg viewBox="0 0 400 200" class="bar-chart">
                            <!-- Grid lines -->
                            @for (i of [0, 1, 2, 3, 4]; track i) {
                              <line 
                                [attr.x1]="40" 
                                [attr.y1]="20 + i * 40" 
                                [attr.x2]="380" 
                                [attr.y2]="20 + i * 40" 
                                stroke="#e2e8f0" 
                                stroke-dasharray="4"/>
                            }
                            <!-- Bars -->
                            @for (label of widget.data.labels; track $index; let lIdx = $index) {
                              @for (dataset of widget.data.datasets; track dataset.label; let dIdx = $index) {
                                <rect 
                                  [attr.x]="getBarX(lIdx, dIdx, widget.data.labels.length, widget.data.datasets.length)"
                                  [attr.y]="180 - (dataset.data[lIdx] / getMaxValue(widget.data.datasets) * 160)"
                                  [attr.width]="getBarWidth(widget.data.labels.length, widget.data.datasets.length)"
                                  [attr.height]="dataset.data[lIdx] / getMaxValue(widget.data.datasets) * 160"
                                  [attr.fill]="dataset.color || getChartColor(dIdx)"
                                  rx="2"/>
                              }
                            }
                            <!-- X-axis labels -->
                            @for (label of widget.data.labels; track $index; let lIdx = $index) {
                              <text 
                                [attr.x]="40 + (lIdx * 340 / widget.data.labels.length) + (340 / widget.data.labels.length / 2)"
                                y="198"
                                text-anchor="middle"
                                class="chart-label">{{ label }}</text>
                            }
                          </svg>
                          <div class="chart-legend">
                            @for (dataset of widget.data.datasets; track dataset.label; let idx = $index) {
                              <div class="legend-item">
                                <span class="legend-color" [style.background]="dataset.color || getChartColor(idx)"></span>
                                {{ dataset.label }}
                              </div>
                            }
                          </div>
                        }
                        @case ('donut') {
                          <div class="donut-container">
                            <svg viewBox="0 0 200 200" class="donut-chart">
                              @for (segment of getDonutSegments(widget.data); track $index; let idx = $index) {
                                <circle 
                                  cx="100" 
                                  cy="100" 
                                  r="70"
                                  fill="none"
                                  [attr.stroke]="segment.color"
                                  stroke-width="30"
                                  [attr.stroke-dasharray]="segment.dashArray"
                                  [attr.stroke-dashoffset]="segment.offset"
                                  transform="rotate(-90 100 100)"/>
                              }
                              <text x="100" y="95" text-anchor="middle" class="donut-total">
                                {{ getTotalValue(widget.data.datasets[0].data) | number }}
                              </text>
                              <text x="100" y="115" text-anchor="middle" class="donut-label">Total</text>
                            </svg>
                            <div class="donut-legend">
                              @for (label of widget.data.labels; track $index; let idx = $index) {
                                <div class="legend-item">
                                  <span class="legend-color" [style.background]="getChartColor(idx)"></span>
                                  {{ label }}: {{ widget.data.datasets[0].data[idx] | number }}
                                </div>
                              }
                            </div>
                          </div>
                        }
                        @case ('area') {
                          <svg viewBox="0 0 400 200" class="area-chart">
                            <defs>
                              @for (dataset of widget.data.datasets; track dataset.label; let idx = $index) {
                                <linearGradient [attr.id]="'areaGradient' + idx" x1="0" x2="0" y1="0" y2="1">
                                  <stop offset="0%" [attr.stop-color]="dataset.color || getChartColor(idx)" stop-opacity="0.3"/>
                                  <stop offset="100%" [attr.stop-color]="dataset.color || getChartColor(idx)" stop-opacity="0"/>
                                </linearGradient>
                              }
                            </defs>
                            <!-- Grid lines -->
                            @for (i of [0, 1, 2, 3, 4]; track i) {
                              <line 
                                [attr.x1]="40" 
                                [attr.y1]="20 + i * 40" 
                                [attr.x2]="380" 
                                [attr.y2]="20 + i * 40" 
                                stroke="#e2e8f0" 
                                stroke-dasharray="4"/>
                            }
                            <!-- Area fills -->
                            @for (dataset of widget.data.datasets; track dataset.label; let idx = $index) {
                              <path 
                                [attr.d]="getAreaPath(dataset.data, widget.data.labels.length)"
                                [attr.fill]="'url(#areaGradient' + idx + ')'"/>
                              <polyline 
                                [attr.points]="getLinePoints(dataset.data, widget.data.labels.length)"
                                fill="none"
                                [attr.stroke]="dataset.color || getChartColor(idx)"
                                stroke-width="2"/>
                            }
                            <!-- X-axis labels -->
                            @for (label of widget.data.labels; track $index; let lIdx = $index) {
                              <text 
                                [attr.x]="40 + (lIdx * 340 / (widget.data.labels.length - 1))"
                                y="198"
                                text-anchor="middle"
                                class="chart-label">{{ label }}</text>
                            }
                          </svg>
                        }
                      }
                    }
                  </div>
                }
                @case ('table') {
                  <div class="table-widget">
                    @if (widget.data) {
                      <table class="data-table">
                        <thead>
                          <tr>
                            @for (col of widget.data.columns; track col.key) {
                              <th>{{ col.label }}</th>
                            }
                          </tr>
                        </thead>
                        <tbody>
                          @for (row of widget.data.rows; track $index) {
                            <tr>
                              @for (col of widget.data.columns; track col.key) {
                                <td [class]="col.format">
                                  {{ formatTableCell(row[col.key], col.format) }}
                                </td>
                              }
                            </tr>
                          }
                        </tbody>
                      </table>
                    }
                  </div>
                }
                @case ('list') {
                  <div class="list-widget">
                    @if (widget.data?.items) {
                      <ul class="widget-list">
                        @for (item of widget.data.items; track $index) {
                          <li class="list-item" [class]="item.status">
                            <div class="item-main">
                              @if (item.icon) {
                                <span class="item-icon" [innerHTML]="item.icon"></span>
                              }
                              <div class="item-content">
                                <span class="item-title">{{ item.title }}</span>
                                @if (item.subtitle) {
                                  <span class="item-subtitle">{{ item.subtitle }}</span>
                                }
                              </div>
                            </div>
                            <div class="item-value">
                              @if (item.value !== undefined) {
                                <span class="value">{{ formatValue(item.value, item.format) }}</span>
                              }
                              @if (item.badge) {
                                <span class="item-badge" [class]="item.badgeType">{{ item.badge }}</span>
                              }
                            </div>
                          </li>
                        }
                      </ul>
                    }
                  </div>
                }
              }
            </div>
          </div>
        }
      </div>

      <!-- Add Widget Modal -->
      @if (showAddWidget()) {
        <div class="modal-overlay" (click)="showAddWidget.set(false)">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Add Widget</h2>
              <button class="close-btn" (click)="showAddWidget.set(false)">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="widget-templates">
                <h3>Metrics</h3>
                <div class="template-grid">
                  @for (template of metricTemplates; track template.id) {
                    <button class="template-card" (click)="addWidget(template)">
                      <div class="template-icon" [innerHTML]="template.icon"></div>
                      <span class="template-name">{{ template.name }}</span>
                    </button>
                  }
                </div>

                <h3>Charts</h3>
                <div class="template-grid">
                  @for (template of chartTemplates; track template.id) {
                    <button class="template-card" (click)="addWidget(template)">
                      <div class="template-icon" [innerHTML]="template.icon"></div>
                      <span class="template-name">{{ template.name }}</span>
                    </button>
                  }
                </div>

                <h3>Tables & Lists</h3>
                <div class="template-grid">
                  @for (template of tableTemplates; track template.id) {
                    <button class="template-card" (click)="addWidget(template)">
                      <div class="template-icon" [innerHTML]="template.icon"></div>
                      <span class="template-name">{{ template.name }}</span>
                    </button>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Dashboard Settings Modal -->
      @if (showDashboardSettings()) {
        <div class="modal-overlay" (click)="showDashboardSettings.set(false)">
          <div class="modal modal-sm" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Dashboard Settings</h2>
              <button class="close-btn" (click)="showDashboardSettings.set(false)">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Dashboard Name</label>
                <input type="text" [value]="selectedDashboard()?.name" class="form-control">
              </div>
              <div class="form-group">
                <label>Description</label>
                <textarea class="form-control" rows="3">{{ selectedDashboard()?.description }}</textarea>
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" [checked]="selectedDashboard()?.isDefault">
                  Set as default dashboard
                </label>
              </div>
              <div class="form-group">
                <label>Auto-refresh Interval</label>
                <select class="form-control">
                  <option value="0">Manual refresh only</option>
                  <option value="60">Every minute</option>
                  <option value="300">Every 5 minutes</option>
                  <option value="900">Every 15 minutes</option>
                  <option value="1800">Every 30 minutes</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="showDashboardSettings.set(false)">Cancel</button>
              <button class="btn btn-danger" (click)="deleteDashboard()">Delete Dashboard</button>
              <button class="btn btn-primary" (click)="saveDashboardSettings()">Save Changes</button>
            </div>
          </div>
        </div>
      }

      <!-- Custom Date Range Modal -->
      @if (showCustomDateRange()) {
        <div class="modal-overlay" (click)="showCustomDateRange.set(false)">
          <div class="modal modal-sm" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Custom Date Range</h2>
              <button class="close-btn" (click)="showCustomDateRange.set(false)">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="date-range-form">
                <div class="form-group">
                  <label>Start Date</label>
                  <input type="date" class="form-control" [value]="customStartDate()">
                </div>
                <div class="form-group">
                  <label>End Date</label>
                  <input type="date" class="form-control" [value]="customEndDate()">
                </div>
              </div>
              <div class="quick-ranges">
                <button class="quick-range-btn" (click)="setQuickRange('last7')">Last 7 days</button>
                <button class="quick-range-btn" (click)="setQuickRange('last30')">Last 30 days</button>
                <button class="quick-range-btn" (click)="setQuickRange('last90')">Last 90 days</button>
                <button class="quick-range-btn" (click)="setQuickRange('lastYear')">Last year</button>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="showCustomDateRange.set(false)">Cancel</button>
              <button class="btn btn-primary" (click)="applyCustomDateRange()">Apply</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .analytics-dashboard {
      padding: 1.5rem;
      max-width: 1600px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .header-content h1 {
      font-size: 1.75rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 0.25rem 0;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .dashboard-selector {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .dashboard-selector select {
      padding: 0.375rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
      background: white;
    }

    .subtitle {
      color: #64748b;
      font-size: 0.875rem;
      margin: 0;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .date-range-selector {
      display: flex;
      background: #f1f5f9;
      border-radius: 8px;
      padding: 0.25rem;
    }

    .range-btn {
      padding: 0.5rem 0.75rem;
      border: none;
      background: transparent;
      font-size: 0.8125rem;
      color: #64748b;
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.2s;
    }

    .range-btn:hover {
      color: #1e293b;
    }

    .range-btn.active {
      background: white;
      color: #3b82f6;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .btn-secondary {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #e2e8f0;
    }

    .btn-secondary:hover {
      background: #e2e8f0;
    }

    .btn-danger {
      background: #ef4444;
      color: white;
    }

    .btn-danger:hover {
      background: #dc2626;
    }

    .btn-icon {
      padding: 0.5rem;
      background: transparent;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      color: #64748b;
      cursor: pointer;
    }

    .btn-icon:hover {
      background: #f1f5f9;
      color: #1e293b;
    }

    /* Quick Stats */
    .quick-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .quick-stat {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: white;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-icon svg {
      width: 24px;
      height: 24px;
    }

    .stat-blue .stat-icon { background: #dbeafe; color: #3b82f6; }
    .stat-green .stat-icon { background: #dcfce7; color: #22c55e; }
    .stat-purple .stat-icon { background: #ede9fe; color: #8b5cf6; }
    .stat-amber .stat-icon { background: #fef3c7; color: #f59e0b; }
    .stat-red .stat-icon { background: #fee2e2; color: #ef4444; }

    .stat-content {
      flex: 1;
      min-width: 0;
    }

    .stat-value {
      display: block;
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
      line-height: 1.2;
    }

    .stat-label {
      font-size: 0.8125rem;
      color: #64748b;
    }

    .stat-change {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
    }

    .stat-change.positive {
      background: #dcfce7;
      color: #16a34a;
    }

    .stat-change.negative {
      background: #fee2e2;
      color: #dc2626;
    }

    /* Dashboard Grid */
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 1rem;
    }

    .widget {
      background: white;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .widget-small {
      grid-column: span 3;
      min-height: 180px;
    }

    .widget-medium {
      grid-column: span 4;
      min-height: 280px;
    }

    .widget-large {
      grid-column: span 6;
      min-height: 350px;
    }

    .widget-full {
      grid-column: span 12;
      min-height: 400px;
    }

    .widget-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .widget-header h3 {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .widget-actions {
      display: flex;
      gap: 0.25rem;
    }

    .widget-btn {
      padding: 0.375rem;
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .widget-btn:hover {
      background: #f1f5f9;
      color: #64748b;
    }

    .widget-content {
      flex: 1;
      padding: 1rem 1.25rem;
      overflow: auto;
    }

    /* Metric Widget */
    .metric-widget {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
    }

    .metric-value {
      font-size: 2.5rem;
      font-weight: 700;
      color: #1e293b;
      line-height: 1;
    }

    .metric-label {
      font-size: 0.875rem;
      color: #64748b;
      margin-top: 0.5rem;
    }

    .metric-change {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      margin-top: 0.75rem;
    }

    .metric-change.positive { color: #16a34a; }
    .metric-change.negative { color: #dc2626; }

    /* Gauge Widget */
    .gauge-widget {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
    }

    .gauge-svg {
      width: 100%;
      max-width: 200px;
    }

    .gauge-value {
      font-size: 1.5rem;
      font-weight: 700;
      fill: #1e293b;
    }

    .gauge-label {
      font-size: 0.75rem;
      fill: #64748b;
    }

    .gauge-target {
      font-size: 0.8125rem;
      color: #64748b;
      margin-top: 0.5rem;
    }

    /* Chart Widgets */
    .chart-widget {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .line-chart, .bar-chart, .area-chart {
      width: 100%;
      flex: 1;
    }

    .chart-label {
      font-size: 10px;
      fill: #64748b;
    }

    .chart-legend {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-top: 1rem;
      flex-wrap: wrap;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      color: #64748b;
    }

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 3px;
    }

    /* Donut Chart */
    .donut-container {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      height: 100%;
    }

    .donut-chart {
      width: 150px;
      height: 150px;
      flex-shrink: 0;
    }

    .donut-total {
      font-size: 1.25rem;
      font-weight: 700;
      fill: #1e293b;
    }

    .donut-label {
      font-size: 0.75rem;
      fill: #64748b;
    }

    .donut-legend {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    /* Table Widget */
    .table-widget {
      overflow: auto;
      height: 100%;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
    }

    .data-table th {
      text-align: left;
      padding: 0.75rem 0.5rem;
      font-weight: 600;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
      white-space: nowrap;
    }

    .data-table td {
      padding: 0.625rem 0.5rem;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }

    .data-table td.currency {
      text-align: right;
      font-family: 'SF Mono', monospace;
    }

    .data-table td.number {
      text-align: right;
    }

    .data-table td.percent {
      text-align: right;
    }

    .data-table tr:hover {
      background: #f8fafc;
    }

    /* List Widget */
    .list-widget {
      height: 100%;
      overflow: auto;
    }

    .widget-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .list-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid #f1f5f9;
    }

    .list-item:last-child {
      border-bottom: none;
    }

    .item-main {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .item-icon {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
    }

    .item-content {
      display: flex;
      flex-direction: column;
    }

    .item-title {
      font-size: 0.875rem;
      font-weight: 500;
      color: #1e293b;
    }

    .item-subtitle {
      font-size: 0.75rem;
      color: #64748b;
    }

    .item-value {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .item-value .value {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1e293b;
    }

    .item-badge {
      font-size: 0.6875rem;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      font-weight: 500;
    }

    .item-badge.success { background: #dcfce7; color: #16a34a; }
    .item-badge.warning { background: #fef3c7; color: #d97706; }
    .item-badge.danger { background: #fee2e2; color: #dc2626; }
    .item-badge.info { background: #dbeafe; color: #2563eb; }

    /* Modals */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal {
      background: white;
      border-radius: 12px;
      width: 100%;
      max-width: 700px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .modal-sm {
      max-width: 450px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .modal-header h2 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 4px;
    }

    .close-btn:hover {
      background: #f1f5f9;
      color: #1e293b;
    }

    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid #e2e8f0;
    }

    /* Widget Templates */
    .widget-templates h3 {
      font-size: 0.875rem;
      font-weight: 600;
      color: #64748b;
      margin: 0 0 0.75rem 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .widget-templates h3:not(:first-child) {
      margin-top: 1.5rem;
    }

    .template-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 0.75rem;
    }

    .template-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .template-card:hover {
      background: #f1f5f9;
      border-color: #3b82f6;
    }

    .template-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #3b82f6;
    }

    .template-name {
      font-size: 0.75rem;
      color: #475569;
      text-align: center;
    }

    /* Form Elements */
    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.375rem;
    }

    .form-control {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
    }

    .form-control:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    textarea.form-control {
      resize: vertical;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    /* Date Range Form */
    .date-range-form {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .quick-ranges {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }

    .quick-range-btn {
      padding: 0.375rem 0.75rem;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 0.8125rem;
      color: #475569;
      cursor: pointer;
    }

    .quick-range-btn:hover {
      background: #e2e8f0;
      color: #1e293b;
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .widget-small { grid-column: span 4; }
      .widget-medium { grid-column: span 6; }
      .widget-large { grid-column: span 12; }
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
      }

      .header-actions {
        width: 100%;
        justify-content: flex-start;
      }

      .date-range-selector {
        flex-wrap: wrap;
      }

      .widget-small,
      .widget-medium {
        grid-column: span 12;
      }

      .quick-stats {
        grid-template-columns: 1fr;
      }

      .donut-container {
        flex-direction: column;
      }
    }
  `]
})
export class AnalyticsDashboardComponent implements OnInit {
  private reportsService = inject(ReportsService);

  // State
  dashboards = signal<Dashboard[]>([]);
  selectedDashboard = signal<Dashboard | null>(null);
  dateRange = signal<'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'>('month');
  customStartDate = signal('');
  customEndDate = signal('');
  showAddWidget = signal(false);
  showDashboardSettings = signal(false);
  showCustomDateRange = signal(false);

  // Current widgets from selected dashboard
  currentWidgets = computed(() => this.selectedDashboard()?.widgets || []);

  // Quick stats
  quickStats = signal<MetricData[]>([]);

  // Widget templates
  metricTemplates = [
    { id: 'total-patients', name: 'Total Patients', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
    { id: 'appointments-today', name: 'Today\'s Appointments', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' },
    { id: 'revenue-mtd', name: 'Revenue MTD', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' },
    { id: 'collection-rate', name: 'Collection Rate', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>' },
    { id: 'care-gaps', name: 'Care Gaps', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' },
    { id: 'quality-score', name: 'Quality Score', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>' }
  ];

  chartTemplates = [
    { id: 'revenue-trend', name: 'Revenue Trend', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>' },
    { id: 'patient-volume', name: 'Patient Volume', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>' },
    { id: 'payer-mix', name: 'Payer Mix', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>' },
    { id: 'appointment-types', name: 'Appointment Types', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>' },
    { id: 'quality-trends', name: 'Quality Trends', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>' },
    { id: 'aging-buckets', name: 'A/R Aging', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' }
  ];

  tableTemplates = [
    { id: 'top-providers', name: 'Top Providers', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
    { id: 'pending-claims', name: 'Pending Claims', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>' },
    { id: 'recent-encounters', name: 'Recent Encounters', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' },
    { id: 'appointments-list', name: 'Upcoming Appointments', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>' }
  ];

  // Chart colors
  chartColors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

  ngOnInit() {
    this.loadDashboards();
    this.loadQuickStats();
  }

  loadDashboards() {
    // Mock dashboards
    const mockDashboards: Dashboard[] = [
      {
        id: 'executive',
        name: 'Executive Overview',
        description: 'High-level metrics for practice leadership',
        isDefault: true,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date(),
        widgets: this.generateExecutiveWidgets()
      },
      {
        id: 'clinical',
        name: 'Clinical Dashboard',
        description: 'Patient care and quality metrics',
        isDefault: false,
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date(),
        widgets: this.generateClinicalWidgets()
      },
      {
        id: 'financial',
        name: 'Financial Dashboard',
        description: 'Revenue, collections, and billing metrics',
        isDefault: false,
        createdAt: new Date('2024-02-15'),
        updatedAt: new Date(),
        widgets: this.generateFinancialWidgets()
      }
    ];

    this.dashboards.set(mockDashboards);
    this.selectedDashboard.set(mockDashboards[0]);
  }

  loadQuickStats() {
    this.quickStats.set([
      {
        value: 2847,
        label: 'Active Patients',
        change: 5.2,
        changeLabel: 'vs last month',
        trend: 'up',
        format: 'number',
        color: 'blue',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
      },
      {
        value: 485230,
        label: 'Revenue MTD',
        change: 8.7,
        changeLabel: 'vs last month',
        trend: 'up',
        format: 'currency',
        color: 'green',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>'
      },
      {
        value: 94.2,
        label: 'Collection Rate',
        change: 1.5,
        changeLabel: 'vs last quarter',
        trend: 'up',
        format: 'percent',
        color: 'purple',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>'
      },
      {
        value: 87,
        label: 'Quality Score',
        change: -2.1,
        changeLabel: 'vs last quarter',
        trend: 'down',
        format: 'number',
        color: 'amber',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>'
      },
      {
        value: 156,
        label: 'Care Gaps',
        change: 12,
        changeLabel: 'need attention',
        trend: 'down',
        format: 'number',
        color: 'red',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
      }
    ]);
  }

  generateExecutiveWidgets(): DashboardWidget[] {
    return [
      {
        id: 'exec-revenue',
        title: 'Revenue Trend',
        type: 'chart',
        size: 'large',
        position: { row: 0, col: 0 },
        config: {},
        data: {
          type: 'area',
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [
            { label: 'Revenue', data: [420000, 445000, 462000, 478000, 495000, 512000], color: '#3b82f6' },
            { label: 'Collections', data: [395000, 418000, 435000, 452000, 468000, 485000], color: '#22c55e' }
          ]
        }
      },
      {
        id: 'exec-payer',
        title: 'Payer Mix',
        type: 'chart',
        size: 'medium',
        position: { row: 0, col: 6 },
        config: {},
        data: {
          type: 'donut',
          labels: ['Commercial', 'Medicare', 'Medicaid', 'Self-Pay'],
          datasets: [{ label: 'Payer Mix', data: [245000, 156000, 78000, 36000] }]
        }
      },
      {
        id: 'exec-quality',
        title: 'Quality Score',
        type: 'gauge',
        size: 'small',
        position: { row: 1, col: 0 },
        config: {},
        data: { value: 87, target: 90, label: 'Overall Score' }
      },
      {
        id: 'exec-collection',
        title: 'Collection Rate',
        type: 'gauge',
        size: 'small',
        position: { row: 1, col: 3 },
        config: {},
        data: { value: 94, target: 95, label: 'Collection Rate' }
      },
      {
        id: 'exec-providers',
        title: 'Provider Performance',
        type: 'table',
        size: 'large',
        position: { row: 1, col: 6 },
        config: {},
        data: {
          columns: [
            { key: 'provider', label: 'Provider' },
            { key: 'encounters', label: 'Encounters', format: 'number' },
            { key: 'revenue', label: 'Revenue', format: 'currency' },
            { key: 'quality', label: 'Quality', format: 'percent' }
          ],
          rows: [
            { provider: 'Dr. Sarah Wilson', encounters: 345, revenue: 125000, quality: 92 },
            { provider: 'Dr. Michael Chen', encounters: 312, revenue: 118000, quality: 88 },
            { provider: 'Dr. Emily Brown', encounters: 289, revenue: 105000, quality: 91 },
            { provider: 'Dr. James Miller', encounters: 256, revenue: 98000, quality: 85 },
            { provider: 'Dr. Lisa Anderson', encounters: 234, revenue: 89000, quality: 90 }
          ]
        }
      },
      {
        id: 'exec-alerts',
        title: 'Action Items',
        type: 'list',
        size: 'medium',
        position: { row: 2, col: 0 },
        config: {},
        data: {
          items: [
            { title: '15 claims pending > 30 days', subtitle: 'Requires follow-up', badge: 'High', badgeType: 'danger' },
            { title: '8 care gaps overdue', subtitle: 'Patient outreach needed', badge: 'Medium', badgeType: 'warning' },
            { title: 'Quality measure NQF-0059 below target', subtitle: 'Diabetes HbA1c', badge: 'Action', badgeType: 'info' },
            { title: '3 prior auth requests pending', subtitle: 'Awaiting payer response', badge: 'Low', badgeType: 'success' }
          ]
        }
      }
    ];
  }

  generateClinicalWidgets(): DashboardWidget[] {
    return [
      {
        id: 'clinical-volume',
        title: 'Patient Volume',
        type: 'chart',
        size: 'large',
        position: { row: 0, col: 0 },
        config: {},
        data: {
          type: 'bar',
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          datasets: [
            { label: 'New Patients', data: [12, 15, 18, 14, 16], color: '#3b82f6' },
            { label: 'Follow-ups', data: [45, 52, 48, 55, 42], color: '#22c55e' }
          ]
        }
      },
      {
        id: 'clinical-quality',
        title: 'Quality Measures Performance',
        type: 'chart',
        size: 'large',
        position: { row: 0, col: 6 },
        config: {},
        data: {
          type: 'line',
          labels: ['Q1', 'Q2', 'Q3', 'Q4'],
          datasets: [
            { label: 'Preventive Care', data: [82, 85, 88, 91], color: '#3b82f6' },
            { label: 'Chronic Disease', data: [78, 80, 83, 86], color: '#22c55e' },
            { label: 'Behavioral Health', data: [75, 78, 76, 80], color: '#f59e0b' }
          ]
        }
      },
      {
        id: 'clinical-gaps',
        title: 'Care Gaps by Category',
        type: 'chart',
        size: 'medium',
        position: { row: 1, col: 0 },
        config: {},
        data: {
          type: 'donut',
          labels: ['Screenings', 'Immunizations', 'Follow-ups', 'Lab Tests'],
          datasets: [{ label: 'Care Gaps', data: [45, 32, 28, 51] }]
        }
      },
      {
        id: 'clinical-encounters',
        title: 'Recent Encounters',
        type: 'list',
        size: 'medium',
        position: { row: 1, col: 4 },
        config: {},
        data: {
          items: [
            { title: 'John Smith', subtitle: 'Annual Physical - Dr. Wilson', value: '9:30 AM', format: 'text' },
            { title: 'Mary Johnson', subtitle: 'Follow-up Visit - Dr. Chen', value: '10:15 AM', format: 'text' },
            { title: 'Robert Davis', subtitle: 'Sick Visit - Dr. Brown', value: '11:00 AM', format: 'text' },
            { title: 'Jennifer Lee', subtitle: 'New Patient - Dr. Miller', value: '11:45 AM', format: 'text' },
            { title: 'William Taylor', subtitle: 'Chronic Care - Dr. Anderson', value: '1:30 PM', format: 'text' }
          ]
        }
      }
    ];
  }

  generateFinancialWidgets(): DashboardWidget[] {
    return [
      {
        id: 'fin-revenue',
        title: 'Revenue vs Collections',
        type: 'chart',
        size: 'large',
        position: { row: 0, col: 0 },
        config: {},
        data: {
          type: 'bar',
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [
            { label: 'Charges', data: [520000, 545000, 562000, 578000, 595000, 612000], color: '#3b82f6' },
            { label: 'Collections', data: [395000, 418000, 435000, 452000, 468000, 485000], color: '#22c55e' }
          ]
        }
      },
      {
        id: 'fin-aging',
        title: 'A/R Aging',
        type: 'chart',
        size: 'medium',
        position: { row: 0, col: 6 },
        config: {},
        data: {
          type: 'donut',
          labels: ['Current', '1-30', '31-60', '61-90', '90+'],
          datasets: [{ label: 'A/R Aging', data: [125000, 85000, 45000, 28000, 17000] }]
        }
      },
      {
        id: 'fin-collection-rate',
        title: 'Collection Rate',
        type: 'metric',
        size: 'small',
        position: { row: 1, col: 0 },
        config: {},
        data: { value: 94.2, label: 'Current Rate', change: 1.5, trend: 'up', format: 'percent', changeLabel: 'vs last month' }
      },
      {
        id: 'fin-days-ar',
        title: 'Days in A/R',
        type: 'metric',
        size: 'small',
        position: { row: 1, col: 3 },
        config: {},
        data: { value: 32, label: 'Average', change: -3, trend: 'up', format: 'number', changeLabel: 'vs last month' }
      },
      {
        id: 'fin-denials',
        title: 'Denial Rate',
        type: 'metric',
        size: 'small',
        position: { row: 1, col: 6 },
        config: {},
        data: { value: 4.8, label: 'Current Rate', change: -0.5, trend: 'up', format: 'percent', changeLabel: 'vs last month' }
      },
      {
        id: 'fin-claims',
        title: 'Pending Claims',
        type: 'table',
        size: 'large',
        position: { row: 2, col: 0 },
        config: {},
        data: {
          columns: [
            { key: 'claimId', label: 'Claim #' },
            { key: 'patient', label: 'Patient' },
            { key: 'payer', label: 'Payer' },
            { key: 'amount', label: 'Amount', format: 'currency' },
            { key: 'age', label: 'Age (days)', format: 'number' }
          ],
          rows: [
            { claimId: 'CLM-2024-4521', patient: 'John Smith', payer: 'Blue Cross', amount: 1250, age: 45 },
            { claimId: 'CLM-2024-4498', patient: 'Mary Johnson', payer: 'Aetna', amount: 890, age: 38 },
            { claimId: 'CLM-2024-4475', patient: 'Robert Davis', payer: 'Medicare', amount: 2100, age: 35 },
            { claimId: 'CLM-2024-4452', patient: 'Jennifer Lee', payer: 'United Health', amount: 675, age: 32 }
          ]
        }
      }
    ];
  }

  selectDashboard(dashboardId: string) {
    const dashboard = this.dashboards().find(d => d.id === dashboardId);
    if (dashboard) {
      this.selectedDashboard.set(dashboard);
    }
  }

  setDateRange(range: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom') {
    this.dateRange.set(range);
    if (range !== 'custom') {
      this.refreshDashboard();
    }
  }

  setQuickRange(range: string) {
    const today = new Date();
    let startDate = new Date();

    switch (range) {
      case 'last7':
        startDate.setDate(today.getDate() - 7);
        break;
      case 'last30':
        startDate.setDate(today.getDate() - 30);
        break;
      case 'last90':
        startDate.setDate(today.getDate() - 90);
        break;
      case 'lastYear':
        startDate.setFullYear(today.getFullYear() - 1);
        break;
    }

    this.customStartDate.set(startDate.toISOString().split('T')[0]);
    this.customEndDate.set(today.toISOString().split('T')[0]);
  }

  applyCustomDateRange() {
    this.dateRange.set('custom');
    this.showCustomDateRange.set(false);
    this.refreshDashboard();
  }

  refreshDashboard() {
    // Simulate refresh - in real app would reload data
    console.log('Refreshing dashboard with date range:', this.dateRange());
  }

  refreshWidget(widgetId: string) {
    console.log('Refreshing widget:', widgetId);
  }

  editWidget(widget: DashboardWidget) {
    console.log('Edit widget:', widget);
  }

  removeWidget(widgetId: string) {
    const dashboard = this.selectedDashboard();
    if (dashboard) {
      dashboard.widgets = dashboard.widgets.filter(w => w.id !== widgetId);
      this.selectedDashboard.set({ ...dashboard });
    }
  }

  addWidget(template: any) {
    const dashboard = this.selectedDashboard();
    if (dashboard) {
      const newWidget: DashboardWidget = {
        id: `widget-${Date.now()}`,
        title: template.name,
        type: template.id.includes('trend') || template.id.includes('volume') || template.id.includes('mix') ? 'chart' : 
              template.id.includes('providers') || template.id.includes('claims') ? 'table' : 'metric',
        size: 'medium',
        position: { row: 0, col: 0 },
        config: {},
        data: this.generateWidgetData(template.id)
      };
      dashboard.widgets.push(newWidget);
      this.selectedDashboard.set({ ...dashboard });
    }
    this.showAddWidget.set(false);
  }

  generateWidgetData(templateId: string): any {
    // Generate mock data based on template type
    switch (templateId) {
      case 'revenue-trend':
        return {
          type: 'line',
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{ label: 'Revenue', data: [420000, 445000, 462000, 478000, 495000, 512000], color: '#3b82f6' }]
        };
      case 'patient-volume':
        return {
          type: 'bar',
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          datasets: [{ label: 'Patients', data: [45, 52, 48, 55, 42], color: '#22c55e' }]
        };
      default:
        return { value: 100, label: 'Metric', format: 'number' };
    }
  }

  saveDashboardSettings() {
    this.showDashboardSettings.set(false);
  }

  deleteDashboard() {
    const dashboard = this.selectedDashboard();
    if (dashboard && !dashboard.isDefault) {
      this.dashboards.update(d => d.filter(db => db.id !== dashboard.id));
      this.selectedDashboard.set(this.dashboards()[0]);
    }
    this.showDashboardSettings.set(false);
  }

  // Formatting helpers
  formatValue(value: number, format?: string): string {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
      case 'percent':
        return `${value}%`;
      case 'number':
      default:
        return new Intl.NumberFormat('en-US').format(value);
    }
  }

  formatTableCell(value: any, format?: string): string {
    if (value === null || value === undefined) return '-';
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
      case 'percent':
        return `${value}%`;
      case 'number':
        return new Intl.NumberFormat('en-US').format(value);
      default:
        return String(value);
    }
  }

  // Chart helpers
  getChartColor(index: number): string {
    return this.chartColors[index % this.chartColors.length];
  }

  getMaxValue(datasets: { data: number[] }[]): number {
    return Math.max(...datasets.flatMap(d => d.data)) * 1.1;
  }

  getLinePoints(data: number[], labelCount: number): string {
    const maxVal = Math.max(...data) * 1.1;
    return data.map((val, i) => {
      const x = 40 + (i * 340 / (labelCount - 1));
      const y = 180 - (val / maxVal * 160);
      return `${x},${y}`;
    }).join(' ');
  }

  getAreaPath(data: number[], labelCount: number): string {
    const maxVal = Math.max(...data) * 1.1;
    let path = `M 40 180`;
    data.forEach((val, i) => {
      const x = 40 + (i * 340 / (labelCount - 1));
      const y = 180 - (val / maxVal * 160);
      path += ` L ${x} ${y}`;
    });
    path += ` L ${40 + 340} 180 Z`;
    return path;
  }

  getBarX(labelIdx: number, datasetIdx: number, labelCount: number, datasetCount: number): number {
    const groupWidth = 340 / labelCount;
    const barWidth = (groupWidth * 0.8) / datasetCount;
    const groupStart = 40 + (labelIdx * groupWidth) + (groupWidth * 0.1);
    return groupStart + (datasetIdx * barWidth);
  }

  getBarWidth(labelCount: number, datasetCount: number): number {
    const groupWidth = 340 / labelCount;
    return (groupWidth * 0.8) / datasetCount - 2;
  }

  getDonutSegments(chartData: ChartData): { color: string; dashArray: string; offset: number }[] {
    const data = chartData.datasets[0].data;
    const total = data.reduce((a, b) => a + b, 0);
    const circumference = 2 * Math.PI * 70;
    let currentOffset = 0;

    return data.map((val, i) => {
      const percent = val / total;
      const dashLength = circumference * percent;
      const segment = {
        color: this.getChartColor(i),
        dashArray: `${dashLength} ${circumference - dashLength}`,
        offset: -currentOffset
      };
      currentOffset += dashLength;
      return segment;
    });
  }

  getTotalValue(data: number[]): number {
    return data.reduce((a, b) => a + b, 0);
  }

  // Gauge helpers
  getGaugeColor(value: number, target: number): string {
    const ratio = value / target;
    if (ratio >= 1) return '#22c55e';
    if (ratio >= 0.9) return '#f59e0b';
    return '#ef4444';
  }

  getGaugeDashArray(value: number): string {
    const maxArc = Math.PI * 80; // Semi-circle arc length
    const arcLength = (value / 100) * maxArc;
    return `${arcLength} ${maxArc}`;
  }
}
