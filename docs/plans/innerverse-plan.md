# Innerverse: the plan («Вы — не один тип. Вы — целая вселенная.»)

Status: **proposal for approval. Plan only; nothing is implemented.**
Prepared 2026-10-28 on branch `claude/hopeful-franklin-jkny8n`. Version 3.

This plan **supersedes** two earlier drafts:

- **v1, Felt Cosmos** ([felt-cosmos-redesign.md](felt-cosmos-redesign.md)): a rich visual world, but organised around existing features, with six metaphors and no business model.
- **v2, jobs-first** (shared in chat, not committed): a sharp structure built on jobs, tests and money, but its cockpit and crew language («экипаж», «Стыковка», «Пересадка») sounds technical to this audience.

v3 keeps v2's skeleton and v1's soul, and changes the words to fit the people the product is for. §5 lists exactly what was kept, changed and dropped.

**Evidence limit.** v3 rests on the owner's description of the audience, the desk research in v2 (public posts, listings, surveys, prices) and the current code. No interviews were run. Every audience claim is a hypothesis with a named test (§9).

---

## 0. The whole plan on one page

**What it is.** The Pattern and Duolingo had a baby: playful daily self-discovery, rooted in IFS and other evidence-based and creative methods.

**Who it is for.** People who love personality tests, astrology apps and Jung quotes, and want real depth. They are often neurodivergent and creative, and mostly intuitive types (INTJ, INFP, ENFP, ENTP). The core of the audience is young women who already pay for The Pattern or Co–Star, read about archetypes and send each other test results.

**What they want.** To understand themselves and feel validated. To cope with inner struggles. To understand partners and friends. To find a partner and like-minded people. To play and experiment safely.

**Why today's options fail.** Self-knowledge stops at the label. A test or a horoscope makes you feel seen for a day, then says "so what?". Therapy helps, but it is slow, costly and absent at the moment a reaction takes over.

**The insight.** IFS parts are the bridge between "that's so me" and actual change. A part is as resonant as a sign or a type, because it is a character with a name and a good intention. Unlike a sign, it can be worked with: you can notice it, step back from it, talk to it and make a deal with it.

**The product: one world, one model, one daily ritual, three spaces.**

| | What | In the person's words |
|---|---|---|
| **World** | A hand-sewn night sky. You are the Sun; your parts are felt characters who live there; Луна is your guide | «Моё внутреннее небо» |
| **Model** | Your parts, each with a funny job title that honours its good intention, and an arc from stranger to ally | «Кто живёт внутри?» |
| **Daily** | «Кто сегодня главный?» (10 s) gives a «Карточка дня» with one small task (2–5 min) | the horoscope habit, made true |
| **SOS** | «Накрыло» → «Кто это?» → «Рядом» → «Мой шаг», in under two minutes | «Меня накрыло — помогите» |
| **Я** | The test, «Ваше небо» card, part pages, conversations and deals | understand and grow |
| **Два неба** | Your sky meets a partner's or friend's: which parts get along, which collide, what to say | understand the people I love |
| **Созвездия** | Small circles of people who share a part, around a weekly shared task | find my people |

**End in mind.** After six weeks you know your inner cast by name. When a part takes over, you can step back in under two minutes. You and your partner share a language («моя Перфекционистка, твой Бунтарь»). You've found a few people who get you. It was fun, and you need the app a little less than you did.

**Who pays.** People (Plus, 299 ₽ a month to test), pairs (Plus for two), psychologists (a client layer). Stripe does not serve Russia, so payments must change first.

**Next step.** Test before building: interviews, a clickable prototype of the test, card, daily ritual and SOS, then paid offers, each with pass and kill thresholds (§9).

---

## 1. The end in mind

### 1.1 Six weeks, one person (illustrative, not research)

