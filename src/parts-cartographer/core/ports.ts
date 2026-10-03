// core/ports.ts — frozen V1 port contracts (draft: core/ports/*)
// Implemented locally in this build; swap adapters without touching UI.

export interface AuthUser { uid: string; email: string | null; provider: 'anonymous' | 'google' | 'email'; linked: boolean; }

export interface AUTH_PORT {
  currentUser(): AuthUser | null;
  anonymousBootstrap(): Promise<AuthUser>;          // at ~4s (boot)
  signInGoogle(): Promise<AuthUser>;                // popup w/ redirect fallback
  signInEmail(email: string, mode: 'in' | 'up', password: string): Promise<AuthUser>;
  linkAnonymous(email: string, provider: 'google' | 'email', password?: string): Promise<AuthUser>; // keeps UID
  signOut(): Promise<void>;
}

export interface STORAGE_PORT {
  load<T>(key: string, fallback: T): T;
  save<T>(key: string, value: T): void;             // "latest"
  archive<T>(key: string, value: T): void;          // history archive
  history<T>(key: string): T[];
  remove(key: string): void;
}

// AI_PORT — frozen V1, 6 methods (draft: core/ports/ai.port.ts)
export interface AI_PORT {
  chat(messages: { role: 'user' | 'ai'; text: string }[], mode: 'general' | 'parts'): Promise<string>;
  aiReport(profile: unknown): Promise<string>;
  quickScan(code: string): Promise<string>;
  suggestExercise(profile: unknown): Promise<string>; // returns exercise id
  archetypeCreate(prompt: string): Promise<string>;   // Archetype Studio
  predictPart(event: string, arousal: number): Promise<string>; // JITAI
}

export type Degradation = { degraded: boolean; reason: string | null };

export interface BILLING_PORT {
  plans(): { id: string; interval: 'monthly' | 'yearly' | 'lifetime'; price: number; currency: string }[];
  checkout(planId: string, email?: string): Promise<{ ok: boolean; verified: boolean }>;
  isPremium(): boolean;
  restore(): Promise<boolean>;
}

export const isPremiumCached = (): boolean => {
  try { return localStorage.getItem('ifs.billing') === 'premium'; } catch { return false; }
};

// deterministic local RNG helpers shared by scoring/synastry
export function hashStr(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function rngFrom(seed: number) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let x = Math.imul(a ^ (a >>> 15), 1 | a); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
}
export const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
export const uid8 = () => {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 8; i++) out += abc[Math.floor(Math.random() * abc.length)];
  return out;
};
