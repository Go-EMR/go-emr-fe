import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import {
  Claim,
  ClaimLineItem,
  ClaimStatus,
  ClaimType,
  Payment,
  PaymentStatus,
  PaymentMethod,
  InsurancePolicy,
  InsuranceType,
  InsuranceVerification,
  VerificationStatus,
  PatientStatement,
  StatementStatus,
  Adjustment,
  AdjustmentReason,
  FeeSchedule,
  Superbill,
  PLACE_OF_SERVICE_CODES,
  COMMON_CPT_CODES
} from '../models/billing.model';
import {
  MOCK_CLAIMS,
  MOCK_PAYMENTS,
  MOCK_INSURANCE_POLICIES,
  MOCK_ADJUSTMENTS,
  MOCK_STATEMENTS,
  MOCK_FEE_SCHEDULES
} from './mock-data/billing.mock';

export interface ClaimSearchParams {
  patientId?: string;
  encounterId?: string;
  status?: ClaimStatus | ClaimStatus[];
  type?: ClaimType;
  payerId?: string;
  providerId?: string;
  facilityId?: string;
  dateFrom?: string;
  dateTo?: string;
  submittedFrom?: string;
  submittedTo?: string;
  claimNumber?: string;
  hasBalance?: boolean;
  hasDenials?: boolean;
  aging?: 'current' | '30' | '60' | '90' | '120+';
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaymentSearchParams {
  patientId?: string;
  claimId?: string;
  status?: PaymentStatus;
  method?: PaymentMethod;
  source?: 'patient' | 'insurance' | 'other';
  payerId?: string;
  dateFrom?: string;
  dateTo?: string;
  hasUnapplied?: boolean;
  checkNumber?: string;
  transactionId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface StatementSearchParams {
  patientId?: string;
  status?: StatementStatus;
  dateFrom?: string;
  dateTo?: string;
  hasBalance?: boolean;
  aging?: 'current' | '30' | '60' | '90' | '120+';
  page?: number;
  pageSize?: number;
}

export interface ClaimStatistics {
  total: number;
  draft: number;
  pending: number;
  submitted: number;
  accepted: number;
  rejected: number;
  denied: number;
  partialPaid: number;
  paid: number;
  appealed: number;
  totalCharges: number;
  totalPaid: number;
  totalBalance: number;
  avgDaysToPayment: number;
  denialRate: number;
}

export interface AgingReport {
  current: { count: number; amount: number };
  days30: { count: number; amount: number };
  days60: { count: number; amount: number };
  days90: { count: number; amount: number };
  days120Plus: { count: number; amount: number };
  total: { count: number; amount: number };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const USE_MOCK = true;
const MOCK_DELAY = 300;

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/billing`;

  // ==================== CLAIMS ====================

  getClaims(params?: ClaimSearchParams): Observable<PaginatedResponse<Claim>> {
    if (USE_MOCK) {
      return of(this.filterClaims(params)).pipe(delay(MOCK_DELAY));
    }
    const httpParams = this.buildHttpParams(params);
    return this.http.get<PaginatedResponse<Claim>>(`${this.apiUrl}/claims`, { params: httpParams });
  }

  getClaimById(id: string): Observable<Claim> {
    if (USE_MOCK) {
      const claim = MOCK_CLAIMS.find(c => c.claimId === id);
      if (claim) {
        return of(claim).pipe(delay(MOCK_DELAY));
      }
      return throwError(() => new Error('Claim not found'));
    }
    return this.http.get<Claim>(`${this.apiUrl}/claims/${id}`);
  }

  getClaimByNumber(claimNumber: string): Observable<Claim> {
    if (USE_MOCK) {
      const claim = MOCK_CLAIMS.find(c => c.claimNumber === claimNumber);
      if (claim) {
        return of(claim).pipe(delay(MOCK_DELAY));
      }
      return throwError(() => new Error('Claim not found'));
    }
    return this.http.get<Claim>(`${this.apiUrl}/claims/by-number/${claimNumber}`);
  }

  createClaim(claim: Partial<Claim>): Observable<Claim> {
    if (USE_MOCK) {
      const claimId = `claim-${Date.now()}`;
      const newClaim: Claim = {
        ...claim as Claim,
        claimId,
        id: claimId,
        claimNumber: `CLM-${Date.now().toString().slice(-6)}`,
        status: ClaimStatus.Draft,
        createdDate: new Date(),
        createdAt: new Date()
      };
      return of(newClaim).pipe(delay(MOCK_DELAY));
    }
    return this.http.post<Claim>(`${this.apiUrl}/claims`, claim);
  }

  updateClaim(id: string, claim: Partial<Claim>): Observable<Claim> {
    if (USE_MOCK) {
      const existing = MOCK_CLAIMS.find(c => c.claimId === id);
      if (existing) {
        const updated = { ...existing, ...claim, updatedAt: new Date() };
        return of(updated).pipe(delay(MOCK_DELAY));
      }
      return throwError(() => new Error('Claim not found'));
    }
    return this.http.put<Claim>(`${this.apiUrl}/claims/${id}`, claim);
  }

  submitClaim(id: string): Observable<Claim> {
    if (USE_MOCK) {
      const claim = MOCK_CLAIMS.find(c => c.claimId === id);
      if (claim) {
        const submitted = {
          ...claim,
          status: ClaimStatus.Submitted,
          submittedDate: new Date()
        };
        return of(submitted).pipe(delay(MOCK_DELAY));
      }
      return throwError(() => new Error('Claim not found'));
    }
    return this.http.post<Claim>(`${this.apiUrl}/claims/${id}/submit`, {});
  }

  voidClaim(id: string, reason: string): Observable<Claim> {
    if (USE_MOCK) {
      const claim = MOCK_CLAIMS.find(c => c.claimId === id);
      if (claim) {
        const voided = {
          ...claim,
          status: ClaimStatus.Voided,
          notes: reason
        };
        return of(voided).pipe(delay(MOCK_DELAY));
      }
      return throwError(() => new Error('Claim not found'));
    }
    return this.http.post<Claim>(`${this.apiUrl}/claims/${id}/void`, { reason });
  }

  rebillClaim(id: string): Observable<Claim> {
    if (USE_MOCK) {
      const original = MOCK_CLAIMS.find(c => c.claimId === id);
      if (original) {
        const newClaimId = `claim-${Date.now()}`;
        const rebilled: Claim = {
          ...original,
          claimId: newClaimId,
          id: newClaimId,
          claimNumber: `CLM-${Date.now().toString().slice(-6)}`,
          status: ClaimStatus.Draft,
          originalClaimId: id,
          createdAt: new Date(),
          submittedDate: undefined,
          processedDate: undefined,
          paidDate: undefined
        };
        return of(rebilled).pipe(delay(MOCK_DELAY));
      }
      return throwError(() => new Error('Claim not found'));
    }
    return this.http.post<Claim>(`${this.apiUrl}/claims/${id}/rebill`, {});
  }

  appealClaim(id: string, appealReason: string, supportingDocs?: string[]): Observable<Claim> {
    if (USE_MOCK) {
      const claim = MOCK_CLAIMS.find(c => c.claimId === id);
      if (claim) {
        const appealed = {
          ...claim,
          status: ClaimStatus.Appealed,
          appealDate: new Date(),
          appealReason
        };
        return of(appealed).pipe(delay(MOCK_DELAY));
      }
      return throwError(() => new Error('Claim not found'));
    }
    return this.http.post<Claim>(`${this.apiUrl}/claims/${id}/appeal`, { appealReason, supportingDocs });
  }

  getClaimStatistics(params?: { providerId?: string; facilityId?: string; dateFrom?: string; dateTo?: string }): Observable<ClaimStatistics> {
    if (USE_MOCK) {
      const stats: ClaimStatistics = {
        total: MOCK_CLAIMS.length,
        draft: MOCK_CLAIMS.filter(c => c.status === ClaimStatus.Draft).length,
        pending: MOCK_CLAIMS.filter(c => c.status === ClaimStatus.Pending).length,
        submitted: MOCK_CLAIMS.filter(c => c.status === ClaimStatus.Submitted).length,
        accepted: MOCK_CLAIMS.filter(c => c.status === ClaimStatus.Accepted).length,
        rejected: MOCK_CLAIMS.filter(c => c.status === ClaimStatus.Rejected).length,
        denied: MOCK_CLAIMS.filter(c => c.status === ClaimStatus.Denied).length,
        partialPaid: MOCK_CLAIMS.filter(c => c.status === ClaimStatus.PartialPaid).length,
        paid: MOCK_CLAIMS.filter(c => c.status === ClaimStatus.Paid).length,
        appealed: MOCK_CLAIMS.filter(c => c.status === ClaimStatus.Appealed).length,
        totalCharges: MOCK_CLAIMS.reduce((sum, c) => sum + c.totalCharges, 0),
        totalPaid: MOCK_CLAIMS.reduce((sum, c) => sum + c.totalPaid, 0),
        totalBalance: MOCK_CLAIMS.reduce((sum, c) => sum + c.balance, 0),
        avgDaysToPayment: 18,
        denialRate: 0.08
      };
      return of(stats).pipe(delay(MOCK_DELAY));
    }
    const httpParams = this.buildHttpParams(params);
    return this.http.get<ClaimStatistics>(`${this.apiUrl}/claims/statistics`, { params: httpParams });
  }

  getAgingReport(params?: { providerId?: string; facilityId?: string; payerId?: string }): Observable<AgingReport> {
    if (USE_MOCK) {
      const report: AgingReport = {
        current: { count: 2, amount: 505 },
        days30: { count: 1, amount: 125 },
        days60: { count: 0, amount: 0 },
        days90: { count: 0, amount: 0 },
        days120Plus: { count: 0, amount: 0 },
        total: { count: 3, amount: 630 }
      };
      return of(report).pipe(delay(MOCK_DELAY));
    }
    const httpParams = this.buildHttpParams(params);
    return this.http.get<AgingReport>(`${this.apiUrl}/claims/aging`, { params: httpParams });
  }

  // ==================== PAYMENTS ====================

  getPayments(params?: PaymentSearchParams): Observable<PaginatedResponse<Payment>> {
    if (USE_MOCK) {
      return of(this.filterPayments(params)).pipe(delay(MOCK_DELAY));
    }
    const httpParams = this.buildHttpParams(params);
    return this.http.get<PaginatedResponse<Payment>>(`${this.apiUrl}/payments`, { params: httpParams });
  }

  getPaymentById(id: string): Observable<Payment> {
    if (USE_MOCK) {
      const payment = MOCK_PAYMENTS.find(p => p.paymentId === id);
      if (payment) {
        return of(payment).pipe(delay(MOCK_DELAY));
      }
      return throwError(() => new Error('Payment not found'));
    }
    return this.http.get<Payment>(`${this.apiUrl}/payments/${id}`);
  }

  createPayment(payment: Partial<Payment>): Observable<Payment> {
    if (USE_MOCK) {
      const paymentId = `payment-${Date.now()}`;
      const newPayment: Payment = {
        ...payment as Payment,
        paymentId,
        id: paymentId,
        paymentNumber: `PAY-${Date.now().toString().slice(-6)}`,
        status: PaymentStatus.Pending,
        paymentDate: new Date(),
        createdAt: new Date(),
        createdBy: 'current-user'
      };
      return of(newPayment).pipe(delay(MOCK_DELAY));
    }
    return this.http.post<Payment>(`${this.apiUrl}/payments`, payment);
  }

  applyPayment(paymentId: string, applications: { claimId: string; lineItemId?: string; amount: number }[]): Observable<Payment> {
    if (USE_MOCK) {
      const payment = MOCK_PAYMENTS.find(p => p.paymentId === paymentId);
      if (payment) {
        const totalApplied = applications.reduce((sum, a) => sum + a.amount, 0);
        const updated = {
          ...payment,
          applications: [
            ...payment.applications,
            ...applications.map((a, index) => ({
              applicationId: `app-${Date.now()}-${index}`,
              claimId: a.claimId,
              lineItemId: a.lineItemId,
              amount: a.amount,
              appliedDate: new Date(),
              appliedBy: 'current-user'
            }))
          ],
          unappliedAmount: payment.unappliedAmount - totalApplied,
          status: payment.unappliedAmount - totalApplied <= 0 ? PaymentStatus.Applied : PaymentStatus.Posted
        };
        return of(updated).pipe(delay(MOCK_DELAY));
      }
      return throwError(() => new Error('Payment not found'));
    }
    return this.http.post<Payment>(`${this.apiUrl}/payments/${paymentId}/apply`, { applications });
  }

  voidPayment(id: string, reason: string): Observable<Payment> {
    if (USE_MOCK) {
      const payment = MOCK_PAYMENTS.find(p => p.paymentId === id);
      if (payment) {
        const voided = {
          ...payment,
          status: PaymentStatus.Voided,
          notes: reason
        };
        return of(voided).pipe(delay(MOCK_DELAY));
      }
      return throwError(() => new Error('Payment not found'));
    }
    return this.http.post<Payment>(`${this.apiUrl}/payments/${id}/void`, { reason });
  }

  refundPayment(id: string, amount: number, reason: string): Observable<Payment> {
    if (USE_MOCK) {
      const payment = MOCK_PAYMENTS.find(p => p.paymentId === id);
      if (payment) {
        const refunded = {
          ...payment,
          status: PaymentStatus.Refunded,
          refundAmount: amount,
          refundDate: new Date(),
          refundReason: reason
        };
        return of(refunded).pipe(delay(MOCK_DELAY));
      }
      return throwError(() => new Error('Payment not found'));
    }
    return this.http.post<Payment>(`${this.apiUrl}/payments/${id}/refund`, { amount, reason });
  }

  getUnappliedPayments(patientId?: string): Observable<Payment[]> {
    if (USE_MOCK) {
      let payments = MOCK_PAYMENTS.filter(p => p.unappliedAmount > 0);
      if (patientId) {
        payments = payments.filter(p => p.patientId === patientId);
      }
      return of(payments).pipe(delay(MOCK_DELAY));
    }
    const params = patientId ? new HttpParams().set('patientId', patientId) : undefined;
    return this.http.get<Payment[]>(`${this.apiUrl}/payments/unapplied`, { params });
  }

  // ==================== INSURANCE ====================

  getInsurancePolicies(patientId: string): Observable<InsurancePolicy[]> {
    if (USE_MOCK) {
      const policies = MOCK_INSURANCE_POLICIES.filter(p => p.patientId === patientId);
      return of(policies).pipe(delay(MOCK_DELAY));
    }
    return this.http.get<InsurancePolicy[]>(`${this.apiUrl}/patients/${patientId}/insurance`);
  }

  getInsurancePolicyById(id: string): Observable<InsurancePolicy> {
    if (USE_MOCK) {
      const policy = MOCK_INSURANCE_POLICIES.find(p => p.policyId === id);
      if (policy) {
        return of(policy).pipe(delay(MOCK_DELAY));
      }
      return throwError(() => new Error('Insurance policy not found'));
    }
    return this.http.get<InsurancePolicy>(`${this.apiUrl}/insurance/${id}`);
  }

  createInsurancePolicy(policy: Partial<InsurancePolicy>): Observable<InsurancePolicy> {
    if (USE_MOCK) {
      const newPolicy: InsurancePolicy = {
        ...policy as InsurancePolicy,
        id: `ins-${Date.now()}`,
        verificationStatus: VerificationStatus.NotVerified,
        isActive: true,
        createdAt: new Date()
      };
      return of(newPolicy).pipe(delay(MOCK_DELAY));
    }
    return this.http.post<InsurancePolicy>(`${this.apiUrl}/insurance`, policy);
  }

  updateInsurancePolicy(id: string, policy: Partial<InsurancePolicy>): Observable<InsurancePolicy> {
    if (USE_MOCK) {
      const existing = MOCK_INSURANCE_POLICIES.find(p => p.policyId === id);
      if (existing) {
        const updated = { ...existing, ...policy, updatedAt: new Date() };
        return of(updated).pipe(delay(MOCK_DELAY));
      }
      return throwError(() => new Error('Insurance policy not found'));
    }
    return this.http.put<InsurancePolicy>(`${this.apiUrl}/insurance/${id}`, policy);
  }

  verifyInsurance(policyId: string): Observable<InsuranceVerification> {
    if (USE_MOCK) {
      const policy = MOCK_INSURANCE_POLICIES.find(p => p.policyId === policyId);
      if (policy) {
        const verification: InsuranceVerification = {
          verificationId: `ver-${Date.now()}`,
          policyId,
          patientId: policy.patientId,
          verificationDate: new Date(),
          verifiedBy: 'current-user',
          status: VerificationStatus.Verified,
          eligibilityStatus: 'active',
          effectiveDate: policy.effectiveDate,
          terminationDate: policy.terminationDate,
          planName: policy.planName,
          planType: policy.planType,
          copay: policy.copay,
          coinsurance: policy.coinsurance,
          deductible: policy.deductible,
          deductibleMet: policy.deductibleMet,
          outOfPocketMax: policy.outOfPocketMax,
          outOfPocketMet: policy.outOfPocketMet,
          inNetwork: true,
          providerNetworkStatus: 'in-network',
          referenceNumber: `REF-${Date.now().toString().slice(-8)}`,
          representativeName: 'John Doe'
        };
        return of(verification).pipe(delay(MOCK_DELAY * 3)); // Longer delay for verification
      }
      return throwError(() => new Error('Insurance policy not found'));
    }
    return this.http.post<InsuranceVerification>(`${this.apiUrl}/insurance/${policyId}/verify`, {});
  }

  getVerificationHistory(policyId: string): Observable<InsuranceVerification[]> {
    if (USE_MOCK) {
      // Return mock verification history
      const verifications: InsuranceVerification[] = [{
        verificationId: 'ver-1',
        policyId,
        patientId: 'patient-1',
        verificationDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        verifiedBy: 'admin',
        status: VerificationStatus.Verified,
        eligibilityStatus: 'active',
        inNetwork: true,
        referenceNumber: 'REF-12345678'
      }];
      return of(verifications).pipe(delay(MOCK_DELAY));
    }
    return this.http.get<InsuranceVerification[]>(`${this.apiUrl}/insurance/${policyId}/verifications`);
  }

  // ==================== STATEMENTS ====================

  getStatements(params?: StatementSearchParams): Observable<PaginatedResponse<PatientStatement>> {
    if (USE_MOCK) {
      return of(this.filterStatements(params)).pipe(delay(MOCK_DELAY));
    }
    const httpParams = this.buildHttpParams(params);
    return this.http.get<PaginatedResponse<PatientStatement>>(`${this.apiUrl}/statements`, { params: httpParams });
  }

  getStatementById(id: string): Observable<PatientStatement> {
    if (USE_MOCK) {
      const statement = MOCK_STATEMENTS.find(s => s.statementId === id);
      if (statement) {
        return of(statement).pipe(delay(MOCK_DELAY));
      }
      return throwError(() => new Error('Statement not found'));
    }
    return this.http.get<PatientStatement>(`${this.apiUrl}/statements/${id}`);
  }

  generateStatement(patientId: string): Observable<PatientStatement> {
    if (USE_MOCK) {
      const statementId = `stmt-${Date.now()}`;
      const newStatement: PatientStatement = {
        statementId,
        id: statementId,
        patientId,
        statementNumber: `STMT-${Date.now().toString().slice(-6)}`,
        status: StatementStatus.Generated,
        statementDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        previousBalance: 0,
        newCharges: 0,
        payments: 0,
        adjustments: 0,
        currentBalance: 0,
        current: 0,
        over30: 0,
        over60: 0,
        over90: 0,
        over120: 0,
        lineItems: [],
        deliveryMethod: 'email',
        createdAt: new Date(),
        createdBy: 'current-user'
      };
      return of(newStatement).pipe(delay(MOCK_DELAY));
    }
    return this.http.post<PatientStatement>(`${this.apiUrl}/statements/generate`, { patientId });
  }

  sendStatement(id: string, method: 'mail' | 'email' | 'portal' | 'both'): Observable<PatientStatement> {
    if (USE_MOCK) {
      const statement = MOCK_STATEMENTS.find(s => s.statementId === id);
      if (statement) {
        const sent = {
          ...statement,
          status: StatementStatus.Sent,
          sentDate: new Date(),
          deliveryMethod: method
        };
        return of(sent).pipe(delay(MOCK_DELAY));
      }
      return throwError(() => new Error('Statement not found'));
    }
    return this.http.post<PatientStatement>(`${this.apiUrl}/statements/${id}/send`, { method });
  }

  markStatementPaid(id: string): Observable<PatientStatement> {
    if (USE_MOCK) {
      const statement = MOCK_STATEMENTS.find(s => s.statementId === id);
      if (statement) {
        const paid = {
          ...statement,
          status: StatementStatus.Paid,
          currentBalance: 0
        };
        return of(paid).pipe(delay(MOCK_DELAY));
      }
      return throwError(() => new Error('Statement not found'));
    }
    return this.http.post<PatientStatement>(`${this.apiUrl}/statements/${id}/mark-paid`, {});
  }

  sendToCollections(id: string, collectionAgency: string): Observable<PatientStatement> {
    if (USE_MOCK) {
      const statement = MOCK_STATEMENTS.find(s => s.statementId === id);
      if (statement) {
        const collections = {
          ...statement,
          status: StatementStatus.Collections,
          notes: `Sent to collections: ${collectionAgency}`
        };
        return of(collections).pipe(delay(MOCK_DELAY));
      }
      return throwError(() => new Error('Statement not found'));
    }
    return this.http.post<PatientStatement>(`${this.apiUrl}/statements/${id}/collections`, { collectionAgency });
  }

  // ==================== ADJUSTMENTS ====================

  getAdjustments(claimId?: string): Observable<Adjustment[]> {
    if (USE_MOCK) {
      let adjustments = [...MOCK_ADJUSTMENTS];
      if (claimId) {
        adjustments = adjustments.filter(a => a.claimId === claimId);
      }
      return of(adjustments).pipe(delay(MOCK_DELAY));
    }
    const params = claimId ? new HttpParams().set('claimId', claimId) : undefined;
    return this.http.get<Adjustment[]>(`${this.apiUrl}/adjustments`, { params });
  }

  createAdjustment(adjustment: Partial<Adjustment>): Observable<Adjustment> {
    if (USE_MOCK) {
      const adjustmentId = `adj-${Date.now()}`;
      const newAdjustment: Adjustment = {
        ...adjustment as Adjustment,
        adjustmentId,
        id: adjustmentId,
        adjustmentDate: new Date(),
        createdBy: 'current-user'
      };
      return of(newAdjustment).pipe(delay(MOCK_DELAY));
    }
    return this.http.post<Adjustment>(`${this.apiUrl}/adjustments`, adjustment);
  }

  approveAdjustment(id: string): Observable<Adjustment> {
    if (USE_MOCK) {
      const adjustment = MOCK_ADJUSTMENTS.find(a => a.adjustmentId === id);
      if (adjustment) {
        const approved = {
          ...adjustment,
          approvedBy: 'supervisor',
          approvedDate: new Date()
        };
        return of(approved).pipe(delay(MOCK_DELAY));
      }
      return throwError(() => new Error('Adjustment not found'));
    }
    return this.http.post<Adjustment>(`${this.apiUrl}/adjustments/${id}/approve`, {});
  }

  // ==================== FEE SCHEDULES ====================

  getFeeSchedules(): Observable<FeeSchedule[]> {
    if (USE_MOCK) {
      return of(MOCK_FEE_SCHEDULES).pipe(delay(MOCK_DELAY));
    }
    return this.http.get<FeeSchedule[]>(`${this.apiUrl}/fee-schedules`);
  }

  getFeeScheduleById(id: string): Observable<FeeSchedule> {
    if (USE_MOCK) {
      const schedule = MOCK_FEE_SCHEDULES.find(s => s.scheduleId === id);
      if (schedule) {
        return of(schedule).pipe(delay(MOCK_DELAY));
      }
      return throwError(() => new Error('Fee schedule not found'));
    }
    return this.http.get<FeeSchedule>(`${this.apiUrl}/fee-schedules/${id}`);
  }

  lookupFee(procedureCode: string, feeScheduleId?: string): Observable<{ fee: number; allowedAmount?: number }> {
    if (USE_MOCK) {
      const schedule = feeScheduleId 
        ? MOCK_FEE_SCHEDULES.find(s => s.scheduleId === feeScheduleId)
        : MOCK_FEE_SCHEDULES.find(s => s.isActive && s.type === 'standard');
      
      if (schedule) {
        const feeItem = schedule.fees.find(f => f.procedureCode === procedureCode);
        if (feeItem) {
          return of({ fee: feeItem.fee, allowedAmount: feeItem.allowedAmount }).pipe(delay(MOCK_DELAY));
        }
      }
      // Return from common CPT codes if not in fee schedule
      const commonCode = COMMON_CPT_CODES.find(c => c.code === procedureCode);
      if (commonCode) {
        return of({ fee: commonCode.fee }).pipe(delay(MOCK_DELAY));
      }
      return of({ fee: 0 }).pipe(delay(MOCK_DELAY));
    }
    const params = feeScheduleId ? new HttpParams().set('scheduleId', feeScheduleId) : undefined;
    return this.http.get<{ fee: number; allowedAmount?: number }>(`${this.apiUrl}/fee-schedules/lookup/${procedureCode}`, { params });
  }

  // ==================== SUPERBILLS ====================

  createSuperbill(encounterId: string): Observable<Superbill> {
    if (USE_MOCK) {
      const superbill: Superbill = {
        superbillId: `sb-${Date.now()}`,
        encounterId,
        patientId: 'patient-1',
        patientName: 'John Smith',
        providerId: 'provider-1',
        providerName: 'Dr. Sarah Johnson',
        encounterDate: new Date(),
        diagnosisCodes: [],
        services: [],
        totalCharges: 0,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      return of(superbill).pipe(delay(MOCK_DELAY));
    }
    return this.http.post<Superbill>(`${this.apiUrl}/superbills`, { encounterId });
  }

  getSuperbill(encounterId: string): Observable<Superbill | null> {
    if (USE_MOCK) {
      // Return null for mock - would normally look up by encounter
      return of(null).pipe(delay(MOCK_DELAY));
    }
    return this.http.get<Superbill | null>(`${this.apiUrl}/superbills/by-encounter/${encounterId}`);
  }

  updateSuperbill(id: string, superbill: Partial<Superbill>): Observable<Superbill> {
    if (USE_MOCK) {
      const updated: Superbill = {
        superbillId: id,
        encounterId: superbill.encounterId || '',
        patientId: superbill.patientId || '',
        patientName: superbill.patientName || '',
        providerId: superbill.providerId || '',
        providerName: superbill.providerName || '',
        encounterDate: superbill.encounterDate || new Date(),
        diagnosisCodes: superbill.diagnosisCodes || [],
        services: superbill.services || [],
        totalCharges: superbill.totalCharges || 0,
        status: superbill.status || 'draft',
        createdAt: superbill.createdAt || new Date(),
        updatedAt: new Date()
      };
      return of(updated).pipe(delay(MOCK_DELAY));
    }
    return this.http.put<Superbill>(`${this.apiUrl}/superbills/${id}`, superbill);
  }

  submitSuperbillForBilling(id: string): Observable<Claim> {
    if (USE_MOCK) {
      // Create a claim from the superbill
      const claimId = `claim-${Date.now()}`;
      const claim: Claim = {
        claimId,
        id: claimId,
        claimNumber: `CLM-${Date.now().toString().slice(-6)}`,
        type: ClaimType.Professional,
        status: ClaimStatus.Draft,
        patientId: 'patient-1',
        patientName: 'John Smith',
        encounterId: 'encounter-1',
        insuranceId: 'ins-1',
        insuranceType: InsuranceType.Primary,
        payerId: 'payer-1',
        payerName: 'BCBS',
        subscriberId: 'SUB-001',
        renderingProviderId: 'provider-1',
        renderingProviderName: 'Dr. Sarah Johnson',
        renderingProviderNPI: '1234567890',
        serviceDate: new Date(),
        placeOfService: 'Office',
        placeOfServiceCode: '11',
        diagnosisCodes: [],
        principalDiagnosis: '',
        lineItems: [],
        totalCharges: 0,
        totalAllowed: 0,
        totalPaid: 0,
        totalAdjustments: 0,
        patientResponsibility: 0,
        balance: 0,
        createdDate: new Date(),
        createdAt: new Date(),
        createdBy: 'system',
        updatedAt: new Date(),
      };
      return of(claim).pipe(delay(MOCK_DELAY));
    }
    return this.http.post<Claim>(`${this.apiUrl}/superbills/${id}/submit`, {});
  }

  // ==================== REFERENCE DATA ====================

  getPlaceOfServiceCodes(): Observable<typeof PLACE_OF_SERVICE_CODES> {
    return of(PLACE_OF_SERVICE_CODES).pipe(delay(100));
  }

  getCommonCptCodes(): Observable<typeof COMMON_CPT_CODES> {
    return of(COMMON_CPT_CODES).pipe(delay(100));
  }

  searchCptCodes(query: string): Observable<{ code: string; description: string; fee: number }[]> {
    if (USE_MOCK) {
      const results = COMMON_CPT_CODES.filter(c => 
        c.code.includes(query) || c.description.toLowerCase().includes(query.toLowerCase())
      );
      return of(results).pipe(delay(MOCK_DELAY));
    }
    return this.http.get<{ code: string; description: string; fee: number }[]>(
      `${this.apiUrl}/cpt-codes/search`,
      { params: new HttpParams().set('q', query) }
    );
  }

  searchIcd10Codes(query: string): Observable<{ code: string; description: string }[]> {
    if (USE_MOCK) {
      // Mock ICD-10 codes
      const mockCodes = [
        { code: 'J06.9', description: 'Acute upper respiratory infection, unspecified' },
        { code: 'J02.9', description: 'Acute pharyngitis, unspecified' },
        { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
        { code: 'I10', description: 'Essential (primary) hypertension' },
        { code: 'M54.5', description: 'Low back pain' },
        { code: 'R10.9', description: 'Unspecified abdominal pain' },
        { code: 'K21.0', description: 'Gastro-esophageal reflux disease with esophagitis' },
        { code: 'F32.9', description: 'Major depressive disorder, single episode, unspecified' },
        { code: 'J45.909', description: 'Unspecified asthma, uncomplicated' },
        { code: 'N39.0', description: 'Urinary tract infection, site not specified' }
      ];
      const results = mockCodes.filter(c =>
        c.code.toLowerCase().includes(query.toLowerCase()) ||
        c.description.toLowerCase().includes(query.toLowerCase())
      );
      return of(results).pipe(delay(MOCK_DELAY));
    }
    return this.http.get<{ code: string; description: string }[]>(
      `${this.apiUrl}/icd10-codes/search`,
      { params: new HttpParams().set('q', query) }
    );
  }

  // ==================== HELPER METHODS ====================

  private filterClaims(params?: ClaimSearchParams): PaginatedResponse<Claim> {
    let claims = [...MOCK_CLAIMS];
    
    if (params?.patientId) {
      claims = claims.filter(c => c.patientId === params.patientId);
    }
    if (params?.encounterId) {
      claims = claims.filter(c => c.encounterId === params.encounterId);
    }
    if (params?.status) {
      const statuses = Array.isArray(params.status) ? params.status : [params.status];
      claims = claims.filter(c => statuses.includes(c.status));
    }
    if (params?.type) {
      claims = claims.filter(c => c.type === params.type);
    }
    if (params?.payerId) {
      claims = claims.filter(c => c.payerId === params.payerId);
    }
    if (params?.claimNumber) {
      claims = claims.filter(c => 
        c.claimNumber.toLowerCase().includes(params.claimNumber!.toLowerCase())
      );
    }
    if (params?.hasBalance) {
      claims = claims.filter(c => c.balance > 0);
    }
    if (params?.hasDenials) {
      claims = claims.filter(c => 
        c.status === ClaimStatus.Denied || 
        c.status === ClaimStatus.Rejected ||
        c.lineItems.some(li => li.adjudicationStatus === 'denied')
      );
    }

    // Sort
    if (params?.sortBy) {
      claims.sort((a, b) => {
        const aVal = (a as any)[params.sortBy!];
        const bVal = (b as any)[params.sortBy!];
        const order = params.sortOrder === 'desc' ? -1 : 1;
        return aVal > bVal ? order : aVal < bVal ? -order : 0;
      });
    } else {
      // Default sort by created date desc
      claims.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    // Paginate
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 20;
    const start = (page - 1) * pageSize;
    const paginatedClaims = claims.slice(start, start + pageSize);

    return {
      data: paginatedClaims,
      total: claims.length,
      page,
      pageSize,
      totalPages: Math.ceil(claims.length / pageSize)
    };
  }

  private filterPayments(params?: PaymentSearchParams): PaginatedResponse<Payment> {
    let payments = [...MOCK_PAYMENTS];

    if (params?.patientId) {
      payments = payments.filter(p => p.patientId === params.patientId);
    }
    if (params?.claimId) {
      payments = payments.filter(p => p.applications.some(a => a.claimId === params.claimId));
    }
    if (params?.status) {
      payments = payments.filter(p => p.status === params.status);
    }
    if (params?.method) {
      payments = payments.filter(p => p.method === params.method);
    }
    if (params?.source) {
      payments = payments.filter(p => p.source === params.source);
    }
    if (params?.hasUnapplied) {
      payments = payments.filter(p => p.unappliedAmount > 0);
    }

    // Sort by date desc
    payments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

    // Paginate
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 20;
    const start = (page - 1) * pageSize;
    const paginatedPayments = payments.slice(start, start + pageSize);

    return {
      data: paginatedPayments,
      total: payments.length,
      page,
      pageSize,
      totalPages: Math.ceil(payments.length / pageSize)
    };
  }

  private filterStatements(params?: StatementSearchParams): PaginatedResponse<PatientStatement> {
    let statements = [...MOCK_STATEMENTS];

    if (params?.patientId) {
      statements = statements.filter(s => s.patientId === params.patientId);
    }
    if (params?.status) {
      statements = statements.filter(s => s.status === params.status);
    }
    if (params?.hasBalance) {
      statements = statements.filter(s => s.currentBalance > 0);
    }

    // Sort by date desc
    statements.sort((a, b) => new Date(b.statementDate).getTime() - new Date(a.statementDate).getTime());

    // Paginate
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 20;
    const start = (page - 1) * pageSize;
    const paginatedStatements = statements.slice(start, start + pageSize);

    return {
      data: paginatedStatements,
      total: statements.length,
      page,
      pageSize,
      totalPages: Math.ceil(statements.length / pageSize)
    };
  }

  private buildHttpParams(params?: Record<string, any>): HttpParams {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => {
              httpParams = httpParams.append(key, v);
            });
          } else {
            httpParams = httpParams.set(key, value.toString());
          }
        }
      });
    }
    return httpParams;
  }
}
