import { test, expect } from '@playwright/test';

test.describe('Complete User Workflow', () => {
  test('should complete full renewable energy forecasting workflow', async ({ page }) => {
    // This test covers the complete user journey from site creation to forecast visualization
    
    // Step 1: Navigate to application and verify landing page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify main navigation is present
    const navigation = page.locator('nav').or(page.locator('[data-testid="navigation"]')).first();
    await expect(navigation).toBeVisible({ timeout: 5000 });
    
    // Step 2: Create renewable energy sites
    await page.goto('/sites');
    await page.waitForLoadState('networkidle');
    
    // Verify map interface is loaded
    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer).toBeVisible({ timeout: 10000 });
    
    // Create first site (Solar)
    await mapContainer.click({ position: { x: 250, y: 150 } });
    await page.waitForSelector('form', { timeout: 5000 });
    
    const siteNameInput1 = page.locator('input[name="name"]').or(page.locator('[data-testid="site-name"]'));
    await siteNameInput1.fill('Solar Farm Alpha');
    
    const typeSelect1 = page.locator('select[name="site_type"]').or(page.locator('[data-testid="site-type"]'));
    await typeSelect1.selectOption('solar');
    
    const submitButton1 = page.locator('button[type="submit"]').or(page.locator('[data-testid="submit-site"]'));
    await submitButton1.click();
    
    await page.waitForTimeout(2000);
    
    // Create second site (Wind)
    await mapContainer.click({ position: { x: 350, y: 250 } });
    await page.waitForSelector('form', { timeout: 5000 });
    
    const siteNameInput2 = page.locator('input[name="name"]').or(page.locator('[data-testid="site-name"]'));
    await siteNameInput2.fill('Wind Farm Beta');
    
    const typeSelect2 = page.locator('select[name="site_type"]').or(page.locator('[data-testid="site-type"]'));
    await typeSelect2.selectOption('wind');
    
    const submitButton2 = page.locator('button[type="submit"]').or(page.locator('[data-testid="submit-site"]'));
    await submitButton2.click();
    
    await page.waitForTimeout(2000);
    
    // Verify both sites are visible on map
    const markers = page.locator('.leaflet-marker-icon');
    await expect(markers).toHaveCount(2, { timeout: 5000 });
    
    // Step 3: Create a portfolio and assign sites
    await page.goto('/portfolios');
    await page.waitForLoadState('networkidle');
    
    // Create new portfolio
    const createPortfolioButton = page.locator('button').filter({ hasText: /create|new|add portfolio/i }).first();
    await createPortfolioButton.click();
    
    await page.waitForSelector('form', { timeout: 5000 });
    
    const portfolioNameInput = page.locator('input[name="name"]').or(page.locator('[data-testid="portfolio-name"]'));
    await portfolioNameInput.fill('Renewable Energy Portfolio 1');
    
    const portfolioDescInput = page.locator('textarea[name="description"]').or(page.locator('[data-testid="portfolio-description"]'));
    await portfolioDescInput.fill('A comprehensive portfolio of solar and wind energy sites');
    
    const submitPortfolioButton = page.locator('button[type="submit"]').or(page.locator('[data-testid="submit-portfolio"]'));
    await submitPortfolioButton.click();
    
    await page.waitForTimeout(2000);
    
    // Verify portfolio was created
    const portfolioItem = page.locator('text=Renewable Energy Portfolio 1').first();
    await expect(portfolioItem).toBeVisible({ timeout: 5000 });
    
    // Assign sites to portfolio (implementation depends on UI design)
    await portfolioItem.click();
    
    // Look for site assignment interface
    const addSiteButton = page.locator('button').filter({ hasText: /add site|assign site/i }).first();
    if (await addSiteButton.isVisible({ timeout: 3000 })) {
      await addSiteButton.click();
      
      // Select sites to add (this will depend on the actual UI implementation)
      const siteCheckbox1 = page.locator('input[type="checkbox"]').first();
      const siteCheckbox2 = page.locator('input[type="checkbox"]').nth(1);
      
      if (await siteCheckbox1.isVisible()) {
        await siteCheckbox1.check();
      }
      if (await siteCheckbox2.isVisible()) {
        await siteCheckbox2.check();
      }
      
      const confirmAssignButton = page.locator('button').filter({ hasText: /confirm|assign|add/i }).first();
      if (await confirmAssignButton.isVisible()) {
        await confirmAssignButton.click();
      }
    }
    
    await page.waitForTimeout(2000);
    
    // Step 4: Trigger forecast for the portfolio
    await page.goto('/forecasts');
    await page.waitForLoadState('networkidle');
    
    // Verify forecast dashboard is loaded
    const forecastDashboard = page.locator('[data-testid="forecast-dashboard"]').or(page.locator('.forecast-dashboard')).first();
    await expect(forecastDashboard).toBeVisible({ timeout: 5000 });
    
    // Select portfolio for forecasting
    const portfolioSelector = page.locator('select').or(page.locator('[data-testid="portfolio-selector"]')).first();
    if (await portfolioSelector.isVisible()) {
      await portfolioSelector.selectOption({ label: 'Renewable Energy Portfolio 1' });
    }
    
    // Trigger forecast
    const triggerForecastButton = page.locator('button').filter({ hasText: /trigger|start|run forecast/i }).first();
    await triggerForecastButton.click();
    
    // Wait for forecast job to be created
    await page.waitForTimeout(3000);
    
    // Verify job status is displayed
    const jobStatus = page.locator('[data-testid="job-status"]').or(page.locator('.job-status')).first();
    const loadingIndicator = page.locator('.loading').or(page.locator('[data-testid="loading"]')).first();
    
    const hasJobStatus = await jobStatus.isVisible({ timeout: 5000 });
    const hasLoading = await loadingIndicator.isVisible({ timeout: 5000 });
    
    expect(hasJobStatus || hasLoading).toBeTruthy();
    
    // Step 5: Wait for and verify forecast results
    // Note: In a real scenario, we might need to wait longer or mock the forecast completion
    await page.waitForTimeout(5000);
    
    // Check for forecast results display
    const resultsContainer = page.locator('[data-testid="forecast-results"]').or(page.locator('.forecast-results')).first();
    const chartContainer = page.locator('canvas').or(page.locator('.chart')).first();
    const noDataMessage = page.locator('text=No forecast data').or(page.locator('[data-testid="no-data"]')).first();
    
    // Either results should be displayed or appropriate message shown
    const hasResults = await resultsContainer.isVisible({ timeout: 10000 });
    const hasChart = await chartContainer.isVisible({ timeout: 10000 });
    const hasNoData = await noDataMessage.isVisible({ timeout: 10000 });
    
    expect(hasResults || hasChart || hasNoData).toBeTruthy();
    
    // Step 6: Navigate back to sites and verify data persistence
    await page.goto('/sites');
    await page.waitForLoadState('networkidle');
    
    // Verify sites are still present after full workflow
    const persistedMarkers = page.locator('.leaflet-marker-icon');
    await expect(persistedMarkers).toHaveCount(2, { timeout: 5000 });
    
    // Step 7: Verify portfolio persistence
    await page.goto('/portfolios');
    await page.waitForLoadState('networkidle');
    
    const persistedPortfolio = page.locator('text=Renewable Energy Portfolio 1').first();
    await expect(persistedPortfolio).toBeVisible({ timeout: 5000 });
    
    // Step 8: Test site management operations
    await page.goto('/sites');
    await page.waitForLoadState('networkidle');
    
    // Click on a site marker to view details
    const firstMarker = page.locator('.leaflet-marker-icon').first();
    await firstMarker.click();
    
    // Verify site details are displayed
    const sitePopup = page.locator('.leaflet-popup').or(page.locator('[data-testid="site-details"]')).first();
    await expect(sitePopup).toBeVisible({ timeout: 3000 });
    
    // Test site editing (if available)
    const editButton = page.locator('button').filter({ hasText: /edit|modify/i }).first();
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Verify edit form appears
      const editForm = page.locator('form').first();
      await expect(editForm).toBeVisible({ timeout: 3000 });
      
      // Make a small change
      const editNameInput = page.locator('input[name="name"]').or(page.locator('[data-testid="site-name"]'));
      await editNameInput.fill('Solar Farm Alpha - Updated');
      
      const saveButton = page.locator('button[type="submit"]').or(page.locator('[data-testid="save-site"]'));
      await saveButton.click();
      
      await page.waitForTimeout(2000);
    }
  });

  test('should handle complete workflow with error recovery', async ({ page }) => {
    // Test the workflow with simulated errors and recovery
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Simulate intermittent network issues
    let requestCount = 0;
    await page.route('**/api/**', route => {
      requestCount++;
      if (requestCount % 3 === 0) {
        // Fail every third request
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Temporary server error' })
        });
      } else {
        route.continue();
      }
    });
    
    // Attempt to create a site with error recovery
    await page.goto('/sites');
    await page.waitForLoadState('networkidle');
    
    const mapContainer = page.locator('.leaflet-container');
    await mapContainer.click({ position: { x: 300, y: 200 } });
    
    await page.waitForSelector('form', { timeout: 5000 });
    
    const nameInput = page.locator('input[name="name"]').or(page.locator('[data-testid="site-name"]'));
    await nameInput.fill('Error Recovery Test Site');
    
    const typeSelect = page.locator('select[name="site_type"]').or(page.locator('[data-testid="site-type"]'));
    await typeSelect.selectOption('solar');
    
    const submitButton = page.locator('button[type="submit"]').or(page.locator('[data-testid="submit-site"]'));
    await submitButton.click();
    
    // May encounter error, look for retry mechanism
    const errorMessage = page.locator('.error').or(page.locator('[data-testid="error"]')).first();
    const retryButton = page.locator('button').filter({ hasText: /retry|try again/i }).first();
    
    if (await errorMessage.isVisible({ timeout: 5000 })) {
      if (await retryButton.isVisible()) {
        await retryButton.click();
      } else {
        // Try submitting again
        await submitButton.click();
      }
    }
    
    // Eventually should succeed
    await page.waitForTimeout(3000);
    
    // Verify site was created despite errors
    const markers = page.locator('.leaflet-marker-icon');
    await expect(markers).toHaveCountGreaterThan(0, { timeout: 10000 });
  });

  test('should maintain state across browser refresh', async ({ page }) => {
    // Test data persistence across page refreshes
    
    // Create a site
    await page.goto('/sites');
    await page.waitForLoadState('networkidle');
    
    const mapContainer = page.locator('.leaflet-container');
    await mapContainer.click({ position: { x: 300, y: 200 } });
    
    await page.waitForSelector('form', { timeout: 5000 });
    
    const nameInput = page.locator('input[name="name"]').or(page.locator('[data-testid="site-name"]'));
    await nameInput.fill('Persistence Test Site');
    
    const typeSelect = page.locator('select[name="site_type"]').or(page.locator('[data-testid="site-type"]'));
    await typeSelect.selectOption('wind');
    
    const submitButton = page.locator('button[type="submit"]').or(page.locator('[data-testid="submit-site"]'));
    await submitButton.click();
    
    await page.waitForTimeout(2000);
    
    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify site persists after refresh
    const persistedMarkers = page.locator('.leaflet-marker-icon');
    await expect(persistedMarkers).toHaveCount(1, { timeout: 10000 });
    
    // Create a portfolio
    await page.goto('/portfolios');
    await page.waitForLoadState('networkidle');
    
    const createButton = page.locator('button').filter({ hasText: /create|new|add portfolio/i }).first();
    await createButton.click();
    
    await page.waitForSelector('form', { timeout: 5000 });
    
    const portfolioNameInput = page.locator('input[name="name"]').or(page.locator('[data-testid="portfolio-name"]'));
    await portfolioNameInput.fill('Persistence Test Portfolio');
    
    const portfolioSubmitButton = page.locator('button[type="submit"]').or(page.locator('[data-testid="submit-portfolio"]'));
    await portfolioSubmitButton.click();
    
    await page.waitForTimeout(2000);
    
    // Refresh again
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify portfolio persists
    const persistedPortfolio = page.locator('text=Persistence Test Portfolio').first();
    await expect(persistedPortfolio).toBeVisible({ timeout: 5000 });
  });
});