<!-- src/apps/secret/components/canonical/SecretConfirmationForm.vue -->

<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  import NeedHelpModal from '@/shared/components/modals/NeedHelpModal.vue';
  import SecretRecipientHelpContent from '@/apps/secret/components/SecretRecipientHelpContent.vue';
  import { useBootstrapStore } from '@/shared/stores/bootstrapStore';
  import type { Secret, SecretDetails } from '@/schemas/shapes/v3/secret';
  import { ref, computed } from 'vue';

  const bootstrapStore = useBootstrapStore();
  const helpEnabled = computed(() => bootstrapStore.ui?.help?.enabled ?? true);

  interface Props {
    secretIdentifier: string;
    record: Secret | null;
    details: SecretDetails | null;
    isSubmitting: boolean;
    error: unknown;
  }

  const props = defineProps<Props>();
  const emit = defineEmits(['user-confirmed']);
  const { t } = useI18n();

  const passphrase = ref('');

  // Generate unique IDs for ARIA attributes based on secretIdentifier
  const formHeadingId = computed(() => `form-heading-${props.secretIdentifier}`);
  const passphraseInputId = computed(() => `passphrase-${props.secretIdentifier}`);
  const passphraseHeadingId = computed(() => `passphrase-heading-${props.secretIdentifier}`);
  const passphraseDescriptionId = computed(() => `passphrase-description-${props.secretIdentifier}`);

  // Determine the primary status message based on record state
  const statusMessage = computed(() => {
    // Secret has passphrase protection
    if (props.record?.has_passphrase) {
      return t('web.shared.requires_passphrase');
    }
    // Verification secret (no passphrase)
    if (props.record?.verification) {
      return t('web.COMMON.click_to_verify');
    }
    // Regular secret without passphrase - just needs confirmation click
    return t('web.COMMON.click_to_continue');
  });

  // Account-verification links keep the neutral "continue" wording; real
  // secrets get an explicit "Reveal secret".
  const submitLabel = computed(() => {
    if (props.isSubmitting) return t('web.secrets.revealing');
    return props.record?.verification
      ? t('web.COMMON.click_to_continue')
      : t('web.secrets.reveal_button');
  });

  // Handle form submission
  const submitForm = async () => {
    emit('user-confirmed', passphrase.value);
  };
</script>

<template>
  <div
    :class="['w-full', 'rounded-lg bg-white p-8 dark:bg-gray-800']"
    role="region"
    :aria-labelledby="formHeadingId">
    <!-- Header section with title, status, and help link -->
    <div class="mb-4 flex items-start justify-between">
      <div>
        <h1
          :id="formHeadingId"
          class="text-xl font-bold text-gray-800 dark:text-gray-200">
          {{ statusMessage }}
        </h1>
      </div>

      <!-- Help Modal Trigger positioned to the right -->
      <NeedHelpModal
        v-if="helpEnabled"
        link-icon-name="question-mark-circle-16-solid"
        link-text-label="">
        <!-- prettier-ignore-attribute class -->
        <button
          type="button"
          class="ml-4 text-sm font-medium
            text-brand-600 hover:text-brand-500
            focus:underline focus:outline-none dark:text-brand-400 dark:hover:text-brand-300"
          data-testid="secret-help-modal-trigger">
          {{ t('web.COMMON.need_help') }}?
        </button>
        <template #content>
          <SecretRecipientHelpContent />
        </template>
      </NeedHelpModal>
    </div>

    <!-- One-time warning: amber is the brand's "decision" colour. Shown for
         every secret (with or without passphrase) before the reveal. -->
    <div
      v-if="!record?.verification"
      class="mb-6 flex items-start gap-3 rounded-lg border border-brandcomp-600/30 bg-brandcomp-50 p-4
        dark:border-brandcomp-400/30 dark:bg-brandcomp-400/10"
      role="note"
      data-testid="secret-reveal-once-notice">
      <span
        class="flex size-10 shrink-0 items-center justify-center rounded-full bg-brandcomp-100 text-brandcomp-700
          dark:bg-brandcomp-400/15 dark:text-brandcomp-300"
        aria-hidden="true">
        <!-- Eye with a single-use "1" -->
        <svg
          viewBox="0 0 24 24"
          class="size-6"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <path d="M11 10.2 12.4 9v6" />
        </svg>
      </span>
      <div>
        <p class="font-brand text-base font-semibold text-brandcomp-800 dark:text-brandcomp-300">
          {{ t('web.secrets.reveal_once_title') }}
        </p>
        <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
          {{ t('web.secrets.reveal_once_body') }}
        </p>
      </div>
    </div>

    <form
      @submit.prevent="submitForm"
      class="space-y-6"
      :aria-labelledby="record?.has_passphrase ? passphraseHeadingId : undefined"
      :aria-describedby="record?.has_passphrase ? passphraseDescriptionId : undefined"
      data-testid="secret-confirmation-form">
      <!-- Hidden username field for accessibility/password managers -->
      <input
        type="text"
        name="username"
        autocomplete="username"
        class="sr-only"
        tabindex="-1"
        aria-hidden="true" />

      <!-- Conditional Passphrase Section -->
      <div
        v-if="record?.has_passphrase"
        class="space-y-2">
        <div>
          <label
            :for="passphraseInputId"
            class="sr-only">
            {{ t('web.COMMON.enter_passphrase_here') }}
          </label>
          <!-- prettier-ignore-attribute class -->
          <input
            v-model="passphrase"
            :id="passphraseInputId"
            type="password"
            name="passphrase"
            class="w-full rounded-md border border-gray-300 px-3 py-2
              focus:outline-none focus:ring-2 focus:ring-brand-500
              dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            autocomplete="current-password"
            :placeholder="t('web.COMMON.enter_passphrase_here')"
            aria-required="true"
            :aria-invalid="error ? 'true' : undefined"
            :aria-errormessage="error ? 'passphrase-error' : undefined"
            :aria-describedby="passphraseDescriptionId"
            data-testid="secret-reveal-passphrase-input" />
        </div>
        <p
          v-if="error"
          id="passphrase-error"
          class="mt-1 text-sm text-red-600 dark:text-red-400"
          role="alert"
          data-testid="secret-reveal-error">
          {{ String(error) }}
        </p>
      </div>

      <!-- Submission Button -->
      <button
        type="submit"
        :disabled="isSubmitting"
        :class="[
          'group flex w-full items-center justify-center gap-3 rounded-lg bg-brand-600 px-6 py-3.5 text-lg font-semibold text-white transition duration-150 ease-in-out',
          'hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-brand-400 dark:focus:ring-offset-gray-800',
        ]"
        data-testid="secret-reveal-submit">
        <!-- Lock whose shackle lifts on hover: a hint of what the click does -->
        <svg
          viewBox="0 0 24 24"
          class="size-5"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true">
          <rect
            x="4"
            y="11"
            width="16"
            height="10"
            rx="2" />
          <path
            class="origin-[16px_11px] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:rotate-12 motion-reduce:transition-none"
            d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
        <span>{{ submitLabel }}</span>
      </button>
    </form>
  </div>
</template>
