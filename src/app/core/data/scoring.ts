/**
 * Deterministic Archetype Scoring Engine
 *
 * Generates personal archetypes purely from assessment pole scores.
 * No AI involved — same answers always produce identical results.
 */

// --- Types ---

export interface PoleScores {
  agencyActive: number;
  agencyReceptive: number;
  tempHot: number;
  tempCool: number;
  focusOther: number;
  focusSelf: number;
  attAnxious: number;
  attAvoidant: number;
  healthScore: number;
  disorganizedAttachment: boolean;
  center: [number, number, number, number]; // [AGENCY, TEMPERATURE, FOCUS, ATTACHMENT]
}

export type PartType = 'manager' | 'firefighter' | 'exile' | 'self';
export type DevelopmentalOrigin = 'pre_verbal' | 'early_attachment' | 'oedipal' | 'latency' | 'adolescent';

export interface ScoredArchetype {
  name: string;
  symbol: string;
  coordinates: [number, number, number, number];
  cluster: string;
  prominence: number;
  size: number;
  description: string;
  wound: string;
  shadow: string;
  invitation: string;
  coreBelief: string;
  attracts: string;
  partType: PartType;
  developmentalOrigin: DevelopmentalOrigin;
  disorganizedModifier: boolean;
  gestalt?: string; // named cross-dimensional pattern, if detected
}

// --- Pole Score Computation ---

/**
 * Dimension weights for center calculation.
 * Attachment has 16 questions (8 per pole) vs 12 for other dimensions (6 per pole).
 * Without weighting, Attachment's center estimate has lower variance (more reliable),
 * giving it disproportionate influence on cluster assignment and coordinate placement.
 * The weight factor equalizes statistical influence across dimensions.
 * Set to 0.75 = sqrt(12/16) ≈ 0.87 adjusted down for calibration.
 */
const ATTACHMENT_WEIGHT = 0.75;

/**
 * Computes the average of responses in [start, end), normalized to [-1, 1].
 * Positive-pole sections (receptive, hot, other-focused, anxious) are active when > 0.
 * Negative-pole sections (active, cool, self-focused, avoidant) are keyed with invert=true
 * and are active when < 0. Use positivePoleStrength/negativePoleStrength for trait intensity.
 */
function takeAvg(responses: number[], start: number, end: number, invert = false): number {
  let sum = 0;
  let count = 0;
  for (let i = start; i < end; i++) {
    if (responses[i]) {
      const val = (responses[i] - 3) / 2;
      sum += invert ? -val : val;
      count++;
    }
  }
  return count > 0 ? sum / count : 0;
}

/**
 * Computes raw sum of responses in [start, end).
 * Used for the spec-correct difference scoring formula.
 */
function rawSum(responses: number[], start: number, end: number): number {
  let sum = 0;
  for (let i = start; i < end; i++) {
    if (responses[i]) {
      sum += responses[i];
    }
  }
  return sum;
}

export function computePoleScores(responses: number[]): PoleScores {
  // Individual pole strengths (normalized [-1, 1])
  const agencyActive = takeAvg(responses, 0, 6, true);
  const agencyReceptive = takeAvg(responses, 6, 12, false);
  const tempHot = takeAvg(responses, 12, 18, false);
  const tempCool = takeAvg(responses, 18, 24, true);
  const focusOther = takeAvg(responses, 24, 30, false);
  const focusSelf = takeAvg(responses, 30, 36, true);
  const attAnxious = takeAvg(responses, 36, 44, false);
  const attAvoidant = takeAvg(responses, 44, 52, true);

  // Health score: 0.0–1.0 scale across the answered 1..5 range.
  // A response of 1 should contribute 0 health, 5 should contribute full health.
  const healthSum = rawSum(responses, 52, 64);
  const healthAnswered = responses.slice(52, 64).filter(r => r > 0).length;
  const healthScore = clamp01(healthAnswered > 0
    ? (healthSum - healthAnswered) / (healthAnswered * 4)
    : 0);

  const disorganizedAttachment = positivePoleStrength(attAnxious) > 0.25
    && negativePoleStrength(attAvoidant) > 0.25;

  // Dimension centers use the spec-correct DIFFERENCE formula:
  //   center = (sum(poleA) - sum(poleB)) / normalizer
  // This directly captures which pole dominates, avoiding the bug where
  // averaging two opposite-signed poles cancels to zero.
  const agencyCenter = clamp((rawSum(responses, 6, 12) - rawSum(responses, 0, 6)) / 24);
  const tempCenter = clamp((rawSum(responses, 12, 18) - rawSum(responses, 18, 24)) / 24);
  const focusCenter = clamp((rawSum(responses, 24, 30) - rawSum(responses, 30, 36)) / 24);
  const attCenter = clamp((rawSum(responses, 36, 44) - rawSum(responses, 44, 52)) / 32 * ATTACHMENT_WEIGHT);

  const center: [number, number, number, number] = [
    agencyCenter,
    tempCenter,
    focusCenter,
    attCenter,
  ];

  return {
    agencyActive, agencyReceptive,
    tempHot, tempCool,
    focusOther, focusSelf,
    attAnxious, attAvoidant,
    healthScore,
    disorganizedAttachment,
    center,
  };
}

