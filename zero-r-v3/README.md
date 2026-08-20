# ZERO-R Parts Map V3.1

Production-first, framework-independent temporal PWA runtime.

## Architecture

- Domain: deterministic state + transitions + futures
- Ports: UI, prediction, scheduling, storage, compute, render, sync, telemetry, capabilities
- Adapters: DOM, Canvas, IndexedDB, static prediction, Rust/WASM, offline sync
- Runtime: ExperienceCoordinator + economic Future Scheduler
- PWA: service worker + install manifest + offline core
- Visual: persistent scene deck + CSS compositor + ambient canvas

Frameworks such as Astro, Qwik, Solid and React are intentionally not required by the production runtime. They can be added later as UI adapters without modifying domain/application code.

## Run locally

1. Install Node.js 20+.
2. Run `tsc` or `npm run build`.
3. Serve `dist/` with an HTTP server.
4. Open it in Chrome/Safari mobile and install.

`npm test` runs the dependency-free architecture smoke suite. `npm run build` requires a TypeScript compiler on PATH.
