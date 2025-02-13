import { test, expect, type Locator } from '@playwright/test';
import {
  testTitleWithTags,
  normalUserStatePath,
  selectorMaskColor,
} from '../utils';
import worksiteData from '../fixtures/worksiteCreateData.json' assert { type: 'json' };

test.describe('WorkPage', () => {
  test.use({ storageState: normalUserStatePath });

  const utilityBarTestIds = [
    'testMapViewIcon',
    'testTableViewIcon',
    'testWorksiteSearch',
    'testLayersButton',
    // 'testWorksiteFiltersButton', // only shows up on mobile screens
    'testDownloadCsvButton',
  ];
  const worksiteFormTestIds = [
    // intake form
    'testIntakeFormDiv',
    // form fields
    'testNameTextInput',
    'testWorksiteSearchInputSearch',
    'testPhone1TextInput',
    'testAddPhoneLink',
    'testEmailTextInput',
    'testPrimaryLanguageTextInput',
    'testAutoContactFrequencySelect',
    'testWorksiteSearchInputInput',
    'testWhat3WordsTextInput',
    'testUseMyLocationButton',
    'testToggleSelectOnMapButton',
    'testSaveNoteInput',
    // 'testAddNoteButton', // Note field is on by default so this btn is hidden
    'testAddressProblemsCheckbox',
    'testIsHighPriorityCheckbox',
    'testMemberOfMyOrgCheckbox',
    // TODO: find a way to test dynamic form tree fields
    // form action buttons
    'testCloseWorksiteButton',
    'testSaveButton',
    'testSaveClaimButton',
  ];

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    const workLink = page.getByTestId('testworkLink');
    await workLink.click();
    await page.waitForURL(/.*\/incident\/.*\/work.*/);
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
        ...utilityBarTestIds,
        'testCollapseUtilityBarIcon',
        'testCollapsedFormIcon',
        // 'testSviSliderInput',
        // 'testUpdatedSliderInput',
        'testSimpleMapdiv',
        'testPhoneComponentChatButton',
        'testPhoneSystemActionButtonDiv',
        'testPhoneComponentNewsDiv',
        'testNewCaseIcon',
        ...worksiteFormTestIds,
      ];
      const locators: Locator[] = [];
      for (const testId of dataTestIds) {
        const l = page.getByTestId(testId).first();
        locators.push(l);
        console.info('Checking visibility of', testId);
        await expect(l).toBeVisible({ timeout: 30_000 });
      }

      await test.info().attach('work-page-screenshot', {
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
      'should have working collapsable utility bar & worksite form',
      ['secondary', 'slow', 'read', 'development', 'staging', 'production'],
    ),
    async ({ page }) => {
      // by default, utility bar and worksite form should be visible
      const utilityBarItems = utilityBarTestIds;
      const utilityBarCollapseButton = page.getByTestId(
        'testCollapseUtilityBarIcon',
      );
      for (const testId of utilityBarItems) {
        const l = page.getByTestId(testId).first();
        await expect(l).toBeVisible({ timeout: 30_000 });
      }

      await utilityBarCollapseButton.click();
      // utility bar items should now be hidden
      for (const testId of utilityBarItems) {
        const l = page.getByTestId(testId).first();
        await expect(l).toBeHidden();
      }

      const worksiteFormItems = worksiteFormTestIds;
      const worksiteFormCollapseButton = page.getByTestId(
        'testCollapsedFormIcon',
      );
      for (const testId of worksiteFormItems) {
        const l = page.getByTestId(testId).first();
        await expect(l).toBeVisible({ timeout: 30_000 });
      }

      await worksiteFormCollapseButton.click();
      // worksite form items should now be hidden
      for (const testId of worksiteFormItems) {
        const l = page.getByTestId(testId).first();
        await expect(l).toBeHidden();
      }
    },
  );

  test(
    testTitleWithTags('should create new worksite', [
      'secondary',
      'slow',
      'write',
      // 'development',
      'staging',
    ]),
    async ({ page }) => {
      test.slow();
      const randomIndex = Math.floor(Math.random() * worksiteData.length);
      const d = worksiteData[randomIndex];
      const currentTimestamp = Date.now();
      const residentName = `${d.residentName} - ${currentTimestamp}`;
      const nameField = page.getByTestId('testNameTextInput').locator('input');
      const phoneField = page
        .getByTestId('testPhone1TextInput')
        .locator('input');
      const addressField = page
        .getByTestId('testWorksiteSearchInputInput')
        .locator('input');
      const addressSearchResults = page
        .getByTestId('testWorsiteSearchResultsDiv')
        .locator('div');
      const addressSearchPickedResult = addressSearchResults
        .filter({
          hasText: 'Geocode',
        })
        .locator('div')
        .first();
      const outOfRangeWorksiteButton = page.getByRole('button', {
        name: 'Continue Anyway',
      });
      const muckOutCheckbox = page
        .getByTestId('testmuck_out_infoCheckbox')
        .getByText('Muck Out');
      const treeWorkCheckbox = page
        .getByTestId('testtree_infoCheckbox')
        .getByText('Tree Work');
      const saveWorksiteButton = page.getByTestId('testSaveButton');
      await nameField.click();
      await nameField.fill(residentName);
      await phoneField.click();
      await phoneField.fill(d.phone);
      await addressField.click();
      await addressField.fill(d.address);
      await page.waitForTimeout(2000);
      await addressSearchPickedResult.click();
      await page.waitForTimeout(2000);
      const isOutOfRangeBtnVisible = await outOfRangeWorksiteButton.isVisible();
      // Click 'Case Outside Current Incident' button if needed
      if (isOutOfRangeBtnVisible) {
        await outOfRangeWorksiteButton.click();
      }

      // await muckOutCheckbox.click();
      await treeWorkCheckbox.click();
      await saveWorksiteButton.click();
      // make sure error toast shows
      const successToast = page.locator('.Vue-Toastification__toast--success');
      await expect(successToast).toBeVisible({ timeout: 15_000 });
      await expect(successToast).toHaveText(/.*success.*/i);
    },
  );
});
