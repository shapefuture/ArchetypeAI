// Browser history for the React shell. Each distinct route, and each layer opened on top of it
// (an overlay or a part sheet), is one same-document history entry. URLs never change, so Back
// and Forward restore the view the person left. Closing a layer from the UI pops its entry
// instead of stacking a dead one, and a route change dismisses layers from history.

export const NAV_LOADING = 'loading';

export type NavSheet = { type: 'part'; id: string | number } | null;
export type NavView = { route: string; overlay: string | null; sheet: NavSheet };
export type NavEntry = NavView & { ifsNav: 1; from: NavView | null };
export type NavStep =
  | { op: 'push' | 'replace'; view: NavView; from: NavView | null }
  | { op: 'back' };

type Loose = Record<string, unknown> | null | undefined;

export function navOverlay(overlay: unknown): string | null {
  if (typeof overlay === 'string') return overlay;
  const kind = (overlay as Loose)?.kind;
  return typeof kind === 'string' ? kind : null;
}

export function navSheet(sheet: unknown): NavSheet {
  const value = sheet as Loose;
  if (value?.type !== 'part') return null;
  const id = value.id;
  return typeof id === 'string' || typeof id === 'number' ? { type: 'part', id } : null;
}

export function sameSheet(a: NavSheet, b: NavSheet): boolean {
  return a === b || (a !== null && b !== null && a.id === b.id);
}

export function sameView(a: NavView, b: NavView): boolean {
  return a.route === b.route && a.overlay === b.overlay && sameSheet(a.sheet, b.sheet);
}

export function hasLayer(view: NavView): boolean {
  return view.overlay !== null || view.sheet !== null;
}

// Every layer open in `a` is also open, unchanged, in `b`.
function layersWithin(a: NavView, b: NavView): boolean {
  return (a.overlay === null || a.overlay === b.overlay) && (a.sheet === null || sameSheet(a.sheet, b.sheet));
}

function readView(value: unknown): NavView | null {
  const v = value as Loose;
  if (typeof v?.route !== 'string') return null;
  return { route: v.route, overlay: typeof v.overlay === 'string' ? v.overlay : null, sheet: navSheet(v.sheet) };
}

/** Parses a history state written by this module. Foreign or malformed states yield null. */
export function readNavEntry(state: unknown): NavEntry | null {
  const value = state as Loose;
  if (value?.ifsNav !== 1) return null;
  const view = readView(value);
  return view && { ...view, ifsNav: 1, from: readView(value.from) };
}

export function navEntry(view: NavView, from: NavView | null): NavEntry {
  return { ifsNav: 1, route: view.route, overlay: view.overlay, sheet: view.sheet, from };
}

/**
 * Decides how the current history entry must change so it mirrors `next`.
 * `current` is the parsed entry at the active history position (null when it has no app state).
 */
export function planNavigation(current: NavEntry | null, next: NavView): NavStep[] {
  const view: NavView = { route: next.route, overlay: next.overlay ?? null, sheet: next.sheet ?? null };
  if (current && sameView(current, view)) return [];
  if (view.route === NAV_LOADING) return [{ op: 'replace', view, from: null }];
  if (!current || current.route === NAV_LOADING) {
    // The placeholder is replaced, never kept. Layers sit on a route entry so Back from them stays in the app.
    if (!hasLayer(view)) return [{ op: 'replace', view, from: null }];
    const base: NavView = { route: view.route, overlay: null, sheet: null };
    return [{ op: 'replace', view: base, from: null }, { op: 'push', view, from: base }];
  }
  const below: NavView = { route: current.route, overlay: current.overlay, sheet: current.sheet };
  if (current.route === view.route) {
    if (layersWithin(view, below)) {
      // Closing a layer: Back only when the entry below is exactly the view we are returning to.
      return current.from && sameView(current.from, view) ? [{ op: 'back' }] : [{ op: 'replace', view, from: null }];
    }
    if (layersWithin(below, view)) return [{ op: 'push', view, from: below }];
    return [{ op: 'replace', view, from: null }];
  }
  if (hasLayer(below)) return [{ op: 'replace', view, from: null }];
  return [{ op: 'push', view, from: below }];
}
