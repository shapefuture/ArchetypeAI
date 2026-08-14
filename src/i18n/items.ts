/**
 * INNERVERSE — 147-item bank (REVAMP_PLAN.md §1.2), en + ru.
 *
 * Structure per shadow part (8 items): q1-q2 trigger · q3-q5 behavior ·
 * q6-q7 internal narration · q8 somatic marker. q7 and q8 are REVERSE-KEYED
 * (agreement = low activation) matching scoring-v2's REVERSE_KEYED_INDEXES.
 * Resources (6) and Self (8) are positively keyed. Behavioral, present-tense,
 * jargon-free. Same key order in both languages.
 */
import { SHADOW_PARTS, RESOURCES, type ShadowPartId, type ResourceId } from '../app/core/data/parts';

export const LIKERT = {
  en: ['Never true of me', 'Rarely true of me', 'Sometimes true of me', 'Very often true of me', 'Almost always true of me'],
  ru: ['Никогда не про меня', 'Редко про меня', 'Иногда про меня', 'Часто про меня', 'Почти всегда про меня'],
} as const;

type ShadowItems = Record<ShadowPartId, [string, string, string, string, string, string, string, string]>;
type ResourceItems = Record<ResourceId, [string, string, string, string, string, string]>;

export interface ItemBankTexts {
  items: ShadowItems;
  resources: ResourceItems;
  /** 8 items in SELF_QUALITIES order: calm, clarity, compassion, curiosity, confidence, courage, creativity, connectedness. */
  self: [string, string, string, string, string, string, string, string];
  validity: { attention: string; infrequency1: string; infrequency2: string };
}

