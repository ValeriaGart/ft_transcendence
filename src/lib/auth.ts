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

  private constructor() {
    // Initialize with stored data immediately, then verify with backend
    this.loadFromStorageSync();
    // Verify auth asynchronously
    this.verifyStoredAuth();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Load authentication state from localStorage synchronously
   */
  private loadFromStorageSync(): void {
    try {
      const token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('auth_user');
      
      console.log('AuthService: Loading from storage - token:', token ? 'exists' : 'none', 'user:', userStr ? 'exists' : 'none');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        this.state = {
          isAuthenticated: true,
          user,
          token
        };
        console.log('AuthService: Loaded auth state from storage:', this.state);
      } else {
        console.log('AuthService: No stored auth data found');
      }
    } catch (error) {
      console.error('Error loading auth state from storage:', error);
      this.clearAuth();
    }
  }

  /**
   * Verify stored authentication with backend
   */
  private async verifyStoredAuth(): Promise<void> {
    // Temporarily disabled to fix loading issue
    console.log('AuthService: Token verification temporarily disabled');
    return;
    
    /*
    if (this.state.token) {
      const isValid = await this.verifyAuth();
      if (!isValid) {
        console.log('AuthService: Stored token is invalid, clearing auth');
        this.clearAuth();
      }
    }
    */
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
   * Save authentication state to localStorage
   */
  private saveToStorage(): void {
    try {
      if (this.state.token && this.state.user) {
        localStorage.setItem('auth_token', this.state.token);
        localStorage.setItem('auth_user', JSON.stringify(this.state.user));
      } else {
        this.clearStorage();
      }
    } catch (error) {
      console.error('Error saving auth state to storage:', error);
    }
  }

  /**
   * Clear authentication data from localStorage
   */
  private clearStorage(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }

  /**
   * Register a new user
   */
  public async register(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('AuthService: Attempting registration for email:', email);
      
      const response = await fetch('http://localhost:3000/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          passwordString: password
        }),
      });

      console.log('AuthService: Registration response status:', response.status);
      const data = await response.json();
      console.log('AuthService: Registration response data:', data);

      if (response.ok && data.success) {
        console.log('AuthService: Registration successful');
        return { success: true };
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
      
      const response = await fetch('http://localhost:3000/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for session management
        body: JSON.stringify({
          email,
          passwordString: password
        }),
      });

      console.log('AuthService: Login response status:', response.status);
      const data = await response.json();
      console.log('AuthService: Login response data:', data);

      if (response.ok && data.success) {
        // Store the user data and token
        const user = data.user;
        const token = data.token;

        console.log('AuthService: Login successful, storing user:', user);
        console.log('AuthService: Token:', token);

        this.state = {
          isAuthenticated: true,
          user,
          token
        };

        this.saveToStorage();
        this.notifyListeners();
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
   * Logout user
   */
  public async logout(): Promise<void> {
    try {
      // Call backend logout endpoint
      const response = await fetch('http://localhost:3000/users/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        console.log('AuthService: Backend logout successful');
      } else {
        console.warn('AuthService: Backend logout failed, but clearing local state');
      }
    } catch (error) {
      console.error('AuthService: Logout error:', error);
    }

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

      const response = await fetch('http://localhost:3000/users/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const user = await response.json();
        // Update user data in case it changed
        this.state.user = user;
        this.saveToStorage();
        this.notifyListeners();
        return true;
      } else {
        // Token is invalid, clear auth
        this.clearAuth();
        this.notifyListeners();
        return false;
      }
    } catch (error) {
      console.error('AuthService: Auth verification error:', error);
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
    const headers = {
      ...options.headers,
      'Authorization': token ? `Bearer ${token}` : '',
    };

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
      
      const response = await fetch(`http://localhost:3000/users/${user.id}`, {
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