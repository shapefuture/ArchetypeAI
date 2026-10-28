# E18.01 — Existing code inventory: map re-entry and device performance

**Candidate status:** private source-only proposal; not an accepted inventory, implementation, device test, or task closure.
**Source base:** `d17aaa68a15b40c4e13eb7e9d7b93b4b08860365`.
**Task reference supplied by coordinator:** `ArchetypeAI-l8d0` (reported open); this workcell did not query or claim it.
**Workcell:** `/tmp/innerverse-e18-workcell` at the source base above.
**Proposed manifest/state:** `/tmp/innerverse-e18-workcell-manifest.json` and `/tmp/innerverse-e18-workcell-state.json`. These are worker-authored operational records, not broker leases or acceptance evidence.

## Scope and evidence boundaries

This inventory reads only the two named source files and the declared plan. The declared `architecture/contracts/**` path is absent at this base. It does not inspect scene callers, route components, bundler/runtime configuration, other platform paths, task comments, predecessor outputs, original Beads, or deployed environments. No application changes, test/build, browser run, physical handset or OS run, network exercise, service access, participant/user contact, or performance/thermal measurement occurred.

The labels below distinguish **source observation** (what the allowed files say), **plan intent** (requirements in the plan), and **hypothesis** (questions that need further authorized inspection or measurement). An API in the source does not prove a caller uses it; absence from these two files does not prove absence elsewhere.

## Declared source inventory

| Declared path | State at base | SHA-256 |
|---|---|---|
| `src/parts-cartographer/services/universe-scene.ts` | Present (292 lines) | `b0b8990ac24f1aa002ee4b9d6b108772d3923d88dc37de08b8275b70d743872d` |
| `src/parts-cartographer/pal/FeltCharacter.tsx` | Present (23 lines) | `49c268d2d9ceadf7c7e68bafb592682213a141c6770ce07d964d7e5f28977198` |
| `docs/80-20-plan.md` | Present | `7857691284f337ab2f5119292097a2eae603b296860eeb8584e9d8060fcbf370` |
| `architecture/contracts/**` | Absent: no directory/files at this base | N/A |

## Direct source observations

### `universe-scene.ts`

- `initUniverse(host, isDark, initialMotionMode)` returns the module-level `api` after calling its `resize()` when one already exists (`:41`, `:64–65`). On first initialization, it creates a Three.js `WebGLRenderer` with antialiasing and alpha, caps renderer pixel ratio at `min(devicePixelRatio || 1, 2)`, sizes it from the supplied host, and appends its canvas (`:67–72`). It enables renderer XR and creates `OrbitControls` (`:74–83`). These are code facts, not evidence of support or performance on a particular handset/OS/browser.
- It creates a star point geometry containing 900 positions (`:88–105`). Parts are built into groups. Rebuilds compare a JSON signature, clear old groups and increment a build version; `feltGroup(part)` loads asynchronously, and a late result is disposed if the scene was disposed, superseded, or its group detached (`:111–165`). The source does not specify cache lifetime or provide measured load time/memory.
- The canvas handles `pointerdown`/`pointerup` for tap picking, using a raycaster against loaded meshes (`:176–198`). The window `resize` handler updates camera aspect and renderer size when host dimensions are nonzero (`:200–208`). This file does not show a `ResizeObserver`, document visibility/page lifecycle listener, network-state handling, or WebGL context-loss/recovery handler.
- The render callback returns when `running` is false (`:210–211`). While running, it advances animation time only when `prefers-reduced-motion` does not match and the mode is not `still` (`:81–83`, `:212`). Regardless of that time increment, each callback updates controls, rotates stars from `t`, iterates over all nodes to set position and scale, traverses each node's descendants to update mesh material opacity and emissive intensity where the material exposes that property, then renders the scene (`:213–235`). This is a description of the callback; no frame-rate, CPU, GPU, memory, or long-task profile was collected.
- The returned API has `wake()` and `sleep()` methods that start or stop the renderer animation loop (`:237–240`), and `dispose()` stops the loop, ends any current XR session, disposes damping/controls and parts, removes the resize/pointer listeners, disposes stars and renderer, removes the canvas, and clears the module singleton (`:273–289`). Caller ownership, invocation ordering, route transitions, and actual background/resume behavior are outside the permitted read set.
- `setMotionMode()` changes the mode and damping (`:272`); the source does not show a complete static map/list experience or demonstrate that all map tasks remain available without WebGL.

### `FeltCharacter.tsx`

- The component asynchronously imports `feltThumbnail` and stores a resulting source if its effect remains active; an import/render failure leaves the fallback in place (`:8–16`).
- It renders the thumbnail in an image with empty alternative text, or a decorative `aria-hidden` silhouette while no current thumbnail is available (`:19–22`). This is character artwork within the component. The allowed source does not establish a complete accessible map list/detail path or equivalent selection, inspection, and return tasks.

## Plan-only intent

`docs/80-20-plan.md` specifies a complete accessible list/detail path for essential tasks without WebGL, with the same Felt identity and a static reduced-motion alternative (`§2B, :52–54`). Its map implementation sequence calls for a list/detail path supporting graphics failure, reduced motion, keyboard and screen readers; lifecycle handling to sleep hidden scenes, stop loops, manage cached assets, recover WebGL context, and limit texture/resolution costs; and validation of real phone rendering, repeated entry, long sessions and interrupted selection (`§9.3, :376–378`).

