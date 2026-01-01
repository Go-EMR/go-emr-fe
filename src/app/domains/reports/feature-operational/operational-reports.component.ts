import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ReportsService } from '../data-access/services/reports.service';

interface AppointmentMetric {
  date: string;
  scheduled: number;
  completed: number;
  noShow: number;
  cancelled: number;
  rescheduled: number;
  showRate: number;
  avgWaitTime: number;
}

interface ProviderProductivity {
  providerId: string;
  providerName: string;
  specialty: string;
  scheduledSlots: number;
  usedSlots: number;
  utilization: number;
  patientsPerDay: number;
  avgVisitDuration: number;
  noShowRate: number;
  revenue: number;
}

interface WaitTimeData {
  location: string;
  checkInToRoomed: number;
  roomedToProvider: number;
  providerTime: number;
  totalVisitTime: number;
  patientsCount: number;
}

interface ResourceUtilization {
  resourceType: string;
  resourceName: string;
  totalSlots: number;
  usedSlots: number;
  utilization: number;
  peakHours: string;
}

interface HourlyPatientFlow {
  hour: string;
  arrivals: number;
  departures: number;
  inClinic: number;
}

interface NoShowDetail {
  patientId: string;
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  provider: string;
  appointmentType: string;
  noShowCount: number;
  lastContact: string;
}

