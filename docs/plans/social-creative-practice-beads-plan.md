# Social, creative practice, and connection expansion plan

Prepared 2026-10-06 (client timezone: Asia/Jerusalem). Planning Bead: `ArchetypeAI-cyqe`.

The 2026-10-10 [living creative commons and serendipity extension](creative-commons-beads-plan.md) integrates both subsequent public-thread and participatory-world brainstorms into this same root. Its [additive graph and 66-proposal coverage](creative-commons-beads-plan.json) specify 22 deltas, 106 task slices, nine integrated pilots and eight candidate sweeps, reusing 54 existing F/B packages. The original graph and restore evidence below remain unchanged; new extension synchronization and empirical gates have separate evidence. Full mission recovery includes both source maps.

This document is the human-readable execution companion to [`social-creative-practice-beads-plan.json`](social-creative-practice-beads-plan.json), with the coverage index in [`social-creative-practice-coverage.json`](social-creative-practice-coverage.json). The JSON is the machine-readable dispatch snapshot; Beads remains the authority for live status, claims, dependencies and evidence. These files describe proposed work. They do not establish that any feature is implemented, that any test has passed, or that any user, practitioner, device, service or community evidence has been collected.

The plan is additive to the existing roadmap and records 1,807 proposed nodes (1,648 tasks and 159 epics), 4,240 dependency edges, 55 feature streams, 57 source-informed method packages, 12 architecture slots, six integrated pilots, and seven named sweeps. Its baseline snapshot records 688 existing Beads, product root `ArchetypeAI-d6d`, and architecture root `ArchetypeAI-n0h`. The architecture reference is AAA V7 specification 7.1.0, identified in the JSON by URL and SHA-256; it is marked draft normative. `immutable_generation` is null. Therefore, no generation, contract version, workcell, or lease is yet bound for execution. Resolve those values from live records before dispatch; never treat proposal metadata as an active reservation.

The imported graph was pushed to `refs/dolt/data`, pulled, and then restored into a fresh isolated Beads/Dolt database from the remote. The independent restore found all 1,807 mapped issues with matching titles and types, all 4,240 explicit dependencies, all 1,806 parent-child relations, and no missing or extra edges. This verifies tracker synchronization and graph integrity; it does not mean any planned product work is complete. The same evidence is recorded under JSON `validation.independent_remote_restore`.

## Purpose and product boundary

This expansion carries forward the prior elevation work into social connection, creative participation, reminders, games, personal meaning, plural accommodations, practical supports, source-informed methods, community knowledge and bounded facilitated services. It covers the subsequent additions represented by the 55 feature streams. The objective is a coherent set of user-controlled options and useful artifacts, with each slice reconciled against actual implementation and existing Beads before behavior is changed.

The six end-to-end pilots are integration probes for meaningful combinations, not evidence that an end state works. Feature and method tasks define narrower products and research packages. Where an implementation is already present, the team should verify the named criteria using fresh, applicable evidence and reuse the result rather than duplicate it. Where evidence or authority is unavailable, record the held or unverified state and identify the next prerequisite.

This plan does not change the prior roadmap’s authority or acceptance. Its stage boundaries authorize continued development beyond the old stages; they do not by themselves authorize a product release, clinical or spiritual service, or a live facilitated trial. Scope and acceptance for an actual service still require the appropriate accountable operator and evidence.

## Preserve the prior roadmap context

Use [80-20-plan.md](../80-20-plan.md), [first-principles-elevation-beads.md](first-principles-elevation-beads.md), and [aaa-v7-architecture-and-agent-sweeps.md](aaa-v7-architecture-and-agent-sweeps.md) together with this extension. The existing product roadmap remains the source for core product intent, previous acceptance milestones, and known implementation relationships. The first-principles plan and its Beads are predecessors to reconcile, not a status report to overwrite. The architecture and agent-sweeps plan defines isolation, immutable handoffs, lease semantics, broker integration, and independent verification expected here.

Carry forward these boundaries throughout this extension:

