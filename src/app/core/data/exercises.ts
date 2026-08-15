/**
 * INNERVERSE — Exercise library & practice path (REVAMP §3B, §3C.9, §3D.3-5,
 * §3E.8, §3F.5). 22 types, safety-gated. Seeded with one exercise per type
 * (en/ru) to the fixed template: why → steps (OODA-shaped) → stop rule on
 * YELLOW/RED. The copy team expands to ~56 per §3B.2.
 *
 * HARD RULES (tested): RED is therapist-assign only and NEVER appears in solo
 * suggestions; Chapter 5 is unreachable solo; solo surfaces max 1 suggestion
 * per day by selector priority.
 */
import { selfServeGate, type CheckIn } from './state-v2';
import type { ScoredProfile } from './scoring-v2';

export type ExerciseTypeId =
  | 'regulation' | 'unblending' | 'part_dialogue' | 'polarization' | 'firefighter'
  | 'defusion' | 'experiment' | 'somatic' | 'self_energy' | 'resource'
  | 'relational' | 'exile_witness' | 'attribution' | 'horizon'
  | 'prediction_error' | 'polarity' | 'safe_place' | 'harmless_recording'
  | 'metaprocessing' | 'soft_gaze' | 'self_quality' | 'shadow_projection';

export type Gate = 'green' | 'yellow' | 'red';

export interface ExerciseTypeDef {
  id: ExerciseTypeId;
  gate: Gate;
  /** §3D.3 practice-path chapter 1..5. */
  chapter: 1 | 2 | 3 | 4 | 5;
}

export const EXERCISE_TYPES: Record<ExerciseTypeId, ExerciseTypeDef> = {
  regulation: { id: 'regulation', gate: 'green', chapter: 1 },
  self_energy: { id: 'self_energy', gate: 'green', chapter: 1 },
  resource: { id: 'resource', gate: 'green', chapter: 1 },
  safe_place: { id: 'safe_place', gate: 'green', chapter: 1 },
  soft_gaze: { id: 'soft_gaze', gate: 'green', chapter: 1 },
  self_quality: { id: 'self_quality', gate: 'green', chapter: 1 },
  unblending: { id: 'unblending', gate: 'green', chapter: 2 },
  attribution: { id: 'attribution', gate: 'green', chapter: 2 },
  harmless_recording: { id: 'harmless_recording', gate: 'green', chapter: 2 },
  part_dialogue: { id: 'part_dialogue', gate: 'yellow', chapter: 2 },
  metaprocessing: { id: 'metaprocessing', gate: 'green', chapter: 3 },
  polarization: { id: 'polarization', gate: 'yellow', chapter: 3 },
  firefighter: { id: 'firefighter', gate: 'yellow', chapter: 3 },
  defusion: { id: 'defusion', gate: 'yellow', chapter: 3 },
  experiment: { id: 'experiment', gate: 'yellow', chapter: 3 },
  somatic: { id: 'somatic', gate: 'yellow', chapter: 3 },
  polarity: { id: 'polarity', gate: 'yellow', chapter: 3 },
  horizon: { id: 'horizon', gate: 'green', chapter: 3 },
  relational: { id: 'relational', gate: 'yellow', chapter: 4 },
  prediction_error: { id: 'prediction_error', gate: 'yellow', chapter: 4 },
  shadow_projection: { id: 'shadow_projection', gate: 'yellow', chapter: 4 },
  exile_witness: { id: 'exile_witness', gate: 'red', chapter: 5 },
};

export interface Exercise {
  id: string;
  type: ExerciseTypeId;
  title: { en: string; ru: string };
  why: { en: string; ru: string };
  steps: { en: string[]; ru: string[] };
  stopRule?: { en: string; ru: string }; // mandatory on YELLOW/RED
}

