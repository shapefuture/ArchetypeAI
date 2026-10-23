import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }));
vi.mock('../../app.jsx', () => ({ useApp: () => appMock.current }));

import { EntryPanel } from './e02-entry.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function render() {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(React.createElement(EntryPanel)));
}

function button(label: string): HTMLButtonElement {
  const found = Array.from(host!.querySelectorAll('button')).find((b) => b.textContent === label);
  if (!found) throw new Error(`button "${label}" not found`);
  return found;
}

beforeEach(() => {
  const titles: Record<string, string> = { routeInquiryTitle: 'Think through one situation' };
  appMock.current = { lang: 'en', go: vi.fn(), setOverlay: vi.fn(), t: (key: string) => titles[key] ?? key };
  localStorage.clear();
});

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe('E02 entry panel', () => {
  it('offers the three needs and no assessment by default', () => {
    render();
    expect(host?.textContent).toContain('What do you need right now?');
    expect(host?.querySelectorAll('[role="group"] button')).toHaveLength(3);
    expect(host?.textContent).not.toContain('147');
  });

  it('names the unavailable practice honestly when the catalogue has no reviewed practice', () => {
    render();
    act(() => button('I need to calm down now').click());
    expect(host?.textContent).toContain('No reviewed practice is available yet');
  });

  it('offers the situation inquiry by its name, with a stopping point, and opens it in the check-in layer', () => {
    render();
    act(() => button('I am facing a situation').click());
    expect(host?.textContent).toContain('Think through one situation');
    expect(host?.textContent).not.toContain('situation-inquiry');
    expect(button('That is enough for now')).toBeTruthy();
    act(() => button('Open').click());
    expect(appMock.current!.setOverlay).toHaveBeenCalledWith('checkin');
  });

  it('offers no open or stop control when nothing can be started, rather than a fake first result', () => {
    render();
    act(() => button('I need to calm down now').click());
    expect(host?.querySelector('[role="status"]')?.textContent).toBeTruthy();
    expect(Array.from(host!.querySelectorAll('button')).some((b) => b.textContent === 'That is enough for now')).toBe(false);
  });
});
