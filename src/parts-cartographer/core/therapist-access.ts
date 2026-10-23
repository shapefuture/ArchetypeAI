// Pure access decisions for the therapist–client relationship (ArchetypeAI-28h.2.20).
// No storage, no network. These rules are the client-side contract for what a request may do;
// server rules must enforce the same decisions, and this module does not replace them.

export type LinkState = 'linked' | 'revoked' | 'archived';
export type Role = 'client' | 'therapist';
export type AccessAction = 'book' | 'read-report' | 'read-client-map' | 'edit-client-map' | 'edit-therapist-profile';

export interface Relationship {
  therapistUid: string;
  clientUid: string;
  state: LinkState;
  /** Granted by the client. A booking grant never implies report access. */
  grants: { booking: boolean; report: boolean };
}

export type AccessDecision =
  | { allowed: true }
  | { allowed: false; reason: 'no-relationship' | 'wrong-account' | 'revoked' | 'archived' | 'booking-not-granted' | 'report-not-granted' | 'read-only' | 'not-owner' };

export interface AccessRequest {
  actorUid: string;
  actorRole: Role;
  action: AccessAction;
  relationship: Relationship | null;
}

const deny = (reason: Extract<AccessDecision, { allowed: false }>['reason']): AccessDecision => ({ allowed: false, reason });

/** Decides one request. Deny by default: every branch that could allow checks the account, the link and the specific grant. */
export function decideAccess(request: AccessRequest): AccessDecision {
  const { actorUid, actorRole, action, relationship } = request;

  // The therapist's own profile belongs to the therapist and is not governed by any client link.
  if (action === 'edit-therapist-profile') {
    return actorRole === 'therapist' && relationship !== null && actorUid === relationship.therapistUid
      ? { allowed: true }
      : deny('not-owner');
  }

  if (!relationship) return deny('no-relationship');
  const expectedUid = actorRole === 'client' ? relationship.clientUid : relationship.therapistUid;
  if (actorUid !== expectedUid) return deny('wrong-account');
  if (relationship.state === 'revoked') return deny('revoked');
  if (relationship.state === 'archived') return deny('archived');

  switch (action) {
    case 'book':
      return actorRole === 'client' && relationship.grants.booking ? { allowed: true } : deny('booking-not-granted');
    case 'read-report':
      // A client always reads their own report; a therapist needs the explicit report grant.
      if (actorRole === 'client') return { allowed: true };
      return relationship.grants.report ? { allowed: true } : deny('report-not-granted');
    case 'read-client-map':
      return actorRole === 'therapist' && relationship.grants.report ? { allowed: true } : deny('report-not-granted');
    case 'edit-client-map':
      // The client map is a read-only view of the client's ownership; the therapist never edits it.
      return deny('read-only');
  }
}

/** Returns a new relationship. Revocation takes effect immediately; the input is never mutated. */
export function setLinkState(relationship: Relationship, state: LinkState): Relationship {
  return { ...relationship, state };
}

/** Returns a new relationship with the client's grants changed. Only the client may change grants. */
export function setGrant(relationship: Relationship, actorRole: Role, grant: keyof Relationship['grants'], value: boolean): Relationship | null {
  if (actorRole !== 'client') return null;
  return { ...relationship, grants: { ...relationship.grants, [grant]: value } };
}
