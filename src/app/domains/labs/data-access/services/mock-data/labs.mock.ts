import { LabOrder, LabTest, LabPanel, LabFacility, LabResult } from '../../models/lab.model';

// Mock Lab Tests
export const MOCK_LAB_TESTS: LabTest[] = [
  // Chemistry
  { id: 'test-001', testCode: 'GLU', code: 'GLU', testName: 'Glucose', name: 'Glucose', loincCode: '2345-7', cptCode: '82947', category: 'chemistry', specimenType: 'blood', fastingRequired: true, fastingHours: 8, turnaroundTime: '24 hours', price: 15 },
  { id: 'test-002', testCode: 'BUN', code: 'BUN', testName: 'Blood Urea Nitrogen', name: 'Blood Urea Nitrogen', loincCode: '3094-0', cptCode: '84520', category: 'chemistry', specimenType: 'blood', fastingRequired: false, turnaroundTime: '24 hours', price: 12 },
  { id: 'test-003', testCode: 'CREAT', code: 'CREAT', testName: 'Creatinine', name: 'Creatinine', loincCode: '2160-0', cptCode: '82565', category: 'chemistry', specimenType: 'blood', fastingRequired: false, turnaroundTime: '24 hours', price: 12 },
  { id: 'test-004', testCode: 'NA', code: 'NA', testName: 'Sodium', name: 'Sodium', loincCode: '2951-2', cptCode: '84295', category: 'chemistry', specimenType: 'blood', fastingRequired: false, turnaroundTime: '24 hours', price: 10 },
  { id: 'test-005', testCode: 'K', code: 'K', testName: 'Potassium', name: 'Potassium', loincCode: '2823-3', cptCode: '84132', category: 'chemistry', specimenType: 'blood', fastingRequired: false, turnaroundTime: '24 hours', price: 10 },
  { id: 'test-006', testCode: 'CL', code: 'CL', testName: 'Chloride', name: 'Chloride', loincCode: '2075-0', cptCode: '82435', category: 'chemistry', specimenType: 'blood', fastingRequired: false, turnaroundTime: '24 hours', price: 10 },
  { id: 'test-007', testCode: 'CO2', code: 'CO2', testName: 'Carbon Dioxide', name: 'Carbon Dioxide', loincCode: '2028-9', cptCode: '82374', category: 'chemistry', specimenType: 'blood', fastingRequired: false, turnaroundTime: '24 hours', price: 10 },
  { id: 'test-008', testCode: 'CA', code: 'CA', testName: 'Calcium', name: 'Calcium', loincCode: '17861-6', cptCode: '82310', category: 'chemistry', specimenType: 'blood', fastingRequired: false, turnaroundTime: '24 hours', price: 12 },
  
  // Hematology
  { id: 'test-010', testCode: 'WBC', code: 'WBC', testName: 'White Blood Cell Count', name: 'White Blood Cell Count', loincCode: '6690-2', cptCode: '85048', category: 'hematology', specimenType: 'blood', fastingRequired: false, turnaroundTime: '24 hours', price: 8 },
  { id: 'test-011', testCode: 'RBC', code: 'RBC', testName: 'Red Blood Cell Count', name: 'Red Blood Cell Count', loincCode: '789-8', cptCode: '85041', category: 'hematology', specimenType: 'blood', fastingRequired: false, turnaroundTime: '24 hours', price: 8 },
  { id: 'test-012', testCode: 'HGB', code: 'HGB', testName: 'Hemoglobin', name: 'Hemoglobin', loincCode: '718-7', cptCode: '85018', category: 'hematology', specimenType: 'blood', fastingRequired: false, turnaroundTime: '24 hours', price: 8 },
  { id: 'test-013', testCode: 'HCT', code: 'HCT', testName: 'Hematocrit', name: 'Hematocrit', loincCode: '4544-3', cptCode: '85014', category: 'hematology', specimenType: 'blood', fastingRequired: false, turnaroundTime: '24 hours', price: 8 },
  { id: 'test-014', testCode: 'PLT', code: 'PLT', testName: 'Platelet Count', name: 'Platelet Count', loincCode: '777-3', cptCode: '85049', category: 'hematology', specimenType: 'blood', fastingRequired: false, turnaroundTime: '24 hours', price: 8 },

  // Lipids
  { id: 'test-020', testCode: 'CHOL', code: 'CHOL', testName: 'Total Cholesterol', name: 'Total Cholesterol', loincCode: '2093-3', cptCode: '82465', category: 'lipid', specimenType: 'blood', fastingRequired: true, fastingHours: 12, turnaroundTime: '24 hours', price: 15 },
  { id: 'test-021', testCode: 'TRIG', code: 'TRIG', testName: 'Triglycerides', name: 'Triglycerides', loincCode: '2571-8', cptCode: '84478', category: 'lipid', specimenType: 'blood', fastingRequired: true, fastingHours: 12, turnaroundTime: '24 hours', price: 15 },
  { id: 'test-022', testCode: 'HDL', code: 'HDL', testName: 'HDL Cholesterol', name: 'HDL Cholesterol', loincCode: '2085-9', cptCode: '83718', category: 'lipid', specimenType: 'blood', fastingRequired: true, fastingHours: 12, turnaroundTime: '24 hours', price: 18 },
  { id: 'test-023', testCode: 'LDL', code: 'LDL', testName: 'LDL Cholesterol', name: 'LDL Cholesterol', loincCode: '13457-7', cptCode: '83721', category: 'lipid', specimenType: 'blood', fastingRequired: true, fastingHours: 12, turnaroundTime: '24 hours', price: 18 },

  // Thyroid
  { id: 'test-030', testCode: 'TSH', code: 'TSH', testName: 'Thyroid Stimulating Hormone', name: 'Thyroid Stimulating Hormone', loincCode: '3016-3', cptCode: '84443', category: 'thyroid', specimenType: 'blood', fastingRequired: false, turnaroundTime: '24 hours', price: 35 },
  { id: 'test-031', testCode: 'FT4', code: 'FT4', testName: 'Free T4', name: 'Free T4', loincCode: '3024-7', cptCode: '84439', category: 'thyroid', specimenType: 'blood', fastingRequired: false, turnaroundTime: '24 hours', price: 35 },
  { id: 'test-032', testCode: 'FT3', code: 'FT3', testName: 'Free T3', name: 'Free T3', loincCode: '3051-0', cptCode: '84481', category: 'thyroid', specimenType: 'blood', fastingRequired: false, turnaroundTime: '48 hours', price: 40 },

  // Liver
  { id: 'test-040', testCode: 'ALT', code: 'ALT', testName: 'Alanine Aminotransferase', name: 'Alanine Aminotransferase', loincCode: '1742-6', cptCode: '84460', category: 'liver', specimenType: 'blood', fastingRequired: false, turnaroundTime: '24 hours', price: 12 },
  { id: 'test-041', testCode: 'AST', code: 'AST', testName: 'Aspartate Aminotransferase', name: 'Aspartate Aminotransferase', loincCode: '1920-8', cptCode: '84450', category: 'liver', specimenType: 'blood', fastingRequired: false, turnaroundTime: '24 hours', price: 12 },
  { id: 'test-042', testCode: 'ALP', code: 'ALP', testName: 'Alkaline Phosphatase', name: 'Alkaline Phosphatase', loincCode: '6768-6', cptCode: '84075', category: 'liver', specimenType: 'blood', fastingRequired: false, turnaroundTime: '24 hours', price: 12 },
  { id: 'test-043', testCode: 'TBIL', code: 'TBIL', testName: 'Total Bilirubin', name: 'Total Bilirubin', loincCode: '1975-2', cptCode: '82247', category: 'liver', specimenType: 'blood', fastingRequired: false, turnaroundTime: '24 hours', price: 12 },
  { id: 'test-044', testCode: 'ALB', code: 'ALB', testName: 'Albumin', name: 'Albumin', loincCode: '1751-7', cptCode: '82040', category: 'liver', specimenType: 'blood', fastingRequired: false, turnaroundTime: '24 hours', price: 10 },

  // Diabetes
  { id: 'test-050', testCode: 'HBA1C', code: 'HBA1C', testName: 'Hemoglobin A1c', name: 'Hemoglobin A1c', loincCode: '4548-4', cptCode: '83036', category: 'chemistry', specimenType: 'blood', fastingRequired: false, turnaroundTime: '24 hours', price: 25 },

  // Cardiac
  { id: 'test-060', testCode: 'TROP', code: 'TROP', testName: 'Troponin I', name: 'Troponin I', loincCode: '10839-9', cptCode: '84484', category: 'cardiac', specimenType: 'blood', fastingRequired: false, turnaroundTime: '1 hour', price: 45 },
  { id: 'test-061', testCode: 'BNP', code: 'BNP', testName: 'B-Natriuretic Peptide', name: 'B-Natriuretic Peptide', loincCode: '30934-4', cptCode: '83880', category: 'cardiac', specimenType: 'blood', fastingRequired: false, turnaroundTime: '24 hours', price: 85 },

  // Coagulation
  { id: 'test-070', testCode: 'PT', code: 'PT', testName: 'Prothrombin Time', name: 'Prothrombin Time', loincCode: '5902-2', cptCode: '85610', category: 'coagulation', specimenType: 'blood', fastingRequired: false, turnaroundTime: '24 hours', price: 15 },
  { id: 'test-071', testCode: 'INR', code: 'INR', testName: 'International Normalized Ratio', name: 'International Normalized Ratio', loincCode: '6301-6', cptCode: '85610', category: 'coagulation', specimenType: 'blood', fastingRequired: false, turnaroundTime: '24 hours', price: 0 },
  { id: 'test-072', testCode: 'PTT', code: 'PTT', testName: 'Partial Thromboplastin Time', name: 'Partial Thromboplastin Time', loincCode: '3173-2', cptCode: '85730', category: 'coagulation', specimenType: 'blood', fastingRequired: false, turnaroundTime: '24 hours', price: 18 },

  // Urinalysis
  { id: 'test-080', testCode: 'UA', code: 'UA', testName: 'Urinalysis with Microscopy', name: 'Urinalysis with Microscopy', loincCode: '24356-8', cptCode: '81001', category: 'urinalysis', specimenType: 'urine', fastingRequired: false, turnaroundTime: '24 hours', price: 20 },
];

