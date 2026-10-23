// Localized content versions with durable history (ArchetypeAI-28h.7.4). Pure.
// A new version is appended. Earlier versions are never rewritten, so a change never silently reframes private
// history. A locale with no version returns null, rather than substituting another language silently.

export interface ContentVersion { version: string; locale: string; text: string; private: boolean; }
export type VersionHistory = ReadonlyArray<ContentVersion>;

export function appendVersion(history: VersionHistory, next: ContentVersion): VersionHistory {
  if (history.some((v) => v.version === next.version && v.locale === next.locale)) return history;
  return [...history, next];
}

export function latestFor(history: VersionHistory, locale: string): ContentVersion | null {
  const matches = history.filter((v) => v.locale === locale);
  return matches.length > 0 ? matches[matches.length - 1] : null;
}