The plan also calls for complete-path interruption checks including connection loss and tab suspension, plus manual screen-reader, zoom/text-size, contrast, reduced-motion and no-WebGL acceptance (`§9.6, :451–460`). Proposed performance budgets are explicitly test targets rather than current measurements; the plan asks to define device/network conditions and track memory/re-entry (`§9.6, :462–464`). The performance rubric expects defined-device timing, memory, frame/long-task and repeated-entry measurements (`§16.3, :692–708`). These are requirements and aspirations, not proof that behavior exists or has passed.

## Scenario evidence status

| Scenario | Source evidence in allowed files | Unobserved / blocker |
|---|---|---|
| Actual handset, OS, browser and network | Code reads `window.devicePixelRatio`, reduced-motion media preference, and WebXR capability; async character work is visible. | No named handset/OS/browser/network, run log, network profile, compatibility result, loading result, or device trace. No physical-device run was authorized/available. WebXR references do not establish a handset support result. |
| Repeated map entry | Source has module singleton reuse (`:41`, `:64–65`) and explicit `dispose()` cleanup (`:273–289`). | No caller/route lifecycle, host replacement, actual repeated-entry sequence, retained-resource snapshot, or evidence that `sleep`/`dispose` is invoked. Behavior across entry, exit and re-entry is unobserved. |
| Background, suspend and resume | API exposes `sleep()`/`wake()` (`:237–240`). | No visibility/page lifecycle hookup is shown in the allowed source; no OS background/foreground test, browser tab suspension test, resume result, or resource trace. Whether integration exists elsewhere is unresolved. |
| Long tasks and frame behavior | Static code shows per-frame control update, node iteration/traversal and render (`:210–235`), plus a 900-point star field (`:88–105`). | No target-device long-task trace, frame-time distribution, missed-frame count, profiling method, or thresholds. Nothing here supports a numerical performance claim. |
| Memory and heat over a session | Source includes explicit geometry/material/renderer disposal paths (`:44–52`, `:273–289`) and async result cleanup (`:155–162`). | No heap/GPU memory sampling, warm/cold repeated-entry delta, leak check, thermal/temperature measure, long-session result, or OS-specific thermal method. |
| Complete static alternative | `FeltCharacter` provides a thumbnail or decorative placeholder; the plan requires a complete accessible list/detail alternative. | No evidence in the allowed source of a static map list/detail or task parity without WebGL, including keyboard/screen-reader selection, inspect and return. Other screens were not inspected. |

## Hypotheses to investigate (not findings)

1. **Per-frame cost may grow with map size.** Updating each node and traversing its descendants/materials on every animation callback could increase CPU work with node/mesh count. The 900 star positions and renderer pixel-ratio cap may also affect device cost. These are workload hypotheses only; profiling is required before calling them bottlenecks or changing them.
2. **Re-entry correctness depends on callers and host identity.** The singleton shortcut resizes the existing API rather than constructing a second scene; the API closures retain their original host and resources until disposal. A route that changes hosts or omits disposal could expose lifecycle issues, but no caller was read and no such failure is established.
3. **Background/resume and static-mode completeness may require integration beyond these files.** The source API provides explicit sleep/wake and the plan requires lifecycle and list/detail behavior, but this inventory cannot determine whether another component wires those behaviors or supplies the alternative.
4. **Network and thermal conditions can change observed readiness/performance.** No permitted source or runtime evidence provides those measurements; no network or thermal behavior is asserted here.

## Smallest useful next proposal

After the read set and ownership are explicitly authorized, inspect only the map entry/caller and the existing static list/detail surfaces needed to identify lifecycle wiring and task parity. Record their exact source revisions and hashes. Then define one reproducible target-device protocol that names handset, OS, browser, network, app/data fixture, map size, warm/cold entry sequence, background/resume interval, and repetition count. Capture startup/readiness, long-task and frame-time distributions, memory before/after repeated entry and after a sustained session, and a documented thermal measure where the device exposes a defensible method. Include failures/recovery and a task-equivalence walkthrough of the no-WebGL list/detail route with keyboard and assistive technology. Keep every measured result paired with device/environment and method; leave unavailable measurements explicitly unobserved.

This is a bounded follow-up proposal, not authorization to run it and not a claim that the plan's acceptance has passed. The original-Bead/predecessor reconciliation remains unresolved. No task status, dependency, acceptance, or tracker evidence has been changed by this artifact.

## Acceptance blockers

- Missing `architecture/contracts/**` leaves relevant runtime/device/lifecycle contracts unavailable in this read set.
- Scene callers, route entry/exit behavior, background integration and static list/detail implementation are not in the allowed read set; completeness and lifecycle wiring cannot be reconciled.
- No physical-device, OS/network, repeated-entry, suspend/resume, long-task/frame, memory, thermal, accessibility or static-alternative validation occurred; all such results remain unobserved.
- No task claim, validated lease, independent task acceptance, predecessor/original-Bead reconciliation, or acceptance decision is represented here.
