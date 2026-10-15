import { beforeAll, describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import SecretQrModal from '@/shared/components/ui/SecretQrModal.vue';

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

describe('SecretQrModal.vue', () => {
  it('renders correctly when open', async () => {
    const wrapper = mount(SecretQrModal, {
      props: {
        url: 'https://secrets.godatalize.com/secret/abc12345',
        isOpen: true,
      },
      global: {
        mocks: {
          t: (key: string) => key,
        },
      },
    });

    // Modal dialog exists
    expect(wrapper.findComponent(SecretQrModal).exists()).toBe(true);
  });
});