@Component({
  selector: 'app-operational-reports',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="operational-reports">
      <header class="page-header">
        <div class="header-content">
          <h1>Operational Reports</h1>
          <p class="subtitle">Monitor scheduling efficiency, provider productivity, and patient flow</p>
        </div>
        <div class="header-actions">
          <div class="date-range">
            <label>Date Range:</label>
            <input type="date" [value]="startDate()" (change)="startDate.set($any($event.target).value)">
            <span>to</span>
            <input type="date" [value]="endDate()" (change)="endDate.set($any($event.target).value)">
          </div>
          <select [value]="selectedLocation()" (change)="selectedLocation.set($any($event.target).value)">
            <option value="">All Locations</option>
            <option value="main">Main Clinic</option>
            <option value="north">North Office</option>
            <option value="south">South Office</option>
          </select>
          <button class="btn btn-secondary" (click)="showExportModal.set(true)">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export
          </button>
        </div>
      </header>

      <!-- Tab Navigation -->
      <nav class="tabs-nav">
        <button 
          class="tab-btn" 
          [class.active]="activeTab() === 'scheduling'"
          (click)="activeTab.set('scheduling')">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Scheduling Metrics
        </button>
        <button 
          class="tab-btn" 
          [class.active]="activeTab() === 'productivity'"
          (click)="activeTab.set('productivity')">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          Provider Productivity
        </button>
        <button 
          class="tab-btn" 
          [class.active]="activeTab() === 'waittime'"
          (click)="activeTab.set('waittime')">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          Wait Times
        </button>
        <button 
          class="tab-btn" 
          [class.active]="activeTab() === 'resources'"
          (click)="activeTab.set('resources')">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
          Resource Utilization
        </button>
        <button 
          class="tab-btn" 
          [class.active]="activeTab() === 'patientflow'"
          (click)="activeTab.set('patientflow')">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Patient Flow
        </button>
        <button 
          class="tab-btn" 
          [class.active]="activeTab() === 'noshow'"
          (click)="activeTab.set('noshow')">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
          No-Show Analysis
        </button>
      </nav>

      <!-- Scheduling Metrics Tab -->
      @if (activeTab() === 'scheduling') {
        <div class="tab-content">
          <!-- Summary Cards -->
          <div class="summary-cards">
            <div class="summary-card">
              <div class="card-icon blue">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                </svg>
              </div>
              <div class="card-content">
                <span class="card-value">{{ schedulingSummary().totalScheduled | number }}</span>
                <span class="card-label">Total Scheduled</span>
              </div>
            </div>
            <div class="summary-card">
              <div class="card-icon green">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <div class="card-content">
                <span class="card-value">{{ schedulingSummary().showRate | number:'1.1-1' }}%</span>
                <span class="card-label">Show Rate</span>
              </div>
            </div>
            <div class="summary-card">
              <div class="card-icon red">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <div class="card-content">
                <span class="card-value">{{ schedulingSummary().noShowRate | number:'1.1-1' }}%</span>
                <span class="card-label">No-Show Rate</span>
              </div>
            </div>
            <div class="summary-card">
              <div class="card-icon yellow">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div class="card-content">
                <span class="card-value">{{ schedulingSummary().avgWaitTime | number:'1.0-0' }} min</span>
                <span class="card-label">Avg Wait Time</span>
              </div>
            </div>
          </div>

          <!-- Scheduling Trend Chart -->
          <div class="chart-container">
            <h3>Appointment Trend</h3>
            <div class="chart">
              <svg viewBox="0 0 800 300" class="bar-chart">
                <!-- Y-axis -->
                <line x1="60" y1="20" x2="60" y2="250" stroke="#e5e7eb" stroke-width="1"/>
                @for (tick of [0, 25, 50, 75, 100]; track tick) {
                  <text 
                    [attr.x]="55" 
                    [attr.y]="250 - (tick * 2.2)" 
                    text-anchor="end" 
                    class="axis-label">{{ tick }}</text>
                  <line 
                    x1="60" 
                    [attr.y1]="250 - (tick * 2.2)" 
                    x2="780" 
                    [attr.y2]="250 - (tick * 2.2)" 
                    stroke="#f3f4f6" 
                    stroke-width="1"/>
                }
                
                <!-- Bars -->
                @for (metric of appointmentMetrics(); track metric.date; let i = $index) {
                  <g class="bar-group">
                    <!-- Scheduled -->
                    <rect 
                      [attr.x]="80 + (i * 100)" 
                      [attr.y]="250 - (metric.scheduled * 2.2)"
                      width="20"
                      [attr.height]="metric.scheduled * 2.2"
                      fill="#3b82f6"
                      class="bar"/>
                    <!-- Completed -->
                    <rect 
                      [attr.x]="102 + (i * 100)" 
                      [attr.y]="250 - (metric.completed * 2.2)"
                      width="20"
                      [attr.height]="metric.completed * 2.2"
                      fill="#22c55e"
                      class="bar"/>
                    <!-- No-Show -->
                    <rect 
                      [attr.x]="124 + (i * 100)" 
                      [attr.y]="250 - (metric.noShow * 2.2)"
                      width="20"
                      [attr.height]="metric.noShow * 2.2"
                      fill="#ef4444"
                      class="bar"/>
                    <!-- X-axis label -->
                    <text 
                      [attr.x]="112 + (i * 100)" 
                      y="270" 
                      text-anchor="middle" 
                      class="axis-label">{{ formatShortDate(metric.date) }}</text>
                  </g>
                }
              </svg>
              <div class="chart-legend">
                <span class="legend-item"><span class="legend-color" style="background: #3b82f6"></span> Scheduled</span>
                <span class="legend-item"><span class="legend-color" style="background: #22c55e"></span> Completed</span>
                <span class="legend-item"><span class="legend-color" style="background: #ef4444"></span> No-Show</span>
              </div>
            </div>
          </div>

          <!-- Scheduling Table -->
          <div class="data-table-container">
            <h3>Daily Breakdown</h3>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th class="text-right">Scheduled</th>
                  <th class="text-right">Completed</th>
                  <th class="text-right">No-Show</th>
                  <th class="text-right">Cancelled</th>
                  <th class="text-right">Rescheduled</th>
                  <th class="text-right">Show Rate</th>
                  <th class="text-right">Avg Wait</th>
                </tr>
              </thead>
              <tbody>
                @for (metric of appointmentMetrics(); track metric.date) {
                  <tr>
                    <td>{{ formatDate(metric.date) }}</td>
                    <td class="text-right">{{ metric.scheduled }}</td>
                    <td class="text-right">{{ metric.completed }}</td>
                    <td class="text-right text-danger">{{ metric.noShow }}</td>
                    <td class="text-right">{{ metric.cancelled }}</td>
                    <td class="text-right">{{ metric.rescheduled }}</td>
                    <td class="text-right">
                      <span class="rate-badge" [class.good]="metric.showRate >= 90" [class.warning]="metric.showRate >= 80 && metric.showRate < 90" [class.danger]="metric.showRate < 80">
                        {{ metric.showRate | number:'1.1-1' }}%
                      </span>
                    </td>
                    <td class="text-right">{{ metric.avgWaitTime }} min</td>
                  </tr>
                }
              </tbody>
              <tfoot>
                <tr>
                  <td><strong>Total/Avg</strong></td>
                  <td class="text-right"><strong>{{ schedulingSummary().totalScheduled }}</strong></td>
                  <td class="text-right"><strong>{{ schedulingSummary().totalCompleted }}</strong></td>
                  <td class="text-right text-danger"><strong>{{ schedulingSummary().totalNoShow }}</strong></td>
                  <td class="text-right"><strong>{{ schedulingSummary().totalCancelled }}</strong></td>
                  <td class="text-right"><strong>{{ schedulingSummary().totalRescheduled }}</strong></td>
                  <td class="text-right">
                    <span class="rate-badge" [class.good]="schedulingSummary().showRate >= 90">
                      <strong>{{ schedulingSummary().showRate | number:'1.1-1' }}%</strong>
                    </span>
                  </td>
                  <td class="text-right"><strong>{{ schedulingSummary().avgWaitTime | number:'1.0-0' }} min</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      }

      <!-- Provider Productivity Tab -->
      @if (activeTab() === 'productivity') {
        <div class="tab-content">
          <!-- Summary Cards -->
          <div class="summary-cards">
            <div class="summary-card">
              <div class="card-icon blue">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                </svg>
              </div>
              <div class="card-content">
                <span class="card-value">{{ providerProductivity().length }}</span>
                <span class="card-label">Active Providers</span>
              </div>
            </div>
            <div class="summary-card">
              <div class="card-icon green">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
              <div class="card-content">
                <span class="card-value">{{ productivitySummary().avgUtilization | number:'1.1-1' }}%</span>
                <span class="card-label">Avg Utilization</span>
              </div>
            </div>
            <div class="summary-card">
              <div class="card-icon purple">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div class="card-content">
                <span class="card-value">{{ productivitySummary().avgPatientsPerDay | number:'1.1-1' }}</span>
                <span class="card-label">Avg Patients/Day</span>
              </div>
            </div>
            <div class="summary-card">
              <div class="card-icon yellow">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <div class="card-content">
                <span class="card-value">{{ productivitySummary().totalRevenue | currency:'USD':'symbol':'1.0-0' }}</span>
                <span class="card-label">Total Revenue</span>
              </div>
            </div>
          </div>

          <!-- Utilization Chart -->
          <div class="chart-container">
            <h3>Provider Utilization</h3>
            <div class="horizontal-bars">
              @for (provider of providerProductivity(); track provider.providerId) {
                <div class="horizontal-bar-row">
                  <span class="bar-label">{{ provider.providerName }}</span>
                  <div class="bar-container">
                    <div 
                      class="bar-fill"
                      [style.width.%]="provider.utilization"
                      [class.good]="provider.utilization >= 80"
                      [class.warning]="provider.utilization >= 60 && provider.utilization < 80"
                      [class.low]="provider.utilization < 60">
                    </div>
                    <span class="bar-value">{{ provider.utilization | number:'1.0-0' }}%</span>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Productivity Table -->
          <div class="data-table-container">
            <h3>Provider Details</h3>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Specialty</th>
                  <th class="text-right">Slots Available</th>
                  <th class="text-right">Slots Used</th>
                  <th class="text-right">Utilization</th>
                  <th class="text-right">Patients/Day</th>
                  <th class="text-right">Avg Visit (min)</th>
                  <th class="text-right">No-Show Rate</th>
                  <th class="text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                @for (provider of providerProductivity(); track provider.providerId) {
                  <tr>
                    <td>
                      <div class="provider-info">
                        <span class="provider-name">{{ provider.providerName }}</span>
                      </div>
                    </td>
                    <td>{{ provider.specialty }}</td>
                    <td class="text-right">{{ provider.scheduledSlots }}</td>
                    <td class="text-right">{{ provider.usedSlots }}</td>
                    <td class="text-right">
                      <span class="rate-badge" [class.good]="provider.utilization >= 80" [class.warning]="provider.utilization >= 60 && provider.utilization < 80" [class.danger]="provider.utilization < 60">
                        {{ provider.utilization | number:'1.0-0' }}%
                      </span>
                    </td>
                    <td class="text-right">{{ provider.patientsPerDay | number:'1.1-1' }}</td>
                    <td class="text-right">{{ provider.avgVisitDuration }}</td>
                    <td class="text-right">
                      <span class="rate-badge" [class.good]="provider.noShowRate < 5" [class.warning]="provider.noShowRate >= 5 && provider.noShowRate < 10" [class.danger]="provider.noShowRate >= 10">
                        {{ provider.noShowRate | number:'1.1-1' }}%
                      </span>
                    </td>
                    <td class="text-right">{{ provider.revenue | currency:'USD':'symbol':'1.0-0' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Wait Times Tab -->
      @if (activeTab() === 'waittime') {
        <div class="tab-content">
          <!-- Summary Cards -->
          <div class="summary-cards">
            <div class="summary-card">
              <div class="card-icon blue">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div class="card-content">
                <span class="card-value">{{ waitTimeSummary().avgCheckInToRoomed | number:'1.0-0' }} min</span>
                <span class="card-label">Avg Check-in to Roomed</span>
              </div>
            </div>
            <div class="summary-card">
              <div class="card-icon green">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </div>
              <div class="card-content">
                <span class="card-value">{{ waitTimeSummary().avgRoomedToProvider | number:'1.0-0' }} min</span>
                <span class="card-label">Avg Roomed to Provider</span>
              </div>
            </div>
            <div class="summary-card">
              <div class="card-icon purple">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                </svg>
              </div>
              <div class="card-content">
                <span class="card-value">{{ waitTimeSummary().avgProviderTime | number:'1.0-0' }} min</span>
                <span class="card-label">Avg Provider Time</span>
              </div>
            </div>
            <div class="summary-card">
              <div class="card-icon yellow">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div class="card-content">
                <span class="card-value">{{ waitTimeSummary().avgTotalVisit | number:'1.0-0' }} min</span>
                <span class="card-label">Avg Total Visit Time</span>
              </div>
            </div>
          </div>

          <!-- Wait Time Breakdown Chart -->
          <div class="chart-container">
            <h3>Wait Time Breakdown by Location</h3>
            <div class="stacked-bars">
              @for (data of waitTimeData(); track data.location) {
                <div class="stacked-bar-row">
                  <span class="bar-label">{{ data.location }}</span>
                  <div class="stacked-bar-container">
                    <div 
                      class="stack-segment checkin"
                      [style.width.%]="(data.checkInToRoomed / data.totalVisitTime) * 100"
                      [title]="'Check-in to Roomed: ' + data.checkInToRoomed + ' min'">
                    </div>
                    <div 
                      class="stack-segment roomed"
                      [style.width.%]="(data.roomedToProvider / data.totalVisitTime) * 100"
                      [title]="'Roomed to Provider: ' + data.roomedToProvider + ' min'">
                    </div>
                    <div 
                      class="stack-segment provider"
                      [style.width.%]="(data.providerTime / data.totalVisitTime) * 100"
                      [title]="'Provider Time: ' + data.providerTime + ' min'">
                    </div>
                  </div>
                  <span class="bar-total">{{ data.totalVisitTime }} min</span>
                </div>
              }
            </div>
            <div class="chart-legend">
              <span class="legend-item"><span class="legend-color" style="background: #3b82f6"></span> Check-in to Roomed</span>
              <span class="legend-item"><span class="legend-color" style="background: #f59e0b"></span> Roomed to Provider</span>
              <span class="legend-item"><span class="legend-color" style="background: #22c55e"></span> Provider Time</span>
            </div>
          </div>

          <!-- Wait Time Table -->
          <div class="data-table-container">
            <h3>Location Details</h3>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Location</th>
                  <th class="text-right">Check-in to Roomed</th>
                  <th class="text-right">Roomed to Provider</th>
                  <th class="text-right">Provider Time</th>
                  <th class="text-right">Total Visit Time</th>
                  <th class="text-right">Patients Seen</th>
                </tr>
              </thead>
              <tbody>
                @for (data of waitTimeData(); track data.location) {
                  <tr>
                    <td>{{ data.location }}</td>
                    <td class="text-right">
                      <span [class.text-danger]="data.checkInToRoomed > 15">{{ data.checkInToRoomed }} min</span>
                    </td>
                    <td class="text-right">
                      <span [class.text-danger]="data.roomedToProvider > 10">{{ data.roomedToProvider }} min</span>
                    </td>
                    <td class="text-right">{{ data.providerTime }} min</td>
                    <td class="text-right"><strong>{{ data.totalVisitTime }} min</strong></td>
                    <td class="text-right">{{ data.patientsCount }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Resource Utilization Tab -->
      @if (activeTab() === 'resources') {
        <div class="tab-content">
          <!-- Summary Cards -->
          <div class="summary-cards">
            <div class="summary-card">
              <div class="card-icon blue">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </div>
              <div class="card-content">
                <span class="card-value">{{ resourceSummary().totalResources }}</span>
                <span class="card-label">Total Resources</span>
              </div>
            </div>
            <div class="summary-card">
              <div class="card-icon green">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
              <div class="card-content">
                <span class="card-value">{{ resourceSummary().avgUtilization | number:'1.0-0' }}%</span>
                <span class="card-label">Avg Utilization</span>
              </div>
            </div>
            <div class="summary-card">
              <div class="card-icon red">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div class="card-content">
                <span class="card-value">{{ resourceSummary().underutilized }}</span>
                <span class="card-label">Underutilized (&lt;50%)</span>
              </div>
            </div>
            <div class="summary-card">
              <div class="card-icon purple">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              </div>
              <div class="card-content">
                <span class="card-value">{{ resourceSummary().overbooked }}</span>
                <span class="card-label">Overbooked (&gt;90%)</span>
              </div>
            </div>
          </div>

          <!-- Resource Utilization by Type -->
          <div class="resource-grid">
            @for (type of resourceTypes(); track type) {
              <div class="resource-card">
                <h4>{{ type }}</h4>
                <div class="resource-list">
                  @for (resource of getResourcesByType(type); track resource.resourceName) {
                    <div class="resource-item">
                      <span class="resource-name">{{ resource.resourceName }}</span>
                      <div class="resource-bar">
                        <div 
                          class="resource-fill"
                          [style.width.%]="resource.utilization"
                          [class.good]="resource.utilization >= 60 && resource.utilization <= 85"
                          [class.warning]="resource.utilization > 85"
                          [class.low]="resource.utilization < 60">
                        </div>
                      </div>
                      <span class="resource-percent">{{ resource.utilization }}%</span>
                    </div>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Resource Table -->
          <div class="data-table-container">
            <h3>Resource Details</h3>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Resource Type</th>
                  <th>Resource Name</th>
                  <th class="text-right">Total Slots</th>
                  <th class="text-right">Used Slots</th>
                  <th class="text-right">Utilization</th>
                  <th>Peak Hours</th>
                </tr>
              </thead>
              <tbody>
                @for (resource of resourceUtilization(); track resource.resourceName) {
                  <tr>
                    <td><span class="type-badge">{{ resource.resourceType }}</span></td>
                    <td>{{ resource.resourceName }}</td>
                    <td class="text-right">{{ resource.totalSlots }}</td>
                    <td class="text-right">{{ resource.usedSlots }}</td>
                    <td class="text-right">
                      <span class="rate-badge" [class.good]="resource.utilization >= 60 && resource.utilization <= 85" [class.warning]="resource.utilization > 85" [class.danger]="resource.utilization < 60">
                        {{ resource.utilization }}%
                      </span>
                    </td>
                    <td>{{ resource.peakHours }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Patient Flow Tab -->
      @if (activeTab() === 'patientflow') {
        <div class="tab-content">
          <!-- Summary Cards -->
          <div class="summary-cards">
            <div class="summary-card">
              <div class="card-icon blue">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                </svg>
              </div>
              <div class="card-content">
                <span class="card-value">{{ patientFlowSummary().totalArrivals }}</span>
                <span class="card-label">Total Arrivals</span>
              </div>
            </div>
            <div class="summary-card">
              <div class="card-icon green">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <div class="card-content">
                <span class="card-value">{{ patientFlowSummary().totalDepartures }}</span>
                <span class="card-label">Total Departures</span>
              </div>
            </div>
            <div class="summary-card">
              <div class="card-icon purple">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div class="card-content">
                <span class="card-value">{{ patientFlowSummary().peakHour }}</span>
                <span class="card-label">Peak Hour</span>
              </div>
            </div>
            <div class="summary-card">
              <div class="card-icon yellow">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                </svg>
              </div>
              <div class="card-content">
                <span class="card-value">{{ patientFlowSummary().maxInClinic }}</span>
                <span class="card-label">Max Concurrent</span>
              </div>
            </div>
          </div>

          <!-- Patient Flow Chart -->
          <div class="chart-container">
            <h3>Hourly Patient Flow</h3>
            <div class="chart">
              <svg viewBox="0 0 800 300" class="line-chart">
                <!-- Grid lines -->
                @for (tick of [0, 10, 20, 30, 40]; track tick) {
                  <text 
                    [attr.x]="55" 
                    [attr.y]="250 - (tick * 5)" 
                    text-anchor="end" 
                    class="axis-label">{{ tick }}</text>
                  <line 
                    x1="60" 
                    [attr.y1]="250 - (tick * 5)" 
                    x2="780" 
                    [attr.y2]="250 - (tick * 5)" 
                    stroke="#f3f4f6" 
                    stroke-width="1"/>
                }
                
                <!-- X-axis labels -->
                @for (flow of hourlyPatientFlow(); track flow.hour; let i = $index) {
                  <text 
                    [attr.x]="80 + (i * 50)" 
                    y="270" 
                    text-anchor="middle" 
                    class="axis-label">{{ flow.hour }}</text>
                }
                
                <!-- Arrivals Line -->
                <polyline 
                  [attr.points]="getFlowLinePoints('arrivals')"
                  fill="none"
                  stroke="#3b82f6"
                  stroke-width="2"/>
                
                <!-- Departures Line -->
                <polyline 
                  [attr.points]="getFlowLinePoints('departures')"
                  fill="none"
                  stroke="#22c55e"
                  stroke-width="2"/>
                
                <!-- In Clinic Line -->
                <polyline 
                  [attr.points]="getFlowLinePoints('inClinic')"
                  fill="none"
                  stroke="#f59e0b"
                  stroke-width="2"
                  stroke-dasharray="5,5"/>
                
                <!-- Data Points -->
                @for (flow of hourlyPatientFlow(); track flow.hour; let i = $index) {
                  <circle 
                    [attr.cx]="80 + (i * 50)" 
                    [attr.cy]="250 - (flow.arrivals * 5)"
                    r="4"
                    fill="#3b82f6"/>
                  <circle 
                    [attr.cx]="80 + (i * 50)" 
                    [attr.cy]="250 - (flow.departures * 5)"
                    r="4"
                    fill="#22c55e"/>
                  <circle 
                    [attr.cx]="80 + (i * 50)" 
                    [attr.cy]="250 - (flow.inClinic * 5)"
                    r="4"
                    fill="#f59e0b"/>
                }
              </svg>
              <div class="chart-legend">
                <span class="legend-item"><span class="legend-color" style="background: #3b82f6"></span> Arrivals</span>
                <span class="legend-item"><span class="legend-color" style="background: #22c55e"></span> Departures</span>
                <span class="legend-item"><span class="legend-color" style="background: #f59e0b"></span> In Clinic</span>
              </div>
            </div>
          </div>

          <!-- Flow Table -->
          <div class="data-table-container">
            <h3>Hourly Breakdown</h3>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Hour</th>
                  <th class="text-right">Arrivals</th>
                  <th class="text-right">Departures</th>
                  <th class="text-right">Net Change</th>
                  <th class="text-right">In Clinic</th>
                </tr>
              </thead>
              <tbody>
                @for (flow of hourlyPatientFlow(); track flow.hour) {
                  <tr>
                    <td>{{ flow.hour }}</td>
                    <td class="text-right">{{ flow.arrivals }}</td>
                    <td class="text-right">{{ flow.departures }}</td>
                    <td class="text-right" [class.text-success]="flow.arrivals - flow.departures > 0" [class.text-danger]="flow.arrivals - flow.departures < 0">
                      {{ flow.arrivals - flow.departures > 0 ? '+' : '' }}{{ flow.arrivals - flow.departures }}
                    </td>
                    <td class="text-right"><strong>{{ flow.inClinic }}</strong></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- No-Show Analysis Tab -->
      @if (activeTab() === 'noshow') {
        <div class="tab-content">
          <!-- Summary Cards -->
          <div class="summary-cards">
            <div class="summary-card">
              <div class="card-icon red">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                </svg>
              </div>
              <div class="card-content">
                <span class="card-value">{{ noShowSummary().totalNoShows }}</span>
                <span class="card-label">Total No-Shows</span>
              </div>
            </div>
            <div class="summary-card">
              <div class="card-icon yellow">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div class="card-content">
                <span class="card-value">{{ noShowSummary().noShowRate | number:'1.1-1' }}%</span>
                <span class="card-label">No-Show Rate</span>
              </div>
            </div>
            <div class="summary-card">
              <div class="card-icon purple">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                </svg>
              </div>
              <div class="card-content">
                <span class="card-value">{{ noShowSummary().repeatOffenders }}</span>
                <span class="card-label">Repeat Offenders (3+)</span>
              </div>
            </div>
            <div class="summary-card">
              <div class="card-icon blue">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <div class="card-content">
                <span class="card-value">{{ noShowSummary().estimatedLoss | currency:'USD':'symbol':'1.0-0' }}</span>
                <span class="card-label">Est. Revenue Loss</span>
              </div>
            </div>
          </div>

          <!-- No-Show by Day of Week -->
          <div class="chart-container">
            <h3>No-Shows by Day of Week</h3>
            <div class="horizontal-bars">
              @for (day of noShowByDay(); track day.day) {
                <div class="horizontal-bar-row">
                  <span class="bar-label">{{ day.day }}</span>
                  <div class="bar-container">
                    <div 
                      class="bar-fill danger"
                      [style.width.%]="(day.count / maxNoShowDay()) * 100">
                    </div>
                    <span class="bar-value">{{ day.count }} ({{ day.rate | number:'1.1-1' }}%)</span>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- No-Show Details Table -->
          <div class="data-table-container">
            <div class="table-header">
              <h3>Recent No-Shows</h3>
              <div class="table-actions">
                <button class="btn btn-sm btn-secondary" (click)="exportNoShows()">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Export
                </button>
                <button class="btn btn-sm btn-primary" (click)="bulkReminder()">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  Send Reminders
                </button>
              </div>
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Appointment Date</th>
                  <th>Time</th>
                  <th>Provider</th>
                  <th>Type</th>
                  <th class="text-center">No-Show Count</th>
                  <th>Last Contact</th>
                  <th class="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (noshow of noShowDetails(); track noshow.patientId + noshow.appointmentDate) {
                  <tr>
                    <td>
                      <a href="#" class="patient-link">{{ noshow.patientName }}</a>
                    </td>
                    <td>{{ formatDate(noshow.appointmentDate) }}</td>
                    <td>{{ noshow.appointmentTime }}</td>
                    <td>{{ noshow.provider }}</td>
                    <td>{{ noshow.appointmentType }}</td>
                    <td class="text-center">
                      <span class="count-badge" [class.warning]="noshow.noShowCount >= 2" [class.danger]="noshow.noShowCount >= 3">
                        {{ noshow.noShowCount }}
                      </span>
                    </td>
                    <td>{{ noshow.lastContact }}</td>
                    <td class="text-center">
                      <div class="action-buttons">
                        <button class="btn btn-icon btn-sm" title="Call Patient" (click)="callPatient(noshow)">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"/>
                          </svg>
                        </button>
                        <button class="btn btn-icon btn-sm" title="Reschedule" (click)="reschedulePatient(noshow)">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                          </svg>
                        </button>
                        <button class="btn btn-icon btn-sm" title="View History" (click)="viewPatientHistory(noshow)">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Export Modal -->
      @if (showExportModal()) {
        <div class="modal-overlay" (click)="showExportModal.set(false)">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Export Report</h2>
              <button class="close-btn" (click)="showExportModal.set(false)">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="export-options">
                <label class="export-option">
                  <input type="radio" name="exportFormat" value="pdf" checked>
                  <span class="option-content">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <span>PDF Document</span>
                  </span>
                </label>
                <label class="export-option">
                  <input type="radio" name="exportFormat" value="excel">
                  <span class="option-content">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <line x1="3" y1="9" x2="21" y2="9"/>
                      <line x1="3" y1="15" x2="21" y2="15"/>
                      <line x1="9" y1="3" x2="9" y2="21"/>
                      <line x1="15" y1="3" x2="15" y2="21"/>
                    </svg>
                    <span>Excel Spreadsheet</span>
                  </span>
                </label>
                <label class="export-option">
                  <input type="radio" name="exportFormat" value="csv">
                  <span class="option-content">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="8" y1="13" x2="16" y2="13"/>
                      <line x1="8" y1="17" x2="16" y2="17"/>
                    </svg>
                    <span>CSV File</span>
                  </span>
                </label>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="showExportModal.set(false)">Cancel</button>
              <button class="btn btn-primary" (click)="exportReport()">Export</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .operational-reports {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .header-content h1 {
      font-size: 1.75rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 0.25rem 0;
    }

    .subtitle {
      color: #6b7280;
      margin: 0;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .date-range {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .date-range label {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .date-range input,
    .header-actions select {
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
    }

    .date-range span {
      color: #6b7280;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.15s;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .btn-secondary {
      background: white;
      color: #374151;
      border: 1px solid #d1d5db;
    }

    .btn-secondary:hover {
      background: #f9fafb;
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
    }

    .btn-icon {
      padding: 0.375rem;
    }

    /* Tabs */
    .tabs-nav {
      display: flex;
      gap: 0.5rem;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 1.5rem;
      overflow-x: auto;
      padding-bottom: 1px;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: none;
      border: none;
      color: #6b7280;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      white-space: nowrap;
      transition: all 0.15s;
    }

    .tab-btn:hover {
      color: #3b82f6;
    }

    .tab-btn.active {
      color: #3b82f6;
      border-bottom-color: #3b82f6;
    }

    /* Summary Cards */
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .summary-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: white;
      border-radius: 0.5rem;
      border: 1px solid #e5e7eb;
    }

    .card-icon {
      width: 48px;
      height: 48px;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .card-icon.blue { background: #dbeafe; color: #3b82f6; }
    .card-icon.green { background: #dcfce7; color: #22c55e; }
    .card-icon.red { background: #fee2e2; color: #ef4444; }
    .card-icon.yellow { background: #fef3c7; color: #f59e0b; }
    .card-icon.purple { background: #ede9fe; color: #8b5cf6; }

    .card-content {
      display: flex;
      flex-direction: column;
    }

    .card-value {
      font-size: 1.5rem;
      font-weight: 600;
      color: #111827;
    }

    .card-label {
      font-size: 0.875rem;
      color: #6b7280;
    }

    /* Charts */
    .chart-container {
      background: white;
      border-radius: 0.5rem;
      border: 1px solid #e5e7eb;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .chart-container h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 1rem 0;
    }

    .chart {
      position: relative;
    }

    .bar-chart, .line-chart {
      width: 100%;
      height: auto;
    }

    .axis-label {
      font-size: 11px;
      fill: #6b7280;
    }

    .bar {
      transition: opacity 0.15s;
    }

    .bar:hover {
      opacity: 0.8;
    }

    .chart-legend {
      display: flex;
      justify-content: center;
      gap: 1.5rem;
      margin-top: 1rem;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.8125rem;
      color: #6b7280;
    }

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 2px;
    }

    /* Horizontal Bars */
    .horizontal-bars {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .horizontal-bar-row {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .bar-label {
      width: 140px;
      font-size: 0.875rem;
      color: #374151;
      flex-shrink: 0;
    }

    .bar-container {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .bar-fill {
      height: 24px;
      border-radius: 0.25rem;
      transition: width 0.3s ease;
    }

    .bar-fill.good { background: #22c55e; }
    .bar-fill.warning { background: #f59e0b; }
    .bar-fill.low { background: #3b82f6; }
    .bar-fill.danger { background: #ef4444; }

    .bar-value {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      min-width: 60px;
    }

    /* Stacked Bars */
    .stacked-bars {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .stacked-bar-row {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .stacked-bar-container {
      flex: 1;
      display: flex;
      height: 24px;
      border-radius: 0.25rem;
      overflow: hidden;
    }

    .stack-segment {
      height: 100%;
      transition: width 0.3s ease;
    }

    .stack-segment.checkin { background: #3b82f6; }
    .stack-segment.roomed { background: #f59e0b; }
    .stack-segment.provider { background: #22c55e; }

    .bar-total {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      min-width: 60px;
    }

    /* Resource Grid */
    .resource-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .resource-card {
      background: white;
      border-radius: 0.5rem;
      border: 1px solid #e5e7eb;
      padding: 1rem;
    }

    .resource-card h4 {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      margin: 0 0 1rem 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .resource-list {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }

    .resource-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .resource-name {
      width: 100px;
      font-size: 0.8125rem;
      color: #374151;
      flex-shrink: 0;
    }

    .resource-bar {
      flex: 1;
      height: 8px;
      background: #f3f4f6;
      border-radius: 4px;
      overflow: hidden;
    }

    .resource-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .resource-fill.good { background: #22c55e; }
    .resource-fill.warning { background: #f59e0b; }
    .resource-fill.low { background: #ef4444; }

    .resource-percent {
      width: 40px;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #374151;
      text-align: right;
    }

    /* Data Tables */
    .data-table-container {
      background: white;
      border-radius: 0.5rem;
      border: 1px solid #e5e7eb;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
      overflow-x: auto;
    }

    .data-table-container h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 1rem 0;
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .table-header h3 {
      margin: 0;
    }

    .table-actions {
      display: flex;
      gap: 0.5rem;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th,
    .data-table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }

    .data-table th {
      background: #f9fafb;
      font-weight: 500;
      color: #6b7280;
      font-size: 0.8125rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .data-table td {
      font-size: 0.875rem;
      color: #374151;
    }

    .data-table tbody tr:hover {
      background: #f9fafb;
    }

    .data-table tfoot td {
      background: #f9fafb;
      border-top: 2px solid #e5e7eb;
    }

    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .text-danger { color: #ef4444; }
    .text-success { color: #22c55e; }

    .rate-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.8125rem;
      font-weight: 500;
    }

    .rate-badge.good { background: #dcfce7; color: #16a34a; }
    .rate-badge.warning { background: #fef3c7; color: #d97706; }
    .rate-badge.danger { background: #fee2e2; color: #dc2626; }

    .count-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      font-size: 0.8125rem;
      font-weight: 600;
      background: #f3f4f6;
      color: #374151;
    }

    .count-badge.warning { background: #fef3c7; color: #d97706; }
    .count-badge.danger { background: #fee2e2; color: #dc2626; }

    .type-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
      background: #e5e7eb;
      color: #374151;
      text-transform: capitalize;
    }

    .patient-link {
      color: #3b82f6;
      text-decoration: none;
    }

    .patient-link:hover {
      text-decoration: underline;
    }

    .action-buttons {
      display: flex;
      justify-content: center;
      gap: 0.25rem;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: white;
      border-radius: 0.5rem;
      width: 100%;
      max-width: 400px;
      max-height: 90vh;
      overflow: hidden;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h2 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      color: #6b7280;
      cursor: pointer;
      padding: 0.25rem;
    }

    .close-btn:hover {
      color: #374151;
    }

    .modal-body {
      padding: 1.25rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-top: 1px solid #e5e7eb;
      background: #f9fafb;
    }

    .export-options {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .export-option {
      display: flex;
      cursor: pointer;
    }

    .export-option input {
      position: absolute;
      opacity: 0;
    }

    .export-option .option-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      width: 100%;
      transition: all 0.15s;
    }

    .export-option input:checked + .option-content {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .export-option .option-content svg {
      color: #6b7280;
    }

    .export-option input:checked + .option-content svg {
      color: #3b82f6;
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
      }

      .header-actions {
        width: 100%;
        justify-content: flex-start;
      }

      .date-range {
        flex-wrap: wrap;
      }

      .tabs-nav {
        gap: 0;
      }

      .tab-btn {
        padding: 0.5rem 0.75rem;
        font-size: 0.8125rem;
      }

      .horizontal-bar-row {
        flex-direction: column;
        align-items: flex-start;
      }

      .bar-label {
        width: 100%;
        margin-bottom: 0.25rem;
      }

      .bar-container {
        width: 100%;
      }
    }
  `]
})
export class OperationalReportsComponent implements OnInit {
  private reportsService = inject(ReportsService);

  // State
  activeTab = signal<'scheduling' | 'productivity' | 'waittime' | 'resources' | 'patientflow' | 'noshow'>('scheduling');
  startDate = signal(this.getDefaultStartDate());
  endDate = signal(this.getDefaultEndDate());
  selectedLocation = signal('');
  showExportModal = signal(false);

  // Mock Data
  appointmentMetrics = signal<AppointmentMetric[]>(this.generateAppointmentMetrics());
  providerProductivity = signal<ProviderProductivity[]>(this.generateProviderProductivity());
  waitTimeData = signal<WaitTimeData[]>(this.generateWaitTimeData());
  resourceUtilization = signal<ResourceUtilization[]>(this.generateResourceUtilization());
  hourlyPatientFlow = signal<HourlyPatientFlow[]>(this.generateHourlyPatientFlow());
  noShowDetails = signal<NoShowDetail[]>(this.generateNoShowDetails());

  // Computed values
  schedulingSummary = computed(() => {
    const metrics = this.appointmentMetrics();
    const totalScheduled = metrics.reduce((sum, m) => sum + m.scheduled, 0);
    const totalCompleted = metrics.reduce((sum, m) => sum + m.completed, 0);
    const totalNoShow = metrics.reduce((sum, m) => sum + m.noShow, 0);
    const totalCancelled = metrics.reduce((sum, m) => sum + m.cancelled, 0);
    const totalRescheduled = metrics.reduce((sum, m) => sum + m.rescheduled, 0);
    const avgWaitTime = metrics.reduce((sum, m) => sum + m.avgWaitTime, 0) / metrics.length;
    
    return {
      totalScheduled,
      totalCompleted,
      totalNoShow,
      totalCancelled,
      totalRescheduled,
      showRate: totalScheduled > 0 ? (totalCompleted / totalScheduled) * 100 : 0,
      noShowRate: totalScheduled > 0 ? (totalNoShow / totalScheduled) * 100 : 0,
      avgWaitTime
    };
  });

  productivitySummary = computed(() => {
    const providers = this.providerProductivity();
    const avgUtilization = providers.reduce((sum, p) => sum + p.utilization, 0) / providers.length;
    const avgPatientsPerDay = providers.reduce((sum, p) => sum + p.patientsPerDay, 0) / providers.length;
    const totalRevenue = providers.reduce((sum, p) => sum + p.revenue, 0);
    
    return { avgUtilization, avgPatientsPerDay, totalRevenue };
  });

  waitTimeSummary = computed(() => {
    const data = this.waitTimeData();
    const totalPatients = data.reduce((sum, d) => sum + d.patientsCount, 0);
    
    return {
      avgCheckInToRoomed: data.reduce((sum, d) => sum + d.checkInToRoomed * d.patientsCount, 0) / totalPatients,
      avgRoomedToProvider: data.reduce((sum, d) => sum + d.roomedToProvider * d.patientsCount, 0) / totalPatients,
      avgProviderTime: data.reduce((sum, d) => sum + d.providerTime * d.patientsCount, 0) / totalPatients,
      avgTotalVisit: data.reduce((sum, d) => sum + d.totalVisitTime * d.patientsCount, 0) / totalPatients
    };
  });

  resourceSummary = computed(() => {
    const resources = this.resourceUtilization();
    return {
      totalResources: resources.length,
      avgUtilization: resources.reduce((sum, r) => sum + r.utilization, 0) / resources.length,
      underutilized: resources.filter(r => r.utilization < 50).length,
      overbooked: resources.filter(r => r.utilization > 90).length
    };
  });

  resourceTypes = computed(() => {
    const types = new Set(this.resourceUtilization().map(r => r.resourceType));
    return Array.from(types);
  });

  patientFlowSummary = computed(() => {
    const flows = this.hourlyPatientFlow();
    const totalArrivals = flows.reduce((sum, f) => sum + f.arrivals, 0);
    const totalDepartures = flows.reduce((sum, f) => sum + f.departures, 0);
    const maxInClinic = Math.max(...flows.map(f => f.inClinic));
    const peakFlow = flows.reduce((max, f) => f.arrivals > max.arrivals ? f : max, flows[0]);
    
    return {
      totalArrivals,
      totalDepartures,
      maxInClinic,
      peakHour: peakFlow.hour
    };
  });

  noShowSummary = computed(() => {
    const noShows = this.noShowDetails();
    const totalScheduled = this.schedulingSummary().totalScheduled;
    const repeatOffenders = noShows.filter(n => n.noShowCount >= 3).length;
    
    return {
      totalNoShows: noShows.length,
      noShowRate: totalScheduled > 0 ? (noShows.length / totalScheduled) * 100 : 0,
      repeatOffenders,
      estimatedLoss: noShows.length * 150 // Average visit value
    };
  });

  noShowByDay = computed(() => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    return days.map(day => ({
      day,
      count: Math.floor(Math.random() * 15) + 5,
      rate: Math.random() * 8 + 4
    }));
  });

  maxNoShowDay = computed(() => {
    return Math.max(...this.noShowByDay().map(d => d.count));
  });

  ngOnInit(): void {
    // Load data from service if needed
  }

  getDefaultStartDate(): string {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  }

  getDefaultEndDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  generateAppointmentMetrics(): AppointmentMetric[] {
    const metrics: AppointmentMetric[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const scheduled = Math.floor(Math.random() * 30) + 50;
      const completed = Math.floor(scheduled * (0.82 + Math.random() * 0.12));
      const noShow = Math.floor(scheduled * (0.03 + Math.random() * 0.08));
      const cancelled = Math.floor(scheduled * (0.02 + Math.random() * 0.05));
      
      metrics.push({
        date: date.toISOString().split('T')[0],
        scheduled,
        completed,
        noShow,
        cancelled,
        rescheduled: Math.floor(scheduled * 0.05),
        showRate: (completed / scheduled) * 100,
        avgWaitTime: Math.floor(Math.random() * 10) + 12
      });
    }
    
    return metrics;
  }

  generateProviderProductivity(): ProviderProductivity[] {
    const providers = [
      { name: 'Dr. Sarah Chen', specialty: 'Family Medicine' },
      { name: 'Dr. Michael Thompson', specialty: 'Internal Medicine' },
      { name: 'Dr. Emily Rodriguez', specialty: 'Pediatrics' },
      { name: 'Dr. James Wilson', specialty: 'Family Medicine' },
      { name: 'Dr. Lisa Anderson', specialty: 'OB/GYN' }
    ];
    
    return providers.map(p => {
      const scheduledSlots = Math.floor(Math.random() * 20) + 30;
      const usedSlots = Math.floor(scheduledSlots * (0.7 + Math.random() * 0.25));
      
      return {
        providerId: p.name.toLowerCase().replace(/\s/g, '-'),
        providerName: p.name,
        specialty: p.specialty,
        scheduledSlots,
        usedSlots,
        utilization: Math.round((usedSlots / scheduledSlots) * 100),
        patientsPerDay: Math.round((usedSlots / 5) * 10) / 10,
        avgVisitDuration: Math.floor(Math.random() * 10) + 18,
        noShowRate: Math.round((Math.random() * 8 + 2) * 10) / 10,
        revenue: Math.floor(Math.random() * 50000) + 80000
      };
    });
  }

  generateWaitTimeData(): WaitTimeData[] {
    return [
      { location: 'Main Clinic', checkInToRoomed: 12, roomedToProvider: 8, providerTime: 22, totalVisitTime: 42, patientsCount: 245 },
      { location: 'North Office', checkInToRoomed: 8, roomedToProvider: 5, providerTime: 20, totalVisitTime: 33, patientsCount: 156 },
      { location: 'South Office', checkInToRoomed: 15, roomedToProvider: 10, providerTime: 25, totalVisitTime: 50, patientsCount: 189 },
      { location: 'Urgent Care', checkInToRoomed: 18, roomedToProvider: 12, providerTime: 18, totalVisitTime: 48, patientsCount: 312 }
    ];
  }

  generateResourceUtilization(): ResourceUtilization[] {
    return [
      { resourceType: 'Exam Rooms', resourceName: 'Room 1', totalSlots: 40, usedSlots: 35, utilization: 88, peakHours: '9 AM - 11 AM' },
      { resourceType: 'Exam Rooms', resourceName: 'Room 2', totalSlots: 40, usedSlots: 32, utilization: 80, peakHours: '10 AM - 12 PM' },
      { resourceType: 'Exam Rooms', resourceName: 'Room 3', totalSlots: 40, usedSlots: 28, utilization: 70, peakHours: '2 PM - 4 PM' },
      { resourceType: 'Exam Rooms', resourceName: 'Room 4', totalSlots: 40, usedSlots: 22, utilization: 55, peakHours: '3 PM - 5 PM' },
      { resourceType: 'Equipment', resourceName: 'EKG Machine', totalSlots: 20, usedSlots: 16, utilization: 80, peakHours: '9 AM - 11 AM' },
      { resourceType: 'Equipment', resourceName: 'X-Ray', totalSlots: 15, usedSlots: 13, utilization: 87, peakHours: '10 AM - 2 PM' },
      { resourceType: 'Equipment', resourceName: 'Ultrasound', totalSlots: 12, usedSlots: 8, utilization: 67, peakHours: '11 AM - 1 PM' },
      { resourceType: 'Staff', resourceName: 'Nurse Station 1', totalSlots: 40, usedSlots: 38, utilization: 95, peakHours: '9 AM - 12 PM' },
      { resourceType: 'Staff', resourceName: 'Nurse Station 2', totalSlots: 40, usedSlots: 30, utilization: 75, peakHours: '1 PM - 4 PM' },
      { resourceType: 'Staff', resourceName: 'Lab Tech', totalSlots: 25, usedSlots: 20, utilization: 80, peakHours: '8 AM - 10 AM' }
    ];
  }

  generateHourlyPatientFlow(): HourlyPatientFlow[] {
    const hours = ['8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM'];
    let inClinic = 0;
    
    return hours.map(hour => {
      const arrivals = Math.floor(Math.random() * 15) + 8;
      const departures = Math.floor(Math.random() * 12) + 5;
      inClinic = Math.max(0, inClinic + arrivals - departures);
      
      return { hour, arrivals, departures, inClinic };
    });
  }

  generateNoShowDetails(): NoShowDetail[] {
    const patients = [
      { name: 'John Smith', type: 'Follow-up', provider: 'Dr. Chen' },
      { name: 'Maria Garcia', type: 'Annual Physical', provider: 'Dr. Thompson' },
      { name: 'Robert Johnson', type: 'Sick Visit', provider: 'Dr. Rodriguez' },
      { name: 'Emily Davis', type: 'Lab Review', provider: 'Dr. Wilson' },
      { name: 'Michael Brown', type: 'Follow-up', provider: 'Dr. Anderson' },
      { name: 'Sarah Miller', type: 'New Patient', provider: 'Dr. Chen' },
      { name: 'David Wilson', type: 'Chronic Care', provider: 'Dr. Thompson' }
    ];
    
    return patients.map((p, i) => ({
      patientId: `PAT-${1000 + i}`,
      patientName: p.name,
      appointmentDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      appointmentTime: `${Math.floor(Math.random() * 4) + 9}:${Math.random() > 0.5 ? '00' : '30'} AM`,
      provider: p.provider,
      appointmentType: p.type,
      noShowCount: Math.floor(Math.random() * 4) + 1,
      lastContact: Math.random() > 0.5 ? 'Voicemail left' : 'No answer'
    }));
  }

  getResourcesByType(type: string): ResourceUtilization[] {
    return this.resourceUtilization().filter(r => r.resourceType === type);
  }

  getFlowLinePoints(metric: 'arrivals' | 'departures' | 'inClinic'): string {
    const flows = this.hourlyPatientFlow();
    return flows.map((f, i) => {
      const x = 80 + (i * 50);
      const y = 250 - (f[metric] * 5);
      return `${x},${y}`;
    }).join(' ');
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatShortDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  exportReport(): void {
    this.showExportModal.set(false);
    console.log('Exporting report...');
  }

  exportNoShows(): void {
    console.log('Exporting no-show data...');
  }

  bulkReminder(): void {
    console.log('Sending bulk reminders...');
  }

  callPatient(noshow: NoShowDetail): void {
    console.log('Calling patient:', noshow.patientName);
  }

  reschedulePatient(noshow: NoShowDetail): void {
    console.log('Rescheduling patient:', noshow.patientName);
  }

  viewPatientHistory(noshow: NoShowDetail): void {
    console.log('Viewing history for:', noshow.patientName);
  }
}
