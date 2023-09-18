import { test, expect } from '@playwright/test';
import { testTitleWithTags, doLoginActions } from './utils';

const urlRegexes = {
  login: /.*\/login\/.*/,
  oauthCallback: /.*\/o\/callback\?.*code=.*/,
  oauthAuthorize: /.*\/o\/authorize\?.*code=.*/,
  dashboard: /.*\/incident\/.*\/dashboard/,
  profile: /.*\/profile/,
};

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState();
  });

  test(
    testTitleWithTags('should login and logout', [
      'fast',
      'primary',
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

  // Currently fails when no code is provided on /o/callback url
  test.fixme(
    testTitleWithTags(
      'should terminate the current exchange flow and bring user back to login if authorization code during callback is invalid or missing',
      ['slow', 'primary', 'development', 'staging', 'production'],
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
});
