import { expect, test, type Page, type Route } from '@playwright/test';
import { testTitleWithTags } from './utils';

/**
 * End-to-end cover for the global connectivity handling in
 * `src/modules/axios.ts` + `src/modules/toast.ts`.
 *
 * Runs UNAUTHENTICATED: omitting `test.use({ storageState })` is this suite's
 * opt-out, and every route touched here is public. The `chromium-unauth`
 * project in playwright.config.ts runs it without the auth setup dependency.
 *
 * All API traffic is intercepted, so the spec never touches the live
 * CrisisCleanup API and behaves identically offline and in CI.
 */

/**
 * Matches the API host in every environment (api.crisiscleanup.org,
 * api.dev/staging.crisiscleanup.io) and deliberately NOT the app origin, so
 * the SPA's own lazy-loaded chunks keep being served.
 */
const API_ROUTE = /^https?:\/\/api\.[^/]*crisiscleanup\.(org|io)\//;

const ERROR_TOAST = '.Vue-Toastification__toast--error';

/**
 * Must match CONNECTIVITY_ERROR_KEY in src/utils/errors.ts with the leading
 * `~~` sentinel stripped — main.ts's i18n patch removes it at runtime. Kept as
 * a literal because importing from src/ would drag Vue and Sentry into the
 * Playwright process.
 */
const CONNECTIVITY_MESSAGE =
  'Connection problem. Check your internet connection and try again.';

/**
 * Shape every list endpoint in this app returns. Written as a literal rather
 * than JSON.stringify of an object because the repo bans `null` in source
 * (unicorn/no-null) while the API contract genuinely uses it.
 */
const EMPTY_PAGE = '{"count":0,"next":null,"previous":null,"results":[]}';

type ApiMode = 'up' | 'down';

/**
 * Install a single switchable handler for all API traffic.
 *
 * `down` uses abort('failed'), which surfaces to axios as an ERR_NETWORK
 * AxiosError with no `response` — the exact shape `isConnectivityError`
 * looks for. Do NOT use abort('aborted'): that arrives as ECONNABORTED via
 * the XHR abort event, a different branch, and the test would go green
 * without ever exercising the path this change is about.
 */
async function stubApi(page: Page) {
  let mode: ApiMode = 'up';

  await page.route(API_ROUTE, async (route: Route) => {
    if (mode === 'down') {
      await route.abort('failed');
      return;
    }

    // The app sets axios.defaults.withCredentials (src/main.ts), so a
    // cross-origin fulfilled response is only accepted by the browser when it
    // echoes the exact origin and allows credentials. Without these headers
    // the "healthy" response is blocked and looks like an outage — which
    // silently inverts what this test claims to prove.
    const request = route.request();
    const origin = request.headers().origin ?? '*';
    const corsHeaders = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    };

    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: corsHeaders,
      body: EMPTY_PAGE,
    });
  });

  return {
    goOffline: () => {
      mode = 'down';
    },
    goOnline: () => {
      mode = 'up';
    },
  };
}

/**
 * Client-side navigation between two public routes.
 *
 * Deliberately not page.goto()/reload(): a document load rebuilds the SPA,
 * re-runs installErrorInterceptor() and resets its `noticeVisible` closure, so
 * the toast would disappear even if the dismiss logic were entirely broken —
 * the recovery assertion would pass vacuously.
 */
async function spaNavigate(page: Page, path: string) {
  await page.evaluate((to) => {
    globalThis.history.pushState({}, '', to);
    globalThis.dispatchEvent(new PopStateEvent('popstate'));
  }, path);
}

const toast = (page: Page) => page.locator(ERROR_TOAST);

test.describe('global connectivity handling', () => {
  test(
    testTitleWithTags(
      'raises one connectivity toast when requests fail and clears it on recovery',
      ['fast', 'primary', 'read', 'development', 'staging', 'production'],
    ),
    async ({ page }) => {
      const api = await stubApi(page);

      // Baseline: API healthy, nothing shouting at the user.
      await page.goto('/disasters');
      await page.waitForLoadState('networkidle');
      await expect(toast(page)).toHaveCount(0);

      // Cut the network, then trigger a fresh request.
      api.goOffline();
      await spaNavigate(page, '/disasters/archived');

      await expect(toast(page)).toHaveCount(1);
      await expect(toast(page)).toContainText(CONNECTIVITY_MESSAGE);

      // Let every failing request finish before healing the network. Without
      // this the phases overlap: a request that was already in flight can fail
      // after recovery and re-raise the notice, which made this flake.
      await page.waitForLoadState('networkidle');

      // Recovery must be driven by a successful response, not a reload.
      // Waiting on the response makes the precondition explicit — if the
      // navigation stopped issuing requests this fails here, loudly, instead
      // of silently racing the assertion below.
      api.goOnline();
      const recovered = page.waitForResponse(
        (response) =>
          API_ROUTE.test(response.url()) && response.status() === 200,
      );
      await spaNavigate(page, '/disasters');
      await recovered;

      await expect(toast(page)).toHaveCount(0);
    },
  );

  test(
    testTitleWithTags(
      'collapses a burst of simultaneous failures into a single toast',
      ['fast', 'primary', 'read', 'development', 'staging', 'production'],
    ),
    async ({ page }) => {
      const api = await stubApi(page);

      // Fail from the very first byte: a cold load fans out many requests.
      // Two mechanisms keep that to one notice — the stable toast id and the
      // content dedupe in src/modules/toast.ts — and this asserts the
      // user-visible result rather than either mechanism. Removing just one
      // still passes here; removing both does not. The id exemption itself is
      // pinned by test/unit/modules/toast.test.ts.
      api.goOffline();
      await page.goto('/disasters');

      await expect(toast(page)).toContainText(CONNECTIVITY_MESSAGE);
      await expect(toast(page)).toHaveCount(1);
    },
  );

  test(
    testTitleWithTags('keeps the connectivity toast up while still offline', [
      'slow',
      'secondary',
      'read',
      'development',
      'staging',
      'production',
    ]),
    async ({ page }) => {
      const api = await stubApi(page);

      api.goOffline();
      await page.goto('/disasters');
      await expect(toast(page)).toHaveCount(1);

      // Structural proof that `timeout: false` reached the component:
      // vue-toastification only renders a progress bar for a timed toast.
      await expect(
        toast(page).locator('.Vue-Toastification__progress-bar'),
      ).toHaveCount(0);

      // Behavioural proof: outlive the 10s default in src/modules/toast.ts.
      // An outage is a standing condition, so the notice must not self-expire.
      await page.waitForTimeout(13_000);
      await expect(toast(page)).toHaveCount(1);
    },
  );
});
