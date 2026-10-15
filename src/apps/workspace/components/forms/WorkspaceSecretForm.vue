<!-- src/apps/workspace/components/forms/WorkspaceSecretForm.vue -->

<script setup lang="ts">
  /**
   * Workspace Secret Form
   *
   * A streamlined secret creation form for the workspace dashboard.
   * Privacy controls (TTL, passphrase) are managed via the parent's
   * PrivacyOptionsBar chips, not inline form fields.
   *
   * Key differences from SecretForm:
   * - Larger textarea for content
   * - Privacy inputs controlled externally via props
   * - Respects workspace mode toggle (stays on page or navigates to receipt)
   */
  import { useI18n } from 'vue-i18n';
  import BasicFormAlerts from '@/shared/components/forms/BasicFormAlerts.vue';
  import OIcon from '@/shared/components/icons/OIcon.vue';
  import SecretTitleInput from '@/shared/components/forms/SecretTitleInput.vue';
  import PasswordGeneratorConfig from '@/shared/components/forms/PasswordGeneratorConfig.vue';
  import SplitButton from '@/shared/components/ui/SplitButton.vue';
  import { useDomainContext } from '@/shared/composables/useDomainContext';
  import { usePrivacyOptions } from '@/shared/composables/usePrivacyOptions';
  import { useReceiptTitle } from '@/shared/composables/useReceiptTitle';
  import { useSecretConcealer } from '@/shared/composables/useSecretConcealer';
  import { loggingService } from '@/services/logging.service';
  import { useBootstrapStore } from '@/shared/stores/bootstrapStore';
  import { useLocalReceiptStore } from '@/shared/stores/localReceiptStore';
  import { storeToRefs } from 'pinia';
  import {
    DEFAULT_CORNER_CLASS,
    DEFAULT_BUTTON_TEXT_LIGHT,
  } from '@/shared/stores/identityStore';
  import { NEUTRAL_BRAND_DEFAULTS } from '@/shared/constants/brand';
  import { type LocalReceipt } from '@/types/ui/local-receipt';
  import { nanoid } from 'nanoid';
  import { computed, ref, watch } from 'vue';
  import { useRouter } from 'vue-router';
  import { useMediaQuery } from '@vueuse/core';
  import { useCharCounter } from '@/shared/composables/useCharCounter';
  import { useTextarea } from '@/shared/composables/useTextarea';

  const { t } = useI18n();
  const router = useRouter();

  export interface Props {
    /** Corner styling class */
    cornerClass?: string;
    /** Primary brand color */
    primaryColor?: string;
    /** Whether button text should be light */
    buttonTextLight?: boolean;
  }

  // Props not destructured - accessed via template bindings or unprefixed in script
  withDefaults(defineProps<Props>(), {
    cornerClass: DEFAULT_CORNER_CLASS,
    primaryColor: NEUTRAL_BRAND_DEFAULTS.primary_color,
    buttonTextLight: DEFAULT_BUTTON_TEXT_LIGHT,
  });

  const emit = defineEmits<{
    /** Emitted after successful secret creation with the response data */
    (e: 'created', response: LocalReceipt): void;
  }>();

  const localReceiptStore = useLocalReceiptStore();

  // Get global defaults
  const bootstrapStore = useBootstrapStore();
  const { secret_options } = storeToRefs(bootstrapStore);
  const defaultTtl = computed(() => secret_options.value?.default_ttl ?? 604800);

  const { currentContext, isContextActive } = useDomainContext();

  // Textarea setup with larger dimensions for workspace
  const maxLength = 10000;
  const {
    content,
    charCount,
    textareaRef,
    checkContentLength,
    clearTextarea,
  } = useTextarea({
    maxLength,
    initialContent: '',
    maxHeight: 500,
    onContentChange: () => {},
  });

  const { isHovering, formatNumber } = useCharCounter();

  // Computed properties for character counter
  const showCounter = computed(
    () => isHovering.value || charCount.value > maxLength / 2
  );
  const formattedCharCount = computed(() => formatNumber(charCount.value));
  const formattedMaxLength = computed(() => formatNumber(maxLength));
  const statusColor = computed(() => {
    const percentage = charCount.value / maxLength;
    if (percentage < 0.8) return 'bg-emerald-400 dark:bg-emerald-500';
    if (percentage < 0.95) return 'bg-amber-400 dark:bg-amber-500';
    return 'bg-red-400 dark:bg-red-500';
  });

  // Optional owner-only title, saved as the receipt memo (see useReceiptTitle)
  const receiptTitle = useReceiptTitle();
  const { title: secretTitle } = receiptTitle;

  // Secret concealer with workspace mode behavior
  const { form, validation, operations, isSubmitting, submit } =
    useSecretConcealer({
      onSuccess: async (response) => {
        const timestamp = Date.now();
        const action = selectedAction.value;
        const domain = currentContext.value.domain;

        loggingService.debug('[WorkspaceSecretForm] onSuccess', {
          timestamp,
          action,
          domain,
          receiptId: response?.record?.receipt?.identifier,
          receiptShortid: response?.record?.receipt?.shortid,
          workspaceMode: localReceiptStore.workspaceMode,
          hasPassphrase: !!form.passphrase,
          ttl: form.ttl,
        });

        if (!response) throw new Error('Response is missing');
        const newMessage: LocalReceipt = {
          id: nanoid(),
          receiptExtid: response.record.receipt.identifier,
          receiptShortid: response.record.receipt.shortid,
          secretExtid: response.record.secret.identifier,
          secretShortid: response.record.secret.shortid,
          shareDomain: response.record.share_domain,
          hasPassphrase: !!form.passphrase,
          ttl: form.ttl as number,
          createdAt: Date.now(),
          ...(receiptTitle.normalizedTitle.value && { memo: receiptTitle.normalizedTitle.value }),
        };
        // Add the message to the store
        localReceiptStore.addReceipt(newMessage);
        // Save the title on the account's receipt before the history refreshes
        await receiptTitle.persist(newMessage.receiptExtid);
        receiptTitle.reset();

        // Preserve TTL before reset (sticky setting)
        const preservedTtl = form.ttl;

        operations.reset();
        clearTextarea();

        // Restore TTL to previous value (sticky across submissions)
        operations.updateField('ttl', preservedTtl as number);

        loggingService.debug('[WorkspaceSecretForm] receipt created', {
          timestamp,
          action,
          domain,
          receiptShortid: newMessage.receiptShortid,
          secretShortid: newMessage.secretShortid,
        });
        emit('created', newMessage);

        // Navigate to receipt page if workspace mode is off OR if generating password
        // (generated passwords must be viewed on receipt page since they're only shown once)
        if (!localReceiptStore.workspaceMode || selectedAction.value === 'generate-password') {
          router.push(`/receipt/${newMessage.receiptExtid}`);
        } else {
          loggingService.debug('[WorkspaceSecretForm] staying on page', {
            timestamp,
            action,
            domain,
            workspaceMode: true,
          });
        }
      },
    });

  // Initialize TTL on mount: restore the user's last-used value when it is
  // still a valid option, otherwise fall back to the configured default.
  // Persisted as a minor preference via localReceiptStore (localStorage).
  const { lifetimeOptions } = usePrivacyOptions();
  const preferredTtl = localReceiptStore.preferredTtl;
  const isValidPreferredTtl =
    preferredTtl != null && lifetimeOptions.value.some((opt) => opt.value === preferredTtl);
  operations.updateField('ttl', isValidPreferredTtl ? preferredTtl : defaultTtl.value);

  // Sync content with form
  watch(content, (newContent) => {
    operations.updateField('secret', newContent);
  });

  // Watch for domain context changes and update form
  watch(
    () => currentContext.value.domain,
    (domain) => {
      if (domain) {
        operations.updateField('share_domain', domain);
      }
    },
    { immediate: true }
  );

  // Compute whether the form has content
  const hasContent = computed(
    () => !!content.value && content.value.trim().length > 0
  );

  // Track selected action from SplitButton
  const selectedAction = ref<'create-link' | 'generate-password'>('create-link');

  // Recipient field shows in create-link mode unless ui.capabilities.recipient
  // is explicitly disabled. An unset flag is treated as enabled (config default).
  const { uiCapabilities } = storeToRefs(bootstrapStore);
  const showRecipient = computed(
    () => selectedAction.value === 'create-link' && uiCapabilities.value?.recipient !== false
  );

  // Platform detection for keyboard hint (desktop only)
  const isDesktop = useMediaQuery('(min-width: 640px)');
  const isMac = computed(() =>
    typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)
  );
  const shortcutHint = computed(() => (isMac.value ? '⌘ Enter' : 'Ctrl Enter'));

  const generatedPassword = ref('');

  // Form submission handlers
  const handleSubmit = () => {
    // Use appropriate submission type based on selected action
    if (selectedAction.value === 'generate-password') {
      if (generatedPassword.value) {
        operations.updateField('secret', generatedPassword.value);
        return submit('conceal');
      }
      return submit('generate');
    }
    return submit('conceal');
  };

  // Expose form state and operations for parent component
  const currentTtl = computed(() => form.ttl as number);
  const currentPassphrase = computed(() => form.passphrase as string);

  const updateTtl = (value: number) => {
    operations.updateField('ttl', value);
    // Remember the choice so it is restored on the next page load
    localReceiptStore.setPreferredTtl(value);
  };

  const updatePassphrase = (value: string) => {
    operations.updateField('passphrase', value);
  };

  defineExpose({
    currentTtl,
    currentPassphrase,
    updateTtl,
    updatePassphrase,
    isSubmitting,
  });
