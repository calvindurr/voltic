import React, { useState, useEffect } from 'react';
import { ForecastDashboard } from '../components';
import { Portfolio, ForecastResults } from '../types';
import { portfolioService, forecastService } from '../services';

const Forecasts: React.FC = () => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [forecasts, setForecasts] = useState<Record<number, ForecastResults>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedPortfolios = await portfolioService.getPortfolios();
      setPortfolios(fetchedPortfolios);
      
      // Load existing forecasts for each portfolio
      const forecastPromises = fetchedPortfolios.map(async (portfolio) => {
        try {
          const results = await forecastService.getPortfolioForecastResults(portfolio.id);
          return { portfolioId: portfolio.id, results };
        } catch (err) {
          // No forecasts available for this portfolio
          return null;
        }
      });
      
      const forecastResults = await Promise.all(forecastPromises);
      const forecastsMap: Record<number, ForecastResults> = {};
      
      forecastResults.forEach(result => {
        if (result) {
          forecastsMap[result.portfolioId] = result.results;
        }
      });
      
      setForecasts(forecastsMap);
    } catch (err) {
      setError('Failed to load forecast data');
      console.error('Error loading forecast data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleForecastTrigger = async (portfolioId: number) => {
    try {
      setError(null);
      const job = await forecastService.triggerPortfolioForecast(portfolioId);
      
      // Poll for job completion
      const pollInterval = setInterval(async () => {
        try {
          const status = await forecastService.getForecastJobStatus(job.id);
          if (status.status === 'completed') {
            clearInterval(pollInterval);
            // Reload forecast results
            const results = await forecastService.getPortfolioForecastResults(portfolioId);
            setForecasts(prev => ({
              ...prev,
              [portfolioId]: results
            }));
          } else if (status.status === 'failed') {
            clearInterval(pollInterval);
            setError(`Forecast failed: ${status.error_message || 'Unknown error'}`);
          }
        } catch (err) {
          clearInterval(pollInterval);
          setError('Failed to check forecast status');
        }
      }, 2000);
      
      // Clear polling after 5 minutes to prevent infinite polling
      setTimeout(() => {
        clearInterval(pollInterval);
      }, 300000);
      
    } catch (err) {
      setError('Failed to trigger forecast');
      console.error('Error triggering forecast:', err);
    }
  };

  if (loading) {
    return (
      <div className="forecasts-page">
        <h1>Forecasts</h1>
        <div className="loading">Loading forecast data...</div>
      </div>
    );
  }

  return (
    <div className="forecasts-page">
      <h1>Forecasts</h1>
      {error && (
        <div className="error-message">
          {error}
          <button onClick={loadData} className="retry-button">Retry</button>
        </div>
      )}
      
      <ForecastDashboard />
    </div>
  );
};

export default Forecasts;