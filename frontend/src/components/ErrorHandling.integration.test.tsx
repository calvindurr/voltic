import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';
import { ErrorMessage } from './Error';
import { LoadingSpinner, SkeletonLoader } from './Loading';
import { useErrorHandler } from '../hooks';
import { ApiError } from '../types';

// Test component that uses the error handler hook
const TestComponent: React.FC<{ shouldThrow?: boolean; throwType?: string }> = ({ 
  shouldThrow = false, 
  throwType = 'api' 
}) => {
  const { error, isLoading, executeWithErrorHandling } = useErrorHandler();

  const handleAction = async () => {
    await executeWithErrorHandling(async () => {
      if (shouldThrow) {
        if (throwType === 'network') {
          throw {
            error: {
              code: 'NETWORK_ERROR',
              message: 'Unable to connect to server',
            },
          } as ApiError;
        } else if (throwType === 'validation') {
          throw {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              details: {
                name: ['This field is required'],
                email: ['Invalid email format'],
              },
            },
          } as ApiError;
        } else {
          throw {
            error: {
              code: 'SERVER_ERROR',
              message: 'Internal server error',
            },
          } as ApiError;
        }
      }
      return 'success';
    });
  };

  return (
    <div>
      <button onClick={handleAction}>Trigger Action</button>
      {isLoading && <LoadingSpinner text="Processing..." />}
      <ErrorMessage error={error} onRetry={handleAction} />
    </div>
  );
};

// Component that throws an error for ErrorBoundary testing
const ThrowingComponent: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Component error');
  }
  return <div>Component rendered successfully</div>;
};