</script>

<template>
  <div class="mx-auto min-w-[320px] max-w-full space-y-6">
    <!-- Alert Display -->
    <BasicFormAlerts
      :errors="Array.from(validation.errors.values())"
      class="sticky top-4 z-50" />

    <form
      @submit.prevent="handleSubmit"
      :aria-busy="isSubmitting"
      class="space-y-6">
      <!-- Main Content Card -->
      <div
        :class="[cornerClass]"
        class="overflow-visible border border-gray-200/60
          bg-gradient-to-br from-white to-gray-50/30
          shadow-[0_4px_16px_rgb(0,0,0,0.08),0_1px_4px_rgb(0,0,0,0.06)]
          backdrop-blur-sm
          dark:border-gray-700/60 dark:from-slate-900 dark:to-slate-800/30
          dark:shadow-[0_4px_16px_rgb(0,0,0,0.3),0_1px_4px_rgb(0,0,0,0.2)]">
        <!-- Content Section -->
        <div class="p-6">
          <!-- Textarea for Create Link mode -->
          <div v-show="selectedAction === 'create-link'">
            <label
              id="workspaceSecretLabel"
              class="sr-only">
              {{ t('web.secrets.secret_content') || 'Secret Content' }}
            </label>

            <div class="relative">
              <textarea
                ref="textareaRef"
                v-model="content"
                :disabled="isSubmitting"
                @input="checkContentLength"
                :maxlength="maxLength"
                :class="[cornerClass]"
                style="min-height: 280px; max-height: 500px"
                class="block w-full resize-none
                  rounded-lg border border-gray-200/60 p-4
                  font-mono text-base leading-relaxed
                  text-gray-900 transition-all
                  duration-300 placeholder:text-gray-400
                  bg-white/80 backdrop-blur-sm
                  hover:border-gray-300/80 hover:bg-white/90
                  focus:border-blue-500/80 focus:bg-white
                  focus:ring-4 focus:ring-blue-500/20
                  disabled:bg-gray-50/80 disabled:text-gray-500
                  dark:border-gray-700/60 dark:bg-slate-800/80
                  dark:text-white dark:placeholder:text-gray-500
                  dark:hover:border-gray-600/80 dark:hover:bg-slate-800/90
                  dark:focus:border-blue-400/80 dark:focus:bg-slate-800
                  dark:focus:ring-blue-400/20
                  dark:disabled:bg-slate-900/50"
                :placeholder="t('web.COMMON.secret_placeholder')"
                aria-labelledby="workspaceSecretLabel">
              </textarea>

              <!-- Character Counter -->
              <div
                v-if="showCounter"
                class="pointer-events-none absolute bottom-4 right-4 flex
                  select-none items-center gap-2
                  rounded-full bg-white/95 px-3.5 py-1.5 text-sm
                  shadow-[0_4px_12px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.08)]
                  backdrop-blur-md transition-all duration-300
                  border border-gray-200/40
                  dark:bg-gray-800/95 dark:border-gray-700/40
                  dark:shadow-[0_4px_12px_rgba(0,0,0,0.3),0_1px_3px_rgba(0,0,0,0.2)]">
                <span
                  :class="[statusColor, 'size-2.5 rounded-full shadow-sm']"
                  aria-hidden="true" ></span>
                <span
                  class="font-semibold text-gray-700 dark:text-gray-300 tabular-nums">
                  {{ formattedCharCount }} / {{ formattedMaxLength }}
                </span>
              </div>
            </div>
          </div>

          <!-- Title Field (owner-only, saved as the receipt memo) -->
          <SecretTitleInput
            v-model="secretTitle"
            :corner-class="cornerClass"
            :disabled="isSubmitting"
            class="mt-4" />

          <!-- Recipient Field (create-link mode only) -->
          <div
            v-if="showRecipient"
            class="mt-4">
            <label
              for="workspace-recipient"
              class="mb-1 block font-brand text-sm text-gray-600 dark:text-gray-300">
              {{ t('web.COMMON.secret_recipient_address') || 'Email Recipient' }}
            </label>
            <div class="relative">
              <input
                id="workspace-recipient"
                :value="form.recipient"
                type="email"
                name="recipient[]"
                autocomplete="email"
                :placeholder="t('web.COMMON.email_placeholder')"
                :class="[cornerClass]"
                class="w-full border border-gray-200/60 bg-white/80 backdrop-blur-sm
                  py-2.5 pl-4 pr-4 text-sm text-gray-900 placeholder:text-gray-400
                  transition-colors duration-200
                  hover:border-gray-300/80 hover:bg-white/90
                  focus:border-blue-500/80 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/20
                  dark:border-gray-700/60 dark:bg-slate-800/80 dark:text-white dark:placeholder:text-gray-500
                  dark:hover:border-gray-600/80 dark:hover:bg-slate-800/90
                  dark:focus:border-blue-400/80 dark:focus:bg-slate-800 dark:focus:ring-blue-400/20"
                @input="(e) => operations.updateField('recipient', (e.target as HTMLInputElement).value)" />
            </div>
          </div>

          <!-- Generate Password display for Generate mode -->
          <div
            v-show="selectedAction === 'generate-password'"
            :class="[cornerClass]">
            <PasswordGeneratorConfig
              :corner-class="cornerClass"
              @update:password="(val) => (generatedPassword = val)" />
          </div>
        </div>

        <!-- Actions Footer -->
        <div class="border-t border-gray-200/50 dark:border-gray-700/50">
          <div class="p-4 sm:p-6">
            <!-- Main action row -->
            <div
              class="flex items-center justify-between gap-4">
              <!-- Domain Context Indicator (sm+ only; on mobile it appears in the CTA button) -->
              <div
                v-if="isContextActive"
                class="hidden items-center text-base font-brand sm:flex">
                <div
                  class="inline-flex items-center gap-1.5 rounded-full px-3
                    py-1.5 text-base font-medium transition-all duration-150"
                  :class="
                    currentContext.isCanonical
                      ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      : 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                  "
                  role="status"
                  :aria-label="
                    t('web.LABELS.scope_indicator', {
                      domain: currentContext.displayName,
                    })
                  ">
                  <OIcon
                    collection="heroicons"
                    :name="
                      currentContext.isCanonical
                        ? 'user-circle'
                        : 'building-office'
                    "
                    class="size-4"
                    aria-hidden="true" />
                  <span class="max-w-[180px] truncate">
                    {{ currentContext.displayName }}
                  </span>
                </div>
              </div>

              <!-- Submit Area (full-width on mobile, right-aligned on sm+) -->
              <div class="flex w-full items-center gap-2.5 sm:ml-auto sm:w-auto">
                <SplitButton
                  :with-generate="true"
                  :corner-class="cornerClass"
                  :primary-color="primaryColor"
                  :button-text-light="buttonTextLight"
                  :disabled="selectedAction === 'create-link' && !hasContent"
                  :disable-generate="selectedAction === 'create-link' && hasContent"
                  :keyboard-shortcut-enabled="true"
                  :show-keyboard-hint="false"
                  :subtitle="isContextActive ? currentContext.displayName : ''"
                  @update:action="selectedAction = $event" />
              </div>
            </div>

            <!-- Keyboard hint row (desktop only) -->
            <div
              v-if="isDesktop"
              class="mt-2 flex justify-end">
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ shortcutHint }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>
