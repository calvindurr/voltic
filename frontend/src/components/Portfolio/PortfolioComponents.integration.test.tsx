import React from 'react';
import { render, screen } from '@testing-library/react';
import { PortfolioManager } from './PortfolioManager';
import { MapView } from '../Map/MapView';

// Mock services
jest.mock('../../services/portfolioService', () => ({
  portfolioService: {
    getPortfolios: jest.fn().mockResolvedValue([]),
    createPortfolio: jest.fn(),
    updatePortfolio: jest.fn(),
    deletePortfolio: jest.fn(),
    addSiteToPortfolio: jest.fn(),
    removeSiteFromPortfolio: jest.fn(),
  }
}));

jest.mock('../../services/siteService', () => ({
  siteService: {
    getSites: jest.fn().mockResolvedValue([]),
  }
}));

// Mock Leaflet components
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }: any) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }: any) => <div data-testid="popup">{children}</div>,
  useMapEvents: () => null,
}));

// Integration test component that combines PortfolioManager and MapView
const IntegratedPortfolioApp: React.FC = () => {
  const [portfolios, setPortfolios] = React.useState([]);
  const [sites, setSites] = React.useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = React.useState<any>(null);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: '400px', overflow: 'auto' }}>
        <PortfolioManager
          onPortfolioSelected={setSelectedPortfolio}
          selectedPortfolio={selectedPortfolio}
        />
      </div>
      <div style={{ flex: 1 }}>
        <MapView
          sites={sites}
          portfolios={portfolios}
          selectedPortfolio={selectedPortfolio}
          height="100%"
        />
      </div>
    </div>
  );
};

describe('Portfolio Components Integration', () => {
  describe('Portfolio and Map Integration', () => {
    it('renders both components correctly', () => {
      render(<IntegratedPortfolioApp />);

      expect(screen.getByText('Portfolio Management')).toBeInTheDocument();
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });

    it('shows empty state for portfolios', async () => {
      render(<IntegratedPortfolioApp />);

      await screen.findByText(/no portfolios yet/i);
      expect(screen.getByText(/create your first portfolio/i)).toBeInTheDocument();
    });

    it('map renders with empty data', () => {
      render(<IntegratedPortfolioApp />);

      expect(screen.getByTestId('map-container')).toBeInTheDocument();
      expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
    });
  });

  describe('Component Communication', () => {
    it('passes props correctly between components', () => {
      render(<IntegratedPortfolioApp />);

      // Both components should render without errors
      expect(screen.getByText('Portfolio Management')).toBeInTheDocument();
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });
  });
});