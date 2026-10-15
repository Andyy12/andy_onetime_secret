<!-- src/shared/components/forms/PasswordGeneratorConfig.vue -->

<script setup lang="ts">
  import { computed, ref, watch } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useClipboard } from '@/shared/composables/useClipboard';
  import {
    GENERATOR_MAX_LENGTH,
    GENERATOR_MIN_LENGTH,
    loadGeneratorPrefs,
    saveGeneratorPrefs,
    usePasswordGenerator,
  } from '@/shared/composables/usePasswordGenerator';

  interface Props {
    cornerClass?: string;
    /** Explicit length; when omitted, the viewer's saved length (or 16) is used. */
    initialLength?: number;
    showDirectCopy?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    cornerClass: 'rounded-lg',
    initialLength: undefined,
    showDirectCopy: true,
  });

  const emit = defineEmits<{
    (e: 'update:password', value: string): void;
    (
      e: 'change',
      payload: {
        password: string;
        length: number;
        character_sets: {
          uppercase: boolean;
          lowercase: boolean;
          numbers: boolean;
          symbols: boolean;
          exclude_ambiguous: boolean;
        };
      }
    ): void;
  }>();

  const { t } = useI18n();

  // Restore this viewer's last generator settings (length + character sets).
  const savedPrefs = loadGeneratorPrefs();

  const {
    length,
    uppercase,
    lowercase,
    numbers,
    symbols,
    excludeAmbiguous,
    password,
    strength,
    generate,
  } = usePasswordGenerator({
    ...savedPrefs,
    length: props.initialLength ?? savedPrefs?.length ?? 16,
  });

  const { isCopied, copyToClipboard } = useClipboard();

  const isRotating = ref(false);

  const handleRegenerate = () => {
    isRotating.value = true;
    generate();
    setTimeout(() => {
      isRotating.value = false;
    }, 400);
  };

  const handleCopy = async () => {
    if (password.value) {
      await copyToClipboard(password.value);
    }
  };

  // Sync emitted data whenever password or options change
  watch(
    [password, length, uppercase, lowercase, numbers, symbols, excludeAmbiguous],
    () => {
      emit('update:password', password.value);
      emit('change', {
        password: password.value,
        length: length.value,
        character_sets: {
          uppercase: uppercase.value,
          lowercase: lowercase.value,
          numbers: numbers.value,
          symbols: symbols.value,
          exclude_ambiguous: excludeAmbiguous.value,
        },
      });
    },
    { immediate: true }
  );

  // Remember the settings the viewer actually changes (not on first render).
  watch([length, uppercase, lowercase, numbers, symbols, excludeAmbiguous], () => {
    saveGeneratorPrefs({
      length: length.value,
      uppercase: uppercase.value,
      lowercase: lowercase.value,
      numbers: numbers.value,
      symbols: symbols.value,
      excludeAmbiguous: excludeAmbiguous.value,
    });
  });

  const strengthLabelText = computed(() => {
    switch (strength.value.score) {
      case 4:
        return t('web.generator.strength_very_strong');
      case 3:
        return t('web.generator.strength_strong');
      case 2:
        return t('web.generator.strength_good');
      case 1:
        return t('web.generator.strength_weak');
      default:
        return t('web.generator.strength_very_weak');
    }
  });
</script>

