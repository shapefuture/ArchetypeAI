// Gauntlet round 11 scratch reproduction (critic): cloud restore overwrites the local map in one tap.
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SHADOW_PARTS, RESOURCES } from '../../shared/core/data/parts';
import { scoreProfile } from '../../shared/core/data/scoring-v2';
import { adaptClinicalProfile } from '../core/clinical-profile-adapter';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }));
vi.mock('../app.jsx', () => ({ useApp: () => appMock.current }));
vi.mock('../core/cloud-storage.ts', () => ({
  CLOUD_PART_LIMIT: 100,
  loadCloudMapHistory: vi.fn(async () => cloudEntries.current),
  saveCloudMap: vi.fn(async () => ({})),
  createCloudMapShareCode: vi.fn(),
  redeemCloudMapShareCode: vi.fn(),
  revokeCloudMapShareCode: vi.fn(),
  createCloudLegacy64ShareCode: vi.fn(),
  loadCloudSynastry: vi.fn(async () => []),
  saveCloudSynastry: vi.fn(),
  fromDocument: vi.fn(),
  snapshot: vi.fn(),
}));
const cloudEntries = vi.hoisted(() => ({ current: [] as any[] }));
vi.mock('../core/booking.ts', () => ({
  myAppointments: vi.fn(async () => []),
  setAppointmentStatus: vi.fn(),
  appointmentDisplayTime: () => ({ text: '', therapistWallClock: false }),
}));
vi.mock('../core/admin.ts', () => ({ checkAdminAccess: vi.fn(async () => false) }));
vi.mock('../pal/Character.tsx', () => ({ Character: () => null }));
vi.mock('./editor-kit.jsx', () => ({ CustomizerLike: () => null }));
vi.mock('./elevation/e02-entry.jsx', () => ({ EntryPanel: () => null }));
vi.mock('./elevation/e03-capacity.jsx', () => ({ CapacityPanel: () => null }));
vi.mock('./elevation/e06-corrections.jsx', () => ({ CorrectionsPanel: () => null }));
vi.mock('./elevation/e07-validity.jsx', () => ({ ValidityPanel: () => null }));
vi.mock('./elevation/e11-felt-roles.jsx', () => ({ FeltRolesPanel: () => null }));
vi.mock('./elevation/e13-grammar.jsx', () => ({ GrammarPanel: () => null }));
vi.mock('./elevation/e14-export.jsx', () => ({ PocketCardPanel: () => null }));
vi.mock('./elevation/e15-session-prep.jsx', () => ({ SessionPrepPanel: () => null }));
vi.mock('./elevation/e17-save-status.jsx', () => ({ SaveStatusPanel: () => null }));
vi.mock('./elevation/e18-device.jsx', () => ({ DeviceEnvelopePanel: () => null }));
vi.mock('./elevation/e19-extensions.jsx', () => ({ ExtensionsPanel: () => null }));
vi.mock('./elevation/e20-evaluation.jsx', () => ({ EvaluationRubricPanel: () => null }));
vi.mock('./memory-panel.jsx', () => ({ MemoryPanel: () => null }));
vi.mock('./shared-support.jsx', () => ({ SharedSupportPanel: () => null }));
vi.mock('./reminder-settings.jsx', () => ({ ReminderSettings: () => null }));
vi.mock('./part-history.jsx', () => ({ PartVersionHistory: () => null }));

import { Cabinet } from './cabinet.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root: Root | null = null;
let host: HTMLDivElement | null = null;

const input = () => ({
  self: Array(8).fill(4),
  shadow: Object.fromEntries(SHADOW_PARTS.map((id) => [id, Array(8).fill(4)])),
  resources: Object.fromEntries(RESOURCES.map((id) => [id, Array(6).fill(4)])),
  validity: { attention: 4, infrequency: [4, 4] },
});
const adapted = adaptClinicalProfile(scoreProfile(input() as any), 'en');
const localParts = adapted.parts.slice(0, 2).map((p: any, i: number) => ({ ...p, id: `local-${i}`, name: `Local ${i}` }));
const cloudParts = adapted.parts.slice(5, 6).map((p: any) => ({ ...p, id: 'cloud-1', name: 'Cloud part' }));

beforeEach(() => {
  localStorage.clear();
  cloudEntries.current = [{ id: 'h1', schema: 'parts-cartographer.v1', profile: { headlineConstellation: 'Cloud map' }, parts: cloudParts, createdAt: '2026-10-01T00:00:00.000Z' }];
  appMock.current = {
    t: (key: string) => key, lang: 'en', go: vi.fn(), parts: localParts, setParts: vi.fn(), setSheet: vi.fn(),
    toast: vi.fn(), openPaywall: vi.fn(), setOverlay: vi.fn(), profile: adapted.profile, setProfile: vi.fn(),
    user: { linked: true, uid: 'u1', emailVerified: true, email: 'client@example.com' },
  };
});
afterEach(() => {
  if (root) act(() => root?.unmount());
  root = null;
  host?.remove();
  host = null;
  vi.restoreAllMocks();
});

describe('R11-H cloud restore (cabinet.jsx:143-151, 268-276)', () => {
  it('R11-H1: one tap on Restore does not overwrite the local map without a preview or confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    const ctx = appMock.current as any;
    act(() => { root?.render(React.createElement(Cabinet)); });
    const load = Array.from(host.querySelectorAll('button')).find((b) => b.textContent === 'cloudLoadButton')!;
    await act(async () => { load.click(); });
    const restore = Array.from(host.querySelectorAll('button')).find((b) => b.textContent === 'cloudRestoreButton');
    expect(restore, 'restore button should exist after loading history').toBeTruthy();
    await act(async () => { restore!.click(); });
    expect(ctx.setParts).not.toHaveBeenCalled();
  });

  it('R11-H0 control: loading the cloud history lists the snapshot with a Restore button', async () => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    act(() => { root?.render(React.createElement(Cabinet)); });
    const load = Array.from(host.querySelectorAll('button')).find((b) => b.textContent === 'cloudLoadButton')!;
    await act(async () => { load.click(); });
    expect(Array.from(host.querySelectorAll('button')).some((b) => b.textContent === 'cloudRestoreButton')).toBe(true);
  });
});

describe('R11-H2 restore after the person confirms', () => {
  it('replaces the local map once the person says yes', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    const ctx = appMock.current as any;
    act(() => { root?.render(React.createElement(Cabinet)); });
    const load = Array.from(host.querySelectorAll('button')).find((b) => b.textContent === 'cloudLoadButton')!;
    await act(async () => { load.click(); });
    const restore = Array.from(host.querySelectorAll('button')).find((b) => b.textContent === 'cloudRestoreButton')!;
    await act(async () => { restore.click(); });
    expect(ctx.setParts).toHaveBeenCalledTimes(1);
  });
});
