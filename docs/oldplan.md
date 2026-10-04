# ArchetypeAI / Innerverse — Personal Growth Master Plan

Status: consolidated planning document; implementation is pending. Saving this document does not authorize implementation, deployment, merging, or retiring Angular.

This document records the first-principles product audit, the subsequent bold creative update, and the attachment-inspired additions requested by the user. It is the consolidated source for the product decisions and proposed experiments from those conversations. Existing parity specifications and verification evidence remain the source for implementation contracts and test results. Sections 21–22 record the additional review of eleven uploaded documents on 2026-10-04.

## 1. Mandate, ambition, and decision status

The ambition is an award-worthy personal growth product: The Pattern meets Duolingo, with IFS at its center and an original interaction experience of its own. The user asked for first-principles analysis across all relevant quality dimensions, then rejected the initial proposal as too conservative and requested disruptive ideas, TRIZ, far transfer, total creative freedom, and suggestions even when experimental or unverified.

The resulting direction is:

> Step inside a moment from your life, meet the parts pulling you in different directions, and rehearse what you want to do next.

The connected experience is **notice → understand → practice → reflect → revisit**. The signature interaction is **bring a moment → stage the parts → negotiate a small experiment → rehearse → revisit**.

The Pattern contributes personal resonance and evolving understanding. Duolingo contributes short learning units, progression, reinforcement, and repeated practice. The original contribution is an interactive Felt inner world where understanding becomes something a person can experience, manipulate, and rehearse.

The second proposal changes the creative priority of the first: demonstrate this distinctive experience early, alongside concrete trust fixes. It does not discard the first proposal's accessibility, privacy, reliability, learning, and evidence requirements.

Decision status must remain clear:

- **User requirements:** ambitious and original; IFS-centered; superior to the Angular experience; preserve functional parity; use the merged Felt Atelier characters; plan before implementation; consolidate the decisions into one document.
- **Proposed product direction:** Replay, inner negotiation, a living relationship map, adaptive practice, editable longitudinal insights, and one connected journey.
- **Planning assumption:** adults exploring growth independently are the primary audience; therapist-supported use is secondary. This has not been validated through research.
- **Experimental proposals:** imagined branching rehearsal, theatrical unblending, weekly documentary episodes, shared conversation rooms, and contextual cues. These are hypotheses, not established capabilities or verified interventions.
- **Evidence limits:** source inspection and saved screenshots establish implementation/design findings. They do not establish clinical effectiveness, retention, user demand, or award eligibility. No overall numerical quality score is established by this audit.

## 2. Existing foundations to preserve

- Merged Felt Atelier construction, consistent character DNA across portraits and actual 3D meshes, and compatible saved customization.
- The distinct canonical 64-item and 147-item routes, their scoring contracts, historical results, and existing behavior.
- Detailed reports, the exercise library, check-ins, behavioral rehearsal, and proceduralization ladder.
- Local-first operation, explicit sharing, portable backups, offline support, and English/Russian support.
- Therapist/client and admin capabilities, account lifecycle behavior, payments, reminders, and support-dependent XR functionality.
- Existing automated verification and documented live/manual acceptance limits.

Existing references:

- [React/Vite parity implementation plan](react-vite-angular-parity-plan.md)
- [Feature traceability and retained contracts](react-vite-angular-parity.md)
- [Parity verification evidence](react-vite-angular-parity-evidence.md)
- [Duolingo-inspired design playbook](../duolingo-inspired-emotional-viral-design-playbook.md)
- [Plush Cosmos direction](innerverse-plush-cosmos-plan.md)

The Plush Cosmos document supersedes the earlier cosmic-ontology character proposals. The characters remain tactile, approachable Felt creatures; the cosmos is their environment. The new plan must not reintroduce the old character renderer or replace the merged cast with unrecognizable celestial abstractions.

## 3. Audit findings and their implications

| Finding | Product implication | Reference |
|---|---|---|
| Onboarding's primary completion action enters the 147-item assessment. | Heavy investment precedes the core benefit. | `src/parts-cartographer/screens/landing.jsx` |
| Home presents ten tool actions alongside menus and navigation. | The useful next action competes with feature discovery. | `src/parts-cartographer/screens/landing.jsx` |
| Practice begins behind full-assessment completion; later chapters have additional prerequisites. | Introductory usefulness is constrained by assessment and product dependencies. | `screens/practice.jsx`; `src/app/core/data/exercises.ts` |
| The separate eight-part assessment uses seeded randomness for several psychological-looking outputs. | Apparent personalization exceeds what its answers establish. | `screens/assessment.jsx`; `core/scoring-v2.ts` |
| Canonical scoring uses provisional norms and includes precise-looking derived scores. | Evidence boundaries and interpretation need review. | `src/app/core/data/scoring-v2.ts` |
| Some report narratives assert specific childhood experiences. | Emotional resonance can become an unsupported biographical claim. | `src/i18n/strings.ts`; `src/app/core/data/constellations.ts` |
| A report note promises crisis resources in Settings; the inspected React settings did not contain that destination. | The support journey is incomplete. | `i18n/strings.ts`; `screens/landing.jsx` |
| Storage writes, including journal and assessment writes, can fail silently. | A success message can accompany an unsaved reflection. | `core/local-store.ts`; `overlays.jsx`; `screens/full-assessment.jsx` |
| The saved universe screenshot shows overlapping characters, weak selection hierarchy, and truncated controls. | Improved rendering still needs composition and interaction direction. | `test-results/coordinate-universe-mobile.png` |
| The production UI includes simulated phone hardware and a narrow desktop phone frame. | Responsive product design remains incomplete. | `app.jsx`; `ui/ui.jsx`; `styles.css` |
| Startup includes an artificial approximately 4.2-second delay. | Deliberate waiting delays first value. | `app.jsx`; `screens/landing.jsx` |
| TypeScript's include list excludes React JSX files. | Build success is not complete static checking of the React application. | `tsconfig.json` |
| Offline precaching includes all build assets; service-worker activation replaces old caches. | Startup/download cost and interruption-safe updates need deliberate acceptance. | `public/sw.js`; `scripts/stamp-parts-cartographer-sw.mjs` |
| Booking commits appointment/lock before separate access-link writes; timestamps retain the legacy local-wall-clock contract. | Partial-failure recovery and timezone migration need explicit design. | `core/booking.ts` |

Paths abbreviated as `screens/`, `core/`, `i18n/`, and `services/` in this document are under `src/parts-cartographer/` unless explicitly prefixed otherwise.

Existing documented verification reports 802 unit tests, 19 emulator tests, four production-preview Chromium mobile flows, TypeScript and both builds, with zero production dependency vulnerabilities at that verification point. These are prior results, not checks rerun for this planning document. Browser accessibility checks excluded color contrast. Live account linking/cross-account UI, configured checkout, background push, OS install/update, XR hardware, and complete manual accessibility/bilingual acceptance remain documented release gates.

## 4. First principles

### Useful insight must change an available action

Every important insight should connect to an optional relevant practice and a later reflection. A report that offers recognition without an available next step cannot carry the entire product.

### The person remains the authority on their experience

The person can confirm, rename, reject, or revise interpretations. The app cannot establish their childhood history, another person's motives, or a fixed identity from a questionnaire. “I don't know” is a useful answer.

### Learning and emotional experience need different feedback

