export const environment = {
  production: true,
  apiUrl: '/api/v1',
  wsUrl: '/ws',
  natsUrl: '',
  
  // Feature flags
  features: {
    telehealth: true,
    ePrescribing: true,
    labIntegration: true,
    patientPortal: true,
    messaging: true,
    billing: true,
    reporting: true,
  },
  
  // Session configuration (HIPAA compliant)
  session: {
    timeoutMinutes: 15,
    warningMinutes: 2,
    maxIdleMinutes: 30,
  },
  
  // Audit configuration
  audit: {
    enabled: true,
    batchSize: 10,
    flushIntervalMs: 5000,
  },
  
  // Encryption
  encryption: {
    enabled: true,
    algorithm: 'AES-GCM',
  },
};