- Preserve authored loading and Felt identity, independent sensory controls, assessment-free support, canonical 64/147 provenance, and the complete therapist 3+1 workspace.
- Personal meaning, community participation, accommodation and progression must not silently rewrite formal assessment measurements or their provenance.
- Distinguish user-authored facts, self-report, metaphor or fiction, community observations, and model inferences. Do not infer identities or plural profiles, generate identity voices, claim recovered memories, or inherit therapeutic efficacy from a named approach.
- Treat consent and visibility as scoped, recipient-specific and revocable. Enforce public discovery only from fields the person selected for the relevant purpose. Private notes, diagnoses, therapist context and authored plural profiles are not discovery fields.
- Keep solo routes available where a social route is optional. A declined invite, no reply, quiet participation, pause, exit or incomplete session must have a dignified outcome and must not generate social debt.

The existing roadmap remains an independent body of work. Extension tasks can reuse or relate to existing packages and Beads, but a new graph node does not close, supersede, or certify an older issue. The JSON `baseline`, `authority`, `cross_plan_conflicts`, feature `reuse` fields, graph edges and coverage `reuses` fields are the machine-readable reconciliation aids.

## Feature streams

Each feature stream `F01`–`F55` has 16 sequenced slices (`S01`–`S16`) in the graph. The exact task title, purpose, concrete fixtures, reuse links, proposed paths, role, risk, estimates and blockers are in the corresponding JSON nodes. The coverage file maps each discussion requirement to its stream and lists the exact task IDs. Stream titles and intended behavior are summarized here for navigation.

### Social connection and support

- **F01 Shared-experience theme spaces:** persistent user-chosen themes, discussion and following, with disagreement retained and contributor discovery only by consent. Includes the explicit Pattern Shared Experiences correction.
- **F02 Finite life-event gatherings and cohorts:** temporary, user-selected spaces with a clear beginning, activity, follow-up and ending.
- **F03 Mutually authored relationship portraits:** separate approved accounts of preferences and misunderstandings that can lead to jointly chosen experiments, not compatibility verdicts.
- **F04 Mutual question and perspective reveals:** private answers first, edits and decline before a consensual reveal, and no fabricated answer for an absent person.
- **F05 People discovery through contributions:** discovery through thoughtful public contributions only when the contributor opted in; deletion and blocks suppress discovery.
- **F06 Purpose-specific friendship, practice and adult dating discovery:** distinct opt-in modes with explainable criteria and fail-closed adult eligibility for dating.
- **F07 Activity-first introductions and mutual continuation:** a short exchange, cooperative puzzle or creative activity precedes any mutual decision to continue.
- **F08 Purpose-specific trusted circles:** separate audiences for partner, buddy, friendship circle and practical support, with visible scope and a solo path.
- **F09 Useful invitations and limited guest participation:** invite a person to an approved question, support card or bounded activity, with exact preview and safe expiry.
- **F10 Support cards, current support requests and encouragement:** editable “how to support me” cards, explicit listen/help-think/company requests, and recipient-controlled encouragement.
- **F11 Accountability agreements and flexible shared rhythms:** mutually chosen cadence and nudges, obstacles and fallback, pause, and graceful re-entry without debt.
- **F12 Short shared presence and body doubling:** bounded sessions around a chosen intention, including text-only, quiet presence, cancellation and reconnection.
- **F13 Mutual repair rituals and communication agreements:** separate approved perspectives, a revisable practical agreement and maintained boundaries.
- **F14 Finite facilitated circles and mentorship:** purposeful groups with a host, participation agreement and endpoint; qualification and accountability gates apply where needed.
- **F15 Reviewed community contributions and useful gifts:** source-linked, editable, reviewed tools and gifts with attribution, withdrawal and finite browsing.
- **F16 Chosen social milestones and personal/shared recaps:** source-linked and correctable recaps whose audience and included facts are previewed precisely.

### Reminders and connection preferences

