import { ChangeDetectionStrategy, Component, computed, inject, signal, output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../services/translation.service';

import { ASSESSMENT_QUESTIONS } from '../../../shared/core/data/assessment-questions';

const LOCAL_STORAGE_KEY = 'ARCHETYPE_ASSESSMENT_RESPONSES';
// Persist the current question index separately so reload-during-test
// resumes on the SAME question, not the first unanswered one (which
// would silently drop the user's progress through the latter half).
const INDEX_KEY = 'ARCHETYPE_ASSESSMENT_INDEX';

@Component({
  selector: 'app-assessment-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './assessment-panel.component.html',
  styleUrls: ['./assessment-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssessmentPanelComponent {
  public readonly translationService = inject(TranslationService);
  
  // Outputs
  cancelled = output<void>();
  completed = output<number[]>();

  // State
  readonly assessmentQuestions = ASSESSMENT_QUESTIONS;
  readonly assessmentResponses = signal<number[]>([]);
  readonly currentQuestionIndex = signal(0);
  
  readonly currentQuestion = computed(() => this.assessmentQuestions[this.currentQuestionIndex()]);
  readonly assessmentProgress = computed(() => ((this.currentQuestionIndex()) / this.assessmentQuestions.length) * 100);
  readonly isLastQuestion = computed(() => this.currentQuestionIndex() === this.assessmentQuestions.length - 1);

  isNavigating = false;
  private navigationTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.loadPersistedResponses();
  }

  private loadPersistedResponses(): void {
    let savedResponses: string | null = null;
    try {
      savedResponses = localStorage.getItem(LOCAL_STORAGE_KEY);
    } catch { /* storage unavailable */ }

    let initialResponses: number[];
    try {
      initialResponses = savedResponses
        ? JSON.parse(savedResponses)
        : new Array(this.assessmentQuestions.length).fill(0);
    } catch {
      initialResponses = new Array(this.assessmentQuestions.length).fill(0);
    }

    this.assessmentResponses.set(initialResponses);

    // Prefer the persisted index (so reload-during-test lands on the same
    // question). Fall back to firstUnanswered for backward compatibility
    // (older sessions that have responses but no index saved).
    let restoredIndex = -1;
    try {
      const savedIndexStr = localStorage.getItem(INDEX_KEY);
      if (savedIndexStr !== null) {
        const parsed = parseInt(savedIndexStr, 10);
        if (Number.isFinite(parsed)) {
          // Clamp to valid range to defend against corrupted localStorage.
          restoredIndex = Math.max(0, Math.min(parsed, this.assessmentQuestions.length - 1));
        }
      }
    } catch { /* storage unavailable */ }

    if (restoredIndex >= 0) {
      this.currentQuestionIndex.set(restoredIndex);
    } else {
      const firstUnanswered = initialResponses.findIndex((r: number) => r === 0);
      this.currentQuestionIndex.set(firstUnanswered === -1 ? 0 : firstUnanswered);
    }
  }

  /** Persist the current question index to localStorage. */
  private persistIndex(index: number): void {
    try { localStorage.setItem(INDEX_KEY, String(index)); } catch { /* storage unavailable */ }
  }

  answerQuestion(rating: number): void {
    if (this.isNavigating) return;
    this.isNavigating = true;

    this.assessmentResponses.update(responses => {
      responses[this.currentQuestionIndex()] = rating;
      try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(responses)); } catch { /* storage unavailable */ }
      return [...responses];
    });

    this.navigationTimeoutId = setTimeout(() => {
      this.goToNextQuestion();
      this.isNavigating = false;
    }, 300);
  }

  goToPreviousQuestion(): void {
    if (this.currentQuestionIndex() > 0) {
      this.currentQuestionIndex.update(i => {
        const next = i - 1;
        this.persistIndex(next);
        return next;
      });
    }
  }

  private goToNextQuestion(): void {
    if (this.currentQuestionIndex() < this.assessmentQuestions.length - 1) {
      this.currentQuestionIndex.update(i => {
        const next = i + 1;
        this.persistIndex(next);
        return next;
      });
    } else {
      this.completed.emit(this.assessmentResponses());
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent): void {
    const key = Number(event.key);
    if (key >= 1 && key <= 5) {
      event.preventDefault();
      this.answerQuestion(key);
    } else if (event.key === 'ArrowLeft' || event.key === 'Backspace') {
      event.preventDefault();
      this.goToPreviousQuestion();
    }
  }
}
