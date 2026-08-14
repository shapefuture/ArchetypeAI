# REVAMP_PLAN.md — ArchetypeAI → "INNERVERSE"

**All decisions in this document are FINAL. Do not substitute your own judgment. If something is ambiguous, implement the literal reading.**

---

## 0. Diagnosis of current app (why it's 1/10)

1. **Measurement is fake.** 64 items → 4 bipolar averages → coordinates → names picked by `hashCoordinates()` from pools. Two users with identical psychology get different archetype names. Nothing is normed, nothing has reliability, no validity checks.
2. **Archetypes are cosmetic.** `assignCluster()` is a 400-line if-thicket over 4 numbers. Parts (`manager/firefighter/exile`) are assigned FROM cluster names, not measured.
3. **Synastry is geometry.** `avgDelta` of pole scores + hardcoded prose matrices. No model of *interaction*.
4. **No product spine.** No daily loop, no retention mechanic, no reason to return after the report.

Everything below replaces this. **Delete** `scoring.ts` NAME_POOLS/hash-picking, `assignCluster`, `buildProfiles`, `deriveDevelopmentalOrigin`. Keep the deterministic principle: same answers → same result.

---

## 1. The Measurement Model (core IP)

### 1.1 The Parts Taxonomy — HARDCODED, 14 shadow parts + 4 resources + Self

Grounded in IFS (Schwartz), attachment research, and the empirically recurring protector/exile clusters seen in IFS clinical literature and adjacent instruments (IPQ, YSQ schema modes). These 18 (+Self) are the app’s fixed vocabulary. IDs are stable API strings — never rename.

**MANAGERS (proactive protectors)**
| id | Display name | Protects against | Core strategy |
|---|---|---|---|
| `taskmaster` | The Taskmaster | worthlessness | achievement, perfectionism |
| `inner_critic` | The Inner Critic | external shame | preemptive self-attack |
| `pleaser` | The Pleaser | abandonment | appeasement, caretaking |
| `controller` | The Controller | chaos/helplessness | planning, rigidity, control |
| `analyst` | The Analyst | overwhelming feeling | intellectualizing, detachment |
| `hermit` | The Hermit | social threat/overwhelm | proactive isolation, withdrawal |
| `bypasser` | The Bypasser | unbearable feeling | spiritual/positivity reframing, transcendence-as-escape |

**FIREFIGHTERS (reactive protectors)**
| id | Display name | Douses | Strategy |
|---|---|---|---|
| `numb` | The Fog | any exile flare | dissociation, scrolling, substances |
| `rebel` | The Rebel | engulfment/control | anger, defiance, blowing things up |
| `charmer` | The Charmer | insignificance | seduction, performance, intensity-seeking |

**EXILES (wounded parts)**
| id | Display name | Core wound belief |
|---|---|---|
| `abandoned` | The Abandoned One | "I will be left." |
| `ashamed` | The Ashamed One | "I am defective." |
| `frightened` | The Frightened One | "I am not safe." |
| `unseen` | The Unseen One | "I do not matter." |

**RESOURCES (Self-led parts)** — measured, not just derived. 4 families, 6 items each:
| id | Display name | Core need served | Healthy expression |
|---|---|---|---|
| `sage` | The Sage | wisdom/meaning | perspective, guidance |
| `warrior` | The Warrior | courage/agency | boundaries, decisive action |
| `caregiver` | The Caregiver | nurturing | self-compassion, tending others without self-erasure |
| `explorer` | The Explorer | discovery/joy | curiosity, play, experimentation |

Resource T-scores use the same formula (§1.3; norms there). Resources render on the constellation as a fourth ring (bright, gold-tinted). **Every report leads with the strongest resource before any shadow content** — strength-first framing is non-negotiable.

**SELF** — `self_energy`: single 0–100 index of the 8 C's (calm, curiosity, clarity, compassion, confidence, courage, creativity, connectedness). Not a part; a global moderator.

### 1.2 Item bank — 147 items, exact structure

- **Scored items**: 14 shadow parts × 8 = 112, plus 4 resource parts × 6 = 24, plus 8 Self-energy items = **144 scored**; plus 3 validity items = **147 total**, delivered in 3 sittings of ~49 (see §4). 5-point Likert ("Never true of me" … "Almost always true of me"). Shadow parts: 6 positively keyed, 2 reverse-keyed each. Resources and Self: positively keyed.
- **Validity items** (fixed positions 40, 84, 120): one attention check ("Select 'Sometimes' for this item"), two infrequency items ("I have never felt any emotion of any kind"). Fail = flag, not block.
- Item wording: write behaviorally, present-tense, no jargon. Every part's 8 items cover: trigger (2), behavior (3), internal narration (2), somatic marker (1). Store in `src/i18n` keyed `items.<part_id>.q1..q8` (en+ru).
- Attachment style is **derived**, not separately measured: anxious = f(abandoned, pleaser), avoidant = f(analyst, numb, hermit) — see §1.6.

### 1.3 Scoring algorithm — exact spec

```
For each part p:
  raw_p   = Σ item scores (reverse-keyed: 6 − score)      // range 8..40
  T_p     = 50 + 10 * (raw_p − NORM_MEAN[p]) / NORM_SD[p]  // clamp 20..80
```

**Hardcoded provisional norm table** (replace after 5k users via remote config; until then these ship):

```ts
const NORM_MEAN: Record<PartId, number> = {
  taskmaster: 26, inner_critic: 25, pleaser: 26, controller: 25, analyst: 25, hermit: 22, bypasser: 21,
  numb: 22, rebel: 20, charmer: 21,
  abandoned: 21, ashamed: 21, frightened: 20, unseen: 22,
};
const NORM_SD: Record<PartId, number> = {
  taskmaster: 6, inner_critic: 6.5, pleaser: 6, controller: 6, analyst: 6, hermit: 6, bypasser: 5.5,
  numb: 6, rebel: 5.5, charmer: 5.5,
  abandoned: 6.5, ashamed: 6.5, frightened: 6, unseen: 6.5,
};
```

**Self-energy**: `self_energy = round(100 * (raw_self − 8) / 32)`.

**Resources** (6 items, raw 6..30): same T formula with `NORM_MEAN = 20, NORM_SD = 4.5` for all four (provisional).

**Activation tiers** (drive all UI): T < 45 `dormant`, 45–59 `present`, 60–69 `prominent`, ≥ 70 `dominant`.

**Burden score** (how much the system is working): `burden = mean(T of all 4 exiles) * 0.5 + max(T of protectors) * 0.3 + (100 − self_energy)/2 * 0.2`, rescaled to 0–100 via `(burden − 40) * 2.5` clamped 0–100.

### 1.4 System-dynamics detection (this replaces "gestalts")

**Polarization pairs** — HARDCODED protector↔protector oppositions. A polarization fires when both parts ≥ 60T:

```ts
const POLARIZATIONS: [PartId, PartId, string][] = [
  ['taskmaster','numb',   'Grind–Collapse Cycle'],
  ['pleaser','rebel',     'Compliance–Explosion Cycle'],
  ['controller','rebel',  'Clampdown–Breakout Cycle'],
  ['analyst','charmer',   'Freeze–Perform Split'],
  ['inner_critic','charmer','Shame–Display Split'],
  ['controller','numb',   'White-Knuckle–Checkout Cycle'],
  ['hermit','charmer',    'Cave–Stage Split'],
  ['bypasser','rebel',    'Halo–Havoc Cycle'],
];
```

**Protector→exile guardianship** — HARDCODED weights (which protector guards which exile). Used for report narrative and synastry triggers:

```ts
const GUARDS: Record<ProtectorId, Partial<Record<ExileId, number>>> = {
  taskmaster:   { ashamed: .7, unseen: .3 },
  inner_critic: { ashamed: .8, abandoned: .2 },
  pleaser:      { abandoned: .7, unseen: .3 },
  controller:   { frightened: .8, abandoned: .2 },
  analyst:      { frightened: .5, ashamed: .5 },
  numb:         { frightened: .4, ashamed: .3, abandoned: .3 },
  rebel:        { unseen: .5, frightened: .5 },
  charmer:      { unseen: .7, abandoned: .3 },
  hermit:       { frightened: .4, ashamed: .3, unseen: .3 },
  bypasser:     { ashamed: .4, frightened: .3, abandoned: .3 },
};
```

