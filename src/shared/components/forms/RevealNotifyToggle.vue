<!-- src/shared/components/forms/RevealNotifyToggle.vue -->

<!--
  Inline switch for the account-level "email me when a secret is revealed"
  preference (cust.notify_on_reveal), surfaced on the create form so people
  find it where they share secrets. Same field and endpoint as Settings →
  Notifications; the backend (V3 RevealSecret#notify_owner_of_reveal) sends
  the secret_revealed email. Applies to every secret of the account, which
  the hint text says plainly.
-->

<script setup lang="ts">
  import { useAccountStore } from '@/shared/stores/accountStore';
  import { computed, onMounted, ref } from 'vue';
  import { useI18n } from 'vue-i18n';

  const { t } = useI18n();
  const accountStore = useAccountStore();

  const isSaving = ref(false);
  const hasError = ref(false);

  const isOn = computed(() => accountStore.account?.cust?.notify_on_reveal ?? false);
  const isReady = computed(() => !!accountStore.account?.cust);

  const toggle = async () => {
    isSaving.value = true;
    hasError.value = false;
    try {
      await accountStore.updateNotificationPreference('notify_on_reveal', !isOn.value);
    } catch {
      hasError.value = true;
    } finally {
      isSaving.value = false;
    }
  };

  onMounted(async () => {
    if (isReady.value) return;
    try {
      await accountStore.fetch();
    } catch {
      /* the switch simply stays hidden if the account can't be loaded */
    }
  });
</script>

<template>
  <div
    v-if="isReady"
    class="flex items-start justify-between gap-4"
    data-testid="reveal-notify-toggle">
    <div>
      <p
        id="reveal-notify-label"
        class="font-brand text-sm text-gray-700 dark:text-gray-300">
        {{ t('web.reveal_notify.label') }}
      </p>
      <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
        {{ hasError ? t('web.settings.notifications.error_updating') : t('web.reveal_notify.hint') }}
      </p>
    </div>
    <button
      type="button"
      role="switch"
      :aria-checked="isOn"
      aria-labelledby="reveal-notify-label"
      :disabled="isSaving"
      :aria-busy="isSaving"
      :class="[
        isOn ? 'bg-brand-600 dark:bg-brand-500' : 'bg-gray-200 dark:bg-gray-700',
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      ]"
      @click="toggle">
      <span
        aria-hidden="true"
        :class="[
          isOn ? 'translate-x-5' : 'translate-x-0',
          'pointer-events-none inline-block size-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
        ]"></span>
    </button>
  </div>
</template>
