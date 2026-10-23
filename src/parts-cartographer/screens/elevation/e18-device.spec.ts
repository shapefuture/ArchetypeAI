import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }));
vi.mock('../../app.jsx', () => ({ useApp: () => appMock.current }));

import { DeviceEnvelopePanel, DEVICE_ENVELOPE_KEY } from './e18-device.jsx';
import { store } from '../../core/local-store';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function render() {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(React.createElement(DeviceEnvelopePanel)));
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

describe('E18 device panel', () => {
  it('shows every measure as pending, and never as a measurement, until a run exists', () => {
    render();
    expect(host?.textContent).toContain('No measurement run yet');
    expect(host?.textContent).toContain('Memory in use: ');
    expect(host?.querySelectorAll('li')).toHaveLength(5);
  });

  it('saves the declared device and asks for every field when one is missing', () => {
    render();
    act(() => (host!.querySelector('button') as HTMLButtonElement).click());
    expect(host?.textContent).toContain('Please fill in every field');
    expect(store.load(DEVICE_ENVELOPE_KEY, null)).toEqual({ handset: '', os: '', browser: '', network: '' });
  });
});
