<!-- src/shared/components/forms/SecretTitleInput.vue -->

<script setup lang="ts">
  import { RECEIPT_TITLE_MAX_LENGTH } from '@/shared/composables/useReceiptTitle';
  import { useId } from 'vue';
  import { useI18n } from 'vue-i18n';

  /*
    Optional title for a secret, shown only to its creator in their history.
    Stored as the receipt memo (see useReceiptTitle); the recipient never sees
    it. Used by both SecretForm and WorkspaceSecretForm.
  */

  withDefaults(
    defineProps<{
      cornerClass?: string;
      disabled?: boolean;
    }>(),
    {
      cornerClass: 'rounded-lg',
      disabled: false,
    }
  );

  const title = defineModel<string>({ default: '' });

  const { t } = useI18n();

  const inputId = `secret-title-${useId()}`;
  const helpId = `${inputId}-help`;
</script>

<template>
  <div>
    <label
      :for="inputId"
      class="mb-1 block font-brand text-sm text-gray-600 dark:text-gray-300">
      {{ t('web.secrets.title_label') }}
    </label>
    <!-- prettier-ignore-attribute class -->
    <input
      :id="inputId"
      v-model="title"
      type="text"
      name="title"
      autocomplete="off"
      :maxlength="RECEIPT_TITLE_MAX_LENGTH"
      :disabled="disabled"
      :placeholder="t('web.secrets.title_placeholder')"
      :aria-describedby="helpId"
      :class="[cornerClass]"
      class="w-full border border-gray-200/60 bg-white/80 backdrop-blur-sm
        px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400
        transition-colors duration-200
        hover:border-gray-300/80 hover:bg-white/90
        focus:border-brand-500/80 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/20
        disabled:cursor-not-allowed disabled:opacity-50
        dark:border-gray-700/60 dark:bg-slate-800/80 dark:text-white dark:placeholder:text-gray-500
        dark:hover:border-gray-600/80 dark:hover:bg-slate-800/90
        dark:focus:border-brand-400/80 dark:focus:bg-slate-800 dark:focus:ring-brand-400/20"
      data-testid="secret-title-input" />
    <p
      :id="helpId"
      class="mt-1 text-xs text-gray-500 dark:text-gray-400">
      {{ t('web.secrets.title_help') }}
    </p>
  </div>
</template>
