import type { Lang } from '../i18n/strings.ts';

const PART_NAME_EN: Record<string, string> = {
  taskmaster: 'Taskmaster',
  inner_critic: 'Inner Critic',
  pleaser: 'Pleaser',
  controller: 'Controller',
  analyst: 'Analyst',
  hermit: 'Hermit',
  bypasser: 'Bypasser',
  numb: 'Numb',
  rebel: 'Rebel',
  charmer: 'Charmer',
  abandoned: 'Abandoned',
  ashamed: 'Ashamed',
  frightened: 'Frightened',
  unseen: 'Unseen',
  sage: 'Sage',
  warrior: 'Warrior',
  caregiver: 'Caregiver',
  explorer: 'Explorer',
};

const PART_NAME_RU: Record<string, string> = {
  taskmaster: 'Деятель',
  inner_critic: 'Внутренний критик',
  pleaser: 'Угодник',
  controller: 'Контролёр',
  analyst: 'Аналитик',
  hermit: 'Отшельник',
  bypasser: 'Обходчик',
  numb: 'Онемение',
  rebel: 'Бунтарь',
  charmer: 'Обаяшка',
  abandoned: 'Брошенный',
  ashamed: 'Стыдящийся',
  frightened: 'Напуганный',
  unseen: 'Незамеченный',
  sage: 'Мудрец',
  warrior: 'Воин',
  caregiver: 'Заботник',
  explorer: 'Исследователь',
};

const NEED_NAMES: Record<string, { en: string; ru: string }> = {
  safety: { en: 'Safety', ru: 'Безопасность' },
  love: { en: 'Love', ru: 'Любовь' },
  worth: { en: 'Worth', ru: 'Ценность' },
  autonomy: { en: 'Autonomy', ru: 'Автономия' },
  belonging: { en: 'Belonging', ru: 'Принадлежность' },
  meaning: { en: 'Meaning', ru: 'Смысл' },
  joy: { en: 'Joy', ru: 'Радость' },
};
const NEED_KEY_TO_ID: Record<string, string> = {
  needSafety: 'safety', needLove: 'love', needWorth: 'worth', needAutonomy: 'autonomy',
  needBelonging: 'belonging', needMeaning: 'meaning', needJoy: 'joy',
};

const POLARIZATION_RU: Record<string, string> = {
  'Grind–Collapse Cycle': 'Цикл «измор — отключка»',
  'Compliance–Explosion Cycle': 'Цикл «подчинение — взрыв»',
  'Clampdown–Breakout Cycle': 'Цикл «зажим — побег»',
  'Freeze–Perform Split': 'Раскол «заморозка — представление»',
  'Shame–Display Split': 'Раскол «стыд — витрина»',
  'White-Knuckle–Checkout Cycle': 'Цикл «на кулаках — в отключку»',
  'Cave–Stage Split': 'Раскол «пещера — сцена»',
  'Halo–Havoc Split': 'Раскол «нимб — разгром»',
  'Halo–Havoc Cycle': 'Цикл «нимб — разгром»',
};
const POLARIZATION_EN = Object.fromEntries(Object.entries(POLARIZATION_RU).map(([en, ru]) => [ru, en]));

export function clinicalPartName(id: string, lang: Lang): string {
  return lang === 'ru' ? PART_NAME_RU[id] ?? PART_NAME_EN[id] ?? id : PART_NAME_EN[id] ?? id;
}

export function clinicalPolarizationName(name: string, lang: Lang): string {
  const english = POLARIZATION_EN[name] ?? name;
  return lang === 'ru' ? POLARIZATION_RU[english] ?? english : english;
}

export function clinicalNeedName(key: string, lang: Lang): string {
  const id = NEED_KEY_TO_ID[key] ?? key;
  return NEED_NAMES[id]?.[lang] ?? key;
}
