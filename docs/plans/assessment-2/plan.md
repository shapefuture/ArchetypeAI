# Assessment 2.0: plan

**Status:** implemented as the default route on branch `claude/jolly-babbage-7ibtyk`, 2026-11-10. See §14 for what was built and where it departs from this plan. Every number is still a guess until the pilot in §10 runs.
**Reads with:** `docs/parts-identification-handoff.md` (on branch `claude/full-plan-handoff-gmgpkq`), `src/shared/core/data/parts.ts`, `REVAMP_PLAN.md` §1.
**How to read the numbers:** every count, threshold, weight and time in this plan is an educated guess unless a source is named. Section 11 lists the guesses and what would settle each one.

## 1. What changes, in one paragraph

The 147-item questionnaire asks every person the same 147 frequency ratings and returns norm-based scores and a map whose coordinates are the same for everyone. Assessment 2.0 is a staged instrument of about 55 taps. It finds a person's few active protector strategies from reactions to concrete scenes, asks what each one guards, asks how the person relates to each part, and ends with the person placing their own parts on the map. The 147 stays available as an optional deep instrument. The two never share a record.

## 2. Targets

| Target | Guess | Why this number |
|---|---|---|
| Median time | 9 minutes | 147 items at ~6 s each is ~15 minutes before fatigue |
| Typical taps | 55, hard cap 70 | See the stage budget in §4 |
| Completion rate | at least 70% of starters | No current baseline found; measure the 147 first |
| First result | after 12 taps | Stage 1 alone must produce something worth seeing |
| Retest stability | 2 of the top 3 parts repeat after two weeks | Lowest bar at which a "top parts" list means anything |
| Agreement with 147 | top family matches the 147's top part's family in 60% of people | Loose on purpose; the instruments measure differently |

## 3. Model

A part is defined by a small grammar, not picked from a flat list: an unmet **need** produces a **wound** (the exile), guarded by a **strategy** (the protector), with a **timing**, a **target** and an optional **costume**.

### 3.1 Needs, exiles and providers

| Need | Exile | Core belief | Provider | What returns |
|---|---|---|---|---|
| Safety | Frightened | "Something bad is coming" | Guardian | Ease |
| Safety | Betrayed (new) | "People will hurt or use me" | Guardian | Discerning trust |
| Connection | Abandoned | "People leave" | Companion | Closeness |
| Connection | Outsider (new) | "I don't fit anywhere" | Companion | Belonging |
| Attunement | Unseen | "My needs don't matter" | Mirror | Knowing your own needs |
| Worth | Ashamed | "I am defective" or "I am bad" | Blesser | Self-acceptance |
| Agency | Powerless (new) | "I can't" or "I get swallowed" | Mentor | Will |
| Aliveness | Stifled (new) | "My joy, anger or desire is too much" | Playmate | Vitality |

### 3.2 Protector families and members

Existing ids are kept. New members are marked.

| Family | Members | Capacity (healthy twin) |
|---|---|---|
| Over-perform | taskmaster, perfectionist (new) | Maker |
| Over-control | controller, worrier (new), scanner (new) | Steward |
| Attack | inner_critic, rebel, superior (new), blamer (new), underminer (new) | Warrior |
| Appease | pleaser, caretaker (new), chameleon (new), martyr (new) | Caregiver |
| Pursue | charmer, clinger (new), helpless (new) | Reacher |
| Withdraw | hermit, analyst, avoider (new) | Sage |
| Numb or soothe | numb, soother (new), thrill_seeker (new) | Player |
| Reframe | bypasser, rationaliser (new), minimiser (new), funster (new), dreamer (new) | Meaning-maker |

That is 8 families and 28 members: the 10 existing protectors and 18 new ones.

**Capacity name (G18):** the healthy twin of numb or soothe is called "Player" in English. The Russian name stays «Исследователь».

Attributes on each instance of a part:

