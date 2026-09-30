/**
 * Sticker characters — ported from the "inner verse.html" reference.
 * Each part is a family-shaped body (rounded card / drop / drop / star)
 * with variant eyes + mouth, a white halo behind the color fill, and a
 * blinking animation. Pure functions returning SVG markup strings.
 */

import { localSet } from '../../core/data/local-store';

export type EyeKind = 'big' | 'wide' | 'dot' | 'lid' | 'squint' | 'star' | 'glasses';
export type MouthKind = 'smile' | 'grin' | 'flat' | 'wavy' | 'grit' | 'ooh' | 'smirk';

/** The four IFS families a part can belong to. */
export type FamKind = 'manager' | 'firefighter' | 'exile' | 'resource';

/** One of the 18 inner parts — the app-wide roster (single source of truth). */
export interface IvPart {
  id: string;
  fam: FamKind;
  shape: string;
  color: string;
  glyph: { e: EyeKind; m: MouthKind };
  ax: { ag: number; te: number; fo: number; at: number };
  name: [string, string];
  short: [string, string];
}

export interface StickerSpec {
  name: string;
  shape: string;
  color: string;
  glyph: { e: EyeKind; m: MouthKind };
}

/**
 * The real 18-part roster — family colors, faces and axes from the reference.
 * Exported for every feature that needs the current part system
 * (landing codex, sky map, 3D universe).
 */
