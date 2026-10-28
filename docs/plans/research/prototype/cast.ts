// The prototype's characters, as editor traits: the same record a person sets when they craft a part.
// Most are the app's own seed plushes; the rest are crafted from the same editor options.
// The 3D plush (plush-shots.html, via feltThumbnail) and the 2D doodle (doodles.mts) are both drawn
// from these traits, through the app's own feltDna mapping, so each pair always matches.
import { SEED_PARTS, type Traits } from '../../../../src/parts-cartographer/pal/traits';

const seed = (id: string): Traits => {
  const part = SEED_PARTS.find((p) => p.id === id);
  if (!part) throw new Error(`no seed part ${id}`);
  return part.traits;
};
const craft = (p: Partial<Traits>): Traits => ({ shape: 'bean', color: '#3B9BFF', eyes: 'ovals', mouth: 'smile', head: 'none', face: 'none', bow: false, cheeks: false, ...p });

/** Parts (protectors only) and the example partner: plushes a person could own. */
export const PARTS: Record<string, Traits> = {
  critic: seed('seed-critic'), // «Отдел контроля качества»
  later: seed('seed-scroller'), // «Министр "Потом"»
  dreamer: craft({ shape: 'flower', color: '#FF2D8A', eyes: 'closed', mouth: 'smile', head: 'party', cheeks: true }), // «Мечтатель»
  whatif: seed('seed-planner'), // «Начальник отдела "А вдруг?"»
  pleaser: seed('seed-pleaser'), // «Главный по "всем ли удобно?"»
  snacks: seed('seed-sweet'), // «Служба утешительных вкусняшек»
  enough: seed('seed-guardian'), // «Профсоюз "Хватит"»
  rebel: seed('seed-rage'), // example partner: «Бунтарь»
  jester: seed('seed-coach'), // example partner: «Шутник»
  guard: craft({ shape: 'square', color: '#C47A3A', eyes: 'ovals', mouth: 'smile', head: 'halo' }), // example partner: «Главный по пледам»
  luna: craft({ shape: 'crescent', color: '#FFD000', eyes: 'closed', mouth: 'smile', cheeks: true }), // the guide
};

/**
 * Feelings and test-answer tones. These are interface icons, not parts, so they use the engine's own
 * expression set (brows and frowns that the editor does not offer) on the editor's palette.
 * [id, body, colour, eyes, brow, mouth, topper]
 */
export const MOODS: [string, string, string, string, string, string, string][] = [
  ['f-calm', 'mochi', '#3EE0B0', 'arc', 'none', 'smile', 'none'],
  ['f-anxious', 'drop', '#6ED6FF', 'button', 'worried', 'o', 'none'],
  ['f-angry', 'triangle', '#FF3B4E', 'button', 'stern', 'frown', 'none'],
  ['f-sad', 'drop', '#3B9BFF', 'dot', 'worried', 'frown', 'none'],
  ['f-tired', 'pill', '#8B6CFF', 'halflid', 'none', 'line', 'none'],
  ['f-awkward', 'bean', '#FF2D8A', 'side', 'none', 'smirk', 'none'],
  ['f-empty', 'cloud', '#F3EEE4', 'line', 'none', 'none', 'none'],
  ['f-glad', 'flower', '#FFD000', 'button', 'none', 'smile', 'none'],
  ['r-busy', 'square', '#FF8A1F', 'button', 'stern', 'line', 'none'],
  ['r-later', 'crescent', '#FFD000', 'halflid', 'none', 'smirk', 'none'],
  ['r-storm', 'cloud', '#6ED6FF', 'button', 'worried', 'o', 'none'],
  ['r-treat', 'heart', '#FF2D8A', 'arc', 'none', 'smile', 'none'],
  ['r-hide', 'mochi', '#C47A3A', 'halflid', 'none', 'none', 'none'],
  ['r-please', 'heart', '#8B6CFF', 'lash', 'none', 'smile', 'none'],
  ['r-squint', 'pentagon', '#FFD000', 'side', 'none', 'smirk', 'none'],
  ['r-idea', 'flower', '#8B6CFF', 'button', 'none', 'smile', 'starSprout'],
  ['r-help', 'bean', '#3B9BFF', 'button', 'none', 'smile', 'none'],
  ['r-dream', 'cloud', '#F3EEE4', 'button', 'none', 'smile', 'saturnRing'],
  ['r-fine', 'mochi', '#FFD000', 'wink', 'none', 'smile', 'none'],
  ['r-ground', 'mochi', '#8BE03A', 'arc', 'none', 'smile', 'none'],
  ['r-harsh', 'triangle', '#FF3B4E', 'halflid', 'stern', 'frown', 'planetStalk'],
];
