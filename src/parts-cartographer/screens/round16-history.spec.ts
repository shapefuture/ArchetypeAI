import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { scoreProfile } from '../../shared/core/data/scoring-v2';
import { RESOURCES, SHADOW_PARTS } from '../../shared/core/data/parts';
import { adaptClinicalProfile } from '../core/clinical-profile-adapter';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, any> }));
vi.mock('../app.jsx', () => ({ useApp: () => appMock.current }));

import { ClinicalReport } from './clinical-report.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  localStorage.clear();
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.restoreAllMocks();
});

const input = (value: number) => ({
  self: Array(8).fill(value),
  shadow: Object.fromEntries(SHADOW_PARTS.map((id) => [id, Array(8).fill(value)])),
  resources: Object.fromEntries(RESOURCES.map((id) => [id, Array(6).fill(value)])),
  validity: { attention: 4, infrequency: [4, 4] },
});

describe('critic: restoring a report from history keeps the parts the person edited', () => {
  it('a renamed part keeps its name after "restore" on an archived report', () => {
    const current = adaptClinicalProfile(scoreProfile(input(3) as any), 'en');
    const archived = adaptClinicalProfile(scoreProfile(input(4) as any), 'en');
    // The archive holds an earlier report; the person has since renamed one of its parts.
    localStorage.setItem('ifs.history.hist', JSON.stringify([JSON.stringify({ ...archived.profile, createdAt: 1700000000000 })]));
    const renamed = { ...current.parts[0], name: 'Ana’s inner critic' };
    const setParts = vi.fn();
    const setProfile = vi.fn();
    appMock.current = {
      lang: 'en', t: (k: string) => k, user: null, parts: [renamed, ...current.parts.slice(1)],
      go: vi.fn(), setOverlay: vi.fn(), setSheet: vi.fn(), setParts, setProfile, downloadBackup: vi.fn(),
      profile: { ...current.profile, createdAt: 1600000000000 },
    };
    act(() => { root.render(React.createElement(ClinicalReport, { onBack: () => {} })); });
    const restore = Array.from(host.querySelectorAll('button')).find((b) => b.textContent === 'restore') as HTMLButtonElement;
    expect(restore).toBeTruthy();
    act(() => { restore.click(); });
    expect(setParts).toHaveBeenCalledTimes(1);
    const next = setParts.mock.calls[0][0] as Array<{ id: string; name: string }>;
    expect(next.find((part) => part.id === renamed.id)?.name).toBe('Ana’s inner critic');
  });
});
