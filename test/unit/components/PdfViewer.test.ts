import { mount } from '@vue/test-utils';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import PdfViewer from '@/components/PdfViewer.vue';
import { createI18n } from 'vue-i18n';

// Mock vue-pdf-embed
vi.mock('vue-pdf-embed', () => ({
  default: {
    name: 'VuePdfEmbed',
    template: '<div class="vue-pdf-embed"></div>',
    props: ['source', 'width', 'page'],
    emits: ['loaded'],
  },
}));

describe('PdfViewer', () => {
  const mockPdf = {
    full_url: 'http://test.com/test.pdf',
    filename_original: 'test.pdf',
  };

  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    messages: {
      en: {
        actions: {
          download: 'Download',
          previous: 'Previous',
          next: 'Next',
        },
      },
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default props', () => {
    const wrapper = mount(PdfViewer, {
      props: {
        pdf: mockPdf,
      },
      global: {
        plugins: [i18n],
      },
    });

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('.vue-pdf-embed').exists()).toBe(true);
  });

  it('shows download button when showDownloadButton is true', () => {
    const wrapper = mount(PdfViewer, {
      props: {
        pdf: mockPdf,
        showDownloadButton: true,
      },
      global: {
        plugins: [i18n],
      },
    });

    const downloadButton = wrapper.find('[data-testid="testDownloadLink"]');
    expect(downloadButton.exists()).toBe(true);
    expect(downloadButton.attributes('href')).toBe(mockPdf.full_url);
    expect(downloadButton.attributes('download')).toBe(
      mockPdf.filename_original,
    );
  });

  it('hides download button when showDownloadButton is false', () => {
    const wrapper = mount(PdfViewer, {
      props: {
        pdf: mockPdf,
        showDownloadButton: false,
      },
      global: {
        plugins: [i18n],
      },
    });

    expect(wrapper.find('[data-testid="testDownloadLink"]').exists()).toBe(
      false,
    );
  });

  it('shows pagination controls when showPagination is true and has multiple pages', async () => {
    const wrapper = mount(PdfViewer, {
      props: {
        pdf: mockPdf,
        showPagination: true,
      },
      global: {
        plugins: [i18n],
      },
    });

    // Simulate PDF loaded with multiple pages
    await wrapper
      .findComponent({ name: 'VuePdfEmbed' })
      .vm.$emit('loaded', { numPages: 5 });
    await wrapper.vm.$nextTick();

    const paginationDiv = wrapper.find(
      '.flex.justify-center.items-center.gap-4.p-2',
    );
    expect(paginationDiv.exists()).toBe(true);
    expect(wrapper.text()).toContain('1 / 5');
  });

  it('hides pagination controls when showPagination is false', () => {
    const wrapper = mount(PdfViewer, {
      props: {
        pdf: mockPdf,
        showPagination: false,
      },
      global: {
        plugins: [i18n],
      },
    });

    expect(
      wrapper.find('.flex.justify-center.items-center.gap-4.p-2').exists(),
    ).toBe(false);
  });

  it('renders with specified width', () => {
    const width = 500;
    const wrapper = mount(PdfViewer, {
      props: {
        pdf: mockPdf,
        width,
      },
      global: {
        plugins: [i18n],
      },
    });

    const pdfEmbed = wrapper.findComponent({ name: 'VuePdfEmbed' });
    expect(pdfEmbed.props('width')).toBe(width);
  });

  it('renders with specified page number', async () => {
    const page = 2;
    const wrapper = mount(PdfViewer, {
      props: {
        pdf: mockPdf,
        page,
      },
      global: {
        plugins: [i18n],
      },
    });

    const pdfEmbed = wrapper.findComponent({ name: 'VuePdfEmbed' });
    expect(pdfEmbed.props('page')).toBe(page);
  });

  it('updates page when page prop changes', async () => {
    const wrapper = mount(PdfViewer, {
      props: {
        pdf: mockPdf,
        page: 1,
      },
      global: {
        plugins: [i18n],
      },
    });

    await wrapper.setProps({ page: 2 });
    const pdfEmbed = wrapper.findComponent({ name: 'VuePdfEmbed' });
    expect(pdfEmbed.props('page')).toBe(2);
  });

  it('emits clickPdf event when PDF is clicked', async () => {
    const wrapper = mount(PdfViewer, {
      props: {
        pdf: mockPdf,
      },
      global: {
        plugins: [i18n],
      },
    });

    await wrapper.find('.h-max').trigger('click');
    expect(wrapper.emitted('clickPdf')).toBeTruthy();
  });

  it('emits pageChange event when navigating pages', async () => {
    const wrapper = mount(PdfViewer, {
      props: {
        pdf: mockPdf,
        showPagination: true,
      },
      global: {
        plugins: [i18n],
      },
    });

    // Simulate PDF loaded with multiple pages
    await wrapper
      .findComponent({ name: 'VuePdfEmbed' })
      .vm.$emit('loaded', { numPages: 5 });
    await wrapper.vm.$nextTick();

    // Click next button
    await wrapper.find('button:last-child').trigger('click');
    expect(wrapper.emitted('pageChange')?.[0]).toEqual([2]);

    // Click previous button
    await wrapper.find('button:first-child').trigger('click');
    expect(wrapper.emitted('pageChange')?.[1]).toEqual([1]);
  });
});
