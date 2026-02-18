# EMR Dream Features (Community Wishlist)

Source: Reddit community feedback
Date collected: 2026-02-18
Last audited: 2026-02-18

---

## 1. Staff-Only Internal Notes (Wiki-Style)

**Problem:** Charts are optimized for billing, not for clinical communication. Staff need a way to communicate "what's actually going on" without it becoming part of the legal/billing record.

**Feature:**
- A free-text, staff-only commentary field per patient — separate from the official chart
- Wiki-style implementation with full edit history and versioning
- Visible only to clinical staff, not included in billing or legal discovery
- Track who edited what and when (audit trail)

**Status:** :yellow_circle: Partial

**What exists:**
- Prescriptions have an `internalNotes` field labeled "Internal Notes (Not sent to pharmacy)" — `prescription.model.ts:266`
- Encounters have an `additionalNotes` textarea — `encounter.model.ts:273`

**What's missing:**
- No wiki-style versioning or edit history
- No staff-only access controls or visibility restrictions
- No dedicated UI section separating internal commentary from official chart
- No audit trail for note edits

---

## 2. OTC vs Prescription Medication Separation

**Problem:** OTC meds, supplements, and prescription meds are all in one flat list. When a patient takes 47 supplements (half entered as "close enough" matches), finding the 2 actual Rx meds is a nightmare. Duplicate/phantom entries (e.g., multiple "diabetic pen needles") add clutter.

**Feature:**
- Separate medication lists: **Rx Medications** vs **OTC / Supplements**
- Visual distinction (color, section headers, tabs)
- Deduplication logic to flag or merge duplicate entries
- "Verified" vs "Patient-reported" tagging for OTC entries

**Status:** :red_circle: Not implemented

**What exists:**
- Medication model has `isGeneric`, `isControlled`, `controlledSchedule`, and `formularyStatus` — but no `isOTC` or `medicationType` field
- All 12 mock medications are Rx drugs; zero OTC/supplement entries
- Prescription list filters by status and controlled-substance only

**What's missing:**
- No `medicationType` field (`rx` | `otc` | `supplement` | `herbal`) in the model
- No separate lists, tabs, or visual separation for OTC vs Rx
- No deduplication logic
- No OTC/supplement mock data

---

## 3. Intelligent Semantic Search

**Problem:** Search only matches exact terms. Typing "zoster" should also surface "shingles," "herpes zoster," "VZV," etc.

**Feature:**
- Synonym-aware search across diagnoses, medications, procedures, and notes
- Medical ontology integration (SNOMED CT, ICD-10 relationships)
- Fuzzy matching for typos and partial terms
- Ranked relevance results (Google-quality search experience)

**Status:** :red_circle: Not implemented

**What exists:**
- Global search bar in shell header — but it's a non-functional placeholder (no event handlers)
- Every domain service uses basic `toLowerCase().includes()` matching (patients, encounters, prescriptions, billing, messaging)
- PrimeNG `AutoCompleteModule` imported in several components but only does exact substring filtering

**What's missing:**
- No fuzzy matching, Levenshtein distance, or trigram algorithms
- No synonym resolution or medical ontology integration
- No SNOMED CT or ICD-10 relationship mapping
- No relevance ranking
- No fuzzy search library installed (e.g., `fuse.js`)

---

## 4. Unified External Data View

**Problem:** Outside labs and external notes are buried under extra tabs, requiring multiple clicks to find critical incoming data.

**Feature:**
- Auto-populate external labs and notes into the main patient timeline
- Inline display alongside internal results (clearly labeled as external)
- Notification/badge when new external data arrives
- No extra tab navigation required — surfaced contextually

**Status:** :red_circle: Not implemented

**What exists:**
- Individual domain timelines (lab order lifecycle, imaging order lifecycle, appointment status)
- `UserType` includes `'external'` in admin model; `ParticipantType` includes `'external'` in messaging
- Dashboard has a "Recent Activity" feed with activity types (encounter, prescription, lab, appointment)

**What's missing:**
- No mechanism for importing or displaying external lab results
- No unified cross-domain patient timeline
- No external data source integration (no FHIR/HL7 active implementation)
- No incoming data notifications

