// Round 32 probe (critic). Hours saved before zones existed carry no timeZone. getTherapistProfile (booking.ts) reads them
// through normalizeAvailability with the READER's device zone, which stamps timeZone and zoneFallback: true. The client's
// booking path (findTherapist, overlays.jsx) used therapistTimeZone(), which ignores zoneFallback, so a legacy therapist
// looked zone-confirmed, the "time zone not confirmed" warning could not fire, and the client's own zone became the zone
// the slots and the stored `start` were written in.
// Fixed: the booking path reads bookingTimeZone(), which returns null while any window is a fallback. The device-zone
// fallback itself is unchanged (booking.spec.ts pins it), so the therapist's own screen keeps its behaviour.
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { snapshot } = vi.hoisted(() => ({ snapshot: { value: null as null | { exists: () => boolean; data: () => unknown; id: string } } }));

vi.mock('../../environments/firebase-init', () => ({ getFirestoreDb: () => ({}) }));
// Only the Firestore reads getTherapistProfile performs are stubbed: they return the stored therapist document as-is.
vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, ...path: string[]) => ({ path: path.join('/') }),
  getDoc: async () => snapshot.value,
  collection: () => ({}),
  getDocs: async () => ({ docs: [] }),
  query: () => ({}),
  where: () => ({}),
  runTransaction: async () => undefined,
  setDoc: async () => undefined,
  writeBatch: () => ({ set: () => undefined, commit: async () => undefined }),
}));

import { getTherapistProfile, therapistTimeZone, bookingTimeZone, normalizeAvailability } from './booking';

const LEGACY_HOURS = [{ days: [1, 2, 3, 4, 5], start: '09:00', end: '17:00', minutes: 60 }];

function storedTherapist(availability: unknown) {
  snapshot.value = { exists: () => true, data: () => ({ email: 'therapist@example.com', availability }), id: 'uid_therapist' };
}

describe('round32: legacy therapist hours never become a confirmed booking zone', () => {
  beforeEach(() => { snapshot.value = null; });

  it('control: hours saved with a zone are confirmed to that zone', async () => {
    storedTherapist([{ ...LEGACY_HOURS[0], timeZone: 'Europe/Berlin' }]);
    const profile = await getTherapistProfile('uid_therapist');
    expect(therapistTimeZone(profile!.availability)).toBe('Europe/Berlin');
  });

  it('control: normalizing legacy hours with no fallback leaves them unconfirmed', () => {
    expect(therapistTimeZone(normalizeAvailability(LEGACY_HOURS, null))).toBeNull();
  });

  it('the booking path must not treat a reader-supplied legacy zone as the therapist zone', async () => {
    storedTherapist(LEGACY_HOURS);
    const profile = await getTherapistProfile('uid_therapist');
    // The window is marked as a fallback, so the code knows the zone is not the therapist's.
    expect(profile!.availability[0].zoneFallback).toBe(true);
    // findTherapist (overlays.jsx) uses bookingTimeZone to decide whether to warn and refuse; it must be null here.
    expect(bookingTimeZone(profile!.availability)).toBeNull();
  });
});
