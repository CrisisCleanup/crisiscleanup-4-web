import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
    general_file_url: 'http://test.com/test.pdf',
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
    expect(downloadButton.attributes('href')).toBe(mockPdf.general_file_url);
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

    // Click next page button
    await wrapper.find('button:last-child').trigger('click');
    expect(wrapper.emitted('pageChange')).toBeTruthy();
    expect(wrapper.emitted('pageChange')?.[0]).toEqual([2]);

    // Click previous page button
    await wrapper.find('button:first-child').trigger('click');
    expect(wrapper.emitted('pageChange')?.[1]).toEqual([1]);
  });

  it('disables previous button on first page', async () => {
    const wrapper = mount(PdfViewer, {
      props: {
        pdf: mockPdf,
        showPagination: true,
        page: 1,
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

    const prevButton = wrapper.find('button:first-child');
    expect(prevButton.attributes('disabled')).toBeDefined();
  });

  it('disables next button on last page', async () => {
    const wrapper = mount(PdfViewer, {
      props: {
        pdf: mockPdf,
        showPagination: true,
        page: 5,
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

    const nextButton = wrapper.find('button:last-child');
    expect(nextButton.attributes('disabled')).toBeDefined();
  });

  it('updates current page when loaded event is emitted', async () => {
    const wrapper = mount(PdfViewer, {
      props: {
        pdf: mockPdf,
        showPagination: true,
      },
      global: {
        plugins: [i18n],
      },
    });

    await wrapper
      .findComponent({ name: 'VuePdfEmbed' })
      .vm.$emit('loaded', { numPages: 5 });
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('1 / 5');
  });

  describe('lazy rendering', () => {
    let showInViewport: () => void;

    beforeEach(() => {
      vi.stubGlobal(
        'IntersectionObserver',
        class {
          constructor(callback: IntersectionObserverCallback) {
            showInViewport = () =>
              callback(
                [{ isIntersecting: true } as IntersectionObserverEntry],
                this as unknown as IntersectionObserver,
              );
          }

          observe() {}

          unobserve() {}

          disconnect() {}
        },
      );
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    function mountLazy(props = {}) {
      return mount(PdfViewer, {
        props: { pdf: mockPdf, lazy: true, ...props },
        global: { plugins: [i18n] },
      });
    }

    it('holds a lazy PDF back until it scrolls into view', async () => {
      const wrapper = mountLazy();
      await flushPromises();

      expect(wrapper.find('.vue-pdf-embed').exists()).toBe(false);

      showInViewport();
      await flushPromises();

      expect(wrapper.find('.vue-pdf-embed').exists()).toBe(true);
    });

    it('keeps the space of a lazy PDF before it renders', async () => {
      const wrapper = mountLazy({ width: 75 });
      await flushPromises();

      const placeholder = wrapper.find('[data-testid="testPdfPlaceholder"]');
      expect(placeholder.attributes('style')).toContain('width: 75px');
    });
  });
});
