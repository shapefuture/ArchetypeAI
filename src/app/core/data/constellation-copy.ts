/**
 * Bilingual copy for constellation headlines (§1.4) and subtype names (§1.5).
 * Names are DATA — hand-written, never generated. The English names live in
 * constellations.ts / parts.ts (spec tables); this module carries the Russian
 * rendering plus the essays for both languages.
 */
import type { ConstellationDef } from './constellations';

export type Lang = 'en' | 'ru';

/** Spec-locked constellations got their full essays here (were 'Spec-locked.'). */
const EN_ESSAY_FIXES: Record<string, string> = {
  'taskmasterxashamed':
    'Every result is a hearing, every delivery a plea: competent enough, this time, to be kept.',
  'pleaserxabandoned':
    'You keep everyone else\u2019s fire tended so no one notices \u2014 or leaves \u2014 the one quietly going out inside you.',
  'analystxfrightened':
    'From behind glass you map the storm with perfect precision \u2014 dry, untouched, and alone.',
  'rebelxunseen':
    'You burn loud and bright across every sky, praying someone finally reads the message: I am here.',
};

/** Russian names, keyed `${protector}x${exile}`. */
const RU_NAME: Record<string, string> = {
  // taskmaster
  'taskmasterxabandoned': 'Недостроенный собор',
  'taskmasterxashamed': 'Полигон доказательств',
  'taskmasterxfrightened': 'Железное расписание',
  'taskmasterxunseen': 'Книга учёта добрых дел',
  // inner_critic
  'inner_criticxabandoned': 'Суд уходов',
  'inner_criticxashamed': 'Обвинительная скамья',
  'inner_criticxfrightened': 'Эхо судейского молотка',
  'inner_criticxunseen': 'Примечание на полях',
  // pleaser
  'pleaserxabandoned': 'Хранимый огонь',
  'pleaserxashamed': 'Сад извинений',
  'pleaserxfrightened': 'Успокаивающее бдение',
  'pleaserxunseen': 'Тихая уступчивость',
  // controller
  'controllerxabandoned': 'Наглухо запертая дверь',
  'controllerxashamed': 'Комната в белых перчатках',
  'controllerxfrightened': 'Сжатый штурвал',
  'controllerxunseen': 'Картотека',
  // analyst
  'analystxabandoned': 'Длинное уравнение',
  'analystxashamed': 'Аналитическое досье',
  'analystxfrightened': 'Стеклянная обсерватория',
  'analystxunseen': 'Наблюдательная палуба',
  // hermit
  'hermitxabandoned': 'Дом с одной лампой',
  'hermitxashamed': 'Закрытые ставни',
  'hermitxfrightened': 'Сад за высокой стеной',
  'hermitxunseen': 'Запертый кабинет',
  // bypasser
  'bypasserxabandoned': 'Светлый объезд',
  'bypasserxashamed': 'Витражная роза',
  'bypasserxfrightened': 'Парящий мост',
  'bypasserxunseen': 'Бесконечное лето',
  // numb
  'numbxabandoned': 'Занесённая снегом станция',
  'numbxashamed': 'Комната белого шума',
  'numbxfrightened': 'Стоячая вода',
  'numbxunseen': 'Туманное поле',
  // rebel
  'rebelxabandoned': 'Сожжённые мосты',
  'rebelxashamed': 'Разорванное знамя',
  'rebelxfrightened': 'Загнанная буря',
  'rebelxunseen': 'Сигнальная ракета',
  // charmer
  'charmerxabandoned': 'Комната ста зеркал',
  'charmerxashamed': 'Маска в луче прожектора',
  'charmerxfrightened': 'Ослепительное отступление',
  'charmerxunseen': 'Стоячие овации',
};

/** Russian essays, one breath each — same depth as the English lines. */
const RU_ESSAY: Record<string, string> = {
  // taskmaster
  'taskmasterxabandoned': 'Вы строите свою ценность, как собор, которому нельзя завершиться: стоит остановиться — и кто-то уйдёт.',
  'taskmasterxashamed': 'Каждый результат — слушание дела, каждая сдача работы — мольба: на этот раз я достаточно хорош, чтобы меня оставили.',
  'taskmasterxfrightened': 'Плотное расписание стоит между вами и катастрофой, которую помнит тело.',
  'taskmasterxunseen': 'Вы храните чеки за всё, что сделали, словно любовь — это аудит.',
  // inner_critic
  'inner_criticxabandoned': 'Вы выносите себе приговор первым, прежде чем кто-то успеет уйти.',
  'inner_criticxashamed': 'Вы ведёте допрос самому себе каждый день, чтобы вердикт никогда не оказался сюрпризом.',
  'inner_criticxfrightened': 'Каждая ошибка пересматривается в три часа ночи судьёй, который не объявляет перерыва.',
  'inner_criticxunseen': 'Вы расписываете себя в примечания, чтобы другим не пришлось.',
  // pleaser
  'pleaserxabandoned': 'Вы поддерживаете огонь в каждом, чтобы никто не заметил — и не покинул — тот, что тихо гаснет внутри вас.',
  'pleaserxashamed': 'Вы выращиваете извинения там, где другие выросили бы претензии.',
  'pleaserxfrightened': 'Вы успокаиваете комнату раньше, чем успеваете понять, что чувствуете сами.',
  'pleaserxunseen': 'Ваше «да» звучит так быстро, что ваши собственные желания не успевают дойти до стола.',
  // controller
  'controllerxabandoned': 'Если ничего не меняется и никто не входит — никто и не уйдёт.',
  'controllerxashamed': 'Вы инспектируете свою жизнь до состояния, безупречного настолько, чтобы её можно было показать.',
  'controllerxfrightened': 'Вы держите каждую мелочь под контролем, потому что море однажды вас поглотило.',
  'controllerxunseen': 'Вы педантично упорядочиваете мир, а себя заносите в раздел «прочее».',
  // analyst
  'analystxabandoned': 'Вы решаете задачу о близости с безопасного расстояния, где она не может ранить.',
  'analystxashamed': 'Вы изучаете свои изъяны с клинической заботой, чтобы они стали данными, а не ранами.',
  'analystxfrightened': 'Из-за стекла вы картографируете бурю с безупречной точностью — сухой, нетронутой и одинокой.',
  'analystxunseen': 'Вы смотрите на жизнь через стекло, с отличным видом на собственное отсутствие.',
  // hermit
  'hermitxabandoned': 'Вы оставляете одну лампу для гостя, который никак не приходит, — для себя самого.',
  'hermitxashamed': 'Вы закрываете ставни прежде, чем кто-то успеет заглянуть.',
  'hermitxfrightened': 'За высокой стеной всё тихо, и ничто не может вас достать.',
  'hermitxunseen': 'В вашей богатой внутренней библиотеке нет лампы для гостей.',
  // bypasser
  'bypasserxabandoned': 'Вы так быстро воспаряете над болью, что она не успевает ничего сказать.',
  'bypasserxashamed': 'Вы вставляете рану в витраж, пока она не станет похожа на урок.',
  'bypasserxfrightened': 'Вы парите над опасностью по мосту, построенному из осознаний.',
  'bypasserxunseen': 'Вы держите погоду золотой, чтобы никто не спросил о зиме под ней.',
  // numb
  'numbxabandoned': 'Поезд чувств перестал приходить, но вы всё равно протапливаете станцию.',
  'numbxashamed': 'Помехи заполняют эфир там, где стыд вёл бы трансляцию.',
  'numbxfrightened': 'Вы становитесь настолько спокойными, что засыпает сама тревога.',
  'numbxunseen': 'Вы идёте по собственной жизни, укутанные в вату.',
  // rebel
  'rebelxabandoned': 'Вы уходите первыми — громко, — чтобы уход хотя бы был вашим.',
  'rebelxashamed': 'Вы поднимаете собственные цвета над раной, которую так и не назвали.',
  'rebelxfrightened': 'Вы бросаетесь в драку, потому что неподвижность однажды означала удар.',
  'rebelxunseen': 'Вы горите громко и ярко в каждом небе, моля, чтобы кто-нибудь наконец прочитал послание: я здесь.',
  // charmer
  'charmerxabandoned': 'Вы окружаете себя зеркалами, чтобы комната никогда не была пустой.',
  'charmerxashamed': 'Представление настолько яркое, что никто не проверяет, что за ним.',
  'charmerxfrightened': 'Вы уходите со сцены под залп конфетти.',
  'charmerxunseen': 'Вы собираете аплодисменты, как чеки за «я», с которым никто по-настоящему не встретился.',
};

/** Russian subtype names, keyed `${family}:${slug}`. */


const BASE_OF_FAMILY: Record<string, string> = {
  manager: 'taskmaster', firefighter: 'numb', exile: 'abandoned', resource: 'sage',
};

export const PART_NAME_RU: Record<string, string> = {
  taskmaster: 'Деятель', inner_critic: 'Внутренний критик', pleaser: 'Угодник',
  controller: 'Контролёр', analyst: 'Аналитик', hermit: 'Отшельник', bypasser: 'Обходчик',
  numb: 'Онемение', rebel: 'Бунтарь', charmer: 'Обаяшка',
  abandoned: 'Брошенный', ashamed: 'Стыдящийся', frightened: 'Напуганный', unseen: 'Незамеченный',
  sage: 'Мудрец', warrior: 'Воин', caregiver: 'Заботник', explorer: 'Исследователь',
};

const RU_SUBTYPE: Record<string, string> = {
  // taskmaster
  'taskmaster:striver': 'Стремящийся',
  'taskmaster:perfectionist': 'Перфекционист',
  'taskmaster:machine': 'Машина',
  'taskmaster:star-performer': 'Звезда сцены',
  'taskmaster:optimizer': 'Оптимизатор',
  // inner_critic
  'inner_critic:critic': 'Критик',
  'inner_critic:slave-driver': 'Надсмотрщик',
  'inner_critic:prosecutor': 'Прокурор',
  'inner_critic:apologist': 'Извиняющийся',
  'inner_critic:auditor': 'Ревизор',
  // pleaser
  'pleaser:helper': 'Помощник',
  'pleaser:clinger': 'Цепляющийся',
  'pleaser:martyr': 'Мученик',
  'pleaser:diplomat': 'Дипломат',
  'pleaser:ghostwriter': 'Гострайтер',
  // controller
  'controller:planner': 'Планировщик',
  'controller:sentry': 'Часовой',
  'controller:foreman': 'Прораб',
  'controller:chessmaster': 'Гроссмейстер',
  'controller:tyrant': 'Тиран',
  // analyst
  'analyst:observer': 'Наблюдатель',
  'analyst:wall': 'Стена',
  'analyst:architect': 'Архитектор',
  'analyst:skeptic': 'Скептик',
  'analyst:watchtower': 'Дозорная башня',
  // numb
  'numb:fog': 'Туман',
  'numb:deep-freeze': 'Глубокая заморозка',
  'numb:escape-artist': 'Мастер побегов',
  'numb:hibernator': 'Спячка',
  'numb:saboteur': 'Саботажник',
  // rebel
  'rebel:rebel': 'Бунтарь',
  'rebel:cornered-one': 'Загнанный',
  'rebel:provocateur': 'Провокатор',
  'rebel:burnout': 'Выгоревший',
  'rebel:outlaw': 'Изгой',
  // charmer
  'charmer:charmer': 'Обаяшка',
  'charmer:spotlight-chaser': 'Охотник за прожектором',
  'charmer:enchanter': 'Чародей',
  'charmer:impresario': 'Импресарио',
  'charmer:flirt-with-fire': 'Играющий с огнём',
  // hermit
  'hermit:hermit': 'Отшельник',
  'hermit:bunker-keeper': 'Хранитель бункера',
  'hermit:lighthouse': 'Маяк',
  'hermit:veiled-one': 'Потаённый',
  'hermit:deep-cave': 'Глубокая пещера',
  // bypasser
  'bypasser:bypasser': 'Обходчик',
  'bypasser:gilded-mask': 'Позолоченная маска',
  'bypasser:blissful-helper': 'Блаженный помощник',
  'bypasser:abstractor': 'Абстракционист',
  'bypasser:sky-gazer': 'Созерцатель неба',
  // abandoned
  'abandoned:abandoned-one': 'Брошенный',
  'abandoned:orphan-who-serves': 'Служащий сирота',
  'abandoned:hungry-heart': 'Голодное сердце',
  'abandoned:small-hours': 'Час до рассвета',
  'abandoned:empty-room': 'Пустая комната',
  // ashamed
  'ashamed:ashamed-one': 'Стыдящийся',
  'ashamed:branded-one': 'Заклеймённый',
  'ashamed:impostor': 'Самозванец',
  'ashamed:hidden-face': 'Скрытое лицо',
  'ashamed:masked-one': 'В маске',
  // frightened
  'frightened:frightened-one': 'Напуганный',
  'frightened:braced-one': 'Сжавшийся',
  'frightened:vigilant': 'Бдительный',
  'frightened:startled-child': 'Вздрогнувший ребёнок',
  'frightened:frozen-one': 'Онемевший',
  // unseen
  'unseen:unseen-one': 'Незамеченный',
  'unseen:echo': 'Эхо',
  'unseen:good-child': 'Хороший ребёнок',
  'unseen:unheard-scream': 'Неуслышанный крик',
  'unseen:backroom-mind': 'Ум из задней комнаты',
};

