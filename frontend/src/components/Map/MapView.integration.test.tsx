import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MapView } from './MapView';
import { Site, CreateSiteRequest } from '../../types';

// Mock react-leaflet components
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children, ...props }: any) => (
    <div data-testid="map-container" {...props}>
      {children}
    </div>
  ),
  TileLayer: (props: any) => <div data-testid="tile-layer" {...props} />,
  Marker: ({ children, eventHandlers, ...props }: any) => (
    <div 
      data-testid="marker" 
      {...props}
      onClick={() => eventHandlers?.click?.()}
    >
      {children}
    </div>
  ),
  Popup: ({ children }: any) => (
    <div data-testid="popup">{children}</div>
  ),
  useMapEvents: jest.fn(() => null),
}));

// Mock leaflet
jest.mock('leaflet', () => ({
  LatLng: class MockLatLng {
    constructor(public mockLat: number, public mockLng: number) {
      this.mockLat = mockLat;
      this.mockLng = mockLng;
    }
  },
  Icon: class MockIcon {
    constructor(public mockOptions: any) {
      this.mockOptions = mockOptions;
    }
  },
  DivIcon: class MockDivIcon {
    constructor(public mockOptions: any) {
      this.mockOptions = mockOptions;
    }
  },
}));

// Mock CSS import
jest.mock('leaflet/dist/leaflet.css', () => ({}));

