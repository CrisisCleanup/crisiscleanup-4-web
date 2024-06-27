import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import EventCard from '@/components/live/EventCard.vue'; // Adjust the import path as necessary
import { momentFromNow } from '@/filters';
import useWorktypeImages from '@/hooks/worksite/useWorktypeImages';
import { useI18n } from 'vue-i18n';

// Mock the i18n and other hooks
vi.mock('@/hooks/worksite/useWorktypeImages', () => ({
  __esModule: true,
  default: () => ({
    getWorktypeSVG: vi.fn(() => '<svg></svg>'),
  }),
}));

vi.mock('@/filters', () => ({
  momentFromNow: vi.fn(() => 'a few seconds ago'),
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
  event_key: 'event:created',
  created_at: '2023-10-01T12:00:00Z',
  attr: {
    actor_first_name: 'John',
    actor_last_name: 'Doe',
    actor_organization_name: 'Organization',
    patient_name_t: 'work_type.medical',
    patient_status: 'active',
  },
  past_tense_t: 'created',
};

describe('EventCard', () => {
  it('renders correctly with required props', () => {
    const wrapper = mount(EventCard, {
      props: {
        currentEvent: mockEvent,
      },
    });

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).toContain('John Doe');
    expect(wrapper.text()).toContain('Organization');
    expect(wrapper.text()).toContain('a few seconds ago');
  });

  it('renders the event title correctly', () => {
    const wrapper = mount(EventCard, {
      props: {
        currentEvent: mockEvent,
      },
    });

    expect(wrapper.text()).toContain('Event Created');
  });

  it('renders the header SVG correctly', () => {
    const wrapper = mount(EventCard, {
      props: {
        currentEvent: mockEvent,
      },
    });

    expect(wrapper.html()).toContain('<svg></svg>');
  });

  it('matches snapshot', () => {
    const wrapper = mount(EventCard, {
      props: {
        currentEvent: mockEvent,
      },
    });

    expect(wrapper.html()).toMatchInlineSnapshot(`
      "<div class=\\"text-xs\\">
        <div class=\\"flex items-center justify-between\\">
          <div class=\\"flex gap-1 justify-center items-center\\">
            <span><svg></svg></span>
            <span class=\\"text-xs font-bold\\">Event Created</span>
          </div>
          <span class=\\"text-[0.6rem] font-extralight\\">a few seconds ago</span>
        </div>
        <div>
          <span>John Doe</span> from <span>Organization</span> created
        </div>
      </div>"
    `);
  });
});