// --- Long-form essays (~150 words each): what it feels like inside,
// the signature loop, and one concrete shift. Prefer over the one-liners. ---

const EN_ESSAY_LONG: Record<string, string> = {
  // taskmaster
  'taskmasterxabandoned':
    'From the inside, this constellation feels like a staircase you climb even in sleep. Somewhere below sits a child who learned that people leave when you stop performing, so a part of you took up construction: one more project, one more credential, one more proof that you are worth staying for. The signature loop is elegant and cruel. You achieve, feel a flicker of relief, then hear the scaffolding creak — because worth that is built can also be inspected, and inspected worth never passes final review. So you start again, taller this time. The exhaustion is not a bug; it is the part\u2019s proof of love, worn like a badge. The way out is not finishing the cathedral. It is one deliberate pause while something is still imperfect — an afternoon, an unpolished email — in which nobody leaves. Stay with the dread; let it age. You were never a building site.',
  'taskmasterxashamed':
    'Every result here is a hearing, every delivery a plea: competent enough, this time, to be kept. From inside, life feels like a courtroom where the charge is never named — only the verdict matters, and the verdict is always pending. A part of you pushes you to produce because long ago, somewhere, love arrived wrapped in achievement, and its withdrawal came wrapped in disappointment. The signature loop: you deliver, wait for the ruling, feel a brief acquittal, then the shame files an appeal and the next case opens. Rest feels like contempt of court. Even praise is entered as evidence, never as an ending. The way out is one result released at "good enough" — deliberately, on purpose — while you track what actually follows. Not catastrophe, usually: ordinary silence, ordinary continuity. Let the court adjourn for a day. Your worth was never on trial; only the part believes it was.',
  'taskmasterxfrightened':
    'A packed calendar stands between you and the catastrophe your body remembers. From inside, this feels like safety through velocity: as long as every hour is assigned, the disaster cannot find an opening. The fear underneath is old and specific — a time when stillness meant danger, when unstructured space was exactly where the hurt found you. So a part of you became a scheduler-guard, and it never sleeps. The signature loop: you fill the days, run on schedule, and the moment a gap appears — a cancelled meeting, a free Sunday — anxiety floods in faster than relief, proving the part right, proving the walls necessary. Busyness becomes both the cure and the disease. The way out is small and repeated: leave fifteen minutes unstructured, on purpose, with feet on the floor, and let the alarm ring without answering it. The catastrophe it guards against is not in the gap. The child it protects is.',
  'taskmasterxunseen':
    'You keep receipts of everything you do, as if love were an audit. From inside, this constellation feels like a ledger that must always balance: favors listed, efforts documented, sacrifices filed under assets, in case anyone ever asks what you are worth. The child underneath learned that being noticed came through usefulness — seen for what you do, never for who you are — and a part of you vowed to keep the books immaculate. The signature loop: you give, you log, you quietly hope this time someone will read the ledger without being asked; they rarely do, because they never knew it existed. Resentment accrues interest in a currency nobody spends. The way out is one entry spoken aloud instead of recorded: tell a safe person something you did purely because you wanted to, with no invoice attached. Watch what happens when worth stops being bookkeeping. You were never a line item. You were the whole ledger\u2019s author.',
  // inner_critic
  'inner_criticxabandoned':
    'You sentence yourself first, before anyone can leave. From inside, this feels like a permanent defense strategy running in a courtroom of one: the critic scans your words, your face, your silences, and convicts you of the crime it fears others are already assembling. The logic is ancient — if I punish me first, their leaving will at least be justified, expected, survivable. A child once connected departure with personal fault, and a part of you swore never to be blindsided again. The signature loop: closeness increases, the critic intensifies, the self-attack becomes its own reason to withdraw, and the leaving you predicted arrives — self-inficted, then blamed on fate. The way out is catching one verdict mid-sentence and asking the critic a single question: "What are you afraid would happen if you stayed quiet?" It answers, always, in the vocabulary of that old leaving. Thank it. Then do the thing uncondemned.',
  'inner_criticxashamed':
    'You cross-examine yourself daily so the verdict never surprises you. From inside, this feels like thoroughness, even integrity — surely honest people audit themselves? But the courtroom has one peculiarity: the defense attorney never shows up. The child underneath absorbed a verdict of defectiveness before they had language to contest it, and a part of you took over the prosecution to keep the proceedings internal, where at least you control the schedule. The signature loop: shame rises, the critic preempts it with detailed self-indictment, the preemption hurts as much as the original shame, and the whole cycle is mistaken for humility or self-awareness. It is neither. It is a wound doing the wounding. The way out is one cross-examination declined: the next time you hear the opening statement — "you always…" — place a hand on your chest and say, "I notice a part prosecuting." Not acquittal, just a mistrial. The verdict was written before the evidence existed.',
  'inner_criticxfrightened':
    'Every mistake is retried at 3 a.m. under an inner judge that never adjourns. From inside, this feels like vigilance wearing a legal robe: the critic believes that if it reviews every error exhaustively enough, future ones can be prevented, and with them the catastrophes mistakes once brought. Somewhere in your history, a small error had enormous consequences — ridicule, rage, a door slamming — and a part of you built a night court to make sure nothing like that ever slips through again. The signature loop: a mistake occurs, the day\u2019s court adjourns, and the nocturnal session opens the moment your head touches the pillow, replaying testimony you already know by heart. You wake tired and more afraid of erring, which makes errors likelier, which feeds the docket. The way out is procedural: when the night session opens, name it — "the court is in session" — get up, drink water, write the verdict down and close the notebook. Courts need recess to function. So do you.',
  'inner_criticxunseen':
    'You annotate yourself into footnotes so no one else has to. From inside, this feels like helpful self-deprecation: if I point out my own flaws first, wittily, before anyone else can, then no one can hurt me with them. The child underneath learned that visibility was dangerous — noticed meant criticized, standing out meant standing alone — and a part of you chose the margins as the safest page to live on. The signature loop: you pre-shrink, the room takes you at your own valuation, the smallness aches, and the ache is filed as more evidence for further shrinking. Each self-deprecating joke is a pebble taken from your own wall. The way out is one sentence un-annotated: the next achievement, opinion, or presence you offer without the footnote, without "it\u2019s nothing," without the preemptive discount. Let it stand in the main text, typographically large. The parts that hid you were protecting you from eyes that no longer read that way.',
  // pleaser
  'pleaserxabandoned':
    'You keep everyone else\u2019s fire tended so no one notices — or leaves — the one quietly going out inside you. From inside, this feels like love, and partly it is: a part of you genuinely delights in care. But underneath runs an older contract, signed by a child who learned that people stay when you are useful and warm, and leave when you have needs. So the tending never stops, and the tenderness points only outward. The signature loop: you give, they stay, you conclude the giving worked, so you give more — while your own preferences atrophy from disuse until even the question "what do I want?" returns static. The exhaustion is not from the giving; it is from the surveillance, the constant tracking of everyone\u2019s temperature except your own. The way out is small and terrifying: state one preference this week — a restaurant, a film, a yes that costs something — to someone safe, and stay in the room while they simply accommodate you. Your fire was never meant to heat the whole village alone.',
  'pleaserxashamed':
    'You grow sorries where other people might grow complaints. From inside, this feels like being easy to be with, low-maintenance, kind — and it is lonely in a way that has no legitimate complaint to file. The child underneath absorbed shame for existing loudly: needs were treated as burdens, anger as betrayal, so a part of you learned to compost every grievance into an apology before it could reach the air. The signature loop: something hurts, the apology sprouts first — "sorry, I\u2019m probably being too sensitive" — the hurt goes unnamed, the shame gets watered, and next time the sprout comes faster. Meanwhile the soil of you grows nothing that is plainly, simply yours. The way out is one unconverted seed: the next small hurt stated as a plain sentence without a sorry in front of it. "That stung" is a complete sentence. Watch the sky fail to fall. The gardener in you was protecting a child who was never allowed to need anything. That child needed things. That was never shameful.',
  'pleaserxfrightened':
    'You calm the room before you even know what you feel. From inside, this feels like a sixth sense: a shift in someone\u2019s tone, a tightened jaw across the table, and your nervous system registers it before your mind does, already deploying warmth, jokes, refills, accommodation. The child underneath grew up in weather that turned dangerous without warning — an adult whose moods filled the whole house — and a part of you became a lightning-rod, absorbing tension so the storm would not strike. The signature loop: tension appears, you soothe it, relief arrives, and the cost is skipped entirely: your own feeling, whatever it was, never got named because the emergency came first and always will. Over years you become a stranger to your own weather. The way out is one beat of delay: the next time the room tenses, pause — physically, visibly — and ask yourself "what am I feeling right now?" before doing anything at all. The storm you are calming was rarely yours to stop. Your feelings were not the cause of anyone\u2019s weather.',
  'pleaserxunseen':
    'Your yes comes so fast that your own preferences never make it to the table. From inside, this feels like generosity with a lag problem: by the time you might have wanted something different, the moment has already been agreed away. The child underneath learned that visibility was conditional — you counted when you were convenient — and a part of you streamlined the whole self into a single, frictionless syllable. The signature loop: a request arrives, yes fires automatically, brief approval lands, and somewhere in the delay afterward a faint signal surfaces — "actually…" — which is politely buried, again, because reversing now would be an imposition. Each buried signal dims the next one. The way out is a slower yes: once this week, answer "let me check and get back to you," and use the gap to locate one honest preference, even a small one. Yes is not a fire exit. Your wants were never too late; they were just never given a chair.',
  // controller
  'controllerxabandoned':
    'If nothing changes and no one enters, no one can leave. From inside, this feels like peace, almost — the settled quiet of a life with the variables removed. The child underneath experienced a departure that came through a door someone else opened: a parent\u2019s mood, a move, a betrayal arriving unannounced. And a part of you became a locksmith, bolting every door that change might come through. The signature loop: novelty approaches — a person, an opportunity, a trip — the locks engage, the novelty withdraws, and the withdrawal is logged as proof that openness ends in loss, so the bolts go deeper. The house grows quieter and safer and emptier, and the emptiness is rebranded as calm. The way out is one door unbolted slightly: accept one small change this week — a new route, a new café, a guest for tea — and track what actually happens. The part is not wrong that loss exists. It is wrong that sealed doors stop it. Loss passes through walls; so does life.',
  'controllerxashamed':
    'You inspect your life until it is spotless enough to be seen. From inside, this feels like standards, even pride — the white-glove test passed daily, the shelves of self arranged for an audience that is always imminent and never satisfied. The child underneath learned that being seen meant being judged, and that judgment could maybe, possibly, be survived if everything was perfect first. So a part of you became the inspector, running a gloved finger along every surface of your choices, your home, your words. The signature loop: inspection finds dust, the dust confirms the shame, the shame demands deeper cleaning, and the standard climbs another rung beyond any human reach. Meanwhile the guests the cleaning was for have long stopped being invited — the house must be perfect first, and it never is. The way out is one fingerprint left deliberately: let something imperfect be seen by one safe person this week — the unfinished project, the messy kitchen. You were the guest all along, waiting outside your own door.',
  'controllerxfrightened':
    'You steer every detail because the sea once swallowed you. From inside, this feels like competence under pressure: routes planned, contingencies noted, every passenger manifest checked twice. The gift is real — you are genuinely good at the helm. But the driving is not about skill; it is about a voyage long ago when nobody steered, when events simply happened to you, and the water closed over. A part of you vowed that as long as it held the wheel, nothing would ever swamp the boat again. The signature loop: control works, tension eases, then any unplanned wave — a delay, a detour, another person\u2019s free will — reads as the sea rising, and the grip tightens past comfort into white knuckles. The effort of constant steering costs more than most storms. The way out is one delegated rope: hand a small navigational decision to someone else — the route, the restaurant, the playlist — and feel the wheel turn under your hands without you. The sea that swallowed you was real. It is not this one, and you know how to swim now.',
  'controllerxunseen':
    'You organize the world meticulously and file yourself under miscellaneous. From inside, this feels like a gift in use: systems, labels, order — a mind that makes the chaos legible. And it is a gift. But look at the filing cabinet of your attention: every project, every person, every obligation has a colored folder, and somewhere in the back is a thin manila one marked "misc." where your own life goes. The child underneath learned that being noticed was for objects, achievements, arrangements — not for the self doing the arranging — and a part of you kept the world sorted so expertly that no one ever needed to look at the organizer. The signature loop: you systematize, others benefit, appreciation accrues to the system, and the self behind it recedes one folder deeper. The way out is re-categorization: take one fact about yourself — a want, a ache, a curiosity — and file it in the front, in the active projects, and act on it once this week. You were never the clerk of your own life. You are its author.',
  // analyst
  'analystxabandoned':
    'You solve for connection at a distance where it cannot hurt. From inside, this feels like clarity: while others flounder in feeling, you have models, frameworks, explanations — a long equation that, if finally balanced, would yield love safely. The child underneath reached for someone and met absence or bewilderment, and a part of you concluded that raw reaching is a variable best eliminated. So the reaching became research: observe, hypothesize, analyze the people you long for instead of joining them. The signature loop: closeness begins, you shift into studying it, the study creates the distance it was meant to protect you from, and the resulting loneliness supplies more data about the difficulty of connection. The equation grows longer and never closes. The way out is one unsolved moment: with someone safe, say "I miss you" without the analysis — no why, no framework, no footnote. The intellect is not the villain here; it is a brilliant translator who forgot the original language. You do not need to solve for love. You are allowed to simply speak it.',
  'analystxashamed':
    'You study your flaws with clinical care so they become data, not wounds. From inside, this feels like rigorous self-knowledge: you know your patterns better than anyone, can narrate your history in clean paragraphs, can predict your dysfunction to the decimal. The child underneath was handed a verdict of defectiveness, and a part of you discovered that a specimen on a slide hurts less than a self in the world — pinned, labeled, studied, the wound becomes a finding. The signature loop: shame stirs, the analysis engages, the feeling is converted into taxonomy, and the distance produces relief plus a strange new shame: that you are doing this instead of living. Insight accumulates; contact does not. The case file thickens; the person thins. The way out is one entry un-filed: the next time you catch yourself analyzing a pain, put the pen down and say only "this hurts," with no distance, no label. Feelings metabolize through feeling, not through footnotes. You were never the researcher. You were what the research was protecting.',
  'analystxfrightened':
    'From behind glass you map the storm with perfect precision — dry, untouched, and alone. From inside, this feels like safety with a view: the observatory is climate-controlled, the instruments are superb, and you can name the barometric pressure of any emotional system in the room. The child underneath lived through weather that destroyed things — rage, chaos, unpredictability — and a part of you built the glass, calculating that a meteorologist cannot be struck by lightning. It was right, for a while. The signature loop: intensity approaches, you ascend to the observation deck, the storm passes untouched, and the glass holds — but so does the distance, and the warmth of every gathering reaches you as information rather than experience. Perfectly dry, perfectly informed, perfectly alone. The way out is one fingerprint on the glass: step into a small, survivable storm — a minor conflict, a moment of expressed feeling — and stay in it without narrating. The forecast was never wrong. But you were never meant to live on the deck.',
  'analystxunseen':
    'You watch life through glass with an excellent view of your own absence. From inside, this feels like perspective: you understand the group, the dynamics, the whole architecture of every room — from a vantage point that no one thinks to look up toward. The child underneath learned that presence went unrewarded or unnoticed, and a part of you turned invisibility into a discipline: the one who sees everything need not be seen. The observation deck became both hideout and identity. The signature loop: you analyze the scene, the analysis is accurate, the accuracy goes unspoken or unattributed, and your absence from the picture is confirmed as the natural order — the watcher is not in the frame. Loneliness arrives, gets promptly analyzed too. The way out is one entry into the frame: this week, offer one observation out loud, in the first person — "I think…", "I loved…" — and let it be yours, attributed, visible. The deck will keep. The view you actually wanted includes you in it.',
  // hermit
  'hermitxabandoned':
    'You leave one lamp on for a visitor who never quite arrives — you. From inside, this feels like self-sufficiency with a faint, steady ache: the house is quiet, the evening is yours, and yet one lamp always burns by the window, its light spilling onto a road nobody travels. The child underneath waited for someone who did not come back, or came back insufficiently, and a part of you built a life where waiting is no longer humiliation — only habit. The signature loop: solitude soothes, then isolates; the isolation aches; the ache says reach out; and reaching out once risked so much disappointment that the part prefers the lamp to the door. So the lamp stays lit for decades. The way out is to change who the light is for: one evening this week, sit in the lamp\u2019s circle yourself — good food, warm blanket, no screen — as the guest you kept waiting for. The hermit is not wrong that you can be good company for yourself. It just forgot to deliver the invitation.',
  'hermitxashamed':
    'You close the shutters before anyone can look in. From inside, this feels like modesty, or taste, or simply a preference for quiet — and there is real preference in the mix. But look closer at the timing: the shutters do not close when you are tired; they close when being seen approaches. The child underneath was looked at in ways that burned — evaluated, mocked, misused — and a part of you learned that windows are liabilities. Better the dim interior than the exposing light. The signature loop: closeness nears, the shutters swing, the person outside reads the closedness as disinterest and drifts away, and the departure is filed as proof that exposure would have ended worse. The house grows safe and dark. The way out is one shutter cracked, briefly: share one small true thing — a photo, an opinion, a bad day\u2019s account — with someone proven gentle, then close the shutter again if needed. Seen does not have to mean scorched. Some light is just morning.',
  'hermitxfrightened':
    'Behind high walls, everything is quiet and nothing can reach you. From inside, this feels like hard-won peace: after years of unpredictable weather — anger, chaos, demands that arrived like sieges — you built the walls yourself, stone by stone, and the garden within them genuinely blooms. The child underneath needed these walls; without them there might not be a you reading this. The signature loop: the world knocks — invitation, news, a voice at the gate — the walls do their work, the knocking stops, and the silence that follows is both relief and slow starvation. Muffled becomes indistinguishable from empty. The way out is not demolition but a gate: one scheduled opening, low-risk, time-boxed — a walk among strangers, a brief call, a letter sent — after which you may close it freely. Walls with a gate are a home; walls without one become a keep you guard for a prisoner. The gardener inside grew all this beauty. Some of it was always meant to be given away.',
  'hermitxunseen':
    'Your rich inner library has no reading lamp for guests. From inside, this feels like depth: shelves and shelves of thought, feeling, memory, curiously organized — a mind visitors would marvel at if they ever entered. The child underneath learned that what was shown was not received — interests met with blankness, feelings with changing subjects — so a part of you moved the entire collection indoors and locked the study. The signature loop: someone approaches, you offer the spines of small talk, they browse and leave, and the conclusion is confirmed: nobody wants the collection. But nobody was shown it. The way out is one book left open on the table: share a single specific enthusiasm or tender thought with someone this week — not the whole library, one volume — and watch what happens when it is actually read. Unseen is not the same as unseeable. The part that locked the study mistook your audience for the one from decades ago. New readers exist. They just need the lamp on.',
  // bypasser
  'bypasserxabandoned':
    'You rise above the ache so quickly it never gets to speak. From inside, this feels like resilience, even wisdom: where others drown, you float; you find the lesson, the growth, the higher meaning, usually within minutes. The child underneath discovered that the pain of loss had no witness — so a part of you built wings, and from altitude, even abandonment looks small, like a city from a plane. The signature loop: the ache stirs, the ascent begins, equanimity arrives on schedule, and the unspoken ache — patient, unpressured — waits below and settles in for good, becoming a low hum you eventually mistake for your personality. Altitude is not healing; it is distance. The way out is a controlled descent: once this week, when the rise starts, stay at ground level for five minutes — feet planted, hand on heart — and let the ache say its one sentence to you directly. You already know the lesson it would become. It wanted to be heard first, not taught.',
  'bypasserxashamed':
    'You frame the wound in stained glass until it looks like a lesson. From inside, this feels like alchemy: pain goes in, meaning comes out, and the rose window you build from broken pieces is genuinely beautiful. The child underneath was handed shame with no relief available — no apology came, no witness — and a part of you learned to survive by beautifying: if the wound is sacred, it cannot be disgraceful. The signature loop: shame stings, the framing begins — the gratitude list, the "everything happens for a reason," the silver lining polished to a shine — and the sting is transfigured before it is felt. But unstung shame does not dissolve; it is simply encased, and the glass needs constant upkeep. The way out is one pane left plain: the next time the frame starts, pause and say the untransfigured version — "this was just painful, and it hurt me" — to yourself or someone safe. Spirituality that skips the wound is decoration. The light comes through either way; it prefers honest glass.',
  'bypasserxfrightened':
    'You hover over danger on a bridge made of insight. From inside, this feels like mastery: below you churn the fear — old, specific, bodily — and you cross above it on planks of understanding, each one an insight, a framework, a name for what happened to you. The child underneath faced something with no escape at ground level, and a part of you discovered that consciousness floats: understand the fear thoroughly enough and you are somehow above it. The signature loop: fear rises, the insight-bridge deploys, crossing feels like victory, but the bridge has a property no one mentions — it only spans, never lands; you cross and cross and remain suspended, gripping understanding, while the ground where life happens stays below, unreachable. The way out is one deliberate step onto solid ground: do one small thing this week that the fear forbids, without analyzing it first or after — unexamined, unrehearsed, just done. Insight was meant to be a bridge, not a residence. The far side has been waiting.',
  'bypasserxunseen':
    'You keep the weather golden so no one asks about the winter underneath. From inside, this feels like being a good presence in others\u2019 lives: upbeat, philosophical, the one who lifts the room. And it works — people feel lighter around you. But the endless summer has a maintenance schedule: the winters must be hidden the moment they drift in, because once, a child learned that difficult feelings made people withdraw, that brightness was the price of company. So a part of you became the climate controller. The signature loop: someone asks "how are you, really?", the golden answer deploys on schedule, the moment passes, and the winter underneath grows one season longer, frost creeping toward the foundations no one inspects. The way out is one forecast correction, small and safe: tell one trusted person about one真实 cold day you had this week — plainly, without converting it to a lesson. You were loved for your light, yes. You are lovable in your weather, all of it.',
  // numb
  'numbxabandoned':
    'The train of feeling stops arriving; you keep the station warm anyway. From inside, this feels like competence in flatness: you function — work, errands, conversations, even care — while inside, the platform where emotions used to arrive stands quiet under a gray schedule board. Once, feelings brought news that hurt too much: the ones who left, the leaving that kept happening. And a part of you, wiser than the schedule, cut the line — because a child who feels everything about abandonment cannot also keep standing. The numbness is not absence; it is mercy, administered constantly. The signature loop: a flicker of feeling approaches on the rails, the part switches the signal, the flicker passes through without stopping, and the station logs another quiet day — proof that the system works, cost unbilled. The way out is not forcing arrivals: it is one bundled-up minute on the platform, daily, asking "what is even one percent present?" — and greeting whatever limps in. The line was cut for a good reason. Some trains still run. You are the stationmaster now.',
  'numbxashamed':
    'Static fills the channel where shame would otherwise broadcast. From inside, this feels like nothing — which is precisely the design. Where other people flinch and flush, you hear a soft gray hiss: decisions become arbitrary, mirrors become furniture, and the question "what do you feel about it?" returns channel noise. Once, shame broadcast at full volume and no one turned it down for the child receiving it — so a part of you became the engineer and jammed the frequency entirely. Better static than that signal. The signature loop: a situation arises that should register — praise, insult, intimacy — the static holds, you respond from procedure rather than feeling, and the flatness reads to others as composure while it is actually anesthesia. The way out is one channel unscrambled, briefly, on purpose: after a moment that mattered, write the single word that is even thirty percent true — "off", "small", "exposed" — without needing the full broadcast. Static was protection, not personality. One word at a time, the signal returns.',
  'numbxfrightened':
    'You go so calm that alarm itself falls asleep. From inside, this feels like being unshakeable — the crisis hits, everyone panics, and you move through it level, efficient, almost bored. People admire it. They do not see the mechanism: long ago, fear was useless — a child could not run, could not fight, could only endure — so a part of you learned to administer the still-water anesthetic on demand. The calm is not peace; it is preemptive sedation, applied the moment the water might churn. The signature loop: something frightening approaches, the stillness floods in automatically, you handle everything and register nothing, then handle the next thing, and the next — while the fear, unsensed, accumulates in the body as sleeplessness, jaw, gut, a engine-idle hum no calm ever reaches. The way out is one ripple permitted: in a genuinely safe moment, do something small that stirs the water deliberately — a film that might move you, music loud in the car — and let your eyes sting without shutting it down. Calm chosen is strength. Calm imposed is just fear, sedated.',
  'numbxunseen':
    'You walk through your own life wrapped in cotton wool. From inside, this feels like a gentle, foggy continuity — days pass, needs get met at the minimum viable level, and nothing quite touches you, including the things that should. The cotton was wound on carefully, long ago, by a part of you protecting a child for whom being unnoticed went on so long that the ache of it became unbearable to feel. Numbness to the unseen is numbness to everything; anesthesia is not selective. The signature loop: life offers a moment that might register — beauty, affection, an achievement — the cotton muffles it to a rumor, the moment passes unmet, and the flatness provides no data, no preference, no pull in any direction, so the walking continues on inertia alone. The way out is one fingertip exposed: once a day, pick one sensory thing — the first sip of coffee, water on your face, sun on a wrist — and give it thirty undivided seconds. Feeling returns through the body before it returns through the mind. Start at the edges.',
  // rebel
  'rebelxabandoned':
    'You leave first, loudly, so departure is at least yours. From inside, this feels like power, even dignity: while others cling and beg, you slam doors on your own schedule, before anyone can do it to you. Once, a child was left — quietly, devastatingly, without ceremony — and a part of you vowed never again to be the one standing at the window. If leaving is inevitable, the rebel will at least author it. The signature loop: closeness deepens, the part scans for the first hint of withdrawal, finds it — everything can be read as withdrawal if you try — and detonates the relationship preemptively: a fight, a scene, a flourish. The aftermath hurts, but it is a hurt with a signature on it. The way out is one ending declined: the next time the impulse comes, say out loud, "a part of me wants to bolt right now" — and stay ten more minutes. The part is not wrong that leaving exists. It just keeps casting you as the one who leaves.',
  'rebelxashamed':
    'You fly your own colors over a wound you never named. From inside, this feels like defiance with a flag: rules defied, expectations refused, a style of moving through the world that says "I answer to no one." And it is genuinely alive — but listen for what the defiance is answering. Underneath, a child was told, in a thousand small ways, that who they were was unacceptable; and a part of you chose outlawry over annihilation: if I cannot be good, I will be glaring. The shame was never named because naming it would mean admitting the verdict landed. The signature loop: a hint of judgment appears, the colors run up the pole — louder, bolder, more unapologetic — the judged feeling converts into energy, and the wound beneath gets another layer of bunting instead of a look. The way out is one quiet moment without the flag: alone, write the sentence "what I was really ashamed of was…" and let it be small, true, unwitnessed. Defiance is armor for a wound. The wound was never you.',
  'rebelxfrightened':
    'You come out swinging because stillness once meant getting hit. From inside, this feels like readiness: the world is a room with exits to watch, and you watch all of them, jaw set, first move always yours. The calm ones seem either brave or naive. Once, a child learned the physics of danger: that the pause before the blow is survivable only if you fill it with your own storm — attack, noise, preemption. A part of you carries that physics forward into rooms where no blow is coming. The signature loop: a hint of threat registers — a critical tone, a closed door, a surprise — the swing fires before thought, the moment escalates, and the escalation confirms the world\u2019s hostility, rearming the part for the next round. You win fights you never needed to have. The way out is one breath inserted between signal and swing: when the readiness spikes, plant both feet, exhale once, and ask "is anything actually hitting me right now?" Usually, honestly: no. The part guarded you through real wars. The war moved out. It can too.',
  'rebelxunseen':
    'You burn loud and bright across every sky, praying someone finally reads the message: I am here. From inside, this feels like vitality — you are the loudest laugh, the wildest story, the one the room orbits. But trace it down to the fuse: a child stood in a room full of people and was not seen, not once, until visibility became a matter of survival. A part of you learned that ordinary presence fails, and only signal flares register on anyone\u2019s horizon. The signature loop: the need to be seen rises, the flare goes up — the drama, the provocation, the too-much — heads turn, attention lands for a moment, and then looks away, because flares burn out; and the part reads the fading light as proof the next flare must be bigger. The way out is one unlit signal: with someone safe, ask directly for attention in plain words — "I could use some time today; can we talk?" — and receive it without performance. The flare said "I am here." The plain voice says it too, and carries further.',
  // charmer
  'charmerxabandoned':
    'You surround yourself with mirrors so the room is never empty. From inside, this feels like social abundance: every gathering has your laugh in it, every silence gets filled, every stranger leaves as a fan. The mirrors are other people — each one reflecting you back bright, engaged, delighted — and with enough of them positioned well, loneliness is architecturally impossible. Almost. Once, a child was left alone in a silence that echoed, and a part of you swore to furnish every room with reflection so the emptiness could never re-form. The signature loop: the room fills, the reflections multiply, the abandonment feels outrun — until the party ends, and the sudden absence of mirrors is worse than a quiet night would have been, confirming the part\u2019s premise: without audience, void. The way out is one evening unmirrored, on purpose: solo, screenless, doing something you genuinely like, staying through the silence until it becomes just quiet. The part filled the room to protect you. The one it protected can be there without applause.',
  'charmerxashamed':
    'The performance is so bright that no one checks what is behind it. From inside, this feels like being good with people — witty, warm, impossible not to like — and it is a real gift, honestly held. But notice the lighting design: the spotlight is positioned, always, directly on the mask, because somewhere backstage is a child who was told, in effect, that the unperfomed self would not be tolerated. Charm became the costume the shame wears to the party. The signature loop: intimacy nears, the performance scales up — funnier, warmer, more on — the person laughs with the character, and the connection lands on the mask and stays there, which the part counts as safety while the one behind it starves in the glow. Being adored is not being known. The way out is one scene played straight: with someone proven gentle, drop the bit for ten minutes — speak slowly, plainly, about something real — and stay in the room while being unremarkable. The mask was stagecraft for a child in danger. The danger has left the theater.',
  'charmerxfrightened':
    'You exit through a burst of confetti. From inside, this feels like style: when things get tense, you produce the perfect joke, the dazzling pivot, the sudden plans elsewhere — and the moment that threatened to close in is gone in glitter. Once, a child faced danger with no exit through the front — the room, the adult, the anger — and discovered the trapdoor of charisma: be delightful enough, and the danger gets confused; be elsewhere-fast enough, and it misses you. A part of you has been running that exit ever since. The signature loop: discomfort rises, the confetti cannon fires — flirtation, performance, a dramatic departure — the tension breaks, relief floods, and the uncomfortable thing remains unmet, waiting for the next gathering with interest accrued. Every room eventually becomes a stage to escape from. The way out is one exit declined: the next time the cannon loads, stay seated — feel the tension, let the joke go unsaid, see what the moment does when you remain in it. Dazzle was an escape route. You can walk out the front door now.',
  'charmerxunseen':
    'You collect applause like receipts for a self no one actually meets. From inside, this feels like success at the human business: rooms light up when you enter, laughter arrives on cue, the archive of warm reactions is extensive. But examine the receipts: what exactly was applauded? The performance — the charm, the stories, the shine. And what was it payment for? A child once concluded that the self, unadorned, was not worth staying for — that only the show would be attended to — and a part of you has been staging it ever since, filing each ovation as evidence in a case that never closes. The signature loop: the applause lands, the receipt is archived, the warmth lasts exactly as long as the show, and the one behind the curtain goes home unmet again, holding proof of being loved that never quite feels like being known. The way out is one uncounted moment: this week, do something real with someone while being plainly, unperformedly yourself — and notice any warmth that arrives without the show. That warmth is not a receipt; it needs no audit.',
};

