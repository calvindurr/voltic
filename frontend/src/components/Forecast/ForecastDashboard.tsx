import React, { useState, useEffect } from 'react';
import { Portfolio, ForecastJob, ForecastResults, ForecastResult } from '../../types';
import { forecastService } from '../../services/forecastService';
import { portfolioService } from '../../services/portfolioService';
import { ForecastChart } from './ForecastChart';
import { ForecastTrigger } from './ForecastTrigger';
import { JobStatusIndicator } from './JobStatusIndicator';
import './ForecastDashboard.css';

interface ForecastDashboardProps {
  selectedPortfolioId?: number;
}

export const ForecastDashboard: React.FC<ForecastDashboardProps> = ({ 
  selectedPortfolioId 
}) => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [forecastResults, setForecastResults] = useState<ForecastResults | null>(null);
  const [activeJob, setActiveJob] = useState<ForecastJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load portfolios on component mount
  useEffect(() => {
    loadPortfolios();
  }, []);

  // Set selected portfolio when prop changes
  useEffect(() => {
    if (selectedPortfolioId && portfolios.length > 0) {
      const portfolio = portfolios.find(p => p.id === selectedPortfolioId);
      if (portfolio) {
        setSelectedPortfolio(portfolio);
        loadForecastResults(portfolio.id);
      }
    }
  }, [selectedPortfolioId, portfolios]);

  const loadPortfolios = async () => {
    try {
      const data = await portfolioService.getPortfolios();
      setPortfolios(data);
      
      // Auto-select first portfolio if none selected
      if (!selectedPortfolio && data.length > 0) {
        setSelectedPortfolio(data[0]);
        loadForecastResults(data[0].id);
      }
    } catch (err) {
      setError('Failed to load portfolios');
      console.error('Error loading portfolios:', err);
    }
  };

  const loadForecastResults = async (portfolioId: number) => {
    try {
      setLoading(true);
      setError(null);
      const results = await forecastService.getPortfolioForecastResults(portfolioId);
      setForecastResults(results);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setForecastResults(null);
      } else {
        setError('Failed to load forecast results');
        console.error('Error loading forecast results:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePortfolioSelect = (portfolio: Portfolio) => {
    setSelectedPortfolio(portfolio);
    setActiveJob(null);
    loadForecastResults(portfolio.id);
  };

  const handleForecastTrigger = async (portfolioId: number) => {
    try {
      setError(null);
      const job = await forecastService.triggerPortfolioForecast(portfolioId);
      setActiveJob(job);
      
      // Start polling for job status
      pollJobStatus(job.id);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to trigger forecast');
      console.error('Error triggering forecast:', err);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const job = await forecastService.getForecastJobStatus(jobId);
        setActiveJob(job);
        
        if (job.status === 'completed') {
          clearInterval(pollInterval);
          if (selectedPortfolio) {
            loadForecastResults(selectedPortfolio.id);
          }
        } else if (job.status === 'failed') {
          clearInterval(pollInterval);
          setError(job.error_message || 'Forecast job failed');
        }
      } catch (err) {
        console.error('Error polling job status:', err);
        clearInterval(pollInterval);
      }
    }, 2000); // Poll every 2 seconds

    // Clean up polling after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 300000);
  };

  const aggregatePortfolioData = (results: ForecastResult[]): ForecastResult[] => {
    if (!results || !Array.isArray(results)) {
      return [];
    }
    
    const aggregated = new Map<string, number>();
    
    results.forEach(result => {
      const key = result.forecast_datetime;
      const current = aggregated.get(key) || 0;
      aggregated.set(key, current + result.predicted_generation_mwh);
    });

    return Array.from(aggregated.entries()).map(([datetime, total], index) => ({
      id: index,
      job: results[0]?.job || '',
      site: 0, // Portfolio aggregate
      forecast_datetime: datetime,
      predicted_generation_mwh: total,
      created_at: new Date().toISOString()
    }));
  };

  const groupResultsBySite = (results: ForecastResult[]): Map<number, ForecastResult[]> => {
    if (!results || !Array.isArray(results)) {
      return new Map();
    }
    
    const grouped = new Map<number, ForecastResult[]>();
    
    results.forEach(result => {
      const siteResults = grouped.get(result.site) || [];
      siteResults.push(result);
      grouped.set(result.site, siteResults);
    });

    return grouped;
  };

  if (portfolios.length === 0 && !error) {
    return (
      <div className="forecast-dashboard">
        <div className="no-portfolios">
          <h2>No Portfolios Available</h2>
          <p>Create a portfolio with sites to generate forecasts.</p>
        </div>
      </div>
    );
  }

  if (portfolios.length === 0 && error) {
    return (
      <div className="forecast-dashboard">
        <div className="dashboard-header">
          <h1>Forecast Dashboard</h1>
        </div>
        
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
        
        <div className="no-portfolios">
          <h2>No Portfolios Available</h2>
          <p>Create a portfolio with sites to generate forecasts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="forecast-dashboard">
      <div className="dashboard-header">
        <h1>Forecast Dashboard</h1>
        
        <div className="portfolio-selector">
          <label htmlFor="portfolio-select">Select Portfolio:</label>
          <select
            id="portfolio-select"
            value={selectedPortfolio?.id || ''}
            onChange={(e) => {
              const portfolio = portfolios.find(p => p.id === parseInt(e.target.value));
              if (portfolio) handlePortfolioSelect(portfolio);
            }}
          >
            {portfolios.map(portfolio => (
              <option key={portfolio.id} value={portfolio.id}>
                {portfolio.name} ({portfolio.sites.length} sites)
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {selectedPortfolio && (
        <div className="dashboard-content">
          <div className="forecast-controls">
            <ForecastTrigger
              portfolio={selectedPortfolio}
              onTrigger={handleForecastTrigger}
              disabled={activeJob?.status === 'running' || activeJob?.status === 'pending'}
            />
            
            {activeJob && (
              <JobStatusIndicator job={activeJob} />
            )}
          </div>

          {loading && (
            <div className="loading-indicator">
              <p>Loading forecast results...</p>
            </div>
          )}

          {forecastResults && forecastResults.results && !loading && (
            <div className="forecast-results">
              <div className="portfolio-forecast">
                <h2>Portfolio Aggregate Forecast</h2>
                <ForecastChart
                  data={aggregatePortfolioData(forecastResults.results)}
                  title={`${selectedPortfolio.name} - Total Generation`}
                  color="rgba(54, 162, 235, 0.8)"
                />
              </div>

              <div className="site-forecasts">
                <h2>Individual Site Forecasts</h2>
                {Array.from(groupResultsBySite(forecastResults.results)).map(([siteId, siteResults]) => {
                  const site = selectedPortfolio.sites.find(s => s.id === siteId);
                  return (
                    <div key={siteId} className="site-forecast">
                      <ForecastChart
                        data={siteResults}
                        title={site ? `${site.name} (${site.site_type})` : `Site ${siteId}`}
                        color={
                          site?.site_type === 'solar' ? 'rgba(255, 206, 86, 0.8)' : 
                          site?.site_type === 'wind' ? 'rgba(75, 192, 192, 0.8)' : 
                          'rgba(54, 162, 235, 0.8)' // Blue for hydro
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!forecastResults && !loading && !activeJob && (
            <div className="no-forecast-data">
              <h2>No Forecast Data Available</h2>
              <p>Trigger a forecast to generate predictions for this portfolio.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};