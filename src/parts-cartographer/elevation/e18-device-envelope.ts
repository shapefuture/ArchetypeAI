// E18 device envelope and local instrumentation (ArchetypeAI-dqit, step 04). Pure and deterministic.
// Local metric samples pass an allow-list: a closed metric set, finite in-range numbers, and no extra fields,
// so free text cannot enter. Samples reach the existing local distribution store (core/telemetry.ts) only as
// coarse bucket labels. A declared device envelope (handset, OS, browser, network) is complete only when all
// four are declared, and observations without it are not device evidence. Unmeasured values are explicit
// pending states: no run, no browser method, no frozen budget. Scene lifecycle (entry, background, resume,
// WebGL context loss, restore exhaustion), memory-pressure render cost, and static list/detail parity are typed.
// Reuses ambience-gate (suspension signals), sensory-preferences (motion clock) and the telemetry and
// universe-scene API types (type-only, so no storage or three.js loads at import).
// NOT done here: measuring frames, heat or memory on a device (needs runs), freezing thresholds (E18.03),
// wiring into universe-scene, telemetry or the static list (step 06), UI (step 05), evidence and acceptance
// (steps 10-12). No clock, storage, WebGL or DOM access: time and environment facts are injected.
import { ambienceSuspended, type AmbienceSignals } from '../services/ambience-gate';
import { sceneClockStep, type MotionMode } from '../core/sensory-preferences';
import type { telemetry } from '../core/telemetry';
import type { UniverseAPI } from '../services/universe-scene';

// Metric set. Bucket edges are display buckets for distributions, not budgets; budgets come only from frozen thresholds.
export interface MetricSpec { unit: 'ms' | 'MB'; min: number; max: number; buckets: ReadonlyArray<number>; }
export const METRICS = {
  'frame-ms': { unit: 'ms', min: 0, max: 10_000, buckets: [16.7, 33.4, 50] },
  'long-task-ms': { unit: 'ms', min: 0, max: 60_000, buckets: [50, 100, 250] },
  'entry-ms': { unit: 'ms', min: 0, max: 60_000, buckets: [1000, 2000, 4000] },
  'resume-ms': { unit: 'ms', min: 0, max: 60_000, buckets: [250, 500, 1000] },
  'heap-mb': { unit: 'MB', min: 0, max: 16_384, buckets: [64, 128, 256, 512] },
} satisfies Record<string, MetricSpec>;
export type MetricKey = keyof typeof METRICS;

/** Whether a browser exposes the measure at all. 'none' is recorded as pending, never as zero. */
export type MethodAvailability = 'browser-api' | 'partial' | 'none';
export const METHOD: Record<MetricKey | 'thermal', MethodAvailability> = {
  'frame-ms': 'browser-api', 'entry-ms': 'browser-api', 'resume-ms': 'browser-api',
  'long-task-ms': 'partial', 'heap-mb': 'partial', thermal: 'none',
};

export interface MetricSample { metric: MetricKey; value: number; }
export type SampleRejection = 'not-an-object' | 'extra-field' | 'unknown-metric' | 'non-numeric' | 'out-of-range';
export function sanitizeSample(input: unknown): { ok: true; sample: MetricSample } | { ok: false; reason: SampleRejection } {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return { ok: false, reason: 'not-an-object' };
  const record = input as Record<string, unknown>;
  if (Object.keys(record).some((key) => key !== 'metric' && key !== 'value')) return { ok: false, reason: 'extra-field' };
  if (typeof record.metric !== 'string' || !Object.prototype.hasOwnProperty.call(METRICS, record.metric)) {
    return { ok: false, reason: 'unknown-metric' };
  }
  const metric = record.metric as MetricKey;
  const value = record.value;
  if (typeof value !== 'number' || !Number.isFinite(value)) return { ok: false, reason: 'non-numeric' };
  const spec = METRICS[metric];
  if (value < spec.min || value > spec.max) return { ok: false, reason: 'out-of-range' };
  return { ok: true, sample: { metric, value } };
}

