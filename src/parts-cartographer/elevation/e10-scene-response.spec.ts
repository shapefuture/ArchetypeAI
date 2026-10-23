import { describe, expect, it } from 'vitest';
import { localizeDefaultScene } from '../core/replay-scenes';
import { optionsAt, respond, startRehearsal, type Action, type CastMember, type Rehearsal, type RehearsalScene } from './e10-scene-response';

// Fixture: the authored everyday scene from the product, with practical-limit and cast rules added for these tests.
const base = localizeDefaultScene('en');
const scene: RehearsalScene = {
  id: base.id,
  scene: base.scene,
  rules: {
    offer: { blockedBy: [], roles: ['second'] },
    pause: { blockedBy: [], roles: ['second'] },
    'shared-cup': { blockedBy: ['only-two-minutes'], roles: ['first', 'second'] },
    'alone-cup': { blockedBy: [], roles: ['first'] },
  },
};
const cast: CastMember[] = [{ role: 'first', name: 'Ana' }, { role: 'second', name: 'Ben' }];

function begin(castList: CastMember[] = cast): Rehearsal {
  const started = startRehearsal(scene, castList, true);
  if (!started.ok) throw new Error(started.reason);
  return started.rehearsal;
}
const act = (r: Rehearsal, action: Action) => respond(r, action, scene);
const choose = (targetId: string): Action => ({ kind: 'choose', targetId });
const withSentence = (r: Rehearsal, text: string): Rehearsal => act(r, { kind: 'edit-sentence', text }).rehearsal;
const atOffer = (): Rehearsal => act(begin(), choose('offer')).rehearsal;
const savedAtOffer = (): Rehearsal => act(atOffer(), { kind: 'save-move' }).rehearsal;

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value as object)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

