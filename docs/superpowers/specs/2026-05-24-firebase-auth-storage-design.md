# Firebase Auth + Assessment Storage

## Context

ArchetypeAI is an Angular 20 app (standalone components, signals) that runs a 52-question psychological assessment, generates personal archetypes via Gemini AI, and visualizes them in a 3D universe (Three.js). Currently all data lives in localStorage — no backend, no auth. Users manually export/import JSON backups.

## Goal

Add Firebase for authentication and cloud persistence of assessment data, using a hexagonal ports/adapters architecture so Firebase remains a swappable implementation detail.

## Requirements

- **Auth providers**: Google, Email/Password, Anonymous
- **Auth gating**: Users take assessment first (anonymous), then prompted to sign up to save. Anonymous account links to permanent account preserving all data.
- **Data stored per-user**: assessment responses, generated archetypes (pantheon), dimensional expressions, scoring preference, assessment history
- **Synastry sharing**: shareable codes so partners can load each other's results without file upload
- **Resilience**: timeout, retry, fallback to localStorage when Firebase unavailable

## Architecture

### Ports (domain contracts — no Firebase imports)

```typescript
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

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAnonymous: boolean;
}

interface StoragePort {
  saveAssessment(userId: string, data: AssessmentData): Promise<void>;
  loadAssessment(userId: string): Promise<AssessmentData | null>;
  saveToHistory(userId: string, data: AssessmentData): Promise<string>;
  loadHistory(userId: string): Promise<AssessmentData[]>;
  createShareCode(userId: string): Promise<string>;
  loadShared(shareCode: string): Promise<AssessmentData | null>;
}

interface AssessmentData {
  responses: number[];
  dimensionalExpressions: { AGENCY: number; TEMPERATURE: number; FOCUS: number; ATTACHMENT: number };
  results: {
    analysis: string;
    pantheon: GeneratedArchetype[];
    dynamics?: PartsDynamic[];
  } | null;
  scoringMethod: 'deterministic' | 'fallback';
  updatedAt: string; // ISO timestamp
}
```

### Adapters (implementations)

| Adapter | Implements | Technology |
|---------|-----------|------------|
| `FirebaseAuthAdapter` | `AuthPort` | Firebase Auth modular SDK |
| `FirebaseStorageAdapter` | `StoragePort` | Firestore |
| `LocalStorageAdapter` | `StoragePort` | localStorage (current logic, wrapped) |

### DI wiring

```typescript
// One provider swap changes backend
providers: [
  { provide: AUTH_PORT, useClass: FirebaseAuthAdapter },
  { provide: STORAGE_PORT, useClass: FirebaseStorageAdapter },
  // For testing or offline: swap to LocalStorageAdapter
]
```

### Resilience on Firebase calls

Every Firebase adapter method wraps the call with:
1. **Timeout**: 10s via `Promise.race` with a rejection timer
2. **Retry**: 3x exponential backoff with jitter (100ms, 200ms, 400ms base)
3. **Fallback**: on failure, falls back to localStorage cache if available

### Firestore schema

```
users/{uid}
  └── assessment (single document)
        responses: number[]
        dimensionalExpressions: { AGENCY, TEMPERATURE, FOCUS, ATTACHMENT }
        results: { analysis, pantheon[], dynamics[] }
        scoringMethod: string
        updatedAt: Timestamp

users/{uid}/history/{assessmentId}
        ...same fields + createdAt: Timestamp

shareCodes/{code}
        uid: string
        createdAt: Timestamp
```

Share codes are 8-character random strings. Firestore security rules restrict reads to the owner (uid matches auth.uid) except shareCodes which are publicly readable.

### Config

Firebase config in `src/environments/environment.ts` (and `.prod.ts`):
```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: '...',
    authDomain: '...',
    projectId: '...',
    storageBucket: '...',
    messagingSenderId: '...',
    appId: '...'
  }
};
```

## Files to create/modify

### New files
- `src/app/core/ports/auth.port.ts` — `AuthPort` interface + `User` type + injection token
- `src/app/core/ports/storage.port.ts` — `StoragePort` interface + `AssessmentData` type + injection token
- `src/app/core/adapters/firebase-auth.adapter.ts` — `FirebaseAuthAdapter`
- `src/app/core/adapters/firebase-storage.adapter.ts` — `FirebaseStorageAdapter`
- `src/app/core/adapters/local-storage.adapter.ts` — `LocalStorageAdapter` (wraps existing localStorage logic)
- `src/app/core/adapters/resilience.ts` — retry/timeout helper functions
- `src/environments/environment.ts` — Firebase config
- `src/environments/environment.prod.ts` — Firebase config (prod)

### Modified files
- `package.json` — add `firebase` dependency
- `src/app.component.ts` — inject `AuthPort`/`StoragePort`, wire save/load, prompt sign-up after results
- `src/app/features/assessment-panel/assessment-panel.component.ts` — use `StoragePort` instead of direct localStorage
- `src/app/features/results-panel/results-panel.component.ts` — use `StoragePort` for backup
- `src/app/features/synastry-panel/synastry-panel.component.ts` — use share codes in addition to file upload

## User flow

1. User opens app → `AuthService` signs in anonymously → uid assigned
2. User takes assessment → answers saved via `StoragePort.saveAssessment()` (Firestore if online, localStorage fallback)
3. Results generated → full results saved via `StoragePort.saveAssessment()`
4. User views universe → sign-up prompt appears ("Save your results permanently?")
5. User signs up (Google or email) → `linkAnonymousTo*()` converts account, data preserved
6. User returns later → auth state restored, `StoragePort.loadAssessment()` loads data
7. Synastry → user generates share code, partner enters code to load data

## Security rules (Firestore)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
      match /history/{assessmentId} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }
    // Share codes are readable by anyone authenticated, writable only by owner
    match /shareCodes/{code} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;
      allow delete: if request.auth != null && request.auth.uid == resource.data.uid;
    }
  }
}
```