/** The exact argument pair for telemetry.record(itemId, value): a bucket label, never the raw number. */
export interface TelemetryPair { itemId: string; value: string; }
export function toTelemetryPair(sample: MetricSample): TelemetryPair {
  const spec = METRICS[sample.metric];
  const edge = spec.buckets.find((bucket) => sample.value <= bucket);
  const label = edge === undefined ? `>${spec.buckets[spec.buckets.length - 1]}` : `<=${edge}`;
  return { itemId: `e18.${sample.metric}`, value: `${label}${spec.unit}` };
}

/** Injected sink: the existing local distribution store, typed structurally. This module never calls storage itself. */
export type TelemetrySink = Pick<typeof telemetry, 'record'>;
/** Only a sanitized sample reaches the sink, and only as its bucket pair. Raw input never does. */
export function emitSample(sink: TelemetrySink, input: unknown): { ok: true; pair: TelemetryPair } | { ok: false; reason: SampleRejection } {
  const checked = sanitizeSample(input);
  if (checked.ok === false) return { ok: false, reason: checked.reason };
  const pair = toTelemetryPair(checked.sample);
  sink.record(pair.itemId, pair.value);
  return { ok: true, pair };
}

/** Bounded per-metric buffers. Oldest values drop first; nothing is persisted here. */
export type LocalMeasures = Partial<Record<MetricKey, ReadonlyArray<number>>>;
export function recordSample(measures: LocalMeasures, sample: MetricSample, capacity = 200): LocalMeasures {
  const values = [...(measures[sample.metric] ?? []), sample.value];
  return { ...measures, [sample.metric]: values.length > capacity ? values.slice(values.length - capacity) : values };
}

export interface Summary { count: number; p50: number; p95: number; max: number; }
export function summarize(values: ReadonlyArray<number>): Summary | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const nearest = (q: number) => sorted[Math.min(sorted.length - 1, Math.ceil(q * sorted.length) - 1)];
  return { count: sorted.length, p50: nearest(0.5), p95: nearest(0.95), max: sorted[sorted.length - 1] };
}

// Device envelope. A label is a short declared device class, validated by pattern and length.
export type Declared<T> = { status: 'declared'; value: T } | { status: 'pending' };
export type NetworkClass = 'wifi' | 'cellular' | 'ethernet';
export interface DeviceEnvelope { handset: Declared<string>; os: Declared<string>; browser: Declared<string>; network: Declared<NetworkClass>; }
const LABEL = /^[A-Za-z0-9][A-Za-z0-9 ._+()/-]{0,39}$/;
const PENDING: Declared<never> = { status: 'pending' };
const NETWORKS: ReadonlyArray<string> = ['wifi', 'cellular', 'ethernet'];

export function declareEnvelope(input: { handset?: unknown; os?: unknown; browser?: unknown; network?: unknown }): { envelope: DeviceEnvelope; problems: string[] } {
  const problems: string[] = [];
  const label = (field: string, value: unknown): Declared<string> => {
    if (value === undefined || value === null || value === '') return PENDING;
    if (typeof value === 'string' && LABEL.test(value.trim())) return { status: 'declared', value: value.trim() };
    problems.push(`${field}: not a short device label`);
    return PENDING;
  };
  const handset = label('handset', input.handset);
  const os = label('os', input.os);
  const browser = label('browser', input.browser);
  let network: Declared<NetworkClass> = PENDING;
  if (typeof input.network === 'string' && NETWORKS.includes(input.network)) network = { status: 'declared', value: input.network as NetworkClass };
  else if (input.network !== undefined && input.network !== null) problems.push('network: not a known class');
  return { envelope: { handset, os, browser, network }, problems };
}
export const envelopeComplete = (e: DeviceEnvelope): boolean =>
  e.handset.status === 'declared' && e.os.status === 'declared' && e.browser.status === 'declared' && e.network.status === 'declared';