function clamp(v: number, lo = -1, hi = 1): number {
  return Math.max(lo, Math.min(hi, v));
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function positivePoleStrength(v: number): number {
  return clamp01(v);
}

export function negativePoleStrength(v: number): number {
  return clamp01(-v);
}

function variance(arr: number[]): number {
  if (arr.length === 0) return 0;
  const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
  return arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length;
}

function deriveDevelopmentalOrigin(responses: number[], poles: PoleScores): DevelopmentalOrigin {
  const emotionalVariance = variance(responses.slice(12, 24).map(r => (r - 3) / 2));
  const avoidantStrength = negativePoleStrength(poles.attAvoidant);
  const selfFocusStrength = negativePoleStrength(poles.focusSelf);
  const activeStrength = negativePoleStrength(poles.agencyActive);

  if (emotionalVariance < 0.3 && avoidantStrength > 0.4) return 'pre_verbal';
  if (emotionalVariance < 0.5 && avoidantStrength > 0.3) return 'early_attachment';
  if (selfFocusStrength > 0.4 && activeStrength > 0.3) return 'oedipal';
  if (selfFocusStrength > 0.3) return 'latency';
  return 'adolescent';
}

/**
 * Per-archetype developmental origin.
 * Uses the archetype's own coordinates to determine its developmental era,
 * rather than the global person-level analysis.
 */
function deriveArchetypeOrigin(
  coords: [number, number, number, number],
  globalOrigin: DevelopmentalOrigin
): DevelopmentalOrigin {
  const [agency, temperature, focus, attachment] = coords;

  // Pre-verbal: extreme avoidant detachment + emotional flatness
  if (attachment < -0.5 && temperature < -0.2) return 'pre_verbal';

  // Early attachment: anxious attachment patterns (positive attachment coord)
  if (attachment > 0.3) return 'early_attachment';

  // Also early attachment: avoidant with emotional intensity
  if (attachment < -0.3 && temperature > 0.2) return 'early_attachment';

  // Oedipal: self-focused + active agency
  if (focus < -0.3 && agency < -0.2) return 'oedipal';

  // Latency: self-focused but less active
  if (focus < -0.3) return 'latency';

  // Gift/self archetypes near center: inherit global origin
  if (Math.abs(agency) < 0.2 && Math.abs(temperature) < 0.2 && Math.abs(attachment) < 0.2) {
    return globalOrigin;
  }

  // Default: adolescent
  return 'adolescent';
}

// --- Name & Symbol Pools per Cluster ---

const NAME_POOLS: Record<string, Record<string, string[]>> = {
  control_shadows: {
    en: [
      'The Commander', 'The Architect', 'The Warden', 'The Iron Will',
      'The Sentinel King', 'The General', 'The Taskmaster', 'The Strategist',
      'The Ruler', 'The Enforcer', 'The Watchman', 'The Overseer',
      'The Disciplinarian', 'The Regulator', 'The Gatekeeper', 'The Judge',
      'The Shield Bearer', 'The Fortress Builder', 'The Fortress', 'The Arbiter',
    ],
    ru: [
      'Командующий', 'Архитектор', 'Страж', 'Железная Воля',
      'Сторожевой Король', 'Генерал', 'Надсмотрщик', 'Стратег',
      'Правитель', 'Исполнитель', 'Смотритель', 'Надзиратель',
      'Дисциплинатор', 'Регулятор', 'Привратник', 'Судья',
      'Носитель Щита', 'Строитель Крепости', 'Крепость', 'Арбитр',
    ],
  },
  emotional_storm_shadows: {
    en: [
      'The Wildfire', 'The Thunderhead', 'The Maelstrom', 'The Volcanic Heart',
      'The Lightning Rod', 'The Inferno', 'The Hurricane', 'The Eruption',
      'The Blaze', 'The Tempest Born', 'The Storm Caller', 'The Firestorm',
      'The Upheaval', 'The Seismic', 'The Torrent', 'The Avalanche',
      'The Raging Sea', 'The Ember Core', 'The Thunderstrike', 'The Cyclone',
    ],
    ru: [
      'Лесной Пожар', 'Грозовой Фронт', 'Водоворот', 'Вулканическое Сердце',
      'Громоотвод', 'Пекло', 'Ураган', 'Извержение',
      'Пламя', 'Рождённый Бурей', 'Вызыватель Бурь', 'Огненный Шторм',
      'Потрясение', 'Сейсмический', 'Поток', 'Лавина',
      'Бушующее Море', 'Тлеющее Ядро', 'Удар Молнии', 'Циклон',
    ],
  },
  avoidant_intellectual_shadows: {
    en: [
      'The Frost Sage', 'The Crystal Mind', 'The Observer', 'The Distant Star',
      'The Glass Tower', 'The Glacier', 'The Analyst', 'The Frozen Lake',
      'The Ivory Tower', 'The Quantum Ghost', 'The Silent Scholar', 'The Ice Field',
      'The Abstract', 'The Detached', 'The Astral', 'The Cipher',
      'The Stillness', 'The Void Walker', 'The Calm Surface', 'The Mirror',
    ],
    ru: [
      'Морозный Мудрец', 'Кристальный Разум', 'Наблюдатель', 'Далёкая Звезда',
      'Стеклянная Башня', 'Ледник', 'Аналитик', 'Замёрзшее Озеро',
      'Слоновая Башня', 'Квантовый Призрак', 'Молчаливый Учёный', 'Ледяное Поле',
      'Абстракция', 'Отстранённый', 'Астральный', 'Шифр',
      'Тишина', 'Ходок Пустоты', 'Спокойная Поверхность', 'Зеркало',
    ],
  },
  anxious_connection_shadows: {
    en: [
      'The Yearning Heart', 'The Graviton', 'The Echo Seeker', 'The Tender Flame',
      'The Open Wound', 'The Longing', 'The Tangled Web', 'The Seeking Soul',
      'The Clinging Vine', 'The Hungry Mirror', 'The Velvet Trap', 'The Deep Well',
      'The Needful One', 'The Absorber', 'The Thread Spinner', 'The Anchor Seeker',
      'The Chameleon Heart', 'The Bridge Builder', 'The Open Hands', 'The Giver',
    ],
    ru: [
      'Жаждущее Сердце', 'Гравитон', 'Искатель Эха', 'Нежное Пламя',
      'Открытая Рана', 'Томление', 'Запутанная Паутина', 'Ищущая Душа',
      'Цепляющаяся Лиана', 'Голодное Зеркало', 'Бархатная Ловушка', 'Глубокий Колодец',
      'Нуждающийся', 'Поглотитель', 'Прядильщик Нитей', 'Искатель Якоря',
      'Сердце Хамелеона', 'Строитель Мостов', 'Открытые Руки', 'Дарующий',
    ],
  },
  seductive_avoidance_shadows: {
    en: [
      'The Phantom Lover', 'The Silk Thread', 'The Mirage', 'The Velvet Flame',
      'The Garden of Thorns', 'The Dance of Shadows', 'The Enigma', 'The Sphinx',
      'The Masquerade', 'The Perfumed Dagger', 'The Sweet Poison', 'The Smoke Ring',
      'The Illusionist', 'The Charmer', 'The Moonlit Path', 'The Gilded Cage',
      'The Twister', 'The Playing Card', 'The Night Bloom', 'The Siren Song',
    ],
    ru: [
      'Фантомный Любовник', 'Шёлковая Нить', 'Мираж', 'Бархатное Пламя',
      'Сад Шипов', 'Танец Теней', 'Загадка', 'Сфинкс',
      'Маскарад', 'Благовонный Кинжал', 'Сладкий Яд', 'Дымовое Кольцо',
      'Иллюзионист', 'Чаровник', 'Лунная Тропа', 'Позолоченная Клетка',
      'Обманщик', 'Игральная Карта', 'Ночной Цветок', 'Песня Сирены',
    ],
  },
  gift_archetypes: {
    en: [
      'The Radiant One', 'The Harmonizer', 'The Grounded Mystic', 'The Living Bridge',
      'The Clear Spring', 'The Balanced Flame', 'The Steady Heart', 'The Open Sky',
      'The Centered Soul', 'The Weaver', 'The Light Bearer', 'The Dawn Caller',
      'The Deep Listener', 'The True Mirror', 'The Rooted Tree', 'The Gold Weaver',
      'The Whole Self', 'The Integrated One', 'The Quiet Power', 'The Full Circle',
    ],
    ru: [
      'Сияющий', 'Гармонизатор', 'Заземлённый Мистик', 'Живой Мост',
      'Чистый Родник', 'Сбалансированное Пламя', 'Стойкое Сердце', 'Открытое Небо',
      'Уравновешенная Душа', 'Ткач', 'Носитель Света', 'Зовущий Рассвет',
      'Глубокий Слушатель', 'Истинное Зеркало', 'Укоренённое Древо', 'Золотой Ткач',
      'Целостный', 'Интегрированный', 'Тихая Сила', 'Полный Круг',
    ],
  },
  disorganized_attachment_shadows: {
    en: [
      'The Shattered Mirror', 'The Torn Veil', 'The Push-Pull Phantom', 'The Double Bind',
      'The Walking Paradox', 'The Frozen Fire', 'The Simultaneous Flight', 'The Contradictory Heart',
      'The Approach-Avoidance', 'The Ambivalent Storm', 'The Pendulum Soul', 'The Two-Way Prison',
      'The Impossible Bind', 'The Split Heart', 'The Fearful Lover', 'The Craving Recluse',
      'The Hungry Hermit', 'The Yearning Escapist', 'The Desperate Island', 'The Burning Ice',
    ],
    ru: [
      'Разбитое зеркало', 'Разорванная завеса', 'Фантом притяжения', 'Двойная связь',
      'Ходячий парадокс', 'Замёрзший огонь', 'Бег в обе стороны', 'Разноречивое сердце',
      'Сближение-избегание', 'Двойственная буря', 'Душа-маятник', 'Двусторонняя тюрьма',
      'Невозможный узел', 'Разорванное сердце', 'Пугливый любовник', 'Жаждущий отшельник',
      'Голодный затворник', 'Томящийся беглец', 'Отчаянный остров', 'Горящий лёд',
    ],
  },
};

const SYMBOL_POOLS: Record<string, string[]> = {
  control_shadows:     ['⚔️', '🛡️', '⚙️', '🏰', '🔱', '🗝️', '🔩', '🏛️', '📊', '🎯'],
  emotional_storm_shadows: ['🌋', '🔥', '⚡', '🌪️', '💥', '🌩️', '🌊', '☄️', '💫', '🔥'],
  avoidant_intellectual_shadows: ['❄️', '🔬', '🧊', '🔭', '💎', '🪞', '🏔️', '❄️', '🌀', '♟️'],
  anxious_connection_shadows: ['🌸', '🕸️', '💔', '🫂', '🧵', '🪢', '💝', '🌿', '🪷', '🕊️'],
  seductive_avoidance_shadows: ['🔮', '🎭', '🌹', '🃏', '🧜‍♀️', '🪩', '🕷️', '🎴', '🦚', '🌙'],
  gift_archetypes:     ['✨', '🌟', '🌳', '💎', '🌊', '🌅', '🦋', '🌈', '💫', '♾️'],
  disorganized_attachment_shadows: ['💫', '🔮', '🌙', '🎭', '⚡', '🌀', '🗝️', '🪞', '🖤', '♾️'],
};

// --- Description Templates (1-2 sentences per archetype) ---

const DESCRIPTION_TEMPLATES: Record<string, Record<string, string[]>> = {
  control_shadows: {
    en: [
      'A sovereign force that builds walls to protect what it loves. Commands respect but struggles to let anyone close enough to see the cracks.',
      'An iron-willed guardian who equates vulnerability with defeat. Their fortress keeps danger out — and intimacy at bay.',
      'A master strategist who orchestrates every outcome to avoid the chaos of uncertainty. Strength is their armor, control their language.',
      'A disciplined sentinel standing eternal watch. They hold the line so tightly they forget to breathe.',
    ],
    ru: [
      'Суверенная сила, строящая стены, чтобы защитить то, что любит. Командует уважением, но не подпускает никого достаточно близко, чтобы увидеть трещины.',
      'Железная воля-хранитель, приравнивающая уязвимость к поражению. Их крепость держит опасность снаружи — и близость на расстоянии.',
      'Мастер-стратег, оркестрирующий каждый исход, чтобы избежать хаоса неопределённости. Сила — их броня, контроль — их язык.',
      'Дисциплинированный часовой, стоящий на вечной вахте. Они держат оборону так крепко, что забывают дышать.',
    ],
  },
  emotional_storm_shadows: {
    en: [
      'A volcanic spirit whose intensity can light up a room or burn it down. They feel everything at maximum volume and struggle to find the dial.',
      'A thunderhead of raw emotion that crashes through boundaries with passionate force. Beauty and destruction coexist in their wake.',
      'A tempest-born soul whose reactivity masks a terrified child within. Every eruption is a cry to be witnessed.',
      'A wildfire heart that turns every connection into a crucible. Their passion is real — but so is the damage it leaves behind.',
    ],
    ru: [
      'Вулканический дух, чья интенсивность может осветить комнату или сжечь её. Они чувствуют всё на максимальной громкости и не могут найти регулятор.',
      'Грозовой фронт сырых эмоций, прорывающийся через границы с пассионарной силой. Красота и разрушение сосуществуют в их следе.',
      'Рождённая бурей душа, чья реактивность скрывает испуганного ребёнка внутри. Каждое извержение — крик быть замеченным.',
      'Пламенное сердце, превращающее каждую связь в горнило. Их страсть настояща — но и ущерб, который она оставляет, тоже.',
    ],
  },
  avoidant_intellectual_shadows: {
    en: [
      'A crystal mind that observes the world through frost-covered glass. They understand everything about emotion — except how to feel it.',
      'A distant star whose light reaches others but never warms. Analysis is their sanctuary and their prison.',
      'A silent scholar who maps the depths of the human condition from the safety of the shore. They know the water is fine — they just refuse to swim.',
      'An ivory tower intellect that has rationalized away its own need for connection. Solitude is their kingdom and their exile.',
    ],
    ru: [
      'Кристальный разум, наблюдающий мир через покрытое инеем стекло. Они понимают всё об эмоциях — кроме того, как их чувствовать.',
      'Далёкая звезда, чей свет достигает других, но никогда не согревает. Анализ — их святилище и их тюрьма.',
      'Молчаливый учёный, картографирующий глубины человеческого состояния с безопасного берега. Они знают, что вода прекрасна — просто отказываются плыть.',
      'Интеллект башни из слоновой кости, рационализировавший собственную потребность в связи. Одиночество — их королевство и их изгнание.',
    ],
  },
  anxious_connection_shadows: {
    en: [
      'A yearning heart that shape-shifts to fit the shape of whoever is near. They give everything to the connection — except their authentic self.',
      'A gravitational force pulling everyone close, terrified that distance means abandonment. Their love is vast but lacks boundaries.',
      'An echo seeker who loses their own voice harmonizing with others. Connection is oxygen — but they are drowning in everyone else\'s air.',
      'A tender soul who builds bridges to everyone but forgets to build a home for themselves. They know everyone\'s pain except their own.',
    ],
    ru: [
      'Жаждущее сердце, меняющее форму, чтобы подстроиться под того, кто рядом. Они отдают связи всё — кроме своей подлинной сути.',
      'Гравитационная сила, притягивающая всех близко, терроризируемая тем, что дистанция означает покинутость. Их любовь необъятна, но лишена границ.',
      'Искатель эха, теряющий собственный голос в гармонии с другими. Связь — это кислород, но они тонут в чужом воздухе.',
      'Нежная душа, строящая мосты ко всем, но забывающая построить дом для себя. Они знают боль каждого — кроме своей собственной.',
    ],
  },
  seductive_avoidance_shadows: {
    en: [
      'A phantom lover who draws people in with mystery and charm, then vanishes when the walls come down. Intimacy is the chase — arrival is the threat.',
      'A silk-thread enigma that weaves fascination at a distance. They offer a garden of delights — but every flower has thorns.',
      'A moonlit illusionist who performs connection without vulnerability. The mask is magnificent — and it never comes off.',
      'A perfumed dagger wrapped in velvet. They make everyone feel special while ensuring no one gets close enough to see the ordinary underneath.',
    ],
    ru: [
      'Фантомный любовник, притягивающий людей загадкой и обаянием, а затем исчезающий, когда стены падают. Близость — это погоня, прибытие — угроза.',
      'Шёлковая загадка, плетущая очарование на расстоянии. Они предлагают сад наслаждений — но у каждого цветка есть шипы.',
      'Лунный иллюзионист, исполняющий связь без уязвимости. Маска великолепна — и она никогда не снимается.',
      'Благовонный кинжал, обёрнутый в бархат. Они заставляют каждого чувствовать себя особенным, не подпуская никого достаточно близко, чтобы увидеть обычное underneath.',
    ],
  },
  gift_archetypes: {
    en: [
      'A radiant presence that has transmuted suffering into wisdom. They hold space for others without losing themselves in the process.',
      'A harmonized soul whose inner balance creates a field of calm around them. Their wholeness is hard-won and generously shared.',
      'A grounded mystic who walks between worlds — feeling deeply without drowning, thinking clearly without freezing. Presence is their superpower.',
      'A living bridge between shadow and light, integrating all parts of themselves with compassionate awareness. They model what healing looks like.',
    ],
    ru: [
      'Сияющее присутствие, превратившее страдание в мудрость. Они держат пространство для других, не теряя себя в процессе.',
      'Гармонизированная душа, чей внутренний баланс создаёт поле спокойствия вокруг. Их целостность завоёвана тяжело и щедро разделяема.',
      'Заземлённый мистик, ходящий между мирами — глубоко чувствующий без погружения, ясно мыслящий без замерзания. Присутствие — их суперсила.',
      'Живой мост между тенью и светом, интегрирующий все части себя с сострадательным осознанием. Они демонстрируют, как выглядит исцеление.',
    ],
  },
  disorganized_attachment_shadows: {
    en: [
      'A heart that beats in two directions at once — reaching desperately toward connection while building walls against it. Every relationship becomes an impossible choice between suffocation and starvation.',
      'The walking paradox: craving intimacy with an intensity that frightens others, then fleeing when it arrives. Their deepest fear is not abandonment or engulfment — it is that both might happen simultaneously.',
      'A soul frozen between two fires — the fire of needing and the fire of fearing. They live in the threshold, never fully inside or outside of connection, exhausted by the war within.',
      'An emotional compass that spins wildly between approach and avoidance. They know what they want but cannot tolerate having it, creating relationships defined by oscillation and exhaustion.',
    ],
    ru: [
      'Сердце, бьющееся сразу в две стороны — отчаянно тянется к близости и одновременно строит стены от неё. Каждые отношения превращаются в невозможный выбор между удушьем и голодом.',
      'Ходячий парадокс: жаждет близости так страстно, что пугает других, а когда близость приходит — бежит. Самый глубокий страх — что покинутость и поглощение случатся одновременно.',
      'Душа, замёрзшая между двумя огнями — огнём нужды и огнём страха. Живёт на пороге, никогда не входя в связь до конца и никогда не выходя из неё, истощённая внутренней войной.',
      'Эмоциональный компас, который безостановочно крутится между «идти к» и «бежать от». Они знают, чего хотят — но не могут это вынести. Отношения становятся чередой качелей и усталости.',
    ],
  },
};

// --- Deterministic Hash ---

function hashCoordinates(coords: number[]): number {
  let h = 0x811c9dc5; // FNV offset basis
  for (const c of coords) {
    // Quantize to 2 decimal places for stability
    const quantized = Math.round(c * 100);
    h = h ^ quantized;
    h = Math.imul(h, 0x01000193); // FNV prime
  }
  return (h >>> 0); // unsigned
}

function pickFromPool<T>(pool: T[], hash: number): T {
  return pool[Math.abs(hash) % pool.length];
}

// --- Cluster Assignment ---

function assignCluster(coords: [number, number, number, number], poles: PoleScores): string {
  const [agency, temperature, focus, attachment] = coords;

  // Gift check: healthy relational patterns near center
  if (poles.healthScore > 0.35 && Math.abs(agency) < 0.4 && Math.abs(temperature) < 0.4) {
    return 'gift_archetypes';
  }

  // Balanced/undifferentiated: all poles near zero = no strong shadow tendency
  const maxAbs = Math.max(Math.abs(agency), Math.abs(temperature), Math.abs(focus), Math.abs(attachment));
  if (maxAbs < 0.15) {
    return 'gift_archetypes';
  }

  // Seductive avoidance: hot, self-focused, avoidant
  if (temperature > 0.2 && focus < -0.1 && attachment < -0.3) {
    return 'seductive_avoidance_shadows';
  }

  // Control: active + cool
  if (agency < -0.2 && temperature < -0.1) {
    return 'control_shadows';
  }

  // Emotional storm: active + hot
  if (agency < -0.2 && temperature > 0.2) {
    return 'emotional_storm_shadows';
  }

  // Avoidant intellectual: receptive + cool
  if (agency > 0.2 && temperature < -0.1) {
    return 'avoidant_intellectual_shadows';
  }

  // Anxious connection: receptive + hot
  if (agency > 0.2 && temperature > 0.2) {
    return 'anxious_connection_shadows';
  }

  // Default fallback: use attachment as tiebreaker
  if (attachment < -0.1) {
    return agency < 0 ? 'control_shadows' : 'avoidant_intellectual_shadows';
  }
  return agency < 0 ? 'emotional_storm_shadows' : 'anxious_connection_shadows';
}

// --- Wound/Shadow Templates per Cluster ---

const WOUND_TEMPLATES: Record<string, Record<string, string[]>> = {
  control_shadows: {
    en: [
      'Rigid control masking deep insecurity',
      'Cannot receive love, only commands',
      'Hyper-vigilance born from early chaos',
      'Perfectionism as armor against shame',
    ],
    ru: [
      'Жёсткий контроль, скрывающий глубокую неуверенность',
      'Не способен принимать любовь, только приказы',
      'Гипервигильность, рождённая ранним хаосом',
      'Перфекционизм как броня против стыда',
    ],
  },
  emotional_storm_shadows: {
    en: [
      'Volcanic emotions that overwhelm connection',
      'Reactivity born from unmet needs',
      'Passion that burns bridges',
      'Intensity that masks terror of emptiness',
    ],
    ru: [
      'Вулканические эмоции, разрушающие связи',
      'Реактивность от неудовлетворённых потребностей',
      'Страсть, сжигающая мосты',
      'Интенсивность, маскирующая страх пустоты',
    ],
  },
  avoidant_intellectual_shadows: {
    en: [
      'Emotional withdrawal as self-protection',
      'Analysis as substitute for feeling',
      'Distance mistaken for safety',
      'Invisibility as a survival strategy',
    ],
    ru: [
      'Эмоциональное отстранение как самозащита',
      'Анализ как заменитель чувств',
      'Дистанция, принятая за безопасность',
      'Невидимость как стратегия выживания',
    ],
  },
  anxious_connection_shadows: {
    en: [
      'Self-abandonment to maintain connection',
      'Overwhelming need for reassurance',
      'Absorbing others\' emotions as identity',
      'Shape-shifting to be lovable',
    ],
    ru: [
      'Отказ от себя ради сохранения связи',
      'Подавляющая потребность в подтверждении',
      'Поглощение чужих эмоций как идентичность',
      'Трансформация, чтобы быть любимым',
    ],
  },
  seductive_avoidance_shadows: {
    en: [
      'Magnetic attraction with commitment avoidance',
      'Charm as a wall against intimacy',
      'Entertainment as deflection from vulnerability',
      'Intensity without depth',
    ],
    ru: [
      'Магнитное притяжение с избеганием обязательств',
      'Обаяние как стена против близости',
      'Развлечение как отвлечение от уязвимости',
      'Интенсивность без глубины',
    ],
  },
  gift_archetypes: {
    en: [
      'The wound that became wisdom',
      'Scars that map the journey to wholeness',
      'Pain transmuted into presence',
      'The crack where the light enters',
    ],
    ru: [
      'Рана, ставшая мудростью',
      'Шрамы, отражающие путь к целостности',
      'Боль, превращённая в присутствие',
      'Трещина, куда проникает свет',
    ],
  },
  disorganized_attachment_shadows: {
    en: [
      'Simultaneously craves and fears intimate connection — a prison of competing needs',
      'Wants closeness desperately but panics when it arrives — the classic approach-avoidance conflict',
      'Love feels both like oxygen and drowning — can neither stay nor leave',
      'Deeply longs for connection while being terrified of the vulnerability it requires',
    ],
    ru: [
      'Одновременно жаждет и боится близости — тюрьма двух взаимоисключающих потребностей',
      'Отчаянно хочет близости, но впадает в панику, когда она возникает — классический конфликт «идти к — бежать от»',
      'Любовь ощущается то как глоток воздуха, то как вода, заполняющая лёгкие — невозможно ни остаться, ни уйти',
      'Глубоко жаждет связи и одновременно панически боится уязвимости, которой она требует',
    ],
  },
};

const SHADOW_TEMPLATES: Record<string, Record<string, string[]>> = {
  control_shadows: {
    en: ['Rigid Domination', 'Frozen Standards', 'Emotional Armoring', 'Compulsive Order'],
    ru: ['Жёсткое Доминирование', 'Замороженные Стандарты', 'Эмоциональная Броня', 'Компульсивный Порядок'],
  },
  emotional_storm_shadows: {
    en: ['Reactive Fire', 'Destructive Passion', 'Emotional Flooding', 'Chaos Addiction'],
    ru: ['Реактивный Огонь', 'Разрушительная Страсть', 'Эмоциональное Наводнение', 'Зависимость от Хаоса'],
  },
  avoidant_intellectual_shadows: {
    en: ['Radical Detachment', 'Frozen Analysis', 'Invisible Walls', 'Emotional Exile'],
    ru: ['Радикальная Отстранённость', 'Замороженный Анализ', 'Невидимые Стены', 'Эмоциональное Изгнание'],
  },
  anxious_connection_shadows: {
    en: ['Identity Dissolution', 'Emotional Sponging', 'Resentful Sacrifice', 'Chronic Accommodation'],
    ru: ['Растворение Личности', 'Эмоциональное Впитывание', 'Обиженная Жертва', 'Хроническое Уступание'],
  },
  seductive_avoidance_shadows: {
    en: ['Seductive Distance', 'Deflective Charm', 'Illusive Intimacy', 'Perpetual Chase'],
    ru: ['Соблазнительная Дистанция', 'Отводящее Обаяние', 'Иллюзорная Близость', 'Вечная Погоня'],
  },
  gift_archetypes: {
    en: ['Can become rigid in balance', 'Risk of spiritual bypass', 'Over-generosity', 'Naive trust'],
    ru: ['Может стать жёстким в равновесии', 'Риск духовного обхода', 'Чрезмерная щедрость', 'Наивное доверие'],
  },
  disorganized_attachment_shadows: {
    en: ['Push-Pull Cyclone', 'Approach-Avoidance Trap', 'Emotional Whiplash', 'Frozen Yearning'],
    ru: ['Циклон «тянусь — отстраняюсь»', 'Ловушка сближения-избегания', 'Эмоциональные качели', 'Замёрзшее томление'],
  },
};

const INVITATION_TEMPLATES: Record<string, Record<string, string[]>> = {
  control_shadows: {
    en: [
      'To release control and learn to receive',
      'To embrace imperfection as the gateway to connection',
      'To find safety in vulnerability, not just vigilance',
      'To let the fortress walls come down, one brick at a time',
    ],
    ru: [
      'Отпустить контроль и научиться принимать',
      'Принять несовершенство как путь к связи',
      'Обрести безопасность в уязвимости, а не только в бдительности',
      'Опустить стены крепости, кирпич за кирпичом',
    ],
  },
  emotional_storm_shadows: {
    en: [
      'To find the ground within the storm',
      'To channel intensity into creation, not destruction',
      'To sit with the fire without burning everything down',
      'To discover that stillness is not emptiness',
    ],
    ru: [
      'Найти опору внутри бури',
      'Направить интенсивность в творчество, а не разрушение',
      'Сидеть с огнём, не сжигая всё дотла',
      'Обнаружить, что тишина — это не пустота',
    ],
  },
  avoidant_intellectual_shadows: {
    en: [
      'To risk being seen in your true form',
      'To step into the river of life instead of studying it from the bank',
      'To let the first crack appear in the ice',
      'To discover that feeling is not the enemy',
    ],
    ru: [
      'Рискнуть показаться в истинном виде',
      'Войти в реку жизни, а не изучать её с берега',
      'Позволить первой трещине появиться во льду',
      'Обнаружить, что чувства — не враг',
    ],
  },
  anxious_connection_shadows: {
    en: [
      'To honor your own needs as sacred',
      'To disappoint someone and survive the experience',
      'To discover which relationships survive self-revelation',
      'To build boundaries that honor both self and other',
    ],
    ru: [
      'Почтить собственные потребности как священные',
      'Разочаровать кого-то и пережить этот опыт',
      'Обнаружить, какие отношения выдерживают самораскрытие',
      'Выстроить границы, уважающие и себя, и другого',
    ],
  },
  seductive_avoidance_shadows: {
    en: [
      'To stay and witness what unfolds after the chase',
      'To trust that authenticity is more magnetic than any mask',
      'To discover intimacy beyond the performance',
      'To let someone see behind the curtain',
    ],
    ru: [
      'Остаться и увидеть, что происходит после погони',
      'Доверять, что подлинность привлекательнее любой маски',
      'Обрести близость за пределами представления',
      'Позволить кому-то заглянуть за занавес',
    ],
  },
  gift_archetypes: {
    en: [
      'To share your hard-won wisdom with those still walking the path',
      'To trust that your presence alone is a gift',
      'To remain grounded even as you soar',
      'To receive as generously as you give',
    ],
    ru: [
      'Поделиться завоеванной мудростью с теми, кто ещё в пути',
      'Доверять, что ваше присутствие — уже дар',
      'Оставаться заземлённым, даже паря ввысь',
      'Принимать так же щедро, как отдавать',
    ],
  },
  disorganized_attachment_shadows: {
    en: [
      'To hold both the longing for closeness and the fear of it with equal compassion',
      'To discover that safety and intimacy are not mutually exclusive',
      'To find the courage to stay present when every cell screams to flee or cling',
      'To build a relationship with your own contradictions before trying to resolve them in another',
    ],
    ru: [
      'Удерживать и тягу к близости, и страх перед ней — с равным состраданием к обоим',
      'Открыть для себя, что безопасность и близость не исключают друг друга',
      'Найти в себе смелость оставаться, когда всё внутри кричит «беги!» или «цепляйся!»',
      'Познакомиться с собственными противоречиями, прежде чем пытаться разрешить их через другого',
    ],
  },
};

const CORE_BELIEF_TEMPLATES: Record<string, Record<string, string[]>> = {
  control_shadows: {
    en: [
      'The world is unsafe. I must control everything to protect myself.',
      'If I am not perfect, I am nothing.',
      'Vulnerability is weakness. Strength means never needing anyone.',
      'Order is safety. Chaos is death.',
    ],
    ru: [
      'Мир небезопасен. Я должен всё контролировать, чтобы защитить себя.',
      'Если я не идеален, я — ничто.',
      'Уязвимость — это слабость. Сила означает никогда ни в ком не нуждаться.',
      'Порядок — это безопасность. Хаос — это смерть.',
    ],
  },
  emotional_storm_shadows: {
    en: [
      'My emotions are overwhelming and dangerous. They control me.',
      'If I feel it, I must express it — there is no middle ground.',
      'Intensity is the only proof that something is real.',
      'The louder I am, the more likely I am to be heard.',
    ],
    ru: [
      'Мои эмоции подавляющие и опасные. Они контролируют меня.',
      'Если я это чувствую, я должен это выразить — золотой середины нет.',
      'Интенсивность — единственное доказательство реальности.',
      'Чем громче я, тем вероятнее, что меня услышат.',
    ],
  },
  avoidant_intellectual_shadows: {
    en: [
      'To be seen is to be annihilated. Safety lies in invisibility.',
      'Feelings are weakness. Logic is the only reliable guide.',
      'If I can understand it, I can control it — and I must control it.',
      'Distance is safety. Connection is contamination.',
    ],
    ru: [
      'Быть увиденным — значит быть уничтоженным. Безопасность в невидимости.',
      'Чувства — это слабость. Логика — единственный надёжный проводник.',
      'Если я могу понять это, я могу контролировать — и я должен контролировать.',
      'Дистанция — безопасность. Связь — заражение.',
    ],
  },
  anxious_connection_shadows: {
    en: [
      'My needs don\'t matter. My worth comes from serving others.',
      'I must become what others want me to be, or I will be abandoned.',
      'Other people\'s emotions define my reality.',
      'If I am not needed, I do not exist.',
    ],
    ru: [
      'Мои потребности не важны. Моя ценность — в служении другим.',
      'Я должен стать тем, чего хотят другие, или меня бросят.',
      'Чужие эмоции определяют мою реальность.',
      'Если я не нужен, я не существую.',
    ],
  },
  seductive_avoidance_shadows: {
    en: [
      'I can attract anyone, but if they get too close they\'ll see I\'m not enough.',
      'If I keep everything light, no one will notice my terror.',
      'The chase is the relationship. The catch is the ending.',
      'My power is in the mystery. True knowledge would destroy it.',
    ],
    ru: [
      'Я могу привлечь кого угодно, но если подойдут слишком близко — увидят, что я недостаточен.',
      'Если я буду держать всё лёгким, никто не заметит мой ужас.',
      'Погоня — это и есть отношения. Добыча — это конец.',
      'Моя сила — в загадке. Истинное знание разрушит её.',
    ],
  },
  gift_archetypes: {
    en: [
      'I am the source of my experience. My internal state creates my external reality.',
      'Connection and autonomy are a dance, not a conflict.',
      'All parts of me are valuable — shadows and gifts alike.',
      'My body is an intelligent guide. True knowing integrates mind and heart.',
    ],
    ru: [
      'Я — источник своего опыта. Моё внутреннее состояние создаёт внешнюю реальность.',
      'Связь и автономия — это танец, а не конфликт.',
      'Все мои части ценны — и тени, и дары.',
      'Моё тело — мудрый проводник. Истинное знание объединяет разум и сердце.',
    ],
  },
  disorganized_attachment_shadows: {
    en: [
      'I need you desperately, but if you get close you will destroy me. I am trapped between abandonment and engulfment.',
      'Love is the most dangerous thing in the world — and the thing I cannot live without.',
      'If I let you in, you will see the brokenness and leave. If I keep you out, I will die of loneliness.',
      'My needs are a trap. Expressing them pushes people away. Suppressing them makes me disappear.',
    ],
    ru: [
      'Я отчаянно нуждаюсь в тебе — но если ты подойдёшь близко, ты меня уничтожишь. Я в ловушке между покинутостью и поглощением.',
      'Любовь — самое опасное, что есть в мире. И единственное, без чего я не могу жить.',
      'Если я впущу тебя — ты увидишь мою сломанность и уйдёшь. Если не впущу — я умру от одиночества.',
      'Мои потребности — ловушка. Если их высказать — оттолкну людей. Если подавить — сам исчезну.',
    ],
  },
};

const ATTRACTS_TEMPLATES: Record<string, Record<string, string[]>> = {
  control_shadows: {
    en: [
      'Rebels who challenge their power, or those who submit to it',
      'Critics who mirror their inner judge',
      'People who feel unsafe, reinforcing their protector role',
      'Chaotic situations that justify their need for control',
    ],
    ru: [
      'Бунтари, бросающие вызов их власти, или те, кто покоряется ей',
      'Критики, отражающие их внутреннего судью',
      'Люди, чувствующие себя небезопасно, подкрепляющие их роль защитника',
      'Хаотичные ситуации, оправдывающие потребность в контроле',
    ],
  },
  emotional_storm_shadows: {
    en: [
      'Calm, avoidant partners they try to provoke',
      'Anxious partners who fuel the drama',
      'Stable people they perceive as "boring"',
      'Other intense people, creating escalation loops',
    ],
    ru: [
      'Спокойные, избегающие партнёры, которых они пытаются спровоцировать',
      'Тревожные партнёры, разжигающие драму',
      'Стабильные люди, кажущиеся им «скучными»',
      'Другие интенсивные люди, создающие петли эскалации',
    ],
  },
  avoidant_intellectual_shadows: {
    en: [
      'Anxious partners who chase them, reinforcing the need to disappear',
      'Emotionally expressive people they can study from a distance',
      'Other avoidant people, creating parallel lives of solitude',
      'People who idealize their "calmness"',
    ],
    ru: [
      'Тревожные партнёры, преследующие их, подкрепляя потребность исчезнуть',
      'Эмоционально выразительные люди, которых можно изучать издалека',
      'Другие избегающие люди, создающие параллельные жизни одиночества',
      'Люди, идеализирующие их «спокойствие»',
    ],
  },
  anxious_connection_shadows: {
    en: [
      'Takers and narcissists who exploit their generosity',
      'Demanding partners who take advantage of their lack of boundaries',
      'Emotionally chaotic partners they try to "fix"',
      'Partners with strong personalities who don\'t know the real them',
    ],
    ru: [
      'Берущие и нарциссы, эксплуатирующие их щедрость',
      'Требовательные партнёры, пользующиеся отсутствием границ',
      'Эмоционально хаотичные партнёры, которых они пытаются «починить»',
      'Партнёры с сильными личностями, не знающие их настоящих',
    ],
  },
  seductive_avoidance_shadows: {
    en: [
      'Partners who love the chase but can\'t handle the catch',
      'People easily charmed but ultimately kept at arm\'s length',
      'Admirers who become an audience, not intimate partners',
      'Other seductive avoidants, creating mutual pursuit without arrival',
    ],
    ru: [
      'Партнёры, любящие погоню, но не справляющиеся с добычей',
      'Люди, легко очарованные, но удерживаемые на расстоянии',
      'Поклонники, становящиеся аудиторией, а не близкими партнёрами',
      'Другие соблазнительные избегающие, создающие взаимную погоню без прибытия',
    ],
  },
  gift_archetypes: {
    en: [
      'Other sovereign beings for co-creation and conscious relationship',
      'Partners who value both deep intimacy and healthy independence',
      'Those ready for deep, present connection beyond the surface',
      'Collaborators who see challenges as creative opportunities',
    ],
    ru: [
      'Другие суверенные существа для сотворчества и осознанных отношений',
      'Партнёры, ценящие и глубокую близость, и здоровую независимость',
      'Те, кто готов к глубокой, присутствующей связи за пределами поверхности',
      'Сотрудники, видящие вызовы как творческие возможности',
    ],
  },
  disorganized_attachment_shadows: {
    en: [
      'Partners who are alternately available and distant, recreating the original inconsistent caregiving',
      'Intense partners who trigger both the longing and the terror simultaneously',
      'Stable partners who feel "too safe" and therefore boring, or chaotic partners who feel "alive" but terrifying',
      'Partners with their own attachment wounds, creating mutual approach-avoidance dances',
    ],
    ru: [
      'Партнёры, которые то рядом, то пропадают — воссоздают знакомый с детства паттерн непредсказуемой заботы',
      'Интенсивные партнёры, в которых одновременно пробуждают и жажду, и ужас',
      'Стабильные партнёры, кажущиеся «слишком безопасными» (и потому скучными), либо хаотичные — те кажутся «живыми», но пугают',
      'Партнёры с собственными ранами привязанности — возникают взаимные танцы «иду к тебе — убегаю от тебя»',
    ],
  },
};

// --- Main Generation ---

export function generateArchetypes(responses: number[], lang: 'en' | 'ru' = 'en'): {
  archetypes: ScoredArchetype[];
  dynamics: PartsDynamic[];
} {
  const poles = computePoleScores(responses);
  const profiles = buildProfiles(poles);
  const origin = deriveDevelopmentalOrigin(responses, poles);

  if (profiles.length === 0) {
    // Edge case: all quiet dimensions — create one archetype at center
    profiles.push({ poles: [], center: [...poles.center] as [number, number, number, number], rawScore: 0.1 });
  }

  // Compute raw prominence from profile scores
  const totalRaw = profiles.reduce((sum, p) => sum + p.rawScore, 0);

  const getPool = (pools: Record<string, Record<string, string[]>>, cluster: string): string[] => {
    return pools[cluster]?.[lang] || pools[cluster]?.['en'] || pools['gift_archetypes']?.[lang] || pools['gift_archetypes']?.['en'] || [];
  };

  const archetypes: ScoredArchetype[] = profiles.map(profile => {
    const coords = profile.center.map(c => clamp(c)) as [number, number, number, number];
    const cluster = assignCluster(coords, poles);
    const h = hashCoordinates(coords);

    const namePool = getPool(NAME_POOLS, cluster);
    const symbolPool = SYMBOL_POOLS[cluster] || SYMBOL_POOLS['gift_archetypes'];
    const descPool = getPool(DESCRIPTION_TEMPLATES, cluster);
    const woundPool = getPool(WOUND_TEMPLATES, cluster);
    const shadowPool = getPool(SHADOW_TEMPLATES, cluster);
    const invitationPool = getPool(INVITATION_TEMPLATES, cluster);
    const beliefPool = getPool(CORE_BELIEF_TEMPLATES, cluster);
    const attractsPool = getPool(ATTRACTS_TEMPLATES, cluster);

    const prominence = totalRaw > 0 ? Math.round((profile.rawScore / totalRaw) * 100) : Math.round(100 / profiles.length);
    const size = clamp(0.4 + profile.primaryStrength * 0.6, 0.4, 1.0);

    // Determine if this archetype carries the disorganized modifier.
    // Set on archetypes originating from the attachment dimension when the person
    // has disorganized attachment (both anxious and avoidant poles active).
    const hasDisorganizedModifier = poles.disorganizedAttachment
      && profile.poles.some(p => p.dimension === 3);

    const partType: PartType = cluster === 'control_shadows' || cluster === 'avoidant_intellectual_shadows'
      ? 'manager'
      : cluster === 'emotional_storm_shadows' || cluster === 'seductive_avoidance_shadows'
        ? 'firefighter'
        : cluster === 'anxious_connection_shadows' || cluster === 'disorganized_attachment_shadows'
          ? 'exile'
          : 'self';

    return {
      name: pickFromPool(namePool, h),
      symbol: pickFromPool(symbolPool, h + 1),
      coordinates: coords,
      cluster,
      prominence,
      size: Math.round(size * 100) / 100,
      description: pickFromPool(descPool, h + 7),
      wound: pickFromPool(woundPool, h + 2),
      shadow: pickFromPool(shadowPool, h + 3),
      invitation: pickFromPool(invitationPool, h + 4),
      coreBelief: pickFromPool(beliefPool, h + 5),
      attracts: pickFromPool(attractsPool, h + 6),
      partType,
      developmentalOrigin: deriveArchetypeOrigin(coords, origin),
      disorganizedModifier: hasDisorganizedModifier,
      gestalt: profile.gestalt,
    };
  });

  // Normalize prominence to sum exactly to 100
  normalizeProminence(archetypes);

  // Resolve name collisions: if two archetypes share a name, disambiguate
  // by re-hashing with the archetype's index as a secondary seed
  deduplicateNames(archetypes);

  return { archetypes, dynamics: generatePartsDynamics(archetypes, lang) };
}

// --- Profile Builder ---

interface ArchetypeProfile {
  poles: { dimension: number; pole: 'positive' | 'negative'; value: number }[];
  center: [number, number, number, number];
  rawScore: number;
  primaryStrength: number; // pre-merge strength for size calculation
  gestalt?: string; // named cross-dimensional pattern
}

function buildProfiles(poles: PoleScores): ArchetypeProfile[] {
  const dims: { pos: number; neg: number; idx: number }[] = [
    { pos: poles.agencyReceptive, neg: poles.agencyActive, idx: 0 },
    { pos: poles.tempHot,          neg: poles.tempCool,      idx: 1 },
    { pos: poles.focusOther,       neg: poles.focusSelf,     idx: 2 },
    { pos: poles.attAnxious,       neg: poles.attAvoidant,   idx: 3 },
  ];

  const profiles: ArchetypeProfile[] = [];

  // --- Gestalt detection: cross-dimensional coherent patterns ---
  // These take precedence over individual dimension profiles when 2+ dimensions align.
  const gestalts: { name: string; coords: [number, number, number, number]; dimensions: number[]; strength: number }[] = [];

  const [aC, tC, fC, attC] = poles.center;

  // "Stoic Fortress" — active + cool (agency active + temperature cool)
  if (aC < -0.3 && tC < -0.2) {
    gestalts.push({
      name: 'Stoic Fortress',
      coords: [aC, tC, fC * 0.5, attC * 0.5],
      dimensions: [0, 1],
      strength: Math.min(-aC, -tC),
    });
  }

  // "Volcanic Yearning" — active + hot
  if (aC < -0.3 && tC > 0.2) {
    gestalts.push({
      name: 'Volcanic Yearning',
      coords: [aC, tC, fC * 0.5, attC * 0.5],
      dimensions: [0, 1],
      strength: Math.min(-aC, tC),
    });
  }

  // "Distant Observer" — receptive + cool
  if (aC > 0.3 && tC < -0.2) {
    gestalts.push({
      name: 'Distant Observer',
      coords: [aC, tC, fC * 0.5, attC * 0.5],
      dimensions: [0, 1],
      strength: Math.min(aC, -tC),
    });
  }

  // "Tender Flame" — receptive + hot
  if (aC > 0.3 && tC > 0.2) {
    gestalts.push({
      name: 'Tender Flame',
      coords: [aC, tC, fC * 0.5, attC * 0.5],
      dimensions: [0, 1],
      strength: Math.min(aC, tC),
    });
  }

  // "Walled Garden" — self-focused + avoidant
  if (fC < -0.3 && attC < -0.2) {
    gestalts.push({
      name: 'Walled Garden',
      coords: [aC * 0.5, tC * 0.5, fC, attC],
      dimensions: [2, 3],
      strength: Math.min(-fC, -attC),
    });
  }

  // "Open Wound" — other-focused + anxious
  if (fC > 0.3 && attC > 0.2) {
    gestalts.push({
      name: 'Open Wound',
      coords: [aC * 0.5, tC * 0.5, fC, attC],
      dimensions: [2, 3],
      strength: Math.min(fC, attC),
    });
  }

  // Track which dimensions are consumed by gestalts
  const gestaltDims = new Set(gestalts.flatMap(g => g.dimensions));

  // Add gestalt profiles
  for (const g of gestalts) {
    profiles.push({
      poles: g.dimensions.map(d => ({ dimension: d, pole: poles.center[d] >= 0 ? 'positive' as const : 'negative' as const, value: poles.center[d] })),
      center: g.coords.map(c => clamp(c)) as [number, number, number, number],
      rawScore: g.strength,
      primaryStrength: g.strength,
      gestalt: g.name,
    });
  }

  // For each dimension, create an archetype at the dominant pole position.
  // If there's tension (both poles active), create TWO archetypes for that dimension.
  for (const dim of dims) {
    // Skip dimensions already captured by a gestalt pattern
    if (gestaltDims.has(dim.idx)) continue;

    const posStr = positivePoleStrength(dim.pos);
    const negStr = negativePoleStrength(dim.neg);
    const posProfile = { pole: 'positive' as const, value: posStr, strength: posStr };
    const negProfile = { pole: 'negative' as const, value: -negStr, strength: negStr };

    // Primary pole: whichever is stronger
    const primary = posStr >= negStr ? posProfile : negProfile;

    if (primary.strength > 0.05) {
      // Build coordinates: use the primary pole for this dimension, user center for others
      // but nudge other dimensions slightly to create spread
      const coords: number[] = [...poles.center];
      coords[dim.idx] = primary.value;

      // Add slight offsets to adjacent dimensions so archetypes don't cluster too tightly
      for (let i = 0; i < 4; i++) {
        if (i !== dim.idx) {
          coords[i] = clamp(coords[i] * 0.85 + primary.value * 0.15);
        }
      }

      profiles.push({
        poles: [{ dimension: dim.idx, pole: primary.pole, value: primary.value }],
        center: coords.map(c => clamp(c)) as [number, number, number, number],
        rawScore: primary.strength,
        primaryStrength: primary.strength,
      });
    }

    // Secondary archetype for tension: if the weaker pole is also significant
    const secondary = posStr >= negStr ? negProfile : posProfile;

    if (secondary.strength > 0.15 && Math.abs(secondary.value - primary.value) > 0.15) {
      const coords: number[] = [...poles.center];
      coords[dim.idx] = secondary.value;

      for (let i = 0; i < 4; i++) {
        if (i !== dim.idx) {
          coords[i] = clamp(coords[i] * 0.9 + secondary.value * 0.1);
        }
      }

      profiles.push({
        poles: [{ dimension: dim.idx, pole: secondary.pole, value: secondary.value }],
        center: coords.map(c => clamp(c)) as [number, number, number, number],
        rawScore: secondary.strength * 0.7, // Secondary archetype gets less prominence
        primaryStrength: secondary.strength * 0.7,
      });
    }
  }

  // Add a gift archetype if the user has healthy relational patterns
  // OR if all dimensions are near zero (balanced = healthy center)
  const allNearZero = dims.every(d => positivePoleStrength(d.pos) < 0.15 && negativePoleStrength(d.neg) < 0.15);
  if (poles.healthScore > 0.2 || allNearZero) {
    const giftCoords: number[] = poles.center.map(v => clamp(v * 0.4));
    const existingGift = profiles.some(p =>
      euclidean(p.center, giftCoords) < 0.5
    );
    if (!existingGift) {
      profiles.push({
        poles: [],
        center: giftCoords as [number, number, number, number],
        rawScore: Math.max(poles.healthScore * 1.5, allNearZero ? 0.3 : 0),
        primaryStrength: Math.max(poles.healthScore * 1.5, allNearZero ? 0.3 : 0),
      });
    }
  }

  // Edge case: no profiles generated (all answers near center)
  // Create a single balanced archetype at the actual center — this is real data
  if (profiles.length === 0) {
    profiles.push({
      poles: [],
      center: [...poles.center] as [number, number, number, number],
      rawScore: 0.1,
      primaryStrength: 0.1,
    });
  }

  return deduplicateProfiles(profiles);
}

function deduplicateProfiles(profiles: ArchetypeProfile[]): ArchetypeProfile[] {
  const MERGE_THRESHOLD = 0.4;

  for (let i = 0; i < profiles.length; i++) {
    for (let j = i + 1; j < profiles.length; j++) {
      const dist = euclidean(profiles[i].center, profiles[j].center);
      if (dist < MERGE_THRESHOLD) {
        // Merge j into i (weighted by rawScore)
        const total = profiles[i].rawScore + profiles[j].rawScore;
        const wI = profiles[i].rawScore / total;
        const wJ = profiles[j].rawScore / total;
        profiles[i].center = profiles[i].center.map((c, k) =>
          clamp(c * wI + profiles[j].center[k] * wJ)
        ) as [number, number, number, number];
        profiles[i].rawScore = total;
        profiles.splice(j, 1);
        j--; // recheck index
      }
    }
  }

  // Cap at 8 archetypes, keep highest rawScore
  if (profiles.length > 8) {
    profiles.sort((a, b) => b.rawScore - a.rawScore);
    profiles.length = 8;
  }

  return profiles;
}

export function euclidean(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0));
}

