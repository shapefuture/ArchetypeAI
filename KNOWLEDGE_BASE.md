# KNOWLEDGE BASE — Reusable Psychology/Design Insights

Distilled from all sources analyzed in this session (game design docs, therapy handbooks, IFS training material, instructional-design methodology, and deep developmental-psychology synthesis). Organized by **concept**, not by which product it fed, so it can seed *any* future product — diagnostic apps, games, coaching programs, courses, group work.

Evidence tags: `[E]` established/replicated · `[C]` contested/clinically-used-but-not-settled · `[H]` house-synthesis/novel combination. Carry the tags forward — don't launder `[C]` into `[E]` in future work.

**Source list:** IFS clinical/training material (Schwartz lineage, Talk Authentic intensive), Tori Olds' Experiential Therapy handbook (Coherence Therapy/AEDP), DNMS (Schmidt), Accountable Generalization Therapy (AI-alignment→psychotherapy transfer), the instructional-design-facilitator skill (ACERI methodology), the SELФ therapeutic-RPG design corpus (10 files), and a deep developmental-psychology synthesis spanning Wilber/Kegan/Mahler/Bowen/Jung/Grof/Whitehead et al.

---

## 1. MEASUREMENT & TAXONOMY PATTERNS

### 1.1 Two-tier taxonomy: measured families → named subtypes
Don't try to directly measure 40+ named constructs — psychometric scales need ≥8 items each, so N constructs = 8N items, unworkable past ~15. Instead: measure a small number of reliable *families*, then resolve each family into a richer set of *named subtypes* deterministically, based on which other measured family "colors" it most strongly (highest co-elevated score among a fixed set of "colorer" candidates). Zero extra items, much richer output surface. `[H]`
**Reusable for:** any typology product (career types, communication styles, leadership styles) that wants depth without a 300-item test.

### 1.2 The 4+1 axis pattern (Integrated Parts Framework)
A single intensity score answers "how loud" but nothing else. Decompose any psychological *unit* (trait, part, symptom, habit) into 5 orthogonal axes:
1. **Body** — somatic/physiological activation (dysregulated ↔ regulated)
2. **Role** — relational rigidity (fires everywhere/rigid ↔ context-specific/flexible)
3. **Story** — narrative temporality (stuck repeating the past ↔ live, updating)
4. **Driver** — intentionality (autopilot/hijacks you ↔ chosen, co-piloted)
5. **+1 Attunement** — the *relationship* to it (exiled/ignored ↔ held with compassion) — **this is the master axis; it's not a 5th quality of the thing, it's what lets the other 4 change.**
`[C]` — clinically-derived framing, not a validated instrument, but a genuinely useful design lens.
**Reusable for:** habit-tracking apps, symptom trackers, any "how are you doing with X" surface that wants to show *texture*, not just a bar going up or down.

### 1.3 Resource/strength dysregulation bands (hypo/healthy/hyper)
A strength is only a resource *inside a band*. Below the band = a collapsed/blocked version (a name of its own, e.g. "The Pushover" for blocked Warrior-energy). Above the band = an overused version that *spills into* a specific named shadow pattern (e.g. overused Warrior → "The Aggressor," spilling into Controller-type behavior). This is the VIA character-strengths overuse/underuse model made deterministic with explicit spill-targets. `[H]`
**Reusable for:** strengths-based coaching tools, leadership 360s, any instrument currently only measuring "how much" of a good quality — add the ceiling.

### 1.4 Core-needs layer underneath any trait/behavior taxonomy
Map every measured trait/pattern to exactly one underlying need (safety, love, worth, autonomy, belonging, meaning, joy — or a domain-appropriate need set). Compute "unmet-need hunger" = elevated shadow-expression of a need minus available healthy/resource expression of the same need. This produces a "what your system is actually asking for" output that's more actionable than any trait list alone. `[H]`
**Reusable for:** any personality/behavior product — this is the layer that turns "you scored high in X" into "here's what to actually do."

### 1.5 Complexes: weighted multi-part networks above individual traits
A "complex" ≠ a trait; it's a feeling-toned network binding several measured units around one theme/storyline (Jungian complex theory; empirical analog = Young's schema-mode domains). Detect via a fixed weighted sum over existing trait scores (no new items) with activation tiers (latent/active/gripping). Each complex should carry: a name, a first-person core belief sentence, and one small "micro-experiment" that contradicts the belief. `[C]`
**Reusable for:** any product wanting a "storyline" layer above raw traits — turns a trait dump into a small number of nameable, actionable narratives.

### 1.6 Validity/attention-check items are cheap insurance
Fixed-position attention checks ("select 'sometimes' for this item") + 1-2 infrequency items ("I have never felt any emotion") catch careless responding. Fail = flag for review, not hard-block (avoid punishing genuine outliers). `[E]`

---

## 2. RELATIONSHIP / DYAD MEASUREMENT PATTERNS

