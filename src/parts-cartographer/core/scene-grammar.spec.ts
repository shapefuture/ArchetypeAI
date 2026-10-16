import { describe, expect, it } from 'vitest';
import { validateScene, type Scene, type SceneNode } from './scene-grammar.ts';

const node = (id: string, exits: string[], over: Partial<SceneNode> = {}): SceneNode => ({ id, text: id, textAlternative: `Text for ${id}`, exits, terminal: false, ...over });
const valid: Scene = { start: 'a', nodes: [node('a', ['b']), node('b', [], { terminal: true })] };

describe('scene grammar validation', () => {
  it('accepts a valid, reachable scene with exits and text alternatives', () => {
    expect(validateScene(valid)).toEqual({ ok: true });
  });

  it('rejects a scene with an unknown start or a dangling exit', () => {
    expect(validateScene({ ...valid, start: 'zzz' })).toEqual({ ok: false, reason: 'invalid' });
    expect(validateScene({ start: 'a', nodes: [node('a', ['missing'])] })).toEqual({ ok: false, reason: 'invalid', nodeId: 'a' });
  });

  it('rejects a node without an accessible text alternative', () => {
    const scene: Scene = { start: 'a', nodes: [node('a', ['b'], { textAlternative: null }), node('b', [], { terminal: true })] };
    expect(validateScene(scene)).toEqual({ ok: false, reason: 'inaccessible', nodeId: 'a' });
  });

  it('rejects a node that cannot be reached from the start', () => {
    const scene: Scene = { start: 'a', nodes: [node('a', [], { terminal: true }), node('orphan', [], { terminal: true })] };
    expect(validateScene(scene)).toEqual({ ok: false, reason: 'unreachable', nodeId: 'orphan' });
  });

  it('rejects a reachable node with no way out unless it is an explicit ending', () => {
    const scene: Scene = { start: 'a', nodes: [node('a', ['b']), node('b', [])] };
    expect(validateScene(scene)).toEqual({ ok: false, reason: 'no-exit', nodeId: 'b' });
  });
});