const ex = (
  id: string, type: ExerciseTypeId,
  en: [string, string, string[]] | [string, string, string[], string],
  ru: [string, string, string[]] | [string, string, string[], string],
): Exercise => ({
  id, type,
  title: { en: en[0], ru: ru[0] },
  why: { en: en[1], ru: ru[1] },
  steps: { en: en[2], ru: ru[2] },
  stopRule: en.length > 3 ? { en: en[3] as string, ru: ru[3] as string } : undefined,
});

export const EXERCISES: Exercise[] = [
  ex('paced-breath', 'regulation',
    ['Paced breath 4–6', 'Longer out-breath than in-breath tells your body the emergency is over.',
      ['Inhale through the nose for a count of 4.', 'Exhale slowly for a count of 6.', 'Repeat for 10 rounds, letting the shoulders drop each exhale.', 'Name one thing that is easier now.']],
    ['Дыхание 4–6', 'Выдох длиннее вдоха сообщает телу: тревога закончилась.',
      ['Вдох носом на 4 счёта.', 'Медленный выдох на 6 счётов.', 'Повторите 10 кругов, отпуская плечи на каждом выдохе.', 'Назовите одну вещь, которая теперь даётся легче.']]),
  ex('noticing-reframe', 'unblending',
    ['“A part of me…” drill', 'Naming a reaction as “a part of me” creates instant distance — you are not the storm.',
      ['Recall one moment today when a reaction took over.', 'Say it aloud: “A part of me felt…”.', 'Notice: who is watching the part? That one is you.', 'Write one sentence from the watcher’s view.']],
    ['Практика «часть меня»', 'Называние реакции «частью меня» даёт мгновенную дистанцию: вы — не шторм.',
      ['Вспомните момент сегодня, когда реакция захватила руль.', 'Скажите вслух: «Часть меня почувствовала…».', 'Заметьте: кто наблюдает часть? Это и есть вы.', 'Напишите одно предложение от лица наблюдателя.']]),
  ex('six-f-steps', 'part_dialogue',
    ['Six steps toward a protector', 'Protectors soften when they are heard instead of fought. Ask, never interrogate.',
      ['Find the part in your body; focus on it.', 'Flesh it out: shape, temperature, age.', 'Ask: “What is your positive intention for me?”', 'Thank it for its work — out loud.', 'Ask: “What are you afraid would happen if you relaxed?”', 'Write its answer in one sentence.'],
      'If it gets intense: stop, feet on the floor, and do the paced breath. The part can wait.',
    ],
    ['Шесть шагов к защитнику', 'Защитники смягчаются, когда их слышат, а не сражаются с ними. Спрашивайте — никогда не допрашивайте.',
      ['Найдите часть в теле; сфокусируйтесь на ней.', 'Рассмотрите её: форма, температура, возраст.', 'Спросите: «Какое твоё благое намерение для меня?»', 'Поблагодарите её за работу — вслух.', 'Спросите: «Чего ты боишься, если ослабишь хватку?»', 'Запишите её ответ одним предложением.'],
      'Если становится остро: остановитесь, стопы в пол, подышите 4–6. Часть подождёт.']),
  ex('two-column-poles', 'polarization',
    ['Two columns, one deeper goal', 'Polarized protectors share a goal underneath the deadlock — find it and the war becomes a team.',
      ['Draw two columns, one per part in the cycle.', 'Let each side speak: what does it need to stand down?', 'Ask both: “Do you two share a deeper goal?”', 'Write one way they could cooperate toward it.', 'Thank both sides.'],
      'If it gets intense: close the page and return to paced breath.',
    ],
    ['Две колонки, одна цель', 'У поляризованных защитников под тупиком есть общая цель — найдите её, и война станет командой.',
      ['Начертите две колонки — по одной на каждую часть цикла.', 'Дайте каждой стороне высказаться: что ей нужно, чтобы отступить?', 'Спросите обе: «Есть ли у вас более глубокая общая цель?»', 'Запишите один способ сотрудничества ради неё.', 'Поблагодарите обе стороны.'],
      'Если становится остро: закройте страницу и вернитесь к дыханию 4–6.']),
  ex('urge-surfing', 'firefighter',
    ['Urge surfing, 10 minutes', 'An urge is a wave: it rises, crests, falls. You are the surfer, not the wave.',
      ['Set a 10-minute timer.', 'Notice the urge in the body without acting on it.', 'Rate its intensity 0–10 each minute.', 'Watch it crest and fall.', 'Log what actually happened after the timer.'],
      'If it gets intense: cold water on the wrists, then paced breath.',
    ],
    ['Сёрфинг импульса, 10 минут', 'Импульс — это волна: поднимается, достигает пика, спадает. Вы сёрфер, а не волна.',
      ['Поставьте таймер на 10 минут.', 'Замечайте импульс в теле, не действуя по нему.', 'Оценивайте интенсивность 0–10 каждую минуту.', 'Наблюдайте, как он нарастает и спадает.', 'Запишите, что реально произошло после таймера.'],
      'Если становится остро: холодная вода на запястья, затем дыхание 4–6.']),
  ex('notice-the-thought', 'defusion',
    ['“I notice the thought that…”', 'A core belief is a sentence, not a fact. Hearing it as a thought loosens its grip.',
      ['Write your complex’s core belief verbatim.', 'Rewrite it starting with: “I notice the thought that…”.', 'Read both aloud; feel the difference.', 'Write the smallest, truest update — local wording only (“this time”, “with this person”).'],
      'If it gets intense: stop after step 2 and ground with three present-day facts.',
    ],
    ['«Я замечаю мысль, что…»', 'Базовое убеждение — это фраза, а не факт. Услышать её как мысль — значит ослабить хватку.',
      ['Выпишите основное убеждение комплекса слово в слово.', 'Перепишите, начав с: «Я замечаю мысль, что…».', 'Прочитайте оба варианта вслух; почувствуйте разницу.', 'Запишите самое малое честное обновление — только локально («в этот раз», «с этим человеком»).'],
      'Если становится остро: остановитесь после шага 2 и заземлитесь тремя фактами сегодняшнего дня.']),
  ex('smallest-test', 'experiment',
    ['The smallest safe test', 'Beliefs predict. Test the prediction — small, real, this week — and let reality answer.',
      ['Write the old story’s specific prediction.', 'Design the smallest safe test of it.', 'Run the test; log the actual outcome.', 'Write the smallest, truest update (no “always/never”).'],
      'If it gets intense: shrink the test until it feels doable, or skip this week.',
    ],
    ['Малейшая проверка', 'Убеждения делают прогнозы. Проверьте прогноз — малым, реальным, на этой неделе — и дайте реальности ответить.',
      ['Запишите точный прогноз старой истории.', 'Придумайте малейшую безопасную проверку.', 'Проведите её; зафиксируйте фактический результат.', 'Запишите самое малое честное обновление (без «всегда/никогда»).'],
      'Если становится остро: уменьшайте проверку, пока она не станет посильной, или пропустите неделю.']),
  ex('pendulation', 'somatic',
    ['Pendulation: sensation ↔ resource', 'Never go deeper into a wound than the resource you have online — swing between, don’t push.',
      ['Find a calm sensation somewhere in your body; stay 30 seconds.', 'Touch the difficult sensation for 10 seconds.', 'Swing back to the calm sensation for 30 seconds.', 'End inside the resource. Always.'],
      'If it gets intense: skip step 2 entirely; the resource beat is a complete practice.',
    ],
    ['Маятник: ощущение ↔ ресурс', 'Не уходите в рану глубже, чем позволяет ваш ресурс, — качайтесь между ними, не давите.',
      ['Найдите спокойное ощущение в теле; побудьте с ним 30 секунд.', 'Коснитесь трудного ощущения на 10 секунд.', 'Вернитесь к спокойному ощущению на 30 секунд.', 'Завершайте всегда внутри ресурса.'],
      'Если становится остро: пропустите шаг 2 entirely; работа с ресурсом — полноценная практика сама по себе.']),
  ex('self-compassion-break', 'self_energy',
    ['Self-compassion break (secular)', 'Three sentences that put Self in the chair: this is hard, this is human, may I be kind to myself now.',
      ['Hand on the chest. Say: “This is a moment of difficulty.”', 'Say: “Difficulty is part of being human.”', 'Say: “May I be kind to myself right now.”', 'Notice one quality that appeared (calm? warmth?).']],
    ['Пауза самосострадания (светская)', 'Три фразы, которые сажают Self в кресло: это тяжело, это человечно, позволю ли я себе доброту сейчас.',
      ['Ладонь на грудь. Скажите: «Это момент трудности».', 'Скажите: «Трудность — часть человеческой жизни».', 'Скажите: «Позволю ли я себе доброту прямо сейчас».', 'Заметьте качество, которое появилось (спокойствие? тепло?).']]),
  ex('one-small-no', 'resource',
    ['Warrior rep: one small no', 'Boundaries are muscles — one clean, small no per week is a full rep.',
      ['Choose one small request this week you’d normally swallow.', 'Decline it in one warm, clear sentence.', 'Stay present with the discomfort for 60 seconds.', 'Log what actually happened.']],
    ['Реп Воина: одно малое «нет»', 'Границы — это мышцы: одно чистое малое «нет» в неделю — полная репетиция.',
      ['Выберите одну мелкую просьбу, которую обычно проглатываете.', 'Откажите одной тёплой и ясной фразой.', 'Побудьте с дискомфортом 60 секунд.', 'Запишите, что реально произошло.']]),
  ex('loop-pause', 'relational',
    ['The Loop pause-protocol', 'When the loop grabs you both: name it, timeout, scripted re-entry.',
      ['Name the loop out loud: “I think the loop has us.”', 'Take a 20-minute timeout — separately.', 'Return and re-enter with: “What I felt was… what I need is…”', 'Log one thing each of you will try next time.'],
      'If it gets intense: the timeout is not abandonment; honor it.',
    ],
    ['Пауза в петле', 'Когда петля захватила вас обоих: назовите её, тайм-аут, возвращение по сценарию.',
      ['Назовите петлю вслух: «Кажется, нами овладела петля».', 'Возьмите тайм-аут на 20 минут — порознь.', 'Вернитесь со входом: «Я чувствовал(а)… мне нужно…»', 'Запишите по одной вещи, которые каждый попробует в следующий раз.'],
      'Если становится остро: тайм-аут — не покидание; соблюдайте его.']),
  ex('letter-younger-self', 'exile_witness',
    ['Letter to the younger self', 'Therapist-assigned homework between live IFS sessions — structured witnessing, never solo deep work.',
      ['Between sessions, with your therapist’s framing: write to the younger one from Self.', 'Speak only what is true and kind; no fixing.', 'Bring the letter to your next session — do not work it alone.'],
      'STOP RULE: this exercise is for use between therapy sessions only. If heaviness rises, put the letter down and contact your therapist.',
    ],
    ['Письмо младшему себе', 'Домашнее задание между живыми сессиями IFS — структурированное свидетельствование, никогда не соло-копание.',
      ['Между сессиями, в рамке вашего терапевта: напишите младшему от Self.', 'Говорите только правду и доброту; без «починки».', 'Принесите письмо на следующую сессию — не работайте с ним в одиночку.'],
      'ПРАВИЛО ОСТАНОВКИ: только между сессиями с терапевтом. Если тяжесть поднимается — отложите письмо и свяжитесь с терапевтом.']),
  ex('four-way-split', 'attribution',
    ['Four-way split (60 seconds)', 'Context → specific act → impact → controllable move. Essence-language bounces off the grid.',
      ['Chips: tired / hungry / alone / conflict / deadline / other.', 'Name the specific act — one sentence.', 'Name the impact — one sentence.', 'Next move must start with “I will” (never “be better”).']],
    ['Разбор на четыре (60 секунд)', 'Контекст → конкретный поступок → влияние → подвластный шаг. Язык сути отскакивает от сетки.',
      ['Отметьте: усталость / голод / одиночество / конфликт / дедлайн / другое.', 'Назовите конкретный поступок — одно предложение.', 'Назовите влияние — одно предложение.', 'Следующий шаг начинается с «Я сделаю…» (никогда «стану лучше»).']]),
  ex('possible-selves', 'horizon',
    ['Possible selves', 'Expansion before governance: who are you drawn toward, not only what needs fixing?',
      ['Write one self you are moving toward (1 year).', 'Write the self for whom these parts are met.', 'Write one feared self.', 'Give each self one micro try-on task this week.']],
    ['Возможные я', 'Расширение прежде управления: к чему вас тянет, а не только что чинить.',
      ['Опишите одно «я», к которому вы движетесь (через год).', 'Опишите «я», для которого эти части встречены.', 'Опишите одно пугающее «я».', 'Дайте каждому «я» одну микропробу на эту неделю.']]),
  ex('old-story-prediction', 'prediction_error',
    ['Mismatch experiment', 'Reconsolidation needs coherence FIRST (why the old story made sense), then a lived mismatch.',
      ['Coherence beat: name why this belief made sense — it learned this for a good reason.', 'Write the old story’s specific prediction, verbatim.', 'Run the smallest safe test; log the actual outcome.', 'Write the smallest, truest local update.'],
      'If it gets intense: stop before the test; coherence alone is a valid session.',
    ],
    ['Эксперимент несовпадения', 'Реконсолидации нужна сначала связность (почему старая история имела смысл), потом прожитое несовпадение.',
      ['Шаг связности: назовите, почему это убеждение имело смысл — оно выучено не зря.', 'Запишите точный прогноз старой истории, дословно.', 'Проведите малейшую безопасную проверку; зафиксируйте результат.', 'Запишите самое малое честное локальное обновление.'],
      'Если становится остро: остановитесь до проверки; одна связность — уже полноценная сессия.']),
  ex('strength-rebalance', 'polarity',
    ['Strength rebalancing', 'A hyper strength leaks into its shadow part — rebalance the band, don’t amputate the gift.',
      ['Name the resource that tipped into overuse.', 'Name its shadow spill-part (it is drawn on your map).', 'Design one week where the strength serves 20% less.', 'Log what the freed space actually wanted.'],
      'If it gets intense: keep the reduction tiny — 10% counts.',
    ],
    ['Перебалансировка силы', 'Гипертрофированная сила переливается в свою теневую часть — верните диапазон, а не ампутируйте дар.',
      ['Назовите ресурс, впавший в перегрузку.', 'Назовите его теневую часть-приёмник (она на карте).', 'Устройте неделю, где сила служит на 20% меньше.', 'Запишите, чего на самом деле хотело освободившееся место.'],
      'Если становится остро: оставьте сокращение крошечным — 10% тоже считается.']),
  ex('build-safe-place', 'safe_place',
    ['Build your Special Safe Place', 'The container before any wound work: one imagined scene, populated with resources.',
      ['Choose a place — real or imagined — where your body settles.', 'Populate it: what do you see, hear, smell?', 'Invite one resource function in (Nurturing / Protective / Wise / Vital).', 'Visit it for 2 minutes daily this week.']],
    ['Постройте Особое Безопасное Место', 'Контейнер до любой работы с раной: одна воображаемая сцена, населённая ресурсами.',
      ['Выберите место — реальное или воображаемое, — где тело оседает.', 'Заселите его: что вы видите, слышите, чем пахнет?', 'Пригласите одну ресурсную функцию (Забота / Защита / Мудрость / Жизнь).', 'Посещайте его по 2 минуты ежедневно эту неделю.']]),
  ex('harmless-recording', 'harmless_recording',
    ['The harmless recording', 'You are not reliving the event — you are reliving your reaction to an old recording. The recording is harmless; your reaction made sense once.',
      ['After a flare, read the reframe above slowly, twice.', 'Say: “This reaction protected me once. It is reliving, not happening.”', 'Place one hand where the reaction lives and breathe 4–6 ×5.']],
    ['Безвредная запись', 'Вы не переживаете событие заново — вы переживаете свою реакцию на старую запись. Запись безвредна; реакция когда-то имела смысл.',
      ['После вспышки медленно прочитайте формулировку выше, дважды.', 'Скажите: «Эта реакция защищала меня. Это переживание заново, а не происходящее сейчас».', 'Положите ладонь туда, где живёт реакция, и подышите 4–6 ×5.']]),
  ex('what-was-it-like', 'metaprocessing',
    ['Metaprocess the shift', 'Don’t move past a positive shift — metabolize it. Processing the process deepens encoding.',
      ['Recall one logged positive shift (a softening, a pause).', 'Ask: “What was it like to feel that?”', 'Ask: “What is newly possible now?”', 'Write one line. Skip is allowed.']],
    ['Переработайте сдвиг', 'Не пробегайте мимо позитивного сдвига — переработайте его. Переработка процесса закрепляет изменение.',
      ['Вспомните один зафиксированный позитивный сдвиг (смягчение, паузу).', 'Спросите: «Каково это было — чувствовать это?»', 'Спросите: «Что теперь возможно?»', 'Напишите одну строку. Можно пропустить.']]),
  ex('soft-gaze', 'soft_gaze',
    ['Soft Gaze (flagship daily practice)', 'The core Self-access ritual: notice → thank → ask to step back a little → rest in what remains.',
      ['Notice body and emotion, exactly as they are.', 'Name the parts present right now.', 'Thank each one for showing up.', 'Ask each to step back a little — not away.', 'Rest in whichever qualities are now accessible. Repeat the ask until spaciousness appears.']],
    ['Мягкий Взгляд (главная ежедневная практика)', 'Базовый ритуал доступа к Self: заметить → поблагодарить → попросить чуть отойти → покоиться в том, что остаётся.',
      ['Заметьте тело и эмоцию ровно такими, какие они есть.', 'Назовите части, которые присутствуют сейчас.', 'Поблагодарите каждую за то, что пришла.', 'Попросите каждую чуть отойти — не уйти.', 'Покойтесь в тех качествах, что доступны теперь. Повторяйте просьбу, пока не появится простор.']]),
  ex('develop-weakest-spoke', 'self_quality',
    ['Develop your dimmest spoke', 'One quality at a time: the lowest radar spoke gets one micro-practice.',
      ['Look at your Self Radar; find the dimmest spoke.', 'Take its micro-practice (e.g. courage: name your worst-case aloud, rate its real likelihood 0–100%).', 'Practice once daily for a week.', 'Re-rate the spoke.']],
    ['Развейте самую тусклую спицу', 'Одно качество за раз: самой тусклой спице радара — одна микропрактика.',
      ['Взгляните на радар Self; найдите тусклую спицу.', 'Возьмите её микропрактику (напр., мужество: назовите худший сценарий вслух, оцените его реальную вероятность 0–100%).', 'Практикуйте раз в день неделю.', 'Переоцените спицу.']]),
  ex('projection-log', 'shadow_projection',
    ['Shadow via projection', 'What irritates us in others can be a disowned part working overtime to stay hidden.',
      ['Name 2–3 people who trigger strong judgment in you.', 'Log the exact emotion, body location, and the specific behavior.', 'Ask: “What if a part of me carries this too — and hides it hard?”', 'Hold the answer as a hypothesis. Never a verdict.'],
      'If it gets intense: this can destabilize — stop and return to Soft Gaze.',
    ],
    ['Тень через проекцию', 'То, что раздражает нас в других, может быть отвергнутой частью, работающей сверхурочно, чтобы остаться скрытой.',
      ['Назовите 2–3 человек, вызывающих в вас сильное осуждение.', 'Зафиксируйте точную эмоцию, место в теле и конкретное поведение.', 'Спросите: «Что если часть меня тоже это несёт — и усиленно прячет?»', 'Держите ответ как гипотезу. Никогда как приговор.'],
      'Если становится остро: это может дестабилизировать — остановитесь и вернитесь к Мягкому Взгляду.']),
];

