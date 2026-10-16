# E16.01 audit: Comparison and the 3+1 view

- Bead: `ArchetypeAI-jinx` (E16.01). Tracker status at audit: open.
- Checked at: HEAD `52002da`, generated 2026-10-16.
- Disposition: **candidate audit, awaiting independent review.** Read-only. No implementation changed. No acceptance is claimed.
- Method: file inventory, test-name listing, and the bead's own scenario list. The gap notes in §5 are judgement, not measurement.

## 1. Existing code

| Item | Path | Tests |
| --- | --- | --- |
| Pure step module | `src/parts-cartographer/elevation/e16-disagreement.ts` | 14 in 1 spec file(s) |
| Panel | `src/parts-cartographer/screens/elevation/e16-report-read.jsx` | 3 (spec files: e16-report-read.spec.ts) |
| Mounted in | `src/parts-cartographer/screens/innerverse.jsx` | - |
| Storage key | none | - |

## 2. Observable scenarios from the bead

| Scenario (from the bead) | Evidence today |
| --- | --- |
| Compare 64 versus 147, two contexts and two times | Not mapped one-to-one in this audit (see §3) |
| unknown axes remain unknown | Not mapped one-to-one in this audit (see §3) |
| full-vector/table values match 3+1 projection | Not mapped one-to-one in this audit (see §3) |
| historical therapist notes retain separate ownership. | Not mapped one-to-one in this audit (see §3) |

## 3. Module test names (first eight)

- compares 64 and 147 as separate source records and labels the cross-instrument pair
- labels two contexts and two times without merging them
- keeps an unknown axis unknown and never imputes zero
- compares at two-decimal display precision without false precision
- leaves the original instrument records unchanged
- classifies sparse and empty results without filling them
- projects every ordered choice of three distinct axes, with the fourth kept as +1
- rejects a repeated or out-of-range axis in the 3+1 choice

## 4. Input beads and their status

| Bead | Title | Status |
| --- | --- | --- |
| `ArchetypeAI-28h.2.20` | Authorize complete therapist client-map workspace and read-only ownership | in_progress |
| `ArchetypeAI-28h.2.21` | Preserve exact four coordinates and complete 3+1-axis analytical controls | in_progress |
| `ArchetypeAI-28h.2.22` | Inspect therapist relationships, full-vector pair comparison and score overlays | open |
| `ArchetypeAI-28h.2.23` | Separate reference placement, personalized scores and historical therapist notes | open |
| `ArchetypeAI-28h.2.24` | Validate real therapist 3+1 analysis and plush-cosmos visual grammar | open |
| `ArchetypeAI-28h.2.30` | Reconcile 64 and 147 through provenance-aware claims and disagreement | open |

## 5. Gaps (judgement, not measurement)

- Only a status line exists. The 3+1 projection and the 64-versus-147 comparison are not built in the panel.
- The historical comparison is not connected.

## 6. Smallest useful slice (educated guess)

Build a read-only 3+1 table from existing canonical data, with unknown axes shown as unknown.

## 7. Pending evidence (not claimed)

- Participant, device, assistive-technology and native-language evidence: **pending**.
- Independent review of this audit: **pending**.
