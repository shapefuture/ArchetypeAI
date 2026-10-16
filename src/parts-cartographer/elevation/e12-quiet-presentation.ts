// E12 quiet presentation selectors (ArchetypeAI-ybq0, step E12.04). Pure and deterministic.
// Chooses how the same items are presented (3D map or accessible list, decorative motion, camera inertia, sound,
// texture, density, text fit and layout) from presentation inputs only. Business outcomes are not inputs, so they cannot
// change the presentation. Every surface receives the same text-alternative rows (id, label, source, action, selected).
// The recovery cases of ArchetypeAI-f02j (step E12.07) are exercised by the spec: no WebGL, no audio, extreme text,
// zoom, mixed sensory settings and suspended ambience. Each setting reports its own reason; none overrides another.
// Reuses core/sensory-preferences, services/ambience-gate, services/reduced-motion and services/universe-lens.
// No randomness, clock, DOM, storage or network.
// Not done here: rendering and CSS (step 05), wiring to matchMedia, WebGL, audio, storage or the ambience gate (step 06),
// authored copy, focus destinations and static compositions (E12.05), and accessibility or device evidence (steps 10-12).

import { normalizeSensoryPreferences, sceneClockStep, type MotionMode, type SensoryPreferences } from '../core/sensory-preferences';
import { ambienceSuspended, type AmbienceSignals } from '../services/ambience-gate';
import { bindReducedMotionDamping } from '../services/reduced-motion';
import { DIMENSION_KEYS, normalizeAxes, sanitizeArchetypeCoordinates, type DimensionKey, type UniverseAxes } from '../services/universe-lens';

/** Below this effective width (CSS px, after zoom) content is a single column. */
export const SINGLE_COLUMN_WIDTH = 640;
/** Text at or above this scale also uses a single column and opens compact density. */
export const LARGE_TEXT_SCALE = 1.25;
const DEFAULT_WIDTH = 1024;

export interface PresentableItem { id: string; label: string; source: string; action: string; }

/** Presentation inputs only. There is deliberately no field for scores, answers, bookings or other outcomes. */
export interface PresentationInput {
  webgl: boolean;
  audio: boolean;
  systemReducedMotion: boolean;
  viewportWidth: number;
  /** Browser zoom factor, 1 = 100%. */
  zoom: number;
  /** User text size factor, 1 = default. */
  textScale: number;
  sensory: SensoryPreferences;
  ambience: AmbienceSignals;
}

export type Surface = 'map-3d' | 'accessible-list';
export type MotionReason = 'enabled' | 'still-preference' | 'system-reduced-motion' | 'ambience-suspended';

export interface QuietPresentation {
  surface: Surface;
  layout: 'columns' | 'single-column';
  textFit: 'natural' | 'expand';
  effectiveWidth: number;
  decorativeMotion: 'play' | 'rest';
  motionReason: MotionReason;
  cameraInertia: boolean;
  sound: 'on' | 'off';
  soundReason: 'chosen' | 'not-chosen' | 'unavailable';
  texture: boolean;
  density: 'open' | 'compact';
  densityReason: 'as-chosen' | 'opened-for-space';
}

export interface AccessibleRow extends PresentableItem { selected: boolean; }
export interface PresentedItems { presentation: QuietPresentation; rows: AccessibleRow[]; selectedId: string | null; empty: boolean; }
export interface LensRow { key: DimensionKey; onMap: boolean; value: number | null; }

const positive = (value: number, fallback: number): number => (Number.isFinite(value) && value > 0 ? value : fallback);
const NOOP = (): void => undefined;

/** Stored sensory choices are untrusted: anything malformed falls back to the defaults. */
export function readSensoryChoice(raw: unknown): SensoryPreferences {
  return normalizeSensoryPreferences(raw);
}

function motionFor(input: PresentationInput): { decorative: 'play' | 'rest'; reason: MotionReason } {
  if (input.systemReducedMotion) return { decorative: 'rest', reason: 'system-reduced-motion' };
  if (sceneClockStep(input.sensory.motion, false) === 0) return { decorative: 'rest', reason: 'still-preference' };
  if (ambienceSuspended(input.ambience)) return { decorative: 'rest', reason: 'ambience-suspended' };
  return { decorative: 'play', reason: 'enabled' };
}

/** Camera inertia follows the existing reduced-motion rule. The inert preference stub keeps this selector free of listeners. */
function cameraInertia(mode: MotionMode, systemReducedMotion: boolean): boolean {
  const controls = { enableDamping: true };
  const preference = { matches: systemReducedMotion, addEventListener: NOOP, removeEventListener: NOOP };
  const binding = bindReducedMotionDamping(controls, preference, mode);
  binding.dispose();
  return controls.enableDamping;
}

/** Same inputs always give the same presentation. Each setting is decided by its own input, never by another setting. */
export function selectPresentation(input: PresentationInput): QuietPresentation {
  const zoom = positive(input.zoom, 1);
  const effectiveWidth = positive(input.viewportWidth, DEFAULT_WIDTH) / zoom;
  const textScale = Math.max(1, positive(input.textScale, 1));
  const constrained = effectiveWidth < SINGLE_COLUMN_WIDTH || textScale >= LARGE_TEXT_SCALE;
  const compact = input.sensory.density === 'compact' && constrained;
  const motion = motionFor(input);
  return {
    surface: input.webgl ? 'map-3d' : 'accessible-list',
    layout: constrained ? 'single-column' : 'columns',
    textFit: textScale > 1 || zoom > 1 ? 'expand' : 'natural',
    effectiveWidth,
    decorativeMotion: motion.decorative,
    motionReason: motion.reason,
    cameraInertia: cameraInertia(input.sensory.motion, input.systemReducedMotion),
    sound: input.sensory.sound && input.audio ? 'on' : 'off',
    soundReason: !input.sensory.sound ? 'not-chosen' : input.audio ? 'chosen' : 'unavailable',
    texture: input.sensory.texture,
    density: compact ? 'open' : input.sensory.density,
    densityReason: compact ? 'opened-for-space' : 'as-chosen',
  };
}

/** One row per item, identical on either surface. A selection that is not in the list is cleared, not shown. */
export function presentItems(items: ReadonlyArray<PresentableItem>, selectedId: string | null, input: PresentationInput): PresentedItems {
  const resolved = items.some((item) => item.id === selectedId) ? selectedId : null;
  const rows: AccessibleRow[] = items.map((item) => ({
    id: item.id, label: item.label, source: item.source, action: item.action, selected: item.id === resolved,
  }));
  return { presentation: selectPresentation(input), rows, selectedId: resolved, empty: items.length === 0 };
}

/** Lens readings as text. Missing or invalid coordinates are unknown (null), never zero. The axes are the three on the map. */
export function lensRows(axesInput: unknown, coordinatesInput: unknown): { axes: UniverseAxes; rows: LensRow[] } {
  const axes = normalizeAxes(axesInput);
  const coordinates = sanitizeArchetypeCoordinates(coordinatesInput);
  return {
    axes,
    rows: DIMENSION_KEYS.map((key) => ({
      key,
      onMap: axes.includes(key),
      value: coordinates ? coordinates[DIMENSION_KEYS.indexOf(key)] : null,
    })),
  };
}
