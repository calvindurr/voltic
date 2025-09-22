import { Page, expect } from '@playwright/test';

/**
 * Common test utilities for E2E tests
 */

export class TestUtils {
  constructor(private page: Page) {}

  /**
   * Wait for the application to be fully loaded
   */
  async waitForAppLoad() {
    await this.page.waitForLoadState('networkidle');
    // Wait for any initial API calls to complete
    await this.page.waitForTimeout(1000);
  }

  /**
   * Create a test site with the given parameters
   */
  async createTestSite(name: string, type: 'solar' | 'wind', position = { x: 300, y: 200 }) {
    await this.page.goto('/sites');
    await this.waitForAppLoad();

    // Click on map to add site
    const mapContainer = this.page.locator('.leaflet-container');
    await mapContainer.click({ position });

    // Fill out the form
    await this.page.waitForSelector('form', { timeout: 5000 });

    const nameInput = this.page.locator('input[name="name"]').or(this.page.locator('[data-testid="site-name"]'));
    await nameInput.fill(name);

    const typeSelect = this.page.locator('select[name="site_type"]').or(this.page.locator('[data-testid="site-type"]'));
    await typeSelect.selectOption(type);

    const submitButton = this.page.locator('button[type="submit"]').or(this.page.locator('[data-testid="submit-site"]'));
    await submitButton.click();

    await this.page.waitForTimeout(2000);
  }

  /**
   * Create a test portfolio with the given name and description
   */
  async createTestPortfolio(name: string, description = '') {
    await this.page.goto('/portfolios');
    await this.waitForAppLoad();

    const createButton = this.page.locator('button').filter({ hasText: /create|new|add portfolio/i }).first();
    await createButton.click();

    await this.page.waitForSelector('form', { timeout: 5000 });

    const nameInput = this.page.locator('input[name="name"]').or(this.page.locator('[data-testid="portfolio-name"]'));
    await nameInput.fill(name);

    if (description) {
      const descInput = this.page.locator('textarea[name="description"]').or(this.page.locator('[data-testid="portfolio-description"]'));
      await descInput.fill(description);
    }

    const submitButton = this.page.locator('button[type="submit"]').or(this.page.locator('[data-testid="submit-portfolio"]'));
    await submitButton.click();

    await this.page.waitForTimeout(2000);
  }

  /**
   * Navigate to a specific page and wait for it to load
   */
  async navigateToPage(path: string) {
    await this.page.goto(path);
    await this.waitForAppLoad();
  }

  /**
   * Check if an element exists with multiple possible selectors
   */
  async elementExists(selectors: string[]): Promise<boolean> {
    for (const selector of selectors) {
      if (await this.page.locator(selector).isVisible({ timeout: 1000 })) {
        return true;
      }
    }
    return false;
  }

  /**
   * Wait for any of the given selectors to be visible
   */
  async waitForAnySelector(selectors: string[], timeout = 5000): Promise<string | null> {
    const promises = selectors.map(selector => 
      this.page.locator(selector).waitFor({ state: 'visible', timeout }).then(() => selector)
    );

    try {
      return await Promise.race(promises);
    } catch {
      return null;
    }
  }

