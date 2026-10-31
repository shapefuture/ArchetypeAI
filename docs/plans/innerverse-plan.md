# Innerverse: the plan («Ты — не один тип. Ты — целая вселенная.»)

Status: **proposal for approval. Plan only; nothing is implemented.**
Prepared 2026-10-28 on branch `claude/hopeful-franklin-jkny8n`. Version 6 (2026-10-28), branch `claude/innerverse-v4-direction`.

This plan **supersedes** two earlier drafts:

- **v1, Felt Cosmos** ([felt-cosmos-redesign.md](felt-cosmos-redesign.md)): a rich visual world, but organised around existing features, with six metaphors and no business model.
- **v2, jobs-first** (shared in chat, not committed): a sharp structure built on jobs, tests and money, but its cockpit and crew language («экипаж», «Стыковка», «Пересадка») sounds technical to this audience.

v3 keeps v2's skeleton and v1's soul, and changes the words to fit the people the product is for. §5 lists exactly what was kept, changed and dropped.

**What changed in v4** (owner decisions of 2026-10-28, after comparing the plan with the doodle references; §12, decisions 10–16):

- **Look.** Every character is a plush from the code. It has a felt look in 3D and a doodle look in 2D, and both are drawn from the same sewing record, so any part a person crafts gets both automatically. The references set the mood only (§3.5).
- **Words.** Funny titles only. No IFS or therapy words anywhere in the interface (§3.2, §6).
- **Navigation.** Five slots: Главная · Части · **«Узелок»** · Практики · Профиль. The centre button holds Ariadne's labyrinth and its thread. It is for noticing parts, for the diary of knots and for «Меня накрыло». There is no other SOS button (§4.3).
- **Home.** Before the test: a hero and a catalogue of parts. After it: today's card first (§4.3).
- **Voice.** «Ты», Russian only on a Russian screen (§6). «Ваше небо» becomes «Твоё небо».
- **Theme.** Light by default. «Небо» is the dark mode (§3.1).
- **References** are saved in [research/references/](research/references/README.md), each with what to take and what to avoid.

**What changed in v5** (owner direction of 2026-10-28; §12, decisions 17–22):

- **Alive.** It should feel like Humongous and Amanita games and Duolingo: everything you touch answers, the plush breathe and react, and motion is smooth (§3.6).
- **Someone you talk to.** Луна opens each visit with a line about what you did, and you answer her. She remembers on the device, notices patterns and explains how she knows (§3.7).
- **Humour for curious, neurodivergent and plural minds.** Puns and quirks, with a literal mode that switches them off, and care for systems (DID, OSDD) (§3.8).
- **Icons and textures.** 3D soft object icons, as in `redesign.zip`, plus paper, felt and night-sky textures (§3.5).
- **The therapist's sky.** The full 3+1-axis 3D universe for analysing results (§4.6).
- **Gaps.** What The Pattern, Boo and Duolingo do that the plan didn't yet (§5.1). The 7-minute test is compared with the 64 and 147 in [research/test-vs-instruments.md](research/test-vs-instruments.md).

**What changed in v6** (owner review of the v5 prototype, 2026-10-28; §12, decisions 23–30):

- **The voice.** Quirky Russian with soul: natural phrasing, names borrowed from characters people know (Шапокляк, Кролик, Тигра, Карлсон, Чебурашка), and jokes that land. «Профсоюз» is gone, because the owner found it unclear (§3.2, §6).
- **Every function is in the prototype.** Forty-three rows of the app's functions each have a place in the prototype, marked full, simple or plan (§4.7).
- **The user's sky is 2D.** Flat doodles on a flat field, with no glow and no squeezed 3D (§3.5, §4.1).
- **The therapist's sky is the app's own 3+1D universe**, reused as it is, with each part shown against its reference baseline in words and never in numbers (§4.6).
- **SOS is a guided exercise:** a safety question first, then breathing, grounding, naming the loudest part, one small step, and a note in «Узелки». «Выйти» is a button (§8).
- **Tests reconciled, with educated guesses** (§9, T16–T19): scene points set a level for each part, levels become tiers through the app's own scoring, the 14-item quick scan keeps the app's rule, the 147 is taken in three sittings of 49, and the 64 stays as a legacy map.
- **Reminders** on the day, the week and the month, with guidance and lock-screen privacy (§3.9). Sending them from a server is an owner decision (§12, decision 29).

**Evidence limit.** v3 rests on the owner's description of the audience, the desk research in v2 (public posts, listings, surveys, prices) and the current code. No interviews were run. Every audience claim is a hypothesis with a named test (§9).

---

## 0. The whole plan on one page

**What it is.** The Pattern, Boo and Duolingo had a baby, for personal growth: playful daily self-discovery with a companion who knows you, rooted in IFS and other evidence-based and creative methods.

**Who it is for.** People who love personality tests, astrology apps and Jung quotes, and want real depth. They are often neurodivergent and creative, and mostly intuitive types (INTJ, INFP, ENFP, ENTP). The core of the audience is young women who already pay for The Pattern or Co–Star, read about archetypes and send each other test results.

**What they want.** To understand themselves and feel validated. To cope with inner struggles. To understand partners and friends. To find a partner and like-minded people. To play and experiment safely.

**Why today's options fail.** Self-knowledge stops at the label. A test or a horoscope makes you feel seen for a day, then says "so what?". Therapy helps, but it is slow, costly and absent at the moment a reaction takes over.

**The insight.** IFS parts are the bridge between "that's so me" and actual change. A part is as resonant as a sign or a type, because it is a character with a name and a good intention. Unlike a sign, it can be worked with: you can notice it, step back from it, talk to it and make a deal with it.

**The product: one world, one model, one daily ritual, three spaces.**

| | What | In the person's words |
|---|---|---|
| **World** | Your inner sky as a flat doodle picture. You are the Sun; your parts are doodles you can restyle, and Луна is your guide. The 3D universe belongs to the therapist. «Небо» is the night, dark mode | «Моё внутреннее небо» |
| **Model** | Your parts, each with a funny job title that honours its good intention, its own line in a speech bubble, and an arc from stranger to ally | «Кто живёт внутри?» |
| **Daily** | «Кто сегодня главный?» (10 s) gives a «Карточка дня» with one small task (2–5 min). Reminders on the day, the week and the month (§3.9) | the horoscope habit, made true |
| **«Узелок»** | The centre button. Tie a knot when a part shows up (30 s), or «Меня накрыло» → «Кто это?» → «Рядом» → «Мой шаг» in under two minutes. Every knot lands on «Твоя нить», the diary | «Меня накрыло — помогите» |
| **Я** | The test, «Твоё небо» card, part pages, conversations and deals | understand and grow |
| **Два неба** | Your sky meets a partner's or friend's: which parts get along, which collide, what to say | understand the people I love |
| **Созвездия** | Small circles of people who share a part, around a weekly shared task | find my people |
| **Feel** | Alive like a point-and-click game: everything answers your touch. Луна talks to you and remembers what you did | «Оно меня помнит!» |
| **For therapists** | The app's own 3+1-axis universe for a client's results, with each part shown against its reference baseline in words, not numbers, and with consent | see the whole system |

**End in mind.** After six weeks you know your inner cast by name. When a part takes over, you can step back in under two minutes. You and your partner share a language («моя Перфекционистка, твой Бунтарь»). You've found a few people who get you. It was fun, and you need the app a little less than you did.

**Who pays.** People (Plus, 299 ₽ a month to test), pairs (Plus for two), psychologists (a client layer). Stripe does not serve Russia, so payments must change first.

**Next step.** Test before building: interviews, a clickable prototype of the test, card, daily ritual and SOS, then paid offers, each with pass and kill thresholds (§9).

---

## 1. The end in mind

### 1.1 Six weeks, one person (illustrative, not research)

