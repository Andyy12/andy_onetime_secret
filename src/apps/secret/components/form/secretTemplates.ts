// src/apps/secret/components/form/secretTemplates.ts

/**
 * Quick templates for the secret textarea.
 *
 * Two kinds:
 * - `fields`: human labels ("Username: ") resolved through i18n, so the
 *   skeleton reads in the viewer's language.
 * - `lines`: technical keys (DB_HOST=, API_KEY=) that stay literal in every
 *   language because they are meant to be pasted into config files.
 *
 * Labels live in locales/content/{en,es}/secret-manage.json under
 * web.templates.* and web.templates.fields.*.
 */

export type SecretTemplateId =
  | 'credentials'
  | 'email'
  | 'database'
  | 'env'
  | 'api'
  | 'ssh'
  | 'wifi'
  | 'vpn';

export interface SecretTemplate {
  id: SecretTemplateId;
  emoji: string;
  /** i18n keys of label fields; each becomes a "Label: " line. */
  fields?: string[];
  /** Literal lines, inserted as-is. */
  lines?: string[];
}

const field = (name: string) => `web.templates.fields.${name}`;

export const SECRET_TEMPLATES: readonly SecretTemplate[] = [
  {
    id: 'credentials',
    emoji: '👤',
    fields: [field('site'), field('username'), field('password'), field('notes')],
  },
  {
    id: 'email',
    emoji: '✉️',
    fields: [field('email'), field('password'), field('incoming_server'), field('outgoing_server')],
  },
  {
    id: 'database',
    emoji: '🗄️',
    lines: ['DB_HOST=', 'DB_PORT=5432', 'DB_NAME=', 'DB_USER=', 'DB_PASSWORD='],
  },
  {
    id: 'env',
    emoji: '⚙️',
    lines: ['APP_ENV=production', 'SECRET_KEY=', 'DATABASE_URL=', 'REDIS_URL='],
  },
  {
    id: 'api',
    emoji: '🔑',
    lines: ['API_URL=', 'API_KEY=', 'API_SECRET=', 'ACCESS_TOKEN='],
  },
  {
    id: 'ssh',
    emoji: '🖥️',
    fields: [field('host'), field('port'), field('username'), field('password_or_key')],
  },
  {
    id: 'wifi',
    emoji: '📶',
    fields: [field('network'), field('password'), field('security')],
  },
  {
    id: 'vpn',
    emoji: '🛡️',
    fields: [field('server'), field('username'), field('password'), field('preshared_key')],
  },
];

/** Builds a template's text. `translate` resolves field label keys. */
export function buildTemplate(template: SecretTemplate, translate: (key: string) => string): string {
  if (template.lines) return template.lines.join('\n');
  return (template.fields ?? []).map((key) => `${translate(key)}: `).join('\n');
}

/**
 * Inserts a template without destroying what the user already typed: an
 * empty textarea gets the template; otherwise it is appended after a blank
 * line. Returns the new text and the caret position at the end of the
 * template's first line (where the user starts typing).
 */
export function insertTemplate(
  current: string,
  templateText: string,
  maxLength: number
): { text: string; caret: number } {
  const hasContent = current.trim().length > 0;
  const prefix = hasContent ? `${current.replace(/\s+$/, '')}\n\n` : '';
  const text = `${prefix}${templateText}`.slice(0, maxLength);

  const firstLineEnd = templateText.indexOf('\n');
  const caret = Math.min(
    text.length,
    prefix.length + (firstLineEnd === -1 ? templateText.length : firstLineEnd)
  );

  return { text, caret };
}
