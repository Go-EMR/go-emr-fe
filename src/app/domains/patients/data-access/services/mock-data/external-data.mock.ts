import { ExternalDataRecord } from '../../models/external-data.model';

export const MOCK_EXTERNAL_DATA: ExternalDataRecord[] = [
  // -----------------------------------------------------------------------
  // 1. Quest Diagnostics – Comprehensive Metabolic Panel (URGENT – critical values)
  // -----------------------------------------------------------------------
  {
    id: 'EXT-001',
    patientId: 'PAT-001',
    source: 'reference-lab',
    sourceName: 'Quest Diagnostics',
    sourceId: 'QD-2026-00441',
    dataType: 'lab-result',
    title: 'Comprehensive Metabolic Panel – Critical Values',
    summary:
      'CMP returned with critically elevated creatinine (4.2 mg/dL) and potassium (6.1 mEq/L). Immediate clinical review required.',
    content: `## Comprehensive Metabolic Panel

**Specimen collected:** 2026-02-17 07:45
**Report released:** 2026-02-17 09:12
**Ordering provider:** Dr. Sarah Chen, MD
**Lab:** Quest Diagnostics – Springfield Regional Reference Center

---

### Results Summary

| Test | Result | Reference Range | Flag |
|------|--------|-----------------|------|
| Glucose | 118 mg/dL | 70–99 mg/dL | H |
| BUN | 38 mg/dL | 7–20 mg/dL | H |
| Creatinine | **4.2 mg/dL** | 0.6–1.2 mg/dL | **CRITICAL H** |
| eGFR | **14 mL/min/1.73m²** | >60 | **CRITICAL L** |
| Sodium | 136 mEq/L | 136–145 mEq/L | WNL |
| Potassium | **6.1 mEq/L** | 3.5–5.0 mEq/L | **CRITICAL H** |
| CO2 | 18 mEq/L | 22–29 mEq/L | L |
| Calcium | 8.1 mg/dL | 8.5–10.2 mg/dL | L |
| Total Protein | 6.4 g/dL | 6.3–8.2 g/dL | WNL |
| Albumin | 3.2 g/dL | 3.5–5.0 g/dL | L |
| ALT | 42 U/L | 7–56 U/L | WNL |
| AST | 38 U/L | 10–40 U/L | WNL |

> **CRITICAL VALUE NOTIFICATION:** Creatinine 4.2 and Potassium 6.1 reported to ordering provider at 09:15 per protocol.

### Clinical Correlation
Patient has known CKD Stage 3b. These values represent acute-on-chronic worsening. Recommend nephrology consultation and repeat electrolytes in 4–6 hours.`,
    labResults: [
      {
        testName: 'Creatinine',
        value: '4.2',
        unit: 'mg/dL',
        referenceRange: '0.6–1.2',
        isAbnormal: true,
        isCritical: true,
      },
      {
        testName: 'Potassium',
        value: '6.1',
        unit: 'mEq/L',
        referenceRange: '3.5–5.0',
        isAbnormal: true,
        isCritical: true,
      },
      {
        testName: 'eGFR',
        value: '14',
        unit: 'mL/min/1.73m²',
        referenceRange: '>60',
        isAbnormal: true,
        isCritical: true,
      },
      {
        testName: 'BUN',
        value: '38',
        unit: 'mg/dL',
        referenceRange: '7–20',
        isAbnormal: true,
        isCritical: false,
      },
      {
        testName: 'Glucose',
        value: '118',
        unit: 'mg/dL',
        referenceRange: '70–99',
        isAbnormal: true,
        isCritical: false,
      },
    ],
    originalDate: '2026-02-17',
    receivedDate: '2026-02-17',
    documentId: 'QD-CMP-20260217',
    reviewStatus: 'unreviewed',
    isUrgent: true,
    hasDiscrepancy: false,
    tags: ['critical', 'ckd', 'renal', 'electrolytes', 'cmp'],
  },

  // -----------------------------------------------------------------------
  // 2. Radiology – CT Abdomen/Pelvis from Outside Hospital
  // -----------------------------------------------------------------------
  {
    id: 'EXT-002',
    patientId: 'PAT-001',
    source: 'outside-hospital',
    sourceName: 'Mercy General Hospital – Radiology',
    sourceId: 'MGH-RAD-20260112',
    dataType: 'imaging-report',
    title: 'CT Abdomen/Pelvis with Contrast – Renal Mass Finding',
    summary:
      'CT revealed a 1.8 cm hypervascular lesion in the right kidney lower pole, indeterminate for RCC. Follow-up MRI recommended.',
    content: `## CT Abdomen and Pelvis with IV Contrast

**Date of exam:** 2026-01-12
**Facility:** Mercy General Hospital, Dept. of Radiology
**Radiologist:** Dr. James Whitmore, MD, FRCR
**Clinical indication:** Hematuria, flank pain

---

### Technique
Helical CT of the abdomen and pelvis was performed following IV administration of 100 mL Omnipaque 350. Axial, coronal, and sagittal reconstructions obtained in portal venous and delayed phases.

### Findings

**Liver:** Normal size and attenuation. No focal hepatic lesions. Bile ducts not dilated.

**Kidneys:**
- **Right kidney:** 1.8 cm hypervascular solid lesion in the lower pole demonstrating avid arterial enhancement (HU 38 unenhanced → HU 124 arterial phase → HU 72 delayed). Features are indeterminate; differential includes renal cell carcinoma vs. oncocytoma.
- Left kidney: Unremarkable. No hydronephrosis bilaterally.
- No renal calculi identified.

**Adrenal glands:** Normal bilaterally.

**Spleen/Pancreas/Bowel:** Unremarkable.

**Lymph nodes:** No enlarged retroperitoneal or mesenteric lymph nodes.

**Bladder:** Moderately distended, smooth walls. No intraluminal lesions.

### Impression
1. **1.8 cm indeterminate hypervascular right renal lower pole lesion** – Bosniak/enhancement characteristics raise concern for renal cell carcinoma. MRI with and without gadolinium recommended for further characterization.
2. No regional lymphadenopathy or distant metastatic disease identified on this examination.

### Recommendation
- MRI kidney with and without gadolinium contrast within 4–6 weeks.
- Urology referral recommended.`,
    originalDate: '2026-01-12',
    receivedDate: '2026-01-14',
    documentId: 'MGH-RAD-CT-20260112',
    reviewStatus: 'reviewed',
    reviewedBy: 'USR-001',
    reviewedByName: 'Dr. Sarah Chen',
    reviewedAt: '2026-01-15T10:30:00Z',
    reviewNotes:
      'Reviewed. Urology referral placed. MRI scheduled for 2026-02-20.',
    isUrgent: false,
    hasDiscrepancy: false,
    tags: ['radiology', 'renal-mass', 'ct', 'urology', 'follow-up'],
  },

  // -----------------------------------------------------------------------
  // 3. Outside Hospital – Discharge Summary
  // -----------------------------------------------------------------------
  {
    id: 'EXT-003',
    patientId: 'PAT-001',
    source: 'outside-hospital',
    sourceName: 'Mercy General Hospital',
    sourceId: 'MGH-DS-20260113',
    dataType: 'discharge-summary',
    title: 'Hospital Discharge Summary – Acute Pyelonephritis',
    summary:
      '3-day admission for acute pyelonephritis. Treated with IV ceftriaxone, transitioned to oral ciprofloxacin on discharge.',
    content: `## Discharge Summary

**Patient:** James Thornton (DOB: 1961-03-14, MRN: MGH-4872)
**Admission date:** 2026-01-10
**Discharge date:** 2026-01-13
**Attending:** Dr. Robert Okafor, MD – Internal Medicine
**Discharge disposition:** Home with outpatient follow-up

---

### Admitting Diagnosis
Acute pyelonephritis, right-sided

### Hospital Course
Mr. Thornton presented to the ED on 01/10 with a 2-day history of right flank pain, fever (Tmax 39.4°C), chills, and dysuria. UA demonstrated pyuria and bacteriuria. Blood cultures drawn. IV access established; IV fluids and IV ceftriaxone 1g q24h initiated.

Urine culture grew **E. coli**, susceptible to ciprofloxacin, ceftriaxone, and trimethoprim-sulfamethoxazole. Blood cultures negative at 48h. Clinical improvement by day 2; fever resolved. Transitioned to oral ciprofloxacin 500mg BID on 01/12.

CT abdomen/pelvis obtained 01/12 (see separate radiology report) – identified incidental right renal lesion; urology referral recommended.

### Discharge Medications
- Ciprofloxacin 500 mg PO BID x 10 days (complete course by 01/23/2026)
- Continue home medications: Lisinopril 10 mg, Metformin 1000 mg BID, Atorvastatin 40 mg

### Discharge Instructions
- Follow up with PCP within 7 days
- Urology consultation for renal mass
- Push fluids (>2L/day)
- Return to ED for fever >38.5°C, worsening pain, or inability to tolerate oral medications

### Pending Results at Discharge
- Repeat urine culture in 2 weeks post-antibiotic course`,
    originalDate: '2026-01-13',
    receivedDate: '2026-01-15',
    documentId: 'MGH-DS-2026-0113',
    reviewStatus: 'acknowledged',
    reviewedBy: 'USR-001',
    reviewedByName: 'Dr. Sarah Chen',
    reviewedAt: '2026-01-16T08:00:00Z',
    reviewNotes:
      'Ciprofloxacin course should have completed 01/23. Verify completion at next visit. Renal lesion already actioned.',
    isUrgent: false,
    hasDiscrepancy: false,
    tags: ['discharge-summary', 'pyelonephritis', 'e-coli', 'antibiotic'],
  },

  // -----------------------------------------------------------------------
  // 4. Pharmacy Network – Medication History (with DISCREPANCY)
  // -----------------------------------------------------------------------
  {
    id: 'EXT-004',
    patientId: 'PAT-001',
    source: 'pharmacy-network',
    sourceName: 'CVS Specialty Pharmacy Network',
    sourceId: 'CVS-MED-PAT001',
    dataType: 'medication-history',
    title: 'Pharmacy Fill History – Last 90 Days',
    summary:
      'Pharmacy records show patient filling Amlodipine 10mg and Omeprazole 20mg which are not in current medication list. Possible discrepancy.',
    content: `## Medication Fill History (Last 90 Days)

**Source:** CVS Caremark Pharmacy Network
**Query date:** 2026-02-18
**Patient DOB verified:** Yes

---

### Fills Retrieved

| Medication | Strength | Qty | Days Supply | Fill Date | Pharmacy | Prescriber |
|-----------|---------|-----|-------------|-----------|---------|-----------|
| Lisinopril | 10 mg | 30 | 30 | 2026-02-01 | CVS #4421 | Dr. S. Chen |
| Metformin HCl | 1000 mg | 60 | 30 | 2026-02-01 | CVS #4421 | Dr. S. Chen |
| Atorvastatin | 40 mg | 30 | 30 | 2026-02-01 | CVS #4421 | Dr. S. Chen |
| **Amlodipine** | **10 mg** | **30** | **30** | **2026-01-28** | Walgreens #2218 | **Dr. R. Okafor** |
| **Omeprazole** | **20 mg** | **30** | **30** | **2026-01-28** | Walgreens #2218 | **Dr. R. Okafor** |
| Ciprofloxacin | 500 mg | 20 | 10 | 2026-01-13 | CVS #4421 | Dr. R. Okafor |

---

### Notes
- Amlodipine 10 mg and Omeprazole 20 mg were prescribed by Dr. Robert Okafor during hospital discharge at Mercy General. These medications are **not listed** in the current EMR medication reconciliation list.
- Ciprofloxacin course should have completed 2026-01-23.`,
    medications: [
      {
        name: 'Lisinopril',
        dose: '10 mg',
        frequency: 'Once daily',
        prescriber: 'Dr. S. Chen',
        startDate: '2026-02-01',
        status: 'active',
      },
      {
        name: 'Metformin HCl',
        dose: '1000 mg',
        frequency: 'Twice daily',
        prescriber: 'Dr. S. Chen',
        startDate: '2026-02-01',
        status: 'active',
      },
      {
        name: 'Atorvastatin',
        dose: '40 mg',
        frequency: 'Once daily at bedtime',
        prescriber: 'Dr. S. Chen',
        startDate: '2026-02-01',
        status: 'active',
      },
      {
        name: 'Amlodipine',
        dose: '10 mg',
        frequency: 'Once daily',
        prescriber: 'Dr. R. Okafor',
        startDate: '2026-01-28',
        status: 'active',
      },
      {
        name: 'Omeprazole',
        dose: '20 mg',
        frequency: 'Once daily before breakfast',
        prescriber: 'Dr. R. Okafor',
        startDate: '2026-01-28',
        status: 'active',
      },
      {
        name: 'Ciprofloxacin',
        dose: '500 mg',
        frequency: 'Twice daily',
        prescriber: 'Dr. R. Okafor',
        startDate: '2026-01-13',
        status: 'discontinued',
      },
    ],
    originalDate: '2026-02-18',
    receivedDate: '2026-02-18',
    reviewStatus: 'unreviewed',
    isUrgent: false,
    hasDiscrepancy: true,
    discrepancyNotes:
      'Amlodipine 10mg and Omeprazole 20mg found in pharmacy fills but absent from current EMR medication list. Prescribed by Dr. Okafor at Mercy General discharge (2026-01-13). These must be added to the active medication list or reconciled.',
    tags: ['medication-reconciliation', 'discrepancy', 'pharmacy', 'amlodipine', 'omeprazole'],
  },

  // -----------------------------------------------------------------------
  // 5. Health Information Exchange – Immunization Records
  // -----------------------------------------------------------------------
  {
    id: 'EXT-005',
    patientId: 'PAT-001',
    source: 'health-information-exchange',
    sourceName: 'State Health Information Exchange (HIE)',
    sourceId: 'HIE-IMM-PAT001',
    dataType: 'immunization',
    title: 'Immunization History from State Registry',
    summary:
      'HIE registry shows patient is up-to-date on influenza and Tdap. Pneumococcal (PPSV23) and shingles (Shingrix series) are overdue.',
    content: `## Immunization History – State HIE Registry

**Query date:** 2026-02-15
**Registry:** State Immunization Information System (IIS)
**Last updated by:** Primary Care Associates of Springfield

---

### Immunization Record

| Vaccine | Date Given | Site | Lot # | Status |
|---------|-----------|------|-------|--------|
| Influenza (Trivalent, Standard Dose) | 2025-10-08 | Primary Care Associates | FLU25-882 | Current |
| Tdap (Adacel) | 2021-03-15 | Primary Care Associates | ADA21-441 | Current |
| COVID-19 (Moderna Bivalent Booster) | 2024-10-01 | Walgreens Pharmacy | MOD24-XB-002 | Current |
| Hepatitis B series (completed) | 1998–1999 | Former PCP | — | Complete |
| MMR | 1965-04-12 | Childhood | — | Complete |

---

### Overdue / Recommended

| Vaccine | Indication | Due Since |
|---------|----------|-----------|
| **Pneumococcal PPSV23** | Age 65+ / CKD | Overdue since 2026-03-14 (upcoming) |
| **Shingrix Dose 1** | Age 50+ | Overdue since 2011 |
| **Shingrix Dose 2** | 2–6 months after Dose 1 | Not yet started |

> **Note:** PPSV23 indicated due to CKD diagnosis. Both Shingrix doses recommended for all adults age 50+.`,
    originalDate: '2026-02-15',
    receivedDate: '2026-02-15',
    documentId: 'HIE-IMM-20260215',
    reviewStatus: 'incorporated',
    reviewedBy: 'USR-001',
    reviewedByName: 'Dr. Sarah Chen',
    reviewedAt: '2026-02-16T11:00:00Z',
    reviewNotes:
      'Incorporated into preventive care plan. Shingrix Dose 1 offered at today\'s visit – patient accepted. PPSV23 to be given at next eligible visit.',
    isUrgent: false,
    hasDiscrepancy: false,
    tags: ['immunization', 'vaccines', 'shingrix', 'pneumococcal', 'preventive'],
  },

  // -----------------------------------------------------------------------
  // 6. Wearable Device – Continuous Vital Signs
  // -----------------------------------------------------------------------
  {
    id: 'EXT-006',
    patientId: 'PAT-001',
    source: 'wearable-device',
    sourceName: 'Apple Watch Series 10 (Patient Device)',
    sourceId: 'AW-PAT001-S10',
    dataType: 'vital-signs',
    title: 'Wearable Vital Signs – 7-Day Trend',
    summary:
      'Heart rate variability trending lower. Average resting HR 88 bpm (elevated). SpO2 consistently 94–96%.',
    content: `## Wearable Device Data Summary

**Device:** Apple Watch Series 10
**Data period:** 2026-02-11 to 2026-02-18
**Synced via:** Apple Health / HealthKit Integration

---

### Heart Rate Summary (7-day average)

| Metric | Value | Trend |
|--------|-------|-------|
| Resting Heart Rate | 88 bpm | Elevated (up from 74 bpm baseline) |
| Min Heart Rate | 62 bpm | — |
| Max Heart Rate | 124 bpm | — |
| Heart Rate Variability (HRV) | 18 ms | Low (normal: 20–50 ms) |

### Blood Oxygen (SpO2)
- Average: **95.1%**
- Minimum recorded: **92%** (2026-02-14 03:12 during sleep)
- Episodes <94%: 3 overnight events

### Sleep Data
| Night | Duration | Deep Sleep | REM |
|-------|----------|-----------|-----|
| 02-17 | 5h 42m | 48 min | 54 min |
| 02-16 | 6h 01m | 52 min | 61 min |
| 02-15 | 5h 18m | 39 min | 44 min |

### Activity
- Daily steps average: 3,241 steps (below 5,000 target)
- Sedentary hours/day: 14.2h

---

> **Clinical note:** Elevated resting HR and low HRV may reflect physiological stress from acute illness (pyelonephritis recovery, CKD exacerbation). SpO2 dips during sleep warrant consideration of sleep-disordered breathing evaluation.`,
    vitalSigns: [
      {
        type: 'Resting Heart Rate',
        value: '88',
        unit: 'bpm',
        timestamp: '2026-02-18T08:00:00Z',
      },
      {
        type: 'SpO2 (Average)',
        value: '95.1',
        unit: '%',
        timestamp: '2026-02-18T08:00:00Z',
      },
      {
        type: 'HRV',
        value: '18',
        unit: 'ms',
        timestamp: '2026-02-18T08:00:00Z',
      },
      {
        type: 'SpO2 (Minimum)',
        value: '92',
        unit: '%',
        timestamp: '2026-02-14T03:12:00Z',
      },
    ],
    originalDate: '2026-02-18',
    receivedDate: '2026-02-18',
    reviewStatus: 'unreviewed',
    isUrgent: false,
    hasDiscrepancy: false,
    tags: ['wearable', 'vitals', 'heart-rate', 'spo2', 'hrv', 'sleep'],
  },

  // -----------------------------------------------------------------------
  // 7. Outside Provider – Nephrology Referral (URGENT)
  // -----------------------------------------------------------------------
  {
    id: 'EXT-007',
    patientId: 'PAT-001',
    source: 'outside-hospital',
    sourceName: 'Springfield Nephrology Associates',
    sourceId: 'SNA-REF-20260218',
    dataType: 'referral',
    title: 'Nephrology Referral – Acute-on-Chronic Kidney Disease',
    summary:
      'Urgent nephrology referral accepted. Appointment scheduled 2026-02-21. Dr. Patel requests repeat labs before visit.',
    content: `## Nephrology Referral Acceptance

**Referring provider:** Dr. Sarah Chen, MD – Primary Care
**Accepting specialist:** Dr. Priya Patel, MD – Nephrology
**Referral date:** 2026-02-17
**Appointment:** 2026-02-21 at 10:30 AM
**Urgency:** URGENT

---

### Reason for Referral
Acute-on-chronic kidney disease with critically elevated creatinine (4.2 mg/dL, eGFR 14) and hyperkalemia (K+ 6.1 mEq/L). Known CKD Stage 3b with recent acute decompensation requiring evaluation for:
1. Etiology of acute decompensation
2. Renal replacement therapy planning if decline continues
3. Management of hyperkalemia
4. Dietary and fluid management counseling

### Pre-visit Labs Requested by Dr. Patel
- Repeat BMP with Mg, Phos
- Urine protein/creatinine ratio (spot)
- CBC with differential
- Iron studies (Fe, TIBC, ferritin)
- PTH, 25-OH Vitamin D

### Additional Notes
Patient has concurrent right renal lower pole mass (indeterminate, 1.8 cm per CT 01/12). Nephrology asked to weigh in on biopsy timing vs. observation given CKD severity.`,
    originalDate: '2026-02-17',
    receivedDate: '2026-02-17',
    documentId: 'SNA-REF-2026-0217',
    reviewStatus: 'unreviewed',
    isUrgent: true,
    hasDiscrepancy: false,
    tags: ['nephrology', 'referral', 'ckd', 'urgent', 'hyperkalemia'],
  },

  // -----------------------------------------------------------------------
  // 8. Insurance – Prior Authorization Approval
  // -----------------------------------------------------------------------
  {
    id: 'EXT-008',
    patientId: 'PAT-001',
    source: 'insurance',
    sourceName: 'BlueCross BlueShield of Illinois',
    sourceId: 'BCBS-PA-20260204',
    dataType: 'referral',
    title: 'Prior Authorization Approved – MRI Kidney with Gadolinium',
    summary:
      'BCBS approved PA for MRI kidney with and without gadolinium contrast. Authorization valid through 2026-04-04.',
    content: `## Prior Authorization Approval Notice

**Insurance:** BlueCross BlueShield of Illinois
**Group:** Springfield Employers Consortium
**Member ID:** XWP-882-4471-01
**Authorization #:** PA-2026-0204-88812
**Date issued:** 2026-02-04
**Valid through:** 2026-04-04

---

### Approved Service
**Procedure:** MRI Kidney with and without gadolinium contrast
**CPT Code:** 74183
**ICD-10 Diagnosis:** C64.1 (Malignant neoplasm of right kidney, except renal pelvis – under evaluation)
**Approved units:** 1
**Approved facility:** Springfield Imaging Center or Mercy General Hospital Radiology

### Notes
- Prior authorization is not a guarantee of payment. Benefits subject to member's cost-sharing.
- Patient may be responsible for applicable copay/deductible per plan year.
- Re-authorization required if service exceeds approved validity period.

### Contact
BCBS Provider Services: 1-800-842-2000
Authorization verification available 24/7 at provider.bcbsil.com`,
    originalDate: '2026-02-04',
    receivedDate: '2026-02-04',
    documentId: 'BCBS-PA-88812',
    reviewStatus: 'acknowledged',
    reviewedBy: 'USR-002',
    reviewedByName: 'Office Staff',
    reviewedAt: '2026-02-05T09:00:00Z',
    reviewNotes: 'PA confirmed. MRI booked at Springfield Imaging 2026-02-20.',
    isUrgent: false,
    hasDiscrepancy: false,
    tags: ['insurance', 'prior-auth', 'mri', 'approved'],
  },

  // -----------------------------------------------------------------------
  // 9. Specialist – Urology Clinical Note
  // -----------------------------------------------------------------------
  {
    id: 'EXT-009',
    patientId: 'PAT-001',
    source: 'outside-hospital',
    sourceName: 'Springfield Urology Group',
    sourceId: 'SUG-NOTE-20260205',
    dataType: 'clinical-note',
    title: 'Urology Consultation Note – Right Renal Mass Evaluation',
    summary:
      'Urologist Dr. Marcus Webb recommends active surveillance with MRI in 3 months given CKD precluding immediate surgical intervention.',
    content: `## Urology Consultation Note

**Date:** 2026-02-05
**Provider:** Dr. Marcus Webb, MD – Urology, Springfield Urology Group
**Reason for visit:** Evaluation of incidental right renal lower pole mass (1.8 cm, CT 01/12/2026)

---

### History of Present Illness
Mr. Thornton is a 64-year-old male referred by Dr. Sarah Chen for evaluation of an incidental right renal mass identified on CT abdomen/pelvis during workup for acute pyelonephritis. The lesion measures 1.8 cm in greatest dimension in the lower pole of the right kidney with hypervascular enhancement features. Patient denies gross hematuria currently, though had microscopic hematuria at hospital admission in January.

### Relevant PMH
- CKD Stage 3b (creatinine now acutely worsened – see labs)
- Type 2 Diabetes Mellitus
- Hypertension
- Recent acute pyelonephritis (discharged 01/13/2026)

### Physical Exam
General: Alert, in no acute distress. No costovertebral angle tenderness. Abdomen soft, non-tender.

### Assessment and Plan

**Impression:** 1.8 cm right renal lower pole lesion – most likely renal cell carcinoma (clear cell) vs. oncocytoma given enhancement characteristics.

**Management plan:**

1. **Active surveillance with MRI:** Given CKD Stage 3b (now acute-on-chronic with Cr 4.2), surgical intervention carries prohibitive risk at this time. MRI kidney with gadolinium planned for 2026-02-20 for lesion characterization. Nephrology consult already placed.

2. **Percutaneous biopsy:** To be considered after CKD stabilization. Will defer in coordination with nephrology.

3. **Surveillance schedule (if benign appearance on MRI):** MRI at 3, 9, and 18 months, then annually.

4. **Nephrology coordination:** CKD management must precede any surgical intervention. Close coordination with Dr. Patel.

**Follow-up:** After MRI results available; expects report within 48h of 02/20 study.`,
    originalDate: '2026-02-05',
    receivedDate: '2026-02-07',
    documentId: 'SUG-CONS-20260205',
    reviewStatus: 'reviewed',
    reviewedBy: 'USR-001',
    reviewedByName: 'Dr. Sarah Chen',
    reviewedAt: '2026-02-08T14:00:00Z',
    reviewNotes:
      'Agree with plan. MRI scheduled 02/20. Active surveillance protocol entered in chart.',
    isUrgent: false,
    hasDiscrepancy: false,
    tags: ['urology', 'renal-mass', 'consultation', 'surveillance', 'biopsy'],
  },

  // -----------------------------------------------------------------------
  // 10. Quest Diagnostics – HbA1c and Lipid Panel
  // -----------------------------------------------------------------------
  {
    id: 'EXT-010',
    patientId: 'PAT-001',
    source: 'reference-lab',
    sourceName: 'Quest Diagnostics',
    sourceId: 'QD-2026-00198',
    dataType: 'lab-result',
    title: 'HbA1c and Lipid Panel – Quarterly Monitoring',
    summary:
      'HbA1c 8.2% (suboptimal, above 7% target). LDL 112 mg/dL on atorvastatin. Consider medication adjustment.',
    content: `## HbA1c and Lipid Panel

**Specimen collected:** 2026-02-03 08:30 (fasting)
**Report released:** 2026-02-03 14:45
**Ordering provider:** Dr. Sarah Chen, MD

---

### Results

| Test | Result | Reference/Target | Flag |
|------|--------|-----------------|------|
| HbA1c | 8.2% | <7.0% (diabetic target) | H |
| Estimated Average Glucose | 189 mg/dL | <154 mg/dL | H |
| Total Cholesterol | 198 mg/dL | <200 mg/dL | WNL |
| LDL Cholesterol | 112 mg/dL | <70 mg/dL (high-risk target) | H |
| HDL Cholesterol | 42 mg/dL | >40 mg/dL | WNL |
| Triglycerides | 218 mg/dL | <150 mg/dL | H |
| Non-HDL Cholesterol | 156 mg/dL | <100 mg/dL | H |

### Clinical Correlation
HbA1c has increased from 7.6% (November 2025) to 8.2%. LDL remains above goal of <70 mg/dL for a high-cardiovascular-risk patient with CKD and diabetes. Triglycerides elevated, possibly related to renal disease.`,
    labResults: [
      {
        testName: 'HbA1c',
        value: '8.2',
        unit: '%',
        referenceRange: '<7.0',
        isAbnormal: true,
        isCritical: false,
      },
      {
        testName: 'LDL Cholesterol',
        value: '112',
        unit: 'mg/dL',
        referenceRange: '<70',
        isAbnormal: true,
        isCritical: false,
      },
      {
        testName: 'Triglycerides',
        value: '218',
        unit: 'mg/dL',
        referenceRange: '<150',
        isAbnormal: true,
        isCritical: false,
      },
      {
        testName: 'Total Cholesterol',
        value: '198',
        unit: 'mg/dL',
        referenceRange: '<200',
        isAbnormal: false,
        isCritical: false,
      },
    ],
    originalDate: '2026-02-03',
    receivedDate: '2026-02-03',
    documentId: 'QD-HBA1C-20260203',
    reviewStatus: 'reviewed',
    reviewedBy: 'USR-001',
    reviewedByName: 'Dr. Sarah Chen',
    reviewedAt: '2026-02-04T09:30:00Z',
    reviewNotes:
      'HbA1c worsened. Will discuss insulin initiation vs. GLP-1 at next visit. Consider increasing atorvastatin or adding ezetimibe once nephrology clears.',
    isUrgent: false,
    hasDiscrepancy: false,
    tags: ['hba1c', 'diabetes', 'lipids', 'ldl', 'quarterly'],
  },

  // -----------------------------------------------------------------------
  // 11. Patient Portal – Patient-Submitted Symptom Report
  // -----------------------------------------------------------------------
  {
    id: 'EXT-011',
    patientId: 'PAT-001',
    source: 'patient-portal',
    sourceName: 'MyChart Patient Portal',
    sourceId: 'MC-MSG-20260216',
    dataType: 'clinical-note',
    title: 'Patient Message – New Symptom Report: Ankle Swelling',
    summary:
      'Patient reports bilateral ankle edema for 5 days, worsening. Possible fluid retention related to CKD or new amlodipine.',
    content: `## Patient Portal Message

**Received:** 2026-02-16 at 7:34 PM
**From:** James Thornton (Patient)
**Via:** MyChart Secure Message
**Category:** New Symptom

---

### Patient Message (verbatim)

> "Dr. Chen, I wanted to let you know that for the past 5 days I've been noticing a lot of swelling in both of my ankles and feet, especially by the end of the day. By evening my socks leave indentations. I don't think I've had this before. I started that new blood pressure pill from the hospital a few weeks ago – could that be causing it? I'm also more tired than usual but figured that was from everything going on. Let me know if I need to come in. – Jim"

---

### Clinical Assessment (to be completed)

**Differential for bilateral ankle edema:**
- Amlodipine-induced peripheral edema (common, ~10% of patients on high-dose amlodipine 10mg)
- Volume overload secondary to CKD with reduced GFR
- Hypoalbuminemia (albumin 3.2 on recent CMP)
- Right heart failure (less likely, no known cardiac history)

**Recommended action:** Evaluate in-person given concurrent CKD decompensation. Review volume status, consider reducing amlodipine to 5mg, assess JVD and lung sounds.`,
    originalDate: '2026-02-16',
    receivedDate: '2026-02-16',
    documentId: 'MC-MSG-2026-0216',
    reviewStatus: 'unreviewed',
    isUrgent: false,
    hasDiscrepancy: true,
    discrepancyNotes:
      'Patient confirms taking Amlodipine 10mg (from hospital discharge) which is not reconciled in EMR. This corroborates the pharmacy discrepancy found in EXT-004. Action required: reconcile medications.',
    tags: ['patient-message', 'edema', 'amlodipine', 'ckd', 'medication-side-effect'],
  },

  // -----------------------------------------------------------------------
  // 12. HIE – Dismissed old duplicate discharge summary
  // -----------------------------------------------------------------------
  {
    id: 'EXT-012',
    patientId: 'PAT-001',
    source: 'health-information-exchange',
    sourceName: 'State Health Information Exchange (HIE)',
    sourceId: 'HIE-DOC-20260115',
    dataType: 'discharge-summary',
    title: 'Duplicate – Mercy General Discharge Summary (HIE Copy)',
    summary:
      'Duplicate of MGH discharge summary (EXT-003) received via HIE channel. Dismissed as redundant.',
    content: `## Document Notice

This document is a duplicate of the discharge summary already received directly from Mercy General Hospital (Document ID: MGH-DS-2026-0113, EXT-003).

It was automatically retrieved by the Health Information Exchange query on 2026-01-15 and duplicates content already in the chart.

**Action taken:** Dismissed as redundant. Original document retained.`,
    originalDate: '2026-01-13',
    receivedDate: '2026-01-15',
    documentId: 'HIE-DS-20260115',
    reviewStatus: 'dismissed',
    reviewedBy: 'USR-002',
    reviewedByName: 'Office Staff',
    reviewedAt: '2026-01-15T11:30:00Z',
    reviewNotes: 'Duplicate of EXT-003. No clinical action needed.',
    isUrgent: false,
    hasDiscrepancy: false,
    tags: ['duplicate', 'hie', 'dismissed'],
  },
];
