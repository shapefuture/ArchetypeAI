// One-shot focus hand-off between screens. A route entry asks for a target before
// navigating; the destination takes the request once, on mount, and moves focus
// there. A request that no screen takes is replaced by the next one.

let pending: string | null = null;

export function requestFocus(target: string): void {
  pending = target;
}

/** True once for a matching request, which it clears. */
export function takeFocusRequest(target: string): boolean {
  if (pending !== target) return false;
  pending = null;
  return true;
}
