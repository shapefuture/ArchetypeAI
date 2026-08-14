/**
 * INNERVERSE — Daily check-in (REVAMP §1.10, §3C.1). ≤15 seconds, taps only:
 * arousal → optional event type → "Did the ___ take the wheel?" confirm/correct.
 * History is local-only; the weather layer and unburdening moments accrue here.
 */
import { ChangeDetectionStrategy, Component, computed, inject, model, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../services/translation.service';
import { SHADOW_PARTS, SUBTYPES, type EventType, type PartId } from '../../core/data/parts';
import type { ScoredProfile } from '../../core/data/scoring-v2';
import {
  predictFlare, weatherLayer, unburdeningMoments, verdictLockActive,
  sealVerdict, readyToResurface, type CheckIn, type Arousal, type SealedVerdict,
} from '../../core/data/state-v2';

const STORE_KEY = 'INNERVERSE_CHECKINS_V1';
const VERDICT_KEY = 'INNERVERSE_SEALED_VERDICTS_V1';

type Stage = 'arousal' | 'event' | 'confirm' | 'done';

const UI = {
  en: {
    title: 'Daily check-in',
    where: 'Where are you right now?',
    arousal: ['Shutdown', 'Low', 'In my window', 'Activated', 'Hyper'],
    eventQ: 'What kind of day was it? (optional)',
    events: ['Relational', 'Achievement', 'Loss', 'Boundary', 'Change', 'Calm day'],
    skip: 'Skip',
    didIt: p => `Did the ${p} take the wheel?`,
    yes: 'Yes — it drove',
    no: 'No — I noticed and chose',
    correct: 'No — another part drove',
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
    arousal: ['Заморожен', 'Низко', 'В окне', 'Взвинчен', 'Гипер'],
    eventQ: 'Каким был день? (необязательно)',
    events: ['Отношения', 'Достижение', 'Потеря', 'Граница', 'Перемены', 'Спокойный'],
    skip: 'Пропустить',
    didIt: p => `Не «${p}» ли сегодня держал руль?`,
    yes: 'Да — вёл',
    no: 'Нет — я заметил и выбрал сам',
    correct: 'Нет — вела другая часть',
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
};

@Component({
  selector: 'app-checkin-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checkin-panel.component.html',
  styleUrls: ['./checkin-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckInPanelComponent {
  private readonly translationService = inject(TranslationService);

  /** model so hosts bind [profile] and tests can .set() it. */
  readonly profile = model<ScoredProfile | null>(null);
  closed = output<void>();

  readonly stage = signal<Stage>('arousal');
  readonly arousal = signal<Arousal | null>(null);
  readonly eventType = signal<EventType | null>(null);
  readonly predicted = signal<PartId | null>(null);
  readonly correcting = signal(false);
  readonly history = signal<CheckIn[]>([]);
  readonly verdictDraft = signal('');
  readonly resurfacing = signal<SealedVerdict | null>(null);

  readonly lang = computed(() => this.translationService.getLanguage());
  readonly ui = computed(() => UI[this.lang()] as typeof UI.en);

  readonly partsByT = computed(() => {
    const p = this.profile();
    if (!p) return SHADOW_PARTS;
    return [...SHADOW_PARTS].sort((a, b) => p.parts[b].T - p.parts[a].T);
  });

  readonly lockActive = computed(() =>
    verdictLockActive(this.history(), new Date()));

  readonly weather = computed(() => weatherLayer(this.history(), new Date()));

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      this.history.set(JSON.parse(localStorage.getItem(STORE_KEY) ?? '[]'));
      const verdicts: SealedVerdict[] = JSON.parse(localStorage.getItem(VERDICT_KEY) ?? '[]');
      const due = verdicts.find(v => !v.reRating && readyToResurface(v, new Date()));
      if (due) this.resurfacing.set(due);
    } catch { /* fresh */ }
  }

  private save(): void {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(this.history())); } catch { /* unavailable */ }
  }

  arousalForIndex(i: number): Arousal { return (2 - i) as Arousal; }

  eventForIndex(i: number): EventType {
    return (['relational', 'achievement', 'loss', 'boundary', 'change', 'calm'][i]) as EventType;
  }

  rateByLabel(label: string): void {
    const v = this.resurfacing();
    if (v) this.rateResurfaced(v, label as 'still true' | 'partly' | 'state artifact');
  }

  chooseArousal(a: Arousal): void {
    this.arousal.set(a);
    this.stage.set('event');
  }

  chooseEvent(e: EventType | null): void {
    this.eventType.set(e);
    const p = this.profile();
    if (p && e) this.predicted.set(predictFlare(p, e));
    else if (p) this.predicted.set(p.copingStack.l1);
    this.stage.set('confirm');
  }

  /** confirm: predicted drove · noticed: user stayed in charge · correct: pick another part */
  confirmPart(mode: 'confirm' | 'noticed' | 'correct'): void {
    if (mode === 'correct') { this.correcting.set(true); return; }
    this.record(mode === 'confirm' ? this.predicted() : null);
  }

  pickPart(part: PartId): void {
    this.record(part);
  }

  private record(confirmed: PartId | null): void {
    const a = this.arousal();
    if (a === null) return;
    this.history.update(h => [...h, {
      date: new Date().toISOString(),
      arousal: a,
      eventType: this.eventType() ?? undefined,
      predictedPart: this.predicted() ?? undefined,
      confirmedPart: confirmed,
    }]);
    this.save();
    this.stage.set('done');
  }

  readonly unburdened = computed(() => {
    const h = this.history();
    const mid = Math.floor(h.length / 2);
    return unburdeningMoments(h.slice(0, mid), h.slice(mid));
  });

  partName(id: PartId): string {
    const p = this.profile();
    const shadow = id as keyof typeof SUBTYPES;
    if (SUBTYPES[shadow]) return (p && p.subtypes[shadow]?.name) ?? SUBTYPES[shadow][0].name;
    return id.charAt(0).toUpperCase() + id.slice(1);
  }

  sealCurrentVerdict(): void {
    const text = this.verdictDraft().trim();
    if (!text) return;
    try {
      const verdicts: SealedVerdict[] = JSON.parse(localStorage.getItem(VERDICT_KEY) ?? '[]');
      verdicts.push(sealVerdict(text, new Date()));
      localStorage.setItem(VERDICT_KEY, JSON.stringify(verdicts));
    } catch { /* unavailable */ }
    this.verdictDraft.set('');
  }

  rateResurfaced(v: SealedVerdict, rating: 'still true' | 'partly' | 'state artifact'): void {
    try {
      const verdicts: SealedVerdict[] = JSON.parse(localStorage.getItem(VERDICT_KEY) ?? '[]');
      const i = verdicts.findIndex(x => x.createdAt === v.createdAt);
      if (i >= 0) { verdicts[i].reRating = rating; localStorage.setItem(VERDICT_KEY, JSON.stringify(verdicts)); }
    } catch { /* unavailable */ }
    this.resurfacing.set(null);
  }

  close(): void { this.closed.emit(); }
}
