import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ReportsService } from '../data-access/services/reports.service';
import { 
  ReportDefinition, 
  ReportResult, 
  ReportExecution,
  RevenueReport,
  ClaimsAgingReport,
  DenialReport,
  ProductivityReport,
  PayerMixReport
} from '../data-access/models/reports.model';

type FinancialReportType = 'revenue' | 'aging' | 'denials' | 'productivity' | 'payer-mix';

@Component({
  selector: 'app-financial-reports',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="financial-reports">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <h1>Financial Reports</h1>
          <p class="subtitle">Revenue analysis, claims aging, and financial performance</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="exportReport()">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
            Export
          </button>
          <button class="btn btn-secondary" (click)="scheduleReport()">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            Schedule
          </button>
        </div>
      </header>

      <!-- Report Type Tabs -->
      <nav class="report-tabs">
        <button 
          class="tab-btn" 
          [class.active]="activeReport() === 'revenue'"
          (click)="setActiveReport('revenue')">
          <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          Revenue Summary
        </button>
        <button 
          class="tab-btn" 
          [class.active]="activeReport() === 'aging'"
          (click)="setActiveReport('aging')">
          <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Claims Aging
        </button>
        <button 
          class="tab-btn" 
          [class.active]="activeReport() === 'denials'"
          (click)="setActiveReport('denials')">
          <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          Denial Analysis
        </button>
        <button 
          class="tab-btn" 
          [class.active]="activeReport() === 'productivity'"
          (click)="setActiveReport('productivity')">
          <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Productivity
        </button>
        <button 
          class="tab-btn" 
          [class.active]="activeReport() === 'payer-mix'"
          (click)="setActiveReport('payer-mix')">
          <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>
            <path d="M22 12A10 10 0 0 0 12 2v10z"/>
          </svg>
          Payer Mix
        </button>
      </nav>

      <!-- Filters -->
      <div class="filters-bar">
        <form [formGroup]="filterForm" class="filters-form">
          <div class="filter-group">
            <label>Date Range</label>
            <div class="date-range">
              <input type="date" formControlName="startDate">
              <span>to</span>
              <input type="date" formControlName="endDate">
            </div>
          </div>
          
          @if (activeReport() === 'revenue' || activeReport() === 'productivity') {
            <div class="filter-group">
              <label>Group By</label>
              <select formControlName="groupBy">
                <option value="month">Month</option>
                <option value="provider">Provider</option>
                <option value="location">Location</option>
                <option value="payer">Payer</option>
              </select>
            </div>
          }

          @if (activeReport() === 'aging' || activeReport() === 'denials') {
            <div class="filter-group">
              <label>Payer</label>
              <select formControlName="payer">
                <option value="">All Payers</option>
                <option value="medicare">Medicare</option>
                <option value="medicaid">Medicaid</option>
                <option value="bcbs">Blue Cross Blue Shield</option>
                <option value="aetna">Aetna</option>
                <option value="united">United Healthcare</option>
                <option value="self-pay">Self Pay</option>
              </select>
            </div>
          }

          @if (activeReport() === 'productivity') {
            <div class="filter-group">
              <label>Provider</label>
              <select formControlName="provider">
                <option value="">All Providers</option>
                <option value="dr-smith">Dr. Smith</option>
                <option value="dr-johnson">Dr. Johnson</option>
                <option value="dr-williams">Dr. Williams</option>
              </select>
            </div>
          }
        </form>

        <button class="btn btn-primary" (click)="runReport()">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          Run Report
        </button>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Generating report...</p>
        </div>
      }

      <!-- Report Content -->
      @if (!loading() && reportResult()) {
        <!-- Revenue Summary Report -->
        @if (activeReport() === 'revenue') {
          <div class="report-content revenue-report">
            <!-- Summary Cards -->
            <div class="summary-cards">
              <div class="summary-card">
                <span class="card-label">Gross Charges</span>
                <span class="card-value">{{ revenueSummary().grossCharges | currency }}</span>
                <span class="card-trend positive">+8.3% vs prior period</span>
              </div>
              <div class="summary-card">
                <span class="card-label">Net Revenue</span>
                <span class="card-value">{{ revenueSummary().netRevenue | currency }}</span>
                <span class="card-trend positive">+5.2% vs prior period</span>
              </div>
              <div class="summary-card">
                <span class="card-label">Total Collections</span>
                <span class="card-value">{{ revenueSummary().totalCollections | currency }}</span>
                <span class="card-trend positive">+6.7% vs prior period</span>
              </div>
              <div class="summary-card">
                <span class="card-label">Collection Rate</span>
                <span class="card-value">{{ revenueSummary().collectionRate | percent:'1.1-1' }}</span>
                <span class="card-trend" [class.positive]="revenueSummary().collectionRate > 0.95" [class.negative]="revenueSummary().collectionRate < 0.90">
                  Target: 95%
                </span>
              </div>
            </div>

            <!-- Revenue Chart -->
            <div class="chart-container">
              <h3>Revenue Trend</h3>
              <div class="bar-chart">
                @for (item of revenueData(); track item.period) {
                  <div class="chart-bar-group">
                    <div class="bars">
                      <div class="bar charges" [style.height.%]="(item.grossCharges / maxRevenue()) * 100" 
                           [title]="'Charges: ' + (item.grossCharges | currency)"></div>
                      <div class="bar collections" [style.height.%]="(item.totalCollections / maxRevenue()) * 100"
                           [title]="'Collections: ' + (item.totalCollections | currency)"></div>
                    </div>
                    <span class="bar-label">{{ item.period }}</span>
                  </div>
                }
              </div>
              <div class="chart-legend">
                <span class="legend-item"><span class="legend-color charges"></span> Gross Charges</span>
                <span class="legend-item"><span class="legend-color collections"></span> Collections</span>
              </div>
            </div>

            <!-- Revenue Table -->
            <div class="data-table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th class="text-right">Gross Charges</th>
                    <th class="text-right">Adjustments</th>
                    <th class="text-right">Net Revenue</th>
                    <th class="text-right">Patient Payments</th>
                    <th class="text-right">Insurance Payments</th>
                    <th class="text-right">Total Collections</th>
                    <th class="text-right">Outstanding A/R</th>
                    <th class="text-right">Collection Rate</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of revenueData(); track row.period) {
                    <tr>
                      <td>{{ row.period }}</td>
                      <td class="text-right">{{ row.grossCharges | currency }}</td>
                      <td class="text-right text-danger">{{ row.contractualAdjustments + row.otherAdjustments | currency }}</td>
                      <td class="text-right">{{ row.netRevenue | currency }}</td>
                      <td class="text-right">{{ row.patientPayments | currency }}</td>
                      <td class="text-right">{{ row.insurancePayments | currency }}</td>
                      <td class="text-right font-semibold">{{ row.totalCollections | currency }}</td>
                      <td class="text-right">{{ row.outstandingAR | currency }}</td>
                      <td class="text-right">
                        <span class="rate-badge" [class.good]="row.collectionRate >= 0.95" [class.warning]="row.collectionRate >= 0.90 && row.collectionRate < 0.95" [class.danger]="row.collectionRate < 0.90">
                          {{ row.collectionRate | percent:'1.1-1' }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
                <tfoot>
                  <tr>
                    <td><strong>Total</strong></td>
                    <td class="text-right"><strong>{{ revenueSummary().grossCharges | currency }}</strong></td>
                    <td class="text-right text-danger"><strong>{{ revenueSummary().totalAdjustments | currency }}</strong></td>
                    <td class="text-right"><strong>{{ revenueSummary().netRevenue | currency }}</strong></td>
                    <td class="text-right"><strong>{{ revenueSummary().patientPayments | currency }}</strong></td>
                    <td class="text-right"><strong>{{ revenueSummary().insurancePayments | currency }}</strong></td>
                    <td class="text-right"><strong>{{ revenueSummary().totalCollections | currency }}</strong></td>
                    <td class="text-right"><strong>{{ revenueSummary().outstandingAR | currency }}</strong></td>
                    <td class="text-right">
                      <span class="rate-badge" [class.good]="revenueSummary().collectionRate >= 0.95">
                        {{ revenueSummary().collectionRate | percent:'1.1-1' }}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        }

        <!-- Claims Aging Report -->
        @if (activeReport() === 'aging') {
          <div class="report-content aging-report">
            <!-- Aging Summary -->
            <div class="aging-summary">
              <div class="total-ar-card">
                <span class="ar-label">Total Accounts Receivable</span>
                <span class="ar-value">{{ agingSummary().totalAR | currency }}</span>
                <span class="ar-claims">{{ agingSummary().totalClaims }} claims</span>
              </div>
              <div class="days-ar-card">
                <span class="days-label">Days in A/R</span>
                <span class="days-value">{{ agingSummary().daysInAR }}</span>
                <span class="days-target" [class.good]="agingSummary().daysInAR <= 35" [class.warning]="agingSummary().daysInAR > 35 && agingSummary().daysInAR <= 45">
                  Target: ≤35 days
                </span>
              </div>
            </div>

            <!-- Aging Buckets -->
            <div class="aging-buckets">
              @for (bucket of agingData(); track bucket.ageBucket) {
                <div class="bucket-card" [class.current]="bucket.ageBucket === 'Current'" 
                     [class.warning]="bucket.ageBucket === '31-60 Days' || bucket.ageBucket === '61-90 Days'"
                     [class.danger]="bucket.ageBucket === '91-120 Days' || bucket.ageBucket === '120+ Days'">
                  <div class="bucket-header">
                    <span class="bucket-name">{{ bucket.ageBucket }}</span>
                    <span class="bucket-percent">{{ bucket.percentOfTotal | percent:'1.1-1' }}</span>
                  </div>
                  <div class="bucket-amount">{{ bucket.totalAmount | currency }}</div>
                  <div class="bucket-claims">{{ bucket.claimCount }} claims</div>
                  <div class="bucket-bar">
                    <div class="bucket-bar-fill" [style.width.%]="bucket.percentOfTotal * 100"></div>
                  </div>
                </div>
              }
            </div>

            <!-- Aging by Payer -->
            <div class="aging-by-payer">
              <h3>Aging by Payer</h3>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Payer</th>
                    <th class="text-right">Current</th>
                    <th class="text-right">1-30 Days</th>
                    <th class="text-right">31-60 Days</th>
                    <th class="text-right">61-90 Days</th>
                    <th class="text-right">91-120 Days</th>
                    <th class="text-right">120+ Days</th>
                    <th class="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  @for (payer of agingByPayer(); track payer.name) {
                    <tr>
                      <td>{{ payer.name }}</td>
                      <td class="text-right">{{ payer.current | currency }}</td>
                      <td class="text-right">{{ payer.days30 | currency }}</td>
                      <td class="text-right">{{ payer.days60 | currency }}</td>
                      <td class="text-right">{{ payer.days90 | currency }}</td>
                      <td class="text-right">{{ payer.days120 | currency }}</td>
                      <td class="text-right text-danger">{{ payer.days120Plus | currency }}</td>
                      <td class="text-right font-semibold">{{ payer.total | currency }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- Denial Analysis Report -->
        @if (activeReport() === 'denials') {
          <div class="report-content denials-report">
            <!-- Denial Summary -->
            <div class="denial-summary">
              <div class="summary-card">
                <span class="card-label">Total Denials</span>
                <span class="card-value">{{ denialSummary().totalDenials }}</span>
                <span class="card-subtext">claims</span>
              </div>
              <div class="summary-card danger">
                <span class="card-label">Denied Amount</span>
                <span class="card-value">{{ denialSummary().deniedAmount | currency }}</span>
                <span class="card-trend negative">-12.3% vs prior period</span>
              </div>
              <div class="summary-card">
                <span class="card-label">Denial Rate</span>
                <span class="card-value">{{ denialSummary().denialRate | percent:'1.1-1' }}</span>
                <span class="card-trend" [class.positive]="denialSummary().denialRate < 0.05">Target: &lt;5%</span>
              </div>
              <div class="summary-card warning">
                <span class="card-label">Pending Appeals</span>
                <span class="card-value">{{ denialSummary().pendingAppeals }}</span>
                <span class="card-subtext">{{ denialSummary().appealAmount | currency }}</span>
              </div>
            </div>

            <!-- Denial by Category -->
            <div class="denial-categories">
              <h3>Denials by Category</h3>
              <div class="category-bars">
                @for (category of denialCategories(); track category.name) {
                  <div class="category-bar-item">
                    <div class="category-info">
                      <span class="category-name">{{ category.name }}</span>
                      <span class="category-count">{{ category.count }} ({{ category.amount | currency }})</span>
                    </div>
                    <div class="category-bar">
                      <div class="category-bar-fill" [style.width.%]="(category.count / denialSummary().totalDenials) * 100"></div>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Denial Details Table -->
            <div class="data-table-container">
              <h3>Denial Details</h3>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Claim #</th>
                    <th>Service Date</th>
                    <th>Patient</th>
                    <th>Payer</th>
                    <th class="text-right">Charged</th>
                    <th class="text-right">Denied</th>
                    <th>Denial Code</th>
                    <th>Reason</th>
                    <th>Category</th>
                    <th>Appeal Status</th>
                    <th>Age</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (denial of denialData(); track denial.claimId) {
                    <tr>
                      <td>
                        <a href="javascript:void(0)" class="claim-link">{{ denial.claimNumber }}</a>
                      </td>
                      <td>{{ denial.serviceDate | date:'shortDate' }}</td>
                      <td>{{ denial.patientName }}</td>
                      <td>{{ denial.payer }}</td>
                      <td class="text-right">{{ denial.chargedAmount | currency }}</td>
                      <td class="text-right text-danger">{{ denial.deniedAmount | currency }}</td>
                      <td><code class="denial-code">{{ denial.denialCode }}</code></td>
                      <td class="denial-reason">{{ denial.denialReason }}</td>
                      <td>
                        <span class="category-badge">{{ denial.denialCategory }}</span>
                      </td>
                      <td>
                        <span class="appeal-badge" [class]="denial.appealStatus">
                          {{ denial.appealStatus | titlecase }}
                        </span>
                      </td>
                      <td>{{ denial.daysSinceDenial }} days</td>
                      <td>
                        <div class="action-buttons">
                          <button class="btn-icon" title="View Claim" (click)="viewClaim(denial.claimId)">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          </button>
                          @if (denial.appealStatus === 'none') {
                            <button class="btn-icon" title="File Appeal" (click)="fileAppeal(denial.claimId)">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="12" y1="18" x2="12" y2="12"/>
                                <line x1="9" y1="15" x2="15" y2="15"/>
                              </svg>
                            </button>
                          }
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- Productivity Report -->
        @if (activeReport() === 'productivity') {
          <div class="report-content productivity-report">
            <!-- Productivity Summary -->
            <div class="productivity-summary">
              <div class="summary-card">
                <span class="card-label">Total Encounters</span>
                <span class="card-value">{{ productivitySummary().totalEncounters }}</span>
                <span class="card-trend positive">+5.8% vs prior period</span>
              </div>
              <div class="summary-card">
                <span class="card-label">Total RVUs</span>
                <span class="card-value">{{ productivitySummary().totalRVUs | number:'1.0-0' }}</span>
                <span class="card-trend positive">+7.2% vs prior period</span>
              </div>
              <div class="summary-card">
                <span class="card-label">Total Charges</span>
                <span class="card-value">{{ productivitySummary().totalCharges | currency }}</span>
              </div>
              <div class="summary-card">
                <span class="card-label">Avg Encounters/Day</span>
                <span class="card-value">{{ productivitySummary().avgEncountersPerDay | number:'1.1-1' }}</span>
              </div>
            </div>

            <!-- Productivity Table -->
            <div class="data-table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Specialty</th>
                    <th class="text-right">Encounters</th>
                    <th class="text-right">Patients</th>
                    <th class="text-right">New Patients</th>
                    <th class="text-right">Procedures</th>
                    <th class="text-right">RVUs</th>
                    <th class="text-right">Charges</th>
                    <th class="text-right">Collections</th>
                    <th class="text-right">Avg Time</th>
                    <th class="text-right">No-Show Rate</th>
                  </tr>
                </thead>
                <tbody>
                  @for (provider of productivityData(); track provider.providerId) {
                    <tr>
                      <td class="font-semibold">{{ provider.providerName }}</td>
                      <td>{{ provider.specialty }}</td>
                      <td class="text-right">{{ provider.encounterCount }}</td>
                      <td class="text-right">{{ provider.patientCount }}</td>
                      <td class="text-right">{{ provider.newPatients }}</td>
                      <td class="text-right">{{ provider.procedures }}</td>
                      <td class="text-right">{{ provider.rvus | number:'1.1-1' }}</td>
                      <td class="text-right">{{ provider.charges | currency }}</td>
                      <td class="text-right">{{ provider.collections | currency }}</td>
                      <td class="text-right">{{ provider.avgEncounterTime }} min</td>
                      <td class="text-right">
                        <span class="rate-badge" [class.good]="provider.noShowRate < 0.05" [class.warning]="provider.noShowRate >= 0.05 && provider.noShowRate < 0.10" [class.danger]="provider.noShowRate >= 0.10">
                          {{ provider.noShowRate | percent:'1.1-1' }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2"><strong>Total</strong></td>
                    <td class="text-right"><strong>{{ productivitySummary().totalEncounters }}</strong></td>
                    <td class="text-right"><strong>{{ productivitySummary().totalPatients }}</strong></td>
                    <td class="text-right"><strong>{{ productivitySummary().totalNewPatients }}</strong></td>
                    <td class="text-right"><strong>{{ productivitySummary().totalProcedures }}</strong></td>
                    <td class="text-right"><strong>{{ productivitySummary().totalRVUs | number:'1.1-1' }}</strong></td>
                    <td class="text-right"><strong>{{ productivitySummary().totalCharges | currency }}</strong></td>
                    <td class="text-right"><strong>{{ productivitySummary().totalCollections | currency }}</strong></td>
                    <td class="text-right"><strong>{{ productivitySummary().avgEncounterTime }} min</strong></td>
                    <td class="text-right">
                      <span class="rate-badge" [class.good]="productivitySummary().avgNoShowRate < 0.05">
                        {{ productivitySummary().avgNoShowRate | percent:'1.1-1' }}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <!-- RVU Chart -->
            <div class="chart-container">
              <h3>RVUs by Provider</h3>
              <div class="horizontal-bar-chart">
                @for (provider of productivityData(); track provider.providerId) {
                  <div class="h-bar-item">
                    <span class="h-bar-label">{{ provider.providerName }}</span>
                    <div class="h-bar-container">
                      <div class="h-bar-fill" [style.width.%]="(provider.rvus / maxRVUs()) * 100"></div>
                      <span class="h-bar-value">{{ provider.rvus | number:'1.0-0' }}</span>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        }

        <!-- Payer Mix Report -->
        @if (activeReport() === 'payer-mix') {
          <div class="report-content payer-mix-report">
            <!-- Payer Distribution -->
            <div class="payer-distribution">
              <div class="pie-chart-container">
                <h3>Revenue by Payer Type</h3>
                <div class="pie-chart">
                  <svg viewBox="0 0 100 100" class="donut-chart">
                    @for (segment of payerChartSegments(); track segment.payer; let i = $index) {
                      <circle 
                        cx="50" cy="50" r="40"
                        fill="transparent"
                        [attr.stroke]="segment.color"
                        stroke-width="20"
                        [attr.stroke-dasharray]="segment.dashArray"
                        [attr.stroke-dashoffset]="segment.dashOffset"
                        [attr.transform]="'rotate(-90 50 50)'"
                      />
                    }
                  </svg>
                  <div class="donut-center">
                    <span class="donut-total">{{ payerMixSummary().totalRevenue | currency:'USD':'symbol':'1.0-0' }}</span>
                    <span class="donut-label">Total Revenue</span>
                  </div>
                </div>
                <div class="pie-legend">
                  @for (segment of payerChartSegments(); track segment.payer) {
                    <div class="legend-item">
                      <span class="legend-color" [style.background-color]="segment.color"></span>
                      <span class="legend-label">{{ segment.payer }}</span>
                      <span class="legend-value">{{ segment.percent | percent:'1.1-1' }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- Payer Mix Table -->
            <div class="data-table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Payer</th>
                    <th>Type</th>
                    <th class="text-right">Patients</th>
                    <th class="text-right">Claims</th>
                    <th class="text-right">Charges</th>
                    <th class="text-right">Payments</th>
                    <th class="text-right">Adjustments</th>
                    <th class="text-right">% of Revenue</th>
                    <th class="text-right">Avg Reimbursement</th>
                  </tr>
                </thead>
                <tbody>
                  @for (payer of payerMixData(); track payer.payer) {
                    <tr>
                      <td class="font-semibold">{{ payer.payer }}</td>
                      <td>
                        <span class="payer-type-badge" [class]="payer.payerType">{{ payer.payerType | titlecase }}</span>
                      </td>
                      <td class="text-right">{{ payer.patientCount }}</td>
                      <td class="text-right">{{ payer.claimCount }}</td>
                      <td class="text-right">{{ payer.chargesAmount | currency }}</td>
                      <td class="text-right">{{ payer.paymentsAmount | currency }}</td>
                      <td class="text-right text-danger">{{ payer.adjustmentsAmount | currency }}</td>
                      <td class="text-right">
                        <div class="percent-bar-cell">
                          <div class="mini-bar">
                            <div class="mini-bar-fill" [style.width.%]="payer.percentOfRevenue * 100"></div>
                          </div>
                          <span>{{ payer.percentOfRevenue | percent:'1.1-1' }}</span>
                        </div>
                      </td>
                      <td class="text-right">
                        <span class="rate-badge" [class.good]="payer.avgReimbursementRate >= 0.80" [class.warning]="payer.avgReimbursementRate >= 0.60 && payer.avgReimbursementRate < 0.80">
                          {{ payer.avgReimbursementRate | percent:'1.0-0' }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      }

      <!-- Export Modal -->
      @if (showExportModal()) {
        <div class="modal-overlay" (click)="showExportModal.set(false)">
          <div class="modal export-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Export Report</h2>
              <button class="close-btn" (click)="showExportModal.set(false)">×</button>
            </div>
            <div class="modal-body">
              <div class="export-options">
                <label class="export-option">
                  <input type="radio" name="exportFormat" value="pdf" [(ngModel)]="exportFormat" [ngModelOptions]="{standalone: true}">
                  <div class="option-content">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <span class="option-label">PDF Document</span>
                    <span class="option-desc">Best for printing and sharing</span>
                  </div>
                </label>
                <label class="export-option">
                  <input type="radio" name="exportFormat" value="excel" [(ngModel)]="exportFormat" [ngModelOptions]="{standalone: true}">
                  <div class="option-content">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <line x1="3" y1="9" x2="21" y2="9"/>
                      <line x1="3" y1="15" x2="21" y2="15"/>
                      <line x1="9" y1="3" x2="9" y2="21"/>
                      <line x1="15" y1="3" x2="15" y2="21"/>
                    </svg>
                    <span class="option-label">Excel Spreadsheet</span>
                    <span class="option-desc">Best for data analysis</span>
                  </div>
                </label>
                <label class="export-option">
                  <input type="radio" name="exportFormat" value="csv" [(ngModel)]="exportFormat" [ngModelOptions]="{standalone: true}">
                  <div class="option-content">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="8" y1="13" x2="16" y2="13"/>
                      <line x1="8" y1="17" x2="16" y2="17"/>
                    </svg>
                    <span class="option-label">CSV File</span>
                    <span class="option-desc">Universal format for import</span>
                  </div>
                </label>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="showExportModal.set(false)">Cancel</button>
              <button class="btn btn-primary" (click)="confirmExport()">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                Export
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Schedule Modal -->
      @if (showScheduleModal()) {
        <div class="modal-overlay" (click)="showScheduleModal.set(false)">
          <div class="modal schedule-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Schedule Report</h2>
              <button class="close-btn" (click)="showScheduleModal.set(false)">×</button>
            </div>
            <div class="modal-body">
              <form [formGroup]="scheduleForm">
                <div class="form-group">
                  <label>Frequency</label>
                  <select formControlName="frequency">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>
                
                @if (scheduleForm.get('frequency')?.value === 'weekly') {
                  <div class="form-group">
                    <label>Day of Week</label>
                    <select formControlName="dayOfWeek">
                      <option value="1">Monday</option>
                      <option value="2">Tuesday</option>
                      <option value="3">Wednesday</option>
                      <option value="4">Thursday</option>
                      <option value="5">Friday</option>
                    </select>
                  </div>
                }

                @if (scheduleForm.get('frequency')?.value === 'monthly') {
                  <div class="form-group">
                    <label>Day of Month</label>
                    <select formControlName="dayOfMonth">
                      @for (day of [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28]; track day) {
                        <option [value]="day">{{ day }}</option>
                      }
                    </select>
                  </div>
                }

                <div class="form-group">
                  <label>Time</label>
                  <input type="time" formControlName="time">
                </div>

                <div class="form-group">
                  <label>Format</label>
                  <select formControlName="format">
                    <option value="pdf">PDF</option>
                    <option value="excel">Excel</option>
                    <option value="csv">CSV</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Recipients (comma-separated emails)</label>
                  <input type="text" formControlName="recipients" placeholder="email@example.com">
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="showScheduleModal.set(false)">Cancel</button>
              <button class="btn btn-primary" (click)="confirmSchedule()">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                Schedule Report
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .financial-reports {
      padding: 1.5rem;
      max-width: 1600px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .page-header h1 {
      font-size: 1.75rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }

    .subtitle {
      color: #6b7280;
      margin: 0.25rem 0 0 0;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      border-radius: 0.5rem;
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.15s;
      border: none;
    }

    .btn-primary {
      background: #2563eb;
      color: white;
    }

    .btn-primary:hover {
      background: #1d4ed8;
    }

    .btn-secondary {
      background: white;
      color: #374151;
      border: 1px solid #d1d5db;
    }

    .btn-secondary:hover {
      background: #f9fafb;
    }

    .btn .icon {
      width: 1rem;
      height: 1rem;
    }

    /* Report Tabs */
    .report-tabs {
      display: flex;
      gap: 0.25rem;
      background: #f3f4f6;
      padding: 0.25rem;
      border-radius: 0.75rem;
      margin-bottom: 1.5rem;
      overflow-x: auto;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border: none;
      background: transparent;
      color: #6b7280;
      font-weight: 500;
      font-size: 0.875rem;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.15s;
      white-space: nowrap;
    }

    .tab-btn:hover {
      color: #374151;
      background: rgba(255,255,255,0.5);
    }

    .tab-btn.active {
      background: white;
      color: #2563eb;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .tab-icon {
      width: 1.125rem;
      height: 1.125rem;
    }

    /* Filters */
    .filters-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 1rem;
      padding: 1rem;
      background: white;
      border-radius: 0.75rem;
      border: 1px solid #e5e7eb;
      margin-bottom: 1.5rem;
    }

    .filters-form {
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .filter-group label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .filter-group select,
    .filter-group input[type="date"] {
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      min-width: 140px;
    }

    .date-range {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .date-range span {
      color: #6b7280;
      font-size: 0.875rem;
    }

    /* Loading State */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      color: #6b7280;
    }

    .spinner {
      width: 2.5rem;
      height: 2.5rem;
      border: 3px solid #e5e7eb;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Report Content */
    .report-content {
      background: white;
      border-radius: 0.75rem;
      border: 1px solid #e5e7eb;
      padding: 1.5rem;
    }

    /* Summary Cards */
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .summary-card {
      padding: 1.25rem;
      background: #f9fafb;
      border-radius: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .summary-card.danger {
      background: #fef2f2;
    }

    .summary-card.warning {
      background: #fffbeb;
    }

    .card-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .card-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: #111827;
    }

    .card-trend {
      font-size: 0.75rem;
      font-weight: 500;
    }

    .card-trend.positive {
      color: #059669;
    }

    .card-trend.negative {
      color: #dc2626;
    }

    .card-subtext {
      font-size: 0.75rem;
      color: #6b7280;
    }

    /* Chart Container */
    .chart-container {
      margin-bottom: 2rem;
    }

    .chart-container h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #374151;
      margin: 0 0 1rem 0;
    }

    /* Bar Chart */
    .bar-chart {
      display: flex;
      align-items: flex-end;
      gap: 1rem;
      height: 200px;
      padding: 1rem 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .chart-bar-group {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .bars {
      display: flex;
      gap: 0.25rem;
      height: 180px;
      align-items: flex-end;
    }

    .bar {
      width: 24px;
      border-radius: 0.25rem 0.25rem 0 0;
      transition: height 0.3s ease;
      cursor: pointer;
    }

    .bar.charges {
      background: #93c5fd;
    }

    .bar.collections {
      background: #2563eb;
    }

    .bar:hover {
      opacity: 0.8;
    }

    .bar-label {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .chart-legend {
      display: flex;
      justify-content: center;
      gap: 2rem;
      margin-top: 1rem;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 0.25rem;
    }

    .legend-color.charges {
      background: #93c5fd;
    }

    .legend-color.collections {
      background: #2563eb;
    }

    /* Horizontal Bar Chart */
    .horizontal-bar-chart {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .h-bar-item {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .h-bar-label {
      width: 150px;
      font-size: 0.875rem;
      color: #374151;
      font-weight: 500;
    }

    .h-bar-container {
      flex: 1;
      height: 24px;
      background: #f3f4f6;
      border-radius: 0.25rem;
      position: relative;
      display: flex;
      align-items: center;
    }

    .h-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #2563eb, #3b82f6);
      border-radius: 0.25rem;
      transition: width 0.3s ease;
    }

    .h-bar-value {
      position: absolute;
      right: 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #374151;
    }

    /* Data Table */
    .data-table-container {
      overflow-x: auto;
      margin-bottom: 1.5rem;
    }

    .data-table-container h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #374151;
      margin: 0 0 1rem 0;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .data-table th,
    .data-table td {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }

    .data-table th {
      background: #f9fafb;
      font-weight: 600;
      color: #374151;
      white-space: nowrap;
    }

    .data-table tbody tr:hover {
      background: #f9fafb;
    }

    .data-table tfoot td {
      background: #f3f4f6;
      font-weight: 600;
    }

    .text-right {
      text-align: right !important;
    }

    .text-danger {
      color: #dc2626;
    }

    .font-semibold {
      font-weight: 600;
    }

    /* Rate Badge */
    .rate-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      background: #f3f4f6;
      color: #6b7280;
    }

    .rate-badge.good {
      background: #d1fae5;
      color: #059669;
    }

    .rate-badge.warning {
      background: #fef3c7;
      color: #d97706;
    }

    .rate-badge.danger {
      background: #fee2e2;
      color: #dc2626;
    }

    /* Aging Report Specific */
    .aging-summary {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .total-ar-card,
    .days-ar-card {
      padding: 1.5rem;
      background: #f9fafb;
      border-radius: 0.75rem;
      text-align: center;
    }

    .total-ar-card {
      flex: 2;
    }

    .days-ar-card {
      flex: 1;
    }

    .ar-label,
    .days-label {
      display: block;
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 0.5rem;
    }

    .ar-value {
      display: block;
      font-size: 2.5rem;
      font-weight: 700;
      color: #111827;
    }

    .ar-claims {
      display: block;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .days-value {
      display: block;
      font-size: 2.5rem;
      font-weight: 700;
      color: #111827;
    }

    .days-target {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      margin-top: 0.25rem;
    }

    .days-target.good {
      color: #059669;
    }

    .days-target.warning {
      color: #d97706;
    }

    /* Aging Buckets */
    .aging-buckets {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .bucket-card {
      padding: 1rem;
      border-radius: 0.5rem;
      border: 1px solid #e5e7eb;
      background: white;
    }

    .bucket-card.current {
      border-color: #86efac;
      background: #f0fdf4;
    }

    .bucket-card.warning {
      border-color: #fcd34d;
      background: #fffbeb;
    }

    .bucket-card.danger {
      border-color: #fca5a5;
      background: #fef2f2;
    }

    .bucket-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .bucket-name {
      font-weight: 600;
      color: #374151;
      font-size: 0.875rem;
    }

    .bucket-percent {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .bucket-amount {
      font-size: 1.25rem;
      font-weight: 700;
      color: #111827;
    }

    .bucket-claims {
      font-size: 0.75rem;
      color: #6b7280;
      margin-bottom: 0.75rem;
    }

    .bucket-bar {
      height: 4px;
      background: #e5e7eb;
      border-radius: 2px;
      overflow: hidden;
    }

    .bucket-bar-fill {
      height: 100%;
      background: #2563eb;
      border-radius: 2px;
    }

    .bucket-card.current .bucket-bar-fill {
      background: #22c55e;
    }

    .bucket-card.warning .bucket-bar-fill {
      background: #f59e0b;
    }

    .bucket-card.danger .bucket-bar-fill {
      background: #ef4444;
    }

    .aging-by-payer h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #374151;
      margin: 0 0 1rem 0;
    }

    /* Denial Report Specific */
    .denial-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .denial-categories {
      margin-bottom: 2rem;
    }

    .denial-categories h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #374151;
      margin: 0 0 1rem 0;
    }

    .category-bars {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .category-bar-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .category-info {
      display: flex;
      justify-content: space-between;
    }

    .category-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }

    .category-count {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .category-bar {
      height: 8px;
      background: #f3f4f6;
      border-radius: 4px;
      overflow: hidden;
    }

    .category-bar-fill {
      height: 100%;
      background: #ef4444;
      border-radius: 4px;
    }

    .claim-link {
      color: #2563eb;
      text-decoration: none;
      font-weight: 500;
    }

    .claim-link:hover {
      text-decoration: underline;
    }

    .denial-code {
      background: #f3f4f6;
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-family: monospace;
    }

    .denial-reason {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .category-badge {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      background: #f3f4f6;
      border-radius: 9999px;
      font-size: 0.75rem;
      color: #6b7280;
    }

    .appeal-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .appeal-badge.none {
      background: #f3f4f6;
      color: #6b7280;
    }

    .appeal-badge.pending {
      background: #fef3c7;
      color: #d97706;
    }

    .appeal-badge.approved {
      background: #d1fae5;
      color: #059669;
    }

    .appeal-badge.denied {
      background: #fee2e2;
      color: #dc2626;
    }

    .action-buttons {
      display: flex;
      gap: 0.25rem;
    }

    .btn-icon {
      padding: 0.375rem;
      border: none;
      background: transparent;
      color: #6b7280;
      border-radius: 0.375rem;
      cursor: pointer;
    }

    .btn-icon:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-icon svg {
      width: 1rem;
      height: 1rem;
    }

    /* Payer Mix Specific */
    .payer-distribution {
      margin-bottom: 2rem;
    }

    .pie-chart-container {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .pie-chart-container h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #374151;
      margin: 0 0 1.5rem 0;
    }

    .pie-chart {
      position: relative;
      width: 240px;
      height: 240px;
      margin-bottom: 1.5rem;
    }

    .donut-chart {
      width: 100%;
      height: 100%;
    }

    .donut-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
    }

    .donut-total {
      display: block;
      font-size: 1.25rem;
      font-weight: 700;
      color: #111827;
    }

    .donut-label {
      display: block;
      font-size: 0.75rem;
      color: #6b7280;
    }

    .pie-legend {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 1rem;
    }

    .pie-legend .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .pie-legend .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 2px;
    }

    .pie-legend .legend-label {
      font-size: 0.875rem;
      color: #374151;
    }

    .pie-legend .legend-value {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .payer-type-badge {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .payer-type-badge.commercial {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .payer-type-badge.medicare {
      background: #d1fae5;
      color: #059669;
    }

    .payer-type-badge.medicaid {
      background: #fef3c7;
      color: #d97706;
    }

    .payer-type-badge.self-pay {
      background: #f3f4f6;
      color: #6b7280;
    }

    .percent-bar-cell {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .mini-bar {
      width: 60px;
      height: 6px;
      background: #f3f4f6;
      border-radius: 3px;
      overflow: hidden;
    }

    .mini-bar-fill {
      height: 100%;
      background: #2563eb;
      border-radius: 3px;
    }

    /* Modal Styles */
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
      border-radius: 0.75rem;
      width: 100%;
      max-width: 480px;
      max-height: 90vh;
      overflow: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h2 {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #6b7280;
      cursor: pointer;
      line-height: 1;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid #e5e7eb;
      background: #f9fafb;
    }

    /* Export Options */
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
      flex: 1;
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 0.5rem;
      transition: all 0.15s;
    }

    .export-option input:checked + .option-content {
      border-color: #2563eb;
      background: #eff6ff;
    }

    .export-option svg {
      width: 2rem;
      height: 2rem;
      color: #6b7280;
    }

    .export-option input:checked + .option-content svg {
      color: #2563eb;
    }

    .option-label {
      font-weight: 600;
      color: #374151;
      display: block;
    }

    .option-desc {
      font-size: 0.75rem;
      color: #6b7280;
      display: block;
    }

    /* Schedule Form */
    .schedule-modal .form-group {
      margin-bottom: 1rem;
    }

    .schedule-modal label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.375rem;
    }

    .schedule-modal select,
    .schedule-modal input {
      width: 100%;
      padding: 0.625rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .aging-summary {
        flex-direction: column;
      }
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 1rem;
      }

      .filters-bar {
        flex-direction: column;
        align-items: stretch;
      }

      .filters-form {
        flex-direction: column;
      }

      .summary-cards {
        grid-template-columns: 1fr 1fr;
      }

      .aging-buckets {
        grid-template-columns: 1fr 1fr;
      }
    }
  `]
})
export class FinancialReportsComponent implements OnInit {
  private reportsService = inject(ReportsService);
  private fb = inject(FormBuilder);

  // State
  activeReport = signal<FinancialReportType>('revenue');
  loading = signal(false);
  reportResult = signal<Partial<ReportResult> | null>(null);
  showExportModal = signal(false);
  showScheduleModal = signal(false);
  exportFormat = 'pdf';

  // Forms
  filterForm: FormGroup;
  scheduleForm: FormGroup;

  // Mock data for reports
  revenueData = signal<RevenueReport[]>([]);
  agingData = signal<ClaimsAgingReport[]>([]);
  denialData = signal<DenialReport[]>([]);
  productivityData = signal<ProductivityReport[]>([]);
  payerMixData = signal<PayerMixReport[]>([]);

  // Computed summaries
  revenueSummary = computed(() => {
    const data = this.revenueData();
    if (data.length === 0) return {
      grossCharges: 0, totalAdjustments: 0, netRevenue: 0,
      patientPayments: 0, insurancePayments: 0, totalCollections: 0,
      outstandingAR: 0, collectionRate: 0
    };
    return {
      grossCharges: data.reduce((sum, r) => sum + r.grossCharges, 0),
      totalAdjustments: data.reduce((sum, r) => sum + r.contractualAdjustments + r.otherAdjustments, 0),
      netRevenue: data.reduce((sum, r) => sum + r.netRevenue, 0),
      patientPayments: data.reduce((sum, r) => sum + r.patientPayments, 0),
      insurancePayments: data.reduce((sum, r) => sum + r.insurancePayments, 0),
      totalCollections: data.reduce((sum, r) => sum + r.totalCollections, 0),
      outstandingAR: data.reduce((sum, r) => sum + r.outstandingAR, 0),
      collectionRate: data.reduce((sum, r) => sum + r.totalCollections, 0) / 
                      data.reduce((sum, r) => sum + r.netRevenue, 0) || 0
    };
  });

  maxRevenue = computed(() => {
    const data = this.revenueData();
    return Math.max(...data.map(r => r.grossCharges), 1);
  });

  agingSummary = computed(() => {
    const data = this.agingData();
    return {
      totalAR: data.reduce((sum, b) => sum + b.totalAmount, 0),
      totalClaims: data.reduce((sum, b) => sum + b.claimCount, 0),
      daysInAR: 38 // Mock value
    };
  });

  agingByPayer = computed(() => {
    // Aggregate aging by payer from buckets
    const payers = new Map<string, any>();
    this.agingData().forEach(bucket => {
      bucket.byPayer?.forEach(p => {
        if (!payers.has(p.payer)) {
          payers.set(p.payer, {
            name: p.payer,
            current: 0, days30: 0, days60: 0, days90: 0, days120: 0, days120Plus: 0, total: 0
          });
        }
        const payer = payers.get(p.payer)!;
        if (bucket.ageBucket === 'Current') payer.current += p.amount;
        else if (bucket.ageBucket === '1-30 Days') payer.days30 += p.amount;
        else if (bucket.ageBucket === '31-60 Days') payer.days60 += p.amount;
        else if (bucket.ageBucket === '61-90 Days') payer.days90 += p.amount;
        else if (bucket.ageBucket === '91-120 Days') payer.days120 += p.amount;
        else payer.days120Plus += p.amount;
        payer.total += p.amount;
      });
    });
    return Array.from(payers.values());
  });

  denialSummary = computed(() => {
    const data = this.denialData();
    const pendingAppeals = data.filter(d => d.appealStatus === 'pending');
    return {
      totalDenials: data.length,
      deniedAmount: data.reduce((sum, d) => sum + d.deniedAmount, 0),
      denialRate: 0.068, // Mock rate
      pendingAppeals: pendingAppeals.length,
      appealAmount: pendingAppeals.reduce((sum, d) => sum + d.deniedAmount, 0)
    };
  });

  denialCategories = computed(() => {
    const data = this.denialData();
    const categories = new Map<string, { name: string; count: number; amount: number }>();
    data.forEach(d => {
      if (!categories.has(d.denialCategory)) {
        categories.set(d.denialCategory, { name: d.denialCategory, count: 0, amount: 0 });
      }
      const cat = categories.get(d.denialCategory)!;
      cat.count++;
      cat.amount += d.deniedAmount;
    });
    return Array.from(categories.values()).sort((a, b) => b.count - a.count);
  });

  productivitySummary = computed(() => {
    const data = this.productivityData();
    if (data.length === 0) return {
      totalEncounters: 0, totalPatients: 0, totalNewPatients: 0,
      totalProcedures: 0, totalRVUs: 0, totalCharges: 0, totalCollections: 0,
      avgEncountersPerDay: 0, avgEncounterTime: 0, avgNoShowRate: 0
    };
    return {
      totalEncounters: data.reduce((sum, p) => sum + p.encounterCount, 0),
      totalPatients: data.reduce((sum, p) => sum + p.patientCount, 0),
      totalNewPatients: data.reduce((sum, p) => sum + p.newPatients, 0),
      totalProcedures: data.reduce((sum, p) => sum + p.procedures, 0),
      totalRVUs: data.reduce((sum, p) => sum + p.rvus, 0),
      totalCharges: data.reduce((sum, p) => sum + p.charges, 0),
      totalCollections: data.reduce((sum, p) => sum + p.collections, 0),
      avgEncountersPerDay: data.reduce((sum, p) => sum + p.encounterCount, 0) / (data.length * 22),
      avgEncounterTime: Math.round(data.reduce((sum, p) => sum + p.avgEncounterTime, 0) / data.length),
      avgNoShowRate: data.reduce((sum, p) => sum + p.noShowRate, 0) / data.length
    };
  });

  maxRVUs = computed(() => {
    const data = this.productivityData();
    return Math.max(...data.map(p => p.rvus), 1);
  });

  payerMixSummary = computed(() => {
    const data = this.payerMixData();
    return {
      totalRevenue: data.reduce((sum, p) => sum + p.paymentsAmount, 0)
    };
  });

  payerChartSegments = computed(() => {
    const data = this.payerMixData();
    const total = data.reduce((sum, p) => sum + p.paymentsAmount, 0);
    const colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];
    const circumference = 2 * Math.PI * 40; // r=40
    
    let offset = 0;
    return data.map((payer, index) => {
      const percent = payer.paymentsAmount / total;
      const dashArray = `${percent * circumference} ${circumference}`;
      const segment = {
        payer: payer.payer,
        percent,
        color: colors[index % colors.length],
        dashArray,
        dashOffset: -offset
      };
      offset += percent * circumference;
      return segment;
    });
  });

  constructor() {
    this.filterForm = this.fb.group({
      startDate: [this.getDefaultStartDate()],
      endDate: [this.getDefaultEndDate()],
      groupBy: ['month'],
      payer: [''],
      provider: ['']
    });

    this.scheduleForm = this.fb.group({
      frequency: ['weekly'],
      dayOfWeek: ['1'],
      dayOfMonth: ['1'],
      time: ['08:00'],
      format: ['pdf'],
      recipients: ['']
    });
  }

  ngOnInit(): void {
    this.runReport();
  }

  getDefaultStartDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() - 6);
    return date.toISOString().split('T')[0];
  }

  getDefaultEndDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  setActiveReport(type: FinancialReportType): void {
    this.activeReport.set(type);
    this.runReport();
  }

  runReport(): void {
    this.loading.set(true);
    
    // Simulate API call
    setTimeout(() => {
      const type = this.activeReport();
      
      if (type === 'revenue') {
        this.revenueData.set(this.generateRevenueData());
      } else if (type === 'aging') {
        this.agingData.set(this.generateAgingData());
      } else if (type === 'denials') {
        this.denialData.set(this.generateDenialData());
      } else if (type === 'productivity') {
        this.productivityData.set(this.generateProductivityData());
      } else if (type === 'payer-mix') {
        this.payerMixData.set(this.generatePayerMixData());
      }

      this.reportResult.set({ reportId: type, executionId: '1', generatedAt: new Date() });
      this.loading.set(false);
    }, 800);
  }

  // Mock data generators
  generateRevenueData(): RevenueReport[] {
    const months = ['Jul 2024', 'Aug 2024', 'Sep 2024', 'Oct 2024', 'Nov 2024', 'Dec 2024'];
    return months.map(period => ({
      period,
      date: new Date(),
      grossCharges: 150000 + Math.random() * 50000,
      contractualAdjustments: 35000 + Math.random() * 10000,
      otherAdjustments: 5000 + Math.random() * 3000,
      netRevenue: 110000 + Math.random() * 40000,
      patientPayments: 25000 + Math.random() * 10000,
      insurancePayments: 75000 + Math.random() * 25000,
      totalCollections: 100000 + Math.random() * 35000,
      outstandingAR: 45000 + Math.random() * 15000,
      collectionRate: 0.88 + Math.random() * 0.1
    }));
  }

  generateAgingData(): ClaimsAgingReport[] {
    const buckets = ['Current', '1-30 Days', '31-60 Days', '61-90 Days', '91-120 Days', '120+ Days'];
    const amounts = [125000, 85000, 45000, 28000, 15000, 12000];
    const total = amounts.reduce((a, b) => a + b, 0);
    
    return buckets.map((ageBucket, i) => ({
      ageBucket,
      claimCount: Math.floor(50 + Math.random() * 100),
      totalAmount: amounts[i],
      percentOfTotal: amounts[i] / total,
      byPayer: [
        { payer: 'Medicare', count: Math.floor(20 + Math.random() * 30), amount: amounts[i] * 0.35 },
        { payer: 'BCBS', count: Math.floor(15 + Math.random() * 25), amount: amounts[i] * 0.30 },
        { payer: 'Aetna', count: Math.floor(10 + Math.random() * 20), amount: amounts[i] * 0.20 },
        { payer: 'Self Pay', count: Math.floor(5 + Math.random() * 15), amount: amounts[i] * 0.15 }
      ]
    }));
  }

  generateDenialData(): DenialReport[] {
    const denials = [
      { code: 'CO-4', reason: 'Procedure not covered', category: 'Coverage' },
      { code: 'CO-16', reason: 'Missing information', category: 'Documentation' },
      { code: 'CO-50', reason: 'Non-covered service', category: 'Coverage' },
      { code: 'CO-97', reason: 'Authorization required', category: 'Authorization' },
      { code: 'PR-1', reason: 'Deductible not met', category: 'Patient Responsibility' },
      { code: 'CO-29', reason: 'Timely filing limit exceeded', category: 'Timeliness' }
    ];

    return denials.map((d, i) => ({
      claimId: `CLM-${1000 + i}`,
      claimNumber: `CLM-2024-${1000 + i}`,
      serviceDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
      patientName: ['John Smith', 'Mary Johnson', 'Robert Williams', 'Patricia Brown', 'Michael Davis', 'Linda Miller'][i],
      payer: ['Medicare', 'BCBS', 'Aetna', 'United', 'Medicare', 'BCBS'][i],
      chargedAmount: 500 + Math.random() * 2000,
      deniedAmount: 300 + Math.random() * 1500,
      denialCode: d.code,
      denialReason: d.reason,
      denialCategory: d.category,
      appealStatus: ['none', 'pending', 'approved', 'denied', 'none', 'pending'][i],
      daysSinceDenial: Math.floor(5 + Math.random() * 60)
    }));
  }

  generateProductivityData(): ProductivityReport[] {
    const providers = [
      { name: 'Dr. Smith', specialty: 'Internal Medicine' },
      { name: 'Dr. Johnson', specialty: 'Family Medicine' },
      { name: 'Dr. Williams', specialty: 'Pediatrics' },
      { name: 'Dr. Brown', specialty: 'Internal Medicine' },
      { name: 'Dr. Davis', specialty: 'Family Medicine' }
    ];

    return providers.map((p, i) => ({
      providerId: `PROV-${i + 1}`,
      providerName: p.name,
      specialty: p.specialty,
      period: 'Dec 2024',
      encounterCount: 80 + Math.floor(Math.random() * 60),
      patientCount: 60 + Math.floor(Math.random() * 40),
      newPatients: 10 + Math.floor(Math.random() * 15),
      procedures: 40 + Math.floor(Math.random() * 30),
      rvus: 200 + Math.random() * 150,
      charges: 40000 + Math.random() * 30000,
      collections: 30000 + Math.random() * 25000,
      avgEncounterTime: 18 + Math.floor(Math.random() * 10),
      noShowRate: 0.03 + Math.random() * 0.08
    }));
  }

  generatePayerMixData(): PayerMixReport[] {
    return [
      { payer: 'Medicare', payerType: 'medicare', patientCount: 450, claimCount: 1200, chargesAmount: 580000, paymentsAmount: 380000, adjustmentsAmount: 165000, percentOfRevenue: 0.35, avgReimbursementRate: 0.65 },
      { payer: 'Blue Cross Blue Shield', payerType: 'commercial', patientCount: 380, claimCount: 950, chargesAmount: 520000, paymentsAmount: 420000, adjustmentsAmount: 78000, percentOfRevenue: 0.28, avgReimbursementRate: 0.81 },
      { payer: 'Aetna', payerType: 'commercial', patientCount: 220, claimCount: 580, chargesAmount: 320000, paymentsAmount: 256000, adjustmentsAmount: 48000, percentOfRevenue: 0.17, avgReimbursementRate: 0.80 },
      { payer: 'United Healthcare', payerType: 'commercial', patientCount: 180, claimCount: 420, chargesAmount: 240000, paymentsAmount: 192000, adjustmentsAmount: 36000, percentOfRevenue: 0.13, avgReimbursementRate: 0.80 },
      { payer: 'Medicaid', payerType: 'medicaid', patientCount: 150, claimCount: 380, chargesAmount: 180000, paymentsAmount: 90000, adjustmentsAmount: 72000, percentOfRevenue: 0.06, avgReimbursementRate: 0.50 },
      { payer: 'Self Pay', payerType: 'self-pay', patientCount: 80, claimCount: 120, chargesAmount: 85000, paymentsAmount: 25500, adjustmentsAmount: 42500, percentOfRevenue: 0.02, avgReimbursementRate: 0.30 }
    ];
  }

  exportReport(): void {
    this.showExportModal.set(true);
  }

  confirmExport(): void {
    console.log('Exporting report as', this.exportFormat);
    this.showExportModal.set(false);
  }

  scheduleReport(): void {
    this.showScheduleModal.set(true);
  }

  confirmSchedule(): void {
    console.log('Scheduling report', this.scheduleForm.value);
    this.showScheduleModal.set(false);
  }

  viewClaim(claimId: string): void {
    console.log('View claim', claimId);
  }

  fileAppeal(claimId: string): void {
    console.log('File appeal for', claimId);
  }
}
