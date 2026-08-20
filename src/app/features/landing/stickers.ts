/**
 * Sticker characters — ported from the "inner verse.html" reference.
 * Each part is a family-shaped body (rounded card / drop / drop / star)
 * with variant eyes + mouth, a white halo behind the color fill, and a
 * blinking animation. Pure functions returning SVG markup strings.
 */

export type EyeKind = 'big' | 'wide' | 'dot' | 'lid' | 'squint' | 'star' | 'glasses';
export type MouthKind = 'smile' | 'grin' | 'flat' | 'wavy' | 'grit' | 'ooh' | 'smirk';

export interface StickerSpec {
  name: string;
  shape: string;
  color: string;
  glyph: { e: EyeKind; m: MouthKind };
}

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
