# E20.01 audit: Independent evaluation rubric

- Bead: `ArchetypeAI-wvtm` (E20.01). Tracker status at audit: open.
- Checked at: HEAD `56088ca`, corrected after the second and third independent reviews.
- Disposition: **candidate audit, awaiting a final independent review.** Read-only. No implementation changed. No acceptance is claimed.
- Method: file inventory, test-name listing, mount search, and the bead's own scenario list. The gap notes in §5 are judgement, not measurement.

## 1. Existing code

| Item | Path | Tests |
| --- | --- | --- |
| Pure step module | `src/parts-cartographer/elevation/e20-evaluation.ts` | 15 in 1 spec file(s) |
| Panel | `src/parts-cartographer/screens/elevation/e20-evaluation.jsx` | 1 (spec files: combined spec `e19-e20.spec.ts`: one block for E20) |
| Mounted in | `src/parts-cartographer/screens/cabinet.jsx` | - |
| Storage key | none | - |

## 2. Observable scenarios from the bead

| Scenario (from the bead) | Evidence today |
| --- | --- |
| Review exact-generation rubric evidence | Not mapped one-to-one in this audit (see §3) |
| reject transferred old scores, candidate-authored acceptance, absent manual AT/live evidence and average scores hiding a hard failure. | Not mapped one-to-one in this audit (see §3) |

## 3. Module test names (first eight)

- defines the eleven plan dimensions in order, with four hard gates
- treats a candidate-recorded pass as a claim until independent evidence verifies it
- recovers stale scores: earlier-generation evidence and claims are rejected, leaving every dimension pending
- recovers candidate-owned claims: candidate scores and acceptance never change the verdict
- reports absent manual assistive-technology evidence as pending even when automated checks pass
- mock evidence never satisfies live-service, manual-AT or participant requirements
- does not let ten passing dimensions hide a hard accessibility failure
- accepts only an independent accept review for the exact generation, with every hard gate verified

## 4. Input beads and their status

| Bead | Title | Status |
| --- | --- | --- |
| `ArchetypeAI-28h.1.6` | Validate independent sensory controls and unprompted intuitiveness | in_progress |
| `ArchetypeAI-28h.2.18` | Finish bilingual, sensory, accessibility, real-device and intuitive core acceptance | open |
| `ArchetypeAI-28h.2.19` | Stage 1 acceptance gate | open |
| `ArchetypeAI-28h.3.6` | Stage 2 acceptance gate | open |
| `ArchetypeAI-28h.4.5` | Stage 3 acceptance gate | open |
| `ArchetypeAI-28h.5.5` | Stage 4 acceptance gate | open |
| `ArchetypeAI-28h.6.5` | Stage 5 acceptance gate | open |
| `ArchetypeAI-28h.7.5` | Stage 6 acceptance gate | open |
| `ArchetypeAI-28h.8.8` | Stage 7 acceptance gate | open |

## 5. Gaps (judgement, not measurement)

- The rubric is displayed as a draft. No result is produced and no dimension is passed.
- An independent evaluator has not run, and manual assistive-technology evidence is absent.
- Shown only to admins (`src/parts-cartographer/screens/cabinet.jsx:293`).

## 6. Smallest useful slice (educated guess)

None in this audit. The display is the step's stated end state. Any further work needs the evaluator review first.

## 7. Pending evidence (not claimed)

- Participant, device, assistive-technology and native-language evidence: **pending**.
- Independent review of this audit: **pending** (reviews one to three found errors, now corrected; a final review is needed).
