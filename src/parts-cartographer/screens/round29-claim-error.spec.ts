// Round 29 probe (critic), jsdom render of the therapist dashboard (SpecialistView, innerverse.jsx). The data layer is replaced
// except claim(): claimTherapistLink() rejects with the error the real function throws for a code another therapist already
// claimed (round29-claim-taken.rules.spec.ts: the rules refuse the getDoc with permission-denied). innerverse.jsx claim() catches
// every rejection and shows t('therapistLoadFailed') ("Could not load therapist data. Check your connection…"). A taken code is a
// refusal, not a connection problem, so the alert must say badCode ("That client code could not be claimed. Check it…").
// Control: a code the function resolves to null for shows badCode.
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STRINGS } from '../i18n/strings';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }));
const dataMock = vi.hoisted(() => ({ claim: (async () => null) as () => Promise<unknown> }));

vi.mock('../app.jsx', () => ({ useApp: () => appMock.current }));
vi.mock('../core/therapist-link.ts', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  linkedClients: async () => [],
  claimTherapistLink: () => dataMock.claim(),
  setClientArchived: async () => undefined,
  assignExercise: async () => true,
}));
vi.mock('../core/booking.ts', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  therapistAppointments: async () => [],
  getTherapistProfile: async (uid: string) => ({ uid, email: 'therapist@example.com', availability: [], statement: '' }),
  ensureTherapistBusySlots: async () => undefined,
  setAppointmentStatus: async () => undefined,
}));

import { SpecialistView } from './innerverse.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const T_UID = 'uid_therapist_claim_r29';
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

async function claimCode(container: ParentNode, code: string) {
  const input = container.querySelector('input[placeholder="ABCD2345EF"]') as HTMLInputElement;
  expect(input, 'claim code input should exist').toBeTruthy();
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  await act(async () => {
    setValue.call(input, code);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const claimButton = Array.from(container.querySelectorAll('button'))
    .find((button) => button.textContent?.trim() === t('claimTherapistCode')) as HTMLButtonElement | undefined;
  expect(claimButton, 'claim button should be enabled for a 10-character code').toBeTruthy();
  await act(async () => { claimButton!.click(); });
  await settle();
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('ifs.attested', '1');
  dataMock.claim = async () => null;
  appMock.current = appContext();
});

afterEach(() => {
  if (root) act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe('round29: a code another therapist already claimed is reported as a bad code', () => {
  it('control: a code the claim resolves to null for shows the bad-code message', async () => {
    dataMock.claim = async () => null;
    const container = await mount();
    await claimCode(container, 'ABCD2345EF');
    expect(container.querySelector('[role="alert"]')?.textContent?.trim()).toBe(t('badCode'));
  });

  it('a code another therapist already claimed (permission-denied from the rules) must be reported as a bad code', async () => {
    dataMock.claim = async () => { throw Object.assign(new Error('Missing or insufficient permissions.'), { code: 'permission-denied' }); };
    const container = await mount();
    await claimCode(container, 'ABCD2345EF');
    expect(container.querySelector('[role="alert"]')?.textContent?.trim()).toBe(t('badCode'));
  });
});
