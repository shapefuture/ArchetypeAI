// Round 30 probe (critic), jsdom render of the therapist overlay (Therapist in overlays.jsx), the same appointment decision as
// the dashboard. A network failure on approve sets the alert, then refreshAppointments() runs and clears appointmentError on its
// successful reload. The therapist sees no message that the decision was not saved.
// Expected: the alert stays on screen after the refused decision. Control: a successful approve shows no alert.
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STRINGS } from './i18n/strings';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, any> }));
const dataMock = vi.hoisted(() => ({
  appointments: [] as unknown[],
  decide: (async () => undefined) as () => Promise<unknown>,
}));

vi.mock('./app.jsx', () => ({ useApp: () => appMock.current }));
vi.mock('./core/booking.ts', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  therapistAppointments: async () => dataMock.appointments,
  getTherapistProfile: async (uid: string) => ({ uid, email: 'therapist@example.com', availability: [], statement: '' }),
  ensureTherapistBusySlots: async () => undefined,
  setAppointmentStatus: () => dataMock.decide(),
}));

import { Therapist } from './overlays.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const T_UID = 'uid_therapist_overlay_r30';
let root: Root | null = null;
let host: HTMLDivElement | null = null;

const t = (key: string) => (STRINGS as Record<string, { en: string }>)[key]?.en ?? key;

function appContext() {
  return { t, lang: 'en', go: vi.fn(), toast: vi.fn(), setOverlay: vi.fn(), user: { uid: T_UID, linked: true, emailVerified: true, email: 'therapist@example.com' } };
}

const pending = (id: string) => ({
  id, clientUid: 'uid_client_overlay', clientEmail: 'client-overlay@example.com', therapistUid: T_UID, therapistEmail: 'therapist@example.com',
  start: '2030-11-05T10:00', end: '2030-11-05T11:00', status: 'pending', createdAt: '2026-10-21T10:00:00.000Z',
  accessGranted: true, time: null,
});

async function settle() {
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
}

function buttonNamed(container: ParentNode, label: string): HTMLButtonElement | undefined {
  return Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.trim() === label) as HTMLButtonElement | undefined;
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('ifs.attested', '1');
  dataMock.appointments = [pending('appt_overlay_1')];
  dataMock.decide = async () => undefined;
  appMock.current = appContext();
});

afterEach(() => {
  if (root) act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

async function mount(): Promise<HTMLDivElement> {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => { root?.render(React.createElement(Therapist)); });
  await settle();
  return host;
}

describe('round30: the therapist overlay keeps a failed decision on screen', () => {
  it('control: a successful approve shows no error', async () => {
    const container = await mount();
    await act(async () => { buttonNamed(container, t('appointmentApprove'))!.click(); });
    await settle();
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it('a network failure on approve leaves the save-failed alert visible after the list reloads', async () => {
    dataMock.decide = async () => { throw new Error('Network request failed'); };
    const container = await mount();
    await act(async () => { buttonNamed(container, t('appointmentApprove'))!.click(); });
    await settle();
    expect(container.querySelector('[role="alert"]')?.textContent, 'the therapist is told the decision was not saved')
      .toBe(t('therapistSaveFailed'));
  });
});