**Constellation** (the user's headline result, replaces cluster names). Deterministic: take the top protector P1 and top exile E1 by T-score (ties → the earlier id in the table order above). Headline = one of 10×4=40 hardcoded named constellations, e.g. `taskmaster×ashamed` → "The Proving Ground", `pleaser×abandoned` → "The Tending Fire", `analyst×frightened` → "The Glass Observatory", `rebel×unseen` → "The Signal Flare". Copywriter delivers all 40 names + 150-word essays (en/ru); engineering treats them as data in `constellations.ts`. **Do not generate names algorithmically. Ever.**

### 1.5 Subtype layer — 56 named parts (two-tier taxonomy)

IFS holds that parts are countless and idiosyncratic; 14 scales is a *measurement* ceiling (reliable scales need ≥8 items each), not a claim that there are 14 parts. So: the 14 families are what we **measure**; what the user **meets** is one of 4 subtypes per family = **56 named parts**, resolved deterministically with no extra items.

**Rule:** for each family with T ≥ 45, its subtype = the highest-T family among its 4 designated "colorers" (ties → earlier column). If no colorer ≥ 45T, use the base subtype (column 1). Subtype affects name + essay only; all math uses family T-scores.

```
family        | base (col 1)        | colored by →  subtype
taskmaster    | The Striver         | inner_critic→The Perfectionist | controller→The Machine   | charmer→The Star Performer | analyst→The Optimizer
inner_critic  | The Critic          | taskmaster→The Slave Driver    | ashamed→The Prosecutor   | pleaser→The Apologist      | analyst→The Auditor
pleaser      | The Helper          | abandoned→The Clinger          | taskmaster→The Martyr    | charmer→The Diplomat       | unseen→The Ghostwriter
controller    | The Planner         | frightened→The Sentry          | taskmaster→The Foreman   | analyst→The Chessmaster    | rebel→The Tyrant
analyst       | The Observer        | numb→The Wall                  | controller→The Architect | inner_critic→The Skeptic   | frightened→The Watchtower
numb          | The Fog             | analyst→The Deep Freeze        | charmer→The Escape Artist| abandoned→The Hibernator   | rebel→The Saboteur
rebel         | The Rebel           | frightened→The Cornered One    | unseen→The Provocateur   | numb→The Burnout           | charmer→The Outlaw
charmer       | The Charmer         | unseen→The Spotlight Chaser    | abandoned→The Enchanter  | taskmaster→The Impresario  | rebel→The Flirt with Fire
hermit        | The Hermit          | frightened→The Bunker Keeper   | analyst→The Lighthouse   | ashamed→The Veiled One     | numb→The Deep Cave
bypasser      | The Bypasser        | ashamed→The Gilded Mask        | pleaser→The Blissful Helper | analyst→The Abstractor  | frightened→The Sky Gazer
abandoned     | The Abandoned One   | pleaser→The Orphan Who Serves  | charmer→The Hungry Heart | frightened→The Small Hours | numb→The Empty Room
ashamed       | The Ashamed One     | inner_critic→The Branded One   | taskmaster→The Impostor  | unseen→The Hidden Face     | charmer→The Masked One
frightened    | The Frightened One  | controller→The Braced One      | analyst→The Vigilant     | abandoned→The Startled Child| numb→The Frozen One
unseen        | The Unseen One      | charmer→The Echo               | pleaser→The Good Child   | rebel→The Unheard Scream   | analyst→The Backroom Mind
```

Copy team writes 56 essays (en/ru), keyed `parts.<family>.<subtype_slug>`. Engineering ships the table above verbatim in `parts.ts`. Constellation headline (§1.4) still keys on families (40 combos).

### 1.6 Derived attachment indices

```
anxious   = 0.5*T_abandoned + 0.3*T_pleaser + 0.2*T_charmer
avoidant  = 0.3*T_analyst + 0.3*T_numb + 0.25*T_hermit + 0.15*T_controller
secure    = self_energy scaled to T (50 + (self_energy−50)/5*... ) → just: 20 + self_energy*0.6
disorganized flag: anxious ≥ 60 AND avoidant ≥ 60
```

### 1.7 Complexes — 9 hardcoded multi-part networks

A **complex** is not a part: it is a feeling-toned network (Jung) binding exiles + their protectors around one theme — the empirical analog is Young's early-maladaptive-schema domains. Parts are the *actors*; complexes are the *storylines*. Detection is a weighted sum over the 14 family T-scores — no new items. Each complex carries a first-person **core belief** shown verbatim in the report ("the sentence that runs your storyline") and a **micro-experiment**: one small, safe, this-week action that contradicts the belief.

```ts
// activation(c) = Σ WEIGHTS[c][part] * T_part   (weights sum to 1.0)
// tier: < 55 latent · 55–61 active · ≥ 62 gripping
const COMPLEXES: Record<ComplexId, { name: string; belief: string; experiment: string; weights: Partial<Record<PartId, number>> }> = {
  abandonment:  { name: 'The Abandonment Complex',  belief: 'I am lovable only if I am convenient and need nothing.',
                  experiment: 'Say no to one small request and stay present with the discomfort.',
                  weights: { abandoned: .45, pleaser: .25, charmer: .15, numb: .15 } },
  inferiority:  { name: 'The Inferiority Complex',   belief: 'I am fundamentally defective; if they truly saw me, they would leave.',
                  experiment: 'Notice one self-attack and rename it: "I notice a thought that I am not enough."',
                  weights: { ashamed: .40, inner_critic: .30, taskmaster: .20, unseen: .10 } },
  power:        { name: 'The Power Complex',         belief: 'If I let go of control, everything collapses.',
                  experiment: 'Leave one small decision to someone else and observe what actually happens.',
                  weights: { controller: .40, frightened: .30, rebel: .20, taskmaster: .10 } },
  performance:  { name: 'The Performance Complex',   belief: 'I have no right to fail; my worth is my output.',
                  experiment: 'Ship one thing at "good enough" and log what actually followed.',
                  weights: { taskmaster: .35, charmer: .25, ashamed: .25, inner_critic: .15 } },
  engulfment:   { name: 'The Engulfment Complex',    belief: 'If I comply, I will disappear.',
                  experiment: 'Find one "yes" this week that does not cost you yourself — and give it freely.',
                  weights: { rebel: .35, analyst: .25, numb: .20, unseen: .20 } },
  invisibility: { name: 'The Invisibility Complex',  belief: 'I do not belong to anyone; I watch life through glass.',
                  experiment: 'State one preference out loud, unprompted, to someone safe.',
                  weights: { unseen: .45, pleaser: .25, analyst: .15, charmer: .15 } },
  vigilance:    { name: 'The Vigilance Complex',     belief: 'Danger is always near; I must not relax.',
                  experiment: 'Set a 5-minute timer in a safe place and let your shoulders drop until it rings.',
                  weights: { frightened: .40, controller: .25, analyst: .25, numb: .10 } },
  unlovability: { name: 'The Unlovability Complex',  belief: 'My needs are a burden; love must be earned through sacrifice.',
                  experiment: 'Ask for one small thing for yourself and accept it without repaying.',
                  weights: { abandoned: .30, ashamed: .30, charmer: .20, pleaser: .20 } },
  betrayal:     { name: 'The Betrayal Complex',      belief: 'People cannot be trusted; letting anyone in means getting hurt.',
                  experiment: 'Share one true, small thing with a safe person — and let it land.',
                  weights: { analyst: .30, hermit: .30, frightened: .25, abandoned: .15 } },
};
```

- Report shows the top-2 complexes ≥ 55 as the user's "active storylines," each rendered as a subgraph glow on the constellation (the member parts pulse together). If none ≥ 55, show none — do not force one.
- A complex being `gripping` (≥ 62) triggers the crisis-resources footer when 2+ member exiles are ≥ 60T.
- Copy team: 9 essays (ONE per complex, no tier variants) en/ru, keyed `complexes.<id>`. Belief + experiment strings above ship verbatim (ru translations by copy team).

**Complex interlock table** (used by synastry §2.4) — HARDCODED pairs that lock two people into a joint pattern:

```ts
const INTERLOCKS: [ComplexId, ComplexId, string][] = [
  ['abandonment','engulfment',  'The Anchor and the Sail'],   // pursuit ↔ flight
  ['power','engulfment',        'The Grip and the Escape'],
  ['inferiority','performance', 'The Judge and the Contestant'],
  ['invisibility','performance','The Mirror Hunger'],
  ['unlovability','abandonment','The Proof Spiral'],           // each tests the other
  ['vigilance','power',         'The Bunker Alliance'],
  ['inferiority','inferiority', 'The Shame Pact'],             // same-complex lock
  ['abandonment','abandonment', 'The Clutch'],
  ['vigilance','vigilance',     'The Watchtower Marriage'],
  ['betrayal','abandonment',    'The Test and the Reach'],     // one tests, one pursues
  ['betrayal','betrayal',       'The Parallel Fortresses'],
];
```

### 1.8 Core-needs layer

Every part serves exactly one core need — HARDCODED:

```ts
const NEED: Record<PartId, Need> = {
  // needs: 'safety' | 'love' | 'worth' | 'autonomy' | 'belonging' | 'meaning' | 'joy'
  taskmaster:'worth', inner_critic:'safety', pleaser:'belonging', controller:'safety', analyst:'safety',
  hermit:'safety', bypasser:'meaning',
  numb:'safety', rebel:'autonomy', charmer:'worth',
  abandoned:'love', ashamed:'worth', frightened:'safety', unseen:'belonging',
  sage:'meaning', warrior:'autonomy', caregiver:'love', explorer:'joy',
};
```

**Unmet-need profile**: `need_hunger(n) = mean(T of shadow parts with NEED=n) − mean(T of resource parts with NEED=n, or 50 if none)`. Top hunger is shown in the report as "What your system is asking for" with one concrete practice per need (7 practices, copy team). Needs also drive synastry NOURISH (§2.6).

### 1.9 Four-layer part copy (card structure)

Every one of the 56 subtypes ships with exactly four texts (en/ru), keyed `parts.<family>.<subtype>.<layer>`:
1. **Face** — one line, how it shows up publicly.
2. **Need** — what it's really asking for ("Needs to know love is not conditional on performance").
3. **Shadow** — the maladaptive strategy when the need goes unmet.
4. **Superpower** — the healthy expression of the *same* energy (Critic→discernment, Controller→stewardship, Rebel→boundary courage, Numb→capacity to pause). Never frame a part as an enemy; IFS axiom: no bad parts.

Report card UI = flippable card cycling these 4 layers.

### 1.10 State layer — Window of Tolerance + crisis-typed check-ins (daily loop v2)

Trait (T-scores) is the map; **state** is the weather. Daily check-in, ≤15 seconds, two taps:
1. **Arousal**: "Where are you right now?" — 5-step vertical slider: hyper (fight/flight) / activated / **window** / low / shutdown. Stored as −2..+2.
2. **Event type** (optional 3rd tap): Relational / Achievement / Loss / Boundary / Change / Calm day.

**Crisis→part trigger map** — HARDCODED, drives which part the app *predicts* flared today (shown as "Did the ___ take the wheel?" one-tap confirm/correct):

```ts
const CRISIS_TRIGGERS: Record<EventType, PartId[]> = {
  relational:  ['abandoned','pleaser','charmer','hermit'],
  achievement: ['taskmaster','inner_critic','ashamed'],
  loss:        ['abandoned','numb','frightened','bypasser'],
  boundary:    ['rebel','controller','powerless_proxy' /* use 'frightened' */],
  change:      ['controller','frightened','explorer'],
  calm:        ['sage','explorer','caregiver'],
};
```
(Implement `boundary: ['rebel','controller','frightened']` — the proxy comment is resolved: use `frightened`.)

Prediction = highest-T part among the event type's candidates; confirm/correct events are stored and, after 14+ check-ins, per-user trigger weights shift ±0.1 per correction (bounded 0–1). This is the only adaptive element in the app; everything else stays static.

**Integration arc** (retention spine): 30-day rolling stats per part. A part whose confirmed-flare rate drops ≥30% versus its prior 30 days while self_energy check-in average rises earns an **"unburdening" moment** — its star visibly softens (shader: harsh flicker → steady glow) and the user gets a once-only narrative card. Purely celebratory; T-scores only change on retake (offered every 90 days).

### 1.11 Coping Stack — the protector escalation sequence

Under stress, protectors fire in a characteristic order: manager first, then a harder manager, then firefighters, and beneath them the exile. Deterministic derivation:

```
Level 1 = highest-T manager
Level 2 = next-highest protector (manager or firefighter) with T ≥ 45
Level 3 = highest-T firefighter (if distinct and ≥ 45; else omit)
Floor   = exile with highest guardianship-weighted vulnerability:
          argmax over exiles e of  T_e * Σ over stack protectors p of GUARDS[p][e] ?? 0
```

Rendered in the report as a vertical "descent" diagram: L1 → "when that fails" → L2 → L3 → the exile at the floor with its wound belief. Check-in confirm/correct data (§1.10) re-orders L1–L3 after 14+ observations if the observed flare order contradicts the T-order (swap only adjacent levels, one swap max). The Coping Stack is also the synastry Loop Finder's tiebreaker: when two of A's protectors tie on trigger impact, prefer the one higher in A's stack.

### 1.12 Somatic layer

- During Descents, whenever a user answers 4–5 ("Very often"/"Almost always") on a shadow item, 20% of the time (deterministic: item index mod 5 == 0) show a follow-up body-map tap: "Where do you feel this?" — 8 zones (head, jaw/face, throat, chest, gut, shoulders/arms, pelvis, legs). Optional, skippable, one tap.
- Aggregate per part: modal zone → the part's card shows "lives in your ⟨zone⟩" and the constellation star links to a faint body-silhouette overlay (toggle). No zone data → omit line.
- Store zones locally only; never in telemetry.

### 1.13 Quick Scan — 14-item onboarding funnel (80/20)

Before Descent I, offer "Meet one part in 90 seconds": exactly 14 items — the single highest-loading item of each shadow family (content team marks it; provisionally item q1 of each). Scoring: raw 1–5 per family, top family ≥ 4 → show that family's base-subtype card (Face + Need layers only) + a blurred constellation teaser → CTA "Begin Descent I to meet the rest." If no item ≥ 4, show the Self/eight-C's teaser card instead. Quick Scan results are provisional, never stored into the profile, and are discarded once Descent I completes.

### 1.14 Resource balance bands — hyper/hypo shadow (strength dysregulation)

A strength is only a resource *inside a healthy band*; too little is a collapsed (hypo) shadow, too much is an overused (hyper) shadow that leaks into a named shadow part. HARDCODED per resource (T-bands + the shadow part overuse spills into):

```ts
// hypo: T < 40 (blocked strength) · healthy: 40–64 · hyper: ≥ 65 (overused → spillPart)
const RESOURCE_BANDS: Record<ResourceId, { hypoName: string; hyperName: string; spillPart: PartId }> = {
  sage:      { hypoName: 'The Fog of Confusion', hyperName: 'The Detached Guru', spillPart: 'analyst' },   // wisdom→intellectualizing
  warrior:   { hypoName: 'The Pushover',         hyperName: 'The Aggressor',     spillPart: 'controller' },// courage→domination
  caregiver: { hypoName: 'The Cold Well',        hyperName: 'The Martyr',        spillPart: 'pleaser' },   // nurture→self-erasure
  explorer:  { hypoName: 'The Stagnant',         hyperName: 'The Escapist',      spillPart: 'numb' },      // curiosity→avoidance
};
```

- Report resource line reflects the band: hypo → "your ⟨strength⟩ is currently blocked — ⟨hypoName⟩"; healthy → celebrate; hyper AND `spillPart` ≥ 60T → "your ⟨strength⟩ has tipped into ⟨hyperName⟩" and draw a leak-arc on the constellation from the resource star to the spillPart star.
- Drives exercise targeting: hypo → `resource` build exercises; hyper → new `polarity` exercises (§3D.4 / type 16). This is the strengths-overuse model (VIA), made deterministic. Gendered/esoteric source framing (masculine/feminine, light/dark) is deliberately NOT used — only the neutral hypo/healthy/hyper mechanism.

### 1.15 Self Radar — 8-quality decomposition (replaces the single self_energy scalar in UI)

`self_energy` (§1.3) is computed from 8 items — HARDCODE each item to exactly one of the 8 C's, so the same 8 items yield a per-quality 20–80 sub-score AND the mean (self_energy is unchanged). Order fixed:

```ts
const SELF_QUALITIES = ['calm','clarity','compassion','curiosity','confidence','courage','creativity','connectedness'] as const;
// item i (0..7) → SELF_QUALITIES[i]; sub_q = 50 + 10*(score − 3)/1  clamp 20..80 (single-item, coarse — labeled "indicative")
```

- Rendered as an **8-spoke radar at the constellation's center** (the chair). This is the app's Self visualization — luminosity per spoke.
- **Weakest-quality targeting:** the lowest spoke drives a rotating daily micro-practice (one hardcoded practice per quality, from the intensive's set — e.g. confidence→"space-claiming posture, 3 breaths"; courage→"name your worst-case out loud, rate its real likelihood"; curiosity→"5 min of only questions, no answers"). Develop one quality at a time.
- **Inversion copy** (each quality named by the absence it dissolves): calm=absence of anxiety, clarity=absence of confusion, compassion=absence of indifference, curiosity=absence of knowing-it-all, confidence=absence of doubt, courage=absence of hesitation, creativity=absence of rigidity, connectedness=absence of alienation. Used in low-spoke copy: "your clarity is dimmed — confusion is loud right now." Jung: "not by imagining figures of light, but by making the darkness conscious." `[C]`
- Single-item sub-scores are coarse; label them "indicative," never diagnostic. self_energy (the 8-item mean) remains the load-bearing number for all gating.

### 1.16 The 4+1 Part Dimensions (IPF) — every part is a 5-axis profile, not one number

Biggest part-model upgrade. From the Integrated Parts Framework: a part's T-score says *how loud*; it says nothing about *how stuck, how rigid, how blended, how attended*. Each part now carries five sub-axes (0–100), all derived deterministically from existing telemetry — no new items:

| # | Axis | Range (low→high) | Derived from |
|---|---|---|---|
| 1 | **Body** (somatic activation) | overheating/collapse → smooth, regulated | somatic-marker items (§1.2) + arousal at this part's flares (§1.10) |
| 2 | **Role** (relational rigidity) | rigid tyrant/outcast → flexible team-player | spread of event-types that trigger it (§1.10): fires everywhere = rigid; context-specific = flexible |
| 3 | **Story** (narrative time) | stuck tape (repeating past) → live stream (updating) | coherence-beat completion (§3E.1) + T-change across retakes + burden trend |
| 4 | **Driver** (intentionality) | autopilot (hijacks you) → co-pilot (you choose) | confirmed "took the wheel" vs "noticed and chose" rate (check-in confirm/correct + unblending logs) |
| +1 | **Attunement** (Self-relationship) | exiled/ignored → held in compassion | Soft Gaze / part-dialogue / metaprocessing directed at this part + self_energy when it's active |

- **The +1 is not another quality of the part — it is the relationship that lets the other four heal** (IPF key insight). Attunement is the master axis: raising it is the healing move; the other four follow. `[C]`
- Rendered as a **5-spoke mini-radar on each part card** (flippable with the 4 copy layers §1.9). A part can be high-T but high-Attunement (known, held, healing) or high-T low-Attunement (loud, exiled, dangerous) — the app now distinguishes these, which a single T-score cannot.
- Drives targeting precisely: low Body → `regulation`/`somatic`; rigid Role → `polarization`; stuck Story → `prediction_error`/coherence work; autopilot Driver → `unblending`; low Attunement → `soft_gaze`/`part_dialogue`. This replaces coarse tier-based suggestion with axis-based.
- **Canonical metaphor option:** the IPF "Internal Kingdom" (Self = compassionate monarch, parts = citizens/soldiers/wounded children, healing = the monarch attending each citizen) is a warm, non-esoteric framing that fits the council model (§3D.1) — ship it as the default narrative skin.

### 1.17 Two corrections to the whole model (from the developmental synthesis)

Small, cross-cutting, high-leverage — apply everywhere:
- **Grief-on-retirement.** Integrating/softening a protector is a *loss* — the part is losing its lifelong job. Every unburdening/integration moment (§1.10, exercises) gets a brief **grief beat**: "this part worked hard for years — take a moment to thank it for the job it's putting down." Grief (natural response to necessary loss) is distinct from trauma work and currently absent; without it, integration is brittle. `[C]`
- **Two engines, not one.** The whole app is deficit-framed (heal wounds, close gaps). Add the *attraction* engine: the Future Self (§3D.2) is reframed from "less wounded" to "what you're drawn *toward* / what you love." One onboarding + one periodic prompt surface the loved/beautiful/summoning (Appreciative Inquiry: systems grow toward what they persistently ask about), not only the broken. `[C]`

---

## 2. Synastry Algorithm — exact spec

Input: two full profiles (12 T-scores + self_energy each). Output: 5 numbers + named dynamics. Fully deterministic.

### 2.1 Cross-trigger matrix (the heart)

`TRIGGER[a][b]` = how much person A's protector *behavior*, when expressed, activates person B's *exile*. HARDCODED 8×4 behavioral-impact matrix (0–1):

```ts
// rows: acting protector; cols: exile it pokes in the OTHER person
//                 abandoned ashamed frightened unseen
taskmaster:    [   .2,      .7,     .1,       .5 ],
inner_critic:  [   .1,      .8,     .2,       .3 ],  // criticism leaks outward
pleaser:       [   .1,      .2,     .1,       .6 ],  // smothering → engulfed/unseen-as-self
controller:    [   .3,      .4,     .6,       .5 ],
analyst:       [   .6,      .3,     .1,       .7 ],  // withdrawal → abandonment/unseen
numb:          [   .8,      .2,     .3,       .8 ],
rebel:         [   .5,      .3,     .8,       .2 ],
charmer:       [   .6,      .4,     .1,       .3 ],  // inconstancy → abandonment
hermit:        [   .8,      .2,     .2,       .7 ],  // disappearing → abandonment/unseen
bypasser:      [   .3,      .5,     .2,       .7 ],  // feelings dismissed → ashamed/unseen
```

```
trigger(A→B) = Σ over protectors p of A, exiles e of B:
   act(A,p) * vuln(B,e) * TRIGGER[p][e]
where act(x,p)  = max(0, (T − 50)/30)   // 0 at 50T, 1 at 80T
      vuln(x,e) = max(0, (T − 45)/30)
Normalize: FRICTION = clamp01((trigger(A→B) + trigger(B→A)) / 4.0) * 100   // divisor raised from 3.2 for 10 protectors
```

### 2.2 The Loop Finder (named dyadic cycles)

Detect the single strongest **loop**: A's top expressed protector pokes B's most vulnerable exile → B's guardian protector (via `GUARDS`, pick B's highest-T protector guarding that exile) fires → that protector pokes A's exile (via `TRIGGER`) → A's guardian responds. This 4-node cycle is THE relationship's signature. Render it as an animated diagram (§3). Name it from a hardcoded 6-entry pattern table keyed by (A-protector-class, B-protector-class): manager×manager "The Cold War", manager×firefighter "The Pursuit", firefighter×firefighter "The Wildfire", plus pleaser-involved override "The Vanishing Act", analyst/numb×abandoned override "The Long Winter", rebel×controller override "The Standoff".

### 2.3 Composite scores (all 0–100, shown with NOURISH §2.5 as the hexagon chart)

```
FRICTION  — §2.1.
RESONANCE — exile similarity = 100 − mean(|T_Ae − T_Be|) * 2.5, clamped. (Shared wounds → felt understanding.)
BALANCE   — protector complementarity: for the 6 POLARIZATION pairs, score +1 when A high(≥60) on one side and B high on the other side of the same pair; BALANCE = 40 + 10*matches, clamp 0..100.
SAFETY    — (self_A + self_B)/2 * 0.7 + 30 * (1 − |anxA−avoB|/60 …) → exact: 0.7*(selfA+selfB)/2 + 0.3*(100 − (max(anxA,anxB)+max(avoA,avoB))/2)
GROWTH    — 0.5*RESONANCE + 0.5*(100 − |FRICTION − 45|*2.2)  // friction near 45 is generative; 0 or 90 is not
```

**No single "compatibility %" anywhere in the product. Ever.** The Pattern wins because it names dynamics; a percent is astrology-tier. Headline is the Loop name + hexagon.

### 2.4 Complex interlocks (dyadic storylines)

For each pair (cA, cB) where cA is active (≥55) in A and cB active in B: if (cA,cB) or (cB,cA) is in `INTERLOCKS` (§1.7), the interlock fires with `strength = (activation_A(cA) + activation_B(cB)) / 2`. Report shows the top-2 interlocks by strength as named dyadic storylines with the strength bar; same-complex locks ('The Shame Pact' etc.) require the complex active in **both**. Interlocks also modulate composites: each fired interlock adds +6 to FRICTION and +4 to RESONANCE (they are bonding *and* abrasive), applied before clamping. If zero interlocks fire, show "No locked storyline — your complexes run in parallel" (this is a *good* result; say so).

### 2.5 NOURISH score (resources meet needs)

The missing positive half of synastry: can A's resources feed B's hungers?

```
feed(A→B) = Σ over B's top-2 need hungers h (§1.8):
    max over A's resource parts r with NEED[r] == h.need of  max(0,(T_Ar − 45)/30) * hunger_weight
    where hunger_weight = clamp01(h.hunger / 20)
NOURISH = clamp01((feed(A→B) + feed(B→A)) / 2) * 100
```

If a need hunger has no matching resource in the taxonomy (`safety` and `worth` have none among resources), map: safety→`caregiver`, worth→`sage`. Add NOURISH as a 6th axis — pentagon becomes a **hexagon** chart (FRICTION, RESONANCE, BALANCE, SAFETY, GROWTH, NOURISH). Report line: "What you can actually give each other" — names the two strongest resource→need feeds with part names.

### 2.6 Attachment dance

Keep the 7 existing dance archetypes (`PURSUE_WITHDRAW` etc.) but reselect via derived indices (§1 attachment section): build table on (A-style, B-style) where style = argmax(anxious, avoidant, secure) with disorganized override. Exact mapping: secure×secure→HEALING_CONTAINER, secure×anxious→HEALING_CONTAINER, secure×avoidant→PARALLEL_SOVEREIGNTY, anxious×avoidant→PURSUE_WITHDRAW_1 (A anxious) / _2 (B anxious), anxious×anxious→MUTUAL_ESCALATION, avoidant×avoidant→DEEP_FREEZE, any disorganized→VOLATILE_BOND.

---

## 3. Product & Design (SIGGRAPH tier)

**Identity:** "Innerverse" — your parts as a living inner constellation. Dark cosmos aesthetic like Co-Star but **warm** (deep indigo `#0B0B1E`, part-glows in a fixed 12-color palette; managers cool blues/teals, firefighters ambers/reds, exiles soft violets, Self is white-gold `#F2E7C9`).

1. **The Constellation (home screen).** WebGL (three.js, existing universe-controls). 12 fixed orbital positions (managers outer ring, firefighters mid, exiles inner, Self at center). Size/brightness = T-score tier; polarizations render as tension arcs; guardianship as faint orbit lines. Self-energy = center luminosity bleeding onto everything. 60fps on mid-tier Android: max 4k particles, one draw call per layer, `prefers-reduced-motion` → static SVG fallback.
2. **Assessment as ritual.** 3 sittings ("Descents") of ~49 items, one item per screen, thumb-reach Likert, item transitions <200ms, haptics on select. Progress = your constellation literally forming star by star. No results until Descent I completes; full report after III.
3. **Report.** Constellation headline (§1.4) → parts list by tier → active complexes (§1.7) as glowing subgraphs → polarization cycles as animated 2-node diagrams → Coping Stack descent diagram (§1.11) → core belief + micro-experiment of top complex → burden gauge → daily practice.
4. **Daily loop (retention).** One push/day: a **check-in** ("Which part drove today?" — tap a star, 10 seconds) + one card of IFS-grounded reflection targeted at the user's dominant polarization. Check-ins accumulate into a "weather" layer on the constellation (30-day activation trends). This is the Co-Star daily-hit equivalent, but self-report-grounded instead of ephemeris-grounded.
5. **Synastry.** Invite link → both constellations rendered facing each other → the Loop animates between them → hexagon → interlocks → dance card. Shareable image export (canvas render, no screenshot).
6. **PWA:** installable, offline-first (all scoring is client-side and deterministic — keep this), IndexedDB profile storage, Web Push for daily loop, `_headers` already present for Cloudflare Pages.

**Ethics card (mandatory, hardcoded into onboarding):** "This is a self-reflection tool grounded in the Internal Family Systems model, not a diagnosis or therapy." Crisis resources link in settings and after any exile-heavy result (all 4 exiles ≥ 60T).

---

## 3B. Therapist Mode — prescribed exercises (clinical companion layer)

The app is dual-mode: **solo** (diagnostic + safe self-serve practices) and **linked** (client connects to a therapist via invite code; therapist sees the profile dashboard and assigns exercises). Therapists get a web dashboard (same Angular app, `role: therapist`): client list → constellation, T-scores, complexes, Coping Stack, check-in weather, adherence.

### 3B.1 Safety gating — HARDCODED, non-negotiable

Every exercise has a gate tier:
- **GREEN** — self-serve; appears in solo mode automatically based on profile.
- **YELLOW** — self-serve only if `self_energy ≥ 40` AND no complex is `gripping`; otherwise therapist-assign only.
- **RED** — therapist-assign ONLY, never self-serve, never auto-suggested. All exile-contact and memory-adjacent work is RED. The app never walks an unsupervised user into an exile.

### 3B.2 Exercise taxonomy — 12 types, ~56 exercises at launch

Each exercise: id, type, gate, target selector (which measured pattern it's FOR), duration, copy (en/ru), completion input (none / text reflection / slider / body-map tap). Targeting selectors reference ONLY constructs the engine computes — a therapist filters the library by the client's actual patterns, or taps a highlighted "suggested for this client" list derived from the selectors below.

| # | Type (id) | What it is | Gate | Auto-target selector | Launch count |
|---|---|---|---|---|---|
| 1 | `regulation` | Window-of-Tolerance skills: paced breath (4-6), 5-4-3-2-1 orienting, cold-water reset, safe-place imagery, legs-ground scan | GREEN | check-in arousal outside window ≥3 of last 7 days | 6 |
| 2 | `unblending` | Noticing + naming: "a part of me…" reframe drills, 3-word part check-in, blended-moment log | GREEN | any part `dominant` (≥70T) | 4 |
| 3 | `part_dialogue` | Six-step protector dialogue (find-focus-flesh out-feel toward-befriend-fear), written interview with a named protector, "what are you afraid would happen if you stopped?" prompt | YELLOW | top protector of the Coping Stack | 6 |
| 4 | `polarization` | Two-chair / two-column dialogue between a fired polarization pair; negotiation worksheet ("what does each pole need to stand down?") | YELLOW | any POLARIZATION fired | 4 |
| 5 | `firefighter` | Urge surfing (10-min protocol), HALT log, trigger→urge→wave journal, replacement-soothe menu builder | YELLOW | any firefighter ≥ 60T | 5 |
| 6 | `defusion` | Belief-work on the complex's core belief: "I notice the thought that…", evidence ledger, belief-origin letter (when did this sentence arrive?) | YELLOW | any complex `active`+ | 4 |
| 7 | `experiment` | Behavioral micro-experiments (§1.7 per complex) + therapist-composed custom experiments with predicted-vs-actual outcome logging | YELLOW | top complex | 9 + custom |
| 8 | `somatic` | Body scan to the part's somatic zone, pendulation (sensation ↔ resource), tension-release reps, posture/breath for the specific zone | YELLOW | part with somatic zone recorded | 5 |
| 9 | `self_energy` | 8-C's cultivation: self-compassion break, curiosity-first reframe, daily Self-led-moment log, loving-kindness (secular wording) | GREEN | self_energy < 50 | 5 |
| 10 | `resource` | Strengthen the weakest resource: Sage (values/meaning journaling), Warrior (graduated boundary reps: one small no), Caregiver (receive-help rep), Explorer (play prescription: 30 unstructured minutes) | GREEN | weakest resource < 45T | 4 |
| 11 | `relational` | For synastry pairs: the Loop pause-protocol (name the loop out loud, 20-min timeout, scripted re-entry), needs-request script (observation→feeling→need→request), repair ritual, shared daily 2-tap check-in | YELLOW | synastry Loop / interlock computed | 4 |
| 12 | `exile_witness` | Letter to the younger self, witnessed timeline entry, compassion visit (guided audio), unburdening ritual script — **structured for use BETWEEN therapy sessions, as homework from live IFS work** | RED | therapist judgment only; app shows exile T-scores as context | 4 |

Copy team writes all ~56 launch exercises to a fixed template: *why this, for this part/pattern* (2 sentences referencing the client's actual named part) → *steps* (numbered, ≤7) → *if it gets intense* (stop rule + grounding pointer, mandatory on every YELLOW/RED exercise).

### 3B.3 Assignment mechanics

- Therapist assigns: exercise + frequency (once / daily / weekly / after-trigger) + optional note + duration (1–4 weeks). Client gets it as a card in the daily loop; after-trigger exercises attach to check-in event types (§1.10 CRISIS_TRIGGERS).
- Completion: client logs done + optional reflection + optional 0–10 "intensity" slider. Reflections are visible to the therapist **only if the client toggles share per-reflection** (default OFF).
- Adherence view: therapist sees done/skipped counts and intensity trend, never raw reflections without consent.
- Auto-suggest for therapists = the selector column above, ranked by construct severity. The app **suggests to the therapist**; it never auto-assigns YELLOW/RED to clients.
- Solo mode surfaces only GREEN (always) and YELLOW (when the §3B.1 condition passes), max 1 suggestion/day, chosen by selector priority order: regulation > unblending > self_energy > resource > firefighter > defusion > experiment > somatic > polarization > part_dialogue.
- If any check-in reports `shutdown` arousal 3 days running or a gripping complex with 2+ exiles ≥ 60T: pause all non-`regulation` assignments, show crisis resources, and (if linked) flag the therapist.

### 3B.4 Data & compliance

- Linked mode moves profile + assignments to Firestore (rules already scaffolded in `firestore.rules`); solo mode stays local-only.
- Therapist accounts require license self-attestation at signup (checkbox + license number field, stored; no verification at launch — revisit at scale).
- Consent screen at link time: exactly what the therapist sees (scores, patterns, adherence) and what they don't (reflections unless shared, somatic zones, raw item answers — never shared).
- This feature does not change the product's classification: the app supports a licensed clinician's own treatment plan; it does not treat. Keep the §3 ethics card wording.

---

## 3C. Generalization Layer (AGT-derived) — making change real, not narrated

Principle (from Accountable Generalization Therapy): an app that produces fluent self-description while behavior stays unchanged is the failure mode. The report is the *training set*; life under load is *deployment*. These mechanisms close that gap. All deterministic, no LLM.

### 3C.1 Verdict Delay — the "Sealed Verdict" mechanic

State-compromised minds write globalized identity conclusions ("midnight shame vs noon insight"). HARDCODED trigger: check-in arousal = `hyper` or `shutdown`, OR any app open between 00:00–05:00 local following a `hyper`/`shutdown` check-in that day.
- While triggered: report deep-content (complex essays, exile cards) is soft-locked behind a gentle interstitial: "Facts and feelings now. Meaning gets 48 hours."
- Offer the **Sealed Verdict**: user writes the conclusion that feels true right now → it's timestamped, sealed (blurred), and resurfaces exactly 48h later next to the prompt: "Read it from where you are now. What still feels true? What changed?" One-tap tags: `still true` / `partly` / `state artifact`.
- Sealed verdicts + their 48h re-ratings accumulate into a "State vs Truth" screen — over months the user *sees* that midnight verdicts are unreliable. This is the app's single most differentiating retention feature; build it exactly as specified.
- Always available during lock: regulation exercises, crisis resources, plain check-in. Never locked: nothing safety-related.

### 3C.2 Dual-Bound Charter

Auto-drafted from the user's top complex, editable by user or therapist, max 6 sentences: **upper bound** (anti-shame): "This event is a specific behavior in a specific context — not proof of ⟨complex core belief⟩." **lower bound** (anti-license): "It is still serious; it needs one repair action and one next-time plan." Delivered as the JITAI card (§3C.4) after any lapse-type check-in. After each delivery ask TWO sliders: "How much self-blame right now?" and "How much does it feel like it doesn't matter?" — if blame drops but license rises across 3 deliveries, flag the therapist (or in solo mode, swap to the stricter charter variant, hardcoded per complex).

### 3C.3 Four-Way Split (attribution grid) + attribution language meter

- New GREEN exercise type 13 `attribution`: a 60-second guided flow after any confirmed part-flare: **Context** (chips: tired/hungry/alone/conflict/deadline/other) → **Specific act** (one sentence) → **Impact** (one sentence) → **Controllable next move** (one sentence, must start with "I will"). Blocks generic answers: reject next-moves containing "be better", "try harder", "stop being".
- **Attribution meter** (on-device, lexicon-based, no NLP model): count in user free-text (reflections, splits, sealed verdicts) the ratio of globalizing tokens (`always`, `never`, `I am <adj>`, `everything`, `my whole life` — hardcoded lexicon, en+ru) to localizing tokens (`this time`, `in that moment`, `lately`, `when I'm`, `at work`). Rolling 30-day ratio shown as a small "weather vane" on the profile: essence-language vs behavior-language. Ratio worsening ≥ 30% over 2 weeks → therapist flag + auto-suggest `attribution` exercises.

### 3C.4 JITAI micro-interventions (event-triggered card engine)

Extends §1.10. HARDCODED trigger→card map, max 1 JITAI card per 24h, all opt-in at onboarding:
```
arousal hyper/shutdown          → body-anchor card ("Feet. Three breaths. One controllable thing.")
lapse-type check-in             → Dual-Bound Charter
2+ consecutive out-of-window    → witness-contact card ("Call ⟨pre-chosen person⟩ before deciding anything.")
confirmed flare of stack L1     → that part's if-then plan (from proceduralization, §3C.5)
00:00–05:00 open after bad day  → Sealed Verdict offer
```
The witness contact is chosen at onboarding ("one human you'd let this app remind you to call") — optional, local-only.

### 3C.5 Proceduralization Ladder (exercise upgrade)

Assignable exercises gain an optional 5-rung ladder (therapist toggles it; solo mode gets rungs 1–3): 1) name the principle → 2) write the if-then plan ("When ⟨trigger⟩, I will ⟨action⟩") → 3) mental rehearsal (90-sec guided) → 4) live rep logged → 5) **verified under load**: the if-then plan fired during a real confirmed-flare check-in and the user logged doing it. Only rung 5 marks the skill "integrated" (star earns a steady ring on the constellation). Insight is never marked integrated from reading/reflection alone — HARD RULE.

