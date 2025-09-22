import { ApiError } from '../types';

export function getErrorMessage(error: ApiError | Error | string): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if ('error' in error) {
    return error.error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}

export function getFieldErrors(error: ApiError): Record<string, string[]> | null {
  if ('error' in error && error.error.details) {
    return error.error.details;
  }
  return null;
}

export function isNetworkError(error: ApiError): boolean {
  return 'error' in error && (
    error.error.code === 'NETWORK_ERROR' || 
    error.error.code === 'TIMEOUT_ERROR'
  );
}

export function isValidationError(error: ApiError): boolean {
  return 'error' in error && error.error.code === 'VALIDATION_ERROR';
}

export function isAuthError(error: ApiError): boolean {
  return 'error' in error && (
    error.error.code === 'UNAUTHORIZED' || 
    error.error.code === 'FORBIDDEN'
  );
}

export function isServerError(error: ApiError): boolean {
  return 'error' in error && (
    error.error.code === 'SERVER_ERROR' || 
    error.error.code === 'SERVICE_UNAVAILABLE'
  );
}

export function isRetryableError(error: ApiError): boolean {
  return isNetworkError(error) || isServerError(error) || 
    ('error' in error && error.error.code === 'RATE_LIMIT');
}

export function getErrorSeverity(error: ApiError): 'low' | 'medium' | 'high' {
  if (!('error' in error)) return 'medium';
  
  const { code } = error.error;
  
  if (code === 'VALIDATION_ERROR' || code === 'NOT_FOUND') {
    return 'low';
  }
  
  if (isAuthError(error) || isServerError(error)) {
    return 'high';
  }
  
  return 'medium';
}

export function shouldShowRetryButton(error: ApiError): boolean {
  return isRetryableError(error);
}

export function getErrorActionText(error: ApiError): string {
  if (!('error' in error)) return 'Try Again';
  
  const { code } = error.error;
  
  switch (code) {
    case 'NETWORK_ERROR':
    case 'TIMEOUT_ERROR':
      return 'Retry';
    case 'RATE_LIMIT':
      return 'Try Again Later';
    case 'SERVER_ERROR':
    case 'SERVICE_UNAVAILABLE':
      return 'Retry';
    default:
      return 'Try Again';
  }
}