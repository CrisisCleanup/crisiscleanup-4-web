import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import moment from '@/utils/dates';

// Vue's runtime $t in the template is provided by vue-i18n's global install,
// which we don't run in tests — mock it via mount config below. The local
// useI18n() (used inside other helpers) is still mocked to a passthrough.
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (k: string) => k,
    te: () => false,
  }),
}));

// Placeholder values are always primitives in this codebase — a tighter
// attrs type lets `String(...)` lint clean.
type Attrs = Record<string, string | number>;

const $tStub = (k: string, attrs?: Attrs) =>
  attrs
    ? k.replaceAll(/{(\w+)}/g, (_, name: string) => String(attrs[name] ?? ''))
    : k;

const mountOpts = { global: { mocks: { $t: $tStub } } };

// Stub axios so row-click promise wiring doesn't make real network calls if
// the LiveLeaderboard test ever exercises it.
vi.mock('axios', () => ({
  default: { get: vi.fn(() => Promise.resolve({ data: { results: [] } })) },
}));

// `OrganizationActivityModal` pulls in a transitive web of utils we don't
// need under test — replace it with a passthrough stub.
vi.mock('@/components/live/OrganizationActivityModal.vue', () => ({
  default: {
    name: 'OrganizationActivityModal',
    template: '<div data-testid="testOrgActivityModalStub" />',
  },
}));

import LiveLeaderboard from '@/components/live/LiveLeaderboard.vue';

const ORGS = Array.from({ length: 12 }).map((_, i) => ({
  id: i + 1,
  name: `Org ${String(i + 1).padStart(2, '0')}`,
  reported_count: 100 + i * 10,
  claimed_count: 200,
  closed_count: 50 + i,
  calls_count: 12,
  // Ascending value so the leaderboard's descending sort is observable.
  commercial_value: (i + 1) * 100_000,
}));

describe('LiveLeaderboard', () => {
  it('renders the section header with a Top-N counter', () => {
    const wrapper = mount(LiveLeaderboard, {
      ...mountOpts,
      props: {
        organizations: ORGS,
        queryFilter: { start_date: moment(), end_date: moment() },
        overlayStyles: {},
      },
    });
    expect(wrapper.text()).toContain('Leaderboard');
    // The `~~Top {shown} of {total}` key is interpolated by the $t mock.
    expect(wrapper.text()).toContain(`Top 8 of ${ORGS.length}`);
  });

  it('caps the visible list to `visibleCount` and sorts by commercial_value desc', () => {
    const wrapper = mount(LiveLeaderboard, {
      ...mountOpts,
      props: {
        organizations: ORGS,
        queryFilter: { start_date: moment(), end_date: moment() },
        overlayStyles: {},
        visibleCount: 5,
      },
    });
    const rows = wrapper.findAll('.leaderboard__row');
    expect(rows).toHaveLength(5);
    // First row is the highest commercial_value org (Org 12).
    expect(rows[0].text()).toContain('Org 12');
    // Rank is two-digit zero-padded.
    expect(rows[0].find('.leaderboard__rank').text()).toBe('01');
  });

  it('formats commercial values compactly (e.g. 1.2M)', () => {
    const wrapper = mount(LiveLeaderboard, {
      ...mountOpts,
      props: {
        organizations: [
          { id: 1, name: 'BigOrg', commercial_value: 2_400_000 },
          { id: 2, name: 'SmallOrg', commercial_value: 980 },
        ],
        queryFilter: { start_date: moment(), end_date: moment() },
        overlayStyles: {},
      },
    });
    const text = wrapper.text();
    expect(text).toContain('2.4M');
    expect(text).toContain('980');
  });

  it('expands the list via the View all button', async () => {
    const wrapper = mount(LiveLeaderboard, {
      ...mountOpts,
      props: {
        organizations: ORGS,
        queryFilter: { start_date: moment(), end_date: moment() },
        overlayStyles: {},
        visibleCount: 5,
      },
    });
    expect(wrapper.findAll('.leaderboard__row')).toHaveLength(5);
    await wrapper
      .find('[data-testid="testLeaderboardViewAllBtn"]')
      .trigger('click');
    // Expanded cap is 50; the fixture only has 12, so all 12 render.
    expect(wrapper.findAll('.leaderboard__row')).toHaveLength(ORGS.length);
    expect(
      wrapper.find('[data-testid="testLeaderboardCollapseBtn"]').exists(),
    ).toBe(true);
  });

  it('renders an empty state when there are no orgs', () => {
    const wrapper = mount(LiveLeaderboard, {
      ...mountOpts,
      props: {
        organizations: [],
        queryFilter: { start_date: moment(), end_date: moment() },
        overlayStyles: {},
      },
    });
    // The `~~No data` key resolves to "No data" through the stubbed t().
    expect(wrapper.text()).toContain('No data');
    expect(wrapper.findAll('.leaderboard__row')).toHaveLength(0);
  });
});
