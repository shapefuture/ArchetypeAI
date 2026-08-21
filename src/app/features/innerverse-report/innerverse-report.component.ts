/**
 * INNERVERSE — Report (REVAMP_PLAN.md §3.3).
 * Strength-first: the strongest resource leads before any shadow content.
 * No global verdicts; every insight card ends in something behavioral (§3C.8).
 */
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, computed, inject, input, model, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../services/translation.service';
import {
  SHADOW_PARTS, RESOURCES, SELF_QUALITIES, COMPLEXES, RESOURCE_BANDS,
  type ShadowPartId, type Tier, type Need,
} from '../../core/data/parts';
import { PART_COPY, LAYERS, type LayerKey } from '../../core/data/part-copy';
import { constellationName, constellationEssay, subtypeName, resourceName, COMPLEX_COPY_RU, polarizationName as polName, PART_NAME_RU } from '../../core/data/constellation-copy';
import { generateLinkCode } from '../../core/data/therapist-link';
import { InnerverseConstellationComponent } from '../constellation/innerverse-constellation.component';
import type { ScoredProfile } from '../../core/data/scoring-v2';
import { attributionRatio } from '../../core/data/state-v2';
import { sticker } from '../landing/stickers';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';

/** Display-only sticker specs (shape/color/glyph mirror of landing IV_PARTS). */
const PART_STICKERS: Record<string, { shape: string; color: string; glyph: { e: 'big' | 'wide' | 'dot' | 'lid' | 'squint' | 'star' | 'glasses'; m: 'smile' | 'grin' | 'flat' | 'wavy' | 'grit' | 'ooh' | 'smirk' }; fam: string }> = {
  taskmaster: { shape: 'taskmaster', color: '#DE6A40', glyph: { e: 'lid', m: 'grit' }, fam: 'manager' },
  inner_critic: { shape: 'inner_critic', color: '#C76B85', glyph: { e: 'squint', m: 'flat' }, fam: 'manager' },
  pleaser: { shape: 'pleaser', color: '#EF8FA5', glyph: { e: 'big', m: 'smile' }, fam: 'manager' },
  controller: { shape: 'controller', color: '#D5793B', glyph: { e: 'dot', m: 'flat' }, fam: 'manager' },
  analyst: { shape: 'analyst', color: '#7BA3D0', glyph: { e: 'glasses', m: 'flat' }, fam: 'manager' },
  hermit: { shape: 'hermit', color: '#8A87A8', glyph: { e: 'lid', m: 'smile' }, fam: 'manager' },
  bypasser: { shape: 'bypasser', color: '#CDB32E', glyph: { e: 'big', m: 'smile' }, fam: 'manager' },
  numb: { shape: 'numb', color: '#9AA3AC', glyph: { e: 'lid', m: 'flat' }, fam: 'firefighter' },
  rebel: { shape: 'rebel', color: '#DE5F50', glyph: { e: 'star', m: 'grin' }, fam: 'firefighter' },
  charmer: { shape: 'charmer', color: '#EF8FA5', glyph: { e: 'big', m: 'smirk' }, fam: 'firefighter' },
  abandoned: { shape: 'abandoned', color: '#9865C5', glyph: { e: 'big', m: 'wavy' }, fam: 'exile' },
  ashamed: { shape: 'ashamed', color: '#8E62B8', glyph: { e: 'lid', m: 'wavy' }, fam: 'exile' },
  frightened: { shape: 'frightened', color: '#7A6FD1', glyph: { e: 'wide', m: 'ooh' }, fam: 'exile' },
  unseen: { shape: 'unseen', color: '#8583C0', glyph: { e: 'dot', m: 'flat' }, fam: 'exile' },
  sage: { shape: 'sage', color: '#2FA39E', glyph: { e: 'lid', m: 'smile' }, fam: 'resource' },
  warrior: { shape: 'warrior', color: '#2E9967', glyph: { e: 'dot', m: 'grit' }, fam: 'resource' },
  caregiver: { shape: 'caregiver', color: '#E97F63', glyph: { e: 'big', m: 'smile' }, fam: 'resource' },
  explorer: { shape: 'explorer', color: '#3FA9B5', glyph: { e: 'star', m: 'smile' }, fam: 'resource' },
};

