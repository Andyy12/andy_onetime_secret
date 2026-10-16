<!-- src/apps/secret/components/conceal/IncomingCallout.vue -->

<!--
  Homepage entry point to the incoming-secrets form (/incoming).

  Only rendered when the install enables incoming secrets on the canonical
  domain (features.incoming ← INCOMING_ENABLED). Visitors get a link to send
  a secret to the team; signed-in team members also get a "copy request link"
  action to paste into a chat or email when asking a client for credentials.
-->

<script setup lang="ts">
  import { useClipboard } from '@/shared/composables/useClipboard';
  import { useBootstrapStore } from '@/shared/stores/bootstrapStore';
  import { storeToRefs } from 'pinia';
  import { computed } from 'vue';
  import { useI18n } from 'vue-i18n';

  const { t } = useI18n();
  const { features, authenticated } = storeToRefs(useBootstrapStore());
  const { isCopied, copyToClipboard } = useClipboard();

  const isEnabled = computed(() => features.value?.incoming === true);

  const requestUrl = computed(() =>
    typeof window === 'undefined' ? '/incoming' : `${window.location.origin}/incoming`
  );

  const copyRequestLink = () => copyToClipboard(requestUrl.value);
</script>

<template>
  <section
    v-if="isEnabled"
    class="flex flex-col gap-4 rounded-lg border border-gray-200/70 bg-white/70 p-5 shadow-sm
      backdrop-blur-sm dark:border-gray-700/60 dark:bg-slate-900/60 sm:flex-row sm:items-center
      sm:justify-between"
    data-testid="incoming-callout">
    <div class="flex items-start gap-3">
      <span
        class="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600
          dark:bg-brand-400/10 dark:text-brand-400"
        aria-hidden="true">
        <!-- Inbox tray: something arrives for the team -->
        <svg
          viewBox="0 0 24 24"
          class="size-5"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round">
          <path d="M3 13h4.5l1.5 3h6l1.5-3H21" />
          <path d="M5.2 5.6 3 13v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5l-2.2-7.4A2 2 0 0 0 16.9 4H7.1a2 2 0 0 0-1.9 1.6Z" />
        </svg>
      </span>
      <div>
        <h2 class="font-brand text-sm font-semibold text-gray-900 dark:text-white">
          {{ t('web.incoming_callout.title') }}
        </h2>
        <p class="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
          {{ t('web.incoming_callout.body') }}
        </p>
      </div>
    </div>

    <div class="flex shrink-0 flex-wrap gap-2">
      <button
        v-if="authenticated"
        type="button"
        class="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700
          shadow-sm transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2
          focus-visible:ring-brand-500 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-200
          dark:hover:bg-slate-700"
        data-testid="incoming-copy-request-link"
        @click="copyRequestLink">
        {{ isCopied ? t('web.incoming_callout.link_copied') : t('web.incoming_callout.copy_link') }}
      </button>
      <router-link
        to="/incoming"
        class="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition
          hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500
          focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
        data-testid="incoming-callout-link">
        {{ t('web.incoming_callout.send') }}
      </router-link>
    </div>
  </section>
</template>
