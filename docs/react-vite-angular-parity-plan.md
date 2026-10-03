# React/Vite parity completion plan

**Snapshot date:** 2026-10-03

**Status:** Angular remains the behavior/data-contract reference. This plan covers the remaining parity work; it does not declare the migration complete.

## Goal and guardrails

Make the existing React/Vite app the complete user-facing implementation of the Angular app while retaining React's visual language. Every Angular capability must map to a real React entry point, preserve its data contract and lifecycle, and have tests for important success, failure, cancellation, persistence, and authorization paths.

- Keep Angular buildable until the parity exit criteria pass; do not remove or replace it during the migration.
- Keep user data local by default. Network sharing, AI analysis of answers, and cloud writes must be explicit and explained.
- Keep Firebase/Worker secrets and authorization server-side. Preserve least-privilege Firestore rules and do not turn denied reads into empty data.
- Do not introduce fake users, random availability, or UI controls that only look functional.
- Preserve React's existing style and unrelated working-tree changes.

## Current checkpoint

The 64-item React report now keeps deterministic scoring local and offers an explicit, authenticated, cancellable AI pantheon mode; retake and language changes reset stale AI data. The 64-item handoff creates coordinate-aware universe Parts while retaining unrelated Parts. React synastry now selects the actual Angular engine based on shared data: the 64-response `computeSynastry` path, or the scored-profile v2 engine for two complete 147-item aggregate profiles. Both expose localized detailed reports and JSON export; eligible reports offer an optional, cancellable Worker-backed reflection over computed summaries only. Code-only previews are visibly labeled instead of presented as computed synastry. The separate 147-item `DescentPanel` remains distinct from the 64-item ResultsPanel path.

Latest verification: **64 Vitest files passed, 1 emulator file skipped; 767 tests passed and 18 Firestore emulator tests skipped.** Focused 64-item/synastry files passed without React `act` warnings. `npm run lint`, `npm run build`, and the Angular reference `npm run build:angular` passed. Vite reports three mixed static/dynamic import warnings (parts data, Firebase, user-directory); the React main chunk is about 1.18 MB minified, with the two synastry engines split into lazy chunks. Firestore rules/browser lifecycle checks remain outstanding. `npm ci` reports 24 dependency vulnerabilities (6 moderate, 18 high); do not run `npm audit fix --force` as part of parity work.

## Ordered implementation phases

### 0. Stabilize and close the current 64-item AI mode

**Scope:** `screens/legacy-assessment.jsx`, `screens/legacy-report.jsx`, `core/legacy-ai-analysis.ts`, `core/ai.adapter.ts`, `screens/legacy-report-data.ts`.

1. **Done:** the focused UI tests run without the earlier React `act(async)` warning.
2. **Done:** Worker contract tests cover Firebase Bearer auth, request/schema shape, malformed output, HTTP failure, and abort propagation without a fallback success.
3. **Partial:** parent cancellation and retake abort/reset are tested; language-mismatched cache is rejected. Add an in-mounted language-change test and UI-level failed-request/retry persistence test.
4. **Partial:** AI pantheon/narrative rendering, local numeric-score preservation, and backup/Markdown data builders have coverage. Add an explicit end-to-end UI check for exported AI fields and raw-answer network boundaries.
5. **In progress:** question ordering and result shape use Angular's 64-item data contract; complete comparison of all backup-version fields and specialist-view restrictions remains.

**Exit criteria (not yet met):** warning-free focused tests, authenticated/cancellable AI transport, local and AI report/export paths are covered; remaining language-change-in-place, failed-request/retry UI persistence and specialist-view restrictions must be verified.

### 1. Finish the 64-item AssessmentPanel → ResultsPanel parity contract

**Angular reference:** `src/app/features/assessment-panel/assessment-panel.component.ts`, `src/app/features/results-panel/results-panel.component.ts`, `src/app/core/adapters/gemini-ai.adapter.ts`, and `src/app.component.ts`.

**React target:** `screens/legacy-assessment.jsx`, `screens/legacy-report.jsx`, `core/ai.adapter.ts`, and `core/legacy-ai-analysis.ts`.

