/**
 * INNERVERSE — Therapist Mode dashboard (REVAMP §3B.4).
 * License self-attestation → claim client invite codes → consent-scoped
 * client summaries → exercise assignments (incl. RED, container-gated).
 */
import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { STRINGS } from '../../../i18n/strings';
import { take } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../services/translation.service';
import { AUTH_PORT } from '../../core/ports/auth.port';
import {
  claimTherapistLink, linkedClients, assignExercise, setClientArchived, CONSENT_TEXT,
  type TherapistClientSummary, type AssignmentFrequency, type LinkedClient,
} from '../../core/data/therapist-link';
import { EXERCISES, EXERCISE_TYPES } from '../../core/data/exercises';
import { PART_NAME_RU, COMPLEX_COPY_RU } from '../../core/data/constellation-copy';
import { COMPLEXES } from '../../core/data/parts';
import { resistantMetrics, loadEvents } from '../../core/data/state-v2';
import {
  ensureTherapistBusySlots, getTherapistAvailability, saveTherapistAvailability, therapistAppointments,
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

const UI = STRINGS.therapist;


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
  /** STRINGS catalog exposed for template-level copy (single EN/RU source). */
  protected readonly STRINGS = STRINGS;

  readonly attested = signal(localStorage.getItem(ATTEST_KEY) === 'yes');
  readonly entered = signal(false);
  readonly license = signal(localStorage.getItem(ATTEST_KEY + ':license') ?? '1111');
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
    await ensureTherapistBusySlots(this.uid, list);
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

  /** Gate key ('green'|'yellow'|'red') as a locale label. */
  gateLabel(gate: string): string {
    if (this.lang() !== 'ru') return gate;
    return STRINGS.therapist.clinical.gateWords[this.lang()][gate] ?? gate;
  }

  /** Assignment frequency key as a locale label (values stay as API keys). */
  freqLabel(freq: string): string {
    if (this.lang() !== 'ru') {
      return { 'once': 'Once', 'daily': 'Daily', 'weekly': 'Weekly', 'after-trigger': 'After trigger' }[freq] ?? freq;
    }
    return STRINGS.therapist.clinical.freqWords[this.lang()][freq] ?? freq;
  }

  /** Part id ('taskmaster', 'rebel'…) as a locale display name. */
  partName(id?: string): string {
    if (!id) return '';
    if (this.lang() === 'ru') return PART_NAME_RU[id] ?? id;
    return id;
  }

  /** Complex id ('abandonment'…) as a locale display name. */
  complexName(id: string): string {
    if (this.lang() === 'ru') return COMPLEX_COPY_RU[id]?.name ?? id;
    return COMPLEXES[id as keyof typeof COMPLEXES]?.name ?? id;
  }

  close(): void { this.closed.emit(); }
}
