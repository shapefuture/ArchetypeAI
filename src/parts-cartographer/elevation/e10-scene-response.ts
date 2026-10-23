// Deterministic scene responses and impossible-branch rejection for play with meaningful consequences (ArchetypeAI-waw,
// step E10.04). Pure: the same rehearsal, scene and action always give the same result.
// Every response carries the hypothetical label. Scene text is authored; sentences and moves belong to the person.
// Limits, sentences and steps change only the imagined rehearsal. Canonical data is never read or written.
// Impossible branches are rejected for three reasons: not an exit of the reviewed scene, blocked by a practical limit
// the person set, or a sentence that predicts or reconstructs a real event.
// NOT done here: controls and rendering (step 05), wiring to the Replay screen or storage (step 06), and any evidence
// that play helps anyone (steps 10-12). Recovery cases are exercised in the colocated spec (step E10.07).
// Reuses scene-grammar (validateScene), replay-authoring (validateReplay) and inner-negotiation (branch, editMove).
import { validateScene, type Scene } from '../core/scene-grammar';
import { validateReplay } from '../core/replay-authoring';
import { branch, editMove } from '../core/inner-negotiation';

/** Practical limits that block a node while switched on, and the cast roles a node speaks to. */
export interface NodeRule { blockedBy: ReadonlyArray<string>; roles: ReadonlyArray<string>; }
export interface RehearsalScene { id: string; scene: Scene; rules: Readonly<Record<string, NodeRule>>; }
export interface CastMember { role: string; name: string | null; }
export interface Step { from: string; to: string; chosenBy: 'user'; }
export interface SavedMove { nodeId: string; steps: ReadonlyArray<Step>; authoredBy: 'user'; canonical: 'untouched'; }
export type Status = 'active' | 'paused' | 'left';

export interface Rehearsal {
  sceneId: string;
  status: Status;
  nodeId: string;
  /** Last saved frame. Pause, leave and skip return here. */
  returnNodeId: string;
  /** Unsaved steps. Pause, leave and skip clear them. */
  steps: ReadonlyArray<Step>;
  savedMoves: ReadonlyArray<SavedMove>;
  limits: Readonly<Record<string, boolean>>;
  cast: ReadonlyArray<CastMember>;
  /** The person's own sentence: an unsaved draft, cleared with the rehearsal. */
  sentence: string;
  version: number;
}

export type Action =
  | { kind: 'choose'; targetId: string }
  | { kind: 'set-limit'; limitId: string; on: boolean }
  | { kind: 'edit-sentence'; text: string }
  | { kind: 'try-sentence' }
  | { kind: 'save-move' }
  | { kind: 'mark-unhelpful' }
  | { kind: 'pause' }
  | { kind: 'leave' }
  | { kind: 'skip' }
  | { kind: 'resume' };

export type RejectReason =
  | 'invalid-scene' | 'stale-version' | 'not-active' | 'not-an-exit' | 'blocked-by-limit' | 'unknown-limit'
  | 'empty-sentence' | 'claims-reconstruction' | 'nothing-to-save' | 'nothing-to-discard' | 'unknown-action';

export interface Option { targetId: string; possible: boolean; limitId: string | null; }

export interface Response {
  outcome: 'moved' | 'previewed' | 'changed' | 'cleared' | 'saved' | 'rejected';
  label: 'hypothetical';
  nodeId: string;
  text: string | null;
  textAlternative: string | null;
  textSource: 'authored-scene' | 'user-sentence' | null;
  roleLabels: Readonly<Record<string, string>>;
  castSparse: boolean;
  /** The same choices offered as text, so a guided-text path uses the same tool. */
  options: ReadonlyArray<Option>;
  conflictingSteps: number;
  clearedSteps: number;
  reason: RejectReason | null;
  limitId: string | null;
  canonical: 'untouched';
}

export interface Result { rehearsal: Rehearsal; response: Response; }
export type StartResult = { ok: true; rehearsal: Rehearsal } | { ok: false; reason: 'not-opted-in' | 'invalid-scene' };

const nodeOf = (scene: Scene, id: string) => scene.nodes.find((n) => n.id === id) ?? null;
const ruleOf = (scene: RehearsalScene, id: string): NodeRule => scene.rules[id] ?? { blockedBy: [], roles: [] };
const blockerOf = (r: Rehearsal, scene: RehearsalScene, id: string): string | null =>
  ruleOf(scene, id).blockedBy.find((limit) => r.limits[limit] === true) ?? null;
const declaredLimits = (scene: RehearsalScene): string[] =>
  [...new Set(Object.values(scene.rules).flatMap((rule) => [...rule.blockedBy]))];

export function optionsAt(r: Rehearsal, scene: RehearsalScene): Option[] {
  return (nodeOf(scene.scene, r.nodeId)?.exits ?? []).map((targetId) => {
    const limitId = blockerOf(r, scene, targetId);
    return { targetId, possible: limitId === null, limitId };
  });
}

/** A named cast member is used as written. A missing name gets a neutral role label, never an invented name. */
function roleInfo(r: Rehearsal, scene: RehearsalScene): Pick<Response, 'roleLabels' | 'castSparse'> {
  const roleLabels: Record<string, string> = {};
  let castSparse = false;
  for (const role of ruleOf(scene, r.nodeId).roles) {
    const name = r.cast.find((m) => m.role === role)?.name?.trim();
    if (name) roleLabels[role] = name;
    else { roleLabels[role] = `the ${role} person`; castSparse = true; }
  }
  return { roleLabels, castSparse };
}