- **Timing:** preventive or reactive. This replaces the fixed manager and firefighter classes.
- **Target:** self, others or the situation.
- **Costume (optional tag):** faith, humour, reason, work, food, screens, body, money, sex. The costume never decides the family; the effect on the feeling does.

### 3.3 Resources

| Kind | Content |
|---|---|
| Centre | Self: awareness ("I have this part, I am not it") and will, with the eight qualities. A transpersonal layer is opt-in. |
| Capacities | The eight twins in §3.2 |
| Providers | The six roles in §3.1, each in a form the person chooses: own adult self, a real or ideal person, an ancestor, an animal helper, a place, a spiritual figure, a fictional character |
| Ground | Calm place, body anchor, breath or rhythm, nature, real people |

**Ground item (G16):** `containerForLater` reads "Set it down somewhere safe to come back to later". The wording follows the IFS container practice. The id stays, because stored drafts and results may exist.

**Provider forms (G17):** the "real or ideal person" above is two forms, `realPerson` and `idealParent`, each with its own id. Both stay. Renaming either id would need a migration.

### 3.4 Conflicts

Four types, derived from the result and not from a fixed list:

1. Strategy against strategy: two protectors guard the same exile in opposite ways.
2. Protector against exile: a part blocks a feeling.
3. Critic against the one criticised.
4. Need against need: connection against agency, safety against aliveness.

### 3.5 Axes

| Axis | −1 | +1 | Source |
|---|---|---|---|
| Energy | shut down | mobilised | family default, then the person's placement |
| Direction | away from people | toward people | family default, then the person's placement |
| Depth | deep, hidden | surface, visible | layer default, then the person's placement |
| Blending (+1) | I can be with it | it runs me | the Toward answer in stage 5 |

Energy, Direction and Depth are the three plotted axes. Blending is the "+1" value.

**The 64 projection** (`legacy64ToMapPlacement`, `src/shared/core/data/map-axes.ts:54`) sets energy to (temperature − agency) ÷ 2 and direction to (focus + attachment) ÷ 2. Depth and blending are unmeasured. Read against the 64 pole labels in `screens/legacy-report.jsx`, energy is positive for Active and Expressive, and negative for Receptive and Composed. Direction is positive for Other-focused and Anxious, and negative for Self-focused and Avoidant. The formula is a guess. `src/shared/core/data/map-axes-projection.spec.ts` checks its signs against those labels.

## 4. Flow

| Stage | The person does | Taps | Minutes | Output |
|---|---|---|---|---|
| 0. Ground | Rates how steady they feel now; reads what the result is and is not | 2 | 0.3 | Whether to offer the lighter path |
| 1. Scenes | Six scenes; picks "most like me" and "least like me" among five reaction cards | 12 | 2.5 | Family ranking; trigger-to-family links |
| 2. Narrow | For each top family, picks the member card that fits, then timing | 6–9 | 1.5 | Up to five named protectors |
| 3. Confirm | Three "how often in the last month" items per uncertain protector | 0–12 | 1.5 | Level and confidence |
| 4. Beneath | Per top protector: "if this part stopped, what would it fear?"; then one level item per exile named | 6–9 | 1.5 | Exiles and personal guard links |
| 5. Toward and resources | Per part: "how do you feel toward it?" Per exile: what it wants, and whether anything gives that. One screen each for capacities and ground | 12–16 | 2 | Blending, providers, capacities, ground |
| 6. Place | Drags each top part on two pads, starting from its default | 0–10 | 1.5 | Personal coordinates |

Rules for the flow:

- Progress saves after every stage, and the person can stop and resume.
- A provisional map exists after stage 1 and gains detail at each stage.
- Every question can be skipped. A skipped answer is stored as unknown.
- The lighter path (low ground rating, or the person chooses it) skips stage 4 and the exile questions in stage 5.
- Stage 1 alone replaces the 14-item Quick Scan as the entry point.

### 4.1 Stage 1 design

Each scene shows five of the eight families. Six families appear four times and two appear three times.