- **Day 0.** She sees a friend's «Твоё небо» card in a chat and taps it. Seven minutes later she has her own: «Отдел контроля качества», «Министр "Потом"», «Мечтатель», with "INFP · Рыбы" as the cover she typed herself. She thinks "это вообще про меня" and posts it to her story.
- **Day 2.** Her boyfriend takes the test from her link. **«Два неба»**: her Отдел контроля качества and his Бунтарь collide before deadlines. The card tells each of them what to say to the other's part. They laugh, because it's their Sunday fight.
- **Week 1.** A sharp message from her manager. She taps **«Узелок»**, then **«Меня накрыло»**. She names the part, lets it sit **рядом** rather than in charge, breathes three times, and chooses to reply in 20 minutes. It takes 1 min 40 s, and the moment stays as a knot on her thread. On calmer days she ties smaller knots: «тревожно, грудь, «А вдруг?»».
- **Weeks 2–3.** Each morning: «Кто сегодня главный?», then the «Карточка дня» and one small task. On a calm evening, a «Разговор» with «Министр "Потом"» ends in a «Договор»: ten minutes of "later" on a timer, then two minutes of work.
- **Week 4.** «Итоги недели»: the deal held three times out of four. She joins **«Созвездие Министров "Потом"»**, a weekly 25-minute co-working task with people who get it.
- **Week 6.** Отдел контроля качества reaches **«Союзник»**. «Мой ОТК сегодня на смене» is a kind running joke at home.

### 1.2 What success means

- **North star:** inner moments per person per week. These are check-ins, knots tied, tasks done, «Меня накрыло» loops completed and «Два неба» replies.
- **Resonance:** "это про меня", rated 4 or 5 out of 5, on the card.
- **Shift:** a median of +2 on "the part leads ↔ I lead" after the SOS loop.
- **Deals held:** checked the next time the part shows up.
- **Closeness:** "мы стали лучше понимать друг друга" after «Два неба».
- **Spread:** shares per card and invite acceptance.
- **Needing the app less** for a part that has become an ally is a success, not churn.

---

## 2. First principles

### 2.1 What people do today (summary of v2's desk evidence)

- They **put a label in their bio** and use types as a social language: more Tinder bios mentioned MBTI than Game of Thrones in 2019, and 41% of Gen Z women in Japan had taken MBTI by 2024.
- They **love insight about the people they already know**: The Pattern passed 15M users, and its Bonds feature is the one people rave about. Its dating feature draws "nobody uses it" complaints.
- They **try IFS alone and get stuck**, can't tell which part is driving, and use ChatGPT as a facilitator for months.
- They **pay**: therapy at 2–4k ₽ a session, small IFS apps abroad, and astrology and type apps by subscription. Psychologists pay 58–105k ₽ for IFS training.
- **Constraints:** Stripe does not serve Russia. Telegram is throttled in Russia, so no single messenger can be a dependency.

The pattern behind it: **take a test → love the label → share it → nothing changes → take another test.**

### 2.2 The jobs

| | Job, in the person's words | Role in the product |
|---|---|---|
| **J1** | «Помогите понять себя — глубоко и узнаваемо.» | **Entry:** the test and the card |
| **J2** | «Покажите, что со мной всё в порядке.» | **The through-line:** every part has a good intention, and its title honours it |
| **J3** | «Когда меня накрыло — помогите вернуть себя себе.» | **Retention:** the SOS loop, conversations, deals |
| **J4** | «Помогите понять партнёра и друзей и не ссориться одинаково.» | **Spread:** «Два неба» |
| **J5** | «Помогите найти своих.» | **Growth:** «Созвездия», demand tested first |
| **J6** | «Дайте поиграть с собой.» | **Texture:** the daily card, tasks, sewing your parts, stickers |

J1 and J2 bring people in, J3 makes them stay, J4 brings their people in, J5 grows the network once the core holds, and J6 makes every step feel like play.

### 2.3 The binding constraint

**Self-knowledge stops at the label.** Tests and horoscopes describe you; they don't move with you. They aren't there when a reaction takes over, and they show pairs as labels, not as what happens between two people.

**The answer is a self-portrait that moves.** Discovered in seven playful minutes, lived with in ten seconds a day, steered in hard moments, and compared with the people you love as dynamics.

### 2.4 Five rules that decide every screen

1. **Every screen serves a job** (§2.2). If it serves none, it goes to the Lab.
2. **One world.** The sky, the plush cast and Луна. The one tool from outside the sky is the thread on the centre button: Ariadne's thread, knotted where you noticed a part. No other metaphor gets a screen.
3. **Speak the audience's language.** Soft, warm, a little mystical in tone; honest in substance. No engineering words («стыковка», «пересадка», «экипаж», «модуль») and no therapy words anywhere in the interface: no IFS terms, part families or clinical labels (§6).
4. **Validation before change.** Every part is introduced by its superpower and good intention, never by its problem.
5. **Never punish rhythm.** Moon phases, not streaks. Rest is a valid, visible choice.

---

## 3. The concept

### 3.1 One world: the inner sky

- **You are the Sun** (Self), with eight petals: Спокойствие, Ясность, Сострадание, Любопытство, Уверенность, Смелость, Творчество, Связь. The Sun never speaks; it is you.
- **Your parts are plush characters** who live in your sky, sewn by the existing Felt Atelier engine. People craft and restyle them with the editor's options: shape, colour, eyes, mouth, headgear, glasses, bow and cheeks. Each part has a name you can change and a **job title that reveals its good intention**. Each has two looks drawn from one record: felt in 3D and a doodle in 2D (§3.5).
- **Light by default, «Небо» at night.** The app is a sunny paper page, and the sky is a window on it: the home card, «Твоё небо», a part's page, «Рядом». «Небо» is the dark mode, where the whole app becomes the night sky. It is the app's own setting (Профиль, or the moon button), not the phone's.
- **Луна is your guide**: a sleepy, witty felt moon. She asks the questions, never diagnoses, and never claims to be your Self. «Я не свечу сама — я отражаю ваш свет.»
- **«Два неба»**: two skies side by side, like a synastry chart but with parts instead of planets.
- **«Созвездия»**: small circles of people whose skies share a part.

Everything else from v1's world (quilt, weather window, spools, hoop) is dropped as a metaphor. The felt material and sewing jokes stay as texture. One thread came back in v4, as a tool rather than a world: Ariadne's thread on the centre button, with a knot for each time you notice a part (§4.3). The app already calls these moments «узелки».

### 3.2 The parts: funny, kind, a little archetypal

Titles name the protective job and make people laugh with recognition. They are gender-neutral. Jung-style archetype words (Страж, Мечтатель, Бунтарь, Целительница) can appear as a part's "second name", since this audience already speaks that language, but the app never claims to type you by Jungian theory.

The v6 names (the owner asked for quirky Russian with soul and comic-character inspiration). Each name is read aloud before it ships. Internal family ids stay in the code.

| Family | Name in the prototype | Inspiration and job |
|---|---|---|
| Inner critic | **Шапокляк** | Sharp and gossipy; has a remark about every bump in the road |
| Controller | **Завхоз** | A spare plan for the spare plan, and a spare stapler |
| Pleaser | **Официант** | «Что принести? Всё будет!» Never says no |
| Taskmaster | **Кролик** | Busy and organising: «Ну что, давайте организовываться!» (Winnie-the-Pooh) |
| Analyst | **Знайка** | Explains everything, including what nobody asked it to explain (Nosov) |
| Hermit | **Ёжик** | «Туман — мой друг» («Ёжик в тумане») |
| Bypasser | **Тигра** | Bounces over the puddles and calls every puddle a fine day (Tigger) |
| Numb (firefighter) | **Залипашка** | «Я на минутку…» Three hours later |
| Rebel (firefighter) | **Не буду** | Refuses to be told, and means it |
| Charmer (firefighter) | **Карлсон** | Arrives with a flourish and applauds himself («Я лучший, между прочим») |
| Abandoned (exile) | **Чебурашка** | A small one nobody was expecting; tender, never a punchline |
| Ashamed (exile) | **Кот под диваном** | Broke the vase and hides under the sofa: «Меня тут нет» |
| Frightened (exile) | **Заяц** | Still running, though the wolf left long ago («Ну, погоди!») |
| Unseen (exile) | **Крайний на фото** | Always at the edge of the picture, glad that everyone else is fine |
| Sage (resource) | **Сова** | Sees the whole picture, sometimes in silence |
| Warrior (resource) | **Богатырь** | Holds the outpost and wants a task worth the strength |
| Caregiver (resource) | **Обнимашка** | Warms everyone except itself; needs rest too |
| Explorer (resource) | **Незнайка** | Doesn't know, so it tries and looks. With Знайка, a fair team |
| Guide | **Луна** | Talks first and remembers only what you chose to keep |

