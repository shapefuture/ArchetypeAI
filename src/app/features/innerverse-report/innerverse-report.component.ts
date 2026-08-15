/**
 * INNERVERSE — Report (REVAMP_PLAN.md §3.3).
 * Strength-first: the strongest resource leads before any shadow content.
 * No global verdicts; every insight card ends in something behavioral (§3C.8).
 */
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, computed, inject, model, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../services/translation.service';
import {
  SHADOW_PARTS, RESOURCES, SELF_QUALITIES, COMPLEXES, RESOURCE_BANDS,
  type ShadowPartId, type Tier, type Need,
} from '../../core/data/parts';
import { PART_COPY, LAYERS, type LayerKey } from '../../core/data/part-copy';
import { InnerverseConstellationComponent } from '../constellation/innerverse-constellation.component';
import type { ScoredProfile } from '../../core/data/scoring-v2';
import { attributionRatio } from '../../core/data/state-v2';

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
    complexBelief: 'The sentence that runs this storyline',
    complexExperiment: 'This week\'s micro-experiment',
    noComplexes: 'No storyline is gripping right now. Your complexes run quiet.',
    copingStack: 'Your coping stack · how the system escalates',
    whenFails: 'when that fails…',
    floorLabel: 'at the floor',
    needs: 'What your system is asking for',
    needsSub: 'Your loudest unmet need right now.',
    resources: 'Resources · bands',
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
    tierNames: { dormant: 'dormant', present: 'present', prominent: 'prominent', dominant: 'holding the floor' } as Record<Tier, string>,
  },
  ru: {
    report: 'Ваш Внутренний Космос',
    constellationOf: 'Созвездие',
    and: 'и',
    strongestResource: 'Ваш сильнейший ресурс ведёт',
    strongestResourceSub: r => `Ваш «${r}» включён. Всё ниже — погода вокруг него. Сначала силы, всегда.`,
    selfEnergy: 'Энергия Self',
    radar: 'Радар Self · 8 качеств (ориентировочно, не диагностика)',
    partsByTier: 'Ваши части — от громких к тихим',
    flipHint: 'нажмите на карточку: лицо → потребность → тень → суперсила',
    polarizations: 'Поляризации · два защитника в тупике',
    polarizationSub: 'Оба советчика одновременно держат слово.',
    complexes: 'Активные сюжетные линии',
    complexBelief: 'Фраза, которая ведёт эту линию',
    complexExperiment: 'Микро-эксперимент этой недели',
    noComplexes: 'Сейчас ни одна линия не держит вас. Комплексы тихи.',
    copingStack: 'Ваша стратегия совладания · как система эскалирует',
    whenFails: 'когда это не срабатывает…',
    floorLabel: 'на дне',
    needs: 'О чём просит ваша система',
    needsSub: 'Ваша самая громкая неудовлетворённая потребность сейчас.',
    resources: 'Ресурсы · диапазоны',
    band: { hypo: 'заблокирован', healthy: 'здоров', hyper: 'перегружен' },
    leak: r => `переливается в «${r}» — дуга перелива отражена на созвездии`,
    burden: 'Нагрузка системы',
    vane: 'Флюгер языка · сущность ↔ поведение (ориентировочно)',
    vaneEssence: 'язык сущности', vaneBehavior: 'язык поведения',
    vaneEmpty: 'Со временем запечатанные выводы нарисуют этот флюгер.',
    attachment: 'Паттерн привязанности',
    attStyle: {
      secure: 'Скорее надёжная', anxious: 'Скорее тревожная', avoidant: 'Скорее избегающая',
      disorganized: 'Смешанная (тревога + избегание)',
    },
    ethics: 'Это инструмент саморефлексии на основе модели «Внутренние семейные системы», а не диагностика и не терапия.',
    crisis: 'Сегодняшний результат тяжёлый. Если он поднимает больше, чем успокаивает, — ресурсы поддержки в одном нажатии в настройках.',
    back: 'Назад',
    tierNames: { dormant: 'дремлет', present: 'присутствует', prominent: 'заметна', dominant: 'держит слово' } as Record<Tier, string>,
  },
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

  /** model (not plain input) so hosts bind [profile] and tests can .set() it. */
  readonly profile = model.required<ScoredProfile>();
  back = output<void>();

  readonly lang = computed(() => this.translationService.getLanguage());
  readonly ui = computed(() => UI[this.lang()] as typeof UI.en);
  readonly needPractice = computed(() => NEED_PRACTICE[this.lang()]);
  readonly qualities = SELF_QUALITIES;

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
