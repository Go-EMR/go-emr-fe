import {
  ImagingOrder,
  ImagingProcedure,
  ImagingFacility,
  ImagingReport,
  ImagingStudy,
  ImagingModality,
  BodyRegion
} from '../../models/imaging.model';

// ============ Mock Procedures ============

export const MOCK_IMAGING_PROCEDURES: ImagingProcedure[] = [
  // X-Ray procedures
  {
    procedureCode: 'XR-CHEST-2V',
    procedureName: 'Chest X-Ray, 2 Views',
    name: 'Chest X-Ray, 2 Views',
    modality: 'xray',
    bodyRegion: 'chest',
    cptCode: '71046',
    description: 'PA and lateral chest radiograph',
    contrastOptions: ['none'],
    defaultContrast: 'none',
    requiresPrep: false,
    prepRequired: false,
    estimatedDuration: 15,
    technicalFee: 85,
    professionalFee: 35,
    isCommon: true
  },
  {
    procedureCode: 'XR-KNEE-3V',
    procedureName: 'Knee X-Ray, 3 Views',
    name: 'Knee X-Ray, 3 Views',
    modality: 'xray',
    bodyRegion: 'lower-extremity',
    cptCode: '73562',
    description: 'AP, lateral, and oblique knee radiographs',
    contrastOptions: ['none'],
    defaultContrast: 'none',
    requiresPrep: false,
    prepRequired: false,
    estimatedDuration: 15,
    technicalFee: 75,
    professionalFee: 30,
    isCommon: true
  },
  {
    procedureCode: 'XR-SPINE-L-4V',
    procedureName: 'Lumbar Spine X-Ray, 4 Views',
    name: 'Lumbar Spine X-Ray, 4 Views',
    modality: 'xray',
    bodyRegion: 'spine',
    cptCode: '72110',
    description: 'AP, lateral, and oblique lumbar spine radiographs',
    contrastOptions: ['none'],
    defaultContrast: 'none',
    requiresPrep: false,
    prepRequired: false,
    estimatedDuration: 20,
    technicalFee: 95,
    professionalFee: 40,
    isCommon: true
  },

  // CT procedures
  {
    procedureCode: 'CT-HEAD-WO',
    procedureName: 'CT Head without Contrast',
    name: 'CT Head without Contrast',
    modality: 'ct',
    bodyRegion: 'head',
    cptCode: '70450',
    description: 'Non-contrast CT of the brain',
    contrastOptions: ['none'],
    defaultContrast: 'none',
    requiresPrep: false,
    prepRequired: false,
    estimatedDuration: 15,
    technicalFee: 350,
    professionalFee: 95,
    isCommon: true
  },
  {
    procedureCode: 'CT-HEAD-W',
    procedureName: 'CT Head with Contrast',
    name: 'CT Head with Contrast',
    modality: 'ct',
    bodyRegion: 'head',
    cptCode: '70460',
    description: 'CT of the brain with IV contrast',
    contrastOptions: ['iv'],
    defaultContrast: 'iv',
    requiresPrep: false,
    prepRequired: false,
    estimatedDuration: 30,
    technicalFee: 450,
    professionalFee: 115,
    isCommon: true
  },
  {
    procedureCode: 'CT-CHEST-W',
    procedureName: 'CT Chest with Contrast',
    name: 'CT Chest with Contrast',
    modality: 'ct',
    bodyRegion: 'chest',
    cptCode: '71260',
    description: 'CT of the chest with IV contrast',
    contrastOptions: ['none', 'iv'],
    defaultContrast: 'iv',
    requiresPrep: false,
    prepRequired: false,
    estimatedDuration: 20,
    technicalFee: 400,
    professionalFee: 105,
    isCommon: true
  },
  {
    procedureCode: 'CT-ABD-PEL-W',
    procedureName: 'CT Abdomen/Pelvis with Contrast',
    name: 'CT Abdomen/Pelvis with Contrast',
    modality: 'ct',
    bodyRegion: 'abdomen',
    cptCode: '74177',
    description: 'CT of abdomen and pelvis with IV contrast',
    contrastOptions: ['oral', 'iv', 'oral-iv'],
    defaultContrast: 'oral-iv',
    requiresPrep: true,
    prepRequired: true,
    prepInstructions: 'NPO 4 hours. Drink oral contrast 1-2 hours before exam.',
    estimatedDuration: 30,
    technicalFee: 550,
    professionalFee: 135,
    isCommon: true
  },
  {
    procedureCode: 'CTA-CHEST-PE',
    procedureName: 'CT Angiography Chest (PE Protocol)',
    name: 'CT Angiography Chest (PE Protocol)',
    modality: 'ct',
    bodyRegion: 'chest',
    cptCode: '71275',
    description: 'CT angiography of chest for pulmonary embolism',
    contrastOptions: ['iv'],
    defaultContrast: 'iv',
    requiresPrep: false,
    prepRequired: false,
    estimatedDuration: 20,
    technicalFee: 600,
    professionalFee: 150,
    isCommon: true
  },

  // MRI procedures
  {
    procedureCode: 'MRI-BRAIN-WO',
    procedureName: 'MRI Brain without Contrast',
    name: 'MRI Brain without Contrast',
    modality: 'mri',
    bodyRegion: 'head',
    cptCode: '70551',
    description: 'MRI of the brain without contrast',
    contrastOptions: ['none'],
    defaultContrast: 'none',
    requiresPrep: false,
    prepRequired: false,
    estimatedDuration: 45,
    technicalFee: 800,
    professionalFee: 180,
    isCommon: true
  },
  {
    procedureCode: 'MRI-BRAIN-WWO',
    procedureName: 'MRI Brain with and without Contrast',
    name: 'MRI Brain with and without Contrast',
    modality: 'mri',
    bodyRegion: 'head',
    cptCode: '70553',
    description: 'MRI of the brain with and without contrast',
    contrastOptions: ['iv'],
    defaultContrast: 'iv',
    requiresPrep: false,
    prepRequired: false,
    estimatedDuration: 60,
    technicalFee: 1000,
    professionalFee: 220,
    isCommon: true
  },
  {
    procedureCode: 'MRI-SPINE-L-WO',
    procedureName: 'MRI Lumbar Spine without Contrast',
    name: 'MRI Lumbar Spine without Contrast',
    modality: 'mri',
    bodyRegion: 'spine',
    cptCode: '72148',
    description: 'MRI of lumbar spine without contrast',
    contrastOptions: ['none'],
    defaultContrast: 'none',
    requiresPrep: false,
    prepRequired: false,
    estimatedDuration: 45,
    technicalFee: 750,
    professionalFee: 170,
    isCommon: true
  },
  {
    procedureCode: 'MRI-KNEE-WO',
    procedureName: 'MRI Knee without Contrast',
    name: 'MRI Knee without Contrast',
    modality: 'mri',
    bodyRegion: 'lower-extremity',
    cptCode: '73721',
    description: 'MRI of the knee without contrast',
    contrastOptions: ['none'],
    defaultContrast: 'none',
    requiresPrep: false,
    prepRequired: false,
    estimatedDuration: 45,
    technicalFee: 700,
    professionalFee: 160,
    isCommon: true
  },

  // Ultrasound procedures
  {
    procedureCode: 'US-ABD-COMP',
    procedureName: 'Ultrasound Abdomen Complete',
    name: 'Ultrasound Abdomen Complete',
    modality: 'ultrasound',
    bodyRegion: 'abdomen',
    cptCode: '76700',
    description: 'Complete abdominal ultrasound',
    contrastOptions: ['none'],
    defaultContrast: 'none',
    requiresPrep: true,
    prepRequired: true,
    prepInstructions: 'NPO 8 hours before exam',
    estimatedDuration: 30,
    technicalFee: 250,
    professionalFee: 75,
    isCommon: true
  },
  {
    procedureCode: 'US-THYROID',
    procedureName: 'Ultrasound Thyroid',
    name: 'Ultrasound Thyroid',
    modality: 'ultrasound',
    bodyRegion: 'neck',
    cptCode: '76536',
    description: 'Thyroid ultrasound with soft tissue of neck',
    contrastOptions: ['none'],
    defaultContrast: 'none',
    requiresPrep: false,
    prepRequired: false,
    estimatedDuration: 20,
    technicalFee: 180,
    professionalFee: 55,
    isCommon: true
  },

  // Mammography procedures
  {
    procedureCode: 'MAMMO-SCREEN-BILAT',
    procedureName: 'Screening Mammography, Bilateral',
    name: 'Screening Mammography, Bilateral',
    modality: 'mammography',
    bodyRegion: 'chest',
    cptCode: '77067',
    description: 'Bilateral screening mammography',
    contrastOptions: ['none'],
    defaultContrast: 'none',
    requiresPrep: false,
    prepRequired: false,
    estimatedDuration: 20,
    technicalFee: 150,
    professionalFee: 50,
    isCommon: true
  },
  {
    procedureCode: 'MAMMO-DIAG-BILAT',
    procedureName: 'Diagnostic Mammography, Bilateral',
    name: 'Diagnostic Mammography, Bilateral',
    modality: 'mammography',
    bodyRegion: 'chest',
    cptCode: '77066',
    description: 'Bilateral diagnostic mammography',
    contrastOptions: ['none'],
    defaultContrast: 'none',
    requiresPrep: false,
    prepRequired: false,
    estimatedDuration: 30,
    technicalFee: 200,
    professionalFee: 65,
    isCommon: true
  }
];

