# Assessment 2.0: build and fix plan

**Status:** draft for owner review, 2026-11-10. Nothing in this plan is built yet. It covers every defect and gap found when `plan.md` §14 was checked against the code on branch `claude/gracious-thompson-bu0dtt` (head `f96c966`).
**Reads with:** `plan.md` (the design and its §14 status), `src/shared/core/data/assessment2/`, `src/parts-cartographer/core/parts-two-flow.ts`, `src/parts-cartographer/screens/parts-two.jsx`.
**How to read the guesses:** every choice the owner has not made is an educated guess, numbered G1–G28 in §7. Each names the evidence that would settle it. No pilot result, participant observation, reviewer sign-off or measurement is assumed anywhere in this plan.
**Paths:** `core/`, `screens/`, `elevation/`, `services/`, `pal/` and `i18n/` are under `src/parts-cartographer/`. `assessment2/` is `src/shared/core/data/assessment2/`. Other paths are written in full.

## 1. Scope and goals

**In scope**
- Defects D1–D6 found in the verification (§3).
- Gaps B1–B11: things `plan.md` §2–§8 describe that the code does not do, or that §14 lists as open (§4–§5).
- Optional items O1–O3, each with a default decision (§6). O4, the 3+1 3D view, is in scope now as B12. The owner decided not to wait for the pilot.
- Corrections to `plan.md`: §14 (D6), §3.4 and §7 (M5, M10), and the §6 shape (B5).

**Out of scope**
- Running the pilot (`plan.md` §10). It needs real people and an owner. Only the analysis tools are built (O3).
- Native-speaker review of the Russian copy (`plan.md` §12 item 5). That is an owner action.
- The Beads restore work already in PR #40. It is not about this plan.
- The 3+1 3D view (`plan.md` §9 phase 6). It waits for the pilot.

**Done means**
1. No screen, result or stored record shows an unknown as a value. Timing, confidence, map class and axes are all checked. An unknown axis is marked in `unmeasuredAxes`, and its slot holds a placeholder that no reader treats as a value (G38). The energy of a 2.0 part with no answered level is an em dash, not the layout default (G39).
2. A 2.0 result is never labelled, stored or shared as a measurement, in any module.
3. Every item in `plan.md` §3–§8 is built, or deferred with a decision recorded in §7.
4. `plan.md` §14 matches the code.

## 2. Ground rules

- Unknown is never shown as zero or as a value. A skipped single answer is stored as `null`, and `undefined` means "not asked yet". An unknown map axis keeps a placeholder number in its coordinates slot, and `unmeasuredAxes` names it (G38).
- Keep every id that exists. Add ids; do not rename them. Drafts and results may already be stored for people who used 2.0.
- 2.0 never shares a record with the 64 or 147 results (`plan.md` §1, §6).
- Every new field on a map part must go into the cloud whitelist (`core/cloud-storage.ts:73`) and must pass `validMapParts` (`core/backup.ts:62`). Otherwise it is lost on sync or restore.
- Every new string has English and Russian. Russian uses «вы» and is marked `draft` until a named reviewer signs it off.
- Each fix gets a test that fails on the old code. Confirm it by reverting the fix once, as this branch did before.
- Browser tests run with `npm run test:browser -- --trace off`. Re-run only the failing specs; the sandbox has known load-related timeouts.

## 3. Defects (Phase 1)

Evidence was observed on 2026-11-10. The behaviour checks for D1–D3 were run with throwaway specs, which were deleted afterwards.

| ID | Defect | Evidence | Size |
|---|---|---|---|
| D1 | A skipped timing is stored as a real answer | `screens/parts-two.jsx:159` skip writes nothing; `assessment2/scoring.ts:281` falls back to the default. Observed: `timing: "reactive"`, `mapFamily: "firefighter"`, every axis unmeasured. | S |
| D2 | A narrow lead is ignored for parts whose confirm items were skipped | `assessment2/scoring.ts:152` returns "medium" before the lead check. Observed: lead 0.08 gives "medium". | S |
| D3 | The lighter path keeps answers from stage 4 | `assessment2/scoring.ts:285` builds `guards` from `fears` without checking `lighter`. Observed: guard `frightened` with zero exile parts. | S |
| D4 | 2.0 is labelled as a measurement in four places | `core/assessment-routes.ts:59`, `elevation/e02-entry.ts:131`, `elevation/e13-grammar.ts:53`, `elevation/e15-session-continuity.ts:68`. See §3.4. | M |
| D5 | Copy and code nits (M1–M10) | §3.5. | S |
| D6 | `plan.md` §14 is wrong in places | §3.6. | S |

