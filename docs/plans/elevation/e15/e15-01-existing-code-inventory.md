# E15.01 — Existing-code inventory: consentful therapist support

**Candidate status:** source-only inventory for review. This document is not implementation evidence, task acceptance, or a claim that the historical task binding is resolved.

## Scope and provenance

The assignment identifies `ArchetypeAI-ypmu` as open and names five behaviors to inventory: prepare an agenda without sending, preview the exact share scope, distinguish a booking request from confirmation, revoke before therapist access, and retain only a user-chosen post-session next step. This pass did not query or mutate Beads, claim the task, inspect predecessor output, or reconcile old-Bead bindings.

The workcell is a clean detached clone at base `d17aaa68a15b40c4e13eb7e9d7b93b4b08860365`. The only source paths read were:

- `src/parts-cartographer/overlays.jsx` — SHA-256 `6ac5477144078bd6bb102ecfc08aac0109af0c2c14beeee9359d633a3c5458dd`
- `src/parts-cartographer/screens/cabinet.jsx` — SHA-256 `38ec41be52062ecea90e346e9ae501feefc2473d25ae21d6b2c55cb2dd941c03`
- `docs/80-20-plan.md` — SHA-256 `7857691284f337ab2f5119292097a2eae603b296860eeb8584e9d8060fcbf370`
- `architecture/contracts/**` — missing at this base; `architecture/contracts/` is absent, so there are no contract files or hashes to report.

External proposed manifest: `/tmp/e15-01-proposed-manifest.json`, SHA-256 `759e299a6d991e8eb52ea5e377f51b206269d829684fda5332d37915f9df3027`. It permits only the source reads above and this output path, declares `lease_status: proposed-only; no validated lease`, and declares no quality commands. No validated lease was available or claimed. The candidate is written only to the manifest’s output path in the isolated workcell.

## Code observations

### Agenda preparation without sending

`Coach` keeps the input and chat messages in component state. Its `send` handler adds the typed text to the chat history and calls `chatWithContext` with that history, mode, language, and selected-part context (`overlays.jsx:32–45, 59–74`). The visible controls invoke that handler from suggested prompts, Enter, and the send button. In this component there is no agenda-only preparation action or agenda-specific save/review control.

This establishes that the current send action invokes `chatWithContext`; it does not establish where that call executes, whether it contacts a remote service, or what that service retains. Those implementations are outside the permitted read set.

### Exact therapist share-scope preview

The therapist-share payload is assembled by `therapistShareSummary` (`overlays.jsx:1437–1460`). It contains a headline truncated to 160 characters; burden and mean self-energy scores converted to 0–100; a map of part IDs to scores and tiers; up to 50 complex IDs represented as active; up to four coping-stack values with defaults; and fixed adherence values `{done: 0, skipped: 0}`. `Share.createShareCode` passes that summary to `createTherapistLink` after a consent checkbox is set (`overlays.jsx:1506–1519`). The therapist-share UI displays translated consent text, a checkbox, a create button, and the resulting code; it does not render those payload fields or values as a field-level preview before creation (`overlays.jsx:1536–1559`). The wording behind the translation keys was not read.

The same component also renders a social map image, which is a distinct sharing action (`overlays.jsx:1474–1504, 1525–1535`). The inspected code does not establish whether the helper’s saved payload is identical to the argument shown here, who can redeem the code, or what access is enforced after redemption. The `createTherapistLink` implementation was not read.

A different Synastry share-code flow has a consent checkbox and a revoke action (`overlays.jsx:323–360, 497–520`). It uses `createCloudLegacy64ShareCode` or `createCloudMapShareCode` and `revokeCloudMapShareCode`; this is not evidence of therapist-link revocation or access control.

### Booking request versus confirmed appointment

The booking UI gathers a provider, date, and slot and requires a checkbox whose translated text is not in the read set (`overlays.jsx:690–733, 823–852`). On submit, `confirmBooking` calls `createBooking` with client and therapist identifiers/emails and start/end values, then advances to a result headed by `bookingRequestSent` (`overlays.jsx:735–756, 855–861`). The call does not include a discussion note or a share-scope value. The component does not label this result as a confirmed appointment.

The therapist UI filters to pending appointments and offers approve/decline actions using `setAppointmentStatus` (`overlays.jsx:951–964, 1062–1086`). The cabinet displays the appointment’s current status and permits cancellation for pending or approved items (`cabinet.jsx:69–84, 216–232`). These are UI observations only: the booking, status, and appointment service implementations are outside the read set, so this inventory cannot confirm server-side state transitions, atomicity, notification, or access-link behavior. The booking flow’s consent checkbox is visible evidence of an interaction, not evidence of exact disclosure or enforcement.