| Scene (existing event type) | Families shown |
|---|---|
| Someone criticises your work (achievement) | Over-perform, Attack, Appease, Withdraw, Reframe |
| You are left out (relational) | Pursue, Appease, Withdraw, Numb, Attack |
| Someone crosses a line (boundary) | Attack, Appease, Over-control, Withdraw, Reframe |
| Something you wanted falls through (loss) | Numb, Reframe, Pursue, Over-perform, Over-control |
| Plans change with no warning (change) | Over-control, Over-perform, Pursue, Numb, Reframe |
| A free evening with nothing to do (calm) | Over-perform, Numb, Over-control, Pursue, Withdraw |

Card order is fixed per scene, so the same answers always give the same result.

## 5. Scoring

No norm tables. The headline is a ranking within the person, with a raw level where one was measured.

- **Family score:** (times chosen "most" − times chosen "least") ÷ appearances. Range −1 to 1.
- **Top families:** the three highest, plus the fourth if it is within 0.15 of the third.
- **Skip stage 3 for a protector** when its family was chosen "most" in at least three quarters of its appearances and never "least".
- **Level:** the mean of the three confirm items, 1 to 5. Without confirm items the level is unknown and only the rank is shown.
- **Confidence:** high when scenes and confirm items agree; medium when scenes alone were decisive; low when the margin was narrow.
- **Guard links:** the exiles the person picked in stage 4. The fixed `GUARDS` weights are used only as the order of the options.
- **Blending:** curious or warm −0.6; neutral 0; annoyed or afraid +0.4; "it is me" +1.
- **Provider access:** easily, with effort, or no. "No" is reported as a gap with a suggested practice, not as a deficit score.

### 5.1 Default coordinates

Used until the person places the part, and labelled `reference`.

| Family | Energy | Direction |
|---|---|---|
| Over-perform | +0.7 | 0.0 |
| Over-control | +0.5 | −0.1 |
| Attack | +0.8 | +0.3 |
| Appease | +0.2 | +0.8 |
| Pursue | +0.6 | +0.9 |
| Withdraw | −0.4 | −0.8 |
| Numb or soothe | −0.8 | −0.5 |
| Reframe | −0.1 | −0.3 |

Depth defaults: preventive protector +0.6, reactive protector +0.3, exile −0.7. A provider sits beside its exile. A capacity sits at its family's position.

Attack fits Direction poorly, because it moves against people and not toward or away. The Target attribute carries that difference.

### 5.2 Conflict derivation

- Type 1: two top protectors share an exile and differ by at least 1.0 on Energy or on Direction.
- Type 2: a protector with Blending of +0.4 or more guards an exile whose level is 4 or more.
- Type 3: an Attack member with target "self" is present together with Ashamed.
- Type 4: looked up from the needs of the two highest exiles.

## 6. Data

A new record type, stored beside 64 and 147 results and never merged with them.

```ts
interface Assessment2Result {
  instrument: 'parts-2';
  version: 1;
  completedStages: number[];            // 0..6
  familyScores: Record<FamilyId, number | null>;
  parts: Part2[];                        // up to five protectors, up to three exiles
  // no top-level providers: each exile part carries its own (see Part2)
  capacities: { easiest: CapacityId | null; hardest: CapacityId | null };
  ground: string[];
  conflicts: Conflict2[];                // derived, recomputed on read
}

interface Part2 {
  id: string;                            // existing ids kept; new ids added
  layer: 'protector' | 'exile';
  family?: FamilyId;
  timing?: 'preventive' | 'reactive';
  target?: 'self' | 'others' | 'situation';
  costume?: string;
  rank: number;
  level: number | null;                  // 1..5, null when not measured
  confidence: 'high' | 'medium' | 'low';
  guards?: string[];                     // exile ids the person named
  coordinates: [number, number, number, number]; // MAP_AXIS_KEYS order: energy, direction, depth, blending; each in [-1, 1]
  unmeasuredAxes: MapAxisKey[];                  // readers treat these axes as unknown
  placement: 'placed' | 'default';
  depthState: 'set' | 'unsure' | 'unanswered';
  provider?: { access: 'easy' | 'effort' | 'none'; form: ProviderForm | null }; // exile parts only
}
```

