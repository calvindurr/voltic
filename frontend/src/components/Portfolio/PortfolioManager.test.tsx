import React from 'react';
import { render, screen } from '@testing-library/react';
import { PortfolioManager } from './PortfolioManager';

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

describe('PortfolioManager', () => {
  const mockOnPortfolioCreated = jest.fn();
  const mockOnPortfolioUpdated = jest.fn();
  const mockOnPortfolioDeleted = jest.fn();
  const mockOnPortfolioSelected = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders portfolio manager correctly', () => {
      render(<PortfolioManager />);

      expect(screen.getByText('Portfolio Management')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create portfolio/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/search portfolios/i)).toBeInTheDocument();
    });

    it('shows empty state when no portfolios exist', async () => {
      render(<PortfolioManager />);

      await screen.findByText(/no portfolios yet/i);
      expect(screen.getByText(/create your first portfolio/i)).toBeInTheDocument();
    });
  });

  describe('Portfolio Creation', () => {
    it('opens create modal when create button is clicked', () => {
      render(<PortfolioManager />);

      const createButton = screen.getByRole('button', { name: /create portfolio/i });
      createButton.click();

      expect(screen.getByText('Create Portfolio')).toBeInTheDocument();
      expect(screen.getByLabelText(/portfolio name/i)).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('accepts callback props', () => {
      render(
        <PortfolioManager
          onPortfolioCreated={mockOnPortfolioCreated}
          onPortfolioUpdated={mockOnPortfolioUpdated}
          onPortfolioDeleted={mockOnPortfolioDeleted}
          onPortfolioSelected={mockOnPortfolioSelected}
        />
      );

      expect(screen.getByText('Portfolio Management')).toBeInTheDocument();
    });

    it('accepts className prop', () => {
      const { container } = render(
        <PortfolioManager className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('portfolio-manager', 'custom-class');
    });
  });
});