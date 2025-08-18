/**
 * Validation utility functions
 */

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate URL format
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate file type
 */
export const isValidFileType = (
  file: File,
  allowedTypes: string[]
): boolean => {
  return allowedTypes.includes(file.type);
};

/**
 * Validate file size
 */
export const isValidFileSize = (
  file: File,
  maxSizeInBytes: number
): boolean => {
  return file.size <= maxSizeInBytes;
};

/**
 * Validate text length
 */
export const validateTextLength = (
  text: string,
  minLength: number = 0,
  maxLength: number = Infinity
): {
  isValid: boolean;
  error?: string;
} => {
  if (text.length < minLength) {
    return {
      isValid: false,
      error: `Text must be at least ${minLength} characters long`,
    };
  }
  
  if (text.length > maxLength) {
    return {
      isValid: false,
      error: `Text must be no more than ${maxLength} characters long`,
    };
  }
  
  return { isValid: true };
};

/**
 * Validate required fields in an object
 */
export const validateRequiredFields = <T extends Record<string, unknown>>(
  data: T,
  requiredFields: (keyof T)[]
): {
  isValid: boolean;
  missingFields: string[];
} => {
  const missingFields = requiredFields.filter(field => {
    const value = data[field];
    return value === null || value === undefined || value === '';
  }).map(field => String(field));
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
};

/**
 * Validate phone number (basic validation)
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[+]?[1-9]\\d{1,14}$/;
  const cleanPhone = phone.replace(/[\\s-()]/g, '');
  return phoneRegex.test(cleanPhone);
};

/**
 * Validate age range
 */
export const isValidAge = (age: number, minAge: number = 0, maxAge: number = 150): boolean => {
  return age >= minAge && age <= maxAge;
};

/**
 * Validate rating value
 */
export const isValidRating = (rating: number, minRating: number = 1, maxRating: number = 5): boolean => {
  return rating >= minRating && rating <= maxRating;
};

/**
 * Sanitize text input (remove potentially dangerous characters)
 */
export const sanitizeText = (text: string): string => {
  return text
    .replace(/[<>\"'&]/g, '') // Remove HTML/XML special characters
    .replace(/\\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
};

/**
 * Validate search query
 */
export const validateSearchQuery = (query: string): {
  isValid: boolean;
  error?: string;
} => {
  const trimmed = query.trim();
  
  if (trimmed.length === 0) {
    return {
      isValid: false,
      error: 'Search query cannot be empty',
    };
  }
  
  if (trimmed.length < 2) {
    return {
      isValid: false,
      error: 'Search query must be at least 2 characters long',
    };
  }
  
  if (trimmed.length > 200) {
    return {
      isValid: false,
      error: 'Search query must be less than 200 characters',
    };
  }
  
  return { isValid: true };
};

/**
 * Validate recording duration
 */
export const isValidRecordingDuration = (
  duration: number,
  minDuration: number = 1,
  maxDuration: number = 300
): boolean => {
  return duration >= minDuration && duration <= maxDuration;
};

/**
 * Check if string contains only alphanumeric characters and spaces
 */
export const isAlphanumericWithSpaces = (text: string): boolean => {
  const alphanumericRegex = /^[a-zA-Z0-9\\s]+$/;
  return alphanumericRegex.test(text);
};

/**
 * Validate UUID format
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};