- **F17 Occasional grounded insight reminders:** one supported observation or saved intention, a useful optional action, and an explanation of why it is timely.
- **F18 Before-and-after user-chosen moments:** discreet preparation around a user-selected meeting or event and optional reflection afterward.
- **F19 Independent notification streams, budgets and return:** separate controls for commitments, trusted people and reflection/discovery; quiet hours, digest, pause and re-entry without debt.
- **F20 Useful notification actions, inbox and relevance feedback:** small supported actions from a reminder, an equivalent in-app inbox, and timing/relevance controls.
- **F21 Reliable notification delivery and revocation:** recipient/device authority, cancellation, expiry, deduplication, background limitations, timezone and daylight-saving behavior.
- **F22 Matching by interaction preferences:** revisable, explainable preferences for message length, directness, response rhythm, activities and quiet company.
- **F23 Interest constellations and enthusiastic deep dives:** user-selected intersecting interests and depth, collections, invitations and text equivalents.
- **F24 Parallel-play spaces and creative jams:** low-demand synchronous or asynchronous work with optional interaction, bounded artifacts and clear ownership.
- **F25 Flexible asynchronous friendship and expectation agreements:** explicit reply expectations, low-capacity signals and easy reconnection without read-receipt pressure.
- **F26 Social-event previews and participation clarity:** describe structure, duration, group, sensory expectations, first minute and exit options before joining.

### Creative participation and continuity

- **F27 Personal experience vocabulary and low-word communication:** user-authored metaphors and editable low-word request cards without assigning psychological meaning.
- **F28 Predictable structure with adjustable stimulation and novelty:** independent controls for density, motion, sound, richness and surprise while retaining navigation and context.
- **F29 Obstacle-specific help starting:** the person names or rejects an obstacle and chooses clarification, a smaller step, environmental change, company or rest.
- **F30 Creative bookmarks and project incubation:** preserve the exact last artifact, open question, references and optional next action for work that may rest.
- **F31 Expressive personal exhibits and multiple creative formats:** objects, maps, images, voice or creations with expressive text alternatives and exact audience control.
- **F32 Variable capacity, social recovery and protected rest:** user-chosen participation effort and recovery, with no inferred mood or readiness.

### Authorship, progression and play

- **F33 Optional user-authored profiles and terminology:** user-controlled names, pronouns, labels or no labels. Plural accommodations remain distinct from metaphor and creative exercises.
- **F34 Continuity notebook and attributable handovers:** record what happened, decisions and unfinished work with optional attribution and correction.
- **F35 Commitments, preferences and unresolved decisions board:** distinguish each person’s account, pending decisions and current shared agreements.
- **F36 Selective presentation disclosure and honest access boundaries:** recipient-specific cards and previews that accurately describe account and device visibility.
- **F37 Familiar orientation and return page:** a stable chosen next step, true local date/time, familiar artifact and selected practical contacts.
- **F38 Portability, backup, deletion and service durability:** usable export, restoration and shutdown continuity for notes, preferences, support cards and creations.
- **F39 Branching practical skill trees and evidence levels:** chosen destinations and routes labeled discover/rehearse/try/revisit, separate from personality measurement.
- **F40 Flexible builds and situation toolkits:** a temporary focus with selected cues, opening phrase, fallback and support contact.
- **F41 Context-varied transfer and progressively lighter support:** revisit a strategy in different contexts and taper cues only when the person chooses.
- **F42 Cooperative purposeful quests and chosen adventures:** a bounded shared intention with independently suitable actions, flexible pace, endpoint and useful artifact.
- **F43 Complementary roles and cooperative practical mini-games:** reviewed scenes with rotating roles and explicit, non-diagnostic outcomes.
- **F44 Retries, persistent learning and larger encounters:** preserve observations from a failed attempt, offer a smaller or different route, and combine tools for a chosen moment.
- **F45 Persistent Felt world and useful personal collections:** user-chosen objects/scenes grow from concrete actions and retained tools, with text equivalents.
- **F46 Bounded puzzle and creative expedition rituals:** finite scenarios with plausible responses, authored explanations, short/long forms and satisfying endpoints.
- **F47 Original character humor and sensory-aware celebrations:** coherent authored reactions connected to real actions, with quiet and reduced-stimulation equivalents.
- **F48 Useful gifts, seasonal stories and corrected recaps:** practical gifts and finite creative projects; personal/shared stories remain source-linked and correctable.

