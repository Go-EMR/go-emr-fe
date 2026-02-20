# EMR Dream Features (Community Wishlist)

Source: Reddit community feedback
Date collected: 2026-02-18
Last audited: 2026-02-20

---

## 1. Staff-Only Internal Notes (Wiki-Style)

**Problem:** Charts are optimized for billing, not for clinical communication. Staff need a way to communicate "what's actually going on" without it becoming part of the legal/billing record.

**Feature:**
- A free-text, staff-only commentary field per patient — separate from the official chart
- Wiki-style implementation with full edit history and versioning
- Visible only to clinical staff, not included in billing or legal discovery
- Track who edited what and when (audit trail)

**Status:** :green_circle: Implemented

**Implementation:**
- New `InternalNote` model with version tracking, categories (clinical, admin, social, behavioral, financial, legal, safety), and visibility levels (all-staff, clinical-only, admin-only, author-only) — `patients/data-access/models/internal-note.model.ts`
- `InternalNotesService` with full CRUD, pin/archive, version history — `patients/data-access/services/internal-notes.service.ts`
- Full-featured `InternalNotesComponent` with "STAFF ONLY" banner, category/visibility filters, markdown editor with preview, version history timeline, pin/archive support — `patients/feature-internal-notes/internal-notes.component.ts`
- 8 realistic mock notes with diverse categories and version histories
- Accessible via "Internal Notes" tab (with lock icon) in patient detail
- Dark mode support throughout

---

## 2. OTC vs Prescription Medication Separation

**Problem:** OTC meds, supplements, and prescription meds are all in one flat list. When a patient takes 47 supplements (half entered as "close enough" matches), finding the 2 actual Rx meds is a nightmare. Duplicate/phantom entries (e.g., multiple "diabetic pen needles") add clutter.

**Feature:**
- Separate medication lists: **Rx Medications** vs **OTC / Supplements**
- Visual distinction (color, section headers, tabs)
- Deduplication logic to flag or merge duplicate entries
- "Verified" vs "Patient-reported" tagging for OTC entries

**Status:** :green_circle: Implemented

**Implementation:**
- Added `MedicationType` (`rx`|`otc`|`supplement`|`herbal`|`vitamin`) and `VerificationStatus` (`verified`|`patient-reported`|`unverified`) to `Medication` interface — `prescription.model.ts`
- 10 new OTC/supplement mock medications (Acetaminophen, Ibuprofen, Vitamin D3, Fish Oil, Calcium, Melatonin, Turmeric, Zinc, Probiotic, Magnesium) — `prescriptions.mock.ts`
- Three-tab filter (All / Rx Only / OTC & Supplements) with live count badges — `prescription-list.component.ts`
- Deduplication warning banner detecting medications with similar names
- Verification status badges (green=Verified, blue=Patient Reported, amber=Unverified)
- Medication type badges with distinct colors per type
- OTC cards have teal left border vs Rx pink border

---

## 3. Intelligent Semantic Search

**Problem:** Search only matches exact terms. Typing "zoster" should also surface "shingles," "herpes zoster," "VZV," etc.

**Feature:**
- Synonym-aware search across diagnoses, medications, procedures, and notes
- Medical ontology integration (SNOMED CT, ICD-10 relationships)
- Fuzzy matching for typos and partial terms
- Ranked relevance results (Google-quality search experience)

**Status:** :green_circle: Implemented

**Implementation:**
- Installed `fuse.js` for fuzzy matching
- 38 medical synonym groups covering cardiovascular, respiratory, endocrine, GI, neurological, musculoskeletal, mental health, renal, infectious, hematology, procedures, and medications with ICD-10 mappings — `shared/data/medical-synonyms.ts`
- `SemanticSearchService` with synonym expansion, Fuse.js weighted indexing, and score-based result merging — `core/services/semantic-search.service.ts`
- `GlobalSearchComponent` overlay with Ctrl+K shortcut, debounced search, grouped results (Patients, Encounters, Prescriptions, Labs, Imaging, Notes), synonym expansion pills, keyboard navigation, ARIA accessibility — `shell/feature-global-search/global-search.component.ts`
- Shell search bar wired to open global search overlay
- 24 seed searchable items across all domains

---

## 4. Unified External Data View

**Problem:** Outside labs and external notes are buried under extra tabs, requiring multiple clicks to find critical incoming data.

**Feature:**
- Auto-populate external labs and notes into the main patient timeline
- Inline display alongside internal results (clearly labeled as external)
- Notification/badge when new external data arrives
- No extra tab navigation required — surfaced contextually