1. Keep the two route contracts distinct: the Angular 64-item ResultsPanel owns deterministic/AI-first scoring mode; the separate Angular 147-item Descent uses `scoring-v2` and enters Innerverse. React's legacy 64 route is the parity target for the former.
2. Compare request/response fields, 64-item question ordering, localized section/question text, existing universe archetypes, output requirements, and fallback semantics. Angular preserves deterministic archetype placement/scores when rendering in the universe; React should match that behavior.
3. Add adapter/Worker contract tests for authenticated request shape, response-schema forwarding, malformed JSON, offline/provider failures, and abort behavior. Keep cancellation from being converted into a successful fallback result.
4. Verify a failed request leaves the deterministic result intact, allows retry, and does not persist the AI method; verify retake and language changes abort in-flight work and reset the mode.
5. Verify generated pantheon/narrative in report and explicit backup/Markdown export, while numeric/safety indicators remain locally computed. Keep raw answers out of network traffic except on explicit AI selection.
6. Port the ResultsPanel's missing React-facing actions and specialist-view restrictions where applicable; test report-to-universe handoff and persistence.

**Exit criteria:** focused tests are clean (no `act` warning), the React build passes, AI requests are authenticated/cancellable, the deterministic/AI report and export paths work, and route/lifecycle behavior is covered.

### 2. Complete 147-item Descent → Innerverse report and route parity

**Angular reference:** `src/app/features/descent-panel/`, `src/app/features/innerverse-report/`, `src/app.component.ts` (`onDescentCompleted`, `restoreInnerverseProfile`), and `src/app/core/data/scoring-v2.ts`.

**React target:** `screens/full-assessment.jsx`, `screens/assessment.jsx` (`Results`), `core/clinical-profile-adapter.ts`, and app route/state handling.

1. Compare the completion result, local persistence keys, report sections, crisis/validity notices, retake/back behavior, and language-change reconstruction across both 147-item flows.
2. Keep `scoreProfile()` as the canonical deterministic scorer; do not add an AI scoring toggle that is absent from Angular's 147-item Descent.
3. Port missing Innerverse-report sections/actions, including future-self reflection semantics, report history/download paths, and direct transitions to the coordinate universe.
4. Make reload/restore and changing language rebuild translated display data without discarding answers or leaving stale result state.
5. Add fixture parity tests for canonical answers and lifecycle tests for incomplete/resumed/complete assessment states.

**Exit criteria:** 147-item report content and navigation match Angular's Descent/Innerverse behavior; local score fixture outputs agree; persistence, restore, retake, and language change are tested.

### 3. Complete the 4D universe and archetype interaction model

**Angular reference:** `features/innerverse-report`, `constellation`, `universe-controls`, `archetype-detail-card`, `universe-state.service.ts`, and `services/webxr.service.ts`.

**React target:** `screens/innerverse.jsx`, `core/universe-controls.ts`, `services/universe-lens.ts`, and `services/universe-scene.ts`.

1. Define a versioned shared archetype DTO with the four Angular dimensional coordinates, cluster/family, prominence/size, narrative fields, source assessment, and stable ID. Migrate React locally generated, imported, 64-item, 147-item, and AI-created archetypes into it without losing old records.
2. Replace or augment the family-weighted 2D projection with Angular-compatible per-archetype coordinates and dimension-to-axis mapping. Retain the current projection only as a documented fallback for old parts without coordinates.
3. Port coordinate-affinity sorting/highlighting, selected-archetype state, isolation/focus/report layers, cluster and family filters, search, and relevant visual-control semantics. Ensure slider controls affect the plotted data, not only decorative labels.
4. Connect both 64- and 147-item results, including an AI-selected pantheon, to universe state through one tested adapter. Preserve stable identity across reload and cloud restore.
5. Port or document WebXR behavior based on actual browser support; keep unsupported states clear and non-blocking.

**Exit criteria:** identical fixture data produces equivalent coordinate placement, ordering, affinity, and selected/highlighted states; old records still render; keyboard/touch controls and reduced-motion behavior are verified.

### 4. Port full synastry computation and report compatibility

**Status (2026-10-03): substantial implementation in React, verification/lifecycle parity still open.**

**Angular reference:** `features/synastry-panel`, `features/synastry-compare`, `computeSynastry`, and Firebase share-code paths.

**React target:** `core/cloud-storage.ts`, `core/therapist-link.ts`, `screens/innerverse.jsx`, and `overlays.jsx`.

