// The prototype's characters, as editor traits: the same record a person sets when they craft a part.
// One per 147 family (seven managers, three firefighters, four exiles, four resources) plus Луна, the guide.
// Seed parts from the app where they fit, the rest crafted from the same editor options. The 3D plush
// (plush-shots.html, via feltThumbnail) and the 2D doodle (doodles.mts, or the bridge in the browser) are both
// drawn from these traits through the app's own feltDna mapping, so each pair always matches.
import { SEED_PARTS, type Traits } from '../../../../src/parts-cartographer/pal/traits';

const seed = (id: string): Traits => {
  const part = SEED_PARTS.find((p) => p.id === id);
  if (!part) throw new Error(`no seed part ${id}`);
  return part.traits;
};
const craft = (p: Partial<Traits>): Traits => ({ shape: 'bean', color: '#3B9BFF', eyes: 'ovals', mouth: 'smile', head: 'none', face: 'none', bow: false, cheeks: false, ...p });

/** Keys are the 147 family ids; the comment is the name a person sees (app/copy.js holds the voice). */
export const PARTS: Record<string, Traits> = {
  inner_critic: seed('seed-critic'), // Шапокляк
  controller: seed('seed-planner'), // Завхоз
  pleaser: seed('seed-pleaser'), // Официант
  numb: seed('seed-scroller'), // Залипашка
  taskmaster: craft({ shape: 'pill', color: '#FF3B4E', eyes: 'googly', mouth: 'grin', head: 'party' }), // Кролик
  analyst: craft({ shape: 'square', color: '#F3EEE4', eyes: 'tiny', mouth: 'flat', face: 'glasses' }), // Знайка
  hermit: craft({ shape: 'mochi', color: '#C47A3A', eyes: 'closed', mouth: 'smile', cheeks: true }), // Ёжик
  bypasser: craft({ shape: 'flower', color: '#FFD000', eyes: 'ovals', mouth: 'grin', head: 'halo' }), // Тигра
  rebel: seed('seed-rage'), // Не буду
  charmer: craft({ shape: 'pentagon', color: '#FF2D8A', eyes: 'wink', mouth: 'grin', head: 'party', bow: true }), // Карлсон
  abandoned: seed('seed-little'), // Чебурашка
  ashamed: craft({ shape: 'mochi', color: '#8B6CFF', eyes: 'closed', mouth: 'flat', cheeks: true }), // Кот под диваном
  frightened: craft({ shape: 'pill', color: '#F3EEE4', eyes: 'ovals', mouth: 'o', cheeks: true }), // Заяц
  unseen: craft({ shape: 'cloud', color: '#6ED6FF', eyes: 'closed', mouth: 'none', cheeks: true }), // Крайний на фото
  sage: seed('seed-witness'), // Сова
  warrior: craft({ shape: 'square', color: '#3B9BFF', eyes: 'ovals', mouth: 'grin', head: 'beret' }), // Богатырь
  caregiver: seed('seed-coach'), // Обнимашка
  explorer: craft({ shape: 'bean', color: '#8BE03A', eyes: 'googly', mouth: 'o', head: 'party' }), // Незнайка
  luna: craft({ shape: 'crescent', color: '#FFD000', eyes: 'closed', mouth: 'smile', cheeks: true }), // Луна, the guide
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