// ============ Mock Facilities ============

export const MOCK_IMAGING_FACILITIES: ImagingFacility[] = [
  {
    facilityId: 'FAC-001',
    id: 'FAC-001',
    name: 'Springfield Medical Center - Radiology',
    facilityType: 'hospital',
    address: '123 Medical Center Dr, Springfield, IL 62701',
    phone: '(217) 555-0100',
    fax: '(217) 555-0101',
    modalities: ['xray', 'ct', 'mri', 'ultrasound', 'mammography', 'fluoroscopy', 'nuclear'],
    is24Hour: true,
    acceptsWalkIns: true,
    pacsIntegrated: true,
    hasPacsIntegration: true,
    supportsEOrders: true,
    isPreferred: true
  },
  {
    facilityId: 'FAC-002',
    id: 'FAC-002',
    name: 'Advanced Imaging Center',
    facilityType: 'imaging-center',
    address: '456 Diagnostic Blvd, Suite 200, Springfield, IL 62702',
    phone: '(217) 555-0200',
    fax: '(217) 555-0201',
    modalities: ['ct', 'mri', 'ultrasound', 'mammography', 'dexa'],
    is24Hour: false,
    acceptsWalkIns: false,
    pacsIntegrated: true,
    hasPacsIntegration: true,
    supportsEOrders: true,
    isPreferred: false
  },
  {
    facilityId: 'FAC-003',
    id: 'FAC-003',
    name: 'Community Urgent Care - X-Ray',
    facilityType: 'clinic',
    address: '789 Wellness Way, Springfield, IL 62703',
    phone: '(217) 555-0300',
    fax: '(217) 555-0301',
    modalities: ['xray', 'ultrasound'],
    is24Hour: false,
    acceptsWalkIns: true,
    pacsIntegrated: false,
    hasPacsIntegration: false,
    supportsEOrders: false,
    isPreferred: false
  },
  {
    facilityId: 'FAC-004',
    id: 'FAC-004',
    name: 'Regional PET/CT Center',
    facilityType: 'imaging-center',
    address: '321 Oncology Center, Springfield, IL 62704',
    phone: '(217) 555-0400',
    fax: '(217) 555-0401',
    modalities: ['pet', 'ct', 'nuclear'],
    is24Hour: false,
    acceptsWalkIns: false,
    pacsIntegrated: true,
    hasPacsIntegration: true,
    supportsEOrders: true,
    isPreferred: false
  }
];

// ============ Helper Functions ============

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function hoursAgo(hours: number): string {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date.toISOString();
}

// ============ Mock Orders ============

export const MOCK_IMAGING_ORDERS: ImagingOrder[] = [];

// Export counts for dashboard
export const IMAGING_STATS = {
  total: 0,
  pending: 0,
  scheduled: 0,
  inProgress: 0,
  preliminary: 0,
  final: 0,
  critical: 0
};
