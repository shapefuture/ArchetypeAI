/**
 * INNERVERSE — Booking panel (client side, Calendly-like).
 *
 * Steps: therapist email → date (next 14 available days) → generated free
 * slot → confirm. Confirming writes the appointment AND the share docs (see
 * booking.ts) so the therapist's dashboard picks the client up immediately.
 *
 * Copy is RU-first with EN inline (translations.ts is off-limits — the same
 * bilingual UI-object pattern as descent-panel / therapist-panel).
 */
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { STRINGS } from '../../../shared/i18n/strings';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../services/translation.service';
import { UserDirectoryService } from '../../../services/user-directory.service';
import type { User } from '../../core/ports/auth.port';
import {
  bookableDays,
  createBooking,
  freeSlots,
  getTherapistAvailability,
  slotEnd,
  therapistBusyIntervals,
  type BusyInterval,
  type AvailabilityWindow,
} from './booking';

const UI = STRINGS.booking;


@Component({
  selector: 'app-booking-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './booking-panel.component.html',
  styleUrls: ['./booking-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingPanelComponent {
  private readonly ts = inject(TranslationService);
  private readonly directory = inject(UserDirectoryService);

  /** Overlay visibility — the parent (cabinet) toggles this. */
  readonly open = input(false);
  readonly user = input<User | null>(null);
  /** Optional pre-resolved therapist UID (skips the email step). */
  readonly therapistUid = input('');

  readonly closed = output<void>();
  readonly booked = output<void>();

  readonly lang = computed(() => this.ts.getLanguage());
  readonly ui = computed(() => UI[this.lang()] as typeof UI.ru);

  readonly step = signal<'therapist' | 'date' | 'slot' | 'confirm'>('therapist');
  readonly therapistEmail = signal('');
  readonly resolvedTherapist = signal<{ uid: string; email: string | null } | null>(null);
  readonly availability = signal<AvailabilityWindow[]>([]);
  readonly bookedAppts = signal<BusyInterval[]>([]);
  readonly days = signal<string[]>([]);
  readonly dateISO = signal('');
  readonly slots = signal<string[]>([]);
  readonly slot = signal('');
  readonly shareConsent = signal(false);
  readonly finding = signal(false);
  readonly loadingSlots = signal(false);
  readonly submitting = signal(false);
  readonly error = signal('');
  readonly success = signal(false);

  readonly slotLength = computed(() => {
    const av = this.availability();
    return av.length ? av[0].minutes : 60;
  });

  constructor() {
    effect(() => {
      if (this.open()) {
        this.reset();
        const preset = this.therapistUid();
        if (preset) {
          this.resolveTherapist(preset, null);
        }
      }
    });
  }

  reset(): void {
    this.step.set('therapist');
    this.therapistEmail.set('');
    this.resolvedTherapist.set(null);
    this.availability.set([]);
    this.bookedAppts.set([]);
    this.days.set([]);
    this.dateISO.set('');
    this.slots.set([]);
    this.slot.set('');
    this.shareConsent.set(false);
    this.error.set('');
    this.success.set(false);
    this.submitting.set(false);
    this.finding.set(false);
    this.loadingSlots.set(false);
  }

  close(): void {
    this.closed.emit();
  }

  async find(): Promise<void> {
    const email = this.therapistEmail().trim();
    if (!email) return;
    this.finding.set(true);
    this.error.set('');
    try {
      const profile = await this.directory.lookupByEmail(email);
      if (!profile?.uid) {
        this.error.set(this.ui().notFound);
      } else {
        await this.resolveTherapist(profile.uid, profile.email ?? email);
      }
    } catch {
      this.error.set(this.ui().notFound);
    } finally {
      this.finding.set(false);
    }
  }

  private async resolveTherapist(uid: string, email: string | null): Promise<void> {
    this.resolvedTherapist.set({ uid, email });
    try {
      const [availability, busySlots] = await Promise.all([
        getTherapistAvailability(uid),
        therapistBusyIntervals(uid),
      ]);
      this.availability.set(availability);
      this.bookedAppts.set(busySlots);
      this.days.set(bookableDays(availability));
      this.step.set('date');
    } catch {
      this.error.set(this.ui().notFound);
    }
  }

  async pickDate(dateISO: string): Promise<void> {
    this.dateISO.set(dateISO);
    this.loadingSlots.set(true);
    this.slots.set([]);
    this.slot.set('');
    try {
      this.slots.set(freeSlots(this.availability(), this.bookedAppts(), dateISO));
    } finally {
      this.loadingSlots.set(false);
    }
    this.step.set('slot');
  }

  pickSlot(slot: string): void {
    this.slot.set(slot);
    this.step.set('confirm');
  }

  back(): void {
    if (this.step() === 'confirm') this.step.set('slot');
    else if (this.step() === 'slot') this.step.set('date');
    else if (this.step() === 'date') this.step.set('therapist');
  }

  formatDate(dateISO: string): string {
    const d = new Date(`${dateISO}T00:00:00`);
    return isNaN(d.getTime()) ? dateISO : d.toLocaleDateString();
  }

  formatSlot(slot: string): string {
    return slot.slice(11, 16);
  }

  async confirm(): Promise<void> {
    const user = this.user();
    const therapist = this.resolvedTherapist();
    if (!user || user.isAnonymous || !therapist || !this.slot() || !this.shareConsent()) return;
    this.submitting.set(true);
    this.error.set('');
    try {
      await createBooking({
        clientUid: user.uid,
        clientEmail: user.email,
        therapistUid: therapist.uid,
        therapistEmail: therapist.email,
        start: this.slot(),
        end: slotEnd(this.slot(), this.slotLength()),
      });
      this.success.set(true);
      this.booked.emit();
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.submitting.set(false);
    }
  }
}