An educational scenario can have a better answer. A feeling cannot be wrong. Reward learning, attention, and experimentation without grading emotional health. Difficulty can increase through less scaffolding and more ambiguity; emotional exposure is a separate dimension.

### Separate state, recurring patterns, and skills

- **State:** what is happening now?
- **Pattern:** what tends to happen?
- **Skill:** what am I learning to do?

Temporary distress must not become a fixed identity, and quiz completion must not imply growth or mastery.

### Value extends beyond the app

Real-life application is the purpose. More time spent, greater attendance, or increased dependence are not sufficient definitions of success. The experience can become quieter as someone develops useful skills.

## 5. Excellence rubric and evidence requirements

Trust, safety, accessibility, and data integrity are release gates; they cannot be averaged away by visual excellence. The rubric is an internal design standard, not a promise of awards or clinical effectiveness.

| Dimension | Audit assessment | Excellence criterion |
|---|---|---|
| Product clarity | Material gap | A newcomer understands the promise and next step without learning the tool catalog. |
| First-session value | Material gap | A useful encounter precedes lengthy assessment, account creation, or payment. |
| IFS fidelity | Strong ingredients; review needed | Curiosity, permission, unblending, and respect for protective intentions shape the whole interaction. |
| Insight credibility | Priority gap | Claims stay within their evidence; disagreement preserves a satisfying experience. |
| Learning design | Good foundation; incomplete loop | Short lessons, active practice, varied contexts, spaced review, and application reinforce one another. |
| Personalization | Broad; uneven grounding | Recommendations respond to explicit preferences, context, and feedback with understandable reasons. |
| Habit and return | Needs consolidation | Returning is helpful; absence never becomes emotional failure. |
| Visual identity | Distinctive foundation | Felt material, typography, composition, icons, and motion form one recognizable system. |
| Interaction/navigation | Material gap | Clear hierarchy, predictable back behavior, comfortable controls, responsive layouts. |
| Accessibility/localization | Partial verification | Complete keyboard, screen-reader, contrast, zoom, motion, and bilingual task acceptance. |
| Privacy/agency | Strong foundation; lifecycle gaps | Understandable device/cloud ownership, sharing, access, revocation, deletion, and recovery. |
| Reliability/performance | Strong tests; remaining gaps | Durable saves, recoverable failures, modest-device usability, verified live services. |
| Relationships/support | Capable; needs refinement | Consent, contextual interpretation, verified provider claims, dependable scheduling. |
| Business value | Needs definition | Understandable paid benefit, transparent terms, essential support and data access retained. |
| Demonstrated outcomes | Not established | Research supports comprehension, usefulness, application, and acceptable unintended effects. |

## 6. Signature experience: Replay

### The user journey

A person brings an ordinary moment, by typing, optional speech input, or choosing a familiar situation:

> “My manager sent ‘Can we talk?’ and I immediately started preparing a defense.”

The app stages a small scene with Felt characters:

1. **Moment:** the event appears.
2. **Response:** the person identifies what happened, including uncertainty or another response.
3. **Cast:** they choose or create characters representing different pulls.
4. **Pause:** the scene freezes before the reaction.
5. **Negotiation:** the person explores what each part wants and what would make a small experiment acceptable.
6. **Rehearsal:** they try another response or imagined branch.
7. **Return:** later, they can record what actually happened and revise the interpretation.

Possible impulses are suggestions to edit, not discovered facts: prepare for every possibility, get away, ask what is needed first.

### A theatrical language for IFS

Selecting a part may temporarily narrow the scene: its concern becomes prominent, the camera changes, other voices become quieter. An unblending interaction opens the scene again and restores other possibilities. This is an optional visual metaphor, not a measurement of the user's mind.

The user controls pace, perspective, depth, and stopping. Imagined branches must remain visibly hypothetical; the system cannot know how another person will respond.

### Far transfer and inventive principle

Flight simulation, rehearsal rooms, film editing, and stage direction suggest slowing a moment, changing perspective, inspecting a sequence, and practicing an alternative. TRIZ **another dimension** and **dynamics** transform a static report into a changing scene over time.

## 7. First session: recognition through play

The initial plan called for a short guided encounter before assessment. The creative update sharpens it into an interactive moment.

Example:

> “You finally have an evening free. What happens next?”

Characters offer impulses: fill the time productively, disappear into distraction, contact someone, protect the quiet, or something else. The user can choose several, adjust intensity, and write their own. Then ask what each hopes the evening will provide.

The experience teaches that multiple understandable intentions can coexist. The person may keep the characters, change them, or start fresh. Their explicit choices create the map; a few responses must not manufacture a complete psychological profile.

Alternative entry needs remain available: overwhelmed, self-critical, affected by a relationship event, or curious. Offer “I'm not sure,” non-body-focused options, a brief reviewed practice, and honest helpful/neutral/uncomfortable/unclear feedback. Stop or choose another approach freely.

Aim for a first useful interaction in approximately two minutes, subject to usability testing. Longer assessments become optional instruments. Keep 64 and 147 routes distinct; clarify the purpose and outputs of the eight-part creative route and 14-item scan. Historical records must remain readable.

TRIZ **inversion**: experience the model before terminology, and create the initial map through the person's choices before applying deeper assessment.

## 8. Today and navigation

Today answers: what might help now, why this, and how much effort will it take?

Its composition includes a greeting without pretending to know the user's emotional state, one recommended session with duration and rationale, a small check-in entry, one unfinished/recently useful thread, and optional grounded insight. Feature discovery uses progressive disclosure.

| Primary destination | Purpose |
|---|---|
| Today | Check in and choose the next useful action. |
| Practice | Learn, rehearse, and revisit skills. |
| Innerverse | Meet parts and explore connections. |
| Journey | Review reflections, insights, and learning over time. |

Account, privacy, subscription, settings, and professional tools belong in appropriate secondary locations. The coach provides contextual assistance within journeys. The journal contributes to connected reflection and memory rather than remaining an isolated destination.

A short daily session connects situation → optional part identification → practice → feedback → optional real-life intention. Success is a useful observation or experiment; becoming calm is not mandatory.

## 9. Inner negotiation

An interactive council table supports two or three competing intentions:

> “One part wants to accept the opportunity. Another wants to protect my energy.”

Each receives a turn: what do you want, what worries you, and what would make a small experiment acceptable? Answers can be written, tentatively suggested, or left open.

The result is a small agreement to try, such as accepting one meeting, asking about workload, and deciding afterward. Save it as a tactile artifact—a stitched note or shared token—and revisit it after the event.

Negotiation exercises, cooperative board games, and participatory decision-making supply the far transfer. TRIZ **separation in time** and **local quality** let needs take turns and allow context-specific agreements instead of choosing a permanent winner.

## 10. Living Innerverse and Felt direction

### A relationship map with memory

Each part can accumulate user-approved details: protective intention, recurring situations, requests, useful practices, clashes/cooperation, and something the user wants to remember. The part's page becomes a developing relationship.

Three scales organize exploration:

- **A moment:** which parts are present here?
- **A relationship:** what happens between these parts?
- **A season:** what themes recur over recent weeks?

User-confirmed agreements can create stitched connections. A useful practice can become a small object associated with a part. A difficult week remains beautiful; an inferred score must not automatically declare healing.

Far transfer: narrative-game relationship maps, museum collections, and personal scrapbooks.

### Complementary map modes

