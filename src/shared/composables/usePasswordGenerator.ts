// src/shared/composables/usePasswordGenerator.ts

import { computed, ref, watch } from 'vue';

export interface PasswordGeneratorOptions {
  length?: number;
  uppercase?: boolean;
  lowercase?: boolean;
  numbers?: boolean;
  symbols?: boolean;
  excludeAmbiguous?: boolean;
}

export const CHAR_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
} as const;

export const AMBIGUOUS_CHARS = new Set(['i', 'l', '1', 'I', 'o', '0', 'O', '|', '`', '\'']);

/** Length bounds offered by the generator UI. */
export const GENERATOR_MIN_LENGTH = 6;
export const GENERATOR_MAX_LENGTH = 64;

/**
 * Per-browser memory of the generator settings (never the password itself).
 * Stored under a namespaced key; every read is validated because localStorage
 * is user-editable and may hold stale or foreign data.
 */
export const GENERATOR_PREFS_STORAGE_KEY = 'godatalize.passwordGenerator.v1';

export type PasswordGeneratorPrefs = Required<PasswordGeneratorOptions>;

const PREF_FLAGS = ['uppercase', 'lowercase', 'numbers', 'symbols', 'excludeAmbiguous'] as const;

/** Reads saved settings, or null when missing, invalid, or storage is blocked. */
export function loadGeneratorPrefs(): PasswordGeneratorPrefs | null {
  try {
    const raw = localStorage.getItem(GENERATOR_PREFS_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Record<string, unknown>;

    const length = Number(data.length);
    if (
      !Number.isInteger(length) ||
      length < GENERATOR_MIN_LENGTH ||
      length > GENERATOR_MAX_LENGTH
    ) {
      return null;
    }
    if (!PREF_FLAGS.every((flag) => typeof data[flag] === 'boolean')) return null;

    return {
      length,
      uppercase: data.uppercase as boolean,
      lowercase: data.lowercase as boolean,
      numbers: data.numbers as boolean,
      symbols: data.symbols as boolean,
      excludeAmbiguous: data.excludeAmbiguous as boolean,
    };
  } catch {
    return null;
  }
}

/** Saves settings; silently skipped when storage is unavailable. */
export function saveGeneratorPrefs(prefs: PasswordGeneratorPrefs): void {
  const length = Math.floor(Number(prefs.length));
  if (!Number.isInteger(length) || length < GENERATOR_MIN_LENGTH || length > GENERATOR_MAX_LENGTH) {
    return; // mid-edit value (e.g. a cleared number input); keep the last good one
  }
  try {
    localStorage.setItem(GENERATOR_PREFS_STORAGE_KEY, JSON.stringify({ ...prefs, length }));
  } catch {
    /* storage blocked (private mode, quota) — the preference is a convenience */
  }
}

/**
 * Filter out ambiguous characters from a string if requested.
 */
function filterAmbiguous(chars: string, exclude: boolean): string {
  if (!exclude) return chars;
  return chars
    .split('')
    .filter((ch) => !AMBIGUOUS_CHARS.has(ch))
    .join('');
}

/**
 * Generates a cryptographically secure random integer in [0, max).
 */
function secureRandomInt(max: number): number {
  if (max <= 0) return 0;
  const array = new Uint32Array(1);
  const limit = Math.floor(0xffffffff / max) * max;
  let randomVal: number;
  do {
    crypto.getRandomValues(array);
    randomVal = array[0];
  } while (randomVal >= limit);
  return randomVal % max;
}

/**
 * Shuffle an array in-place using Fisher-Yates and cryptographic randomness.
 */
function secureShuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

export function usePasswordGenerator(initialOptions: PasswordGeneratorOptions = {}) {
  const length = ref(initialOptions.length ?? 16);
  const uppercase = ref(initialOptions.uppercase ?? true);
  const lowercase = ref(initialOptions.lowercase ?? true);
  const numbers = ref(initialOptions.numbers ?? true);
  const symbols = ref(initialOptions.symbols ?? true);
  const excludeAmbiguous = ref(initialOptions.excludeAmbiguous ?? false);

  const password = ref('');

  // At least one set must be selected
  const hasValidSelection = computed(
    () => uppercase.value || lowercase.value || numbers.value || symbols.value
  );

  function generate(): string {
    // The number input lets users type below its min="6" (or clear it, which
    // v-model.number turns into ''), so clamp here to the UI's floor of 6.
    const minLength = Math.max(
      GENERATOR_MIN_LENGTH,
      Math.min(128, Math.floor(Number(length.value) || 0))
    );
    const activeSets: string[] = [];

    if (uppercase.value) {
      activeSets.push(filterAmbiguous(CHAR_SETS.uppercase, excludeAmbiguous.value));
    }
    if (lowercase.value) {
      activeSets.push(filterAmbiguous(CHAR_SETS.lowercase, excludeAmbiguous.value));
    }
    if (numbers.value) {
      activeSets.push(filterAmbiguous(CHAR_SETS.numbers, excludeAmbiguous.value));
    }
    if (symbols.value) {
      activeSets.push(filterAmbiguous(CHAR_SETS.symbols, excludeAmbiguous.value));
    }

    if (activeSets.length === 0) {
      // Fallback: lowercase + numbers
      activeSets.push(filterAmbiguous(CHAR_SETS.lowercase, excludeAmbiguous.value));
      activeSets.push(filterAmbiguous(CHAR_SETS.numbers, excludeAmbiguous.value));
    }

    const resultChars: string[] = [];

    // Ensure at least one character from each active set
    for (const charSet of activeSets) {
      if (charSet.length > 0) {
        resultChars.push(charSet[secureRandomInt(charSet.length)]);
      }
    }

    // Combine all active characters
    const allChars = activeSets.join('');
    if (allChars.length === 0) {
      password.value = '';
      return '';
    }

    // Fill remaining positions
    while (resultChars.length < minLength) {
      resultChars.push(allChars[secureRandomInt(allChars.length)]);
    }

    // Shuffle characters so guaranteed characters aren't all at the front
    const finalPassword = secureShuffle(resultChars).slice(0, minLength).join('');
    password.value = finalPassword;
    return finalPassword;
  }

  // Calculate entropy and strength score (0 to 4)
  const strengthScore = computed(() => {
    const pass = password.value;
    if (!pass) return 0;
    const len = pass.length;
    if (len < 6) return 0;

    let pool = 0;
    if (/[a-z]/.test(pass)) pool += 26;
    if (/[A-Z]/.test(pass)) pool += 26;
    if (/[0-9]/.test(pass)) pool += 10;
    if (/[^a-zA-Z0-9]/.test(pass)) pool += 30;

    const entropy = pool > 0 ? len * Math.log2(pool) : 0;

    if (entropy < 35 || len < 8) return 1;
    if (entropy < 55 || len < 10) return 2;
    if (entropy < 80 || len < 14) return 3;
    return 4;
  });

  // Strength details: label, color and percent
  const strength = computed(() => {
    const score = strengthScore.value;
    switch (score) {
      case 4:
        return {
          score,
          label: 'muy_fuerte',
          percent: 100,
          colorClass: 'bg-brand-600 dark:bg-brand-400 text-brand-700 dark:text-brand-300',
        };
      case 3:
        return {
          score,
          label: 'fuerte',
          percent: 75,
          colorClass: 'bg-emerald-500 text-emerald-600 dark:text-emerald-400',
        };
      case 2:
        return {
          score,
          label: 'buena',
          percent: 50,
          colorClass: 'bg-brandcomp-400 text-brandcomp-700 dark:text-brandcomp-300',
        };
      case 1:
        return {
          score,
          label: 'debil',
          percent: 25,
          colorClass: 'bg-amber-500 text-amber-600 dark:text-amber-400',
        };
      default:
        return {
          score: 0,
          label: 'muy_debil',
          percent: 10,
          colorClass: 'bg-red-500 text-red-600 dark:text-red-400',
        };
    }
  });

  // Auto-generate initial password and whenever options change
  watch(
    [length, uppercase, lowercase, numbers, symbols, excludeAmbiguous],
    () => {
      generate();
    },
    { immediate: true, flush: 'sync' }
  );

  return {
    length,
    uppercase,
    lowercase,
    numbers,
    symbols,
    excludeAmbiguous,
    password,
    hasValidSelection,
    strength,
    generate,
  };
}