<template>
  <div
    class="space-y-5 rounded-lg border border-brand-200/60 bg-white/90 p-5 shadow-sm
      backdrop-blur-sm dark:border-brand-700/50 dark:bg-slate-900/90"
    :class="[cornerClass]">
    <!-- Header title -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span
          class="flex size-7 items-center justify-center rounded-full bg-brand-50 text-brand-600
            dark:bg-brand-900/40 dark:text-brand-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="size-4">
            <path
              d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
          </svg>
        </span>
        <h4 class="font-brand text-sm font-semibold text-gray-900 dark:text-white">
          {{ t('web.generator.title') }}
        </h4>
      </div>
      <span
        class="text-xs font-medium"
        :class="strength.colorClass">
        {{ strengthLabelText }}
      </span>
    </div>

    <!-- Password preview & action buttons -->
    <div
      class="group relative flex items-center justify-between rounded-lg border border-gray-200
        bg-gray-50/90 px-3.5 py-3 transition-colors hover:border-gray-300
        dark:border-gray-700 dark:bg-gray-800/80 dark:hover:border-gray-600">
      <div
        class="min-w-0 flex-1 select-all truncate font-mono text-base font-semibold tracking-wider
          text-gray-900 dark:text-gray-100 sm:text-lg"
        data-testid="generated-password-preview"
        tabindex="0"
        :aria-label="t('web.generator.preview_aria')">
        {{ password }}
      </div>

      <div class="ml-3 flex items-center gap-1.5 shrink-0">
        <!-- Re-roll / Regenerate Button -->
        <button
          type="button"
          @click="handleRegenerate"
          :title="t('web.generator.reroll')"
          class="flex size-9 items-center justify-center rounded-md border border-gray-200
            bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-100 hover:text-gray-900
            focus:outline-none focus:ring-2 focus:ring-brand-500
            dark:border-gray-700 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600
            dark:hover:text-white"
          data-testid="reroll-password-button">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="size-4.5 transition-transform duration-300"
            :class="{ 'rotate-180': isRotating }">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
        </button>

        <!-- Direct Copy Button -->
        <button
          v-if="showDirectCopy"
          type="button"
          @click="handleCopy"
          :title="t('web.generator.copy_to_clipboard')"
          class="flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium shadow-sm
            transition-all focus:outline-none focus:ring-2 focus:ring-brand-500"
          :class="
            isCopied
              ? 'bg-emerald-600 text-white dark:bg-emerald-500'
              : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
          "
          data-testid="copy-generated-password-button">
          <svg
            v-if="!isCopied"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="size-4">
            <rect
              width="14"
              height="14"
              x="8"
              y="8"
              rx="2"
              ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            class="size-4">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{{
            isCopied
              ? t('web.STATUS.copied')
              : t('web.generator.copy')
          }}</span>
        </button>
      </div>
    </div>

    <!-- Visual 4-segment Strength Meter -->
    <div class="space-y-1">
      <div class="grid grid-cols-4 gap-1.5">
        <div
          v-for="i in 4"
          :key="i"
          class="h-1.5 rounded-full transition-colors duration-300"
          :class="[
            i <= strength.score
              ? strength.colorClass.split(' ')[0]
              : 'bg-gray-200 dark:bg-gray-700',
          ]"></div>
      </div>
    </div>

    <!-- Length Slider & Input -->
    <div class="space-y-2 pt-1">
      <div class="flex items-center justify-between text-sm">
        <label
          for="password-length-slider"
          class="font-medium text-gray-700 dark:text-gray-300">
          {{ t('web.generator.length') }}
        </label>
        <div class="flex items-center gap-1.5">
          <input
            id="password-length-number"
            type="number"
            :min="GENERATOR_MIN_LENGTH"
            :max="GENERATOR_MAX_LENGTH"
            v-model.number="length"
            class="w-16 rounded-md border border-gray-300 bg-white px-2 py-1 text-center font-mono
              text-sm font-semibold text-gray-900 focus:border-brand-500 focus:outline-none
              focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800
              dark:text-white"
            data-testid="password-length-number-input" />
          <span class="text-xs text-gray-500 dark:text-gray-400">
            {{ t('web.generator.chars') }}
          </span>
        </div>
      </div>

      <input
        id="password-length-slider"
        type="range"
        :min="GENERATOR_MIN_LENGTH"
        :max="GENERATOR_MAX_LENGTH"
        v-model.number="length"
        class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-brand-600
          dark:bg-gray-700 dark:accent-brand-400"
        data-testid="password-length-slider" />
    </div>

    <!-- Character Sets Checklist (LastPass style) -->
    <div class="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
      <p class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {{ t('web.generator.character_options') }}
      </p>

      <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <!-- Uppercase -->
        <label
          class="flex cursor-pointer items-center justify-between rounded-md border border-gray-200
            p-2.5 text-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/60"
          :class="{
            'border-brand-500/50 bg-brand-50/30 dark:border-brand-500/40 dark:bg-brand-900/10':
              uppercase,
          }">
          <span class="flex items-center gap-2 text-gray-800 dark:text-gray-200">
            <span class="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">ABC</span>
            <span>{{ t('web.generator.uppercase') }}</span>
          </span>
          <input
            type="checkbox"
            v-model="uppercase"
            class="size-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500
              dark:border-gray-600 dark:bg-gray-700"
            data-testid="checkbox-uppercase" />
        </label>

        <!-- Lowercase -->
        <label
          class="flex cursor-pointer items-center justify-between rounded-md border border-gray-200
            p-2.5 text-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/60"
          :class="{
            'border-brand-500/50 bg-brand-50/30 dark:border-brand-500/40 dark:bg-brand-900/10':
              lowercase,
          }">
          <span class="flex items-center gap-2 text-gray-800 dark:text-gray-200">
            <span class="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">abc</span>
            <span>{{ t('web.generator.lowercase') }}</span>
          </span>
          <input
            type="checkbox"
            v-model="lowercase"
            class="size-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500
              dark:border-gray-600 dark:bg-gray-700"
            data-testid="checkbox-lowercase" />
        </label>

        <!-- Numbers -->
        <label
          class="flex cursor-pointer items-center justify-between rounded-md border border-gray-200
            p-2.5 text-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/60"
          :class="{
            'border-brand-500/50 bg-brand-50/30 dark:border-brand-500/40 dark:bg-brand-900/10':
              numbers,
          }">
          <span class="flex items-center gap-2 text-gray-800 dark:text-gray-200">
            <span class="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">123</span>
            <span>{{ t('web.generator.numbers') }}</span>
          </span>
          <input
            type="checkbox"
            v-model="numbers"
            class="size-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500
              dark:border-gray-600 dark:bg-gray-700"
            data-testid="checkbox-numbers" />
        </label>

        <!-- Symbols -->
        <label
          class="flex cursor-pointer items-center justify-between rounded-md border border-gray-200
            p-2.5 text-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/60"
          :class="{
            'border-brand-500/50 bg-brand-50/30 dark:border-brand-500/40 dark:bg-brand-900/10':
              symbols,
          }">
          <span class="flex items-center gap-2 text-gray-800 dark:text-gray-200">
            <span class="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">#$&amp;</span>
            <span>{{ t('web.generator.symbols') }}</span>
          </span>
          <input
            type="checkbox"
            v-model="symbols"
            class="size-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500
              dark:border-gray-600 dark:bg-gray-700"
            data-testid="checkbox-symbols" />
        </label>
      </div>

      <!-- Exclude Ambiguous option -->
      <label
        class="mt-2 flex cursor-pointer items-start gap-2.5 rounded-md border border-dashed
          border-gray-200 p-2.5 text-xs text-gray-600 transition-colors hover:bg-gray-50
          dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800/40">
        <input
          type="checkbox"
          v-model="excludeAmbiguous"
          class="mt-0.5 size-3.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500
            dark:border-gray-600 dark:bg-gray-700"
          data-testid="checkbox-exclude-ambiguous" />
        <div>
          <span class="font-medium text-gray-800 dark:text-gray-200">
            {{ t('web.generator.exclude_ambiguous') }}
          </span>
          <span class="ml-1 text-gray-500 dark:text-gray-400">
            ({{ t('web.generator.example_prefix') }} <code class="rounded bg-gray-100 px-1 py-0.5 font-mono dark:bg-gray-800">i, l, 1, I, o, 0, O</code>)
          </span>
        </div>
      </label>
    </div>
  </div>
</template>
