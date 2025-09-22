# Renewable Energy Forecasting Application - User Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Managing Sites](#managing-sites)
4. [Managing Portfolios](#managing-portfolios)
5. [Running Forecasts](#running-forecasts)
6. [Understanding Results](#understanding-results)
7. [Tips and Best Practices](#tips-and-best-practices)
8. [Troubleshooting](#troubleshooting)

## Getting Started

### Accessing the Application

1. **Open your web browser** and navigate to the application URL:
   - Local development: `http://localhost:3000`
   - Production: Your deployed application URL

2. **Application Layout**: The application consists of several main sections:
   - **Navigation Bar**: Access different sections of the application
   - **Interactive Map**: Central map interface for site visualization
   - **Side Panels**: Forms and data displays
   - **Status Indicators**: Loading states and notifications

### Navigation

The application uses a tabbed navigation system:

- **Dashboard**: Main overview with interactive map
- **Sites**: Manage renewable energy sites
- **Portfolios**: Create and manage site portfolios
- **Forecasts**: View and manage forecasting operations

## Dashboard Overview

The Dashboard is your main workspace, featuring:

### Interactive Map
- **Base Layer**: OpenStreetMap tiles showing geographic context
- **Site Markers**: Visual indicators for renewable energy sites
  - 🟡 **Solar sites**: Yellow markers
  - 🔵 **Wind sites**: Blue markers
- **Portfolio Grouping**: Sites in the same portfolio are visually connected
- **Zoom Controls**: Use mouse wheel or +/- buttons to zoom
- **Pan**: Click and drag to move around the map

### Map Controls
- **Zoom In/Out**: Use the +/- buttons or mouse wheel
- **Reset View**: Double-click to reset to default view
- **Full Screen**: Expand map to full screen (if available)

### Site Information Panel
When you click on a site marker, you'll see:
- Site name and type
- Coordinates
- Capacity (if specified)
- Portfolio membership
- Action buttons (Edit, Delete)

## Managing Sites

Sites represent individual renewable energy installations (solar farms, wind farms).

### Adding a New Site

#### Method 1: Click-to-Add on Map

1. **Navigate to the Dashboard or Sites page**
2. **Click on any location** on the map where you want to add a site
3. **Fill out the popup form**:
   - **Name**: Enter a descriptive name (e.g., "Solar Farm Alpha")
   - **Type**: Select either "Solar" or "Wind"
   - **Capacity**: Optional capacity in megawatts (e.g., "100.5")
4. **Click "Add Site"** to save

#### Method 2: Manual Entry

1. **Go to the Sites page**
2. **Click "Add New Site"**
3. **Fill out the form**:
   - **Name**: Required, up to 200 characters
   - **Type**: Required, select from dropdown
   - **Latitude**: Required, between -90 and 90
   - **Longitude**: Required, between -180 and 180
   - **Capacity**: Optional, positive number in MW
4. **Click "Save"**

### Site Validation Rules

- **Coordinates**: Must be valid latitude/longitude values
- **Duplicate Prevention**: Sites cannot be placed within 11 meters of each other
- **Name**: Must be unique and descriptive
- **Type**: Must be either "solar" or "wind"

### Editing Sites

1. **Click on a site marker** on the map, OR
2. **Go to Sites page** and click "Edit" next to a site
3. **Modify the information** in the form
4. **Click "Save Changes"**

**Note**: Changing coordinates will trigger duplicate validation.

### Deleting Sites

1. **Click on a site marker** and select "Delete", OR
2. **Go to Sites page** and click "Delete" next to a site
3. **Confirm deletion** in the popup dialog

**Important**: Sites that are part of portfolios must be removed from all portfolios before deletion.

### Site List View

The Sites page shows all sites in a table format:
- **Name**: Site name with type indicator
- **Type**: Solar or Wind
- **Coordinates**: Latitude, Longitude
- **Capacity**: Capacity in MW (if specified)
- **Portfolios**: Which portfolios contain this site
- **Actions**: Edit, Delete buttons

## Managing Portfolios

Portfolios are collections of sites grouped for analysis and forecasting.

### Creating a Portfolio

1. **Navigate to the Portfolios page**
2. **Click "Create New Portfolio"**
3. **Fill out the form**:
   - **Name**: Required, descriptive name (e.g., "East Coast Wind Farms")
   - **Description**: Optional detailed description
   - **Sites**: Select sites to include (optional, can add later)
4. **Click "Create Portfolio"**

### Adding Sites to Portfolios

#### Method 1: During Portfolio Creation
- Select sites from the checklist when creating the portfolio

#### Method 2: After Portfolio Creation
1. **Open an existing portfolio**
2. **Click "Add Sites"**
3. **Select sites** from the available list
4. **Click "Add Selected Sites"**

#### Method 3: Bulk Assignment
1. **Go to Sites page**
2. **Select multiple sites** using checkboxes
3. **Choose "Add to Portfolio"** from bulk actions
4. **Select target portfolio**

### Removing Sites from Portfolios

1. **Open the portfolio**
2. **Find the site** you want to remove
3. **Click "Remove"** next to the site
4. **Confirm removal** in the dialog

### Portfolio Visualization

Portfolios are visualized on the map with:
- **Color Coding**: Sites in the same portfolio share colors
- **Connecting Lines**: Visual connections between portfolio sites
- **Portfolio Legend**: Shows which colors represent which portfolios

### Portfolio Information

Each portfolio displays:
- **Total Sites**: Number of sites in the portfolio
- **Total Capacity**: Sum of all site capacities
- **Site Types**: Breakdown of solar vs wind sites
- **Geographic Spread**: Coverage area information

## Running Forecasts

Forecasting generates predictions for energy generation across portfolio sites.

### Triggering a Forecast

1. **Navigate to the Forecasts page**
2. **Select a portfolio** from the dropdown
3. **Set forecast parameters**:
   - **Forecast Horizon**: Number of hours to forecast (default: 24)
   - **Model Type**: Currently uses Random Model (MVP)
4. **Click "Run Forecast"**

### Forecast Job Management

After triggering a forecast:

1. **Job Creation**: System creates a forecast job with unique ID
2. **Status Tracking**: Monitor job progress:
   - **Pending**: Job is queued for processing
   - **Running**: Forecast is being generated
   - **Completed**: Forecast is ready for viewing
   - **Failed**: An error occurred during processing

3. **Job Information**:
   - Job ID (UUID)
   - Portfolio name
   - Creation time
   - Completion time (when finished)
   - Number of sites processed

### Monitoring Progress

The system provides real-time updates on forecast progress:
- **Progress Bar**: Visual indicator of completion
- **Status Messages**: Text updates on current activity
- **Estimated Time**: Remaining time estimate
- **Auto-Refresh**: Page updates automatically

### Forecast Requirements

To run a forecast:
- **Portfolio must exist** and be accessible
- **Portfolio must contain at least one site**
- **No conflicting jobs** for the same portfolio (optional constraint)

## Understanding Results

### Forecast Data Structure

Forecast results include:

#### Portfolio-Level Aggregation
- **Total Generation**: Sum of all site predictions
- **Time Series**: Hourly predictions over the forecast horizon
- **Confidence Intervals**: Upper and lower bounds (when available)

#### Site-Level Details
- **Individual Predictions**: Per-site generation forecasts
- **Site Information**: Name, type, capacity
- **Confidence Intervals**: Site-specific uncertainty bounds

### Visualization Components

#### Time Series Charts
- **X-Axis**: Time (hourly intervals)
- **Y-Axis**: Energy generation (MWh)
- **Lines**: 
  - Solid line: Predicted generation
  - Dashed lines: Confidence intervals
- **Colors**: Different colors for different sites

#### Summary Statistics
- **Peak Generation**: Highest predicted output
- **Total Energy**: Sum over forecast period
- **Average Generation**: Mean hourly output
- **Capacity Factor**: Percentage of maximum possible generation

#### Data Tables
- **Hourly Breakdown**: Detailed numeric data
- **Site Comparison**: Side-by-side site performance
- **Export Options**: Download data as CSV/JSON

### Interpreting Results

#### Random Model (Current MVP)
The current implementation uses a random number generator:
- **Purpose**: Demonstrates system functionality
- **Characteristics**: 
  - Generates realistic-looking random values
  - Includes confidence intervals
  - Varies by site type and capacity
- **Limitations**: Not based on actual weather or historical data

#### Future Models
Production systems would include:
- **Weather-Based Models**: Using meteorological forecasts
- **Machine Learning Models**: Trained on historical data
- **Hybrid Models**: Combining multiple approaches

### Data Export

Export forecast results in multiple formats:
- **CSV**: Spreadsheet-compatible format
- **JSON**: API-compatible format
- **PDF**: Report format with charts
- **PNG**: Chart images

## Tips and Best Practices

### Site Management

1. **Naming Convention**: Use consistent, descriptive names
   - Good: "Solar Farm Alpha - Nevada"
   - Avoid: "Site 1", "Test"

2. **Coordinate Accuracy**: Ensure coordinates are precise
   - Use GPS coordinates when possible
   - Verify locations on the map before saving

3. **Capacity Information**: Include capacity when known
   - Helps with forecast scaling
   - Useful for portfolio analysis

4. **Site Types**: Choose appropriate types
   - Solar: Photovoltaic installations
   - Wind: Wind turbine installations

### Portfolio Organization

1. **Logical Grouping**: Group sites by meaningful criteria
   - Geographic regions
   - Project phases
   - Technology types
   - Ownership structures

2. **Portfolio Size**: Consider optimal portfolio sizes
   - Small portfolios (5-10 sites): Detailed analysis
   - Large portfolios (50+ sites): Regional analysis

3. **Naming**: Use descriptive portfolio names
   - Include geographic or thematic information
   - Examples: "California Solar Portfolio", "Offshore Wind Phase 1"

### Forecasting Best Practices

1. **Forecast Timing**: Run forecasts at appropriate intervals
   - Daily forecasts for operational planning
   - Weekly forecasts for maintenance scheduling
   - Monthly forecasts for financial planning

2. **Horizon Selection**: Choose appropriate forecast horizons
   - Short-term (1-24 hours): Operational decisions
   - Medium-term (1-7 days): Maintenance planning
   - Long-term (1-30 days): Strategic planning

3. **Result Validation**: Always review forecast results
   - Check for unrealistic values
   - Compare with historical performance
   - Validate against weather conditions

### Data Quality

1. **Regular Updates**: Keep site information current
   - Update capacity after modifications
   - Remove decommissioned sites
   - Add new installations promptly

2. **Coordinate Verification**: Periodically verify site locations
   - Use satellite imagery
   - Cross-reference with official records
   - Update if sites are relocated

3. **Portfolio Maintenance**: Keep portfolios organized
   - Remove obsolete portfolios
   - Update portfolio descriptions
   - Reorganize as business needs change

## Troubleshooting

### Common Issues

#### Site Creation Problems

**Issue**: "Site too close to existing site"
- **Cause**: Attempting to place a site within 11 meters of an existing site
- **Solution**: 
  - Check the map for nearby sites
  - Move the location slightly
  - Verify coordinates are correct

**Issue**: "Invalid coordinates"
- **Cause**: Latitude/longitude values are out of valid range
- **Solution**:
  - Latitude must be between -90 and 90
  - Longitude must be between -180 and 180
  - Use decimal format (e.g., 40.123456)

#### Portfolio Management Issues

**Issue**: Cannot delete site
- **Cause**: Site is part of one or more portfolios
- **Solution**: Remove site from all portfolios first

**Issue**: Portfolio appears empty on map
- **Cause**: Portfolio has no sites or sites are not visible at current zoom level
- **Solution**: 
  - Zoom out to see all sites
  - Check that portfolio actually contains sites
  - Verify sites have valid coordinates

#### Forecast Problems

**Issue**: Forecast job stuck in "Pending" status
- **Cause**: System overload or processing queue backup
- **Solution**:
  - Wait for system to process queue
  - Cancel and retry if stuck for >10 minutes
  - Check system status

**Issue**: "Empty portfolio" error
- **Cause**: Attempting to forecast a portfolio with no sites
- **Solution**: Add sites to the portfolio before forecasting

**Issue**: Forecast results not displaying
- **Cause**: Job failed or results not yet available
- **Solution**:
  - Check job status
  - Wait for job completion
  - Retry if job failed

### Performance Issues

#### Slow Map Loading
- **Check internet connection** for map tiles
- **Reduce number of visible sites** by filtering
- **Clear browser cache** and reload

#### Slow API Responses
- **Check network connection**
- **Verify backend server is running**
- **Check for large datasets** that might slow queries

#### Browser Compatibility
- **Use modern browsers**: Chrome, Firefox, Safari, Edge
- **Enable JavaScript**
- **Clear browser cache** if experiencing issues
- **Disable browser extensions** that might interfere

### Getting Help

If you continue to experience issues:

1. **Check the browser console** for error messages
2. **Review the API documentation** for correct usage
3. **Verify your environment setup** matches requirements
4. **Check the troubleshooting section** in the main README
5. **Contact system administrators** for persistent issues

### Error Messages

Common error messages and their meanings:

- **"Network Error"**: Connection problem between frontend and backend
- **"Validation Error"**: Input data doesn't meet requirements
- **"Not Found"**: Requested resource doesn't exist
- **"Conflict"**: Operation conflicts with existing data
- **"Server Error"**: Internal system problem

---

This user guide covers the main functionality of the Renewable Energy Forecasting Application. For technical details, see the [README.md](README.md) and [API_DOCUMENTATION.md](API_DOCUMENTATION.md) files.