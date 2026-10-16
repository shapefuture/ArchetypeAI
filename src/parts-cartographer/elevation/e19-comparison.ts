// E19 extension comparison: scene/text output equivalence and experiment workcell briefs (ArchetypeAI-umo5).
// Recovery cases for ArchetypeAI-uebc (no advantage, discomfort, denied participation, unavailable prerequisites,
// interruption, unreadable storage, concurrent writes, authority) are handled here and covered by tests. Pure: no
// storage, no clock, no network, no React. Each signature or experimental extension is compared with a simpler
// complete path that must give the same outputs. A brief keeps the hypothesis, the person's observations, the
// person's authorship and the canonical boundary as separate labelled claims. Stop decisions count only
// person-authored records. An extension is never required for ordinary use, and canonical 64/147 data is never read.
// NOT done here: UI (step 05), wiring into screens or Beads (step 06), evidence collection and acceptance (steps 10-12).
// The X01-X07 labels are provisional: the inventory could not verify that plan sections 15.1-15.7 are those identifiers.

import { summarizeExperiments, type ExperimentSummary, type OutcomeEntry } from '../core/experiment-outcome';
import { leaveOrRest, type WorldState } from '../core/quiet-mode';
import { decideExpansion } from '../core/replay-evaluation';
import { validateScene, type Scene } from '../core/scene-grammar';

/** Labels from plan sections 15.1-15.7 stay unverified until the tracker reconciles them. */
export const ID_MAPPING_STATUS = 'unverified' as const;
/** Educated guess, not a plan value: fewest recorded comparisons before any continue or stop decision. */
export const MIN_COMPARED_SESSIONS = 3;

export type PrerequisiteKind = 'qualified' | 'hardware' | 'community' | 'account' | 'consent' | 'review';
export type PrerequisiteStatus = 'met' | 'unmet' | 'unknown';
export interface Prerequisite { id: string; kind: PrerequisiteKind; need: string; }
export interface SimplerPath { path: string; source: 'plan' | 'proposed'; }
export interface ExtensionSpec {
  key: string;
  planSection: string;
  provisionalId: string;
  purpose: string;
  /** A guess to test. It is never a finding. */
  hypothesis: string;
  requiredOutputs: ReadonlyArray<string>;
  comparator: SimplerPath;
  prerequisites: ReadonlyArray<Prerequisite>;
  stopRule: string;
}