- **Day 0.** She sees a friend's «Ваше небо» card in a chat and taps it. Seven minutes later she has her own: «Отдел контроля качества», «Министр "Потом"», «Мечтатель», with "INFP · Рыбы" as the cover she typed herself. She thinks "это вообще про меня" and posts it to her story.
- **Day 2.** Her boyfriend takes the test from her link. **«Два неба»**: her Отдел контроля качества and his Бунтарь collide before deadlines. The card tells each of them what to say to the other's part. They laugh, because it's their Sunday fight.
- **Week 1.** A sharp message from her manager. **«Накрыло»**. She names the part, lets it sit **рядом** rather than in charge, breathes three times, and chooses to reply in 20 minutes. It takes 1 min 40 s.
- **Weeks 2–3.** Each morning: «Кто сегодня главный?», then the «Карточка дня» and one small task. On a calm evening, a «Разговор» with «Министр "Потом"» ends in a «Договор»: ten minutes of "later" on a timer, then two minutes of work.
- **Week 4.** «Итоги недели»: the deal held three times out of four. She joins **«Созвездие Министров "Потом"»**, a weekly 25-minute co-working task with people who get it.
- **Week 6.** Отдел контроля качества reaches **«Союзник»**. «Мой ОТК сегодня на смене» is a kind running joke at home.

### 1.2 What success means

- **North star:** inner moments per person per week. These are check-ins, tasks done, SOS loops completed and «Два неба» replies.
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
2. **One world.** The sky, felt characters and Луна. No other metaphor gets a screen.
3. **Speak the audience's language.** Soft, warm, a little mystical in tone; honest in substance. No engineering words on the surface («стыковка», «пересадка», «экипаж», «модуль»).
4. **Validation before change.** Every part is introduced by its superpower and good intention, never by its problem.
5. **Never punish rhythm.** Moon phases, not streaks. Rest is a valid, visible choice.

---

## 3. The concept

### 3.1 One world: the inner sky

- **You are the Sun** (Self), with eight petals: Спокойствие, Ясность, Сострадание, Любопытство, Уверенность, Смелость, Творчество, Связь. The Sun never speaks; it is you.
- **Your parts are felt characters** who live in your sky, made by the existing Felt Atelier engine. Each has a name you can change and a **job title that reveals its good intention**.
- **Луна is your guide**: a sleepy, witty felt moon. She asks the questions, never diagnoses, and never claims to be your Self. «Я не свечу сама — я отражаю ваш свет.»
- **«Два неба»**: two skies side by side, like a synastry chart but with parts instead of planets.
- **«Созвездия»**: small circles of people whose skies share a part.

Everything else from v1's world (threads, knots, quilt, weather window, spools, hoop) is dropped as a metaphor. The felt material and sewing jokes stay as texture.

### 3.2 The parts: funny, kind, a little archetypal

Titles name the protective job and make people laugh with recognition. They are gender-neutral. Jung-style archetype words (Страж, Мечтатель, Бунтарь, Целительница) can appear as a part's "second name", since this audience already speaks that language, but the app never claims to type you by Jungian theory.

- «Отдел контроля качества (без выходных с 2009 года)»: the inner critic
- «Министр "Потом"»: procrastination
- «Начальник отдела "А вдруг?"»: anxiety
- «Главный по "всем ли удобно?"»: people-pleasing
- «Служба утешительных вкусняшек»: comfort eating
- «Профсоюз "Хватит"»: exhaustion

**No jokes about young, hurt parts or crises.** The humour switches off automatically when the content is heavy.

**Each part has an arc:** Незнакомец → Знакомый → Услышан → Договор → Союзник. Only real acts move it: noticing, a conversation, a deal that held. There are no points.

### 3.3 Names, chosen for this audience

| Old name | v3 name | Why |
|---|---|---|
| «Тест экипажа» | **«Кто живёт внутри?»** | A question people want answered, and a natural share line |
| Crew card | **«Ваше небо»** | An inner natal chart; feels like the cards they already share |
| «Кто сегодня рулит?» | **«Кто сегодня главный?»** | Plain and playful; no steering wheel |
| Daily quest | **«Карточка дня»** with one task | The card-of-the-day habit from tarot and astrology apps, filled with your own parts |
| «Пересадка» | **«Рядом»** | The part sits beside you instead of leading: the IFS move of unblending, in human words |
| «Ваш ход» | **«Мой шаг»** | |
| «Разбор полётов» | **«Итоги недели»** | |
| «Стыковка» | **«Два неба»** | Soft, intimate and astrology-native; v1 already used it |
| Clubs | **«Созвездия»** | People who share a part form a constellation |
| Logbook | **«Дневник»** | Everyone knows the word |

