import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Regression guard for `firestore.rules` — the "My clients" specialist
 * dashboard.
 *
 * The bug: when a signed-in admin (user in `adminAllowlist/{email}`) opened
 * their cabinet and tried to load their "My clients" list, Firestore
 * returned "Missing or insufficient permissions" on the very first read of
 * the `adminClients` collection. The root cause: `firestore.rules` had no
 * `match /adminClients/{...}` block, so every access was denied by default.
 *
 * A second, related issue: even if the `adminClients` read succeeded, the
 * cross-user read of `users/{clientUid}/assessment/current` (which powers
 * the per-client "Last assessment" row) was blocked because
 * `/users/{uid}/assessment` is owner-only.
 *
 * The fix: a `match /adminClients/{docId}` block restricted to the admin
 * whose UID is the docId prefix, AND an extra read-path on
 * `/users/{userId}/assessment/{docId}` and `/users/{userId}/history/{docId}`
 * gated on the existence of an `adminClients/{adminUid}_{clientUid}` doc.
 *
 * These tests pin the rules structure so a future refactor can't silently
 * drop the new permissions. They are file-content checks — no TestBed, no
 * Firebase emulator — and they run as part of `npm test`.
 */

const RULES_PATH = resolve(__dirname, 'firestore.rules');
const rules = readFileSync(RULES_PATH, 'utf-8');

describe('firestore.rules — specialist client dashboard', () => {
  it('declares a `match /adminClients/{docId}` block', () => {
    // The collection must be matched at all — without this, every read
    // and write to `adminClients/*` is denied by the default-deny policy.
    expect(rules).toMatch(/match\s+\/adminClients\/\{docId\}\s*\{/);
  });

  it('adminClients rule splits read/create/update/delete and gates each on `adminUid`', () => {
    // The previous bug: a single `allow read, write: if resource.data.adminUid == ...`
    // failed on `create` because `resource` is null for new docs. Firestore
    // returned "Missing or insufficient permissions" with no useful diagnostic
    // (the field is silently treated as null/undefined, making the condition
    // false). The fix splits writes into create/update/delete and uses
    // `request.resource.data` on create (where `resource` is null).
    //
    // We also pin the read rule's field-based shape (not docId-based) for the
    // same `list`-query reason: a rule that depends on `docId.matches(...)`
    // can't be evaluated for a `getDocs(collection(...))` query with no
    // `where` clause.
    const block = rules.match(/match\s+\/adminClients\/\{docId\}\s*\{([\s\S]*?)\n\s+\}/);
    expect(block).not.toBeNull();
    const body = block![1];

    // Read: field-based ownership check on the existing doc(s).
    expect(body).toMatch(/allow\s+read:\s*if\s+isSignedIn\(\)\s*&&\s*resource\.data\.adminUid\s*==\s*request\.auth\.uid/);

    // Create: must check the doc BEING WRITTEN, not the existing doc (which
    // is null). This is the actual regression — without this line, the
    // "Add client" form fails with permissions error.
    expect(body).toMatch(/allow\s+create:\s*if\s+isSignedIn\(\)\s*&&\s*request\.resource\.data\.adminUid\s*==\s*request\.auth\.uid/);

    // Update: must verify the requester owns the EXISTING doc AND keeps
    // `adminUid` pointing at themselves in the NEW doc (prevents an admin
    // from reassigning a link to a different admin via update).
    expect(body).toMatch(/allow\s+update:\s*if\s+isSignedIn\(\)\s*&&\s*resource\.data\.adminUid\s*==\s*request\.auth\.uid[\s\S]*?request\.resource\.data\.adminUid\s*==\s*request\.auth\.uid/);

    // Delete: field-based ownership check on the doc being deleted.
    expect(body).toMatch(/allow\s+delete:\s*if\s+isSignedIn\(\)\s*&&\s*resource\.data\.adminUid\s*==\s*request\.auth\.uid/);

    // Sanity: no blanket `allow write: if ...` — that pattern would
    // re-introduce the create bug.
    expect(body).not.toMatch(/allow\s+write:\s*if/);
  });

  it('users/{userId}/assessment allows cross-user read when an adminClients link exists', () => {
    // The new read path: owner OR an admin with an adminClients link.
    const block = rules.match(/match\s+\/users\/\{userId\}[\s\S]*?match\s+\/assessment\/\{docId\}\s*\{([\s\S]*?)\n\s+\}\s*\n\s+\}/);
    expect(block).not.toBeNull();
    const body = block![1];
    // The read rule must allow read for the owner OR via an adminClients
    // link that joins the requester UID with the target userId.
    expect(body).toMatch(/allow\s+read:\s*if\s+isOwner\(userId\)[\s\S]*?\|\|[\s\S]*?exists\([\s\S]*?adminClients[\s\S]*?request\.auth\.uid[\s\S]*?userId/);
    // Writes must stay owner-only.
    expect(body).toMatch(/allow\s+write:\s*if\s+isOwner\(userId\)/);
  });

  it('users/{userId}/history allows cross-user read when an adminClients link exists', () => {
    // Same as assessment — the specialist view may also want history.
    const block = rules.match(/match\s+\/users\/\{userId\}[\s\S]*?match\s+\/history\/\{docId\}\s*\{([\s\S]*?)\n\s+\}\s*\n\s+\}/);
    expect(block).not.toBeNull();
    const body = block![1];
    expect(body).toMatch(/allow\s+read:\s*if\s+isOwner\(userId\)[\s\S]*?\|\|[\s\S]*?exists\([\s\S]*?adminClients[\s\S]*?request\.auth\.uid[\s\S]*?userId/);
    expect(body).toMatch(/allow\s+write:\s*if\s+isOwner\(userId\)/);
  });

  it('declares a `match /publicProfiles/{userId}` block for UID<->email lookup', () => {
    // The collection must be matched at all — without this, every read
    // and write to `publicProfiles/*` is denied by the default-deny policy,
    // and the admin's "Add client" form can't auto-fill email by UID
    // (or UID by email).
    expect(rules).toMatch(/match\s+\/publicProfiles\/\{userId\}\s*\{/);
  });

  it('publicProfiles allows read for any signed-in user', () => {
    // The read rule must NOT depend on `docId` — otherwise the
    // `where('emailLower', '==', email)` query used by lookupByEmail
    // would fail silently with "Missing or insufficient permissions"
    // (Firestore can't evaluate a docId-dependent rule on a list query
    // with no specific doc). The `isSignedIn()` gate is enough for the
    // MVP; real hardening would gate on a Firebase custom claim.
    const block = rules.match(/match\s+\/publicProfiles\/\{userId\}\s*\{([\s\S]*?)\n\s+\}/);
    expect(block).not.toBeNull();
    const body = block![1];
    expect(body).toMatch(/allow\s+read:\s*if\s+isSignedIn\(\)/);
  });

  it('publicProfiles allows write only for the user themselves (isOwner)', () => {
    // Prevents a malicious user from overwriting someone else's profile
    // (e.g. swapping the email on another user's doc) or impersonating
    // them in the directory.
    const block = rules.match(/match\s+\/publicProfiles\/\{userId\}\s*\{([\s\S]*?)\n\s+\}/);
    expect(block).not.toBeNull();
    const body = block![1];
    expect(body).toMatch(/allow\s+create:\s*if\s+isOwner\(userId\)/);
    expect(body).toMatch(/allow\s+update:\s*if\s+isOwner\(userId\)/);
    expect(body).toMatch(/allow\s+delete:\s*if\s+isOwner\(userId\)/);
  });
});
