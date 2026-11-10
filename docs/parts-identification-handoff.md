# Parts identification and the 3+1 map: handoff

**For:** another agent that needs to understand the code and the psychology behind parts identification and the 3+1 view.
**Snapshot:** read from the working tree on 2026-11-10. Line numbers are approximate; re-check before editing.
**Status in one line:** the 64-item and 147-item tests and their scoring run in the app. The 3+1 projection is tested logic with no rendered view yet.

## 1. What this area does

It turns questionnaire answers into "parts" (sub-personalities) and a four-number map of them. E16 adds a read-only therapist analysis.

This is a reflective lens, not a diagnosis. The repository says so repeatedly: no empirical calibration or validation study was found for these instruments, norms are provisional, and outputs are hypotheses (`docs/80-20-plan.md` §19; `docs/baseline/assessment-construct-review.md`).

## 2. Where the code lives

| Step | File |
|---|---|
| 147-item scoring (canonical) | `src/shared/core/data/scoring-v2.ts` (`scoreProfile` :93) |
| 147 answers to blocks | `src/shared/core/data/assessment-adapter.ts` (`toAssessmentInput`) |
| 147 item order | `src/shared/i18n/items.ts` (`buildItemSequence` :47) |
| 147 result to parts | `src/parts-cartographer/core/clinical-profile-adapter.ts` (`adaptClinicalProfile` :179) |
| 147 screen | `src/parts-cartographer/screens/full-assessment.jsx` |
| 64-item scoring | `src/shared/core/data/scoring.ts` (`computePoleScores` :97, `generateArchetypes` :307) |
| 64 result to parts | `src/parts-cartographer/core/legacy-universe-adapter.ts` (`buildLegacyUniverseParts` :62) |
| 64 input check | `src/parts-cartographer/core/legacy64-responses.ts` |
| 64 screen | `src/parts-cartographer/screens/legacy-assessment.jsx` |
| Part taxonomy and norms | `src/shared/core/data/parts.ts` |
| Coordinates panel | `src/parts-cartographer/screens/coordinates.jsx` (mounted at `screens/innerverse.jsx:236`) |
| 3+1 projection, comparison, access | `src/parts-cartographer/elevation/e16-disagreement.ts` |

## 3. The psychology

**Frame.** The vocabulary follows Internal Family Systems (IFS): the mind has protective and wounded sub-parts around a core Self. The repo does not cite a source for its taxonomy. The plan treats IFS as a lens the user chooses. Ordinary language comes first, and nobody has to adopt a part name (`docs/80-20-plan.md` lines 349, 415, 931).

**Roles in the 147-item model** (`parts.ts`):

| Role | Members | Meaning in the model |
|---|---|---|
| Manager (7) | taskmaster, inner_critic, pleaser, controller, analyst, hermit, bypasser | Proactive protectors that run daily life |
| Firefighter (3) | numb, rebel, charmer | Reactive protectors that act when pain surfaces |
| Exile (4) | abandoned, ashamed, frightened, unseen | Carry the burden the protectors guard |
| Resource (4) | sage, warrior, caregiver, explorer | Capacities. Very high or very low bands are flagged as patterns |
| Self (8 qualities) | calm, clarity, compassion, curiosity, confidence, courage, creativity, connectedness | Self-energy and the core |

Other modelled links: each protector guards certain exiles (`GUARDS`), conflicting protector pairs are named polarizations (`POLARIZATIONS`), and each part maps to a need (`NEED`).

**The 64-item relational model** has four bipolar dimensions, which are the coordinate axes:

1. Agency: active ↔ receptive
2. Temperature: hot ↔ cool
3. Focus: other ↔ self
4. Attachment: anxious ↔ avoidant

The attachment items presume a romantic partner, according to the construct review. A 12-item healthy-relationship section exists but does not feed the four coordinates.

## 4. The two instruments

