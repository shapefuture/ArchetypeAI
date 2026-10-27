// Round 29 probe (critic), jsdom render of the therapist appointments tab (SpecialistView, innerverse.jsx), real render code.
// When the roster cannot be read, innerverse.jsx shows `appointments` unfiltered (rosterFailed ? appointments : visibleAppointments).
// The code comment says "every request is shown", but the fallback shows every appointment of every client, including the
// finished history (approved, declined, cancelled) of clients the therapist archived or who unlinked. With the roster readable,
// those same appointments are hidden (visibleAppointments: only pending requests and linked, non-archived clients).
// Probe: with linkedClients() rejecting, a declined appointment of an archived client must not be listed.
// Control: with the roster readable, that appointment is not listed; the pending request of an unlinked client is listed.
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STRINGS } from '../i18n/strings';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }));
const dataMock = vi.hoisted(() => ({
  linked: (async () => []) as () => Promise<unknown>,
  appointments: [] as unknown[],
}));

vi.mock('../app.jsx', () => ({ useApp: () => appMock.current }));
vi.mock('../core/therapist-link.ts', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  linkedClients: () => dataMock.linked(),
  claimTherapistLink: async () => null,
  setClientArchived: async () => undefined,
  assignExercise: async () => true,
}));
vi.mock('../core/booking.ts', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  therapistAppointments: async () => dataMock.appointments,
  getTherapistProfile: async (uid: string) => ({ uid, email: 'therapist@example.com', availability: [], statement: '' }),
  ensureTherapistBusySlots: async () => undefined,
  setAppointmentStatus: async () => undefined,
}));

import { SpecialistView } from './innerverse.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const T_UID = 'uid_therapist_fallback_r29';
let root: Root | null = null;
let host: HTMLDivElement | null = null;

const t = (key: string) => (STRINGS as Record<string, { en: string }>)[key]?.en ?? key;

function appContext() {
  return { t, lang: 'en', go: vi.fn(), toast: vi.fn(), setOverlay: vi.fn(), user: { uid: T_UID, linked: true, emailVerified: true } };
}

const appointment = (id: string, clientUid: string, clientEmail: string, status: string) => ({
  id, clientUid, clientEmail, therapistUid: T_UID, therapistEmail: 'therapist@example.com',
  start: '2030-11-05T10:00', end: '2030-11-05T11:00', status, createdAt: '2026-10-21T10:00:00.000Z',
  accessGranted: true, time: null,
});

const client = (clientUid: string, archived: boolean) => ({
  clientUid, clientEmail: `${clientUid}@example.com`, linkedAt: '2026-10-20T10:00:00.000Z', archived, summary: null,
});

async function settle() {
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
}

async function appointmentsListing(): Promise<string> {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => { root?.render(React.createElement(SpecialistView)); });
  await settle();
  const tab = Array.from(host.querySelectorAll('button')).find((button) => button.textContent?.trim() === t('appointments')) as HTMLButtonElement;
  await act(async () => { tab.click(); });
  await settle();
  return host.textContent ?? '';
}

const ARCHIVED_DECLINED = appointment('appt_arch_declined', 'uid_client_archived', 'uid_client_archived@example.com', 'declined');
const PENDING_UNLINKED = appointment('appt_unlinked_pending', 'uid_client_unlinked', 'uid_client_unlinked@example.com', 'pending');

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('ifs.attested', '1');
  dataMock.appointments = [ARCHIVED_DECLINED, PENDING_UNLINKED];
  dataMock.linked = async () => [client('uid_client_archived', true)];
  appMock.current = appContext();
});

afterEach(() => {
  if (root) act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe('round29: the roster fallback does not re-list finished appointments of archived clients', () => {
  it('control: with the roster readable, the archived client’s declined appointment is hidden and the pending request is listed', async () => {
    const text = await appointmentsListing();
    expect(text).not.toContain('uid_client_archived@example.com');
    expect(text).toContain('uid_client_unlinked@example.com');
  });

  it('with the roster unreadable, the archived client’s declined appointment must still be hidden', async () => {
    dataMock.linked = async () => { throw new Error('Missing or insufficient permissions.'); };
    const text = await appointmentsListing();
    expect(text).not.toContain('uid_client_archived@example.com');
  });
});
