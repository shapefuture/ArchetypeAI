import React, { useEffect, useRef } from 'react';

/** Shared keyboard lifecycle for sheets and overlays, including lazy-loaded content. */
export function ModalLayer({ children, label, onClose }) {
  const root = useRef(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement;
    const node = root.current;
    const focusable = () => [...node.querySelectorAll('button, input, select, textarea, a[href], [tabindex="0"]')]
      .filter((element) => !element.disabled && element.getClientRects().length > 0);
    const focus = () => { if (!node.contains(document.activeElement)) (focusable()[0] ?? node).focus(); };
    focus();
    const observer = new MutationObserver(focus);
    observer.observe(node, { childList: true, subtree: true });
    const keydown = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close.current(); }
      if (event.key !== 'Tab') return;
      const items = focusable();
      const first = items[0] ?? node;
      const last = items.at(-1) ?? node;
      if (event.shiftKey && (document.activeElement === first || document.activeElement === node)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    node.addEventListener('keydown', keydown);
    return () => { observer.disconnect(); node.removeEventListener('keydown', keydown); if (previous?.isConnected) previous.focus(); };
  }, []);
  return <div ref={root} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} className="modal-layer">{children}</div>;
}
