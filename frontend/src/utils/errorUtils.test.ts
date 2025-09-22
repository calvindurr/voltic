import {
  getErrorMessage,
  getFieldErrors,
  isNetworkError,
  isValidationError,
  isAuthError,
  isServerError,
  isRetryableError,
  getErrorSeverity,
  shouldShowRetryButton,
  getErrorActionText,
} from './errorUtils';
import { ApiError } from '../types';

describe('errorUtils', () => {
  describe('getErrorMessage', () => {
    it('returns string error as-is', () => {
      expect(getErrorMessage('Test error')).toBe('Test error');
    });

    it('returns Error object message', () => {
      const error = new Error('Error object message');
      expect(getErrorMessage(error)).toBe('Error object message');
    });

    it('returns ApiError message', () => {
      const apiError: ApiError = {
        error: {
          code: 'TEST_ERROR',
          message: 'API error message',
        },
      };
      expect(getErrorMessage(apiError)).toBe('API error message');
    });

    it('returns default message for unknown error types', () => {
      expect(getErrorMessage({} as any)).toBe('An unexpected error occurred');
    });
  });

  describe('getFieldErrors', () => {
    it('returns field errors from ApiError', () => {
      const apiError: ApiError = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: {
            name: ['Required field'],
            email: ['Invalid format'],
          },
        },
      };

      const fieldErrors = getFieldErrors(apiError);
      expect(fieldErrors).toEqual({
        name: ['Required field'],
        email: ['Invalid format'],
      });
    });

    it('returns null when no details present', () => {
      const apiError: ApiError = {
        error: {
          code: 'TEST_ERROR',
          message: 'Test message',
        },
      };

      expect(getFieldErrors(apiError)).toBeNull();
    });
  });

  describe('isNetworkError', () => {
    it('returns true for NETWORK_ERROR', () => {
      const error: ApiError = {
        error: { code: 'NETWORK_ERROR', message: 'Network error' },
      };
      expect(isNetworkError(error)).toBe(true);
    });

    it('returns true for TIMEOUT_ERROR', () => {
      const error: ApiError = {
        error: { code: 'TIMEOUT_ERROR', message: 'Timeout error' },
      };
      expect(isNetworkError(error)).toBe(true);
    });

    it('returns false for other errors', () => {
      const error: ApiError = {
        error: { code: 'VALIDATION_ERROR', message: 'Validation error' },
      };
      expect(isNetworkError(error)).toBe(false);
    });
  });

  describe('isValidationError', () => {
    it('returns true for VALIDATION_ERROR', () => {
      const error: ApiError = {
        error: { code: 'VALIDATION_ERROR', message: 'Validation error' },
      };
      expect(isValidationError(error)).toBe(true);
    });

    it('returns false for other errors', () => {
      const error: ApiError = {
        error: { code: 'NETWORK_ERROR', message: 'Network error' },
      };
      expect(isValidationError(error)).toBe(false);
    });
  });

  describe('isAuthError', () => {
    it('returns true for UNAUTHORIZED', () => {
      const error: ApiError = {
        error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
      };
      expect(isAuthError(error)).toBe(true);
    });

    it('returns true for FORBIDDEN', () => {
      const error: ApiError = {
        error: { code: 'FORBIDDEN', message: 'Forbidden' },
      };
      expect(isAuthError(error)).toBe(true);
    });

    it('returns false for other errors', () => {
      const error: ApiError = {
        error: { code: 'NETWORK_ERROR', message: 'Network error' },
      };
      expect(isAuthError(error)).toBe(false);
    });
  });

  describe('isServerError', () => {
    it('returns true for SERVER_ERROR', () => {
      const error: ApiError = {
        error: { code: 'SERVER_ERROR', message: 'Server error' },
      };
      expect(isServerError(error)).toBe(true);
    });

    it('returns true for SERVICE_UNAVAILABLE', () => {
      const error: ApiError = {
        error: { code: 'SERVICE_UNAVAILABLE', message: 'Service unavailable' },
      };
      expect(isServerError(error)).toBe(true);
    });

    it('returns false for other errors', () => {
      const error: ApiError = {
        error: { code: 'VALIDATION_ERROR', message: 'Validation error' },
      };
      expect(isServerError(error)).toBe(false);
    });
  });

  describe('isRetryableError', () => {
    it('returns true for network errors', () => {
      const error: ApiError = {
        error: { code: 'NETWORK_ERROR', message: 'Network error' },
      };
      expect(isRetryableError(error)).toBe(true);
    });

    it('returns true for server errors', () => {
      const error: ApiError = {
        error: { code: 'SERVER_ERROR', message: 'Server error' },
      };
      expect(isRetryableError(error)).toBe(true);
    });

    it('returns true for rate limit errors', () => {
      const error: ApiError = {
        error: { code: 'RATE_LIMIT', message: 'Rate limit exceeded' },
      };
      expect(isRetryableError(error)).toBe(true);
    });

    it('returns false for validation errors', () => {
      const error: ApiError = {
        error: { code: 'VALIDATION_ERROR', message: 'Validation error' },
      };
      expect(isRetryableError(error)).toBe(false);
    });
  });

  describe('getErrorSeverity', () => {
    it('returns low for validation errors', () => {
      const error: ApiError = {
        error: { code: 'VALIDATION_ERROR', message: 'Validation error' },
      };
      expect(getErrorSeverity(error)).toBe('low');
    });

    it('returns low for not found errors', () => {
      const error: ApiError = {
        error: { code: 'NOT_FOUND', message: 'Not found' },
      };
      expect(getErrorSeverity(error)).toBe('low');
    });

    it('returns high for auth errors', () => {
      const error: ApiError = {
        error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
      };
      expect(getErrorSeverity(error)).toBe('high');
    });

    it('returns high for server errors', () => {
      const error: ApiError = {
        error: { code: 'SERVER_ERROR', message: 'Server error' },
      };
      expect(getErrorSeverity(error)).toBe('high');
    });

    it('returns medium for other errors', () => {
      const error: ApiError = {
        error: { code: 'NETWORK_ERROR', message: 'Network error' },
      };
      expect(getErrorSeverity(error)).toBe('medium');
    });
  });

  describe('shouldShowRetryButton', () => {
    it('returns true for retryable errors', () => {
      const error: ApiError = {
        error: { code: 'NETWORK_ERROR', message: 'Network error' },
      };
      expect(shouldShowRetryButton(error)).toBe(true);
    });

    it('returns false for non-retryable errors', () => {
      const error: ApiError = {
        error: { code: 'VALIDATION_ERROR', message: 'Validation error' },
      };
      expect(shouldShowRetryButton(error)).toBe(false);
    });
  });

  describe('getErrorActionText', () => {
    it('returns "Retry" for network errors', () => {
      const error: ApiError = {
        error: { code: 'NETWORK_ERROR', message: 'Network error' },
      };
      expect(getErrorActionText(error)).toBe('Retry');
    });

    it('returns "Retry" for timeout errors', () => {
      const error: ApiError = {
        error: { code: 'TIMEOUT_ERROR', message: 'Timeout error' },
      };
      expect(getErrorActionText(error)).toBe('Retry');
    });

    it('returns "Try Again Later" for rate limit errors', () => {
      const error: ApiError = {
        error: { code: 'RATE_LIMIT', message: 'Rate limit' },
      };
      expect(getErrorActionText(error)).toBe('Try Again Later');
    });

    it('returns "Retry" for server errors', () => {
      const error: ApiError = {
        error: { code: 'SERVER_ERROR', message: 'Server error' },
      };
      expect(getErrorActionText(error)).toBe('Retry');
    });

    it('returns "Try Again" for other errors', () => {
      const error: ApiError = {
        error: { code: 'UNKNOWN_ERROR', message: 'Unknown error' },
      };
      expect(getErrorActionText(error)).toBe('Try Again');
    });
  });
});