const en: ItemBankTexts = {
  items: {
    taskmaster: [
      'When someone else is praised for their work, I feel an urge to do more myself',
      'A free evening with nothing accomplished makes me restless',
      'I set standards for myself that I would never demand of anyone else',
      'I keep working past the point where it stops being useful',
      'I turn rest and hobbies into tasks with goals and metrics',
      'A voice inside keeps telling me I could have done better',
      'At the end of the day I can tell myself, honestly, that it was enough',
      'When I finally sit down, my body lets go of the tension easily',
    ],
    inner_critic: [
      'When someone looks at me without smiling, I assume they noticed something wrong with me',
      'Before meeting new people, I rehearse what could be judged about me',
      'I criticize myself out loud before anyone else gets the chance',
      'I replay conversations searching for the moment I looked foolish',
      'I compare myself unfavorably with almost everyone I meet',
      'There is a voice in my head that calls me stupid or pathetic when I slip',
      'When I make a small mistake, I can shrug it off as simply human',
      'When someone compliments me, it lands warmly in my body',
    ],
    pleaser: [
      'When someone I depend on goes quiet, I start scanning for what I did wrong',
      'The moment tension appears in a room, I move to smooth it over',
      'I say yes to requests even when I am already overloaded',
      'I adjust my opinions to match whoever I am with',
      'I apologize for things that are not my fault, just to keep the peace',
      'I tell myself that keeping everyone happy is my job',
      'I can hear a "no" from someone without assuming the relationship is in danger',
      'When I say what I actually want, my chest stays relaxed',
    ],
    controller: [
      'When plans change suddenly, something in me braces hard',
      'Being a passenger with no say in the route makes me uneasy',
      'I plan my days or weeks ahead in fine detail',
      'I correct or redo other people\'s work to meet my standard',
      'I find it hard to begin anything without a complete plan',
      'A voice warns me that if I do not manage everything, it will fall apart',
      'I can let a day unfold without knowing exactly what comes next',
      'In unpredictable situations my breathing stays easy',
    ],
    analyst: [
      'When a conversation turns emotional, I drift into analyzing it',
      'When strong feelings rise in me, I reach for an explanation of them',
      'I explain my emotions as theory rather than showing them',
      'I read about my problems more than I talk about them',
      'I stay the calm, reasonable one while others fall apart',
      'I tell myself that feelings are just data to be processed',
      'I can let myself cry without needing to understand why',
      'When something touches me, I feel it in my body before I explain it',
    ],
    hermit: [
      'After spending time with people, I need long stretches alone to recover',
      'When a social event I dreaded gets cancelled, I feel relief rather than disappointment',
      'I cancel plans more often than I keep them',
      'I arrange my life so that nobody can drop by unannounced',
      'I avoid letting people know when I am free',
      'A voice tells me that people are safer kept at a distance',
      'I look forward to being truly seen by people who know me',
      'In a room full of people I can feel comfortably present',
    ],
    bypasser: [
      'When pain comes up in me, I quickly look for the lesson in it',
      'When someone shares heavy feelings, I steer the talk toward the bright side',
      'I reframe setbacks as blessings almost the moment they happen',
      'I use ideas like "everything happens for a reason" to move past hurt',
      'I rise above my feelings rather than actually feeling them',
      'I tell myself that pain is just a story the mind tells',
      'I can stay with what hurts without rushing to fix its meaning',
      'When grief passes through me, I let it move without interrupting it',
    ],
    numb: [
      'When feelings get strong, I reach for my phone, food, or a drink',
      'The moment conflict starts, I go distant and foggy',
      'I scroll or binge shows for hours to keep from thinking',
      'Whole hours pass in which I notice I felt nothing at all',
      'I use substances or habits to take the edge off',
      'I tell myself I am just tired, though I could not say of what',
      'I notice my feelings while they are actually happening',
      'My body feels alive and present through the day',
    ],
    rebel: [
      'The moment someone tells me what to do, I want to do the opposite',
      'When I feel controlled, anger rises in me fast',
      'I break rules or expectations even when it costs me',
      'I blow up arrangements that feel confining',
      'I push away help because it feels like control',
      'A voice says: better to leave than to be owned',
      'I can accept guidance without feeling trapped by it',
      'When someone sets a limit with me, my jaw and fists stay loose',
    ],
    charmer: [
      'When I enter a room, I feel an urge to be the most interesting person in it',
      'When attention drifts away from me, I start performing harder',
      'I shape my image to whatever will impress the person in front of me',
      'I keep life intense — drama, flings, spectacles — to feel real',
      'I use humor or flirtation to steer how people see me',
      'A voice whispers that being forgotten would be unbearable',
      'I can be plain and ordinary in front of others and feel fine about it',
      'When the spotlight moves away from me, my insides stay calm',
    ],
    abandoned: [
      'When someone close to me does not answer, my mind fills with scenarios of being left',
      'Goodbyes, even short ones, ache more than they should',
      'I hold on to relationships I know are not good for me',
      'I test people to see whether they will stay',
      'I keep messaging first because silence feels like leaving',
      'Inside me lives a certainty that everyone leaves in the end',
      'When people are away, I trust that they are coming back',
      'Spending an evening alone, my chest stays warm and quiet',
    ],
    ashamed: [
      'When people laugh somewhere nearby, part of me is sure it is about me',
      'Being seen doing something badly feels unbearable',
      'I hide parts of my life so that no one can judge them',
      'I let others take credit rather than expose my own work',
      'I avoid mirrors, photos, or hearing recordings of my voice',
      'Deep down, I am sure something about me is fundamentally wrong',
      'I can let someone watch me fail and stay calm inside',
      'When I am the center of attention, my skin feels fine',
    ],
    frightened: [
      'Sudden noises or movements startle me out of all proportion',
      'New situations put me on alert before anything has happened',
      'I choose seats where I can watch the exits',
      'I check locks, routes, and plans more than is needed',
      'I avoid risk even when the actual stakes are small',
      'A quiet alarm inside me insists that something bad is coming',
      'I can fully relax without keeping one eye open',
      'At night, my body lets go and sleeps',
    ],
    unseen: [
      'In groups, my words get talked over — and I let them',
      'When other people\'s needs appear, mine quietly vanish',
      'I stay in the background even when I know the answer',
      'I give and give without ever asking to be considered',
      'I feel like a spectator in my own life',
      'A small voice concludes that I simply do not register to people',
      'I claim space and speak up when something matters to me',
      'When I take up room, my posture stays open',
    ],
  },
  resources: {
    sage: [
      'When life gets confusing, I can find a calm perspective inside me',
      'People come to me for considered advice',
      'I can sit with a problem without rushing to solve it',
      'I sense what truly matters to me beneath the noise',
      'I accept that some things cannot be known yet',
      'My choices reflect my deeper values',
    ],
    warrior: [
      'I can say no clearly, without cruelty',
      'Once I have made a difficult decision, I act on it',
      'I protect my time and energy as if they matter',
      'I speak up when something crosses a line',
      'I can face conflict without losing myself in it',
      'I trust my capacity to handle hard things',
    ],
    caregiver: [
      'I comfort myself the way I would comfort a dear friend',
      'I look after others without erasing my own needs',
      'I notice when someone is struggling before they say so',
      'I can receive care as easily as I give it',
      'My kindness has boundaries and still stays warm',
      'I tend to my body\'s basic needs with real attention',
    ],
    explorer: [
      'I try new things just to see what happens',
      'Play and curiosity shape my week',
      'I am comfortable not being good at something yet',
      'I seek out beauty, novelty, and surprise',
      'I ask questions more often than I give answers',
      'Boredom is rare — the world genuinely interests me',
    ],
  },
  self: [
    'Even under pressure, I can find an inner steadiness',
    'I see my situations clearly, without the fog of panic or habit',
    'I can hold my own pain with kindness',
    'I am curious about my inner reactions rather than afraid of them',
    'I trust myself to meet whatever comes',
    'I move toward what scares me when it matters',
    'New ideas and expressions come naturally through me',
    'I feel connected to people and to life, even when alone',
  ],
  validity: {
    attention: 'For this item, select "Sometimes true of me".',
    infrequency1: 'I have never felt any emotion of any kind.',
    infrequency2: 'I have never, even once, felt bored.',
  },
};