const TIER_ORDER: Record<Tier, number> = { dominant: 0, prominent: 1, present: 2, dormant: 3 };

const UI = {
  en: {
    report: 'Your Innerverse',
    constellationOf: 'Constellation of',
    and: 'and',
    strongestResource: 'Your strongest resource leads',
    strongestResourceSub: r => `Your ${r} is online. Everything below is weather around it — strengths first, always.`,
    selfEnergy: 'Self energy',
    radar: 'Self Radar · 8 qualities (indicative, not diagnostic)',
    partsByTier: 'Your parts, loudest to quietest',
    flipHint: 'tap a card: face → need → shadow → superpower',
    polarizations: 'Polarizations · two protectors deadlocked',
    polarizationSub: 'Both councillors are holding the floor at once.',
    complexes: 'Active storylines',
    complexesSub: 'A storyline is a repeating plot woven from several parts. These are the ones speaking now.',
    complexBelief: 'The sentence that runs this storyline',
    complexExperiment: 'This week\'s micro-experiment',
    noComplexes: 'The storylines are silent — no complex is active right now.',
    copingStack: 'Your coping stack · how the system escalates',
    whenFails: 'when that fails…',
    floorLabel: 'at the floor',
    needs: 'What your system is asking for',
    needsSub: 'Your loudest unmet need right now.',
    resources: 'Resources · bands',
    resourcesSub: 'Every resource has a range: blocked, healthy, or overused. The bar shows where it sits today.',
    band: { hypo: 'blocked', healthy: 'healthy', hyper: 'overused' },
    leak: r => `tips into ${r} — the leak is drawn on your constellation`,
    burden: 'System burden',
    vane: 'Language weather vane · essence ↔ behavior (indicative)',
    vaneEssence: 'essence language', vaneBehavior: 'behavior language',
    vaneEmpty: 'Your sealed verdicts will draw this vane over time.',
    attachment: 'Attachment pattern',
    attStyle: {
      secure: 'Secure leaning', anxious: 'Anxious leaning', avoidant: 'Avoidant leaning',
      disorganized: 'Mixed (anxious + avoidant)',
    },
    ethics: 'This is a self-reflection tool grounded in the Internal Family Systems model, not a diagnosis or therapy.',
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
    tierNames: { dormant: 'dormant', present: 'present', prominent: 'prominent', dominant: 'holding the floor' } as Record<Tier, string>,
    complexTierNames: { active: 'active', gripping: 'gripping' } as Record<string, string>,
  },
  ru: {
    report: 'Ваша внутренняя вселенная',
    constellationOf: 'Созвездие',
    and: 'и',
    strongestResource: 'Ваш сильнейший ресурс ведёт',
    strongestResourceSub: r => `Ресурс «${r}» сейчас включён. Всё, что ниже, — погода вокруг него. Силы показываем первыми.`,
    selfEnergy: 'Энергия Self',
    radar: 'Радар Self · 8 качеств (ориентировочный взгляд)',
    partsByTier: 'Ваши части — от громких к тихим',
    flipHint: 'нажмите на карточку: лицо → потребность → тень → суперсила',
    polarizations: 'Поляризации · два защитника в тупике',
    polarizationSub: 'Оба советчика говорят одновременно — и не слышат друг друга.',
    complexes: 'Активные сюжетные линии',
    complexesSub: 'Сюжет — повторяющаяся история, которую вместе ведут несколько частей. Здесь показаны те, что звучат сейчас.',
    complexBelief: 'Фраза, которая ведёт этот сюжет',
    complexExperiment: 'Микро-эксперимент недели',
    noComplexes: 'Сюжеты молчат: ни один комплекс сейчас не активен.',
    copingStack: 'Стратегия совладания · как система наращивает обороты',
    whenFails: 'когда это перестаёт работать…',
    floorLabel: 'на дне',
    needs: 'О чём просит ваша система',
    needsSub: 'Самая громкая неудовлетворённая потребность сейчас.',
    resources: 'Ресурсы · диапазоны',
    resourcesSub: 'У каждого ресурса есть диапазон состояний: заблокирован, здоров, перегружен. Полоска показывает, где он сегодня.',
    band: { hypo: 'заблокирован', healthy: 'здоров', hyper: 'перегружен' },
    leak: r => `переливается в «${r}» — дуга перелива показана на созвездии`,
    burden: 'Нагрузка на систему',
    vane: 'Флюгер языка · сущность ↔ поведение (ориентировочно)',
    vaneEssence: 'язык сущности', vaneBehavior: 'язык поведения',
    vaneEmpty: 'Со временем запечатанные выводы нарисуют этот флюгер.',
    attachment: 'Паттерн привязанности',
    attStyle: {
      secure: 'Скорее надёжная', anxious: 'Скорее тревожная', avoidant: 'Скорее избегающая',
      disorganized: 'Смешанная (тревога + избегание)',
    },
    ethics: 'Инструмент саморефлексии на основе модели внутренних семейных систем (IFS). За диагностикой и терапией обращайтесь к специалисту.',
    crisis: 'Сегодняшний результат тяжёлый. Если он поднимает больше, чем успокаивает, — ресурсы поддержки ждут в настройках, одно нажатие.',
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
    tierNames: { dormant: 'дремлет', present: 'присутствует', prominent: 'заметна', dominant: 'держит слово' } as Record<Tier, string>,
    complexTierNames: { active: 'активен', gripping: 'сжимает' } as Record<string, string>,
  },
};