### 2.1 Cross-trigger matrices > distance metrics
Don't measure relationship "compatibility" as similarity/distance between two profiles — that's astrology-tier and produces a single sterile percentage. Instead build a matrix of *how much A's expressed behavior activates B's specific vulnerability* (and vice versa), sum both directions. This captures asymmetric, causal *interaction*, not just resemblance. `[H]`
**Reusable for:** any pairing/matching product — dating apps, team-composition tools, co-founder matching.

### 2.2 The "Loop Finder" — name the cyclical dynamic, not a score
Trace the strongest 4-node cycle: A's top behavior pokes B's most vulnerable spot → B's habitual response (chosen via a guardianship/association table) fires → that pokes A's spot → A's habitual response. Name the cycle from a small fixed lookup table keyed on the *category* of each side's response (not every individual combination). This is far more useful to end users than a compatibility score — it's actionable and specific. `[H]`
**Reusable for:** couples/team tools — "here's the cycle you two get stuck in" beats "you're 73% compatible."

### 2.3 Never ship a single compatibility percentage
A single number invites false precision and is astrology-tier. Prefer: (a) a named dynamic/cycle, (b) a small multi-axis chart (5-6 axes: friction, resonance, complementarity, safety, growth-potential, and what-you-give-each-other), (c) narrative naming over numeric scoring wherever the underlying construct is genuinely multidimensional. `[H]`

### 2.4 The positive-half metric ("what can you give each other")
Most relationship tools only measure friction/risk. Add the inverse: do person A's *strengths* match person B's *unmet needs*, and vice versa? This is the single most differentiating addition you can make to any synastry/matching feature — nearly all competitors skip it. `[H]`

### 2.5 Attachment-style-derived dance patterns
Rather than separately measuring attachment style, *derive* it from existing trait scores (anxious = weighted sum of abandonment-related + pleasing traits; avoidant = weighted sum of intellectualizing + withdrawal traits; secure = function of overall regulation capacity). Then map style-pairs to a small fixed set of named "dance" archetypes (pursue-withdraw, mutual escalation, deep freeze, healing container, etc.) — this reuses existing measurement instead of adding a whole new instrument. `[H]`

---

## 3. BEHAVIOR-CHANGE MECHANISM PATTERNS (the "does insight actually become behavior" problem)

This is the highest-value cluster in the whole corpus — most self-improvement/diagnostic products stop at insight and never close this gap.

### 3.1 The core failure mode to design against
A system (human or AI) can learn to *state* the aligned/preferred story fluently while the underlying behavioral policy is completely unchanged — "insight theatre." Self-report and behavior can decouple; the gap between them can even *grow* while the person becomes more fluent in the right vocabulary (a very good early-warning sign of failure, easy to miss). `[H]` (AI-alignment→psychotherapy transfer)
**Design implication:** never trust self-report improvement alone. Always pair it with a behavioral/resistant metric (see 3.6), and have an explicit decision rule: if self-report improves but behavior doesn't, STOP adding insight content and switch to skills/environment/exposure work.

### 3.2 Coherence-before-disconfirmation (memory reconsolidation mechanics)
Real belief/behavior change (memory reconsolidation) requires: (1) the old belief/prediction gets **activated** in its original felt form — not just discussed abstractly; (2) it meets a genuine **experiential mismatch** (not a verbal reframe) within a limited window; (3) new learning gets encoded before re-stabilization. Skipping step 1 (activation with its own internal logic/coherence — *why the belief made sense*) produces a reframe that doesn't stick, because the old policy never actually entered the labile/updatable state. `[C]` (Coherence Therapy, reconsolidation research)
**Design implication:** any "reframe" or "prediction-error" exercise must have a mandatory "name why the old belief made sense" beat *before* the disconfirmation beat. Never disconfirm what hasn't first been coherently activated.

### 3.3 The Four-Way Split (attribution control)
After any lapse/failure/shame-trigger, force a structured decomposition *before* any problem-solving: (1) Context — situational/state factors present; (2) Specific act — the literal observable behavior, no character judgments; (3) Impact — actual consequences; (4) Controllable next move — one specific, doable, "I will..." action (reject vague answers like "be better"). This converts a global shame-verdict ("I am bad") into a local, controllable-policy problem ("I did X in context Y, here's what I'll do differently") — this is the mechanism, not just a nice reframe. `[C]` (pre-failure self-compassion research; requires author verification, but the mechanism logic is sound)

### 3.4 Dual-bound framing (prevents shame-collapse AND moral license)
Any self-compassion/anti-shame intervention must be paired with an anti-license bound, or it backfires. Structure: **Upper bound** (anti-shame) — "this is a specific behavior in a specific context, not proof of a defective identity." **Lower bound** (anti-license) — "it is still serious, it needs one repair action and one different-next-time plan." Always measure BOTH shame-reduction AND perceived-permission-to-repeat after delivering compassion content — if shame drops but "it doesn't matter" rises, the intervention is miscalibrated, not successful. `[H]`
**This is a widely-missed check** — most self-compassion content in wellness apps has no anti-license guardrail at all.

