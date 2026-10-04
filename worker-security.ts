import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTVerifyGetKey,
} from 'jose';

export interface FirebaseIdentity {
  uid: string;
  email: string | null;
  emailVerified: boolean;
}

export interface RateLimiterBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export type RateLimitResult = 'allowed' | 'limited' | 'unavailable';

const FIREBASE_JWKS_URL = new URL(
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
);
let firebaseJwks: JWTVerifyGetKey | undefined;

function getFirebaseJwks(): JWTVerifyGetKey {
  firebaseJwks ??= createRemoteJWKSet(FIREBASE_JWKS_URL);
  return firebaseJwks;
}

/** Verify signature, issuer, audience, and time claims on a Firebase ID token. */
export async function verifyFirebaseIdToken(
  token: string,
  projectId: string,
  jwks: JWTVerifyGetKey = getFirebaseJwks(),
): Promise<FirebaseIdentity> {
  if (!projectId) throw new Error('Firebase project is not configured');
  if (!token || token.length > 8192) throw new Error('Invalid Firebase ID token');

  const { payload, protectedHeader } = await jwtVerify(token, jwks, {
    algorithms: ['RS256'],
    audience: projectId,
    issuer: `https://securetoken.google.com/${projectId}`,
  });

  const now = Math.floor(Date.now() / 1000);
  if (protectedHeader.alg !== 'RS256'
    || typeof payload.sub !== 'string'
    || payload.sub.length === 0
    || payload.sub.length > 128
    || !Number.isSafeInteger(payload.iat)
    || !Number.isSafeInteger(payload.exp)
    || !Number.isSafeInteger(payload.auth_time)
    || (payload.iat as number) > now + 60
    || (payload.auth_time as number) > now + 60) {
    throw new Error('Invalid Firebase ID token claims');
  }

  return {
    uid: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : null,
    emailVerified: payload.email_verified === true,
  };
}

/** Pull a bearer token from Authorization and return null for any invalid token. */
export async function authenticateFirebaseRequest(
  request: Request,
  projectId: string,
): Promise<FirebaseIdentity | null> {
  const authorization = request.headers.get('Authorization')?.trim() ?? '';
  const match = /^Bearer\s+(\S+)$/i.exec(authorization);
  if (!match) return null;
  try {
    return await verifyFirebaseIdToken(match[1], projectId);
  } catch {
    // Never return JWT/JWKS errors to clients or logs; callers emit one generic 401.
    return null;
  }
}

export const DEFAULT_ALLOWED_APP_ORIGINS = [
  'https://archetype-ai-3e43b.web.app',
  'https://archetype-ai-3e43b.firebaseapp.com',
  'https://innerverseai.web.app',
  'https://innerverseai.firebaseapp.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:4174',
  'http://127.0.0.1:4174',
  'http://localhost:4200',
  'http://127.0.0.1:4200',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
] as const;

/** Normalize a URL only when it represents an origin, not an arbitrary redirect URL. */
export function normalizeAppOrigin(value: string | null | undefined): string | null {
  if (!value || value.length > 512) return null;
  try {
    const url = new URL(value.trim());
    if ((url.protocol !== 'https:' && url.protocol !== 'http:')
      || url.username
      || url.password
      || url.pathname !== '/'
      || url.search
      || url.hash) return null;
    return url.origin;
  } catch {
    return null;
  }
}

function configuredOrigins(configured?: string): Set<string> {
  const values = configured
    ? configured.split(',')
    : [...DEFAULT_ALLOWED_APP_ORIGINS];
  return new Set(values.map((value) => normalizeAppOrigin(value)).filter((value): value is string => !!value));
}

export function isAllowedAppOrigin(value: string | null | undefined, configured?: string): boolean {
  const normalized = normalizeAppOrigin(value);
  return normalized !== null && configuredOrigins(configured).has(normalized);
}

/** Strictly resolve the Stripe return origin against the server-side allowlist. */
export function getAllowedStripeReturnOrigin(
  bodyOrigin: string | null | undefined,
  requestOrigin: string | null | undefined,
  configured?: string,
): string | null {
  const candidate = bodyOrigin ?? requestOrigin;
  const returnOrigin = normalizeAppOrigin(candidate);
  if (!returnOrigin || !isAllowedAppOrigin(returnOrigin, configured)) return null;

  // A browser caller may not nominate a different allowlisted site than the
  // one that initiated checkout. Server-to-server callers without Origin may
  // still supply one of the explicitly configured origins.
  if (requestOrigin) {
    const normalizedRequestOrigin = normalizeAppOrigin(requestOrigin);
    if (!normalizedRequestOrigin
      || normalizedRequestOrigin !== returnOrigin
      || !isAllowedAppOrigin(normalizedRequestOrigin, configured)) return null;
  }
  return returnOrigin;
}

/** CORS headers never reflect an untrusted Origin and are cache-partitioned. */
export function corsHeaders(request: Request, configured?: string): Record<string, string> {
  const requestOrigin = request.headers.get('Origin');
  const allowedOrigin = requestOrigin && isAllowedAppOrigin(requestOrigin, configured)
    ? normalizeAppOrigin(requestOrigin)
    : null;
  return {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
    ...(allowedOrigin ? { 'Access-Control-Allow-Origin': allowedOrigin } : {}),
  };
}

/** Fail-closed wrapper around Cloudflare's Workers Rate Limiting binding. */
export async function checkRateLimit(
  binding: RateLimiterBinding | undefined,
  key: string,
): Promise<RateLimitResult> {
  if (!binding) return 'unavailable';
  try {
    const result = await binding.limit({ key });
    return result.success ? 'allowed' : 'limited';
  } catch {
    return 'unavailable';
  }
}