**Status:** :green_circle: Implemented

**Implementation:**
- `ExternalDataRecord` model with 7 source types, 8 data types, review workflow (unreviewed→reviewed→acknowledged→incorporated), discrepancy tracking — `patients/data-access/models/external-data.model.ts`
- `ExternalDataService` with CRUD, review status management, unreviewed count — `patients/data-access/services/external-data.service.ts`
- 12 realistic mock records including critical labs, imaging reports, discharge summaries, pharmacy histories with discrepancies, wearable device data — `external-data.mock.ts`
- `ExternalDataComponent` with stats bar, source/type/status filters, timeline view with source-colored cards, detail panel with lab results table, medication list, review actions, discrepancy editor — `patients/feature-external-data/external-data.component.ts`
- Notification badge on "External Data" tab showing unreviewed count
- Urgent items with red glow, discrepancy items with amber warning

---

## 5. Smart Test Expiration Defaults

**Problem:** Test expiration dates require manual entry every time, creating unnecessary friction.

**Feature:**
- Default expiration date set to 1 year from order date
- Configurable per test type (some tests may need different defaults)
- Visual warning when tests are approaching or past expiration

**Status:** :green_circle: Implemented

**Implementation:**
- Added `expirationDate` to `LabOrder` and `ImagingOrder` interfaces
- `TEST_EXPIRATION_DEFAULTS` constant with per-test-type months (HbA1c=6mo, PT/INR=1mo, most=12mo) — `lab.model.ts`
- `IMAGING_EXPIRATION_DEFAULTS` per modality (mammography/DEXA=24mo, PET=6mo) — `imaging.model.ts`
- `calculateExpiration()` method in `LabService` auto-sets expiration on order creation
- Color-coded expiration column in lab list: green "Valid" (>90 days), amber "Expiring" (1-90 days), red "Expired" (<1 day)
- 8 mock lab orders and 5 mock imaging orders with diverse expiration states

---

## 6. Shared Order Panels

**Problem:** Clinicians build useful custom order panels but have no way to share them with colleagues.

**Feature:**
- Ability to publish personal order panels to a shared library
- Browse, search, and clone panels created by others
- Version control — original author can update, subscribers get notified
- Department-level and institution-level panel sharing

**Status:** :green_circle: Implemented

**Implementation:**
- `CustomLabPanel` interface extending `LabPanel` with sharing, usage tracking, versioning, tags, specialty — `lab.model.ts`
- Service methods: `getMyPanels()`, `getSharedPanels()`, `createCustomPanel()`, `publishPanel()`, `unpublishPanel()`, `clonePanel()`, `deleteCustomPanel()` — `lab.service.ts`
- 5 mock custom panels including private panels, shared panels with subscriber counts (up to 93 subscribers, 741 uses) — `labs.mock.ts`
- Enhanced Order Sets section in lab orders with 3 sub-tabs: Order Sets, My Panels, Shared Library
- Create Panel dialog with test selection, specialty dropdown, tags
- Publish/Unpublish, Clone, Delete actions with loading states
- Search across panel names, descriptions, tags, specialties

---

## 7. Markdown Support in Notes

**Problem:** Clinical notes are plain text with no formatting, making them harder to read and organize.

**Feature:**
- Markdown rendering in clinical notes (headings, bold, lists, tables)
- Live preview while typing
- Backward-compatible — plain text still works
- Export/print retains formatting

**Status:** :green_circle: Implemented (pre-existing)

**Implementation:**
- `MarkdownPipe` for rendering markdown to HTML
- Live preview toggle in clinical notes editor
- Markdown cheatsheet with formatting hints
- Full styling for rendered markdown (headings, lists, tables, code blocks)
- All implemented in `clinical-notes.component.ts`

---

## 8. Visual Note Attribution & Role-Based Theming

**Problem:** In complex admissions (e.g., level-1 trauma, 5-day stay), there can be 100+ notes. It's extremely difficult to tell who wrote what at a glance.

**Feature:**
- Color-coded notes by role:
  - **Attending** | **Resident** | **NP/PA** | **Nurse** | **RT** | **PT/OT** | **SLP** | **Nutrition** | **Case Management / SW**
- Thumbnail icons per specialty
- Filter/sort notes by author role or specialty
- Compact timeline view with visual role indicators

**Status:** :green_circle: Implemented