// --- Parts Dynamics (IFS) ---

export interface PartsDynamic {
  protector: string;
  protects: string;
  mechanism: 'manages' | 'firefights' | 'carries_wound';
  description: string;
}

export function generatePartsDynamics(archetypes: ScoredArchetype[], lang: 'en' | 'ru' = 'en'): PartsDynamic[] {
  const managers = archetypes.filter(a => a.partType === 'manager');
  const firefighters = archetypes.filter(a => a.partType === 'firefighter');
  const exiles = archetypes.filter(a => a.partType === 'exile');
  const selfParts = archetypes.filter(a => a.partType === 'self');

  const dynamics: PartsDynamic[] = [];

  for (const mgr of managers) {
    if (exiles.length === 0) break;
    const nearest = exiles.reduce((best, ex) =>
      euclidean(mgr.coordinates, ex.coordinates) < euclidean(mgr.coordinates, best.coordinates) ? ex : best
    , exiles[0]);
    dynamics.push({
      protector: mgr.name,
      protects: nearest.name,
      mechanism: 'manages',
      description: lang === 'ru'
        ? `${mgr.name} управляет, чтобы защитить рану ${nearest.name}`
        : `${mgr.name} manages to protect ${nearest.name}'s wound`,
    });
  }

  for (const ff of firefighters) {
    if (managers.length === 0) break;
    const nearest = managers.reduce((best, mgr) =>
      euclidean(ff.coordinates, mgr.coordinates) < euclidean(ff.coordinates, best.coordinates) ? mgr : best
    , managers[0]);
    dynamics.push({
      protector: ff.name,
      protects: nearest.name,
      mechanism: 'firefights',
      description: lang === 'ru'
        ? `${ff.name} реактивно включается, когда ${nearest.name} не справляется`
        : `${ff.name} reactively takes over when ${nearest.name} fails`,
    });
  }

  // When no managers/firefighters exist, create dynamics from exile-to-exile
  // or exile-to-self interactions (wound carrying patterns)
  if (dynamics.length === 0 && exiles.length >= 2) {
    for (let i = 0; i < exiles.length - 1; i++) {
      dynamics.push({
        protector: exiles[i].name,
        protects: exiles[i + 1].name,
        mechanism: 'carries_wound',
        description: lang === 'ru'
          ? `${exiles[i].name} несёт рану, перекликающуюся с ${exiles[i + 1].name}`
          : `${exiles[i].name} carries a wound that resonates with ${exiles[i + 1].name}`,
      });
    }
  }

  // Self-to-exile dynamics: when self parts exist alongside exiles
  if (dynamics.length === 0 && selfParts.length > 0 && exiles.length > 0) {
    for (const self of selfParts) {
      const nearest = exiles.reduce((best, ex) =>
        euclidean(self.coordinates, ex.coordinates) < euclidean(self.coordinates, best.coordinates) ? ex : best
      , exiles[0]);
      dynamics.push({
        protector: self.name,
        protects: nearest.name,
        mechanism: 'carries_wound',
        description: lang === 'ru'
          ? `${self.name} стремится исцелить рану ${nearest.name}`
          : `${self.name} holds space for ${nearest.name}'s wound`,
      });
    }
  }

  // Fallback: single exile carries its own wound
  if (dynamics.length === 0 && exiles.length === 1) {
    dynamics.push({
      protector: exiles[0].name,
      protects: exiles[0].name,
      mechanism: 'carries_wound',
      description: lang === 'ru'
        ? `${exiles[0].name} несёт рану: «${exiles[0].wound}»`
        : `${exiles[0].name} carries the wound: "${exiles[0].wound}"`,
    });
  }

  return dynamics;
}

