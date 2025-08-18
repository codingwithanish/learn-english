import api from './api';
import type {
  ProcessTextRequest,
  ProcessTextResponse,
  SearchTextParams,
  TextResource,
  TextHistory,
  FavoriteResource,
  PaginationResponse,
  ResourceType
} from '@/types';

export const textService = {
  async processText(
    query: string, 
    context: Partial<ProcessTextRequest> = {}
  ): Promise<ProcessTextResponse> {
    try {
      const response = await api.post('/api/process-text', {
        query,
        context
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to process text');
    }
  },

  async searchResources(
    params: Partial<SearchTextParams> = {}
  ): Promise<PaginationResponse<TextResource>> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(params).forEach((key: string) => {
        const value = params[key as keyof typeof params];
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      
      const response = await api.get(`/api/search?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to search resources');
    }
  },

  async getHistory(
    params: Record<string, unknown> = {}
  ): Promise<PaginationResponse<TextHistory>> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(params).forEach((key: string) => {
        const value = params[key];
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      
      const response = await api.get(`/api/history?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to get history');
    }
  },

  async addToFavorites(
    resourceId: string, 
    resourceType: ResourceType
  ): Promise<FavoriteResource> {
    try {
      const response = await api.post('/api/favorites', {
        resource_id: resourceId,
        resource_type: resourceType
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to add to favorites');
    }
  },

  async getFavorites(): Promise<FavoriteResource[]> {
    try {
      const response = await api.get('/api/favorites');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to get favorites');
    }
  }
};