  /**
   * Simulate network error for testing error handling
   */
  async simulateNetworkError() {
    await this.page.route('**/api/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Network error' })
      });
    });
  }

  /**
   * Restore normal network behavior
   */
  async restoreNetwork() {
    await this.page.unroute('**/api/**');
  }

  /**
   * Check if the map is loaded and interactive
   */
  async verifyMapLoaded() {
    const mapContainer = this.page.locator('.leaflet-container');
    await expect(mapContainer).toBeVisible({ timeout: 10000 });

    // Verify map controls are present
    const zoomControls = this.page.locator('.leaflet-control-zoom');
    await expect(zoomControls).toBeVisible();

    // Verify tiles are loaded
    const tilePanes = this.page.locator('.leaflet-tile-pane');
    await expect(tilePanes).toBeVisible();
  }

  /**
   * Get the count of site markers on the map
   */
  async getSiteMarkerCount(): Promise<number> {
    const markers = this.page.locator('.leaflet-marker-icon');
    return await markers.count();
  }

  /**
   * Click on a site marker by index
   */
  async clickSiteMarker(index = 0) {
    const markers = this.page.locator('.leaflet-marker-icon');
    await markers.nth(index).click();
  }

  /**
   * Verify error message is displayed
   */
  async verifyErrorMessage(expectedText?: string) {
    const errorSelectors = [
      '.error',
      '[data-testid="error"]',
      '.alert-error',
      '.error-message'
    ];

    const errorElement = await this.waitForAnySelector(errorSelectors);
    expect(errorElement).toBeTruthy();

    if (expectedText) {
      const errorText = await this.page.locator(errorElement!).textContent();
      expect(errorText?.toLowerCase()).toContain(expectedText.toLowerCase());
    }
  }

  /**
   * Verify loading indicator is shown
   */
  async verifyLoadingIndicator() {
    const loadingSelectors = [
      '.loading',
      '[data-testid="loading"]',
      '.spinner',
      '.skeleton'
    ];

    const hasLoading = await this.elementExists(loadingSelectors);
    expect(hasLoading).toBeTruthy();
  }

  /**
   * Fill out a form with the given data
   */
  async fillForm(formData: Record<string, string>) {
    for (const [fieldName, value] of Object.entries(formData)) {
      const input = this.page.locator(`input[name="${fieldName}"]`)
        .or(this.page.locator(`[data-testid="${fieldName}"]`))
        .or(this.page.locator(`textarea[name="${fieldName}"]`))
        .or(this.page.locator(`select[name="${fieldName}"]`));

      const tagName = await input.evaluate(el => el.tagName.toLowerCase());
      
      if (tagName === 'select') {
        await input.selectOption(value);
      } else {
        await input.fill(value);
      }
    }
  }

  /**
   * Submit a form and wait for response
   */
  async submitForm() {
    const submitButton = this.page.locator('button[type="submit"]')
      .or(this.page.locator('[data-testid*="submit"]'))
      .first();
    
    await submitButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Clean up test data (if cleanup endpoints exist)
   */
  async cleanup() {
    // This would depend on having cleanup endpoints in the API
    // For now, we rely on test isolation through database resets
    console.log('Cleanup completed');
  }
}

/**
 * Test data generators
 */
export class TestDataGenerator {
  static generateSiteName(prefix = 'Test Site'): string {
    const timestamp = Date.now();
    return `${prefix} ${timestamp}`;
  }

  static generatePortfolioName(prefix = 'Test Portfolio'): string {
    const timestamp = Date.now();
    return `${prefix} ${timestamp}`;
  }

  static generateCoordinates(): { x: number; y: number } {
    return {
      x: Math.floor(Math.random() * 400) + 200,
      y: Math.floor(Math.random() * 300) + 150
    };
  }

  static generateSiteType(): 'solar' | 'wind' {
    return Math.random() > 0.5 ? 'solar' : 'wind';
  }
}

/**
 * Assertion helpers
 */
export class TestAssertions {
  constructor(private page: Page) {}

  async assertUrlContains(path: string) {
    expect(this.page.url()).toContain(path);
  }

  async assertElementVisible(selector: string, timeout = 5000) {
    await expect(this.page.locator(selector)).toBeVisible({ timeout });
  }

  async assertElementHidden(selector: string, timeout = 5000) {
    await expect(this.page.locator(selector)).toBeHidden({ timeout });
  }

  async assertTextContent(selector: string, expectedText: string) {
    await expect(this.page.locator(selector)).toContainText(expectedText);
  }

  async assertElementCount(selector: string, expectedCount: number) {
    await expect(this.page.locator(selector)).toHaveCount(expectedCount);
  }
}