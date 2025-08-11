import api from './api';

export const textService = {
  async processText(query, context = {}) {
    try {
      const response = await api.post('/api/process-text', {
        query,
        context
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to process text');
    }
  },

  async searchResources(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          queryParams.append(key, params[key]);
        }
      });
      
      const response = await api.get(`/api/search?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to search resources');
    }
  },

  async getHistory(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          queryParams.append(key, params[key]);
        }
      });
      
      const response = await api.get(`/api/history?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to get history');
    }
  },

  async addToFavorites(resourceId, resourceType) {
    try {
      const response = await api.post('/api/favorites', {
        resource_id: resourceId,
        resource_type: resourceType
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to add to favorites');
    }
  },

  async getFavorites() {
    try {
      const response = await api.get('/api/favorites');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to get favorites');
    }
  }
};