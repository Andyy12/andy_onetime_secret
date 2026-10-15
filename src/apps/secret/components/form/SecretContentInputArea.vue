<!-- src/apps/secret/components/form/SecretContentInputArea.vue -->

<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  import { useCharCounter } from '@/shared/composables/useCharCounter';
  import { useTextarea } from '@/shared/composables/useTextarea';
  import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue';
  import { computed, nextTick, watch } from 'vue';

  import { SECRET_TEMPLATES, buildTemplate, insertTemplate, type SecretTemplate } from './secretTemplates';

const { t } = useI18n();

  const props = withDefaults(
    defineProps<{
      maxLength?: number;
      initialContent?: string;
      cornerClass?: string;
      disabled?: boolean;
      minHeight?: number;
      maxHeight?: number;
    }>(),
    {
      maxLength: 10000,
      disabled: false,
      initialContent: '',
      cornerClass: '',
      minHeight: 200,
      maxHeight: 400,
    }
  );

  const emit = defineEmits(['update:content']);

  const { content, charCount, textareaRef, checkContentLength, clearTextarea } = useTextarea({
    maxLength: props.maxLength || 10000,
    initialContent: props.initialContent,
    maxHeight: props.maxHeight,
    onContentChange: (newContent) => emit('update:content', newContent),
  });

  const { isHovering, formatNumber } = useCharCounter();

  // Computed properties
  const showCounter = computed(() => isHovering.value || charCount.value > props.maxLength! / 2);

  const formattedCharCount = computed(() => formatNumber(charCount.value));

  const formattedMaxLength = computed(() => formatNumber(props.maxLength!));

  const statusColor = computed(() => {
    const percentage = charCount.value / props.maxLength!;
    if (percentage < 0.8) return 'bg-emerald-400 dark:bg-emerald-500';
    if (percentage < 0.95) return 'bg-amber-400 dark:bg-amber-500';
    return 'bg-red-400 dark:bg-red-500';
  });

  // Watch for changes to emit updates
  watch(content, (newContent) => {
    emit('update:content', newContent);
  });

  // Insert a template (appending when the user already typed something) and
  // put the caret where the first value goes.
  const applyTemplate = async (template: SecretTemplate) => {
    const { text, caret } = insertTemplate(
      content.value,
      buildTemplate(template, (key) => t(key)),
      props.maxLength
    );
    content.value = text;

    await nextTick();
    const el = textareaRef.value;
    if (el) {
      el.focus();
      el.setSelectionRange(caret, caret);
    }
  };

  defineExpose({ clearTextarea });
</script>

<template>
  <div class="relative">
    <!-- Quick templates: one compact menu instead of a row of chips, so the
         list can grow without pushing the textarea down on mobile. -->
    <div class="mb-2.5 flex justify-end">
      <Menu
        as="div"
        class="relative inline-block text-left">
        <MenuButton
          :disabled="disabled"
          class="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white/80 px-2.5 py-1
            text-xs font-medium text-gray-700 shadow-2xs transition
            hover:border-brand-500 hover:text-brand-600
            focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500
            disabled:cursor-not-allowed disabled:opacity-50
            dark:border-gray-700 dark:bg-slate-800/80 dark:text-gray-300
            dark:hover:border-brand-400 dark:hover:text-brand-400"
          data-testid="template-menu-button">
          <span aria-hidden="true">📋</span>
          <span>{{ t('web.templates.label') }}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            class="size-4 text-gray-400"
            aria-hidden="true">
            <path
              fill-rule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clip-rule="evenodd" />
          </svg>
        </MenuButton>

        <transition
          enter-active-class="transition ease-out duration-100"
          enter-from-class="transform opacity-0 scale-95"
          enter-to-class="transform opacity-100 scale-100"
          leave-active-class="transition ease-in duration-75"
          leave-from-class="transform opacity-100 scale-100"
          leave-to-class="transform opacity-0 scale-95">
          <MenuItems
            class="absolute right-0 z-50 mt-1.5 w-60 origin-top-right rounded-lg bg-white py-1 shadow-lg
              ring-1 ring-black/5 focus:outline-none
              dark:bg-slate-800 dark:ring-gray-700/70">
            <MenuItem
              v-for="template in SECRET_TEMPLATES"
              :key="template.id"
              v-slot="{ active }">
              <button
                type="button"
                :class="[
                  active
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-400/10 dark:text-brand-300'
                    : 'text-gray-700 dark:text-gray-200',
                ]"
                class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm"
                :data-testid="`template-${template.id}`"
                @click="applyTemplate(template)">
                <span
                  class="w-5 text-center"
                  aria-hidden="true">{{ template.emoji }}</span>
                <span>{{ t(`web.templates.${template.id}`) }}</span>
              </button>
            </MenuItem>
          </MenuItems>
        </transition>
      </Menu>
    </div>
    <!-- <div
      id="textarea-focus-announcement"
      aria-live="polite"
      class="sr-only">
      {{ t('web.COMMON.focus_is_now_in_the_main_text_area') }}
    </div> -->
    <!-- prettier-ignore-attribute class -->
    <textarea
      ref="textareaRef"
      v-model="content"
      :disabled="disabled"
      @input="checkContentLength"
      :maxlength="maxLength"
      :class="[cornerClass]"
      :style="{ minHeight: minHeight + 'px', maxHeight: maxHeight + 'px' }"
      class="
        block w-full resize-none
        rounded-lg border border-gray-200/60 p-5
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
        dark:disabled:bg-slate-900/50
      "
      :placeholder="t('web.COMMON.secret_placeholder')"
      :aria-label="t('web.secrets.enter_the_secret_content_here')"
      data-testid="secret-content-input">
    </textarea>

    <!--
      Generally speaking, v-if has higher toggle costs while v-show has higher
      initial render costs. So prefer v-show if you need to toggle something
      very often, and prefer v-if if the condition is unlikely to change at
      runtime. -- https://vuejs.org/guide/essentials/conditional.html#v-if-vs-v-show
    -->
    <!-- prettier-ignore-attribute class -->
    <div
      v-if="showCounter"
      class="pointer-events-none absolute bottom-4 right-4 flex select-none items-center gap-2
        rounded-full bg-white/95 px-3.5 py-1.5 text-sm
        shadow-[0_4px_12px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.08)]
        backdrop-blur-md transition-all duration-300 border border-gray-200/40
        dark:bg-gray-800/95 dark:border-gray-700/40
        dark:shadow-[0_4px_12px_rgba(0,0,0,0.3),0_1px_3px_rgba(0,0,0,0.2)]">
      <span
        :class="[statusColor, 'size-2.5 rounded-full shadow-sm']"
        aria-hidden="true"></span>
      <span class="font-semibold text-gray-700 dark:text-gray-300 tabular-nums">
        {{ formattedCharCount }} / {{ formattedMaxLength }}
      </span>
    </div>
  </div>
</template>