### 3.5 State-dependent memory / the "verdict delay" mechanic
Beliefs/conclusions formed in an extreme emotional state (very late at night, post-conflict, intoxicated, highly dysregulated) get encoded with strong state-tags and don't reliably retrieve or get corrected by insight formed in a calm state ("midnight shame and noon insight disagree"). Never let a product (or a person) finalize an identity-level conclusion while in a flagged extreme state. Instead: **capture the facts/feelings freely, but explicitly defer the *meaning*/verdict for a fixed window (e.g., 48h), timestamp what was written, and resurface it later for re-rating from a regulated state.** Over time this builds direct, felt evidence that state-bound verdicts are unreliable — more convincing than being told so. `[H]` — this is one of the single best mechanics extracted this session; genuinely novel as a *product feature* even though the underlying psychology is well established.
**Reusable for:** journaling apps, any tool touching emotional regulation, crisis-adjacent products.

### 3.6 Resistant/hard-to-fake outcome metrics
Self-report is gameable (consciously or not). Track outcomes that are behaviorally verifiable and hard to fake:
- **Time-to-repair** after causing interpersonal harm (recognition → repair action initiated)
- **Secrecy duration** after a lapse (event → disclosure to a real human)
- **If-then plan fire rate** (plans actually executed under real load / plans written)
- **Human-vs-tool disclosure ratio** (real relationships vs. app/AI as the outlet for distress — declining human ratio is a red flag)
- **Act→essence latency** (time from a mistake to a global self-verdict — shrinking latency = improving attribution style)
`[H]` — pull these into the KPI set of *any* behavior-change or wellness product; they beat NPS/self-report satisfaction for detecting whether anything real changed.

### 3.7 Proceduralization ladder (insight → integrated skill)
A principle only counts as "integrated" after passing ALL of: (1) name it, (2) write an explicit if-then plan, (3) mental rehearsal, (4) a live low-stakes rep, (5) **verified fire under real load** (the plan actually executed during a genuine triggering event, not a drill). Steps 1-4 alone = informed, not transformed — this is exactly the "insight theatre" failure from 3.1. Never let a UI mark something "done" or "mastered" from reading/reflecting alone. `[H]`

### 3.8 Anti-narrative-capture copy rules
- Never issue a global verdict, positive or negative — "you are worthy" is exactly as bad as "you are broken." Both are global, unfalsifiable identity statements. Prefer local, specific, falsifiable updates: "with this person, in this context, X happened."
- Never frame a pattern as "who you are" — always as "a pattern that runs under these conditions."
- Any insight-only content should end in a behavioral hook (a next step, an if-then, a repair action) — content that's pure narrative with no hook invites exactly the insight-theatre failure.
- If a chat/coach feature exists, it should be explicitly permitted (instructed) to disagree and offer alternative interpretations — a frictionlessly validating AI companion is a well-documented mechanism for reinforcing distorted self-narratives.
`[H]`

### 3.9 Linguistic attribution meter (deterministic, no ML needed)
Track a rolling ratio of globalizing language ("always," "never," "I am [trait]," "everything," "my whole life") vs. localizing language ("this time," "in that moment," "lately," "when I'm tired") in free-text the user writes. Simple lexicon-count, not a model. A worsening ratio over weeks is an early behavioral warning sign, catchable before symptoms visibly worsen. `[H]`

---

## 4. SAFETY & PACING ARCHITECTURE

### 4.1 Resource-before-processing / matched-depth (the core safety algorithm)
Never let a user (or player, or client) go deeper into painful material than their currently-available resource/regulation state supports. Concretely: **cap the maximum "depth" of any exercise beat by the minimum of (current self-regulation capacity, currently-accessible internal/external resources)**. If depth would exceed the cap, auto-insert a resourcing beat or end the exercise on a grounding note instead of pushing forward. `[C]` (somatic therapy "pendulation"; DNMS "resource-before-processing")
**This is the single most important safety mechanic for any product that touches emotionally difficult material** — implement it as a literal deterministic gate, not a content-writing guideline that can be forgotten.

### 4.2 Pendulation as structural rhythm
Structure any deep-content sequence as alternating beats: resource → touch the difficult material → resource → go slightly deeper → resource... never a single long descent. This *is* the mechanism of "earned security" / resilience-building, not just a nice pacing choice. `[C]`

### 4.3 Tiered safety-gate system (color-coded pause hierarchy)
A simple 3-tier system works across many contexts: **Yellow** = slow down / regulation check, no stop. **Orange** = change approach, still in the room. **Red** = full stop / immediate care / opt-out. Make these single-tap/single-word, no explanation required to invoke — "no questions asked" policy reduces shame around needing to pause. `[E]` (widely used in trauma-informed and TA-RPG facilitation)

