// Decorative ambience (the 3D universe loop and idle/float character motion) rests while the
// page is hidden, while text is being entered, or while an error is being handled. Task content
// never depends on this gate: it only decides whether decoration keeps moving.

export type AmbienceSignal = 'hidden' | 'typing' | 'error';
export type AmbienceSignals = Record<AmbienceSignal, boolean>;
export type AmbienceListener = (active: boolean) => void;

const NON_TEXT_INPUT_TYPES = new Set(['button', 'checkbox', 'color', 'file', 'hidden', 'image', 'radio', 'range', 'reset', 'submit']);

export function ambienceSuspended(signals: AmbienceSignals): boolean {
  return signals.hidden || signals.typing || signals.error;
}

/** True for elements that accept typed text (duck-typed so it also works outside a browser). */
export function isTextEntry(target: unknown): boolean {
  if (!target || typeof target !== 'object') return false;
  const element = target as { tagName?: unknown; type?: unknown; isContentEditable?: unknown };
  if (element.isContentEditable === true) return true;
  const tag = typeof element.tagName === 'string' ? element.tagName.toUpperCase() : '';
  if (tag === 'TEXTAREA') return true;
  if (tag !== 'INPUT') return false;
  const type = typeof element.type === 'string' ? element.type.toLowerCase() : 'text';
  return !NON_TEXT_INPUT_TYPES.has(type);
}

export function createAmbienceGate(initial: Partial<AmbienceSignals> = {}) {
  const listeners = new Set<AmbienceListener>();
  let signals: AmbienceSignals = { hidden: false, typing: false, error: false, ...initial };

  return {
    get active(): boolean {
      return !ambienceSuspended(signals);
    },
    set(signal: AmbienceSignal, value: boolean): void {
      if (signals[signal] === value) return;
      const before = !ambienceSuspended(signals);
      signals = { ...signals, [signal]: value };
      const after = !ambienceSuspended(signals);
      if (after !== before) listeners.forEach((listener) => listener(after));
    },
    subscribe(listener: AmbienceListener): () => void {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
  };
}

export type AmbienceGate = ReturnType<typeof createAmbienceGate>;

/** The app-wide gate shared by the shell (CSS ambience) and the universe renderer. */
export const ambience: AmbienceGate = createAmbienceGate();

/** Feeds page visibility and focus-in-text-field into a gate. Returns the disposer. */
export function bindAmbienceSignals(doc: Document, gate: AmbienceGate = ambience): () => void {
  const syncHidden = () => gate.set('hidden', doc.hidden);
  const syncTyping = (target: unknown) => gate.set('typing', isTextEntry(target));
  const onFocusIn = (event: FocusEvent) => syncTyping(event.target);
  const onFocusOut = (event: FocusEvent) => syncTyping(event.relatedTarget);
  // A focused field that was removed from the DOM may not emit focusout; the next pointer press re-reads focus.
  const onPointerDown = () => syncTyping(doc.activeElement);

  syncHidden();
  doc.addEventListener('visibilitychange', syncHidden);
  doc.addEventListener('focusin', onFocusIn);
  doc.addEventListener('focusout', onFocusOut);
  doc.addEventListener('pointerdown', onPointerDown, true);
  return () => {
    doc.removeEventListener('visibilitychange', syncHidden);
    doc.removeEventListener('focusin', onFocusIn);
    doc.removeEventListener('focusout', onFocusOut);
    doc.removeEventListener('pointerdown', onPointerDown, true);
  };
}
