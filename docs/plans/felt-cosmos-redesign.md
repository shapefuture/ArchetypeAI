# Felt Cosmos: the Innerverse redesign plan («Здесь все свои»)

Status: **proposal for approval. Nothing here is implemented yet.**
Prepared 2026-10-27 on branch `claude/hopeful-franklin-jkny8n`.

Inputs:

- The current React app, audited by running it at 390×844 in RU and EN, day and night. Screenshots are in [felt-cosmos/audit-current.jpg](felt-cosmos/audit-current.jpg).
- The redesign proposal (10 mockups). Contact sheet: [felt-cosmos/proposal-mockups.jpg](felt-cosmos/proposal-mockups.jpg).
- The provided asset pack (42 stickers), renamed by role in [felt-cosmos/assets/](felt-cosmos/assets/).
- A second inspiration round: five doodle-style boards sent inline during planning. They are analysed in §2A; the images themselves are not in the repo.
- Carried-forward decisions: `AGENTS.md`, `scripts/roadmap/mission.json`, [80-20-plan.md](../80-20-plan.md), [eleven-out-of-ten-plan.md](../eleven-out-of-ten-plan.md), [innerverse-plush-cosmos-plan.md](../innerverse-plush-cosmos-plan.md).

A companion visual deck (palette, type, cast, concept screens, motion demos) is published as a private artifact. This file is the source of truth.

---

## 0. The idea in one breath

Your inner world is a hand-sewn night sky. Your parts are felt plush creatures who live there. **You are the Sun** at the centre, and every part orbits you. **Луна**, a sleepy seamstress, is your guide. She does not shine by herself; she reflects your light. Your days are **knots tied on a golden thread**. A recurring pattern becomes a **red thread** that you name. Practice becomes a **patchwork quilt** that only ever grows. **Weather** is how you are today; **the sky** is who lives inside. Every claim the app makes carries a visible **stitch**: embroidered when it was measured, basted when it is a guess, handwritten when the words are yours. Common patterns are drawn as ink doodles on paper; when one becomes yours, it is **sewn into felt**.

Motto: **«Здесь все свои.»** (EN: *All parts welcome.*)

Why this concept and not another:

1. **It is already in the code.** `state-v2.ts` opens with "Trait is the map; state is the weather". The journal is called «Узелки», and its fourth step is literally «Потяните нить». The character engine is a felt-sewing engine (Felt Atelier). Parts already orbit, and coordinates already carry provenance statuses. The redesign makes visible what the product already believes.
2. **It is already in the language.** «Узелок на память», «красной нитью», «на живую нитку», «шито-крыто», «семь раз отмерь», «снять мерку», the путеводный клубок of the fairy tales, frost patterns on a window, «Поехали!». Russian, the default language, gives this world its jokes for free.
3. **It turns compliance walls into grammar.** The sample map is drawn on sewing-pattern tissue (выкройка), so nobody mistakes it for their map. A hypothesis is basted, not sewn. A rejected reading is unpicked and leaves only holes. The current paragraphs of disclaimers become things you can see at a glance.
4. **It gives play a job.** Every animation reports something true: a knot tightens because something was saved, the sun brightens because Self-энергия rose, and clouds roll in because you said so.

---

## 1. Diagnosis: why it reads as 1/10 today

Audited 2026-10-27 by running `npm run dev` and driving the app with Playwright (390×844, RU/EN, light/dark).

| # | Finding | Evidence |
|---|---|---|
| 1 | **Fake device chrome.** A drawn clock, notch and battery render inside real phones, so users see a second status bar under their real one. The app looks like a mockup of itself. | `ui/ui.jsx` `StatusBar`, always mounted in `app.jsx` |
| 2 | **No places, only overlays.** 13 features open as blurred full-screen layers over Home. In light theme the blur turns brown-grey. | `overlays.jsx`; `[data-theme='light'] .overlay` scrim at .66 (A2, A6, A7, A10) |
| 3 | **Home is a settings page.** The Base tab stacks an instruction paragraph, three route cards, "Other tools", "Support", a six-tile tool grid, a cabinet peek and a seven-row settings list. There is no "what now" and no character. | `landing.jsx` `BaseTab` (A1) |
| 4 | **Lab scaffolding shipped as product.** The Cabinet is a 9,090 px scroll with 14 stacked panels. They include developer device-measurement forms («Система · Браузер · Подключение · Сохранить данные устройства»), internal plan IDs («X01», «X02») and evaluation forms. Replay shows «Бюджет рисунков: N из M единиц» and asks the user to enter "minutes from real sessions". | `cabinet.jsx` L284–298; `replay.jsx` COPY (A5) |
| 5 | **Text walls in a legal register.** Consent boxes, «Три отдельных варианта… разные инструменты с отдельными результатами», multi-paragraph sample disclaimers. | A1, assessment intros |
| 6 | **Characters as wallpaper.** The felt plush exist but never act. Results cards show family emoji (🕊️ 🧭) instead of the characters. Cabinet art overlaps the part names. | `assessment.jsx` Results; `.part-card .pc-art` 96 px (A4, A9) |
| 7 | **Interaction means forms.** The journal is four inputs. The check-in is five jargon buttons (Замирание / Низко / В окне / Взвинченность / Гипер). Practice is a list of five «Закрыто» rows. | A2, A6, A7 |
| 8 | **The first contact with 3D is a manual.** Entering the Universe auto-opens a seven-point help sheet («…рендерер просто засыпает»), which hides the map. Below it sits an 11-button tray. | `app.jsx` `enterUniverse`; `innerverse.jsx` tray (A3) |
| 9 | **The display type loses its voice in Russian, the default language.** Titan One and Fredoka have no Cyrillic, so Russian falls back to bold Nunito everywhere. | `styles.css` L782–785 |
| 10 | **Emoji as icons.** They render differently per platform and carry unclear meaning: the 147-item Likert scale is 🙅 ✊ 🌗 👋 🎯. | A8 |
| 11 | **Leaks and slips.** The raw Firebase uid shows in Profile. Therapist tools («Мои клиенты · Матрица · ИИ-отчёт») appear on a client's report. An English headline ("Lighthouse Protocol") appears in the RU history. The journal reads «1. 1. Заметьте…» (duplicated numbering). «Шлюз карты» is jargon. | `landing.jsx` YouTab; Results; Journal |
| 12 | **Celebration in the wrong place.** Confetti rains while the user answers the future-self questions. «Получить отчёт / Загрузка…» is a fake loader that waits for a click. | `assessment.jsx` steps 2–3 |

**What is not 1/10, and is the foundation:**

- **The Felt Atelier engine:** real fibre felt, blanket stitch, squish on tap, and a 2D sticker drawn from the same stitches.
- **Strong ethics and privacy:** local-first storage and careful provenance.
- **Independent sensory controls:** motion, sound, texture and density.
- **Rich domain logic:** weather layer, unburdening moments, JITAI cards, sealed verdicts, attribution meter.

The redesign keeps all of this and gives it a face.

---

## 2. The proposal mockups: what to keep, change and drop

Overall verdict: the mockups are a real **art-direction step forward**. They bring plush cosmic characters, a cream/indigo duo, 3D sticker icons, a chunky gold primary button and a sleepy moon. But they are a **reskin of the same information architecture**. They inherit every structural problem in section 1, and they add a few:

- «Отделись от Части» breaks the «вы» rule.
- «Полностью не согласен» is gendered.
- The Likert scale uses emoji.
- The raw uid is still on screen.
- Two CTAs lead to almost the same place.

| Mockup | Works | Fails | Verdict |
|---|---|---|---|
| M1 Night map (light) | Indigo night-hill hero card, sleepy moon, chunky gold CTA, 3D family icons | «Шлюз карты» and «Во Вселенную (3D)» compete for one job; a feature list stands in for a subtitle; the mascot has no role | Keep the art direction, rebuild the screen |
| M2 Paywall | Clean, honest Stripe note, diamond hero, restore | No demonstrated value | Becomes «Полная луна» (§8.14) |
| M3 Profile (dark) | Navy and gold, plush avatar, moon with a thread swirl | Raw uid; settings promoted to a tab | Settings move to the «Вы» sheet |
| M4 Base (dark) | 3D tool tiles; cabinet carousel of fuzzy plush with energy bars | Home is a tool grid; «Кабинет» appears twice | Tiles become feature art, not navigation |
| M5 Узелки | Tangled-thread illustration (the seed of this concept), icon chips, body icon | Still a long form; uses «ты» | Becomes the knot flow (§8.5) |
| M6 Universe | The best mockup: plush with orbit rings in a dreamy cosmos | Five crowded top buttons; no Self at the centre; random composition; no relationships | Becomes the felt diorama (§8.9) |
| M7 Self | Sun «Я» with a network around it; eight quality bars | The network means nothing; bars make a dashboard; an old raw-float bug | Becomes the eight-petal Sun (§8.8) |
| M8 64 item | Big statement card, tile scale, "saved on this device" | Four navigation controls; gendered labels | Becomes the fitting screen (§8.7) |
| M9 147 item | Green progress bar | The emoji scale is ambiguous; the instruction appears twice | Becomes the moon-phase scale |
| M10 Home (light) | Profile hero with a teal felt drop; route cards with effort chips | A paragraph of instructions; three look-alike cards | Becomes the spools (§8.7) |

**Keep:** plush characters with cosmic props, the day/night duo, 3D object icons for features, the gold chunky primary, the sleepy moon, the tangled thread.
**Transform:** cards into places, mascots into actors, chips into spools, bars into petals and stitches.
**Drop:** emoji scales, feature-list subtitles, duplicate CTAs, raw identifiers, settings as a destination, dashboards of bars.

### 2A. Second inspiration round: the doodle boards

The five boards sent later share one look: cream paper, ink-outlined doodle characters, hand-lettered headlines, speech bubbles, pastel cards, yellow and lilac buttons. They add a second visual register.

**They confirm:**

- «All parts welcome» appears on board 1, which is this plan's motto word for word.
- The Self is a sun with parts in orbit.
- Progress is a winding path of milestones.
- A «Просто» toggle switches to plain language.
- There is a central capture action, and «Карта / Список» parity.
- Every practice shows minutes, footers say "not a diagnosis", and the quiz says «Здесь нет плохих ответов».

**Adopted:**

