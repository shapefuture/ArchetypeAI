// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./worker-reminder-sweep', () => ({
  runReminderSweep: vi.fn(),
}));

import worker from './worker';
import { runReminderSweep } from './worker-reminder-sweep';

const sweepMock = vi.mocked(runReminderSweep);
const TOKEN = 'test-reminder-run-token';
const ctx = { waitUntil() {}, passThroughOnException() {} } as any;
const summary = { due: 2, sent: 2, rescheduled: 0, skipped: 0, pruned: 0, failed: 0 };

function makeEnv(overrides: Record<string, unknown> = {}) {
  return { FIREBASE_PROJECT_ID: 'demo-archetypeai', REMINDER_RUN_TOKEN: TOKEN, ...overrides } as any;
}

function run(
  options: { method?: string; authorization?: string | null } = {},
  env: unknown = makeEnv(),
): Promise<Response> {
  const headers: Record<string, string> = {};
  const authorization = options.authorization === undefined ? `Bearer ${TOKEN}` : options.authorization;
  if (authorization !== null) headers.Authorization = authorization;
  const request = new Request('https://worker.example/internal/reminders/run', {
    method: options.method ?? 'POST',
    headers,
  });
  return worker.fetch(request, env as any, ctx);
}

describe('POST /internal/reminders/run', () => {
  beforeEach(() => {
    sweepMock.mockReset();
    sweepMock.mockResolvedValue(summary);
  });

  it('does not exist when REMINDER_RUN_TOKEN is unset', async () => {
    const response = await run({}, makeEnv({ REMINDER_RUN_TOKEN: undefined }));
    expect(response.status).toBe(404);
    expect(sweepMock).not.toHaveBeenCalled();
  });

  it('accepts only POST', async () => {
    const response = await run({ method: 'GET' });
    expect(response.status).toBe(405);
    expect(response.headers.get('Allow')).toBe('POST');
    expect(sweepMock).not.toHaveBeenCalled();
  });

  it.each([
    ['no Authorization header', null],
    ['the bare token', TOKEN],
    ['a different token', 'Bearer not-the-token'],
    ['a different scheme', `Basic ${TOKEN}`],
  ])('rejects %s', async (_label, authorization) => {
    const response = await run({ authorization });
    expect(response.status).toBe(401);
    expect(sweepMock).not.toHaveBeenCalled();
  });

  it('runs the sweep and returns its counts for the right token', async () => {
    const response = await run();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(summary);
    expect(sweepMock).toHaveBeenCalledTimes(1);
  });

  it('answers 500 without detail when the sweep fails', async () => {
    sweepMock.mockRejectedValue(new Error(`Firestore rejected ${TOKEN}`));
    const response = await run();
    expect(response.status).toBe(500);
    const body = await response.text();
    expect(body).toBe('Sweep failed');
    expect(body).not.toContain(TOKEN);
  });
});
