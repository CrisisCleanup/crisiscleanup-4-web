import { test, expect } from '@playwright/test';
import { testTitleWithTags, adminUserStatePath, urlRegexes } from './utils';

const mobileShell = 'testMobileHeader';
const desktopShell = 'testIsAuthenticatedDiv';

const viewports = [
  { name: 'phone in portrait', width: 390, height: 844, shell: mobileShell },
  { name: 'phone in landscape', width: 844, height: 390, shell: desktopShell },
  { name: 'tablet in portrait', width: 768, height: 1024, shell: desktopShell },
  { name: 'desktop', width: 1280, height: 800, shell: desktopShell },
];

test.describe('App shell by viewport', () => {
  test.use({ storageState: adminUserStatePath });

  for (const { name, width, height, shell } of viewports) {
    test(
      testTitleWithTags(
        `should show the ${
          shell === mobileShell ? 'mobile' : 'desktop'
        } shell on a ${name}`,
        ['fast', 'primary', 'read', 'development', 'staging', 'production'],
      ),
      async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto('/dashboard');
        await page.waitForURL(urlRegexes.dashboard);

        await expect(page.getByTestId(shell)).toBeVisible({ timeout: 60_000 });
        const otherShell = shell === mobileShell ? desktopShell : mobileShell;
        await expect(page.getByTestId(otherShell)).toHaveCount(0);
      },
    );
  }
});
