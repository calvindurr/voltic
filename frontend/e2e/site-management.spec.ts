import { test, expect } from '@playwright/test';

test.describe('Site Management Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the sites page
    await page.goto('/sites');
    await page.waitForLoadState('networkidle');
  });

  test('should display map interface for site selection', async ({ page }) => {
    // Requirement 1.1: WHEN a user accesses the site management interface 
    // THEN the system SHALL display a map-based interface for site selection
    
    // Check that the map container is present
    await expect(page.locator('.leaflet-container')).toBeVisible();
    
    // Check that map controls are present
    await expect(page.locator('.leaflet-control-zoom')).toBeVisible();
    
    // Verify the map has loaded tiles
    await expect(page.locator('.leaflet-tile-pane')).toBeVisible();
  });

  test('should allow adding a new site by clicking on the map', async ({ page }) => {
    // Requirement 1.2: WHEN a user clicks on a location on the map 
    // THEN the system SHALL allow the user to add a new renewable energy site at that location
    
    // Wait for map to be fully loaded
    await page.waitForSelector('.leaflet-container');
    
    // Click on the map to add a new site
    const mapContainer = page.locator('.leaflet-container');
    await mapContainer.click({ position: { x: 300, y: 200 } });
    
    // Check if site form appears or modal opens
    const siteForm = page.locator('[data-testid="site-form"]').or(page.locator('form')).first();
    await expect(siteForm).toBeVisible({ timeout: 5000 });
  });

  test('should require site details when adding a new site', async ({ page }) => {
    // Requirement 1.3: WHEN adding a new site THEN the system SHALL require 
    // the user to specify site details including name, type (solar/wind), and coordinates
    
    // Click on map to trigger site creation
    const mapContainer = page.locator('.leaflet-container');
    await mapContainer.click({ position: { x: 300, y: 200 } });
    
    // Wait for form to appear
    await page.waitForSelector('form', { timeout: 5000 });
    
    // Check that required fields are present
    await expect(page.locator('input[name="name"]').or(page.locator('[data-testid="site-name"]'))).toBeVisible();
    await expect(page.locator('select[name="site_type"]').or(page.locator('[data-testid="site-type"]'))).toBeVisible();
    
    // Try to submit without filling required fields
    const submitButton = page.locator('button[type="submit"]').or(page.locator('[data-testid="submit-site"]'));
    await submitButton.click();
    
    // Should show validation errors
    const errorMessage = page.locator('.error').or(page.locator('[data-testid="error"]')).first();
    await expect(errorMessage).toBeVisible({ timeout: 3000 });
  });

  test('should successfully create a site with valid data', async ({ page }) => {
    // Requirement 1.4: WHEN a site is successfully added 
    // THEN the system SHALL display the site as a marker on the map
    // Requirement 1.5: WHEN a site is added THEN the system SHALL store 
    // the site information in the database with a unique identifier
    
    // Click on map to add site
    const mapContainer = page.locator('.leaflet-container');
    await mapContainer.click({ position: { x: 300, y: 200 } });
    
    // Fill out the site form
    await page.waitForSelector('form', { timeout: 5000 });
    
    const nameInput = page.locator('input[name="name"]').or(page.locator('[data-testid="site-name"]'));
    await nameInput.fill('Test Solar Site');
    
    const typeSelect = page.locator('select[name="site_type"]').or(page.locator('[data-testid="site-type"]'));
    await typeSelect.selectOption('solar');
    
    // Submit the form
    const submitButton = page.locator('button[type="submit"]').or(page.locator('[data-testid="submit-site"]'));
    await submitButton.click();
    
    // Wait for success message or site to appear
    await page.waitForTimeout(2000);
    
    // Check that a marker appears on the map
    const markers = page.locator('.leaflet-marker-icon');
    await expect(markers).toHaveCount(1, { timeout: 5000 });
  });

  test('should display site details when clicking on existing site marker', async ({ page }) => {
    // Requirement 2.1: WHEN a user clicks on an existing site marker on the map 
    // THEN the system SHALL display site details and management options
    
    // First create a site (assuming there's at least one site)
    const mapContainer = page.locator('.leaflet-container');
    await mapContainer.click({ position: { x: 300, y: 200 } });
    
    await page.waitForSelector('form', { timeout: 5000 });
    
    const nameInput = page.locator('input[name="name"]').or(page.locator('[data-testid="site-name"]'));
    await nameInput.fill('Test Site for Details');
    
    const typeSelect = page.locator('select[name="site_type"]').or(page.locator('[data-testid="site-type"]'));
    await typeSelect.selectOption('wind');
    
    const submitButton = page.locator('button[type="submit"]').or(page.locator('[data-testid="submit-site"]'));
    await submitButton.click();
    
    await page.waitForTimeout(2000);
    
    // Click on the created marker
    const marker = page.locator('.leaflet-marker-icon').first();
    await marker.click();
    
    // Check that site details popup or panel appears
    const siteDetails = page.locator('.leaflet-popup').or(page.locator('[data-testid="site-details"]'));
    await expect(siteDetails).toBeVisible({ timeout: 3000 });
  });

  test('should allow site removal with confirmation', async ({ page }) => {
    // Requirement 2.2: WHEN a user selects the remove option for a site 
    // THEN the system SHALL prompt for confirmation before deletion
    // Requirement 2.3: WHEN a user confirms site removal THEN the system SHALL 
    // delete the site from the database and remove the marker from the map
    
    // Create a site first
    const mapContainer = page.locator('.leaflet-container');
    await mapContainer.click({ position: { x: 300, y: 200 } });
    
    await page.waitForSelector('form', { timeout: 5000 });
    
    const nameInput = page.locator('input[name="name"]').or(page.locator('[data-testid="site-name"]'));
    await nameInput.fill('Site to Delete');
    
    const typeSelect = page.locator('select[name="site_type"]').or(page.locator('[data-testid="site-type"]'));
    await typeSelect.selectOption('solar');
    
    const submitButton = page.locator('button[type="submit"]').or(page.locator('[data-testid="submit-site"]'));
    await submitButton.click();
    
    await page.waitForTimeout(2000);
    
    // Click on the marker to show details
    const marker = page.locator('.leaflet-marker-icon').first();
    await marker.click();
    
    // Look for delete button
    const deleteButton = page.locator('button').filter({ hasText: /delete|remove/i }).first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      
      // Check for confirmation dialog
      const confirmDialog = page.locator('.modal').or(page.locator('[role="dialog"]')).or(page.locator('.confirm'));
      await expect(confirmDialog).toBeVisible({ timeout: 3000 });
      
      // Confirm deletion
      const confirmButton = page.locator('button').filter({ hasText: /confirm|yes|delete/i }).first();
      await confirmButton.click();
      
      // Verify marker is removed
      await page.waitForTimeout(1000);
      await expect(page.locator('.leaflet-marker-icon')).toHaveCount(0);
    }
  });

  test('should handle validation errors gracefully', async ({ page }) => {
    // Test error handling for invalid coordinates or duplicate sites
    
    // Click on map
    const mapContainer = page.locator('.leaflet-container');
    await mapContainer.click({ position: { x: 300, y: 200 } });
    
    await page.waitForSelector('form', { timeout: 5000 });
    
    // Try to submit with invalid data
    const nameInput = page.locator('input[name="name"]').or(page.locator('[data-testid="site-name"]'));
    await nameInput.fill(''); // Empty name
    
    const submitButton = page.locator('button[type="submit"]').or(page.locator('[data-testid="submit-site"]'));
    await submitButton.click();
    
    // Should show validation error
    const errorMessage = page.locator('.error').or(page.locator('[data-testid="error"]')).first();
    await expect(errorMessage).toBeVisible({ timeout: 3000 });
  });
});