### 3C.6 Resistant outcomes (hard-to-fake metrics, therapist dashboard)

Add to §3B dashboard, computed only from logged events, never from self-ratings: **time-to-repair** (lapse log → "repair action logged" delta), **secrecy duration** (lapse log → "told a human" toggle delta), **if-then fire rate** (plans that actually fired under load / plans written), **human-vs-app disclosure ratio** (reflections shared with a person vs kept in-app; coarse, from the share toggle). Rule shown to therapists verbatim: "If self-report improves but these don't, the work is being narrated, not generalized — shift from insight exercises to behavior/environment exercises."

### 3C.7 Possible Selves / foreclosure module

New GREEN exercise type 14 `horizon`: guided possible-selves elicitation (1yr / 5yr / problem-resolved / feared), one screen each, min 2 selves; app computes a coarse **foreclosure flag** = fewer than 2 non-problem selves generated OR both skipped. Flag shows on therapist dashboard (foreclosure is an independent risk marker) and, in solo mode, biases daily suggestions toward `horizon` + `resource` (expansion before governance). Each generated self gets one micro-role try-on task ("The connected friend: text one person 'thinking of you'").

### 3C.8 Copy rules (anti-narrative-capture) — apply to ALL app text

1. Never issue global verdicts, positive or negative ("you are worthy" is banned exactly like "you are broken"). Updates are local: "with this person, in this context, X happened."
2. Ban totalizing frames in part/complex essays: no "this is who you are"; always "this is a pattern that runs under these conditions."
3. Every insight-type card ends with one behavioral hook (a micro-experiment, if-then, or repair step) — no card is pure narrative.
4. The coach-panel LLM chat (if enabled) gets these as system-prompt rules plus: offer alternative interpretations as hypotheses, never validate a self-verdict, escalate to crisis resources on self-harm content. No sycophancy: it may disagree.

