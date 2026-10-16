import { describe, expect, it } from 'vitest';
import { createCard, recordOutcome } from '../core/experiment-outcome';
import type { Scene } from '../core/scene-grammar';
import {
  EXTENSIONS, ID_MAPPING_STATUS, MIN_COMPARED_SESSIONS, activePath, buildBrief, checkEquivalence, decideStop,
  mergeRecords, pauseForDiscomfort, tallyComparisons, type ComparisonRecord, type ExtensionSpec, type PrerequisiteStatus,
  type RecordKind,
} from './e19-comparison';

const spec = (key: string): ExtensionSpec => EXTENSIONS.find((e) => e.key === key)!;
const matched = (s: ExtensionSpec) => ({
  extensionSlots: s.requiredOutputs,
  comparatorText: Object.fromEntries(s.requiredOutputs.map((o) => [o, `Plain text for ${o}`])),
});
const allMet = (s: ExtensionSpec): Record<string, PrerequisiteStatus> => Object.fromEntries(s.prerequisites.map((p) => [p.id, 'met' as const]));
let seq = 0;
const rec = (kind: RecordKind, preferred: ComparisonRecord['preferred'] = null, extra: Partial<ComparisonRecord> = {}): ComparisonRecord => ({
  id: `rec-${++seq}`, source: 'person', kind, preferred, repeatChoice: false, minutesUsed: 10, tradeoffNote: null, ...extra,
});
const useful = (n = MIN_COMPARED_SESSIONS) => Array.from({ length: n }, () => rec('compared', 'extension', { repeatChoice: true, tradeoffNote: 'Needs a longer setup' }));
const readyBrief = (key = 'rehearse-tomorrow') => {
  const s = spec(key);
  return buildBrief(s, { ...matched(s), prerequisiteStatus: allMet(s) });
};

describe('E19 catalog and equivalence (step 04)', () => {
  it('covers plan entries 15.1-15.7 with a named simpler path and keeps the X-labels unverified', () => {
    expect(EXTENSIONS.map((e) => e.planSection)).toEqual(['15.1', '15.2', '15.3', '15.4', '15.5', '15.6', '15.7']);
    expect(EXTENSIONS.map((e) => e.provisionalId)).toEqual(['X01', 'X02', 'X03', 'X04', 'X05', 'X06', 'X07']);
    expect(EXTENSIONS.every((e) => e.comparator.path.length > 0)).toBe(true);
    expect(ID_MAPPING_STATUS).toBe('unverified');
  });

  it('matches when the simpler path covers exactly the extension outputs', () => {
    const s = spec('rehearse-tomorrow');
    expect(checkEquivalence(s, matched(s))).toEqual({ status: 'matched' });
  });

  it('reports a comparator gap or an output mismatch, and blocks the stop decision', () => {
    const s = spec('rehearse-tomorrow');
    const gap = checkEquivalence(s, { ...matched(s), comparatorText: { 'chosen-response': 'Plain text' } });
    expect(gap).toEqual({ status: 'comparator-gap', detail: ['experiment-card'] });
    const extra = checkEquivalence(s, { ...matched(s), extensionSlots: ['chosen-response', 'experiment-card', 'branch-score'] });
    expect(extra).toEqual({ status: 'output-mismatch', detail: ['extra:branch-score'] });
    const brief = buildBrief(s, { ...matched(s), comparatorText: {}, prerequisiteStatus: allMet(s) });
    expect(decideStop(brief, tallyComparisons(useful()))).toBe('blocked-equivalence');
  });

  it('fails scene equivalence when a scene node has no text alternative', () => {
    const s = spec('rehearse-tomorrow');
    const scene: Scene = {
      start: 'a',
      nodes: [
        { id: 'a', text: 'Opening', textAlternative: 'Opening in words', exits: ['b'], terminal: false },
        { id: 'b', text: 'Choice', textAlternative: '  ', exits: [], terminal: true },
      ],
    };
    expect(checkEquivalence(s, { ...matched(s), scene })).toEqual({ status: 'scene-invalid', detail: ['inaccessible:b'] });
  });

  it('keeps hypothesis, observation, authorship and canonical measurement as separate claims', () => {
    const s = spec('rehearse-tomorrow');
    const card = createCard({ id: 'card-1', situation: 'When the meeting runs late', action: 'I will send one short message' })!;
    const brief = buildBrief(s, { ...matched(s), prerequisiteStatus: allMet(s), outcomes: [recordOutcome(card, 'did-not-try', 'busy day')] });
    expect(brief.claims.hypothesis).toBe(s.hypothesis);
    expect(brief.claims.observation).toMatchObject({ recordedCount: 1, causalClaim: false });
    expect(brief.claims.authorship).toBe('person');
    expect(brief.claims.canonicalMeasurement).toBe('excluded');
    expect(readyBrief().claims.observation.recordedCount).toBe(0);
  });
});

