# E14.01 existing-code inventory — private source-only candidate

**Candidate only; no task acceptance is claimed.** This audit uses the coordinator-provided scope and a clean clone pinned to the stated source revision. It records only the declared source paths. No Beads claim, comment, or status change was made; no validated lease exists. No application code was changed and no behavior was executed.

## Scope and provenance

- Task reference supplied by the coordinator: `ArchetypeAI-1kgk`.
- Immutable source base: `d17aaa68a15b40c4e13eb7e9d7b93b4b08860365`.
- Declared read set: `src/parts-cartographer/screens/memory-library.jsx`; `src/parts-cartographer/screens/practice.jsx`; `docs/80-20-plan.md`; `architecture/contracts/**`.
- Candidate output: `docs/plans/elevation/e14/e14-01-existing-code-inventory.md` in `/tmp/innerverse-e14-workcell`.
- External proposed manifest: `/tmp/innerverse-e14-proposed-manifest.json`, SHA-256 `c6b4dd133d8bc4e1cc312f6a9ab4f405a73acf6bc62a8a8928b52a406e246da4`. It records the proposed paths and base only; it was not passed to a sweep or reservation and is not a validated workcell lease or acceptance record.
- The named `memory-library.jsx` path and `architecture/contracts/**` are absent at the pinned base. The available `practice.jsx` and `80-20-plan.md` files are the only source content read. No imported helper, other source, historical Bead, predecessor artifact, or user data was inspected.

### Source hashes at the pinned base

| Declared read path | SHA-256 / availability |
|---|---|
| `src/parts-cartographer/screens/practice.jsx` | `c3506563cf272fdfdcc0f2e1421a247713bf8aacaf6e1e3e260c1aa61f51958f` |
| `docs/80-20-plan.md` | `7857691284f337ab2f5119292097a2eae603b296860eeb8584e9d8060fcbf370` |
| `src/parts-cartographer/screens/memory-library.jsx` | Absent at the pinned base; no content hash exists. |
| `architecture/contracts/**` | No matching contract files at the pinned base; no content hash exists. |

## Observed implementation

### `src/parts-cartographer/screens/practice.jsx`

The inspected screen stores practice and check-in state under `INNERVERSE_PRACTICE_V1` and `INNERVERSE_CHECKINS_V1`, and reads additional synastry keys through `store.load` (lines 9–30 and 64–70). The screen validates parts of those in-memory shapes before use. `saveState` calls `store.save(PRACTICE_KEY, next)` (lines 121–124); timer completion also calls `store.save` directly (lines 150–168). The imported `local-store` implementation was not read, so these calls do not establish local-only storage, encryption, durability, sync, deletion propagation, or export behavior.

`selectedId` stores the selected exercise ID (lines 59–61); the selected exercise and assignment are resolved from that ID (lines 195–196), and the selected details render at line 293. This is not a selected memory, report, evidence field, or exported version. The screen contains exercise/check-in state and therapist-assigned practice loading, but no data-export preview, field allowlist, version-selection control, file creation, print action, clipboard/share shortcut, or revocation logic is visible in this component. The `export` keyword at the module boundary exports the `Practice` React component; it is not a user-data export path.

The screen has an assignment-load error branch rendered with `role="alert"` (lines 72–86 and 295). That is not evidence of recovery for an export or browser shortcut failure. No export UI was available to inspect for keyboard/screen-reader behavior or an accessible print layout.

## Plan-only intent (not implementation evidence)

The plan describes a private, user-controlled evidence library. It calls for deliberate source selection, a preview of the exact evidence to send, and the ability to remove it before use (lines 536–546). It also calls for inspect, edit, export, exclude, and delete controls across originals and derived records, with explicit retention/deletion limits (line 547). The plan requires accessible document import and a text path, but does not specify or demonstrate a particular export file or print implementation (line 548).

For sharing, the plan distinguishes a one-time export, revocable hosted access, and an ongoing shared artifact; it explicitly says that copied or downloaded information cannot be recalled after delivery (lines 573–576). The broader design guidance calls for source/version provenance and bounded data handling. These statements are requirements, not evidence that the current app implements them.

