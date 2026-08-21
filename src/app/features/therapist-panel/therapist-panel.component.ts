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
  claimTherapistLink, linkedClients, assignExercise, setClientArchived, CONSENT_TEXT,
  type TherapistClientSummary, type AssignmentFrequency, type LinkedClient,
} from '../../core/data/therapist-link';
import { EXERCISES, EXERCISE_TYPES } from '../../core/data/exercises';
import { resistantMetrics, loadEvents } from '../../core/data/state-v2';
import {
  getTherapistAvailability, saveTherapistAvailability, therapistAppointments,
  setAppointmentStatus, DEFAULT_AVAILABILITY,
  type Appointment, type AppointmentStatus, type AvailabilityWindow,
} from '../booking-panel/booking';

const ATTEST_KEY = 'INNERVERSE_THERAPIST_ATTESTED_V1';

/** Availability editor row: one weekday with enable toggle + HH:MM bounds. */
interface AvailabilityRow {
  day: number; // 1=Mon … 7=Sun
  enabled: boolean;
  start: string;
  end: string;
}

function defaultRows(): AvailabilityRow[] {
  return [1, 2, 3, 4, 5, 6, 7].map(day => ({
    day,
    enabled: day <= 5,
    start: '09:00',
    end: '17:00',
  }));
}

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
    archive: 'Archive',
    toArchive: 'Archive',
    restore: 'Restore',
    archived: 'Archived clients',
    noArchived: 'No archived clients.',
    requests: 'Session requests',
    noRequests: 'No session requests yet.',
    approve: 'Approve',
    decline: 'Decline',
    approvedChip: 'confirmed',
    statusPending: 'pending',
    statusApproved: 'approved',
    statusDeclined: 'declined',
    statusCancelled: 'cancelled',
    availability: 'Availability',
    availHint: 'Per-day working hours. Slots are 60 minutes.',
    dayNames: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    saveAvail: 'Save availability',
    saved: 'Saved.',
    clientNoSummary: 'linked via booking — no assessment summary yet',
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
    archive: 'Архив',
    toArchive: 'В архив',
    restore: 'Восстановить',
    archived: 'Архив клиентов',
    noArchived: 'Архив пуст.',
    requests: 'Заявки на сессии',
    noRequests: 'Заявок пока нет.',
    approve: 'Подтвердить',
    decline: 'Отклонить',
    approvedChip: 'подтверждена',
    statusPending: 'ожидает',
    statusApproved: 'подтверждена',
    statusDeclined: 'отклонена',
    statusCancelled: 'отменена',
    availability: 'Доступность',
    availHint: 'Рабочие часы по дням недели. Слоты — 60 минут.',
    dayNames: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
    saveAvail: 'Сохранить доступность',
    saved: 'Сохранено.',
    clientNoSummary: 'связан через запись — сводки результатов пока нет',
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
  readonly clients = signal<LinkedClient[]>([]);
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
    await this.loadAvailability();
  }

  private get uid(): string {
    let uid: string | null = null;
    this.auth.user$.pipe(take(1)).subscribe(u => { uid = u?.uid ?? null; });
    return uid ?? 'local-therapist';
  }

  async refresh(): Promise<void> {
    try { this.clients.set(await linkedClients(this.uid)); }
    catch { this.clients.set([]); }
    this.loadAppointments().catch(() => this.appts.set([]));
  }

  // ---------- §Booking: appointments ----------
  readonly appts = signal<Appointment[]>([]);
  readonly apptBusy = signal('');
  readonly pendingAppts = computed(() => this.appts().filter(a => a.status === 'pending'));
  readonly decidedAppts = computed(() =>
    this.appts().filter(a => a.status === 'approved')
      .concat(this.appts().filter(a => a.status === 'declined' || a.status === 'cancelled')));

  private async loadAppointments(): Promise<void> {
    const list = await therapistAppointments(this.uid);
    this.appts.set(list);
  }

  statusLabel(s: AppointmentStatus): string {
    const ui = this.ui() as typeof UI.ru & typeof UI.en;
    if (s === 'pending') return ui.statusPending;
    if (s === 'approved') return ui.statusApproved;
    if (s === 'declined') return ui.statusDeclined;
    return ui.statusCancelled;
  }

  async decide(id: string, status: 'approved' | 'declined'): Promise<void> {
    this.apptBusy.set(id);
    try {
      await setAppointmentStatus(id, status);
      await this.loadAppointments();
    } finally {
      this.apptBusy.set('');
    }
  }

  // ---------- §Booking: archive ----------
  readonly activeClients = computed(() => this.clients().filter(c => !c.archived));
  readonly archivedClients = computed(() => this.clients().filter(c => c.archived));

  async toggleArchive(clientUid: string, archived: boolean): Promise<void> {
    await setClientArchived(this.uid, clientUid, archived);
    await this.refresh();
  }

  // ---------- §Booking: availability editor ----------
  /** One editor row per weekday (1=Mon … 7=Sun). */
  readonly availRows = signal<AvailabilityRow[]>([]);
  readonly savingAvail = signal(false);
  readonly savedOk = signal(false);

  private async loadAvailability(): Promise<void> {
    let windows: AvailabilityWindow[];
    try { windows = await getTherapistAvailability(this.uid); }
    catch { windows = DEFAULT_AVAILABILITY; }
    this.availRows.set(defaultRows().map(row => {
      const w = windows.find(x => x.days.includes(row.day));
      return w
        ? { ...row, enabled: true, start: w.start, end: w.end }
        : row;
    }));
  }

  editStart(day: number, v: string): void {
    this.availRows.update(rows => rows.map(r => r.day === day ? { ...r, start: v } : r));
  }

  editEnd(day: number, v: string): void {
    this.availRows.update(rows => rows.map(r => r.day === day ? { ...r, end: v } : r));
  }

  editEnabled(day: number, v: boolean): void {
    this.availRows.update(rows => rows.map(r => r.day === day ? { ...r, enabled: v } : r));
  }

  async saveAvailability(): Promise<void> {
    this.savingAvail.set(true);
    try {
      const windows: AvailabilityWindow[] = this.availRows()
        .filter(r => r.enabled)
        .map(r => ({ days: [r.day], start: r.start, end: r.end, minutes: 60 }));
      let email: string | null = null;
      this.auth.user$.pipe(take(1)).subscribe(u => { email = u?.email ?? null; });
      await saveTherapistAvailability(this.uid, windows, email);
      this.availRows.set(this.availRows());
      this.savedOk.set(true);
      setTimeout(() => this.savedOk.set(false), 2000);
    } finally {
      this.savingAvail.set(false);
    }
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
