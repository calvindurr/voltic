// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

// Site Types
export interface Site {
  id: number;
  name: string;
  site_type: 'solar' | 'wind' | 'hydro';
  latitude: number;
  longitude: number;
  capacity_mw?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSiteRequest {
  name: string;
  site_type: 'solar' | 'wind' | 'hydro';
  latitude: number;
  longitude: number;
  capacity_mw?: number;
}

// Portfolio Types
export interface Portfolio {
  id: number;
  name: string;
  description: string;
  sites: Site[];
  created_at: string;
  updated_at: string;
}

export interface CreatePortfolioRequest {
  name: string;
  description: string;
}

// Forecast Types
export interface ForecastJob {
  id: string;
  portfolio: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface ForecastResult {
  id: number;
  job: string;
  site: number;
  forecast_datetime: string;
  predicted_generation_mwh: number;
  confidence_interval_lower?: number;
  confidence_interval_upper?: number;
  created_at: string;
}

export interface ForecastResults {
  job: ForecastJob;
  results: ForecastResult[];
}