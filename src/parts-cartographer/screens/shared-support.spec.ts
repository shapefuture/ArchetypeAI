import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, any> }));
vi.mock('../app.jsx', () => ({ useApp: () => appMock.current }));

import {
  SHARED_KEY,
  SharedSupportPanel,
  applyFieldEdit,
  createNote,
  readSharedStore,
  repeatedLabels,
} from './shared-support.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const CHECKIN_KEY = 'INNERVERSE_CHECKINS_V1';
const MEMORY_KEY = 'INNERVERSE_MEMORY_V1';

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function stored() {
  return JSON.parse(localStorage.getItem(SHARED_KEY) ?? 'null');
}

function seedShared(overrides: Record<string, unknown> = {}) {
  localStorage.setItem(SHARED_KEY, JSON.stringify({
    shared: true,
    partnerName: 'Ana',
    doc: {
      fields: {
        plan: { value: 'Talk after dinner', author: 'a' },
        'support idea': { value: 'Short walk together', author: 'b' },
      },
      history: [],
    },
    ...overrides,
  }));
}

async function render(lang = 'en') {
  appMock.current = { lang };
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => { root?.render(React.createElement(SharedSupportPanel)); });
}

function buttonIn(scope: Element | null | undefined, label: string) {
  return [...(scope?.querySelectorAll<HTMLButtonElement>('button') ?? [])].find((b) => b.textContent === label) ?? null;
}

function noteCard(name: string) {
  return [...(host?.querySelectorAll('.card.flat') ?? [])].find((el) => el.querySelector('b')?.textContent === name) ?? null;
}

async function click(el: Element | null | undefined) {
  if (!el) throw new Error('missing element');
  await act(async () => { (el as HTMLElement).click(); });
}

