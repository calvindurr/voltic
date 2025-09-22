import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SiteForm from './SiteForm';
import SiteManager from './SiteManager';

// Mock CSS imports
jest.mock('./SiteForm.css', () => ({}));
jest.mock('./SiteManager.css', () => ({}));

// Mock axios
jest.mock('axios', () => ({
  default: {
    create: () => ({
      get: jest.fn().mockResolvedValue([]),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    }),
  },
}));

// Mock siteService
jest.mock('../../services/siteService', () => ({
  siteService: {
    getSites: jest.fn().mockResolvedValue([]),
    createSite: jest.fn(),
    updateSite: jest.fn(),
    deleteSite: jest.fn(),
  },
}));

describe('Site Components Integration', () => {
  describe('SiteForm', () => {
    it('renders without crashing', () => {
      const mockProps = {
        onSubmit: jest.fn(),
        onCancel: jest.fn(),
      };
      
      render(<SiteForm {...mockProps} />);
      
      expect(screen.getByLabelText(/site name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/site type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/latitude/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/longitude/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/capacity/i)).toBeInTheDocument();
    });

    it('has proper form structure', () => {
      const mockProps = {
        onSubmit: jest.fn(),
        onCancel: jest.fn(),
      };
      
      render(<SiteForm {...mockProps} />);
      
      expect(screen.getByRole('button', { name: /create site/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  describe('SiteManager', () => {
    it('renders without crashing', () => {
      const mockProps = {
        onSiteCreated: jest.fn(),
        onSiteUpdated: jest.fn(),
        onSiteDeleted: jest.fn(),
        onSiteSelect: jest.fn(),
      };
      
      render(<SiteManager {...mockProps} />);
      
      expect(screen.getByText('Site Management')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add new site/i })).toBeInTheDocument();
    });

    it('has search and filter functionality', () => {
      const mockProps = {
        onSiteCreated: jest.fn(),
        onSiteUpdated: jest.fn(),
        onSiteDeleted: jest.fn(),
        onSiteSelect: jest.fn(),
      };
      
      render(<SiteManager {...mockProps} />);
      
      expect(screen.getByPlaceholderText(/search sites.../i)).toBeInTheDocument();
      expect(screen.getByLabelText(/filter by type/i)).toBeInTheDocument();
    });
  });
});