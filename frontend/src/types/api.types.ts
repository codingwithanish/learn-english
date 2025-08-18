import { AxiosResponse, AxiosError } from 'axios';
import { ApiResponse, ApiError, LoadingState } from './common.types';

// Axios configuration
export interface ApiConfig {
  baseURL: string;
  timeout: number;
  withCredentials: boolean;
  headers: Record<string, string>;
}

// API client configuration
export interface ApiClientConfig extends ApiConfig {
  retryAttempts: number;
  retryDelay: number;
  enableLogging: boolean;
}

// Generic API hook state
export interface UseApiState<T> {
  data: T | null;
  loading: LoadingState;
  error: string | null;
  refetch: () => Promise<void>;
  mutate: (data: T) => void;
  reset: () => void;
}

// Mutation hook state
export interface UseMutationState<TData, TVariables> {
  data: TData | null;
  loading: boolean;
  error: string | null;
  mutate: (variables: TVariables) => Promise<TData>;
  reset: () => void;
}

// HTTP method types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Request configuration
export interface RequestConfig<T = unknown> {
  method: HttpMethod;
  url: string;
  data?: T;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeout?: number;
  signal?: AbortSignal;
}

// Response types
export type ApiPromise<T> = Promise<AxiosResponse<ApiResponse<T>>>;
export type ApiErrorResponse = AxiosError<ApiError>;

// Service method types
export interface ServiceMethod<TData = unknown, TVariables = unknown> {
  (variables?: TVariables, config?: RequestConfig): ApiPromise<TData>;
}

// Pagination types for API responses
export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// File upload types
export interface FileUploadConfig {
  field_name: string;
  max_size_mb: number;
  allowed_types: string[];
  upload_url: string;
}

export interface FileUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface FileUploadResponse {
  file_id: string;
  filename: string;
  url: string;
  size: number;
  mime_type: string;
}

// WebSocket types
export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnect: boolean;
  reconnect_interval: number;
  max_reconnect_attempts: number;
  heartbeat_interval?: number;
}

export interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  last_message: unknown;
  connection_count: number;
}

export interface WebSocketHook {
  state: WebSocketState;
  send: (message: unknown) => void;
  connect: () => void;
  disconnect: () => void;
  addEventListener: (event: string, handler: (data: unknown) => void) => () => void;
}

// Cache types
export interface CacheConfig {
  enabled: boolean;
  default_ttl: number; // seconds
  max_entries: number;
  clear_on_error: boolean;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

// Query parameters for various endpoints
export interface BaseQueryParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Error handling types
export interface ErrorHandlerConfig {
  show_toast: boolean;
  log_errors: boolean;
  retry_on_network_error: boolean;
  ignore_cancelled_requests: boolean;
}

export interface CustomError extends Error {
  code?: string | number;
  status?: number;
  response?: ApiErrorResponse;
  isNetworkError?: boolean;
  isCancelledRequest?: boolean;
}

// Interceptor types
export interface RequestInterceptor {
  onFulfilled?: (config: any) => any;
  onRejected?: (error: any) => any;
}

export interface ResponseInterceptor {
  onFulfilled?: (response: AxiosResponse) => AxiosResponse;
  onRejected?: (error: ApiErrorResponse) => Promise<ApiErrorResponse>;
}

// API client interface
export interface ApiClient {
  get: <T>(url: string, config?: RequestConfig) => ApiPromise<T>;
  post: <T, D = unknown>(url: string, data?: D, config?: RequestConfig) => ApiPromise<T>;
  put: <T, D = unknown>(url: string, data?: D, config?: RequestConfig) => ApiPromise<T>;
  patch: <T, D = unknown>(url: string, data?: D, config?: RequestConfig) => ApiPromise<T>;
  delete: <T>(url: string, config?: RequestConfig) => ApiPromise<T>;
  upload: (url: string, file: File, config?: RequestConfig & { onProgress?: (progress: FileUploadProgress) => void }) => ApiPromise<FileUploadResponse>;
}

// Environment-specific configuration
export interface EnvironmentConfig {
  API_URL: string;
  WS_URL: string;
  ENVIRONMENT: 'development' | 'staging' | 'production';
  DEBUG: boolean;
  VERSION: string;
}

// Feature flags
export interface FeatureFlags {
  ENABLE_DARK_MODE: boolean;
  ENABLE_ADVANCED_ANALYTICS: boolean;
  ENABLE_BETA_FEATURES: boolean;
  ENABLE_REAL_TIME_NOTIFICATIONS: boolean;
  MAX_FILE_SIZE_MB: number;
  MAX_RECORDING_DURATION_MINUTES: number;
}