import api from './api';

export const authService = {
  async googleAuth(authData) {
    try {
      const response = await api.post('/auth/google', authData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Authentication failed');
    }
  },

  async instagramAuth(authData) {
    try {
      const response = await api.post('/auth/instagram', authData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Authentication failed');
    }
  },

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }
};