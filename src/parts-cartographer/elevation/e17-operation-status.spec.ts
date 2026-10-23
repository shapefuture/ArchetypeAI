import { describe, expect, it } from 'vitest';
import type { Relationship } from '../core/therapist-access';
import { decideAccess } from '../core/therapist-access';
import {
  accessAfterRevoke, canWrite, evidenceOf, persistAck, precheckBooking, reducePersist, reduceRequest,
  requestAck, resolveRead, revokeAck, verifyWrite, type PersistState, type RequestState,
} from './e17-operation-status';

const start = (requestId: string, now = 0, extra: { effect?: 'read' | 'idempotent-write' | 'non-idempotent-write'; key?: string | null; online?: boolean } = {}) =>
  reduceRequest({ status: 'idle' }, { type: 'start', requestId, effect: extra.effect ?? 'read', key: extra.key ?? null, online: extra.online ?? true, now }).state;

const relationship: Relationship = { therapistUid: 't1', clientUid: 'c1', state: 'linked', grants: { booking: true, report: true } };

describe('E17 request state machine (step 04)', () => {
  it('retries a read with exponential backoff capped by maxDelayMs and stops at maxAttempts', () => {
    let s: RequestState = start('r1', 1000);
    s = reduceRequest(s, { type: 'attemptFailed', requestId: 'r1', failure: 'unavailable', now: 1100 }).state;
    expect(s).toMatchObject({ status: 'backoff', attempt: 1, retryAt: 1600 });
    expect(reduceRequest(s, { type: 'retryDue', requestId: 'r1', now: 1500 }).ignored).toBe('too-early');
    s = reduceRequest(s, { type: 'retryDue', requestId: 'r1', now: 1600 }).state;
    expect(s).toMatchObject({ status: 'pending', attempt: 2 });
    s = reduceRequest(s, { type: 'attemptFailed', requestId: 'r1', failure: 'unavailable', now: 1700 }).state;
    expect(s).toMatchObject({ status: 'backoff', attempt: 2, retryAt: 2700 });
    s = reduceRequest(s, { type: 'retryDue', requestId: 'r1', now: 2700 }).state;
    s = reduceRequest(s, { type: 'attemptFailed', requestId: 'r1', failure: 'unavailable', now: 2800 }).state;
    expect(s).toMatchObject({ status: 'failed', failure: 'unavailable', retry: 'user' });

    const capped = { maxAttempts: 5, baseDelayMs: 500, maxDelayMs: 1200, attemptBudgetMs: 15000 };
    let c: RequestState = start('r2', 0);
    for (let i = 0; i < 3; i++) {
      c = reduceRequest(c, { type: 'attemptFailed', requestId: 'r2', failure: 'timeout', now: 0 }, capped).state;
      c = reduceRequest(c, { type: 'retryDue', requestId: 'r2', now: 1_000_000 }, capped).state;
    }
    expect(c).toMatchObject({ status: 'pending', attempt: 4 });
    expect(reduceRequest(start('r3', 0), { type: 'attemptFailed', requestId: 'r3', failure: 'timeout', now: 0 }, capped).state)
      .toMatchObject({ status: 'backoff', retryAt: 500 });
  });

  it('an ambiguous timeout of a non-idempotent write without a key becomes unknown and is never re-sent', () => {
    const pending = start('b1', 0, { effect: 'non-idempotent-write', key: null });
    expect(reduceRequest(pending, { type: 'tick', now: 14_999 }).state.status).toBe('pending');
    const unknown = reduceRequest(pending, { type: 'tick', now: 15_000 }).state;
    expect(unknown).toMatchObject({ status: 'unknown', effect: 'non-idempotent-write' });
    expect(reduceRequest(unknown, { type: 'retryDue', requestId: 'b1', now: 999_999 })).toMatchObject({ ignored: 'not-in-flight' });
    expect(requestAck(unknown)).toBe('checking');
    expect(reduceRequest(unknown, { type: 'reconciled', requestId: 'b1', found: false }).state)
      .toMatchObject({ status: 'failed', failure: 'timeout', retry: 'user' });
    expect(reduceRequest(unknown, { type: 'reconciled', requestId: 'b1', found: true }).state)
      .toMatchObject({ status: 'confirmed', basis: 'server-response', duplicate: false });
  });

  it('an ambiguous write with an idempotency key retries with the same key', () => {
    let s = start('k1', 0, { effect: 'non-idempotent-write', key: 'booking-key-1' });
    s = reduceRequest(s, { type: 'attemptFailed', requestId: 'k1', failure: 'timeout', now: 100 }).state;
    expect(s).toMatchObject({ status: 'backoff', key: 'booking-key-1' });
    s = reduceRequest(s, { type: 'retryDue', requestId: 'k1', now: 600 }).state;
    expect(s).toMatchObject({ status: 'pending', key: 'booking-key-1', attempt: 2 });
  });

  it('recovers a duplicate booking: the same key returns the existing confirmation, not a second booking', () => {
    const pre = precheckBooking({ start: '2026-11-02T10:00', end: '2026-11-02T11:00', key: 'k-9', busy: [], confirmedKeys: ['k-9'] });
    expect(pre.verdict).toBe('duplicate-of-confirmed');
    const s = reduceRequest(start('bk', 0, { effect: 'non-idempotent-write', key: 'k-9' }), { type: 'succeeded', requestId: 'bk', basis: 'server-response', duplicate: true }).state;
    expect(requestAck(s)).toBe('already-confirmed');
  });

  it('recovers a competing booking: a clash is a conflict, a declined slot is released, and a server conflict never auto-retries', () => {
    const busy = [{ start: '2026-11-02T10:00', end: '2026-11-02T11:00', status: 'approved' }];
    const request = { start: '2026-11-02T10:30', end: '2026-11-02T11:30', key: 'k-2', confirmedKeys: [] };
    expect(precheckBooking({ ...request, busy }).verdict).toBe('conflict');
    expect(precheckBooking({ ...request, busy: [{ ...busy[0], status: 'declined' }] }).verdict).toBe('proceed');
    const s = reduceRequest(start('c1', 0, { effect: 'non-idempotent-write', key: 'k-2' }), { type: 'attemptFailed', requestId: 'c1', failure: 'conflict', now: 5 }).state;
    expect(s).toMatchObject({ status: 'failed', failure: 'conflict', retry: 'none' });
    expect(requestAck(s)).toBe('not-completed');
  });

  it('recovers a late coach reply after cancel: the reply is ignored and never shown', () => {
    const cancelled = reduceRequest(start('coach-7'), { type: 'cancel', requestId: 'coach-7' }).state;
    const late = reduceRequest(cancelled, { type: 'succeeded', requestId: 'coach-7', basis: 'server-response' });
    expect(late.ignored).toBe('not-in-flight');
    expect(late.state.status).toBe('cancelled');
    expect(requestAck(late.state)).toBe('cancelled');
  });

  it('recovers a superseded request: a reply to the earlier request id is stale and the newer request stays pending', () => {
    const second = reduceRequest(start('coach-1'), { type: 'start', requestId: 'coach-2', effect: 'read', online: true, now: 10 }).state;
    const late = reduceRequest(second, { type: 'succeeded', requestId: 'coach-1', basis: 'server-response' });
    expect(late.ignored).toBe('stale');
    expect(late.state).toMatchObject({ status: 'pending', requestId: 'coach-2' });
  });

  it('recovers quota and verify failures: the draft is kept, and a save is acknowledged only after a matching read-back', () => {
    const draft = 'I noticed a tightness in my chest';
    let s: PersistState = reducePersist({ status: 'clean' }, { type: 'edit', draft }).state;
    s = reducePersist(s, { type: 'saveStart' }).state;
    const quota = Object.assign(new Error('storage full'), { name: 'QuotaExceededError' });
    s = reducePersist(s, { type: 'saveResult', outcome: verifyWrite({ expected: draft, readBack: null, error: quota }), now: 5 }).state;
    expect(s).toMatchObject({ status: 'failed', reason: 'quota', draft });
    expect(persistAck(s)).toBe('not-saved');
    expect(verifyWrite({ expected: 'a', readBack: 'b' })).toEqual({ ok: false, reason: 'verify-failed' });
    s = reducePersist(s, { type: 'saveStart' }).state;
    s = reducePersist(s, { type: 'saveResult', outcome: verifyWrite({ expected: draft, readBack: draft }), now: 9 }).state;
    expect(s).toEqual({ status: 'saved', draft, savedAt: 9 });
    expect(persistAck(s)).toBe('saved-on-device');
  });

  it('an edit made during a save marks the draft dirty and ignores the stale save result', () => {
    let s = reducePersist({ status: 'clean' }, { type: 'edit', draft: 'a' }).state;
    s = reducePersist(s, { type: 'saveStart' }).state;
    s = reducePersist(s, { type: 'edit', draft: 'ab' }).state;
    const late = reducePersist(s, { type: 'saveResult', outcome: { ok: true }, now: 3 });
    expect(late.ignored).toBe('not-in-flight');
    expect(late.state).toEqual({ status: 'dirty', draft: 'ab' });
    expect(persistAck(late.state)).toBe('not-saved');
  });

  it('recovers offline: a request started offline fails with no attempt, and an offline read is labelled local-offline', () => {
    const s = start('off-1', 0, { online: false });
    expect(s).toEqual({ status: 'failed', requestId: 'off-1', failure: 'offline', retry: 'when-online' });
    expect(resolveRead({ online: false, remote: 'not-attempted', hasLocal: true })).toEqual({ source: 'local', freshness: 'local-offline' });
    expect(resolveRead({ online: true, remote: 'failed', hasLocal: true })).toEqual({ source: 'local', freshness: 'local-unverified' });
    expect(resolveRead({ online: false, remote: 'not-attempted', hasLocal: false })).toEqual({ source: 'none', freshness: 'unavailable' });
  });

  it('recovers a revoked grant: server-confirmed and local-only revocations acknowledge different authority, and access is denied after revoke', () => {
    expect(revokeAck({ remote: 'confirmed', localRemoved: true })).toEqual({ code: 'server-revoked', copiesMayRemain: true });
    expect(revokeAck({ remote: 'unknown', localRemoved: true })).toEqual({ code: 'removed-on-device', copiesMayRemain: true });
    expect(revokeAck({ remote: 'failed', localRemoved: false }).code).toBe('not-revoked');
    expect(decideAccess({ actorUid: 'c1', actorRole: 'client', action: 'book', relationship }).allowed).toBe(true);
    expect(accessAfterRevoke(relationship, 'client', 'book')).toEqual({ allowed: false, reason: 'revoked' });
  });

  it('recovers expired or rejected access without retrying', () => {
    for (const failure of ['expired', 'revoked', 'rejected'] as const) {
      const s = reduceRequest(start('x-1'), { type: 'attemptFailed', requestId: 'x-1', failure, now: 1 }).state;
      expect(s).toMatchObject({ status: 'failed', failure, retry: 'none' });
    }
  });

  it('recovers a restored renderer: a late loader result from before the restore is ignored', () => {
    const loading = start('renderer-1');
    const restored = reduceRequest(loading, { type: 'cancel', requestId: 'renderer-1' }).state;
    const late = reduceRequest(restored, { type: 'succeeded', requestId: 'renderer-1', basis: 'local-load' });
    expect(late).toMatchObject({ ignored: 'not-in-flight', state: { status: 'cancelled' } });
    const fresh = reduceRequest(restored, { type: 'start', requestId: 'renderer-2', effect: 'read', online: true, now: 0 }).state;
    expect(reduceRequest(fresh, { type: 'succeeded', requestId: 'renderer-1', basis: 'local-load' }).ignored).toBe('stale');
    expect(requestAck(reduceRequest(fresh, { type: 'succeeded', requestId: 'renderer-2', basis: 'local-load' }).state)).toBe('loaded-on-device');
  });

  it('tags evidence: coach replies are hypotheses, drafts are user authorship, and canonical scores are read-only', () => {
    expect(evidenceOf('coach-reply')).toBe('hypothesis');
    expect(evidenceOf('draft')).toBe('user-authorship');
    expect(evidenceOf('booking')).toBe('observation');
    expect(evidenceOf('canonical-score')).toBe('canonical-measurement');
    expect(canWrite('canonical-score')).toBe(false);
    expect(canWrite('draft')).toBe(true);
  });
});
