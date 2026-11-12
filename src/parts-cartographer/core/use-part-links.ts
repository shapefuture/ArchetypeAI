// The links shown for the current parts: the person's own, plus those the Parts map 2.0 states, and the complexes
// they chain into. Re-reads when the person edits a link here or in another tab.
import { useEffect, useMemo, useState } from 'react';
import type { Part } from '../pal/traits';
import { LINKS_CHANGED, LINKS_KEY, derivedLinks, findComplexes, mapLinks, readUserLinks, type Complex, type PartLink } from './part-links';
import { readLastResult } from './parts-two-store';

export interface MapLinks { user: PartLink[]; links: PartLink[]; complexes: Complex[] }

export function useMapLinks(parts: Part[]): MapLinks {
  const [user, setUser] = useState<PartLink[]>(readUserLinks);
  useEffect(() => {
    const refresh = () => setUser(readUserLinks());
    const onStorage = (event: StorageEvent) => { if (event.key === LINKS_KEY) refresh(); };
    window.addEventListener(LINKS_CHANGED, refresh);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(LINKS_CHANGED, refresh);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
  // A new Parts map 2.0 result replaces its parts, so the result is read again whenever the parts change.
  const result = useMemo(() => readLastResult()?.result ?? null, [parts]);
  return useMemo(() => {
    const ids = new Set(parts.map((part) => part.id));
    const links = mapLinks(user, derivedLinks(result, ids), ids);
    return { user, links, complexes: findComplexes(links, parts) };
  }, [user, result, parts]);
}

/** The part's name in the reader's language. */
export const partName = (part: Part | undefined, lang: 'en' | 'ru'): string =>
  !part ? '' : lang === 'ru' ? (part as any).nameRu ?? part.name : (part as any).nameEn ?? part.name;
