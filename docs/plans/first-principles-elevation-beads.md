# First-principles elevation: detailed Beads execution plan

Prepared 2026-10-06. Planning task: `ArchetypeAI-4q6`.
Product root: `ArchetypeAI-d6d`. Architecture root: `ArchetypeAI-n0h`.

The requested end state is a person who understands their situation more clearly, has more useful choices, and carries those choices into everyday life. This plan turns all twenty improvements into agent-progressable work and links each to existing Stage 0–7 Beads. It builds on [the elevation plan](../eleven-out-of-ten-plan.md) and [the implementation specification](../80-20-plan.md).

Beads is the source of live status, claims, blockers and acceptance. This document and [the machine-readable graph](elevation-aaa-v7-beads-plan.json) are design/dispatch references. They do not declare implementation complete. Every new feature stream begins by reconciling already-implemented work with the source Beads; an agent should verify and reuse a satisfied behavior rather than rebuild it.

## Graph size and structure

The expansion contains **558 Beads records: 499 tasks and 59 epics**. Counts exclude the separate planning task and pre-existing roadmap. The graph has 996 explicit non-parent relationships/blockers, plus the parent hierarchy. A separate proposal records 1386 potential symmetric ownership/write conflicts. These conflicts are not two-way Beads blockers.

- Twenty product streams, twelve steps each: 240 tasks.
- Twelve architecture work packages, eight steps each: 96 tasks.
- Ten contract/slot migrations, eight steps each: 80 tasks.
- Seven individual experimental extensions, eight steps each: 56 tasks.
- Six early empirical-preparation tasks.
- Seven sweep packages, three coordination/handoff tasks each: 21 tasks.

## Twenty improvements and their existing context

