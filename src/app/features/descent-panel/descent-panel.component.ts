/**
 * INNERVERSE — The Descents (REVAMP_PLAN.md §3.2, §1.13, §1.12).
 *
 * Quick Scan offer → 3 sittings of 49 items, one item per screen,
 * thumb-reach Likert, <200ms transitions, optional somatic body-map
 * follow-ups, resume-safe persistence. All scoring is downstream and
 * deterministic; nothing is computed here.
 */
import {
  ChangeDetectionStrategy, Component, computed, inject, output, signal,
  HostListener, OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../services/translation.service';
import {
  ITEM_BANK, LIKERT, buildDescents, buildItemSequence, itemText, isReverseKeyed,
  type ItemRef,
} from '../../../i18n/items';
import { SHADOW_PARTS, type ShadowPartId } from '../../core/data/parts';
import { quickScan, type AssessmentInput } from '../../core/data/scoring-v2';
import {
  toAssessmentInput, somaticFollowUpFires, SOMATIC_ZONES, type SomaticZone,
} from '../../core/data/assessment-adapter';

const STORE_KEY = 'INNERVERSE_DESCENT_V1';
const LEGACY_KEY = 'ARCHETYPE_ASSESSMENT_RESPONSES'; // 64-item engine, unsalvageable (§4 step 9)

type Stage = 'offer' | 'scan' | 'scan-result' | 'ethics' | 'item' | 'break' | 'complete';

interface Persisted {
  answers: number[];
  itemIndex: number;
  somatic: Partial<Record<ShadowPartId, string[]>>;
}

const UI = {
  en: {
    offer: 'Meet one part in 90 seconds',
    offerSub: 'Fourteen statements. One part of you steps forward. No result is kept — it only opens the door.',
    skipScan: 'Begin Descent I directly',
    exit: 'Exit',
    back: 'Back',
    next: 'Continue',
    beginDescent: n => `Begin Descent ${'I'.repeat(0) || ''}${['I', 'II', 'III'][n]}`,
    descent: n => `Descent ${['I', 'II', 'III'][n]}`,
    scanResultFamily: part => `${part} stepped forward.`,
    scanResultSelf: 'No part claimed the floor — your Self is near the surface. The Descents will still find the quieter ones.',
    scanCta: 'Begin Descent I to meet the rest',
    ethicsTitle: 'Before you descend',
    ethics1: 'This is a self-reflection tool grounded in the Internal Family Systems model, not a diagnosis or therapy.',
    ethics2: 'Every part of you is welcome here. Nothing aims to delete or fix away any of you. You can stop at any time; anything can wait.',
    ethicsGo: 'I understand — descend',
    itemOf: (i, n) => `${i} / ${n}`,
    somaticQ: 'Where do you feel this?',
    somaticSkip: 'Skip',
    breakTitle: n => `Descent ${['I', 'II', 'III'][n]} complete`,
    breakSub: 'The stars you lit are held safely. Return when you are ready — nothing is lost.',
    breakResume: n => (n < 2 ? `Begin Descent ${['II', 'III'][n]}` : 'Behold your constellation'),
    retakeNote: 'Your answers stay on this device.',
    recalibrated: 'The stars have been recalibrated. The old map cannot be translated — descend again to be measured anew.',
  },
  ru: {
    offer: 'Встретьте одну часть за 90 секунд',
    offerSub: 'Четырнадцать утверждений. Одна часть вас выходит вперёд. Ничего не сохраняется — это только дверь.',
    skipScan: 'Начать Нисхождение I сразу',
    exit: 'Выйти',
    back: 'Назад',
    next: 'Дальше',
    beginDescent: n => `Начать Нисхождение ${['I', 'II', 'III'][n]}`,
    descent: n => `Нисхождение ${['I', 'II', 'III'][n]}`,
    scanResultFamily: part => `Вперёд вышла часть «${part}».`,
    scanResultSelf: 'Ни одна часть не заняла сцену — ваш Self близко к поверхности. Нисхождения всё равно найдут более тихие.',
    scanCta: 'Начать Нисхождение I, чтобы встретить остальных',
    ethicsTitle: 'Перед нисхождением',
    ethics1: 'Это инструмент саморефлексии на основе модели «Внутренние семейные системы», а не диагностика и не терапия.',
    ethics2: 'Каждая ваша часть здесь желанна. Ничто здесь не стремится удалить или «починить» вас. Вы можете остановиться в любой момент.',
    ethicsGo: 'Понимаю — нисхожу',
    itemOf: (i, n) => `${i} / ${n}`,
    somaticQ: 'Где вы это чувствуете?',
    somaticSkip: 'Пропустить',
    breakTitle: n => `Нисхождение ${['I', 'II', 'III'][n]} завершено`,
    breakSub: 'Зажжённые звёзды сохранены. Возвращайтесь, когда будете готовы — ничего не потеряно.',
    breakResume: n => (n < 2 ? `Начать Нисхождение ${['II', 'III'][n]}` : 'Взгляните на своё созвездие'),
    retakeNote: 'Ответы остаются на этом устройстве.',
    recalibrated: 'Звёзды перенастроены. Старую карту нельзя перевести — нисходите заново, чтобы вас измерили по-новому.',
  },
};

@Component({
  selector: 'app-descent-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './descent-panel.component.html',
  styleUrls: ['./descent-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DescentPanelComponent implements OnDestroy {
  private readonly translationService = inject(TranslationService);

  cancelled = output<void>();
  completed = output<AssessmentInput>();

  readonly descents = buildDescents();
  readonly sequence = buildItemSequence();
  readonly likert = LIKERT;
  readonly zones = SOMATIC_ZONES;
  readonly quickScanParts = SHADOW_PARTS;

  readonly stage = signal<Stage>('offer');
  readonly itemIndex = signal(0); // 0..146 across all three descents
  readonly answers = signal<number[]>(new Array(147).fill(0));
  readonly somatic = signal<Partial<Record<ShadowPartId, string[]>>>({});
  readonly pendingSomaticPart = signal<ShadowPartId | null>(null);
  readonly scanIndex = signal(0);
  readonly scanAnswers = signal<number[]>(new Array(14).fill(0));
  readonly scanFamily = signal<ReturnType<typeof quickScan> | null>(null);
  readonly transitioning = signal(false);

  readonly lang = computed(() => this.translationService.getLanguage());
  readonly ui = computed(() => UI[this.lang()] as typeof UI.en);
  readonly itemBank = computed(() => ITEM_BANK[this.lang()]);

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
  readonly isDescentBoundary = computed(() =>
    this.indexInDescent() === 48 && this.itemIndex() < 146);
  readonly scanItemText = computed(() =>
    this.itemBank().items[this.quickScanParts[this.scanIndex()]][0]);

  private transitionTimer: ReturnType<typeof setTimeout> | null = null;
  private restored = false;

  constructor() {
    this.detectLegacy();
    this.restore();
  }

  /** §4 step 9: old 64-item profiles prompt a retake — no mapping is attempted. */
  readonly recalibrated = signal(false);

  private detectLegacy(): void {
    try {
      const legacy = localStorage.getItem(LEGACY_KEY);
      this.recalibrated.set(!!legacy && JSON.parse(legacy).length > 0);
    } catch { /* no legacy data */ }
  }

  private restore(): void {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Persisted;
      if (Array.isArray(saved.answers) && saved.answers.length === 147) {
        this.answers.set(saved.answers);
        this.itemIndex.set(Math.max(0, Math.min(saved.itemIndex ?? 0, 146)));
        this.somatic.set(saved.somatic ?? {});
        const firstUnanswered = saved.answers.findIndex(a => a === 0);
        if (firstUnanswered > 0) this.itemIndex.set(Math.min(firstUnanswered, 146));
        this.restored = true;
        this.stage.set(this.itemIndex() >= 146 && this.answers()[146] > 0 ? 'break' : 'item');
      }
    } catch { /* fresh start */ }
  }

  private persist(): void {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        answers: this.answers(), itemIndex: this.itemIndex(), somatic: this.somatic(),
      } satisfies Persisted));
    } catch { /* storage unavailable */ }
  }

  ngOnDestroy(): void {
    if (this.transitionTimer) clearTimeout(this.transitionTimer);
  }

  // --- Quick Scan (§1.13) ---

  startScan(): void { this.stage.set('scan'); this.scanIndex.set(0); }

  answerScan(rating: number): void {
    this.scanAnswers.update(a => { a[this.scanIndex()] = rating; return [...a]; });
    if (this.scanIndex() < 13) {
      this.scanIndex.update(i => i + 1);
    } else {
      const map = {} as Partial<Record<ShadowPartId, number>>;
      SHADOW_PARTS.forEach((p, i) => { map[p] = this.scanAnswers()[i]; });
      this.scanFamily.set(quickScan(map));
      this.stage.set('scan-result');
    }
  }

  // --- Ethics + main flow ---

  /** From Quick Scan result or "skip" — always pass the gate first (§3 ethics card). */
  proceedToEthics(): void { this.stage.set('ethics'); }

  acceptEthics(): void { this.stage.set('item'); }

  answer(rating: number): void {
    if (this.transitioning()) return;
    this.transitioning.set(true);
    const idx = this.itemIndex();
    const ref = this.currentRef();

    this.answers.update(a => { a[idx] = rating; return [...a]; });

    // §1.12 deterministic somatic follow-up (stored locally, never telemetry)
    if (somaticFollowUpFires(ref, rating) && ref.kind === 'shadow') {
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
        this.stage.set('complete');
        this.completed.emit(toAssessmentInput(this.answers()));
        localStorage.removeItem(STORE_KEY);
        return;
      }
      // End of a sitting → break screen
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
      this.stage.set('complete');
      this.completed.emit(toAssessmentInput(this.answers()));
      localStorage.removeItem(STORE_KEY);
      return;
    }
    this.itemIndex.update(i => Math.min(146, i + 1));
    this.stage.set('item');
    this.persist();
  }

  goBack(): void {
    if (this.stage() === 'item' && this.itemIndex() > 0) {
      this.itemIndex.update(i => i - 1);
      this.persist();
      return;
    }
    this.cancelled.emit();
  }

  readonly isReverse = isReverseKeyed;

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