// --- §3B.3 solo suggestion engine ---

/** Selector priority order (§3B.3). */
export const SELECTOR_PRIORITY: ExerciseTypeId[] = [
  'regulation', 'unblending', 'self_energy', 'resource', 'firefighter',
  'defusion', 'experiment', 'somatic', 'polarity', 'part_dialogue',
];

export interface SuggestInput {
  profile: ScoredProfile;
  checkIns: CheckIn[];
  now: Date;
  lastSuggestedAt?: Date | null;
}

export interface Suggestion { exercise: Exercise; type: ExerciseTypeDef; reasonKey: string; }

/** Auto-target selectors: which construct makes each type “for you” (§3B.2). */
export function selectorMatches(type: ExerciseTypeId, profile: ScoredProfile, checkIns: CheckIn[]): boolean {
  const last7 = checkIns.filter(c =>
    (now0().getTime() - new Date(c.date).getTime()) / 86400000 <= 7);
  const outOfWindow = last7.filter(c => Math.abs(c.arousal) >= 1);
  const dominant = Object.values(profile.parts).some(p => p.tier === 'dominant');
  const ffHot = ['numb', 'rebel', 'charmer'].some(p => profile.parts[p].T >= 60);
  const weakestResource = (Object.values(profile.resources)).sort((a, b) => a.T - b.T)[0];
  switch (type) {
    case 'regulation': return outOfWindow.length >= 3;
    case 'unblending': return dominant;
    case 'self_energy': return profile.selfEnergy < 50;
    case 'resource': return weakestResource.T < 45;
    case 'firefighter': return ffHot;
    case 'defusion':
    case 'experiment': return profile.activeComplexes.length > 0;
    case 'somatic': return true; // any recorded somatic zone qualifies; keep available
    case 'polarity': return profile.resourceLeaks.length > 0;
    case 'part_dialogue': return true; // top of coping stack always relevant
    default: return false;
  }
}
function now0(): Date { return new Date(); }

