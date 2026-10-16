import { afterEach, describe, expect, it, vi } from 'vitest';
import { ambienceSuspended, bindAmbienceSignals, createAmbienceGate, isTextEntry } from './ambience-gate';

const noSignals = { hidden: false, typing: false, error: false };

afterEach(() => {
  Reflect.deleteProperty(document, 'hidden');
  document.body.innerHTML = '';
});

describe('ambience gate', () => {
  it('suspends ambience for a hidden page, text entry, or an error, and only those', () => {
    expect(ambienceSuspended(noSignals)).toBe(false);
    expect(ambienceSuspended({ ...noSignals, hidden: true })).toBe(true);
    expect(ambienceSuspended({ ...noSignals, typing: true })).toBe(true);
    expect(ambienceSuspended({ ...noSignals, error: true })).toBe(true);
  });

  it('notifies listeners only when the active state actually changes', () => {
    const gate = createAmbienceGate();
    const listener = vi.fn();
    const unsubscribe = gate.subscribe(listener);

    gate.set('typing', true);
    gate.set('error', true);
    gate.set('typing', false);
    expect(listener.mock.calls).toEqual([[false]]);
    expect(gate.active).toBe(false);

    gate.set('error', false);
    expect(listener.mock.calls).toEqual([[false], [true]]);
    expect(gate.active).toBe(true);

    unsubscribe();
    gate.set('hidden', true);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('recognises text fields and ignores buttons, toggles and plain elements', () => {
    const element = (tagName: string, extra: Record<string, unknown> = {}) => ({ tagName, ...extra });

    expect(isTextEntry(element('TEXTAREA'))).toBe(true);
    expect(isTextEntry(element('INPUT', { type: 'text' }))).toBe(true);
    expect(isTextEntry(element('INPUT', { type: 'email' }))).toBe(true);
    expect(isTextEntry(element('INPUT'))).toBe(true);
    expect(isTextEntry(element('DIV', { isContentEditable: true }))).toBe(true);
    expect(isTextEntry(element('INPUT', { type: 'checkbox' }))).toBe(false);
    expect(isTextEntry(element('INPUT', { type: 'range' }))).toBe(false);
    expect(isTextEntry(element('BUTTON'))).toBe(false);
    expect(isTextEntry(element('DIV'))).toBe(false);
    expect(isTextEntry(null)).toBe(false);
  });
});

describe('bindAmbienceSignals', () => {
  it('follows page visibility and focus in text fields, then stops listening when disposed', () => {
    const gate = createAmbienceGate();
    const dispose = bindAmbienceSignals(document, gate);
    const listener = vi.fn();
    gate.subscribe(listener);

    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(gate.active).toBe(false);
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(gate.active).toBe(true);

    const field = document.createElement('textarea');
    document.body.appendChild(field);
    field.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(gate.active).toBe(false);
    field.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
    expect(gate.active).toBe(true);

    const button = document.createElement('button');
    document.body.appendChild(button);
    field.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    field.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: button }));
    expect(gate.active).toBe(true);
    expect(listener.mock.calls).toEqual([[false], [true], [false], [true], [false], [true]]);

    dispose();
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(gate.active).toBe(true);
  });

  it('re-reads focus on the next pointer press when a focused field disappeared without a focusout', () => {
    const gate = createAmbienceGate();
    const dispose = bindAmbienceSignals(document, gate);
    const field = document.createElement('input');
    document.body.appendChild(field);
    field.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(gate.active).toBe(false);

    field.remove();
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(gate.active).toBe(true);
    dispose();
  });
});
