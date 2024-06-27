import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Spinner from '@/components/Spinner.vue'; // Adjust the path if necessary
import BaseButton from '@/components/BaseButton.vue'; // Adjust the path if necessary
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { nextTick } from 'vue';
import { useCurrentUser } from '@/hooks';

vi.mock('@/hooks', () => ({
  useCurrentUser: vi.fn().mockReturnValue({
    updateCurrentUser: vi.fn().mockResolvedValue({}),
  }),
}));

describe('Spinner.vue', () => {
  vi.useFakeTimers(); // Use fake timers to control setTimeout

  let wrapper: any;

  beforeEach(() => {
    wrapper = mount(Spinner, {
      global: {
        components: {
          BaseButton,
          FontAwesomeIcon,
        },
      },
    });
  });

  it('renders correctly with default props', () => {
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('[data-testid="testSpinnerDiv"]').exists()).toBe(true);
    expect(wrapper.findComponent(FontAwesomeIcon).exists()).toBe(true);
  });

  it('displays a random quote when showQuote is true', async () => {
    await wrapper.setProps({ showQuote: true });
    await nextTick(); // Wait for the DOM to update

    const quoteDiv = wrapper.find('.my-3');
    expect(quoteDiv.exists()).toBe(true);
    expect(quoteDiv.text()).toBeTruthy();
  });

  it('shows the reset button after 30 seconds when allowReset is true', async () => {
    await wrapper.setProps({ allowReset: true });
    vi.advanceTimersByTime(30_000); // Fast-forward time by 30 seconds
    await nextTick(); // Wait for the DOM to update

    const resetButton = wrapper.find('[data-testid="testSpinnerResetButton"]');
    expect(resetButton.exists()).toBe(true);
  });

  it('handles reset button action correctly', async () => {
    const { updateCurrentUser } = useCurrentUser();

    await wrapper.setProps({ allowReset: true });
    vi.advanceTimersByTime(30_000); // Fast-forward time by 30 seconds
    await nextTick(); // Wait for the DOM to update

    const resetButton = wrapper.find('[data-testid="testSpinnerResetButton"]');

    await resetButton.trigger('click');
    expect(updateCurrentUser).toHaveBeenCalledWith({ states: {} });
  });
});
