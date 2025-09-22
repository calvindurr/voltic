import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ForecastDashboard } from './ForecastDashboard';
import { Portfolio, ForecastResults, ForecastJob } from '../../types';

// Mock axios first
jest.mock('axios', () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };

  return {
    default: {
      create: jest.fn(() => mockAxiosInstance),
    },
  };
});

// Mock the services
jest.mock('../../services/portfolioService', () => ({
  portfolioService: {
    getPortfolios: jest.fn(),
  },
}));

jest.mock('../../services/forecastService', () => ({
  forecastService: {
    getPortfolioForecastResults: jest.fn(),
    triggerPortfolioForecast: jest.fn(),
    getForecastJobStatus: jest.fn(),
  },
}));

import { portfolioService } from '../../services/portfolioService';
import { forecastService } from '../../services/forecastService';

// Mock the child components
jest.mock('./ForecastChart', () => ({
  ForecastChart: ({ title, data }: any) => (
    <div data-testid="forecast-chart">
      <div data-testid="chart-title">{title}</div>
      <div data-testid="chart-data-length">{data.length}</div>
    </div>
  ),
}));

jest.mock('./ForecastTrigger', () => ({
  ForecastTrigger: ({ portfolio, onTrigger, disabled }: any) => (
    <div data-testid="forecast-trigger">
      <button
        onClick={() => onTrigger(portfolio.id)}
        disabled={disabled}
        data-testid="trigger-button"
      >
        Trigger Forecast
      </button>
      <span data-testid="portfolio-name">{portfolio.name}</span>
    </div>
  ),
}));

jest.mock('./JobStatusIndicator', () => ({
  JobStatusIndicator: ({ job }: any) => (
    <div data-testid="job-status">
      <span data-testid="job-id">{job.id}</span>
      <span data-testid="job-status-text">{job.status}</span>
    </div>
  ),
}));

const mockPortfolioService = portfolioService as jest.Mocked<typeof portfolioService>;
const mockForecastService = forecastService as jest.Mocked<typeof forecastService>;