«Профсоюз» (Trade union) and the earlier «Министр "Потом"», «Начальник отдела "А вдруг?"» and «Служба вкусняшек» are retired. The owner found the first unclear and the rest too formal.

**Each part has its own line**, in its own voice, shown in a speech bubble: «Ещё разок проверим?», «Начнём с понедельника», «Всё, мы бастуем». The line makes the title funny and the intention audible.

**Never in the interface:** «менеджер», «пожарный», «изгнанник», «экзайл», «защитник» or «ресурс» as a part type, «Self», «раненый ребёнок», «триггер», «паттерн», «отделиться от части». A newcomer must never meet a word they would have to look up. The method is credited once, in plain words, on «Как это работает»: «Идея внутренних частей пришла из психотерапии, из подхода «Внутренние семейные системы».» The app's internal part families stay in the code only.

**No jokes about young, hurt parts or crises.** The humour switches off automatically when the content is heavy.

**Each part has an arc:** Незнакомец → Знакомый → Услышан → Договор → Союзник. Only real acts move it: noticing, a conversation, a deal that held. There are no points.

### 3.3 Names, chosen for this audience

| Old name | v3 name | Why |
|---|---|---|
| «Тест экипажа» | **«Кто живёт внутри?»** | A question people want answered, and a natural share line |
| Crew card | **«Твоё небо»** | An inner natal chart; feels like the cards they already share. Was «Ваше небо» until the switch to «ты» (§6) |
| «Кто сегодня рулит?» | **«Кто сегодня главный?»** | Plain and playful; no steering wheel |
| Daily quest | **«Карточка дня»** with one task | The card-of-the-day habit from tarot and astrology apps, filled with your own parts |
| «Пересадка» | **«Рядом»** | The part sits beside you instead of leading: the IFS move of unblending, in human words |
| «Ваш ход» | **«Мой шаг»** | |
| «Разбор полётов» | **«Итоги недели»** | |
| «Стыковка» | **«Два неба»** | Soft, intimate and astrology-native; v1 already used it |
| Clubs | **«Созвездия»** | People who share a part form a constellation |
| SOS button | **«Меня накрыло»**, inside «Узелок» | The person's own words; no separate button |
| Trailhead | **«Узелок»** | The app already uses it; «завязать узелок на память» is a phrase everyone knows |
| Logbook | **«Твоя нить»** | The diary is the thread your knots sit on. Replaces «Дневник» |
| Dark theme | **«Небо»** | The night sky the parts live in |

**Motto:** «Здесь все свои.» All parts are welcome, and later, so are your people.

### 3.4 Positioning

- **Public line:** «Ты — не один тип. Ты — целая вселенная.» It names the product (Innerverse) and answers the type-lover's frustration.
- **For type-lovers:** «Тип — это обложка. Внутри — целая вселенная.»
- **Covers:** MBTI, Enneagram and a sun sign may be typed in by the person as a "cover" on their card. The app never measures or asserts them. This welcomes astrology fans without lying to sceptical INTJs.
- **Honesty line**, on every result: «Отражение, а не диагноз.»

### 3.5 How it looks

**The characters come from the code, never from the references.** A part is a plush sewn by the Felt Atelier engine from editor traits: shape, colour, eyes, mouth, headgear, glasses, bow, cheeks. The app maps those traits to the engine's sewing record (`feltDna`), and the engine sews it (`buildData`). Both looks are drawn from that one record:

| Look | Drawn by | Used for |
|---|---|---|
| **Felt, 3D** | The engine's WebGL plush (`feltThumbnail`, the universe) | Keepsakes on a part's page, «Мастерская», and the therapist's 3+1D universe. Never on the user's sky |
| **Doodle, 2D** | The same sewing record, drawn flat: the body in its exact felt colour with an ink outline; the same face, patch and topper; no felt texture or stitches | The user's sky, part rows, chips, test answers, feelings, practices, «Узелки», «Два неба» lists |

So every part a person crafts or restyles gets its doodle automatically, and the two always match. Nobody draws character art by hand, and no character is traced from a reference. In the app this is one function beside `toSVG` in `felt-atelier/src/flat.js` (`toDoodleSVG`). The prototype's [`doodles.mts`](research/prototype/doodles.mts) is the working draft: it runs the app's own `feltDna` and the engine, and its cast ([`cast.ts`](research/prototype/cast.ts)) uses the code's seed parts where they fit, plus parts crafted from the same editor options. Interface icons that are not parts, such as feelings and test-answer tones, use the same engine with its own expressions.

- **Palette.** Paper `#FBF4E6`, ink `#1C1830`, one sunflower-yellow primary action `#FFD43B`, lilac `#8E6CFF` for secondary actions, and pastel tints for cards. Plush colours come from the editor's palette. «Небо» turns the paper to night `#17142E`, and the sky becomes a flat indigo field with doodle stars. Doodle outlines turn to chalk. No gradients and no glow.
- **Type.** A heavy rounded display face (Rubik Black in the prototype) for headings, Onest for text, and Caveat for the parts' own lines and handwritten notes.
- **Shapes.** Ink-outlined cards with a hard offset shadow; a yellow pill button that presses like a key; speech bubbles; part rows (doodle, funny title, job, own line, stage on the path); filter chips; two-way switches.
- **The centre button.** A yellow disc holding Ariadne's labyrinth: three rings, and a red thread that runs in through every gap to a knot at the centre.
- **People.** Illustrations of the reader (onboarding, practices) use the same doodle line. They are scenes, never parts.
- **Icons.** Content icons are 3D soft objects, as in `redesign.zip`: the owner's sticker set (palette, padlock, compass, sprout, diamond, phone, open book, ringed planet, double hearts), extended in the same style. The tab bar keeps simple line icons, so the centre button stands out.
- **Textures.** Paper grain on the light page; felt fuzz and stitches on the plush; a flat sky with doodle stars in «Небо», with no nebula and no glow (the owner found the glowing 3D sky ugly); a glossy, lit edge on the yellow button.
- **References** set the mood only: [research/references/](research/references/README.md) lists what to take and what to avoid from each image.

### 3.6 How it feels: alive

It should feel like a Humongous or Amanita game: a world where everything you touch answers, small surprises reward curiosity, and nothing is a dead screen. The cast reacts to you the way Duolingo's characters do, but without guilt.

- **Everything answers your touch.** Poke a plush and it squashes, springs back and says one of its lines. The Sun giggles, stars twinkle, Луна yawns, and the thread tightens. Curious people find hidden reactions.
- **Idle life.** Plush breathe, blink and look toward your finger (`FeltCharacter` already takes a `look` direction). The sky drifts. Nothing stands still unless motion is off.
- **Motion with weight.** Springs and squash-and-stretch, 150–400 ms, transform and opacity only, 60 fps on a mid-range Android. Screens slide and fade into each other, and a plush flies from a list to its own page.
- **Celebrations sized to the act.** A knot pulls tight with a pop; a finished task drops a few felt scraps; a part that moves up its path gets a ceremony and a new patch or hat on its plush.
- **Sound and touch.** Off by default. When turned on: soft plucks, felt thumps and a quiet night sky, each with its own volume, plus a short vibration on a poke.
- **A fidget.** Any plush can be squished as a stim toy, with no goal and no score.
- **Calm mode.** With reduced motion, everything still reacts, but with fades instead of bounces.
- **Built with** the felt engine and three.js for the plush, SVG and CSS springs for doodles, and Rive or Lottie for scripted character moments where hand animation beats physics.

