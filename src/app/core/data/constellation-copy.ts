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

const KEY = (p: string, e: string) => `${p}x${e}`;

export function constellationName(def: ConstellationDef, lang: Lang): string {
  return lang === 'ru' ? RU_NAME[KEY(def.protector, def.exile)] ?? def.name : def.name;
}

export function constellationEssay(def: ConstellationDef, lang: Lang): string {
  const key = KEY(def.protector, def.exile);
  if (lang === 'ru') return RU_ESSAY[key] ?? def.essay;
  return def.essay === 'Spec-locked.' ? EN_ESSAY_FIXES[key] ?? def.essay : def.essay;
}

export function subtypeName(family: string, slug: string, en: string, lang: Lang): string {
  return lang === 'ru' ? RU_SUBTYPE[`${family}:${slug}`] ?? en : en;
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
