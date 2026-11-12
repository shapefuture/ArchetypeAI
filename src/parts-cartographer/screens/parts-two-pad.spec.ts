import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlacementPad, padKeyMove, padPointerAxes } from './parts-two-pad.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('placement pad keys', () => {
  it('moves one axis per arrow key, so the other axis is never written', () => {
    expect(padKeyMove('ArrowRight', 0.05)).toEqual({ x: 0.05 });
    expect(padKeyMove('ArrowLeft', 0.2)).toEqual({ x: -0.2 });
    expect(padKeyMove('ArrowUp', 0.05)).toEqual({ y: 0.05 });
    expect(padKeyMove('ArrowDown', 0.05)).toEqual({ y: -0.05 });
  });

  it('moves nothing for any other key', () => {
    expect(padKeyMove('Enter', 0.05)).toBeNull();
  });
});

describe('placement pad pointer axes', () => {
  it('a press answers both axes', () => {
    expect(padPointerAxes(null, { clientX: 10, clientY: 10 })).toEqual({ x: true, y: true });
  });

  it('a sideways drag answers energy only, so direction is left alone', () => {
    expect(padPointerAxes({ clientX: 10, clientY: 10 }, { clientX: 25, clientY: 10 })).toEqual({ x: true, y: false });
  });

  it('a vertical drag answers direction only, so energy is left alone', () => {
    expect(padPointerAxes({ clientX: 10, clientY: 10 }, { clientX: 10, clientY: 40 })).toEqual({ x: false, y: true });
  });

  it('a move that stays in place answers nothing', () => {
    expect(padPointerAxes({ clientX: 10, clientY: 10 }, { clientX: 10, clientY: 10 })).toEqual({ x: false, y: false });
  });
});

describe('placement pad in the page', () => {
  let root: Root | null = null;
  let host: HTMLDivElement | null = null;

  afterEach(() => {
    act(() => { root?.unmount(); });
    root = null;
    host?.remove();
    host = null;
  });

  // A 200 × 200 pad at the origin. jsdom has no layout and no pointer capture, so both are supplied here.
  function mountPad(onChange: (values: Record<string, number>) => void): HTMLElement {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    act(() => {
      root?.render(React.createElement(PlacementPad, { label: 'pad', x: 0, y: 0, xLabels: ['low', 'high'], yLabels: ['away', 'toward'], onChange }));
    });
    const pad = host.querySelector<HTMLElement>('.p2-pad');
    if (!pad) throw new Error('placement pad was not rendered');
    pad.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 200, right: 200, bottom: 200, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    Object.assign(pad, { setPointerCapture: () => {} });
    return pad;
  }

  function pointer(target: HTMLElement, type: 'pointerdown' | 'pointermove', clientX: number, clientY: number, buttons = 1) {
    act(() => {
      target.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX, clientY, buttons }));
    });
  }

  it('a press places both axes, and a sideways drag then answers energy alone', () => {
    const onChange = vi.fn();
    const pad = mountPad(onChange);
    pointer(pad, 'pointerdown', 100, 100);
    expect(onChange).toHaveBeenLastCalledWith({ x: 0, y: 0 });
    onChange.mockClear();
    pointer(pad, 'pointermove', 150, 100);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith({ x: 0.5 });
  });

  it('a vertical drag answers direction alone, and a move without a pressed button answers nothing', () => {
    const onChange = vi.fn();
    const pad = mountPad(onChange);
    pointer(pad, 'pointermove', 150, 60, 0);
    expect(onChange).not.toHaveBeenCalled();
    pointer(pad, 'pointerdown', 100, 100);
    onChange.mockClear();
    pointer(pad, 'pointermove', 100, 50);
    expect(onChange).toHaveBeenLastCalledWith({ y: 0.5 });
  });
});
