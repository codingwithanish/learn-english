// Common utility types and enums used throughout the application

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginationResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface SearchParams extends PaginationParams {
  query?: string;
  filters?: Record<string, unknown>;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success: boolean;
  timestamp: string;
}

export interface ApiError {
  error: string;
  message: string;
  status_code: number;
  timestamp: string;
  details?: Record<string, unknown>;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T = unknown> {
  data: T | null;
  loading: LoadingState;
  error: string | null;
}

export type UserRole = 'STUDENT' | 'TUTOR' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';
export type UserPlan = 'FREE' | 'PREMIUM' | 'ENTERPRISE';

export enum ResourceType {
  VOCABULARY = 'vocabulary',
  PHRASE = 'phrase',
  GRAMMAR = 'grammar'
}

export enum SpeakType {
  FREE_SPEAK = 'free_speak',
  VOCABULARY_PRACTICE = 'vocabulary_practice',
  PRONUNCIATION_DRILL = 'pronunciation_drill',
  CONVERSATION_PRACTICE = 'conversation_practice'
}

export enum SessionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export type Theme = 'light' | 'dark' | 'system';

export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}