Order inside Phase 1: D1, D2, D3 and D4 are independent and can run in parallel. D5 comes next. D6 comes last, so the docs describe the fixed code.

### 3.1 D1: a skipped timing is unknown

**Change**
1. `assessment2/scoring.ts`: `Assessment2Input.timing` values become `Timing | null`. `null` means skipped. A missing key means not asked.
2. `assessment2/scoring.ts`: `MapPart.timing` becomes `Timing | null`. Add `classKnown: boolean`, false when timing is null.
3. `assessment2/taxonomy.ts:191` (`protectorDefault`): when timing is null, the depth reference is the midpoint of the two defaults, 0.45 (G1). Depth stays unmeasured.
4. `assessment2/scoring.ts:281`: `const timing = input.timing[pick] ?? null;`. The class fallback goes.
5. `core/parts2-universe-adapter.ts:41`: `partType` is `undefined` when `classKnown` is false. The layout family stays `manager` (G2). Add `classKnown?: boolean` to `ArchetypeMapData` in `pal/traits.ts` (near line 97), and to the cloud whitelist.
6. `assessment2/scoring.ts`, `isAssessment2Result`: a protector's timing may be `null`.
7. `screens/parts-two.jsx`: the timing skip writes `null` explicitly (`patch('timing', member, null)`). Next stays disabled until a choice is made.
8. `screens/parts-two.jsx`, `ResultView` (around line 387): when timing is null, show the `timingUnknown` copy, "Timing not answered" in English and its Russian draft. Guard both the sub-line and the map class text.

**Tests** (`assessment2/assessment2.spec.ts`, `core/parts2-universe.spec.ts`)
- Skip gives `timing === null`, `classKnown === false`, depth unmeasured, depth reference 0.45.
- The validator accepts `null` and rejects `'sometimes'`.
- The adapter gives `partType: undefined` for a null timing.
- The result view shows "Timing not answered" (a component test, or a step in the parity spec).

**Done when** no protector carries a timing the person did not choose.

### 3.2 D2: the narrow-lead rule applies on every path

**Change** (`assessment2/scoring.ts:151`, `confidenceOf`):

```ts
if (lead < RANK_MARGIN) return 'low';   // G3: a narrow margin is low on every path
if (skipped) return 'medium';           // scenes alone, wide margin
if (level === null) return null;        // confirm items not answered
if (level < 3) return 'low';
return score >= 0.25 ? 'high' : 'medium';
```

**Tests:** the pursue case (lead 0.08, skipped) gives `low`. A skipped part with a wide lead gives `medium`. A confirmed level of 5 with a narrow lead gives `low`. A confirmed level of 5, a wide lead and score 0.67 give `high`.

**Done when** no path gives a higher confidence than the lead allows.

### 3.3 D3: the lighter path ignores stage-4 answers

**Change:** `buildAssessment2Result` treats `fears` as empty when `lighter` is true. `guards` is `[]`. Exile parts and fear-based conflicts are already skipped. The answers stay in the draft (G4), so turning the lighter path off brings them back.

**Tests:** lighter with a fear answer gives no guards and no exile parts. Turning lighter off restores the guard, on the same input.

**Done when** the result matches the screens the person actually saw.

### 3.4 D4: 2.0 is not a measurement, in any module

Four separate problems share one cause. The 2.0 route inherits the "canonical" flag, which in this code means "a measured record".

**(a) Entry model** (`core/assessment-routes.ts`, `elevation/e02-entry.ts`)
- Add `measured: boolean` to `AssessmentRoute` (line 37). True for 64 and 147 only. Keep `canonical` to mean "a full record type the app keeps": 2.0, 64 and 147.
- `assessmentChoice` (line 131): `labels.result = route.measured ? 'canonical-measurement' : 'observation'` (G5).
- `deeperFor` (line 102): filter on `measured`, so 2.0 stops being offered as a "deeper" option. It is the default.
- `saveRule` (line 132): `route.produces === 'sample' ? sampleSavePlan(ctx.profile) : null`. Today the situation route, which writes no result, gets a replace-current rule.
- `elevation/e02-entry.spec.ts:161` changes to `observation`. Add a case for the situation route's rule.

**(b) Map grammar** (`elevation/e13-grammar.ts:53`)
- Replace the single `coordinates: 'canonical-measurement'` with a function of the part's `coordinateBasis` (G6):
  - `response-derived-64` → `canonical-measurement`
  - `self-placed-2` → `user-authorship` (the person placed it)
  - `family-default-2` and `fixed-reference-147` → `hypothesis` (a reference, not a finding)
