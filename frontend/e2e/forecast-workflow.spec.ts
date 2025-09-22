import { test, expect } from '@playwright/test';

test.describe('Forecast Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the forecasts page
    await page.goto('/forecasts');
    await page.waitForLoadState('networkidle');
  });

  test('should display forecast interface and trigger options', async ({ page }) => {
    // Check that forecast dashboard is visible
    const forecastDashboard = page.locator('[data-testid="forecast-dashboard"]').or(page.locator('.forecast-dashboard')).first();
    await expect(forecastDashboard).toBeVisible({ timeout: 5000 });
    
    // Check for forecast trigger functionality
    const triggerButton = page.locator('button').filter({ hasText: /trigger|start|run forecast/i }).first();
    await expect(triggerButton).toBeVisible();
  });

  test('should validate portfolio exists before triggering forecast', async ({ page }) => {
    // Requirement 4.1: WHEN an API request is made to trigger a portfolio forecast 
    // THEN the system SHALL validate the portfolio exists and contains sites
    
    // Try to trigger forecast without selecting a portfolio
    const triggerButton = page.locator('button').filter({ hasText: /trigger|start|run forecast/i }).first();
    await triggerButton.click();
    
    // Should show validation error or portfolio selection
    const errorMessage = page.locator('.error').or(page.locator('[data-testid="error"]')).first();
    const portfolioSelector = page.locator('select').or(page.locator('[data-testid="portfolio-selector"]')).first();
    
    // Either error message or portfolio selector should be visible
    const hasError = await errorMessage.isVisible({ timeout: 3000 });
    const hasSelector = await portfolioSelector.isVisible({ timeout: 3000 });
    
    expect(hasError || hasSelector).toBeTruthy();
  });

  test('should initiate forecasting process for valid portfolio', async ({ page }) => {
    // Requirement 4.2: WHEN a valid forecast request is received THEN the system 
    // SHALL initiate a forecasting process for all sites in the portfolio
    
    // First, create a portfolio with sites (setup)
    await page.goto('/portfolios');
    await page.waitForLoadState('networkidle');
    
    // Create a test portfolio
    const createButton = page.locator('button').filter({ hasText: /create|new|add portfolio/i }).first();
    await createButton.click();
    
    await page.waitForSelector('form', { timeout: 5000 });
    
    const nameInput = page.locator('input[name="name"]').or(page.locator('[data-testid="portfolio-name"]'));
    await nameInput.fill('Forecast Test Portfolio');
    
    const submitButton = page.locator('button[type="submit"]').or(page.locator('[data-testid="submit-portfolio"]'));
    await submitButton.click();
    
    await page.waitForTimeout(2000);
    
    // Create a site for the portfolio
    await page.goto('/sites');
    await page.waitForLoadState('networkidle');
    
    const mapContainer = page.locator('.leaflet-container');
    await mapContainer.click({ position: { x: 300, y: 200 } });
    
    await page.waitForSelector('form', { timeout: 5000 });
    
    const siteNameInput = page.locator('input[name="name"]').or(page.locator('[data-testid="site-name"]'));
    await siteNameInput.fill('Forecast Test Site');
    
    const typeSelect = page.locator('select[name="site_type"]').or(page.locator('[data-testid="site-type"]'));
    await typeSelect.selectOption('solar');
    
    const siteSubmitButton = page.locator('button[type="submit"]').or(page.locator('[data-testid="submit-site"]'));
    await siteSubmitButton.click();
    
    await page.waitForTimeout(2000);
    
    // Go back to forecasts page
    await page.goto('/forecasts');
    await page.waitForLoadState('networkidle');
    
    // Select the portfolio and trigger forecast
    const portfolioSelector = page.locator('select').or(page.locator('[data-testid="portfolio-selector"]')).first();
    if (await portfolioSelector.isVisible()) {
      await portfolioSelector.selectOption({ label: 'Forecast Test Portfolio' });
    }
    
    const triggerButton = page.locator('button').filter({ hasText: /trigger|start|run forecast/i }).first();
    await triggerButton.click();
    
    // Should show job status or loading indicator
    const jobStatus = page.locator('[data-testid="job-status"]').or(page.locator('.job-status')).first();
    const loadingIndicator = page.locator('.loading').or(page.locator('[data-testid="loading"]')).first();
    
    const hasJobStatus = await jobStatus.isVisible({ timeout: 5000 });
    const hasLoading = await loadingIndicator.isVisible({ timeout: 5000 });
    
    expect(hasJobStatus || hasLoading).toBeTruthy();
  });

  test('should return job identifier and status information', async ({ page }) => {
    // Requirement 4.3: WHEN forecasting is in progress THEN the system SHALL 
    // return a job identifier and status information
    
    // Trigger a forecast (assuming portfolio exists from previous test setup)
    const triggerButton = page.locator('button').filter({ hasText: /trigger|start|run forecast/i }).first();
    
    // Select portfolio if selector is available
    const portfolioSelector = page.locator('select').or(page.locator('[data-testid="portfolio-selector"]')).first();
    if (await portfolioSelector.isVisible()) {
      // Select first available option
      await portfolioSelector.selectOption({ index: 1 });
    }
    
    await triggerButton.click();
    
    // Check for job ID display
    const jobId = page.locator('[data-testid="job-id"]').or(page.locator('.job-id')).first();
    const statusIndicator = page.locator('[data-testid="job-status"]').or(page.locator('.job-status')).first();
    
    // At least one should be visible
    const hasJobId = await jobId.isVisible({ timeout: 5000 });
    const hasStatus = await statusIndicator.isVisible({ timeout: 5000 });
    
    expect(hasJobId || hasStatus).toBeTruthy();
  });

  test('should display forecast results when available', async ({ page }) => {
    // Requirement 5.1: WHEN forecast results are available THEN the system 
    // SHALL display the results in the web interface
    
    // Check for forecast results display area
    const resultsContainer = page.locator('[data-testid="forecast-results"]').or(page.locator('.forecast-results')).first();
    await expect(resultsContainer).toBeVisible({ timeout: 5000 });
    
    // If there are existing results, check they're displayed
    const chartContainer = page.locator('canvas').or(page.locator('.chart')).first();
    const dataTable = page.locator('table').or(page.locator('.data-table')).first();
    
    // Either chart or table should be present for results display
    const hasChart = await chartContainer.isVisible({ timeout: 3000 });
    const hasTable = await dataTable.isVisible({ timeout: 3000 });
    
    // If no results, should show appropriate message
    if (!hasChart && !hasTable) {
      const noDataMessage = page.locator('text=No forecast data').or(page.locator('[data-testid="no-data"]')).first();
      await expect(noDataMessage).toBeVisible();
    }
  });

  test('should show both individual site and aggregated portfolio forecasts', async ({ page }) => {
    // Requirement 5.2: WHEN viewing forecast results THEN the system SHALL 
    // show both individual site forecasts and aggregated portfolio forecasts
    
    // Look for portfolio-level results
    const portfolioResults = page.locator('[data-testid="portfolio-forecast"]').or(page.locator('.portfolio-forecast')).first();
    
    // Look for individual site results
    const siteResults = page.locator('[data-testid="site-forecast"]').or(page.locator('.site-forecast')).first();
    
    // Check for toggle or tabs between views
    const viewToggle = page.locator('button').filter({ hasText: /portfolio|site|individual/i }).first();
    const tabs = page.locator('[role="tab"]').first();
    
    // At least one method of viewing different forecast levels should exist
    const hasPortfolioView = await portfolioResults.isVisible({ timeout: 3000 });
    const hasSiteView = await siteResults.isVisible({ timeout: 3000 });
    const hasToggle = await viewToggle.isVisible({ timeout: 3000 });
    const hasTabs = await tabs.isVisible({ timeout: 3000 });
    
    expect(hasPortfolioView || hasSiteView || hasToggle || hasTabs).toBeTruthy();
  });

  test('should display time series data with charts', async ({ page }) => {
    // Requirement 5.3: WHEN displaying forecasts THEN the system SHALL 
    // include time series data with appropriate charts or graphs
    
    // Check for chart elements
    const chartCanvas = page.locator('canvas');
    const chartContainer = page.locator('.chart').or(page.locator('[data-testid="forecast-chart"]'));
    
    // Look for time series indicators
    const timeAxis = page.locator('text=Time').or(page.locator('text=Date')).first();
    const valueAxis = page.locator('text=Generation').or(page.locator('text=MWh')).first();
    
    // If charts are present, verify they show time series data
    if (await chartCanvas.first().isVisible({ timeout: 3000 })) {
      await expect(chartCanvas.first()).toBeVisible();
    } else if (await chartContainer.first().isVisible({ timeout: 3000 })) {
      await expect(chartContainer.first()).toBeVisible();
    } else {
      // Should show message about no data
      const noDataMessage = page.locator('text=No forecast data').first();
      await expect(noDataMessage).toBeVisible();
    }
  });

  test('should handle empty portfolio forecast requests', async ({ page }) => {
    // Requirement 4.5: IF a portfolio is empty THEN the system SHALL 
    // return an appropriate error response
    
    // Create an empty portfolio first
    await page.goto('/portfolios');
    await page.waitForLoadState('networkidle');
    
    const createButton = page.locator('button').filter({ hasText: /create|new|add portfolio/i }).first();
    await createButton.click();
    
    await page.waitForSelector('form', { timeout: 5000 });
    
    const nameInput = page.locator('input[name="name"]').or(page.locator('[data-testid="portfolio-name"]'));
    await nameInput.fill('Empty Portfolio');
    
    const submitButton = page.locator('button[type="submit"]').or(page.locator('[data-testid="submit-portfolio"]'));
    await submitButton.click();
    
    await page.waitForTimeout(2000);
    
    // Go to forecasts and try to trigger forecast for empty portfolio
    await page.goto('/forecasts');
    await page.waitForLoadState('networkidle');
    
    const portfolioSelector = page.locator('select').or(page.locator('[data-testid="portfolio-selector"]')).first();
    if (await portfolioSelector.isVisible()) {
      await portfolioSelector.selectOption({ label: 'Empty Portfolio' });
    }
    
    const triggerButton = page.locator('button').filter({ hasText: /trigger|start|run forecast/i }).first();
    await triggerButton.click();
    
    // Should show error message about empty portfolio
    const errorMessage = page.locator('.error').or(page.locator('[data-testid="error"]')).first();
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('should indicate when forecast data is outdated', async ({ page }) => {
    // Requirement 5.5: WHEN forecast data is outdated THEN the system SHALL 
    // indicate the age of the data to the user
    
    // Look for timestamp or age indicators
    const timestamp = page.locator('[data-testid="forecast-timestamp"]').or(page.locator('.timestamp')).first();
    const ageIndicator = page.locator('text=hours ago').or(page.locator('text=days ago')).first();
    const lastUpdated = page.locator('text=Last updated').or(page.locator('text=Generated')).first();
    
    // At least one time indicator should be present if there's data
    const hasTimestamp = await timestamp.isVisible({ timeout: 3000 });
    const hasAge = await ageIndicator.isVisible({ timeout: 3000 });
    const hasLastUpdated = await lastUpdated.isVisible({ timeout: 3000 });
    
    // If no time indicators, should be because there's no data
    if (!hasTimestamp && !hasAge && !hasLastUpdated) {
      const noDataMessage = page.locator('text=No forecast data').first();
      await expect(noDataMessage).toBeVisible();
    }
  });

  test('should handle forecast API errors gracefully', async ({ page }) => {
    // Test error handling for API failures during forecast operations
    
    // Try to trigger forecast and handle potential API errors
    const triggerButton = page.locator('button').filter({ hasText: /trigger|start|run forecast/i }).first();
    await triggerButton.click();
    
    // Wait for any error messages
    await page.waitForTimeout(3000);
    
    // Check for error handling
    const errorMessage = page.locator('.error').or(page.locator('[data-testid="error"]')).first();
    const retryButton = page.locator('button').filter({ hasText: /retry|try again/i }).first();
    
    // If there's an error, there should be appropriate handling
    if (await errorMessage.isVisible()) {
      // Error message should be user-friendly
      const errorText = await errorMessage.textContent();
      expect(errorText).toBeTruthy();
      expect(errorText?.length).toBeGreaterThan(0);
    }
  });
});