import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Site, Portfolio, ForecastJob } from '../types';
import { siteService, portfolioService, forecastService } from '../services';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    sitesCount: 0,
    portfoliosCount: 0,
    recentForecasts: 0
  });
  const [recentActivity, setRecentActivity] = useState<{
    sites: Site[];
    portfolios: Portfolio[];
    jobs: ForecastJob[];
  }>({
    sites: [],
    portfolios: [],
    jobs: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [sites, portfolios] = await Promise.all([
        siteService.getSites(),
        portfolioService.getPortfolios()
      ]);

      setStats({
        sitesCount: sites.length,
        portfoliosCount: portfolios.length,
        recentForecasts: 0 // Will be updated when forecast history is available
      });

      setRecentActivity({
        sites: sites.slice(-3), // Last 3 sites
        portfolios: portfolios.slice(-3), // Last 3 portfolios
        jobs: [] // Will be populated when job history is available
      });
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <h1>Renewable Energy Forecasting Dashboard</h1>
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1>Renewable Energy Forecasting Dashboard</h1>
      <p>Welcome to the renewable energy forecasting application.</p>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>{stats.sitesCount}</h3>
          <p>Total Sites</p>
        </div>
        <div className="stat-card">
          <h3>{stats.portfoliosCount}</h3>
          <p>Portfolios</p>
        </div>
        <div className="stat-card">
          <h3>{stats.recentForecasts}</h3>
          <p>Recent Forecasts</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Sites</h3>
          <p>Manage renewable energy sites on an interactive map</p>
          <div className="recent-items">
            {recentActivity.sites.length > 0 ? (
              <>
                <h4>Recent Sites:</h4>
                <ul>
                  {recentActivity.sites.map(site => (
                    <li key={site.id}>
                      {site.name} ({site.site_type})
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="no-data">No sites created yet</p>
            )}
          </div>
          <Link to="/sites" className="card-action">Manage Sites →</Link>
        </div>
        
        <div className="dashboard-card">
          <h3>Portfolios</h3>
          <p>Create and manage site portfolios for analysis</p>
          <div className="recent-items">
            {recentActivity.portfolios.length > 0 ? (
              <>
                <h4>Recent Portfolios:</h4>
                <ul>
                  {recentActivity.portfolios.map(portfolio => (
                    <li key={portfolio.id}>
                      {portfolio.name} ({portfolio.sites.length} sites)
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="no-data">No portfolios created yet</p>
            )}
          </div>
          <Link to="/portfolios" className="card-action">Manage Portfolios →</Link>
        </div>
        
        <div className="dashboard-card">
          <h3>Forecasts</h3>
          <p>View and generate energy forecasts for your portfolios</p>
          <div className="recent-items">
            {recentActivity.jobs.length > 0 ? (
              <>
                <h4>Recent Forecasts:</h4>
                <ul>
                  {recentActivity.jobs.map(job => (
                    <li key={job.id}>
                      Job {job.id.slice(0, 8)}... ({job.status})
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="no-data">No forecasts generated yet</p>
            )}
          </div>
          <Link to="/forecasts" className="card-action">View Forecasts →</Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;