The coordinator-provided audit scenarios—field-level export preview, accessible file/print, selected-version export, unsupported shortcut recovery, and copied-file revocation limits—are treated below as review probes. They were not obtained by reading Beads and are not claimed to be exercised.

## Evidence and scenario map

| Scenario | Evidence in the declared source paths | Status and missing proof |
|---|---|---|
| Preview the exact exported fields | The plan calls for selecting exact evidence and previewing/removing it before a use (`80-20-plan.md:546`). `practice.jsx` has no export field list or preview. | **Plan-only.** Need an actual payload schema and UI that lists included fields, source/version identifiers, excluded items, and the recipient or destination before export. |
| Accessible file and print output | The plan calls for accessible document import and a text path (`80-20-plan.md:548`); the inspected practice screen has no file/print output path. | **Not verified.** Need an export format and an accessible preview/download/print route, including keyboard and assistive-technology evidence. Import accessibility does not prove export accessibility. |
| Export the selected version | The plan asks to preserve the original assessment name/version/scale/date/limitations and distinguish reuse, context update, and retake (`80-20-plan.md:543–544`). `practice.jsx` selection refers only to an exercise ID (`practice.jsx:59–61, 195–196, 293`). | **Not implemented in the inspected screen.** Need to define which version is selected, carry its identity/provenance into the payload, and verify the file matches the preview. |
| Recover when a shortcut API is unsupported or fails | No browser sharing, clipboard, or file shortcut API appears in `practice.jsx`. | **Not observed.** If the eventual export path uses such an API, verify unsupported, rejected, cancelled, and interrupted cases; keep the field selection available and present a working accessible file/print fallback without claiming delivery succeeded. |
| Revoke hosted access versus a copied file | The plan says hosted access can be withdrawn, but copied/downloaded information cannot be recalled (`80-20-plan.md:574–575`). No share or revocation UI is in the inspected screen. | **Plan-only limit.** The future UI must state which access can be revoked and that an already copied/downloaded file cannot be remotely erased. No implementation or recipient flow was inspected. |
| Empty selection, denied access, or interrupted export | Neither declared screen path supplies an export flow to inspect. The practice assignment request has its own loading failure branch, unrelated to exporting (`practice.jsx:72–86`). | **Unknown.** Need explicit no-selection, authorization-denied, cancellation, and interrupted-write behavior; do not report export success until a file or hosted artifact is actually produced. |

## Reconciliation and acceptance gaps

Historical Bead records, predecessor outputs, and prior review artifacts were not part of the declared source read set and were not read. Old-Bead/predecessor reconciliation remains unresolved. This candidate cannot say that an earlier criterion is satisfied or report an implementation regression.

Concrete evidence gaps for a later bounded verification include:

1. The named memory-library screen and applicable published contracts are absent from the pinned base. Locate or publish the authorized source and contract versions before claiming an implementation boundary.
2. Define the exported payload and selected-version semantics, including source identity, exact field allowlist, excluded/third-party fields, and version provenance.
3. Specify an accessible preview plus file and print alternative, and the behavior when a shortcut API is unsupported, rejects, is cancelled, or is interrupted.
4. Distinguish revocable hosted access from downloaded/copied output in the actual recipient-facing copy and permission flow; verify only the revocation the system can perform.
5. Reconcile the task’s historical criteria and predecessor evidence under an explicitly authorized read set. Then obtain independent review and the relevant accessibility/runtime evidence.

## Smallest useful next slice (proposal)

After the missing screen and contract boundary are resolved, trace one user-selected source and version through an export preview into a file/print output. Bind the preview to the exact generated payload; visibly list included fields and exclusions; provide an accessible text/print alternative; and exercise no-selection, unsupported/rejected shortcut, cancellation, and interrupted-output cases. Present hosted revocation and copied-file limits separately. This is a proposed investigation and fixture slice, not evidence that the behavior exists or authorization to implement shared app wiring.

## Candidate execution record

- Source base: `git:d17aaa68a15b40c4e13eb7e9d7b93b4b08860365`.
- Declared paths and one output are recorded in the external proposed manifest above; it was not validated by the workcell scheduler and creates no lease.
- This candidate is private and remains outside the root checkout. No Beads operation, app-code change, test, build, service access, participant contact, or data collection occurred.
- Independent review is pending. No task acceptance, task status change, or dependency change is claimed.