### 3C.9 Exercise taxonomy additions (extends §3B.2 table)

| # | Type | Gate | Target selector | Count |
|---|---|---|---|---|
| 13 | `attribution` (Four-Way Split) | GREEN | any confirmed flare; attribution meter worsening | 3 |
| 14 | `horizon` (Possible Selves) | GREEN | foreclosure flag; burden ≥ 60 with low resource T | 4 |
| 15 | `prediction_error` | YELLOW | therapist-designed mismatch experiments: record the old story's *specific prediction* verbatim → run smallest safe test → log actual outcome → write the "smallest, truest update" (app enforces local wording: reject updates containing `always/never/proves I am`) | 3 + custom |

---

## 3D. The Inner Council & Practice Path (macro spine, from IFS+Integral source)

Gives the app a long-arc identity beyond the daily loop. All deterministic; no developmental *rank* is ever assigned to the person (that would be a global verdict, banned by §3C.8).

### 3D.1 Inner Council reframe (home screen framing)

The constellation is framed as **your inner council; you sit in the chair (Self)**. Parts are councillors, not symptoms. Copy everywhere uses council language: a `dominant` part is "holding the floor," a polarization is "two councillors deadlocked," Self-energy is "how clearly you're chairing." This reframe is the emotional spine — warm, agentic, non-pathologizing. Pairs with the "no bad parts" axiom (§1.9).

