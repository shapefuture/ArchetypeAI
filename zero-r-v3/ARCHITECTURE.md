# ZERO-R V3.1 Architecture

```
External adapters
      ↓
Ports / contracts
      ↓
Application Core
      ↓
Domain
```

The domain is deterministic. The application coordinator commits local state synchronously, then persists, synchronizes and materializes futures asynchronously. This is deliberate: IndexedDB, network and prediction can never delay the user's immediate visual response.

## Parallel team boundaries
- Domain team owns domain only.
- Future team owns predictor/scheduler.
- UI team owns ScenePort implementations.
- Rendering team owns RenderPort implementations.
- Runtime team owns ComputePort/WASM.
- Storage team owns StoragePort.
- Edge team owns SyncPort/Cloudflare.
- Performance team owns telemetry and benchmarks.

All changes meet the port contract before integration.

## Character rendering (a RenderPort implementation)

`src/adapters/render/felt.ts` is a RenderPort like any other: it is handed a DOM node
and a part, and it decides how that part looks. The rules it follows:

1. **One source of geometry.** `buildData()` returns pieces *and* a flat draw record
   from the same build. 2D serialises the record to SVG; 3D assembles the pieces into
   meshes. They cannot drift apart.
2. **Determinism.** DNA comes from the part id (seed), its category (role, axes, felt
   palette) and its activation (size). Same part, same doll, every reload.
3. **Off the critical path.** Sewing happens in a worker; the main thread only ever
   receives an SVG string or transferred vertex buffers. Without workers, the identical
   engine runs in idle slices with an 8ms budget.
4. **Tier-aware.** `standard` drops the turntable and the hero LOD; `prefers-reduced-motion`
   draws the doll once and holds it still.

The engine lives outside `src/` (`../../felt-atelier/src`), so TypeScript sees it as a
declared contract (`src/types/felt-atelier.d.ts`) and the bundler resolves the real
modules (`scripts/bundle.mjs`).