/** The seven plan entries (docs/80-20-plan.md 15.1-15.7) as comparison fixtures. */
export const EXTENSIONS: ReadonlyArray<ExtensionSpec> = [
  {
    key: 'rehearse-tomorrow', planSection: '15.1', provisionalId: 'X01',
    purpose: 'Prepare for an ordinary upcoming situation and export the chosen response as an experiment card',
    hypothesis: 'Interactive branches help a person choose and practice a response beyond a checklist.',
    requiredOutputs: ['chosen-response', 'experiment-card'],
    comparator: { path: 'Preparation checklist', source: 'plan' },
    prerequisites: [{ id: 'scene-review', kind: 'review', need: 'Reviewed scene grammar and a practical constraint' }],
    stopRule: 'Keep the checklist if branches add no benefit or add overload.',
  },
  {
    key: 'shared-room', planSection: '15.2', provisionalId: 'X02',
    purpose: 'Support one collaboration mode that yields a jointly accepted draft with contribution history',
    hypothesis: 'A shared room gives value that an asynchronous exchange cannot.',
    requiredOutputs: ['joint-draft', 'contribution-history'],
    comparator: { path: 'Asynchronous artifact exchange', source: 'proposed' },
    prerequisites: [
      { id: 'recipient-accounts', kind: 'account', need: 'Each person holds an account with recipient permissions checked' },
      { id: 'sharing-consent', kind: 'consent', need: 'Each person consents to context previews before sharing' },
    ],
    stopRule: 'Pause distribution while disagreement safety, power imbalance, stale permissions or accidental sharing are unresolved.',
  },
  {
    key: 'contextual-cues', planSection: '15.3', provisionalId: 'X03',
    purpose: 'Let the person author a reminder cue and control when it appears',
    hypothesis: 'An in-app cue helps outside the app more than a physical or exported cue.',
    requiredOutputs: ['reminder-phrase', 'cue-timing'],
    comparator: { path: 'Physical or exported cue', source: 'plan' },
    prerequisites: [{ id: 'device-channel', kind: 'hardware', need: 'Confirmed device channel, never an assumed one' }],
    stopRule: 'Stop app delivery if it adds nothing over the physical cue or weakens privacy or discretion.',
  },
  {
    key: 'facilitated-lab', planSection: '15.4', provisionalId: 'X04',
    purpose: 'Deliver a specific sensitive facilitated protocol with stop, return and support routes',
    hypothesis: 'Qualified facilitation gives support that self-guided practice cannot.',
    requiredOutputs: ['protocol-session', 'support-route'],
    comparator: { path: 'Reviewed self-guided practice with an exit route', source: 'proposed' },
    prerequisites: [
      { id: 'qualified-facilitator', kind: 'qualified', need: 'Qualified facilitator staffing' },
      { id: 'research-consent', kind: 'consent', need: 'Research consent kept separate from app consent and paid-service terms' },
      { id: 'protocol-review', kind: 'review', need: 'Reviewed protocol boundaries' },
    ],
    stopRule: 'Do not proceed without staffing, consent, reviewed boundaries and a support route.',
  },
  {
    key: 'lenses', planSection: '15.5', provisionalId: 'X05',
    purpose: 'Offer a user-selected interpretive lens with transparent provenance and an ordinary-language alternative',
    hypothesis: 'A labelled lens supports meaning-making beyond ordinary-language reflection.',
    requiredOutputs: ['interpretive-lens', 'plain-alternative', 'provenance'],
    comparator: { path: 'Ordinary-language reflection without the lens', source: 'plan' },
    prerequisites: [{ id: 'community-review', kind: 'community', need: 'Appropriate sources and community reviewers' }],
    stopRule: 'Stop if provenance or review is unavailable, or the lens imposes a worldview.',
  },
  {
    key: 'xr-arrangement', planSection: '15.6', provisionalId: 'X06',
    purpose: 'Spatial inspection of an authored rehearsal arrangement',
    hypothesis: 'Spatial presence improves inspection enough to justify its comfort and effort costs.',
    requiredOutputs: ['arrangement-inspection'],
    comparator: { path: 'Ordinary map or scene with a complete non-XR path', source: 'plan' },
    prerequisites: [{ id: 'xr-hardware', kind: 'hardware', need: 'Supported real XR hardware with input, pause and exit' }],
    stopRule: 'Iterate or stop when the non-XR path already gives the same useful output.',
  },
  {
    key: 'shared-artifact', planSection: '15.7', provisionalId: 'X07',
    purpose: 'Share a user-chosen useful artifact',
    hypothesis: 'Inviting others adds useful value beyond a private export.',
    requiredOutputs: ['shared-artifact', 'sharing-scope'],
    comparator: { path: 'Private export of the chosen artifact', source: 'proposed' },
    prerequisites: [{ id: 'share-consent', kind: 'consent', need: 'Consent understanding shown before sharing' }],
    stopRule: 'Stop if consent is not understood, sharing scope is unclear, or activation is not demonstrated.',
  },
];

export interface EquivalenceInput { extensionSlots: ReadonlyArray<string>; comparatorText: Readonly<Record<string, string>>; scene?: Scene; }
export type Equivalence = { status: 'matched' } | { status: 'output-mismatch' | 'comparator-gap' | 'scene-invalid'; detail: string[] };

