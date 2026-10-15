// src/tests/i18n/message-syntax.spec.ts

/**
 * Message Syntax Tests
 *
 * Compiles every translation in locales/content/ with the same intlify
 * message compiler vue-i18n uses at runtime.
 *
 * Why: in development vue-i18n only *warns* on a malformed message, but the
 * production build *throws* during render. An unescaped "@" (linked-message
 * syntax) or an unbalanced "{" / "}" therefore passes every dev check and
 * then blanks the page in production behind RouteErrorBoundary.
 *
 * Fix a failure by escaping the literal character, e.g. "!{'@'}#$" instead
 * of "!@#$", or "{'{'}" for a literal brace.
 */

import { compile } from '@intlify/core';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.resolve(__dirname, '../../../locales/content');

interface ContentEntry {
  text?: unknown;
}

interface SyntaxProblem {
  file: string;
  key: string;
  text: string;
  error: string;
}

function contentFiles(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  return fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((dir) => dir.isDirectory())
    .flatMap((dir) =>
      fs
        .readdirSync(path.join(CONTENT_DIR, dir.name))
        .filter((file) => file.endsWith('.json'))
        .map((file) => path.join(CONTENT_DIR, dir.name, file))
    );
}

function findSyntaxProblems(file: string): SyntaxProblem[] {
  const entries = JSON.parse(fs.readFileSync(file, 'utf-8')) as Record<string, ContentEntry>;
  const locale = path.basename(path.dirname(file));
  const problems: SyntaxProblem[] = [];

  for (const [key, entry] of Object.entries(entries)) {
    const text = entry?.text;
    if (typeof text !== 'string' || text === '') continue;

    const errors: string[] = [];
    try {
      compile(text, {
        key,
        locale,
        onError: (err: Error) => errors.push(err.message),
      });
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }

    if (errors.length > 0) {
      problems.push({
        file: path.relative(CONTENT_DIR, file),
        key,
        text,
        error: errors.join('; '),
      });
    }
  }

  return problems;
}

describe('i18n message syntax', () => {
  const files = contentFiles();

  it('finds locale content files', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('every translation compiles without errors (production throws on these)', () => {
    const problems = files.flatMap(findSyntaxProblems);

    const report = problems
      .map((p) => `  ${p.file} → ${p.key}\n    text:  ${JSON.stringify(p.text)}\n    error: ${p.error}`)
      .join('\n');

    expect(problems, `Malformed i18n messages:\n${report}`).toEqual([]);
  });

  it('flags an unescaped "@" so this test cannot silently pass', () => {
    const errors: string[] = [];
    compile('Symbols (!@#$)', {
      key: 'probe',
      locale: 'en',
      onError: (err: Error) => errors.push(err.message),
    });
    expect(errors.length).toBeGreaterThan(0);
  });
});
