import React, { useState, useEffect, useCallback } from 'react';
import { Portfolio, Site, CreatePortfolioRequest, ApiError } from '../../types';
import { portfolioService } from '../../services/portfolioService';
import { siteService } from '../../services/siteService';
import PortfolioForm from './PortfolioForm';
import './PortfolioManager.css';

export interface PortfolioManagerProps {
  onPortfolioCreated?: (portfolio: Portfolio) => void;
  onPortfolioUpdated?: (portfolio: Portfolio) => void;
  onPortfolioDeleted?: (portfolioId: number) => void;
  onPortfolioSelected?: (portfolio: Portfolio | null) => void;
  selectedPortfolio?: Portfolio | null;
  className?: string;
}

type ModalMode = 'create' | 'edit' | 'delete' | 'manage-sites' | null;

interface LoadingState {
  portfolios: boolean;
  sites: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
  siteAssignment: boolean;
}

export const PortfolioManager: React.FC<PortfolioManagerProps> = ({
  onPortfolioCreated,
  onPortfolioUpdated,
  onPortfolioDeleted,
  onPortfolioSelected,
  selectedPortfolio,
  className = '',
}) => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [allSites, setAllSites] = useState<Site[]>([]);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null);
  const [deletingPortfolio, setDeletingPortfolio] = useState<Portfolio | null>(null);
  const [managingSitesPortfolio, setManagingSitesPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState<LoadingState>({
    portfolios: false,
    sites: false,
    create: false,
    update: false,
    delete: false,
    siteAssignment: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Load portfolios and sites on component mount
  useEffect(() => {
    loadPortfolios();
    loadSites();
  }, []);

  const setLoadingState = (key: keyof LoadingState, value: boolean) => {
    setLoading(prev => ({ ...prev, [key]: value }));
  };

  const loadPortfolios = async () => {
    try {
      setLoadingState('portfolios', true);
      setError(null);
      const loadedPortfolios = await portfolioService.getPortfolios();
      setPortfolios(loadedPortfolios);
    } catch (err) {
      console.error('Failed to load portfolios:', err);
      setError('Failed to load portfolios. Please try again.');
    } finally {
      setLoadingState('portfolios', false);
    }
  };

  const loadSites = async () => {
    try {
      setLoadingState('sites', true);
      const loadedSites = await siteService.getSites();
      setAllSites(loadedSites);
    } catch (err) {
      console.error('Failed to load sites:', err);
      // Don't set error for sites loading failure as it's not critical
    } finally {
      setLoadingState('sites', false);
    }
  };

  const handleCreatePortfolio = async (portfolioData: CreatePortfolioRequest) => {
    try {
      setLoadingState('create', true);
      setError(null);
      const newPortfolio = await portfolioService.createPortfolio(portfolioData);
      setPortfolios(prev => [...prev, newPortfolio]);
      setModalMode(null);
      onPortfolioCreated?.(newPortfolio);
    } catch (err) {
      console.error('Failed to create portfolio:', err);
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw err; // Re-throw to let form handle it
    } finally {
      setLoadingState('create', false);
    }
  };

  const handleUpdatePortfolio = async (portfolioData: CreatePortfolioRequest) => {
    if (!editingPortfolio) return;
    
    try {
      setLoadingState('update', true);
      setError(null);
      const updatedPortfolio = await portfolioService.updatePortfolio(editingPortfolio.id, portfolioData);
      setPortfolios(prev => prev.map(portfolio => 
        portfolio.id === updatedPortfolio.id ? updatedPortfolio : portfolio
      ));
      setModalMode(null);
      setEditingPortfolio(null);
      onPortfolioUpdated?.(updatedPortfolio);
      
      // Update selected portfolio if it was the one being edited
      if (selectedPortfolio?.id === updatedPortfolio.id) {
        onPortfolioSelected?.(updatedPortfolio);
      }
    } catch (err) {
      console.error('Failed to update portfolio:', err);
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw err; // Re-throw to let form handle it
    } finally {
      setLoadingState('update', false);
    }
  };

  const handleDeletePortfolio = async () => {
    if (!deletingPortfolio) return;
    
    try {
      setLoadingState('delete', true);
      setError(null);
      await portfolioService.deletePortfolio(deletingPortfolio.id);
      setPortfolios(prev => prev.filter(portfolio => portfolio.id !== deletingPortfolio.id));
      setModalMode(null);
      setDeletingPortfolio(null);
      onPortfolioDeleted?.(deletingPortfolio.id);
      
      // Clear selected portfolio if it was the one being deleted
      if (selectedPortfolio?.id === deletingPortfolio.id) {
        onPortfolioSelected?.(null);
      }
    } catch (err) {
      console.error('Failed to delete portfolio:', err);
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
    } finally {
      setLoadingState('delete', false);
    }
  };

  const handleAddSiteToPortfolio = async (portfolioId: number, siteId: number) => {
    try {
      setLoadingState('siteAssignment', true);
      await portfolioService.addSiteToPortfolio(portfolioId, siteId);
      
      // Reload portfolios to get updated site assignments
      await loadPortfolios();
    } catch (err) {
      console.error('Failed to add site to portfolio:', err);
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
    } finally {
      setLoadingState('siteAssignment', false);
    }
  };

  const handleRemoveSiteFromPortfolio = async (portfolioId: number, siteId: number) => {
    try {
      setLoadingState('siteAssignment', true);
      await portfolioService.removeSiteFromPortfolio(portfolioId, siteId);
      
      // Reload portfolios to get updated site assignments
      await loadPortfolios();
    } catch (err) {
      console.error('Failed to remove site from portfolio:', err);
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
    } finally {
      setLoadingState('siteAssignment', false);
    }
  };

  const getErrorMessage = (err: any): string => {
    if (err?.error?.message) {
      return err.error.message;
    }
    if (err?.message) {
      return err.message;
    }
    return 'An unexpected error occurred. Please try again.';
  };

  // Filter portfolios based on search term
  const filteredPortfolios = (portfolios || []).filter(portfolio =>
    portfolio.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    portfolio.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get available sites for a portfolio (sites not already in the portfolio)
  const getAvailableSites = (portfolio: Portfolio): Site[] => {
    const portfolioSiteIds = new Set(portfolio.sites.map(site => site.id));
    return allSites.filter(site => !portfolioSiteIds.has(site.id));
  };

  // Modal handlers
  const openCreateModal = () => {
    setModalMode('create');
    setEditingPortfolio(null);
    setError(null);
  };

  const openEditModal = (portfolio: Portfolio) => {
    setModalMode('edit');
    setEditingPortfolio(portfolio);
    setError(null);
  };

  const openDeleteModal = (portfolio: Portfolio) => {
    setModalMode('delete');
    setDeletingPortfolio(portfolio);
    setError(null);
  };

  const openManageSitesModal = (portfolio: Portfolio) => {
    setModalMode('manage-sites');
    setManagingSitesPortfolio(portfolio);
    setError(null);
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingPortfolio(null);
    setDeletingPortfolio(null);
    setManagingSitesPortfolio(null);
    setError(null);
  };

  const handlePortfolioClick = (portfolio: Portfolio) => {
    onPortfolioSelected?.(portfolio);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className={`portfolio-manager ${className}`}>
      {/* Header */}
      <div className="portfolio-manager-header">
        <h2>Portfolio Management</h2>
        <button
          className="btn btn-primary"
          onClick={openCreateModal}
          disabled={loading.portfolios}
        >
          Create Portfolio
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          {error}
          <button 
            className="error-close"
            onClick={() => setError(null)}
            aria-label="Close error"
          >
            ×
          </button>
        </div>
      )}

      {/* Search */}
      <div className="portfolio-search">
        <input
          type="text"
          placeholder="Search portfolios..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Portfolios List */}
      <div className="portfolios-container">
        {loading.portfolios ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <span>Loading portfolios...</span>
          </div>
        ) : filteredPortfolios.length === 0 ? (
          <div className="empty-state">
            {portfolios.length === 0 ? (
              <>
                <div className="empty-icon">📁</div>
                <h3>No portfolios yet</h3>
                <p>Create your first portfolio to group and manage renewable energy sites.</p>
                <button className="btn btn-primary" onClick={openCreateModal}>
                  Create First Portfolio
                </button>
              </>
            ) : (
              <>
                <div className="empty-icon">🔍</div>
                <h3>No portfolios found</h3>
                <p>Try adjusting your search criteria.</p>
              </>
            )}
          </div>
        ) : (
          <div className="portfolios-grid">
            {filteredPortfolios.map((portfolio) => (
              <div
                key={portfolio.id}
                className={`portfolio-card ${selectedPortfolio?.id === portfolio.id ? 'selected' : ''}`}
                onClick={() => handlePortfolioClick(portfolio)}
              >
                <div className="portfolio-card-header">
                  <h3 className="portfolio-name">{portfolio.name}</h3>
                  <div className="portfolio-site-count">
                    {portfolio.sites.length} site{portfolio.sites.length !== 1 ? 's' : ''}
                  </div>
                </div>
                
                <div className="portfolio-description">
                  {portfolio.description || 'No description provided'}
                </div>
                
                <div className="portfolio-details">
                  <div className="detail-row">
                    <span className="detail-label">Created:</span>
                    <span className="detail-value">{formatDate(portfolio.created_at)}</span>
                  </div>
                  
                  {portfolio.sites.length > 0 && (
                    <div className="detail-row">
                      <span className="detail-label">Sites:</span>
                      <span className="detail-value">
                        {portfolio.sites.slice(0, 2).map(site => site.name).join(', ')}
                        {portfolio.sites.length > 2 && ` +${portfolio.sites.length - 2} more`}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="portfolio-actions">
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      openManageSitesModal(portfolio);
                    }}
                    disabled={loading.siteAssignment}
                  >
                    Manage Sites
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(portfolio);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteModal(portfolio);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{modalMode === 'create' ? 'Create Portfolio' : 'Edit Portfolio'}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            
            <PortfolioForm
              portfolio={editingPortfolio}
              onSubmit={modalMode === 'create' ? handleCreatePortfolio : handleUpdatePortfolio}
              onCancel={closeModal}
              isLoading={loading.create || loading.update}
              error={error}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {modalMode === 'delete' && deletingPortfolio && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Delete Portfolio</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            
            <div className="delete-confirmation">
              <div className="warning-icon">⚠️</div>
              <p>
                Are you sure you want to delete <strong>{deletingPortfolio.name}</strong>?
              </p>
              <p className="warning-text">
                This action cannot be undone. The portfolio and its site assignments will be permanently removed.
              </p>
              
              <div className="delete-actions">
                <button
                  className="btn btn-secondary"
                  onClick={closeModal}
                  disabled={loading.delete}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleDeletePortfolio}
                  disabled={loading.delete}
                >
                  {loading.delete ? (
                    <>
                      <span className="loading-spinner"></span>
                      Deleting...
                    </>
                  ) : (
                    'Delete Portfolio'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Sites Modal */}
      {modalMode === 'manage-sites' && managingSitesPortfolio && (
        <div className="modal-overlay">
          <div className="modal-content modal-large">
            <div className="modal-header">
              <h3>Manage Sites - {managingSitesPortfolio.name}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            
            <div className="site-management">
              {/* Current Sites */}
              <div className="site-section">
                <h4>Current Sites ({managingSitesPortfolio.sites.length})</h4>
                {managingSitesPortfolio.sites.length === 0 ? (
                  <p className="empty-message">No sites in this portfolio yet.</p>
                ) : (
                  <div className="site-list">
                    {managingSitesPortfolio.sites.map((site) => (
                      <div key={site.id} className="site-item">
                        <div className="site-info">
                          <span className="site-name">{site.name}</span>
                          <span className="site-type">{site.site_type}</span>
                        </div>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleRemoveSiteFromPortfolio(managingSitesPortfolio.id, site.id)}
                          disabled={loading.siteAssignment}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Available Sites */}
              <div className="site-section">
                <h4>Available Sites ({getAvailableSites(managingSitesPortfolio).length})</h4>
                {loading.sites ? (
                  <div className="loading-message">Loading sites...</div>
                ) : getAvailableSites(managingSitesPortfolio).length === 0 ? (
                  <p className="empty-message">All sites are already in this portfolio.</p>
                ) : (
                  <div className="site-list">
                    {getAvailableSites(managingSitesPortfolio).map((site) => (
                      <div key={site.id} className="site-item">
                        <div className="site-info">
                          <span className="site-name">{site.name}</span>
                          <span className="site-type">{site.site_type}</span>
                        </div>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleAddSiteToPortfolio(managingSitesPortfolio.id, site.id)}
                          disabled={loading.siteAssignment}
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={closeModal}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioManager;