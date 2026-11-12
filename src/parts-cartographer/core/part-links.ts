// How parts relate to each other: links the person draws and describes, links the Parts map 2.0 derives, and the
// complexes they chain into. Display data only: a link never changes a part, its scores or its coordinates.
import type { Assessment2Result } from '../../shared/core/data/assessment2/scoring';
import { store } from './local-store';

export const LINKS_KEY = 'ifs.links';
export const LINKS_CHANGED = 'ifs:links-changed';

/**
 * IFS relationship kinds. Directional kinds read "from <kind> to": a protector protects an exile, a part triggers
 * another, an exile carries a burden for another part. Polarised and allied are symmetric.
 */
export const LINK_KINDS = ['protects', 'polarized', 'allied', 'triggers', 'carries'] as const;
export type LinkKind = (typeof LINK_KINDS)[number];
export const DIRECTED_KINDS: ReadonlySet<LinkKind> = new Set(['protects', 'triggers', 'carries']);
/** Kinds that chain parts into a complex: a protective or reactive sequence around a core. */
export const COMPLEX_KINDS: ReadonlySet<LinkKind> = new Set(['protects', 'triggers', 'carries']);
export const NOTE_MAX = 280;

export interface PartLink {
  id: string;
  from: string;
  to: string;
  kind: LinkKind;
  note: string;
  source: 'user' | 'parts-2';
  createdAt?: string;
}

export interface Complex {
  id: string;
  /** Member part ids, in a stable order. */
  members: string[];
  /** The part the complex forms around: an exile when there is one, else the most-linked member. */
  core: string;
}

interface PartLike { id: string; family?: string }

const isKind = (value: unknown): value is LinkKind => (LINK_KINDS as readonly unknown[]).includes(value);

/** The same pair and kind is one link. A symmetric kind is the same link whichever way it was drawn. */
export function linkSignature(link: Pick<PartLink, 'from' | 'to' | 'kind'>): string {
  const [a, b] = DIRECTED_KINDS.has(link.kind) ? [link.from, link.to] : [link.from, link.to].sort();
  return `${link.kind}:${a}>${b}`;
}

/** Valid user links from stored data: known kinds, two different parts, a trimmed note, no duplicates. */
export function parseLinks(value: unknown): PartLink[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: PartLink[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as Record<string, unknown>;
    if (typeof item.from !== 'string' || typeof item.to !== 'string' || !item.from || !item.to || item.from === item.to) continue;
    if (!isKind(item.kind)) continue;
    const link: PartLink = {
      id: typeof item.id === 'string' && item.id ? item.id : `link_${out.length}_${item.from}_${item.to}`,
      from: item.from,
      to: item.to,
      kind: item.kind,
      note: typeof item.note === 'string' ? item.note.trim().slice(0, NOTE_MAX) : '',
      source: 'user',
      ...(typeof item.createdAt === 'string' ? { createdAt: item.createdAt } : {}),
    };
    const signature = linkSignature(link);
    if (seen.has(signature)) continue;
    seen.add(signature);
    out.push(link);
  }
  return out;
}

export function readUserLinks(): PartLink[] {
  return parseLinks(store.load<unknown>(LINKS_KEY, []));
}

/** Saves the person's links and tells open screens. Returns false when the browser refused the write. */
export function saveUserLinks(links: PartLink[]): boolean {
  const ok = store.save(LINKS_KEY, parseLinks(links));
  try { window.dispatchEvent(new CustomEvent(LINKS_CHANGED)); } catch { /* no window */ }
  return ok;
}

let linkCounter = 0;
/** Adds a link, or replaces the note of the same link. A link to itself or of an unknown kind is ignored. */
export function addUserLink(links: PartLink[], input: { from: string; to: string; kind: LinkKind; note?: string }, now = new Date()): PartLink[] {
  if (!input.from || !input.to || input.from === input.to || !isKind(input.kind)) return links;
  const note = (input.note ?? '').trim().slice(0, NOTE_MAX);
  const signature = linkSignature(input);
  const existing = links.find((link) => linkSignature(link) === signature);
  if (existing) return links.map((link) => (link === existing ? { ...link, note } : link));
  linkCounter += 1;
  return [...links, { id: `link_${now.getTime().toString(36)}_${linkCounter}`, from: input.from, to: input.to, kind: input.kind, note, source: 'user', createdAt: now.toISOString() }];
}

export function removeUserLink(links: PartLink[], id: string): PartLink[] {
  return links.filter((link) => link.id !== id);
}

/** The universe id of a Parts map 2.0 part key (parts2-universe-adapter.ts). */
export const parts2PartId = (key: string): string => `parts2_${key.replace(':', '_')}`;

/**
 * Links the Parts map 2.0 result already states: each protector protects the exiles it guards, and each derived
 * conflict is a polarisation between its two parts. Only parts present on the map are linked.
 */
export function derivedLinks(result: Pick<Assessment2Result, 'parts' | 'conflicts'> | null, partIds: ReadonlySet<string>): PartLink[] {
  if (!result) return [];
  const links: PartLink[] = [];
  const seen = new Set<string>();
  const push = (from: string, to: string, kind: LinkKind, note: string) => {
    if (from === to || !partIds.has(from) || !partIds.has(to)) return;
    const link: PartLink = { id: `derived_${kind}_${from}_${to}`, from, to, kind, note, source: 'parts-2' };
    const signature = linkSignature(link);
    if (seen.has(signature)) return;
    seen.add(signature);
    links.push(link);
  };
  for (const part of result.parts) {
    if (part.kind !== 'protector') continue;
    for (const exile of part.guards ?? []) push(parts2PartId(part.key), parts2PartId(`exile:${exile}`), 'protects', '');
  }
  for (const conflict of result.conflicts ?? []) {
    const [a, b] = conflict.keys;
    if (a && b) push(parts2PartId(a), parts2PartId(b), 'polarized', conflict.type);
  }
  return links;
}

/** Every link to show: the person's own first, then derived ones they have not already drawn; both ends must exist. */
export function mapLinks(user: PartLink[], derived: PartLink[], partIds: ReadonlySet<string>): PartLink[] {
  const present = (link: PartLink) => partIds.has(link.from) && partIds.has(link.to);
  const own = user.filter(present);
  const drawn = new Set(own.map(linkSignature));
  return [...own, ...derived.filter((link) => present(link) && !drawn.has(linkSignature(link)))];
}

/**
 * Complexes (Jung): parts chained by protecting, triggering or carrying links form one feeling-toned cluster. Each
 * connected group of two or more parts is a complex, named for its core: an exile when the group has one (the
 * wounded centre the others organise around), else the member with the most links. Ties keep id order.
 */
export function findComplexes(links: PartLink[], parts: PartLike[]): Complex[] {
  const family = new Map(parts.map((part) => [part.id, part.family]));
  const neighbours = new Map<string, Set<string>>();
  const degree = new Map<string, number>();
  for (const link of links) {
    if (!COMPLEX_KINDS.has(link.kind) || !family.has(link.from) || !family.has(link.to)) continue;
    for (const [a, b] of [[link.from, link.to], [link.to, link.from]]) {
      if (!neighbours.has(a)) neighbours.set(a, new Set());
      neighbours.get(a)!.add(b);
      degree.set(a, (degree.get(a) ?? 0) + 1);
    }
  }
  const seen = new Set<string>();
  const complexes: Complex[] = [];
  for (const start of [...neighbours.keys()].sort()) {
    if (seen.has(start)) continue;
    const members: string[] = [];
    const queue = [start];
    seen.add(start);
    while (queue.length) {
      const id = queue.shift()!;
      members.push(id);
      for (const next of neighbours.get(id) ?? []) if (!seen.has(next)) { seen.add(next); queue.push(next); }
    }
    if (members.length < 2) continue;
    members.sort();
    const exiles = members.filter((id) => family.get(id) === 'exile');
    const pool = exiles.length ? exiles : members;
    const core = [...pool].sort((a, b) => (degree.get(b) ?? 0) - (degree.get(a) ?? 0) || (a < b ? -1 : 1))[0];
    complexes.push({ id: `complex_${core}`, members, core });
  }
  return complexes;
}
