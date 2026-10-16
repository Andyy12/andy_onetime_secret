<!-- src/apps/secret/components/receipt/SecretLink.vue -->

<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  import CopyButton from '@/shared/components/ui/CopyButton.vue';
  import OIcon from '@/shared/components/icons/OIcon.vue';
  import SecretQrModal from '@/shared/components/ui/SecretQrModal.vue';
  import ShareMessageActions from './ShareMessageActions.vue';
  import type { Receipt, ReceiptDetails } from '@/schemas/shapes/v3/receipt';
  import { ref } from 'vue';

  const { t } = useI18n();

  interface Props {
    record: Receipt;
    details: ReceiptDetails;
    isInitialView: boolean;
  }

  defineProps<Props>();

  const linkInput = ref<HTMLInputElement>();
  const isQrModalOpen = ref(false);
</script>

<template>
  <div>
    <h1
      id="secret-header"
      class="sr-only">
      {{ t('web.LABELS.secret_link') }}
    </h1>

    <!-- Passphrase Indicator -->
    <!-- prettier-ignore-attribute class -->
    <div
      v-if="details?.has_passphrase"
      class="flex items-center gap-2 rounded-full
        border border-amber-100 bg-amber-50 px-2 py-1
        text-sm font-medium text-amber-600 shadow-sm transition-transform
        dark:border-amber-800/50 dark:bg-amber-900/30 dark:text-amber-400">
      <OIcon
        collection="mdi"
        name="lock"
        class="size-4" />
      {{ t('web.LABELS.passphrase_protected') }}
    </div>

    <!-- prettier-ignore-attribute class -->
    <div
      class="group relative overflow-hidden rounded-lg
        border-gray-200 bg-white shadow-md
        dark:border-gray-700 dark:bg-gray-800">
      <!-- Momentum Indicator - Enhanced Animation -->
      <div class="absolute left-0 top-0 h-1.5 w-full overflow-hidden">
        <div
          class="size-full animate-gradient-x bg-200%"
          :class="[
            isInitialView
              ? 'bg-gradient-to-r from-green-400 via-green-500 to-green-400'
              : 'bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300',
          ]">
        </div>
      </div>

      <!-- Initial Success Message - Enhanced with Icon Animation -->
      <div
        v-if="isInitialView"
        class="mb-2 flex items-center gap-2 px-5 pt-4 font-brand text-base">
        <div class="relative">
          <OIcon
            collection="mdi"
            name="check-circle"
            class="size-5 text-green-600 dark:text-green-400"
            aria-hidden="true" />
          <div class="absolute inset-0 size-full rounded-full opacity-50"></div>
        </div>
        <span>{{ t('web.receipt.created_success') }}</span>
      </div>

      <!-- Subsequent Message -->
      <!-- prettier-ignore-attribute class -->
      <div
        class="mb-1 flex items-center gap-2 px-5 pt-4
          font-mono text-sm tracking-wide text-gray-500">
        <OIcon
          collection="material-symbols"
          name="key-vertical"
          class="size-4 transition-transform duration-300 group-hover:rotate-12"
          aria-hidden="true" />
        <span class="transition-colors group-hover:text-brand-500 dark:group-hover:text-brand-400">
          {{ record.secret_shortid?.slice(0, 4) }}
        </span>
      </div>

      <!-- Secret Link Display with Enhanced Styling -->
      <div
        v-if="!details.show_recipients"
        class="flex items-start px-5 py-3">
        <div class="group/link relative min-w-0 grow">
          <!-- prettier-ignore-attribute class -->
          <textarea
            ref="linkInput"
            readonly
            :value="record.share_url ?? ''"
            class="w-full resize-none rounded-md
              border-0 bg-slate-50 px-3 py-2.5 font-mono text-sm text-gray-900
              focus:ring-1 focus:ring-green-500
              dark:bg-slate-900 dark:text-gray-100 sm:text-base"
            :aria-label="t('web.secrets.secret_link')"></textarea>
        </div>

        <div class="ml-4 flex items-center gap-2 shrink-0">
          <button
            type="button"
            @click="isQrModalOpen = true"
            :title="t('web.qr.button_title')"
            :aria-label="t('web.qr.button_title')"
            class="flex items-center justify-center rounded-md border border-gray-200 bg-white p-2.5 text-gray-600 shadow-sm transition hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            data-testid="show-qr-code-button">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="size-5">
              <rect width="5" height="5" x="3" y="3" rx="1"/>
              <rect width="5" height="5" x="16" y="3" rx="1"/>
              <rect width="5" height="5" x="3" y="16" rx="1"/>
              <path d="M21 16h-3a2 2 0 0 0-2 2v3"/>
              <path d="M21 21v.01"/>
              <path d="M12 7v3a2 2 0 0 1-2 2H7"/>
              <path d="M3 12h.01"/>
              <path d="M12 3h.01"/>
              <path d="M12 16v.01"/>
              <path d="M16 12h1"/>
              <path d="M21 12v.01"/>
              <path d="M12 21v-1"/>
            </svg>
          </button>
          <CopyButton
            class="transition-transform hover:scale-105"
            :text="record.share_url ?? ''" />
        </div>
      </div>

      <!-- Countdown + ready-to-send message -->
      <ShareMessageActions
        v-if="!details.show_recipients && record.share_url"
        :url="record.share_url"
        :expiration="record.expiration"
        :has-passphrase="!!details?.has_passphrase" />

      <SecretQrModal
        v-if="record.share_url"
        :url="record.share_url"
        :is-open="isQrModalOpen"
        @close="isQrModalOpen = false" />

      <!-- Security Notice with Enhanced Design -->
      <!-- prettier-ignore-attribute class -->
      <div
        v-if="!details.show_recipients"
        class="border-t border-gray-200
          bg-gray-50 px-5 py-3 dark:border-gray-700 dark:bg-gray-900/50">
        <div class="flex items-center text-xs text-gray-500 dark:text-gray-400">
          <OIcon
            collection="material-symbols"
            name="shield-outline"
            class="mr-2 size-4 text-brand-500 transition-transform dark:text-brand-400" />
          <span class="transition-colors group-hover:text-gray-700 dark:group-hover:text-gray-300">
            {{ t('web.COMMON.share_link_securely') }}
          </span>
        </div>
      </div>
    </div>

    <!-- Terminal / cURL snippet -->
    <details class="group mt-4 rounded-lg border border-gray-200 bg-white/70 p-3 text-xs shadow-2xs backdrop-blur-xs transition dark:border-gray-700/60 dark:bg-slate-800/60">
      <summary class="flex cursor-pointer items-center justify-between font-medium text-gray-700 select-none hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
        <span class="flex items-center gap-2">
          <span class="font-mono text-brand-600 dark:text-brand-400">&gt;_</span>
          <span>{{ t('web.cli.curl_snippet_title') }}</span>
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-4 text-gray-400 transition-transform duration-200 group-open:rotate-180">
          <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
        </svg>
      </summary>
      <div class="mt-2.5 space-y-1.5 pt-2 border-t border-gray-100 dark:border-gray-700/50">
        <p class="text-gray-500 dark:text-gray-400">
          {{ t('web.cli.curl_snippet_desc') }}
        </p>
        <div class="relative flex items-center justify-between rounded bg-slate-900 p-2.5 font-mono text-emerald-400 dark:bg-black/80">
          <code class="truncate pr-2">curl -s "{{ record.share_url }}"</code>
        </div>
      </div>
    </details>
  </div>
</template>

<style scoped>
  .animate-gradient-x {
    animation: gradient-x 10s linear infinite;
  }

  @keyframes gradient-x {
    0% {
      background-position: 0% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }

  .animate-success-ping {
    animation: success-ping 10s cubic-bezier(0, 0, 0.2, 1);
  }

  @keyframes success-ping {
    0% {
      transform: scale(0.5);
      opacity: 0;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
</style>
