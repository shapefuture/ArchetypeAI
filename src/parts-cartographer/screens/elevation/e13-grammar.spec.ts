import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }));
vi.mock('../../app.jsx', () => ({ useApp: () => appMock.current }));

import { GrammarPanel } from './e13-grammar.jsx';
import { predict } from '../../elevation/e13-grammar.ts';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function render() {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(React.createElement(GrammarPanel)));
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

describe('E13 grammar panel', () => {
  it('draws one row per core area, generated from the same registry the rules use', () => {
    render();
    const rows = host!.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(4);
    const firstRowCells = Array.from(rows[0].querySelectorAll('td')).map((td) => td.textContent);
    const expected = ['save', 'undo', 'pause', 'inspect', 'return'].map((primitive) => (predict('assessment', primitive as never).supported ? 'Yes' : 'Not here'));
    expect(firstRowCells).toEqual(expected);
  });

  it('names no clinical claim and keeps the explanation in plain words', () => {
    render();
    expect(host?.textContent).toContain('What you can save or undo');
    expect(host?.textContent).not.toMatch(/validated|proven|clinically/i);
  });
});
