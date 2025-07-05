import { getApiUrl, API_CONFIG } from '../../config/api';

export interface User {
  id: number;
  email: string;
  name?: string;
  profilePicture?: string;
  emailVerified?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

let authState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null
};

let gameInProgress = false;

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

export function setGameInProgress(inProgress: boolean) {
  gameInProgress = inProgress;
}

function updateAuthState(updates: Partial<AuthState>) {
  authState = { ...authState, ...updates };
  authSubscribers.forEach(callback => callback(authState));
}

export function getAuthState(): AuthState {
  return authState;
}

export function initializeGoogleAuth(): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Google Identity Services failed to load (timeout)'));
    }, 10000); // 10 second timeout

    if (!document.querySelector('script[src*="accounts.google.com"]')) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        // Wait for Google to be available after script load
        const checkGoogle = () => {
          if (window.google) {
            clearTimeout(timeout);
            resolve();
          } else {
            setTimeout(checkGoogle, 50);
          }
        };
        checkGoogle();
      };
      script.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Failed to load Google Identity Services'));
      };
      document.head.appendChild(script);
    } else {
      if (window.google) {
        clearTimeout(timeout);
        resolve();
      } else {
        // Wait for Google to become available
        const checkGoogle = () => {
          if (window.google) {
            clearTimeout(timeout);
            resolve();
          } else {
            setTimeout(checkGoogle, 50);
          }
        };
        checkGoogle();
      }
    }
  });
}

export async function handleGoogleSignIn(credential: string) {
  updateAuthState({ isLoading: true, error: null });

  try {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.GOOGLE_AUTH), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ credential }),
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

export async function registerWithEmailPassword(email: string, password: string, name?: string) {
  updateAuthState({ isLoading: true, error: null });
  
  try {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.REGISTER), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password, name }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
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
      error: error instanceof Error ? error.message : 'Registration failed'
    });
    throw error;
  }
}

export async function loginWithEmailPassword(email: string, password: string) {
  updateAuthState({ isLoading: true, error: null });
  
  try {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.LOGIN), {
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

export async function verifyAuthToken() {
  // Skip verification if game is in progress to prevent interruptions
  if (gameInProgress) {
    return authState.user;
  }
  
  updateAuthState({ isLoading: true });
  
  try {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.VERIFY), {
      method: 'GET',
      credentials: 'include',
    });
    
    const data = await response.json();
    
    if (!response.ok) {
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
    console.error('❌ Token verification failed:', error);
    if (!gameInProgress) {
      updateAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    } else {
      console.log('🎮 Game in progress, not logging out due to verification failure');
      updateAuthState({
        isLoading: false,
        error: null
      });
    }
    return null;
  }
}

export async function logout() {
  console.log('🚪 LOGOUT CALLED!');
  console.log('📍 Called from:', new Error().stack?.split('\n')[2]?.trim());
  console.log('🎮 Game in progress:', gameInProgress);
  
  try {
    await fetch(getApiUrl(API_CONFIG.ENDPOINTS.LOGOUT), {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.error('Logout request failed:', error);
  }
  
  setGameInProgress(false);
  
  updateAuthState({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
  });
}

export async function getCurrentUser() {
  try {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ME), {
      method: 'GET',
      credentials: 'include',
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get user information');
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

export async function initializeAuth() {
  try {
    await verifyAuthToken();
  } catch (error) {
    console.log('No existing authentication found');
  }
}

initializeAuth();
