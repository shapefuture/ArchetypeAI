import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }));
vi.mock('../../app.jsx', () => ({ useApp: () => appMock.current }));

import { GOAL_KEY, GoalPanel } from './e01-goal.jsx';
import { store } from '../../core/local-store';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function render() {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(React.createElement(GoalPanel)));
}

function text(): string {
  return host?.textContent ?? '';
}

beforeEach(() => {
  appMock.current = { lang: 'en' };
  localStorage.clear();
});

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe('E01 goal panel', () => {
  it('shows the empty state and an invitation to write a goal in the person\'s own words', () => {
    render();
    expect(text()).toContain('No goal yet');
    expect(text()).toContain('in your own words');
  });

  it('shows a stored goal and says the wording can be changed', () => {
    store.save(GOAL_KEY, {
      schema: 'goal.v1', id: 'g1', status: 'active',
      season: { id: 'g1', goals: ['Speak up in meetings without rehearsing'], endpoints: [], lengthDays: null },
      statementHistory: [], tools: [], hypotheses: [], rejected: [], outcomes: [],
      revision: 1, pausedAt: null, graduatedAt: null, updatedAt: '2026-10-16T00:00:00.000Z',
    });
    render();
    expect(text()).toContain('Speak up in meetings without rehearsing');
    expect(text()).toContain('Change wording');
  });

  it('does not replace a stored goal it cannot read, and says so', () => {
    store.save(GOAL_KEY, { schema: 'goal.v9', anything: true });
    render();
    expect(text()).toContain('could not be read');
    expect(text()).not.toContain('Save goal');
    expect(store.load(GOAL_KEY, null)).toEqual({ schema: 'goal.v9', anything: true });
  });

  it('shows the Russian copy when the app language is Russian', () => {
    appMock.current = { lang: 'ru' };
    render();
    expect(text()).toContain('Цели пока нет');
  });
});
