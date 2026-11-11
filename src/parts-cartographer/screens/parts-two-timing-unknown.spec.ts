import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FAMILY_COPY, TIMING_COPY, UI_COPY } from '../../shared/core/data/assessment2/content';
import { SCENES, SCENE_FAMILIES, buildAssessment2Result, type Assessment2Input, type SceneAnswer } from '../../shared/core/data/assessment2/scoring';
import { saveLastResult } from '../core/parts-two-store';

// The result view for a skipped protector timing (build-and-fix ux246, plan D1). The app context is stubbed, as in
// parts-two-last-result.spec.ts. The result is shown through the last-result view, which uses the same result body as
// the live result, so the sub-line under the protector is the line under test.

const app = vi.hoisted(() => ({ lang: 'en', go: vi.fn(), setParts: vi.fn(), setUniverseMode: vi.fn() }));
vi.mock('../app.jsx', () => ({ useApp: () => ({ parts: [], ...app }) }));
import { PartsTwo } from './parts-two.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Every scene answered so that attack is the one protector. Its pick is inner_critic, and no exile is named.
const scenes: SceneAnswer[] = SCENES.map((scene) => ({
  scene,
  most: SCENE_FAMILIES[scene].includes('attack') ? 'attack' : SCENE_FAMILIES[scene][0],
  least: SCENE_FAMILIES[scene].includes('withdraw') ? 'withdraw' : SCENE_FAMILIES[scene][1],
}));

const inputWith = (timing: Assessment2Input['timing']): Assessment2Input => ({
  completedStages: [], steadiness: 4, lighter: false, scenes, picks: { attack: 'inner_critic' }, timing,
  costume: {}, confirm: {}, fears: {}, exileLevel: {}, exileNeed: {}, blending: {}, providers: {},
  capacityEasiest: null, capacityHardest: null, ground: [], placed: {},
});

const SAVED_AT = new Date('2026-11-11T12:00:00.000Z');

describe('a protector timing on the result view (ux246, D1)', () => {
  let host: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    vi.clearAllMocks();
    app.lang = 'en';
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
  });
  afterEach(() => {
    act(() => root.unmount());
    host.remove();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  /** Stores the result for this timing, then opens the last-result view on it. */
  const showResult = (timing: Assessment2Input['timing']) => {
    saveLastResult(buildAssessment2Result(inputWith(timing)), SAVED_AT);
    act(() => { root.render(React.createElement(PartsTwo)); });
  };
  /** The sub-line under each part: for a protector, its timing and its family. */
  const partLines = () => Array.from(host.querySelectorAll('li p.sub')).map((line) => line.textContent ?? '');

  it('shows a skipped timing as "Timing not answered", and never as a timing', () => {
    showResult({ inner_critic: null });
    expect(partLines()).toContain(`${UI_COPY.timingUnknown.en} · ${FAMILY_COPY.attack.en}`);
    expect(host.textContent).not.toContain(TIMING_COPY.reactive.en);
    expect(host.textContent).not.toContain(TIMING_COPY.preventive.en);
  });

  it('shows an answered timing as that timing, and never as "Timing not answered"', () => {
    showResult({ inner_critic: 'reactive' });
    expect(partLines()).toContain(`${TIMING_COPY.reactive.en} · ${FAMILY_COPY.attack.en}`);
    expect(host.textContent).not.toContain(UI_COPY.timingUnknown.en);
  });
});
