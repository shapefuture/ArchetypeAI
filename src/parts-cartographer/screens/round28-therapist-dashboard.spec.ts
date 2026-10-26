// Round 28 probe (critic), jsdom render of the therapist dashboard (SpecialistView, innerverse.jsx) with the real
// visibleAppointments() and the real render code; only the data layer (linkedClients, therapistAppointments) is replaced.
//  (a) If linkedClients() rejects, innerverse.jsx sets clients to [] and shows the appointment tab from visibleAppointments(),
//      which keeps only appointments whose client is on the roster. Every pending request is then hidden and the tab says
//      "No appointment requests yet.", a false statement, next to the error banner.
//  (b) A request from a client the therapist archived has no approve or decline button anywhere on the screen.
//  (c) Accessibility: the active tab does not expose its selected state, and icon-only header buttons have no name.
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STRINGS } from '../i18n/strings';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }));
const dataMock = vi.hoisted(() => ({
  linked: (async () => []) as () => Promise<unknown>,
  appointments: [] as unknown[],
  claim: (async () => null) as () => Promise<unknown>,
}));

vi.mock('../app.jsx', () => ({ useApp: () => appMock.current }));
vi.mock('../core/therapist-link.ts', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  linkedClients: () => dataMock.linked(),
  claimTherapistLink: () => dataMock.claim(),
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

const T_UID = 'uid_therapist_dash';
let root: Root | null = null;
let host: HTMLDivElement | null = null;

const t = (key: string) => (STRINGS as Record<string, { en: string }>)[key]?.en ?? key;

function appContext() {
  return {
    t,
    lang: 'en',
    go: vi.fn(),
    toast: vi.fn(),
    setOverlay: vi.fn(),
    user: { uid: T_UID, linked: true, emailVerified: true },
  };
}

const client = (clientUid: string, clientEmail: string, archived = false) => ({
  clientUid, clientEmail, linkedAt: '2026-10-20T10:00:00.000Z', archived, summary: null,
});
const pending = (id: string, clientUid: string, clientEmail: string) => ({
  id, clientUid, clientEmail, therapistUid: T_UID, therapistEmail: 'therapist@example.com',
  start: '2030-11-05T10:00', end: '2030-11-05T11:00', status: 'pending', createdAt: '2026-10-21T10:00:00.000Z',
  accessGranted: true, time: null,
});

async function settle() {
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
}

async function mount(): Promise<HTMLDivElement> {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => { root?.render(React.createElement(SpecialistView)); });
  await settle();
  return host;
}

function tabButton(container: ParentNode, label: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll('button')).find((candidate) => candidate.textContent?.trim() === label);
  expect(button, `tab “${label}” should exist`).toBeTruthy();
  return button as HTMLButtonElement;
}

async function openTab(container: ParentNode, label: string) {
  await act(async () => { tabButton(container, label).click(); });
  await settle();
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('ifs.attested', '1');
  dataMock.appointments = [];
  dataMock.linked = async () => [];
  dataMock.claim = async () => null;
  appMock.current = appContext();
});

afterEach(() => {
  if (root) act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe('round28: therapist dashboard shows the requests it holds', () => {
  it('control: with the roster loaded, the appointments tab lists the pending request and its decision buttons', async () => {
    dataMock.linked = async () => [client('cli_ana', 'ana@example.com')];
    dataMock.appointments = [pending('appt_ana', 'cli_ana', 'ana@example.com')];
    const container = await mount();
    await openTab(container, t('appointments'));
    expect(container.textContent).toContain('ana@example.com');
    expect(container.textContent).toContain(t('appointmentApprove'));
  });

  it('(a) when linkedClients fails, the appointments tab must not say there are no requests', async () => {
    dataMock.linked = async () => { throw new Error('permission-denied'); };
    dataMock.appointments = [pending('appt_ana', 'cli_ana', 'ana@example.com')];
    const container = await mount();
    await openTab(container, t('appointments'));
    expect(container.textContent).not.toContain(t('therapistNoAppointments'));
  });

  it('(b) a pending request from an archived client has an approve and a decline button', async () => {
    dataMock.linked = async () => [client('cli_old', 'old@example.com', true)];
    dataMock.appointments = [pending('appt_old', 'cli_old', 'old@example.com')];
    const container = await mount();
    await openTab(container, t('appointments'));
    const buttons = Array.from(container.querySelectorAll('button')).map((button) => button.textContent?.trim());
    expect(buttons).toContain(t('appointmentApprove'));
  });

  it('(d) a connection failure while claiming a client code is not reported as a bad code', async () => {
    dataMock.claim = async () => { throw new Error('Failed to fetch'); };
    const container = await mount();
    const input = container.querySelector('input[placeholder="ABCD2345EF"]') as HTMLInputElement;
    expect(input, 'claim code input should exist').toBeTruthy();
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    await act(async () => {
      setValue.call(input, 'ABCD2345EF');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const claimButton = Array.from(container.querySelectorAll('button'))
      .find((button) => button.textContent?.trim() === t('claimTherapistCode')) as HTMLButtonElement | undefined;
    expect(claimButton, 'claim button should be enabled for a 10-character code').toBeTruthy();
    await act(async () => { claimButton!.click(); });
    await settle();
    const alert = container.querySelector('[role="alert"]');
    expect(alert?.textContent?.trim()).not.toBe(t('badCode'));
  });

  it('(c) the active tab exposes its selected state to assistive technology', async () => {
    dataMock.linked = async () => [client('cli_ana', 'ana@example.com')];
    const container = await mount();
    const active = tabButton(container, t('claims'));
    const exposed = active.getAttribute('aria-selected') === 'true' || active.getAttribute('aria-current') === 'true'
      || active.getAttribute('aria-current') === 'page' || active.getAttribute('aria-pressed') === 'true';
    expect(exposed, `active tab “${t('claims')}” has no aria-selected, aria-current or aria-pressed`).toBe(true);
  });

  it('(c) every icon-only button on the therapist screen has an accessible name', async () => {
    const container = await mount();
    const unnamed = Array.from(container.querySelectorAll('button'))
      .filter((button) => (button.textContent?.trim().length ?? 0) <= 2 && !button.getAttribute('aria-label') && !button.getAttribute('title'))
      .map((button) => button.textContent?.trim());
    expect(unnamed).toEqual([]);
  });
});