describe('Error Handling Integration', () => {
  describe('ErrorBoundary Integration', () => {
    // Suppress console.error for these tests
    const originalError = console.error;
    beforeAll(() => {
      console.error = jest.fn();
    });

    afterAll(() => {
      console.error = originalError;
    });

    it('catches and displays component errors', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(/We're sorry, but something unexpected happened/)).toBeInTheDocument();
    });

    it('renders children normally when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Component rendered successfully')).toBeInTheDocument();
    });

    it('provides retry functionality', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: 'Try Again' });
      expect(retryButton).toBeInTheDocument();

      fireEvent.click(retryButton);
      // After retry, the error boundary should attempt to re-render
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('useErrorHandler Hook Integration', () => {
    it('handles successful operations', async () => {
      render(<TestComponent shouldThrow={false} />);

      const button = screen.getByRole('button', { name: 'Trigger Action' });
      fireEvent.click(button);

      // Should show loading state briefly
      expect(screen.getByText('Processing...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
      });

      // Should not show any error
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('handles network errors with retry functionality', async () => {
      render(<TestComponent shouldThrow={true} throwType="network" />);

      const button = screen.getByRole('button', { name: 'Trigger Action' });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Connection Error')).toBeInTheDocument();
        expect(screen.getByText('Unable to connect to server')).toBeInTheDocument();
      });

      // Should show retry button for network errors
      const retryButton = screen.getByRole('button', { name: 'Try Again' });
      expect(retryButton).toBeInTheDocument();
    });

    it('handles validation errors without retry button', async () => {
      render(<TestComponent shouldThrow={true} throwType="validation" />);

      const button = screen.getByRole('button', { name: 'Trigger Action' });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Validation Error')).toBeInTheDocument();
        expect(screen.getByText('Validation failed')).toBeInTheDocument();
        expect(screen.getByText('Please fix the following issues:')).toBeInTheDocument();
        expect(screen.getByText('name:')).toBeInTheDocument();
        expect(screen.getByText('This field is required')).toBeInTheDocument();
      });

      // Should not show retry button for validation errors
      expect(screen.queryByRole('button', { name: 'Try Again' })).not.toBeInTheDocument();
    });

    it('handles server errors with retry functionality', async () => {
      render(<TestComponent shouldThrow={true} throwType="server" />);

      const button = screen.getByRole('button', { name: 'Trigger Action' });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('Internal server error')).toBeInTheDocument();
      });

      // Should show retry button for server errors
      const retryButton = screen.getByRole('button', { name: 'Try Again' });
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe('Loading Components Integration', () => {
    it('renders loading spinner with text', () => {
      render(<LoadingSpinner text="Loading data..." />);

      expect(screen.getByText('Loading data...')).toBeInTheDocument();
      expect(document.querySelector('.loading-spinner')).toBeInTheDocument();
    });

    it('renders skeleton loader', () => {
      render(<SkeletonLoader count={3} />);

      const skeletons = document.querySelectorAll('.skeleton-loader');
      expect(skeletons).toHaveLength(3);
    });

    it('renders loading spinner as overlay', () => {
      render(<LoadingSpinner overlay={true} text="Processing..." />);

      expect(document.querySelector('.loading-spinner__overlay')).toBeInTheDocument();
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });
  });

  describe('Error Message Component Integration', () => {
    const mockRetry = jest.fn();
    const mockDismiss = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('displays API error with field details', () => {
      const apiError: ApiError = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Form validation failed',
          details: {
            username: ['Username is required', 'Username must be unique'],
            password: ['Password is too short'],
          },
        },
      };

      render(
        <ErrorMessage 
          error={apiError} 
          onRetry={mockRetry} 
          onDismiss={mockDismiss} 
        />
      );

      expect(screen.getByText('Validation Error')).toBeInTheDocument();
      expect(screen.getByText('Form validation failed')).toBeInTheDocument();
      expect(screen.getByText('Please fix the following issues:')).toBeInTheDocument();
      expect(screen.getByText('username:')).toBeInTheDocument();
      expect(screen.getByText('Username is required, Username must be unique')).toBeInTheDocument();
      expect(screen.getByText('password:')).toBeInTheDocument();
      expect(screen.getByText('Password is too short')).toBeInTheDocument();
    });

    it('handles retry and dismiss actions', () => {
      const networkError: ApiError = {
        error: {
          code: 'NETWORK_ERROR',
          message: 'Connection failed',
        },
      };

      render(
        <ErrorMessage 
          error={networkError} 
          onRetry={mockRetry} 
          onDismiss={mockDismiss} 
        />
      );

      // Test dismiss functionality
      const dismissButton = screen.getByRole('button', { name: 'Dismiss error' });
      fireEvent.click(dismissButton);
      expect(mockDismiss).toHaveBeenCalledTimes(1);

      // Test retry functionality
      const retryButton = screen.getByRole('button', { name: 'Try Again' });
      fireEvent.click(retryButton);
      expect(mockRetry).toHaveBeenCalledTimes(1);
    });

    it('applies different variants correctly', () => {
      const error = 'Test error message';

      const { rerender } = render(<ErrorMessage error={error} variant="banner" />);
      expect(screen.getByRole('alert')).toHaveClass('error-message--banner');

      rerender(<ErrorMessage error={error} variant="modal" />);
      expect(screen.getByRole('alert')).toHaveClass('error-message--modal');

      rerender(<ErrorMessage error={error} variant="inline" />);
      expect(screen.getByRole('alert')).toHaveClass('error-message--inline');
    });
  });

  describe('Complete Error Handling Workflow', () => {
    it('demonstrates complete error handling flow', async () => {
      const CompleteWorkflowComponent: React.FC = () => {
        const { error, isLoading, executeWithErrorHandling, clearError } = useErrorHandler();
        const [step, setStep] = React.useState(0);

        const steps = [
          { name: 'Success', shouldThrow: false },
          { name: 'Network Error', shouldThrow: true, type: 'network' },
          { name: 'Validation Error', shouldThrow: true, type: 'validation' },
          { name: 'Server Error', shouldThrow: true, type: 'server' },
        ];

        const executeStep = async () => {
          const currentStep = steps[step];
          await executeWithErrorHandling(async () => {
            if (currentStep.shouldThrow) {
              throw {
                error: {
                  code: currentStep.type === 'network' ? 'NETWORK_ERROR' : 
                        currentStep.type === 'validation' ? 'VALIDATION_ERROR' : 'SERVER_ERROR',
                  message: `${currentStep.name} occurred`,
                  details: currentStep.type === 'validation' ? { field: ['Error'] } : undefined,
                },
              } as ApiError;
            }
            return 'success';
          });
        };

        return (
          <ErrorBoundary>
            <div>
              <h3>Error Handling Workflow Demo</h3>
              <div>
                <button onClick={executeStep} disabled={isLoading}>
                  Execute Step: {steps[step].name}
                </button>
                <button 
                  onClick={() => setStep((prev) => (prev + 1) % steps.length)}
                  disabled={isLoading}
                >
                  Next Step
                </button>
                <button onClick={clearError}>Clear Error</button>
              </div>
              
              {isLoading && <LoadingSpinner text="Executing step..." />}
              
              <ErrorMessage 
                error={error} 
                onRetry={executeStep} 
                onDismiss={clearError}
                variant="inline"
              />
              
              {!error && !isLoading && (
                <div>Step completed successfully!</div>
              )}
            </div>
          </ErrorBoundary>
        );
      };

      render(<CompleteWorkflowComponent />);

      // Test success case
      expect(screen.getByText('Execute Step: Success')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Execute Step: Success'));

      await waitFor(() => {
        expect(screen.getByText('Step completed successfully!')).toBeInTheDocument();
      });

      // Move to network error step
      fireEvent.click(screen.getByText('Next Step'));
      expect(screen.getByText('Execute Step: Network Error')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Execute Step: Network Error'));

      await waitFor(() => {
        expect(screen.getByText('Connection Error')).toBeInTheDocument();
        expect(screen.getByText('Network Error occurred')).toBeInTheDocument();
      });

      // Test clear error
      fireEvent.click(screen.getByText('Clear Error'));
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});