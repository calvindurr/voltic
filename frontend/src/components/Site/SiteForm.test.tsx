import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import SiteForm from './SiteForm';
import { Site, CreateSiteRequest } from '../../types';

// Mock CSS imports
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

describe('SiteForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
  };

  const mockSite: Site = {
    id: 1,
    name: 'Test Solar Site',
    site_type: 'solar' as const,
    latitude: 40.7128,
    longitude: -74.0060,
    capacity_mw: 100.5,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders create form correctly', () => {
      render(<SiteForm {...defaultProps} />);
      
      expect(screen.getByLabelText(/site name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/site type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/latitude/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/longitude/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/capacity/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create site/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('renders edit form correctly with site data', () => {
      render(<SiteForm {...defaultProps} site={mockSite} />);
      
      expect(screen.getByDisplayValue('Test Solar Site')).toBeInTheDocument();
      expect(screen.getByDisplayValue('40.7128')).toBeInTheDocument();
      expect(screen.getByDisplayValue('-74.006')).toBeInTheDocument();
      expect(screen.getByDisplayValue('100.5')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update site/i })).toBeInTheDocument();
      
      // Check that solar is selected
      const siteTypeSelect = screen.getByLabelText(/site type/i) as HTMLSelectElement;
      expect(siteTypeSelect.value).toBe('solar');
    });

    it('shows loading state correctly', () => {
      render(<SiteForm {...defaultProps} isLoading={true} />);
      
      expect(screen.getByText(/creating.../i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /creating.../i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    });

    it('displays error message', () => {
      const errorMessage = 'Something went wrong';
      render(<SiteForm {...defaultProps} error={errorMessage} />);
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('validates required fields', async () => {
      render(<SiteForm {...defaultProps} />);
      
      const submitButton = screen.getByRole('button', { name: /create site/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/site name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/latitude is required/i)).toBeInTheDocument();
        expect(screen.getByText(/longitude is required/i)).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('validates site name length', async () => {
      render(<SiteForm {...defaultProps} />);
      
      const nameInput = screen.getByLabelText(/site name/i);
      
      // Test minimum length
      fireEvent.change(nameInput, { target: { value: 'A' } });
      fireEvent.blur(nameInput);
      
      await waitFor(() => {
        expect(screen.getByText(/site name must be at least 2 characters/i)).toBeInTheDocument();
      });
    });

    it('validates latitude range', async () => {
      render(<SiteForm {...defaultProps} />);
      
      const latInput = screen.getByLabelText(/latitude/i);
      
      // Test invalid number
      fireEvent.change(latInput, { target: { value: 'invalid' } });
      fireEvent.blur(latInput);
      
      await waitFor(() => {
        expect(screen.getByText(/latitude must be a valid number/i)).toBeInTheDocument();
      });
      
      // Test out of range
      fireEvent.change(latInput, { target: { value: '91' } });
      fireEvent.blur(latInput);
      
      await waitFor(() => {
        expect(screen.getByText(/latitude must be between -90 and 90/i)).toBeInTheDocument();
      });
    });

    it('validates longitude range', async () => {
      render(<SiteForm {...defaultProps} />);
      
      const lngInput = screen.getByLabelText(/longitude/i);
      
      // Test invalid number
      fireEvent.change(lngInput, { target: { value: 'invalid' } });
      fireEvent.blur(lngInput);
      
      await waitFor(() => {
        expect(screen.getByText(/longitude must be a valid number/i)).toBeInTheDocument();
      });
      
      // Test out of range
      fireEvent.change(lngInput, { target: { value: '181' } });
      fireEvent.blur(lngInput);
      
      await waitFor(() => {
        expect(screen.getByText(/longitude must be between -180 and 180/i)).toBeInTheDocument();
      });
    });

    it('validates capacity when provided', async () => {
      render(<SiteForm {...defaultProps} />);
      
      const capacityInput = screen.getByLabelText(/capacity/i);
      
      // Test invalid number
      fireEvent.change(capacityInput, { target: { value: 'invalid' } });
      fireEvent.blur(capacityInput);
      
      await waitFor(() => {
        expect(screen.getByText(/capacity must be a valid number/i)).toBeInTheDocument();
      });
      
      // Test negative number
      fireEvent.change(capacityInput, { target: { value: '-10' } });
      fireEvent.blur(capacityInput);
      
      await waitFor(() => {
        expect(screen.getByText(/capacity must be positive/i)).toBeInTheDocument();
      });
    });

    it('allows empty capacity field', async () => {
      render(<SiteForm {...defaultProps} />);
      
      const capacityInput = screen.getByLabelText(/capacity/i);
      fireEvent.change(capacityInput, { target: { value: '' } });
      fireEvent.blur(capacityInput);
      
      // Should not show validation error for empty capacity
      expect(screen.queryByText(/capacity must be/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('submits valid form data for create', async () => {
      mockOnSubmit.mockResolvedValue(undefined);
      
      render(<SiteForm {...defaultProps} />);
      
      // Fill out form
      fireEvent.change(screen.getByLabelText(/site name/i), { target: { value: 'New Solar Site' } });
      fireEvent.change(screen.getByLabelText(/site type/i), { target: { value: 'solar' } });
      fireEvent.change(screen.getByLabelText(/latitude/i), { target: { value: '40.7128' } });
      fireEvent.change(screen.getByLabelText(/longitude/i), { target: { value: '-74.0060' } });
      fireEvent.change(screen.getByLabelText(/capacity/i), { target: { value: '150.5' } });
      
      fireEvent.click(screen.getByRole('button', { name: /create site/i }));
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'New Solar Site',
          site_type: 'solar',
          latitude: 40.7128,
          longitude: -74.0060,
          capacity_mw: 150.5,
        });
      });
    });

    it('submits without capacity when empty', async () => {
      mockOnSubmit.mockResolvedValue(undefined);
      
      render(<SiteForm {...defaultProps} />);
      
      // Fill out form without capacity
      fireEvent.change(screen.getByLabelText(/site name/i), { target: { value: 'Site Without Capacity' } });
      fireEvent.change(screen.getByLabelText(/latitude/i), { target: { value: '40.7128' } });
      fireEvent.change(screen.getByLabelText(/longitude/i), { target: { value: '-74.0060' } });
      
      fireEvent.click(screen.getByRole('button', { name: /create site/i }));
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Site Without Capacity',
          site_type: 'solar',
          latitude: 40.7128,
          longitude: -74.0060,
          capacity_mw: undefined,
        });
      });
    });

    it('disables submit button when form is invalid', () => {
      render(<SiteForm {...defaultProps} />);
      
      const submitButton = screen.getByRole('button', { name: /create site/i });
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when form is valid', async () => {
      render(<SiteForm {...defaultProps} />);
      
      // Fill out required fields
      fireEvent.change(screen.getByLabelText(/site name/i), { target: { value: 'Valid Site' } });
      fireEvent.change(screen.getByLabelText(/latitude/i), { target: { value: '40.7128' } });
      fireEvent.change(screen.getByLabelText(/longitude/i), { target: { value: '-74.0060' } });
      
      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /create site/i });
        expect(submitButton).toBeEnabled();
      });
    });
  });

  describe('User Interactions', () => {
    it('calls onCancel when cancel button is clicked', () => {
      render(<SiteForm {...defaultProps} />);
      
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('clears field errors when user starts typing', async () => {
      render(<SiteForm {...defaultProps} />);
      
      const nameInput = screen.getByLabelText(/site name/i);
      
      // Trigger validation error
      fireEvent.click(screen.getByRole('button', { name: /create site/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/site name is required/i)).toBeInTheDocument();
      });
      
      // Start typing to clear error
      fireEvent.change(nameInput, { target: { value: 'T' } });
      
      await waitFor(() => {
        expect(screen.queryByText(/site name is required/i)).not.toBeInTheDocument();
      });
    });

    it('updates site type selection', () => {
      render(<SiteForm {...defaultProps} />);
      
      const siteTypeSelect = screen.getByLabelText(/site type/i) as HTMLSelectElement;
      fireEvent.change(siteTypeSelect, { target: { value: 'wind' } });
      
      expect(siteTypeSelect.value).toBe('wind');
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      render(<SiteForm {...defaultProps} />);
      
      expect(screen.getByLabelText(/site name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/site type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/latitude/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/longitude/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/capacity/i)).toBeInTheDocument();
    });

    it('associates error messages with form fields', async () => {
      render(<SiteForm {...defaultProps} />);
      
      fireEvent.click(screen.getByRole('button', { name: /create site/i }));
      
      await waitFor(() => {
        const nameInput = screen.getByLabelText(/site name/i);
        const nameError = screen.getByText(/site name is required/i);
        
        expect(nameInput).toHaveClass('error');
        expect(nameError).toBeInTheDocument();
      });
    });
  });
});