const RU_ESSAY_LONG: Record<string, string> = {
  // taskmaster
  'taskmasterxabandoned':
    'Изнутри это созвездие похоже на лестницу, по которой вы поднимаетесь даже во сне. Где-то внизу сидит ребёнок, который узнал: люди уходят, когда ты перестаёшь стараться, — и часть вас взялась за строительство: ещё один проект, ещё одно подтверждение, ещё одно доказательство, что вас стоит оставить рядом. Фирменная петля изящна и жестока. Вы достигаете, чувствуете вспышку облегчения — и слышите, как скрипят леса: ведь ценность, которую построили, можно и инспектировать, а инспектируемая ценность никогда не проходит финальную приёмку. И вы начинаете заново, ещё выше. Истощение — не сбой; это знак любви, который часть носит как орден. Выход — не достроить собор. Выход — одна намеренная пауза, пока что-то ещё несовершенно: полдня, неотшлифованное письмо, — и никто не уходит. Побудьте с этим страхом; дайте ему состариться. Вы никогда не были стройплощадкой.',
  'taskmasterxashamed':
    'Каждый результат здесь — слушание дела, каждая сдача работы — мольба: на этот раз я достаточно хорош, чтобы меня оставили. Изнутри жизнь кажется судом, где обвинение никогда не озвучено — важен только вердикт, и вердикт всегда отложен. Часть вас гонит вас производить, потому что когда-то любовь приходила, завёрнутая в достижения, а её отмена — завёрнутая в разочарование. Фирменная петля: вы сдаёте, ждёте решения, получаете короткое оправдание — и стыд подаёт апелляцию, открывается новое дело. Отдых ощущается как неуважение к суду. Даже похвалу часть заносит в доказательства, но никогда — в окончание. Выход — один результат, выпущенный на уровне «достаточно хорошо», намеренно, при отслеживании того, что последует на самом деле. Обычно — не катастрофа: обычная тишина, обычное продолжение. Пусть суд объявляет выходной на день. Ваша ценность никогда не была на скамье подсудимых; в это верит только часть.',
  'taskmasterxfrightened':
    'Плотное расписание стоит между вами и катастрофой, которую помнит тело. Изнутри это похоже на безопасность через скорость: пока у каждого часа есть задание, беда не найдёт лазейки. Страх внизу старый и конкретный — время, когда неподвижность означала опасность, когда неструктурированное пространство было именно тем местом, откуда приходила боль. Часть вас стала сторожем-планировщиком и не спит никогда. Фирменная петля: вы заполняете дни, живёте по графику, и в момент, когда появляется дыра — отменённая встреча, свободное воскресенье, — тревога вливается быстрее облегчения, доказывая части правоту, доказывая необходимость стен. Занятость становится и лекарством, и болезнью. Выход мал и повторяем: оставить пятнадцать минут неструктурированными, намеренно, стопы в пол, и позволить сигнализации звонить, не отвечая. Катастрофа, от которой она сторожит, не живёт в этой паузе. Ребёнок, которого она хранит, — живёт.',
  'taskmasterxunseen':
    'Вы храните чеки за всё, что делаете, словно любовь — это аудит. Изнутри созвездие похоже на книгу учёта, которая всегда должна сходиться: услуги записаны, усилия задокументированы, жертвы подшиты в активы — на случай, если кто-то спросит, чего вы стоите. Ребёнок внизу узнал, что замечают через полезность — видят за то, что вы делаете, а не за то, кто вы, — и часть вас поклялась вести книги безупречно. Фирменная петля: вы даёте, вы записываете, вы тихо надеетесь, что на этот раз кто-то прочтёт учёт, не будучи спрошенным; этого почти не случается, потому что никто не знал о его существовании. Обида капает процентами в валюте, которую никто не тратит. Выход — одна запись, произнесённая вслух вместо учтённой: расскажите безопасному человеку о том, что сделали просто потому, что хотели, — без счёта на оплату. Посмотрите, что станет с ценностью, когда перестанет быть бухгалтерией. Вы никогда не были строкой расходов.',
  // inner_critic
  'inner_criticxabandoned':
    'Вы выносите себе приговор первым, прежде чем кто-то успеет уйти. Изнутри это ощущается как постоянная линия защиты в суде на одного: критик сканирует ваши слова, лицо, паузы и осуждает за преступление, которого, как он боится, другие уже готовят. Логика древняя: если накажу себя первым, их уход хотя бы будет обоснован, ожидаем, переживаем. Ребёнок однажды связал уход с собственной виной — и часть вас поклялась больше не быть застигнутой врасплох. Фирменная петля: близость растёт, критик усиливается, самоатака становится собственной причиной отстраниться — и предсказанный вами уход наступает: руками же вашими, а списывается на судьбу. Выход — поймать один вердикт на середине фразы и задать критику один вопрос: «Чего ты боишься, если промолчишь?» Он отвечает всегда — на языке того давнего ухода. Поблагодарите. Потом сделайте это — без приговора.',
  'inner_criticxashamed':
    'Вы ведёте допрос самому себе каждый день, чтобы вердикт никогда не оказался сюрпризом. Изнутри это похоже на основательность, даже честность: разве порядочный человек не ревизует себя? Но у этого суда есть особенность: адвокат никогда не приходит. Ребёнок внизу впитал вердикт «дефектен» раньше, чем обрёл язык, чтобы его оспорить, — и часть вас забрала прокуратуру себе, чтобы процесс шёл внутри, где хотя бы вы назначаете заседания. Фирменная петля: поднимается стыд, критик упреждает его детальным самообвинением, предупреждение ранит не меньше оригинала — и весь цикл принимают за смирение или самосознание. Это ни то ни другое. Это рана, которая наносит раны. Выход — один допрос отклонить: в следующий раз, услышав вступительную речь («ты всегда…»), положите ладонь на грудь и скажите: «Я замечаю часть, которая обвиняет». Не оправдание — просто перенос процесса. Вердикт написали до того, как появились доказательства.',
  'inner_criticxfrightened':
    'Каждая ошибка пересматривается в три часа ночи судьёй, который не объявляет перерыва. Изнутри это похоже на бдительность в мантии: критик верит, что если разобрать каждый промах достаточно дотошно, будущих можно предотвратить — а с ними и катастрофы, которые когда-то приносили промахи. Где-то в вашей истории маленькая ошибка имела огромные последствия — насмешку, ярость, хлопнувшую дверь — и часть вас построила ночной суд, чтобы ничто такое больше не проскользнуло. Фирменная петля: ошибка случается, дневной суд закрывается, и ночное заседание открывается в ту минуту, когда голова касается подушки, воспроизводя показания, которые вы и так знаете наизусть. Вы просыпаетесь уставшим и ещё сильнее боитесь ошибиться — что увеличивает шансы ошибки и пополняет доклад. Выход процедурный: когда открывается ночное заседание, назовите его — «суд собрался», — встаньте, выпейте воды, запишите вердикт и закройте тетрадь. Судам нужен перерыв. Вам тоже.',
  'inner_criticxunseen':
    'Вы расписываете себя в примечания, чтобы другим не пришлось. Изнутри это похоже на полезную самоиронию: если я первый укажу на свои изъяны, остроумно, до других, — никто не сможет ранить меня ими. Ребёнок внизу узнал, что быть видимым опасно: замеченный значило раскритикованный, выделяющийся значил одинокий, — и часть вас выбрала поля как самую безопасную страницу для жизни. Фирменная петля: вы уменьшаете себя заранее, комната оценивает вас по вашей же оценке, малость болит — и боль подшивается как доказательство для дальнейшего уменьшения. Каждая самоуничижительная шутка — камешек, вынутый из вашей же стены. Выход — одно предложение без примечания: следующее достижение, мнение или просто присутствие, предложенное без сноски, без «да ерунда», без упреждающей скидки. Пусть стоит в основном тексте, крупным шрифтом. Части, прятавшие вас, защищали от глаз, которые давно читают иначе.',
  // pleaser
  'pleaserxabandoned':
    'Вы поддерживаете огонь в каждом, чтобы никто не заметил — и не покинул — тот, что тихо гаснет внутри вас. Изнутри это похоже на любовь — и частично так и есть: часть вас искренне радуется заботе. Но ниже течёт старый контракт, подписанный ребёнком, который узнал: люди остаются, когда ты полезен и тёпл, и уходят, когда у тебя есть нужды. Поэтому забота не прекращается, а нежность всегда направлена наружу. Фирменная петля: вы даёте — они остаются — вы заключаете, что сработало, — и даёте ещё, пока собственные предпочтения не атрофируются от неиспользования, и даже вопрос «чего хочу я?» не возвращает помехи. Истощает не отдача; истощает наблюдение — постоянный замер температуры всех, кроме себя. Выход мал и ужасен: объявить одну свою договорённость на этой неделе — ресторан, фильм, «да», которое что-то стоит, — безопасному человеку и остаться в комнате, пока вас просто обслуживают. Ваш огонь никогда не был предназначен один отапливать всю деревню.',
  'pleaserxashamed':
    'Вы выращиваете извинения там, где другие выросили бы претензии. Изнутри это ощущается как лёгкость в общении, нетребовательность, доброта — и это одиноко способом, у которого нет законной жалобы для подачи. Ребёнок внизу впитал стыд за громкое существование: нужды считались обузой, злость — предательством, и часть вас научилась компостировать каждую обиду в извинение прежде, чем она коснётся воздуха. Фирменная петля: что-то болит — извинение прорастает первым («прости, я, наверное, слишком чувствительный»), боль остаётся безымянной, стыд получает полив, и в следующий раз росток выходит быстрее. А почва, между тем, не выращивает ничего просто и определённо вашего. Выход — одно неоконвертированное семя: следующую малую боль назвать обычным предложением без «извините» впереди. «Это было обидно» — законченное предложение. Посмотрите, как небо не падает. Садовник внутри защищал ребёнка, которому не позволяли ничего нуждаться. Тому ребёнку что-то было нужно. В этом не было стыда.',
  'pleaserxfrightened':
    'Вы успокаиваете комнату раньше, чем успеваете понять, что чувствуете сами. Изнутри это похоже на шестое чувство: перемена в чьём-то тоне, сжатая челюсть за столом — и ваша нервная система регистрирует это раньше разума, уже разворачивая теплоту, шутки, доливки, услуги. Ребёнок внизу рос в погоде, менявшейся без предупреждения, — во взрослом, чьи настроения заполняли весь дом, — и часть вас стала громоотводом, поглощающим напряжение, чтобы гроза не ударила. Фирменная петля: появляется напряжение — вы его разряжаете — приходит облегчение, и цена пропускается целиком: ваше чувство, каким бы оно ни было, не названо, потому что чрезвычайная ситуация всегда первая. За годы вы становитесь чужаком собственной погоды. Выход — один удар задержки: в следующий раз, когда комната напряжётся, сделайте паузу — физически, заметно — и спросите себя «что я сейчас чувствую?», прежде чем делать хоть что-то. Гроза, которую вы разряжаете, редко была вашей. Ваши чувства не были причиной ничьей погоды.',
  'pleaserxunseen':
    'Ваше «да» звучит так быстро, что ваши желания не успевают дойти до стола. Изнутри это похоже на щедрость с проблемой задержки: к моменту, когда вы, возможно, хотели бы другого, момент уже согласован и отдан. Ребёнок внизу узнал, что значимость условна — вы считались, когда были удобны, — и часть вас упростила всё «я» в один беспроблемный слог — «да». Фирменная петля: приходит просьба, «да» срабатывает автоматически, короткое одобрение приземляется, и где-то в задержке после всплывает слабый сигнал — «на самом деле…» — который вежливо хоронится снова, ведь отменять теперь было бы посягательством. Каждый похороненный сигнал притупляет следующий. Выход — более медленное «да»: один раз на этой неделе ответьте «дайте мне проверить, вернусь с ответом» — и используйте паузу, чтобы обнаружить одну честную договорённость, даже маленькую. «Да» — не запасной выход. Ваши желания не опоздали; им просто не давали стула.',
  // controller
  'controllerxabandoned':
    'Если ничего не меняется и никто не входит — никто и не уйдёт. Изнутри это похоже почти на покой: устоявшуюся тишину жизни, из которой убраны переменные. Ребёнок внизу пережил уход, пришедший через дверь, которую открыл кто-то другой: настроение родителя, переезд, предательство без предупреждения. И часть вас стала слесарем, запирающим каждую дверь, через которую мог войти перемены. Фирменная петля: приближается новизна — человек, шанс, поездка, — замки срабатывают, новизна отступает, и отступление заносится как доказательство, что открытость кончается потерей, — и болты идут глубже. Дом становится тише, безопаснее и пустее, а пустота переименовывается в спокойствие. Выход — одна дверь, слегка отпертая: принять одно малое изменение на этой неделе — новый маршрут, новое кафе, гостя на чай — и отследить, что произойдёт на самом деле. Часть не неправа, что потеря существует. Она неправа, что запертые двери её останавливают. Потеря проходит сквозь стены; сквозь них же проходит жизнь.',
  'controllerxashamed':
    'Вы инспектируете свою жизнь до состояния, безупречного настолько, чтобы её можно было показать. Изнутри это похоже на стандарты и даже гордость: тест в белой перчатке сдан, полки себя выстроены для аудитории, которая всегда вот-вот придёт и никогда не удовлетворена. Ребёнок внизу узнал, что быть видимым значило быть судимым — и что суд, может быть, можно пережить, если сначала всё сделать идеальным. Часть вас стала инспектором, проводя затянутым пальцем по каждой поверхности ваших выборов, дома, слов. Фирменная петля: инспекция находит пыль, пыль подтверждает стыд, стыд требует более глубокой уборки — и планка поднимается ещё на ступень за пределы человеческой досягаемости. Гости же, ради которых всё это, давно не приглашаются: сначала дом должен стать безупречным, а он не становится. Выход — один отпечаток пальца, оставленный намеренно: пусть один безопасный человек увидит что-то несовершенное на этой неделе — недоделанный проект, беспорядок на кухне. Гостем всё это время были вы — ждущий за собственной дверью.',
  'controllerxfrightened':
    'Вы держите каждую мелочь под контролем, потому что море однажды вас поглотило. Изнутри это похоже на компетентность под давлением: маршруты просчитаны, непредвиденные сценарии отмечены, каждый пассажир переписан дважды. Дар настоящий — вы действительно хороши у штурвала. Но управление — не о навыке; оно о том рейсе давным-давно, когда никто не рулил, когда события просто случались с вами — и вода сомкнулась. Часть вас поклялась: пока она у колеса, лодку никогда больше не захлестнёт. Фирменная петля: контроль работает, напряжение спадает — и любая незапланированная волна: задержка, объезд, чья-то свободная воля, — читается как поднимающееся море, и хватка затягивается за комфорт, в побелевшие костяшки. Усилие постоянного руления стоит дороже большинства штормов. Выход — одна доверенная верёвка: отдать кому-то малое навигационное решение — маршрут, ресторан, плейлист — и почувствовать, как колесо вращается под вашими ладонями без вас. Море, поглотившее вас, было настоящим. Но не это — и плавать вы теперь умеете.',
  'controllerxunseen':
    'Вы педантично упорядочиваете мир, а себя заносите в раздел «прочее». Изнутри это выглядит как дар в действии: системы, ярлыки, порядок — ум, делающий хаос читаемым. И это дар. Но взгляните на картотеку внимания: у каждого проекта, человека, обязательства есть цветная папка, а где-то сзади тонкая манила «прочее», куда идёт ваша собственная жизнь. Ребёнок внизу узнал, что внимание достаётся предметам, достижениям, договорённостям — но не тому, кто их устраивает, — и часть вас держала мир столь безупречно отсортированным, что никому и не нужно было смотреть на сортировщика. Фирменная петля: вы систематизируете, другие получают пользу, благодарность достаётся системе — а «я» за ней отступает на папку глубже. Выход — перекатегоризация: возьмите один факт о себе — желание, боль, любопытство — и поместите в активные проекты, и один раз на этой неделе действуйте в соответствии с ним. Вы никогда не были клерком собственной жизни. Вы её автор.',
  // analyst
  'analystxabandoned':
    'Вы решаете задачу о близости с безопасного расстояния, где она не может ранить. Изнутри это похоже на ясность: пока другие барахаются в чувствах, у вас есть модели, рамки, объяснения — длинное уравнение, которое, будь оно наконец решено, выдало бы любовь без риска. Ребёнок внизу потянулся к кому-то — и встретил отсутствие или растерянность, и часть вас заключила, что тянуться — переменная, которую лучше исключить. Тяга превратилась в исследование: наблюдать, гипотезировать, анализировать людей, по которым вы тоскуете, вместо того чтобы присоединяться к ним. Фирменная петля: близость начинается, вы переходите в режим изучения, изучение создаёт ту дистанцию, от которой должно было защитить, — и итоговое одиночество поставляет новые данные о сложности связи. Уравнение растёт и не сходится. Выход — один нерешённый момент: скажите безопасному человеку «я скучаю» — без анализа, без почему, без сноски. Интеллект здесь не злодей; он блестящий переводчик, забывший исходный язык. Любовь не нужно решать. Её можно просто говорить.',
  'analystxashamed':
    'Вы изучаете свои изъяны с клинической заботой, чтобы они стали данными, а не ранами. Изнутри это ощущается как строгое самопознание: вы знаете свои паттерны лучше всех, можете рассказать историю чистыми абзацами, предсказать свою дисфункцию до десятой. Ребёнку внизу вручили вердикт «дефектен» — и часть вас открыла: препарат на предметном стекле болит меньше, чем «я» в мире — закреплённый, снабжённый этикеткой, изученный, рана становится находкой. Фирменная петля: поднимается стыд, включается анализ, чувство конвертируется в таксономию, дистанция даёт облегчение — и странную новую вину: за то, что вы делаете это вместо жизни. Инсайты накапливаются; контакты — нет. Досье толстеет; человек худеет. Выход — одна незаписанная запись: в следующий раз, поймав себя на анализе боли, отложите ручку и скажите только «это болит» — без дистанции, без ярлыка. Чувства усваиваются чувствами, а не сносками. Вы никогда не были исследователем. Вы были тем, кого исследование защищало.',
  'analystxfrightened':
    'Из-за стекла вы картографируете бурю с безупречной точностью — сухой, нетронутой и одинокой. Изнутри это похоже на безопасность с видом: обсерватория с климат-контролем, приборы превосходны, и вы способны назвать барометрическое давление любой эмоциональной системы в комнате. Ребёнок внизу пережил погоду, разрушавшую вещи, — ярость, хаос, непредсказуемость, — и часть вас установила стекло, рассчитав: метеоролога молния не бьёт. И была права — какое-то время. Фирменная петля: приближается интенсивность, вы поднимаетесь на наблюдательную палубу, буря проходит нетронутой, стекло держит — но держит и дистанцию, и тепло каждого собрания доходит до вас как информация, а не опыт. Идеально сухой, идеально осведомлённый, идеально одинокий. Выход — один отпечаток на стекле: шагните в малую, переносимую бурю — лёгкий конфликт, момент выраженного чувства — и останьтесь в ней, не рассказывая о ней. Прогноз никогда не был ошибочен. Но жить на палубе вы не были предназначены.',
  'analystxunseen':
    'Вы смотрите на жизнь через стекло, с отличным видом на собственное отсутствие. Изнутри это похоже на перспективу: вы понимаете группу, динамику, всю архитектуру каждой комнаты — с возвышения, на которое никому не приходит взгляд поднять. Ребёнок внизу узнал, что присутствие не вознаграждается и не замечается, — и часть вас превратила невидимость в дисциплину: тому, кто видит всё, не обязательно быть видимым. Палуба стала и укрытием, и идентичностью. Фирменная петля: вы анализируете сцену, анализ точен, точность остаётся неозвученной или без подписи — и ваше отсутствие в кадре подтверждается как естественный порядок: наблюдателя в кадре нет. Приходит одиночество — и тут же анализируется. Выход — один вход в кадр: на этой неделе дайте одно наблюдение вслух, от первого лица — «я думаю…», «мне понравилось…» — и пусть оно будет вашим, подписанным, видимым. Палуба подождёт. Вид, который вам на самом деле нужен, включает вас.',
  // hermit
  'hermitxabandoned':
    'Вы оставляете одну лампу для гостя, который никак не приходит, — для себя самого. Изнутри это похоже на самодостаточность со слабой ровной болью: дом тих, вечер ваш — и всё же одна лампа всегда горит у окна, свет ложится на дорогу, по которой никто не идёт. Ребёнок внизу ждал того, кто не вернулся или вернулся недостаточно, — и часть вас выстроила жизнь, где ожидание больше не унизительно, а лишь привычно. Фирменная петля: уединение успокаивает — потом изолирует; изоляция болит; боль говорит: потянись; но однажды потянуться было так рискованно, что часть предпочитает лампу двери. И лампа горит десятилетиями. Выход — поменять адресата света: один вечер на этой неделе сядьте в круг лампы сами — хорошая еда, тёплый плед, без экрана — как гость, которого держали в ожидании. Отшельник не неправ, что вы можете быть себе хорошей компанией. Он лишь забыл вручить приглашение.',
  'hermitxashamed':
    'Вы закрываете ставни прежде, чем кто-то успеет заглянуть. Изнутри это похоже на скромность, вкус или просто тягу к тишине — и настоящая тяга там тоже есть. Но присмотритесь к таймингу: ставни закрываются не когда вы устали; они закрываются, когда приближается возможность быть увиденным. Ребёнка внизу смотрели так, что обжигало, — оценивали, высмеивали, использовали, — и часть вас уяснила: окна — это уязвимости. Лучше полумрак внутри, чем обнажающий свет. Фирменная петля: близость приближается, ставни захлопываются, человек снаружи читает закрытость как незаинтересованность и отходит — и уход заносится как доказательство, что раскрытие кончилось бы хуже. Дом становится безопасным и тёмным. Выход — одна ставня, приоткрытая ненадолго: поделитесь одной маленькой правдой — фото, мнением, рассказом о плохом дне — с человеком, проверенным на мягкость, потом закрывайте снова, если нужно. «Увиденный» не обязано значит «обожжённый». Некоторый свет — это просто утро.',
  'hermitxfrightened':
    'За высокой стеной всё тихо, и ничто не может вас достать. Изнутри это похоже на заслуженный мир: после лет непредсказуемой погоды — гнева, хаоса, осадных требований — вы сами построили эти стены, камень за камнем, и сад внутри них действительно цветёт. Ребёнку внизу эти стены были нужны; без них, возможно, не было бы вас, читающего это. Фирменная петля: мир стучит — приглашение, новость, голос у ворот — стены работают, стук прекращается, и наступающая тишина — одновременно облегчение и медленное голодание. «Приглушённое» становится неотличимо от «пустого». Выход — не снос, а калитка: одно запланированное открытие, низкорисковое, ограниченное по времени — прогулка среди незнакомцев, короткий звонок, отправленное письмо, — после которого можно закрыть свободно. Стены с калиткой — дом; стены без неё — донжон, который вы сторожите для узника. Садовник внутри вырастил всю эту красоту. Часть её всегда была предназначена для раздачи.',
  'hermitxunseen':
    'В вашей богатой внутренней библиотеке нет лампы для гостей. Изнутри это похоже на глубину: полки и полки мысли, чувства, памяти, любопытно каталогизированные — ум, которым гости восхитились бы, если бы когда-нибудь вошли. Ребёнок внизу узнал, что показанное не принимали: интерес встречали пустотой, чувства — сменой темы, — и часть вас перевезла всю коллекцию внутрь и заперла кабинет. Фирменная петля: кто-то приближается, вы предлагаете корешки светской болтовни, человек полистывает и уходит — и вывод подтверждается: коллекция никому не нужна. Но её никому и не показывали. Выход — одна книга, оставленная раскрытой на столе: поделитесь одной конкретной страстью или трепетной мыслью с кем-то на этой неделе — не всей библиотекой, одним томом — и посмотрите, что будет, когда его действительно прочтут. «Незамеченный» — не то же, что «незамечаемый». Часть, запершая кабинет, приняла сегодняшнюю аудиторию за ту, давнишнюю. Новые читатели существуют. Им просто нужна лампа.',
  // bypasser
  'bypasserxabandoned':
    'Вы так быстро воспаряете над болью, что она не успевает ничего сказать. Изнутри это похоже на стойкость и даже мудрость: где другие тонут, вы парите; вы находите урок, рост, высший смысл — обычно за минуты. Ребёнок внизу обнаружил, что у боли утраты не было свидетеля — и часть вас вырастила крылья, а с высоты даже покинутость кажется малой, как город с борта самолёта. Фирменная петля: поднимается боль, начинается взлёт, невозмутимость прибывает по расписанию — а неуслышанная боль, терпеливая, неторопливая, ждёт внизу и остаётся навсегда, становясь низким гулом, который вы со временем принимаете за свою личность. Высота — не исцеление; высота — дистанция. Выход — управляемый спуск: один раз на этой неделе, когда начнётся подъём, останьтесь на уровне земли на пять минут — стопы в пол, ладонь на сердце — и позвольте боли сказать вам своё единственное предложение напрямую. Урок вы уже знаете. Оно хотело быть услышанным — а не преподаваться.',
  'bypasserxashamed':
    'Вы вставляете рану в витраж, пока она не станет похожа на урок. Изнутри это похоже на алхимию: боль входит, смысл выходит, и роза, которую вы собираете из осколков, действительно прекрасна. Ребёнку внизу вручили стыд без всякой возможности облегчения — извинения не пришло, свидетеля не нашлось — и часть вас научилась выживать, осветляя: если рана священна, она не может быть позорной. Фирменная петля: стыд жалит, начинается оформление — список благодарностей, «всё не просто так», серебряная кромка, отполированная до блеска, — и укол преображается раньше, чем его почувствуют. Но неужаленный стыд не растворяется; он просто заключён в витраж, и стекло требует постоянного ухода. Выход — одна рама, оставленная простой: в следующий раз, когда начнётся оформление, сделайте паузу и скажите непреображённую версию — «это было просто больно, и это ранило меня» — себе или безопасному человеку. Духовность, перепрыгивающая рану, — декорация. Свет проходит в любом случае; он предпочитает честное стекло.',
  'bypasserxfrightened':
    'Вы парите над опасностью по мосту, построенному из осознаний. Изнутри это похоже на мастерство: внизу клубится страх — старый, конкретный, телесный, — а вы пересекаете его по доскам понимания: каждая — инсайт, рамка, название того, что с вами случилось. Ребёнок внизу столкнулся с тем, из чего не было выхода на уровне земли, — и часть вас открыла: сознание плавает. Пойми страх достаточно полно — и ты почему-то над ним. Фирменная петля: страх поднимается, разворачивается мост из инсайтов, переход ощущается победой, — но у моста есть свойство, о котором не говорят: он только нависает и никогда не заканчивается берегом. Вы переходите и переходите и остаётесь подвешенным, сжимая понимание, пока земля, где происходит жизнь, остаётся внизу, недосягаемой. Выход — один намеренный шаг на твёрдую землю: сделайте на этой неделе одно малое, запрещённое страхом дело — без анализа до или после. Осознание должно быть мостом, а не резиденцией. Тот берег всё это время ждал.',
  'bypasserxunseen':
    'Вы держите погоду золотой, чтобы никто не спросил о зиме под ней. Изнутри это похоже на то, что вы — хорошее присутствие в жизни других: позитивный, философский, тот, кто поднимает комнату. И это работает — рядом с вами людям легче. Но у бесконечного лета есть регламент обслуживания: зимы нужно прятать в момент дрейфа, потому что однажды ребёнок узнал — с трудными чувствами люди отдаляются, и яркость была ценой компании. Часть вас стала регулятором климата. Фирменная петля: кто-то спрашивает «как ты на самом деле?», золотой ответ срабатывает по расписанию, момент проходит — а зима внизу удлиняется ещё на сезон, иней подползает к фундаменту, который никто не инспектирует. Выход — одна малая поправка прогноза, безопасная: расскажите одному доверенному человеку об одном по-настоящему холодном дне этой недели — просто, без превращения в урок. Вас любили за ваш свет — да. Вы любимы в любую вашу погоду.',
  // numb
  'numbxabandoned':
    'Поезд чувств перестал приходить, но вы всё равно протапливаете станцию. Изнутри это похоже на компетентность в ровности: вы функционируете — работа, дела, разговоры, даже забота, — а внутри платформа, куда когда-то прибывали эмоции, тихо стоит под серым табло. Когда-то чувства приносили новости, что слишком болели: о тех, кто ушёл, об уходах, не прекращавшихся. И часть вас, мудрее расписания, перерезала линию — потому что ребёнок, который чувствует всё о покинутости, не может продолжать стоять. Оцепенение — не отсутствие; это милосердие, вводимое постоянно. Фирменная петля: на рельсах появляется отблеск чувства, часть переключает стрелку, отблеск проходит без остановки, и станция записывает ещё один тихий день — доказательство, что система работает; счёт не выставляется. Выход — не форсировать прибытие: одна укутанная минута на платформе, ежедневно, с вопросом «что присутствует хотя бы на один процент?» — и приветствие тому, что прихрамывает. Линию перерезали не зря. Некоторые поезда всё же идут. Вы теперь начальник станции.',
  'numbxashamed':
    'Помехи заполняют эфир там, где стыд вёл бы трансляцию. Изнутри это не ощущается никак — что и есть замысел. Там, где другие вздрагивают и вспыхивают, вы слышите мягкий серый шип: решения становятся произвольными, зеркала — мебелью, а вопрос «что ты по этому поводу чувствуешь?» возвращает шум канала. Когда-то стыд вещал на полную мощность, и никто не убавил громкость за ребёнка на приёме, — и часть вас стала инженером и глушила частоту целиком. Лучше помехи, чем тот сигнал. Фирменная петля: возникает ситуация, которая должна регистрироваться, — похвала, оскорбление, близость, — помехи держатся, вы отвечаете процедурой, а не чувством, и ровность читается другими как выдержка, хотя является наркозом. Выход — один канал, кратко расшифрованный, намеренно: после момента, который что-то значил, напишите одно слово, верное хотя бы на тридцать процентов — «не так», «мал», «обнажён» — не требуя полной трансляции. Помехи были защитой, не личностью. По слову за раз сигнал возвращается.',
  'numbxfrightened':
    'Вы становитесь настолько спокойными, что засыпает сама тревога. Изнутри это похоже на несокрушимость: кризис приходит, все паникуют — а вы движетесь сквозь него ровно, эффективно, почти скучая. Люди восхищаются. Они не видят механизма: когда-то страх был бесполезен — ребёнок не мог ни бежать, ни бить, ни сделать ничего, кроме как терпеть, — и часть вас научилась вводить анестезию стоячей воды по требованию. Спокойствие — не мир; это упреждающая седация, применяемая в момент, когда вода могла бы всколыхнуться. Фирменная петля: приближается нечто пугающее, неподвижность вливается автоматически, вы обрабатываете всё и не регистрируете ничего, потом следующее, и следующее, — а неощущаемый страх копится в теле как бессонница, челюсть, кишечник, гул холостого хода, до которого никакое спокойствие не добирается. Выход — одна разрешённая рябь: в по-настоящему безопасный момент сделайте что-то малое, всколыхнувшее воду намеренно — фильм, который может растрогать, музыка громко в машине — и дайте глазам защипать, не отключая. Выбранное спокойствие — сила. Навязанное — просто усыплённый страх.',
  'numbxunseen':
    'Вы идёте по собственной жизни, укутанные в вату. Изнутри это мягкое, туманное продолжение: дни проходят, нужды удовлетворяются на минимально жизнеспособном уровне, и ничто вас по-настоящему не касается — включая то, что должно было бы. Вату намотали заботливо, давно, часть вас, защищавшая ребёнка, для которого незамечаемость длилась так долго, что боль её стало невыносимо чувствовать. Оцепенение к незамеченному — оцепенение ко всему; анестезия не избирательна. Фирменная петля: жизнь предлагает момент, который мог бы отозваться, — красоту, нежность, достижение, — вата глушит его до слуха, момент проходит не встреченным, и ровность не даёт ни данных, ни предпочтения, ни тяги в какую-либо сторону — и ходьба продолжается по инерции. Выход — один открытый кончик пальца: раз в день выбирайте одну сенсорную вещь — первый глоток кофе, воду на лице, солнце на запястье — и отдавайте ей тридцать неразделённых секунд. Чувство возвращается через тело раньше, чем через ум. Начните с краёв.',
  // rebel
  'rebelxabandoned':
    'Вы уходите первыми — громко, — чтобы уход хотя бы был вашим. Изнутри это похоже на силу и даже достоинство: пока другие цепляются и умоляют, вы захлопываете двери по собственному расписанию, собственной рукой, прежде чем кто-то сделает это с вами. Когда-то ребёнка бросили — тихо, сокрушительно, без церемоний, — и часть вас поклялась никогда больше не быть тем, кто стоит у окна. Если уход неизбежен, бунтарь хотя бы станет его автором. Фирменная петля: близость углубляется, часть сканирует пространство на первый признак отстранения, находит его — что угодно читается как отстранение, если постараться, — и подрывает связь упреждающе: ссорой, сценой, эффектным жестом. Последствия болезненны, но это боль с подписью. Выход — один отменённый уход: в следующий раз, придя в движение, скажите вслух — человеку или себе: «часть меня хочет сбежать прямо сейчас» — и останьтесь ещё на десять минут. Часть не неправа, что уходы случаются. Она просто всё время назначает вас уходящим.',
  'rebelxashamed':
    'Вы поднимаете собственные цвета над раной, которую так и не назвали. Изнутри это похоже на неповиновение с флагом: правила отвергнуты, ожидания отклонены, стиль прохода через мир, говорящий «я никому не подчиняюсь». И это по-настоящему живо — но вслушайтесь, на что отвечает вызов. Внизу ребёнок, которому в тысяче малых способов сказали, что он неприемлем; и часть вас выбрала вне-законность вместо уничтожения: если нельзя быть хорошим, буду бросающимся в глаза. Стыд так и не назвали, потому что назвать — значило признать, что вердикт попал в цель. Фирменная петля: мелькает намёк на осуждение, цвета взлетают на флагшток — громче, дерзче, непримиримее, — осуждённость конвертируется в энергию, и рана внизу получает ещё слой флажной ткани вместо взгляда. Выход — один тихий момент без флага: наедине допишите предложение «мне на самом деле было стыдно за…» — пусть будет мало, правдиво, без свидетелей. Вызов — броня раны. Раной никогда не были вы.',
  'rebelxfrightened':
    'Вы бросаетесь в драку, потому что неподвижность однажды означала удар. Изнутри это похоже на готовность: мир — комната с выходами для наблюдения, и вы следите за всеми, челюсть сжата, первый ход всегда ваш. Спокойные кажутся либо смелыми, либо наивными. Когда-то ребёнок выучил физику опасности: пауза перед ударом переносима, лишь если заполнить её собственной бурей — атакой, шумом, упреждением. Часть вас несёт эту физику в комнаты, откуда удар не идёт. Фирменная петля: регистрируется намёк на угрозу — критическая интонация, закрытая дверь, сюрприз, — удар срабатывает раньше мысли, момент эскалирует, и эскалация подтверждает враждебность мира, перевооружая часть к следующему раунду. Вы выигрываете драки, которые вам не были нужны. Выход — один вдох, вставленный между сигналом и ударом: когда готовность вспыхивает, поставьте обе стопы, выдохните раз и спросите: «меня сейчас правда кто-то бьёт?» Обычно, честно: нет. Часть провожала вас через настоящие войны. Война переехала. Ей тоже можно.',
  'rebelxunseen':
    'Вы горите громко и ярко в каждом небе, моля, чтобы кто-нибудь наконец прочитал послание: я здесь. Изнутри это похоже на жизненную силу — вы самый громкий смех, самая дикая история, тот, вокруг кого вращается комната, — и это настоящая энергия, настоящее присутствие. Но проследите до фитиля: ребёнок стоял в комнате, полной людей, и не был увиден — ни разу, ни капли, — пока заметность не стала вопросом выживания. Часть вас усвоила: обычное присутствие не работает, регистрируются только сигнальные ракеты. Фирменная петля: поднимается потребность быть увиденным, ракета уходит вверх — драма, провокация, «чересчур», — головы поворачиваются, внимание ложится на минуту — и гаснет, потому что ракеты сгорают; и часть читает угасающий свет как доказательство, что следующая должна быть больше. Выход — один незажжённый сигнал: попросите у безопасного человека внимание прямым текстом — «мне нужно время; можем поговорить?» — и примите его без представления. Ракета говорила: я здесь. Спокойный голос умеет то же. И летит дальше.',
  // charmer
  'charmerxabandoned':
    'Вы окружаете себя зеркалами, чтобы комната никогда не была пустой. Изнутри это похоже на социальный избыток: на каждом собрании звучит ваш смех, каждая пауза заполняется, каждый незнакомец уходит вашим поклонником. Зеркала — это люди: каждое отражает вас ярким, вовлечённым, восхищённым — и при достаточном их числе, расставленном грамотно, одиночество архитектурно невозможно. Почти. Когда-то ребёнок остался один в отражающей тишине — и часть вас поклялась меблировать каждую комнату отражениями, чтобы пустота не могла собраться заново. Фирменная петля: комната наполняется, отражения множатся, покинутость кажется обогнанной — до конца вечеринки, где внезапное исчезновение зеркал больнее тихого вечера, подтверждая посыл части: без аудитории — пустота. И следующая встреча назначается до закрытия текущей. Выход — один вечер без зеркал, намеренно: в одиночестве, без экрана, за занятием, которое вам искренне нравится, оставаясь в тишине, пока она не станет просто тишиной. Часть наполняла комнату, защищая вас. Тот, кого защищали, умеет быть без аплодисментов.',
  'charmerxashamed':
    'Представление настолько яркое, что никто не проверяет, что за ним. Изнутри это похоже на умение быть с людьми — остроумный, тёплый, невозможный чтобы не полюбить — и это настоящий дар, честно держимый. Но обратите внимание на свет: прожектор всегда стоит прямо на маске, потому что где-то за кулисами ребёнок, которому дали понять, что непоставленное «я» потерпят не будет. Обаяние стало костюмом, который стыд надевает на вечеринку. Фирменная петля: близость приближается, представление масштабируется — смешнее, теплее, сильнее, — человек смеётся вместе с персонажем, связь ложится на маску и остаётся там, что часть засчитывает как безопасность, пока тот, кто за маской, голодает в сиянии. Обожание — не то же, что узнанность. Выход — одна сцена, сыгранная вживую: с человеком, проверенно мягким, снимите номер на десять минут — говорите медленно, просто, о настоящем — и останьтесь в комнате, будучи непримечательным. Маска была сценическим приёмом ребёнка в опасности. Опасность покинула театр.',
  'charmerxfrightened':
    'Вы уходите со сцены под залп конфетти. Изнутри это похоже на стиль: когда обстановка накаляется, вы выдаёте идеальную шутку, ослепительный разворот, внезапные планы в другом месте — и миг, начавший смыкаться, исчезает в блёстках. Когда-то ребёнок столкнулся с опасностью, не имевшей парадного выхода, — комната, взрослый, гнев, — и открыл люк харизмы: будь достаточно очарователен — и опасность растеряется; будь достаточно быстро в другом месте — и она промахнётся. Часть вас запускала этот выход с тех пор. Фирменная петля: поднимается дискомфорт, срабатывает конфетти-пушка — флирт, представление, эффектный уход, — напряжение разряжается, приходит облегчение — а непрожитое остаётся, ожидая следующего сбора с процентами. Каждая комната со временем становится сценой для побега. Выход — один отменённый выход: в следующий раз, когда пушка заряжается, останьтесь на месте — почувствуйте напряжение, оставьте шутку несказанной, посмотрите, что сделает момент, когда вы в нём останетесь. Блеск был запасным выходом. Теперь можно через парадную дверь.',
  'charmerxunseen':
    'Вы собираете аплодисменты, как чеки за «я», с которым никто по-настоящему не встретился. Изнутри это похоже на успех в человеческом деле: комнаты загораются при вашем появлении, смех приходит по расписанию, архив тёплых реакций по-настоящему обширен. Но рассмотрите чеки: что именно аплодировали? Представление — обаяние, истории, блеск. И чем была оплачена такая теплота? Когда-то ребёнок заключил, что «я» без украшений оставаться рядом не стоит — что покажут только шоу, — и часть с тех пор ставит его, подшивая каждую овацию как доказательство по делу, которое никогда не закрывается. Фирменная петля: аплодисменты приземляются, чек подшивается, теплота длится ровно столько, сколько шоу, — и тот, кто за занавесом, возвращается домой не встреченным, держа подтверждения любви, которые никогда не ощущаются как узнанность. Выход — один незасчитанный момент: на этой неделе сделайте что-то настоящее с кем-то, будучи просто, непредставленно собой — и заметьте любую теплоту, пришедшую без шоу. Та теплота — не чек. Ей не нужен аудит.',
};