### 3.7 Луна knows you

Duolingo's owl knows your streak. Луна knows your sky, and she uses that knowledge to help, never to nag.

- **She talks first.** Every visit opens with Луна's line about you, with two or three quick replies, like a chat. Your answer changes what comes next.
- **She remembers, on your device:** what you picked today, your knots (time, feeling, body place, part), which steps helped, your deals and paths, your cover, and your own words.
- **She notices patterns** and says them plainly: «Вечерами чаще всего включается «А вдруг?»», «Перед дедлайнами ОТК не спит». Forecasts come from your data, not from the stars: «По понедельникам утром обычно громко. Начнём помягче?»
- **She uses your words.** If you wrote «сердце в пятки», she says «сердце в пятки», not «тревога».
- **Parts answer from history.** A part's line changes with what you did: «Спасибо за выходной. Я почти не проверял.» The loudest part writes a weekly letter in its own voice. Anniversaries come back: «Месяц назад ОТК был незнакомцем».
- **Moments that make people say "wow":**
  - the «Небо» sky shows your week (clear after a calm one) and the real moon phase;
  - plush earn patches and hats from real acts;
  - parts sit on your desk in AR (the universe already supports WebXR);
  - «Итоги сезона» is a story you want to share.
- **Trust, so it never feels creepy:**
  - **Explained.** Every remembered line has «Почему я это знаю?», which shows the knots it came from.
  - **Visible.** «Луна помнит» in Профиль lists what is stored, with «Забыть» on each item.
  - **Opt-in.** AI writing (the existing coach, memory and JITAI) runs only with consent.
  - **Local first.** Data stays on the device first, under 152-ФЗ.
  - **Never:**
    - quotes private notes in notifications or shared cards;
    - comments on food or bodies unasked;
    - uses absence to guilt-trip.

### 3.8 Humour for curious, neurodivergent and plural minds

The audience includes many autistic, ADHD and plural people (systems, including DID and OSDD), and creative people of every kind. The jokes are written for them first and work for everyone.

- **Puns and quirks:**
  - «Завяжи узелок на память. Буквально.»
  - «У нас не тараканы в голове, у нас коллектив.»
  - «Министр «Потом» одобрил этот пункт. Позже.»
  - «ОТК проверил эту шутку трижды.»
  - «Сколько у тебя сегодня ложек?»
  - «Вкладок открыто: 47. Гиперфокус: включён.»
  - «Маскировка выключена. Здесь все свои.»
  - «3:00 — время заседания отдела «А вдруг?»»
  - «Это не баг. Это часть.»
- **Rules:**
  - every joke sits next to the plain meaning, and instructions are never sarcastic;
  - never at the person's expense;
  - no jokes about hurt parts, crises, food or bodies;
  - humour switches off inside «Меня накрыло»;
  - «Говорить проще» turns off jokes and metaphors together.
- **Neurodivergent-friendly:**
  - predictable layouts and visible time;
  - practices filtered by energy («мало ложек»);
  - «Подробнее» corners for deep dives;
  - sessions to work alongside others;
  - the existing sensory settings, and no streaks.
- **Plural-friendly:**
  - an option to be addressed as «вы» («нас несколько»);
  - «Кто сегодня главный?» works as a front check-in;
  - members can leave notes for each other on «Твоя нить»;
  - flows can be finished by someone else later;
  - the app never assumes that merging is the goal.
- **Safety for dissociative experience:**
  - Innerverse is not a treatment for DID or OSDD;
  - grounding comes first, and there is no work with hurt parts in the app;
  - a plural-informed clinician reviews the flows;
  - crisis routing stays on every free-text surface.

---

### 3.9 Reminders: the day, the week, the month

The rhythm people know from The Pattern, built on what the app already has: device reminders through Firebase Cloud Messaging (`core/push.ts`, `public/firebase-messaging-sw.js`, tokens in `pushTokens`), in-app reminders with quiet hours and a skip (`core/reminder-policy.ts`). What is new is the cadence, the words and the privacy.

| Cadence | Default | Lock-screen text (no names) | Inside the app |
|---|---|---|---|
| **Daily** | 20:30, on | «Луна на связи. Минутка про сегодня?» | «Какая часть сегодня была за рулём? Угадывать необязательно.» Opens the check-in |
| **Weekly** | Sunday 19:00, off until chosen | «Неделя в небе готова.» | «Посмотрим, что было громче и что помогло. Три минуты.» Opens the week, in words |
| **Monthly** | 1st of the month, 10:00, off until chosen | «Месяц позади. Как ты?» | «Можно уточнить небо или просто выдохнуть. Оба варианта правильные.» Offers «Уточнить небо» |
| **Gentle follow-up** | Off; opt-in | «Мы тут, без спешки.» | «Вчера было непросто. Можно открыть и ничего не делать.» Only the day after «Меня накрыло» |

**Rules.**

- Opt in per cadence. The first push asks once, inside the app.
- At most one push a day across all cadences. When two fall on the same day, the weekly one wins and the daily one waits.
- Quiet hours 22:00–08:00 by default. «Пропустить сегодня» and a two-week pause are one tap each. No streaks, no counts of missed days, no guilt.
- Lock-screen privacy is on by default. A notification says nothing about parts, feelings or tests.
- Nothing is sent after a check-in that day, and nothing is sent in a red-gate state, where the app stops solo suggestions.
- Each push opens one screen: `#checkin`, `#weekly`, `#monthly` or `#sos-follow`.

**What exists and what is missing.** The app can already show a device reminder, and the service worker shows one daily notification. Until the sender is deployed, nothing schedules a push, so the weekly and monthly reminders would not send. The owner chose the existing worker (`archetypeai-worker`) to run the sender because the Firebase route needs the paid Blaze plan (§12, decision 29). The trigger is a GitHub Actions schedule, not a cron trigger (decision 29). The worker reads `pushTokens` through a Google service account key stored as a Worker secret.

**The sender (built, not deployed).** `worker-reminders.ts` decides what is due, `worker-reminder-sweep.ts` reads and sends, and `worker-google.ts` talks to Google. A GitHub Actions schedule (`.github/workflows/reminders.yml`) calls `POST /internal/reminders/run` on the worker every 15 minutes, with a bearer token in the `REMINDER_RUN_TOKEN` secret. Neither deploy file declares a cron trigger, because the Free account's five cron slots are used up. The app must write one document per person to `reminderSchedules/{uid}` with every field present: `timeZone` (IANA), `lang` (`ru` or `en`), `daily`, `weekly` and `monthly` (each with `enabled` and a time, plus a weekday or a day of the month), `quietHours` (or `null`), `skipDate`, `pausedUntil` (epoch milliseconds or `null`), `lastCheckInDay`, `lastSentDay` (dates or `null`), and `nextDueAt` (`0` asks the sender to recompute). The sender writes back `nextDueAt` and `lastSentDay`. A malformed document is parked and sends nothing. Not built yet: the app code that writes the document, a Firestore rule that lets each person write only their own document (the sender bypasses rules with its service account), and the deploy.

**In the prototype.** Ты → Напоминания shows the three cadences, the times, quiet hours, the skip and pause, the privacy switch and a lock-screen preview. It sends nothing.

## 4. The product

### 4.1 Step 1: the smallest thing that does all six jobs

