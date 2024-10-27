import { mount } from '@vue/test-utils';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import CopyText from '@/components/CopyText.vue';

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key, // Simple mock for translation function
  }),
}));

const successMock = vi.fn();
vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: successMock,
  }),
}));

const copyMock = vi.fn(() => Promise.resolve());
let copiedState = false;
vi.mock('@vueuse/core', () => ({
  useClipboard: () => ({
    copy: copyMock,
    get copied() {
      return copiedState;
    },
  }),
}));

describe('CopyText', () => {
  let wrapper: any;

  beforeEach(() => {
    // Reset mocks before each test
    copyMock.mockClear();
    successMock.mockClear();
    copiedState = false;
    wrapper = mount(CopyText, {
      props: {
        text: 'Sample text',
        iconClass: 'icon-class',
      },
    });
  });

  it('renders the default slot content', () => {
    wrapper = mount(CopyText, {
      props: {
        text: 'Sample text',
        iconClass: 'icon-class',
      },
      slots: {
        default: '<span>Custom Text</span>',
      },
    });
    expect(wrapper.text()).toContain('Custom Text');
  });

  it('renders the icon slot content', () => {
    wrapper = mount(CopyText, {
      props: {
        text: 'Sample text',
        iconClass: 'icon-class',
      },
      slots: {
        icon: '<span>Custom Icon</span>',
      },
    });
    expect(wrapper.html()).toContain('Custom Icon');
  });

  it('calls copyToClipboard when clicked', async () => {
    await wrapper.find('.cursor-pointer').trigger('click');
    expect(copyMock).toHaveBeenCalledWith('Sample text');
    expect(successMock).toHaveBeenCalledWith('info.copied_to_clipboard', {
      timeout: 1000,
    });
  });
});
