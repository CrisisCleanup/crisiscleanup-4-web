import { test, expect, type Page } from '@playwright/test';
import {
  testTitleWithTags,
  doLoginActions,
  doLogin,
  urlRegexes,
} from './utils';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState();
  });

  test(
    testTitleWithTags('should login and logout', [
      'fast',
      'secondary',
      'development',
      'staging',
      'production',
    ]),
    async ({ page }) => {
      await expect(page).toHaveURL(urlRegexes.login);
      await doLoginActions(page);
      await expect(page).toHaveURL(urlRegexes.oauthCallback);
      await expect(page).toHaveURL(urlRegexes.dashboard, { timeout: 15_000 });

      // go to profile
      const profileMenuDiv = page.getByTestId('testAvatarIcon').first();
      await profileMenuDiv.click();

      // logout user
      const logoutLink = page.getByTestId('testUserprofileLogoutLink');
      await logoutLink.click();

      await expect(page).toHaveURL(urlRegexes.login);
    },
  );

  test(
    testTitleWithTags(
      'should redirect to 404 page when navigating to an invalid route, regardless of authentication status',
      ['fast', 'secondary', 'development', 'staging', 'production'],
    ),
    async ({ page }) => {
      const invalidRoutes = [
        '/invalid-route',
        '/qwerty',
        '/work-page',
        '/phone-system',
      ];
      const assertIs404 = () =>
        expect(page.locator('[data-testid="test404Div"]')).toBeVisible();
      const visitAndAssert = async () => {
        for (const route of invalidRoutes) {
          await page.goto(route);
          await assertIs404();
        }
      };
      // When user is logged out
      await visitAndAssert();
      // When user is logged in
      await page.goto('/login');
      await doLogin(page);
      await visitAndAssert();
    },
  );

  test(
    testTitleWithTags(
      'should redirect to authorize on attempt to load authorized page with no token/session',
      ['fast', 'secondary', 'development', 'staging', 'production'],
    ),
    async ({ page }) => {
      const authedRoutesAndTestIds: Array<[string, string]> = [
        ['/dashboard', 'testDashboarddiv'],
        ['/admin', 'testAdminDashboardDiv'],
      ];
      for (const [route, testId] of authedRoutesAndTestIds) {
        await page.goto(route);
        await expect(page.locator(`[data-testid="${testId}"]`)).toBeHidden({
          timeout: 15_000,
        });
        await expect(page).toHaveURL(urlRegexes.login);
      }
    },
  );

  // Currently fails when no code is provided on /o/callback url
  test.fixme(
    testTitleWithTags(
      'should terminate the current exchange flow and bring user back to login if authorization code during callback is invalid or missing',
      ['slow', 'secondary', 'development', 'staging', 'production'],
    ),
    async ({ page }) => {
      await expect(page).toHaveURL(urlRegexes.login);
      // Navigate to the OAuth callback URL without a valid code
      await page.goto('/o/callback');
      await expect(page).toHaveURL(urlRegexes.login);
      // Navigate to the OAuth callback URL with an invalid code
      await page.goto('/o/callback?code=abc123');
      await expect(page).toHaveURL(urlRegexes.login);
    },
  );

  test(
    testTitleWithTags(
      'should load unauthorized routes as expected with and without authentication',
      ['slow', 'primary', 'development', 'staging', 'production'],
    ),
    async ({ page }) => {
      test.slow();
      const navigateAndCheck = async (
        page: Page,
        url: string,
        testId: string,
      ) => {
        await page.goto(url);
        await page.waitForLoadState();
        await page.waitForSelector(`[data-testid="${testId}"]`, {
          state: 'visible',
        });
        await expect(page).toHaveURL(url, { timeout: 15_000 });
      };
      await expect(page).toHaveURL(urlRegexes.login, { timeout: 15_000 });
      // visit unauthed pages
      await navigateAndCheck(page, '/training', 'testTrainingDiv');
      await navigateAndCheck(page, '/about', 'testAboutDiv');
      // do login
      await page.goto('/');
      await page.waitForLoadState();
      await doLogin(page);
      // revisit unauthed pages
      await navigateAndCheck(page, '/training', 'testTrainingDiv');
      await navigateAndCheck(page, '/about', 'testAboutDiv');
    },
  );

  test(
    testTitleWithTags(
      'should redirect from login related unauthorized pages with existing session',
      ['slow', 'primary', 'development', 'staging', 'production'],
    ),
    async ({ page }) => {
      const assertIsDashboard = () =>
        expect(page).toHaveURL(urlRegexes.dashboard, { timeout: 15_000 });
      await doLogin(page);
      // should redirect back to dashboard page
      await page.goto('/login');
      await assertIsDashboard();
    },
  );
});
