/**
 * INNERVERSE — Exercise library & practice path (REVAMP §3B, §3C.9, §3D.3-5,
 * §3E.8, §3F.5). 22 types, safety-gated, expanded by the copy team to 56
 * exercises per §3B.2. Fixed template: why → steps (OODA-shaped) → stop rule
 * on YELLOW/RED.
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

  // --- copy-team expansion to 56 (§3B.2) ---

  // regulation +2 (tracking / somatic grounding family)
  ex('feet-floor-54321', 'regulation',
    ['5-4-3-2-1 grounding', 'When the mind time-travels to old danger, the senses are stuck in the present — borrow them.',
      ['Name 5 things you can see, slowly.', 'Name 4 things you can feel touching your skin.', 'Name 3 things you can hear.', 'Name 2 things you can smell.', 'Name 1 thing you can taste, then take one slow breath.']],
    ['Заземление 5-4-3-2-1', 'Когда ум путешествует в старую опасность, чувства застревают в настоящем — одолжите их.',
      ['Медленно назовите 5 вещей, которые видите.', 'Назовите 4 ощущения, которых касаетесь кожей.', 'Назовите 3 звука, которые слышите.', 'Назовите 2 запаха.', 'Назовите 1 вкус — и сделайте один медленный вдох.']]),
  ex('body-scan-3min', 'regulation',
    ['Three-minute body scan', 'Tracking sensation from toes to crown gives the nervous system one job it can finish.',
      ['Set a 3-minute timer, eyes open or closed.', 'Move attention slowly: feet → legs → belly → chest → shoulders → jaw → crown.', 'At each zone, note one word: warm, tight, tingling, still.', 'End by naming the calmest zone you found.']],
    ['Сканирование тела, 3 минуты', 'Отслеживание ощущений от стоп до макушки даёт нервной системе одну задачу, которую можно завершить.',
      ['Поставьте таймер на 3 минуты, глаза открыты или закрыты.', 'Медленно ведите внимание: стопы → ноги → живот → грудь → плечи → челюсть → макушка.', 'В каждой зоне отметьте одно слово: тепло, сжатие, покалывание, покой.', 'Завершите, назвав самую спокойную зону.']]),

  // unblending +2
  ex('back-to-back', 'unblending',
    ['Back-to-back with the part', 'You cannot observe a part you are standing inside — take one physical step to the side.',
      ['Stand up and feel where the part lives in your body.', 'Physically step to the side or turn 90 degrees.', 'Look back at where you were standing and say: “There it is, and here I am.”', 'Note one quality you feel from this new spot (space, breath, curiosity).']],
    ['Спина к спине с частью', 'Невозможно наблюдать часть, стоя внутри неё, — сделайте один физический шаг в сторону.',
      ['Встаньте и почувствуйте, где живёт часть в теле.', 'Физически шагните в сторону или повернитесь на 90 градусов.', 'Оглянитесь на место, где стояли, и скажите: «Там — она, здесь — я».', 'Заметьте одно качество, ощущаемое с новой точки (простор, дыхание, любопытство).']]),
  ex('blend-o-meter', 'unblending',
    ['The blend-o-meter', 'Blending is a percentage, not a switch — measuring it creates the distance it measures.',
      ['Recall today\u2019s strongest reaction.', 'Rate honestly: how blended were you, 0–100%?', 'Ask the part to step back just 10%. Note the new number.', 'Write one sentence you could only say unblended.']],
    ['Измеритель смешивания', 'Смешивание — это процент, а не выключатель; само измерение создаёт дистанцию, которую измеряет.',
      ['Вспомните самую сильную реакцию за день.', 'Честно оцените: насколько вы были смешаны, 0–100%?', 'Попросите часть отойти хотя бы на 10%. Зафиксируйте новую цифру.', 'Напишите одно предложение, которое можно сказать только из дистанции.']]),

  // somatic +2 (grounding family)
  ex('orient-slow-look', 'somatic',
    ['Orienting: the slow look-around', 'Predator vigilance narrows the visual field; a slow orient tells the animal brain the room is safe.',
      ['Let your eyes wander, without hurrying, around the room.', 'Let the head follow the eyes — neck, shoulders moving softly.', 'Notice what your eyes want to rest on; pause there.', 'End with one full breath and one word for how the body feels now.'],
      'If it gets intense: close the eyes halfway and orient to sounds instead.',
    ],
    ['Ориентирование: медленный осмотр', 'Хищная бдительность сужает поле зрения; медленный осмотр говорит звериному мозгу, что комната безопасна.',
      ['Позвольте глазам неспешно блуждать по комнате.', 'Пусть голова следует за глазами — шея и плечи движутся мягко.', 'Заметьте, где взгляд хочет остановиться; задержитесь там.', 'Завершите полным вдохом и одним словом о состоянии тела.'],
      'Если становится остро: прикройте глаза наполовину и ориентируйтесь на звуки.']),
  ex('resourcing-imagery', 'somatic',
    ['Somatic resource imagery', 'The body cannot tell a vividly imagined resource from a real one — build one it trusts.',
      ['Recall a moment your body felt solid: a place, a person, an activity.', 'Re-enter it through the senses: what did your skin, ears, nose register?', 'Find where that solidity lives in your body now; place a hand there.', 'Stay 60 seconds; name one word for the resource (grounded, held, strong).'],
      'If it gets intense: open your eyes and name three objects in the room.',
    ],
    ['Телесный образ-ресурс', 'Тело не отличает ярко воображаемый ресурс от настоящего — постройте тот, которому оно доверяет.',
      ['Вспомните момент, когда тело ощущалось устойчивым: место, человек, занятие.', 'Войдите в него через чувства: что регистрировали кожа, уши, нос?', 'Найдите, где эта устойчивость живёт в теле сейчас; положите туда ладонь.', 'Побудьте 60 секунд; назовите ресурс одним словом (устойчивость, опора, сила).'],
      'Если становится остро: откройте глаза и назовите три предмета в комнате.']),

  // self_energy +2 (Self-energy anchors)
  ex('eight-c-anchor', 'self_energy',
    ['Anchor to one C', 'Self-energy has a signature — calm, curiosity, clarity, compassion, courage, confidence, creativity, connectedness. One is enough to start.',
      ['Pick the quality that feels even 10% available today.', 'Recall one concrete moment you lived it (any age counts).', 'Relive the moment for 30 seconds, sensing where it lives in the body.', 'Set one tiny if-then: “If X happens today, I will touch that spot and breathe.”']],
    ['Якорь на одно качество', 'У энергии Self есть подпись: спокойствие, любопытство, ясность, сострадание, мужество, уверенность, творчество, связанность. Одного достаточно для старта.',
      ['Выберите качество, доступное хотя бы на 10% сегодня.', 'Вспомните конкретный момент, когда вы его прожили (любой возраст подходит).', 'Проживите момент 30 секунд, ощущая, где он живёт в теле.', 'Задайте одно микроправило: «Если случится X, я коснусь этого места и вдохну».']]),
  ex('loving-phrase', 'self_energy',
    ['One phrase from Self', 'A single sentence spoken from Self reaches parts that lectures cannot.',
      ['Choose one part you judge harshly.', 'Find a phrase that is true, kind, and short (e.g. “I\u2019m here; you can rest.”).', 'Say it aloud three times, slower each time.', 'Notice any softening — even 5% counts — and write it down.']],
    ['Одна фраза от Self', 'Единственное предложение, сказанное из Self, достигает частей, до которых не доходят лекции.',
      ['Выберите часть, которую строго судите.', 'Найдите фразу — правдивую, добрую, короткую (например: «Я здесь; можешь отдохнуть»).', 'Произнесите её вслух трижды, каждый раз медленнее.', 'Заметьте любое смягчение — даже 5% считается — и запишите.']]),

  // part_dialogue +2 (direct access / protection updates)
  ex('direct-access-note', 'part_dialogue',
    ['Direct access, written', 'When a part will not speak to you, let it write in the first person — the hand knows things the mouth guards.',
      ['Ask inside: which part most needs attention today?', 'Let that part write 3–5 sentences in “I” voice — no editing.', 'Read it back and underline the one sentence with the most charge.', 'Ask the part one follow-up question in the margin.'],
      'If it gets intense: thank the part, close the notebook, and do paced breath for one minute.',
    ],
    ['Прямой доступ, письменно', 'Если часть не говорит с вами, пусть пишет от первого лица — рука знает то, что охраняет рот.',
      ['Спросите внутри: какой части сегодня нужнее всего внимание?', 'Позвольте части написать 3–5 предложений от «я» — без правок.', 'Прочитайте и подчеркните самое заряженное предложение.', 'Задайте части один уточняющий вопрос на полях.'],
      'Если становится остро: поблагодарите часть, закройте тетрадь и минуту подышите 4–6.']),
  ex('protection-update', 'part_dialogue',
    ['Protection update call', 'Protectors run on decades-old intelligence — schedule a briefing, not a dismissal.',
      ['Name one protector by its role (the pusher, the watcher, the fixer).', 'Ask: “What did you protect me from, back then?” — and listen without arguing.', 'Give it one piece of news: one true fact about your life today it may not know.', 'Ask: “Would you be willing to try 5% less this week, just as an experiment?”'],
      'If it gets intense: protectors refuse change when afraid — thank it and stop; a refusal is data, not failure.',
    ],
    ['Обновление протекции', 'Защитники работают на разведданных десятилетий назад — назначьте брифинг, а не увольнение.',
      ['Назовите одного защитника по роли (надсмотрщик, наблюдатель, починщик).', 'Спросите: «От чего ты защищал меня тогда?» — и слушайте, не споря.', 'Сообщите одну новость: один правдивый факт о вашей сегодняшней жизни, которого оно может не знать.', 'Спросите: «Готов(а) ли ты попробовать на 5% меньше на этой неделе, просто как эксперимент?»'],
      'Если становится остро: защитники отказываются от перемен из страха — поблагодарите и остановитесь; отказ — это данные, а не провал.']),

  // firefighter +2
  ex('delay-not-deny', 'firefighter',
    ['Delay, don\u2019t deny (15 minutes)', 'Firefighters calm the storm any way they can; a short delay teaches them the storm passes on its own.',
      ['When the urge arrives, say: “Yes — in 15 minutes.”', 'Set a real timer and stay in the room.', 'Do one neutral physical task (dishes, walk, stretch) while it runs.', 'When it rings, choose freely: act on the urge or not — both are allowed; log the choice.'],
      'If it gets intense: the goal is delay, not deprivation — acting after the timer is not a failure.',
    ],
    ['Отложи, не откажи (15 минут)', 'Пожарные успокаивают бурю любым способом; короткая задержка учит их, что буря проходит сама.',
      ['Когда приходит импульс, скажите: «Да — через 15 минут».', 'Поставьте настоящий таймер и останьтесь в комнате.', 'Сделайте одну нейтральную физическую задачу (посуда, прогулка, растяжка), пока он идёт.', 'Когда прозвенит, выбирайте свободно: выполнить или нет — оба варианта допустимы; запишите выбор.'],
      'Если становится остро: цель — задержка, а не лишение; действие после таймера — не провал.']),
  ex('name-the-fire', 'firefighter',
    ['Name the fire it\u2019s fighting', 'A firefighter is only “bad behavior” until you see what it\u2019s extinguishing.',
      ['After a flare you regret, skip the self-trial.', 'Ask instead: “What was on fire just before this?” — an emotion, a memory, a moment.', 'Write the fire\u2019s name in one word.', 'Ask the firefighter: “What were you afraid would happen if you did nothing?”'],
      'If it gets intense: if the fire feels old and big, stop — that material belongs with a therapist.',
    ],
    ['Назовите пожар, который тушится', 'Пожарный — «плохое поведение» лишь до тех пор, пока не видно, что он тушит.',
      ['После вспышки, о которой жалеете, пропустите внутренний суд.', 'Спросите вместо этого: «Что горело прямо перед этим?» — эмоция, воспоминание, момент.', 'Запишите имя пожара одним словом.', 'Спросите у пожарного: «Чего ты боялся(лась), если ничего не сделать?»'],
      'Если становится остро: если пожар ощущается старым и большим — остановитесь; этому материалу место у терапевта.']),

  // polarization +2 (negotiation family)
  ex('moderator-seat', 'polarization',
    ['Take the moderator\u2019s seat', 'Two parts at war need neither a judge nor a winner — they need a chair in the middle.',
      ['Name the two parts locked in the cycle (e.g. pusher vs. dropper).', 'Sit in a third position — physically, if it helps — equidistant from both.', 'To each side in turn: “Say what you need in one sentence.”', 'Ask both: “What do you agree on about my life?” — find one shared concern.', 'Close by thanking both; no verdicts.'],
      'If it gets intense: polarization is exhausting — stop, and return to paced breath.',
    ],
    ['Кресло модератора', 'Двум воюющим частям не нужен ни судья, ни победитель — им нужно кресло посередине.',
      ['Назовите две части, застрявшие в цикле (например, надсмотрщик и выключающийся).', 'Сядьте в третьей позиции — физически, если помогает, — на равном расстоянии от обеих.', 'Каждой стороне по очереди: «Скажи, что тебе нужно, одним предложением».', 'Спросите обе: «В чём вы согласны насчёт моей жизни?» — найдите одну общую заботу.', 'Завершите благодарностью обеим; без вердиктов.'],
      'Если становится остро: поляризация истощает — остановитесь и вернитесь к дыханию 4–6.']),
  ex('fear-behind-both', 'polarization',
    ['The fear behind both sides', 'Polarized parts disagree on tactics but usually share one terror — find it and the volume drops.',
      ['Draw a simple T: part A left, part B right.', 'Under each, write its fear: “If I don\u2019t…, then…”', 'Compare the two fears; circle any word they share.', 'Write one sentence to both parts that addresses the shared fear.'],
      'If it gets intense: set the page down — insight under duress does not stick anyway.',
    ],
    ['Страх за обеими сторонами', 'Поляризованные части расходятся в тактике, но обычно делят один ужас — найдите его, и громкость упадёт.',
      ['Начертите простую T: часть A слева, часть B справа.', 'Под каждой запишите её страх: «Если я не…, то…»', 'Сравните два страха; обведите общее слово.', 'Напишите обеим частям одно предложение, обращённое к общему страху.'],
      'Если становится остро: отложите страницу — инсайт под давлением всё не закрепится.']),

  // defusion +2 (journaling prompts)
  ex('belief-as-weather', 'defusion',
    ['Belief as weather report', 'You do not have to argue with a core belief — just report it, the way a meteorologist reports rain.',
      ['Write the belief once, verbatim.', 'Rewrite it as a bulletin: “Today, heavy shame moving through the region of ‘I am too much.’”', 'Add the forecast: “Expected to pass; it always has.”', 'Read both versions aloud; note which one you can hold lightly.'],
      'If it gets intense: stop after step 2 and ground with the 5-4-3-2-1.',
    ],
    ['Убеждение как прогноз погоды', 'С базовым убеждением не обязательно спорить — просто сообщите о нём, как метеоролог о дожде.',
      ['Выпишите убеждение один раз, дословно.', 'Перепишите его как бюллетень: «Сегодня в районе „я слишком много“ проливной стыд».', 'Добавьте прогноз: «Ожидается прохождение; как и всегда».', 'Прочитайте обе версии вслух; заметьте, которую можно держать легко.'],
      'Если становится остро: остановитесь после шага 2 и заземлитесь 5-4-3-2-1.']),
  ex('thank-the-thought', 'defusion',
    ['Thank the thought', 'Fighting a thought feeds it; thanking it starves it of the fight it expects.',
      ['Notice one recurring self-critical thought.', 'Say: “Thank you, thought. I know you\u2019re trying to protect me from something.”', 'Do not argue back — add nothing else.', 'Write what the thought wanted to prevent, in one line.'],
      'If it gets intense: if the thought spirals, stop and return to Soft Gaze.',
    ],
    ['Поблагодарите мысль', 'Борьба с мыслью кормит её; благодарность лишает её ожидаемой драки.',
      ['Заметьте одну повторяющуюся самокритичную мысль.', 'Скажите: «Спасибо, мысль. Я знаю: ты пытаешься меня от чего-то защитить».', 'Не спорьте в ответ — не добавляйте ничего.', 'Запишите одной строкой, чего мысль хотела не допустить.'],
      'Если становится остро: если мысль закручивается — остановитесь и вернитесь к Мягкому Взгляду.']),

  // experiment +2 (protection updates / behavioral)
  ex('ask-three-people', 'experiment',
    ['Ask three people', 'One opinion is noise; three is a sample — collect data the old story said was forbidden.',
      ['Write the old story\u2019s claim (e.g. “people find me boring”).', 'Ask three safe people one honest question this week.', 'Record their answers verbatim, without rebuttal.', 'Compare the data with the claim; write the smallest honest update.'],
      'If it gets intense: stop at one answer — one is already data.',
    ],
    ['Спросите троих', 'Одно мнение — шум; три — выборка. Соберите данные, которые старая история запрещала.',
      ['Запишите тезис старой истории (например: «людям со мной скучно»).', 'Задайте на этой неделе трём безопасным людям один честный вопрос.', 'Запишите ответы дословно, без возражений.', 'Сравните данные с тезисом; запишите самое малое честное обновление.'],
      'Если становится остро: остановитесь на одном ответе — одно уже данные.']),
  ex('do-it-badly', 'experiment',
    ['Do one thing badly, on purpose', 'Perfectionist protectors predict ruin from mediocrity — run the experiment they fear most.',
      ['Choose one low-stakes task you usually do well.', 'Deliberately complete it at 60% quality — visibly imperfect.', 'Ship it, send it, or serve it as-is.', 'Log what actually happened, in facts only.'],
      'If it gets intense: shrink the stakes, never the structure — the imperfect completion is the rep.',
    ],
    ['Сделайте одно дело плохо — намеренно', 'Перфекционистские защитники предсказывают крах от посредственности — проведите эксперимент, которого они боятся больше всего.',
      ['Выберите одну задачу с низкими ставками, которую обычно делаете хорошо.', 'Намеренно завершите её на 60% качества — заметно несовершенно.', 'Отправьте, опубликуйте или подайте как есть.', 'Запишите, что реально произошло, — только факты.'],
      'Если становится остро: уменьшайте ставки, но не структуру — несовершенное завершение и есть повторение.']),

  // resource +2
  ex('warrior-rep-micro', 'resource',
    ['Warrior rep: the 60-second ask', 'Asking for small things is boundary gym with tiny weights — strength builds anyway.',
      ['Pick one tiny need you would normally suppress (water, a break, quiet).', 'Ask for it in one plain sentence.', 'Receive it without repaying, apologizing, or minimizing.', 'Log the ask and what actually happened.']],
    ['Реп Воина: просьба за 60 секунд', 'Просить о малом — это спортзал границ с крошечными весами; сила всё равно растёт.',
      ['Выберите одну мелкую нужду, которую обычно подавляете (вода, пауза, тишина).', 'Попросите одним простым предложением.', 'Примите — не возвращая долг, не извиняясь, не обесценивая.', 'Запишите просьбу и то, что реально произошло.']]),
  ex('caregiver-self-rep', 'resource',
    ['Caregiver rep: tend yourself first', 'The Caregiver resource aimed only outward drains; aimed inward first, it refills.',
      ['Choose one basic need you have ignored today (food, rest, warmth).', 'Meet it yourself, deliberately, within the hour.', 'Say internally: “This is what tending sounds like when I am included.”', 'Note one place the body softened.']],
    ['Реп Заботника: сначала о себе', 'Ресурс Заботника, направленный только наружу, истощает; направленный сначала внутрь — наполняет.',
      ['Выберите одну базовую нужду, проигнорированную сегодня (еда, отдых, тепло).', 'Удовлетворите её сами, намеренно, в течение часа.', 'Скажите внутри: «Вот как звучит забота, когда я в неё включён(а)».', 'Заметьте одно место, где тело смягчилось.']]),

  // soft_gaze +2 (flagship variants)
  ex('soft-gaze-3-breaths', 'soft_gaze',
    ['Soft Gaze, three-breath version', 'The full ritual in pocket size — for moments between moments.',
      ['Soften your gaze; let the eyes go slightly unfocused.', 'Name silently: “a part of me is feeling this.”', 'Three slow breaths, asking each time: “Would you step back a little?”', 'Notice the smallest increase of space; that is enough.']],
    ['Мягкий Взгляд, версия на три вдоха', 'Полный ритуал в карманном формате — для моментов между моментами.',
      ['Смягчите взгляд; пусть глаза чуть расфокусируются.', 'Про себя назовите: «часть меня это чувствует».', 'Три медленных вдоха, каждый с просьбой: «Можешь чуть отойти?»', 'Заметьте малейшее расширение пространства; этого достаточно.']]),
  ex('soft-gaze-with-journal', 'soft_gaze',
    ['Soft Gaze with a journal coda', 'What the gaze opens, the pen keeps — one line locks the state in.',
      ['Run the Soft Gaze ritual (notice → thank → ask to step back).', 'Before closing, open your journal.', 'Write one line that could only come from the spacious place, not from a part.', 'Date it — this becomes your Self handwriting sample.']],
    ['Мягкий Взгляд с журнальной кодой', 'Что открывает взгляд, то сохраняет перо — одна строка закрепляет состояние.',
      ['Проведите ритуал Мягкого Взгляда (заметить → поблагодарить → попросить отойти).', 'Перед завершением откройте журнал.', 'Напишите одну строку, которая могла прийти только из просторного места, а не от части.', 'Поставьте дату — это станет образцом вашего почерка от Self.']]),

  // relational +2
  ex('repair-sentence', 'relational',
    ['One repair sentence', 'Ruptures do not need a treaty — they need one clean sentence within 24 hours.',
      ['Name one recent friction with a safe person.', 'Choose your half of it honestly (not a confession ritual).', 'Deliver one sentence: “When I ___, I think a protectiveness took over; I\u2019d like to try again.”', 'Stop after one sentence — no essay, no campaign.'],
      'If it gets intense: repair is not self-flagellation — if it slides into that, stop and breathe.',
    ],
    ['Одно предложение починки', 'Разрывам не нужен договор — им нужно одно чистое предложение в течение суток.',
      ['Назовите одно недавнее трение с безопасным человеком.', 'Честно выберите свою половину (не ритуал исповеди).', 'Произнесите одно предложение: «Когда я ___, мной овладела защитность; я хочу попробовать заново».', 'Остановитесь после одного предложения — без эссе и кампаний.'],
      'Если становится остро: починка — не самобичевание; если скатывается туда — остановитесь и подышите.']),
  ex('double-click-moment', 'relational',
    ['The double-click moment', 'Overreactions in closeness are usually two parts meeting — click once and look.',
      ['Recall a moment a small remark landed absurdly hard.', 'Ask: “Which of my parts heard that — and what did it hear it as?”', 'Ask: “Which part of mine answered?”', 'Share the answer with the person, if safe: “A sensitive part of me took that personally.”'],
      'If it gets intense: keep the inquiry inward today — sharing is optional, never mandatory.',
    ],
    ['Момент двойного клика', 'Гиперреакции в близости — обычно встреча двух частей; кликните раз и посмотрите.',
      ['Вспомните момент, когда малое замечание ударило непропорционально сильно.', 'Спросите: «Какая моя часть это услышала — и чем она это услышала?»', 'Спросите: «Какая моя часть ответила?»', 'Если безопасно, поделитесь: «Одна моя чувствительная часть приняла это на свой счёт».'],
      'Если становится остро: сегодня оставьте разбор внутренним — делиться необязательно.']),

  // safe_place +1
  ex('safe-place-portal', 'safe_place',
    ['A doorway into the safe place', 'A fixed gesture becomes a portable door — the place travels with the body.',
      ['Choose one physical gesture (thumb to finger, hand on sternum).', 'Enter your Special Safe Place while holding the gesture for 60 seconds.', 'Repeat three times today: gesture + 10 seconds of the place.', 'Use the gesture alone next time the world tilts — the doorway works in crowds.']],
    ['Дверь в безопасное место', 'Закреплённый жест становится портативной дверью — место путешествует вместе с телом.',
      ['Выберите один физический жест (большой палец к пальцу, ладонь на грудину).', 'Войдите в Особое Безопасное Место, удерживая жест, 60 секунд.', 'Повторите трижды за день: жест + 10 секунд места.', 'В следующий раз, когда мир кренится, используйте жест один — дверь работает и в толпе.']]),

  // self_quality +1
  ex('spoke-pairing', 'self_quality',
    ['Pair two spokes', 'Qualities grow in pairs — courage borrows legs from curiosity.',
      ['Pick your dimmest radar spoke.', 'Pick the brightest one next to it.', 'Design one task this week that needs both: e.g. bold question (courage) about something you wonder about (curiosity).', 'Log the rep; re-rate the dim spoke after three tries.']],
    ['Соедините две спицы', 'Качества растут в парах — мужество берёт ноги у любопытства.',
      ['Выберите самую тусклую спицу радара.', 'Выберите соседнюю самую яркую.', 'Придумайте одну задачу на неделю, требующую обеих: например, смелый вопрос (мужество) о том, о чём вы удивляетесь (любопытство).', 'Запишите повторение; переоцените тусклую спицу после трёх попыток.']]),

  // harmless_recording +1
  ex('recording-label', 'harmless_recording',
    ['Label the recording', 'A triggered reaction keeps no timestamps — labeling one re-dates it.',
      ['After a flare, write what the reaction felt like it was responding to.', 'Ask: “How old does this situation think it is?”', 'Write the real date at the top of the page — today\u2019s.', 'Read the flare description under today\u2019s date; note one thing that no longer fits.']],
    ['Пометьте запись', 'Сработавшая реакция не хранит временных меток; пометка одной из них переносит её в настоящее.',
      ['После вспышки запишите, на что, как казалось, реагировала реакция.', 'Спросите: «Каким возрастом эта ситуация себя считает?»', 'Напишите настоящую дату вверху страницы — сегодняшнюю.', 'Прочитайте описание вспышки под сегодняшней датой; заметьте, что больше не сходится.']]),

  // metaprocessing +1
  ex('witness-the-win', 'metaprocessing',
    ['Witness the win', 'Parts distrust progress that goes unrecorded — hold one small victory in the light.',
      ['Pick one moment this week a part softened or you stayed steady.', 'Relive it for 30 seconds, letting it register as real.', 'Ask: “What did the part that relaxed need to know for that to happen?”', 'Write one line — and read it once more before bed.']],
    ['Засвидетельствуйте победу', 'Части не доверяют прогрессу, который никто не зафиксировал, — подержите одну малую победу на свету.',
      ['Выберите момент недели, когда часть смягчилась или вы устояли.', 'Проживите его 30 секунд, позволяя ему регистрироваться как реальность.', 'Спросите: «Что нужно было знать расслабившейся части, чтобы это случилось?»', 'Напишите одну строку — и перечитайте её перед сном.']]),

  // attribution +1
  ex('context-first-grid', 'attribution',
    ['Context-first grid', 'Before judging the self, inventory the conditions — blame cannot survive an accurate context list.',
      ['Draw four boxes: body, day, people, task.', 'Fill each with one honest condition (slept 5h; deadline; tense call; noisy room).', 'Only now write the one-sentence self-judgment.', 'Re-read it next to the boxes; write what remains true.']],
    ['Сетка контекста прежде всего', 'Прежде чем судить себя, инвентаризируйте условия — обвинение не выживает рядом с точным списком контекста.',
      ['Начертите четыре поля: тело, день, люди, задача.', 'Заполните каждое одним честным условием (спал 5 часов; дедлайн; напряжённый звонок; шумная комната).', 'Только теперь запишите самообвинение одним предложением.', 'Перечитайте его рядом с полями; запишите, что остаётся правдой.']]),

  // horizon +1 (journaling prompts)
  ex('one-year-letter', 'horizon',
    ['Letter from the one-year-ahead self', 'The future self is not a stranger — it is today\u2019s parts, met. Let it write.',
      ['Write a short letter from you, one year from now, who is living with these parts heard.', 'Have it describe one ordinary morning in that life, in sensory detail.', 'Have it end with one sentence to today\u2019s you — advice, permission, or company.', 'Keep the letter; reread it monthly.']],
    ['Письмо от «я» через год', 'Будущее «я» — не незнакомец; это сегодняшние части, которые встретили. Пусть напишет.',
      ['Напишите короткое письмо от себя через год, живущего с услышанными частями.', 'Пусть опишет одно обычное утро той жизни — в сенсорных деталях.', 'Пусть завершит одним предложением сегодняшнему вам — советом, разрешением или просто поддержкой.', 'Сохраните письмо; перечитывайте раз в месяц.']]),

  // prediction_error +1
  ex('expectation-vs-reality', 'prediction_error',
    ['Expectation vs. reality log', 'Old stories survive because nobody checks the tape — check the tape.',
      ['Before an interaction, write the old story\u2019s prediction in one line.', 'After it, write what actually happened in one line.', 'Mark the delta: confirmed, mismatched, or partial.', 'After five entries, write the smallest update the data supports.'],
      'If it gets intense: coherence first — remind yourself why the old prediction once made sense, then stop.',
    ],
    ['Журнал «ожидание против реальности»', 'Старые истории живут, потому что никто не сверяет плёнку, — сверьте.',
      ['Перед взаимодействием запишите прогноз старой истории одной строкой.', 'После — запишите одной строкой, что реально произошло.', 'Отметьте расхождение: подтверждено, несовпадение, частично.', 'После пяти записей выпишите самое малое обновление, которое поддерживают данные.'],
      'Если становится остро: сначала связность — напомните себе, почему старый прогноз когда-то имел смысл, и остановитесь.']),

  // polarity +1
  ex('dial-not-switch', 'polarity',
    ['A dial, not a switch', 'Overused strengths cannot be switched off — but they can be turned from ten to eight.',
      ['Name the strength running at full volume.', 'Find its dial in daily life: where exactly does it fire at 10/10?', 'Choose one recurring moment to run it at 8/10 instead.', 'Log the week; note what the spare 20% felt like wanting.'],
      'If it gets intense: keep the dial move tiny — 10 to 9 counts.',
    ],
    ['Регулятор, а не выключатель', 'Гипертрофированную силу нельзя выключить — но её можно убавить с десяти до восьми.',
      ['Назовите силу, работающую на полной громкости.', 'Найдите её регулятор в буднях: где именно она срабатывает на 10/10?', 'Выберите один повторяющийся момент, где включать её на 8/10.', 'Зафиксируйте неделю; заметьте, чего хотела освободившаяся пятая часть.'],
      'Если становится остро: оставьте ход регулятора крошечным — с 10 до 9 тоже считается.']),

  // shadow_projection +1
  ex('admiration-projection', 'shadow_projection',
    ['The admiration mirror', 'Projection hides strengths too — what you admire without envy may be your own unlived part.',
      ['Name one person you admire without jealousy.', 'Write the three specific qualities you admire.', 'Ask: “Where in me is this quality — young, hidden, or unpracticed?”', 'Design one micro-rep of one quality this week.'],
      'If it gets intense: if the admiration carries ache or grief, stop — that depth belongs in therapy.',
    ],
    ['Зеркало восхищения', 'Проекция прячет и силы: то, чем вы восхищаетесь без зависти, может быть вашей непрожитой частью.',
      ['Назовите человека, которым восхищаетесь без ревности.', 'Выпишите три конкретных качества восхищения.', 'Спросите: «Где во мне это качество — юное, скрытое или непрактикуемое?»', 'Придумайте одну микропробу одного качества на эту неделю.'],
      'Если становится остро: если восхищение несёт боль или грусть — остановитесь; такой глубине место в терапии.']),

  // exile_witness +1 (RED — therapist-assigned witnessing/retrieval homework)
  ex('witnessing-notes', 'exile_witness',
    ['Witnessing notes between sessions', 'Therapist-assigned witnessing homework — presence without entering the wound alone.',
      ['With your therapist\u2019s framing, sit near (not inside) the young part for five scheduled minutes.', 'Offer only company: “I see you. You are not alone now.”', 'Write three neutral notes: what it showed, what it seemed to need, what you felt.', 'Bring the notes to session — the work continues there, never alone.'],
      'STOP RULE: between-sessions homework with your therapist only. If the young part\u2019s material floods in, stop, ground, and contact your therapist.',
    ],
    ['Записи свидетельствования между сессиями', 'Домашнее задание по свидетельствованию от терапевта — присутствие без входа в рану в одиночку.',
      ['В рамке вашего терапевта побудьте рядом (не внутри) с младшей частью пять назначенных минут.', 'Предложите только компанию: «Я вижу тебя. Ты теперь не одна».', 'Запишите три нейтральных заметки: что она показала, чего, казалось, ей нужно, что чувствовали вы.', 'Принесите заметки на сессию — работа продолжается там, никогда в одиночку.'],
      'ПРАВИЛО ОСТАНОВКИ: только домашнее задание между сессиями с вашим терапевтом. Если материал младшей части хлынул — остановитесь, заземлитесь и свяжитесь с терапевтом.']),
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
export function selectorMatches(type: ExerciseTypeId, profile: ScoredProfile, checkIns: CheckIn[], now: Date = new Date()): boolean {
  const last7 = checkIns.filter(c =>
    (now.getTime() - new Date(c.date).getTime()) / 86400000 <= 7);
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

export function suggestExercise(input: SuggestInput): Suggestion | null {
  const { profile, lastSuggestedAt } = input;
  if (lastSuggestedAt && input.now.getTime() - lastSuggestedAt.getTime() < 24 * 60 * 60 * 1000) {
    return null; // max 1 suggestion per 24h
  }
  for (const type of SELECTOR_PRIORITY) {
    const def = EXERCISE_TYPES[type];
    if (def.gate === 'red') continue; // never auto-suggested, ever
    if (def.gate === 'yellow' && selfServeGate('yellow', profile) !== 'ok') continue;
    if (!selectorMatches(type, profile, input.checkIns, input.now)) continue;
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