function typeInto(el: HTMLTextAreaElement | HTMLInputElement | null, value: string) {
  if (!el) throw new Error('missing field');
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  act(() => {
    Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

beforeEach(() => {
  localStorage.clear();
  appMock.current = null;
});

afterEach(async () => {
  await act(async () => { root?.unmount(); });
  root = null;
  host?.remove();
  host = null;
});

const doc = {
  fields: {
    plan: { value: 'Talk after dinner', author: 'a' as const },
    idea: { value: 'Short walk', author: 'b' as const },
  },
  history: [],
};

describe('shared support storage', () => {
  it('starts with sharing off and drops partner fields it cannot validate', () => {
    // JSON.parse creates an own "__proto__" key, which is what a corrupt stored value could contain.
    const hostile = JSON.parse('{"doc":{"fields":{"__proto__":{"value":"x","author":"a"},"bad":{"value":1,"author":"a"},"ok":{"value":"fine","author":"b"}}}}');
    const parsed = readSharedStore(hostile);
    expect(parsed.shared).toBe(false);
    expect(Object.keys(parsed.doc.fields)).toEqual(['ok']);
    expect(Object.prototype.hasOwnProperty.call(parsed.doc.fields, '__proto__')).toBe(false);
  });

  it('treats a corrupt value as nothing shared', () => {
    expect(readSharedStore('shared')).toEqual({ shared: false, partnerName: '', doc: { fields: {}, history: [] } });
  });
});

describe('editing a shared document', () => {
  it('lets the person change their own note while sharing is off', () => {
    const result = applyFieldEdit(doc, { by: 'a', field: 'plan', value: 'Talk at lunch', consent: false, shared: false });
    expect(result.applied).toBe(true);
    expect(result.doc.fields.plan.value).toBe('Talk at lunch');
  });

  it('never changes a partner note while sharing is off, even with consent', () => {
    const result = applyFieldEdit(doc, { by: 'a', field: 'idea', value: 'Changed', consent: true, shared: false });
    expect(result).toMatchObject({ applied: false, reason: 'not-shared' });
    expect(result.doc).toBe(doc);
  });

  it('needs the author\'s agreement before changing a partner note, and records that agreement', () => {
    expect(applyFieldEdit(doc, { by: 'a', field: 'idea', value: 'Walk before work', consent: false, shared: true })).toMatchObject({ applied: false, reason: 'needs-consent' });
    const agreed = applyFieldEdit(doc, { by: 'a', field: 'idea', value: 'Walk before work', consent: true, shared: true });
    expect(agreed.applied).toBe(true);
    expect(agreed.doc.history).toEqual([{ field: 'idea', by: 'a', from: 'Short walk', to: 'Walk before work', consented: true }]);
  });

  it('records an ordinary own-note change without marking it as agreed', () => {
    const { doc: next } = applyFieldEdit(doc, { by: 'a', field: 'plan', value: 'Talk at lunch', consent: false, shared: false });
    expect(next.history).toEqual([{ field: 'plan', by: 'a', from: 'Talk after dinner', to: 'Talk at lunch' }]);
  });

  it('refuses an empty change and an unchanged one', () => {
    expect(applyFieldEdit(doc, { by: 'a', field: 'plan', value: '  ', consent: false, shared: true }).reason).toBe('empty');
    expect(applyFieldEdit(doc, { by: 'a', field: 'plan', value: 'Talk after dinner', consent: false, shared: true }).reason).toBe('unchanged');
  });

  it('will not take a reserved name or overwrite an existing note as a new one', () => {
    expect(createNote(doc, { key: '__proto__', text: 'x', author: 'a', shared: true }).reason).toBe('invalid-name');
    expect(createNote(doc, { key: 'plan', text: 'x', author: 'a', shared: true }).reason).toBe('exists');
    expect(createNote(doc, { key: 'lunch', text: 'Eat together', author: 'a', shared: false }).applied).toBe(true);
  });
});

describe('repeated labels', () => {
  it('counts repeats across check-in labels and the person\'s own memories, with no verdict field', () => {
    const patterns = repeatedLabels(
      [{ eventType: 'work' }, { eventType: 'Work ' }, { eventType: 'evening' }, { date: 'x' }],
      { memories: [
        { id: 'a', text: 'Work', source: 'user-entry', derivedFrom: [], saved: true },
        { id: 'b', text: 'Work', source: 'model-inference', derivedFrom: [], saved: false },
      ] },
    );
    expect(patterns).toEqual([{ description: 'work', occurrences: 3 }]);
    expect(Object.keys(patterns[0]).some((k) => /compat|score|verdict/i.test(k))).toBe(false);
  });
});

describe('shared support panel', () => {
  it('says plainly that the partner cannot see anything yet', async () => {
    seedShared({ shared: false, partnerName: '' });
    await render('en');
    expect(host?.textContent).toContain('Stored on this device only.');
    expect(host?.textContent).toContain('cannot see any of this');
  });

  it('will not turn sharing on until a partner name is typed', async () => {
    seedShared({ shared: false, partnerName: '' });
    await render('en');
    const turnOn = buttonIn(host, 'Turn on shared support with Partner');
    expect(turnOn?.disabled).toBe(true);
    typeInto(host?.querySelector<HTMLInputElement>('#shared-partner-name') ?? null, 'Ana');
    await click(buttonIn(host, 'Turn on shared support with Ana'));
    expect(stored().shared).toBe(true);
  });

  it('stops shared access at once and keeps the person\'s own notes and count', async () => {
    seedShared();
    await render('en');
    expect(host?.textContent).toContain('Your side owns their own entries; shared support is on.');
    expect(host?.textContent).toContain('Your own notes: 1.');

    await click(buttonIn(host, 'Stop shared support'));
    expect(stored().shared).toBe(false);
    expect(stored().doc.fields.plan.value).toBe('Talk after dinner');
    expect(host?.textContent).toContain('Your own notes: 1.');
    expect(noteCard('support idea')?.textContent).toContain('cannot change right now');
    expect(buttonIn(noteCard('support idea'), 'Edit')).toBeNull();
    expect(buttonIn(noteCard('plan'), 'Edit')).toBeDefined();
  });

  it('asks for the partner\'s agreement before changing their note, and shows the history', async () => {
    seedShared();
    await render('en');

    await click(buttonIn(noteCard('support idea'), 'Edit'));
    typeInto(noteCard('support idea')?.querySelector<HTMLTextAreaElement>('textarea') ?? null, 'Walk before work');
    await click(buttonIn(noteCard('support idea'), 'Save change'));
    expect(host?.querySelector('[role="status"]')?.textContent).toContain('It changes only if they agree');
    expect(stored().doc.fields['support idea'].value).toBe('Short walk together');

    await click(noteCard('support idea')?.querySelector<HTMLInputElement>('input[type="checkbox"]'));
    await click(buttonIn(noteCard('support idea'), 'Save change'));
    expect(stored().doc.fields['support idea'].value).toBe('Walk before work');
    expect(host?.textContent).toContain('partner agreed (confirmed here)');
  });

  it('shows repeated labels as counts under a not-a-diagnosis note', async () => {
    seedShared();
    localStorage.setItem(CHECKIN_KEY, JSON.stringify([{ date: '2026-10-14T09:00:00.000Z', arousal: 1, eventType: 'work' }, { date: '2026-10-15T09:00:00.000Z', arousal: 0, eventType: 'work' }]));
    localStorage.setItem(MEMORY_KEY, JSON.stringify({ memories: [{ id: 'm', text: 'Late reply', source: 'user-entry', derivedFrom: [], saved: true }] }));
    await render('en');

    expect(host?.textContent).toContain('Things to consider');
    expect(host?.textContent).toContain('"work" appears 2 times');
    expect(host?.textContent).toContain('not a diagnosis');
  });

  it('renders in Russian when the app language is ru', async () => {
    seedShared();
    await render('ru');
    expect(host?.textContent).toContain('Записи, которые ведут два человека');
    expect(host?.textContent).toContain('Хранится только на этом устройстве.');
  });
});
