import { describe, expect, it } from 'vitest';
import { appendVersion, latestFor, type ContentVersion } from './content-versions.ts';

const en1: ContentVersion = { version: '1', locale: 'en', text: 'Your reflection', private: true };
const ru1: ContentVersion = { version: '1', locale: 'ru', text: 'Ваше размышление', private: true };

describe('content versions', () => {
  it('appends a new version and never rewrites an earlier one', () => {
    const history = [en1];
    const next = appendVersion(history, { version: '2', locale: 'en', text: 'Your reflection, revised', private: true });
    expect(next[0]).toBe(en1);
    expect(next).toHaveLength(2);
  });

  it('does not add the same version twice', () => {
    expect(appendVersion([en1], en1)).toEqual([en1]);
  });

  it('returns null for a locale with no version, instead of silently substituting another', () => {
    expect(latestFor([en1], 'ru')).toBeNull();
    expect(latestFor([en1, ru1], 'ru')).toBe(ru1);
  });
});