| Stream | Improvement and intended result | Existing Beads | Twelve-step range |
| --- | --- | --- | --- |
| `ArchetypeAI-5st` | Personal outcomes and graduation — Give each person a concrete chosen outcome and a recognizable endpoint, with a comfortable independence handover. | `ArchetypeAI-28h.5.3`, `ArchetypeAI-28h.5.4`, `ArchetypeAI-28h.3.5` | `ArchetypeAI-epv` → `ArchetypeAI-tph` |
| `ArchetypeAI-v0y` | Need-based entry and useful first result — Route immediate needs to a complete useful result before wider exploration. | `ArchetypeAI-28h.2.3`, `ArchetypeAI-28h.2.4`, `ArchetypeAI-28h.2.31` | `ArchetypeAI-r7r` → `ArchetypeAI-5mn` |
| `ArchetypeAI-8gs` | Capacity-sensitive experience — Let explicit available-capacity choices change effort, density and interaction length. | `ArchetypeAI-28h.1.6`, `ArchetypeAI-28h.2.2`, `ArchetypeAI-28h.2.3`, `ArchetypeAI-28h.5.4` | `ArchetypeAI-4ct` → `ArchetypeAI-93v` |
| `ArchetypeAI-ina` | Discriminating insight questions — Ask neutral questions whose answers change a useful interpretation or next action. | `ArchetypeAI-28h.2.31`, `ArchetypeAI-28h.2.27`, `ArchetypeAI-28h.2.28` | `ArchetypeAI-1hj` → `ArchetypeAI-965` |
| `ArchetypeAI-muh` | Useful action under uncertainty — Help people act modestly when explanations remain uncertain and collect useful observations. | `ArchetypeAI-28h.2.6`, `ArchetypeAI-28h.2.27`, `ArchetypeAI-28h.2.31`, `ArchetypeAI-28h.3.2` | `ArchetypeAI-3rd` → `ArchetypeAI-50r` |
| `ArchetypeAI-63e` | Corrections that propagate — Carry user corrections into relevant summaries, coach context and memory with visible change and undo. | `ArchetypeAI-28h.2.11`, `ArchetypeAI-28h.2.13`, `ArchetypeAI-28h.5.1`, `ArchetypeAI-28h.5.6`, `ArchetypeAI-28h.5.7` | `ArchetypeAI-wbc` → `ArchetypeAI-g0t` |
| `ArchetypeAI-cc1` | Contextual validity of personal knowledge — Let people mark observations still fitting, context-specific or no longer fitting. | `ArchetypeAI-28h.5.1`, `ArchetypeAI-28h.5.6`, `ArchetypeAI-28h.2.29` | `ArchetypeAI-bqm` → `ArchetypeAI-e8n` |
| `ArchetypeAI-q7n` | Transfer-centered learning — Help a chosen move survive new constraints and progressively lighter guidance. | `ArchetypeAI-28h.3.1`, `ArchetypeAI-28h.3.2`, `ArchetypeAI-28h.3.3`, `ArchetypeAI-28h.4.4` | `ArchetypeAI-60s` → `ArchetypeAI-2zs` |
| `ArchetypeAI-3au` | Satisfying adaptation feedback — Acknowledge revising, noticing exceptions, requesting help and choosing rest truthfully. | `ArchetypeAI-28h.2.10`, `ArchetypeAI-28h.3.2`, `ArchetypeAI-28h.3.4`, `ArchetypeAI-28h.5.4` | `ArchetypeAI-lgo` → `ArchetypeAI-hei` |
| `ArchetypeAI-al3` | Play with meaningful consequences — Use rearrangement, comparison and practical constraints to make choices legible and enjoyable. | `ArchetypeAI-28h.4.1`, `ArchetypeAI-28h.4.2`, `ArchetypeAI-28h.4.3`, `ArchetypeAI-28h.4.4` | `ArchetypeAI-aft` → `ArchetypeAI-s1i0` |
| `ArchetypeAI-m129` | Recognizable Felt dramatic roles — Develop coherent character personality, humor, gestures and recurrence around chosen activities. | `ArchetypeAI-28h.2.7`, `ArchetypeAI-28h.2.10`, `ArchetypeAI-28h.4.1`, `ArchetypeAI-28h.7.2` | `ArchetypeAI-qtbi` → `ArchetypeAI-xh1w` |
| `ArchetypeAI-95l8` | Beautiful quiet and accessible presentation — Give static, text, list and assistive-technology experiences equal craft and useful context. | `ArchetypeAI-28h.1.6`, `ArchetypeAI-28h.2.2`, `ArchetypeAI-28h.2.9`, `ArchetypeAI-28h.2.18`, `ArchetypeAI-28h.4.4` | `ArchetypeAI-xu75` → `ArchetypeAI-ufhi` |
| `ArchetypeAI-gk0a` | Universal interaction grammar — Make choosing, inspecting, saving, undoing, pausing and returning predictable across domains. | `ArchetypeAI-28h.2.3`, `ArchetypeAI-28h.2.5`, `ArchetypeAI-28h.2.10`, `ArchetypeAI-28h.7.1`, `ArchetypeAI-28h.7.2` | `ArchetypeAI-n215` → `ArchetypeAI-itsw` |
| `ArchetypeAI-va7j` | Tools useful outside the app — Provide discreet exports and optional shortcuts for the user-selected practical tool. | `ArchetypeAI-28h.3.2`, `ArchetypeAI-28h.3.4`, `ArchetypeAI-28h.5.4`, `ArchetypeAI-28h.5.6` | `ArchetypeAI-1kgk` → `ArchetypeAI-0ic4` |
| `ArchetypeAI-rhbx` | Human-session continuity — Connect selective preparation, booking, chosen questions and agreed next steps. | `ArchetypeAI-28h.2.11`, `ArchetypeAI-28h.2.14`, `ArchetypeAI-28h.2.15`, `ArchetypeAI-28h.2.16`, `ArchetypeAI-28h.2.20`, `ArchetypeAI-28h.5.1` | `ArchetypeAI-ypmu` → `ArchetypeAI-lyzi` |
| `ArchetypeAI-so00` | Therapist analysis of disagreement — Expose differences between instruments, contexts and time without false precision. | `ArchetypeAI-28h.2.20`, `ArchetypeAI-28h.2.21`, `ArchetypeAI-28h.2.22`, `ArchetypeAI-28h.2.23`, `ArchetypeAI-28h.2.24`, `ArchetypeAI-28h.2.30` | `ArchetypeAI-jinx` → `ArchetypeAI-jjvn` |
| `ArchetypeAI-ypjb` | Understandable reliability — Keep saving, sending, offline behavior, conflicts and recovery understandable at use time. | `ArchetypeAI-28h.2.1`, `ArchetypeAI-28h.2.5`, `ArchetypeAI-28h.2.9`, `ArchetypeAI-28h.2.12`, `ArchetypeAI-28h.2.15`, `ArchetypeAI-28h.2.17` | `ArchetypeAI-ugua` → `ArchetypeAI-90eo` |
| `ArchetypeAI-ue0t` | Physical-device comfort and economy — Validate sustained responsiveness, battery/heat, large text and repeated scene use. | `ArchetypeAI-28h.2.9`, `ArchetypeAI-28h.2.18`, `ArchetypeAI-28h.2.24`, `ArchetypeAI-28h.7.4` | `ArchetypeAI-l8d0` → `ArchetypeAI-viqf` |
| `ArchetypeAI-or8b` | Extensions that earn complexity — Compare each signature or experimental extension with a simpler complete alternative. | `ArchetypeAI-28h.4.4`, `ArchetypeAI-28h.7.1`, `ArchetypeAI-28h.8.1`, `ArchetypeAI-28h.8.2`, `ArchetypeAI-28h.8.3`, `ArchetypeAI-28h.8.4`, `ArchetypeAI-28h.8.5`, `ArchetypeAI-28h.8.6`, `ArchetypeAI-28h.8.7` | `ArchetypeAI-bdm4` → `ArchetypeAI-bwwq` |
| `ArchetypeAI-adpf` | Independent multidimensional evaluation — Evaluate comprehension, usefulness, correction, enjoyment, access and transfer independently. | `ArchetypeAI-28h.1.6`, `ArchetypeAI-28h.2.18`, `ArchetypeAI-28h.2.19`, `ArchetypeAI-28h.3.6`, `ArchetypeAI-28h.4.5`, `ArchetypeAI-28h.5.5`, `ArchetypeAI-28h.6.5`, `ArchetypeAI-28h.7.5`, `ArchetypeAI-28h.8.8` | `ArchetypeAI-wvtm` → `ArchetypeAI-h5bs` |