export const IV_PARTS: IvPart[] = [
  // Managers — preemptive order-keepers
  { id: 'taskmaster', fam: 'manager', color: '#DE6A40', glyph: { e: 'lid', m: 'grit' }, shape: 'taskmaster', ax: { ag: 18, te: 60, fo: 22, at: 30 }, name: ['The Taskmaster', 'Деятель'], short: ['Taskmaster', 'Деятель'] },
  { id: 'inner_critic', fam: 'manager', color: '#C76B85', glyph: { e: 'squint', m: 'flat' }, shape: 'inner_critic', ax: { ag: 45, te: 40, fo: 15, at: 45 }, name: ['The Inner Critic', 'Внутренний критик'], short: ['Critic', 'Критик'] },
  { id: 'pleaser', fam: 'manager', color: '#EF8FA5', glyph: { e: 'big', m: 'smile' }, shape: 'pleaser', ax: { ag: 55, te: 70, fo: 72, at: 88 }, name: ['The Pleaser', 'Угодник'], short: ['Pleaser', 'Угодник'] },
  { id: 'controller', fam: 'manager', color: '#D5793B', glyph: { e: 'dot', m: 'flat' }, shape: 'controller', ax: { ag: 25, te: 50, fo: 10, at: 40 }, name: ['The Controller', 'Контролёр'], short: ['Controller', 'Контролёр'] },
  { id: 'analyst', fam: 'manager', color: '#7BA3D0', glyph: { e: 'glasses', m: 'flat' }, shape: 'analyst', ax: { ag: 50, te: 25, fo: 12, at: 35 }, name: ['The Analyst', 'Аналитик'], short: ['Analyst', 'Аналитик'] },
  { id: 'hermit', fam: 'manager', color: '#8A87A8', glyph: { e: 'lid', m: 'smile' }, shape: 'hermit', ax: { ag: 60, te: 20, fo: 30, at: 25 }, name: ['The Hermit', 'Отшельник'], short: ['Hermit', 'Отшельник'] },
  { id: 'bypasser', fam: 'manager', color: '#CDB32E', glyph: { e: 'big', m: 'smile' }, shape: 'bypasser', ax: { ag: 52, te: 30, fo: 50, at: 25 }, name: ['The Bypasser', 'Обходчик'], short: ['Bypasser', 'Обходчик'] },
  // Firefighters — reactive extinguishers
  { id: 'numb', fam: 'firefighter', color: '#9AA3AC', glyph: { e: 'lid', m: 'flat' }, shape: 'numb', ax: { ag: 70, te: 15, fo: 55, at: 20 }, name: ['The Numb', 'Онемение'], short: ['Numb', 'Онемение'] },
  { id: 'rebel', fam: 'firefighter', color: '#DE5F50', glyph: { e: 'star', m: 'grin' }, shape: 'rebel', ax: { ag: 12, te: 85, fo: 50, at: 30 }, name: ['The Rebel', 'Бунтарь'], short: ['Rebel', 'Бунтарь'] },
  { id: 'charmer', fam: 'firefighter', color: '#EF8FA5', glyph: { e: 'big', m: 'smirk' }, shape: 'charmer', ax: { ag: 35, te: 80, fo: 50, at: 75 }, name: ['The Charmer', 'Обаяшка'], short: ['Charmer', 'Обояшка'] },
  // Exiles — the young carriers
  { id: 'abandoned', fam: 'exile', color: '#9865C5', glyph: { e: 'big', m: 'wavy' }, shape: 'abandoned', ax: { ag: 75, te: 55, fo: 70, at: 92 }, name: ['The Abandoned One', 'Брошенный'], short: ['Abandoned', 'Брошенный'] },
  { id: 'ashamed', fam: 'exile', color: '#8E62B8', glyph: { e: 'lid', m: 'wavy' }, shape: 'ashamed', ax: { ag: 80, te: 40, fo: 65, at: 85 }, name: ['The Ashamed One', 'Стыдящийся'], short: ['Ashamed', 'Стыд'] },
  { id: 'frightened', fam: 'exile', color: '#7A6FD1', glyph: { e: 'wide', m: 'ooh' }, shape: 'frightened', ax: { ag: 78, te: 60, fo: 72, at: 90 }, name: ['The Frightened One', 'Напуганный'], short: ['Frightened', 'Напуганный'] },
  { id: 'unseen', fam: 'exile', color: '#8583C0', glyph: { e: 'dot', m: 'flat' }, shape: 'unseen', ax: { ag: 72, te: 35, fo: 60, at: 80 }, name: ['The Unseen One', 'Незамеченный'], short: ['Unseen', 'Незамеченный'] },
  // Resources — the grown strengths
  { id: 'sage', fam: 'resource', color: '#2FA39E', glyph: { e: 'lid', m: 'smile' }, shape: 'sage', ax: { ag: 40, te: 30, fo: 40, at: 45 }, name: ['The Sage', 'Мудрец'], short: ['Sage', 'Мудрец'] },
  { id: 'warrior', fam: 'resource', color: '#2E9967', glyph: { e: 'dot', m: 'grit' }, shape: 'warrior', ax: { ag: 10, te: 55, fo: 20, at: 35 }, name: ['The Warrior', 'Воин'], short: ['Warrior', 'Воин'] },
  { id: 'caregiver', fam: 'resource', color: '#E97F63', glyph: { e: 'big', m: 'smile' }, shape: 'caregiver', ax: { ag: 45, te: 75, fo: 78, at: 82 }, name: ['The Caregiver', 'Заботник'], short: ['Caregiver', 'Заботник'] },
  { id: 'explorer', fam: 'resource', color: '#3FA9B5', glyph: { e: 'star', m: 'smile' }, shape: 'explorer', ax: { ag: 22, te: 65, fo: 45, at: 40 }, name: ['The Explorer', 'Исследователь'], short: ['Explorer', 'Исследователь'] },
];

