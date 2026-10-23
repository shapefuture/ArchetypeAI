/**
 * Write-behind localStorage — zero-r-v3's "background plane" for persistence.
 *
 * localStorage.setItem is SYNCHRONOUS main-thread IO: on mobile Safari with a
 * full storage bucket it costs multiple ms per call, and the app used to pay
 * it in the middle of taps/answers/navigation (the interaction critical path).
 *
 * Contract:
 *   - localStore.set(key, value) never writes synchronously. The value is
 *     captured immediately (stringified), then coalesced per key and flushed
 *     on the next idle slot — so rapid successive writes to the same key
 *     (slider drags, typing, check-in notes) collapse into ONE disk write.
 *   - Reads stay direct localStorage reads (fresh by construction: a read
 *     after a pending write of the same key flushes that key first).
 *   - flushNow() on visibilitychange→hidden / pagehide guarantees durability;
 *     the pagehide path is a synchronous fallback (the last legal moment).
 */

interface PendingWrite { key: string; value: string; }

const pending = new Map<string, string>();
let scheduled = false;

function rawGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

function writeNow(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* storage unavailable/full */ }
}

function flush(): void {
  scheduled = false;
  for (const [key, value] of pending) writeNow(key, value);
  pending.clear();
}

function schedule(): void {
  if (scheduled) return;
  scheduled = true;
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
  if (typeof idle === 'function') {
    idle(() => flush(), { timeout: 1500 }); // hard deadline: never lose a write for long
  } else {
    setTimeout(flush, 0);
  }
}

/** Queue a JSON write off the critical path (coalesced per key). */
export function localSet(key: string, value: unknown): void {
  pending.set(key, JSON.stringify(value));
  schedule();
}

/** Read-through: flushes any pending write for this key first, then reads. */
export function localGet<T>(key: string, fallback: T): T {
  if (pending.has(key)) {
    writeNow(key, pending.get(key)!);
    pending.delete(key);
  }
  const raw = rawGet(key);
  if (raw === null) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

/** Remove a key outright: cancels any pending write, then removes from disk. */
export function localRemove(key: string): void {
  pending.delete(key);
  try { localStorage.removeItem(key); } catch { /* unavailable */ }
}

/** TEST ONLY: drop the pending queue (specs clear() localStorage between tests). */
export function resetLocalQueueForTests(): void {
  pending.clear();
  scheduled = false;
}

/** Force all pending writes to disk NOW (hidden/pagehide, or before export). */
export function flushLocal(): void {
  if (scheduled) {
    (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(-1);
  }
  flush();
}

// Durability hooks — installed once, passively.
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
  window.addEventListener('pagehide', () => flush(), { capture: true });
}

// --- sync conveniences for keys consumed as raw strings ---
export function localSetRaw(key: string, value: string): void {
  pending.set(key, JSON.stringify(value));
  schedule();
}

export function localGetRaw(key: string): string | null {
  const raw = pending.has(key) ? pending.get(key)! : rawGet(key);
  if (raw === null) return null;
  try { return JSON.parse(raw) as string; } catch { return raw; }
}