## The twelve intermediary steps

Each step is a separate Bead with a stream-specific title, source reads, deliverable, acceptance criteria, scenario fixtures, proposed ownership, risk/mutation classification and next handoff. This common pattern is specialized inside each stream:

| Step | Agent responsibility | Required output |
| --- | --- | --- |
| 01 | Inspect existing app, contracts and original Beads. | Gap/evidence map and smallest useful slice; identify already-satisfied work. |
| 02 | Specify the particular user outcome and all relevant states. | Normal, empty, waiting, denied, interrupted and quiet journeys with a stopping point. |
| 03 | Define the specific data/behavior contract. | Versioned proposal, source/authorship rules, state owner, retention and consumer fanout. |
| 04 | Implement pure transition/model behavior. | Narrow domain implementation and meaningful fixtures at changed boundaries. |
| 05 | Build the primary interaction. | Useful result, predictable next action and accessible native controls. |
| 06 | Integrate its consumers and context handoff. | Broker-owned wiring patch and canonical-data compatibility evidence. |
| 07 | Implement interruption, failure and authority recovery. | Applicable recovery matrix and observable truthful states. |
| 08 | Apply authored craft and access/sensory equivalents. | Felt/copy/state feedback plus complete quiet, keyboard and text/list paths. |
| 09 | Review EN/RU and retained-runtime applicability. | Expansion/tone review, locale behavior and justified parity scope. |
| 10 | Verify the changed boundaries and connected journey. | Actual targeted test results, composed artifact identity and unresolved evidence. |
| 11 | Give the exact output to a separate critic. | Comparison scope, largest gap, reasoning and accept/iterate decision. |
| 12 | Obtain the applicable outside evidence. | Real participant/device/account/service observation and reasoned acceptance decision. |

Examples of concrete fixtures already included in the task bodies:

- Inquiry: all five response types; exact optional words; neither/depends/correction; an exception; sparse sources; no silent history/score writes.
- Correction: reject a hypothesis, inspect affected context and summaries, undo, delete the source, and prove stale retrieval does not resurrect it.
- Session continuity: draft without sending, exact sharing preview, requested versus confirmed booking, revocation before therapist access, optional user-chosen post-session move.
- Therapist disagreement: compare 64 versus 147, contexts and times; preserve unknown axes; link complete numerical values with the 3+1 projection; separate historical therapist notes.
- Reliability: quota/save failure, offline read, cancel/late coach reply, booking duplicates/conflicts, revoked grant and restored renderer.
- Evaluation: reject old-build score transfer, candidate-owned acceptance claims, missing manual AT/live-service evidence and averages that hide hard failures.

## Evidence preparation runs early

