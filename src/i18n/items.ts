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
  ru: ['Совсем не про меня', 'Скорее не про меня', 'Иногда про меня', 'Чаще всего про меня', 'Точно про меня'],
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
      'Когда хвалят чужую работу, во мне просыпается желание успеть больше',
      'Если свободный вечер не приносит никакого результата, мне становится не по себе',
      'Я требую от себя того, чего никогда не стал бы требовать от других',
      'Я продолжаю работать, когда это уже давно перестало быть полезным',
      'Даже отдых я превращаю в задачу с целью и результатом',
      'Внутренний голос твердит: можно было сделать лучше',
      'Вечером я могу честно сказать себе: на сегодня этого достаточно',
      'Когда я наконец останавливаюсь, тело легко отпускает напряжение',
    ],
    inner_critic: [
      'Если кто-то смотрит на меня без улыбки, мне кажется, что во мне заметили что-то не так',
      'Перед встречей с новыми людьми я заранее прокручиваю в голове, что во мне могут осудить',
      'Я ругаю себя раньше, чем это успеет сделать кто-то другой',
      'Я подолгу прокручиваю в голове разговоры, ища места, где вышло глупо',
      'Я сравниваю себя с другими почти всегда не в свою пользу',
      'Стоит мне ошибиться, и внутренний голос обзывает меня последними словами',
      'Допустив мелкую ошибку, я могу просто пожать плечами: со всеми бывает',
      'Когда меня хвалят, я чувствую тепло где-то в груди',
    ],
    pleaser: [
      'Когда близкий человек замолкает, мне сразу кажется, что причина во мне',
      'Едва в комнате появляется напряжение, я спешу его сгладить',
      'Я говорю «да» на любые просьбы, даже когда сил уже не осталось',
      'Я невольно соглашаюсь с собеседником, даже если думаю иначе',
      'Я извиняюсь даже за то, к чему не имею никакого отношения, — лишь бы не было ссоры',
      'Где-то внутри живёт убеждение: все вокруг должны быть довольны, и это моя забота',
      'Чьё-то «нет» не означает для меня конец отношений',
      'Когда я говорю о том, чего хочу на самом деле, внутри ничего не сжимается',
    ],
    controller: [
      'Когда планы внезапно меняются, что-то во мне сильно сжимается',
      'Когда всё зависит не от меня, внутри нарастает тревога',
      'Я планирую свои дни и недели в мельчайших деталях',
      'Я переделываю за другими то, что сделано не так, как мне нужно',
      'Я не могу взяться за дело, пока не продуман весь план до мелочей',
      'Внутренний голос предупреждает: перестанешь всё контролировать — и всё развалится',
      'Я могу прожить день, не зная заранее, что случится через час',
      'В непредсказуемых ситуациях моё дыхание остаётся ровным',
    ],
    analyst: [
      'Едва разговор становится эмоциональным, я перехожу в режим анализа',
      'Когда во мне поднимаются сильные чувства, я первым делом ищу им объяснение',
      'О своих чувствах я говорю как о теории, вместо того чтобы их показывать',
      'Я больше читаю о своих проблемах, чем говорю о них',
      'Пока другие теряют голову, во мне работает только рассудок',
      'Я говорю себе: чувства — это просто данные, которые нужно обработать',
      'Я могу заплакать и не искать объяснения, почему',
      'Когда меня что-то трогает, я чувствую это в теле раньше, чем успеваю объяснить',
    ],
    hermit: [
      'После людей мне нужны долгие часы в одиночестве, чтобы прийти в себя',
      'Когда нежеланную встречу отменяют, я чувствую облегчение, а не разочарование',
      'Я отменяю планы чаще, чем выполняю их',
      'Моя жизнь устроена так, что никто не может прийти без предупреждения',
      'Я стараюсь не показывать людям, когда у меня есть свободное время',
      'Внутренний голос говорит: людей безопаснее держать на расстоянии',
      'Я по-настоящему жду встреч, на которых меня видят',
      'В полной людьми комнате мне может быть спокойно и легко',
    ],
    bypasser: [
      'Когда во мне поднимается боль, я быстро ищу в ней урок',
      'Когда кто-то делится тяжёлым, я перевожу разговор на светлое',
      'Не успевает случиться неудача, а я уже вижу в ней скрытый дар',
      'Мысли вроде «всё не просто так» помогают мне не встречаться с болью вплотную',
      'Я возвышаюсь над чувствами вместо того, чтобы их проживать',
      'Я говорю себе, что боль — это просто история, которую рассказывает ум',
      'Я могу побыть с тем, что болит, не спешить прикручивать к этому смысл',
      'Когда накрывает горе, я позволяю ему пройти сквозь меня, не перебивая',
    ],
    numb: [
      'Когда чувства усиливаются, я тянусь к телефону, еде или стакану',
      'Едва начинается конфликт, я как будто проваливаюсь в туман',
      'Я часами листаю ленту или смотрю сериалы, чтобы ни о чём не думать',
      'Бывают целые часы, когда я не чувствую в себе ровным счётом ничего',
      'Я использую вещества или привычки, чтобы снять остроту',
      'Говорю себе: просто усталость. Хотя от чего — непонятно',
      'Я замечаю свои чувства прямо в тот момент, когда они появляются',
      'В течение дня я чувствую своё тело живым, а не выключенным',
    ],
    rebel: [
      'Едва мне говорят, что делать, я хочу сделать наоборот',
      'Когда я чувствую, что мной управляют, во мне быстро вскипает злость',
      'Я нарушаю правила и ожидания, даже когда это мне дорого обходится',
      'Я взрываю договорённости, которые ощущаю как клетку',
      'Я отталкиваю помощь, потому что она ощущается как контроль',
      'Внутри живёт правило: лучше уйти, чем стать чьей-то вещью',
      'Я могу принять чужой совет и не почувствовать себя в клетке',
      'Когда кто-то обозначает мне границу, челюсть и кулаки остаются расслабленными',
    ],
    charmer: [
      'Входя в комнату, я чувствую потребность быть в ней самым интересным человеком',
      'Когда внимание уходит от меня, я начинаю выступать ещё усерднее',
      'Я подгоняю свой образ под то, что впечатлит собеседника',
      'Мне нужны драма, интрижки и спектакли, чтобы чувствовать: я живу по-настоящему',
      'Я использую юмор и флирт, чтобы управлять тем, как меня видят',
      'Внутренний голос шепчет, что быть забытым было бы невыносимо',
      'Я могу быть на людях никаким особенным — и мне от этого хорошо',
      'Когда внимание уходит от меня к другим, внутри остаётся спокойно',
    ],
    abandoned: [
      'Когда близкий человек не берёт трубку, мой ум уже рисует картину, как меня оставляют',
      'Даже короткие «до свидания» отдаются во мне болью сильнее, чем нужно',
      'Я держусь за отношения, которые ясно вижу: они мне вредят',
      'Я проверяю людей, останутся ли они',
      'Молчание близких ощущается как уход, поэтому я пишу снова и снова',
      'Внутри живёт уверенность, что в конце концов все уходят',
      'Когда люди далеко, я доверяю: они вернутся',
      'Вечер в одиночестве проходит в тепле и покое, без тоски в груди',
    ],
    ashamed: [
      'Когда рядом кто-то смеётся, часть меня уверена, что это надо мной',
      'Если кто-то увидит мою неловкость, мне это кажется невыносимым',
      'Я скрываю части своей жизни, чтобы никто не мог их осудить',
      'Я отдаю другим авторство, только бы не выставлять своё на суд',
      'Я избегаю зеркал, фотографий и записей своего голоса',
      'В самой глубине живёт знание: со мной что-то не так — в принципе',
      'Я могу при других ошибиться и не провалиться сквозь землю',
      'Когда взгляды устремлены на меня, по коже не бежит мороз',
    ],
    frightened: [
      'От внезапных звуков и движений я вздрагиваю сильнее, чем следовало бы',
      'В новых ситуациях я настораживаюсь ещё до того, как что-нибудь случится',
      'Я выбираю места, откуда видны выходы',
      'Я проверяю замки, маршруты и планы чаще, чем нужно',
      'Я избегаю любого риска, даже самого маленького',
      'Внутри тихо, но постоянно звучит: случится что-то плохое',
      'Я могу полностью расслабиться, не держа один глаз открытым',
      'Ночью тело отпускает день и легко засыпает',
    ],
    unseen: [
      'В компании мои слова перебивают — и я это позволяю',
      'Рядом с чужими потребностями мои как-то сами собой исчезают',
      'Я остаюсь на заднем плане, даже когда знаю ответ',
      'Я всё время отдаю, ни разу не попросив ничего взамен',
      'Я чувствую себя зрителем собственной жизни',
      'Где-то внутри вывод: для людей меня как будто нет',
      'Я занимаю место и говорю, когда это для меня важно',
      'Когда я занимаю место, плечи остаются расслабленными, спина прямой',
    ],
  },
  resources: {
    sage: [
      'Когда всё запутывается, во мне находится спокойный взгляд со стороны',
      'Люди приходят ко мне за взвешенным советом',
      'Я могу побыть с проблемой, не спеша её решить',
      'Сквозь шум я слышу, что для меня по-настоящему важно',
      'Я умею мириться с тем, что чего-то пока не узнать',
      'Мои выборы отражают мои глубинные ценности',
    ],
    warrior: [
      'Я умею сказать «нет» ясно и без жестокости',
      'Приняв трудное решение, я следую ему',
      'Я оберегаю своё время и энергию как что-то по-настоящему важное',
      'Когда пересекают мою границу, я об этом говорю',
      'Я могу пройти через конфликт, не потеряв себя в нём',
      'Я доверяю своей способности справляться с трудным',
    ],
    caregiver: [
      'Я умею утешать себя так же тепло, как дорогого друга',
      'Я забочусь о других, не стирая собственных потребностей',
      'Я замечаю, когда кому-то тяжело, раньше, чем об этом скажут',
      'Я умею принимать заботу так же легко, как давать её',
      'Моя доброта умеет сказать «стоп» и всё равно остаётся тёплой',
      'Я с вниманием отношусь к базовым потребностям своего тела',
    ],
    explorer: [
      'Я пробую новое просто чтобы посмотреть, что будет',
      'В моей неделе всегда есть место игре и любопытству',
      'Мне спокойно пока не уметь чего-то хорошо',
      'Я ищу красоту, новизну и удивление',
      'Я чаще задаю вопросы, чем даю ответы',
      'Мне почти не бывает скучно: мир по-настоящему интересен',
    ],
  },
  self: [
    'Даже под давлением во мне остаётся внутренняя опора',
    'Я вижу свои ситуации ясно, сквозь туман паники и привычек',
    'Я могу держать собственную боль с добротой',
    'Свои внутренние реакции я встречаю с любопытством, а не со страхом',
    'Я доверяю себе встретить то, что придёт',
    'Я иду навстречу тому, что пугает, когда это важно',
    'Новые идеи рождаются во мне легко и сами собой',
    'Я чувствую связь с людьми и с жизнью, даже когда остаюсь в одиночестве',
  ],
  validity: {
    attention: 'Для этого утверждения выберите вариант «Иногда про меня».',
    infrequency1: 'За всю жизнь во мне не было ни одной эмоции.',
    infrequency2: 'Мне никогда в жизни не было скучно.',
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
