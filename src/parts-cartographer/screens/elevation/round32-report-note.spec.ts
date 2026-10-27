// Round 32 probe (critic). ReportReadStatus (e16-report-read.jsx) is rendered on every client card of the therapist dashboard
// (innerverse.jsx clientCard). It appends its COPY.note after the status line, and that note is a developer status
// ("Side-by-side comparison and the 3+1 view are not built yet."), in English and in Russian. A person reading the product
// sees unfinished engineering text on each client card. Expected: the card shows only the access status to the therapist.
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { appState } = vi.hoisted(() => ({ appState: { lang: 'en' as 'en' | 'ru', uid: 'uid_therapist' } }));
vi.mock('../../app.jsx', () => ({
  useApp: () => ({ lang: appState.lang, user: { uid: appState.uid } }),
}));

import { ReportReadStatus } from './e16-report-read.jsx';

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

const sharedClient = {
  uid: 'uid_client', clientUid: 'uid_client', clientEmail: 'client@example.com', linkedAt: '2026-10-01T10:00:00.000Z',
  archived: false, summary: { headline: 'The Proving Ground' },
};

function renderCard(lang: 'en' | 'ru') {
  appState.lang = lang;
  act(() => { root.render(React.createElement(ReportReadStatus, { client: sharedClient as any })); });
  return host.textContent ?? '';
}

describe('round32: the therapist client card shows no developer note', () => {
  it('control: the access status line is shown for a client who shared a summary', () => {
    expect(renderCard('en')).toContain("You can read this client's shared report.");
  });

  it('the English card does not show the developer note', () => {
    expect(renderCard('en')).not.toContain('not built yet');
  });

  it('the Russian card does not show the developer note', () => {
    expect(renderCard('ru')).not.toContain('пока не реализованы');
  });
});