### 3D.2 Future Self — the North Star

At end of Descent III the user defines a **Future Self**: 3 prompts (one year / the version who has met these parts / what they'd do differently under load), min 2 sentences. Rendered as a single distant bright star the whole constellation faces; the Growth Sequence and daily suggestions orient toward it. Editable anytime. This is AGT Possible-Selves (§3C.7) given a permanent visual anchor. If skipped, show a dim placeholder star ("your North Star is undefined") — a gentle recurring nudge, never a block.

### 3D.3 Practice Path — 5 chapters (skills unlocked, NOT levels earned)

A macro journey mapping the source's 5 "quests" to a safe, skill-gated path. It gates *content depth*, mirroring §3B safety tiers — it is a map of what practices are unlocked, explicitly **not** a ranking of the person.

```
Ch.1 Grounding   → regulation, self_energy, resource (GREEN). Unlock: complete Descent III.
Ch.2 Meeting     → unblending, attribution, part_dialogue L1–3. Unlock: 7 days of check-ins.
Ch.3 Tending     → polarization, firefighter, defusion, experiment, polarity. Unlock: any part dialogue rung 4 logged.
Ch.4 Relating    → relational/synastry, needs-request scripts. Unlock: 1 synastry run OR therapist assign.
Ch.5 Integrating → exile_witness, prediction_error (RED/therapist-gated regardless of chapter). Unlock: therapist link only.
```

Progress bar = practices tried, not a competence score. Copy: "Chapter 3 of your practice path" — never "you are at stage 3." Chapters may be entered early if a therapist assigns into them. Reaching Ch.5 solo is impossible by design (exile work stays therapist-gated).

### 3D.4 Session micro-cycle (OODA-derived) & journaling

- Every guided exercise and check-in follows a fixed 5-beat loop: **Observe** (what's here) → **Orient** (which part/pattern) → **Decide** (one controllable move) → **Act** (do/log) → **Integrate** (one-line reflection). This is the universal exercise template; content team writes to it.
- **Guided journal**: prepared question sets keyed to the user's top part/complex (source's "prepared questions" idea). Entries are local-only, optionally fed to the coach-panel LLM (with the §3C.8 anti-sycophancy rules) for reflection — never for scoring.

### 3D.5 Exercise taxonomy addition (extends §3B.2 / §3C.9)

| # | Type | Gate | Target selector | Count |
|---|---|---|---|---|
| 16 | `polarity` (strength rebalancing) | YELLOW | resource in hyper band (§1.14) with spillPart ≥ 60T | 4 |

**Rejected from this source (do NOT implement):** Wilber altitude/stage *labels* applied to the person, and the masculine/feminine + light/dark quadrant taxonomy — esoteric, gendered, empirically weak, and verdict-shaped. Only their neutral mechanisms (hypo/hyper bands, council reframe, future-self anchor, OODA loop) survive.

---

## 3E. Experiential Depth Layer (Coherence Therapy + DNMS)

From two clinical sources: the Experiential Therapy handbook (Tori Olds — memory reconsolidation, AEDP, IFS) and DNMS (Schmidt — attachment-repair ego-state therapy). These sharpen HOW change-work exercises are built, and add safety scaffolding. All deterministic; deep/wound work stays therapist-gated.

### 3E.1 Coherence-first (upgrades prediction_error & part_dialogue)

Reconsolidation only fires if the old schema is **activated with its own protective logic first**, then met by a juxtaposition (mismatch). HARD RULE: every `prediction_error` (§3C.9 type 15) and `part_dialogue` (type 3) exercise inserts a **Coherence beat before any disconfirmation**: "This part learned this for a good reason — name the reason it made sense." Skipping coherence → the disconfirmation is a verbal reframe that doesn't stick (the #1 reason insight fails to change behavior). Exercise flow becomes: **Contact → Clarity → Coherence → Completion** (the 4 C's) as the deep-exercise template, layered over the OODA micro-cycle (§3D.4). `[C]`

