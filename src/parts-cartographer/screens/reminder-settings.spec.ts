import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const appMock = vi.hoisted(() => ({ current: null as null | Record<string, any> }));
const pushMock = vi.hoisted(() => ({
  enablePushReminder: vi.fn(),
  disablePushReminder: vi.fn(),
}));
vi.mock('../app.jsx', () => ({ useApp: () => appMock.current }));
vi.mock('../core/push.ts', () => pushMock);

import { ReminderSettings } from './reminder-settings.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const REMINDERS_KEY = 'INNERVERSE_REMINDERS_V1';
const NOON = new Date(2026, 9, 16, 12, 0, 0);

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function stored() {
  return JSON.parse(localStorage.getItem(REMINDERS_KEY) ?? 'null');
}

async function render(lang = 'en') {
  appMock.current = { lang };
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => { root?.render(React.createElement(ReminderSettings)); });
}

function buttonIn(scope: Element | null | undefined, label: string) {
  return [...(scope?.querySelectorAll<HTMLButtonElement>('button') ?? [])].find((b) => b.textContent === label) ?? null;
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
  pushMock.enablePushReminder.mockReset();
  pushMock.disablePushReminder.mockReset();
  pushMock.disablePushReminder.mockResolvedValue(undefined);
  // Only the clock is faked, so quiet-hours status is the same whatever time the suite runs.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOON);
});

afterEach(async () => {
  await act(async () => { root?.unmount(); });
  root = null;
  host?.remove();
  host = null;
  vi.useRealTimers();
});

describe('device reminders', () => {
  it('never touches push or notification permission on render', async () => {
    await render('en');
    expect(pushMock.enablePushReminder).not.toHaveBeenCalled();
    expect(pushMock.disablePushReminder).not.toHaveBeenCalled();
    expect(stored()).toBeNull();
  });

  it('asks for the device channel only when the person presses the allow button', async () => {
    pushMock.enablePushReminder.mockResolvedValue('enabled');
    await render('en');

    await click(buttonIn(host, 'On this device'));
    expect(pushMock.enablePushReminder).not.toHaveBeenCalled();
    expect(host?.textContent).toContain('Press "Allow device reminders" to finish turning them on.');

    await click(buttonIn(host, 'Allow device reminders'));
    expect(pushMock.enablePushReminder).toHaveBeenCalledTimes(1);
    expect(stored()).toMatchObject({ optIn: true, channel: 'device', deviceConfirmed: true });
    expect(host?.textContent).toContain('Device reminders are on for this browser.');
  });

  it('keeps reminders off when the browser does not allow notifications', async () => {
    pushMock.enablePushReminder.mockResolvedValue('denied');
    await render('en');

    await click(buttonIn(host, 'On this device'));
    await click(buttonIn(host, 'Allow device reminders'));
    expect(stored()).toMatchObject({ optIn: false, channel: 'device', deviceConfirmed: false });
    expect(host?.querySelector('[role="status"]')?.textContent).toContain('no device reminders will be sent');
    expect(host?.textContent).toContain('Device reminders wait until you allow them above.');
  });

  it('removes the device token when the person switches device reminders off', async () => {
    localStorage.setItem(REMINDERS_KEY, JSON.stringify({ optIn: true, channel: 'device', deviceConfirmed: true }));
    await render('en');

    await click(buttonIn(host, 'In the app'));
    expect(pushMock.disablePushReminder).toHaveBeenCalledTimes(1);
    expect(stored()).toMatchObject({ optIn: true, channel: 'in-app', deviceConfirmed: false });
  });
});

describe('reminder channel and status', () => {
  it('turns in-app reminders on with a plain click and needs no permission', async () => {
    await render('en');
    await click(buttonIn(host, 'In the app'));
    expect(stored()).toMatchObject({ optIn: true, channel: 'in-app' });
    expect(pushMock.enablePushReminder).not.toHaveBeenCalled();
    expect(host?.textContent).toContain('A reminder can appear in the app when one is due.');
  });

  it('turns everything off and says so', async () => {
    localStorage.setItem(REMINDERS_KEY, JSON.stringify({ optIn: true, channel: 'in-app' }));
    await render('en');
    await click(buttonIn(host, 'Off'));
    expect(stored()).toMatchObject({ optIn: false, channel: null });
    expect(host?.textContent).toContain('Reminders are off.');
  });

  it('pauses for the rest of the local day when the person skips today, and resumes on request', async () => {
    localStorage.setItem(REMINDERS_KEY, JSON.stringify({ optIn: true, channel: 'in-app' }));
    await render('en');

    await click(buttonIn(host, 'Skip today'));
    expect(stored()).toMatchObject({ optIn: true, channel: 'in-app', skipDate: '2026-10-16', skipped: 1 });
    expect(host?.textContent).toContain('Paused for today. Reminders return tomorrow.');

    await click(buttonIn(host, 'Resume today'));
    expect(stored()).toMatchObject({ skipDate: null, skipped: 1 });
    expect(host?.textContent).toContain('A reminder can appear in the app when one is due.');
  });

  it('shows quiet hours with a default window when the person turns them on', async () => {
    localStorage.setItem(REMINDERS_KEY, JSON.stringify({ optIn: true, channel: 'in-app' }));
    await render('en');

    await click(host?.querySelector<HTMLInputElement>('input[type="checkbox"]'));
    expect(stored().quietHours).toEqual({ startHour: 22, endHour: 7 });
    expect(stored().optIn).toBe(true);
  });
});

describe('next small move', () => {
  it('never selects a move on its own, and only keeps one the person picks', async () => {
    localStorage.setItem(REMINDERS_KEY, JSON.stringify({ optIn: true, channel: 'in-app' }));
    await render('en');

    typeInto(host?.querySelector<HTMLTextAreaElement>('textarea') ?? null, 'Stand up\n   \nCall one friend');
    expect(host?.textContent).not.toContain('Your next small move');
    expect(stored()?.move ?? null).toBeNull();

    await click(buttonIn(host, 'Call one friend'));
    expect(stored().move).toBe('Call one friend');
    expect(host?.textContent).toContain('Your next small move: Call one friend');

    await click(buttonIn(host, 'Clear'));
    expect(stored().move).toBeNull();
  });

  it('offers no empty option', async () => {
    await render('en');
    typeInto(host?.querySelector<HTMLTextAreaElement>('textarea') ?? null, '   \n\t');
    expect(host?.querySelectorAll('button.chip')).toHaveLength(0);
  });
});

describe('reminder settings screen', () => {
  it('renders in Russian when the app language is ru', async () => {
    await render('ru');
    expect(host?.textContent).toContain('Мягкие напоминания вернуться');
    expect(host?.textContent).toContain('Пропустить сегодня');
  });
});
