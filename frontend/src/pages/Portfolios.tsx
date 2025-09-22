import React, { useState, useEffect } from 'react';
import { MapView, PortfolioManager } from '../components';
import { Portfolio, Site } from '../types';
import { portfolioService, siteService } from '../services';

const Portfolios: React.FC = () => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [fetchedPortfolios, fetchedSites] = await Promise.all([
        portfolioService.getPortfolios(),
        siteService.getSites()
      ]);
      setPortfolios(fetchedPortfolios);
      setSites(fetchedSites);
    } catch (err) {
      setError('Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePortfolioSelect = (portfolio: Portfolio | null) => {
    setSelectedPortfolio(portfolio);
  };

  const handlePortfolioUpdate = async (portfolioData: Partial<Portfolio>) => {
    try {
      let updatedPortfolio: Portfolio;
      if (selectedPortfolio?.id === 0) {
        // Create new portfolio
        updatedPortfolio = await portfolioService.createPortfolio({
          name: portfolioData.name!,
          description: portfolioData.description || ''
        });
        setPortfolios(prev => [...prev, updatedPortfolio]);
      } else {
        // Update existing portfolio
        updatedPortfolio = await portfolioService.updatePortfolio(
          selectedPortfolio!.id, 
          portfolioData
        );
        setPortfolios(prev => prev.map(portfolio => 
          portfolio.id === updatedPortfolio.id ? updatedPortfolio : portfolio
        ));
      }
      setSelectedPortfolio(updatedPortfolio);
    } catch (err) {
      setError('Failed to save portfolio');
      console.error('Error saving portfolio:', err);
    }
  };

  const handlePortfolioDelete = async (portfolioId: number) => {
    try {
      await portfolioService.deletePortfolio(portfolioId);
      setPortfolios(prev => prev.filter(portfolio => portfolio.id !== portfolioId));
      setSelectedPortfolio(null);
    } catch (err) {
      setError('Failed to delete portfolio');
      console.error('Error deleting portfolio:', err);
    }
  };

  const handleSiteAssignment = async (portfolioId: number, siteId: number, action: 'add' | 'remove') => {
    try {
      if (action === 'add') {
        await portfolioService.addSiteToPortfolio(portfolioId, siteId);
      } else {
        await portfolioService.removeSiteFromPortfolio(portfolioId, siteId);
      }
      // Reload portfolios to get updated site assignments
      const updatedPortfolios = await portfolioService.getPortfolios();
      setPortfolios(updatedPortfolios);
      
      // Update selected portfolio if it's the one being modified
      if (selectedPortfolio?.id === portfolioId) {
        const updatedSelected = updatedPortfolios.find(p => p.id === portfolioId);
        setSelectedPortfolio(updatedSelected || null);
      }
    } catch (err) {
      setError('Failed to update site assignment');
      console.error('Error updating site assignment:', err);
    }
  };

  const getPortfolioSites = () => {
    return selectedPortfolio?.sites || [];
  };

  if (loading) {
    return (
      <div className="portfolios-page">
        <h1>Portfolio Management</h1>
        <div className="loading">Loading portfolios...</div>
      </div>
    );
  }

  return (
    <div className="portfolios-page">
      <h1>Portfolio Management</h1>
      {error && (
        <div className="error-message">
          {error}
          <button onClick={loadData} className="retry-button">Retry</button>
        </div>
      )}
      
      <div className="portfolios-layout">
        <div className="map-section">
          <MapView
            sites={sites}
            portfolios={portfolios}
            selectedPortfolio={selectedPortfolio}
            onSiteSelect={() => {}} // No site selection in portfolio view
          />
        </div>
        
        <div className="portfolio-management-section">
          <PortfolioManager
            selectedPortfolio={selectedPortfolio}
            onPortfolioSelected={handlePortfolioSelect}
            onPortfolioCreated={handlePortfolioUpdate}
            onPortfolioUpdated={handlePortfolioUpdate}
            onPortfolioDeleted={handlePortfolioDelete}
          />
        </div>
      </div>
    </div>
  );
};

export default Portfolios;