Observation must use an exact evaluated generation. Recruiting/arranging the work, writing protocols and identifying available resources can start before implementation is complete.

| Bead | Preparation |
| --- | --- |
| `ArchetypeAI-mdci` | Prepare unprompted participant tasks and consented observation |
| `ArchetypeAI-dba0` | Prepare physical-device and manual assistive-technology sessions |
| `ArchetypeAI-sm9s` | Arrange authorized client, therapist, coach and booking verification |
| `ArchetypeAI-t0v3` | Collect obtainable task-matched competitor and plain-alternative references |
| `ArchetypeAI-qfj3` | Prepare source, qualification, community and hardware prerequisites |
| `ArchetypeAI-l035` | Prepare independent rubric and privacy-preserving observation records |

Applicable acceptance stays pending until the actual evidence exists. The user's phone report remains only that they tested and it was fine. This plan supplies no additional measurements, participant results, therapist-role journey or scientific validation.

## Individually scoped later extensions

Each extension has eight explicit steps: reconcile prior work; define hypothesis/comparator; specify prerequisites/consent/effects/access; smallest scoped prototype; recovery and alternative; actual outside observations; independent comparison; ship/iterate/stop decision. A supported decision to stop an experiment is a valid research outcome and does not imply the capability was shipped.

| Stream | Extension | Simpler comparator | Original Bead |
| --- | --- | --- | --- |
| `ArchetypeAI-lvq4` | Rehearse tomorrow | Preparation checklist | `ArchetypeAI-28h.8.1` |
| `ArchetypeAI-v6g3` | Permissioned shared conversation | Recipient-specific support note | `ArchetypeAI-28h.8.2` |
| `ArchetypeAI-slo9` | User-authored contextual cues | Exported physical cue | `ArchetypeAI-28h.8.3` |
| `ArchetypeAI-rnb2` | Qualified advanced facilitated labs | Ordinary appropriately scoped human support | `ArchetypeAI-28h.8.4` |
| `ArchetypeAI-jk0d` | Optional cultural and meaning lenses | Ordinary-language interpretation | `ArchetypeAI-28h.8.5` |
| `ArchetypeAI-fpvp` | One useful XR task | Complete non-XR map or rehearsal | `ArchetypeAI-28h.8.6` |
| `ArchetypeAI-efxt` | Consent-aware distribution | Private useful artifact export | `ArchetypeAI-28h.8.7` |

Facilitated services need an accountable operator and verified scope before being offered. Cultural lenses need appropriate source/community review. XR needs actual supported hardware evidence. Research/prototype work can continue while those prerequisites remain accurately recorded.

## Agent dispatch and handoff

1. Read the actual Bead and predecessors. Inspect metadata and original roadmap context.
2. Claim it through `bd update <id> --claim`.
3. Resolve its proposed workcell into an actual immutable base, exact contract versions, source reads, narrow write set, owned slots, isolated fixtures/builds/ports and capability limits.
4. Check the predecessor DAG **and** the conflict graph/live leases. `bd ready` alone does not prove parallel safety.
5. Execute the named slice in an isolated workcell. Request broker-owned changes for shared wiring, locales, package/lockfiles, worker dispatch, rules and integration fixtures.
6. Publish an immutable output and record evidence, limitations, contract changes and next handoff in Beads.
7. A separate verifier checks the candidate; the authorized publisher/integrator accepts the verified artifact. Close the task only when its own criteria pass.

Current workcell metadata is deliberately unresolved: `base_generation: null`, unpublished contract versions and proposed paths are design inputs. The new architecture runner/registry/compiler are planned work, not commands available today. Until implemented, shared-checkout file coordination is not AAA isolation. Read-only planning agents can inspect a pinned source; parallel builders require isolated mutable environments.

## Quality and continuation

The eleven relevant dimensions are usefulness, credibility, intuitiveness, distinct personality, delight, sensory agency, accessibility, reliability, performance, agency/trust and learning transfer. Each task identifies concrete user scenarios and its relevant evidence. A useful comparison and a hard gate have different roles; a high average cannot compensate for an ownership, measurement, permission or accessible-action failure.

Continuous improvement proceeds through successive finite scoped sweeps. Each identifies the largest unresolved useful gap, integrates accepted work into a new immutable base, and records what remains unsupported. Stage implementation may proceed under the user's existing authorization; release and empirical acceptance remain specific to the capability and required evidence.