/**
 * Resolves name collisions across archetypes.
 * If two archetypes share the same name, the second one is re-picked
 * from its name pool using the archetype index as a disambiguation seed.
 */
function deduplicateNames(archetypes: ScoredArchetype[]): void {
  const seen = new Set<string>();
  for (let i = 0; i < archetypes.length; i++) {
    const a = archetypes[i];
    if (seen.has(a.name)) {
      // Re-hash from coordinates with archetype index as secondary seed
      const pool = NAME_POOLS[a.cluster]?.['en'] || NAME_POOLS['gift_archetypes']?.['en'] || [];
      if (pool.length > 0) {
        const newHash = hashCoordinates(a.coordinates) + i * 31;
        a.name = pool[Math.abs(newHash) % pool.length];
      }
    }
    seen.add(a.name);
  }
}

function normalizeProminence(archetypes: ScoredArchetype[]): void {
  if (archetypes.length === 0) return;

  const sum = archetypes.reduce((s, a) => s + a.prominence, 0);
  if (sum === 0) {
    const equal = Math.round(100 / archetypes.length);
    archetypes.forEach(a => a.prominence = equal);
  }

  // Distribute rounding error to the largest archetype
  const currentSum = archetypes.reduce((s, a) => s + a.prominence, 0);
  const diff = 100 - currentSum;
  if (diff !== 0) {
    const largest = archetypes.reduce((max, a) => a.prominence > max.prominence ? a : max, archetypes[0]);
    largest.prominence += diff;
  }
}