function reply(outcome: Response['outcome'], r: Rehearsal, scene: RehearsalScene, patch: Partial<Response> = {}): Response {
  return {
    outcome,
    label: 'hypothetical',
    nodeId: r.nodeId,
    text: null,
    textAlternative: null,
    textSource: null,
    ...roleInfo(r, scene),
    options: optionsAt(r, scene),
    conflictingSteps: r.steps.filter((s) => blockerOf(r, scene, s.to) !== null).length,
    clearedSteps: 0,
    reason: null,
    limitId: null,
    canonical: 'untouched',
    ...patch,
  };
}

/** Starts a rehearsal at the scene start. Nothing starts without an explicit opt-in or with an invalid scene. */
export function startRehearsal(scene: RehearsalScene, cast: ReadonlyArray<CastMember>, optIn: boolean): StartResult {
  if (!optIn) return { ok: false, reason: 'not-opted-in' };
  if (!validateScene(scene.scene).ok) return { ok: false, reason: 'invalid-scene' };
  const start = scene.scene.start;
  return {
    ok: true,
    rehearsal: {
      sceneId: scene.id, status: 'active', nodeId: start, returnNodeId: start, steps: [], savedMoves: [],
      limits: {}, cast: cast.map((m) => ({ ...m })), sentence: '', version: 0,
    },
  };
}

/**
 * Applies one action. A rejected action returns the same rehearsal object. An accepted change increments version.
 * expectVersion, when given, refuses an action that was built against an older version of the rehearsal.
 */
export function respond(r: Rehearsal, action: Action, scene: RehearsalScene, expectVersion?: number): Result {
  const reject = (reason: RejectReason, limitId: string | null = null): Result =>
    ({ rehearsal: r, response: reply('rejected', r, scene, { reason, limitId }) });
  const done = (outcome: Response['outcome'], next: Rehearsal, patch: Partial<Response> = {}): Result => {
    const bumped = { ...next, version: r.version + 1 };
    return { rehearsal: bumped, response: reply(outcome, bumped, scene, patch) };
  };
  const unchanged = (outcome: Response['outcome']): Result => ({ rehearsal: r, response: reply(outcome, r, scene) });

  if (!validateScene(scene.scene).ok) return reject('invalid-scene');
  if (expectVersion !== undefined && expectVersion !== r.version) return reject('stale-version');

  // Lifecycle actions work from any status. Pause, leave and skip clear the unsaved rehearsal and keep the return location.
  switch (action.kind) {
    case 'pause':
      if (r.status === 'left') return reject('not-active');
      if (r.status === 'paused') return unchanged('cleared');
      return done('cleared', { ...r, status: 'paused', nodeId: r.returnNodeId, steps: [], sentence: '' }, { clearedSteps: r.steps.length });
    case 'leave':
      if (r.status === 'left') return unchanged('changed');
      return done('cleared', { ...r, status: 'left', nodeId: r.returnNodeId, steps: [], sentence: '' }, { clearedSteps: r.steps.length });
    case 'skip':
      if (r.status !== 'active') return reject('not-active');
      return done('cleared', { ...r, nodeId: r.returnNodeId, steps: [], sentence: '' }, { clearedSteps: r.steps.length });
    case 'resume':
      if (r.status === 'active') return unchanged('changed');
      return done('changed', { ...r, status: 'active' });
    default:
      break;
  }

  if (r.status !== 'active') return reject('not-active');
  switch (action.kind) {
    case 'choose': {
      const node = nodeOf(scene.scene, r.nodeId);
      if (!node || !node.exits.includes(action.targetId)) return reject('not-an-exit');
      const limitId = blockerOf(r, scene, action.targetId);
      if (limitId) return reject('blocked-by-limit', limitId);
      const target = nodeOf(scene.scene, action.targetId);
      if (!target) return reject('not-an-exit');
      const steps = [...r.steps, { from: r.nodeId, to: target.id, chosenBy: 'user' as const }];
      return done('moved', { ...r, nodeId: target.id, steps }, { text: target.text, textAlternative: target.textAlternative, textSource: 'authored-scene' });
    }
    case 'set-limit': {
      if (!declaredLimits(scene).includes(action.limitId)) return reject('unknown-limit', action.limitId);
      return done('changed', { ...r, limits: { ...r.limits, [action.limitId]: action.on } }, { limitId: action.limitId });
    }
    case 'edit-sentence': {
      if (!action.text.trim()) return reject('empty-sentence');
      return done('changed', { ...r, sentence: editMove(r.sentence, action.text) });
    }
    case 'try-sentence': {
      const b = branch(r.sentence);
      if (!b) return reject('empty-sentence');
      const check = validateReplay({ id: 'sentence-check', title: '', optIn: true, castNames: ['check'], beats: [b.text] });
      if (check.ok === false && check.reason === 'claims-reconstruction') return reject('claims-reconstruction');
      return { rehearsal: r, response: reply('previewed', r, scene, { text: b.text, textSource: 'user-sentence' }) };
    }
    case 'save-move': {
      if (r.steps.length === 0) return reject('nothing-to-save');
      const saved: SavedMove = { nodeId: r.nodeId, steps: r.steps, authoredBy: 'user', canonical: 'untouched' };
      return done('saved', { ...r, savedMoves: [...r.savedMoves, saved], returnNodeId: r.nodeId, steps: [] });
    }
    case 'mark-unhelpful': {
      const last = r.steps[r.steps.length - 1];
      if (!last) return reject('nothing-to-discard');
      return done('cleared', { ...r, nodeId: last.from, steps: r.steps.slice(0, -1) }, { clearedSteps: 1 });
    }
    default:
      return reject('unknown-action');
  }
}