| | 64-item (relational) | 147-item (parts) |
|---|---|---|
| Items | 12 agency, 12 temperature, 12 focus, 16 attachment, 12 healthy-relationship | 14 parts × 8, 4 resources × 6, Self × 8, 3 validity |
| Response wording | Strongly disagree → Strongly agree | Never true → Almost always true |
| Output | Four centers per person, plus generated archetypes that each have coordinates | T-score per part and resource, Self energy, burden, attachment proxies, flags |
| Coordinates | Person-derived. Status `measured` | Fixed template per part from `IV_PARTS`. Status `reference` |

The 147 items are delivered round-robin across 19 groups, with validity items at positions 40, 84 and 120. The order is fixed.

## 5. How a 147 result becomes parts

1. `toAssessmentInput` splits the 147 ordered answers into blocks.
2. `scoreProfile` reverse-scores item positions 7 and 8 of each part (`6 − v`). A part's raw score runs from 8 to 40.
3. Each part's T-score is `clamp(50 + 10 × (raw − mean) / SD, 20, 80)`, using hardcoded provisional mean and SD per part. Resource bands: T < 40 is "hypo", T ≥ 65 is "hyper" (`scoring-v2.ts:109`).
4. Validity flags: the attention item must equal 3, and an infrequency answer of 4 or more is flagged (`scoring-v2.ts:194–195`). Flags never block a result.
5. The crisis footer appears when all four exiles have T ≥ 60 (`scoring-v2.ts:198`). It is a support prompt, not a risk assessment.
6. `adaptClinicalProfile` turns T into an intensity of 1–5 and a felt level: low below 45, high at 60 or above, mid otherwise (`clinical-profile-adapter.ts:135–136`).
7. Each part's four coordinates are `(IV_PARTS.ax − 50) / 50` (`clinical-profile-adapter.ts:158–163`). They do not depend on the person's answers.

## 6. How a 64 result becomes a map

1. `validateLegacy64Responses` checks for 64 integers from 1 to 5.
2. `computePoleScores` forms the four centers from raw block sums, then clamps each to −1…1 (`scoring.ts:123–126`):
   - agency = (receptive 6–11 − active 0–5) / 24
   - temperature = (hot 12–17 − cool 18–23) / 24
   - focus = (other 24–29 − self 30–35) / 24
   - attachment = (anxious 36–43 − avoidant 44–51) / 32 × 0.75

   A positive value leans to the first pole named (receptive, hot, other, anxious). The health block (52–63) is not in the centers. It feeds other archetype, defence and regulation logic (for example `scoring.ts:548` and `:1294`).
3. `generateArchetypes` creates an archetype at the dominant pole of each dimension. When two dimensions align, a named pattern takes precedence, such as "Stoic Fortress" or "Tender Flame" (`scoring.ts:400–470`). Each archetype's coordinates come from the person's center, nudged toward its primary pole (`scoring.ts:503–506`).
4. Prominence is normalized to sum to 100. It is a share within the generated set, not a measure of severity.
5. `buildLegacyUniverseParts` stores the coordinates with `coordinateBasis: 'response-derived-64'` (`legacy-universe-adapter.ts:78`).

## 7. The coordinates panel

`coordinates.jsx` shows the four values of one selected part, each with a status: `measured`, `reference`, `derived` (parts made in the studio) or `unknown`.

- `coordinateStatusFor` (:62–68) sets the status.
- `coordinatesForPart` (:71–79) builds the values. Unknown shows as unknown, never zero. An all-zero studio placeholder is treated as unknown.
- A parity check (:109) confirms that the table, number list and text version show the same values.

Axis order everywhere: 1 agency, 2 temperature, 3 focus, 4 attachment (`coordinates.jsx:96`).

## 8. The 3+1 map

**Meaning.** Choose three distinct axes to plot. The remaining axis is shown as a labelled "+1" value. It is not a fourth spatial dimension. Changing axes is a projection change, never a data edit (`docs/80-20-plan.md` §9.3a item 6).