1. **Implemented:** React chooses by available, validated data: Angular's 64-response `computeSynastry` runs only with two complete 64-item vectors; the scored-profile v2 engine runs only when both snapshots contain bounded 147-item aggregate scores; otherwise the existing code-only preview remains, clearly labeled as uncomputed.
2. **Implemented:** the 64-item route maps the full Angular report into the React display/export; the v2 bridge uses Angular's `toSynastryProfile()` and `synastry()` and preserves six computed measures, loop, interlocks, and nourishment details. Inputs are aggregate scores or locally/previously consented 64-response vectors; raw answers are not forwarded to the AI reflection.
3. **Implemented in part:** bilingual detailed report sections and JSON export are present for both engines. A separate optional AI reflection uses authenticated Worker transport, a bounded computed-summary payload, cancellation, and explicit failure UI. React's map-code UI style remains; Angular's scroll-section navigation, complete clinical Markdown/export schema, and end-to-end AI-result persistence comparison remain.
4. React continues to support explicit map-code consent, redemption, owner revocation, and saved comparisons. Legacy Angular response codes are accepted; React aggregate-profile codes are accepted. **Still open:** expiry/one-time semantics, Firestore emulator proof of owner/reader rules, revoked/unauthorized/collision cases, and authenticated overlay end-to-end tests.
5. Added fixtures for 64 and 147 engine equivalence, invalid/missing snapshots, bilingual reports, export actions, Worker auth/schema, and cancellation. **Still needed:** cross-version Firestore rule fixtures and browser exercise of generation → redeem → revoke → restore.

**Exit criteria (not yet met):** engine fixtures now compare directly against both Angular functions and pass; remaining gates are Firestore emulator authorization/lifecycle tests, full UI/browser verification, and the still-different code-only fallback/report navigation semantics.

### 5. Finish backup, cloud-history, and account lifecycle interoperability

**Angular reference:** `local-store.ts`, assessment/result backup/export/import, Firebase storage adapter, Cabinet history.

**React target:** `core/local-store.ts`, `core/cloud-storage.ts`, `screens/cabinet.jsx`, auth and app bootstrap.

1. Inventory every Angular backup/version (`ARCHETYPE_COMPLETED_BACKUP`, canonical descent/profile keys, legacy `assessment_answers`, local history, shared map/result snapshots). Create schema-versioned import/export adapters rather than copying arbitrary localStorage keys.
2. Add preview, validation, size limits, safe merge/replace semantics, and a rollback path for malformed or partial imports. Preserve future-self answers and assessment answers only in explicit local backup; do not add them to a cloud snapshot by default.
3. Convert compatible Angular history/profile/map records into React entries and retain original source/version metadata.
4. Verify explicit cloud save/load/restore and history for map/profile only; test ownership, overwrite, conflict, offline, account deletion/sign-out, and re-entry behavior.
5. Compare anonymous-to-linked account behavior, sign-out cleanup, language/theme persistence, and storage migration. Never silently upload local assessment data during auth bootstrap.

**Exit criteria:** representative Angular backups import and round-trip without data loss; cloud snapshots remain minimal and owner-checked; sign-out/re-entry and partial-storage failures have tests.

### 6. Close Firestore, therapist, admin, and booking verification gates

**Angular reference:** booking panel, therapist panel, Cabinet, admin/client services, Firebase adapters and rules.

**React target:** `core/booking.ts`, `core/therapist-link.ts`, `core/admin.ts`, booking/therapist overlays, Firestore rules and emulator specs.

1. Run every currently skipped Firestore emulator test. Add explicit owner, linked-client, therapist, verified-admin, revoked-link, wrong-user, and unauthenticated cases for each document family.
2. Verify booking busy-slot reservation atomically under concurrent requests, uniqueness, timezone/DST boundaries, cancellation/approval transitions, stale-slot cleanup, and projection consistency. Preserve the rule that denied appointment reads are errors, not “no appointments.”
3. Test therapist availability, client lookup/link claims, appointment approve/decline/archive, assignment and client completion, ladder-rung authorization, and revoked relationship behavior across both UIs.
4. Port the remaining Angular admin read-only matrix/AI report and history actions or document an approved privacy difference; confirm notes are private/admin-owned and never visible to the client.
5. Keep all reads/writes within narrow existing rules; perform rule review and emulator verification before any production deployment.

