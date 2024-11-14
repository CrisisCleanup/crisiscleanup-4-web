import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach } from 'vitest';
import Pagination from '@/components/blog/Pagination.vue'; // Adjust the path if necessary

describe('Pagination', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(Pagination, {
      props: {
        currentPage: 1,
        totalPages: 5,
      },
    });
  });

  it('renders correctly with default props', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it.todo('displays the correct number of page buttons', () => {
    const pageButtons = wrapper.findAll('div > button');
    expect(pageButtons.length).toBe(5); // Only count actual page buttons
  });

  it('disables the Previous button on the first page', () => {
    const prevButton = wrapper
      .findAll('button')
      .find((btn) => btn.text() === 'Previous');
    expect(prevButton.element.disabled).toBe(true);
  });

  it('enables the Next button on the first page', () => {
    const nextButton = wrapper
      .findAll('button')
      .find((btn) => btn.text() === 'Next');
    expect(nextButton.element.disabled).toBe(false);
  });

  it.todo('emits the correct event when a page button is clicked', async () => {
    const pageButtons = wrapper.findAll('div > button');
    await pageButtons[1].trigger('click'); // Click on the second page button
    expect(wrapper.emitted('page-changed')).toBeTruthy();
    expect(wrapper.emitted('page-changed')[0]).toEqual([2]);
  });

  it('emits the correct event when the Next button is clicked', async () => {
    const nextButton = wrapper
      .findAll('button')
      .find((btn) => btn.text() === 'Next');
    await nextButton.trigger('click');
    expect(wrapper.emitted('page-changed')).toBeTruthy();
    expect(wrapper.emitted('page-changed')[0]).toEqual([2]);
  });

  it('emits the correct event when the Previous button is clicked', async () => {
    await wrapper.setProps({ currentPage: 2 });
    const prevButton = wrapper
      .findAll('button')
      .find((btn) => btn.text() === 'Previous');
    await prevButton.trigger('click');
    expect(wrapper.emitted('page-changed')).toBeTruthy();
    expect(wrapper.emitted('page-changed')[0]).toEqual([1]);
  });

  it('disables the Next button on the last page', async () => {
    await wrapper.setProps({ currentPage: 5 });
    const nextButton = wrapper
      .findAll('button')
      .find((btn) => btn.text() === 'Next');
    expect(nextButton.element.disabled).toBe(true);
  });

  it('enables the Previous button on the last page', async () => {
    await wrapper.setProps({ currentPage: 5 });
    const prevButton = wrapper
      .findAll('button')
      .find((btn) => btn.text() === 'Previous');
    expect(prevButton.element.disabled).toBe(false);
  });
});