describe('ForecastDashboard', () => {
  const mockPortfolios: Portfolio[] = [
    {
      id: 1,
      name: 'Solar Portfolio',
      description: 'Solar sites portfolio',
      sites: [
        {
          id: 1,
          name: 'Solar Site 1',
          site_type: 'solar',
          latitude: 40.7128,
          longitude: -74.0060,
          capacity_mw: 50,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      name: 'Wind Portfolio',
      description: 'Wind sites portfolio',
      sites: [
        {
          id: 2,
          name: 'Wind Site 1',
          site_type: 'wind',
          latitude: 41.8781,
          longitude: -87.6298,
          capacity_mw: 75,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];

  const mockForecastResults: ForecastResults = {
    job: {
      id: 'job-123',
      portfolio: 1,
      status: 'completed',
      created_at: '2024-01-01T12:00:00Z',
      completed_at: '2024-01-01T12:05:00Z',
    },
    results: [
      {
        id: 1,
        job: 'job-123',
        site: 1,
        forecast_datetime: '2024-01-01T13:00:00Z',
        predicted_generation_mwh: 10.5,
        created_at: '2024-01-01T12:05:00Z',
      },
      {
        id: 2,
        job: 'job-123',
        site: 1,
        forecast_datetime: '2024-01-01T14:00:00Z',
        predicted_generation_mwh: 12.3,
        created_at: '2024-01-01T12:05:00Z',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPortfolioService.getPortfolios.mockResolvedValue(mockPortfolios);
    mockForecastService.getPortfolioForecastResults.mockResolvedValue(mockForecastResults);
  });

  it('renders dashboard with portfolios', async () => {
    render(<ForecastDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Forecast Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Select Portfolio:')).toBeInTheDocument();
    });

    expect(mockPortfolioService.getPortfolios).toHaveBeenCalled();
  });

  it('displays portfolio selector with options', async () => {
    render(<ForecastDashboard />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Solar Portfolio (1 sites)')).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    
    // Check that options are present
    fireEvent.click(select);
    expect(screen.getByText('Wind Portfolio (1 sites)')).toBeInTheDocument();
  });

  it('loads forecast results for selected portfolio', async () => {
    render(<ForecastDashboard />);

    await waitFor(() => {
      expect(mockForecastService.getPortfolioForecastResults).toHaveBeenCalledWith(1);
    });
  });

  it('displays forecast charts when results are available', async () => {
    render(<ForecastDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Portfolio Aggregate Forecast')).toBeInTheDocument();
      expect(screen.getByText('Individual Site Forecasts')).toBeInTheDocument();
    });

    // Check that charts are rendered
    const charts = screen.getAllByTestId('forecast-chart');
    expect(charts).toHaveLength(2); // Portfolio aggregate + 1 site
  });

  it('handles portfolio selection change', async () => {
    render(<ForecastDashboard />);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '2' } });

    await waitFor(() => {
      expect(mockForecastService.getPortfolioForecastResults).toHaveBeenCalledWith(2);
    });
  });

  it('displays no portfolios message when none available', async () => {
    mockPortfolioService.getPortfolios.mockResolvedValue([]);

    render(<ForecastDashboard />);

    await waitFor(() => {
      expect(screen.getByText('No Portfolios Available')).toBeInTheDocument();
      expect(screen.getByText('Create a portfolio with sites to generate forecasts.')).toBeInTheDocument();
    });
  });

  it('displays no forecast data message when no results', async () => {
    mockForecastService.getPortfolioForecastResults.mockRejectedValue({
      response: { status: 404 }
    });

    render(<ForecastDashboard />);

    await waitFor(() => {
      expect(screen.getByText('No Forecast Data Available')).toBeInTheDocument();
      expect(screen.getByText('Trigger a forecast to generate predictions for this portfolio.')).toBeInTheDocument();
    });
  });

  it('handles forecast trigger', async () => {
    const mockJob: ForecastJob = {
      id: 'new-job-456',
      portfolio: 1,
      status: 'pending',
      created_at: '2024-01-01T13:00:00Z',
    };

    mockForecastService.triggerPortfolioForecast.mockResolvedValue(mockJob);
    mockForecastService.getForecastJobStatus.mockResolvedValue({
      ...mockJob,
      status: 'completed',
      completed_at: '2024-01-01T13:05:00Z',
    });

    render(<ForecastDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('trigger-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('trigger-button'));

    await waitFor(() => {
      expect(mockForecastService.triggerPortfolioForecast).toHaveBeenCalledWith(1);
    });
  });

  it('displays job status indicator when job is active', async () => {
    const mockJob: ForecastJob = {
      id: 'active-job-789',
      portfolio: 1,
      status: 'running',
      created_at: '2024-01-01T13:00:00Z',
    };

    mockForecastService.triggerPortfolioForecast.mockResolvedValue(mockJob);

    render(<ForecastDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('trigger-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('trigger-button'));

    await waitFor(() => {
      expect(screen.getByTestId('job-status')).toBeInTheDocument();
      expect(screen.getByTestId('job-id')).toHaveTextContent('active-job-789');
      expect(screen.getByTestId('job-status-text')).toHaveTextContent('running');
    });
  });

  it('handles forecast trigger errors', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    mockForecastService.triggerPortfolioForecast.mockRejectedValue({
      response: {
        data: {
          error: {
            message: 'Portfolio not found'
          }
        }
      }
    });

    render(<ForecastDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('trigger-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('trigger-button'));

    await waitFor(() => {
      expect(screen.getByText('Portfolio not found')).toBeInTheDocument();
    });

    consoleError.mockRestore();
  });

  it('handles portfolio loading errors', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    mockPortfolioService.getPortfolios.mockRejectedValue(new Error('Network error'));

    render(<ForecastDashboard />);

    await waitFor(() => {
      // The error message should be displayed
      expect(screen.getByText('Failed to load portfolios')).toBeInTheDocument();
    });

    // Should also show no portfolios message since portfolios array is empty
    expect(screen.getByText('No Portfolios Available')).toBeInTheDocument();

    consoleError.mockRestore();
  });

  it('handles forecast results loading errors', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    mockForecastService.getPortfolioForecastResults.mockRejectedValue(new Error('Network error'));

    render(<ForecastDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load forecast results')).toBeInTheDocument();
    });

    consoleError.mockRestore();
  });

  it('uses selectedPortfolioId prop when provided', async () => {
    render(<ForecastDashboard selectedPortfolioId={2} />);

    await waitFor(() => {
      expect(mockForecastService.getPortfolioForecastResults).toHaveBeenCalledWith(2);
    });
  });

  it('shows loading indicator while loading results', async () => {
    let resolvePromise: (value: ForecastResults) => void;
    const promise = new Promise<ForecastResults>((resolve) => {
      resolvePromise = resolve;
    });
    mockForecastService.getPortfolioForecastResults.mockReturnValue(promise);

    render(<ForecastDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Loading forecast results...')).toBeInTheDocument();
    });

    resolvePromise!(mockForecastResults);

    await waitFor(() => {
      expect(screen.queryByText('Loading forecast results...')).not.toBeInTheDocument();
    });
  });
});