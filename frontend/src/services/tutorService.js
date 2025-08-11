import api from './api';

export const tutorService = {
  async getStudents() {
    try {
      const response = await api.get('/api/tutor/students');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to get students');
    }
  },

  async getStudentDetails(studentId, params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          queryParams.append(key, params[key]);
        }
      });
      
      const url = `/api/tutor/student/${studentId}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to get student details');
    }
  },

  async getRecommendations(userId) {
    try {
      const response = await api.get(`/api/tutor/recommendation/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to get recommendations');
    }
  }
};