// UI gate for therapist access to client maps. Pure: no storage, no network, no Firestore.
//
// This module decides what the therapist screen may DRAW. It is NOT the security boundary.
// Access is enforced on the server by firestore.rules (therapistClients and clientShares,
// gated by hasActiveAppointment / hasValidInviteLink). A client who edits this bundle can
// bypass the check; the rules must still refuse the read.
import { decideAccess, type AccessDecision, type AccessRequest, type LinkState, type Relationship } from './therapist-access';

/** The fields of a therapist roster entry (core/therapist-link.ts LinkedClient) that this gate reads. */
export interface RosterClientLike {
  clientUid: string;
  archived: boolean;
  /** Non-null only when the client shared a summary (the invite path). */
  summary: unknown | null;
}

export type ClientMapDenialReason = Extract<AccessDecision, { allowed: false }>['reason'];

/**
 * Map a roster entry to a relationship for decideAccess.
 *
 * - linked:   the roster entry exists and is not archived.
 * - archived: the therapist archived the client (therapist-link.ts `archived`).
 * - revoked:  therapist-link.ts has no revoked flag today. A revoked roster entry drops
 *             out of linkedClients(), so callers pass `client = null` and get
 *             'no-relationship'. The `revoked` option exists for a caller that has an
 *             explicit revoked signal.
 *
 * Report grant: the client shares a map by sending a summary with the invite. A booking
 * alone shares none, so `summary` non-null maps to report=true. The therapist's client-map
 * path does not read the booking grant, so `booking` stays false here.
 */
export function relationshipFor(
  therapistUid: string,
  client: RosterClientLike | null,
  options: { revoked?: boolean } = {},
): Relationship | null {
  if (!client || !client.clientUid) return null;
  const state: LinkState = options.revoked ? 'revoked' : client.archived ? 'archived' : 'linked';
  return {
    therapistUid,
    clientUid: client.clientUid,
    state,
    grants: { booking: false, report: client.summary !== null && client.summary !== undefined },
  };
}

/** Build the decideAccess request for "may this signed-in therapist read this client's map?". */
export function clientMapRequest(input: {
  therapistUid: string;
  actorUid: string;
  client: RosterClientLike | null;
  revoked?: boolean;
}): AccessRequest {
  return {
    actorUid: input.actorUid,
    actorRole: 'therapist',
    action: 'read-client-map',
    relationship: relationshipFor(input.therapistUid, input.client, { revoked: input.revoked }),
  };
}

/** Decide one client-map read. Deny by default, as decideAccess does. */
export function decideClientMap(input: {
  therapistUid: string;
  actorUid: string;
  client: RosterClientLike | null;
  revoked?: boolean;
}): AccessDecision {
  return decideAccess(clientMapRequest(input));
}

/**
 * Keep the appointments the therapist can act on. A pending request is always kept, whatever the client's roster state:
 * it holds the slot until it is approved or declined, so hiding it would leave the slot locked with no way to decide.
 * Other appointments are kept only for a linked, non-archived roster entry. Educated guess: a booking needs the link,
 * not a shared report, so a booking-only client still shows, while archived and unknown clients are hidden. Order is
 * preserved. UI gate only; the rules remain the boundary.
 */
export function visibleAppointments<T extends { clientUid: string; status?: string }>(
  appointments: readonly T[],
  clients: readonly RosterClientLike[],
): T[] {
  const linked = new Set(clients.filter((client) => !client.archived).map((client) => client.clientUid));
  return appointments.filter((appointment) => appointment.status === 'pending' || linked.has(appointment.clientUid));
}

/** Keep only the roster entries whose map this therapist may read. Order is preserved. */
export function readableClientMaps<T extends RosterClientLike>(
  therapistUid: string,
  actorUid: string,
  clients: readonly T[],
): T[] {
  return clients.filter((client) => decideClientMap({ therapistUid, actorUid, client }).allowed);
}
