import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorMessage from './ErrorMessage';
import { ApiError } from '../../types';

describe('ErrorMessage', () => {
  const mockOnRetry = jest.fn();
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when error is null', () => {
    const { container } = render(<ErrorMessage error={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders string error message', () => {
    render(<ErrorMessage error="Test error message" />);
    
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('renders Error object message', () => {
    const error = new Error('Test error object');
    render(<ErrorMessage error={error} />);
    
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Test error object')).toBeInTheDocument();
  });

  it('renders ApiError with proper styling', () => {
    const apiError: ApiError = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: {
          name: ['This field is required'],
          email: ['Invalid email format'],
        },
      },
    };

    render(<ErrorMessage error={apiError} />);
    
    expect(screen.getByText('Validation Error')).toBeInTheDocument();
    expect(screen.getByText('Validation failed')).toBeInTheDocument();
    expect(screen.getByText('Please fix the following issues:')).toBeInTheDocument();
    expect(screen.getByText('name:')).toBeInTheDocument();
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByText('email:')).toBeInTheDocument();
    expect(screen.getByText('Invalid email format')).toBeInTheDocument();
  });

  it('renders network error with appropriate styling', () => {
    const networkError: ApiError = {
      error: {
        code: 'NETWORK_ERROR',
        message: 'Unable to connect to server',
      },
    };

    render(<ErrorMessage error={networkError} />);
    
    expect(screen.getByText('Connection Error')).toBeInTheDocument();
    expect(screen.getByText('Unable to connect to server')).toBeInTheDocument();
    expect(screen.getByText('🌐')).toBeInTheDocument();
  });

  it('shows retry button for retryable errors', () => {
    const networkError: ApiError = {
      error: {
        code: 'NETWORK_ERROR',
        message: 'Network error',
      },
    };

    render(<ErrorMessage error={networkError} onRetry={mockOnRetry} />);
    
    const retryButton = screen.getByRole('button', { name: 'Try Again' });
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it('hides retry button for validation errors', () => {
    const validationError: ApiError = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
      },
    };

    render(<ErrorMessage error={validationError} onRetry={mockOnRetry} />);
    
    expect(screen.queryByRole('button', { name: 'Try Again' })).not.toBeInTheDocument();
  });

  it('shows dismiss button when onDismiss is provided', () => {
    render(<ErrorMessage error="Test error" onDismiss={mockOnDismiss} />);
    
    const dismissButton = screen.getByRole('button', { name: 'Dismiss error' });
    expect(dismissButton).toBeInTheDocument();
    
    fireEvent.click(dismissButton);
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('applies correct variant classes', () => {
    const { rerender } = render(<ErrorMessage error="Test" variant="banner" />);
    expect(screen.getByRole('alert')).toHaveClass('error-message--banner');

    rerender(<ErrorMessage error="Test" variant="modal" />);
    expect(screen.getByRole('alert')).toHaveClass('error-message--modal');

    rerender(<ErrorMessage error="Test" variant="inline" />);
    expect(screen.getByRole('alert')).toHaveClass('error-message--inline');
  });

  it('applies custom className', () => {
    render(<ErrorMessage error="Test" className="custom-class" />);
    expect(screen.getByRole('alert')).toHaveClass('custom-class');
  });

  it('hides retry button when showRetry is false', () => {
    const networkError: ApiError = {
      error: {
        code: 'NETWORK_ERROR',
        message: 'Network error',
      },
    };

    render(<ErrorMessage error={networkError} onRetry={mockOnRetry} showRetry={false} />);
    
    expect(screen.queryByRole('button', { name: 'Try Again' })).not.toBeInTheDocument();
  });

  it('handles server errors correctly', () => {
    const serverError: ApiError = {
      error: {
        code: 'SERVER_ERROR',
        message: 'Internal server error',
      },
    };

    render(<ErrorMessage error={serverError} />);
    
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Internal server error')).toBeInTheDocument();
    expect(screen.getByText('❌')).toBeInTheDocument();
  });
});