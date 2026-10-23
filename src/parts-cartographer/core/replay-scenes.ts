// Authored everyday Replay scene, the Replay record and the scene-completion world record (ArchetypeAI-28h.7.1,
// 28h.7.2, 28h.5.4). Pure apart from saveVerified, which uses the local store.
// The scene is an imagined, neutral everyday moment. It is not a memory of a real event and makes no claim about one.
// English and Russian copy share one structure, so the same validators pass in both languages.
import { validateScene, type Scene } from './scene-grammar';
import { validateSceneAssets, type Asset } from './asset-budget';
import { MAX_BEATS, type ReplayScene } from './replay-authoring';
import type { Presentation } from './director-controls';
import type { ReplayEvidence } from './replay-evaluation';
import { store } from './local-store';

export type Lang = 'en' | 'ru';
type Localized = Record<Lang, string>;

export const DEFAULT_SCENE_ID = 'everyday-kitchen';
export const DEFAULT_SCENE_START = 'kitchen';
export const DEFAULT_SCENE_BUDGET_UNITS = 12;

interface AuthoredNode {
  id: string;
  /** Label of the step that leads to this frame. */
  choice: Localized;
  text: Localized;
  textAlternative: Localized;
  exits: ReadonlyArray<string>;
  terminal: boolean;
}

interface AuthoredAsset {
  id: string;
  grammarId: string;
  costUnits: number;
  staticEquivalent: Localized;
}

const TITLE: Localized = {
  en: 'A shared morning',
  ru: 'Общее утро',
};

const NODES: ReadonlyArray<AuthoredNode> = [
  {
    id: 'kitchen',
    choice: { en: 'Start', ru: 'Начать' },
    text: {
      en: 'It is an ordinary morning in a shared kitchen. The kettle has just clicked off, and another person is standing by the counter.',
      ru: 'Обычное утро на общей кухне. Чайник только что щёлкнул и выключился, а рядом у столешницы стоит другой человек.',
    },
    textAlternative: {
      en: 'A small kitchen in soft morning light. A kettle sits on the counter with two mugs beside it. One person stands near the window.',
      ru: 'Небольшая кухня в мягком утреннем свете. На столешнице стоит чайник и рядом две кружки. Один человек стоит у окна.',
    },
    exits: ['offer', 'quiet'],
    terminal: false,
  },
  {
    id: 'offer',
    choice: { en: 'Offer to make tea', ru: 'Предложить сделать чай' },
    text: {
      en: 'You offer to make tea. The other person looks up and says, "Yes, thanks."',
      ru: 'Вы предлагаете сделать чай. Второй человек поднимает глаза и говорит: «Да, спасибо».',
    },
    textAlternative: {
      en: 'One person turns from the window toward the counter, holding a mug. The kettle is being refilled.',
      ru: 'Один человек поворачивается от окна к столешнице и держит кружку. Чайник наполняют водой.',
    },
    exits: ['shared-cup'],
    terminal: false,
  },
  {
    id: 'quiet',
    choice: { en: 'Stay with your own cup', ru: 'Остаться со своей чашкой' },
    text: {
      en: 'You stay with your own cup. The room is quiet, and for a moment nobody speaks.',
      ru: 'Вы остаётесь со своей чашкой. В комнате тихо, и некоторое время никто не говорит.',
    },
    textAlternative: {
      en: 'The two people stand apart, each holding a cup. Neither is speaking. Both are looking toward the window.',
      ru: 'Два человека стоят на расстоянии друг от друга, у каждого в руках чашка. Никто не говорит, оба смотрят в сторону окна.',
    },
    exits: ['pause'],
    terminal: false,
  },
  {
    id: 'pause',
    choice: { en: 'Wait and see what happens', ru: 'Подождать и посмотреть, что будет' },
    text: {
      en: 'You wait a moment. The other person might speak, or might not. Either way, the morning continues.',
      ru: 'Вы ждёте немного. Второй человек может заговорить, а может промолчать. Так или иначе утро продолжается.',
    },
    textAlternative: {
      en: 'A short pause. The kettle has finished. One person looks at the other, and the other looks at the kettle.',
      ru: 'Короткая пауза. Чайник закипел. Один человек смотрит на другого, а тот смотрит на чайник.',
    },
    exits: ['shared-cup', 'alone-cup'],
    terminal: false,
  },
  {
    id: 'shared-cup',
    choice: { en: 'Sit down together', ru: 'Сесть рядом' },
    text: {
      en: 'You sit down together with the tea. The morning goes on at its own pace.',
      ru: 'Вы садитесь вместе с чаем. Утро идёт своим темпом.',
    },
    textAlternative: {
      en: 'Two people sit at a small table, each with a mug. Steam rises from both.',
      ru: 'Два человека сидят за маленьким столом, у каждого кружка. Над обеими поднимается пар.',
    },
    exits: [],
    terminal: true,
  },
  {
    id: 'alone-cup',
    choice: { en: 'Take your cup to the window', ru: 'Отнести свою чашку к окну' },
    text: {
      en: 'You take your cup to the window. The morning goes on, and this is also a complete morning.',
      ru: 'Вы относите свою чашку к окну. Утро идёт дальше, и это тоже полноценное утро.',
    },
    textAlternative: {
      en: 'One person stands at the window with a mug. The other is at the counter. The room is calm.',
      ru: 'Один человек стоит у окна с кружкой. Второй у столешницы. В комнате спокойно.',
    },
    exits: [],
    terminal: true,
  },
];