**Code** (`e16-disagreement.ts`):
- `threePlusOne(coords, dims)` (:115) checks the choice (24 ordered options). It returns four rows (three chosen axes, then the +1 row) and `matchesFullVector`, which checks each row against the input.
- `renderPlan(projection, rendererAvailable)` (:139) uses a `scene` only when a renderer exists and the check passes. Otherwise it uses a `table`.
- `compareResults(left, right)` (:65) compares two result records axis by axis at two decimals. Unknown on either side stays unknown. 64 and 147 records are never merged.
- `completenessOf` (:54) labels a result as complete, sparse or empty.

**Access** (`e16-disagreement.ts:154–187`, with `core/therapist-access.ts:54–55`):
- A therapist reads only with a live link and the client's report permission (`relationship.grants.report`). An optional expiry must be in the future, and an unreadable expiry fails closed.
- A therapist sees their own notes plus client notes. A client sees their own notes plus therapist notes addressed to them.
- Notes keep their author, time and referenced results. They are never rewritten.

**Spec for the full view** (`docs/80-20-plan.md` §9.3a): X/Y/Z selectors, automatic handling of the +1, a calibrated grid, a numeric inspector, a range filter for the fourth dimension, an all-parts table linked to the 3D nodes, relationship overlays labelled by source, and derived and measured values kept distinct.

**Status: not built.**
- No code outside the spec files calls `threePlusOne`, `renderPlan` or `compareResults`.
- `screens/elevation/e16-report-read.jsx:17` states that the comparison and 3+1 view are not built yet.
- The scene branch has no renderer behind it.
- Tracked as `ArchetypeAI-28h.2.21` (in progress) and `ArchetypeAI-28h.2.24` (open, to validate the real therapist 3+1 analysis and visual grammar) in `docs/plans/elevation/e16/audit.md`.

## 9. Tests

```
npx vitest run src/parts-cartographer/elevation/e16-disagreement.spec.ts \
  src/parts-cartographer/core/analytic-coordinates.spec.ts \
  src/parts-cartographer/screens/coordinates.spec.ts \
  src/parts-cartographer/core/legacy-universe-adapter.spec.ts
```

32 tests pass (run on 2026-11-10). They cover projection logic and adapters. They do not test the psychology, and they do not test a rendered map.

## 10. Known problems

1. **147 coordinates are not personal.** Any 3+1 view or 147-vs-64 comparison shows the fixed template. The plan states the same (§19.2 item 13).
2. **Zero fallback.** `legacy-universe-adapter.ts:29–35` turns a missing or invalid coordinate into 0 and still labels it `measured`. This breaks the rule that unknown is never zero. It is latent, because the 64 scorer always returns four finite numbers.
3. **Shape mismatch.** E16 expects one four-number vector per result. The 64 test gives vectors per archetype. The person-level center is computed inside `computePoleScores`, but I did not confirm that it is saved with a result. The 147 test has no person-level vector.
4. **Two files named `scoring-v2`.** The canonical one is `src/shared/core/data/scoring-v2.ts`. `src/parts-cartographer/core/scoring-v2.ts` is an older draft shape used by the eight-part quick map (`screens/assessment.jsx`). Do not mix them.
5. **Provisional norms.** Identical raw answers can rank differently under different norm tables. The plan's example shows all-3 answers producing a distinctive headline from the norms alone (§19.2 item 3, §19.5).
6. **Model assumptions, not validated measures.** Burden weights, attachment proxies, complexes, polarizations, resource bands and need hunger (§19.2 items 4–10).
7. **Item wording.** The reference window is unclear ("most days" versus this week versus one relationship). Some single items bundle several behaviours. Reverse-keyed items are not literal opposites. Somatic items depend on body awareness. English and Russian differ in places. See `docs/baseline/assessment-construct-review.md`, whose file paths are partly stale.
8. **Absolute response checks** ("never any emotion", "never bored") can flag literal or unusual readings as careless. A flag is not a validity verdict.

## 11. Open decisions

- Give the 147 test a person-level vector (this needs a scoring change), or label the 147 as template-only in every view.
- Decide how a saved 64 result maps to E16's record shape, including which vector to use.
- Render the 3+1 view as a 3D scene, or as a table only.
- Fix the zero fallback. This is a bug fix and needs no product decision.
