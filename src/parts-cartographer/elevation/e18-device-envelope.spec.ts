import { beforeEach, describe, expect, it } from 'vitest';
import type { AmbienceSignals } from '../services/ambience-gate';
import {
  INITIAL_SCENE, METHOD, declareEnvelope, emitSample, judge, loopAllowed, motionPlan, readingFor, recordSample,
  reduceScene, renderCostFor, sanitizeSample, sceneCalls, staticParity, summarize, thermalReading, toTelemetryPair,
  type LocalMeasures, type SceneLifecycle, type TelemetrySink,
} from './e18-device-envelope';

const full = declareEnvelope({ handset: 'Reference phone A', os: 'Android 15', browser: 'Chrome 130', network: 'wifi' }).envelope;
const partial = declareEnvelope({ handset: 'Reference phone A', os: 'Android 15', browser: 'Chrome 130' }).envelope;
const NONE: AmbienceSignals = { hidden: false, typing: false, error: false };
const recorded: Array<[string, number | string]> = [];
const sink: TelemetrySink = { record: (itemId, value) => { recorded.push([itemId, value]); } };

const enter = (s: SceneLifecycle, webgl = true): SceneLifecycle => reduceScene(s, { type: 'enter', webgl }).state;
const signal = (s: SceneLifecycle, signals: AmbienceSignals, now = 0): SceneLifecycle => reduceScene(s, { type: 'signals', signals, now }).state;

