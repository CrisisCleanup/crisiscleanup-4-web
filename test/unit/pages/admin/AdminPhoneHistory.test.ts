import { flushPromises, mount } from '@vue/test-utils';
import { rest } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminPhoneHistory from '@/pages/admin/AdminPhoneHistory.vue';
import { server } from '../../../setupTests';

vi.mock('@/hooks/useLogEvent', () => ({
  default: () => ({
    logEvent: vi.fn(),
  }),
}));

const apiBase = import.meta.env.VITE_APP_API_BASE_URL;
const historyUrl = `${apiBase}/admins/phone/history`;
const requests: URL[] = [];
const detailRequests: string[] = [];

function recordRequest(req: Parameters<Parameters<typeof rest.get>[1]>[0]) {
  requests.push(new URL(req.url.toString()));
}

function mountPage() {
  return mount(AdminPhoneHistory, {
    global: {
      stubs: {
        'ccu-icon': true,
        'font-awesome-icon': true,
        spinner: true,
        'base-select': true,
      },
    },
  });
}

describe('AdminPhoneHistory.vue', () => {
  beforeEach(() => {
    requests.length = 0;
    detailRequests.length = 0;
    server.use(
      rest.get(historyUrl, (req, res, ctx) => {
        recordRequest(req);
        return res(
          ctx.status(200),
          ctx.json({
            count: 120,
            results: [
              {
                id: 44,
                created_at: '2024-01-02T03:04:05Z',
                end_at: '2024-01-02T03:14:05Z',
                inbound: 12,
                dnis: 425_198,
                phone_number: '5558675309',
                user: 31_989,
                user_first_name: 'Ada',
                user_last_name: 'Lovelace',
                user_email: 'ada@example.test',
                incident: 248,
                incident_name: 'Test Incident',
                status: 105_860,
                status_text: 'answered_other',
                status_notes: 'Helpful call',
                session_id: 'session-44',
                recording_url:
                  'https://recordings.example.test/list-call-44.mp3',
              },
              {
                id: 45,
                created_at: '2024-01-03T03:04:05Z',
                end_at: '2024-01-03T03:14:05Z',
                outbound: 13,
                dnis: 425_199,
                phone_number: '5558675310',
                user: 31_990,
                user_first_name: 'Grace',
                user_last_name: 'Hopper',
                user_email: 'grace@example.test',
                incident: null,
                status: null,
                status_notes: 'No recording call',
                session_id: 'session-45',
              },
            ],
          }),
        );
      }),
      rest.get(`${historyUrl}/:id`, (req, res, ctx) => {
        detailRequests.push(String(req.params.id));
        return res(
          ctx.status(200),
          ctx.json({
            id: req.params.id,
            recording_url: 'https://recordings.example.test/call-44.mp3',
          }),
        );
      }),
    );
  });

  it('loads the first page with the default query', async () => {
    mountPage();

    await vi.waitFor(() => expect(requests).toHaveLength(1));

    expect(requests[0].searchParams.get('sort')).toBe('-created_at');
    expect(requests[0].searchParams.get('limit')).toBe('50');
    expect(requests[0].searchParams.get('offset')).toBe('0');
    expect(requests[0].searchParams.has('search')).toBe(false);
  });

  it('shows agent email and hides recording controls when no recording exists', async () => {
    const wrapper = mountPage();
    await vi.waitFor(() =>
      expect(wrapper.text()).toContain('ada@example.test'),
    );

    expect(wrapper.text()).toContain('Grace Hopper');
    expect(wrapper.text()).toContain('grace@example.test');
    expect(
      wrapper
        .find('[data-testid="testAdminPhoneHistoryRecordingButton_45"]')
        .exists(),
    ).toBe(false);
    expect(wrapper.text()).not.toContain('~~No recording');
  });

  it('applies search and date filters and resets pagination', async () => {
    const wrapper = mountPage();
    await vi.waitFor(() => expect(requests).toHaveLength(1));

    await wrapper.find('.js-pagination-trigger-2').trigger('click');
    await vi.waitFor(() =>
      expect(requests.at(-1)?.searchParams.get('offset')).toBe('50'),
    );

    await wrapper
      .find('[data-testid="testAdminPhoneHistorySearchInput"] input')
      .setValue('session-44');
    await wrapper
      .find('[data-testid="testAdminPhoneHistoryStartDateInput"] input')
      .setValue('2024-01-01');
    await wrapper
      .find('[data-testid="testAdminPhoneHistoryEndDateInput"] input')
      .setValue('2024-01-31');

    await vi.waitFor(() => {
      const lastRequest = requests.at(-1);
      expect(lastRequest?.searchParams.get('search')).toBe('session-44');
      expect(lastRequest?.searchParams.get('created_at__gte')).toBe(
        '2024-01-01',
      );
      expect(lastRequest?.searchParams.get('created_at__lte')).toBe(
        '2024-01-31',
      );
      expect(lastRequest?.searchParams.get('offset')).toBe('0');
    });
  });

  it('sends API-compatible sort values', async () => {
    const wrapper = mountPage();
    await vi.waitFor(() => expect(requests).toHaveLength(1));

    await wrapper
      .find('[data-testid="testColumncreated_atDiv"]')
      .trigger('click');
    await vi.waitFor(() =>
      expect(requests.at(-1)?.searchParams.get('sort')).toBe('created_at'),
    );
    await vi.waitFor(() =>
      expect(
        wrapper
          .find('[data-testid="testColumnSortAscendingcreated_atIcon"]')
          .exists(),
      ).toBe(true),
    );

    await wrapper
      .find('[data-testid="testColumncreated_atDiv"]')
      .trigger('click');
    await vi.waitFor(() =>
      expect(requests.at(-1)?.searchParams.get('sort')).toBe('-created_at'),
    );
  });

  it('fetches call details before rendering recording audio', async () => {
    const wrapper = mountPage();
    await vi.waitFor(() => expect(requests).toHaveLength(1));

    await wrapper
      .find('[data-testid="testAdminPhoneHistoryRecordingButton_44"]')
      .trigger('click');
    await flushPromises();

    await vi.waitFor(() => expect(detailRequests).toEqual(['44']));
    const audio = wrapper.find(
      '[data-testid="testAdminPhoneHistoryRecordingAudio_44"]',
    );
    expect(audio.exists()).toBe(true);
    expect(audio.attributes('src')).toBe(
      'https://recordings.example.test/call-44.mp3',
    );
  });
});
