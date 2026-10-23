import { describe, expect, it } from 'vitest';
import {
  NAV_LOADING,
  navEntry,
  navSheet,
  planNavigation,
  readNavEntry,
  type NavStep,
  type NavView,
} from './navigation-history';

const view = (route: string, overlay: string | null = null, sheet: NavView['sheet'] = null): NavView => ({ route, overlay, sheet });
const part = (id: string) => ({ type: 'part' as const, id });

const viewOf = (entry: unknown): NavView => {
  const { route, overlay, sheet } = readNavEntry(entry)!;
  return { route, overlay, sheet };
};

/** Stands in for window.history: one document's entries and the active position. */
function browser() {
  const entries: unknown[] = [null];
  let index = 0;
  let shown: NavView = view(NAV_LOADING);
  const run = (steps: NavStep[]) => {
    for (const step of steps) {
      if (step.op === 'back') { index -= 1; shown = viewOf(entries[index]); continue; }
      const entry = navEntry(step.view, step.from);
      if (step.op === 'push') { entries.length = index + 1; entries.push(entry); index += 1; }
      else entries[index] = entry;
    }
  };
  return {
    get length() { return entries.length; },
    get index() { return index; },
    get shown() { return shown; },
    // The shell mirrors each committed view into the active entry.
    commit(next: NavView) { shown = next; run(planNavigation(readNavEntry(entries[index]), next)); },
    // Browser Back and Forward (popstate) restore the entry; the shell then has nothing to change.
    back() { index -= 1; shown = viewOf(entries[index]); },
    forward() { index += 1; shown = viewOf(entries[index]); },
    settled() { return planNavigation(readNavEntry(entries[index]), shown); },
  };
}

describe('navigation history state', () => {
  it('reads only states this module wrote', () => {
    expect(readNavEntry(null)).toBeNull();
    expect(readNavEntry({ route: 'intro' })).toBeNull();
    expect(readNavEntry({ ifsNav: 2, route: 'intro' })).toBeNull();
    expect(readNavEntry({ ifsNav: 1, overlay: 'coach' })).toBeNull();
  });

  it('round-trips a layered entry through structured-clone-safe JSON', () => {
    const entry = navEntry(view('cabinet', 'coach', part('p1')), view('cabinet'));
    expect(readNavEntry(JSON.parse(JSON.stringify(entry)))).toEqual(entry);
  });

  it('keeps only part sheets, the one kind that can be restored from history', () => {
    expect(navSheet({ type: 'part', id: 'seed-planner' })).toEqual(part('seed-planner'));
    expect(navSheet({ type: 'charter' })).toBeNull();
    expect(navSheet({ type: 'editor', part: {} })).toBeNull();
    expect(navSheet({ type: 'part', id: undefined })).toBeNull();
  });
});

describe('planNavigation', () => {
  it('replaces the loading placeholder instead of pushing it', () => {
    expect(planNavigation(null, view('intro'))).toEqual([{ op: 'replace', view: view('intro'), from: null }]);
    expect(planNavigation(view(NAV_LOADING), view('intro'))).toEqual([{ op: 'replace', view: view('intro'), from: null }]);
    expect(planNavigation(view('intro'), view(NAV_LOADING))).toEqual([{ op: 'replace', view: view(NAV_LOADING), from: null }]);
  });

  it('keeps a route entry beneath a layer opened on the placeholder, so Back cannot leave the app from it', () => {
    expect(planNavigation(null, view('intro', 'checkin'))).toEqual([
      { op: 'replace', view: view('intro'), from: null },
      { op: 'push', view: view('intro', 'checkin'), from: view('intro') },
    ]);
  });

  it('pushes route changes and opened layers, remembering the view they came from', () => {
    const intro = navEntry(view('intro'), null);
    expect(planNavigation(intro, view('cabinet'))).toEqual([{ op: 'push', view: view('cabinet'), from: view('intro') }]);
    const cabinet = navEntry(view('cabinet'), view('intro'));
    expect(planNavigation(cabinet, view('cabinet', 'coach'))).toEqual([{ op: 'push', view: view('cabinet', 'coach'), from: view('cabinet') }]);
    const sheet = navEntry(view('cabinet', null, part('p1')), view('cabinet'));
    expect(planNavigation(sheet, view('cabinet', 'coach', part('p1')))).toEqual([
      { op: 'push', view: view('cabinet', 'coach', part('p1')), from: view('cabinet', null, part('p1')) },
    ]);
  });

  it('goes Back when closing a layer returns to exactly the entry below', () => {
    const layered = navEntry(view('cabinet', 'coach'), view('cabinet'));
    expect(planNavigation(layered, view('cabinet'))).toEqual([{ op: 'back' }]);
  });

  it('replaces instead of going Back when the entry below is a different view', () => {
    const layered = navEntry(view('universe', 'help'), view('cabinet'));
    expect(planNavigation(layered, view('universe'))).toEqual([{ op: 'replace', view: view('universe'), from: null }]);
  });

  it('dismisses layers from history when the route changes underneath them', () => {
    const layered = navEntry(view('intro', 'install'), view('intro'));
    expect(planNavigation(layered, view('cabinet'))).toEqual([{ op: 'replace', view: view('cabinet'), from: null }]);
  });

  it('replaces when one overlay is swapped for another, so no layer is stacked on a layer', () => {
    const layered = navEntry(view('intro', 'coach'), view('intro'));
    expect(planNavigation(layered, view('intro', 'paywall'))).toEqual([{ op: 'replace', view: view('intro', 'paywall'), from: null }]);
  });

  it('does nothing when the entry already mirrors the view', () => {
    expect(planNavigation(navEntry(view('cabinet', 'coach'), view('cabinet')), view('cabinet', 'coach'))).toEqual([]);
  });
});

describe('browser history journey', () => {
  it('Back and Forward walk routes and open layers in order, with no URL change', () => {
    const b = browser();
    b.commit(view(NAV_LOADING));
    b.commit(view('intro'));
    b.commit(view('cabinet'));
    b.commit(view('cabinet', null, part('p1')));
    b.commit(view('cabinet', 'coach', part('p1')));
    expect(b.length).toBe(4);

    b.back();
    expect(b.shown).toEqual(view('cabinet', null, part('p1')));
    expect(b.settled()).toEqual([]);
    b.back();
    expect(b.shown).toEqual(view('cabinet'));
    b.back();
    expect(b.shown).toEqual(view('intro'));
    expect(b.settled()).toEqual([]);

    b.forward();
    expect(b.shown).toEqual(view('cabinet'));
    expect(b.settled()).toEqual([]);
  });

  it('closing a layer from the UI leaves no dead entry for Back to land on', () => {
    const b = browser();
    b.commit(view(NAV_LOADING));
    b.commit(view('intro'));
    b.commit(view('cabinet'));
    b.commit(view('cabinet', 'coach'));

    b.commit(view('cabinet'));
    expect(b.index).toBe(1);
    expect(b.shown).toEqual(view('cabinet'));
    expect(b.settled()).toEqual([]);

    b.commit(view('universe'));
    b.back();
    expect(b.shown).toEqual(view('cabinet'));
  });

  it('a route change dismisses an open layer from history rather than resurrecting it on Back', () => {
    const b = browser();
    b.commit(view(NAV_LOADING));
    b.commit(view('intro', 'coach'));
    b.commit(view('cabinet'));
    expect(b.length).toBe(2);
    b.back();
    expect(b.shown).toEqual(view('intro'));
  });
});