### 3E.2 Pendulation & the two-channel matched-depth safety algorithm

Any exercise that contacts pain MUST interleave resource-contact beats, and depth is bounded by available resource — never go deeper into a wound than the user has resource online (else flooding). HARDCODED:
- Structure deep exercises as alternating beats: `resource → need → resource → deeper need …` (somatic-therapy pendulation).
- **Depth gate:** the exercise's max wound-depth beat is capped by `min(self_energy tier, strongest-resource tier)`. If resource < need depth → the app auto-inserts a resource beat or ends the exercise with a grounding close. This is the exile-safety spine; applies to `somatic`, `exile_witness`, `prediction_error`.

### 3E.3 Resource Team + Special Safe Place (DNMS stabilization prerequisites)

- **Resource Team = the 4 resource parts reframed by healing function**: Caregiver→*Nurturing* (love/validation), Warrior→*Protective* (boundaries/safety), Sage→*Wise Core* (perspective/meaning), Explorer→*Vital* (play/aliveness). Report + exercises address them by function during wound work.
- **Special Safe Place**: user builds one imagined scene (pick/name a place + populate with resources). Rendered as a calm zone on the constellation. Wound-heavy stars can be "sent to rest" there — a containment gesture wired to the crisis circuit-breaker (§3B.3): on shutdown-streak or gripping complex, the app offers "send this part to rest in your Safe Place" instead of deep content.
- **Hard prerequisite for any RED exercise**: Safe Place built AND ≥1 resource ≥ 50T "mobilized." No exile contact without the container. Mirrors DNMS "mobilize resources before touching wounded parts." `[C]`

