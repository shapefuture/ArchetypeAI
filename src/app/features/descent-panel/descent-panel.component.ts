/**
 * INNERVERSE — The Descents (REVAMP_PLAN.md §3.2, §1.12).
 *
 * Entry → ethics card → the full 147-item battery in three sittings of 49,
 * one item per screen, thumb-reach Likert, <200ms transitions, optional
 * somatic body-map follow-ups, resume-safe persistence. The Quick Scan
 * (§1.13) is NOT part of this flow — it is reserved as a standalone lead
 * magnet (engine: quickScan() in scoring-v2).
 */
import {
  ChangeDetectionStrategy, Component, computed, inject, output, signal,
  HostListener, OnDestroy,
} from '@angular/core';
import { STRINGS } from '../../../i18n/strings';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { localSet, localGet } from '../../core/data/local-store';
import { novaSvg } from '../landing/stickers';
import { TranslationService } from '../../../services/translation.service';
import {
  LIKERT, buildDescents, buildItemSequence, itemText, isReverseKeyed,
  type ItemRef,
} from '../../../i18n/items';
import type { ShadowPartId } from '../../core/data/parts';
import type { AssessmentInput } from '../../core/data/scoring-v2';
import {
  toAssessmentInput, somaticFollowUpFires, SOMATIC_ZONES, type SomaticZone,
} from '../../core/data/assessment-adapter';

const STORE_KEY = 'INNERVERSE_DESCENT_V1';
export const FUTURE_SELF_KEY = 'INNERVERSE_FUTURE_SELF_V1';
const LEGACY_KEY = 'ARCHETYPE_ASSESSMENT_RESPONSES'; // 64-item engine, unsalvageable (§4 step 9)

/** Somatic follow-ups are paused pending redesign — flip to re-enable. */
const SOMATIC_FOLLOW_UP_ENABLED = false;

type Stage = 'ethics' | 'item' | 'break' | 'future-self' | 'complete';

interface Persisted {
  answers: number[];
  itemIndex: number;
  somatic: Partial<Record<ShadowPartId, string[]>>;
}

const UI = STRINGS.descent.ui;
const ZONE_LABELS = STRINGS.descent.zoneLabels;


const LIKERT_EMOTES = ['🙅', '🤏', '🌗', '👋', '🎯'];

