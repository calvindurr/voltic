import { apiClient } from './api';
import { Portfolio, CreatePortfolioRequest } from '../types';

export class PortfolioService {
  private basePath = '/portfolios';

  async getPortfolios(): Promise<Portfolio[]> {
    const response = await apiClient.get<any>(`${this.basePath}/`);
    // Handle paginated response from Django REST framework
    const portfolios = response.results || response;
    
    // Convert string coordinates to numbers in nested sites
    return portfolios.map((portfolio: any) => ({
      ...portfolio,
      sites: portfolio.sites.map((site: any) => ({
        ...site,
        latitude: Number(site.latitude),
        longitude: Number(site.longitude),
        capacity_mw: site.capacity_mw ? Number(site.capacity_mw) : undefined,
      })),
    }));
  }

  async getPortfolio(id: number): Promise<Portfolio> {
    const portfolio = await apiClient.get<any>(`${this.basePath}/${id}/`);
    return {
      ...portfolio,
      sites: portfolio.sites.map((site: any) => ({
        ...site,
        latitude: Number(site.latitude),
        longitude: Number(site.longitude),
        capacity_mw: site.capacity_mw ? Number(site.capacity_mw) : undefined,
      })),
    };
  }

  async createPortfolio(portfolioData: CreatePortfolioRequest): Promise<Portfolio> {
    const portfolio = await apiClient.post<any>(`${this.basePath}/`, portfolioData);
    return {
      ...portfolio,
      sites: (portfolio.sites || []).map((site: any) => ({
        ...site,
        latitude: Number(site.latitude),
        longitude: Number(site.longitude),
        capacity_mw: site.capacity_mw ? Number(site.capacity_mw) : undefined,
      })),
    };
  }

  async updatePortfolio(id: number, portfolioData: Partial<CreatePortfolioRequest>): Promise<Portfolio> {
    const portfolio = await apiClient.put<any>(`${this.basePath}/${id}/`, portfolioData);
    return {
      ...portfolio,
      sites: (portfolio.sites || []).map((site: any) => ({
        ...site,
        latitude: Number(site.latitude),
        longitude: Number(site.longitude),
        capacity_mw: site.capacity_mw ? Number(site.capacity_mw) : undefined,
      })),
    };
  }

  async deletePortfolio(id: number): Promise<void> {
    return apiClient.delete<void>(`${this.basePath}/${id}/`);
  }

  async addSiteToPortfolio(portfolioId: number, siteId: number): Promise<void> {
    return apiClient.post<void>(`${this.basePath}/${portfolioId}/add_site/`, { site_id: siteId });
  }

  async removeSiteFromPortfolio(portfolioId: number, siteId: number): Promise<void> {
    return apiClient.delete<void>(`${this.basePath}/${portfolioId}/remove_site/`, { site_id: siteId });
  }
}

export const portfolioService = new PortfolioService();