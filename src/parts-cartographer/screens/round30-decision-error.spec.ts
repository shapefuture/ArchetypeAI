// Round 30 probe (critic), jsdom render of the therapist dashboard appointments tab (SpecialistView, innerverse.jsx).
// The therapist presses Approve and the write fails with a network error. decideAppointment() sets the save-failed alert and
// then calls refresh(); the reload effect starts with setError(''), so the alert is cleared in the same tick. The therapist sees
// no message that the decision was not saved.
// Expected: the alert stays on screen after the refused decision. Control: a successful approve shows no alert.
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STRINGS } from '../i18n/strings';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }));
const dataMock = vi.hoisted(() => ({
  appointments: [] as unknown[],
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
  therapistAppointments: async () => dataMock.appointments,
  getTherapistProfile: async (uid: string) => ({ uid, email: 'therapist@example.com', availability: [], statement: '' }),
  ensureTherapistBusySlots: async () => undefined,
  setAppointmentStatus: () => dataMock.decide(),
}));

import { SpecialistView } from './innerverse.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const T_UID = 'uid_therapist_decision_r30';
let root: Root | null = null;
let host: HTMLDivElement | null = null;

const t = (key: string) => (STRINGS as Record<string, { en: string }>)[key]?.en ?? key;

function appContext() {
  return { t, lang: 'en', go: vi.fn(), toast: vi.fn(), setOverlay: vi.fn(), user: { uid: T_UID, linked: true, emailVerified: true } };
}

const pending = (id: string) => ({
  id, clientUid: 'uid_client_decision', clientEmail: 'client-decision@example.com', therapistUid: T_UID, therapistEmail: 'therapist@example.com',
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
  dataMock.appointments = [pending('appt_decision_1')];
  dataMock.decide = async () => undefined;
  appMock.current = appContext();
});

afterEach(() => {
  if (root) act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe('round30: a decision that fails to save keeps its error on screen', () => {
  it('control: a successful approve shows no error', async () => {
    const container = await openAppointments();
    await act(async () => { buttonNamed(container, t('appointmentApprove'))!.click(); });
    await settle();
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it('a network failure on approve leaves the save-failed alert visible after the list reloads', async () => {
    dataMock.decide = async () => { throw new Error('Network request failed'); };
    const container = await openAppointments();
    await act(async () => { buttonNamed(container, t('appointmentApprove'))!.click(); });
    await settle();
    expect(container.querySelector('[role="alert"]')?.textContent, 'the therapist is told the decision was not saved')
      .toBe(t('therapistSaveFailed'));
  });
});
