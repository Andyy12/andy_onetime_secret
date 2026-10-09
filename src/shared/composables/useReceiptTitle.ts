// src/shared/composables/useReceiptTitle.ts

import { loggingService } from '@/services/logging.service';
import { useAuthStore } from '@/shared/stores/authStore';
import { useReceiptListStore } from '@/shared/stores/receiptListStore';
import { computed, ref } from 'vue';

/**
 * Max length for a secret's title. The receipt memo field accepts up to 500
 * characters (V2::Logic::Secrets::UpdateReceipt::MEMO_MAX_LENGTH); a title is
 * a short label, so the form caps it well below that.
 */
export const RECEIPT_TITLE_MAX_LENGTH = 100;

/**
 * Optional, owner-only title for a secret, set from the creation form.
 *
 * The title is stored as the receipt's `memo` — the same field the history
 * table's pencil edits — so it lives on the receipt (owner side) and is never
 * shown to whoever opens the secret link.
 *
 * - Local history (guests): callers put `normalizedTitle` on the LocalReceipt.
 * - Account history (signed in): `persist()` PATCHes the receipt right after
 *   creation via the existing receipt update endpoint.
 *
 * A failed title save never fails secret creation: the secret already exists
 * and the title can still be added later from the history table.
 */
export function useReceiptTitle() {
  const authStore = useAuthStore();
  const receiptListStore = useReceiptListStore();

  const title = ref('');

  const normalizedTitle = computed(() =>
    title.value.trim().slice(0, RECEIPT_TITLE_MAX_LENGTH)
  );

  /** Saves the title on the account's receipt when signed in. */
  async function persist(receiptIdentifier: string, value = normalizedTitle.value): Promise<void> {
    if (!value || !authStore.isFullyAuthenticated) return;

    try {
      await receiptListStore.updateMemo(receiptIdentifier, value);
    } catch (error) {
      loggingService.warn('[useReceiptTitle] Could not save the secret title', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  function reset() {
    title.value = '';
  }

  return { title, normalizedTitle, persist, reset };
}