**Motto:** «Здесь все свои.» All parts are welcome, and later, so are your people.

### 3.4 Positioning

- **Public line:** «Вы — не один тип. Вы — целая вселенная.» It names the product (Innerverse) and answers the type-lover's frustration.
- **For type-lovers:** «Тип — это обложка. Внутри — целая вселенная.»
- **Covers:** MBTI, Enneagram and a sun sign may be typed in by the person as a "cover" on their card. The app never measures or asserts them. This welcomes astrology fans without lying to sceptical INTJs.
- **Honesty line**, on every result: «Отражение, а не диагноз.»

---

## 4. The product

### 4.1 Step 1: the smallest thing that does all six jobs

1. **«Кто живёт внутри?» (7 min).** 20–25 playful scene cards: «Подруга отменила встречу за час. Кто внутри первым берёт слово?». Answers are sketch-style stickers of common reactions, so nobody feels judged. Scoring is deterministic from the answers, and every result can be edited.
2. **«Ваше небо».** Your Sun and your three to five leading parts, with their titles and an optional cover. A 1080×1920 story card and a link that invites the viewer to take the test. It always ends with a first task and the SOS move you can use tonight, never with the label alone.
3. **«Кто сегодня главный?»** Tap the loudest part (10 s) and get a «Карточка дня»: one line about that part and one task matched to it (2–5 min), such as «Дайте ОТК выходной на час» or «Министр "Потом": две минуты, не больше». A starter library of about 30 tasks.
4. **SOS, under two minutes.**

   | Step | The person | The app |
   |---|---|---|
   | **«Накрыло»** | Taps the button, or shares the message that hurt from any messenger | Opens straight to the next step |
   | **«Кто это?»** | Taps a part, «кто-то новый» (three taps) or «не знаю» | «Не знаю» is a complete answer |
   | **«Рядом»** | Drags the part from the centre to sit beside the Sun, then three breaths | Offers a line: «Спасибо, что бережёшь меня. Я с тобой — побудь рядом.» Then the before-and-after rating |
   | **«Мой шаг»** | Picks one of three concrete next steps, or their own | Saves the moment to the part's page |

5. **«Два неба» lite.** Invite by link; the other person takes the test. A map of which parts get along and which collide, what to say to the other person's part, and one shared task for two. Consent per item; only cards are shared, never diary entries.

### 4.2 Later layers

