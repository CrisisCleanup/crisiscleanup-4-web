import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import Badge from '@/components/Badge.vue'; // Adjust the path if necessary

describe('Badge.vue', () => {
  it('renders correctly with default props', () => {
    const wrapper = mount(Badge);
    const badgeDiv = wrapper.find('[data-testid="testBadgeDiv"]');
    expect(badgeDiv.exists()).toBe(true);
    expect(badgeDiv.element.style.backgroundColor).toBe('');
    expect(badgeDiv.element.style.width).toBe('auto');
    expect(badgeDiv.element.style.height).toBe('auto');
  });

  it('applies color prop correctly', () => {
    const wrapper = mount(Badge, {
      props: {
        color: 'red',
      },
    });
    const badgeDiv = wrapper.find('[data-testid="testBadgeDiv"]');
    expect(badgeDiv.element.style.backgroundColor).toBe('red');
  });

  it('applies width and height props correctly', () => {
    const wrapper = mount(Badge, {
      props: {
        width: '20px',
        height: '20px',
      },
    });
    const badgeDiv = wrapper.find('[data-testid="testBadgeDiv"]');
    expect(badgeDiv.element.style.width).toBe('20px');
    expect(badgeDiv.element.style.height).toBe('20px');
  });

  it('renders slot content correctly', () => {
    const wrapper = mount(Badge, {
      slots: {
        default: '<span>Test Content</span>',
      },
    });
    expect(wrapper.html()).toContain('<span>Test Content</span>');
  });
});
