# Site Management Components

This directory contains the site management components for the renewable energy forecasting application.

## Components

### SiteForm
A comprehensive form component for creating and editing renewable energy sites.

**Features:**
- Form validation for all required fields (name, latitude, longitude)
- Coordinate validation (latitude: -90 to 90, longitude: -180 to 180)
- Optional capacity field with validation
- Real-time validation feedback
- Loading states and error handling
- Accessibility support with proper labels and ARIA attributes

**Props:**
- `site?: Site | null` - Site to edit (null for create mode)
- `onSubmit: (siteData: CreateSiteRequest) => Promise<void>` - Form submission handler
- `onCancel: () => void` - Cancel button handler
- `isLoading?: boolean` - Loading state
- `error?: string | null` - Error message to display

### SiteManager
A complete site management interface with CRUD operations.

**Features:**
- Site listing with grid layout
- Search functionality by site name or type
- Filter by site type (solar/wind)
- Create, edit, and delete operations with confirmation dialogs
- Loading states and error handling
- Site selection with visual feedback
- Responsive design for mobile devices

**Props:**
- `onSiteCreated?: (site: Site) => void` - Callback when site is created
- `onSiteUpdated?: (site: Site) => void` - Callback when site is updated
- `onSiteDeleted?: (siteId: number) => void` - Callback when site is deleted
- `selectedSite?: Site | null` - Currently selected site
- `onSiteSelect?: (site: Site | null) => void` - Site selection handler
- `className?: string` - Additional CSS classes

## Usage

```tsx
import { SiteForm, SiteManager } from './components/Site';

// Using SiteForm
<SiteForm
  site={editingSite}
  onSubmit={handleSiteSubmit}
  onCancel={handleCancel}
  isLoading={isSubmitting}
  error={submitError}
/>

// Using SiteManager
<SiteManager
  onSiteCreated={handleSiteCreated}
  onSiteUpdated={handleSiteUpdated}
  onSiteDeleted={handleSiteDeleted}
  selectedSite={selectedSite}
  onSiteSelect={handleSiteSelect}
/>
```

## Validation Rules

### Site Name
- Required field
- Minimum 2 characters
- Maximum 200 characters

### Coordinates
- **Latitude**: Required, must be between -90 and 90
- **Longitude**: Required, must be between -180 and 180

### Capacity
- Optional field
- Must be positive number if provided
- Maximum 10,000 MW

## Styling

The components use CSS modules with responsive design:
- Mobile-first approach
- Accessible color contrast
- Loading animations
- Error state styling
- Focus management for keyboard navigation

## Testing

Components include comprehensive tests covering:
- Form validation
- User interactions
- Error handling
- Accessibility features
- Loading states

Run tests with:
```bash
npm test -- --testPathPattern="Site"
```

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:
- **1.1, 1.2, 1.3**: Site creation and management with proper validation
- **1.5**: Coordinate validation and site type selection
- **2.1, 2.2, 2.3**: Site removal with confirmation dialogs
- **7.4, 7.5**: Responsive design with proper error handling and loading states