export function suggestExercise(input: SuggestInput): Suggestion | null {
  const { profile, lastSuggestedAt } = input;
  if (lastSuggestedAt && input.now.getTime() - lastSuggestedAt.getTime() < 24 * 60 * 60 * 1000) {
    return null; // max 1 suggestion per 24h
  }
  for (const type of SELECTOR_PRIORITY) {
    const def = EXERCISE_TYPES[type];
    if (def.gate === 'red') continue; // never auto-suggested, ever
    if (def.gate === 'yellow' && selfServeGate('yellow', profile) !== 'ok') continue;
    if (!selectorMatches(type, profile, input.checkIns)) continue;
    const exercise = EXERCISES.find(e => e.type === type);
    if (exercise) return { exercise, type: def, reasonKey: type };
  }
  return null;
}

// --- §3D.3 Practice path chapters ---

export interface ChapterState {
  descentComplete: boolean;
  daysOfCheckIns: number;
  partDialogueCompleted: boolean;
  synastryRun: boolean;
  therapistLinked: boolean;
}

export const CHAPTERS = [
  { n: 1, key: 'grounding' }, { n: 2, key: 'meeting' }, { n: 3, key: 'tending' },
  { n: 4, key: 'relating' }, { n: 5, key: 'integrating' },
] as const;

