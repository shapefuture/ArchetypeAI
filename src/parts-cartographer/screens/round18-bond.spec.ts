// Critic 18 scratch: a restored profile that the validator accepts but the results screen cannot draw.
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { scoreSystem } from '../core/scoring-v2';
import { validProfile } from '../core/profile-contract';
import { prepareBackup } from '../core/backup';
import { markSample } from '../core/assessment-routes';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }));
vi.mock('../app.jsx', () => ({ useApp: () => appMock.current }));
import { QuickResults } from './assessment.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root: Root | null = null;
let host: HTMLDivElement | null = null;

function quickProfile(): any {
  const families = ['manager', 'firefighter', 'exile', 'resource'] as const;
  const parts = Array.from({ length: 8 }, (_, i) => ({
    id: `p${i}`, name: `Part ${i}`, family: families[i % 4], traits: { shape: 'bean', color: '#3B9BFF', eyes: 'ovals', mouth: 'smile', head: 'none', face: 'none', bow: false, cheeks: false },
    role: 'r', blurb: 'b', energy: 50, burden: '—', need: '—', voice: '—', star: false, since: 'today',
  }));
  const somatic = Object.fromEntries(parts.map((p, i) => [p.id, { intensity: 1 + (i % 5), felt: 'mid' as const }]));
  return markSample(scoreSystem({ somatic, statements: [4, 4, 4], parts: parts as any }));
}

function render(profile: unknown) {
  appMock.current = {
    t: (k: string) => k, lang: 'en', go: vi.fn(), setOverlay: vi.fn(), setSheet: vi.fn(), premium: false, openPaywall: vi.fn(),
    toast: vi.fn(), parts: [], profile,
  };
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => { root?.render(React.createElement(QuickResults)); });
  return host;
}

beforeEach(() => localStorage.clear());
afterEach(() => {
  if (root) act(() => root?.unmount());
  root = null;
  host?.remove();
  host = null;
  localStorage.clear();
});

describe('critic18-C: a profile without resourceLeaks', () => {
  it('C0 control: the full quick-scan profile renders its Bond tab', () => {
    const container = render(quickProfile());
    const bond = Array.from(container.querySelectorAll('.tabs button')).find((b) => b.textContent === 'attachment') as HTMLButtonElement;
    expect(() => act(() => bond.click())).not.toThrow();
  });

  it('C1 the validator and the backup restore accept a profile with no resourceLeaks', async () => {
    const profile = quickProfile();
    delete profile.resourceLeaks;
    expect(validProfile(profile)).toBe(true);
    const text = JSON.stringify({ schema: 'parts-cartographer.backup.v2', data: { 'ifs.lang': 'en', 'ifs.profile': profile } });
    const prepared = await prepareBackup(text, 'en', []);
    expect(prepared.skipped).toEqual([]);
  });

  it('C2 the restored profile opens its Bond tab without an error', async () => {
    const profile = quickProfile();
    delete profile.resourceLeaks;
    const text = JSON.stringify({ schema: 'parts-cartographer.backup.v2', data: { 'ifs.lang': 'en', 'ifs.profile': profile } });
    const prepared = await prepareBackup(text, 'en', []);
    const container = render(prepared.entries['ifs.profile']);
    const bond = Array.from(container.querySelectorAll('.tabs button')).find((b) => b.textContent === 'attachment') as HTMLButtonElement;
    expect(() => act(() => bond.click())).not.toThrow();
  });
});
