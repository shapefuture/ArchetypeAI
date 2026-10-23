import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, unknown> }));
vi.mock('../../app.jsx', () => ({ useApp: () => appMock.current }));

import { ReportReadStatus } from './e16-report-read.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function render(client: Record<string, unknown>) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(React.createElement(ReportReadStatus, { client })));
}

beforeEach(() => {
  appMock.current = { lang: 'en', user: { uid: 't1' } };
});

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe('E16 report read status', () => {
  it('allows the read only when the client has shared a report', () => {
    render({ clientUid: 'c1', archived: false, summary: { headline: 'Shared' } });
    expect(host?.textContent).toContain('You can read this client');
  });

  it('explains the refusal in plain words when no report was shared', () => {
    render({ clientUid: 'c2', archived: false, summary: null });
    expect(host?.textContent).toContain('The client has not shared a report with you.');
  });

  it('says the comparison is not built, so the status line is not mistaken for it', () => {
    render({ clientUid: 'c1', archived: false, summary: { headline: 'Shared' } });
    expect(host?.textContent).toContain('Side-by-side comparison and the 3+1 view are not built yet');
  });
});
