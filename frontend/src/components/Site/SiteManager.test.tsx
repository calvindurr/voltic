import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SiteManager from './SiteManager';
import { siteService } from '../../services/siteService';
import { Site } from '../../types';

// Mock the siteService
jest.mock('../../services/siteService');
const mockSiteService = siteService as jest.Mocked<typeof siteService>;

// Mock CSS imports
jest.mock('./SiteManager.css', () => ({}));
jest.mock('./SiteForm.css', () => ({}));

// Mock axios to prevent import issues
jest.mock('axios', () => ({
  default: {
    create: jest.fn(() => ({
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    })),
  },
}));

// Mock SiteForm component
jest.mock('./SiteForm', () => {
  return function MockSiteForm({ onSubmit, onCancel, site, isLoading }: any) {
    return (
      <div data-testid="site-form">
        <div>Site Form - {site ? 'Edit' : 'Create'} Mode</div>
        <div>Loading: {isLoading ? 'true' : 'false'}</div>
        <button onClick={() => onSubmit({
          name: 'Test Site',
          site_type: 'solar',
          latitude: 40.7128,
          longitude: -74.0060,
          capacity_mw: 100
        })}>
          Submit Form
        </button>
        <button onClick={onCancel}>Cancel Form</button>
      </div>
    );
  };
});