### Practices, meaning and supported services

- **F49 Purpose-organized source-informed practice library:** settle, understand, choose, rehearse and connect entries with reviewed source cards, scope, intensity and alternatives.
- **F50 User-authored meaning map alongside formal assessment:** personal dimensions, symbols, contexts and corrected examples remain separate from protected score provenance.
- **F51 Accommodation, support and environmental-fit library:** practical changes recorded with context and usefulness, with an optional portable request.
- **F52 Selectable bounded coach and communication rehearsal:** user-selected understanding, planning, environment change, rehearsal, company or pause with a clear endpoint.
- **F53 Community investigations and practical exception library:** participant-chosen questions and contextual comparisons, including contrary outcomes and source control.
- **F54 Qualified facilitated booking and scoped offerings:** separate clinical, spiritual and educational scope, accountable operators, chosen preparation and real booking states.
- **F55 Inclusive group formats, power awareness and co-creation:** hosted questions, quieter and dissenting views, rotating roles, feedback, appeals and shared artifacts.

## Method and source packages

The 57 `M01`–`M57` packages each have nine graph slices (`S01`–`S09`) for research, source/provenance handling, adaptation, boundaries, review and publication as represented by their node criteria. Read each method’s full JSON node before creating content or product behavior. “Inspired” indicates a candidate lens for careful review; it does not certify fidelity, efficacy, cultural permission, licensing, clinical suitability or practitioner endorsement. Package acceptance must establish a bounded, attributable and reviewed product use, or explicitly hold it.

The package titles are:

1. **M01–M10:** PCM-inspired stress preferences and playbooks; PCM-inspired communication translation; Gestalt-inspired present awareness experiments; Psychodrama-inspired ordinary rehearsal; Sociodrama and group role rehearsal; Psychosynthesis-inspired inner council; Chöd contextual source and compassionate relation; Feeding Your Demons source-informed exploration; ACT-inspired values-guided choice; Motivational interviewing-inspired ambivalence.
2. **M11–M20:** Jungian personal symbols and voluntary dream material; Jungian underexpressed qualities and shadow lens; Jungian opposites and third possibilities; active-imagination-inspired authored dialogues; Mindell process-work edges; Mindell expressive channels; deep democracy and overlooked perspectives; process-work rank and power awareness; DNMS-inspired supportive resources; DNMS-inspired present needs to practical support.
3. **M21–M30:** Stoic event, interpretation and influence reflection; Daoist less-forcing and workable conditions lens; Buddhist conditionality-inspired context map; mettā and chosen goodwill; Zen-inspired beginner attention; Mussar-inspired context-sensitive quality practice; Jain many-sidedness and perspective limits; Confucian reciprocal relationship expectations; karma-yoga-inspired effort and uncertain outcome; protected rest and personal transition rituals.
4. **M31–M40:** Focusing-inspired fitting words and metaphors; Hakomi-inspired gentle assumption experiments; narrative approaches and richer self-accounts; solution-focused exceptions and useful conditions; mentalization and uncertainty about other minds; compassion-focused warmth and useful action; existential choice, uncertainty and meaning; Tojisha-kenkyu participant-led collective inquiry; personal construct psychology and authored dimensions; person-environment-occupation fit.
5. **M41–M50:** cognitive analytic recurring sequences; CO-OP guided strategy discovery and transfer; Clean Language and preserved personal meaning; perceptual control theory and Method of Levels competing goals; Intentional Peer Support mutual learning; participatory sense-making and interaction conditions; double-empathy perspective and reciprocal adaptation; reflecting teams and selected tentative perspectives; supported decision-making and bounded support roles; micro-phenomenology bounded recent-event detail.
6. **M51–M57:** metacognitive and rumination-focused reflection endpoint; Morita-inspired capacity-fitting action with feelings present; Naikan-inspired support, contribution and effects reflection; forum theatre and fictional social change rehearsal; Liberating Structures distributed participation; positive deviance contextual useful exceptions; capability approach and meaningful options.

Preparation packages `V01`–`V08` describe evidence prerequisites. They cover compensated lived-experience co-design; social/matching participant evidence; accessible source, tradition and practitioner review; authorized accounts and community operations; physical device/manual accessibility; actual notification delivery; task-matched comparison and independent rubrics (including Pattern Shared Experiences and relevant products); and transfer, meaningful options and longitudinal follow-up. Their named requirements must be translated into actual protocol, recruitment, consent, source and evidence artifacts. A preparation task is not evidence merely because its artifact exists; record whether collection occurred and what remains pending.

## Shared architecture slots

The 12 platform packages (`B01`–`B12`) define capability seams that multiple feature and method packages may consume. These are logical slots, not pre-existing or currently leased modules. Their proposed contract names and required ownership are in the JSON.

| Slot | Capability seam | Main contract concerns |
|---|---|---|
| B01 | Public presentation and private preferences (`social.profile`) | Per-purpose public fields kept apart from private preferences |
| B02 | Opt-in explainable matching (`matching.discovery`) | Criteria provenance, eligibility, decline, block suppression |
| B03 | Membership, moderation and recipient authority (`community.membership`) | Server-enforced grants, revocation, roles, reporting and appeals |
| B04 | Messages, invitations and reviewed contributions (`social.messaging`) | Authorship, recipient scope, guest expiry, content lifecycle |
| B05 | Notification policy, scheduling and delivery (`notification.delivery`) | Separate local decisions from external delivery; device authority and quiet hours |
| B06 | Optional practical progression and quests (`progression.repertoire`) | User-owned skill paths, evidence labels and optional reward events |
| B07 | Authored presentation and creative continuity (`creative.workspace`) | Artifacts, attribution and honest saves |
| B08 | Reviewed source and practice catalog (`practice.catalog`) | Source/version, license, tradition, evidence, scope, review and withdrawal |
| B09 | Accessible bounded practice runner (`practice.runner`) | Purpose, consent, skip/stop, alternatives, useful outputs and no diagnosis inference |
| B10 | Personal meaning, context and accommodations (`meaning.map`) | Authorship, provenance, correction and isolation from formal scoring |
| B11 | Shared presence and finite group activities (`social.presence`) | Session roles, quiet/asynchronous participation, expiry and cancellation |
| B12 | Participant-led inquiries and contextual knowledge (`community.inquiry`) | Voluntary observations, comparison, contrary results and contributor control |

Before slot work, publish an immutable versioned contract with exact schemas, authorities, effects, compatibility fixtures and required tests. Slot publishers own the seam and compatibility surface. Consumers should depend on published contracts, never a producer’s internal components or uncommitted branch. The JSON’s slot dependencies and graph blockers specify where consumer work needs a contract; narrowing actual read/write sets may change safe scheduling and requires broker recomputation.

## Six integrated pilots

The pilots are end-to-end scenarios linking named feature and method packages. Each JSON pilot defines exact expected artifact/acceptance material. Preserve the scenarios below while filling in concrete interface, state, data and service detail in their tasks.