/** Matches only when the extension and the simpler path give exactly the same outputs, and the scene (if any) is accessible. */
export function checkEquivalence(spec: ExtensionSpec, input: EquivalenceInput): Equivalence {
  const required = new Set(spec.requiredOutputs);
  const produced = new Set(input.extensionSlots);
  const mismatch = [
    ...spec.requiredOutputs.filter((s) => !produced.has(s)).map((s) => `missing:${s}`),
    ...[...produced].filter((s) => !required.has(s)).map((s) => `extra:${s}`),
  ];
  if (mismatch.length > 0) return { status: 'output-mismatch', detail: mismatch };
  const gap = spec.requiredOutputs.filter((s) => !(input.comparatorText[s] ?? '').trim());
  if (gap.length > 0) return { status: 'comparator-gap', detail: gap };
  if (input.scene) {
    const check = validateScene(input.scene);
    if (check.ok === false) return { status: 'scene-invalid', detail: [check.nodeId ? `${check.reason}:${check.nodeId}` : check.reason] };
  }
  return { status: 'matched' };
}

export interface WorkcellBrief {
  key: string;
  planSection: string;
  provisionalId: string;
  purpose: string;
  claims: {
    /** To be tested; never a finding. */
    hypothesis: string;
    /** Person-recorded outcomes only. Zero until a person records one. */
    observation: ExperimentSummary;
    authorship: 'person';
    canonicalMeasurement: 'excluded';
  };
  comparator: SimplerPath;
  equivalence: Equivalence;
  prerequisites: { met: boolean; unmet: string[] };
  pendingEvidence: string[];
  stopRule: string;
}

export type BriefInput = EquivalenceInput & { prerequisiteStatus: Readonly<Record<string, PrerequisiteStatus>>; outcomes?: ReadonlyArray<OutcomeEntry> };

/** A prerequisite counts as met only when its status is exactly 'met'. Unknown and missing are unmet. */
export function buildBrief(spec: ExtensionSpec, input: BriefInput): WorkcellBrief {
  const unmet = spec.prerequisites.filter((p) => input.prerequisiteStatus[p.id] !== 'met').map((p) => p.need);
  return {
    key: spec.key,
    planSection: spec.planSection,
    provisionalId: spec.provisionalId,
    purpose: spec.purpose,
    claims: { hypothesis: spec.hypothesis, observation: summarizeExperiments(input.outcomes ?? []), authorship: 'person', canonicalMeasurement: 'excluded' },
    comparator: spec.comparator,
    equivalence: checkEquivalence(spec, input),
    prerequisites: { met: unmet.length === 0, unmet },
    pendingEvidence: ['person-recorded comparisons', ...unmet.map((n) => `prerequisite: ${n}`)],
    stopRule: spec.stopRule,
  };
}

export type RecordKind = 'compared' | 'interrupted' | 'discomfort' | 'declined';
export interface ComparisonRecord {
  id: string;
  source: 'person' | 'facilitator' | 'model';
  kind: RecordKind;
  preferred: 'extension' | 'comparator' | 'no-difference' | null;
  repeatChoice: boolean;
  minutesUsed: number;
  tradeoffNote: string | null;
}
export interface ExtensionEvidence {
  comparedSessions: number;
  extensionPreferred: number;
  comparatorPreferred: number;
  repeatChoices: number;
  minutesUsed: number;
  tradeoffNotes: string[];
  discomfortReports: number;
  participationDeclined: boolean;
  interruptedRuns: number;
  excludedRecords: number;
}

const byText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const canon = (r: ComparisonRecord) => JSON.stringify(r, Object.keys(r).sort());