const ASSETS: ReadonlyArray<AuthoredAsset> = [
  {
    id: 'kitchen-corner', grammarId: 'plain-line-drawing', costUnits: 3,
    staticEquivalent: { en: 'A kitchen corner with a counter, a window and a kettle.', ru: 'Угол кухни: столешница, окно и чайник.' },
  },
  {
    id: 'table-and-mugs', grammarId: 'plain-line-drawing', costUnits: 2,
    staticEquivalent: { en: 'A small table with two mugs.', ru: 'Маленький стол с двумя кружками.' },
  },
  {
    id: 'first-person', grammarId: 'plain-line-drawing', costUnits: 2,
    staticEquivalent: { en: 'A simple standing figure: the first person.', ru: 'Простая фигура стоящего человека: первый человек.' },
  },
  {
    id: 'second-person', grammarId: 'plain-line-drawing', costUnits: 2,
    staticEquivalent: { en: 'A simple standing figure: the second person.', ru: 'Простая фигура стоящего человека: второй человек.' },
  },
  {
    id: 'steam', grammarId: 'plain-line-drawing', costUnits: 1,
    staticEquivalent: { en: 'Three short lines above a mug, showing steam.', ru: 'Три коротких штриха над кружкой, означающие пар.' },
  },
];

export interface LocalizedScene {
  id: string;
  title: string;
  scene: Scene;
  /** Button label for each frame, keyed by frame id. */
  choiceLabels: Record<string, string>;
  assets: Asset[];
  budgetUnits: number;
}

const resolveLang = (lang: unknown): Lang => (lang === 'ru' ? 'ru' : 'en');

/** The default scene in one language. Unknown languages fall back to English. */
export function localizeDefaultScene(lang: unknown = 'en'): LocalizedScene {
  const l = resolveLang(lang);
  return {
    id: DEFAULT_SCENE_ID,
    title: TITLE[l],
    scene: {
      start: DEFAULT_SCENE_START,
      nodes: NODES.map((node) => ({
        id: node.id,
        text: node.text[l],
        textAlternative: node.textAlternative[l],
        exits: [...node.exits],
        terminal: node.terminal,
      })),
    },
    choiceLabels: Object.fromEntries(NODES.map((node) => [node.id, node.choice[l]])),
    assets: ASSETS.map((asset) => ({
      id: asset.id,
      grammarId: asset.grammarId,
      costUnits: asset.costUnits,
      staticEquivalent: asset.staticEquivalent[l],
    })),
    budgetUnits: DEFAULT_SCENE_BUDGET_UNITS,
  };
}

/* ── Replay record (the person's own Replay, presentation and evidence) ── */

export const REPLAY_KEY = 'INNERVERSE_REPLAY_V1';
export const MAX_CAST = 4;
const NAME_LIMIT = 40;
const TITLE_LIMIT = 120;
const BEAT_LIMIT = 280;
const NOTE_LIMIT = 500;
const MAX_NOTES = 5;
const COUNT_CAP = 1_000_000;

