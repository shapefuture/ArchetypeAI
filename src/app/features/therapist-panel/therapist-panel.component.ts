/**
 * INNERVERSE — Therapist Mode dashboard (REVAMP §3B.4).
 * License self-attestation → claim client invite codes → consent-scoped
 * client summaries → exercise assignments (incl. RED, container-gated).
 */
import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { take } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../services/translation.service';
import { AUTH_PORT } from '../../core/ports/auth.port';
import {
  claimTherapistLink, linkedClients, assignExercise, CONSENT_TEXT,
  type TherapistClientSummary, type AssignmentFrequency,
} from '../../core/data/therapist-link';
import { EXERCISES, EXERCISE_TYPES } from '../../core/data/exercises';
import { resistantMetrics, loadEvents } from '../../core/data/state-v2';

const ATTEST_KEY = 'INNERVERSE_THERAPIST_ATTESTED_V1';

const UI = {
  en: {
    title: 'Therapist Mode',
    close: 'Close',
    attest: 'I attest that I am a licensed mental-health professional.',
    license: 'License number (stored locally, not verified at launch)',
    enter: 'Enter dashboard',
    claimLabel: 'Client invite code',
    claim: 'Link client',
    badCode: 'Code not found.',
    clients: 'Linked clients',
    noClients: 'No clients linked yet. Ask your client for their invite code.',
    assign: 'Assign exercise',
    frequency: ['once', 'daily', 'weekly', 'after-trigger'],
    send: 'Assign',
    assigned: 'Assigned.',
    redNote: 'RED exercises attach only here — and only after the client has built their Safe Place container.',
    consentTitle: 'What you see — and never see',
    metricsTitle: 'Resistant outcomes (logged events only)',
    metrics: ['Time to repair', 'Secrecy duration', 'If-then fire rate', 'Disclosure ratio'],
    metricsRule: 'If self-report improves but these don’t, the work is being narrated, not generalized — shift from insight exercises to behavior/environment exercises.',
    fClient: 'Client', fExercise: 'Exercise', fFrequency: 'Frequency',
  },
  ru: {
    title: 'Режим терапевта',
    close: 'Закрыть',
    attest: 'Я подтверждаю, что являюсь дипломированным специалистом в области психического здоровья.',
    license: 'Номер лицензии (хранится локально, не проверяется на старте)',
    enter: 'Войти в панель',
    claimLabel: 'Код приглашения клиента',
    claim: 'Связать клиента',
    badCode: 'Код не найден.',
    clients: 'Связанные клиенты',
    noClients: 'Пока никто не связан. Попросите у клиента код приглашения.',
    assign: 'Назначить практику',
    frequency: ['once', 'daily', 'weekly', 'after-trigger'],
    send: 'Назначить',
    assigned: 'Назначено.',
    redNote: 'RED-практики доступны только здесь — и только после того, как клиент построил контейнер Безопасного Места.',
    consentTitle: 'Что вы видите — и чего не видите никогда',
    metricsTitle: 'Устойчивые исходы (только из журнала событий)',
    metrics: ['Время до исправления', 'Длительность умолчания', 'Доля сработавших «если–то»', 'Доля раскрытий'],
    metricsRule: 'Если самоотчёт улучшается, а эти метрики нет — работа проговаривается, а не генерализуется: переведите фокус с инсайтов на поведенческие и средовые практики.',
    fClient: 'Клиент', fExercise: 'Практика', fFrequency: 'Частота',
  },
};

@Component({
  selector: 'app-therapist-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './therapist-panel.component.html',
  styleUrls: ['./therapist-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TherapistPanelComponent {
  private readonly translationService = inject(TranslationService);
  private readonly auth = inject(AUTH_PORT);

  closed = output<void>();

  readonly lang = computed(() => this.translationService.getLanguage());
  readonly ui = computed(() => UI[this.lang()] as typeof UI.en);

  readonly attested = signal(localStorage.getItem(ATTEST_KEY) === 'yes');
  readonly entered = signal(false);
  readonly license = signal(localStorage.getItem(ATTEST_KEY + ':license') ?? '');
  readonly code = signal('');
  readonly clients = signal<TherapistClientSummary[]>([]);
  readonly claiming = signal(false);
  readonly error = signal('');
  readonly assignFor = signal<string | null>(null); // clientUid held locally for the form
  readonly assignExerciseId = signal('');
  readonly assignFreq = signal<AssignmentFrequency>('once');
  readonly assignedOk = signal(false);

  readonly exercises = EXERCISES;

  attest(v: boolean): void {
    this.attested.set(v);
    localStorage.setItem(ATTEST_KEY, v ? 'yes' : 'no');
  }

  setLicense(v: string): void {
    this.license.set(v);
    localStorage.setItem(ATTEST_KEY + ':license', v);
  }

  async enter(): Promise<void> {
    if (!this.attested() || this.license().trim().length < 3) return;
    this.entered.set(true);
    await this.refresh();
  }

  private get uid(): string {
    let uid: string | null = null;
    this.auth.user$.pipe(take(1)).subscribe(u => { uid = u?.uid ?? null; });
    return uid ?? 'local-therapist';
  }

  async refresh(): Promise<void> {
    try { this.clients.set(await linkedClients(this.uid)); }
    catch { this.clients.set([]); }
  }

  async claim(): Promise<void> {
    this.claiming.set(true);
    this.error.set('');
    try {
      const summary = await claimTherapistLink(this.uid, this.code());
      if (!summary) this.error.set(this.ui().badCode);
      else await this.refresh();
    } catch { this.error.set(this.ui().badCode); }
    this.claiming.set(false);
    this.code.set('');
  }

  freqKey(f: string): AssignmentFrequency {
    return f as AssignmentFrequency;
  }

  async send(): Promise<void> {
    if (!this.assignExerciseId()) return;
    // container enforcement happens in assignExercise for RED (§3E.3)
    await assignExercise(this.uid, this.assignFor() ?? 'client', {
      exerciseId: this.assignExerciseId(),
      frequency: this.assignFreq(),
    });
    this.assignedOk.set(true);
    setTimeout(() => this.assignedOk.set(false), 2000);
    this.assignExerciseId.set('');
  }

  readonly consentText = computed(() => CONSENT_TEXT[this.lang()]);

  /** §3C.6: hard-to-fake metrics from this client device's event log. */
  readonly metrics = computed(() => resistantMetrics(loadEvents()));

  exGate(exerciseId: string): string {
    const e = EXERCISES.find(x => x.id === exerciseId);
    return e ? EXERCISE_TYPES[e.type].gate : 'green';
  }

  close(): void { this.closed.emit(); }
}