**Implementation:**
- `ClinicalRole` type with 15 roles (attending, resident, fellow, intern, nurse, NP, PA, RT, PT, OT, pharmacist, social worker, dietitian, psychologist, case manager) — `clinical-notes.component.ts`
- `ROLE_COLORS` map with light/dark mode color tokens for each role
- `ROLE_LABELS` with human-readable display names
- `authorRole` and `authorSpecialty` added to `ClinicalNote` interface
- 10 mock notes with diverse roles replacing the original 3
- Role-based color coding on note icon squares and note cards
- Role badge pills on each note in list and detail views
- Role filter dropdown alongside existing type filter
- Dark mode support with automatic palette switching via `themeService.isDarkMode()`

---

## 9. Custom Printable Rounding Sheets

**Problem:** Clinicians hand-write rounding sheets every morning because there's no way to compile patient data (labs, vitals, meds) into a custom printable format.

**Feature:**
- Configurable rounding sheet template builder (drag-and-drop fields)
- One-click "Print Rounding Sheet" compiles latest data for all patients on the list
- Customizable per user — choose which labs, vitals, meds, and notes to include
- Batch generation for entire patient panel (e.g., 25 patients at once)
- PDF and print-optimized output

**Status:** :green_circle: Implemented

**Implementation:**
- Full type system: `RoundingSheetTemplate`, `RoundingSheetSection`, `RoundingSheetField` with 10 field types, `PatientRoundingData`, `RoundingSheet` — `reports/data-access/models/rounding-sheet.model.ts`
- `RoundingSheetService` with template CRUD, sheet CRUD, batch operations, PDF export — `reports/data-access/services/rounding-sheet.service.ts`
- 3 complete templates: General Medicine (24 fields), ICU Daily Assessment (36 fields), Surgical Service (7 sections)
- 2 pre-filled mock sheets with realistic patient data
- `RoundingSheetsComponent` with 3 views:
  - **Sheet Manager**: Template cards, active/completed sheets with progress bars
  - **Template Builder**: Drag-and-drop section/field reordering via Angular CDK, field type configuration, data source binding
  - **Sheet Viewer**: Editable patient table with inline field editing, section headers
- Print-optimized `@media print` styles with page breaks
- Accessible via Reports > Rounding Sheets in sidebar navigation

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
- Visual timeline for hospitalizations
- Summarization of recent events

**Status:** :green_circle: Implemented

**Implementation:**
- `TimelineEvent` model with 9 domains (encounter, lab, imaging, prescription, note, vital, procedure, referral, external), trend arrows, problem codes — `patients/data-access/models/timeline.model.ts`
- `TimelineService` aggregating cross-domain data with 29 mock events spanning 6 months — `patients/data-access/services/timeline.service.ts`
- `PatientTimelineComponent` with:
  - Time range quick filters (7d, 30d, 3m, 6m, 1y, All)
  - Domain toggle chips with counts and All/None shortcuts
  - Grouping by day/week/month/problem
  - Sort order toggle (newest/oldest first)
  - Abnormal-only filter and search
  - Alternating left/right vertical timeline with domain-colored dots
  - Lab values with trend arrows (↑↓→) and semantic colors
  - Problem tag chips, critical/abnormal badges, status indicators
  - Click-through to source records
- Accessible via "Timeline" tab (second position) in patient detail

---

## Implementation Status Summary

| # | Feature | Status | Coverage |
|---|---------|--------|----------|
| 1 | Staff-Only Internal Notes | :green_circle: Complete | Wiki-style with version history, categories, visibility, audit trail |
| 2 | OTC vs Rx Separation | :green_circle: Complete | Type classification, tabbed UI, dedup warnings, verification badges |
| 3 | Semantic Search | :green_circle: Complete | Fuse.js fuzzy search, 38 synonym groups, global search overlay |
| 4 | Unified External Data | :green_circle: Complete | 7 source types, review workflow, notification badges, discrepancy tracking |
| 5 | Test Expiration Defaults | :green_circle: Complete | Per-test defaults, auto-calculation, color-coded warnings |
| 6 | Shared Order Panels | :green_circle: Complete | Create/publish/clone panels, shared library, usage tracking |
| 7 | Markdown in Notes | :green_circle: Complete | MarkdownPipe, live preview, cheatsheet (pre-existing) |
| 8 | Visual Note Attribution | :green_circle: Complete | 15 roles, color-coded badges, role filter, dark mode |
| 9 | Custom Rounding Sheets | :green_circle: Complete | Template builder with drag-drop, sheet viewer, print-optimized |
| 10 | Patient Timeline | :green_circle: Complete | 9 domains, problem grouping, trend arrows, time range filters |

**Overall: 10/10 fully implemented**
