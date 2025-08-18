import api from './api';
import type { 
  SpeakSession, 
  SpeakSessionListParams,
  PaginationResponse 
} from '@/types';

const WS_BASE_URL: string = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';

interface FeedbackSubmission {
  tutor_id: string;
  student_id: string;
  speak_resource_id: string;
  feedback_text: string;
}

interface FeedbackResponse {
  id: string;
  message: string;
  created_at: string;
}

export const speakService = {
  async getSpeakResources(
    params: SpeakSessionListParams = {}
  ): Promise<PaginationResponse<SpeakSession>> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      
      const url = queryParams.toString() 
        ? `/api/speakup?${queryParams.toString()}`
        : '/api/speakup';
        
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to get speak resources');
    }
  },

  async getSpeakResource(id: string): Promise<SpeakSession> {
    try {
      const response = await api.get(`/api/speakup/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to get speak resource');
    }
  },

  createWebSocketConnection(token: string, sessionId?: string): WebSocket {
    const wsUrl = sessionId 
      ? `${WS_BASE_URL}/ws/speak?token=${token}&session_id=${sessionId}`
      : `${WS_BASE_URL}/ws/speak?token=${token}`;
    
    return new WebSocket(wsUrl);
  },

  async submitFeedback(
    tutorId: string, 
    studentId: string, 
    speakResourceId: string, 
    feedbackText: string
  ): Promise<FeedbackResponse> {
    try {
      const feedbackData: FeedbackSubmission = {
        tutor_id: tutorId,
        student_id: studentId,
        speak_resource_id: speakResourceId,
        feedback_text: feedbackText
      };

      const response = await api.post('/api/feedback', feedbackData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to submit feedback');
    }
  }
};