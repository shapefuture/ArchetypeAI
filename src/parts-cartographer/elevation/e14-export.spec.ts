import { describe, expect, it } from 'vitest';
import type { ContentVersion } from '../core/content-versions.ts';
import type { Memory } from '../core/personal-memory.ts';
import {
  afterAttempt,
  artifactFreshness,
  available,
  deriveArtifact,
  memorySource,
  previewExport,
  revocationLimit,
  routeFor,
  type Capabilities,
  type ExportSelection,
  type ExportSource,
  type Route,
} from './e14-export.ts';

const EXPORTED = '2026-10-16T09:00:00.000Z';

const versions: ContentVersion[] = [
  { version: 'v1', locale: 'en', text: 'First wording.', private: false },
  { version: 'v2', locale: 'en', text: 'Revised wording.', private: false },
  { version: 'v3', locale: 'en', text: 'Private reflection.', private: true },
  { version: 'v1', locale: 'ru', text: 'Первая редакция.', private: false },
];

// Synthetic fixture: no real person's data.
const source: ExportSource = {
  id: 'practice-7',
  kind: 'practice',
  saved: true,
  versions,
  fields: [
    { key: 'title', label: 'Title', value: 'Pause and name it', provenance: 'user-authorship', sensitivity: 'shareable' },
    { key: 'score', label: 'Check-in', value: '3 of 5', provenance: 'observation', sensitivity: 'shareable' },
    { key: 'note', label: 'Note', value: 'Felt tight at work', provenance: 'user-authorship', sensitivity: 'private' },
    { key: 'other', label: 'Other person', value: 'Shared by someone else', provenance: 'hypothesis', sensitivity: 'third-party' },
  ],
};

const sel = (over: Partial<ExportSelection> = {}): ExportSelection => ({
  sourceId: 'practice-7',
  locale: 'en',
  includeBody: true,
  versionId: 'v2',
  fieldKeys: ['title', 'score'],
  includePrivate: false,
  ...over,
});

const caps: Capabilities = { share: true, clipboard: true, print: true, download: true };

/** Previews, then derives the artifact from the fingerprint the person saw. Throws if either step refuses. */
function exportedCopy(src: ExportSource, selection: ExportSelection) {
  const preview = previewExport(src, selection);
  if (!preview.ok) throw new Error(`preview refused: ${preview.reason}`);
  const derived = deriveArtifact(src, selection, preview.preview.fingerprint, EXPORTED);
  if (!derived.ok) throw new Error(`derive refused: ${derived.reason}`);
  return derived.artifact;
}

describe('E14.04 export selection and derived artifacts', () => {
  it('previews the exact fields and the selected version, and lists every exclusion', () => {
    const result = previewExport(source, sel());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.preview.fields.map((field) => field.key)).toEqual(['title', 'score']);
    expect(result.preview.version).toEqual({ id: 'v2', text: 'Revised wording.' });
    expect(result.preview.excluded).toEqual([
      { key: 'note', reason: 'not-selected' },
      { key: 'other', reason: 'not-selected' },
    ]);
  });

  it('refuses an unsaved source, because unsaved drafts, chat and memories are never exported', () => {
    expect(previewExport({ ...source, saved: false }, sel())).toEqual({ ok: false, reason: 'unsaved-source' });
    const unsavedMemory: Memory = { id: 'm1', text: 'A passing thought', source: 'user-entry', derivedFrom: [], saved: false };
    expect(previewExport(memorySource(unsavedMemory), sel({ sourceId: 'm1', includeBody: false, fieldKeys: ['origin'] })))
      .toEqual({ ok: false, reason: 'unsaved-source' });
  });

  it('refuses an empty selection', () => {
    expect(previewExport(source, sel({ includeBody: false, fieldKeys: [] }))).toEqual({ ok: false, reason: 'empty-selection' });
  });

  it('refuses a private version unless the person includes private content explicitly', () => {
    // The latest English version is private, so the default selection is refused.
    expect(previewExport(source, sel({ versionId: null, fieldKeys: [] }))).toEqual({ ok: false, reason: 'private-version-not-included' });
    const included = previewExport(source, sel({ versionId: 'v3', fieldKeys: [], includePrivate: true }));
    expect(included.ok && included.preview.version?.id).toBe('v3');
  });

  it('never exports a third-party field, and exports a private field only when it is included', () => {
    const withThird = previewExport(source, sel({ includeBody: false, fieldKeys: ['title', 'other'] }));
    expect(withThird.ok && withThird.preview.fields.map((field) => field.key)).toEqual(['title']);
    expect(withThird.ok && withThird.preview.excluded).toContainEqual({ key: 'other', reason: 'third-party' });
    expect(previewExport(source, sel({ includeBody: false, fieldKeys: ['note'] }))).toEqual({ ok: false, reason: 'empty-selection' });
    const privateOn = previewExport(source, sel({ includeBody: false, fieldKeys: ['note', 'other'], includePrivate: true }));
    expect(privateOn.ok && privateOn.preview.fields.map((field) => field.key)).toEqual(['note']);
    expect(privateOn.ok && privateOn.preview.excluded).toContainEqual({ key: 'other', reason: 'third-party' });
  });

  it('refuses a locale with no version instead of substituting another language', () => {
    expect(previewExport(source, sel({ locale: 'de' }))).toEqual({ ok: false, reason: 'no-version-for-locale' });
    expect(previewExport(source, sel({ locale: 'ru', versionId: 'v2' }))).toEqual({ ok: false, reason: 'no-version-for-locale' });
  });

  it('exports the selected version rather than the latest one', () => {
    const picked = previewExport(source, sel({ versionId: 'v1', includeBody: true }));
    expect(picked.ok && picked.preview.version).toEqual({ id: 'v1', text: 'First wording.' });
    const latest = previewExport(source, sel({ versionId: null, includePrivate: true }));
    expect(latest.ok && latest.preview.version?.id).toBe('v3');
  });

  it('derives an artifact whose text matches the previewed fields and carries the preview fingerprint', () => {
    const preview = previewExport(source, sel());
    if (!preview.ok) throw new Error('preview should succeed');
    const derived = deriveArtifact(source, sel(), preview.preview.fingerprint, EXPORTED);
    expect(derived.ok).toBe(true);
    if (!derived.ok) return;
    const { artifact } = derived;
    expect(artifact.text).toContain('Pause and name it');
    expect(artifact.text).toContain('Revised wording.');
    expect(artifact.text).not.toContain('Felt tight at work');
    expect(artifact.text).not.toContain('Shared by someone else');
    expect(artifact.text).toContain('cannot be recalled');
    expect(artifact.fieldKeys).toEqual(['title', 'score']);
    expect(artifact.previewFingerprint).toBe(preview.preview.fingerprint);
    expect(artifact.fileName).toBe('practice-7-v2.txt');
    expect(artifact.mime).toBe('text/plain;charset=utf-8');
  });

  it('refuses to derive a file after the source changes, and refuses an unreadable export time', () => {
    const preview = previewExport(source, sel());
    if (!preview.ok) throw new Error('preview should succeed');
    const edited: ExportSource = {
      ...source,
      fields: source.fields.map((field) => (field.key === 'title' ? { ...field, value: 'Name it, then pause' } : field)),
    };
    expect(deriveArtifact(edited, sel(), preview.preview.fingerprint, EXPORTED)).toEqual({ ok: false, reason: 'preview-mismatch' });
    expect(deriveArtifact(source, sel(), preview.preview.fingerprint, 'not-a-time')).toEqual({ ok: false, reason: 'invalid-time' });
  });
});