1. **«Кто живёт внутри?» (7 min).** 20–25 playful scene cards: «Подруга отменила встречу за час. Кто внутри первым берёт слово?». Answers are sketch-style stickers of common reactions, so nobody feels judged. Scoring is deterministic from the answers, and every result can be edited.
2. **«Твоё небо».** Your Sun and your three to five leading parts, with their titles and an optional cover. A 1080×1920 story card and a link that invites the viewer to take the test. It always ends with a first task and the SOS move you can use tonight, never with the label alone.
3. **«Кто сегодня главный?»** Tap the loudest part (10 s) and get a «Карточка дня»: one line about that part and one task matched to it (2–5 min), such as «Дайте ОТК выходной на час» or «Министр "Потом": две минуты, не больше». A starter library of about 30 tasks.
4. **«Узелок», the centre button.** Two doors, and every knot lands on «Твоя нить», the diary:
   - **«Завязать узелок»** (30 s): how it feels (eight feelings as plush faces), where in the body (optional), which part, and a note. Built on the app's existing journal of «узелки», with plain words instead of its clinical types.
   - **«Меня накрыло»**, under two minutes:

   | Step | The person | The app |
   |---|---|---|
   | **«Меня накрыло»** | Taps «Узелок», then «Меня накрыло», or shares the message that hurt from any messenger | Opens straight to the next step |
   | **«Кто это?»** | Taps a part, «кто-то новый» (three taps) or «не знаю» | «Не знаю» is a complete answer |
   | **«Рядом»** | Drags the part from the centre to sit beside the Sun, then three breaths | Offers a line: «Спасибо, что бережёшь меня. Я с тобой — побудь рядом.» Then the before-and-after rating |
   | **«Мой шаг»** | Picks one of three concrete next steps, or their own | Saves the moment as a big knot on «Твоя нить» and on the part's page |

5. **«Два неба» lite.** Invite by link; the other person takes the test. A map of which parts get along and which collide, what to say to the other person's part, and one shared task for two. Consent per item; only cards are shared, never diary entries.

### 4.2 Later layers

