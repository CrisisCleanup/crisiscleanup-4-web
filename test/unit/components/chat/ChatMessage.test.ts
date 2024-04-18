import type { VueWrapper } from '@vue/test-utils';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createI18n } from 'vue-i18n';
import ChatMessage from '@/components/chat/ChatMessage.vue';
vi.mock('@/models/User', () => ({
  default: {
    find: vi.fn(),
  },
}));
describe('ChatMessage.vue', () => {
  let wrapper: VueWrapper<InstanceType<typeof ChatMessage>>;

  beforeEach(async () => {
    const i18n = createI18n({
      legacy: false,
      locale: 'en',
      messages: {
        en: {},
      },
    });

    wrapper = mount(ChatMessage, {
      props: {
        message: {
          content: 'Test message',
          created_by: {
            full_name: 'John Doe',
            profile_picture_file: null,
          },
          created_at: new Date().toISOString(),
          is_favorite: false,
          is_urgent: false,
        },
      },
      global: {
        plugins: [i18n],
        mocks: {
          $t: (key: string) => key,
        },
        stubs: ['UserDetailsTooltip'],
      },
    });

    await nextTick();
  });

  it('renders the component', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('renders the message content', () => {
    expect(wrapper.text()).toContain('Test message');
  });
});
