import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STRINGS } from '../i18n/strings';
import { LINKS_KEY } from '../core/part-links';

// The Connections section of the part sheet: listing a part's links with their notes, adding one, removing one,
// and showing the links the Parts map 2.0 states. The app context is stubbed, as in the Parts 2 screen specs.

const parts = [
  { id: 'critic', name: 'Critic', family: 'manager' },
  { id: 'shame', name: 'Shame', family: 'exile' },
  { id: 'binge', name: 'Binger', family: 'firefighter' },
];
const app = vi.hoisted(() => ({ lang: 'en', toast: vi.fn() }));
vi.mock('../app.jsx', () => ({ useApp: () => ({ parts, t: (k: string) => (STRINGS as any)[k]?.en ?? k, ...app }) }));
import { PartConnections } from './part-connections.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('part connections', () => {
  let host: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    localStorage.clear();
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
  });
  afterEach(() => {
    act(() => root.unmount());
    host.remove();
    localStorage.clear();
  });

  const render = (id: string) => act(() => { root.render(React.createElement(PartConnections, { part: parts.find((p) => p.id === id) })); });
  const button = (text: string) => Array.from(host.querySelectorAll('button')).find((b) => b.textContent?.includes(text))!;
  const stored = () => JSON.parse(localStorage.getItem(LINKS_KEY) ?? '[]');

  it("connects the part to another with a kind and the person's own words, and lists it with its note", () => {
    render('critic');
    expect(host.textContent).toContain(STRINGS.linksNone.en);
    act(() => button(STRINGS.connect.en).click());
    const select = host.querySelector('select')!;
    act(() => { select.value = 'shame'; select.dispatchEvent(new Event('change', { bubbles: true })); });
    act(() => button(STRINGS.linkKind_protects.en).click());
    const textarea = host.querySelector('textarea')!;
    const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!;
    act(() => { setValue.call(textarea, 'It attacks first so no one else can'); textarea.dispatchEvent(new Event('input', { bubbles: true })); });
    act(() => button(STRINGS.linkSave.en).click());
    expect(stored()).toMatchObject([{ from: 'critic', to: 'shame', kind: 'protects', note: 'It attacks first so no one else can' }]);
    expect(host.textContent).toContain('Critic protects Shame');
    expect(host.textContent).toContain('It attacks first so no one else can');
    // Protecting chains the two into a complex around the exile.
    expect(host.textContent).toContain(`${STRINGS.complexLabel.en}: Shame`);
  });

  it('shows the link on the other part too, and removes it from there', () => {
    localStorage.setItem(LINKS_KEY, JSON.stringify([{ id: 'l1', from: 'critic', to: 'binge', kind: 'polarized', note: 'They fight about food' }]));
    render('binge');
    expect(host.textContent).toContain('Critic is polarised with Binger');
    act(() => button(STRINGS.linkRemove.en).click());
    expect(stored()).toEqual([]);
    expect(host.textContent).not.toContain('They fight about food');
  });

  it('cannot save without choosing the other part', () => {
    render('critic');
    act(() => button(STRINGS.connect.en).click());
    expect(button(STRINGS.linkSave.en).disabled).toBe(true);
  });
});
