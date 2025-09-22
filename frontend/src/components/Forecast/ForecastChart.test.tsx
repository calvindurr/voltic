import React from 'react';
import { render, screen } from '@testing-library/react';
import { ForecastChart } from './ForecastChart';
import { ForecastResult } from '../../types';

// Mock Chart.js
jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: any) => (
    <div data-testid="chart">
      <div data-testid="chart-title">{options.plugins.title.text}</div>
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
    </div>
  ),
}));

jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: {},
  LinearScale: {},
  PointElement: {},
  LineElement: {},
  Title: {},
  Tooltip: {},
  Legend: {},
  Filler: {},
}));

describe('ForecastChart', () => {
  const mockForecastData: ForecastResult[] = [
    {
      id: 1,
      job: 'job-1',
      site: 1,
      forecast_datetime: '2024-01-01T12:00:00Z',
      predicted_generation_mwh: 10.5,
      confidence_interval_lower: 8.0,
      confidence_interval_upper: 13.0,
      created_at: '2024-01-01T10:00:00Z',
    },
    {
      id: 2,
      job: 'job-1',
      site: 1,
      forecast_datetime: '2024-01-01T13:00:00Z',
      predicted_generation_mwh: 12.3,
      confidence_interval_lower: 9.5,
      confidence_interval_upper: 15.1,
      created_at: '2024-01-01T10:00:00Z',
    },
    {
      id: 3,
      job: 'job-1',
      site: 1,
      forecast_datetime: '2024-01-01T14:00:00Z',
      predicted_generation_mwh: 8.7,
      confidence_interval_lower: 6.2,
      confidence_interval_upper: 11.2,
      created_at: '2024-01-01T10:00:00Z',
    },
  ];

  it('renders chart with forecast data', () => {
    render(
      <ForecastChart
        data={mockForecastData}
        title="Test Site Forecast"
        color="rgba(255, 0, 0, 0.8)"
      />
    );

    expect(screen.getByTestId('chart')).toBeInTheDocument();
    expect(screen.getByTestId('chart-title')).toHaveTextContent('Test Site Forecast');
  });

  it('displays summary statistics', () => {
    render(
      <ForecastChart
        data={mockForecastData}
        title="Test Site Forecast"
      />
    );

    // Check for summary stats
    expect(screen.getByText(/Total:/)).toBeInTheDocument();
    expect(screen.getByText(/Average:/)).toBeInTheDocument();
    expect(screen.getByText(/Peak:/)).toBeInTheDocument();

    // Check calculated values
    expect(screen.getByText('31.50 MWh')).toBeInTheDocument(); // Total
    expect(screen.getByText('10.50 MWh')).toBeInTheDocument(); // Average
    expect(screen.getByText('12.30 MWh')).toBeInTheDocument(); // Peak
  });

  it('renders empty state when no data provided', () => {
    render(
      <ForecastChart
        data={[]}
        title="Empty Chart"
      />
    );

    expect(screen.getByText('No forecast data available for Empty Chart')).toBeInTheDocument();
    expect(screen.queryByTestId('chart')).not.toBeInTheDocument();
  });

  it('sorts data by datetime before rendering', () => {
    const unsortedData = [
      mockForecastData[2], // 14:00
      mockForecastData[0], // 12:00
      mockForecastData[1], // 13:00
    ];

    render(
      <ForecastChart
        data={unsortedData}
        title="Sorted Chart"
      />
    );

    const chartData = JSON.parse(screen.getByTestId('chart-data').textContent || '{}');
    
    // Check that we have 3 labels and they are in order
    expect(chartData.labels).toHaveLength(3);
    // The exact format depends on locale, so just check the order of values
    expect(chartData.datasets[0].data).toEqual([10.5, 12.3, 8.7]); // Should be sorted by time
  });

  it('includes confidence intervals when available and enabled', () => {
    render(
      <ForecastChart
        data={mockForecastData}
        title="Chart with Confidence"
        showConfidenceInterval={true}
      />
    );

    const chartData = JSON.parse(screen.getByTestId('chart-data').textContent || '{}');
    
    // Should have 3 datasets: main line + upper + lower bounds
    expect(chartData.datasets).toHaveLength(3);
    expect(chartData.datasets[1].label).toBe('Confidence Interval (Lower)');
    expect(chartData.datasets[2].label).toBe('Confidence Interval (Upper)');
  });

  it('excludes confidence intervals when disabled', () => {
    render(
      <ForecastChart
        data={mockForecastData}
        title="Chart without Confidence"
        showConfidenceInterval={false}
      />
    );

    const chartData = JSON.parse(screen.getByTestId('chart-data').textContent || '{}');
    
    // Should have only 1 dataset: main line
    expect(chartData.datasets).toHaveLength(1);
    expect(chartData.datasets[0].label).toBe('Predicted Generation (MWh)');
  });

  it('handles data without confidence intervals', () => {
    const dataWithoutConfidence = mockForecastData.map(item => ({
      ...item,
      confidence_interval_lower: undefined,
      confidence_interval_upper: undefined,
    }));

    render(
      <ForecastChart
        data={dataWithoutConfidence}
        title="Chart without Confidence Data"
        showConfidenceInterval={true}
      />
    );

    const chartData = JSON.parse(screen.getByTestId('chart-data').textContent || '{}');
    
    // Should have only 1 dataset since no confidence data available
    expect(chartData.datasets).toHaveLength(1);
  });

  it('applies custom color to chart', () => {
    const customColor = 'rgba(0, 255, 0, 0.8)';
    
    render(
      <ForecastChart
        data={mockForecastData}
        title="Custom Color Chart"
        color={customColor}
      />
    );

    const chartData = JSON.parse(screen.getByTestId('chart-data').textContent || '{}');
    
    expect(chartData.datasets[0].borderColor).toBe(customColor);
  });
});