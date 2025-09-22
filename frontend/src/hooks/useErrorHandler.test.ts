import { renderHook, act } from '@testing-library/react';
import { useErrorHandler } from './useErrorHandler';
import { ApiError } from '../types';

// Mock console.error to avoid noise in test output
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('useErrorHandler', () => {
  it('initializes with no error and not loading', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('sets and clears errors', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    const apiError: ApiError = {
      error: {
        code: 'TEST_ERROR',
        message: 'Test error message',
      },
    };

    act(() => {
      result.current.setError(apiError);
    });

    expect(result.current.error).toEqual(apiError);

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('handles string errors', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    act(() => {
      result.current.handleError('String error message');
    });

    expect(result.current.error).toEqual({
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'String error message',
      },
    });
  });

  it('handles Error objects', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    const error = new Error('Error object message');
    
    act(() => {
      result.current.handleError(error);
    });

    expect(result.current.error).toEqual({
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'Error object message',
      },
    });
  });

  it('handles ApiError objects', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    const apiError: ApiError = {
      error: {
        code: 'API_ERROR',
        message: 'API error message',
        details: { field: ['Field error'] },
      },
    };
    
    act(() => {
      result.current.handleError(apiError);
    });

    expect(result.current.error).toEqual(apiError);
  });

  it('handles unknown error types', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    act(() => {
      result.current.handleError({ unknown: 'object' });
    });

    expect(result.current.error).toEqual({
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  });

  it('sets loading state', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.isLoading).toBe(true);

    act(() => {
      result.current.setLoading(false);
    });

    expect(result.current.isLoading).toBe(false);
  });

  describe('executeWithErrorHandling', () => {
    it('executes successful async function', async () => {
      const { result } = renderHook(() => useErrorHandler());
      
      const mockFn = jest.fn().mockResolvedValue('success');
      const mockOnSuccess = jest.fn();
      
      let returnValue: string | null = null;
      
      await act(async () => {
        returnValue = await result.current.executeWithErrorHandling(mockFn, {
          onSuccess: mockOnSuccess,
        });
      });

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockOnSuccess).toHaveBeenCalledWith('success');
      expect(returnValue).toBe('success');
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('handles async function errors', async () => {
      const { result } = renderHook(() => useErrorHandler());
      
      const apiError: ApiError = {
        error: {
          code: 'ASYNC_ERROR',
          message: 'Async error message',
        },
      };
      
      const mockFn = jest.fn().mockRejectedValue(apiError);
      const mockOnError = jest.fn();
      
      let returnValue: string | null = 'initial';
      
      await act(async () => {
        returnValue = await result.current.executeWithErrorHandling(mockFn, {
          onError: mockOnError,
        });
      });

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockOnError).toHaveBeenCalledWith(apiError);
      expect(returnValue).toBeNull();
      expect(result.current.error).toEqual(apiError);
      expect(result.current.isLoading).toBe(false);
    });

    it('manages loading state during execution', async () => {
      const { result } = renderHook(() => useErrorHandler());
      
      expect(result.current.isLoading).toBe(false);
      
      const mockFn = jest.fn().mockResolvedValue('success');
      
      await act(async () => {
        await result.current.executeWithErrorHandling(mockFn);
      });

      expect(result.current.isLoading).toBe(false);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('skips loading state when showLoading is false', async () => {
      const { result } = renderHook(() => useErrorHandler());
      
      const mockFn = jest.fn().mockResolvedValue('success');
      
      await act(async () => {
        await result.current.executeWithErrorHandling(mockFn, {
          showLoading: false,
        });
      });

      expect(result.current.isLoading).toBe(false);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('clears previous errors before execution', async () => {
      const { result } = renderHook(() => useErrorHandler());
      
      // Set an initial error
      act(() => {
        result.current.setError({
          error: { code: 'OLD_ERROR', message: 'Old error' },
        });
      });

      expect(result.current.error).not.toBeNull();
      
      const mockFn = jest.fn().mockResolvedValue('success');
      
      await act(async () => {
        await result.current.executeWithErrorHandling(mockFn);
      });

      expect(result.current.error).toBeNull();
    });
  });
});