# E11.01 existing-code inventory — source-only candidate

**Candidate status: acceptance HOLD.** This inventory records only the files present in the bound read set. It does not reconcile the original Beads, predecessor outputs, or published slot contracts because those sources are not in the live task's metadata read set. No app code was changed and no behavior was executed.

## Scope and provenance

- Live task: `ArchetypeAI-qtbi` — “[E11.01] Audit existing behavior and reconcile original Beads.” The task is claimed `in_progress`; this candidate does not close it or change dependencies.
- Immutable workcell base: `09194df5f48326bff14e42a1e4eb8d66c457186d`.
- Declared read set: `src/parts-cartographer/pal/FeltCharacter.tsx`; `src/parts-cartographer/screens/replay.jsx`; `docs/80-20-plan.md`; `architecture/contracts/**`.
- Declared write scope: `docs/plans/elevation/e11/**`. Actual candidate output: this file only.
- The `replay.jsx` path and `architecture/contracts/**` are absent at the pinned base. The two available files were read at that base; their hashes are recorded below. No other application source, helper, old Bead, predecessor output, task comment, or plan file was read. The live task metadata classifies the task R1/M0; this candidate is document-only.
- Task metadata still has `base_generation: null` and `contract_versions: []`. The candidate workcell pins a Git base and declares no contract reads; that does not update the task metadata or establish a published contract binding.

### Source hashes at the pinned base

| Read path | SHA-256 / availability |
|---|---|
| `src/parts-cartographer/pal/FeltCharacter.tsx` | `49c268d2d9ceadf7c7e68bafb592682213a141c6770ce07d964d7e5f28977198` |
| `docs/80-20-plan.md` | `7857691284f337ab2f5119292097a2eae603b296860eeb8584e9d8060fcbf370` |
| `src/parts-cartographer/screens/replay.jsx` | Absent at the pinned base; no content hash exists. |
| `architecture/contracts/**` | No matching contract files at the pinned base; no content hash exists. |

## Observed implementation

### `src/parts-cartographer/pal/FeltCharacter.tsx`

The component accepts `traits`, `dead`, `className`, `showShadow`, and an optional `{x, y}` `look` value (lines 3–6). `lite` and `textured` are present in the type declaration but are not used in the component body (lines 3–5).

The component stores a nullable `{key, src}` image. It derives `key` from `JSON.stringify(traits)`, dynamically imports `feltThumbnail`, and updates the image only while the effect is active. Cleanup marks the effect inactive; import/render-pipeline errors are caught without setting an explicit error state (lines 7–15). The helper implementation and the provenance, storage, network, and privacy behavior of the returned `src` are outside this read set and remain unknown.

The component clamps `look.x` and `look.y` to `[-1, 1]`. When `look` is supplied, it renders CSS perspective rotations based on those values; this is a static transform value in the inspected component, not evidence of an authored gesture sequence or a motion-control path (lines 16–18). `dead` adds grayscale, and `showShadow` controls a drop-shadow filter. The wrapper has the `data-character-engine="felt-atelier"` marker and a fixed `400 / 460` aspect ratio (line 18).

When the stored image key matches the current traits key, the component renders an empty-alt, non-draggable image. Otherwise, it renders an `aria-hidden` silhouette colored from `traits.color` (lines 19–22). The silhouette is a loading/fallback visual in this source; no empty, denied, interrupted, or user-authored meaning is attached to it here. A failed import is silently caught, with no explicit retry or user-facing error state in this component.

The component has no visible props or branches for requested, saved, or selected activity state, character dialogue, humor, recurrence, item responses, or canonical scores. Since its `traits` type, caller, and thumbnail helper were not read, this is limited to the component boundary; it does not establish what the larger app passes to it.

## Plan-only intent (not implementation evidence)

`docs/80-20-plan.md` calls for a coherent merged Felt identity across cards and meshes, clear selection, a tentative role/intent, and user-facing exploration distinct from therapist analysis (lines 42–48). It says the accessible list/detail route should retain Felt identity and provide a static reduced-motion alternative (line 52). These are requirements in the plan; neither the unavailable replay screen nor an end-to-end user route was observed here.

The plan treats behavior and interpretations as context-sensitive: humor may be useful, but should not be equated with a problem; a character or part relationship is a hypothesis rather than a discovered fact; user corrections and canonical results must remain distinct (lines 789–797 and 927–931). It specifically says the Felt presentation must not praise preferred responses or react differently to score direction during scored items, and that presentation effects require evaluation before claiming measurement equivalence (lines 797 and 930). No score or response path was available to verify this in implementation.

## Evidence and scenario map