const KEY = (p: string, e: string) => `${p}x${e}`;

export function constellationName(def: ConstellationDef, lang: Lang): string {
  return lang === 'ru' ? RU_NAME[KEY(def.protector, def.exile)] ?? def.name : def.name;
}

/** Long-form essay when available; falls back to the one-line essay. */
export function constellationEssay(def: ConstellationDef, lang: Lang): string {
  const key = KEY(def.protector, def.exile);
  const long = lang === 'ru' ? RU_ESSAY_LONG[key] : EN_ESSAY_LONG[key];
  if (long) return long;
  if (lang === 'ru') return RU_ESSAY[key] ?? def.essay;
  return def.essay === 'Spec-locked.' ? EN_ESSAY_FIXES[key] ?? def.essay : def.essay;
}

export function subtypeName(family: string, slug: string, en: string, lang: Lang): string {
  if (lang !== 'ru') return en;
  const baseId = BASE_OF_FAMILY[family];
  return RU_SUBTYPE[`${family}:${slug}`] ?? (baseId ? PART_NAME_RU[baseId] ?? en : en);
}

/** Resource display names (report strength-first section). */
const RESOURCE_NAME_RU: Record<string, string> = {
  sage: 'Мудрец', warrior: 'Воин', caregiver: 'Заботник', explorer: 'Исследователь',
};
export function resourceName(id: string, lang: Lang): string {
  return lang === 'ru' ? RESOURCE_NAME_RU[id] ?? id : id;
}