// =============================================================================
// Phase 2: Clinical-Grade Computed Analyses
// =============================================================================

// --- 2.1 Complex Detection (Jungian) ---

export interface Complex {
  name: string;
  nameRu: string;
  coreWound: string;
  coreWoundRu: string;
  contributingArchetypes: string[];
  defensePattern: string;
  defensePatternRu: string;
  developmentalEra: DevelopmentalOrigin;
  severity: number; // 0-1
}

export function detectComplexes(
  archetypes: ScoredArchetype[],
  poles: PoleScores,
  lang: 'en' | 'ru' = 'en'
): Complex[] {
  const complexes: Complex[] = [];
  const clusterSet = new Set(archetypes.map(a => a.cluster));
  const origins = archetypes.map(a => a.developmentalOrigin);

  // Abandonment Complex: anxious_connection + emotional_storm
  if (clusterSet.has('anxious_connection_shadows') && clusterSet.has('emotional_storm_shadows')) {
    const anxProm = archetypes.filter(a => a.cluster === 'anxious_connection_shadows').reduce((s, a) => s + a.prominence, 0);
    const stormProm = archetypes.filter(a => a.cluster === 'emotional_storm_shadows').reduce((s, a) => s + a.prominence, 0);
    complexes.push({
      name: 'Abandonment Complex',
      nameRu: 'Комплекс покинутости',
      coreWound: 'Deep terror of abandonment drives desperate clinging and volcanic protest when connection feels threatened',
      coreWoundRu: 'Глубокий ужас покинутости ведёт к отчаянному цеплянию и вулканическому протесту, когда связь кажется под угрозой',
      contributingArchetypes: archetypes.filter(a =>
        a.cluster === 'anxious_connection_shadows' || a.cluster === 'emotional_storm_shadows'
      ).map(a => a.name),
      defensePattern: 'Protest behavior escalating to emotional storms when attachment feels insecure',
      defensePatternRu: 'Протестное поведение, перерастающее в эмоциональные бури, когда привязанность кажется небезопасной',
      developmentalEra: origins.includes('pre_verbal') ? 'pre_verbal' : 'early_attachment',
      severity: clamp((anxProm + stormProm) / 200, 0, 1),
    });
  }

  // Fortress Complex: control + avoidant_intellectual
  if (clusterSet.has('control_shadows') && clusterSet.has('avoidant_intellectual_shadows')) {
    const ctrlProm = archetypes.filter(a => a.cluster === 'control_shadows').reduce((s, a) => s + a.prominence, 0);
    const avdProm = archetypes.filter(a => a.cluster === 'avoidant_intellectual_shadows').reduce((s, a) => s + a.prominence, 0);
    complexes.push({
      name: 'Fortress Complex',
      nameRu: 'Комплекс крепости',
      coreWound: 'Vulnerability equals annihilation — the self must be fortified through control and emotional withdrawal',
      coreWoundRu: 'Уязвимость равна уничтожению — самость должна быть укреплена через контроль и эмоциональное отстранение',
      contributingArchetypes: archetypes.filter(a =>
        a.cluster === 'control_shadows' || a.cluster === 'avoidant_intellectual_shadows'
      ).map(a => a.name),
      defensePattern: 'Intellectualization and rigid control form an impenetrable defense against emotional need',
      defensePatternRu: 'Интеллектуализация и жёсткий контроль формируют непроницаемую защиту от эмоциональных потребностей',
      developmentalEra: origins.includes('oedipal') ? 'oedipal' : 'latency',
      severity: clamp((ctrlProm + avdProm) / 200, 0, 1),
    });
  }

  // Disorganized Intensity Complex: disorganized + storm
  if (clusterSet.has('disorganized_attachment_shadows') && clusterSet.has('emotional_storm_shadows')) {
    const disorgProm = archetypes.filter(a => a.cluster === 'disorganized_attachment_shadows').reduce((s, a) => s + a.prominence, 0);
    complexes.push({
      name: 'Disorganized Intensity Complex',
      nameRu: 'Комплекс дезорганизованной интенсивности',
      coreWound: 'Simultaneous terror of abandonment and engulfment creates an impossible bind — every connection becomes a threat',
      coreWoundRu: 'Одновременный ужас покинутости и поглощения создаёт невозможный узел — каждая связь становится угрозой',
      contributingArchetypes: archetypes.filter(a =>
        a.cluster === 'disorganized_attachment_shadows' || a.cluster === 'emotional_storm_shadows'
      ).map(a => a.name),
      defensePattern: 'Rapid oscillation between desperate approach and sudden withdrawal, with emotional flooding in between',
      defensePatternRu: 'Быстрые колебания между отчаянным сближением и резким отстранением, с эмоциональным затоплением между ними',
      developmentalEra: 'pre_verbal',
      severity: clamp(disorgProm / 100 + 0.3, 0, 1),
    });
  }

  // Seductive Walls Complex: seductive_avoidance + control
  if (clusterSet.has('seductive_avoidance_shadows') && clusterSet.has('control_shadows')) {
    complexes.push({
      name: 'Seductive Walls Complex',
      nameRu: 'Комплекс соблазнительных стен',
      coreWound: 'Charm and magnetism deployed to control intimacy at a distance — close enough to entice, far enough to be safe',
      coreWoundRu: 'Обаяние и магнетизм используются для контроля близости на расстоянии — достаточно близко, чтобы соблазнять, достаточно далеко, чтобы быть в безопасности',
      contributingArchetypes: archetypes.filter(a =>
        a.cluster === 'seductive_avoidance_shadows' || a.cluster === 'control_shadows'
      ).map(a => a.name),
      defensePattern: 'Strategic intimacy — offer brilliance and charm, withhold authentic vulnerability',
      defensePatternRu: 'Стратегическая близость — предлагать блеск и обаяние, утаивать подлинную уязвимость',
      developmentalEra: 'oedipal',
      severity: clamp(0.4 + negativePoleStrength(poles.attAvoidant) * 0.3, 0, 1),
    });
  }

  // Early Trauma Complex: multiple pre-verbal origins + high severity
  if (origins.filter(o => o === 'pre_verbal').length >= 2) {
    complexes.push({
      name: 'Early Trauma Complex',
      nameRu: 'Комплекс ранней травмы',
      coreWound: 'Pre-verbal wounds that cannot be named, only felt as undifferentiated threat in the body',
      coreWoundRu: 'Довербальные раны, которые невозможно назвать, можно только почувствовать как недифференцированную угрозу в теле',
      contributingArchetypes: archetypes.filter(a => a.developmentalOrigin === 'pre_verbal').map(a => a.name),
      defensePattern: 'Somatic regulation difficulties, emotional numbness alternating with flooding, dissociative tendencies',
      defensePatternRu: 'Соматические трудности регуляции, эмоциональное онемение, чередующееся с затоплением, диссоциативные тенденции',
      developmentalEra: 'pre_verbal',
      severity: clamp(0.6 + poles.healthScore * -0.4, 0.3, 1),
    });
  }

  return complexes;
}

