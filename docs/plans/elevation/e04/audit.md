# E04.01 audit: Discriminating insight questions

- Bead: `ArchetypeAI-1hj` (E04.01). Tracker status at audit: open.
- Checked at: HEAD `56088ca`, corrected after the second and third independent reviews.
- Disposition: **candidate audit, awaiting a final independent review.** Read-only. No implementation changed. No acceptance is claimed.
- Method: file inventory, test-name listing, mount search, and the bead's own scenario list. The gap notes in §5 are judgement, not measurement.

## 1. Existing code

| Item | Path | Tests |
| --- | --- | --- |
| Pure step module | `src/parts-cartographer/elevation/e04-discriminator.ts` | 15 in 1 spec file(s) |
| Panel | `src/parts-cartographer/screens/elevation/e04-discriminator.jsx` | 2 (spec files: e04-discriminator.spec.ts) |
| Mounted in | `src/parts-cartographer/screens/check-in.jsx` | - |
| Storage key | `INNERVERSE_DISCRIMINATOR_V1` | - |

## 2. Observable scenarios from the bead

| Scenario (from the bead) | Evidence today |
| --- | --- |
| Exercise all five response types, exact optional words, neither/depends/correction, an exception and sparse sources | Not mapped one-to-one in this audit (see §3) |
| correction changes wording without score/history writes. | Not mapped one-to-one in this audit (see §3) |

## 3. Module test names (first eight)

- asks the question that separates the two live readings, in bank order
- holds back a question until its prerequisite is answered, and names what it waits on
- stops at the inquiry bound and refuses further answers
- treats one observation or one reading as sparse, and says so honestly
- exercises all five response types, each with its own formulation
- neither rejects both readings, and a rejected reading is never re-added as a discovery
- depends keeps both readings live and sequences the next question from the answer
- accepts only exact optional words and treats any other text as the person own wording

## 4. Input beads and their status

| Bead | Title | Status |
| --- | --- | --- |
| `ArchetypeAI-28h.2.31` | Deliver a bounded, correction-first situation inquiry | in_progress |
| `ArchetypeAI-28h.2.27` | Allow low-evidence and ambiguous assessment interpretations without forced identities | open |
| `ArchetypeAI-28h.2.28` | Review developmental, attachment, crisis and relationship inference claims | open |

## 5. Gaps (judgement, not measurement)

- The panel is mounted in the check-in screen. Its five response types are covered by module tests. One UI test checks the five labels and one click (`e04-discriminator.spec.ts:64-80`).
- The panel has no correction control and does not import a correction function, so the correction behaviour is not reachable from the UI.
- Whether the questions discriminate usefully is not measured with participants.

## 6. Smallest useful slice (educated guess)

Add a correction control to the panel with a test that wording changes and no score or history is written, or remove the correction scenario from this step.

## 7. Pending evidence (not claimed)

- Participant, device, assistive-technology and native-language evidence: **pending**.
- Independent review of this audit: **pending** (reviews one to three found errors, now corrected; a final review is needed).