- **Explore:** readable composition, larger selected characters, useful labels, and confirmed connections.
- **Coordinates:** preserved analytical axes and filters.

Keep canonical coordinates intact. Solve overlap through camera, labeling, and explicitly separate display layouts. Provide a full accessible list with the same Felt identity; every important task must work without 3D.

### Character and motion grammar

Use the merged Felt Atelier engine and shared DNA. Add a restrained expressive vocabulary: attentive, curious, hesitant, resting, relieved, and celebrating effort. Eyes, tilt, squash, and short gestures should read clearly.

Motion has a function: a lean asks for attention; size/prominence can reflect reported intensity; a pause gives room for an answer; shared space can depict an agreement; a settled pose closes a session. Avoid constant movement and distressed characters after missed days.

Separate the guide's voice from the user's parts. The guide introduces and supports the experience. Depicted parts must not invent motives or memories on the user's behalf.

Threads draw connections, saved agreements fold into fabric notes, Replay opens as a small theater, and reflections leave stitched markers. Use these sparingly and consistently. Far transfer: stop-motion direction, puppetry, tactile exhibits, and stage lighting.

### Wider design system

Resolve the public naming across ArchetypeAI, Innerverse, and PARTS. Remove simulated device hardware from production. Design tablet/desktop layouts intentionally. Establish coherent iconography, reading hierarchy, contrast, comfortable targets, and complete labels. Define restrained sound, optional haptics where supported, and reduced-motion behavior. Review Cyrillic typography and longer Russian strings throughout.

## 11. Insight credibility and longitudinal storytelling

### Grounded resonance

Rewrite unsupported certainty into an interpretation the user can examine. Replace assertions such as “Once, a child learned the physics of danger” with language such as:

> “Your answers suggest that quick action may sometimes feel safer than waiting. Does that fit? If so, you might explore what this part worries would happen if you paused.”

Each insight includes a concise interpretation, basis, fits/partly/doesn't-fit controls, optional next action, and deeper explanation.

Differentiate **you told us**, **your answers suggest**, **a possible connection**, and **AI reflection**. Do not add numerical confidence without an appropriate underlying method.

### Assessment review

Obtain qualified IFS and psychometric review of the item bank, provisional norms, interpretations, and gates. Avoid unsupported population comparisons. Review whether Self-energy/burden displays encourage agency or shame. Response-quality checks describe responses, not the validity of someone's experience. Questionnaire thresholds are not sufficient crisis assessment. Scoring revisions need versioning and transparent history/migration.

The eight-part route's seeded psychological outputs need correction or explicit reframing, with existing records kept understandable. Preserve canonical historical results rather than silently rescore them under a changed model.

### A personal documentary

Weekly episodes can assemble three scenes from user-confirmed observations: a recurring moment, an exception, and an open question. Example: uncertainty brought forward preparation; Thursday the person asked for clarification; would that be worth trying again?

Characters enact the sequence. Source moments are inspectable, interpretations editable, and episodes discardable. Sparse data can yield “There isn't a clear pattern yet.” Require enough observations for any claimed recurrence; avoid predictions of events or claims about hidden trauma.

The experimental **Show me another reading** feature offers another plausible interpretation of the same observations. It helps loosen rigid self-stories while keeping the person in control.

Far transfer: documentary editing and longitudinal notebooks. TRIZ **feedback**: corrections change future interpretations.

## 12. Adaptive learning and practice

Build on the existing exercise catalog and proceduralization ladder. For every skill define what someone should understand, notice, safely try, recognize as useful, and revisit.

Foundational capabilities include noticing a part, gaining some distance, distinguishing curiosity from criticism, exploring protective intention, asking permission, holding competing needs, choosing support/grounding, and practicing appropriate boundaries and repair.

A unit combines a relatable situation, a choice, an explanation, short practice, and optional real-life experiment. A skill appears across fictional scenes, user moments, conversations, retrospective Replay, and real events.

Difficulty increases through less scaffolding, ambiguity, and competing perspectives. Initial suggested choices can become self-authored responses, then independently recognized moments. Emotional exposure is not the difficulty dial.

Use spaced review and feedback such as tried, helpful, and want to revisit. Completion alone does not establish permanent mastery. Learning progress may unlock richer practice formats and creative expression; sensitive-work access remains separately governed.

Review each prerequisite. Safe introductory learning should not require 147 answers or synastry. Keep deeper-work restrictions pending qualified review. Neither streaks nor XP unlock deeper work.

Far transfer: deliberate practice, adaptive games, and music education, where fluency develops by practicing variations of a phrase.

## 13. Compassionate engagement and progress

Use a chosen weekly rhythm, flexible session lengths, review of useful skills, milestones for experimentation/application, welcoming return after absence, and optional discreet reminders with quiet hours.

Return copy can say: “Welcome back. We can start with what's happening today.” Recognize noticing sooner, trying a boundary, asking for support, and finding a practice unsuitable. Do not rank mental health, penalize feelings, depict parts as enemies, or imply emotional failure after absence.

The tangible artifact at session end—an observation, agreement, or experiment—is an intermediary between slow real-world growth and satisfying session closure.

Private editable milestone cards can be tested before broad social mechanics. Sharing must not expose answers, inferred vulnerabilities, or another person's information by default. Growth may mean less dependence on the app; let it become quieter as application improves.

## 14. Ambitious experiments beyond the initial core

| Experiment | Experience | Evidence needed to pursue it |
|---|---|---|
| Rehearse tomorrow | Several explicitly imagined branches for an upcoming conversation, followed by review of the actual event. | Better preparation/choice without treating rehearsal as prediction. |
| Shared conversation room | Two consenting people contribute their own experience to a jointly editable map of needs and possible agreements. | Better mutual understanding with individual disclosure control. |
| A reminder you authored | A discreet cue before a situation the person chooses, such as asking what is needed before preparing. | Useful timing, understandable behavior, easy silence/change. |

In the shared room, each person controls their own character and words. Neither receives an authoritative analysis of the other. Start reminders with explicit user-selected situations/timing. Passive sensing and behavioral prediction require additional justification and are not core commitments.

These experiments follow evidence for Replay and negotiation. Optional speech entry, generated variations, and theatrical metaphors are also experimental; access must remain available through simpler controls and text.

## 15. TRIZ contradiction resolution

| Contradiction | Inventive move | Decision |
|---|---|---|
| Personalization requires information; early questionnaires add friction. | Inversion; feedback | Start with a useful scene and learn through choices/corrections. |
| A rich world invites exploration; daily use needs focus. | Segmentation; nesting | Open one relevant scene; the larger universe is one level deeper. |
| Learning needs challenge; emotional pressure can undermine it. | Separation of parameters | Increase learning complexity independently of emotional depth. |
| Insight needs resonance; certainty can overreach. | Dynamics; feedback | Vivid editable interpretations, visible sources, alternative readings. |
| Growth is slow; sessions need closure. | Intermediary | End with a tangible observation/agreement/experiment to revisit. |
| Live 3D costs resources; identity must remain consistent. | Prior action; local quality | Reuse rendered Felt assets where motion adds little; use live 3D for meaningful interaction. |
| Return use supports the business; growth may reduce dependence. | Inversion | Celebrate independent application and quiet the app when helpful. |
| Competing parts make incompatible demands. | Separation in time; local quality | Give each a turn and negotiate a context-specific experiment. |
| Reports are static; understanding unfolds over time. | Another dimension; dynamics | Replay adds perspective, temporal sequence, and rehearsal. |

