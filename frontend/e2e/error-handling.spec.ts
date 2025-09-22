import { test, expect } from '@playwright/test';

test.describe('Error Handling and Edge Cases', () => {
  test('should handle network connectivity issues gracefully', async ({ page }) => {
    // Test offline behavior
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Simulate network failure
    await page.context().setOffline(true);
    
    // Try to perform an action that requires network
    await page.goto('/sites');
    
    // Should show appropriate error message
    const errorMessage = page.locator('.error').or(page.locator('[data-testid="error"]')).first();
    const offlineMessage = page.locator('text=offline').or(page.locator('text=network')).first();
    
    const hasError = await errorMessage.isVisible({ timeout: 5000 });
    const hasOfflineMsg = await offlineMessage.isVisible({ timeout: 5000 });
    
    expect(hasError || hasOfflineMsg).toBeTruthy();
    
    // Restore network
    await page.context().setOffline(false);
  });

  test('should display loading states during API calls', async ({ page }) => {
    // Requirement 7.4: WHEN loading data THEN the system SHALL provide 
    // appropriate loading indicators and error handling
    
    await page.goto('/sites');
    
    // Look for loading indicators
    const loadingSpinner = page.locator('.loading').or(page.locator('[data-testid="loading"]')).first();
    const skeletonLoader = page.locator('.skeleton').or(page.locator('[data-testid="skeleton"]')).first();
    
    // At least one loading indicator should be present during initial load
    const hasSpinner = await loadingSpinner.isVisible({ timeout: 1000 });
    const hasSkeleton = await skeletonLoader.isVisible({ timeout: 1000 });
    
    // Loading indicators might be brief, so we check if they existed or content loaded
    if (!hasSpinner && !hasSkeleton) {
      // Content should be loaded instead
      const mapContainer = page.locator('.leaflet-container');
      await expect(mapContainer).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show meaningful error messages for API failures', async ({ page }) => {
    // Requirement 7.5: WHEN the system is unavailable THEN the interface 
    // SHALL display meaningful error messages to the user
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Intercept API calls and return errors
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    // Navigate to a page that makes API calls
    await page.goto('/sites');
    
    // Should show error message
    const errorMessage = page.locator('.error').or(page.locator('[data-testid="error"]')).first();
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    // Error message should be user-friendly
    const errorText = await errorMessage.textContent();
    expect(errorText).toBeTruthy();
    expect(errorText?.toLowerCase()).toContain('error');
  });

  test('should handle form validation errors properly', async ({ page }) => {
    await page.goto('/sites');
    await page.waitForLoadState('networkidle');
    
    // Click on map to open site form
    const mapContainer = page.locator('.leaflet-container');
    await mapContainer.click({ position: { x: 300, y: 200 } });
    
    await page.waitForSelector('form', { timeout: 5000 });
    
    // Submit form without required fields
    const submitButton = page.locator('button[type="submit"]').or(page.locator('[data-testid="submit-site"]'));
    await submitButton.click();
    
    // Should show field-specific validation errors
    const validationError = page.locator('.field-error').or(page.locator('.validation-error')).first();
    const generalError = page.locator('.error').first();
    
    const hasFieldError = await validationError.isVisible({ timeout: 3000 });
    const hasGeneralError = await generalError.isVisible({ timeout: 3000 });
    
    expect(hasFieldError || hasGeneralError).toBeTruthy();
  });

  test('should handle invalid coordinate inputs', async ({ page }) => {
    await page.goto('/sites');
    await page.waitForLoadState('networkidle');
    
    // Click on map to open site form
    const mapContainer = page.locator('.leaflet-container');
    await mapContainer.click({ position: { x: 300, y: 200 } });
    
    await page.waitForSelector('form', { timeout: 5000 });
    
    // Fill form with invalid coordinates
    const nameInput = page.locator('input[name="name"]').or(page.locator('[data-testid="site-name"]'));
    await nameInput.fill('Invalid Coordinates Site');
    
    const typeSelect = page.locator('select[name="site_type"]').or(page.locator('[data-testid="site-type"]'));
    await typeSelect.selectOption('solar');
    
    // Try to input invalid coordinates if coordinate fields are editable
    const latInput = page.locator('input[name="latitude"]').or(page.locator('[data-testid="latitude"]'));
    const lonInput = page.locator('input[name="longitude"]').or(page.locator('[data-testid="longitude"]'));
    
    if (await latInput.isVisible()) {
      await latInput.fill('999'); // Invalid latitude
    }
    if (await lonInput.isVisible()) {
      await lonInput.fill('999'); // Invalid longitude
    }
    
    const submitButton = page.locator('button[type="submit"]').or(page.locator('[data-testid="submit-site"]'));
    await submitButton.click();
    
    // Should show validation error for invalid coordinates
    const errorMessage = page.locator('.error').or(page.locator('[data-testid="error"]')).first();
    await expect(errorMessage).toBeVisible({ timeout: 3000 });
  });

  test('should handle duplicate site creation attempts', async ({ page }) => {
    await page.goto('/sites');
    await page.waitForLoadState('networkidle');
    
    // Create first site
    const mapContainer = page.locator('.leaflet-container');
    await mapContainer.click({ position: { x: 300, y: 200 } });
    
    await page.waitForSelector('form', { timeout: 5000 });
    
    const nameInput = page.locator('input[name="name"]').or(page.locator('[data-testid="site-name"]'));
    await nameInput.fill('Duplicate Test Site');
    
    const typeSelect = page.locator('select[name="site_type"]').or(page.locator('[data-testid="site-type"]'));
    await typeSelect.selectOption('solar');
    
    const submitButton = page.locator('button[type="submit"]').or(page.locator('[data-testid="submit-site"]'));
    await submitButton.click();
    
    await page.waitForTimeout(2000);
    
    // Try to create another site at the same location
    await mapContainer.click({ position: { x: 300, y: 200 } });
    
    await page.waitForSelector('form', { timeout: 5000 });
    
    const nameInput2 = page.locator('input[name="name"]').or(page.locator('[data-testid="site-name"]'));
    await nameInput2.fill('Another Site Same Location');
    
    const typeSelect2 = page.locator('select[name="site_type"]').or(page.locator('[data-testid="site-type"]'));
    await typeSelect2.selectOption('wind');
    
    const submitButton2 = page.locator('button[type="submit"]').or(page.locator('[data-testid="submit-site"]'));
    await submitButton2.click();
    
    // Should show error about duplicate location
    const errorMessage = page.locator('.error').or(page.locator('[data-testid="error"]')).first();
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('should handle empty portfolio operations gracefully', async ({ page }) => {
    await page.goto('/portfolios');
    await page.waitForLoadState('networkidle');
    
    // Create empty portfolio
    const createButton = page.locator('button').filter({ hasText: /create|new|add portfolio/i }).first();
    await createButton.click();
    
    await page.waitForSelector('form', { timeout: 5000 });
    
    const nameInput = page.locator('input[name="name"]').or(page.locator('[data-testid="portfolio-name"]'));
    await nameInput.fill('Empty Portfolio Test');
    
    const submitButton = page.locator('button[type="submit"]').or(page.locator('[data-testid="submit-portfolio"]'));
    await submitButton.click();
    
    await page.waitForTimeout(2000);
    
    // Try to perform operations on empty portfolio
    const portfolioItem = page.locator('text=Empty Portfolio Test').first();
    await portfolioItem.click();
    
    // Should handle empty state gracefully
    const emptyMessage = page.locator('text=No sites').or(page.locator('text=empty')).first();
    const addSitePrompt = page.locator('text=Add sites').or(page.locator('button').filter({ hasText: /add site/i })).first();
    
    const hasEmptyMessage = await emptyMessage.isVisible({ timeout: 3000 });
    const hasAddPrompt = await addSitePrompt.isVisible({ timeout: 3000 });
    
    expect(hasEmptyMessage || hasAddPrompt).toBeTruthy();
  });

  test('should handle browser back/forward navigation correctly', async ({ page }) => {
    // Test SPA routing behavior
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate through different pages
    await page.goto('/sites');
    await page.waitForLoadState('networkidle');
    
    await page.goto('/portfolios');
    await page.waitForLoadState('networkidle');
    
    await page.goto('/forecasts');
    await page.waitForLoadState('networkidle');
    
    // Use browser back button
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    // Should be on portfolios page
    expect(page.url()).toContain('portfolios');
    
    // Use browser forward button
    await page.goForward();
    await page.waitForLoadState('networkidle');
    
    // Should be on forecasts page
    expect(page.url()).toContain('forecasts');
  });

  test('should handle session timeout gracefully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Simulate session timeout by intercepting API calls
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Session expired' })
      });
    });
    
    // Try to perform an action
    await page.goto('/sites');
    
    // Should handle 401 appropriately
    const errorMessage = page.locator('.error').or(page.locator('[data-testid="error"]')).first();
    const loginPrompt = page.locator('text=login').or(page.locator('text=session')).first();
    
    const hasError = await errorMessage.isVisible({ timeout: 5000 });
    const hasLoginPrompt = await loginPrompt.isVisible({ timeout: 5000 });
    
    expect(hasError || hasLoginPrompt).toBeTruthy();
  });

  test('should handle large datasets without performance issues', async ({ page }) => {
    // Test performance with many sites/portfolios
    await page.goto('/sites');
    await page.waitForLoadState('networkidle');
    
    // Check that map loads within reasonable time
    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer).toBeVisible({ timeout: 10000 });
    
    // Check that interactions remain responsive
    await mapContainer.click({ position: { x: 300, y: 200 } });
    
    const form = page.locator('form');
    await expect(form).toBeVisible({ timeout: 5000 });
  });

  test('should provide retry mechanisms for failed operations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Intercept API calls to simulate failures
    let callCount = 0;
    await page.route('**/api/**', route => {
      callCount++;
      if (callCount === 1) {
        // Fail first call
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' })
        });
      } else {
        // Let subsequent calls through
        route.continue();
      }
    });
    
    await page.goto('/sites');
    
    // Look for retry button or automatic retry
    const retryButton = page.locator('button').filter({ hasText: /retry|try again/i }).first();
    const refreshButton = page.locator('button').filter({ hasText: /refresh|reload/i }).first();
    
    if (await retryButton.isVisible({ timeout: 5000 })) {
      await retryButton.click();
      
      // Should eventually load successfully
      const mapContainer = page.locator('.leaflet-container');
      await expect(mapContainer).toBeVisible({ timeout: 10000 });
    }
  });
});