- Grep for `provenanceOf('map'` callers first, and update each.
- Register `parts-two` in `REGISTRY` with `needsAssessment: false`. Its answers, cursor and saved time are `observation`.
- Update `elevation/e13-grammar.spec.ts:64` and `:73`.

**(c) Therapist share** (`elevation/e15-session-continuity.ts:68`)
- Add `'parts-two-result'` to `NOT_INCLUDED`, so a share preview names the 2.0 result as withheld (G7). Check every consumer of `notIncluded` for a label map, and add the label.

**(d) Guard test:** `provenanceOfCoordinates('self-placed-2')` and the 2.0 entry choice never return `canonical-measurement`.

**Done when** no 2.0 value carries the canonical-measurement label, or is listed as a measurement, in any module.

### 3.5 D5: copy and code nits

| ID | Where | Change | Reason |
|---|---|---|---|
| M1 | `assessment2/content.ts:82`, bypasser card | Remove "Faith can be its costume." (English and Russian). Two sentences. | `plan.md` §7: describe the reaction, not its costume. |
| M2 | `content.ts:73`, charmer card | "with humour and charm" → "with warmth and charm". | Humour is a costume, named here as the method. |
| M3 | `content.ts:80`, soother card | "food, screens, shopping" → "any comfort that settles a flare-up". | Costumes named in the card. The stage-2 tag records them. |
| M4 | `screens/parts-two.jsx:166`, confirm screen | Seed the answers from `input.confirm[member]`, so Back no longer blanks them. | Usability. |
| M5 | `plan.md` §7, time window | Rule amended (G10): the window is stated once, above the items on the same screen. | Per-item prefixes would break Russian grammar. |
| M6 | `assessment2/scoring.ts:120`, `levelOf` comment | Say "three", not "two". | Stale comment. |
| M7 | `assessment2/scoring.ts:130–134` | Remove the duplicate doc block above `leadsOf`. Rewrite the `confidenceOf` doc to match D2. | Stale comment. |
| M8 | `assessment2/scoring.ts:258`, type-3 conflict | Derive it from `MEMBER_DEFS`: any attack member whose default target is `self`. Today that is only `inner_critic`. | Same result today; no longer hard-coded. |
| M9 | Quick Scan copy | Remove `quickScanPurpose`, `quickScanEffort` and `quickscan` (`i18n/strings.ts:51–52, 96`), and the unused `quickscan` and `quickScanCta` entries in `src/shared/i18n/strings.ts` (lines 20–21, 3295, 4239). Grep first. The i18n coverage test must still pass. | Dead copy. |
| M10 | `plan.md` §3.4, type 4 | Drop "belonging against authenticity" (G11). Neither is among the six needs. The code already keeps the two real pairs. | Plan inconsistency. |

After these edits, re-run the grep for «ты» forms across the Russian copy. On 2026-11-10 the check passed for `assessment2/content.ts` only, so the other Russian strings still need the same check.

### 3.6 D6: correct `plan.md` §14 and the design notes

- §14, "Built", timing: say timing is stored as unknown only after D1 lands.
- §14, confidence: say the narrow-lead rule applies on every path only after D2 lands.
- §14, "Quick Scan removed": true for the routes. Add "and its copy keys (M9)".
- §14, open decisions 1–4: link decisions 1 and 2 to B12, decision 3 to B9, and decision 4 to B2, once built. Decision 5 stays with the owner.
- §14, departures: add the ones in §5 that §14 does not list (exile need timing, ground list, provider forms, capacity name, coordinate shape).
- §3.5: record the 64 projection (`src/shared/core/data/map-axes.ts:54`) and its sign convention. Mark the formula a guess, checked against the 64 pole labels (the test is in B5).
- §6: replace the `coords: {value, status}` shape with the one that was built (B5).

## 4. Gaps to close (Phase 2)

These are small and need no new data. Do them after Phase 1.

### B1 Provider "none": a gap and a suggested practice (`plan.md` §5, §8)
- **Gap copy** (G12): "Nothing comes to mind for {need} yet. Notice that. It is not a score."
- **Practice map** (G13, draft): safety → `build-safe-place`; connection → `self-compassion-break` (weak); attunement → `what-was-it-like`; worth → `noticing-reframe`; agency → `possible-selves`; aliveness → `body-scan-3min` (weak). The IDs come from `CATALOG_EXERCISE_IDS` (`core/practice-catalog.ts:25`).
- **Gate:** the catalog is `draft`, with no reviewer (`core/practice-catalog.ts:17–22`). Show the gap alone, with "Practices for this need appear after review." Show a practice title only when `CATALOG_REVIEW.status === 'reviewed'`.
- **Files:** `screens/parts-two.jsx` (`ResultView`), `assessment2/content.ts` (`GAP_COPY`, `NEED_PRACTICE`). The catalog does not change.
- **Tests:** every mapped ID is in `CATALOG_EXERCISE_IDS`. A provider of `none` shows the gap and no title while the catalog is draft. A test-only override to `reviewed` shows the title.
- **Size:** S.

