# React/Vite parity completion plan

> **Status, 2026-10-23:** the Angular app was retired (`ArchetypeAI-hi8.6`). React is the only client. This document is kept as the historical parity record; paths under `src/app/` refer to git history. Live release sign-off for the React app remains tracked by **ArchetypeAI-hi8.5**.

**Checkpoint:** 2026-10-03, PR [#2](https://github.com/shapefuture/ArchetypeAI/pull/2).

The core migration implementation is present and locally verified. Release sign-off remains open under **ArchetypeAI-hi8.5**; this document does not certify live payments, identity-provider flows, device push delivery or XR hardware. Angular remains buildable as the behavior and data-contract reference.

## Goal and guardrails

Make the React/Vite implementation preserve Angular capabilities while improving the character rendering, local restore, report completeness, cancellation and navigation. Keep data local by default, use authenticated Worker transport, preserve narrow Firestore rules, and make every cloud/share operation explicit. Retain the 64-item and 147-item routes as distinct assessments.

## Implementation checkpoints

| Phase | Implemented behavior | Evidence / remaining acceptance |
|---|---|---|
| 0 — 64-item AI lifecycle | Explicit AI selection, authenticated and time-bounded requests, cancellation during identity/provider waits, in-mounted language reset, failed request/retry, local numeric preservation, cached reflection and export. | React tests are isolated from Angular Zone.js and run without `act` warnings. `legacy-assessment.spec.ts`, `ai.adapter.spec.ts`, `legacy-report.spec.ts`. Live provider acceptance remains. |
| 1 — AssessmentPanel / ResultsPanel | Canonical question order/scorer, deterministic and alternate AI report, stable coordinate handoff, historical backup conversion and read-only specialist rendering. | `legacy-universe-adapter.spec.ts`, `backup.spec.ts`, `legacy-report.spec.ts`; browser historical restore opens the report. |
| 2 — 147-item Descent / report | Canonical `scoreProfile`, complete report with four card layers, Self radar, burden, complexes, polarizations, coping, needs, resource leaks, validity/crisis notes, private Future Self, Markdown, history and direct universe entry. | Canonical fixtures and bilingual report tests; mobile browser answers all 147 questions, resumes after reload, completes and exports. |
| 3 — 4D universe | Stable DTO/coordinates, X/Y/Z mapping, weighted affinity/highlighting, dimension isolation, search, family/energy/cluster/report/selection filters, touch orbit and selected-part focus. True merged Felt Atelier meshes and matching card renders replace the old SVG portrait system. | Coordinate fixtures, every canonical/seed character has finite geometry; browser verifies 18 sewn characters, keyboard filters, Escape and re-entry. Actual WebXR hardware remains unverified; unsupported browsers show a clear state. |
| 4 — Synastry | Both canonical Angular engines, compatible-input validation, saved report/reflection restore, section navigation, full Markdown/JSON, private code creation/redemption/revocation. Legacy answer-vector codes require separate explicit consent. | Engine equality fixtures, detailed bilingual reports, Worker cancellation tests, share-code collision tests and Firestore authorization/revocation fixtures. Live signed-in generation/redeem/revoke UI acceptance remains. |
| 5 — Backup/account lifecycle | Schema-versioned portable backup, historical 64/canonical 147 adapters, strict validation/size limits, preview, merge/replace, rollback and immediate mounted-state refresh. Cloud latest/history are written atomically and exclude private answers/reflections. Account changes invalidate late history/payment UI responses. | Backup/privacy/rollback fixtures, browser preview-before-apply and offline restored language/theme. Live anonymous-to-linked and provider account flows remain. |
| 6 — Therapist/admin/booking | Existing real availability, linked clients, assignments and admin-owned notes retained. Specialist reports are complete and read-only. Busy-slot concurrency is enforced; status changes use a transaction and cannot release another booking's lock. | 19 emulator tests pass without skips, including two concurrent reservations. Calendar rollover and real IANA DST tests pass. Existing Angular naive wall-clock storage is retained and the booking UI identifies the device timezone. Cross-timezone scheduling needs a separately versioned contract. |
| 7 — AI/push/billing/PWA/telemetry | Explicit selected-part chat context, bounded history, cancellable studio and localized degraded drafts, canonical exercise suggestions; FCM token rotation/withdrawal and foreground notification text; UID-bound verified Stripe receipts; full public-asset offline precache; local-only telemetry. | Transport, push, payment ownership/race/expiry tests, Worker security fixtures and offline PWA browser reload. Real device/background push, actual checkout and OS installation remain unverified. |
| 8 — Interaction/localization | Bilingual clinical and synastry reports, translated universe cluster labels, accessible icon controls, dialog focus/Escape restoration, reduced-motion support, mobile tray overflow fixes and malformed local-history guards. | Mobile axe checks have no critical/serious violations with color contrast excluded. A complete manual screen-reader/color-contrast and bilingual screen audit remains. |
| 9 — Release gate | Reproducible dependency install, unit/type/rules checks, both builds and production-preview browser tests; CI now runs browser checks. | Exact results and limitations are recorded in [parity evidence](./react-vite-angular-parity-evidence.md). Angular must remain until release acceptance is complete. |

## Release acceptance

Beads **ArchetypeAI-hi8** remains the parity epic; **ArchetypeAI-hi8.5** tracks the remaining live/manual release acceptance. Deployment, merging and retiring Angular are not part of this verification pass. No Firebase rule or Worker production deployment was performed.

The local gates pass: **802 unit tests**, **19 emulator tests**, production mobile browser flows, TypeScript and both builds. Production dependency audit reports **zero vulnerabilities**. Angular's existing `NG0914` test warnings and Vite's existing mixed static/dynamic import notices are documented rather than treated as proof of runtime failure.

See [feature traceability](./react-vite-angular-parity.md) and [verification evidence](./react-vite-angular-parity-evidence.md).
