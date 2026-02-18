import { Encounter, EncounterTemplate } from '../../models/encounter.model';

const today = new Date();
today.setHours(0, 0, 0, 0);

function getDateWithTime(daysOffset: number, hours: number, minutes: number = 0): Date {
  const date = new Date(today);
  date.setDate(date.getDate() + daysOffset);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export const MOCK_ENCOUNTERS: Encounter[] = [];

export const MOCK_ENCOUNTER_TEMPLATES: EncounterTemplate[] = [
  {
    id: 'tmpl-001',
    name: 'Annual Physical - Adult',
    description: 'Standard template for adult wellness examination',
    category: 'Preventive',
    encounterClass: 'ambulatory',
    subjective: {
      chiefComplaint: 'Annual physical examination',
      historyOfPresentIllness: 'Patient presents for routine annual physical examination.',
      reviewOfSystems: {
        constitutional: '',
        cardiovascular: '',
        respiratory: '',
        gastrointestinal: '',
        neurological: '',
      },
    },
    objective: {
      physicalExam: {
        general: 'Well-appearing in no acute distress',
        head: 'Normocephalic, atraumatic',
        eyes: 'PERRLA, EOM intact',
        ears: 'TMs clear bilaterally',
        throat: 'Oropharynx clear',
        neck: 'Supple, no lymphadenopathy',
        heart: 'RRR, no murmurs',
        lungs: 'CTA bilaterally',
        abdomen: 'Soft, non-tender, no organomegaly',
        extremities: 'No edema',
        neurological: 'Alert and oriented x3',
      },
    },
    plan: {
      treatmentPlan: 'Continue healthy lifestyle. Age-appropriate screenings reviewed.',
      followUp: {
        timing: '1 year',
        reason: 'Annual physical',
      },
    },
    createdBy: 'system',
    isShared: true,
    usageCount: 156,
  },
  {
    id: 'tmpl-002',
    name: 'URI - Acute Visit',
    description: 'Template for upper respiratory infection visit',
    category: 'Acute',
    encounterClass: 'ambulatory',
    subjective: {
      chiefComplaint: 'Cold symptoms',
      historyOfPresentIllness: 'Patient presents with ___ day history of nasal congestion, sore throat, and cough.',
      reviewOfSystems: {
        constitutional: '',
        respiratory: '',
      },
    },
    objective: {
      physicalExam: {
        general: '',
        throat: '',
        ears: '',
        lungs: '',
        neck: '',
      },
    },
    assessment: {
      clinicalImpression: 'Acute upper respiratory infection, likely viral',
      diagnoses: [
        {
          id: 'tmpl-dx-001',
          code: 'J06.9',
          codeSystem: 'ICD-10',
          description: 'Acute upper respiratory infection, unspecified',
          type: 'primary',
          status: 'active',
        },
      ],
    },
    plan: {
      treatmentPlan: 'Supportive care. Push fluids, rest.',
      followUp: {
        timing: 'PRN',
        reason: 'If symptoms worsen or do not improve in 7-10 days',
      },
    },
    createdBy: 'system',
    isShared: true,
    usageCount: 89,
  },
  {
    id: 'tmpl-003',
    name: 'Diabetes Follow-up',
    description: 'Template for Type 2 DM follow-up visit',
    category: 'Chronic Disease',
    encounterClass: 'ambulatory',
    subjective: {
      chiefComplaint: 'Diabetes follow-up',
      historyOfPresentIllness: 'Patient with Type 2 DM presents for routine follow-up. Current medications: ___.',
    },
    objective: {
      physicalExam: {
        general: '',
        heart: '',
        extremities: 'Sensation intact to monofilament testing',
      },
      labResults: 'Recent HbA1c: ___',
    },
    plan: {
      treatmentPlan: 'Continue current diabetes management.',
      labOrders: [
        {
          id: 'tmpl-lab-001',
          testName: 'HbA1c',
          indication: 'Diabetes monitoring',
          urgency: 'routine',
          status: 'ordered',
        },
        {
          id: 'tmpl-lab-002',
          testName: 'Comprehensive Metabolic Panel',
          indication: 'Kidney function monitoring',
          urgency: 'routine',
          status: 'ordered',
        },
      ],
      followUp: {
        timing: '3 months',
        reason: 'Diabetes management',
      },
    },
    createdBy: 'system',
    isShared: true,
    usageCount: 124,
  },
  {
    id: 'tmpl-004',
    name: 'Hypertension Follow-up',
    description: 'Template for HTN management visit',
    category: 'Chronic Disease',
    encounterClass: 'ambulatory',
    subjective: {
      chiefComplaint: 'Blood pressure follow-up',
      historyOfPresentIllness: 'Patient with essential hypertension presents for follow-up. Current medications: ___. Reports compliance with medications.',
    },
    objective: {
      physicalExam: {
        general: '',
        heart: '',
        lungs: '',
      },
    },
    assessment: {
      clinicalImpression: 'Essential hypertension',
      diagnoses: [
        {
          id: 'tmpl-dx-002',
          code: 'I10',
          codeSystem: 'ICD-10',
          description: 'Essential (primary) hypertension',
          type: 'primary',
          status: 'active',
        },
      ],
    },
    plan: {
      treatmentPlan: 'Continue antihypertensive therapy. Lifestyle modifications reinforced.',
      followUp: {
        timing: '3 months',
        reason: 'Blood pressure management',
      },
    },
    createdBy: 'system',
    isShared: true,
    usageCount: 98,
  },
  {
    id: 'tmpl-005',
    name: 'Well Child - Pediatric',
    description: 'Template for pediatric wellness visit',
    category: 'Preventive',
    encounterClass: 'ambulatory',
    subjective: {
      chiefComplaint: 'Well child visit',
      historyOfPresentIllness: 'Child presents for routine well child examination.',
      socialHistory: 'Development: ___. School performance: ___.',
    },
    objective: {
      physicalExam: {
        general: 'Well-appearing child, active and alert',
        head: 'Normocephalic',
        eyes: 'Red reflex present bilaterally',
        ears: 'TMs clear',
        heart: 'RRR, no murmurs',
        lungs: 'CTA',
        abdomen: 'Soft, non-tender',
        extremities: 'Full ROM, normal gait',
        neurological: 'Age-appropriate development',
      },
    },
    plan: {
      treatmentPlan: 'Age-appropriate immunizations administered. Anticipatory guidance provided.',
      followUp: {
        timing: 'Per schedule',
        reason: 'Well child visit',
      },
    },
    createdBy: 'system',
    isShared: true,
    usageCount: 67,
  },
];
