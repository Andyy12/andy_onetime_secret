// src/tests/apps/secret/components/form/secretTemplates.spec.ts

import { describe, expect, it } from 'vitest';
import {
  SECRET_TEMPLATES,
  buildTemplate,
  insertTemplate,
} from '@/apps/secret/components/form/secretTemplates';

const fakeT = (key: string) => key.split('.').pop() ?? key;

describe('secretTemplates', () => {
  it('has unique ids and each template defines fields or lines', () => {
    const ids = SECRET_TEMPLATES.map((tpl) => tpl.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const tpl of SECRET_TEMPLATES) {
      expect((tpl.fields?.length ?? 0) + (tpl.lines?.length ?? 0)).toBeGreaterThan(0);
    }
  });

  it('builds label templates through the translator', () => {
    const credentials = SECRET_TEMPLATES.find((tpl) => tpl.id === 'credentials')!;
    expect(buildTemplate(credentials, fakeT)).toBe('site: \nusername: \npassword: \nnotes: ');
  });

  it('keeps technical templates literal', () => {
    const database = SECRET_TEMPLATES.find((tpl) => tpl.id === 'database')!;
    expect(buildTemplate(database, fakeT)).toContain('DB_PASSWORD=');
  });

  it('fills an empty textarea and puts the caret at the end of the first line', () => {
    const { text, caret } = insertTemplate('', 'User: \nPass: ', 10000);
    expect(text).toBe('User: \nPass: ');
    expect(caret).toBe('User: '.length);
  });

  it('appends instead of overwriting what the user typed', () => {
    const { text, caret } = insertTemplate('my notes\n\n', 'User: \nPass: ', 10000);
    expect(text).toBe('my notes\n\nUser: \nPass: ');
    expect(caret).toBe('my notes\n\nUser: '.length);
  });

  it('never exceeds the max length', () => {
    const { text, caret } = insertTemplate('x'.repeat(9), 'User: \nPass: ', 12);
    expect(text).toHaveLength(12);
    expect(caret).toBeLessThanOrEqual(12);
  });
});
