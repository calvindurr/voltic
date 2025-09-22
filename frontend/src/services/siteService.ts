import { apiClient } from './api';
import { Site, CreateSiteRequest } from '../types';

export class SiteService {
  private basePath = '/sites';

  async getSites(): Promise<Site[]> {
    const response = await apiClient.get<any>(`${this.basePath}/`);
    // Handle paginated response from Django REST framework
    const sites = response.results || response;
    
    // Convert string coordinates to numbers to match the Site interface
    return sites.map((site: any) => ({
      ...site,
      latitude: Number(site.latitude),
      longitude: Number(site.longitude),
      capacity_mw: site.capacity_mw ? Number(site.capacity_mw) : undefined,
    }));
  }

  async getSite(id: number): Promise<Site> {
    const site = await apiClient.get<any>(`${this.basePath}/${id}/`);
    return {
      ...site,
      latitude: Number(site.latitude),
      longitude: Number(site.longitude),
      capacity_mw: site.capacity_mw ? Number(site.capacity_mw) : undefined,
    };
  }

  async createSite(siteData: CreateSiteRequest): Promise<Site> {
    const site = await apiClient.post<any>(`${this.basePath}/`, siteData);
    return {
      ...site,
      latitude: Number(site.latitude),
      longitude: Number(site.longitude),
      capacity_mw: site.capacity_mw ? Number(site.capacity_mw) : undefined,
    };
  }

  async updateSite(id: number, siteData: Partial<CreateSiteRequest>): Promise<Site> {
    const site = await apiClient.put<any>(`${this.basePath}/${id}/`, siteData);
    return {
      ...site,
      latitude: Number(site.latitude),
      longitude: Number(site.longitude),
      capacity_mw: site.capacity_mw ? Number(site.capacity_mw) : undefined,
    };
  }

  async deleteSite(id: number): Promise<void> {
    return apiClient.delete<void>(`${this.basePath}/${id}/`);
  }
}

export const siteService = new SiteService();