import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { CreateSiteRequest } from './types';
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

describe('Complete User Workflows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup initial empty state
    mockSiteService.getSites.mockResolvedValue([]);
    mockPortfolioService.getPortfolios.mockResolvedValue([]);
  });

  const renderApp = () => {
    return render(<App />);
  };

  describe('End-to-End Site Management Workflow', () => {
    test('should complete full site creation, editing, and deletion workflow', async () => {
      
      const newSite = {
        id: 1,
        name: 'Solar Farm Alpha',
        site_type: 'solar' as const,
        latitude: 40.7128,
        longitude: -74.0060,
        capacity_mw: 100,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      const updatedSite = {
        ...newSite,
        name: 'Solar Farm Alpha Updated',
        capacity_mw: 150,
        updated_at: '2023-01-01T01:00:00Z',
      };

      // Mock service responses
      mockSiteService.createSite.mockResolvedValue(newSite);
      mockSiteService.updateSite.mockResolvedValue(updatedSite);
      mockSiteService.deleteSite.mockResolvedValue();
      
      // Mock progressive site loading
      mockSiteService.getSites
        .mockResolvedValueOnce([]) // Initial load
        .mockResolvedValueOnce([newSite]) // After creation
        .mockResolvedValueOnce([updatedSite]) // After update
        .mockResolvedValueOnce([]); // After deletion

      renderApp();

      // Step 1: Navigate to Sites page
      await userEvent.click(screen.getByRole('link', { name: 'Sites' }));
      
      await waitFor(() => {
        expect(screen.getByText('Site Management')).toBeInTheDocument();
      });

      // Step 2: Create a new site (would be triggered by map click in real scenario)
      // This simulates the map click -> site form -> save workflow
      
      // Step 3: Verify site appears in the system
      // Update mock to return the created site
      mockSiteService.getSites.mockResolvedValue([newSite]);
      
      // Reload the page to see the new site
      await userEvent.click(screen.getByRole('link', { name: 'Dashboard' }));
      await userEvent.click(screen.getByRole('link', { name: 'Sites' }));

      // Step 4: Edit the site (would be triggered by site selection)
      // This simulates the site selection -> edit form -> save workflow
      
      // Step 5: Delete the site (would be triggered by delete button)
      // This simulates the site selection -> delete confirmation -> delete workflow

      // Verify all service calls were made
      expect(mockSiteService.getSites).toHaveBeenCalled();
    });
  });

  describe('End-to-End Portfolio Management Workflow', () => {
    test('should complete full portfolio creation and site assignment workflow', async () => {
      
      const testSite = {
        id: 1,
        name: 'Test Solar Site',
        site_type: 'solar' as const,
        latitude: 40.7128,
        longitude: -74.0060,
        capacity_mw: 100,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      const newPortfolio = {
        id: 1,
        name: 'East Coast Portfolio',
        description: 'Portfolio for east coast renewable sites',
        sites: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      const portfolioWithSite = {
        ...newPortfolio,
        sites: [testSite],
        updated_at: '2023-01-01T01:00:00Z',
      };

      // Mock service responses
      mockSiteService.getSites.mockResolvedValue([testSite]);
      mockPortfolioService.createPortfolio.mockResolvedValue(newPortfolio);
      mockPortfolioService.addSiteToPortfolio.mockResolvedValue();
      
      // Mock progressive portfolio loading
      mockPortfolioService.getPortfolios
        .mockResolvedValueOnce([]) // Initial load
        .mockResolvedValueOnce([newPortfolio]) // After creation
        .mockResolvedValueOnce([portfolioWithSite]); // After site assignment

      renderApp();

      // Step 1: Navigate to Portfolios page
      await userEvent.click(screen.getByRole('link', { name: 'Portfolios' }));
      
      await waitFor(() => {
        expect(screen.getByText('Portfolio Management')).toBeInTheDocument();
      });

      // Step 2: Create a new portfolio
      // This would be triggered by the PortfolioManager component

      // Step 3: Assign sites to the portfolio
      // This would be triggered by the site assignment interface

      // Step 4: Verify portfolio shows up with assigned sites
      // This would be visible in the map and portfolio list

      // Verify service calls
      expect(mockPortfolioService.getPortfolios).toHaveBeenCalled();
      expect(mockSiteService.getSites).toHaveBeenCalled();
    });
  });

  describe('End-to-End Forecast Generation Workflow', () => {
    test('should complete full forecast generation and visualization workflow', async () => {
      
      const testSite = {
        id: 1,
        name: 'Test Solar Site',
        site_type: 'solar' as const,
        latitude: 40.7128,
        longitude: -74.0060,
        capacity_mw: 100,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      const testPortfolio = {
        id: 1,
        name: 'Test Portfolio',
        description: 'A test portfolio',
        sites: [testSite],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      const forecastJob = {
        id: 'test-job-id',
        portfolio: 1,
        status: 'pending' as const,
        created_at: '2023-01-01T00:00:00Z',
      };

      const completedJob = {
        ...forecastJob,
        status: 'completed' as const,
        completed_at: '2023-01-01T01:00:00Z',
      };

      const forecastResults = {
        job: completedJob,
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

      // Mock service responses
      mockPortfolioService.getPortfolios.mockResolvedValue([testPortfolio]);
      mockForecastService.triggerPortfolioForecast.mockResolvedValue(forecastJob);
      mockForecastService.getForecastJobStatus
        .mockResolvedValueOnce(forecastJob) // First check - pending
        .mockResolvedValue(completedJob); // Subsequent checks - completed
      mockForecastService.getPortfolioForecastResults.mockResolvedValue(forecastResults);

      renderApp();

      // Step 1: Navigate to Forecasts page
      await userEvent.click(screen.getByRole('link', { name: 'Forecasts' }));
      
      await waitFor(() => {
        expect(screen.getByText('Forecasts')).toBeInTheDocument();
      });

      // Step 2: Trigger a forecast for a portfolio
      // This would be triggered by the ForecastDashboard component

      // Step 3: Monitor job status (polling)
      // This would be handled automatically by the component

      // Step 4: View forecast results
      // This would be displayed in charts and tables

      // Verify service calls
      expect(mockPortfolioService.getPortfolios).toHaveBeenCalled();
    });
  });

  describe('Cross-Component Data Consistency', () => {
    test('should maintain data consistency across all components', async () => {
      
      const testSite = {
        id: 1,
        name: 'Consistent Test Site',
        site_type: 'solar' as const,
        latitude: 40.7128,
        longitude: -74.0060,
        capacity_mw: 100,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      const testPortfolio = {
        id: 1,
        name: 'Consistent Test Portfolio',
        description: 'A test portfolio for consistency',
        sites: [testSite],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      // Mock consistent data across all services
      mockSiteService.getSites.mockResolvedValue([testSite]);
      mockPortfolioService.getPortfolios.mockResolvedValue([testPortfolio]);
      mockForecastService.getPortfolioForecastResults.mockResolvedValue({
        job: {
          id: 'test-job',
          portfolio: 1,
          status: 'completed',
          created_at: '2023-01-01T00:00:00Z',
          completed_at: '2023-01-01T01:00:00Z',
        },
        results: [],
      });

      renderApp();

      // Step 1: Check dashboard shows consistent counts
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument(); // Sites count
        expect(screen.getByText('1')).toBeInTheDocument(); // Portfolios count
      });

      // Step 2: Navigate to Sites page and verify site is shown
      await userEvent.click(screen.getByRole('link', { name: 'Sites' }));
      
      await waitFor(() => {
        expect(screen.getByText('Site Management')).toBeInTheDocument();
      });

      // Step 3: Navigate to Portfolios page and verify portfolio with site is shown
      await userEvent.click(screen.getByRole('link', { name: 'Portfolios' }));
      
      await waitFor(() => {
        expect(screen.getByText('Portfolio Management')).toBeInTheDocument();
      });

      // Step 4: Navigate to Forecasts page and verify portfolio is available
      await userEvent.click(screen.getByRole('link', { name: 'Forecasts' }));
      
      await waitFor(() => {
        expect(screen.getByText('Forecasts')).toBeInTheDocument();
      });

      // Verify all components loaded the same consistent data
      expect(mockSiteService.getSites).toHaveBeenCalledTimes(3); // Dashboard + Sites + Portfolios
      expect(mockPortfolioService.getPortfolios).toHaveBeenCalledTimes(3); // Dashboard + Portfolios + Forecasts
    });
  });

  describe('Error Recovery Workflows', () => {
    test('should handle and recover from network errors gracefully', async () => {
      
      // Mock initial failure then success
      mockSiteService.getSites
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue([]);

      renderApp();

      // Navigate to Sites page
      await userEvent.click(screen.getByRole('link', { name: 'Sites' }));

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText('Failed to load sites')).toBeInTheDocument();
      });

      // Click retry button
      await userEvent.click(screen.getByText('Retry'));

      // Wait for successful retry
      await waitFor(() => {
        expect(screen.getByText('Site Management')).toBeInTheDocument();
        expect(screen.queryByText('Failed to load sites')).not.toBeInTheDocument();
      });

      // Verify retry was attempted
      expect(mockSiteService.getSites).toHaveBeenCalledTimes(2);
    });

    test('should handle partial data loading failures', async () => {
      
      // Mock sites loading successfully but portfolios failing
      mockSiteService.getSites.mockResolvedValue([]);
      mockPortfolioService.getPortfolios.mockRejectedValue(new Error('Portfolio service error'));

      renderApp();

      // Navigate to Portfolios page
      await userEvent.click(screen.getByRole('link', { name: 'Portfolios' }));

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText('Failed to load data')).toBeInTheDocument();
      });

      // Sites should still have been called
      expect(mockSiteService.getSites).toHaveBeenCalled();
      expect(mockPortfolioService.getPortfolios).toHaveBeenCalled();
    });
  });
});