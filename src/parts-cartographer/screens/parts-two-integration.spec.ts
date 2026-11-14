import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UI_COPY } from '../../shared/core/data/assessment2/content';

vi.mock('../app.jsx', () => ({ useApp: () => ({ lang: 'en' }) }));
import { IntegrationProfile } from './parts-two.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;
afterEach(() => { act(() => { root?.unmount(); }); host?.remove(); root = null; host = null; });

function render(locale: 'en' | 'ru', result: unknown) {
  const copy = UI_COPY as unknown as Record<string, Record<string, string>>;
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => { root?.render(React.createElement(IntegrationProfile, { T: (key: string) => copy[key][locale], tx: (bi: Record<string, string>) => bi[locale], result })); });
  return host.textContent ?? '';
}

const result = {
  centre: { awareness: null, will: null, qualities: [] },
  parts: [{ key: 'member:inner_critic', kind: 'protector', family: 'attack', blending: 'itIsMe' }],
};

describe('integration profile on the result screen', () => {
  it('shows the five capacities, the modes used and unused, and reflection questions for the unmeasured two', () => {
    const text = render('en', result);
    for (const label of ['Awareness', 'Regulation', 'Flexibility', 'Reality contact', 'Accountability']) expect(text).toContain(label);
    expect(text).toContain('Your protectors use: Take');
    expect(text).toContain('None of them use: Receive, Accept, Give');
    expect(text).toContain('parts that run you: 1');
    expect(text).toContain('Awarenessnot answered');
    expect(text).toContain('Not measured here. A question to reflect on:');
    expect(/score|rank\b|total/i.test(text.replace('not added up, ranked', ''))).toBe(false);
  });

  it('renders in Russian', () => {
    const text = render('ru', result);
    expect(text).toContain('Профиль интеграции');
    expect(text).toContain('Ваши защитники используют: Заявлять');
  });
});