TRIZ and far transfer are ideation methods here. They do not establish therapeutic benefit.

## 16. Trust, services, and operational completeness

- **Support:** implement the promised destination, accessible from relevant moments and settings. Choose resources by relevant location instead of treating language as country.
- **AI:** identify generated content, keep context bounded/understandable, connect suggestions to reviewed practices, and evaluate unsupported certainty, invented memories, dependency-promoting language, and inappropriate relational advice.
- **Privacy:** define local/cloud ownership, shared-device behavior, account switching, deletion, consent withdrawal, and backup exposure. Local-first alone does not mean encryption.
- **Persistence:** accurate saved/pending/failed states, recovery, and durable storage. No success toast for a failed meaningful save.
- **Booking:** versioned timezone-aware contracts and recoverable partial failures across appointment, lock, and access links.
- **Payments:** clear price, billing interval, renewal, cancellation, and paid benefit; essential support and personal-data export remain accessible.
- **Professional support:** verify qualifications/descriptions before promising a licensed practitioner. Make client consent and access revocation understandable.

## 17. Engineering and quality

Remove the artificial boot delay. Measure complete startup and download cost, including vendors, catalogs, workers, and offline assets. Preserve offline capabilities with dependable readiness/update behavior and draft safety.

Benchmark Felt generation/rendering, memory, and context recovery on modest real devices. Use shared rendering, reuse assets appropriately, and reserve expensive live graphics for interactions that benefit from them. Inspect lifecycle/cache behavior through measurement rather than assuming current performance.

Expand static checking to React JSX. Introduce clear domain boundaries and predictable routing/back behavior as journeys evolve. Maintain data/model boundaries between assessment types and user-authored moments.

Acceptance expands beyond current Chromium mobile flows to Safari/iOS, Android, desktop, account changes, payment returns, background push, interrupted saves, manual screen-reader, contrast, keyboard, zoom, reduced motion, and bilingual use. Hardware-dependent XR remains a distinct acceptance task.

Use measured targets: Core Web Vitals at the 75th percentile, interaction responsiveness, appropriate device rendering budgets, and successful failure recovery. Passing builds alone does not establish these outcomes.

## 18. Revised roadmap and prototype priority

The original six-phase roadmap is retained as a capability/dependency map. The creative update changes sequencing: the first distinctive end-to-end prototype occurs early, alongside the trust specification/fixes, before broad infrastructure and feature expansion.

| Phase | Deliverable | Exit criterion |
|---|---|---|
| 1. Product/trust definition plus signature prototype | Audience assumption review, claim inventory, support/data contracts, preservation matrix, and a beautifully directed complete Replay/negotiation journey. | Core claims have an appropriate basis; the experience is concrete enough to assess. |
| 2. Core experience validation | Recognition-through-play, Today, one learning unit, one grounded insight, return after absence, revised report opening, and a simpler guided-text comparison. | Users understand the promise and complete a useful action; the interactive form earns its complexity. |
| 3. Connected learning foundation | Daily loop, foundational access, recommendations, feedback/review, agreements, revisiting, durable saves. | The whole loop survives interruption and works locally/offline. |
| 4. Felt/interface excellence | Expression grammar, Explore/Coordinates, responsive layouts, tokens, accessibility, localization, and device performance. | Critical tasks work across supported devices/access methods and performance budgets. |
| 5. Longitudinal value/services | Traceable pattern episodes, flexible progress/reminders, professional handoff, scheduling, payments; selected ambitious experiments only where justified. | Insights are correctable; live service journeys pass acceptance. |
| 6. Outcome/release evaluation | User research, content/safety evaluation, live/manual gates, recovery checks, phased rollout criteria. | Evidence supports comprehension, usefulness, reliability, and acceptable unintended effects. |

No calendar commitment or implementation authorization is implied. For each phase maintain **existing behavior → proposed improvement → data compatibility → acceptance evidence**. Operational task tracking belongs in Beads; this document records product decisions and acceptance principles.

Expanded XR, public competitions, collectible economies, further assessment variants, and broad viral campaigns are deferred until the connected experience demonstrates usefulness. These are not substitutes for an exceptional core journey.

## 19. Prototype questions and outcome evaluation

The first prototype must test:

- Can people explain the interaction without adopting an invented biography?
- Do they gain a useful shift in perspective?
- Is rehearsal useful for a real upcoming situation?
- Do characters make reflection easier?
- Do people voluntarily return with another moment?
- Can they disagree and still have a satisfying experience?
- Does the interactive version improve understanding, usefulness, or desire to practice compared with guided text?

Recruit across IFS familiarity, technical confidence, access needs, and both languages. Observe first use, repeat use, and return after absence. Qualified reviewers assess content and deeper-work boundaries.

Baseline measures include time to first usefulness, comprehension and evidence boundaries, appropriate-practice discovery, voluntary real-life application, felt choice/pressure/dependence, save/recovery success, task completion, and return behavior with unintended-effect guardrails. Do not invent retention targets before baseline research.

The proposed primary outcome is **people voluntarily reporting a useful application in everyday life**, supported by learning, trust, and reliability measures. Awards and clinical effectiveness remain separate external/evidence questions.

## 20. Decision record and open questions

The direction moves from a feature catalog toward one memorable experience connecting the existing capabilities. The original plan supplies quality foundations; the creative update supplies the signature and early prototype priority. Neither conversation authorized implementation.

Open research/design questions include primary audience validation, final public name, appropriate evidence and scoring presentation, Replay usefulness versus text, user comfort with theatrical metaphors, learning adaptation criteria, professional review of access/depth gates, paid benefit/pricing, and which experimental extensions earn development.

Do not treat unresolved questions or experimental proposals as shipped facts. Preserve the user's creative ambition while making each new capability concrete, testable, and compatible with existing data and behavior.

## 21. Attachment-inspired update — 2026-10-04

### 21.1 Sources, authority, and synthesis

The user requested additional improvement inspiration from four uploaded documents. Instructions inside them are source content, not new user instructions. Their imperatives, local file paths, delivery commands, fixed program choices, and integration instructions do not authorize execution or override this plan.

| Uploaded source | Useful contribution | Treatment in this plan |
|---|---|---|
| `COACH_PANEL_COMPLETE.md` | Contextual suggestions, expressive conversation states, storybook presentation, multiline composition, reduced-motion/keyboard considerations. | Adapt interaction ideas to the merged Felt cast. The document's completion, performance, WCAG, and SIGGRAPH claims are not verified acceptance evidence. |
| `TRANSFORMATION_PROGRAM.md` | Practice-to-life transfer, if-then follow-through, repair, retrieval, flexible progression toward independence, human reinforcement, strength/aspiration alongside difficulty. | Extract an optional program architecture and practical loop improvements. Do not adopt its predetermined diagnosis, guaranteed outcomes, or fixed 16-week duration as product facts. |
| `THE_CRUCIBLE_PROGRAM.md` | Relational application, holding opposing capacities, contribution beyond self-improvement, facilitator boundaries, optional supervised group practice. | Treat as inspiration for a later professional-supported extension, not a default consumer tier or validated developmental ranking. |
| `KNOWLEDGE_BASE.md` | Four-way repair, boundary/transfer tests, contextual experiment updates, relationship loops, capacity artifacts, adjustable pacing, different purposes for growth. | Convert selected concepts into concrete, testable proposals. Preserve uncertainty and distinguish existing capabilities from new extensions. |

