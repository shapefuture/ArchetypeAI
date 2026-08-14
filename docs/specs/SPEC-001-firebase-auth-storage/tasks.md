# SPEC-001 — Tasks

## Header

| Field | Value |
|---|---|
| Parent epic | [SPEC-001: Firebase Auth & Assessment Storage](./epic.md) |
| Status | `not-started` |
| Created | 2026-05-24 |
| Last updated | 2026-05-24 |

---

## Task index

| ID | Title | Type | Size | Status | Languages | Blocked by | Blocks | Critical? |
|---|---|---|---|---|---|---|---|---|
| T-001 | Firebase SDK + environment config | infra | S | not-started | TS,JSON | — | T-004, T-005 | Yes |
| T-002 | Port interfaces + injection tokens | feature | S | not-started | TS | — | T-003, T-004, T-005 | Yes |
| T-003 | LocalStorage adapter | refactor | S | not-started | TS | T-002 | T-006 | No |
| T-004 | FirebaseAuthAdapter | feature | M | not-started | TS | T-001, T-002 | T-006 | Yes |
| T-005 | FirebaseStorageAdapter + resilience | feature | M | not-started | TS | T-001, T-002 | T-006, T-008 | Yes |
| T-006 | Wire services into components | feature | M | not-started | TS | T-003, T-004, T-005 | T-007, T-008 | Yes |
| T-007 | Sign-up prompt UI | feature | M | not-started | TS,HTML | T-006 | — | No |
| T-008 | Synastry share codes | feature | S | not-started | TS,HTML | T-005, T-006 | — | No |

---

### T-001: Firebase SDK + environment config

#### Meta

| Field | Value |
|---|---|
| Type | infra |
| Size | S |
| Status | not-started |
| Languages | TS, JSON |
| Scope paths | `src/environments/`, `package.json` |
| Blocked by | — |
| Blocks | T-004, T-005 |
| Critical? | Yes |

#### Goal

Install Firebase SDK and create environment config files so downstream adapters can import and initialize Firebase.

#### Scope

- Install `firebase` npm package
- Create `src/environments/environment.ts` with `firebase` config object (placeholder values)
- Create `src/environments/environment.prod.ts` with same structure
- Create `src/environments/firebase-init.ts` that initializes Firebase app instance (singleton)

#### Out of scope

Adapter implementations, Firestore rules, UI changes.

#### Files to create or modify

| Path | Action | Purpose |
|---|---|---|
| `package.json` | modify | Add `firebase` dependency |
| `src/environments/environment.ts` | create | Firebase config (dev) |
| `src/environments/environment.prod.ts` | create | Firebase config (prod) |
| `src/environments/firebase-init.ts` | create | Singleton Firebase app init |

#### Acceptance criteria

- **AC-1:** `firebase` package in `package.json` dependencies
- **AC-2:** `import { app } from './environments/firebase-init'` does not error in TypeScript

---

### T-002: Port interfaces + injection tokens

#### Meta

| Field | Value |
|---|---|
| Type | feature |
| Size | S |
| Status | not-started |
| Languages | TS |
| Scope paths | `src/app/core/ports/` |
| Blocked by | — |
| Blocks | T-003, T-004, T-005 |
| Critical? | Yes |

#### Goal

Define `AuthPort`, `StoragePort` interfaces and Angular injection tokens so adapters have stable contracts.

#### Scope

- `src/app/core/ports/auth.port.ts` — `AuthPort` interface, `User` type, `AUTH_PORT` InjectionToken
- `src/app/core/ports/storage.port.ts` — `StoragePort` interface, `AssessmentData` type, `STORAGE_PORT` InjectionToken

#### Data structures

```typescript
interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAnonymous: boolean;
}

interface AuthPort {
  signInAnonymously(): Promise<void>;
  signInWithGoogle(): Promise<void>;
  signInWithEmail(email: string, password: string): Promise<void>;
  signUpWithEmail(email: string, password: string): Promise<void>;
  linkAnonymousToGoogle(): Promise<void>;
  linkAnonymousToEmail(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  readonly user$: Observable<User | null>;
  readonly isAuthenticated$: Observable<boolean>;
}

interface AssessmentData {
  responses: number[];
  dimensionalExpressions: { AGENCY: number; TEMPERATURE: number; FOCUS: number; ATTACHMENT: number };
  results: { analysis: string; pantheon: any[]; dynamics?: any[] } | null;
  scoringMethod: 'deterministic' | 'fallback';
  updatedAt: string;
}

interface StoragePort {
  saveAssessment(userId: string, data: AssessmentData): Promise<void>;
  loadAssessment(userId: string): Promise<AssessmentData | null>;
  saveToHistory(userId: string, data: AssessmentData): Promise<string>;
  loadHistory(userId: string): Promise<AssessmentData[]>;
  createShareCode(userId: string): Promise<string>;
  loadShared(shareCode: string): Promise<AssessmentData | null>;
}
```

