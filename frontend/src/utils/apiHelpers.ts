/**
 * API helper utilities
 */
import type { AxiosError } from 'axios';
import type { ApiError } from '@/types';

/**
 * Extract error message from API error response
 */
export const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  // Handle Axios error
  const axiosError = error as AxiosError<ApiError>;
  if (axiosError.response?.data?.message) {
    return axiosError.response.data.message;
  }
  
  if (axiosError.response?.data?.error) {
    return axiosError.response.data.error;
  }
  
  if (axiosError.message) {
    return axiosError.message;
  }
  
  return 'An unexpected error occurred';
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: AxiosError): boolean => {
  return !error.response && error.code === 'NETWORK_ERROR';
};

/**
 * Check if error is a timeout error
 */
export const isTimeoutError = (error: AxiosError): boolean => {
  return error.code === 'ECONNABORTED' || error.message.includes('timeout');
};

/**
 * Check if error is an authentication error
 */
export const isAuthError = (error: AxiosError): boolean => {
  return error.response?.status === 401;
};

/**
 * Check if error is a permission error
 */
export const isPermissionError = (error: AxiosError): boolean => {
  return error.response?.status === 403;
};

/**
 * Check if error is a not found error
 */
export const isNotFoundError = (error: AxiosError): boolean => {
  return error.response?.status === 404;
};

/**
 * Check if error is a server error
 */
export const isServerError = (error: AxiosError): boolean => {
  const status = error.response?.status;
  return status ? status >= 500 : false;
};

/**
 * Build query string from parameters object
 */
export const buildQueryString = (params: Record<string, unknown>): string => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((item) => {
          queryParams.append(key, String(item));
        });
      } else {
        queryParams.append(key, String(value));
      }
    }
  });
  
  return queryParams.toString();
};

/**
 * Create a delay function for testing or rate limiting
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxAttempts) {
        break;
      }
      
      // Don't retry on authentication or permission errors
      const axiosError = error as AxiosError;
      if (isAuthError(axiosError) || isPermissionError(axiosError)) {
        break;
      }
      
      const delayMs = baseDelay * Math.pow(2, attempt - 1);
      await delay(delayMs);
    }
  }
  
  throw lastError!;
};

/**
 * Create an AbortController with timeout
 */
export const createTimeoutController = (timeoutMs: number): AbortController => {
  const controller = new AbortController();
  
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);
  
  // Clear timeout if request completes before timeout
  const originalAbort = controller.abort.bind(controller);
  controller.abort = () => {
    clearTimeout(timeoutId);
    originalAbort();
  };
  
  return controller;
};

/**
 * Handle file download from API response
 */
export const downloadFile = (
  blob: Blob,
  filename: string,
  mimeType?: string
): void => {
  const url = window.URL.createObjectURL(
    new Blob([blob], { type: mimeType || blob.type })
  );
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Convert FormData to plain object (for debugging)
 */
export const formDataToObject = (formData: FormData): Record<string, unknown> => {
  const obj: Record<string, unknown> = {};
  
  formData.forEach((value, key) => {
    if (obj[key]) {
      // Convert to array if multiple values
      if (Array.isArray(obj[key])) {
        (obj[key] as unknown[]).push(value);
      } else {
        obj[key] = [obj[key], value];
      }
    } else {
      obj[key] = value;
    }
  });
  
  return obj;
};

/**
 * Deep merge objects (for config merging)
 */
export const deepMerge = <T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>
): T => {
  const result = { ...target };
  
  Object.keys(source).forEach((key) => {
    const targetValue = result[key];
    const sourceValue = source[key];
    
    if (
      typeof targetValue === 'object' &&
      targetValue !== null &&
      !Array.isArray(targetValue) &&
      typeof sourceValue === 'object' &&
      sourceValue !== null &&
      !Array.isArray(sourceValue)
    ) {
      result[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      ) as T[typeof key];
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue;
    }
  });
  
  return result;
};