### Revoke before therapist access

The `Share` component creates and displays a therapist code, but the inspected component contains no therapist-code revoke control (`overlays.jsx:1506–1519, 1536–1569`). The separate Synastry code revoke action cannot establish that a therapist link can be revoked, that revocation takes effect before redemption, or that an already issued link is blocked at access time. No therapist-link lookup, redemption, authorization, expiry, or revocation service was inspected.

### Retaining only a user-chosen post-session next step

The generic `Journal` reads and writes `ifs.journal` in `localStorage`. Its records contain `id`, `at`, `kind`, `what`, `where`, `part`, and `note`; users can delete an entry (`overlays.jsx:1260–1285, 1315–1348`). The cabinet appointment view shows provider, status, date, and cancellation, with no post-session next-step control in the inspected section (`cabinet.jsx:216–232`). A targeted search of the two permitted UI files for agenda, next-step, post-session, therapist revocation, and share-preview terms found no dedicated session flow.

The generic journal calls `localStorage.setItem` for multiple user-entered fields and catches write failures. This establishes an attempted local write, not successful or durable persistence. It also does not prove those fields are connected to a booking, session, or therapist, nor that they are the only retained records elsewhere in the app. No dedicated user-chosen post-session next-step representation or retention/deletion policy was visible in these inspected components.

## Plan intent (not implementation evidence)

The plan calls for bounded context to the coach and an optional editable discussion note with separate consent (`docs/80-20-plan.md:50`). Its scheduling plan requires an exact disclosure preview; a review of provider, date, time, timezone, duration, status expectations, and shared data; distinguishable pending, confirmed, cancelled, conflict, and failure states; and reliable cabinet reopening (`:58–68, :434–442`). It also calls for role, ownership, consent, lifecycle, and historical compatibility boundaries (`:727–729`). Its trust rubric includes user control over context, retention, disclosure, and return cadence, evaluated with consent comprehension, deletion/revocation, and account-boundary checks (`:705`).

These statements set direction and evidence expectations. They do not show that the behaviors are implemented, that the relevant service contracts exist, or that any validation has passed.

## Bounded proposal for a future implementation slice

1. Add an agenda draft/review step that does not invoke `chatWithContext`; keep sending as a separate explicit action. If draft persistence is introduced, make it user-controlled and deletable, and do not silently send the draft as coach context.
2. Before creating a therapist link, render the exact field names and current values that the link is intended to expose, including the fields currently assembled by `therapistShareSummary`. Require a separate affirmative action after review. Keep appointment booking separate from profile/result disclosure.
3. Label a successful submission as a **request** until the authoritative appointment state is confirmed. Reopen and render server-backed pending/confirmed/declined/cancelled/conflict/failure states in both client and practitioner views. Define the lifecycle and timezone/access-link contract before treating the flow as complete.
4. Provide a therapist-link revoke action and a matching server-side revocation check that is applied before access or redemption. Define the observable revoked state and races with concurrent redemption; UI disappearance alone is not proof of access denial.
5. After a session, offer an optional user-entered next step with explicit save. Retain only the chosen next-step content for this feature, provide deletion, and do not automatically retain an agenda, transcript, general journal fields, or therapist notes as part of this flow. Define any minimum linkage metadata and retention duration in a reviewed contract before implementation.

This is a bounded proposal only. It does not prescribe service/schema changes without the missing contracts and lifecycle evidence.

## Evidence gaps and blockers

- `architecture/contracts/**` is absent at the pinned base; no accountable contract for consent, payload, booking lifecycle, link revocation, retention, or migration was available in the permitted read set.
- Helper and service implementations are uninspected, including `chatWithContext`, `createTherapistLink`, booking lookup/creation/status functions, and therapist-link access/revocation. UI calls do not establish backend behavior or storage.
- Relevant translation strings were not read, so this inventory does not characterize consent wording or state labels beyond the literal keys and hard-coded visible text.
- No runtime, account-boundary, accessibility, user-comprehension, service, rules, or deployed-state evidence was gathered. No tests or builds were run.
- The old-Bead/predecessor relationship remains unresolved. No task claim, comment, status change, or acceptance action was made.

## Review boundary

This artifact is a private candidate for independent review. The only proposed repository write is this document; no app code changed. It is not copied to the root checkout, integrated, or posted as tracker evidence. Task status, dependencies, and acceptance remain untouched.