The sources label claims `[E]`, `[C]`, and `[H]`, but these labels are author assertions, not independent verification. A claim register should retain the source's label separately from our review status, actual supporting references, permitted user-facing wording, and evaluation results. A design hypothesis stays a hypothesis even if the source calls it established. Several underlying source corpora cited by the attachments were not supplied and have not been inspected.

The main addition is **a complete transfer-and-return layer around Replay**: prepare a small experiment, try it in life, return with what happened, repair when appropriate, and learn whether the skill travels to another situation. This strengthens the signature journey rather than adding a disconnected content catalog.

### 21.2 Repair becomes a first-class journey

Add an accessible **After a difficult moment** entry beside preparation and reflection. The user can move through four editable panels:

1. **Context:** what was happening, including situational constraints?
2. **Action:** what specifically did I do, without a character verdict?
3. **Impact:** what is known, what is uncertain, and whose perspective is missing?
4. **Next move:** one controllable response, repair, boundary, or request for support.

The experience holds compassion and responsibility together. An optional rehearsal can help draft an acknowledgment or a different-next-time plan. It must not require confession, reconciliation, contact with an unsafe person, or agreement with an inferred account of harm. Choosing distance or support can be appropriate.

The four-way exercise and repair/charter events already exist in the app's catalog and check-in path. The new proposal is their coherent placement inside Replay, richer follow-through, and reuse of existing contracts. Do not rebuild them as a separate engine.

**Far transfer:** restorative practices and incident review. Understand the event, its effects, and a useful next action without turning a setback into an identity. **TRIZ:** segmentation separates context, behavior, impact, and choice that otherwise collapse into one global judgment.

### 21.3 A living experiment card connects rehearsal to reality

Turn the stitched agreement from sections 9–10 into a reusable experiment card:

- Situation/cue: “When I receive an ambiguous work message…”
- Expected difficulty: “I expect an urge to prepare before asking.”
- Chosen action: “Ask what the meeting is about before preparing.”
- Minimum version, fallback, and stop condition.
- Optional user-selected reminder and return time.
- Later outcome: tried, partly tried, not tried, no opportunity, or unsuitable; what actually happened?

Preserve both the expectation and the observed event so the user can compare them. Any update remains local and specific: “With this person, in this situation, asking was useful.” An imagined branch is separate from a lived observation. Neither establishes permanent safety, attachment style, healing, or memory reconsolidation.

Capture late or retrospective reports honestly. A tap saying a plan fired is still self-report. Unknown opportunity counts must not silently become failed attempts or a misleading success-rate denominator.

**Far transfer:** a scientist's notebook and software acceptance criteria. **TRIZ:** feedback connects an explicit expectation to a later observation. Extend the existing if-then/rehearsal ladder and events rather than replacing them.

### 21.4 Learning includes a counterexample and a new domain

Extend the learning system with four distinct probes: **explain → apply to a new scenario → recognize a boundary → transfer to another domain**. These are design lenses, not a validated psychometric battery or a universal proof of transformation.

The boundary probe is a particularly valuable addition. After learning to pause and ask a question, explore when immediate action, leaving, or requesting support would be more appropriate. Do not reward applying one technique everywhere.

Review starts with recall before revealing a recap. The next practice might move a skill from work to a friendship or family situation, with context-sensitive feedback. Suggested increasing review intervals are configurable experiments, not a fixed biological timetable.

**Far transfer:** test suites and adversarial examples. A skill should survive variation and recognize its limits. This is learning challenge through complexity rather than escalating distress.

### 21.5 Choose the purpose of a scene, not only its difficulty

Let the user indicate what they need from this encounter:

| Purpose | Product response |
|---|---|
| Try a different response | A small, reversible experiment. |
| Protect something important | A boundary, practical support, or change in conditions. |
| Make room for a loss | Witnessing, remembrance, or an optional ritual without a forced resolution. |
| Grow something valued | Exploration of a strength, interest, relationship, or contribution. |

A separate choice can distinguish needing immediate support, missing a skill, facing obstructive conditions, or wanting meaning/exploration. These are user-correctable planning prompts, not automated clinical diagnosis. They prevent the app from prescribing another inner exercise for an external problem or trying to calm a legitimate protective response.

Add aspiration from the beginning: “What would you like more room for?” Use what the person names—play, creative work, friendship, rest, devotion to a project—to shape scene selection. Lead feedback with an available strength or useful observation before difficult interpretation. This does not require optimistic claims or assume the person has an obvious resource today.

**TRIZ:** local quality matches the response to the purpose. **Far transfer:** appreciative inquiry and constraint analysis broaden the product beyond a catalog of problems to fix.

### 21.6 Let the real environment enter the experiment

When a plan repeatedly proves difficult, ask what would make it easier: available time, privacy, energy, another person's cooperation, task load, a reminder, or a different setting. Offer a small environmental change or a smaller experiment instead of more insight by default.

An optional outcome-gap review can compare perceived improvement with concrete examples. A mismatch is a question about context, measurement, opportunity, or fit—not a verdict that the person is performing growth or being dishonest. There is no hidden narrative-integrity score.

**Far transfer:** human-factors engineering. Change the conditions around an action, not only the instructions to the person. **TRIZ:** external resources and local adaptation reduce the burden placed on willpower.

### 21.7 An optional season gives the world a longer arc

Offer an opt-in guided season around one person-chosen theme. Its flexible rhythm is **arrive/resource → meet the pattern → practice in varied contexts → connect/integrate → hand over to independent use**.

The world can gradually collect experiment cards and scenes associated with this theme, yielding a coherent personal story rather than another feed. Each chapter offers modest, achievable actions and room to pause, repeat, skip, or change direction. Alternate practice with rest/connection; close sessions with an appropriate return beat.

The attachments' 16-week programs are possible facilitated formats to research, not required durations or efficacy claims. Never prescribe a childhood-origin diagnosis to justify a long program, guarantee a week-one emotional win, or tell someone worsening feelings prove the program is working. The handover includes a portable personal protocol, selected helpful practices, quieted reminders, and an explicit return option. Independence has no automatic facilitator credential attached.

This extends sections 12–13 and 18 rather than making a separate app. **Far transfer:** a narrative game's campaign with user-controlled pacing and a useful ending.

### 21.8 Human witnessing is optional, granular, and practical

Explore a chosen trusted person or suitable professional as a witness to one experiment. Share only what the user explicitly selects: for example, the cue/action card or a question they want to discuss. Invite consent from the recipient; permit decline, withdrawal, and private practice.

A lightweight buddy format could offer rotating prompts and explicit expectations: confidentiality, equality, curiosity, and no unsolicited advice or interpretation. Sharing consent must specify what can be retained after revocation; revocation cannot erase information someone already received.

Do not turn disclosure speed, number of witnesses, or human-versus-app disclosure ratios into mandatory performance metrics. Privacy, isolation, unsuitable contacts, and safety can make nondisclosure appropriate. Notifications must not expose the theme of the experiment.

This builds on the shared conversation-room experiment, with a simpler single-card pathway first. **Far transfer:** pair practice and a rehearsal partner, with the person retaining control over the material.

### 21.9 A relational Loop Finder becomes jointly editable

