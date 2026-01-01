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

export const MOCK_INSURANCE_POLICIES: InsurancePolicy[] = [
  {
    policyId: 'INS-001',
    patientId: 'P001',
    type: InsuranceType.Primary,
    payerId: 'BCBS-001',
    payerName: 'Blue Cross Blue Shield',
    payerAddress: {
      line1: '300 E. Randolph Street',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601'
    },
    payerPhone: '(800) 555-2583',
    subscriberId: 'XYZ123456789',
    groupNumber: 'GRP-54321',
    planName: 'PPO Gold',
    planType: 'PPO',
    effectiveDate: new Date('2024-01-01'),
    subscriberName: 'John Smith',
    subscriberDob: new Date('1980-03-15'),
    subscriberRelationship: 'Self',
    copay: 30,
    coinsurance: 20,
    deductible: 1500,
    deductibleMet: 750,
    outOfPocketMax: 6000,
    outOfPocketMet: 1200,
    verificationStatus: VerificationStatus.Verified,
    lastVerifiedDate: daysAgo(7),
    verifiedBy: 'Jane Doe',
    requiresAuth: true,
    authRequirements: 'Required for all imaging and outpatient surgery',
    isActive: true,
    isPrimary: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: daysAgo(7)
  },
  {
    policyId: 'INS-002',
    patientId: 'P002',
    type: InsuranceType.Primary,
    payerId: 'AETNA-001',
    payerName: 'Aetna',
    payerAddress: {
      line1: '151 Farmington Ave',
      city: 'Hartford',
      state: 'CT',
      zipCode: '06156'
    },
    payerPhone: '(800) 872-3862',
    subscriberId: 'W123456789',
    groupNumber: 'EMP-99887',
    planName: 'HMO Standard',
    planType: 'HMO',
    effectiveDate: new Date('2024-03-01'),
    subscriberName: 'Sarah Johnson',
    subscriberDob: new Date('1975-07-22'),
    subscriberRelationship: 'Self',
    copay: 25,
    coinsurance: 10,
    deductible: 500,
    deductibleMet: 500,
    outOfPocketMax: 3000,
    outOfPocketMet: 850,
    verificationStatus: VerificationStatus.Verified,
    lastVerifiedDate: daysAgo(14),
    verifiedBy: 'Admin User',
    requiresAuth: true,
    authRequirements: 'PCP referral required for specialists',
    isActive: true,
    isPrimary: true,
    createdAt: new Date('2024-03-01'),
    updatedAt: daysAgo(14)
  },
  {
    policyId: 'INS-003',
    patientId: 'P003',
    type: InsuranceType.Primary,
    payerId: 'MEDICARE-001',
    payerName: 'Medicare Part B',
    payerAddress: {
      line1: '7500 Security Blvd',
      city: 'Baltimore',
      state: 'MD',
      zipCode: '21244'
    },
    payerPhone: '(800) 633-4227',
    subscriberId: '1EG4-TE5-MK72',
    planName: 'Original Medicare',
    planType: 'Medicare',
    effectiveDate: new Date('2022-01-01'),
    subscriberName: 'Michael Brown',
    subscriberDob: new Date('1955-11-08'),
    subscriberRelationship: 'Self',
    copay: 0,
    coinsurance: 20,
    deductible: 240,
    deductibleMet: 240,
    verificationStatus: VerificationStatus.Verified,
    lastVerifiedDate: daysAgo(30),
    verifiedBy: 'System',
    isActive: true,
    isPrimary: true,
    createdAt: new Date('2022-01-01'),
    updatedAt: daysAgo(30)
  },
  {
    policyId: 'INS-004',
    patientId: 'P003',
    type: InsuranceType.Secondary,
    payerId: 'MEDIGAP-001',
    payerName: 'AARP Medicare Supplement',
    subscriberId: 'MS-789456123',
    planName: 'Plan G',
    planType: 'Medigap',
    effectiveDate: new Date('2022-01-01'),
    subscriberName: 'Michael Brown',
    subscriberDob: new Date('1955-11-08'),
    subscriberRelationship: 'Self',
    verificationStatus: VerificationStatus.Verified,
    lastVerifiedDate: daysAgo(30),
    isActive: true,
    isPrimary: false,
    createdAt: new Date('2022-01-01'),
    updatedAt: daysAgo(30)
  },
  {
    policyId: 'INS-005',
    patientId: 'P004',
    type: InsuranceType.Primary,
    payerId: 'UHC-001',
    payerName: 'United Healthcare',
    subscriberId: 'U987654321',
    groupNumber: 'CORP-12345',
    planName: 'Choice Plus',
    planType: 'PPO',
    effectiveDate: new Date('2024-01-01'),
    subscriberName: 'Robert Wilson',
    subscriberDob: new Date('1988-02-14'),
    subscriberRelationship: 'Spouse',
    copay: 35,
    coinsurance: 20,
    deductible: 2000,
    deductibleMet: 0,
    outOfPocketMax: 8000,
    outOfPocketMet: 0,
    verificationStatus: VerificationStatus.NotVerified,
    isActive: true,
    isPrimary: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

// ==================== Claims ====================

export const MOCK_CLAIMS: Claim[] = [
  {
    claimId: 'CLM-001',
    claimNumber: '2024120001',
    patientId: 'P001',
    encounterId: 'ENC-001',
    type: ClaimType.Professional,
    status: ClaimStatus.Paid,
    insuranceId: 'INS-001',
    insuranceType: InsuranceType.Primary,
    payerId: 'BCBS-001',
    payerName: 'Blue Cross Blue Shield',
    subscriberId: 'XYZ123456789',
    groupNumber: 'GRP-54321',
    renderingProviderId: 'PROV-001',
    renderingProviderName: 'Dr. Sarah Wilson',
    renderingProviderNPI: '1234567890',
    billingProviderId: 'PROV-001',
    billingProviderName: 'Springfield Medical Clinic',
    billingProviderNPI: '1234567890',
    facilityId: 'FAC-001',
    facilityName: 'Springfield Medical Clinic',
    serviceDate: daysAgo(30),
    placeOfService: 'Office',
    placeOfServiceCode: '11',
    diagnosisCodes: [
      { code: 'J06.9', description: 'Acute upper respiratory infection, unspecified', pointer: 1, isPrincipal: true },
      { code: 'R50.9', description: 'Fever, unspecified', pointer: 2 }
    ],
    principalDiagnosis: 'J06.9',
    lineItems: [
      {
        lineItemId: 'LI-001-1',
        lineNumber: 1,
        procedureCode: '99214',
        procedureDescription: 'Office visit, established patient, level 4',
        diagnosisPointers: [1, 2],
        units: 1,
        unitCharge: 175,
        totalCharge: 175,
        allowedAmount: 140,
        paidAmount: 112,
        adjustmentAmount: 35,
        patientAmount: 28,
        serviceDate: daysAgo(30),
        status: 'paid',
        adjustments: [
          { adjustmentId: 'ADJ-001', groupCode: 'CO', reasonCode: '45', amount: 35, description: 'Contractual adjustment' }
        ]
      },
      {
        lineItemId: 'LI-001-2',
        lineNumber: 2,
        procedureCode: '87880',
        procedureDescription: 'Strep test, rapid',
        diagnosisPointers: [1],
        units: 1,
        unitCharge: 45,
        totalCharge: 45,
        allowedAmount: 35,
        paidAmount: 28,
        adjustmentAmount: 10,
        patientAmount: 7,
        serviceDate: daysAgo(30),
        status: 'paid',
        adjustments: [
          { adjustmentId: 'ADJ-002', groupCode: 'CO', reasonCode: '45', amount: 10, description: 'Contractual adjustment' }
        ]
      }
    ],
    totalCharges: 220,
    totalAllowed: 175,
    totalPaid: 140,
    totalAdjustments: 45,
    patientResponsibility: 35,
    balance: 0,
    createdDate: daysAgo(30),
    submittedDate: daysAgo(29),
    receivedDate: daysAgo(28),
    processedDate: daysAgo(15),
    paidDate: daysAgo(10),
    checkNumber: 'CHK-789456',
    notes: 'Claim paid in full',
    createdBy: 'billing_user',
    updatedAt: daysAgo(10)
  },
  {
    claimId: 'CLM-002',
    claimNumber: '2024120002',
    patientId: 'P002',
    encounterId: 'ENC-002',
    type: ClaimType.Professional,
    status: ClaimStatus.Submitted,
    insuranceId: 'INS-002',
    insuranceType: InsuranceType.Primary,
    payerId: 'AETNA-001',
    payerName: 'Aetna',
    subscriberId: 'W123456789',
    groupNumber: 'EMP-99887',
    renderingProviderId: 'PROV-002',
    renderingProviderName: 'Dr. Michael Chen',
    renderingProviderNPI: '2345678901',
    serviceDate: daysAgo(7),
    placeOfService: 'Office',
    placeOfServiceCode: '11',
    diagnosisCodes: [
      { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', pointer: 1, isPrincipal: true },
      { code: 'I10', description: 'Essential hypertension', pointer: 2 }
    ],
    principalDiagnosis: 'E11.9',
    lineItems: [
      {
        lineItemId: 'LI-002-1',
        lineNumber: 1,
        procedureCode: '99214',
        procedureDescription: 'Office visit, established patient, level 4',
        diagnosisPointers: [1, 2],
        units: 1,
        unitCharge: 175,
        totalCharge: 175,
        serviceDate: daysAgo(7),
        status: 'pending'
      },
      {
        lineItemId: 'LI-002-2',
        lineNumber: 2,
        procedureCode: '82947',
        procedureDescription: 'Glucose, blood',
        diagnosisPointers: [1],
        units: 1,
        unitCharge: 25,
        totalCharge: 25,
        serviceDate: daysAgo(7),
        status: 'pending'
      },
      {
        lineItemId: 'LI-002-3',
        lineNumber: 3,
        procedureCode: '83036',
        procedureDescription: 'Hemoglobin A1c',
        diagnosisPointers: [1],
        units: 1,
        unitCharge: 55,
        totalCharge: 55,
        serviceDate: daysAgo(7),
        status: 'pending'
      }
    ],
    totalCharges: 255,
    totalAllowed: 0,
    totalPaid: 0,
    totalAdjustments: 0,
    patientResponsibility: 0,
    balance: 255,
    createdDate: daysAgo(7),
    submittedDate: daysAgo(6),
    createdBy: 'billing_user',
    updatedAt: daysAgo(6)
  },
  {
    claimId: 'CLM-003',
    claimNumber: '2024120003',
    patientId: 'P003',
    encounterId: 'ENC-003',
    type: ClaimType.Professional,
    status: ClaimStatus.Rejected,
    insuranceId: 'INS-003',
    insuranceType: InsuranceType.Primary,
    payerId: 'MEDICARE-001',
    payerName: 'Medicare Part B',
    subscriberId: '1EG4-TE5-MK72',
    renderingProviderId: 'PROV-001',
    renderingProviderName: 'Dr. Sarah Wilson',
    renderingProviderNPI: '1234567890',
    serviceDate: daysAgo(14),
    placeOfService: 'Office',
    placeOfServiceCode: '11',
    diagnosisCodes: [
      { code: 'M54.5', description: 'Low back pain', pointer: 1, isPrincipal: true }
    ],
    principalDiagnosis: 'M54.5',
    lineItems: [
      {
        lineItemId: 'LI-003-1',
        lineNumber: 1,
        procedureCode: '99213',
        procedureDescription: 'Office visit, established patient, level 3',
        diagnosisPointers: [1],
        units: 1,
        unitCharge: 125,
        totalCharge: 125,
        serviceDate: daysAgo(14),
        status: 'denied',
        denialReason: 'Missing modifier'
      }
    ],
    totalCharges: 125,
    totalAllowed: 0,
    totalPaid: 0,
    totalAdjustments: 0,
    patientResponsibility: 0,
    balance: 125,
    createdDate: daysAgo(14),
    submittedDate: daysAgo(13),
    receivedDate: daysAgo(12),
    processedDate: daysAgo(5),
    rejectionReasons: [
      {
        rejectionCode: 'MA04',
        rejectionMessage: 'Missing/invalid modifier',
        rejectionDate: daysAgo(5)
      }
    ],
    createdBy: 'billing_user',
    updatedAt: daysAgo(5)
  },
  {
    claimId: 'CLM-004',
    claimNumber: '2024120004',
    patientId: 'P001',
    encounterId: 'ENC-004',
    type: ClaimType.Professional,
    status: ClaimStatus.PartialPaid,
    insuranceId: 'INS-001',
    insuranceType: InsuranceType.Primary,
    payerId: 'BCBS-001',
    payerName: 'Blue Cross Blue Shield',
    subscriberId: 'XYZ123456789',
    groupNumber: 'GRP-54321',
    renderingProviderId: 'PROV-002',
    renderingProviderName: 'Dr. Michael Chen',
    renderingProviderNPI: '2345678901',
    serviceDate: daysAgo(21),
    placeOfService: 'Office',
    placeOfServiceCode: '11',
    diagnosisCodes: [
      { code: 'Z00.00', description: 'Encounter for general adult medical examination', pointer: 1, isPrincipal: true }
    ],
    principalDiagnosis: 'Z00.00',
    lineItems: [
      {
        lineItemId: 'LI-004-1',
        lineNumber: 1,
        procedureCode: '99396',
        procedureDescription: 'Preventive visit, established patient, 40-64 years',
        diagnosisPointers: [1],
        units: 1,
        unitCharge: 200,
        totalCharge: 200,
        allowedAmount: 180,
        paidAmount: 180,
        adjustmentAmount: 20,
        patientAmount: 0,
        serviceDate: daysAgo(21),
        status: 'paid'
      },
      {
        lineItemId: 'LI-004-2',
        lineNumber: 2,
        procedureCode: '36415',
        procedureDescription: 'Venipuncture',
        diagnosisPointers: [1],
        units: 1,
        unitCharge: 15,
        totalCharge: 15,
        allowedAmount: 10,
        paidAmount: 8,
        adjustmentAmount: 5,
        patientAmount: 2,
        serviceDate: daysAgo(21),
        status: 'paid'
      },
      {
        lineItemId: 'LI-004-3',
        lineNumber: 3,
        procedureCode: '80053',
        procedureDescription: 'Comprehensive metabolic panel',
        diagnosisPointers: [1],
        units: 1,
        unitCharge: 35,
        totalCharge: 35,
        allowedAmount: 28,
        paidAmount: 22.40,
        adjustmentAmount: 7,
        patientAmount: 5.60,
        serviceDate: daysAgo(21),
        status: 'paid'
      }
    ],
    totalCharges: 250,
    totalAllowed: 218,
    totalPaid: 210.40,
    totalAdjustments: 32,
    patientResponsibility: 7.60,
    balance: 7.60,
    createdDate: daysAgo(21),
    submittedDate: daysAgo(20),
    processedDate: daysAgo(8),
    paidDate: daysAgo(5),
    checkNumber: 'CHK-789457',
    createdBy: 'billing_user',
    updatedAt: daysAgo(5)
  },
  {
    claimId: 'CLM-005',
    claimNumber: '2024120005',
    patientId: 'P004',
    encounterId: 'ENC-005',
    type: ClaimType.Professional,
    status: ClaimStatus.Draft,
    insuranceId: 'INS-005',
    insuranceType: InsuranceType.Primary,
    payerId: 'UHC-001',
    payerName: 'United Healthcare',
    subscriberId: 'U987654321',
    groupNumber: 'CORP-12345',
    renderingProviderId: 'PROV-001',
    renderingProviderName: 'Dr. Sarah Wilson',
    renderingProviderNPI: '1234567890',
    serviceDate: daysAgo(2),
    placeOfService: 'Office',
    placeOfServiceCode: '11',
    diagnosisCodes: [
      { code: 'R10.9', description: 'Unspecified abdominal pain', pointer: 1, isPrincipal: true }
    ],
    principalDiagnosis: 'R10.9',
    lineItems: [
      {
        lineItemId: 'LI-005-1',
        lineNumber: 1,
        procedureCode: '99215',
        procedureDescription: 'Office visit, established patient, level 5',
        diagnosisPointers: [1],
        units: 1,
        unitCharge: 250,
        totalCharge: 250,
        serviceDate: daysAgo(2),
        status: 'pending'
      }
    ],
    totalCharges: 250,
    totalAllowed: 0,
    totalPaid: 0,
    totalAdjustments: 0,
    patientResponsibility: 0,
    balance: 250,
    createdDate: daysAgo(2),
    createdBy: 'billing_user',
    updatedAt: daysAgo(2)
  }
];

// ==================== Payments ====================

export const MOCK_PAYMENTS: Payment[] = [
  {
    paymentId: 'PAY-001',
    paymentNumber: 'PMT-2024-001',
    patientId: 'P001',
    amount: 140,
    method: PaymentMethod.Insurance,
    status: PaymentStatus.Applied,
    paymentDate: daysAgo(10),
    source: 'insurance',
    payerName: 'Blue Cross Blue Shield',
    checkNumber: 'CHK-789456',
    applications: [
      {
        applicationId: 'APP-001',
        claimId: 'CLM-001',
        amount: 140,
        appliedDate: daysAgo(10),
        appliedBy: 'billing_user'
      }
    ],
    unappliedAmount: 0,
    createdAt: daysAgo(10),
    createdBy: 'system',
    postedAt: daysAgo(10),
    postedBy: 'billing_user'
  },
  {
    paymentId: 'PAY-002',
    paymentNumber: 'PMT-2024-002',
    patientId: 'P001',
    amount: 35,
    method: PaymentMethod.CreditCard,
    status: PaymentStatus.Applied,
    paymentDate: daysAgo(8),
    source: 'patient',
    cardType: 'Visa',
    cardLastFour: '4242',
    authorizationCode: 'AUTH123456',
    transactionId: 'TXN-789012',
    applications: [
      {
        applicationId: 'APP-002',
        claimId: 'CLM-001',
        amount: 35,
        appliedDate: daysAgo(8),
        appliedBy: 'front_desk'
      }
    ],
    unappliedAmount: 0,
    createdAt: daysAgo(8),
    createdBy: 'front_desk',
    postedAt: daysAgo(8),
    postedBy: 'front_desk'
  },
  {
    paymentId: 'PAY-003',
    paymentNumber: 'PMT-2024-003',
    patientId: 'P001',
    amount: 210.40,
    method: PaymentMethod.Insurance,
    status: PaymentStatus.Applied,
    paymentDate: daysAgo(5),
    source: 'insurance',
    payerName: 'Blue Cross Blue Shield',
    checkNumber: 'CHK-789457',
    applications: [
      {
        applicationId: 'APP-003',
        claimId: 'CLM-004',
        amount: 210.40,
        appliedDate: daysAgo(5),
        appliedBy: 'billing_user'
      }
    ],
    unappliedAmount: 0,
    createdAt: daysAgo(5),
    createdBy: 'system',
    postedAt: daysAgo(5),
    postedBy: 'billing_user'
  },
  {
    paymentId: 'PAY-004',
    paymentNumber: 'PMT-2024-004',
    patientId: 'P002',
    amount: 25,
    method: PaymentMethod.Cash,
    status: PaymentStatus.Posted,
    paymentDate: daysAgo(7),
    source: 'patient',
    applications: [],
    unappliedAmount: 25,
    notes: 'Copay collected at time of visit',
    createdAt: daysAgo(7),
    createdBy: 'front_desk',
    postedAt: daysAgo(7),
    postedBy: 'front_desk'
  },
  {
    paymentId: 'PAY-005',
    paymentNumber: 'PMT-2024-005',
    patientId: 'P003',
    amount: 100,
    method: PaymentMethod.Check,
    status: PaymentStatus.Pending,
    paymentDate: daysAgo(1),
    source: 'patient',
    checkNumber: '1234',
    applications: [],
    unappliedAmount: 100,
    notes: 'Check received, pending deposit',
    createdAt: daysAgo(1),
    createdBy: 'front_desk'
  }
];

// ==================== Adjustments ====================

export const MOCK_ADJUSTMENTS: Adjustment[] = [
  {
    adjustmentId: 'ADJ-001',
    patientId: 'P001',
    claimId: 'CLM-001',
    lineItemId: 'LI-001-1',
    amount: 35,
    reason: AdjustmentReason.Contractual,
    description: 'BCBS contractual write-off',
    adjustmentDate: daysAgo(10),
    createdBy: 'billing_user',
    approvedBy: 'billing_manager',
    approvedDate: daysAgo(10)
  },
  {
    adjustmentId: 'ADJ-002',
    patientId: 'P001',
    claimId: 'CLM-001',
    lineItemId: 'LI-001-2',
    amount: 10,
    reason: AdjustmentReason.Contractual,
    description: 'BCBS contractual write-off',
    adjustmentDate: daysAgo(10),
    createdBy: 'billing_user',
    approvedBy: 'billing_manager',
    approvedDate: daysAgo(10)
  },
  {
    adjustmentId: 'ADJ-003',
    patientId: 'P001',
    claimId: 'CLM-004',
    amount: 32,
    reason: AdjustmentReason.Contractual,
    description: 'BCBS contractual adjustment',
    adjustmentDate: daysAgo(5),
    createdBy: 'billing_user',
    approvedBy: 'billing_manager',
    approvedDate: daysAgo(5)
  }
];

// ==================== Patient Statements ====================

export const MOCK_STATEMENTS: PatientStatement[] = [
  {
    statementId: 'STMT-001',
    patientId: 'P001',
    statementNumber: 'STM-2024-001',
    status: StatementStatus.Sent,
    statementDate: daysAgo(3),
    dueDate: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000), // 27 days from now
    previousBalance: 0,
    newCharges: 7.60,
    payments: 0,
    adjustments: 0,
    currentBalance: 7.60,
    current: 7.60,
    over30: 0,
    over60: 0,
    over90: 0,
    over120: 0,
    lineItems: [
      {
        date: daysAgo(21),
        description: 'Preventive visit - patient responsibility',
        charges: 7.60,
        payments: 0,
        adjustments: 0,
        balance: 7.60,
        claimId: 'CLM-004'
      }
    ],
    deliveryMethod: 'both',
    sentDate: daysAgo(3),
    message: 'Thank you for choosing Springfield Medical Clinic. Please remit payment by the due date.',
    createdAt: daysAgo(3),
    createdBy: 'system'
  },
  {
    statementId: 'STMT-002',
    patientId: 'P003',
    statementNumber: 'STM-2024-002',
    status: StatementStatus.Overdue,
    statementDate: daysAgo(45),
    dueDate: daysAgo(15),
    previousBalance: 125,
    newCharges: 0,
    payments: 0,
    adjustments: 0,
    currentBalance: 125,
    current: 0,
    over30: 125,
    over60: 0,
    over90: 0,
    over120: 0,
    lineItems: [
      {
        date: daysAgo(60),
        description: 'Office visit - claim rejected, patient responsibility',
        charges: 125,
        payments: 0,
        adjustments: 0,
        balance: 125,
        claimId: 'CLM-003'
      }
    ],
    deliveryMethod: 'mail',
    sentDate: daysAgo(45),
    message: 'SECOND NOTICE: Your account is past due. Please contact our billing department.',
    createdAt: daysAgo(45),
    createdBy: 'system'
  }
];

// ==================== Fee Schedule ====================

export const MOCK_FEE_SCHEDULES: FeeSchedule[] = [
  {
    scheduleId: 'FS-001',
    name: 'Standard Fee Schedule',
    description: 'Default fee schedule for all services',
    effectiveDate: new Date('2024-01-01'),
    type: 'standard',
    fees: [
      { procedureCode: '99213', procedureDescription: 'Office visit, established patient, level 3', fee: 125, effectiveDate: new Date('2024-01-01') },
      { procedureCode: '99214', procedureDescription: 'Office visit, established patient, level 4', fee: 175, effectiveDate: new Date('2024-01-01') },
      { procedureCode: '99215', procedureDescription: 'Office visit, established patient, level 5', fee: 250, effectiveDate: new Date('2024-01-01') },
      { procedureCode: '99203', procedureDescription: 'Office visit, new patient, level 3', fee: 150, effectiveDate: new Date('2024-01-01') },
      { procedureCode: '99204', procedureDescription: 'Office visit, new patient, level 4', fee: 225, effectiveDate: new Date('2024-01-01') },
      { procedureCode: '99205', procedureDescription: 'Office visit, new patient, level 5', fee: 325, effectiveDate: new Date('2024-01-01') },
      { procedureCode: '99396', procedureDescription: 'Preventive visit, established patient, 40-64 years', fee: 200, effectiveDate: new Date('2024-01-01') },
      { procedureCode: '36415', procedureDescription: 'Venipuncture', fee: 15, effectiveDate: new Date('2024-01-01') },
      { procedureCode: '80053', procedureDescription: 'Comprehensive metabolic panel', fee: 35, effectiveDate: new Date('2024-01-01') },
      { procedureCode: '87880', procedureDescription: 'Strep test, rapid', fee: 45, effectiveDate: new Date('2024-01-01') }
    ],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    scheduleId: 'FS-002',
    name: 'Medicare Fee Schedule',
    description: 'Medicare allowable amounts',
    effectiveDate: new Date('2024-01-01'),
    type: 'medicare',
    payerId: 'MEDICARE-001',
    fees: [
      { procedureCode: '99213', procedureDescription: 'Office visit, established patient, level 3', fee: 92.76, allowedAmount: 92.76, effectiveDate: new Date('2024-01-01') },
      { procedureCode: '99214', procedureDescription: 'Office visit, established patient, level 4', fee: 130.52, allowedAmount: 130.52, effectiveDate: new Date('2024-01-01') },
      { procedureCode: '99215', procedureDescription: 'Office visit, established patient, level 5', fee: 176.66, allowedAmount: 176.66, effectiveDate: new Date('2024-01-01') }
    ],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];
