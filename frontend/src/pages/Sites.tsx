import React, { useState, useEffect } from 'react';
import { MapView, SiteManager } from '../components';
import { Site, CreateSiteRequest } from '../types';
import { siteService } from '../services';

const Sites: React.FC = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedSites = await siteService.getSites();
      // Ensure we always have an array
      setSites(Array.isArray(fetchedSites) ? fetchedSites : []);
    } catch (err) {
      setError('Failed to load sites');
      console.error('Error loading sites:', err);
      // Set empty array on error to prevent map issues
      setSites([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSiteAdd = async (siteData: CreateSiteRequest) => {
    try {
      console.log('Attempting to create site:', siteData);
      const newSite = await siteService.createSite(siteData);
      setSites(prev => [...prev, newSite]);
    } catch (err: any) {
      const errorMessage = err?.error?.message || err?.message || 'Failed to create site';
      setError(errorMessage);
      console.error('Error creating site:', err);
    }
  };

  const handleSiteSelect = (site: Site | null) => {
    setSelectedSite(site);
  };

  const handleSiteUpdate = (updatedSite: Site) => {
    setSites(prev => prev.map(site => 
      site.id === updatedSite.id ? updatedSite : site
    ));
    setSelectedSite(null);
  };

  const handleSiteDelete = (siteId: number) => {
    setSites(prev => prev.filter(site => site.id !== siteId));
    setSelectedSite(null);
  };

  if (loading) {
    return (
      <div className="sites-page">
        <h1>Site Management</h1>
        <div className="loading">Loading sites...</div>
      </div>
    );
  }

  return (
    <div className="sites-page">
      <h1>Site Management</h1>
      {error && (
        <div className="error-message">
          {error}
          <button onClick={loadSites} className="retry-button">Retry</button>
        </div>
      )}
      
      <div className="sites-layout">
        <div className="map-section">
          <MapView
            sites={sites}
            selectedSite={selectedSite}
            onSiteAdd={handleSiteAdd}
            onSiteSelect={handleSiteSelect}
          />
        </div>
        
        <div className="site-management-section">
          <SiteManager
            selectedSite={selectedSite}
            onSiteUpdated={handleSiteUpdate}
            onSiteDeleted={handleSiteDelete}
            onSiteSelect={setSelectedSite}
          />
        </div>
      </div>
    </div>
  );
};

export default Sites;