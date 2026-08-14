/**
 * INNERVERSE — Constellation headlines (REVAMP_PLAN.md §1.4)
 *
 * 10 protectors x 4 exiles = 40 hardcoded named constellations. Names are
 * DATA, never generated algorithmically. Four names are locked verbatim by the
 * spec; the remaining 36 are copy-pending placeholders flagged `final: false`
 * for the copy team (en/ru essays keyed `constellations.<protector>x<exile>`).
 */
import { PROTECTORS, EXILES, type ProtectorId, type ExileId } from './parts';

export interface ConstellationDef {
  protector: ProtectorId;
  exile: ExileId;
  name: string;
  /** false = placeholder name/essay pending copy team; true = spec-locked. */
  final: boolean;
  essay: string;
}

const c = (protector: ProtectorId, exile: ExileId, name: string, essay: string, final = false): ConstellationDef =>
  ({ protector, exile, name, essay, final });

const PLACEHOLDER_ESSAY =
  'Copy-pending: 150-word essay from the copy team (en/ru), keyed constellations.<protector>x<exile>.';

export const CONSTELLATIONS: ConstellationDef[] = [
  // taskmaster (achievement, perfectionism)
  c('taskmaster', 'abandoned', 'The Unfinished Cathedral', 'You build worth like a cathedral that must never be finished, because resting would let someone walk away.', false),
  c('taskmaster', 'ashamed', 'The Proving Ground', 'Spec-locked.', true),
  c('taskmaster', 'frightened', 'The Iron Schedule', 'A packed calendar stands between you and the catastrophe your body remembers.', false),
  c('taskmaster', 'unseen', 'The Ledger of Deeds', 'You keep receipts of everything you do, as if love were an audit.', false),
  // inner_critic (preemptive self-attack)
  c('inner_critic', 'abandoned', 'The Court of Departures', 'You sentence yourself first, before anyone can leave.', false),
  c('inner_critic', 'ashamed', 'The Prosecution Bench', 'You cross-examine yourself daily so the verdict never surprises you.', false),
  c('inner_critic', 'frightened', "The Gavel's Echo", 'Every mistake is retried at 3 a.m. under an inner judge that never adjourns.', false),
  c('inner_critic', 'unseen', 'The Marginal Note', 'You annotate yourself into footnotes so no one else has to.', false),
  // pleaser (appeasement, caretaking)
  c('pleaser', 'abandoned', 'The Tending Fire', 'Spec-locked.', true),
  c('pleaser', 'ashamed', 'The Apology Garden', 'You grow sorries where other people might grow complaints.', false),
  c('pleaser', 'frightened', 'The Soothing Vigil', 'You calm the room before you even know what you feel.', false),
  c('pleaser', 'unseen', 'The Quiet Accommodation', 'Your yes comes so fast that your own preferences never make it to the table.', false),
  // controller (planning, rigidity, control)
  c('controller', 'abandoned', 'The Bolted Door', 'If nothing changes and no one enters, no one can leave.', false),
  c('controller', 'ashamed', 'The White-Glove Room', 'You inspect your life until it is spotless enough to be seen.', false),
  c('controller', 'frightened', 'The Braced Helm', 'You steer every detail because the sea once swallowed you.', false),
  c('controller', 'unseen', 'The Filing System', 'You organize the world meticulously and file yourself under miscellaneous.', false),
  // analyst (intellectualizing, detachment)
  c('analyst', 'abandoned', 'The Long Equation', 'You solve for connection at a distance where it cannot hurt.', false),
  c('analyst', 'ashamed', 'The Case File', 'You study your flaws with clinical care so they become data, not wounds.', false),
  c('analyst', 'frightened', 'The Glass Observatory', 'Spec-locked.', true),
  c('analyst', 'unseen', 'The Observation Deck', 'You watch life through glass with an excellent view of your own absence.', false),
  // hermit (proactive isolation)
  c('hermit', 'abandoned', 'The One-Light House', 'You leave one lamp on for a visitor who never quite arrives — you.', false),
  c('hermit', 'ashamed', 'The Shuttered Window', 'You close the shutters before anyone can look in.', false),
  c('hermit', 'frightened', 'The Walled Garden', 'Behind high walls, everything is quiet and nothing can reach you.', false),
  c('hermit', 'unseen', 'The Locked Study', 'Your rich inner library has no reading lamp for guests.', false),
  // bypasser (transcendence-as-escape)
  c('bypasser', 'abandoned', 'The Bright Detour', 'You rise above the ache so quickly it never gets to speak.', false),
  c('bypasser', 'ashamed', 'The Rose Window', 'You frame the wound in stained glass until it looks like a lesson.', false),
  c('bypasser', 'frightened', 'The Floating Bridge', 'You hover over danger on a bridge made of insight.', false),
  c('bypasser', 'unseen', 'The Endless Summer', 'You keep the weather golden so no one asks about the winter underneath.', false),
  // numb (dissociation)
  c('numb', 'abandoned', 'The Snowed-In Station', 'The train of feeling stops arriving; you keep the station warm anyway.', false),
  c('numb', 'ashamed', 'The White Noise Room', 'Static fills the channel where shame would otherwise broadcast.', false),
  c('numb', 'frightened', 'The Still Water', 'You go so calm that alarm itself falls asleep.', false),
  c('numb', 'unseen', 'The Fog Field', 'You walk through your own life wrapped in cotton wool.', false),
  // rebel (anger, defiance)
  c('rebel', 'abandoned', 'The Burning Bridges', 'You leave first, loudly, so departure is at least yours.', false),
  c('rebel', 'ashamed', 'The Torn Flag', 'You fly your own colors over a wound you never named.', false),
  c('rebel', 'frightened', 'The Cornered Storm', 'You come out swinging because stillness once meant getting hit.', false),
  c('rebel', 'unseen', 'The Signal Flare', 'Spec-locked.', true),
  // charmer (seduction, performance)
  c('charmer', 'abandoned', 'The Hundred-Mirror Room', 'You surround yourself with mirrors so the room is never empty.', false),
  c('charmer', 'ashamed', 'The Spotlight Mask', 'The performance is so bright that no one checks what is behind it.', false),
  c('charmer', 'frightened', 'The Dazzling Retreat', 'You exit through a burst of confetti.', false),
  c('charmer', 'unseen', 'The Standing Ovation', 'You collect applause like receipts for a self no one actually meets.', false),
];

const KEY = (p: ProtectorId, e: ExileId) => `${p}x${e}` as const;
export type ConstellationKey = ReturnType<typeof KEY>;
export const constellationKey = KEY;

const BY_KEY: Record<string, ConstellationDef> = Object.fromEntries(
  CONSTELLATIONS.map(d => [KEY(d.protector, d.exile), d]),
);

export function constellation(p: ProtectorId, e: ExileId): ConstellationDef {
  const found = BY_KEY[KEY(p, e)];
  if (!found) throw new Error(`Missing constellation for ${p}x${e}`);
  return found;
}

export const CONSTELLATION_COUNT = PROTECTORS.length * EXILES.length; // 40
