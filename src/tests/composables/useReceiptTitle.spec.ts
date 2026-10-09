// src/tests/composables/useReceiptTitle.spec.ts

import { beforeEach, describe, expect, it, vi } from 'vitest';

const authState = { isFullyAuthenticated: false };
const updateMemo = vi.fn();

vi.mock('@/shared/stores/authStore', () => ({
  useAuthStore: vi.fn(() => authState),
}));

vi.mock('@/shared/stores/receiptListStore', () => ({
  useReceiptListStore: vi.fn(() => ({ updateMemo })),
}));

vi.mock('@/services/logging.service', () => ({
  loggingService: { warn: vi.fn(), debug: vi.fn(), error: vi.fn() },
}));

import { loggingService } from '@/services/logging.service';
import {
  RECEIPT_TITLE_MAX_LENGTH,
  useReceiptTitle,
} from '@/shared/composables/useReceiptTitle';

describe('useReceiptTitle', () => {
  beforeEach(() => {
    authState.isFullyAuthenticated = false;
    updateMemo.mockReset();
    vi.mocked(loggingService.warn).mockClear();
  });

  it('trims and caps the title', () => {
    const { title, normalizedTitle } = useReceiptTitle();
    title.value = `  ${'x'.repeat(RECEIPT_TITLE_MAX_LENGTH + 20)}  `;
    expect(normalizedTitle.value).toHaveLength(RECEIPT_TITLE_MAX_LENGTH);

    title.value = '  Clave VPN  ';
    expect(normalizedTitle.value).toBe('Clave VPN');
  });

  it('does not call the API for guests (title stays in local history)', async () => {
    const { title, persist } = useReceiptTitle();
    title.value = 'Clave VPN';
    await persist('receipt123');
    expect(updateMemo).not.toHaveBeenCalled();
  });

  it('saves the title on the account receipt when signed in', async () => {
    authState.isFullyAuthenticated = true;
    const { title, persist } = useReceiptTitle();
    title.value = '  Clave VPN – Cliente Acme ';
    await persist('receipt123');
    expect(updateMemo).toHaveBeenCalledWith('receipt123', 'Clave VPN – Cliente Acme');
  });

  it('skips the API call when the title is empty', async () => {
    authState.isFullyAuthenticated = true;
    const { title, persist } = useReceiptTitle();
    title.value = '   ';
    await persist('receipt123');
    expect(updateMemo).not.toHaveBeenCalled();
  });

  it('never throws when saving the title fails (the secret already exists)', async () => {
    authState.isFullyAuthenticated = true;
    updateMemo.mockRejectedValueOnce(new Error('network down'));
    const { title, persist } = useReceiptTitle();
    title.value = 'Clave VPN';
    await expect(persist('receipt123')).resolves.toBeUndefined();
    expect(loggingService.warn).toHaveBeenCalled();
  });

  it('reset clears the title', () => {
    const { title, reset } = useReceiptTitle();
    title.value = 'Clave VPN';
    reset();
    expect(title.value).toBe('');
  });
});
