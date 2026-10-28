// Round 28 probe (critic), emulator + the real createBooking() (client), linkedClients() and therapistAppointments() (therapist),
// and visibleAppointments() (the dashboard's appointment filter, core/therapist-guard.ts).
// A therapist who archives a client keeps that client's roster row archived. When the client books again, createBooking
// merges into the same roster row and leaves `archived` as it is (rules: the booking branch of therapistClients update
// keeps every field it does not name). The dashboard then hides every appointment of an archived client, so the new
// pending request is listed nowhere: not in the appointments tab, not in the pending count, and it has no approve or
// decline button. The request keeps the slot locked (therapistBusySlots) until the client cancels it.
// Expected: the therapist can see the new pending request. Observed on b37e5f0: it is filtered out.
// Control: the same booking for a client that was not archived is shown.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, type Firestore } from 'firebase/firestore';

const { state } = vi.hoisted(() => ({ state: { db: null as unknown } }));
vi.mock('../../environments/firebase-init', () => ({ getFirestoreDb: () => state.db }));

import { createBooking, therapistAppointments } from './booking';
import { linkedClients, revokeTherapistAccess } from './therapist-link';
import { visibleAppointments } from './therapist-guard';

const RULES = readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8');
const EMULATOR = !!process.env.FIRESTORE_EMULATOR_HOST;
const T = 'uid_therapist_arch';
const TEMAIL = 'therapist-arch@example.com';
const C = 'uid_client_arch';
const CEMAIL = 'client-arch@example.com';
const K = 'uid_client_ctrl';
const KEMAIL = 'client-ctrl@example.com';
const CREATED = '2026-10-20T10:00:00.000Z';

/** A slot `days` out, in the therapist's wall clock, one hour long (the rules accept two years ahead, not the past). */
function slotIn(days: number, hour: number): { start: string; end: string } {
  const day = new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
  const pad = (n: number) => String(n).padStart(2, '0');
  return { start: `${day}T${pad(hour)}:00`, end: `${day}T${pad(hour + 1)}:00` };
}

describe.skipIf(!EMULATOR)('round28: an archived client’s new pending request must reach the therapist', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({ projectId: 'demo-archetypeai-round28b', firestore: { rules: RULES } });
  });
  afterAll(async () => { await testEnv?.cleanup(); });
  beforeEach(async () => { await testEnv.clearFirestore(); });

  const asUser = (uid: string, email: string): Firestore =>
    testEnv.authenticatedContext(uid, { email, email_verified: true }).firestore();

  // The therapist has a profile. The client has an earlier, declined booking with T; `archived` is the flag under test.
  async function seedRelationship(client: string, email: string, archived: boolean) {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'therapists', T), { email: TEMAIL, availability: [] });
      await setDoc(doc(db, 'appointments', `old_${client}`), {
        clientUid: client, clientEmail: email, therapistUid: T, therapistEmail: TEMAIL,
        start: '2026-10-01T10:00', end: '2026-10-01T11:00', status: 'declined', createdAt: CREATED, accessGranted: true,
      });
      await setDoc(doc(db, 'therapistClients', `${T}_${client}`), {
        therapistUid: T, clientUid: client, clientEmail: email, linkedAt: CREATED, source: 'booking', appointmentId: `old_${client}`, archived,
      });
    });
  }

  async function requestFrom(client: string, email: string, days: number, hour: number): Promise<string> {
    state.db = asUser(client, email);
    const slot = slotIn(days, hour);
    return createBooking({
      clientUid: client, clientEmail: email, therapistUid: T, therapistEmail: TEMAIL, start: slot.start, end: slot.end,
    });
  }

  it('control: a new request from a client who is not archived is listed for the therapist', async () => {
    await seedRelationship(K, KEMAIL, false);
    const id = await requestFrom(K, KEMAIL, 10, 10);
    state.db = asUser(T, TEMAIL);
    const visible = visibleAppointments(await therapistAppointments(T), await linkedClients(T));
    expect(visible.map((appointment) => appointment.id)).toContain(id);
  });

  // The same hiding after the client unlinks everything: revokeTherapistAccess deletes the roster row but the request stays
  // pending (the copy says appointments stay in the history), so the therapist still cannot see or decide it.
  it('after the client unlinks, a request that is still pending must still be listed for the therapist', async () => {
    await seedRelationship(K, KEMAIL, false);
    const id = await requestFrom(K, KEMAIL, 10, 10);
    state.db = asUser(K, KEMAIL);
    expect(await revokeTherapistAccess(K)).toBeGreaterThan(0);
    state.db = asUser(T, TEMAIL);
    const visible = visibleAppointments(await therapistAppointments(T), await linkedClients(T));
    expect(visible.map((appointment) => appointment.id)).toContain(id);
  });

  it('a new request from a client the therapist archived must still be listed, so it can be approved or declined', async () => {
    await seedRelationship(C, CEMAIL, true);
    const id = await requestFrom(C, CEMAIL, 10, 10);
    state.db = asUser(T, TEMAIL);
    const clients = await linkedClients(T);
    expect(clients.find((client) => client.clientUid === C)?.archived).toBe(true);
    const visible = visibleAppointments(await therapistAppointments(T), clients);
    expect(visible.map((appointment) => appointment.id)).toContain(id);
  });
});
