<!-- src/shared/components/ui/SecretQrModal.vue -->

<script setup lang="ts">
  import { ref, watch } from 'vue';
  import { useI18n } from 'vue-i18n';
  import QRCode from 'qrcode';
  import {
    Dialog,
    DialogPanel,
    DialogTitle,
    TransitionChild,
    TransitionRoot,
  } from '@headlessui/vue';

  interface Props {
    url: string;
    isOpen: boolean;
  }

  const props = defineProps<Props>();
  const emit = defineEmits<{
    (e: 'update:isOpen', value: boolean): void;
    (e: 'close'): void;
  }>();

  const { t } = useI18n();
  const qrDataUrl = ref<string>('');
  const isGenerating = ref(false);

  const generateQr = async () => {
    if (!props.url) return;
    try {
      isGenerating.value = true;
      qrDataUrl.value = await QRCode.toDataURL(props.url, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0A0E14',
          light: '#FFFFFF',
        },
      });
    } catch (err) {
      console.error('Failed to generate QR code', err);
    } finally {
      isGenerating.value = false;
    }
  };

  watch(
    () => props.isOpen,
    (open) => {
      if (open) {
        generateQr();
      }
    },
    { immediate: true }
  );

  const handleClose = () => {
    emit('update:isOpen', false);
    emit('close');
  };

  const handleDownload = () => {
    if (!qrDataUrl.value) return;
    const a = document.createElement('a');
    a.href = qrDataUrl.value;
    a.download = 'secreto-godatalize-qr.png';
    a.click();
  };
</script>

<template>
  <TransitionRoot
    appear
    :show="isOpen"
    as="template">
    <Dialog
      as="div"
      @close="handleClose"
      class="relative z-50">
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0">
        <div class="fixed inset-0 bg-black/60 backdrop-blur-xs" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 text-center">
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95">
            <DialogPanel
              class="w-full max-w-sm transform overflow-hidden rounded-2xl border border-gray-200
                bg-white p-6 text-left align-middle shadow-2xl transition-all
                dark:border-gray-700 dark:bg-slate-900">
              <div class="flex items-center justify-between pb-3">
                <DialogTitle
                  as="h3"
                  class="font-brand text-lg font-bold text-gray-900 dark:text-white">
                  {{ t('web.qr.title') }}
                </DialogTitle>
                <button
                  type="button"
                  @click="handleClose"
                  :aria-label="t('web.LABELS.close')"
                  class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600
                    dark:hover:bg-slate-800 dark:hover:text-gray-200">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    class="size-5">
                    <line
                      x1="18"
                      y1="6"
                      x2="6"
                      y2="18" />
                    <line
                      x1="6"
                      y1="6"
                      x2="18"
                      y2="18" />
                  </svg>
                </button>
              </div>

              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{
                  t('web.qr.instructions')
                }}
              </p>

              <!-- QR Code Card (Always on white background for optimal phone camera scanning) -->
              <div class="my-5 flex flex-col items-center justify-center rounded-xl bg-white p-4 shadow-inner">
                <img
                  v-if="qrDataUrl"
                  :src="qrDataUrl"
                  :alt="t('web.qr.title')"
                  class="size-60 rounded-lg object-contain"
                  data-testid="secret-qr-image" />
                <div
                  v-else
                  class="flex size-60 items-center justify-center text-sm text-gray-400">
                  {{ t('web.qr.generating') }}
                </div>
              </div>

              <!-- Action buttons -->
              <div class="flex gap-2">
                <button
                  type="button"
                  @click="handleDownload"
                  :disabled="!qrDataUrl"
                  class="flex-1 inline-flex items-center justify-center gap-2 rounded-lg
                    border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium
                    text-gray-700 shadow-sm transition hover:bg-gray-50
                    dark:border-gray-600 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    class="size-4">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line
                      x1="12"
                      y1="15"
                      x2="12"
                      y2="3" />
                  </svg>
                  <span>{{ t('web.qr.download') }}</span>
                </button>
                <button
                  type="button"
                  @click="handleClose"
                  class="inline-flex items-center justify-center rounded-lg bg-brand-600
                    px-4 py-2.5 text-sm font-medium text-white shadow-sm transition
                    hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600">
                  {{ t('web.LABELS.close') }}
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
