import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import DragDrop from '@/components/DragDrop.vue'; // Adjust the path if necessary

describe('DragDrop.vue', () => {
  it('renders correctly with default props', () => {
    const wrapper = mount(DragDrop);
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('.file-input').exists()).toBe(true);
  });

  it('renders slot content correctly', () => {
    const wrapper = mount(DragDrop, {
      slots: {
        default: '<div class="custom-slot">Custom Slot Content</div>',
      },
    });
    expect(wrapper.find('.custom-slot').exists()).toBe(true);
    expect(wrapper.text()).toContain('Custom Slot Content');
  });

  it.todo('emits files event correctly on file drop', async () => {
    const wrapper = mount(DragDrop);
    const file = new File(['dummy content'], 'example.txt', {
      type: 'text/plain',
    });

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    const dropEvent = new DragEvent('drop', {
      dataTransfer,
    });

    const form = wrapper.find('form');
    await form.trigger('drop', dropEvent);

    expect(wrapper.emitted().files).toBeTruthy();
    expect(wrapper.emitted().files[0][0][0]).toBe(file);
  });

  it.todo('emits files event correctly on file input change', async () => {
    const wrapper = mount(DragDrop);
    const file = new File(['dummy content'], 'example.txt', {
      type: 'text/plain',
    });

    const input = wrapper.find('.file-input');
    // Create a change event with the file
    const event = new Event('change');
    Object.defineProperty(event, 'target', {
      writable: false,
      value: { files: [file] },
    });
    await input.element.dispatchEvent(event);

    expect(wrapper.emitted().files).toBeTruthy();
    expect(wrapper.emitted().files[0][0][0]).toBe(file);
  });
});
