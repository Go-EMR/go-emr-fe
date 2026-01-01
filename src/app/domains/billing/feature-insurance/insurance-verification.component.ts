import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { 
  InsurancePolicy, 
  InsuranceVerification, 
  InsuranceType,
  VerificationStatus,
  INSURANCE_TYPE_LABELS,
  VERIFICATION_STATUS_LABELS
} from '../data-access/models/billing.model';

interface VerificationRequest {
  policyId: string;
  serviceType?: string;
  serviceDate?: Date;
  procedureCodes?: string[];
  providerId?: string;
}

interface BenefitDetail {
  category: string;
  inNetwork: {
    copay?: number;
    coinsurance?: number;
    deductible?: number;
    outOfPocketMax?: number;
    covered: boolean;
    notes?: string;
  };
  outOfNetwork?: {
    copay?: number;
    coinsurance?: number;
    deductible?: number;
    outOfPocketMax?: number;
    covered: boolean;
    notes?: string;
  };
}

@Component({
  selector: 'app-insurance-verification',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="insurance-verification">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="title-section">
            <h1>Insurance Verification</h1>
            <p class="subtitle">Verify patient insurance eligibility and benefits</p>
          </div>
          <div class="header-actions">
            <button class="btn btn-outline" (click)="viewAllPolicies()">
              <span class="icon">📋</span>
              All Policies
            </button>
            <button class="btn btn-primary" (click)="startNewVerification()">
              <span class="icon">✓</span>
              New Verification
            </button>
          </div>
        </div>
      </header>

      <!-- Tab Navigation -->
      <nav class="tab-nav">
        <button 
          class="tab-btn"
          [class.active]="activeTab() === 'verify'"
          (click)="setActiveTab('verify')"
        >
          Verify Eligibility
        </button>
        <button 
          class="tab-btn"
          [class.active]="activeTab() === 'policies'"
          (click)="setActiveTab('policies')"
        >
          Patient Policies
        </button>
        <button 
          class="tab-btn"
          [class.active]="activeTab() === 'history'"
          (click)="setActiveTab('history')"
        >
          Verification History
          @if (verificationHistory().length > 0) {
            <span class="badge">{{ verificationHistory().length }}</span>
          }
        </button>
        <button 
          class="tab-btn"
          [class.active]="activeTab() === 'batch'"
          (click)="setActiveTab('batch')"
        >
          Batch Verification
        </button>
      </nav>

      <!-- Verify Eligibility Tab -->
      @if (activeTab() === 'verify') {
        <div class="tab-content verify-tab">
          <!-- Patient Search -->
          <section class="card patient-search-section">
            <h2>Select Patient</h2>
            <div class="search-row">
              <div class="search-input-wrapper">
                <span class="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search by patient name, MRN, or DOB..."
                  [(ngModel)]="patientSearch"
                  (input)="searchPatients()"
                  class="search-input"
                />
              </div>
              @if (selectedPatient()) {
                <button class="btn btn-text" (click)="clearPatient()">Clear</button>
              }
            </div>

            <!-- Search Results -->
            @if (patientSearchResults().length > 0 && !selectedPatient()) {
              <div class="search-results">
                @for (patient of patientSearchResults(); track patient.id) {
                  <div class="search-result-item" (click)="selectPatient(patient)">
                    <div class="patient-avatar">{{ patient.name.charAt(0) }}</div>
                    <div class="patient-info">
                      <span class="patient-name">{{ patient.name }}</span>
                      <span class="patient-details">MRN: {{ patient.mrn }} | DOB: {{ patient.dob | date:'MM/dd/yyyy' }}</span>
                    </div>
                  </div>
                }
              </div>
            }

            <!-- Selected Patient -->
            @if (selectedPatient()) {
              <div class="selected-patient-card">
                <div class="patient-avatar large">{{ selectedPatient()!.name.charAt(0) }}</div>
                <div class="patient-details">
                  <h3>{{ selectedPatient()!.name }}</h3>
                  <p>MRN: {{ selectedPatient()!.mrn }} | DOB: {{ selectedPatient()!.dob | date:'MM/dd/yyyy' }}</p>
                  <p>{{ selectedPatient()!.address }}</p>
                </div>
              </div>
            }
          </section>

          <!-- Insurance Policies -->
          @if (selectedPatient() && patientPolicies().length > 0) {
            <section class="card policies-section">
              <h2>Insurance Policies</h2>
              <div class="policies-list">
                @for (policy of patientPolicies(); track policy.policyId) {
                  <div 
                    class="policy-card" 
                    [class.selected]="selectedPolicy()?.policyId === policy.policyId"
                    [class.inactive]="!policy.isActive"
                    (click)="selectPolicy(policy)"
                  >
                    <div class="policy-header">
                      <div class="policy-type-badge" [class]="policy.type">
                        {{ getInsuranceTypeLabel(policy.type) }}
                      </div>
                      <div class="policy-status">
                        <span class="status-badge" [class]="policy.verificationStatus">
                          {{ getVerificationStatusLabel(policy.verificationStatus) }}
                        </span>
                      </div>
                    </div>
                    <div class="policy-body">
                      <h3>{{ policy.payerName }}</h3>
                      <div class="policy-details">
                        <p><strong>Plan:</strong> {{ policy.planName || 'N/A' }}</p>
                        <p><strong>Subscriber ID:</strong> {{ policy.subscriberId }}</p>
                        <p><strong>Group #:</strong> {{ policy.groupNumber || 'N/A' }}</p>
                      </div>
                      @if (policy.lastVerifiedDate) {
                        <p class="last-verified">
                          Last verified: {{ policy.lastVerifiedDate | date:'MM/dd/yyyy' }}
                        </p>
                      }
                    </div>
                    @if (selectedPolicy()?.policyId === policy.policyId) {
                      <div class="selected-indicator">✓</div>
                    }
                  </div>
                }
              </div>
            </section>
          }

          <!-- No Insurance Warning -->
          @if (selectedPatient() && patientPolicies().length === 0) {
            <section class="card warning-card">
              <div class="warning-content">
                <span class="warning-icon">⚠️</span>
                <div>
                  <h3>No Insurance on File</h3>
                  <p>This patient does not have any insurance policies on file.</p>
                  <button class="btn btn-primary" (click)="addInsurance()">Add Insurance</button>
                </div>
              </div>
            </section>
          }

          <!-- Verification Options -->
          @if (selectedPolicy()) {
            <section class="card verification-options">
              <h2>Verification Options</h2>
              <form [formGroup]="verificationForm" class="verification-form">
                <div class="form-row">
                  <div class="form-group">
                    <label>Service Type</label>
                    <select formControlName="serviceType">
                      <option value="">All Services</option>
                      <option value="30">Health Benefit Plan Coverage</option>
                      <option value="1">Medical Care</option>
                      <option value="2">Surgical</option>
                      <option value="3">Consultation</option>
                      <option value="4">Diagnostic X-Ray</option>
                      <option value="5">Diagnostic Lab</option>
                      <option value="6">Radiation Therapy</option>
                      <option value="7">Anesthesia</option>
                      <option value="8">Surgical Assistance</option>
                      <option value="12">Durable Medical Equipment</option>
                      <option value="14">Renal Supplies</option>
                      <option value="18">Emergency Services</option>
                      <option value="33">Chiropractic</option>
                      <option value="35">Dental Care</option>
                      <option value="42">Home Health Care</option>
                      <option value="48">Hospital - Inpatient</option>
                      <option value="50">Hospital - Outpatient</option>
                      <option value="51">Hospital - Emergency</option>
                      <option value="52">Hospital - Emergency Medical</option>
                      <option value="73">Diagnostic Medical</option>
                      <option value="86">Emergency Services - Physician</option>
                      <option value="88">Pharmacy</option>
                      <option value="98">Professional Physician Visit - Office</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Service Date</label>
                    <input type="date" formControlName="serviceDate" />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Procedure Codes (optional)</label>
                    <input 
                      type="text" 
                      formControlName="procedureCodes"
                      placeholder="Enter CPT codes separated by commas"
                    />
                  </div>
                  <div class="form-group">
                    <label>Rendering Provider</label>
                    <select formControlName="providerId">
                      <option value="">Default Provider</option>
                      @for (provider of providers(); track provider.id) {
                        <option [value]="provider.id">{{ provider.name }}, {{ provider.credentials }}</option>
                      }
                    </select>
                  </div>
                </div>

                <div class="form-actions">
                  <button 
                    type="button" 
                    class="btn btn-primary btn-lg"
                    [disabled]="isVerifying()"
                    (click)="verifyEligibility()"
                  >
                    @if (isVerifying()) {
                      <span class="spinner"></span>
                      Verifying...
                    } @else {
                      <span class="icon">✓</span>
                      Verify Eligibility
                    }
                  </button>
                  <button type="button" class="btn btn-outline" (click)="manualVerification()">
                    <span class="icon">📞</span>
                    Manual Verification
                  </button>
                </div>
              </form>
            </section>
          }

          <!-- Verification Results -->
          @if (verificationResult()) {
            <section class="card verification-results" [class.success]="verificationResult()!.status === 'verified'" [class.error]="verificationResult()!.status !== 'verified'">
              <div class="results-header">
                <div class="result-status">
                  @if (verificationResult()!.status === 'verified') {
                    <span class="status-icon success">✓</span>
                    <h2>Eligibility Verified</h2>
                  } @else if (verificationResult()!.status === 'inactive') {
                    <span class="status-icon warning">⚠️</span>
                    <h2>Coverage Inactive</h2>
                  } @else {
                    <span class="status-icon error">✕</span>
                    <h2>Verification Failed</h2>
                  }
                </div>
                <div class="result-actions">
                  <button class="btn btn-outline btn-sm" (click)="printVerification()">
                    <span class="icon">🖨️</span>
                    Print
                  </button>
                  <button class="btn btn-outline btn-sm" (click)="saveToChart()">
                    <span class="icon">💾</span>
                    Save to Chart
                  </button>
                </div>
              </div>

              @if (verificationResult()!.errorMessage) {
                <div class="error-message">
                  <span class="icon">⚠️</span>
                  {{ verificationResult()!.errorMessage }}
                </div>
              }

              <div class="results-grid">
                <!-- Coverage Information -->
                <div class="result-section">
                  <h3>Coverage Information</h3>
                  <dl class="info-list">
                    <dt>Eligibility Status</dt>
                    <dd>
                      <span class="status-badge" [class]="verificationResult()!.eligibilityStatus">
                        {{ verificationResult()!.eligibilityStatus | titlecase }}
                      </span>
                    </dd>
                    <dt>Plan Name</dt>
                    <dd>{{ verificationResult()!.planName || 'N/A' }}</dd>
                    <dt>Plan Type</dt>
                    <dd>{{ verificationResult()!.planType || 'N/A' }}</dd>
                    <dt>Effective Date</dt>
                    <dd>{{ verificationResult()!.effectiveDate | date:'MM/dd/yyyy' }}</dd>
                    <dt>Termination Date</dt>
                    <dd>{{ verificationResult()!.terminationDate ? (verificationResult()!.terminationDate | date:'MM/dd/yyyy') : 'Active' }}</dd>
                  </dl>
                </div>

                <!-- Benefits Summary -->
                <div class="result-section">
                  <h3>Benefits Summary</h3>
                  <dl class="info-list">
                    <dt>Copay</dt>
                    <dd>{{ verificationResult()!.copay ? (verificationResult()!.copay | currency) : 'N/A' }}</dd>
                    <dt>Coinsurance</dt>
                    <dd>{{ verificationResult()!.coinsurance ? (verificationResult()!.coinsurance + '%') : 'N/A' }}</dd>
                    <dt>Deductible</dt>
                    <dd>
                      @if (verificationResult()!.deductible) {
                        {{ verificationResult()!.deductible | currency }}
                        @if (verificationResult()!.deductibleMet !== undefined) {
                          <span class="met-amount">({{ verificationResult()!.deductibleMet | currency }} met)</span>
                        }
                      } @else {
                        N/A
                      }
                    </dd>
                    <dt>Out-of-Pocket Max</dt>
                    <dd>
                      @if (verificationResult()!.outOfPocketMax) {
                        {{ verificationResult()!.outOfPocketMax | currency }}
                        @if (verificationResult()!.outOfPocketMet !== undefined) {
                          <span class="met-amount">({{ verificationResult()!.outOfPocketMet | currency }} met)</span>
                        }
                      } @else {
                        N/A
                      }
                    </dd>
                  </dl>
                </div>

                <!-- Network Status -->
                <div class="result-section">
                  <h3>Network Status</h3>
                  <dl class="info-list">
                    <dt>Provider In-Network</dt>
                    <dd>
                      @if (verificationResult()!.inNetwork === true) {
                        <span class="status-badge verified">Yes</span>
                      } @else if (verificationResult()!.inNetwork === false) {
                        <span class="status-badge invalid">No</span>
                      } @else {
                        <span class="status-badge not-verified">Unknown</span>
                      }
                    </dd>
                    <dt>Network Status</dt>
                    <dd>{{ verificationResult()!.providerNetworkStatus || 'N/A' }}</dd>
                  </dl>
                </div>

                <!-- Reference Information -->
                <div class="result-section">
                  <h3>Reference Information</h3>
                  <dl class="info-list">
                    <dt>Verification Date</dt>
                    <dd>{{ verificationResult()!.verificationDate | date:'MM/dd/yyyy h:mm a' }}</dd>
                    <dt>Reference Number</dt>
                    <dd>{{ verificationResult()!.referenceNumber || 'N/A' }}</dd>
                    <dt>Representative</dt>
                    <dd>{{ verificationResult()!.representativeName || 'Electronic Verification' }}</dd>
                    <dt>Verified By</dt>
                    <dd>{{ verificationResult()!.verifiedBy }}</dd>
                  </dl>
                </div>
              </div>

              <!-- Notes -->
              @if (verificationResult()!.notes) {
                <div class="result-notes">
                  <h3>Notes</h3>
                  <p>{{ verificationResult()!.notes }}</p>
                </div>
              }
            </section>
          }

          <!-- Benefits Detail Section -->
          @if (verificationResult()?.status === 'verified' && benefitsDetails().length > 0) {
            <section class="card benefits-detail">
              <h2>Detailed Benefits</h2>
              <table class="benefits-table">
                <thead>
                  <tr>
                    <th>Benefit Category</th>
                    <th colspan="2">In-Network</th>
                    <th colspan="2">Out-of-Network</th>
                  </tr>
                  <tr class="subheader">
                    <th></th>
                    <th>Copay/Coinsurance</th>
                    <th>Covered</th>
                    <th>Copay/Coinsurance</th>
                    <th>Covered</th>
                  </tr>
                </thead>
                <tbody>
                  @for (benefit of benefitsDetails(); track benefit.category) {
                    <tr>
                      <td class="category">{{ benefit.category }}</td>
                      <td>
                        @if (benefit.inNetwork.copay) {
                          {{ benefit.inNetwork.copay | currency }} copay
                        } @else if (benefit.inNetwork.coinsurance) {
                          {{ benefit.inNetwork.coinsurance }}% coinsurance
                        } @else {
                          N/A
                        }
                      </td>
                      <td>
                        @if (benefit.inNetwork.covered) {
                          <span class="covered-badge yes">Yes</span>
                        } @else {
                          <span class="covered-badge no">No</span>
                        }
                      </td>
                      <td>
                        @if (benefit.outOfNetwork) {
                          @if (benefit.outOfNetwork.copay) {
                            {{ benefit.outOfNetwork.copay | currency }} copay
                          } @else if (benefit.outOfNetwork.coinsurance) {
                            {{ benefit.outOfNetwork.coinsurance }}% coinsurance
                          } @else {
                            N/A
                          }
                        } @else {
                          N/A
                        }
                      </td>
                      <td>
                        @if (benefit.outOfNetwork?.covered === true) {
                          <span class="covered-badge yes">Yes</span>
                        } @else if (benefit.outOfNetwork?.covered === false) {
                          <span class="covered-badge no">No</span>
                        } @else {
                          <span class="covered-badge na">N/A</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </section>
          }
        </div>
      }

      <!-- Patient Policies Tab -->
      @if (activeTab() === 'policies') {
        <div class="tab-content policies-tab">
          <!-- Patient Search -->
          <section class="card">
            <div class="section-header">
              <h2>Find Patient</h2>
            </div>
            <div class="search-row">
              <div class="search-input-wrapper">
                <span class="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search by patient name, MRN, or DOB..."
                  [(ngModel)]="policyPatientSearch"
                  (input)="searchPolicyPatients()"
                  class="search-input"
                />
              </div>
            </div>

            @if (policySearchResults().length > 0) {
              <div class="search-results">
                @for (patient of policySearchResults(); track patient.id) {
                  <div class="search-result-item" (click)="selectPolicyPatient(patient)">
                    <div class="patient-avatar">{{ patient.name.charAt(0) }}</div>
                    <div class="patient-info">
                      <span class="patient-name">{{ patient.name }}</span>
                      <span class="patient-details">MRN: {{ patient.mrn }} | DOB: {{ patient.dob | date:'MM/dd/yyyy' }}</span>
                    </div>
                  </div>
                }
              </div>
            }
          </section>

          <!-- Selected Patient Policies -->
          @if (selectedPolicyPatient()) {
            <section class="card">
              <div class="section-header">
                <h2>Insurance Policies for {{ selectedPolicyPatient()!.name }}</h2>
                <button class="btn btn-primary" (click)="addInsurance()">
                  <span class="icon">+</span>
                  Add Policy
                </button>
              </div>

              @if (selectedPatientPolicies().length > 0) {
                <div class="policies-detail-list">
                  @for (policy of selectedPatientPolicies(); track policy.policyId) {
                    <div class="policy-detail-card" [class.inactive]="!policy.isActive">
                      <div class="policy-detail-header">
                        <div class="policy-badges">
                          <span class="type-badge" [class]="policy.type">
                            {{ getInsuranceTypeLabel(policy.type) }}
                          </span>
                          @if (policy.isPrimary) {
                            <span class="primary-badge">Primary</span>
                          }
                          <span class="status-badge" [class]="policy.verificationStatus">
                            {{ getVerificationStatusLabel(policy.verificationStatus) }}
                          </span>
                        </div>
                        <div class="policy-actions">
                          <button class="btn btn-sm btn-outline" (click)="verifyPolicy(policy)">Verify</button>
                          <button class="btn btn-sm btn-outline" (click)="editPolicy(policy)">Edit</button>
                          <button class="btn btn-sm btn-text" (click)="deletePolicy(policy)">Delete</button>
                        </div>
                      </div>

                      <div class="policy-detail-body">
                        <div class="policy-info-grid">
                          <div class="info-block">
                            <h4>Payer Information</h4>
                            <p class="payer-name">{{ policy.payerName }}</p>
                            <p>Payer ID: {{ policy.payerId }}</p>
                            @if (policy.payerPhone) {
                              <p>Phone: {{ policy.payerPhone }}</p>
                            }
                          </div>
                          <div class="info-block">
                            <h4>Policy Details</h4>
                            <p><strong>Subscriber ID:</strong> {{ policy.subscriberId }}</p>
                            <p><strong>Group #:</strong> {{ policy.groupNumber || 'N/A' }}</p>
                            <p><strong>Plan:</strong> {{ policy.planName || 'N/A' }}</p>
                            <p><strong>Type:</strong> {{ policy.planType || 'N/A' }}</p>
                          </div>
                          <div class="info-block">
                            <h4>Subscriber</h4>
                            <p><strong>Name:</strong> {{ policy.subscriberName }}</p>
                            <p><strong>DOB:</strong> {{ policy.subscriberDob | date:'MM/dd/yyyy' }}</p>
                            <p><strong>Relationship:</strong> {{ policy.subscriberRelationship }}</p>
                          </div>
                          <div class="info-block">
                            <h4>Coverage Dates</h4>
                            <p><strong>Effective:</strong> {{ policy.effectiveDate | date:'MM/dd/yyyy' }}</p>
                            <p><strong>Termination:</strong> {{ policy.terminationDate ? (policy.terminationDate | date:'MM/dd/yyyy') : 'Active' }}</p>
                          </div>
                        </div>

                        @if (policy.copay !== undefined || policy.deductible !== undefined) {
                          <div class="benefits-summary">
                            <h4>Benefits Summary</h4>
                            <div class="benefits-grid">
                              @if (policy.copay !== undefined) {
                                <div class="benefit-item">
                                  <span class="label">Copay</span>
                                  <span class="value">{{ policy.copay | currency }}</span>
                                </div>
                              }
                              @if (policy.coinsurance !== undefined) {
                                <div class="benefit-item">
                                  <span class="label">Coinsurance</span>
                                  <span class="value">{{ policy.coinsurance }}%</span>
                                </div>
                              }
                              @if (policy.deductible !== undefined) {
                                <div class="benefit-item">
                                  <span class="label">Deductible</span>
                                  <span class="value">
                                    {{ policy.deductible | currency }}
                                    @if (policy.deductibleMet !== undefined) {
                                      <span class="met">({{ policy.deductibleMet | currency }} met)</span>
                                    }
                                  </span>
                                </div>
                              }
                              @if (policy.outOfPocketMax !== undefined) {
                                <div class="benefit-item">
                                  <span class="label">Out-of-Pocket Max</span>
                                  <span class="value">
                                    {{ policy.outOfPocketMax | currency }}
                                    @if (policy.outOfPocketMet !== undefined) {
                                      <span class="met">({{ policy.outOfPocketMet | currency }} met)</span>
                                    }
                                  </span>
                                </div>
                              }
                            </div>
                          </div>
                        }

                        @if (policy.lastVerifiedDate) {
                          <div class="verification-info">
                            <span class="icon">✓</span>
                            Last verified {{ policy.lastVerifiedDate | date:'MM/dd/yyyy' }}
                            @if (policy.verifiedBy) {
                              by {{ policy.verifiedBy }}
                            }
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="empty-state">
                  <span class="icon">📋</span>
                  <p>No insurance policies on file for this patient.</p>
                  <button class="btn btn-primary" (click)="addInsurance()">Add Insurance</button>
                </div>
              }
            </section>
          }
        </div>
      }

      <!-- Verification History Tab -->
      @if (activeTab() === 'history') {
        <div class="tab-content history-tab">
          <section class="card">
            <div class="section-header">
              <h2>Verification History</h2>
              <div class="filters">
                <input 
                  type="text" 
                  placeholder="Search by patient or payer..."
                  [(ngModel)]="historySearch"
                  class="search-input small"
                />
                <select [(ngModel)]="historyStatusFilter" (change)="filterHistory()">
                  <option value="">All Statuses</option>
                  <option value="verified">Verified</option>
                  <option value="inactive">Inactive</option>
                  <option value="invalid">Invalid</option>
                  <option value="expired">Expired</option>
                </select>
                <input 
                  type="date" 
                  [(ngModel)]="historyDateFrom"
                  (change)="filterHistory()"
                />
                <span>to</span>
                <input 
                  type="date" 
                  [(ngModel)]="historyDateTo"
                  (change)="filterHistory()"
                />
              </div>
            </div>

            @if (filteredHistory().length > 0) {
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Date/Time</th>
                    <th>Patient</th>
                    <th>Payer</th>
                    <th>Service Type</th>
                    <th>Status</th>
                    <th>Reference #</th>
                    <th>Verified By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of filteredHistory(); track item.verificationId) {
                    <tr>
                      <td>{{ item.verificationDate | date:'MM/dd/yyyy h:mm a' }}</td>
                      <td>
                        <a [routerLink]="['/patients', item.patientId]" class="patient-link">
                          {{ getPatientName(item.patientId) }}
                        </a>
                      </td>
                      <td>{{ getPayerName(item.policyId) }}</td>
                      <td>{{ getServiceTypeLabel(item) }}</td>
                      <td>
                        <span class="status-badge" [class]="item.status">
                          {{ getVerificationStatusLabel(item.status) }}
                        </span>
                      </td>
                      <td>{{ item.referenceNumber || '-' }}</td>
                      <td>{{ item.verifiedBy }}</td>
                      <td class="actions">
                        <button class="btn btn-sm btn-text" (click)="viewVerificationDetail(item)">View</button>
                        <button class="btn btn-sm btn-text" (click)="printVerificationHistory(item)">Print</button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            } @else {
              <div class="empty-state">
                <span class="icon">📋</span>
                <p>No verification history found.</p>
              </div>
            }
          </section>
        </div>
      }

      <!-- Batch Verification Tab -->
      @if (activeTab() === 'batch') {
        <div class="tab-content batch-tab">
          <section class="card">
            <div class="section-header">
              <h2>Batch Verification</h2>
              <p class="description">Verify insurance eligibility for multiple patients at once.</p>
            </div>

            <!-- Batch Options -->
            <div class="batch-options">
              <div class="option-card" (click)="selectBatchOption('appointments')">
                <span class="option-icon">📅</span>
                <h3>Upcoming Appointments</h3>
                <p>Verify all patients with appointments in the selected date range.</p>
              </div>
              <div class="option-card" (click)="selectBatchOption('unverified')">
                <span class="option-icon">❓</span>
                <h3>Unverified Policies</h3>
                <p>Verify all policies that haven't been verified recently.</p>
              </div>
              <div class="option-card" (click)="selectBatchOption('expiring')">
                <span class="option-icon">⏰</span>
                <h3>Expiring Verifications</h3>
                <p>Re-verify policies with verifications older than 30 days.</p>
              </div>
              <div class="option-card" (click)="selectBatchOption('custom')">
                <span class="option-icon">📋</span>
                <h3>Custom List</h3>
                <p>Upload or select a custom list of patients to verify.</p>
              </div>
            </div>

            @if (batchOption()) {
              <div class="batch-config">
                <h3>Configure Batch Verification</h3>
                
                @if (batchOption() === 'appointments') {
                  <div class="config-form">
                    <div class="form-row">
                      <div class="form-group">
                        <label>From Date</label>
                        <input type="date" [(ngModel)]="batchDateFrom" />
                      </div>
                      <div class="form-group">
                        <label>To Date</label>
                        <input type="date" [(ngModel)]="batchDateTo" />
                      </div>
                      <div class="form-group">
                        <label>Provider</label>
                        <select [(ngModel)]="batchProvider">
                          <option value="">All Providers</option>
                          @for (provider of providers(); track provider.id) {
                            <option [value]="provider.id">{{ provider.name }}</option>
                          }
                        </select>
                      </div>
                    </div>
                    <button class="btn btn-primary" (click)="loadBatchPatients()">Load Appointments</button>
                  </div>
                }

                @if (batchOption() === 'unverified' || batchOption() === 'expiring') {
                  <div class="config-form">
                    <button class="btn btn-primary" (click)="loadBatchPatients()">Load Policies</button>
                  </div>
                }

                @if (batchOption() === 'custom') {
                  <div class="config-form">
                    <div class="upload-area" 
                         (dragover)="onDragOver($event)" 
                         (dragleave)="onDragLeave($event)"
                         (drop)="onFileDrop($event)"
                         [class.dragover]="isDragging()">
                      <span class="icon">📄</span>
                      <p>Drag and drop a CSV file with patient IDs</p>
                      <p class="hint">or</p>
                      <label class="file-input-label">
                        Browse Files
                        <input type="file" accept=".csv" (change)="onFileSelect($event)" />
                      </label>
                    </div>
                  </div>
                }
              </div>
            }

            <!-- Batch Queue -->
            @if (batchQueue().length > 0) {
              <div class="batch-queue">
                <div class="queue-header">
                  <h3>Verification Queue ({{ batchQueue().length }} patients)</h3>
                  <div class="queue-actions">
                    <label class="checkbox-label">
                      <input type="checkbox" [(ngModel)]="batchSelectAll" (change)="toggleBatchSelectAll()" />
                      Select All
                    </label>
                    <button class="btn btn-outline" (click)="clearBatchQueue()">Clear</button>
                    <button 
                      class="btn btn-primary" 
                      [disabled]="selectedBatchCount() === 0 || isBatchRunning()"
                      (click)="runBatchVerification()"
                    >
                      @if (isBatchRunning()) {
                        <span class="spinner"></span>
                        Running... ({{ batchProgress() }}/{{ selectedBatchCount() }})
                      } @else {
                        Run Verification ({{ selectedBatchCount() }})
                      }
                    </button>
                  </div>
                </div>

                <table class="data-table">
                  <thead>
                    <tr>
                      <th class="checkbox-col">
                        <input type="checkbox" [(ngModel)]="batchSelectAll" (change)="toggleBatchSelectAll()" />
                      </th>
                      <th>Patient</th>
                      <th>MRN</th>
                      <th>Insurance</th>
                      <th>Last Verified</th>
                      <th>Status</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of batchQueue(); track item.patientId + item.policyId) {
                      <tr [class.processing]="item.processing" [class.completed]="item.completed">
                        <td class="checkbox-col">
                          <input 
                            type="checkbox" 
                            [(ngModel)]="item.selected"
                            [disabled]="item.processing || item.completed"
                          />
                        </td>
                        <td>{{ item.patientName }}</td>
                        <td>{{ item.mrn }}</td>
                        <td>{{ item.payerName }}</td>
                        <td>{{ item.lastVerified ? (item.lastVerified | date:'MM/dd/yyyy') : 'Never' }}</td>
                        <td>
                          @if (item.processing) {
                            <span class="status-badge processing">Processing...</span>
                          } @else if (item.completed) {
                            <span class="status-badge" [class]="item.result?.status || 'unknown'">
                              {{ item.result?.status ? getVerificationStatusLabel(item.result.status) : 'Unknown' }}
                            </span>
                          } @else {
                            <span class="status-badge pending">Pending</span>
                          }
                        </td>
                        <td>
                          @if (item.result?.errorMessage) {
                            <span class="error-text">{{ item.result.errorMessage }}</span>
                          } @else if (item.result) {
                            <button class="btn btn-sm btn-text" (click)="viewBatchResult(item)">View Details</button>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }

            <!-- Batch Results Summary -->
            @if (batchCompleted()) {
              <div class="batch-results-summary">
                <h3>Batch Verification Complete</h3>
                <div class="results-stats">
                  <div class="stat-card success">
                    <span class="stat-value">{{ batchSuccessCount() }}</span>
                    <span class="stat-label">Verified</span>
                  </div>
                  <div class="stat-card warning">
                    <span class="stat-value">{{ batchInactiveCount() }}</span>
                    <span class="stat-label">Inactive</span>
                  </div>
                  <div class="stat-card error">
                    <span class="stat-value">{{ batchErrorCount() }}</span>
                    <span class="stat-label">Errors</span>
                  </div>
                </div>
                <div class="results-actions">
                  <button class="btn btn-outline" (click)="exportBatchResults()">Export Results</button>
                  <button class="btn btn-primary" (click)="startNewBatch()">New Batch</button>
                </div>
              </div>
            }
          </section>
        </div>
      }
    </div>
  `,
  styles: [`
    .insurance-verification {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 1.5rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .title-section h1 {
      font-size: 1.75rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }

    .subtitle {
      color: #6b7280;
      margin-top: 0.25rem;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .tab-nav {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 0;
    }

    .tab-btn {
      padding: 0.75rem 1.25rem;
      background: none;
      border: none;
      color: #6b7280;
      font-weight: 500;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .tab-btn:hover {
      color: #374151;
    }

    .tab-btn.active {
      color: #2563eb;
      border-bottom-color: #2563eb;
    }

    .tab-btn .badge {
      background: #e5e7eb;
      color: #374151;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
    }

    .tab-btn.active .badge {
      background: #dbeafe;
      color: #2563eb;
    }

    .card {
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .card h2 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 1rem 0;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .section-header h2 {
      margin: 0;
    }

    .search-row {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .search-input-wrapper {
      flex: 1;
      position: relative;
    }

    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
    }

    .search-input {
      width: 100%;
      padding: 0.625rem 1rem 0.625rem 2.5rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
    }

    .search-input:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .search-input.small {
      max-width: 250px;
      padding-left: 0.75rem;
    }

    .search-results {
      margin-top: 0.5rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
      max-height: 200px;
      overflow-y: auto;
    }

    .search-result-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      cursor: pointer;
    }

    .search-result-item:hover {
      background: #f3f4f6;
    }

    .patient-avatar {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      background: #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      color: #374151;
    }

    .patient-avatar.large {
      width: 3.5rem;
      height: 3.5rem;
      font-size: 1.25rem;
    }

    .patient-info {
      display: flex;
      flex-direction: column;
    }

    .patient-name {
      font-weight: 500;
      color: #111827;
    }

    .patient-details {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .selected-patient-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-top: 1rem;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 0.5rem;
      border: 1px solid #e5e7eb;
    }

    .selected-patient-card h3 {
      margin: 0;
      font-size: 1.125rem;
    }

    .selected-patient-card p {
      margin: 0.25rem 0 0 0;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .policies-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
    }

    .policy-card {
      border: 2px solid #e5e7eb;
      border-radius: 0.5rem;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
    }

    .policy-card:hover {
      border-color: #9ca3af;
    }

    .policy-card.selected {
      border-color: #2563eb;
      background: #eff6ff;
    }

    .policy-card.inactive {
      opacity: 0.6;
    }

    .policy-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .policy-type-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: uppercase;
    }

    .policy-type-badge.primary {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .policy-type-badge.secondary {
      background: #e0e7ff;
      color: #4338ca;
    }

    .policy-type-badge.tertiary {
      background: #fae8ff;
      color: #a21caf;
    }

    .policy-body h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1rem;
      color: #111827;
    }

    .policy-details p {
      margin: 0.25rem 0;
      font-size: 0.875rem;
      color: #4b5563;
    }

    .last-verified {
      margin-top: 0.75rem !important;
      font-size: 0.75rem !important;
      color: #6b7280 !important;
    }

    .selected-indicator {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      width: 1.5rem;
      height: 1.5rem;
      background: #2563eb;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-badge.verified, .status-badge.active {
      background: #d1fae5;
      color: #065f46;
    }

    .status-badge.not-verified, .status-badge.pending {
      background: #e5e7eb;
      color: #374151;
    }

    .status-badge.expired, .status-badge.inactive {
      background: #fef3c7;
      color: #92400e;
    }

    .status-badge.invalid {
      background: #fee2e2;
      color: #991b1b;
    }

    .status-badge.processing {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .warning-card {
      background: #fffbeb;
      border: 1px solid #fbbf24;
    }

    .warning-content {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }

    .warning-icon {
      font-size: 1.5rem;
    }

    .warning-content h3 {
      margin: 0 0 0.5rem 0;
      color: #92400e;
    }

    .warning-content p {
      margin: 0 0 1rem 0;
      color: #78350f;
    }

    .verification-form .form-row {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .form-group label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 1.5rem;
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
      transition: all 0.2s;
    }

    .btn-primary {
      background: #2563eb;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #1d4ed8;
    }

    .btn-primary:disabled {
      background: #93c5fd;
      cursor: not-allowed;
    }

    .btn-outline {
      background: white;
      border: 1px solid #d1d5db;
      color: #374151;
    }

    .btn-outline:hover {
      background: #f9fafb;
    }

    .btn-text {
      background: none;
      color: #2563eb;
    }

    .btn-text:hover {
      background: #eff6ff;
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
    }

    .btn-lg {
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
    }

    .btn .icon {
      font-size: 1rem;
    }

    .spinner {
      width: 1rem;
      height: 1rem;
      border: 2px solid transparent;
      border-top-color: currentColor;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .verification-results {
      border: 2px solid #e5e7eb;
    }

    .verification-results.success {
      border-color: #10b981;
      background: linear-gradient(to bottom, #ecfdf5, white);
    }

    .verification-results.error {
      border-color: #ef4444;
      background: linear-gradient(to bottom, #fef2f2, white);
    }

    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .result-status {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .status-icon {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    .status-icon.success {
      background: #d1fae5;
      color: #065f46;
    }

    .status-icon.warning {
      background: #fef3c7;
    }

    .status-icon.error {
      background: #fee2e2;
      color: #991b1b;
    }

    .result-status h2 {
      margin: 0;
    }

    .result-actions {
      display: flex;
      gap: 0.5rem;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 0.375rem;
      color: #991b1b;
      margin-bottom: 1.5rem;
    }

    .results-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .result-section h3 {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      margin: 0 0 0.75rem 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .info-list {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 0.5rem 1rem;
    }

    .info-list dt {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .info-list dd {
      font-size: 0.875rem;
      color: #111827;
      font-weight: 500;
      margin: 0;
    }

    .met-amount {
      font-weight: 400;
      color: #6b7280;
      font-size: 0.8125rem;
    }

    .result-notes {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    .result-notes h3 {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      margin: 0 0 0.5rem 0;
    }

    .result-notes p {
      margin: 0;
      color: #4b5563;
    }

    .benefits-table {
      width: 100%;
      border-collapse: collapse;
    }

    .benefits-table th,
    .benefits-table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }

    .benefits-table th {
      background: #f9fafb;
      font-weight: 600;
      font-size: 0.875rem;
      color: #374151;
    }

    .benefits-table .subheader th {
      font-weight: 500;
      font-size: 0.8125rem;
      background: #f3f4f6;
    }

    .benefits-table .category {
      font-weight: 500;
    }

    .covered-badge {
      display: inline-block;
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .covered-badge.yes {
      background: #d1fae5;
      color: #065f46;
    }

    .covered-badge.no {
      background: #fee2e2;
      color: #991b1b;
    }

    .covered-badge.na {
      background: #e5e7eb;
      color: #6b7280;
    }

    .filters {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .filters select,
    .filters input[type="date"] {
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
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
      font-weight: 600;
      font-size: 0.875rem;
      color: #374151;
    }

    .data-table tbody tr:hover {
      background: #f9fafb;
    }

    .data-table .checkbox-col {
      width: 40px;
      text-align: center;
    }

    .data-table .actions {
      display: flex;
      gap: 0.5rem;
    }

    .patient-link {
      color: #2563eb;
      text-decoration: none;
    }

    .patient-link:hover {
      text-decoration: underline;
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #6b7280;
    }

    .empty-state .icon {
      font-size: 2.5rem;
      display: block;
      margin-bottom: 1rem;
    }

    .empty-state p {
      margin: 0 0 1rem 0;
    }

    .batch-options {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .option-card {
      padding: 1.5rem;
      border: 2px solid #e5e7eb;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;
    }

    .option-card:hover {
      border-color: #2563eb;
      background: #eff6ff;
    }

    .option-icon {
      font-size: 2rem;
      display: block;
      margin-bottom: 0.75rem;
    }

    .option-card h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1rem;
      color: #111827;
    }

    .option-card p {
      margin: 0;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .batch-config {
      padding: 1.5rem;
      background: #f9fafb;
      border-radius: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .batch-config h3 {
      margin: 0 0 1rem 0;
      font-size: 1rem;
    }

    .config-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .config-form .form-row {
      display: flex;
      gap: 1rem;
      align-items: flex-end;
    }

    .upload-area {
      padding: 2rem;
      border: 2px dashed #d1d5db;
      border-radius: 0.5rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .upload-area:hover,
    .upload-area.dragover {
      border-color: #2563eb;
      background: #eff6ff;
    }

    .upload-area .icon {
      font-size: 2rem;
      display: block;
      margin-bottom: 0.5rem;
    }

    .upload-area .hint {
      color: #9ca3af;
      font-size: 0.875rem;
    }

    .file-input-label {
      display: inline-block;
      padding: 0.5rem 1rem;
      background: #2563eb;
      color: white;
      border-radius: 0.375rem;
      cursor: pointer;
      margin-top: 0.5rem;
    }

    .file-input-label input {
      display: none;
    }

    .batch-queue {
      margin-top: 1.5rem;
    }

    .queue-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .queue-header h3 {
      margin: 0;
    }

    .queue-actions {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.875rem;
      cursor: pointer;
    }

    .data-table tr.processing {
      background: #eff6ff;
    }

    .data-table tr.completed {
      background: #f0fdf4;
    }

    .error-text {
      color: #dc2626;
      font-size: 0.8125rem;
    }

    .batch-results-summary {
      text-align: center;
      padding: 2rem;
      background: #f9fafb;
      border-radius: 0.5rem;
      margin-top: 1.5rem;
    }

    .batch-results-summary h3 {
      margin: 0 0 1.5rem 0;
    }

    .results-stats {
      display: flex;
      justify-content: center;
      gap: 2rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      padding: 1rem 2rem;
      border-radius: 0.5rem;
      text-align: center;
    }

    .stat-card.success {
      background: #d1fae5;
    }

    .stat-card.warning {
      background: #fef3c7;
    }

    .stat-card.error {
      background: #fee2e2;
    }

    .stat-value {
      display: block;
      font-size: 2rem;
      font-weight: 700;
      color: #111827;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .results-actions {
      display: flex;
      justify-content: center;
      gap: 1rem;
    }

    .policies-detail-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .policy-detail-card {
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .policy-detail-card.inactive {
      opacity: 0.7;
    }

    .policy-detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }

    .policy-badges {
      display: flex;
      gap: 0.5rem;
    }

    .type-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .type-badge.primary {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .type-badge.secondary {
      background: #e0e7ff;
      color: #4338ca;
    }

    .primary-badge {
      background: #fef3c7;
      color: #92400e;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .policy-actions {
      display: flex;
      gap: 0.5rem;
    }

    .policy-detail-body {
      padding: 1rem;
    }

    .policy-info-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
      margin-bottom: 1rem;
    }

    .info-block h4 {
      font-size: 0.75rem;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0 0 0.5rem 0;
    }

    .info-block p {
      margin: 0.25rem 0;
      font-size: 0.875rem;
      color: #374151;
    }

    .info-block .payer-name {
      font-weight: 600;
      color: #111827;
      font-size: 1rem;
    }

    .benefits-summary {
      padding: 1rem;
      background: #f9fafb;
      border-radius: 0.375rem;
      margin-top: 1rem;
    }

    .benefits-summary h4 {
      margin: 0 0 0.75rem 0;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .benefits-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .benefit-item {
      display: flex;
      flex-direction: column;
    }

    .benefit-item .label {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .benefit-item .value {
      font-weight: 600;
      color: #111827;
    }

    .benefit-item .met {
      font-weight: 400;
      color: #6b7280;
      font-size: 0.8125rem;
    }

    .verification-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
      font-size: 0.875rem;
      color: #059669;
    }

    @media (max-width: 1024px) {
      .batch-options {
        grid-template-columns: repeat(2, 1fr);
      }

      .policy-info-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .benefits-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .results-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        gap: 1rem;
      }

      .batch-options {
        grid-template-columns: 1fr;
      }

      .filters {
        flex-wrap: wrap;
      }

      .verification-form .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class InsuranceVerificationComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Tab state
  activeTab = signal<'verify' | 'policies' | 'history' | 'batch'>('verify');

  // Verify tab state
  patientSearch = '';
  patientSearchResults = signal<any[]>([]);
  selectedPatient = signal<any>(null);
  patientPolicies = signal<InsurancePolicy[]>([]);
  selectedPolicy = signal<InsurancePolicy | null>(null);
  isVerifying = signal(false);
  verificationResult = signal<InsuranceVerification | null>(null);
  benefitsDetails = signal<BenefitDetail[]>([]);

  // Verification form
  verificationForm: FormGroup = this.fb.group({
    serviceType: [''],
    serviceDate: [new Date().toISOString().split('T')[0]],
    procedureCodes: [''],
    providerId: ['']
  });

  // Policies tab state
  policyPatientSearch = '';
  policySearchResults = signal<any[]>([]);
  selectedPolicyPatient = signal<any>(null);
  selectedPatientPolicies = signal<InsurancePolicy[]>([]);

  // History tab state
  verificationHistory = signal<InsuranceVerification[]>([]);
  filteredHistory = signal<InsuranceVerification[]>([]);
  historySearch = '';
  historyStatusFilter = '';
  historyDateFrom = '';
  historyDateTo = '';

  // Batch tab state
  batchOption = signal<'appointments' | 'unverified' | 'expiring' | 'custom' | null>(null);
  batchDateFrom = '';
  batchDateTo = '';
  batchProvider = '';
  batchQueue = signal<any[]>([]);
  batchSelectAll = false;
  isBatchRunning = signal(false);
  batchProgress = signal(0);
  batchCompleted = signal(false);
  isDragging = signal(false);

  // Computed batch stats
  selectedBatchCount = computed(() => this.batchQueue().filter(i => i.selected).length);
  batchSuccessCount = computed(() => this.batchQueue().filter(i => i.result?.status === 'verified').length);
  batchInactiveCount = computed(() => this.batchQueue().filter(i => i.result?.status === 'inactive').length);
  batchErrorCount = computed(() => this.batchQueue().filter(i => i.result?.errorMessage).length);

  // Provider list
  providers = signal([
    { id: 'prov-1', name: 'Dr. Sarah Chen', credentials: 'MD' },
    { id: 'prov-2', name: 'Dr. Michael Roberts', credentials: 'DO' },
    { id: 'prov-3', name: 'Dr. Emily Watson', credentials: 'MD' },
    { id: 'prov-4', name: 'Dr. James Miller', credentials: 'MD' }
  ]);

  ngOnInit(): void {
    this.loadVerificationHistory();
  }

  setActiveTab(tab: 'verify' | 'policies' | 'history' | 'batch'): void {
    this.activeTab.set(tab);
  }

  // Patient search methods
  searchPatients(): void {
    if (this.patientSearch.length < 2) {
      this.patientSearchResults.set([]);
      return;
    }

    // Mock patient search
    const mockPatients = [
      { id: 'pat-1', name: 'John Smith', mrn: 'MRN-001', dob: new Date('1980-05-15'), address: '123 Main St, Anytown, USA' },
      { id: 'pat-2', name: 'Jane Doe', mrn: 'MRN-002', dob: new Date('1975-08-22'), address: '456 Oak Ave, Somewhere, USA' },
      { id: 'pat-3', name: 'Robert Johnson', mrn: 'MRN-003', dob: new Date('1990-01-10'), address: '789 Pine Rd, Elsewhere, USA' },
      { id: 'pat-4', name: 'Maria Garcia', mrn: 'MRN-004', dob: new Date('1985-12-03'), address: '321 Elm St, Nowhere, USA' },
      { id: 'pat-5', name: 'James Wilson', mrn: 'MRN-005', dob: new Date('1968-07-28'), address: '654 Maple Dr, Anywhere, USA' }
    ];

    const searchLower = this.patientSearch.toLowerCase();
    const results = mockPatients.filter(p => 
      p.name.toLowerCase().includes(searchLower) || 
      p.mrn.toLowerCase().includes(searchLower)
    );
    this.patientSearchResults.set(results);
  }

  selectPatient(patient: any): void {
    this.selectedPatient.set(patient);
    this.patientSearchResults.set([]);
    this.patientSearch = patient.name;
    this.loadPatientPolicies(patient.id);
  }

  clearPatient(): void {
    this.selectedPatient.set(null);
    this.patientPolicies.set([]);
    this.selectedPolicy.set(null);
    this.patientSearch = '';
    this.verificationResult.set(null);
    this.benefitsDetails.set([]);
  }

  loadPatientPolicies(patientId: string): void {
    // Mock policies
    const mockPolicies: InsurancePolicy[] = [
      {
        policyId: 'pol-1',
        patientId: patientId,
        type: InsuranceType.Primary,
        payerId: 'BCBS-001',
        payerName: 'Blue Cross Blue Shield',
        payerPhone: '1-800-555-BCBS',
        subscriberId: 'XYZ123456789',
        groupNumber: 'GRP-12345',
        planName: 'PPO Gold Plan',
        planType: 'PPO',
        effectiveDate: new Date('2024-01-01'),
        subscriberName: 'John Smith',
        subscriberDob: new Date('1980-05-15'),
        subscriberRelationship: 'Self',
        copay: 30,
        coinsurance: 20,
        deductible: 500,
        deductibleMet: 350,
        outOfPocketMax: 3000,
        outOfPocketMet: 850,
        verificationStatus: VerificationStatus.Verified,
        lastVerifiedDate: new Date('2024-12-15'),
        verifiedBy: 'Jane Admin',
        isActive: true,
        isPrimary: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-12-15')
      },
      {
        policyId: 'pol-2',
        patientId: patientId,
        type: InsuranceType.Secondary,
        payerId: 'AETNA-001',
        payerName: 'Aetna',
        payerPhone: '1-800-555-AETN',
        subscriberId: 'AET987654321',
        groupNumber: 'GRP-98765',
        planName: 'HMO Standard',
        planType: 'HMO',
        effectiveDate: new Date('2024-01-01'),
        subscriberName: 'Mary Smith',
        subscriberDob: new Date('1982-03-20'),
        subscriberRelationship: 'Spouse',
        copay: 25,
        coinsurance: 15,
        deductible: 250,
        deductibleMet: 250,
        outOfPocketMax: 2000,
        outOfPocketMet: 500,
        verificationStatus: VerificationStatus.NotVerified,
        isActive: true,
        isPrimary: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }
    ];

    this.patientPolicies.set(mockPolicies);
    
    // Auto-select primary policy
    const primary = mockPolicies.find(p => p.isPrimary && p.isActive);
    if (primary) {
      this.selectPolicy(primary);
    }
  }

  selectPolicy(policy: InsurancePolicy): void {
    this.selectedPolicy.set(policy);
    this.verificationResult.set(null);
    this.benefitsDetails.set([]);
  }

  // Verification methods
  verifyEligibility(): void {
    if (!this.selectedPolicy()) return;

    this.isVerifying.set(true);
    this.verificationResult.set(null);

    // Simulate API call
    setTimeout(() => {
      const policy = this.selectedPolicy()!;
      
      const result: InsuranceVerification = {
        verificationId: 'ver-' + Date.now(),
        policyId: policy.policyId,
        patientId: policy.patientId,
        verificationDate: new Date(),
        verifiedBy: 'Current User',
        status: VerificationStatus.Verified,
        eligibilityStatus: 'active',
        effectiveDate: policy.effectiveDate,
        terminationDate: undefined,
        planName: policy.planName,
        planType: policy.planType,
        copay: policy.copay,
        coinsurance: policy.coinsurance,
        deductible: policy.deductible,
        deductibleMet: policy.deductibleMet,
        outOfPocketMax: policy.outOfPocketMax,
        outOfPocketMet: policy.outOfPocketMet,
        inNetwork: true,
        providerNetworkStatus: 'Participating Provider',
        referenceNumber: 'REF-' + Math.random().toString(36).substring(2, 10).toUpperCase()
      };

      this.verificationResult.set(result);
      this.loadBenefitsDetails();
      this.isVerifying.set(false);
    }, 2000);
  }

  loadBenefitsDetails(): void {
    const benefits: BenefitDetail[] = [
      {
        category: 'Office Visits - Primary Care',
        inNetwork: { copay: 30, covered: true },
        outOfNetwork: { coinsurance: 40, covered: true }
      },
      {
        category: 'Office Visits - Specialist',
        inNetwork: { copay: 50, covered: true },
        outOfNetwork: { coinsurance: 40, covered: true }
      },
      {
        category: 'Preventive Care',
        inNetwork: { copay: 0, covered: true, notes: 'No cost share' },
        outOfNetwork: { coinsurance: 40, covered: true }
      },
      {
        category: 'Diagnostic Lab',
        inNetwork: { coinsurance: 20, covered: true },
        outOfNetwork: { coinsurance: 40, covered: true }
      },
      {
        category: 'Diagnostic X-Ray',
        inNetwork: { coinsurance: 20, covered: true },
        outOfNetwork: { coinsurance: 40, covered: true }
      },
      {
        category: 'Emergency Room',
        inNetwork: { copay: 250, covered: true, notes: 'Waived if admitted' },
        outOfNetwork: { copay: 250, covered: true, notes: 'Waived if admitted' }
      },
      {
        category: 'Inpatient Hospital',
        inNetwork: { coinsurance: 20, covered: true },
        outOfNetwork: { coinsurance: 40, covered: true }
      },
      {
        category: 'Outpatient Surgery',
        inNetwork: { coinsurance: 20, covered: true },
        outOfNetwork: { coinsurance: 40, covered: true }
      },
      {
        category: 'Mental Health - Outpatient',
        inNetwork: { copay: 30, covered: true },
        outOfNetwork: { coinsurance: 40, covered: true }
      },
      {
        category: 'Physical Therapy',
        inNetwork: { copay: 40, covered: true, notes: '30 visits per year' },
        outOfNetwork: { coinsurance: 40, covered: true }
      },
      {
        category: 'Durable Medical Equipment',
        inNetwork: { coinsurance: 20, covered: true },
        outOfNetwork: { coinsurance: 40, covered: true }
      },
      {
        category: 'Prescription Drugs - Generic',
        inNetwork: { copay: 10, covered: true },
        outOfNetwork: { covered: false }
      },
      {
        category: 'Prescription Drugs - Brand',
        inNetwork: { copay: 35, covered: true },
        outOfNetwork: { covered: false }
      }
    ];

    this.benefitsDetails.set(benefits);
  }

  manualVerification(): void {
    // Open manual verification dialog
    console.log('Opening manual verification dialog');
  }

  printVerification(): void {
    window.print();
  }

  saveToChart(): void {
    console.log('Saving verification to patient chart');
  }

  // Policy tab methods
  searchPolicyPatients(): void {
    if (this.policyPatientSearch.length < 2) {
      this.policySearchResults.set([]);
      return;
    }

    const mockPatients = [
      { id: 'pat-1', name: 'John Smith', mrn: 'MRN-001', dob: new Date('1980-05-15') },
      { id: 'pat-2', name: 'Jane Doe', mrn: 'MRN-002', dob: new Date('1975-08-22') },
      { id: 'pat-3', name: 'Robert Johnson', mrn: 'MRN-003', dob: new Date('1990-01-10') }
    ];

    const searchLower = this.policyPatientSearch.toLowerCase();
    const results = mockPatients.filter(p => 
      p.name.toLowerCase().includes(searchLower) || 
      p.mrn.toLowerCase().includes(searchLower)
    );
    this.policySearchResults.set(results);
  }

  selectPolicyPatient(patient: any): void {
    this.selectedPolicyPatient.set(patient);
    this.policySearchResults.set([]);
    this.policyPatientSearch = patient.name;
    this.loadPatientPoliciesForTab(patient.id);
  }

  loadPatientPoliciesForTab(patientId: string): void {
    // Reuse the same mock data
    this.loadPatientPolicies(patientId);
    this.selectedPatientPolicies.set(this.patientPolicies());
  }

  verifyPolicy(policy: InsurancePolicy): void {
    this.setActiveTab('verify');
    this.selectedPatient.set(this.selectedPolicyPatient());
    this.patientSearch = this.selectedPolicyPatient()?.name || '';
    this.selectPolicy(policy);
  }

  editPolicy(policy: InsurancePolicy): void {
    console.log('Edit policy', policy.policyId);
  }

  deletePolicy(policy: InsurancePolicy): void {
    console.log('Delete policy', policy.policyId);
  }

  addInsurance(): void {
    console.log('Add new insurance policy');
  }

  // History tab methods
  loadVerificationHistory(): void {
    const history: InsuranceVerification[] = [
      {
        verificationId: 'ver-1',
        policyId: 'pol-1',
        patientId: 'pat-1',
        verificationDate: new Date('2024-12-30T14:30:00'),
        verifiedBy: 'Jane Admin',
        status: VerificationStatus.Verified,
        eligibilityStatus: 'active',
        referenceNumber: 'REF-ABC123'
      },
      {
        verificationId: 'ver-2',
        policyId: 'pol-3',
        patientId: 'pat-2',
        verificationDate: new Date('2024-12-29T10:15:00'),
        verifiedBy: 'John Staff',
        status: VerificationStatus.Inactive,
        eligibilityStatus: 'inactive',
        errorMessage: 'Coverage terminated as of 12/01/2024'
      },
      {
        verificationId: 'ver-3',
        policyId: 'pol-5',
        patientId: 'pat-3',
        verificationDate: new Date('2024-12-28T16:45:00'),
        verifiedBy: 'Jane Admin',
        status: VerificationStatus.Verified,
        eligibilityStatus: 'active',
        referenceNumber: 'REF-XYZ789'
      }
    ];

    this.verificationHistory.set(history);
    this.filteredHistory.set(history);
  }

  filterHistory(): void {
    let filtered = [...this.verificationHistory()];

    if (this.historyStatusFilter) {
      filtered = filtered.filter(h => h.status === this.historyStatusFilter);
    }

    if (this.historyDateFrom) {
      const fromDate = new Date(this.historyDateFrom);
      filtered = filtered.filter(h => new Date(h.verificationDate) >= fromDate);
    }

    if (this.historyDateTo) {
      const toDate = new Date(this.historyDateTo);
      toDate.setHours(23, 59, 59);
      filtered = filtered.filter(h => new Date(h.verificationDate) <= toDate);
    }

    this.filteredHistory.set(filtered);
  }

  viewVerificationDetail(item: InsuranceVerification): void {
    console.log('View verification detail', item.verificationId);
  }

  printVerificationHistory(item: InsuranceVerification): void {
    console.log('Print verification', item.verificationId);
  }

  // Batch tab methods
  selectBatchOption(option: 'appointments' | 'unverified' | 'expiring' | 'custom'): void {
    this.batchOption.set(option);
    this.batchQueue.set([]);
    this.batchCompleted.set(false);

    // Set default date range
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    this.batchDateFrom = today.toISOString().split('T')[0];
    this.batchDateTo = nextWeek.toISOString().split('T')[0];
  }

  loadBatchPatients(): void {
    // Mock batch queue
    const queue = [
      { patientId: 'pat-1', patientName: 'John Smith', mrn: 'MRN-001', policyId: 'pol-1', payerName: 'Blue Cross Blue Shield', lastVerified: new Date('2024-12-15'), selected: true, processing: false, completed: false, result: null },
      { patientId: 'pat-2', patientName: 'Jane Doe', mrn: 'MRN-002', policyId: 'pol-2', payerName: 'Aetna', lastVerified: null, selected: true, processing: false, completed: false, result: null },
      { patientId: 'pat-3', patientName: 'Robert Johnson', mrn: 'MRN-003', policyId: 'pol-3', payerName: 'United Healthcare', lastVerified: new Date('2024-11-20'), selected: true, processing: false, completed: false, result: null },
      { patientId: 'pat-4', patientName: 'Maria Garcia', mrn: 'MRN-004', policyId: 'pol-4', payerName: 'Cigna', lastVerified: new Date('2024-12-01'), selected: true, processing: false, completed: false, result: null },
      { patientId: 'pat-5', patientName: 'James Wilson', mrn: 'MRN-005', policyId: 'pol-5', payerName: 'Humana', lastVerified: new Date('2024-10-15'), selected: true, processing: false, completed: false, result: null }
    ];

    this.batchQueue.set(queue);
  }

  toggleBatchSelectAll(): void {
    const queue = this.batchQueue();
    queue.forEach(item => {
      if (!item.processing && !item.completed) {
        item.selected = this.batchSelectAll;
      }
    });
    this.batchQueue.set([...queue]);
  }

  clearBatchQueue(): void {
    this.batchQueue.set([]);
    this.batchOption.set(null);
    this.batchCompleted.set(false);
  }

  async runBatchVerification(): Promise<void> {
    this.isBatchRunning.set(true);
    this.batchProgress.set(0);

    const queue = this.batchQueue();
    const selected = queue.filter(i => i.selected && !i.completed);

    for (let i = 0; i < selected.length; i++) {
      const item = selected[i];
      item.processing = true;
      this.batchQueue.set([...queue]);

      // Simulate verification
      await new Promise(resolve => setTimeout(resolve, 1000));

      item.processing = false;
      item.completed = true;
      item.result = {
        status: Math.random() > 0.2 ? VerificationStatus.Verified : 
                Math.random() > 0.5 ? VerificationStatus.Inactive : null,
        errorMessage: Math.random() > 0.9 ? 'Unable to connect to payer' : undefined
      };

      this.batchProgress.set(i + 1);
      this.batchQueue.set([...queue]);
    }

    this.isBatchRunning.set(false);
    this.batchCompleted.set(true);
  }

  viewBatchResult(item: any): void {
    console.log('View batch result', item);
  }

  exportBatchResults(): void {
    console.log('Export batch results');
  }

  startNewBatch(): void {
    this.batchQueue.set([]);
    this.batchOption.set(null);
    this.batchCompleted.set(false);
    this.batchProgress.set(0);
  }

  // File upload methods
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
  }

  processFile(file: File): void {
    console.log('Processing file', file.name);
    // Parse CSV and load patients
    this.loadBatchPatients();
  }

  // Helper methods
  getInsuranceTypeLabel(type: InsuranceType): string {
    return INSURANCE_TYPE_LABELS[type] || type;
  }

  getVerificationStatusLabel(status: VerificationStatus): string {
    return VERIFICATION_STATUS_LABELS[status] || status;
  }

  getPatientName(patientId: string): string {
    const names: Record<string, string> = {
      'pat-1': 'John Smith',
      'pat-2': 'Jane Doe',
      'pat-3': 'Robert Johnson'
    };
    return names[patientId] || 'Unknown Patient';
  }

  getPayerName(policyId: string): string {
    const payers: Record<string, string> = {
      'pol-1': 'Blue Cross Blue Shield',
      'pol-2': 'Aetna',
      'pol-3': 'United Healthcare'
    };
    return payers[policyId] || 'Unknown Payer';
  }

  getServiceTypeLabel(item: InsuranceVerification): string {
    return 'Health Benefit Plan Coverage';
  }

  // Navigation methods
  viewAllPolicies(): void {
    this.setActiveTab('policies');
  }

  startNewVerification(): void {
    this.clearPatient();
    this.setActiveTab('verify');
  }
}
