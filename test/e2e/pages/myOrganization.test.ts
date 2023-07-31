import type { Locator } from '@playwright/test';
import { expect, test } from '@playwright/test';
import {
  normalUserStatePath,
  selectorMaskColor,
  testTitleWithTags,
} from '../utils';

test.describe('WorkPage', () => {
  test.use({ storageState: normalUserStatePath });

  const myOrgTabs = {
    INVITATION_MANAGEMENT: 'Invitation Management',
    USER_MANAGEMENT: 'User Management',
    TEAM_MANAGEMENT: 'Team Management',
    ORGANIZATION_PROFILE: 'Organization Profile',
    AFFILIATED_ORGANIZATIONS: 'Affiliated Organizations',
    LAYER_LIBRARY: 'Layer Library',
  };

  const tabTestIds = [
    'testMyOrganizationNavinvitationsLink',
    'testMyOrganizationNavusersLink',
    'testMyOrganizationNavteamsLink',
    'testMyOrganizationNavprofileLink',
    'testMyOrganizationNavaffiliatesLink',
    'testMyOrganizationNavlayersLink',
  ];

  const commonTestIds = ['testMyOrganizationDashboardDiv'];

  test.beforeEach(async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/dashboard');
    const myOrgLink = page.getByTestId('testmy_organizationLink');
    await myOrgLink.click();
    await page.waitForURL(/.*\/organization\/.*/);
    await page.waitForLoadState('networkidle');
  });

  test(
    testTitleWithTags('should have visible data-testids', [
      'primary',
      'slow',
      'development',
      'staging',
      'production',
    ]),
    async ({ page }) => {
      test.slow();
      const dataTestIds = [...commonTestIds, ...tabTestIds];
      const locators: Locator[] = [];
      for (const testId of dataTestIds) {
        const l = page.getByTestId(testId).first();
        locators.push(l);
        console.info('Checking visibility of', testId);
        await expect(l).toBeVisible({ timeout: 30_000 });
      }

      await test.info().attach('my-organization-page-screenshot', {
        body: await page.screenshot({
          mask: locators,
          maskColor: selectorMaskColor,
          fullPage: true,
        }),
        contentType: 'image/png',
      });
    },
  );

  test(
    testTitleWithTags(
      `${myOrgTabs.INVITATION_MANAGEMENT}: should display all required elements`,
      ['primary', 'slow', 'development', 'staging', 'production'],
    ),
    async ({ page }) => {
      test.slow();
      const tabLink = page.getByTestId('testMyOrganizationNavinvitationsLink');
      await tabLink.click();
      const rootDiv = page.getByTestId('testMyOrganizationDashboardDiv');
      await expect(rootDiv).toHaveText(/.*current requests.*/i);
      await expect(rootDiv).toHaveText(/.*incomplete invitations.*/i);
      const dataTestIds = [
        'testInviteNewUserButton',
        'testExportInvitationRequestsButton',
        'testInvitationRequestsTable',
        'testExportInvitationsButton',
        'testDeleteExpiredInvitationsButton',
        'testInvitationsTable',
      ];
      const locators: Locator[] = [];
      for (const testId of dataTestIds) {
        const l = page.getByTestId(testId).first();
        locators.push(l);
        await expect(l).toBeVisible();
      }

      await test
        .info()
        .attach(
          `my-organization-${myOrgTabs.INVITATION_MANAGEMENT}-page-screenshot`,
          {
            body: await page.screenshot({
              mask: locators,
              maskColor: '#ff00ff11',
              fullPage: true,
            }),
            contentType: 'image/png',
          },
        );
    },
  );
});