describe('E14.07 recovery: unsupported shortcuts, failed downloads, interruption and stale copies', () => {
  it('recovers an unsupported share shortcut: falls back to a file, then to on-screen reading', () => {
    expect(routeFor('share-sheet', caps)).toBe('share-sheet');
    expect(routeFor('share-sheet', { ...caps, share: false })).toBe('file');
    expect(routeFor('print', { ...caps, print: false })).toBe('file');
    expect(routeFor('share-sheet', { share: false, clipboard: false, print: false, download: false })).toBe('on-screen');
    expect(available('hosted-link', caps)).toBe(false);
  });

  it('recovers a failed download: a handoff claims only handed-to-browser, and a rejected file is retried on screen', () => {
    expect(afterAttempt('file', 'handed-to-browser', caps)).toEqual({ claim: 'handed-to-browser', retryWith: 'file', selectionKept: true });
    expect(afterAttempt('file', 'rejected', caps)).toEqual({ claim: 'none', retryWith: 'on-screen', selectionKept: true });
    expect(afterAttempt('share-sheet', 'unsupported', caps).retryWith).toBe('file');
  });

  it('keeps the selection and claims nothing after a cancelled or interrupted attempt', () => {
    for (const attempt of ['cancelled', 'interrupted'] as const) {
      expect(afterAttempt('print', attempt, caps)).toEqual({ claim: 'none', retryWith: 'print', selectionKept: true });
    }
  });

  it('recovers stale exported copies: a changed source makes a copy stale, and a missing source is reported as removed', () => {
    const copy = exportedCopy(source, sel());
    expect(artifactFreshness(copy, source)).toBe('current');
    const edited: ExportSource = {
      ...source,
      fields: source.fields.map((field) => (field.key === 'title' ? { ...field, value: 'Name it, then pause' } : field)),
    };
    expect(artifactFreshness(copy, edited)).toBe('stale');
    expect(artifactFreshness(copy, null)).toBe('source-removed');
    expect(artifactFreshness(copy, { ...source, id: 'practice-8' })).toBe('source-removed');
  });

  it('states truthful revocation limits: hosted access can be withdrawn, and no copy on any other route can be recalled', () => {
    expect(revocationLimit('hosted-link')).toEqual({ revocable: true, copiesRecallable: false, statement: 'access-can-be-withdrawn' });
    const others: Route[] = ['on-screen', 'file', 'print', 'clipboard', 'share-sheet'];
    for (const route of others) {
      expect(revocationLimit(route)).toEqual({ revocable: false, copiesRecallable: false, statement: 'copy-cannot-be-recalled' });
    }
  });
});