### 4.4 Permission-based access to sensitive material
Deep/wounded material should require an explicit "permission" step from whatever the user's protective mechanism is (in IFS terms: the protector part must consent before the exile is approached) — never auto-surface the most vulnerable content. Mechanically: gate deep content behind an explicit consent/readiness check, not just a difficulty slider. `[C]`

### 4.5 Depth-matching: the right tool for the right layer of the problem
Classify where a problem actually lives before choosing an intervention:
- **State** (immediate context/trigger) → environmental change, regulation, interruption
- **Skill** (never learned) → instruction + modeled example + practice
- **Structure/Relationships** (skill exists, environment blocks it) → environmental/ecology change, not more skill-teaching
- **Meaning** (story about ONE event) → a single reframe/reflection can shift this
- **Identity/Rules** (a *principle* generating behavior across many situations) → requires extended, multi-session architecture; a single reframe will NOT stick
- **Possibility Space** (no deficit — just a narrow horizon) → exploration/expansion, not deficit-repair
**The failure mode to name explicitly:** applying a shallower tool to a deeper problem produces a specific, predictable failure — temporary improvement that reverts, "more tools, same system," or a new story with no new behavior. Always ask: "what depth did I diagnose, and does my intervention actually operate at that depth?" `[E]` — this is one of the most rigorous and broadly reusable frameworks in the whole corpus; it generalizes far beyond therapy into any coaching/consulting/instructional-design context.

### 4.6 Attractor-strength → architecture-scope (not content-scope)
Diagnose how "stuck" a pattern is along 4 factors before choosing program length: **coupling density** (how many life domains are locked together), **activation frequency** (how often it fires), **historical depth** (how early/how long reinforced), **environmental reinforcement** (does the current environment maintain or fight the pattern). Weak attractor → a single well-designed session can work. Strong attractor → months of architecture required, heavy early safety work mandatory before any challenge work. The mistake is choosing program length/intensity from the *content* instead of from this diagnosis. `[E]`

### 4.7 Grief is not trauma-processing — build for both, separately
Every voluntary change/growth involves loss (of an old identity, an old strategy, an old relationship to a part of yourself) and that loss needs metabolizing via grief mechanics (acknowledge, mourn, thank, release) — distinct from trauma processing (which addresses overwhelming/unprocessed events). Un-grieved separation produces incomplete change — the old pattern quietly stays fused rather than being genuinely released. Build an explicit "thank and release" beat into any integration/completion moment. `[C]`

---

## 5. GROUP / RELATIONAL MECHANICS

