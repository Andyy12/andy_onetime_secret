<!-- src/apps/secret/components/branded/SecretDisplayCase.vue -->

<script setup lang="ts">
  import BaseSecretDisplay from '@/apps/secret/components/branded/BaseSecretDisplay.vue';
  import { brandSettingsSchema } from '@/schemas/shapes/v3/custom-domain';
  import type { Secret, SecretDetails } from '@/schemas/shapes/v3/secret';
  import { useClipboard } from '@/shared/composables/useClipboard';
  import { useDecryptReveal } from '@/shared/composables/useDecryptReveal';
  import { computed, onMounted } from 'vue';
  import { useI18n } from 'vue-i18n';

  // Default brand settings for when no custom branding is configured
  const defaultBrandSettings = brandSettingsSchema.parse({});

  interface Props {
    record: Secret | null;
    details: SecretDetails | null;
    domainId: string;
    submissionStatus?: {
      status: 'idle' | 'submitting' | 'success' | 'error';
      message?: string;
    };
  }

  const props = defineProps<Props>();
  const i18n = useI18n();
  const { t } = i18n;

  const isRevealed = computed(() => !!props.record?.secret_value && props.record.secret_value !== '');

  const productIdentity = useProductIdentity();

  // Use computed properties directly from identityStore (already parsed with v3 schema)
  const cornerClass = computed(() => productIdentity.cornerClass);
  const fontFamilyClass = computed(() => productIdentity.fontFamilyClass);
  const headingFontClass = computed(() => productIdentity.headingFontClass);

  const alertClasses = computed(() => ({
    'mb-4 p-4 rounded-md': true,
    'bg-branddim-50 text-branddim-700 dark:bg-branddim-900 dark:text-branddim-100':
      props.submissionStatus?.status === 'error',
    'bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-100':
      props.submissionStatus?.status === 'success',
  }));

  // One-shot reveal: lock opens, text decrypts into place
  const secretValue = computed(() => props.record?.secret_value);
  const { phase, displayValue, start: startReveal, skip: skipReveal } =
    useDecryptReveal(secretValue);
  const isRevealing = computed(() => phase.value !== 'done');
  onMounted(startReveal);

  const { isCopied, copyToClipboard } = useClipboard();

  const copySecretContent = async () => {
    if (props.record?.secret_value === undefined) {
      return;
    }

    skipReveal();
    await copyToClipboard(props.record?.secret_value);

    // Announce copy success to screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.textContent = t('web.secrets.secret_content_copied_to_clipboard');
    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);
  };

  const isCopiedText = computed(() => (isCopied.value ? t('web.STATUS.copied') : t('web.LABELS.copy_to_clipboard')));
</script>

