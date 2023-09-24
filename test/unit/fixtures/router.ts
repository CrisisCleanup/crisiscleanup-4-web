import { vi } from 'vitest';

export interface MockRouterFixture {
  /**
   * Mock current route to contain authenticated meta.
   * @default true
   */
  authenticated?: boolean;
}

/**
 * Mock vue-router composition api hooks.
 *
 * @remarks
 * Due to how vitest hoists mocks to the top of the module,
 * the mock cannot be created here.
 *
 * @example
 * ```ts
 * vi.mock('vue-router', async () => (await import('../../fixtures/router')).buildMockRouter());
 * ```
 *
 * @param options mock options.
 */
export const buildMockRouter = (options?: MockRouterFixture) => {
  const { authenticated = true } = options ?? {};
  const useRouteMock = vi.fn();
  const useRouterMock = vi.fn(() => ({
    currentRoute: {
      value: {
        meta: {
          layout: authenticated ? 'authenticated' : 'unauthenticated',
        },
      },
    },
  }));

  return { useRoute: useRouteMock, useRouter: useRouterMock };
};
