# Cloudflare Deploy + Landing Header + Personal Cabinet (Plan)
Date: 2026-06-04  
POC: AdaL (agent)

## Goals (from user)
1) Deploy to Cloudflare Worker + static assets (SPA).
2) Landing page header must show:
   - **Login** button (for anonymous / signed-out)
   - **Dashboard / Cabinet** button (for signed-in, non-anonymous clients)
   - Same availability in mobile menu.
3) Remove the “jumpy scroll” hint (Scroll text + icon) from Hero.
4) Login action should open a **popup with both**:
   - Google OAuth
   - Email (sign in + create account)
5) “Personal cabinet” (client dashboard) with buttons:
   - See Universe
   - Assigned tasks (placeholder for now)
   - Track progress (assessment history list)
   - Do retests
   - View past synastries (list saved reports)

## Constraints / Current Architecture
- No Angular Router; navigation is controlled by `appState` in `AppComponent`.
- App signs in anonymously on load, so landing will usually see `currentUser != null` but `isAnonymous=true`.
- Firebase Storage Adapter supports:
  - `loadAssessment`, `loadHistory`, `saveSynastryConnection`, `saveSynastryReport`
  - No “list synastry reports” method yet → must add to `StoragePort` + Firebase adapter (and Local adapter).

## Proposed Implementation (minimal blast radius)
### A) Landing Header: Login/Dashboard + Mobile menu
Files:
- `src/app/features/landing/landing.component.html`
- `src/app/features/landing/landing.component.ts`

Changes:
- Add `@Input` (signal input) for auth state, e.g. `user: User | null` (or booleans).
- Add two outputs:
  - `(loginRequested)`
  - `(dashboardRequested)`
- Render a button in the header actions:
  - If `user && !user.isAnonymous`: **Dashboard**
  - Else: **Login**
- Add the same CTA to the mobile menu.

### B) Remove Hero Scroll Indicator
File:
- `src/app/features/landing/landing.component.html`

Change:
- Delete the block:
  - `<!-- Scroll indicator -->` (the animated “Scroll” text + mouse icon)

### C) Login Popup (Google + Email)
Files:
- `src/app.component.html`
- `src/app.component.ts`

Changes:
- Add `isLoginModalOpen` signal + `loginMode` state (optional).
- Modal contains:
  - Google button (uses existing resilient linking behavior when current user is anonymous)
  - Email form with:
    - “Sign in” -> `authPort.signInWithEmail(email, password)` (or link if anonymous)
    - “Create account” -> `authPort.signUpWithEmail(email, password)` (or link if anonymous)
- Reuse the existing `auth/credential-already-in-use` fallback behavior already implemented for Google in `signUpWithGoogle()`.

### D) Personal Cabinet (Client Dashboard)
Files (new):
- `src/app/features/cabinet/cabinet.component.ts`
- `src/app/features/cabinet/cabinet.component.html`
- `src/app/features/cabinet/cabinet.component.css` (optional)

Files (modified):
- `src/app.component.ts` (add state + handlers)
- `src/app.component.html` (add switch case)
- `src/app/core/ports/storage.port.ts` (extend interface)
- `src/app/core/adapters/firebase-storage.adapter.ts` (implement list queries)
- `src/app/core/adapters/local-storage.adapter.ts` (graceful degradation)

Cabinet UI (Phase 0 / deploy-ready):
- Header: “Personal Cabinet”
- Buttons:
  - **Open Universe** -> `appState='universe'` (calls existing enter flow)
  - **Retake test** -> `restartAssessment()`
  - **Assessment history** -> uses existing `loadHistory(uid)` (shows up to 20 entries with `createdAt/updatedAt`, scoringMethod)
  - **Past synastries** -> list last N saved synastry reports
  - **Assigned tasks** -> placeholder UI (“coming soon”)
- Access rules:
  - If user is anonymous: show “Please log in” CTA (opens login modal)

Storage additions:
- Extend `StoragePort` with:
  - `listSynastryReports(userId: string): Promise<SynastrySavedReportData[]>`
- Firebase implementation: query `collection(db, 'users', userId, 'synastry')` ordered by `updatedAt desc` limit N.
- Local implementation: read last report/draft from existing localStorage keys if present.

### E) Hook Landing Dashboard button to Cabinet
- In `AppComponent` template: pass `[user]="currentUser()"` to `<app-landing ...>`
- `(dashboardRequested)` switches to new `appState='cabinet'`
- When user already has completed assessment data, Cabinet becomes the “home” for existing clients.

## Testing / Verification
- Update/add unit tests minimally:
  - `app.component.spec.ts` to cover:
    - landing dashboard opens cabinet when user non-anon
    - login modal opens and calls auth port methods (mocked)
- Run:
  - `npm test`
  - `npm run build`

## Cloudflare Deploy
Prereq: Wrangler authenticated ✅ (user provided `wrangler whoami` output)

Deploy steps:
- `npm run build`
- `npx wrangler deploy`

## Approval Gate (user confirmation)
Reply “OK proceed” to authorize:
- Editing the above files
- Adding the new Cabinet component
- Extending StoragePort + adapters
- Running build/tests
- Deploying to Cloudflare via Wrangler
