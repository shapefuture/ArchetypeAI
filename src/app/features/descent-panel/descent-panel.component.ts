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
import { CommonModule } from '@angular/common';
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
const LEGACY_KEY = 'ARCHETYPE_ASSESSMENT_RESPONSES'; // 64-item engine, unsalvageable (§4 step 9)

type Stage = 'ethics' | 'item' | 'break' | 'complete';

interface Persisted {
  answers: number[];
  itemIndex: number;
  somatic: Partial<Record<ShadowPartId, string[]>>;
}

const UI = {
  en: {
    exit: 'Exit',
    ethicsTitle: 'Before you descend',
    ethicsSub: 'The full battery: three sittings of 49 statements, one at a time. You can pause at any sitting — progress is kept on this device.',
    ethics1: 'This is a self-reflection tool grounded in the Internal Family Systems model, not a diagnosis or therapy.',
    ethics2: 'Every part of you is welcome here. Nothing aims to delete or fix away any of you. You can stop at any time; anything can wait.',
    ethicsGo: 'I understand — begin Descent I',
    descent: n => `Descent ${['I', 'II', 'III'][n]}`,
    itemOf: (i, n) => `${i} / ${n}`,
    somaticQ: 'Where do you feel this?',
    somaticSkip: 'Skip',
    breakTitle: n => `Descent ${['I', 'II', 'III'][n]} complete`,
    breakSub: 'The stars you lit are held safely. Continue now, or return when you are ready — nothing is lost.',
    breakResume: n => (n < 2 ? `Continue — Descent ${['II', 'III'][n]}` : 'Behold your constellation'),
    retakeNote: 'Your answers stay on this device.',
    recalibrated: 'The stars have been recalibrated. The old map cannot be translated — descend again to be measured anew.',
  },
  ru: {
    exit: 'Выйти',
    ethicsTitle: 'Перед нисхождением',
    ethicsSub: 'Полная батарея: три сидения по 49 утверждений, по одному за экран. Можно остановиться на любом сидении — прогресс хранится на этом устройстве.',
    ethics1: 'Это инструмент саморефлексии на основе модели «Внутренние семейные системы», а не диагностика и не терапия.',
    ethics2: 'Каждая ваша часть здесь желанна. Ничто здесь не стремится удалить или «починить» вас. Вы можете остановиться в любой момент.',
    ethicsGo: 'Понимаю — начать Нисхождение I',
    descent: n => `Нисхождение ${['I', 'II', 'III'][n]}`,
    itemOf: (i, n) => `${i} / ${n}`,
    somaticQ: 'Где вы это чувствуете?',
    somaticSkip: 'Пропустить',
    breakTitle: n => `Нисхождение ${['I', 'II', 'III'][n]} завершено`,
    breakSub: 'Зажжённые звёзды сохранены. Продолжайте сейчас или возвращайтесь, когда будете готовы — ничего не потеряно.',
    breakResume: n => (n < 2 ? `Продолжить — Нисхождение ${['II', 'III'][n]}` : 'Взгляните на своё созвездие'),
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

  readonly stage = signal<Stage>('ethics');
  readonly itemIndex = signal(0); // 0..146 across all three descents
  readonly answers = signal<number[]>(new Array(147).fill(0));
  readonly somatic = signal<Partial<Record<ShadowPartId, string[]>>>({});
  readonly pendingSomaticPart = signal<ShadowPartId | null>(null);
  readonly transitioning = signal(false);

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
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Persisted;
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
      localStorage.setItem(STORE_KEY, JSON.stringify({
        answers: this.answers(), itemIndex: this.itemIndex(), somatic: this.somatic(),
      } satisfies Persisted));
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