// Mock Lab Panels
export const MOCK_LAB_PANELS: LabPanel[] = [
  {
    id: 'panel-001',
    panelCode: 'BMP',
    code: 'BMP',
    panelName: 'Basic Metabolic Panel',
    name: 'Basic Metabolic Panel',
    description: 'Measures glucose, calcium, and electrolytes to assess kidney function and blood sugar',
    category: 'chemistry',
    tests: MOCK_LAB_TESTS.filter(t => ['GLU', 'BUN', 'CREAT', 'NA', 'K', 'CL', 'CO2', 'CA'].includes(t.code)),
    loincCode: '51990-0',
    cptCode: '80048',
    price: 45,
    fastingRequired: true,
    fastingHours: 8,
    specimenType: 'blood',
    turnaroundTime: '24 hours',
    isCommon: true,
  },
  {
    id: 'panel-002',
    panelCode: 'CBC',
    code: 'CBC',
    panelName: 'Complete Blood Count',
    name: 'Complete Blood Count',
    description: 'Evaluates overall health and detects a wide range of disorders including anemia and infection',
    category: 'hematology',
    tests: MOCK_LAB_TESTS.filter(t => ['WBC', 'RBC', 'HGB', 'HCT', 'PLT'].includes(t.code)),
    loincCode: '57021-8',
    cptCode: '85025',
    price: 35,
    fastingRequired: false,
    specimenType: 'blood',
    turnaroundTime: '24 hours',
    isCommon: true,
  },
  {
    id: 'panel-003',
    panelCode: 'LIPID',
    code: 'LIPID',
    panelName: 'Lipid Panel',
    name: 'Lipid Panel',
    description: 'Measures cholesterol and triglycerides to assess cardiovascular disease risk',
    category: 'lipid',
    tests: MOCK_LAB_TESTS.filter(t => ['CHOL', 'TRIG', 'HDL', 'LDL'].includes(t.code)),
    loincCode: '57698-3',
    cptCode: '80061',
    price: 55,
    fastingRequired: true,
    fastingHours: 12,
    specimenType: 'blood',
    turnaroundTime: '24 hours',
    isCommon: true,
  },
  {
    id: 'panel-004',
    panelCode: 'LFT',
    code: 'LFT',
    panelName: 'Liver Function Panel',
    name: 'Liver Function Panel',
    description: 'Assesses liver health and function',
    category: 'liver',
    tests: MOCK_LAB_TESTS.filter(t => ['ALT', 'AST', 'ALP', 'TBIL', 'ALB'].includes(t.code)),
    loincCode: '24325-3',
    cptCode: '80076',
    price: 50,
    fastingRequired: false,
    specimenType: 'blood',
    turnaroundTime: '24 hours',
    isCommon: true,
  },
  {
    id: 'panel-005',
    panelCode: 'THYROID',
    code: 'THYROID',
    panelName: 'Thyroid Panel',
    name: 'Thyroid Panel',
    description: 'Evaluates thyroid gland function',
    category: 'thyroid',
    tests: MOCK_LAB_TESTS.filter(t => ['TSH', 'FT4', 'FT3'].includes(t.code)),
    loincCode: '55789-5',
    cptCode: '84443',
    price: 95,
    fastingRequired: false,
    specimenType: 'blood',
    turnaroundTime: '48 hours',
    isCommon: true,
  },
];

