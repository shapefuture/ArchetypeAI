# ArchetypeAI

Parts Cartographer is the default React/Vite experience. It replaces the previous Angular shell while keeping the Angular app and its existing features available as a separate run/build target. Both frontends use the Cloudflare Worker in `worker.ts` for AI and Stripe routes.

## React app (default)

**Prerequisite:** Node.js 20.19+ or 22.12+

```bash
npm install
npm run dev
```

Vite listens on port `5174`. During local development, relative `/api/*` requests go through Vite's Worker proxy; production builds call the deployed ArchetypeAI Worker origin (override with `VITE_WORKER_ORIGIN` if needed). The app is local-first: parts, assessment drafts, and journal data stay in this browser unless the user exports or shares them. Firebase Auth provides anonymous, Google, and email sign-in; AI requests use the Worker with deterministic offline fallbacks; checkout is hosted by Stripe and only becomes active after Worker verification.

The 3D Universe lazily loads Three.js and uses the same plush `Character` artwork as the 2D screens, on shape-matched extruded bodies.

## Existing Angular app

The Angular sources remain in `src/app/` and can be run independently:

```bash
npm run dev:angular
npm run build:angular
npm run preview:angular
```

## Cloudflare Worker

`worker.ts` serves the `/api/ai`, `/api/stripe-checkout`, and `/api/stripe-verify` routes. AI and billing calls require a Firebase ID token; both the React and Angular clients attach one. The Worker verifies the token against `FIREBASE_PROJECT_ID`, applies Cloudflare rate limits, and does not log prompt or response content. Stripe return URLs must match the server-side `ALLOWED_APP_ORIGINS` list in `wrangler.toml`; add any production custom domain there before deploying.

Configure Worker secrets with `wrangler secret put`:

```text
GOOGLE_API_KEY
OPENROUTER_API_KEY
NVIDIA_API_KEY
OLLAMA_API_KEY
STRIPE_SECRET_KEY
STRIPE_PRICE_ID
```

AI provider keys must be set for cloud AI; the React client falls back locally if the Worker or providers are unavailable. Stripe secrets are only needed for paid checkout. `FIREBASE_PROJECT_ID` and the rate-limit bindings are non-secret Worker configuration in `wrangler.toml`. Never put secret values in frontend environment files.

Firestore admin access is limited to users with a verified Firebase email that is either the bootstrap account (`admin@example.com`) or present in `adminAllowlist`. The bootstrap account may manage the allowlist; normal users cannot grant themselves admin access. Confirm the intended bootstrap email before deploying the rules.

## Build, preview, and tests

```bash
npm run build
npm run preview
npm test
npm run test:rules
```

`npm run test:rules` starts the Firestore emulator and executes the security-rules regression suite; a local Java runtime is required. The default build creates the React PWA in `dist/`, stamps the service worker, and copies Cloudflare response headers. `npm run build:angular` remains available for the retained Angular app. GitHub Actions runs the type-check, unit and emulator tests, and both production builds.