export function chapterUnlocked(chapter: 1 | 2 | 3 | 4 | 5, s: ChapterState): boolean {
  switch (chapter) {
    case 1: return s.descentComplete;
    case 2: return s.descentComplete && s.daysOfCheckIns >= 7;
    case 3: return s.partDialogueCompleted;
    case 4: return s.synastryRun || s.therapistLinked;
    case 5: return s.therapistLinked; // Ch.5 solo is UNREACHABLE by design
  }
}

/** What the user sees they may practice right now (solo). */
export function unlockedTypes(s: ChapterState): ExerciseTypeId[] {
  return (Object.values(EXERCISE_TYPES) as ExerciseTypeDef[])
    .filter(d => d.chapter <= 4 || s.therapistLinked)
    .filter(d => chapterUnlocked(d.chapter, s))
    .map(d => d.id);
}

/** §3C.8 hard rule: no card is pure narrative — every exercise ends in a step. */
export function hasBehavioralHook(e: Exercise): boolean {
  return e.steps.en.length >= 3;
}

// --- §3E.2 depth gate: never deeper into a wound than the resource online ---

/**
 * Max wound-depth beat (1..3) an exercise may reach: capped by the weaker of
 * Self energy and the strongest resource. Resource < need depth → the app
 * inserts a resource beat or closes with grounding instead.
 */