| Pilot | Scenario | Feature packages | Method packages | Integration question |
|---|---|---|---|---|
| J01 | Saying yes when you mean no | F01, F03, F06, F10, F39, F49, F52 | M01, M35, M42 | Can a person explore a connection, identify a need and rehearse a boundary with consent and no compatibility judgment? |
| J02 | Joining a creative group in a workable format | F22, F24, F26, F51, F53, F55 | M38, M40, M45, M55 | Can the person assess format/environment fit, contribute at a chosen level and leave with a useful artifact? |
| J03 | Resuming an unfinished creative project | F27, F29, F30, F37, F40 | M39, M43, M44 | Can they restore their own context and choose a workable next step without the system rewriting meaning? |
| J04 | Different support preferences in a relationship | F03, F04, F10, F13, F25 | M02, M46, M47, M49 | Can separate accounts lead to a mutual agreement while uncertainty, consent and boundaries remain visible? |
| J05 | Quiet short visit and trustworthy reminder | F18, F19, F20, F21, F28, F32, F46 | M25, M30, M51 | Can a bounded, quiet activity and reminder work across actual device, permission, timezone and return conditions? |
| J06 | Private continuity and selected presentation | F33, F34, F35, F36, F38 | M43, M49 | Can a person preserve and correct their private continuity while disclosing only a chosen presentation and retaining portability/deletion control? |

For every pilot, document normal, sparse/unknown, declined, denied, interrupted, quiet, exit and recovery paths that apply. Record exact data created, each author and viewer, permitted external effects, usable fallback, accessibility mode, and what evidence would establish the acceptance claim. A scripted walkthrough or mock integration is explicitly not real-account, device, practitioner or participant evidence.

## Dependency graph and seven sweeps

The graph encodes dependencies between outputs, not a fixed team assignment. A downstream task is unblocked only when its exact predecessor artifact and applicable evidence are available. The `dependencies` count is a graph snapshot; inspect live Beads and the JSON edges rather than inferring sequence from row order, labels or this prose. Conflicts represent proposed concurrent-write/slot incompatibilities and are not blockers. The JSON stores 16,341 proposed conflicts plus 1,204 cross-plan conflicts; this conservative snapshot must be recomputed from actual narrowed manifests before scheduling. Never encode a symmetric conflict as reciprocal blocking dependencies, which would deadlock both tasks.

The work naturally passes through reconciliation and research, publication of shared contracts, feature/method construction, integration, pilot review and bounded acceptance. However, run any genuinely ready dependency antichain as soon as its actual predecessors, contracts, capabilities and isolated resources are ready. Sweep labels coordinate handoffs; they do not act as blanket permission or hidden barriers.

| Sweep | Coordination focus | Named handoff tasks |
|---|---|---|
| W01 | Reconcile coverage and prepare source/user evidence | B01.S04, B08.S04, V01.S03, V03.S03 |
| W02 | Publish isolated extension slots and compatibility suites | B01.S09, B02.S09, B03.S09, B04.S09, B05.S09, B06.S09, B07.S09, B08.S09, B09.S09, B10.S09, B11.S09, B12.S09 |
| W03 | Compose theme spaces, discovery and relational support | F01.S13, F06.S13, F10.S13, F13.S13 |
| W04 | Compose reminders, creative continuity and authored presentation | F21.S13, F30.S13, F34.S13, F36.S13 |
| W05 | Compose progression, reviewed practices and group participation | F39.S13, F49.S13, F51.S13, F55.S13 |
| W06 | Verify six integrated pilot journeys | J01.S13, J02.S13, J03.S13, J04.S13, J05.S13, J06.S13 |
| W07 | Record scoped activation evidence and next largest gaps | J01.S13, J02.S13, J03.S13, J04.S13, J05.S13, J06.S13 |

A sweep compiles eligible work, collects immutable results into broker-owned integration, and hands off to an independent verifier. W03–W05 are composition checkpoints for representative flows, not permission to skip other F/M packages. W06 validates all six pilots against their acceptance scope. W07 records the evidence-bounded disposition and next largest gaps; it does not turn missing real-world evidence into acceptance. A held scope should be explicitly listed with owner, reason and prerequisite.

## Task execution, ownership and isolation

The graph nodes are dispatch specifications. Metadata paths such as `docs/plans/extension/features/...` are proposals for candidate artifacts, not proof that those directories or code modules exist. `base_generation: null`, empty `contract_versions`, `owned_slots: []`, and `workcell_status: proposal_requires_resolved_base_contracts_capabilities_and_lease` make the need for a concrete dispatch binding explicit.

