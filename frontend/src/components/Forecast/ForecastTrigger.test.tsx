import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ForecastTrigger } from './ForecastTrigger';
import { Portfolio } from '../../types';

// Mock window.alert
const mockAlert = jest.fn();
global.alert = mockAlert;

describe('ForecastTrigger', () => {
  const mockPortfolioWithSites: Portfolio = {
    id: 1,
    name: 'Test Portfolio',
    description: 'A test portfolio with sites',
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
  };

  const mockPortfolioEmpty: Portfolio = {
    id: 2,
    name: 'Empty Portfolio',
    description: 'A portfolio with no sites',
    sites: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockOnTrigger = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders portfolio information correctly', () => {
    render(
      <ForecastTrigger
        portfolio={mockPortfolioWithSites}
        onTrigger={mockOnTrigger}
      />
    );

    expect(screen.getByText('Generate New Forecast')).toBeInTheDocument();
    expect(screen.getByText('Test Portfolio')).toBeInTheDocument();
    expect(screen.getByText(/2 sites/)).toBeInTheDocument();
    expect(screen.getByText('A test portfolio with sites')).toBeInTheDocument();
  });

  it('displays site list correctly', () => {
    render(
      <ForecastTrigger
        portfolio={mockPortfolioWithSites}
        onTrigger={mockOnTrigger}
      />
    );

    expect(screen.getByText('Sites in Portfolio:')).toBeInTheDocument();
    expect(screen.getByText('Solar Site 1')).toBeInTheDocument();
    expect(screen.getByText('Wind Site 1')).toBeInTheDocument();
    expect(screen.getByText('solar')).toBeInTheDocument();
    expect(screen.getByText('wind')).toBeInTheDocument();
    expect(screen.getByText('50 MW')).toBeInTheDocument();
    expect(screen.getByText('75 MW')).toBeInTheDocument();
  });

  it('enables trigger button when portfolio has sites', () => {
    render(
      <ForecastTrigger
        portfolio={mockPortfolioWithSites}
        onTrigger={mockOnTrigger}
      />
    );

    const triggerButton = screen.getByRole('button', { name: 'Generate Forecast' });
    expect(triggerButton).toBeEnabled();
    expect(triggerButton).toHaveClass('enabled');
  });

  it('disables trigger button when portfolio is empty', () => {
    render(
      <ForecastTrigger
        portfolio={mockPortfolioEmpty}
        onTrigger={mockOnTrigger}
      />
    );

    const triggerButton = screen.getByRole('button', { name: 'Generate Forecast' });
    expect(triggerButton).toBeDisabled();
    expect(triggerButton).toHaveClass('disabled');
    expect(screen.getByText('⚠️ Add sites to this portfolio before generating forecasts')).toBeInTheDocument();
  });

  it('disables trigger button when disabled prop is true', () => {
    render(
      <ForecastTrigger
        portfolio={mockPortfolioWithSites}
        onTrigger={mockOnTrigger}
        disabled={true}
      />
    );

    const triggerButton = screen.getByRole('button', { name: 'Generate Forecast' });
    expect(triggerButton).toBeDisabled();
    expect(screen.getByText('ℹ️ Forecast generation in progress...')).toBeInTheDocument();
  });

  it('shows empty portfolio message when no sites', () => {
    render(
      <ForecastTrigger
        portfolio={mockPortfolioEmpty}
        onTrigger={mockOnTrigger}
      />
    );

    expect(screen.getByText('No sites in this portfolio')).toBeInTheDocument();
  });

  it('calls onTrigger when button is clicked', async () => {
    mockOnTrigger.mockResolvedValue(undefined);

    render(
      <ForecastTrigger
        portfolio={mockPortfolioWithSites}
        onTrigger={mockOnTrigger}
      />
    );

    const triggerButton = screen.getByRole('button', { name: 'Generate Forecast' });
    fireEvent.click(triggerButton);

    expect(mockOnTrigger).toHaveBeenCalledWith(1);
  });

  it('shows loading state during forecast generation', async () => {
    let resolvePromise: () => void;
    const promise = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });
    mockOnTrigger.mockReturnValue(promise);

    render(
      <ForecastTrigger
        portfolio={mockPortfolioWithSites}
        onTrigger={mockOnTrigger}
      />
    );

    const triggerButton = screen.getByRole('button', { name: 'Generate Forecast' });
    
    await act(async () => {
      fireEvent.click(triggerButton);
    });

    // Should show loading state
    expect(screen.getByText('Generating Forecast...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();

    // Resolve the promise
    await act(async () => {
      resolvePromise!();
    });
    
    await waitFor(() => {
      expect(screen.getByText('Generate Forecast')).toBeInTheDocument();
    });
  });

  it('shows warning when portfolio is empty', () => {
    render(
      <ForecastTrigger
        portfolio={mockPortfolioEmpty}
        onTrigger={mockOnTrigger}
      />
    );

    // Verify the button is disabled and warning is shown
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByText('⚠️ Add sites to this portfolio before generating forecasts')).toBeInTheDocument();
  });

  it('handles forecast trigger errors gracefully', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    mockOnTrigger.mockRejectedValue(new Error('Network error'));

    render(
      <ForecastTrigger
        portfolio={mockPortfolioWithSites}
        onTrigger={mockOnTrigger}
      />
    );

    const triggerButton = screen.getByRole('button', { name: 'Generate Forecast' });
    
    await act(async () => {
      fireEvent.click(triggerButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Generate Forecast')).toBeInTheDocument();
    });

    expect(consoleError).toHaveBeenCalledWith('Error triggering forecast:', expect.any(Error));
    consoleError.mockRestore();
  });

  it('displays sites without capacity correctly', () => {
    const portfolioWithoutCapacity: Portfolio = {
      ...mockPortfolioWithSites,
      sites: [
        {
          ...mockPortfolioWithSites.sites[0],
          capacity_mw: undefined,
        },
      ],
    };

    render(
      <ForecastTrigger
        portfolio={portfolioWithoutCapacity}
        onTrigger={mockOnTrigger}
      />
    );

    expect(screen.getByText('Solar Site 1')).toBeInTheDocument();
    expect(screen.getByText('solar')).toBeInTheDocument();
    expect(screen.queryByText('MW')).not.toBeInTheDocument();
  });
});