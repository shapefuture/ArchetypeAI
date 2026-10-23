import React, { useEffect, useRef, useState } from 'react';

/**
 * Watches for another tab changing an assessment draft (docs/80-20-plan.md §9.2
 * step 9: resolve conflicting drafts explicitly). Browsers fire `storage` only in
 * the other tabs, never in the tab that wrote, so every event here is external.
 *
 * `parse(raw)` returns the other tab's draft or null when it is unreadable, and
 * `isSame(draft)` says whether it matches what this tab already holds, so a tab
 * that only moved its cursor does not interrupt. `parse` should be stable;
 * `isSame` may change every render.
 *
 * Returns the pending conflict and a function that clears it:
 *   { kind: 'changed', draft } | { kind: 'unreadable' } | { kind: 'removed' } | null
 */
export function useOtherTabDraft(key, parse, isSame) {
  const [conflict, setConflict] = useState(null);
  const isSameRef = useRef(isSame);
  isSameRef.current = isSame;
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== null && event.key !== key) return;
      if (event.key === null || event.newValue === null) {
        setConflict({ kind: 'removed' });
        return;
      }
      const draft = parse(event.newValue);
      if (draft === null) setConflict({ kind: 'unreadable' });
      else if (!isSameRef.current(draft)) setConflict({ kind: 'changed', draft });
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key, parse]);
  return [conflict, () => setConflict(null)];
}

/** The choice shown while a conflict is pending. "Use theirs" is offered only for a readable draft. */
export function DraftConflictNotice({ ui, conflict, onUseTheirs, onKeepMine }) {
  if (!conflict) return null;
  return (
    <div className="card flat mt12" role="alert" style={{ borderColor: 'var(--accent)' }}>
      <b>{ui.conflictTitle}</b>
      <p className="sub mt8">{conflict.kind === 'changed' ? ui.conflictBody : ui.conflictGoneBody}</p>
      {conflict.kind === 'changed' && <button className="btn block mt8" onClick={onUseTheirs}>{ui.conflictUseTheirs}</button>}
      <button className="btn primary block mt8" onClick={onKeepMine}>{ui.conflictKeepMine}</button>
    </div>
  );
}
