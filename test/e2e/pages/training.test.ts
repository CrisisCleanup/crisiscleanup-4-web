import type { Locator } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { selectorMaskColor, testTitleWithTags } from '../utils';

test.describe('Training', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/training');
    await page.waitForLoadState();
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
        'testTrainingDiv',
        // Any one of these videos should work. Doesn't matter which one. - Aaron
        'testMandatoryTrainingVideoIframe',
        'testSupplimentPhoneTrainingIframe',
      ];
      const locators: Locator[] = [];
      for (const testId of dataTestIds) {
        const l = page.getByTestId(testId).first();
        locators.push(l);
        console.info('Checking visibility of', testId);
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
