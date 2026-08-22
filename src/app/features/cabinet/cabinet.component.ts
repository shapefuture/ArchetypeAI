import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoragePort, AssessmentData, SynastrySavedReportData } from '../../core/ports/storage.port';
import { STORAGE_PORT } from '../../core/ports/storage.port';
import { User } from '../../core/ports/auth.port';
import { AdminAccessService, AdminAllowlistEntry } from '../../../services/admin-access.service';
import { TranslationService } from '../../../services/translation.service';
import { SpecialistClientService, ClientLink } from '../../../services/specialist-client.service';
import { UserDirectoryService } from '../../../services/user-directory.service';
import { ASSESSMENT_QUESTIONS, AssessmentQuestion } from '../../core/data/assessment-questions';
import { BookingPanelComponent } from '../booking-panel/booking-panel.component';
import {
  myAppointments,
  setAppointmentStatus,
  type Appointment,
  type AppointmentStatus,
} from '../booking-panel/booking';

/** Scoring-method chip copy — RU-first, EN inline (translations.ts is off-limits). */
const SCORING_COPY: Record<string, { ru: string; en: string }> = {
  deterministic: { ru: 'точный расчёт', en: 'deterministic' },
  fallback: { ru: 'ИИ-режим', en: 'AI mode' },
};

/** «Мои записи» copy — RU-first, EN inline (translations.ts is off-limits). */
const BOOKING_COPY = {
  ru: {
    title: 'Мои записи',
    body: 'Сессии со специалистом: заявки, подтверждения и отмена.',
    empty: 'Записей пока нет.',
    book: 'Записаться к специалисту',
    cancel: 'Отменить',
    statusPending: 'ожидает',
    statusApproved: 'подтверждена',
    statusDeclined: 'отклонена',
    statusCancelled: 'отменена',
  },
  en: {
    title: 'My appointments',
    body: 'Sessions with a therapist: requests, confirmations, and cancellations.',
    empty: 'No appointments yet.',
    book: 'Book a session',
    cancel: 'Cancel',
    statusPending: 'pending',
    statusApproved: 'approved',
    statusDeclined: 'declined',
    statusCancelled: 'cancelled',
  },
};

