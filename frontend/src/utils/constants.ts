import type { SelectOption, UserRole } from '@/types';

// Application constants
export const APP_CONFIG = {
  NAME: 'Learn English',
  VERSION: '1.0.0',
  API_TIMEOUT: 30000,
  DEBOUNCE_DELAY: 300,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_AUDIO_FORMATS: ['audio/webm', 'audio/mp4', 'audio/wav', 'audio/mpeg'],
  MAX_RECORDING_DURATION: 300, // 5 minutes in seconds
} as const;

// User roles
export const USER_ROLES: Record<UserRole, string> = {
  STUDENT: 'Student',
  TUTOR: 'Tutor',
  ADMIN: 'Administrator',
} as const;

// Resource types
export const RESOURCE_TYPES = {
  VOCABULARY: 'vocabulary',
  PHRASE: 'phrase', 
  GRAMMAR: 'grammar',
} as const;

// Speak session types
export const SPEAK_TYPES = {
  FREE_SPEAK: 'free_speak',
  VOCABULARY_PRACTICE: 'vocabulary_practice',
  PRONUNCIATION_DRILL: 'pronunciation_drill',
  CONVERSATION_PRACTICE: 'conversation_practice',
} as const;

// Status options
export const STATUS_OPTIONS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

// Difficulty levels
export const DIFFICULTY_LEVELS: SelectOption<number>[] = [
  { value: 1, label: 'Beginner' },
  { value: 2, label: 'Elementary' },
  { value: 3, label: 'Intermediate' },
  { value: 4, label: 'Upper Intermediate' },
  { value: 5, label: 'Advanced' },
];

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  AUTH_USER: 'auth_user',
  THEME: 'theme',
  LANGUAGE: 'language',
  PREFERENCES: 'user_preferences',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    GOOGLE: '/auth/google',
    INSTAGRAM: '/auth/instagram',
    CALLBACK: '/auth/callback',
  },
  TEXT: {
    PROCESS: '/api/process-text',
    SEARCH: '/api/search',
    HISTORY: '/api/history',
    FAVORITES: '/api/favorites',
  },
  SPEAK: {
    SESSIONS: '/api/speakup',
    WEBSOCKET: '/ws/speak',
  },
  TUTOR: {
    STUDENTS: '/api/tutor/students',
    STUDENT_DETAIL: '/api/tutor/student',
    RECOMMENDATIONS: '/api/tutor/recommendations',
    FEEDBACK: '/api/tutor/feedback',
  },
  USER: {
    PROFILE: '/api/user/profile',
    PREFERENCES: '/api/user/preferences',
  },
} as const;

// WebSocket events
export const WS_EVENTS = {
  // Outgoing events
  START: 'start',
  AUDIO: 'audio', 
  STOP: 'stop',
  
  // Incoming events
  ACK: 'ack',
  INTERIM: 'interim',
  PROCESSING: 'processing',
  FINAL: 'final',
  ERROR: 'error',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. Insufficient permissions.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
} as const;

// Success messages  
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in!',
  LOGOUT_SUCCESS: 'Successfully logged out!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  FAVORITE_ADDED: 'Added to favorites!',
  FAVORITE_REMOVED: 'Removed from favorites!',
  SESSION_COMPLETED: 'Speaking session completed!',
  FEEDBACK_SUBMITTED: 'Feedback submitted successfully!',
} as const;

// Theme colors (for Tailwind CSS)
export const THEME_COLORS = {
  PRIMARY: {
    50: '#eff6ff',
    100: '#dbeafe', 
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  SUCCESS: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
  },
  ERROR: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
  },
  WARNING: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
  },
} as const;