@Component({
  selector: 'app-descent-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './descent-panel.component.html',
  styleUrls: ['./descent-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DescentPanelComponent implements OnDestroy {
  private readonly sanitizer = inject(DomSanitizer);

  readonly novaHtml = () => this.sanitizer.bypassSecurityTrustHtml(novaSvg());
  readonly likertEmotes = LIKERT_EMOTES;
  private readonly translationService = inject(TranslationService);

  cancelled = output<void>();
  completed = output<AssessmentInput>();

  readonly descents = buildDescents();
  readonly sequence = buildItemSequence();
  readonly likert = LIKERT;
  readonly zones = SOMATIC_ZONES;

  readonly stage = signal<Stage>('ethics');
  readonly itemIndex = signal(0); // 0..146 across all three descents
  readonly answers = signal<number[]>(new Array(147).fill(0));
  readonly somatic = signal<Partial<Record<ShadowPartId, string[]>>>({});
  readonly pendingSomaticPart = signal<ShadowPartId | null>(null);
  readonly transitioning = signal(false);
  readonly futureSelf = signal<string[]>(['', '', '']);

  readonly lang = computed(() => this.translationService.getLanguage());
  readonly ui = computed(() => UI[this.lang()] as typeof UI.en);

  readonly currentRef = computed<ItemRef>(() => this.sequence[this.itemIndex()]);
  readonly currentText = computed(() => itemText(this.currentRef(), this.lang()));
  readonly descentIndex = computed(() => Math.min(2, Math.floor(this.itemIndex() / 49)));
  readonly indexInDescent = computed(() => this.itemIndex() - this.descentIndex() * 49);
  readonly descentSize = 49;
  readonly answeredInDescent = computed(() => {
    const start = this.descentIndex() * 49;
    return this.answers().slice(start, start + 49).filter(a => a > 0).length;
  });
  readonly litStars = computed(() => this.answers().filter(a => a > 0).length);

  private transitionTimer: ReturnType<typeof setTimeout> | null = null;

  /** §4 step 9: old 64-item profiles prompt a retake — no mapping is attempted. */
  readonly recalibrated = signal(false);

  private detectLegacy(): void {
    try {
      const legacy = localStorage.getItem(LEGACY_KEY);
      this.recalibrated.set(!!legacy && JSON.parse(legacy).length > 0);
    } catch { /* no legacy data */ }
  }

  constructor() {
    this.detectLegacy();
    this.restore();
  }

  private restore(): void {
    try {
      const saved = localGet<Persisted | null>(STORE_KEY, null);
      if (!saved) return;
      if (Array.isArray(saved.answers) && saved.answers.length === 147) {
        this.answers.set(saved.answers);
        this.itemIndex.set(Math.max(0, Math.min(saved.itemIndex ?? 0, 146)));
        this.somatic.set(saved.somatic ?? {});
        const firstUnanswered = saved.answers.findIndex(a => a === 0);
        if (firstUnanswered > 0) this.itemIndex.set(Math.min(firstUnanswered, 146));
        this.stage.set(this.itemIndex() >= 146 && this.answers()[146] > 0 ? 'break' : 'item');
      }
    } catch { /* fresh start */ }
  }

  private persist(): void {
    try {
      localSet(STORE_KEY, {
        answers: this.answers(), itemIndex: this.itemIndex(), somatic: this.somatic(),
      } satisfies Persisted);
    } catch { /* storage unavailable */ }
  }

  ngOnDestroy(): void {
    if (this.transitionTimer) clearTimeout(this.transitionTimer);
  }

  acceptEthics(): void { this.stage.set('item'); }

  answer(rating: number): void {
    if (this.transitioning()) return;
    this.transitioning.set(true);
    const idx = this.itemIndex();
    const ref = this.currentRef();

    this.answers.update(a => { a[idx] = rating; return [...a]; });

    // §1.12 deterministic somatic follow-up (stored locally, never telemetry).
    // Paused pending redesign — flip the flag to re-enable the body-map sheet.
    if (SOMATIC_FOLLOW_UP_ENABLED && somaticFollowUpFires(ref, rating) && ref.kind === 'shadow') {
      this.pendingSomaticPart.set(ref.part);
      this.transitioning.set(false);
      this.persist();
      return;
    }
    this.advance();
  }

  chooseZone(zone: SomaticZone): void {
    const part = this.pendingSomaticPart();
    if (part) {
      this.somatic.update(s => ({ ...s, [part]: [...(s[part] ?? []), zone] }));
    }
    this.pendingSomaticPart.set(null);
    this.advance();
  }

  skipZone(): void {
    this.pendingSomaticPart.set(null);
    this.advance();
  }

  private advance(): void {
    this.transitionTimer = setTimeout(() => {
      this.transitioning.set(false);
      if (this.itemIndex() >= 146) {
        this.persist();
        this.stage.set('future-self');
        return;
      }
      // End of a sitting → break screen (continue immediately, or come back later)
      if (this.indexInDescent() === 48 && this.itemIndex() < 146) {
        this.persist();
        this.stage.set('break');
        return;
      }
      this.itemIndex.update(i => i + 1);
      this.persist();
    }, 150);
  }

  resumeFromBreak(): void {
    if (this.itemIndex() >= 146 && this.answers()[146] > 0) {
      // §3D.2: Future Self prompt at the end of Descent III, before the reveal
      this.stage.set('future-self');
      return;
    }
    this.itemIndex.update(i => Math.min(146, i + 1));
    this.stage.set('item');
    this.persist();
  }

  /** The second break option: progress is already persisted — leave to the
   * dashboard and pick up at this sitting next time. */
  leaveFromBreak(): void {
    this.persist();
    this.cancelled.emit();
  }

  /** Previous statement only — never exits the flow (that's exitDescent). */
  goBack(): void {
    if (this.stage() !== 'item') return;
    if (this.itemIndex() > 0) {
      this.itemIndex.update(i => i - 1);
      this.persist();
    }
  }

  /** Forward in review mode — only after goBack, when the current item is answered. */
  goForward(): void {
    if (this.stage() !== 'item') return;
    if (this.itemIndex() < 146 && this.answers()[this.itemIndex()] > 0) {
      this.itemIndex.update(i => i + 1);
      this.persist();
    }
  }

  /** Leave the descent entirely — progress is already persisted per answer. */
  exitDescent(): void {
    this.persist();
    this.cancelled.emit();
  }

  /** §3D.2: min 2 answers of ≥1 sentence each across the three prompts. */
  readonly futureSelfValid = computed(() => {
    const answers = this.futureSelf().filter(a => a.trim().length > 0);
    const sentences = answers.join(' ').split(/[.!?…]+/).filter(x => x.trim().length > 3);
    return answers.length >= 2 && sentences.length >= 2;
  });

  setFutureSelfAnswer(i: number, v: string): void {
    this.futureSelf.update(a => { a[i] = v; return [...a]; });
  }

  saveFutureSelf(): void {
    try {
      localSet(FUTURE_SELF_KEY, this.futureSelf());
    } catch { /* unavailable */ }
    this.finish();
  }

  skipFutureSelf(): void {
    try { localStorage.removeItem(FUTURE_SELF_KEY); } catch { /* unavailable */ }
    this.finish();
  }

  private finish(): void {
    this.stage.set('complete');
    if (this.answers().every(a => a > 0)) {
      this.completed.emit(toAssessmentInput(this.answers()));
    }
    localStorage.removeItem(STORE_KEY);
  }

  readonly isReverse = isReverseKeyed;

  zoneLabel(zone: string): string {
    return ZONE_LABELS[this.lang()][zone] ?? zone;
  }

  @HostListener('window:keydown', ['$event'])
  onKey(event: KeyboardEvent): void {
    if (this.stage() !== 'item' || this.pendingSomaticPart()) return;
    const key = Number(event.key);
    if (key >= 1 && key <= 5) {
      event.preventDefault();
      this.answer(key);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.goBack();
    }
  }
}