function eyes(kind: EyeKind): string {
  switch (kind) {
    case 'big':
      return `<g class="eye-l"><ellipse cx="38" cy="46" rx="8" ry="9.5" fill="#fff" stroke="#1c1610" stroke-width="2.6"/><circle cx="40" cy="48" r="3.4" fill="#1c1610"/></g><g class="eye-r"><ellipse cx="62" cy="46" rx="8" ry="9.5" fill="#fff" stroke="#1c1610" stroke-width="2.6"/><circle cx="64" cy="48" r="3.4" fill="#1c1610"/></g>`;
    case 'wide':
      return `<g class="eye-l"><circle cx="38" cy="46" r="9" fill="#fff" stroke="#1c1610" stroke-width="2.6"/><circle cx="38" cy="47" r="2.6" fill="#1c1610"/></g><g class="eye-r"><circle cx="62" cy="46" r="9" fill="#fff" stroke="#1c1610" stroke-width="2.6"/><circle cx="62" cy="47" r="2.6" fill="#1c1610"/></g>`;
    case 'dot':
      return `<circle class="eye-l" cx="39" cy="46" r="3.6" fill="#1c1610"/><circle class="eye-r" cx="61" cy="46" r="3.6" fill="#1c1610"/>`;
    case 'lid':
      return `<path class="eye-l" d="M32 46q6-7 12 0" fill="none" stroke="#1c1610" stroke-width="3" stroke-linecap="round"/><path class="eye-r" d="M56 46q6-7 12 0" fill="none" stroke="#1c1610" stroke-width="3" stroke-linecap="round"/>`;
    case 'squint':
      return `<path d="M32 43l12 5M32 49l12-3" stroke="#1c1610" stroke-width="2.8" stroke-linecap="round"/><path d="M68 43l-12 5M68 49l-12-3" stroke="#1c1610" stroke-width="2.8" stroke-linecap="round"/>`;
    case 'star':
      return `<path d="M39 39l2.2 4.6 5 .6-3.7 3.4.9 5-4.4-2.5-4.4 2.5.9-5-3.7-3.4 5-.6z" fill="#1c1610"/><path d="M61 39l2.2 4.6 5 .6-3.7 3.4.9 5-4.4-2.5-4.4 2.5.9-5-3.7-3.4 5-.6z" fill="#1c1610"/>`;
    case 'glasses':
      return `<circle cx="38" cy="46" r="9" fill="#fff" stroke="#1c1610" stroke-width="2.8"/><circle cx="62" cy="46" r="9" fill="#fff" stroke="#1c1610" stroke-width="2.8"/><path d="M47 46h6" stroke="#1c1610" stroke-width="2.8"/><circle cx="39" cy="47" r="2.8" fill="#1c1610"/><circle cx="61" cy="47" r="2.8" fill="#1c1610"/>`;
  }
}

function mouth(kind: MouthKind): string {
  switch (kind) {
    case 'smile':
      return `<path d="M42 62q8 9 16 0" fill="none" stroke="#1c1610" stroke-width="3" stroke-linecap="round"/>`;
    case 'grin':
      return `<path d="M40 60q10 12 20 0z" fill="#1c1610"/><path d="M44 64q6 4 12 0" fill="#fff" opacity=".9"/>`;
    case 'flat':
      return `<path d="M43 63h14" stroke="#1c1610" stroke-width="3" stroke-linecap="round"/>`;
    case 'wavy':
      return `<path d="M42 63q4-4 8 0t8 0" fill="none" stroke="#1c1610" stroke-width="2.8" stroke-linecap="round"/>`;
    case 'grit':
      return `<rect x="41" y="59" width="18" height="7" rx="3.5" fill="#fff" stroke="#1c1610" stroke-width="2.6"/><path d="M47 59v7M53 59v7" stroke="#1c1610" stroke-width="2"/>`;
    case 'ooh':
      return `<ellipse cx="50" cy="63" rx="5" ry="6.5" fill="#1c1610"/>`;
    case 'smirk':
      return `<path d="M42 63q9 7 17-2" fill="none" stroke="#1c1610" stroke-width="3" stroke-linecap="round"/>`;
  }
}

/**
 * 18 unique body silhouettes — one per part, never repeated.
 * The star shape is reserved for Nova (the mascot) and is never used
 * for parts. All paths close inside the 100×100 viewBox and leave room
 * for the face at roughly x∈[32,68], y∈[40,66].
 */