export interface SavedReplayScene {
  id: string;
  title: string;
  optIn: boolean;
  castNames: string[];
  beats: string[];
}

export interface ReplayRecord {
  scene: SavedReplayScene | null;
  presentation: Presentation;
  evidence: ReplayEvidence;
}

export const EMPTY_EVIDENCE: ReplayEvidence = { playtimeMinutes: 0, userBenefitReports: 0, demandRecords: 0, complexityNotes: [] };

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

function textOf(value: unknown, limit: number): string {
  return typeof value === 'string' ? value.slice(0, limit) : '';
}

function listOf(value: unknown, max: number, limit: number): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').slice(0, max).map((item) => item.slice(0, limit))
    : [];
}

function countOf(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), COUNT_CAP) : 0;
}

/** Corrupt or partial stored values fall back to an empty record. Nothing is invented. */
export function normalizeReplayRecord(value: unknown): ReplayRecord {
  const v = isPlainObject(value) ? value : {};
  const sceneIn = isPlainObject(v.scene) ? v.scene : null;
  const scene: SavedReplayScene | null = sceneIn && typeof sceneIn.id === 'string' && sceneIn.id
    ? {
      id: sceneIn.id.slice(0, 64),
      title: textOf(sceneIn.title, TITLE_LIMIT),
      optIn: sceneIn.optIn === true,
      castNames: listOf(sceneIn.castNames, MAX_CAST, NAME_LIMIT),
      beats: listOf(sceneIn.beats, MAX_BEATS, BEAT_LIMIT),
    }
    : null;
  const castNames = scene?.castNames ?? [];
  const presIn = isPlainObject(v.presentation) ? v.presentation : {};
  const evIn = isPlainObject(v.evidence) ? v.evidence : {};
  return {
    scene,
    presentation: {
      camera: presIn.camera === 'close' ? 'close' : 'wide',
      pacing: presIn.pacing === 'slow' ? 'slow' : 'normal',
      emphasis: typeof presIn.emphasis === 'string' && castNames.includes(presIn.emphasis) ? presIn.emphasis : null,
    },
    evidence: {
      playtimeMinutes: Math.min(Math.max(Number(evIn.playtimeMinutes) || 0, 0), COUNT_CAP),
      userBenefitReports: countOf(evIn.userBenefitReports),
      demandRecords: countOf(evIn.demandRecords),
      complexityNotes: listOf(evIn.complexityNotes, MAX_NOTES, NOTE_LIMIT),
    },
  };
}

/** The Replay as the validators see it: trimmed names, and only beats that have words in them. */
export function replayForCheck(scene: Pick<SavedReplayScene, 'id' | 'title' | 'optIn' | 'castNames' | 'beats'>): ReplayScene {
  return {
    id: scene.id,
    title: scene.title.trim(),
    optIn: scene.optIn,
    castNames: scene.castNames.map((name) => name.trim()),
    beats: scene.beats.map((beat) => beat.trim()).filter(Boolean),
  };
}

/* ── World record (places are finished scene ids; progress counts them) ── */

export const WORLD_KEY = 'INNERVERSE_WORLD_V1';
export interface WorldRecord { places: string[]; progress: number; graduated: boolean; }

export function normalizeWorld(value: unknown): WorldRecord {
  const v = isPlainObject(value) ? value : {};
  const places = Array.isArray(v.places)
    ? [...new Set(v.places.filter((place): place is string => typeof place === 'string' && place.length > 0 && place.length <= 80))]
    : [];
  return { places, progress: places.length, graduated: v.graduated === true };
}

/** Records a finished scene once. Progress is always the count of finished scenes, so it never goes down. */
export function finishScene<W extends WorldRecord>(world: W, sceneId: string): W {
  if (!sceneId || world.places.includes(sceneId)) return world;
  const places = [...world.places, sceneId];
  return { ...world, places, progress: places.length };
}

/** Writes a value and reads it back. Returns false when the browser did not keep it. */
export function saveVerified(key: string, value: unknown): boolean {
  store.save(key, value);
  return JSON.stringify(store.load(key, null)) === JSON.stringify(value);
}