export function depthCap(profile: ScoredProfile): 1 | 2 | 3 {
  const strongestResource = Math.max(...Object.values(profile.resources).map(r => r.T));
  const weakest = Math.min(profile.selfEnergy, strongestResource);
  if (weakest < 40) return 1;
  if (weakest < 60) return 2;
  return 3;
}

/** A need-beat never exceeds the cap: the exercise stops at the allowed depth. */
export function allowedDepth(requested: 1 | 2 | 3, profile: ScoredProfile): 1 | 2 | 3 {
  return Math.min(requested, depthCap(profile)) as 1 | 2 | 3;
}

export interface ContainerState {
  safePlaceBuilt: boolean;
  /** ≥1 resource mobilized at T ≥ 50 (§3E.3). */
  resourcesMobilized: boolean;
}

/**
 * §3E.3 HARD PREREQUISITE: no exile contact (RED) without the container —
 * Safe Place built AND ≥1 resource ≥ 50T mobilized.
 */
export function containerReady(profile: ScoredProfile, s: ContainerState): boolean {
  const mobilized = Object.values(profile.resources).some(r => r.T >= 50);
  return s.safePlaceBuilt && (s.resourcesMobilized || mobilized);
}

/** RED exercises require the container AND a therapist assignment (§3B.1). */
export function redAllowed(
  profile: ScoredProfile, s: ContainerState, therapistAssigned: boolean,
): boolean {
  return therapistAssigned && containerReady(profile, s);
}

// --- §3C.5 Proceduralization Ladder ---
// 1 name the principle · 2 write the if-then plan · 3 mental rehearsal ·
// 4 live rep logged · 5 verified under load.
// HARD RULE: only rung 5 marks a skill "integrated" — insight from
// reading/reflection alone NEVER integrates (rungs 1–3 max without a live rep).

export interface LadderState {
  principleNamed?: boolean;
  ifThen?: string;
  rehearsed?: boolean;
  liveRep?: boolean;       // rung 4 — therapist-toggled in linked mode
  verifiedUnderLoad?: boolean; // rung 5 — therapist only
}

export function ladderRung(s: LadderState): 0 | 1 | 2 | 3 | 4 | 5 {
  if (s.verifiedUnderLoad) return 5;
  if (s.liveRep) return 4;
  if (s.rehearsed) return 3;
  if (s.ifThen && s.ifThen.trim().length > 5) return 2;
  if (s.principleNamed) return 1;
  return 0;
}

export function integrated(s: LadderState): boolean {
  return ladderRung(s) === 5;
}
