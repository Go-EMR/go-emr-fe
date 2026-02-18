import {
  Claim,
  ClaimStatus,
  ClaimType,
  Payment,
  PaymentStatus,
  PaymentMethod,
  InsurancePolicy,
  InsuranceType,
  VerificationStatus,
  Adjustment,
  AdjustmentReason,
  PatientStatement,
  StatementStatus,
  FeeSchedule
} from '../../models/billing.model';

// Helper function to create dates
const daysAgo = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

// ==================== Insurance Policies ====================

export const MOCK_INSURANCE_POLICIES: InsurancePolicy[] = [];

// ==================== Claims ====================

export const MOCK_CLAIMS: Claim[] = [];

// ==================== Payments ====================

export const MOCK_PAYMENTS: Payment[] = [];

// ==================== Adjustments ====================

export const MOCK_ADJUSTMENTS: Adjustment[] = [];

// ==================== Patient Statements ====================

export const MOCK_STATEMENTS: PatientStatement[] = [];

// ==================== Fee Schedule ====================

export const MOCK_FEE_SCHEDULES: FeeSchedule[] = [];