---

## 5. Smart Test Expiration Defaults

**Problem:** Test expiration dates require manual entry every time, creating unnecessary friction.

**Feature:**
- Default expiration date set to 1 year from order date
- Configurable per test type (some tests may need different defaults)
- Visual warning when tests are approaching or past expiration

**Status:** :red_circle: Not implemented

**What exists:**
- Prescriptions have `validFrom`, `validUntil`, and `expirationDate` fields with expiration checking — `prescription.model.ts:237-243`
- Lab and imaging models track lifecycle dates (ordered, collected, received, reported)

**What's missing:**
- No `expirationDate` or `validUntil` on lab or imaging order models
- No default expiration calculation (e.g., 1 year from order)
- No expiration warnings for test orders

---

## 6. Shared Order Panels

**Problem:** Clinicians build useful custom order panels but have no way to share them with colleagues.

**Feature:**
- Ability to publish personal order panels to a shared library
- Browse, search, and clone panels created by others
- Version control — original author can update, subscribers get notified
- Department-level and institution-level panel sharing

**Status:** :yellow_circle: Partial

**What exists:**
- Lab Orders component has an "Order Set Library" with 3 predefined sets (New Patient Workup, Pre-Op Clearance, Diabetes Follow-up) — `lab-orders.component.ts:1576`
- 5 predefined lab panels (Annual Wellness, Diabetes Management, Cardiac, Thyroid, Coagulation) — `lab-orders.component.ts:1568`
- `LabPanel` interface with full model (id, code, name, tests, pricing, fasting, etc.) — `lab.model.ts:145-162`
- `COMMON_PANELS` constant with 15 predefined panel codes — `lab.model.ts:292-308`
- Lab service has `searchPanels()`, `getPanel()`, `getCommonPanels()` methods

**What's missing:**
- No user-created custom panels — all panels are predefined/static
- No sharing mechanism between providers
- No publish/subscribe model
- No version control on panels
- No department or institution-level sharing

---

## 7. Markdown Support in Notes

**Problem:** Clinical notes are plain text with no formatting, making them harder to read and organize.

**Feature:**
- Markdown rendering in clinical notes (headings, bold, lists, tables)
- Live preview while typing
- Backward-compatible — plain text still works
- Export/print retains formatting

**Status:** :red_circle: Not implemented

**What exists:**
- PrimeNG `EditorModule` (Quill-based rich text) is imported in `clinical-notes.component.ts` — but **never used in the template**
- All note sections (Chief Complaint, Subjective, Objective, Assessment, Plan) use plain `<textarea>` elements
- Content stored as plain strings with `white-space: pre-wrap` for basic formatting

**What's missing:**
- No markdown library installed (`marked`, `ngx-markdown`, `markdown-it`, etc.)
- No rich-text or markdown rendering
- No live preview
- `EditorModule` import is dead code — `<p-editor>` never rendered

---

## 8. Visual Note Attribution & Role-Based Theming

**Problem:** In complex admissions (e.g., level-1 trauma, 5-day stay), there can be 100+ notes. It's extremely difficult to tell who wrote what at a glance.

**Feature:**
- Color-coded notes by role:
  - **Attending** | **Resident** | **NP/PA** | **Nurse** | **RT** | **PT/OT** | **SLP** | **Nutrition** | **Case Management / SW**
- Thumbnail icons per specialty:
  - Surgical specialties: scalpel + organ (eye, brain, bone, etc.)
  - Medical specialties: stethoscope + organ (heart, brain, lungs, etc.)
- Filter/sort notes by author role or specialty
- Compact timeline view with visual role indicators

**Status:** :yellow_circle: Partial

**What exists:**
- Notes have `author` and `authorId` fields — `clinical-notes.component.ts:41-42`
- Color-coding exists but by **note type**, not role (SOAP=blue, Progress=green, H&P=amber, Consultation=pink, Procedure=purple, Discharge=red)
- Avatar component generates consistent colors per user name — `avatar.component.ts:226-236`
- Status badge component with severity variants (success, warning, error, info)
- Admin model has `specialty` field on users and a role/permission system

