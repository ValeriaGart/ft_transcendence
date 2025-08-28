import { getApiUrl, getWebSocketUrl, API_CONFIG } from '../config/api';
import { WebSocketService } from './webSocket';
import SecureStorage from './secureStorage';

/**
 * Authentication service for managing user tokens and login state
 */
export interface User {
  id: number;
  email: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

class AuthService {
  private static instance: AuthService;
  private state: AuthState = {
    isAuthenticated: false,
    user: null,
    token: null
  };

  private listeners: Set<(state: AuthState) => void> = new Set();
  private secureStorage = SecureStorage.getInstance();
  private constructor() {
    // Initialize with stored data immediately, then verify with backend
    this.loadFromStorageSync();
    // Verify auth asynchronously
    this.verifyStoredAuth();
    // Start periodic session validation every 5 minutes
    this.startPeriodicValidation();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Load authentication state from secure storage synchronously
   */
  private loadFromStorageSync(): void {
    try {
      const token = this.secureStorage.getSecret('auth_token');
      const user = this.secureStorage.getSecret('auth_user');
      
      if (token && user) {
        this.state = {
          isAuthenticated: true,
          user,
          token
        };
        console.log('AuthService: Loaded auth state from storage');
      }
    } catch (error) {
      console.error('AuthService: Error loading from storage');
      this.clearAuth();
    }
  }
  /**
   * Verify stored authentication with backend
   */
  private async verifyStoredAuth(): Promise<void> {
    if (this.state.token) {
      const isValid = await this.verifyAuth();
      if (!isValid) {
        console.log('AuthService: Stored token is invalid, clearing auth');
        this.clearAuth();
      }
    }
  }

  /**
   * Start periodic session validation to detect expired sessions
   */
  private startPeriodicValidation(): void {
    // Check every 5 minutes (300000ms)
    setInterval(async () => {
      if (this.state.isAuthenticated && this.state.token) {
        const isValid = await this.verifyAuth();
        if (!isValid) {
          console.log('AuthService: Session expired during periodic check');
          this.clearAuth();
          this.notifyListeners();
        }
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Load authentication state from localStorage
   */
  private async loadFromStorage(): Promise<void> {
    try {
      const token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('auth_user');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        this.state = {
          isAuthenticated: true,
          user,
          token
        };
        
        // Verify token with backend
        const isValid = await this.verifyAuth();
        if (!isValid) {
          console.log('AuthService: Stored token is invalid, clearing auth');
          this.clearAuth();
        }
      }
    } catch (error) {
      console.error('Error loading auth state from storage:', error);
      this.clearAuth();
    }
  }

  /**
   * Save authentication state to secure storage
   */
  private saveToStorage(): void {
    try {
      if (this.state.token && this.state.user) {
        this.secureStorage.setSecret('auth_token', this.state.token);
        this.secureStorage.setSecret('auth_user', this.state.user);
      } else {
        this.clearStorage();
      }
    } catch (error) {
      console.error('AuthService: Error saving to storage');
    }
  }

  /**
   * Clear authentication data from secure storage
   */
  private clearStorage(): void {
    this.secureStorage.removeSecret('auth_token');
    this.secureStorage.removeSecret('auth_user');
  }

  /**
   * Register a new user
   */
  public async register(email: string, password: string): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      console.log('AuthService: Attempting registration for email:', email);
      
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.REGISTER), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password: password
        }),
      });

      console.log('AuthService: Registration response status:', response.status);
      const data = await response.json();
      console.log('AuthService: Registration response data:', data);