**Built shape.** This matches `src/shared/core/data/map-axes.ts` and the 64 and 147 map parts. `coordinates` is the four-slot tuple in `MAP_AXIS_KEYS` order (energy, direction, depth, blending). An axis in `unmeasuredAxes` keeps a placeholder in its slot, and readers treat it as unknown. The 64 parts measure energy and direction, and leave depth and blending unmeasured. The 147 parts take energy, direction and depth from the reference table, and leave blending unmeasured. In a 2.0 result, `placement` is `placed` when energy, direction or depth was set, and `default` otherwise. `depthState` is `set` when depth was set, `unsure` when the person chose "not sure", and `unanswered` otherwise. Each exile part carries its own `provider` (`access` and `form`), and there is no top-level list.

Rules carried over from the current code:

- Unknown is never shown as zero. An unmeasured axis may keep a placeholder in its coordinates slot, and `unmeasuredAxes` marks it.
- The same answers always produce the same result.
- `parts.ts` says ids are never renamed. This plan adds ids and attributes and renames nothing.

For E16, each part already has one four-number vector, so `threePlusOne` and `compareResults` can take a part's coordinates directly. A person-level summary, if wanted, is the rank-weighted centre of the parts and is labelled `derived`.

## 7. Content to write

| Item | Count | Notes |
|---|---|---|
| Scene texts | 6 | |
| Reaction cards | 30 | One per family per scene; written as a first reaction, with no part names |
| Member cards | 28 | Two sentences each |
| Confirm items | 84 | Three per member; about 30 can be adapted from the existing bank for the 10 existing ids |
| Exile fear options | 8 | One line each |
| Need, provider, capacity and ground options | about 30 | |
| Result copy | per member, exile, provider and conflict type | |

All copy is needed in English and Russian. Russian follows `src/shared/i18n/strings.ts`: «вы», and its fixed terms.

Wording rules:

- Describe what the reaction does, not its costume. A card must not say or imply that faith, humour or reasoning is a defence in itself.
- One behaviour per item. The time window is stated once, above the items on the same screen (G10), not repeated on each item.
- No reverse-keyed items.

## 8. Safety

- The result is a reflective lens, not a diagnosis, and says so at stage 0 and on the result.
- Parts involving self-harm, suicidal urges or severe dissociation are not in the taxonomy.
- The support footer appears when the ground rating is at its lowest, or when three exiles are rated 5.
- The app stops at resourcing. It suggests practices and does not guide reparenting of deep wounds.
- A provider can be a protector in disguise. The result copy uses one test throughout: after contact, was the feeling met or skipped?

## 9. Build phases

| Phase | Work | Size guess |
|---|---|---|
| 0 | Owner decisions (§12); first content draft in both languages | 1 week |
| 1 | Taxonomy data module, record type, pure scoring functions and their tests | 1 week |
| 2 | Stages 0–2 screens; provisional result; replace the Quick Scan entry | 1 week |
| 3 | Stages 3–5 screens; conflict derivation; result screen | 1.5 weeks |
| 4 | Stage 6 placement; coordinates panel on the new axes; 3+1 as a table | 1 week |
| 5 | Pilot (§10) | 3 weeks elapsed |
| 6 | Decide on defaults; 3D scene for the 3+1 view | The 3D scene is built now, by owner decision (2026-11-10; see build-and-fix-plan.md B12). The defaults still wait for the pilot. |

Suggested locations, to be confirmed against the code at build time: data and scoring under `src/shared/core/data/`, screens under `src/parts-cartographer/screens/`.

## 10. Pilot and stop conditions

Run with 30 to 50 people who take both the 147 and 2.0, a week apart in random order, and 2.0 again two weeks later.

