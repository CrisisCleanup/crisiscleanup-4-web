import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BlogPostDetail from '@/components/blog/BlogPostDetail.vue'; // Ensure the correct component path is used
import moment from 'moment';
import { formatCmsItem } from '@/utils/helpers';

// Mock the User model
vi.mock('@/models/User', () => ({
  default: {
    find: vi.fn((id) => ({
      id,
      full_name: 'John Doe',
      profilePictureUrl: 'https://example.com/profile.jpg',
    })),
  },
}));

// Mock the formatCmsItem helper
vi.mock('@/utils/helpers', () => ({
  formatCmsItem: vi.fn((content) => content),
}));

describe('BlogPostDetail', () => {
  let wrapper;

  const post = {
    title: 'Sample Post',
    content: '<p>This is a sample post content.</p>',
    slug: 'sample-post',
    publish_at: '2023-10-05T00:00:00Z',
    created_by: 1,
  };

  beforeEach(() => {
    wrapper = mount(BlogPostDetail, {
      props: {
        post,
      },
    });
  });

  it('renders correctly with default props', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('displays the author name and profile picture', () => {
    const authorName = wrapper.find('a[rel="author"]').text();
    const authorImage = wrapper.find('img');

    expect(authorName).toBe('John Doe');
    expect(authorImage.attributes('src')).toBe(
      'https://example.com/profile.jpg',
    );
  });

  it.todo('formats and displays the publish date', () => {
    const date = moment(post.publish_at).format('MMM. D, YYYY');
    const timeElement = wrapper.find('time');

    expect(timeElement.attributes('datetime')).toBe(post.publish_at); // Original date string
    expect(timeElement.text()).toBe(date); // Formatted date string
  });

  it.todo('renders the post title as a link', () => {
    const titleLink = wrapper.find('a.mb-4.text-3xl');
    expect(titleLink.text()).toBe(post.title);
    expect(titleLink.attributes('to')).toBe(`/blog/post/${post.slug}`);
  });

  it('renders the post content correctly', () => {
    const contentDiv = wrapper.find('.blog-post');
    expect(contentDiv.html()).toContain(post.content);
  });
});
