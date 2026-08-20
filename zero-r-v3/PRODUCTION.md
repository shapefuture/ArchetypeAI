# Production handoff

## Hard architecture rules

1. Domain imports nothing from browser/framework/infrastructure.
2. Application imports only domain + ports.
3. Adapters implement ports and may import external technologies.
4. Experimental frameworks stay behind adapters/feature flags.
5. Network never sits on the normal interaction critical path.
6. Irreversible effects are never speculated.
7. Every adapter has a contract test before promotion.

## Current production adapter set

- Scene: DOM
- Render: Canvas + CSS compositor
- Compute: Rust/WASM with TypeScript fallback
- Storage: IndexedDB
- Prediction: local static + route prior
- Sync: offline queue

## Upgrade path

- Qwik adapter for resumability benchmark
- Solid adapter for fine-grained island benchmark
- Astro shell adapter for server-rendered/static content
- OPFS/SQLite storage adapters
- WebTransport sync adapter
- WebGPU renderer
- population prior adapter

Do not promote an experimental adapter without benchmark evidence.
