import React, { useState, useEffect, useCallback } from 'react';
import { Site, CreateSiteRequest, ApiError } from '../../types';
import { siteService } from '../../services/siteService';
import { useErrorHandler } from '../../hooks';
import { ErrorMessage, LoadingSpinner, SkeletonCard } from '../../components';
import SiteForm from './SiteForm';
import './SiteManager.css';

export interface SiteManagerProps {
  onSiteCreated?: (site: Site) => void;
  onSiteUpdated?: (site: Site) => void;
  onSiteDeleted?: (siteId: number) => void;
  selectedSite?: Site | null;
  onSiteSelect?: (site: Site | null) => void;
  className?: string;
}

type ModalMode = 'create' | 'edit' | 'delete' | null;

interface LoadingState {
  sites: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

export const SiteManager: React.FC<SiteManagerProps> = ({
  onSiteCreated,
  onSiteUpdated,
  onSiteDeleted,
  selectedSite,
  onSiteSelect,
  className = '',
}) => {
  const [sites, setSites] = useState<Site[]>([]);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [deletingSite, setDeletingSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState<LoadingState>({
    sites: false,
    create: false,
    update: false,
    delete: false,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'solar' | 'wind'>('all');
  
  // Use the error handler hook
  const { error, clearError, executeWithErrorHandling } = useErrorHandler();

  // Load sites on component mount
  useEffect(() => {
    loadSites();
  }, []);

  // Update selected site when prop changes
  useEffect(() => {
    if (selectedSite && !sites.find(s => s.id === selectedSite.id)) {
      // If selected site is not in our list, reload sites
      loadSites();
    }
  }, [selectedSite, sites]);

  const setLoadingState = (key: keyof LoadingState, value: boolean) => {
    setLoading(prev => ({ ...prev, [key]: value }));
  };

  const loadSites = useCallback(async () => {
    await executeWithErrorHandling(
      async () => {
        setLoadingState('sites', true);
        const loadedSites = await siteService.getSites();
        setSites(loadedSites);
      },
      {
        onSuccess: () => {
          setLoadingState('sites', false);
        },
        onError: () => {
          setLoadingState('sites', false);
        },
        showLoading: false, // We manage loading state manually
      }
    );
  }, [executeWithErrorHandling]);

  const handleCreateSite = async (siteData: CreateSiteRequest) => {
    const result = await executeWithErrorHandling(
      async () => {
        setLoadingState('create', true);
        const newSite = await siteService.createSite(siteData);
        setSites(prev => [...prev, newSite]);
        setModalMode(null);
        onSiteCreated?.(newSite);
        return newSite;
      },
      {
        onSuccess: () => {
          setLoadingState('create', false);
        },
        onError: () => {
          setLoadingState('create', false);
        },
        showLoading: false,
      }
    );
    
    if (!result) {
      throw error; // Re-throw to let form handle it
    }
  };

  const handleUpdateSite = async (siteData: CreateSiteRequest) => {
    if (!editingSite) return;
    
    const result = await executeWithErrorHandling(
      async () => {
        setLoadingState('update', true);
        const updatedSite = await siteService.updateSite(editingSite.id, siteData);
        setSites(prev => prev.map(site => 
          site.id === updatedSite.id ? updatedSite : site
        ));
        setModalMode(null);
        setEditingSite(null);
        onSiteUpdated?.(updatedSite);
        
        // Update selected site if it was the one being edited
        if (selectedSite?.id === updatedSite.id) {
          onSiteSelect?.(updatedSite);
        }
        return updatedSite;
      },
      {
        onSuccess: () => {
          setLoadingState('update', false);
        },
        onError: () => {
          setLoadingState('update', false);
        },
        showLoading: false,
      }
    );
    
    if (!result) {
      throw error; // Re-throw to let form handle it
    }
  };

  const handleDeleteSite = async () => {
    if (!deletingSite) return;
    
    await executeWithErrorHandling(
      async () => {
        setLoadingState('delete', true);
        await siteService.deleteSite(deletingSite.id);
        setSites(prev => prev.filter(site => site.id !== deletingSite.id));
        setModalMode(null);
        setDeletingSite(null);
        onSiteDeleted?.(deletingSite.id);
        
        // Clear selected site if it was the one being deleted
        if (selectedSite?.id === deletingSite.id) {
          onSiteSelect?.(null);
        }
      },
      {
        onSuccess: () => {
          setLoadingState('delete', false);
        },
        onError: () => {
          setLoadingState('delete', false);
        },
        showLoading: false,
      }
    );
  };



  // Filter and search sites
  const filteredSites = sites.filter(site => {
    const matchesSearch = site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         site.site_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || site.site_type === filterType;
    return matchesSearch && matchesFilter;
  });

  // Modal handlers
  const openCreateModal = () => {
    setModalMode('create');
    setEditingSite(null);
    clearError();
  };

  const openEditModal = (site: Site) => {
    setModalMode('edit');
    setEditingSite(site);
    clearError();
  };

  const openDeleteModal = (site: Site) => {
    setModalMode('delete');
    setDeletingSite(site);
    clearError();
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingSite(null);
    setDeletingSite(null);
    clearError();
  };

  const handleSiteClick = (site: Site) => {
    onSiteSelect?.(site);
  };

  const formatCoordinates = (lat: number, lng: number): string => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className={`site-manager ${className}`}>
      {/* Header */}
      <div className="site-manager-header">
        <h2>Site Management</h2>
        <button
          className="btn btn-primary"
          onClick={openCreateModal}
          disabled={loading.sites}
        >
          Add New Site
        </button>
      </div>

      {/* Error Banner */}
      <ErrorMessage 
        error={error} 
        onDismiss={clearError}
        onRetry={loadSites}
        variant="banner"
      />

      {/* Filters and Search */}
      <div className="site-filters">
        <div className="search-group">
          <input
            type="text"
            placeholder="Search sites..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-group">
          <label htmlFor="typeFilter">Filter by type:</label>
          <select
            id="typeFilter"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'solar' | 'wind')}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="solar">Solar</option>
            <option value="wind">Wind</option>
          </select>
        </div>
      </div>

      {/* Sites List */}
      <div className="sites-container">
        {loading.sites ? (
          <div className="sites-grid">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : filteredSites.length === 0 ? (
          <div className="empty-state">
            {sites.length === 0 ? (
              <>
                <div className="empty-icon">🏗️</div>
                <h3>No sites yet</h3>
                <p>Get started by adding your first renewable energy site.</p>
                <button className="btn btn-primary" onClick={openCreateModal}>
                  Add First Site
                </button>
              </>
            ) : (
              <>
                <div className="empty-icon">🔍</div>
                <h3>No sites found</h3>
                <p>Try adjusting your search or filter criteria.</p>
              </>
            )}
          </div>
        ) : (
          <div className="sites-grid">
            {filteredSites.map((site) => (
              <div
                key={site.id}
                className={`site-card ${selectedSite?.id === site.id ? 'selected' : ''}`}
                onClick={() => handleSiteClick(site)}
              >
                <div className="site-card-header">
                  <h3 className="site-name">{site.name}</h3>
                  <div className={`site-type-badge ${site.site_type}`}>
                    {site.site_type === 'solar' ? '☀️' : '💨'} {site.site_type}
                  </div>
                </div>
                
                <div className="site-details">
                  <div className="detail-row">
                    <span className="detail-label">Coordinates:</span>
                    <span className="detail-value">
                      {formatCoordinates(site.latitude, site.longitude)}
                    </span>
                  </div>
                  
                  {site.capacity_mw && (
                    <div className="detail-row">
                      <span className="detail-label">Capacity:</span>
                      <span className="detail-value">{site.capacity_mw} MW</span>
                    </div>
                  )}
                  
                  <div className="detail-row">
                    <span className="detail-label">Created:</span>
                    <span className="detail-value">{formatDate(site.created_at)}</span>
                  </div>
                </div>
                
                <div className="site-actions">
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(site);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteModal(site);
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
              <h3>{modalMode === 'create' ? 'Add New Site' : 'Edit Site'}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            
            <SiteForm
              site={editingSite}
              onSubmit={modalMode === 'create' ? handleCreateSite : handleUpdateSite}
              onCancel={closeModal}
              isLoading={loading.create || loading.update}
              error={error?.error?.message || null}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {modalMode === 'delete' && deletingSite && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Delete Site</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            
            <div className="delete-confirmation">
              <div className="warning-icon">⚠️</div>
              <p>
                Are you sure you want to delete <strong>{deletingSite.name}</strong>?
              </p>
              <p className="warning-text">
                This action cannot be undone. The site will be removed from all portfolios.
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
                  onClick={handleDeleteSite}
                  disabled={loading.delete}
                >
                  {loading.delete ? (
                    <>
                      <LoadingSpinner size="small" color="white" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Site'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteManager;