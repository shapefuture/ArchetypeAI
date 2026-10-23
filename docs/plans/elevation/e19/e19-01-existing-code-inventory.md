# E19.01 Existing Code Inventory

**State:** private source-only candidate for independent review; unintegrated and incomplete for task acceptance.

This bounded review compares the experiment descriptions present in the permitted plan source with simpler alternatives that could preserve their intended purpose and useful output. It does not claim that the plan's seven numbered experiments are the tracker’s X01–X07, and it does not claim any experiment was implemented, tested, or accepted.

## Workcell identity and scope

- Base checkout: `git:09194df5f48326bff14e42a1e4eb8d66c457186d` in a fresh isolated clone at `/tmp/innerverse-e19-workcell`.
- Candidate output: `docs/plans/elevation/e19/e19-01-existing-code-inventory.md` in that workcell only.
- Proposed manifest: `.delivery/runtime/e19-proposed-manifest.json`, SHA-256 `e9c96b08ac5b5da35466e15d142d2eff08d241fac9f0017e293ce421cb72704f`. It is a local proposal, not a validated lease, tracker readiness check, task claim, or permission grant.
- No Beads reads/writes or task claim were made. No application changes, tests, builds, experiments, participant/community contact, hardware access, or data collection occurred.
- Old-Bead and predecessor reconciliation remains unresolved. The permitted read set does not include those records or outputs.

## Source inventory

| Declared source | Identity / availability | Coverage |
|---|---|---|
| `src/parts-cartographer/screens/replay.jsx` | Absent at the declared path in this base | No Replay implementation could be inspected. No search outside that exact path was performed. |
| `src/parts-cartographer/screens/scene-review-workbench.jsx` | Absent at the declared path in this base | No review workbench, scene list, comparison state, or decision controls could be inspected. No search outside that exact path was performed. |
| `docs/80-20-plan.md` | SHA-256 `7857691284f337ab2f5119292097a2eae603b296860eeb8584e9d8060fcbf370`; 936 lines | Stage 3 Replay requirements at lines 491–514; Stage 7 experiments at lines 614–669; sequence and stage gates at lines 675–677; quality evidence at lines 691–708. |
| `architecture/contracts/**` | Directory absent at this base | No scene, experiment-card, community, hardware, or distribution contract/version could be resolved. |

## Identifier and evidence limits

The allowed plan uses numbered headings `15.1`–`15.7`, not labels `X01`–`X07`. I treat those seven Stage 7 entries as the available comparison set because the task scenario asks for seven experiments, but their one-to-one identity with X01–X07 is unverified. The absent Replay and workbench files also prevent source-based identification of an implemented experiment, output schema, owner, or comparison behavior. Mapping the identifiers and reconciling original Beads remains a separate unresolved prerequisite.

The plan calls Stage 7 experiments individual research/prototype commitments, not ship promises (`docs/80-20-plan.md:614–617`). It permits early sketches only when they do not consume the core release budget, require private data, or create production commitments; later implementation remains gated by preceding-stage acceptance (`:675–677`).

## Plan experiments compared with simpler alternatives

The alternatives below are proposals unless the plan itself names the comparator. Their outputs are inferred from the plan’s stated purpose and steps; none is a verified product behavior.