### B2 A provisional map after stage 1 (`plan.md` §4; §14 open decision 4)
- A read-only 2D pad, drawn from `FAMILY_DEFAULT` (`assessment2/taxonomy.ts:48`), with one point per family. The top three ranked families are highlighted (G14).
- Label: "Provisional: family positions, not your parts."
- Shown above the list on the first pick screen, and above the ranking on the result.
- A family with a null score is not drawn. Unknown is never zero.
- **Files:** new `screens/parts-two-provisional.jsx`, styles in `screens/parts-two.css`.
- **Tests:** eight points when every family is answered; top three marked; an unanswered family is absent.
- **Size:** S.

### B3 "What the exile wants" moves to stage 5 (`plan.md` §4 stage 5, §3.1)
- Remove the need chips from `ExileScreen` (`screens/parts-two.jsx:222–228`). Stage 4 keeps the level only.
- Add a stage-5 `wants` screen before `provider`. The table need (`EXILE_NEED`) is preselected, and the person can change it (G15).
- Store `exileNeed[exile]` when the person taps Next. Skipping stores nothing; the table value applies with `needSource: 'table'`.
- The provider role and Type 4 already follow the chosen need. Keep that.
- **Files:** `core/parts-two-flow.ts` (new screen kind, stage 5), `screens/parts-two.jsx`, `assessment2/content.ts` (`wants` copy).
- **Tests:** `core/parts-two-flow.spec.ts`. The order is exile level (stage 4), then wants (stage 5), then provider. The lighter path skips wants.
- **Size:** S–M.

### B4 Ground, provider forms and the capacity name (`plan.md` §3.2–3.3)
- Keep all ids (G16). Fix copy only:
  - `containerForLater` → "Set it down somewhere safe to come back to later" (the IFS container practice). Document it in `plan.md` §3.3.
  - Keep `realPerson` and `idealParent` as two forms (G17). Document the split.
  - English capacity name "Player" (G18). Russian stays «Исследователь».
- **Tests:** the existing `copyCoverage` test must still pass.
- **Size:** S.

### B5 Record the shape that was built (`plan.md` §6)
- Document, do not change code: the four-slot `coordinates` tuple, `unmeasuredAxes`, `placement` (`placed` or `default`), `depthState` (`set`, `unsure` or `unanswered`), and providers as a field on each exile.
- Explain that this matches `src/shared/core/data/map-axes.ts` and the 64 and 147 map parts.
- Add a test that pins the 64 projection's sign convention against the 64 pole labels (`screens/legacy-report.jsx`). If the test shows the convention is wrong, stop and raise it with the owner.
- **Size:** S.

## 5. Build what is missing (Phase 3)

Do these after Phase 2. B9 comes first, because it reads the stored result that B6 and B7 change.

### B9 Read back the stored 2.0 result (`plan.md` §6; §14 open decision 3)
- **Save shape** (G23): store `{ savedAt, result }` under `ROUTE_KEYS.parts2.result` (`core/assessment-routes.ts:28`). Accept the older bare result on read.
- **Backup:** update the validator at `core/backup.ts:107` for the new shape. Leave the key list at `core/backup.ts:16` as it is.
- **Reader:** a new `core/parts-two-store.ts` with `readLastResult()`. It validates with `isAssessment2Result`, recomputes `conflicts` with `deriveConflicts` (`plan.md` §6: "recomputed on read"), and on invalid data returns `null` and leaves storage untouched.
- **UI:** the route's start screen shows "Your last result, saved {date}", read-only (the result view without the save button), with "Start again".
- **Results saved before D1** are marked "saved before the timing fix; timing may be a default" (G27).
- **Tests:** invalid data gives `null` and leaves storage unchanged. Stored conflicts are ignored and recomputed. The older bare shape still reads.
- **Size:** M.

### B6 The Centre (`plan.md` §3.3)
- **Screen** (G19), stage 5, after capacities and before ground:
  - Awareness: "I can notice this part from a little distance." 1–5, or skip.
  - Will: "My will to act feels available." 1–5, or skip.
  - Qualities: up to three of the eight in `src/shared/core/data/parts.ts:159` (calm, clarity, compassion, curiosity, confidence, courage, creativity, connectedness), the ones easiest to reach now.
