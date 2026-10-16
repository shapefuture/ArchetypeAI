// E14.04 local export selection and derived artifact generation (ArchetypeAI-izqt). Pure: no DOM, storage, network
// or clock; the export time is passed in. Builds a field-level preview from the person's selection, derives a
// plain-text artifact bound to that preview by fingerprint, reports whether a copy is current, and states what each
// delivery route can revoke. Failed attempts fall back to safer routes and always keep the selection.
// Reuses: content-versions (selected version, private flag), personal-memory (saved-only rule, memory sources),
// ports.hashStr (non-cryptographic fingerprint).
// NOT done: preview and print layout (UI, step 05); download, share, clipboard and hosted-link calls and wiring
// (step 06); creating hosted links; evidence and acceptance (steps 10-12). Copies are never called recalled or current.

import { latestFor, type ContentVersion } from '../core/content-versions';
import type { Memory, Source as MemorySource } from '../core/personal-memory';
import { hashStr } from '../core/ports';

export type Provenance = 'observation' | 'hypothesis' | 'user-authorship' | 'canonical-measurement';
export type Sensitivity = 'shareable' | 'private' | 'third-party';

export interface ExportField {
  key: string;
  label: string;
  value: string;
  provenance: Provenance;
  sensitivity: Sensitivity;
}

export interface ExportSource {
  id: string;
  kind: 'memory' | 'practice' | 'map-part' | 'report';
  /** Only saved items are exportable. Unsaved drafts and chat are never exported. */
  saved: boolean;
  fields: ReadonlyArray<ExportField>;
  versions: ReadonlyArray<ContentVersion>;
}

export interface ExportSelection {
  sourceId: string;
  locale: string;
  includeBody: boolean;
  /** null means the latest version for the locale. A locale with no version is refused, never substituted. */
  versionId: string | null;
  fieldKeys: ReadonlyArray<string>;
  /** Private fields and a private version are exported only when the person includes them explicitly. */
  includePrivate: boolean;
}

export type Refusal = 'no-source' | 'unsaved-source' | 'empty-selection' | 'unknown-field' | 'no-version-for-locale'
  | 'private-version-not-included' | 'invalid-time' | 'preview-mismatch';

export interface Preview {
  kind: ExportSource['kind'];
  sourceId: string;
  locale: string;
  version: { id: string; text: string } | null;
  fields: ExportField[];
  excluded: Array<{ key: string; reason: 'not-selected' | 'private' | 'third-party' }>;
  sourceFingerprint: string;
  fingerprint: string;
}

export interface Artifact {
  fileName: string;
  mime: 'text/plain;charset=utf-8';
  text: string;
  sourceId: string;
  sourceFingerprint: string;
  previewFingerprint: string;
  exportedAt: string;
  fieldKeys: string[];
}

const MEMORY_PROVENANCE: Record<MemorySource, Provenance> = {
  'user-entry': 'user-authorship',
  assessment: 'canonical-measurement',
  'model-inference': 'hypothesis',
};

/** A saved memory as an export source. Its text is private by default. */
export function memorySource(memory: Memory, versions: ReadonlyArray<ContentVersion> = []): ExportSource {
  return {
    id: memory.id,
    kind: 'memory',
    saved: memory.saved,
    versions,
    fields: [
      { key: 'origin', label: 'Origin', value: memory.source, provenance: MEMORY_PROVENANCE[memory.source], sensitivity: 'shareable' },
      { key: 'text', label: 'Memory', value: memory.text, provenance: MEMORY_PROVENANCE[memory.source], sensitivity: 'private' },
    ],
  };
}

/** Fingerprint of the source content. An exported copy records it, so a later change is detectable. */
export function sourceFingerprint(source: ExportSource): string {
  return hashStr(JSON.stringify([source.id, source.kind, source.fields, source.versions])).toString(16);
}

const refuse = (reason: Refusal): { ok: false; reason: Refusal } => ({ ok: false, reason });

export function previewExport(source: ExportSource | null, selection: ExportSelection):
  { ok: true; preview: Preview } | { ok: false; reason: Refusal } {
  if (!source || source.id !== selection.sourceId) return refuse('no-source');
  if (!source.saved) return refuse('unsaved-source');
  if (!selection.includeBody && selection.fieldKeys.length === 0) return refuse('empty-selection');
  const known = new Set(source.fields.map((field) => field.key));
  if (selection.fieldKeys.some((key) => !known.has(key))) return refuse('unknown-field');

  let version: Preview['version'] = null;
  if (selection.includeBody) {
    const chosen = selection.versionId === null
      ? latestFor(source.versions, selection.locale)
      : source.versions.find((v) => v.version === selection.versionId && v.locale === selection.locale) ?? null;
    if (!chosen) return refuse('no-version-for-locale');
    if (chosen.private && !selection.includePrivate) return refuse('private-version-not-included');
    version = { id: chosen.version, text: chosen.text };
  }

  const selected = new Set(selection.fieldKeys);
  const fields: ExportField[] = [];
  const excluded: Preview['excluded'] = [];
  for (const field of source.fields) {
    if (!selected.has(field.key)) excluded.push({ key: field.key, reason: 'not-selected' });
    else if (field.sensitivity === 'third-party') excluded.push({ key: field.key, reason: 'third-party' });
    else if (field.sensitivity === 'private' && !selection.includePrivate) excluded.push({ key: field.key, reason: 'private' });
    else fields.push(field);
  }
  if (fields.length === 0 && version === null) return refuse('empty-selection');

  const sourceFp = sourceFingerprint(source);
  const bound = JSON.stringify({
    sourceId: source.id,
    sourceFp,
    locale: selection.locale,
    version,
    fields: fields.map((field) => [field.key, field.value, field.provenance]),
  });
  return {
    ok: true,
    preview: { kind: source.kind, sourceId: source.id, locale: selection.locale, version, fields, excluded, sourceFingerprint: sourceFp, fingerprint: hashStr(bound).toString(16) },
  };
}