describe('E10 scene responses (normal, empty, denied and failed)', () => {
  it('moves along an authored exit with the scene text, its text alternative and the hypothetical label', () => {
    const { rehearsal, response } = act(begin(), choose('offer'));
    const offerNode = base.scene.nodes.find((n) => n.id === 'offer')!;
    expect(response).toMatchObject({
      outcome: 'moved', label: 'hypothetical', nodeId: 'offer', text: offerNode.text, textAlternative: offerNode.textAlternative,
      textSource: 'authored-scene', reason: null, canonical: 'untouched', roleLabels: { second: 'Ben' }, castSparse: false,
    });
    expect(rehearsal).toMatchObject({ nodeId: 'offer', version: 1 });
    expect(rehearsal.steps).toEqual([{ from: 'kitchen', to: 'offer', chosenBy: 'user' }]);
  });

  it('rejects a target that is not an exit of the current frame, including any move out of a terminal frame', () => {
    const r = begin();
    const result = act(r, choose('alone-cup'));
    expect(result.response).toMatchObject({ outcome: 'rejected', reason: 'not-an-exit' });
    expect(result.rehearsal).toBe(r);
    const terminal = act(atOffer(), choose('shared-cup')).rehearsal;
    expect(act(terminal, choose('offer')).response.reason).toBe('not-an-exit');
  });

  it('a practical limit changes the hypothetical options and blocks the branch it constrains until it is switched off', () => {
    const onSharedCup = act(atOffer(), choose('shared-cup')).rehearsal;
    const conflicting = act(onSharedCup, { kind: 'set-limit', limitId: 'only-two-minutes', on: true });
    expect(conflicting.response.conflictingSteps).toBe(1);
    const limited = act(atOffer(), { kind: 'set-limit', limitId: 'only-two-minutes', on: true });
    expect(limited.response).toMatchObject({ outcome: 'changed', limitId: 'only-two-minutes', options: [{ targetId: 'shared-cup', possible: false, limitId: 'only-two-minutes' }] });
    const blocked = act(limited.rehearsal, choose('shared-cup'));
    expect(blocked.response).toMatchObject({ outcome: 'rejected', reason: 'blocked-by-limit', limitId: 'only-two-minutes' });
    expect(blocked.rehearsal).toBe(limited.rehearsal);
    const freed = act(limited.rehearsal, { kind: 'set-limit', limitId: 'only-two-minutes', on: false });
    expect(act(freed.rehearsal, choose('shared-cup')).response.outcome).toBe('moved');
  });

  it('refuses an undeclared limit, so no invented constraint can block a branch', () => {
    expect(act(begin(), { kind: 'set-limit', limitId: 'made-up', on: true }).response).toMatchObject({ outcome: 'rejected', reason: 'unknown-limit', limitId: 'made-up' });
  });

  it('previews the person\'s own sentence as a user-authored hypothesis without changing the scene', () => {
    const typed = withSentence(begin(), '  Could we sit for a minute?  ');
    const preview = act(typed, { kind: 'try-sentence' });
    expect(preview.response).toMatchObject({ outcome: 'previewed', label: 'hypothetical', text: 'Could we sit for a minute?', textSource: 'user-sentence', reason: null });
    expect(preview.rehearsal).toBe(typed);
    expect(typed.steps).toEqual([]);
  });

  it('rejects a sentence that predicts or reconstructs a real event and an empty sentence; an empty edit keeps the earlier sentence', () => {
    expect(act(withSentence(begin(), 'This will definitely go badly'), { kind: 'try-sentence' }).response.reason).toBe('claims-reconstruction');
    expect(act(withSentence(begin(), 'This is exactly what happened last spring.'), { kind: 'try-sentence' }).response.reason).toBe('claims-reconstruction');
    expect(act(begin(), { kind: 'try-sentence' }).response.reason).toBe('empty-sentence');
    const kept = withSentence(begin(), 'Sit with me');
    const blank = act(kept, { kind: 'edit-sentence', text: '   ' });
    expect(blank.response.reason).toBe('empty-sentence');
    expect(blank.rehearsal.sentence).toBe('Sit with me');
  });

  it('saves only an explicit move as the person\'s own, and refuses to save or discard when nothing is unsaved', () => {
    expect(act(begin(), { kind: 'save-move' }).response.reason).toBe('nothing-to-save');
    expect(act(begin(), { kind: 'mark-unhelpful' }).response.reason).toBe('nothing-to-discard');
    const saved = act(atOffer(), { kind: 'save-move' });
    expect(saved.response).toMatchObject({ outcome: 'saved', clearedSteps: 0, canonical: 'untouched' });
    expect(saved.rehearsal.savedMoves).toEqual([{ nodeId: 'offer', steps: [{ from: 'kitchen', to: 'offer', chosenBy: 'user' }], authoredBy: 'user', canonical: 'untouched' }]);
    expect(saved.rehearsal).toMatchObject({ returnNodeId: 'offer', steps: [] });
  });

  it('guided text offers the same choices as the scene, and the choice it offers moves the same way', () => {
    const r = atOffer();
    const offered = optionsAt(r, scene);
    expect(offered).toEqual([{ targetId: 'shared-cup', possible: true, limitId: null }]);
    const result = act(r, choose(offered[0].targetId));
    expect(result.response.options).toEqual(optionsAt(result.rehearsal, scene));
    expect(result.response.text).toBe(base.scene.nodes.find((n) => n.id === 'shared-cup')!.text);
  });

  it('refuses to start without an opt-in, and refuses to respond from a scene that fails the reviewed grammar', () => {
    expect(startRehearsal(scene, cast, false)).toEqual({ ok: false, reason: 'not-opted-in' });
    const broken: RehearsalScene = { ...scene, scene: { start: 'kitchen', nodes: base.scene.nodes.filter((n) => n.id !== 'quiet') } };
    expect(startRehearsal(broken, cast, true)).toEqual({ ok: false, reason: 'invalid-scene' });
    expect(respond(begin(), choose('offer'), broken).response.reason).toBe('invalid-scene');
  });

  it('is deterministic and never mutates the rehearsal or the scene it is given', () => {
    const frozenScene = deepFreeze(JSON.parse(JSON.stringify(scene)) as RehearsalScene);
    const r = deepFreeze(begin());
    const first = respond(r, choose('offer'), frozenScene);
    expect(respond(r, choose('offer'), frozenScene)).toEqual(first);
    expect(first.rehearsal).not.toBe(r);
  });
});