const SHAPES: Record<string, string> = {
  // managers
  taskmaster: `<rect x="16" y="18" width="68" height="64" rx="22"/>`, // wide id-card
  inner_critic: `<rect x="24" y="10" width="52" height="78" rx="16"/>`, // tall ledger
  pleaser: `<rect x="13" y="25" width="74" height="52" rx="26"/>`, // soft squircle
  controller: `<path d="M50 11 85 31v38L50 89 15 69V31Z"/>`, // hex plate
  analyst: `<path d="M18 50a32 32 0 0 1 64 0v26a11 11 0 0 1-11 11H29a11 11 0 0 1-11-11Z"/>`, // tank dome
  hermit: `<path d="M26 89V54a24 24 0 0 1 48 0v35Z"/>`, // arch cave
  bypasser: `<path d="M50 9 87 50 50 91 13 50Z"/>`, // tilted kite
  // firefighters
  numb: `<path d="M50 8 C78 8 92 28 88 52 C85 76 68 92 50 92 C32 92 15 76 12 52 C8 28 22 8 50 8 Z"/>`, // soft blank blob (old design)
  rebel: `<path d="M50 8 88 36 75 85H25L12 36Z"/>`, // jagged pentagon
  charmer: `<path d="M50 14c13-9 33 1 33 19 0 21-19 33-33 47-14-14-33-26-33-47 0-18 20-28 33-19Z"/>`, // soft heart
  // exiles
  abandoned: `<path d="M50 12c11 17 27 28 27 49a27 27 0 1 1-54 0c0-21 16-32 27-49Z"/>`, // teardrop
  ashamed: `<path d="M50 9c17 0 31 25 31 46a31 31 0 0 1-62 0c0-21 14-46 31-46Z"/>`, // drooping egg
  frightened: `<path d="M50 13 88 85H12Z"/>`, // small alert triangle
  unseen: `<path d="M50 10 C82 10 94 38 86 62 C78 86 64 94 50 94 C36 94 22 86 14 62 C6 38 18 10 50 10 Z"/>`, // wide quiet blob (old design)
  // resources — never stars
  sage: `<path d="M50 9C79 26 85 58 50 91 15 58 21 26 50 9Z"/>`, // leaf
  warrior: `<path d="M50 10 84 24v28c0 20-14 33-34 41-20-8-34-21-34-41V24Z"/>`, // shield
  caregiver: `<path d="M50 87C27 69 13 55 13 38 13 24 25 15 37 15c6 0 11 3 13 7 2-4 7-7 13-7 12 0 24 9 24 23 0 17-14 31-37 49Z"/>`, // open heart
  explorer: `<path d="M50 10 Q82 28 82 50 Q82 82 50 92 Q18 82 18 50 Q18 28 50 10 Z"/>`, // wandering pebble (old design)
};

/** All 18 available shape ids (for the customization picker + sky canvas). */
export const SHAPE_IDS: string[] = Object.keys(SHAPES);

/** Raw SHAPES map (canvas rendering builds Path2D from these strings). */
export { SHAPES };

export const EYE_KINDS: EyeKind[] = ['big', 'wide', 'dot', 'lid', 'squint', 'star', 'glasses'];
export const MOUTH_KINDS: MouthKind[] = ['smile', 'grin', 'flat', 'wavy', 'grit', 'ooh', 'smirk'];

/** 12 preset swatch colors for the look editor. */
export const LOOK_COLORS: string[] = [
  '#DE6A40', '#C76B85', '#EF8FA5', '#D5793B', '#CDB32E', '#7BA3D0',
  '#8A87A8', '#9AA3AC', '#9865C5', '#2FA39E', '#2E9967', '#E97F63',
];

// ------------------------------------------------- look overrides + custom parts

export interface PartLook {
  shape: string;
  color: string;
  eye: string;
  mouth: string;
}

export interface CustomPart {
  id: string;
  name: [string, string]; // [en, ru]
  look: PartLook;
  fam: string; // FamKind
}

const LOOKS_KEY = 'INNERVERSE_PART_LOOKS_V1';
const CUSTOM_KEY = 'INNERVERSE_CUSTOM_PARTS_V1';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  // write-behind: look-customization taps never block the frame
  localSet(key, value);
}

