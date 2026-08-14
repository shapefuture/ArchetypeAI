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
