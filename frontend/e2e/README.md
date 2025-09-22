# End-to-End Testing

This directory contains comprehensive end-to-end tests for the Renewable Energy Forecasting application using Playwright.

## Test Coverage

The E2E tests cover the following critical user workflows:

### 1. Site Management (`site-management.spec.ts`)
- **Requirements Covered**: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3
- Map-based site creation interface
- Site details form validation
- Site marker display and interaction
- Site removal with confirmation
- Coordinate validation and duplicate prevention

### 2. Portfolio Management (`portfolio-management.spec.ts`)
- **Requirements Covered**: 3.1, 3.2, 3.3, 3.4, 3.5
- Portfolio creation and editing
- Site assignment to portfolios
- Visual grouping on map
- Data persistence across sessions

### 3. Forecast Workflow (`forecast-workflow.spec.ts`)
- **Requirements Covered**: 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4, 5.5
- Portfolio forecast triggering
- Job status tracking
- Results visualization with charts
- Time series data display
- Error handling for empty portfolios

### 4. Error Handling (`error-handling.spec.ts`)
- **Requirements Covered**: 7.4, 7.5
- Network connectivity issues
- API failure recovery
- Form validation errors
- Loading states and user feedback
- Session timeout handling

### 5. Complete Workflow (`complete-workflow.spec.ts`)
- End-to-end user journey testing
- Data persistence verification
- Error recovery scenarios
- State management across navigation

## Running Tests

### Prerequisites

1. **Backend Setup**: Ensure Django backend is running on `http://localhost:8000`
2. **Frontend Setup**: Ensure React frontend is running on `http://localhost:3000`
3. **Database**: Have a test database configured and migrated

### Local Development

```bash
# Install Playwright (if not already installed)
cd frontend
npm install @playwright/test
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug specific test
npm run test:e2e:debug -- site-management.spec.ts
```

### Running Specific Test Suites

```bash
# Run only site management tests
npx playwright test site-management.spec.ts

# Run only portfolio tests
npx playwright test portfolio-management.spec.ts

# Run only forecast tests
npx playwright test forecast-workflow.spec.ts

# Run only error handling tests
npx playwright test error-handling.spec.ts

# Run complete workflow tests
npx playwright test complete-workflow.spec.ts
```

### Test Configuration

The tests are configured in `playwright.config.ts` with the following settings:

- **Base URL**: `http://localhost:3000`
- **Browsers**: Chromium, Firefox, WebKit
- **Parallel Execution**: Enabled for faster test runs
- **Retries**: 2 retries on CI, 0 locally
- **Trace Collection**: On first retry for debugging

## Test Data Management

### Test Isolation
- Each test creates its own test data
- Tests clean up after themselves where possible
- Database state is reset between test runs

### Mock Data
- Tests use realistic but fake data for sites and portfolios
- Coordinates are chosen to avoid real-world conflicts
- Names and descriptions are clearly marked as test data

## Debugging Tests

### Visual Debugging
```bash
# Run with headed browser to see actions
npm run test:e2e:headed

# Use debug mode for step-by-step execution
npm run test:e2e:debug
```

### Trace Viewer
When tests fail, Playwright automatically captures traces. View them with:
```bash
npx playwright show-trace test-results/[test-name]/trace.zip
```

### Screenshots and Videos
Failed tests automatically capture:
- Screenshots at the point of failure
- Video recordings of the entire test run
- Network logs and console output

## CI/CD Integration

Tests run automatically in GitHub Actions on:
- Push to main/develop branches
- Pull requests to main/develop branches

The CI pipeline:
1. Sets up PostgreSQL test database
2. Installs Python and Node.js dependencies
3. Starts Django backend and React frontend
4. Runs all Playwright tests
5. Uploads test reports and artifacts

## Best Practices

### Writing New Tests
1. **Use data-testid attributes** for reliable element selection
2. **Wait for network idle** before interactions
3. **Use explicit waits** instead of arbitrary timeouts
4. **Test error scenarios** alongside happy paths
5. **Keep tests independent** and idempotent

### Element Selection Priority
1. `data-testid` attributes (most reliable)
2. Semantic selectors (role, label)
3. CSS classes (less reliable)
4. Text content (least reliable for dynamic content)

### Error Handling
- Always test both success and failure scenarios
- Verify error messages are user-friendly
- Test retry mechanisms and recovery flows
- Validate loading states and user feedback

## Troubleshooting

### Common Issues

**Tests timing out**
- Increase timeout values in test configuration
- Check if backend/frontend services are running
- Verify network connectivity

**Element not found**
- Check if selectors match actual DOM structure
- Use `page.locator().or()` for fallback selectors
- Add explicit waits for dynamic content

**Flaky tests**
- Add proper wait conditions
- Use `page.waitForLoadState('networkidle')`
- Avoid hardcoded timeouts

**Database conflicts**
- Ensure test database is properly isolated
- Check for leftover data from previous runs
- Verify migrations are up to date

### Getting Help

1. Check Playwright documentation: https://playwright.dev/
2. Review test logs and traces for failure details
3. Use debug mode to step through failing tests
4. Check GitHub Actions logs for CI failures

## Maintenance

### Updating Tests
- Update tests when UI components change
- Maintain test data consistency
- Review and update selectors regularly
- Keep test documentation current

### Performance
- Monitor test execution time
- Optimize slow tests
- Use parallel execution effectively
- Clean up test artifacts regularly