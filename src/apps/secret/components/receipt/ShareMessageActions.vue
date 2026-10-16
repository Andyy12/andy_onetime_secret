<!-- src/apps/secret/components/receipt/ShareMessageActions.vue -->

<!--
  Receipt helpers under the secret link:
  - live countdown to expiry ("Expires in 6d 23h")
  - "Copy message" with a ready-to-send text, plus WhatsApp / email shortcuts
-->

<script setup lang="ts">
  import { useClipboard } from '@/shared/composables/useClipboard';
  import { formatDuration, useCountdown } from '@/shared/composables/useCountdown';
  import { computed, toRef } from 'vue';
  import { useI18n } from 'vue-i18n';

  import { buildShareMessage, emailShareUrl, whatsappShareUrl } from './shareMessage';

  interface Props {
    url: string;
    expiration?: Date | null;
    hasPassphrase?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    expiration: null,
    hasPassphrase: false,
  });

  const { t, locale } = useI18n();
  const { isCopied, copyToClipboard } = useClipboard();

  const { remainingMs, isExpired } = useCountdown(toRef(props, 'expiration'));

  const remainingText = computed(() =>
    remainingMs.value === null ? null : formatDuration(remainingMs.value, locale.value)
  );

  const message = computed(() =>
    buildShareMessage(
      {
        url: props.url,
        expiresIn: isExpired.value ? null : remainingText.value,
        hasPassphrase: props.hasPassphrase,
      },
      (key, named) => (named ? t(key, named) : t(key))
    )
  );

  const whatsappHref = computed(() => whatsappShareUrl(message.value));
  const emailHref = computed(() => emailShareUrl(t('web.share_message.email_subject'), message.value));

  const copyMessage = () => copyToClipboard(message.value);
</script>

<template>
  <div
    class="flex flex-col gap-3 border-t border-gray-200 px-5 py-3 dark:border-gray-700
      sm:flex-row sm:items-center sm:justify-between"
    data-testid="share-message-actions">
    <!-- Countdown -->
    <p
      v-if="remainingText !== null"
      class="flex items-center gap-1.5 text-sm"
      :class="isExpired ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'"
      data-testid="receipt-countdown">
      <svg
        viewBox="0 0 24 24"
        class="size-4 shrink-0"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true">
        <circle
          cx="12"
          cy="13"
          r="8" />
        <path d="M12 9v4l2.5 1.5M9 2h6" />
      </svg>
      <span v-if="isExpired">{{ t('web.share_message.expired') }}</span>
      <span v-else>
        {{ t('web.share_message.expires_in') }}
        <strong class="font-mono font-semibold tabular-nums">{{ remainingText }}</strong>
      </span>
    </p>

    <!-- Share actions -->
    <div
      v-if="!isExpired"
      class="flex flex-wrap items-center gap-2">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium shadow-sm
          transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        :class="
          isCopied
            ? 'bg-emerald-600 text-white dark:bg-emerald-500'
            : 'bg-brand-600 text-white hover:bg-brand-700'
        "
        data-testid="copy-share-message"
        @click="copyMessage">
        {{ isCopied ? t('web.STATUS.copied') : t('web.share_message.copy') }}
      </button>
      <a
        :href="whatsappHref"
        target="_blank"
        rel="noopener noreferrer"
        class="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700
          shadow-sm transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2
          focus-visible:ring-brand-500 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-200
          dark:hover:bg-slate-700"
        data-testid="share-whatsapp">
        WhatsApp
      </a>
      <a
        :href="emailHref"
        class="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700
          shadow-sm transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2
          focus-visible:ring-brand-500 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-200
          dark:hover:bg-slate-700"
        data-testid="share-email">
        {{ t('web.share_message.email') }}
      </a>
    </div>
  </div>
</template>
