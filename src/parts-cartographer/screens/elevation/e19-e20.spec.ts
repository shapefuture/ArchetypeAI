import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }));
vi.mock('../../app.jsx', () => ({ useApp: () => appMock.current }));

import { ExtensionsPanel } from './e19-extensions.jsx';
import { EvaluationRubricPanel } from './e20-evaluation.jsx';
import { EXTENSIONS } from '../../elevation/e19-comparison.ts';
import { RUBRIC } from '../../elevation/e20-evaluation.ts';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function render(component: React.ComponentType) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(React.createElement(component)));
}

beforeEach(() => {
  appMock.current = { lang: 'en' };
});

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe('E19 extensions panel', () => {
  it('lists every extension with its prerequisites unknown, and says ordinary use needs none', () => {
    render(ExtensionsPanel);
    expect(host?.textContent).toContain('Ordinary use never requires any of them');
    expect(host?.textContent?.match(/Not checked yet/g)?.length).toBe(EXTENSIONS.reduce((n, e) => n + e.prerequisites.length, 0));
  });
});

describe('E20 evaluation rubric panel', () => {
  it('shows the rubric as a draft and never a pass or a score', () => {
    render(EvaluationRubricPanel);
    expect(host?.textContent).toContain('No result is produced here');
    expect(host?.textContent).toContain('no dimension is passed');
    expect(host?.querySelectorAll('li')).toHaveLength(RUBRIC.length);
    expect(host?.textContent).not.toMatch(/\bpass(ed)?\b\s*[:=]\s*\d|score\s*[:=]\s*\d/i);
  });
});
