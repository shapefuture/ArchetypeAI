import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }));
vi.mock('../../app.jsx', () => ({ useApp: () => appMock.current }));
vi.mock('../../core/file-download', () => ({ downloadText: vi.fn() }));

import { PocketCardPanel } from './e14-export.jsx';
import { MEMORY_KEY } from '../memory-panel.jsx';
import { store } from '../../core/local-store';
import { downloadText } from '../../core/file-download';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function render() {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(React.createElement(PocketCardPanel)));
}

function button(label: string): HTMLButtonElement {
  const found = Array.from(host!.querySelectorAll('button')).find((b) => b.textContent === label);
  if (!found) throw new Error(`button "${label}" not found`);
  return found;
}

beforeEach(() => {
  appMock.current = { lang: 'en' };
  localStorage.clear();
  vi.mocked(downloadText).mockClear();
  store.save(MEMORY_KEY, [
    { id: 'm1', text: 'Pause before answering', source: 'user-entry', derivedFrom: [], saved: true },
    { id: 'm2', text: 'Not saved yet', source: 'model-inference', derivedFrom: [], saved: false },
  ]);
});

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe('E14 pocket card panel', () => {
  it('lists only saved notes, so an unsaved suggestion cannot be exported', () => {
    render();
    expect(host?.textContent).toContain('Pause before answering');
    expect(host?.textContent).not.toContain('Not saved yet');
  });

  it('shows a preview first and downloads only when the person asks', () => {
    render();
    act(() => button('Pause before answering').click());
    expect(host?.textContent).toContain('Preview');
    expect(downloadText).not.toHaveBeenCalled();
    act(() => (host!.querySelector('input[type="checkbox"]') as HTMLInputElement).click());
    act(() => button('Download text card').click());
    expect(downloadText).toHaveBeenCalledTimes(1);
    const [text, fileName] = vi.mocked(downloadText).mock.calls[0];
    expect(text).toContain('Pause before answering');
    expect(fileName).toMatch(/\.txt$/);
  });
});
