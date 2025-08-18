import { BaseEntity, User } from './common.types';
import { SpeakSession, SpeakEvaluation } from './speak.types';
import { TextResource } from './text.types';

export interface TutorProfile extends BaseEntity {
  user_id: string;
  user: User;
  specializations: string[];
  experience_years: number;
  education: string;
  certifications: string[];
  languages: string[];
  timezone: string;
  hourly_rate?: number;
  availability_schedule: AvailabilitySchedule;
  rating: number;
  total_students: number;
  total_sessions: number;
  bio: string;
  is_verified: boolean;
}

export interface AvailabilitySchedule {
  monday?: TimeSlot[];
  tuesday?: TimeSlot[];
  wednesday?: TimeSlot[];
  thursday?: TimeSlot[];
  friday?: TimeSlot[];
  saturday?: TimeSlot[];
  sunday?: TimeSlot[];
}

export interface TimeSlot {
  start_time: string; // HH:MM format
  end_time: string;   // HH:MM format
  is_available: boolean;
}

export interface StudentTutorMapping extends BaseEntity {
  student_id: string;
  tutor_id: string;
  student: User;
  tutor: TutorProfile;
  assigned_at: string;
  status: 'active' | 'inactive' | 'completed';
  notes?: string;
}

export interface StudentProgress {
  student: User;
  statistics: StudentStatistics;
  recent_sessions: SpeakSession[];
  performance_trends: PerformanceTrend[];
  recommendations: TutorRecommendation[];
  next_milestones: Milestone[];
}

export interface StudentStatistics {
  total_sessions: number;
  total_practice_time: number; // minutes
  average_scores: {
    overall: number;
    grammar: number;
    vocabulary: number;
    pronunciation: number;
    fluency: number;
    content: number;
  };
  improvement_rate: number; // percentage
  consistency_score: number;
  strengths: string[];
  areas_for_improvement: string[];
  last_session_date?: string;
  streak_days: number;
}

export interface PerformanceTrend {
  metric: 'overall' | 'grammar' | 'vocabulary' | 'pronunciation' | 'fluency' | 'content';
  data_points: TrendDataPoint[];
  trend_direction: 'improving' | 'declining' | 'stable';
  change_percentage: number;
}

export interface TrendDataPoint {
  date: string;
  score: number;
  session_count: number;
}

export interface TutorRecommendation extends BaseEntity {
  tutor_id: string;
  student_id: string;
  recommendation_type: 'resource' | 'practice' | 'focus_area' | 'general';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  resource_ids?: string[];
  resources?: TextResource[];
  is_completed: boolean;
  completion_notes?: string;
  created_by_tutor: boolean;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  target_metric: string;
  target_value: number;
  current_value: number;
  progress_percentage: number;
  estimated_completion: string;
  is_achieved: boolean;
  achieved_at?: string;
}

export interface TutorRating extends BaseEntity {
  tutor_id: string;
  student_id: string;
  session_id?: string;
  rating: number; // 1-5
  review?: string;
  categories: {
    helpfulness: number;
    clarity: number;
    patience: number;
    expertise: number;
    communication: number;
  };
  is_anonymous: boolean;
  is_verified: boolean;
}

export interface TutorFeedback extends BaseEntity {
  tutor_id: string;
  student_id: string;
  session_id: string;
  session: SpeakSession;
  feedback_type: 'detailed' | 'quick' | 'corrective';
  overall_assessment: string;
  specific_feedback: {
    grammar: string;
    vocabulary: string;
    pronunciation: string;
    fluency: string;
    content: string;
  };
  homework_assignments?: HomeworkAssignment[];
  next_session_focus?: string[];
  encouragement_notes?: string;
  is_shared_with_student: boolean;
}

export interface HomeworkAssignment {
  id: string;
  title: string;
  description: string;
  type: 'practice' | 'study' | 'research' | 'recording';
  difficulty: 'easy' | 'medium' | 'hard';
  estimated_time_minutes: number;
  due_date?: string;
  resources?: string[];
  instructions: string[];
  is_completed: boolean;
  completed_at?: string;
  student_notes?: string;
  tutor_review?: string;
}

// Dashboard and analytics types
export interface TutorDashboardData {
  active_students: number;
  pending_reviews: number;
  upcoming_sessions: number;
  weekly_sessions_completed: number;
  student_progress_alerts: ProgressAlert[];
  recent_ratings: TutorRating[];
  performance_summary: TutorPerformanceSummary;
}

export interface ProgressAlert {
  student_id: string;
  student_name: string;
  alert_type: 'improvement' | 'decline' | 'milestone' | 'inactivity';
  message: string;
  severity: 'info' | 'warning' | 'success';
  created_at: string;
  is_acknowledged: boolean;
}

export interface TutorPerformanceSummary {
  average_rating: number;
  total_reviews: number;
  response_time_hours: number;
  student_retention_rate: number;
  improvement_success_rate: number;
  session_completion_rate: number;
}

// API request/response types
export interface GetStudentsParams {
  status?: 'active' | 'inactive' | 'all';
  sort_by?: 'name' | 'progress' | 'last_session' | 'assigned_at';
  sort_order?: 'asc' | 'desc';
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CreateRecommendationRequest {
  student_id: string;
  recommendation_type: 'resource' | 'practice' | 'focus_area' | 'general';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  resource_ids?: string[];
}

export interface CreateFeedbackRequest {
  student_id: string;
  session_id: string;
  feedback_type: 'detailed' | 'quick' | 'corrective';
  overall_assessment: string;
  specific_feedback: {
    grammar: string;
    vocabulary: string;
    pronunciation: string;
    fluency: string;
    content: string;
  };
  homework_assignments?: Omit<HomeworkAssignment, 'id' | 'is_completed' | 'completed_at' | 'student_notes' | 'tutor_review'>[];
  next_session_focus?: string[];
  encouragement_notes?: string;
}