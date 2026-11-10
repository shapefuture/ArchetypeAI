# Assessment 2.0: plan

**Status:** proposal, 2026-11-10. Nothing here is built or validated.
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

### 3.4 Conflicts

Four types, derived from the result and not from a fixed list:

1. Strategy against strategy: two protectors guard the same exile in opposite ways.
2. Protector against exile: a part blocks a feeling.
3. Critic against the one criticised.
4. Need against need: connection against agency, safety against aliveness, belonging against authenticity.

### 3.5 Axes

| Axis | −1 | +1 | Source |
|---|---|---|---|
| Energy | shut down | mobilised | family default, then the person's placement |
| Direction | away from people | toward people | family default, then the person's placement |
| Depth | deep, hidden | surface, visible | layer default, then the person's placement |
| Blending (+1) | I can be with it | it runs me | the Toward answer in stage 5 |

Energy, Direction and Depth are the three plotted axes. Blending is the "+1" value.

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
  providers: { need: NeedId; access: 'easy' | 'effort' | 'none' | null; form?: string }[];
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
  coords: Record<'energy' | 'direction' | 'depth' | 'blending',
    { value: number | null; status: 'measured' | 'reference' | 'unknown' }>;
}
```

Rules carried over from the current code:

- Unknown is never stored or shown as zero.
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
- One behaviour per item. A stated time window on every frequency item.
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
| 6 | Decide on defaults; 3D scene for the 3+1 view | after the pilot |

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
