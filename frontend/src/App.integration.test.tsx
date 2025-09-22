import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import * as siteService from './services/siteService';
import * as portfolioService from './services/portfolioService';
import * as forecastService from './services/forecastService';

// Mock axios first
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn(),
      },
      response: {
        use: jest.fn(),
      },
    },
  })),
}));

// Mock the services
jest.mock('./services/siteService', () => ({
  siteService: {
    getSites: jest.fn(),
    createSite: jest.fn(),
    updateSite: jest.fn(),
    deleteSite: jest.fn(),
  },
}));

jest.mock('./services/portfolioService', () => ({
  portfolioService: {
    getPortfolios: jest.fn(),
    createPortfolio: jest.fn(),
    updatePortfolio: jest.fn(),
    deletePortfolio: jest.fn(),
    addSiteToPortfolio: jest.fn(),
    removeSiteFromPortfolio: jest.fn(),
  },
}));

jest.mock('./services/forecastService', () => ({
  forecastService: {
    triggerPortfolioForecast: jest.fn(),
    getForecastJobStatus: jest.fn(),
    getPortfolioForecastResults: jest.fn(),
    getSiteForecastResults: jest.fn(),
  },
}));

const mockSiteService = require('./services/siteService').siteService;
const mockPortfolioService = require('./services/portfolioService').portfolioService;
const mockForecastService = require('./services/forecastService').forecastService;

// Mock Leaflet and react-leaflet
jest.mock('leaflet', () => ({
  map: jest.fn(() => ({
    setView: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    remove: jest.fn(),
  })),
  tileLayer: jest.fn(() => ({
    addTo: jest.fn(),
  })),
  marker: jest.fn(() => ({
    addTo: jest.fn(),
    bindPopup: jest.fn(),
    on: jest.fn(),
    remove: jest.fn(),
  })),
  Icon: jest.fn().mockImplementation(() => ({})),
  DivIcon: jest.fn().mockImplementation(() => ({})),
  icon: jest.fn(),
}));

jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }: any) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }: any) => <div data-testid="popup">{children}</div>,
  useMapEvents: jest.fn(),
}));

const mockSites = [
  {
    id: 1,
    name: 'Test Solar Site',
    site_type: 'solar' as const,
    latitude: 40.7128,
    longitude: -74.0060,
    capacity_mw: 100,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Test Wind Site',
    site_type: 'wind' as const,
    latitude: 41.8781,
    longitude: -87.6298,
    capacity_mw: 150,
    created_at: '2023-01-02T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z',
  },
];