| From the boards | Becomes |
|---|---|
| Hand-lettered mega headlines | **Felt-cut lettering**: Rubik Black with a subtle roughen filter and per-letter jitter, for hero titles only (§9.2) |
| Ink-outlined doodle characters | The **sketch layer**: common archetypes, examples, samples, quiz options, feelings, life moments (§4A) |
| Speech-bubble labels on parts | Parts "speak" their role in bubbles on the map and in dialogue. Handwritten tags remain for names you wrote. |
| Pastel cards with ink outlines | Day-theme cards: a 2 px ink outline, a stitched inner line, pastel family tints |
| «Суперсила / Трудности / Как дружить» | Part-page sections: «Суперсила» · «Что тяжело» («нагрузка») · «Чего просит» («потребность») · «Как подружиться» (§8.6) |
| «Попробуй спросить» question chips | «Можно спросить» chips that open Луна with the question ready |
| Blob-face mood picker | An optional «Какое чувство?» step after Окно, using sketch-layer blobs (§8.4) |
| Audio practice with «Текстовая версия» | Audio-guided practices (later), always paired with a text version |
| Weekly insights | «Неделя в узелках»: a gentle Sunday reflection, in plural «вы» forms |
| Fantasy territory map | **Habitats** on the floating islands: a tower for the Critic, a castle for the Protector, a lake for the Anxious one (§8.9) |
| «Это нормально!» sign | A doodle sign held up at normalising moments on results |
| Lilac secondary buttons | Lilac `#8E6CFF` as the secondary brand colour (it is today's `--grape`) |
| «Кто говорит внутри?» | The first-run hook and the empty-sky title |

**Not adopted:**

- **«ты» throughout and «(а)» / «(-ой)» endings** → «вы» and plural forms. Russian past tense in «вы» is gender-neutral («вы замечали»).
- **Composition pies ("Критик 25%")** → a part is not a fraction of a person. Tiers and measured prominence are shown in stitch grammar instead.
- **Doodle characters standing in for your own parts** → your parts stay felt (owner-locked Felt identity). Doodles are their patterns (§4A).
- **Emoji or mascot faces in the nav** → stitched icons.

---

## 3. Principles (the bar every screen must clear)

1. **One screen, one job.** Reduce until the screen feels inevitable. If two controls do almost the same thing, delete one.
2. **Every motion reports a truth.** No animation exists without a state change behind it.
3. **Material honesty.** Felt is soft, thread has tension and knots tighten. No fake device chrome and no fake loaders.
4. **Provenance by stitch, not by paragraph** (§5).
5. **Every character has a job.** Luna guides, Клубок points, parts react. Nobody is wallpaper.
6. **Gentle by default, deep on demand.** Show one sentence, then «Подробнее». The full detail is never removed; it moves down one level.
7. **Never punish rhythm.** No streak debt and no guilt. Rest is a valid, visible choice.
8. **Play bends to gravity.** Jokes and bounce leave when the content is heavy (register system, §12).
9. **Plain is a setting, not a downgrade.** Every metaphor has a literal twin (§14).
10. **The same truth everywhere.** One felt identity (DNA) across card, 3D, share card and sticker.

---

## 4. The world: one metaphor system, one job per image

| Image | Means | Lives in | Plain twin |
|---|---|---|---|
| Night-felt sky (diorama) | Your inner system (traits) | Небо | «Карта частей» |
| Felt Sun with eight petals | You, the Self (eight qualities) | Centre of every sky | «Self-энергия» |
| Felt plush | A part | Everywhere | «часть» |
| **Луна** | Guide and AI coach; she reflects your light | Луна place, loading, quiet hours | «ИИ-коуч» |
| **Клубок** | Your next step | Путь, onboarding, empty states | «следующий шаг» |
| Weather | Today's state (arousal −2…+2) | Окно check-in, sky overlay | «состояние» |
| Knot | One journal entry | Garland in the sky, part stories | «запись» |
| Red thread | A recurring theme the user names | Небо, part page | «повторяющаяся тема» |
| Spool (S / M / L) | Effort of a route | Мерка chooser | «время и объём» |
| Stitch type | Provenance and epistemic status | Every claim (§5) | Status label |
| Patchwork quilt | Practice history; it only grows | Путь | «история практики» |
| Moon phases | Rhythm across days, never a streak | Путь header | «ритм» |
| Pattern paper (выкройка) | Sample or reference, not you | Sample map, 147 reference coordinates | «пример» |
| Embroidery hoop | Fourth-axis analytical slice | Обсерватория | «срез по 4-й оси» |
| Window | Window of tolerance | Check-in | «окно толерантности» |
| Small felt sack | Burden («нагрузка») | Part page | «нагрузка» |
| Puppet theatre | Replay | Путь | «репетиция» |
| Campfire | Inner negotiation | Путь, part page | «переговоры» |
| Keepsake box (шкатулка) | What the AI remembers | Луна | «память ИИ» |
| Wax-sealed envelope | Sealed verdict note | Drifts down into the sky | «отложенная заметка» |

**Metaphor budget:** at most two images in focus per screen. The cosmos is the place, felt is the material, thread is the connection, weather is the state. Each image does exactly one job.

### 4A. From sketch to stitch (how the two styles fit together)

One rule joins the doodle boards and the felt world: **a doodle is a pattern; felt is the sewn thing.**

- **Sketch layer:** ink line and flat fill on cream paper. Used for:
  - common archetypes in the «Атлас частей», examples and the sample map;
  - quiz options, feelings stickers and life moments;
  - ornaments (sparkles, hearts, motion lines) and speech bubbles.
- **Felt layer** (3D plush): your own parts, Луна, Клубок, the Sun.
- **Signature transition.** A part becomes yours at the reveal after Мерка, or when you pick an archetype in the Атлас and sew it in Мастерская. At that moment its doodle sketch on pattern paper is traced by a running stitch, and felt fills in: pattern into garment.
- **Consistency for your parts.** The Felt engine already draws a 2D sticker from the same stitches (`flat.js`). Each of your parts therefore gets its own sketch version from the same DNA, and the sketch layer stays consistent for them too.

**Атлас частей:** an illustrated glossary of common parts in the sketch style:

- Утешитель · Внутренний критик · Исследователь · Планировщик · Угодник
- Свободный дух · Защитник · Тревожный стратег · Избегающий · Уставший

It does three jobs:

1. Teaches the model before any test.
2. Gives quiz options faces.
3. Lets people say "this one is like mine", then sew their own.

Every Atlas card says it is a common pattern, not a measurement of you.

---

## 5. The stitch grammar (signature system)

The 11/10 plan requires that observation, hypothesis, reference, measurement and correction stay distinguishable. Today that is done with paragraphs. Here it is done with stitches. The four coordinate statuses that already exist (`measured | derived | reference | unknown` in `coordinates.jsx`) map onto it one to one.

| Status | Stitch | Looks like | Used for | Maps to |
|---|---|---|---|---|
| **Measured** | Satin embroidery in gold | Dense stitched outline; embroidered numerals | Canonical 64/147 results; measured coordinates | scored profile; `measured` |
| **Your words** | Handwritten felt tag | Caveat type on a tag with a tied string | Knots, corrections, goals, names you gave | user free text (kept verbatim) |
| **Reading / guess** | Basting stitch, «на живую нитку» | Long loose dashes with a 1–2 px wobble | Discovery-table readings, coach suggestions, Studio-derived coordinates | `derived`; suggestion queue |
| **Confirmed by you** | Backstitch | Tight, even stitch ending in a tiny knot | A reading you accepted | correction accepted |
| **Rejected** | Unpicked | Thread gone, holes left at 30% opacity; collapsed | History only; never resurfaces as new | e06 `rejectHypothesis` |
| **Reference / sample** | Pattern tissue (выкройка) | Translucent paper, dotted cut lines, a scissor mark | The whole sample map; 147 reference coordinates | `isSampleProfile`; `reference` |
| **Unknown** | Empty hoop | A loose thread end and «не известно, это не ноль» | Missing coordinates | `unknown` |

Rules:

- Colour is never the only carrier. Every status also has a text label and screen-reader text.
- Stitches are SVG strokes (`stroke-dasharray` patterns), so they stay crisp, cheap and themeable.
- Confirming a reading animates basting into backstitch. Rejecting animates the unpick.

---

## 6. The cast (character bible)

A cast, not a zoo: two speaking characters (Luna, and parts while in dialogue) and one pointer (Клубок).

### Луна: guide and AI coach

- **Form:** a felt crescent moon with sleepy lids, a rosy cheek and a golden thread and needle. Reference assets: #15 and #32.
- **Job:** guides, explains, coaches (AI and offline scripts), keeps the Шкатулка, hosts arrival and quiet hours.
- **Personality:** sleepy-witty, gentle, dry humour, humble. She loves sewing puns. She is a little forgetful: she remembers only what you put in the box, so privacy becomes a character trait.
- **Never:** diagnoses, claims to be your Self, jokes about pain, or uses «ты».
- **Lines:** «Я не свечу сама — я отражаю ваш свет.» · «Потянем за ниточку?» · «Не спешите. Я Луна, я никуда не денусь.» · plain mode: «Скажу проще:».
- **Expressions (8):** sleepy, yawning, curious, laughing, concerned-kind, proud, threading the needle, peeking from behind a cloud.
- **Sound:** a soft glass-chime babble of two or three pentatonic notes per phrase (off unless sound is on).

### Клубок: the next step

- **Form:** a golden felt yarn ball with two bead eyes and a loose end.
- **Job:** the only thing that moves toward a call to action. It rolls ahead and unspools a thread to the next step: the путеводный клубок of the fairy tales, and Ariadne's thread.
- **Personality:** eager-puppy energy. When you report overwhelm it gets tangled, and Luna helps untangle it. Overwhelm becomes visible and kind.

### Солнце: you, not a character

A felt sun with eight petals: Спокойствие, Ясность, Сострадание, Любопытство, Уверенность, Смелость, Творчество, Связь. Its glow is your Self-энергия. It never speaks, and copy calls it «ваше Солнце». When Self-энергия rises, the whole sky warms, because every part is lit by you.

### Parts (procedural Felt Atelier)

| Family | Colour | Idle | Tap | Hold |
|---|---|---|---|---|
| Managers | cobalt | Straighten up, tidy, check a tiny watch, adjust glasses | Stand straighter | Reluctantly relax, with a sigh |
| Firefighters | tangerine | Fidget, bounce, spin | Zoom around | Slow down and breathe with you |
| Exiles | pastel rose | Doze under a cloud blanket | A fast tap makes them hide | A gentle hold makes them peek out and come closer |
| Resources | mint | Sit, hum, glow | Warm pulse | The glow spreads to neighbours |

The exile row teaches gentleness through touch, without a word of instruction.

Event reactions:

- **Unburdening moment** (`unburdeningMoments`): the part sets down its sack, glows from inside and earns a small star on its prop.
- **Predicted flare:** a small wobble.
- **Named in a knot:** a hop.

**Typographic voices.** Each family speaks in its own type:

- Managers: a tidy checklist in Onest.
- Firefighters: bouncy Rubik Black capitals.
- Exiles: small lowercase Caveat.
- Resources: calm, rounded Onest.

Babble pitch and timbre come from the part's DNA.

**Supporting props:** Облачко, the navy cloud blanket exiles hide under (#33). The sticker people (#30, #39, #40) are "you in everyday life" and are never parts.

---

## 7. Information architecture

**Before:** 4 tabs and a FAB (База · Небо · [Узелки] · ИИ-коуч🔒 · Профиль), 13 overlays, 14 stacked Cabinet panels, 5 Practice panels, 3 Check-in panels and an 11-button Universe tray.

**After:** 4 places, 1 action, 1 personal sheet and 1 hidden lab.

```
 ┌────────────────────────────────────────────────┐
 │  Небо      Свои     ( Клубок )    Путь    Луна │   dock
 │  Карта     Части     Запись    Практики Помощь │   plain-mode labels
 └────────────────────────────────────────────────┘
 Your Sun (top-right on every place) opens the «Вы» sheet
```

### Navigation rules

- **Places** are full screens.
- **Detail** opens as a page with a shared-element transition.
- **Sheets** are only for short tasks of three steps or fewer.
- **Overlays** are only for interruptions: confirm, crisis, paywall.
- Back always works through the existing `navigation-history`, and deep links (`?go=`) keep working.
- No auto-opening modals. The 30-second install nudge and the first-entry Universe help are replaced by inline hints and one gentle card after the third visit.

### Every current feature gets a home

| Current feature | Today | New home |
|---|---|---|
| Route chooser (situation / 64 / 147 / sample / quick scan) | Base tab | **Мерка** spools: from empty Небо and «Уточнить карту» |
| Results / report | Base grid | Небо › **«Ваша карта»** story, with «Полный отчёт» |
| Check-in | Base grid overlay | Небо › Сегодня › **Окно**; also a quick chip in Луна |
| Contextual check-in, situation inquiry, discriminator | Stacked in Check-in | Inquiry = the short spool and Луна › «Разобрать ситуацию»; discriminator = the reading card inside the inquiry (stitch grammar); contextual check-in = the Окно follow-up |
| Journal | FAB overlay | FAB **Узелок** sheet, the sky garland, part stories |
| Practice path / today / goal / uncertainty / transfer / feedback / rehearsal | Practice overlay | **Путь**: path, Полярная звезда (goal), Карманные карточки (transfer), feedback becomes the delight system (§13), rehearsal becomes Театр |
| Toolkit: experiments, review, artifacts, rewards, season | practice-toolkit | Путь › Инструменты: Карточки, Повторение, Полка, Заплатки, Сезон |
| Synastry | Base grid, Universe tray | Небо › **Два неба** |
| Universe 3D | Base grid, Sky tab | Небо › «Развернуть» (pinch or button) |
| Cabinet | Base grid | **Свои** |
| Part sheet, editor, chemistry, charter, history | Sheets | Свои › **part page** and **Мастерская** |
| Archetype Studio | Universe tray | Мастерская › «Сшить по описанию» |
| Summon / search | Universe top bar | Search in Свои and Небо |
| Replay | Universe panel | Путь › **Театр** |
| Negotiation | Universe panel | Part page › «Позвать на совет»; Путь › **Костёр** |
| Coordinates | Universe panel | Part page › «Координаты»; Обсерватория |
| Rest | Universe panel | Путь › **Тихий уголок**; low-energy mode |
| List presentation (e12) | Universe panel | Небо › «Списком» (full parity without 3D) |
| Coach | Paywalled tab | **Луна** (always opens) |
| Help | Universe auto-overlay | Луна › «Как это работает», plus inline hints |
| Booking | Base support section | Луна › **«Позвать человека»** |
| Therapist overlay, specialist view | Base menu, You tab | Вы › Режим специалиста › **Обсерватория** |
| Login, Plus, install, backup / restore / export, language, theme, sensory, telemetry, reminders | Base menu, You tab | **«Вы» sheet** |
| Memory panel | Cabinet | Луна › **Шкатулка** |
| Corrections, validity | Cabinet | In context on readings (stitch grammar); Шкатулка › «Исправления» |
| Felt roles (e11) | Cabinet | Part page |
| Pocket card (e14) | Cabinet | Путь › Карманные карточки |
| Session prep (e15) | Cabinet | Луна › «К сессии» |
| Save status (e17) | Cabinet | Global thread-status indicator; details in Lab |
| Entry by need (e02) | Cabinet | Небо › Сегодня: «Что сейчас нужно?» |
| Capacity (e03) | Cabinet | Вы › Комфорт › «Сколько вопросов за раз» |
| Shared support | Cabinet | Два неба › «Общая заметка» |
| Grammar (e13), device envelope (e18), extensions (e19), evaluation rubric (e20), admin | Cabinet | **Лаборатория** (Вы › «Для исследователей»), out of consumer flows |
| Sealed verdict | Auto-moved to the journal | The envelope drifts into the sky; opening it files it as a knot |
| Map gate | Sky tab | Removed: the empty sky explains itself |
| Universe failure | Overlay | Inline: «Небо зацепилось за гвоздик» with «Показать списком» |

A **route-inventory test** (§20) asserts that every old entry point is reachable in the new UI before the old UI is removed.

---

## 8. Signature experiences

### 8.1 Arrival: the authored loading ritual

The constraint is to keep an authored arrival ritual with real readiness, honest progress and no fixed wait (80-20 plan L87).

- Luna threads a needle, and the thread stitches the logotype «Иннерверс». The length of the stitched line is driven by real readiness steps (fonts → local data → first place), never by a timer.
- If everything is ready in under 300 ms, show only a 400 ms moon blink. Returning users never wait.
- Rotating lines appear only if loading passes 600 ms: «Луна вдевает нитку…» · «Пришиваем звёзды…» · «Ваши уже собираются…».
- After 12 s, the existing slow-boot recovery choices appear.
- «Посмотреть заставку» in Вы replays it.

### 8.2 First run: a 60-second playable story

This replaces the three static slides.

1. **Luna wakes** beside a dim Sun and asks **«Кто говорит внутри?»** Three doodle sketches of common parts appear on pattern paper, each with a speech bubble: «Надо всё успеть!», «А вдруг?..», «Можно я посижу рядом?».
2. **Tap a sketch:** a running stitch traces it and it becomes a felt plush. This is the signature transition (§4A), learned in the first ten seconds. Then the plush respond to touch:
   - Tap the Planner and he adjusts his glasses.
   - Tap the Little One and she hides under the cloud; hold, and she peeks out.

   The user learns IFS by touching, not reading. Each beat carries one caption line.
3. **Luna:** «Здесь все свои.» **Клубок rolls out:** «С чего начнём?» It leads to the spools (§8.7) or to «Просто осмотреться».

Skip is always visible, and Still mode shows three captioned frames.

### 8.3 Небо (home)

**Layout at 390×844:**

- **Header (56 px):** date and moon phase in small Onest («вторник · растущая луна»); your Sun avatar on the right.
- **Sky stage (about 60% of the height):**
  - felt hills at the bottom;
  - your Sun near the centre, with glow ∝ the latest Self-энергия;
  - parts on soft orbits, placed from coordinates when known and by family otherwise, with at most 12 visible and «+N» for the rest;
  - the **knot garland**, a catenary thread across the top carrying the last 7–12 knots;
  - the real-phase moon in the corner (tap it to open Луна);
  - a weather layer from today's check-in.
- **Сегодня (one card at a time, swipeable):**
  1. «Как погода внутри?» (10 s), if not done today.
  2. «Следующий шаг» from Клубок, with the minutes it takes.
  3. One of: «Красная нить?», «Письмо вернулось» (sealed note), or a JITAI card (at most one per 24 h, as the model already caps it).
  4. End card: Luna yawns, «На сегодня всё. Небо подождёт.»

  There is no infinite feed.
- **Dock:** four tabs and the raised yarn-ball FAB.

**Interactions:**

- Tap a part: it bounces, then its page opens.
- Hold a part: squish.
- Drag a blended part off the Sun: unblend (§8.9).
- Pinch out or tap «Развернуть»: seamless zoom into 3D.

**Empty sky** (no parts yet): only the Sun (dim), Luna and one sleepy cloud. Сегодня offers «Познакомиться со своими» (spools) and «Посмотреть на примере» (on pattern paper).

### 8.4 Окно (check-in)

- A felt window frame with curtains. On the right of the frame hangs a pull cord with a bead. Drag the bead through five detents, from −2 to +2, with a haptic tick at each one.
- The weather inside the window changes, and the canonical label and a plain description sit on the sill:

| Arousal | Label (unchanged data) | Window | Sticker |
|---|---|---|---|
| −2 | Замирание | Frost patterns grow from the edges | #02 turtle in its shell |
| −1 | Низко | Fog, slow drizzle | #08 tired pillow |
| 0 | В окне | Clear, calm night sky | #10 mint calm |
| +1 | Взвинченность | Wind streaks, racing clouds | #37 scribble rain |
| +2 | Гипер | Storm, one soft lightning flash at most every 3 s | Requested: a neutral "storm" sticker |

- **Save takes one tap.** Optional follow-up chips: «Какое чувство?» · «Где в теле?» · «Кто рядом?» · «Что поможет?».
  - «Какое чувство?» is a row of sketch-layer blob faces (calm, anxious, glad, sad, irritated, tired). It records emotion, which is separate from arousal.
  - «Что поможет?» offers one practice matched to the state: activation for low, grounding for high.
- Home's sky weather updates when you return, so the result has continuity.
- Plain mode shows a five-step vertical scale with literal labels.

### 8.5 Узелок (journal), the garland and the red thread

**Flow** (FAB → sheet; a golden thread unspools across the top):

1. **«Что случилось?»** One line in handwriting (Caveat) on a felt tag. Type is a row of four felt tags: «Чувство · Тело · Мысль · Поведение» (the existing `jTrigger / jBody / jThought / jPattern`). An optional feeling sticker comes from the Tier-2 set.
2. **«Где в теле?»** A felt doll silhouette. Tap head, throat, chest, belly, arms or legs, or «не чувствую».
3. **«Кто здесь?»** Your plush, ordered by recent weather, plus «Не знаю» (a cloud with a question mark).
4. **«Потянуть нить»** (optional): «Что ей нужно?» and a free note.

**Rules and behaviour:**

- Every step can be skipped. The minimum entry is one line or one sticker.
- **«Завязать»** plays the knot-tie (§10). The knot flies into the sky garland. Toast: «Узелок завязан · Распустить» (undo).
- **Red thread.** Detection is local and deterministic: three or more knots within 14 days that share a part, a body area or a repeated word. Luna then suggests on Сегодня: «Кажется, тут красная нить: три узелка про Критика за неделю. Назовёте её?» If you name it (in your handwriting), a red thread joins those knots in the garland and appears on the part page. «Не связано» unpicks the suggestion for good.
- This is mechanic B of the 11/10 plan. No trait is ever inferred.

### 8.6 Свои (cast), the part page and Мастерская

**Свои:**

- Header: «Свои · 12 частей», search, and «Сшить» (needle button).
- Felt family tabs sewn onto the top edge.
- **A toy cupboard with shelves.** Three plush per shelf, each with a handwritten name tag on a string. Starred parts sit on the top shelf with a star pin.
- Activation shows as fidget amplitude and a hairline under the tag, not a big bar.
- **Tap:** the plush lifts off the shelf and grows into its page (shared element).
- **Long-press:** squish, then quick actions (Поговорить · Узелок · Перешить · В звёздочку).
- **Empty:** «Шкаф пока пуст» with «Снять мерку» and «Сшить первую часть».

**Part page:**

- **Hero:** the plush on a turntable (drag to rotate, tap to squish; the engine's hero LOD), name in felt-cut Rubik Black, a family ribbon, a «с 7 лет» tag and an activation glow ring.
- **A speech bubble** above the plush carries its typical line in its typographic voice («Я всё держу под контролем!»).
- **Sections, scrolled rather than tabbed:**
  - «Суперсила»: what it protects and gives; this is the role, edited inline.
  - «Что тяжело»: a sack sized by burden, with «Нагрузка» and the text.
  - «Чего просит»: the «Потребность».
  - «Как подружиться»: one matched practice, with its minutes.
  - «Можно спросить»: three question chips that open Луна with the question ready, following the IFS steps: «Чего ты боишься, если перестанешь?», «Как давно ты этим занята?», «Что тебе нужно от меня?». These are quoted scripts addressed *to the part*. They stay inside «…», which `round16-ru-address.spec.ts` already allows. Everything addressed to the user stays «вы».
  - «Как звучит»: the voice line, with an optional babble play button.
  - «Нити»: relationships and chemistry.
  - «Узелки»: linked knots on a timeline.
  - «Красные нити».
  - «Хартия».
  - «Координаты»: four axes in stitch grammar.
  - «История версий».
- **Sticky actions:** «Поговорить» (opens Луна with this part) · «Узелок» · «Перешить».

**Мастерская (sewing ritual).** Each step takes about five seconds, every step can be skipped, and «Сшить случайно» keeps the instant randomizer.

1. **Фетр:** physical felt swatches in a fan (the engine's felt library; no colour wheel).
2. **Выкройка:** 12 body templates. Scissors cut along the dotted line.
3. **Набивка:** press and hold to stuff. The shape inflates (the stuffing parameter), and releasing sets it.
4. **Лицо:** eyes, mouth and brows. Each choice is sewn on with a stitch animation.
5. **Космическая деталь:** Saturn ring, moon crest, star sprout, comet tail, orbiting moon.
6. **Оживить:** the first blink. Name it on a tag, and confirm the suggested family (from the engine's `ROLE_BODIES` priors).

**«Сшить по описанию»** (AI Archetype Studio) returns a **basted** draft. «Пришить» confirms it. `characterSeed` stays frozen on edits, as `withCharacterSeed` already guarantees.

### 8.7 Мерка (assessments): «снять мерку»

**Spools** («Выберите нитку по силам»):

- **Короткая катушка · «Один момент»:** about 2 min, no score, in your own words (situation inquiry).
- **Средняя · «Мерка отношений»:** 64 statements, about 15 min, breaks allowed.
- **Большая · «Полная мерка»:** 147 statements in three fittings of about 10 min each.
- On pattern paper below: «Посмотреть на примере» (sample, labelled as not you) · «Быстрый скан» (14 questions, not saved).
- The spools differ in physical size and amount of thread. Tapping one unspools a preview of its stitches (items).

**Promise card** (replaces the consent wall). Luna holds a card with three icons: не диагноз · ответы у вас · можно остановиться. «Читать полностью» opens the canonical `CONSENT_TEXT`. One CTA, «Понимаю. Поехали!», records consent and starts. The sample's card is printed on pattern paper.

**Question screen** (the fitting):

- The statement in large Onest 600, sentence case, never all caps.
- **The moon-phase scale:** five moons from new to full, labelled only at the ends: «Совсем не про меня» … «Точно про меня» (gender-neutral). Fill shows amount, and amount is direction-neutral.
- Auto-advance after 300 ms, with one back arrow. No duplicate navigation.
- Progress is a seam stitched across the top: one stitch per answer, 49 per fitting.
- **Neutral feedback:** every answer gets the same stitch sound and motion. Play never rewards a score direction.
- A quiet companion plush sits in the corner and blinks (body doubling, optional).
- A teacup button pauses. A tiny knot ties after each answer to show it was saved.
- «Отвечайте за себя повседневного…» appears once at the start of each fitting, then behind an (i) icon.

**Tea break between fittings.** Luna pours tea: «Первая примерка готова: 49 из 147. Ответы сохранены на этом устройстве.» Choices: [Дальше] [Позже].

**Reveal.**

1. «Сшиваем…» lasts as long as the real computation and no longer (no click-to-continue fake loader).
2. Each part first appears as its doodle sketch on pattern paper. A running stitch traces it, felt fills in, and the plush descends into the sky on its thread, landing with a squash and a blink. Tap to skip; Still mode shows a static grid.
3. The constellation name is stitched across the sky.
4. Then «Ваша карта».

### 8.8 «Ваша карта» (report as a story)

**Story chapters** (tap right or left; each has one visual, one or two sentences and a «Подробнее» drawer holding today's full content):

1. **«Сейчас вас ведёт»:** the strongest resource, glowing.
2. **«Свои»:** parts by tier, on a shelf.
3. **«Солнце»:** Self-энергия as eight petals. The number is shown only on request («56 из 100»).
4. **«Перетягивание»:** polarizations. Two plush pull one thread, and «Выслушать обоих» opens Костёр.
5. **«Сценарии»:** complexes as tiny theatre posters, each with its belief and a small experiment.
6. **«Чего просит система»:** needs.
7. **«Как вы сближаетесь»:** attachment, shown as a dance of two orbits.
8. **«Что дальше»:** one action, plus «Сохранить карту» (account).

**Around the story:**

- The classic long-form report stays one tap away («Полный отчёт»).
- A shareable constellation card (§17) closes the story.
- Specialist tools (matrix, AI report) live only in Обсерватория, never on a client's report.

### 8.9 Небо целиком (3D diorama) and Обсерватория (specialists)

**Diorama (default).** A miniature felt world in space, lit like toy photography:

- a warm key light from your Sun, a cool rim light from the sky;
- soft contact shadows and a tilt-shift depth falloff;
- cross-stitch stars and yarn threads for relationships (tension shows attachment: short and tight = anxious, long and loose = avoidant).

Parts' eyes follow your finger. One contextual bar replaces the 11-button tray: Найти · Фильтр · Вид · Ещё.

**Habitats** (from the territory-map board). Each part's floating island carries a tiny felt home that hints at its job without a legend:

| Family | Home |
|---|---|
| Managers | A lighthouse or a tidy tower |
| Firefighters | A fire station or a little volcano |
| Exiles | A nest or a cave under the cloud blanket |
| Resources | A garden or a tree |

Homes are decoration only. They never move a coordinate.

**Unblend gesture.** A part that is very active today (from check-in or knots) sits in front of the Sun, and the scene dims. Drag it aside and the light floods back, and the part settles next to you: «Пусть часть сядет рядом, а не на вас.» The core IFS move becomes physical. A button «Отделить» is the accessible equivalent.

**Обсерватория** (specialist register):

- The same scene re-lit flat and cool, with graph-paper (canvas) gridlines, axis labels and per-part numeric readouts.
- **Embroidery-hoop slicer:** a translucent hoop plane sweeps the fourth axis. Parts inside the hoop are full colour and labelled, and parts outside fade to 20%. Hoop thickness is the slice width, and the legend is always visible.
- Therapists choose any three distinct axes, and the fourth is always named. A linked table, full-vector pair comparison, source overlays and provenance badges in stitch grammar complete the workspace.
- This satisfies the 3+1 requirement in 80-20 plan §253–255 without making the consumer view clinical.

### 8.10 Путь, Лоскутное одеяло and Лунный ритм

- **Rhythm strip:** this lunar month as 29–30 small moons. Days with any practice or check-in glow gold; other days stay dark. No red marks, no counters, no "streak lost".
- **Quilt:** each practice or authored act sews a patch (the date stitched in the corner). The quilt only ever grows. A **rest patch** (a sleeping moon) is available when you choose to rest on purpose: «Тихий день — тоже практика» (existing copy, kept).
- **Path:**
  - a winding golden thread with chapter banners (Заземление «Земля, приём» · Встреча · Забота · Отношения · Интеграция);
  - stations are felt patches: sewn when done, Клубок resting on the current one, an outlined pattern when upcoming;
  - safety-gated practices show a small cloud: «Сначала найдём опору: это глубокая практика». RED gates stay exactly as they are.
  - «Закрыто» padlocks are gone: upcoming practices can be previewed.
- **«Выбери за меня»:** Клубок picks a suitable practice and says why («потому что сегодня "Низко"»).

### 8.11 Practice skins

- **Театр (Replay):** a felt puppet stage with curtains. Watch plays the beats with bobbing puppets. Director changes camera, pace and emphasis. Author tools stay text-first. Engineering checks (drawing budget, structure validation) move to the Lab.
- **Костёр (inner negotiation):** parts sit around your Sun like a campfire. Each speaks in its voice. Agreements are knots tied between them.
- **Тихий уголок (rest):** a squishable plush, a breathing moon (box or 4-7-8), and a thread to pull that winds itself back (an endless fidget). Optional rain sound.
- **Карманные карточки:** felt luggage tags holding cue → move → limit → fallback. They export as a **lock-screen wallpaper** for use outside the app (the transfer goal).
- **Полярная звезда (goal):** you sew one star in the sky with your own words.
- **Повторение (spaced review):** «Spaced repetition. Literally»; cards drift in at their interval.

### 8.12 Луна (coach and support)

- **Luna at the top** shows her state: listening, thinking (threading the needle), replying. Her bubbles are moonlit cream on indigo with a faint stitch.
- **«Позвать часть»:** a plush joins the chat. When Luna voices a part, the bubble is **basted** and labelled «догадка Луны». The AI never speaks for your part with authority.
- **Chips:** «Разобрать ситуацию» · «Что со мной сейчас?» · «Помочь части» · «К сессии».
- **Shelf:**
  - **Шкатулка:** every memory as a felt tag you can read or unpick.
  - **Позвать человека:** booking.
  - **«Если очень тяжело»:** crisis resources, always visible, never behind a paywall, no puns.
  - «Как это работает».
- **Free vs Plus.** Luna always opens. Without Plus she answers from scripts (the existing deterministic fallback); with Plus she thinks with you. She says so plainly: «Без Плюса я отвечаю по заготовкам. С Плюсом — думаю вместе с вами.»

### 8.13 Два неба (сравнение)

- **Invitation:** «Позвать в своё небо» sends one end of a thread (the existing 64-answer code). The explicit consent stays, condensed, with «Подробнее». The partner accepts, and the thread pulls taut.
- **Result:** two skies slide together. Threads connect interacting parts. The loop finder shows a knot that keeps tightening, with «Развязать» suggesting the exercise.
- **Other tools:** saved comparisons, a shared note, and JSON import under «Ещё».

### 8.14 «Полная луна» (Plus)

- A sheet in which the moon fills from crescent to full.
- Three concrete benefits with live previews.
- The price comes from Stripe, and restoring is one tap.
- No countdowns, no fake discounts and no guilt copy.

### 8.15 «Вы» (personal sheet)

The sheet holds, in order:

1. **Account card:** your Sun. It shows the email when linked. No raw uid; «Технический ID» sits behind a disclosure, for support only.
2. **Plus.**
3. **Комфорт** (§14).
4. **Язык.**
5. **Тема:** «Авто по времени суток», День, Ночь.
6. **Напоминания** and quiet hours.
7. **«Шито-крыто»** (data): copy, restore, export, delete, «Что записывается».
8. **Установить.**
9. **Режим специалиста.**
10. **«Для исследователей»** (Lab).
11. **О приложении** and version.

### 8.16 States

Each state gets a character moment and one clear action.

| State | Copy and action |
|---|---|
| WebGL failure | «Небо зацепилось за гвоздик.» [Попробовать ещё] [Показать списком] |
| Offline | A small cloud badge: «Мы на своей орбите: без сети всё работает.» |
| Storage full | «Шкатулка переполнена: сложим копию в сундучок?» |
| AI degraded | «Облака закрыли связь: отвечу по-простому, без ИИ.» Stated honestly. |
| Quiet hours | «Луна задремала до 8:00.» Crisis resources remain one tap away. |

---

## 9. Visual system

### 9.1 Colour tokens

These are starting values. A contrast script in CI (§20) validates every text and surface pair.

| Token | Night («Ночной фетр») | Day («Овсяный лён») |
|---|---|---|
| `--sky-0` deepest | `#120F26` | `#EDE3D3` |
| `--sky-1` background | `#17132F` | `#F4ECDF` |
| `--felt-1` surface | `#211B40` | `#FFFAF2` |
| `--felt-2` raised | `#2B2452` | `#F1E7D7` |
| `--line` | `rgba(244,236,222,.12)` | `rgba(31,26,56,.12)` |
| `--ink` text | `#F4ECDE` | `#1F1A38` |
| `--ink-dim` | `rgba(244,236,222,.72)` | `rgba(31,26,56,.72)` |
| `--moon` primary fill | `#F6C744` | `#F2BC2E` |
| `--moon-lip` press shadow | `#A87A12` | `#9A6E0E` |
| `--moon-text` gold as text | `#F6C744` | `#7A5600` |

| Family | Felt colour | Chip with white text |
|---|---|---|
| Managers | `#4A74D9` cobalt | `#3E66CC` |
| Firefighters | `#EF7B35` tangerine | `#C9581A` |
| Exiles | `#E792B4` pastel rose (tender, not hot magenta) | `#B9547E` |
| Resources | `#4FC79B` mint | `#21875F` |
| Self | `#FFB547` → `#FFD978` sun gradient | — |

Signal colours:

- Red thread: `#D9473F`
- Frost: `#BFDDF5`
- Calm: `#7FCDB9`
- Storm: `#6F55C2`
- Semantic colours derive from the family colours; red is reserved for danger and the red thread.
- **Lilac `#8E6CFF`** is the secondary brand colour: secondary buttons, fitting and quiz backgrounds, the sketch layer's highlight. It is today's `--grape`, so the current palette carries over.
- **Ink `#1C1830`** outlines the sketch layer and day-theme cards (2 px). Night-theme cards use felt edges instead.

**Time-of-day sky** (Тема → Авто). The sky gradient follows local time:

- Day: `#CFE3F5` → `#F4ECDF`
- Dusk: `#F7B98B` → `#B58CC9` → `#3A2E6E`
- Night: `#2A2160` → `#15122B`

Text surfaces switch at sunset and sunrise. This is also an ambient clock for people with time blindness.

### 9.2 Typography

All faces below have full Cyrillic (verified in their Fontsource packages).

| Role | Face | Weights | Use |
|---|---|---|---|
| Display | **Rubik Black** | 700, 800, 900 | Place titles, big numbers, chapter titles, speech-bubble caps. Heavy and rounded, the closest free Cyrillic match to the hand-lettered boards. |
| UI and body | **Onest** | 400, 500, 600, 800 | Everything readable. Russian-designed, crisp at small sizes. |
| Hand | **Caveat** | 500, 600 | The user's own words (knots, tags, goals, names) and Luna's handwritten asides |

**Felt-cut lettering.** Hero titles only (onboarding, place titles, the reveal, share cards) get two treatments:

- A subtle SVG roughen filter (`feTurbulence` + displacement, scale ≈2) so edges read as felt cut with scissors.
- A deterministic per-letter jitter (±3°, ±2 px) seeded from the text.

Rules:

- Words never break inside: each word is an unbreakable group, and the jitter is per letter inside it.
- The jittered letters are `aria-hidden`, with the plain text kept for screen readers.
- The treatment switches off with the texture toggle.

**Alternative:** **Unbounded** 800, which is wider, more geometric and more distinctive, but less hand-made (decision 3).

- **Scale:** 40 / 32 / 26 / 22 display; 17 / 15 / 13 body; 12 caption. Line height 1.0–1.05 for display, 1.45 for body.
- **Rules:** no all-caps paragraphs; uppercase only for 11–12 px kickers with +0.12em tracking and for short speech-bubble caps; `hyphens: auto` for `lang=ru`; `text-wrap: balance` on titles; tabular numerals for numbers that line up.
- **Measured numerals** get an embroidered outline treatment (SVG text with a stitched stroke).
- **Loading:** preload Rubik 900 and Onest 400/600 (Cyrillic and Latin) for the first view; Caveat loads lazily.
- **Easter-egg faces:** Rubik's own display siblings (for example Rubik Doodle Shadow) can appear in rare gags without adding a new family.

### 9.3 Material and texture

- **Felt grain:** SVG `feTurbulence` noise multiplied at 4–6% on surfaces. It replaces today's overlay grain and keeps the existing texture toggle.
- **Stitches:** `stroke-dasharray` SVG lines inset 6 px from card edges at 30% opacity. They are reserved for felt objects, not every container (principle 1).
- **Hand-cut radii:** slightly uneven corners on hero objects only (for example `28px 26px 30px 27px`).
- **Elevation:** felt layers instead of drop shadows. A 1.5 px deeper edge plus a soft contact shadow. Primary buttons keep the chunky press lip.
- **No blur** behind content when «Меньше прозрачности» is on.

### 9.4 Iconography and illustration tiers

- **UI icons:** a custom stitched line set on a 24 px grid. A 2 px rounded stroke plus a dashed inner stitch, about 28 icons. Emoji are replaced everywhere.
- **Illustration tiers.** A semantic rule keeps three styles coherent:

| Tier | Style | Answers | Examples |
|---|---|---|---|
| **Felt** | 3D plush (engine renders and hero art) | **who is yours**: your parts, Luna, Клубок, the Sun | #01, #14, #15, #32, #34 |
| **Sketch** | Ink-outlined doodle or die-cut sticker, flat fill, on paper | **how it feels** and **what is common**: feelings, life moments, the Атлас archetypes, examples, the sample map, ornaments, speech bubbles | #02, #08, #10, #31, #37, #42 |
| **Object** | Glossy soft 3D object | **what**: tools and features | #09, #27, #35, #13, #23 |

The sketch-to-felt transition (§4A) is the only place where a sketch becomes felt.

**Sketch-layer kit (built in code):**

- Speech bubbles with a 2 px ink outline and a tail.
- Doodle ornaments: about 30 sparkles, hearts, stars and motion lines, drawn as round-capped strokes with a slight wobble.
- The «Это нормально!» sign.
- Pastel card tints per family.

### 9.5 Layout

- A 4 pt grid with 20 px side gutters (16 px compact), respecting safe areas. Touch targets are at least 44 px.
- **Desktop and tablet: the "planetarium".** The sky fills the left pane and the current place's content sits in a right pane (max 480 px). No phone bezel on any device.

### 9.6 Component kit

`FeltButton` (primary, secondary, ghost, danger; press lip) · `FeltCard` · `Stitch` (all stitch-grammar variants) · `Thread` (SVG and rope canvas) · `Knot` · `Spool` · `MoonPhase` · `MoonScale` (Likert) · `WeatherWindow` · `BodyMap` · `Sticker` · `Patch` · `Quilt` · `PromiseCard` · `StoryPager` · `Sheet` (spring, drag to dismiss, zipper-pull handle) · `Dock` · `PartAvatar` (FeltCharacter plus behaviours) · `VoiceBubble` · `StitchedHeading` · `Toast` (with undo) · `EmptyState` · `ThreadStatus` (save indicator) · `SkyStage` (2.5D parallax).

---

## 10. Motion system

**Principles:**

- Physics over curves.
- Transform and opacity only.
- Nothing longer than 1 s blocks input, and every flourish can be skipped.
- Space is consistent: places slide in from the direction of their dock tab.

**Springs.** `press` (≈120 ms, no overshoot) · `pop` (≈380 ms, 8% overshoot) · `sheet` (≈420 ms, 2% overshoot) · `drift` (≈900 ms). Each is generated as a CSS `linear()` easing, with a cubic-bezier fallback.

**Tools:**

- **CSS** for micro-interactions.
- **GSAP** (already a dependency) for choreography.
- **View Transitions API** for navigation (shared elements `part-{id}`, `luna`), as progressive enhancement with a crossfade fallback.
- **A ~2 kB Verlet rope** for threads and the garland.

| Motion | Trigger | Choreography | Sound / haptic | Still mode |
|---|---|---|---|---|
| **Squish** | Press on felt controls and characters | scale(1.06, .92) → spring through (.98, 1.03) → 1 | tap.felt / tick | Colour and outline change |
| **Stitch-in** | An element appears | A running stitch traces the outline; content rises 6 px | soft zip | Instant |
| **Knot-tie** | Saving a knot | Loop draws (300 ms), tightens (200 ms), a ring pops (150 ms), the knot flies to the garland (450 ms). Non-blocking. | knot.pop / [12,40,18] | The knot appears in place |
| **Unpick** | Delete | Stitches pull out in sequence; the card splits into 2–3 felt pieces that drop and fade | reverse zip | Fade |
| **Roll** | Клубок guides | Rotation ∝ distance / radius; the thread trail is a rope sim | soft roll | A pointer arrow |
| **Blink and breathe** | Idle characters | Blink every 3–7 s; breathe scale 1 → 1.02 over 4 s | — | None |
| **Unblend** | Drag a part off the Sun | Sun light dims while overlapped; on release it floods back; the part settles beside | moon.chime | «Отделить» button and a fade |
| **Reveal drop** | Results | Parts descend on threads with a 250 ms stagger, squash on landing, blink | babble / tick | Static grid |
| **Weather** | Check-in | Clouds roll, frost grows from the edges (mask), one soft lightning flash at most | rain / wind | Crossfade |
| **Moon fill** | Plus sheet | Mask animates from new to full (900 ms) | chime | Static full moon |

**Modes:**

- `still` turns off all ambient motion and keeps state feedback.
- `gentle` makes ambient loops 1.5× slower.
- `lively` is the full set.
- System reduced motion always wins.
- The ambience gate (hidden page, typing, error) pauses loops, as it does today.

---

## 11. Sound and haptics

Sound stays **off by default** (constraint). There is one master toggle plus a separate «Голоса частей» toggle. Everything is synthesized in Web Audio, extending `pal/sfx.ts`, so there are no audio files.

| Sound | Synthesis | Use |
|---|---|---|
| tap.felt | 25 ms noise → low-pass 900 Hz | Felt buttons |
| bead.click | Sine 1.3 kHz for 12 ms with a 2.6 kHz partial | Toggles, detents, the scale |
| thread.zip | Noise band-pass sweep 600 → 2400 Hz | Stitch-in, sheets |
| knot.pop | Sine 280 → 880 Hz over 90 ms | Saving a knot |
| moon.chime | Triangle pentatonic triad, 600 ms decay | Luna, celebrations |
| babble | 60–90 ms formant bursts; pitch and timbre from DNA | Parts speaking |
| rain / crickets | Modulated pink noise / 4.5 kHz trills | Weather and night ambience |

Rules: output level at or below −18 dBFS, silence while the page is hidden, and every sound has a visual equivalent.

**Haptics** use the Android Vibration API (a no-op on iOS). They default to light under `gentle` and are off under `still`, with their own toggle.

| Event | Pattern (ms) |
|---|---|
| tick | 6 |
| press | 10 |
| knot | [12, 40, 18] |
| success | [10, 30, 10, 30, 40] |
| warning | [30, 60, 30] |

---

## 12. Voice, copy and humour

**Rules:**

- Always «вы». Use gender-neutral constructions («про меня / не про меня» instead of «согласен»).
- Use the glossary from `strings.ts`: «Self-энергия», «сравнение», «ИИ-коуч», «потребность», «нагрузка», «копия», «практика».
- Short sentences, verbs on buttons («Завязать», «Сшить», «Снять мерку»).
- Humour targets the world (thread, moon, sky), never the person or their pain.
- Every metaphor label has a plain twin key (`…Plain`). Existing strings are reused first (AGENTS rule).

**Register system:**

| Register | When | Effect |
|---|---|---|
| **Play** (default) | Ordinary use | Springs, puns, babble, full colour |
| **Calm** | Check-in at −1 or below, or +1 or above; exile pages; practices; heavy coach topics | Slower springs, no puns, saturation −15%, soft sounds only |
| **Gravity** | Distress or crisis signals; «Если очень тяжело» | Only essential motion, no jokes, larger text, crisis resources first |

The register switches automatically, and the user can pin one in Комфорт.

**Pun bank (RU):**

| Moment | Copy |
|---|---|
| First run, empty sky | «Кто говорит внутри?» |
| Start | «Поехали!» · before the 147: «Ключ на старт» |
| During a fitting (once) | «Здесь нет плохих ответов» |
| Normalising moment | A doodle sign: «Это нормально!» |
| Save | «Узелок завязан» |
| Delete / undo | «Распороть?» → «Распороли. [Заштопать обратно]» |
| Guess | «на живую нитку» |
| Pattern | «Кажется, тут красная нить» |
| Privacy | «Всё шито-крыто: карта хранится на этом устройстве» |
| Finished the 147 | «Семь раз отмерили» · all three fittings: «Не лыком шиты!» |
| First part | «С иголочки!» |
| Grounding | «Земля, приём» |
| Relief | «Невесомость» |
| Overwhelm | «Клубок запутался. Распутаем по ниточке?» |
| Night owl | «Тоже не спится? Давайте тихонько.» |
| Help | «Как с луны свалились? Вот как тут всё устроено.» |
| Install | «Пришейте нас к домашнему экрану» |
| Chapter done | «Глава прошита» |
| Polarization | «Перетягивание нити» |
| Unblend | «Пусть часть сядет рядом, а не на вас» |
| Exile hint | «Не спешите: подержите палец, и он выглянет» |
| Moon calendar | «Луна не влияет на ваши части, но напоминает заглянуть к ним» |

**Pun bank (EN):** "Houston, we have a feeling" (check-in) · "Knot today" (rest) · "Felt cute, might unburden later" (share card) · "Thread lightly" (gentle mode) · "Sew it begins" (onboarding) · "Darn it back" (undo) · "Loose thread" (guess) · "Everything's sewn up, on this device" (privacy) · "Spaced repetition. Literally." · "Space out (on purpose)" (rest corner) · "Ground control to Major Self" (grounding) · "Over the moon" · "Once in a blue moon" (event).

**Never use:** "lunatic", "crazy", "hang by a thread", or any joke near crisis, exiles or burdens.

**Rewrites:**

| Today | Felt Cosmos |
|---|---|
| «Три отдельных варианта. Каждый показывает…» (54 words) | «Выберите нитку по силам.» plus three spools with time labels |
| Consent box, toggle and «Начать оценку» | Promise card: three icons and «Понимаю. Поехали!» |
| «Получить отчёт · Загрузка…» (waits for a click) | «Сшиваем…» for the real compute time, then the reveal |
| «Шлюз карты» | Removed. Empty sky: «Небо пока пустое. Снимем мерку — и ваши свои появятся здесь.» |
| «Закрыто · Сначала завершите полное погружение…» | «Откроется после "Полной мерки"» with a preview |
| «Как устроено небо» (7 points) | Three inline hints, one at a time, first visit only |
| «Вселенная не проснулась» | «Небо зацепилось за гвоздик» with «Показать списком» |
| «Узелки · 0 · Пока нет узелков…» | Luna: «Ни одного узелка. Завяжите первый — на память.» |
| «v1.0 · локально · IFS-карта частей» | «Всё шито-крыто: карта хранится на этом устройстве.» |

---

## 13. Rhythm without guilt (ethical motivation)

- **Лунный ритм** replaces streaks. The month resets with the moon, and nothing is ever "lost".
- **Лоскутное одеяло:** patches for acts of authorship or practice (a knot, a named thread, a practice, a fitting, a rest day). Never for scores, and never certifying "mastery" (11/10 plan §F).
- **Patch catalogue (examples):** «Узелок на память» (first knot) · «С иголочки» (first part) · «Красной нитью» (first named thread) · «Семь раз отмерь» (147 complete) · «Земля, приём» (grounding chapter) · «Тихий день» (rest on purpose).
- **Cosmetic, authored rewards:** a part you meet often gets a tiny scarf; this is a collectible for attention, not achievement.
- **«Вместе»** (opt-in, cooperative, with a partner from Два неба): «Пять узелков благодарности на этой неделе». No leaderboards.
- **Direction-neutral feedback** on scored items is covered by a test.
- **The feedback catalogue** (e09) becomes the delight system with selection rules and dismissal memory.

---

## 14. Neurodivergent-first features (Комфорт)

All of these extend `sensory-preferences.ts` (preset plus independent controls) and stay independently controllable.

1. **«Говорить проще»:** swaps every metaphor for its literal twin. Luna announces «Скажу проще:» once.
2. **«По одному»:** one card at a time. The dock hides, with Next and Back controls and an obvious exit.
3. **«Выбери за меня»:** Клубок picks and explains why. This reduces choice paralysis.
4. **«Посидим вместе»:** a companion plush sits in the corner during long tasks (body doubling). It blinks, and sometimes "writes" too.
5. **Visible time:** every action shows minutes. Long tasks show a thread that shortens.
6. **Low-energy mode:** triggered by check-in −1/−2 or by «Мало сил». Knots take one tap with a sticker, practices are short and no typing is required. Luna: «Сегодня по минимуму — это нормально.»
7. **Тихий уголок:** squish, breathe, unwind a thread.
8. **Predictability:** no auto-modals, fixed positions, and transitions show where things come from and where they go.
9. **Copy that is safe for rejection sensitivity:** no "you missed", no badges for absence, reminders worded «если хочется».
10. **Deep-dive drawers:** «Подробнее» everywhere, and the long-form report for people who like detail.
11. **Text size** (S–XL), **contrast** (normal / high), **letter spacing** (wider option), **less transparency**.
12. **The literal label is always present** next to the weather window and other metaphors.

---

## 15. Accessibility

- WCAG AA for every token pair (CI script). Visible focus (a gold stitch ring). Targets at least 44 px.
- **The diorama is narrated** for screen readers: «В небе 12 частей. Ярче всех сегодня Критик. Погода: ветрено.» A full list or table equivalent is always available.
- Every gesture has a button (unblend, coax, squish), and every sound has a visual.
- Reduced motion gets crossfades. Lightning flashes are photosensitivity-safe: low contrast, at most one per 3 s, and disabled under `still`.
- Manual VoiceOver and TalkBack passes are pending evidence and are recorded per phase.

---

## 16. SIGGRAPH tier: rendering and interaction R&D

| # | Idea | Technique |
|---|---|---|
| R1 | **Felt shading** | `MeshPhysicalMaterial` sheen (colour and roughness) for the velvet rim, plus fibre-normal noise. Fuzz shells at hero LOD only. |
| R2 | **Toy-photography pipeline** | Warm key from the Sun (colour temperature follows Self-энергия), cool sky rim, blob contact shadows, a separable tilt-shift blur weighted by screen y |
| R3 | **Cross-stitch starfield** | Instanced quads with an X-stitch texture; twinkle as a time uniform; parallax layers |
| R4 | **Yarn threads** | TubeGeometry on Catmull-Rom curves, twisted-yarn normal map, vertex sway; tension encodes attachment |
| R5 | **The moon outside tonight** | Lunar phase computed locally (synodic month from a known new moon). Terminator as an SVG mask in 2D and a shader in 3D. |
| R6 | **Eye contact and soft-body squish** | Felt eye meshes turn toward the pointer or camera. Tapping applies a damped spring displacement around the hit point. 2D fallback: a PNG with CSS spring squash. |
| R7 | **Adaptive tiers** | Live (WebGL diorama on Home, gated by a 1 s GPU probe and the motion preference) → Still (pre-rendered sprites) → List. The Atelier FPS governor is reused. |
| R8 | **Embroidery-hoop 4D slice** | §8.9, with table sync and provenance |
| R9 | **Generative cross-stitch sampler** | Cast sprites quantized to a felt palette on a 64×64 grid, drawn as jittered X stitches, deterministic from the profile hash. Used for share art. |
| R10 | **Seamless 2.5D → 3D** | The Home sprites hold matched depth; «Развернуть» cross-dissolves into the 3D scene with a matched camera, so it feels like zooming into the same sky |
| R11 | **Sewing patterns from the engine** (experiment) | The engine inflates 2D outlines into two-sided bodies, so the inverse is direct. Export a printable выкройка (outline ×2, seam allowance, appliqué pieces, eye marks), and users can **sew their part for real**. A nod to *Plushie* (SIGGRAPH 2007), and real-world art-therapy transfer. |

---

## 17. Sharing (consent-first)

Every share shows a «Вот что увидят» preview, nothing posts automatically, and there are no tracking pixels.

- **Constellation card:** 1080×1920 and 1080×1080, in cross-stitch-sampler style. Name and art only by default.
- **Telegram sticker pack:** your parts × four expressions, plus Luna, as 512 px WebP files. Export them as files with a three-step guide for @Stickers. No bot integration. This is a Russian-native, organic channel.
- **Pocket-card wallpaper** (§8.11).
- **«Год в узелках»:** an opt-in recap computed locally.
- **Part cards** for Два неба.

---

## 18. Delight catalogue

All of these are optional, silent in the Gravity register, never block a task, and have static equivalents.

- **The sky:** the real moon phase; a blue moon («Once in a blue moon») gets a blue felt moon; eclipse day gives Luna tiny sunglasses.
- **Time of day:** the time-of-day sky; night owl mode from 00:00 to 04:00 (dimmer, whispering copy, a sleep practice offered).
- **Seasons:** felt snowflakes in winter; a New Year garland made of your knots (opt-out).
- **Luna:** tap her seven times and she sneezes stars («Апчхи! Звёздная пыль»).
- **Part gags:**
  - Long-press the Critic and he reluctantly raises a tiny «Неплохо.» sign.
  - Name a part «Колобок» and it rolls away and comes back («Я от бабушки ушёл…»).
- **Small surprises:**
  - Type «42» in search: «Ответ найден. Вопрос — пока нет.»
  - On the 100th knot, the garland becomes a constellation and Luna knits a tiny scarf.
  - On a birthday you set, parts wear party toppers.

---

## 19. Assets

### 19.1 The provided pack (42 files in `felt-cosmos/assets/`)

| # | File | Role in Felt Cosmos |
|---|---|---|
| 01 | felt-teal-drop-ring | Default avatar before you choose; onboarding part |
| 02 | sticker-turtle-hiding | Окно −2 «Замирание»; feeling sticker "hiding"; Атлас «Избегающий» |
| 03 | emoji-pinch | Not used (emoji scale retired) |
| 04 | sticker-holding-words | Feeling sticker "holding back" |
| 05 | sticker-self-hug-heart | Chapter «Забота»; self-compassion celebration |
| 06 | object-palette | Мастерская › «Сшить по описанию» (Studio) |
| 07 | object-padlock-face | Friendly Plus lock |
| 08 | sticker-tired-pillow | Окно −1 «Низко»; feeling "tired"; low-energy mode; Атлас «Уставший» |
| 09 | object-compass | Managers crest; «Мерка отношений» (64) |
| 10 | sticker-mint-calm | Окно 0 «В окне»; feeling "calm" |
| 11 | object-double-hearts | Два неба |
| 12 | object-sprout | Resources crest; «Потребность» |
| 13 | object-diamond-crown | Plus |
| 14 | felt-cocoa-drop-halo | Hero art; shading reference for R1 |
| 15 | **luna-sleepy-clouds** | **Luna: sleepy / quiet hours / Луна tab art** |
| 16 | sticker-self-soothe | Self-soothing practice; Атлас «Утешитель» |
| 17 | sticker-red-anger | Feeling "anger" (knots only, never a state label) |
| 18 | felt-grape-heart | Example cast member |
| 19 | object-extinguisher | Firefighters crest |
| 20 | sticker-sad-egg | Feeling "sad" |
| 21 | emoji-crossed-arms | Chapter «Отношения»: saying no / boundaries |
| 22 | sticker-cool-wave | Welcome; feeling "confident" |
| 23 | object-phone-moon | Install |
| 24 | sticker-anxious-drop | Feeling "anxious / small" |
| 25 | sticker-self-holds-parts | First-run hero: «Здесь все свои»; empty Свои |
| 26 | felt-cloud-planet | Sky decoration; example resource |
| 27 | object-open-book | «Ваша карта» / full report |
| 28 | felt-magenta-twins | Polarization illustration |
| 29 | felt-cocoa-drop-moon | Sky decoration; example part |
| 30 | sticker-rest-beanbag | Тихий уголок; "scrolling" firefighter knot |
| 31 | sticker-protector-shield | Protector appreciation ritual; Атлас «Защитник» |
| 32 | **luna-thread** | **Luna with thread: logo candidate, arrival, «Потянуть нить»** |
| 33 | felt-night-cloud | Облачко: the exile blanket, quiet hours |
| 34 | felt-blue-frog-ring | Example cast member |
| 35 | object-ringed-planet | «Развернуть небо» (3D) |
| 36 | felt-cloud-and-drop | "Exile under the cloud" coaxing illustration |
| 37 | sticker-overwhelm-rain | Окно +1 «Взвинченность»; «Мысль» knot type; Атлас «Тревожный стратег» |
| 38 | sticker-battery | «Полная мерка» (147) art |
| 39 | sticker-journal-bed | Empty Узелки state; evening ritual |
| 40 | sticker-grounding-hill | Chapter «Заземление» («Земля, приём») |
| 41 | felt-green-frog-ring | Example cast member |
| 42 | sticker-tiger-laptop | Атлас «Внутренний критик» (as on the doodle boards); "overwork" knot sticker |

Import pipeline: `public/art/` as AVIF with a WebP fallback, ≤30 kB each, plus an `art-manifest.ts` that maps semantic names to files, so assets can be swapped without code changes.

### 19.2 Assets to generate (requests to the owner)

Use one shared style suffix for every felt request: *"soft flocked-felt plush toy, handmade, visible blanket-stitch seams, saturated single felt colour, glossy black bead eyes, tiny rosy cheek, toy-photography lighting (warm key from upper left, cool rim light), soft contact shadow, isolated on a transparent background, centred, 1024×1024 PNG, no text."*

| Set | Contents | Priority |
|---|---|---|
| A. Luna sheet | Eight expressions matching #15/#32: sleepy, yawning, curious (one eye open), laughing, concerned-kind, proud, threading a needle, peeking from behind a navy felt cloud. Butter-yellow felt crescent with cream seams. | **P0** |
| B. Клубок | Golden yarn-ball plush with yarn wraps and bead eyes: idle, rolling, tangled (worried), proud (thread forming a heart) | **P0** |
| C. Солнце | Felt sun with eight rounded petals and calm closed-smile eyes, at four brightness levels (dim → radiant) | **P0** |
| D. Sky layers | Night (indigo felt, cross-stitch stars, felt hills), dusk, and day (oat linen, pale blue felt sky). Each as far / mid / near transparent layers, 1290×2796. | P1 |
| E. Objects (style of #09/#27/#35) | Spools S/M/L, needle and thread, quilt patch, embroidery hoop, envelope with moon wax seal, keepsake box, window with curtains (frost / clear / storm), puppet stage, felt campfire, small sack, teacup with steam, tag with string | P1 |
| F. Feeling stickers (style of #10/#16/#37) | Joy, fear, shame (hiding face), loneliness, frustration, numbness (fog), relief, pride, curiosity (magnifier), confusion (tangled yarn), boredom, gratitude, and a **neutral storm** for Окно +2 | P1 |
| G. App icon | Crescent moon trailing a golden thread to a small star knot on indigo felt, maskable with a safe zone | P1 |
| H. Chapter art (style of #40/#05) | Заземление, Встреча, Забота, Отношения, Интеграция | P2 |
| I. Атлас archetypes (ink-outlined doodle style of the boards and #31/#37/#42) | The missing common parts: Исследователь (backpack, mid-stride), Планировщик (clipboard), Угодник (hugging a big heart), Свободный дух (sunglasses, arms up), Творец (paint-splashed), Наблюдатель (calm, wide eyes), Малыш (small, under a blanket), Злюка (steaming, not monstrous). Plus a blob holding an «Это нормально!» sign. | P1 |

### 19.3 Built in code and SVG (no request needed)

- Stitched icon set, stitch-grammar strokes, threads and knots (SVG plus rope canvas).
- Moon phases from the real phase, felt noise, window weather (frost via turbulence and masks), body map, spools as a fallback, the quilt generator, the cross-stitch generator.
- Stitched headings, the zipper sheet handle, the wax seal, the hoop, weather particles.
- All sound (Web Audio).
- Part characters always come from the Felt Atelier engine (DNA preserved).

---

## 20. Technical plan

**Code layout:**

```
src/parts-cartographer/felt/        tokens.css · type.css · theme.ts (auto time of day) · motion.ts (springs, linear() presets)
                                    rope.ts (Verlet) · sound.ts (felt synth + babble) · haptics.ts · register.ts
src/parts-cartographer/felt/kit/    the components in §9.6
src/parts-cartographer/places/      sky · cast · path · moon · you · observatory · lab
public/art/                         luna · klubok · sun · stickers · objects · sky (+ art-manifest.ts)
```

- **Copy:** new RU/EN keys and `…Plain` twins live in `src/shared/i18n/strings.ts`. Existing strings are reused first.
- **Feature flag:** `ifs.ui = 'felt' | 'classic'` plus `?ui=felt` for review. Classic stays until parity is proven, then is deleted.
- **Migration:** places are rebuilt one at a time. Existing logic modules (`core/*`, `elevation/*.ts`, `shared/core/data/*`) are reused unchanged, so only presentation changes.

**Tests added:**

- **Route inventory:** every old entry point is reachable.
- **Visual snapshots:** RU/EN × day/night × still/lively × 390/768/1280.
- **axe** on every place.
- **Reduced motion:** reduced-motion snapshots match the still state.
- **Token contrast:** a unit test over every token pair.
- **Direction-neutral feedback:** answer value 1 and 5 produce identical feedback.
- **Golden fixtures:** 64/147 scores and coordinates are bit-identical before and after.
- **Repeated 3D entry:** no leaked renderers or loops.

**Budgets:**

- Initial JS ≤120 kB gzip (today 88.6).
- First-view fonts ≤180 kB.
- Home art ≤250 kB.
- LCP ≤2.5 s on a declared mid-range Android.
- The 2.5D sky holds 60 fps; 3D is adaptive (R7).

**Constraint checklist (verified each phase):**

| Constraint | How it is kept |
|---|---|
| Authored arrival ritual, no fixed wait | §8.1 |
| Felt identity and DNA | The engine stays the only character source |
| Independent sensory controls | §11 and §14; sound off by default |
| Assessment-free support | Luna and booking open without any test |
| Canonical 64/147 provenance | Stitch grammar and golden fixtures |
| Complete therapist 3+1 workspace | §8.9 |
| «вы» and glossary | Copy rules (§12) |
| React only | No Angular code, packages or targets |

---

## 21. Roadmap

Each phase ships behind the flag and is demoable. Sizes are relative: M is about 1 week of focused agent work, L about 2, XL about 3.

| Phase | Name | Scope | Acceptance (in addition to tests staying green) | Size |
|---|---|---|---|---|
| P0 | **The felt is real** | Tokens (day / night / auto), fonts and felt-cut lettering, kit primitives including the sketch-layer kit (bubbles, ornaments, pastel tints), motion / sound / haptics libraries, art pipeline (42 assets + manifest), remove the fake status bar, the flag | A Lab "kit" page renders every primitive in RU/EN × day/night × still/lively; contrast script passes; classic UI visually unchanged | M |
| P1 | **Everything has a home** | New dock, places scaffold, «Вы» sheet, Lab, View Transitions, panels moved (not rewritten), no auto-modals | Route inventory green; deep links and back/forward intact; landmarks and focus order verified | M |
| P2 | **The daily loop** | Небо (2.5D sky, Сегодня), Окно, Узелок, garland, red-thread suggestion | Check-in ≤10 s and knot ≤20 s in scripted runs; complete in Still and Plain; arousal and journal data models unchanged; observed first-use sessions pending participants | L |
| P3 | **Meet your own** | Свои shelves, part page (суперсила, «Можно спросить»), family behaviours, Мастерская ritual, Studio as a basted draft, **Атлас частей** with sketch→felt sewing | A part can be created in ≤60 s; `characterSeed` stable; everything from the old sheet, editor, chemistry, charter and history is present; 32 px silhouette test | L |
| P4 | **Measured with care** | Spools, promise card, fitting screen, tea break, sketch→felt reveal, story report, stitch grammar everywhere, sample on pattern paper | Golden 64/147 fixtures identical; every claim shows its provenance; feedback direction-neutral; the sample cannot be mistaken for real (visual, label and screen reader) | L |
| P5 | **Rhythm without guilt** | Путь, quilt, lunar rhythm, patches, Театр, Костёр, Тихий уголок, pocket cards and wallpaper, goal, review | No streak counters or loss copy; rest is representable; text alternatives for every practice; safety gates unchanged | L |
| P6 | **A guide with a face** | Luna persona and expressions, chat restyle, part-in-dialogue with basted attribution, Шкатулка, booking entry, crisis always visible, Plus explanation | Request / cancel / retry / degraded states truthful; memory inspectable and deletable; crisis reachable in ≤2 taps from anywhere | M |
| P7 | **SIGGRAPH pass** | R1–R8 and R10; Обсерватория shell with the hoop slicer | 60 fps on the declared device or graceful tier fallback; no coordinate drift (golden test); full list and table fallback; therapist rules tests green | XL |
| P8 | **Worth showing** | Sound pack and babble, easter eggs, seasons, constellation card (R9), Telegram export, «Год в узелках», R11 experiment | Everything optional; preview before every share; the Gravity register suppresses all gags | M |
| P9 | **Earn the 10** | Performance traces, manual VoiceOver/TalkBack, neurodivergent review sessions, blind builder/critic comparisons per task against reference products, classic UI removed | 11/10 rubric dimensions with recorded evidence; an independent critic prefers Felt Cosmos on each core task; observed and participant evidence recorded as actual or pending | M |

After approval, these phases become Beads under the elevation root (`ArchetypeAI-d6d`), with the acceptance text above. The `bd` binary is missing in this container: run `scripts/roadmap/cloud-setup.sh` first.

---

## 22. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Scope explosion | Phases behind a flag; each phase ships; the route inventory prevents feature loss |
| Metaphor overload | One job per image; a budget of two per screen; Plain mode |
| Playfulness against trauma content | Register system; no puns in Calm or Gravity; crisis copy reviewed by a person |
| Low-end Android performance | 2.5D Home by default; the Live tier gated by a probe; budgets enforced in CI |
| AI-asset style drift | Tier rule; one prompt suffix; review a lineup sheet before import |
| Heavy display type and long Russian words | Size caps, `hyphens: auto`, unbreakable word groups in felt-cut titles, wrap tests using the longest strings |
| Two illustration styles drifting apart | One rule (§4A): sketch = pattern or feeling, felt = yours; the sketch→felt transition is the only bridge |
| Breaking acceptance-critical behaviour | Constraint checklist and golden fixtures every phase |
| Gestures excluding some users | A button for every gesture; screen-reader actions |
| Sound annoyance | Off by default; a separate voices toggle; the ambience gate |
| EN humour landing flat | A separate EN pun bank; native review |

---

## 23. Decisions for you

Each decision has a recommended default.

1. **Core concept:** Felt Cosmos with the thread grammar (Луна-швея, Клубок, узелки, stitch grammar). *Default: yes.*
2. **Dock:** Небо · Свои · Узелок · Путь · Луна, with Plain twins, and settings moved to «Вы». *Default: yes.*
3. **Display face:** Rubik Black with felt-cut lettering (closest to the doodle boards) or Unbounded (wider, more geometric). *Default: Rubik Black.*
4. **Theme default:** «Авто по времени суток». *Default: yes.*
5. **Real lunar calendar** in the rhythm strip, with the self-aware joke. *Default: yes.*
6. **Brand:** «Иннерверс» with the moon-and-thread mark (#32) replacing «PARTS.», «Иннерсфера» and «картограф частей» in UI. *Default: yes.*
7. **Telegram sticker export** and the **sewing-pattern export** experiment. *Default: yes for both, in P8.*
8. **Asset sets** you will generate (§19.2). P0 needs A, B and C.
9. **Обсерватория** redesign in this program (P7) or later. *Default: P7.*
10. **Sketch layer:** ink doodles for common patterns, feelings, examples and the Атлас; felt for your own parts; sketch→felt as the signature transition. *Default: yes.*

---

## Appendix A. Idea atlas: every orthogonal dimension

Each row is an independent axis of improvement. **Adopted** ideas are in the plan above. **Next** ideas are small and well-scoped, and fit after their phase. **Experiments** need a prototype and a ship / iterate / stop decision.

| Dimension | Adopted | Next | Experiments |
|---|---|---|---|
| World and metaphor | Felt cosmos, thread grammar, sky = traits, weather = state (§0, §4) | Season of practice tints the horizon (ties to Сезон) | — |
| Characters | Luna, Клубок, the Sun, family behaviours, typographic voices (§6) | Cosmetic "wear" for parts you visit (§13) | «Письмо от части» after an unburdening: an AI draft shown basted, edited and kept by you |
| Gesture | Squish, hold to coax, drag to unblend, pull cord, pinch to expand (§8) | Draw a thread between two parts to propose a relationship (user-authored, shown apart from computed ones) | Shake to tumble (Android, optional) |
| Motion | Springs, signature motions, View Transitions, rope garland (§10) | The garland sways with scroll velocity | Device-tilt parallax on the sky (opt-in) |
| Sound and haptics | Felt synth, babble, haptic patterns (§11) | Haptic breathing metronome in Тихий уголок | Sleep soundscape for night-light mode |
| Copy and humour | Pun banks, Plain twins, registers (§12) | «Лунная записка»: one IFS-flavoured line a day («Сегодня можно спросить Критика, чего он боится») | Seasonal copy packs |
| IA and navigation | Four places, one action, «Вы», Lab (§7) | PWA manifest shortcuts («Завязать узелок», «Погода внутри», «Луна») · Web Share Target: text shared from another app becomes a knot draft · search across parts, knots and threads | — |
| Rituals and time | Time-of-day sky, lunar rhythm (§8.10, §9.1) | New-moon intention (Полярная звезда); full-moon thanks to a protector (#31); a five-minute weekly «Воскресная примерка» of the week's knots | Evening wind-down sequence |
| Progress | Quilt, patches, rest patch, «Вместе» (§13) | «Машина времени неба»: scrub through your assessment history and watch your sky change | — |
| Insight and visualisation | Stitch grammar, petals, tug of war, theatre posters, orbit dance (§8.8) | Weather calendar: a month of felt weather, with basted "you might notice…" observations and never a trait claim | "Who flares when" heatmap (Обсерватория only) |
| Social | Два неба, shared note (§8.13) | A consensual postcard knot sent to a partner's sky | A therapist and client sharing one sky in session |
| Sharing | Constellation card, Telegram stickers, wallpaper, recap (§17) | A printable deck of part cards for therapy sessions (PDF) | AR quick look of a part (three.js GLTF/USDZ export, iOS `rel="ar"`) · sewing-pattern export (R11) |
| Accessibility and neurodivergence | §14, §15 | «Ночник»: a full-screen breathing moon that dims itself, for anxious nights · «Объясни этот экран»: Luna reads the current screen in plain words | Dyslexia-spacing study |
| Rendering | R1–R10 (§16) | Fibre micro-sheen as light passes | A cheap Verlet cloth for the cloud blanket |
| Platform and OS | Install moment («Пришейте нас…»), offline cloud badge | Badging API for due sealed notes · a quick action in notifications («Отметить погоду») | — |
| Trust and safety | Шкатулка, «шито-крыто», crisis always visible, registers | A "what Luna will see" preview before each AI request, styled as a bundle of felt tags you hand her (11/10 plan §G) | A quick-hide gesture for use in shared spaces |
| Specialist | Обсерватория, hoop slicer (§8.9) | A "weather since last session" strip per client · session-prep agenda card | — |
| Content production | — | A puppet-scene editor for Театр in the Lab (on the existing e13 grammar) · a Luna line library tagged by register | — |
| Monetisation ethics | «Полная луна» without dark patterns (§8.14) | Gift codes that therapists can give clients | Regional pricing (a business decision) |
| Performance as a feature | Local-first instant start, budgets in CI (§20) | The sky itself is the loading skeleton | — |
