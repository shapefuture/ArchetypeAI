# Device performance and accessibility baseline

**Status:** source audit complete; device acceptance is blocked. No app walkthrough, browser run, assistive-technology check, or performance measurement was performed for this record.

## Evidence and conditions available

| Evidence class | Observed evidence | Boundary |
|---|---|---|
| Source audit | Checkout at commit `bfbffc417ac42a61ab865978ac5abb4922ce0f48`; React/Vite paths inspected. Current workspace branch is `codex/stage0-device-baseline`. | Describes implementation only. It does not establish behavior in a rendered app. |
| Browser / software WebGL | Workspace host is Linux x86_64 (`Linux 6.18.44`); Chromium `151.0.7922.173` is installed. | No app was opened and no browser or software WebGL measurement was taken. This is not phone evidence. |
| Emulator | Neither `adb` nor an `emulator` executable is available in this environment. | No emulator run or emulator result. |
| Physical device | No phone or tablet is attached or available to this session. | No real-device run or real-device result. |

The source checkout has Vite React scripts (`npm run dev`, `npm run build`) and a separately served Angular app. The intended app origin/build was not provided. No deployed origin, device/browser combination, user role, or fixture was available. No personal profile or live account was accessed.

## Source-level baseline

### Performance and recovery

The React map module is dynamically imported on first map entry and prefetched when the Sky tab is hovered ([app.jsx](/workspace/agent-worktrees/stage0-device-baseline/src/parts-cartographer/app.jsx:246)). Initialization sets up an antialiased transparent Three.js WebGL renderer and caps its pixel ratio at 2 ([universe-scene.ts](/workspace/agent-worktrees/stage0-device-baseline/src/parts-cartographer/services/universe-scene.ts:64)). Felt meshes are assembled asynchronously after parts are added; the animation loop updates scene nodes and renders continuously while the map is awake. Leaving the map sleeps the loop and re-entry wakes the existing renderer ([universe-scene.ts](/workspace/agent-worktrees/stage0-device-baseline/src/parts-cartographer/services/universe-scene.ts:206), [app.jsx](/workspace/agent-worktrees/stage0-device-baseline/src/parts-cartographer/app.jsx:253)).

These choices suggest first-entry module/renderer/mesh cost, GPU fill cost at high device pixel ratios, and mesh build time are important phone measurements. Reuse on re-entry may reduce startup cost, but no timing, frame pacing, interaction latency, memory, thermal, context-loss, or background/foreground recovery result is known. No performance marks, `PerformanceObserver`, or map-specific measurement output were found in the inspected React map path.

### Keyboard, touch, and screen-reader access

The canvas uses OrbitControls and pointer raycasting for direct map rotation, zoom, and selection ([universe-scene.ts](/workspace/agent-worktrees/stage0-device-baseline/src/parts-cartographer/services/universe-scene.ts:75), [universe-scene.ts](/workspace/agent-worktrees/stage0-device-baseline/src/parts-cartographer/services/universe-scene.ts:180)). It has no apparent accessible name, semantic role, or keyboard selection behavior. Parts are also exposed through searchable results and a row of native buttons, which offer an alternate selection route; those buttons need to be checked with keyboard and screen reader on-device ([innerverse.jsx](/workspace/agent-worktrees/stage0-device-baseline/src/parts-cartographer/screens/innerverse.jsx:130)).

The shared React modal layer declares a modal dialog, initially moves focus inside, traps Tab navigation, closes on Escape, and restores prior focus when removed ([modal-layer.jsx](/workspace/agent-worktrees/stage0-device-baseline/src/parts-cartographer/ui/modal-layer.jsx:4)). This is a promising implementation contract, not a verified result; nested/late-loaded content and the four core journeys still need a screen-reader pass. Loading, renderer failure, empty map, denied access, interruption, and recovery states need their announcements and focus destinations checked as encountered.

### Zoom, text size, contrast, and motion

