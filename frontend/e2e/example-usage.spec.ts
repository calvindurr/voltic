import { test, expect } from '@playwright/test';
import { TestUtils, TestDataGenerator, TestAssertions } from './helpers/test-utils';

test.describe('Example Test Usage', () => {
  let testUtils: TestUtils;
  let testAssertions: TestAssertions;

  test.beforeEach(async ({ page }) => {
    testUtils = new TestUtils(page);
    testAssertions = new TestAssertions(page);
  });

  test('should demonstrate test utilities usage', async ({ page }) => {
    // Navigate to the application
    await testUtils.navigateToPage('/');
    
    // Verify we're on the correct page
    await testAssertions.assertUrlContains('/');

    // Create a test site using utilities
    const siteName = TestDataGenerator.generateSiteName('Demo Site');
    const siteType = TestDataGenerator.generateSiteType();
    const coordinates = TestDataGenerator.generateCoordinates();

    await testUtils.createTestSite(siteName, siteType, coordinates);

    // Verify the site was created
    await testUtils.navigateToPage('/sites');
    await testUtils.verifyMapLoaded();
    
    const markerCount = await testUtils.getSiteMarkerCount();
    expect(markerCount).toBeGreaterThan(0);

    // Create a test portfolio
    const portfolioName = TestDataGenerator.generatePortfolioName('Demo Portfolio');
    await testUtils.createTestPortfolio(portfolioName, 'A demo portfolio for testing');

    // Verify portfolio was created
    await testUtils.navigateToPage('/portfolios');
    await testAssertions.assertTextContent('body', portfolioName);

    // Test error handling
    await testUtils.simulateNetworkError();
    await testUtils.navigateToPage('/sites');
    
    // Should show error message
    await testUtils.verifyErrorMessage();

    // Restore network
    await testUtils.restoreNetwork();
  });

  test('should demonstrate form filling utilities', async ({ page }) => {
    await testUtils.navigateToPage('/sites');
    await testUtils.verifyMapLoaded();

    // Click on map to open form
    const mapContainer = page.locator('.leaflet-container');
    await mapContainer.click({ position: { x: 300, y: 200 } });

    // Wait for form to appear
    await page.waitForSelector('form', { timeout: 5000 });

    // Use utility to fill form
    await testUtils.fillForm({
      name: 'Utility Test Site',
      site_type: 'solar'
    });

    // Submit form using utility
    await testUtils.submitForm();

    // Verify site was created
    const markerCount = await testUtils.getSiteMarkerCount();
    expect(markerCount).toBe(1);
  });

  test('should demonstrate assertion utilities', async ({ page }) => {
    await testUtils.navigateToPage('/');

    // Test various assertion utilities
    await testAssertions.assertUrlContains('/');
    await testAssertions.assertElementVisible('body');
    
    // Navigate to sites page
    await testUtils.navigateToPage('/sites');
    await testAssertions.assertUrlContains('/sites');
    
    // Verify map elements
    await testAssertions.assertElementVisible('.leaflet-container');
    await testAssertions.assertElementVisible('.leaflet-control-zoom');
  });
});