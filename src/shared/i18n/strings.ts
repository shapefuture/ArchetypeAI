/**
 * STRINGS — THE single editing surface for user-facing text (English + Russian).
 * ============================================================================
 * ALL user-facing copy — UI strings, assessment items, exercises, report
 * content, constellation essays, synastry, scoring, and translation keys —
 * lives here physically.  EN and RU are adjacent per entry so a human edits
 * both languages in one place.
 *
 * Data modules (items.ts, part-copy.ts, exercises.ts, constellation-copy.ts,
 * synastry.ts, scoring.ts, translations.ts, universe-state.service.ts) are
 * thin shape-preserving adapters that import copy from this file.
 */
import type { JitaiCardId } from '../core/data/state-v2';
import type { Need, Tier } from '../core/data/parts';
import type { FamKind } from '../features/landing/stickers';

// NOTE: deliberately NOT `as const` — components rely on widened `string`
// property types (some use `typeof UI.ru & typeof UI.en` intersections).
export const STRINGS = {
  // ── Quick Scan panel ──────────────────────────────────────────────────
  quickscan:   {
    en: {
      title: 'Meet one part in 90 seconds',
      skip: 'Close',
      resultOf: name => `${name} stepped forward.`,
      teaserNote: 'A one-part glimpse. The full battery — 147 statements, three sittings — introduces you to each other.',
      cta: 'Begin the full battery',
      selfTitle: 'No part claimed the floor — your Self is near the surface.',
      selfNote: 'Rare and good. The full battery will still find the quieter ones.',
    },
    ru: {
      title: 'Познакомьтесь с одной частью себя за 90 секунд',
      skip: 'Закрыть',
      resultOf: name => `Вперёд вышла «${name}».`,
      teaserNote: 'Это лишь беглый взгляд. Полная батарея — 147 утверждений в трёх подходах — представит вас друг другу.',
      cta: 'Начать полный тест',
      selfTitle: 'Ни одна часть не вышла вперёд — сейчас вы в спокойном, ясном состоянии.',
      selfNote: 'Такое бывает нечасто, и это хороший знак. Полный тест всё равно найдёт и более тихих.',
    },
  },

  // ── Install prompt ────────────────────────────────────────────────────
  installPrompt:   {
    en: {
      title: 'Install Innerverse',
      desc: 'Add it to your home screen — it opens full-screen and keeps your place offline.',
      install: 'Install',
      later: 'Not now',
      iosTitle: 'Add Innerverse to your Home Screen',
      iosSteps: [
        'Tap the Share button in Safari',
        'Scroll and tap “Add to Home Screen”',
        'Tap “Add” — Innerverse gets its own icon',
      ],
    },
    ru: {
      title: 'Установить Innerverse',
      desc: 'Добавьте на домашний экран — открывается на весь экран и сохраняет прогресс офлайн.',
      install: 'Установить',
      later: 'Позже',
      iosTitle: 'Добавьте Innerverse на экран «Домой»',
      iosSteps: [
        'Нажмите кнопку «Поделиться» в Safari',
        'Пролистайте и выберите «На экран “Домой”»',
        'Нажмите «Добавить» — у Innerverse появится своя иконка',
      ],
    },
  },

  // ── Booking panel ─────────────────────────────────────────────────────
  booking:   {
    ru: {
      title: 'Записаться к специалисту',
      close: 'Закрыть',
      stepTherapist: 'Шаг 1 — специалист',
      therapistEmail: 'Email специалиста',
      find: 'Найти',
      notFound: 'Специалист не найден. Проверьте email.',
      stepDate: 'Шаг 2 — дата',
      stepSlot: 'Шаг 3 — время',
      noSlots: 'На эту дату свободных слотов нет.',
      confirm: 'Подтвердить запись',
      busy: 'Отправляем…',
      done: 'Заявка отправлена! Специалист подтвердит её в своей панели.',
      pickDate: 'Выберите дату',
      pickSlot: 'Выберите время',
      back: 'Назад',
      loginFirst: 'Войдите, чтобы записаться.',
      dataShareConsent: 'Я понимаю: специалист увидит мой сохранённый профиль и историю, пока заявка ожидает подтверждения или запись подтверждена. Отмена отзовёт доступ.',
      slotMinutes: 'мин.',
    },
    en: {
      title: 'Book a session',
      close: 'Close',
      stepTherapist: 'Step 1 — therapist',
      therapistEmail: 'Therapist email',
      find: 'Find',
      notFound: 'Therapist not found. Check the email.',
      stepDate: 'Step 2 — date',
      stepSlot: 'Step 3 — time',
      noSlots: 'No free slots on this date.',
      confirm: 'Confirm booking',
      busy: 'Sending…',
      done: 'Request sent! The therapist will approve it in their panel.',
      pickDate: 'Pick a date',
      pickSlot: 'Pick a time',
      back: 'Back',
      loginFirst: 'Sign in to book a session.',
      dataShareConsent: 'I understand that the therapist can view my saved profile and history while this request is pending or approved. Cancelling revokes access.',
      slotMinutes: 'min',
    },
  },

  // ── Descent (147-item battery) ────────────────────────────────────────
  descent: {
    ui:     {
      en: {
        exit: 'Exit',
        back: 'Previous statement',
        next: 'Next statement',
        ethicsTitle: 'Before you descend',
        ethicsSub: 'Three sittings of 49 statements. Pause after any one — progress is kept.',
        planTitle: 'What to expect',
        plan: [
          { name: 'Descent I', meta: '49 statements · ~10 min' },
          { name: 'Descent II', meta: '49 statements · ~10 min' },
          { name: 'Descent III', meta: '49 statements · ~10 min' },
        ],
        planPause: 'pause',
        ethicsWhy: 'Why three sittings? Attention fades — somewhere past the fiftieth statement, answers slide onto autopilot. Three short sittings keep you honest, and the pauses between them let what you saw settle.',
        ethics1: 'A self-reflection mirror · answers stay on this device',
        ethics2: 'Every part of you is welcome here. Nothing aims to delete or fix away any of you. You can stop at any time; anything can wait.',
        ethicsGo: 'I understand — begin Descent I',
        descent: n => `Descent ${['I', 'II', 'III'][n]}`,
        itemOf: (i, n) => `${i} / ${n}`,
        sitHint: 'Answer as you are on most days.',
        somaticQ: 'Where do you feel this?',
        somaticSkip: 'Skip',
        breakTitle: n => `Descent ${['I', 'II', 'III'][n]} complete`,
        breakSub: 'The stars you lit are held safely. Continue now, or return when you are ready — nothing is lost.',
        breakResume: n => (n < 2 ? `Continue — Descent ${['II', 'III'][n]}` : 'Behold your constellation'),
        breakLater: 'Return later',
        retakeNote: 'Your answers stay on this device.',
        recalibrated: 'The stars have been recalibrated. The old map cannot be translated — descend again to be measured anew.',
        fsTitle: 'Your North Star',
        fsSub: 'Describe the version of you that you are drawn toward. Answer two of the three (a sentence or two each). You can edit this anytime.',
        fsQ: [
          'One year from now, what are you moving toward?',
          'The version of you who has met these parts — what do they do differently under load?',
          'What do you love enough that it summons you?',
        ],
        fsSkip: 'Skip for now — a dim star will hold the place',
        fsSave: 'Set my North Star',
      },
      ru: {
        exit: 'Выйти',
        back: 'Предыдущее утверждение',
        next: 'Следующее утверждение',
        ethicsTitle: 'Перед погружением',
        ethicsSub: 'Три части по 49 утверждений. Можно остановиться после любой — прогресс сохранится.',
        planTitle: 'Как всё устроено',
        plan: [
          { name: 'Погружение I', meta: '49 утверждений · ~10 минут' },
          { name: 'Погружение II', meta: '49 утверждений · ~10 минут' },
          { name: 'Погружение III', meta: '49 утверждений · ~10 минут' },
        ],
        planPause: 'пауза',
        ethicsWhy: 'Почему три части? Внимание быстро притупляется: где-то после пятидесятого утверждения ответы начинаются «на автомате». Три короткие части помогают отвечать честно, а паузы между ними дают увиденному улечься.',
        ethics1: 'Инструмент самопознания · ответы остаются на устройстве',
        ethics2: 'Каждая ваша часть здесь желанна: ничего не нужно «удалять» или «чинить». Вы можете остановиться в любой момент — всё подождёт.',
        ethicsGo: 'Хорошо — начинаем Погружение I',
        descent: n => `Погружение ${['I', 'II', 'III'][n]}`,
        itemOf: (i, n) => `${i} / ${n}`,
        sitHint: 'Отвечайте за себя повседневного — каким вы бываете в большинстве дней.',
        somaticQ: 'Где вы это чувствуете?',
        somaticSkip: 'Пропустить',
        breakTitle: n => `Погружение ${['I', 'II', 'III'][n]} завершено`,
        breakSub: 'Зажжённые вами звёзды мы сохранили. Можно продолжить сразу или вернуться позже — ничего не потеряется.',
        breakResume: n => (n < 2 ? `Продолжить — Погружение ${['II', 'III'][n]}` : 'Пора увидеть ваше созвездие'),
        breakLater: 'Вернуться позже',
        retakeNote: 'Ответы остаются на этом устройстве.',
        recalibrated: 'Звёзды перенастроены: прежнюю карту не перевести на новый лад. Пройдите все три погружения заново — вас измерят по-новой.',
        fsTitle: 'Ваша Полярная звезда',
        fsSub: 'Опишите образ, к которому вас тянет. Ответьте на два из трёх вопросов — по предложению-два. Позже текст можно изменить.',
        fsQ: [
          'Через год — к чему вы движетесь?',
          'Ваша версия, встретившая эти части, — что она делает иначе под нагрузкой?',
          'Что вы любите настолько, что оно вас зовёт?',
        ],
        fsSkip: 'Пока пропустить — тусклая звезда подержит место',
        fsSave: 'Задать Полярную звезду',
      },
    },
    zoneLabels:     {
      en: {
        head: 'Head', 'jaw-face': 'Jaw / face', throat: 'Throat', chest: 'Chest',
        gut: 'Gut', 'shoulders-arms': 'Shoulders / arms', pelvis: 'Pelvis', legs: 'Legs',
      },
      ru: {
        head: 'Голова', 'jaw-face': 'Челюсть и лицо', throat: 'Горло', chest: 'Грудь',
        gut: 'Живот', 'shoulders-arms': 'Плечи и руки', pelvis: 'Таз', legs: 'Ноги',
      },
    },
  },

  // ── Daily check-in ────────────────────────────────────────────────────
  checkin: {
    ui:     {
      en: {
        title: 'Daily check-in',
        where: 'Where are you right now?',
        arousal: ['Shutdown', 'Low', 'In my window', 'Activated', 'Hyper'],
        eventQ: 'What kind of day was it? (optional)',
        events: ['Relational', 'Achievement', 'Loss', 'Boundary', 'Change', 'Calm day'],
        skip: 'Skip',
        didIt: p => `Is ${p} on duty today?`,
        yes: 'Yes — it had the wheel',
        no: 'No — I noticed and took the wheel',
        correct: 'No — someone else had the wheel',
        done: 'Logged. The weather shifts.',
        unburdening: p => `${p} is softening — its star steadies. This part worked hard for years; take a moment to thank it for the job it is putting down.`,
        verdictLock: 'Facts and feelings now. Meaning gets 48 hours.',
        verdictPrompt: 'Write the conclusion that feels true right now — it will be sealed and return in 48 hours.',
        seal: 'Seal it',
        resurfaceTitle: 'Read it from where you are now. What still feels true?',
        ratings: ['still true', 'partly', 'state artifact'],
        close: 'Close',
        weatherFor: p => `${p} · ${p} flares in the last 30 days`,
      },
      ru: {
        title: 'Ежедневная сверка',
        where: 'Где вы сейчас?',
        arousal: ['Замирание', 'Низко', 'В окне', 'Взвинченность', 'Гипер'],
        eventQ: 'Каким был день? (необязательно)',
        events: ['Отношения', 'Достижение', 'Потеря', 'Граница', 'Перемены', 'Спокойный'],
        skip: 'Пропустить',
        didIt: p => `Сегодня дежурит «${p}»?`,
        yes: 'Да — он был за рулём',
        no: 'Нет — я замечаю это и беру руль на себя',
        correct: 'Нет — руль держал другой',
        done: 'Записано. Погода меняется.',
        unburdening: p => `«${p}» смягчается — её звезда выравнивается. Эта часть трудилась годами; поблагодарите её за работу, которую она складывает.`,
        verdictLock: 'Сейчас — факты и чувства. Смысл подождёт 48 часов.',
        verdictPrompt: 'Напишите вывод, который сейчас кажется правдой, — он будет запечатан и вернётся через 48 часов.',
        seal: 'Запечатать',
        resurfaceTitle: 'Прочтите это из того места, где вы теперь. Что всё ещё правда?',
        ratings: ['всё так', 'отчасти', 'артефакт состояния'],
        close: 'Закрыть',
        weatherFor: p => `${p} · вспышек за 30 дней: ${p}`,
      },
    },
    jitaiCards:     {
      en: {
        body_anchor: { title: 'Body anchor', body: 'Feet on the floor. Three slow breaths. Name one controllable thing — and do it.' },
        dual_bound_charter: { title: 'Dual-bound charter', body: 'One behavior in one context does not define all of you. And it still matters: one repair action, one next-time plan. Do both now.' },
        witness_contact: { title: 'Contact your witness', body: 'Call the person you chose for moments like this — before deciding anything.' },
        if_then_plan: { title: 'Your if-then plan', body: 'Say your if-then plan out loud, right now: “When ⟨trigger⟩, I will ⟨action⟩.”' },
        sealed_verdict_offer: { title: 'Seal tonight’s verdict', body: 'Facts and feelings now; meaning in 48 hours. Write the conclusion that feels true — it returns sealed.' },
      },
      ru: {
        body_anchor: { title: 'Якорь в теле', body: 'Стопы в пол. Три медленных вдоха. Назовите одну подвластную вам вещь — и сделайте её.' },
        dual_bound_charter: { title: 'Двойная рамка', body: 'Один поступок в одном контексте — целиком он вас не определяет. При этом серьёзность остаётся: одно действие исправления и один план на следующий раз. Сделайте оба.' },
        witness_contact: { title: 'Позвоните свидетелю', body: 'Позвоните человеку, которого выбрали на такой случай, — прежде чем что-либо решать.' },
        if_then_plan: { title: 'Ваш план «если–то»', body: 'Скажите план вслух, прямо сейчас: «Когда ⟨триггер⟩, я сделаю ⟨действие⟩».' },
        sealed_verdict_offer: { title: 'Запечатайте вывод', body: 'Сейчас — факты и чувства; смысл через 48 часов. Напишите вывод, который кажется правдой, — он вернётся запечатанным.' },
      },
    },
  },

  // ── Innerverse report ─────────────────────────────────────────────────
  innerverseReport: {
    ui:     {
      en: {
        report: 'Your Innerverse',
        constellationOf: 'Constellation of',
        and: 'and',
        strongestResource: 'Currently leading',
        strongestResourceSub: r => `Your ${r} is online. Everything below is weather around it — strengths first, always.`,
        selfEnergy: 'Self energy',
        radar: 'Self Radar · 8 qualities (an indicative look)',
        partsByTier: 'Your parts, most visible to quietest',
        flipHint: 'tap a card: its name → what it needs → what it fears → where it shines',
        polarizations: 'Conflicts · two protective parts pulling opposite ways',
        polarizationSub: 'Two solos at once — neither hears the other.',
        complexes: 'Repeating scenarios',
        complexesSub: 'A repeating scenario is a story several parts act out together. These are the ones playing now.',
        complexBelief: 'The belief that drives this scenario',
        complexExperiment: 'A small experiment for this week',
        noComplexes: 'No repeating scenario is active right now.',
        copingStack: 'How you cope · what happens as pressure builds',
        whenFails: 'when that stops helping…',
        floorLabel: 'at the very bottom',
        needs: 'What your system is asking for',
        needsSub: 'Your loudest unmet need right now.',
        needsNone: 'Every need the test measures looks met right now.',
        retakeDraftConfirm: 'You have an unfinished test. Start again and delete those answers?',
        resources: 'Your qualities · where they stand',
        resourcesSub: 'Every quality has a range: too little, just right, or too much. The bar shows where you are today.',
        band: { hypo: 'too little', healthy: 'just right', hyper: 'too much' },
        leak: r => `tips into ${r} — the link is drawn on your map`,
        burden: 'What weighs the system down most',
        vane: 'Words and actions · how closely they match (a general look)',
        vaneEssence: 'what you say about yourself', vaneBehavior: 'what you actually do',
        vaneEmpty: 'Over time, your answers will show how closely words and actions match.',
        attachment: 'How you usually build close relationships',
        attStyle: {
          secure: 'Secure leaning', anxious: 'Anxious leaning', avoidant: 'Avoidant leaning',
          disorganized: 'Mixed (anxious + avoidant)',
        },
        ethics: 'This is a self-reflection tool grounded in the Internal Family Systems model. For diagnosis or therapy, please consult a licensed professional.',
        crisis: 'Today\'s result is heavy. If it stirs more than it settles, crisis resources are one tap away in Settings.',
        back: 'Back',
        continueTitle: 'What happens next',
        continueSub: 'Two ways to keep the map. Everything else opens once you have an account.',
        saveTitle: 'Save to your account',
        saveDesc: 'An account keeps the map, check-ins and practice with you on any device.',
        saveCta: 'Create account',
        localTitle: 'Keep a local copy',
        localDesc: 'A file with your answers and map. Stored on this device; you can restore it later.',
        localCta: 'Download the copy',
        signedInSub: 'Your account is open — the full journey continues here.',
        cabinetTitle: 'Your personal cabinet',
        cabinetDesc: 'Your dashboard: results, backups, linked specialists.',
        cabinetCta: 'Open cabinet',
        practiceTitle: 'Begin daily practice',
        practiceDesc: 'A five-chapter path, one gentle practice at a time.',
        practiceCta: 'Open practice',
        specialistTitle: 'Deep dive with a specialist',
        specialistDesc: 'Share this code with your therapist or coach — they can follow your map in their dashboard.',
        specialistCta: 'Show my code',
        specialistCodeHint: 'Read it to your specialist, or send it any way you like.',
        copied: 'Copied!',
        tierNames: { dormant: 'dormant', present: 'present', prominent: 'prominent', dominant: 'often solos' } as Record<Tier, string>,
        complexTierNames: { latent: 'latent', active: 'active', gripping: 'gripping' } as Record<string, string>,
        bandNames: { hypo: 'under-used', healthy: 'balanced', hyper: 'overused' } as Record<string, string>,
      },
      ru: {
        report: 'Ваша внутренняя вселенная',
        constellationOf: 'Созвездие',
        and: 'и',
        strongestResource: 'Сейчас вас ведёт',
        strongestResourceSub: r => `Ресурс «${r}» сейчас включён. Всё, что ниже, — погода вокруг него. Силы показываем первыми.`,
        selfEnergy: 'Спокойное, ясное «я»',
        radar: 'Диаграмма из 8 качеств (ориентировочный взгляд)',
        partsByTier: 'Ваши части — от самых заметных к самым тихим',
        flipHint: 'нажмите на карточку, чтобы увидеть: как называется → что ей нужно → чего она боится → в чём её сила',
        polarizations: 'Конфликты · когда две защищающие части тянут в разные стороны',
        polarizationSub: 'Два соло звучат одновременно — и не слышат друг друга.',
        complexes: 'Повторяющиеся сценарии',
        complexesSub: 'Повторяющийся сценарий — это история, которую вместе разыгрывают несколько частей. Здесь показаны те, что звучат прямо сейчас.',
        complexBelief: 'Убеждение, которое запускает этот сценарий',
        complexExperiment: 'Маленький эксперимент на эту неделю',
        noComplexes: 'Сейчас ни один повторяющийся сценарий не активен.',
        copingStack: 'Как вы справляетесь · что происходит по нарастающей',
        whenFails: 'когда это перестаёт помогать…',
        floorLabel: 'в самом низу',
        needs: 'Чего просит ваша система',
        needsSub: 'Самая громкая неудовлетворённая потребность прямо сейчас.',
        needsNone: 'Сейчас все потребности, которые измеряет тест, выглядят удовлетворёнными.',
        retakeDraftConfirm: 'У вас есть незаконченное прохождение теста. Начать заново и удалить эти ответы?',
        resources: 'Ваши качества · в каком они состоянии',
        resourcesSub: 'У каждого качества есть диапазон: слишком мало, в самый раз, слишком много. Полоска показывает, где вы сегодня.',
        band: { hypo: 'слишком мало', healthy: 'в самый раз', hyper: 'слишком много' },
        leak: r => `перетекает в часть «${r}» — эта связь показана на карте`,
        burden: 'Что тяжелее всего даётся системе',
        vane: 'Слова и поступки · насколько они совпадают (общий взгляд)',
        vaneEssence: 'что вы говорите о себе', vaneBehavior: 'что вы на самом деле делаете',
        vaneEmpty: 'Со временем ваши ответы покажут, насколько слова и поступки совпадают.',
        attachment: 'Как вы обычно строите близкие отношения',
        attStyle: {
          secure: 'Скорее спокойный тип', anxious: 'Скорее тревожный тип', avoidant: 'Скорее избегающий тип',
          disorganized: 'Смешанная (тревога + избегание)',
        },
        ethics: 'Инструмент саморефлексии на основе модели внутренних семейных систем (IFS). За диагностикой и терапией обращайтесь к специалисту.',
        crisis: 'Сегодняшний результат тяжёлый. Если он поднимает больше, чем успокаивает, — ресурсы поддержки в настройках, в одном нажатии от вас.',
        back: 'Назад',
        continueTitle: 'Что дальше',
        continueSub: 'Два способа сохранить карту. Остальное откроется вместе с аккаунтом.',
        saveTitle: 'Сохранить в аккаунте',
        saveDesc: 'Аккаунт хранит карту, чек-ины и практику и переносит их на любое устройство.',
        saveCta: 'Создать аккаунт',
        localTitle: 'Локальная копия',
        localDesc: 'Файл с ответами и картой остаётся на устройстве. Его можно восстановить в любой момент.',
        localCta: 'Скачать копию',
        signedInSub: 'Аккаунт открыт — продолжайте путь здесь.',
        cabinetTitle: 'Личный кабинет',
        cabinetDesc: 'Панель с результатами, копиями и вашими специалистами.',
        cabinetCta: 'Открыть кабинет',
        practiceTitle: 'Ежедневная практика',
        practiceDesc: 'Пять глав пути — по одной мягкой практике за раз.',
        practiceCta: 'Открыть практику',
        specialistTitle: 'Глубокая сессия со специалистом',
        specialistDesc: 'Передайте код терапевту или коучу — он увидит карту в своей панели.',
        specialistCta: 'Показать мой код',
        specialistCodeHint: 'Продиктуйте код специалисту или отправьте сообщением.',
        copied: 'Скопировано!',
        tierNames: { dormant: 'дремлет', present: 'присутствует', prominent: 'заметна', dominant: 'часто солирует' } as Record<Tier, string>,
        complexTierNames: { latent: 'дремлет', active: 'активен', gripping: 'сжимает' } as Record<string, string>,
        bandNames: { hypo: 'проявлен слабо', healthy: 'в балансе', hyper: 'в избытке' } as Record<string, string>,
      },
    },
    needPractice:     {
      en: {
        safety: 'Place one hand on your sternum and name three present-day facts that were not true when you were small.',
        love: 'Ask one safe person for something small you want — and receive it without repaying.',
        worth: 'Do one thing you are bad at, on purpose, and notice you still exist afterwards.',
        autonomy: 'Say one small, clean no this week and stay in the room with the discomfort.',
        belonging: 'State one preference out loud, unprompted, to someone safe.',
        meaning: 'Write three sentences about what today was in service of.',
        joy: 'Schedule 30 unstructured minutes that belong to no one but you.',
      },
      ru: {
        safety: 'Положите ладонь на грудину и назовите три факта сегодняшнего дня, которые не были верны в детстве.',
        love: 'Попросите у безопасного человека что-то малое для себя — и примите, не возвращая долг.',
        worth: 'Сделайте нарочно то, в чём вы плохи, и заметьте: вы всё ещё есть.',
        autonomy: 'Скажите одно маленькое чистое «нет» на этой неделе и останьтесь с этим дискомфортом.',
        belonging: 'Вслух, без запроса, обозначьте один свой приоритет безопасному человеку.',
        meaning: 'Напишите три предложения о том, служением чему был сегодняшний день.',
        joy: 'Запланируйте 30 бесструктурных минут, принадлежащих только вам.',
      },
    },

    needLabelsRu: {
      safety: 'Безопасность', love: 'Близость', worth: 'Ценность', autonomy: 'Самостоятельность',
      belonging: 'Принадлежность', meaning: 'Смысл', joy: 'Радость',
    } as Record<string, string>,
    qualityLabelsRu: {
      calm: 'Спокойствие', clarity: 'Ясность', compassion: 'Сострадание', curiosity: 'Любопытство',
      confidence: 'Уверенность', courage: 'Смелость', creativity: 'Творчество', connectedness: 'Связанность',
    } as Record<string, string>,
    layerLabels: {
      en: { face: 'Face', need: 'Need', shadow: 'Shadow', superpower: 'Superpower' },
      ru: { face: 'Лицо', need: 'Потребность', shadow: 'Тень', superpower: 'Суперсила' },
    },
    exileBeliefs: {
      abandoned: ['I will be left.', 'Меня оставят.'],
      ashamed: ['I am defective.', 'Я дефектный.'],
      frightened: ['I am not safe.', 'Мне небезопасно.'],
      unseen: ['I do not matter.', 'Я не имею значения.'],
    } as Record<string, [string, string]>,

  },

  // ── Therapist panel ───────────────────────────────────────────────────
  therapist:   {
    en: {
      title: 'Therapist Mode',
      close: 'Close',
      attest: 'I attest that I am a licensed mental-health professional.',
      license: 'License number (stored locally, not verified at launch)',
      enter: 'Enter dashboard',
      claimLabel: 'Client invite code',
      claim: 'Link client',
      badCode: 'Code not found.',
      clients: 'Linked clients',
      noClients: 'No clients linked yet. Ask your client for their invite code.',
      assign: 'Assign exercise',
      frequency: ['once', 'daily', 'weekly', 'after-trigger'],
      send: 'Assign',
      assigned: 'Assigned.',
      redNote: 'RED exercises attach only here — and only after the client has built their Safe Place container.',
      consentTitle: 'What you see — and never see',
      metricsTitle: 'Resistant outcomes (logged events only)',
      metrics: ['Time to repair', 'Secrecy duration', 'If-then fire rate', 'Disclosure ratio'],
      metricsRule: 'If self-report improves while these stand still, the insights are staying verbal — shift toward behavior and environment exercises.',
      fClient: 'Client', fExercise: 'Exercise', fFrequency: 'Frequency',
      selfLabel: 'Self', burdenLabel: 'burden', adherenceLabel: 'practice done',
      archive: 'Archive',
      toArchive: 'Archive',
      restore: 'Restore',
      archived: 'Archived clients',
      noArchived: 'No archived clients.',
      requests: 'Session requests',
      noRequests: 'No session requests yet.',
      approve: 'Approve',
      decline: 'Decline',
      approvedChip: 'confirmed',
      statusPending: 'pending',
      statusApproved: 'approved',
      statusDeclined: 'declined',
      statusCancelled: 'cancelled',
      availability: 'Availability',
      availHint: 'Per-day working hours. Slots are 60 minutes.',
      dayNames: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      saveAvail: 'Save availability',
      saved: 'Saved.',
      clientNoSummary: 'linked via booking — no assessment summary yet',
    },
    ru: {
      title: 'Режим терапевта',
      close: 'Закрыть',
      attest: 'Я подтверждаю, что являюсь дипломированным специалистом в области психического здоровья.',
      license: 'Номер лицензии (хранится локально, не проверяется на старте)',
      enter: 'Войти в панель',
      claimLabel: 'Код приглашения клиента',
      claim: 'Связать клиента',
      badCode: 'Код не найден.',
      clients: 'Связанные клиенты',
      noClients: 'Пока никто не связан. Попросите у клиента код приглашения.',
      assign: 'Назначить практику',
      frequency: ['once', 'daily', 'weekly', 'after-trigger'],
      send: 'Назначить',
      assigned: 'Назначено.',
      redNote: 'RED-практики доступны только здесь — и только после того, как клиент построил контейнер Безопасного Места.',
      consentTitle: 'Что вы видите — и чего не видите никогда',
      metricsTitle: 'Устойчивые исходы (только из журнала событий)',
      metrics: ['Время до исправления', 'Длительность умолчания', 'Доля сработавших «если–то»', 'Доля раскрытий'],
      metricsRule: 'Если самоотчёт улучшается, а эти метрики стоят на месте — инсайты пока остаются словами: переведите фокус с проговаривания на поведенческие и средовые практики.',
      fClient: 'Клиент', fExercise: 'Практика', fFrequency: 'Частота',
      selfLabel: 'Self-энергия', burdenLabel: 'нагрузка', adherenceLabel: 'практик выполнено',
      archive: 'Архив',
      toArchive: 'В архив',
      restore: 'Восстановить',
      archived: 'Архив клиентов',
      noArchived: 'Архив пуст.',
      requests: 'Заявки на сессии',
      noRequests: 'Заявок пока нет.',
      approve: 'Подтвердить',
      decline: 'Отклонить',
      approvedChip: 'подтверждена',
      statusPending: 'ожидает',
      statusApproved: 'подтверждена',
      statusDeclined: 'отклонена',
      statusCancelled: 'отменена',
      availability: 'Доступность',
      availHint: 'Рабочие часы по дням недели. Слоты — 60 минут.',
      dayNames: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
      saveAvail: 'Сохранить доступность',
      saved: 'Сохранено.',
      clientNoSummary: 'связан через запись — сводки результатов пока нет',
    },

    clinical: {
      gateWords: {
        en: { green: 'green', yellow: 'yellow', red: 'red' },
        ru: { green: 'зелёный', yellow: 'жёлтый', red: 'красный' },
      },
      freqWords: {
        en: { once: 'once', daily: 'daily', weekly: 'weekly', 'after-trigger': 'after a trigger' },
        ru: { once: 'однократно', daily: 'ежедневно', weekly: 'еженедельно', 'after-trigger': 'после триггера' },
      },
      hoursUnit: ['h', 'ч'],
    },

  },

  // ── Practice panel ────────────────────────────────────────────────────
  practice:   {
    en: {
      title: 'Practice',
      today: 'Today’s practice',
      noneToday: 'No suggestion today — a quiet day is a real practice too. The library is open below.',
      chapters: 'Practice path · each step unlocks a new skill',
      chapterNames: ['Grounding', 'Meeting', 'Tending', 'Relating', 'Integrating'],
      locked: 'Locked', unlocked: 'Unlocked',
      gate: { green: 'self-serve', yellow: 'gated', red: 'therapist only' },
      stopRule: 'If it gets intense',
      done: 'Mark practiced',
      close: 'Close',
      ch2Hint: '7 days of check-ins', ch3Hint: 'after a part dialogue', ch4Hint: 'a synastry run', ch5Hint: 'therapist link only',
      ladder: 'Proceduralization ladder', rungNames: ['Name the principle', 'Write the if-then plan', 'Mental rehearsal (90s)', 'Live rep', 'Verified under load'],
      rungNamed: 'I can name it', rungIfThenPh: 'When ⟨trigger⟩, I will ⟨action⟩', rungSave: 'Save plan',
      rungStart: 'Rehearse 90 seconds', rungDone: 'Rehearsal complete',
      rungLocked: 'with a therapist', integrated: 'integrated',
    },
    ru: {
      title: 'Практика',
      today: 'Практика на сегодня',
      noneToday: 'На сегодня предложений нет — тихий день тоже практика. Библиотека открыта ниже.',
      chapters: 'Путь практики · с каждым шагом открывается новый навык',
      chapterNames: ['Заземление', 'Встреча', 'Забота', 'Отношения', 'Интеграция'],
      locked: 'Закрыто', unlocked: 'Открыто',
      gate: { green: 'самостоятельно', yellow: 'с ограничением', red: 'только с терапевтом' },
      stopRule: 'Если становится остро',
      done: 'Отметить выполненным',
      close: 'Закрыть',
      ch2Hint: '7 дней сверок', ch3Hint: 'после диалога с частью', ch4Hint: 'после сравнения с другим человеком', ch5Hint: 'только связь с терапевтом',
      ladder: 'Лестница процедурализации', rungNames: ['Назвать принцип', 'Записать план «если–то»', 'Мысленная репетиция (90с)', 'Живая проба', 'Проверено под нагрузкой'],
      rungNamed: 'Могу назвать', rungIfThenPh: 'Когда ⟨триггер⟩, я сделаю ⟨действие⟩', rungSave: 'Сохранить план',
      rungStart: 'Репетировать 90 секунд', rungDone: 'Репетиция завершена',
      rungLocked: 'с терапевтом', integrated: 'интегрировано',
    },
  },

  // ── Synastry compare ──────────────────────────────────────────────────
  synastryCompare:   {
    en: {
      title: 'Synastry — the Pattern between you',
      yourCode: 'Your pairing code',
      copy: 'Copy',
      copied: 'Copied',
      pasteLabel: 'Paste their code',
      compare: 'Read the pattern',
      badCode: 'That code could not be read.',
      noProfile: 'Complete the battery first — your constellation is one of the two inputs.',
      loopTitle: 'Your shared orbit',
      hexagon: 'Six dynamics — the whole profile at once',
      interlocks: 'Locked storylines',
      noInterlocks: 'No locked storyline — your complexes run in parallel. That is a good result.',
      dance: 'The pull between you',
      nourish: 'What you can actually give each other',
      axes: ['Friction', 'Resonance', 'Balance', 'Safety', 'Growth', 'Light'],
      close: 'Close',
      export: 'Save as image',
    },
    ru: {
      title: 'Ваша двойная звезда',
      yourCode: 'Ваш код для пары',
      copy: 'Скопировать',
      copied: 'Скопировано',
      pasteLabel: 'Вставьте их код',
      compare: 'Посмотреть сравнение',
      badCode: 'Код не читается.',
      noProfile: 'Сначала пройдите тест — без него сравнить будет нечего.',
      loopTitle: 'Ваша общая орбита',
      hexagon: 'Шесть показателей — без сведения к одной оценке',
      interlocks: 'Точки, где ваши сюжеты пересекаются',
      noInterlocks: 'Пересечений не нашлось — ваши истории идут параллельно, и это хороший результат.',
      dance: 'Притяжение между вами',
      nourish: 'Что вы реально можете дать друг другу',
      axes: ['Трение', 'Отклик', 'Баланс', 'Безопасность', 'Рост', 'Свет'],
      close: 'Закрыть',
      export: 'Сохранить как изображение',
    },
  },

  landing: {
      // Resource face-lines — shadow parts read PART_COPY (§1.9).
      resourceFace:       {
        sage: ['The quiet knowing that sees the whole field.', 'Тихое знание, которое видит всю картину.'],
        warrior: ['The clear no that protects what matters.', 'Ясное «нет», которое защищает важное.'],
        caregiver: ['The warm tending that asks nothing back.', 'Тепло, которое заботится и ничего не ждёт взамен.'],
        explorer: ['The curious reach toward the new.', 'Любопытный шаг навстречу новому.'],
      },
      // One tiny practice per part (bilingual) — the sheet's closing card.
      practice:       {
        taskmaster: ['Schedule one deliberately useless hour — and survive it.', 'Запланируйте один нарочно бесполезный час — и переживите его.'],
        inner_critic: ['Ask it: “what are you protecting?” — then thank it and continue.', 'Спросите его: «что ты защищаешь?» — поблагодарите и продолжайте.'],
        pleaser: ['Say one honest “not really” this week — small, safe, real.', 'Скажите одно честное «на самом деле нет» на этой неделе — маленькое, безопасное, настоящее.'],
        controller: ['Let someone else drive once — and watch the world not end.', 'Позвольте кому-то другому вести — и убедитесь, что мир не рухнул.'],
        analyst: ['Name one feeling out loud without the word “because”.', 'Назовите одно чувство вслух — без слова «потому что».'],
        hermit: ['Send one “thinking of you” text. No occasion needed.', 'Отправьте одно «думаю о тебе» — без повода.'],
        bypasser: ['Let one bad moment be fully bad for sixty seconds.', 'Позвольте одному плохому моменту быть целиком плохим шестьдесят секунд.'],
        numb: ['Once a day ask: “if I did feel something — what would it be?”', 'Раз в день спрашивайте: «если бы я что-то чувствовал(а) — что бы это было?»'],
        rebel: ['Choose one rule to follow — on purpose, as an experiment.', 'Выберите одно правило, чтобы соблюсти, — нарочно, как эксперимент.'],
        charmer: ['Tell one person something unpolished and true.', 'Расскажите одному человеку что-то неотшлифованное и правдивое.'],
        abandoned: ['Sit with one unanswered message for an hour. Notice the sky stays up.', 'Побудьте час с одним неотвеченным сообщением. Заметьте: небо не упало.'],
        ashamed: ['Show one person something you made before it was perfect.', 'Покажите одному человеку то, что вы сделали, ещё до совершенства.'],
        frightened: ['Take one small step past the exit map. Then come back — by choice.', 'Сделайте шаг за карту выходов. Потом вернитесь — по своему выбору.'],
        unseen: ['Say one true sentence in a group this week. Let it land.', 'Скажите одно правдивое предложение в группе на этой неделе. Дайте ему прозвучать.'],
        sage: ['Before a hard talk, ask the Sage: “what actually matters here?”', 'Перед трудным разговором спросите Мудреца: «что здесь по-настоящему важно?»'],
        warrior: ['Practice one warm no: “Not this time — and I do like you.”', 'Потренируйте тёплое «нет»: «Не в этот раз — и ты мне правда нравишься».'],
        caregiver: ['Give yourself one hour of your own best care this week.', 'Подарите себе час собственной лучшей заботы на этой неделе.'],
        explorer: ['Finish one small boring thing — purely to feel the other muscle.', 'Доведите до конца одну маленькую скучную вещь — просто чтобы почувствовать другую мышцу.'],
      },
      // Named pair dynamics (bilingual) — the chemistry lab's signature reactions.
      duos:       {
        'rebel|taskmaster': {
          t: ['The Deadline Heist', 'Ограбление дедлайна'],
          n: ['The Taskmaster writes the schedule; the Rebel sells the schedule’s furniture. Productive sabotage — unless the Rebel gets one owned block of beautiful anarchy per week.', 'Деятель строит расписание — Бунтарь распродаёт его с потрохами. Саботаж выходит продуктивным, если выделить Бунтарю еженедельный кусок прекрасной анархии в его полное владение.'],
        },
        'abandoned|hermit': {
          t: ['Asymmetric Orbit', 'Асимметричная орбита'],
          n: ['One invests intensely; the other holds loosely. The imbalance is built into the structure. Named early, it becomes rhythm; unnamed, it becomes the Ghosting Loop.', 'Один вкладывается сильно; другой держится свободно. Дисбаланс заложен в самой структуре отношений. Названный рано, он становится ритмом; неназванный — петлёй исчезновений.'],
        },
        'charmer|unseen': {
          t: ['Stage Light, Backstage Shadow', 'Свет рампы, тень за кулисами'],
          n: ['The Charmer performs the person the Unseen One is sure no one wants. Encore after encore, the audience applauds someone who isn’t there.', 'Обаяшка играет человека, которым — тот в этом уверен — никто не заинтересуется. Бис за бисом зал аплодирует тому, кого здесь нет.'],
        },
        'inner_critic|sage': {
          t: ['The Auditor and the Oracle', 'Аудитор и оракул'],
          n: ['The Critic grades the exam; the Sage already knows it doesn’t count. When both are loud, address the Critic first — it’s the one who’s scared.', 'Критик проверяет экзамен; Мудрец уже знает, что его не засчитают. Когда громкие оба — сначала к Критику: именно ему страшно.'],
        },
        'pleaser|warrior': {
          t: ['The Velvet Fence', 'Бархатный забор'],
          n: ['Warmth with a spine. When these two align you get the rarest social physics: kindness that doesn’t invoice anyone — including you.', 'Тепло с хребтом. Когда эти двое в согласии, рождается редчайшая социальная физика: доброта, не выставляющая счёт никому — включая вас.'],
        },
        'controller|explorer': {
          t: ['The Map and the Wind', 'Карта и ветер'],
          n: ['One charts; one sails off the chart. As a team they go further than either dares alone — as rivals they produce itineraries for trips that never happen.', 'Один чертит карту; второй уплывает за её край. В команде они заходят дальше, чем каждый осмелился бы один; как соперники — рисуют маршруты путешествий, которые не случатся.'],
        },
        'abandoned|numb': {
          t: ['Signal in the Fog', 'Сигнал в тумане'],
          n: ['The Numb turns the volume down exactly where the Abandoned One broadcasts. The channel deserves one low-volume broadcast a day.', 'Онемение убавляет громкость ровно там, откуда вещает Брошенный. Этому каналу нужен один негромкий эфир в день.'],
        },
        'analyst|frightened': {
          t: ['The Threat Model', 'Модель угрозы'],
          n: ['The Analyst gives the Frightened One something unprecedented: the threat, laid out as data. Panic slows when it becomes a spreadsheet.', 'Аналитик даёт Напуганному то, чего тот никогда не встречал: угрозу, разложенную по таблице. Паника замедляется, становясь таблицей.'],
        },
        'caregiver|numb': {
          t: ['The Lighthouse Effect', 'Эффект маяка'],
          n: ['Light for everyone else, fog for itself. The Caregiver refills others while the Numb mutes its own gauge. Wells need gauges.', 'Свет всем остальным, туман — себе. Заботник наполняет других, пока Онемение глушит его собственный датчик. Колодцам нужны датчики.'],
        },
        'inner_critic|warrior': {
          t: ['The Drill Sergeant', 'Сержант-инструктор'],
          n: ['Both cut clean — one inward, one outward. Pointed outward together they defend standards; pointed inward they defend nothing and charge rent.', 'Оба режут чисто — один внутрь, другой наружу. Направленные наружу вместе, они защищают стандарты; внутрь — лишь берут с вас аренду.'],
        },
        'caregiver|taskmaster': {
          t: ['Compassion Logistics', 'Логистика сострадания'],
          n: ['The Taskmaster industrializes the Caregiver’s warmth: meals planned, crises calendared. Watch the tank — this duo volunteers for everything.', 'Деятель превращает тепло Заботника в производство: еда спланирована, кризисы в календаре. Следите за баком — эта пара вызывается добровольцами на всё.'],
        },
        'ashamed|bypasser': {
          t: ['The Quick Paint Job', 'Косметический ремонт'],
          n: ['The Bypasser paints over what the Ashamed One is hiding — both convinced the inspection is coming. One uncovered corner, shown to one safe person, breaks the loop.', 'Обходчик закрашивает то, что прячет Стыдящийся, — оба уверены: скоро проверка. Один открытый угол, показанный одному безопасному человеку, разрывает петлю.'],
        },
        'controller|rebel': {
          t: ['Catalyst Collision', 'Столкновение катализаторов'],
          n: ['Two high-agency vectors, opposite headings. Brilliant for starting revolutions. Catastrophic for group projects. Assign separate theaters of war.', 'Два мощных вектора, противоположные курсы. Блестяще для начала революций. Катастрофично для групповых проектов. Разведите их по разным театрам военных действий.'],
        },
        'explorer|hermit': {
          t: ['The Weekend Cartographer', 'Картограф выходного дня'],
          n: ['Far horizons, deep caves — both authentic, mutually exclusive on Tuesdays. This pair thrives on explicit seasons: explore hard, then guard the cave without apology.', 'Далёкие горизонты, глубокие пещеры — оба настоящие, и друг с другом они уживаются через раз. Эта пара живёт сезонами: исследовать на полную, потом охранять пещеру без извинений.'],
        },
      },
      fam:       {
        manager: { em: '📋', hex: '#E1734B', n: ['Manager', 'Менеджер'], line: ['The ones who keep tomorrow safe.', 'Те, кто сохраняет завтрашний день безопасным.'] },
        firefighter: { em: '🧯', hex: '#E58FA0', n: ['Firefighter', 'Пожарный'], line: ['The ones who arrive when it burns.', 'Те, кто прибегает, когда горит.'] },
        exile: { em: '🫧', hex: '#8F63C0', n: ['Exile', 'Изгнанник'], line: ['The young ones who hold the hurt.', 'Молодые, которые несут боль.'] },
        resource: { em: '🌿', hex: '#46A29D', n: ['Resource', 'Ресурс'], line: ['The ones the Self can lean on.', 'Те, на кого может опереться Self.'] },
      },
      // Manager→exile guard links drawn on the sky map.
      guardLinks:       [
        ['pleaser', 'abandoned'],
        ['inner_critic', 'ashamed'],
        ['controller', 'frightened'],
        ['analyst', 'unseen'],
      ],
      rings:       { exile: 0.34, firefighter: 0.52, manager: 0.72, resource: 0.9 },
      speeds:       { exile: 0.00016, firefighter: -0.00011, manager: 0.00007, resource: -0.00005 },
      baseAngle:       { exile: 0.6, firefighter: 2.2, manager: 0, resource: 1.1 },

    axes: {
      ag: ['Agency', 'Драйв'],
      te: ['Heat', 'Накал'],
      fo: ['Focus', 'Фокус'],
      at: ['Attachment', 'Привязанность'],
    } as Record<string, [string, string]>,

    chemTiers: [
      {
        verdict: ['Working Gravity', 'Рабочая гравитация'],
        note: [
          'Different masses, stable dance. Occasional wobble is the system correcting its course. Give them clear lanes and they compound.',
          'Разные массы, стабильный танец. Лёгкое покачивание — система поправляет курс. Дайте им свои полосы — и они усилят друг друга.',
        ],
      },
      {
        verdict: ['Dynamic Friction', 'Динамическое трение'],
        note: [
          'Real tension, real torque. This pairing gets things moving that comfortable pairs never touch — but it burns fuel. Schedule recovery on purpose.',
          'Настоящее напряжение, настоящий момент силы. Эта пара сдвигает то, до чего уютным парам дело не доходит, — но она жжёт топливо. Планируйте восстановление заранее.',
        ],
      },
      {
        verdict: ['Collision Course', 'Курс столкновения'],
        note: [
          'Opposite vectors at high stakes. Brilliant in short bursts; catastrophic unsupervised. Never let these two co-sign the same plan without a third part in the room.',
          'Противоположные вектора на высоких ставках. Блестяще короткими рывками; катастрофично без присмотра. Не позволяйте этим двоим подписывать один план без третьей части в комнате.',
        ],
      },
    ] as { verdict: [string, string]; note: [string, string] }[],
    lensGaps: {
      ag: ['Agency gap {n} — one drives, one drifts', 'Разрыв драйва {n} — один ведёт, другой дрейфует'],
      te: ['Temperature gap {n} — different burn rates', 'Разрыв темпа {n} — разная скорость горения'],
      fo: ['Focus gap {n} — telescopes pointed elsewhere', 'Разрыв фокуса {n} — телескопы смотрят в стороны'],
      at: ['Attachment gap {n} — one anchors, one wanders', 'Разрыв привязанности {n} — один якорь, другой странник'],
    } as Record<string, [string, string]>,
    lensAllMatched: ['All four axes closely matched', 'Все четыре оси близко совпадают'] as [string, string],
    share: [
      'Innerverse ✦ meet your anxiety, your anger, and your care — and everyone who stands behind them. One sky, precise measurement.',
      'Innerverse ✦ познакомьтесь со своей тревогой, яростью и заботой — и с теми, кто за ними стоит. Одно небо, точные измерения.',
    ],
    familyLegendUpper: {
      manager: ['MANAGERS', 'МЕНЕДЖЕРЫ'],
      firefighter: ['FIREFIGHTERS', 'ПОЖАРНЫЕ'],
      exile: ['EXILES', 'ИЗГНАННИКИ'],
      resource: ['RESOURCES', 'РЕСУРСЫ'],
    } as Record<string, [string, string]>,
    skyCanvasSelfLabel: ['SELF ✦ YOU', 'SELF ✦ ВЫ'],
    /** Tap-the-Self popup: what the Self, the stars and the rings mean (bilingual). */
    selfInfo: {
      title: ['What this map is', 'Что это за карта'],
      p1: ['This is a map of your inner sky. At the center is you: the calm, clear self from which everything is noticed. In IFS this is called the Self.', 'Это карта вашего внутреннего неба. В центре — вы: спокойное, ясное «я», из которого всё замечается. В методе IFS это называют Самостью или Сэлф.'],
      p2: ['Each star is one of the ways you live: the Taskmaster, the Critic, the Caregiver… Each has its own orbit — a familiar path you are led along in familiar situations.', 'Каждая звезда — один из способов, которыми вы живёте: Деятель, Критик, Заботник… У каждой — своя орбита: привычный путь, по которому вас ведёт в знакомых ситуациях.'],
      p3: ['The rings are four families: Managers watch over order and safety; Firefighters arrive when the situation is critical and the managers cannot cope; Exiles carry old pain; Resources are inner strengths and support.', 'Кольца — четыре семьи: Менеджеры следят за порядком и безопасностью; Пожарные приходят, когда ситуация критическая и менеджеры не справляются; Изгнанники несут старую боль; Ресурсы — внутренние силы и поддержка.'],
      close: ['Close', 'Закрыть'],
    },
    partEditorNamePlaceholder: ['Name', 'Название'],

    draftNameFallback: ['My part', 'Моя часть'],
    chemDefault: {
      verdict: ['Sweet Orbit', 'Сладкая орбита'],
      note: [
        'Low drag, matched tempo. These two run nearly the same physics; the risk to watch is an echo chamber, where nobody aboard flags the icebergs.',
        'Малое трение, совпадающий темп. Эти двое работают почти на одной физике — риск не в трении, а в эхо-камере: никто на борту не замечает айсберги.',
      ],
    } as { verdict: [string, string]; note: [string, string] },

  },
  // ── Universe controls (cluster filters) ────────────────────────────────
  universeControls: {
    clusterCopy: {
      ru: { managers: 'Менеджеры', firefighters: 'Пожарные', exiles: 'Изгнанники', resources: 'Ресурсы' },
      en: { managers: 'Managers', firefighters: 'Firefighters', exiles: 'Exiles', resources: 'Resources' },
    },
    clusterDescCopy: {
      ru: {
        managers: 'Заранее удерживают порядок, чтобы плохой день так и не наступил.',
        firefighters: 'Ночная смена: приходят мгновенно, когда внутри загорается.',
        exiles: 'Несут юную боль, спрятанную от повседневной жизни.',
        resources: 'Выращенные силы, на которые может опереться Self.',
      },
      en: {
        managers: 'Keep order preemptively so the bad day never arrives.',
        firefighters: 'The night shift: they arrive the moment something inside catches fire.',
        exiles: 'Carry the young pain hidden from daily life.',
        resources: 'Grown strengths the Self can lean on.',
      },
    },
  },

  // ── Cabinet (scoring chip + appointments) ──────────────────────────────
  cabinet: {
    scoring: {
      deterministic: { ru: 'точный расчёт', en: 'deterministic' },
      fallback: { ru: 'ИИ-режим', en: 'AI mode' },
    },
    booking: {
      ru: {
        title: 'Мои записи',
        body: 'Сессии со специалистом: заявки, подтверждения и отмена.',
        empty: 'Записей пока нет.',
        book: 'Записаться к специалисту',
        cancel: 'Отменить',
        statusPending: 'ожидает',
        statusApproved: 'подтверждена',
        statusDeclined: 'отклонена',
        statusCancelled: 'отменена',
      },
      en: {
        title: 'My appointments',
        body: 'Sessions with a therapist: requests, confirmations, and cancellations.',
        empty: 'No appointments yet.',
        book: 'Book a session',
        cancel: 'Cancel',
        statusPending: 'pending',
        statusApproved: 'approved',
        statusDeclined: 'declined',
        statusCancelled: 'cancelled',
      },
    },
  },

  // ── Archetype detail card ──────────────────────────────────────────────
  archetypeDetailCard: {
    familyNames: {
      managers: ['Managers', 'Менеджеры'],
      firefighters: ['Firefighters', 'Пожарные'],
      exiles: ['Exiles', 'Изгнанники'],
      resources: ['Resources', 'Ресурсы'],
    } as Record<string, [string, string]>,
  },

  // ── App shell (map gate + system alerts) ───────────────────────────────
  app: {
    gate: {
      ru: {
        title: 'Сначала пройдите погружение',
        body: 'Отчёт, чек-ин, практика и сравнение открываются после первой карты — три подхода по 49 утверждений, около 25 минут. Прогресс сохраняется, можно сделать паузу.',
        cta: '✦ Начать погружение',
        login: 'Войти в аккаунт',
        close: 'Позже',
      },
      en: {
        title: 'Complete your first descent',
        body: 'The report, check-in, practice and synastry open after your first map — three sittings of 49 statements, about 25 minutes. Progress is saved, pauses welcome.',
        cta: '✦ Start the descent',
        login: 'Sign in',
        close: 'Later',
      },
    },
    hero: {
      line: ['meet everyone you are.', 'внутри вас — целая вселенная.'],
    },
    alerts: {
      nothingToSave: ['Nothing to save yet — complete a descent first.', 'Пока нечего сохранять — сначала пройдите погружение.'],
      mapRestored: ['Map restored', 'Карта восстановлена'],
      answersRestored: ['Answers restored', 'Ответы восстановлены'],
      checkoutUnavailable: ['Checkout is not available yet. Please try again later.', 'Оплата пока недоступна. Попробуйте позже.'],
      loadingTagline: ['Innerverse · a map of your inner world', 'Innerverse · карта вашего внутреннего мира'],
    },
  },

  // ── Results panel (clinical export report) ─────────────────────────────
  resultsPanel: {
    exportLabels: {
      ru: {
        title: 'Клинический отчёт ArchetypeAI',
        generated: 'Сформировано',
        language: 'Язык',
        primary: 'Основной архетип',
        narrative: 'Нарратив',
        signature: 'Размерный профиль',
        poleScores: 'Оценки полюсов',
        pantheon: 'Пантеон',
        complexes: 'Комплексы',
        defense: 'Иерархия защит',
        triggers: 'Карта триггеров',
        pathway: 'Путь интеграции',
        diagnostics: 'Диагностика',
        note: 'Информационный отчёт. Не является медицинским или психиатрическим диагнозом.',
        noneDetected: 'Не обнаружено.',
        noneMapped: 'Не сопоставлено.',
        noNarrative: 'Нарратив отсутствует.',
        na: 'Н/Д',
      },
      en: {
        title: 'ArchetypeAI Clinical Report',
        generated: 'Generated',
        language: 'Language',
        primary: 'Primary archetype',
        narrative: 'Narrative',
        signature: 'Dimensional Signature',
        poleScores: 'Pole Scores',
        pantheon: 'Pantheon',
        complexes: 'Complexes',
        defense: 'Defense Hierarchy',
        triggers: 'Trigger Map',
        pathway: 'Integration Pathway',
        diagnostics: 'Diagnostics',
        note: 'Informational report only. Not a medical or psychiatric diagnosis.',
        noneDetected: 'None detected.',
        noneMapped: 'None mapped.',
        noNarrative: 'No narrative available.',
        na: 'N/A',
      },
    },
    partTypesRu: {
      manager: 'Менеджер', firefighter: 'Пожарный', exile: 'Изгнанник', self: 'Самость',
    } as Record<string, string>,
    originsRu: {
      pre_verbal: 'Довербальный период',
      early_attachment: 'Ранняя привязанность',
      oedipal: 'Эдипальный период',
      latency: 'Латентный период',
      adolescent: 'Подростковый период',
    } as Record<string, string>,
    metrics: {
      ru: {
        agency: 'Инициативность', temperature: 'Эмоциональность', focus: 'Фокус внимания', attachment: 'Близость и дистанция',
        health: 'Здоровье',
        agencyCenter: 'Центр инициативности', temperatureCenter: 'Центр эмоциональности',
        focusCenter: 'Центр фокуса', attachmentCenter: 'Центр близости',
        symbol: 'Символ', cluster: 'Кластер', prominence: 'Значимость',
        partType: 'Тип части', origin: 'Развитие', wound: 'Рана', shadow: 'Тень',
        invitation: 'Приглашение', coreBelief: 'Базовое убеждение', attracts: 'Притягивает',
        layer: 'Уровень',
        dissociation: 'Диссоциация', regulation: 'Регуляция', boundaries: 'Границы', coherence: 'Когерентность',
      },
      en: {
        agency: 'Agency', temperature: 'Temperature', focus: 'Focus', attachment: 'Attachment',
        health: 'Health',
        agencyCenter: 'Agency center', temperatureCenter: 'Temperature center',
        focusCenter: 'Focus center', attachmentCenter: 'Attachment center',
        symbol: 'Symbol', cluster: 'Cluster', prominence: 'Prominence',
        partType: 'Part type', origin: 'Developmental origin', wound: 'Wound', shadow: 'Shadow',
        invitation: 'Invitation', coreBelief: 'Core belief', attracts: 'Attracts',
        layer: 'L',
        dissociation: 'Dissociation', regulation: 'Regulation', boundaries: 'Boundaries', coherence: 'Coherence',
      },
    },

    fallbackNarrativeRu: {
      noNarrative: 'Текст анализа недоступен.',
      complexTop: 'Наиболее выраженный комплекс:',
      complexesNone: 'Выраженные комплексы не обнаружены.',
      title: '## Ваш портрет отношений',
      profileLine: (name, prominence, description) => `Профиль организован вокруг части **${name}** с выраженностью ${prominence}%. Эта часть показывает главный способ выстраивать отношения: ${description}`,
      coreDynamic: '### Основная динамика',
      shadowLine: (wound, shadow) => `${wound} Защитная тень проявляется как: ${shadow}`,
      clinicalTitle: '### Клиническая перспектива',
      clinicalLine: (complexLine, regulation, dissociation, boundary, coherence) => `${complexLine} Регуляция: ${regulation}; диссоциация: ${dissociation}; границы: ${boundary}; связность истории: ${coherence}.`,
      integrationTitle: '### Направление интеграции',
    },

  },

  // ── Innerverse constellation ───────────────────────────────────────────
  constellation: {
    title: [
      'Your inner constellation: {n} parts around the Self',
      'Ваше внутреннее созвездие: {n} частей вокруг Self',
    ],
  },

};

export type CheckinJitaiCards = typeof STRINGS.checkin.jitaiCards;
void [null as JitaiCardId | null];

// NOTE: content adapters import FROM this file; nothing should runtime-import
// the adapted modules back into strings.ts (anti-cycle architecture).

// ── PART COPY ─── four-layer part copy, [EN, RU] tuples (moved from src/app/core/data/part-copy.ts) ──
// Each part has face, need, shadow, superpower as [english, russian] pairs.

export type PartCopyTuple = { face: [string, string]; need: [string, string]; shadow: [string, string]; superpower: [string, string] };

export const PART_COPY: Record<string, PartCopyTuple> = {
  taskmaster: {
    face: ['The one who is always visibly productive.', 'Тот, кто всегда на виду и всегда продуктивен.'],
    need: ['Needs to know worth exists without output.', 'Нужно знать: ценность есть и без результата.'],
    shadow: ['Grinds past exhaustion to outrun a sense of worthlessness.', 'Грызёт себя до изнеможения, убегая от чувства ничтожности.'],
    superpower: ['Disciplined drive that serves a chosen life.', 'Дисциплина, служащая выбранной жизни.'],
  },
  inner_critic: {
    face: ['The sharp evaluator of everything you do.', 'Строгий оценщик всего, что вы делаете.'],
    need: ['Needs to know being seen will not end in rejection.', 'Нужно знать: быть увиденным не значит быть отвергнутым.'],
    shadow: ['Attacks you first so no one else can.', 'Нападает первым, чтобы не напали другие.'],
    superpower: ['Discernment — precise, kind standards.', 'Проницательность — точные и добрые мерки.'],
  },
  pleaser: {
    face: ['The agreeable one who keeps every room smooth.', 'Уживчивый, сглаживающий любое напряжение.'],
    need: ['Needs to know closeness survives disagreement.', 'Нужно знать: близость переживёт несогласие.'],
    shadow: ['Erases its own preferences to buy belonging.', 'Стирает свои предпочтения ради принадлежности.'],
    superpower: ['Real warmth and diplomatic care.', 'Настоящее тепло и дар дипломатии.'],
  },
  controller: {
    face: ['The planner with a contingency for everything.', 'Планировщик, у которого на всё есть запасной вариант.'],
    need: ['Needs to know the world holds without being held.', 'Нужно знать: мир держится и без вашей хватки.'],
    shadow: ['Clamps down on life to prevent collapse.', 'Сжимает жизнь, предотвращая крах.'],
    superpower: ['Stewardship — order that serves, not constricts.', 'Попечительство: порядок, который служит человеку.'],
  },
  analyst: {
    face: ['The calm explainer of whatever happens.', 'Спокойный толкователь всего, что происходит.'],
    need: ['Needs to know feelings will not drown it.', 'Нужно знать: чувства не утопят.'],
    shadow: ['Lives in the explanation to avoid the experience.', 'Живёт в объяснении, избегая переживания.'],
    superpower: ['Clarity that maps hard things truly.', 'Ясность, честно отображающая сложное.'],
  },
  hermit: {
    face: ['The one who is gloriously hard to reach.', 'Тот, кого славно трудно достать.'],
    need: ['Needs to know company can be safe again.', 'Нужно знать: общество снова может быть безопасным.'],
    shadow: ['Withdraws preemptively from a feared world.', 'Уходит заранее от страшного мира.'],
    superpower: ['Deep solitude that genuinely restores.', 'Глубокое уединение, по-настоящему восстанавливающее.'],
  },
  bypasser: {
    face: ['The one who finds the silver lining instantly.', 'Мгновенно находящий светлую сторону.'],
    need: ['Needs to know pain can be survived, not skipped.', 'Нужно знать: боль можно прожить — шаг за шагом.'],
    shadow: ['Transcends feelings it never actually felt.', 'Возвышается над чувствами, которых не чувствовал.'],
    superpower: ['Genuine perspective, after feeling.', 'Настоящий взгляд с высоты — после прожитого.'],
  },
  numb: {
    face: ['The one who is fine, always fine.', 'Тот, у кого всё нормально, всегда нормально.'],
    need: ['Needs to know what was overwhelming is over.', 'Нужно знать: невыносимое уже позади.'],
    shadow: ['Fogs out feeling before it can arrive.', 'Затуманивает чувство раньше, чем оно придёт.'],
    superpower: ['The capacity to pause — real stillness.', 'Способность к паузе — настоящая тишина.'],
  },
  rebel: {
    face: ['The one who will not be told.', 'Тот, кому не указывают.'],
    need: ['Needs to know closeness does not mean capture.', 'Нужно знать: в близости можно остаться собой.'],
    shadow: ['Burns bridges to stay sovereign.', 'Сжигает мосты, чтобы остаться собой.'],
    superpower: ['Boundary courage — a clean, loud no.', 'Мужество границ — чистое громкое «нет».'],
  },
  charmer: {
    face: ['The unforgettable entrance, the perfect exit line.', 'Незабываемый выход и идеальная последняя реплика.'],
    need: ['Needs to know mattering does not require a stage.', 'Нужно знать: значимость не требует сцены.'],
    shadow: ['Performs for love it fears it can\'t otherwise have.', 'Играет любовь, которой боится не заслужить.'],
    superpower: ['Magnetism and aliveness, honestly offered.', 'Магнетизм и живость, честно предложенные.'],
  },
  abandoned: {
    face: ['The one who texts first, always.', 'Тот, кто всегда пишет первым.'],
    need: ['Needs to know being left is not destiny.', 'Нужно знать: «меня оставят» — страшный прогноз, и прогнозы сбываются не всегда.'],
    shadow: ['Clinging and testing to disprove the belief "I will be left."', 'Цепляется и проверяет, опровергая «меня бросят».'],
    superpower: ['Loyalty and a huge heart for connection.', 'Верность и огромное сердце для связи.'],
  },
  ashamed: {
    face: ['The one who hides the real work.', 'Тот, кто прячет настоящую работу.'],
    need: ['Needs to know being seen does not mean being condemned.', 'Нужно знать: быть увиденным не значит быть осуждённым.'],
    shadow: ['Carries "I am defective" like a fact.', 'Носит «я дефектный» как факт.'],
    superpower: ['Humility that is honest, not self-erasing.', 'Смирение, растущее из честности с собой.'],
  },
  frightened: {
    face: ['The one who knows where the exits are.', 'Тот, кто знает, где выходы.'],
    need: ['Needs to know it is safe now.', 'Нужно знать: сейчас безопасно.'],
    shadow: ['Braces against a danger that already passed.', 'Сжимается от опасности, которая уже прошла.'],
    superpower: ['Alertness — a guardian\'s attention.', 'Бдительность — внимание стража.'],
  },
  unseen: {
    face: ['The quiet one at the edge of the photo.', 'Тихий на краю фотографии.'],
    need: ['Needs to know it matters, exactly as it is.', 'Нужно знать: он важен таким, каков есть.'],
    shadow: ['Fades out so others need not bother.', 'Растворяется, чтобы не утруждать других.'],
    superpower: ['Witnessing — the art of truly seeing others.', 'Умение по-настоящему видеть других.'],
  },
  // Resources (gift-first; the sheet shows дар for every part — цена retired)
  sage: {
    face: ['The quiet knowing that sees the whole field.', 'Тихое знание, которое видит всю картину.'],
    need: ['Needs silence for perspective to emerge.', 'Нужна тишина, чтобы проявилась перспектива.'],
    shadow: ['Observes from the balcony and forgets to join.', 'Наблюдает с балкона и забывает спуститься.'],
    superpower: ['Clear perspective that holds the whole picture.', 'Ясный взгляд, который держит картину целиком.'],
  },
  warrior: {
    face: ['The clear no that protects what matters.', 'Ясное «нет», которое защищает важное.'],
    need: ['Needs a cause worth its strength.', 'Нужно дело, достойное его силы.'],
    shadow: ['Mistakes every wall for a challenge.', 'Принимает любую стену за вызов.'],
    superpower: ['Firm boundaries without aggression.', 'Твёрдые границы без агрессии.'],
  },
  caregiver: {
    face: ['The warm tending that asks nothing back.', 'Тепло, которое заботится и ничего не ждёт взамен.'],
    need: ['Needs to be needed — and to rest.', 'Нужно быть нужным — и отдыхать.'],
    shadow: ['Gives until its own well runs dry.', 'Отдаёт, пока свой колодец не пересохнет.'],
    superpower: ['Warmth that heals without burning out.', 'Тепло, которое врачует и не выгорает.'],
  },
  explorer: {
    face: ['The curious reach toward the new.', 'Любопытный шаг навстречу новому.'],
    need: ['Needs novelty to feel alive.', 'Нужна новизна, чтобы чувствовать жизнь.'],
    shadow: ['Leaves before the map is drawn.', 'Уходит раньше, чем карта дорисована.'],
    superpower: ['Fresh eyes that find doors in walls.', 'Свежий взгляд, который находит двери в стенах.'],
  },
};

// ── ITEM TEXTS ─── 147-item bank, en + ru (moved from src/i18n/items.ts) ──
// Shape: shadow items (8 per part × 14 parts), resource items (6 per part × 4),
// self items (8), validity items (3). Same key order in both languages.

export const LIKERT_TEXTS = {
  en: ['Never true of me', 'Rarely true of me', 'Sometimes true of me', 'Very often true of me', 'Almost always true of me'],
  ru: ['Совсем не про меня', 'Скорее не про меня', 'Иногда про меня', 'Чаще всего про меня', 'Точно про меня'],
} as const;

export const ITEM_TEXTS = {
  en: {
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
  },
  ru: {
    items: {
      taskmaster: [
        'Когда хвалят чужую работу, во мне просыпается желание успеть больше',
        'Если свободный вечер не приносит никакого результата, мне становится не по себе',
        'Я требую от себя того, чего никогда не стал(а) бы требовать от других',
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
        'Когда нежеланную встречу отменяют, я чувствую скорее облегчение, чем разочарование',
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
        'В течение дня я чувствую своё тело живым и включённым',
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
        'Я могу ничем не выделяться на людях — и мне от этого хорошо',
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
      'Свои внутренние реакции я встречаю с любопытством и без страха',
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
  },
};
// ── EXERCISE COPY ─── 56 exercises, en + ru (moved from src/app/core/data/exercises.ts) ──
// Each exercise has title, description ("why"), step instructions, and optional stop rule.

/** Exercise id → type mapping (for adapter to rebuild EXERCISES array). */
export const EXERCISE_TYPE_MAP: Record<string, string> = {
  'paced-breath': 'regulation',
  'noticing-reframe': 'unblending',
  'six-f-steps': 'part_dialogue',
  'two-column-poles': 'polarization',
  'urge-surfing': 'firefighter',
  'notice-the-thought': 'defusion',
  'smallest-test': 'experiment',
  'pendulation': 'somatic',
  'self-compassion-break': 'self_energy',
  'one-small-no': 'resource',
  'loop-pause': 'relational',
  'letter-younger-self': 'exile_witness',
  'four-way-split': 'attribution',
  'possible-selves': 'horizon',
  'old-story-prediction': 'prediction_error',
  'strength-rebalance': 'polarity',
  'build-safe-place': 'safe_place',
  'harmless-recording': 'harmless_recording',
  'what-was-it-like': 'metaprocessing',
  'soft-gaze': 'soft_gaze',
  'develop-weakest-spoke': 'self_quality',
  'projection-log': 'shadow_projection',
  'feet-floor-54321': 'regulation',
  'body-scan-3min': 'regulation',
  'back-to-back': 'unblending',
  'blend-o-meter': 'unblending',
  'orient-slow-look': 'somatic',
  'resourcing-imagery': 'somatic',
  'eight-c-anchor': 'self_energy',
  'loving-phrase': 'self_energy',
  'direct-access-note': 'part_dialogue',
  'protection-update': 'part_dialogue',
  'delay-not-deny': 'firefighter',
  'name-the-fire': 'firefighter',
  'moderator-seat': 'polarization',
  'fear-behind-both': 'polarization',
  'belief-as-weather': 'defusion',
  'thank-the-thought': 'defusion',
  'ask-three-people': 'experiment',
  'do-it-badly': 'experiment',
  'warrior-rep-micro': 'resource',
  'caregiver-self-rep': 'resource',
  'soft-gaze-3-breaths': 'soft_gaze',
  'soft-gaze-with-journal': 'soft_gaze',
  'repair-sentence': 'relational',
  'double-click-moment': 'relational',
  'safe-place-portal': 'safe_place',
  'spoke-pairing': 'self_quality',
  'recording-label': 'harmless_recording',
  'witness-the-win': 'metaprocessing',
  'context-first-grid': 'attribution',
  'one-year-letter': 'horizon',
  'expectation-vs-reality': 'prediction_error',
  'dial-not-switch': 'polarity',
  'admiration-projection': 'shadow_projection',
  'witnessing-notes': 'exile_witness',
};

export interface ExerciseText { title: string; desc: string; steps: string[]; stopRule?: string }

export const EXERCISE_COPY: Record<string, { en: ExerciseText; ru: ExerciseText }> = {
  'paced-breath': {
    en: {
      title: "Paced breath 4–6",
      desc: "Longer out-breath than in-breath tells your body the emergency is over.",
      steps: ["Inhale through the nose for a count of 4.","Exhale slowly for a count of 6.","Repeat for 10 rounds, letting the shoulders drop each exhale.","Name one thing that is easier now."],
    },
    ru: {
      title: "Дыхание 4–6",
      desc: "Если выдох длиннее вдоха, тело получает сигнал, что тревога прошла.",
      steps: ["Вдохните носом, посчитав до 4.","Медленно выдохните, посчитав до 6.","Повторите 10 раз, опуская плечи на каждом выдохе.","Назовите одну вещь, которая теперь даётся легче."],
    },
  },
  'noticing-reframe': {
    en: {
      title: "“A part of me…” drill",
      desc: "Naming a reaction as “a part of me” creates instant distance — a watcher appears beside the storm.",
      steps: ["Recall one moment today when a reaction took over.","Say it aloud: “A part of me felt…”.","Notice: who is watching the part? That one is you.","Write one sentence from the watcher’s view."],
    },
    ru: {
      title: "Практика «часть меня»",
      desc: "Если назвать свою реакцию «частью меня», сразу становится немного легче — рядом с сильным чувством появляется тот, кто на него смотрит.",
      steps: ["Вспомните момент сегодня, когда реакция взяла верх.","Скажите вслух: «Часть меня почувствовала…»","Заметьте: а кто вообще это наблюдает? Это и есть вы.","Напишите одно предложение от лица того, кто наблюдает."],
    },
  },
  'six-f-steps': {
    en: {
      title: "Six steps toward a protector",
      desc: "Protectors soften when they are heard; fighting them only hardens them. Ask, never interrogate.",
      steps: ["Find the part in your body; focus on it.","Flesh it out: shape, temperature, age.","Ask: “What is your positive intention for me?”","Thank it for its work — out loud.","Ask: “What are you afraid would happen if you relaxed?”","Write its answer in one sentence."],
      stopRule: "If it gets intense: stop, feet on the floor, and do the paced breath. The part can wait.",
    },
    ru: {
      title: "Шесть шагов к защищающей части",
      desc: "Части, которые нас защищают, смягчаются, когда их слушают, а не когда с ними спорят. Спрашивайте, а не допрашивайте.",
      steps: ["Найдите, где в теле живёт эта часть, и сосредоточьтесь на ней.","Рассмотрите её: какая у неё форма, температура, возраст.","Спросите: «Зачем ты это делаешь для меня? Что хорошего хочешь мне дать?»","Поблагодарите её за работу — вслух.","Спросите: «Чего ты боишься, если перестанешь так стараться?»","Запишите её ответ одним предложением."],
      stopRule: "Если стало слишком тяжело: остановитесь, поставьте стопы на пол и подышите по схеме 4–6. Часть подождёт.",
    },
  },
  'two-column-poles': {
    en: {
      title: "Two columns, one deeper goal",
      desc: "Polarized protectors share a goal underneath the deadlock — find it and the war becomes a team.",
      steps: ["Draw two columns, one per part in the cycle.","Let each side speak: what does it need to stand down?","Ask both: “Do you two share a deeper goal?”","Write one way they could cooperate toward it.","Thank both sides."],
      stopRule: "If it gets intense: close the page and return to paced breath.",
    },
    ru: {
      title: "Две колонки, одна цель",
      desc: "Даже части, которые тянут в разные стороны и заводят вас в тупик, обычно хотят одного и того же на более глубоком уровне. Найдите это общее — и спор превратится в совместную работу.",
      steps: ["Начертите две колонки — по одной на каждую сторону конфликта.","Дайте каждой стороне высказаться: что ей нужно, чтобы немного отступить?","Спросите обе: «Чего вы на самом деле хотите добиться — в конце концов?»","Запишите один способ, которым они могут работать вместе ради этого.","Поблагодарите обе стороны."],
      stopRule: "Если стало слишком тяжело: закройте страницу и вернитесь к дыханию 4–6.",
    },
  },
  'urge-surfing': {
    en: {
      title: "Urge surfing, 10 minutes",
      desc: "An urge is a wave: it rises, crests, falls. You are the surfer on that wave.",
      steps: ["Set a 10-minute timer.","Notice the urge in the body without acting on it.","Rate its intensity 0–10 each minute.","Watch it crest and fall.","Log what actually happened after the timer."],
      stopRule: "If it gets intense: cold water on the wrists, then paced breath.",
    },
    ru: {
      title: "Прокатитесь на волне желания, 10 минут",
      desc: "Сильное желание что-то сделать похоже на волну: оно поднимается, доходит до пика и спадает само по себе. Ваша задача — просто прокатиться на ней, не поддаваясь.",
      steps: ["Поставьте таймер на 10 минут.","Замечайте это желание в теле, но не действуйте по нему.","Каждую минуту оценивайте его силу от 0 до 10.","Наблюдайте, как оно растёт, а затем спадает.","Запишите, что произошло на самом деле, когда таймер закончился."],
      stopRule: "Если стало слишком тяжело: подержите запястья под холодной водой, потом подышите по схеме 4–6.",
    },
  },
  'notice-the-thought': {
    en: {
      title: "“I notice the thought that…”",
      desc: "A core belief is just a sentence. Hearing it as a thought loosens its grip.",
      steps: ["Write your complex’s core belief verbatim.","Rewrite it starting with: “I notice the thought that…”.","Read both aloud; feel the difference.","Write the smallest, truest update — local wording only (“this time”, “with this person”)."],
      stopRule: "If it gets intense: stop after step 2 and ground with three present-day facts.",
    },
    ru: {
      title: "«Я замечаю мысль, что…»",
      desc: "Тяжёлое убеждение о себе — это просто фраза, которая крутится в голове. Если услышать её именно как мысль, а не как факт, она сразу теряет часть своей власти.",
      steps: ["Запишите это убеждение о себе слово в слово, как оно звучит внутри.","Перепишите его, начав со слов: «Я замечаю мысль, что…»","Прочитайте оба варианта вслух и почувствуйте разницу.","Запишите самое маленькое честное уточнение — только про этот случай («в этот раз», «с этим человеком»)."],
      stopRule: "Если стало слишком тяжело: остановитесь после второго шага и назовите три факта из сегодняшнего дня, чтобы вернуться в опору.",
    },
  },
  'smallest-test': {
    en: {
      title: "The smallest safe test",
      desc: "Beliefs predict. Test the prediction — small, real, this week — and let reality answer.",
      steps: ["Write the old story’s specific prediction.","Design the smallest safe test of it.","Run the test; log the actual outcome.","Write the smallest, truest update (no “always/never”)."],
      stopRule: "If it gets intense: shrink the test until it feels doable, or skip this week.",
    },
    ru: {
      title: "Самая маленькая проверка",
      desc: "Наши убеждения о себе часто предсказывают, что произойдёт. Проверьте это предсказание — маленьким, реальным шагом на этой неделе — и посмотрите, что покажет жизнь на самом деле.",
      steps: ["Запишите, что именно ваше старое убеждение предсказывает.","Придумайте самую маленькую безопасную проверку этого предсказания.","Проведите её и честно запишите, что получилось.","Запишите самое небольшое честное уточнение — без слов «всегда» и «никогда»."],
      stopRule: "Если стало слишком тяжело: сделайте проверку ещё меньше, пока она не станет посильной, или отложите на неделю.",
    },
  },
  'pendulation': {
    en: {
      title: "Pendulation: sensation ↔ resource",
      desc: "Never go deeper into a wound than the resource you have online — swing between, don’t push.",
      steps: ["Find a calm sensation somewhere in your body; stay 30 seconds.","Touch the difficult sensation for 10 seconds.","Swing back to the calm sensation for 30 seconds.","End inside the resource. Always."],
      stopRule: "If it gets intense: skip step 2 entirely; the resource beat is a complete practice.",
    },
    ru: {
      title: "Маятник: трудное ↔ спокойное",
      desc: "Не погружайтесь в тяжёлое чувство глубже, чем можете выдержать, — просто покачивайтесь между ним и чем-то устойчивым, не заставляя себя.",
      steps: ["Найдите спокойное ощущение в теле и побудьте с ним 30 секунд.","Ненадолго, на 10 секунд, обратите внимание на трудное ощущение.","Вернитесь к спокойному ощущению на 30 секунд.","Всегда заканчивайте на чём-то спокойном, а не на трудном."],
      stopRule: "Если стало слишком тяжело: пропустите второй шаг полностью — сидеть со спокойным ощущением уже само по себе хорошая практика.",
    },
  },
  'self-compassion-break': {
    en: {
      title: "Self-compassion break (secular)",
      desc: "Three sentences that put Self in the chair: this is hard, this is human, may I be kind to myself now.",
      steps: ["Hand on the chest. Say: “This is a moment of difficulty.”","Say: “Difficulty is part of being human.”","Say: “May I be kind to myself right now.”","Notice one quality that appeared (calm? warmth?)."],
    },
    ru: {
      title: "Пауза для сочувствия к себе",
      desc: "Три фразы, которые помогают отнестись к себе спокойнее: это тяжело, это бывает у всех, могу ли я сейчас быть к себе добрее.",
      steps: ["Положите ладонь на грудь и скажите: «Сейчас мне правда трудно».","Скажите: «Трудности бывают у всех — это часть жизни».","Скажите: «Могу ли я прямо сейчас отнестись к себе по-доброму».","Заметьте, что появилось внутри — может быть, спокойствие или тепло."],
    },
  },
  'one-small-no': {
    en: {
      title: "Warrior rep: one small no",
      desc: "Boundaries are muscles — one clean, small no per week is a full rep.",
      steps: ["Choose one small request this week you’d normally swallow.","Decline it in one warm, clear sentence.","Stay present with the discomfort for 60 seconds.","Log what actually happened."],
    },
    ru: {
      title: "Тренировка отказа: одно маленькое «нет»",
      desc: "Умение отстаивать себя — это как мышца: одно чёткое маленькое «нет» в неделю уже хорошая тренировка.",
      steps: ["Выберите одну небольшую просьбу, на которую обычно соглашаетесь через силу.","Откажите одной тёплой и ясной фразой.","Побудьте с неловкостью 60 секунд, не отменяя решение.","Запишите, что произошло на самом деле."],
    },
  },
  'loop-pause': {
    en: {
      title: "The Loop pause-protocol",
      desc: "When the loop grabs you both: name it, timeout, scripted re-entry.",
      steps: ["Name the loop out loud: “I think the loop has us.”","Take a 20-minute timeout — separately.","Return and re-enter with: “What I felt was… what I need is…”","Log one thing each of you will try next time."],
      stopRule: "If it gets intense: the timeout is part of the protocol; honor it.",
    },
    ru: {
      title: "Пауза в повторяющемся споре",
      desc: "Когда вы оба снова попали в один и тот же знакомый спор — назовите это вслух, возьмите паузу, а потом вернитесь к разговору по простому плану.",
      steps: ["Скажите вслух: «Кажется, мы опять в том самом споре».","Возьмите паузу на 20 минут — каждый по отдельности.","Вернитесь и начните так: «Я чувствовал(а)… мне нужно…»","Запишите по одной вещи, которую каждый попробует сделать в следующий раз."],
      stopRule: "Если стало слишком тяжело: пауза — это часть плана, а не отступление; выдержите её до конца.",
    },
  },
  'letter-younger-self': {
    en: {
      title: "Letter to the younger self",
      desc: "Therapist-assigned homework between live IFS sessions — structured witnessing, never solo deep work.",
      steps: ["Between sessions, with your therapist’s framing: write to the younger one from Self.","Speak only what is true and kind; no fixing.","Bring the letter to your next session — do not work it alone."],
      stopRule: "STOP RULE: this exercise is for use between therapy sessions only. If heaviness rises, put the letter down and contact your therapist.",
    },
    ru: {
      title: "Письмо младшему себе",
      desc: "Это домашнее задание между встречами с вашим терапевтом — способ бережно засвидетельствовать что-то важное, а не разбираться с этим в одиночку.",
      steps: ["Между сессиями, по договорённости с терапевтом, напишите письмо младшему себе из спокойного, ясного состояния.","Пишите только правду и с добротой — не пытайтесь ничего «исправить» в этом письме.","Принесите письмо на следующую встречу с терапевтом — не разбирайте его в одиночку."],
      stopRule: "ВАЖНО: делайте это только в паузах между сессиями с терапевтом. Если становится слишком тяжело — отложите письмо и свяжитесь с терапевтом.",
    },
  },
  'four-way-split': {
    en: {
      title: "Four-way split (60 seconds)",
      desc: "Context → specific act → impact → controllable move. Essence-language bounces off the grid.",
      steps: ["Chips: tired / hungry / alone / conflict / deadline / other.","Name the specific act — one sentence.","Name the impact — one sentence.","Next move must start with “I will” (never “be better”)."],
    },
    ru: {
      title: "Разбор по шагам (60 секунд)",
      desc: "Что было вокруг → что конкретно произошло → как это повлияло → что сделать дальше. Общие слова о себе тут не работают — нужны конкретные факты.",
      steps: ["Отметьте, что было фоном: усталость, голод, одиночество, конфликт, дедлайн или что-то ещё.","Опишите, что конкретно произошло, — одним предложением.","Опишите, как это повлияло на ситуацию, — одним предложением.","Сформулируйте следующий шаг, начиная со слов «Я сделаю…», а не «Стану лучше…»"],
    },
  },
  'possible-selves': {
    en: {
      title: "Possible selves",
      desc: "Expansion before governance: what you are moving toward first; what needs fixing after.",
      steps: ["Write one self you are moving toward (1 year).","Write the self for whom these parts are met.","Write one feared self.","Give each self one micro try-on task this week."],
    },
    ru: {
      title: "Каким я могу стать",
      desc: "Сначала полезно представить, куда вы движетесь, и только потом думать, что именно исправлять.",
      steps: ["Опишите, каким человеком вы хотите стать через год.","Опишите себя таким, у кого все эти части наконец услышаны.","Опишите себя такого, каким боитесь стать.","Придумайте для каждого из этих образов один маленький шаг на эту неделю."],
    },
  },
  'old-story-prediction': {
    en: {
      title: "Mismatch experiment",
      desc: "Reconsolidation needs coherence FIRST (why the old story made sense), then a lived mismatch.",
      steps: ["Coherence beat: name why this belief made sense — it learned this for a good reason.","Write the old story’s specific prediction, verbatim.","Run the smallest safe test; log the actual outcome.","Write the smallest, truest local update."],
      stopRule: "If it gets intense: stop before the test; coherence alone is a valid session.",
    },
    ru: {
      title: "Проверка старого убеждения на прочность",
      desc: "Чтобы убеждение по-настоящему изменилось, сначала стоит понять, почему оно вообще появилось, а потом столкнуть его с реальным опытом, который ему противоречит.",
      steps: ["Сначала признайте: это убеждение появилось не просто так, у него была причина.","Запишите слово в слово, что именно оно предсказывает.","Проведите самую маленькую безопасную проверку и честно запишите результат.","Запишите самое небольшое честное уточнение — только про этот конкретный случай."],
      stopRule: "Если стало слишком тяжело: остановитесь до проверки — уже понять, откуда взялось убеждение, само по себе большая работа.",
    },
  },
  'strength-rebalance': {
    en: {
      title: "Strength rebalancing",
      desc: "A hyper strength leaks into its shadow part — bring it back into its working range; the gift stays.",
      steps: ["Name the resource that tipped into overuse.","Name its shadow spill-part (it is drawn on your map).","Design one week where the strength serves 20% less.","Log what the freed space actually wanted."],
      stopRule: "If it gets intense: keep the reduction tiny — 10% counts.",
    },
    ru: {
      title: "Найдите баланс в своей сильной стороне",
      desc: "Даже хорошее качество, если его слишком много, начинает работать против вас. Можно немного убавить его — и сила при этом никуда не денется.",
      steps: ["Назовите качество, которого у вас, кажется, слишком много.","Назовите, во что оно превращается, когда его слишком много.","Проведите неделю, в которую сознательно используете это качество примерно на 20% реже.","Запишите, что на самом деле появилось на освободившемся месте."],
      stopRule: "Если стало слишком тяжело: пусть сокращение будет совсем небольшим — даже 10% уже считается.",
    },
  },
  'build-safe-place': {
    en: {
      title: "Build your Special Safe Place",
      desc: "The container before any wound work: one imagined scene, populated with resources.",
      steps: ["Choose a place — real or imagined — where your body settles.","Populate it: what do you see, hear, smell?","Invite one resource function in (Nurturing / Protective / Wise / Vital).","Visit it for 2 minutes daily this week."],
    },
    ru: {
      title: "Создайте своё безопасное место",
      desc: "Прежде чем работать с чем-то трудным, полезно иметь такое место, куда всегда можно вернуться, — представьте его во всех подробностях.",
      steps: ["Выберите место, реальное или воображаемое, где тело сразу расслабляется.","Наполните его деталями: что вы там видите, слышите, чем пахнет.","Добавьте туда одно качество, которое вам нужно — заботу, защиту, мудрость или жизненную силу.","Проводите там по 2 минуты каждый день на этой неделе."],
    },
  },
  'harmless-recording': {
    en: {
      title: "The harmless recording",
      desc: "What is replaying is your reaction to an old recording — the event itself is long past. The recording is harmless; your reaction made sense once.",
      steps: ["After a flare, read the reframe above slowly, twice.","Say: “This reaction protected me once. This is a memory flare — it already happened.”","Place one hand where the reaction lives and breathe 4–6 ×5."],
    },
    ru: {
      title: "Это старое воспоминание, а не новая опасность",
      desc: "Когда что-то задевает сильно, вы часто реагируете не на настоящий момент, а на старое воспоминание. Само воспоминание не может причинить вред сейчас — а реакция когда-то имела смысл.",
      steps: ["После того как реакция накрыла, медленно, дважды прочитайте фразу выше.","Скажите себе: «Эта реакция когда-то защищала меня. Это отклик на прошлое — оно уже закончилось».","Положите ладонь туда, где в теле чувствуется реакция, и подышите по схеме 4–6 пять раз."],
    },
  },
  'what-was-it-like': {
    en: {
      title: "Metaprocess the shift",
      desc: "Don’t move past a positive shift — metabolize it. Processing the process deepens encoding.",
      steps: ["Recall one logged positive shift (a softening, a pause).","Ask: “What was it like to feel that?”","Ask: “What is newly possible now?”","Write one line. Skip is allowed."],
    },
    ru: {
      title: "Задержитесь на хорошем изменении",
      desc: "Легко не заметить, когда что-то стало немного легче. Задержитесь на этом на секунду — это помогает изменению закрепиться.",
      steps: ["Вспомните один момент, когда стало немного легче — вы смягчились или сумели сделать паузу.","Спросите себя: «Каково это было — почувствовать так?»","Спросите себя: «Что теперь стало возможным?»","Запишите одну строку об этом. Можно пропустить этот шаг."],
    },
  },
  'soft-gaze': {
    en: {
      title: "Soft Gaze (flagship daily practice)",
      desc: "The core Self-access ritual: notice → thank → ask to step back a little → rest in what remains.",
      steps: ["Notice body and emotion, exactly as they are.","Name the parts present right now.","Thank each one for showing up.","Ask each to step back a little — while staying close.","Rest in whichever qualities are now accessible. Repeat the ask until spaciousness appears."],
    },
    ru: {
      title: "Мягкий Взгляд (главная практика на каждый день)",
      desc: "Простой способ прийти в более спокойное состояние: заметить → поблагодарить → попросить немного отступить → побыть в том, что остаётся.",
      steps: ["Заметьте, что сейчас происходит в теле и в эмоциях, — просто как они есть.","Назовите части себя, которые сейчас дают о себе знать.","Поблагодарите каждую из них за то, что она пришла.","Попросите каждую немного отступить — не уходить совсем, а просто дать чуть больше пространства.","Побудьте в том спокойствии, которое появилось. Если нужно, повторите просьбу ещё раз, пока не станет свободнее."],
    },
  },
  'develop-weakest-spoke': {
    en: {
      title: "Develop your dimmest spoke",
      desc: "One quality at a time: the lowest radar spoke gets one micro-practice.",
      steps: ["Look at your Self Radar; find the dimmest spoke.","Take its micro-practice (e.g. courage: name your worst-case aloud, rate its real likelihood 0–100%).","Practice once daily for a week.","Re-rate the spoke."],
    },
    ru: {
      title: "Укрепите самое слабое качество",
      desc: "Работайте с одним качеством за раз: найдите то, что сейчас развито меньше всего, и дайте ему одну маленькую практику.",
      steps: ["Посмотрите на свою диаграмму качеств и найдите самое слабое место.","Возьмите для него одну маленькую практику (например, для смелости: назовите худший сценарий вслух и оцените, насколько он реально вероятен от 0 до 100%).","Выполняйте эту практику раз в день на протяжении недели.","Оцените это качество заново."],
    },
  },
  'projection-log': {
    en: {
      title: "Shadow via projection",
      desc: "What irritates us in others can be a disowned part working overtime to stay hidden.",
      steps: ["Name 2–3 people who trigger strong judgment in you.","Log the exact emotion, body location, and the specific behavior.","Ask: “What if a part of me carries this too — and hides it hard?”","Hold the answer as a hypothesis. Never a verdict."],
      stopRule: "If it gets intense: this can destabilize — stop and return to Soft Gaze.",
    },
    ru: {
      title: "Что раздражение в других говорит о нас",
      desc: "То, что сильно раздражает нас в других людях, иногда оказывается качеством, которое есть и в нас самих, — просто мы стараемся его не замечать.",
      steps: ["Назовите 2–3 человек, которые вызывают у вас сильное осуждение.","Запишите точную эмоцию, где она чувствуется в теле, и конкретное поведение, которое её вызвало.","Спросите себя: «А что, если часть меня делает то же самое, просто я стараюсь этого не видеть?»","Отнеситесь к ответу как к предположению, которое можно проверить, а не как к готовому выводу о себе.",
      ],
      stopRule: "Если стало слишком тяжело: эта практика может выбить из колеи — остановитесь и вернитесь к практике Мягкий Взгляд.",
    },
  },
  'feet-floor-54321': {
    en: {
      title: "5-4-3-2-1 grounding",
      desc: "When the mind time-travels to old danger, the senses are stuck in the present — borrow them.",
      steps: ["Name 5 things you can see, slowly.","Name 4 things you can feel touching your skin.","Name 3 things you can hear.","Name 2 things you can smell.","Name 1 thing you can taste, then take one slow breath."],
    },
    ru: {
      title: "Заземление 5-4-3-2-1",
      desc: "Когда мысли уносят в прошлую тревогу, органы чувств всё ещё находятся в настоящем — обопритесь на них.",
      steps: ["Медленно назовите 5 вещей, которые видите.","Назовите 4 ощущения, которые чувствует кожа.","Назовите 3 звука, которые слышите.","Назовите 2 запаха, которые чувствуете.","Назовите 1 вкус — и сделайте один медленный вдох."],
    },
  },
  'body-scan-3min': {
    en: {
      title: "Three-minute body scan",
      desc: "Tracking sensation from toes to crown gives the nervous system one job it can finish.",
      steps: ["Set a 3-minute timer, eyes open or closed.","Move attention slowly: feet → legs → belly → chest → shoulders → jaw → crown.","At each zone, note one word: warm, tight, tingling, still.","End by naming the calmest zone you found."],
    },
    ru: {
      title: "Сканирование тела, 3 минуты",
      desc: "Когда вы медленно проходите вниманием по телу от стоп до макушки, это даёт нервной системе простую и понятную задачу.",
      steps: ["Поставьте таймер на 3 минуты, глаза можно закрыть или оставить открытыми.","Медленно проведите внимание: стопы → ноги → живот → грудь → плечи → челюсть → макушка.","В каждой части тела отметьте одно слово: тепло, напряжение, покалывание, спокойствие.","Завершите, назвав самую спокойную часть тела."],
    },
  },
  'back-to-back': {
    en: {
      title: "Back-to-back with the part",
      desc: "You cannot observe a part you are standing inside — take one physical step to the side.",
      steps: ["Stand up and feel where the part lives in your body.","Physically step to the side or turn 90 degrees.","Look back at where you were standing and say: “There it is, and here I am.”","Note one quality you feel from this new spot (space, breath, curiosity)."],
    },
    ru: {
      title: "Сделайте шаг в сторону от части",
      desc: "Трудно посмотреть на часть себя со стороны, если вы всё ещё внутри неё, — сделайте один настоящий шаг в сторону.",
      steps: ["Встаньте и почувствуйте, в какой части тела живёт это чувство.","Физически сделайте шаг в сторону или повернитесь на 90 градусов.","Оглянитесь на то место, где стояли, и скажите: «Там — она, здесь — я».","Заметьте, что чувствуется с новой точки — может быть, больше пространства, свободнее дыхание, любопытство."],
    },
  },
  'blend-o-meter': {
    en: {
      title: "The blend-o-meter",
      desc: "Blending is measured in percentages; the measuring itself creates distance.",
      steps: ["Recall today’s strongest reaction.","Rate honestly: how blended were you, 0–100%?","Ask the part to step back just 10%. Note the new number.","Write one sentence you could only say unblended."],
    },
    ru: {
      title: "Насколько сильно чувство вас захватило",
      desc: "Если оценить в процентах, насколько сильно чувство взяло верх над вами, само это уже создаёт небольшую дистанцию от него.",
      steps: ["Вспомните самую сильную реакцию за сегодняшний день.","Честно оцените: насколько сильно она вас захватила, от 0 до 100%?","Попросите её немного отступить — хотя бы на 10% — и заметьте новую цифру.","Напишите одно предложение, которое можно сказать, только чуть отступив от этого чувства."],
    },
  },
  'orient-slow-look': {
    en: {
      title: "Orienting: the slow look-around",
      desc: "Predator vigilance narrows the visual field; a slow orient tells the animal brain the room is safe.",
      steps: ["Let your eyes wander, without hurrying, around the room.","Let the head follow the eyes — neck, shoulders moving softly.","Notice what your eyes want to rest on; pause there.","End with one full breath and one word for how the body feels now."],
      stopRule: "If it gets intense: close the eyes halfway and orient to sounds instead.",
    },
    ru: {
      title: "Медленный осмотр вокруг себя",
      desc: "Когда мы насторожены, поле зрения сужается. Медленный осмотр комнаты помогает телу почувствовать, что вокруг безопасно.",
      steps: ["Дайте глазам неспешно осмотреть комнату.","Пусть голова следует за взглядом — шея и плечи двигаются мягко.","Заметьте, где взгляду хочется задержаться, и побудьте там.","Завершите одним глубоким вдохом и одним словом о том, как чувствует себя тело."],
      stopRule: "Если стало слишком тяжело: прикройте глаза наполовину и ориентируйтесь по звукам вокруг.",
    },
  },
  'resourcing-imagery': {
    en: {
      title: "Somatic resource imagery",
      desc: "The body cannot tell a vividly imagined resource from a real one — build one it trusts.",
      steps: ["Recall a moment your body felt solid: a place, a person, an activity.","Re-enter it through the senses: what did your skin, ears, nose register?","Find where that solidity lives in your body now; place a hand there.","Stay 60 seconds; name one word for the resource (grounded, held, strong)."],
      stopRule: "If it gets intense: open your eyes and name three objects in the room.",
    },
    ru: {
      title: "Опора в теле через воспоминание",
      desc: "Если ярко представить момент, когда тело чувствовало себя устойчиво, тело откликается почти так же, как на реальность.",
      steps: ["Вспомните момент, когда тело чувствовало себя устойчивым: место, человека, занятие.","Проживите этот момент через ощущения: что чувствовала кожа, что слышали уши, какие были запахи?","Найдите, где эта устойчивость чувствуется в теле сейчас, и положите туда ладонь.","Побудьте так 60 секунд и назовите это ощущение одним словом — устойчивость, опора, сила."],
      stopRule: "Если стало слишком тяжело: откройте глаза и назовите три предмета в комнате.",
    },
  },
  'eight-c-anchor': {
    en: {
      title: "Anchor to one C",
      desc: "Self-energy has a signature — calm, curiosity, clarity, compassion, courage, confidence, creativity, connectedness. One is enough to start.",
      steps: ["Pick the quality that feels even 10% available today.","Recall one concrete moment you lived it (any age counts).","Relive the moment for 30 seconds, sensing where it lives in the body.","Set one tiny if-then: “If X happens today, I will touch that spot and breathe.”"],
    },
    ru: {
      title: "Опора на одно качество",
      desc: "Спокойствие, любопытство, ясность, сострадание, смелость, уверенность, творчество, чувство связи с людьми — это качества, которые доступны каждому из нас хотя бы иногда. Для начала достаточно одного.",
      steps: ["Выберите качество, которое сегодня доступно хотя бы немного.","Вспомните конкретный момент, когда вы его чувствовали — подойдёт любой возраст.","Проживите этот момент 30 секунд, замечая, где он ощущается в теле.","Придумайте простое правило: «Если случится X, я положу руку на это место и сделаю вдох»."],
    },
  },
  'loving-phrase': {
    en: {
      title: "One phrase from Self",
      desc: "A single sentence spoken from Self reaches parts that lectures cannot.",
      steps: ["Choose one part you judge harshly.","Find a phrase that is true, kind, and short (e.g. “I’m here; you can rest.”).","Say it aloud three times, slower each time.","Notice any softening — even 5% counts — and write it down."],
    },
    ru: {
      title: "Одна добрая фраза",
      desc: "Одна фраза, сказанная спокойно и по-доброму, часто доходит до частей, которые не слышат никаких объяснений и уговоров.",
      steps: ["Выберите часть себя, к которой вы обычно строги.","Найдите фразу — правдивую, добрую и короткую (например: «Я здесь, можешь отдохнуть»).","Произнесите её вслух три раза, каждый раз медленнее.","Заметьте любое смягчение — даже небольшое уже считается — и запишите его."],
    },
  },
  'direct-access-note': {
    en: {
      title: "Direct access, written",
      desc: "When a part will not speak to you, let it write in the first person — the hand knows things the mouth guards.",
      steps: ["Ask inside: which part most needs attention today?","Let that part write 3–5 sentences in “I” voice — no editing.","Read it back and underline the one sentence with the most charge.","Ask the part one follow-up question in the margin."],
      stopRule: "If it gets intense: thank the part, close the notebook, and do paced breath for one minute.",
    },
    ru: {
      title: "Дать части написать самой",
      desc: "Если часть себя не хочет говорить вслух, дайте ей написать от первого лица — иногда рука пишет то, что трудно произнести.",
      steps: ["Спросите себя: какой части сегодня больше всего нужно внимание?","Дайте ей написать 3–5 предложений от «я» — без исправлений.","Прочитайте и подчеркните самое сильное предложение.","Задайте этой части один уточняющий вопрос на полях."],
      stopRule: "Если стало слишком тяжело: поблагодарите часть, закройте тетрадь и минуту подышите по схеме 4–6.",
    },
  },
  'protection-update': {
    en: {
      title: "Protection update call",
      desc: "Protectors run on decades-old intelligence — schedule them an updated briefing.",
      steps: ["Name one protector by its role (the pusher, the watcher, the fixer).","Ask: “What did you protect me from, back then?” — and listen without arguing.","Give it one piece of news: one true fact about your life today it may not know.","Ask: “Would you be willing to try 5% less this week, just as an experiment?”"],
      stopRule: "If it gets intense: protectors refuse change when afraid — thank it and stop; a refusal counts as data too.",
    },
    ru: {
      title: "Обновите информацию для защищающей части",
      desc: "Части, которые нас защищают, часто действуют так, будто ничего не изменилось за много лет, — дайте им свежую информацию.",
      steps: ["Назовите одну защищающую часть по её роли — например, контролёр, наблюдатель, тот, кто всё улаживает.","Спросите: «От чего ты меня тогда защищала?» — и просто слушайте, не споря.","Сообщите ей один правдивый факт о вашей сегодняшней жизни, о котором она может не знать.","Спросите: «Готова ли ты попробовать делать это на 5% меньше на этой неделе, просто как эксперимент?»"],
      stopRule: "Если стало слишком тяжело: если защищающая часть отказывается меняться — это от страха, а не упрямства. Поблагодарите её и остановитесь; отказ — это тоже важная информация.",
    },
  },
  'delay-not-deny': {
    en: {
      title: "Delay, don’t deny (15 minutes)",
      desc: "Firefighters calm the storm any way they can; a short delay teaches them the storm passes on its own.",
      steps: ["When the urge arrives, say: “Yes — in 15 minutes.”","Set a real timer and stay in the room.","Do one neutral physical task (dishes, walk, stretch) while it runs.","When it rings, choose freely: act on the urge or not — both are allowed; log the choice."],
      stopRule: "If it gets intense: the goal is delay; acting after the timer is perfectly allowed.",
    },
    ru: {
      title: "Отложите, а не откажите (15 минут)",
      desc: "Часть, которая хочет заглушить трудное чувство любым способом, учится на опыте, что буря проходит сама, если её ненадолго отложить.",
      steps: ["Когда приходит сильное желание что-то сделать, скажите себе: «Да — через 15 минут».","Поставьте настоящий таймер и оставайтесь на месте.","Пока идёт время, займитесь каким-нибудь простым делом — помойте посуду, пройдитесь, потянитесь.","Когда таймер прозвенит, выбирайте свободно — сделать это или нет, оба варианта нормальны. Запишите, что выбрали."],
      stopRule: "Если стало слишком тяжело: цель этой практики — просто отложить, а не запретить; сделать это после таймера — совершенно нормально.",
    },
  },
  'name-the-fire': {
    en: {
      title: "Name the fire it’s fighting",
      desc: "A firefighter is only “bad behavior” until you see what it’s extinguishing.",
      steps: ["After a flare you regret, skip the self-trial.","Ask instead: “What was on fire just before this?” — an emotion, a memory, a moment.","Write the fire’s name in one word.","Ask the firefighter: “What were you afraid would happen if you did nothing?”"],
      stopRule: "If it gets intense: if the fire feels old and big, stop — that material belongs with a therapist.",
    },
    ru: {
      title: "Найдите, что именно пыталось заглушить резкое поведение",
      desc: "Резкая реакция, о которой потом жалеешь, перестаёт казаться просто «плохим поведением», как только видно, от чего она пыталась вас спасти.",
      steps: ["После вспышки, о которой жалеете, не спешите себя судить.","Спросите вместо этого: «Что стало невыносимым прямо перед этим?» — какая эмоция, воспоминание, момент.","Запишите это одним словом.","Спросите себя: «Чего я боялся(лась), если бы ничего не сделал(а)?»"],
      stopRule: "Если стало слишком тяжело: если то, что вы нашли, ощущается старым и очень большим — остановитесь; с этим лучше идти к терапевту.",
    },
  },
  'moderator-seat': {
    en: {
      title: "Take the moderator’s seat",
      desc: "Two parts at war need a chair in the middle.",
      steps: ["Name the two parts locked in the cycle (e.g. pusher vs. dropper).","Sit in a third position — physically, if it helps — equidistant from both.","To each side in turn: “Say what you need in one sentence.”","Ask both: “What do you agree on about my life?” — find one shared concern.","Close by thanking both; no verdicts."],
      stopRule: "If it gets intense: polarization is exhausting — stop, and return to paced breath.",
    },
    ru: {
      title: "Место посредника",
      desc: "Двум частям, которые всё время спорят друг с другом, иногда нужен кто-то посередине, кто их выслушает.",
      steps: ["Назовите две части, которые застряли в постоянном споре (например, часть, которая контролирует, и часть, которая просто отключается).","Сядьте в третьей позиции — можно даже физически пересесть — на равном расстоянии от обеих.","Дайте каждой стороне по очереди сказать одним предложением, что ей нужно.","Спросите обе: «В чём вы всё-таки согласны, если говорить о моей жизни?» — найдите общую заботу.","Завершите, поблагодарив обе стороны, без вынесения приговора."],
      stopRule: "Если стало слишком тяжело: постоянный конфликт между частями выматывает — остановитесь и вернитесь к дыханию 4–6.",
    },
  },
  'fear-behind-both': {
    en: {
      title: "The fear behind both sides",
      desc: "Polarized parts disagree on tactics but usually share one terror — find it and the volume drops.",
      steps: ["Draw a simple T: part A left, part B right.","Under each, write its fear: “If I don’t…, then…”","Compare the two fears; circle any word they share.","Write one sentence to both parts that addresses the shared fear."],
      stopRule: "If it gets intense: set the page down — insight under duress does not stick anyway.",
    },
    ru: {
      title: "Общий страх за двумя разными реакциями",
      desc: "Части, которые спорят друг с другом, часто действуют по-разному, но боятся, по сути, одного и того же — найдите этот общий страх, и спор станет тише.",
      steps: ["Начертите простую таблицу из двух колонок: часть А слева, часть Б справа.","Под каждой запишите её страх: «Если я не сделаю X, то случится Y».","Сравните оба страха и обведите то общее слово, которое в них повторяется.","Напишите одно предложение, обращённое к этому общему страху, — для обеих частей сразу."],
      stopRule: "Если стало слишком тяжело: отложите страницу — понимание, добытое через силу, всё равно не задержится надолго.",
    },
  },
  'belief-as-weather': {
    en: {
      title: "Belief as weather report",
      desc: "A core belief can simply be reported, the way a meteorologist reports rain.",
      steps: ["Write the belief once, verbatim.","Rewrite it as a bulletin: “Today, heavy shame moving through the region of ‘I am too much.’”","Add the forecast: “Expected to pass; it always has.”","Read both versions aloud; note which one you can hold lightly."],
      stopRule: "If it gets intense: stop after step 2 and ground with the 5-4-3-2-1.",
    },
    ru: {
      title: "Убеждение как прогноз погоды",
      desc: "О тяжёлом убеждении о себе можно рассказать так же спокойно, как диктор сообщает о дожде.",
      steps: ["Запишите это убеждение один раз, слово в слово.","Перепишите его как сводку погоды: «Сегодня в районе „я слишком много“ сильный стыд».","Добавьте прогноз: «Пройдёт — как проходит всегда».","Прочитайте обе версии вслух и заметьте, какую легче держать в голове."],
      stopRule: "Если стало слишком тяжело: остановитесь после второго шага и сделайте заземление 5-4-3-2-1.",
    },
  },
  'thank-the-thought': {
    en: {
      title: "Thank the thought",
      desc: "Fighting a thought feeds it; thanking it starves it of the fight it expects.",
      steps: ["Notice one recurring self-critical thought.","Say: “Thank you, thought. I know you’re trying to protect me from something.”","Do not argue back — add nothing else.","Write what the thought wanted to prevent, in one line."],
      stopRule: "If it gets intense: if the thought spirals, stop and return to Soft Gaze.",
    },
    ru: {
      title: "Поблагодарите мысль",
      desc: "Спор с мыслью только подпитывает её; благодарность лишает её той борьбы, которую она ждёт.",
      steps: ["Заметьте одну повторяющуюся самокритичную мысль.","Скажите: «Спасибо тебе, мысль. Я знаю, что ты пытаешься меня от чего-то защитить».","Не спорьте с ней в ответ и ничего к ней не добавляйте.","Запишите одной строкой, от чего эта мысль пыталась вас уберечь."],
      stopRule: "Если стало слишком тяжело: если мысль начинает крутиться по кругу — остановитесь и вернитесь к практике Мягкий Взгляд.",
    },
  },
  'ask-three-people': {
    en: {
      title: "Ask three people",
      desc: "One opinion is noise; three is a sample — collect data the old story said was forbidden.",
      steps: ["Write the old story’s claim (e.g. “people find me boring”).","Ask three safe people one honest question this week.","Record their answers verbatim, without rebuttal.","Compare the data with the claim; write the smallest honest update."],
      stopRule: "If it gets intense: stop at one answer — one is already data.",
    },
    ru: {
      title: "Спросите троих",
      desc: "Одно мнение мало что доказывает, а вот три — это уже похоже на реальную картину. Соберите информацию, которую старое убеждение не давало вам увидеть.",
      steps: ["Запишите, во что именно вас убеждает старая история о себе (например: «людям со мной скучно»).","Задайте на этой неделе трём людям, которым доверяете, один честный вопрос.","Запишите их ответы слово в слово, не споря с ними.","Сравните эти ответы со старым убеждением и запишите самое небольшое честное уточнение."],
      stopRule: "Если стало слишком тяжело: остановитесь после одного ответа — даже один ответ уже что-то показывает.",
    },
  },
  'do-it-badly': {
    en: {
      title: "Do one thing badly, on purpose",
      desc: "Perfectionist protectors predict ruin from mediocrity — run the experiment they fear most.",
      steps: ["Choose one low-stakes task you usually do well.","Deliberately complete it at 60% quality — visibly imperfect.","Ship it, send it, or serve it as-is.","Log what actually happened, in facts only."],
      stopRule: "If it gets intense: shrink the stakes, never the structure — the imperfect completion is the rep.",
    },
    ru: {
      title: "Сделайте что-то нарочно неидеально",
      desc: "Часть, которая требует от вас безупречности, обычно предсказывает катастрофу от малейшей ошибки. Проверьте это предсказание на практике.",
      steps: ["Выберите одну не очень важную задачу, которую обычно делаете хорошо.","Намеренно выполните её процентов на 60 — так, чтобы несовершенство было заметно.","Отправьте, опубликуйте или сдайте это как есть.","Запишите, что произошло на самом деле, — только факты."],
      stopRule: "Если стало слишком тяжело: снижайте важность задачи, но не пропускайте сам эксперимент — именно неидеальный результат и есть смысл практики.",
    },
  },
  'warrior-rep-micro': {
    en: {
      title: "Warrior rep: the 60-second ask",
      desc: "Asking for small things is boundary gym with tiny weights — strength builds anyway.",
      steps: ["Pick one tiny need you would normally suppress (water, a break, quiet).","Ask for it in one plain sentence.","Receive it without repaying, apologizing, or minimizing.","Log the ask and what actually happened."],
    },
    ru: {
      title: "Тренировка просьбы за 60 секунд",
      desc: "Просить о чём-то маленьком — это как тренировка с лёгкими гантелями: вес небольшой, а сила всё равно растёт.",
      steps: ["Выберите одну небольшую потребность, которую обычно не озвучиваете, — воду, паузу, тишину.","Попросите об этом одним простым предложением.","Примите то, что вам дали, — без чувства долга, извинений и обесценивания.","Запишите, о чём попросили и что произошло на самом деле."],
    },
  },
  'caregiver-self-rep': {
    en: {
      title: "Caregiver rep: tend yourself first",
      desc: "The Caregiver resource aimed only outward drains; aimed inward first, it refills.",
      steps: ["Choose one basic need you have ignored today (food, rest, warmth).","Meet it yourself, deliberately, within the hour.","Say internally: “This is what tending sounds like when I am included.”","Note one place the body softened."],
    },
    ru: {
      title: "Тренировка заботы: сначала о себе",
      desc: "Ресурс Заботника, направленный только наружу, истощает; направленный сначала внутрь — наполняет.",
      steps: ["Выберите одну базовую нужду, проигнорированную сегодня (еда, отдых, тепло).","Удовлетворите её сами, намеренно, в течение часа.","Скажите внутри: «Вот как звучит забота, когда я в неё включён(а)».","Заметьте одно место, где тело смягчилось."],
    },
  },
  'soft-gaze-3-breaths': {
    en: {
      title: "Soft Gaze, three-breath version",
      desc: "The full ritual in pocket size — for moments between moments.",
      steps: ["Soften your gaze; let the eyes go slightly unfocused.","Name silently: “a part of me is feeling this.”","Three slow breaths, asking each time: “Would you step back a little?”","Notice the smallest increase of space; that is enough."],
    },
    ru: {
      title: "Мягкий Взгляд за три вдоха",
      desc: "Полный ритуал в карманном формате — для моментов между моментами.",
      steps: ["Смягчите взгляд; пусть глаза чуть расфокусируются.","Про себя назовите: «часть меня это чувствует».","Три медленных вдоха, каждый с просьбой: «Можешь чуть отойти?»","Заметьте малейшее расширение пространства; этого достаточно."],
    },
  },
  'soft-gaze-with-journal': {
    en: {
      title: "Soft Gaze with a journal coda",
      desc: "What the gaze opens, the pen keeps — one line locks the state in.",
      steps: ["Run the Soft Gaze ritual (notice → thank → ask to step back).","Before closing, open your journal.","Write one line from the spacious place — one that could only come from there.","Date it — this becomes your Self handwriting sample."],
    },
    ru: {
      title: "Мягкий Взгляд с записью в дневник",
      desc: "Что открывает взгляд, то сохраняет перо — одна строка закрепляет состояние.",
      steps: ["Проведите ритуал Мягкого Взгляда (заметить → поблагодарить → попросить отойти).","Перед завершением откройте журнал.","Напишите одну строку из просторного места — такую, какая возможна только оттуда.","Поставьте дату — это станет образцом вашего почерка от Self."],
    },
  },
  'repair-sentence': {
    en: {
      title: "One repair sentence",
      desc: "Ruptures heal with one clean sentence within 24 hours.",
      steps: ["Name one recent friction with a safe person.","Choose your half of it honestly (not a confession ritual).","Deliver one sentence: “When I ___, I think a protectiveness took over; I’d like to try again.”","Stop after one sentence — no essay, no campaign."],
      stopRule: "If it gets intense: repair is clean work; if it slides into self-flagellation, stop and breathe.",
    },
    ru: {
      title: "Одна фраза, чтобы всё исправить",
      desc: "Разрывам не нужен договор — им нужно одно чистое предложение в течение суток.",
      steps: ["Назовите одно недавнее трение с безопасным человеком.","Честно выберите свою половину (не ритуал исповеди).","Произнесите одно предложение: «Когда я ___, мной овладела защитность; я хочу попробовать заново».","Остановитесь после одного предложения — без эссе и кампаний."],
      stopRule: "Если становится остро: починка — дело чистое; если она скатывается в самобичевание — остановитесь и подышите.",
    },
  },
  'double-click-moment': {
    en: {
      title: "The double-click moment",
      desc: "Overreactions in closeness are usually two parts meeting — click once and look.",
      steps: ["Recall a moment a small remark landed absurdly hard.","Ask: “Which of my parts heard that — and what did it hear it as?”","Ask: “Which part of mine answered?”","Share the answer with the person, if safe: “A sensitive part of me took that personally.”"],
      stopRule: "If it gets intense: keep the inquiry inward today — sharing is optional, never mandatory.",
    },
    ru: {
      title: "Когда реакция сильнее, чем повод",
      desc: "Если мелочь вызвала бурную реакцию, за ней обычно встречаются две ваши части; присмотритесь один раз.",
      steps: ["Вспомните момент, когда малое замечание ударило непропорционально сильно.","Спросите: «Какая моя часть это услышала — и чем она это услышала?»","Спросите: «Какая моя часть ответила?»","Если безопасно, поделитесь: «Одна моя чувствительная часть приняла это на свой счёт»."],
      stopRule: "Если становится остро: сегодня оставьте разбор внутренним — делиться необязательно.",
    },
  },
  'safe-place-portal': {
    en: {
      title: "A doorway into the safe place",
      desc: "A fixed gesture becomes a portable door — the place travels with the body.",
      steps: ["Choose one physical gesture (thumb to finger, hand on sternum).","Enter your Special Safe Place while holding the gesture for 60 seconds.","Repeat three times today: gesture + 10 seconds of the place.","Use the gesture alone next time the world tilts — the doorway works in crowds."],
    },
    ru: {
      title: "Жест, который открывает безопасное место",
      desc: "Закреплённый жест становится портативной дверью — место путешествует вместе с телом.",
      steps: ["Выберите один физический жест (большой палец к пальцу, ладонь на грудину).","Войдите в Особое Безопасное Место, удерживая жест, 60 секунд.","Повторите трижды за день: жест + 10 секунд места.","В следующий раз, когда мир кренится, используйте жест один — дверь работает и в толпе."],
    },
  },
  'spoke-pairing': {
    en: {
      title: "Pair two spokes",
      desc: "Qualities grow in pairs — courage borrows legs from curiosity.",
      steps: ["Pick your dimmest radar spoke.","Pick the brightest one next to it.","Design one task this week that needs both: e.g. bold question (courage) about something you wonder about (curiosity).","Log the rep; re-rate the dim spoke after three tries."],
    },
    ru: {
      title: "Соедините два качества",
      desc: "Качества растут в парах — мужество берёт ноги у любопытства.",
      steps: ["Выберите самую тусклую спицу радара.","Выберите соседнюю самую яркую.","Придумайте одну задачу на неделю, требующую обеих: например, смелый вопрос (мужество) о том, о чём вы удивляетесь (любопытство).","Запишите повторение; переоцените тусклую спицу после трёх попыток."],
    },
  },
  'recording-label': {
    en: {
      title: "Label the recording",
      desc: "A triggered reaction keeps no timestamps — labeling one re-dates it.",
      steps: ["After a flare, write what the reaction felt like it was responding to.","Ask: “How old does this situation think it is?”","Write the real date at the top of the page — today’s.","Read the flare description under today’s date; note one thing that no longer fits."],
    },
    ru: {
      title: "Поставьте реакции дату",
      desc: "Сработавшая реакция не хранит временных меток; пометка одной из них переносит её в настоящее.",
      steps: ["После вспышки запишите, на что, как казалось, реагировала реакция.","Спросите: «Каким возрастом эта ситуация себя считает?»","Напишите настоящую дату вверху страницы — сегодняшнюю.","Прочитайте описание вспышки под сегодняшней датой; заметьте, что больше не сходится."],
    },
  },
  'witness-the-win': {
    en: {
      title: "Witness the win",
      desc: "Parts distrust progress that goes unrecorded — hold one small victory in the light.",
      steps: ["Pick one moment this week a part softened or you stayed steady.","Relive it for 30 seconds, letting it register as real.","Ask: “What did the part that relaxed need to know for that to happen?”","Write one line — and read it once more before bed."],
    },
    ru: {
      title: "Отметьте маленькую победу",
      desc: "Части не доверяют прогрессу, который никто не зафиксировал, — подержите одну малую победу на свету.",
      steps: ["Выберите момент недели, когда часть смягчилась или вы устояли.","Проживите его 30 секунд, позволяя ему регистрироваться как реальность.","Спросите: «Что нужно было знать расслабившейся части, чтобы это случилось?»","Напишите одну строку — и перечитайте её перед сном."],
    },
  },
  'context-first-grid': {
    en: {
      title: "Context-first grid",
      desc: "Before judging the self, inventory the conditions — blame cannot survive an accurate context list.",
      steps: ["Draw four boxes: body, day, people, task.","Fill each with one honest condition (slept 5h; deadline; tense call; noisy room).","Only now write the one-sentence self-judgment.","Re-read it next to the boxes; write what remains true."],
    },
    ru: {
      title: "Сначала посмотрите на обстоятельства",
      desc: "Прежде чем судить себя, инвентаризируйте условия — обвинение не выживает рядом с точным списком контекста.",
      steps: ["Начертите четыре поля: тело, день, люди, задача.","Заполните каждое одним честным условием (спал 5 часов; дедлайн; напряжённый звонок; шумная комната).","Только теперь запишите самообвинение одним предложением.","Перечитайте его рядом с полями; запишите, что остаётся правдой."],
    },
  },
  'one-year-letter': {
    en: {
      title: "Letter from the one-year-ahead self",
      desc: "The future self is already familiar: today’s parts, finally met. Let it write.",
      steps: ["Write a short letter from you, one year from now, who is living with these parts heard.","Have it describe one ordinary morning in that life, in sensory detail.","Have it end with one sentence to today’s you — advice, permission, or company.","Keep the letter; reread it monthly."],
    },
    ru: {
      title: "Письмо от себя через год",
      desc: "Будущее «я» уже знакомо: это сегодняшние части, которые наконец встретили друг друга. Пусть напишет.",
      steps: ["Напишите короткое письмо от себя через год, живущего с услышанными частями.","Пусть опишет одно обычное утро той жизни — в сенсорных деталях.","Пусть завершит одним предложением сегодняшнему вам — советом, разрешением или просто поддержкой.","Сохраните письмо; перечитывайте раз в месяц."],
    },
  },
  'expectation-vs-reality': {
    en: {
      title: "Expectation vs. reality log",
      desc: "Old stories survive because nobody checks the tape — check the tape.",
      steps: ["Before an interaction, write the old story’s prediction in one line.","After it, write what actually happened in one line.","Mark the delta: confirmed, mismatched, or partial.","After five entries, write the smallest update the data supports."],
      stopRule: "If it gets intense: coherence first — remind yourself why the old prediction once made sense, then stop.",
    },
    ru: {
      title: "Дневник «ожидание против реальности»",
      desc: "Старые истории живут, потому что никто не сверяет плёнку, — сверьте.",
      steps: ["Перед взаимодействием запишите прогноз старой истории одной строкой.","После — запишите одной строкой, что реально произошло.","Отметьте расхождение: подтверждено, несовпадение, частично.","После пяти записей выпишите самое малое обновление, которое поддерживают данные."],
      stopRule: "Если становится остро: сначала связность — напомните себе, почему старый прогноз когда-то имел смысл, и остановитесь.",
    },
  },
  'dial-not-switch': {
    en: {
      title: "The volume dial",
      desc: "A strength stuck at full volume can be turned from ten to eight.",
      steps: ["Name the strength running at full volume.","Find its dial in daily life: where exactly does it fire at 10/10?","Choose one recurring moment to run it at 8/10 instead.","Log the week; note what the spare 20% felt like wanting."],
      stopRule: "If it gets intense: keep the dial move tiny — 10 to 9 counts.",
    },
    ru: {
      title: "Регулятор громкости",
      desc: "Сильную сторону, которая всегда включена на полную мощность, можно немного убавить — с десяти до восьми.",
      steps: ["Назовите силу, работающую на полной громкости.","Найдите её регулятор в буднях: где именно она срабатывает на 10/10?","Выберите один повторяющийся момент, где включать её на 8/10.","Зафиксируйте неделю; заметьте, чего хотела освободившаяся пятая часть."],
      stopRule: "Если становится остро: оставьте ход регулятора крошечным — с 10 до 9 тоже считается.",
    },
  },
  'admiration-projection': {
    en: {
      title: "The admiration mirror",
      desc: "Projection hides strengths too — what you admire without envy may be your own unlived part.",
      steps: ["Name one person you admire without jealousy.","Write the three specific qualities you admire.","Ask: “Where in me is this quality — young, hidden, or unpracticed?”","Design one micro-rep of one quality this week."],
      stopRule: "If it gets intense: if the admiration carries ache or grief, stop — that depth belongs in therapy.",
    },
    ru: {
      title: "Зеркало восхищения",
      desc: "То, чем вы искренне восхищаетесь в других людях без всякой зависти, часто оказывается качеством, которое живёт и в вас — просто ещё не раскрылось.",
      steps: ["Назовите человека, которым восхищаетесь без ревности.","Выпишите три конкретных качества восхищения.","Спросите: «Где во мне это качество — юное, скрытое или непрактикуемое?»","Придумайте одну микропробу одного качества на эту неделю."],
      stopRule: "Если становится остро: если восхищение несёт боль или грусть — остановитесь; такой глубине место в терапии.",
    },
  },
  'witnessing-notes': {
    en: {
      title: "Witnessing notes between sessions",
      desc: "Therapist-assigned witnessing homework — presence without entering the wound alone.",
      steps: ["With your therapist’s framing, sit near (not inside) the young part for five scheduled minutes.","Offer only company: “I see you. You are not alone now.”","Write three neutral notes: what it showed, what it seemed to need, what you felt.","Bring the notes to session — the work continues there, never alone."],
      stopRule: "STOP RULE: between-sessions homework with your therapist only. If the young part’s material floods in, stop, ground, and contact your therapist.",
    },
    ru: {
      title: "Записи между сессиями с терапевтом",
      desc: "Домашнее задание по свидетельствованию от терапевта — присутствие без входа в рану в одиночку.",
      steps: ["В рамке вашего терапевта побудьте рядом (не внутри) с младшей частью пять назначенных минут.","Предложите только компанию: «Я вижу тебя. Ты теперь не одна».","Запишите три нейтральных заметки: что она показала, чего, казалось, ей нужно, что чувствовали вы.","Принесите заметки на сессию — работа продолжается там, никогда в одиночку."],
      stopRule: "ПРАВИЛО ОСТАНОВКИ: только домашнее задание между сессиями с вашим терапевтом. Если материал младшей части хлынул — остановитесь, заземлитесь и свяжитесь с терапевтом.",
    },
  },
};

// ── CONSTELLATION COPY ── constellation names, essays, subtypes (moved from src/app/core/data/constellation-copy.ts) ──

export interface ConstellationEssayEntry {
  short?: { en?: string; ru: string };
  long?: { en: string; ru: string };
}

export const CONSTELLATION_ESSAYS: Record<string, ConstellationEssayEntry> = {
  "analystxabandoned": {
    short: {
      ru: "Вы решаете задачу о близости с безопасного расстояния, где она не может ранить.",
    },
    long: {
      en: "You solve for connection at a distance where it cannot hurt. From inside, this feels like clarity: while others flounder in feeling, you have models, frameworks, explanations — a long equation that, if finally balanced, would yield love safely. The child underneath reached for someone and met absence or bewilderment, and a part of you concluded that raw reaching is a variable best eliminated. So the reaching became research: observe, hypothesize, analyze the people you long for instead of joining them. The signature loop: closeness begins, you shift into studying it, the study creates the distance it was meant to protect you from, and the resulting loneliness supplies more data about the difficulty of connection. The equation grows longer and never closes. The way out is one unsolved moment: with someone safe, say \"I miss you\" without the analysis — no why, no framework, no footnote. The intellect here is a brilliant translator who forgot the original language. You are allowed to simply speak love.",
      ru: "Вы решаете задачу о близости с безопасного расстояния, где она не может ранить. Изнутри это похоже на ясность: пока другие барахтаются в чувствах, у вас есть модели, рамки, объяснения — длинное уравнение, которое, будь оно наконец решено, выдало бы любовь без риска. Ребёнок внизу потянулся к кому-то — и встретил отсутствие или растерянность, и часть вас заключила, что тянуться — переменная, которую лучше исключить. Тяга превратилась в исследование: наблюдать, выдвигать гипотезы, анализировать людей, по которым вы тоскуете, — непременно со стороны. Фирменная петля: близость начинается, вы переходите в режим изучения, изучение создаёт ту дистанцию, от которой должно было защитить, — и итоговое одиночество поставляет новые данные о сложности связи. Уравнение растёт и не сходится. Выход — один нерешённый момент: скажите безопасному человеку «я скучаю» — без анализа, без почему, без сноски. Интеллект здесь — блестящий переводчик, забывший исходный язык. Любовь достаточно просто произнести.",
    },
  },
  "analystxashamed": {
    short: {
      ru: "Вы изучаете свои изъяны с клинической заботой — превращая их в данные.",
    },
    long: {
      en: "You study your flaws with clinical care, turning them into data. From inside, this feels like rigorous self-knowledge: you know your patterns better than anyone, can narrate your history in clean paragraphs, can predict your dysfunction to the decimal. The child underneath was handed a verdict of defectiveness, and a part of you discovered that a specimen on a slide hurts less than a self in the world — pinned, labeled, studied, the wound becomes a finding. The signature loop: shame stirs, the analysis engages, the feeling is converted into taxonomy, and the distance produces relief plus a strange new shame: that you are doing this instead of living. Insight accumulates; contact does not. The case file thickens; the person thins. The way out is one entry un-filed: the next time you catch yourself analyzing a pain, put the pen down and say only \"this hurts,\" with no distance, no label. Feelings metabolize through feeling; footnotes cannot do it for you. All those years, the research was protecting a living person: you.",
      ru: "Вы изучаете свои изъяны с клинической заботой — превращая их в данные. Изнутри это ощущается как строгое самопознание: вы знаете свои паттерны лучше всех, можете рассказать историю чистыми абзацами, предсказать свою дисфункцию до десятой. Ребёнку внизу вручили вердикт «дефектен» — и часть вас открыла: препарат на предметном стекле болит меньше, чем «я» в мире — закреплённый, снабжённый этикеткой, изученный, рана становится находкой. Фирменная петля: поднимается стыд, включается анализ, чувство конвертируется в таксономию, дистанция даёт облегчение — и странную новую вину: за то, что всё это происходит в обход самой жизни. Инсайты накапливаются; контакты — нет. Досье толстеет; человек худеет. Выход — один раз обойтись без записи: в следующий раз, поймав себя на анализе боли, отложите ручку и скажите только «это болит» — без дистанции, без ярлыка. Чувства усваиваются только чувствами; сноски здесь бессильны. Исследование все эти годы защищало живого человека — вас.",
    },
  },
  "analystxfrightened": {
    short: {
      en: "From behind glass you map the storm with perfect precision — dry, untouched, and alone.",
      ru: "Из-за стекла вы наблюдаете бурю с безупречной точностью — сухой, нетронутой и одинокой.",
    },
    long: {
      en: "From behind glass you map the storm with perfect precision — dry, untouched, and alone. From inside, this feels like safety with a view: the observatory is climate-controlled, the instruments are superb, and you can name the barometric pressure of any emotional system in the room. The child underneath lived through weather that destroyed things — rage, chaos, unpredictability — and a part of you built the glass, calculating that a meteorologist cannot be struck by lightning. It was right, for a while. The signature loop: intensity approaches, you ascend to the observation deck, the storm passes untouched, and the glass holds — but so does the distance, and the warmth of every gathering reaches you as information rather than experience. Perfectly dry, perfectly informed, perfectly alone. The way out is one fingerprint on the glass: step into a small, survivable storm — a minor conflict, a moment of expressed feeling — and stay in it without narrating. The forecast has always been accurate. But a human home is at ground level.",
      ru: "Из-за стекла вы наблюдаете бурю с безупречной точностью — сухой, нетронутой и одинокой. Изнутри это похоже на безопасность с видом: обсерватория с климат-контролем, приборы превосходны, и вы способны назвать барометрическое давление любой эмоциональной системы в комнате. Ребёнок внизу пережил погоду, разрушавшую вещи, — ярость, хаос, непредсказуемость, — и часть вас установила стекло, рассчитав: метеоролога молния не бьёт. И была права — какое-то время. Фирменная петля: приближается интенсивность, вы поднимаетесь на наблюдательную палубу, буря проходит нетронутой, стекло держит — но держит и дистанцию, и тепло каждого собрания доходит до вас в виде информации — как сводка, как данные. Идеально сухой, идеально осведомлённый, идеально одинокий. Выход — один отпечаток на стекле: шагните в небольшую, выносимую бурю — лёгкий конфликт, момент выраженного чувства — и останьтесь в ней, не рассказывая о ней. Прогноз у вас всегда был точен. Но дом человека — на земле.",
    },
  },
  "analystxunseen": {
    short: {
      ru: "Вы смотрите на жизнь через стекло, с отличным видом на собственное отсутствие.",
    },
    long: {
      en: "You watch life through glass with an excellent view of your own absence. From inside, this feels like perspective: you understand the group, the dynamics, the whole architecture of every room — from a vantage point that no one thinks to look up toward. The child underneath learned that presence went unrewarded or unnoticed, and a part of you turned invisibility into a discipline: the one who sees everything need not be seen. The observation deck became both hideout and identity. The signature loop: you analyze the scene, the analysis is accurate, the accuracy goes unspoken or unattributed, and your absence from the picture is confirmed as the natural order — the watcher is not in the frame. Loneliness arrives, gets promptly analyzed too. The way out is one entry into the frame: this week, offer one observation out loud, in the first person — \"I think…\", \"I loved…\" — and let it be yours, attributed, visible. The deck will keep. The view you actually wanted includes you in it.",
      ru: "Вы смотрите на жизнь через стекло, с отличным видом на собственное отсутствие. Изнутри это похоже на перспективу: вы понимаете группу, динамику, всю архитектуру каждой комнаты — с возвышения, куда никому не приходит в голову посмотреть. Ребёнок внизу узнал, что присутствие не вознаграждается и не замечается, — и часть вас превратила невидимость в дисциплину: тому, кто видит всё, не обязательно быть видимым. Палуба стала и укрытием, и идентичностью. Фирменная петля: вы анализируете сцену, анализ точен, точность остаётся неозвученной или без подписи — и ваше отсутствие в кадре подтверждается как естественный порядок: наблюдателя в кадре нет. Приходит одиночество — и тут же анализируется. Выход — один вход в кадр: на этой неделе дайте одно наблюдение вслух, от первого лица — «я думаю…», «мне понравилось…» — и пусть оно будет вашим, подписанным, видимым. Палуба подождёт. Нужный вам вид — тот, где в кадре есть и вы.",
    },
  },
  "bypasserxabandoned": {
    short: {
      ru: "Вы так быстро воспаряете над болью, что она не успевает ничего сказать.",
    },
    long: {
      en: "You rise above the ache so quickly it never gets to speak. From inside, this feels like resilience, even wisdom: where others drown, you float; you find the lesson, the growth, the higher meaning, usually within minutes. The child underneath discovered that the pain of loss had no witness — so a part of you built wings, and from altitude, even abandonment looks small, like a city from a plane. The signature loop: the ache stirs, the ascent begins, equanimity arrives on schedule, and the unspoken ache — patient, unpressured — waits below and settles in for good, becoming a low hum you eventually mistake for your personality. Altitude here is just distance. The way out is a controlled descent: once this week, when the rise starts, stay at ground level for five minutes — feet planted, hand on heart — and let the ache say its one sentence to you directly. You already know the lesson it would become. It wanted to be heard before it became a lesson.",
      ru: "Вы так быстро воспаряете над болью, что она не успевает ничего сказать. Изнутри это похоже на стойкость и даже мудрость: где другие тонут, вы парите; вы находите урок, рост, высший смысл — обычно за минуты. Ребёнок внизу обнаружил, что у боли утраты не было свидетеля — и часть вас вырастила крылья, а с высоты даже покинутость кажется малой, как город с борта самолёта. Фирменная петля: поднимается боль, начинается взлёт, невозмутимость прибывает по расписанию — а неуслышанная боль, терпеливая, неторопливая, ждёт внизу и остаётся навсегда, становясь низким гулом, который вы со временем принимаете за свою личность. Высота здесь — всего лишь дистанция. Выход — управляемый спуск: один раз на этой неделе, когда начнётся подъём, останьтесь на уровне земли на пять минут — стопы в пол, ладонь на сердце — и позвольте боли сказать вам своё единственное предложение напрямую. Урок вы уже знаете. Ему нужно было быть услышанным раньше, чем стать уроком.",
    },
  },
  "bypasserxashamed": {
    short: {
      ru: "Вы вставляете рану в витраж, пока она не станет похожа на урок.",
    },
    long: {
      en: "You frame the wound in stained glass until it looks like a lesson. From inside, this feels like alchemy: pain goes in, meaning comes out, and the rose window you build from broken pieces is genuinely beautiful. The child underneath was handed shame with no relief available — no apology came, no witness — and a part of you learned to survive by beautifying: if the wound is sacred, it cannot be disgraceful. The signature loop: shame stings, the framing begins — the gratitude list, the \"everything happens for a reason,\" the silver lining polished to a shine — and the sting is transfigured before it is felt. But encased shame stays exactly where it was, and the glass needs constant upkeep. The way out is one pane left plain: the next time the frame starts, pause and say the untransfigured version — \"this was just painful, and it hurt me\" — to yourself or someone safe. Spirituality that skips the wound is decoration. The light comes through either way; it prefers honest glass.",
      ru: "Вы вставляете рану в витраж, пока она не станет похожа на урок. Изнутри это похоже на алхимию: боль входит, смысл выходит, и роза, которую вы собираете из осколков, действительно прекрасна. Ребёнку внизу вручили стыд без всякой возможности облегчения — извинения не пришло, свидетеля не нашлось — и часть вас научилась выживать, осветляя: если рана священна, она не может быть позорной. Фирменная петля: стыд жалит, начинается оформление — список благодарностей, «всё не просто так», серебряная кромка, отполированная до блеска, — и укол преображается раньше, чем его почувствуют. Но неужаленный стыд никуда не девается — он заключён в витраж, и стекло требует постоянного ухода. Выход — одна рама, оставленная простой: в следующий раз, когда начнётся оформление, сделайте паузу и скажите непреображённую версию — «это было просто больно, и это ранило меня» — себе или безопасному человеку. Духовность, перепрыгивающая рану, — декорация. Свет проходит в любом случае; он предпочитает честное стекло.",
    },
  },
  "bypasserxfrightened": {
    short: {
      ru: "Вы парите над опасностью по мосту, построенному из осознаний.",
    },
    long: {
      en: "You hover over danger on a bridge made of insight. From inside, this feels like mastery: below you churn the fear — old, specific, bodily — and you cross above it on planks of understanding, each one an insight, a framework, a name for what happened to you. The child underneath faced something with no escape at ground level, and a part of you discovered that consciousness floats: understand the fear thoroughly enough and you are somehow above it. The signature loop: fear rises, the insight-bridge deploys, crossing feels like victory, but the bridge has a property no one mentions — it only spans, never lands; you cross and cross and remain suspended, gripping understanding, while the ground where life happens stays below, unreachable. The way out is one deliberate step onto solid ground: do one small thing this week that the fear forbids, without analyzing it first or after — unexamined, unrehearsed, just done. Insight is a bridge; living happens on the shore. The far side has been waiting.",
      ru: "Вы парите над опасностью по мосту, построенному из осознаний. Изнутри это похоже на мастерство: внизу клубится страх — старый, конкретный, телесный, — а вы пересекаете его по доскам понимания: каждая — инсайт, рамка, название того, что с вами случилось. Ребёнок внизу столкнулся с тем, из чего не было выхода на уровне земли, — и часть вас открыла: сознание плавает. Если понять страх достаточно полно, он почему-то остаётся внизу. Фирменная петля: страх поднимается, разворачивается мост из инсайтов, переход ощущается победой, — но у моста есть свойство, о котором не говорят: он лишь нависает и никогда не приводит к берегу. Вы переходите и переходите и остаётесь подвешенным, сжимая понимание, пока земля, где происходит жизнь, остаётся внизу, недосягаемой. Выход — один намеренный шаг на твёрдую землю: сделайте на этой неделе одно малое, запрещённое страхом дело — без анализа до или после. Осознание — мост; жить полагается на берегу. Тот берег всё это время ждал.",
    },
  },
  "bypasserxunseen": {
    short: {
      ru: "Вы поддерживаете вечное лето, чтобы никто не спросил о зиме под ним.",
    },
    long: {
      en: "You keep the weather golden so no one asks about the winter underneath. From inside, this feels like being a good presence in others’ lives: upbeat, philosophical, the one who lifts the room. And it works — people feel lighter around you. But the endless summer has a maintenance schedule: the winters must be hidden the moment they drift in, because once, a child learned that difficult feelings made people withdraw, that brightness was the price of company. So a part of you became the climate controller. The signature loop: someone asks \"how are you, really?\", the golden answer deploys on schedule, the moment passes, and the winter underneath grows one season longer, frost creeping toward the foundations no one inspects. The way out is one forecast correction, small and safe: tell one trusted person about one genuinely cold day you had this week — plainly, without converting it to a lesson. You were loved for your light, yes. You are lovable in your weather, all of it.",
      ru: "Вы поддерживаете вечное лето, чтобы никто не спросил о зиме под ним. Изнутри это похоже на умение быть приятным человеком в жизни других: позитивным, философским, тем, кто поднимает всем настроение. И это работает — рядом с вами людям легче. Но у бесконечного лета есть регламент обслуживания: зимы приходится прятать, едва они завиднеются, потому что однажды ребёнок узнал — с трудными чувствами люди отдаляются, и яркость была ценой компании. Часть вас стала регулятором климата. Фирменная петля: кто-то спрашивает «как ты на самом деле?», золотой ответ срабатывает по расписанию, момент проходит — а зима внизу удлиняется ещё на сезон, иней подползает к фундаменту, который никто не инспектирует. Выход — одна малая поправка прогноза, безопасная: расскажите одному доверенному человеку об одном по-настоящему холодном дне этой недели — просто, без превращения в урок. Вас любили за ваш свет — да. Вы любимы в любую вашу погоду.",
    },
  },
  "charmerxabandoned": {
    short: {
      ru: "Вы окружаете себя зеркалами, чтобы комната никогда не была пустой.",
    },
    long: {
      en: "You surround yourself with mirrors so the room is never empty. From inside, this feels like social abundance: every gathering has your laugh in it, every silence gets filled, every stranger leaves as a fan. The mirrors are other people — each one reflecting you back bright, engaged, delighted — and with enough of them positioned well, loneliness is architecturally impossible. Almost. Once, a child was left alone in a silence that echoed, and a part of you swore to furnish every room with reflection so the emptiness could never re-form. The signature loop: the room fills, the reflections multiply, the abandonment feels outrun — until the party ends, and the sudden absence of mirrors is worse than a quiet night would have been, confirming the part’s premise: without audience, void. The way out is one evening unmirrored, on purpose: solo, screenless, doing something you genuinely like, staying through the silence until it becomes just quiet. The part filled the room to protect you. The one it protected can be there without applause.",
      ru: "Вы окружаете себя зеркалами, чтобы комната никогда не была пустой. Изнутри это похоже на социальный избыток: на каждом собрании звучит ваш смех, каждая пауза заполняется, каждый незнакомец уходит вашим поклонником. Зеркала — это люди: каждое отражает вас ярким, вовлечённым, восхищённым — и при достаточном их числе, расставленном грамотно, одиночество архитектурно невозможно. Почти. Когда-то ребёнок остался один в отражающей тишине — и часть вас поклялась меблировать каждую комнату отражениями, чтобы пустота больше не могла собраться. Фирменная петля: комната наполняется, отражения множатся, покинутость кажется обогнанной — до конца вечеринки, где внезапное исчезновение зеркал больнее тихого вечера, подтверждая посыл части: без аудитории — пустота. И следующая встреча назначается до закрытия текущей. Выход — один вечер без зеркал, намеренно: в одиночестве, без экрана, за занятием, которое вам искренне нравится, оставаясь в тишине, пока она не станет просто тишиной. Часть наполняла комнату, защищая вас. Тот, кого защищали, умеет быть без аплодисментов.",
    },
  },
  "charmerxashamed": {
    short: {
      ru: "Представление настолько яркое, что никто не проверяет, что за ним.",
    },
    long: {
      en: "The performance is so bright that no one checks what is behind it. From inside, this feels like being good with people — witty, warm, impossible not to like — and it is a real gift, honestly held. But notice the lighting design: the spotlight is positioned, always, directly on the mask, because somewhere backstage is a child who was told, in effect, that the unperfomed self would not be tolerated. Charm became the costume the shame wears to the party. The signature loop: intimacy nears, the performance scales up — funnier, warmer, more on — the person laughs with the character, and the connection lands on the mask and stays there, which the part counts as safety while the one behind it starves in the glow. Being adored is not yet being known. The way out is one scene played straight: with someone proven gentle, drop the bit for ten minutes — speak slowly, plainly, about something real — and stay in the room while being unremarkable. The mask was stagecraft for a child in danger. The danger has left the theater.",
      ru: "Представление настолько яркое, что никто не проверяет, что за ним. Изнутри это похоже на умение быть с людьми — остроумный, тёплый, его невозможно не полюбить — и это настоящий дар, без обмана. Но обратите внимание на свет: прожектор всегда стоит прямо на маске, потому что где-то за кулисами ребёнок, которому дали понять, что неприкрашенное «я» терпеть не станут. Обаяние стало костюмом, который стыд надевает на вечеринку. Фирменная петля: близость приближается, представление масштабируется — смешнее, теплее, сильнее, — человек смеётся вместе с персонажем, связь ложится на маску и остаётся там, что часть засчитывает как безопасность, пока тот, кто за маской, голодает в сиянии. Обожание — ещё не узнанность. Выход — одна сцена, сыгранная вживую: с человеком, проверенно мягким, отставьте номер на десять минут — говорите медленно, просто, о настоящем — и останьтесь в комнате, будучи непримечательным. Маска была сценическим приёмом ребёнка в опасности. Опасность покинула театр.",
    },
  },
  "charmerxfrightened": {
    short: {
      ru: "Вы уходите со сцены под залп конфетти.",
    },
    long: {
      en: "You exit through a burst of confetti. From inside, this feels like style: when things get tense, you produce the perfect joke, the dazzling pivot, the sudden plans elsewhere — and the moment that threatened to close in is gone in glitter. Once, a child faced danger with no exit through the front — the room, the adult, the anger — and discovered the trapdoor of charisma: be delightful enough, and the danger gets confused; be elsewhere-fast enough, and it misses you. A part of you has been running that exit ever since. The signature loop: discomfort rises, the confetti cannon fires — flirtation, performance, a dramatic departure — the tension breaks, relief floods, and the uncomfortable thing remains unmet, waiting for the next gathering with interest accrued. Every room eventually becomes a stage to escape from. The way out is one exit declined: the next time the cannon loads, stay seated — feel the tension, let the joke go unsaid, see what the moment does when you remain in it. Dazzle was an escape route. You can walk out the front door now.",
      ru: "Вы уходите со сцены под залп конфетти. Изнутри это похоже на стиль: когда обстановка накаляется, вы выдаёте идеальную шутку, ослепительный разворот, внезапные планы в другом месте — и миг, начавший смыкаться, исчезает в блёстках. Когда-то ребёнок столкнулся с опасностью, не имевшей парадного выхода, — комната, взрослый, гнев, — и открыл люк харизмы: будь достаточно очарователен — и опасность растеряется; успей оказаться в другом месте — и она промахнётся. Часть вас запускала этот выход с тех пор. Фирменная петля: поднимается дискомфорт, срабатывает конфетти-пушка — флирт, представление, эффектный уход, — напряжение разряжается, приходит облегчение — а непрожитое остаётся и ждёт следующей встречи, накопив проценты. Каждая комната со временем становится сценой для побега. Выход — один отменённый выход: в следующий раз, когда пушка заряжается, останьтесь на месте — почувствуйте напряжение, оставьте шутку несказанной, посмотрите, что сделает момент, когда вы в нём останетесь. Блеск был запасным выходом. Теперь можно через парадную дверь.",
    },
  },
  "charmerxunseen": {
    short: {
      ru: "Вы собираете аплодисменты, как чеки за «я», с которым никто по-настоящему не встретился.",
    },
    long: {
      en: "You collect applause like receipts for a self no one actually meets. From inside, this feels like success at the human business: rooms light up when you enter, laughter arrives on cue, the archive of warm reactions is extensive. But examine the receipts: what exactly was applauded? The performance — the charm, the stories, the shine. And what was it payment for? A child once concluded that the self, unadorned, was not worth staying for — that only the show would be attended to — and a part of you has been staging it ever since, filing each ovation as evidence in a case that never closes. The signature loop: the applause lands, the receipt is archived, the warmth lasts exactly as long as the show, and the one behind the curtain goes home unmet again, holding proof of being loved that never quite feels like being known. The way out is one uncounted moment: this week, do something real with someone while being plainly, unperformedly yourself — and notice any warmth that arrives without the show. That warmth lives outside the bookkeeping — it answers to no audit.",
      ru: "Вы собираете аплодисменты, как чеки за «я», с которым никто по-настоящему не встретился. Изнутри это похоже на большой успех у людей: комнаты загораются при вашем появлении, смех приходит по расписанию, архив тёплых реакций по-настоящему обширен. Но рассмотрите чеки: что именно аплодировали? Представление — обаяние, истории, блеск. И чем была оплачена такая теплота? Когда-то ребёнок заключил, что «я» без украшений оставаться рядом не стоит — что покажут только шоу, — и часть с тех пор ставит его, подшивая каждую овацию как доказательство по делу, которое никогда не закрывается. Фирменная петля: аплодисменты приземляются, чек подшивается, теплота длится ровно столько, сколько шоу, — и тот, кто за занавесом, возвращается домой не встреченным, держа подтверждения любви, которые никогда не ощущаются как узнанность. Выход — один незасчитанный момент: на этой неделе сделайте что-то настоящее с кем-то, просто оставаясь собой, без представления, — и заметьте любую теплоту, пришедшую без шоу. Такая теплота живёт вне бухгалтерии — и отчётов не требует.",
    },
  },
  "controllerxabandoned": {
    short: {
      ru: "Если ничего не меняется и никто не входит — никто и не уйдёт.",
    },
    long: {
      en: "If nothing changes and no one enters, no one can leave. From inside, this feels like peace, almost — the settled quiet of a life with the variables removed. The child underneath experienced a departure that came through a door someone else opened: a parent’s mood, a move, a betrayal arriving unannounced. And a part of you became a locksmith, bolting every door that change might come through. The signature loop: novelty approaches — a person, an opportunity, a trip — the locks engage, the novelty withdraws, and the withdrawal is logged as proof that openness ends in loss, so the bolts go deeper. The house grows quieter and safer and emptier, and the emptiness is rebranded as calm. The way out is one door unbolted slightly: accept one small change this week — a new route, a new café, a guest for tea — and track what actually happens. The part is right that loss exists. It overestimates sealed doors: loss passes through walls — and so does life.",
      ru: "Если ничего не меняется и никто не входит — никто и не уйдёт. Изнутри это похоже почти на покой: устоявшуюся тишину жизни, из которой убраны переменные. Ребёнок внизу пережил уход, пришедший через дверь, которую открыл кто-то другой: настроение родителя, переезд, предательство без предупреждения. И часть вас стала слесарем, запирающим каждую дверь, через которую могли войти перемены. Фирменная петля: приближается новизна — человек, шанс, поездка, — замки срабатывают, новизна отступает, и отступление заносится как доказательство, что открытость кончается потерей, — и болты идут глубже. Дом становится тише, безопаснее и пустее, а пустота переименовывается в спокойствие. Выход — одна дверь, слегка отпертая: принять одно малое изменение на этой неделе — новый маршрут, новое кафе, гостя на чай — и отследить, что произойдёт на самом деле. Часть права: потеря существует. Но запертые двери её не останавливают. Потеря проходит сквозь стены; сквозь них же проходит жизнь.",
    },
  },
  "controllerxashamed": {
    short: {
      ru: "Вы наводите в жизни безупречную чистоту — ровно такую, чтобы её наконец можно было показать.",
    },
    long: {
      en: "You inspect your life until it is spotless enough to be seen. From inside, this feels like standards, even pride — the white-glove test passed daily, the shelves of self arranged for an audience that is always imminent and never satisfied. The child underneath learned that being seen meant being judged, and that judgment could maybe, possibly, be survived if everything was perfect first. So a part of you became the inspector, running a gloved finger along every surface of your choices, your home, your words. The signature loop: inspection finds dust, the dust confirms the shame, the shame demands deeper cleaning, and the standard climbs another rung beyond any human reach. Meanwhile the guests the cleaning was for have long stopped being invited — the house must be perfect first, and it never is. The way out is one fingerprint left deliberately: let something imperfect be seen by one safe person this week — the unfinished project, the messy kitchen. You were the guest all along, waiting outside your own door.",
      ru: "Вы наводите в жизни безупречную чистоту — ровно такую, чтобы её наконец можно было показать. Изнутри это похоже на стандарты и даже гордость: тест в белой перчатке сдан, полки себя выстроены для аудитории, которая всегда вот-вот придёт и никогда не удовлетворена. Ребёнок внизу узнал, что быть видимым значило быть судимым — и что суд, может быть, можно пережить, если сначала всё сделать идеальным. Часть вас стала инспектором, проводя пальцем в белой перчатке по каждой поверхности ваших выборов, дома, слов. Фирменная петля: инспекция находит пыль, пыль подтверждает стыд, стыд требует более глубокой уборки — и планка поднимается ещё на ступень за пределы человеческой досягаемости. Гости же, ради которых всё это, давно не приглашаются: сначала дом должен стать безупречным, а он не становится. Выход — один отпечаток пальца, оставленный намеренно: пусть один безопасный человек увидит что-то несовершенное на этой неделе — недоделанный проект, беспорядок на кухне. Гостем всё это время были вы — ждущий за собственной дверью.",
    },
  },
  "controllerxfrightened": {
    short: {
      ru: "Вы держите каждую мелочь под контролем, потому что море однажды вас поглотило.",
    },
    long: {
      en: "You steer every detail because the sea once swallowed you. From inside, this feels like competence under pressure: routes planned, contingencies noted, every passenger manifest checked twice. The gift is real — you are genuinely good at the helm. But the story underneath is older: a voyage long ago when nobody steered, when events simply happened to you, and the water closed over. A part of you vowed that as long as it held the wheel, nothing would ever swamp the boat again. The signature loop: control works, tension eases, then any unplanned wave — a delay, a detour, another person’s free will — reads as the sea rising, and the grip tightens past comfort into white knuckles. The effort of constant steering costs more than most storms. The way out is one delegated rope: hand a small navigational decision to someone else — the route, the restaurant, the playlist — and feel the wheel turn under your hands without you. The sea that swallowed you was real. It is not this one, and you know how to swim now.",
      ru: "Вы держите каждую мелочь под контролем, потому что море однажды вас поглотило. Изнутри это похоже на компетентность под давлением: маршруты просчитаны, непредвиденные сценарии отмечены, список пассажиров перепроверен дважды. Дар настоящий — вам действительно крепко даётся штурвал. Но дело тут в другом — в том давнем рейсе, когда никто не рулил, когда события просто случались с вами — и вода сомкнулась. Часть вас поклялась: пока она у колеса, лодку никогда больше не захлестнёт. Фирменная петля: контроль работает, напряжение спадает — и любая незапланированная волна: задержка, объезд, чья-то свободная воля, — читается как поднимающееся море, и хватка затягивается всё крепче, до белеющих костяшек. Усилие постоянного руления стоит дороже большинства штормов. Выход — одна доверенная верёвка: отдать кому-то малое навигационное решение — маршрут, ресторан, плейлист — и почувствовать, как колесо вращается под вашими ладонями без вас. Море, поглотившее вас, было настоящим. То время ушло; сейчас море другое — и плавать вы теперь умеете.",
    },
  },
  "controllerxunseen": {
    short: {
      ru: "Вы педантично упорядочиваете мир, а себя заносите в раздел «прочее».",
    },
    long: {
      en: "You organize the world meticulously and file yourself under miscellaneous. From inside, this feels like a gift in use: systems, labels, order — a mind that makes the chaos legible. And it is a gift. But look at the filing cabinet of your attention: every project, every person, every obligation has a colored folder, and somewhere in the back is a thin manila one marked \"misc.\" where your own life goes. The child underneath learned that being noticed was for objects, achievements, arrangements — not for the self doing the arranging — and a part of you kept the world sorted so expertly that no one ever needed to look at the organizer. The signature loop: you systematize, others benefit, appreciation accrues to the system, and the self behind it recedes one folder deeper. The way out is re-categorization: take one fact about yourself — a want, a ache, a curiosity — and file it in the front, in the active projects, and act on it once this week. You are the author of your own life — you always were.",
      ru: "Вы педантично упорядочиваете мир, а себя заносите в раздел «прочее». Изнутри это выглядит как дар в действии: системы, ярлыки, порядок — ум, делающий хаос читаемым. И это дар. Но взгляните на картотеку внимания: у каждого проекта, человека, обязательства есть цветная папка, а где-то сзади тонкая серая папка «прочее», куда идёт ваша собственная жизнь. Ребёнок внизу узнал, что внимание достаётся предметам, достижениям, договорённостям — но не тому, кто их устраивает, — и часть вас держала мир столь безупречно отсортированным, что никому и не нужно было смотреть на сортировщика. Фирменная петля: вы систематизируете, другие получают пользу, благодарность достаётся системе — а «я» за ней отступает на папку глубже. Выход — перекатегоризация: возьмите один факт о себе — желание, боль, любопытство — и поместите в активные проекты, и один раз на этой неделе действуйте в соответствии с ним. Вы всегда были автором собственной жизни.",
    },
  },
  "hermitxabandoned": {
    short: {
      ru: "Вы оставляете одну лампу для гостя, который никак не приходит, — для себя самого.",
    },
    long: {
      en: "You leave one lamp on for a visitor who never quite arrives — you. From inside, this feels like self-sufficiency with a faint, steady ache: the house is quiet, the evening is yours, and yet one lamp always burns by the window, its light spilling onto a road nobody travels. The child underneath waited for someone who did not come back, or came back insufficiently, and a part of you built a life where waiting is no longer humiliation — only habit. The signature loop: solitude soothes, then isolates; the isolation aches; the ache says reach out; and reaching out once risked so much disappointment that the part prefers the lamp to the door. So the lamp stays lit for decades. The way out is to change who the light is for: one evening this week, sit in the lamp’s circle yourself — good food, warm blanket, no screen — as the guest you kept waiting for. The hermit is right that you can be good company for yourself; it just forgot to deliver the invitation.",
      ru: "Вы оставляете одну лампу для гостя, который никак не приходит, — для себя самого. Изнутри это похоже на самодостаточность с тихой ровной болью: дом тих, вечер ваш — и всё же одна лампа всегда горит у окна, свет ложится на дорогу, по которой никто не идёт. Ребёнок внизу ждал того, кто не вернулся или вернулся недостаточно, — и часть вас выстроила жизнь, где ожидание больше не унизительно, а лишь привычно. Фирменная петля: уединение успокаивает — потом изолирует; изоляция болит; боль говорит: потянись; но однажды потянуться было так рискованно, что часть предпочитает лампу двери. И лампа горит десятилетиями. Выход — поменять адресата света: один вечер на этой неделе сядьте в круг лампы сами — хорошая еда, тёплый плед, без экрана — как тот самый гость, ради которого лампа и горела. Отшельник не неправ, что вы можете быть себе хорошей компанией. Он лишь забыл вручить приглашение.",
    },
  },
  "hermitxashamed": {
    short: {
      ru: "Вы закрываете ставни прежде, чем кто-то успеет заглянуть.",
    },
    long: {
      en: "You close the shutters before anyone can look in. From inside, this feels like modesty, or taste, or simply a preference for quiet — and there is real preference in the mix. But look closer at the timing: the shutters do not close when you are tired; they close when being seen approaches. The child underneath was looked at in ways that burned — evaluated, mocked, misused — and a part of you learned that windows are liabilities. Better the dim interior than the exposing light. The signature loop: closeness nears, the shutters swing, the person outside reads the closedness as disinterest and drifts away, and the departure is filed as proof that exposure would have ended worse. The house grows safe and dark. The way out is one shutter cracked, briefly: share one small true thing — a photo, an opinion, a bad day’s account — with someone proven gentle, then close the shutter again if needed. Seen does not have to mean scorched. Some light is just morning.",
      ru: "Вы закрываете ставни прежде, чем кто-то успеет заглянуть. Изнутри это похоже на скромность, вкус или просто тягу к тишине — и настоящая тяга там тоже есть. Но присмотритесь к таймингу: ставни закрываются, когда приближается возможность быть увиденным; усталость тут ни при чём. Ребёнка внизу смотрели так, что обжигало, — оценивали, высмеивали, использовали, — и часть вас уяснила: окна только добавляют уязвимости. Лучше полумрак внутри, чем обнажающий свет. Фирменная петля: близость приближается, ставни захлопываются, человек снаружи читает закрытость как незаинтересованность и отходит — и уход заносится как доказательство, что раскрытие кончилось бы хуже. Дом становится безопасным и тёмным. Выход — одна ставня, приоткрытая ненадолго: поделитесь одной маленькой правдой — фото, мнением, рассказом о плохом дне — с человеком, в чьей мягкости вы уже уверены, — потом закрывайте снова, если нужно. Раскрытие бывает бережным. Иногда свет — это просто утро.",
    },
  },
  "hermitxfrightened": {
    short: {
      ru: "За высокой стеной всё тихо, и ничто не может вас достать.",
    },
    long: {
      en: "Behind high walls, everything is quiet and nothing can reach you. From inside, this feels like hard-won peace: after years of unpredictable weather — anger, chaos, demands that arrived like sieges — you built the walls yourself, stone by stone, and the garden within them genuinely blooms. The child underneath needed these walls; without them there might not be a you reading this. The signature loop: the world knocks — invitation, news, a voice at the gate — the walls do their work, the knocking stops, and the silence that follows is both relief and slow starvation. Muffled becomes indistinguishable from empty. The way out is a gate in the wall: one scheduled opening, low-risk, time-boxed — a walk among strangers, a brief call, a letter sent — after which you may close it freely. Walls with a gate make a home; sealed walls make a keep you guard for a prisoner. The gardener inside grew all this beauty. Some of it was always meant to be given away.",
      ru: "За высокой стеной всё тихо, и ничто не может вас достать. Изнутри это похоже на заслуженный мир: после лет непредсказуемой погоды — гнева, хаоса, осадных требований — вы сами построили эти стены, камень за камнем, и сад внутри них действительно цветёт. Ребёнку внизу эти стены были нужны; без них, возможно, не было бы вас, читающего это. Фирменная петля: мир стучит — приглашение, новость, голос у ворот — стены работают, стук прекращается, и наступающая тишина — одновременно облегчение и медленное голодание. «Приглушённое» становится неотличимо от «пустого». Выход — калитка в стене: одно запланированное открытие, низкорисковое, ограниченное по времени — прогулка среди незнакомцев, короткий звонок, отправленное письмо, — после которого калитку можно спокойно закрыть. У стен с калиткой есть имя — дом. Глухие стены превращают дом в донжон, который сторожат для узника. Садовник внутри вырастил всю эту красоту. Часть её всегда была предназначена для раздачи.",
    },
  },
  "hermitxunseen": {
    short: {
      ru: "В вашей богатой внутренней библиотеке нет лампы для гостей.",
    },
    long: {
      en: "Your rich inner library has no reading lamp for guests. From inside, this feels like depth: shelves and shelves of thought, feeling, memory, curiously organized — a mind visitors would marvel at if they ever entered. The child underneath learned that what was shown was not received — interests met with blankness, feelings with changing subjects — so a part of you moved the entire collection indoors and locked the study. The signature loop: someone approaches, you offer the spines of small talk, they browse and leave, and the conclusion is confirmed: nobody wants the collection. But nobody was shown it. The way out is one book left open on the table: share a single specific enthusiasm or tender thought with someone this week — not the whole library, one volume — and watch what happens when it is actually read. Unseen is not yet unseeable. The part that locked the study mistook your audience for the one from decades ago. New readers exist. They just need the lamp on.",
      ru: "В вашей богатой внутренней библиотеке нет лампы для гостей. Изнутри это похоже на глубину: полки и полки мысли, чувства, памяти, любопытно каталогизированные — ум, которым гости восхитились бы, если бы когда-нибудь вошли. Ребёнок внизу узнал, что показанное не принимали: интерес встречали пустотой, чувства — сменой темы, — и часть вас перевезла всю коллекцию внутрь и заперла кабинет. Фирменная петля: кто-то приближается, вы предлагаете корешки светской болтовни, человек полистывает и уходит — и вывод подтверждается: коллекция никому не нужна. Но её никому и не показывали. Выход — одна книга, оставленная раскрытой на столе: поделитесь одной конкретной страстью или трепетной мыслью с кем-то на этой неделе — одним томом, без всей библиотеки сразу — и посмотрите, что будет, когда его действительно прочтут. «Незамеченный» — ещё не «незамечаемый». Часть, запершая кабинет, приняла сегодняшнюю аудиторию за ту, давнишнюю. Новые читатели существуют. Им просто нужна лампа.",
    },
  },
  "inner_criticxabandoned": {
    short: {
      ru: "Вы выносите себе приговор первым, прежде чем кто-то успеет уйти.",
    },
    long: {
      en: "You sentence yourself first, before anyone can leave. From inside, this feels like a permanent defense strategy running in a courtroom of one: the critic scans your words, your face, your silences, and convicts you of the crime it fears others are already assembling. The logic is ancient — if I punish me first, their leaving will at least be justified, expected, survivable. A child once connected departure with personal fault, and a part of you swore never to be blindsided again. The signature loop: closeness increases, the critic intensifies, the self-attack becomes its own reason to withdraw, and the leaving you predicted arrives — self-inflicted, then blamed on fate. The way out is catching one verdict mid-sentence and asking the critic a single question: \"What are you afraid would happen if you stayed quiet?\" It answers, always, in the vocabulary of that old leaving. Thank it. Then do the thing uncondemned.",
      ru: "Вы выносите себе приговор первым, прежде чем кто-то успеет уйти. Изнутри это ощущается как постоянная линия защиты в суде на одного: критик сканирует ваши слова, лицо, паузы и осуждает за преступление, которого, как он боится, другие уже готовят. Логика древняя: если накажу себя первым, их уход хотя бы будет обоснован, ожидаем, переживаем. Ребёнок однажды связал уход с собственной виной — и часть вас поклялась больше не быть застигнутой врасплох. Фирменная петля: близость растёт, критик усиливается, самоатака становится собственной причиной отстраниться — и предсказанный вами уход наступает — ваших же рук дело, которое часть списывает на судьбу. Выход — поймать один вердикт на середине фразы и задать критику один вопрос: «Чего ты боишься, если промолчишь?» Он отвечает всегда — на языке того давнего ухода. Поблагодарите. Потом сделайте это — без приговора.",
    },
  },
  "inner_criticxashamed": {
    short: {
      ru: "Вы ведёте допрос самому себе каждый день, чтобы вердикт никогда не оказался сюрпризом.",
    },
    long: {
      en: "You cross-examine yourself daily so the verdict never surprises you. From inside, this feels like thoroughness, even integrity — surely honest people audit themselves? But the courtroom has one peculiarity: the defense attorney never shows up. The child underneath absorbed a verdict of defectiveness before they had language to contest it, and a part of you took over the prosecution to keep the proceedings internal, where at least you control the schedule. The signature loop: shame rises, the critic preempts it with detailed self-indictment, the preemption hurts as much as the original shame, and the whole cycle is mistaken for humility or self-awareness. It is neither. Both readings miss it: this is a wound doing the wounding. The way out is one cross-examination declined: the next time you hear the opening statement — \"you always…\" — place a hand on your chest and say, \"I notice a part prosecuting.\" For now, a mistrial is enough. The verdict was written before the evidence existed.",
      ru: "Вы ведёте допрос самому себе каждый день, чтобы вердикт никогда не оказался сюрпризом. Изнутри это похоже на основательность, даже честность: разве порядочный человек не ревизует себя? Но у этого суда есть особенность: адвокат никогда не приходит. Ребёнок внизу впитал вердикт «дефектен» раньше, чем обрёл язык, чтобы его оспорить, — и часть вас забрала прокуратуру себе, чтобы процесс шёл внутри, где хотя бы вы назначаете заседания. Фирменная петля: поднимается стыд, критик упреждает его детальным самообвинением, и упреждающий удар ранит не меньше самого стыда — и весь цикл принимают за смирение или самосознание. Это ни то ни другое — на деле это рана, которая сама наносит раны. Выход — один допрос отклонить: в следующий раз, услышав вступительную речь («ты всегда…»), положите ладонь на грудь и скажите: «Я замечаю часть, которая обвиняет». Для начала достаточно переноса процесса. Вердикт написали до того, как появились доказательства.",
    },
  },
  "inner_criticxfrightened": {
    short: {
      ru: "Каждая ошибка пересматривается в три часа ночи судьёй, который не объявляет перерыва.",
    },
    long: {
      en: "Every mistake is retried at 3 a.m. under an inner judge that never adjourns. From inside, this feels like vigilance wearing a legal robe: the critic believes that if it reviews every error exhaustively enough, future ones can be prevented, and with them the catastrophes mistakes once brought. Somewhere in your history, a small error had enormous consequences — ridicule, rage, a door slamming — and a part of you built a night court to make sure nothing like that ever slips through again. The signature loop: a mistake occurs, the day’s court adjourns, and the nocturnal session opens the moment your head touches the pillow, replaying testimony you already know by heart. You wake tired and more afraid of erring, which makes errors likelier, which feeds the docket. The way out is procedural: when the night session opens, name it — \"the court is in session\" — get up, drink water, write the verdict down and close the notebook. Courts need recess to function. So do you.",
      ru: "Каждая ошибка пересматривается в три часа ночи судьёй, который не объявляет перерыва. Изнутри это похоже на бдительность в мантии: критик верит, что если разобрать каждый промах достаточно дотошно, будущих можно предотвратить — а с ними и катастрофы, которые когда-то приносили промахи. Где-то в вашей истории маленькая ошибка имела огромные последствия — насмешку, ярость, хлопнувшую дверь — и часть вас построила ночной суд, чтобы ничто такое больше не проскользнуло. Фирменная петля: ошибка случается, дневной суд закрывается, и ночное заседание открывается в ту минуту, когда голова касается подушки, воспроизводя показания, которые вы и так знаете наизусть. Вы просыпаетесь уставшим и ещё сильнее боитесь ошибиться — что увеличивает шансы ошибки и пополняет список дел ночного суда. Выход процедурный: когда открывается ночное заседание, назовите его — «суд собрался», — встаньте, выпейте воды, запишите вердикт и закройте тетрадь. Судам нужен перерыв. Вам тоже.",
    },
  },
  "inner_criticxunseen": {
    short: {
      ru: "Вы расписываете себя в примечания, чтобы другим не пришлось.",
    },
    long: {
      en: "You annotate yourself into footnotes so no one else has to. From inside, this feels like helpful self-deprecation: if I point out my own flaws first, wittily, before anyone else can, then no one can hurt me with them. The child underneath learned that visibility was dangerous — noticed meant criticized, standing out meant standing alone — and a part of you chose the margins as the safest page to live on. The signature loop: you pre-shrink, the room takes you at your own valuation, the smallness aches, and the ache is filed as more evidence for further shrinking. Each self-deprecating joke is a pebble taken from your own wall. The way out is one sentence un-annotated: the next achievement, opinion, or presence you offer without the footnote, without \"it’s nothing,\" without the preemptive discount. Let it stand in the main text, typographically large. The parts that hid you were protecting you from eyes that no longer read that way.",
      ru: "Вы расписываете себя в примечания, чтобы другим не пришлось. Изнутри это похоже на полезную самоиронию: если я первым(ой) укажу на свои изъяны, остроумно, до других, — никто не сможет ранить меня ими. Ребёнок внизу узнал, что быть видимым опасно: замечали — значит, ждала критика; выделялся — значит, оставался один, — и часть вас выбрала поля как самую безопасную страницу для жизни. Фирменная петля: вы принижаете себя заранее, комната верит вашей оценке, и теснота, в которую вы себя поставили, болит — и боль подшивается как доказательство для дальнейшего уменьшения. Каждая самоуничижительная шутка — камешек, вынутый из вашей же стены. Выход — одно предложение без примечания: следующее достижение, мнение или просто присутствие, предложенное без сноски, без «да ерунда», без упреждающей скидки. Пусть стоит в основном тексте, крупным шрифтом. Части, прятавшие вас, защищали от глаз, которые давно читают иначе.",
    },
  },
  "numbxabandoned": {
    short: {
      ru: "Поезд чувств перестал приходить, но вы всё равно протапливаете станцию.",
    },
    long: {
      en: "The train of feeling stops arriving; you keep the station warm anyway. From inside, this feels like competence in flatness: you function — work, errands, conversations, even care — while inside, the platform where emotions used to arrive stands quiet under a gray schedule board. Once, feelings brought news that hurt too much: the ones who left, the leaving that kept happening. And a part of you, wiser than the schedule, cut the line — because a child who feels everything about abandonment cannot also keep standing. The numbness is mercy, administered constantly. The signature loop: a flicker of feeling approaches on the rails, the part switches the signal, the flicker passes through without stopping, and the station logs another quiet day — proof that the system works, cost unbilled. The way out is one bundled-up minute on the platform, daily, asking \"what is even one percent present?\" — and greeting whatever limps in. The line was cut for a good reason. Some trains still run. You are the stationmaster now.",
      ru: "Поезд чувств перестал приходить, но вы всё равно протапливаете станцию. Изнутри это похоже на компетентность в ровности: вы функционируете — работа, дела, разговоры, даже забота, — а внутри платформа, куда когда-то прибывали эмоции, тихо стоит под серым табло. Когда-то чувства приносили новости, что слишком болели: о тех, кто ушёл, об уходах, не прекращавшихся. И часть вас, мудрее расписания, перерезала линию — потому что ребёнок, который чувствует всё о покинутости, не может продолжать стоять. Оцепенение — милосердие, которое вводят постоянно, как обезболивающее. Фирменная петля: на рельсах появляется отблеск чувства, часть переключает стрелку, отблеск проходит без остановки, и станция записывает ещё один тихий день — доказательство, что система работает; счёт не выставляется. Выход — позволить прибытию случиться самому: одна укутанная минута на платформе, ежедневно, с вопросом «что присутствует хотя бы на один процент?» — и приветствие тому, что прихрамывает. Линию перерезали не зря. Некоторые поезда всё же идут. Вы теперь начальник станции.",
    },
  },
  "numbxashamed": {
    short: {
      ru: "Помехи заполняют эфир там, где стыд вёл бы трансляцию.",
    },
    long: {
      en: "Static fills the channel where shame would otherwise broadcast. From inside, this feels like nothing — which is precisely the design. Where other people flinch and flush, you hear a soft gray hiss: decisions become arbitrary, mirrors become furniture, and the question \"what do you feel about it?\" returns channel noise. Once, shame broadcast at full volume and no one turned it down for the child receiving it — so a part of you became the engineer and jammed the frequency entirely. Better static than that signal. The signature loop: a situation arises that should register — praise, insult, intimacy — the static holds, you respond from procedure rather than feeling, and the flatness reads to others as composure while it is actually anesthesia. The way out is one channel unscrambled, briefly, on purpose: after a moment that mattered, write the single word that is even thirty percent true — \"off\", \"small\", \"exposed\" — without needing the full broadcast. The static is the protection at work; the person is still there behind it. One word at a time, the signal returns.",
      ru: "Помехи заполняют эфир там, где стыд вёл бы трансляцию. Изнутри это не ощущается никак — что и есть замысел. Там, где другие вздрагивают и вспыхивают, вы слышите мягкий серый шип: решения становятся произвольными, зеркала — мебелью, а вопрос «что ты по этому поводу чувствуешь?» возвращает шум канала. Когда-то стыд вещал на полную мощность, и никто не убавил громкость за ребёнка на приёме, — и часть вас стала инженером и глушила частоту целиком. Лучше помехи, чем тот сигнал. Фирменная петля: возникает ситуация, которая должна регистрироваться, — похвала, оскорбление, близость, — помехи держатся, вы отвечаете накатанной процедурой — чувство в ответе участия не принимает, — и ровность читается другими как выдержка, хотя на деле является наркозом. Выход — один канал, кратко расшифрованный, намеренно: после момента, который что-то значил, напишите одно слово, верное хотя бы на тридцать процентов — «не так», «мал», «обнажён» — и этого слова достаточно. Помехи — работа защиты; личность остаётся за ними. По слову за раз сигнал возвращается.",
    },
  },
  "numbxfrightened": {
    short: {
      ru: "Вы становитесь настолько спокойными, что засыпает сама тревога.",
    },
    long: {
      en: "You go so calm that alarm itself falls asleep. From inside, this feels like being unshakeable — the crisis hits, everyone panics, and you move through it level, efficient, almost bored. People admire it. They do not see the mechanism: long ago, fear was useless — a child could not run, could not fight, could only endure — so a part of you learned to administer the still-water anesthetic on demand. That calm works as preemptive sedation, applied the moment the water might churn. The signature loop: something frightening approaches, the stillness floods in automatically, you handle everything and register nothing, then handle the next thing, and the next — while the fear, unsensed, accumulates in the body as sleeplessness, jaw, gut, a engine-idle hum no calm ever reaches. The way out is one ripple permitted: in a genuinely safe moment, do something small that stirs the water deliberately — a film that might move you, music loud in the car — and let your eyes sting without shutting it down. Calm becomes strength the moment you choose it yourself.",
      ru: "Вы становитесь настолько спокойными, что засыпает сама тревога. Изнутри это похоже на несокрушимость: кризис приходит, все паникуют — а вы движетесь сквозь него ровно, эффективно, почти скучая. Люди восхищаются. Они не видят механизма: когда-то страх был бесполезен — ребёнок не мог ни бежать, ни бить, ни сделать ничего, кроме как терпеть, — и часть вас научилась вводить анестезию стоячей воды по требованию. Такое спокойствие работает как упреждающая седация — укол на случай, если вода всколыхнётся. Фирменная петля: приближается нечто пугающее, неподвижность вливается автоматически, вы обрабатываете всё и не регистрируете ничего, потом следующее, и следующее, — а неощущаемый страх копится в теле как бессонница, челюсть, кишечник, гул холостого хода, до которого никакое спокойствие не добирается. Выход — одна разрешённая рябь: в по-настоящему безопасный момент сделайте что-то малое, всколыхнувшее воду намеренно — фильм, который может растрогать, музыка громко в машине — и дайте глазам защипать, не отключая. Спокойствие становится силой, когда вы выбираете его сами.",
    },
  },
  "numbxunseen": {
    short: {
      ru: "Вы идёте по собственной жизни, укутанные в вату.",
    },
    long: {
      en: "You walk through your own life wrapped in cotton wool. From inside, this feels like a gentle, foggy continuity — days pass, needs get met at the minimum viable level, and nothing quite touches you, including the things that should. The cotton was wound on carefully, long ago, by a part of you protecting a child for whom being unnoticed went on so long that the ache of it became unbearable to feel. Numbness to the unseen is numbness to everything; anesthesia is not selective. The signature loop: life offers a moment that might register — beauty, affection, an achievement — the cotton muffles it to a rumor, the moment passes unmet, and the flatness provides no data, no preference, no pull in any direction, so the walking continues on inertia alone. The way out is one fingertip exposed: once a day, pick one sensory thing — the first sip of coffee, water on your face, sun on a wrist — and give it thirty undivided seconds. Feeling returns through the body before it returns through the mind. Start at the edges.",
      ru: "Вы идёте по собственной жизни, укутанные в вату. Изнутри это мягкое, туманное продолжение: дни проходят, нужды закрываются по минимуму, и ничто вас по-настоящему не касается — включая то, что должно было бы. Вату намотали заботливо, давно, часть вас, защищавшая ребёнка, для которого незамечаемость длилась так долго, что боль её стало невыносимо чувствовать. Оцепенение к незамеченному — оцепенение ко всему; анестезия не избирательна. Фирменная петля: жизнь предлагает момент, который мог бы отозваться, — красоту, нежность, достижение, — вата глушит его до шёпота, момент проходит не встреченным, и ровность не даёт ни данных, ни предпочтения, ни тяги в какую-либо сторону — и ходьба продолжается по инерции. Выход — высвободить один палец из ваты: раз в день выбирайте одну сенсорную вещь — первый глоток кофе, воду на лице, солнце на запястье — и отдавайте ей тридцать неразделённых секунд. Чувство возвращается через тело раньше, чем через ум. Начните с краёв.",
    },
  },
  "pleaserxabandoned": {
    short: {
      en: "You keep everyone else’s fire tended so no one notices — or leaves — the one quietly going out inside you.",
      ru: "Вы поддерживаете огонь в каждом, чтобы никто не заметил — и не покинул — тот, что тихо гаснет внутри вас.",
    },
    long: {
      en: "You keep everyone else’s fire tended so no one notices — or leaves — the one quietly going out inside you. From inside, this feels like love, and partly it is: a part of you genuinely delights in care. But underneath runs an older contract, signed by a child who learned that people stay when you are useful and warm, and leave when you have needs. So the tending never stops, and the tenderness points only outward. The signature loop: you give, they stay, you conclude the giving worked, so you give more — while your own preferences atrophy from disuse until even the question \"what do I want?\" returns static. Most of the exhaustion comes from the surveillance — the constant tracking of everyone’s temperature except your own. The way out is small and terrifying: state one preference this week — a restaurant, a film, a yes that costs something — to someone safe, and stay in the room while they simply accommodate you. A whole village is warmed by many fires — yours deserves tending too.",
      ru: "Вы поддерживаете огонь в каждом, чтобы никто не заметил — и не покинул — тот, что тихо гаснет внутри вас. Изнутри это похоже на любовь — и частично так и есть: часть вас искренне радуется заботе. Но ниже течёт старый контракт, подписанный ребёнком, который узнал: люди остаются рядом с тем, кто полезен и тёпл, и уходят, когда у него появляются нужды. Поэтому забота длится без остановки — и вся направлена наружу. Фирменная петля: вы даёте — они остаются — вы заключаете, что сработало, — и даёте ещё, пока собственные предпочтения не атрофируются от неиспользования, а вопрос «чего хочу я?» возвращает только шум помех. Сил больше всего уходит на наблюдение — постоянный замер температуры всех, кроме себя. Выход мал и страшен: назвать одно своё пожелание на этой неделе — ресторан, фильм, «да», которое что-то стоит, — безопасному человеку и остаться в комнате, пока вас просто обслуживают. В одиночку ваш огонь деревню не согреет — да от него этого и не ждут.",
    },
  },
  "pleaserxashamed": {
    short: {
      ru: "Вы выращиваете извинения там, где другие выросили бы претензии.",
    },
    long: {
      en: "You grow sorries where other people might grow complaints. From inside, this feels like being easy to be with, low-maintenance, kind — and it is lonely in a way that has no legitimate complaint to file. The child underneath absorbed shame for existing loudly: needs were treated as burdens, anger as betrayal, so a part of you learned to compost every grievance into an apology before it could reach the air. The signature loop: something hurts, the apology sprouts first — \"sorry, I’m probably being too sensitive\" — the hurt goes unnamed, the shame gets watered, and next time the sprout comes faster. Meanwhile the soil of you grows nothing that is plainly, simply yours. The way out is one unconverted seed: the next small hurt stated as a plain sentence without a sorry in front of it. \"That stung\" is a complete sentence. Watch the sky fail to fall. The gardener in you was protecting a child who was never allowed to need anything. That child needed things — and there was no shame in it.",
      ru: "Вы выращиваете извинения там, где другие выросили бы претензии. Изнутри это ощущается как лёгкость в общении, нетребовательность, доброта — и одиночество здесь особого рода — на него не пожалуешься. Ребёнок внизу впитал стыд за громкое существование: нужды считались обузой, злость — предательством, и часть вас научилась компостировать каждую обиду в извинение прежде, чем она коснётся воздуха. Фирменная петля: что-то болит — извинение прорастает первым («прости, я, наверное, слишком чувствительный»), боль остаётся безымянной, стыд получает полив, и в следующий раз росток выходит быстрее. А в почве, между тем, не растёт ничего просто и определённо вашего. Выход — одно семя, оставшееся собой: следующую малую боль назвать простым предложением, без «извините» впереди. «Это было обидно» — законченное предложение. И посмотрите: небо не падает. Садовник внутри защищал ребёнка, которому запрещали ни в чём нуждаться. Тому ребёнку что-то было нужно. В этом не было стыда.",
    },
  },
  "pleaserxfrightened": {
    short: {
      ru: "Вы успокаиваете комнату раньше, чем успеваете понять, что чувствуете сами.",
    },
    long: {
      en: "You calm the room before you even know what you feel. From inside, this feels like a sixth sense: a shift in someone’s tone, a tightened jaw across the table, and your nervous system registers it before your mind does, already deploying warmth, jokes, refills, accommodation. The child underneath grew up in weather that turned dangerous without warning — an adult whose moods filled the whole house — and a part of you became a lightning-rod, absorbing tension so the storm would not strike. The signature loop: tension appears, you soothe it, relief arrives, and the cost is skipped entirely: your own feeling, whatever it was, never got named because the emergency came first and always will. Over years you become a stranger to your own weather. The way out is one beat of delay: the next time the room tenses, pause — physically, visibly — and ask yourself \"what am I feeling right now?\" before doing anything at all. The storm you are calming was rarely yours to stop. Your feelings were not the cause of anyone’s weather.",
      ru: "Вы успокаиваете комнату раньше, чем успеваете понять, что чувствуете сами. Изнутри это похоже на шестое чувство: перемена в чьём-то тоне, сжатая челюсть за столом — и ваша нервная система регистрирует это раньше разума, наготове тепло, шутки, новая порция чая, услужливость. Ребёнок внизу рос в погоде, менявшейся без предупреждения, — во взрослом, чьи настроения заполняли весь дом, — и часть вас стала громоотводом, поглощающим напряжение, чтобы гроза не ударила. Фирменная петля: появляется напряжение — вы его разряжаете — приходит облегчение, и цена пропускается целиком: ваше чувство, каким бы оно ни было, не названо, потому что чрезвычайная ситуация всегда первая. За годы вы становитесь чужаком собственной погоды. Выход — пауза в один такт: в следующий раз, когда комната напряжётся, сделайте паузу — физически, заметно — и спросите себя «что я сейчас чувствую?», прежде чем делать хоть что-то. Гроза, которую вы разряжаете, редко оказывается вашей. Ваши чувства не были причиной ничьей погоды.",
    },
  },
  "pleaserxunseen": {
    short: {
      ru: "Ваше «да» звучит так быстро, что ваши собственные желания не успевают дойти до стола.",
    },
    long: {
      en: "Your yes comes so fast that your own preferences never make it to the table. From inside, this feels like generosity with a lag problem: by the time you might have wanted something different, the moment has already been agreed away. The child underneath learned that visibility was conditional — you counted when you were convenient — and a part of you streamlined the whole self into a single, frictionless syllable. The signature loop: a request arrives, yes fires automatically, brief approval lands, and somewhere in the delay afterward a faint signal surfaces — \"actually…\" — which is politely buried, again, because reversing now would be an imposition. Each buried signal dims the next one. The way out is a slower yes: once this week, answer \"let me check and get back to you,\" and use the gap to locate one honest preference, even a small one. A slower yes is still a yes. Your wants were on time all along — they were simply never offered a chair.",
      ru: "Ваше «да» звучит так быстро, что ваши желания не успевают дойти до стола. Изнутри это похоже на щедрость с проблемой задержки: к моменту, когда вы, возможно, хотели бы другого, момент уже согласован и отдан. Ребёнок внизу узнал, что значимость условна — вы считались, когда были удобны, — и часть вас упростила всё «я» в один беспроблемный слог — «да». Фирменная петля: приходит просьба, «да» срабатывает автоматически, короткое одобрение приземляется, и где-то в задержке после всплывает слабый сигнал — «на самом деле…» — который вежливо хоронится снова, ведь отменять теперь было бы посягательством. Каждый похороненный сигнал притупляет следующий. Выход — более медленное «да»: один раз на этой неделе ответьте «дайте мне проверить, вернусь с ответом» — и используйте паузу, чтобы найти одно честное пожелание, даже маленькое. «Да» имеет право на паузу. Ваши желания не опоздали; им просто не давали стула.",
    },
  },
  "rebelxabandoned": {
    short: {
      ru: "Вы уходите первыми — громко, — чтобы уход хотя бы был вашим.",
    },
    long: {
      en: "You leave first, loudly, so departure is at least yours. From inside, this feels like power, even dignity: while others cling and beg, you slam doors on your own schedule, before anyone can do it to you. Once, a child was left — quietly, devastatingly, without ceremony — and a part of you vowed never again to be the one standing at the window. If leaving is inevitable, the rebel will at least author it. The signature loop: closeness deepens, the part scans for the first hint of withdrawal, finds it — everything can be read as withdrawal if you try — and detonates the relationship preemptively: a fight, a scene, a flourish. The aftermath hurts, but it is a hurt with a signature on it. The way out is one ending declined: the next time the impulse comes, say out loud, \"a part of me wants to bolt right now\" — and stay ten more minutes. The part is right that leaving exists; it just keeps casting you as the one who leaves.",
      ru: "Вы уходите первыми — громко, — чтобы уход хотя бы был вашим. Изнутри это похоже на силу и даже достоинство: пока другие цепляются и умоляют, вы захлопываете двери по собственному расписанию, собственной рукой, прежде чем кто-то сделает это с вами. Когда-то ребёнка бросили — тихо, сокрушительно, без церемоний, — и часть вас поклялась никогда больше не быть тем, кто стоит у окна. Если уход неизбежен, бунтарь хотя бы станет его автором. Фирменная петля: близость углубляется, часть сканирует пространство на первый признак отстранения, находит его — что угодно читается как отстранение, если постараться, — и подрывает связь упреждающе: ссорой, сценой, эффектным жестом. Последствия болезненны, но это боль с подписью. Выход — один отменённый уход: в следующий раз, когда рука уже потянется к двери, скажите вслух — человеку или себе: «часть меня хочет сбежать прямо сейчас» — и останьтесь ещё на десять минут. Часть не неправа, что уходы случаются. Она просто всё время назначает вас уходящим.",
    },
  },
  "rebelxashamed": {
    short: {
      ru: "Вы поднимаете собственные цвета над раной, которую так и не назвали.",
    },
    long: {
      en: "You fly your own colors over a wound you never named. From inside, this feels like defiance with a flag: rules defied, expectations refused, a style of moving through the world that says \"I answer to no one.\" And it is genuinely alive — but listen for what the defiance is answering. Underneath, a child was told, in a thousand small ways, that who they were was unacceptable; and a part of you chose outlawry over annihilation: if I cannot be good, I will be glaring. The shame was never named because naming it would mean admitting the verdict landed. The signature loop: a hint of judgment appears, the colors run up the pole — louder, bolder, more unapologetic — the judged feeling converts into energy, and the wound beneath gets another layer of bunting instead of a look. The way out is one quiet moment without the flag: alone, write the sentence \"what I was really ashamed of was…\" and let it be small, true, unwitnessed. Defiance is armor for a wound — and beneath the armor, a living person has been there all along.",
      ru: "Вы поднимаете собственные цвета над раной, которую так и не назвали. Изнутри это похоже на неповиновение с флагом: правила отвергнуты, ожидания отклонены, стиль прохода через мир, говорящий «я никому не подчиняюсь». И это по-настоящему живо — но вслушайтесь, на что отвечает вызов. Внизу ребёнок, которому в тысяче малых способов сказали, что он неприемлем; и часть вас решила: лучше изгой, чем призрак, — если хорошим быть нельзя, буду заметным. Стыд так и не назвали, потому что назвать — значило признать, что вердикт попал в цель. Фирменная петля: мелькает намёк на осуждение, цвета взлетают на флагшток — громче, дерзче, непримиримее, — осуждённость конвертируется в энергию, и рана внизу получает ещё слой флажной ткани вместо взгляда. Выход — один тихий момент без флага: наедине допишите предложение «мне на самом деле было стыдно за…» — пусть будет мало, правдиво, без свидетелей. Вызов — броня раны. Под бронёй всё это время — живой человек.",
    },
  },
  "rebelxfrightened": {
    short: {
      ru: "Вы бросаетесь в драку, потому что неподвижность однажды означала удар.",
    },
    long: {
      en: "You come out swinging because stillness once meant getting hit. From inside, this feels like readiness: the world is a room with exits to watch, and you watch all of them, jaw set, first move always yours. The calm ones seem either brave or naive. Once, a child learned the physics of danger: that the pause before the blow is survivable only if you fill it with your own storm — attack, noise, preemption. A part of you carries that physics forward into rooms where no blow is coming. The signature loop: a hint of threat registers — a critical tone, a closed door, a surprise — the swing fires before thought, the moment escalates, and the escalation confirms the world’s hostility, rearming the part for the next round. You win fights you never needed to have. The way out is one breath inserted between signal and swing: when the readiness spikes, plant both feet, exhale once, and ask \"is anything actually hitting me right now?\" Usually, honestly: no. The part guarded you through real wars. The war moved out. It can too.",
      ru: "Вы бросаетесь в драку, потому что неподвижность однажды означала удар. Изнутри это похоже на готовность: мир — комната, за выходами в которой нужно следить, и вы следите за всеми, челюсть сжата, первый ход всегда ваш. Спокойные кажутся либо смелыми, либо наивными. Когда-то ребёнок выучил физику опасности: пауза перед ударом переносима, лишь если заполнить её собственной бурей — атакой, шумом, упреждением. Часть вас несёт эту физику в комнаты, откуда удар не идёт. Фирменная петля: регистрируется намёк на угрозу — критическая интонация, закрытая дверь, сюрприз, — замах срабатывает раньше мысли, момент эскалирует, и эскалация подтверждает враждебность мира, перевооружая часть к следующему раунду. Вы выигрываете драки, которые вам не были нужны. Выход — один вдох, вставленный между сигналом и ударом: когда готовность вспыхивает, поставьте обе стопы, выдохните раз и спросите: «меня сейчас правда кто-то бьёт?» Обычно, честно: нет. Часть провожала вас через настоящие войны. Те войны давно закончились — части пора это узнать.",
    },
  },
  "rebelxunseen": {
    short: {
      en: "You burn loud and bright across every sky, praying someone finally reads the message: I am here.",
      ru: "Вы горите громко и ярко в каждом небе, моля, чтобы кто-нибудь наконец прочитал послание: я здесь.",
    },
    long: {
      en: "You burn loud and bright across every sky, praying someone finally reads the message: I am here. From inside, this feels like vitality — you are the loudest laugh, the wildest story, the one the room orbits. But trace it down to the fuse: a child stood in a room full of people and was not seen, not once, until visibility became a matter of survival. A part of you learned that ordinary presence fails, and only signal flares register on anyone’s horizon. The signature loop: the need to be seen rises, the flare goes up — the drama, the provocation, the too-much — heads turn, attention lands for a moment, and then looks away, because flares burn out; and the part reads the fading light as proof the next flare must be bigger. The way out is one unlit signal: with someone safe, ask directly for attention in plain words — \"I could use some time today; can we talk?\" — and receive it without performance. The flare said \"I am here.\" The plain voice says it too, and carries further.",
      ru: "Вы горите громко и ярко в каждом небе, моля, чтобы кто-нибудь наконец прочитал послание: я здесь. Изнутри это похоже на жизненную силу — вы самый громкий смех, самая дикая история, тот, вокруг кого вращается комната, — и это настоящая энергия, настоящее присутствие. Но проследите до фитиля: ребёнок стоял в комнате, полной людей, и не был увиден — ни разу, — пока заметность не стала вопросом выживания. Часть вас усвоила: обычное присутствие не работает, регистрируются только сигнальные ракеты. Фирменная петля: поднимается потребность быть увиденным, ракета уходит вверх — драма, провокация, «чересчур», — головы поворачиваются, внимание ложится на минуту — и гаснет, потому что ракеты сгорают; и часть читает угасающий свет как доказательство, что следующая должна быть больше. Выход — один незажжённый сигнал: попросите у безопасного человека внимания прямым текстом — «мне нужно время; можем поговорить?» — и примите его без представления. Ракета говорила: я здесь. Спокойный голос умеет то же. И летит дальше.",
    },
  },
  "taskmasterxabandoned": {
    short: {
      ru: "Вы строите свою ценность, как собор, которому нельзя завершиться: стоит остановиться — и кто-то уйдёт.",
    },
    long: {
      en: "From the inside, this constellation feels like a staircase you climb even in sleep. Somewhere below sits a child who learned that people leave when you stop performing, so a part of you took up construction: one more project, one more credential, one more proof that you are worth staying for. The signature loop is elegant and cruel. You achieve, feel a flicker of relief, then hear the scaffolding creak — because worth that is built can also be inspected, and inspected worth never passes final review. So you start again, taller this time. The exhaustion is the part’s proof of love, worn like a badge. The way out is one deliberate pause while something is still imperfect — an afternoon, an unpolished email — in which nobody leaves. Stay with the dread; let it age. You are so much more than the build.",
      ru: "Изнутри это созвездие похоже на лестницу, по которой вы поднимаетесь даже во сне. Где-то внизу сидит ребёнок, который узнал: люди уходят, если перестать стараться, — и часть вас взялась за строительство: ещё один проект, ещё одно подтверждение, ещё одно доказательство, что вас стоит держать рядом. Фирменная петля изящна и жестока. Вы достигаете, чувствуете вспышку облегчения — и слышите, как скрипят леса: ведь ценность, которую построили, можно и инспектировать, а инспектируемая ценность никогда не проходит финальную приёмку. И вы начинаете заново, ещё выше. Истощение — знак любви, который часть носит как орден. Выход — одна намеренная пауза, пока что-то ещё несовершенно: полдня, неотшлифованное письмо, — и никто не уходит. Побудьте с этим страхом; дайте ему состариться. Вы всегда были больше этой стройки.",
    },
  },
  "taskmasterxashamed": {
    short: {
      en: "Every result is a hearing, every delivery a plea: competent enough, this time, to be kept.",
      ru: "Каждый результат — слушание дела, каждая сдача работы — мольба: на этот раз я достаточно хорош, чтобы меня оставили.",
    },
    long: {
      en: "Every result here is a hearing, every delivery a plea: competent enough, this time, to be kept. From inside, life feels like a courtroom where the charge is never named — only the verdict matters, and the verdict is always pending. A part of you pushes you to produce because long ago, somewhere, love arrived wrapped in achievement, and its withdrawal came wrapped in disappointment. The signature loop: you deliver, wait for the ruling, feel a brief acquittal, then the shame files an appeal and the next case opens. Rest feels like contempt of court. Even praise is entered as evidence; the case never closes. The way out is one result released at \"good enough\" — deliberately, on purpose — while you track what actually follows. Usually what follows is ordinary silence, ordinary continuity. Let the court adjourn for a day. The trial exists only in the part’s imagination.",
      ru: "Каждый результат здесь — слушание дела, каждая сдача работы — мольба: на этот раз я достаточно хорош, чтобы меня оставили. Изнутри жизнь кажется судом, где обвинение никогда не озвучено — важен только вердикт, и вердикт всегда отложен. Часть вас гонит вас производить, потому что когда-то любовь приходила, завёрнутая в достижения, а её отмена — завёрнутая в разочарование. Фирменная петля: вы сдаёте, ждёте решения, получаете короткое оправдание — и стыд подаёт апелляцию, открывается новое дело. Отдых ощущается как неуважение к суду. Даже похвала идёт в папку с доказательствами и дело не закрывает. Выход — один результат, выпущенный на уровне «достаточно хорошо», намеренно, при отслеживании того, что последует на самом деле. Обычно следует обычная тишина, обычное продолжение. Дайте суду выходной. Вашу ценность никто не судит; процесс существует только в воображении части.",
    },
  },
  "taskmasterxfrightened": {
    short: {
      ru: "Плотное расписание стоит между вами и катастрофой, которую помнит тело.",
    },
    long: {
      en: "A packed calendar stands between you and the catastrophe your body remembers. From inside, this feels like safety through velocity: as long as every hour is assigned, the disaster cannot find an opening. The fear underneath is old and specific — a time when stillness meant danger, when unstructured space was exactly where the hurt found you. So a part of you became a scheduler-guard, and it never sleeps. The signature loop: you fill the days, run on schedule, and the moment a gap appears — a cancelled meeting, a free Sunday — anxiety floods in faster than relief, and the part reads it as confirmation that the walls are necessary. Busyness becomes both the cure and the disease. The way out is small and repeated: leave fifteen minutes unstructured, on purpose, with feet on the floor, and let the alarm ring without answering it. The catastrophe it guards against belongs to another time. What lives in the gap is the child it protects.",
      ru: "Плотное расписание стоит между вами и катастрофой, которую помнит тело. Изнутри это похоже на безопасность через скорость: пока у каждого часа есть задание, беда не найдёт лазейки. Страх внизу старый и конкретный — время, когда неподвижность означала опасность, когда неструктурированное пространство было именно тем местом, откуда приходила боль. Часть вас стала сторожем-планировщиком и не спит никогда. Фирменная петля: вы заполняете дни, живёте по графику, и в момент, когда появляется дыра — отменённая встреча, свободное воскресенье, — тревога вливается быстрее облегчения, доказывая части её правоту. Занятость становится и лекарством, и болезнью. Выход мал и повторяем: оставить пятнадцать минут неструктурированными, намеренно, стопы в пол, и позволить сигнализации звонить, не отвечая. Катастрофа, от которой часть несёт вахту, осталась в другом времени. В этой паузе есть только ребёнок, которого она хранит.",
    },
  },
  "taskmasterxunseen": {
    short: {
      ru: "Вы храните чеки за всё, что сделали, словно любовь — это аудит.",
    },
    long: {
      en: "You keep receipts of everything you do, as if love were an audit. From inside, this constellation feels like a ledger that must always balance: favors listed, efforts documented, sacrifices filed under assets, in case anyone ever asks what you are worth. The child underneath learned that being noticed came through usefulness — the one doing it all went unseen — and a part of you vowed to keep the books immaculate. The signature loop: you give, you log, you quietly hope this time someone will read the ledger without being asked; they rarely do, because they never knew it existed. Resentment accrues interest in a currency nobody spends. The way out is one entry spoken aloud instead of recorded: tell a safe person something you did purely because you wanted to, with no invoice attached. Watch what happens when worth stops being bookkeeping. You are the author of the whole ledger.",
      ru: "Вы храните чеки за всё, что делаете, словно любовь — это аудит. Изнутри созвездие похоже на книгу учёта, которая всегда должна сходиться: услуги записаны, усилия задокументированы, жертвы подшиты в активы — на случай, если кто-то спросит, чего вы стоите. Ребёнок внизу усвоил, что внимание достаётся сделанному; самому делающему оно почти не доставалось, — и часть вас поклялась вести книги безупречно. Фирменная петля: вы даёте, вы записываете, вы тихо надеетесь, что на этот раз кто-то прочтёт учёт, не будучи спрошенным; этого почти не случается, потому что никто не знал о его существовании. Обида капает процентами в валюте, которую никто не тратит. Выход — одна запись, произнесённая вслух вместо учтённой: расскажите безопасному человеку о том, что сделали просто потому, что хотели, — без счёта на оплату. Посмотрите, что станет с ценностью, когда перестанет быть бухгалтерией. Вы — автор всей этой бухгалтерии.",
    },
  },
};

export const CONSTELLATION_RU_NAME: Record<string, string> = {
  "taskmasterxabandoned": "Недостроенный собор",
  "taskmasterxashamed": "Полигон доказательств",
  "taskmasterxfrightened": "Железное расписание",
  "taskmasterxunseen": "Книга учёта добрых дел",
  "inner_criticxabandoned": "Суд уходов",
  "inner_criticxashamed": "Обвинительная скамья",
  "inner_criticxfrightened": "Эхо судейского молотка",
  "inner_criticxunseen": "Примечание на полях",
  "pleaserxabandoned": "Хранимый огонь",
  "pleaserxashamed": "Сад извинений",
  "pleaserxfrightened": "Успокаивающее бдение",
  "pleaserxunseen": "Тихая уступчивость",
  "controllerxabandoned": "Наглухо запертая дверь",
  "controllerxashamed": "Комната в белых перчатках",
  "controllerxfrightened": "Сжатый штурвал",
  "controllerxunseen": "Картотека",
  "analystxabandoned": "Длинное уравнение",
  "analystxashamed": "Аналитическое досье",
  "analystxfrightened": "Стеклянная обсерватория",
  "analystxunseen": "Наблюдательная палуба",
  "hermitxabandoned": "Дом с одной лампой",
  "hermitxashamed": "Закрытые ставни",
  "hermitxfrightened": "Сад за высокой стеной",
  "hermitxunseen": "Запертый кабинет",
  "bypasserxabandoned": "Светлый объезд",
  "bypasserxashamed": "Витражная роза",
  "bypasserxfrightened": "Парящий мост",
  "bypasserxunseen": "Бесконечное лето",
  "numbxabandoned": "Занесённая снегом станция",
  "numbxashamed": "Комната белого шума",
  "numbxfrightened": "Стоячая вода",
  "numbxunseen": "Туманное поле",
  "rebelxabandoned": "Сожжённые мосты",
  "rebelxashamed": "Разорванное знамя",
  "rebelxfrightened": "Загнанная буря",
  "rebelxunseen": "Сигнальная ракета",
  "charmerxabandoned": "Комната ста зеркал",
  "charmerxashamed": "Маска в луче прожектора",
  "charmerxfrightened": "Ослепительное отступление",
  "charmerxunseen": "Стоячие овации"
};

export const CONSTELLATION_RU_SUBTYPE: Record<string, string> = {
  "taskmaster:striver": "Стремящийся",
  "taskmaster:perfectionist": "Перфекционист",
  "taskmaster:machine": "Машина",
  "taskmaster:star-performer": "Звезда сцены",
  "taskmaster:optimizer": "Оптимизатор",
  "inner_critic:critic": "Критик",
  "inner_critic:slave-driver": "Надсмотрщик",
  "inner_critic:prosecutor": "Прокурор",
  "inner_critic:apologist": "Извиняющийся",
  "inner_critic:auditor": "Ревизор",
  "pleaser:helper": "Помощник",
  "pleaser:clinger": "Цепляющийся",
  "pleaser:martyr": "Мученик",
  "pleaser:diplomat": "Дипломат",
  "pleaser:ghostwriter": "Гострайтер",
  "controller:planner": "Планировщик",
  "controller:sentry": "Часовой",
  "controller:foreman": "Прораб",
  "controller:chessmaster": "Гроссмейстер",
  "controller:tyrant": "Тиран",
  "analyst:observer": "Наблюдатель",
  "analyst:wall": "Стена",
  "analyst:architect": "Архитектор",
  "analyst:skeptic": "Скептик",
  "analyst:watchtower": "Дозорная башня",
  "numb:fog": "Туман",
  "numb:deep-freeze": "Глубокая заморозка",
  "numb:escape-artist": "Мастер побегов",
  "numb:hibernator": "Спячка",
  "numb:saboteur": "Саботажник",
  "rebel:rebel": "Бунтарь",
  "rebel:cornered-one": "Загнанный",
  "rebel:provocateur": "Провокатор",
  "rebel:burnout": "Выгоревший",
  "rebel:outlaw": "Изгой",
  "charmer:charmer": "Обаяшка",
  "charmer:spotlight-chaser": "Охотник за прожектором",
  "charmer:enchanter": "Чародей",
  "charmer:impresario": "Импресарио",
  "charmer:flirt-with-fire": "Играющий с огнём",
  "hermit:hermit": "Отшельник",
  "hermit:bunker-keeper": "Хранитель бункера",
  "hermit:lighthouse": "Маяк",
  "hermit:veiled-one": "Потаённый",
  "hermit:deep-cave": "Глубокая пещера",
  "bypasser:bypasser": "Обходчик",
  "bypasser:gilded-mask": "Позолоченная маска",
  "bypasser:blissful-helper": "Блаженный помощник",
  "bypasser:abstractor": "Абстракционист",
  "bypasser:sky-gazer": "Созерцатель неба",
  "abandoned:abandoned-one": "Брошенный",
  "abandoned:orphan-who-serves": "Служащий сирота",
  "abandoned:hungry-heart": "Голодное сердце",
  "abandoned:small-hours": "Час до рассвета",
  "abandoned:empty-room": "Пустая комната",
  "ashamed:ashamed-one": "Стыдящийся",
  "ashamed:branded-one": "Заклеймённый",
  "ashamed:impostor": "Самозванец",
  "ashamed:hidden-face": "Скрытое лицо",
  "ashamed:masked-one": "В маске",
  "frightened:frightened-one": "Напуганный",
  "frightened:braced-one": "Сжавшийся",
  "frightened:vigilant": "Бдительный",
  "frightened:startled-child": "Вздрогнувший ребёнок",
  "frightened:frozen-one": "Онемевший",
  "unseen:unseen-one": "Незамеченный",
  "unseen:echo": "Эхо",
  "unseen:good-child": "Хороший ребёнок",
  "unseen:unheard-scream": "Неуслышанный крик",
  "unseen:backroom-mind": "Ум из задней комнаты"
};

export const CONSTELLATION_PART_NAME_RU: Record<string, string> = {
  "taskmaster": "Деятель",
  "inner_critic": "Внутренний критик",
  "pleaser": "Угодник",
  "controller": "Контролёр",
  "analyst": "Аналитик",
  "hermit": "Отшельник",
  "bypasser": "Обходчик",
  "numb": "Онемение",
  "rebel": "Бунтарь",
  "charmer": "Обаяшка",
  "abandoned": "Брошенный",
  "ashamed": "Стыдящийся",
  "frightened": "Напуганный",
  "unseen": "Незамеченный",
  "sage": "Мудрец",
  "warrior": "Воин",
  "caregiver": "Заботник",
  "explorer": "Исследователь"
};

export const CONSTELLATION_RESOURCE_NAME_RU: Record<string, string> = {
  "sage": "Мудрец",
  "warrior": "Воин",
  "caregiver": "Заботник",
  "explorer": "Исследователь"
};

export const COMPLEX_COPY_RU: Record<string, { name: string; belief: string; experiment: string }> = {
  "abandonment": {
    "name": "Комплекс покинутости",
    "belief": "Я достоин(на) любви, только если удобен(на) и ни о чём не прошу.",
    "experiment": "Откажите в одной маленькой просьбе и останьтесь рядом с дискомфортом, не отключаясь."
  },
  "inferiority": {
    "name": "Комплекс неполноценности",
    "belief": "Я в глубине дефектен(на); если меня по-настоящему увидят — уйдут.",
    "experiment": "Заметьте одну самоатаку и переименуйте её: «я замечаю мысль, что я недостаточно хорош»."
  },
  "power": {
    "name": "Комплекс власти",
    "belief": "Если я отпущу контроль, всё рухнет.",
    "experiment": "Оставьте одно мелкое решение за другим человеком и посмотрите, что произойдёт на самом деле."
  },
  "performance": {
    "name": "Комплекс результативности",
    "belief": "Я не имею права на ошибку; моя ценность — это мой результат.",
    "experiment": "Выпустите одну вещь на уровне «достаточно хорошо» и зафиксируйте, что последовало на самом деле."
  },
  "engulfment": {
    "name": "Комплекс поглощения",
    "belief": "Если я подчинюсь, я исчезну.",
    "experiment": "Найдите на этой неделе одно «да», которое вам ничего не стоит, — и подарите его свободно."
  },
  "invisibility": {
    "name": "Комплекс невидимости",
    "belief": "Я никому не принадлежу; я смотрю на жизнь через стекло.",
    "experiment": "Озвучьте одну свою позицию вслух — без повода, человеку, рядом с которым безопасно."
  },
  "vigilance": {
    "name": "Комплекс бдительности",
    "belief": "Опасность всегда рядом; нельзя расслабляться.",
    "experiment": "Поставьте пятиминутный таймер в безопасном месте и опускайте плечи, пока он не прозвенит."
  },
  "unlovability": {
    "name": "Комплекс нелюбимости",
    "belief": "Мои потребности — обуза; любовь нужно заслужить жертвой.",
    "experiment": "Попросите одну мелочь для себя и примите её, не возвращая долг."
  },
  "betrayal": {
    "name": "Комплекс предательства",
    "belief": "Людям нельзя доверять; подпустить кого-то — значит пострадать.",
    "experiment": "Поделитесь одной маленькой правдой с безопасным человеком — и позвольте ей остаться у него."
  }
};

export const CONSTELLATION_POLARIZATION_NAME_RU: Record<string, string> = {
  "Grind–Collapse Cycle": "Цикл «измор — отключка»",
  "Compliance–Explosion Cycle": "Цикл «подчинение — взрыв»",
  "Clampdown–Breakout Cycle": "Цикл «зажим — побег»",
  "Freeze–Perform Split": "Раскол «заморозка — представление»",
  "Shame–Display Split": "Раскол «стыд — витрина»",
  "White-Knuckle–Checkout Cycle": "Цикл «на кулаках — в отключку»",
  "Cave–Stage Split": "Раскол «пещера — сцена»",
  "Halo–Havoc Cycle": "Цикл «нимб — разгром»"
};

// ── UNIVERSE PART COPY ─── per-part RU descriptions for the 3D universe (moved from src/services/universe-state.service.ts) ──
// RU-only — no EN twin exists in the original file.

export interface PartUniverseCopy {
  description: string;
  coreBelief: string;
  invitation: string;
  quality?: string;
  shadow: string;
  wound?: string;
  attracts: string;
}

export const UNIVERSE_PART_COPY: Record<string, PartUniverseCopy> = {
  // managers
  taskmaster: {
    description: 'Заранее раскладывает день по задачам и держит всё под контролем, чтобы неприятности не застали врасплох.',
    coreBelief: 'Пока я выполняю и контролирую дела, всё идёт как надо.',
    invitation: 'Разрешить себе одну спокойную паузу и спросить, что для вас важнее скорости.',
    quality: 'Дисциплина и доведение дел до конца.',
    shadow: 'Отдых воспринимается как потеря времени, а усталость скрывается до последнего.',
    wound: 'Боится, что без пользы и результатов его не будут ценить.',
    attracts: 'Людей и задачи, где ценят надёжность и результат.',
  },
  inner_critic: {
    description: 'Заранее подмечает ошибки и слабые места, чтобы вас никто не раскритиковал со стороны.',
    coreBelief: 'Если я буду строг(а), вы не ошибётесь и вас не отвергнут.',
    invitation: 'Спросить его, чего он опасается, и поблагодарить за заботу.',
    quality: 'Требовательность и внимание к деталям.',
    shadow: 'Любое усилие обесценивается, и остаётся чувство, что вы всегда недостаточно хороши.',
    wound: 'Запомнил моменты, когда ошибки стоили любви и одобрения.',
    attracts: 'Задачи, где важны точность и высокое качество.',
  },
  pleaser: {
    description: 'Предвосхищает чужие желания и заранее сглаживает конфликты до того, как они начнутся.',
    coreBelief: 'Меня примут, только пока я удобен(на).',
    invitation: 'Один раз сказать честное «нет» и заметить, что отношения это выдержали.',
    quality: 'Чуткость к настроению и потребностям людей.',
    shadow: 'Собственные потребности откладываются так надолго, что перестают замечаться.',
    wound: 'Усвоил, что любовь нужно заслуживать удобством.',
    attracts: 'Людей, которым нужна поддержка и внимание.',
  },
  controller: {
    description: 'Продумывает сценарии заранее и держит рычаги управления в своих руках.',
    coreBelief: 'Если я всё предусмотрю, ничего плохого не случится.',
    invitation: 'Доверить кому-то часть дел и выдержать небольшую неопределённость.',
    quality: 'Холодная голова и готовность к любому развитию событий.',
    shadow: 'Близким не хватает воздуха, а доверие заменяется инструкциями.',
    wound: 'Живёт с ощущением, что одна ошибка в планировании обернётся катастрофой.',
    attracts: 'Ситуации, где нужен порядок и ясные правила.',
  },
  analyst: {
    description: 'Раскладывает переживания по полочкам и изучает их с безопасного расстояния.',
    coreBelief: 'Пока я понимаю происходящее, я в безопасности.',
    invitation: 'Назвать чувство одним словом до того, как объяснять его причины.',
    quality: 'Ясное мышление и умение замечать закономерности.',
    shadow: 'Понимание уходит в бесконечный анализ, а сами чувства остаются в стороне.',
    wound: 'Когда-то понять происходящее было единственным способом почувствовать опору.',
    attracts: 'Сложные вопросы без готовых ответов.',
  },
  hermit: {
    description: 'Сокращает контакты до минимума и бережёт покой, пока мир не станет безопаснее.',
    coreBelief: 'Наедине с собой меня хотя бы никто не ранит.',
    invitation: 'Выбрать одного человека и сделать маленький шаг навстречу.',
    quality: 'Умение быть с собой и ценить тишину.',
    shadow: 'Расстояние до людей растёт, и близость начинает пугать.',
    wound: 'Помнит, что близость стоила слишком много сил или боли.',
    attracts: 'Тишину, уединённые занятия и спокойных людей.',
  },
  bypasser: {
    description: 'Быстро переключает внимание на приятное, чтобы тяжёлое осталось позади.',
    coreBelief: 'Если не задерживаться на плохом, оно пройдёт само.',
    invitation: 'Дать трудному чувству одну минуту честного внимания.',
    quality: 'Лёгкость и умение вывести ситуацию из тяжёлого настроения.',
    shadow: 'Нерешённые вопросы накапливаются и возвращаются в самый неподходящий момент.',
    wound: 'Когда-то тяжесть была настолько велика, что спасало только переключение.',
    attracts: 'Лёгкие разговоры и приятные поводы отвлечься.',
  },
  // firefighters
  numb: {
    description: 'Когда боль подступает слишком близко, выключает чувствительность.',
    coreBelief: 'Если перестать чувствовать, станет терпимо.',
    invitation: 'Раз в день тихо спрашивать себя, что я чувствую на самом деле.',
    quality: 'Способность действовать там, где выносить чувства невозможно.',
    shadow: 'Вместе с болью притупляются радость и желания.',
    wound: 'Вынес столько, что чувствительность пришлось отключить.',
    attracts: 'Ситуации, где можно остаться в стороне от сильных эмоций.',
  },
  rebel: {
    description: 'Вспыхивает против правил и давления, как только чувствует попытку подчинить.',
    coreBelief: 'Любое правило пытается меня переделать.',
    invitation: 'Выбрать правило, которое служит его собственной цели.',
    quality: 'Смелость идти против общего мнения.',
    shadow: 'Ломает планы и отношения, которые на самом деле важны.',
    wound: 'Помнит, что свободу приходилось отвоёвывать.',
    attracts: 'Ситуации с жёсткими правилами и авторитетами.',
  },
  charmer: {
    description: 'Включает обаяние на полную, когда чувствует, что теряет внимание или расположение.',
    coreBelief: 'Пока я нравлюсь, меня не отвергнут.',
    invitation: 'Показать одному человеку что-то неотшлифованное и настоящее.',
    quality: 'Лёгкость в общении и умение разрядить напряжение.',
    shadow: 'Представление требует всё больше сил, а настоящая близость так и не начинается.',
    wound: 'Уверен, что без яркой подачи интереса к нему будет мало.',
    attracts: 'Внимание, восхищение и тёплые компании.',
  },
  // exiles
  abandoned: {
    description: 'Хранит память о моментах, когда поддержка была нужна больше всего, а рядом никого не оказалось.',
    coreBelief: 'Те, кого я люблю, в конце концов уходят.',
    invitation: 'Побыть рядом с ним и не торопить доверие.',
    quality: 'Способность к глубокой привязанности.',
    shadow: 'Страх потери заставляет цепляться или уходить первым.',
    wound: 'Одиночество в самый трудный час.',
    attracts: 'Отношения, где тепло нужно постоянно подтверждать.',
  },
  ashamed: {
    description: 'Несёт ощущение, что с ним что-то не так, и старается занимать как можно меньше места.',
    coreBelief: 'Если меня увидят по-настоящему, меня отвергнут.',
    invitation: 'Показать одному безопасному человеку что-то незаконченное и настоящее.',
    quality: 'Внимательность к людям и словам.',
    shadow: 'Целые области жизни прячутся даже от близких.',
    wound: 'Опыт, когда его видели только с плохой стороны.',
    attracts: 'Взгляды и оценки, которые легко принять на свой счёт.',
  },
  frightened: {
    description: 'Замечает угрозу там, где другие видят обычные вещи.',
    coreBelief: 'Опасность всегда может оказаться рядом.',
    invitation: 'Сделать один маленький шаг в пугающее и вернуться в безопасное место.',
    quality: 'Способность замечать опасность раньше других.',
    shadow: 'Жизнь сужается до самого безопасного маршрута.',
    wound: 'Ранний опыт, когда мир был непредсказуемым.',
    attracts: 'Перемены и неожиданные новости.',
  },
  unseen: {
    description: 'Привык оставаться в тени и не ждать к себе интереса.',
    coreBelief: 'Меня всё равно не заметят.',
    invitation: 'Сказать в группе одно честное предложение и дать ему прозвучать.',
    quality: 'Наблюдательность и внимание к другим.',
    shadow: 'Таланты остаются в тени, а присутствие проходит незамеченным.',
    wound: 'Опыт, когда его присутствие не имело значения.',
    attracts: 'Компании, в которых легко остаться незамеченным.',
  },
  // resources
  sage: {
    description: 'Смотрит на ситуацию спокойно и видит её целиком.',
    coreBelief: 'Ответы на большинство вопросов уже есть внутри меня.',
    invitation: 'Перед трудным решением спросить его, что здесь важнее всего.',
    quality: 'Спокойствие и широта взгляда.',
    shadow: 'Иногда объясняет чувства вместо того, чтобы просто побыть рядом.',
    attracts: 'Спокойные и глубокие разговоры.',
  },
  warrior: {
    description: 'Чётко определяет границы и защищает то, что важно.',
    coreBelief: 'Я могу за себя постоять.',
    invitation: 'Сказать тёплое и твёрдое «нет» одному человеку.',
    quality: 'Решительность и верность своим границам.',
    shadow: 'Иногда переходит в атаку там, где хватило бы простого отказа.',
    attracts: 'Честные договорённости и прямые разговоры.',
  },
  caregiver: {
    description: 'Замечает чужие потребности и даёт тепло, не ведя счёта.',
    coreBelief: 'Забота делает отношения настоящими.',
    invitation: 'Подарить один час такой же заботы себе.',
    quality: 'Щедрость и умение поддержать.',
    shadow: 'Собственные потребности остаются на последнем месте.',
    attracts: 'Людей, которым нужна забота и участие.',
  },
  explorer: {
    description: 'Тянется к новому и спокойно относится к незнакомым маршрутам.',
    coreBelief: 'Новое всегда даёт больше, чем привычное.',
    invitation: 'Выбрать одно незнакомое дело и попробовать его просто так.',
    quality: 'Любопытство и готовность пробовать.',
    shadow: 'Бросает начатое, как только исчезает новизна.',
    attracts: 'Новые места, идеи и людей.',
  },
};
// ── TRANSLATIONS ── Translation keys, en + ru (moved from src/i18n/translations.ts) ──
// ru mirrors en key-for-key. Some values are functions (template interpolation).

export const TRANSLATIONS = {
  en: {
    loading: 'Loading...',
    intro: {
      heroTitlePart1: 'Discover the ',
      heroTitlePart2: ' of your Relational Dynamics.',
      heroUnderline: 'Archetypal Map',
      heroSubtitle: 'Meet everyone you are \u2014 or dive straight into the universe.',
      beginAssessment: 'Begin Assessment',
      exploreUniverse: 'Explore Universe',
      relationalCartography: 'Relational Cartography',
      archetypeStudio: 'Archetype Studio',
      uploadBackup: 'Upload Backup'
    },
    assessment: {
      previous: 'Previous',
      cancel: 'Cancel',
      stronglyDisagree: 'Strongly Disagree',
      stronglyAgree: 'Strongly Agree',
      reflectAndChoose: 'Reflect & Choose',
      finalInsight: 'Final Insight',
      questions: {
        agency: {
          title: 'Agency Spectrum',
          q1: 'I naturally take charge in group situations',
          q2: 'I prefer to make decisions rather than wait for others',
          q3: 'I feel uncomfortable when I\'m not in control of outcomes',
          q4: 'I initiate most plans and activities in my relationships',
          q5: 'I speak up quickly when I have an opinion',
          q6: 'I enjoy being the one who directs projects or activities',
          q7: 'I prefer to let situations unfold rather than direct them',
          q8: 'I enjoy following others\' lead when they have clear vision',
          q9: 'I\'m better at responding to others\' initiatives than starting my own',
          q10: 'I trust that things will work out without my direct intervention',
          q11: 'I often wait to see what others want before expressing my preferences',
          q12: 'I feel comfortable letting others take the lead in most situations'
        },
        temperature: {
          title: 'Emotional Temperature',
          q1: 'My emotions feel intense and vivid to me',
          q2: 'People describe me as passionate or emotionally expressive',
          q3: 'I cry easily during emotional moments in movies or life',
          q4: 'I experience emotions as powerful physical sensations',
          q5: 'I express my feelings openly and visibly',
          q6: 'I get emotionally invested in stories, causes, or relationships',
          q7: 'I prefer to keep a calm, steady demeanor in most situations',
          q8: 'I make decisions based more on logic than feelings',
          q9: 'I rarely get visibly angry or upset in public',
          q10: 'I maintain emotional composure even in stressful situations',
          q11: 'I process my emotions internally before expressing them',
          q12: 'I value rational thinking over emotional expression'
        },
        focus: {
          title: 'Relational Focus',
          q1: 'I often prioritize others\' needs over my own',
          q2: 'I derive satisfaction from helping and supporting others',
          q3: 'I feel anxious when I disappoint someone',
          q4: 'I naturally notice and respond to others\' emotional states',
          q5: 'I adapt my schedule to accommodate others\' needs',
          q6: 'I feel responsible for other people\'s happiness',
          q7: 'I need significant alone time to recharge and feel balanced',
          q8: 'My personal goals and projects are very important to me',
          q9: 'I\'m comfortable putting my needs first when necessary',
          q10: 'I protect my independence and autonomy in relationships',
          q11: 'I make decisions based on what\'s best for my well-being',
          q12: 'I maintain clear boundaries around my time and energy'
        },
        attachment: {
          title: 'Attachment Strategy',
          q1: 'I worry that my partners will leave me',
          q2: 'I need frequent reassurance that I\'m loved and valued',
          q3: 'I sometimes test my partners\' commitment',
          q4: 'I get anxious when partners don\'t respond to messages quickly',
          q5: 'I replay conversations looking for signs of rejection',
          q6: 'I idealize my partners, especially in the beginning',
          q7: 'I have trouble concentrating when I feel insecure in a relationship',
          q8: 'I fear being alone more than being in a difficult relationship',
          q9: 'I feel smothered when relationships get too close',
          q10: 'I prefer relationships with plenty of space and independence',
          q11: 'I avoid making long-term relationship plans',
          q12: 'I feel relief when relationships end, even good ones',
          q13: 'I keep some emotional distance as protection',
          q14: 'I notice flaws in partners that make me pull away',
          q15: 'I value my independence above most relationship needs',
          q16: 'I feel uncomfortable with too much emotional intimacy'
        },
        healthy: {
          title: 'Healthy Relational Patterns',
          q1: 'I can be both strong and vulnerable depending on what\'s authentic',
          q2: 'I take responsibility for my part in relationship dynamics',
          q3: 'I can acknowledge my difficult emotions without being overwhelmed',
          q4: 'I approach my relationship patterns with curiosity and without judgment',
          q5: 'I can set boundaries while still being caring and connected',
          q6: 'I feel comfortable both giving and receiving support',
          q7: 'I can adapt my approach based on what different situations require',
          q8: 'I maintain my sense of self while being close to others',
          q9: 'I communicate my needs clearly without demanding or withdrawing',
          q10: 'I can sit with relationship uncertainty without panicking or fleeing',
          q11: 'I learn from past relationship patterns and make different choices',
          q12: 'I feel fundamentally worthy of love regardless of relationship status'
        }
      },
      results: {
        title: 'Your Relational Fingerprint',
        description: 'This analysis, generated by AI, reflects your unique patterns in relational space. Use it as a map for curiosity and growth, and hold its conclusions lightly.',
        viewUniverse: 'View My Universe',
        analyzing: 'Analyzing your results...',
        eyebrow: 'YOUR RELATIONAL FINGERPRINT',
        verdictTitle: 'The Verdict',
        signatureLabel: 'Dimensional Signature',
        balanced: 'Centered',
        balancedProfile: 'Centered profile — your responses reflect an undifferentiated relational pattern with no strong pole tendencies.',
        loadingMessage: 'Synthesizing your psychic topology...',
        loadingHint: 'This usually takes 10–30s. You can cancel and use the local analysis.',
        cancelAnalysis: 'Cancel & use local analysis',
        analysisCancelled: 'Analysis cancelled. The local analysis is shown below.',
        degradedBannerTitle: 'AI enrichment unavailable',
        degradedBannerBody: 'The full AI-written narrative is temporarily unavailable. Your archetypes, profile, and all indicators below are still accurate — only the descriptive text is the local fallback. You can retry to get the full version.',
        retryNarrative: 'Retry full narrative',
        errorTitle: 'Calculation Error',
        unknownError: 'An unknown error occurred.',
        pantheonTitle: 'Everyone inside you',
        pantheonSubtitle: 'Archetypes resonating with your current state',
        enterUniverse: 'Enter the Universe',
        retake: 'Retake Assessment',
        backToIntro: 'Back to Intro',
        // Specialist (read-only) view: when an admin opens a client's
        // report, these strings replace the personal-only CTAs.
        specialistViewBadge: 'Viewing as specialist (read-only)',
        specialistViewClient: 'Client:',
        specialistViewNoClient: 'Anonymous client',
        highDemand: 'The Oracle is currently experiencing high global demand. Please wait a moment and try again.',
        downloadBackup: 'Download Backup',
        scoringPrecise: 'Deterministic',
        scoringCreative: 'Fallback AI',
        scoringDeterministic: 'Deterministic',
        scoringFallback: 'Fallback AI',
        scoringDeterministicTooltip: 'Switch to fallback AI mode',
        scoringFallbackTooltip: 'Switch to deterministic mode',
        dynamicsLabel: 'Inner System Dynamics',
        poleScoresTitle: 'Pole Scores',
        agencyActive: 'Active',
        agencyReceptive: 'Receptive',
        tempHot: 'Expressive',
        tempCool: 'Composed',
        focusOther: 'Empathic',
        focusSelf: 'Pragmatic',
        attAnxious: 'Anxious',
        attAvoidant: 'Avoidant',
        healthScore: 'Health',
        disorganizedFlag: 'Disorganized',
        complexesTitle: 'Active Complexes',
        defenseTitle: 'Defense Hierarchy',
        escalationLabel: 'Escalation Paths',
        triggerMapTitle: 'Trigger Map',
        pathwayTitle: 'The path to wholeness',
        diagnosticsTitle: 'Diagnostic Indicators',
        clinicalExport: 'Clinical Report',
        dissociationLabel: 'Dissociation',
        regulationLabel: 'Regulation',
        boundaryLabel: 'Boundaries',
        coherenceLabel: 'Coherence',
        // Section labels for results panel navigation
        sectionHero: 'Connection',
        sectionProfile: 'Dimensional Profile',
        sectionSignature: 'Dimensional Profile',
        sectionSpectrum: 'Pole Scores',
        sectionPantheon: 'Pantheon',
        sectionDynamics: 'System Dynamics',
        sectionComplexes: 'Complexes',
        sectionDefense: 'Defense Hierarchy',
        sectionTriggers: 'Trigger Map',
        sectionPathway: 'The path to wholeness',
        sectionDiagnostics: 'Diagnostics',
        // Section 1 dimensional profile table headers
        axisHeader: 'Axis',
        poleHeader: 'Pole',
        intensityHeader: 'Intensity',
        valueHeader: 'Value'
      }
    },
    landing: {
      // Navbar
      navProblem: 'Why this', navMatrix: 'How they fit', navCodex: 'All stars', navEngine: 'Map',
      navDashboard: 'Dashboard', navLogout: 'Logout', navLogin: 'Login',
      navTherapist: 'Therapist',
      dockHome: 'Home', dockCodex: 'All stars', dockMatrix: 'How they fit', dockEngine: 'Map',
      // app-stage revamp ("inner verse.html" reference)
      dockBase: 'Base', dockSky: 'Sky', dockYou: 'You',
      welcomeKicker: 'get to know yourself better',
      welcomeH1a: 'Inside you —', welcomeH1b: 'a whole universe.',
      welcomePoem: '147 statements, three sittings of about 15 minutes each — and you know the ones inside. Internal Family Systems (IFS): you answer about yourself — the app builds your map.',
      startCta: 'Start exploring',
      returningCta: 'I\u2019ve been here before',
      completedMapCta: 'Open my saved map',
      skyKicker: 'your inner sky', skyTitle: 'YOUR CONSTELLATION', skySub: 'Tap a star to meet them. Tap the center to understand the map.',
      filterAll: 'All', famManagers: 'Managers', famFirefighters: 'Firefighters', famExiles: 'Exiles', famResources: 'Resources',
      codexSegParts: 'Stars', codexSegChem: 'Chemistry lab', codexCrests: 'family crests',
      chemTitle: 'Pair up two stars',
      chemSub: 'Every pair of stars has its own physics. Some are sweet orbits. Some are collision courses.',
      chemPick: 'pick a star', chemRun: 'Run the reaction', chemReport: 'reaction report',
      chemFlow: 'flow', chemSpark: 'spark', chemDrag: 'drag',
      sheetGift: 'gift', sheetCost: 'cost', sheetAxes: 'four axes', sheetPractice: 'tiny practice',
      youBrand: 'YOU', youAboutKicker: 'what this is', youAboutTitle: 'A mirror for self-reflection',
      youAboutBody: 'Innerverse is a playful map of the inner world inspired by Internal Family Systems (IFS). 147 statements, three sittings \u2014 and a living map of your sky: eighteen stars, each with its own character. Your answers stay on this device.',
      statParts: 'stars', statStatements: 'statements', statSittings: 'sittings', statTimeShort: 'to your map',
      youSettings: 'settings', setLanguage: 'Language', setLanguageDesc: 'Russian first, English second',
      setTheme: 'Night mode', setThemeDesc: 'The sky after dark',
      youShare: 'Share Innerverse', shareCopied: 'Copied! Paste it anywhere.',
      youReport: 'My report', youCheckin: 'Daily check-in', youPractice: 'Daily practice', youSynastry: 'Synastry',
      youLockedHint: 'unlocked after your first completed run', youCoach: 'AI coach', youSubscribe: 'Innerverse subscription',
      editTitle: 'Customize the part', editTitleNew: 'Your own part',
      editShape: 'Shape', editColor: 'Color', editEyes: 'Eyes', editMouth: 'Mouth',
      editNameRu: 'Name (Russian)', editNameEn: 'Name (English)', editFamily: 'Family',
      editSave: 'Save', editReset: 'Reset to default', editDelete: 'Delete part', editCancel: 'Cancel',
      editAddCard: '＋ your own part', customNote: 'This is your own custom part.',
      famManagerOpt: 'Manager', famFirefighterOpt: 'Firefighter', famExileOpt: 'Exile', famResourceOpt: 'Resource',
      youUniverse: 'My universe', youCabinet: 'Personal cabinet', youSignIn: 'Sign in', youLogout: 'Sign out',
      youRestore: 'Restore from backup file',
      youEthics: 'Innerverse is an IFS-inspired map. For diagnosis or therapy, see a human. Your data never leaves this device without your action.',
      startTest: 'Start Test \u2726',
      quickScanCta: 'Meet one part in 90 seconds',
      // Hero
      liveBadge: 'Now', heroBadge: '147 Statements \u00B7 IFS-Grounded',
      heroTitleLine1: 'Meet the', heroTitleEmphasis: 'constellation', heroTitleLine2: 'inside you.',
      heroSubtitle: 'meet everyone you are. One sky, real measurement \u2014 three sittings of 49 statements, grounded in Internal Family Systems: a tool for gentle self-reflection.',
      beginTest: '\u2726 Begin the Test', exploreMatrix: 'Explore Matrix',
      statArchetypes: '18 Inner Parts', statAxes: '147 Statements', statTime: '~25m', statTimeLabel: 'To Your Map',
      // Marquee
      marqueeWord1: 'See your patterns', marqueeWord2: 'Break the usual circle', marqueeWord3: 'Get to know yourself', marqueeWord4: 'Untangle the confusion', marqueeWord5: 'How your relationships work',
      // Problem
      problemLabel: 'A familiar pattern', problemTitle: 'Why does this keep repeating?',
      problemSubtitle: 'The same loops. The same friction. The same missed connections. It\'s not a curse\u2014it\'s geometry.',
      painTitle1: 'The Ghosting Loop', painText1: 'You attract Wanderers while acting as an Anchor. Physics dictates they drift away.',
      painTitle2: 'Catalyst Collision', painText2: 'Two Catalysts equals fire. Brilliant for startups. Catastrophic for execution.',
      painTitle3: 'Everyone agrees on everything', painText3: 'You are surrounded only by people who agree with you. Nobody offers anything new. That unanimity can quietly suffocate.',
      painTitle4: 'Invisible Triggers', painText4: 'Conflict flares and you don\'t know why. Unread signals detonate before you react.',
      painTitle5: 'Compassion Fatigue', painText5: 'The Anchor carries everyone and exhausts themselves. The system never replenishes them.',
      painTitle6: 'Asymmetric Orbit', painText6: 'One invests intensely; the other holds loosely. The imbalance is structural.',
      // Synergy
      synergyLabel: 'The Tool', synergyTitle: 'How parts fit together',
      synergySubtitle: 'Not all shapes fit together gracefully. Select two nodes to calculate their relational physics.',
      synSelectTwo: 'Select Two Nodes', synFriction: 'Friction',
      synAwaiting: 'Awaiting Input', synAwaitingDesc: 'Select two archetypes above to compute dynamic friction.',
      synAwaitingSecond: 'Awaiting Second Node', synAwaitingSecondDesc: 'Select another archetype to compute connection physics.',
      synResult: 'Result',
      synEcho: 'Echoes of each other \u{1FA9E}', synEchoDesc: 'Very similar archetypes. Lots of understanding, little new. The group stalls on agreement.',
      synTension: 'Living tension \u26A1', synTensionDesc: 'Fast growth with a foothold in reality. Works well as long as you stay in contact.',
      synComplex: 'A tricky mix \u{1F300}', synComplexDesc: 'Friction stores energy for growth. Handle each other\'s boundaries with care.',
      // Features
      featuresLabel: 'Capabilities', featuresTitle: 'Everything you need to decode connection.',
      feat1Title: 'Interactive 3D Map', feat1Desc: 'Orbit, zoom, and click your way through a living relational cosmos.<br>Every node is a story.',
      feat2Title: 'AI helps you find patterns', feat2Desc: 'It notices what is hard to see in yourself.',
      feat3Title: 'Four-Axis Analysis', feat3Desc: 'Agency, Temperature, Focus, and Attachment\u2014measured precisely.',
      feat4Title: 'Detailed reports', feat4Desc: 'File export. In-depth AI write-ups. A detailed profile you can show a specialist.',
      // Codex
      codexBrand: 'CODEX', codexLabel: 'All your stars', codexTitle: 'Eighteen stars.', codexTitleLine2: 'Endless combinations.',
      codexSubtitle: 'Drag to explore the catalog. Click to flip and reveal.',
      codexSwipe: '\u2190 Swipe to browse \u2192',
      statAgency: 'Agency', statTemperature: 'Temperature', statFocus: 'Focus', statAttachment: 'Attachment',
      // Engine
      engineLabel: 'The Engine', engineTitle: 'Your relational universe,', engineTitleEmphasis: 'made visible.',
      engineSubtitle: 'Drag to orbit. Real-time 3D physics rendering of the archetype network.',
      enginePause: 'Pause', enginePlay: 'Play', engineDrag: 'Drag to Orbit', engineLive: 'Live Render',
      // Method
      methodTitle: 'Three steps to clarity.',
      step1Title: 'Take the Test', step1Desc: 'Answer 147 statements across three sittings — built on real measurement. Your progress is kept if you pause.',
      step2Title: 'The Engine Measures', step2Desc: 'Your answers become a map: who in you is louder, who is quieter, who takes the wheel more often. The same answers always yield the same map.',
      step3Title: 'Read the Map', step3Desc: 'Explore your living constellation. Meet your parts, your storylines, and your practice path.',
      // Footer
      footerTitle: 'Discover your', footerTitleEmphasis: 'universe.', footerChip: 'Free & confidential', installAppCta: 'Install the app',
      footerSubtitle: 'Take the test in 10 minutes and receive a personal map of your relational dynamics. Free and confidential.',
      uploadBackup: 'Upload Backup',
      downloadNoticeTitle: 'Important Note',
      downloadNoticeDesc: 'Your answers stay on this device. The full battery is three sittings of 49 statements \u2014 pause after any sitting and your progress is kept. A backup can be downloaded from the dashboard at any time.',
      restoreBackup: 'Restore Last Assessment',
      resumeInProgress: 'Resume test in progress',
      resumeInProgressXofY: '{{count}} of {{total}} answered',
      // Archetypes
      archWanderer: 'The Wanderer', archWandererType: 'Seeker', archWandererDesc: 'Drifts through social constellations absorbing context without altering it. The eternal observer.',
      archCatalyst: 'The Catalyst', archCatalystType: 'Disruptor', archCatalystDesc: 'Sparks sudden paradigm shifts in group dynamics. Highly volatile, deeply transformative.',
      archAnchor: 'The Anchor', archAnchorType: 'Stabilizer', archAnchorDesc: 'Provides emotional gravity. Creates the still center around which others orbit.',
      archSage: 'The Sage', archSageType: 'Oracle', archSageDesc: 'Observes from altitude. Synthesizes disparate information into wisdom.',
      archWeaver: 'The Weaver', archWeaverType: 'Connector', archWeaverDesc: 'Silently ties disparate nodes together. The invisible architect of connection.',
      archMirror: 'The Mirror', archMirrorType: 'Reflector', archMirrorDesc: 'Returns exactly the energy received. A perfect diagnostic tool for any relationship.',
      archHerald: 'The Herald', archHeraldType: 'Messenger', archHeraldDesc: 'Carries information across boundaries between groups. Operates at the edges.',
      archGuardian: 'The Guardian', archGuardianType: 'Protector', archGuardianDesc: 'Creates the container within which others can be vulnerable. The shield-bearer.'
    },
    universe: {
      title: 'Archetypal Universe',
      backToMenu: 'Back to Menu',
      searchPlaceholder: 'Search archetypes...',
      filters: 'Exploration Filters',
      noArchetypes: 'No archetypes found.',
      loadingPhrases: {
        calibrating: 'Catching starlight...',
        polishing: 'Wiping the telescope lens...',
        teaching: 'The constellations are rehearsing...',
        unfolding: 'Unfolding the star map...',
        reticulating: 'Reticulating emotional splines...',
        waking: 'The sky is waking up...'
      },
      aiCreation: 'Create with AI',
      archetypePlaceholder: 'Describe an archetype...',
      generate: 'Generate',
      creating: 'Creating...',
      compare: 'Compare',
      close: 'Close',
      aiCoach: 'AI Coach',
      askPlaceholder: 'Ask a question...',
      summon: 'Summon',
      suggestions: 'Suggestions',
      help: 'Help',
      helpTitle: 'Welcome to the Archetypal Universe',
      helpDesc: 'Each sphere here is an archetype: one way of being yourself in relationships. The closer two spheres sit, the closer their meaning.',
      help1Title: 'Navigation:',
      help1Desc: 'Pan, Zoom, and Rotate the universe with your mouse or trackpad.',
      help2Title: 'Exploration:',
      help2Desc: 'Hover over an archetype to see its name. Click to view its detailed profile.',
      help3Title: 'Filtering:',
      help3Desc: 'Use the Exploration Filters panel to explore the universe by cluster or dimensional expression.',
      help4Title: 'AI Coach:',
      help4Desc: 'The AI Coach is your guide. Ask it anything about the archetypes, their relationships, or the underlying concepts.',
      help5Title: 'Spheres and stars:',
      help5Desc: 'Each sphere is a recognizable image: this is how a person looks when this side of them is strongest. Your stars are your habitual paths — in a familiar situation you are drawn there again and again.',
      help6Title: 'Four dimensions:',
      help6Desc: 'A sphere\u2019s place is set by four scales — Initiative, Emotion, Focus, and Closeness & Distance. Each runs between two poles (for example, pragmatic \u2194 empathic); the closer a sphere sits to a pole, the stronger that quality.',
      help7Title: 'Clusters:',
      help7Desc: 'Managers keep order in advance so the bad day never arrives; Firefighters rush in the moment something inside catches fire; Exiles carry the young pain hidden from daily life; Resources are grown strengths the Self can lean on.',
      helpFooter: 'This universe is a map of the territory, and you are its explorer. Use it to cultivate self-awareness and compassion for the complex, beautiful ways we relate to ourselves and others.',
      sceneReadyTimeout: 'The universe took too long to stabilize. Please try again.',
      sceneInitFailed: 'The universe could not initialize.',
      canvasMissing: 'The universe canvas is missing.',
      universeInitFailed: 'Failed to load the universe. Please refresh the page.',
      universeErrorTitle: 'Universe Error',
      analysisTimeout: 'The AI analysis is taking too long. Please try again.',
      analysisCancelled: 'Analysis cancelled.',
      aiUnavailable: 'The AI service is not available right now.',
      creatorEmptyResponse: 'The AI creator returned an empty response.',
      creatorUnavailable: 'The AI creator is not available right now.',
      creatorInvalidFormat: 'The AI creator returned an invalid data format.',
      analystEmptyResponse: 'The AI analyst returned an empty response.',
      backupInvalidFormat: 'Invalid backup file format. Could not find assessment responses in the file.',
      backupIncomplete: 'Uploaded backup is incomplete. Please upload a completed assessment backup.',
      backupParseFailed: 'Failed to parse backup data. Check the file format and try again.',
      coachEmptyResponse: 'Empty response from AI',
      coachUnknownError: 'Unknown error',
      partsEmptyResponse: 'The parts dialogue returned an empty response. Please try again.',
      partsUnknownError: 'Unknown error',
      fallbackPath: 'To discover your path',
      unknownValue: 'Unknown',
      retry: 'Retry',
      dismiss: 'Dismiss',
      retryUniverse: 'Try Universe Again',
      selectSecondArchetype: 'Select a second archetype in the universe to compare.',
      aiCoachWelcome: 'Hello! I am your guide to this universe. Ask me anything \u2014 parts, dimensions, archetypes.',
      coachComparing: 'You are comparing **{archetype1}** and **{archetype2}**. What would you like to explore about their dynamic?',
      coachExploring: 'You are exploring **{archetype1}**. Who would you like to compare it with? You can also ask me about it directly.',
      coachSelected: 'Hello! I am your Archetype Coach. How can I help you explore **{archetype1}**?',
      coachError: 'Sorry, I encountered an issue. {error}',
      analystSystemInstruction: 'You are a world-class psychotherapist specializing in Jungian psychology, relational dynamics, and archetypal systems. Your task is to provide a deep, insightful, and compassionate analysis of a user\'s self-assessment and generate a "Personal Pantheon" of archetypes that represents their unique relational fingerprint.',
      coachSystemInstruction: 'You are a wise, insightful, and compassionate Archetype Coach. Your tone is gentle, encouraging, and profound. You are an expert in relational dynamics, psychology, and shadow work.',
      // Appended to coachSystemInstruction when the user toggles the
      // persona to Parts Dialogue. IFS-aware overlay — listens for
      // parts, invites noticing rather than labelling.
      partsModeSystemInstruction: 'PARTS DIALOGUE MODE: You are operating in Internal Family Systems awareness. When the user mentions inner figures, emotional patterns, self-criticism, or protective reactions, treat those as IFS parts. Approach them with warmth, curiosity, and unconditional positive regard. Invite the user to notice a part\'s feelings, body sensations, age, role, and intentions — never label or diagnose. Use open-ended invitations such as "How does this part feel toward you?" or "What is this part afraid would happen if it stepped back?". Keep replies brief and oriented toward self-discovery rather than fixing or advising.',
      dimensionalExpression: 'Dimensional Expression',
      clusters: 'Clusters',
      exploration: 'Exploration',
      dimensionsLabel: 'Dimensions',
      archetypeStudio: 'Archetype Studio',
      aiBadge: 'AI',
      relationalHub: 'Explore your inner cosmos',
      relationalGuide: 'Relational Guide',
      filtersBtn: 'Filters',
      closeBtn: 'Close',
      saveBackupTitle: 'Save backup',
      synastryTitle: 'Synastry',
      // Coach mode (badge label — the `partsDialogue` token also lives
      // under `coach` to keep the persona toggle self-contained).
      partsDialogue: 'Parts Dialogue',
      partsDialoguePillAria: 'Parts Dialogue persona',
      partsDialogueExitHint: 'Tap to return to General mode',
      // Synastry panel
      synastry: {
        headerEyebrow: 'BINARY STARS',
        headerTitle: 'The Chemistry of Wounding',
        person1Label: 'Person 1',
        person2Label: 'Person 2',
        tabResonance: 'Resonance',
        tabAttachment: 'Attachment',
        tabShadow: 'Shadow Map',
        tabSystems: 'Inner Systems',
        tabGrowth: 'Growth',
        loadingText: 'Weaving your relational field...',
        // Loading phases
        loadingPhase1: 'Analyzing dimensional resonance...',
        loadingPhase2: 'Mapping shadow patterns...',
        loadingPhase3: 'Computing growth pathways...',
        loadingPhase4: 'Weaving the relational field...',
        // Section labels
        sectionHero: 'Connection',
        sectionSignature: 'Dimensional Profile',
        sectionSpectrum: 'Pole Scores',
        sectionPantheon: 'Pantheon',
        sectionDynamics: 'System Dynamics',
        sectionComplexes: 'Complexes',
        sectionDefense: 'Defense Hierarchy',
        sectionTriggers: 'Trigger Map',
        sectionPathway: 'The path to wholeness',
        sectionDiagnostics: 'Diagnostics',
        sectionScores: 'Scores',
        sectionResonance: 'Resonance',
        sectionAttachment: 'Attachment',
        sectionShadow: 'Shadow',
        sectionSystems: 'Systems',
        sectionGrowth: 'Growth',
        sectionNarrative: 'Description',
        cycleLabel: 'The Cycle',
        deactivationLabel: 'Breaking the Cycle',
        healingLabel: 'Healing:',
        invitationLabel: 'Invitation:',
        shadowLabel: 'Shadow:',
        woundLabel: 'Wound:',
        noProjections: 'No significant shadow projections detected.',
        noDynamics: 'No inner system dynamics detected.',
        polarMapTitle: 'Relational Polarities',
        dyadicTitle: 'Dyadic Analysis',
        emotionalLoad: 'Emotional Load',
        initiationPattern: 'Who usually makes the first move',
        familyRecap: 'Family Recapitulation',
        unconsciousContract: 'Unconscious Contract',
        growthSequenceTitle: 'Growth Sequence',
        regulationLabel: 'Regulation',
        boundaryLabel: 'Boundaries',
        dissociationLabel: 'Dissociation',
        coherenceLabel: 'Coherence',
        boundaryInteraction: 'Boundary Interaction',
        sharedComplexesTitle: 'Shared & Complementary Complexes',
        crossTriggersTitle: 'Cross-Person Trigger Interactions',
        jointPathwayTitle: 'Joint Integration Pathway',
        clinicalExport: 'Clinical Report',
        scoreResonanceDepth: 'Resonance Depth',
        scoreGrowthPotential: 'Growth Potential',
        scoreChallengeLevel: 'Challenge Level',
        scoreSafetyIndex: 'Safety score',
        // Dance patterns
        dancePursueWithdraw: 'One pursues — the other withdraws',
        danceMutualEscalation: 'Mutual Escalation',
        danceDeepFreeze: 'Deep Freeze',
        danceHealingContainer: 'Healing Container',
        danceVolatileBond: 'Volatile Bond',
        danceParallelSovereignty: 'Parallel Sovereignty',
        // Resonance patterns
        resonanceHarmonic: 'In sync',
        resonanceComplementary: 'Complementary',
        resonancePolarized: 'Polarized',
        resonanceDissonant: 'Dissonant',
        // Upload overlay
        uploadTitle: 'Partner Synastry',
        uploadDesc: 'Upload your partner\'s backup file (JSON) to see how compatible you are.',
        uploadButton: 'Upload Partner File',
        uploadWarning: 'Complete your own assessment first to use synastry.',
        shareTitle: 'Share via Code',
        generateCode: 'Generate Code',
        shareCodeConsent: 'Anyone who receives this code and signs in can view this assessment snapshot. Treat it as a private link and share it only with someone you trust.',
        enterCode: 'Partner\'s code',
        loadCode: 'Load',
        orUploadFile: 'Or upload a file',
      },
      // Auth / Save prompt
      savePromptTitle: 'Save Your Results',
      savePromptDesc: 'Sign in to access your results from any device, anytime.',
      signInGoogle: 'Sign in with Google',
      signInEmail: 'Sign in with Email',
      skipSave: 'Continue without saving',
      skipAndDownload: 'Skip & download backup',
      back: 'Back',
      // Login modal (full-page modal with email + Google options)
      loginEmailPlaceholder: 'Email',
      loginPasswordPlaceholder: 'Password (6+ chars)',
      continueWithGoogle: 'Continue with Google',
      signInCta: 'Sign in',
      createAccountCta: 'Create account',
      loginModalTitle: 'Login',
      loginModalBody: 'Sign in to access your cabinet, history, and saved synastries.',
      adminAccessNote: 'Note: Admin access sharing here is a convenience feature. Real security must be enforced via Firebase rules + custom claims.',
      validEmailPasswordRequired: 'Valid email and password (6+ chars) required',
      emailAlreadyInUse: 'Account already exists — use "Sign in"',
      // Anonymous results banner (shown on results page when user is anonymous)
      anonymousSaveBanner: 'Your result is saved to this device. Sign in to access it from any device.',
      anonymousSaveCta: 'Sign in',
      // IFS Part types
      partTypes: {
        manager: 'Protector (Manager)',
        firefighter: 'Reactor (Firefighter)',
        exile: 'Wounded (Exile)',
        self: 'True Self',
      },
      // Developmental origins
      origins: {
        pre_verbal: 'Pre-Verbal (0–2 years)',
        early_attachment: 'Early Attachment (2–4 years)',
        oedipal: 'Oedipal (4–7 years)',
        latency: 'Latency (7–12 years)',
        adolescent: 'Adolescent (12+ years)',
      },
      // Inner System Dynamics
      dynamicsLabel: 'Inner System Dynamics',
      dynamicProtects: 'protects',
      dynamicFirefights: 'takes over for',
      archetypeDetails: {
        name: 'Name',
        wound: 'Vulnerable spot',
        shadow: 'Blind spot',
        invitation: 'Worth trying',
        description: 'Description',
        quality: 'Core Quality',
        coreBelief: 'Core Belief',
        attracts: 'Attracts',
        integratedForm: 'In a more whole form',
        synchronousArchetypes: 'Similar archetypes'
      },
      dimensions: {
        agency: 'Agency',
        temperature: 'Temperature',
        focus: 'Focus',
        attachment: 'Attachment',
        agencyHypo: 'Active',
        agencyHyper: 'Receptive',
        agencyDesc: '<b>Active:</b> Dominant, controlling, projecting outward.<br><b>Receptive:</b> Yielding, absorbing, allowing.',
        temperatureHypo: 'Composed',
        temperatureHyper: 'Expressive',
        temperatureDesc: '<b>Composed:</b> keeps feelings to themselves — steady on the outside, whatever stirs inside.<br><b>Expressive:</b> feelings are visible and audible — responds vividly and shares what moves them.',
        focusHypo: 'Pragmatic',
        focusHyper: 'Empathic',
        focusDesc: '<b>Pragmatic:</b> own goals and boundaries come first.<br><b>Empathic:</b> others\' feelings and needs come first.',
        attachmentHypo: 'Avoidant',
        attachmentHyper: 'Anxious',
        attachmentDesc: '<b>Avoidant:</b> Fears engulfment, creates distance.<br><b>Anxious:</b> Fears abandonment, seeks closeness.'
      },
      clusterNames: {
        gift_archetypes: 'Gift Archetypes',
        control_shadows: 'The Control Shadows',
        emotional_storm_shadows: 'The Emotional Storm Shadows',
        avoidant_intellectual_shadows: 'The Avoidant Intellectual Shadows',
        anxious_connection_shadows: 'The Anxious Connection Shadows',
        seductive_avoidance_shadows: 'The Seductive Avoidance Shadows',
        disorganized_attachment_shadows: 'The Disorganized Attachment Shadows'
      },
      clusterDescs: {
        gift_archetypes: 'Integrated patterns representing psychological wholeness and maturity.',
        control_shadows: 'Shadows rooted in active, cool, self-focused control dynamics.',
        emotional_storm_shadows: 'Shadows characterized by active, hot, self-focused emotional intensity.',
        avoidant_intellectual_shadows: 'Shadows that use receptive, cool, self-focused strategies of withdrawal and analysis.',
        anxious_connection_shadows: 'Shadows driven by receptive, hot, other-focused needs for connection and validation.',
        seductive_avoidance_shadows: 'Shadows that blend receptive, hot, self-focused magnetism with an avoidance of true intimacy.',
        disorganized_attachment_shadows: 'Shadows marked by simultaneous anxious craving and avoidant fear — the most complex attachment pattern, born from caregiving that was simultaneously a source of both comfort and terror.'
      },
      archetypes: {
        the_sovereign: {
          name: 'The Sovereign',
          description: 'Master of context-appropriate expression',
          quality: 'Clarity & Precision',
          invitation: 'To balance clarity with compassion and control with surrender',
          coreBelief: 'I am the source of my experience. My internal state creates my external reality.',
          attracts: 'Other sovereign beings for co-creation and conscious relationship',
          shadow: 'Can become rigid or controlling when threatened'
        },
        the_relational_fluent: {
          name: 'The Relational Fluent',
          description: 'Flows seamlessly between connection and autonomy',
          quality: 'Adaptability & Flow',
          invitation: 'To maintain core self while flowing with relational currents',
          coreBelief: 'Connection and autonomy live in me as one dance. I can move between them with grace.',
          attracts: 'Partners who value both deep intimacy and healthy independence',
          shadow: 'Can lose center in turbulent relationships'
        },
        the_embodied_wisdom: {
          name: 'The Embodied Wisdom',
          description: 'Grounded presence with emotional intelligence',
          quality: 'Grounded Presence & Emotional Intelligence',
          invitation: 'To trust bodily wisdom while maintaining healthy energetic boundaries',
          coreBelief: 'My body is an intelligent guide. True knowing comes from integrating mind, heart, and gut.',
          attracts: 'Those ready for deep, present intimacy beyond surface connection',
          shadow: 'Can become overwhelmed by others\' emotional states'
        },
        the_creative_synthesis: {
          name: 'The Creative Synthesis',
          description: 'Innovates relational patterns from center',
          quality: 'Generative Innovation',
          invitation: 'To balance innovation with appreciation for what already works',
          coreBelief: 'All parts of me are valuable. By integrating my shadows and gifts, I create new possibilities.',
          attracts: 'Collaborators who see challenges as creative opportunities',
          shadow: 'Can over-complicate simple relationships'
        },
        the_tyrant: {
          name: 'The Tyrant',
          wound: 'Hyper-control, cannot receive',
          shadow: 'Domination & Rigidity',
          invitation: 'To release control and learn to receive',
          coreBelief: 'The world is unsafe. I must control everything and everyone to protect myself.',
          attracts: 'Rebels who challenge their power or The Doormat who submit to it',
          integratedForm: 'Tyrant → Guardian → Sovereign'
        },
        the_perfectionist: {
          name: 'The Perfectionist',
          wound: 'Rigid control masking deep insecurity',
          shadow: 'Paralyzing Self-Criticism',
          invitation: 'To embrace \'good enough\' and the beauty of imperfection',
          coreBelief: 'I am only valuable if I am flawless. My mistakes are proof of my unworthiness.',
          attracts: 'Critics who mirror their inner judge, or partners they feel they can \'fix\'',
          integratedForm: 'Perfectionist → Analyst → Creative Synthesis'
        },
        the_guardian: {
          name: 'The Guardian',
          wound: 'Protective but emotionally unavailable',
          shadow: 'Emotional Unavailability',
          invitation: 'To find safety in vulnerability and authentic connection',
          coreBelief: 'Love means protecting others from pain, even if it means walling off my own heart.',
          attracts: 'People who feel unsafe or need rescuing, reinforcing their protector role',
          integratedForm: 'Guardian → Anchor → Sovereign'
        },
        the_sentinel: {
          name: 'The Sentinel',
          wound: 'Over-protects others while remaining emotionally distant',
          shadow: 'Strategic Distance',
          invitation: 'To learn that vulnerability is the gateway to true intimacy',
          coreBelief: 'Confuses protection with love - if I keep everyone safe, I don\'t have to feel my own vulnerability.',
          attracts: 'Partners who need constant protection, validating their defensive posture',
          integratedForm: 'Sentinel → Embodied Wisdom'
        },
        the_tempest: {
          name: 'The Tempest',
          wound: 'Volcanic emotions with intimacy avoidance',
          shadow: 'Reactive Emotionality',
          invitation: 'To find the ground within the storm and respond with intention',
          coreBelief: 'My emotions are overwhelming and dangerous. I must push people away before I destroy them.',
          attracts: 'Calm, avoidant partners they try to provoke, or anxious partners who fuel drama',
          integratedForm: 'Tempest → Wild → Embodied Wisdom'
        },
        the_destroyer: {
          name: 'The Destroyer',
          wound: 'Uncontained emotional fire',
          shadow: 'Uncontrolled Destruction',
          invitation: 'To channel intense energy into creative acts',
          coreBelief: 'If I feel threatened or abandoned, I must burn everything to the ground to regain power.',
          attracts: 'Partners who trigger abandonment wounds, creating self-fulling destruction',
          integratedForm: 'Destroyer → Creative Synthesis'
        },
        the_crusader: {
          name: 'The Crusader',
          wound: 'Fights for causes to avoid intimacy',
          shadow: 'Externalized Purpose',
          invitation: 'To find a cause worthy of passion within one\'s own heart',
          coreBelief: 'Focusing on a grand cause allows me to avoid the terrifying vulnerability of personal intimacy.',
          attracts: 'Followers for their cause, or partners willing to take backseat to mission',
          integratedForm: 'Crusader → Relational Fluent'
        },
        the_rebel: {
          name: 'The Rebel',
          wound: 'Rejects all structure and authority, including healthy boundaries',
          shadow: 'Chronic Opposition',
          invitation: 'To distinguish between oppressive control and healthy structure',
          coreBelief: 'All rules are prisons. If I conform in any way, I lose myself completely.',
          attracts: 'Controllers they can rebel against, or followers who admire their defiance',
          integratedForm: 'Rebel → Creative Synthesis'
        },
        the_ghost: {
          name: 'The Ghost',
          wound: 'Complete emotional withdrawal',
          shadow: 'Radical Unavailability',
          invitation: 'To risk being seen in one\'s true form, even if it feels unsafe',
          coreBelief: 'To be seen is to be annihilated. The only safety is in complete invisibility.',
          attracts: 'Anxious partners who chase them, reinforcing need to disappear',
          integratedForm: 'Ghost → Ice Queen → Oracle'
        },
        the_ice_queen: {
          name: 'The Ice Queen',
          wound: 'Complete emotional shutdown and isolation',
          shadow: 'Frozen Heart',
          invitation: 'To allow the first crack in the ice and feel the warmth of connection',
          coreBelief: 'Feelings are weakness. I built these walls of ice to protect a heart that feels too much.',
          attracts: 'Passionate partners who try to \'melt\' them, confirming emotions are invasive',
          integratedForm: 'Ice Queen → Embodied Wisdom'
        },
        the_analyst: {
          name: 'The Analyst',
          wound: 'Over-analysis prevents authentic experience',
          shadow: 'Detached Observation',
          invitation: 'To step into the river of life — from the bank you only see the surface',
          coreBelief: 'Life is a problem best solved from a safe distance.',
          attracts: 'Emotional partners they can study like fascinating alien species',
          integratedForm: 'Analyst → Sage → Creative Synthesis'
        },
        the_anxious_intellectual: {
          name: 'The Anxious Intellectual',
          wound: 'Over-analysis with fear of being seen',
          shadow: 'Analysis Paralysis',
          invitation: 'To drop from the mind into the feeling body',
          coreBelief: 'If I can just think my way through my feelings, I can avoid the messiness of actually feeling them.',
          attracts: 'Emotional partners they can analyze, or intellectuals avoiding embodiment',
          integratedForm: 'Anxious Intellectual → Embodied Wisdom'
        },
        the_martyr: {
          name: 'The Martyr',
          wound: 'Complete self-abandonment',
          shadow: 'Resentful Self-Sacrifice',
          invitation: 'To honor one\'s own needs as sacred',
          coreBelief: 'My needs don\'t matter. My worth comes from sacrificing myself for others.',
          attracts: 'Narcissists, Tyrants, or \'Takers\' who exploit their generosity',
          integratedForm: 'Martyr → Weaver → Relational Fluent'
        },
        the_people_pleaser: {
          name: 'The People Pleaser',
          wound: 'Seeks validation through constant accommodation',
          shadow: 'Identity Loss',
          invitation: 'To disappoint someone today and survive the experience',
          coreBelief: 'I must agree with everyone and meet their needs to be loved. My true self is unlovable.',
          attracts: 'Demanding partners who take advantage of their lack of boundaries',
          integratedForm: 'People Pleaser → Anchor → Sovereign'
        },
        the_sensitive_soul: {
          name: 'The Sensitive Soul',
          wound: 'Absorbs emotions but fears engulfment',
          shadow: 'Emotional Sponging',
          invitation: 'To build energetic boundaries that honor both self and other',
          coreBelief: 'I feel everything so deeply that I have no skin. Other people\'s emotions overwhelm and define me.',
          attracts: 'Emotionally chaotic partners they absorb, or stoic partners they try to \'open up\'',
          integratedForm: 'Sensitive Soul → Embodied Wisdom'
        },
        the_chameleon: {
          name: 'The Chameleon',
          wound: 'Over-adapts to others, losing core identity',
          shadow: 'Shape-Shifting',
          invitation: 'To discover which relationships survive self-revelation',
          coreBelief: 'My authentic self is unlovable. I must become what others want me to be.',
          attracts: 'Partners with strong personalities who don\'t know the real them',
          integratedForm: 'Chameleon → Relational Fluent'
        },
        the_enchantress: {
          name: 'The Enchantress',
          wound: 'Magnetic attraction with commitment avoidance',
          shadow: 'Seduction & Abandonment',
          invitation: 'To stay and witness the beauty that unfolds after the initial chase',
          coreBelief: 'I can attract anyone, but if they get too close, they will see I am not enough. I must leave first.',
          attracts: 'Partners who love the chase, reinforcing pattern of intense beginnings and abrupt endings',
          integratedForm: 'Enchantress → Siren → Relational Fluent'
        },
        the_black_widow: {
          name: 'The Black Widow',
          wound: 'Uses sexuality as weapon',
          shadow: 'Manipulative Intimacy',
          invitation: 'To discover the power of authentic, non-transactional connection',
          coreBelief: 'Authentic connection is impossible, so I must use seduction and manipulation to get needs met.',
          attracts: 'Partners easily controlled by charm and sexuality, but ultimately disposable',
          integratedForm: 'Black Widow → Sovereign'
        },
        the_trickster: {
          name: 'The Trickster',
          wound: 'Uses humor and chaos to avoid authentic connection',
          shadow: 'Deflective Humor',
          invitation: 'To trust that being authentic won\'t lead to rejection',
          coreBelief: 'If I keep everything light and entertaining, no one will notice how terrified I am of real intimacy.',
          attracts: 'Partners who enjoy the entertainment but never know the real person',
          integratedForm: 'Trickster → Creative Synthesis'
        },
        the_siren: {
          name: 'The Siren',
          wound: 'Creates intense attraction but cannot sustain depth',
          shadow: 'Magnetic Superficiality',
          invitation: 'To discover that true magic lives in sustained intimacy, and initial attraction is only its opening',
          coreBelief: 'My power is in the mystery and the chase. If I let someone truly know me, the magic will disappear.',
          attracts: 'Partners addicted to the high of pursuit but unprepared for real relationship',
          integratedForm: 'Siren → Embodied Wisdom'
        }
      }
    },
    cabinet: {
      // Header
      personalCabinet: 'Personal cabinet',
      yourSpace: 'Your Space',
      yourSpaceSubtitle: 'Tasks, progress, retests, and your saved synastries — all in one place.',
      back: 'Back',
      // Logged-out CTA
      loginPromptTitle: 'Log in to unlock your cabinet',
      loginPromptSubtitle: 'Sign in to see saved history, tasks, and synastry reports.',
      loginCta: 'Login',
      // Quick actions
      quickActions: 'Quick actions',
      seeUniverse: 'See Universe',
      retakeTest: 'Retake test',
      assignedTasks: 'Assigned tasks',
      assignedTasksEmpty: 'Coming soon — your specialist will be able to assign structured tasks here.',
      // History
      progress: 'Progress',
      assessmentHistory: 'Assessment history',
      loading: 'Loading…',
      pickVersion: 'Pick a version',
      pickVersionAria: 'Pick a saved assessment version',
      historyEmpty: 'No history yet. After you save results, retests will appear here.',
      selected: 'Selected',
      downloadVersionBackup: 'Download assessment answers',
      downloadVersionBackupAria: 'Download this version of the assessment answers as a .txt file',
      assignTasks: 'Assign tasks',
      assignTasksBody: 'Assign a task directly on a client row. It stays private to you and helps turn review into action.',
      // Account
      account: 'Account',
      shareWithSpecialist: 'Share with your specialist',
      shareWithSpecialistBody: 'Copy your User ID (UID) or email and share it with the specialist.',
      email: 'Email',
      emailNone: 'None',
      userId: 'User ID (UID)',
      copy: 'Copy',
      copyAccountJson: 'Copy account JSON',
      // Synastries
      pastSynastries: 'Past synastries',
      savedReports: 'Saved reports',
      synastryEmpty: 'No saved synastry reports yet. When you run synastry, the report will show up here.',
      partnerUid: 'Partner UID',
      updated: 'Updated:',
      // Admin
      admin: 'Admin',
      shareAdminAccess: 'Share admin access',
      shareAdminAccessBody: 'Add another admin by email. (Convenience only — enforce security with Firebase rules + custom claims later.)',
      adminEmailPlaceholder: 'Admin email',
      addAdmin: 'Add admin',
      added: 'Added:',
      remove: 'Remove',
      // Admin → My clients (specialist dashboard)
      myClients: 'My clients',
      myClientsBody: 'Clients who shared their User ID (UID) with you. View their latest assessment and keep private notes.',
      addClient: 'Add client',
      addClientByUid: 'Add client by User ID',
      addClientHint: 'Paste the client\'s User ID (UID) below. You can also add their email so it\'s easier to identify them later.',
      clientUidLabel: 'Client User ID (UID)',
      clientUidPlaceholder: 'e.g. aBcD1234XyZ',
      clientEmailLabel: 'Client email (optional)',
      clientEmailPlaceholder: 'client@example.com',
      clientNotesLabel: 'Notes',
      clientNotesPlaceholder: 'Internal notes (only you can see these)…',
      clientTaskLabel: 'Assigned task',
      clientTaskPlaceholder: 'Task for this client (only you can see this)…',
      saveNotes: 'Save notes',
      assignTask: 'Assign a task',
      downloadClientReport: 'Download report',
      downloadClientReportAria: 'Download this client\u2019s assessment answers as a .txt file',
      viewClientMatrix: 'View matrix',
      viewClientMatrixAria: 'View matrix (universe visualisation) for this client',
      viewClientAiReport: 'View AI report',
      viewClientAiReportAria: 'View the AI-generated narrative report for this client',
      // Labels for the body of the downloaded TXT report. Kept here so the
      // admin\u2019s current UI language controls the file\u2019s language.
      report: {
        title: 'ArchetypeAI Assessment Report',
        clientLabel: 'Client',
        clientUidLabel: 'Client UID',
        clientNoEmail: '(no email on file)',
        completedLabel: 'Completed',
        scoringMethodLabel: 'Scoring method',
        scoringDeterministic: 'deterministic',
        scoringFallback: 'fallback (no AI narrative available)',
        sectionDimensional: 'Dimensional Expressions',
        sectionAnswers: 'All 64 Answers',
        dimAgency: 'Agency',
        dimTemperature: 'Temperature',
        dimFocus: 'Focus',
        dimAttachment: 'Attachment',
        likertUnanswered: '(not answered)',
        likert1: 'Strongly Disagree',
        likert2: 'Disagree',
        likert3: 'Neutral',
        likert4: 'Agree',
        likert5: 'Strongly Agree',
        // Section banner labels (e.g. "[Agency Spectrum]"). Pulled from the
        // question-set translation keys so they stay in sync with the test UI.
        agencySection: 'Agency Spectrum',
        temperatureSection: 'Emotional Temperature',
        focusSection: 'Relational Focus',
        attachmentSection: 'Attachment Strategy',
        footer: 'Generated by ArchetypeAI',
      },
      removeClient: 'Remove',
      noClients: 'No clients yet.',
      noClientsBody: 'Share your User ID (UID) with the client, and ask them to share theirs with you — then add them here by UID.',
      noNotesYet: 'No notes yet',
      clientLastAssessment: 'Last assessment:',
      noAssessmentYet: 'Client hasn\'t completed an assessment yet',
      specialistViewBadge: 'Viewing as specialist',
      backToCabinet: 'Back to cabinet',
      addClientFailed: 'Failed to add client',
      removeClientFailed: 'Failed to remove client',
      saveNotesFailed: 'Failed to save notes',
      loadClientsFailed: 'Failed to load clients',
      addAdminFailed: 'Failed to add admin',
      removeAdminFailed: 'Failed to remove admin',
      // Per-version download list (each client shows their full history
      // with a download button per version, not just the latest).
      clientAllAssessments: 'All assessments',
      // UID<->email auto-fill: status messages shown under the form while
      // a lookup is running, after a "not found" result, or on error.
      clientLookupInProgress: 'Looking up…',
      clientLookupNotFound: 'No user found',
      clientLookupError: 'Lookup failed'
    },
    // AI report 8-section prompt — section titles + body instructions
    // for the legacy 8-section analysis. Source of truth for what the AI
    // is told to call each section; must be localised so the rendered
    // report matches the user's chosen language.
    aiReport: {
      section1Title: 'Dimensional profile',
      section1Body: 'Describe the user\'s position on the four axes. Embed the numbers in prose ("Your agency is strongly tilted toward the active end (−0.75), which means…"). Explain what each position means in everyday life. No tables.',
      section2Title: 'Core behavioural patterns (archetypes)',
      section2Body: 'Group the significant patterns by cluster (gift and shadow). For each pattern: • Descriptive name (e.g. "anxious-control pattern" — NOT a capitalised proper noun). • How it shows up in concrete life situations. • The inner pain or fear underneath. • What the pattern is secretly trying to get. • How it interacts with the other patterns. Gift patterns: brief, no flattery.',
      section3Title: 'Regulation, boundaries, narrative coherence',
      section3_1Title: 'How you handle emotions and where they hide',
      section3_2Title: 'Boundaries with other people',
      section3_3Title: 'How whole your self-story feels',
      section4Title: 'Main psychological defences',
      section4Body: 'Name the primary and secondary defence mechanisms in plain words (e.g. "intellectualisation is when you turn pain into logical analysis"). For each, give a vivid illustration from relationships or work. No textbook definitions.',
      section5Title: 'Core inner complexes',
      section5Body: 'Describe each detected complex as a stable template that organises the user\'s perception of relationships. Connect to specific scores and patterns.',
      section6Title: 'Main inner conflicts',
      section6Body: 'Two or three strongest contradictions. For each: show both sides with concrete examples; explain what the constant tug-of-war costs; do not propose resolutions.',
      section7Title: 'What is already working (the resource side)',
      section7Body: 'Brief, no flattery. Just the healthier aspects.',
      section8Title: 'Important to keep in mind',
      section8Body: 'No recommendations, no calls to action. State that the conclusions are based only on the questionnaire; this is a hypothesis, not a diagnosis; it can be refined. End calmly, no fanfare.'
    },
    // AI Coach floating panel — title, character name, ARIA labels, placeholder.
    coach: {
      characterName: 'Wisdom Sage',
      title: 'AI Coach',
      closeAria: 'Close coach panel',
      suggestedQuestionsLabel: '💭 Suggested questions:',
      inputPlaceholder: 'Ask anything...',
      // Parts-mode placeholder — replaces `coach.inputPlaceholder` when the
      // user's persona toggle is set to Parts Dialogue. Lives under `coach`
      // (not `universe`) so the persona switch is self-contained — no
      // cross-section key dependency.
      partsModePlaceholder: 'Ask a Part... (e.g. "What does this part feel?")',
      inputAria: 'Type your message to the coach',
      sendAria: 'Send message'
    }
  },
  ru: {
    loading: 'Загрузка...',
    intro: {
      heroTitlePart1: 'Откройте для себя ',
      heroTitlePart2: ' ваших отношений.',
      heroUnderline: 'архетипическую карту',
      heroSubtitle: 'Встретьте всех себя — или сразу исследуйте вселенную.',
      beginAssessment: 'Начать тест',
      exploreUniverse: 'Исследовать вселенную',
      relationalCartography: 'Карта ваших отношений',
      archetypeStudio: 'Каталог архетипов',
      uploadBackup: 'Загрузить копию'
    },
    assessment: {
      previous: 'Назад',
      cancel: 'Отмена',
      stronglyDisagree: 'Полностью не согласен(на)',
      stronglyAgree: 'Полностью согласен(на)',
      reflectAndChoose: 'Подумайте и выберите',
      finalInsight: 'Последнее наблюдение',
      questions: {
        agency: {
          title: 'Спектр инициативы',
          q1: 'В групповых ситуациях я естественно беру на себя роль лидера',
          q2: 'Я предпочитаю принимать решения самостоятельно, а не ждать других',
          q3: 'Мне некомфортно, когда я не контролирую результат',
          q4: 'В отношениях чаще всего именно я предлагаю планы и занятия',
          q5: 'Если у меня есть мнение, я высказываю его без промедления',
          q6: 'Мне нравится руководить проектами и направлять процессы',
          q7: 'Я предпочитаю позволять ситуациям развиваться естественно',
          q8: 'Мне нравится следовать за человеком с чётким видением',
          q9: 'Мне проще откликаться на чужие инициативы, чем выдвигать свои',
          q10: 'Я доверяю, что всё сложится и без моего вмешательства',
          q11: 'Часто жду, пока другие выскажутся, прежде чем обнаруживать свои предпочтения',
          q12: 'Мне комфортно уступать инициативу другим'
        },
        temperature: {
          title: 'Эмоциональная температура',
          q1: 'Мои эмоции обычно интенсивные и яркие',
          q2: 'Окружающие описывают меня как страстного и эмоционального человека',
          q3: 'Я легко плачу в трогательные моменты — в кино и в жизни',
          q4: 'Эмоции ощущаются мной как сильные физические состояния',
          q5: 'Я выражаю свои чувства открыто и выразительно',
          q6: 'Я глубоко погружаюсь в истории, проекты и отношения',
          q7: 'Я предпочитаю сохранять ровное, спокойное настроение',
          q8: 'Я принимаю решения, основываясь больше на логике, чем на чувствах',
          q9: 'Я редко бываю заметно зол(а) или расстроен(а) на публике',
          q10: 'Я сохраняю эмоциональное самообладание даже в стрессовых ситуациях',
          q11: 'Я перерабатываю свои эмоции внутри, прежде чем выразить их',
          q12: 'Я ценю рациональное мышление выше эмоционального выражения'
        },
        focus: {
          title: 'Фокус в отношениях',
          q1: 'Я часто ставлю чужие потребности выше собственных',
          q2: 'Мне приносит удовлетворение помогать и поддерживать других',
          q3: 'Я тревожусь, когда кого-то разочаровываю',
          q4: 'Я тонко чувствую эмоциональное состояние других людей',
          q5: 'Я подстраиваюсь под чужой график и нужды',
          q6: 'Я чувствую ответственность за чужое счастье',
          q7: 'Мне нужно много времени в одиночестве, чтобы восстановиться',
          q8: 'Мои личные цели и проекты очень для меня важны',
          q9: 'Мне комфортно ставить свои потребности на первое место, когда нужно',
          q10: 'Я защищаю свою независимость и автономию в отношениях',
          q11: 'Я принимаю решения исходя из того, что лучше для меня',
          q12: 'Я чётко оберегаю границы своего времени и энергии'
        },
        attachment: {
          title: 'Стратегия привязанности',
          q1: 'Я боюсь, что партнёр меня оставит',
          q2: 'Мне нужны частые подтверждения, что меня любят и ценят',
          q3: 'Я иногда проверяю, насколько партнёр мне предан',
          q4: 'Я тревожусь, когда партнёр не отвечает на сообщения быстро',
          q5: 'Я перечитываю переписки в поисках признаков охлаждения',
          q6: 'Я идеализирую партнёров, особенно в начале отношений',
          q7: 'Мне трудно сосредоточиться, когда я чувствую неуверенность в отношениях',
          q8: 'Я боюсь одиночества больше, чем сложных отношений',
          q9: 'Я чувствую себя задохнувшимся, когда отношения становятся слишком близкими',
          q10: 'Я предпочитаю отношения с большим пространством и независимостью',
          q11: 'Я избегаю строить совместные долгосрочные планы',
          q12: 'Я чувствую облегчение, когда отношения заканчиваются — даже хорошие',
          q13: 'Я держу эмоциональную дистанцию как защиту',
          q14: 'Я замечаю недостатки в партнёрах, которые заставляют меня отстраниться',
          q15: 'Я ценю свою независимость выше большинства потребностей в отношениях',
          q16: 'Мне некомфортно при слишком большой эмоциональной близости'
        },
        healthy: {
          title: 'Зрелые паттерны в отношениях',
          q1: 'Я умею проявлять и силу, и уязвимость — в зависимости от того, что сейчас подлинно',
          q2: 'Я беру ответственность за свою часть в том, что происходит в отношениях',
          q3: 'Я умею признавать тяжёлые эмоции, не растворяясь в них',
          q4: 'Я отношусь к своим паттернам с любопытством и без осуждения',
          q5: 'Я умею выстраивать границы, сохраняя при этом тепло и включённость',
          q6: 'Мне одинаково комфортно давать и принимать поддержку',
          q7: 'Я умею гибко подстраиваться под то, чего требует ситуация',
          q8: 'Я сохраняю ощущение себя, оставаясь в близости с другими',
          q9: 'Я чётко говорю о своих потребностях — без давления и без отстранения',
          q10: 'Я выдерживаю неопределённость в отношениях без паники и побега',
          q11: 'Я учусь на прошлых паттернах и делаю другой выбор',
          q12: 'Я чувствую себя достойным(ой) любви — независимо от того, в отношениях я или нет'
        }
      },
      results: {
        title: 'Ваш портрет отношений',
        description: 'Этот анализ показывает, как вы устроены в отношениях. Относитесь к нему как к карте для исследования и роста.',
        viewUniverse: 'Открыть мою вселенную',
        analyzing: 'Анализируем ваши ответы...',
        eyebrow: 'ВАШ ПОРТРЕТ ОТНОШЕНИЙ',
        verdictTitle: 'Результат',
        signatureLabel: 'Размерный профиль',
        balanced: 'Центрировано',
        balancedProfile: 'Центрированный профиль — ответы не выделяют выраженных склонностей ни к одному из полюсов.',
        loadingMessage: 'Собираем вашу карту...',
        loadingHint: 'Обычно это занимает 10–30 секунд. Можно отменить и использовать локальный анализ.',
        cancelAnalysis: 'Отменить и использовать локальный анализ',
        analysisCancelled: 'Анализ отменён. Локальный анализ показан ниже.',
        degradedBannerTitle: 'ИИ-текст недоступен',
        degradedBannerBody: 'Полный ИИ-разбор временно недоступен. Архетипы, профиль и все показатели ниже по-прежнему точны — заменён только текст описания. Можно повторить попытку.',
        retryNarrative: 'Повторить ИИ-разбор',
        errorTitle: 'Ошибка расчёта',
        unknownError: 'Произошла неизвестная ошибка.',
        pantheonTitle: 'Все, кто в вас',
        pantheonSubtitle: 'Архетипы, откликающиеся вашему текущему состоянию',
        enterUniverse: 'Войти во вселенную',
        retake: 'Пройти заново',
        backToIntro: 'Вернуться на старт',
        // Specialist (read-only) view: when an admin opens a client's
        // report, these strings replace the personal-only CTAs.
        specialistViewBadge: 'Просмотр от лица специалиста (только чтение)',
        specialistViewClient: 'Клиент:',
        specialistViewNoClient: 'Анонимный клиент',
        highDemand: 'Сейчас высокая нагрузка. Пожалуйста, подождите немного и попробуйте снова.',
        downloadBackup: 'Скачать копию',
        scoringPrecise: 'Точный расчёт',
        scoringCreative: 'Резервный ИИ',
        scoringDeterministic: 'Точный расчёт',
        scoringFallback: 'Резервный ИИ',
        scoringDeterministicTooltip: 'Переключиться на резервный режим ИИ',
        scoringFallbackTooltip: 'Переключиться на точный расчёт',
        dynamicsLabel: 'Динамика внутренней системы',
        poleScoresTitle: 'Оценки полюсов',
        agencyActive: 'Ведёт за собой',
        agencyReceptive: 'Идёт за другими',
        tempHot: 'Выразительный',
        tempCool: 'Сдержанный',
        focusOther: 'Эмпатичный',
        focusSelf: 'Прагматичный',
        attAnxious: 'Ищет подтверждений',
        attAvoidant: 'Ценит независимость',
        healthScore: 'Здоровье',
        disorganizedFlag: 'Дезорганизованный',
        complexesTitle: 'Активные комплексы',
        defenseTitle: 'Иерархия защит',
        escalationLabel: 'Пути эскалации',
        triggerMapTitle: 'Карта триггеров',
        pathwayTitle: 'Путь к более целостному состоянию',
        diagnosticsTitle: 'Диагностические индикаторы',
        clinicalExport: 'Клинический отчёт',
        dissociationLabel: 'Диссоциация',
        regulationLabel: 'Регуляция',
        boundaryLabel: 'Границы',
        coherenceLabel: 'Когерентность',
        // Section labels for results panel navigation
        sectionHero: 'Связь',
        sectionProfile: 'Профиль по показателям',
        sectionSignature: 'Размерный профиль',
        sectionSpectrum: 'Полюсные оценки',
        sectionPantheon: 'Пантеон',
        sectionDynamics: 'Динамика системы',
        sectionComplexes: 'Комплексы',
        sectionDefense: 'Иерархия защит',
        sectionTriggers: 'Карта триггеров',
        sectionPathway: 'Путь к целостности',
        sectionDiagnostics: 'Диагностика',
        // Section 1 dimensional profile table headers — см. en
        axisHeader: 'Показатель',
        poleHeader: 'Полюс',
        intensityHeader: 'Насколько выражено',
        valueHeader: 'Значение'
      }
    },
    landing: {
      // Navbar
      navProblem: 'Зачем это', navMatrix: 'Как сочетаются', navCodex: 'ВСЕ ЗВЕЗДЫ', navEngine: 'Карта',
      navDashboard: 'Кабинет', navLogout: 'Выйти', navLogin: 'Войти',
      navTherapist: 'Терапевт',
      dockHome: 'Главная', dockCodex: 'ВСЕ ЗВЕЗДЫ', dockMatrix: 'Как сочетаются', dockEngine: 'Карта',
      // app-stage revamp ("inner verse.html" reference)
      dockBase: 'База', dockSky: 'Небо', dockYou: 'Профиль',
      welcomeKicker: 'познакомьтесь с собой ближе',
      welcomeH1a: 'Внутри вас —', welcomeH1b: 'целая вселенная.',
      welcomePoem: '147 утверждений, три подхода примерно по 15 минут — и вы знакомы с теми, кто внутри. Метод внутренних семейных систем (IFS): вы отвечаете о себе — приложение строит карту.',
      startCta: 'Начать знакомство',
      returningCta: 'Я здесь уже не впервые',
      completedMapCta: 'Открыть сохранённую карту',
      skyKicker: 'ваше внутреннее небо', skyTitle: 'СОЗВЕЗДИЕ', skySub: 'Нажмите на звезду — познакомьтесь. Нажмите на центр — поймёте карту.',
      filterAll: 'Все', famManagers: 'Менеджеры', famFirefighters: 'Пожарные', famExiles: 'Изгнанники', famResources: 'Ресурсы',
      codexSegParts: 'Звёзды', codexSegChem: 'Алхимическая лаборатория', codexCrests: 'КЛАСТЕРЫ',
      chemTitle: 'Совместите две звезды',
      chemSub: 'У каждой пары звёзд — своя физика. Одни — сладкие орбиты. Другие — курс столкновения.',
      chemPick: 'выберите звезду', chemRun: 'Запустить реакцию', chemReport: 'отчёт о реакции',
      chemFlow: 'поток', chemSpark: 'искра', chemDrag: 'трение',
      sheetGift: 'дар', sheetCost: 'цена', sheetAxes: 'четыре оси', sheetPractice: 'крошечная практика',
      youBrand: 'ПРОФИЛЬ', youAboutKicker: 'что это такое', youAboutTitle: 'Зеркало для самопознания',
      youAboutBody: 'Innerverse — игривая карта внутреннего мира по мотивам метода внутренних семейных систем (IFS). 147 утверждений, три погружения — и перед вами живая карта вашего неба: восемнадцать звёзд, каждая со своим характером. Ответы остаются на этом устройстве.',
      statParts: 'звёзд', statStatements: 'утверждений', statSittings: 'погружения', statTimeShort: 'до вашей карты',
      youSettings: 'настройки', setLanguage: 'Язык', setLanguageDesc: 'Сначала русский, затем английский',
      setTheme: 'Ночной режим', setThemeDesc: 'Небо после заката',
      youShare: 'Поделиться Innerverse', shareCopied: 'Скопировано! Вставьте куда угодно.',
      youReport: 'Мой отчёт', youCheckin: 'Ежедневный чек-ин', youPractice: 'Ежедневная практика', youSynastry: 'Сравнение',
      youLockedHint: 'появятся после первого прохождения', youCoach: 'ИИ-коуч', youSubscribe: 'Подписка Innerverse',
      editTitle: 'Настроить часть', editTitleNew: 'Своя часть',
      editShape: 'Форма', editColor: 'Цвет', editEyes: 'Глаза', editMouth: 'Рот',
      editNameRu: 'Название (по-русски)', editNameEn: 'Название (по-английски)', editFamily: 'Семья',
      editSave: 'Сохранить', editReset: 'Вернуть исходный вид', editDelete: 'Удалить часть', editCancel: 'Отмена',
      editAddCard: '＋ своя часть', customNote: 'Это ваша собственная часть.',
      famManagerOpt: 'Менеджер', famFirefighterOpt: 'Пожарный', famExileOpt: 'Изгнанник', famResourceOpt: 'Ресурс',
      youUniverse: 'Моя вселенная', youCabinet: 'Личный кабинет', youSignIn: 'Войти', youLogout: 'Выйти',
      youRestore: 'Восстановить из файла',
      youEthics: 'Innerverse — карта внутреннего мира по мотивам IFS. За диагностикой и терапией обращайтесь к специалисту. Данные остаются на устройстве, пока вы сами не решите иначе.',
      startTest: 'Начать тест \u2726',
      quickScanCta: 'Встретьте одну часть за 90 секунд',
      // Hero
      liveBadge: 'Сейчас', heroBadge: '147 утверждений \u00B7 метод IFS',
      heroTitleLine1: 'Внутри вас —', heroTitleEmphasis: 'созвездие', heroTitleLine2: 'познакомьтесь с ним.',
      heroSubtitle: 'встретьте всех себя. Одно небо, точные измерения — три подхода по 49 утверждений, метод «Внутренние семейные системы»: бережное самопознание по вашим собственным ответам.',
      beginTest: '\u2726 Начать тест', exploreMatrix: 'Исследовать матрицу',
      statArchetypes: '18 внутренних частей', statAxes: '147 утверждений', statTime: '~25мин', statTimeLabel: 'До вашей карты',
      // Marquee
      marqueeWord1: 'Увидьте свои закономерности', marqueeWord2: 'Разорвите привычный круг', marqueeWord3: 'Узнайте себя лучше', marqueeWord4: 'Разберитесь в путанице', marqueeWord5: 'Как устроены ваши отношения',
      // Problem
      problemLabel: 'Знакомая ситуация', problemTitle: 'Почему это повторяется снова и снова?',
      problemSubtitle: 'Те же ситуации. То же напряжение. Те же несостоявшиеся разговоры. У этого есть понятная причина, и её можно увидеть.',
      painTitle1: 'Цикл игнорирования', painText1: 'Вы привлекаете Кочевников, действуя как Якорь. Физика предсказывает их исчезновение.',
      painTitle2: 'Столкновение Катализаторов', painText2: 'Два Катализатора — это огонь. Блестяще для стартапов. Катастрофично для исполнения.',
      painTitle3: 'Все со всем соглашаются', painText3: 'Вокруг только те, кто во всём с вами согласен. Никто не предлагает ничего нового. Такое единодушие может незаметно душить.',
      painTitle4: 'Невидимые триггеры', painText4: 'Конфликт вспыхивает, и вы не знаете почему. Несчитанные сигналы детонируют раньше вас.',
      painTitle5: 'Эмоциональное выгорание', painText5: 'Якорь несёт всех и истощает себя. Система никогда не восстанавливает его.',
      painTitle6: 'Асимметричная орбита', painText6: 'Один вкладывается интенсивно; другой держится свободно. Дисбаланс структурен.',
      // Synergy
      synergyLabel: 'Инструмент', synergyTitle: 'Как части сочетаются',
      synergySubtitle: 'Не все архетипы сочетаются идеально. Выберите два узла, чтобы посмотреть, как они взаимодействуют.',
      synSelectTwo: 'Выберите два узла', synFriction: 'Трение',
      synAwaiting: 'Ожидание ввода', synAwaitingDesc: 'Выберите два архетипа выше для вычисления динамического трения.',
      synAwaitingSecond: 'Ожидание второго узла', synAwaitingSecondDesc: 'Выберите другой архетип для вычисления физики связи.',
      synResult: 'Результат',
      synEcho: 'Эхо друг друга \u{1FA9E}', synEchoDesc: 'Очень похожие архетипы. Много взаимопонимания, но мало нового. Группа застревает в единодушии.',
      synTension: 'Живое напряжение \u26A1', synTensionDesc: 'Быстрый рост, но с опорой на реальность. Хорошо работает, если не терять контакт друг с другом.',
      synComplex: 'Непростое сочетание \u{1F300}', synComplexDesc: 'Трение создаёт запас энергии для роста. Важно бережно относиться к границам друг друга.',
      // Features
      featuresLabel: 'Возможности', featuresTitle: 'Всё, что нужно для расшифровки связей.',
      feat1Title: 'Интерактивная 3D-карта', feat1Desc: 'Вращайте, масштабируйте и кликайте по живой карте отношений.<br>Каждый узел — история.',
      feat2Title: 'Помощь ИИ в поиске закономерностей', feat2Desc: 'Помогает заметить то, что самому увидеть в себе непросто.',
      feat3Title: 'Анализ по четырём показателям', feat3Desc: 'Инициативность, эмоциональность, фокус внимания и то, как вы относитесь к близости, — всё точно измерено.',
      feat4Title: 'Подробные отчёты', feat4Desc: 'Экспорт в файл. Развёрнутые описания от ИИ. Подробный профиль, который можно показать специалисту.',
      // Codex
      codexBrand: 'ВСЕ ЗВЕЗДЫ', codexLabel: 'ВСЕ ЗВЕЗДЫ', codexTitle: 'Восемнадцать звёзд.', codexTitleLine2: 'Бесконечно много сочетаний.',
      codexSubtitle: 'Перетаскивайте для изучения каталога. Нажмите, чтобы перевернуть.',
      codexSwipe: '\u2190 Прокрутите для обзора \u2192',
      statAgency: 'Инициативность', statTemperature: 'Эмоциональность', statFocus: 'Фокус внимания', statAttachment: 'Близость и дистанция',
      // Engine
      engineLabel: 'Движок', engineTitle: 'Ваша вселенная отношений', engineTitleEmphasis: 'стала видимой.',
      engineSubtitle: 'Перетаскивайте для вращения. 3D-рендеринг сети архетипов в реальном времени.',
      enginePause: 'Пауза', enginePlay: 'Играть', engineDrag: 'Перетащите для вращения', engineLive: 'Рендеринг',
      // Method
      methodTitle: 'Три шага к ясности.',
      step1Title: 'Пройдите тест', step1Desc: 'Ответьте на 147 утверждений в трёх частях — точное измерение вместо гадания. Прогресс сохраняется, если сделать паузу.',
      step2Title: 'Движок измеряет', step2Desc: 'Ваши ответы становятся картой: кто в вас громче, кто тише, кто чаще за рулём. Одинаковые ответы всегда дают одинаковую карту.',
      step3Title: 'Изучите карту', step3Desc: 'Исследуйте своё живое созвездие. Встретьте свои части, сюжетные линии и путь практики.',
      // Footer
      footerTitle: 'Откройте свою', footerTitleEmphasis: 'вселенную.', footerChip: 'Бесплатно и конфиденциально', installAppCta: 'Установить приложение',
      footerSubtitle: 'Пройдите тест за 10 минут и получите личную карту ваших отношений. Бесплатно и конфиденциально.',
      uploadBackup: 'Загрузить копию',
      downloadNoticeTitle: 'Важно',
      downloadNoticeDesc: 'Ответы остаются на вашем устройстве. Полный тест — три части по 49 утверждений: можно остановиться после любой части, и прогресс сохранится. Резервную копию в любой момент можно скачать из кабинета.',
      restoreBackup: 'Восстановить прошлый тест',
      resumeInProgress: 'Продолжить тест',
      resumeInProgressXofY: 'Отвечено {{count}} из {{total}}',
      // Archetypes
      archWanderer: 'Странник', archWandererType: 'Искатель', archWandererDesc: 'Легко перемещается между разными компаниями, вбирая обстановку, но не меняя её. Наблюдатель по натуре.',
      archCatalyst: 'Заводила', archCatalystType: 'Возмутитель спокойствия', archCatalystDesc: 'Вызывает резкие перемены в том, как ведёт себя группа. Очень непредсказуем, но способен по-настоящему всё изменить.',
      archAnchor: 'Опора', archAnchorType: 'Стабилизатор', archAnchorDesc: 'Создаёт вокруг себя ощущение устойчивости. Становится тем неподвижным центром, вокруг которого держатся другие.',
      archSage: 'Мудрец', archSageType: 'Советчик', archSageDesc: 'Смотрит на ситуацию со стороны. Умеет собрать разрозненные наблюдения в понятный вывод.',
      archWeaver: 'Связующий', archWeaverType: 'Объединитель', archWeaverDesc: 'Незаметно соединяет людей, которые иначе не пересеклись бы. Тот, кто держит связи вместе, оставаясь в тени.',
      archMirror: 'Зеркало', archMirrorType: 'Отражающий', archMirrorDesc: 'Возвращает ровно ту энергию, которую получил от других. Хорошо показывает, как вы сами себя ведёте.',
      archHerald: 'Вестник', archHeraldType: 'Посредник', archHeraldDesc: 'Переносит новости и идеи между разными компаниями людей. Чувствует себя увереннее на стыке разных групп.',
      archGuardian: 'Страж', archGuardianType: 'Защитник', archGuardianDesc: 'Создаёт пространство, где другим спокойно быть уязвимыми. Тот, кто прикрывает тыл.'
    },
    universe: {
      title: 'Архетипическая вселенная',
      backToMenu: 'Вернуться в меню',
      searchPlaceholder: 'Поиск архетипов...',
      filters: 'Фильтры исследования',
      noArchetypes: 'Архетипы не найдены.',
      loadingPhrases: {
        calibrating: 'Ловим звёздный свет...',
        polishing: 'Протираем объектив телескопа...',
        teaching: 'Созвездия репетируют танец...',
        unfolding: 'Разворачиваем звёздную карту...',
        reticulating: 'Ретикуляция эмоциональных сплайнов...',
        waking: 'Небо просыпается...'
      },
      aiCreation: 'Создать с помощью ИИ',
      archetypePlaceholder: 'Опишите архетип...',
      generate: 'Создать',
      creating: 'Создание...',
      compare: 'Сравнить',
      close: 'Закрыть',
      aiCoach: 'ИИ-коуч',
      askPlaceholder: 'Задайте вопрос...',
      summon: 'Спросить',
      suggestions: 'Предложения',
      help: 'Помощь',
      helpTitle: 'Добро пожаловать в Архетипическую вселенную',
      helpDesc: 'Каждая сфера здесь — архетип: один из способов быть собой в отношениях. Чем ближе сферы расположены, тем ближе их смысл.',
      help1Title: 'Навигация:',
      help1Desc: 'Вращайте, масштабируйте и перетаскивайте вселенную мышью или трекпадом.',
      help2Title: 'Исследование:',
      help2Desc: 'Наведите курсор на сферу, чтобы увидеть название. Нажмите — откроется подробный профиль.',
      help3Title: 'Фильтрация:',
      help3Desc: 'Фильтры помогают изучать вселенную по группам архетипов и их свойствам.',
      help4Title: 'ИИ-коуч:',
      help4Desc: 'ИИ-коуч ответит на вопросы об архетипах и их связях — просто спросите.',
      help5Title: 'Сферы и звёзды:',
      help5Desc: 'Каждая сфера — узнаваемый образ: так складывается человек, у которого эта сторона сильнее всего. Ваши звёзды — ваши привычные пути: в знакомой ситуации вас тянет туда снова и снова.',
      help6Title: 'Четыре оси:',
      help6Desc: 'Место сферы задают четыре шкалы: Инициативность, Эмоциональность, Фокус внимания и Близость и дистанция. Каждая идёт от полюса к полюсу (например, прагматичный \u2194 эмпатичный): чем ближе сфера к полюсу, тем сильнее это качество выражено.',
      help7Title: 'Группы архетипов:',
      help7Desc: 'Менеджеры заранее удерживают порядок, чтобы плохой день так и не наступил; Пожарные прибегают мгновенно, когда внутри уже горит; Изгнанники несут юную боль, спрятанную от повседневной жизни; Ресурсы — выращенные силы, на которые можно опереться.',
      helpFooter: 'Относитесь к этой вселенной как к карте для самопознания: с любопытством и добротой к тому, как вы устроены.',
      sceneReadyTimeout: 'Вселенная слишком долго стабилизировалась. Попробуйте снова.',
      sceneInitFailed: 'Не удалось инициализировать вселенную.',
      canvasMissing: 'Не найден canvas вселенной.',
      universeInitFailed: 'Не удалось загрузить вселенную. Обновите страницу.',
      universeErrorTitle: 'Ошибка вселенной',
      analysisTimeout: 'Анализ ИИ выполняется слишком долго. Попробуйте снова.',
      analysisCancelled: 'Анализ отменён.',
      aiUnavailable: 'Сервис ИИ сейчас недоступен.',
      creatorEmptyResponse: 'ИИ-генератор вернул пустой ответ.',
      creatorUnavailable: 'ИИ-генератор сейчас недоступен.',
      creatorInvalidFormat: 'ИИ-генератор вернул данные в неверном формате.',
      analystEmptyResponse: 'ИИ-аналитик вернул пустой ответ.',
      backupInvalidFormat: 'Неверный формат резервной копии. Не удалось найти ответы в файле.',
      backupIncomplete: 'Загруженная резервная копия неполная. Загрузите резервную копию с завершённой оценкой.',
      backupParseFailed: 'Не удалось разобрать резервную копию. Проверьте формат файла и попробуйте снова.',
      coachEmptyResponse: 'Пустой ответ от ИИ',
      coachUnknownError: 'Неизвестная ошибка',
      partsEmptyResponse: 'Диалог частей вернул пустой ответ. Попробуйте еще раз.',
      partsUnknownError: 'Неизвестная ошибка',
      fallbackPath: 'Чтобы найти свой путь',
      unknownValue: 'Неизвестно',
      retry: 'Повторить',
      dismiss: 'Скрыть',
      retryUniverse: 'Попробовать вселенную снова',
      selectSecondArchetype: 'Выберите второй архетип для сравнения.',
      aiCoachWelcome: 'Привет! Я ваш проводник по этой вселенной. Спрашивайте о чём угодно — частях, осях, архетипах.',
      coachComparing: 'Вы сравниваете **{archetype1}** и **{archetype2}**. Что бы вы хотели узнать об их динамике?',
      coachExploring: 'Вы исследуете **{archetype1}**. С кем бы вы хотели его сравнить? Можете также спросить о нём напрямую.',
      coachSelected: 'Привет! Я ваш ИИ-коуч. Как я могу помочь вам в исследовании **{archetype1}**?',
      coachError: 'Что-то пошло не так. {error}',
      analystSystemInstruction: 'Вы — психотерапевт мирового класса, специализирующийся на юнгианской психологии, реляционной динамике и архетипических системах. Ваша задача — предоставить глубокий, проницательный и сострадательный анализ самооценки пользователя и создать "Личный пантеон" архетипов, который представляет их уникальный реляционный отпечаток. Пишите простым, живым русским языком: без клинических терминов, жаргона и канцелярита — так, чтобы было понятно человеку без психологического образования.',
      coachSystemInstruction: 'Вы — мудрый, проницательный и сострадательный Архетипический коуч. Ваш тон нежный, ободряющий и глубокий. Вы эксперт в реляционной динамике, психологии и работе с тенью. Отвечайте простым, живым русским языком: без клинических терминов и жаргона — так, чтобы было понятно человеку без психологического образования.',
      // Дописывается к coachSystemInstruction, когда пользователь переключает
      // персону на Диалог с частями. IFS-ориентированная накладка —
      // слушает части, приглашает замечать, а не навешивать ярлыки.
      partsModeSystemInstruction: 'РЕЖИМ ДИАЛОГА С ЧАСТЯМИ: Вы работаете в осознанности IFS (терапия внутренних семейных систем). Когда пользователь упоминает внутренние фигуры, эмоциональные паттерны, самокритику или защитные реакции, воспринимайте их как IFS-части. Подходите к ним с теплом, любопытством и безусловным позитивным принятием. Приглашайте замечать чувства, телесные ощущения, возраст, функцию и намерения части — никогда не ставьте диагнозов. Используйте открытые приглашения: «Как эта часть относится к вам?», «Чего эта часть боится, если отступит?». Сохраняйте краткость и ориентацию на самопознание, а не на советы.',
      dimensionalExpression: 'Размерностное выражение',
      clusters: 'Кластеры',
      exploration: 'Исследование',
      dimensionsLabel: 'Измерения',
      archetypeStudio: 'Каталог архетипов',
      aiBadge: 'ИИ',
      relationalHub: 'Изучи внутренний космос',
      relationalGuide: 'Гид по отношениям',
      filtersBtn: 'Фильтры',
      closeBtn: 'Закрыть',
      saveBackupTitle: 'Сохранить копию',
      synastryTitle: 'Сравнение с другим человеком',
      // Coach mode (только бейдж-ярлык — `partsDialogue` живёт и в `coach`,
      // чтобы переключатель персоны был самодостаточным).
      partsDialogue: 'Диалог с частями',
      partsDialoguePillAria: 'Персона: Диалог с частями',
      partsDialogueExitHint: 'Нажмите, чтобы вернуться в общий режим',
      // Synastry panel
      synastry: {
        headerEyebrow: 'ДВОЙНАЯ ЗВЕЗДА',
        headerTitle: 'Химия притяжения и ран',
        person1Label: 'Первый',
        person2Label: 'Второй',
        tabResonance: 'Резонанс',
        tabAttachment: 'Близость и дистанция',
        tabShadow: 'Карта теней',
        tabSystems: 'Внутренние системы',
        tabGrowth: 'Рост',
        loadingText: 'Читаем ваши связи...',
        // Loading phases
        loadingPhase1: 'Анализируем совпадения профилей...',
        loadingPhase2: 'Разбираем теневые паттерны...',
        loadingPhase3: 'Вычисляем пути роста...',
        loadingPhase4: 'Читаем ваши связи...',
        // Section labels
        sectionHero: 'Связь',
        sectionSignature: 'Размерный профиль',
        sectionSpectrum: 'Оценки полюсов',
        sectionPantheon: 'Пантеон',
        sectionDynamics: 'Динамика системы',
        sectionComplexes: 'Комплексы',
        sectionDefense: 'Иерархия защит',
        sectionTriggers: 'Карта триггеров',
        sectionPathway: 'Путь к целостности',
        sectionDiagnostics: 'Диагностика',
        sectionScores: 'Оценки',
        sectionResonance: 'Резонанс',
        sectionAttachment: 'Близость и дистанция',
        sectionShadow: 'Тень',
        sectionSystems: 'Системы',
        sectionGrowth: 'Рост',
        sectionNarrative: 'Описание',
        cycleLabel: 'Цикл',
        deactivationLabel: 'Разрыв цикла',
        healingLabel: 'Исцеление:',
        invitationLabel: 'Приглашение:',
        shadowLabel: 'Тень:',
        woundLabel: 'Рана:',
        noProjections: 'Значимых теневых проекций не обнаружено.',
        noDynamics: 'Динамика внутренней системы не обнаружена.',
        polarMapTitle: 'Ваши противоположные тенденции',
        dyadicTitle: 'Анализ вашей пары',
        emotionalLoad: 'Эмоциональная нагрузка',
        initiationPattern: 'Кто обычно делает первый шаг',
        familyRecap: 'Повторение семейных паттернов',
        unconsciousContract: 'Негласная договорённость',
        growthSequenceTitle: 'Последовательность роста',
        regulationLabel: 'Регуляция',
        boundaryLabel: 'Границы',
        dissociationLabel: 'Диссоциация',
        coherenceLabel: 'Когерентность',
        boundaryInteraction: 'Взаимодействие границ',
        sharedComplexesTitle: 'Общие и дополнительные комплексы',
        crossTriggersTitle: 'Перекрёстные триггерные взаимодействия',
        jointPathwayTitle: 'Совместный путь интеграции',
        clinicalExport: 'Клинический отчёт',
        scoreResonanceDepth: 'Глубина резонанса',
        scoreGrowthPotential: 'Потенциал роста',
        scoreChallengeLevel: 'Уровень сложности',
        scoreSafetyIndex: 'Показатель безопасности',
        // Dance patterns
        dancePursueWithdraw: 'Один догоняет — другой отстраняется',
        danceMutualEscalation: 'Взаимная эскалация',
        danceDeepFreeze: 'Глубокая заморозка',
        danceHealingContainer: 'Исцеляющий контейнер',
        danceVolatileBond: 'Неустойчивая связь',
        danceParallelSovereignty: 'Параллельные миры',
        // Resonance patterns
        resonanceHarmonic: 'Слаженность',
        resonanceComplementary: 'Взаимодополнение',
        resonancePolarized: 'Противоположности',
        resonanceDissonant: 'Диссонанс',
        // Upload overlay
        uploadTitle: 'Сравнение с партнёром',
        uploadDesc: 'Загрузите файл резервной копии партнёра (JSON), чтобы посмотреть, насколько вы совместимы.',
        uploadButton: 'Загрузить файл партнёра',
        uploadWarning: 'Сначала пройдите тест — без него сравнить будет нечего.',
        shareTitle: 'Поделиться по коду',
        generateCode: 'Создать код',
        shareCodeConsent: 'Тот, кто получит этот код и войдёт в аккаунт, сможет увидеть снимок оценки. Считай его приватной ссылкой и отправляй только тому, кому доверяешь.',
        enterCode: 'Код партнёра',
        loadCode: 'Загрузить',
        orUploadFile: 'Или загрузите файл',
      },
      // Auth / Save prompt
      savePromptTitle: 'Сохранить результаты',
      savePromptDesc: 'Войдите, чтобы получить доступ к результатам с любого устройства.',
      signInGoogle: 'Войти через Google',
      signInEmail: 'Войти по Email',
      skipSave: 'Продолжить без сохранения',
      skipAndDownload: 'Пропустить и скачать копию',
      back: 'Назад',
      // Модальное окно входа (email + Google)
      loginEmailPlaceholder: 'Email',
      loginPasswordPlaceholder: 'Пароль (6+ символов)',
      continueWithGoogle: 'Войти через Google',
      signInCta: 'Войти',
      createAccountCta: 'Создать аккаунт',
      loginModalTitle: 'Войти',
      loginModalBody: 'Войдите, чтобы получить доступ к кабинету, истории и сохранённым сравнениям.',
      adminAccessNote: 'Примечание: доступ админа — функция для удобства. Безопасность обеспечивайте правилами Firebase + custom claims.',
      validEmailPasswordRequired: 'Нужен корректный email и пароль (6+ символов)',
      emailAlreadyInUse: 'Аккаунт уже существует — используйте «Войти»',
      // Anonymous results banner (shown on results page when user is anonymous)
      anonymousSaveBanner: 'Ваш результат сохранён на этом устройстве. Войдите, чтобы получить доступ с любого устройства.',
      anonymousSaveCta: 'Войти',
      // IFS Part types
      partTypes: {
        manager: 'Контролирующая часть',
        firefighter: 'Спасающая часть',
        exile: 'Ранимая часть',
        self: 'Спокойное, ясное состояние',
      },
      // Developmental origins
      origins: {
        pre_verbal: 'Самое раннее детство (0–2 года)',
        early_attachment: 'Ранняя привязанность (2–4 года)',
        oedipal: 'Дошкольный возраст (4–7 лет)',
        latency: 'Младший школьный возраст (7–12 лет)',
        adolescent: 'Подростковый возраст (12+ лет)',
      },
      // Inner System Dynamics
      dynamicsLabel: 'Как ваши части взаимодействуют друг с другом',
      dynamicProtects: 'защищает',
      dynamicFirefights: 'подменяет',
      archetypeDetails: {
        name: 'Имя',
        wound: 'Уязвимое место',
        shadow: 'Слепое пятно',
        invitation: 'Стоит попробовать',
        description: 'Описание',
        quality: 'Главное качество',
        coreBelief: 'Глубинное убеждение',
        attracts: 'Привлекает',
        integratedForm: 'В более целостном виде',
        synchronousArchetypes: 'Похожие архетипы'
      },
      dimensions: {
        agency: 'Инициативность',
        temperature: 'Эмоциональность',
        focus: 'Фокус внимания',
        attachment: 'Близость и дистанция',
        agencyHypo: 'Ведёт за собой',
        agencyHyper: 'Идёт за другими',
        agencyDesc: '<b>Ведёт за собой:</b> берёт на себя инициативу, принимает решения, задаёт направление.<br><b>Идёт за другими:</b> охотно откликается на чужие идеи, не спешит навязывать своё мнение, доверяет тому, как складывается ситуация.',
        temperatureHypo: 'Сдержанный',
        temperatureHyper: 'Выразительный',
        temperatureDesc: '<b>Сдержанный:</b> держит переживания при себе — снаружи ровный, что бы ни происходило внутри.<br><b>Выразительный:</b> чувства видны и слышны — живо откликается, легко делится тем, что на душе.',
        focusHypo: 'Прагматичный',
        focusHyper: 'Эмпатичный',
        focusDesc: '<b>Прагматичный:</b> сначала учитывает свои цели и границы.<br><b>Эмпатичный:</b> сначала ориентируется на чувства и нужды окружающих.',
        attachmentHypo: 'Ценит независимость',
        attachmentHyper: 'Ищет подтверждений',
        attachmentDesc: '<b>Ценит независимость:</b> держит дистанцию в близких отношениях, настороженно относится к слишком большой близости.<br><b>Ищет подтверждений:</b> боится быть покинутым, часто нуждается в знаках любви и внимания.'
      },
      clusterNames: {
        gift_archetypes: 'Архетипы дара',
        control_shadows: 'Тени контроля',
        emotional_storm_shadows: 'Тени эмоционального шторма',
        avoidant_intellectual_shadows: 'Интеллектуальные тени избегания',
        anxious_connection_shadows: 'Тревожные тени связи',
        seductive_avoidance_shadows: 'Тени соблазняющего избегания',
        disorganized_attachment_shadows: 'Тени дезорганизованной привязанности'
      },
      clusterDescs: {
        gift_archetypes: 'Интегрированные паттерны — психологическая целостность и зрелость.',
        control_shadows: 'Тени, растущие из потребности контролировать — холодный, активный, замкнутый на себе стиль.',
        emotional_storm_shadows: 'Тени эмоциональной бури — горячие, реактивные, на пределе интенсивности.',
        avoidant_intellectual_shadows: 'Тени интеллектуального избегания — холодный анализ и отстранение вместо чувств.',
        anxious_connection_shadows: 'Тени тревожной связи — горячая потребность в близости и постоянном подтверждении.',
        seductive_avoidance_shadows: 'Тени соблазна и избегания — магнетизм, за которым скрывается страх настоящей близости.',
        disorganized_attachment_shadows: 'Тени, сотканные из одновременной жажды близости и страха перед ней — самый сложный паттерн привязанности, корнями уходящий в опыт, когда близкий взрослый был одновременно источником утешения и ужаса.'
      },
      archetypes: {
        the_sovereign: {
          name: 'Хозяин своих слов',
          description: 'Умеет говорить и вести себя именно так, как нужно в конкретной ситуации',
          quality: 'Ясность и точность',
          invitation: 'Совмещать ясность с добротой, а способность держать всё под контролем — с умением иногда отпускать',
          coreBelief: 'Я сам(а) создаю свой опыт. То, что происходит внутри меня, во многом определяет то, что я вижу вокруг.',
          attracts: 'Людей, которые тоже уверенно себя чувствуют, — для совместного творчества и осознанных отношений',
          shadow: 'Может стать жёстким и склонным всё контролировать, если почувствует угрозу'
        },
        the_relational_fluent: {
          name: 'Гибкий в отношениях',
          description: 'Легко переключается между близостью и самостоятельностью',
          quality: 'Гибкость',
          invitation: 'Оставаться собой, даже когда отношения меняются и текут в разные стороны',
          coreBelief: 'Близость и самостоятельность не спорят друг с другом внутри меня — я могу свободно переходить от одного к другому.',
          attracts: 'Партнёров, которые ценят и глубокую близость, и здоровую независимость',
          shadow: 'Может потерять опору в бурных, нестабильных отношениях'
        },
        the_embodied_wisdom: {
          name: 'Мудрость через тело',
          description: 'Устойчивое присутствие вместе с хорошим пониманием своих эмоций',
          quality: 'Устойчивость и понимание своих чувств',
          invitation: 'Доверять сигналам своего тела, сохраняя при этом здоровые личные границы',
          coreBelief: 'Моё тело — мудрый проводник. Настоящее понимание приходит, когда разум, чувства и интуиция работают вместе.',
          attracts: 'Тех, кто готов к настоящей, глубокой близости, а не только к поверхностному общению',
          shadow: 'Может слишком сильно проникаться чужими эмоциями'
        },
        the_creative_synthesis: {
          name: 'Творческое соединение',
          description: 'Находит новые способы строить отношения, оставаясь верным себе',
          quality: 'Способность придумывать новое',
          invitation: 'Совмещать новые идеи с уважением к тому, что уже хорошо работает',
          coreBelief: 'Все мои стороны чего-то стоят. Соединяя свои сильные и слабые стороны, я нахожу новые возможности.',
          attracts: 'Людей со схожим взглядом на мир, которые видят в трудностях возможность для творчества',
          shadow: 'Может слишком всё усложнять там, где всё было просто'
        },
        the_tyrant: {
          name: 'Диктатор',
          wound: 'Стремление всё контролировать и неспособность принимать чужую помощь',
          shadow: 'Доминирование и жёсткость',
          invitation: 'Немного отпустить контроль и научиться принимать',
          coreBelief: 'Мир небезопасен. Мне нужно контролировать всё и всех, чтобы защитить себя.',
          attracts: 'Тех, кто бросает вызов его власти, или тех, кто ей легко подчиняется',
          integratedForm: 'Диктатор → Опекающий → Хозяин своих слов'
        },
        the_perfectionist: {
          name: 'Перфекционист',
          wound: 'Жёсткий контроль, за которым прячется глубокая неуверенность в себе',
          shadow: 'Изматывающая самокритика',
          invitation: 'Позволить себе делать что-то «достаточно хорошо», а не идеально',
          coreBelief: 'Я чего-то стою, только если я безупречен(на). Мои ошибки доказывают, что я никчёмен(на).',
          attracts: 'Тех, кто критикует так же, как его внутренний голос, или партнёров, которых он хочет «улучшить»',
          integratedForm: 'Перфекционист → Аналитик → Творческое соединение'
        },
        the_guardian: {
          name: 'Опекающий',
          wound: 'Защищает других, но сам эмоционально закрыт',
          shadow: 'Эмоциональная недоступность',
          invitation: 'Найти безопасность в том, чтобы быть уязвимым и честным в близости',
          coreBelief: 'Любить — значит защищать людей от боли, даже если для этого нужно закрыть собственное сердце.',
          attracts: 'Людей, которые чувствуют себя небезопасно или ждут спасения, — это лишь укрепляет его роль защитника',
          integratedForm: 'Опекающий → Опора → Хозяин своих слов'
        },
        the_sentinel: {
          name: 'Часовой',
          wound: 'Слишком старательно защищает других, оставаясь при этом эмоционально в стороне',
          shadow: 'Сознательная дистанция',
          invitation: 'Заметить, что именно уязвимость открывает дорогу к настоящей близости',
          coreBelief: 'Путает защиту с любовью: если он всех обезопасит, ему не придётся чувствовать собственную уязвимость.',
          attracts: 'Партнёров, которым нужна постоянная защита, — это подтверждает его защитную роль',
          integratedForm: 'Часовой → Мудрость через тело'
        },
        the_tempest: {
          name: 'Буря',
          wound: 'Очень сильные эмоции при избегании настоящей близости',
          shadow: 'Слишком быстрая эмоциональная реакция',
          invitation: 'Найти опору внутри бури и реагировать осознанно, а не на автомате',
          coreBelief: 'Мои эмоции слишком сильные и опасные. Мне нужно оттолкнуть людей, прежде чем я их разрушу.',
          attracts: 'Спокойных партнёров, которых пытается расшевелить, или тревожных партнёров, которые подпитывают драму',
          integratedForm: 'Буря → Дикий → Мудрость через тело'
        },
        the_destroyer: {
          name: 'Разрушитель',
          wound: 'Неконтролируемый эмоциональный взрыв',
          shadow: 'Разрушение без остановки',
          invitation: 'Направить сильную энергию во что-то созидательное',
          coreBelief: 'Если я чувствую угрозу или что меня бросают, мне нужно сжечь всё дотла, чтобы вернуть себе контроль.',
          attracts: 'Партнёров, которые задевают старые раны от расставаний, — так разрушение сбывается само по себе',
          integratedForm: 'Разрушитель → Творческое соединение'
        },
        the_crusader: {
          name: 'Борец за правду',
          wound: 'Борется за идеи, чтобы не сталкиваться с настоящей близостью',
          shadow: 'Цель важнее людей рядом',
          invitation: 'Найти в собственном сердце цель, ради которой стоит гореть',
          coreBelief: 'Если сосредоточиться на великой цели, можно избежать пугающей уязвимости личной близости.',
          attracts: 'Последователей своей идеи или партнёров, готовых стоять на втором плане после его миссии',
          integratedForm: 'Борец за правду → Гибкий в отношениях'
        },
        the_rebel: {
          name: 'Бунтарь',
          wound: 'Отвергает любые правила и авторитеты, даже разумные границы',
          shadow: 'Постоянное противостояние всему и всем',
          invitation: 'Научиться отличать давящий контроль от здоровых правил',
          coreBelief: 'Все правила — это клетка. Если я хоть в чём-то уступлю, то полностью потеряю себя.',
          attracts: 'Тех, против чьего контроля можно бунтовать, или тех, кто восхищается его независимостью',
          integratedForm: 'Бунтарь → Творческое соединение'
        },
        the_ghost: {
          name: 'Призрак',
          wound: 'Полностью уходит от любых эмоций',
          shadow: 'Полная недоступность для других',
          invitation: 'Рискнуть показать себя настоящего, даже если это кажется небезопасным',
          coreBelief: 'Быть увиденным — значит быть уничтоженным. Единственная безопасность — стать полностью незаметным.',
          attracts: 'Тревожных партнёров, которые пытаются его догнать, — это только укрепляет его желание исчезнуть',
          integratedForm: 'Призрак → Ледяная королева → Мудрец'
        },
        the_ice_queen: {
          name: 'Ледяная королева',
          wound: 'Полностью отключается от чувств и держится в стороне от людей',
          shadow: 'Замёрзшее сердце',
          invitation: 'Позволить первой трещине появиться в этой стене и почувствовать тепло близости',
          coreBelief: 'Чувства — это слабость. Эта стена изо льда защищает сердце, которое чувствует слишком сильно.',
          attracts: 'Страстных партнёров, которые пытаются её «растопить», — это только подтверждает, что эмоции опасны',
          integratedForm: 'Ледяная королева → Мудрость через тело'
        },
        the_analyst: {
          name: 'Аналитик',
          wound: 'Чрезмерный анализ мешает по-настоящему проживать происходящее',
          shadow: 'Наблюдает со стороны, не участвуя',
          invitation: 'Войти в жизнь целиком, а не только наблюдать за ней издалека',
          coreBelief: 'Жизнь — это задача, которую безопаснее решать на расстоянии.',
          attracts: 'Эмоциональных партнёров, которых можно изучать, как что-то интересное и непонятное',
          integratedForm: 'Аналитик → Мудрец → Творческое соединение'
        },
        the_anxious_intellectual: {
          name: 'Тревожный интеллектуал',
          wound: 'Чрезмерный анализ вместе со страхом быть по-настоящему увиденным',
          shadow: 'Застревает в размышлениях и не может сдвинуться с места',
          invitation: 'Спуститься из головы в тело, которое умеет чувствовать',
          coreBelief: 'Если как следует продумать свои чувства, можно избежать беспорядка настоящего проживания.',
          attracts: 'Эмоциональных партнёров, которых можно анализировать, или таких же интеллектуалов, избегающих чувств',
          integratedForm: 'Тревожный интеллектуал → Мудрость через тело'
        },
        the_martyr: {
          name: 'Жертвующий собой',
          wound: 'Полностью отказывается от себя ради других',
          shadow: 'Самопожертвование с невысказанной обидой',
          invitation: 'Относиться к своим потребностям так же серьёзно, как к чужим',
          coreBelief: 'Мои потребности не важны. Моя ценность — в том, чтобы жертвовать собой ради других.',
          attracts: 'Тех, кто пользуется его щедростью, не давая ничего взамен',
          integratedForm: 'Жертвующий собой → Связующий → Гибкий в отношениях'
        },
        the_people_pleaser: {
          name: 'Угодник',
          wound: 'Ищет одобрения, постоянно подстраиваясь под других',
          shadow: 'Теряет ощущение того, кто он есть на самом деле',
          invitation: 'Позволить себе кого-то разочаровать сегодня и пережить этот опыт',
          coreBelief: 'Чтобы меня любили, я должен(на) со всеми соглашаться и всем угождать. Настоящий(ая) я не заслуживаю любви.',
          attracts: 'Требовательных партнёров, которые пользуются отсутствием у него границ',
          integratedForm: 'Угодник → Опора → Хозяин своих слов'
        },
        the_sensitive_soul: {
          name: 'Чувствительная душа',
          wound: 'Впитывает чужие эмоции, но боится ими захлебнуться',
          shadow: 'Слишком легко перенимает чужие чувства',
          invitation: 'Выстроить границы, которые уважают и его самого, и других',
          coreBelief: 'Я чувствую всё настолько сильно, будто у меня нет защитной оболочки. Чужие эмоции подавляют меня и определяют, кто я.',
          attracts: 'Эмоционально нестабильных партнёров, чьи чувства он впитывает, или сдержанных партнёров, которых пытается «раскрыть»',
          integratedForm: 'Чувствительная душа → Мудрость через тело'
        },
        the_chameleon: {
          name: 'Хамелеон',
          wound: 'Слишком сильно подстраивается под других, теряя себя',
          shadow: 'Постоянно меняет себя под ситуацию',
          invitation: 'Узнать, какие отношения выдержат, если показать себя настоящего',
          coreBelief: 'Мой настоящий характер не заслуживает любви. Мне нужно становиться тем, кем меня хотят видеть.',
          attracts: 'Партнёров с сильным характером, которые так и не узнают его по-настоящему',
          integratedForm: 'Хамелеон → Гибкий в отношениях'
        },
        the_enchantress: {
          name: 'Обаятельная',
          wound: 'Легко притягивает людей, но избегает обязательств',
          shadow: 'Влюбляет в себя, а потом исчезает',
          invitation: 'Остаться и увидеть, какая красота открывается после первого увлечения',
          coreBelief: 'Я могу привлечь кого угодно, но если подпустить кого-то слишком близко, он увидит, что мне чего-то не хватает. Лучше уйти первой.',
          attracts: 'Партнёров, которым нравится погоня, — это подкрепляет цикл ярких начал и резких концов',
          integratedForm: 'Обаятельная → Притягательная → Гибкий в отношениях'
        },
        the_black_widow: {
          name: 'Расчётливая обольстительница',
          wound: 'Использует привлекательность как способ получить желаемое',
          shadow: 'Близость как способ управлять другими',
          invitation: 'Открыть для себя настоящую близость, без расчёта и выгоды',
          coreBelief: 'Настоящая близость невозможна, поэтому нужно использовать обаяние и манипуляции, чтобы получить своё.',
          attracts: 'Партнёров, которыми легко управлять через обаяние, но которые в итоге легко заменяются',
          integratedForm: 'Расчётливая обольстительница → Хозяин своих слов'
        },
        the_trickster: {
          name: 'Шутник',
          wound: 'Использует юмор и хаос, чтобы не сближаться по-настоящему',
          shadow: 'Всё превращает в шутку',
          invitation: 'Поверить, что искренность не обязательно приведёт к отвержению',
          coreBelief: 'Если оставаться лёгким и развлекать всех вокруг, никто не заметит, как сильно он боится настоящей близости.',
          attracts: 'Партнёров, которым нравится веселье, но которые так и не узнают, кто он на самом деле',
          integratedForm: 'Шутник → Творческое соединение'
        },
        the_siren: {
          name: 'Притягательная',
          wound: 'Легко вызывает сильное влечение, но не может удержать глубину отношений',
          shadow: 'Притягивает внешне, но остаётся поверхностной',
          invitation: 'Понять, что настоящая магия — в устойчивой близости, а первое влечение — лишь её начало',
          coreBelief: 'Моя сила — в загадке и погоне. Если позволить кому-то по-настоящему узнать себя, магия исчезнет.',
          attracts: 'Партнёров, которым важен азарт погони, но не готовых к настоящим отношениям',
          integratedForm: 'Притягательная → Мудрость через тело'
        }
      }
    },
    cabinet: {
      // Header
      personalCabinet: 'Личный кабинет',
      yourSpace: 'Ваше пространство',
      yourSpaceSubtitle: 'Задачи, прогресс, повторные тесты и сохранённые сравнения — всё в одном месте.',
      back: 'Назад',
      // Logged-out CTA
      loginPromptTitle: 'Войдите, чтобы открыть кабинет',
      loginPromptSubtitle: 'Войдите, чтобы увидеть историю, задачи и отчёты сравнения.',
      loginCta: 'Войти',
      // Quick actions
      quickActions: 'Быстрые действия',
      seeUniverse: 'Открыть вселенную',
      retakeTest: 'Пройти заново',
      assignedTasks: 'Назначенные задачи',
      assignedTasksEmpty: 'Скоро — ваш специалист сможет назначать структурированные задачи здесь.',
      // History
      progress: 'Прогресс',
      assessmentHistory: 'История оценок',
      loading: 'Загрузка…',
      pickVersion: 'Выберите версию',
      pickVersionAria: 'Выберите сохранённую версию оценки',
      historyEmpty: 'Истории пока нет. После сохранения результатов здесь появятся ретесты.',
      selected: 'Выбрано',
      downloadVersionBackup: 'Скачать ответы оценки',
      downloadVersionBackupAria: 'Скачать эту версию ответов оценки в виде .txt файла',
      assignTasks: 'Назначить задачи',
      assignTasksBody: 'Назначайте задачу прямо в строке клиента. Это остаётся приватным и помогает превратить просмотр в действие.',
      // Account
      account: 'Аккаунт',
      shareWithSpecialist: 'Поделиться со специалистом',
      shareWithSpecialistBody: 'Скопируйте ваш UID или email и поделитесь им со специалистом.',
      email: 'Email',
      emailNone: 'Нет',
      userId: 'User ID (UID)',
      copy: 'Скопировать',
      copyAccountJson: 'Скопировать JSON аккаунта',
      // Synastries
      pastSynastries: 'Прошлые сравнения',
      savedReports: 'Сохранённые отчёты',
      synastryEmpty: 'Сохранённых отчётов сравнения пока нет. Как только вы его проведёте, отчёт появится здесь.',
      partnerUid: 'UID партнёра',
      updated: 'Обновлено:',
      // Admin
      admin: 'Админ',
      shareAdminAccess: 'Поделиться правами админа',
      shareAdminAccessBody: 'Добавить ещё одного админа по email. (Только для удобства — безопасность обеспечивайте правилами Firebase + custom claims.)',
      adminEmailPlaceholder: 'Email админа',
      addAdmin: 'Добавить админа',
      added: 'Добавлено:',
      remove: 'Удалить',
      // Admin → Мои клиенты (дашборд специалиста)
      myClients: 'Мои клиенты',
      myClientsBody: 'Клиенты, которые поделились с вами своим User ID (UID). Смотрите их последнюю оценку и ведите заметки.',
      addClient: 'Добавить клиента',
      addClientByUid: 'Добавить клиента по User ID',
      addClientHint: 'Вставьте User ID (UID) клиента ниже. Можно также добавить email — так клиента будет проще узнать позже.',
      clientUidLabel: 'User ID (UID) клиента',
      clientUidPlaceholder: 'например, aBcD1234XyZ',
      clientEmailLabel: 'Email клиента (необязательно)',
      clientEmailPlaceholder: 'client@example.com',
      clientNotesLabel: 'Заметки',
      clientNotesPlaceholder: 'Внутренние заметки (видите только вы)…',
      clientTaskLabel: 'Назначенная задача',
      clientTaskPlaceholder: 'Задача для этого клиента (видите только вы)…',
      saveNotes: 'Сохранить заметки',
      assignTask: 'Назначить задачу',
      downloadClientReport: 'Скачать отчёт',
      downloadClientReportAria: 'Скачать ответы клиента на оценку в виде .txt файла',
      viewClientMatrix: 'Матрица',
      viewClientMatrixAria: 'Посмотреть матрицу (визуализацию вселенной) этого клиента',
      viewClientAiReport: 'ИИ-отчёт',
      viewClientAiReportAria: 'Посмотреть сгенерированный ИИ нарратив этого клиента',
      // Метки для содержимого скачиваемого TXT-отчёта. Язык файла
      // определяется текущим языком интерфейса администратора.
      report: {
        title: 'Отчёт об оценке ArchetypeAI',
        clientLabel: 'Клиент',
        clientUidLabel: 'UID клиента',
        clientNoEmail: '(email не указан)',
        completedLabel: 'Завершено',
        scoringMethodLabel: 'Метод оценки',
        scoringDeterministic: 'точный расчёт',
        scoringFallback: 'резервный (ИИ-нарратив недоступен)',
        sectionDimensional: 'Размерные выражения',
        sectionAnswers: 'Все 64 ответа',
        dimAgency: 'Инициативность',
        dimTemperature: 'Эмоциональность',
        dimFocus: 'Фокус',
        dimAttachment: 'Близость и дистанция',
        likertUnanswered: '(не отвечено)',
        likert1: 'Полностью не согласен',
        likert2: 'Не согласен',
        likert3: 'Нейтрально',
        likert4: 'Согласен',
        likert5: 'Полностью согласен',
        agencySection: 'Спектр инициативы',
        temperatureSection: 'Эмоциональная температура',
        focusSection: 'Фокус отношений',
        attachmentSection: 'Стратегия привязанности',
        footer: 'Создано ArchetypeAI',
      },
      removeClient: 'Удалить',
      noClients: 'Пока нет клиентов.',
      noClientsBody: 'Поделитесь своим User ID (UID) с клиентом и попросите его поделиться своим — затем добавьте его здесь по UID.',
      noNotesYet: 'Заметок пока нет',
      clientLastAssessment: 'Последняя оценка:',
      noAssessmentYet: 'Клиент ещё не прошёл оценку',
      specialistViewBadge: 'Просмотр от лица специалиста',
      backToCabinet: 'Назад в кабинет',
      addClientFailed: 'Не удалось добавить клиента',
      removeClientFailed: 'Не удалось удалить клиента',
      saveNotesFailed: 'Не удалось сохранить заметки',
      loadClientsFailed: 'Не удалось загрузить список клиентов',
      addAdminFailed: 'Не удалось добавить админа',
      removeAdminFailed: 'Не удалось удалить админа',
      // Список всех оценок клиента (с кнопкой скачивания для каждой версии).
      clientAllAssessments: 'Все оценки',
      // Автозаполнение UID<->email: статусные сообщения под формой
      // во время поиска, при отсутствии результата или при ошибке.
      clientLookupInProgress: 'Ищу…',
      clientLookupNotFound: 'Пользователь не найден',
      clientLookupError: 'Ошибка поиска'
    },
    // AI report 8-section prompt — see en.aiReport for structure. Russian
    // section titles + body instructions for the legacy 8-section analysis.
    aiReport: {
      section1Title: 'Профиль по осям',
      section1Body: 'Опишите позицию пользователя по четырём осям. Вплетите числа в прозу («Ваша агентность заметно сдвинута к активному полюсу (−0.75), это значит…»). Объясните, что каждая позиция означает в повседневной жизни. Без таблиц.',
      section2Title: 'Основные поведенческие паттерны (архетипы)',
      section2Body: 'Сгруппируйте значимые паттерны по кластерам (дар и тень). Для каждого паттерна: • Описательное имя (например, «тревожно-контрольный паттерн» — НЕ имя собственное с заглавной буквы). • Как проявляется в конкретных жизненных ситуациях. • Внутренняя боль или страх под ним. • Чего паттерн тайно пытается достичь. • Как он взаимодействует с другими паттернами. Дары: кратко, без лести.',
      section3Title: 'Регуляция, границы, связность истории',
      section3_1Title: 'Как вы справляетесь с эмоциями и где они прячутся',
      section3_2Title: 'Границы с другими людьми',
      section3_3Title: 'Насколько цельной ощущается ваша история о себе',
      section4Title: 'Основные психологические защиты',
      section4Body: 'Назовите первичные и вторичные защитные механизмы простым языком (например, «интеллектуализация — это когда вы превращаете боль в логический анализ»). Для каждой — яркая иллюстрация из отношений или работы. Без учебниковых определений.',
      section5Title: 'Основные внутренние комплексы',
      section5Body: 'Опишите каждый обнаруженный комплекс как устойчивый шаблон, организующий восприятие отношений. Свяжите с конкретными значениями и паттернами.',
      section6Title: 'Основные внутренние конфликты',
      section6Body: 'Два-три самых сильных противоречия. Для каждого: покажите обе стороны с конкретными примерами; объясните, чего стоит постоянная борьба; не предлагайте решений.',
      section7Title: 'Что уже работает',
      section7Body: 'Кратко, без лести. Только более здоровые аспекты.',
      section8Title: 'Важно помнить',
      section8Body: 'Без рекомендаций, без призывов к действию. Укажите, что выводы основаны только на анкете; это гипотеза, не диагноз; она может быть уточнена. Закончите спокойно, без пафоса.'
    },
    // AI Coach floating panel — см. en.coach
    coach: {
      characterName: 'Мудрый Наставник',
      title: 'ИИ-коуч',
      closeAria: 'Закрыть панель коуча',
      suggestedQuestionsLabel: '💭 Предложенные вопросы:',
      inputPlaceholder: 'Спросите о чём угодно...',
      // Плейсхолдер режима «Диалог с частями» — подставляется вместо
      // coach.inputPlaceholder, когда переключатель персоны установлен
      // в Parts Dialogue. Живёт под `coach`, а не под `universe`, чтобы
      // переключение персоны было самодостаточным.
      partsModePlaceholder: 'Спросите у Части... (например: «Что чувствует эта часть?»)',
      inputAria: 'Введите сообщение для коуча',
      sendAria: 'Отправить сообщение'
    }
  }
};

// ── SYNASTRY COPY ── static bilingual copy for synastry computations (moved from src/app/core/data/synastry.ts) ──
// EXCEPTION — copy left in adapter (computed with runtime values / template literals):
//   describeResonance() ~line 260, computePolarMap() ~lines 929-1051,
//   computeDyadicAnalysis() ~lines 1103-1125, buildRecapitulation() ~lines 1133-1155,
//   buildContract() ~lines 1157-1197, computeGrowthSequence() ~lines 1226-1266,
//   computeBoundaryInteraction() ~lines 1277-1400, computeCrossPersonTriggers() ~lines 1400-1460

export const PURSUE_WITHDRAW_1 = {
  pattern: 'pursue-withdraw',
  descriptionEn: 'The classic pursue-withdraw cycle: Person 1 seeks closeness while Person 2 creates distance. This is the most common dysfunctional pattern — and also the one with the greatest growth potential.',
  descriptionRu: 'Знакомый многим цикл «догоняю–убегаю»: Первый тянется к близости, а Второй в ответ отдаляется. Это самый частый непростой сценарий в отношениях — и вместе с тем тот, где больше всего возможностей для роста.',
  cycleEn: 'Person 1 reaches out → Person 2 feels engulfed and withdraws → Person 1 feels abandoned and pursues harder → Person 2 feels more overwhelmed and withdraws further → repeat',
  cycleRu: 'Первый делает шаг навстречу → Второй чувствует, что на него давят, и отстраняется → Первый чувствует себя покинутым и старается ещё настойчивее → Второму становится ещё тяжелее, и он отдаляется сильнее → цикл повторяется',
  deactivationEn: 'The key: Person 1 practices self-soothing instead of pursuing. Person 2 practices reaching out before retreating. Both learn that space and closeness can coexist.',
  deactivationRu: 'Что помогает: Первому — учиться справляться со своим беспокойством самому, не догоняя. Второму — делать шаг навстречу до того, как захочется отстраниться. Обоим стоит понять, что близость и личное пространство прекрасно уживаются вместе.',
} as const;

export const PURSUE_WITHDRAW_2 = {
  pattern: 'pursue-withdraw',
  descriptionEn: 'The classic pursue-withdraw cycle reversed: Person 2 seeks closeness while Person 1 creates distance. Growth comes from recognizing this dance.',
  descriptionRu: 'Тот же цикл «догоняю–убегаю», только в обратную сторону: Второй ищет близости, а Первый держит дистанцию. Заметить этот сценарий — уже первый шаг к переменам.',
  cycleEn: 'Person 2 reaches out → Person 1 feels engulfed and withdraws → Person 2 feels abandoned and pursues harder → Person 1 withdraws further → repeat',
  cycleRu: 'Второй делает шаг навстречу → Первый чувствует давление и отстраняется → Второй чувствует себя покинутым и старается сильнее → Первый отдаляется ещё больше → цикл повторяется',
  deactivationEn: 'The key: Person 2 practices self-soothing. Person 1 practices reaching out before retreating. Both learn that space and closeness can coexist.',
  deactivationRu: 'Что помогает: Второму — учиться справляться со своим беспокойством самому. Первому — делать шаг навстречу до того, как захочется отстраниться. Обоим стоит понять, что близость и личное пространство прекрасно уживаются вместе.',
} as const;

export const MUTUAL_ESCALATION = {
  pattern: 'mutual-escalation',
  descriptionEn: 'Both partners have anxious attachment — creating a feedback loop of emotional intensity. Every feeling is amplified, every slight is a catastrophe.',
  descriptionRu: 'Оба партнёра склонны сильно тревожиться в отношениях — из-за этого эмоции по кругу усиливают друг друга. Каждое чувство становится ярче, а любая мелочь ощущается как катастрофа.',
  cycleEn: 'Both feel insecure → both pursue reassurance → emotions escalate → overwhelm → cling tighter → exhaustion → brief withdrawal → panic → pursue again',
  cycleRu: 'Оба чувствуют неуверенность → оба ищут подтверждения любви → эмоции разгораются всё сильнее → наступает перегруз → оба цепляются друг за друга ещё крепче → истощение → короткая пауза → паника → снова тянутся друг к другу',
  deactivationEn: 'Each partner must develop self-soothing capacity. The relationship needs external support (therapy, community) to break the escalation spiral.',
  deactivationRu: 'Каждому важно научиться самому справляться со своим беспокойством. Отношениям может понадобиться помощь со стороны — терапия или поддержка близких, — чтобы разорвать этот замкнутый круг.',
} as const;

export const DEEP_FREEZE = {
  pattern: 'deep-freeze',
  descriptionEn: 'Both partners are avoidant — creating a relationship characterized by parallel lives, emotional distance, and unspoken loneliness.',
  descriptionRu: 'Оба партнёра склонны держать дистанцию в отношениях — из-за этого жизнь превращается в две параллельные линии с эмоциональной дистанцией и тихим, невысказанным одиночеством.',
  cycleEn: 'Both withdraw → relationship becomes functional but lifeless → loneliness builds → one person reaches out awkwardly → vulnerability feels dangerous → withdraw again',
  cycleRu: 'Оба отдаляются → отношения держатся, но в них не остаётся тепла → одиночество нарастает → кто-то неловко пытается сблизиться → открытость кажется опасной → снова отстранение',
  deactivationEn: 'Someone has to go first — risk vulnerability in small, safe doses. Couples therapy is strongly recommended to create a structured container for emotional expression.',
  deactivationRu: 'Кому-то нужно сделать первый шаг — рискнуть быть немного более открытым, начиная с малого и безопасного. Парная терапия может сильно помочь создать безопасное пространство для разговора о чувствах.',
} as const;

export const VOLATILE_BOND = {
  pattern: 'volatile-bond',
  descriptionEn: 'At least one partner has disorganized attachment — creating unpredictable swings between intense closeness and sudden withdrawal. The relationship feels like an emotional rollercoaster.',
  descriptionRu: 'У одного из партнёров, а иногда у обоих, привязанность смешанного типа — из-за этого отношения раскачиваются между сильной близостью и внезапным отстранением. Это похоже на эмоциональные американские горки.',
  cycleEn: 'Intense connection → one partner gets triggered → sudden withdrawal or eruption → the other partner is confused and hurt → guilt and repair attempt → brief closeness → trigger again',
  cycleRu: 'Сильная близость → что-то задевает одного из партнёров → он резко отстраняется или срывается → другой в растерянности и боли → чувство вины и попытка всё уладить → недолгая близость → снова что-то задевает',
  deactivationEn: 'Both partners need individual therapeutic support. The disorganized partner needs to develop earned security. Patience and professional guidance are essential.',
  deactivationRu: 'Обоим партнёрам может помочь личная работа с психологом. Партнёру со смешанным типом привязанности особенно важно постепенно нарабатывать ощущение устойчивости и безопасности. Здесь очень важны терпение и поддержка специалиста.',
} as const;

export const HEALING_CONTAINER = {
  pattern: 'healing-container',
  descriptionEn: 'One or both partners have done significant relational work, creating a container where both can heal. This is the foundation for conscious relationship.',
  descriptionRu: 'Один или оба партнёра много работали над собой — и вместе создали пространство, где обоим спокойно и можно залечивать старые раны. Это хорошая основа для осознанных, зрелых отношений.',
  cycleEn: 'Secure base → triggers arise → they are met with compassion → both regulate → deeper understanding → repair strengthens trust → repeat with greater ease',
  cycleRu: 'Есть ощущение опоры друг в друге → возникает что-то трудное → оба реагируют с сочувствием → каждый справляется со своей реакцией → приходит более глубокое понимание → примирение укрепляет доверие → в следующий раз всё даётся легче',
  deactivationEn: 'Continue deepening the practice. The work is never done — but it gets easier and more rewarding over time.',
  deactivationRu: 'Продолжайте в том же духе. Такая работа никогда полностью не заканчивается — но со временем она становится легче и приносит всё больше радости.',
} as const;

export const PARALLEL_SOVEREIGNTY = {
  pattern: 'parallel-sovereignty',
  descriptionEn: 'Two secure individuals choosing each other from inner wholeness. The rarest and most sustainable relational pattern.',
  descriptionRu: 'Два человека со спокойным, устойчивым отношением к близости выбирают друг друга, уже будучи цельными сами по себе. Самый редкий и самый прочный формат отношений.',
  cycleEn: 'Both feel complete → they choose to connect → vulnerability is safe → differences are explored with curiosity → repair is quick and natural → mutual growth',
  cycleRu: 'Оба чувствуют себя цельными → выбирают быть вместе → быть открытым не страшно → различия вызывают любопытство, а не тревогу → примирение происходит быстро и естественно → рост идёт для обоих',
  deactivationEn: 'The invitation is to go even deeper — from security to alchemy, from individual wholeness to co-creation.',
  deactivationRu: 'Здесь есть куда расти дальше: от устойчивости — к настоящей глубине вместе, от цельности каждого — к тому, что вы создаёте общего.',
} as const;

export const PROJECTION_MATRIX: Record<string, Record<string, { mechanismEn: string; mechanismRu: string; healingEn: string; healingRu: string }>> = {
  control_shadows: {
    emotional_storm_shadows: {
      mechanismEn: 'You project your disowned chaos onto their emotional intensity',
      mechanismRu: 'Вы проецируете на них собственную подавленную хаотичность — их эмоциональность кажется вам угрозой',
      healingEn: 'Reclaiming your own passion will stop seeing their emotion as a threat',
      healingRu: 'Вернув себе право на страсть, вы перестанете воспринимать чужие эмоции как опасность',
    },
    anxious_connection_shadows: {
      mechanismEn: 'You project your disowned vulnerability onto their need for connection',
      mechanismRu: 'Вы проецируете на них собственную запретную уязвимость — их потребность в близости вас раздражает',
      healingEn: 'Acknowledging your own need for love will help you see their reaching as courage and trust',
      healingRu: 'Признав собственную потребность в любви, вы увидите в их тяге к вам смелость и доверие',
    },
    disorganized_attachment_shadows: {
      mechanismEn: 'Their unpredictability threatens your need for order and control',
      mechanismRu: 'Их непредсказуемость угрожает вашей потребности всё держать под контролем',
      healingEn: 'Learning that chaos can be a generative force',
      healingRu: 'Открытие для себя, что хаос бывает созидательной силой',
    },
    avoidant_intellectual_shadows: {
      mechanismEn: 'Their detachment mirrors your own emotional walls — you project rigidity onto their need for space',
      mechanismRu: 'Их отстранённость напоминает вам о ваших собственных эмоциональных стенах — их потребность в пространстве кажется вам холодностью',
      healingEn: 'Recognizing that not everyone who distances is controlling — some are simply protecting themselves differently',
      healingRu: 'Важно понять: не каждый, кто держит дистанцию, пытается вами управлять — иногда это просто другой способ себя защитить',
    },
    seductive_avoidance_shadows: {
      mechanismEn: 'Their charm threatens your need for predictability — you project manipulation onto their playfulness',
      mechanismRu: 'Их обаяние угрожает вашей потребности в предсказуемости — вы проецируете манипуляцию на их игривость',
      healingEn: 'Allowing some uncertainty into your controlled world can be liberating',
      healingRu: 'Допустить немного неопределённости в свой контролируемый мир может оказаться освобождающим',
    },
    gift_archetypes: {
      mechanismEn: 'Their emotional freedom threatens your identity built on vigilance — you may try to "fix" what isn\'t broken',
      mechanismRu: 'Их эмоциональная свобода вызывает у вас беспокойство, ведь вы привыкли всё держать под контролем, — вам хочется «исправить» то, что на самом деле в порядке',
      healingEn: 'Letting go of the protector role allows you to discover who you are without the armor',
      healingRu: 'Отпустить роль защитника позволяет вам обнаружить, кто вы без брони',
    },
    control_shadows: {
      mechanismEn: 'You see your own control reflected back — a battle for dominance where neither yields',
      mechanismRu: 'Вы видите в партнёре отражение своей же потребности всё контролировать — получается спор за главенство, где никто не хочет уступать',
      healingEn: 'Shared control is the foundation of genuine partnership',
      healingRu: 'Разделённый контроль — фундамент подлинного партнёрства',
    },
  },
  emotional_storm_shadows: {
    control_shadows: {
      mechanismEn: 'You project your disowned discipline onto their rigid control',
      mechanismRu: 'Вы проецируете на них собственную отвергнутую дисциплину — их контроль кажется вам удушающим',
      healingEn: 'Developing your own internal structure will reduce the need to fight theirs',
      healingRu: 'Выстроив собственную внутреннюю структуру, вы перестанете нуждаться в борьбе с чужой',
    },
    avoidant_intellectual_shadows: {
      mechanismEn: 'Their coldness triggers your deepest fear of being unseen',
      mechanismRu: 'Их сдержанность задевает ваш самый глубокий страх — остаться незамеченным',
      healingEn: 'Learning to self-validate reduces the dependence on their emotional response',
      healingRu: 'Научившись опираться на себя, вы перестанете зависеть от их эмоциональных реакций',
    },
    anxious_connection_shadows: {
      mechanismEn: 'Their neediness amplifies your own intensity — together you create emotional firestorms',
      mechanismRu: 'Их потребность в вас усиливает и без того сильные эмоции — вместе вы легко раскачиваете друг друга',
      healingEn: 'Both partners need to develop self-soothing and stop co-regulating through escalation',
      healingRu: 'Обоим важно развивать саморегуляцию и перестать раскачивать друг друга эскалацией',
    },
    seductive_avoidance_shadows: {
      mechanismEn: 'Their elusiveness triggers your deepest abandonment wound — the harder they run, the harder you pursue',
      mechanismRu: 'Их неуловимость пробуждает вашу самую глубокую рану покинутости — чем дальше они бегут, тем сильнее вы преследуете',
      healingEn: 'The chase will never bring the safety you seek — only self-regulation can',
      healingRu: 'Погоня никогда не принесёт безопасности, которую вы ищете — только саморегуляция может',
    },
    gift_archetypes: {
      mechanismEn: 'Their calm feels like indifference — you project rejection onto their hard-won peace',
      mechanismRu: 'Их спокойствие ощущается как равнодушие, хотя это, скорее всего, не так',
      healingEn: 'Trusting that calm does not mean absence of feeling',
      healingRu: 'Доверять: спокойствие не означает отсутствие чувств',
    },
    emotional_storm_shadows: {
      mechanismEn: 'You amplify each other\'s emotions — every feeling becomes a shared hurricane',
      mechanismRu: 'Вы усиливаете эмоции друг друга — любое чувство быстро превращается в общую бурю',
      healingEn: 'Building individual emotional capacity so you can hold space for each other without drowning together',
      healingRu: 'Стоит научиться справляться с сильными эмоциями по отдельности — тогда вы сможете поддерживать друг друга, не утягивая друг друга на дно',
    },
    disorganized_attachment_shadows: {
      mechanismEn: 'Their unpredictability feeds your intensity while your intensity triggers their flight response',
      mechanismRu: 'Их непредсказуемость подпитывает ваши и без того сильные эмоции, а ваша эмоциональность заставляет их убегать ещё дальше',
      healingEn: 'Creating predictable emotional rituals can ground both partners',
      healingRu: 'Создание предсказуемых эмоциональных ритуалов может заземлить обоих партнёров',
    },
  },
  avoidant_intellectual_shadows: {
    emotional_storm_shadows: {
      mechanismEn: 'Their intensity mirrors everything you have exiled from your emotional world',
      mechanismRu: 'Их яркие эмоции напоминают вам о том, что вы когда-то давно решили в себе не замечать',
      healingEn: 'Feeling your own feelings will stop making theirs feel so threatening',
      healingRu: 'Когда вы начнёте проживать собственные чувства, чужие перестанут казаться угрозой',
    },
    anxious_connection_shadows: {
      mechanismEn: 'Their neediness triggers your fear of engulfment — you see boundaries as necessary armor',
      mechanismRu: 'Их потребность в вас пробуждает страх раствориться в отношениях без остатка — границы кажутся единственной защитой',
      healingEn: 'Allowing yourself to need someone, even slightly, will dissolve the wall',
      healingRu: 'Позволив себе хоть немного нуждаться в другом, вы растворите стену',
    },
    control_shadows: {
      mechanismEn: 'Their rigidity makes your detachment feel justified — together you create an emotional desert',
      mechanismRu: 'Их жёсткость как будто оправдывает вашу отстранённость — вместе вы легко создаёте эмоциональную пустоту',
      healingEn: 'Someone has to feel first — let it be you',
      healingRu: 'Кому-то нужно почувствовать первым — пусть это будете вы',
    },
    seductive_avoidance_shadows: {
      mechanismEn: 'Their charm masks the same avoidance you intellectualize — you compete in distance',
      mechanismRu: 'За их обаянием прячется то же самое избегание близости, которое вы просто объясняете себе по-другому, — вы будто соревнуетесь, кто сохранит бо́льшую дистанцию',
      healingEn: 'Drop the analysis and the mask — both prevent genuine connection',
      healingRu: 'Отбросьте анализ и маску — оба мешают подлинной связи',
    },
    gift_archetypes: {
      mechanismEn: 'Their emotional presence highlights what you have walled off — you may intellectualize their warmth as naivety',
      mechanismRu: 'Их эмоциональность подсвечивает то, что вы в себе закрыли, — и вам легко списать их теплоту на наивность',
      healingEn: 'Feeling is the missing half of your intelligence',
      healingRu: 'Способность чувствовать — недостающая половина вашего интеллекта',
    },
    avoidant_intellectual_shadows: {
      mechanismEn: 'Your mutual avoidance creates a relationship that exists only in the mind — bodies in the same room, hearts in different galaxies',
      mechanismRu: 'Из-за взаимного избегания близости отношения существуют скорее в голове, чем на деле — вы физически рядом, но каждый как будто сам по себе',
      healingEn: 'Risk naming one feeling out loud — one of the ones that usually go unnamed',
      healingRu: 'Рискните назвать вслух одно чувство — из тех, что обычно остаются неназванными',
    },
    disorganized_attachment_shadows: {
      mechanismEn: 'Their push-pull dynamic overwhelms your carefully maintained distance — their chaos threatens your fortress of solitude',
      mechanismRu: 'Их привычка то приближаться, то отдаляться ломает вашу тщательно выстроенную дистанцию — их непредсказуемость угрожает вашему привычному одиночеству',
      healingEn: 'Staying present through their intensity without retreating builds tolerance for emotional complexity',
      healingRu: 'Оставаться рядом, не отступая, даже когда трудно, — так постепенно растёт способность выдерживать сильные чувства',
    },
  },
  anxious_connection_shadows: {
    avoidant_intellectual_shadows: {
      mechanismEn: 'Their withdrawal confirms your core belief that you are unlovable',
      mechanismRu: 'Их отстранение как будто подтверждает ваше глубокое убеждение: «Меня невозможно любить»',
      healingEn: 'Building self-worth independent of their response breaks the projection',
      healingRu: 'Опора на собственную ценность — независимо от их реакций — разрушит эту проекцию',
    },
    control_shadows: {
      mechanismEn: 'Their control feels like the caregiving you never received — both familiar and painful',
      mechanismRu: 'Их контроль одновременно напоминает заботу, которой вам не хватало, и причиняет боль',
      healingEn: 'Learning to see the difference between love and control',
      healingRu: 'Важно видеть разницу между любовью и контролем',
    },
    emotional_storm_shadows: {
      mechanismEn: 'Their emotional intensity feeds your need for validation through chaos — you mistake drama for closeness',
      mechanismRu: 'Их сильные эмоции подпитывают вашу потребность в постоянных подтверждениях любви — вы путаете накал страстей с настоящей близостью',
      healingEn: 'Closeness does not require crisis — learning to feel connected in stillness',
      healingRu: 'Близость не требует кризиса — учитесь чувствовать связь в тишине',
    },
    seductive_avoidance_shadows: {
      mechanismEn: 'Their charm and withdrawal activates your deepest abandonment wound — the most addictive and painful dance',
      mechanismRu: 'Их обаяние вперемешку с отстранением задевает ваш самый глубокий страх быть брошенным — сочетание, к которому легко привыкнуть, и очень болезненное',
      healingEn: 'The one who charms and leaves repeats an old pattern — your healing will look different',
      healingRu: 'Тот, кто очаровывает и уходит, повторяет давний паттерн — исцеление выглядит иначе',
    },
    gift_archetypes: {
      mechanismEn: 'Their secure presence feels suspicious — you project unreliability onto their consistency',
      mechanismRu: 'Их надёжность кажется подозрительной — трудно поверить, что кто-то может быть настолько постоянным',
      healingEn: 'Trusting that consistency is real and here to stay',
      healingRu: 'Доверять: постоянство бывает настоящим, это не прелюдия к покинутости',
    },
    anxious_connection_shadows: {
      mechanismEn: 'You mirror each other\'s neediness — a feedback loop of reassurance-seeking that never fully soothes',
      mechanismRu: 'Вы оба одинаково нуждаетесь в подтверждении любви — получается замкнутый круг, который никогда до конца не успокаивает',
      healingEn: 'Developing individual self-worth breaks the cycle of mutual reassurance dependency',
      healingRu: 'Развитие индивидуальной самоценности разрывает цикл взаимной зависимости от подтверждений',
    },
    disorganized_attachment_shadows: {
      mechanismEn: 'Their push-pull triggers both your hope and your terror — you try to "heal" them through love',
      mechanismRu: 'Их непредсказуемость — то ближе, то дальше — вызывает у вас и надежду, и страх, и вам хочется «исцелить» их своей любовью',
      healingEn: 'You cannot love someone into security — that work is theirs alone',
      healingRu: 'Нельзя полюбить кого-то в безопасность — эта работа только их',
    },
  },
  seductive_avoidance_shadows: {
    anxious_connection_shadows: {
      mechanismEn: 'Their genuine need terrifies your commitment-phobic soul',
      mechanismRu: 'Их искренняя потребность в вас пугает — вам трудно брать на себя обязательства',
      healingEn: 'Distinguishing between being trapped and being chosen',
      healingRu: 'Научитесь различать ловушку и настоящий выбор',
    },
    control_shadows: {
      mechanismEn: 'Their rigidity triggers your rebellion — you perform freedom while secretly wanting structure',
      mechanismRu: 'Их жёсткость провоцирует вас на бунт — вы демонстрируете свободу, хотя в глубине души хотите опоры',
      healingEn: 'Admitting you want commitment will stop the seductive dance',
      healingRu: 'Честно признавшись себе в желании обязательств, вы перестанете вести соблазняющую игру',
    },
    emotional_storm_shadows: {
      mechanismEn: 'Their intensity both attracts and overwhelms you — you charm to create distance while craving the heat',
      mechanismRu: 'Их сильные эмоции вас и притягивают, и подавляют — вы используете обаяние, чтобы держать дистанцию, хотя внутри хотите тепла',
      healingEn: 'Staying present after the charm wears off is where real intimacy begins',
      healingRu: 'Остаться после того, как обаяние спадёт — здесь начинается настоящая близость',
    },
    avoidant_intellectual_shadows: {
      mechanismEn: 'You compete in avoidance through different strategies — charm versus intellect — both running from vulnerability',
      mechanismRu: 'Вы оба избегаете близости, просто по-разному — один через обаяние, другой через рассуждения, — но оба бежите от того, чтобы быть по-настоящему уязвимым',
      healingEn: 'Both of you need to risk being truly seen — deeper than admiration or understanding',
      healingRu: 'Обоим нужно рискнуть быть по-настоящему увиденным — глубже восхищения и понимания',
    },
    gift_archetypes: {
      mechanismEn: 'Their authenticity threatens your carefully curated persona — you feel exposed without your mask',
      mechanismRu: 'Их искренность угрожает вашему тщательно выстроенному образу — без него вы чувствуете себя незащищённым',
      healingEn: 'The mask is exhausting — let it drop and discover you are enough without the performance',
      healingRu: 'Маска изматывает — позвольте ей упасть и обнаружьте: вы достаточно и без представления',
    },
    seductive_avoidance_shadows: {
      mechanismEn: 'A mutual fascination that becomes a hall of mirrors — both performing, neither arriving',
      mechanismRu: 'Взаимное притяжение превращается в бесконечную игру отражений — оба играют роль, и никто по-настоящему не открывается',
      healingEn: 'Someone must go first — drop the act and reveal the real',
      healingRu: 'Кто-то должен быть первым — отбросьте игру и откройте настоящее',
    },
    disorganized_attachment_shadows: {
      mechanismEn: 'Their push-pull is catnip for your chase instinct — together you create an infinite loop of approach and retreat',
      mechanismRu: 'Их манера то приближаться, то отдаляться моментально включает в вас азарт погони — вместе вы создаёте бесконечный цикл сближения и отступления',
      healingEn: 'Breaking the loop requires choosing to stay when you want to run, and running when you want to chase',
      healingRu: 'Разорвать петлю — значит выбрать остаться, когда хочется бежать, и бежать, когда хочется преследовать',
    },
  },
  disorganized_attachment_shadows: {
    gift_archetypes: {
      mechanismEn: 'Their stability feels alien and suspicious — you project mistrust onto their kindness',
      mechanismRu: 'Их стабильность кажется вам непривычной — трудно поверить, что их доброта не скрывает подвоха',
      healingEn: 'Allowing yourself to trust that this safety is real',
      healingRu: 'Попробуйте поверить: безопасность бывает настоящей, и не всё, что хорошо — западня',
    },
    control_shadows: {
      mechanismEn: 'Their control both terrifies and attracts you — recreating the original inconsistent caregiving',
      mechanismRu: 'Их контроль одновременно пугает и притягивает вас — он напоминает непредсказуемую заботу, знакомую с детства',
      healingEn: 'Recognizing the pattern and choosing to stay present and respond deliberately',
      healingRu: 'Узнавание этого паттерна — и выбор оставаться в настоящем и отвечать осознанно',
    },
    emotional_storm_shadows: {
      mechanismEn: 'Their emotional volatility activates both your longing and your terror — you cannot decide whether to move toward or away',
      mechanismRu: 'Их переменчивое настроение вызывает у вас и сильное желание быть рядом, и страх — вы не можете решить, приблизиться или отстраниться',
      healingEn: 'Learning to hold both impulses simultaneously without acting on either',
      healingRu: 'Научиться удерживать оба импульса одновременно, не действуя ни по одному из них',
    },
    avoidant_intellectual_shadows: {
      mechanismEn: 'Their distance triggers your fear of abandonment while their presence triggers your fear of engulfment — a double bind',
      mechanismRu: 'Когда они рядом, вам страшно раствориться в отношениях, а когда далеко — страшно быть покинутым: и то, и другое пугает',
      healingEn: 'Finding the narrow path between too close and too far — your window of tolerance',
      healingRu: 'Постепенно находить для себя ту меру близости, при которой не страшно ни слишком приблизиться, ни слишком отдалиться',
    },
    anxious_connection_shadows: {
      mechanismEn: 'Their need for closeness triggers your approach-avoidance — you want to give but fear being consumed',
      mechanismRu: 'Их потребность в близости включает в вас внутренний спор: подойти или отстраниться — вы хотите дать им то, что нужно, но боитесь потерять себя',
      healingEn: 'Taking space is not yet leaving — learn to communicate the need before fleeing',
      healingRu: 'Потребность в пространстве — ещё не уход. Учитесь сообщать о ней до того, как рука потянется к двери',
    },
    seductive_avoidance_shadows: {
      mechanismEn: 'Their seductive withdrawal is both irresistible and terrifying — the perfect trigger for your approach-avoidance pattern',
      mechanismRu: 'Их манера привлекать и отдаляться одновременно и притягивает вас, и пугает — это точно попадает в вашу собственную привычку то приближаться, то убегать',
      healingEn: 'Recognizing the pattern as repetition you can work with',
      healingRu: 'Увидеть в этом паттерне повторение, с которым можно работать',
    },
    disorganized_attachment_shadows: {
      mechanismEn: 'Together you create a storm of mutual approach-avoidance — both craving and fleeing simultaneously',
      mechanismRu: 'Вместе вы создаёте настоящий шторм: оба одновременно хотите близости и убегаете от неё',
      healingEn: 'Both partners need individual therapeutic support before this dynamic can heal',
      healingRu: 'Обоим партнёрам нужна индивидуальная терапевтическая поддержка, прежде чем эта динамика сможет исцелиться',
    },
  },
  gift_archetypes: {
    disorganized_attachment_shadows: {
      mechanismEn: 'Their chaos challenges your hard-won balance — you may feel responsible for fixing them',
      mechanismRu: 'Их непредсказуемость угрожает вашему с трудом обретённому равновесию — возникает соблазн взять на себя роль их спасителя',
      healingEn: 'Remembering that you cannot heal another — only hold space with compassion',
      healingRu: 'Помните: вы не можете исцелить другого — только бережно держать для него пространство',
    },
    control_shadows: {
      mechanismEn: 'Their rigidity tests your acceptance — you may project your own unresolved need for control onto them',
      mechanismRu: 'Их жёсткость проверяет ваше терпение — вы можете невольно спроецировать на них собственную непроработанную потребность в контроле',
      healingEn: 'Accepting that others\u2019 defenses are their own path — yours is to hold space with compassion',
      healingRu: 'Принять, что то, как другой человек защищается, — это его собственный путь, а не то, что вам нужно исправлять',
    },
    emotional_storm_shadows: {
      mechanismEn: 'Their emotional volatility invites you to practice the compassion you\'ve learned — or reveals where your equanimity is still fragile',
      mechanismRu: 'Их резкая смена настроений даёт вам возможность попрактиковать сочувствие, которому вы учились, — а иногда показывает, что ваше собственное спокойствие ещё не такое прочное',
      healingEn: 'Staying grounded in their storm is the advanced course in your continued growth',
      healingRu: 'Сохранять устойчивость рядом с их бурей — хорошая практика для вашего дальнейшего роста',
    },
    avoidant_intellectual_shadows: {
      mechanismEn: 'Their emotional absence tests your patience — you may try to "awaken" feelings they have carefully walled off',
      mechanismRu: 'Их эмоциональная сдержанность проверяет ваше терпение — вам может хотеться «разбудить» в них чувства, которые они старательно скрывают',
      healingEn: 'Your warmth can sound like an invitation — let them come at their own pace',
      healingRu: 'Ваша теплота может звучать как приглашение — позвольте им идти в своём темпе',
    },
    anxious_connection_shadows: {
      mechanismEn: 'Their neediness tests the boundaries you\'ve worked so hard to establish — can you give without losing yourself?',
      mechanismRu: 'Их потребность в вас проверяет границы, которые вы так упорно выстраивали, — получится ли давать, не теряя себя?',
      healingEn: 'Your generosity is a gift. Keeping your own center is what allows true giving',
      healingRu: 'Ваша щедрость — дар. Сохраняя собственный центр, вы отдаёте по-настоящему',
    },
    seductive_avoidance_shadows: {
      mechanismEn: 'Their charm tests whether you can see through performance to the pain beneath — your clarity is your gift here',
      mechanismRu: 'Их обаяние проверяет, способны ли вы разглядеть за красивым фасадом настоящую боль, — ваша способность видеть суть здесь особенно ценна',
      healingEn: 'Seeing through the mask without judgment — your presence invites them to take it off',
      healingRu: 'Видеть за маской настоящего человека, без осуждения, — уже само по себе приглашение её снять',
    },
    gift_archetypes: {
      mechanismEn: 'Two whole people together — the projection here is minimal, but watch for co-dependence in healing',
      mechanismRu: 'Два уравновешенных человека вместе — недопониманий минимум, но стоит следить, чтобы забота друг о друге не превратилась в излишнюю зависимость',
      healingEn: 'Continue growing individually so the relationship remains a conscious choice between two people',
      healingRu: 'Продолжайте расти каждый сам по себе — тогда отношения остаются осознанным выбором двоих',
    },
  },
};

export const RELATIONAL_ARCHETYPES = [
  {
    nameEn: 'The Alchemical Marriage', nameRu: 'Взаимное преображение',
    symbol: '⚗️',
    descriptionEn: 'A relationship that transforms both partners through the heat of their differences. The friction itself is the catalyst for individuation.',
    descriptionRu: 'Отношения, в которых разница между партнёрами меняет их обоих. Само трение между вами становится тем, что помогает каждому лучше понять себя.',
    invitationEn: 'To trust that the discomfort is the medicine',
    invitationRu: 'Довериться: этот дискомфорт и есть то, что помогает расти',
    shadowEn: 'Can become addicted to the transformation and avoid the peace that follows healing',
    shadowRu: 'Риск привыкнуть к постоянным переменам и начать избегать спокойствия, которое приходит после того, как всё уладилось',
  },
  {
    nameEn: 'The Sanctuary', nameRu: 'Надёжное убежище',
    symbol: '🏛️',
    descriptionEn: 'Two healed individuals creating a sacred container for mutual growth. Safety is the foundation from which everything else emerges.',
    descriptionRu: 'Два человека, каждый из которых уже во многом разобрался с собой, создают вместе безопасное пространство для общего роста. Эта безопасность — основа для всего остального.',
    invitationEn: 'To go even deeper together — from healing to co-creation',
    invitationRu: 'Идти ещё глубже вместе — от заботы друг о друге к тому, что вы создаёте вдвоём',
    shadowEn: 'Can become complacent, mistaking comfort for true intimacy',
    shadowRu: 'Риск расслабиться настолько, что комфорт подменит собой настоящую близость',
  },
  {
    nameEn: 'The Crucible', nameRu: 'Испытание огнём',
    symbol: '🔥',
    descriptionEn: 'An intense bond that brings each partner\'s deepest wounds to the surface. Not for the faint of heart, but profoundly transformative.',
    descriptionRu: 'Сильная связь, которая выводит на поверхность самые глубокие уязвимые места каждого. Это непросто выдержать — но именно здесь происходят настоящие перемены.',
    invitationEn: 'To remember that the pain is part of the path',
    invitationRu: 'Помнить, что боль — тоже часть пути',
    shadowEn: 'Can become defined by suffering, confusing pain with depth',
    shadowRu: 'Риск начать определять себя через страдание, перепутав боль с глубиной чувств',
  },
  {
    nameEn: 'The Mirror Chamber', nameRu: 'Зеркало друг для друга',
    symbol: '🪞',
    descriptionEn: 'Each partner perfectly mirrors the other\'s shadow — making this relationship the most powerful growth vehicle and the most uncomfortable.',
    descriptionRu: 'Каждый партнёр как в зеркале видит в другом свои же слепые пятна — поэтому такие отношения сильнее всего помогают расти, и именно поэтому в них бывает так некомфортно.',
    invitationEn: 'To thank them for showing you what you cannot see in yourself',
    invitationRu: 'Быть благодарным за то, что партнёр показывает вам то, что вы сами в себе не замечаете',
    shadowEn: 'Endless mutual projection without taking responsibility',
    shadowRu: 'Риск бесконечно винить друг друга в своих же особенностях, так и не взяв на себя ответственность',
  },
  {
    nameEn: 'The Bridge Builders', nameRu: 'Строители мостов',
    symbol: '🌉',
    descriptionEn: 'Partners from different emotional worlds who choose to build connection across the gap. Every bridge is a triumph of love over fear.',
    descriptionRu: 'Партнёры с очень разным отношением к чувствам, которые всё равно стараются найти общий язык. Каждая такая попытка — маленькая победа любви над страхом.',
    invitationEn: 'To celebrate the effort itself, regardless of the result',
    invitationRu: 'Ценить сами старания — независимо от результата',
    shadowEn: 'Can exhaust themselves building bridges without ever crossing them',
    shadowRu: 'Риск вымотать себя постоянными попытками сблизиться, так и не почувствовав настоящей близости',
  },
  {
    nameEn: 'The Spiral Dance', nameRu: 'Движение по спирали',
    symbol: '🌀',
    descriptionEn: 'A relationship that revisits the same patterns at ever-deeper levels. Progress moves in spirals, each loop deeper than the last.',
    descriptionRu: 'Отношения, в которых одни и те же ситуации повторяются, но каждый раз немного по-другому и немного глубже. Изменения тут идут не по прямой, а по спирали.',
    invitationEn: 'To recognize that the path spirals inward, loop by loop',
    invitationRu: 'Заметить: вы не ходите по кругу — вы медленно продвигаетесь вглубь, виток за витком',
    shadowEn: 'Can lose hope thinking nothing ever changes',
    shadowRu: 'Риск потерять надежду, решив, что ничего не меняется',
  },
  {
    nameEn: 'The Quiet Revolution', nameRu: 'Тихие перемены',
    symbol: '🕊️',
    descriptionEn: 'A gentle, steady partnership that transforms both people so gradually they barely notice until they look back. The most sustainable form of growth.',
    descriptionRu: 'Спокойные, стабильные отношения, которые меняют обоих настолько постепенно, что это становится заметно, только если оглянуться назад. Пожалуй, самый устойчивый способ расти.',
    invitationEn: 'To trust the slow work — oceans are shaped by persistent waves',
    invitationRu: 'Доверять медленным переменам: даже океан формируют волны, которые набегают снова и снова',
    shadowEn: 'Can mistake stability for stagnation',
    shadowRu: 'Риск принять стабильность за застой',
  },
  {
    nameEn: 'The Eclipse', nameRu: 'В тени друг друга',
    symbol: '🌑',
    descriptionEn: 'One partner\'s light temporarily obscures the other\'s — a pattern of losing individuality in the relationship. The challenge is to shine together.',
    descriptionRu: 'Один партнёр на время как будто заслоняет собой другого — из-за этого один из вас может терять свою индивидуальность в отношениях. Задача — научиться раскрываться одновременно, а не по очереди.',
    invitationEn: 'To let your light shine at full strength alongside theirs',
    invitationRu: 'Позволить себе раскрыться в полную силу рядом с партнёром, а не вместо него',
    shadowEn: 'One partner disappears into the other',
    shadowRu: 'Риск, что один партнёр постепенно растворится в другом',
  },
];// ── SCORING COPY ── static bilingual copy for archetype generation (moved from src/app/core/data/scoring.ts) ──
// EXCEPTION — copy left in adapter (computed with runtime values / template literals):
//   computePartsDynamics() dynamic narrative strings (~lines 1300-1600)
//   generateArchetypes() computed template strings (~lines 950-1100)
//   computeTriggerMap() computed strings (~lines 1600-1800)
//   computeDissociation/Regulation/Boundary/Coherence computed strings
//   Polarization arrays computed from runtime values

export const SHADOW_TEMPLATES: Record<string, Record<string, string[]>> = {
  control_shadows: {
    en: ['Rigid Domination', 'Frozen Standards', 'Emotional Armoring', 'Compulsive Order'],
    ru: ['Жёсткий контроль', 'Застывшие стандарты', 'Эмоциональная броня', 'Навязчивая потребность в порядке'],
  },
  emotional_storm_shadows: {
    en: ['Reactive Fire', 'Destructive Passion', 'Emotional Flooding', 'Chaos Addiction'],
    ru: ['Вспыльчивость', 'Разрушительная страсть', 'Захлёстывающие эмоции', 'Тяга к хаосу'],
  },
  avoidant_intellectual_shadows: {
    en: ['Radical Detachment', 'Frozen Analysis', 'Invisible Walls', 'Emotional Exile'],
    ru: ['Полная отстранённость', 'Уход в размышления', 'Невидимые стены', 'Изгнание чувств'],
  },
  anxious_connection_shadows: {
    en: ['Identity Dissolution', 'Emotional Sponging', 'Resentful Sacrifice', 'Chronic Accommodation'],
    ru: ['Потеря себя в отношениях', 'Впитывание чужих эмоций', 'Жертвенность с обидой', 'Постоянное уступание'],
  },
  seductive_avoidance_shadows: {
    en: ['Seductive Distance', 'Deflective Charm', 'Illusive Intimacy', 'Perpetual Chase'],
    ru: ['Притяжение на расстоянии', 'Обаяние как щит', 'Близость только на вид', 'Бесконечная погоня'],
  },
  gift_archetypes: {
    en: ['Can become rigid in balance', 'Risk of spiritual bypass', 'Over-generosity', 'Naive trust'],
    ru: ['Риск стать негибким в своей уравновешенности', 'Риск использовать позитивный настрой, чтобы не смотреть в лицо трудностям', 'Чрезмерная щедрость', 'Слишком доверчивое отношение к людям'],
  },
  disorganized_attachment_shadows: {
    en: ['Push-Pull Cyclone', 'Approach-Avoidance Trap', 'Emotional Whiplash', 'Frozen Yearning'],
    ru: ['То ближе, то дальше', 'Ловушка притяжения и избегания', 'Резкие эмоциональные качели', 'Застывшая тоска по близости'],
  },
};

export const INVITATION_TEMPLATES: Record<string, Record<string, string[]>> = {
  control_shadows: {
    en: [
      'To release control and learn to receive',
      'To embrace imperfection as the gateway to connection',
      'To let vulnerability become a safe place too, alongside vigilance',
      'To let the fortress walls come down, one brick at a time',
    ],
    ru: [
      'Отпустить контроль и научиться принимать',
      'Принять несовершенство как путь к связи',
      'Позволить уязвимости стать безопасным местом — наравне с бдительностью',
      'Опустить стены крепости, кирпич за кирпичом',
    ],
  },
  emotional_storm_shadows: {
    en: [
      'To find the ground within the storm',
      'To channel intensity into creative work',
      'To sit with the fire without burning everything down',
      'To find life in the stillness',
    ],
    ru: [
      'Найти опору внутри бури',
      'Направить интенсивность в творчество',
      'Сидеть с огнём, не сжигая всё дотла',
      'Обнаружить в тишине жизнь',
    ],
  },
  avoidant_intellectual_shadows: {
    en: [
      'To risk being seen in your true form',
      'To step into the river of life — from the bank you only see the surface',
      'To let the first crack appear in the ice',
      'To discover that feelings are allies',
    ],
    ru: [
      'Рискнуть показаться в истинном виде',
      'Войти в реку жизни — с берега видна только поверхность',
      'Позволить первой трещине появиться во льду',
      'Обнаружить, что чувства — союзники',
    ],
  },
  anxious_connection_shadows: {
    en: [
      'To honor your own needs as sacred',
      'To disappoint someone and survive the experience',
      'To discover which relationships survive self-revelation',
      'To build boundaries that honor both self and other',
    ],
    ru: [
      'Почтить собственные потребности как священные',
      'Разочаровать кого-то и пережить этот опыт',
      'Обнаружить, какие отношения выдерживают самораскрытие',
      'Выстроить границы, уважающие и себя, и другого',
    ],
  },
  seductive_avoidance_shadows: {
    en: [
      'To stay and witness what unfolds after the chase',
      'To trust that authenticity is more magnetic than any mask',
      'To discover intimacy beyond the performance',
      'To let someone see behind the curtain',
    ],
    ru: [
      'Остаться и увидеть, что происходит после погони',
      'Доверять, что подлинность привлекательнее любой маски',
      'Обрести близость за пределами представления',
      'Позволить кому-то заглянуть за занавес',
    ],
  },
  gift_archetypes: {
    en: [
      'To share your hard-won wisdom with those still walking the path',
      'To trust that your presence alone is a gift',
      'To remain grounded even as you soar',
      'To receive as generously as you give',
    ],
    ru: [
      'Поделиться завоеванной мудростью с теми, кто ещё в пути',
      'Доверять, что ваше присутствие — уже дар',
      'Оставаться заземлённым, даже паря ввысь',
      'Принимать так же щедро, как отдавать',
    ],
  },
  disorganized_attachment_shadows: {
    en: [
      'To hold both the longing for closeness and the fear of it with equal compassion',
      'To discover that safety and intimacy are not mutually exclusive',
      'To find the courage to stay present when every cell screams to flee or cling',
      'To build a relationship with your own contradictions before trying to resolve them in another',
    ],
    ru: [
      'Удерживать и тягу к близости, и страх перед ней — с равным состраданием к обоим',
      'Открыть для себя, что безопасность и близость не исключают друг друга',
      'Найти в себе смелость оставаться, когда всё внутри кричит «беги!» или «цепляйся!»',
      'Познакомиться с собственными противоречиями, прежде чем пытаться разрешить их через другого',
    ],
  },
};

export const CORE_BELIEF_TEMPLATES: Record<string, Record<string, string[]>> = {
  control_shadows: {
    en: [
      'The world is unsafe. I must control everything to protect myself.',
      'If I am not perfect, I am nothing.',
      'Vulnerability is weakness. Strength means never needing anyone.',
      'Order is safety. Chaos is death.',
    ],
    ru: [
      'Мир небезопасен. Я должен(на) всё контролировать, чтобы защитить себя.',
      'Если я не идеален(на), я — ничто.',
      'Уязвимость — это слабость. Сила означает никогда ни в ком не нуждаться.',
      'Порядок — это безопасность. Хаос — это смерть.',
    ],
  },
  emotional_storm_shadows: {
    en: [
      'My emotions are overwhelming and dangerous. They control me.',
      'If I feel it, I must express it — there is no middle ground.',
      'Intensity is the only proof that something is real.',
      'The louder I am, the more likely I am to be heard.',
    ],
    ru: [
      'Мои эмоции подавляющие и опасные. Они контролируют меня.',
      'Если я это чувствую, я должен(на) это выразить — золотой середины нет.',
      'Интенсивность — единственное доказательство реальности.',
      'Чем громче я, тем вероятнее, что меня услышат.',
    ],
  },
  avoidant_intellectual_shadows: {
    en: [
      'To be seen is to be annihilated. Safety lies in invisibility.',
      'Feelings are weakness. Logic is the only reliable guide.',
      'If I can understand it, I can control it — and I must control it.',
      'Distance is safety. Connection is contamination.',
    ],
    ru: [
      'Быть увиденным — значит быть уничтоженным. Безопасность в невидимости.',
      'Чувства — это слабость. Логика — единственный надёжный проводник.',
      'Если я могу понять это, я могу контролировать — и я должен(на) контролировать.',
      'Дистанция — безопасность. Связь — заражение.',
    ],
  },
  anxious_connection_shadows: {
    en: [
      'My needs don\'t matter. My worth comes from serving others.',
      'I must become what others want me to be, or I will be abandoned.',
      'Other people\'s emotions define my reality.',
      'If I am not needed, I do not exist.',
    ],
    ru: [
      'Мои потребности не важны. Моя ценность — в служении другим.',
      'Я должен(на) стать тем, чего хотят другие, или меня бросят.',
      'Чужие эмоции определяют мою реальность.',
      'Если я не нужен(на), я не существую.',
    ],
  },
  seductive_avoidance_shadows: {
    en: [
      'I can attract anyone, but if they get too close they\'ll see I\'m not enough.',
      'If I keep everything light, no one will notice my terror.',
      'The chase is the relationship. The catch is the ending.',
      'My power is in the mystery. True knowledge would destroy it.',
    ],
    ru: [
      'Я могу привлечь кого угодно, но если подойдут слишком близко — увидят, что я недостаточно хорош(а).',
      'Если я буду держать всё лёгким, никто не заметит мой ужас.',
      'Погоня — это и есть отношения. Добыча — это конец.',
      'Моя сила — в загадке. Истинное знание разрушит её.',
    ],
  },
  gift_archetypes: {
    en: [
      'I am the source of my experience. My internal state creates my external reality.',
      'Connection and autonomy are partners in one dance.',
      'All parts of me are valuable — shadows and gifts alike.',
      'My body is an intelligent guide. True knowing integrates mind and heart.',
    ],
    ru: [
      'Я — источник своего опыта. Моё внутреннее состояние создаёт внешнюю реальность.',
      'Связь и автономия — партнёры в одном танце.',
      'Все мои части ценны — и тени, и дары.',
      'Моё тело — мудрый проводник. Истинное знание объединяет разум и сердце.',
    ],
  },
  disorganized_attachment_shadows: {
    en: [
      'I need you desperately, but if you get close you will destroy me. I am trapped between abandonment and engulfment.',
      'Love is the most dangerous thing in the world — and the thing I cannot live without.',
      'If I let you in, you will see the brokenness and leave. If I keep you out, I will die of loneliness.',
      'My needs are a trap. Expressing them pushes people away. Suppressing them makes me disappear.',
    ],
    ru: [
      'Я отчаянно нуждаюсь в тебе — но если ты подойдёшь близко, ты меня уничтожишь. Я в ловушке между покинутостью и поглощением.',
      'Любовь — самое опасное, что есть в мире. И единственное, без чего я не могу жить.',
      'Если я впущу тебя — ты увидишь мою сломанность и уйдёшь. Если не впущу — я умру от одиночества.',
      'Мои потребности — ловушка. Если их высказать — оттолкну людей. Если подавить — исчезну сам(а).',
    ],
  },
};

export const ATTRACTS_TEMPLATES: Record<string, Record<string, string[]>> = {
  control_shadows: {
    en: [
      'Rebels who challenge their power, or those who submit to it',
      'Critics who mirror their inner judge',
      'People who feel unsafe, reinforcing their protector role',
      'Chaotic situations that justify their need for control',
    ],
    ru: [
      'Бунтари, бросающие вызов их власти, или те, кто покоряется ей',
      'Критики, отражающие их внутреннего судью',
      'Люди, чувствующие себя небезопасно, подкрепляющие их роль защитника',
      'Хаотичные ситуации, оправдывающие потребность в контроле',
    ],
  },
  emotional_storm_shadows: {
    en: [
      'Calm, avoidant partners they try to provoke',
      'Anxious partners who fuel the drama',
      'Stable people they perceive as "boring"',
      'Other intense people, creating escalation loops',
    ],
    ru: [
      'Спокойные, избегающие партнёры, которых они пытаются спровоцировать',
      'Тревожные партнёры, разжигающие драму',
      'Стабильные люди, кажущиеся им «скучными»',
      'Другие интенсивные люди, создающие петли эскалации',
    ],
  },
  avoidant_intellectual_shadows: {
    en: [
      'Anxious partners who chase them, reinforcing the need to disappear',
      'Emotionally expressive people they can study from a distance',
      'Other avoidant people, creating parallel lives of solitude',
      'People who idealize their "calmness"',
    ],
    ru: [
      'Тревожные партнёры, преследующие их, подкрепляя потребность исчезнуть',
      'Эмоционально выразительные люди, которых можно изучать издалека',
      'Другие избегающие люди, создающие параллельные жизни одиночества',
      'Люди, идеализирующие их «спокойствие»',
    ],
  },
  anxious_connection_shadows: {
    en: [
      'Takers and narcissists who exploit their generosity',
      'Demanding partners who take advantage of their lack of boundaries',
      'Emotionally chaotic partners they try to "fix"',
      'Partners with strong personalities who don\'t know the real them',
    ],
    ru: [
      'Берущие и нарциссы, эксплуатирующие их щедрость',
      'Требовательные партнёры, пользующиеся отсутствием границ',
      'Эмоционально хаотичные партнёры, которых они пытаются «починить»',
      'Партнёры с сильными личностями, не знающие их настоящих',
    ],
  },
  seductive_avoidance_shadows: {
    en: [
      'Partners who love the chase but can\'t handle the catch',
      'People easily charmed but ultimately kept at arm\'s length',
      'Admirers who become an audience in place of close partners',
      'Other seductive avoidants, creating mutual pursuit without arrival',
    ],
    ru: [
      'Партнёры, любящие погоню, но не справляющиеся с добычей',
      'Люди, легко очарованные, но удерживаемые на расстоянии',
      'Поклонники вместо близких партнёров',
      'Другие соблазнительные избегающие, создающие взаимную погоню без прибытия',
    ],
  },
  gift_archetypes: {
    en: [
      'Other sovereign beings for co-creation and conscious relationship',
      'Partners who value both deep intimacy and healthy independence',
      'Those ready for deep, present connection beyond the surface',
      'Collaborators who see challenges as creative opportunities',
    ],
    ru: [
      'Другие суверенные существа для сотворчества и осознанных отношений',
      'Партнёры, ценящие и глубокую близость, и здоровую независимость',
      'Те, кто готов к глубокой, присутствующей связи за пределами поверхности',
      'Сотрудники, видящие вызовы как творческие возможности',
    ],
  },
  disorganized_attachment_shadows: {
    en: [
      'Partners who are alternately available and distant, recreating the original inconsistent caregiving',
      'Intense partners who trigger both the longing and the terror simultaneously',
      'Stable partners who feel "too safe" and therefore boring, or chaotic partners who feel "alive" but terrifying',
      'Partners with their own attachment wounds, creating mutual approach-avoidance dances',
    ],
    ru: [
      'Партнёры, которые то рядом, то пропадают — воссоздают знакомый с детства паттерн непредсказуемой заботы',
      'Интенсивные партнёры, в которых одновременно пробуждают и жажду, и ужас',
      'Стабильные партнёры, кажущиеся «слишком безопасными» (и потому скучными), либо хаотичные — те кажутся «живыми», но пугают',
      'Партнёры с собственными ранами привязанности — возникают взаимные танцы «иду к тебе — убегаю от тебя»',
    ],
  },
};

export const WOUND_TEMPLATES: Record<string, Record<string, string[]>> = {
  control_shadows: {
    en: [
      'Rigid control masking deep insecurity',
      'Cannot receive love, only commands',
      'Hyper-vigilance born from early chaos',
      'Perfectionism as armor against shame',
    ],
    ru: [
      'Жёсткий контроль, скрывающий глубокую неуверенность',
      'Не способен принимать любовь, только приказы',
      'Повышенная настороженность, рождённая ранним хаосом',
      'Перфекционизм как броня против стыда',
    ],
  },
  emotional_storm_shadows: {
    en: [
      'Volcanic emotions that overwhelm connection',
      'Reactivity born from unmet needs',
      'Passion that burns bridges',
      'Intensity that masks terror of emptiness',
    ],
    ru: [
      'Очень сильные, взрывные эмоции, которые мешают близости',
      'Резкие вспышки как реакция на неудовлетворённые потребности',
      'Страсть, сжигающая мосты',
      'Интенсивность, маскирующая страх пустоты',
    ],
  },
  avoidant_intellectual_shadows: {
    en: [
      'Emotional withdrawal as self-protection',
      'Analysis as substitute for feeling',
      'Distance mistaken for safety',
      'Invisibility as a survival strategy',
    ],
    ru: [
      'Эмоциональное отстранение как самозащита',
      'Анализ как заменитель чувств',
      'Дистанция, принятая за безопасность',
      'Невидимость как стратегия выживания',
    ],
  },
  anxious_connection_shadows: {
    en: [
      'Self-abandonment to maintain connection',
      'Overwhelming need for reassurance',
      'Absorbing others\' emotions as identity',
      'Shape-shifting to be lovable',
    ],
    ru: [
      'Отказ от себя ради сохранения связи',
      'Подавляющая потребность в подтверждении',
      'Настолько сильно перенимает чужие эмоции, что теряет ощущение себя',
      'Трансформация, чтобы быть любимым',
    ],
  },
  seductive_avoidance_shadows: {
    en: [
      'Magnetic attraction with commitment avoidance',
      'Charm as a wall against intimacy',
      'Entertainment as deflection from vulnerability',
      'Intensity without depth',
    ],
    ru: [
      'Магнитное притяжение с избеганием обязательств',
      'Обаяние как стена против близости',
      'Развлечение как отвлечение от уязвимости',
      'Интенсивность без глубины',
    ],
  },
  gift_archetypes: {
    en: [
      'The wound that became wisdom',
      'Scars that map the journey to wholeness',
      'Pain transmuted into presence',
      'The crack where the light enters',
    ],
    ru: [
      'Рана, ставшая мудростью',
      'Шрамы, отражающие путь к целостности',
      'Боль, превращённая в присутствие',
      'Трещина, куда проникает свет',
    ],
  },
  disorganized_attachment_shadows: {
    en: [
      'Simultaneously craves and fears intimate connection — a prison of competing needs',
      'Wants closeness desperately but panics when it arrives — the classic approach-avoidance conflict',
      'Love feels both like oxygen and drowning — can neither stay nor leave',
      'Deeply longs for connection while being terrified of the vulnerability it requires',
    ],
    ru: [
      'Одновременно жаждет и боится близости — тюрьма двух взаимоисключающих потребностей',
      'Отчаянно хочет близости, но впадает в панику, когда она возникает — классический конфликт «идти к — бежать от»',
      'Любовь ощущается то как глоток воздуха, то как вода, заполняющая лёгкие — невозможно ни остаться, ни уйти',
      'Глубоко жаждет связи и одновременно панически боится уязвимости, которой она требует',
    ],
  },
};


// ── SCORING COPY ─── static bilingual copy for archetype generation (moved from src/app/core/data/scoring.ts) ──
// EXCEPTION: computePartsDynamics() narrative strings (~lines 1300-1600), generateArchetypes() templates (~lines 950-1100), TRIGGER_TEMPLATES (~line 1632) stay in adapter.

export const DESCRIPTION_TEMPLATES: Record<string, Record<string, string[]>> = {
  control_shadows: {
    en: [
      'A sovereign force that builds walls to protect what it loves. Commands respect but struggles to let anyone close enough to see the cracks.',
      'An iron-willed guardian who equates vulnerability with defeat. Their fortress keeps danger out — and intimacy at bay.',
      'A master strategist who orchestrates every outcome to avoid the chaos of uncertainty. Strength is their armor, control their language.',
      'A disciplined sentinel standing eternal watch. They hold the line so tightly they forget to breathe.',
    ],
    ru: [
      'Человек, который строит стены, чтобы защитить то, что любит. Вызывает уважение, но редко подпускает кого-то настолько близко, чтобы показать свои слабые места.',
      'Твёрдый, надёжный защитник, для которого уязвимость равносильна поражению. Его крепость не пускает внутрь опасность — но заодно и близость.',
      'Хороший стратег, который старается держать под контролем любой исход, лишь бы не столкнуться с неопределённостью. Сила — его броня, контроль — его язык.',
      'Дисциплинированный человек, который держит оборону так долго и так крепко, что порой забывает выдохнуть.',
    ],
  },
  emotional_storm_shadows: {
    en: [
      'A volcanic spirit whose intensity can light up a room or burn it down. They feel everything at maximum volume and struggle to find the dial.',
      'A thunderhead of raw emotion that crashes through boundaries with passionate force. Beauty and destruction coexist in their wake.',
      'A tempest-born soul whose reactivity masks a terrified child within. Every eruption is a cry to be witnessed.',
      'A wildfire heart that turns every connection into a crucible. Their passion is real — but so is the damage it leaves behind.',
    ],
    ru: [
      'Человек с очень яркими эмоциями — они могут наполнить комнату жизнью, а могут и всё разрушить. Чувствует всё на полную громкость и пока не научился её убавлять.',
      'Человек, чьи бурные эмоции легко сносят любые границы. В их следе часто соседствуют и что-то прекрасное, и что-то разрушенное.',
      'Человек, чья резкая реакция на самом деле прячет испуганного ребёнка внутри. Каждая вспышка — это способ докричаться, чтобы его заметили.',
      'Человек со страстным сердцем, которое превращает любую близость в серьёзное испытание. Его чувства настоящие — но и последствия от них тоже настоящие.',
    ],
  },
  avoidant_intellectual_shadows: {
    en: [
      'A crystal mind that observes the world through frost-covered glass. They understand everything about emotion — except how to feel it.',
      'A distant star whose light reaches others but never warms. Analysis is their sanctuary and their prison.',
      'A silent scholar who maps the depths of the human condition from the safety of the shore. They know the water is fine — they just refuse to swim.',
      'An ivory tower intellect that has rationalized away its own need for connection. Solitude is their kingdom and their exile.',
    ],
    ru: [
      'Человек с ясным умом, который наблюдает за миром как будто через стекло. Прекрасно разбирается в эмоциях — кроме того, как их на самом деле чувствовать.',
      'Человек, чьё тепло доходит до других, но почти никого не согревает. Анализ — это его укрытие, но и его же ловушка.',
      'Человек, который вдумчиво изучает чужие переживания, оставаясь при этом на безопасном расстоянии от собственных. Знает, что вода тёплая, — но так и не решается зайти.',
      'Человек, который логикой объяснил себе, почему ему не так уж и нужна близость с другими. Одиночество для него и убежище, и клетка одновременно.',
    ],
  },
  anxious_connection_shadows: {
    en: [
      'A yearning heart that shape-shifts to fit the shape of whoever is near. They give everything to the connection — except their authentic self.',
      'A gravitational force pulling everyone close, terrified that distance means abandonment. Their love is vast but lacks boundaries.',
      'An echo seeker who loses their own voice harmonizing with others. Connection is oxygen — but they are drowning in everyone else\'s air.',
      'A tender soul who builds bridges to everyone but forgets to build a home for themselves. They know everyone\'s pain except their own.',
    ],
    ru: [
      'Человек, который подстраивается под любого, кто рядом, лишь бы не потерять связь. Отдаёт отношениям всё — кроме себя настоящего.',
      'Человек, который изо всех сил притягивает людей к себе, боясь, что дистанция означает расставание. Его любовь огромна, но в ней почти нет границ.',
      'Человек, который так старается быть в согласии с другими, что теряет собственный голос. Близость для него как воздух — но он будто дышит только чужим воздухом.',
      'Мягкий, чуткий человек, который умеет быть опорой для всех вокруг, но забывает быть опорой для себя. Замечает чужую боль лучше, чем свою.',
    ],
  },
  seductive_avoidance_shadows: {
    en: [
      'A phantom lover who draws people in with mystery and charm, then vanishes when the walls come down. Intimacy is the chase — arrival is the threat.',
      'A silk-thread enigma that weaves fascination at a distance. They offer a garden of delights — but every flower has thorns.',
      'A moonlit illusionist who performs connection without vulnerability. The mask is magnificent — and it never comes off.',
      'A perfumed dagger wrapped in velvet. They make everyone feel special while ensuring no one gets close enough to see the ordinary underneath.',
    ],
    ru: [
      'Человек, который притягивает людей загадочностью и обаянием, а потом исчезает, как только становится по-настоящему близко. Погоня для него — это и есть отношения, а настоящая близость пугает.',
      'Человек, который умеет очаровывать на расстоянии, оставаясь недосягаемым. Со стороны кажется, что рядом с ним сплошной праздник — но за этим часто прячется что-то более сложное.',
      'Человек, который умеет создать ощущение близости, ничем при этом не рискуя. Его образ безупречен — и он редко его снимает.',
      'Человек, рядом с которым каждый чувствует себя особенным, — но именно поэтому мало кто узнаёт, какой он на самом деле, без этого обаяния.',
    ],
  },
  gift_archetypes: {
    en: [
      'A radiant presence that has transmuted suffering into wisdom. They hold space for others without losing themselves in the process.',
      'A harmonized soul whose inner balance creates a field of calm around them. Their wholeness is hard-won and generously shared.',
      'A grounded mystic who walks between worlds — feeling deeply without drowning, thinking clearly without freezing. Presence is their superpower.',
      'A living bridge between shadow and light, integrating all parts of themselves with compassionate awareness. They model what healing looks like.',
    ],
    ru: [
      'Человек, который превратил свои трудности в мудрость. Умеет поддерживать других, не теряя при этом себя.',
      'Человек с хорошим внутренним балансом, рядом с которым многим становится спокойнее. Такая устойчивость далась ему нелегко — и он щедро делится ею с другими.',
      'Человек, который умеет и глубоко чувствовать, не тонув в этом, и ясно мыслить, не отключаясь от чувств. Его главная сила — просто быть рядом, по-настоящему.',
      'Человек, который принимает в себе и сильные, и слабые стороны, относясь к себе с состраданием. На его примере видно, как на самом деле выглядит внутренний рост.',
    ],
  },
  disorganized_attachment_shadows: {
    en: [
      'A heart that beats in two directions at once — reaching desperately toward connection while building walls against it. Every relationship becomes an impossible choice between suffocation and starvation.',
      'The walking paradox: craving intimacy with an intensity that frightens others, then fleeing when it arrives. Their deepest fear is not abandonment or engulfment — it is that both might happen simultaneously.',
      'A soul frozen between two fires — the fire of needing and the fire of fearing. They live in the threshold, never fully inside or outside of connection, exhausted by the war within.',
      'An emotional compass that spins wildly between approach and avoidance. They know what they want but cannot tolerate having it, creating relationships defined by oscillation and exhaustion.',
    ],
    ru: [
      'Человек, который одновременно тянется к близости и старается от неё защититься. Из-за этого каждые отношения превращаются в мучительный выбор между «слишком тесно» и «слишком одиноко».',
      'Человек, который может очень сильно хотеть близости — так сильно, что это пугает других, — а когда она приходит, вдруг отступает. Его главный страх не в том, что его бросят или что он потеряет себя, а в том, что может случиться и то, и другое сразу.',
      'Человек, разрывающийся между желанием быть рядом и страхом перед этим желанием. Он будто застревает на пороге, так и не решаясь ни войти в близость, ни выйти из неё, — и очень устаёт от этой внутренней борьбы.',
      'Человек, чьё отношение к близости постоянно меняется — то он тянется навстречу, то отдаляется. Он знает, чего хочет, но ему трудно это выдержать, когда это происходит, — и отношения от этого становятся непредсказуемыми и выматывающими.',
    ],
  },
};

// ── SYNASTRY DIM LABELS ── axis labels for resonance descriptions (moved from synastry.ts) ──
export const SYNASTRY_DIM_LABELS: Record<string, { en: string; ru: string; poleNeg: { en: string; ru: string }; polePos: { en: string; ru: string } }> = {
  AGENCY: { en: 'initiative', ru: 'инициативность', poleNeg: { en: 'leading', ru: 'ведёт за собой' }, polePos: { en: 'following', ru: 'идёт за другими' } },
  TEMPERATURE: { en: 'emotionality', ru: 'эмоциональность', poleNeg: { en: 'composed', ru: 'сдержанный' }, polePos: { en: 'expressive', ru: 'выразительный' } },
  FOCUS: { en: 'focus', ru: 'фокус внимания', poleNeg: { en: 'pragmatic', ru: 'прагматичный' }, polePos: { en: 'empathic', ru: 'эмпатичный' } },
  ATTACHMENT: { en: 'closeness-distance balance', ru: 'близость и дистанция', poleNeg: { en: 'valuing independence', ru: 'ценит независимость' }, polePos: { en: 'seeking reassurance', ru: 'ищет подтверждений' } },
};

// ── THERAPIST CONSENT ── client-facing consent text for specialist linking (moved from therapist-link.ts) ──
export const CONSENT_TEXT = {
  en: 'Your therapist sees: your constellation headline, part scores, active repeating scenarios, how you cope, and exercise adherence. They never see: your raw answers, your somatic zones, or your reflections — unless you share a reflection yourself, one at a time. You can unlink at any moment.',
  ru: 'Ваш терапевт видит: название созвездия, баллы частей, активные повторяющиеся сценарии, способы справляться и выполнение практик. Он никогда не видит: ваши исходные ответы, соматические зоны и размышления — если вы сами не поделитесь конкретным размышлением. Отключить связь можно в любой момент.',
};

// ── UNIVERSE FAMILY META ── cluster display names (moved from universe-state.service.ts) ──
export const UNIVERSE_FAMILY_META: Record<string, { ru: string; en: string }> = {
  managers: { ru: 'Менеджеры', en: 'Managers' },
  firefighters: { ru: 'Пожарные', en: 'Firefighters' },
  exiles: { ru: 'Изгнанники', en: 'Exiles' },
  resources: { ru: 'Ресурсы', en: 'Resources' },
};

// ── SCORING NAME POOLS ── generated archetype display names (moved from scoring.ts) ──
export const SCORING_NAME_POOLS: Record<string, Record<string, string[]>> = {
  control_shadows: {
    en: [
      'The Commander', 'The Architect', 'The Warden', 'The Iron Will',
      'The Sentinel King', 'The General', 'The Taskmaster', 'The Strategist',
      'The Ruler', 'The Enforcer', 'The Watchman', 'The Overseer',
      'The Disciplinarian', 'The Regulator', 'The Gatekeeper', 'The Judge',
      'The Shield Bearer', 'The Fortress Builder', 'The Fortress', 'The Arbiter',
    ],
    ru: [
      'Командующий', 'Архитектор', 'Страж', 'Железная Воля',
      'Сторожевой Король', 'Генерал', 'Надсмотрщик', 'Стратег',
      'Правитель', 'Исполнитель', 'Смотритель', 'Надзиратель',
      'Дисциплинатор', 'Регулятор', 'Привратник', 'Судья',
      'Носитель Щита', 'Строитель Крепости', 'Крепость', 'Арбитр',
    ],
  },
  emotional_storm_shadows: {
    en: [
      'The Wildfire', 'The Thunderhead', 'The Maelstrom', 'The Volcanic Heart',
      'The Lightning Rod', 'The Inferno', 'The Hurricane', 'The Eruption',
      'The Blaze', 'The Tempest Born', 'The Storm Caller', 'The Firestorm',
      'The Upheaval', 'The Seismic', 'The Torrent', 'The Avalanche',
      'The Raging Sea', 'The Ember Core', 'The Thunderstrike', 'The Cyclone',
    ],
    ru: [
      'Лесной Пожар', 'Грозовой Фронт', 'Водоворот', 'Вулканическое Сердце',
      'Громоотвод', 'Пекло', 'Ураган', 'Извержение',
      'Пламя', 'Рождённый Бурей', 'Вызыватель Бурь', 'Огненный Шторм',
      'Потрясение', 'Сейсмический', 'Поток', 'Лавина',
      'Бушующее Море', 'Тлеющее Ядро', 'Удар Молнии', 'Циклон',
    ],
  },
  avoidant_intellectual_shadows: {
    en: [
      'The Frost Sage', 'The Crystal Mind', 'The Observer', 'The Distant Star',
      'The Glass Tower', 'The Glacier', 'The Analyst', 'The Frozen Lake',
      'The Ivory Tower', 'The Quantum Ghost', 'The Silent Scholar', 'The Ice Field',
      'The Abstract', 'The Detached', 'The Astral', 'The Cipher',
      'The Stillness', 'The Void Walker', 'The Calm Surface', 'The Mirror',
    ],
    ru: [
      'Морозный Мудрец', 'Кристальный Разум', 'Наблюдатель', 'Далёкая Звезда',
      'Стеклянная Башня', 'Ледник', 'Аналитик', 'Замёрзшее Озеро',
      'Слоновая Башня', 'Квантовый Призрак', 'Молчаливый Учёный', 'Ледяное Поле',
      'Абстракция', 'Отстранённый', 'Астральный', 'Шифр',
      'Тишина', 'Ходок Пустоты', 'Спокойная Поверхность', 'Зеркало',
    ],
  },
  anxious_connection_shadows: {
    en: [
      'The Yearning Heart', 'The Graviton', 'The Echo Seeker', 'The Tender Flame',
      'The Open Wound', 'The Longing', 'The Tangled Web', 'The Seeking Soul',
      'The Clinging Vine', 'The Hungry Mirror', 'The Velvet Trap', 'The Deep Well',
      'The Needful One', 'The Absorber', 'The Thread Spinner', 'The Anchor Seeker',
      'The Chameleon Heart', 'The Bridge Builder', 'The Open Hands', 'The Giver',
    ],
    ru: [
      'Жаждущее Сердце', 'Гравитон', 'Искатель Эха', 'Нежное Пламя',
      'Открытая Рана', 'Томление', 'Запутанная Паутина', 'Ищущая Душа',
      'Цепляющаяся Лиана', 'Голодное Зеркало', 'Бархатная Ловушка', 'Глубокий Колодец',
      'Нуждающийся', 'Поглотитель', 'Прядильщик Нитей', 'Искатель Якоря',
      'Сердце Хамелеона', 'Строитель Мостов', 'Открытые Руки', 'Дарующий',
    ],
  },
  seductive_avoidance_shadows: {
    en: [
      'The Phantom Lover', 'The Silk Thread', 'The Mirage', 'The Velvet Flame',
      'The Garden of Thorns', 'The Dance of Shadows', 'The Enigma', 'The Sphinx',
      'The Masquerade', 'The Perfumed Dagger', 'The Sweet Poison', 'The Smoke Ring',
      'The Illusionist', 'The Charmer', 'The Moonlit Path', 'The Gilded Cage',
      'The Twister', 'The Playing Card', 'The Night Bloom', 'The Siren Song',
    ],
    ru: [
      'Фантомный Любовник', 'Шёлковая Нить', 'Мираж', 'Бархатное Пламя',
      'Сад Шипов', 'Танец Теней', 'Загадка', 'Сфинкс',
      'Маскарад', 'Благовонный Кинжал', 'Сладкий Яд', 'Дымовое Кольцо',
      'Иллюзионист', 'Чаровник', 'Лунная Тропа', 'Позолоченная Клетка',
      'Обманщик', 'Игральная Карта', 'Ночной Цветок', 'Песня Сирены',
    ],
  },
  gift_archetypes: {
    en: [
      'The Radiant One', 'The Harmonizer', 'The Grounded Mystic', 'The Living Bridge',
      'The Clear Spring', 'The Balanced Flame', 'The Steady Heart', 'The Open Sky',
      'The Centered Soul', 'The Weaver', 'The Light Bearer', 'The Dawn Caller',
      'The Deep Listener', 'The True Mirror', 'The Rooted Tree', 'The Gold Weaver',
      'The Whole Self', 'The Integrated One', 'The Quiet Power', 'The Full Circle',
    ],
    ru: [
      'Сияющий', 'Гармонизатор', 'Заземлённый Мистик', 'Живой Мост',
      'Чистый Родник', 'Сбалансированное Пламя', 'Стойкое Сердце', 'Открытое Небо',
      'Уравновешенная Душа', 'Ткач', 'Носитель Света', 'Зовущий Рассвет',
      'Глубокий Слушатель', 'Истинное Зеркало', 'Укоренённое Древо', 'Золотой Ткач',
      'Целостный', 'Интегрированный', 'Тихая Сила', 'Полный Круг',
    ],
  },
  disorganized_attachment_shadows: {
    en: [
      'The Shattered Mirror', 'The Torn Veil', 'The Push-Pull Phantom', 'The Double Bind',
      'The Walking Paradox', 'The Frozen Fire', 'The Simultaneous Flight', 'The Contradictory Heart',
      'The Approach-Avoidance', 'The Ambivalent Storm', 'The Pendulum Soul', 'The Two-Way Prison',
      'The Impossible Bind', 'The Split Heart', 'The Fearful Lover', 'The Craving Recluse',
      'The Hungry Hermit', 'The Yearning Escapist', 'The Desperate Island', 'The Burning Ice',
    ],
    ru: [
      'Разбитое зеркало', 'Разорванная завеса', 'Фантом притяжения', 'Двойная связь',
      'Ходячий парадокс', 'Замёрзший огонь', 'Бег в обе стороны', 'Разноречивое сердце',
      'Сближение-избегание', 'Двойственная буря', 'Душа-маятник', 'Двусторонняя тюрьма',
      'Невозможный узел', 'Разорванное сердце', 'Пугливый любовник', 'Жаждущий отшельник',
      'Голодный затворник', 'Томящийся беглец', 'Отчаянный остров', 'Горящий лёд',
    ],
  },
};

// ── Sample parts (pal/traits.ts SEED_PARTS) ─────────────────────────────
// The built-in example cast shown before an assessment. EN is the source the
// seeds are built from; RU replaces a field only while it still holds the EN
// text (pal/seed-copy.ts), so a part the user edited keeps their words.
export interface SeedPartCopy { name: string; role: string; blurb: string; burden: string; need: string; voice: string; since: string }

export const SEED_PART_COPY: Record<string, { en: SeedPartCopy; ru: SeedPartCopy }> = {
  "seed-planner": {
    en: {
      name: "The Planner",
      role: "Keeps the schedule tight so nothing surprises you",
      blurb: "Arrives at 6 AM with a list. Means well. Never rests.",
      burden: "\"If I stop, everything falls apart.\"",
      need: "Permission to delegate to the body",
      voice: "urgent, itemized",
      since: "age 7",
    },
    ru: {
      name: "Планировщик",
      role: "Держит расписание плотным, чтобы ничто не застало вас врасплох",
      blurb: "Приходит в 6 утра со списком. Желает добра. Никогда не отдыхает.",
      burden: "«Если я остановлюсь, всё развалится».",
      need: "Разрешение передать часть забот телу",
      voice: "торопливый, по пунктам",
      since: "с 7 лет",
    },
  },
  "seed-critic": {
    en: {
      name: "Captain Critic",
      role: "Pre-approves every move to prevent shame",
      blurb: "Polishes your performance until the edges bleed.",
      burden: "\"Good enough is dangerous.\"",
      need: "To be thanked, not fired",
      voice: "sharp, editorial",
      since: "age 9",
    },
    ru: {
      name: "Капитан Критик",
      role: "Заранее проверяет каждый шаг, чтобы уберечь от стыда",
      blurb: "Шлифует ваши результаты, пока края не начнут кровоточить.",
      burden: "«Достаточно хорошо — это опасно».",
      need: "Чтобы его благодарили, а не увольняли",
      voice: "резкий, редакторский",
      since: "с 9 лет",
    },
  },
  "seed-pleaser": {
    en: {
      name: "Proxy",
      role: "Reads the room and becomes what it wants",
      blurb: "Trades itself for safety, then wonders where it went.",
      burden: "\"My needs are a burden to others.\"",
      need: "A face of its own",
      voice: "soft, agreeable",
      since: "age 5",
    },
    ru: {
      name: "Заместитель",
      role: "Считывает настроение вокруг и становится тем, кого там ждут",
      blurb: "Меняет себя на безопасность, а потом не может себя найти.",
      burden: "«Мои потребности — обуза для других».",
      need: "Собственное лицо",
      voice: "мягкий, уступчивый",
      since: "с 5 лет",
    },
  },
  "seed-guardian": {
    en: {
      name: "Guardian",
      role: "Keeps feelings below the waterline",
      blurb: "Mistakes stillness for peace. Very good at doors.",
      burden: "\"Vulnerability is an ambush.\"",
      need: "A window, not a wall",
      voice: "low, steady",
      since: "age 11",
    },
    ru: {
      name: "Страж",
      role: "Держит чувства под водой",
      blurb: "Путает неподвижность с покоем. Отлично управляется с дверями.",
      burden: "«Уязвимость — это засада».",
      need: "Окно, а не стена",
      voice: "низкий, ровный",
      since: "с 11 лет",
    },
  },
  "seed-scroller": {
    en: {
      name: "Scroller",
      role: "Numbs the room when heat rises",
      blurb: "Four hours gone. The feeling is still sitting there.",
      burden: "\"Just one more scroll.\"",
      need: "To be told the wave will pass",
      voice: "bright, evasive",
      since: "age 24",
    },
    ru: {
      name: "Скроллер",
      role: "Приглушает всё вокруг, когда становится жарко",
      blurb: "Прошло четыре часа. Чувство всё ещё здесь.",
      burden: "«Ещё чуть-чуть полистать».",
      need: "Услышать, что волна пройдёт",
      voice: "яркий, уклончивый",
      since: "с 24 лет",
    },
  },
  "seed-sweet": {
    en: {
      name: "Sweet Tooth",
      role: "Brings sugar when the storm hits",
      blurb: "The kindest rescue in the cupboard. Also temporary.",
      burden: "\"Comfort must be chewable.\"",
      need: "Comfort that isn't consumable",
      voice: "warm, coaxing",
      since: "age 6",
    },
    ru: {
      name: "Сладкоежка",
      role: "Приносит сладкое, когда налетает буря",
      blurb: "Самое доброе спасение из кухонного шкафа. И тоже временное.",
      burden: "«Утешение должно быть съедобным».",
      need: "Утешение, которое не нужно съедать",
      voice: "тёплый, уговаривающий",
      since: "с 6 лет",
    },
  },
  "seed-rage": {
    en: {
      name: "Rage Wave",
      role: "Burns the threat down before it gets close",
      blurb: "Small, fast, and absolutely certain. Arrives before you do.",
      burden: "\"Hurt first, or be hurt.\"",
      need: "To stop being the family's anger",
      voice: "loud, instant",
      since: "age 8",
    },
    ru: {
      name: "Волна ярости",
      role: "Сжигает угрозу, пока она не подобралась близко",
      blurb: "Маленькая, быстрая и абсолютно уверенная. Появляется раньше вас.",
      burden: "«Лучше ранить первым, чем быть раненым».",
      need: "Перестать быть гневом всей семьи",
      voice: "громкий, мгновенный",
      since: "с 8 лет",
    },
  },
  "seed-binge": {
    en: {
      name: "Binge",
      role: "Opens the hatch when feelings flood",
      blurb: "All-or-nothing by design. Believes in emergency exits.",
      burden: "\"Enough is a place I can't find.\"",
      need: "Fullness without shutdown",
      voice: "insistent, hazy",
      since: "age 19",
    },
    ru: {
      name: "Срыв",
      role: "Открывает люк, когда накрывают чувства",
      blurb: "Всё или ничего — так задумано. Верит в запасные выходы.",
      burden: "«„Достаточно“ — это место, которое я не могу найти».",
      need: "Насыщение без отключения",
      voice: "настойчивый, затуманенный",
      since: "с 19 лет",
    },
  },
  "seed-little": {
    en: {
      name: "Little One",
      role: "Holds the first \"I'm too much\" lesson",
      blurb: "Small enough to fit under the stairs. Waiting, still.",
      burden: "\"Something is wrong with me.\"",
      need: "To be found and carried out",
      voice: "quiet, age 5",
      since: "age 5",
    },
    ru: {
      name: "Малыш",
      role: "Хранит самый первый урок: «меня слишком много»",
      blurb: "Такой маленький, что помещается под лестницей. И всё ещё ждёт.",
      burden: "«Со мной что-то не так».",
      need: "Чтобы его нашли и вынесли оттуда",
      voice: "тихий, лет пяти",
      since: "с 5 лет",
    },
  },
  "seed-hidden": {
    en: {
      name: "The Hidden Kid",
      role: "Disappears when attention gets heavy",
      blurb: "Has perfected the vanishing act. Calls it independence.",
      burden: "\"If you saw me, you'd leave.\"",
      need: "Witnessing without demand",
      voice: "distant, clever",
      since: "age 10",
    },
    ru: {
      name: "Спрятавшийся ребёнок",
      role: "Исчезает, когда внимание становится тяжёлым",
      blurb: "Довёл исчезновение до совершенства. Называет это самостоятельностью.",
      burden: "«Если бы вы меня увидели, вы бы ушли».",
      need: "Чтобы его видели, ничего не требуя",
      voice: "отстранённый, сообразительный",
      since: "с 10 лет",
    },
  },
  "seed-grief": {
    en: {
      name: "Grief",
      role: "Keeps the love that had nowhere to go",
      blurb: "Not a mood — a place. Quiet. Full of everyone who left.",
      burden: "\"If I cry, I'll never stop.\"",
      need: "A container with a bottom",
      voice: "low tide",
      since: "age 12",
    },
    ru: {
      name: "Горе",
      role: "Хранит любовь, которой некуда было деться",
      blurb: "Не настроение, а место. Тихое. Полное всех, кто ушёл.",
      burden: "«Если я заплачу, то уже не остановлюсь».",
      need: "Сосуд с дном",
      voice: "отлив",
      since: "с 12 лет",
    },
  },
  "seed-first": {
    en: {
      name: "First Hurt",
      role: "Stores the original alarm",
      blurb: "Predates language. Speaks in the body, in weather.",
      burden: "\"The world is where pain happens.\"",
      need: "The past to be past",
      voice: "somatic, wordless",
      since: "age 3",
    },
    ru: {
      name: "Первая боль",
      role: "Хранит самую первую тревогу",
      blurb: "Старше слов. Говорит телом и погодой.",
      burden: "«Мир — это место, где больно».",
      need: "Чтобы прошлое осталось в прошлом",
      voice: "телесный, без слов",
      since: "с 3 лет",
    },
  },
  "seed-self": {
    en: {
      name: "Self-Energy",
      role: "The you that can hold all of them",
      blurb: "Calm, curious, undramatic. Shows up when nothing is forced.",
      burden: "—",
      need: "More room, fewer managers",
      voice: "warm certainty",
      since: "always",
    },
    ru: {
      name: "Self-энергия",
      role: "Та, кто вы есть, когда можете вместить их всех",
      blurb: "Спокойная, любопытная, без драмы. Приходит, когда ничего не навязывают.",
      burden: "—",
      need: "Больше простора, меньше менеджеров",
      voice: "тёплая уверенность",
      since: "всегда",
    },
  },
  "seed-witness": {
    en: {
      name: "The Witness",
      role: "Notices without grabbing",
      blurb: "Can watch a feeling for 90 seconds without narrating it.",
      burden: "—",
      need: "Daily practice",
      voice: "quiet, amused",
      since: "always",
    },
    ru: {
      name: "Наблюдатель",
      role: "Замечает, не хватаясь",
      blurb: "Может 90 секунд наблюдать за чувством, не комментируя его.",
      burden: "—",
      need: "Ежедневная практика",
      voice: "тихий, с улыбкой",
      since: "всегда",
    },
  },
  "seed-coach": {
    en: {
      name: "Inner Coach",
      role: "Asks the question behind the question",
      blurb: "Already knows the next right step. Speaks in questions.",
      burden: "—",
      need: "To be trusted out loud",
      voice: "curious, steady",
      since: "always",
    },
    ru: {
      name: "Внутренний коуч",
      role: "Задаёт вопрос, который стоит за вопросом",
      blurb: "Уже знает следующий верный шаг. Говорит вопросами.",
      burden: "—",
      need: "Чтобы ему доверяли вслух",
      voice: "любопытный, ровный",
      since: "всегда",
    },
  },
};
