import { beforeEach, describe, expect, it } from 'vitest';
import { ROUTE_KEYS } from './assessment-routes';
import { readLocalLegacy64Responses, writeLegacy64Draft } from './legacy64-responses';

const { responses: RESPONSE_KEY, index: INDEX_KEY } = ROUTE_KEYS.reflection64;

function storageError(name: string): Error {
  const error = new Error(name);
  error.name = name;
  return error;
}

const partial = (): number[] => Array.from({ length: 64 }, (_, i) => (i < 10 ? (i % 5) + 1 : 0));

beforeEach(() => localStorage.clear());

describe('verified 64-item draft saves', () => {
  it('reports saved only after both the answers and the position read back', () => {
    const answers = partial();
    expect(writeLegacy64Draft(answers, 10)).toMatchObject({ ok: true });
    expect(JSON.parse(localStorage.getItem(RESPONSE_KEY) ?? 'null')).toEqual(answers);
    expect(localStorage.getItem(INDEX_KEY)).toBe('10');
  });

  it('reports verify-failed when the store drops the write', () => {
    const dropping = { getItem: () => null, setItem: () => undefined } as unknown as Storage;
    expect(writeLegacy64Draft(partial(), 10, dropping)).toEqual({ ok: false, reason: 'verify-failed' });
  });

  it('reports verify-failed when only the answers persist', () => {
    const kept = new Map<string, string>();
    const halfway = {
      getItem: (key: string) => kept.get(key) ?? null,
      setItem: (key: string, value: string) => { if (key === RESPONSE_KEY) kept.set(key, value); },
    } as unknown as Storage;
    expect(writeLegacy64Draft(partial(), 10, halfway)).toEqual({ ok: false, reason: 'verify-failed' });
  });

  it('maps quota, blocked and other storage errors to distinct reasons', () => {
    const failing = (error: Error) => ({ getItem: () => null, setItem: () => { throw error; } } as unknown as Storage);
    expect(writeLegacy64Draft(partial(), 10, failing(storageError('QuotaExceededError')))).toEqual({ ok: false, reason: 'quota' });
    expect(writeLegacy64Draft(partial(), 10, failing(storageError('SecurityError')))).toEqual({ ok: false, reason: 'blocked' });
    expect(writeLegacy64Draft(partial(), 10, failing(storageError('InvalidStateError')))).toEqual({ ok: false, reason: 'unavailable' });
  });

  it('does not treat an in-progress draft as a complete response set', () => {
    writeLegacy64Draft(partial(), 10);
    expect(readLocalLegacy64Responses()).toBeNull();
    const complete = Array.from({ length: 64 }, (_, i) => (i % 5) + 1);
    writeLegacy64Draft(complete, 63);
    expect(readLocalLegacy64Responses()).toEqual(complete);
  });
});
