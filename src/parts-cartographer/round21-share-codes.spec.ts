import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { scoreProfile, type AssessmentInput } from '../shared/core/data/scoring-v2';
import { RESOURCES, SHADOW_PARTS } from '../shared/core/data/parts';

// Round 21 probe: every map share code is a live bearer code until it is revoked, and the Share screen is the only
// place that lists them (overlays.jsx SynastryOv). Its list is capped at 20 in state (slice(0, 20)) and in storage
// (slice(-20)). A 21st code therefore pushes the oldest live code out of the list, and it can no longer be revoked
// from this device, while the shareCodes document still grants read access to anyone holding it.

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, any> }));
const codes = vi.hoisted(() => ({ next: 0, revoked: [] as string[] }));
vi.mock('./app.jsx', () => ({ useApp: () => appMock.current }));
vi.mock('./core/cloud-storage.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./core/cloud-storage.ts')>();
  return {
    ...actual,
    createCloudMapShareCode: vi.fn(async () => { codes.next += 1; return `share${String(codes.next).padStart(4, '0')}`; }),
    revokeCloudMapShareCode: vi.fn(async (code: string) => { codes.revoked.push(code); }),
    loadCloudSynastry: vi.fn(async () => []),
  };
});

import { SynastryOv } from './overlays.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0x100000000; };
}
function sampleInput(): AssessmentInput {
  const next = rng(7);
  const rate = () => 1 + Math.floor(next() * 5);
  return {
    shadow: Object.fromEntries(SHADOW_PARTS.map((id) => [id, Array.from({ length: 8 }, rate)])),
    resources: Object.fromEntries(RESOURCES.map((id) => [id, Array.from({ length: 6 }, rate)])),
    self: Array.from({ length: 8 }, rate),
    validity: { attention: 3, infrequency: [1, 1] as [number, number] },
  } as unknown as AssessmentInput;
}

beforeEach(() => {
  localStorage.clear();
  codes.next = 0;
  codes.revoked = [];
  const clinical = scoreProfile(sampleInput());
  appMock.current = {
    t: (key: string) => key,
    lang: 'en',
    setOverlay: vi.fn(),
    toast: vi.fn(),
    premium: true,
    openPaywall: vi.fn(),
    parts: [],
    profile: { testModel: 'angular-v2', clinical, headlineConstellation: 'Test', parts: [] },
    user: { linked: true, uid: 'uid_client', emailVerified: true, email: 'client@example.com' },
  };
});

afterEach(() => {
  if (root) act(() => root?.unmount());
  root = null;
  host?.remove();
  host = null;
  localStorage.clear();
  vi.restoreAllMocks();
});

async function createCode(container: HTMLElement) {
  const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
  if (!checkbox.checked) await act(async () => { checkbox.click(); });
  const generate = Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('⚡') && button.textContent?.includes('generateCode'));
  expect(generate).toBeTruthy();
  await act(async () => { (generate as HTMLButtonElement).click(); });
}

describe('round21: every issued share code stays revocable from this device', () => {
  it('after 21 map codes, the Share screen still offers a revoke control for each live code', async () => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    act(() => { root?.render(React.createElement(SynastryOv)); });

    for (let i = 0; i < 21; i += 1) await createCode(host);

    const revokeButtons = Array.from(host.querySelectorAll('button')).filter((button) => button.textContent?.includes('revokeShareCode'));
    expect(codes.next).toBe(21);
    expect(revokeButtons).toHaveLength(21);
  });

  it('the oldest code is still in the device list after 21 codes, so it can be revoked', async () => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    act(() => { root?.render(React.createElement(SynastryOv)); });

    for (let i = 0; i < 21; i += 1) await createCode(host);

    const stored = JSON.parse(localStorage.getItem('ifs.share.codes') ?? '[]') as Array<{ c: string }>;
    expect(stored.map((entry) => entry.c)).toContain('share0001');
  });
});