#### Acceptance criteria

- **AC-1:** Both interfaces compile without external dependencies (no Firebase imports)
- **AC-2:** Injection tokens created and exportable

---

### T-003: LocalStorage adapter

#### Meta

| Field | Value |
|---|---|
| Type | refactor |
| Size | S |
| Status | not-started |
| Languages | TS |
| Scope paths | `src/app/core/adapters/` |
| Blocked by | T-002 |
| Blocks | T-006 |

#### Goal

Wrap existing localStorage logic into a `StoragePort`-compliant adapter for fallback and testing.

#### Scope

- `src/app/core/adapters/local-storage.adapter.ts` — implements `StoragePort` using localStorage
- Reuses existing keys: `ARCHETYPE_ASSESSMENT_RESPONSES`, `ARCHETYPE_COMPLETED_BACKUP`

#### Out of scope

Share codes (not supported in localStorage — returns null). History (returns empty array).

#### Files to create

| Path | Action | Purpose |
|---|---|---|
| `src/app/core/adapters/local-storage.adapter.ts` | create | LocalStorage StoragePort adapter |

#### Acceptance criteria

- **AC-1:** `LocalStorageAdapter` implements `StoragePort` without errors
- **AC-2:** `loadAssessment()` reads from existing localStorage keys
- **AC-3:** `saveAssessment()` writes in format compatible with current backup logic

---

### T-004: FirebaseAuthAdapter

#### Meta

| Field | Value |
|---|---|
| Type | feature |
| Size | M |
| Status | not-started |
| Languages | TS |
| Scope paths | `src/app/core/adapters/` |
| Blocked by | T-001, T-002 |
| Blocks | T-006 |
| Critical? | Yes |

#### Goal

Implement `AuthPort` using Firebase Auth modular SDK. Supports anonymous, Google, and email/password auth plus account linking.

#### Scope

- `src/app/core/adapters/firebase-auth.adapter.ts`
- Maps Firebase `User` to domain `User` type
- Handles `linkWithCredential` for anonymous-to-permanent conversion
- `user$` as Observable from `onAuthStateChanged`

#### Out of scope

Password reset, account deletion, phone auth.

#### Files to create

| Path | Action | Purpose |
|---|---|---|
| `src/app/core/adapters/firebase-auth.adapter.ts` | create | Firebase Auth adapter |

#### Acceptance criteria

- **AC-1:** `signInAnonymously()` returns without error when Firebase available
- **AC-2:** `linkAnonymousToGoogle()` preserves uid (data not lost)
- **AC-3:** `user$` emits `User` on sign-in and `null` on sign-out

---

### T-005: FirebaseStorageAdapter + resilience helpers

#### Meta

| Field | Value |
|---|---|
| Type | feature |
| Size | M |
| Status | not-started |
| Languages | TS |
| Scope paths | `src/app/core/adapters/` |
| Blocked by | T-001, T-002 |
| Blocks | T-006, T-008 |
| Critical? | Yes |

#### Goal

Implement `StoragePort` using Firestore, with resilience wrapper (timeout + retry + fallback).

#### Scope

- `src/app/core/adapters/resilience.ts` — `withResilience<T>()` wrapper: 10s timeout, 3x exp backoff retry
- `src/app/core/adapters/firebase-storage.adapter.ts` — implements `StoragePort` using Firestore
- Share code generation (8-char random, stored in `shareCodes/{code}`)
- Assessment history saved to `users/{uid}/history/` subcollection

#### Out of scope

Real-time listeners, Firestore indexes (single-document reads sufficient).

#### Files to create

| Path | Action | Purpose |
|---|---|---|
| `src/app/core/adapters/resilience.ts` | create | Timeout/retry wrapper |
| `src/app/core/adapters/firebase-storage.adapter.ts` | create | Firestore adapter |

#### Acceptance criteria

