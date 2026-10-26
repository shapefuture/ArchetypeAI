import { describe, expect, it } from 'vitest';
import { clientMapRequest, decideClientMap, readableClientMaps, relationshipFor, visibleAppointments, type RosterClientLike } from './therapist-guard.ts';

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

describe('visibleAppointments', () => {
  const appt = (id: string, clientUid: string) => ({ id, clientUid, start: '2026-10-20T10:00', status: 'pending' });

  it('keeps appointments of linked clients, including booking-only clients, in their original order', () => {
    const appointments = [appt('a1', 'c2'), appt('a2', 'c1'), appt('a3', 'c2')];
    expect(visibleAppointments(appointments, [bookingOnly, linkedWithMap]).map((a) => a.id)).toEqual(['a1', 'a2', 'a3']);
  });

  it('hides approved appointments of archived clients and of clients not on the roster', () => {
    const approved = (id: string, clientUid: string) => ({ ...appt(id, clientUid), status: 'approved' });
    const appointments = [appt('a1', 'c1'), approved('a2', 'c3'), approved('a3', 'stranger')];
    expect(visibleAppointments(appointments, [linkedWithMap, archivedWithMap]).map((a) => a.id)).toEqual(['a1']);
  });

  it('always shows a pending request, so it can be approved or declined, whatever the roster says', () => {
    const appointments = [appt('a2', 'c3'), appt('a3', 'stranger')];
    expect(visibleAppointments(appointments, [archivedWithMap]).map((a) => a.id)).toEqual(['a2', 'a3']);
  });

  it('shows nothing with an empty roster or no appointments', () => {
    expect(visibleAppointments([{ ...appt('a1', 'c1'), status: 'approved' }], [])).toEqual([]);
    expect(visibleAppointments([], [linkedWithMap])).toEqual([]);
  });
});
