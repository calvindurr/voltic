import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { ForecastResult } from '../../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ForecastChartProps {
  data: ForecastResult[];
  title: string;
  color?: string;
  showConfidenceInterval?: boolean;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({
  data,
  title,
  color = 'rgba(54, 162, 235, 0.8)',
  showConfidenceInterval = true
}) => {
  // Sort data by datetime
  const sortedData = [...data].sort((a, b) => 
    new Date(a.forecast_datetime).getTime() - new Date(b.forecast_datetime).getTime()
  );

  // Prepare chart data
  const labels = sortedData.map(result => {
    const date = new Date(result.forecast_datetime);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  });

  const forecastValues = sortedData.map(result => result.predicted_generation_mwh);
  const lowerBounds = sortedData.map(result => result.confidence_interval_lower ?? 0);
  const upperBounds = sortedData.map(result => result.confidence_interval_upper ?? 0);

  const datasets: any[] = [
    {
      label: 'Predicted Generation (MWh)',
      data: forecastValues,
      borderColor: color,
      backgroundColor: color.replace('0.8', '0.2'),
      borderWidth: 2,
      fill: false,
      tension: 0.1,
    }
  ];

  // Add confidence interval if available and requested
  if (showConfidenceInterval && sortedData.some(result => result.confidence_interval_lower !== undefined && result.confidence_interval_lower !== null)) {
    datasets.push(
      {
        label: 'Confidence Interval (Lower)',
        data: lowerBounds,
        borderColor: color.replace('0.8', '0.4'),
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
      },
      {
        label: 'Confidence Interval (Upper)',
        data: upperBounds,
        borderColor: color.replace('0.8', '0.4'),
        backgroundColor: color.replace('0.8', '0.1'),
        borderWidth: 1,
        borderDash: [5, 5],
        fill: '-1', // Fill between this line and the previous one
        pointRadius: 0,
      }
    );
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value.toFixed(2)} MWh`;
          }
        }
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time',
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0,
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Generation (MWh)',
        },
        beginAtZero: true,
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  const chartData = {
    labels,
    datasets,
  };

  if (data.length === 0) {
    return (
      <div className="forecast-chart-empty">
        <p>No forecast data available for {title}</p>
      </div>
    );
  }

  return (
    <div className="forecast-chart-container">
      <div className="chart-wrapper">
        <Line data={chartData} options={options} />
      </div>
      <div className="chart-summary">
        <div className="summary-stats">
          <span className="stat">
            <strong>Total:</strong> {forecastValues.reduce((sum, val) => sum + val, 0).toFixed(2)} MWh
          </span>
          <span className="stat">
            <strong>Average:</strong> {(forecastValues.reduce((sum, val) => sum + val, 0) / forecastValues.length).toFixed(2)} MWh
          </span>
          <span className="stat">
            <strong>Peak:</strong> {Math.max(...forecastValues).toFixed(2)} MWh
          </span>
        </div>
      </div>
    </div>
  );
};