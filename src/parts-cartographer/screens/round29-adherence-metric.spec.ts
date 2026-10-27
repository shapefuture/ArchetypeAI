// Round 29 probe (critic), jsdom render of the therapist dashboard metrics tab (SpecialistView, innerverse.jsx), real render code.
// The metric "Adherence" (sw38) is computed as done * 100 / (done + skipped) over the shared summaries. The only writer of a
// summary's adherence is the share path (overlays.jsx createShareCode): it passes `{ done, skipped: 0 }` as a literal, and the
// device records no skipped practices (practice.jsx stores only `completed`). So the metric is 100% for every client with at
// least one completed practice, whatever part of the 36-practice catalogue they completed.
// Probe: a client who completed one practice of the catalogue must not read as 100% adherence.
// Control: a client with no completed practice shows the dash, and the metric counts the one completed practice as done.
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STRINGS } from '../i18n/strings';
import { EXERCISES } from '../../shared/core/data/exercises';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }));
const dataMock = vi.hoisted(() => ({ linked: (async () => []) as () => Promise<unknown> }));

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
  therapistAppointments: async () => [],
  getTherapistProfile: async (uid: string) => ({ uid, email: 'therapist@example.com', availability: [], statement: '' }),
  ensureTherapistBusySlots: async () => undefined,
  setAppointmentStatus: async () => undefined,
}));

import { SpecialistView } from './innerverse.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const T_UID = 'uid_therapist_metric_r29';
let root: Root | null = null;
let host: HTMLDivElement | null = null;

const t = (key: string) => (STRINGS as Record<string, { en: string }>)[key]?.en ?? key;

function appContext() {
  return { t, lang: 'en', go: vi.fn(), toast: vi.fn(), setOverlay: vi.fn(), user: { uid: T_UID, linked: true, emailVerified: true } };
}

const summary = (done: number) => ({
  headline: 'Protector', burden: 40, selfEnergy: 55, parts: {}, activeComplexes: [],
  copingStack: { l1: 'Caretaker', floor: 'Shamed' }, adherence: { done, skipped: 0 },
});

const client = (clientUid: string, done: number) => ({
  clientUid, clientEmail: `${clientUid}@example.com`, linkedAt: '2026-10-20T10:00:00.000Z', archived: false, summary: summary(done),
});

async function settle() {
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
}

async function metricValue(clients: unknown[]): Promise<string> {
  dataMock.linked = async () => clients;
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => { root?.render(React.createElement(SpecialistView)); });
  await settle();
  const metricsTab = Array.from(host.querySelectorAll('button')).find((button) => button.textContent?.trim() === t('metrics')) as HTMLButtonElement;
  await act(async () => { metricsTab.click(); });
  await settle();
  const row = Array.from(host.querySelectorAll('.row')).find((element) => element.querySelector('span')?.textContent?.trim() === t('practicesDone'));
  expect(row, `metric row “${t('practicesDone')}” should exist`).toBeTruthy();
  return row!.querySelector('b')?.textContent?.trim() ?? '';
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('ifs.attested', '1');
  appMock.current = appContext();
});

afterEach(() => {
  if (root) act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe('round29: the therapist Adherence metric is not a constant 100%', () => {
  it('control: a client with no completed practice shows zero completed practices', async () => {
    expect(await metricValue([client('uid_client_none', 0)])).toBe('0');
  });

  it('a client who completed one practice of the catalogue shows a count of one, never a percentage', async () => {
    const catalogue = EXERCISES.length;
    const value = await metricValue([client('uid_client_one', 1)]);
    expect(catalogue).toBeGreaterThan(10);
    expect(value, `completed practices for 1 completed out of ${catalogue}`).toBe('1');
  });
});
