// Local-first STORAGE_PORT. Assessments, journals, and part maps remain in
// this browser; explicit export/share actions are handled by the UI.
import type { STORAGE_PORT } from './ports';

const HIST_CAP = 30;
const mem: Record<string, string[]> = {};

function packedHistory(key: string): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(`${key}.hist`) ?? '[]');
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  } catch { return []; }
}

export const store: STORAGE_PORT = {
  load<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch { return fallback; }
  },
  save<T>(key: string, value: T) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
    // Keep a bounded local archive alongside the latest value.
    try {
      const h = mem[key] ?? (mem[key] = packedHistory(key));
      const packed = JSON.stringify(value);
      if (h[h.length - 1] !== packed) {
        h.push(packed);
        if (h.length > HIST_CAP) h.shift();
        localStorage.setItem(`${key}.hist`, JSON.stringify(h));
      }
    } catch { /* ignore */ }
  },
  archive<T>(key: string, value: T) {
    try {
      const h = mem[key] ?? (mem[key] = packedHistory(key));
      h.push(JSON.stringify(value));
      if (h.length > HIST_CAP) h.shift();
      localStorage.setItem(`${key}.hist`, JSON.stringify(h));
    } catch { /* ignore */ }
  },
  history<T>(key: string): T[] {
    const packed = packedHistory(key);
    mem[key] = [...packed];
    return packed.flatMap((item) => {
      try { return [JSON.parse(item) as T]; } catch { return []; }
    });
  },
  remove(key: string) {
    try { localStorage.removeItem(key); localStorage.removeItem(`${key}.hist`); } catch { /* ignore */ }
    delete mem[key];
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