Before code or content work begins, the broker must resolve a live task and bind:

1. An immutable base generation and exact predecessor versions.
2. A named worker/role and narrowed read/write manifests; the planned feature-owner, method-owner, slot publisher, broker, operator and verifier are distinct functions where conflict requires it.
3. Versioned contracts, permitted capabilities/effects, exact owned logical slots, fixtures, service accounts and data namespaces.
4. A real isolated workcell and renewable fenced lease, including checkout, dependency/build outputs, fixture database, ports and integration resources.
5. The expected candidate, change manifest, claimed checks and handoff artifacts.

No two concurrent workers share a mutable checkout, fixture schema/database, generated cache, build output or integration environment. Immutable read-only inputs and semantically immutable content-addressed caches may be shared. Same-slot alternatives stay separate until an explicit comparison. A filename assignment, branch name or shared filesystem folder is not an isolation guarantee. Leases need owner, scope, epoch, expiry, renewal and crash recovery so stale workers cannot publish or mutate after their authority ends.

Feature owners create narrow feature outputs and wiring requests; method owners prepare attributable source and adaptation material; slot publishers own contracts and compatibility suites. Central composition, worker dispatch, Firestore/security rules, shared locales and integration fixtures belong to the broker. Registry/content publication and independent verification retain separate ownership. A single agent must not author, integrate and independently accept its own evidence.

The prescribed feature task rhythm appears in the graph and should be read node by node: reconcile existing implementation and linked Beads; clarify/design and specify behavior; prepare fixtures/contracts; build bounded slices; verify expected/declined/denied/interrupted/quiet cases at the task’s depth; publish attributable immutable output; broker recompose; run focused boundary checks; independent review and handoff. Method, slot, preparation, pilot and sweep packages have their own slice counts and acceptance steps, so do not mechanically assume all package types share the 16-step feature pattern.

## Evidence and independent review

Every claim is tied to an exact candidate generation, contract/source versions, test or observation method, role and environment, result, limitations and next handoff. Beads records current status and evidence links. Keep credentials, raw age/identity documents and private participant content out of repository evidence. Record a test as a test, a prototype as a prototype, and participant/device/live-account/community/practitioner observations only when those activities actually occurred. Mark missing evidence as pending or unavailable.

Builders’ logs and self-authored reports are useful inputs, but they are not independent acceptance. Assign a reviewer who did not implement the candidate, give that reviewer the frozen candidate and applicable acceptance criteria, and require independent reruns or inspection. Participant and practitioner feedback must come through the applicable consented protocol and be attributed at an appropriate privacy level. Report contrary outcomes and evidence gaps. If the candidate changes after verification, publish a new candidate generation and rerun broker composition and affected independent checks; prior evidence no longer establishes the changed artifact.

Use risk-selected checks appropriate to actual effects and mutation. Verify privacy and authorization at server boundaries, negative and revocation paths, accessibility and reduced-stimulation modes, persistence/deletion/export, locale/timezone behavior, and device or service behavior where the feature depends on them. A local unit test cannot establish a real delivery or a qualified-service capability. Review claims and limitations against the source register and the evidence requirements in the task.

## Operational safety gates

These are execution constraints across applicable tasks. They are not optional polish and do not imply the underlying mechanism already exists.

### Consent, privacy and authority

Use explicit purpose-specific opt-in for matching, discovery, sharing, reminders and research. Preview exact content and audience before sharing. Enforce recipient authority, eligibility, blocks, expiry, cancellation and revocation on the server; client hiding is not access control. Revocation must suppress queued and future sends where relevant. Guest links are bounded and expire. Unknown eligibility fails closed for adult dating, and adult-minor dating discovery must be impossible. Keep age verification minimally retained and separate from public profile data.

### Identity, interpretation and measurement