- **Data:** `centre: { awareness: 1..5 | null, will: 1..5 | null, qualities: SelfQuality[] }` in the input and the result. The validator checks the range, at most three qualities, and that every quality is in `SELF_QUALITIES`.
- **Result:** a "Self" section. Unanswered values show "not answered".
- **Not on the map in v1** (G20). The transpersonal layer stays off (O2).
- **Tests:** the validator; stage-5 order; skip stores `null`; the result section.
- **Size:** M.

### B7 Providers as points beside their exiles (`plan.md` §5.1)
- For each exile whose provider access is `easy` or `effort`, add a resource part `parts2_provider_<exile>`:
  - Coordinates: the exile's energy +0.25 and direction +0.25, clamped; depth is the exile's depth; the exile's unmeasured axes are copied (G21), and blending is always unmeasured on the point (G37).
  - `mapFamily: 'resource'`, `partType: undefined`, name the provider role, role "Provider".
- Access `none` gives no point. The gap line (B1) explains it.
- **Result shape:** add `kind: 'provider'` to `MapPart`. Update `isAssessment2Result`, `core/parts2-universe-adapter.ts` and the result view.
- **Tests:** easy or effort gives a point; none gives none; clamp at ±1; an exile's unknown axis stays unknown on its provider.
- **Size:** M.

### B8 Unknown axes on the 3D map (`plan.md` §14 open decisions 1 and 2): delivered in B12
- **Choice** (G22, refined by G31 and G32): ghost, do not hide. The first rule faded every part with an unmeasured axis, which would have faded every 64 and 147 part. The rule that shipped is in B12.
- 64-derived parts keep the middle depth plane. They are labelled, not faded (G31).
- Why not hide: hiding removes parts from every 64 user's map (`plan.md` §14).
- **Tests:** `services/universe-3plus1.spec.ts` covers `presentationFor`. The screenshot check is for owner review, not a test.
- **Size:** M.

### B10 E16 comparison for 2.0 parts (`plan.md` §6)
- E16 has no screen today. Only `elevation/e16-disagreement.ts` uses `compareResults`, and no UI imports it. Build the module side only:
  - `Instrument` (`e16-disagreement.ts:16`) gains `'parts-2'`.
  - `RecordRef.provenance` (line 35) becomes a union. `refOf` (line 59) follows the instrument: 64 and 147 stay `canonical-measurement`, placed 2.0 parts are `user-authorship`, and defaults are `hypothesis`.
  - `resultRecordsFromParts2(result, takenAt)` returns one record per part, with its known axes.
- No screen until the owner decides where comparisons appear (G24).
- **Tests:** a 2.0 part against a 147 reference part gives a per-axis relation, keeps the unknowns, and carries the right provenance labels.
- **Size:** M.

### B11 Tap budget check (`plan.md` §2, §4; Phase 3, after B6)
- Estimate taps per screen kind (G28). First weights: ground 1, scene 2, pick 1, timing 2, confirm 3, fear 1, exile level 1, wants 1, blend 1, provider 2, capacity 2, ground2 1, centre 3, place 2.
- A typical path (three protectors, three exiles, one protector with stage 3 skipped) is about 57 taps with the Centre, and about 54 without it. The target is 55. If the test is over target, the first cut is to merge the exile blend into the wants screen, which saves about three taps. Cut screens before content.
- **Test:** the typical path is at most 57 taps, and the longest path (four protectors, four exiles, lighter off) is at most 73. The owner raised both targets from 55 and 70 on 2026-11-11, to the measured numbers, with the flow unchanged. The Centre is in the count. The test is `src/parts-cartographer/core/parts-two-tap-budget.spec.ts`.
- **Measured, 2026-11-11:** the typical path is 57 taps with the Centre (54 without), and the longest is 73. The first cut, merging the exile blend into the wants screen, removes a screen per exile but no tap: the merged screen still needs the blend tap and Next, so it was not made. The owner chose to raise the targets to 57 and 73 instead.
- **Size:** S.

### B12 The 3+1 3D view (`plan.md` §3.5, §9 phase 6): built now, replaces the planned B8 and O4

Built on 2026-11-10 by owner decision, without waiting for the pilot.

