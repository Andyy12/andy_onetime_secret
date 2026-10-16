// src/shared/composables/useCountdown.ts

import { computed, getCurrentInstance, onBeforeUnmount, ref, watch, type Ref } from 'vue';

/**
 * Live countdown to a fixed moment (e.g. a receipt's `expiration`).
 *
 * Ticks every second while under an hour remains, and every 30 s otherwise —
 * minute-level precision is all the long form ("2 d 4 h 12 min") shows.
 * Formatting uses Intl unit formatting, so units read naturally in every
 * locale without extra translation keys.
 */

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function splitDuration(ms: number): CountdownParts {
  const clamped = Math.max(0, ms);
  return {
    days: Math.floor(clamped / DAY),
    hours: Math.floor((clamped % DAY) / HOUR),
    minutes: Math.floor((clamped % HOUR) / MINUTE),
    seconds: Math.floor((clamped % MINUTE) / SECOND),
  };
}

/**
 * Compact, locale-aware duration: "2d 4h 12m" (en) / "2 d 4 h 12 min" (es).
 * Shows at most the two/three most significant units; seconds only in the
 * final hour.
 */
export function formatDuration(ms: number, locale: string): string {
  const { days, hours, minutes, seconds } = splitDuration(ms);
  const unit = (value: number, name: 'day' | 'hour' | 'minute' | 'second') => {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'unit',
        unit: name,
        unitDisplay: 'narrow',
      }).format(value);
    } catch {
      return `${value}${name[0]}`;
    }
  };

  if (days > 0) return [unit(days, 'day'), unit(hours, 'hour')].join(' ');
  if (hours > 0) return [unit(hours, 'hour'), unit(minutes, 'minute')].join(' ');
  return [unit(minutes, 'minute'), unit(seconds, 'second')].join(' ');
}

export function useCountdown(target: Ref<Date | null | undefined>) {
  const now = ref(Date.now());
  let timer: ReturnType<typeof setTimeout> | null = null;

  const remainingMs = computed(() =>
    target.value ? Math.max(0, target.value.getTime() - now.value) : null
  );
  const isExpired = computed(() => remainingMs.value === 0);

  function stop() {
    if (timer) clearTimeout(timer);
    timer = null;
  }

  function schedule() {
    stop();
    if (remainingMs.value === null || remainingMs.value === 0) return;
    const delay = remainingMs.value < HOUR ? SECOND : 30 * SECOND;
    timer = setTimeout(() => {
      now.value = Date.now();
      schedule();
    }, delay);
  }

  watch(
    target,
    () => {
      now.value = Date.now();
      schedule();
    },
    { immediate: true }
  );

  if (getCurrentInstance()) onBeforeUnmount(stop);

  return { remainingMs, isExpired, stop };
}
