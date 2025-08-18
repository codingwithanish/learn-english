import api from './api';
import type { User } from '@/types';

interface OAuthData {
  code: string;
  state?: string;
}

interface AuthResponse {
  user: User;
  access_token: string;
  token_type: string;
  expires_in: number;
}

export const authService = {
  async googleAuth(authData: OAuthData): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/google', authData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Authentication failed');
    }
  },

  async instagramAuth(authData: OAuthData): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/instagram', authData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Authentication failed');
    }
  },

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }
};