/** Russian renderings of the 9 complexes (§1.7). */
export const COMPLEX_COPY_RU: Record<string, { name: string; belief: string; experiment: string }> = {
  abandonment: {
    name: 'Комплекс покинутости',
    belief: 'Я достоин любви, только если удобен и ни о чём не прошу.',
    experiment: 'Откажите в одной маленькой просьбе и останьтесь рядом с дискомфортом, не отключаясь.',
  },
  inferiority: {
    name: 'Комплекс неполноценности',
    belief: 'Я в глубине дефектен; если меня по-настоящему увидят — уйдут.',
    experiment: 'Заметьте одну самоатаку и переименуйте её: «я замечаю мысль, что я недостаточно хорош».',
  },
  power: {
    name: 'Комплекс власти',
    belief: 'Если я отпущу контроль, всё рухнет.',
    experiment: 'Оставьте одно мелкое решение за другим человеком и посмотрите, что произойдёт на самом деле.',
  },
  performance: {
    name: 'Комплекс результативности',
    belief: 'Я не имею права на ошибку; моя ценность — это мой результат.',
    experiment: 'Выпустите одну вещь на уровне «достаточно хорошо» и зафиксируйте, что последовало на самом деле.',
  },
  engulfment: {
    name: 'Комплекс поглощения',
    belief: 'Если я подчинюсь, я исчезну.',
    experiment: 'Найдите на этой неделе одно «да», которое ничего не стоит вам самим, — и подарите его свободно.',
  },
  invisibility: {
    name: 'Комплекс невидимости',
    belief: 'Я никому не принадлежу; я смотрю на жизнь через стекло.',
    experiment: 'Озвучьте одну свою позицию вслух — без повода, человеку, рядом с которым безопасно.',
  },
  vigilance: {
    name: 'Комплекс бдительности',
    belief: 'Опасность всегда рядом; нельзя расслабляться.',
    experiment: 'Поставьте пятиминутный таймер в безопасном месте и опускайте плечи, пока он не прозвенит.',
  },
  unlovability: {
    name: 'Комплекс нелюбимости',
    belief: 'Мои потребности — обуза; любовь нужно заслужить жертвой.',
    experiment: 'Попросите одну мелочь для себя и примите её, не возвращая долг.',
  },
  betrayal: {
    name: 'Комплекс предательства',
    belief: 'Людям нельзя доверять; подпустить кого-то — значит пострадать.',
    experiment: 'Поделитесь одной маленькой правдой с безопасным человеком — и позвольте ей остаться у него.',
  },
};

/** Russian polarization names (§1.4), keyed by the EN name. */
const POLARIZATION_NAME_RU: Record<string, string> = {
  'Grind\u2013Collapse Cycle': 'Цикл «измор — отключка»',
  'Compliance\u2013Explosion Cycle': 'Цикл «подчинение — взрыв»',
  'Clampdown\u2013Breakout Cycle': 'Цикл «зажим — побег»',
  'Freeze\u2013Perform Split': 'Раскол «заморозка — представление»',
  'Shame\u2013Display Split': 'Раскол «стыд — витрина»',
  'White-Knuckle\u2013Checkout Cycle': 'Цикл «на кулаках — в отключку»',
  'Cave\u2013Stage Split': 'Раскол «пещера — сцена»',
  'Halo\u2013Havoc Cycle': 'Цикл «нимб — разгром»',
};
export function polarizationName(en: string, lang: Lang): string {
  return lang === 'ru' ? POLARIZATION_NAME_RU[en] ?? en : en;
}
