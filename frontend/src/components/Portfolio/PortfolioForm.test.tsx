import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PortfolioForm } from './PortfolioForm';
import { Portfolio, CreatePortfolioRequest } from '../../types';

// Mock portfolio data
const mockPortfolio: Portfolio = {
  id: 1,
  name: 'Test Portfolio',
  description: 'Test portfolio description',
  sites: [],
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

describe('PortfolioForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders create form correctly', () => {
      render(
        <PortfolioForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByLabelText(/portfolio name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create portfolio/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('renders edit form correctly with portfolio data', () => {
      render(
        <PortfolioForm
          portfolio={mockPortfolio}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByDisplayValue(mockPortfolio.name)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockPortfolio.description)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update portfolio/i })).toBeInTheDocument();
    });

    it('shows loading state correctly', () => {
      render(
        <PortfolioForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isLoading={true}
        />
      );

      expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    });

    it('displays error message when provided', () => {
      const errorMessage = 'Test error message';
      render(
        <PortfolioForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          error={errorMessage}
        />
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('validates required portfolio name', async () => {
      render(
        <PortfolioForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText(/portfolio name/i);
      const submitButton = screen.getByRole('button', { name: /create portfolio/i });

      // Focus and blur the input to trigger validation
      fireEvent.focus(nameInput);
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByText(/portfolio name is required/i)).toBeInTheDocument();
      });

      // Try to submit without name
      fireEvent.click(submitButton);
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('validates minimum name length', async () => {
      render(
        <PortfolioForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText(/portfolio name/i);
      
      fireEvent.change(nameInput, { target: { value: 'A' } });
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByText(/portfolio name must be at least 2 characters/i)).toBeInTheDocument();
      });
    });

    it('shows character count for description', () => {
      render(
        <PortfolioForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('0/1000 characters')).toBeInTheDocument();
    });

    it('updates character count as user types', () => {
      render(
        <PortfolioForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const descriptionInput = screen.getByLabelText(/description/i);
      fireEvent.change(descriptionInput, { target: { value: 'Test description' } });

      expect(screen.getByText('16/1000 characters')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('submits valid form data for create', async () => {
      mockOnSubmit.mockResolvedValue(undefined);

      render(
        <PortfolioForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText(/portfolio name/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const submitButton = screen.getByRole('button', { name: /create portfolio/i });

      fireEvent.change(nameInput, { target: { value: 'New Portfolio' } });
      fireEvent.change(descriptionInput, { target: { value: 'New portfolio description' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'New Portfolio',
          description: 'New portfolio description',
        });
      });
    });

    it('disables submit button when form is invalid', () => {
      render(
        <PortfolioForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const submitButton = screen.getByRole('button', { name: /create portfolio/i });
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when form is valid', () => {
      render(
        <PortfolioForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText(/portfolio name/i);
      const submitButton = screen.getByRole('button', { name: /create portfolio/i });

      fireEvent.change(nameInput, { target: { value: 'Valid Portfolio Name' } });

      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Form Interactions', () => {
    it('calls onCancel when cancel button is clicked', () => {
      render(
        <PortfolioForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('resets form when portfolio prop changes', () => {
      const { rerender } = render(
        <PortfolioForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Initially empty form
      expect(screen.getByLabelText(/portfolio name/i)).toHaveValue('');

      // Rerender with portfolio data
      rerender(
        <PortfolioForm
          portfolio={mockPortfolio}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByLabelText(/portfolio name/i)).toHaveValue(mockPortfolio.name);
      expect(screen.getByLabelText(/description/i)).toHaveValue(mockPortfolio.description);
    });
  });

  describe('Accessibility', () => {
    it('associates labels with form inputs', () => {
      render(
        <PortfolioForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText(/portfolio name/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      expect(nameInput).toHaveAttribute('id');
      expect(descriptionInput).toHaveAttribute('id');
    });

    it('marks required fields appropriately', () => {
      render(
        <PortfolioForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('*')).toBeInTheDocument(); // Required indicator
    });
  });
});