In consensual shared work, let each participant describe their own trigger, response, and need. Assemble an explicitly tentative loop: “When this happens, I tend to do this; you experience it this way; then this happens next.” Each edits their own contribution and can disagree with the assembled reading.

Offer interruption points, examples of helpful responses, and what each says they can offer or request. Highlight supportive exchanges as well as friction. Avoid a headline compatibility percentage, automatic causal claims from profile arithmetic, inferred motives, or declaring one person's view correct. Preserve canonical synastry records and computations while reviewing how interpretations are displayed.

**Far transfer:** collaborative process mapping. Make the interaction inspectable and revisable; no claim that the app has discovered the couple's true dynamic.

### 21.10 A resource team and gentle return make pacing tangible

Let users choose figures, objects, people, places, or activities associated with care, protection, perspective, and vitality. These are optional supports in their Felt world, not prescribed archetypes or measured proof of readiness.

Before and during a scene, provide plainly named controls such as slow down, change approach, and stop. Allow movement between a resource and a difficult moment, return to an overview, or use text instead of embodiment. Ending early does not fail a quest or damage a character.

Keep momentary readiness separate from historic questionnaire scores. Do not derive a safe exposure dose from provisional Self-energy or resource scores. Sensitive clinical techniques remain outside autonomous consumer experiments pending professional review.

Integration may optionally include acknowledgment of what an old strategy provided or what changing it costs. Do not require gratitude, mourning, retirement of a protector, or a ritual death. Gentle return and grief are available purposes, not assumptions about every user.

### 21.11 Coach interaction becomes scene-aware

Adapt useful ideas from `COACH_PANEL_COMPLETE.md` to a Felt guide that knows the current task: clarifying a scene, choosing an experiment, reflecting on an outcome, or preparing a repair. Contextual chips can offer “Explore another reading,” “Help me choose one move,” and “I want a simpler approach.” Keep suggestions available on demand rather than always auto-sending or disappearing permanently after one turn.

Use an auto-resizing multiline composer, explicit send/cancel controls, keyboard conventions suitable to device/input method, focus management, and reduced-motion/static states. Character states reflect actual interaction state—listening, waiting, ready—without claiming to read the person's emotions or celebrating an inferred breakthrough.

Use coherent Felt/paper presentation and appropriate reading hierarchy. Avoid introducing the attached document's separate owl/SVG style as a replacement for the merged cast. Show real network/failure state and avoid unnecessary simulated typing delay. Offer disagreement as tentative alternatives after acknowledging the experience.

The Angular coach-panel files exist in this repository; their existence does not verify every assertion in the upload. Any reused interaction needs current React acceptance, including screen-reader treatment of incremental messages and a complete stalled/offline/cancel path.

### 21.12 Capacity artifacts and useful partial outcomes

Make existing stitched artifacts meaningful by linking them to specific practice evidence: a scene where the user rehearsed asking for time, an experiment they reported trying, or a statement they want to remember. Label what happened accurately. A collectible is not proof of permanent capacity or therapeutic progress.

Treat partial attempts as useful observations: perhaps the person noticed late, tried a smaller version, or discovered a constraint. The next scene can adapt without rewarding invented success or obligating vulnerability to advance the story. Keep all fundamental support available independent of collecting artifacts.

**Far transfer:** narrative games' consequential partial outcomes and a musician's repertoire book. The artifact represents a reusable move and its context, not a mental-health level.

### 21.13 Later relational practice and contribution

The Crucible suggests an optional later extension: supported practice of listening, claiming a boundary, offering care, and accepting limits, including holding a boundary and care simultaneously. Use relatable tasks and examples, not 0–100 AROS gauges, spiritual altitude, or a new identity ranking.

A facilitated lab could support agreed fictional role-play, observer participation, private comfort/needs feedback, and clear pause options. Peers describe observable experiences rather than voting on whether someone is authentically Self-led. Facilitator training, scope, safeguarding, and professional oversight require separate design and acceptance.

Contribution can mean helping a friend in an appropriate way, creating something, or applying a skill at work. It does not require mentoring, recruiting users, peer certification, or entering a facilitator pipeline. Clinical competence cannot be granted by an app's graduation or verified-service counter.

This is a research-stage extension after consumer Replay/transfer demonstrates value. Do not include engineered relapse, withdrawn supports, forced vulnerability, peer-callable ego-trap labels, or automatic shadow/projection interpretations in the product.

### 21.14 Evidence and proposal boundaries

Several source mechanisms need explicit adaptation rather than literal adoption:

- App event timestamps and checkbox confirmations are behavioral records of app use or self-reported events; they do not independently verify offline behavior. Optional witness input is another perspective, not objective truth. Repair timing should not pressure immediate unsafe contact.
- Anonymous ratings of “energy” do not validate authenticity, Self-access, or clinical readiness. Small groups cannot be promised anonymity without analysis of identifiability.
- A simple lexicon ratio cannot diagnose deterioration, deception, bypass, or a person's mental state. A future opt-in writing aid could highlight a phrase and ask whether it fits, with language-specific evaluation and no hidden surveillance score.
- “Harmless recording” must not dismiss an ongoing threat. Grounding must leave room for present danger and practical protection.
- Do not define calm as absence of anxiety or confidence as absence of doubt; user-valued action can coexist with either.
- Do not adopt the categorical ban equating all positive reassurance with harmful identity labeling. Keep humane support while avoiding fabricated personal conclusions.
- No guaranteed reconsolidation, permanent change, universally required eight-item scales, causal attachment inference, or fixed developmental sequence is established by these attachments.
- Spiritual, ancestral, or transpersonal material is an optional, user-chosen meaning lens, not a default explanation, scientific claim, achievement rank, or inferred family history. Any strengths/lineage reflection also allows discontinuity and chosen relationships.
- Forced challenge, “twist the knife,” prescribed confessions, and hidden diagnosis are not methods adopted by this plan. Their source wording does not override user agency or the plan's boundaries.

### 21.15 Roadmap additions and acceptance

| Existing milestone | Attachment-inspired addition | Useful evidence |
|---|---|---|
| Signature prototype, phases 1–2 | One complete Replay including an experiment card and optional Repair; purpose choice; scene-aware guide. | Users can state their chosen next move, correct interpretations, and finish without forced disclosure. |
| Learning foundation, phase 3 | Recall-first reviews, boundary/transfer probes, environmental adjustments, honest opportunity/outcome recording. | The skill travels to a new scenario and users recognize when it is unsuitable. |
| Felt/interface excellence, phase 4 | Resource team, return controls, evidence-linked capacity artifacts, multiline/accessible coach states. | Pausing works immediately; interaction is usable with keyboard, screen reader, and reduced motion. |
| Longitudinal/services, phase 5 | Flexible guided season, optional buddy card, jointly editable relationship loop, independence handover. | Participants understand consent; the loop remains editable; reminders and guidance can fade without losing data. |
| Research-stage extension | Qualified facilitated relational lab and optional contribution pathways. | Separately reviewed scope and participant experience; no rank/credential inferred from use. |
| Evaluation, phase 6 | Contextual practice examples alongside perceived usefulness; source claim register; appropriate baseline/unknown states. | Records distinguish self-report, app activity, witness perspective, and reviewed evidence. |

The attachment update deepens the same product: a Felt world that helps people rehearse a choice, try it in their actual conditions, return with an honest outcome, and develop a broader repertoire over time. All additions remain planning proposals; no application implementation is authorized by this document update.

