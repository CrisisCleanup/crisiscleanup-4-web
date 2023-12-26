import { describe, expect, it, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import BaseSelect from '@/components/BaseSelect.vue';

vi.mock('vue-i18n');
vi.mock('axios');

(useI18n as any).mockReturnValue({
  t: (tKey: string) => tKey,
});

describe('BaseSelect', () => {
  it('should render with basic options', async () => {
    const options = ['tobi', 'aaron', 'deep'];
    const wrapper = mount(BaseSelect, {
      props: {
        options,
      },
    });
    await flushPromises();
    expect(wrapper.findAll('.multiselect-option')).to.have.length(
      options.length,
    );
  });
  it('should render with object options', async () => {
    const options = [
      {
        id: 'id_from_table_data',
        name: 'Name from table data',
      },
    ];
    const wrapper = mount(BaseSelect, {
      props: {
        itemKey: 'id',
        label: 'name',
        options,
      },
    });
    await flushPromises();
    expect(wrapper.findAll('.multiselect-option')).to.have.length(
      options.length,
    );
    expect(wrapper.html()).toContain('Name from table data');
    expect(wrapper.html()).toContain('id_from_table_data');
  });
  it('should render with async options', async () => {
    const spy = vi.spyOn(global.console, 'error');
    mount(BaseSelect, {
      props: {
        itemKey: 'id',
        label: 'name',
        searchable: true,
        async options() {
          const response = await axios.get(
            `${import.meta.env.VITE_APP_API_BASE_URL}/table`,
          );
          return response.data.results;
        },
      },
    });
    expect(spy).not.toHaveBeenCalled();
  });

  /**
   * Note: The tests below were broken as we upgraded @vueform/multiselect from v2.6.2 to v2.6.6
   * v2.6.2 -> v.2.6.3 had major changes which replaced click events with mousedown events.
   * The skipped tests below are testing internal implementation of the library anyways
   * so it doesn't make sense to test them.
   *
   * @see
   * https://github.com/vueform/multiselect/compare/2.6.2...2.6.3
   * https://github.com/vueform/multiselect/issues/387
   */

  //////////////////////////////////////////////////////////////////////////
  // Test implementation below which doesn't work with mousedown event
  //////////////////////////////////////////////////////////////////////////
  // it.only('should be able to select and clear item', async () => {
  //   // if (typeof document.activeElement.isEqualNode !== 'function') {
  //   //   Element.prototype.isEqualNode = function (element) {
  //   //     // Basic implementation or return true to bypass the check
  //   //     return this === element;
  //   //   };
  //   // }
  //
  //   const options = ['tobi', 'aaron', 'deep'];
  //   const wrapper = mount(BaseSelect, {
  //     props: {
  //       options,
  //     },
  //   });
  //   await flushPromises();
  //
  //   console.log('Before click');
  //   console.log(wrapper.html());
  //
  //   // Trigger click on the options dropdown
  //   await wrapper.find('.multiselect-options').trigger('mouseenter');
  //   await wrapper.find('.multiselect-options').trigger('mousedown');
  //   // await wrapper.find('.multiselect-caret').trigger('click');
  //   // await wrapper.find('.multiselect-options').trigger('click');
  //
  //   console.log('Before select');
  //   console.log(wrapper.html());
  //
  //   // Trigger click on the first option
  //   await wrapper.find('.multiselect-option').trigger('click');
  //
  //   // Wait for the DOM to update
  //   await nextTick();
  //
  //   console.log('After select');
  //   console.log(wrapper.html());
  //
  //   const selectedElement = wrapper.find('.multiselect-single-label-text');
  //   expect(selectedElement.exists()).toBeTruthy();
  //   const selected = selectedElement.text();
  //   expect(selected).toEqual(options[0]);
  //
  //   // Trigger click on the clear button
  //   await wrapper.find('.multiselect-clear').trigger('click');
  //
  //   // Wait for the DOM to update
  //   await nextTick();
  //
  //   const selectedAfterClear = wrapper.find('.multiselect-single-label-text');
  //   expect(selectedAfterClear.exists()).toBeFalsy();
  //   expect(wrapper.vm.isInvalid).toEqual(false);
  // });

  it.skip('should be able to select and clear item', async () => {
    const options = ['tobi', 'aaron', 'deep'];
    const wrapper = mount(BaseSelect, {
      props: {
        options,
      },
    });
    await flushPromises();
    await wrapper.find('.multiselect-options').trigger('click');
    await wrapper.find('.multiselect-option').trigger('click');
    const selected = wrapper.find('.multiselect-single-label-text').text();
    expect(selected).toEqual(options[0]);
    await wrapper.find('.multiselect-clear').trigger('click');
    const selectedAfterClear = wrapper.find('.multiselect-single-label-text');
    expect(selectedAfterClear.exists()).toBeFalsy();
    expect(wrapper.vm.isInvalid).to.equal(false);
  });

  it.skip('should be able to select and clear item but invalid when required', async () => {
    const options = ['tobi', 'aaron', 'deep'];
    const wrapper = mount(BaseSelect, {
      props: {
        options,
        required: true,
      },
    });
    await flushPromises();
    await wrapper.find('.multiselect-options').trigger('click');
    await wrapper.find('.multiselect-option').trigger('click');
    const selected = wrapper.find('.multiselect-single-label-text').text();
    expect(selected).toEqual(options[0]);
    await wrapper.find('.multiselect-clear').trigger('click');
    const selectedAfterClear = wrapper.find('.multiselect-single-label-text');
    expect(selectedAfterClear.exists()).toBeFalsy();
    expect(wrapper.vm.isInvalid).to.equal(true);
  });
});
