// src/apps/secret/components/receipt/shareMessage.ts

/**
 * Ready-to-send message for a freshly created secret link.
 *
 * The creator pastes it into a chat or email so the recipient knows the link
 * works once, when it expires, and that a passphrase (if any) will arrive
 * through a different channel — never in the same message as the link.
 */

export interface ShareMessageInput {
  url: string;
  /** Human duration until expiry ("6d 23h"); omitted when unknown. */
  expiresIn?: string | null;
  hasPassphrase: boolean;
}

type Translate = (key: string, named?: Record<string, unknown>) => string;

export function buildShareMessage(input: ShareMessageInput, t: Translate): string {
  const lines = [
    t('web.share_message.intro'),
    '',
    t('web.share_message.link_line', { url: input.url }),
  ];

  if (input.expiresIn) {
    lines.push(t('web.share_message.expires_line', { time: input.expiresIn }));
  }
  if (input.hasPassphrase) {
    lines.push('', t('web.share_message.passphrase_line'));
  }

  return lines.join('\n');
}

export function whatsappShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function emailShareUrl(subject: string, message: string): string {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
}