**What's missing:**
- No role-based color coding (Attending vs Resident vs Nurse, etc.)
- No specialty thumbnail icons (scalpel+organ, stethoscope+organ)
- No filtering/sorting by author role — only by note type
- No role-to-color mapping system

---

## 9. Custom Printable Rounding Sheets

**Problem:** Clinicians hand-write rounding sheets every morning because there's no way to compile patient data (labs, vitals, meds) into a custom printable format.

**Feature:**
- Configurable rounding sheet template builder (drag-and-drop fields)
- One-click "Print Rounding Sheet" compiles latest data for all patients on the list
- Customizable per user — choose which labs, vitals, meds, and notes to include
- Batch generation for entire patient panel (e.g., 25 patients at once)
- PDF and print-optimized output

**Status:** :yellow_circle: Partial

**What exists:**
- Report Builder component with a 5-step wizard (data source, field selection, filters, sorting, preview) — `report-builder.component.ts`
- Reports service with `exportReport()` supporting PDF, Excel, CSV formats — `reports.service.ts`
- Report types include Patient List, Appointment, Encounter, Revenue, Claims, Provider Productivity
- IPD Dashboard has ward management with patient lists and discharge tracking
- Report scheduling support with automated generation

**What's missing:**
- No dedicated "Rounding Sheet" template or component
- No drag-and-drop template builder for clinical rounding
- No one-click "Print Rounding Sheet" with auto-compiled labs/vitals/meds
- No batch print for an entire patient panel
- Report builder is generic — not tailored for morning rounding workflow

---

## 10. Automated Patient Timeline & Problem-Based History

**Problem:** EMRs force problem-based planning with checkboxes, but don't synthesize that data into a coherent timeline. Reconstructing "what actually happened" requires reading dozens of notes.

**Feature:**
- Auto-generated patient timeline showing:
  - When labs changed (with trend arrows)
  - When procedures were performed
  - When meds were started, adjusted, or stopped
  - Key nursing events and status changes
- Problem-oriented view: group timeline events by diagnosis/problem
- Visual timeline (Gantt-chart style) for hospitalizations
- AI-assisted summarization: "What happened in the last 24/48/72 hours?"

**Status:** :yellow_circle: Partial

**What exists:**
- PrimeNG `TimelineModule` used in lab detail, imaging detail, clinical notes, and dashboards
- Lab detail shows result trends with delta arrows (increasing/decreasing/stable) — `lab-detail.component.ts:250-268`
- Individual domain timelines: lab order lifecycle, imaging order lifecycle, appointment status history
- Patient model includes `problems: Problem[]` supporting problem-oriented views
- Dashboard "Recent Activity" feed with multi-domain activity types
- Audit service logs system events with timestamps

**What's missing:**
- No unified cross-domain patient timeline component
- No problem-oriented event grouping
- No Gantt-chart hospitalization view
- No AI-assisted summarization
- No dedicated timeline route or service
- Lab trends exist per-test but not aggregated across the patient journey

---

## Implementation Status Summary

| # | Feature | Status | Coverage |
|---|---------|--------|----------|
| 1 | Staff-Only Internal Notes | :yellow_circle: Partial | Basic `internalNotes` field on prescriptions only |
| 2 | OTC vs Rx Separation | :red_circle: None | No model or UI support |
| 3 | Semantic Search | :red_circle: None | Only `includes()` string matching |
| 4 | Unified External Data | :red_circle: None | No external data integration |
| 5 | Test Expiration Defaults | :red_circle: None | Only prescriptions have expiration |
| 6 | Shared Order Panels | :yellow_circle: Partial | Predefined panels exist, no sharing |
| 7 | Markdown in Notes | :red_circle: None | EditorModule imported but unused |
| 8 | Visual Note Attribution | :yellow_circle: Partial | Color-coded by note type, not by role |
| 9 | Custom Rounding Sheets | :yellow_circle: Partial | Generic report builder exists, no rounding-specific feature |
| 10 | Patient Timeline | :yellow_circle: Partial | Per-domain timelines, no unified view |

**Overall: 0/10 fully implemented | 5/10 have partial foundations | 5/10 not started**
