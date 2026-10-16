/**
 * INNERVERSE — Report (REVAMP_PLAN.md §3.3).
 * Strength-first: the strongest resource leads before any shadow content.
 * No global verdicts; every insight card ends in something behavioral (§3C.8).
 */
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, computed, inject, input, model, output, signal } from '@angular/core';
import { STRINGS } from '../../../shared/i18n/strings';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../services/translation.service';
import {
  SHADOW_PARTS, RESOURCES, SELF_QUALITIES, COMPLEXES, RESOURCE_BANDS,
  type ShadowPartId, type Tier, type Need,
} from '../../../shared/core/data/parts';
import { PART_COPY, LAYERS, type LayerKey } from '../../../shared/core/data/part-copy';
import { constellationName, constellationEssay, subtypeName, resourceName, COMPLEX_COPY_RU, polarizationName as polName, PART_NAME_RU } from '../../../shared/core/data/constellation-copy';
import { generateLinkCode } from '../../core/data/therapist-link';
import { InnerverseConstellationComponent } from '../constellation/innerverse-constellation.component';
import type { ScoredProfile } from '../../../shared/core/data/scoring-v2';
import { attributionRatio } from '../../../shared/core/data/state-v2';
import { sticker } from '../../../shared/features/landing/stickers';
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

const UI = STRINGS.innerverseReport.ui;
const NEED_PRACTICE = STRINGS.innerverseReport.needPractice;



const RU_SUBTYPE_HAS = /[А-Яа-яЁё]/;

const NEED_RU = STRINGS.innerverseReport.needLabelsRu;
const QUALITY_RU = STRINGS.innerverseReport.qualityLabelsRu;



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
    return STRINGS.innerverseReport.layerLabels[this.lang()][layer];
  }

  exileBelief(id: string): string {
    const beliefs = STRINGS.innerverseReport.exileBeliefs;
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
