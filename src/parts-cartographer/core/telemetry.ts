// core/telemetry.ts — anonymized item distributions, local-only, fire-and-forget (draft: core/data/telemetry.ts)
import { store, KEYS } from './local-store';

type Dist = Record<string, number>;

export const telemetry = {
  record(itemId: string, value: number | string) {
    try {
      const all = store.load<Record<string, Dist>>(KEYS.telemetry, {});
      const d = (all[itemId] ??= {});
      const k = String(value);
      d[k] = (d[k] ?? 0) + 1;
      store.save(KEYS.telemetry, all); // local-only; sync is fire-and-forget no-op in this build
    } catch { /* never blocks the user */ }
  },
  dump(): Record<string, Dist> {
    return store.load(KEYS.telemetry, {});
  },
  count(): number {
    const d = telemetry.dump();
    return Object.values(d).reduce((a, b) => a + Object.values(b).reduce((x, y) => x + y, 0), 0);
  },
  clear() { store.remove(KEYS.telemetry); },
};