// Readings and verdicts. A pending reading never carries a number.
export type PendingReason = 'no-run' | 'method-none' | 'envelope-incomplete' | 'threshold-unfrozen';
export type Reading =
  | { status: 'pending'; reason: 'no-run' | 'method-none' }
  | { status: 'observed'; summary: Summary; deviceEvidence: boolean; method: MethodAvailability };
export function readingFor(metric: MetricKey, values: ReadonlyArray<number> | undefined, envelope: DeviceEnvelope): Reading {
  const summary = summarize(values ?? []);
  if (summary === null) return { status: 'pending', reason: 'no-run' };
  return { status: 'observed', summary, deviceEvidence: envelopeComplete(envelope), method: METHOD[metric] };
}
/** Heat has no browser measure in this build, so it is always pending until a device method is defined. */
export const thermalReading = (): Reading => ({ status: 'pending', reason: 'method-none' });

export type FrozenBudgets = Partial<Record<MetricKey, { p95Max: number }>>;
export type Verdict = { verdict: 'pending'; reason: PendingReason } | { verdict: 'within' | 'over'; p95: number };
export function judge(reading: Reading, budgets: FrozenBudgets, metric: MetricKey): Verdict {
  if (reading.status === 'pending') return { verdict: 'pending', reason: reading.reason };
  if (!reading.deviceEvidence) return { verdict: 'pending', reason: 'envelope-incomplete' };
  const budget = budgets[metric];
  if (!budget) return { verdict: 'pending', reason: 'threshold-unfrozen' };
  return reading.summary.p95 <= budget.p95Max ? { verdict: 'within', p95: reading.summary.p95 } : { verdict: 'over', p95: reading.summary.p95 };
}

// Scene lifecycle: entries, background/resume, WebGL context loss and restore exhaustion.
export type SceneMode = 'off' | 'running' | 'static' | 'context-lost';
export interface SceneLifecycle {
  mode: SceneMode; staticReason: 'no-webgl' | 'restore-exhausted' | null;
  entries: number; backgrounds: number; resumes: number; restoreTries: number;
  hiddenSince: number | null; lastHiddenMs: number | null; signals: AmbienceSignals;
}
export const INITIAL_SCENE: SceneLifecycle = {
  mode: 'off', staticReason: null, entries: 0, backgrounds: 0, resumes: 0, restoreTries: 0,
  hiddenSince: null, lastHiddenMs: null, signals: { hidden: false, typing: false, error: false },
};
export const MAX_RESTORE_TRIES = 2;
export type SceneEvent =
  | { type: 'enter'; webgl: boolean }
  | { type: 'exit' }
  | { type: 'signals'; signals: AmbienceSignals; now: number }
  | { type: 'contextLost' }
  | { type: 'contextRestored' }
  | { type: 'restoreFailed' };
export interface SceneStep { state: SceneLifecycle; ignored: 'already-mounted' | 'not-mounted' | 'not-running' | 'not-lost' | null; }

export function reduceScene(s: SceneLifecycle, e: SceneEvent): SceneStep {
  switch (e.type) {
    case 'enter':
      if (s.mode !== 'off') return { state: s, ignored: 'already-mounted' };
      return { state: { ...s, mode: e.webgl ? 'running' : 'static', staticReason: e.webgl ? null : 'no-webgl', entries: s.entries + 1, restoreTries: 0 }, ignored: null };
    case 'exit':
      if (s.mode === 'off') return { state: s, ignored: 'not-mounted' };
      return { state: { ...s, mode: 'off', staticReason: null, restoreTries: 0, hiddenSince: null }, ignored: null };
    case 'signals': {
      let next: SceneLifecycle = { ...s, signals: { ...e.signals } };
      const mounted = s.mode !== 'off';
      if (mounted && e.signals.hidden && !s.signals.hidden) next = { ...next, backgrounds: s.backgrounds + 1, hiddenSince: e.now };
      if (mounted && !e.signals.hidden && s.signals.hidden) {
        next = { ...next, resumes: s.resumes + 1, hiddenSince: null, lastHiddenMs: s.hiddenSince === null ? null : e.now - s.hiddenSince };
      }
      return { state: next, ignored: null };
    }
    case 'contextLost':
      if (s.mode !== 'running') return { state: s, ignored: 'not-running' };
      return { state: { ...s, mode: 'context-lost', restoreTries: 0 }, ignored: null };
    case 'contextRestored':
      if (s.mode !== 'context-lost') return { state: s, ignored: 'not-lost' };
      return { state: { ...s, mode: 'running', restoreTries: 0 }, ignored: null };
    case 'restoreFailed': {
      if (s.mode !== 'context-lost') return { state: s, ignored: 'not-lost' };
      const tries = s.restoreTries + 1;
      if (tries >= MAX_RESTORE_TRIES) return { state: { ...s, mode: 'static', staticReason: 'restore-exhausted', restoreTries: tries }, ignored: null };
      return { state: { ...s, restoreTries: tries }, ignored: null };
    }
  }
}

