export interface SynonymGroup {
  canonical: string;
  terms: string[];
  icd10?: string[];
}

export const MEDICAL_SYNONYMS: SynonymGroup[] = [
  // Cardiovascular
  { canonical: 'heart attack', terms: ['myocardial infarction', 'MI', 'STEMI', 'NSTEMI', 'acute coronary syndrome', 'ACS'], icd10: ['I21'] },
  { canonical: 'high blood pressure', terms: ['hypertension', 'HTN', 'elevated BP', 'high BP'], icd10: ['I10'] },
  { canonical: 'heart failure', terms: ['CHF', 'congestive heart failure', 'HFrEF', 'HFpEF', 'cardiac failure'], icd10: ['I50'] },
  { canonical: 'irregular heartbeat', terms: ['arrhythmia', 'atrial fibrillation', 'afib', 'a-fib', 'SVT', 'tachycardia', 'bradycardia'], icd10: ['I49'] },
  { canonical: 'chest pain', terms: ['angina', 'angina pectoris', 'chest discomfort', 'precordial pain'], icd10: ['R07.9'] },

  // Respiratory
  { canonical: 'COPD', terms: ['chronic obstructive pulmonary disease', 'emphysema', 'chronic bronchitis'], icd10: ['J44'] },
  { canonical: 'asthma', terms: ['reactive airway disease', 'RAD', 'bronchospasm', 'wheezing'], icd10: ['J45'] },
  { canonical: 'pneumonia', terms: ['lung infection', 'PNA', 'CAP', 'community-acquired pneumonia', 'HAP'], icd10: ['J18'] },
  { canonical: 'shortness of breath', terms: ['dyspnea', 'SOB', 'breathlessness', 'difficulty breathing', 'air hunger'], icd10: ['R06.0'] },

  // Endocrine
  { canonical: 'diabetes', terms: ['DM', 'diabetes mellitus', 'type 2 diabetes', 'T2DM', 'type 1 diabetes', 'T1DM', 'IDDM', 'NIDDM', 'sugar disease'], icd10: ['E11'] },
  { canonical: 'thyroid disorder', terms: ['hypothyroidism', 'hyperthyroidism', 'thyroiditis', 'Hashimoto', 'Graves disease', 'goiter'], icd10: ['E03'] },

  // GI
  { canonical: 'acid reflux', terms: ['GERD', 'gastroesophageal reflux', 'heartburn', 'reflux', 'esophagitis'], icd10: ['K21'] },
  { canonical: 'stomach ulcer', terms: ['peptic ulcer', 'gastric ulcer', 'PUD', 'duodenal ulcer'], icd10: ['K27'] },
  { canonical: 'liver disease', terms: ['hepatitis', 'cirrhosis', 'fatty liver', 'NAFLD', 'NASH', 'hepatic disease'], icd10: ['K76'] },

  // Neurological
  { canonical: 'stroke', terms: ['CVA', 'cerebrovascular accident', 'brain attack', 'TIA', 'transient ischemic attack', 'ischemic stroke'], icd10: ['I63'] },
  { canonical: 'seizure', terms: ['epilepsy', 'convulsion', 'fit', 'seizure disorder'], icd10: ['G40'] },
  { canonical: 'headache', terms: ['migraine', 'cephalalgia', 'tension headache', 'cluster headache'], icd10: ['R51'] },

  // Musculoskeletal
  { canonical: 'arthritis', terms: ['osteoarthritis', 'OA', 'rheumatoid arthritis', 'RA', 'joint pain', 'degenerative joint disease', 'DJD'], icd10: ['M19'] },
  { canonical: 'back pain', terms: ['low back pain', 'LBP', 'lumbago', 'sciatica', 'herniated disc', 'degenerative disc disease'], icd10: ['M54'] },
  { canonical: 'fracture', terms: ['broken bone', 'Fx', 'break', 'stress fracture'], icd10: ['T14.8'] },

  // Mental Health
  { canonical: 'depression', terms: ['major depressive disorder', 'MDD', 'depressive episode', 'low mood', 'melancholia'], icd10: ['F32'] },
  { canonical: 'anxiety', terms: ['generalized anxiety disorder', 'GAD', 'panic disorder', 'panic attack', 'anxiety disorder', 'nervousness'], icd10: ['F41'] },

  // Renal
  { canonical: 'kidney disease', terms: ['CKD', 'chronic kidney disease', 'renal failure', 'renal insufficiency', 'ESRD', 'nephropathy'], icd10: ['N18'] },
  { canonical: 'urinary tract infection', terms: ['UTI', 'bladder infection', 'cystitis', 'pyelonephritis', 'urosepsis'], icd10: ['N39.0'] },

  // Infectious
  { canonical: 'sepsis', terms: ['septicemia', 'blood infection', 'systemic infection', 'bacteremia', 'SIRS'], icd10: ['A41'] },
  { canonical: 'COVID-19', terms: ['coronavirus', 'SARS-CoV-2', 'COVID', 'corona'], icd10: ['U07.1'] },

  // Hematology
  { canonical: 'anemia', terms: ['low blood count', 'low hemoglobin', 'iron deficiency anemia', 'IDA'], icd10: ['D64'] },
  { canonical: 'blood clot', terms: ['DVT', 'deep vein thrombosis', 'PE', 'pulmonary embolism', 'thrombosis', 'VTE', 'venous thromboembolism'], icd10: ['I82'] },

  // Common procedures/tests
  { canonical: 'blood test', terms: ['lab work', 'blood work', 'labs', 'laboratory', 'CBC', 'BMP', 'CMP'] },
  { canonical: 'imaging', terms: ['X-ray', 'xray', 'CT scan', 'MRI', 'ultrasound', 'radiology', 'scan'] },
  { canonical: 'surgery', terms: ['operation', 'procedure', 'surgical', 'OR', 'operating room'] },

  // Medications
  { canonical: 'blood thinner', terms: ['anticoagulant', 'warfarin', 'coumadin', 'heparin', 'eliquis', 'xarelto', 'apixaban', 'rivaroxaban'] },
  { canonical: 'pain medication', terms: ['analgesic', 'painkiller', 'NSAID', 'opioid', 'acetaminophen', 'ibuprofen', 'tylenol', 'advil', 'morphine'] },
  { canonical: 'antibiotic', terms: ['antibacterial', 'amoxicillin', 'azithromycin', 'z-pack', 'zithromax', 'cipro', 'ciprofloxacin', 'augmentin'] },
  { canonical: 'statin', terms: ['cholesterol medication', 'atorvastatin', 'lipitor', 'rosuvastatin', 'crestor', 'simvastatin', 'zocor'] },
  { canonical: 'insulin', terms: ['lantus', 'humalog', 'novolog', 'glargine', 'lispro', 'aspart', 'NPH'] },
  { canonical: 'ACE inhibitor', terms: ['lisinopril', 'enalapril', 'ramipril', 'benazepril', 'captopril', 'ACEI'] },
  { canonical: 'beta blocker', terms: ['metoprolol', 'atenolol', 'carvedilol', 'propranolol', 'lopressor', 'toprol'] },
];
