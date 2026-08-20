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
