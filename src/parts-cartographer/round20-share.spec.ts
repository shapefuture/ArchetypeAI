import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { scoreProfile, type AssessmentInput } from '../shared/core/data/scoring-v2';
import { RESOURCES, SHADOW_PARTS } from '../shared/core/data/parts';

// Round 20 probe: the Share screen sends the therapist an "adherence" count. The consent text promises
// the therapist sees exercise adherence, but the Share screen always sends {done: 0, skipped: 0}.

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, any> }));
const captured = vi.hoisted(() => ({ summary: null as any }));
vi.mock('./app.jsx', () => ({ useApp: () => appMock.current }));
vi.mock('./core/therapist-link.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./core/therapist-link.ts')>();
  return {
    ...actual,
    createTherapistLink: vi.fn(async (_uid: string, summary: unknown) => { captured.summary = summary; return 'ABCDEFGH23'; }),
    revokeTherapistAccess: vi.fn(async () => 0),
  };
});

import { Share } from './overlays.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0x100000000; };
}
function sampleInput(): AssessmentInput {
  const next = rng(42);
  const rate = () => 1 + Math.floor(next() * 5);
  return {
    shadow: Object.fromEntries(SHADOW_PARTS.map((id) => [id, Array.from({ length: 8 }, rate)])),
    resources: Object.fromEntries(RESOURCES.map((id) => [id, Array.from({ length: 6 }, rate)])),
    self: Array.from({ length: 8 }, rate),
    validity: { attention: 4, infrequency: [2, 2] as [number, number] },
  } as unknown as AssessmentInput;
}

beforeEach(() => {
  localStorage.clear();
  captured.summary = null;
  // Three practices completed on this device.
  localStorage.setItem('INNERVERSE_PRACTICE_V1', JSON.stringify({ completed: ['regulation-1', 'self-energy-1', 'resource-1'], lastSuggestedAt: null }));
  const clinical = scoreProfile(sampleInput());
  appMock.current = {
    t: (key: string) => key,
    lang: 'en',
    setOverlay: vi.fn(),
    toast: vi.fn(),
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

describe('round20: therapist share summary carries exercise adherence', () => {
  it('sends the number of practices the person completed, not zeros', async () => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    act(() => { root?.render(React.createElement(Share)); });
    const checkbox = host.querySelector('input[type="checkbox"]') as HTMLInputElement;
    await act(async () => { checkbox.click(); });
    const create = Array.from(host.querySelectorAll('button')).find((b) => b.textContent?.includes('therapistShareCreate'));
    expect(create).toBeTruthy();
    await act(async () => { (create as HTMLButtonElement).click(); });
    expect(captured.summary).not.toBeNull();
    expect(captured.summary.adherence.done).toBe(3);
  });
});