      if (response.ok && data.success) {
        console.log('AuthService: Registration successful - account created but not logged in');
      
        return { success: true, message: data.message };
      } else {
        console.log('AuthService: Registration failed:', data.error);
        return { success: false, error: data.error || 'Registration failed' };
      }
    } catch (error) {
      console.error('AuthService: Registration error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Login user with email and password
   */
  public async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('AuthService: Attempting login for email:', email);
      
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.LOGIN), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for session management
        body: JSON.stringify({
          email,
          password: password
        }),
      });

      console.log('AuthService: Login response status:', response.status);
      const data = await response.json();
      console.log('AuthService: Login response data:', data);

      if (response.ok && data.success) {
        // Store the user data and token
        const user = data.user;
        const token = data.token;

        console.log('AuthService: Login successful');

        this.state = {
          isAuthenticated: true,
          user,
          token
        };

        this.saveToStorage();
        this.notifyListeners();

        console.log('AuthService WebSocket: Initializing WebSocket after successful login');
        WebSocketService.getInstance().connect(getWebSocketUrl('/hello-ws'));  

        console.log('AuthService: Login complete, state updated');
        return { success: true };
      } else {
        console.log('AuthService: Login failed:', data.error);
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      console.error('AuthService: Login error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Sign up user with Google credential
   */
  public async googleSignup(googleCredential: string): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.GOOGLE_SIGNUP), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          credential: googleCredential
        }),
      });

      console.log('AuthService: Google signup response status:', response.status);
      const data = await response.json();
      console.log('AuthService: Google signup response data:', data);

      if (response.ok && data.success) {
        console.log('AuthService: Google signup successful - account created but not logged in');
        
        return { success: true, message: data.message };
      } else {
        console.log('AuthService: Google signup failed:', data.error);
        return { success: false, error: data.error || 'Google signup failed' };
      }
    } catch (error) {
      console.error('AuthService: Google signup error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Sign in user with Google credential
   */
  public async googleSignin(googleCredential: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.GOOGLE_SIGNIN), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          credential: googleCredential
        }),
      });

      console.log('AuthService: Google signin response status:', response.status);
      const data = await response.json();
      console.log('AuthService: Google signin response data:', data);

      if (response.ok && data.success) {
        const user = data.user;
        const token = data.token;

        console.log('AuthService: Google signin successful, storing user:', user);

        this.state = {
          isAuthenticated: true,
          user,
          token
        };

        this.saveToStorage();
        this.notifyListeners();

        console.log('AuthService: Initializing WebSocket after successful Google signin');
        WebSocketService.getInstance().connect(getWebSocketUrl('/hello-ws'));  

        console.log('AuthService: Google signin complete, state updated');
        return { success: true };
      } else {
        console.log('AuthService: Google signin failed:', data.error);
        return { success: false, error: data.error || 'Google signin failed' };
      }
    } catch (error) {
      console.error('AuthService: Google signin error:', error);
      return { success: false, error: 'Network error' };
    }
  }



  /**
   * Logout user
   */
  public async logout(): Promise<void> {
    try {
      // Call backend logout endpoint
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.LOGOUT), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({}), // Send empty JSON object to avoid empty body error
      });

      if (response.ok) {
        console.log('AuthService: Backend logout successful');
      } else {
        console.warn('AuthService: Backend logout failed, but clearing local state');
      }
    } catch (error) {
      console.error('AuthService: Logout error:', error);
    }

    WebSocketService.getInstance().disconnect();
    // Always clear local auth state regardless of backend response
    this.clearAuth();
    this.notifyListeners();
  }

  /**
   * Clear authentication state
   */
  private clearAuth(): void {
    this.state = {
      isAuthenticated: false,
      user: null,
      token: null
    };
    this.clearStorage();
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return this.state.isAuthenticated;
  }

  /**
   * Get current user
   */
  public getCurrentUser(): User | null {
    return this.state.user;
  }

  /**
   * Verify authentication with backend
   */
  public async verifyAuth(): Promise<boolean> {
    try {
      const token = this.getToken();
      if (!token) {
        return false;
      }

      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ME), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const responseData = await response.json();
        // Extract the user object from the response. Changed by V to fix return of specific data
        const user = responseData.user || responseData;

        console.log('AuthService: User:', user);
        // Update user data in case it changed
        this.state.user = user;
        this.saveToStorage();
        this.notifyListeners();

        // Reconnect WebSocket if verification succeeds
        console.log('AuthService Websocket: Reconnecting WebSocket after successful auth verification');
        WebSocketService.getInstance().connect(getWebSocketUrl('/hello-ws'));

        return true;
      } else {
        // Check if it's a session expiration (401 with SESSION_INVALID)
        if (response.status === 401) {
          const errorData = await response.json();
          if (errorData.error === 'SESSION_INVALID') {
            console.log('AuthService: Session expired due to inactivity');
          } else {
            console.log('AuthService: Token invalid');
          }
        }
        
        // Token is invalid, clear auth
        console.log('AuthService Websocket: Disconnecting WebSocket after failed auth verification');
        WebSocketService.getInstance().disconnect();
        this.clearAuth();
        this.notifyListeners();
        return false;
      }
    } catch (error) {
      console.error('AuthService: Auth verification error:', error);
      console.log('AuthService Websocket: Disconnecting WebSocket after auth verification error');
      WebSocketService.getInstance().disconnect();
      return false;
    }
  }

  /**
   * Get authentication token
   */
  public getToken(): string | null {
    return this.state.token;
  }

  /**
   * Get current auth state
   */
  public getAuthState(): AuthState {
    return { ...this.state };
  }

  /**
   * Get user authentication type
   */
  public async getUserAuthType(): Promise<{ success: boolean; authType?: any; error?: string }> {
    try {
      const response = await this.authenticatedFetch(getApiUrl('/users/me/auth-type'));
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, authType: data.authType };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Failed to get auth type' };
      }
    } catch (error) {
      console.error('AuthService: Get auth type error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Subscribe to auth state changes
   */
  public subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.add(listener);
    // Call immediately with current state
    listener(this.getAuthState());
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    const state = this.getAuthState();
    console.log('AuthService: Notifying listeners of state change:', state);
    console.log('AuthService: Number of listeners:', this.listeners.size);
    this.listeners.forEach(listener => listener(state));
  }

  /**
   * Add authorization header to fetch requests
   */
  public async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getToken();
    
    const headers: any = {
      ...options.headers,
    };
    
    // Only add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.warn('AuthService: No token available for request');
    }

    return fetch(url, {
      ...options,
      credentials: 'include',
      headers,
    });
  }

  /**
   * Delete current user account
   */
  public async deleteUser(): Promise<{ success: boolean; error?: string }> {
    try {
      const user = this.getCurrentUser();
      if (!user) {
        return { success: false, error: 'No user logged in' };
      }

      console.log('AuthService: Attempting to delete user:', user.id);
      
      const response = await fetch(getApiUrl(`${API_CONFIG.ENDPOINTS.USERS}/${user.id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
        },
        credentials: 'include',
      });

      console.log('AuthService: Delete user response status:', response.status);
      const data = await response.json();
      console.log('AuthService: Delete user response data:', data);

      if (response.ok && data.success) {
        console.log('AuthService: User deleted successfully');
        // Clear local auth state after successful deletion
        this.clearAuth();
        this.notifyListeners();
        return { success: true };
      } else {
        console.log('AuthService: Delete user failed:', data.error);
        return { success: false, error: data.error || 'Failed to delete user' };
      }
    } catch (error) {
      console.error('AuthService: Delete user error:', error);
      return { success: false, error: 'Network error' };
    }
  }
}

export const authService = AuthService.getInstance(); 