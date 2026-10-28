# E12.01 Existing Code Inventory

**State:** private source-only candidate for independent review; unintegrated and incomplete for task acceptance.

This document records code visible in the declared E12 read set and compares it with applicable language in `docs/80-20-plan.md`. It is not an old-Bead reconciliation, accessibility acceptance, runtime result, or implementation change. Observations below are source-level only.

## Workcell and binding

- Source checkout: `git:d17aaa68a15b40c4e13eb7e9d7b93b4b08860365`.
- Workcell: isolated clean clone at that commit, `/tmp/innerverse-e12-workcell`.
- Task metadata binding: `base_generation` is null and `contract_versions` is empty. Pinning this clone makes the candidate reproducible, but does not fill either tracker binding.
- Declared read set: `src/parts-cartographer/screens/innerverse.jsx`, `src/parts-cartographer/screens/replay.jsx`, `docs/80-20-plan.md`, `architecture/contracts/**`.
- Declared write set: `docs/plans/elevation/e12/**`. This candidate is the only output in that set.
- Manifest: `.delivery/runtime/e12-cells.json` in the workcell; its digest is recorded in the handoff to the coordinator. No validated tracker/workcell lease or native task claim was obtained. This candidate must remain private and unintegrated.
- Scope limitation: the declared read set does not include original Beads or `docs/eleven-out-of-ten-plan.md`, so the requested old-Bead reconciliation is not performed here. A source review cannot replace it.

## Source inventory

| Declared source | Identity / availability | Source-level coverage |
|---|---|---|
| `src/parts-cartographer/screens/innerverse.jsx` | SHA-256 `3018d18492dc8f819a85aa2a383afa99f2f9ac644b4f9595bd5c91d37293b75e`; 785 lines | Inspected the complete file, lines 1–785. It exports the `Innerverse` mapping experience and `SpecialistView`; `ArchetypeStudio` is a local, non-exported function. |
| `src/parts-cartographer/screens/replay.jsx` | Absent at the declared path in this base | No Replay implementation could be inspected within the declared read set. No search outside that exact path was performed. |
| `docs/80-20-plan.md` | SHA-256 `7857691284f337ab2f5119292097a2eae603b296860eeb8584e9d8060fcbf370`; 936 lines | Relevant plan language at lines 42–54, 84–91, 107–109, 116–117, and 924–936. |
| `architecture/contracts/**` | Directory absent at this base | No published slot or interface version could be resolved from the declared contract path. |

## Plan intent (not observed acceptance)

The plan calls for the same part to be reachable through tap, keyboard, search, and an accessible list; it also calls for a complete list/detail path using the same Felt identity without WebGL, a static reduced-motion alternative, readable labels and controls, and a therapist analysis view preserving 3+1 coordinates and their provenance (`docs/80-20-plan.md:44–54`). The foundation section also calls out contrast, focus, touch targets, clipped labels, English/Russian copy, and real mobile/desktop layouts (`:86–90`). These are target behaviors, not claims established by this source inspection.

## Source observations

### Innerverse selection, search, and list-like paths

- `Innerverse` reads `parts`, profile, language, `universeMode`, and `uniReady` from `useApp` (`innerverse.jsx:44–48`). This file does not establish how the parent app supplies or renders the underlying map.
- It derives filtered and ranked part arrays, search matches (capped at eight), and up to three story parts (`:66–75`). The family, energy, focus, report-only, and cluster filters affect this projection (`:54–72`, `:244–309`).
- `openPart` sets `selectedId`, asks `uniRef` to focus the same ID, opens the part sheet, and clears search (`:108–113`). Search Enter calls `summon`; a match goes through `openPart`, while an unmatched query opens the Studio instead of fabricating a scored result (`:115–124`).
- Search results have a named `listbox` container and `option` children, but each option is a button with `aria-selected="false"` hard-coded (`:148–160`). The component tracks `selectedId` (`:59`), but the listbox options do not derive or expose that selection state; no `aria-activedescendant` is shown. This semantic mismatch is visible in source; actual keyboard and screen-reader behavior is untested.
- In `parts` mode, ranked parts render as horizontally scrollable `chip` buttons near the bottom of the screen (`:173–183`). The buttons call `openPart`, but do not expose a selected state through `aria-pressed` or a list/listitem structure in this file. Their presence is not evidence that the plan's complete accessible fallback works.
- Story cards open their detail sheet directly (`:196–210`), rather than calling `openPart`; the source does not synchronize `selectedId` or map focus on that path. A headline/essay may be shown from profile fields; this source does not establish their provenance or source linkage. The copy labels the story as reflection rather than diagnosis (`:76–81`, `:198–210`).
- Search has an explicit no-match message and a Studio action (`:148–161`). A zero-result `parts` view shows the localized `sw23` token (`:173–182`). Story mode has a default explanatory paragraph when its essay is empty, but no separate no-parts message is apparent in the rendered `storyParts` list (`:196–208`). The final text for localization token `sw23` is outside this read set.
- The component sends visible parts and dimensions to `uniRef` only when `uniReady` and the ref are present (`:87–95`). It includes no local readiness/error branch that selects a non-WebGL map implementation. Text controls are present in the component, but their availability and usefulness when the map renderer is absent cannot be established from this file alone.

