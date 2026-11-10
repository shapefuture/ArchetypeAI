import { describe, expect, it } from 'vitest';
import { padKeyMove } from './parts-two-pad.jsx';

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
