import { describe, expect, it } from 'vitest';
import { initializeApp } from 'firebase/app';
import { doc, initializeFirestore, setDoc } from 'firebase/firestore';
import { scoreProfile, type AssessmentInput } from '../../shared/core/data/scoring-v2';
import { RESOURCES, SHADOW_PARTS } from '../../shared/core/data/parts';
import { therapistSummaryFor } from './therapist-link';

// Round 20 probe: the Share screen builds the therapist summary from the in-memory scored profile.
// A person with no third protector at T >= 45 has copingStack.l3 === undefined, which Firestore refuses.

/** Deterministic pseudo-random ratings 1..5 so the probe is reproducible. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0x100000000; };
}
function inputFrom(seed: number): AssessmentInput {
  const next = rng(seed);
  const rate = () => 1 + Math.floor(next() * 5);
  return {
    shadow: Object.fromEntries(SHADOW_PARTS.map((id) => [id, Array.from({ length: 8 }, rate)])),
    resources: Object.fromEntries(RESOURCES.map((id) => [id, Array.from({ length: 6 }, rate)])),
    self: Array.from({ length: 8 }, rate),
    validity: { attention: 4, infrequency: [2, 2] as [number, number] },
  } as unknown as AssessmentInput;
}

describe('round20: therapist summary for a profile without a third coping protector', () => {
  it('a summary built from an in-session scored profile is refused by Firestore when copingStack.l3 is undefined', async () => {
    let scored = null as ReturnType<typeof scoreProfile> | null;
    for (let seed = 1; seed < 5000 && !scored; seed++) {
      const candidate = scoreProfile(inputFrom(seed));
      if (candidate.copingStack.l3 === undefined) scored = candidate;
    }
    expect(scored, 'a probe input with no third coping protector').not.toBeNull();

    // The same object the app keeps in memory after scoring (clinical: score), before any JSON save or reload.
    const summary = therapistSummaryFor({ clinical: scored }, { done: 0, skipped: 0 });
    expect(summary).not.toBeNull();
    // The summary must hold no undefined field value, whichever protector is missing.
    expect(Object.values(summary!.copingStack)).not.toContain(undefined);

    // The write createTherapistLink() performs, with the default Firestore settings the app uses (no ignoreUndefinedProperties).
    const db = initializeFirestore(initializeApp({ projectId: 'round20-probe', apiKey: 'x' }, 'round20'), { experimentalAutoDetectLongPolling: true });
    // Validation runs before any network call: a refusal rejects at once, while an accepted write stays pending offline.
    const outcome = await Promise.race([
      Promise.resolve().then(() => setDoc(doc(db, 'therapistLinks', 'ABCDEFGH23'), { clientUid: 'uid', createdAt: '2026-10-26T00:00:00.000Z', summary }))
        .then(() => 'accepted', (caught) => `refused: ${String(caught)}`),
      new Promise<string>((resolve) => setTimeout(() => resolve('accepted (still pending offline)'), 1500)),
    ]);
    expect(outcome).not.toMatch(/Unsupported field value/);
  });

  it('control: the same profile after a JSON save and reload produces an accepted summary, and the rate of undefined l3 is measured', () => {
    let missing = 0;
    let found: ReturnType<typeof scoreProfile> | null = null;
    for (let seed = 1; seed <= 2000; seed++) {
      const candidate = scoreProfile(inputFrom(seed));
      if (candidate.copingStack.l3 === undefined) { missing += 1; found ??= candidate; }
    }
    console.info(`round20 probe: copingStack.l3 undefined in ${missing} of 2000 synthetic profiles`);
    expect(found).not.toBeNull();
    const reloaded = JSON.parse(JSON.stringify({ clinical: found })) as { clinical: unknown };
    const summary = therapistSummaryFor(reloaded, { done: 0, skipped: 0 });
    expect(summary).not.toBeNull();
    expect('l3' in (summary!.copingStack as object)).toBe(false);
  });
});