// Mock Lab Facilities
export const MOCK_LAB_FACILITIES: LabFacility[] = [
  {
    id: 'lab-001',
    facilityId: 'lab-001',
    name: 'Quest Diagnostics - Main',
    type: 'reference',
    address: { street: '100 Lab Way', city: 'Springfield', state: 'IL', zipCode: '62701' },
    phone: '(217) 555-0100',
    fax: '(217) 555-0101',
    email: 'orders@questdiag.example.com',
    npi: '1234567890',
    clia: '14D1234567',
    acceptsEOrders: true,
    supportsEOrders: true,
    supportsHL7: true,
    isPreferred: true,
  },
  {
    id: 'lab-002',
    facilityId: 'lab-002',
    name: 'LabCorp Service Center',
    type: 'reference',
    address: { street: '200 Medical Blvd', city: 'Springfield', state: 'IL', zipCode: '62702' },
    phone: '(217) 555-0200',
    fax: '(217) 555-0201',
    email: 'orders@labcorp.example.com',
    npi: '0987654321',
    clia: '14D7654321',
    acceptsEOrders: true,
    supportsEOrders: true,
    supportsHL7: true,
    isPreferred: false,
  },
  {
    id: 'lab-003',
    facilityId: 'lab-003',
    name: 'Springfield General Hospital Lab',
    type: 'hospital',
    address: { street: '500 Hospital Dr', city: 'Springfield', state: 'IL', zipCode: '62703' },
    phone: '(217) 555-0500',
    fax: '(217) 555-0501',
    npi: '1122334455',
    clia: '14D1122334',
    acceptsEOrders: true,
    supportsEOrders: true,
    supportsHL7: true,
    isPreferred: false,
  },
  {
    id: 'lab-004',
    facilityId: 'lab-004',
    name: 'In-House Laboratory',
    type: 'internal',
    address: { street: '123 Clinic Way', city: 'Springfield', state: 'IL', zipCode: '62701' },
    phone: '(217) 555-0123',
    npi: '5566778899',
    clia: '14D5566778',
    acceptsEOrders: false,
    supportsEOrders: false,
    supportsHL7: false,
    isPreferred: true,
  },
];

// Helper to generate dates
const today = new Date();
const daysAgo = (days: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

// Mock Lab Orders with Results
export const MOCK_LAB_ORDERS: LabOrder[] = [];