describe('E18 local instrumentation and device envelope (step 04)', () => {
  beforeEach(() => { recorded.length = 0; });

  it('accepts only an allow-listed metric with a finite in-range value', () => {
    expect(sanitizeSample({ metric: 'frame-ms', value: 16.7 })).toEqual({ ok: true, sample: { metric: 'frame-ms', value: 16.7 } });
    expect(sanitizeSample({ metric: 'battery-level', value: 0.4 })).toEqual({ ok: false, reason: 'unknown-metric' });
    expect(sanitizeSample({ metric: 'frame-ms', value: Number.NaN })).toEqual({ ok: false, reason: 'non-numeric' });
    expect(sanitizeSample({ metric: 'frame-ms', value: -1 })).toEqual({ ok: false, reason: 'out-of-range' });
    expect(sanitizeSample('frame-ms')).toEqual({ ok: false, reason: 'not-an-object' });
  });

  it('rejects any extra field, so a free-text line never enters local instrumentation', () => {
    const attempt = { metric: 'frame-ms', value: 20, note: 'a private journal line' };
    expect(sanitizeSample(attempt)).toEqual({ ok: false, reason: 'extra-field' });
    expect(emitSample(sink, attempt)).toEqual({ ok: false, reason: 'extra-field' });
    expect(recorded).toEqual([]);
  });

  it('sends only a bucket label to the existing telemetry store, never a raw value', () => {
    expect(emitSample(sink, { metric: 'frame-ms', value: 21.4 })).toMatchObject({ ok: true, pair: { itemId: 'e18.frame-ms', value: '<=33.4ms' } });
    expect(emitSample(sink, { metric: 'frame-ms', value: 999 })).toMatchObject({ ok: true, pair: { value: '>50ms' } });
    expect(toTelemetryPair({ metric: 'heap-mb', value: 100 })).toEqual({ itemId: 'e18.heap-mb', value: '<=128MB' });
    expect(recorded).toEqual([['e18.frame-ms', '<=33.4ms'], ['e18.frame-ms', '>50ms']]);
  });

  it('keeps bounded per-metric buffers and drops the oldest values first', () => {
    let measures: LocalMeasures = {};
    for (const value of [1, 2, 3, 4, 5]) measures = recordSample(measures, { metric: 'entry-ms', value }, 3);
    expect(measures['entry-ms']).toEqual([3, 4, 5]);
    expect(measures['frame-ms']).toBeUndefined();
    expect(summarize([10, 20, 30, 40])).toEqual({ count: 4, p50: 20, p95: 40, max: 40 });
  });

  it('recovers sustained heat without inventing a reading: no samples is pending no-run, and heat stays pending with no browser method', () => {
    expect(readingFor('frame-ms', undefined, full)).toEqual({ status: 'pending', reason: 'no-run' });
    expect(summarize([])).toBeNull();
    expect(METHOD.thermal).toBe('none');
    expect(thermalReading()).toEqual({ status: 'pending', reason: 'method-none' });
  });

  it('declares the envelope only with handset, OS, browser and network, and reports invalid labels as pending', () => {
    expect(partial.network.status).toBe('pending');
    const bad = declareEnvelope({ handset: '<b>my notes here</b>', os: 'Android 15', browser: 'Chrome 130', network: 'satellite' });
    expect(bad.envelope.handset.status).toBe('pending');
    expect(bad.problems).toEqual(['handset: not a short device label', 'network: not a known class']);
    const long = declareEnvelope({ handset: 'x'.repeat(41), os: 'Android 15', browser: 'Chrome 130', network: 'wifi' });
    expect(long.problems).toEqual(['handset: not a short device label']);
  });

  it('observations without a complete envelope are not device evidence, and no frozen budget never reads as within', () => {
    const values = [10, 20, 30];
    const budgets = { 'frame-ms': { p95Max: 50 } };
    expect(judge(readingFor('frame-ms', values, partial), budgets, 'frame-ms')).toEqual({ verdict: 'pending', reason: 'envelope-incomplete' });
    expect(judge(readingFor('frame-ms', values, full), budgets, 'frame-ms')).toEqual({ verdict: 'within', p95: 30 });
    expect(judge(readingFor('frame-ms', [10, 20, 90], full), budgets, 'frame-ms')).toEqual({ verdict: 'over', p95: 90 });
    expect(judge(readingFor('frame-ms', values, full), {}, 'frame-ms')).toEqual({ verdict: 'pending', reason: 'threshold-unfrozen' });
  });

  it('repeated entry and exit counts each entry, ignores a second enter while mounted, and disposes on exit', () => {
    const first = enter(INITIAL_SCENE);
    expect(first).toMatchObject({ mode: 'running', entries: 1 });
    expect(reduceScene(first, { type: 'enter', webgl: true }).ignored).toBe('already-mounted');
    const exited = reduceScene(first, { type: 'exit' }).state;
    expect(sceneCalls(first, exited)).toEqual(['dispose']);
    const second = enter(exited);
    expect(second).toMatchObject({ mode: 'running', entries: 2 });
    expect(reduceScene(exited, { type: 'exit' }).ignored).toBe('not-mounted');
  });

  it('recovers background and resume: each transition counts once, and the loop pauses only while suspended', () => {
    const running = enter(INITIAL_SCENE);
    const hidden = signal(running, { ...NONE, hidden: true }, 1000);
    expect(hidden).toMatchObject({ backgrounds: 1, hiddenSince: 1000 });
    expect(loopAllowed(hidden)).toBe(false);
    expect(sceneCalls(running, hidden)).toEqual(['sleep']);
    const resumed = signal(hidden, NONE, 1400);
    expect(resumed).toMatchObject({ resumes: 1, lastHiddenMs: 400, hiddenSince: null });
    expect(sceneCalls(hidden, resumed)).toEqual(['wake']);
    expect(loopAllowed(signal(running, { ...NONE, typing: true }))).toBe(false);
  });

  it('recovers WebGL context loss: the scene pauses, and a restore resumes the same entry without a new one', () => {
    const running = enter(INITIAL_SCENE);
    const lost = reduceScene(running, { type: 'contextLost' }).state;
    expect(lost).toMatchObject({ mode: 'context-lost', entries: 1 });
    expect(loopAllowed(lost)).toBe(false);
    const restored = reduceScene(lost, { type: 'contextRestored' }).state;
    expect(restored).toMatchObject({ mode: 'running', entries: 1, restoreTries: 0 });
    expect(reduceScene(restored, { type: 'contextRestored' }).ignored).toBe('not-lost');
  });

  it('recovers restore exhaustion: failed restores fall back to the static path, never a blank scene', () => {
    let s = reduceScene(enter(INITIAL_SCENE), { type: 'contextLost' }).state;
    s = reduceScene(s, { type: 'restoreFailed' }).state;
    expect(s).toMatchObject({ mode: 'context-lost', restoreTries: 1 });
    s = reduceScene(s, { type: 'restoreFailed' }).state;
    expect(s).toMatchObject({ mode: 'static', staticReason: 'restore-exhausted' });
    expect(loopAllowed(s)).toBe(false);
    expect(reduceScene(s, { type: 'contextRestored' }).ignored).toBe('not-lost');
  });

  it('a no-WebGL entry starts static, and the static list keeps Felt identities and essential tasks or reports the gap', () => {
    expect(enter(INITIAL_SCENE, false)).toMatchObject({ mode: 'static', staticReason: 'no-webgl', entries: 1 });
    const complete = staticParity({ sceneIds: ['felt-a', 'felt-b'], staticIds: ['felt-b', 'felt-a'], staticTasks: ['select', 'inspect', 'return'] });
    expect(complete).toEqual({ sameFelt: true, missingIds: [], extraIds: [], missingTasks: [], complete: true });
    const gap = staticParity({ sceneIds: ['felt-a', 'felt-b'], staticIds: ['felt-a', 'felt-c'], staticTasks: ['select', 'inspect'] });
    expect(gap).toEqual({ sameFelt: false, missingIds: ['felt-b'], extraIds: ['felt-c'], missingTasks: ['return'], complete: false });
  });

  it('recovers memory pressure: render cost steps down, never above the declared base, and unknown pressure keeps the base', () => {
    const base = { pixelRatio: 2, textureScale: 1 };
    expect(renderCostFor(base, 'elevated')).toEqual({ cost: { pixelRatio: 1.5, textureScale: 0.75 }, signal: 'observed' });
    expect(renderCostFor(base, 'critical')).toEqual({ cost: { pixelRatio: 1, textureScale: 0.5 }, signal: 'observed' });
    expect(renderCostFor({ pixelRatio: 1, textureScale: 0.5 }, 'critical').cost).toEqual({ pixelRatio: 1, textureScale: 0.5 });
    expect(renderCostFor(base, 'unknown')).toEqual({ cost: base, signal: 'unavailable' });
  });

  it('motion follows the existing sensory clock: system reduced motion stops the clock in every mode', () => {
    expect(motionPlan('lively', false)).toEqual({ clockStep: 0.006, animate: true });
    expect(motionPlan('still', false)).toEqual({ clockStep: 0, animate: false });
    expect(motionPlan('lively', true)).toEqual({ clockStep: 0, animate: false });
    expect(motionPlan('gentle', true).animate).toBe(false);
  });
});
