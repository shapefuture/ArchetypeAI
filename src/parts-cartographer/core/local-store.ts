// Local-first STORAGE_PORT. Assessments, journals, and part maps remain in
// this browser; explicit export/share actions are handled by the UI.
import type { STORAGE_PORT } from './ports';

const HIST_CAP = 30;
// The archive is a convenience, never the reason a real save fails: it keeps the
// newest copies that fit in this many characters (one large value keeps few copies).
const HIST_BUDGET = 256 * 1024;

/** Always read from storage: a restore or another tab may have changed it since. */
function packedHistory(key: string): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(`${key}.hist`) ?? '[]');
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  } catch { return []; }
}

function writeHistory(key: string, history: string[]): void {
  const kept: string[] = [];
  let size = 0;
  for (let i = history.length - 1; i >= 0 && kept.length < HIST_CAP; i -= 1) {
    size += history[i].length;
    if (size > HIST_BUDGET && kept.length > 0) break;
    kept.unshift(history[i]);
  }
  localStorage.setItem(`${key}.hist`, JSON.stringify(kept));
}

/** A save that did not fit is reported, so the app can tell the person instead of losing it silently. */
function reportStorageFull(key: string): void {
  try { window.dispatchEvent(new CustomEvent('ifs:storage-full', { detail: { key } })); } catch { /* no window */ }
}

export const store: STORAGE_PORT = {
  load<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch { return fallback; }
  },
  save<T>(key: string, value: T) {
    const packed = JSON.stringify(value);
    try { localStorage.setItem(key, packed); } catch { reportStorageFull(key); return; }
    // Keep a bounded local archive alongside the latest value.
    try {
      const h = packedHistory(key);
      if (h[h.length - 1] !== packed) writeHistory(key, [...h, packed]);
    } catch { /* the archive is optional */ }
  },
  archive<T>(key: string, value: T) {
    try { writeHistory(key, [...packedHistory(key), JSON.stringify(value)]); } catch { /* the archive is optional */ }
  },
  history<T>(key: string): T[] {
    return packedHistory(key).flatMap((item) => {
      try { return [JSON.parse(item) as T]; } catch { return []; }
    });
  },
  remove(key: string) {
    try { localStorage.removeItem(key); localStorage.removeItem(`${key}.hist`); } catch { /* ignore */ }
  },
};

export const KEYS = {
  state: 'ifs.state',
  parts: 'ifs.parts',
  profile: 'ifs.profile',
  history: 'ifs.history',
  auth: 'ifs.auth',
  billing: 'ifs.billing.verified.v2',
  strings: 'ifs.lang',
  theme: 'ifs.theme',
  telemetry: 'ifs.telemetry',
  syn: 'ifs.syn.connections',
  share: 'ifs.share.codes',
  onboarded: 'ifs.onboarded',
  helpSeen: 'ifs.help.seen',
  installSeen: 'ifs.install.seen',
  charter: 'ifs.charter',
};