| Plan entry (possible X mapping unverified) | Intended purpose/output described in plan | Simpler alternative with matched purpose/output | Qualifications, prerequisites, and stop criteria |
|---|---|---|---|
| **15.1 Rehearse tomorrow** | Help the user prepare for an upcoming ordinary situation, then choose/edit a response and export it to an experiment card (`:618–624`). | **Explicit plan comparator:** a simple preparation checklist. It can produce the same practical chosen action/card without interactive branches. Retain the interactive scene only if it improves decision quality or willingness to practice without adding overload. | Keep branches hypothetical; do not predict another person’s response. Use reviewed scene grammar and a practical constraint. Stop or keep the checklist if the interactive version adds no benefit or increases overload (`:620–624`, general gate `:669`). |
| **15.2 Shared conversation room** | Support one clearly defined collaboration mode and produce a jointly accepted draft with contribution history (`:626–632`). | The plan requires choosing either asynchronous artifact exchange or a synchronous room, not promising both. **Proposed simpler comparator:** one asynchronous exchange for the same draft and contribution history. The plan does not specify an experimental comparator. | Reuse recipient permissions and per-person context previews; test disagreement safety, power imbalance, stale permissions, and accidental sharing before distribution. Pause/stop distribution while any of those remain unresolved (`:628–632`, `:669`). |
| **15.3 User-authored contextual cues** | Let a user choose a reminder phrase, object, or time-of-day invitation and control when it appears (`:634–639`). | **Explicit plan comparator:** a physical or exported cue versus an app cue, choosing whichever helps the person outside the app. Both should deliver the same chosen reminder without requiring continued app use. | Cues must be deliberately authored, disableable, discreet, and explicit about account/device ownership. No passive sensing. Stop app delivery if it adds no value over the physical/exported cue or undermines privacy/discretion (`:636–639`, `:669`). |
| **15.4 Advanced facilitated labs** | Deliver a specific sensitive facilitated protocol with stop/return and support options (`:641–646`). | The plan provides no matched simpler comparator. **Proposed prerequisite comparison:** first check whether a reviewed self-guided practice with equivalent purpose and a clear support/exit route is sufficient; it does not substitute for qualified facilitation where that qualification is material. | Require qualified operators, reviewed boundaries, separate research consent from app consent and paid-service terms, and protocol-specific evaluation. Do not proceed without qualified staffing, consent, boundaries, and support; do not borrow blanket effectiveness claims (`:643–646`, `:669`). |
| **15.5 Cultural, lineage, and meaning lenses** | Offer a user-selected interpretive lens with transparent provenance and ordinary-language alternatives (`:648–653`). | **Explicit lower-complexity path:** ordinary-language reflection with the lens absent or optional, preserving the user’s ability to explore meaning without asserting a tradition. The plan does not state a trial result. | Require appropriate sources and community reviewers before presenting a tradition. Do not infer ancestry, spirituality, or rank; allow correction/rejection. Stop if provenance/review is unavailable, the lens imposes a worldview, or it replaces assessment evidence (`:650–653`, `:669`). |
| **15.6 XR and hardware** | Use spatial presence for a task that materially benefits from it, such as inspecting an authored rehearsal arrangement (`:655–660`). | **Explicit plan comparator:** the ordinary map/scene with a complete non-XR path. The same inspection/useful output must remain possible without XR. | Verify supported real hardware, input, pause/exit, rendering, account lifecycle, motion comfort, room/device constraints, and privacy. Stop/iterate rather than ship when the XR path does not improve usefulness enough to justify effort/comfort costs versus ordinary presentation (`:657–660`, `:669`). |
| **15.7 Distribution experiments** | Share user-chosen useful artifacts and measure meaningful activation and consent understanding (`:662–669`). | **Proposed simpler comparator:** private export of the chosen artifact without an invitation/distribution feature. This preserves the artifact while minimizing audience and permission complexity; the plan does not specify this exact comparison. | Begin only after core value and the optional return loop are demonstrated. Share selected artifacts, not private psychological labels; do not include public competition, passive sensing, new instruments, or spiritual rankings by default. Stop if consent is not understood, sharing scope is unclear, or meaningful activation is not demonstrated (`:664–669`). |

### General experiment gate

The plan requires each experiment to have a written hypothesis, smallest prototype, accessible alternative, bounded privacy/service scope, comparison condition, observation record, and ship/iterate/stop decision (`docs/80-20-plan.md:669`). This is a plan gate, not evidence that any X01–X07 comparison or prototype has passed it.

The broader quality rubric calls for actual participant response, accessibility alternatives, supported-device measurements, consent comprehension, and learning-transfer observations where applicable (`:691–708`). No such evidence was collected in this source-only audit.

## Hypotheses (not source findings)

1. Some proposed alternatives may satisfy the same practical purpose with lower interaction and privacy cost: a checklist for rehearsal, an asynchronous exchange for one collaboration artifact, a physical cue, or ordinary map/scene before XR. Whether they preserve the same user value must be compared, not assumed.
2. Facilitated labs may not have an equivalent self-guided substitute if qualified human support is the intended outcome. The comparator should therefore be selected from the precise protocol and user goal, with no claim that self-guided content is clinically or operationally equivalent.
3. The numbered Stage 7 plan experiments may correspond to X01–X07, but that mapping cannot be confirmed from the allowed sources. Treating it as fact would contaminate scope and comparison.

## Smallest useful next slice (proposal only)

First resolve the authorized X01–X07 definitions, owners, source/output contracts, and predecessor evidence; the allowed plan does not define those identifiers. Then create a one-row-per-experiment comparison brief containing purpose, intended output, simplest plausible alternative, comparison measure, evidence source, accessibility path, privacy/service scope, prerequisites, and a stop rule. Validate the brief with the designated reviewer before any prototype. The plan’s explicit comparisons (checklist, physical/exported cue, ordinary map/scene) can anchor the first low-complexity studies; do not start community, facilitated-service, or hardware work until its named qualifications and lifecycle conditions are satisfied. This proposal was not implemented or externally reviewed here.

## Handoff

Private candidate only. The Replay screen, scene-review workbench, and contract directory are absent at the pinned base. X01–X07 identity, old-Bead/predecessor reconciliation, and implementation evidence remain unresolved. No experiment, comparison, community prerequisite, hardware capability, stop gate, or acceptance result is claimed as verified.