const ru: ItemBankTexts = {
  items: {
    taskmaster: [
      'Когда хвалят чужую работу, я чувствую позыв сделать больше самого',
      'Свободный вечер, за которым не стоит никакого результата, делает меня беспокойным',
      'Я предъявляю себе требования, которых никогда не предъявил бы другому',
      'Я продолжаю работать уже после того, как это перестаёт приносить пользу',
      'Я превращаю отдых и увлечения в задачи с целями и показателями',
      'Внутренний голос твердит мне, что я мог сделать лучше',
      'В конце дня я могу честно сказать себе: этого было достаточно',
      'Когда я наконец сажусь отдыхать, тело легко отпускает напряжение',
    ],
    inner_critic: [
      'Когда кто-то смотрит на меня без улыбки, я решаю, что во мне заметили что-то не так',
      'Перед встречей с новыми людьми я мысленно репетирую, что во мне могут осудить',
      'Я критикую себя вслух раньше, чем это успеет сделать кто-то другой',
      'Я мысленно прокручиваю разговоры в поисках момента, где выглядел глупо',
      'Я сравниваю себя не в свою пользу почти с каждым встречным',
      'В голове живёт голос, который при ошибке называет меня ничтожеством',
      'Допустив мелкую ошибку, я могу отнестись к ней как к обычному человеческому делу',
      'Когда меня хвалят, похвала тепло отзывается в теле',
    ],
    pleaser: [
      'Когда значимый для меня человек замолкает, я начинаю искать, в чём виноват',
      'Едва в комнате появляется напряжение, я спешу его сгладить',
      'Я соглашаюсь на просьбы, даже когда уже перегружен',
      'Я подстраиваю свои мнения под того, с кем говорю',
      'Я извиняюсь за то, в чём не виноват, лишь бы сохранить мир',
      'Я говорю себе, что делать всех счастливыми — моя работа',
      'Я могу услышать «нет» от человека, не решив, что отношения под угрозой',
      'Когда я говорю о том, чего хочу на самом деле, грудь остаётся расслабленной',
    ],
    controller: [
      'Когда планы внезапно меняются, что-то во мне сильно сжимается',
      'Быть пассажиром, не влияющим на маршрут, вызывает у меня тревогу',
      'Я планирую свои дни и недели в мельчайших деталях',
      'Я исправляю или переделываю чужую работу до своего стандарта',
      'Мне трудно начать что-либо без полного плана',
      'Голос предупреждает: не будешь всё контролировать — всё развалится',
      'Я могу позволить дню разворачиваться, не зная точно, что будет дальше',
      'В непредсказуемых ситуациях моё дыхание остаётся ровным',
    ],
    analyst: [
      'Когда разговор становится эмоциональным, я ухожу в анализ',
      'Когда во мне поднимаются сильные чувства, я тянусь к объяснению их',
      'Я объясняю свои эмоции как теорию, а не показываю их',
      'Я больше читаю о своих проблемах, чем говорю о них',
      'Я остаюсь спокойным и рассудительным, пока другие распадаются',
      'Я говорю себе, что чувства — это просто данные для обработки',
      'Я могу заплакать, не нуждаясь в объяснении, почему',
      'Когда меня что-то трогает, я чувствую это в теле раньше, чем объясню',
    ],
    hermit: [
      'После времени с людьми мне нужны долгие часы в одиночестве, чтобы восстановиться',
      'Когда нежеланную встречу отменяют, я чувствую облегчение, а не разочарование',
      'Я отменяю планы чаще, чем выполняю их',
      'Я устроил жизнь так, чтобы никто не мог прийти без предупреждения',
      'Я избегаю показывать людям, когда бываю свободен',
      'Голос говорит мне, что людей безопаснее держать на расстоянии',
      'Я с нетерпением жду, когда меня по-настоящему увидят близкие люди',
      'В полной людей комнате я могу чувствовать себя спокойно присутствующим',
    ],
    bypasser: [
      'Когда во мне поднимается боль, я быстро ищу в ней урок',
      'Когда кто-то делится тяжёлым, я перевожу разговор на светлое',
      'Я переосмысляю неудачи как благословение почти в момент их случания',
      'Я прибегаю к мыслям вроде «всё не просто так», чтобы обойти боль',
      'Я возвышаюсь над чувствами вместо того, чтобы их чувствовать',
      'Я говорю себе, что боль — это просто история, которую рассказывает ум',
      'Я могу остаться с тем, что болит, не спешить приделать ему смысл',
      'Когда сквозь меня проходит горе, я позволяю ему двигаться, не перебивая',
    ],
    numb: [
      'Когда чувства усиливаются, я тянусь к телефону, еде или стакану',
      'Едва начинается конфликт, я ухожу в отстранённость и туман',
      'Я часами листаю ленту или смотрю сериалы, чтобы не думать',
      'Проходят целые часы, в которые я не заметил в себе ничего',
      'Я использую вещества или привычки, чтобы снять остроту',
      'Я говорю себе, что просто устал, хотя и не могу сказать от чего',
      'Я замечаю свои чувства в тот момент, когда они происходят',
      'Моё тело чувствуется живым и присутствующим в течение дня',
    ],
    rebel: [
      'Едва мне говорят, что делать, я хочу сделать наоборот',
      'Когда я чувствую контроль, во мне быстро вскипает злость',
      'Я нарушаю правила и ожидания, даже когда это мне дорого обходится',
      'Я взрываю договорённости, которые ощущаю как клетку',
      'Я отталкиваю помощь, потому что она ощущается как контроль',
      'Голос говорит: лучше уйти, чем быть собственностью',
      'Я могу принять наставничество, не чувствуя себя в ловушке',
      'Когда кто-то обозначает мне границу, челюсть и кулаки остаются расслабленными',
    ],
    charmer: [
      'Входя в комнату, я чувствую позыв быть самым интересным человеком в ней',
      'Когда внимание уходит от меня, я начинаю выступать ещё усерднее',
      'Я подгоняю свой образ под то, что впечатлит собеседника',
      'Я держу жизнь острой — драмы, романы, спектакли — чтобы чувствовать себя живым',
      'Я использую юмор и флирт, чтобы управлять тем, как меня видят',
      'Голос шепчет, что быть забытым было бы невыносимо',
      'Я могу быть обычным и простым на людях и чувствовать себя хорошо',
      'Когда софит внимания уходит от меня, внутри остаётся спокойно',
    ],
    abandoned: [
      'Когда близкий человек не отвечает, ум наполняется сценариями, что меня оставили',
      'Прощания, даже короткие, болят сильнее, чем должны',
      'Я держусь за отношения, о которых знаю, что они мне не на пользу',
      'Я проверяю людей, останутся ли они',
      'Я пишу первым снова и снова, потому что молчание ощущается как уход',
      'Внутри живёт уверенность, что в конце концов все уходят',
      'Когда люди далеко, я доверяю, что они вернутся',
      'Проводя вечер в одиночестве, я чувствую тепло и тишину в груди',
    ],
    ashamed: [
      'Когда рядом кто-то смеётся, часть меня уверена, что это надо мной',
      'Быть увиденным в неумелом деле кажется невыносимым',
      'Я скрываю части своей жизни, чтобы никто не мог их осудить',
      'Я отдаю другим авторство, лишь бы не выставлять свою работу',
      'Я избегаю зеркал, фотографий и записей своего голоса',
      'В глубине я уверен, что со мной что-то в принципе не так',
      'Я могу позволить кому-то видеть мою неудачу и оставаться спокойным',
      'Когда я в центре внимания, кожа чувствует себя хорошо',
    ],
    frightened: [
      'Внезапные звуки или движения пугают меня непропорционально сильно',
      'Новые ситуации вводят меня в настороженность ещё до того, что что-то произошло',
      'Я выбираю места, откуда видны выходы',
      'Я проверяю замки, маршруты и планы чаще, чем нужно',
      'Я избегаю риска даже при небольших ставках',
      'Тихая тревога внутри настаивает, что случится что-то плохое',
      'Я могу полностью расслабиться, не держа один глаз открытым',
      'Ночью моё тело отпускает себя и засыпает',
    ],
    unseen: [
      'В компаниях мои слова перебивают — и я позволяю это',
      'Когда появляются чужие потребности, мои тихо исчезают',
      'Я остаюсь на заднем плане, даже когда знаю ответ',
      'Я отдаю и отдаю, ни разу не попросив учесть и меня',
      'Я чувствую себя зрителем собственной жизни',
      'Тихий голос делает вывод, что меня для людей просто не существует',
      'Я занимаю место и говорю, когда это для меня важно',
      'Когда я занимаю пространство, осанка остаётся раскрытой',
    ],
  },
  resources: {
    sage: [
      'Когда жизнь запутывается, я нахожу в себе спокойный взгляд со стороны',
      'Люди приходят ко мне за взвешенным советом',
      'Я могу побыть с проблемой, не спеша её решить',
      'Я чувствую, что для меня по-настоящему важно, сквозь шум',
      'Я принимаю, что что-то пока нельзя узнать',
      'Мои выборы отражают мои глубинные ценности',
    ],
    warrior: [
      'Я могу сказать «нет» ясно, без жестокости',
      'Приняв трудное решение, я действую по нему',
      'Я оберегаю своё время и энергию, как будто они важны',
      'Я говорю, когда пересекается граница',
      'Я могу встретить конфликт, не потеряв себя в нём',
      'Я доверяю своей способности справляться с трудным',
    ],
    caregiver: [
      'Я утешаю себя так, как утешал бы дорогого друга',
      'Я забочусь о других, не стирая собственных потребностей',
      'Я замечаю, когда кому-то тяжело, раньше, чем об этом скажут',
      'Я умею принимать заботу так же легко, как давать её',
      'Моя доброта имеет границы и остаётся тёплой',
      'Я внимателен к базовым потребностям своего тела',
    ],
    explorer: [
      'Я пробую новое просто чтобы посмотреть, что будет',
      'Игра и любопытство формируют мою неделю',
      'Мне комфортно пока не уметь что-то хорошо',
      'Я ищу красоту, новизну и удивление',
      'Я чаще задаю вопросы, чем даю ответы',
      'Скука редка — мир по-настоящему интересен мне',
    ],
  },
  self: [
    'Даже под давлением я нахожу в себе внутреннюю устойчивость',
    'Я вижу свои ситуации ясно, без тумана паники и привычки',
    'Я могу держать собственную боль с добротой',
    'Мне любопытны мои внутренние реакции, а не страшны',
    'Я доверяю себе встретить то, что придёт',
    'Я двигаюсь к тому, что пугает, когда это важно',
    'Новые идеи и выражения естественно проходят через меня',
    'Я чувствую связь с людьми и с жизнью, даже оставаясь один',
  ],
  validity: {
    attention: 'Для этого утверждения выберите вариант «Иногда про меня».',
    infrequency1: 'Я никогда не испытывал никаких эмоций вообще.',
    infrequency2: 'Я ни разу в жизни не испытывал скуки.',
  },
};

