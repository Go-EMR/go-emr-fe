// User Types
export type UserStatus = 'active' | 'inactive' | 'pending' | 'locked' | 'suspended';
export type UserType = 'provider' | 'staff' | 'admin' | 'patient' | 'external';

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  type: UserType;
  status: UserStatus;
  roles: string[];
  department?: string;
  location?: string;
  title?: string;
  phone?: string;
  avatar?: string;
  npi?: string;
  specialty?: string;
  licenseNumber?: string;
  licenseState?: string;
  deaNumber?: string;
  credentials?: string[];
  supervisorId?: string;
  supervisorName?: string;
  lastLogin?: Date;
  passwordChangedAt?: Date;
  mfaEnabled: boolean;
  mfaMethod?: 'totp' | 'sms' | 'email';
  loginAttempts: number;
  lockedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface UserProfile extends User {
  preferences: UserPreferences;
  sessions: UserSession[];
  auditSummary: {
    totalLogins: number;
    lastActivity: Date;
    recentActions: number;
  };
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  defaultLanding: string;
  notifications: {
    email: boolean;
    inApp: boolean;
    sms: boolean;
  };
  dashboardWidgets: string[];
}

export interface UserSession {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  device?: string;
  browser?: string;
  startedAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  isCurrent: boolean;
}

// Role and Permission Types
export interface Role {
  id: string;
  name: string;
  description: string;
  type: 'system' | 'custom';
  permissions: Permission[];
  userCount: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  description: string;
  module: string;
  category: PermissionCategory;
  actions: PermissionAction[];
}

export type PermissionCategory = 
  | 'patients'
  | 'appointments'
  | 'encounters'
  | 'billing'
  | 'reports'
  | 'messaging'
  | 'admin'
  | 'system';

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'export' | 'print' | 'sign' | 'approve';

export interface PermissionGrant {
  permissionId: string;
  actions: PermissionAction[];
  conditions?: PermissionCondition[];
}

export interface PermissionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'contains';
  value: any;
}

// System Settings
export interface SystemSettings {
  general: GeneralSettings;
  security: SecuritySettings;
  email: EmailSettings;
  scheduling: SchedulingSettings;
  billing: BillingSettings;
  clinical: ClinicalSettings;
  integrations: IntegrationSettings;
}

export interface GeneralSettings {
  practiceName: string;
  practiceAddress: string;
  practicePhone: string;
  practiceFax: string;
  practiceEmail: string;
  practiceWebsite: string;
  practiceNpi: string;
  practiceTaxId: string;
  logo?: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  defaultLanguage: string;
}

export interface SecuritySettings {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    expirationDays: number;
    historyCount: number;
  };
  sessionPolicy: {
    maxIdleMinutes: number;
    maxSessionHours: number;
    singleSessionOnly: boolean;
    requireMfa: boolean;
  };
  loginPolicy: {
    maxAttempts: number;
    lockoutMinutes: number;
    allowRememberMe: boolean;
    ipWhitelist: string[];
  };
  auditPolicy: {
    enabled: boolean;
    retentionDays: number;
    logLevel: 'minimal' | 'standard' | 'detailed';
  };
}

export interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  smtpEncryption: 'none' | 'ssl' | 'tls';
  fromAddress: string;
  fromName: string;
  replyToAddress: string;
  templatesPath: string;
}

export interface SchedulingSettings {
  defaultSlotDuration: number;
  minAdvanceBookingHours: number;
  maxAdvanceBookingDays: number;
  allowDoubleBooking: boolean;
  allowWaitlist: boolean;
  reminderLeadTimeDays: number;
  confirmationRequired: boolean;
  cancellationPolicyHours: number;
  workingHours: {
    [key: string]: { start: string; end: string; enabled: boolean };
  };
  holidays: string[];
}

export interface BillingSettings {
  defaultFeeSchedule: string;
  claimSubmissionMethod: 'electronic' | 'paper' | 'both';
  clearinghouseId: string;
  autoPostPayments: boolean;
  statementFrequency: 'weekly' | 'monthly';
  collectionThresholdDays: number;
  collectionThresholdAmount: number;
  paymentMethods: string[];
  taxRate: number;
}

