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
    this.loadFromStorage();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Load authentication state from localStorage
   */
  private loadFromStorage(): void {
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
   * Login user with email and password
   */
  public async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('AuthService: Attempting login for email:', email);
      
      // TEMPORARY: Mock login for frontend development
      // Remove this when backend is ready
      console.log('AuthService: Using mock login (backend not ready yet)');
      
      // Mock successful login
      const mockUser = {
        id: 1,
        email: email
      };
      const mockToken = 'mock-token-' + Date.now();

      console.log('AuthService: Mock login successful, storing user:', mockUser);
      console.log('AuthService: Mock token:', mockToken);

      this.state = {
        isAuthenticated: true,
        user: mockUser,
        token: mockToken
      };

      this.saveToStorage();
      this.notifyListeners();
      console.log('AuthService: Mock login complete, state updated');
      return { success: true };

      // TODO: Uncomment this when backend is ready
      /*
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          passwordString: password
        }),
      });

      console.log('AuthService: Login response status:', response.status);
      const data = await response.json();
      console.log('AuthService: Login response data:', data);

      if (response.ok && data.success) {
        // Store the user data (token might be in data.user or data.token)
        const user = data.user;
        const token = data.token || data.user?.token || 'dummy-token'; // Adjust based on your API response

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
      */
    } catch (error) {
      console.error('AuthService: Login error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Logout user
   */
  public logout(): void {
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
      headers,
    });
  }
}

export const authService = AuthService.getInstance(); 