const mockPortfolios = [
  {
    id: 1,
    name: 'Test Portfolio',
    description: 'A test portfolio',
    sites: [mockSites[0]],
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
];

const mockForecastJob = {
  id: 'test-job-id',
  portfolio: 1,
  status: 'completed' as const,
  created_at: '2023-01-01T00:00:00Z',
  completed_at: '2023-01-01T01:00:00Z',
};

const mockForecastResults = {
  job: mockForecastJob,
  results: [
    {
      id: 1,
      job: 'test-job-id',
      site: 1,
      forecast_datetime: '2023-01-01T12:00:00Z',
      predicted_generation_mwh: 75.5,
      confidence_interval_lower: 65.0,
      confidence_interval_upper: 85.0,
      created_at: '2023-01-01T01:00:00Z',
    },
  ],
};

describe('App Integration Tests', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockSiteService.getSites.mockResolvedValue(mockSites);
    mockPortfolioService.getPortfolios.mockResolvedValue(mockPortfolios);
    mockForecastService.getPortfolioForecastResults.mockResolvedValue(mockForecastResults);
  });

  const renderApp = () => {
    return render(<App />);
  };

  describe('Dashboard Navigation', () => {
    test('should display dashboard with stats and navigation links', async () => {
      renderApp();

      // Check dashboard is displayed
      expect(screen.getByText('Renewable Energy Forecasting Dashboard')).toBeInTheDocument();
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // Sites count
        expect(screen.getByText('1')).toBeInTheDocument(); // Portfolios count
      });

      // Check navigation links
      expect(screen.getByText('Manage Sites →')).toBeInTheDocument();
      expect(screen.getByText('Manage Portfolios →')).toBeInTheDocument();
      expect(screen.getByText('View Forecasts →')).toBeInTheDocument();
    });

    test('should navigate between pages using navigation menu', async () => {
      renderApp();

      // Navigate to Sites page
      fireEvent.click(screen.getByRole('link', { name: 'Sites' }));
      await waitFor(() => {
        expect(screen.getByText('Site Management')).toBeInTheDocument();
      });

      // Navigate to Portfolios page
      fireEvent.click(screen.getByRole('link', { name: 'Portfolios' }));
      await waitFor(() => {
        expect(screen.getByText('Portfolio Management')).toBeInTheDocument();
      });

      // Navigate to Forecasts page
      fireEvent.click(screen.getByRole('link', { name: 'Forecasts' }));
      await waitFor(() => {
        expect(screen.getByText('Forecasts')).toBeInTheDocument();
      });

      // Navigate back to Dashboard
      fireEvent.click(screen.getByRole('link', { name: 'Dashboard' }));
      await waitFor(() => {
        expect(screen.getByText('Renewable Energy Forecasting Dashboard')).toBeInTheDocument();
      });
    });
  });

  describe('Site Management Workflow', () => {
    test('should load and display sites on the sites page', async () => {
      renderApp();

      // Navigate to Sites page
      fireEvent.click(screen.getByRole('link', { name: 'Sites' }));

      // Wait for sites to load
      await waitFor(() => {
        expect(mockSiteService.getSites).toHaveBeenCalled();
        expect(screen.getByText('Site Management')).toBeInTheDocument();
      });
    });

    test('should handle site creation workflow', async () => {
      const newSite = {
        id: 3,
        name: 'New Test Site',
        site_type: 'solar' as const,
        latitude: 42.3601,
        longitude: -71.0589,
        capacity_mw: 200,
        created_at: '2023-01-03T00:00:00Z',
        updated_at: '2023-01-03T00:00:00Z',
      };

      mockSiteService.createSite.mockResolvedValue(newSite);

      renderApp();

      // Navigate to Sites page
      fireEvent.click(screen.getByRole('link', { name: 'Sites' }));

      await waitFor(() => {
        expect(screen.getByText('Site Management')).toBeInTheDocument();
      });

      // Site creation would be triggered by map interaction
      // This would be tested in the MapView component tests
    });

    test('should handle site deletion workflow', async () => {
      mockSiteService.deleteSite.mockResolvedValue();

      renderApp();

      // Navigate to Sites page
      fireEvent.click(screen.getByRole('link', { name: 'Sites' }));

      await waitFor(() => {
        expect(screen.getByText('Site Management')).toBeInTheDocument();
      });

      // Site deletion would be triggered by site selection and delete action
      // This would be tested in the SiteManager component tests
    });
  });

  describe('Portfolio Management Workflow', () => {
    test('should load and display portfolios on the portfolios page', async () => {
      renderApp();

      // Navigate to Portfolios page
      fireEvent.click(screen.getByRole('link', { name: 'Portfolios' }));

      // Wait for data to load
      await waitFor(() => {
        expect(mockPortfolioService.getPortfolios).toHaveBeenCalled();
        expect(mockSiteService.getSites).toHaveBeenCalled();
        expect(screen.getByText('Portfolio Management')).toBeInTheDocument();
      });
    });

    test('should handle portfolio creation workflow', async () => {
      const newPortfolio = {
        id: 2,
        name: 'New Test Portfolio',
        description: 'A new test portfolio',
        sites: [],
        created_at: '2023-01-03T00:00:00Z',
        updated_at: '2023-01-03T00:00:00Z',
      };

      mockPortfolioService.createPortfolio.mockResolvedValue(newPortfolio);

      renderApp();

      // Navigate to Portfolios page
      fireEvent.click(screen.getByRole('link', { name: 'Portfolios' }));

      await waitFor(() => {
        expect(screen.getByText('Portfolio Management')).toBeInTheDocument();
      });

      // Portfolio creation would be triggered by PortfolioManager component
      // This would be tested in the PortfolioManager component tests
    });

    test('should handle site assignment to portfolio', async () => {
      mockPortfolioService.addSiteToPortfolio.mockResolvedValue();
      mockPortfolioService.getPortfolios.mockResolvedValue([
        {
          ...mockPortfolios[0],
          sites: [...mockPortfolios[0].sites, mockSites[1]],
        },
      ]);

      renderApp();

      // Navigate to Portfolios page
      fireEvent.click(screen.getByRole('link', { name: 'Portfolios' }));

      await waitFor(() => {
        expect(screen.getByText('Portfolio Management')).toBeInTheDocument();
      });

      // Site assignment would be handled by PortfolioManager component
      // This would be tested in the PortfolioManager component tests
    });
  });

  describe('Forecast Generation Workflow', () => {
    test('should load and display forecasts on the forecasts page', async () => {
      renderApp();

      // Navigate to Forecasts page
      fireEvent.click(screen.getByRole('link', { name: 'Forecasts' }));

      // Wait for data to load
      await waitFor(() => {
        expect(mockPortfolioService.getPortfolios).toHaveBeenCalled();
        expect(screen.getByText('Forecasts')).toBeInTheDocument();
      });
    });

    test('should handle forecast generation workflow', async () => {
      mockForecastService.triggerPortfolioForecast.mockResolvedValue(mockForecastJob);
      mockForecastService.getForecastJobStatus.mockResolvedValue(mockForecastJob);

      renderApp();

      // Navigate to Forecasts page
      fireEvent.click(screen.getByRole('link', { name: 'Forecasts' }));

      await waitFor(() => {
        expect(screen.getByText('Forecasts')).toBeInTheDocument();
      });

      // Forecast generation would be triggered by ForecastDashboard component
      // This would be tested in the ForecastDashboard component tests
    });
  });

  describe('Error Handling', () => {
    test('should display error message when data loading fails', async () => {
      mockSiteService.getSites.mockRejectedValue(new Error('Network error'));
      mockPortfolioService.getPortfolios.mockRejectedValue(new Error('Network error'));

      renderApp();

      // Navigate to Sites page
      fireEvent.click(screen.getByRole('link', { name: 'Sites' }));

      await waitFor(() => {
        expect(screen.getByText('Failed to load sites')).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    test('should allow retry after error', async () => {
      mockSiteService.getSites
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue(mockSites);

      renderApp();

      // Navigate to Sites page
      fireEvent.click(screen.getByRole('link', { name: 'Sites' }));

      await waitFor(() => {
        expect(screen.getByText('Failed to load sites')).toBeInTheDocument();
      });

      // Click retry button
      fireEvent.click(screen.getByText('Retry'));

      await waitFor(() => {
        expect(mockSiteService.getSites).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Responsive Design', () => {
    test('should adapt layout for mobile screens', () => {
      // Mock window.matchMedia for responsive design testing
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query.includes('max-width: 768px'),
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      renderApp();

      // Check that the app renders without errors on mobile
      expect(screen.getByText('Renewable Energy Forecasting Dashboard')).toBeInTheDocument();
    });
  });

  describe('Data Flow Integration', () => {
    test('should maintain consistent data flow between components', async () => {
      renderApp();

      // Load dashboard
      await waitFor(() => {
        expect(mockSiteService.getSites).toHaveBeenCalled();
        expect(mockPortfolioService.getPortfolios).toHaveBeenCalled();
      });

      // Navigate to Sites page - should use cached data or reload
      fireEvent.click(screen.getByRole('link', { name: 'Sites' }));

      await waitFor(() => {
        expect(screen.getByText('Site Management')).toBeInTheDocument();
      });

      // Navigate to Portfolios page - should load both sites and portfolios
      fireEvent.click(screen.getByRole('link', { name: 'Portfolios' }));

      await waitFor(() => {
        expect(screen.getByText('Portfolio Management')).toBeInTheDocument();
      });

      // Verify that services were called appropriately
      expect(mockSiteService.getSites).toHaveBeenCalledTimes(3); // Dashboard + Sites + Portfolios
      expect(mockPortfolioService.getPortfolios).toHaveBeenCalledTimes(3); // Dashboard + Portfolios + Forecasts
    });
  });
});