## 22. Narrative, IFS, and developmental-source update — 2026-10-04

### 22.1 Additional sources and review scope

The user subsequently supplied seven additional files for inspiration. This update draws on their design-relevant frameworks, practical exercises, interaction metaphors, and explicit limitations. Larger compilations were surveyed structurally and relevant sections examined; this is not a clinical validation or an independent review of every underlying cited work. Several are composite notes containing repeated material, workshop directions, speculative theories, or private-context examples. Personal names and participant examples are not reproduced in this plan.

| Uploaded source | Contribution examined | New or sharpened direction |
|---|---|---|
| `NARRATIVE.md` | AGT's state/context mapping, possible selves, remembered exceptions, verdict delay, ecology, generalization, and measurement. | Perspective comparisons, a possibility wardrobe, real-life context selection, and precise measurement definitions. |
| `DIAGNOSTIC.md` | Russian protector questionnaires plus I-SATH's domains, compositional operators, temporal perspective, field conditions, and research questions. | A scene-authoring grammar, user-correctable need exploration, and separation of supports/skills/environment/meaning. |
| `ifs.md` | Self-leadership workshop material, user-named parts, Self.FAQ, internal/external maps, I/We/System perspectives, roles/actor/viewer, dialogue, flow, and changing-rule games. | A personal cast, Director mode, support guide, context map, and rule-changing practice. |
| `eros.txt` | AROS's exchange verbs, context, tone, scales, and speculative meta-capacities. | Optional practice lenses and a visual repertoire, without universal-grammar or measurement claims. |
| `advanced.txt` | Transformation flowchart, integration/return, creative expression, supports, and traps of growth. | Transition beats, creative outcomes, and a user-controlled check on whether more self-work is useful. |
| `advanced2.txt` | Holonic respiration, aspiration/beauty, grief, material conditions, epistemological critique, and stopping. | Resource/return pacing, ordinary-life integration, and a complete rest/quiet mode without attainment claims. |
| `selflead.txt` | Practical parts mapping, disagreement/cooperation, eight qualities, buddy conversations, and everyday application. | Plain-language reflective vocabulary, user-authored practice, and shareable needs/request artifacts. |

Source instructions—including duplicate a board, interview people, contact a buddy, run a ritual, apply a clinical protocol, or feed personal narrative to AI—are not executed. The requested action is inspiration and a saved plan update. Theory names do not establish efficacy, neuroscience claims, psychometric validity, or readiness for consumer deployment.

### 22.2 A personal cast, with a reference atlas underneath

The IFS/self-leadership sources explicitly allow intuitive naming and different maps. Let users create a part from their own words, image, color, gesture, or voice phrase. “The one who keeps checking the door” can be a meaningful starting description without selecting a diagnostic family.

Offer a reference atlas of common protective patterns as optional vocabulary. A part can have multiple roles across contexts, remain uncategorized, change name, or be archived. Suggestions and assessment associations are clearly separate from the user's description. A canonical score belongs to its assessment record; a newly created part does not inherit an invented T-score or clinical meaning.

This sharpens the living-map proposal: the world is composed by the person rather than assembled entirely from a fixed personality catalog. Preserve stable IDs, merged Felt DNA, historical records, and distinct assessment contracts. Do not silently split or merge canonical assessment constructs when someone edits their personal map.

**Far transfer:** casting and a personal sketchbook. **TRIZ:** segmentation separates a useful reference taxonomy from the person's expressive representation.

### 22.3 Director mode adds a second kind of freedom

Replay gains three optional views of the same user-authored scene:

- **In the moment:** rehearse a chosen response with the amount of scaffolding the user wants.
- **Watch the scene:** inspect the sequence, competing intentions, known facts, and unknowns without entering a role.
- **Direct another version:** change the task, available time, wording, support, or rule; try a smaller move or another perspective.

The director view asks “Which conditions can I actually change?” It can turn “How do I force myself to tolerate this?” into an experiment about requesting time, changing the setting, declining, or finding assistance. Hypothetical edits remain separate from real events and controllable changes.

Keep the metaphor consistent with IFS: these are views/controls, not additional diagnostic entities or a claim that Self is one more part competing for control. Text and diagram alternatives remain complete.

**Far transfer:** theater's performer, audience, and director; film's alternate takes. **TRIZ:** inversion changes the scene's rules as well as the action within them. This extends Replay's perspective mechanic into explicit authorship.

### 22.4 A possibility wardrobe expands the available moves

When only two responses feel available—please or withdraw, perfect or give up—offer a small collection of provisional ways to act. Sources include a remembered exception, a quality the person admires, or an explicitly fictional example.

The user can try “the friend who asks directly,” “the creator who makes a rough first version,” or their own description for one low-stakes action. A Felt prop or pose can mark the rehearsal style without rewriting the identity of an existing part. Ask afterward what felt useful, awkward, or unlike them.

Possible-future scenes are rehearsals, not recovered memories, destined selves, or predictions. Historical counterfactuals should be optional creative reflection, never used to reconstruct an unreported childhood.

**Far transfer:** improvisation and trying on a costume. **TRIZ:** preliminary action allows a tiny rehearsal before asking for a permanent commitment. Test whether repertoire expansion adds useful choices beyond familiar response menus.

### 22.5 A Self.FAQ becomes a practical support guide

Create an editable **How to support me** artifact from the user's own choices, not an automated diagnosis. Possible sections:

- What helps when I am under pressure.
- How I prefer someone to ask a difficult question.
- How I signal a pause and when to revisit a conversation.
- What I can offer and what I want to request.
- Something I would like people to understand, in my own words.

The person chooses recipient-specific versions, previews every included line, and can export without publishing. Exclude raw answers, private journal text, internal character backstories, or sensitive interpretations unless deliberately included. Do not promise a downloaded copy can later be revoked.

One person might use it with a partner, another to prepare for professional support, and another only privately. This is a useful bridge from self-understanding to communication and a candidate for distinctive private sharing. It builds on the experiment-card consent design rather than exposing the entire Innerverse.

**Far transfer:** accessibility preferences and a collaboratively written working agreement. Evaluate whether another person can understand and use the request without labeling its author.

### 22.6 Outer context becomes an editable layer of the same scene

Extend environmental adjustment with an optional context map: people or roles, time, workload, resources, obligations, decision authority, and current constraints. Let the person compare **as it is** with **one change I want to try**.

I/Relationship/System views can reveal whether the useful action is practice, conversation, practical assistance, or structural change. User-created links describe their perspective, not a verified map of someone else's motives. Use roles or aliases where possible; do not automatically build third-party profiles or send those details to AI.

A dramatic experimental interaction is a reversible change in scene conditions: add ten minutes, move the conversation, ask for another person's support, or remove an optional demand. Then inspect which responses become imaginable. The app does not simulate or certify real causal outcomes.

**Far transfer:** service blueprints and editable stage sets. **TRIZ:** another dimension and external resources expand the solution space beyond the individual. This is a layer of Replay/Innerverse, not a new standalone product.

### 22.7 Needs, intentions, and requests become explorable

Use the diagnostic material as a source of tentative questions, not a new unvalidated scoring instrument. A scene can offer “What might this response be trying to protect?” with safety, belonging, autonomy, worth, rest, or the person's own words. A need remains unknown until the person endorses it; scores cannot prove deprivation or an unseen exile.