- **Step 2, depth:** «Разговор» (5–10 min; Луна asks the IFS questions, you answer as the part), «Договор» (two clauses, checked at the part's next appearance), «Итоги недели», gentle briefings before known hard moments, «Глубокая карта» (the existing 64/147 instruments, scoring and provenance unchanged), Plus payments, Telegram-style sticker export.
- **Step 3, psychologists:** invites, assigned tasks and moves, consented sharing, a session digest.
- **Step 4, «Созвездия»:** a fake door and waitlist first; then small moderated circles around a shared part and a weekly shared task; matching for friendship or dating only with tested demand, a safety plan and minimal data.
- **Always:** «Мастерская» (sew and dress your parts), seasonal events, «Репетиция» (rehearse a hard conversation, from today's Replay).

### 4.3 Navigation

Five slots, the centre one raised:

- **Главная.** Before the test: the hero («Кто живёт внутри?» on a night-sky card), the button to the test, and a catalogue of parts that live in many people. After it: «Кто сегодня главный?» or today's card first, then «Твоё небо», the moon rhythm and the latest knots.
- **Части.** Your parts (the loudest three, then the rest) and **«Два неба»** as the second tab.
- **«Узелок»**, in the centre. Noticing, «Меня накрыло» and «Твоя нить». The button is one tap away on every screen outside a flow, and it is the only way into «Меня накрыло»: there is no other SOS button.
- **Практики.** The task library, filtered by «Успокоиться», «С частью» and «Для двоих», plus «Разговор» when it ships.
- **Профиль.** The theme (Светлый or «Небо»), comfort, «Созвездия», «Как это работает» and data.

The Lab holds everything without a job yet.

### 4.4 Comfort, accessibility and ND-first defaults (kept from v1)

- **«Говорить проще»** swaps every metaphor for its literal twin («Мои части» for «Твоё небо», «Заметить» for «Узелок»).
- **«По одному»:** one card at a time.
- **«Выбери за меня»:** Луна picks and says why, against choice paralysis.
- **Visible time** on every action; a low-energy mode with one-tap answers.
- **Sound off by default**; independent sensory controls; reduced motion respected.
- **Rejection-safe copy:** no "you missed", no badges for absence.
- WCAG AA, targets of at least 44 px, every gesture has a button.

### 4.5 What it reuses from today's code (from the v1 and v2 audits)

| Product element | Existing code |
|---|---|
| Plush characters, «Мастерская» | Felt engine and Felt Atelier; the editor's traits and seed parts |
| Doodles | The 2D sticker record in `felt-atelier/src/flat.js`; add `toDoodleSVG` beside `toSVG` |
| Sun and eight petals | Existing Self visuals |
| Intensity rating | Arousal −2…+2 |
| «Узелок», «Твоя нить» | The journal of «узелки» (trailheads), with plain feelings and body places instead of its clinical types |
| «Разговор», advice | The coach and inner negotiation |
| «Договор» | Charter and experiment outcomes |
| Briefings | JITAI |
| What Луна remembers | Memory |
| «Два неба» | Synastry codes and consent rules |
| «Глубокая карта» | The 64/147 instruments |
| «Репетиция» | Replay |
| Psychologist layer | Therapist link and booking |
| The therapist's 3+1 sky | The universe: `universe-scene.ts` and `universe-lens.ts` (four dimensions, axis choice, isolation, lens, WebXR) |
| «Уточнить небо» | The 14-item Quick Scan (`screens/quick-scan.jsx`) |
| Comfort controls | `sensory-preferences.ts` |

New work: the test, the card, the daily card and task library, the «Меня накрыло» flow, part arcs, the doodle renderer, Луна's greeting and memory panel, the motion layer and the share target.

### 4.6 The therapist's sky (Step 3)

A psychologist the client invites sees the client's results in the app's own 3+1-axis universe. It is reused as it is, not redrawn.

- **Axes, 3+1.** The four dimensions are the app's own: **Инициативность**, **Эмоциональность**, **Фокус внимания** and **Близость и дистанция**. Any three are X, Y and Z, and the app keeps them distinct. The fourth is isolated with one tap.
- **Where parts sit.** Each part sits at its reference position (`IV_PARTS` in the app), so every client's parts are read against the same map. Size shows how noticeable a part is.
- **Against the baseline, in words.** Each part is read against its reference baseline with four phrases, never numbers: **дремлет** (ниже обычного), **присутствует** (около обычного), **заметна** (выше обычного), **часто солирует** (заметно выше обычного). A bar shows the position, with «обычно» at the centre. No T-scores and no percentages appear in the therapist view or the report.
- **Links.** Polarizations (cycles) show when both parts are noticeable at once. A protector shows whom it guards, by name only.
- **Over sessions.** Each part's path across sessions, in words («дремлет → присутствует → заметна»), and a verdict: громче, тише or без изменений.
- **Report.** A text summary for each session: what is noticeable, what is near the usual, what is quiet, and what to look at next time. It carries no numbers.
- **Language.** Professional terms (protector, exile) are allowed here, because the audience is clinicians. The client's own view keeps the funny names.
- **Consent.** Per item: the client chooses what the therapist sees, can withdraw at any time, and every view is logged.
- **In the prototype.** The client view loads the app's universe through `bridge.js` (the app's own `initUniverse`, `setParts`, `setView` and `onPick`) and shows the same data in words. The two clients are invented.

### 4.7 What the prototype covers

Ты → Карта прототипа lists every function found in the app, with where it lives in the prototype and one of three statuses: **full** (works), **simple** (present, reduced) or **plan** (described, not built). The page is generated from the feature list in `app/copy.js`; this table summarises it.

| Area | Functions | Prototype |
|---|---|---|
| Entry | Onboarding with Луна, map gate, install, sign-in | Full: onboarding, gate, install. Simple: sign-in (no mail is sent) |
| The map | Scenes (new), quick scan (14), deep map (147), legacy map (64), history | Full: scenes, scan, the 147 in three sittings, scored by the app. Simple: the 64 (described), history |
| Sky | User's sky (2D), filters, summon, studio, part sheet, editor | Full: sky, filters, part sheet. Simple: editor (2D from the bridge). Plan: summon and studio |
| Parts | Cabinet, pins, part history, coordinates, chemistry, negotiation, rest, replay | Full: cabinet, history, coordinates (no numbers), chemistry, negotiation, rest. Simple: replay |
| Daily | Check-in with a prediction, Узелки and sealed notes, practices, SOS | Full: check-in, Узелки, sealed notes, SOS, practice steps. Simple: practice kit and the practice path |
| Coach and memory | AI coach (paid), memory panel | Full: memory panel. Simple: coach (paywall and an example) |
| Reminders | Daily, weekly and monthly; quiet hours; privacy | Full: the settings and previews. Plan: sending |
| Data | Backup, restore, cloud history, comfort and senses, share | Full: comfort and senses. Simple: backup, share |
| People | Therapist cabinet, client's 3+1D sky, report, booking | Full: cabinet, client's sky, parts, links, history, report. Simple: booking |
| Help | Help, feature map | Full |

---

## 5. Combining the best of v1 and v2

| Area | Kept from v1 | Kept from v2 | Changed in v3 |
|---|---|---|---|
| Starting point | | Jobs, not features | Jobs rewritten in the audience's words |
| World | Night sky, felt, Луна, the Sun as Self | One image only | Sky only; threads, quilt, weather and cockpit dropped |
| Model | Felt parts orbiting you | Parts with job titles and arcs | Optional archetype "second names" |
| Entry | | A short playful test instead of 147 items | Named «Кто живёт внутри?», result is «Твоё небо» |
| Daily | Moon rhythm, no streaks | 10-second check-in plus one task | Framed as «Карточка дня» |
| SOS | | Four-step loop under two minutes | «Пересадка» → «Рядом»; no cockpit; v4: «Меня накрыло» inside the centre «Узелок», no separate button |
| Look | Felt characters | | v4: one plush record, felt in 3D and a doodle in 2D; light by default, «Небо» at night |
| Relationships | «Два неба» | Dynamics, not labels; viral loop | Back to «Два неба» |
| Community | Motto «Здесь все свои» | Clubs only after a demand test | Named «Созвездия» |
| Comfort | ND-first controls, plain mode, sound off | | Unchanged |
| Money | | Plus, pairs, psychologists; Russian payments | Unchanged |
| Evidence | | Tests with pass and kill thresholds | Unchanged, renamed |
| Dropped | Feature-home table, six metaphors, quilt, weather window | Cockpit, crew, «Стыковка», «Пересадка», «Разбор полётов» | |

### 5.1 What the baby still misses: The Pattern, Boo and Duolingo

What each parent does that people love, and what Innerverse takes from it. «Have» means it is already in the plan.

| Feature | From | Innerverse version | Decision | Step |
|---|---|---|---|---|
| An eerily specific long portrait | The Pattern | «Портрет неба»: a long read from the deep map, told in your parts' voices | Adopt | 2 (Plus) |
| Timing and forecasts | The Pattern | «Погода внутри»: patterns from your own knots and calendar, never from the stars | Adapt | 2 |
| Bonds with many people | The Pattern | «Два неба» with several people; a group sky for a family, flat or team | Extend | 2 |
| Matching friends and dates by personality | Boo | «Созвездия» first, then matching by sky | After T8 | 4 |
| Interest communities ("universes") | Boo | Circles around a shared part and a shared interest or fandom | Adapt | 4 |
| A database of typed characters | Boo | «Небо персонажа»: skies of public-domain characters (Шерлок Холмс, Онегин, Алиса) that people can argue about; strong for special interests | Adopt | 2 |
| Icebreakers | Boo | Openers from two skies: «Спроси про её Министра "Потом"» | Adopt | 2 |
| A cast with personalities that reacts | Duolingo | The plush cast and Луна, alive (§3.6) | Adopt | 1 |
| Bite-size lessons with instant feedback | Duolingo | «Карточка дня» and practices | Have | 1 |
| Streaks, XP, leagues | Duolingo | The moon rhythm instead; no leagues | Reject: guilt and rejection sensitivity | – |
| Friend quests | Duolingo | The weekly task in «Два неба»; co-working in «Созвездия» | Have, extend | 1–4 |
| Badges and a shop | Duolingo | Felt patches and outfits for your plush, earned by real acts; no loot boxes, no paid status | Adapt | 2 |
| Notifications with character | Duolingo | Notes from your parts in their voices; quiet hours; never guilt | Adapt | 1 |
| Role-play, a video call with a character, "explain my answer" | Duolingo Max | «Разговор» with a part; a voice call with Луна; «Объясни моё небо» | Adopt | 2 |
| Stories | Duolingo | «Истории»: two-minute interactive stories with the plush cast, where you choose who reacts | Adopt | 2 |
| Year in review | Duolingo | «Итоги сезона», made to share | Adopt | 2 |
| Revisiting weak spots | Duolingo | A check-in with a part you haven't heard from in a while | Adopt | 2 |
| Working alongside someone | Neurodivergent tools | «Посиди со мной»: 25 minutes alongside other people, or alongside a part | Adopt | 4 |
| Front log and a board between members | Plural tools | «Кто сегодня главный?» as a front check-in; notes between members on «Твоя нить» | Adapt with care | 2–3 |
| A personal safety plan | Clinical apps | «План на чёрный день»: people, places and steps chosen in a calm moment | Adopt | 1 |
| Something to fidget with | Neurodivergent tools | A squishable plush | Adopt | 1 |
| Parts in the room | — | Your plush on your desk in AR (WebXR is already in the code) | Later | 3 |

---

## 6. Voice

- **Warm, a little mystical in tone, honest in substance.** Like a wise friend who reads Jung and laughs at herself, not like a coach or a clinic.
- **The words people use:** «накрыло», «тревожно», «откладываю», «сил ноль». No IFS or therapy terms anywhere in the interface, not even under «Подробнее» (§3.2).
- **«Ты».** Changed in v4: the owner asked for an educated guess. The audience, the references and the astrology and test apps they use all speak «ты», and «вы» reads like a clinic to them. T10 checks that «ты» doesn't cost credibility with sceptics.
- **Russian only on a Russian screen.** English is a separate locale, never mixed into the same screen.
- **Gender-neutral by construction:** impersonal and plural forms, titles of offices rather than people, and no past-tense verbs about the reader («заметил(а)»). Where a gendered form can't be avoided, the app may ask once, «Как к тебе обращаться?», and never guesses.
- **Humour reveals good intent** and never mocks the person. It switches off for hurt parts and crises.
- **Shareable without exposure:** cards, stickers («мой Шапокляк сегодня на смене») and «Два неба» cards. Every share shows «Вот что увидят» first.
- **Read it aloud.** Every line should sound like something a friend would say. Formal Russian («в рамках», «пожалуйста, обратите внимание», «Вы» in the interface) is a bug. The owner's test for v5 was «who talks like that?».
- **Comic inspiration, not copies.** Names borrow from characters people know (Шапокляк, Кролик, Тигра, Карлсон, Знайка and Незнайка, Ёжик, Чебурашка, Заяц), and every line is written fresh. Jokes aim at the situation or at the part, never at the person, and never at an exile.
- **No jokes in a crisis.** The SOS flow and the safety question are warm and plain.

---

## 7. Who pays, and how

| Door | Buyer | Budget signal | What they buy | Price to test |
|---|---|---|---|---|
| **People** | The person | Therapy at 2–4k ₽ a session; astrology and type apps sell subscriptions | **Plus:** a deep portrait of your sky, unlimited parts, «Разговор» with Луна, deals and patterns, «Глубокая карта», sticker export | 299 ₽ a month (also 199 and 399) |
| **Pairs** | One partner or both | Couples already read The Pattern's Bonds together | **Plus for two:** the full «Два неба» map, shared tasks, a guide to your recurring fight | Included in Plus; test a pair price |
| **Psychologists** | Private practice doing parts work | IFS training at 58–105k ₽; a retained client is worth about 16k ₽ a month | Client invites, assigned tasks, consented sharing, a session digest | 990–1,990 ₽ a month for up to 15 clients |

**Free forever:** the test, «Твоё небо», the daily card, «Узелок» with «Меня накрыло» and «Твоя нить», and a first «Два неба». Identity, habit and the safety net are never paywalled.

**Payments must change first.** The market is Russia and the diaspora (§12), so both paths are needed. Russian acquiring runs as самозанятый, switching to ИП before the income cap. Stripe stays for users outside Russia. In Russia, the options are Russian acquiring (ЮKassa, CloudPayments, T-Bank, Prodamus; needs an ИП, самозанятый or ООО) or Telegram Stars, which carries platform risk.

---

## 8. Safety and ethics

- **Protectors only in the app.** A young, hurt part gets gentle care, a pause and a route to a human, not an exercise.
- **Crisis routing** on every free-text surface, with the existing crisis rules.
- **Clinician review** of every flow before Step 1 launches.
- **Privacy:** sensitive psychological data under 152-ФЗ. Diary entries are never shared. «Два неба» and «Созвездия» show cards only, with consent per item.
- **«Созвездия» and matching** need a moderation plan and a safety plan before they exist.
- **No dark patterns:** no streaks, no guilt notifications, no countdown upsells.
- **SOS is a guided exercise.** Six steps: a safety question first (with 112 shown as text and a route to a person), then 4–6 breathing, grounding, naming the loudest part, one small step, and a note in «Узелки». «Выйти» is a button on every step.
- **Reminder text carries no names.** On a locked screen a push says nothing about parts, feelings or tests. Nothing is sent on a hard day unless the person opted into the gentle follow-up.

---

## 9. Tests: falsify the riskiest assumptions first

| # | Assumption | Test | Pass | If it fails |
|---|---|---|---|---|
| T1 | «Кто живёт внутри?» feels true and gets shared | Prototype with 30–50 people from type, astrology and ND communities | ≥70% finish; ≥60% rate "это про меня" 4–5/5; ≥15% share the card | Rework the scenes and the result copy |
| T2 | «Два неба» spreads and helps | Invite links from T1 | ≥25% of invitees finish the test; ≥60% "мы стали лучше понимать друг друга" | Rework the format or the invite |
| T3 | People return daily without guilt | Daily card and tasks over 14 days | Day 7 ≥25%; ≥30% finish ≥5 tasks | Rework tasks or the ritual |
| T4 | The SOS loop helps more than a pause | Randomised: «Рядом» against "breathe for 60 s" | Median shift ≥+2 against ≤+1 | Redesign the move |
| T5 | Deals hold | Check at the part's next appearance | ≥50% yes or partly | Change the deal format |
| T6 | People pay | Plus offer on day 7: 299 ₽ (199, 399) | ≥4% of week-2 actives pay | Rework what Plus contains |
| T7 | Psychologists pay | 30 parts-work psychologists offered a paid pilot | ≥5 prepay 990 ₽; ≥3 invite ≥5 clients | Consumer only |
| T8 | People want «Созвездия» | Fake door and waitlist; willingness to show the card to strangers | ≥20% of weekly actives join; ≥50% of them would show the card | Keep it to people you know |
| T9 | It is safe | Distress before and after, crisis routing, clinician review | Not worse after any loop; every signal routed | Stop and revise |
| T10 | The soft, astrology-adjacent voice and «ты» don't cost credibility | A/B the card copy with type-lovers vs. INTJ-heavy groups | Resonance within 10 points across groups | Add a «строже» voice option |
| T11 | Noticing becomes a habit between crises | «Узелок» counts in the diary study | ≥40% of week-2 actives tie ≥3 knots a week | Fold noticing into the daily card |
| T12 | The doodle and the plush read as the same character | In interviews, match six doodles to their plushes | ≥90% matched | Carry more of the plush into the doodle (patch, topper, colour) |
| T13 | Луна's memory feels welcome, not creepy | In interviews and the diary, react to her remembered lines and «Почему я это знаю?» | ≥70% "приятно" or "полезно", ≤10% "жутковато" | Remember less; ask before using a memory |
| T14 | The humour lands with neurodivergent and plural readers | Rate a joke set; watch who turns on «Говорить проще» | ≥60% like it; ≤10% confused or hurt | Rewrite the set with community readers |
| T15 | Therapists use the 3+1 sky | Eight psychologists from T7 try it with a real (consenting) client | ≥5 use it in a session and ask to keep it | Simplify to a 2D map |
| T16 | The scene test and the 147 tell the same story | 30–50 people take both. Per part, the scene tier equals the 147 tier in ≥60% of people, and within one step in ≥85%. Their top-3 parts overlap by two or more in ≥70% | Call the scenes a first sketch; keep «Уточнить небо» and the 147 as the way to firm it up |
| T17 | The points-to-level table holds for real people | Measure the scene-to-tier table against the 147 scores of the same people, then re-fit the 1–5 mapping if needed (weights live in `app/copy.js`) | Change the points per option and repeat T16 |
| T18 | The guided SOS helps more than a pause | After a real hard moment, ask which helped more: the six steps or a pause. Compare distress before and after | ≥70% say the steps helped; nobody reports more distress afterwards |
| T19 | Reminders feel welcome and quiet enough | Opt-in and opt-out rates per cadence over 14 days; complaints about quiet hours | ≥50% keep the daily one; ≤5% switch off a cadence in its first week |

**Interview guide (30 minutes, never pitch).** Ask about the last test or horoscope they took and what they did with it; whether a result ever changed what they did; the last time a reaction took over and what they tried in the next hour; the last time they didn't understand a partner or friend; how they found the people who get them; and what they pay for now and what they stopped paying for. Record episodes, not opinions.

---

## 10. Sequence (each step gated by evidence)

| Step | What | Gate to continue |
|---|---|---|
| **0. Learn** (2 weeks) | 15 interviews; a clickable prototype of the test, card, daily card and «Узелок» behind a flag; psychologist outreach with a paid pilot; payment and legal options | T1 signal, T7 interest, T12, payments decided |
| **1. Core** (3–4 weeks) | Test and card, daily card and tasks, «Узелок» with «Меня накрыло» and «Твоя нить», the doodle renderer, «Два неба» lite, share target, opt-in metrics, safety rails | T1–T4, T9–T11 |
| **2. Depth** | «Разговор», «Договор», «Итоги недели», briefings, «Уточнить небо» and «Глубокая карта», letters and a voice for Луна, «Истории», patches and outfits, Plus payments, stickers | T5, T6, T13, T16 |
| **3. Psychologists** | Invites, assigned tasks, consented sharing, session digest, the 3+1 sky | T7, T15 |
| **4. «Созвездия»** | Fake door, then circles, then matching | T8 and the safety plan |

The look in §3.5 applies inside each step as needed. It is not a separate redesign phase.

---

## 11. Risks

| Risk | Mitigation |
|---|---|
| The audience description is wrong | T1–T3 and the interviews decide before Step 2 |
| Astrology tone drives off sceptical INTJs | Covers are typed in, never measured; «Отражение, а не диагноз»; T10 and a «строже» voice |
| The test is seen as pseudo-science | Deterministic, editable, honest labels; the 64/147 instruments are there for depth |
| Heavy material alone | Protectors only, crisis routing, clinician review |
| Social and dating safety | People you know first; «Созвездия» only after T8 with moderation; matching last and opt-in |
| Scope creep across three spaces | One model and the same objects everywhere; each space gated by its test |
| Payments and platforms in Russia | The PWA is canonical, the share target works with any messenger, payments are an owner decision |
| Conflict with the `AGENTS.md` mission (implement the entire approved program) | Owner decision (§12) |
| Licensing of the 42 provided stickers in a public repo | Resolved 2026-10-28: the stickers are the owner's own work |
| Doodles drift from the plush people craft | One renderer from the sewing record; no hand-drawn character art; T12 |
| Therapy words leak into the interface (today's app shows «Менеджеры», «Пожарные», «Изгнанники») | Rename on the surface in Step 1 and keep the families internal; a copy check for the banned list in §3.2 |
| Awareness feels like surveillance | «Почему я это знаю?» on every remembered line; «Луна помнит» with «Забыть»; AI only with consent; T13 |
| Motion costs battery or frame rate | Transform and opacity only, a 60 fps budget checked on a mid-range Android, calm mode |
| Jokes confuse or hurt | Plain meaning beside every joke; literal mode; no jokes in crises; T14 |
| The scene test drifts from the 147 | One scoring pipeline (the app's own); a level table measured in the app; T16–T17 |
| Reminders become spam or leak a part's name | At most one a day, quiet hours, lock-screen text with no names, opt-in per cadence (§3.9); T19 |
| Jokes read as formal or flat | The owner reads every line aloud; T14; the formal-phrase list in §6 |
| Plural and dissociative users are destabilised | Not a treatment claim; grounding first; no work with hurt parts; plural-informed clinician review |

---

## 12. Decisions for you

1. **Focus.** Approve the jobs-first focus and the cut list, even though it departs from implementing the entire approved program. **Approved by the owner on 2026-10-28.**
2. **Audience.** Adopt your description (test and astrology lovers, Jung readers, intuitive types, ND, creative) as the working audience, validated in Step 0. **Approved by the owner on 2026-10-28.**
3. **Names.** «Кто живёт внутри?», «Ваше небо» (now «Твоё небо», see 14), «Кто сегодня главный?», «Рядом», «Два неба», «Созвездия». **Approved by the owner on 2026-10-28.**
4. **Covers.** MBTI, Enneagram and sun sign as optional covers the person types in, never measured. **Approved by the owner on 2026-10-28.**
5. **«Вы» or «ты».** Keep «вы» (your earlier decision), or test «ты» for this audience. **Approved by the owner on 2026-10-28: keep «вы», test «ты» in T10.** Superseded by 14.
6. **Social scope.** «Два неба» with people you know in Step 1; «Созвездия», then matching, only after T8 and a safety plan. **Approved by the owner on 2026-10-28.**
7. **Market and payments.** **Market approved by the owner on 2026-10-28: Russia and the Russian-speaking diaspora.** So payments need two paths: Russian acquiring for cards issued in Russia, and Stripe for everyone else. **Legal form approved on 2026-10-28: самозанятый** for Russian acquiring. Before Step 2 (Plus payments): confirm which acquirers accept самозанятых for recurring subscriptions, and plan a switch to ИП before income nears the НПД annual cap (2.4M ₽ at the time of writing; check the current limit). Telegram Stars stays optional.
8. **Research.** **Approved by the owner on 2026-10-28: the owner recruits and runs the interviews**, using the drafts in [research/step0-research-kit.md](research/step0-research-kit.md) (screener, outreach copy, interview guide, diary flow, note and synthesis templates).
9. **Safety.** A clinician reviews the flows, and a moderation plan exists before any circle. **Approved by the owner on 2026-10-28.**
10. **Look.** Felt is the 3D look and the doodle is the same shape in 2D. Both are drawn from the plush in the code, never from the references, because people craft and restyle their own parts (§3.5). **Decided by the owner on 2026-10-28.**
11. **Words.** Funny titles; no IFS or therapy terms in the interface, so newcomers are never confused or put off (§3.2). **Decided by the owner on 2026-10-28.**
12. **Navigation.** Главная · Части · «Узелок» · Практики · Профиль. The centre button holds Ariadne's labyrinth and thread, and covers noticing parts (trailheads), the diary and «Меня накрыло». No other SOS buttons (§4.3). **Decided by the owner on 2026-10-28.**
13. **Home.** The hero and a catalogue of parts before the test; today's card first after it. **Approved by the owner on 2026-10-28.**
14. **Voice.** «Ты», gender-neutral, Russian only on a Russian screen (§6). **Chosen on 2026-10-28 on the owner's instruction to make an educated guess; T10 checks it.**
15. **Theme.** Light by default; «Небо» is the dark mode. **Decided by the owner on 2026-10-28.**
16. **References.** All references saved with notes in [research/references/](research/references/README.md). **Done on 2026-10-28.**
17. **Alive.** Humongous, Amanita and Duolingo as the bar for feel: everything reacts, smooth motion, optional sound (§3.6). **Owner direction, 2026-10-28.**
18. **Aware.** Луна talks first and remembers, with explanations and a memory panel (§3.7). **Owner direction, 2026-10-28.**
19. **Humour.** Puns and quirks for curious, neurodivergent and plural minds, with literal mode and plural care (§3.8). **Owner direction, 2026-10-28.**
20. **Icons and textures** as in the references and `redesign.zip` (§3.5). **Owner direction, 2026-10-28.**
21. **The therapist's 3+1 sky** (§4.6). **Owner direction, 2026-10-28.**
22. **Tests in three depths** sharing one cast, with exiles hidden from the consumer deep map by default ([research/test-vs-instruments.md](research/test-vs-instruments.md)). **Recommended; awaiting the owner.**
23. **Voice (v6).** Quirky, natural Russian with soul; comic-character names; «Профсоюз» dropped as unclear (§3.2, §6). **Owner direction, 2026-10-28.**
24. **Skies (v6).** The user's sky is flat 2D doodles with no glow. The therapist's sky is the app's own 3+1D universe (§3.5, §4.6). **Owner direction, 2026-10-28.**
25. **Therapist view (v6).** Parts against their reference baselines, in words, with no numbers (§4.6). **Owner direction, 2026-10-28.**
26. **SOS (v6).** A guided six-step exercise, safety first, with «Выйти» as a button (§8). **Owner direction, 2026-10-28.**
27. **Tests (v6, educated guesses).** Scene points set a level from 1 to 5 for each part (1 + points, capped at 5). The app's own scoring turns levels into tiers. The 14-item quick scan keeps the app's rule (one part at 4 or more). The 147 is taken in three sittings of 49. The 64 stays as a legacy map (§9, T16–T17). **Proposed; awaiting the owner.**
28. **Reminder cadence (v6).** Daily 20:30, weekly on Sunday at 19:00, monthly on the 1st at 10:00. Quiet hours 22:00–08:00, at most one push a day, lock-screen privacy on by default (§3.9). **Proposed; awaiting the owner.**
29. **Who sends the reminders (v6).** A Cloudflare cron trigger in the existing worker (`archetypeai-worker`) was chosen because no paid plan is wanted. It was dropped: the account's five free cron slots were already in use, so a GitHub Actions schedule calls the worker instead. Scheduled Firebase functions need Blaze, so that route is out. The worker reads `pushTokens` and sends FCM messages with a Google service account key stored as a Worker secret, which the owner sets with `wrangler secret put`. Cloudflare Free limits from the docs excerpt (verify before the build): 5 cron triggers per account, a one-minute minimum interval, UTC schedules, 100,000 requests a day. The Free CPU limit is 10 ms per invocation per search excerpts, not yet confirmed on Cloudflare's own page. It caps how many reminders one run can send, so the first build must measure it. Firestore Spark quotas per the docs excerpt: 50,000 reads, 20,000 writes and 20,000 deletes a day. The docs say exceeding one can take Firestore offline for every app in the project, and they disagree on the period, so check the console. The sender must read only the reminders due in each run. FCM's Spark terms are not confirmed yet. **Decided. The sender is built in the repository and not deployed: `worker-reminder-sweep.ts`, called every 15 minutes by `.github/workflows/reminders.yml` through `POST /internal/reminders/run`. It sends nothing until the app writes `reminderSchedules/{uid}` and the deploy is approved. The free-plan CPU limit is still unmeasured.**
30. **Exile names (v6).** Чебурашка, Кот под диваном, Заяц and Крайний на фото, with tender lines and no jokes at an exile's expense. **Proposed; awaiting the owner, who should hear them read aloud.**

Nothing is implemented until you approve. After approval, the steps become Beads under `ArchetypeAI-d6d`.