/** The loop runs only while the scene is running and decoration is not suspended (hidden page, typing, error). */
export const loopAllowed = (s: SceneLifecycle): boolean => s.mode === 'running' && !ambienceSuspended(s.signals);

/** Maps a lifecycle change to the UniverseAPI calls the wiring step should make. */
export type SceneCall = Extract<keyof UniverseAPI, 'wake' | 'sleep' | 'dispose'>;
export function sceneCalls(before: SceneLifecycle, after: SceneLifecycle): SceneCall[] {
  if (before.mode !== 'off' && after.mode === 'off') return ['dispose'];
  const wasOn = loopAllowed(before);
  const isOn = loopAllowed(after);
  if (!wasOn && isOn) return ['wake'];
  if (wasOn && !isOn) return ['sleep'];
  return [];
}

export function motionPlan(mode: MotionMode, systemReducedMotion: boolean): { clockStep: number; animate: boolean } {
  const clockStep = sceneClockStep(mode, systemReducedMotion);
  return { clockStep, animate: clockStep > 0 };
}

// Memory pressure: render cost steps down and never rises above the declared base.
export type Pressure = 'normal' | 'elevated' | 'critical' | 'unknown';
export interface RenderCost { pixelRatio: number; textureScale: number; }
export function renderCostFor(base: RenderCost, pressure: Pressure): { cost: RenderCost; signal: 'observed' | 'unavailable' } {
  switch (pressure) {
    case 'normal': return { cost: base, signal: 'observed' };
    case 'unknown': return { cost: base, signal: 'unavailable' };
    case 'elevated': return { cost: { pixelRatio: Math.max(1, Math.min(base.pixelRatio, 1.5)), textureScale: Math.min(base.textureScale, 0.75) }, signal: 'observed' };
    case 'critical': return { cost: { pixelRatio: Math.min(base.pixelRatio, 1), textureScale: Math.min(base.textureScale, 0.5) }, signal: 'observed' };
  }
}

// Static list/detail parity: same Felt identities and the same essential tasks as the scene.
export type MapTask = 'select' | 'inspect' | 'return';
export const REQUIRED_TASKS: ReadonlyArray<MapTask> = ['select', 'inspect', 'return'];
export interface ParityReport { sameFelt: boolean; missingIds: string[]; extraIds: string[]; missingTasks: MapTask[]; complete: boolean; }
export function staticParity(input: { sceneIds: ReadonlyArray<string>; staticIds: ReadonlyArray<string>; staticTasks: ReadonlyArray<MapTask> }): ParityReport {
  const scene = new Set(input.sceneIds);
  const statics = new Set(input.staticIds);
  const missingIds = [...scene].filter((id) => !statics.has(id)).sort();
  const extraIds = [...statics].filter((id) => !scene.has(id)).sort();
  const missingTasks = REQUIRED_TASKS.filter((task) => !input.staticTasks.includes(task));
  const sameFelt = missingIds.length === 0 && extraIds.length === 0;
  return { sameFelt, missingIds, extraIds, missingTasks, complete: sameFelt && missingTasks.length === 0 };
}
