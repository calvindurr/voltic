import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { ApiResponse, ApiError } from '../types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error: AxiosError) => {
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: AxiosError): ApiError {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data as any;

      // Handle specific HTTP status codes
      switch (status) {
        case 400:
          return {
            error: {
              code: data?.error?.code || 'VALIDATION_ERROR',
              message: data?.error?.message || 'Invalid request data. Please check your input.',
              details: data?.error?.details || data,
            },
          };
        
        case 401:
          // Handle unauthorized - clear token and redirect to login
          localStorage.removeItem('authToken');
          return {
            error: {
              code: 'UNAUTHORIZED',
              message: 'Your session has expired. Please log in again.',
            },
          };
        
        case 403:
          return {
            error: {
              code: 'FORBIDDEN',
              message: 'You do not have permission to perform this action.',
            },
          };
        
        case 404:
          return {
            error: {
              code: 'NOT_FOUND',
              message: data?.error?.message || 'The requested resource was not found.',
            },
          };
        
        case 409:
          return {
            error: {
              code: 'CONFLICT',
              message: data?.error?.message || 'A conflict occurred. The resource may already exist.',
              details: data?.error?.details,
            },
          };
        
        case 422:
          return {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed. Please check your input.',
              details: data?.error?.details || data,
            },
          };
        
        case 429:
          return {
            error: {
              code: 'RATE_LIMIT',
              message: 'Too many requests. Please wait a moment and try again.',
            },
          };
        
        case 500:
          return {
            error: {
              code: 'SERVER_ERROR',
              message: 'An internal server error occurred. Please try again later.',
            },
          };
        
        case 502:
        case 503:
        case 504:
          return {
            error: {
              code: 'SERVICE_UNAVAILABLE',
              message: 'The service is temporarily unavailable. Please try again later.',
            },
          };
        
        default:
          return {
            error: {
              code: data?.error?.code || `HTTP_${status}`,
              message: data?.error?.message || error.message || `An error occurred (${status})`,
              details: data?.error?.details,
            },
          };
      }
    } else if (error.request) {
      // Network error - no response received
      if (error.code === 'ECONNABORTED') {
        return {
          error: {
            code: 'TIMEOUT_ERROR',
            message: 'The request timed out. Please check your connection and try again.',
          },
        };
      }
      
      return {
        error: {
          code: 'NETWORK_ERROR',
          message: 'Unable to connect to the server. Please check your internet connection.',
        },
      };
    } else {
      // Request setup error
      return {
        error: {
          code: 'REQUEST_ERROR',
          message: error.message || 'An error occurred while setting up the request.',
        },
      };
    }
  }

  // Generic HTTP methods
  async get<T>(url: string, params?: Record<string, any>): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.delete<T>(url, { data });
    return response.data;
  }

  // Utility method for handling API responses with loading states
  async withLoading<T>(
    apiCall: () => Promise<T>,
    setLoading?: (loading: boolean) => void
  ): Promise<T> {
    try {
      setLoading?.(true);
      const result = await apiCall();
      return result;
    } finally {
      setLoading?.(false);
    }
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export for testing
export { ApiClient };