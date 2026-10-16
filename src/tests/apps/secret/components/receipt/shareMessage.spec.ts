// src/tests/apps/secret/components/receipt/shareMessage.spec.ts

import { describe, expect, it } from 'vitest';
import {
  buildShareMessage,
  emailShareUrl,
  whatsappShareUrl,
} from '@/apps/secret/components/receipt/shareMessage';

// Echo translator: key plus interpolated values, so assertions stay readable.
const t = (key: string, named?: Record<string, unknown>) =>
  named ? `${key}(${Object.values(named).join(',')})` : key;

describe('buildShareMessage', () => {
  it('includes the link and expiry', () => {
    const message = buildShareMessage(
      { url: 'https://s.example/secret/abc', expiresIn: '6d 23h', hasPassphrase: false },
      t
    );
    expect(message).toContain('web.share_message.link_line(https://s.example/secret/abc)');
    expect(message).toContain('web.share_message.expires_line(6d 23h)');
    expect(message).not.toContain('passphrase_line');
  });

  it('mentions a separately-sent passphrase without including one', () => {
    const message = buildShareMessage(
      { url: 'https://s.example/secret/abc', hasPassphrase: true },
      t
    );
    expect(message).toContain('web.share_message.passphrase_line');
    expect(message).not.toContain('expires_line');
  });
});

describe('share URLs', () => {
  it('encodes the message for WhatsApp', () => {
    expect(whatsappShareUrl('a b&c')).toBe('https://wa.me/?text=a%20b%26c');
  });

  it('builds a mailto with subject and body', () => {
    expect(emailShareUrl('Hi', 'x\ny')).toBe('mailto:?subject=Hi&body=x%0Ay');
  });
});
