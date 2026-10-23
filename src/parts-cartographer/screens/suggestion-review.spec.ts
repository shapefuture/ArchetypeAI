import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const app = vi.hoisted(() => ({ current: {} as Record<string, any> }));
vi.mock('../app.jsx', () => ({ useApp: () => app.current }));

import {
  MAX_QUEUED, SUGGESTIONS_KEY, SuggestionReview, clearSuggestionQueue, dismissSuggestion, loadSuggestionQueue,
  passesShapeCheck, queueCoachReply,
} from './suggestion-review.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const storedQueue = () => JSON.parse(localStorage.getItem(SUGGESTIONS_KEY) ?? '[]');

beforeEach(() => {
  localStorage.clear();
  app.current = { lang: 'en' };
});

describe('Coach replies queued for review', () => {
  it('queues a normal reply as needs-review, because no reviewed evidence is attached', () => {
    const entry = queueCoachReply({ text: '  What would help this part feel heard?  ', mode: 'parts', lang: 'en' });
    expect(entry.decision).toBe('needs-review');
    expect(entry.text).toBe('What would help this part feel heard?');
    expect(storedQueue()).toHaveLength(1);
    expect(storedQueue()[0].id).toBe(entry.id);
  });

  it('refuses an empty reply and keeps no text for it', () => {
    const entry = queueCoachReply({ text: '   ', lang: 'en' });
    expect(entry.decision).toBe('refused');
    expect(entry.text).toBe('');
  });

  it('refuses a reply that fails the bounded shape check', () => {
    expect(queueCoachReply({ text: 'x'.repeat(1201) }).decision).toBe('refused');
    expect(queueCoachReply({ text: 'bad\u0007control' }).decision).toBe('refused');
    expect(passesShapeCheck('x'.repeat(1200))).toBe(true);
  });

  it('keeps the newest entries first and never more than the cap', () => {
    for (let i = 0; i < MAX_QUEUED + 5; i += 1) queueCoachReply({ text: `reply ${i}`, lang: 'en' });
    const queue = loadSuggestionQueue();
    expect(queue).toHaveLength(MAX_QUEUED);
    expect(queue[0].text).toBe(`reply ${MAX_QUEUED + 4}`);
  });

  it('removes one item on dismiss and empties the queue on clear', () => {
    const first = queueCoachReply({ text: 'first', lang: 'en' });
    queueCoachReply({ text: 'second', lang: 'en' });
    dismissSuggestion(first.id);
    expect(loadSuggestionQueue().map((item) => item.text)).toEqual(['second']);
    clearSuggestionQueue();
    expect(loadSuggestionQueue()).toEqual([]);
  });

  it('treats a corrupted stored value as an empty queue', () => {
    localStorage.setItem(SUGGESTIONS_KEY, '{not json');
    expect(loadSuggestionQueue()).toEqual([]);
  });
});

describe('SuggestionReview panel', () => {
  let root: Root;
  let host: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  it('states that a schema match does not certify a suggestion and that nothing is applied', () => {
    act(() => root.render(React.createElement(SuggestionReview)));
    expect(host.textContent).toContain('A schema match does not certify a suggestion');
    expect(host.textContent).toContain('Nothing here is applied automatically');
  });

  it('offers only remove and clear, never an apply action', () => {
    queueCoachReply({ text: 'A reply to review', lang: 'en' });
    act(() => root.render(React.createElement(SuggestionReview)));
    const labels = [...host.querySelectorAll('button')].map((button) => button.textContent);
    expect(labels.every((label) => label === 'Remove' || label === 'Clear all')).toBe(true);
    expect(host.textContent).toContain('A reply to review');
  });

  it('removes an item when its Remove button is pressed', () => {
    queueCoachReply({ text: 'Remove me', lang: 'en' });
    act(() => root.render(React.createElement(SuggestionReview)));
    act(() => { host.querySelector<HTMLButtonElement>('.sugg-remove')?.click(); });
    expect(host.textContent).not.toContain('Remove me');
    expect(loadSuggestionQueue()).toEqual([]);
  });

  it('re-reads the queue when the parent changes refreshKey', () => {
    act(() => root.render(React.createElement(SuggestionReview, { refreshKey: 0 })));
    expect(host.textContent).toContain('No Coach replies are waiting');
    queueCoachReply({ text: 'Added later', lang: 'en' });
    act(() => root.render(React.createElement(SuggestionReview, { refreshKey: 1 })));
    expect(host.textContent).toContain('Added later');
  });

  it('shows the Russian copy by default and when the app language is ru', () => {
    app.current = { lang: 'ru' };
    act(() => root.render(React.createElement(SuggestionReview)));
    expect(host.textContent).toContain('Ничего отсюда не применяется автоматически');
  });
});
