import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import DownloadAppFooter from '@/components/dashboard/DownloadAppFooter.vue'; // Adjust the path if necessary
import QRCode from '@/components/QRCode.vue';
import appStoreLinks from '@/utils/app_store_links';

describe('DownloadAppFooter', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(DownloadAppFooter, {
      global: {
        mocks: {
          $t: (msg: string) => msg, // Mock the translation function
        },
      },
    });
  });

  it('renders correctly with default props', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('renders the QR code with the correct value', () => {
    const qrCode = wrapper.findComponent(QRCode);
    expect(qrCode.exists()).toBe(true);
    expect(qrCode.props('value')).toBe('https://www.crisiscleanup.org/apps');
  });

  it('sets the correct href for the iOS download link', () => {
    const iosLink = wrapper
      .find('[data-testid="testDownloadIosLink"]')
      .element.closest('a');
    expect(iosLink?.getAttribute('href')).toBe(appStoreLinks.apple);
  });

  it('sets the correct href for the Android download link', () => {
    const androidLink = wrapper
      .find('[data-testid="testDownloadAndroidLink"]')
      .element.closest('a');
    expect(androidLink?.getAttribute('href')).toBe(appStoreLinks.android);
  });

  it('sets the correct alt text for the iOS download image', () => {
    const iosImage = wrapper.find('[data-testid="testDownloadIosLink"]');
    expect(iosImage.attributes('alt')).toBe('nav.ccu_ios');
  });

  it('sets the correct alt text for the Android download image', () => {
    const androidImage = wrapper.find(
      '[data-testid="testDownloadAndroidLink"]',
    );
    expect(androidImage.attributes('alt')).toBe('nav.ccu_android');
  });
});
