import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope } from 'vue';
import axios from 'axios';
import { rest } from 'msw';
import { flushPromises } from '@vue/test-utils';
import { server } from '../../setupTests';
import { useAuthStore } from '@/hooks/useAuth';

vi.mock('vue-router', () => ({
  useRoute: () => ({ fullPath: '/dashboard', meta: {}, query: {} }),
  useRouter: () => ({
    currentRoute: { value: { meta: {} } },
    isReady: async () => {},
    push: vi.fn(),
  }),
}));

vi.mock('vuex', () => ({
  useStore: () => ({ commit: vi.fn() }),
}));

const api = import.meta.env.VITE_APP_API_BASE_URL;
const originalLocation = window.location;

describe('useAuthStore', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { origin: 'http://localhost', href: 'http://localhost/dashboard' },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('gets new tokens from the session when a refresh fails, without a logout', async () => {
    const logout = vi.fn();
    const tokenRequests: string[] = [];
    server.use(
      rest.get(`${api}/authorized_tokens`, (req, res, ctx) =>
        res(ctx.status(401)),
      ),
      rest.post(`${api}/o/token/`, async (req, res, ctx) => {
        const grantType = new URLSearchParams(await req.text()).get(
          'grant_type',
        );
        tokenRequests.push(grantType ?? '');
        if (grantType === 'refresh_token') {
          return res(ctx.status(400), ctx.json({ error: 'invalid_grant' }));
        }
        return res(
          ctx.json({
            access_token: 'access-1',
            refresh_token: 'refresh-1',
            expires_in: 36_000,
            token_type: 'Bearer',
            scope: 'read write',
          }),
        );
      }),
      rest.get(`${api}/worksites`, (req, res, ctx) => res(ctx.status(401))),
      rest.post(`${api}/logout/`, (req, res, ctx) => {
        logout();
        return res(ctx.status(200));
      }),
      rest.post(`${api}/o/revoke_token/`, (req, res, ctx) =>
        res(ctx.status(200)),
      ),
    );
    sessionStorage.setItem('code-verifier', 'test-verifier');

    const scope = effectScope();
    const auth = scope.run(() => useAuthStore())!;
    await auth.exchange('code-1');
    await flushPromises();
    expect(auth.isAuthenticated.value).toBe(true);

    // The access token expired: the API answers 401, so the app refreshes.
    void axios.get(`${api}/worksites`);
    await vi.waitFor(() =>
      expect(window.location.href).toContain('/o/authorize/'),
    );

    expect(tokenRequests).toEqual(['authorization_code', 'refresh_token']);
    expect(logout).not.toHaveBeenCalled();
    scope.stop();
  });
});
