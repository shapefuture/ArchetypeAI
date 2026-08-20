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
import { DomSanitizer } from '@angular/platform-browser';
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

type Stage = 'ethics' | 'item' | 'break' | 'future-self' | 'complete';

interface Persisted {
  answers: number[];
  itemIndex: number;
  somatic: Partial<Record<ShadowPartId, string[]>>;
}

const UI = {
  en: {
    exit: 'Exit',
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
    ethics1: 'A mirror, not a diagnosis · answers stay on this device',
    ethics2: 'Every part of you is welcome here. Nothing aims to delete or fix away any of you. You can stop at any time; anything can wait.',
    ethicsGo: 'I understand — begin Descent I',
    descent: n => `Descent ${['I', 'II', 'III'][n]}`,
    itemOf: (i, n) => `${i} / ${n}`,
    somaticQ: 'Where do you feel this?',
    somaticSkip: 'Skip',
    breakTitle: n => `Descent ${['I', 'II', 'III'][n]} complete`,
    breakSub: 'The stars you lit are held safely. Continue now, or return when you are ready — nothing is lost.',
    breakResume: n => (n < 2 ? `Continue — Descent ${['II', 'III'][n]}` : 'Behold your constellation'),
    breakLater: 'Return later',
    retakeNote: 'Your answers stay on this device.',
    recalibrated: 'The stars have been recalibrated. The old map cannot be translated — descend again to be measured anew.',
    fsTitle: 'Your North Star',
    fsSub: 'Not the version with fewer wounds — the one you are drawn toward. Answer two of the three (a sentence or two each). You can edit this anytime.',
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
    ethics1: 'Зеркало, а не диагноз · ответы остаются на устройстве',
    ethics2: 'Каждая ваша часть здесь желанна: ничего не нужно «удалять» или «чинить». Вы можете остановиться в любой момент — всё подождёт.',
    ethicsGo: 'Хорошо — начинаем Погружение I',
    descent: n => `Погружение ${['I', 'II', 'III'][n]}`,
    itemOf: (i, n) => `${i} / ${n}`,
    somaticQ: 'Где вы это чувствуете?',
    somaticSkip: 'Пропустить',
    breakTitle: n => `Погружение ${['I', 'II', 'III'][n]} завершено`,
    breakSub: 'Зажжённые вами звёзды мы сохранили. Можно продолжить сразу или вернуться позже — ничего не потеряется.',
    breakResume: n => (n < 2 ? `Продолжить — Погружение ${['II', 'III'][n]}` : 'Пора увидеть ваше созвездие'),
    breakLater: 'Вернуться позже',
    retakeNote: 'Ответы остаются на этом устройстве.',
    recalibrated: 'Звёзды перенастроены: прежнюю карту не перевести на новый лад. Пройдите все три погружения заново — вас измерят по-новой.',
    fsTitle: 'Ваша Полярная звезда',
    fsSub: 'Не версия «с меньшим числом ран», а та, к которой вас тянет. Ответьте на два из трёх (по предложению-два). Позже можно изменить.',
    fsQ: [
      'Через год — к чему вы движетесь?',
      'Ваша версия, встретившая эти части, — что она делает иначе под нагрузкой?',
      'Что вы любите настолько, что оно вас зовёт?',
    ],
    fsSkip: 'Пока пропустить — тусклая звезда подержит место',
    fsSave: 'Задать Полярную звезду',
  },
};

const ZONE_LABELS: Record<'en' | 'ru', Record<string, string>> = {
  en: {
    head: 'Head', 'jaw-face': 'Jaw / face', throat: 'Throat', chest: 'Chest',
    gut: 'Gut', 'shoulders-arms': 'Shoulders / arms', pelvis: 'Pelvis', legs: 'Legs',
  },
  ru: {
    head: 'Голова', 'jaw-face': 'Челюсть и лицо', throat: 'Горло', chest: 'Грудь',
    gut: 'Живот', 'shoulders-arms': 'Плечи и руки', pelvis: 'Таз', legs: 'Ноги',
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
  private readonly sanitizer = inject(DomSanitizer);

  readonly novaHtml = () => this.sanitizer.bypassSecurityTrustHtml(novaSvg());
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

  goBack(): void {
    if (this.stage() === 'item' && this.itemIndex() > 0) {
      this.itemIndex.update(i => i - 1);
      this.persist();
      return;
    }
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
      localStorage.setItem(FUTURE_SELF_KEY, JSON.stringify(this.futureSelf()));
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
