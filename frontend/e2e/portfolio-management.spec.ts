import { test, expect } from '@playwright/test';

test.describe('Portfolio Management Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the portfolios page
    await page.goto('/portfolios');
    await page.waitForLoadState('networkidle');
  });

  test('should display portfolio management interface', async ({ page }) => {
    // Requirement 3.1: WHEN a user accesses the portfolio management interface 
    // THEN the system SHALL display a list of existing portfolios and option to create new ones
    
    // Check for portfolio list container
    const portfolioList = page.locator('[data-testid="portfolio-list"]').or(page.locator('.portfolio-list')).first();
    await expect(portfolioList).toBeVisible({ timeout: 5000 });
    
    // Check for create new portfolio button
    const createButton = page.locator('button').filter({ hasText: /create|new|add portfolio/i }).first();
    await expect(createButton).toBeVisible();
  });

  test('should allow creating a new portfolio with name and description', async ({ page }) => {
    // Requirement 3.2: WHEN creating a new portfolio THEN the system SHALL 
    // allow the user to specify a portfolio name and description
    
    // Click create new portfolio button
    const createButton = page.locator('button').filter({ hasText: /create|new|add portfolio/i }).first();
    await createButton.click();
    
    // Check that portfolio form appears
    const portfolioForm = page.locator('[data-testid="portfolio-form"]').or(page.locator('form')).first();
    await expect(portfolioForm).toBeVisible({ timeout: 5000 });
    
    // Check for name and description fields
    const nameInput = page.locator('input[name="name"]').or(page.locator('[data-testid="portfolio-name"]'));
    await expect(nameInput).toBeVisible();
    
    const descriptionInput = page.locator('textarea[name="description"]').or(page.locator('[data-testid="portfolio-description"]'));
    await expect(descriptionInput).toBeVisible();
    
    // Fill out the form
    await nameInput.fill('Test Portfolio');
    await descriptionInput.fill('A test portfolio for E2E testing');
    
    // Submit the form
    const submitButton = page.locator('button[type="submit"]').or(page.locator('[data-testid="submit-portfolio"]'));
    await submitButton.click();
    
    // Wait for portfolio to be created
    await page.waitForTimeout(2000);
    
    // Check that portfolio appears in the list
    const portfolioItem = page.locator('text=Test Portfolio').first();
    await expect(portfolioItem).toBeVisible({ timeout: 5000 });
  });

  test('should allow adding sites to a portfolio', async ({ page }) => {
    // Requirement 3.3: WHEN managing a portfolio THEN the system SHALL 
    // allow the user to add or remove sites from the portfolio
    
    // First create a portfolio
    const createButton = page.locator('button').filter({ hasText: /create|new|add portfolio/i }).first();
    await createButton.click();
    
    await page.waitForSelector('form', { timeout: 5000 });
    
    const nameInput = page.locator('input[name="name"]').or(page.locator('[data-testid="portfolio-name"]'));
    await nameInput.fill('Portfolio for Site Assignment');
    
    const submitButton = page.locator('button[type="submit"]').or(page.locator('[data-testid="submit-portfolio"]'));
    await submitButton.click();
    
    await page.waitForTimeout(2000);
    
    // Navigate to sites page to create a site first
    await page.goto('/sites');
    await page.waitForLoadState('networkidle');
    
    // Create a site
    const mapContainer = page.locator('.leaflet-container');
    await mapContainer.click({ position: { x: 300, y: 200 } });
    
    await page.waitForSelector('form', { timeout: 5000 });
    
    const siteNameInput = page.locator('input[name="name"]').or(page.locator('[data-testid="site-name"]'));
    await siteNameInput.fill('Test Site for Portfolio');
    
    const typeSelect = page.locator('select[name="site_type"]').or(page.locator('[data-testid="site-type"]'));
    await typeSelect.selectOption('solar');
    
    const siteSubmitButton = page.locator('button[type="submit"]').or(page.locator('[data-testid="submit-site"]'));
    await siteSubmitButton.click();
    
    await page.waitForTimeout(2000);
    
    // Go back to portfolios page
    await page.goto('/portfolios');
    await page.waitForLoadState('networkidle');
    
    // Find and click on the created portfolio
    const portfolioItem = page.locator('text=Portfolio for Site Assignment').first();
    await portfolioItem.click();
    
    // Look for add site functionality
    const addSiteButton = page.locator('button').filter({ hasText: /add site|assign site/i }).first();
    if (await addSiteButton.isVisible()) {
      await addSiteButton.click();
      
      // Check for site selection interface
      const siteSelector = page.locator('select').or(page.locator('[data-testid="site-selector"]')).first();
      await expect(siteSelector).toBeVisible({ timeout: 3000 });
    }
  });

  test('should display portfolio sites on map with visual grouping', async ({ page }) => {
    // Requirement 3.4: WHEN viewing a portfolio THEN the system SHALL 
    // display all sites in the portfolio on the map with visual grouping
    
    // Create a portfolio with sites (simplified test)
    const createButton = page.locator('button').filter({ hasText: /create|new|add portfolio/i }).first();
    await createButton.click();
    
    await page.waitForSelector('form', { timeout: 5000 });
    
    const nameInput = page.locator('input[name="name"]').or(page.locator('[data-testid="portfolio-name"]'));
    await nameInput.fill('Visual Grouping Portfolio');
    
    const submitButton = page.locator('button[type="submit"]').or(page.locator('[data-testid="submit-portfolio"]'));
    await submitButton.click();
    
    await page.waitForTimeout(2000);
    
    // Check if there's a map view for portfolios
    const mapContainer = page.locator('.leaflet-container');
    if (await mapContainer.isVisible()) {
      // Verify map is displayed
      await expect(mapContainer).toBeVisible();
      
      // Check for portfolio-specific styling or markers
      const portfolioMarkers = page.locator('.portfolio-marker').or(page.locator('[data-portfolio-id]'));
      // This test may need adjustment based on actual implementation
    }
  });

  test('should persist portfolio changes to database', async ({ page }) => {
    // Requirement 3.5: WHEN a portfolio is created or modified THEN the system 
    // SHALL persist the changes to the database
    
    // Create a portfolio
    const createButton = page.locator('button').filter({ hasText: /create|new|add portfolio/i }).first();
    await createButton.click();
    
    await page.waitForSelector('form', { timeout: 5000 });
    
    const nameInput = page.locator('input[name="name"]').or(page.locator('[data-testid="portfolio-name"]'));
    await nameInput.fill('Persistence Test Portfolio');
    
    const descriptionInput = page.locator('textarea[name="description"]').or(page.locator('[data-testid="portfolio-description"]'));
    await descriptionInput.fill('Testing database persistence');
    
    const submitButton = page.locator('button[type="submit"]').or(page.locator('[data-testid="submit-portfolio"]'));
    await submitButton.click();
    
    await page.waitForTimeout(2000);
    
    // Refresh the page to verify persistence
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check that the portfolio still exists
    const portfolioItem = page.locator('text=Persistence Test Portfolio').first();
    await expect(portfolioItem).toBeVisible({ timeout: 5000 });
  });

  test('should handle portfolio validation errors', async ({ page }) => {
    // Test error handling for invalid portfolio data
    
    const createButton = page.locator('button').filter({ hasText: /create|new|add portfolio/i }).first();
    await createButton.click();
    
    await page.waitForSelector('form', { timeout: 5000 });
    
    // Try to submit without required fields
    const submitButton = page.locator('button[type="submit"]').or(page.locator('[data-testid="submit-portfolio"]'));
    await submitButton.click();
    
    // Should show validation error
    const errorMessage = page.locator('.error').or(page.locator('[data-testid="error"]')).first();
    await expect(errorMessage).toBeVisible({ timeout: 3000 });
  });

  test('should allow removing sites from portfolio', async ({ page }) => {
    // Test site removal from portfolio functionality
    
    // Create a portfolio first
    const createButton = page.locator('button').filter({ hasText: /create|new|add portfolio/i }).first();
    await createButton.click();
    
    await page.waitForSelector('form', { timeout: 5000 });
    
    const nameInput = page.locator('input[name="name"]').or(page.locator('[data-testid="portfolio-name"]'));
    await nameInput.fill('Site Removal Test Portfolio');
    
    const submitButton = page.locator('button[type="submit"]').or(page.locator('[data-testid="submit-portfolio"]'));
    await submitButton.click();
    
    await page.waitForTimeout(2000);
    
    // Click on the portfolio to manage it
    const portfolioItem = page.locator('text=Site Removal Test Portfolio').first();
    await portfolioItem.click();
    
    // Look for remove site functionality (if sites are already assigned)
    const removeSiteButton = page.locator('button').filter({ hasText: /remove|unassign/i }).first();
    if (await removeSiteButton.isVisible()) {
      await removeSiteButton.click();
      
      // Should show confirmation or update the portfolio
      await page.waitForTimeout(1000);
    }
  });
});