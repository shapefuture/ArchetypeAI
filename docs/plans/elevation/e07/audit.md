# E07.01 audit: Validity, context and resurfacing

- Bead: `ArchetypeAI-bqm` (E07.01). Tracker status at audit: open.
- Checked at: HEAD `56088ca`, corrected after the second and third independent reviews.
- Disposition: **candidate audit, awaiting a final independent review.** Read-only. No implementation changed. No acceptance is claimed.
- Method: file inventory, test-name listing, mount search, and the bead's own scenario list. The gap notes in §5 are judgement, not measurement.

## 1. Existing code

| Item | Path | Tests |
| --- | --- | --- |
| Pure step module | `src/parts-cartographer/elevation/e07-validity.ts` | 15 in 1 spec file(s) |
| Panel | `src/parts-cartographer/screens/elevation/e07-validity.jsx` | 2 (spec files: e07-validity.spec.ts) |
| Mounted in | `src/parts-cartographer/screens/cabinet.jsx` | - |
| Storage key | `INNERVERSE_VALIDITY_V1` Also reads `MEMORY_KEY` (`src/parts-cartographer/screens/elevation/e07-validity.jsx:40`). | - |

## 2. Observable scenarios from the bead

| Scenario (from the bead) | Evidence today |
| --- | --- |
| Mark one source contextual and another no-longer-fitting | Not mapped one-to-one in this audit (see §3) |
| preserve original wording | Not mapped one-to-one in this audit (see §3) |
| retrieval previews explain exclusions | Not mapped one-to-one in this audit (see §3) |
| declined resurfacing stays declined. | Not mapped one-to-one in this audit (see §3) |

## 3. Module test names (first eight)

- marks one source as fitting in some contexts and another as no longer fitting, and keeps both
- preserves the original wording through every validity change, including after a later edit
- never downgrades the person's own certainty when validity changes
- denied: a context-specific mark is refused until the person names the context
- authority: the model cannot change validity, certainty or resurfacing
- separates observation, hypothesis, user wording and canonical measurement, and validity never changes them
- canonical measurement: a no-longer-fits note is kept beside the result, with no score field
- retrieval preview explains each exclusion, considers only selected sources, and infers nothing when none are selected

## 4. Input beads and their status

| Bead | Title | Status |
| --- | --- | --- |
| `ArchetypeAI-28h.5.1` | Define inspectable personal-memory provenance and deletion propagation | in_progress |
| `ArchetypeAI-28h.5.6` | Create a user-controlled personal evidence library | open |
| `ArchetypeAI-28h.2.29` | Preserve bipolar coexistence, contextual interpretation and analytical identity | open |

## 5. Gaps (judgement, not measurement)

- The panel reads the memory key and writes its own validity key. A change to the memory shape affects this panel's reads.
- Declined resurfacing is stored locally only. A search of `e07-validity.jsx` found no resurfacing control, so the decline cannot be exercised from the UI.

## 6. Smallest useful slice (educated guess)

Add a resurfacing control with one test that a declined resurfacing does not return after reload, or record that the scenario is outside this panel.

## 7. Pending evidence (not claimed)

- Participant, device, assistive-technology and native-language evidence: **pending**.
- Independent review of this audit: **pending** (reviews one to three found errors, now corrected; a final review is needed).