/** Merges record lists. Identical duplicates collapse; an id with two different contents is dropped and reported. Order-free. */
export function mergeRecords(lists: ReadonlyArray<ReadonlyArray<ComparisonRecord>>): { records: ComparisonRecord[]; conflictingIds: string[] } {
  const first = new Map<string, { json: string; record: ComparisonRecord }>();
  const conflicts = new Set<string>();
  for (const record of lists.flat()) {
    const json = canon(record);
    const seen = first.get(record.id);
    if (!seen) first.set(record.id, { json, record });
    else if (seen.json !== json) conflicts.add(record.id);
  }
  const records = [...first.entries()]
    .filter(([id]) => !conflicts.has(id))
    .map(([, v]) => v.record)
    .sort((a, b) => byText(a.id, b.id));
  return { records, conflictingIds: [...conflicts].sort(byText) };
}

/** Tallies person-authored records only. Null (unreadable storage) stays null, never zero. */
export function tallyComparisons(records: ReadonlyArray<ComparisonRecord> | null): ExtensionEvidence | null {
  if (records === null) return null;
  const merged = mergeRecords([records]);
  const ev: ExtensionEvidence = {
    comparedSessions: 0, extensionPreferred: 0, comparatorPreferred: 0, repeatChoices: 0, minutesUsed: 0,
    tradeoffNotes: [], discomfortReports: 0, participationDeclined: false, interruptedRuns: 0,
    excludedRecords: merged.conflictingIds.length,
  };
  for (const r of merged.records) {
    if (r.source !== 'person') { ev.excludedRecords += 1; continue; }
    if (r.kind === 'interrupted') ev.interruptedRuns += 1;
    else if (r.kind === 'declined') ev.participationDeclined = true;
    else if (r.kind === 'discomfort') ev.discomfortReports += 1;
    else {
      ev.comparedSessions += 1;
      if (Number.isFinite(r.minutesUsed) && r.minutesUsed > 0) ev.minutesUsed += r.minutesUsed;
      if (r.preferred === 'extension') {
        ev.extensionPreferred += 1;
        if (r.repeatChoice) ev.repeatChoices += 1;
      } else if (r.preferred === 'comparator') ev.comparatorPreferred += 1;
      if (r.tradeoffNote?.trim()) ev.tradeoffNotes.push(r.tradeoffNote.trim());
    }
  }
  return ev;
}

export type StopDecision =
  | 'blocked-equivalence' | 'defer-prerequisite' | 'pending-evidence' | 'no-participation'
  | 'pause-discomfort' | 'stop-no-advantage' | 'keep-simpler-path' | 'continue-prototype';

/** Order matters: equivalence, then prerequisites, then declines and discomfort, then the minimum sample, then the gate. */
export function decideStop(brief: WorkcellBrief, evidence: ExtensionEvidence | null): StopDecision {
  if (brief.equivalence.status !== 'matched') return 'blocked-equivalence';
  if (!brief.prerequisites.met) return 'defer-prerequisite';
  if (evidence === null) return 'pending-evidence';
  if (evidence.participationDeclined) return 'no-participation';
  if (evidence.discomfortReports > 0) return 'pause-discomfort';
  if (evidence.comparedSessions < MIN_COMPARED_SESSIONS) return 'pending-evidence';
  if (evidence.extensionPreferred === 0) return 'stop-no-advantage';
  const gate = decideExpansion({
    playtimeMinutes: evidence.minutesUsed,
    userBenefitReports: evidence.extensionPreferred,
    demandRecords: evidence.repeatChoices,
    complexityNotes: evidence.tradeoffNotes,
  });
  if (gate === 'expand') return 'continue-prototype';
  return gate === 'no-expansion' ? 'keep-simpler-path' : 'pending-evidence';
}

/** Only a prototype that passed its gate runs as the extension. Every other outcome keeps the simpler path. */
export function activePath(decision: StopDecision): 'extension' | 'simpler-path' {
  return decision === 'continue-prototype' ? 'extension' : 'simpler-path';
}

/** Pausing for discomfort returns the world exactly as it was (quiet-mode rule). */
export function pauseForDiscomfort(world: WorldState): WorldState {
  return leaveOrRest(world);
}