export interface ClinicalSettings {
  defaultChartTemplate: string;
  requireSignature: boolean;
  autoSaveInterval: number;
  prescriptionDefaults: {
    defaultPharmacy: string;
    defaultQuantity: number;
    defaultRefills: number;
    requireEpcs: boolean;
  };
  labDefaults: {
    defaultLab: string;
    autoNotifyResults: boolean;
  };
  vitalsSigns: {
    units: 'metric' | 'imperial';
    alertThresholds: { [key: string]: { low: number; high: number } };
  };
}

export interface IntegrationSettings {
  hl7: {
    enabled: boolean;
    version: string;
    receivingFacility: string;
    sendingFacility: string;
  };
  fhir: {
    enabled: boolean;
    serverUrl: string;
    version: string;
  };
  immunizationRegistry: {
    enabled: boolean;
    registryUrl: string;
    submissionFrequency: string;
  };
  prescriptionNetwork: {
    enabled: boolean;
    networkId: string;
  };
  labInterfaces: {
    id: string;
    name: string;
    enabled: boolean;
    endpoint: string;
  }[];
}

// Audit Log Types
export type AuditAction = 
  | 'login'
  | 'logout'
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'export'
  | 'print'
  | 'sign'
  | 'send'
  | 'receive'
  | 'approve'
  | 'reject'
  | 'error'
  | 'security';

export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userType: UserType;
  action: AuditAction;
  severity: AuditSeverity;
  module: string;
  resource: string;
  resourceId?: string;
  resourceName?: string;
  description: string;
  details?: Record<string, any>;
  changes?: AuditChange[];
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  success: boolean;
  errorMessage?: string;
}

export interface AuditChange {
  field: string;
  fieldLabel: string;
  oldValue: any;
  newValue: any;
}

export interface AuditFilter {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  action?: AuditAction[];
  severity?: AuditSeverity[];
  module?: string[];
  resource?: string;
  resourceId?: string;
  success?: boolean;
  search?: string;
}

export interface AuditSummary {
  totalEvents: number;
  byAction: { action: AuditAction; count: number }[];
  bySeverity: { severity: AuditSeverity; count: number }[];
  byModule: { module: string; count: number }[];
  byUser: { userId: string; userName: string; count: number }[];
  failedEvents: number;
  securityEvents: number;
  recentActivity: AuditLog[];
}

// System Health
export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  lastChecked: Date;
  services: ServiceHealth[];
  metrics: SystemMetrics;
}

export interface ServiceHealth {
  name: string;
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  lastError?: string;
  lastChecked: Date;
}

export interface SystemMetrics {
  cpu: { usage: number; cores: number };
  memory: { used: number; total: number; percentage: number };
  disk: { used: number; total: number; percentage: number };
  database: { connections: number; maxConnections: number; queryTime: number };
  requests: { total: number; perSecond: number; avgResponseTime: number };
  errors: { total: number; rate: number };
  activeUsers: number;
  activeSessions: number;
}

// Backup and Maintenance
export interface BackupConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  retentionDays: number;
  includeLargeFiles: boolean;
  encryptBackups: boolean;
  destination: 'local' | 's3' | 'azure' | 'gcs';
  destinationPath: string;
  lastBackup?: Date;
  lastBackupStatus?: 'success' | 'failed';
  lastBackupSize?: number;
}

export interface MaintenanceWindow {
  id: string;
  title: string;
  description: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  affectedServices: string[];
  notificationsSent: boolean;
  createdBy: string;
  createdAt: Date;
}

// License and Compliance
export interface LicenseInfo {
  licenseKey: string;
  licensee: string;
  type: 'trial' | 'standard' | 'professional' | 'enterprise';
  status: 'active' | 'expired' | 'suspended';
  issuedAt: Date;
  expiresAt: Date;
  maxUsers: number;
  currentUsers: number;
  features: string[];
  supportLevel: 'basic' | 'standard' | 'premium';
}

export interface ComplianceStatus {
  hipaa: {
    compliant: boolean;
    lastAudit: Date;
    findings: ComplianceFinding[];
  };
  meaningful_use: {
    stage: number;
    attestationDate?: Date;
    measures: { id: string; name: string; met: boolean }[];
  };
  security: {
    lastPenetrationTest?: Date;
    lastVulnerabilityScan?: Date;
    openVulnerabilities: number;
  };
}

export interface ComplianceFinding {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  recommendation: string;
  status: 'open' | 'in-progress' | 'resolved';
  dueDate?: Date;
  resolvedDate?: Date;
}
