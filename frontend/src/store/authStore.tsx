import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth';
import type { User, AuthState, AuthAction, AuthContextValue } from '@/types';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  error: null
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, loading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null
      };
    case 'AUTH_CLEAR_ERROR':
      return { ...state, error: null };
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null
      };
    default:
      return state;
  }
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Check for existing token on app load
    const initializeAuth = (): void => {
      const token = localStorage.getItem('auth_token');
      const user = localStorage.getItem('auth_user');
      
      if (token && user) {
        try {
          const parsedUser: User = JSON.parse(user);
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user: parsedUser, token }
          });
        } catch (error) {
          console.error('Failed to parse stored user data:', error);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      } else {
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: any): Promise<void> => {
    dispatch({ type: 'AUTH_START' });
    
    try {
      // If credentials contains access_token and user, it's from OAuth callback
      if (credentials.access_token && credentials.user) {
        // Store in localStorage
        localStorage.setItem('auth_token', credentials.access_token);
        localStorage.setItem('auth_user', JSON.stringify(credentials.user));
        
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: credentials.user, token: credentials.access_token }
        });
        
        return;
      }
      
      // Otherwise, make API call (for other login methods)
      const response = await authService.googleAuth(credentials);
      
      // Store in localStorage
      localStorage.setItem('auth_token', response.access_token);
      localStorage.setItem('auth_user', JSON.stringify(response.user));
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: response.user, token: response.access_token }
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Authentication failed';
      dispatch({
        type: 'AUTH_ERROR',
        payload: errorMessage
      });
      throw new Error(errorMessage);
    }
  };

  const loginWithOAuth = async (provider: string, code: string, state?: string): Promise<void> => {
    dispatch({ type: 'AUTH_START' });
    
    try {
      let response;
      
      if (provider === 'google') {
        response = await authService.googleAuth({ code, state });
      } else if (provider === 'instagram') {
        response = await authService.instagramAuth({ code, state });
      } else {
        throw new Error(`Unsupported OAuth provider: ${provider}`);
      }
      
      // Store in localStorage
      localStorage.setItem('auth_token', response.access_token);
      localStorage.setItem('auth_user', JSON.stringify(response.user));
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: response.user, token: response.access_token }
      });
    } catch (error: any) {
      const errorMessage = error.message || 'OAuth authentication failed';
      dispatch({
        type: 'AUTH_ERROR',
        payload: errorMessage
      });
      throw new Error(errorMessage);
    }
  };

  const logout = (): void => {
    authService.logout();
    dispatch({ type: 'AUTH_LOGOUT' });
  };

  const refreshToken = async (): Promise<void> => {
    // TODO: Implement token refresh logic when backend supports it
    console.warn('Token refresh not implemented yet');
  };

  const updateUser = async (userData: Partial<User>): Promise<void> => {
    try {
      // Update user data in localStorage
      const currentUser = state.user;
      if (currentUser) {
        const updatedUser = { ...currentUser, ...userData };
        localStorage.setItem('auth_user', JSON.stringify(updatedUser));
        dispatch({
          type: 'UPDATE_USER',
          payload: userData
        });
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  };

  const clearError = (): void => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' });
  };

  const contextValue: AuthContextValue = {
    ...state,
    login,
    loginWithOAuth,
    logout,
    refreshToken,
    updateUser,
    clearError
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};