import api from './api';
import type { 
  StudentTutorMapping,
  StudentProgress,
  TutorRecommendation,
  GetStudentsParams,
  PaginationResponse
} from '@/types';

export const tutorService = {
  async getStudents(
    params: GetStudentsParams = {}
  ): Promise<PaginationResponse<StudentTutorMapping>> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      
      const url = queryParams.toString() 
        ? `/api/tutor/students?${queryParams.toString()}`
        : '/api/tutor/students';
        
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to get students');
    }
  },

  async getStudentDetails(
    studentId: string, 
    params: Record<string, unknown> = {}
  ): Promise<StudentProgress> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      
      const url = `/api/tutor/student/${studentId}${
        queryParams.toString() ? '?' + queryParams.toString() : ''
      }`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to get student details');
    }
  },

  async getRecommendations(userId: string): Promise<TutorRecommendation[]> {
    try {
      const response = await api.get(`/api/tutor/recommendation/${userId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to get recommendations');
    }
  },

  async createRecommendation(
    recommendation: Omit<TutorRecommendation, 'id' | 'created_at' | 'updated_at'>
  ): Promise<TutorRecommendation> {
    try {
      const response = await api.post('/api/tutor/recommendation', recommendation);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to create recommendation');
    }
  },

  async updateRecommendation(
    id: string,
    updates: Partial<TutorRecommendation>
  ): Promise<TutorRecommendation> {
    try {
      const response = await api.patch(`/api/tutor/recommendation/${id}`, updates);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to update recommendation');
    }
  },

  async deleteRecommendation(id: string): Promise<{ message: string }> {
    try {
      const response = await api.delete(`/api/tutor/recommendation/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to delete recommendation');
    }
  }
};