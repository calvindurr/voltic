import React, { useState } from 'react';
import { MapView } from './MapView';
import { Site, CreateSiteRequest } from '../../types';

// Example usage of the MapView component
export const MapViewExample: React.FC = () => {
  const [sites, setSites] = useState<Site[]>([
    {
      id: 1,
      name: 'Solar Farm California',
      site_type: 'solar',
      latitude: 36.7783,
      longitude: -119.4179,
      capacity_mw: 150,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 2,
      name: 'Wind Farm Texas',
      site_type: 'wind',
      latitude: 31.9686,
      longitude: -99.9018,
      capacity_mw: 200,
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
    },
    {
      id: 3,
      name: 'Solar Farm Arizona',
      site_type: 'solar',
      latitude: 34.0489,
      longitude: -111.0937,
      capacity_mw: 100,
      created_at: '2023-01-03T00:00:00Z',
      updated_at: '2023-01-03T00:00:00Z',
    },
  ]);

  const [selectedSite, setSelectedSite] = useState<Site | null>(null);

  // Example portfolios for demonstration
  const portfolios = [
    {
      id: 1,
      name: 'Western Portfolio',
      description: 'Solar farms in western states',
      sites: [sites[0], sites[2]], // California and Arizona solar farms
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 2,
      name: 'Texas Portfolio',
      description: 'Wind farms in Texas',
      sites: [sites[1]], // Texas wind farm
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
    },
  ];

  // Handle adding a new site
  const handleSiteAdd = (siteData: CreateSiteRequest) => {
    const newSite: Site = {
      id: Math.max(...sites.map(s => s.id)) + 1,
      ...siteData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    setSites(prevSites => [...prevSites, newSite]);
    console.log('Added new site:', newSite);
  };

  // Handle site selection
  const handleSiteSelect = (site: Site | null) => {
    setSelectedSite(site);
    console.log('Selected site:', site);
  };

  // Handle site update
  const handleSiteUpdate = (site: Site) => {
    console.log('Update site:', site);
    // In a real app, this would open an edit modal or navigate to edit page
    alert(`Edit site: ${site.name}`);
  };

  // Handle site deletion
  const handleSiteDelete = (siteId: number) => {
    if (window.confirm('Are you sure you want to delete this site?')) {
      setSites(prevSites => prevSites.filter(s => s.id !== siteId));
      if (selectedSite?.id === siteId) {
        setSelectedSite(null);
      }
      console.log('Deleted site with ID:', siteId);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Renewable Energy Sites Map</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Instructions:</h3>
        <ul>
          <li>Click on markers to view site details</li>
          <li>Click anywhere on the map to add a new site</li>
          <li>Use the Edit/Delete buttons in popups to manage sites</li>
        </ul>
      </div>

      {selectedSite && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          backgroundColor: '#f0f8ff', 
          borderRadius: '8px',
          border: '1px solid #ccc'
        }}>
          <h3>Selected Site: {selectedSite.name}</h3>
          <p><strong>Type:</strong> {selectedSite.site_type}</p>
          <p><strong>Capacity:</strong> {selectedSite.capacity_mw} MW</p>
          <p><strong>Location:</strong> {selectedSite.latitude.toFixed(4)}, {selectedSite.longitude.toFixed(4)}</p>
        </div>
      )}

      <div style={{ height: '600px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <MapView
          sites={sites}
          selectedSite={selectedSite}
          portfolios={portfolios}
          onSiteAdd={handleSiteAdd}
          onSiteSelect={handleSiteSelect}
          onSiteUpdate={handleSiteUpdate}
          onSiteDelete={handleSiteDelete}
          center={[39.8283, -98.5795]} // Center of USA
          zoom={4}
          height="100%"
          enableClickToAdd={true}
        />
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Site Statistics:</h3>
        <p><strong>Total Sites:</strong> {sites.length}</p>
        <p><strong>Solar Sites:</strong> {sites.filter(s => s.site_type === 'solar').length}</p>
        <p><strong>Wind Sites:</strong> {sites.filter(s => s.site_type === 'wind').length}</p>
        <p><strong>Total Capacity:</strong> {sites.reduce((sum, s) => sum + (s.capacity_mw || 0), 0)} MW</p>
      </div>
    </div>
  );
};

export default MapViewExample;