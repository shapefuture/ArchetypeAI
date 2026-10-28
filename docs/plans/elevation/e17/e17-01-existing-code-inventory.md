# E17.01 existing-code inventory — resilience and truthful acknowledgement

**Status:** private source-only candidate; plan intent and hypotheses only. This is not implementation, runtime verification, reconciliation, or acceptance evidence.

**Pinned source base:** `d17aaa68a15b40c4e13eb7e9d7b93b4b08860365`
**Task reference supplied by coordinator:** `ArchetypeAI-ugua`
**Read boundary:** `src/parts-cartographer/app.jsx`, `src/parts-cartographer/overlays.jsx`, `docs/80-20-plan.md`, and `architecture/contracts/**`. The contracts directory is absent at this base. No other source or task-tracker records were inspected for this candidate.

## Source observations

| Scenario | What the allowed source shows | What it does not establish |
| --- | --- | --- |
| Local save failure or quota | `App` initializes parts/profile from `store.load` and falls back to `SEED_PARTS` for a non-array parts value (`app.jsx:63–70`). `setParts` calls `setPartsRaw(next)` before `store.save`; `setProfile` updates React state before saving/archiving or removing (`app.jsx:162–167`). | The implementation of `store.save`, its quota/error behavior, durable-write confirmation, rollback, and any caller feedback are outside this read boundary. The setters themselves show no result check or visible failure acknowledgement. No quota event was induced. |
| Offline read | Initial state is loaded synchronously through `store.load` (`app.jsx:56–70`). The boot comment says local navigation remains available while Firebase connects; after a 4.2-second timer, it starts `auth.anonymousBootstrap()` without a rejection handler and sets onboarding/intro from a local flag (`app.jsx:190–211`). | Local initialization is not proof of a complete offline journey. Auth behavior, offline mutations, reads beyond these keys, cache behavior, and browser/device results are uninspected and untested. |
| Canceled or late coach response | Coach sends an `AbortSignal`, aborts on unmount and on language/mode/selected-part change, and checks both `signal.aborted` and request identity before displaying either result or fallback (`overlays.jsx:41–45, 59–74`). Cancel aborts, stops the simulated stream, clears busy state, and replaces the placeholder with “Request cancelled.” (`overlays.jsx:109–112`). | The imported AI adapter/Worker behavior is uninspected; honoring abort at the transport/server is not established. No race, cancellation, account-switch, or language-switch test was run. The current code clears the composer input before success/failure (`:61–64`); draft preservation after failed requests is not demonstrated. |
| Duplicate or conflicting booking | The UI refuses submission while its `busy` state is true, looks up occupied intervals before presenting slots, and awaits `createBooking` before showing step 3 and a “request sent” toast (`overlays.jsx:679–682, 690–732, 735–753`). Exceptions become a generic booking failure message. | The booking helper's transaction, idempotency, conflict classification, retry semantics, appointment-link partial failure, and server authority are uninspected. The UI guard and earlier slot projection do not establish cross-request duplicate prevention or conflict recovery. No simultaneous booking was attempted. |
| Revoked grant | For the cloud map share-code path, the UI awaits `revokeCloudMapShareCode`; only then does it remove the code from local storage/state and show a success toast. Errors leave an error message (`overlays.jsx:347–362`). | The revocation service, recipient-side enforcement, cache/previously copied data, expiration, and other grant types are uninspected. Local removal is not evidence that all copied or already accessed material is revoked. |
| Restored renderer | The `ifs:local-restored` handler reloads parts/profile/language/theme, returns to intro, and clears sheet/overlay (`app.jsx:90–104`). On universe entry, the app dynamically imports the renderer, checks that the request is active and host connected, sets parts, wakes/resizes, and catches initialization errors into a retry/back overlay (`app.jsx:263–292`; `overlays.jsx:1241–1255`). | This source does not demonstrate restore-to-renderer continuity, handling of invalid/large restored data, renderer recovery after a late import, or actual visual/accessibility correctness. The renderer implementation is outside the declared read set; no restore or renderer failure was exercised. |
| Acknowledgement authority | Booking success follows resolution of `createBooking`; share-code revocation success follows resolution of its revoke helper. In the desktop export fallback, the app triggers an anchor download, optionally awaits clipboard writing, then shows a combined download/copy toast (`overlays.jsx:1485–1503`). | Resolution meaning for the booking/revocation helpers is unknown. In the export fallback, an anchor click is not proof that the file was saved, and optional clipboard absence still permits the success toast. The source therefore does not prove that every acknowledgement corresponds to the durable or externally effective event named by the UI. |

