import { flushPromises, shallowMount } from '@vue/test-utils';
import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Survivors from '@/pages/unauthenticated/Survivors.vue';

vi.mock('axios');
vi.mock('vue-toastification', () => ({ useToast: () => ({ error: vi.fn() }) }));
vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRoute: () => ({ params: { token: 'abc123' } }),
  useRouter: () => ({ push: vi.fn() }),
}));

const invalidLink = 'survivorContact.invalid_expired_token';

type Resolve = (response: { data: unknown }) => void;

/** Answers each request by URL and holds the token request open. */
function mockApi() {
  let resolveToken: Resolve = () => {};
  vi.mocked(axios.get).mockImplementation(async (url: string) => {
    if (url.includes('/survivor_tokens/')) {
      return new Promise((resolve) => {
        resolveToken = resolve as Resolve;
      });
    }
    return { data: { results: [] } };
  });
  return {
    resolveToken: (data: unknown) => {
      resolveToken({ data });
    },
  };
}

describe('Survivors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a loading placeholder, not the invalid link message, while the token loads', async () => {
    mockApi();
    const wrapper = shallowMount(Survivors);
    await flushPromises();

    expect(
      wrapper.find('[data-testid="testSurvivorLoadingDiv"]').exists(),
    ).toBe(true);
    expect(wrapper.text()).not.toContain(invalidLink);
  });

  it('shows the invalid link message after the token request returns no token', async () => {
    const api = mockApi();
    const wrapper = shallowMount(Survivors);
    await flushPromises();
    api.resolveToken(null);
    await flushPromises();

    expect(
      wrapper.find('[data-testid="testSurvivorLoadingDiv"]').exists(),
    ).toBe(false);
    expect(wrapper.text()).toContain(invalidLink);
  });

  it('requests the token while the request for the questions is still open', async () => {
    const started: string[] = [];
    vi.mocked(axios.get).mockImplementation(async (url: string) => {
      started.push(url);
      return new Promise(() => {});
    });
    shallowMount(Survivors);
    await flushPromises();

    expect(started.some((url) => url.includes('/cms?tags=faq'))).toBe(true);
    expect(started.some((url) => url.includes('/survivor_tokens/'))).toBe(true);
  });
});
