# React/Vite parity verification evidence

2026-10-03, branch `arena/01a1012a-archetypeai`, PR [#2](https://github.com/shapefuture/ArchetypeAI/pull/2).

## Executed gates

| Command | Result |
|---|---|
| `npm ci --no-audit --no-fund` | Clean install succeeds; the missing lockfile entries are repaired. |
| `npm audit --omit=dev --json` | Zero production vulnerabilities. |
| `npm test` | 70 files pass, 802 tests pass. The 19 emulator-only cases are intentionally skipped in this jsdom run and executed separately below. |
| `npm run test:rules` | 19 tests pass, zero skips; includes two simultaneous client reservations with exactly one appointment and one public busy lock. |
| `npm run lint` | TypeScript passes. JSX is additionally compiled by the production builds and exercised by component/browser tests. |
| `npm run build:angular` | Retained reference builds successfully. |
| `npm run build` | React/Vite, worker assets, service-worker stamp and headers build successfully. Main UI chunk 323.72 KB (101.82 KB gzip); Firebase/Three/React are separate vendor chunks. No chunk-size warning. |
| `npm run test:browser` | Four production-preview Chromium mobile flows pass. |

Environment: Node 24.19.0, Java 21.0.12.1, Chromium 151.0.7922.173, Playwright 1.63.0. CI uses the repository's Node 20.19.1 pin, Java 21 and Playwright's installed Chromium. The browser viewport is 390×844 with reduced motion and software WebGL.

## Browser flows

`tests/browser/parity.spec.mjs` uses the built React app on port 4173. Google/Firebase/API traffic is blocked; these tests do not create production accounts, send AI prompts, charge a card or write production Firestore data.

1. Restore a portable backup in preview, apply Russian/light settings, wait for the PWA controller, disconnect the browser, reload, and open the previously unopened 64-item report.
2. Answer all 14 Quick Scan questions, verify that the full profile remains absent, and close with Escape.
3. Answer seven canonical 147-item questions, reload/resume, finish all questions and private future reflections, verify 14 report cards/18 profile parts, check raw-answer network boundaries, export Markdown, open the coordinate universe, verify 18 actual felt meshes, use axis/keyboard filters, close with Escape and re-enter the universe. Mobile report/universe axe checks contain no critical/serious violations with color contrast excluded.
4. Preview an old Angular 64-response backup before any local mutation, apply it, refresh mounted app state and open its local report with explicit AI selection available.

## Targeted regression evidence

- Every canonical 147-result character and every saved seed builds finite real front/back geometry. Card/universe DNA agrees, all merged outlines are supported, and eyewear/bow/blush add sewn detail. Required topper defaults prevent invalid geometry when migrating old traits.
- The 64-item AI UI preserves local numbers after failure, permits retry, cancels during retake or in-mounted language change, and retains only matching-language output. Worker calls authenticate, validate output, propagate cancellation and have a 45-second deadline even while waiting for identity.
- Full canonical reports render four layers in English and Russian. Specialist reports suppress owner actions and the specialist's private reflection. Malformed local history is excluded.
- Backups validate complete bounded profiles/parts, exclude authentication/payment/push secrets, rebuild canonical scores and coordinates, round-trip local answers/reflections/history, and roll back on storage failure.
- Payment tests reject unverified flags and another UID's receipt, ignore late verification after account switching, clean callback parameters and expire the offline cache while a tab stays open.
- Push tests cover support/permission states, owner registration, rotation, visible foreground text, withdrawal and the local cap. Rules test token ownership/deletion.
- Booking fixtures cover midnight/year rollover, overlapping availability, duration selection, spring DST gaps and repeated autumn times in an actual IANA-zone child process. Status updates retain ownership of the busy lock during retry.

## Limits and release gate

Angular's retained tests emit the existing `NG0914` zoneless/Zone.js notices. React tests use a separate project without Zone.js and no longer emit the asynchronous `act` warning. Vite retains existing mixed static/dynamic notices for parts and user-directory modules; redundant new mixed imports have been removed. Browser launch logs may report terminal color-environment notices.

These are local/mocked/emulator checks. Actual Google/email linking and cross-account UI sessions, configured Stripe checkout/return, real FCM background/device delivery, OS install/update, XR headset behavior, complete manual color-contrast/screen-reader and bilingual screen review still require release acceptance under **ArchetypeAI-hi8.5**. No production deployment, PR merge or Angular retirement was performed.
