import type { Locator } from '@playwright/test';
import { expect, test } from '@playwright/test';
import {
  normalUserStatePath,
  selectorMaskColor,
  testTitleWithTags,
} from '../utils';

test.describe('MyOrganization', () => {
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
    await page.goto('/dashboard');
    const myOrgLink = page.getByTestId('testmy_organizationLink');
    await myOrgLink.click();
    await page.waitForURL(/.*\/organization\/.*/);
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
      ['primary', 'slow', 'read', 'development', 'staging', 'production'],
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

  test(
    testTitleWithTags(
      `${myOrgTabs.USER_MANAGEMENT}: should display all required elements`,
      ['primary', 'slow', 'read', 'development', 'staging', 'production'],
    ),
    async ({ page }) => {
      test.slow();
      const tabLink = page.getByTestId('testMyOrganizationNavusersLink');
      await tabLink.click();
      const dataTestIds = [
        'testInviteNewUserButton',
        'testUserSearch',
        'testUserTable',
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
          `my-organization-${myOrgTabs.USER_MANAGEMENT}-page-screenshot`,
          {
            body: await page.screenshot({
              mask: locators,
              maskColor: selectorMaskColor,
              fullPage: true,
            }),
            contentType: 'image/png',
          },
        );
    },
  );

  test(
    testTitleWithTags(
      `${myOrgTabs.TEAM_MANAGEMENT}: should display all required elements`,
      ['secondary', 'slow', 'read', 'development', 'staging', 'production'],
    ),
    async ({ page }) => {
      test.slow();
      const tabLink = page.getByTestId('testMyOrganizationNavteamsLink');
      await tabLink.click();
      const dataTestIds = [
        'testTeamSearch',
        'testTeamCreateBtn',
        'testTeamsContainerDiv',
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
          `my-organization-${myOrgTabs.TEAM_MANAGEMENT}-page-screenshot`,
          {
            body: await page.screenshot({
              mask: locators,
              maskColor: selectorMaskColor,
              fullPage: true,
            }),
            contentType: 'image/png',
          },
        );
    },
  );

  test(
    testTitleWithTags(
      `${myOrgTabs.ORGANIZATION_PROFILE}: should display all required elements`,
      ['primary', 'slow', 'read', 'development', 'staging', 'production'],
    ),
    async ({ page }) => {
      test.slow();
      const tabLink = page.getByTestId('testMyOrganizationNavprofileLink');
      await tabLink.click();
      const dataTestIds = [
        'testSaveButton',
        // 'testOrganizationLogoFile',
        'testOrganizationLogoIcon',
        'testOrganizationLogo2File',
        'testUpdateLogoButton',
        'testOrganizationNameTextInput',
        'testAddressTextInput',
        'testUrlTextInput',
        'testEmailTextInput',
        'testPhoneTextInput',
        'testOrganizationTypeTextInput',
        'testPrimaryContactsDiv',
        'testAddPrimaryContactsSearch',
        'testFacebookTextInput',
        'testTwitterTextInput',
        'testDonationUrlTextInput',
        'testCapabilitiesMatrixInput',
        'testCurrentIncidentsContent',
        'testApprovedIncidentsDiv',
        'testPendingIncidentsDiv',
        'testEditPrimaryLocationButton',
        // 'testAddPrimaryLocationButton',
        // 'testContactHelpChangeResponseButton',
        // 'testEditSecondaryLocationButton',
        // 'testAddSecondaryLocationButton',
        // 'testContactHelpChangeResponse2Button',
        // 'testSelectLocationModal',
        'testSaveButton',
        'testCustomOpsMessageTextArea',
        'testAddCustomTosTextInput',
        // 'testDeleteIcon',
        'testTermsOfServiceFile',
        'testAddTermsButton',
        'testCustomLegalTosTextArea',
        'testAddCustomLiabilityInput',
        // 'testDeleteLiabilityWaiverButton',
        'testLiabilityWaiverFile',
        'testCustomSurvivorWaiverButton',
        'testAddSurvivorWaiverTextTextArea',
      ];
      const locators: Locator[] = [];
      for (const testId of dataTestIds) {
        const l = page.getByTestId(testId).first();
        locators.push(l);
        console.info('Checking visibility of', testId);
        await expect(l).toBeVisible();
      }

      await test
        .info()
        .attach(
          `my-organization-${myOrgTabs.ORGANIZATION_PROFILE}-page-screenshot`,
          {
            body: await page.screenshot({
              mask: locators,
              maskColor: selectorMaskColor,
              fullPage: true,
            }),
            contentType: 'image/png',
          },
        );
    },
  );

  test(
    testTitleWithTags(
      `${myOrgTabs.AFFILIATED_ORGANIZATIONS}: should display all required elements`,
      ['secondary', 'slow', 'read', 'development', 'staging', 'production'],
    ),
    async ({ page }) => {
      test.slow();
      const tabLink = page.getByTestId('testMyOrganizationNavaffiliatesLink');
      await tabLink.click();
      const addAffiliateButton = page.getByTestId('testAddAffiliateButton');
      await addAffiliateButton.click();
      const rootDataTestIds = ['testAddAffiliateButton', 'testAffiliatesTable'];
      const modalDataTestIds = [
        'testRequestAffiliateModal',
        'testSelectedAffiliateSearch',
        'testRequestReasonTextArea',
        'testCancelButton',
        'testInviteButton',
      ];
      const dataTestIds = [...rootDataTestIds, ...modalDataTestIds];
      const locators: Locator[] = [];
      for (const testId of dataTestIds) {
        const l = page.getByTestId(testId).first();
        locators.push(l);
        await expect(l).toBeVisible();
      }

      await test
        .info()
        .attach(
          `my-organization-${myOrgTabs.AFFILIATED_ORGANIZATIONS}-page-screenshot`,
          {
            body: await page.screenshot({
              mask: locators,
              maskColor: selectorMaskColor,
              fullPage: true,
            }),
            contentType: 'image/png',
          },
        );
    },
  );

  test(
    testTitleWithTags(
      `${myOrgTabs.LAYER_LIBRARY}: should display all required elements`,
      ['secondary', 'slow', 'read', 'development', 'staging', 'production'],
    ),
    async ({ page }) => {
      test.slow();
      const tabLink = page.getByTestId('testMyOrganizationNavlayersLink');
      await tabLink.click();
      const dataTestIds = [
        'testDragDropShpKmlFile',
        'testGetLocationsSearch',
        'testLocationTypeFilterSelect',
        'testCreateLocationButton',
        'testLocationsTable',
      ];
      const locators: Locator[] = [];
      for (const testId of dataTestIds) {
        const l = page.getByTestId(testId).first();
        locators.push(l);
        await expect(l).toBeVisible();
      }

      await test
        .info()
        .attach(`my-organization-${myOrgTabs.LAYER_LIBRARY}-page-screenshot`, {
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
