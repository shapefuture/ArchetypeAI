# The 7-minute test against the 64 and the 147

How the prototype's entry test («Сцены») compares with the two instruments in the app: the 64-item relational map («Карта связей») and the 147-item deep map («Погружение»). Written 2026-10-28 from the code on `claude/innerverse-v4-direction` (`src/shared/core/data/scoring.ts`, `scoring-v2.ts`, `parts.ts`, `src/shared/i18n/items.ts`, `src/parts-cartographer/screens/quick-scan.jsx`) and from the prototype in [`prototype/`](prototype/).

**Version 6 (2026-10-28).** The three depths now share one scoring. Scene points set a level for each part, the app's own scoring turns each level into a tier, and the 147 uses the same tiers. The mapping from scene points to levels is an educated guess and is the thing to test (T16–T17 in [the plan](../innerverse-plan.md#9-tests-falsify-the-riskiest-assumptions-first)).

## At a glance

| | Сцены (prototype, 7 minutes) | Карта связей (64) | Погружение (147) |
|---|---|---|---|
| **Job** | Entry: "это про меня" in minutes, a first sketch of the inner system | A relational map: four axes and the archetypes that live there | A full inventory: who protects, what they protect, how much Self is available |
| **Length** | 8 scenes, 4 options each, about 7 minutes | 64 statements, about 15–20 minutes | 147 statements in three sittings of 49, about 10 minutes each |
| **Item** | A life scene with four reactions; pick the one that comes first | A statement in five sections, with 12–16 items each | A behavioural, present-tense statement; per family 8 items (trigger, behaviour, inner narration, body), resources 6, Self 8, plus 3 validity items |
| **Answer** | One choice per scene (points, not a scale) | Likert 1–5 | Likert 1–5: «Совсем не про меня … Точно про меня» (the app's own labels) |
| **What it measures** | 14 shadow parts, 4 resources, Self (through the points) | Four bipolar axes, plus healthy patterns | 14 shadow parts, 4 resources, 8 Self qualities |
| **Scoring** | Points sum per part; level = 1 + points, capped at 5; the app's tier table turns the level into a tier | Pole averages, then cluster rules, then archetypes | Raw sums with reverse-keyed items; T-scores on provisional norms; tiers |
| **Validity** | None | None; half the items reverse-keyed | An attention item and two infrequency items at fixed positions |
| **Output** | Tiers for the 18 parts, shown as a first sketch | A constellation of archetypes (4D) | The clinical profile and the sky |
| **Repeatable** | Yes, in minutes | Weeks apart | Rarely |

## How the three depths fit together

1. **Сцены (7 минут).** Eight scenes. Each option gives one or two points to one or two parts, or to Self. A part's level is `min(5, 1 + points)`, so no points means level 1 («совсем не про меня») and four points or more means level 5. The level then goes through the app's own scoring (table below). Result: a first sketch, labelled «предварительно».
2. **Уточнить небо (14 вопросов, около 3 минут).** One statement for each of the 14 shadow parts, answered on the app's five-point scale. The app's rule applies: the part with the highest answer wins only if it reaches 4; otherwise the result is «никто не кричит, за рулём ты» (the app's `quickScan`).
3. **Погружение (147 вопросов, три присеста по 49).** The app's own items, in the app's own order, scored by the app's own code (`scoreProfile`, through the prototype's bridge). This is the only depth that gives the full profile, and the only one to show a therapist.
4. **Карта связей (64).** Kept as the legacy relational map for people who started it. It sits beside the 147 and is not part of the three-depth path.

The three depths write to the same eighteen part families, so each one adds evidence to the same parts. Nothing is renamed between them.

## Scenes: the situations and the points

Each option lists the parts it gives points to. Points are the only input to the level.

| # | Scene (the situation) | Option and points |
|---|---|---|
| 1 | Пришло письмо от начальника: «Нужно поговорить. Завтра, 10:00». Тело мгновенно похолодело. | Перечитываю письма за год и ищу косяк, сердце колотится → inner_critic 2, frightened 1 |
|  |  | Срочно собираю отчёт на три страницы, чтобы ни к чему не при… → taskmaster 2, controller 1 |
|  |  | Завтра разберусь. Открываю ленту и пропадаю → numb 2 |
|  |  | Разберусь без свиты. Мне никто не нужен → hermit 2 |
| 2 | Близкий человек не отвечает на сообщения второй день. | Пишу ещё раз. И ещё. И ещё: «всё хорошо?» → abandoned 2 |
|  |  | Наверное, в моих словах что-то не так. Перебираю весь разговор → ashamed 2 |
|  |  | Ну и ладно, мне тоже не особо надо → numb 1, hermit 1 |
|  |  | Спокойно выдыхаю: может, человек занят. Спрошу завтра → caregiver 1, self 2 |
| 3 | Вся компания смеётся над шуткой, которую не сразу уловить. | Смеюсь громче всех, чтобы никто не заметил, что я мимо → charmer 2 |
|  |  | Хочется исчезнуть из кадра и уйти тихо, никого не тревожа → unseen 2 |
|  |  | Думаю, в чём соль, и вставляю умное слово → analyst 2 |
|  |  | Смотрю со стороны и замечаю всех, кому тоже не весело → sage 2, self 1 |
| 4 | Звонит незнакомый номер. Ты ещё не знаешь зачем. | Не возьму. А вдруг что-то плохое? → frightened 2 |
|  |  | Возьму, но сначала выпишу три варианта разговора → controller 2 |
|  |  | Скажу «нет» заранее, на всякий случай → rebel 2 |
|  |  | Возьму и скажу «да-да, конечно», а потом пожалею → pleaser 2 |
| 5 | Выходной без планов. Вдруг ловишь себя на тревоге. | Срочно придумать дело, иначе день зря → taskmaster 2 |
|  |  | Включаю что-нибудь и проваливаюсь на три часа → numb 2 |
|  |  | Пересматриваю неделю: где тут ошибка? → inner_critic 1, analyst 1 |
|  |  | Выхожу на улицу без цели, просто посмотреть → explorer 2, self 1 |
| 6 | На работе тебя похвалили при всех. | Сразу ищу подвох: что они недоговаривают? → inner_critic 1, analyst 1 |
|  |  | Говорю «ой, ерунда» и перевожу разговор → bypasser 2 |
|  |  | Благодарю всех по кругу, включая кофемашину → pleaser 2, charmer 1 |
|  |  | Становится тепло. Задерживаюсь на этом чувстве подольше → self 2, caregiver 1 |
| 7 | Поздно вечером пришло рабочее сообщение. Оно явно может подождать. | Отвечаю резко: и так понятно → rebel 2 |
|  |  | Отвечаю мягко, чтобы не потерять контакт, хотя внутри кипит → pleaser 2, abandoned 1 |
|  |  | Не отвечаю. Записываю, что обсудим утром → sage 1, warrior 1 |
|  |  | Пишу, что после девяти не отвечаю, и отключаю уведомления → warrior 2, self 1 |
| 8 | Ошибка на работе, и её заметили. | Чиню немедленно, пока никто не увидел → controller 1, taskmaster 1 |
|  |  | Шучу про себя и делаю вид, что это мелочь → bypasser 1, numb 1 |
|  |  | Говорю прямо: «Тут промах, вот план исправления» → warrior 1, sage 1, self 1 |
|  |  | Думаю: «Тут без меня лучше». Очень тихо → ashamed 2, unseen 1 |

**Coverage after the v6 balance.** Each part appears in one to six options. The weakest is `explorer` (Незнайка), which appears once with two points. Two other families appear only twice. For v7: add a ninth scene in which curiosity is the natural reaction, and check that every family appears at least three times.

## Levels: what each level means in the app's scoring

The app's scoring is run on answers in which only one part moves and the rest stay neutral. The tier is the app's own tier for that score, from the same thresholds as the 147 (дремлет below 45, присутствует below 60, заметна below 70, часто солирует from 70). The T values are internal; the therapist view and the reports show words only.

| Part | Level 1 | Level 2 | Level 3 | Level 4 | Level 5 |
|---|---|---|---|---|---|
| Шапокляк (`inner_critic`) | дремлет (T 24) | дремлет (T 36) | присутствует (T 48) | заметна (T 61) | часто солирует (T 73) |
| Завхоз (`controller`) | дремлет (T 22) | дремлет (T 35) | присутствует (T 48) | заметна (T 62) | часто солирует (T 75) |
| Официант (`pleaser`) | дремлет (T 20) | дремлет (T 33) | присутствует (T 47) | заметна (T 60) | часто солирует (T 73) |
| Кролик (`taskmaster`) | дремлет (T 20) | дремлет (T 33) | присутствует (T 47) | заметна (T 60) | часто солирует (T 73) |
| Знайка (`analyst`) | дремлет (T 22) | дремлет (T 35) | присутствует (T 48) | заметна (T 62) | часто солирует (T 75) |
| Ёжик (`hermit`) | дремлет (T 27) | дремлет (T 40) | присутствует (T 53) | заметна (T 67) | часто солирует (T 80) |
| Тигра (`bypasser`) | дремлет (T 26) | дремлет (T 41) | присутствует (T 55) | часто солирует (T 70) | часто солирует (T 80) |
| Залипашка (`numb`) | дремлет (T 27) | дремлет (T 40) | присутствует (T 53) | заметна (T 67) | часто солирует (T 80) |
| Не буду (`rebel`) | дремлет (T 28) | дремлет (T 43) | присутствует (T 57) | часто солирует (T 72) | часто солирует (T 80) |
| Карлсон (`charmer`) | дремлет (T 26) | дремлет (T 41) | присутствует (T 55) | часто солирует (T 70) | часто солирует (T 80) |
| Чебурашка (`abandoned`) | дремлет (T 30) | дремлет (T 42) | присутствует (T 55) | заметна (T 67) | часто солирует (T 79) |
| Кот под диваном (`ashamed`) | дремлет (T 30) | дремлет (T 42) | присутствует (T 55) | заметна (T 67) | часто солирует (T 79) |
| Заяц (`frightened`) | дремлет (T 30) | дремлет (T 43) | присутствует (T 57) | часто солирует (T 70) | часто солирует (T 80) |
| Крайний на фото (`unseen`) | дремлет (T 28) | дремлет (T 41) | присутствует (T 53) | заметна (T 65) | часто солирует (T 78) |
| Сова (`sage`) | дремлет (T 20) | дремлет (T 32) | присутствует (T 46) | присутствует (T 59) | часто солирует (T 72) |
| Богатырь (`warrior`) | дремлет (T 20) | дремлет (T 32) | присутствует (T 46) | присутствует (T 59) | часто солирует (T 72) |
| Обнимашка (`caregiver`) | дремлет (T 20) | дремлет (T 32) | присутствует (T 46) | присутствует (T 59) | часто солирует (T 72) |
| Незнайка (`explorer`) | дремлет (T 20) | дремлет (T 32) | присутствует (T 46) | присутствует (T 59) | часто солирует (T 72) |

Reading the table: level 3 («иногда про меня») already gives «присутствует» for most parts; level 4 gives «заметна»; only level 5 gives «часто солирует» for most parts. A part at level 1 or 2 is dormant. That is why a single tap cannot make a part loud.

## The cast in the three depths

The eighteen families have names in the prototype (see the plan, §3.2). All of them take part in all three depths:

- **Protectors (ten):** Шапокляк (`inner_critic`), Завхоз (`controller`), Официант (`pleaser`), Кролик (`taskmaster`), Знайка (`analyst`), Ёжик (`hermit`), Тигра (`bypasser`), Залипашка (`numb`), Не буду (`rebel`), Карлсон (`charmer`).
- **Exiles (four):** Чебурашка (`abandoned`), Кот под диваном (`ashamed`), Заяц (`frightened`), Крайний на фото (`unseen`). They get tender names and no jokes at their expense.
- **Resources (four):** Сова (`sage`), Богатырь (`warrior`), Обнимашка (`caregiver`), Незнайка (`explorer`).
- **Self:** the sun, with eight qualities that the 147 asks about.
- **Guide:** Луна, who is not a part.

The names are funny skins over the families. The families stay as the internal ids, so every depth adds evidence to the same part.

## Where it is weaker, and what would falsify it

- **Thin per part.** One tap moves a result, and the scene points rest on eight choices. The 147 has eight items per family.
- **Forced choice.** A choice ranks parts against each other, so scores cannot show "everything is quiet" as clearly as a scale does.
- **One reaction only.** Real scenes wake several parts at once; the scene keeps only the points the option gives.
- **A visible "right" answer.** The calm option may still read as the healthy one, which inflates Self.
- **Guessed weights.** The points are the author's guess. Nothing in the app has been fitted to them yet.

**Falsifiers (plan §9).**

- **T16.** Thirty to fifty people take both the scenes and the 147. Per part, the scene tier equals the 147 tier in at least 60% of people, and within one step in at least 85%. Their top three parts overlap by two or more in at least 70%.
- **T17.** Measure the level-to-tier table on the 147 scores of the same people, and re-fit the points if the mapping is off.
- **If T16 fails:** call the scenes a first sketch and push «Уточнить небо» and the 147 harder.

## Recommendations, and their status

1. **One cast, three depths.** Done in v6: the same eighteen families, through the same scoring.
2. **Funny skins over the families.** Done in v6 (the cast in the plan, §3.2). The candidate names from v5 («Отдел аврала», «Диспетчер», «Профсоюз "А вот и нет"») are retired. The owner found «Профсоюз» unclear.
3. **Rebuild the scenes on the 147's content.** Partly done: eight scenes with points for every family and for Self. Open for v7: a ninth scene for `explorer`, and 24 scenes drawn from the 147's trigger and behaviour items, if T16 needs more depth.
4. **Validate before trusting.** Open: T16 and T17 need 30–50 people with both instruments. The owner recruits and runs the interviews (plan §12, decision 8).
5. **Bring the 64 and the 147 into the new voice.** Done in the prototype: «ты», the app's own Likert labels, no family names in the interface, breaks between sittings. Open: a plush that reacts as people answer, which the prototype does not do yet.
6. **Hide exiles in the consumer deep map by default.** Open for the owner (plan §12, decision 22). The prototype shows exiles in the sky, as their own tender names.
7. **Give the therapist everything.** Done in the prototype: the 147 profile, the 18 parts against their reference baselines, the polarizations and the report, all in words (plan §4.6).
