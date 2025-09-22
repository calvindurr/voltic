import { useState, useCallback } from 'react';
import { ApiError } from '../types';

interface UseErrorHandlerReturn {
  error: ApiError | null;
  setError: (error: ApiError | null) => void;
  clearError: () => void;
  handleError: (error: any) => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  executeWithErrorHandling: <T>(
    asyncFn: () => Promise<T>,
    options?: {
      onSuccess?: (result: T) => void;
      onError?: (error: ApiError) => void;
      showLoading?: boolean;
    }
  ) => Promise<T | null>;
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setLoading] = useState(false);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((error: any) => {
    console.error('Error occurred:', error);
    
    // Convert different error types to ApiError format
    if (typeof error === 'string') {
      setError({
        error: {
          code: 'UNKNOWN_ERROR',
          message: error,
        },
      });
    } else if (error instanceof Error) {
      setError({
        error: {
          code: 'UNKNOWN_ERROR',
          message: error.message,
        },
      });
    } else if (error && 'error' in error) {
      setError(error as ApiError);
    } else {
      setError({
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred',
        },
      });
    }
  }, []);

  const executeWithErrorHandling = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options: {
      onSuccess?: (result: T) => void;
      onError?: (error: ApiError) => void;
      showLoading?: boolean;
    } = {}
  ): Promise<T | null> => {
    const { onSuccess, onError, showLoading = true } = options;
    
    try {
      clearError();
      if (showLoading) setLoading(true);
      
      const result = await asyncFn();
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const apiError = err as ApiError;
      handleError(apiError);
      
      if (onError) {
        onError(apiError);
      }
      
      return null;
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [clearError, handleError]);

  return {
    error,
    setError,
    clearError,
    handleError,
    isLoading,
    setLoading,
    executeWithErrorHandling,
  };
};