const RU_SUBTYPE_HAS = /[А-Яа-яЁё]/;

const NEED_RU: Record<string, string> = {
  safety: 'Безопасность', love: 'Близость', worth: 'Ценность', autonomy: 'Самостоятельность',
  belonging: 'Принадлежность', meaning: 'Смысл', joy: 'Радость',
};
const QUALITY_RU: Record<string, string> = {
  calm: 'Спокойствие', clarity: 'Ясность', compassion: 'Сострадание', curiosity: 'Любопытство',
  confidence: 'Уверенность', courage: 'Смелость', creativity: 'Творчество', connectedness: 'Связанность',
};

const NEED_PRACTICE: Record<'en' | 'ru', Record<Need, string>> = {
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
};

@Component({
  selector: 'app-innerverse-report',
  standalone: true,
  imports: [CommonModule, InnerverseConstellationComponent],
  templateUrl: './innerverse-report.component.html',
  styleUrls: ['./innerverse-report.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InnerverseReportComponent implements AfterViewInit, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>, { optional: true });
  private observer: IntersectionObserver | null = null;

  /** Memory-anchor motion: sections rise in as they enter the viewport. */
  ngAfterViewInit(): void {
    if (typeof IntersectionObserver === 'undefined' || !this.host) return;
    const sections = (this.host.nativeElement as HTMLElement)
      .querySelectorAll('.panel, .strength-hero, .crisis');
    this.observer = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (e.isIntersecting) {
          (e.target as HTMLElement).classList.add('revealed');
          this.observer?.unobserve(e.target);
        }
      }
    }, { threshold: 0.12 });
    sections.forEach(s => this.observer?.observe(s));
  }

  ngOnDestroy(): void { this.observer?.disconnect(); }

  private readonly translationService = inject(TranslationService);
  private readonly sanitizer = inject(DomSanitizer);

  /** Display-only: collectible sticker avatar for a part/resource id. */
  stickerHtml(id: string): SafeHtml {
    const spec = PART_STICKERS[id];
    if (!spec) return this.sanitizer.bypassSecurityTrustHtml('');
    return this.sanitizer.bypassSecurityTrustHtml(
      sticker({ name: id, shape: spec.shape, color: spec.color, glyph: spec.glyph }));
  }

  /** Display-only: family accent color for a part id. */
  partColor(id: string): string { return PART_STICKERS[id]?.color ?? '#EDD75C'; }

  /** model (not plain input) so hosts bind [profile] and tests can .set() it. */
  readonly profile = model.required<ScoredProfile>();
  readonly signedIn = input(false);
  readonly backupRequested = output<void>();
  back = output<void>();
  saveRequested = output<void>();
  cabinetRequested = output<void>();
  practiceRequested = output<void>();

  /** §3B.4: stable client code the user reads to their specialist. */
  readonly specialistCode = signal(this.loadOrMakeCode());
  readonly codeShown = signal(false);
  readonly codeCopied = signal(false);

  private loadOrMakeCode(): string {
    const KEY = 'INNERVERSE_CLIENT_CODE_V1';
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) return saved;
      const code = generateLinkCode();
      localStorage.setItem(KEY, code);
      return code;
    } catch { return generateLinkCode(); }
  }

  toggleCode(): void {
    this.codeShown.update(v => !v);
    this.codeCopied.set(false);
  }

  copyCode(): void {
    try { navigator.clipboard?.writeText(this.specialistCode()); } catch { /* no clipboard */ }
    this.codeCopied.set(true);
  }

  readonly lang = computed(() => this.translationService.getLanguage());
  readonly ui = computed(() => UI[this.lang()] as typeof UI.en);
  readonly needPractice = computed(() => NEED_PRACTICE[this.lang()]);
  readonly qualities = SELF_QUALITIES;
  readonly RESOURCES = RESOURCES;

  /** Bilingual headline + subtype names (constellation-copy.ts). */
  readonly headlineName = computed(() =>
    constellationName(this.profile().headline, this.lang() as 'en' | 'ru'));
  readonly headlineEssay = computed(() =>
    constellationEssay(this.profile().headline, this.lang() as 'en' | 'ru'));
  headlineSubtype(id: ShadowPartId): string {
    const p = this.profile();
    const sub = p.subtypes[id];
    return subtypeName(id, sub.slug, sub.name, this.lang() as 'en' | 'ru');
  }
  partName(id: ShadowPartId): string {
    const base = this.headlineSubtype(id);
    if (this.lang() === 'ru' && !RU_SUBTYPE_HAS.test(base)) {
      return PART_NAME_RU[id] ?? base;
    }
    return base;
  }
  resName(r: string): string {
    return resourceName(r as never, this.lang() as 'en' | 'ru');
  }
  needLabel(need: string): string { return this.lang() === 'ru' ? NEED_RU[need] ?? need : need; }
  qualityLabel(q: string): string { return this.lang() === 'ru' ? QUALITY_RU[q] ?? q : q; }
  /** Long essays read best as a few short paragraphs. */
  readonly essayParas = computed(() => {
    const essay = this.headlineEssay();
    const sentences = essay.match(/[^.!?]+[.!?]+\s*/g) ?? [essay];
    const paras: string[] = [];
    for (let i = 0; i < sentences.length; i += 3) {
      paras.push(sentences.slice(i, i + 3).join('').trim());
    }
    return paras;
  });
  polarizationName(en: string): string { return polName(en, this.lang() as 'en' | 'ru'); }
  strongResourceName(): string {
    return resourceName(this.profile().strongestResource.id, this.lang() as 'en' | 'ru');
  }
  complexName(id: string, en: string): string {
    return this.lang() === 'ru' ? COMPLEX_COPY_RU[id]?.name ?? en : en;
  }
  complexBelief(id: string, en: string): string {
    return this.lang() === 'ru' ? COMPLEX_COPY_RU[id]?.belief ?? en : en;
  }
  complexExperiment(id: string, en: string): string {
    return this.lang() === 'ru' ? COMPLEX_COPY_RU[id]?.experiment ?? en : en;
  }

  readonly sortedParts = computed(() => {
    const p = this.profile();
    return [...SHADOW_PARTS]
      .sort((a, b) =>
        TIER_ORDER[p.parts[a].tier] - TIER_ORDER[p.parts[b].tier]
        || p.parts[b].T - p.parts[a].T
        || SHADOW_PARTS.indexOf(a) - SHADOW_PARTS.indexOf(b));
  });

  readonly attachmentStyle = computed(() => {
    const a = this.profile().attachment;
    return a.disorganized ? 'disorganized'
      : a.anxious >= a.avoidant && a.anxious >= a.secure ? 'anxious'
      : a.avoidant >= a.secure ? 'avoidant' : 'secure';
  });

  /** §3C.3: rolling ratio of globalizing↔localizing tokens in stored free text. */
  readonly vane = computed(() => {
    try {
      const verdicts: { text: string }[] =
        JSON.parse(localStorage.getItem('INNERVERSE_SEALED_VERDICTS_V1') ?? '[]');
      const texts = verdicts.map(v => v.text).filter(t => t && t.trim().length > 0);
      if (texts.length === 0) return null;
      const lang = this.translationService.getLanguage();
      return attributionRatio(texts, lang);
    } catch { return null; }
  });

  /** 0 = pure behavior-language, 100 = pure essence-language. */
  readonly vanePosition = computed(() => {
    const v = this.vane();
    if (!v) return 50;
    const ratio = v.ratio === Infinity ? 3 : v.ratio;
    return Math.round(Math.min(100, Math.max(0, ratio / 3 * 100)));
  });

  readonly activeComplexDefs = computed(() =>
    this.profile().activeComplexes.map(c => ({ ...c, def: COMPLEXES[c.id] })));

  readonly layer = signal<Record<string, LayerKey>>({});

  layerFor(part: ShadowPartId): LayerKey { return this.layer()[part] ?? 'face'; }

  cycleLayer(part: ShadowPartId): void {
    this.layer.update(m => {
      const cur = m[part] ?? 'face';
      return { ...m, [part]: LAYERS[(LAYERS.indexOf(cur) + 1) % LAYERS.length] };
    });
  }

  copyFor(part: ShadowPartId, layer: LayerKey): string {
    return PART_COPY[this.lang()][part][layer];
  }

  layerLabel(layer: LayerKey): string {
    const labels = {
      en: { face: 'Face', need: 'Need', shadow: 'Shadow', superpower: 'Superpower' },
      ru: { face: 'Лицо', need: 'Потребность', shadow: 'Тень', superpower: 'Суперсила' },
    } as const;
    return labels[this.lang()][layer];
  }

  exileBelief(id: string): string {
    const beliefs: Record<string, [string, string]> = {
      abandoned: ['I will be left.', 'Меня оставят.'],
      ashamed: ['I am defective.', 'Я дефектный.'],
      frightened: ['I am not safe.', 'Мне небезопасно.'],
      unseen: ['I do not matter.', 'Я не имею значения.'],
    };
    return (beliefs[id] ?? ['', ''])[this.lang() === 'en' ? 0 : 1];
  }

  resourceBand(r: (typeof RESOURCES)[number]): { band: string; leak?: string } {
    const p = this.profile();
    const ui = this.ui();
    const leakPart = p.resourceLeaks.find(l => l.resource === r);
    return {
      band: ui.band[p.resources[r].band],
      leak: leakPart ? ui.leak(RESOURCE_BANDS[r].hyperName) : undefined,
    };
  }

  readonly tiersExist = computed(() =>
    (['dominant', 'prominent', 'present', 'dormant'] as Tier[]));
}