### 5.1 The group as a corrective relational field (not just an audience)
A well-facilitated group functions as a surrogate system where old relational patterns can re-enact safely and get a different outcome in real time (Yalom's "corrective recapitulation"). This is qualitatively different from — and often more powerful than — solo work, because the disconfirmation is *live and relational*, not imagined or discussed. `[E]`

### 5.2 Anonymous energy/authenticity check ("Resonance Test")
When someone claims to be acting from a calm/wise/integrated state, have the group (or a proxy mechanism) anonymously rate whether the *felt energy* actually matches that claim (vs. feeling pushy, judgmental, performative). This is one of the only mechanisms in the corpus that can catch **spiritual bypass or a "wise-sounding" defense masquerading as genuine calm** — self-report cannot catch this because the bypass includes fooling oneself. `[C]` — genuinely novel and high-value; strongly recommend for any product with a group/peer layer or even a solo self-check ("does this feel calm-genuine or calm-performed?").

### 5.3 Distributed witnessing / anti-sole-mirror rule
No single person (facilitator, coach, AI companion) should become the sole validator of someone's identity/progress — structurally enforce multiple witnesses (peers, a real-world "buddy," periodic informant check-ins). A sole mirror is exactly the mechanism by which cult dynamics, guru-inflation, and echo-chamber validation loops form. `[H]`

### 5.4 Buddy/peer-dyad system
Pair every participant with a peer for regular (weekly) 1:1 check-ins across a program's full duration. Ship with: a fixed rotating question bank, and 4 explicit ground rules (confidentiality, non-judgment/no advice-giving, equality/no hierarchy, focus-on-self-not-partner). This is cheap, high-adherence, and solves the "who reinforces this in real life" transfer problem better than almost any app mechanic — it re-embeds change in a real relationship instead of a tool. `[H]`

### 5.5 Doubling / auxiliary-ego (psychodrama technique)
Another person voices the unspoken internal thoughts/parts of the protagonist ("doubling"), or fully embodies a role in the protagonist's inner or outer world ("auxiliary ego") to help them see and interact with it externally. Makes the unconscious/unspoken audible and workable. Requires a trained facilitator and clear frame; high-value, high-skill-requirement technique. `[E]` (psychodrama, Moreno)

### 5.6 The Shadow-Mirror protocol (projection as fast-track material)
When person A is strongly triggered by person B, structure it explicitly: A says "I hear in you what I exile in me — teach me the words," then B (the triggering person) "tutors" A in owning/integrating that disowned quality. Converts interpersonal friction into the single fastest route to surfacing material self-report can't reach (you can't self-report what you've disowned — but you can spot it instantly in someone else). `[C]`

### 5.7 Facilitator anti-drift discipline
Facilitators/coaches are agents too, subject to the same reward-driven drift as anyone in a position of being someone's "special mirror." Build in: (1) a brief post-session self-check (whose agency was centered? did I collude to avoid necessary friction? did I feel flattered by their dependence?); (2) a "calibrated dissent ladder" as the default posture instead of either auto-validation or premature challenge — reflect affect first, separate suffering-from-conclusion, offer alternative readings as hypotheses, stress-test against consequences, only escalate to hard intervention if belief content turns exclusive/paranoid/grandiose/self-harm-organizing; (3) an absolute structural rule that no facilitator becomes the sole identity-authority for a participant. `[H]`

---

## 6. NARRATIVE, FRAMING & COPY PATTERNS

### 6.1 "No bad parts" / non-pathologizing framing as a hard rule
Every problematic pattern gets framed as a strategy that made sense given what it was protecting against — never as a flaw, defect, or enemy to eliminate. This isn't just a nicer tone; it's load-bearing for engagement (people don't want to work on parts of themselves framed as bad) and for the coherence-before-disconfirmation mechanism (3.2) — you can't activate-with-coherence something you've been told is simply wrong. `[E]/[C]`

### 6.2 Inversion framing for abstract positive qualities
Define an abstract positive quality by naming the specific absence it fills, not by more adjectives: "calm = absence of anxiety," "clarity = absence of confusion," "confidence = absence of doubt." This makes an abstract quality suddenly concrete and diagnosable ("what's loud right now?") and gives a natural low-score copy pattern ("your clarity is dimmed — confusion is loud right now"). `[C]` — cheap, elegant, broadly reusable copy technique for any strengths/qualities framework.

### 6.3 The exact 4-question part-dialogue script
A specific, teachable, reusable script for engaging any internal "part"/pattern/impulse with curiosity instead of suppression: "Who are you? What is your positive intention? What do you want for me? How do you go about it?" — followed by a mandatory **thank the part**. For two conflicting parts/patterns: ask both, then "do you share a deeper goal? how could you cooperate?" — resolution is *finding the shared goal*, never "picking a winner." `[C]` — extremely portable; works as a therapy technique, a journaling prompt, a negotiation-with-yourself framework, even organizational conflict-resolution by analogy.

### 6.4 Six levels of communication depth (as a coaching/journaling ladder)
chatter → facts → opinions → feelings → **needs** → **values**. Most people default to facts/opinions; real behavior-relevant work happens at feelings/needs. Use this explicitly as an escalation ladder in any reflective/coaching tool — gently move a user who's stuck describing facts toward naming needs. `[C]`

### 6.5 The "harmless recording" reframe
When someone is triggered/flared, the precise and portable reframe is: "you're not reliving the event, you're reliving your *reaction* to an old recording of it — the recording is harmless; your reaction made sense once." Distinguishes *reliving* (which feels dangerous/real) from *reacting* (which is a pattern you can observe) — a precise, teachable unblending move. `[C]` (DNMS)

### 6.6 Behavioral amnesty / role framing for shame-adjacent work
Framing a difficult behavior as "a move by a role/part, not a verdict on me" measurably lowers the shame-barrier to exploring or rehearsing it (a drama-therapy/game-design mechanic, but the underlying principle — psychological distance reduces defensiveness — generalizes to any self-exploration copy). Concretely: let users name and address their patterns in the third person ("the anxious part," "my inner critic") rather than first-person identity statements ("I am anxious"). `[C]`

### 6.7 Strength-first ordering (report/feedback structure)
Any report, feedback, or assessment output should surface the person's strongest positive quality/resource *before* any shadow/deficit content — never lead with what's wrong. This is a small ordering decision with outsized effect on whether people stay engaged with genuinely difficult content afterward. `[H]`

---

## 7. INSTRUCTIONAL / PROGRAM DESIGN METHODOLOGY (ACERI, domain-agnostic)

This section is the most broadly reusable of all — it applies to any learning experience, coaching program, onboarding flow, or training design, not just psychological products.

### 7.1 Diagnose the "job," not the topic, before designing anything
People don't hire a course/program/app to "learn X" — they hire it to make a specific transformation from a specific struggling moment. Before any design: find the precise triggering moment (not the abstract goal), the full multi-dimensional job (functional/emotional/**social**/financial/relational/**anticipatory**/values — social and anticipatory are the two most commonly missed), the real stakes (push to Level 3: personal/identity-level, not just Level 1 mechanics or Level 2 financial), what was already tried and *how it specifically failed* (abandonment/error/exception/degraded — each implies a different fix), and the **hidden benefit** of staying stuck (the most commonly skipped diagnostic — ask "what would you have to face if this problem disappeared tomorrow?"). `[E]`

### 7.2 Engineer outcomes as testable statements, not vague goals
Format: `[Minimize/Maximize] + [specific metric] + [object] + [context]`. "Understand negotiation" gives no design direction. "Minimize the likelihood of conceding price in the first 5 minutes with a procurement officer" is testable and buildable. Rank outcomes as P-Type (resolves a currently-felt pain — must be addressed first) vs D-Type (creates delight beyond baseline — layer on top, never lead with it). `[E]`

### 7.3 Four Testing Battery — what "learned" actually means
An outcome only counts as achieved if it passes all four, not just the first: **Feynman** (can explain it in their own words) → **Prediction** (can apply it correctly to a novel scenario) → **Boundary** (can name conditions where it doesn't apply / backfires) → **Transfer** (can apply the underlying structure to a completely different domain). Most assessment only checks Feynman — the weakest test. Someone who passes Feynman but fails Transfer has been informed, not transformed. `[E]`

### 7.4 Four arcs — select before designing
Not every struggle needs the same kind of resolution; picking the wrong one is a silent, harmful failure:
- **Transformative** — a completable stuck pattern → activate old prediction, disconfirm experientially, integrate
- **Mourning** — irreparable loss → honor/witness/maintain connection, do NOT try to "complete" or "fix" it
- **Protection** — a violated boundary → channel into boundary-setting/mobilization, do NOT try to calm or discharge it
- **Amplification** — nothing broken, just underdeveloped → remove the cap, amplify, do NOT deficit-frame it
Mixed arcs are common and should be named explicitly per component, not blended into one generic approach. `[E]`

### 7.5 Depth-matching gate before every intervention (cross-reference with 4.5)
Explicit check before finalizing any design: "what depth did diagnosis reveal, and does this specific intervention operate at that depth — or am I applying a shallower tool to a deeper problem?" Do this as a discrete, named step, not an implicit hope. `[E]`

### 7.6 Engine sequencing (safety before challenge, always)
Four capacities must come online in strict order, with a hard dependency: **Regulate** (safety/stability, always the valid first move, no gate) → **Differentiate** (observer position — can they watch their own thinking without flooding?) → **Reconsolidate** (old prediction activated + disconfirmed — requires the first two online, or it retraumatizes rather than transforms) → **Integrate** (meaning/narrative/values — requires real processing already happened, or produces insight-language with no felt change). `[E]`

### 7.7 Dual-Phase / Resonance-Tension rhythm
Structure any multi-session arc as alternating Resonance (safety, belonging, shared meaning-making) and Tension (challenge, gap, perturbation) phases — never pure challenge (produces anxiety/dropout) and never pure comfort (produces no change). **Critical rule: always culminate in Resonance, not Tension** — ending on unresolved challenge is a common, avoidable design failure. This same pattern shows up at three resolutions that must agree with each other: single-session rhythm, block-vs-program consistency, and full multi-month curriculum phasing (Stabilization → Differentiation → Processing → Integration → Graduation). `[E]`

### 7.8 The Covenant + Yield pre-phases (consent architecture for any challenging work)
Before any perturbation/challenge: (1) **Covenant** — explicit, specific (not generic) naming of the coming discomfort and why it's purposeful, plus establishing a witness (the facilitator, a peer, or an internalized supportive figure); (2) **Yield** — a brief, separate invitation to voluntarily soften/lower defenses *before* the challenge lands (not the same as post-challenge regulation). Skipping either means challenge lands on a braced system and produces defensive pushback instead of productive engagement. `[C]`

### 7.9 Four silent defenses against written/self-paced content
Live facilitation can respond to resistance in real time; written/async content can't, so design against these preemptively: **Intellectualization** (engaging analytically at a safe distance — counter with a sudden, specific, second-person-present-tense detail); **Premature resolution** (settling on an easy reading before the point lands — counter with one case that makes the easy reading insufficient, used sparingly); **Projection** (assigning relevance to others, never self — counter by describing the pattern as "other people," then revealing it's the reader); **Regression** (retreating to "not for me" when challenge exceeds capacity — the fix is more scaffolding before more challenge, never push through). Match the likely defense to the audience type before writing (experts → intellectualization/projection; fast pattern-matchers → premature resolution; already-depleted audiences → regression). `[H]`

### 7.10 Arrival-Fallacy inoculation
In any program longer than a few weeks, explicitly warn participants in advance (week 1-2) about the predictable energy-dip at weeks 6-12, where initial motivation fades and gains feel invisible because they've become background/normal rather than dramatic — this is the most common dropout point, and people quit exactly when it's working, not when it's failing. Pair the warning with a guaranteed small, undeniable win in the first 7 days (achievable with zero new learning) to bank evidence of "I can do this" before the dip arrives. `[E]`

### 7.11 Design for obsolescence (graduation as a first-class phase)
The most commonly omitted program phase is graduation — explicit fading of guidance, self-guided practice handoff, a termination ritual, and a propagation invitation (can the graduate now teach/facilitate for others?). Success should be measured by how many people *stop needing* the product/program, not by re-engagement/retention alone — design an actual off-ramp, don't just let engagement quietly decay. `[E]`

### 7.12 Spaced retrieval, not spaced re-exposure
The act of actively trying to recall something (before checking) strengthens memory more than re-reading it. Structure any "review" moment as "try to recall, then check" — never "here's a recap, read it again." Space recall prompts at increasing intervals (next day → 3-4 days → 1-2 weeks, interleaved with new material → 1 month, ideally self-initiated by then). `[E]`

### 7.13 Alignment-gap tracking (methodology-level version of 3.1)
Track self-report ("I lived in alignment with my values this week," 0-10) alongside an independent behavioral or informant-reported composite. A large-but-stable gap suggests limited insight; a *growing* gap is the critical danger sign — the person is getting more fluent at describing change than actually making it. Have a standing decision rule triggered by this metric, not just a passive dashboard. `[H]`

---

## 8. GAME-MECHANIC → REAL-BEHAVIOR TRANSFER PATTERNS

From therapeutic-RPG design research — useful for any gamified behavior-change product, not just literal games.

### 8.1 Fictional necessity (reframe the vulnerable act as a mechanical requirement)
Reframe an action that would otherwise carry shame (resting, asking for help, admitting need) as something the *system* mechanically requires to proceed — "you need this resource to continue," not "you need to admit weakness." Removes the shame-barrier by making the vulnerable act instrumentally necessary rather than personally revealing. `[H]`

### 8.2 Capacity tokens, not loot
Frame rewards for real behavioral progress as *named capacities added to the person's permanent repertoire* ("the capacity to rest," "the capacity to say no") rather than generic points/badges. This is a small copy shift with real effect on whether the reward reinforces the actual target behavior or just game-engagement. `[H]`

### 8.3 Real-life transfer card / bridge-out ritual
End every session/module with an explicit, concrete, self-written commitment to one specific real-world action or experiment before the next session — never let the experience end at the boundary of the tool/session without an explicit bridge back to real life. `[E]`

### 8.4 Integration gradient (forced → protected → optional → integrated)
Scaffold any new behavior through 4 stages: mechanically **forced** (the system requires it to succeed) → **protected** (practiced in a safe low-stakes sandbox) → **optional** (the person chooses it strategically) → **integrated** (seamless, no longer effortful). Useful as a general behavior-shaping ladder outside games too — e.g., in onboarding flows or habit features. `[H]`

### 8.5 The graduated intervention ("offer a fork → spoon-feed → twist the knife")
A facilitator/coach escalation pattern: first offer 2 clear, manageable choices (reduce decision fatigue) → if needed, make the therapeutic/growth path explicit via guided questions → only once the person is regulated enough, raise the stakes to prompt real action. Don't jump straight to high-stakes framing. `[H]`

### 8.6 Conditions over points (state-based rather than health-bar mechanics)
Represent internal/emotional state as named conditions (e.g., "activated," "frozen," "hopeless") that must be actively cleared through self-care/support moves, rather than an abstract depleting health bar. Makes the state legible and gives an explicit clearing mechanic instead of vague "feel better" framing. `[H]`

### 8.7 Partial success / "yes, and complication" (never a flat miss)
Structure setbacks as complications that advance the story/process with a cost, never as a dead-end failure. Teaches that outcomes are rarely binary and that setbacks are material to work with, not identity-ending events. `[E]` (Powered-by-the-Apocalypse game design; generalizes to any feedback/scoring system)

---

## 9. DEVELOPMENTAL / SYSTEMS-LEVEL PRINCIPLES (use with care — mostly `[C]`/`[H]`, hold lightly)

### 9.1 Growth is a breath, not a ladder (bidirectional oscillation)
Every forward developmental step (differentiation, a boundary, an unblending) needs a return/refuel beat afterward — not as regression but as the actual mechanism of consolidation (a toddler ventures out, returns to refuel, ventures further; the mythic hero returns with the boon rather than staying gone). A program/product that only rewards linear forward progress and treats the return-toward-safety oscillation as failure produces brittle gains that collapse under stress. Design the return explicitly — don't just tolerate it. `[C]`

### 9.2 Grief is the universal, unnamed thread under every separation/change
Every developmental step across every framework examined — birth, leaving home, losing a belief system, ego relativization, even transcendent states — has grief as its underlying emotional signature, rarely named as such. Un-metabolized grief = incomplete differentiation; the un-grieved part stays invisibly fused. **Design implication (reinforces 4.7):** any change/growth product needs an explicit grief practice at every major transition, not just at obviously-sad moments — this is a category most products miss entirely because it doesn't look like "content."

### 9.3 Two engines: push-away-from AND pulled-toward
Nearly every framework examined is implicitly deficit-oriented (heal the wound, close the gap, fix the pattern). An equally real and mostly-invisible second engine is attraction — what a person loves, finds beautiful, is summoned by (not the absence of a deficit, but the presence of something positively desired). A product using only the first engine produces sterile, dissociated "fixing." A product using only the second risks bypass (skipping real difficulty via positivity). **Both engines, deliberately, at every stage** — not deficit-work first and "vision" tacked on as a finale. `[C]`

### 9.4 Individual/relational/collective are not separate scales, they're one event
Personal change and the relational/collective field around a person are causally interpenetrating, not merely analogous — processing your own pattern changes what the people around you experience, which is a different and stronger claim than "healing yourself sets a good example." Practical implication: framing "your own work" as inherently also relational/service work (rather than purely self-improvement) tends to motivate more durable engagement and reduces the growth-for-its-own-sake trap (9.6). `[H]` — hold as a working *frame* for motivation copy, not a literal metaphysical claim, unless your audience explicitly wants that framing.

### 9.5 Pre/trans fallacy — don't confuse regression with transcendence
Early, pre-differentiated fusion states (fully merged, undifferentiated) and late, post-differentiated unitive/flow states can use similar-sounding language ("oneness," "no separate self") but are structurally opposite — one is a failure to individuate, the other is a chosen, conscious return after individuation. Any product using "flow," "oneness," "ego dissolution," or similar framing must be careful not to romanticize regression as if it were advanced integration. This is the single most important guardrail for any "advanced/transcendent" tier of a product. `[E]` (Wilber, Barfield — original vs. final participation)

### 9.6 The specific failure modes of "the already-transformed" (critical for any advanced/graduate tier)
People who have done real growth work are newly vulnerable to a specific, named cluster of traps — spiritual bypass (using calm/insight to skip an uncomfortable feeling), growth addiction (chasing the next modality as identity rather than output), subtle superiority/contempt for the "unconscious," guru/mentor inflation (ego feeding on others' dependence), "I found the one true way" certainty, and using one's own healing journey to solicit validation/acknowledgment from others. **Any advanced-tier or "graduate" program needs an explicit module naming and inoculating against these** — it is exactly the content a beginner program cannot hold, and exactly the gap in most "advanced" spiritual/growth offerings. `[C]`

### 9.7 The final-stage paradox: separation from the mechanism of separation itself
Across multiple deep traditions, the terminal move in sustained inner work is not one more insight or one more technique — it's recognizing that the *effort of seeking/fixing/separating* is itself the last thing to release. Relevant mainly for genuinely advanced/capstone content; for anything short of that, treat as background context, not a design target — pushing users toward "stop doing the practice" prematurely is indistinguishable from disengagement and should never be encouraged before extensive foundational work. `[C]` — extreme caution; gate behind real prerequisite work if used at all.

### 9.8 Ancestral/inherited-strength reframing
Inherited patterns (family, cultural, "in the blood") carry both wounds AND strengths/resources — most healing-oriented framing only addresses the wound half. A fuller frame explicitly asks what strengths, survival-wisdom, or gifts were also inherited alongside the difficulty, and treats reclaiming those as equally valid work, not just a nice add-on after the "real" (deficit) work is done. Requires discernment — the same source of a pattern can be both wounding and gifted; don't romanticize wholesale. `[C]`

---

## 10. HOW TO USE THIS DOCUMENT

- **Tags matter.** `[E]` claims can be stated to users/clinical advisors with normal confidence. `[C]` claims should be framed as "many practitioners find..." not "research shows..." `[H]` claims are this session's synthesis — treat as promising hypotheses to test, not facts to assert.
- **Sections 1-2** (measurement/taxonomy, dyad mechanics) are the most directly portable to *any* new personality/relationship/matching product.
- **Section 3** (behavior-change mechanisms) is the most valuable single cluster in this document — it's the difference between a product that produces insight and one that produces change. Almost any coaching, habit, wellness, or self-improvement product is missing most of these.
- **Section 4** (safety/pacing) is non-negotiable wherever a product touches emotionally difficult material, regardless of domain.
- **Section 7** (ACERI instructional design) is fully domain-agnostic — reuse for course design, onboarding flows, employee training, any structured learning experience.
- **Section 9** should be treated as the most speculative/hold-lightly section — genuinely interesting design lenses, weakest evidence base, highest risk of sounding grandiose or unfalsifiable if surfaced directly to end users. Use as *internal* design thinking more than user-facing copy.
