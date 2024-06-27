import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import CardStack from '@/components/live/CardStack.vue'; // Adjust the import path as necessary
import EventCard from '@/components/live/EventCard.vue';
import hexToRgba from 'hex-to-rgba';
import { useI18n } from 'vue-i18n';

// Mock the i18n and other dependencies
vi.mock('@/components/live/EventCard.vue', () => ({
  __esModule: true,
  default: {
    name: 'EventCard',
    template: '<div class="event-card"></div>',
  },
}));

vi.mock('hex-to-rgba', () => ({
  __esModule: true,
  default: vi.fn(() => 'rgba(0,0,0,0.25)'),
}));

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: vi.fn((key, value) => {
      const translations = {
        'events.event_created': 'Event Created',
      };
      return translations[key] || key;
    }),
  }),
}));

const mockEvent = {
  id: '1',
  past_tense_t: 'event_created',
  attr: {
    actor_first_name: 'John',
    actor_last_name: 'Doe',
    actor_organization_name: 'Organization',
  },
};

describe('CardStack', () => {
  it('renders correctly', () => {
    const wrapper = mount(CardStack);
    expect(wrapper.exists()).toBe(true);
  });

  it('renders EventCard components correctly', () => {
    const wrapper = mount(CardStack, {
      data() {
        return {
          cards: [
            {
              event: mockEvent,
              color: '#000000',
              strokeColor: '#FFFFFF',
            },
          ],
        };
      },
    });

    expect(wrapper.findAllComponents(EventCard).length).toBe(1);
  });

  it('adds a card correctly', async () => {
    const wrapper = mount(CardStack);
    const { addCardComponent, cards } = wrapper.vm as any;

    addCardComponent({
      event: mockEvent,
      color: '#000000',
      strokeColor: '#FFFFFF',
    });

    await wrapper.vm.$nextTick();

    expect(cards.length).toBe(1);
    expect(wrapper.findAllComponents(EventCard).length).toBe(1);
  });

  it('clears cards correctly', async () => {
    const wrapper = mount(CardStack, {
      data() {
        return {
          cards: [
            {
              event: mockEvent,
              color: '#000000',
              strokeColor: '#FFFFFF',
            },
          ],
        };
      },
    });

    const { clearCards, cards } = wrapper.vm as any;

    clearCards();

    await wrapper.vm.$nextTick();

    expect(cards.length).toBe(0);
    expect(wrapper.findAllComponents(EventCard).length).toBe(0);
  });

  it('limits the number of cards to 10', async () => {
    const wrapper = mount(CardStack);
    const { addCardComponent, cards } = wrapper.vm as any;

    for (let i = 0; i < 15; i++) {
      addCardComponent({
        event: { ...mockEvent, id: i.toString() },
        color: '#000000',
        strokeColor: '#FFFFFF',
      });
    }

    await wrapper.vm.$nextTick();

    expect(cards.length).toBe(10);
    expect(wrapper.findAllComponents(EventCard).length).toBe(10);
  });

  it('does not add a duplicate card', async () => {
    const wrapper = mount(CardStack);
    const { addCardComponent, cards } = wrapper.vm as any;

    addCardComponent({
      event: mockEvent,
      color: '#000000',
      strokeColor: '#FFFFFF',
    });

    await wrapper.vm.$nextTick();

    expect(cards.length).toBe(1);

    addCardComponent({
      event: mockEvent,
      color: '#000000',
      strokeColor: '#FFFFFF',
    });

    await wrapper.vm.$nextTick();

    expect(cards.length).toBe(1);
  });
});