Do not infer diagnosis, identity, plurality, age of a fictional/authored role, mood, readiness or another person’s intent from behavior. Do not generate identity voices or present metaphors as psychological facts. Preserve distinct authorship and disagreement. Assessment measures retain their canonical provenance; meaning maps, accommodations, self-report and progress evidence cannot silently alter them. Do not present a practice suggestion as clinical efficacy or a model interpretation as fact.

### Social and group safety

Make declining, blocking, leaving, pausing and using the solo alternative usable and non-punitive. No reminders or accountability mechanics should create accumulated debt or pressure after pause. Community contributions require review, attribution, source control, withdrawal paths and moderation appeals. Distinguish peer-hosted/educational use from clinical or spiritual services. If required qualification, source permission, jurisdiction/scope or complaint ownership is not verified, hold the service scope rather than simulating readiness.

### Notification, sensory and data continuity

Separate user preferences from platform permission and actual delivery state. Respect quiet hours, local time, daylight-saving changes, travel, device selection, lock-screen privacy, deduplication and cancellation. Offer equivalent in-app access when external delivery is unavailable. Keep sound, motion, density, richness and surprise independently adjustable. Support deletion propagation, usable export/restore and service shutdown continuity for in-scope personal artifacts.

### Governance and effects

Protected constitution, authority ceilings, evaluator definitions and promotion policy remain independently governed M4/R4 changes. Ordinary feature work cannot expand its authority or activate a new policy. Record exact side effects, rollback/undo and operational owner. Any release or live service use follows its actual authorization, scope and evidence gate; this planning snapshot does not replace it.

The JSON includes two explicit guard packages: **D01** requires purpose-specific adult eligibility and private verification (specification, minimal server-owned contract, server enforcement, independent adversarial verification, and versioned publication/hold); **D02** requires independently reviewed facilitated-service readiness (service/operator scope, verified qualifications and protocol, independent review, and a versioned readiness or hold disposition). Inspect each guard’s detailed steps before implementing any applicable path.

## How to use the JSON and coverage map

- Start with JSON `authority`, `baseline`, `scope` and `counts` to understand what the snapshot claims and what is still unbound. Do not infer live Beads status from the snapshot.
- Use `graph.nodes` and `graph.edges` for task descriptions, acceptance criteria, role, proposed paths, risk and mutation classes, estimates, predecessor outputs and dispatch links. Find the live Bead ID in the `beads_ids` mapping, then inspect current status and evidence in Beads.
- Use `coverage.json` as the discussion-completeness index: every `Fxx` requirement lists its task IDs and existing packages reused. Use it to trace each requirement to a graph task, not to decide whether the requirement is done.
- Use `features`, `methods`, `platforms`, `preparations` and `pilots` for package-level purpose, fixture and relationship summaries. The full graph node contains the detailed step criteria.
- Use `families` to navigate feature groupings; use `sweeps` to organize coordination and handoff; use `operational_guards` and their `D01`/`D02` nodes for explicit safety work.
- Use `conflicts` and `cross_plan_conflicts` as conservative proposed scheduling constraints. Reconcile them with actual manifests, live contracts and resource leases before dispatch. Keep conflict edges distinct from dependency blockers.
- Use `validation` and the plan-builder script as evidence of structural planning checks only. They do not verify product behavior or empirical outcomes.

The plan is generated by [`build-social-creative-practice-plan.py`](../../scripts/planning/build-social-creative-practice-plan.py). Rebuild only when intentionally changing the planning inputs, and review the generated JSON and coverage map together. This companion document is a narrative guide; if a count, task identifier or detailed acceptance criterion differs, inspect the JSON and live Beads and correct the documents through the normal planning change process rather than silently editing a generated artifact.

## Acceptance of the plan and continuation

A planning slice is complete only when its specified planning artifact, cross-plan reconciliation, graph integrity and coverage are attributable and reviewed. A feature, source package, platform contract or pilot is complete only against its own live Bead criteria and evidence. The expansion root is not complete because all proposed nodes exist or the generator passes structural checks. The final handoff records accepted scope, held scope, exact candidate generation, independent findings, residual risks and the next largest useful gap in Beads.
