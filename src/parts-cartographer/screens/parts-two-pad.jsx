import React, { useRef } from 'react';

const clamp = (value) => Math.max(-1, Math.min(1, value));
const round = (value) => Math.round(value * 100) / 100;

/**
 * Two-axis placement pad for Assessment 2.0 (plan §4 stage 6). Drag, or use the arrow keys (Shift for larger steps).
 * x and y are both in [−1, 1]. The depth slider next to it is the third axis. Pure presentation; the parent owns state.
 */
export function PlacementPad({ label, x, y, xLabels, yLabels, onChange }) {
  const ref = useRef(null);
  const fromPointer = (event) => {
    const rect = ref.current.getBoundingClientRect();
    onChange({
      x: round(clamp(((event.clientX - rect.left) / rect.width) * 2 - 1)),
      y: round(clamp(1 - ((event.clientY - rect.top) / rect.height) * 2)),
    });
  };
  const onKeyDown = (event) => {
    const step = event.shiftKey ? 0.2 : 0.05;
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    onChange({ x: round(clamp(x + move[0])), y: round(clamp(y + move[1])) });
  };
  return (
    <div className="p2-pad-wrap">
      <div
        ref={ref}
        className="p2-pad"
        role="application"
        aria-label={label}
        tabIndex={0}
        onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); fromPointer(event); }}
        onPointerMove={(event) => { if (event.buttons) fromPointer(event); }}
        onKeyDown={onKeyDown}
      >
        <span className="p2-pad-dot" style={{ left: `${(x + 1) * 50}%`, bottom: `${(y + 1) * 50}%` }} aria-hidden="true" />
        <span className="p2-pad-label p2-pad-label-top">{yLabels[1]}</span>
        <span className="p2-pad-label p2-pad-label-bottom">{yLabels[0]}</span>
        <span className="p2-pad-label p2-pad-label-left">{xLabels[0]}</span>
        <span className="p2-pad-label p2-pad-label-right">{xLabels[1]}</span>
      </div>
    </div>
  );
}

export function DepthSlider({ label, value, lowLabel, highLabel, onChange }) {
  return (
    <label className="p2-depth">
      <span className="p2-depth-name">{label}</span>
      <span className="p2-depth-end">{lowLabel}</span>
      <input
        type="range"
        min="-1"
        max="1"
        step="0.05"
        value={value}
        aria-label={label}
        onChange={(event) => onChange(round(Number(event.target.value)))}
      />
      <span className="p2-depth-end">{highLabel}</span>
    </label>
  );
}