### 3E.4 The Harmless Recording (GREEN reframe — high value, safe)

DNMS's most portable move. When a check-in reports a flare, the app can offer: *"You're not reliving the event — you're reliving your **reaction** to an old recording. The recording is harmless; your reaction made sense once."* Pairs with the Sealed Verdict (§3C.1) and the Coping Stack floor. New GREEN micro-card, max 1/day, opt-in. Distinguishes reliving from reacting — a precise, teachable unblending. `[C]`

### 3E.5 Orient-to-Present (GREEN grounding move)

A wounded part often "believes it's still then." A 30-second grounding beat inside regulation exercises: name 3 present-time facts that were not true in the wound's era ("I have my own home / I can leave / I am an adult in [year]"). Concrete re-orientation, not just breathing. `[C]`

### 3E.6 Metaprocessing (AEDP — process the shift, don't move past it)

After ANY logged positive shift (unburdening moment §1.10, completed prediction_error, part softening), the app inserts a short **metaprocessing beat**: "What was it like to feel that shift? What's newly possible now?" (1 text line or skip). Processing the process deepens encoding and opens new meaning — currently the app celebrates shifts but doesn't metabolize them. Feeds the coach-panel and the integration arc. `[C]`

### 3E.7 System-Wide Announcement (onboarding consent, all-parts)

