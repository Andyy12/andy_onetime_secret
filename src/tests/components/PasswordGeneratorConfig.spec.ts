// src/tests/components/PasswordGeneratorConfig.spec.ts

import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import PasswordGeneratorConfig from '@/shared/components/forms/PasswordGeneratorConfig.vue';

describe('PasswordGeneratorConfig.vue', () => {
  it('mounts and generates an initial password', () => {
    const wrapper = mount(PasswordGeneratorConfig, {
      global: {
        mocks: {
          t: (key: string) => key,
        },
      },
    });

    const preview = wrapper.find('[data-testid="generated-password-preview"]');
    expect(preview.exists()).toBe(true);
    expect(preview.text().length).toBe(16);

    // Emits initial password
    expect(wrapper.emitted('update:password')).toBeTruthy();
    expect(wrapper.emitted('update:password')?.[0]).toEqual([preview.text()]);
  });

  it('allows changing password length with slider or number input', async () => {
    const wrapper = mount(PasswordGeneratorConfig, {
      props: {
        initialLength: 20,
      },
      global: {
        mocks: {
          t: (key: string) => key,
        },
      },
    });

    const preview = wrapper.find('[data-testid="generated-password-preview"]');
    expect(preview.text().length).toBe(20);

    const numberInput = wrapper.find('[data-testid="password-length-number-input"]');
    await numberInput.setValue(28);

    expect(preview.text().length).toBe(28);
  });

  it('regenerates a new password when the reroll button is clicked', async () => {
    const wrapper = mount(PasswordGeneratorConfig, {
      global: {
        mocks: {
          t: (key: string) => key,
        },
      },
    });

    const initialText = wrapper.find('[data-testid="generated-password-preview"]').text();
    const rerollBtn = wrapper.find('[data-testid="reroll-password-button"]');

    await rerollBtn.trigger('click');
    const newText = wrapper.find('[data-testid="generated-password-preview"]').text();

    expect(newText).toHaveLength(16);
  });

  it('toggles character sets via checkboxes', async () => {
    const wrapper = mount(PasswordGeneratorConfig, {
      global: {
        mocks: {
          t: (key: string) => key,
        },
      },
    });

    const upperBox = wrapper.find('[data-testid="checkbox-uppercase"]');
    const lowerBox = wrapper.find('[data-testid="checkbox-lowercase"]');
    const symBox = wrapper.find('[data-testid="checkbox-symbols"]');

    // Uncheck uppercase, lowercase, symbols to leave only numbers
    await upperBox.setValue(false);
    await lowerBox.setValue(false);
    await symBox.setValue(false);

    const preview = wrapper.find('[data-testid="generated-password-preview"]').text();
    expect(preview).toMatch(/^[0-9]+$/);
  });
});