| Measure | Pass |
|---|---|
| Completion and median time | meets §2 |
| Retest | 2 of top 3 parts repeat |
| Agreement with 147 | meets §2 |
| "This fits me" rating of the top three parts | higher than for the 147 result |
| Axis independence | no pair of Energy, Direction, Depth correlates above 0.6 across placed parts |
| Reframe against Withdraw | scores do not move together above 0.6 |

If retest fails, 2.0 does not replace anything and the scenes are rewritten first. If axis independence fails, the axes are re-derived from the placement data. If Reframe and Withdraw move together, they merge into one family.

## 11. Guesses and what settles them

| Guess | Settled by |
|---|---|
| Six needs, eight exiles | Whether pilot users pick "none of these fit" in stage 4 |
| Eight families separate in practice | Family score correlations in the pilot |
| 28 members is the right grain | How often people choose no member in stage 2 |
| Five cards per scene | Time per screen and skip rate |
| Top-three cut and the 0.15 margin | Retest stability at other cuts |
| Three confirm items are enough | Agreement between the three-item level and the full eight-item score on existing ids |
| Blending values per answer | Agreement with a direct blending rating in the pilot |
| Default coordinates | Mean of the positions people place |
| Times and tap counts | Pilot timing |
| Forced choice is more honest than ratings | "Fits me" ratings and retest, against the 147 |

## 12. Decisions for the owner

1. Does 2.0 become the default path, with the 147 as the optional deep instrument?
2. Do the new axes replace the current four everywhere, or only for 2.0 results?
3. Are faith and ancestry offered as provider forms and costumes, or held back for a later version?
4. Is the exile stage on by default, or opt-in?
5. Who writes and reviews the Russian content?

## 13. Limits

- Forced choice ranks parts within one person. It supports comparison between people less well, so the pair comparison built on 147 profiles should keep using the 147.
- Stage 3 uses fixed rules. Statistical item models need answers from a few hundred people.
- The taxonomy combines several therapy traditions by judgement. Schema-mode questionnaires have published support; the family grouping, the capacity twins and the six providers do not.

## 14. Implementation status (2026-11-10)

Owner decisions applied: Assessment 2.0 is the default route; the four map axes are replaced everywhere the map plots, lenses, compares or labels coordinates; faith and ancestry are included now; the exile stage is on.

### Built

| Piece | Where |
|---|---|
| Taxonomy: needs, eight exiles, eight families, 28 members, providers, capacities, ground, costumes | `src/shared/core/data/assessment2/taxonomy.ts` |
| Map axes (Energy, Direction, Depth, Blending), the 64 projection, unmeasured-axis handling | `src/shared/core/data/map-axes.ts` |
| Scoring: family scores, top families, skip rule, level, confidence, conflicts, result builder, validator | `src/shared/core/data/assessment2/scoring.ts` |
| Bilingual copy, exhaustive over the taxonomy | `src/shared/core/data/assessment2/content.ts` |
| Screen order and stage mapping (pure) | `src/parts-cartographer/core/parts-two-flow.ts` |
| Screens (stages 0–6, result) and the placement pad | `src/parts-cartographer/screens/parts-two.jsx`, `parts-two-pad.jsx`, `parts-two.css` |
| Result to map parts | `src/parts-cartographer/core/parts2-universe-adapter.ts` |
| Stored-axis migration on load | `src/parts-cartographer/core/usable-parts.ts` |
| Routes: 2.0 first and recommended; 147 labelled as the optional deep battery; Quick Scan removed, with its copy keys (M9) | `core/assessment-routes.ts`, `core/boot.ts`, `screens/landing.jsx`, `elevation/e02-entry.ts` |
| Timing is stored as unknown when skipped (D1); a lead under 0.15 makes the result low on every path (D2) | `src/shared/core/data/assessment2/scoring.ts` |
| Stage 5: the exile's need and blend, after the exile is named (B3); the Centre (B6) | `core/parts-two-flow.ts`, `screens/parts-two.jsx` |
| Provider points on the 3D map, named by their short role (B7) | `core/parts2-universe-adapter.ts` |
| Stored result: written, read back before the draft is cleared, and shown as the last result (B9) | `core/parts-two-store.ts`, `screens/parts-two.jsx` |
| Provisional family pad after the first pick and on the result, top three marked (B2) | `screens/parts-two.jsx` |
| 3D view: 3+1, ring and fade, guides and camera (B12) | See build-and-fix-plan.md, B12 |
| E16 comparison, module side only: 2.0 parts as records, provenance from placement (B10); no screen (G24) | `elevation/e16-disagreement.ts` |
| Pilot analysis functions, tested on synthetic fixtures only (O3) | `src/shared/core/data/assessment2/pilot-metrics.ts` |

