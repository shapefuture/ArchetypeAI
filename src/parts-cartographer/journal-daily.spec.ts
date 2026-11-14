import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PROMPT_HIDDEN_KEY, localDay, promptForDay } from './core/daily-prompts';

const app = { lang: 'en' as 'en' | 'ru' };
vi.mock('./app.jsx', () => ({ useApp: () => ({ t: (key: string) => key, lang: app.lang, setOverlay: vi.fn(), toast: vi.fn() }) }));
import { Journal } from './overlays.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function render() {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => { root?.render(React.createElement(Journal)); });
}
const button = (label: string) => [...(host?.querySelectorAll('button') ?? [])].find((b) => b.textContent?.trim() === label) as HTMLButtonElement;
const click = (label: string) => act(() => { button(label).click(); });
function type(text: string) {
  const area = host?.querySelector('textarea') as HTMLTextAreaElement;
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
  act(() => { setter?.call(area, text); area.dispatchEvent(new Event('input', { bubbles: true })); });
}

beforeEach(() => { localStorage.clear(); app.lang = 'en'; });
afterEach(() => { act(() => { root?.unmount(); }); host?.remove(); root = null; host = null; });

describe('daily question in the journal', () => {
  it('shows today\'s question as optional, and "another" moves to the next one', () => {
    render();
    expect(host?.textContent).toContain('jDailyT');
    expect(host?.textContent).toContain(promptForDay(localDay()).en);
    click('jDailyAnother');
    expect(host?.textContent).toContain(promptForDay(localDay(), 1).en);
  });

  it('answering links the saved entry to the question and sets its type', () => {
    render();
    const daily = promptForDay(localDay());
    click('jDailyAnswer');
    expect(button(`jDailyClear`)).toBeTruthy();
    type('At lunch my shoulders were tight');
    click('✎ jSave');
    const [entry] = JSON.parse(localStorage.getItem('ifs.journal') ?? '[]');
    expect(entry).toMatchObject({ what: 'At lunch my shoulders were tight', kind: daily.kind, promptId: daily.id });
    expect(host?.textContent).toContain(`❔ ${daily.en}`);
  });

  it('saves a plain entry without a question when the person writes freely', () => {
    render();
    type('Just a note');
    click('✎ jSave');
    const [entry] = JSON.parse(localStorage.getItem('ifs.journal') ?? '[]');
    expect(entry.promptId).toBeUndefined();
  });

  it('"Not today" hides the question until tomorrow', () => {
    render();
    click('jDailyHide');
    expect(host?.textContent).not.toContain('jDailyT');
    expect(localStorage.getItem(PROMPT_HIDDEN_KEY)).toBe(localDay());
    localStorage.setItem(PROMPT_HIDDEN_KEY, '2000-01-01');
    act(() => { root?.unmount(); }); host?.remove();
    render();
    expect(host?.textContent).toContain('jDailyT');
  });

  it('shows the Russian question in Russian', () => {
    app.lang = 'ru';
    render();
    expect(host?.textContent).toContain(promptForDay(localDay()).ru);
  });
});
