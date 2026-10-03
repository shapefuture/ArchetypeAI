# ArchetypeAI / Innerverse — Personal Growth Master Plan

Status: consolidated planning document; implementation is pending. Saving this document does not authorize implementation, deployment, merging, or retiring Angular.

This document records the first-principles product audit and the subsequent bold creative update requested by the user. It is the consolidated source for the product decisions and proposed experiments from those conversations. Existing parity specifications and verification evidence remain the source for implementation contracts and test results.

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
