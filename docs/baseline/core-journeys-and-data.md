# Core journeys and data baseline

Audit snapshot: repository commit `cfd4d8e` (`Merge pull request #3 from shapefuture/plan/authored-world-beads`), branch `codex/stage0-journey-baseline`. Scope follows [80-20 plan §8.1](../80-20-plan.md#81-step-by-step-baseline). This is a source/documentation audit only: no app was launched, no endpoint queried, and no account or device was exercised.

## Evidence boundary

| Environment / evidence class | Observed in this audit | What it establishes |
|---|---|---|
| Repository/source | Yes; commit above | Declared state transitions, schemas, adapters, and build-time configuration in tracked source. Not deployed behavior. |
| Production | No | Neither deployed origin/version nor live Firebase, Worker AI, practitioner directory, booking permissions, or entitlement state was verified. A production environment file is source configuration, not proof of deployment. |
| Preview | No | No preview URL, build, or browser session was available/used. Existing `output/playwright/*` artifacts have no accompanying run metadata in this audit and are not treated as current evidence. |
| Emulator | No | No Firebase or browser emulator was started. |
| Mock / test fixtures | Source only | Unit/contract specs and deterministic adapter code describe intended behavior; they do not establish service integration or real-device behavior. No tests were run. |
| Device/account/fixture | Not captured | No device class, OS/browser, account role, user fixture, or data fixture can be attributed to an observed journey. Do not interpret the maps below as walkthrough results. |

Build entry points in `package.json` make `npm run build` the Vite build and expose a separate `build:angular` script ([package scripts](../../package.json#L6)). The `src/environments/environment*.ts` values below belong to the retained Angular build; they do not establish React/Vite runtime or deployment configuration. Angular `environment.ts` declares `production: false`, Gemini routing, `/api/ai`, and a Firebase project identifier; `environment.prod.ts` declares `production: true` and a Worker URL. These are compile-time declarations only. No deploy target/origin, selected build, live Worker configuration, or Firebase rules were verified. The development Firebase setup must not be mistaken for an emulator. Current working tree base was clean at `cfd4d8e`; this audit did not inspect environment files for secrets or read any `.env`/credential files.

## Primary React/Vite assessment routes and data authority

The repository’s primary app tree is the React/Vite router in `src/parts-cartographer/app.jsx`. Route declarations prove the screens are wired into the app source; they do not prove a deployed build or successful runtime completion. The 147-item full-assessment route is present. Runtime completion was not exercised in this audit.

| React route / screen | Evidence in source | Data contract / status |
|---|---|---|
| `full-assessment` | Lazy-loaded route and switch case ([app router](../../src/parts-cartographer/app.jsx#L15), [switch](../../src/parts-cartographer/app.jsx#L301)). Full screen builds the 147-item sequence and runs `toAssessmentInput` → `scoreProfile` → clinical adapter ([full assessment](../../src/parts-cartographer/screens/full-assessment.jsx#L5), [finish](../../src/parts-cartographer/screens/full-assessment.jsx#L133)). | Draft `INNERVERSE_DESCENT_V1` contains 147 answers, item index, and somatic responses; completed input is also written as `INNERVERSE_PROFILE_V1`. Draft restores to the next unanswered item, including break stages ([draft restore](../../src/parts-cartographer/screens/full-assessment.jsx#L11), [persist/resume](../../src/parts-cartographer/screens/full-assessment.jsx#L17), [completion](../../src/parts-cartographer/screens/full-assessment.jsx#L144)). Source route exists; successful runtime completion/reload was not tested. |
| `assessment` | Router labels this retained “eight-part quick map” ([app router](../../src/parts-cartographer/app.jsx#L301)); `Assessment` creates eight random parts ([screen](../../src/parts-cartographer/screens/assessment.jsx#L71), [pool](../../src/parts-cartographer/screens/assessment.jsx#L91)). | This is an eight-part exploratory interaction, not an eight-item response schema and not the primary 147-item assessment. Draft `ifs.assessment.draft` includes step/index/answers/statements/generated part pool ([draft](../../src/parts-cartographer/screens/assessment.jsx#L74), [draft save](../../src/parts-cartographer/screens/assessment.jsx#L99)). |
| `legacy-assessment` | Separate lazy route and switch case ([app router](../../src/parts-cartographer/app.jsx#L16), [switch](../../src/parts-cartographer/app.jsx#L303)); screen explicitly calls itself a separate legacy 64-item relational model that does not replace the 147-item map ([legacy screen](../../src/parts-cartographer/screens/legacy-assessment.jsx#L285)). | `ARCHETYPE_ASSESSMENT_RESPONSES` and `ARCHETYPE_ASSESSMENT_INDEX` plus versioned `ifs.legacy64.result` (`angular-assessment-64.v2`) ([legacy screen](../../src/parts-cartographer/screens/legacy-assessment.jsx#L13), [restore](../../src/parts-cartographer/screens/legacy-assessment.jsx#L18)). |
| `quickscan` overlay | Lazy-loaded overlay route ([app router](../../src/parts-cartographer/app.jsx#L326)); screen is a local-only 14-answer teaser that never persists or replaces a full assessment ([quick scan](../../src/parts-cartographer/screens/quick-scan.jsx#L10)). | Provisional family/subtype or Self outcome only. Not a canonical profile or history entry. |
| Report/history | `Results` selects clinical or quick report; report reads `store.history(KEYS.history)` ([results](../../src/parts-cartographer/screens/assessment.jsx#L15), [history read](../../src/parts-cartographer/screens/assessment.jsx#L468)). Historical profile selection is wired through cabinet screen ([cabinet](../../src/parts-cartographer/screens/cabinet.jsx#L132)). | React `store` uses localStorage keys; `setProfile` writes latest to `ifs.profile` and archives to `ifs.history` ([app state](../../src/parts-cartographer/app.jsx#L161)). `core/local-store.ts` keeps a bounded archive of 30 serialized values, suppresses duplicate last-value saves in `save`, and `archive` appends ([local store](../../src/parts-cartographer/core/local-store.ts#L5), [save/archive](../../src/parts-cartographer/core/local-store.ts#L22), [history/read/remove](../../src/parts-cartographer/core/local-store.ts#L43)). This is browser-local history, not proof of cross-device or account-scoped persistence. |

### React/Vite journey map (source-derived, not walked)

```text
intro / quickscan / weekly gate
  → full-assessment (primary 147-item route)
  → local draft recovery while in progress
  → score + adapt clinical profile
  → setProfile: latest `ifs.profile`, archive `ifs.history`
  → assessment-results / clinical report
  → innerverse map; coach overlay from map
  → therapist/booking overlay where a linked account and live service permit
```

The full route saves the current answer sequence during progression and on exit; finish adapts the score to the app profile, stores the completed 147-item input, clears the draft, and navigates to `assessment-results` ([full assessment](../../src/parts-cartographer/screens/full-assessment.jsx#L75), [finish](../../src/parts-cartographer/screens/full-assessment.jsx#L133)). App `setProfile` archives the profile with the latest snapshot ([app](../../src/parts-cartographer/app.jsx#L161)). The report offers return to the full assessment and quick scan, and reads history from `ifs.history` ([results](../../src/parts-cartographer/screens/assessment.jsx#L707), [history](../../src/parts-cartographer/screens/assessment.jsx#L468)). Map opens the coach overlay ([map](../../src/parts-cartographer/screens/innerverse.jsx#L145)); result and cabinet paths also expose coach/booking actions ([results](../../src/parts-cartographer/screens/assessment.jsx#L374), [cabinet](../../src/parts-cartographer/screens/cabinet.jsx#L214)).

React persistence uses localStorage and catches parse/quota failures by returning fallbacks or swallowing writes ([local store](../../src/parts-cartographer/core/local-store.ts#L8)). Boot code says local navigation remains available while Firebase connects ([app](../../src/parts-cartographer/app.jsx#L174)); this is source intent, not an observed offline session. The full assessment draft is browser-local and is not keyed by authenticated UID. Although React has a 30-entry local history contract, no cross-account isolation, cross-device sync, or historical profile restore was exercised.

## Retained Angular parity/reference journey maps (source-derived, not walked)

### 1. Assessment → report

```text
Landing/startAssessment
  → assessment panel (64 sequential questions; answers and index in localStorage)
  → assessment-gate / completion handler
  → legacy result route OR Innerverse descent/profile route
  → report/result view
```

In the retained Angular app, `AssessmentPanelComponent` is a 64-item route (agency, temperature, focus, and healthy-pattern sections of 12 each, plus 16 attachment items) and emits `number[]`; answers and current question index are persisted separately, and navigation is throttled by a 300 ms timer ([assessment panel](../../src/app/features/assessment-panel/assessment-panel.component.ts#L7), [question bank](../../src/app/core/data/assessment-questions.ts#L1)). Angular app state distinguishes `assessment`, `assessment-gate`, `assessment-results`, `descent`, and `innerverse` ([app component](../../src/app.component.ts#L116)); handlers include `startAssessment`, `onAssessmentCompleted`, and result processing ([app component](../../src/app.component.ts#L754), [app component](../../src/app.component.ts#L1094)). In parallel, `src/i18n/items.ts` defines a deterministic 147-item sequence and three 49-item descents. The scorer is pure and client-side; its input is 14 shadow parts × 8, 4 resources × 6, Self × 8, and 3 validity items ([item schedule](../../src/i18n/items.ts#L31), [scoring input](../../src/app/core/data/scoring-v2.ts#L26)).

Known Angular interruption behavior: the retained 64-item panel restores its saved answers/index after reload, clamping the index; unavailable/corrupt storage falls back to empty answers or first unanswered ([assessment panel](../../src/app/features/assessment-panel/assessment-panel.component.ts#L40)). For React, source defines the full 147-item route and durable local draft restore (see React section), but successful runtime completion/reload was not exercised. Assessment response persistence/storage differs by entry path; route wiring does not establish deployed runtime behavior.

### 2. Report → map → selected-part detail

```text
ScoredProfile
  → Innerverse report (resource-led narrative, tiers, attachment/complexes)
  → embedded constellation map
  → selected part detail / layer cycling
```

The report receives a required `ScoredProfile` model and embeds the constellation component ([report](../../src/app/features/innerverse-report/innerverse-report.component.ts#L59), [report component inputs/actions](../../src/app/features/innerverse-report/innerverse-report.component.ts#L103)). Its `sortedParts` ordering uses tier, then T-score, then taxonomy order ([report](../../src/app/features/innerverse-report/innerverse-report.component.ts#L190)); it cycles selected-part copy layers ([report](../../src/app/features/innerverse-report/innerverse-report.component.ts#L229)). The map layout derives placement and visual groupings from profile scores ([constellation layout](../../src/app/core/data/constellation-layout.ts#L1)); exact interaction-to-parent route and report-to-map handoff are source-visible but were not browser-walked. No evidence here establishes which of the older dimensional maps or newer 18-entity map is authoritative in any deployed build.

### 3. Map → contextual coach

```text
Map / selected archetype or part
  → open coach sheet; choose general or parts dialogue
  → enter user message
  → AI port request
  → primary Gemini / fallback local heuristic (where routed)
  → response or surfaced error
```

Coach panel declares general/parts modes and conversation messages ([coach panel](../../src/app/features/coach-panel/coach-panel.component.ts#L19), [coach panel mode](../../src/app/features/coach-panel/coach-panel.component.ts#L91)). App owns message/session/mode state ([app component](../../src/app.component.ts#L203)); provider wiring selects Gemini with local-heuristic fallback unless configured heuristic-only ([AI providers](../../src/app/core/adapters/ai.providers.ts#L7), [resilient adapter](../../src/app/core/adapters/resilient-ai.adapter.ts#L32)). Cancellation is propagated; other primary failures attempt fallback, with a degradation signal. Raw `callAI` deliberately has no heuristic fallback ([resilient adapter](../../src/app/core/adapters/resilient-ai.adapter.ts#L50)). This source path cannot show current Worker/model availability, privacy/network behavior, or whether a particular request used primary or fallback in a live session. Coach README itself lists message-history persistence as incomplete ([coach README](../../src/app/features/coach-panel/README.md#L269)).

### 4. Result/map → appointment request → management

```text
Cabinet booking action
  → resolve therapist by email / UID
  → read declared availability and busy slots
  → choose date, free slot, confirm explicit profile-share consent
  → create pending appointment + busy-slot lock + client share
  → cabinet lists appointments; user/therapist may update status
```

Booking panel resolves a practitioner and reads availability and busy intervals; lookup failures display a not-found style error ([booking panel](../../src/app/features/booking-panel/booking-panel.component.ts#L110)). Confirmation requires a signed-in non-anonymous account, selected therapist/slot, and consent; success emits booked, exceptions surface in the panel ([booking panel](../../src/app/features/booking-panel/booking-panel.component.ts#L178)). The data module documents Firestore collections and atomic busy-slot intent ([booking data](../../src/parts-cartographer/core/booking.ts#L1)); appointment creation uses a batch and sets `accessGranted: true` alongside share/slot projections ([booking data](../../src/parts-cartographer/core/booking.ts#L359)). Cabinet loads and cancels appointment records ([cabinet](../../src/app/features/cabinet/cabinet.component.ts#L133)). These declarations do not prove a real practitioner is registered, schedule data is populated, transaction/rules permissions succeed, or the therapist actually sees the share. No appointment was requested.

## Shared scoring identities and stack-specific records/history

| Contract | Shape / authority in source | Canonical identity and known gap |
|---|---|---|
| Retained Angular 64-item assessment | `ASSESSMENT_QUESTIONS` order, response array; answers persist as `ARCHETYPE_ASSESSMENT_RESPONSES`, index as `ARCHETYPE_ASSESSMENT_INDEX` ([bank](../../src/app/core/data/assessment-questions.ts#L1), [panel](../../src/app/features/assessment-panel/assessment-panel.component.ts#L7)) | No explicit schema/version field on raw response array. `LocalStorageAdapter` wraps backup with `app: ArchetypeAI`, `version: 1`, timestamp, dimensional expressions, answers, results. That legacy wrapper is not shown to be a migration-compatible v2 profile. |
| Shared 147-item scoring contract; React full route | Fixed `buildItemSequence()`; 147 values; three 49-item descents; maps into shadow/resource/Self/validity input ([schedule](../../src/i18n/items.ts#L31), [adapter](../../src/app/core/data/assessment-adapter.ts#L17)) | Canonical coordinate identities are stable string IDs in `parts.ts`: 14 shadows (7 managers, 3 firefighters, 4 exiles), four resources, plus eight Self qualities ([taxonomy](../../src/app/core/data/parts.ts#L9), [Self](../../src/app/core/data/parts.ts#L158)). The assessment adapter rejects wrong answer count and values outside 1–5 ([adapter](../../src/app/core/data/assessment-adapter.ts#L26)). No persisted schema/scoring-version tag for `AssessmentInput` was identified. |
| Cross-route 64 vs 147 | Separate question bank/scoring implementation and v2 item schedule/scorer coexist | They are not interchangeable arrays. `scoring.ts` contains legacy scoring; `scoring-v2.ts` consumes the 147-item projection. The React source explicitly wires the 147-item full route and a separate legacy 64-item route; which build is deployed and what migration/crosswalk policy applies remain unverified. |
| React quick scan (Angular has a parallel panel) | React overlay collects 14 answers, one per shadow family, and returns provisional family/subtype or `self` ([React quick scan](../../src/parts-cartographer/screens/quick-scan.jsx#L10), [Angular panel](../../src/app/features/quickscan-panel/quickscan-panel.component.ts#L33), [shared quickScan](../../src/app/core/data/scoring-v2.ts#L245)) | Local-only teaser; no durable save/version authority. It is not a complete 147-item profile or canonical history entry. |
| Retained Angular legacy archetype output (up to eight) | `generateArchetypes` in `scoring.ts` merges/caps results at eight archetypes; AI prompt also asks for 4–8. Older UI consumes `Archetype`/dimensional expressions, while v2 has 18 part/resource coordinates ([legacy cap](../../src/app/core/data/scoring.ts#L598), [taxonomy](../../src/app/core/data/parts.ts#L9)). | Eight is a maximum output count, not an eight-item assessment schema. No canonical crosswalk from these generated archetypes to the v2 14+4 identities was established. This output is not evidence of a completed 64- or 147-item assessment. |
| Retained Angular current snapshot | StoragePort `AssessmentData`: responses, dimensional expressions, nullable legacy result payload, scoring method (`deterministic`/`fallback`), timestamp ([port](../../src/app/core/ports/storage.port.ts#L5)). Firebase path `users/{uid}/assessment/current` ([Firebase adapter](../../src/app/core/adapters/firebase-storage.adapter.ts#L26)). | Firebase uses auth UID for user-owned current record. Local adapter ignores the supplied `userId` and uses one browser-global key, so distinct local accounts share/overwrite the same assessment slot ([local adapter](../../src/app/core/adapters/local-storage.adapter.ts#L15)). |
| Retained Angular service/local history | Firebase appends to `users/{uid}/history`, reads newest 20, and merges current only when history is empty ([Firebase adapter](../../src/app/core/adapters/firebase-storage.adapter.ts#L43)). | In this Angular adapter, history collection is authoritative once non-empty; current is compatibility fallback only. History entries are typed as `AssessmentData` and shown selected by `updatedAt` in cabinet ([cabinet](../../src/app/features/cabinet/cabinet.component.ts#L65)). This describes only the retained Angular `LocalStorageAdapter`: it explicitly has no history and returns `[current]` ([local adapter](../../src/app/core/adapters/local-storage.adapter.ts#L54)). Do not generalize this to React/Vite, whose separate `core/local-store.ts` keeps a browser-local archive capped at 30 entries (see React section above). |

## Return, offline, and interruption behavior

- Retained Angular 64-item assessment writes response array and index synchronously to browser `localStorage`; a read/parse/storage failure starts empty, and reload resumes at stored index if valid ([panel](../../src/app/features/assessment-panel/assessment-panel.component.ts#L44)). Completion handler and profile restore logic live in `app.component.ts`; profile storage uses `INNERVERSE_PROFILE_V1` ([app component keys](../../src/app.component.ts#L55), [restore/scoring handlers](../../src/app.component.ts#L774)).
- Angular `local-store.ts` implements coalesced write-behind storage with idle flush and `visibilitychange`/`pagehide` durability hooks; it swallows storage-full/unavailable errors ([local store](../../src/app/core/data/local-store.ts#L8)). It is not the Angular 64-answer panel's persistence implementation, which directly calls localStorage.
- AI adapters support local heuristic fallback for structured assessment/coach methods; raw transport has no fallback ([providers](../../src/app/core/adapters/ai.providers.ts#L13), [resilient adapter](../../src/app/core/adapters/resilient-ai.adapter.ts#L50)). No offline network exercise was done, so offline end-to-end completion and user-facing recovery remain unverified.
- In Angular, Firebase assessment/history operations wrap reads/writes with resilience; its local storage catches exceptions and supports one current snapshot only. React’s separate browser-local archive is capped at 30; neither cross-device restoration path was tested.
- In retained Angular, coach messages are app signals; its README lists persistence as a TODO. For React, no conversation persistence/reload path was verified in this audit.
- Booking errors are surfaced in-panel; no real directory/availability or conflict race was exercised. Cabinet appointment loading catches errors and renders an empty list, which can mask service failure as no appointments ([cabinet](../../src/app/features/cabinet/cabinet.component.ts#L140)).
- Return loop features (check-ins, practice, historical profile restore) exist in source but their full first-use/return/interruption journeys and persisted data semantics were not exercised. No second-account or restored historical profile observation was made.

## Unverified checks and gaps

1. No production or preview origin/build SHA was observed. No deployment/build pipeline was run, so current public version is unknown.
2. No real or emulated Firebase Auth, Firestore rules, account roles/allowlists, practitioner lookup, availability, appointment lifecycle, profile sharing, Worker AI, Stripe entitlement, or push delivery was verified. Source declarations and test doubles do not prove these integrations.
3. No real device, OS/browser, mid-range performance, WebGL renderer, accessibility, screen reader, keyboard, zoom, text scaling, contrast, reduced motion, network interruption, or offline recovery evidence was gathered.
4. No safe synthetic account/data fixture was exercised. No personal-response data was read or included.
5. The React source identifies `full-assessment` as the 147-item route; it also retains a separate 64-item route, an eight-random-part exploratory interaction, and a 14-answer quick scan. These outputs are distinct contracts. Canonical v2 part IDs exist, but migration/crosswalk policy for legacy data and account/device history authority remain unresolved.
6. No tests were run, by task instruction. Existing specs are cited only as repository artifacts, not fresh verification.
