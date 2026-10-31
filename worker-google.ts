// Google access for the reminder sender (plan §3.9): a service-account token, then Firestore REST and FCM HTTP v1.
// These are thin wrappers over fetch, so the sweep tests replace the network with a fake. Response bodies are never
// logged: they can echo a person's tokens and document fields, so only status codes reach the Worker log.
import { importPKCS8, SignJWT } from 'jose';
import type { PushMessage } from './worker-reminders';

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface ServiceAccount {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

export interface GoogleSession {
  projectId: string;
  accessToken: string;
  fetchImpl: FetchLike;
}

export interface FirestoreDocument {
  name: string;
  /** Decoded into plain values. */
  fields: Record<string, unknown>;
  updateTime: string;
}

export interface Filter {
  field: string;
  op: 'EQUAL' | 'LESS_THAN_OR_EQUAL';
  value: string | number;
}

export type PushResult = 'sent' | 'unregistered' | 'failed';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPES = [
  'https://www.googleapis.com/auth/datastore',
  'https://www.googleapis.com/auth/firebase.messaging',
];
const FIRESTORE_ROOT = 'https://firestore.googleapis.com/v1';
const FCM_ROOT = 'https://fcm.googleapis.com/v1';

export function parseServiceAccount(raw: string | undefined): ServiceAccount | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const value = parsed as Record<string, unknown>;
  const projectId = value.project_id;
  const clientEmail = value.client_email;
  const privateKey = value.private_key;
  if (typeof projectId !== 'string' || typeof clientEmail !== 'string' || typeof privateKey !== 'string') return null;
  return { projectId, clientEmail, privateKey };
}

/** Signs a JWT with the service-account key and exchanges it for a one-hour access token. Nothing is cached. */
export async function openSession(account: ServiceAccount, fetchImpl: FetchLike, nowMs: number): Promise<GoogleSession> {
  const issuedAt = Math.floor(nowMs / 1000);
  const key = await importPKCS8(account.privateKey, 'RS256');
  const assertion = await new SignJWT({ scope: SCOPES.join(' ') })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(account.clientEmail)
    .setSubject(account.clientEmail)
    .setAudience(TOKEN_URL)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + 3600)
    .sign(key);
  const response = await fetchImpl(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  });
  if (!response.ok) throw new Error(`Google token request failed: ${response.status}`);
  const data = (await response.json()) as { access_token?: unknown };
  if (typeof data.access_token !== 'string') throw new Error('Google token response had no access token');
  return { projectId: account.projectId, accessToken: data.access_token, fetchImpl };
}

type RestValue = Record<string, unknown>;

function encodeScalar(value: string | number | boolean | null): RestValue {
  if (value === null) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (!Number.isInteger(value)) throw new Error('Only integers are written as numbers');
  return { integerValue: String(value) };
}

function decodeValue(value: unknown): unknown {
  if (!value || typeof value !== 'object') return undefined;
  const rest = value as RestValue;
  if ('stringValue' in rest) return rest.stringValue;
  if ('integerValue' in rest) return Number(rest.integerValue);
  if ('doubleValue' in rest) return rest.doubleValue;
  if ('booleanValue' in rest) return rest.booleanValue;
  if ('nullValue' in rest) return null;
  if ('timestampValue' in rest) return rest.timestampValue;
  if ('mapValue' in rest) {
    const map = rest.mapValue as { fields?: Record<string, unknown> } | undefined;
    return decodeFields(map?.fields);
  }
  return undefined;
}

function decodeFields(fields: Record<string, unknown> | undefined): Record<string, unknown> {
  const decoded: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields ?? {})) decoded[key] = decodeValue(value);
  return decoded;
}

function documentsRoot(session: GoogleSession): string {
  return `${FIRESTORE_ROOT}/projects/${session.projectId}/databases/(default)/documents`;
}

function send(session: GoogleSession, url: string, method: string, body?: unknown): Promise<Response> {
  return session.fetchImpl(url, {
    method,
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** One filtered query on a collection. Rows without a document (Firestore's empty-result markers) are dropped. */
export async function queryDocuments(
  session: GoogleSession,
  collection: string,
  filter: Filter,
  limit: number,
  orderBy?: string,
): Promise<FirestoreDocument[]> {
  const structuredQuery: RestValue = {
    from: [{ collectionId: collection }],
    where: {
      fieldFilter: {
        field: { fieldPath: filter.field },
        op: filter.op,
        value: encodeScalar(filter.value),
      },
    },
    limit,
  };
  if (orderBy) structuredQuery.orderBy = [{ field: { fieldPath: orderBy }, direction: 'ASCENDING' }];
  const response = await send(session, `${documentsRoot(session)}:runQuery`, 'POST', { structuredQuery });
  if (!response.ok) throw new Error(`Firestore query on ${collection} failed: ${response.status}`);
  const rows = (await response.json()) as Array<{ document?: { name?: unknown; fields?: Record<string, unknown>; updateTime?: unknown } }>;
  const documents: FirestoreDocument[] = [];
  for (const row of rows) {
    const document = row.document;
    if (!document || typeof document.name !== 'string' || typeof document.updateTime !== 'string') continue;
    documents.push({ name: document.name, fields: decodeFields(document.fields), updateTime: document.updateTime });
  }
  return documents;
}

/**
 * Writes the named fields only, and only while the document is still at the version that was read. A false result means
 * someone else changed the document first, and the caller must not act on the stale read.
 */
export async function patchDocument(
  session: GoogleSession,
  path: string,
  fields: Record<string, string | number | null>,
  updateTime: string,
): Promise<boolean> {
  const params = new URLSearchParams();
  for (const name of Object.keys(fields)) params.append('updateMask.fieldPaths', name);
  params.set('currentDocument.updateTime', updateTime);
  const encoded: Record<string, RestValue> = {};
  for (const [name, value] of Object.entries(fields)) encoded[name] = encodeScalar(value);
  const response = await send(session, `${documentsRoot(session)}/${path}?${params.toString()}`, 'PATCH', { fields: encoded });
  if (!response.ok) console.error(`[reminders] Firestore write refused: ${response.status}`);
  return response.ok;
}

export async function deleteDocument(session: GoogleSession, path: string): Promise<void> {
  const response = await send(session, `${documentsRoot(session)}/${path}`, 'DELETE');
  if (!response.ok && response.status !== 404) console.error(`[reminders] Firestore delete refused: ${response.status}`);
}

/** Sends one notification. Only a token FCM reports as UNREGISTERED is treated as dead. Other errors never prune a token. */
export async function sendPush(session: GoogleSession, token: string, message: PushMessage): Promise<PushResult> {
  const response = await send(session, `${FCM_ROOT}/projects/${session.projectId}/messages:send`, 'POST', {
    message: {
      token,
      notification: { title: message.title, body: message.body },
      webpush: { fcm_options: { link: message.link } },
    },
  });
  if (response.ok) return 'sent';
  const error = (await response.json().catch(() => null)) as { error?: { details?: Array<{ errorCode?: string }> } } | null;
  if (error?.error?.details?.some((detail) => detail.errorCode === 'UNREGISTERED')) return 'unregistered';
  console.error(`[reminders] FCM send refused: ${response.status}`);
  return 'failed';
}
