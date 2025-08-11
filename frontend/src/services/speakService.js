import api from './api';

const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';

export const speakService = {
  async getSpeakResources() {
    try {
      const response = await api.get('/api/speakup');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to get speak resources');
    }
  },

  async getSpeakResource(id) {
    try {
      const response = await api.get(`/api/speakup/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to get speak resource');
    }
  },

  createWebSocketConnection(token, sessionId = null) {
    const wsUrl = sessionId 
      ? `${WS_BASE_URL}/ws/speak?token=${token}&session_id=${sessionId}`
      : `${WS_BASE_URL}/ws/speak?token=${token}`;
    
    return new WebSocket(wsUrl);
  },

  async submitFeedback(tutorId, studentId, speakResourceId, feedbackText) {
    try {
      const response = await api.post('/api/feedback', {
        tutor_id: tutorId,
        student_id: studentId,
        speak_resource_id: speakResourceId,
        feedback_text: feedbackText
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to submit feedback');
    }
  }
};