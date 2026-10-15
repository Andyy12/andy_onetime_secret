// src/tests/composables/usePasswordGenerator.spec.ts

import { describe, expect, it } from 'vitest';
import {
  AMBIGUOUS_CHARS,
  CHAR_SETS,
  usePasswordGenerator,
} from '@/shared/composables/usePasswordGenerator';

describe('usePasswordGenerator', () => {
  it('generates a password of default length 16', () => {
    const { password } = usePasswordGenerator();
    expect(password.value).toHaveLength(16);
  });

  it('generates a password with custom length', () => {
    const { password, length } = usePasswordGenerator({ length: 32 });
    expect(password.value).toHaveLength(32);

    length.value = 24;
    expect(password.value).toHaveLength(24);
  });

  it('generates numbers only when only numbers are selected', () => {
    const { password } = usePasswordGenerator({
      length: 20,
      uppercase: false,
      lowercase: false,
      numbers: true,
      symbols: false,
    });
    expect(password.value).toMatch(/^[0-9]+$/);
  });

  it('generates lowercase only when only lowercase is selected', () => {
    const { password } = usePasswordGenerator({
      length: 20,
      uppercase: false,
      lowercase: true,
      numbers: false,
      symbols: false,
    });
    expect(password.value).toMatch(/^[a-z]+$/);
  });

  it('excludes ambiguous characters when requested', () => {
    const { password } = usePasswordGenerator({
      length: 50,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
      excludeAmbiguous: true,
    });
    for (const char of password.value) {
      expect(AMBIGUOUS_CHARS.has(char)).toBe(false);
    }
  });

  it('includes at least one char of each active set', () => {
    const { password } = usePasswordGenerator({
      length: 20,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
    });
    const val = password.value;
    expect(/[A-Z]/.test(val)).toBe(true);
    expect(/[a-z]/.test(val)).toBe(true);
    expect(/[0-9]/.test(val)).toBe(true);
    expect(/[^a-zA-Z0-9]/.test(val)).toBe(true);
  });

  it('calculates password strength appropriately', () => {
    const { strength, length, uppercase, lowercase, numbers, symbols } = usePasswordGenerator({
      length: 6,
      uppercase: false,
      lowercase: true,
      numbers: false,
      symbols: false,
    });
    expect(strength.value.score).toBeLessThanOrEqual(2);

    length.value = 24;
    uppercase.value = true;
    lowercase.value = true;
    numbers.value = true;
    symbols.value = true;

    expect(strength.value.score).toBe(4);
    expect(strength.value.label).toBe('muy_fuerte');
  });
});
