// Return loop and opt-in reminder lifecycle (ArchetypeAI-28h.3.5). Pure.
// Reminders exist only after an explicit opt-in. A device reminder needs a confirmed device channel, never an
// assumed one. Quiet hours and skips are respected and never punished.

export type Channel = 'in-app' | 'device';
export interface Reminder {
  optIn: boolean;
  channel: Channel | null;
  deviceConfirmed: boolean;
  quietHours: { startHour: number; endHour: number } | null;
  skipped: number;
}

export function inQuietHours(quiet: Reminder['quietHours'], hour: number): boolean {
  if (!quiet) return false;
  return quiet.startHour <= quiet.endHour
    ? hour >= quiet.startHour && hour < quiet.endHour
    : hour >= quiet.startHour || hour < quiet.endHour;
}

/** Whether a reminder may be shown now. Every condition is required. */
export function canRemind(reminder: Reminder, hour: number): boolean {
  if (!reminder.optIn || reminder.channel === null) return false;
  if (reminder.channel === 'device' && !reminder.deviceConfirmed) return false;
  return !inQuietHours(reminder.quietHours, hour);
}

/** Skipping counts, and never switches reminders off or lowers anything. */
export function skip(reminder: Reminder): Reminder {
  return { ...reminder, skipped: reminder.skipped + 1 };
}

/** Ties an insight to a move the person chose. An empty move is refused. */
export function chooseMove(move: string): string | null {
  const trimmed = move.trim();
  return trimmed ? trimmed : null;
}
