// src/tests/composables/useDecryptReveal.spec.ts

import {
  DECODE_MS,
  MAX_ANIMATED_LENGTH,
  scramble,
  UNLOCK_MS,
  useDecryptReveal,
} from '@/shared/composables/useDecryptReveal';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

function mockReducedMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({ matches: reduce }) as unknown as typeof window.matchMedia;
}

describe('scramble', () => {
  it('keeps the resolved prefix and whitespace, scrambles the rest', () => {
    const out = scramble('ab cd\nef', 2, () => 0);
    expect(out.slice(0, 2)).toBe('ab');
    expect(out[2]).toBe(' ');
    expect(out[5]).toBe('\n');
    expect(out).toHaveLength(8);
    expect(out.slice(3, 5)).not.toBe('cd');
  });

  it('returns the real value when fully resolved', () => {
    expect(scramble('secreto', 7)).toBe('secreto');
  });
});

describe('useDecryptReveal', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
  });

  afterEach(() => {
    vi.useRealTimers();
    window.matchMedia = originalMatchMedia;
  });

  it('unlocks, decodes, then shows the real value', () => {
    mockReducedMotion(false);
    const { phase, displayValue, start } = useDecryptReveal(ref('mi-clave-123'));
    start();
    expect(phase.value).toBe('unlocking');
    expect(displayValue.value).not.toBe('mi-clave-123');

    vi.advanceTimersByTime(UNLOCK_MS + 20);
    expect(phase.value).toBe('decoding');

    vi.advanceTimersByTime(DECODE_MS + 100);
    expect(phase.value).toBe('done');
    expect(displayValue.value).toBe('mi-clave-123');
  });

  it('skips the animation with prefers-reduced-motion', () => {
    mockReducedMotion(true);
    const { phase, displayValue, start } = useDecryptReveal(ref('mi-clave-123'));
    start();
    expect(phase.value).toBe('done');
    expect(displayValue.value).toBe('mi-clave-123');
  });

  it('skips the animation for very long values', () => {
    mockReducedMotion(false);
    const long = 'x'.repeat(MAX_ANIMATED_LENGTH + 1);
    const { phase, displayValue, start } = useDecryptReveal(ref(long));
    start();
    expect(phase.value).toBe('done');
    expect(displayValue.value).toBe(long);
  });

  it('skip() jumps straight to the real value', () => {
    mockReducedMotion(false);
    const { phase, displayValue, start, skip } = useDecryptReveal(ref('mi-clave-123'));
    start();
    skip();
    expect(phase.value).toBe('done');
    expect(displayValue.value).toBe('mi-clave-123');
  });
});
