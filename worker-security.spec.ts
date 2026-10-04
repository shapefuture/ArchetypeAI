import { webcrypto } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  SignJWT,
} from 'jose';
import {
  authenticateFirebaseRequest,
  checkRateLimit,
  corsHeaders,
  getAllowedStripeReturnOrigin,
  isAllowedAppOrigin,
  normalizeAppOrigin,
  verifyFirebaseIdToken,
} from './worker-security';

const PROJECT_ID = 'demo-archetypeai';
const KID = 'firebase-test-key';
const NodeCryptoKey = globalThis.CryptoKey;
let privateKey: CryptoKey;
let localJwks: ReturnType<typeof createLocalJWKSet>;

async function makeToken(overrides: Record<string, unknown> = {}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ auth_time: now, email: 'person@example.com', email_verified: true, ...overrides })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid: KID })
    .setIssuer(`https://securetoken.google.com/${PROJECT_ID}`)
    .setAudience(PROJECT_ID)
    .setSubject('firebase-user-123')
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateKey);
}

beforeAll(async () => {
  vi.stubGlobal('crypto', webcrypto);
  if (NodeCryptoKey) vi.stubGlobal('CryptoKey', NodeCryptoKey);
  const pair = await generateKeyPair('RS256');
  privateKey = pair.privateKey;
  const jwk = await exportJWK(pair.publicKey);
  localJwks = createLocalJWKSet({ keys: [{ ...jwk, kid: KID, use: 'sig', alg: 'RS256' }] });
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe('Firebase ID token verification', () => {
  it('accepts a correctly signed token only for the configured Firebase project', async () => {
    const token = await makeToken();
    await expect(verifyFirebaseIdToken(token, PROJECT_ID, localJwks)).resolves.toEqual({
      uid: 'firebase-user-123',
      email: 'person@example.com',
      emailVerified: true,
    });
    await expect(verifyFirebaseIdToken(token, 'wrong-project', localJwks)).rejects.toThrow();
  });

  it('rejects an expired token and tokens without Firebase auth_time', async () => {
    const now = Math.floor(Date.now() / 1000);
    const expired = await new SignJWT({ auth_time: now - 4000 })
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid: KID })
      .setIssuer(`https://securetoken.google.com/${PROJECT_ID}`)
      .setAudience(PROJECT_ID)
      .setSubject('firebase-user-123')
      .setIssuedAt(now - 3600)
      .setExpirationTime(now - 1)
      .sign(privateKey);
    await expect(verifyFirebaseIdToken(expired, PROJECT_ID, localJwks)).rejects.toThrow();

    const missingAuthTime = await new SignJWT({})
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid: KID })
      .setIssuer(`https://securetoken.google.com/${PROJECT_ID}`)
      .setAudience(PROJECT_ID)
      .setSubject('firebase-user-123')
      .setIssuedAt(now)
      .setExpirationTime(now + 3600)
      .sign(privateKey);
    await expect(verifyFirebaseIdToken(missingAuthTime, PROJECT_ID, localJwks)).rejects.toThrow(/claims/);
  });

  it('rejects missing or malformed Authorization headers without a network lookup', async () => {
    const noHeader = new Request('https://worker.example/api/ai');
    const badHeader = new Request('https://worker.example/api/ai', { headers: { Authorization: 'Basic abc' } });
    await expect(authenticateFirebaseRequest(noHeader, PROJECT_ID)).resolves.toBeNull();
    await expect(authenticateFirebaseRequest(badHeader, PROJECT_ID)).resolves.toBeNull();
  });
});

describe('origin validation and CORS', () => {
  const allowed = 'https://app.example.com,http://localhost:5174';

  it('normalizes only bare origins and checks exact allowlist entries', () => {
    expect(normalizeAppOrigin('https://app.example.com/')).toBe('https://app.example.com');
    expect(normalizeAppOrigin('https://app.example.com/path')).toBeNull();
    expect(normalizeAppOrigin('javascript:alert(1)')).toBeNull();
    expect(isAllowedAppOrigin('https://app.example.com', allowed)).toBe(true);
    expect(isAllowedAppOrigin('https://evil.example', allowed)).toBe(false);
  });

  it('does not reflect untrusted origins and sets Vary: Origin', () => {
    const allowedRequest = new Request('https://worker.example/api/ai', {
      headers: { Origin: 'https://app.example.com' },
    });
    const evilRequest = new Request('https://worker.example/api/ai', {
      headers: { Origin: 'https://evil.example' },
    });
    expect(corsHeaders(allowedRequest, allowed)['Access-Control-Allow-Origin']).toBe('https://app.example.com');
    expect(corsHeaders(allowedRequest, allowed)['Access-Control-Allow-Headers']).toContain('Authorization');
    expect(corsHeaders(evilRequest, allowed)['Access-Control-Allow-Origin']).toBeUndefined();
    expect(corsHeaders(evilRequest, allowed).Vary).toBe('Origin');
  });

  it('rejects Stripe return URLs that are not an exact allowlisted origin', () => {
    expect(getAllowedStripeReturnOrigin('https://evil.example', 'https://evil.example', allowed)).toBeNull();
    expect(getAllowedStripeReturnOrigin('https://app.example.com/path', 'https://app.example.com', allowed)).toBeNull();
    expect(getAllowedStripeReturnOrigin('https://app.example.com', 'https://evil.example', allowed)).toBeNull();
    expect(getAllowedStripeReturnOrigin('https://app.example.com', 'https://app.example.com', allowed)).toBe('https://app.example.com');
    expect(getAllowedStripeReturnOrigin('https://app.example.com', null, allowed)).toBe('https://app.example.com');
  });
});

describe('rate limiter wrapper', () => {
  it('fails closed and maps Cloudflare outcomes', async () => {
    await expect(checkRateLimit(undefined, 'uid:1')).resolves.toBe('unavailable');
    await expect(checkRateLimit({ limit: async () => ({ success: true }) }, 'uid:1')).resolves.toBe('allowed');
    await expect(checkRateLimit({ limit: async () => ({ success: false }) }, 'uid:1')).resolves.toBe('limited');
    await expect(checkRateLimit({ limit: async () => { throw new Error('offline'); } }, 'uid:1')).resolves.toBe('unavailable');
  });
});