export const ITEM_BANK: Record<'en' | 'ru', ItemBankTexts> = { en, ru };

// --- Deterministic delivery schedule: 3 Descents x 49 items ---

export type ItemRef =
  | { kind: 'shadow'; part: ShadowPartId; index: number } // index 0..7 → q1..q8
  | { kind: 'resource'; part: ResourceId; index: number } // 0..5
  | { kind: 'self'; index: number } // 0..7
  | { kind: 'validity'; which: 'attention' | 'infrequency1' | 'infrequency2' };

/** §1.2 fixed validity positions, 1-based within the 147-item sequence. */
export const VALIDITY_POSITIONS = [40, 84, 120] as const;

/**
 * Round-robin across all 19 item groups (14 shadow + 4 resources + Self),
 * 8 rounds, then splice validity items into positions 40/84/120 (1-based).
 * Same schedule every run — no shuffling, ever.
 */
export function buildItemSequence(): ItemRef[] {
  const groups: { refs: ItemRef[] }[] = [
    ...SHADOW_PARTS.map(part =>
      ({ refs: Array.from({ length: 8 }, (_, i) => ({ kind: 'shadow', part, index: i }) as ItemRef) })),
    ...RESOURCES.map(part =>
      ({ refs: Array.from({ length: 6 }, (_, i) => ({ kind: 'resource', part, index: i }) as ItemRef) })),
    { refs: Array.from({ length: 8 }, (_, i) => ({ kind: 'self', index: i }) as ItemRef) },
  ];
  const scored: ItemRef[] = [];
  for (let round = 0; round < 8; round++) {
    for (const g of groups) if (round < g.refs.length) scored.push(g.refs[round]);
  }
  const validityRefs: ItemRef[] = [
    { kind: 'validity', which: 'attention' },
    { kind: 'validity', which: 'infrequency1' },
    { kind: 'validity', which: 'infrequency2' },
  ];
  const out: ItemRef[] = [];
  let s = 0;
  for (let pos = 1; pos <= 147; pos++) {
    const vIdx = VALIDITY_POSITIONS.indexOf(pos as 40 | 84 | 120);
    if (vIdx >= 0) out.push(validityRefs[vIdx]);
    else out.push(scored[s++]);
  }
  return out;
}

/** 3 sittings of exactly 49. */
export function buildDescents(): ItemRef[][] {
  const seq = buildItemSequence();
  return [seq.slice(0, 49), seq.slice(49, 98), seq.slice(98, 147)];
}

export function itemText(ref: ItemRef, lang: 'en' | 'ru'): string {
  const bank = ITEM_BANK[lang];
  if (ref.kind === 'shadow') return bank.items[ref.part][ref.index];
  if (ref.kind === 'resource') return bank.resources[ref.part][ref.index];
  if (ref.kind === 'self') return bank.self[ref.index];
  return bank.validity[ref.which];
}

export function isReverseKeyed(ref: ItemRef): boolean {
  return ref.kind === 'shadow' && ref.index >= 6;
}