## Plan-only intent

The plan requires exposing save failures rather than false success, preserving drafts, and aligning acknowledgement with actual events (`docs/80-20-plan.md:87, 182–184, 234, 237`). For booking, it calls for distinct pending/confirmed/cancelled/conflict/failure states, recoverable partial failure without duplicate booking, and lifecycle acceptance across competing bookings, reloads, timezones, and denied access (`:62–68`). For coach, it calls for cancellation, retry, clear failures, draft preservation, accurate offline behavior, account/language isolation, and explicit retention/deletion behavior (`:74–82`). These are desired plan outcomes, not evidence that the current implementation satisfies them.

## Inference and hypotheses (not verified)

- Because the visible parts/profile setters update React state before invoking `store.save`, a helper failure that is surfaced by throwing could leave the mounted state ahead of durable storage unless the caller handles it. If the helper silently absorbs storage errors, this source slice provides no feedback path. The helper's actual behavior is unknown.
- Coach request identity checks appear designed to suppress stale completions after cancellation or context changes. This is a code-level hypothesis only; transport cancellation and behavior under rapid repeated actions remain unverified.
- Booking's in-memory `busy` guard may reduce repeated submits in one mounted UI, but it cannot by itself establish server-side uniqueness or resolve a stale availability projection.
- A successful revoke-helper response appears to be the UI's authority for its toast. Whether that response means the code is no longer usable is unknown without the helper and recipient-side path.
- The share fallback's combined acknowledgement can overstate what the browser completed when clipboard support is absent or a download is blocked. This follows from the visible call sequence; no browser behavior was observed.
- The restore handler followed by a later universe entry may pass restored parts to a renderer, but successful visual restoration is unproven.

## Missing evidence and boundaries

- `architecture/contracts/**` is absent at the pinned base; no versioned contract for persistence acknowledgement, booking idempotency/conflicts, grant revocation, or renderer restore was available in the declared contract path.
- Imported implementation paths are not inspected here, including local storage, AI adapter/Worker, booking service, cloud share-code revocation, auth, and renderer internals. Their existence or semantics are not inferred from imports.
- No tests, builds, emulators, Firebase or other services, runtime probes, screen-reader/device checks, or user/participant contact occurred.
- The native task body/acceptance criteria, predecessor artifacts, and old-Bead reconciliation were not read or resolved under this bounded assignment. Parent/dependency/task status is not validated here.

## Bounded smallest-slice proposal

First authorize a separate, narrow inspection of the local persistence helper and its existing tests. If no result-bearing save contract exists, make the first implementation slice only the parts/profile local-save path: report durable save success/failure to its caller, preserve retryable user input/state on failure, and show acknowledgement only after confirmed persistence. Add focused quota/storage-failure coverage in that same slice. Keep booking concurrency, coach transport, grant revocation, and renderer restore as separate slices with their own service contracts and acceptance evidence. This is a proposal; it does not authorize those reads or changes and does not satisfy the broader E17 scenarios.

## Provenance

SHA-256 at the pinned base:

- `src/parts-cartographer/app.jsx` — `17b3fd70a4bd36f22c2526e1f93e6a8beaf5ad28c8e30ece385ef96ba5382f5d`
- `src/parts-cartographer/overlays.jsx` — `6ac5477144078bd6bb102ecfc08aac0109af0c2c14beeee9359d633a3c5458dd`
- `docs/80-20-plan.md` — `7857691284f337ab2f5119292097a2eae603b296860eeb8584e9d8060fcbf370`
- `architecture/contracts/**` — absent at the pinned base; no file hash exists for this glob.

The external proposed manifest is `/tmp/innerverse-e17-proposed-manifest.json`. It is explicitly unvalidated and records no reservation or lease. This candidate remains private; there was no native claim, evidence comment, tracker mutation, integration, or acceptance claim. Old-Bead/predecessor reconciliation remains unresolved.
