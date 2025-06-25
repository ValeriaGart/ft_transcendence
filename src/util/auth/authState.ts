/**
 * Authentication State Management
 * Handles user authentication state and Google Sign-in integration
 */

import { useState } from '../state/state';
import { atom, useAtom } from 'jotai';
import { AUTH_CONFIG } from '../../config/auth';

export interface User {
  id: number;
  email: string;
  name?: string;
  profilePictureUrl?: string;
}


export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Global authentication state
let authState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null
};

// Subscribers to auth state changes
const authSubscribers: ((state: AuthState) => void)[] = [];

export function subscribeToAuth(callback: (state: AuthState) => void) {
  authSubscribers.push(callback);
  return () => {
    const index = authSubscribers.indexOf(callback);
    if (index > -1) {
      authSubscribers.splice(index, 1);
    }
  };
}

/**
 * Update authentication state and notify subscribers
 */
function updateAuthState(updates: Partial<AuthState>) {
  authState = { ...authState, ...updates };
  authSubscribers.forEach(callback => callback(authState));
}

/**
 * Get current authentication state
 */
export function getAuthState(): AuthState {
  return authState;
}

export function initializeGoogleAuth(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Load Google Identity Services script
    if (!document.querySelector('script[src*="accounts.google.com"]')) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    } else {
      resolve();
    }
  });
}

/**
 * Handle Google Sign-in response
 */
export async function handleGoogleSignIn(credential: string) {
  updateAuthState({ isLoading: true, error: null });

  try {
      const response = await fetch(`${AUTH_CONFIG.BACKEND_URL}${AUTH_CONFIG.ENDPOINTS.GOOGLE_AUTH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ idToken: credential }),
      });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Authentication failed');
    }
    
    updateAuthState({
      user: data.user,
      isAuthenticated: true,
      isLoading: false,
      error: null
    });
    
    // Token is stored securely in httpOnly cookies by the server
    // No need to store it in localStorage
    
    return data.user;
  } catch (error) {
    updateAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    });
    throw error;
  }
}

/**
 * Traditional email/password login
 */
export async function loginWithEmailPassword(email: string, password: string) {
  updateAuthState({ isLoading: true, error: null });
  
  try {
    const response = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }
    
    updateAuthState({
      user: data.user,
      isAuthenticated: true,
      isLoading: false,
      error: null
    });
    
    // Store token in localStorage as backup
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
    }
    
    return data.user;
  } catch (error) {
    updateAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: error instanceof Error ? error.message : 'Login failed'
    });
    throw error;
  }
}

/**
 * Verify current authentication status
 */
export async function verifyAuthToken() {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    updateAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
    return null;
  }
  
  updateAuthState({ isLoading: true });
  
  try {
    const response = await fetch('http://localhost:3000/auth/verify', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      localStorage.removeItem('auth_token');
      throw new Error(data.error || 'Token verification failed');
    }
    
    updateAuthState({
      user: data.user,
      isAuthenticated: true,
      isLoading: false,
      error: null
    });
    
    return data.user;
  } catch (error) {
    updateAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
    return null;
  }
}

/**
 * Logout user
 */
export async function logout() {
  try {
    await fetch('http://localhost:3000/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.error('Logout request failed:', error);
  }
  
  localStorage.removeItem('auth_token');
  updateAuthState({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
  });
}

/**
 * Hook for using authentication state in components
 */
export function useAuth() {
  const [state, setState] = useState(authState);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Manage subscription lifecycle with useEffect
  useEffect(() => {
    unsubscribeRef.current = subscribeToAuth(setState);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);

  return {
    ...state,
    signInWithGoogle: handleGoogleSignIn,
    loginWithEmailPassword,
    logout,
    verifyAuth: verifyAuthToken,
  };
}
