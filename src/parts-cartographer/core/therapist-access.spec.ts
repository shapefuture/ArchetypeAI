import { describe, expect, it } from 'vitest';
import { decideAccess, setGrant, setLinkState, type Relationship } from './therapist-access.ts';

const linked: Relationship = { therapistUid: 't1', clientUid: 'c1', state: 'linked', grants: { booking: true, report: false } };

describe('therapist-client access', () => {
  it('denies a request from a different account, whichever role it claims', () => {
    expect(decideAccess({ actorUid: 'c2', actorRole: 'client', action: 'book', relationship: linked }))
      .toEqual({ allowed: false, reason: 'wrong-account' });
    expect(decideAccess({ actorUid: 'c1', actorRole: 'therapist', action: 'read-client-map', relationship: linked }))
      .toEqual({ allowed: false, reason: 'wrong-account' });
  });

  it('denies every client action once the link is revoked or archived', () => {
    for (const state of ['revoked', 'archived'] as const) {
      const ended = setLinkState(linked, state);
      expect(decideAccess({ actorUid: 'c1', actorRole: 'client', action: 'book', relationship: ended }))
        .toEqual({ allowed: false, reason: state });
    }
  });

  it('lets a booking grant book, but never read the report', () => {
    expect(decideAccess({ actorUid: 'c1', actorRole: 'client', action: 'book', relationship: linked })).toEqual({ allowed: true });
    expect(decideAccess({ actorUid: 't1', actorRole: 'therapist', action: 'read-client-map', relationship: linked }))
      .toEqual({ allowed: false, reason: 'report-not-granted' });
  });

  it('lets a client read their own report and a therapist read it only with the report grant', () => {
    expect(decideAccess({ actorUid: 'c1', actorRole: 'client', action: 'read-report', relationship: linked })).toEqual({ allowed: true });
    expect(decideAccess({ actorUid: 't1', actorRole: 'therapist', action: 'read-report', relationship: linked }))
      .toEqual({ allowed: false, reason: 'report-not-granted' });
    const withReport = setGrant(linked, 'client', 'report', true);
    if (!withReport) throw new Error('setup failed');
    expect(decideAccess({ actorUid: 't1', actorRole: 'therapist', action: 'read-report', relationship: withReport })).toEqual({ allowed: true });
  });

  it('gives the therapist a read-only client map only with an explicit report grant', () => {
    const withReport = setGrant(linked, 'client', 'report', true);
    expect(withReport).not.toBeNull();
    if (!withReport) return;
    expect(decideAccess({ actorUid: 't1', actorRole: 'therapist', action: 'read-client-map', relationship: withReport })).toEqual({ allowed: true });
    expect(decideAccess({ actorUid: 't1', actorRole: 'therapist', action: 'edit-client-map', relationship: withReport }))
      .toEqual({ allowed: false, reason: 'read-only' });
  });

  it('lets only the client change grants, and never mutates the relationship it was given', () => {
    expect(setGrant(linked, 'therapist', 'report', true)).toBeNull();
    const changed = setGrant(linked, 'client', 'report', true);
    expect(linked.grants.report).toBe(false);
    expect(changed?.grants.report).toBe(true);
  });

  it('keeps the therapist profile independent of any client link', () => {
    expect(decideAccess({ actorUid: 't1', actorRole: 'therapist', action: 'edit-therapist-profile', relationship: setLinkState(linked, 'revoked') }))
      .toEqual({ allowed: true });
    expect(decideAccess({ actorUid: 'c1', actorRole: 'client', action: 'edit-therapist-profile', relationship: linked }))
      .toEqual({ allowed: false, reason: 'not-owner' });
  });

  it('denies everything when there is no relationship', () => {
    expect(decideAccess({ actorUid: 'c1', actorRole: 'client', action: 'book', relationship: null }))
      .toEqual({ allowed: false, reason: 'no-relationship' });
  });
});