describe('MapView Integration Tests', () => {
  const mockSites: Site[] = [
    {
      id: 1,
      name: 'Solar Farm 1',
      site_type: 'solar',
      latitude: 40.7128,
      longitude: -74.0060,
      capacity_mw: 100,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 2,
      name: 'Wind Farm 1',
      site_type: 'wind',
      latitude: 41.8781,
      longitude: -87.6298,
      capacity_mw: 200,
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Full User Workflow', () => {
    it('allows user to view sites, add new site, and manage existing sites', async () => {
      const onSiteAdd = jest.fn();
      const onSiteUpdate = jest.fn();
      const onSiteDelete = jest.fn();
      const onSiteSelect = jest.fn();

      const { useMapEvents } = require('react-leaflet');
      let mapClickHandler: any;
      
      useMapEvents.mockImplementation((events: any) => {
        mapClickHandler = events.click;
        return null;
      });

      render(
        <MapView
          sites={mockSites}
          onSiteAdd={onSiteAdd}
          onSiteUpdate={onSiteUpdate}
          onSiteDelete={onSiteDelete}
          onSiteSelect={onSiteSelect}
          enableClickToAdd={true}
        />
      );

      // 1. Verify existing sites are displayed
      expect(screen.getByText('Solar Farm 1')).toBeInTheDocument();
      expect(screen.getByText('Wind Farm 1')).toBeInTheDocument();

      // 2. Click on a site to select it
      const markers = screen.getAllByTestId('marker');
      fireEvent.click(markers[0]);
      expect(onSiteSelect).toHaveBeenCalledWith(mockSites[0]);

      // 3. Add a new site by clicking on the map
      await act(async () => {
        if (mapClickHandler) {
          mapClickHandler({ latlng: { mockLat: 42.3601, mockLng: -71.0589 } });
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Add New Site')).toBeInTheDocument();
      });

      // Fill out the form
      const nameInput = screen.getByLabelText('Site Name:');
      const typeSelect = screen.getByLabelText('Site Type:');
      const capacityInput = screen.getByLabelText('Capacity (MW):');
      
      await userEvent.type(nameInput, 'Boston Solar Farm');
      await userEvent.selectOptions(typeSelect, 'solar');
      await userEvent.type(capacityInput, '75');

      // Submit the form
      const addButton = screen.getByText('Add Site');
      fireEvent.click(addButton);

      expect(onSiteAdd).toHaveBeenCalledWith({
        name: 'Boston Solar Farm',
        site_type: 'solar',
        latitude: 42.3601,
        longitude: -71.0589,
        capacity_mw: 75,
      });

      // 4. Update an existing site
      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);
      expect(onSiteUpdate).toHaveBeenCalledWith(mockSites[0]);

      // 5. Delete a site
      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[1]);
      expect(onSiteDelete).toHaveBeenCalledWith(mockSites[1].id);
    });

    it('handles different site types with appropriate icons', () => {
      render(
        <MapView
          sites={mockSites}
          enableClickToAdd={false}
        />
      );

      // Verify both solar and wind sites are rendered
      const markers = screen.getAllByTestId('marker');
      expect(markers).toHaveLength(2);

      // Verify site type information is displayed
      expect(screen.getByText('solar')).toBeInTheDocument();
      expect(screen.getByText('wind')).toBeInTheDocument();
    });

    it('handles portfolio grouping when portfolios are provided', () => {
      const portfolios = [
        {
          id: 1,
          name: 'East Coast Portfolio',
          description: 'East coast renewable sites',
          sites: [mockSites[0]],
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
        {
          id: 2,
          name: 'Midwest Portfolio',
          description: 'Midwest renewable sites',
          sites: [mockSites[1]],
          created_at: '2023-01-02T00:00:00Z',
          updated_at: '2023-01-02T00:00:00Z',
        },
      ];

      render(
        <MapView
          sites={mockSites}
          portfolios={portfolios}
          enableClickToAdd={false}
        />
      );

      // Verify sites are still displayed
      expect(screen.getByText('Solar Farm 1')).toBeInTheDocument();
      expect(screen.getByText('Wind Farm 1')).toBeInTheDocument();
    });

    it('handles map state management correctly', () => {
      const customCenter: [number, number] = [51.505, -0.09];
      const customZoom = 10;

      const { rerender } = render(
        <MapView
          sites={mockSites}
          center={customCenter}
          zoom={customZoom}
          height="600px"
        />
      );

      const mapContainer = screen.getByTestId('map-container');
      expect(mapContainer).toBeInTheDocument();

      // Update props
      const newCenter: [number, number] = [48.8566, 2.3522];
      const newZoom = 12;

      rerender(
        <MapView
          sites={mockSites}
          center={newCenter}
          zoom={newZoom}
          height="600px"
        />
      );

      // Map should still be rendered with new props
      expect(mapContainer).toBeInTheDocument();
    });

    it('handles error states gracefully', () => {
      // Test with invalid site data
      const invalidSites = [
        {
          ...mockSites[0],
          latitude: NaN,
          longitude: NaN,
        },
      ] as Site[];

      expect(() => 
        render(
          <MapView
            sites={invalidSites}
            enableClickToAdd={false}
          />
        )
      ).not.toThrow();
    });

    it('supports accessibility features', async () => {
      const onSiteAdd = jest.fn();
      const { useMapEvents } = require('react-leaflet');
      let mapClickHandler: any;
      
      useMapEvents.mockImplementation((events: any) => {
        mapClickHandler = events.click;
        return null;
      });

      render(
        <MapView
          sites={mockSites}
          onSiteAdd={onSiteAdd}
          enableClickToAdd={true}
        />
      );

      // Trigger modal
      await act(async () => {
        if (mapClickHandler) {
          mapClickHandler({ latlng: { mockLat: 40.7128, mockLng: -74.0060 } });
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Add New Site')).toBeInTheDocument();
      });

      // Check form accessibility
      expect(screen.getByLabelText('Site Name:')).toBeInTheDocument();
      expect(screen.getByLabelText('Site Type:')).toBeInTheDocument();
      expect(screen.getByLabelText('Capacity (MW):')).toBeInTheDocument();

      // Check button accessibility
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('handles large number of sites efficiently', () => {
      const largeSiteList: Site[] = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `Site ${i + 1}`,
        site_type: i % 2 === 0 ? 'solar' : 'wind',
        latitude: 40 + (i * 0.01),
        longitude: -74 + (i * 0.01),
        capacity_mw: 50 + (i * 5),
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      }));

      const startTime = performance.now();
      
      render(
        <MapView
          sites={largeSiteList}
          enableClickToAdd={false}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (less than 1 second)
      expect(renderTime).toBeLessThan(1000);

      // Verify all sites are rendered
      const markers = screen.getAllByTestId('marker');
      expect(markers).toHaveLength(100);
    });

    it('handles empty states correctly', () => {
      render(
        <MapView
          sites={[]}
          enableClickToAdd={true}
        />
      );

      expect(screen.getByTestId('map-container')).toBeInTheDocument();
      expect(screen.queryByTestId('marker')).not.toBeInTheDocument();
    });

    it('handles missing optional props gracefully', () => {
      expect(() => 
        render(
          <MapView
            sites={mockSites}
          />
        )
      ).not.toThrow();
    });
  });
});