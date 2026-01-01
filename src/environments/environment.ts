export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1',
  wsUrl: 'ws://localhost:8080/ws',
  natsUrl: 'nats://localhost:4222',
  
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
  
  // Session configuration
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
