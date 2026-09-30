export interface ResilienceOptions {
  timeoutMs?: number;
  maxRetries?: number;
  baseDelayMs?: number;
}

const DEFAULT_OPTIONS: Required<ResilienceOptions> = {
  timeoutMs: 10000,
  maxRetries: 3,
  baseDelayMs: 100,
};

export async function withResilience<T>(
  fn: () => Promise<T>,
  options?: ResilienceOptions,
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  let lastError: unknown;
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Operation timed out')), opts.timeoutMs),
        ),
      ]);
    } catch (error) {
      lastError = error;
      if (attempt < opts.maxRetries) {
        const jitter = Math.random() * opts.baseDelayMs;
        const delay = opts.baseDelayMs * Math.pow(2, attempt) + jitter;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

// ============================================================================
// Layer-2 resilience shell (5-layer order: bulkhead → timeout → circuit →
// retry → fallback). Extends the legacy withResilience above without
// changing its behavior for existing callers (firebase-storage adapter).
// ============================================================================

/** CROSS-01: machine-readable metadata on every non-fresh/degraded result. */
export interface DegradationDescriptor {
  /** "timeout" | "circuit_open" | "all_retries_exhausted" | "fallback_adapter" | "cancelled" */
  source: string;
  reason: string;
  /** -1 when no prior success exists to age. */
  dataAgeSeconds: number;
  key: string;
  originalError: string;
}

/** Errors that must NOT be retried and must NOT trip the circuit. */
export class OperationCancelledError extends Error {
  readonly cancelled = true;
  constructor(message = 'Operation cancelled') { super(message); this.name = 'OperationCancelledError'; }
}

/** The offline adapter cannot perform this operation at all (no local model). */
export class AiOfflineError extends Error {
  constructor(message = 'AI offline') { super(message); this.name = 'AiOfflineError'; }
}

/** Classify failures: only transient faults earn a retry / circuit debit. */
export function isRetryableFailure(error: unknown): boolean {
  if (error instanceof OperationCancelledError) return false;
  const e = error as { name?: string; message?: string; status?: number };
  if (e?.name === 'AbortError') return false;
  if (typeof e?.status === 'number' && e.status >= 400 && e.status < 500) return false; // 4xx = our fault, not theirs
  if (/cancel|abort/i.test(e?.message ?? '')) return false;
  if (e instanceof AiOfflineError || e?.name === 'AiOfflineError') return false;
  return true; // network errors, timeouts, 5xx, unknown → transient until proven otherwise
}

/**
 * L3 circuit breaker. Opens after `failMax` consecutive retryable failures,
 * fast-fails for `cooldownMs`, then admits ONE half-open probe.
 * Caller cancellations never count (they say nothing about the dependency).
 */
export class CircuitBreaker {
  private failures = 0;
  private openedAt = 0;
  private halfOpenProbeInFlight = false;

  constructor(
    readonly failMax = 5,
    readonly cooldownMs = 60_000,
    readonly name = 'circuit',
  ) {}

  get open(): boolean {
    if (this.halfOpenProbeInFlight) return true; // exactly one probe at a time
    if (this.openedAt === 0) return false;
    return Date.now() - this.openedAt < this.cooldownMs;
  }

  /**
   * The gate for one operation attempt.
   *   closed            → admit
   *   open, cooling     → throw CircuitOpenError
   *   open, elapsed     → transition to half-open, admit exactly ONE probe
   *   probe in flight   → throw (no second concurrent probe)
   * The probe's outcome (onSuccess/onFailure) decides closed vs re-opened.
   */
  admit(): void {
    if (this.halfOpenProbeInFlight) throw new CircuitOpenError(this.name);
    if (this.openedAt === 0) return; // closed
    if (Date.now() - this.openedAt >= this.cooldownMs) {
      this.halfOpenProbeInFlight = true; // half-open: one probe
      this.openedAt = 0;
      return;
    }
    throw new CircuitOpenError(this.name);
  }

  onSuccess(): void {
    this.failures = 0;
    this.openedAt = 0;
    this.halfOpenProbeInFlight = false;
  }

  onFailure(): void {
    if (this.halfOpenProbeInFlight) {
      // the probe failed → re-open for another full cooldown
      this.halfOpenProbeInFlight = false;
      this.openedAt = Date.now();
      this.failures = 0;
      return;
    }
    this.failures++;
    if (this.failures >= this.failMax) {
      this.openedAt = Date.now();
      this.failures = 0;
    }
  }
}

export class CircuitOpenError extends Error {
  constructor(name: string) { super(`circuit ${name} open — failing fast`); this.name = 'CircuitOpenError'; }
}

/**
 * L1 bulkhead. BUG-02 invariant: the caller acquires the slot PER ATTEMPT —
 * never across the retry/backoff sequence — so backoff sleeps never hold a
 * slot while other operations queue.
 *
 * Sizing (AAA-03, Little's Law): N = rps × P99_seconds × 1.2. This app's AI
 * path is user-serialized (≈1 in-flight generation, bursts of 2–3), so
 * N = 3 covers the burst with headroom; the sync-thread `expected × 0.1`
 * heuristic would starve it.
 */
export class Bulkhead {
  private active = 0;
  private readonly waiters: Array<() => void> = [];

  constructor(readonly maxConcurrent = 3) {}

  async run<T>(op: () => Promise<T>): Promise<T> {
    if (this.active >= this.maxConcurrent) {
      await new Promise<void>(resolve => this.waiters.push(resolve));
    }
    this.active++;
    try {
      return await op();
    } finally {
      this.active--;
      this.waiters.shift()?.();
    }
  }
}

export interface ExecutorOptions {
  /** Per-attempt timeout (ms). */
  timeoutMs?: number;
  /** Retry attempts for retryable failures (0 = single attempt). */
  retries?: number;
  /** Base backoff (ms); actual = base × 2^attempt + jitter. */
  baseDelayMs?: number;
  /** Bulkhead width (Little's Law — see Bulkhead). */
  maxConcurrent?: number;
  /** AbortSignal passthrough — caller cancel bypasses everything. */
  signal?: AbortSignal;
}

export interface ExecutedResult<T> {
  value: T;
  /** Present iff the value came from a non-primary path (fallback/degraded). */
  degradation?: DegradationDescriptor;
}

/**
 * The full 5-layer shell for one named operation.
 * Order per attempt: bulkhead(timeout(circuit(op))) — retry loop OUTSIDE the
 * bulkhead (BUG-02). On exhaustion, `fallback` (if provided) produces the
 * degraded value; its descriptor is attached to the result (CROSS-01).
 */
export class ResilientExecutor {
  private readonly breaker: CircuitBreaker;
  private readonly bulkhead: Bulkhead;
  private readonly timeoutMs: number;
  private readonly retries: number;
  private readonly baseDelayMs: number;

  constructor(opts: ExecutorOptions & { name?: string; failMax?: number; cooldownMs?: number } = {}) {
    this.timeoutMs = opts.timeoutMs ?? 30_000;
    this.retries = opts.retries ?? 2;
    this.baseDelayMs = opts.baseDelayMs ?? 300;
    this.bulkhead = new Bulkhead(opts.maxConcurrent ?? 3);
    this.breaker = new CircuitBreaker(opts.failMax ?? 5, opts.cooldownMs ?? 60_000, opts.name ?? 'executor');
  }

  async call<T>(
    key: string,
    op: () => Promise<T>,
    fallback?: (reason: DegradationDescriptor) => Promise<T>,
    signal?: AbortSignal,
  ): Promise<ExecutedResult<T>> {
    const startedAt = Date.now();
    let lastError: unknown = 'unknown';
    let degradeSource = 'unknown';

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      if (signal?.aborted) throw new OperationCancelledError('caller cancelled');
      try {
        this.breaker.admit(); // fast-fail while open (does not consume bulkhead)
        const value = await this.bulkhead.run(async () => {
          if (signal?.aborted) throw new OperationCancelledError('caller cancelled');
          return await this.withTimeout(op());
        });
        this.breaker.onSuccess();
        return { value };
      } catch (error) {
        lastError = error;
        if (!isRetryableFailure(error)) {
          throw error; // caller cancel / 4xx: surface immediately, circuit untouched
        }
        this.breaker.onFailure();
        degradeSource = error instanceof CircuitOpenError ? 'circuit_open'
          : /timed? ?out/i.test(String((error as Error)?.message)) ? 'timeout'
          : 'all_retries_exhausted';
      }
      if (attempt < this.retries) {
        // BUG-02: sleep happens OUTSIDE the bulkhead — slot already released.
        const jitter = Math.random() * this.baseDelayMs;
        await new Promise(r => setTimeout(r, this.baseDelayMs * Math.pow(2, attempt) + jitter));
      }
    }

    if (fallback) {
      const value = await fallback({
        source: degradeSource,
        reason: 'primary_unavailable_serving_fallback',
        dataAgeSeconds: -1,
        key,
        originalError: String(lastError),
      });
      return {
        value,
        degradation: {
          source: degradeSource,
          reason: 'serving_fallback_adapter',
          dataAgeSeconds: -1,
          key,
          originalError: String(lastError),
        },
      };
    }
    throw lastError;
  }

  private withTimeout<T>(p: Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`operation timed out after ${this.timeoutMs}ms`)), this.timeoutMs);
      p.then(v => { clearTimeout(timer); resolve(v); },
             e => { clearTimeout(timer); reject(e); });
    });
  }
}