### Departures from the proposal

- **Blending** has six options. `neutral` (0) is added to the five in §4.
- **Stage 2** allows one member per top family, so at most four protectors, not five. The record allows one exile per protector, so at most four exile parts, not three.
- **Target** is each member's default. It is not asked per instance.
- **Costume** is an optional tag asked in stage 2. The taxonomy includes faith and ancestry.
- **Placement** uses one pad (Energy and Direction) plus a Depth slider, not two pads. Blending is set in stage 5.
- **Capacities** appear as parts only when the person names an easiest or hardest one.
- **64-derived parts** have Depth and Blending unmeasured. They sit at the middle depth on the 3D map, and the coordinates panel shows those axes as unknown.
- **147 reference parts** have Blending unmeasured. Their Energy, Direction and Depth come from the taxonomy defaults.
- **Interpretation of "everywhere":** the 64 instrument's own relational scoring, synastry, report and backup keep their original names, because the 64 result and its backups must still read across versions. Only the map-facing layer uses the new axes.
- **Stage 5 order:** the exile's need and blend are asked after the exile is named (B3), and the provider point comes after them.
- **The Centre** (B6) is stage 5, after capacity. It asks awareness and will from 1 to 5, and up to three of eight qualities, and each is skippable (G19). It is not drawn on the map (G20).
- **Provider points** are drawn beside their exile as resource points (B7). Each is named by its short role (Guardian, Companion, Mirror, Blesser, Mentor, Playmate). It has no blurb, and the full sentence stays on the provider screen.
- **Ground copy:** the "set it down for later" item has the B4 wording. Ids are unchanged (G16).
- **Coordinates** are a four-slot tuple in map-axis order, with the list of unmeasured axes (B5). Section 6 shows the built shape.
- **Capacity name:** the English name of the healthy twin of numb or soothe is Player (G18). The Russian name is unchanged.
- **Provider blending:** a provider point never has a blending value, so its blending stays unmeasured even when its exile's blending is known (build-and-fix G37).
- **Unknown axes:** a stored unknown axis keeps a placeholder number in its coordinates slot, and `unmeasuredAxes` names it. Readers check that list, and no screen shows the placeholder as a value (build-and-fix G38).

### Guesses this build depends on (to be settled by the pilot)

- Family default positions (§5.1), the exile default positions, and the player capacity position are guesses.
- The stage-1 scene families and the 0.15 margin for a fourth family are guesses.
- The confidence thresholds (level 3, score 0.25) are guesses.
- The Russian copy is a first draft written by the implementing agent. A native speaker has not reviewed it. The owner was asked to assign a reviewer (§12, item 5).

### Review and what changed after it

An independent review of the first build found the issues below. Fixed in this change:

