# The 7-minute test against the 64 and the 147

How the prototype's entry test («Кто живёт внутри?») compares with the two instruments already in the app: the 64-item «Рефлексия» and the 147-item «Погружение». Written 2026-10-28 from the code on `main` (`src/shared/core/data/scoring.ts`, `scoring-v2.ts`, `parts.ts`, `src/shared/i18n/items.ts`, `screens/quick-scan.jsx`) and the prototype ([`prototype.src.html`](prototype/prototype.src.html)).

## At a glance

| | 7-minute test (prototype) | 64 «Рефлексия» | 147 «Погружение» |
|---|---|---|---|
| **Job** | Entry: "это про меня" in minutes, a card worth sharing, a first task | A relational map: where you sit on four axes, and the archetypes that live there | A full parts inventory: who protects, what they protect, how much Self is available |
| **Length** | 8 scenes (20–25 planned), about 6–7 minutes, one sitting | 64 statements, about 15–20 minutes, one sitting | 147 statements in three sittings of 49, about 10 minutes each |
| **Item** | A life scene and four first-person reactions, each with a doodle: pick the one that speaks first | A statement in five sections: «Спектр инициативы» (12), «Эмоциональная температура» (12), «Фокус» (12), «Стратегия привязанности» (16), «Здоровые паттерны» (12) | A behavioural, present-tense statement. Per part family: 2 trigger, 3 behaviour, 2 inner narration, 1 body item |
| **Answer** | One forced choice per scene | Likert 1–5, «Полностью не согласен … Полностью согласен» | Likert 1–5, «Совсем не про меня … Почти всегда про меня» |
| **What it measures** | 7 popular protectors, as funny characters, plus a Self signal from calm answers | 4 bipolar axes: Agency (active ↔ receptive), Temperature (cool ↔ hot), Focus (self ↔ other), Attachment (avoidant ↔ anxious), plus healthy patterns | 14 part families (7 managers, 3 firefighters, 4 exiles), 4 resources, 8 Self qualities |
| **Scoring** | Each answer adds +2 or +1 to one or two parts; the top 3 win; ties go to list order | Pole averages → coordinates in [−1, 1]⁴ → cluster rules → archetypes with a developmental origin; optional AI narrative | Raw sums with two reverse-keyed items per family → T-scores on provisional norms → tiers; then attachment, polarizations, coping stack, need hunger, complexes |
| **Validity** | None | None found; half of each bipolar section is reverse-keyed | An attention item and two infrequency items at fixed positions; flags |
| **Body** | No | No | A body-map follow-up on strong answers (8 zones) |
| **Safety** | Protectors only; crisis text in SOS | Developmental-origin labels («pre-verbal», «oedipal») in the output | A crisis footer when all four exiles are ≥ 60 T |
| **Output** | «Твоё небо»: top 3 parts, a cover, a first task, a shareable card | A constellation of archetypes with 4D coordinates, the 3D universe, «Два неба» (synastry bridge) | A clinical-style profile (headline protector and exile, coping stack, attachment, Self radar) |
| **Words** | Funny titles, «ты», no therapy terms | Formal; IFS families and clinical labels in results | Formal; part families named in results |
| **Repeatable** | Yes, in minutes | Weeks apart | Rarely |

## How the funny cast maps onto the 147 families

| Prototype part | Closest 147 family | Fit |
|---|---|---|
| Отдел контроля качества | `inner_critic` (and `taskmaster` for «до ночи, пока не станет идеально») | Good |
| Министр «Потом» | `numb` (phone and shows to avoid) | Partial: procrastination is a behaviour several families share |
| Мечтатель | Resource `explorer` and Self quality *creativity* | Partial: it is scored like a protector but behaves like a resource |
| Начальник отдела «А вдруг?» | `controller` (bracing, planning) and `analyst` | Partial: anxiety is spread across families |
| Главный по «всем ли удобно?» | `pleaser` | Exact |
| Служба утешительных вкусняшек | `numb` (food) | Good |
| Профсоюз «Хватит» | `hermit` (withdraw to recover) | Partial |
| Not covered | `taskmaster`, `controller`, `analyst`, `bypasser`, `rebel`, `charmer`; all exiles (by design); resources `sage`, `warrior`, `caregiver` | |

## What the 7-minute test does better, and where it is weaker

**Better.** People recognise themselves in a scene faster than in an abstract statement, and the first reaction is closer to what a part does than an agreement scale is. It is short enough to finish (T1 needs ≥ 70%), it produces something worth sharing, and it never leaves a newcomer with a label they have to look up.

**Weaker.**
- **Thin per part.** Each part appears in 2–5 answers across 8 scenes, so one tap moves the result. The 147 has 8 items per family.
- **Ipsative.** A forced choice ranks parts against each other, so scores can't be compared between people and can't show "everything is quiet".
- **One reaction only.** Real scenes wake several parts at once; the test keeps only the first.
- **A visible "right" answer.** The calm option often reads as the healthy one, which inflates the Self signal.
- **No validity or body signal.** Random tapping looks the same as a real answer.
- **Its own taxonomy.** Seven parts that are not the 147's families, so a later deep map would describe someone with different parts.

## Recommendations

1. **One cast, three depths.** Keep all three, as layers of the same parts:
   - the 7-minute scenes for entry;
   - the existing 14-item Quick Scan as «Уточнить небо» (about 3 minutes);
   - the 147 as «Глубокая карта» (Plus), with the 64 for the relational universe, «Два неба» and the therapist view.
2. **Give every 147 protector family a funny skin**, and keep the families as the internal ids: ОТК is `inner_critic`, Служба вкусняшек is `numb`. Then every layer adds evidence to the same parts instead of naming new ones. Candidates for the uncovered families: «Отдел аврала» (`taskmaster`), «Диспетчер "Всё по плану"» (`controller`), «Отдел "Разложим по полочкам"» (`analyst`), «Министерство позитива» (`bypasser`), «Профсоюз "А вот и нет"» (`rebel`), «Отдел харизмы» (`charmer`). Exiles get no funny names and no jokes. In the consumer app they show only as "a tender spot", with care and a route to a person.
3. **Rebuild the scenes on the 147's content:**
   - Write 24 scenes from the families' trigger and behaviour items, so each protector family appears at least 3 times and each scene offers one Self answer.
   - Let people pick up to two reactions, add «Это не про меня», and shuffle the option order.
   - Make the Self answer as appealing as the others, not the obviously "good" one.
4. **Validate before trusting it.** In Step 0–1, give 30–50 people both the scene test and the 147:
   - **Pass:** each family's scene score correlates with its 147 T-score at ≥ .5, and two-week test–retest of the top 3 holds for ≥ 70%.
   - **Below that:** label the result as a first sketch and push «Уточнить небо» harder.
5. **Bring the 64 and the 147 into the new voice and feel:**
   - «ты»; the emoji ends «Совсем не про меня … Точно про меня»; no family names in the interface.
   - Breaks between the three sittings, and a plush that reacts as you answer.
   - Results drawn with the same cast as «Твоё небо».
6. **Hide exiles in the consumer deep map** by default; show their scores only to a therapist the person has invited, or as one gentle sentence and a link to help. Keep the crisis flag.
7. **Give the therapist everything:** the 147 profile, the 64 coordinates, and the full 3+1 sky (plan §4.6).
