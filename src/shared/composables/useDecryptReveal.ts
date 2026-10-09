// src/shared/composables/useDecryptReveal.ts

import { getCurrentInstance, onBeforeUnmount, ref, type Ref } from 'vue';

/**
 * One-shot "decrypt" reveal for a secret value.
 *
 * Phases: 'unlocking' (lock opens) → 'decoding' (scrambled glyphs resolve left
 * to right into the real text) → 'done'. Runs once; never loops (GoDatalize
 * motion rule). With prefers-reduced-motion, or for very long values, it skips
 * straight to 'done' so the real text is shown immediately.
 *
 * Only the *displayed* text is scrambled — callers must copy from the real
 * value, never from `displayValue`.
 */
export type RevealPhase = 'unlocking' | 'decoding' | 'done';

export const UNLOCK_MS = 650;
export const DECODE_MS = 900;
/** Above this length the per-frame scramble isn't worth it; just show it. */
export const MAX_ANIMATED_LENGTH = 2000;

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#$%&*+=?<>/';

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    !!window.matchMedia('(prefers-reduced-motion: reduce)')?.matches
  );
}

/** Scramble every non-whitespace char at index >= `resolved`. */
export function scramble(
  value: string,
  resolved: number,
  rand: () => number = Math.random
): string {
  let out = value.slice(0, resolved);
  for (let i = resolved; i < value.length; i++) {
    const ch = value[i];
    out += /\s/.test(ch) ? ch : GLYPHS[Math.floor(rand() * GLYPHS.length)];
  }
  return out;
}

export function useDecryptReveal(value: Ref<string | undefined | null>) {
  const phase = ref<RevealPhase>('unlocking');
  const displayValue = ref('');

  let timer: ReturnType<typeof setTimeout> | null = null;
  let frame: number | null = null;

  function finish() {
    phase.value = 'done';
    displayValue.value = value.value ?? '';
  }

  function decode() {
    const text = value.value ?? '';
    phase.value = 'decoding';
    const start = performance.now();

    // Browsers throttle requestAnimationFrame in background tabs; guarantee
    // the reveal still completes on time.
    timer = setTimeout(() => {
      if (phase.value !== 'done') skip();
    }, DECODE_MS + 150);

    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / DECODE_MS);
      const resolved = Math.floor(progress * text.length);
      displayValue.value = scramble(text, resolved);
      if (progress < 1) {
        frame = requestAnimationFrame(step);
      } else {
        finish();
      }
    };
    frame = requestAnimationFrame(step);
  }

  function start() {
    const text = value.value ?? '';
    if (!text || prefersReducedMotion() || text.length > MAX_ANIMATED_LENGTH ||
        typeof requestAnimationFrame !== 'function') {
      finish();
      return;
    }
    phase.value = 'unlocking';
    displayValue.value = scramble(text, 0);
    timer = setTimeout(decode, UNLOCK_MS);
  }

  /** Jump to the end (e.g. the user wants to copy right away). */
  function skip() {
    stop();
    finish();
  }

  function stop() {
    if (timer) clearTimeout(timer);
    if (frame !== null && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frame);
    timer = null;
    frame = null;
  }

  if (getCurrentInstance()) onBeforeUnmount(stop);

  return { phase, displayValue, start, skip };
}