### Motion, sensory choices, and provenance

- The file applies `screen-in` animation to the compare card (`:223–225`) and Studio preview (`:400–403`), and `animate-idle` to the Studio character (`:401–405`). No reduced-motion condition is shown in this JSX file; stylesheet behavior was not in the read set.
- No audio or sound control is shown in this screen source. This does not establish the whole app lacks such controls.
- The four controls labeled agency, temperature, focus, and attachment form a local affinity lens: dimensions are clamped and stored under `ifs.universe.dimensions.v1` (`:23–40`, `:83–85`); the UI says the highlight changes while answers and scores stay unchanged (`:271–294`). This lens is not evidence of the plan's therapist 3+1 analytical workspace or canonical coordinate provenance.
- Studio-created records are explicitly marked `sourceAssessment: 'studio'` when generated from the model (`:335–372`), and the code comment says search does not create scored parts (`:115–124`). No instrument/source/version label is rendered in the inspected map controls themselves. Do not equate the lens coordinates or Studio defaults with canonical measured values.

### Other components in this file

- `ArchetypeStudio` supports cancellation through an `AbortController`, catches generation errors into a local draft, and offers a save action (`:327–418`). This is source behavior only; network, cancellation timing, persistence, and recovery were not exercised.
- `SpecialistView` in this file is a client/link/availability/appointment dashboard. It has `role="alert"` for errors and `role="status"` for loading (`:646–664`), and client/link/appointment states are handled in the surrounding component (`:450–559`, `:674–780`). The inspected component does not contain a full-cast 3+1 analysis view. That observation is limited to this file and does not establish whether a separate workspace exists elsewhere.

## Evidence and gap map

| Scenario or criterion | Source evidence in this bounded audit | What remains unverified / missing |
|---|---|---|
| Ordinary map selection | Search and part chips call `openPart` (`innerverse.jsx:108–124`, `:173–183`). | Runtime synchronization between text and renderer; user completion or comprehension. |
| Search empty state | No-match copy and Studio route are present (`:148–161`). | Actual localized copy quality, focus behavior, and assistive-technology announcement. |
| Empty filtered map | A localized `sw23` token appears (`:173–182`). | Resolved copy and whether empty states preserve a useful action. |
| Story selection | Story cards open the detail sheet (`:196–210`). | Selected-ID/map-focus parity with search and chips. |
| WebGL unavailable | Text/search/story controls exist in this component. | No fallback wiring is demonstrated here; replay path is absent; no renderer failure was induced. |
| Reduced motion / quiet | Two animation class/style hooks are visible (`:223–225`, `:400–405`). | Reduced-motion alternative, independent sound/motion controls, and actual sensory behavior were not checked. |
| Keyboard and screen reader | Native inputs/buttons, Enter handling, labels, and some ARIA roles are visible (`:137–160`, `:266–296`). | The search option semantics and dynamic focus/selection need review; no keyboard or AT session occurred. |
| Large text and narrow EN/RU | The source contains localized labels and inline layout/overflow rules (`:132–183`, `:244–309`). | No large-text, viewport, clipping, translation, or device check occurred. |
| Failed / interrupted actions | Studio catches errors and has abort handling (`:335–378`, `:395–400`); practitioner errors/loading have ARIA roles (`:450–480`, `:662–663`). | No simulated failure or interruption/re-entry run; no evidence for map renderer failure or persistent recovery. |
| Coordinate/source provenance | Code marks AI Studio content and distinguishes map lens text from score changes (`:115–124`, `:367–372`, `:271–277`). | Published coordinate contract and exact source/version labels are unavailable; canonical provenance acceptance remains open. |

No participant, device, assistive-technology, research, live-service, or runtime evidence was collected. No tests, builds, Firebase access, deployment, tracker changes, or application-code changes were performed.

## Smallest useful next slice (proposal only)

After the coordinator binds an immutable task base and published contract versions, and obtains the missing original-Bead read scope for reconciliation, define a narrow selection-parity contract for search, part chips, and story cards: one selected-part state, one text/detail identity, explicit empty behavior, and a renderer-independent path. Review ARIA semantics and motion preferences against keyboard and screen-reader fixtures before changing the shared screen. Any shared-screen implementation needs its designated broker/integration handoff. This candidate does not implement that slice.

## Handoff

Private candidate for independent review only. Reconcile old Beads and contracts under an explicitly authorized scope; resolve the absent Replay path; then review against the task's concrete WebGL/audio/motion, keyboard/screen-reader, large-text, narrow English/Russian, source/action-preservation, and normal/empty/denied/failed/interrupted/quiet scenarios. Keep task acceptance open until the required source reconciliation and relevant empirical evidence are independently supported.
