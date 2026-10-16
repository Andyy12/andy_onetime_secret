// src/tests/composables/useCountdown.spec.ts

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { formatDuration, splitDuration, useCountdown } from '@/shared/composables/useCountdown';

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe('splitDuration', () => {
  it('splits milliseconds into units', () => {
    expect(splitDuration(2 * DAY + 4 * HOUR + 12 * MIN + 5_000)).toEqual({
      days: 2,
      hours: 4,
      minutes: 12,
      seconds: 5,
    });
  });

  it('clamps negatives to zero', () => {
    expect(splitDuration(-5)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  });
});

describe('formatDuration', () => {
  it('shows days and hours when over a day', () => {
    const text = formatDuration(2 * DAY + 4 * HOUR + 12 * MIN, 'en');
    expect(text).toMatch(/^2\s?d/);
    expect(text).toMatch(/4\s?h/);
    expect(text).not.toMatch(/12/);
  });

  it('shows minutes and seconds in the last hour', () => {
    const text = formatDuration(5 * MIN + 30_000, 'en');
    expect(text).toMatch(/5\s?m/);
    expect(text).toMatch(/30\s?s/);
  });
});

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-15T12:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('counts down and reports expiry', () => {
    const target = ref<Date | null>(new Date('2026-10-15T12:00:03Z'));
    const { remainingMs, isExpired, stop } = useCountdown(target);

    expect(remainingMs.value).toBe(3_000);
    expect(isExpired.value).toBe(false);

    vi.advanceTimersByTime(3_000);
    expect(remainingMs.value).toBe(0);
    expect(isExpired.value).toBe(true);
    stop();
  });

  it('is null without a target', () => {
    const { remainingMs, isExpired } = useCountdown(ref(null));
    expect(remainingMs.value).toBeNull();
    expect(isExpired.value).toBe(false);
  });
});
