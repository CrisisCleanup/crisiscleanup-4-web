import { test, expect, type Locator } from '@playwright/test';
import {
  testTitleWithTags,
  selectorMaskColor,
  adminUserStatePath,
} from '../utils';

test.describe('PhonePage', () => {
  test.use({ storageState: adminUserStatePath });

  const utilityBarTestIds = [
    'testPhoneMapViewIcon',
    'testPhoneTableViewIcon',
    'testWorksiteSearch',
    'testPhoneToolBarDiv',
    'testIsTakingCallsDiv',
    'testCurrentUserMobileContent',
    'testPhoneDashboardLanguagesDiv',
    'testLanguageEditIcon',
    'testIsNotTakingCallsButton',
    // 'testServeOutboundCallsCheckbox',
  ];
  const mapZoomControlsTestIds = [
    'testZoomInButton',
    'testZoomOutButton',
    'testZoomToMakeInteractiveButton',
    'testZoomToIncidentButton',
  ];
  const phoneSystemActionsTestIds = [
    'testPhoneButtonsDiv', // container div for phone actions
    'testPhoneComponentCallerButton',
    'testPhoneComponentDialerButton',
    'testPhoneComponentChatButton',
    'testZoomMeetingButton',
    'testPhoneComponentNewsButton',
    'testPhoneComponentHistoryButton',
    'testPhoneComponentStatsButton',
    'testPhoneComponentLeaderboardButton',
    'testPhoneComponentResetButton',
  ];
  const phoneOverlayActionsTestIds = [
    'testPhoneOverlay_callHistory',
    'testPhoneOverlay_manualDialer',
    'testPhoneOverlay_leaderboard',
    'testPhoneOverlay_zoom',
    'testPhoneOverlay_cms',
    'testPhoneOverlay_generalStats',
    'testPhoneOverlay_chat',
    'testPhoneOverlay_reportBug',
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
    // 'testUseMyLocationButton', // We hide this on phone page
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
  ];

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    const phoneLink = page.getByTestId('testphoneLink');
    await phoneLink.click();
    await page.waitForURL(/.*\/incident\/.*\/phone.*/);
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
        ...mapZoomControlsTestIds,
        ...phoneOverlayActionsTestIds,
        'testNewCaseIcon',
        ...worksiteFormTestIds,
      ];
      const locators: Locator[] = [];
      for (const testId of dataTestIds) {
        const l = page.getByTestId(testId).first();
        locators.push(l);
        console.info('Checking visibility of', testId);
        await expect(l).toBeVisible({ timeout: 10_000 });
      }
      await test.info().attach('phone-page-screenshot', {
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
