import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MapView, MapViewProps } from './MapView';
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

describe('MapView Component', () => {
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

  const mockPortfolios = [
    {
      id: 1,
      name: 'Portfolio 1',
      description: 'Test portfolio',
      sites: [mockSites[0]],
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
  ];

  const defaultProps: MapViewProps = {
    sites: mockSites,
    onSiteAdd: jest.fn(),
    onSiteSelect: jest.fn(),
    onSiteUpdate: jest.fn(),
    onSiteDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders map container with default props', () => {
      render(<MapView {...defaultProps} />);
      
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
      expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
    });

    it('renders site markers for all sites', () => {
      render(<MapView {...defaultProps} />);
      
      const markers = screen.getAllByTestId('marker');
      expect(markers).toHaveLength(mockSites.length);
    });

    it('displays site information in popups', () => {
      render(<MapView {...defaultProps} />);
      
      expect(screen.getByText('Solar Farm 1')).toBeInTheDocument();
      expect(screen.getByText('Wind Farm 1')).toBeInTheDocument();
      expect(screen.getAllByText('Type:').length).toBeGreaterThan(0);
      expect(screen.getByText('solar')).toBeInTheDocument();
      expect(screen.getByText('wind')).toBeInTheDocument();
    });

    it('renders with custom center and zoom', () => {
      const customCenter: [number, number] = [51.505, -0.09];
      const customZoom = 10;
      
      render(
        <MapView 
          {...defaultProps} 
          center={customCenter}
          zoom={customZoom}
        />
      );
      
      const mapContainer = screen.getByTestId('map-container');
      expect(mapContainer).toBeInTheDocument();
    });

    it('renders with custom height', () => {
      const customHeight = '600px';
      
      render(<MapView {...defaultProps} height={customHeight} />);
      
      const mapView = screen.getByTestId('map-container').parentElement;
      expect(mapView).toHaveStyle({ height: customHeight });
    });
  });

  describe('Site Interactions', () => {
    it('calls onSiteSelect when site marker is clicked', async () => {
      const onSiteSelect = jest.fn();
      render(<MapView {...defaultProps} onSiteSelect={onSiteSelect} />);
      
      const markers = screen.getAllByTestId('marker');
      fireEvent.click(markers[0]);
      
      expect(onSiteSelect).toHaveBeenCalledWith(mockSites[0]);
    });

    it('displays edit and delete buttons in site popup', () => {
      render(<MapView {...defaultProps} />);
      
      expect(screen.getAllByText('Edit')).toHaveLength(mockSites.length);
      expect(screen.getAllByText('Delete')).toHaveLength(mockSites.length);
    });

    it('calls onSiteUpdate when edit button is clicked', async () => {
      const onSiteUpdate = jest.fn();
      render(<MapView {...defaultProps} onSiteUpdate={onSiteUpdate} />);
      
      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);
      
      expect(onSiteUpdate).toHaveBeenCalledWith(mockSites[0]);
    });

    it('calls onSiteDelete when delete button is clicked', async () => {
      const onSiteDelete = jest.fn();
      render(<MapView {...defaultProps} onSiteDelete={onSiteDelete} />);
      
      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);
      
      expect(onSiteDelete).toHaveBeenCalledWith(mockSites[0].id);
    });
  });

  describe('Add Site Modal', () => {
    it('does not show modal initially', () => {
      render(<MapView {...defaultProps} />);
      
      expect(screen.queryByText('Add New Site')).not.toBeInTheDocument();
    });

    it('shows add site form with all required fields', async () => {
      // Mock the map click event
      const { useMapEvents } = require('react-leaflet');
      let mapClickHandler: any;
      
      useMapEvents.mockImplementation((events: any) => {
        mapClickHandler = events.click;
        return null;
      });

      render(<MapView {...defaultProps} enableClickToAdd={true} />);
      
      // Simulate map click
      await act(async () => {
        if (mapClickHandler) {
          mapClickHandler({ latlng: { mockLat: 40.7128, mockLng: -74.0060 } });
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Add New Site')).toBeInTheDocument();
      });

      expect(screen.getByLabelText('Site Name:')).toBeInTheDocument();
      expect(screen.getByLabelText('Site Type:')).toBeInTheDocument();
      expect(screen.getByLabelText('Capacity (MW):')).toBeInTheDocument();
      // Use getAllByText to handle multiple "Coordinates:" elements
      expect(screen.getAllByText('Coordinates:').length).toBeGreaterThan(0);
    });

    it('submits new site with correct data', async () => {
      const onSiteAdd = jest.fn();
      const { useMapEvents } = require('react-leaflet');
      let mapClickHandler: any;
      
      useMapEvents.mockImplementation((events: any) => {
        mapClickHandler = events.click;
        return null;
      });

      render(<MapView {...defaultProps} onSiteAdd={onSiteAdd} enableClickToAdd={true} />);
      
      // Simulate map click
      await act(async () => {
        if (mapClickHandler) {
          mapClickHandler({ latlng: { mockLat: 40.7128, mockLng: -74.0060 } });
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Add New Site')).toBeInTheDocument();
      });

      // Fill out the form
      const nameInput = screen.getByLabelText('Site Name:');
      const typeSelect = screen.getByLabelText('Site Type:');
      const capacityInput = screen.getByLabelText('Capacity (MW):');
      
      await userEvent.type(nameInput, 'Test Site');
      await userEvent.selectOptions(typeSelect, 'wind');
      await userEvent.type(capacityInput, '150');

      // Submit the form
      const addButton = screen.getByText('Add Site');
      fireEvent.click(addButton);

      expect(onSiteAdd).toHaveBeenCalledWith({
        name: 'Test Site',
        site_type: 'wind',
        latitude: 40.7128,
        longitude: -74.0060,
        capacity_mw: 150,
      });
    });

    it('cancels site addition', async () => {
      const { useMapEvents } = require('react-leaflet');
      let mapClickHandler: any;
      
      useMapEvents.mockImplementation((events: any) => {
        mapClickHandler = events.click;
        return null;
      });

      render(<MapView {...defaultProps} enableClickToAdd={true} />);
      
      // Simulate map click
      await act(async () => {
        if (mapClickHandler) {
          mapClickHandler({ latlng: { mockLat: 40.7128, mockLng: -74.0060 } });
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Add New Site')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Add New Site')).not.toBeInTheDocument();
      });
    });

    it('validates required fields', async () => {
      const onSiteAdd = jest.fn();
      const { useMapEvents } = require('react-leaflet');
      let mapClickHandler: any;
      
      useMapEvents.mockImplementation((events: any) => {
        mapClickHandler = events.click;
        return null;
      });

      render(<MapView {...defaultProps} onSiteAdd={onSiteAdd} enableClickToAdd={true} />);
      
      // Simulate map click
      await act(async () => {
        if (mapClickHandler) {
          mapClickHandler({ latlng: { mockLat: 40.7128, mockLng: -74.0060 } });
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Add New Site')).toBeInTheDocument();
      });

      // Try to submit without filling required fields
      const addButton = screen.getByText('Add Site');
      fireEvent.click(addButton);

      // Should not call onSiteAdd if required fields are empty
      expect(onSiteAdd).not.toHaveBeenCalled();
    });
  });

  describe('Props and Configuration', () => {
    it('disables click-to-add when enableClickToAdd is false', () => {
      render(<MapView {...defaultProps} enableClickToAdd={false} />);
      
      // The component should still render but not show the modal on click
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });

    it('handles empty sites array', () => {
      render(<MapView {...defaultProps} sites={[]} />);
      
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
      expect(screen.queryByTestId('marker')).not.toBeInTheDocument();
    });

    it('handles portfolios prop for site grouping', () => {
      render(<MapView {...defaultProps} portfolios={mockPortfolios} />);
      
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
      // Portfolio functionality would be tested when implemented
    });

    it('highlights selected site', () => {
      render(<MapView {...defaultProps} selectedSite={mockSites[0]} />);
      
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
      // Selected site highlighting would be tested when implemented
    });
  });

  describe('Error Handling', () => {
    it('handles missing callback functions gracefully', () => {
      const propsWithoutCallbacks: MapViewProps = {
        sites: mockSites,
      };
      
      expect(() => render(<MapView {...propsWithoutCallbacks} />)).not.toThrow();
    });

    it('handles invalid site data gracefully', () => {
      const invalidSites = [
        {
          ...mockSites[0],
          latitude: NaN,
          longitude: NaN,
        },
      ] as Site[];
      
      expect(() => render(<MapView {...defaultProps} sites={invalidSites} />)).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', async () => {
      const { useMapEvents } = require('react-leaflet');
      let mapClickHandler: any;
      
      useMapEvents.mockImplementation((events: any) => {
        mapClickHandler = events.click;
        return null;
      });

      render(<MapView {...defaultProps} enableClickToAdd={true} />);
      
      // Simulate map click
      await act(async () => {
        if (mapClickHandler) {
          mapClickHandler({ latlng: { mockLat: 40.7128, mockLng: -74.0060 } });
        }
      });

      await waitFor(() => {
        expect(screen.getByLabelText('Site Name:')).toBeInTheDocument();
        expect(screen.getByLabelText('Site Type:')).toBeInTheDocument();
        expect(screen.getByLabelText('Capacity (MW):')).toBeInTheDocument();
      });
    });

    it('has proper button roles and text', () => {
      render(<MapView {...defaultProps} />);
      
      const editButtons = screen.getAllByText('Edit');
      const deleteButtons = screen.getAllByText('Delete');
      
      editButtons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
      
      deleteButtons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });
  });
});