| Requirement or state | Evidence at this step | Status and missing proof |
|---|---|---|
| Normal render path and visible engine marker | `FeltCharacter` renders a trait-keyed thumbnail when its key matches, otherwise a colored silhouette (`FeltCharacter.tsx:7–22`). | **Observed locally.** No runtime or route evidence shows whether the `traits` correspond to the requested, saved, or selected activity. |
| Requested / saved / selected state | No such state is represented in the inspected component props or branches. The named replay screen is absent at the pinned base. | **Not verified.** Need the actual caller/state seam and concrete state fixtures before claiming expressions follow these states. |
| Empty or not-yet-rendered | A null image or key mismatch takes the silhouette branch (`FeltCharacter.tsx:7–22`). | **Observed fallback only.** No semantic empty state, unknown state, or user-facing explanation is established. |
| Denied | No authorization or consent branch is visible in this component. | **Not exercised or specified here.** The import catch is not evidence of a permission-denied path. |
| Failed image generation/import | The dynamic import chain is caught without setting an error state (`FeltCharacter.tsx:9–15`). | **Observed failure handling is silent.** Retry, recovery, notification, and helper-side failure behavior are unknown. |
| Interrupted or stale request | Effect cleanup sets `active = false`, preventing a late result from updating state after cleanup (`FeltCharacter.tsx:9–15`). | **Observed lifecycle guard only.** No route interruption, persisted selection, resume, or user-visible recovery was exercised. |
| Quiet and reduced-motion use | The inspected component contains no audio path. `look` applies a CSS rotation value when provided (`FeltCharacter.tsx:16–18`). | **Not verified.** No preference control, static gesture mapping, reduced-motion runtime, or assistive-technology result was inspected. |
| Gesture equivalents | No authored gesture sequence appears in this component; the optional look transform is the only pose-like behavior visible. | **Not verified.** A static equivalent for every gesture cannot be asserted without the gesture source and rendered interaction. |
| Neutral canonical scoring feedback | No item-response or score prop/branch is visible in this component. The plan requires emotionally neutral scored presentation (`80-20-plan.md:797, 930`). | **Plan-only requirement.** No scored flow, response fixture, or measurement comparison was inspected or run. |
| Character authorship and interpretation | The component consumes `traits` and uses `traits.color`; no authorship or correction metadata is visible at this boundary. | **Unknown outside this boundary.** No user-authored role, editable interpretation, or provenance claim is supported by these files alone. |

## Original-Bead reconciliation and acceptance gaps

The task body names `ArchetypeAI-28h.2.7`, `ArchetypeAI-28h.2.10`, `ArchetypeAI-28h.4.1`, and `ArchetypeAI-28h.7.2`, and requests predecessor outputs. Their records and outputs are outside this workcell's metadata read set and were not read. Therefore this candidate cannot map old acceptance language to current evidence, report an already-satisfied slice, or identify a verified regression. The requested reconciliation remains **unresolved**.

Concrete blockers to task acceptance:

1. Expand or otherwise authorize the exact read set for the named original Beads and predecessor artifacts, then produce a criterion-by-criterion reconciliation with source/version provenance.
2. Resolve and bind the actual caller/state sources for requested, saved, and selected character states, the gesture source and static equivalents, and the scored-response boundary. `replay.jsx` and `architecture/contracts/**` are absent from the pinned base.
3. Bind the task to a resolved source generation and any applicable published contract versions; task metadata still has no base generation or contract versions.
4. Obtain independent review of this exact candidate and later collect the runtime, accessibility, and user evidence required by the applicable criteria. No participant, user, device, assistive-technology, runtime, or service evidence was collected here.
5. Record the reviewed artifact, actual manifest, unresolved evidence, and next handoff in the live Bead after independent review. No Beads comment or status/dependency change is made by this candidate author.

## Smallest useful next slice (proposal)

After the read-set and contract bindings are resolved, trace one selected character from activity request through saved state to rendered `traits`, then write a small evidence matrix for normal, empty, denied, failed, interrupted, and quiet states. Add explicit checks for a static equivalent to each actual gesture and for neutral presentation during a canonical response. Keep observations, tentative role hypotheses, user-authored corrections, and canonical instrument results as distinct evidence classes. This is a proposed investigation slice, not evidence that the behavior exists or permission to edit shared app wiring.

## Workcell execution record

- Exact manifest: `.delivery/runtime/cells.json`; it binds the metadata read/write paths, one concrete output, `git:09194df5f48326bff14e42a1e4eb8d66c457186d`, no contract reads/writes, no shared resources, and document-only capabilities. Manifest SHA-256: `cee3bc98fcdce20102dd60a999bb3750f641f126d76e8fac3c2974c87bfafea3`.
- Local reservation: `0b4d7976764746deaa40ed92d44f60b4` (owner `codex-e11-author`, stored in this isolated workcell). This reservation is local coordination metadata, not a broker lease, sandbox, task claim, or permission grant.
- Native Beads claim: `ArchetypeAI-qtbi` was claimed after the sweep/reservation and rechecked as `in_progress`, assigned to `Виктор П`; metadata read/write paths and dependency/parent were unchanged. Task metadata still reports a null base generation and no contract versions.
- Artifact quality check: `git diff --cached --check` passed after staging this single document. Rollback is deletion of this candidate document from the isolated workcell; it has no app or external effect. No tests, builds, browser/runtime runs, service access, participant contact, or data collection were performed.
- Review: independent review of this exact artifact is **pending**. Task acceptance remains **HOLD**; no task closure or dependency change is supported by this inventory.