describe('E10 recovery: skip, leave, pause, sparse cast and unhelpful imagined branch', () => {
  it('recovery: pause clears the unsaved steps and the draft sentence, and keeps the return location and saved moves', () => {
    const drafted = withSentence(act(savedAtOffer(), choose('shared-cup')).rehearsal, 'Maybe we sit');
    const paused = act(drafted, { kind: 'pause' });
    expect(paused.response).toMatchObject({ outcome: 'cleared', clearedSteps: 1, nodeId: 'offer' });
    expect(paused.rehearsal).toMatchObject({ status: 'paused', nodeId: 'offer', returnNodeId: 'offer', steps: [], sentence: '' });
    expect(paused.rehearsal.savedMoves).toHaveLength(1);
    expect(act(paused.rehearsal, choose('shared-cup')).response.reason).toBe('not-active');
    expect(act(paused.rehearsal, { kind: 'resume' }).rehearsal).toMatchObject({ status: 'active', nodeId: 'offer' });
  });

  it('recovery: leave and skip clear the unsaved rehearsal; re-entry starts at the return location, and skip is not a failure', () => {
    const stepped = act(savedAtOffer(), choose('shared-cup')).rehearsal;
    const skipped = act(stepped, { kind: 'skip' });
    expect(skipped.response).toMatchObject({ outcome: 'cleared', reason: null, clearedSteps: 1, canonical: 'untouched' });
    expect(skipped.rehearsal).toMatchObject({ status: 'active', nodeId: 'offer', steps: [] });
    const left = act(stepped, { kind: 'leave' });
    expect(left.rehearsal).toMatchObject({ status: 'left', nodeId: 'offer', steps: [] });
    expect(act(left.rehearsal, { kind: 'leave' }).rehearsal).toBe(left.rehearsal);
    expect(act(left.rehearsal, { kind: 'pause' }).response.reason).toBe('not-active');
    expect(act(left.rehearsal, { kind: 'skip' }).response.reason).toBe('not-active');
    expect(act(left.rehearsal, { kind: 'resume' }).rehearsal).toMatchObject({ status: 'active', nodeId: 'offer' });
  });

  it('recovery: sparse cast uses neutral role labels, never invents a name, and never blocks the scene', () => {
    const sparse = act(begin([{ role: 'second', name: null }]), choose('offer'));
    expect(sparse.response).toMatchObject({ outcome: 'moved', roleLabels: { second: 'the second person' }, castSparse: true });
    expect(JSON.stringify(sparse.response)).not.toMatch(/\b(Ana|Ben)\b/);
    expect(act(begin([]), choose('offer')).response).toMatchObject({ outcome: 'moved', castSparse: true });
    expect(act(begin(), choose('offer')).response).toMatchObject({ roleLabels: { second: 'Ben' }, castSparse: false });
  });

  it('recovery: an unhelpful imagined branch is discarded to its previous frame with its alternatives, and saved moves survive', () => {
    const saved = savedAtOffer();
    const trial = act(saved, choose('shared-cup')).rehearsal;
    const discarded = act(trial, { kind: 'mark-unhelpful' });
    expect(discarded.response).toMatchObject({ outcome: 'cleared', clearedSteps: 1, nodeId: 'offer', reason: null, canonical: 'untouched' });
    expect(discarded.response.options).toEqual([{ targetId: 'shared-cup', possible: true, limitId: null }]);
    expect(discarded.rehearsal).toMatchObject({ nodeId: 'offer', steps: [] });
    expect(discarded.rehearsal.savedMoves).toEqual(saved.savedMoves);
  });

  it('recovery: a stale action built against an older version is refused, and a repeated pause changes nothing', () => {
    const r1 = act(begin(), choose('offer')).rehearsal;
    expect(r1.version).toBe(1);
    expect(respond(r1, choose('shared-cup'), scene, 0).response.reason).toBe('stale-version');
    expect(respond(r1, choose('shared-cup'), scene, 1).response.outcome).toBe('moved');
    const paused = act(r1, { kind: 'pause' }).rehearsal;
    expect(act(paused, { kind: 'pause' }).rehearsal).toBe(paused);
  });
});