describe('SiteManager', () => {
  const mockSites: Site[] = [
    {
      id: 1,
      name: 'Solar Site 1',
      site_type: 'solar',
      latitude: 40.7128,
      longitude: -74.0060,
      capacity_mw: 100,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 2,
      name: 'Wind Site 1',
      site_type: 'wind',
      latitude: 41.8781,
      longitude: -87.6298,
      capacity_mw: 200,
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
    },
  ];

  const defaultProps = {
    onSiteCreated: jest.fn(),
    onSiteUpdated: jest.fn(),
    onSiteDeleted: jest.fn(),
    onSiteSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSiteService.getSites.mockResolvedValue(mockSites);
  });

  describe('Rendering and Initial Load', () => {
    it('renders site manager with header', async () => {
      render(<SiteManager {...defaultProps} />);
      
      expect(screen.getByText('Site Management')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add new site/i })).toBeInTheDocument();
      
      await waitFor(() => {
        expect(mockSiteService.getSites).toHaveBeenCalled();
      });
    });

    it('displays loading state initially', () => {
      render(<SiteManager {...defaultProps} />);
      
      expect(screen.getByText(/loading sites.../i)).toBeInTheDocument();
    });

    it('displays sites after loading', async () => {
      render(<SiteManager {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Solar Site 1')).toBeInTheDocument();
        expect(screen.getByText('Wind Site 1')).toBeInTheDocument();
      });
    });

    it('displays empty state when no sites', async () => {
      mockSiteService.getSites.mockResolvedValue([]);
      render(<SiteManager {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/no sites yet/i)).toBeInTheDocument();
        expect(screen.getByText(/get started by adding your first renewable energy site/i)).toBeInTheDocument();
      });
    });

    it('displays error state on load failure', async () => {
      mockSiteService.getSites.mockRejectedValue(new Error('Load failed'));
      render(<SiteManager {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to load sites/i)).toBeInTheDocument();
      });
    });
  });

  describe('Site Display and Interaction', () => {
    it('displays site information correctly', async () => {
      render(<SiteManager {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Solar Site 1')).toBeInTheDocument();
        expect(screen.getByText('☀️ solar')).toBeInTheDocument();
        expect(screen.getByText('40.712800, -74.006000')).toBeInTheDocument();
        expect(screen.getByText('100 MW')).toBeInTheDocument();
      });
    });

    it('handles site selection', async () => {
      render(<SiteManager {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Solar Site 1')).toBeInTheDocument();
      });
      
      const siteCard = screen.getByText('Solar Site 1').closest('.site-card');
      fireEvent.click(siteCard!);
      
      expect(defaultProps.onSiteSelect).toHaveBeenCalledWith(mockSites[0]);
    });

    it('highlights selected site', async () => {
      render(<SiteManager {...defaultProps} selectedSite={mockSites[0]} />);
      
      await waitFor(() => {
        const siteCard = screen.getByText('Solar Site 1').closest('.site-card');
        expect(siteCard).toHaveClass('selected');
      });
    });
  });

  describe('Search and Filtering', () => {
    it('filters sites by search term', async () => {
      render(<SiteManager {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Solar Site 1')).toBeInTheDocument();
        expect(screen.getByText('Wind Site 1')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText(/search sites.../i);
      fireEvent.change(searchInput, { target: { value: 'Solar' } });
      
      expect(screen.getByText('Solar Site 1')).toBeInTheDocument();
      expect(screen.queryByText('Wind Site 1')).not.toBeInTheDocument();
    });

    it('filters sites by type', async () => {
      render(<SiteManager {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Solar Site 1')).toBeInTheDocument();
        expect(screen.getByText('Wind Site 1')).toBeInTheDocument();
      });
      
      const filterSelect = screen.getByLabelText(/filter by type/i);
      fireEvent.change(filterSelect, { target: { value: 'wind' } });
      
      expect(screen.queryByText('Solar Site 1')).not.toBeInTheDocument();
      expect(screen.getByText('Wind Site 1')).toBeInTheDocument();
    });

    it('shows no results message when search yields no results', async () => {
      render(<SiteManager {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Solar Site 1')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText(/search sites.../i);
      fireEvent.change(searchInput, { target: { value: 'NonexistentSite' } });
      
      expect(screen.getByText(/no sites found/i)).toBeInTheDocument();
      expect(screen.getByText(/try adjusting your search or filter criteria/i)).toBeInTheDocument();
    });
  });

  describe('Site Creation', () => {
    it('opens create modal when add button is clicked', () => {
      render(<SiteManager {...defaultProps} />);
      
      fireEvent.click(screen.getByRole('button', { name: /add new site/i }));
      
      expect(screen.getByText('Add New Site')).toBeInTheDocument();
      expect(screen.getByTestId('site-form')).toBeInTheDocument();
    });

    it('creates new site successfully', async () => {
      const newSite: Site = {
        id: 3,
        name: 'Test Site',
        site_type: 'solar',
        latitude: 40.7128,
        longitude: -74.0060,
        capacity_mw: 100,
        created_at: '2023-01-03T00:00:00Z',
        updated_at: '2023-01-03T00:00:00Z',
      };
      
      mockSiteService.createSite.mockResolvedValue(newSite);
      render(<SiteManager {...defaultProps} />);
      
      fireEvent.click(screen.getByRole('button', { name: /add new site/i }));
      fireEvent.click(screen.getByText('Submit Form'));
      
      await waitFor(() => {
        expect(mockSiteService.createSite).toHaveBeenCalledWith({
          name: 'Test Site',
          site_type: 'solar',
          latitude: 40.7128,
          longitude: -74.0060,
          capacity_mw: 100,
        });
        expect(defaultProps.onSiteCreated).toHaveBeenCalledWith(newSite);
      });
    });

    it('closes modal on cancel', () => {
      render(<SiteManager {...defaultProps} />);
      
      fireEvent.click(screen.getByRole('button', { name: /add new site/i }));
      expect(screen.getByText('Add New Site')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Cancel Form'));
      expect(screen.queryByText('Add New Site')).not.toBeInTheDocument();
    });
  });

  describe('Site Editing', () => {
    it('opens edit modal when edit button is clicked', async () => {
      render(<SiteManager {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Solar Site 1')).toBeInTheDocument();
      });
      
      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);
      
      expect(screen.getByText('Edit Site')).toBeInTheDocument();
      expect(screen.getByTestId('site-form')).toBeInTheDocument();
    });

    it('updates site successfully', async () => {
      const updatedSite: Site = { ...mockSites[0], name: 'Updated Site' };
      
      mockSiteService.updateSite.mockResolvedValue(updatedSite);
      render(<SiteManager {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Solar Site 1')).toBeInTheDocument();
      });
      
      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);
      fireEvent.click(screen.getByText('Submit Form'));
      
      await waitFor(() => {
        expect(mockSiteService.updateSite).toHaveBeenCalledWith(1, {
          name: 'Test Site',
          site_type: 'solar',
          latitude: 40.7128,
          longitude: -74.0060,
          capacity_mw: 100,
        });
        expect(defaultProps.onSiteUpdated).toHaveBeenCalledWith(updatedSite);
      });
    });
  });

  describe('Site Deletion', () => {
    it('opens delete confirmation modal', async () => {
      render(<SiteManager {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Solar Site 1')).toBeInTheDocument();
      });
      
      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);
      
      expect(screen.getByText('Delete Site')).toBeInTheDocument();
      expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
      expect(screen.getByText('Solar Site 1')).toBeInTheDocument();
    });

    it('deletes site successfully', async () => {
      mockSiteService.deleteSite.mockResolvedValue();
      render(<SiteManager {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Solar Site 1')).toBeInTheDocument();
      });
      
      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);
      
      const confirmButton = screen.getByRole('button', { name: /delete site/i });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(mockSiteService.deleteSite).toHaveBeenCalledWith(1);
        expect(defaultProps.onSiteDeleted).toHaveBeenCalledWith(1);
      });
    });

    it('cancels delete operation', async () => {
      render(<SiteManager {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Solar Site 1')).toBeInTheDocument();
      });
      
      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);
      
      expect(screen.getByText('Delete Site')).toBeInTheDocument();
      
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(screen.queryByText('Delete Site')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays and dismisses error banner', async () => {
      mockSiteService.getSites.mockRejectedValue(new Error('Load failed'));
      render(<SiteManager {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to load sites/i)).toBeInTheDocument();
      });
      
      const closeButton = screen.getByLabelText(/close error/i);
      fireEvent.click(closeButton);
      
      expect(screen.queryByText(/failed to load sites/i)).not.toBeInTheDocument();
    });
  });
});