// --- 2.2 Defense Hierarchy (IFS Escalation Map) ---

export interface DefenseLayer {
  level: number;
  label: string;
  labelRu: string;
  parts: string[];
  description: string;
  descriptionRu: string;
}

export interface DefenseEscalation {
  from: string;
  to: string;
  trigger: string;
  triggerRu: string;
}

export interface DefenseHierarchy {
  layers: DefenseLayer[];
  escalationPaths: DefenseEscalation[];
}

export function computeDefenseHierarchy(
  archetypes: ScoredArchetype[],
  poles: PoleScores,
  lang: 'en' | 'ru' = 'en'
): DefenseHierarchy {
  const managers = archetypes.filter(a => a.partType === 'manager');
  const firefighters = archetypes.filter(a => a.partType === 'firefighter');
  const exiles = archetypes.filter(a => a.partType === 'exile');

  const layers: DefenseLayer[] = [];

  // Layer 1: Managers (proactive protection)
  if (managers.length > 0) {
    layers.push({
      level: 1,
      label: 'Proactive Defenses',
      labelRu: 'Проактивные защиты',
      parts: managers.map(m => m.name),
      description: `Manager parts (${managers.map(m => m.name).join(', ')}) maintain control and prevent vulnerability triggers before they activate`,
      descriptionRu: `Части-менеджеры (${managers.map(m => m.name).join(', ')}) поддерживают контроль и предотвращают активацию уязвимости до её проявления`,
    });
  }

  // Layer 2: Firefighters (reactive protection)
  if (firefighters.length > 0) {
    layers.push({
      level: 2,
      label: 'Reactive Defenses',
      labelRu: 'Реактивные защиты',
      parts: firefighters.map(f => f.name),
      description: `Firefighter parts (${firefighters.map(f => f.name).join(', ')}) activate when managers are overwhelmed, using intense reactivity to douse emotional fires`,
      descriptionRu: `Части-пожарные (${firefighters.map(f => f.name).join(', ')}) активируются, когда менеджеры не справляются, используя интенсивную реактивность для тушения эмоциональных пожаров`,
    });
  }

  // Layer 3: Exiles (the protected wounds)
  if (exiles.length > 0) {
    layers.push({
      level: 3,
      label: 'Protected Wounds',
      labelRu: 'Защищённые раны',
      parts: exiles.map(e => e.name),
      description: `Exile parts (${exiles.map(e => e.name).join(', ')}) carry the core wounds and vulnerable feelings that the entire defensive system is built to protect`,
      descriptionRu: `Части-изгнанники (${exiles.map(e => e.name).join(', ')}) несут основные раны и уязвимые чувства, которые вся защитная система призвана оберегать`,
    });
  }

  // Escalation paths
  const escalationPaths: DefenseEscalation[] = [];

  if (managers.length > 0 && exiles.length > 0) {
    const triggerThreshold = lang === 'ru'
      ? `Когда внешняя ситуация активирует рану ${exiles[0].name}, менеджеры усиливают контроль`
      : `When external situations activate ${exiles[0].name}\'s wound, managers escalate their protective control`;
    escalationPaths.push({
      from: managers[0].name,
      to: exiles[0].name,
      trigger: triggerThreshold,
      triggerRu: triggerThreshold,
    });
  }

  if (managers.length > 0 && firefighters.length > 0) {
    const triggerFF = lang === 'ru'
      ? `Когда ${managers[0].name} не может сдержать боль, ${firefighters[0].name} реактивно включается`
      : `When ${managers[0].name} cannot contain the pain, ${firefighters[0].name} reactively takes over`;
    escalationPaths.push({
      from: managers[0].name,
      to: firefighters[0].name,
      trigger: triggerFF,
      triggerRu: triggerFF,
    });
  }

  if (firefighters.length > 0 && exiles.length > 0 && poles.tempHot > 0.4) {
    const triggerDis = lang === 'ru'
      ? `При экстремальной эмоциональной перегрузке возможна диссоциация — полная остановка всех частей`
      : `Under extreme emotional overload, dissociation is possible — complete shutdown of all parts`;
    escalationPaths.push({
      from: firefighters[0].name,
      to: 'dissociation',
      trigger: triggerDis,
      triggerRu: triggerDis,
    });
  }

  return { layers, escalationPaths };
}