const PROVENANCE_LABEL: Record<Provenance, string> = {
  observation: 'Recorded by the app',
  hypothesis: 'Suggested reading, not a finding',
  'user-authorship': 'Written by the person',
  'canonical-measurement': 'From the assessment score',
};
const COPY_NOTE = 'This file is a snapshot. Later changes in the app do not update it. A downloaded or printed copy cannot be recalled.';

/** Derives the artifact only when the current preview still equals the one the person saw. */
export function deriveArtifact(source: ExportSource | null, selection: ExportSelection, previewFingerprint: string, exportedAt: string):
  { ok: true; artifact: Artifact } | { ok: false; reason: Refusal } {
  const result = previewExport(source, selection);
  if (result.ok === false) return { ok: false, reason: result.reason };
  if (Number.isNaN(Date.parse(exportedAt))) return refuse('invalid-time');
  const { preview } = result;
  if (preview.fingerprint !== previewFingerprint) return refuse('preview-mismatch');

  const lines = [`${preview.kind} export`, `Exported: ${exportedAt}`, `Revision: ${preview.sourceFingerprint}`];
  if (preview.version) lines.push(`Version: ${preview.version.id} (${preview.locale})`);
  if (preview.fields.length > 0) {
    lines.push('', 'Fields');
    for (const field of preview.fields) lines.push(`${field.label} (${PROVENANCE_LABEL[field.provenance]}): ${field.value}`);
  }
  if (preview.version) lines.push('', 'Text', preview.version.text);
  lines.push('', COPY_NOTE);

  const stem = [preview.sourceId, preview.version?.id].filter(Boolean).join('-');
  return {
    ok: true,
    artifact: {
      fileName: `${stem.replace(/[^A-Za-z0-9._-]/g, '-')}.txt`,
      mime: 'text/plain;charset=utf-8',
      text: lines.join('\n'),
      sourceId: preview.sourceId,
      sourceFingerprint: preview.sourceFingerprint,
      previewFingerprint,
      exportedAt,
      fieldKeys: preview.fields.map((field) => field.key),
    },
  };
}

export type Freshness = 'current' | 'stale' | 'source-removed';

/** A copy is current only while its source is unchanged. A removed source is reported as removed, never as current. */
export function artifactFreshness(artifact: Pick<Artifact, 'sourceId' | 'sourceFingerprint'>, current: ExportSource | null): Freshness {
  if (!current || current.id !== artifact.sourceId) return 'source-removed';
  return sourceFingerprint(current) === artifact.sourceFingerprint ? 'current' : 'stale';
}

export type Route = 'on-screen' | 'file' | 'print' | 'clipboard' | 'share-sheet' | 'hosted-link';
export interface Capabilities { share: boolean; clipboard: boolean; print: boolean; download: boolean; }
export type Attempt = 'handed-to-browser' | 'cancelled' | 'rejected' | 'unsupported' | 'interrupted';

export function available(route: Route, caps: Capabilities): boolean {
  switch (route) {
    case 'on-screen': return true;
    case 'file': return caps.download;
    case 'print': return caps.print;
    case 'clipboard': return caps.clipboard;
    case 'share-sheet': return caps.share;
    case 'hosted-link': return false;
  }
}

/** The next safer route. On-screen reading is always available, so the chain always ends there. */
const FALLBACK: Record<Route, Route> = {
  'share-sheet': 'file',
  clipboard: 'file',
  print: 'file',
  'hosted-link': 'file',
  file: 'on-screen',
  'on-screen': 'on-screen',
};

/** The route to use now: the requested one when the device supports it, otherwise the nearest safer route. */
export function routeFor(requested: Route, caps: Capabilities): Route {
  let route = requested;
  for (let step = 0; step < 4 && !available(route, caps); step++) route = FALLBACK[route];
  return route;
}

export interface AttemptOutcome {
  claim: 'none' | 'handed-to-browser';
  retryWith: Route;
  selectionKept: true;
}

/** What may be claimed after one attempt, and where the person can go next. The selection is always kept. */
export function afterAttempt(route: Route, attempt: Attempt, caps: Capabilities): AttemptOutcome {
  if (attempt === 'handed-to-browser') return { claim: 'handed-to-browser', retryWith: route, selectionKept: true };
  if (attempt === 'cancelled' || attempt === 'interrupted') return { claim: 'none', retryWith: route, selectionKept: true };
  return { claim: 'none', retryWith: routeFor(FALLBACK[route], caps), selectionKept: true };
}

export interface RevocationLimit {
  revocable: boolean;
  copiesRecallable: false;
  statement: 'access-can-be-withdrawn' | 'copy-cannot-be-recalled';
}

/** Hosted access can be withdrawn. A copy that was downloaded, printed or shared cannot be recalled by any route. */
export function revocationLimit(route: Route): RevocationLimit {
  return route === 'hosted-link'
    ? { revocable: true, copiesRecallable: false, statement: 'access-can-be-withdrawn' }
    : { revocable: false, copiesRecallable: false, statement: 'copy-cannot-be-recalled' };
}
