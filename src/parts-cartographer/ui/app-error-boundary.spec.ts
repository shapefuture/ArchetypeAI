import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppErrorBoundary, localDataSnapshot } from './app-error-boundary.jsx';

let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { act(() => root.unmount()); host.remove(); vi.restoreAllMocks(); });

function Crash(): never { throw new Error('boom'); }

describe('AppErrorBoundary', () => {
  it('replaces a crashed app with a recovery screen in the reader language', () => {
    localStorage.setItem('ifs.lang', '"ru"');
    act(() => root.render(React.createElement(AppErrorBoundary, null, React.createElement(Crash))));
    expect(host.textContent).toContain('Что-то пошло не так');
    expect(host.querySelectorAll('button')).toHaveLength(3);
  });

  it('snapshots local data as a backup the Restore screen accepts', () => {
    localStorage.setItem('ifs.parts', '[{"id":"p1"}]');
    localStorage.setItem('plain', 'not json');
    const snapshot = localDataSnapshot();
    expect(snapshot.schema).toBe('parts-cartographer.backup.v2');
    expect(snapshot.data).toEqual({ 'ifs.parts': [{ id: 'p1' }], plain: 'not json' });
  });
});