- 64-derived parts were re-projected on every load, because the adapter omitted the axis version marker. Fixed: the marker is written, and a test checks that coordinates survive a reload. AI-created studio parts and the studio base get the marker too.
- The 3D lens affinity counted an unmeasured axis as a measured zero. Fixed: unmeasured axes are left out of the affinity.
- Every question could not be skipped. Fixed: steadiness, timing, exile level, blending and provider each have a skip, stored as unknown. Pick and fear use none-fits.
- A fear left on a member who was later changed still named an exile. Fixed: only the members currently picked name exiles.
- Conflicts were derived from exiles with unknown levels, which were ranked as zero. Fixed: only measured levels are compared.
- Confidence ignored the lead over the next family. Fixed: a lead under 0.15 makes the result low. A level now needs all three confirm items, as plan §5 says.
- The two Quick Scan buttons still read Quick scan. Fixed: they now show the 2.0 title. Self-placed coordinates were labelled measured. Fixed: they are labelled derived.
- The provider screen did not carry the plan §8 test. Fixed: the test is shown there. Pick screens now show the provisional family ranking from the first six choices.

Depth answers, found when the question was asked: placement stored the default depth as the person's answer, and skipping placement left depth looking known. Fixed: each axis is recorded only when the person sets it, and a drag answers only the axis it moved along (a press answers both). Depth has three states: set, not sure, and not answered. Unset axes are unknown in the coordinates panel, which applies the map's axis migration to stored parts, so an earlier record reads the same in both places. The lens (the visual view over the 3D map, `universe-lens.ts`) and the conflict checks leave unset axes out. The 3D map still draws them at reference positions. B12 decided that unset axes are ghosted and labelled, not hidden (G22, G31, G32). Parts and drafts saved by the earlier build are read with depth unknown, and their placements are not resumed. Cloud copies and history restores keep the unknown flags. Re-run 2.0 to correct earlier placements.

Departures the review raised, now recorded as decisions:

- Provider forms include your future self, from the resource discussion. Plan §3.3 did not list it.
- A low ground rating shows a hint and the lighter option. It does not switch the path automatically, because the owner chose exile on by default.

Open decisions, with their status:

- Unknown axes on the 3D map: decided in B12. Unknown axes are ghosted, not hidden, and never shown as zero (G22, G31, G32).
- 64-derived parts have depth unmeasured: decided in B12. They sit on the middle plane, labelled and not faded (G31). Hiding them remains the alternative, because it would change what every 64 user sees.
- Stored 2.0 results: built in B9. The result is written and read back before the draft is cleared, and the last result is shown. A result saved before 9b8d6a9 lacks rank and confidence, so it is rejected (a known gap).
- The provisional view after stage 1: built in B2 as a read-only family pad after the first pick and on the result, with the top three marked. There is still no map before stage 2, because a map needs picks.
- The Russian copy still needs a native-speaker review (owner task 1).

### Gates (checked 2026-11-11)

- Follow-up fixes (2026-11-11): `npx tsc --noEmit` passes; `npm test` gives 253 test files and 1,881 tests passing; `npm run build` passes; `tests/browser/parity.spec.mjs` gives 9 of 9, with a skipped-timing case and a lighter-path case. The full browser suite gave 88 of 89. The one failure, `report-retake.spec.mjs` "starts over once the person agrees", waits 5 seconds for the Report panel. It passed 8 of 8 when repeated alone, which is the load-timeout handling in build-and-fix §2 and R7.
- `npx tsc --noEmit`: passes at 4c2e627.
- `npm test` (`npx vitest run`): 252 test files and 1,879 tests pass at 2af4f5e, including new specs for the taxonomy, scoring, screen order, adapter, migration, the E16 module side, the pilot functions and the tap budget.
- `npm run build`: passes at 4c2e627.
- Browser, full suite run locally at 661319f: 87 passed, 0 failed. The round18 P2 test used to fail when a poll from the test missed the toast under load, or when it read the toast's box after the toast had left. It now waits for the toast in the page, and no assertion changed. CI on 4c2e627 passed all four browser shards, and the same test failed once in CI on a04b517.
- `tests/browser/parity.spec.mjs` drives the whole 2.0 flow to a saved map, with no 147 profile written and no page errors. It passes in the full local run.
- Tap budget (B11): the owner raised the targets to 57 and 73 on 2026-11-11, and `src/parts-cartographer/core/parts-two-tap-budget.spec.ts` checks them.
