import { InternalNote } from '../../models/internal-note.model';

export const MOCK_INTERNAL_NOTES: InternalNote[] = [
  // -----------------------------------------------------------------------
  // Safety – pinned fall-risk alert
  // -----------------------------------------------------------------------
  {
    id: 'INT-001',
    patientId: 'PAT-001',
    title: 'FALL RISK – High Risk Assessment',
    content: `## Fall Risk Alert

**Assessment Date:** 2026-02-10
**Risk Level:** HIGH (Morse Fall Scale: 65)

### Contributing Factors
- History of falls in past 6 months (2 documented falls)
- Secondary diagnosis: Peripheral neuropathy, Type 2 DM
- Gait/Transfer impairment: requires assistive device (walker)
- Current medications with fall risk: Metoprolol 25 mg, Gabapentin 300 mg TID

### Active Precautions in Place
- [ ] Yellow "FALL RISK" armband applied
- [ ] Bed alarm activated (low position)
- [ ] Non-slip footwear ordered
- [ ] Call light within reach and patient instructed
- [ ] Hourly rounding documented

### Instructions for All Staff
> Do **not** leave patient unattended during transfers. Two-person assist required for ambulation. PT consulted 2026-02-10.

**Review by:** Charge RN each shift.`,
    category: 'safety',
    visibility: 'all-staff',
    tags: ['fall-risk', 'morse-scale', 'precautions', 'urgent'],
    isPinned: true,
    isArchived: false,
    authorId: 'USR-003',
    authorName: 'RN Maria Lopez',
    authorRole: 'Charge Nurse',
    version: 2,
    versions: [
      {
        version: 1,
        content: '## Fall Risk Alert\n\nInitial fall risk assessment documented. Morse Fall Scale 55 – Moderate risk. Standard precautions initiated.',
        title: 'Fall Risk Assessment – Initial',
        editedBy: 'USR-003',
        editedByName: 'RN Maria Lopez',
        editedAt: '2026-02-10T08:15:00.000Z',
      },
      {
        version: 2,
        content: `## Fall Risk Alert\n\n**Assessment Date:** 2026-02-10\n**Risk Level:** HIGH (Morse Fall Scale: 65)\n\n### Contributing Factors\n- History of falls in past 6 months (2 documented falls)\n- Secondary diagnosis: Peripheral neuropathy, Type 2 DM\n- Gait/Transfer impairment: requires assistive device (walker)\n- Current medications with fall risk: Metoprolol 25 mg, Gabapentin 300 mg TID\n\n### Active Precautions in Place\n- [ ] Yellow "FALL RISK" armband applied\n- [ ] Bed alarm activated (low position)\n- [ ] Non-slip footwear ordered\n- [ ] Call light within reach and patient instructed\n- [ ] Hourly rounding documented\n\n### Instructions for All Staff\n> Do **not** leave patient unattended during transfers. Two-person assist required for ambulation. PT consulted 2026-02-10.\n\n**Review by:** Charge RN each shift.`,
        title: 'FALL RISK – High Risk Assessment',
        editedBy: 'USR-003',
        editedByName: 'RN Maria Lopez',
        editedAt: '2026-02-12T14:30:00.000Z',
        changeDescription: 'Upgraded to HIGH risk after second fall; added PT consult and updated precaution checklist.',
      },
    ],
    createdAt: '2026-02-10T08:15:00.000Z',
    updatedAt: '2026-02-12T14:30:00.000Z',
    readCount: 14,
    lastReadBy: ['USR-001', 'USR-002', 'USR-003'],
  },

  // -----------------------------------------------------------------------
  // Social – discharge planning assessment
  // -----------------------------------------------------------------------
  {
    id: 'INT-002',
    patientId: 'PAT-001',
    title: 'Social Work Discharge Planning Assessment',
    content: `## Discharge Planning Assessment

**Social Worker:** Lisa Nguyen, MSW
**Assessment Date:** 2026-02-14

### Living Situation
Patient lives alone in a second-floor apartment (no elevator). Adult daughter (Elena Martinez, 555-0198) lives 10 minutes away and is **willing to assist** during recovery period.

### Discharge Barriers Identified
1. **Transportation** – no personal vehicle; daughter works weekdays
2. **Home environment** – stairs at entrance; bathroom not equipped with grab bars
3. **Financial** – limited copay capacity; see separate financial note

### Recommendations
- **Home Health referral** submitted 2026-02-14 (pending insurance auth)
- PT/OT home evaluation recommended prior to discharge
- DME order placed: walker, shower chair, grab-bar installation referral
- Follow-up appointment scheduled within 7 days of discharge

### Patient Goals
> Patient verbalized desire to return home and remain independent. Receptive to home health services.

### Next Steps
- [ ] Confirm home health agency acceptance
- [ ] Coordinate with insurance for DME coverage
- [ ] Family meeting scheduled 2026-02-17 at 10:00 AM`,
    category: 'social',
    visibility: 'clinical-only',
    tags: ['discharge-planning', 'home-health', 'DME', 'transportation'],
    isPinned: false,
    isArchived: false,
    authorId: 'USR-004',
    authorName: 'Lisa Nguyen, MSW',
    authorRole: 'Social Worker',
    version: 1,
    versions: [
      {
        version: 1,
        content: '## Discharge Planning Assessment\n\n**Social Worker:** Lisa Nguyen, MSW\n**Assessment Date:** 2026-02-14\n\n[Full content as above]',
        title: 'Social Work Discharge Planning Assessment',
        editedBy: 'USR-004',
        editedByName: 'Lisa Nguyen, MSW',
        editedAt: '2026-02-14T11:00:00.000Z',
      },
    ],
    createdAt: '2026-02-14T11:00:00.000Z',
    updatedAt: '2026-02-14T11:00:00.000Z',
    readCount: 5,
    lastReadBy: ['USR-001', 'USR-004'],
  },

  // -----------------------------------------------------------------------
  // Financial – insurance authorization (admin-only)
  // -----------------------------------------------------------------------
  {
    id: 'INT-003',
    patientId: 'PAT-001',
    title: 'Insurance Authorization & Financial Assistance Notes',
    content: `## Insurance Authorization Status

**Primary Payer:** Blue Cross Blue Shield PPO (Group: 78432)
**Member ID:** BCBS-00291847
**Authorization Coordinator:** Patricia Yuen (Ext. 4521)

### Current Authorizations

| Service | Auth # | Status | Expires |
|---------|--------|--------|---------|
| Inpatient Acute | AUTH-2026-8832 | **Approved** | 2026-02-28 |
| Home Health (30 days) | AUTH-2026-8901 | **Pending** | – |
| PT (12 visits) | AUTH-2026-8780 | **Approved** | 2026-04-30 |
| DME – Walker | AUTH-2026-8901 | **Pending** | – |

### Financial Assistance
Patient applied for **Charity Care Program** (Application #CC-2026-0041). Income verification documents received 2026-02-13. Decision expected within 5 business days.

**Estimated patient responsibility:** $1,450 (deductible remaining: $900, 20% coinsurance on remaining)

### Outstanding Items
- Home health auth denial appeal prepared if needed (template in shared drive)
- Financial counselor meeting scheduled 2026-02-18

### Notes
> Do not discuss financial assistance application with patient until decision is received. Patient expressed anxiety about cost during last encounter.`,
    category: 'financial',
    visibility: 'admin-only',
    tags: ['insurance', 'authorization', 'charity-care', 'BCBS'],
    isPinned: false,
    isArchived: false,
    authorId: 'USR-005',
    authorName: 'Patricia Yuen',
    authorRole: 'Authorization Coordinator',
    version: 1,
    versions: [
      {
        version: 1,
        content: '## Insurance Authorization Status\n\nInitial authorization notes created.',
        title: 'Insurance Authorization & Financial Assistance Notes',
        editedBy: 'USR-005',
        editedByName: 'Patricia Yuen',
        editedAt: '2026-02-13T09:00:00.000Z',
      },
    ],
    createdAt: '2026-02-13T09:00:00.000Z',
    updatedAt: '2026-02-13T09:00:00.000Z',
    readCount: 3,
    lastReadBy: ['USR-005'],
  },

  // -----------------------------------------------------------------------
  // Behavioral – PHQ-9 / behavioral health screening (clinical-only)
  // -----------------------------------------------------------------------
  {
    id: 'INT-004',
    patientId: 'PAT-001',
    title: 'Behavioral Health Screening – PHQ-9 & GAD-7',
    content: `## Behavioral Health Screening Results

**Administered by:** Dr. Sarah Chen, MD
**Screening Date:** 2026-02-11
**Tools Used:** PHQ-9, GAD-7, AUDIT-C

---

### PHQ-9 – Depression Screening
**Total Score: 12 / 27 – Moderate Depression**

| Item | Score |
|------|-------|
| Little interest or pleasure in doing things | 2 |
| Feeling down, depressed, or hopeless | 2 |
| Trouble falling/staying asleep | 2 |
| Feeling tired or having little energy | 2 |
| Poor appetite or overeating | 1 |
| Feeling bad about yourself | 1 |
| Trouble concentrating | 1 |
| Moving/speaking slowly or being fidgety | 0 |
| Thoughts of self-harm | **1** |

> **Suicide Risk Note:** Item 9 scored 1 ("Several days"). Safety assessment completed – patient denies active ideation or plan. Safety plan discussed and documented in encounter note. Psychiatry consult placed.

### GAD-7 – Anxiety Screening
**Total Score: 8 / 21 – Mild Anxiety**

### AUDIT-C – Alcohol Use
**Score: 2 / 12** – Low risk; social alcohol use 1–2 times/month.

### Clinical Impression
Moderate depression with anxiety features likely attributable to chronic pain (peripheral neuropathy) and social stressors (living alone, financial strain). Recommend:
1. Psychiatry consult (ordered 2026-02-11, scheduled 2026-02-20)
2. Consider SSRI if psychiatry concurs
3. Referral to behavioral health counseling

**Repeat PHQ-9 at next visit.**`,
    category: 'behavioral',
    visibility: 'clinical-only',
    tags: ['PHQ-9', 'GAD-7', 'depression', 'behavioral-health', 'psychiatry-consult'],
    isPinned: false,
    isArchived: false,
    authorId: 'USR-001',
    authorName: 'Dr. Sarah Chen',
    authorRole: 'Attending Physician',
    version: 1,
    versions: [
      {
        version: 1,
        content: '## Behavioral Health Screening Results\n\nPHQ-9: 12 (Moderate). GAD-7: 8 (Mild). Safety assessment completed. Psychiatry consult ordered.',
        title: 'Behavioral Health Screening – PHQ-9 & GAD-7',
        editedBy: 'USR-001',
        editedByName: 'Dr. Sarah Chen',
        editedAt: '2026-02-11T16:45:00.000Z',
      },
    ],
    createdAt: '2026-02-11T16:45:00.000Z',
    updatedAt: '2026-02-11T16:45:00.000Z',
    readCount: 4,
    lastReadBy: ['USR-001', 'USR-002'],
  },

  // -----------------------------------------------------------------------
  // Clinical – versioned note (3 versions)
  // -----------------------------------------------------------------------
  {
    id: 'INT-005',
    patientId: 'PAT-001',
    title: 'Care Team Communication – Wound Care Protocol',
    content: `## Wound Care Protocol – Right Lower Leg Ulcer

**Last Updated:** 2026-02-16 by Wound Care Nurse, Janet Park RN

### Wound Assessment (2026-02-16)
- **Location:** Right medial malleolus
- **Size:** 2.3 cm × 1.8 cm (improving from 2.8 × 2.1 on 2026-02-10)
- **Depth:** Partial thickness; no undermining
- **Wound bed:** 80% granulation, 20% slough (improved)
- **Periwound:** Intact; mild erythema resolving
- **Exudate:** Serosanguineous, moderate

### Current Dressing Protocol
1. Cleanse with Normal Saline
2. Apply Mepilex Border Ag (silver-containing foam dressing)
3. Change every **3 days** or if saturated
4. Compression: 2-layer compression bandage (Coban 2) – apply by wound care RN

### Precautions
> **Do not** remove compression without wound care RN present. Patient on leg elevation protocol – head of bed ≤ 30°, legs elevated when in bed.

### Progress Summary
| Date | Size | Notes |
|------|------|-------|
| 2026-02-08 | 3.1 × 2.4 | Initial assessment, started protocol |
| 2026-02-10 | 2.8 × 2.1 | 10% reduction, slough decreasing |
| 2026-02-13 | 2.5 × 2.0 | Continued improvement |
| 2026-02-16 | 2.3 × 1.8 | Good progress; maintain current protocol |

**Next wound care nurse visit:** 2026-02-19`,
    category: 'clinical',
    visibility: 'clinical-only',
    tags: ['wound-care', 'ulcer', 'compression', 'protocol'],
    isPinned: false,
    isArchived: false,
    authorId: 'USR-006',
    authorName: 'Janet Park, RN',
    authorRole: 'Wound Care Nurse',
    version: 3,
    versions: [
      {
        version: 1,
        content: '## Wound Care Protocol\n\nInitial wound assessment completed 2026-02-08. Right medial malleolus ulcer, 3.1 × 2.4 cm. Starting Mepilex Border Ag with compression therapy.',
        title: 'Wound Care Protocol – Initial Assessment',
        editedBy: 'USR-006',
        editedByName: 'Janet Park, RN',
        editedAt: '2026-02-08T10:00:00.000Z',
      },
      {
        version: 2,
        content: '## Wound Care Protocol Update\n\nWound reducing well. 2026-02-10: 2.8 × 2.1 cm. Slough decreasing. Dressing changed on schedule. Continue protocol.',
        title: 'Wound Care Protocol – Week 1 Update',
        editedBy: 'USR-006',
        editedByName: 'Janet Park, RN',
        editedAt: '2026-02-10T11:30:00.000Z',
        changeDescription: 'Updated measurements from 2026-02-10 assessment; documented improvement.',
      },
      {
        version: 3,
        content: '## Wound Care Protocol – Right Lower Leg Ulcer\n\n[Full updated content with progress table]',
        title: 'Care Team Communication – Wound Care Protocol',
        editedBy: 'USR-006',
        editedByName: 'Janet Park, RN',
        editedAt: '2026-02-16T09:15:00.000Z',
        changeDescription: 'Comprehensive update: added progress table, updated measurements to 2026-02-16, refined dressing instructions.',
      },
    ],
    createdAt: '2026-02-08T10:00:00.000Z',
    updatedAt: '2026-02-16T09:15:00.000Z',
    readCount: 9,
    lastReadBy: ['USR-001', 'USR-003', 'USR-006'],
  },

  // -----------------------------------------------------------------------
  // Legal – advance directive status
  // -----------------------------------------------------------------------
  {
    id: 'INT-006',
    patientId: 'PAT-001',
    title: 'Advance Directive & Legal Documents Status',
    content: `## Advance Directive Documentation

**Patient:** John Smith (MRN-001)
**Document Review Date:** 2026-02-09
**Reviewed By:** Dr. Sarah Chen, MD

### Document Status

| Document | Status | Date Executed | Location |
|----------|--------|---------------|----------|
| Healthcare Power of Attorney | **On File** | 2023-06-15 | EMR Legal → Documents |
| Living Will / Advance Directive | **On File** | 2023-06-15 | EMR Legal → Documents |
| POLST Form | **On File** | 2025-11-01 | EMR Legal → Documents |
| DNR Order | Not applicable | – | – |

### POLST Summary (2025-11-01)
- **Section A (CPR):** Attempt resuscitation / CPR
- **Section B (Medical Interventions):** Full treatment
- **Section C (Artificially Administered Nutrition):** Long-term artificial nutrition if unable to eat

### Healthcare Agent (HCPOA)
**Primary Agent:** Elena Martinez (daughter)
- Phone: 555-0198
- Relationship: Adult daughter

**Alternate Agent:** Robert Smith (son)
- Phone: 555-0199
- Relationship: Adult son

### Important Notes
> Patient has reviewed and reaffirmed directive preferences during this admission. Copies scanned into chart. Original documents held by patient's attorney – contact via Elena Martinez if needed.

**Flag:** Patient expressed concern about intubation preferences — see encounter note 2026-02-09 for detailed goals-of-care conversation documentation.`,
    category: 'legal',
    visibility: 'all-staff',
    tags: ['advance-directive', 'POLST', 'HCPOA', 'legal', 'goals-of-care'],
    isPinned: false,
    isArchived: false,
    authorId: 'USR-001',
    authorName: 'Dr. Sarah Chen',
    authorRole: 'Attending Physician',
    version: 1,
    versions: [
      {
        version: 1,
        content: '## Advance Directive Documentation\n\nAll advance directive documents verified on file. POLST reviewed and current. HCPOA: Elena Martinez (daughter).',
        title: 'Advance Directive & Legal Documents Status',
        editedBy: 'USR-001',
        editedByName: 'Dr. Sarah Chen',
        editedAt: '2026-02-09T13:00:00.000Z',
      },
    ],
    createdAt: '2026-02-09T13:00:00.000Z',
    updatedAt: '2026-02-09T13:00:00.000Z',
    readCount: 7,
    lastReadBy: ['USR-001', 'USR-002', 'USR-003'],
  },

  // -----------------------------------------------------------------------
  // Administrative – care coordination
  // -----------------------------------------------------------------------
  {
    id: 'INT-007',
    patientId: 'PAT-001',
    title: 'Care Coordination – Specialist Referrals & Follow-up',
    content: `## Care Coordination Notes

**Case Manager:** Rebecca Torres, RN, CCM
**Updated:** 2026-02-15

### Active Referrals

| Specialty | Provider | Status | Appointment |
|-----------|----------|--------|-------------|
| Psychiatry | Dr. Kevin Park, MD | Scheduled | 2026-02-20 @ 2:00 PM |
| Wound Care | Janet Park, RN | Active – inpatient | Ongoing |
| Physical Therapy | Sarah Williams, DPT | Active – inpatient | Daily |
| Vascular Surgery | Dr. James Rivera, MD | Pending | TBD (auth needed) |
| Endocrinology | Dr. Priya Patel, MD | Requested | 2026-03-05 @ 10:30 AM |
| Ophthalmology | Dr. Alan Kim, MD | Requested | 2026-03-12 @ 9:00 AM |

### Post-Discharge Follow-up Plan
- **PCP (Dr. Sarah Chen):** 7 days post-discharge
- **Wound Care Clinic:** 3 days post-discharge
- **Endocrinology:** 2026-03-05 (existing appointment)
- **Lab work:** BMP, HbA1c, CBC at 2-week follow-up

### Discharge Criteria (must all be met)
- [ ] Wound size stable or improving for 48h
- [ ] Blood glucose controlled (target 140–180 mg/dL)
- [ ] Home health confirmed and scheduled
- [ ] Patient and caregiver education complete
- [ ] Transportation arranged

### Communication Log
- **2026-02-14:** Called Elena Martinez; confirmed availability for family meeting 2026-02-17.
- **2026-02-15:** Spoke with vascular surgery scheduler; auth pending.
- **2026-02-15:** Home health agency (CareFirst) confirmed case accepted pending auth.`,
    category: 'administrative',
    visibility: 'all-staff',
    tags: ['care-coordination', 'referrals', 'follow-up', 'discharge-criteria'],
    isPinned: false,
    isArchived: false,
    authorId: 'USR-007',
    authorName: 'Rebecca Torres, RN, CCM',
    authorRole: 'Case Manager',
    version: 2,
    versions: [
      {
        version: 1,
        content: '## Care Coordination Notes\n\nInitial referral tracking established. Psychiatry and PT referrals placed.',
        title: 'Care Coordination – Specialist Referrals',
        editedBy: 'USR-007',
        editedByName: 'Rebecca Torres, RN, CCM',
        editedAt: '2026-02-11T15:00:00.000Z',
      },
      {
        version: 2,
        content: '## Care Coordination Notes\n\n[Updated with full referral table and discharge criteria]',
        title: 'Care Coordination – Specialist Referrals & Follow-up',
        editedBy: 'USR-007',
        editedByName: 'Rebecca Torres, RN, CCM',
        editedAt: '2026-02-15T16:30:00.000Z',
        changeDescription: 'Added vascular surgery, endocrinology, ophthalmology referrals; documented post-discharge follow-up plan; added discharge criteria checklist.',
      },
    ],
    createdAt: '2026-02-11T15:00:00.000Z',
    updatedAt: '2026-02-15T16:30:00.000Z',
    readCount: 11,
    lastReadBy: ['USR-001', 'USR-003', 'USR-004', 'USR-007'],
  },

  // -----------------------------------------------------------------------
  // Archived social note – older housing situation note
  // -----------------------------------------------------------------------
  {
    id: 'INT-008',
    patientId: 'PAT-001',
    title: 'Previous Housing Instability Note (Resolved)',
    content: `## Housing Assessment – Resolved

**Assessment Date:** 2025-10-15
**Social Worker:** David Kim, MSW

Patient was experiencing temporary housing instability due to building repairs. Has since returned to primary residence. No active housing concerns as of 2025-12-01.

**Archived** – situation resolved at prior admission. Retained for historical reference.`,
    category: 'social',
    visibility: 'clinical-only',
    tags: ['housing', 'social-determinants', 'resolved'],
    isPinned: false,
    isArchived: true,
    authorId: 'USR-008',
    authorName: 'David Kim, MSW',
    authorRole: 'Social Worker',
    version: 1,
    versions: [
      {
        version: 1,
        content: '## Housing Assessment – Resolved\n\nPatient housing instability resolved. Archived for reference.',
        title: 'Previous Housing Instability Note (Resolved)',
        editedBy: 'USR-008',
        editedByName: 'David Kim, MSW',
        editedAt: '2025-12-01T10:00:00.000Z',
      },
    ],
    createdAt: '2025-10-15T09:00:00.000Z',
    updatedAt: '2025-12-01T10:00:00.000Z',
    readCount: 2,
    lastReadBy: ['USR-004'],
  },
];
