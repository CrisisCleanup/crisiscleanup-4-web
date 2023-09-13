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
      'slow',
      'primary',
      'development',
      'staging',
      'production',
    ]),
    async ({ page }) => {
      await expect(page).toHaveURL(urlRegexes.login);
      await doLoginActions(page);
      await expect(page).toHaveURL(urlRegexes.oauthCallback);
      await expect(page).toHaveURL(urlRegexes.dashboard);

      // go to profile
      const profileMenuDiv = page.getByTestId('testAvatarIcon').first();
      await profileMenuDiv.click();

      // logout user
      const logoutLink = page.getByTestId('testUserprofileLogoutLink');
      await logoutLink.click();

      await expect(page).toHaveURL(urlRegexes.login);
    },
  );
});