- **AC-1:** `saveAssessment()` writes to `users/{uid}/assessment` in Firestore
- **AC-2:** `loadAssessment()` returns data matching what was saved
- **AC-3:** `createShareCode()` returns 8-char code, `loadShared(code)` returns the owner's data
- **AC-4:** Resilience wrapper times out after 10s and retries 3x on transient errors

---

### T-006: Wire services into components

#### Meta

| Field | Value |
|---|---|
| Type | feature |
| Size | M |
| Status | not-started |
| Languages | TS |
| Scope paths | `src/app.component.ts`, `src/app/features/` |
| Blocked by | T-003, T-004, T-005 |
| Blocks | T-007, T-008 |
| Critical? | Yes |

#### Goal

Wire `AuthPort` and `StoragePort` into `AppComponent` and feature components. Replace direct localStorage calls with port calls. Register providers.

#### Scope

- `src/app/app.config.ts` (or equivalent) — register `AUTH_PORT` and `STORAGE_PORT` providers
- `src/app.component.ts` — inject ports, auto anonymous sign-in, save/load assessment via ports
- `src/app/features/assessment-panel/assessment-panel.component.ts` — save responses via StoragePort
- `src/app/features/results-panel/results-panel.component.ts` — save results via StoragePort
- Remove direct `localStorage` calls from components (moved to LocalStorageAdapter)

#### Out of scope

UI changes (sign-up prompt is T-007). Synastry share codes (T-008).

#### Configuration touchpoints

| Config file | What to change |
|---|---|
| `src/app/app.config.ts` or `main.ts` | Add AUTH_PORT, STORAGE_PORT providers |

#### Acceptance criteria

- **AC-1:** App loads, anonymous sign-in triggers via AuthPort
- **AC-2:** Assessment responses saved via StoragePort (Firestore if online, localStorage if not)
- **AC-3:** Returning user sees data restored from Firestore
- **AC-4:** No direct `localStorage.setItem` calls remain in components (only in adapters)

---

### T-007: Sign-up prompt UI

#### Meta

| Field | Value |
|---|---|
| Type | feature |
| Size | M |
| Status | not-started |
| Languages | TS, HTML |
| Scope paths | `src/app/features/` or `src/app/shared/components/` |
| Blocked by | T-006 |
| Blocks | — |

#### Goal

After assessment results are generated, show a prompt to sign up and save. Supports Google and Email/Password. Uses existing TranslationService for en/ru.

#### Scope

- New component (e.g., `save-prompt` or integrated into results panel)
- "Sign in with Google" button
- Email/password form (expandable)
- "Continue without saving" dismiss
- Links anonymous account to chosen provider
- All text via TranslationService

#### Out of scope

Password reset, profile management, account settings.

#### I18n touchpoints

| Translation key | Languages |
|---|---|
| `savePrompt.*` | en, ru |
| `auth.*` | en, ru |

#### Acceptance criteria

- **AC-1:** Prompt appears after results are generated for anonymous users
- **AC-2:** Clicking Google sign-in links anonymous account, data persists
- **AC-3:** Dismissing prompt does not block the user from proceeding
- **AC-4:** Prompt does not appear for already-authenticated users

---

### T-008: Synastry share codes

#### Meta

| Field | Value |
|---|---|
| Type | feature |
| Size | S |
| Status | not-started |
| Languages | TS, HTML |
| Scope paths | `src/app/features/synastry-panel/` |
| Blocked by | T-005, T-006 |
| Blocks | — |

#### Goal

Add share code generation and loading to the existing synastry panel, alongside the current file upload mechanism.

#### Scope

- "Generate Share Code" button in synastry panel — calls `StoragePort.createShareCode()`
- "Enter partner's code" input — calls `StoragePort.loadShared(code)`
- Display share code after generation (copyable)
- Load partner data from share code into synastry comparison

#### Out of scope

Replacing file upload (kept as fallback). Share code expiration UI.

#### I18n touchpoints

| Translation key | Languages |
|---|---|
| `share.*` | en, ru |

#### Acceptance criteria

- **AC-1:** Clicking "Generate" creates an 8-char code and displays it
- **AC-2:** Entering valid code loads partner's assessment data for synastry
- **AC-3:** Entering invalid code shows "not found" error
- **AC-4:** File upload still works as before

---

## Progress log

| Task | Status | Agent | Started | Completed | Notes |
|---|---|---|---|---|---|
