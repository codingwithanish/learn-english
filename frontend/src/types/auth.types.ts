import { BaseEntity, UserRole, UserStatus, UserPlan } from './common.types';

export interface User extends BaseEntity {
  name: string;
  email: string;
  profile_picture?: string;
  type: UserRole;
  status: UserStatus;
  plan: UserPlan;
  last_login?: string;
  preferences?: UserPreferences;
  statistics?: UserStatistics;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    reminders: boolean;
  };
  privacy: {
    profile_visibility: 'public' | 'private' | 'tutors_only';
    allow_analytics: boolean;
  };
}

export interface UserStatistics {
  total_sessions: number;
  total_words_learned: number;
  streak_days: number;
  average_score: number;
  time_spent_minutes: number;
  favorite_topics: string[];
}

export interface AuthToken {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
  refresh_token?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface OAuthProvider {
  name: string;
  client_id: string;
  authorization_url: string;
  scopes: string[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithOAuth: (provider: string, code: string, state?: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  clearError: () => void;
}

export type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; payload: Partial<User> };

// OAuth callback parameters
export interface OAuthCallbackParams {
  code: string;
  state?: string;
  error?: string;
  error_description?: string;
}