// --- 2.5 Trigger Map ---

export interface TriggerEntry {
  partName: string;
  partType: PartType;
  triggerSituations: string[];
  triggerSituationsRu: string[];
  reactionPattern: string;
  reactionPatternRu: string;
  underlyingWound: string;
  underlyingWoundRu: string;
}

export function computeTriggerMap(
  archetypes: ScoredArchetype[],
  poles: PoleScores,
  lang: 'en' | 'ru' = 'en'
): TriggerEntry[] {
  const triggers: TriggerEntry[] = [];

  // Template-based trigger generation from cluster + pole combinations
  const TRIGGER_TEMPLATES: Record<string, {
    situations: { en: string[]; ru: string[] };
    reaction: [string, string];
    wound: [string, string];
  }> = {
    control_shadows: {
      situations: {
        en: ['Loss of predictability or control over outcomes', 'Someone challenges their authority or competence'],
        ru: ['Потеря предсказуемости или контроля над исходом', 'Кто-то ставит под сомнение их авторитет или компетентность'],
      },
      reaction: [
        'Increases rigidity, micromanages, or withdraws into cold silence',
        'Усиливает жёсткость, микроменеджит или уходит в холодное молчание',
      ],
      wound: [
        'Deep fear that chaos will destroy everything they care about',
        'Глубокий страх, что хаос разрушит всё, что им дорого',
      ],
    },
    emotional_storm_shadows: {
      situations: {
        en: ['Feeling unheard, dismissed, or emotionally invalidated', 'Perceived betrayal or sudden disconnection'],
        ru: ['Ощущение, что их не слышат, обесценивают или эмоционально отвергают', 'Воспринимаемое предательство или внезапное разъединение'],
      },
      reaction: [
        'Emotional eruption — anger, tears, or volcanic protest',
        'Эмоциональное извержение — гнев, слёзы или вулканический протест',
      ],
      wound: [
        'Terror that their emotional intensity makes them unlovable',
        'Ужас, что их эмоциональная интенсивность делает их недостойными любви',
      ],
    },
    avoidant_intellectual_shadows: {
      situations: {
        en: ['Requests for emotional presence or vulnerability', 'Intimate conversations that cannot be solved with logic'],
        ru: ['Просьбы об эмоциональном присутствии или уязвимости', 'Близкие разговоры, которые невозможно решить логикой'],
      },
      reaction: [
        'Intellectualizes, changes subject, or physically withdraws',
        'Интеллектуализирует, меняет тему или физически отстраняется',
      ],
      wound: [
        'Core belief that being truly seen leads to annihilation',
        'Глубинная вера, что быть по-настоящему увиденным означает разрушение',
      ],
    },
    anxious_connection_shadows: {
      situations: {
        en: ['Partner doesn\'t respond promptly or seems distant', 'Any perceived shift in relationship quality or availability'],
        ru: ['Партнёр не отвечает быстро или кажется отстранённым', 'Любое воспринимаемое изменение качества связи или доступности партнёра'],
      },
      reaction: [
        'Over-accommodates, seeks reassurance, or merges with the other',
        'Чрезмерно уступает, ищет подтверждения или сливается с другим',
      ],
      wound: [
        'Fear that their authentic self is unworthy of love',
        'Страх, что их подлинное «я» недостойно любви',
      ],
    },
    seductive_avoidance_shadows: {
      situations: {
        en: ['Someone gets too close to their authentic vulnerability', 'Expectations of consistency or emotional depth'],
        ru: ['Кто-то подходит слишком близко к их подлинной уязвимости', 'Ожидания последовательности или эмоциональной глубины'],
      },
      reaction: [
        'Turns on charm, creates a distraction, or disappears',
        'Включает обаяние, создаёт отвлечение или исчезает',
      ],
      wound: [
        'Belief that who they truly are is not enough',
        'Вера, что их настоящего «я» недостаточно',
      ],
    },
    disorganized_attachment_shadows: {
      situations: {
        en: ['Moments of genuine intimacy that feel simultaneously desired and terrifying', 'Partner is both available and making demands'],
        ru: ['Моменты настоящей близости, которые одновременно желанны и пугающи', 'Партнёр одновременно доступен и предъявляет требования'],
      },
      reaction: [
        'Oscillates wildly between clinging and pushing away, often within minutes',
        'Дико колеблется между цеплянием и отталкиванием, часто в течение минут',
      ],
      wound: [
        'Both abandonment and engulfment feel equally deadly',
        'И покинутость, и поглощение ощущаются одинаково опасными',
      ],
    },
    gift_archetypes: {
      situations: {
        en: ['Witnessing others in pain when they cannot help', 'Being asked to compartmentalize their awareness'],
        ru: ['Видеть чужую боль, когда невозможно помочь', 'Просьба отделить осознавание от чувств и контекста'],
      },
      reaction: [
        'Attempts to hold space with grounded presence, may over-extend',
        'Пытается держать пространство с заземлённым присутствием, может перегрузиться',
      ],
      wound: [
        'The wound that became wisdom — still tender underneath',
        'Рана, ставшая мудростью, но всё ещё чувствительная внутри',
      ],
    },
  };

  for (const archetype of archetypes.slice(0, 6)) {
    const template = TRIGGER_TEMPLATES[archetype.cluster];
    if (!template) continue;

    // Scale trigger intensity by pole magnitude
    const intensity = archetype.prominence / 100;
    if (intensity < 0.05) continue;

    triggers.push({
      partName: archetype.name,
      partType: archetype.partType,
      triggerSituations: template.situations.en,
      triggerSituationsRu: template.situations.ru,
      reactionPattern: template.reaction[0],
      reactionPatternRu: template.reaction[1],
      underlyingWound: template.wound[0],
      underlyingWoundRu: template.wound[1],
    });
  }

  return triggers;
}

// --- 2.6 Integration Pathway ---

export interface PathwayStep {
  stage: number;
  stageName: string;
  stageNameRu: string;
  action: string;
  actionRu: string;
  targetParts: string[];
  order: number;
}

export function computeIntegrationPathway(
  archetypes: ScoredArchetype[],
  poles: PoleScores,
  lang: 'en' | 'ru' = 'en'
): PathwayStep[] {
  const steps: PathwayStep[] = [];
  const managers = archetypes.filter(a => a.partType === 'manager');
  const firefighters = archetypes.filter(a => a.partType === 'firefighter');
  const exiles = archetypes.filter(a => a.partType === 'exile');

  // Sort by developmental origin (earliest first)
  const originOrder: Record<DevelopmentalOrigin, number> = {
    pre_verbal: 0,
    early_attachment: 1,
    oedipal: 2,
    latency: 3,
    adolescent: 4,
  };

  const sortedExiles = [...exiles].sort((a, b) =>
    (originOrder[a.developmentalOrigin] ?? 4) - (originOrder[b.developmentalOrigin] ?? 4)
  );

  // Stage 1: Stabilization — thank the managers
  if (managers.length > 0) {
    steps.push({
      stage: 1,
      stageName: 'Stabilization',
      stageNameRu: 'Стабилизация',
      action: `Acknowledge and thank ${managers.map(m => m.name).join(' and ')} for their protective work. Let them know you see their effort and that it is safe to relax their grip gradually.`,
      actionRu: `Признайте и поблагодарите ${managers.map(m => m.name).join(' и ')} за их защитную работу. Дайте им знать, что вы видите их усилия и что безопасно постепенно ослабить хватку.`,
      targetParts: managers.map(m => m.name),
      order: 0,
    });
  }

  // Stage 2: Access — witness the exiles
  if (sortedExiles.length > 0) {
    const primaryExile = sortedExiles[0];
    steps.push({
      stage: 2,
      stageName: 'Access',
      stageNameRu: 'Доступ',
      action: `Gently approach ${primaryExile.name} from a place of compassionate curiosity. Witness their wound ("${primaryExile.wound}") without trying to fix it. Let them know they are no longer alone.`,
      actionRu: `Нежно подойдите к ${primaryExile.name} из места сострадательного любопытства. Засвидетельствуйте их рану («${primaryExile.wound}»), не пытаясь её починить. Дайте им знать, что они больше не одни.`,
      targetParts: [primaryExile.name],
      order: 1,
    });
  }

  // Stage 3: Processing — name the wounds
  if (exiles.length > 0) {
    steps.push({
      stage: 3,
      stageName: 'Processing',
      stageNameRu: 'Переработка',
      action: `Name the core wounds being carried: ${exiles.map(e => `"${e.wound}"`).join(', ')}. Bring compassionate witnessing to each one, allowing the frozen emotions to thaw at their own pace.`,
      actionRu: `Назовите раны, которые несут изгнанники: ${exiles.map(e => `«${e.wound}»`).join(', ')}. Отнеситесь к каждой с сострадательным вниманием, позволяя замороженным эмоциям оттаять в собственном темпе.`,
      targetParts: exiles.map(e => e.name),
      order: 2,
    });
  }

  // Stage 4: Integration — firefighters stand down
  if (firefighters.length > 0) {
    steps.push({
      stage: 4,
      stageName: 'Integration',
      stageNameRu: 'Интеграция',
      action: `As exiles feel witnessed, ${firefighters.map(f => f.name).join(' and ')} can begin to stand down. Negotiate new roles: their energy can be redirected toward creative expression rather than reactive protection.`,
      actionRu: `По мере того как изгнанники чувствуют себя увиденными, ${firefighters.map(f => f.name).join(' и ')} могут начать отступать. Согласуйте новые роли: их энергия может быть перенаправлена на творческое самовыражение вместо реактивной защиты.`,
      targetParts: firefighters.map(f => f.name),
      order: 3,
    });
  }

  if (steps.length === 0 && archetypes.length > 0) {
    const primary = archetypes[0];
    steps.push({
      stage: 1,
      stageName: 'Embodiment',
      stageNameRu: 'Воплощение',
      action: `Anchor the gifts of ${primary.name} in one concrete relational practice this week. Notice where this integrated capacity already appears, then repeat it deliberately in a low-risk relationship.`,
      actionRu: `Закрепите дары части ${primary.name} в одной конкретной реляционной практике на этой неделе. Заметьте, где эта интегрированная способность уже проявляется, затем сознательно повторите её в безопасных отношениях.`,
      targetParts: [primary.name],
      order: 0,
    });
  }

  return steps;
}

// =============================================================================
// Phase 3: Derived Diagnostic Indicators
// =============================================================================

// --- 3.1 Dissociation Tendency Indicator ---

export interface DissociationIndicator {
  score: number; // 0-1, higher = more dissociation tendency
  level: 'minimal' | 'mild' | 'moderate' | 'significant';
  levelRu: string;
  description: string;
  descriptionRu: string;
}

