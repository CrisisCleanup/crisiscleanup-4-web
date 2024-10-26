import type { Locator } from '@playwright/test';
import { expect, test } from '@playwright/test';
import {
  normalUserStatePath,
  selectorMaskColor,
  testTitleWithTags,
} from '../utils';

test.describe('UserProfile', () => {
  test.use({ storageState: normalUserStatePath });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    const profileMenuDiv = page.getByTestId('testAvatarIcon').first();
    await profileMenuDiv.click();
    const userProfileLink = page.getByTestId('testUserprofileProfileLink');
    await userProfileLink.click();
    await page.waitForURL(/.*\/profile.*/);
    await page.waitForLoadState('networkidle');
  });

  test(
    testTitleWithTags('should have visible data-testids', [
      'primary',
      'slow',
      'read',
      'development',
      'staging',
      'production',
    ]),
    async ({ page }) => {
      test.slow();
      const dataTestIds = [
        'testFirstNameAvatarIcon',
        'testProfilePictureUploadFile',
        'testChangePhotoButton',
        'testViewIdBadgeButton',
        'testFullNameInput',
        'testLastNameInput',
        'testEmailInput',
        'testMobileInput',
        'testUserRolesSelect',
        'testLanguagesSelect',
        'testFacebookTextInput',
        'testTwitterTextInput',
        'testChangePasswordButton',
        'testChangeOrganizationButton',
        'testResetUserStatesButton',
        'testResetUserPreferencesButton',
        'testDeleteUserAccountButton',
      ];

      const expandableSections = [
        'contact',
        'roles',
        'languages',
        'socialMedia',
        'betaFeatures',
        'equipment',
        'organization',
      ];

      // Expand all sections
      for (const section of expandableSections) {
        const testId = `testToggle${section}Section`;
        const toggleButton = page.getByTestId(testId).first();
        await toggleButton.scrollIntoViewIfNeeded();
        await expect(toggleButton).toBeVisible(); // Ensure it's visible
        await toggleButton.click();
        await page.waitForTimeout(100); // Optional slight delay to ensure UI stability
      }

      const locators: Locator[] = [];
      for (const testId of dataTestIds) {
        const l = page.getByTestId(testId).first();
        locators.push(l);
        await expect(l).toBeVisible();
      }

      await test.info().attach('reports-page-screenshot', {
        body: await page.screenshot({
          mask: locators,
          maskColor: selectorMaskColor,
          fullPage: true,
        }),
        contentType: 'image/png',
      });
    },
  );
});
