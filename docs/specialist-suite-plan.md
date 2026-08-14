# ArchetypeAI — Specialist Suite Upgrade Plan (single-admin)  
Date: 2026-06-04  
POC: Viktor  
Status: Draft for approval

## Goals (what “10/10 specialist-grade” means)
1) **Admin specialist cabinet**: one admin can see all signed-up clients, search by UID, and open a client profile.
2) **Client cabinet**: client can see tasks assigned by admin, complete tasks, add reflections, and track progress artifacts.
3) **Longitudinal progress**: each completed assessment produces an immutable snapshot so admin + client can compare “then vs now”:
   - parts strengthened/weakened/moved/appeared/disappeared
   - clinical indicators deltas (regulation, boundary style, coherence, dissociation, top complexes)

## Current state (repo-grounded)
- App is single-page with overlays (no Router). State is concentrated in `src/app.component.ts`.
- Cloud persistence currently overwrites: `users/{uid}/assessment/current` (no snapshots).
- Firestore adapter already has `saveToHistory/loadHistory` but AppComponent does not use it.
- Worker `worker.ts` logs prompt snippets (privacy issue for clinical use).

## Admin identity / bootstrapping
### Constraint
We cannot “create” a Firebase Auth UID purely from code without Firebase Admin credentials.

### Short-term (single admin)
- The admin creates an account via the app (Google or Email signup).
- We use that Firebase UID as `ADMIN_UID`.
- Until we introduce Firebase Admin / custom claims, the most practical approach is a **code/config constant**.

### Mid-term (more robust)
- Move admin role to a Firestore config doc + Firestore Rules, or Custom Claims set via a privileged backend.

## Proposed Firestore schema (minimal)
### A) Client index for admin listing (PII=B choice)
`clientIndex/{uid}`
```ts
{
  uid: string,
  email: string | null,
  displayName: string | null,
  createdAt: string,         // ISO
  lastSeenAt: string,        // ISO
  latestAssessmentId: string | null,
  latestAssessmentAt: string | null
}
```
Written/updated whenever a user becomes non-anonymous and whenever they complete a snapshot.

### B) Immutable assessment snapshots (longitudinal truth)
`users/{uid}/assessments/{assessmentId}`
```ts
{
  createdAt: string,
  scoringVersion: string,
  responses: number[],            // optional: keep for recompute
  dims: { AGENCY: number, TEMPERATURE: number, FOCUS: number, ATTACHMENT: number },
  pantheon: Array<{
    partKey: string,              // stable across time
    name: string,
    cluster: string,
    coordinates: [number,number,number,number],
    prominence: number,
    partType: string,
    developmentalOrigin: string
  }>,
  clinical: { /* regulation/boundary/coherence/dissociation/top complexes, etc */ },
  narrative: { analysisMarkdown: string | null, provider: string | null, generatedAt: string | null }
}
```

Pointer for quick resume:
`users/{uid}/assessment/current`
```ts
{ latestAssessmentId: string, updatedAt: string }
```

### C) Client cabinet tasks (admin assigns; client completes)
`users/{uid}/tasks/{taskId}`
```ts
{
  title: string,
  description: string,
  assignedAt: string,
  dueAt: string | null,
  status: "assigned"|"in_progress"|"done"|"skipped",
  linkedPartKeys: string[],
  clientReflection: string | null,
  completedAt: string | null
}
```

### D) Admin notes (private to admin)
`users/{uid}/adminNotes/{noteId}`

## Delta engine (progress diffs)
- Introduce a pure deterministic function: `computeAssessmentDelta(snapshotA, snapshotB)` returning:
  - part diffs: strengthened/weakened/moved/appeared/disappeared
  - clinical diffs for key indicators
- Requires a stable `partKey` (not AI-generated names).

## Security posture (must-do before production)
- Add `firestore.rules` (currently missing from repo) to prevent broad reads.
- For single-admin phase:
  - allow admin UID to read `clientIndex/*` and `users/*/assessments/*`, `users/*/tasks/*`, `users/*/adminNotes/*`
  - allow clients to read/write their own documents
- Remove/redact sensitive prompt logging in `worker.ts`.

## Implementation phases (recommended order)
### Phase 0 — Privacy + type safety
- Remove prompt snippet logs from `worker.ts`.
- Ensure `npm run lint` is a required check (already available).

### Phase 1 — Snapshots + clientIndex
- Add StoragePort methods and Firebase adapter to write immutable snapshots.
- Update AppComponent `onResultsReady` to create snapshot and update `clientIndex/{uid}`.

### Phase 2 — Client cabinet tasks (UI + storage)
- StoragePort: CRUD tasks
- UI overlay/page: “My Cabinet”

### Phase 3 — Admin cabinet (UI + storage)
- Admin overlay/page: client list (from clientIndex), search by UID, open client profile
- Timeline + compare using delta engine

## Open items needed from Viktor
1) Create the admin specialist account via the app and provide the Firebase UID.
2) Confirm whether to store `displayName` in `clientIndex` (currently planned as yes, nullable).