export function computeDissociation(
  responses: number[],
  poles: PoleScores
): DissociationIndicator {
  // Low emotional variance (flat responses in temp section) + high avoidance
  const emotionalVariance = variance(responses.slice(12, 24).map(r => (r - 3) / 2));
  const flatness = 1 - clamp01(emotionalVariance); // inverted: low variance = high flatness
  const avoidance = negativePoleStrength(poles.attAvoidant);
  const intellectualization = negativePoleStrength(poles.tempCool);

  // Composite score
  const score = clamp01(flatness * 0.4 + avoidance * 0.35 + intellectualization * 0.25);

  const levels: { level: DissociationIndicator['level']; levelRu: string; threshold: number }[] = [
    { level: 'significant', levelRu: 'Значительная', threshold: 0.7 },
    { level: 'moderate', levelRu: 'Умеренная', threshold: 0.5 },
    { level: 'mild', levelRu: 'Лёгкая', threshold: 0.3 },
    { level: 'minimal', levelRu: 'Минимальная', threshold: 0 },
  ];
  const matched = levels.find(l => score >= l.threshold) || levels[levels.length - 1];

  return {
    score,
    level: matched.level,
    levelRu: matched.levelRu,
    description: score > 0.5
      ? 'Response pattern suggests emotional numbing or detachment. Emotional responses appear flattened with strong avoidant tendencies, which may indicate dissociative coping.'
      : score > 0.3
        ? 'Some tendency toward emotional withdrawal or intellectualization. Not necessarily dissociation, but worth monitoring under stress.'
        : 'Emotional engagement appears healthy. Responses show natural variation in emotional reactivity.',
    descriptionRu: score > 0.5
      ? 'Паттерн ответов указывает на эмоциональное онемение или отстранённость. Эмоциональные реакции выглядят сглаженными при сильных избегающих тенденциях, что может указывать на диссоциативное совладание.'
      : score > 0.3
        ? 'Некоторая склонность к эмоциональному отстранению или интеллектуализации. Не обязательно диссоциация, но стоит отслеживать в стрессовых ситуациях.'
        : 'Эмоциональная вовлечённость выглядит здоровой. Ответы демонстрируют естественную вариативность эмоциональной реактивности.',
  };
}

// --- 3.2 Emotional Regulation Capacity ---

export interface RegulationCapacity {
  windowOfTolerance: number; // 0-1, width
  dysregulationPattern: 'flooding' | 'shutdown' | 'oscillation' | 'stable';
  dysregulationPatternRu: string;
  description: string;
  descriptionRu: string;
}

export function computeRegulationCapacity(
  responses: number[],
  poles: PoleScores
): RegulationCapacity {
  const emotionalVariance = variance(responses.slice(12, 24).map(r => (r - 3) / 2));
  const healthContribution = poles.healthScore * 0.5;
  const hotStrength = positivePoleStrength(poles.tempHot);
  const coolStrength = negativePoleStrength(poles.tempCool);
  const anxiousStrength = positivePoleStrength(poles.attAnxious);
  const avoidantStrength = negativePoleStrength(poles.attAvoidant);
  const tempBalance = 1 - Math.abs(hotStrength - coolStrength);
  const windowWidth = clamp01(healthContribution + tempBalance * 0.3 + (1 - emotionalVariance) * 0.2);

  // Determine dysregulation pattern
  let pattern: RegulationCapacity['dysregulationPattern'] = 'stable';
  let patternRu = 'Стабильная';

  if (hotStrength > 0.4 && anxiousStrength > 0.3) {
    pattern = 'flooding';
    patternRu = 'Затопление';
  } else if (coolStrength > 0.4 && avoidantStrength > 0.3) {
    pattern = 'shutdown';
    patternRu = 'Отключение';
  } else if (poles.disorganizedAttachment) {
    pattern = 'oscillation';
    patternRu = 'Осцилляция';
  }

  const descriptions: Record<string, { en: string; ru: string }> = {
    flooding: {
      en: `Emotional flooding pattern detected. Intense emotions (hot: ${(hotStrength * 100).toFixed(0)}%) combined with anxious attachment creates a narrow window of tolerance. Regulation strategy: grounding and self-soothing before processing.`,
      ru: `Обнаружен паттерн эмоционального затопления. Интенсивные эмоции (накал: ${(hotStrength * 100).toFixed(0)}%) в сочетании с тревожной привязанностью сужают окно толерантности. Стратегия регуляции: заземление и самоуспокоение до проработки.`,
    },
    shutdown: {
      en: `Emotional shutdown pattern detected. Emotional detachment (cool: ${(coolStrength * 100).toFixed(0)}%) with avoidant tendencies leads to withdrawal under stress. Regulation strategy: gentle somatic reconnection before cognitive processing.`,
      ru: `Обнаружен паттерн эмоционального отключения. Эмоциональная отстранённость (хлад: ${(coolStrength * 100).toFixed(0)}%) с избегающими тенденциями ведёт к отстранению при стрессе. Стратегия регуляции: мягкая соматическая реконеекция до когнитивной проработки.`,
    },
    oscillation: {
      en: `Oscillation pattern detected. Disorganized attachment creates rapid shifts between flooding and shutdown. Window of tolerance is narrow and unstable. Regulation strategy: establish safety anchors before exploring emotional content.`,
      ru: `Обнаружен паттерн осцилляции. Дезорганизованная привязанность создаёт быстрые переходы между затоплением и отключением. Окно толерантности узкое и нестабильное. Стратегия регуляции: установить якоря безопасности до исследования эмоционального содержания.`,
    },
    stable: {
      en: `Emotional regulation appears relatively stable. Window of tolerance is ${Math.round(windowWidth * 100)}% wide, suggesting capacity to stay present with emotional experience.`,
      ru: `Эмоциональная регуляция выглядит относительно стабильной. Окно толерантности ${Math.round(windowWidth * 100)}% шириной, что свидетельствует о способности оставаться присутствующим с эмоциональным опытом.`,
    },
  };

  const desc = descriptions[pattern];

  return {
    windowOfTolerance: windowWidth,
    dysregulationPattern: pattern,
    dysregulationPatternRu: patternRu,
    description: desc.en,
    descriptionRu: desc.ru,
  };
}

// --- 3.3 Boundary Style Assessment ---

export interface BoundaryAssessment {
  style: 'rigid' | 'porous' | 'flexible' | 'oscillating';
  styleRu: string;
  score: number; // 0 = rigid, 0.5 = flexible, 1 = porous
  description: string;
  descriptionRu: string;
}

export function computeBoundaryStyle(poles: PoleScores): BoundaryAssessment {
  const selfFocus = negativePoleStrength(poles.focusSelf);
  const otherFocus = positivePoleStrength(poles.focusOther);
  const agency = negativePoleStrength(poles.agencyActive);
  const receptive = positivePoleStrength(poles.agencyReceptive);

  // Score: 0 = rigid (self-focused + active), 1 = porous (other-focused + receptive)
  const boundaryScore = clamp01(otherFocus * 0.4 + receptive * 0.3 + (1 - selfFocus) * 0.15 + (1 - agency) * 0.15);

  let style: BoundaryAssessment['style'] = 'flexible';
  let styleRu = 'Гибкий';

  if (poles.disorganizedAttachment && Math.abs(boundaryScore - 0.5) > 0.15) {
    style = 'oscillating';
    styleRu = 'Осциллирующий';
  } else if (boundaryScore < 0.3) {
    style = 'rigid';
    styleRu = 'Жёсткий';
  } else if (boundaryScore > 0.7) {
    style = 'porous';
    styleRu = 'Проницаемый';
  }

  const descriptions: Record<string, { en: string; ru: string }> = {
    rigid: {
      en: 'Rigid boundaries: strong self-focus with active agency creates well-defended but potentially isolating relational walls. Others may experience you as distant or unapproachable.',
      ru: 'Жёсткие границы: сильный фокус на себе с активной агентностью создаёт хорошо защищённые, но потенциально изолирующие реляционные стены. Другие могут воспринимать вас как отстранённого или недоступного.',
    },
    porous: {
      en: 'Porous boundaries: high other-focus with receptive stance allows deep connection but risks enmeshment and self-abandonment. Difficulty distinguishing self from other.',
      ru: 'Проницаемые границы: высокий фокус на другом с восприимчивой позицией позволяет глубокую связь, но рискует слиянием и отказом от себя. Трудности в различении себя и другого.',
    },
    flexible: {
      en: 'Flexible boundaries: balanced self-other focus with adaptive agency allows both closeness and autonomy. Can adjust boundaries contextually.',
      ru: 'Гибкие границы: сбалансированный фокус «я-другой» с адаптивной агентностью позволяет и близость, и автономию. Способны контекстуально корректировать границы.',
    },
    oscillating: {
      en: 'Oscillating boundaries: rapid shifts between rigid walls and porous merging, often triggered by attachment activation. Boundaries feel unpredictable to both self and others.',
      ru: 'Осциллирующие границы: быстрые переходы между жёсткими стенами и проницаемым слиянием, часто провоцируемые активацией привязанности. Границы ощущаются непредсказуемыми и для себя, и для других.',
    },
  };

  const desc = descriptions[style];

  return {
    style,
    styleRu,
    score: boundaryScore,
    description: desc.en,
    descriptionRu: desc.ru,
  };
}

// --- 3.4 Narrative Coherence Indicator ---

export interface CoherenceIndicator {
  score: number; // 0-1, higher = more coherent
  level: 'high' | 'moderate' | 'low' | 'fragmented';
  levelRu: string;
  description: string;
  descriptionRu: string;
}

export function computeNarrativeCoherence(
  responses: number[],
  poles: PoleScores
): CoherenceIndicator {
  // Within-section variance: high variance within a section = inconsistent responses
  const sections = [
    responses.slice(0, 12),   // Agency
    responses.slice(12, 24),  // Temperature
    responses.slice(24, 36),  // Focus
    responses.slice(36, 52),  // Attachment
  ];

  const sectionVariances = sections.map(s => variance(s.map(r => (r - 3) / 2)));
  const avgVariance = sectionVariances.reduce((s, v) => s + v, 0) / sectionVariances.length;

  // Cross-section consistency: do the pole scores tell a coherent story?
  // High disorganized = low coherence by definition
  const disorgPenalty = poles.disorganizedAttachment ? 0.25 : 0;

  // Very low variance across ALL sections = overly rigid/defensive responding (not coherent)
  // Very high variance = chaotic responding (not coherent)
  // Sweet spot = moderate variance
  const varianceCoherence = 1 - Math.abs(avgVariance - 0.4) * 2;

  // Health score contributes positively
  const healthBonus = poles.healthScore * 0.3;

  const score = clamp01(varianceCoherence * 0.5 + healthBonus - disorgPenalty);

  const levels: { level: CoherenceIndicator['level']; levelRu: string; threshold: number }[] = [
    { level: 'high', levelRu: 'Высокая', threshold: 0.7 },
    { level: 'moderate', levelRu: 'Умеренная', threshold: 0.5 },
    { level: 'low', levelRu: 'Низкая', threshold: 0.3 },
    { level: 'fragmented', levelRu: 'Фрагментированная', threshold: 0 },
  ];
  const matched = levels.find(l => score >= l.threshold) || levels[levels.length - 1];

  return {
    score,
    level: matched.level,
    levelRu: matched.levelRu,
    description: score > 0.7
      ? 'Response pattern shows good internal consistency. Answers within each section align coherently, suggesting an integrated self-narrative.'
      : score > 0.5
        ? 'Response pattern shows moderate coherence. Some inconsistencies between or within sections, which may reflect genuine complexity or unresolved conflict.'
        : score > 0.3
          ? 'Response pattern shows notable inconsistency. This may indicate internal conflict, rapid state shifts, or difficulty accessing consistent self-awareness.'
          : 'Response pattern appears fragmented or highly inconsistent. This can indicate significant internal conflict, dissociative tendencies, or a self-narrative still in formation.',
    descriptionRu: score > 0.7
      ? 'Паттерн ответов демонстрирует хорошую внутреннюю согласованность. Ответы внутри каждой секции выстроены логично, что говорит об интегрированном самоповествовании.'
      : score > 0.5
        ? 'Паттерн ответов показывает умеренную согласованность. Некоторые несоответствия между или внутри секций могут отражать подлинную сложность или неразрешённый конфликт.'
        : score > 0.3
          ? 'Паттерн ответов показывает заметную непоследовательность. Это может указывать на внутренний конфликт, быстрые смены состояний или затруднённый доступ к устойчивой самоосознанности.'
          : 'Паттерн ответов выглядит фрагментированным или крайне непоследовательным. Это может указывать на значительный внутренний конфликт, диссоциативные тенденции или самоповествование, ещё находящееся в процессе формирования.',
  };
}