- **Step 2, depth:** «Разговор» (5–10 min; Луна asks the IFS questions, you answer as the part), «Договор» (two clauses, checked at the part's next appearance), «Итоги недели», gentle briefings before known hard moments, «Глубокая карта» (the existing 64/147 instruments, scoring and provenance unchanged), Plus payments, Telegram-style sticker export.
- **Step 3, psychologists:** invites, assigned tasks and moves, consented sharing, a session digest.
- **Step 4, «Созвездия»:** a fake door and waitlist first; then small moderated circles around a shared part and a weekly shared task; matching for friendship or dating only with tested demand, a safety plan and minimal data.
- **Always:** «Мастерская» (sew and dress your parts), seasonal events, «Репетиция» (rehearse a hard conversation, from today's Replay).

### 4.3 Navigation

Four tabs: **Небо** (home: today's card, SOS, your parts) · **Два неба** · **Созвездия** · **Луна**. The SOS button is on every screen. The Lab holds everything without a job yet.

### 4.4 Comfort, accessibility and ND-first defaults (kept from v1)

- **«Говорить проще»** swaps every metaphor for its literal twin.
- **«По одному»:** one card at a time.
- **«Выбери за меня»:** Луна picks and says why, against choice paralysis.
- **Visible time** on every action; a low-energy mode with one-tap answers.
- **Sound off by default**; independent sensory controls; reduced motion respected.
- **Rejection-safe copy:** no "you missed", no badges for absence.
- WCAG AA, targets of at least 44 px, every gesture has a button.

### 4.5 What it reuses from today's code (from the v1 and v2 audits)

| Product element | Existing code |
|---|---|
| Felt characters, «Мастерская» | Felt engine and Felt Atelier |
| Sun and eight petals | Existing Self visuals |
| Intensity rating | Arousal −2…+2 |
| «Дневник» | The journal |
| «Разговор», advice | The coach and inner negotiation |
| «Договор» | Charter and experiment outcomes |
| Briefings | JITAI |
| What Луна remembers | Memory |
| «Два неба» | Synastry codes and consent rules |
| «Глубокая карта» | The 64/147 instruments |
| «Репетиция» | Replay |
| Psychologist layer | Therapist link and booking |
| Comfort controls | `sensory-preferences.ts` |

New work: the test, the card, the daily card and task library, the SOS flow, part arcs and the share target.

---

## 5. Combining the best of v1 and v2

| Area | Kept from v1 | Kept from v2 | Changed in v3 |
|---|---|---|---|
| Starting point | | Jobs, not features | Jobs rewritten in the audience's words |
| World | Night sky, felt, Луна, the Sun as Self | One image only | Sky only; threads, quilt, weather and cockpit dropped |
| Model | Felt parts orbiting you | Parts with job titles and arcs | Optional archetype "second names" |
| Entry | | A short playful test instead of 147 items | Named «Кто живёт внутри?», result is «Ваше небо» |
| Daily | Moon rhythm, no streaks | 10-second check-in plus one task | Framed as «Карточка дня» |
| SOS | | Four-step loop under two minutes | «Пересадка» → «Рядом»; no cockpit |
| Relationships | «Два неба» | Dynamics, not labels; viral loop | Back to «Два неба» |
| Community | Motto «Здесь все свои» | Clubs only after a demand test | Named «Созвездия» |
| Comfort | ND-first controls, plain mode, sound off | | Unchanged |
| Money | | Plus, pairs, psychologists; Russian payments | Unchanged |
| Evidence | | Tests with pass and kill thresholds | Unchanged, renamed |
| Dropped | Feature-home table, six metaphors, quilt, weather window | Cockpit, crew, «Стыковка», «Пересадка», «Разбор полётов» | |

---

## 6. Voice

- **Warm, a little mystical in tone, honest in substance.** Like a wise friend who reads Jung and laughs at herself, not like a coach or a clinic.
- **The words people use** on the surface: «накрыло», «триггернуло», «внутренний критик», «прокрастинация». IFS terms live under «Подробнее».
- **«Вы», not «ты».** This keeps the owner's decision. Astrology apps often use «ты», so this is worth re-testing (§12).
- **Gender-neutral by construction:** impersonal and plural forms, titles of offices rather than people.
- **Humour reveals good intent** and never mocks the person. It switches off for hurt parts and crises.
- **Shareable without exposure:** cards, stickers («мой ОТК сегодня на смене») and «Два неба» cards. Every share shows «Вот что увидят» first.

---

## 7. Who pays, and how

| Door | Buyer | Budget signal | What they buy | Price to test |
|---|---|---|---|---|
| **People** | The person | Therapy at 2–4k ₽ a session; astrology and type apps sell subscriptions | **Plus:** a deep portrait of your sky, unlimited parts, «Разговор» with Луна, deals and patterns, «Глубокая карта», sticker export | 299 ₽ a month (also 199 and 399) |
| **Pairs** | One partner or both | Couples already read The Pattern's Bonds together | **Plus for two:** the full «Два неба» map, shared tasks, a guide to your recurring fight | Included in Plus; test a pair price |
| **Psychologists** | Private practice doing parts work | IFS training at 58–105k ₽; a retained client is worth about 16k ₽ a month | Client invites, assigned tasks, consented sharing, a session digest | 990–1,990 ₽ a month for up to 15 clients |

**Free forever:** the test, «Ваше небо», the daily card, the SOS loop and a first «Два неба». Identity, habit and the safety net are never paywalled.

**Payments must change first.** Stripe stays for users outside Russia. In Russia, the options are Russian acquiring (ЮKassa, CloudPayments, T-Bank, Prodamus; needs an ИП, самозанятый or ООО) or Telegram Stars, which carries platform risk.

---

## 8. Safety and ethics

- **Protectors only in the app.** A young, hurt part gets gentle care, a pause and a route to a human, not an exercise.
- **Crisis routing** on every free-text surface, with the existing crisis rules.
- **Clinician review** of every flow before Step 1 launches.
- **Privacy:** sensitive psychological data under 152-ФЗ. Diary entries are never shared. «Два неба» and «Созвездия» show cards only, with consent per item.
- **«Созвездия» and matching** need a moderation plan and a safety plan before they exist.
- **No dark patterns:** no streaks, no guilt notifications, no countdown upsells.

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
| T10 | The soft, astrology-adjacent voice doesn't cost credibility | A/B the card copy with type-lovers vs. INTJ-heavy groups | Resonance within 10 points across groups | Add a «строже» voice option |

**Interview guide (30 minutes, never pitch).** Ask about the last test or horoscope they took and what they did with it; whether a result ever changed what they did; the last time a reaction took over and what they tried in the next hour; the last time they didn't understand a partner or friend; how they found the people who get them; and what they pay for now and what they stopped paying for. Record episodes, not opinions.

---

## 10. Sequence (each step gated by evidence)

| Step | What | Gate to continue |
|---|---|---|
| **0. Learn** (2 weeks) | 15 interviews; a clickable prototype of the test, card, daily card and SOS behind a flag; psychologist outreach with a paid pilot; payment and legal options | T1 signal, T7 interest, payments decided |
| **1. Core** (3–4 weeks) | Test and card, daily card and tasks, SOS loop, «Два неба» lite, share target, opt-in metrics, safety rails | T1–T4, T9, T10 |
| **2. Depth** | «Разговор», «Договор», «Итоги недели», briefings, «Глубокая карта», Plus payments, stickers | T5, T6 |
| **3. Psychologists** | Invites, assigned tasks, consented sharing, session digest | T7 |
| **4. «Созвездия»** | Fake door, then circles, then matching | T8 and the safety plan |

v1's visual system (felt, colour, motion, sound) applies inside each step as needed. It is not a separate redesign phase.

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
| Licensing of the 42 provided stickers in a public repo | Confirm the source and licence before the repo goes public |

---

## 12. Decisions for you

1. **Focus.** Approve the jobs-first focus and the cut list, even though it departs from implementing the entire approved program. *Recommended: yes.*
2. **Audience.** Adopt your description (test and astrology lovers, Jung readers, intuitive types, ND, creative) as the working audience, validated in Step 0. *Recommended: yes.*
3. **Names.** «Кто живёт внутри?», «Ваше небо», «Кто сегодня главный?», «Рядом», «Два неба», «Созвездия». *Recommended: yes.*
4. **Covers.** MBTI, Enneagram and sun sign as optional covers the person types in, never measured. *Recommended: yes.*
5. **«Вы» or «ты».** Keep «вы» (your earlier decision), or test «ты» for this audience. *Recommended: keep «вы», test in T10.*
6. **Social scope.** «Два неба» with people you know in Step 1; «Созвездия», then matching, only after T8 and a safety plan. *Recommended: yes.*
7. **Market and payments.** People in Russia, the diaspora, or both; Russian acquiring (which legal form?), Telegram Stars, or both; Stripe abroad. *Your answer needed.*
8. **Research.** Who recruits and talks to people. I can draft screeners, the prototype, outreach copy and the diary flow. *Your answer needed.*
9. **Safety.** A clinician reviews the flows, and a moderation plan exists before any circle. *Recommended: yes.*

Nothing is implemented until you approve. After approval, the steps become Beads under `ArchetypeAI-d6d`.