- **Axes:** the three plotted axes (energy along x, depth up y, direction along z) draw as guide lines through the origin, with the end words beside each line (G35). The guides follow the axes the person chooses, and they are hidden in isolation mode.
- **+1 channel:** blending is a halo ring around each part whose blending is known. The hue shows the sign: cool blue for "I can be with it", warm amber for "it runs me". The opacity shows the strength, so a neutral value is a faint ring (G29). A part whose blending is unknown has no ring.
- **Fade (B8):** a part fades only when one of its spatial axes is one the person can still set and has not set. That is a 2.0 part that is unplaced, or whose depth is "not sure". Axes no answer could set, such as depth on a 64 part or blending on a 147 part, are labelled, not faded (G31). In the isolation view for an axis, a part with no value on that axis carries an "unknown" tag (G38). A faded part keeps half its normal opacity (G32).
- **Lens:** the lens highlights parts by affinity, for every part. It no longer moves family-only parts, so no part moves with the lens (G30). The old lens offset formula and its tests are removed.
- **Overlaps:** parts within 2 units of each other are spread on a small ring, in id order, so none hides another. Stored coordinates never change (G33).
- **Camera:** the default view is slightly oblique, from (13, 9, 42), so the direction axis does not point at the viewer. "Show full map" returns to that view (G34).
- **Legend:** two sentences in the lens card explain the ring and the fade, in English and Russian (G36).
- **Limits:** provider points (B7) are drawn in 3D as resource points, one beside each exile with access easy or effort. The placement defaults still wait for the pilot, as `plan.md` §9 phase 6 says ("decide on defaults").
- **Checks:** `services/universe-3plus1.spec.ts` (the rules), `services/universe-lens.spec.ts` (the lens) and `services/universe-scene.spec.ts` (a mixed scene builds, relays out and renders a frame). The full unit suite passed: 234 test files and 1624 tests, with the existing skips. Type checking passed. The five browser specs that touch the universe passed (20 tests). A screenshot of a synthetic 2.0 map and one of the default example cast were checked by eye. Both were throwaway and are not committed.
- **Size:** L (guess: about 3 days).

## 6. Optional and deferred (Phase 4)

| ID | Item | Default | Size |
|---|---|---|---|
| O1 | Rank-weighted person summary (`plan.md` §6, "if wanted") | Defer (G25). If wanted: weight 1/rank over protectors with a known axis; the axis is null when no part has it; labelled `derived`; shown only with two or more protectors. | S, if wanted |
| O2 | Transpersonal opt-in layer (`plan.md` §3.3) | Defer (G26). It needs its own wording review and an opt-in switch. | Not sized |
| O3 | Pilot analysis tools (`plan.md` §10–11) | Build now, run later. Pure functions in `assessment2/pilot-metrics.ts`: `completionRate`, `medianMinutes`, `retestTopThree(a, b)` (two of the top three repeat), `agreementWith147`, `axisCorrelations(placed)` (pairwise, flag above 0.6), `reframeWithdrawCorrelation`, and `fitsMeDelta` (mean "fits me" rating of 2.0's top three minus the 147's). Tests use fixtures named `synthetic-*`. The file header states that no results exist. | M |
| O4 | 3+1 3D view (`plan.md` §9 phase 6) | Built now as B12. The owner decided not to wait for the pilot. | Done in B12 |

## 7. Guesses and decisions

Defaults stand unless the owner changes them. The owner answers Phase 0 before Phase 1 starts.