The page viewport permits normal browser scaling (`width=device-width, initial-scale=1` with no user-scalable restriction) ([index.html](/workspace/agent-worktrees/stage0-device-baseline/src/index.html:6)). The app also contains many fixed pixel text sizes and a phone-shaped app shell, so browser zoom and operating-system text scaling/reflow need direct validation. No 200% text-size result is available.

A global `:focus-visible` outline and a `prefers-reduced-motion` stylesheet rule exist ([styles.css](/workspace/agent-worktrees/stage0-device-baseline/src/parts-cartographer/styles.css:841)). The map checks the reduced-motion preference and stops advancing its animation phase, but the awake render loop continues and OrbitControls damping remains enabled ([universe-scene.ts](/workspace/agent-worktrees/stage0-device-baseline/src/parts-cartographer/services/universe-scene.ts:75), [universe-scene.ts](/workspace/agent-worktrees/stage0-device-baseline/src/parts-cartographer/services/universe-scene.ts:206)). Actual motion under the OS setting is unverified. No contrast measurements were taken in either theme; translucency and affinity-based opacity make selected, dimmed, and overlapping parts worth checking against WCAG contrast targets.

## Blockers to real-device acceptance

The physical measurement is blocked by the absence of a representative mid-range phone, an available app origin/build, and a safe test account with a repeatable fixture. Before the run, record the chosen device model and hardware tier, OS and browser versions, display size and scale, app commit/build and production or preview origin, account role, fixture identity (synthetic or approved test data), network profile, power/thermal state, and whether the app is installed as a PWA or opened in the browser. An emulator or desktop Chromium run may be useful as a separate diagnostic, but neither closes the real-device criterion.

## Minimum reproducible device run

Use one named, representative mid-range phone and its current supported browser. Use a non-personal test account and a stable fixture with a completed assessment and populated map. Record the exact conditions above and the browser/app build before each run. Repeat each timing three times from a cold app start and five times after a warm start; report each sample and median rather than a single best time.

1. **Startup:** force-close the app, launch it, and time launch to the first usable screen. Note errors, blank frames, and whether the map code loads before it is requested.
2. **Map entry:** from the completed-profile fixture, open the map. Time tap-to-visible canvas and tap-to-usable part controls; separately note when felt characters finish appearing. Capture frame-time/FPS and long tasks during entry and a 30-second idle period. Record memory before entry, peak/after entry, and after exit using remote browser performance tooling where supported.
3. **Selection and re-entry:** select one part by tapping its 3D shape and again through search/list controls. Time each route to the detail sheet. Leave and re-enter the map five times; record warm re-entry time, visual correctness, memory trend, and any renderer reset. Background the app for 30 seconds, restore it, and repeat one selection. Record any WebGL loss/recovery behavior.
4. **Accessibility paths:** with an external keyboard, complete assessment-to-report, report-to-map/detail, map-to-coach, and result/map-to-appointment-request paths. Verify visible focus, logical order, Escape/close behavior, and a non-canvas route to select a map part. With VoiceOver or TalkBack, traverse the same entry points and record labels, headings, progress/status/error announcements, and dialog focus. Repeat with browser zoom and OS text/display size increased to 200%, in light and dark themes, and with reduced motion enabled. Record clipping, overlap, lost controls, contrast failures, unexpected animation, or inability to complete the task.

Keep screenshots, recordings, and profiles on the approved test fixture; do not capture personal responses. Record failures with the exact step, environment, and artifact reference. No step above has been run for this baseline.

## Acceptance disposition

The Bead acceptance criterion requires named device conditions and blockers to be recorded and forbids substituting software WebGL for physical-device acceptance. The blocker and a minimum repeatable protocol are now documented, with evidence classes kept separate. Because there is no physical-device observation, this document does **not** establish or claim real-device acceptance; the device measurement remains outstanding and the Bead should remain open until that evidence is attached.
