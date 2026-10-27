// Round 29 probe (critic), jsdom render of the therapist dashboard appointments tab (SpecialistView, innerverse.jsx) with the real
// decideAppointment() handler. The client cancels the request while the therapist's list is open. The therapist presses Approve:
// setAppointmentStatus() refuses it ("This appointment is already closed"), the handler shows an error and does not reload the
// list. The request stays on screen with its Approve and Decline buttons, and nothing on the appointments tab reloads it.
// Expected: a refused decision reloads the list, so the closed request leaves the screen. Control: a successful approve reloads it.
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STRINGS } from '../i18n/strings';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }));
const dataMock = vi.hoisted(() => ({
  appointments: [] as unknown[],
  loads: 0,
  decide: (async () => undefined) as () => Promise<unknown>,
}));

vi.mock('../app.jsx', () => ({ useApp: () => appMock.current }));
vi.mock('../core/therapist-link.ts', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  linkedClients: async () => [],
  claimTherapistLink: async () => null,
  setClientArchived: async () => undefined,
  assignExercise: async () => true,
}));
vi.mock('../core/booking.ts', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  therapistAppointments: async () => { dataMock.loads += 1; return dataMock.appointments; },
  getTherapistProfile: async (uid: string) => ({ uid, email: 'therapist@example.com', availability: [], statement: '' }),
  ensureTherapistBusySlots: async () => undefined,
  setAppointmentStatus: () => dataMock.decide(),
}));

import { SpecialistView } from './innerverse.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const T_UID = 'uid_therapist_stale_r29';
let root: Root | null = null;
let host: HTMLDivElement | null = null;

const t = (key: string) => (STRINGS as Record<string, { en: string }>)[key]?.en ?? key;

function appContext() {
  return { t, lang: 'en', go: vi.fn(), toast: vi.fn(), setOverlay: vi.fn(), user: { uid: T_UID, linked: true, emailVerified: true } };
}

const pending = (id: string) => ({
  id, clientUid: 'uid_client_stale', clientEmail: 'client-stale@example.com', therapistUid: T_UID, therapistEmail: 'therapist@example.com',
  start: '2030-11-05T10:00', end: '2030-11-05T11:00', status: 'pending', createdAt: '2026-10-21T10:00:00.000Z',
  accessGranted: true, time: null,
});

async function settle() {
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
}

async function openAppointments(): Promise<HTMLDivElement> {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => { root?.render(React.createElement(SpecialistView)); });
  await settle();
  const tab = Array.from(host.querySelectorAll('button')).find((button) => button.textContent?.trim() === t('appointments')) as HTMLButtonElement;
  await act(async () => { tab.click(); });
  await settle();
  return host;
}

function buttonNamed(container: ParentNode, label: string): HTMLButtonElement | undefined {
  return Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.trim() === label) as HTMLButtonElement | undefined;
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('ifs.attested', '1');
  dataMock.appointments = [pending('appt_stale_1')];
  dataMock.loads = 0;
  dataMock.decide = async () => undefined;
  appMock.current = appContext();
});

afterEach(() => {
  if (root) act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe('round29: a refused decision on a request reloads the appointments list', () => {
  it('control: a successful approve reloads the list', async () => {
    const container = await openAppointments();
    const before = dataMock.loads;
    await act(async () => { buttonNamed(container, t('appointmentApprove'))!.click(); });
    await settle();
    expect(dataMock.loads).toBeGreaterThan(before);
  });

  it('a request the client closed meanwhile is reloaded off the list after the refused approve', async () => {
    dataMock.decide = async () => { throw new Error('This appointment is already closed'); };
    const container = await openAppointments();
    const before = dataMock.loads;
    await act(async () => { buttonNamed(container, t('appointmentApprove'))!.click(); });
    await settle();
    expect(dataMock.loads, 'appointment list reloads after the refused decision').toBeGreaterThan(before);
  });
});
