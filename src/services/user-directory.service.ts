import { Injectable, inject } from '@angular/core';
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { getFirestoreDb } from '../environments/firebase-init';
import { AUTH_PORT, User } from '../app/core/ports/auth.port';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, filter } from 'rxjs/operators';

/**
 * Minimal projection of a `publicProfiles/{uid}` document. The directory
 * stores ONLY the email + displayName — no assessment data, no PII — so
 * the admin's "Add client" form can resolve a UID <-> email pair without
 * exposing the rest of the user's data.
 */
export interface PublicUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
}

/**
 * Public user directory service.
 *
 * Owns two responsibilities:
 *
 *  1. **Profile sync**: on every non-anonymous auth state change, write
 *     a `publicProfiles/{uid}` document so the admin's "Add client" form
 *     can resolve this user later. Writes are idempotent (setDoc with
 *     merge) and best-effort (a write failure is silently logged — it
 *     must never break the auth flow).
 *
 *  2. **Lookup**: `lookupByEmail(email)` and `lookupByUid(uid)` resolve
 *     a profile from the directory. The by-UID read is a single-doc
 *     fetch (indexless). The by-email read is a `where` query — the
 *     Firestore SDK auto-manages the single-field index for it, so
 *     no entry in `firestore.indexes.json` is required.
 *
 * Results are cached in-memory for 5 minutes to avoid hammering Firestore
 * on every keystroke in the cabinet's "Add client" form.
 *
 * Privacy: the directory is readable by any signed-in user. This is the
 * same information a user implicitly shares when an admin types their
 * email into the form. Hardening to admins-only would require gating
 * reads on a Firebase custom claim, which needs the Admin SDK on a
 * server we don't have yet.
 */
@Injectable({ providedIn: 'root' })
export class UserDirectoryService {
  private readonly db = getFirestoreDb();
  private readonly auth = inject(AUTH_PORT);

  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Cache key → { result, expiresAt }. The result is `null` for a
   * confirmed "not found" lookup (we still cache it, with the same
   * TTL, so repeated lookups of the same missing value don't hit
   * Firestore). Keys are namespaced: `uid:<uid>` or `email:<email>`.
   */
  private readonly cache = new Map<string, { result: PublicUserProfile | null; expiresAt: number }>();

  private readonly profileWrites$ = new Subject<User>();
  private syncSubscription: Subscription | null = null;

  constructor() {
    // Sync the user's own public profile whenever they sign in (non-anon
    // only — anonymous users have no email to publish). Debounce 500ms to
    // coalesce rapid auth state changes (e.g. Google redirect → signIn →
    // onAuthStateChanged inside the same microtask burst).
    this.syncSubscription = this.profileWrites$
      .pipe(debounceTime(500))
      .subscribe(user => {
        this.writeMyProfile(user).catch(err => {
          console.warn('[UserDirectory] Profile sync failed (best-effort):', err);
        });
      });

    this.auth.user$
      .pipe(filter((u): u is User => !!u && !u.isAnonymous))
      .subscribe(user => {
        // Invalidate the cache for THIS user (so a freshly-updated
        // email becomes visible immediately) but keep entries for
        // everyone else.
        this.cache.delete(`uid:${user.uid}`);
        if (user.email) this.cache.delete(`email:${user.email.toLowerCase()}`);
        this.profileWrites$.next(user);
      });
  }

  /**
   * Write or update the current user's public profile doc.
   * Idempotent: uses `setDoc` with `merge: true` so concurrent updates
   * from rapid sign-ins don't overwrite unrelated fields.
   */
  async writeMyProfile(user: User): Promise<void> {
    const now = new Date().toISOString();
    const profile = {
      emailLower: (user.email || '').toLowerCase(),
      email: user.email || null,
      displayName: user.displayName || null,
      updatedAt: now,
    };
    await setDoc(doc(this.db, 'publicProfiles', user.uid), profile, { merge: true });
  }

  /**
   * Resolve a profile by user ID. Returns null if no profile exists
   * (the user has never signed in with a non-anonymous provider) or
   * if the input is empty.
   */
  async lookupByUid(uid: string): Promise<PublicUserProfile | null> {
    const trimmed = (uid || '').trim();
    if (!trimmed) return null;

    const cached = this.readCache(`uid:${trimmed}`);
    if (cached !== undefined) return cached;

    const snap = await getDoc(doc(this.db, 'publicProfiles', trimmed));
    if (!snap.exists()) {
      this.writeCache(`uid:${trimmed}`, null);
      return null;
    }
    const data = snap.data() as { email?: string | null; displayName?: string | null };
    const profile: PublicUserProfile = {
      uid: snap.id,
      email: data.email ?? null,
      displayName: data.displayName ?? null,
    };
    this.writeCache(`uid:${trimmed}`, profile);
    return profile;
  }

  /**
   * Resolve a profile by email. Email comparison is case-insensitive
   * (we store and query the lowercased form). Returns null if no
   * matching profile exists or the input is empty.
   *
   * Note: this issues a `where('emailLower', '==', email)` query. The
   * Firestore SDK auto-manages single-field indexes for equality /
   * inequality filters, so no entry in `firestore.indexes.json` is
   * required for this lookup. (Composite or array-contains indexes
   * WOULD need a declaration — this is a single-field where, so it's
   * free.)
   */
  async lookupByEmail(email: string): Promise<PublicUserProfile | null> {
    const normalized = (email || '').trim().toLowerCase();
    if (!normalized) return null;

    const cached = this.readCache(`email:${normalized}`);
    if (cached !== undefined) return cached;

    const q = query(
      collection(this.db, 'publicProfiles'),
      where('emailLower', '==', normalized),
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      this.writeCache(`email:${normalized}`, null);
      return null;
    }
    const first = snap.docs[0];
    const data = first.data() as { email?: string | null; displayName?: string | null };
    const profile: PublicUserProfile = {
      uid: first.id,
      email: data.email ?? null,
      displayName: data.displayName ?? null,
    };
    this.writeCache(`email:${normalized}`, profile);
    return profile;
  }

  /**
   * Drop all cached lookups. Useful after a sign-out / sign-in to make
   * sure stale results don't leak across sessions.
   */
  clearCache(): void {
    this.cache.clear();
  }

  private readCache(key: string): PublicUserProfile | null | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.result;
  }

  private writeCache(key: string, result: PublicUserProfile | null): void {
    this.cache.set(key, { result, expiresAt: Date.now() + this.CACHE_TTL_MS });
  }
}