<template>
  <!-- Updated -->
  <BaseSecretDisplay
    :default-title="t('web.secrets.you_have_a_message')"
    :preview-i18n="i18n"
    :domain-branding="productIdentity.brand ?? defaultBrandSettings"
    :corner-class="cornerClass"
    :font-class="fontFamilyClass"
    :heading-class="headingFontClass"
    :is-revealed="isRevealed">
    <!-- Alert display -->
    <div
      v-if="
        submissionStatus?.status === 'error' || submissionStatus?.status === 'success'
      "
      :class="alertClasses"
      role="alert"
      aria-live="polite">
      <div class="flex">
        <div class="shrink-0">
          <svg
            v-if="submissionStatus.status === 'error'"
            class="size-5"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd" />
          </svg>
          <svg
            v-else
            class="size-5"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm">
            {{
              submissionStatus.message ||
                (submissionStatus.status === 'error' ? t('web.COMMON.an_error_occurred') : t('web.STATUS.success'))
            }}
          </p>
        </div>
      </div>
    </div>

    <template #content>
      <div class="relative size-full p-0">
        <!-- Unlock stage badge -->
        <div
          v-if="!record?.verification"
          class="mb-4 flex justify-center"
          aria-hidden="true">
          <div class="relative flex size-16 items-center justify-center">
            <span
              v-if="isRevealing"
              class="reveal-ring absolute inset-0 rounded-full border-2 border-brand-400"></span>
            <span
              class="reveal-badge relative flex size-14 items-center justify-center rounded-full
                bg-brand-50 text-brand-600 ring-1 ring-brand-600/20
                dark:bg-brand-400/10 dark:text-brand-400 dark:ring-brand-400/30">
              <svg
                viewBox="0 0 24 24"
                class="size-7"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round">
                <rect
                  x="4"
                  y="11"
                  width="16"
                  height="10"
                  rx="2" />
                <path
                  class="reveal-shackle"
                  d="M8 11V7a4 4 0 0 1 8 0v4" />
                <circle
                  cx="12"
                  cy="16"
                  r="1.25"
                  class="fill-brandcomp-400 stroke-none" />
              </svg>
            </span>
          </div>
        </div>

        <div
          :class="[
            cornerClass,
            'size-full overflow-hidden border transition-colors duration-500',
            isRevealing
              ? 'border-brand-400/60 bg-brand-50/60 text-brand-700 dark:border-brand-400/40 dark:bg-brand-400/5 dark:text-brand-300'
              : 'border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white',
          ]">
          <label
            :for="'secret-content-' + record?.identifier"
            class="sr-only">
            {{ t('web.secrets.secret_content') }}
          </label>
          <textarea
            :id="'secret-content-' + record?.identifier"
            class="block size-full min-h-32 resize-none border-none bg-transparent p-3 font-mono text-base focus:ring-2 focus:ring-brand-500 focus:outline-none sm:min-h-36 dark:text-white"
            readonly
            :rows="details?.display_lines ?? 4"
            :value="displayValue"
            :aria-busy="isRevealing"
            :aria-label="t('web.secrets.secret_content')"
            data-testid="secret-content"
            ref="secretContent"></textarea>
        </div>

        <div
          v-if="record?.secret_value && isRevealing"
          class="mt-1.5 flex items-center justify-between text-xs">
          <span
            class="font-mono uppercase tracking-wider text-brand-700 dark:text-brand-300"
            aria-hidden="true">
            {{ t('web.secrets.revealing') }}
          </span>
          <button
            type="button"
            class="font-medium text-brand-700 underline-offset-2 hover:underline dark:text-brand-300"
            data-testid="secret-reveal-skip"
            @click="skipReveal">
            {{ t('web.secrets.skip_animation') }}
          </button>
        </div>

        <!-- Burned notice -->
        <Transition
          enter-active-class="transition duration-500 ease-out motion-reduce:transition-none"
          enter-from-class="translate-y-1 opacity-0"
          enter-to-class="translate-y-0 opacity-100">
          <div
            v-if="!record?.verification && record?.secret_value && !isRevealing"
            class="mt-4 flex items-start gap-3 rounded-lg border border-brandcomp-600/30 bg-brandcomp-50 p-4
              dark:border-brandcomp-400/30 dark:bg-brandcomp-400/10"
            role="status"
            aria-live="polite"
            data-testid="secret-burned-notice">
            <svg
              viewBox="0 0 24 24"
              class="mt-0.5 size-5 shrink-0 text-brandcomp-700 dark:text-brandcomp-300"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true">
              <path d="M12 22c4 0 7-2.7 7-6.6 0-3.1-2-5.3-3.6-7-.4 1.9-1.4 3.1-2.6 3.6.3-3.4-1-6.4-3.8-9-.3 3.6-2.2 5.8-3.6 7.6C4.3 12.1 5 13.7 5 15.4 5 19.3 8 22 12 22Z" />
            </svg>
            <div>
              <p class="font-brand text-sm font-semibold text-brandcomp-800 dark:text-brandcomp-300">
                {{ t('web.secrets.burned_title') }}
              </p>
              <p class="mt-0.5 text-sm text-gray-700 dark:text-gray-300">
                {{ t('web.secrets.burned_body') }}
              </p>
            </div>
          </div>
        </Transition>
      </div>
    </template>

    <template #action-button>
      <button
        @click="copySecretContent"
        :title="isCopiedText"
        class="inline-flex items-center justify-center rounded-md bg-brand-500 px-4 py-2.5 text-sm font-medium shadow-sm transition-colors duration-150 ease-in-out hover:bg-brand-600 hover:shadow focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        :class="[
          fontFamilyClass,
          cornerClass,
          productIdentity.buttonTextLight ? 'text-white' : 'text-gray-900',
        ]"
        aria-live="polite"
        :aria-label="isCopied ? t('web.COMMON.secret_copied_to_clipboard') : t('web.COMMON.copy_secret_to_clipboard')"
        :aria-pressed="isCopied">
        <svg
          v-if="!isCopied"
          xmlns="http://www.w3.org/2000/svg"
          class="mr-2 size-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          class="mr-2 size-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7" />
        </svg>
        <span>{{ isCopied ? t('web.STATUS.copied') : t('web.LABELS.copy_to_clipboard') }}</span>
      </button>
    </template>
  </BaseSecretDisplay>
</template>

<style scoped>
  /* Ensure focus outline is visible in all color schemes */
  :focus {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }
</style>
