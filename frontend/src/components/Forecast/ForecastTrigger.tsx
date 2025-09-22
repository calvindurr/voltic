import React, { useState } from 'react';
import { Portfolio } from '../../types';

interface ForecastTriggerProps {
  portfolio: Portfolio;
  onTrigger: (portfolioId: number) => Promise<void>;
  disabled?: boolean;
}

export const ForecastTrigger: React.FC<ForecastTriggerProps> = ({
  portfolio,
  onTrigger,
  disabled = false
}) => {
  const [isTriggering, setIsTriggering] = useState(false);

  const handleTrigger = async () => {
    if (portfolio.sites.length === 0) {
      alert('Cannot generate forecast: Portfolio has no sites');
      return;
    }

    setIsTriggering(true);
    try {
      await onTrigger(portfolio.id);
    } catch (error) {
      console.error('Error triggering forecast:', error);
    } finally {
      setIsTriggering(false);
    }
  };

  const canTrigger = !disabled && !isTriggering && portfolio.sites.length > 0;

  return (
    <div className="forecast-trigger">
      <div className="trigger-info">
        <h3>Generate New Forecast</h3>
        <p>
          Portfolio: <strong>{portfolio.name}</strong> ({portfolio.sites.length} sites)
        </p>
        {portfolio.description && (
          <p className="portfolio-description">{portfolio.description}</p>
        )}
      </div>

      <div className="trigger-actions">
        <button
          className={`trigger-button ${canTrigger ? 'enabled' : 'disabled'}`}
          onClick={handleTrigger}
          disabled={!canTrigger}
        >
          {isTriggering ? (
            <>
              <span className="spinner"></span>
              Generating Forecast...
            </>
          ) : (
            'Generate Forecast'
          )}
        </button>

        {portfolio.sites.length === 0 && (
          <p className="warning">
            ⚠️ Add sites to this portfolio before generating forecasts
          </p>
        )}

        {disabled && portfolio.sites.length > 0 && (
          <p className="info">
            ℹ️ Forecast generation in progress...
          </p>
        )}
      </div>

      <div className="site-list">
        <h4>Sites in Portfolio:</h4>
        {portfolio.sites.length > 0 ? (
          <ul>
            {portfolio.sites.map(site => (
              <li key={site.id} className="site-item">
                <span className="site-name">{site.name}</span>
                <span className={`site-type ${site.site_type}`}>
                  {site.site_type}
                </span>
                {site.capacity_mw && (
                  <span className="site-capacity">
                    {site.capacity_mw} MW
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-sites">No sites in this portfolio</p>
        )}
      </div>
    </div>
  );
};