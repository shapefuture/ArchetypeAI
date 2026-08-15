/**
 * INNERVERSE — Practice panel (§3B/§3D): today's single suggestion, the
 * 5-chapter path (Ch.5 therapist-only), and the safety-gated exercise
 * library. Completions are logged locally and feed chapter unlocks.
 */
import { ChangeDetectionStrategy, Component, computed, inject, model, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../services/translation.service';
import type { ScoredProfile } from '../../core/data/scoring-v2';
import {
  EXERCISES, EXERCISE_TYPES, suggestExercise, chapterUnlocked,
  type Exercise, type ExerciseTypeId, type Gate,
} from '../../core/data/exercises';

const STORE_KEY = 'INNERVERSE_PRACTICE_V1';

interface PracticeState {
  lastSuggestedAt: string | null;
  completed: string[]; // exercise ids
  daysOfCheckIns: number;
  synastryRun: boolean;
  therapistLinked: boolean;
}

const UI = {
  en: {
    title: 'Practice',
    today: 'Today’s practice',
    noneToday: 'No suggestion today — a quiet day is a real practice too. The library is open below.',
    chapters: 'Practice path · skills unlocked, never levels earned',
    chapterNames: ['Grounding', 'Meeting', 'Tending', 'Relating', 'Integrating'],
    locked: 'Locked', unlocked: 'Unlocked',
    gate: { green: 'self-serve', yellow: 'gated', red: 'therapist only' },
    stopRule: 'If it gets intense',
    done: 'Mark practiced',
    close: 'Close',
    ch2Hint: '7 days of check-ins', ch3Hint: 'after a part dialogue', ch4Hint: 'a synastry run', ch5Hint: 'therapist link only',
  },
  ru: {
    title: 'Практика',
    today: 'Практика на сегодня',
    noneToday: 'На сегодня предложений нет — тихий день тоже практика. Библиотека открыта ниже.',
    chapters: 'Путь практики · открываются навыки, а не «уровни человека»',
    chapterNames: ['Заземление', 'Встреча', 'Забота', 'Отношения', 'Интеграция'],
    locked: 'Закрыто', unlocked: 'Открыто',
    gate: { green: 'самостоятельно', yellow: 'с ограничением', red: 'только с терапевтом' },
    stopRule: 'Если становится остро',
    done: 'Отметить выполненным',
    close: 'Закрыть',
    ch2Hint: '7 дней сверок', ch3Hint: 'после диалога с частью', ch4Hint: 'после синастрии', ch5Hint: 'только связь с терапевтом',
  },
};

@Component({
  selector: 'app-practice-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './practice-panel.component.html',
  styleUrls: ['./practice-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PracticePanelComponent {
  private readonly translationService = inject(TranslationService);

  readonly profile = model<ScoredProfile | null>(null);
  closed = output<void>();

  readonly lang = computed(() => this.translationService.getLanguage());
  readonly ui = computed(() => UI[this.lang()] as typeof UI.en);
  readonly open = signal<ExerciseTypeId | null>(null);

  readonly state = signal<PracticeState>({
    lastSuggestedAt: null, completed: [], daysOfCheckIns: 0,
    synastryRun: false, therapistLinked: false,
  });

  constructor() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) this.state.set({ ...this.state(), ...JSON.parse(raw) });
    } catch { /* fresh */ }
  }

  private save(): void {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(this.state())); } catch { /* unavailable */ }
  }

  readonly suggestion = computed(() => {
    const p = this.profile();
    if (!p) return null;
    return suggestExercise({
      profile: p,
      checkIns: [],
      now: new Date(),
      lastSuggestedAt: this.state().lastSuggestedAt ? new Date(this.state().lastSuggestedAt!) : null,
    });
  });

  chapterUnlocked(n: 1 | 2 | 3 | 4 | 5): boolean {
    return chapterUnlocked(n, {
      descentComplete: !!this.profile(),
      daysOfCheckIns: this.state().daysOfCheckIns,
      partDialogueCompleted: this.state().completed.includes('six-f-steps'),
      synastryRun: this.state().synastryRun,
      therapistLinked: this.state().therapistLinked,
    });
  }

  chapterExercises(n: 1 | 2 | 3 | 4 | 5): Exercise[] {
    return EXERCISES.filter(e => EXERCISE_TYPES[e.type].chapter === n);
  }

  gateOf(e: Exercise): Gate { return EXERCISE_TYPES[e.type].gate; }

  chapterOf(i: number): 1 | 2 | 3 | 4 | 5 { return (i + 1) as 1 | 2 | 3 | 4 | 5; }

  markDone(e: Exercise): void {
    this.state.update(s => ({ ...s, completed: [...new Set([...s.completed, e.id])] }));
    this.save();
  }

  isDone(e: Exercise): boolean { return this.state().completed.includes(e.id); }

  close(): void { this.closed.emit(); }
}