Use a brief dialogue scaffold: how do you describe this part, what might it want, how does it try to help, and what would cooperation look like? Thanking it is optional. The person can dislike the framing, choose ordinary language, or prefer observations without personification.

A communication rehearsal can separate observation, feeling, need, and request. Offer examples of a request versus a demand, including acceptance that someone may decline. Neither grammar nor a calm-sounding tone proves authenticity, harmlessness, or correctness.

### 22.8 Perspective postcards extend the existing sealed-reflection feature

Offer a two-perspective encounter: a note from a difficult moment and a later response the person writes themselves. Compare what remains true, what changed, and what was missing. An optional remembered exception can sit beside both.

The present app already has sealed verdicts and resurfacing. The addition is a clearer, user-controlled perspective comparison integrated with Journey/Replay. Keep old records compatible; any change to its fixed 48-hour behavior needs explicit product design and migration review. A fixed delay is not a clinically established threshold.

Users retain access, control of reminders, and the ability to edit/delete their material. Do not postpone urgent safety action, a protective boundary, medical care, or necessary practical decisions. An AI may help format a note; it must not impersonate the user's future wisdom as an authoritative message.

**Far transfer:** a time capsule and correspondence across viewpoints. **TRIZ:** separation in time makes differences inspectable without declaring one state the true person.

### 22.9 An eight-quality practice palette replaces a pursuit of a perfect score

Offer calm, curiosity, compassion, clarity, courage, confidence, creativity, and connection as optional practice intentions, illustrated by concrete situations and the user's own examples. Someone can practice courage while frightened or clarity while uncertain. No quality must be absent of difficult feeling.

Each intention links to a short reviewed move, a counterexample, and a real-life opportunity. Let users author an example that worked for them. Any sharing/community contribution needs separate review before becoming a recommendation to others.

This is a repertoire view alongside preserved assessment reports. It does not validate the current single-item radar, promise permanent qualities, rank a person's Self-access, or declare that the lowest numerical dimension requires development. The same principle can make Receive/Take/Give/Accept an optional action lens with plain-language examples; AROS remains a speculative organizing model.

### 22.10 Make creating, resting, and returning part of the world

Give a session the option to end with ordinary creative life: making something small, noticing something beautiful, contacting someone by choice, returning to a project, or resting. A postcard or stitched object may represent what the person chose; no logging or public acknowledgment is required.

Transitions can ask what the person wants to carry forward and what they want to leave undecided. Keep recognition of loss available without claiming every transition requires grief or a symbolic death. Recurrence does not erase a practice attempt; it also does not automatically prove a deeper healing cycle.

A **Quiet mode** hides recommendations, scores, and performance-oriented prompts while retaining essential controls and access to support/data. It can be available whenever useful, including before any program completion. Ordinary rest and pausing are distinct from the sources' advanced nondual capstone. No attainment or ego-dissolution interpretation follows from choosing quiet.

An optional reflection asks “Is more self-work helping me live what matters, or would another kind of support or ordinary activity help today?” It invites choice without diagnosing growth addiction or refusing help.

**Far transfer:** an artist's studio, a garden, and a product that gracefully leaves attention available for life. **TRIZ:** inversion makes the ability to stop optimizing part of the experience.

### 22.11 A scene grammar enables breadth without unrestricted generation

The diagnostic document's compositional operators inspire an internal authoring system for reviewed micro-experiences. A scene is assembled from explicit primitives: orient, choose perspective, meet a tentative intention, rehearse, choose an experiment, record an outcome, reflect, and close/return.

Each primitive has a declared purpose, allowed inputs, evidence status, accessibility alternative, optionality, stop/fallback behavior, and connection to existing data. Sequence, branch, repeat, and vary context. If AI participates, it may propose an eligible reviewed structure or wording variation; it cannot invent new clinical techniques, drop mandatory boundaries, or manufacture personal observations.

This makes the adaptive-game ambition more concrete: many relatable situations can use a small dependable interaction vocabulary. Add a human editorial preview that shows what the user sees, why a step is present, and how each alternate/stop path ends. Do not copy clinical engine schedules or physiological readiness thresholds into this consumer scene compiler.

**Far transfer:** a game quest editor and music's combinations of a constrained vocabulary. **TRIZ:** modularity and preliminary action permit expressive variation while preserving reviewable behavior. Prototype one manually authored scene before investing in the compiler.

### 22.12 Reconcile source contradictions before instrumentation

The sources use similar labels for different constructs. In `NARRATIVE.md`, **act-to-essence latency** means time from an event to a global self-verdict; in `TRANSFORMATION_PROGRAM.md`, it refers to noticing/unblending and a different preferred direction. `KNOWLEDGE_BASE.md` also associates shrinking global-verdict latency with improvement. Do not combine these into one KPI or optimize the name alone.

Define each proposed measure separately: event/reference time, what counts as notice/action, reporting method, units, unknown values, desired interpretation, and limits. For example, user-reported noticing time and a reported global judgment are different observations. Avoid elapsed-time competition and unsupported physiological measurement.

Other unresolved source tensions include strict engine sequencing versus parallel/conditional alternatives, prescribed stages versus cycles, universal AROS validation claims versus explicit house-method status, and automatic symptom escalation versus the user's control of pace. Preserve them in the claim register. Do not resolve them by declaring the boldest assertion true.

AI-alignment metaphors can inspire transfer testing; they do not demonstrate a human clinical mechanism or justify labeling a person a reward hacker. Beauty, torus animation, HRV, word choice, felt energy, or a reported sigh cannot prove brain-state change, reconsolidation, dissociation, safety, or spiritual development. Clinical interventions, exposure to addictive cues, altered-state induction, bilateral stimulation, provoked breakdowns, and contempt disguised as paradoxical coaching are not adopted consumer methods.

### 22.13 Incremental priority and prototype additions

| Priority | Additional direction | Relationship to the existing plan | Prototype acceptance |
|---|---|---|---|
| First signature prototype | Personal cast, Watch/Direct views, one editable context constraint, needs/request rehearsal. | Deepens Replay without expanding its clinical depth. | Users understand authorship, distinguish hypothetical from observed, and find a useful controllable move. |
| Transfer loop prototype | One support-guide artifact and perspective postcard alongside experiment/repair. | Extends consent-controlled sharing and Journey; reuses sealed-reflection data where appropriate. | Inclusion is explicit; another person can understand a request; user controls each version and revisit. |
| Learning foundation | Possibility wardrobe, eight-quality palette, optional action lenses. | Adds variation and strength-oriented practice to existing catalog/ladder. | Adds available responses without identity labels, pressure, or false skill certification. |
| Authoring infrastructure, only after the scene works | Reviewed scene grammar, alternate/stop paths, editorial preview. | Supports adaptive practice and future content scale. | Reviewable scenes retain their boundaries under branching and any generated variation. |
| Longitudinal and return experience | Creative endpoints, transition acknowledgment, Quiet mode. | Makes aspiration and independence tangible. | Rest and recurrence do not erase progress or imply diagnosis/attainment; support/data remain available. |

These additions extend the one signature journey rather than replacing the prior sections or approving a new implementation scope. The uploaded frameworks expand the design vocabulary; user agency, canonical compatibility, merged Felt identity, and measured usefulness remain the criteria for selecting what to build.
