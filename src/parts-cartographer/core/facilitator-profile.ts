// Checked save for a facilitator or therapist profile statement. Pure: the caller supplies the
// save function, so nothing here writes to storage or the network.
//
// No profile-statement save exists in the app yet. The therapists document accepts only
// `email` and `availability` (firestore.rules), so a statement needs a data-model decision
// before any call site exists. Call saveCheckedFacilitatorStatement at that site.
import { validateFacilitatorProfile, type FacilitatorProfile } from './facilitated-boundaries';

export const STATEMENT_MAX_CHARS = 600;

/**
 * Narrow efficacy or validation claims. A basic guard on the product rule "no clinical efficacy
 * or validated/proven claims". It is not a certification of any statement.
 */
const EFFICACY_CLAIMS: RegExp[] = [
  /\bclinically\s+(proven|validated|tested)\b/i,
  /\bproven\s+to\s+(work|heal|cure|help)\b/i,
  /\bguarantee[sd]?\s+(results?|outcomes?|cure|recovery)\b/i,
  /клинически\s+(доказ|провер|подтвержд)/i,
  /доказанн\S*\s+(эффект|метод|результат)/i,
  /гарантир\S*\s+(результат|излеч|исцел)/i,
];

export type StatementRefusal =
  | 'empty-name'
  | 'empty-statement'
  | 'statement-too-long'
  | 'efficacy-claim'
  | 'app-credential'
  | 'ranking-field'
  | 'pressure-field';

export type StatementCheck =
  | { ok: true; profile: FacilitatorProfile }
  | { ok: false; reason: StatementRefusal };

/**
 * Check a draft before it is saved. Only the three profile fields are returned. Any extra
 * field is still checked for ranking or pressure fields, and then dropped.
 */
export function checkFacilitatorStatement(draft: FacilitatorProfile & Record<string, unknown>): StatementCheck {
  const name = typeof draft.name === 'string' ? draft.name.trim() : '';
  const statement = typeof draft.statement === 'string' ? draft.statement.trim() : '';
  if (!name) return { ok: false, reason: 'empty-name' };
  if (!statement) return { ok: false, reason: 'empty-statement' };
  if (statement.length > STATEMENT_MAX_CHARS) return { ok: false, reason: 'statement-too-long' };
  if (EFFICACY_CLAIMS.some((pattern) => pattern.test(statement))) return { ok: false, reason: 'efficacy-claim' };
  const verdict = validateFacilitatorProfile({ ...draft, name, statement });
  if (verdict.ok === false) return { ok: false, reason: verdict.reason };
  return { ok: true, profile: { name, statement, qualificationProvidedBy: draft.qualificationProvidedBy } };
}

/** Validate first. Call `save` only when the draft passes, and never on refusal. */
export async function saveCheckedFacilitatorStatement(
  draft: FacilitatorProfile & Record<string, unknown>,
  save: (profile: FacilitatorProfile) => Promise<void>,
): Promise<StatementCheck> {
  const check = checkFacilitatorStatement(draft);
  if (!check.ok) return check;
  await save(check.profile);
  return check;
}
