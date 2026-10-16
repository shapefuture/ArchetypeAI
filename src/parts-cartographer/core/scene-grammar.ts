// Reviewed scene grammar and validation (ArchetypeAI-28h.7.1). Pure.
// A scene is accepted only when it is valid, every node has an accessible text alternative, every node is
// reachable from the start, and every reachable node has a way out (an exit or an explicit ending).

export interface SceneNode { id: string; text: string; textAlternative: string | null; exits: ReadonlyArray<string>; terminal: boolean; }
export interface Scene { start: string; nodes: ReadonlyArray<SceneNode>; }

export type SceneProblem = 'invalid' | 'inaccessible' | 'unreachable' | 'no-exit';

export function validateScene(scene: Scene): { ok: true } | { ok: false; reason: SceneProblem; nodeId?: string } {
  const ids = scene.nodes.map((n) => n.id);
  if (!ids.includes(scene.start) || new Set(ids).size !== ids.length) return { ok: false, reason: 'invalid' };
  const byId = new Map(scene.nodes.map((n) => [n.id, n] as const));
  for (const node of scene.nodes) {
    if (node.exits.some((e) => !byId.has(e))) return { ok: false, reason: 'invalid', nodeId: node.id };
    if (!node.textAlternative || !node.textAlternative.trim()) return { ok: false, reason: 'inaccessible', nodeId: node.id };
  }
  const reachable = new Set<string>([scene.start]);
  const queue = [scene.start];
  while (queue.length) {
    const current = byId.get(queue.shift() as string);
    for (const next of current?.exits ?? []) {
      if (!reachable.has(next)) { reachable.add(next); queue.push(next); }
    }
  }
  for (const node of scene.nodes) {
    if (!reachable.has(node.id)) return { ok: false, reason: 'unreachable', nodeId: node.id };
    if (node.exits.length === 0 && !node.terminal) return { ok: false, reason: 'no-exit', nodeId: node.id };
  }
  return { ok: true };
}
