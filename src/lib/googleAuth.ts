/**
 * Google OAuth Authentication Service
 * Adapted from the previous version for the new system
 */

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  emailVerified: boolean;
}

export interface GoogleAuthResponse {
  success: boolean;
  user?: any;
  error?: string;
}

class GoogleAuthService {
  private static instance: GoogleAuthService;
  private isInitialized = false;
  private clientId = '921980179970-65l8tisfd4qls4497e846eg7mbj96lhg.apps.googleusercontent.com'; // Google OAuth Client ID

  private constructor() {}

  public static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  /**
   * Initialize Google Identity Services
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

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
              this.isInitialized = true;
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
          this.isInitialized = true;
          resolve();
        } else {
          // Wait for Google to become available
          const checkGoogle = () => {
            if (window.google) {
              clearTimeout(timeout);
              this.isInitialized = true;
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

  /**
   * Initialize Google Sign-In button
   */
  public async initializeButton(buttonElement: HTMLElement, onSuccess: (user: any) => void, onError: (error: string) => void): Promise<void> {
    try {
      await this.initialize();
      
      if (!window.google) {
        throw new Error('Google Identity Services not available');
      }

      // Set up the global callback
      window.handleGoogleCredentialResponse = async (response: any) => {
        try {
          const user = await this.handleGoogleSignIn(response.credential);
          onSuccess(user);
        } catch (error) {
          console.error('Google Sign-in failed:', error);
          let errorMessage = 'Google Sign-in failed';
          
          if (error instanceof Error) {
            if (error.message.includes('Invalid') || error.message.includes('401')) {
              errorMessage = 'Google authentication failed. OAuth configuration issue detected. Please use email/password login instead.';
            } else if (error.message.includes('redirect_uri_mismatch') || error.message.includes('400')) {
              errorMessage = `Google Sign-in configuration error. The current URL (${window.location.origin}) is not authorized. Please use email/password login instead.`;
            } else {
              errorMessage = error.message;
            }
          }
          
          onError(errorMessage);
        }
      };

      // Initialize Google Identity Services
      window.google.accounts.id.initialize({
        client_id: this.clientId,
        callback: window.handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
        context: 'signin',
        ux_mode: 'popup',
        use_fedcm_for_prompt: false
      });

    } catch (error) {
      console.error('Failed to initialize Google Sign-in:', error);
      throw error;
    }
  }

  /**
   * Handle Google Sign-In button click
   */
  public async handleButtonClick(onError: (error: string) => void, onSuccess?: (user: any) => void): Promise<void> {
    try {
      await this.initialize();
      
      if (!window.google) {
        throw new Error('Google Identity Services not available');
      }

      // Set up the global callback
      window.handleGoogleCredentialResponse = async (response: any) => {
        try {
          const user = await this.handleGoogleSignIn(response.credential);
          if (onSuccess) {
            onSuccess(user);
          }
        } catch (error) {
          console.error('Google Sign-in failed:', error);
          let errorMessage = 'Google Sign-in failed';
          
          if (error instanceof Error) {
            if (error.message.includes('Invalid') || error.message.includes('401')) {
              errorMessage = 'Google authentication failed. OAuth configuration issue detected. Please use email/password login instead.';
            } else if (error.message.includes('redirect_uri_mismatch') || error.message.includes('400')) {
              errorMessage = `Google Sign-in configuration error. The current URL (${window.location.origin}) is not authorized. Please use email/password login instead.`;
            } else {
              errorMessage = error.message;
            }
          }
          
          onError(errorMessage);
        }
      };

      // Initialize Google Identity Services
      window.google.accounts.id.initialize({
        client_id: this.clientId,
        callback: window.handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
        context: 'signin',
        ux_mode: 'popup',
        use_fedcm_for_prompt: false
      });

      try {
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed()) {
            this.renderGoogleButton();
          } else if (notification.isSkippedMoment()) {
            onError('Google Sign-in was cancelled. You can try again or use email/password login.');
          }
        });
      } catch (promptError) {
        this.renderGoogleButton();
      }
      
    } catch (error) {
      console.error('Google Sign-In error:', error);
      onError('Failed to initialize Google Sign-in');
    }
  }

  /**
   * Render Google button in a modal
   */
  private renderGoogleButton(): void {
    // Create a temporary container for Google button
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '50%';
    container.style.left = '50%';
    container.style.transform = 'translate(-50%, -50%)';
    container.style.zIndex = '10000';
    container.style.background = 'white';
    container.style.padding = '20px';
    container.style.borderRadius = '8px';
    container.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.border = 'none';
    closeButton.style.background = 'none';
    closeButton.style.fontSize = '20px';
    closeButton.style.cursor = 'pointer';
    closeButton.onclick = () => document.body.removeChild(container);
    
    container.appendChild(closeButton);
    document.body.appendChild(container);
    
    window.google.accounts.id.renderButton(container, {
      theme: 'outline',
      size: 'large',
      type: 'standard',
      text: 'signin_with',
      shape: 'rectangular'
    });
  }

  /**
   * Handle Google Sign-In with credential
   */
  private async handleGoogleSignIn(credential: string): Promise<any> {
    try {
      const response = await fetch('http://localhost:3000/auth/google', {
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
      
      // Return the user object with the token included
      return {
        ...data.user,
        token: data.token
      };
    } catch (error) {
      console.error('Google Sign-In error:', error);
      throw error;
    }
  }
}

// Global type declarations
declare global {
  interface Window {
    google: any;
    handleGoogleCredentialResponse: (response: any) => void;
  }
}

export const googleAuthService = GoogleAuthService.getInstance(); 