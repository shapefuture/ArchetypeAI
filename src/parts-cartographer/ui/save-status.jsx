import React from 'react';

/**
 * Save acknowledgement for an assessment draft (docs/80-20-plan.md §9.2 step 6).
 * `save` is { status: 'idle' | 'saved' } or { status: 'failed', reason }. "Saved"
 * appears only after the store read the draft back; a failure names its cause and
 * offers a retry. `ui` supplies `saved`, `saveFailed[reason]` and `saveRetry`.
 */
export function SaveStatus({ ui, save, onRetry }) {
  if (save.status === 'saved') return <p className="faint center mt8" role="status" style={{ fontSize: 12 }}>{ui.saved}</p>;
  if (save.status !== 'failed') return null;
  return (
    <div className="card flat mt12" role="alert" style={{ borderColor: 'var(--accent)' }}>
      <p className="sub">{ui.saveFailed[save.reason] ?? ui.saveFailed.unavailable}</p>
      <button className="btn block mt8" onClick={onRetry}>{ui.saveRetry}</button>
    </div>
  );
}