describe('E19 stop decisions and recovery (step 07)', () => {
  it('recovers unavailable prerequisites: unknown is never met, and the brief defers', () => {
    const s = spec('facilitated-lab');
    const brief = buildBrief(s, { ...matched(s), prerequisiteStatus: { 'qualified-facilitator': 'met', 'research-consent': 'unknown' } });
    expect(brief.prerequisites.met).toBe(false);
    expect(brief.prerequisites.unmet).toHaveLength(2);
    expect(brief.pendingEvidence.length).toBeGreaterThan(1);
    expect(decideStop(brief, tallyComparisons(useful()))).toBe('defer-prerequisite');
  });

  it('continues a prototype only with benefit, repeat choice and a recorded trade-off', () => {
    const brief = readyBrief();
    const decision = decideStop(brief, tallyComparisons(useful()));
    expect(decision).toBe('continue-prototype');
    expect(activePath(decision)).toBe('extension');
    expect(decideStop(brief, tallyComparisons(useful().map((r) => ({ ...r, tradeoffNote: null }))))).toBe('keep-simpler-path');
  });

  it('stays pending with no records or fewer comparisons than the minimum (empty state)', () => {
    const brief = readyBrief();
    expect(decideStop(brief, tallyComparisons([]))).toBe('pending-evidence');
    expect(decideStop(brief, tallyComparisons(useful(MIN_COMPARED_SESSIONS - 1)))).toBe('pending-evidence');
    expect(activePath('pending-evidence')).toBe('simpler-path');
  });

  it('recovers no advantage: the simpler path stays and the extension is never counted as preferred', () => {
    const ev = tallyComparisons([rec('compared', 'comparator'), rec('compared', 'comparator'), rec('compared', 'no-difference')])!;
    expect(ev.extensionPreferred).toBe(0);
    const decision = decideStop(readyBrief(), ev);
    expect(decision).toBe('stop-no-advantage');
    expect(activePath(decision)).toBe('simpler-path');
  });

  it('recovers discomfort: the extension pauses and the world is returned unchanged', () => {
    const world = { places: ['garden'], progress: 4 };
    expect(decideStop(readyBrief(), tallyComparisons([...useful(), rec('discomfort')]))).toBe('pause-discomfort');
    expect(pauseForDiscomfort(world)).toBe(world);
  });

  it('recovers denied participation: a declined record is not counted and the simpler path stays', () => {
    const ev = tallyComparisons([rec('declined')])!;
    expect(ev.comparedSessions).toBe(0);
    expect(decideStop(readyBrief(), ev)).toBe('no-participation');
    expect(activePath('no-participation')).toBe('simpler-path');
  });

  it('recovers an interrupted comparison: it is not counted and earlier records survive', () => {
    const ev = tallyComparisons([...useful(), rec('interrupted', null)])!;
    expect(ev.comparedSessions).toBe(MIN_COMPARED_SESSIONS);
    expect(ev.interruptedRuns).toBe(1);
    expect(decideStop(readyBrief(), ev)).toBe('continue-prototype');
  });

  it('recovers unreadable storage: null evidence stays pending and is never read as no advantage', () => {
    expect(tallyComparisons(null)).toBeNull();
    expect(decideStop(readyBrief(), null)).toBe('pending-evidence');
  });

  it('recovers concurrent writes: merging is idempotent, order-free and drops conflicting ids', () => {
    const a = rec('compared', 'extension', { id: 'shared' });
    const b = rec('compared', 'comparator', { id: 'other' });
    const clash = { ...a, preferred: 'comparator' as const };
    const forward = mergeRecords([[a, b], [a]]);
    expect(mergeRecords([[a], [b, a]])).toEqual(forward);
    expect(forward.records.map((r) => r.id)).toEqual(['other', 'shared']);
    expect(mergeRecords([[a], [clash]]).conflictingIds).toEqual(['shared']);
    expect(tallyComparisons([a, clash, b])!.excludedRecords).toBe(1);
  });

  it('recovers authority: model- and facilitator-sourced comparisons are excluded from every tally', () => {
    const outside: ComparisonRecord[] = [
      ...useful().map((r) => ({ ...r, source: 'model' as const })),
      { ...rec('compared', 'extension'), source: 'facilitator' as const },
    ];
    const ev = tallyComparisons(outside)!;
    expect(ev).toMatchObject({ comparedSessions: 0, extensionPreferred: 0, excludedRecords: 4 });
    expect(decideStop(readyBrief(), ev)).toBe('pending-evidence');
  });
});
