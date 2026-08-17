/**
 * INNERVERSE - Constellation headlines (REVAMP_PLAN.md 1.4)
 *
 * 10 protectors x 4 exiles = 40 hardcoded named constellations. Names are
 * DATA, never generated algorithmically. Four names are locked verbatim by
 * the spec. All 40 are final; bilingual names/essays resolve through
 * constellation-copy.ts (constellationName / constellationEssay).
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

export const CONSTELLATIONS: ConstellationDef[] = [
  // taskmaster (achievement, perfectionism)
  c('taskmaster', 'abandoned', 'The Unfinished Cathedral', 'You build worth like a cathedral that must never be finished, because resting would let someone walk away.', true),
  c('taskmaster', 'ashamed', 'The Proving Ground', 'Every result is a hearing, every delivery a plea: competent enough, this time, to be kept.', true),
  c('taskmaster', 'frightened', 'The Iron Schedule', 'A packed calendar stands between you and the catastrophe your body remembers.', true),
  c('taskmaster', 'unseen', 'The Ledger of Deeds', 'You keep receipts of everything you do, as if love were an audit.', true),
  // inner_critic (preemptive self-attack)
  c('inner_critic', 'abandoned', 'The Court of Departures', 'You sentence yourself first, before anyone can leave.', true),
  c('inner_critic', 'ashamed', 'The Prosecution Bench', 'You cross-examine yourself daily so the verdict never surprises you.', true),
  c('inner_critic', 'frightened', "The Gavel's Echo", 'Every mistake is retried at 3 a.m. under an inner judge that never adjourns.', true),
  c('inner_critic', 'unseen', 'The Marginal Note', 'You annotate yourself into footnotes so no one else has to.', true),
  // pleaser (appeasement, caretaking)
  c('pleaser', 'abandoned', 'The Tending Fire', 'You keep everyone else’s fire tended so no one notices — or leaves — the one quietly going out inside you.', true),
  c('pleaser', 'ashamed', 'The Apology Garden', 'You grow sorries where other people might grow complaints.', true),
  c('pleaser', 'frightened', 'The Soothing Vigil', 'You calm the room before you even know what you feel.', true),
  c('pleaser', 'unseen', 'The Quiet Accommodation', 'Your yes comes so fast that your own preferences never make it to the table.', true),
  // controller (planning, rigidity, control)
  c('controller', 'abandoned', 'The Bolted Door', 'If nothing changes and no one enters, no one can leave.', true),
  c('controller', 'ashamed', 'The White-Glove Room', 'You inspect your life until it is spotless enough to be seen.', true),
  c('controller', 'frightened', 'The Braced Helm', 'You steer every detail because the sea once swallowed you.', true),
  c('controller', 'unseen', 'The Filing System', 'You organize the world meticulously and file yourself under miscellaneous.', true),
  // analyst (intellectualizing, detachment)
  c('analyst', 'abandoned', 'The Long Equation', 'You solve for connection at a distance where it cannot hurt.', true),
  c('analyst', 'ashamed', 'The Case File', 'You study your flaws with clinical care so they become data, not wounds.', true),
  c('analyst', 'frightened', 'The Glass Observatory', 'From behind glass you map the storm with perfect precision — dry, untouched, and alone.', true),
  c('analyst', 'unseen', 'The Observation Deck', 'You watch life through glass with an excellent view of your own absence.', true),
  // hermit (proactive isolation)
  c('hermit', 'abandoned', 'The One-Light House', 'You leave one lamp on for a visitor who never quite arrives â you.', true),
  c('hermit', 'ashamed', 'The Shuttered Window', 'You close the shutters before anyone can look in.', true),
  c('hermit', 'frightened', 'The Walled Garden', 'Behind high walls, everything is quiet and nothing can reach you.', true),
  c('hermit', 'unseen', 'The Locked Study', 'Your rich inner library has no reading lamp for guests.', true),
  // bypasser (transcendence-as-escape)
  c('bypasser', 'abandoned', 'The Bright Detour', 'You rise above the ache so quickly it never gets to speak.', true),
  c('bypasser', 'ashamed', 'The Rose Window', 'You frame the wound in stained glass until it looks like a lesson.', true),
  c('bypasser', 'frightened', 'The Floating Bridge', 'You hover over danger on a bridge made of insight.', true),
  c('bypasser', 'unseen', 'The Endless Summer', 'You keep the weather golden so no one asks about the winter underneath.', true),
  // numb (dissociation)
  c('numb', 'abandoned', 'The Snowed-In Station', 'The train of feeling stops arriving; you keep the station warm anyway.', true),
  c('numb', 'ashamed', 'The White Noise Room', 'Static fills the channel where shame would otherwise broadcast.', true),
  c('numb', 'frightened', 'The Still Water', 'You go so calm that alarm itself falls asleep.', true),
  c('numb', 'unseen', 'The Fog Field', 'You walk through your own life wrapped in cotton wool.', true),
  // rebel (anger, defiance)
  c('rebel', 'abandoned', 'The Burning Bridges', 'You leave first, loudly, so departure is at least yours.', true),
  c('rebel', 'ashamed', 'The Torn Flag', 'You fly your own colors over a wound you never named.', true),
  c('rebel', 'frightened', 'The Cornered Storm', 'You come out swinging because stillness once meant getting hit.', true),
  c('rebel', 'unseen', 'The Signal Flare', 'You burn loud and bright across every sky, praying someone finally reads the message: I am here.', true),
  // charmer (seduction, performance)
  c('charmer', 'abandoned', 'The Hundred-Mirror Room', 'You surround yourself with mirrors so the room is never empty.', true),
  c('charmer', 'ashamed', 'The Spotlight Mask', 'The performance is so bright that no one checks what is behind it.', true),
  c('charmer', 'frightened', 'The Dazzling Retreat', 'You exit through a burst of confetti.', true),
  c('charmer', 'unseen', 'The Standing Ovation', 'You collect applause like receipts for a self no one actually meets.', true),
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