**Exit criteria:** emulator suite passes without skips; concurrent booking tests prove no double booking; all role boundaries have positive and negative cases; no Firebase production change is made without explicit deployment approval.

### 7. Complete AI, push, billing, install, and telemetry service parity

**Angular reference:** AI port/adapters, coach, parts dialogue, exercise suggestions, synastry narrative, billing/install/push/telemetry services.

**React target:** `core/ai.adapter.ts`, `core/api.ts`, `core/push.ts`, `core/billing.service.ts`, telemetry, service workers and overlays.

1. Build a method-by-method AI matrix: chat modes, parts dialogue, exercise suggestions, archetype studio, both assessment methods, report narrative, and synastry narrative. Compare prompts, schemas, limits, timeout/abort, degradation, and localized outputs.
2. Route all network calls through the existing authenticated Worker; test rate limits, request allowlists, response parsing, safe errors, provider fallback, abort handling, and no browser secrets. Do not log raw assessment answers or prompts.
3. Verify FCM permission states, `/fcm/` worker scope, token registration/update/revocation, foreground/background delivery, sign-out cleanup, local reminder cap, unsupported-browser state, and consent withdrawal.
4. Compare checkout, verified entitlement/restore, return/deep links, error handling, offline behavior, PWA install/update lifecycle, offline navigation, and telemetry consent/privacy.
5. Keep production secrets/deployment settings out of tests and do not deploy as part of verification.

**Exit criteria:** method matrix is complete; service unit/integration tests cover success and failure/lifecycle paths; browser verification confirms worker and install behavior.

### 8. Localization, accessibility, and interaction polish

1. Audit every React screen, report, overlay, toast, validation error, empty/loading/error state, and download for English/Russian completeness and parity. Replace visible hard-coded English/Russian strings with catalog entries.
2. Check keyboard operation, focus restoration/trapping, escape/back behavior, accessible names/roles/status announcements, screen-reader reading order, touch targets, reduced motion, and mobile overflow.
3. Verify language changes re-localize reports without retaining stale AI output or leaving requests active; test theme/language persistence and all error states.
4. Keep React visual style; parity means behavior/contracts, not copying Angular's component appearance.

**Exit criteria:** no untranslated visible strings in the two supported languages; audited controls work by keyboard and touch; automated accessibility smoke plus manual browser checklist is recorded.

### 9. Release/parity exit gate

- Maintain a traceability matrix mapping every Angular route/service/control to a React route/service/test or a documented intentional difference.
- Run `npm test`, `npm run lint`, `npm run build`, the Angular reference build, and Firestore emulator tests from a clean dependency install.
- Run browser smoke flows for canonical and 64-item assessment, mode toggle/cancel/export, restore, universe interactions, synastry consent/revoke, booking races, therapist/admin roles, push permission and install.
- Record exact command results, browser/emulator versions, and any unverified external integration. Fix build/test warnings introduced by this work.
- Do not retire the Angular entry point until all required features have passing evidence and any remaining differences are explicitly approved.

## Known blockers and verification risks

- The complete unit suite and both React/Angular production builds passed on 2026-10-03, but 18 Firestore emulator tests are skipped and browser-level verification remains unrun.
- The Angular scoring-method toggle is part of the separate 64-item AssessmentPanel/ResultsPanel path, not the 147-item Descent. The 147-item report/route lifecycle and Innerverse behavior still need side-by-side parity checks.
- 4D coordinate-based universe parity, synastry code lifecycle/report-navigation parity, and several backup interchange paths remain incomplete.
- The current branch history notes 18 Firestore emulator cases skipped; emulator execution requires Java 21, which was unavailable through the prior sandbox download path. CI provisions Temurin 21.
- No real browser executable was available during the prior audit, so service-worker, push-permission, WebXR, install, and browser authorization/lifecycle behavior require a browser-enabled environment.
- Dependency installation currently reports 24 npm vulnerabilities; do not apply a breaking forced audit fix while implementing parity.

## Related audit

See [`react-vite-angular-parity.md`](./react-vite-angular-parity.md) for the feature-by-feature inventory, current React implementation notes, Angular source references, and already-established parity decisions.
