import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { LatLng, Icon, DivIcon } from 'leaflet';
import { Site, CreateSiteRequest, Portfolio } from '../../types';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

// Fix for default markers in react-leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Configure default marker icons
const defaultIcon = new Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Portfolio colors for visual grouping
const PORTFOLIO_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#FFB347', // Orange
  '#87CEEB', // Sky Blue
  '#98FB98', // Pale Green
  '#F0E68C', // Khaki
];

// Create custom icons for different site types with portfolio colors
const createSiteIcon = (siteType: 'solar' | 'wind' | 'hydro', portfolioColor?: string) => {
  const emoji = siteType === 'solar' ? '☀️' : siteType === 'wind' ? '💨' : '💧';
  const borderColor = portfolioColor || '#3388ff';
  
  return new DivIcon({
    className: 'custom-marker portfolio-marker',
    html: `
      <div class="marker-content" style="border: 3px solid ${borderColor}; background-color: white; border-radius: 50%; padding: 2px;">
        <span style="font-size: 16px;">${emoji}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

export interface MapViewProps {
  sites: Site[];
  selectedSite?: Site | null;
  portfolios?: Portfolio[];
  selectedPortfolio?: Portfolio | null;
  onSiteAdd?: (siteData: CreateSiteRequest) => void;
  onSiteSelect?: (site: Site | null) => void;
  onSiteUpdate?: (site: Site) => void;
  onSiteDelete?: (siteId: number) => void;
  center?: [number, number];
  zoom?: number;
  height?: string;
  enableClickToAdd?: boolean;
}



// Component for handling map click events
interface MapClickHandlerProps {
  onMapClick: (latlng: LatLng) => void;
  enableClickToAdd: boolean;
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onMapClick, enableClickToAdd }) => {
  useMapEvents({
    click: (e) => {
      if (enableClickToAdd) {
        onMapClick(e.latlng);
      }
    },
  });
  return null;
};

export const MapView: React.FC<MapViewProps> = ({
  sites = [],
  selectedSite,
  portfolios = [],
  selectedPortfolio,
  onSiteAdd,
  onSiteSelect,
  onSiteUpdate,
  onSiteDelete,
  center = [39.8283, -98.5795], // Center of USA
  zoom = 4,
  height = '500px',
  enableClickToAdd = true,
}) => {
  const [showAddSiteModal, setShowAddSiteModal] = useState(false);
  const [newSitePosition, setNewSitePosition] = useState<LatLng | null>(null);
  const [newSiteForm, setNewSiteForm] = useState<Partial<CreateSiteRequest>>({
    name: '',
    site_type: 'solar',
    capacity_mw: undefined,
  });

  const mapRef = useRef<any>(null);

  // Handle map click for adding new sites
  const handleMapClick = useCallback((latlng: LatLng) => {
    if (enableClickToAdd && onSiteAdd) {
      setNewSitePosition(latlng);
      setNewSiteForm({
        name: '',
        site_type: 'solar',
        latitude: (latlng as any).lat || (latlng as any).mockLat,
        longitude: (latlng as any).lng || (latlng as any).mockLng,
        capacity_mw: undefined,
      });
      setShowAddSiteModal(true);
    }
  }, [enableClickToAdd, onSiteAdd]);

  // Handle site marker click
  const handleSiteClick = useCallback((site: Site) => {
    onSiteSelect?.(site);
  }, [onSiteSelect]);

  // Handle new site form submission
  const handleAddSite = useCallback(() => {
    if (newSiteForm.name && newSiteForm.site_type && newSitePosition && onSiteAdd) {
      const latitude = (newSitePosition as any).lat || (newSitePosition as any).mockLat;
      const longitude = (newSitePosition as any).lng || (newSitePosition as any).mockLng;
      
      // Validate coordinates
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        console.error('Invalid coordinates:', { latitude, longitude });
        return;
      }
      
      const siteData: CreateSiteRequest = {
        name: newSiteForm.name,
        site_type: newSiteForm.site_type as 'solar' | 'wind' | 'hydro',
        latitude,
        longitude,
        capacity_mw: newSiteForm.capacity_mw ? Number(newSiteForm.capacity_mw) : undefined,
      };
      
      console.log('Creating site with data:', siteData);
      onSiteAdd(siteData);
      setShowAddSiteModal(false);
      setNewSitePosition(null);
      setNewSiteForm({
        name: '',
        site_type: 'solar',
        capacity_mw: undefined,
      });
    }
  }, [newSiteForm, newSitePosition, onSiteAdd]);

  // Get portfolio for a site
  const getSitePortfolio = useCallback((site: Site): Portfolio | null => {
    return (portfolios || []).find(p => p.sites.some(s => s.id === site.id)) || null;
  }, [portfolios]);

  // Get portfolio color for site
  const getPortfolioColor = useCallback((portfolio: Portfolio | null): string => {
    if (!portfolio) return '#6b7280'; // Gray for sites not in any portfolio
    return PORTFOLIO_COLORS[portfolio.id % PORTFOLIO_COLORS.length];
  }, []);

  // Get icon for site with portfolio styling
  const getSiteIcon = useCallback((site: Site) => {
    const portfolio = getSitePortfolio(site);
    const portfolioColor = getPortfolioColor(portfolio);
    
    // Highlight selected portfolio sites
    const isInSelectedPortfolio = selectedPortfolio && portfolio?.id === selectedPortfolio.id;
    const finalColor = isInSelectedPortfolio ? portfolioColor : (portfolio ? portfolioColor : '#6b7280');
    
    return createSiteIcon(site.site_type, finalColor);
  }, [getSitePortfolio, getPortfolioColor, selectedPortfolio]);

  // Filter sites to show based on selected portfolio
  const sitesToShow = selectedPortfolio 
    ? (sites || []).filter(site => selectedPortfolio.sites.some(ps => ps.id === site.id))
    : (sites || []);

  return (
    <div className="map-view" style={{ height, width: '100%', position: 'relative' }}>
      <MapContainer
        ref={mapRef}
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapClickHandler 
          onMapClick={handleMapClick} 
          enableClickToAdd={enableClickToAdd}
        />

        {/* Render site markers */}
        {sitesToShow.map((site) => {
          const portfolio = getSitePortfolio(site);
          return (
            <Marker
              key={site.id}
              position={[site.latitude, site.longitude]}
              icon={getSiteIcon(site)}
              eventHandlers={{
                click: () => handleSiteClick(site),
              }}
            >
              <Popup>
                <div className="site-popup">
                  <h3>{site.name}</h3>
                  <p><strong>Type:</strong> {site.site_type}</p>
                  <p><strong>Coordinates:</strong> {site.latitude.toFixed(6)}, {site.longitude.toFixed(6)}</p>
                  {site.capacity_mw && (
                    <p><strong>Capacity:</strong> {site.capacity_mw} MW</p>
                  )}
                  {portfolio && (
                    <p><strong>Portfolio:</strong> 
                      <span style={{ 
                        color: getPortfolioColor(portfolio), 
                        fontWeight: 'bold',
                        marginLeft: '0.25rem'
                      }}>
                        {portfolio.name}
                      </span>
                    </p>
                  )}
                  <p><strong>Created:</strong> {new Date(site.created_at).toLocaleDateString()}</p>
                  
                  <div className="popup-actions">
                    <button 
                      type="button"
                      onClick={() => onSiteUpdate?.(site)}
                      className="btn btn-sm btn-primary"
                    >
                      Edit
                    </button>
                    <button 
                      type="button"
                      onClick={() => onSiteDelete?.(site.id)}
                      className="btn btn-sm btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Temporary marker for new site position */}
        {newSitePosition && (
          <Marker
            position={[
              (newSitePosition as any).lat || (newSitePosition as any).mockLat,
              (newSitePosition as any).lng || (newSitePosition as any).mockLng
            ]}
            icon={defaultIcon}
          >
            <Popup>
              <div>New site location</div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Add Site Modal */}
      {showAddSiteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New Site</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleAddSite(); }}>
              <div className="form-group">
                <label htmlFor="siteName">Site Name:</label>
                <input
                  id="siteName"
                  type="text"
                  value={newSiteForm.name || ''}
                  onChange={(e) => setNewSiteForm({ ...newSiteForm, name: e.target.value })}
                  required
                  placeholder="Enter site name"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="siteType">Site Type:</label>
                <select
                  id="siteType"
                  value={newSiteForm.site_type || 'solar'}
                  onChange={(e) => setNewSiteForm({ ...newSiteForm, site_type: e.target.value as 'solar' | 'wind' | 'hydro' })}
                  required
                >
                  <option value="solar">Solar</option>
                  <option value="wind">Wind</option>
                  <option value="hydro">Hydro</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="capacity">Capacity (MW):</label>
                <input
                  id="capacity"
                  type="number"
                  step="0.1"
                  min="0"
                  value={newSiteForm.capacity_mw || ''}
                  onChange={(e) => setNewSiteForm({ 
                    ...newSiteForm, 
                    capacity_mw: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                  placeholder="Optional capacity in MW"
                />
              </div>
              
              <div className="form-group">
                <label>Coordinates:</label>
                <p>
                  {((newSitePosition as any)?.lat || (newSitePosition as any)?.mockLat)?.toFixed(6)}, 
                  {((newSitePosition as any)?.lng || (newSitePosition as any)?.mockLng)?.toFixed(6)}
                </p>
              </div>
              
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">
                  Add Site
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowAddSiteModal(false);
                    setNewSitePosition(null);
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;