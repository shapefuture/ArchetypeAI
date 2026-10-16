import { describe, expect, it } from 'vitest';
import { clientMapRequest, decideClientMap, readableClientMaps, relationshipFor, type RosterClientLike } from './therapist-guard.ts';

const THERAPIST = 't1';
const linkedWithMap: RosterClientLike = { clientUid: 'c1', archived: false, summary: { headline: 'Constellation' } };
const bookingOnly: RosterClientLike = { clientUid: 'c2', archived: false, summary: null };
const archivedWithMap: RosterClientLike = { clientUid: 'c3', archived: true, summary: { headline: 'Old' } };

describe('therapist client-map gate (UI only; the server rules are the boundary)', () => {
  it('allows a linked client whose map was shared with the invite', () => {
    expect(decideClientMap({ therapistUid: THERAPIST, actorUid: THERAPIST, client: linkedWithMap })).toEqual({ allowed: true });
  });

  it('denies a booking-only link: booking never implies map access', () => {
    expect(decideClientMap({ therapistUid: THERAPIST, actorUid: THERAPIST, client: bookingOnly }))
      .toEqual({ allowed: false, reason: 'report-not-granted' });
  });

  it('denies an archived client even when a summary exists', () => {
    expect(decideClientMap({ therapistUid: THERAPIST, actorUid: THERAPIST, client: archivedWithMap }))
      .toEqual({ allowed: false, reason: 'archived' });
  });

  it('denies a revoked link when the caller has an explicit revoked signal', () => {
    expect(decideClientMap({ therapistUid: THERAPIST, actorUid: THERAPIST, client: linkedWithMap, revoked: true }))
      .toEqual({ allowed: false, reason: 'revoked' });
  });

  it('denies when there is no roster entry, which is how a removed link arrives', () => {
    expect(decideClientMap({ therapistUid: THERAPIST, actorUid: THERAPIST, client: null }))
      .toEqual({ allowed: false, reason: 'no-relationship' });
  });

  it('denies a session that is not the therapist on the roster', () => {
    expect(decideClientMap({ therapistUid: THERAPIST, actorUid: 'someone-else', client: linkedWithMap }))
      .toEqual({ allowed: false, reason: 'wrong-account' });
  });

  it('denies an anonymous session (empty actor uid)', () => {
    expect(decideClientMap({ therapistUid: THERAPIST, actorUid: '', client: linkedWithMap }).allowed).toBe(false);
  });

  it('maps roster state to a relationship without inventing a booking grant', () => {
    expect(relationshipFor(THERAPIST, linkedWithMap)).toEqual({
      therapistUid: THERAPIST, clientUid: 'c1', state: 'linked', grants: { booking: false, report: true },
    });
    expect(relationshipFor(THERAPIST, archivedWithMap)?.state).toBe('archived');
    expect(relationshipFor(THERAPIST, bookingOnly)?.grants.report).toBe(false);
    expect(relationshipFor(THERAPIST, linkedWithMap, { revoked: true })?.state).toBe('revoked');
    expect(relationshipFor(THERAPIST, null)).toBeNull();
  });

  it('builds a therapist read-client-map request', () => {
    expect(clientMapRequest({ therapistUid: THERAPIST, actorUid: THERAPIST, client: linkedWithMap })).toMatchObject({
      actorRole: 'therapist', action: 'read-client-map', actorUid: THERAPIST,
    });
  });

  it('keeps only readable maps, in order, for metrics and lists', () => {
    const readable = readableClientMaps(THERAPIST, THERAPIST, [bookingOnly, linkedWithMap, archivedWithMap]);
    expect(readable.map((client) => client.clientUid)).toEqual(['c1']);
    expect(readableClientMaps(THERAPIST, 'other', [linkedWithMap])).toEqual([]);
  });
});
