import { apiClient } from './api';
import { ForecastJob, ForecastResults, ForecastResult } from '../types';

export class ForecastService {
  private basePath = '/forecasts';

  async triggerPortfolioForecast(portfolioId: number): Promise<ForecastJob> {
    return apiClient.post<ForecastJob>(`${this.basePath}/portfolio/${portfolioId}/trigger/`);
  }

  async getForecastJobStatus(jobId: string): Promise<ForecastJob> {
    return apiClient.get<ForecastJob>(`${this.basePath}/jobs/${jobId}/status/`);
  }

  async getPortfolioForecastResults(portfolioId: number): Promise<ForecastResults> {
    const response = await apiClient.get<any>(`${this.basePath}/portfolio/${portfolioId}/results/`);
    
    // Transform the API response to match the expected ForecastResults interface
    const results: ForecastResult[] = [];
    
    // Flatten site forecasts into individual results
    if (response.site_forecasts) {
      response.site_forecasts.forEach((siteForecast: any) => {
        siteForecast.forecasts.forEach((forecast: any, index: number) => {
          results.push({
            id: results.length,
            job: response.job_id || '',
            site: siteForecast.site_id,
            forecast_datetime: forecast.datetime,
            predicted_generation_mwh: forecast.predicted_generation_mwh,
            confidence_interval_lower: forecast.confidence_interval_lower,
            confidence_interval_upper: forecast.confidence_interval_upper,
            created_at: response.forecast_generated_at || new Date().toISOString(),
          });
        });
      });
    }
    
    return {
      job: {
        id: response.job_id || '',
        portfolio: portfolioId,
        status: 'completed',
        created_at: response.forecast_generated_at || new Date().toISOString(),
      },
      results,
    };
  }

  async getSiteForecastResults(siteId: number): Promise<ForecastResults> {
    const response = await apiClient.get<any>(`${this.basePath}/site/${siteId}/results/`);
    
    // Transform the API response to match the expected ForecastResults interface
    const results: ForecastResult[] = [];
    
    // Handle site-specific forecast response
    if (response.forecasts) {
      response.forecasts.forEach((forecast: any, index: number) => {
        results.push({
          id: index,
          job: response.job_id || '',
          site: siteId,
          forecast_datetime: forecast.datetime,
          predicted_generation_mwh: forecast.predicted_generation_mwh,
          confidence_interval_lower: forecast.confidence_interval_lower,
          confidence_interval_upper: forecast.confidence_interval_upper,
          created_at: response.forecast_generated_at || new Date().toISOString(),
        });
      });
    }
    
    return {
      job: {
        id: response.job_id || '',
        portfolio: 0, // Site-specific, no portfolio
        status: 'completed',
        created_at: response.forecast_generated_at || new Date().toISOString(),
      },
      results,
    };
  }
}

export const forecastService = new ForecastService();