| ID | Question | Default guess | Why | Settled by |
|---|---|---|---|---|
| G1 | Depth reference when timing is unknown | Midpoint of the two defaults, 0.45 | Neither timing is supported | Pilot placement data (`plan.md` §11) |
| G2 | Map class when timing is unknown | `partType` undefined; family `manager` for layout only; `classKnown: false` | A class is an assertion | Owner review of the 3D view |
| G3 | Confidence with a narrow lead | Low on every path | `plan.md` §5: low when the margin is narrow | D2 tests |
| G4 | Lighter path answers | Kept in the draft; the builder ignores them | Turning lighter off restores them | Owner |
| G5 | Entry label for 2.0 | `observation` | 2.0 is the person's own report and placement | Owner, `plan.md` §6 wording |
| G6 | Map provenance by source | 64 canonical; placed user-authorship; 147 and defaults hypothesis | Matches the panel's status labels | `e13` spec |
| G7 | 2.0 in therapist shares | Listed as withheld | Off by default | Owner, sharing decision |
| G8 | Costume words in cards | Allowed only when they name the act, not the defence. The rationaliser's "reason" stays. | The rule is about the defence | Wording audit (§8) |
| G9 | Costume words in confirm items | Allowed; they describe behaviour | "I go into a screen" describes a behaviour | Wording audit |
| G10 | Time window rule | Stated once above the items on the same screen | Per-item prefixes break Russian grammar | Owner: amend `plan.md` §7 |
| G11 | Type-4 pairs | connection with agency, safety with aliveness; drop belonging with authenticity | Authenticity is not a need; belonging is Outsider's return | Owner: amend `plan.md` §3.4 |
| G12 | Gap wording | "Nothing comes to mind… It is not a score." | `plan.md` §5 | Copy review |
| G13 | Need → practice | As in B1 | Closest titles in the draft catalog | A named reviewer; gated until reviewed |
| G14 | Provisional map | Family default positions; top three marked | No picks needed | Owner |
| G15 | Need question | Stage 5, table default preselected, stored on tap | `plan.md` §4 places "what it wants" in stage 5 | Owner |
| G16 | Ids | Keep every id; copy-only fixes | Stored drafts and results may exist | Not needed |
| G17 | Provider forms | Keep the two ids; document the split | Renaming needs a migration | Owner |
| G18 | Capacity name | "Player" in English | Matches `plan.md` §3.2 | Owner |
| G19 | Centre inputs | Awareness 1–5; will 1–5; up to three of eight qualities; all skippable | Smallest set that reuses `SELF_QUALITIES` | Owner and copy review |
| G20 | Centre on the map | Not in v1 | The map is busy; the result carries it | Owner, after the pilot |
| G21 | Provider point offset | +0.25 energy, +0.25 direction, the exile's depth | "Beside" its exile, a small step | Visual check |
| G22 | Unknown axes on the 3D map | Ghost, do not hide. Refined by G31 (what fades) and G32 (how much). | Hiding changes every 64 user's map | Owner, `plan.md` §14 decision 1 |
| G23 | Stored result shape | `{savedAt, result}`; the bare shape still reads | Adds a date without changing the pure result | Owner |
| G24 | E16 screen | None until the owner decides | No consumer exists | Owner |
| G25 | Person summary | Deferred | Optional in `plan.md` §6 | Owner |
| G26 | Transpersonal layer | Deferred | Needs its own wording review | Owner |
| G27 | Results saved before D1 | Marked "timing may be a default" | Those timings were defaults | Owner |
| G28 | Tap weights | As in B11 | Estimates, not measurements | Pilot timing (`plan.md` §11) |
| G29 | Blending as the +1 channel | A halo ring around each part with known blending. The hue shows the sign: cool for "I can be with it", warm for "it runs me". The opacity is 0.12 + 0.68 × the strength. No ring when blending is unknown. | The plan makes blending the +1, not a position | Owner review of the 3D view |
| G30 | The lens | Highlight only, for every part. Family-only parts keep their ring layout and no longer move with the lens. | Coordinate parts never moved, so a lens that moved some parts looked broken | Owner |
| G31 | What fades | A part fades only when a spatial axis is one the person can still set and has not set: a 2.0 part that is unplaced, or whose depth is "not sure". Axes no answer could set (64 depth, 147 blending) are labelled, not faded. The label is in the detail view, and in the isolation view an "unknown" tag marks such a part (G38). | Fading every 64 and 147 part would dim the canonical maps for something the person cannot change | Owner, `plan.md` §14 decision 1 |
| G32 | How much a faded part fades | Half the normal opacity | At 0.6 the fade was hard to see at phone size | Owner review |
| G33 | Display spread | Parts within 2 units of each other spread on a ring whose neighbours are 2 units apart. Stored coordinates never change. | Figures are about 3 units wide, so near neighbours hide each other | Owner review; only overlapping parts move |
| G34 | Default camera | Slightly oblique, at (13, 9, 42), not straight on at (0, 0, 46) | Straight on, the direction axis points at the viewer and its label covers the centre | Owner review |
| G35 | Axis guides | Lines through the origin along the three chosen axes, with the end words beside each line. Hidden in isolation mode. | Readers need the axis names where the parts are | Owner review |
| G36 | Legend | Two sentences in the lens card, in English and Russian, explain the ring and the fade | Readers need the key where the lens is | Copy review |
| G37 | Blending on a provider point | Always unmeasured. The point copies the exile's unmeasured axes, and does not copy the exile's blending. | A provider was never asked about blending, so copying the exile's would invent an answer. Educated guess: keep the code and record the departure in `plan.md` section 14. | Owner: confirm or change |
| G38 | Unknown axes in stored coordinates | Keep a placeholder number in the unmeasured slot. `unmeasuredAxes` is the answer. The 3D map draws such parts at their placeholder positions. A 2.0 part with an unset spatial axis is ghosted (G31). A 64 or 147 unknown axis is labelled in the detail view. In the isolation view, a part with no value on that axis carries an "unknown" tag. The lens never counts an unmeasured axis. The depth slider exposes "not answered" to assistive technology. A studio part with no AI placement, or an all-zero placement, is unknown on every axis. | Making unknown `null` changes `MapCoordinates` and every reader, and needs a migration of stored parts. The readers already check the list. Educated guess: keep the placeholder and reword §1 and §2. | Owner: confirm or change |
| G39 | Energy of a 2.0 part with no answered level | Shown as an em dash, never as the layout default of 45. The energy filter keeps such parts visible. The 3D size scale keeps the default. | A capacity, a provider point, or a protector or exile with no level has no energy finding. The default showed as a percentage on the strip, the chips and the bars. Educated guess. | Owner: confirm or change |