@Component({
  selector: 'app-cabinet',
  standalone: true,
  imports: [CommonModule, BookingPanelComponent],
  templateUrl: './cabinet.component.html',
  styleUrls: ['./cabinet.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CabinetComponent {
  private readonly storage = inject<StoragePort>(STORAGE_PORT);
  private readonly adminAccess = inject(AdminAccessService);
  private readonly specialistClients = inject(SpecialistClientService);
  private readonly directory = inject(UserDirectoryService);
  private readonly ts = inject(TranslationService);

  readonly user = input<User | null>(null);

  readonly openUniverse = output<void>();
  readonly retakeTest = output<void>();
  readonly openLogin = output<void>();
  readonly goBack = output<void>();

  /**
   * Emitted when the specialist wants to see the client's universe / matrix
   * visualisation. The parent loads the client's assessment and routes to
   * the universe view with the client's personal constellation.
   */
  readonly viewClientMatrix = output<{ clientUid: string; clientEmail: string | null }>();

  /**
   * Emitted when the specialist wants to focus on the AI-generated
   * narrative report for a client. Routes the parent to the read-only
   * specialist-client-view (results panel rendered with
   * `isSpecialistView: true`).
   */
  readonly viewClientAiReport = output<{ clientUid: string; clientEmail: string | null }>();

  readonly loading = signal(false);
  readonly history = signal<AssessmentData[]>([]);
  readonly synastryReports = signal<SynastrySavedReportData[]>([]);
  readonly loadError = signal<string | null>(null);

  // History dropdown: which saved version the user has picked. The default
  // is the most recent (loadHistory returns newest-first). The component
  // re-seeds this whenever the underlying list changes (e.g. a new
  // assessment was saved) and the previous selection is no longer valid.
  readonly selectedHistoryId = signal<string | null>(null);
  readonly selectedHistoryEntry = computed<AssessmentData | null>(() => {
    const id = this.selectedHistoryId();
    if (!id) return null;
    return this.history().find(h => h.updatedAt === id) || null;
  });

  // Admin sharing (bootstrap admin can add others by email)
  readonly isAdmin = signal(false);
  readonly adminEmailInput = signal('');
  readonly adminList = signal<AdminAllowlistEntry[]>([]);
  readonly adminBusy = signal(false);
  readonly adminError = signal<string | null>(null);

  // Admin → "My clients" specialist dashboard
  readonly myClients = signal<ClientLink[]>([]);
  readonly clientResults = signal<Map<string, AssessmentData | null>>(new Map());
  // Per-client FULL assessment history. Keyed by clientUid; value is the
  // list of all historical versions (newest first, capped at 20 by
  // SpecialistClientService.getClientHistory). Used by the per-version
  // download list rendered under each client row in the "All
  // assessments" section. A client that has never done an assessment
  // has an empty array (NOT missing from the map) so the template can
  // safely render an empty-state message.
  readonly clientHistory = signal<Map<string, AssessmentData[]>>(new Map());
  readonly clientUidInput = signal('');
  readonly clientEmailInput = signal('');
  readonly clientsBusy = signal(false);
  readonly clientsError = signal<string | null>(null);
  // UID<->email auto-fill: tracks which field the current lookup is for,
  // and surfaces a transient error (e.g. "No user found" / "Lookup failed")
  // under the form. The values mirror the debounce + async lookup, so the
  // UI shows "Looking up…" while the request is in flight and the error
  // string after a confirmed miss.
  readonly clientLookupInProgress = signal<'uid' | 'email' | null>(null);
  readonly clientLookupError = signal<string | null>(null);
  // Re-entrancy guard for auto-fill. When the user types in the UID field
  // and we find an email, we set the email field's signal. The email
  // field's input handler MIGHT fire (depending on the framework's
  // binding behaviour) — this guard tells the handler to skip its own
  // lookup on the next call so we don't ping-pong UID <-> email.
  // Default Angular signal binding does NOT fire `(input)` on programmatic
  // value changes, so the guard is defensive rather than load-bearing,
  // but it's cheap insurance.
  private suppressNextLookupFor: 'uid' | 'email' | null = null;
  // Pending debounce timer for the UID<->email lookup. Cancelled on every
  // new keystroke so we only run one lookup per pause in typing.
  private lookupDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  // How long to wait after the last keystroke before firing the lookup.
  // Tuned to feel "live" without hammering Firestore on every character.
  private static readonly LOOKUP_DEBOUNCE_MS = 350;
  // Per-client unsaved notes drafts. Keyed by clientUid. Saved on
  // "Save notes" click via SpecialistClientService.updateNotes.
  readonly notesDraft = signal<Map<string, string>>(new Map());
  readonly savingNotesFor = signal<string | null>(null);
  // Tracks which client row is currently generating a TXT report. The
  // "Download report" button shows a loading label while this is set.
  readonly downloadingReportFor = signal<string | null>(null);

  readonly isLoggedIn = computed(() => {
    const u = this.user();
    return !!u && !u.isAnonymous;
  });

  // ---------- «Мои записи» (session bookings) ----------
  readonly appointments = signal<Appointment[]>([]);
  readonly appointmentsLoading = signal(false);
  readonly bookingOpen = signal(false);
  readonly cancellingAppt = signal('');
  readonly copy = computed(() => BOOKING_COPY[this.ts.getLanguage() === 'en' ? 'en' : 'ru'] as typeof BOOKING_COPY.ru);

  async loadAppointments(uid: string): Promise<void> {
    this.appointmentsLoading.set(true);
    try {
      this.appointments.set(await myAppointments(uid));
    } catch {
      this.appointments.set([]);
    } finally {
      this.appointmentsLoading.set(false);
    }
  }

  apptStatusLabel(s: AppointmentStatus): string {
    const c = this.copy();
    if (s === 'pending') return c.statusPending;
    if (s === 'approved') return c.statusApproved;
    if (s === 'declined') return c.statusDeclined;
    return c.statusCancelled;
  }

  async cancelAppointment(a: Appointment): Promise<void> {
    const u = this.user();
    if (!u) return;
    this.cancellingAppt.set(a.id);
    try {
      await setAppointmentStatus(a.id, 'cancelled');
      await this.loadAppointments(u.uid);
    } finally {
      this.cancellingAppt.set('');
    }
  }

  onBooked(): void {
    const u = this.user();
    this.bookingOpen.set(false);
    if (u && !u.isAnonymous) this.loadAppointments(u.uid);
  }

  constructor() {
    // Keep the dropdown's selection in sync with the underlying list:
    //  - If the list is empty, clear the selection.
    //  - If the previous selection is gone (e.g. the user deleted it
    //    elsewhere), fall back to the first item (most recent — loadHistory
    //    returns newest-first).
    //  - Otherwise keep the user's pick so the preview doesn't snap back
    //    to "most recent" on every reactive re-run.
    effect(() => {
      if (this.history().length === 0) {
        this.selectedHistoryId.set(null);
        return;
      }
      const current = this.selectedHistoryId();
      if (!current || !this.history().find(h => h.updatedAt === current)) {
        this.selectedHistoryId.set(this.history()[0].updatedAt);
      }
    });

    effect(() => {
      const u = this.user();
      if (!u || u.isAnonymous) {
        this.history.set([]);
        this.synastryReports.set([]);
        this.loadError.set(null);
        this.isAdmin.set(false);
        this.adminList.set([]);
        this.myClients.set([]);
        this.clientResults.set(new Map());
        this.clientHistory.set(new Map());
        this.notesDraft.set(new Map());
        this.appointments.set([]);
        this.bookingOpen.set(false);
        return;
      }

      this.refreshAll(u.uid, u.email);
      this.loadAppointments(u.uid);
    });
  }

  private async refreshAll(uid: string, email: string | null): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      const [history, syn] = await Promise.all([
        this.storage.loadHistory(uid),
        this.storage.listSynastryReports(uid),
      ]);
      this.history.set(history || []);
      this.synastryReports.set(syn || []);

      const admin = await this.adminAccess.isAdmin(email);
      this.isAdmin.set(admin);
      if (admin) {
        const list = await this.adminAccess.listAdmins();
        this.adminList.set(list);
        // Load the specialist's client list in parallel. We don't await —
        // the admin allowlist is the main data, and the clients list is
        // secondary. Any failure is shown in the clientsError signal.
        this.loadMyClients(uid);
      } else {
        this.adminList.set([]);
        this.myClients.set([]);
        this.clientResults.set(new Map());
        this.clientHistory.set(new Map());
        this.notesDraft.set(new Map());
      }
    } catch (e: any) {
      this.loadError.set(e?.message || 'Failed to load cabinet data');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Load the admin's "My clients" list and, in parallel, each client's
   * latest assessment (for the "Last assessment:" row). Errors don't block
   * the rest of the dashboard — they surface in `clientsError`.
   */
  private async loadMyClients(adminUid: string): Promise<void> {
    this.clientsBusy.set(true);
    this.clientsError.set(null);
    try {
      const list = await this.specialistClients.listMyClients(adminUid);
      this.myClients.set(list);

      // Eagerly fetch each client's latest assessment AND full history
      // (in parallel) for the row display + per-version download list.
      // If any single read fails, the row simply shows "No assessment yet"
      // and the history list stays empty (caller renders an empty state).
      const results = new Map<string, AssessmentData | null>();
      const histories = new Map<string, AssessmentData[]>();
      await Promise.all(
        list.map(async (c) => {
          // Two reads in parallel per client — the read paths are
          // independent (history subcollection vs. the `current` doc)
          // and Firestore pipelines them cheaply. We catch each
          // individually so a failure on one client doesn't blackhole
          // the whole list.
          const [latest, history] = await Promise.all([
            this.specialistClients.getClientLatestResults(c.clientUid).catch(() => null),
            this.specialistClients.getClientHistory(c.clientUid).catch(() => [] as AssessmentData[]),
          ]);
          results.set(c.clientUid, latest);
          histories.set(c.clientUid, history);
        }),
      );
      this.clientResults.set(results);
      this.clientHistory.set(histories);
    } catch (e: any) {
      this.clientsError.set(e?.message || this.t('loadClientsFailed', 'Failed to load clients'));
    } finally {
      this.clientsBusy.set(false);
    }
  }

  formatTs(ts?: string): string {
    if (!ts) return '';
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return ts;
    }
  }

  /** Human label for the scoringMethod chip ('deterministic' | 'fallback'). */
  scoringLabel(method?: string): string {
    const lang = this.ts.getLanguage() === 'en' ? 'en' : 'ru';
    const entry = method ? SCORING_COPY[method] : undefined;
    return entry ? entry[lang] : (method ?? '');
  }

  /**
   * Translation shortcut. Routes to the `cabinet` section of translations.ts.
   * The optional `fallback` is the English source text — it shows in the UI
   * if the key is missing, AND in the en locale by design (since the en
   * translations are the source of truth).
   */
  t(key: string, fallback?: string): string {
    return this.ts.t(key, 'cabinet', fallback);
  }

  /**
   * Update the dropdown's selection when the user picks a different saved
   * version. The template passes the <option>'s `value` (an updatedAt
   * timestamp), which uniquely identifies a history entry.
   */
  onSelectVersion(id: string): void {
    if (id) {
      this.selectedHistoryId.set(id);
    }
  }

  downloadSelectedHistoryBackup(): void {
    const entry = this.selectedHistoryEntry();
    if (!entry) return;
    this.downloadAssessmentBackup(entry);
  }

  private downloadAssessmentBackup(entry: AssessmentData): void {
    const payload = {
      app: 'ArchetypeAI',
      version: 1,
      exportedAt: new Date().toISOString(),
      entry,
    };
    const fileName = `archetype-backup-${((entry as any).createdAt || entry.updatedAt || new Date().toISOString()).replace(/[:.]/g, '-')}.json`;
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.rel = 'noopener';
    a.click();
    URL.revokeObjectURL(url);
  }

  async addAdminEmail(): Promise<void> {
    const u = this.user();
    if (!u) return;

    this.adminBusy.set(true);
    this.adminError.set(null);
    try {
      await this.adminAccess.addAdmin(this.adminEmailInput(), u.uid);
      this.adminEmailInput.set('');
      const list = await this.adminAccess.listAdmins();
      this.adminList.set(list);
    } catch (e: any) {
      this.adminError.set(e?.message || this.t('addAdminFailed', 'Failed to add admin'));
    } finally {
      this.adminBusy.set(false);
    }
  }

  async removeAdminEmail(email: string): Promise<void> {
    this.adminBusy.set(true);
    this.adminError.set(null);
    try {
      await this.adminAccess.removeAdmin(email);
      const list = await this.adminAccess.listAdmins();
      this.adminList.set(list);
    } catch (e: any) {
      this.adminError.set(e?.message || this.t('removeAdminFailed', 'Failed to remove admin'));
    } finally {
      this.adminBusy.set(false);
    }
  }

  /**
   * Add a client to the admin's list using the form input. Validates the
   * UID client-side, then writes via the service. Refreshes the list and
   * the per-client results map on success.
   */
  async addClientByUid(): Promise<void> {
    const u = this.user();
    if (!u) return;
    const uid = this.clientUidInput().trim();
    const email = this.clientEmailInput().trim() || null;
    if (!uid) return;

    this.clientsBusy.set(true);
    this.clientsError.set(null);
    try {
      const resolvedEmail = email || (await this.directory.lookupByUid(uid))?.email || null;
      if (resolvedEmail && !this.clientEmailInput().trim()) {
        this.clientEmailInput.set(resolvedEmail);
      }
      await this.specialistClients.addClientByUid(u.uid, uid, resolvedEmail, u.uid);
      this.clientUidInput.set('');
      this.clientEmailInput.set('');
      await this.loadMyClients(u.uid);
    } catch (e: any) {
      this.clientsError.set(e?.message || this.t('addClientFailed', 'Failed to add client'));
    } finally {
      this.clientsBusy.set(false);
    }
  }

  /**
   * UID-field change handler. Mirrors the old `(input)="clientUidInput.set(...)"`
   * template wiring but also kicks off a debounced auto-fill lookup. The
   * re-entrancy guard (suppressNextLookupFor) suppresses the next call
   * after a programmatic write from the email → UID auto-fill path.
   */
  onClientUidChange(value: string): void {
    this.clientUidInput.set(value);
    if (this.suppressNextLookupFor === 'uid') {
      this.suppressNextLookupFor = null;
      return;
    }
    this.scheduleLookup('uid');
  }

  /**
   * Email-field change handler. Symmetric to onClientUidChange: updates
   * the signal, respects the re-entrancy guard, and schedules a debounced
   * auto-fill lookup.
   */
  onClientEmailChange(value: string): void {
    this.clientEmailInput.set(value);
    if (this.suppressNextLookupFor === 'email') {
      this.suppressNextLookupFor = null;
      return;
    }
    this.scheduleLookup('email');
  }

  /**
   * Reset the debounce timer and queue a new lookup. Each new keystroke
   * cancels the in-flight timer, so the lookup only fires after the
   * admin pauses typing for LOOKUP_DEBOUNCE_MS.
   */
  private scheduleLookup(direction: 'uid' | 'email'): void {
    if (this.lookupDebounceTimer !== null) {
      clearTimeout(this.lookupDebounceTimer);
    }
    this.clientLookupError.set(null);
    this.lookupDebounceTimer = setTimeout(
      () => this.runLookup(direction),
      CabinetComponent.LOOKUP_DEBOUNCE_MS,
    );
  }

  /**
   * Run the auto-fill lookup for the field the admin last edited. If a
   * profile is found AND the OTHER field is empty, auto-fill it (with
   * the re-entrancy guard set so the write doesn't trigger a reciprocal
   * lookup). Surfaces a "not found" / "error" string when the lookup
   * completes without a match.
   *
   * Race-tolerance: the result is only auto-applied if the user hasn't
   * typed anything into the target field in the meantime (the field is
   * still empty). If they did type, we leave their input alone.
   */
  private async runLookup(direction: 'uid' | 'email'): Promise<void> {
    this.clientLookupInProgress.set(direction);
    try {
      if (direction === 'uid') {
        const uid = this.clientUidInput().trim();
        if (!uid) {
          this.clientLookupInProgress.set(null);
          return;
        }
        const profile = await this.directory.lookupByUid(uid);
        if (profile && profile.email && !this.clientEmailInput().trim()) {
          this.suppressNextLookupFor = 'email';
          this.clientEmailInput.set(profile.email);
        } else if (!profile) {
          this.clientLookupError.set(this.t('clientLookupNotFound', 'No user found'));
        }
        // profile exists but no email (e.g. user signed up anonymously) — silent, nothing to fill
      } else {
        const email = this.clientEmailInput().trim();
        if (!email) {
          this.clientLookupInProgress.set(null);
          return;
        }
        const profile = await this.directory.lookupByEmail(email);
        if (profile && profile.uid && !this.clientUidInput().trim()) {
          this.suppressNextLookupFor = 'uid';
          this.clientUidInput.set(profile.uid);
        } else if (!profile) {
          this.clientLookupError.set(this.t('clientLookupNotFound', 'No user found'));
        }
        // profile exists but no uid — shouldn't happen (uid IS the docId), silent
      }
    } catch {
      // Network / Firestore error — log + surface a translated message.
      // We deliberately don't rethrow: a failed lookup must NOT block the
      // admin from typing or pressing "Add client".
      console.warn('[Cabinet] UID<->email lookup failed');
      this.clientLookupError.set(this.t('clientLookupError', 'Lookup failed'));
    } finally {
      this.clientLookupInProgress.set(null);
    }
  }

  async removeClientFromList(clientUid: string): Promise<void> {
    const u = this.user();
    if (!u) return;
    this.clientsBusy.set(true);
    this.clientsError.set(null);
    try {
      await this.specialistClients.removeClient(u.uid, clientUid);
      // Drop the unsaved notes draft for this client — its link is gone.
      const next = new Map(this.notesDraft());
      next.delete(clientUid);
      this.notesDraft.set(next);
      await this.loadMyClients(u.uid);
    } catch (e: any) {
      this.clientsError.set(e?.message || this.t('removeClientFailed', 'Failed to remove client'));
    } finally {
      this.clientsBusy.set(false);
    }
  }

  /**
   * Update the local unsaved-notes draft for a client. The draft is what
   * the textarea is bound to; it's persisted to Firestore only on
   * `saveNotes()`.
   */
  onNotesDraftChange(clientUid: string, value: string): void {
    const next = new Map(this.notesDraft());
    next.set(clientUid, value);
    this.notesDraft.set(next);
  }

  /**
   * The current value of the notes textarea for a given client — falls
   * back to the saved notes (from the client link) when no draft exists.
   */
  notesDraftValue(client: ClientLink): string {
    const draft = this.notesDraft().get(client.clientUid);
    if (draft !== undefined) return draft;
    return client.notes || '';
  }

  /**
   * Has the user typed anything that hasn't been saved yet?
   */
  notesAreDirty(client: ClientLink): boolean {
    const draft = this.notesDraft().get(client.clientUid);
    if (draft === undefined) return false;
    return draft !== (client.notes || '');
  }

  async saveNotes(client: ClientLink): Promise<void> {
    const u = this.user();
    if (!u) return;
    const draft = this.notesDraft().get(client.clientUid);
    if (draft === undefined) return;

    this.savingNotesFor.set(client.clientUid);
    this.clientsError.set(null);
    try {
      await this.specialistClients.updateNotes(u.uid, client.clientUid, draft);
      // Update the underlying link so the "dirty" state is cleared.
      this.myClients.set(
        this.myClients().map(c => c.clientUid === client.clientUid
          ? { ...c, notes: draft }
          : c),
      );
      const next = new Map(this.notesDraft());
      next.delete(client.clientUid);
      this.notesDraft.set(next);
    } catch (e: any) {
      this.clientsError.set(e?.message || this.t('saveNotesFailed', 'Failed to save notes'));
    } finally {
      this.savingNotesFor.set(null);
    }
  }

  onViewClientMatrix(client: ClientLink): void {
    this.viewClientMatrix.emit({
      clientUid: client.clientUid,
      clientEmail: client.clientEmail,
    });
  }

  onViewClientAiReport(client: ClientLink): void {
    this.viewClientAiReport.emit({
      clientUid: client.clientUid,
      clientEmail: client.clientEmail,
    });
  }

  /**
   * Build and trigger a local TXT download containing all 64 of the
   * client's assessment answers, the 4 dimensional expressions, and
   * assessment metadata. The download is a pure side-effect — it does
   * NOT navigate, switch app state, or call any external service. The
   * data is taken from the already-loaded `clientResults` map (the row
   * is disabled until the assessment is loaded, so this is always safe).
   *
   * The button shows a loading label while the report is being built;
   * for 64 questions the work is microseconds, but we set the signal
   * for UX consistency with the "Save notes" button.
   */
  async onDownloadClientReport(client: ClientLink): Promise<void> {
    const data = this.clientResults().get(client.clientUid);
    if (!data) return; // row is disabled in this case; guard anyway

    this.downloadingReportFor.set(client.clientUid);
    try {
      const text = this.formatClientReportText(data, client);
      const filename = this.reportFilename(client);
      this.triggerTextDownload(text, filename);
    } finally {
      this.downloadingReportFor.set(null);
    }
  }

  /**
   * Per-version download. Identical body-builder to onDownloadClientReport,
   * but parameterized on a SPECIFIC historical version rather than "the
   * latest". Lets the admin download e.g. "the assessment from March 15"
   * as a standalone .txt. Reuses formatClientReportText + triggerTextDownload
   * so the report body is byte-for-byte consistent with the row-level
   * "Download report" button (just with that version's snapshot).
   *
   * No loading state needed: the report body is built in microseconds and
   * the download is a pure browser side-effect. The button is disabled
   * via `[disabled]="!h"` in the template as a defensive guard.
   */
  async onDownloadClientVersion(client: ClientLink, assessment: AssessmentData): Promise<void> {
    if (!assessment) return;
    const text = this.formatClientReportText(assessment, client);
    const filename = this.reportFilenameForVersion(client, assessment);
    this.triggerTextDownload(text, filename);
  }

  /**
   * Stable, human-readable filename for a SPECIFIC historical version.
   * Encodes that version's timestamp in the filename so the admin can
   * tell files apart at a glance. Mirrors reportFilename() but
   * parameterized on the assessment (vs. "the latest" from the map).
   */
  reportFilenameForVersion(client: ClientLink, assessment: AssessmentData): string {
    const handle = (client.clientEmail || client.clientUid).replace(/[^A-Za-z0-9._-]+/g, '_');
    return `archetypeai_report_${handle}_${this.versionStamp(assessment)}.txt`;
  }

  /**
   * Render the assessment's timestamp as a YYYY-MM-DD stamp for
   * filenames. Falls back to today if the timestamp is missing or
   * unparseable (corrupted data).
   */
  private versionStamp(assessment: AssessmentData): string {
    const ts = (assessment as any).createdAt || assessment.updatedAt;
    if (!ts) return new Date().toISOString().slice(0, 10);
    const d = new Date(ts);
    if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
    return d.toISOString().slice(0, 10);
  }

  /**
   * Compose the full TXT body for a client's assessment. The body is
   * plain text, locale-aware (uses `t()` for every label and the
   * localized question text), and self-contained — no external
   * references, no JSON wrapper. Sections are separated by ASCII rules
   * so the file is readable in any text viewer.
   */
  formatClientReportText(data: AssessmentData, client: ClientLink): string {
    const dim = data.dimensionalExpressions || { AGENCY: 0, TEMPERATURE: 0, FOCUS: 0, ATTACHMENT: 0 };
    const responses = data.responses || [];
    const scoring = data.scoringMethod === 'fallback'
      ? this.t('report.scoringFallback', 'fallback (no AI narrative available)')
      : this.t('report.scoringDeterministic', 'deterministic');

    const lines: string[] = [];
    lines.push(this.t('report.title', 'ArchetypeAI Assessment Report'));
    lines.push('==============================');
    lines.push('');
    lines.push(`${this.t('report.clientLabel', 'Client')}: ${client.clientEmail || this.t('report.clientNoEmail', '(no email on file)')}`);
    lines.push(`${this.t('report.clientUidLabel', 'Client UID')}: ${client.clientUid}`);
    lines.push(`${this.t('report.completedLabel', 'Completed')}: ${data.updatedAt || ''}`);
    lines.push(`${this.t('report.scoringMethodLabel', 'Scoring method')}: ${scoring}`);
    lines.push('');

    lines.push(this.t('report.sectionDimensional', 'Dimensional Expressions'));
    lines.push('-----------------------');
    lines.push(this.formatDimLine('report.dimAgency', 'Agency', dim.AGENCY));
    lines.push(this.formatDimLine('report.dimTemperature', 'Temperature', dim.TEMPERATURE));
    lines.push(this.formatDimLine('report.dimFocus', 'Focus', dim.FOCUS));
    lines.push(this.formatDimLine('report.dimAttachment', 'Attachment', dim.ATTACHMENT));
    lines.push('');

    lines.push(this.t('report.sectionAnswers', 'All 64 Answers'));
    lines.push('---------------');

    // Group by section (12 questions per dimension × 4 dimensions = 64).
    const sectionKeys: Array<{ key: string; bannerKey: string }> = [
      { key: 'assessment.questions.agency', bannerKey: 'report.agencySection' },
      { key: 'assessment.questions.temperature', bannerKey: 'report.temperatureSection' },
      { key: 'assessment.questions.focus', bannerKey: 'report.focusSection' },
      { key: 'assessment.questions.attachment', bannerKey: 'report.attachmentSection' },
    ];
    let qIndex = 0;
    for (const sec of sectionKeys) {
      lines.push('');
      // The section title is the `title` key inside the section.
      lines.push(`[${this.t('title', sec.key)}]`);
      for (let i = 0; i < 12; i++) {
        const q = ASSESSMENT_QUESTIONS[qIndex];
        if (!q) {
          // Defensive: assessment-questions.ts should always have 64 entries.
          break;
        }
        const prompt = this.t(q.text, q.section);
        const value = responses[qIndex] ?? 0;
        const likert = this.likertLabel(value);
        const padded = `${qIndex + 1}.`.padEnd(4, ' ');
        lines.push(`  ${padded}${prompt}  ->  ${value} (${likert})`);
        qIndex++;
      }
      // silence the unused-bannnerKey warning when intentionally kept
      // for the next maintainer's reference (mirrors a `report.*` key).
      void sec.bannerKey;
    }

    lines.push('');
    lines.push('------------------------------');
    lines.push(`${this.t('report.footer', 'Generated by ArchetypeAI')}: ${new Date().toISOString()}`);
    return lines.join('\n');
  }

  /**
   * Format a single dimensional-expression line. Mirrors the visual style
   * used in the results panel so an admin reading the TXT sees numbers
   * consistent with what they saw on screen.
   */
  private formatDimLine(nameKey: string, fallback: string, value: number): string {
    const name = this.t(nameKey, fallback);
    const pct = `${Math.abs(value) * 100 | 0}%`;
    const arrow = value >= 0 ? '→' : '←';
    return `- ${name.padEnd(14, ' ')}${pct} ${arrow}`;
  }

  /**
   * Map a numeric response to a localized Likert label. Value 0 means
   * "not answered" (the storage default). Values 1–5 follow the standard
   * strongly-disagree → strongly-agree scale used by the assessment UI.
   */
  likertLabel(value: number): string {
    if (value <= 0) return this.t('report.likertUnanswered', '(not answered)');
    if (value === 1) return this.t('report.likert1', 'Strongly Disagree');
    if (value === 2) return this.t('report.likert2', 'Disagree');
    if (value === 3) return this.t('report.likert3', 'Neutral');
    if (value === 4) return this.t('report.likert4', 'Agree');
    if (value === 5) return this.t('report.likert5', 'Strongly Agree');
    // Defensive: out-of-range values (corrupted data) get the "unanswered"
    // label rather than throwing or returning a raw key.
    return this.t('report.likertUnanswered', '(not answered)');
  }

  /**
   * Build a stable, human-readable filename for the download. Falls back
   * to the UID if the email is missing. The date uses the assessment's
   * `updatedAt` when present, else the current date — the admin gets a
   * "snapshot at the time the data was loaded" filename.
   */
  reportFilename(client: ClientLink): string {
    const stamp = this.safeStamp(client);
    const handle = (client.clientEmail || client.clientUid).replace(/[^A-Za-z0-9._-]+/g, '_');
    return `archetypeai_report_${handle}_${stamp}.txt`;
  }

  private safeStamp(client: ClientLink): string {
    // Try the assessment's updatedAt first; fall back to today.
    const updated = this.clientResults().get(client.clientUid)?.updatedAt;
    const d = updated ? new Date(updated) : new Date();
    if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
    return d.toISOString().slice(0, 10);
  }

  /**
   * Trigger a browser file download. Uses a Blob + invisible anchor —
   * the same pattern used elsewhere in the app (e.g. results-panel).
   * SSR-safe: `window` is only touched in the browser.
   */
  triggerTextDownload(text: string, filename: string): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Copy a string to the clipboard with a textarea fallback for older browsers.
   * Mirrors the helper previously used by the Account floating button.
   */
  async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      try {
        const el = document.createElement('textarea');
        el.value = text;
        el.style.position = 'fixed';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      } catch { /* ignore */ }
    }
  }
}
