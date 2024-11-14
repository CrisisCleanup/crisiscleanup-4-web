import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BlogPosts from '@/components/blog/BlogPosts.vue'; // Adjust the path if necessary
import moment from 'moment';
import { formatCmsItem } from '@/utils/helpers';

// Mock the formatCmsItem helper
vi.mock('@/utils/helpers', () => ({
  formatCmsItem: vi.fn((content) => content),
}));

describe('BlogPosts', () => {
  let wrapper;

  const cmsItems = [
    {
      id: 1,
      title: 'Sample Title 1',
      content: 'This is sample content 1.',
      publish_at: '2023-10-05T00:00:00Z',
      thumbnail_file: {
        blog_url: 'https://example.com/thumbnail1.jpg',
      },
    },
    {
      id: 2,
      title: 'Sample Title 2',
      content: 'This is sample content 2.',
      publish_at: '2023-11-15T00:00:00Z',
      thumbnail_file: null,
    },
  ];

  beforeEach(() => {
    wrapper = mount(BlogPosts, {
      props: {
        cmsItems,
      },
      global: {
        mocks: {
          $t: (msg: string) => msg,
        },
      },
    });
  });

  it('renders correctly with default props', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('displays the correct number of CMS items', () => {
    const cmsItemElements = wrapper.findAll('li');
    expect(cmsItemElements.length).toBe(cmsItems.length);
  });

  it('formats and displays the publish date correctly', () => {
    const dateElements = wrapper.findAll(
      '.px-5.h-16.bg-blue-400.text-white.font-bold.flex.items-center.justify-center',
    );
    for (const [index, element] of dateElements.entries()) {
      const cmsItem = cmsItems[index];
      const month = moment(cmsItem.publish_at).format('MMM');
      const day = moment(cmsItem.publish_at).format('D');
      expect(element.text()).toContain(month);
      expect(element.text()).toContain(day);
    }
  });

  it('renders the CMS item title and content correctly', () => {
    const titleElements = wrapper.findAll('.text-xl.font-bold.truncate');
    const contentElements = wrapper.findAll('.text-base.line-clamp-8');

    for (const [index, element] of titleElements.entries()) {
      expect(element.html()).toContain(cmsItems[index].title);
    }

    for (const [index, element] of contentElements.entries()) {
      expect(element.html()).toContain(cmsItems[index].content);
    }
  });

  it('displays the thumbnail image when present', () => {
    const imgElements = wrapper.findAll('img');
    expect(imgElements.length).toBe(1);
    expect(imgElements[0].attributes('src')).toBe(
      cmsItems[0].thumbnail_file.blog_url,
    );
  });

  it('emits the onClick event when a CMS item is clicked', async () => {
    const cmsItemElements = wrapper.findAll('li');
    await cmsItemElements[0].trigger('click');
    expect(wrapper.emitted().onClick).toBeTruthy();
    expect(wrapper.emitted().onClick[0]).toEqual([cmsItems[0]]);
  });
});