/** Persisted per-part look overrides. */
export function loadLooks(): Record<string, PartLook> {
  return readJson<Record<string, PartLook>>(LOOKS_KEY, {});
}

export function saveLook(id: string, look: PartLook): Record<string, PartLook> {
  const all = loadLooks();
  all[id] = look;
  writeJson(LOOKS_KEY, all);
  return all;
}

export function resetLook(id: string): Record<string, PartLook> {
  const all = loadLooks();
  delete all[id];
  writeJson(LOOKS_KEY, all);
  return all;
}

/** User-created custom parts (display-only in the codex). */
export function loadCustomParts(): CustomPart[] {
  const v = readJson<CustomPart[]>(CUSTOM_KEY, []);
  return Array.isArray(v) ? v : [];
}

export function saveCustomPart(part: CustomPart): CustomPart[] {
  const all = loadCustomParts();
  const i = all.findIndex((p) => p.id === part.id);
  if (i >= 0) all[i] = part;
  else all.push(part);
  writeJson(CUSTOM_KEY, all);
  return all;
}

export function deleteCustomPart(id: string): CustomPart[] {
  const all = loadCustomParts().filter((p) => p.id !== id);
  writeJson(CUSTOM_KEY, all);
  return all;
}

export function sticker(p: StickerSpec): string {
  const g = p.glyph;
  const body = SHAPES[p.shape] ?? SHAPES.taskmaster;
  return `<svg class="stk blinkeyes" viewBox="0 0 100 100" role="img" aria-label="${p.name}">
  <g stroke-linejoin="round"><g fill="#fff" stroke="#fff" stroke-width="14">${body}</g>
  <g fill="${p.color}" stroke="#1c1610" stroke-width="3.2">${body}</g></g>
  <ellipse cx="36" cy="28" rx="10" ry="5" fill="#fff" opacity=".35" transform="rotate(-18 36 28)"/>
  ${eyes(g.e)}${mouth(g.m)}
  <circle cx="29" cy="56" r="4" fill="#fff" opacity=".45"/><circle cx="71" cy="56" r="4" fill="#fff" opacity=".45"/></svg>`;
}

export function novaSvg(): string {
  return `<svg class="stk blinkeyes" viewBox="0 0 100 100" role="img" aria-label="Nova">
  <g stroke-linejoin="round"><g fill="#fff" stroke="#fff" stroke-width="12"><path d="M50 5l11 24 26 3-19.5 17 5.5 26L50 62 27 75l5.5-26L13 32l26-3Z"/></g>
  <g fill="#E9D23A" stroke="#1c1610" stroke-width="3.4"><path d="M50 5l11 24 26 3-19.5 17 5.5 26L50 62 27 75l5.5-26L13 32l26-3Z"/></g></g>
  <ellipse cx="38" cy="26" rx="9" ry="4.5" fill="#fff" opacity=".5" transform="rotate(-20 38 26)"/>
  <g class="eye-l"><ellipse cx="40" cy="42" rx="6.5" ry="8" fill="#fff" stroke="#1c1610" stroke-width="2.4"/><circle cx="41.5" cy="44" r="3" fill="#1c1610"/></g>
  <g class="eye-r"><ellipse cx="60" cy="42" rx="6.5" ry="8" fill="#fff" stroke="#1c1610" stroke-width="2.4"/><circle cx="61.5" cy="44" r="3" fill="#1c1610"/></g>
  <path d="M43 54q7 8 14 0" fill="none" stroke="#1c1610" stroke-width="3" stroke-linecap="round"/>
  <circle cx="33" cy="50" r="3.6" fill="#EF8FA5" opacity=".55"/><circle cx="67" cy="50" r="3.6" fill="#EF8FA5" opacity=".55"/>
  <path d="M78 14l2 4.5 4.5 2-4.5 2-2 4.5-2-4.5-4.5-2 4.5-2Z" fill="#4FB3AE"/></svg>`;
}