Onboarding + first heavy result shows a fixed "message to all your parts": *"Every part of you is welcome here. Nothing here aims to delete or fix away any of you — only to help each one feel less alone. We go at your pace; anything can wait."* Reinforces "no bad parts" and sets consent tone (DNMS). `[C]`

### 3E.8 Exercise taxonomy additions

| # | Type | Gate | Target selector | Count |
|---|---|---|---|---|
| 17 | `safe_place` (build/visit containment scene) | GREEN | always available; auto-offered on overwhelm | 2 |
| 18 | `harmless_recording` (reliving-vs-reacting reframe) | GREEN | any confirmed flare | 2 |
| 19 | `metaprocessing` (deepen a shift) | GREEN | any logged positive shift | 2 |

**Rejected from these sources (do NOT implement as self-serve):** EMDR / Alternating Bilateral Stimulation (eye-movement/tapping desensitization) — a clinical trauma-processing intervention requiring a trained clinician and contraindication screening. It may appear ONLY as a therapist-directed note in Therapist Mode, never as an app-driven self-serve exercise. Deep exile reconsolidation stays RED/therapist-gated regardless of these additions.

---

## 3F. Self-Leadership Layer (from the Talk Authentic IFS intensive)

Proven facilitation practices from the app owner's own intensive. Integrating makes the app the between-session companion to that program.

### 3F.1 Soft Gaze — the flagship Self-access meditation (GREEN core practice)

The signature daily practice the app currently lacks. Fixed 5-beat guided flow (audio + text, en/ru): **notice body & emotion → identify which parts are present → thank each → ask each to step back a little (not away) → rest in whichever Self qualities are now accessible.** Cyclical: repeat the ask-and-thank until spaciousness appears. On completion, offer the Self Radar (§1.15) as a self-rating. This is the primary unblending + regulation ritual; it opens the daily loop and precedes any deeper exercise. `[C]`

### 3F.2 Exact part-dialogue & polarization scripts (refine types 3, 4)

HARDCODE the intensive's question sequence into `part_dialogue` and `polarization`:
- **Per part:** "Who are you? What is your positive intention? What do you want for me? How do you go about it?" → **Thank the part.** (Positive-intention assumption is mandatory — a part is never interrogated as an adversary.)
- **Polarization resolution (both parts):** after each side is heard, "Do you two share a deeper goal? How could you cooperate to reach it?" → thank both. The shared-intention turn is the resolution mechanic, not "pick a winner."

### 3F.3 Shadow-via-projection (YELLOW exercise — surfaces disowned parts self-report misses)

Projection method: user names 2–3 people who trigger a strong reaction (irritation/judgment/contempt), logs the exact emotion + body location + the specific behavior that triggers it, then the prompt: "What if a part of you carries this too — and works hard to never show it?" Surfaces disowned material the Likert items can't reach. YELLOW (can destabilize); auto-suggested only when self_energy ≥ 45. Findings are offered as hypotheses, never asserted as fact. `[C]`

### 3F.4 Six levels of communication (depth ladder for journaling & coach-panel)

Fixed ladder used to deepen reflections and the coach chat: chatter → facts → opinions → feelings → **needs** → **values**. Parts work targets feelings/needs; the coach-panel and guided journal gently escalate a user who stays at facts/opinions toward feelings/needs. `[C]`

### 3F.5 Exercise taxonomy additions

| # | Type | Gate | Target selector | Count |
|---|---|---|---|---|
| 20 | `soft_gaze` (Self-access meditation) | GREEN | daily loop opener; always available | 1 (+quality variants) |
| 21 | `self_quality` (develop weakest Self spoke) | GREEN | lowest Self Radar spoke (§1.15) | 8 (one per quality) |
| 22 | `shadow_projection` (disowned-part surfacing) | YELLOW | self_energy ≥ 45; low-variance shadow profile | 3 |

---

## 4. Engineering plan (ordered, no skipping)

| # | Task | Definition of done |
|---|---|---|
| 1 | `parts.ts`: taxonomy, NORM tables, GUARDS, POLARIZATIONS, TRIGGER, 32 constellations (placeholder copy) | types compile; tables match this doc byte-for-byte |
| 2 | `scoring-v2.ts`: §1.3–1.5 exactly; delete hash-name pipeline | vitest: fixed response vectors → exact expected T-scores/tiers/constellation (snapshot) |
| 3 | 147-item bank in i18n (en/ru) with content team | every key present both langs; validity items at positions 40/84/120 |
| 4 | `synastry-v2.ts`: §2 exactly | vitest: 6 canonical dyad fixtures → exact FRICTION/RESONANCE/BALANCE/SAFETY/GROWTH + loop name |
| 5 | Assessment panel rework (3 Descents, one-item screens) | Lighthouse mobile ≥ 90; works offline |
| 6 | Constellation WebGL home | 60fps Moto G-class; reduced-motion fallback |
| 7 | Report + synastry UI | matches §3.3/3.5 |
| 8 | Daily check-in + push + weather layer | notification round-trip works installed on Android + iOS PWA |
| 9 | Migration: old 64-item profiles → prompt retake (no mapping — old data is unsalvageable) | old users see "The stars have been recalibrated" flow |
| 10 | Telemetry: item response distributions (anonymized) → future norm updates | events land; no PII |
| 11 | Therapist Mode (§3B): dashboard, exercise library data, assignment engine, gating, consent flow | gating rules unit-tested (RED never reachable in solo); link/consent flow E2E; Firestore rules tests pass |
| 12 | Generalization layer (§3C): Sealed Verdict, charter engine, JITAI cards, attribution meter lexicon, ladder, resistant-outcome metrics | verdict lock/unlock unit-tested across timezones; JITAI 1-per-24h cap tested; lexicon fixtures (en/ru) exact-count tests |
| 13 | Inner Council & Practice Path (§3D): council copy pass, Future Self anchor, 5-chapter gating, OODA template, resource hyper/hypo bands (§1.14) | band thresholds unit-tested; chapter unlock rules tested; Ch.5-solo-unreachable asserted in tests |
| 14 | Experiential Depth layer (§3E): coherence beat, pendulation depth-gate, Safe Place, Harmless Recording, metaprocessing, resource-team functions | depth-gate unit-tested (need-beat never exceeds resource cap); RED-requires-SafePlace asserted; new GREEN cards E2E |
| 15 | Self-Leadership layer (§3F) + Self Radar (§1.15): 8-quality decomposition, Soft Gaze meditation, part-dialogue scripts, shadow-projection, buddy pairing (program) | radar sub-scores unit-tested from fixed item vectors; Soft Gaze flow E2E; shadow_projection gated on self_energy≥45 |
| 16 | 4+1 Part Dimensions (§1.16) + model corrections (§1.17): 5-axis part profile from telemetry, per-part mini-radar, axis-based targeting, grief beat, Eros/Future-Self reframe | each axis derivation unit-tested from fixed telemetry fixtures; Attunement master-axis targeting asserted; grief beat fires on every integration |

**Test discipline:** every algorithm function is pure, takes numbers, returns numbers, and has fixture-based exact-value tests written BEFORE implementation. The tables in this doc ARE the spec — copy them verbatim.

---

## 5. What NOT to do

- No LLM in the scoring path. Deterministic only. (LLM allowed only in the optional coach-panel chat, clearly labeled.)
- No compatibility percentage, no "soulmate" language, no birth data.
- No procedurally generated archetype names.
- No new dimensions, parts, or scores beyond this doc.
