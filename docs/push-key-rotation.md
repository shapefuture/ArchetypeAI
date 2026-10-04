# Web Push key rotation

## Incident state — 2026-10-04

The legacy Beads issue `ArchetypeAI-h8c` contained a VAPID private key. Its
current note and the GitHub `main` issue export have been redacted. The same
key remains in historical Git and Dolt revisions. Redaction does not revoke
it; treat it as compromised until replacement and subscription migration
are verified. Do not copy it into another note, log, command, or document.

The current client public key is in both
`src/environments/environment.ts` and
`src/environments/environment.prod.ts`. Both React and Angular use this
configuration. Whether the matching certificate was imported into Firebase
has not yet been verified. The current workspace has no Firebase service
account binding or authenticated Firebase CLI session. Hosting deployment
has not been authorized for this repair.

## Replacement procedure

1. Open the project's [Cloud Messaging settings](https://console.firebase.google.com/project/archetype-ai-3e43b/settings/cloudmessaging).
   Inspect **Web configuration → Web Push certificates**. Compare the
   registered public key with the client configuration. Record only the
   public-key identity and certificate status, never the private key.
2. Generate a replacement key pair in Firebase Console, or import a pair
   from the approved secret manager with the necessary project permission.
   Prefer console generation so the private key never enters the workspace.
   Follow the [official Firebase setup instructions](https://firebase.google.com/docs/cloud-messaging/web/get-started).
   Do not assume that a Hosting deployment or a client API key can manage
   these certificates. A service account's permissions must also be checked.
3. Retire the exposed certificate wherever it is configured, using the
   provider-supported management flow. If the old key was never imported,
   record that evidence and ensure it is never imported later. If the
   console does not provide a retirement action, resolve the revocation
   procedure with Firebase support; do not mark rotation complete merely
   because another pair exists.
4. Replace **only the public key** in both client environment files with
   the public key registered in Firebase. Keep replacement private material
   in the provider or approved secret manager.
5. Prepare subscription migration before an authorized release. A browser
   already reporting reminders as enabled must not keep a subscription
   signed for the old key indefinitely. Track the public-key version beside
   the cached token; when it changes, reconcile the opted-in subscription
   while its owner is authenticated. Use Firebase's token/subscription
   APIs, remove superseded owner token records, and preserve opt-out and
   denied-permission behavior. Do not request notification permission on
   startup for users who never opted in. Check both React and retained
   Angular flows.
6. After deployment is separately authorized, release the public-key and
   migration changes together. Existing cached/PWA clients also need the
   new release. Inventory stale registrations and stop targeting tokens
   associated with the old key; changing the certificate alone does not
   migrate browser subscriptions.
7. Verify fresh opt-in, existing opt-in migration, foreground/background
   delivery, opt-out, and sign-out using the actual sender and supported
   installed browsers. Verify that the old subscription is no longer
   targeted. Attach non-secret evidence to `ArchetypeAI-h8c`, then close
   rotation only when the certificate and subscription outcomes are proven.

Historical copies are still exposed. History rewriting is a separate,
coordinated repository operation and cannot substitute for rotation.