**Owner tasks (no code can do these):**
1. Name a reviewer for the Russian copy. This blocks the final Russian text.
2. Confirm or change G7 (therapist shares).
3. Review the practice map and name a reviewer for the catalog. This blocks B1's titles.
4. Confirm G22, G31 (what fades) and G32 (how much).
5. Decide where E16 comparisons appear, if anywhere (G24).

## 8. Sequencing, PRs and checks

- **Phase 0** (owner, one day): answer the five owner tasks, and confirm or change G1–G28.
- **Phase 1** (defects): D1, D2, D3 and D4 in parallel, then D5, then D6.
- **Phase 2** (gaps): B3, B1, B2, B4, B5.
- **Phase 3** (builds): B9, B6, B7, B10, B12, then B11, whose test needs B6. B12 covers the 3D view and the planned B8.
- **Phase 4:** O3 can start at any time, since it has no dependencies. O1 and O2 only on request. O4 is done in B12.

**PRs:** new commits on this branch, reviewed as stacked draft PRs. Split them by phase if the owner wants each reviewed alone. PR #40 already carries the restore fix, which is separate from this plan.

**Checks for every PR**
- `npx tsc --noEmit`
- `npx vitest run <touched spec files>`, then `npm test`
- `npm run build` for any UI change
- `npm run test:browser -- --trace off`. The parity spec must still pass. Add a case for the timing skip and one for the lighter path.
- A wording audit for any copy PR: no costume word as the defence, and no part named in a way that reads as a diagnosis.
- A provenance guard: no 2.0 value carries `canonical-measurement`.

**Test files touched**
- `assessment2/assessment2.spec.ts`: D1, D2, D3, M8, the B6 validator, the B7 scoring.
- `core/parts-two-flow.spec.ts`: the B3 and B6 order, and the B11 tap budget.
- `core/parts2-universe.spec.ts`: the D1 adapter and the B7 points.
- `elevation/e02-entry.spec.ts` and `core/assessment-routes.spec.ts`: D4 labels, `measured`, and the save rule.
- `elevation/e13-grammar.spec.ts`: D4 per-source provenance.
- The `e15` specs: `NOT_INCLUDED`.
- New: `screens/parts-two-provisional` (B2), `assessment2/pilot-metrics.spec.ts` (O3), and `services/universe-3plus1.spec.ts` (B12).

## 9. Risks

| ID | Risk | Mitigation |
|---|---|---|
| R1 | Results saved before the fix show a default timing | Mark them (G27), and tell people in the reader to re-run 2.0. |
| R2 | An undefined `partType` breaks a path that assumes one | Capacities already have no `partType`. Test the 3D scene and the legacy report with an undefined value. |
| R3 | No reviewed practices, so B1 shows the gap only | Expected. The gate is intentional. |
| R4 | Relabelling 2.0 changes session continuity | G7 and the `e15` tests. |
| R5 | E16 has no screen, so B10 does nothing for users yet | Accepted. It is a module change until G24 is decided. |
| R6 | New strings drift between English and Russian | `copyCoverage`, and the Russian draft flag. |
| R7 | Browser timeouts under load | Re-run only the failing specs, with `--trace off`. |
| R8 | The 3D view changed for every map: camera, guides, halos, fades and spreading | The screenshot checks on a 2.0 map and the default example cast, the five universe browser specs, and owner review of G29–G36. |

## 10. Estimate (a guess)

B12, the 3D view, is already built. The remaining work is Phase 1 (about 5 days), Phase 2 (about 4), B9 (2), B6 (2), B7 (1.5), B10 (1.5), B11 (0.5) and O3 (2): about 18.5 working days for one developer. With about 20 per cent for review and fixes, the remainder is **about four to five weeks**. Phase 4 items are extra. The sizes are guesses, to be checked after the first PR.
