import React, { useRef } from 'react';

const clamp = (value) => Math.max(-1, Math.min(1, value));
const round = (value) => Math.round(value * 100) / 100;

/** The axis an arrow key moves, and by how much. Other keys move nothing. */
export function padKeyMove(key, step) {
  const moves = { ArrowLeft: { x: -step }, ArrowRight: { x: step }, ArrowUp: { y: step }, ArrowDown: { y: -step } };
  return moves[key] ?? null;
}

/**
 * The axes a pointer move actually moved along, from the previous pointer position to this one. A sideways drag moves
 * x only, so y is not answered. Without a previous position (the press), both axes are answered.
 */
export function padPointerAxes(from, to) {
  if (!from) return { x: true, y: true };
  return { x: to.clientX !== from.clientX, y: to.clientY !== from.clientY };
}

/**
 * Two-axis placement pad for Assessment 2.0 (plan §4 stage 6). Drag, or use the arrow keys (Shift for larger steps).
 * x and y are both in [−1, 1]. The depth slider next to it is the third axis. Pure presentation; the parent owns state.
 */
export function PlacementPad({ label, x, y, xLabels, yLabels, onChange }) {
  const ref = useRef(null);
  const last = useRef(null);
  // Writes only the axes passed in, each read from the pointer position inside the pad.
  const answer = (event, axes) => {
    const rect = ref.current.getBoundingClientRect();
    const values = {};
    if (axes.x) values.x = round(clamp(((event.clientX - rect.left) / rect.width) * 2 - 1));
    if (axes.y) values.y = round(clamp(1 - ((event.clientY - rect.top) / rect.height) * 2));
    onChange(values);
  };
  const onPointerDown = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    last.current = { clientX: event.clientX, clientY: event.clientY };
    answer(event, { x: true, y: true }); // a press places the part, so both axes are answered
  };
  const onPointerMove = (event) => {
    if (!event.buttons || !last.current) return;
    const axes = padPointerAxes(last.current, event);
    last.current = { clientX: event.clientX, clientY: event.clientY };
    if (axes.x || axes.y) answer(event, axes);
  };
  const onPointerEnd = () => { last.current = null; };
  const onKeyDown = (event) => {
    const move = padKeyMove(event.key, event.shiftKey ? 0.2 : 0.05);
    if (!move) return;
    event.preventDefault();
    // An arrow key writes only the axis it moves, so the other axis is never answered by accident.
    if (move.x !== undefined) onChange({ x: round(clamp(x + move.x)) });
    else onChange({ y: round(clamp(y + move.y)) });
  };
  return (
    <div className="p2-pad-wrap">
      <div
        ref={ref}
        className="p2-pad"
        role="application"
        aria-label={label}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
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
